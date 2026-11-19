import type { StaticImageData } from "next/image";
import streetworkoutThumbnail from "../_photos/streetworkout-costa-rica.jpg";

/**
 * Copy for the training page. The quoted lines are the coach's own words,
 * taken from his bio; keep them verbatim.
 */

export const TRAINING_INTRO = [
  "Mi misión es acercar la calistenia a más personas, independientemente de su edad, experiencia o condición física.",
  "Mi metodología se fundamenta en cinco pilares: progresión inteligente, multiestímulo, transferencia, conciencia de movimiento y cultura de calle.",
];

export const TRAINING_CTA = "¿Quiere entrenar con Hans?";

export const TRAINING_WHATSAPP_GREETING =
  "Hola, me interesa entrenar con usted.";

type VideoBase = {
  /** YouTube video id. */
  id: string;
  /** The video's title on YouTube. */
  title: string;
};

/**
 * A video whose music's rights holder blocks playback outside YouTube is
 * shown as its thumbnail linking to YouTube instead of a broken player.
 */
export type TrainingVideo =
  | (VideoBase & { kind: "embed" })
  | (VideoBase & { kind: "link"; thumbnail: StaticImageData });

/** Videos from the coach's channel (@hanslistenia), in page order. */
export const TRAINING_VIDEOS: TrainingVideo[] = [
  {
    kind: "link",
    id: "ZIaVBZe3M3U",
    title: "Calistenia / Streetworkout Costa Rica",
    thumbnail: streetworkoutThumbnail,
  },
  { kind: "embed", id: "qFckwZNa3m4", title: "Handstand Costa Rica" },
];

/** youtube-nocookie: YouTube sets no tracking cookies until playback. */
const EMBED_BASE = "https://www.youtube-nocookie.com/embed/";
const WATCH_BASE = "https://www.youtube.com/watch?v=";

export function embedUrl(video: VideoBase): string {
  return `${EMBED_BASE}${video.id}`;
}

export function watchUrl(video: VideoBase): string {
  return `${WATCH_BASE}${video.id}`;
}
