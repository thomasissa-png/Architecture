"use client";

/**
 * ShareButtons — Copy link, WhatsApp/native share buttons.
 * Reused on both /annonce and /dossier public pages for consistency.
 */

import { useState, useEffect, useCallback } from "react";

interface ShareButtonsProps {
  /** Full path to share, e.g. "/dossier/abc123" */
  sharePath: string;
  /** Label for the share dialog title */
  shareTitle?: string;
}

export default function ShareButtons({
  sharePath,
  shareTitle = "Partager",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${sharePath}`
      : sharePath;

  const showCopied = useCallback(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const [copyError, setCopyError] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showCopied();
      setCopyError(false);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  const handleShare = () => {
    if (canShare) {
      navigator
        .share({ title: shareTitle, url: shareUrl })
        .catch(() => {
          window.open(
            `https://wa.me/?text=${encodeURIComponent(shareUrl)}`,
            "_blank"
          );
        });
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareUrl)}`,
        "_blank"
      );
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 text-xs bg-foreground text-background px-4 py-3 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
        data-testid="share-copy-link"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374"
          />
        </svg>
        {copied ? "Copie !" : copyError ? "Impossible de copier" : "Copier le lien"}
      </button>

      {/* WhatsApp / Native share */}
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-2 text-xs bg-[#25D366]/10 text-[#25D366] px-4 py-3 rounded-full font-medium hover:bg-[#25D366]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
        data-testid="share-whatsapp"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.918.918l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.508-.693-6.34-1.884l-.442-.277-2.633.883.883-2.633-.277-.442A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
        {canShare ? "Partager" : "WhatsApp"}
      </button>
    </div>
  );
}
