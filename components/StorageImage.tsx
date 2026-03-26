"use client";

import { useState, useCallback, useRef } from "react";

interface StorageImageProps {
  imageKey: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  fallback?: React.ReactNode;
}

const DEFAULT_FALLBACK = (
  <div className="w-full h-full bg-foreground/5 flex items-center justify-center">
    <svg
      className="w-8 h-8 text-muted/30"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
      />
    </svg>
  </div>
);

/**
 * StorageImage -- displays an image from Replit Object Storage via /api/logs/image.
 *
 * - Shows fallback if imageKey is null/undefined/empty
 * - Retries once after 1s on error, then shows fallback
 * - Hidden until loaded to avoid broken image icons
 */
export default function StorageImage({
  imageKey,
  alt,
  className,
  loading = "lazy",
  fallback = DEFAULT_FALLBACK,
}: StorageImageProps) {
  const [failed, setFailed] = useState(false);
  const retriedRef = useRef(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleError = useCallback(() => {
    if (!retriedRef.current) {
      retriedRef.current = true;
      // Retry once after 1s
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.src = `/api/logs/image?path=${encodeURIComponent(imageKey || "")}&t=${Date.now()}`;
        }
      }, 1000);
    } else {
      setFailed(true);
    }
  }, [imageKey]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  // No key or empty string -- show fallback immediately
  if (!imageKey || failed) {
    return <>{fallback}</>;
  }

  const src = `/api/logs/image?path=${encodeURIComponent(imageKey)}`;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  );
}
