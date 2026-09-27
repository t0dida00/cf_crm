import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Dish photos and logos go to the shared Vercel Blob store, or to a
    // business's own storage (any host), which is passed through unoptimized.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    formats: ["image/avif", "image/webp"],
    // Upload URLs are unique per file (timestamped), so optimized copies never go stale.
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
};

export default nextConfig;
