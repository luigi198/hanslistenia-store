import Image from "next/image";
import { youtubeEmbedUrl, youtubeWatchUrl } from "@/app/_lib/youtube";
import type { TrainingVideo } from "../_content/training";
import styles from "../training.module.css";

/** Lets the visitor play the video full screen and picture-in-picture. */
const PLAYER_PERMISSIONS =
  "accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share";

/** One column on phones, half the content column from 900px. */
const THUMBNAIL_SIZES = "(min-width: 900px) 50vw, 100vw";

export function VideoCard({ video }: { video: TrainingVideo }) {
  if (video.kind === "embed") {
    return (
      <iframe
        src={youtubeEmbedUrl(video.id)}
        title={video.title}
        className={styles.video}
        loading="lazy"
        allow={PLAYER_PERMISSIONS}
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  return (
    <a
      href={youtubeWatchUrl(video.id)}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.videoLink}
    >
      <span className={styles.thumbnail}>
        <Image
          src={video.thumbnail}
          alt=""
          sizes={THUMBNAIL_SIZES}
          placeholder="blur"
          className={styles.video}
        />
        <svg
          className={styles.playMark}
          viewBox="0 0 72 52"
          aria-hidden="true"
          focusable="false"
        >
          <rect width="72" height="52" rx="12" />
          <path d="M29 16 L49 26 L29 36 Z" />
        </svg>
      </span>
      <span className={styles.videoLabel}>
        {video.title} <span aria-hidden="true">·</span> Ver en YouTube
      </span>
    </a>
  );
}
