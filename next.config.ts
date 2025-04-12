import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false
    };
    return config
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // Suppress TypeScript errors during builds
  },
  eslint: {
    ignoreDuringBuilds: true, // Suppress ESLint errors during builds
  },

};

export default nextConfig;
