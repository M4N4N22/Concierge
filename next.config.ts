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
  async redirects() {
    return [
      {
        source: "/dashboard/vault/chat",
        destination: "/dashboard/advisor/talk",
        permanent: false,
      },
      {
        source: "/dashboard/advisor/trade",
        destination: "/dashboard/trading/desk",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
