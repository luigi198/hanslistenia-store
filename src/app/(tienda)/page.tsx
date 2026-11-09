import Image from "next/image";
import Link from "next/link";
import { ProductRail } from "./_components/product-rail";
import styles from "./home.module.css";
import { getCatalog } from "./productos/_lib/catalog";

const FEATURED_COUNT = 3;

const STEPS = [
  {
    title: "Elija su prenda",
    text: "Escoja el producto, la talla y las opciones.",
  },
  {
    title: "Pague por SINPE Móvil",
    text: "Envíe el comprobante desde la página de su pedido.",
  },
  {
    title: "La hacemos para usted",
    text: "Cada pieza se produce a pedido después del pago.",
  },
  {
    title: "Coordinamos la entrega",
    text: "Le escribimos por WhatsApp para acordar el envío.",
  },
];

export default async function HomePage() {
  const featured = (await getCatalog()).slice(0, FEATURED_COUNT);

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.headline}>
            <span>Disciplina</span> <span>y movimiento.</span>
          </h1>
          <div className={styles.copy}>
            <p className={styles.lede}>
              Ropa de calistenia hecha a pedido en Costa Rica, para entrenar en
              la barra y en la calle.
            </p>
            <Link href="/productos" className={styles.cta}>
              Ver productos
            </Link>
          </div>
          <Image
            src="/brand/planche.svg"
            alt="Silueta de un atleta sosteniendo una plancha sobre paralelas"
            width={789}
            height={324}
            unoptimized
            priority
            className={styles.figure}
          />
        </div>
        {/* The ground the figure balances on: the logo's bar, full width. */}
        <div className={styles.ground} aria-hidden />
      </section>

      {featured.length > 0 && (
        <section className={styles.section} aria-labelledby="destacados">
          <div className={styles.sectionHead}>
            <h2 id="destacados" className={styles.sectionTitle}>
              Productos
            </h2>
            <Link href="/productos" className={styles.more}>
              Ver todos
            </Link>
          </div>
          <ProductRail items={featured} />
        </section>
      )}

      <section className={styles.section} aria-labelledby="como-funciona">
        <h2 id="como-funciona" className={styles.sectionTitle}>
          Cómo funciona un pedido
        </h2>
        <ol className={styles.steps}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden>
                {i + 1}
              </span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
