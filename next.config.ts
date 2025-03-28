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
  reactStrictMode: true
};

export default nextConfig;
