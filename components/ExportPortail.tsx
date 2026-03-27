"use client";

/**
 * F6-V2a — Export pre-formatted text for real estate portals.
 *
 * Dropdown to select a portal (LeBonCoin, SeLoger, Bien'ici),
 * preview formatted text with character counters,
 * copy-to-clipboard, and filtered ZIP download.
 *
 * All formatting is synchronous client-side — no API calls.
 */

import { useState, useCallback, useMemo } from "react";
import {
  formatForPortal,
  PORTAL_IDS,
  PORTAL_CONFIGS,
  getPhotoSortPriority,
  type PortalId,
  type PortalExport,
  type AnnonceData,
} from "@/lib/portal-formatter";

// ─── Types ───────────────────────────────────────────────────────────

interface ExportPortailPhoto {
  id: string;
  outputImageKey: string;
  roomType: string;
  roomLabel: string;
}

interface ExportPortailProps {
  title: string;
  description: string;
  surface: number | null;
  roomCount: number | null;
  price: number | null;
  city: string;
  propertyType: string;
  isCopro: boolean;
  coproLots?: number | null;
  coproChargesAnnuelles?: number | null;
  dpeClasse?: string | null;
  gesClasse?: string | null;
  photos: ExportPortailPhoto[];
  annonceUuid: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Character counter color based on usage percentage. */
function counterColor(current: number, max: number): string {
  const pct = current / max;
  if (pct > 0.95) return "text-red-600";
  if (pct > 0.8) return "text-amber-600";
  return "text-muted";
}

// ─── Component ───────────────────────────────────────────────────────

export default function ExportPortail({
  title,
  description,
  surface,
  roomCount,
  price,
  city,
  propertyType,
  isCopro,
  coproLots,
  coproChargesAnnuelles,
  dpeClasse,
  gesClasse,
  photos,
}: ExportPortailProps) {
  const [selectedPortal, setSelectedPortal] = useState<PortalId | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Build annonce data object for formatter
  const annonceData: AnnonceData = useMemo(
    () => ({
      title,
      description,
      surface,
      roomCount,
      price,
      city,
      propertyType,
      isCopro,
      coproLots,
      coproChargesAnnuelles,
      dpeClasse,
      gesClasse,
      totalPhotos: photos.length,
    }),
    [
      title, description, surface, roomCount, price, city, propertyType,
      isCopro, coproLots, coproChargesAnnuelles, dpeClasse, gesClasse,
      photos.length,
    ]
  );

  // Format for selected portal (synchronous, instant)
  const exported: PortalExport | null = useMemo(() => {
    if (!selectedPortal) return null;
    return formatForPortal(selectedPortal, annonceData);
  }, [selectedPortal, annonceData]);

  // ─── Clipboard ───────────────────────────────────────────────────

  const showCopied = useCallback((label: string) => {
    setCopied(label);
    setTimeout(() => setCopied(null), 3000);
  }, []);

  const handleCopyTitle = async () => {
    if (!exported) return;
    try {
      await navigator.clipboard.writeText(exported.title.text);
      showCopied("title");
    } catch {
      showCopied("title-fail");
    }
  };

  const handleCopyDescription = async () => {
    if (!exported) return;
    try {
      await navigator.clipboard.writeText(exported.description.text);
      showCopied("desc");
    } catch {
      showCopied("desc-fail");
    }
  };

  const handleCopyAll = async () => {
    if (!exported) return;
    try {
      await navigator.clipboard.writeText(exported.copyText);
      showCopied("all");
    } catch {
      showCopied("all-fail");
    }
  };

  // ─── ZIP download ────────────────────────────────────────────────

  const handleDownloadZip = async () => {
    if (!exported || isDownloading || photos.length === 0) return;
    setIsDownloading(true);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Sort photos by room priority and cap to portal limit
      const sorted = [...photos].sort(
        (a, b) => getPhotoSortPriority(a.roomType) - getPhotoSortPriority(b.roomType)
      );
      const capped = exported.portal.photosMaxCount != null
        ? sorted.slice(0, exported.portal.photosMaxCount)
        : sorted;

      // Fetch in batches of 5
      const batchSize = 5;
      for (let i = 0; i < capped.length; i += batchSize) {
        const batch = capped.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(async (photo, batchIdx) => {
            const res = await fetch(
              `/api/logs/image?path=${encodeURIComponent(photo.outputImageKey)}`
            );
            if (!res.ok) return;
            const blob = await res.blob();
            const idx = i + batchIdx + 1;
            const safeName = photo.roomLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
            zip.file(`${String(idx).padStart(2, "0")}_${safeName}.jpg`, blob);
          })
        );
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      const portalSlug = exported.portal.id;
      const citySlug = city ? slugify(city) : "bien";
      const surfaceTag = surface ? `${surface}m2` : "";
      a.download = `photos-${portalSlug}-${citySlug}${surfaceTag ? `-${surfaceTag}` : ""}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // ─── Portal selection ────────────────────────────────────────────

  const handleSelectPortal = (id: PortalId) => {
    setSelectedPortal(id);
    setDropdownOpen(false);
    setCopied(null);
  };

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div
      className="mt-6 pt-6 border-t border-foreground/5"
      data-testid="export-portail-section"
    >
      <h3 className="text-sm font-medium text-foreground mb-4">
        Exporter votre annonce
      </h3>

      {/* Dropdown */}
      <div className="relative mb-4" data-testid="export-portail-dropdown">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full sm:w-auto inline-flex items-center justify-between gap-2 text-sm bg-foreground/5 text-foreground px-4 py-3 rounded-xl font-light hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 min-w-56"
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
        >
          <span>
            {selectedPortal
              ? PORTAL_CONFIGS[selectedPortal].label
              : "Choisir un portail"}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {dropdownOpen && (
          <div
            className="absolute z-30 mt-1 w-full sm:w-56 bg-background border border-foreground/10 rounded-xl shadow-lg overflow-hidden"
            role="listbox"
          >
            {PORTAL_IDS.map((id) => (
              <button
                key={id}
                onClick={() => handleSelectPortal(id)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-foreground/5 transition-colors ${
                  selectedPortal === id
                    ? "bg-sage/5 text-sage font-medium"
                    : "text-foreground font-light"
                }`}
                role="option"
                aria-selected={selectedPortal === id}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-sage/70 mr-2" />
                {PORTAL_CONFIGS[id].label}
              </button>
            ))}
            {/* Logic-Immo — disabled */}
            <div
              className="w-full text-left px-4 py-2.5 text-sm text-muted/50 cursor-not-allowed"
              title="Disponible prochainement"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-foreground/10 mr-2" />
              Logic-Immo
              <span className="ml-2 text-xs text-muted/40 font-light">
                bientôt
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Preview — only shown when a portal is selected */}
      {exported && (
        <div
          className="space-y-4 animate-fade-in-up"
          data-testid="export-portail-preview"
        >
          {/* Title zone */}
          <div className="bg-foreground/[0.02] border border-foreground/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground uppercase tracking-wider">
                Titre
              </span>
              <span
                className={`text-xs font-light ${counterColor(exported.title.charCount, exported.title.maxChars)}`}
                data-testid="export-portail-char-counter-title"
              >
                {exported.title.charCount}/{exported.title.maxChars}
              </span>
            </div>
            <p className="text-sm text-foreground font-light leading-relaxed">
              {exported.title.text}
            </p>
            {exported.title.truncated && (
              <span className="inline-block mt-2 text-xs text-amber-600 bg-amber-600/10 px-2 py-0.5 rounded-full font-medium">
                Titre raccourci pour ce portail
              </span>
            )}
            <div className="mt-3">
              <button
                onClick={handleCopyTitle}
                className="text-xs text-sage hover:text-sage/80 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded-md px-2 py-3"
              >
                {copied === "title"
                  ? "Copié"
                  : copied === "title-fail"
                    ? "Copie échouée — sélectionnez le texte manuellement"
                    : "Copier le titre"}
              </button>
            </div>
          </div>

          {/* Description zone */}
          <div className="bg-foreground/[0.02] border border-foreground/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-foreground uppercase tracking-wider">
                Description
              </span>
              <span
                className={`text-xs font-light ${counterColor(exported.description.charCount, exported.description.maxChars)}`}
                data-testid="export-portail-char-counter-desc"
              >
                {exported.description.charCount}/{exported.description.maxChars}
              </span>
            </div>
            <div className="text-sm text-muted font-light leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
              {exported.description.text}
            </div>
            {exported.description.truncated && (
              <span className="inline-block mt-2 text-xs text-amber-600 bg-amber-600/10 px-2 py-0.5 rounded-full font-medium">
                Description raccourcie — vérifiez la fin
              </span>
            )}
            <div className="mt-3">
              <button
                onClick={handleCopyDescription}
                className="text-xs text-sage hover:text-sage/80 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded-md px-2 py-3"
              >
                {copied === "desc"
                  ? "Copié"
                  : copied === "desc-fail"
                    ? "Copie échouée — sélectionnez le texte manuellement"
                    : "Copier la description"}
              </button>
            </div>
          </div>

          {/* Structured fields zone — SeLoger / Bien'ici only */}
          {exported.structuredFields.length > 0 && (
            <div className="bg-foreground/[0.02] border border-foreground/5 rounded-xl p-4">
              <span className="text-xs font-medium text-foreground uppercase tracking-wider block mb-3">
                Champs à remplir dans le formulaire
              </span>
              <ul className="space-y-1.5">
                {exported.structuredFields.map((field) => (
                  <li
                    key={field.label}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="text-muted font-light min-w-[120px]">
                      {field.label} :
                    </span>
                    <span
                      className={
                        field.warning
                          ? "text-orange-500 font-medium"
                          : "text-foreground font-light"
                      }
                      title={field.tooltip || undefined}
                    >
                      {field.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Photo count warning */}
          {exported.photosCapped && (
            <div className="flex items-start gap-2 text-xs text-orange-500 bg-orange-500/5 border border-orange-500/10 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="font-light">
                {exported.portal.label} accepte {exported.portal.photosMaxCount} photos max
                {" "}&mdash; les {exported.photosIncluded} premières seront incluses dans le ZIP
              </span>
            </div>
          )}

          {/* No description warning */}
          {!description && (
            <div className="flex items-start gap-2 text-xs text-orange-500 bg-orange-500/5 border border-orange-500/10 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="font-light">
                Description manquante — à rédiger avant publication
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Copy all formatted text */}
            <button
              onClick={handleCopyAll}
              className="inline-flex items-center gap-2 text-xs bg-foreground text-background px-4 py-3 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              data-testid="export-portail-copy-btn"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              {copied === "all"
                ? `Texte ${exported.portal.label} copié`
                : copied === "all-fail"
                  ? "Copie échouée — sélectionnez le texte manuellement"
                  : `Copier le texte ${exported.portal.label}`}
            </button>

            {/* Download photos ZIP */}
            {photos.length > 0 && (
              <button
                onClick={handleDownloadZip}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 text-xs bg-foreground/5 text-foreground px-4 py-3 rounded-full font-light hover:bg-foreground/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                data-testid="export-portail-zip-btn"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {isDownloading
                  ? "Préparation du ZIP…"
                  : `Télécharger les photos (${exported.photosIncluded})`}
              </button>
            )}

            {photos.length === 0 && (
              <span className="text-xs text-muted font-light py-3">
                Aucune photo disponible
              </span>
            )}
          </div>

          {/* Portal notes (HYPOTHESE marker) */}
          {exported.portal.notes && (
            <p className="text-xs text-muted/50 font-light mt-2">
              {exported.portal.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
