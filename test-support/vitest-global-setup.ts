import type { TestProject } from "vitest/node";
import { unitMongo } from "./mongo-container";

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

/**
 * Gives storage integration tests a real MongoDB: MONGODB_TEST_URI if set
 * (e.g. a CI service), otherwise a throwaway Docker container.
 */
export default async function setup(project: TestProject) {
  const external = process.env.MONGODB_TEST_URI;
  if (external) {
    project.provide("mongoUri", external);
    return;
  }
  await unitMongo.start();
  project.provide("mongoUri", unitMongo.uri);
  return () => unitMongo.stop();
}
