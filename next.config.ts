import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Ensure Turbopack can read system certificates when fetching Google Fonts during builds
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
