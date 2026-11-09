import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { whatsappLink } from "@/app/_lib/store-info";
import styles from "./tienda.module.css";

const WHATSAPP_GREETING = "Hola, tengo una consulta sobre la tienda.";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={styles.store}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.wordmark} aria-label="Inicio">
            <Image
              src="/brand/wordmark.svg"
              alt="Hanslistenia"
              width={378}
              height={30}
              unoptimized
              priority
            />
          </Link>
          <nav className={styles.nav} aria-label="Principal">
            <Link href="/productos">Productos</Link>
            <a
              href={whatsappLink(WHATSAPP_GREETING)}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </nav>
        </div>
      </header>

      {children}

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Image
            src="/brand/wordmark.svg"
            alt="Hanslistenia"
            width={378}
            height={30}
            unoptimized
            className={styles.footerMark}
          />
          <p>Disciplina y movimiento.</p>
          <p>
            Pedidos y consultas por{" "}
            <a
              href={whatsappLink(WHATSAPP_GREETING)}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
            . Pagos por SINPE Móvil.
          </p>
          <p className={styles.legal}>
            Hecho en Costa Rica. © <CurrentYear /> Hanslistenia.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Cached so the footer stays in the static shell; refreshed daily. */
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
