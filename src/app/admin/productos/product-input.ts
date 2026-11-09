import { z } from "zod";
import type { ProductDraft } from "@/domain/products/product";

// Structural limits only (types, shapes, hard size caps against abuse);
// business rules live in the domain and are reported field by field.
const MAX_TEXT = 20_000;
const MAX_JSON = 100_000;
const MAX_ITEMS = 100;

const text = z.string().max(MAX_TEXT);
const optionGroups = z
  .array(
    z.object({
      name: text,
      values: z
        .array(z.object({ label: text, priceDelta: z.number() }))
        .max(MAX_ITEMS),
    }),
  )
  .max(MAX_ITEMS);
const images = z.array(z.object({ key: text })).max(MAX_ITEMS);

const formSchema = z.object({
  name: text,
  description: text,
  basePrice: text,
  productionNote: text,
  optionGroups: z.string().max(MAX_JSON),
  images: z.string().max(MAX_JSON),
});

/** Browsers submit textarea line breaks as CRLF; store plain LF. */
const toLf = (value: string) => value.replace(/\r\n?/g, "\n");

function parseJson<T>(raw: string, schema: z.ZodType<T>): T | null {
  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null; // not JSON: a tampered or broken form
  }
}

/** Product draft from the admin form, or null if the form is malformed. */
export function parseProductForm(form: FormData): ProductDraft | null {
  const fields = formSchema.safeParse(Object.fromEntries(form));
  if (!fields.success) return null;
  const groups = parseJson(fields.data.optionGroups, optionGroups);
  const imageList = parseJson(fields.data.images, images);
  if (!groups || !imageList) return null;
  return {
    name: fields.data.name,
    description: toLf(fields.data.description),
    // Number("") is 0 and Number("abc") is NaN; the domain rejects both.
    basePrice: Number(fields.data.basePrice),
    productionNote: fields.data.productionNote,
    optionGroups: groups,
    images: imageList,
  };
}
