import type { Metadata } from "next";
import { absoluteUrl, SITE_LOCALE, SITE_NAME } from "./site";

export type ShareImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

/** Branded 1200×630 card for pages without a photo of their own. */
export const DEFAULT_OG_IMAGE: ShareImage = {
  url: "/og/hanslistenia.jpg",
  alt: "Hanslistenia: ropa de calistenia hecha a pedido en Costa Rica",
  width: 1200,
  height: 630,
};

type PageSeo = {
  /** A plain string goes through the site's "%s | Hanslistenia" template. */
  title: string | { absolute: string };
  description: string;
  /** Site-relative path of the page; becomes its canonical URL. */
  path: string;
  images?: ShareImage[];
  type?: "website" | "profile";
};

/**
 * Complete metadata for a public page. Next merges metadata shallowly, so a
 * page that sets `openGraph` loses the layout's; building it whole here keeps
 * site name, locale and image on every page.
 */
export function pageMetadata({
  title,
  description,
  path,
  images = [],
  type = "website",
}: PageSeo): Metadata {
  absoluteUrl(path); // fail fast on anything but a site-relative path
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      url: path,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type,
      images: images.length > 0 ? images : [DEFAULT_OG_IMAGE],
    },
    // No `twitter` key: Next derives the large-image card from openGraph.
  };
}
