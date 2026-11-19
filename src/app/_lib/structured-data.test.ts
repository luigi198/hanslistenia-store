import { describe, expect, it } from "vitest";
import { SITE_URL } from "./site";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  productJsonLd,
  profilePageJsonLd,
  serializeJsonLd,
  videoJsonLd,
} from "./structured-data";

const plainProduct = {
  slug: "camiseta-negra",
  name: "Camiseta negra",
  description: "Camiseta de algodón.\n\nHecha a pedido.",
  basePrice: 12_000,
  optionGroups: [],
  imageUrls: ["https://cdn.example/products/1.jpg"],
};

describe("productJsonLd", () => {
  it("describes a fixed-price product with a single CRC offer", () => {
    const data = productJsonLd(plainProduct);

    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Camiseta negra",
      sku: "camiseta-negra",
      url: `${SITE_URL}/productos/camiseta-negra`,
      image: ["https://cdn.example/products/1.jpg"],
      brand: { "@type": "Brand", name: "Hanslistenia" },
      offers: {
        "@type": "Offer",
        price: 12_000,
        priceCurrency: "CRC",
        availability: "https://schema.org/MadeToOrder",
        itemCondition: "https://schema.org/NewCondition",
        url: `${SITE_URL}/productos/camiseta-negra`,
      },
    });
  });

  it("gives a price range when options change the price", () => {
    const data = productJsonLd({
      ...plainProduct,
      optionGroups: [
        {
          name: "Talla",
          values: [
            { label: "M", priceDelta: 0 },
            { label: "XXL", priceDelta: 2_000 },
          ],
        },
      ],
    });

    expect(data.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: 12_000,
      highPrice: 14_000,
      priceCurrency: "CRC",
    });
  });

  it("omits the image list when the product has no photos", () => {
    expect(
      productJsonLd({ ...plainProduct, imageUrls: [] }),
    ).not.toHaveProperty("image");
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers the trail from 1 with absolute URLs", () => {
    const data = breadcrumbJsonLd([
      { name: "Inicio", path: "/" },
      { name: "Productos", path: "/productos" },
    ]);

    expect(data.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Productos",
        item: `${SITE_URL}/productos`,
      },
    ]);
  });
});

describe("organizationJsonLd", () => {
  it("links the store to its logo, channel and WhatsApp contact", () => {
    const data = organizationJsonLd();

    expect(data).toMatchObject({
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Hanslistenia",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/apple-icon.png`,
      sameAs: ["https://www.youtube.com/@hanslistenia"],
    });
    expect(data.contactPoint.telephone).toMatch(/^\+506\d{8}$/);
  });
});

describe("profilePageJsonLd", () => {
  it("makes the coach the page's main entity, with an absolute photo URL", () => {
    const data = profilePageJsonLd({
      name: "Hans Barrantes",
      description: "Coach.",
      imagePath: "/_next/static/media/retrato.jpg",
    });

    expect(data).toMatchObject({
      "@type": "ProfilePage",
      url: `${SITE_URL}/sobre-el-coach`,
      mainEntity: {
        "@type": "Person",
        name: "Hans Barrantes",
        alternateName: "Hanslistenia",
        image: `${SITE_URL}/_next/static/media/retrato.jpg`,
      },
    });
  });
});

describe("videoJsonLd", () => {
  it("has the fields Google requires for a video result", () => {
    const data = videoJsonLd({
      id: "abc123",
      title: "Handstand",
      description: "Parada de manos.",
      uploadDate: "2026-05-26T14:50:53-07:00",
      duration: "PT2M23S",
    });

    expect(data).toMatchObject({
      "@type": "VideoObject",
      name: "Handstand",
      thumbnailUrl: ["https://i.ytimg.com/vi/abc123/hqdefault.jpg"],
      uploadDate: "2026-05-26T14:50:53-07:00",
      embedUrl: "https://www.youtube-nocookie.com/embed/abc123",
    });
  });
});

describe("serializeJsonLd", () => {
  it("escapes '<' so data can't close the script tag", () => {
    const json = serializeJsonLd({ name: "</script><script>alert(1)" });

    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ name: "</script><script>alert(1)" });
  });
});
