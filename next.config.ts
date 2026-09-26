import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Dish photos and logos are uploaded to Vercel Blob (app/api/upload).
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    formats: ["image/avif", "image/webp"],
    // Upload URLs are unique per file (timestamped), so optimized copies never go stale.
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
};

export default nextConfig;
