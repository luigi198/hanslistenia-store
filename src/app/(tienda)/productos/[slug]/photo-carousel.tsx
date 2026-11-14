"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import styles from "./photo-carousel.module.css";
import { slideAt } from "./slide-index";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

interface Props {
  productName: string;
  imageUrls: string[];
}

/**
 * Product photos side by side: swipe on touch screens, arrows and dots
 * elsewhere. Native scroll-snap does the sliding; this only tracks which
 * photo is in view and scrolls to the one asked for.
 */
export function PhotoCarousel({ productName, imageUrls }: Props) {
  const track = useRef<HTMLOListElement>(null);
  const [current, setCurrent] = useState(0);
  const count = imageUrls.length;
  const hasControls = count > 1;

  function goTo(index: number) {
    const list = track.current;
    if (!list) return;
    const reduceMotion = window.matchMedia(REDUCED_MOTION).matches;
    list.scrollTo({
      left: index * list.clientWidth,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  }

  function onScroll() {
    const list = track.current;
    if (list) setCurrent(slideAt(list.scrollLeft, list.clientWidth, count));
  }

  return (
    <section
      className={styles.carousel}
      aria-label={`Fotos de ${productName}`}
      aria-roledescription="carrusel"
    >
      <ol ref={track} className={styles.track} onScroll={onScroll}>
        {imageUrls.map((url, i) => (
          <li
            key={url}
            className={styles.slide}
            aria-roledescription="foto"
            aria-label={`${i + 1} de ${count}`}
          >
            <Image
              src={url}
              alt={`${productName}, foto ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(max-width: 860px) 100vw, 55vw"
            />
          </li>
        ))}
      </ol>
      {hasControls && (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.previous}`}
            aria-label="Foto anterior"
            disabled={current === 0}
            onClick={() => goTo(current - 1)}
          >
            ←
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            aria-label="Foto siguiente"
            disabled={current === count - 1}
            onClick={() => goTo(current + 1)}
          >
            →
          </button>
          <div className={styles.footer}>
            <div className={styles.dots}>
              {imageUrls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  className={styles.dot}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-current={i === current}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
            <p
              className={styles.counter}
              data-testid="photo-counter"
              aria-live="polite"
            >
              {current + 1} / {count}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
