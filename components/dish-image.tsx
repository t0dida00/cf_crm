"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";

const OPTIMIZED_HOST_SUFFIX = ".public.blob.vercel-storage.com";

function isOptimizable(src: string) {
  try {
    const { protocol, hostname } = new URL(src);
    return protocol === "https:" && hostname.endsWith(OPTIMIZED_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * A dish photo filling its (relative, sized) parent via next/image: resized to
 * the rendered size, served as AVIF/WebP and lazy-loaded. Images hosted
 * anywhere other than our Vercel Blob store (not allowed in next.config) are
 * passed through unoptimized. Renders `fallback` if the image fails to load.
 */
export function DishImage({
  src,
  alt,
  sizes,
  priority = false,
  fallback = null,
}: {
  src: string;
  alt: string;
  /** Rendered width, e.g. "(min-width: 640px) 100px, 80px". */
  sizes: string;
  /** Load eagerly — for the first few images visible without scrolling. */
  priority?: boolean;
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!isOptimizable(src)}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}
