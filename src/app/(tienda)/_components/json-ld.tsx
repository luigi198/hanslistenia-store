import { serializeJsonLd } from "@/app/_lib/structured-data";

/** One schema.org block for search engines (see app/_lib/structured-data). */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Escaped by serializeJsonLd: no "<" can reach the HTML.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
