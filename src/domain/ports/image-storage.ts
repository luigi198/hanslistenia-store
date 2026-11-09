/** Public-read storage for product photos. */
export interface ImageStorage {
  /**
   * Short-lived URL the browser can PUT one file to. The upload must match
   * the given content type and exact byte size, or storage rejects it.
   */
  createUploadUrl(
    key: string,
    contentType: string,
    bytes: number,
  ): Promise<string>;
  /** Permanent public URL for displaying the image. */
  publicUrl(key: string): string;
  delete(keys: string[]): Promise<void>;
}
