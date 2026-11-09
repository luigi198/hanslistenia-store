import { io } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuthService } from "@/composition/admin-auth";
import type { IssuedSession, SessionClaims } from "@/domain/auth/session-token";

// `__Host-` makes the browser refuse the cookie unless it is Secure, has
// Path=/ and no Domain, so a subdomain can never overwrite it.
const SESSION_COOKIE = "__Host-hl_admin";
export const ADMIN_LOGIN_PATH = "/admin/login";

/** The current admin session, or null. Never redirects. */
export async function getAdminSession(): Promise<SessionClaims | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  // Verifying reads the clock; with partial prefetching a runtime prerender
  // has cookies but no stable time, so suspend there. No-op on real requests.
  await io();
  return getAdminAuthService().verifySession(token);
}

/**
 * Gate for every admin page, server action and route handler: returns the
 * session or redirects to the login page. Call it server-side in each one;
 * a layout check alone does not protect actions or nested segments.
 */
export async function requireAdminSession(): Promise<SessionClaims> {
  const session = await getAdminSession();
  if (!session) redirect(ADMIN_LOGIN_PATH);
  return session;
}

/** Server actions / route handlers only (cookies can't be set while rendering). */
export async function startAdminSession(session: IssuedSession): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    expires: session.expiresAt,
  });
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete({
    name: SESSION_COOKIE,
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "strict",
  });
}
