import Image from "next/image";
import Link from "next/link";
import { formatCRC } from "@/app/_lib/format";
import type { CatalogItem } from "../productos/_lib/catalog";
import styles from "./product-card.module.css";
import { PhotoPlaceholder } from "./photo-placeholder";

/** A garment hanging from the rail: bar on top, photo, name, price. */
export function ProductCard({ item }: { item: CatalogItem }) {
  return (
    <Link href={`/productos/${item.slug}`} className={styles.card}>
      <div className={styles.photo}>
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <PhotoPlaceholder />
        )}
      </div>
      <h3 className={styles.name}>{item.name}</h3>
      <p className={styles.price}>
        {item.hasOptions ? "Desde " : ""}
        {formatCRC(item.fromPrice)}
      </p>
    </Link>
  );
}
