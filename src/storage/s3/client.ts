import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { getEnv } from "@/config/env";
import { globalSingleton } from "@/shared/global-singleton";

/**
 * Config every S3 client in the app shares. The SDK otherwise adds a CRC32
 * checksum to presigned PUT URLs, computed over an empty body, so S3 would
 * reject every browser upload of the real file.
 */
export const S3_CLIENT_DEFAULTS = {
  requestChecksumCalculation: "WHEN_REQUIRED",
} as const satisfies S3ClientConfig;

/** One S3 client per server instance; credentials come from validated env. */
export function getS3Client(): S3Client {
  return globalSingleton("s3-client", () => {
    const env = getEnv();
    return new S3Client({
      ...S3_CLIENT_DEFAULTS,
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
      // Local S3-compatible mocks only; they need path-style bucket URLs.
      ...(env.S3_ENDPOINT && {
        endpoint: env.S3_ENDPOINT,
        forcePathStyle: true,
      }),
    });
  });
}
