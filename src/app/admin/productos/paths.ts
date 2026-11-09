export const ADMIN_PRODUCTS_PATH = "/admin/productos";
export const NEW_PRODUCT_PATH = `${ADMIN_PRODUCTS_PATH}/nuevo`;

export function editProductPath(productId: string): string {
  return `${ADMIN_PRODUCTS_PATH}/${productId}`;
}
