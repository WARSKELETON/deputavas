import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Required for static export to GitHub Pages
  images: {
    unoptimized: true, // Required for static export (no server for image optimization)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "app.parlamento.pt",
      },
    ],
  },
};

export default nextConfig;
