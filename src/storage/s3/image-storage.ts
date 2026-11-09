import {
  DeleteObjectsCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ImageStorage } from "@/domain/ports/image-storage";

const UPLOAD_URL_TTL_SECONDS = 300;

export interface S3ImageStorageOptions {
  bucket: string;
  /** No trailing slash, e.g. https://<bucket>.s3.<region>.amazonaws.com */
  publicBaseUrl: string;
}

/** Product photos in the public-read bucket. */
export class S3ImageStorage implements ImageStorage {
  constructor(
    private readonly client: S3Client,
    private readonly options: S3ImageStorageOptions,
  ) {}

  createUploadUrl(
    key: string,
    contentType: string,
    bytes: number,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.options.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: bytes,
    });
    // Content-Type and Content-Length are signed, so S3 rejects an upload of
    // another type or size than the server approved.
    return getSignedUrl(this.client, command, {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
      signableHeaders: new Set(["content-type", "content-length"]),
    });
  }

  publicUrl(key: string): string {
    return `${this.options.publicBaseUrl}/${key}`;
  }

  async delete(keys: string[]): Promise<void> {
    if (!keys.length) return;
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.options.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}
