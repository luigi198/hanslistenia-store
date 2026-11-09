"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CATALOG_TAG, productTag } from "@/app/_lib/cache-tags";
import { getProductService } from "@/composition/products";
import { getLogger } from "@/config/logger";
import type { Product } from "@/domain/products/product";
import type { SaveResult } from "@/domain/products/product-service";
import { requireAdminSession } from "../_lib/session";
import { describeProductError } from "./error-messages";
import { IMAGE_FORMATS_LABEL, MAX_IMAGE_MB } from "./image-rules";
import { ADMIN_PRODUCTS_PATH } from "./paths";
import { parseProductForm } from "./product-input";

export interface ProductFormState {
  errors: string[];
}

const MESSAGES = {
  malformed:
    "El formulario no es válido. Recargue la página e intente de nuevo.",
  notFound: "Este producto ya no existe.",
  unavailable: "No se pudo guardar. Intente de nuevo en unos minutos.",
  unsupportedType: `Formato no permitido. Use ${IMAGE_FORMATS_LABEL}.`,
  invalidSize: `La foto debe pesar como máximo ${MAX_IMAGE_MB} MB.`,
  uploadUnavailable: "No se pudo preparar la subida. Intente de nuevo.",
} as const;

/** Public pages show the change on the very next request. */
function refreshCatalog(product: Product): void {
  updateTag(CATALOG_TAG);
  updateTag(productTag(product.slug));
}

/** Creates (productId null) or updates a product from the admin form. */
export async function saveProductAction(
  productId: string | null,
  _previous: ProductFormState,
  form: FormData,
): Promise<ProductFormState> {
  await requireAdminSession();
  const draft = parseProductForm(form);
  if (!draft) return { errors: [MESSAGES.malformed] };

  let result: SaveResult;
  try {
    const service = getProductService();
    result = productId
      ? await service.update(productId, draft)
      : await service.create(draft);
  } catch (error) {
    getLogger().error("product_save_failed", { productId, error });
    return { errors: [MESSAGES.unavailable] };
  }

  if (!result.ok) {
    return result.reason === "not_found"
      ? { errors: [MESSAGES.notFound] }
      : { errors: result.errors.map(describeProductError) };
  }
  refreshCatalog(result.product);
  redirect(ADMIN_PRODUCTS_PATH); // throws; keep outside the try above
}

/** Shows (active) or hides a product in the public catalog. */
export async function setProductActiveAction(
  productId: string,
  active: boolean,
): Promise<void> {
  await requireAdminSession();
  try {
    const product = await getProductService().setActive(productId, active);
    if (product) refreshCatalog(product);
  } catch (error) {
    getLogger().error("product_visibility_change_failed", {
      productId,
      active,
      error,
    });
    throw error; // the admin sees the generic error page; details stay in logs
  }
}

const uploadRequest = z.object({
  contentType: z.string().max(100),
  bytes: z.number().int(),
});

export type ImageUploadResponse =
  | { ok: true; key: string; uploadUrl: string; publicUrl: string }
  | { ok: false; error: string };

/** A presigned URL the browser uploads one photo to, straight to S3. */
export async function requestImageUploadAction(
  input: unknown,
): Promise<ImageUploadResponse> {
  await requireAdminSession();
  const parsed = uploadRequest.safeParse(input);
  if (!parsed.success) return { ok: false, error: MESSAGES.unsupportedType };
  try {
    const result = await getProductService().requestImageUpload(parsed.data);
    if (result.ok) return result;
    return {
      ok: false,
      error:
        result.reason === "unsupported_type"
          ? MESSAGES.unsupportedType
          : MESSAGES.invalidSize,
    };
  } catch (error) {
    getLogger().error("product_image_upload_url_failed", { error });
    return { ok: false, error: MESSAGES.uploadUnavailable };
  }
}
