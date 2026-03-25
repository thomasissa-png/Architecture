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

  // Step state — photos first (Thomas flow: arrive avec ses photos)
  const [currentStep, setCurrentStep] = useState<MerchantStep>("photos");

  // Property info
  const [bienNom, setBienNom] = useState("");
  const [bienAdresse, setBienAdresse] = useState("");
  const [bienSurface, setBienSurface] = useState("");
  const [bienPrix, setBienPrix] = useState("");
  const [bienType, setBienType] = useState("");
  const [bienNbPieces, setBienNbPieces] = useState("");

  // Enrichment data (F4.B)
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ label: string; postcode: string; city: string; lat: number; lon: number }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedLat, setEnrichedLat] = useState<number | null>(null);
  const [enrichedLon, setEnrichedLon] = useState<number | null>(null);
  const [enrichedCity, setEnrichedCity] = useState("");
  const [enrichedPostcode, setEnrichedPostcode] = useState("");
  const [enrichedPrixM2, setEnrichedPrixM2] = useState<number | null>(null);
  const [enrichedDescription, setEnrichedDescription] = useState("");
  const [enrichedCarteKey, setEnrichedCarteKey] = useState<string | null>(null);
  const addressDebounceRef = useRef<NodeJS.Timeout | null>(null);

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
      } catch (err) {
        console.error("Erreur polling dossier:", err);
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
      setError("Connectez-vous pour accéder au Mode Marchand.");
      return;
    }

    if (files.length === 0) {
      setError("Ajoutez au moins une photo.");
      return;
    }

    if (!globalStyle && !customPrompt.trim()) {
      setError("Choisissez une ambiance pour continuer.");
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
          latitude: enrichedLat,
          longitude: enrichedLon,
          ville: enrichedCity || null,
          codePostal: enrichedPostcode || null,
          descriptionCommerciale: enrichedDescription.trim() || null,
          carteImageKey: enrichedCarteKey,
          prixMoyenM2: enrichedPrixM2,
          nbPieces: bienNbPieces ? Number(bienNbPieces) : null,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || "La création du dossier a échoué. Vérifiez votre connexion et réessayez.");
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
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez — vos crédits n'ont pas été consommés.");
      setIsGenerating(false);
      setCurrentStep("review");
    }
  }, [session, files, photoEntries, globalStyle, customPrompt, bienNom, bienAdresse, bienSurface, bienPrix, bienType, bienNbPieces, enrichedLat, enrichedLon, enrichedCity, enrichedPostcode, enrichedPrixM2, enrichedDescription, enrichedCarteKey, startPolling]);

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
        setError(data.error || "Une erreur est survenue. Réessayez — vos crédits n'ont pas été consommés.");
        return;
      }

      // Refresh photos
      const detailRes = await fetch(`/api/dossier/${dossierUuid}`);
      if (detailRes.ok) {
        const { photos } = await detailRes.json();
        setDossierPhotos(photos);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez — vos crédits n'ont pas été consommés.");
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
      // Clipboard API unavailable — no deprecated execCommand fallback
      console.warn("Clipboard API not available");
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

  // ── Address autocomplete (F4.B) ──
  const handleAddressInput = useCallback((value: string) => {
    setBienAdresse(value);
    setShowSuggestions(true);

    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);

    if (value.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    addressDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/merchant/enrich-property?q=${encodeURIComponent(value)}`);
        if (!res.ok) return;
        const { suggestions } = await res.json();
        setAddressSuggestions(suggestions || []);
      } catch {
        setAddressSuggestions([]);
      }
    }, 300);
  }, []);

  const handleSelectAddress = useCallback(async (suggestion: { label: string; postcode: string; city: string; lat: number; lon: number }) => {
    setBienAdresse(suggestion.label);
    setShowSuggestions(false);
    setAddressSuggestions([]);
    setEnrichedLat(suggestion.lat);
    setEnrichedLon(suggestion.lon);
    setEnrichedCity(suggestion.city);
    setEnrichedPostcode(suggestion.postcode);

    // Trigger enrichment
    setIsEnriching(true);
    try {
      const res = await fetch("/api/merchant/enrich-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adresse: suggestion.label,
          surface: bienSurface ? Number(bienSurface) : undefined,
          type: bienType || undefined,
          nbPieces: bienNbPieces ? Number(bienNbPieces) : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.prixMoyenM2) setEnrichedPrixM2(data.prixMoyenM2);
        if (data.description) setEnrichedDescription(data.description);
        if (data.carteImageKey) setEnrichedCarteKey(data.carteImageKey);
        if (data.city) setEnrichedCity(data.city);
        if (data.postcode) setEnrichedPostcode(data.postcode);
      }
    } catch (err) {
      console.error("Erreur enrichissement adresse:", err);
    } finally {
      setIsEnriching(false);
    }
  }, [bienSurface, bienType, bienNbPieces]);

  // ── Derived ──
  const bienTitle = bienNom.trim() || `Dossier de presentation — ${new Date().toLocaleDateString("fr-FR")}`;
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
            className="ml-3 text-red-400 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
          >
            Fermer
          </button>
        </div>
      )}

      {/* ── Step: Property Info (step 2 — after photos) ── */}
      {currentStep === "info" && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-info">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-4">
                Informations du bien
              </h3>
              <p className="text-xs text-muted/60 font-light mb-1">
                Saisissez l&apos;adresse du bien pour enrichir automatiquement le dossier.
              </p>
              <p className="text-xs text-muted mt-1 mb-6">Facultatif — vous pourrez compl&#233;ter ces informations plus tard depuis la fiche du bien.</p>
            </div>
            <button
              onClick={() => setCurrentStep("photos")}
              className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
            >
              Retour
            </button>
          </div>

          {/* Address autocomplete */}
          <div className="relative">
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Adresse du bien
            </label>
            <input
              type="text"
              value={bienAdresse}
              onChange={(e) => handleAddressInput(e.target.value)}
              onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Commencez à taper : 45 rue de la Paix, 75002 Paris"
              className="w-full px-4 py-3 border border-foreground/5 rounded-xl text-sm font-light focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30"
              data-testid="merchant-bien-adresse"
            />
            {isEnriching && (
              <div className="absolute right-3 top-[38px]">
                <div className="w-4 h-4 border-2 border-foreground/20 border-t-sage rounded-full animate-spin" />
              </div>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-background border border-foreground/5 rounded-xl shadow-lg overflow-hidden" data-testid="merchant-address-suggestions">
                {addressSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectAddress(s)}
                    className="w-full text-left px-4 py-3 text-sm font-light hover:bg-foreground/5 transition-colors border-b last:border-b-0 border-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-inset"
                    data-testid={`merchant-address-suggestion-${i}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auto-filled location info */}
          {(enrichedCity || enrichedPostcode) && (
            <div className="flex flex-wrap gap-2 -mt-2">
              {enrichedPostcode && (
                <span className="text-xs px-3 py-1 rounded-full bg-foreground/5 text-muted font-light">
                  {enrichedPostcode}
                </span>
              )}
              {enrichedCity && (
                <span className="text-xs px-3 py-1 rounded-full bg-foreground/5 text-muted font-light">
                  {enrichedCity}
                </span>
              )}
              {enrichedPrixM2 && (
                <span className="text-xs px-3 py-1 rounded-full bg-sage/10 text-sage font-medium">
                  Prix moyen : {enrichedPrixM2.toLocaleString("fr-FR")} {"\u20AC"}/m{"\u00B2"}
                </span>
              )}
            </div>
          )}

          <div className="border-b border-foreground/5" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Nom du bien
              </label>
              <input
                type="text"
                value={bienNom}
                onChange={(e) => setBienNom(e.target.value)}
                placeholder="Ex : T3 renove avec vue"
                className="w-full px-4 py-3 border border-foreground/5 rounded-xl text-sm font-light focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30"
                data-testid="merchant-bien-nom"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Surface (m{"\u00B2"})
              </label>
              <input
                type="number"
                value={bienSurface}
                onChange={(e) => setBienSurface(e.target.value)}
                placeholder="65"
                className="w-full px-4 py-3 border border-foreground/5 rounded-xl text-sm font-light focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30"
                data-testid="merchant-bien-surface"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Nombre de pieces
              </label>
              <input
                type="number"
                value={bienNbPieces}
                onChange={(e) => setBienNbPieces(e.target.value)}
                placeholder="3"
                className="w-full px-4 py-3 border border-foreground/5 rounded-xl text-sm font-light focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30"
                data-testid="merchant-bien-nb-pieces"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Prix ({"\u20AC"})
              </label>
              <input
                type="number"
                value={bienPrix}
                onChange={(e) => setBienPrix(e.target.value)}
                placeholder="350000"
                className="w-full px-4 py-3 border border-foreground/5 rounded-xl text-sm font-light focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30"
                data-testid="merchant-bien-prix"
              />
              <p className="text-xs text-muted/50 font-light mt-1">
                Prix de commercialisation en euros (ex : 350000 pour 350 000 {"\u20AC"})
              </p>
            </div>
          </div>

          {/* Property type */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Type de bien
            </label>
            <div className="flex flex-wrap gap-2">
              {BIEN_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setBienType(bienType === type.id ? "" : type.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                    bienType === type.id
                      ? "bg-sage text-white"
                      : "bg-foreground/5 text-muted hover:bg-foreground/10"
                  }`}
                  data-testid={`merchant-bien-type-${type.id}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description commerciale (enriched) */}
          {enrichedDescription && (
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Description commerciale
              </label>
              <textarea
                value={enrichedDescription}
                onChange={(e) => setEnrichedDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-foreground/5 rounded-xl text-sm font-light focus:border-foreground focus:outline-none transition-colors resize-none placeholder:text-foreground/30"
                data-testid="merchant-description"
              />
              <p className="text-xs text-muted/50 font-light mt-1">
                Generee automatiquement — vous pouvez la modifier.
              </p>
            </div>
          )}

          {/* Carte du quartier (enriched) */}
          {enrichedCarteKey && (
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Carte du quartier
              </label>
              <div className="rounded-xl border border-foreground/5 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/logs/image?path=${encodeURIComponent(enrichedCarteKey)}`}
                  alt="Carte du quartier"
                  className="w-full h-auto"
                  data-testid="merchant-carte-preview"
                />
              </div>
            </div>
          )}

          {/* Next button */}
          <div className="pt-4">
            <button
              onClick={() => setCurrentStep("style")}
              className="w-full sm:w-auto px-8 py-3 bg-foreground text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              data-testid="merchant-next-style"
            >
              Choisir le style
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Photos (step 1 — first visible) ── */}
      {currentStep === "photos" && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-photos">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-1">
                Photos du bien
              </h3>
              <p className="text-xs text-muted/60 font-light">
                Jusqu&apos;à {MAX_PHOTOS} photos — 1 crédit par photo
              </p>
            </div>
          </div>

          <p className="text-xs text-muted/60 font-light -mt-2">
            Photographiez chaque pièce du bien. Les photos sont traitées une par une.
          </p>

          <UploadZone
            files={files}
            onFilesChange={setFiles}
            maxFiles={MAX_PHOTOS}
          />

          {/* Per-photo labels */}
          {files.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted font-medium">
                Nommez chaque pièce (facultatif)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-foreground/5">
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
                      className="flex-1 text-sm font-light border-0 bg-transparent focus:outline-none placeholder:text-foreground/30"
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
                onClick={() => setCurrentStep("info")}
                className="px-8 py-3 bg-foreground text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                data-testid="merchant-next-photos"
              >
                {"\u00C9"}tape suivante
              </button>
              <span className="text-xs text-muted font-light">
                {files.length} photo{files.length > 1 ? "s" : ""} — {files.length} crédit{files.length > 1 ? "s" : ""}
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
              <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-1">
                Style global
              </h3>
              <p className="text-xs text-muted/60 font-light">
                Appliqué à toutes les photos. Vous pourrez personnaliser par pièce ensuite.
              </p>
            </div>
            <button
              onClick={() => setCurrentStep("info")}
              className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
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
                className="px-8 py-3 bg-foreground text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                data-testid="merchant-next-review"
              >
                Vérifier avant de générer
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step: Review ── */}
      {currentStep === "review" && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-review">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted uppercase tracking-widest">
              Récapitulatif
            </h3>
            <button
              onClick={() => setCurrentStep("style")}
              className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
            >
              Retour
            </button>
          </div>

          <div className="border border-foreground/5 rounded-2xl p-5 space-y-4">
            {/* Property summary */}
            <div>
              <h4 className="text-base font-semibold text-foreground">
                {bienTitle}
              </h4>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted font-light mt-1">
                {bienAdresse && <span>{bienAdresse}</span>}
                {bienType && <span className="capitalize">{bienType}</span>}
                {bienSurface && <span>{bienSurface} m{"\u00B2"}</span>}
                {bienPrix && <span>{Number(bienPrix).toLocaleString("fr-FR")} {"\u20AC"}</span>}
              </div>
            </div>

            {/* Photos summary */}
            <div className="border-t border-foreground/5 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground font-medium">
                  {files.length} photo{files.length > 1 ? "s" : ""}
                </span>
                <span className="text-sm text-sage font-medium">
                  {creditsNeeded} crédit{creditsNeeded > 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <div key={i} className="w-16 h-12 rounded-lg overflow-hidden border border-foreground/5">
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
            <div className="border-t border-foreground/5 pt-4">
              <span className="text-sm text-foreground font-medium">
                Style : {globalStyle?.name || "Personnalisé"}
              </span>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-4 bg-sage text-white rounded-xl font-medium text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            data-testid="merchant-generate"
          >
            {isGenerating ? "Génération en cours..." : `Générer le dossier (${creditsNeeded} crédit${creditsNeeded > 1 ? "s" : ""})`}
          </button>

          <p className="text-center text-xs text-muted/60 font-light">
            Si une photo échoue, le crédit correspondant est automatiquement restitué.
          </p>
        </div>
      )}

      {/* ── Step: Generating ── */}
      {currentStep === "generating" && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-generating">
          <h3 className="text-sm font-medium text-muted uppercase tracking-widest">
            Génération en cours
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
            <h3 className="text-sm font-medium text-muted uppercase tracking-widest">
              Dossier prêt
            </h3>
            {linkCopied && (
              <span className="text-xs text-sage font-medium animate-fade-in-up">
                Lien copié · Valable 30 jours
              </span>
            )}
          </div>

          <DossierResult
            photos={dossierPhotos}
            bienNom={bienTitle}
            dossierUuid={dossierUuid}
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
