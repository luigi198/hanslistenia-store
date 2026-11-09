import type { CatalogItem } from "../productos/_lib/catalog";
import { ProductCard } from "./product-card";
import styles from "./product-rail.module.css";

/**
 * Products hang from a continuous bar per row, like garments on a rail.
 * Cells have no gap between them, so each row's top borders join into one bar.
 */
export function ProductRail({ items }: { items: CatalogItem[] }) {
  return (
    <ul className={styles.rail}>
      {items.map((item) => (
        <li key={item.slug} className={styles.slot}>
          <ProductCard item={item} />
        </li>
      ))}
    </ul>
  );
}
