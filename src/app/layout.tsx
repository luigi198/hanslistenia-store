import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { DEFAULT_OG_IMAGE } from "./_lib/seo";
import { SITE_LOCALE, SITE_NAME, SITE_URL } from "./_lib/site";
import "./globals.css";

// One family: the width axis gives expanded headlines (echoing the logo's
// wide wordmark) and normal-width body text.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

// Defaults for pages that set none (404, admin); public pages build their
// own complete metadata with pageMetadata().
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description:
    "Ropa de calistenia hecha a pedido en Costa Rica por Hanslistenia.",
  openGraph: {
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CR" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
