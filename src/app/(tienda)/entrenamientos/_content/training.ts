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

/** What Google needs to list an embedded video (VideoObject). */
type EmbedDetails = {
  description: string;
  /** As published on YouTube (ISO 8601 with time zone). */
  uploadDate: string;
  /** ISO 8601 duration. */
  duration: string;
};

/**
 * A video whose music's rights holder blocks playback outside YouTube is
 * shown as its thumbnail linking to YouTube instead of a broken player.
 */
export type TrainingVideo =
  | (VideoBase & EmbedDetails & { kind: "embed" })
  | (VideoBase & { kind: "link"; thumbnail: StaticImageData });

/** Videos from the coach's channel (@hanslistenia), in page order. */
export const TRAINING_VIDEOS: TrainingVideo[] = [
  {
    kind: "link",
    id: "ZIaVBZe3M3U",
    title: "Calistenia / Streetworkout Costa Rica",
    thumbnail: streetworkoutThumbnail,
  },
  {
    kind: "embed",
    id: "qFckwZNa3m4",
    title: "Handstand Costa Rica",
    description:
      "Parada de manos (handstand) con Hans Barrantes, Hanslistenia, en Costa Rica.",
    uploadDate: "2026-05-26T14:50:53-07:00",
    duration: "PT2M23S",
  },
];
