"use server";

import { redirect } from "next/navigation";
import { getAdminAuthService } from "@/composition/admin-auth";
import { getLogger } from "@/config/logger";
import { lockoutMinutes } from "@/domain/auth/login-policy";
import { getClientIp } from "../_lib/client-ip";
import { startAdminSession } from "../_lib/session";
import { parseLoginInput } from "./login-input";

export interface LoginFormState {
  error: string | null;
}

const MESSAGES = {
  invalid_input: "Ingrese su usuario y contraseña.",
  invalid_credentials: "Usuario o contraseña incorrectos.",
  locked_out: `Demasiados intentos fallidos. Espere hasta ${lockoutMinutes()} minutos e intente de nuevo.`,
  unavailable: "No se pudo iniciar sesión. Intente de nuevo en unos minutos.",
} as const;

export async function loginAction(
  _previous: LoginFormState,
  form: FormData,
): Promise<LoginFormState> {
  const input = parseLoginInput(form);
  if (!input) return { error: MESSAGES.invalid_input };

  let result;
  try {
    result = await getAdminAuthService().login({
      ...input,
      clientIp: await getClientIp(),
    });
  } catch (error) {
    // Detailed cause goes to the logs only; the user sees a generic message.
    getLogger().error("admin_login_error", { error });
    return { error: MESSAGES.unavailable };
  }

  if (!result.ok) return { error: MESSAGES[result.reason] };

  await startAdminSession(result.session);
  redirect("/admin"); // throws; must stay outside the try/catch above
}
