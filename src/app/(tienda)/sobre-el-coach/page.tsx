import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  BIO_CLOSING,
  BIO_NAME,
  BIO_SECTIONS,
  BIO_TAGLINE,
} from "./_content/bio";
import { CLOSING_PHOTO, PORTRAIT, SECTION_PHOTOS } from "./_content/photos";
import styles from "./coach.module.css";

export const metadata: Metadata = {
  title: `Sobre el coach — ${BIO_NAME}`,
  description:
    "Hans Barrantes (Hanslistenia): atleta, entrenador de calistenia y fundador de CONATUS, Centro de Movimiento Integral, en Costa Rica.",
  openGraph: { images: [{ url: PORTRAIT.src.src, alt: PORTRAIT.alt }] },
};

const ITALIC_MARK = /\*([^*]+)\*/g;

/** Below 900px every photo spans the column; above, it shares the row. */
const SIDE_PHOTO_SIZES = "(min-width: 900px) 34vw, 100vw";

/** Renders `*term*` as <em>term</em>; everything else as plain text. */
function withItalics(text: string): ReactNode[] {
  return text
    .split(ITALIC_MARK)
    .map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : part));
}

export default function CoachPage() {
  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <div className={styles.introText}>
          <h1 className={styles.name}>{BIO_NAME}</h1>
          <p className={styles.tagline}>{BIO_TAGLINE}</p>
        </div>
        <Image
          src={PORTRAIT.src}
          alt={PORTRAIT.alt}
          sizes={SIDE_PHOTO_SIZES}
          placeholder="blur"
          priority
          className={styles.portrait}
        />
      </header>

      {BIO_SECTIONS.map((section) => {
        const photo = SECTION_PHOTOS[section.id];
        return (
          <section
            key={section.id}
            className={styles.section}
            aria-labelledby={section.id}
          >
            <div className={styles.sectionText}>
              <h2 id={section.id} className={styles.sectionTitle}>
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{withItalics(paragraph)}</p>
              ))}
            </div>
            {photo && (
              <Image
                src={photo.src}
                alt={photo.alt}
                sizes={SIDE_PHOTO_SIZES}
                placeholder="blur"
                className={styles.photo}
              />
            )}
          </section>
        );
      })}

      <footer className={styles.closing}>
        <p className={styles.closingText}>{BIO_CLOSING}</p>
        <Image
          src={CLOSING_PHOTO.src}
          alt={CLOSING_PHOTO.alt}
          sizes={SIDE_PHOTO_SIZES}
          placeholder="blur"
          className={styles.photo}
        />
      </footer>
    </main>
  );
}
