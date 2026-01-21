import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "app.parlamento.pt",
      },
    ],
  },
};

export default nextConfig;
