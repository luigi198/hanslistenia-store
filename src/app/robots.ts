import type { MetadataRoute } from "next";
import { absoluteUrl } from "./_lib/site";

// Everything may be crawled: admin and order pages opt out with noindex,
// which crawlers can only see if robots.txt lets them fetch the page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
