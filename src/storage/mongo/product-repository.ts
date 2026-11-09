import {
  MongoServerError,
  ObjectId,
  type Collection,
  type Db,
  type WithId,
} from "mongodb";
import {
  SlugTakenError,
  type NewProduct,
  type Product,
  type ProductChanges,
  type ProductRepository,
} from "@/domain/ports/product-repository";
import { memoizeUntilSuccess } from "@/shared/memoize-until-success";

export const PRODUCTS_COLLECTION = "products";
const DUPLICATE_KEY_ERROR = 11000;

type ProductDoc = NewProduct;

function toProduct({ _id, ...rest }: WithId<ProductDoc>): Product {
  return { id: _id.toHexString(), ...rest };
}

/** Malformed ids can't match any product, so they map to "not found". */
function toObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) && /^[0-9a-f]{24}$/i.test(id)
    ? new ObjectId(id)
    : null;
}

export class MongoProductRepository implements ProductRepository {
  // Index setup runs once per instance; a failure is retried next call.
  private readonly collection = memoizeUntilSuccess(() => this.init());

  constructor(private readonly getDb: () => Promise<Db>) {}

  private async init(): Promise<Collection<ProductDoc>> {
    const collection = (await this.getDb()).collection<ProductDoc>(
      PRODUCTS_COLLECTION,
    );
    await Promise.all([
      collection.createIndex({ slug: 1 }, { unique: true }),
      collection.createIndex({ active: 1, createdAt: -1 }),
    ]);
    return collection;
  }

  async insert(product: NewProduct): Promise<Product> {
    const collection = await this.collection();
    try {
      const { insertedId } = await collection.insertOne({ ...product });
      return { id: insertedId.toHexString(), ...product };
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.code === DUPLICATE_KEY_ERROR
      ) {
        throw new SlugTakenError(product.slug);
      }
      throw error;
    }
  }

  async update(id: string, changes: ProductChanges): Promise<Product | null> {
    const _id = toObjectId(id);
    if (!_id) return null;
    const doc = await (
      await this.collection()
    ).findOneAndUpdate({ _id }, { $set: changes }, { returnDocument: "after" });
    return doc ? toProduct(doc) : null;
  }

  async findById(id: string): Promise<Product | null> {
    const _id = toObjectId(id);
    if (!_id) return null;
    const doc = await (await this.collection()).findOne({ _id });
    return doc ? toProduct(doc) : null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const doc = await (await this.collection()).findOne({ slug });
    return doc ? toProduct(doc) : null;
  }

  async list({ activeOnly }: { activeOnly: boolean }): Promise<Product[]> {
    const docs = await (
      await this.collection()
    )
      .find(activeOnly ? { active: true } : {})
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(toProduct);
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await (
      await this.collection()
    ).countDocuments({ slug }, { limit: 1 });
    return count > 0;
  }
}
