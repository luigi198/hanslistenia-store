import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import styles from "./admin.module.css";
import { logoutAction } from "./actions";
import { requireAdminSession } from "./_lib/session";
import { ADMIN_PRODUCTS_PATH } from "./productos/paths";

export const metadata: Metadata = { title: "Panel de administración" };

export default function AdminHomePage() {
  return (
    <main className={styles.page}>
      {/* The session is read per request, so it streams behind a boundary. */}
      <Suspense fallback={<p>Cargando…</p>}>
        <AdminHome />
      </Suspense>
    </main>
  );
}

async function AdminHome() {
  await requireAdminSession();
  return (
    <>
      <h1>Panel de administración</h1>
      <nav>
        <Link href={ADMIN_PRODUCTS_PATH}>Productos</Link>
      </nav>
      <form action={logoutAction}>
        <button type="submit" className={styles.button}>
          Cerrar sesión
        </button>
      </form>
    </>
  );
}
