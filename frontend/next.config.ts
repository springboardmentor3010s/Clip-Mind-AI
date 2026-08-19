import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables the standalone server output the Docker image runs (node server.js),
  // instead of requiring the full node_modules tree at runtime.
  output: "standalone",
};

export default nextConfig;
