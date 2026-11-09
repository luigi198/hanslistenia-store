import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { formatCRC } from "@/app/_lib/format";
import { getProductService } from "@/composition/products";
import { requireAdminSession } from "../_lib/session";
import { setProductActiveAction } from "./actions";
import { editProductPath, NEW_PRODUCT_PATH } from "./paths";
import styles from "./products.module.css";

export const metadata: Metadata = { title: "Productos" };

export default function AdminProductsPage() {
  return (
    <main className={styles.page}>
      <Suspense fallback={<p>Cargando…</p>}>
        <ProductList />
      </Suspense>
    </main>
  );
}

async function ProductList() {
  await requireAdminSession();
  const products = await getProductService().listAll();
  return (
    <>
      <div className={styles.header}>
        <h1>Productos</h1>
        <Link href={NEW_PRODUCT_PATH} className={styles.primary}>
          Nuevo producto
        </Link>
      </div>
      {products.length === 0 ? (
        <p>Todavía no hay productos.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio base</th>
              <th>Estado</th>
              <th>
                <span className={styles.srOnly}>Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <Link href={editProductPath(product.id)}>{product.name}</Link>
                </td>
                <td>{formatCRC(product.basePrice)}</td>
                <td>{product.active ? "Visible" : "Oculto"}</td>
                <td>
                  <form
                    action={setProductActiveAction.bind(
                      null,
                      product.id,
                      !product.active,
                    )}
                  >
                    <button type="submit">
                      {product.active ? "Ocultar" : "Mostrar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Link href="/admin">← Volver al panel</Link>
    </>
  );
}
