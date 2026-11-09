import { getEnv } from "@/config/env";
import { getLogger } from "@/config/logger";
import { ProductService } from "@/domain/products/product-service";
import { globalSingleton } from "@/shared/global-singleton";
import { getDb } from "@/storage/mongo/client";
import { MongoProductRepository } from "@/storage/mongo/product-repository";
import { getS3Client } from "@/storage/s3/client";
import { S3ImageStorage } from "@/storage/s3/image-storage";

/** Product service wired to Mongo and the public S3 bucket. Server-only. */
export function getProductService(): ProductService {
  return globalSingleton("product-service", () => {
    const env = getEnv();
    return new ProductService({
      products: new MongoProductRepository(getDb),
      images: new S3ImageStorage(getS3Client(), {
        bucket: env.S3_PRODUCTS_BUCKET,
        publicBaseUrl: env.S3_PRODUCTS_PUBLIC_URL,
      }),
      logger: getLogger(),
    });
  });
}
