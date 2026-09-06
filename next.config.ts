import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Don't auto-generate AGENTS.md/CLAUDE.md into the repo on every dev/build.
  agentRules: false,
};

export default nextConfig;
