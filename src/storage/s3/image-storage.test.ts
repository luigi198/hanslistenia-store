import { S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it } from "vitest";
import { S3_CLIENT_DEFAULTS } from "./client";
import { S3ImageStorage } from "./image-storage";

const KEY = "products/0b6f1c9e-5a7d-4c3e-9f2a-1d2e3f4a5b6c.jpg";

interface Recorded {
  method: string;
  path: string;
  query: Record<string, unknown>;
  body: string;
}

/** Real SDK client whose HTTP layer records requests instead of sending them. */
function recordingClient(status = 200) {
  const requests: Recorded[] = [];
  const client = new S3Client({
    ...S3_CLIENT_DEFAULTS,
    region: "us-east-1",
    credentials: { accessKeyId: "AKIDTEST", secretAccessKey: "secret" },
    requestHandler: {
      async handle(request: {
        method: string;
        path: string;
        query?: Record<string, unknown>;
        body?: unknown;
      }) {
        requests.push({
          method: request.method,
          path: request.path,
          query: request.query ?? {},
          body: String(request.body ?? ""),
        });
        const body = `<?xml version="1.0" encoding="UTF-8"?><DeleteResult></DeleteResult>`;
        return {
          response: {
            statusCode: status,
            headers: { "content-type": "application/xml" },
            body: new Response(body).body,
          },
        };
      },
    },
  });
  return { client, requests };
}

function storage(client = recordingClient().client) {
  return new S3ImageStorage(client, {
    bucket: "hl-products",
    publicBaseUrl: "https://cdn.example.com",
  });
}

describe("S3ImageStorage", () => {
  it("presigns a short-lived PUT bound to content type and exact size", async () => {
    const url = new URL(
      await storage().createUploadUrl(KEY, "image/jpeg", 123_456),
    );
    expect(url.pathname).toContain(KEY);
    expect(url.hostname).toContain("hl-products");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    const signed = url.searchParams.get("X-Amz-SignedHeaders")?.split(";");
    expect(signed).toEqual(
      expect.arrayContaining(["content-length", "content-type", "host"]),
    );
  });

  it("adds no body checksum, which a browser upload of the real file would fail", async () => {
    const url = new URL(
      await storage().createUploadUrl(KEY, "image/jpeg", 123_456),
    );
    const checksumParams = [...url.searchParams.keys()].filter((k) =>
      /checksum/i.test(k),
    );
    expect(checksumParams).toEqual([]);
  });

  it("builds public URLs from the configured base", () => {
    expect(storage().publicUrl(KEY)).toBe(`https://cdn.example.com/${KEY}`);
  });

  it("deletes all given keys in one request", async () => {
    const { client, requests } = recordingClient();
    await storage(client).delete([KEY, "products/other.png"]);
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("POST");
    expect(requests[0].query).toHaveProperty("delete");
    expect(requests[0].body).toContain(`<Key>${KEY}</Key>`);
    expect(requests[0].body).toContain("<Key>products/other.png</Key>");
  });

  it("does nothing for an empty list", async () => {
    const { client, requests } = recordingClient();
    await storage(client).delete([]);
    expect(requests).toHaveLength(0);
  });

  it("propagates S3 errors", async () => {
    const { client } = recordingClient(500);
    await expect(storage(client).delete([KEY])).rejects.toThrow();
  });
});
