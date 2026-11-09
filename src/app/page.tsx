import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home">
      <h1>Hanslistenia</h1>
      <p>Ropa de calistenia hecha a pedido.</p>
      <Link href="/productos">Ver productos</Link>
    </main>
  );
}
