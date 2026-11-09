import type { NextConfig } from "next";
import { PRODUCT_IMAGE_PREFIX } from "./src/domain/products/product";

// Product photos are served from the public bucket (or a CDN in front).
// Read at build time; validated at server start by src/config/env.ts.
const productImagesBase = process.env.S3_PRODUCTS_PUBLIC_URL?.replace(
  /\/+$/,
  "",
);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: productImagesBase
      ? [new URL(`${productImagesBase}/${PRODUCT_IMAGE_PREFIX}**`)]
      : [],
  },
  async headers() {
    return [
      {
        // `:path*` also matches /admin itself.
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
