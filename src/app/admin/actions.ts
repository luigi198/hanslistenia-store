"use server";

import { redirect } from "next/navigation";
import { getLogger } from "@/config/logger";
import {
  ADMIN_LOGIN_PATH,
  endAdminSession,
  getAdminSession,
} from "./_lib/session";

export async function logoutAction(): Promise<void> {
  // Re-checked like every admin action: only a real session logs a logout.
  // Clearing the cookie is harmless either way, so it always happens.
  const session = await getAdminSession();
  await endAdminSession();
  if (session) getLogger().info("admin_logout");
  redirect(ADMIN_LOGIN_PATH);
}
