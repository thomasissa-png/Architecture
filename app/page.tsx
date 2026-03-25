"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import StepIndicator from "@/components/StepIndicator";
import UploadZone from "@/components/UploadZone";
import StylePicker, { StyleOption } from "@/components/StylePicker";
import ImageComparator from "@/components/ImageComparator";
import RefineModal from "@/components/RefineModal";
import VersionSelector from "@/components/VersionSelector";
import RoomTypePicker from "@/components/RoomTypePicker";
import OutdoorSubtypePicker from "@/components/OutdoorSubtypePicker";
import { processImage, isLikelyInterior } from "@/lib/image-utils";
import { OUTDOOR_STYLES } from "@/lib/outdoor-styles";
import AuthButton from "@/components/AuthButton";

interface GenerationResult {
  originalUrl: string;
  generatedUrl: string;
  model: string;
  pass1Key?: string;
}

interface VersionEntry {
  imageUrl: string;
  comment?: string;
  model: string;
}

const MAX_ITERATIONS = 3;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("versiroom_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("versiroom_session_id", sessionId);
  }
  return sessionId;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}

function scrollToElement(id: string) {
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);
}

/** Fetch with 180s timeout + 1 automatic retry on network/timeout errors. */
async function resilientFetch(
  url: string,
  init: RequestInit,
  parentSignal?: AbortSignal
): Promise<Response> {
  const TIMEOUT_MS = 180_000; // 3 min — pipeline 2 passes can take 60-90s
  const MAX_RETRIES = 1;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), TIMEOUT_MS);

    // Combine parent signal (user cancel) with timeout signal
    const onParentAbort = () => timeoutController.abort();
    parentSignal?.addEventListener("abort", onParentAbort);

    try {
      const response = await fetch(url, {
        ...init,
        signal: timeoutController.signal,
      });
      return response;
    } catch (err) {
      // If the user explicitly cancelled, don't retry
      if (parentSignal?.aborted) throw err;
      // If timeout or network error, retry once
      if (attempt < MAX_RETRIES) {
        console.warn(`Fetch attempt ${attempt + 1} failed, retrying...`, err instanceof Error ? err.message : err);
        continue;
      }
      // Final failure — throw user-friendly error
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("La génération a pris trop de temps. Vérifiez votre connexion et réessayez.");
      }
      throw new Error("Connexion perdue pendant la génération. Vérifiez votre réseau et réessayez.");
    } finally {
      clearTimeout(timer);
      parentSignal?.removeEventListener("abort", onParentAbort);
    }
  }
  // Unreachable but TypeScript needs it
  throw new Error("La génération a échoué après plusieurs tentatives.");
}

const USE_CASES = [
  { label: "Architectes", desc: "Partagez des pistes d\u2019inspiration" },
  { label: "Marchands de biens", desc: "Pr\u00e9commercialisez vos op\u00e9rations" },
  { label: "Particuliers", desc: "Visualisez votre espace avant d\u2019acheter" },
];

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [withFurniture, setWithFurniture] = useState(true);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [currentProcessing, setCurrentProcessing] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generationElapsed, setGenerationElapsed] = useState(0);
  const [preprocessWarnings, setPreprocessWarnings] = useState<string[]>([]);

  // F3 — Outdoor state
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [outdoorSubtype, setOutdoorSubtype] = useState<string | null>("terrasse");
  const [selectedOutdoorStyle, setSelectedOutdoorStyle] = useState<string | null>(null);

  // F1 — Iteration state
  const [iterationsRemaining, setIterationsRemaining] = useState(MAX_ITERATIONS);
  const [versions, setVersions] = useState<VersionEntry[][]>([]); // per-result versions
  const [activeVersions, setActiveVersions] = useState<number[]>([]); // active version index per result
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [refineTargetIndex, setRefineTargetIndex] = useState<number>(0);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [lastRefineComment, setLastRefineComment] = useState<string>("");
  const [refineWarnings, setRefineWarnings] = useState<string[]>([]);
  const [refineElapsed, setRefineElapsed] = useState(0);

  const heroRef = useReveal();
  const toolRef = useReveal();
  const pricingRef = useReveal();

  // F3 — Toggle handler: reset cross-states when switching modes
  const handleToggleOutdoor = useCallback((outdoor: boolean) => {
    setIsOutdoor(outdoor);
    if (outdoor) {
      // Switching to outdoor: reset indoor selections
      setSelectedStyle(null);
      setCustomPrompt("");
      setSelectedRoomType(null);
      // Default subtype if none set
      if (!outdoorSubtype) setOutdoorSubtype("terrasse");
    } else {
      // Switching to indoor: reset outdoor selections
      setSelectedOutdoorStyle(null);
      setOutdoorSubtype("terrasse");
    }
  }, [outdoorSubtype]);

  // Timer for generation elapsed time
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

  // Timer for refine elapsed time
  useEffect(() => {
    if (!isRefining) {
      setRefineElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setRefineElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRefining]);

  // Stable object URLs for file previews (no leak on re-render)
  const filePreviewUrls = useMemo(() => {
    return files.map((file) => URL.createObjectURL(file));
  }, [files]);

  useEffect(() => {
    return () => {
      filePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviewUrls]);

  // Abort controller for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentStep =
    results.length > 0
      ? 4
      : (selectedStyle || customPrompt || selectedOutdoorStyle) && files.length > 0
      ? 3
      : files.length > 0 || selectedStyle || customPrompt || selectedOutdoorStyle || selectedRoomType || isOutdoor
      ? 2
      : 1;

  const handleGenerate = useCallback(async () => {
    if (files.length === 0) return;

    // Resolve prompts based on mode (indoor vs outdoor)
    let surfacePrompt: string;
    let furniturePrompt: string;
    let effectiveStyleId: string;

    if (isOutdoor && selectedOutdoorStyle) {
      const oStyle = OUTDOOR_STYLES[selectedOutdoorStyle];
      surfacePrompt = oStyle?.surfacePrompt || "";
      furniturePrompt = oStyle?.furniturePrompt || "";
      effectiveStyleId = selectedOutdoorStyle;
    } else {
      surfacePrompt = selectedStyle?.surfacePrompt || customPrompt.trim();
      furniturePrompt = selectedStyle?.furniturePrompt || customPrompt.trim();
      effectiveStyleId = selectedStyle?.id ?? "custom";
    }

    if (!surfacePrompt && !furniturePrompt) return;

    // Cancel any previous in-flight requests
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setError(null);
    setResults([]);
    setPreprocessWarnings([]);

    // Pre-process custom prompts via GPT-4.1-mini (translate, split, enrich)
    if (!selectedStyle && customPrompt.trim()) {
      try {
        const ppResponse = await fetch("/api/preprocess-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: customPrompt.trim() }),
          signal: controller.signal,
        });
        if (ppResponse.ok) {
          const ppData = await ppResponse.json();
          if (ppData.surfacePrompt) surfacePrompt = ppData.surfacePrompt;
          if (ppData.furniturePrompt) furniturePrompt = ppData.furniturePrompt;
          if (Array.isArray(ppData.warnings) && ppData.warnings.length > 0) {
            setPreprocessWarnings(ppData.warnings);
          }
        }
      } catch (e: unknown) {
        // On abort, stop entirely
        if (e instanceof Error && e.name === "AbortError") return;
        // On any other error, proceed with the raw custom prompt (backward compatible)
      }
      if (controller.signal.aborted) return;
    }

    // Step 1: Validate all images (fast, parallel)
    try {
      const validations = await Promise.all(files.map((f) => isLikelyInterior(f)));
      const invalidIndex = validations.findIndex((v) => !v.pass);
      if (invalidIndex !== -1) {
        setError(
          `"${files[invalidIndex].name}" ne semble pas \u00eatre une photo d\u2019int\u00e9rieur. Uploadez une photo de pi\u00e8ce pour un meilleur r\u00e9sultat.`
        );
        setIsGenerating(false);
        return;
      }
    } catch {
      // Validation failed — proceed anyway (fail open)
    }

    if (controller.signal.aborted) return;

    // Step 2: Process images (resize/compress) in parallel
    let processedImages: { base64: string; width: number; height: number; fileIndex: number }[];
    try {
      const processed = await Promise.all(files.map((f) => processImage(f)));
      processedImages = processed.map((p, i) => ({ ...p, fileIndex: i }));
    } catch {
      setError("Erreur lors du traitement des images. V\u00e9rifiez vos fichiers.");
      setIsGenerating(false);
      return;
    }

    if (controller.signal.aborted) return;

    // Step 3: Generate in parallel batches (max 2 concurrent)
    const MAX_CONCURRENT = 2;
    const allResults: GenerationResult[] = [];
    let hasError = false;

    for (let batch = 0; batch < processedImages.length; batch += MAX_CONCURRENT) {
      if (hasError || controller.signal.aborted) break;
      const chunk = processedImages.slice(batch, batch + MAX_CONCURRENT);
      setCurrentProcessing(batch);

      const batchResults = await Promise.allSettled(
        chunk.map(async (img) => {
          const response = await resilientFetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: img.base64,
              surfacePrompt,
              furniturePrompt,
              styleId: effectiveStyleId,
              withFurniture,
              width: img.width,
              height: img.height,
              sessionId: getSessionId(),
              roomType: selectedRoomType,
              isOutdoor,
              outdoorSubtype: isOutdoor ? outdoorSubtype : undefined,
            }),
          }, controller.signal);

          if (!response.ok) {
            let errorMsg = "Erreur lors de la génération";
            try {
              const data = await response.json();
              errorMsg = data.error || errorMsg;
            } catch {
              errorMsg = `Erreur serveur (${response.status}). Réessayez dans quelques instants.`;
            }
            throw new Error(errorMsg);
          }

          const data = await response.json();
          return {
            originalUrl: filePreviewUrls[img.fileIndex],
            generatedUrl: data.image,
            model: data.model,
            pass1Key: data.pass1_key,
          } as GenerationResult;
        })
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          allResults.push(result.value);
          setResults((prev) => [...prev, result.value]);
        } else {
          // Ignore abort errors
          if (result.reason?.name === "AbortError") continue;
          hasError = true;
          setError(
            result.reason instanceof Error
              ? result.reason.message
              : "Erreur lors de la g\u00e9n\u00e9ration"
          );
        }
      }
    }

    if (!controller.signal.aborted) {
      setIsGenerating(false);
      if (allResults.length > 0) {
        // Initialize versions array: one entry per result (v1 = original generation)
        setVersions(
          allResults.map((r) => [
            { imageUrl: r.generatedUrl, comment: undefined, model: r.model },
          ])
        );
        setActiveVersions(allResults.map(() => 0));
        setIterationsRemaining(MAX_ITERATIONS);
        scrollToElement("step-results");
      }
    }
  }, [files, selectedStyle, customPrompt, withFurniture, filePreviewUrls, isOutdoor, selectedOutdoorStyle, outdoorSubtype, selectedRoomType]);

  const handleRetry = useCallback(() => {
    setResults([]);
    setError(null);
    setTimeout(() => {
      handleGenerate();
    }, 100);
  }, [handleGenerate]);

  const handleReset = () => {
    setResults([]);
    setError(null);
    setPreprocessWarnings([]);
    // Reset F1 state
    setVersions([]);
    setActiveVersions([]);
    setIterationsRemaining(MAX_ITERATIONS);
    setRefineError(null);
    setRefineWarnings([]);
    setLastRefineComment("");
  };

  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setError(null);
    setPreprocessWarnings([]);
  };

  const handleFullReset = () => {
    abortControllerRef.current?.abort();
    setFiles([]);
    setSelectedStyle(null);
    setCustomPrompt("");
    setSelectedRoomType(null);
    setResults([]);
    setError(null);
    setIsGenerating(false);
    setPreprocessWarnings([]);
    // Reset F1 state
    setVersions([]);
    setActiveVersions([]);
    setIterationsRemaining(MAX_ITERATIONS);
    setIsRefineModalOpen(false);
    setRefineTargetIndex(0);
    setIsRefining(false);
    setRefineError(null);
    setLastRefineComment("");
    setRefineWarnings([]);
    // Reset F3 state
    setIsOutdoor(false);
    setOutdoorSubtype("terrasse");
    setSelectedOutdoorStyle(null);
  };

  const handleOpenRefineModal = useCallback((resultIndex: number) => {
    setRefineTargetIndex(resultIndex);
    setRefineError(null);
    setRefineWarnings([]);
    setIsRefineModalOpen(true);
  }, []);

  const handleRefine = useCallback(
    async (comment: string) => {
      const targetResult = results[refineTargetIndex];
      if (!targetResult?.pass1Key) {
        setRefineError("Les surfaces de cette generation ont expire. Regenerez depuis l'image originale.");
        return;
      }

      setIsRefineModalOpen(false);
      setIsRefining(true);
      setRefineError(null);
      setRefineWarnings([]);
      setLastRefineComment(comment);

      // Build previousModifications from existing versions
      const targetVersions = versions[refineTargetIndex] || [];
      const previousModifications = targetVersions
        .filter((v) => v.comment)
        .map((v) => v.comment as string);

      // Cancel previous in-flight
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Send raw comment to server — server handles all pre-processing via
        // preprocessIterationComment (dedicated iteration pre-processing, not
        // the generic preprocessCustomPrompt). See review H-01.
        const enrichedComment = comment;

        if (controller.signal.aborted) return;

        const response = await resilientFetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pass1_key: targetResult.pass1Key,
            iterationComment: enrichedComment,
            previousModifications,
            sessionId: getSessionId(),
            surfacePrompt: isOutdoor && selectedOutdoorStyle
              ? (OUTDOOR_STYLES[selectedOutdoorStyle]?.surfacePrompt || "")
              : (selectedStyle?.surfacePrompt || customPrompt.trim()),
            furniturePrompt: isOutdoor && selectedOutdoorStyle
              ? (OUTDOOR_STYLES[selectedOutdoorStyle]?.furniturePrompt || "")
              : (selectedStyle?.furniturePrompt || customPrompt.trim()),
            styleId: isOutdoor && selectedOutdoorStyle
              ? selectedOutdoorStyle
              : (selectedStyle?.id ?? "custom"),
            withFurniture: true,
            width: 0, // Server uses pass1 dimensions
            height: 0,
            isOutdoor,
            outdoorSubtype: isOutdoor ? outdoorSubtype : undefined,
          }),
        }, controller.signal);

        if (!response.ok) {
          let errorMsg = "Erreur lors de l'ajustement";
          try {
            const data = await response.json();
            errorMsg = data.error || errorMsg;
          } catch {
            // Réponse non-JSON (timeout proxy, crash serveur)
            errorMsg = `Erreur serveur (${response.status}). Réessayez dans quelques instants.`;
          }
          throw new Error(errorMsg);
        }

        const data = await response.json();

        // Success: add new version, decrement iterations
        setVersions((prev) => {
          const updated = [...prev];
          const existing = updated[refineTargetIndex] || [];
          updated[refineTargetIndex] = [
            ...existing,
            { imageUrl: data.image, comment, model: data.model },
          ];
          return updated;
        });
        setActiveVersions((prev) => {
          const updated = [...prev];
          updated[refineTargetIndex] = (versions[refineTargetIndex]?.length || 1);
          return updated;
        });
        setIterationsRemaining((prev) => Math.max(0, prev - 1));
        setRefineError(null);

        // Update the result's generatedUrl for the comparator
        setResults((prev) => {
          const updated = [...prev];
          updated[refineTargetIndex] = {
            ...updated[refineTargetIndex],
            generatedUrl: data.image,
            model: data.model,
          };
          return updated;
        });
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return;
        // Do NOT decrement iterations on error
        setRefineError(
          e instanceof Error ? e.message : "Erreur lors de l'ajustement. Votre itération a été conservée."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsRefining(false);
        }
      }
    },
    [results, refineTargetIndex, versions, selectedStyle, customPrompt, isOutdoor, selectedOutdoorStyle, outdoorSubtype]
  );

  const handleRefineRetry = useCallback(() => {
    if (lastRefineComment) {
      handleRefine(lastRefineComment);
    }
  }, [lastRefineComment, handleRefine]);

  const handleRefineModify = useCallback(() => {
    setRefineError(null);
    setIsRefineModalOpen(true);
  }, []);

  const handleDownloadAll = async () => {
    for (let index = 0; index < results.length; index++) {
      const result = results[index];
      // Add watermark (EU AI Act Art. 50)
      const blob = await new Promise<Blob>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          const fontSize = Math.max(12, Math.round(img.width * 0.012));
          ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          ctx.textAlign = "right";
          const pad = Math.round(img.width * 0.015);
          ctx.fillText("Généré par IA — Versiroom", img.width - pad, img.height - pad);
          canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92);
        };
        img.src = result.generatedUrl;
      });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `versiroom-${index + 1}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  };

  // Auto-scroll to style step when files are added
  const prevFilesLength = useRef(0);
  useEffect(() => {
    if (files.length > 0 && prevFilesLength.current === 0) {
      scrollToElement("step-space-type");
    }
    prevFilesLength.current = files.length;
  }, [files.length]);

  const canGenerate =
    files.length > 0 &&
    (isOutdoor
      ? selectedOutdoorStyle !== null
      : selectedStyle !== null || customPrompt.trim().length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <span className="text-xl font-semibold text-foreground tracking-tighter">
            Versiroom
          </span>
          <nav className="flex items-center gap-4 sm:gap-6">
            <a href="#pricing" className="text-xs text-muted font-light hover:text-foreground transition-colors">
              Tarifs
            </a>
            <a
              href="#outil"
              className="text-xs bg-foreground text-background px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              Essayer gratuitement
            </a>
            <AuthButton />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 sm:pt-28 pb-8 sm:pb-10 px-5 sm:px-8">
        <div ref={heroRef} className="reveal max-w-4xl mx-auto text-center">
          {/* Multi-audience pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {USE_CASES.map((uc) => (
              <span
                key={uc.label}
                className="text-[11px] font-medium text-sage bg-sage/10 px-3 py-1.5 rounded-full"
              >
                {uc.label}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-[1.08] tracking-tighter mb-5 sm:mb-6">
            Votre pi&egrave;ce meubl&eacute;e,
            <br />
            <span className="font-light text-muted">en 90 secondes.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted font-light leading-relaxed max-w-2xl mx-auto mb-6 sm:mb-8">
            Uploadez une photo, choisissez un style parmi 12 ambiances curat&eacute;es par des experts.
            <br className="hidden sm:inline" />
            Versiroom pr&eacute;serve votre espace &mdash; il ne le r&eacute;invente pas.
          </p>

          {/* Hero before/after — SVG default, real images overlay if available */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="relative group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden hero-before-scene">
                  {/* SVG visible by default */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <svg className="w-24 h-24 sm:w-32 sm:h-32 text-gray-400/50" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth={0.8}>
                      <line x1="10" y1="80" x2="110" y2="80" />
                      <rect x="15" y="20" width="90" height="60" rx="1" strokeDasharray="3 3" />
                      <rect x="40" y="28" width="40" height="30" rx="1" />
                      <line x1="60" y1="28" x2="60" y2="58" />
                      <line x1="40" y1="43" x2="80" y2="43" />
                    </svg>
                    <span className="text-xs text-muted font-light mt-2">Pi&egrave;ce vide</span>
                  </div>
                  {/* Real image overlays on top if available */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/api/demo?type=hero&image=before"
                    alt="Pi&egrave;ce vide avant home staging"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <span className="absolute bottom-2.5 left-2.5 text-xs font-medium text-gray-400 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  AVANT
                </span>
              </div>
              <div className="relative group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden hero-after-scene">
                  {/* SVG visible by default */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <svg className="w-24 h-24 sm:w-32 sm:h-32 text-sage/50" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth={0.8}>
                      <line x1="10" y1="80" x2="110" y2="80" />
                      <rect x="15" y="20" width="90" height="60" rx="1" />
                      <rect x="40" y="28" width="40" height="30" rx="1" />
                      <line x1="60" y1="28" x2="60" y2="58" />
                      <rect x="22" y="62" width="36" height="12" rx="3" fill="currentColor" fillOpacity="0.15" />
                      <rect x="22" y="56" width="36" height="8" rx="2" fill="currentColor" fillOpacity="0.1" />
                      <rect x="62" y="68" width="16" height="8" rx="1" fill="currentColor" fillOpacity="0.12" />
                      <ellipse cx="55" cy="78" rx="25" ry="4" fill="currentColor" fillOpacity="0.08" />
                    </svg>
                    <span className="text-xs text-sage/60 font-light mt-2">Visualisation meubl&eacute;e</span>
                  </div>
                  {/* Real image overlays on top if available */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/api/demo?type=hero&image=after"
                    alt="Pi&egrave;ce meubl&eacute;e par Versiroom"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <span className="absolute bottom-2.5 left-2.5 text-xs font-medium text-sage bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  APR&Egrave;S
                </span>
              </div>
            </div>
          </div>

          {/* Social proof line */}
          <p className="text-xs text-muted font-light mb-6">
            12 styles disponibles &middot; R&eacute;sultat en 90 secondes &middot; T&eacute;l&eacute;chargement HD gratuit
          </p>

          <a
            href="#outil"
            className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-full font-medium hover:bg-foreground/85 transition-all text-sm tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          >
            Essayer gratuitement
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Use cases */}
      <section className="pb-10 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.map((uc, i) => (
            <div key={uc.label} className={`text-center p-6 rounded-2xl border border-foreground/10 bg-white/40 ${i === 0 ? "animate-fade-in-up" : i === 1 ? "animate-fade-in-up animate-delay-100" : "animate-fade-in-up animate-delay-200"}`}>
              <p className="text-sm font-semibold text-foreground mb-1">{uc.label}</p>
              <p className="text-xs text-muted font-light">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-foreground/10" />

      {/* Tool Section */}
      <section id="outil" className="pt-12 sm:pt-16 pb-12 sm:pb-16 px-5 sm:px-8 scroll-mt-16">
        <div ref={toolRef} className="reveal max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Mettez en sc&egrave;ne votre espace
            </h2>
            <p className="text-muted font-light">
              En trois &eacute;tapes simples
            </p>
          </div>

          <StepIndicator currentStep={currentStep} />

          {/* Step 1: Upload */}
          <div className={files.length > 0 ? "mb-10" : "mb-0"}>
            <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-5">
              Upload
            </h3>
            <UploadZone files={files} onFilesChange={setFiles} />
          </div>

          {/* Step 2a: Type d'espace (intérieur/extérieur + sous-type) — revealed after upload */}
          <div id="step-space-type" className={`mb-10 scroll-mt-20 transition-all duration-700 ${files.length === 0 ? "hidden" : "animate-fade-in-up"}`}>
            <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-5">
              01 — Type d&apos;espace
            </h3>

            {/* Indoor / Outdoor toggle */}
            <div className="mb-6">
              <div
                role="radiogroup"
                aria-label="Choix entre interieur et exterieur"
                className="inline-flex rounded-full bg-foreground/5 p-0.5"
              >
                <button
                  role="radio"
                  aria-checked={!isOutdoor}
                  onClick={() => handleToggleOutdoor(false)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                    !isOutdoor
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Int&eacute;rieur
                </button>
                <button
                  role="radio"
                  aria-checked={isOutdoor}
                  onClick={() => handleToggleOutdoor(true)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                    isOutdoor
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Ext&eacute;rieur
                </button>
              </div>
            </div>

            {/* Indoor: room type picker */}
            {!isOutdoor && (
              <div className="animate-fade-in-up">
                <RoomTypePicker
                  selectedRoomType={selectedRoomType}
                  onSelect={setSelectedRoomType}
                />
                {!selectedRoomType && selectedStyle && (
                  <p className="text-xs text-sage font-light text-center mt-2">
                    S&eacute;lectionnez un type de pi&egrave;ce pour continuer
                  </p>
                )}
              </div>
            )}

            {/* Outdoor: subtype picker */}
            {isOutdoor && (
              <div className="animate-fade-in-up">
                <OutdoorSubtypePicker
                  selectedSubtype={outdoorSubtype}
                  onSelect={setOutdoorSubtype}
                />
              </div>
            )}
          </div>

          {/* Step 2b: Style — revealed after upload */}
          <div id="step-style" className={`mb-10 scroll-mt-20 transition-all duration-700 ${files.length === 0 ? "hidden" : "animate-fade-in-up animate-delay-300"}`}>
            <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-5">
              02 — Style
            </h3>

            <StylePicker
              selectedStyle={selectedStyle}
              customPrompt={customPrompt}
              onStyleSelect={setSelectedStyle}
              onCustomPromptChange={setCustomPrompt}
              isOutdoor={isOutdoor}
              selectedOutdoorStyle={selectedOutdoorStyle}
              onSelectOutdoorStyle={setSelectedOutdoorStyle}
            />
          </div>

          {/* Step 2c: Options (furniture toggle) */}
          {canGenerate && results.length === 0 && !isGenerating && (
            <div className="mb-8 animate-fade-in-up">
              <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-5">
                03 — Options
              </h3>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setWithFurniture(false)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    !withFurniture
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-foreground/5 text-muted hover:bg-foreground/10"
                  }`}
                >
                  Surfaces uniquement
                </button>
                <button
                  onClick={() => setWithFurniture(true)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    withFurniture
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-foreground/5 text-muted hover:bg-foreground/10"
                  }`}
                >
                  Surfaces + Mobilier
                </button>
              </div>
              <p className="text-center text-xs text-muted font-light mt-2">
                {withFurniture
                  ? "Finitions et mobilier complet"
                  : "Pi\u00e8ce finie sans meuble \u2014 id\u00e9al pour voir les surfaces"}
              </p>
            </div>
          )}

          {/* Generate Button */}
          {canGenerate && results.length === 0 && (
            <div id="step-generate" className="text-center mb-8 animate-fade-in-up sticky bottom-6 z-40">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || (!isOutdoor && selectedStyle !== null && !selectedRoomType)}
                className="inline-flex items-center gap-3 bg-foreground text-background px-10 py-4 rounded-full font-medium text-base hover:bg-foreground/85 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    G&eacute;n&eacute;ration en cours&hellip; ({currentProcessing + 1}/{files.length})
                  </>
                ) : (
                  <>
                    G&eacute;n&eacute;rer la visualisation
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Loading state with blur preview */}
          {isGenerating && (
            <div className="space-y-6 py-8">
              {/* Blur preview placeholders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {files.map((file, i) => {
                  const done = i < results.length;
                  const active = i >= currentProcessing && i < currentProcessing + 2 && !done;
                  return (
                    <div key={i} className="relative rounded-2xl overflow-hidden border border-foreground/10">
                      <div className="aspect-[4/3]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={filePreviewUrls[i]}
                          alt=""
                          className={`w-full h-full object-cover transition-all duration-700 ${done ? "" : "blur-sm brightness-95"}`}
                        />
                      </div>
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${done ? "opacity-0" : "opacity-100"}`}>
                        {active ? (
                          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                            <span className="text-xs text-muted font-light">G&eacute;n&eacute;ration&hellip;</span>
                          </div>
                        ) : done ? null : (
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
                            <span className="text-xs text-muted font-light">En attente</span>
                          </div>
                        )}
                      </div>
                      {done && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-sage rounded-full flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Timer + Cancel */}
              <div className="text-center space-y-2">
                <p className="text-xs text-muted font-light">
                  {generationElapsed < 30
                    ? `${generationElapsed}s — Estimation : jusqu\u2019\u00e0 2 minutes par image`
                    : generationElapsed < 90
                    ? `${generationElapsed}s — G\u00e9n\u00e9ration en cours\u2026`
                    : `${generationElapsed}s — Presque termin\u00e9\u2026`}
                </p>
                <button
                  onClick={handleCancelGeneration}
                  className="text-xs text-muted hover:text-foreground transition-colors underline underline-offset-4 font-light min-h-[44px] px-4 py-2 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Preprocess warnings */}
          {preprocessWarnings.length > 0 && (
            <div className="mb-8 bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 text-left max-w-2xl mx-auto">
              <p className="text-amber-700/90 text-xs font-medium mb-2">
                Certains éléments ont été ajustés :
              </p>
              <ul className="space-y-1">
                {preprocessWarnings.map((w, i) => (
                  <li key={i} className="text-amber-600/80 text-xs font-light flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">⚠</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-12 bg-red-50/50 border border-red-200/60 rounded-2xl p-6 text-center">
              <p className="text-red-600/80 text-sm">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-3 text-xs text-red-400 underline underline-offset-4 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
              >
                R&eacute;essayer
              </button>
            </div>
          )}

          {/* Step 3: Results */}
          {results.length > 0 && (
            <div id="step-results" className="animate-fade-in-up scroll-mt-28">
              <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-6">
                03 — R&eacute;sultat
              </h3>
              <div className="space-y-10">
                {results.map((result, index) => {
                  const resultVersions = versions[index] || [];
                  const activeIdx = activeVersions[index] || 0;
                  const displayUrl =
                    resultVersions[activeIdx]?.imageUrl || result.generatedUrl;
                  const isRefineTarget = refineTargetIndex === index;

                  return (
                    <div key={index} className="space-y-5">
                      {/* Refine loading state */}
                      {isRefining && isRefineTarget && (
                        <div className="relative rounded-2xl overflow-hidden border border-foreground/10">
                          <div className="aspect-[4/3] sm:aspect-[16/10] relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={displayUrl}
                              alt=""
                              className="w-full h-full object-cover blur-sm brightness-95 transition-all duration-700"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-4 shadow-sm text-center max-w-xs">
                                <div className="flex justify-center gap-1 mb-3">
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                                <p className="text-sm text-foreground font-medium mb-1">
                                  Ajustement en cours&hellip; jusqu&apos;&agrave; 2 minutes
                                </p>
                                <p className="text-xs text-muted font-light">
                                  {refineElapsed}s
                                </p>
                                <p className="text-xs text-muted font-light mt-2 italic">
                                  &laquo; {lastRefineComment} &raquo;
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comparator (hidden during refine loading for this target) */}
                      {!(isRefining && isRefineTarget) && (
                        <ImageComparator
                          originalUrl={result.originalUrl}
                          generatedUrl={displayUrl}
                          model={resultVersions[activeIdx]?.model || result.model}
                        />
                      )}

                      {/* Version selector */}
                      {!isRefining && (
                        <VersionSelector
                          versions={resultVersions}
                          activeVersion={activeIdx}
                          onSelect={(vIdx) => {
                            setActiveVersions((prev) => {
                              const updated = [...prev];
                              updated[index] = vIdx;
                              return updated;
                            });
                            // Update the comparator display
                            const selectedVersion = resultVersions[vIdx];
                            if (selectedVersion) {
                              setResults((prev) => {
                                const updated = [...prev];
                                updated[index] = {
                                  ...updated[index],
                                  generatedUrl: selectedVersion.imageUrl,
                                  model: selectedVersion.model,
                                };
                                return updated;
                              });
                            }
                          }}
                        />
                      )}

                      {/* Refine error */}
                      {refineError && isRefineTarget && !isRefining && (
                        <div className="bg-red-50/50 border border-red-200/60 rounded-2xl p-5 text-center">
                          <p className="text-red-600/80 text-sm mb-1">{refineError}</p>
                          <p className="text-red-400/70 text-xs font-light mb-3">
                            Votre it&eacute;ration n&apos;a pas &eacute;t&eacute; consomm&eacute;e.
                          </p>
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={handleRefineRetry}
                              className="text-xs text-red-500 underline underline-offset-4 hover:text-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
                            >
                              Reessayer
                            </button>
                            <button
                              onClick={handleRefineModify}
                              className="text-xs text-muted underline underline-offset-4 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
                            >
                              Modifier le commentaire
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Refine warnings (shown after successful refine) */}
                      {refineWarnings.length > 0 && isRefineTarget && !isRefining && !refineError && (
                        <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 text-left max-w-lg mx-auto">
                          <ul className="space-y-1">
                            {refineWarnings.map((w, wi) => (
                              <li key={wi} className="text-amber-600/80 text-xs font-light flex items-start gap-1.5">
                                <span className="mt-0.5 shrink-0">!</span>
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Refine button */}
                      {!isRefining && (
                        <div className="text-center space-y-1.5">
                          {iterationsRemaining > 0 ? (
                            <>
                              <button
                                onClick={() => handleOpenRefineModal(index)}
                                className="inline-flex items-center gap-2 border border-sage/40 text-sage px-5 min-h-[44px] py-2.5 rounded-full text-sm font-medium hover:bg-sage/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                Affiner ce r&eacute;sultat
                              </button>
                              <p className="text-[11px] text-muted font-light">
                                {iterationsRemaining} it&eacute;ration{iterationsRemaining > 1 ? "s" : ""} restante{iterationsRemaining > 1 ? "s" : ""} &mdash; affinez le mobilier, les couleurs ou la composition
                              </p>
                            </>
                          ) : (
                            <>
                              <button
                                disabled
                                title="It&eacute;rations &eacute;puis&eacute;es — rechargez un pack"
                                className="inline-flex items-center gap-2 border border-foreground/10 text-muted px-5 min-h-[44px] py-2.5 rounded-full text-sm font-medium cursor-not-allowed"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                Affiner ce r&eacute;sultat
                              </button>
                              <p className="text-[11px] text-muted font-light">
                                0 it&eacute;ration restante
                              </p>
                              <div className="mt-2 bg-foreground/5 border border-foreground/10 rounded-xl p-4 max-w-sm mx-auto">
                                <p className="text-xs text-muted font-light mb-2">
                                  Pour continuer &agrave; affiner, rechargez un pack de cr&eacute;dits.
                                </p>
                                <a
                                  href="#pricing"
                                  className="text-xs text-sage font-medium hover:text-sage/80 transition-colors underline underline-offset-4"
                                >
                                  Recharger mes cr&eacute;dits
                                </a>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Batch download */}
              {results.length > 1 && (
                <div className="text-center mt-8">
                  <button
                    onClick={handleDownloadAll}
                    className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors underline underline-offset-4 font-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    Tout t&eacute;l&eacute;charger ({results.length} images)
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                >
                  Relancer avec un autre style
                </button>
                <button
                  onClick={handleFullReset}
                  className="inline-flex items-center justify-center gap-2 border border-foreground/15 text-muted px-7 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                >
                  Nouvelle session
                </button>
              </div>
            </div>
          )}

          {/* Refine Modal */}
          <RefineModal
            isOpen={isRefineModalOpen}
            onClose={() => setIsRefineModalOpen(false)}
            onSubmit={handleRefine}
            iterationsRemaining={iterationsRemaining}
            isLoading={isRefining}
            warnings={refineWarnings}
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24 px-5 sm:px-8 bg-white/40">
        <div ref={pricingRef} className="reveal max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Tarifs simples et transparents
            </h2>
            <p className="text-muted font-light">
              Sans abonnement. Sans engagement.
            </p>
          </div>

          <p className="text-center text-sm text-muted font-light mb-10">
            Payez uniquement ce que vous utilisez &mdash; sans abonnement.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {/* Découverte */}
            <div className="border border-foreground/10 rounded-2xl p-6 text-center bg-background">
              <p className="text-xs text-muted font-medium uppercase tracking-widest mb-3">D&eacute;couverte</p>
              <p className="text-3xl font-bold text-foreground mb-0.5">4,90&euro;</p>
              <p className="text-xs text-muted font-light mb-1">5 cr&eacute;dits &middot; 0,98&euro;/photo</p>
              <p className="text-[11px] text-muted font-light mb-5">TTC &middot; TVA 20% incluse</p>
              <ul className="text-sm text-muted font-light space-y-2 text-left mb-6">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  12 styles disponibles
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  T&eacute;l&eacute;chargement HD
                </li>
              </ul>
              <p className="text-[11px] text-muted font-light mb-4">3 g&eacute;n&eacute;rations offertes sans CB</p>
              <a href="#outil" className="block w-full text-center border border-foreground/15 text-foreground px-4 py-2.5 rounded-full text-sm font-medium hover:bg-foreground/5 transition-colors">
                Essayer l&apos;outil
              </a>
            </div>

            {/* Starter */}
            <div className="border border-foreground/10 rounded-2xl p-6 text-center bg-background">
              <p className="text-xs text-muted font-medium uppercase tracking-widest mb-3">Starter</p>
              <p className="text-3xl font-bold text-foreground mb-0.5">14,90&euro;</p>
              <p className="text-xs text-muted font-light mb-1">20 cr&eacute;dits &middot; 0,75&euro;/photo</p>
              <p className="text-[11px] text-muted font-light mb-5">TTC &middot; TVA 20% incluse</p>
              <ul className="text-sm text-muted font-light space-y-2 text-left mb-6">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  1 it&eacute;ration par photo
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Lien partageable 7 jours
                </li>
              </ul>
              <a href="/pricing" className="w-full block text-center bg-foreground text-background px-4 py-2.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-colors">
                Acheter
              </a>
            </div>

            {/* Pro — recommended */}
            <div className="border-2 border-foreground rounded-2xl p-6 text-center bg-background relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-[11px] font-medium px-3 py-1 rounded-full uppercase tracking-wider">Recommand&eacute;</span>
              <p className="text-xs text-muted font-medium uppercase tracking-widest mb-3">Pro</p>
              <p className="text-3xl font-bold text-foreground mb-0.5">29&euro;</p>
              <p className="text-xs text-muted font-light mb-1">50 cr&eacute;dits &middot; 0,58&euro;/photo</p>
              <p className="text-[11px] text-muted font-light mb-5">TTC &middot; TVA 20% incluse</p>
              <ul className="text-sm text-muted font-light space-y-2 text-left mb-6">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  3 it&eacute;rations par photo
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Export PDF
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Lien partageable 30 jours
                </li>
              </ul>
              <a href="/pricing" className="w-full block text-center bg-foreground text-background px-4 py-2.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-colors">
                Acheter
              </a>
            </div>

            {/* Studio */}
            <div className="border border-foreground/10 rounded-2xl p-6 text-center bg-background">
              <p className="text-xs text-muted font-medium uppercase tracking-widest mb-3">Studio</p>
              <p className="text-3xl font-bold text-foreground mb-0.5">69&euro;</p>
              <p className="text-xs text-muted font-light mb-1">150 cr&eacute;dits &middot; 0,46&euro;/photo</p>
              <p className="text-[11px] text-muted font-light mb-5">TTC &middot; TVA 20% incluse</p>
              <ul className="text-sm text-muted font-light space-y-2 text-left mb-6">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  5 it&eacute;rations par photo
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Lien partageable 90 jours
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Support d&eacute;di&eacute;
                </li>
              </ul>
              <a href="mailto:contact@versiroom.fr" className="block w-full text-center border border-foreground/15 text-foreground px-4 py-2.5 rounded-full text-sm font-medium hover:bg-foreground/5 transition-colors">
                Nous contacter
              </a>
            </div>
          </div>

          <p className="text-center text-[11px] text-muted font-light mt-6">
            TVA r&eacute;cup&eacute;rable pour les professionnels assujettis.
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="text-center px-5 sm:px-8 pb-6 pt-8">
        <p className="text-[11px] text-muted font-light">
          Visuels g&eacute;n&eacute;r&eacute;s par intelligence artificielle &mdash; repr&eacute;sentations indicatives non contractuelles.
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-foreground/5 py-10 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted font-light">
          <div>
            <p>Pour les architectes, marchands de biens et particuliers</p>
            <p className="text-[11px] text-muted mt-1">Un produit <a href="https://versi-immobilier.fr" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Versi Immobilier</a></p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a href="#pricing" className="hover:text-foreground transition-colors py-2">
              Tarifs
            </a>
            <a href="/mentions-legales" className="hover:text-foreground transition-colors py-2">
              Mentions l&eacute;gales
            </a>
            <a href="/cgv" className="hover:text-foreground transition-colors py-2">
              CGV
            </a>
            <a href="/confidentialite" className="hover:text-foreground transition-colors py-2">
              Confidentialit&eacute;
            </a>
            <a
              href="mailto:contact@versiroom.fr"
              className="hover:text-foreground transition-colors py-2"
            >
              Contact
            </a>
            <span>&copy; Versiroom 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
