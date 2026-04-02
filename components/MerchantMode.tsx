"use client";

/**
 * F4 — Mode Pro (ex Mode Marchand): Main component.
 *
 * Multi-step flow:
 * 1. Upload photos (max 15, drag & drop)
 * 2. Annotate (room type + style per photo)
 * 3. Global style selection (if needed)
 * 4. Generate batch
 * 5. View results + attach to property + download PDF + share link
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import UploadZone from "@/components/UploadZone";
import StylePicker, { StyleOption, STYLES } from "@/components/StylePicker";
import { ROOM_TYPE_LIST } from "@/lib/room-types";
import { OUTDOOR_STYLE_LIST } from "@/lib/outdoor-styles";
import { OUTDOOR_SUBTYPE_LIST } from "@/lib/outdoor-subtypes";
import DossierProgress from "@/components/DossierProgress";
import DossierResult from "@/components/DossierResult";
import { processImage } from "@/lib/image-utils";

// ─── Types ───────────────────────────────────────────────────────────

interface PhotoEntry {
  file: File;
  roomLabel: string;
  roomTypeId: string | null;
  styleOverride: StyleOption | null; // null = use global style
  customPromptOverride: string; // per-photo custom prompt when style = "custom"
  isOutdoor: boolean;
  outdoorStyleId: string | null;
  outdoorSubtype: string | null;
  withFurniture: boolean; // per-photo: true = finitions + mobilier, false = finitions seulement
}

interface DossierPhotoStatus {
  id: number;
  photoIndex: number;
  roomLabel: string | null;
  status: "pending" | "generating" | "completed" | "failed";
  errorMessage: string | null;
  inputImageKey: string | null;
  outputImageKey: string | null;
  pass1ImageKey: string | null;
  styleId: string | null;
  iterationCount: number;
}

type MerchantStep = "photos" | "annotate" | "style" | "generating" | "results";

const MAX_PHOTOS = 15;

// ─── Component ───────────────────────────────────────────────────────

export default function MerchantMode() {
  const { data: session } = useSession();

  // Step state — photos first (Thomas flow: arrive avec ses photos)
  const [currentStep, setCurrentStep] = useState<MerchantStep>("photos");

  // Existing properties (for quick select)
  const [existingProperties, setExistingProperties] = useState<Array<{ id: string; address_raw: string | null; address_normalized: string | null; property_type: string | null; surface_m2: number | null; room_count: number | null; sale_price: number | null; city: string | null; latitude: number | null; longitude: number | null; description_generated: string | null; description_final: string | null }>>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Property info (bienNom supprime — auto-genere depuis type/surface/ville)
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
  const [globalStyles, setGlobalStyles] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");

  // Dossier state
  const [dossierUuid, setDossierUuid] = useState<string | null>(null);
  const [dossierIdentifier, setDossierIdentifier] = useState<string | null>(null); // slug or uuid for share links
  const [dossierPhotos, setDossierPhotos] = useState<DossierPhotoStatus[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationElapsed, setGenerationElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null);
  const [isIterating, setIsIterating] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [attachMode, setAttachMode] = useState<"none" | "existing" | "new">("none");
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachDone, setAttachDone] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [userMaxIterations, setUserMaxIterations] = useState(3);

  // Toggle surfaces+mobilier vs surfaces uniquement
  const [withFurniture, setWithFurniture] = useState(true);

  // Poll interval ref
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll anchor ref
  const merchantRef = useRef<HTMLDivElement>(null);

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

  // Track previous file count for auto-transition detection
  const prevFilesCountRef = useRef(0);

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
          customPromptOverride: "",
          isOutdoor: false,
          outdoorStyleId: null,
          outdoorSubtype: null,
          withFurniture: true,
        };
      });
      return next;
    });

    // Auto-transition: when new photos are added and we're still on "photos" step
    const hadNewFiles = files.length > prevFilesCountRef.current;
    prevFilesCountRef.current = files.length;

    if (hadNewFiles && files.length > 0 && currentStep === "photos") {
      setCurrentStep("annotate");
      setTimeout(() => {
        document.getElementById("merchant-annotate")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [files, currentStep]);

  // ── Fetch existing properties for quick select ──
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/properties")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.properties) setExistingProperties(data.properties);
      })
      .catch(() => {});
  }, [session]);

  // ── Fetch user credits ──
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/user/credits")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.credits !== undefined) setUserCredits(data.credits);
        if (data?.maxIterations !== undefined) setUserMaxIterations(data.maxIterations);
      })
      .catch(() => {});
  }, [session]);



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

        const { dossier, photos: rawPhotos } = await res.json();
        // Map snake_case DB fields to camelCase component fields
        const mappedPhotos: DossierPhotoStatus[] = rawPhotos.map((p: Record<string, unknown>) => ({
          id: p.id as number,
          photoIndex: (p.photoIndex ?? p.photo_index ?? 0) as number,
          roomLabel: (p.roomLabel ?? p.room_label ?? null) as string | null,
          status: (p.status ?? "pending") as DossierPhotoStatus["status"],
          errorMessage: (p.errorMessage ?? p.error_message ?? null) as string | null,
          inputImageKey: (p.inputImageKey ?? p.input_image_key ?? null) as string | null,
          outputImageKey: (p.outputImageKey ?? p.output_image_key ?? null) as string | null,
          pass1ImageKey: (p.pass1ImageKey ?? p.pass1_image_key ?? null) as string | null,
          styleId: (p.styleId ?? p.style_id ?? null) as string | null,
          iterationCount: (p.iterationCount ?? p.iteration_count ?? 0) as number,
        }));
        setDossierPhotos(mappedPhotos);

        // Check if generation is complete
        const allDone = mappedPhotos.every(
          (p: DossierPhotoStatus) => p.status === "completed" || p.status === "failed"
        );

        if (allDone || dossier.status === "completed" || dossier.status === "partial") {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setIsGenerating(false);
          setCurrentStep("results");
          // Scroll to results after render
          setTimeout(() => {
            document.querySelector('[data-testid="merchant-step-results"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 300);
          // Auto-open dossier page in new tab (primary action)
          const dossierPath = dossier.slug || dossier.uuid || uuid;
          window.open(`/dossier/${dossierPath}`, '_blank');
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
  async function handleGenerate() {
    if (!session?.user?.id) {
      setError("Connectez-vous pour accéder au Mode Pro.");
      return;
    }

    if (files.length === 0) {
      setError("Ajoutez au moins une photo.");
      return;
    }

    const allHaveOverride = photoEntries.every((e) => e.styleOverride !== null);
    if (!allHaveOverride && globalStyles.length === 0 && !customPrompt.trim()) {
      setError("Choisissez un style global ou un style pour chaque photo.");
      return;
    }

    setError(null);
    setCurrentStep("generating");
    setIsGenerating(true);
    merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    try {
      // Step 1: Create dossier (lightweight — property info added post-generation)
      const createRes = await fetch("/api/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bienNom: null,
          bienAdresse: null,
          bienSurface: null,
          bienPrix: null,
          bienType: null,
          globalStyleId: globalStyles[0] || "custom",
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || "La création du dossier a échoué. Vérifiez votre connexion et réessayez.");
      }

      const { dossier } = await createRes.json();
      setDossierUuid(dossier.uuid);
      setDossierIdentifier(dossier.slug || dossier.uuid);

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
            styleId: p.entry?.isOutdoor
              ? (p.entry?.outdoorStyleId || globalStyles[0] || "custom")
              : (p.entry?.styleOverride?.id || globalStyles[0] || "custom"),
            customPrompt: p.entry?.customPromptOverride || customPrompt || "",
            isOutdoor: p.entry?.isOutdoor || false,
            outdoorStyleId: p.entry?.outdoorStyleId || null,
            outdoorSubtype: p.entry?.outdoorSubtype || null,
            photoIndex: p.index,
            withFurniture: p.entry?.withFurniture !== false,
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
        body: JSON.stringify({ action: "generate", withFurniture }),
      });

      if (!genRes.ok) {
        const data = await genRes.json();
        throw new Error(data.error || "Erreur lors du lancement de la generation.");
      }

      // Step 4: Poll for progress
      startPolling(dossier.uuid);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      // Rendre le message 403 plus clair pour l'utilisateur
      const displayMsg = msg.includes("Pack Pro") || msg.includes("reserve aux")
        ? "Accès Pro requis. Contactez l'administrateur pour activer votre compte."
        : msg || "Une erreur est survenue. Réessayez — vos visuels n'ont pas été consommés.";
      setError(displayMsg);
      setIsGenerating(false);
      setCurrentStep("annotate");
    }
  }

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
        setError(data.error || "Une erreur est survenue. Réessayez — vos visuels n'ont pas été consommés.");
        return;
      }

      // Refresh photos (map snake_case → camelCase)
      const detailRes = await fetch(`/api/dossier/${dossierUuid}`);
      if (detailRes.ok) {
        const { photos: rawP } = await detailRes.json();
        setDossierPhotos(rawP.map((p: Record<string, unknown>) => ({
          id: p.id as number,
          photoIndex: (p.photoIndex ?? p.photo_index ?? 0) as number,
          roomLabel: (p.roomLabel ?? p.room_label ?? null) as string | null,
          status: (p.status ?? "pending") as DossierPhotoStatus["status"],
          errorMessage: (p.errorMessage ?? p.error_message ?? null) as string | null,
          inputImageKey: (p.inputImageKey ?? p.input_image_key ?? null) as string | null,
          outputImageKey: (p.outputImageKey ?? p.output_image_key ?? null) as string | null,
          pass1ImageKey: (p.pass1ImageKey ?? p.pass1_image_key ?? null) as string | null,
          styleId: (p.styleId ?? p.style_id ?? null) as string | null,
          iterationCount: (p.iterationCount ?? p.iteration_count ?? 0) as number,
        })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez — vos visuels n'ont pas été consommés.");
    } finally {
      setIsRegenerating(null);
    }
  }, [dossierUuid]);

  // ── Iterate (refine) single photo — free, max 3 per photo ──
  const handleIterate = useCallback(async (photoId: number, comment: string, previousModifications: string[]) => {
    if (!dossierUuid) return;
    setIsIterating(photoId);
    setError(null);

    try {
      const res = await fetch(`/api/dossier/${dossierUuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "iterate",
          iteratePhotoId: photoId,
          comment,
          previousModifications,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'affinage.");
        return;
      }

      const data = await res.json();

      // Update the photo's output image and iteration count locally
      setDossierPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? {
                ...p,
                outputImageKey: null, // Force StorageImage refresh
                iterationCount: data.iterationCount ?? (p.iterationCount + 1),
              }
            : p
        )
      );

      // Refresh photos from server to get updated outputImageKey
      const detailRes = await fetch(`/api/dossier/${dossierUuid}`);
      if (detailRes.ok) {
        const { photos: rawP } = await detailRes.json();
        setDossierPhotos(rawP.map((p: Record<string, unknown>) => ({
          id: p.id as number,
          photoIndex: (p.photoIndex ?? p.photo_index ?? 0) as number,
          roomLabel: (p.roomLabel ?? p.room_label ?? null) as string | null,
          status: (p.status ?? "pending") as DossierPhotoStatus["status"],
          errorMessage: (p.errorMessage ?? p.error_message ?? null) as string | null,
          inputImageKey: (p.inputImageKey ?? p.input_image_key ?? null) as string | null,
          outputImageKey: (p.outputImageKey ?? p.output_image_key ?? null) as string | null,
          pass1ImageKey: (p.pass1ImageKey ?? p.pass1_image_key ?? null) as string | null,
          styleId: (p.styleId ?? p.style_id ?? null) as string | null,
          iterationCount: (p.iterationCount ?? p.iteration_count ?? 0) as number,
        })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'affinage.");
    } finally {
      setIsIterating(null);
    }
  }, [dossierUuid]);

  // ── Share link ──
  const handleShareLink = useCallback(async () => {
    if (!dossierIdentifier) return;
    const shareUrl = `${window.location.origin}/dossier/${dossierIdentifier}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — no deprecated execCommand fallback
      console.warn("Clipboard API not available");
    }
  }, [dossierIdentifier]);

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
  const creditsNeeded = files.length;

  // ─── RENDER ────────────────────────────────────────────────────────

  return (
    <div ref={merchantRef} className="space-y-8" data-testid="merchant-mode">
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

      {/* ── Step: Annotate (per-photo room type + style override) ── */}
      {currentStep === "annotate" && (
        <div id="merchant-annotate" className="space-y-6 animate-fade-in-up" data-testid="merchant-step-annotate">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-1">
                Pièce et style par photo
              </h3>
              <p className="text-xs text-muted/60 font-light">
                Choisissez le type de pièce et le style pour chaque photo.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentStep("photos");
                merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
            >
              Retour
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, index) => {
              const entry = photoEntries[index];
              if (!entry) return null;
              return (
                <div key={index} className="border border-foreground/10 rounded-xl p-3 space-y-3" data-testid={`merchant-annotate-card-${index}`}>
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-foreground/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrls[index]}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-foreground font-medium truncate">
                    Photo {index + 1}
                  </p>

                  {/* Indoor / Outdoor toggle */}
                  <div className="flex gap-1 p-0.5 bg-foreground/5 rounded-lg" data-testid={`merchant-annotate-mode-${index}`}>
                    <button
                      onClick={() => updatePhotoEntry(index, {
                        isOutdoor: false,
                        outdoorStyleId: null,
                        outdoorSubtype: null,
                        roomTypeId: null,
                        styleOverride: null,
                        customPromptOverride: "",
                      })}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                        !entry.isOutdoor
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      Intérieur
                    </button>
                    <button
                      onClick={() => updatePhotoEntry(index, {
                        isOutdoor: true,
                        roomTypeId: null,
                        styleOverride: null,
                        customPromptOverride: "",
                      })}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                        entry.isOutdoor
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      Extérieur
                    </button>
                  </div>

                  {/* Room type / Outdoor subtype dropdown */}
                  <div>
                    <label className="text-[11px] text-muted font-light block mb-1">
                      {entry.isOutdoor ? "Type d'espace" : "Pièce"}
                    </label>
                    {entry.isOutdoor ? (
                      <select
                        value={entry.outdoorSubtype || ""}
                        onChange={(e) => updatePhotoEntry(index, { outdoorSubtype: e.target.value || null })}
                        className="w-full text-sm font-light border border-foreground/10 rounded-lg px-3 py-2 bg-background focus:border-foreground focus:outline-none transition-colors"
                        data-testid={`merchant-annotate-subtype-${index}`}
                      >
                        <option value="">Non spécifié</option>
                        {OUTDOOR_SUBTYPE_LIST.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.emoji} {st.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={entry.roomTypeId || ""}
                        onChange={(e) => updatePhotoEntry(index, { roomTypeId: e.target.value || null })}
                        className="w-full text-sm font-light border border-foreground/10 rounded-lg px-3 py-2 bg-background focus:border-foreground focus:outline-none transition-colors"
                        data-testid={`merchant-annotate-room-${index}`}
                      >
                        <option value="">Non spécifié</option>
                        {ROOM_TYPE_LIST.map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            {rt.emoji} {rt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Style override dropdown — indoor or outdoor */}
                  <div>
                    <label className="text-[11px] text-muted font-light block mb-1">
                      Style
                    </label>
                    {entry.isOutdoor ? (
                      <select
                        value={entry.outdoorStyleId || ""}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          updatePhotoEntry(index, { outdoorStyleId: val });
                        }}
                        className="w-full text-sm font-light border border-foreground/10 rounded-lg px-3 py-2 bg-background focus:border-foreground focus:outline-none transition-colors"
                        data-testid={`merchant-annotate-outdoor-style-${index}`}
                      >
                        <option value="">Style global</option>
                        {OUTDOOR_STYLE_LIST.map((os) => (
                          <option key={os.id} value={os.id}>
                            {os.emoji} {os.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={entry.styleOverride?.id || ""}
                        onChange={(e) => {
                          const styleId = e.target.value;
                          if (!styleId) {
                            updatePhotoEntry(index, { styleOverride: null, customPromptOverride: "" });
                          } else if (styleId === "custom") {
                            updatePhotoEntry(index, {
                              styleOverride: { id: "custom", name: "Personnalisé", description: "", surfacePrompt: "", furniturePrompt: "", palette: [] },
                            });
                          } else {
                            const style = STYLES.find((s) => s.id === styleId) || null;
                            updatePhotoEntry(index, { styleOverride: style, customPromptOverride: "" });
                          }
                        }}
                        className="w-full text-sm font-light border border-foreground/10 rounded-lg px-3 py-2 bg-background focus:border-foreground focus:outline-none transition-colors"
                        data-testid={`merchant-annotate-style-${index}`}
                      >
                        <option value="">Style global</option>
                        {STYLES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                        <option value="custom">Personnalisé</option>
                      </select>
                    )}
                  </div>

                  {/* Custom prompt textarea (when "Personnalise" selected, indoor only) */}
                  {!entry.isOutdoor && entry.styleOverride?.id === "custom" && (
                    <div>
                      <label className="text-[11px] text-muted font-light block mb-1">
                        Décrivez le style souhaité
                      </label>
                      <textarea
                        value={entry.customPromptOverride}
                        onChange={(e) => updatePhotoEntry(index, { customPromptOverride: e.target.value })}
                        placeholder="Ex : Style campagne chic avec poutres apparentes et tomettes..."
                        rows={2}
                        className="w-full text-sm font-light border border-foreground/10 rounded-lg px-3 py-2 bg-background focus:border-foreground focus:outline-none transition-colors resize-none placeholder:text-foreground/30"
                        data-testid={`merchant-annotate-custom-prompt-${index}`}
                      />
                    </div>
                  )}

                  {/* Per-photo: Finitions seulement / Finitions + Mobilier */}
                  <div className="flex gap-1 p-0.5 bg-foreground/5 rounded-lg" data-testid={`merchant-annotate-furniture-${index}`}>
                    <button
                      onClick={() => updatePhotoEntry(index, { withFurniture: true })}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                        entry.withFurniture
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      Finitions + Mobilier
                    </button>
                    <button
                      onClick={() => updatePhotoEntry(index, { withFurniture: false })}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                        !entry.withFurniture
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      Finitions seulement
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => {
                // Check if all photos have a style override (none needs global)
                const allHaveOverride = photoEntries.every((e) => e.styleOverride !== null);
                if (allHaveOverride) {
                  // All photos have individual styles — generate directly
                  handleGenerate();
                } else {
                  // Need global style for photos without override
                  setCurrentStep("style");
                  merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              disabled={isGenerating}
              className="px-8 py-3 bg-foreground text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              data-testid="merchant-next-annotate-continue"
            >
              {photoEntries.every((e) => e.styleOverride !== null)
                ? `Générer (${creditsNeeded} visuel${creditsNeeded > 1 ? "s" : ""})`
                : "Choisir un style global"}
            </button>
            {userCredits !== null && (
              <span className={`text-xs font-light ${userCredits < creditsNeeded ? "text-red-500" : "text-muted"}`}>
                {userCredits} crédit{userCredits > 1 ? "s" : ""} restant{userCredits > 1 ? "s" : ""}
              </span>
            )}
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
                Jusqu&apos;à {MAX_PHOTOS} photos — 1 visuel par photo
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

          {/* Navigation */}
          {files.length > 0 && (
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  setCurrentStep("annotate");
                  merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="px-8 py-3 bg-foreground text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                data-testid="merchant-next-photos"
              >
                Annoter les photos
              </button>
              <span className="text-xs text-muted font-light">
                {files.length} photo{files.length > 1 ? "s" : ""} — {files.length} visuel{files.length > 1 ? "s" : ""}
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
                Appliqué aux photos sans style individuel.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentStep("annotate");
                merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
            >
              Retour
            </button>
          </div>

          <p className="text-xs text-muted/60 font-light -mt-2">
            Ce style sera appliqué aux photos sans style individuel.
          </p>

          <StylePicker
            selectedStyles={globalStyles}
            customPrompt={customPrompt}
            onStyleToggle={(styleId) => {
              // BUG-8 fix: single style selection (only globalStyles[0] was ever used)
              setGlobalStyles((prev) => {
                if (prev.includes(styleId)) {
                  // Deselect = clear (allows switching to custom)
                  return [];
                }
                // Replace any previous selection with the new one
                return [styleId];
              });
            }}
            onCustomPromptChange={setCustomPrompt}
            isOutdoor={false}
            selectedOutdoorStyle={null}
            onSelectOutdoorStyle={() => {}}
          />

          {/* Generate button */}
          {(globalStyles.length > 0 || customPrompt.trim()) && (
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-8 py-3 bg-sage text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                data-testid="merchant-generate-from-style"
              >
                {isGenerating ? "Génération en cours..." : `Générer (${creditsNeeded} visuel${creditsNeeded > 1 ? "s" : ""})`}
              </button>
              {userCredits !== null && (
                <span className={`text-xs font-light ${userCredits < creditsNeeded ? "text-red-500" : "text-muted"}`}>
                  {userCredits} crédit{userCredits > 1 ? "s" : ""} restant{userCredits > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
      )}


      {/* ── Step: Generating ── */}
      {currentStep === "generating" && (
        <div className="space-y-6 animate-fade-in-up min-h-[60vh] flex flex-col justify-center" data-testid="merchant-step-generating">
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
                  outputImageKey: p.outputImageKey,
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
          {linkCopied && (
            <span className="text-xs text-sage font-medium animate-fade-in-up">
              Lien copié · Valable 30 jours
            </span>
          )}

          <DossierResult
            photos={dossierPhotos}
            onRegenerate={handleRegenerate}
            onIterate={handleIterate}
            isRegenerating={isRegenerating}
            isIterating={isIterating}
            maxIterations={userMaxIterations}
          />

          {/* ── Share buttons ── */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleShareLink}
              className="flex items-center gap-2 px-4 py-2.5 border border-foreground/10 rounded-xl text-sm font-medium hover:bg-foreground/5 transition-colors min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              Copier le lien
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Voici les visuels du bien : ${window.location.origin}/dossier/${dossierIdentifier || dossierUuid}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.555 4.126 1.528 5.867L.06 23.884l6.182-1.425A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.905 0-3.727-.514-5.32-1.49l-.382-.227-3.964.914.99-3.78-.25-.397A9.803 9.803 0 012.18 12c0-5.422 4.398-9.82 9.82-9.82 5.422 0 9.82 4.398 9.82 9.82 0 5.422-4.398 9.82-9.82 9.82z" />
              </svg>
              Envoyer par WhatsApp
            </a>
          </div>

          {/* ── Attach to property panel ── */}
          {!attachDone && (
            <div className="border border-foreground/10 rounded-2xl p-5 space-y-4" data-testid="attach-panel">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">
                  Associer ces visuels à un bien
                </h4>
                <button
                  onClick={() => setAttachDone(true)}
                  className="text-xs text-muted font-light hover:text-foreground transition-colors"
                >
                  Ignorer
                </button>
              </div>
              <p className="text-xs text-muted font-light">
                Retrouvez-les dans vos biens et créez un dossier de présentation.
              </p>

              <div className="flex flex-wrap gap-2">
                {existingProperties.length > 0 && (
                  <button
                    onClick={() => setAttachMode("existing")}
                    className={`text-xs px-4 py-2 rounded-full border transition-colors ${
                      attachMode === "existing"
                        ? "border-sage bg-sage/10 text-sage font-medium"
                        : "border-foreground/10 text-muted font-light hover:border-foreground/20"
                    }`}
                  >
                    Bien existant
                  </button>
                )}
                <button
                  onClick={() => setAttachMode("new")}
                  className={`text-xs px-4 py-2 rounded-full border transition-colors ${
                    attachMode === "new"
                      ? "border-sage bg-sage/10 text-sage font-medium"
                      : "border-foreground/10 text-muted font-light hover:border-foreground/20"
                  }`}
                >
                  Nouveau bien
                </button>
              </div>

              {/* Existing property selector */}
              {attachMode === "existing" && (
                <div className="space-y-3">
                  <select
                    value={selectedPropertyId || ""}
                    onChange={(e) => setSelectedPropertyId(e.target.value || null)}
                    className="w-full px-4 py-3 border border-foreground/10 rounded-xl text-sm font-light bg-background focus:border-foreground focus:outline-none transition-colors"
                  >
                    <option value="">Sélectionner un bien</option>
                    {existingProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.address_normalized || p.address_raw || "Bien sans adresse"} {p.surface_m2 ? `— ${p.surface_m2} m²` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedPropertyId && (
                    <button
                      onClick={async () => {
                        setIsAttaching(true);
                        try {
                          const prop = existingProperties.find((p) => p.id === selectedPropertyId);
                          const res = await fetch(`/api/dossier/${dossierUuid}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "attach",
                              bienAdresse: prop?.address_raw || prop?.address_normalized || null,
                              bienNom: prop?.address_normalized || prop?.address_raw || null,
                              bienSurface: prop?.surface_m2 || null,
                              bienPrix: prop?.sale_price || null,
                              bienType: prop?.property_type || null,
                              propertyId: selectedPropertyId,
                            }),
                          });
                          if (res.ok) {
                            setAttachDone(true);
                          } else {
                            setError("L'association a échoué. Vérifiez votre connexion et réessayez.");
                          }
                        } catch {
                          setError("L'association a échoué. Vérifiez votre connexion et réessayez.");
                        }
                        setIsAttaching(false);
                      }}
                      disabled={isAttaching}
                      className="px-6 py-3 bg-sage text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      {isAttaching ? "Association..." : "Associer à ce bien"}
                    </button>
                  )}
                </div>
              )}

              {/* New property form */}
              {attachMode === "new" && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={bienAdresse}
                      onChange={(e) => handleAddressInput(e.target.value)}
                      onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Adresse du bien"
                      className="w-full px-4 py-3 border border-foreground/10 rounded-xl text-sm font-light focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30"
                    />
                    {isEnriching && (
                      <div className="absolute right-3 top-3">
                        <div className="w-4 h-4 border-2 border-foreground/20 border-t-sage rounded-full animate-spin" />
                      </div>
                    )}
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-background border border-foreground/10 rounded-xl shadow-lg overflow-hidden">
                        {addressSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectAddress(s)}
                            className="w-full text-left px-4 py-3 text-sm font-light hover:bg-foreground/5 transition-colors border-b last:border-b-0 border-foreground/5"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Type, surface, prix, nb pièces */}
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={bienType}
                      onChange={(e) => setBienType(e.target.value)}
                      className="px-3 py-3 border border-foreground/10 rounded-xl text-sm font-light bg-background focus:border-foreground focus:outline-none transition-colors min-h-[44px]"
                    >
                      <option value="">Type de bien</option>
                      <option value="appartement">Appartement</option>
                      <option value="maison">Maison</option>
                      <option value="loft">Loft</option>
                      <option value="studio">Studio</option>
                      <option value="duplex">Duplex</option>
                      <option value="bureau">Bureau commercial</option>
                    </select>
                    <input
                      type="number"
                      value={bienSurface}
                      onChange={(e) => setBienSurface(e.target.value)}
                      placeholder="Surface m²"
                      className="px-3 py-3 border border-foreground/10 rounded-xl text-sm font-light focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30 min-h-[44px]"
                    />
                    <input
                      type="number"
                      value={bienPrix}
                      onChange={(e) => setBienPrix(e.target.value)}
                      placeholder="Prix €"
                      className="px-3 py-3 border border-foreground/10 rounded-xl text-sm font-light focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30 min-h-[44px]"
                    />
                    <input
                      type="number"
                      value={bienNbPieces}
                      onChange={(e) => setBienNbPieces(e.target.value)}
                      placeholder="Nb pièces"
                      className="px-3 py-3 border border-foreground/10 rounded-xl text-sm font-light focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30 min-h-[44px]"
                    />
                  </div>

                  {bienAdresse.trim() && (
                    <button
                      onClick={async () => {
                        setIsAttaching(true);
                        try {
                          const res = await fetch(`/api/dossier/${dossierUuid}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "attach",
                              bienAdresse: bienAdresse.trim(),
                              bienNom: bienAdresse.trim(),
                              bienSurface: bienSurface ? Number(bienSurface) : null,
                              bienPrix: bienPrix ? Number(bienPrix) : null,
                              bienType: bienType || null,
                              nbPieces: bienNbPieces ? Number(bienNbPieces) : null,
                              latitude: enrichedLat,
                              longitude: enrichedLon,
                              ville: enrichedCity || null,
                              codePostal: enrichedPostcode || null,
                              descriptionCommerciale: enrichedDescription.trim() || null,
                              carteImageKey: enrichedCarteKey,
                              prixMoyenM2: enrichedPrixM2,
                            }),
                          });
                          if (res.ok) {
                            setAttachDone(true);
                          } else {
                            setError("L'association a échoué. Vérifiez votre connexion et réessayez.");
                          }
                        } catch {
                          setError("L'association a échoué. Vérifiez votre connexion et réessayez.");
                        }
                        setIsAttaching(false);
                      }}
                      disabled={isAttaching}
                      className="px-6 py-3 bg-sage text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      {isAttaching ? "Création..." : "Créer le bien et associer"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {attachDone && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-sage/10 border border-sage/20">
              <svg className="w-4 h-4 text-sage shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-sage font-medium">Visuels associés au bien</span>
              <a href="/mes-biens" className="text-xs text-sage/70 hover:text-sage ml-auto">
                Voir mes biens →
              </a>
            </div>
          )}

          {/* New batch button */}
          <div className="pt-4 border-t border-foreground/5">
            <button
              onClick={() => {
                setPhotoEntries([]);
                setDossierPhotos([]);
                setDossierUuid(null);
                setDossierIdentifier(null);
                setCurrentStep("photos");
                setWithFurniture(true);
                setAttachDone(false);
                setAttachMode("none");
                setSelectedPropertyId(null);
                setError(null);
              }}
              className="w-full py-3 rounded-full text-sm font-medium border border-foreground/10 text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 min-h-[44px]"
            >
              Générer de nouveaux visuels
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
