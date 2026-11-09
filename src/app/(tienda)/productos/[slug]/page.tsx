import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhotoPlaceholder } from "../../_components/photo-placeholder";
import { getPublicProduct } from "../_lib/catalog";
import styles from "../catalog.module.css";
import { OptionPicker } from "./option-picker";

const DESCRIPTION_PREVIEW_LENGTH = 160;

export async function generateMetadata({
  params,
}: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const product = await getPublicProduct((await params).slug);
  // Metadata blocks the response for crawlers, so this gives them a real
  // 404 status; browsers get the streamed not-found page.
  if (!product) notFound();
  return {
    title: product.name,
    description: product.description.slice(0, DESCRIPTION_PREVIEW_LENGTH),
  };
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
      <div className={styles.gallery}>
        {product.imageUrls.length === 0 ? (
          <div className={styles.photo}>
            <PhotoPlaceholder />
          </div>
        ) : (
          product.imageUrls.map((url, i) => (
            <div key={url} className={styles.photo}>
              <Image
                src={url}
                alt={`${product.name}, foto ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 860px) 100vw, 55vw"
              />
            </div>
          ))
        )}
      </div>
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
