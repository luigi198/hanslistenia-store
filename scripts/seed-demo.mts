// Fills a LOCAL database with demo products (no photos: the store shows
// placeholders). For design work and manual testing only.
// Run: MONGODB_URI=mongodb://127.0.0.1:27122 npm run seed:demo
import { MongoClient } from "mongodb";
import {
  normalizeDraft,
  validateDraft,
  type ProductDraft,
} from "../src/domain/products/product.ts";
import { slugify } from "../src/domain/products/slug.ts";

const EXIT_USAGE = 64;
const LOCAL_URI = /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/;
const DB_NAME = process.env.MONGODB_DB ?? "hanslistenia";

const uri = process.env.MONGODB_URI ?? "";
if (!LOCAL_URI.test(uri)) {
  process.stderr.write(
    "Refusing to seed: MONGODB_URI must be a local mongodb://127.0.0.1 URI.\n",
  );
  process.exit(EXIT_USAGE);
}

const sizes = (xlExtra: number) => ({
  name: "Talla",
  values: [
    { label: "S", priceDelta: 0 },
    { label: "M", priceDelta: 0 },
    { label: "L", priceDelta: 0 },
    { label: "XL", priceDelta: xlExtra },
  ],
});

const demo: ProductDraft[] = [
  {
    name: "Camiseta Planche",
    description:
      "Algodón pesado de 220 g, corte recto y hombro caído para moverse sin límites.\n\nEstampado del atleta en plancha al frente.",
    basePrice: 14_000,
    productionNote: "Lista en 2 semanas",
    optionGroups: [
      sizes(1_500),
      {
        name: "Color",
        values: [
          { label: "Negro", priceDelta: 0 },
          { label: "Blanco", priceDelta: 0 },
        ],
      },
    ],
    images: [],
  },
  {
    name: "Hoodie Barra Fija",
    description:
      "Sudadera de felpa gruesa con capucha doble. Para las sesiones de madrugada en el parque.",
    basePrice: 28_000,
    productionNote: "Lista en 3 semanas",
    optionGroups: [sizes(2_000)],
    images: [],
  },
  {
    name: "Short Muscle-Up",
    description:
      "Tela liviana de secado rápido, cintura elástica y abertura lateral para levantar las piernas sin trabas.",
    basePrice: 16_000,
    productionNote: "Lista en 2 semanas",
    optionGroups: [sizes(0)],
    images: [],
  },
  {
    name: "Tank Front Lever",
    description: "Sisa amplia para ver el trabajo de espalda. Algodón peinado.",
    basePrice: 12_000,
    productionNote: null,
    optionGroups: [
      sizes(0),
      {
        name: "Color",
        values: [
          { label: "Negro", priceDelta: 0 },
          { label: "Gris", priceDelta: 0 },
        ],
      },
    ],
    images: [],
  },
  {
    name: "Jogger Dominadas",
    description:
      "Pantalón jogger con tobillo ajustado. Bolsillo con zíper para las llaves.",
    basePrice: 24_000,
    productionNote: "Lista en 3 semanas",
    optionGroups: [sizes(1_500)],
    images: [],
  },
  {
    name: "Gorra Disciplina",
    description:
      "Gorra de seis paneles con el lema bordado. Talla única ajustable.",
    basePrice: 10_000,
    productionNote: null,
    optionGroups: [],
    images: [],
  },
];

const client = await new MongoClient(uri).connect();
try {
  const products = client.db(DB_NAME).collection("products");
  await products.createIndex({ slug: 1 }, { unique: true });
  await products.deleteMany({});
  const start = Date.now();
  const docs = demo.map((input, i) => {
    const draft = normalizeDraft(input);
    const errors = validateDraft(draft);
    if (errors.length)
      throw new Error(`${input.name}: ${JSON.stringify(errors)}`);
    // Newest first in the catalog = the order listed above.
    const at = new Date(start - i * 60_000);
    return {
      ...draft,
      slug: slugify(draft.name),
      active: true,
      createdAt: at,
      updatedAt: at,
    };
  });
  await products.insertMany(docs);
  process.stdout.write(
    `Seeded ${docs.length} demo products into ${DB_NAME}.\n`,
  );
} finally {
  await client.close();
}
