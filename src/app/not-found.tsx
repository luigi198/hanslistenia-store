import Link from "next/link";

export default function NotFound() {
  return (
    <main className="home">
      <h1>Página no encontrada</h1>
      <p>Lo que busca no existe o ya no está disponible.</p>
      <Link href="/productos">Ver productos</Link>
    </main>
  );
}
