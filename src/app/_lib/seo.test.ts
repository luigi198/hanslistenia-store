import { describe, expect, it } from "vitest";
import { DEFAULT_OG_IMAGE, pageMetadata } from "./seo";
import { SITE_NAME } from "./site";

describe("pageMetadata", () => {
  it("sets the canonical path and full Open Graph defaults", () => {
    const metadata = pageMetadata({
      title: "Productos",
      description: "Ropa de calistenia.",
      path: "/productos",
    });

    expect(metadata.title).toBe("Productos");
    expect(metadata.description).toBe("Ropa de calistenia.");
    expect(metadata.alternates?.canonical).toBe("/productos");
    expect(metadata.openGraph).toMatchObject({
      url: "/productos",
      siteName: SITE_NAME,
      locale: "es_CR",
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    });
  });

  it("uses the page's own images instead of the default one", () => {
    const image = { url: "https://cdn.example/foto.jpg", alt: "Foto" };
    const metadata = pageMetadata({
      title: "Camiseta",
      description: "Una camiseta.",
      path: "/productos/camiseta",
      images: [image],
    });

    expect(metadata.openGraph?.images).toEqual([image]);
  });

  it("falls back to the default image when the page has none", () => {
    const metadata = pageMetadata({
      title: "Camiseta",
      description: "Una camiseta.",
      path: "/productos/camiseta",
      images: [],
    });

    expect(metadata.openGraph?.images).toEqual([DEFAULT_OG_IMAGE]);
  });

  it("keeps an absolute title out of the site's title template", () => {
    const metadata = pageMetadata({
      title: { absolute: "Hanslistenia — Ropa de calistenia" },
      description: "Inicio.",
      path: "/",
    });

    expect(metadata.title).toEqual({
      absolute: "Hanslistenia — Ropa de calistenia",
    });
  });

  it("rejects a path that isn't site-relative", () => {
    expect(() =>
      pageMetadata({
        title: "X",
        description: "Y",
        path: "https://otro.com/x",
      }),
    ).toThrow(RangeError);
  });
});
