import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatCRC } from "@/app/_lib/format";
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
        <h1>Productos</h1>
        <p>
          Todo se hace a pedido. Elija su talla y opciones en cada producto.
        </p>
      </header>
      {items.length === 0 ? (
        <p>Pronto habrá productos disponibles.</p>
      ) : (
        <ul className={styles.grid}>
          {items.map((item) => (
            <li key={item.slug}>
              <Link href={`/productos/${item.slug}`} className={styles.card}>
                <div className={styles.cover}>
                  {item.coverUrl ? (
                    <Image
                      src={item.coverUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  ) : (
                    <span aria-hidden className={styles.placeholder}>
                      H
                    </span>
                  )}
                </div>
                <h2>{item.name}</h2>
                <p>
                  {item.hasOptions ? "Desde " : ""}
                  {formatCRC(item.fromPrice)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
