/** URLs for a YouTube video, by id. */

/** youtube-nocookie: YouTube sets no tracking cookies until playback. */
const EMBED_BASE = "https://www.youtube-nocookie.com/embed/";
const WATCH_BASE = "https://www.youtube.com/watch?v=";
const THUMBNAIL_BASE = "https://i.ytimg.com/vi/";

export function youtubeEmbedUrl(id: string): string {
  return `${EMBED_BASE}${id}`;
}

export function youtubeWatchUrl(id: string): string {
  return `${WATCH_BASE}${id}`;
}

/** 480×360, published for every video (unlike maxresdefault). */
export function youtubeThumbnailUrl(id: string): string {
  return `${THUMBNAIL_BASE}${id}/hqdefault.jpg`;
}
