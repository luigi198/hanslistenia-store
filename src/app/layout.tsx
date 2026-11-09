import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const STORE_NAME = "Hanslistenia";

export const metadata: Metadata = {
  title: { default: `${STORE_NAME} — Tienda`, template: `%s | ${STORE_NAME}` },
  description:
    "Ropa de calistenia hecha a pedido por Hanslistenia, Costa Rica.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CR" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
