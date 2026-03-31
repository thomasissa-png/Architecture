"use client";

/**
 * F4 — Mode Pro (ex Mode Marchand): Main component.
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

type MerchantStep = "info" | "photos" | "annotate" | "style" | "review" | "generating" | "results";

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
  const [linkCopied, setLinkCopied] = useState(false);

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
        };
      });
      return next;
    });
  }, [files]);

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

  const handleSelectProperty = useCallback((propertyId: string) => {
    const prop = existingProperties.find((p) => p.id === propertyId);
    if (!prop) return;
    setSelectedPropertyId(propertyId);
    setBienAdresse(prop.address_normalized || prop.address_raw || "");
    setBienType(prop.property_type || "");
    setBienSurface(prop.surface_m2 ? String(prop.surface_m2) : "");
    setBienPrix(prop.sale_price ? String(prop.sale_price) : "");
    setBienNbPieces(prop.room_count ? String(prop.room_count) : "");
    if (prop.latitude && prop.longitude) {
      setEnrichedLat(Number(prop.latitude));
      setEnrichedLon(Number(prop.longitude));
    }
    if (prop.city) setEnrichedCity(prop.city);
    if (prop.description_final || prop.description_generated) {
      setEnrichedDescription(prop.description_final || prop.description_generated || "");
    }
  }, [existingProperties]);

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
          styleId: (p.styleId ?? p.style_id ?? null) as string | null,
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
          merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      // Step 1: Create dossier
      const createRes = await fetch("/api/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bienNom: autoNom || null,
          bienAdresse: bienAdresse.trim() || null,
          bienSurface: bienSurface ? Number(bienSurface) : null,
          bienPrix: bienPrix ? Number(bienPrix) : null,
          bienType: bienType || null,
          globalStyleId: globalStyles[0] || "custom",
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
            styleId: p.entry?.styleOverride?.id || globalStyles[0] || "custom",
            customPrompt: p.entry?.customPromptOverride || customPrompt || "",
            isOutdoor: p.entry?.isOutdoor || false,
            outdoorStyleId: p.entry?.outdoorStyleId || null,
            outdoorSubtype: p.entry?.outdoorSubtype || null,
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
      const msg = err instanceof Error ? err.message : "";
      // Rendre le message 403 plus clair pour l'utilisateur
      const displayMsg = msg.includes("Pack Pro") || msg.includes("reserve aux")
        ? "Accès Pro requis. Contactez l'administrateur pour activer votre compte."
        : msg || "Une erreur est survenue. Réessayez — vos visuels n'ont pas été consommés.";
      setError(displayMsg);
      setIsGenerating(false);
      setCurrentStep("review");
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
          styleId: (p.styleId ?? p.style_id ?? null) as string | null,
        })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez — vos visuels n'ont pas été consommés.");
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
  // Auto-generated name: "[Type] — [Surface] m² — [Ville]"
  const autoNom = [
    bienType && BIEN_TYPES.find((t) => t.id === bienType)?.label,
    bienSurface && `${bienSurface} m²`,
    enrichedCity,
  ].filter(Boolean).join(" — ") || "Mon bien";

  // Full title for display (richer, includes address)
  const bienTitle = (() => {
    const type = bienType ? bienType.charAt(0).toUpperCase() + bienType.slice(1) : null;
    const surface = bienSurface ? `${bienSurface} m²` : null;
    const city = enrichedCity?.trim() || null;
    const adresse = bienAdresse?.trim() || null;
    const location = adresse && city ? `${adresse}, ${city}` : adresse || city || null;
    const propertyDesc = [type, surface].filter(Boolean).join(" ");
    if (propertyDesc && location) return `${propertyDesc} — ${location}`;
    if (propertyDesc) return propertyDesc;
    if (location) return location;
    return "Dossier de présentation";
  })();
  const creditsNeeded = files.length;

  // ─── RENDER ────────────────────────────────────────────────────────

  return (
    <div ref={merchantRef} className="space-y-8" data-testid="merchant-mode">
      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600 font-normal" data-testid="merchant-error">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 text-red-400 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
          >
            Fermer
          </button>
        </div>
      )}

      {/* ── Step: Property Info (optional — accessible from review) ── */}
      {currentStep === "info" && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-info">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-4">
                Informations du bien
              </h3>
              <p className="text-xs text-muted/60 font-light mb-1">
                Facultatif — ces infos enrichissent le dossier PDF et la fiche de partage.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentStep("review");
                merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
            >
              Retour
            </button>
          </div>

          {/* Quick select existing property */}
          {existingProperties.length > 0 && (
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Bien existant
              </label>
              <select
                value={selectedPropertyId || ""}
                onChange={(e) => {
                  if (e.target.value) handleSelectProperty(e.target.value);
                  else setSelectedPropertyId(null);
                }}
                className="w-full px-4 py-3 border border-foreground/10 rounded-xl text-sm font-normal bg-background focus:border-foreground focus:outline-none transition-colors min-h-[44px]"
              >
                <option value="">Nouveau bien (saisir l&apos;adresse)</option>
                {existingProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address_normalized || p.address_raw || "Bien sans adresse"} {p.surface_m2 ? `— ${p.surface_m2} m²` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Address autocomplete */}
          <div className="relative">
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              {selectedPropertyId ? "Adresse" : "Adresse du bien"}
            </label>
            <input
              type="text"
              value={bienAdresse}
              onChange={(e) => handleAddressInput(e.target.value)}
              onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Commencez à taper : 45 rue de la Paix, 75002 Paris"
              className="w-full px-4 py-3 border border-foreground/10 rounded-xl text-sm font-normal focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30"
              data-testid="merchant-bien-adresse"
            />
            {isEnriching && (
              <div className="absolute right-3 top-[38px]">
                <div className="w-4 h-4 border-2 border-foreground/20 border-t-sage rounded-full animate-spin" />
              </div>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-background border border-foreground/10 rounded-xl shadow-lg overflow-hidden" data-testid="merchant-address-suggestions">
                {addressSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectAddress(s)}
                    className="w-full text-left px-4 py-3 text-sm font-normal hover:bg-foreground/5 transition-colors border-b last:border-b-0 border-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-inset"
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
                  Prix moyen : {enrichedPrixM2.toLocaleString("fr-FR")} €/m²
                </span>
              )}
            </div>
          )}

          <div className="border-b border-foreground/5" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Surface (m²)
              </label>
              <input
                type="number"
                value={bienSurface}
                onChange={(e) => setBienSurface(e.target.value)}
                placeholder="65"
                className="w-full px-4 py-3 border border-foreground/10 rounded-xl text-sm font-normal focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30"
                data-testid="merchant-bien-surface"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Nombre de pièces
              </label>
              <input
                type="number"
                value={bienNbPieces}
                onChange={(e) => setBienNbPieces(e.target.value)}
                placeholder="3"
                className="w-full px-4 py-3 border border-foreground/10 rounded-xl text-sm font-normal focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30"
                data-testid="merchant-bien-nb-pieces"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Prix (€)
              </label>
              <input
                type="number"
                value={bienPrix}
                onChange={(e) => setBienPrix(e.target.value)}
                placeholder="350000"
                className="w-full px-4 py-3 border border-foreground/10 rounded-xl text-sm font-normal focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30"
                data-testid="merchant-bien-prix"
              />
              <p className="text-xs text-muted/50 font-light mt-1">
                Prix de commercialisation en euros (ex : 350000 pour 350 000 €)
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
                className="w-full px-4 py-3 border border-foreground/10 rounded-xl text-sm font-normal focus:border-foreground focus:outline-none transition-colors resize-none placeholder:text-foreground/30"
                data-testid="merchant-description"
              />
              <p className="text-xs text-muted/50 font-light mt-1">
                Générée automatiquement — vous pouvez la modifier.
              </p>
            </div>
          )}

          {/* Carte du quartier — iframe OSM interactive (zero dependance serveur) */}
          {enrichedLat && enrichedLon ? (
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Carte du quartier
              </label>
              <div className="rounded-xl border border-foreground/5 overflow-hidden">
                <iframe
                  title="Carte du quartier"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${enrichedLon - 0.008},${enrichedLat - 0.005},${enrichedLon + 0.008},${enrichedLat + 0.005}&layer=mapnik&marker=${enrichedLat},${enrichedLon}`}
                  data-testid="merchant-carte-preview"
                />
                <a
                  href={`https://www.openstreetmap.org/?mlat=${enrichedLat}&mlon=${enrichedLon}#map=16/${enrichedLat}/${enrichedLon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-xs text-sage py-1.5 hover:text-sage/80 transition-colors bg-foreground/[0.02]"
                >
                  Voir en grand sur OpenStreetMap
                </a>
              </div>
            </div>
          ) : null}

          {/* Next button */}
          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={() => {
                setCurrentStep("review");
                merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="px-8 py-3 bg-foreground text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              data-testid="merchant-next-annotate"
            >
              Valider les infos
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Annotate (per-photo room type + style override) ── */}
      {currentStep === "annotate" && (
        <div className="space-y-6 animate-fade-in-up" data-testid="merchant-step-annotate">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                        className="w-full text-sm font-normal border border-foreground/10 rounded-lg px-3 py-2 bg-background focus:border-foreground focus:outline-none transition-colors"
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
                        className="w-full text-sm font-normal border border-foreground/10 rounded-lg px-3 py-2 bg-background focus:border-foreground focus:outline-none transition-colors"
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
                        className="w-full text-sm font-normal border border-foreground/10 rounded-lg px-3 py-2 bg-background focus:border-foreground focus:outline-none transition-colors"
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
                        className="w-full text-sm font-normal border border-foreground/10 rounded-lg px-3 py-2 bg-background focus:border-foreground focus:outline-none transition-colors"
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
                        className="w-full text-sm font-normal border border-foreground/10 rounded-lg px-3 py-2 bg-background focus:border-foreground focus:outline-none transition-colors resize-none placeholder:text-foreground/30"
                        data-testid={`merchant-annotate-custom-prompt-${index}`}
                      />
                    </div>
                  )}
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
                  // Skip global style step, go straight to review
                  setCurrentStep("review");
                } else {
                  // Need global style for photos without override
                  setCurrentStep("style");
                }
                merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="px-8 py-3 bg-foreground text-background rounded-xl font-medium text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              data-testid="merchant-next-annotate-continue"
            >
              Continuer
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
              setGlobalStyles((prev) => {
                if (prev.includes(styleId)) {
                  if (prev.length === 1) return prev;
                  return prev.filter((id) => id !== styleId);
                }
                return [...prev, styleId];
              });
            }}
            onCustomPromptChange={setCustomPrompt}
            isOutdoor={false}
            selectedOutdoorStyle={null}
            onSelectOutdoorStyle={() => {}}
          />

          {/* Navigation */}
          {(globalStyles.length > 0 || customPrompt.trim()) && (
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  setCurrentStep("review");
                  merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
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
              onClick={() => {
                const allHaveOverride = photoEntries.every((e) => e.styleOverride !== null);
                setCurrentStep(allHaveOverride ? "annotate" : "style");
                merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
            >
              Retour
            </button>
          </div>

          <div className="border border-foreground/10 rounded-2xl p-5 space-y-4">
            {/* Property summary */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-semibold text-foreground">
                  {bienTitle}
                </h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted font-normal mt-1">
                  {bienAdresse && <span>{bienAdresse}</span>}
                  {bienType && <span className="capitalize">{bienType}</span>}
                  {bienSurface && <span>{bienSurface} m²</span>}
                  {bienPrix && <span>{Number(bienPrix).toLocaleString("fr-FR")} €</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentStep("info");
                  merchantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="text-xs text-sage font-medium hover:text-sage/80 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
                data-testid="merchant-edit-info"
              >
                {bienAdresse ? "Modifier" : "Ajouter les infos du bien"}
              </button>
            </div>

            {/* Photos summary */}
            <div className="border-t border-foreground/5 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground font-medium">
                  {files.length} photo{files.length > 1 ? "s" : ""}
                </span>
                <span className="text-sm text-sage font-medium">
                  {creditsNeeded} visuel{creditsNeeded > 1 ? "s" : ""}
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
                Style : {globalStyles.length > 0 ? globalStyles.map((id) => STYLES.find((s) => s.id === id)?.name || id).join(", ") : "Personnalisé"}
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
            {isGenerating ? "Génération en cours..." : `Générer le dossier (${creditsNeeded} visuel${creditsNeeded > 1 ? "s" : ""})`}
          </button>

          <p className="text-center text-xs text-muted/60 font-light">
            Si une photo échoue, le visuel correspondant est automatiquement restitué.
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
            dossierUuid={dossierIdentifier || dossierUuid}
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
