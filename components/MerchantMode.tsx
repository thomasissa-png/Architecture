"use client";

/**
 * F4 — Mode Marchand: Main component.
 *
 * Multi-step flow:
 * 1. Property info (name, address, surface, price, type)
 * 2. Upload photos (max 15, drag & drop)
 * 3. Global style selection + per-photo override
 * 4. Generate batch
 * 5. View results + download PDF + share link
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import UploadZone from "@/components/UploadZone";
import StylePicker, { StyleOption } from "@/components/StylePicker";
import DossierProgress from "@/components/DossierProgress";
import DossierResult from "@/components/DossierResult";
import { processImage } from "@/lib/image-utils";

// ─── Types ───────────────────────────────────────────────────────────

interface PhotoEntry {
  file: File;
  roomLabel: string;
  roomTypeId: string | null;
  styleOverride: StyleOption | null; // null = use global style
  isOutdoor: boolean;
  outdoorStyleId: string | null;
}

interface DossierPhotoStatus {
  id: number;
  photoIndex: number;
  roomLabel: string | null;
  status: "pending" | "generating" | "completed" | "failed";
  errorMessage: string | null;
  inputImageKey: string | null;
  outputImageKey: string | null;
  styleId: string | null;
}

type MerchantStep = "info" | "photos" | "style" | "review" | "generating" | "results";

const BIEN_TYPES = [
  { id: "appartement", label: "Appartement" },
  { id: "maison", label: "Maison" },
  { id: "loft", label: "Loft" },
  { id: "studio", label: "Studio" },
  { id: "duplex", label: "Duplex" },
  { id: "bureau", label: "Bureau commercial" },
];

const MAX_PHOTOS = 15;

// ─── Component ───────────────────────────────────────────────────────

export default function MerchantMode() {
  const { data: session } = useSession();

  // Step state
  const [currentStep, setCurrentStep] = useState<MerchantStep>("info");

  // Property info
  const [bienNom, setBienNom] = useState("");
  const [bienAdresse, setBienAdresse] = useState("");
  const [bienSurface, setBienSurface] = useState("");
  const [bienPrix, setBienPrix] = useState("");
  const [bienType, setBienType] = useState("");

  // Photos
  const [files, setFiles] = useState<File[]>([]);
  const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>([]);

  // Global style
  const [globalStyle, setGlobalStyle] = useState<StyleOption | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");

  // Dossier state
  const [dossierUuid, setDossierUuid] = useState<string | null>(null);
  const [dossierPhotos, setDossierPhotos] = useState<DossierPhotoStatus[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationElapsed, setGenerationElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Poll interval ref
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── Timer ──
  useEffect(() => {
    if (!isGenerating) {
      setGenerationElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setGenerationElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // ── Sync files → photoEntries ──
  useEffect(() => {
    setPhotoEntries((prev) => {
      const next: PhotoEntry[] = files.map((file) => {
        const existing = prev.find((p) => p.file === file);
        if (existing) return existing;
        return {
          file,
          roomLabel: "",
          roomTypeId: null,
          styleOverride: null,
          isOutdoor: false,
          outdoorStyleId: null,
        };
      });
      return next;
    });
  }, [files]);

  // ── Stable preview URLs ──
  const previewUrls = useMemo(() => {
    return files.map((f) => URL.createObjectURL(f));
  }, [files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // ── Polling for generation progress ──
  const startPolling = useCallback((uuid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    const poll = async () => {
      try {
        const res = await fetch(`/api/dossier/${uuid}`);
        if (!res.ok) return;

        const { dossier, photos } = await res.json();
        setDossierPhotos(photos);

        // Check if generation is complete
        const allDone = photos.every(
          (p: DossierPhotoStatus) => p.status === "completed" || p.status === "failed"
        );

        if (allDone || dossier.status === "completed" || dossier.status === "partial") {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setIsGenerating(false);
          setCurrentStep("results");
        }
      } catch {
        // Silently retry on next interval
      }
    };

    // Initial poll immediately
    poll();
    // Then every 3 seconds
    pollRef.current = setInterval(poll, 3000);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ── Create dossier + upload + generate ──
  const handleGenerate = useCallback(async () => {
    if (!session?.user?.id) {
      setError("Connexion requise pour utiliser le Mode Marchand.");
      return;
    }

    if (files.length === 0) {
      setError("Ajoutez au moins une photo.");
      return;
    }

    if (!globalStyle && !customPrompt.trim()) {
      setError("Selectionnez un style.");
      return;
    }

    setError(null);
    setCurrentStep("generating");
    setIsGenerating(true);

    try {
      // Step 1: Create dossier
      const createRes = await fetch("/api/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bienNom: bienNom.trim() || null,
          bienAdresse: bienAdresse.trim() || null,
          bienSurface: bienSurface ? Number(bienSurface) : null,
          bienPrix: bienPrix ? Number(bienPrix) : null,
          bienType: bienType || null,
          globalStyleId: globalStyle?.id || "custom",
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || "Erreur lors de la creation du dossier.");
      }

      const { dossier } = await createRes.json();
      setDossierUuid(dossier.uuid);

      // Step 2: Process and upload photos
      const processedPhotos = await Promise.all(
        files.map(async (file, index) => {
          const processed = await processImage(file);
          return {
            ...processed,
            index,
            entry: photoEntries[index],
          };
        })
      );

      const uploadRes = await fetch(`/api/dossier/${dossier.uuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: processedPhotos.map((p) => ({
            image: p.base64,
            roomLabel: p.entry?.roomLabel || `Photo ${p.index + 1}`,
            roomTypeId: p.entry?.roomTypeId || null,
            styleId: p.entry?.styleOverride?.id || globalStyle?.id || "custom",
            isOutdoor: p.entry?.isOutdoor || false,
            photoIndex: p.index,
          })),
        }),
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || "Erreur lors de l'upload des photos.");
      }

      // Step 3: Launch batch generation
      const genRes = await fetch(`/api/dossier/${dossier.uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });

      if (!genRes.ok) {
        const data = await genRes.json();
        throw new Error(data.error || "Erreur lors du lancement de la generation.");
      }

      // Step 4: Poll for progress
      startPolling(dossier.uuid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setIsGenerating(false);
      setCurrentStep("review");
    }
  }, [session, files, photoEntries, globalStyle, customPrompt, bienNom, bienAdresse, bienSurface, bienPrix, bienType, startPolling]);

  // ── Regenerate single photo ──
  const handleRegenerate = useCallback(async (photoId: number) => {
    if (!dossierUuid) return;
    setIsRegenerating(photoId);

    try {
      const res = await fetch(`/api/dossier/${dossierUuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate",
          regeneratePhotoId: photoId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de la regeneration.");
        return;
      }

      // Refresh photos
      const detailRes = await fetch(`/api/dossier/${dossierUuid}`);
      if (detailRes.ok) {
        const { photos } = await detailRes.json();
        setDossierPhotos(photos);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la regeneration.");
    } finally {
      setIsRegenerating(null);
    }
  }, [dossierUuid]);

  // ── Download PDF ──
  const handleDownloadPdf = useCallback(() => {
    if (!dossierUuid) return;
    window.open(`/api/dossier/${dossierUuid}/pdf`, "_blank");
  }, [dossierUuid]);

  // ── Share link ──
  const handleShareLink = useCallback(async () => {
    if (!dossierUuid) return;
    const shareUrl = `${window.location.origin}/dossier/${dossierUuid}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [dossierUuid]);

  // ── Update photo entry ──
  const updatePhotoEntry = useCallback((index: number, updates: Partial<PhotoEntry>) => {
    setPhotoEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }, []);

  // ── Derived ──
  const bienTitle = bienNom.trim() || `Bien sans titre — ${new Date().toLocaleDateString("fr-FR")}`;
  const creditsNeeded = files.length;

  // ─── RENDER ────────────────────────────────────────────────────────

  return (
    <div className="space-y-8" data-testid="merchant-mode">
      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600 font-light" data-testid="merchant-error">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 text-red-400 hover:text-red-600"
          >
            Fermer
          </button>
        </div>
      )}

      {/* ── Step: Property Info ── */}
      {currentStep === "info" && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-info">
          <div>
            <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-widest mb-4">
              Informations du bien
            </h3>
            <p className="text-xs text-[var(--muted)]/60 font-light mb-6">
              Optionnel — ces informations apparaitront sur le PDF et la page partageable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                Nom du bien
              </label>
              <input
                type="text"
                value={bienNom}
                onChange={(e) => setBienNom(e.target.value)}
                placeholder="Ex : 45 rue de la Paix — T3 renove"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors placeholder:text-[var(--foreground)]/30"
                data-testid="merchant-bien-nom"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                Adresse
              </label>
              <input
                type="text"
                value={bienAdresse}
                onChange={(e) => setBienAdresse(e.target.value)}
                placeholder="Ex : 45 rue de la Paix, 75002 Paris"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors placeholder:text-[var(--foreground)]/30"
                data-testid="merchant-bien-adresse"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                Surface (m2)
              </label>
              <input
                type="number"
                value={bienSurface}
                onChange={(e) => setBienSurface(e.target.value)}
                placeholder="65"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors placeholder:text-[var(--foreground)]/30"
                data-testid="merchant-bien-surface"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                Prix (EUR)
              </label>
              <input
                type="number"
                value={bienPrix}
                onChange={(e) => setBienPrix(e.target.value)}
                placeholder="350000"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm font-light focus:border-[var(--foreground)] focus:outline-none transition-colors placeholder:text-[var(--foreground)]/30"
                data-testid="merchant-bien-prix"
              />
            </div>
          </div>

          {/* Property type */}
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-2 block">
              Type de bien
            </label>
            <div className="flex flex-wrap gap-2">
              {BIEN_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setBienType(bienType === type.id ? "" : type.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                    bienType === type.id
                      ? "bg-[var(--sage)] text-white"
                      : "bg-gray-100 text-[var(--muted)] hover:bg-gray-200"
                  }`}
                  data-testid={`merchant-bien-type-${type.id}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Next button */}
          <div className="pt-4">
            <button
              onClick={() => setCurrentStep("photos")}
              className="w-full sm:w-auto px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
              data-testid="merchant-next-photos"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Photos ── */}
      {currentStep === "photos" && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-photos">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-widest mb-1">
                Photos du bien
              </h3>
              <p className="text-xs text-[var(--muted)]/60 font-light">
                Jusqu&apos;a {MAX_PHOTOS} photos — 1 credit par photo
              </p>
            </div>
            <button
              onClick={() => setCurrentStep("info")}
              className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors"
            >
              Retour
            </button>
          </div>

          <UploadZone
            files={files}
            onFilesChange={setFiles}
            maxFiles={MAX_PHOTOS}
          />

          {/* Per-photo labels */}
          {files.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--muted)] font-medium">
                Nommez vos pieces (optionnel)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrls[index]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Label input */}
                    <input
                      type="text"
                      value={photoEntries[index]?.roomLabel || ""}
                      onChange={(e) =>
                        updatePhotoEntry(index, { roomLabel: e.target.value })
                      }
                      placeholder={`Photo ${index + 1} — ex: Salon, Chambre 1`}
                      className="flex-1 text-sm font-light border-0 bg-transparent focus:outline-none placeholder:text-[var(--foreground)]/25"
                      data-testid={`merchant-photo-label-${index}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          {files.length > 0 && (
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => setCurrentStep("style")}
                className="px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
                data-testid="merchant-next-style"
              >
                Choisir le style
              </button>
              <span className="text-xs text-[var(--muted)] font-light">
                {files.length} photo{files.length > 1 ? "s" : ""} — {files.length} credit{files.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Step: Style ── */}
      {currentStep === "style" && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-style">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-widest mb-1">
                Style global
              </h3>
              <p className="text-xs text-[var(--muted)]/60 font-light">
                Applique a toutes les photos. Vous pourrez personnaliser par piece ensuite.
              </p>
            </div>
            <button
              onClick={() => setCurrentStep("photos")}
              className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors"
            >
              Retour
            </button>
          </div>

          <StylePicker
            selectedStyle={globalStyle}
            customPrompt={customPrompt}
            onStyleSelect={setGlobalStyle}
            onCustomPromptChange={setCustomPrompt}
            isOutdoor={false}
            selectedOutdoorStyle={null}
            onSelectOutdoorStyle={() => {}}
          />

          {/* Navigation */}
          {(globalStyle || customPrompt.trim()) && (
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => setCurrentStep("review")}
                className="px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
                data-testid="merchant-next-review"
              >
                Voir le recapitulatif
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step: Review ── */}
      {currentStep === "review" && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-review">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-widest">
              Recapitulatif
            </h3>
            <button
              onClick={() => setCurrentStep("style")}
              className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors"
            >
              Retour
            </button>
          </div>

          <div className="border border-[var(--border)] rounded-2xl p-5 space-y-4">
            {/* Property summary */}
            <div>
              <h4 className="text-base font-semibold text-[var(--foreground)]">
                {bienTitle}
              </h4>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)] font-light mt-1">
                {bienAdresse && <span>{bienAdresse}</span>}
                {bienType && <span className="capitalize">{bienType}</span>}
                {bienSurface && <span>{bienSurface} m2</span>}
                {bienPrix && <span>{Number(bienPrix).toLocaleString("fr-FR")} EUR</span>}
              </div>
            </div>

            {/* Photos summary */}
            <div className="border-t border-[var(--border)] pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--foreground)] font-medium">
                  {files.length} photo{files.length > 1 ? "s" : ""}
                </span>
                <span className="text-sm text-[var(--sage)] font-medium">
                  {creditsNeeded} credit{creditsNeeded > 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <div key={i} className="w-16 h-12 rounded-lg overflow-hidden border border-[var(--border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrls[i]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Style summary */}
            <div className="border-t border-[var(--border)] pt-4">
              <span className="text-sm text-[var(--foreground)] font-medium">
                Style : {globalStyle?.name || "Personnalise"}
              </span>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-[var(--sage)] text-white rounded-xl font-medium text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="merchant-generate"
          >
            {isGenerating ? "Generation en cours..." : `Generer le dossier (${creditsNeeded} credits)`}
          </button>

          <p className="text-center text-xs text-[var(--muted)]/60 font-light">
            Les photos en echec seront remboursees automatiquement.
          </p>
        </div>
      )}

      {/* ── Step: Generating ── */}
      {currentStep === "generating" && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-generating">
          <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-widest">
            Generation en cours
          </h3>

          <DossierProgress
            photos={dossierPhotos.length > 0
              ? dossierPhotos.map((p) => ({
                  id: p.id,
                  photoIndex: p.photoIndex,
                  roomLabel: p.roomLabel,
                  status: p.status,
                  errorMessage: p.errorMessage,
                }))
              : files.map((_, i) => ({
                  id: i,
                  photoIndex: i,
                  roomLabel: photoEntries[i]?.roomLabel || null,
                  status: "pending" as const,
                }))
            }
            isGenerating={isGenerating}
            elapsed={generationElapsed}
          />
        </div>
      )}

      {/* ── Step: Results ── */}
      {currentStep === "results" && dossierUuid && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-results">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-widest">
              Dossier termine
            </h3>
            {linkCopied && (
              <span className="text-xs text-[var(--sage)] font-medium animate-fade-in-up">
                Lien copie
              </span>
            )}
          </div>

          <DossierResult
            photos={dossierPhotos}
            bienNom={bienTitle}
            onDownloadPdf={handleDownloadPdf}
            onShareLink={handleShareLink}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />
        </div>
      )}
    </div>
  );
}
