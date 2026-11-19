import type { OptionGroup } from "@/domain/products/product";
import { maxUnitPrice, minUnitPrice } from "@/domain/products/price";
import { summarize } from "@/shared/text";
import { absoluteUrl, SITE_NAME, SITE_URL, YOUTUBE_CHANNEL_URL } from "./site";
import { STORE_WHATSAPP_NUMBER } from "./store-info";
import {
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from "./youtube";

// schema.org JSON-LD for Google's rich results. Builders are pure so the
// shapes are unit-tested; <JsonLd> renders them.

const CONTEXT = "https://schema.org";
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const CURRENCY = "CRC";
const MADE_TO_ORDER = "https://schema.org/MadeToOrder";
const NEW_CONDITION = "https://schema.org/NewCondition";
/** Plenty for a product summary; keeps a long description from bloating HTML. */
const STRUCTURED_DESCRIPTION_LENGTH = 1000;

export const COACH_PATH = "/sobre-el-coach";

export function organizationJsonLd() {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/apple-icon.png"),
    sameAs: [YOUTUBE_CHANNEL_URL],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+${STORE_WHATSAPP_NUMBER}`,
      contactType: "customer service",
      areaServed: "CR",
      availableLanguage: "es",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage: "es-CR",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

type ProductInput = {
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  optionGroups: readonly OptionGroup[];
  imageUrls: readonly string[];
};

export function productPath(slug: string): string {
  return `/productos/${slug}`;
}

export function productJsonLd(product: ProductInput) {
  const url = absoluteUrl(productPath(product.slug));
  const low = minUnitPrice(product);
  const high = maxUnitPrice(product);
  const common = {
    priceCurrency: CURRENCY,
    availability: MADE_TO_ORDER,
    itemCondition: NEW_CONDITION,
    url,
    seller: { "@id": ORGANIZATION_ID },
  };
  return {
    "@context": CONTEXT,
    "@type": "Product",
    name: product.name,
    description: summarize(product.description, STRUCTURED_DESCRIPTION_LENGTH),
    sku: product.slug,
    url,
    ...(product.imageUrls.length > 0 && { image: [...product.imageUrls] }),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers:
      low === high
        ? { "@type": "Offer", price: low, ...common }
        : {
            "@type": "AggregateOffer",
            lowPrice: low,
            highPrice: high,
            ...common,
          },
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function profilePageJsonLd(coach: {
  name: string;
  description: string;
  imagePath: string;
}) {
  return {
    "@context": CONTEXT,
    "@type": "ProfilePage",
    url: absoluteUrl(COACH_PATH),
    mainEntity: {
      "@type": "Person",
      name: coach.name,
      alternateName: SITE_NAME,
      description: coach.description,
      jobTitle: "Instructor de calistenia",
      image: absoluteUrl(coach.imagePath),
      sameAs: [YOUTUBE_CHANNEL_URL],
      worksFor: {
        "@type": "Organization",
        name: "Conatus Centro de Movimiento Integral",
      },
    },
  };
}

export function videoJsonLd(video: {
  id: string;
  title: string;
  description: string;
  /** ISO 8601 with time zone, as YouTube publishes it. */
  uploadDate: string;
  /** ISO 8601 duration, e.g. "PT2M23S". */
  duration: string;
}) {
  return {
    "@context": CONTEXT,
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: [youtubeThumbnailUrl(video.id)],
    uploadDate: video.uploadDate,
    duration: video.duration,
    embedUrl: youtubeEmbedUrl(video.id),
    url: youtubeWatchUrl(video.id),
  };
}

/**
 * JSON for a <script> tag. JSON.stringify doesn't escape "<", so text like
 * "</script>" in a product description could break out of the tag.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
