import type { Metadata } from "next";
import { ProductRail } from "../_components/product-rail";
import { getCatalog } from "./_lib/catalog";
import styles from "./catalog.module.css";

export const metadata: Metadata = {
  title: "Productos",
  description: "Ropa de calistenia hecha a pedido por Hanslistenia.",
};

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
