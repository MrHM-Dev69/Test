import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  eslint: {
    // Type errors and lint are checked separately in CI; don't let a
    // stray warning block a production build.
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
