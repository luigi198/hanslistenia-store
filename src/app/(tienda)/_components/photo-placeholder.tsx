import Image from "next/image";
import styles from "./photo-placeholder.module.css";

/** Stand-in for a product photo: park concrete with the planche mark. */
export function PhotoPlaceholder() {
  return (
    <div className={styles.placeholder} aria-hidden>
      <Image
        src="/brand/planche.svg"
        alt=""
        width={263}
        height={108}
        unoptimized
        className={styles.mark}
      />
    </div>
  );
}
