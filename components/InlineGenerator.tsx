"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import StylePicker, { StyleOption } from "@/components/StylePicker";
import ImageComparator from "@/components/ImageComparator";

// ─── Types ──────────────────────────────────────────────────────────

interface UserPhoto {
  id: string;
  property_id: string | null;
  input_image_key: string | null;
  output_image_key: string | null;
  style_id: string | null;
  room_type: string | null;
  room_label: string | null;
  is_outdoor: boolean;
  created_at: string;
}

type Step = "select" | "style" | "generating" | "results";

interface GenerationResult {
  photoId: string;
  originalDataUri: string;
  generatedDataUri: string | null;
  model: string | null;
  serverPhotoId: string | null;
  error: string | null;
  status: "pending" | "success" | "error";
}

interface InlineGeneratorProps {
  propertyId: string;
  photos: UserPhoto[];
  onClose: () => void;
  onPhotosGenerated: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Fetch an image from Object Storage and return as base64 data URI.
 */
async function fetchImageAsBase64(imageKey: string): Promise<string> {
  const res = await fetch(`/api/logs/image?path=${encodeURIComponent(imageKey)}`);
  if (!res.ok) throw new Error(`Impossible de charger l'image: ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get image dimensions from a data URI.
 */
function getImageDimensions(dataUri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUri;
  });
}

/**
 * Simple semaphore for concurrency control.
 */
function createSemaphore(max: number) {
  let current = 0;
  const queue: Array<() => void> = [];

  return {
    async acquire(): Promise<void> {
      if (current < max) {
        current++;
        return;
      }
      return new Promise<void>((resolve) => {
        queue.push(() => {
          current++;
          resolve();
        });
      });
    },
    release(): void {
      current--;
      const next = queue.shift();
      if (next) next();
    },
  };
}

// ─── Component ──────────────────────────────────────────────────────

export default function InlineGenerator({
  propertyId,
  photos,
  onClose,
  onPhotosGenerated,
}: InlineGeneratorProps) {
  // Steps
  const [step, setStep] = useState<Step>("select");

  // Step 1: photo selection
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(
    () => new Set(photos.filter((p) => p.input_image_key).map((p) => p.id))
  );

  // Step 2: style
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedOutdoorStyle, setSelectedOutdoorStyle] = useState<string | null>(null);

  // Step 3: generating
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Scroll into view when panel mounts
  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ── Photo selection toggle ──

  const togglePhoto = useCallback((photoId: string) => {
    setSelectedPhotoIds((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPhotoIds(new Set(photos.filter((p) => p.input_image_key).map((p) => p.id)));
  }, [photos]);

  const deselectAll = useCallback(() => {
    setSelectedPhotoIds(new Set());
  }, []);

  // ── Get prompts for the selected style ──

  const getPrompts = useCallback((): { surfacePrompt: string; furniturePrompt: string; styleId: string } => {
    if (selectedStyle) {
      return {
        surfacePrompt: selectedStyle.surfacePrompt,
        furniturePrompt: selectedStyle.furniturePrompt,
        styleId: selectedStyle.id,
      };
    }
    // Custom prompt: same text for both passes
    return {
      surfacePrompt: customPrompt,
      furniturePrompt: customPrompt,
      styleId: "custom",
    };
  }, [selectedStyle, customPrompt]);

  // ── Generate for all selected photos ──

  const handleGenerate = useCallback(async () => {
    const selectedPhotos = photos.filter((p) => selectedPhotoIds.has(p.id) && p.input_image_key);
    if (selectedPhotos.length === 0) return;

    const { surfacePrompt, furniturePrompt, styleId } = getPrompts();

    setStep("generating");
    setIsGenerating(true);
    setElapsedSeconds(0);

    // Initialize results
    const initialResults: GenerationResult[] = selectedPhotos.map((p) => ({
      photoId: p.id,
      originalDataUri: "",
      generatedDataUri: null,
      model: null,
      serverPhotoId: null,
      error: null,
      status: "pending" as const,
    }));
    setResults(initialResults);

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s: number) => s + 1);
    }, 1000);

    const abortController = new AbortController();
    abortRef.current = abortController;

    const semaphore = createSemaphore(2);

    const generateOne = async (photo: UserPhoto, index: number) => {
      await semaphore.acquire();

      if (abortController.signal.aborted) {
        semaphore.release();
        return;
      }

      try {
        // Fetch input image as base64
        const dataUri = await fetchImageAsBase64(photo.input_image_key!);
        const { width, height } = await getImageDimensions(dataUri);

        // Update result with original image
        setResults((prev: GenerationResult[]) =>
          prev.map((r: GenerationResult, i: number) => (i === index ? { ...r, originalDataUri: dataUri } : r))
        );

        // Strip data URI prefix for API
        const base64 = dataUri.replace(/^data:image\/[\w+]+;base64,/, "");

        // Call generate API
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            surfacePrompt,
            furniturePrompt,
            styleId,
            width,
            height,
            isOutdoor: false,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Erreur inconnue" }));
          throw new Error(errorData.error || `Erreur ${res.status}`);
        }

        const data = await res.json();

        setResults((prev: GenerationResult[]) =>
          prev.map((r: GenerationResult, i: number) =>
            i === index
              ? {
                  ...r,
                  generatedDataUri: data.image,
                  model: data.model || null,
                  serverPhotoId: data.photoId || null,
                  status: "success" as const,
                }
              : r
          )
        );
      } catch (err: unknown) {
        if (abortController.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Erreur lors de la generation";
        setResults((prev: GenerationResult[]) =>
          prev.map((r: GenerationResult, i: number) =>
            i === index ? { ...r, error: message, status: "error" as const } : r
          )
        );
      } finally {
        semaphore.release();
      }
    };

    // Launch all in parallel (semaphore limits to 2 concurrent)
    await Promise.allSettled(
      selectedPhotos.map((photo, index) => generateOne(photo, index))
    );

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsGenerating(false);

    // If any succeeded, move to results
    setStep("results");
  }, [photos, selectedPhotoIds, getPrompts]);

  // ── Retry a single failed photo ──

  const handleRetry = useCallback(
    async (index: number) => {
      const photo = photos.find((p) => p.id === results[index]?.photoId);
      if (!photo || !photo.input_image_key) return;

      const { surfacePrompt, furniturePrompt, styleId } = getPrompts();

      // Reset this result to pending
      setResults((prev: GenerationResult[]) =>
        prev.map((r: GenerationResult, i: number) =>
          i === index ? { ...r, error: null, status: "pending" as const } : r
        )
      );

      try {
        const dataUri = results[index].originalDataUri || await fetchImageAsBase64(photo.input_image_key);
        const { width, height } = await getImageDimensions(dataUri);
        const base64 = dataUri.replace(/^data:image\/[\w+]+;base64,/, "");

        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            surfacePrompt,
            furniturePrompt,
            styleId,
            width,
            height,
            isOutdoor: false,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Erreur inconnue" }));
          throw new Error(errorData.error || `Erreur ${res.status}`);
        }

        const data = await res.json();
        setResults((prev: GenerationResult[]) =>
          prev.map((r: GenerationResult, i: number) =>
            i === index
              ? {
                  ...r,
                  originalDataUri: dataUri,
                  generatedDataUri: data.image,
                  model: data.model || null,
                  serverPhotoId: data.photoId || null,
                  error: null,
                  status: "success" as const,
                }
              : r
          )
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors de la generation";
        setResults((prev: GenerationResult[]) =>
          prev.map((r: GenerationResult, i: number) =>
            i === index ? { ...r, error: message, status: "error" as const } : r
          )
        );
      }
    },
    [photos, results, getPrompts]
  );

  // ── Associate results to property ──

  const handleAssociateResults = useCallback(async () => {
    const photoIds = results
      .filter((r: GenerationResult) => r.status === "success" && r.serverPhotoId)
      .map((r: GenerationResult) => r.serverPhotoId!);

    if (photoIds.length === 0) return;

    try {
      const res = await fetch(`/api/properties/${propertyId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds }),
      });

      if (res.ok) {
        onPhotosGenerated();
      }
    } catch (err) {
      console.error("Erreur association photos:", err);
    }
  }, [results, propertyId, onPhotosGenerated]);

  // ── Close with confirmation if generating ──

  const handleClose = useCallback(() => {
    if (isGenerating) {
      const confirmed = window.confirm(
        "La generation est en cours, voulez-vous annuler ?"
      );
      if (!confirmed) return;
      abortRef.current?.abort();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsGenerating(false);
    }
    onClose();
  }, [isGenerating, onClose]);

  // ── Derived state ──

  const photosWithInput = photos.filter((p) => p.input_image_key);
  const hasStyleSelected = selectedStyle !== null || customPrompt.trim().length > 0;
  const selectedCount = selectedPhotoIds.size;
  const successCount = results.filter((r: GenerationResult) => r.status === "success").length;
  const errorCount = results.filter((r: GenerationResult) => r.status === "error").length;
  const pendingCount = results.filter((r: GenerationResult) => r.status === "pending").length;

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="mt-6 bg-white border border-foreground/10 rounded-2xl overflow-hidden animate-fade-in-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/5">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Generation de visuels meubles
          </h3>
          <p className="text-xs text-muted font-light mt-0.5">
            {step === "select" && "Selectionnez les photos a transformer"}
            {step === "style" && "Choisissez un style d'ambiance"}
            {step === "generating" && `Generation en cours... ${elapsedSeconds}s`}
            {step === "results" && `${successCount} resultat${successCount > 1 ? "s" : ""} genere${successCount > 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="text-xs text-muted hover:text-foreground transition-colors font-light px-3 py-1.5 rounded-full hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
        >
          Fermer
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* ── Step 1: Select photos ── */}
        {step === "select" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-light">
                {selectedCount} / {photosWithInput.length} photo{photosWithInput.length > 1 ? "s" : ""} selectionnee{selectedCount > 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-sage hover:text-sage/80 font-light transition-colors"
                >
                  Tout selectionner
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs text-muted hover:text-foreground font-light transition-colors"
                >
                  Tout deselectionner
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {photosWithInput.map((photo) => {
                const isSelected = selectedPhotoIds.has(photo.id);
                const imgSrc = photo.input_image_key
                  ? `/api/logs/image?path=${encodeURIComponent(photo.input_image_key)}`
                  : undefined;

                return (
                  <button
                    key={photo.id}
                    onClick={() => togglePhoto(photo.id)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                      isSelected
                        ? "border-sage shadow-sm"
                        : "border-transparent opacity-60 hover:opacity-80"
                    }`}
                  >
                    {imgSrc ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imgSrc}
                        alt={photo.room_label || "Photo"}
                        className="w-full aspect-[4/3] object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] bg-foreground/5" />
                    )}
                    {/* Checkbox indicator */}
                    <div
                      className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-sage border-sage"
                          : "bg-white/80 border-foreground/20"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      )}
                    </div>
                    {photo.room_label && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-2 py-1">
                        <span className="text-[10px] text-white/90 font-medium">{photo.room_label}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep("style")}
                disabled={selectedCount === 0}
                className="text-xs bg-foreground text-background px-5 py-2.5 rounded-full font-medium hover:bg-foreground/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                Choisir le style
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Style selection ── */}
        {step === "style" && (
          <div className="space-y-5">
            <button
              onClick={() => setStep("select")}
              className="text-xs text-muted hover:text-foreground font-light transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8,2 4,6 8,10" />
              </svg>
              Retour a la selection
            </button>

            <StylePicker
              selectedStyle={selectedStyle}
              customPrompt={customPrompt}
              onStyleSelect={setSelectedStyle}
              onCustomPromptChange={setCustomPrompt}
              isOutdoor={false}
              selectedOutdoorStyle={selectedOutdoorStyle}
              onSelectOutdoorStyle={setSelectedOutdoorStyle}
            />

            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={!hasStyleSelected}
                className="text-xs bg-sage text-white px-5 py-2.5 rounded-full font-medium hover:bg-sage/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                Lancer la generation ({selectedCount} photo{selectedCount > 1 ? "s" : ""})
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Generating ── */}
        {step === "generating" && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-3 text-sm text-muted font-light">
                <svg className="w-5 h-5 animate-spin text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" strokeOpacity={0.2} />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                <span>
                  Generation en cours... {elapsedSeconds}s
                  <span className="text-muted/60 ml-1">(~90s par photo)</span>
                </span>
              </div>
            </div>

            {/* Preview grid with status per photo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {results.map((result: GenerationResult) => {
                const photo = photos.find((p) => p.id === result.photoId);
                const imgSrc = photo?.input_image_key
                  ? `/api/logs/image?path=${encodeURIComponent(photo.input_image_key)}`
                  : undefined;

                return (
                  <div key={result.photoId} className="relative rounded-xl overflow-hidden border border-foreground/5">
                    {imgSrc ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imgSrc}
                        alt="En cours..."
                        className={`w-full aspect-[4/3] object-cover transition-all duration-500 ${
                          result.status === "pending" ? "blur-sm brightness-75" : ""
                        }`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] bg-foreground/5" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {result.status === "pending" && (
                        <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <span className="text-[10px] text-white font-medium">En cours...</span>
                        </div>
                      )}
                      {result.status === "success" && (
                        <div className="bg-sage/90 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <span className="text-[10px] text-white font-medium">Termine</span>
                        </div>
                      )}
                      {result.status === "error" && (
                        <div className="bg-red-500/90 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <span className="text-[10px] text-white font-medium">Erreur</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress summary */}
            <div className="text-center">
              <span className="text-xs text-muted font-light">
                {successCount} termine{successCount > 1 ? "s" : ""}
                {errorCount > 0 && ` / ${errorCount} erreur${errorCount > 1 ? "s" : ""}`}
                {pendingCount > 0 && ` / ${pendingCount} en cours`}
              </span>
            </div>
          </div>
        )}

        {/* ── Step 4: Results ── */}
        {step === "results" && (
          <div className="space-y-6">
            {/* Results comparators */}
            {results.map((result: GenerationResult, i: number) => (
              <div key={result.photoId} className="space-y-2">
                {result.status === "success" && result.generatedDataUri && result.originalDataUri && (
                  <ImageComparator
                    originalUrl={result.originalDataUri}
                    generatedUrl={result.generatedDataUri}
                    model={result.model || undefined}
                  />
                )}
                {result.status === "error" && (
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                    <span className="text-xs text-red-600 font-light">
                      {result.error || "Erreur lors de la generation"}
                    </span>
                    <button
                      onClick={() => handleRetry(i)}
                      className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-full font-medium hover:bg-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                      Reessayer
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-foreground/5">
              {successCount > 0 && (
                <button
                  onClick={handleAssociateResults}
                  className="text-xs bg-sage text-white px-5 py-2.5 rounded-full font-medium hover:bg-sage/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                >
                  Associer les resultats a ce bien ({successCount})
                </button>
              )}
              <button
                onClick={handleClose}
                className="text-xs bg-foreground/5 text-foreground px-5 py-2.5 rounded-full font-light hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
