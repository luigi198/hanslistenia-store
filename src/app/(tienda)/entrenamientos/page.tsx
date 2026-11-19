import type { Metadata } from "next";
import { pageMetadata } from "@/app/_lib/seo";
import { whatsappLink } from "@/app/_lib/store-info";
import { videoJsonLd } from "@/app/_lib/structured-data";
import { JsonLd } from "../_components/json-ld";
import { VideoCard } from "./_components/video-card";
import {
  TRAINING_CTA,
  TRAINING_INTRO,
  TRAINING_VIDEOS,
  TRAINING_WHATSAPP_GREETING,
} from "./_content/training";
import styles from "./training.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Entrenamientos de calistenia en Costa Rica",
  description:
    "Entrene calistenia y street workout con Hans Barrantes (Hanslistenia) en Costa Rica: progresión inteligente, conciencia de movimiento y cultura de calle.",
  path: "/entrenamientos",
});

export default function TrainingPage() {
  return (
    <main className={styles.page}>
      {TRAINING_VIDEOS.map(
        (video) =>
          // Only a video playable on the page counts as one for Google.
          video.kind === "embed" && (
            <JsonLd key={video.id} data={videoJsonLd(video)} />
          ),
      )}
      <header className={styles.intro}>
        <h1 className={styles.title}>Entrenamientos</h1>
        {TRAINING_INTRO.map((line) => (
          <p key={line} className={styles.lead}>
            {line}
          </p>
        ))}
      </header>

      <div className={styles.videos}>
        {TRAINING_VIDEOS.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      <footer className={styles.cta}>
        <p className={styles.ctaText}>{TRAINING_CTA}</p>
        <a
          href={whatsappLink(TRAINING_WHATSAPP_GREETING)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaLink}
        >
          Escríbale por WhatsApp
        </a>
      </footer>
    </main>
  );
}
