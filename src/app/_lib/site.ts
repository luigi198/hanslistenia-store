/**
 * The store's public identity. The canonical origin is fixed (not read from
 * env) so preview deployments still point search engines at production.
 */
export const SITE_URL = "https://hanslistenia.com";

export const SITE_NAME = "Hanslistenia";

export const SITE_LOCALE = "es_CR";

export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@hanslistenia";

/** "/productos" → "https://hanslistenia.com/productos". */
export function absoluteUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new RangeError(`Expected a site-relative path, got: ${path}`);
  }
  return new URL(path, SITE_URL).href;
}
