import { execFileSync } from "node:child_process";
import { MongoClient } from "mongodb";

// Throwaway MongoDB containers for tests. Requires Docker. Ports avoid
// 27017/27018, which other local projects commonly use.
const IMAGE = "mongo:8";
const MONGO_CONTAINER_PORT = 27017;
const READY_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 500;

export interface MongoContainer {
  uri: string;
  /** Starts a fresh, empty container (removing any leftover of the same name). */
  start(): Promise<void>;
  stop(): void;
}

function docker(...args: string[]): void {
  execFileSync("docker", args, { stdio: "ignore" });
}

async function waitUntilReachable(uri: string): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  for (;;) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: RETRY_DELAY_MS,
    });
    try {
      await client.db("admin").command({ ping: 1 });
      return;
    } catch (error) {
      if (Date.now() > deadline) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    } finally {
      await client.close();
    }
  }
}

export function mongoContainer(name: string, port: number): MongoContainer {
  const uri = `mongodb://127.0.0.1:${port}`;
  const stop = () => {
    try {
      docker("rm", "--force", name);
    } catch {
      // Not running: nothing to stop.
    }
  };
  return {
    uri,
    stop,
    async start() {
      stop();
      docker(
        "run",
        "--detach",
        "--rm",
        "--name",
        name,
        "--publish",
        `127.0.0.1:${port}:${MONGO_CONTAINER_PORT}`,
        IMAGE,
      );
      await waitUntilReachable(uri);
    },
  };
}

/** Used by Playwright: the E2E server's database. */
export const e2eMongo = mongoContainer("hl-mongo-e2e", 27120);
/** Used by Vitest: storage integration tests. */
export const unitMongo = mongoContainer("hl-mongo-unit", 27121);
