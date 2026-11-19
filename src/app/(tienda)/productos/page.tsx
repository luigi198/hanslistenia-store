import type { Metadata } from "next";
import { pageMetadata } from "@/app/_lib/seo";
import { ProductRail } from "../_components/product-rail";
import { getCatalog } from "./_lib/catalog";
import styles from "./catalog.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Ropa de calistenia hecha a pedido",
  description:
    "Ropa de calistenia hecha a pedido en Costa Rica. Elija su talla y opciones, pague por SINPE Móvil y coordinamos la entrega por WhatsApp.",
  path: "/productos",
});

export default async function CatalogPage() {
  const items = await getCatalog();
  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>Productos</h1>
        <p className={styles.lede}>
          Todo se hace a pedido. Elija su talla y opciones en cada prenda.
        </p>
      </header>
      {items.length === 0 ? (
        <p className={styles.empty}>
          Todavía no hay productos publicados. Vuelva pronto o escríbanos por
          WhatsApp.
        </p>
      ) : (
        <ProductRail items={items} />
      )}
    </main>
  );
}
