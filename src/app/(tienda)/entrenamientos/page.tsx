import type { Metadata } from "next";
import { whatsappLink } from "@/app/_lib/store-info";
import { VideoCard } from "./_components/video-card";
import {
  TRAINING_CTA,
  TRAINING_INTRO,
  TRAINING_VIDEOS,
  TRAINING_WHATSAPP_GREETING,
} from "./_content/training";
import styles from "./training.module.css";

export const metadata: Metadata = {
  title: "Entrenamientos — Hanslistenia",
  description:
    "Entrenamientos de calistenia y street workout con Hans Barrantes (Hanslistenia) en Costa Rica.",
};

export default function TrainingPage() {
  return (
    <main className={styles.page}>
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
