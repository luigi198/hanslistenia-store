import { MongoClient, type Db } from "mongodb";
import { getEnv } from "@/config/env";
import { getLogger } from "@/config/logger";
import { globalSingleton } from "@/shared/global-singleton";

/**
 * Memoizes one client per server instance. Concurrent callers share the same
 * in-flight connection; a failed attempt is forgotten so the next call retries.
 */
export function createMongoClientProvider<T>(
  connect: () => Promise<T>,
): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    pending ??= connect().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}

async function connectToAtlas(): Promise<MongoClient> {
  const logger = getLogger();
  const { MONGODB_URI } = getEnv();
  try {
    const client = await new MongoClient(MONGODB_URI, {
      appName: "hanslistenia-store",
    }).connect();
    logger.info("mongo_connected");
    return client;
  } catch (error) {
    logger.error("mongo_connect_failed", { error });
    throw error;
  }
}

export function getMongoClient(): Promise<MongoClient> {
  return globalSingleton("mongo-client", () =>
    createMongoClientProvider(connectToAtlas),
  )();
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getEnv().MONGODB_DB);
}
