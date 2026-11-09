import type { Metadata } from "next";
import styles from "../admin.module.css";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Acceso de administración" };

export default function AdminLoginPage() {
  return (
    <main className={styles.page}>
      <h1>Acceso de administración</h1>
      <LoginForm />
    </main>
  );
}
