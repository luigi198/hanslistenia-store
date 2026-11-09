import { e2eMongo } from "../test-support/mongo-container";

export default function globalTeardown(): void {
  e2eMongo.stop();
}
