import { AdminAuthService } from "@/domain/auth/admin-auth-service";
import { getEnv } from "@/config/env";
import { getLogger } from "@/config/logger";
import { globalSingleton } from "@/shared/global-singleton";
import { getDb } from "@/storage/mongo/client";
import { MongoLoginAttemptStore } from "@/storage/mongo/login-attempt-store";

/** The admin auth service wired to env credentials and Mongo. Server-only. */
export function getAdminAuthService(): AdminAuthService {
  return globalSingleton("admin-auth-service", () => {
    const env = getEnv();
    return new AdminAuthService({
      credentials: {
        username: env.ADMIN_USERNAME,
        passwordHash: env.ADMIN_PASSWORD_HASH,
      },
      sessionSecret: env.SESSION_SECRET,
      attempts: new MongoLoginAttemptStore(getDb),
      logger: getLogger(),
    });
  });
}
