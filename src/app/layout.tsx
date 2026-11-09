import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// One family: the width axis gives expanded headlines (echoing the logo's
// wide wordmark) and normal-width body text.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const STORE_NAME = "Hanslistenia";

export const metadata: Metadata = {
  title: { default: `${STORE_NAME} — Tienda`, template: `%s | ${STORE_NAME}` },
  description:
    "Ropa de calistenia hecha a pedido por Hanslistenia, Costa Rica.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CR" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
