"use client";

import { useActionState } from "react";
import styles from "../admin.module.css";
import { loginAction, type LoginFormState } from "./actions";

const INITIAL_STATE: LoginFormState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className={styles.form}>
      <label className={styles.field}>
        Usuario
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
        />
      </label>
      <label className={styles.field}>
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <p role="alert" aria-live="polite" className={styles.error}>
        {state.error}
      </p>
      <button type="submit" disabled={pending} className={styles.button}>
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
