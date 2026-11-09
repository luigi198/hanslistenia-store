import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdminSession } from "../../_lib/session";
import { EMPTY_PRODUCT_FORM } from "../_components/form-types";
import { ProductForm } from "../_components/product-form";
import { saveProductAction } from "../actions";
import styles from "../products.module.css";

export const metadata: Metadata = { title: "Nuevo producto" };

export default function NewProductPage() {
  return (
    <main className={styles.page}>
      <h1>Nuevo producto</h1>
      <Suspense fallback={<p>Cargando…</p>}>
        <NewProductForm />
      </Suspense>
    </main>
  );
}

async function NewProductForm() {
  await requireAdminSession();
  return (
    <ProductForm
      action={saveProductAction.bind(null, null)}
      initial={EMPTY_PRODUCT_FORM}
      submitLabel="Crear producto"
    />
  );
}
