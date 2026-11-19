import type { Metadata } from "next";
import Link from "next/link";

// Next already adds noindex to 404 responses.
export const metadata: Metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <main className="home">
      <h1>Página no encontrada</h1>
      <p>Lo que busca no existe o ya no está disponible.</p>
      <Link href="/productos">Ver productos</Link>
    </main>
  );
}
