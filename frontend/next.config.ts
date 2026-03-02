import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isProd ? "/multi-round-avalon-agents" : "",
  assetPrefix: isProd ? "/multi-round-avalon-agents/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
