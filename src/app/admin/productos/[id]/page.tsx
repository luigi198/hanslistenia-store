import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProductService } from "@/composition/products";
import { requireAdminSession } from "../../_lib/session";
import { ProductForm } from "../_components/product-form";
import { saveProductAction, setProductActiveAction } from "../actions";
import styles from "../products.module.css";

export const metadata: Metadata = { title: "Editar producto" };

export default function EditProductPage({
  params,
}: PageProps<"/admin/productos/[id]">) {
  return (
    <main className={styles.page}>
      <Suspense fallback={<p>Cargando…</p>}>
        <EditProduct params={params} />
      </Suspense>
    </main>
  );
}

async function EditProduct({
  params,
}: Pick<PageProps<"/admin/productos/[id]">, "params">) {
  await requireAdminSession();
  const { id } = await params;
  const service = getProductService();
  const product = await service.getById(id);
  if (!product) notFound();

  return (
    <>
      <div className={styles.header}>
        <h1>Editar producto</h1>
        <form
          action={setProductActiveAction.bind(
            null,
            product.id,
            !product.active,
          )}
        >
          <button type="submit">
            {product.active ? "Ocultar del catálogo" : "Mostrar en el catálogo"}
          </button>
        </form>
      </div>
      <p>
        {product.active ? "Visible en " : "Oculto. Dirección: "}
        <Link href={`/productos/${product.slug}`}>
          /productos/{product.slug}
        </Link>
      </p>
      <ProductForm
        action={saveProductAction.bind(null, product.id)}
        initial={{
          name: product.name,
          description: product.description,
          basePrice: String(product.basePrice),
          productionNote: product.productionNote ?? "",
          optionGroups: product.optionGroups,
          images: product.images.map(({ key }) => ({
            key,
            url: service.imageUrl(key),
          })),
        }}
        submitLabel="Guardar cambios"
      />
    </>
  );
}
