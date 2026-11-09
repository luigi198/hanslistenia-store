import type { Metadata } from "next";
import { Suspense } from "react";
import styles from "./admin.module.css";
import { logoutAction } from "./actions";
import { requireAdminSession } from "./_lib/session";

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
      <p>Aquí podrá gestionar productos y pedidos.</p>
      <form action={logoutAction}>
        <button type="submit" className={styles.button}>
          Cerrar sesión
        </button>
      </form>
    </>
  );
}
