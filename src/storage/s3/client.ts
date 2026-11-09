import { S3Client } from "@aws-sdk/client-s3";
import { getEnv } from "@/config/env";
import { globalSingleton } from "@/shared/global-singleton";

/** One S3 client per server instance; credentials come from validated env. */
export function getS3Client(): S3Client {
  return globalSingleton("s3-client", () => {
    const env = getEnv();
    return new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  });
}
