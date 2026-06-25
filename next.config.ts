import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // No rewrites, no API routes. Static export only.
};

export default nextConfig;
