"use client";

/**
 * F6 — Annonce public view: action buttons (copy link, copy description, WhatsApp, ZIP download).
 * Client component for interactivity on the public annonce page.
 */

import { useState, useEffect, useCallback } from "react";

interface AnnoncePhoto {
  id: string;
  outputImageKey: string;
  roomLabel: string;
}

interface AnnoncePublicViewProps {
  annonceUuid: string;
  description: string;
  photos: AnnoncePhoto[];
  city?: string | null;
  surfaceM2?: number | null;
  contactEmail?: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AnnoncePublicView({
  annonceUuid,
  description,
  photos,
  city,
  surfaceM2,
  contactEmail,
}: AnnoncePublicViewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [emailRevealed, setEmailRevealed] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const annonceUrl = typeof window !== "undefined"
    ? `${window.location.origin}/annonce/${annonceUuid}`
    : `/annonce/${annonceUuid}`;

  const showCopied = useCallback((label: string) => {
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS or iframe) — no fallback since execCommand is deprecated
      return false;
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(annonceUrl);
    showCopied(ok ? "link" : "link-fail");
  };

  const handleCopyDescription = async () => {
    if (!description) return;
    const textWithDisclaimer = `${description}\n\n— Visuels generés par intelligence artificielle a des fins de projection, non contractuels.`;
    const ok = await copyToClipboard(textWithDisclaimer);
    showCopied(ok ? "desc" : "desc-fail");
  };

  const handleWhatsApp = () => {
    if (canShare) {
      navigator.share({
        title: "Annonce immobiliere",
        url: annonceUrl,
      }).catch(() => {
        // User cancelled or error — fallback to WhatsApp URL
        window.open(
          `https://wa.me/?text=${encodeURIComponent(annonceUrl)}`,
          "_blank"
        );
      });
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(annonceUrl)}`,
        "_blank"
      );
    }
  };

  const handleDownloadZip = async () => {
    if (isDownloading || photos.length === 0) return;
    setIsDownloading(true);

    try {
      // Dynamic import to keep bundle light
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Fetch all photos in parallel (max 5 concurrent)
      const batchSize = 5;
      for (let i = 0; i < photos.length; i += batchSize) {
        const batch = photos.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (photo, batchIdx) => {
            const res = await fetch(
              `/api/logs/image?path=${encodeURIComponent(photo.outputImageKey)}`
            );
            if (!res.ok) return null;
            const blob = await res.blob();
            const idx = i + batchIdx + 1;
            const safeName = photo.roomLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
            zip.file(`${String(idx).padStart(2, "0")}_${safeName}.jpg`, blob);
            return true;
          })
        );
        // Continue even if some fail
        const _ok = results.filter((r) => r.status === "fulfilled");
        void _ok;
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      const zipName = city && surfaceM2
        ? `annonce-${slugify(city)}-${surfaceM2}m2-photos.zip`
        : `annonce-${annonceUuid.slice(0, 8)}-photos.zip`;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP download failed:", err);
      setZipError("Erreur lors du telechargement. Veuillez reessayer.");
      setTimeout(() => setZipError(null), 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3" data-testid="annonce-actions">
      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 text-xs bg-foreground text-background px-4 py-3 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
        data-testid="annonce-copy-link"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
        </svg>
        {copied === "link" ? "Copie !" : copied === "link-fail" ? "Copie impossible" : "Copier le lien"}
      </button>

      {/* Copy description */}
      {description && (
        <button
          onClick={handleCopyDescription}
          className="inline-flex items-center gap-2 text-xs bg-foreground/5 text-foreground px-4 py-3 rounded-full font-light hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
          data-testid="annonce-copy-desc"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          {copied === "desc" ? "Copie !" : copied === "desc-fail" ? "Copie impossible" : "Copier la description"}
        </button>
      )}

      {/* WhatsApp / Share */}
      <button
        onClick={handleWhatsApp}
        className="inline-flex items-center gap-2 text-xs bg-[#25D366]/10 text-[#25D366] px-4 py-3 rounded-full font-medium hover:bg-[#25D366]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
        data-testid="annonce-whatsapp"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.918.918l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.508-.693-6.34-1.884l-.442-.277-2.633.883.883-2.633-.277-.442A9.958 9.958 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
        {canShare ? "Partager" : "WhatsApp"}
      </button>

      {/* Download ZIP */}
      <button
        onClick={handleDownloadZip}
        disabled={isDownloading}
        className="inline-flex items-center gap-2 text-xs bg-foreground/5 text-foreground px-4 py-3 rounded-full font-light hover:bg-foreground/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
        data-testid="annonce-download-zip"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        {isDownloading ? "Telechargement..." : `Telecharger les photos (${photos.length})`}
      </button>

      {/* ZIP error feedback */}
      {zipError && (
        <p className="w-full text-xs text-red-500 font-medium mt-1" role="alert">
          {zipError}
        </p>
      )}

      {/* Email click-to-reveal */}
      {contactEmail && (
        <div className="w-full mt-2">
          {emailRevealed ? (
            <a
              href={`mailto:${contactEmail}`}
              className="text-sm text-muted font-light hover:text-foreground transition-colors"
              data-testid="annonce-email-revealed"
            >
              {contactEmail}
            </a>
          ) : (
            <button
              onClick={() => setEmailRevealed(true)}
              className="inline-flex items-center gap-2 text-xs bg-foreground/5 text-foreground px-4 py-3 rounded-full font-light hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              data-testid="annonce-reveal-email"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Afficher l&apos;email
            </button>
          )}
        </div>
      )}
    </div>
  );
}
