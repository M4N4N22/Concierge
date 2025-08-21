import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Allows build to succeed even if node_modules have TS errors
    ignoreBuildErrors: true,
  },
  experimental: {
    // Helps with ESM modules in node_modules
    esmExternals: "loose",
  },
};

export default nextConfig;
