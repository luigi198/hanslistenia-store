// Starts the E2E MongoDB before the app is built and served (Playwright runs
// webServer before globalSetup, so this is part of the webServer command).
import { e2eMongo } from "../test-support/mongo-container.ts";

await e2eMongo.start();
