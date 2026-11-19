import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { pageMetadata } from "@/app/_lib/seo";
import {
  breadcrumbJsonLd,
  productJsonLd,
  productPath,
} from "@/app/_lib/structured-data";
import { summarize } from "@/shared/text";
import { JsonLd } from "../../_components/json-ld";
import { PhotoPlaceholder } from "../../_components/photo-placeholder";
import { getPublicProduct } from "../_lib/catalog";
import styles from "../catalog.module.css";
import { OptionPicker } from "./option-picker";
import { PhotoCarousel } from "./photo-carousel";

const DESCRIPTION_PREVIEW_LENGTH = 160;

/** For a product whose description is empty or too thin to stand alone. */
function fallbackDescription(name: string): string {
  return `${name}: ropa de calistenia hecha a pedido en Costa Rica por Hanslistenia.`;
}

/** Below this, the description says too little for a search result. */
const MIN_DESCRIPTION_LENGTH = 50;

export async function generateMetadata({
  params,
}: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const product = await getPublicProduct((await params).slug);
  // Metadata blocks the response for crawlers, so this gives them a real
  // 404 status; browsers get the streamed not-found page.
  if (!product) notFound();
  const summary = summarize(product.description, DESCRIPTION_PREVIEW_LENGTH);
  return pageMetadata({
    title: product.name,
    description:
      summary.length >= MIN_DESCRIPTION_LENGTH
        ? summary
        : summarize(
            fallbackDescription(product.name),
            DESCRIPTION_PREVIEW_LENGTH,
          ),
    path: productPath(product.slug),
    images: product.imageUrls.map((url, i) => ({
      url,
      alt: `${product.name}, foto ${i + 1}`,
    })),
  });
}

export default function ProductPage({
  params,
}: PageProps<"/productos/[slug]">) {
  return (
    <main className={styles.page}>
      <Link href="/productos" className={styles.back}>
        Todos los productos
      </Link>
      {/* Unlisted slugs get the shell first; Next caches the full page after. */}
      <Suspense fallback={<p>Cargando…</p>}>
        <ProductDetails params={params} />
      </Suspense>
    </main>
  );
}

async function ProductDetails({
  params,
}: Pick<PageProps<"/productos/[slug]">, "params">) {
  const product = await getPublicProduct((await params).slug);
  if (!product) notFound();

  return (
    <article className={styles.product}>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Productos", path: "/productos" },
          { name: product.name, path: productPath(product.slug) },
        ])}
      />
      {product.imageUrls.length === 0 ? (
        <div className={styles.photo}>
          <PhotoPlaceholder />
        </div>
      ) : (
        <PhotoCarousel
          productName={product.name}
          imageUrls={product.imageUrls}
        />
      )}
      <div className={styles.details}>
        <h1 className={styles.name}>{product.name}</h1>
        <OptionPicker
          productName={product.name}
          basePrice={product.basePrice}
          fromPrice={product.fromPrice}
          optionGroups={product.optionGroups}
        />
        {product.productionNote && (
          <p className={styles.note}>{product.productionNote}</p>
        )}
        {product.description.split(/\n{2,}/).map((paragraph, i) => (
          <p key={i} className={styles.description}>
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
