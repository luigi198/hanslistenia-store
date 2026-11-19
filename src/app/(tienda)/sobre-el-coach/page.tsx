import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { pageMetadata } from "@/app/_lib/seo";
import { COACH_PATH, profilePageJsonLd } from "@/app/_lib/structured-data";
import { JsonLd } from "../_components/json-ld";
import {
  BIO_CLOSING,
  BIO_NAME,
  BIO_SECTIONS,
  BIO_TAGLINE,
} from "./_content/bio";
import { CLOSING_PHOTO, PORTRAIT, SECTION_PHOTOS } from "./_content/photos";
import styles from "./coach.module.css";

const DESCRIPTION =
  "Hans Barrantes (Hanslistenia): promotor, atleta, instructor de calistenia y fundador de Conatus Centro de Movimiento Integral, en Costa Rica.";

export const metadata: Metadata = pageMetadata({
  title: `${BIO_NAME}, coach de calistenia`,
  description: DESCRIPTION,
  path: COACH_PATH,
  type: "profile",
  // A 1200×630 card: the portrait itself is too tall for link previews.
  images: [
    {
      url: "/og/hans-barrantes.jpg",
      alt: "Hans Barrantes, coach de calistenia en Costa Rica",
      width: 1200,
      height: 630,
    },
  ],
});

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
      <JsonLd
        data={profilePageJsonLd({
          name: BIO_NAME,
          description: DESCRIPTION,
          imagePath: PORTRAIT.src.src,
        })}
      />
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
