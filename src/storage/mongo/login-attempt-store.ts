import type { Collection, Db } from "mongodb";
import type { LoginAttemptStore } from "@/domain/ports/login-attempt-store";

export const LOGIN_ATTEMPTS_COLLECTION = "admin_login_attempts";

interface AttemptWindow {
  _id: string; // hashed key from the domain
  count: number;
  expiresAt: Date;
}

/**
 * Fixed-window attempt counters. A TTL index on `expiresAt` deletes closed
 * windows; since the TTL monitor only runs about once a minute, every read
 * and write also compares `expiresAt` with `now` itself.
 */
export class MongoLoginAttemptStore implements LoginAttemptStore {
  private ready: Promise<Collection<AttemptWindow>> | undefined;

  constructor(private readonly getDb: () => Promise<Db>) {}

  private collection(): Promise<Collection<AttemptWindow>> {
    this.ready ??= this.init().catch((error: unknown) => {
      this.ready = undefined; // retry index setup on the next call
      throw error;
    });
    return this.ready;
  }

  private async init(): Promise<Collection<AttemptWindow>> {
    const db = await this.getDb();
    const collection = db.collection<AttemptWindow>(LOGIN_ATTEMPTS_COLLECTION);
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    return collection;
  }

  async registerAttempt(
    key: string,
    now: Date,
    windowMs: number,
  ): Promise<number> {
    const collection = await this.collection();
    const windowOpen = { $gt: ["$expiresAt", now] };
    // One atomic pipeline upsert: increment an open window, or (re)start it
    // at 1 when none exists or the old one expired but isn't purged yet.
    const updated = await collection.findOneAndUpdate(
      { _id: key },
      [
        {
          $set: {
            count: { $cond: [windowOpen, { $add: ["$count", 1] }, 1] },
            expiresAt: {
              $cond: [
                windowOpen,
                "$expiresAt",
                new Date(now.getTime() + windowMs),
              ],
            },
          },
        },
      ],
      { upsert: true, returnDocument: "after" },
    );
    if (!updated) {
      // Unreachable: an upsert returning the post-image always has a document.
      throw new Error(`login attempt upsert returned no document`);
    }
    return updated.count;
  }

  async clearAttempts(key: string): Promise<void> {
    const collection = await this.collection();
    await collection.deleteOne({ _id: key });
  }
}
