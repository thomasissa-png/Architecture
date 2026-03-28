"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import StepIndicator from "@/components/StepIndicator";
import UploadZone from "@/components/UploadZone";
import StylePicker, { StyleOption, STYLES } from "@/components/StylePicker";
import ImageComparator from "@/components/ImageComparator";
import RefineModal from "@/components/RefineModal";
import VersionSelector from "@/components/VersionSelector";
import RoomTypePicker from "@/components/RoomTypePicker";
import OutdoorSubtypePicker from "@/components/OutdoorSubtypePicker";
import { processImage, isLikelyInterior } from "@/lib/image-utils";
import { OUTDOOR_STYLES } from "@/lib/outdoor-styles";
import { useSession } from "next-auth/react";
import AuthButton from "@/components/AuthButton";
import AuthModal from "@/components/AuthModal";
import MerchantMode from "@/components/MerchantMode";
import PhotoAssociator from "@/components/PhotoAssociator";
import Footer from "@/components/Footer";

interface GenerationResult {
  originalUrl: string;
  generatedUrl: string;
  model: string;
  pass1Key?: string;
  photoId?: string;
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

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [files, setFiles] = useState<File[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [perPhotoStyles, setPerPhotoStyles] = useState<Map<number, string>>(new Map());
  const [withFurniture, setWithFurniture] = useState(true);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [currentProcessing, setCurrentProcessing] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generationElapsed, setGenerationElapsed] = useState(0);
  const [preprocessWarnings, setPreprocessWarnings] = useState<string[]>([]);

  // Auto-open auth modal when redirected from a protected route (middleware adds ?callbackUrl=)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authCallbackUrl, setAuthCallbackUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cb = params.get("callbackUrl");
    if (cb) {
      setAuthCallbackUrl(cb);
      if (authStatus === "unauthenticated") {
        setAuthModalOpen(true);
      }
    }
  }, [authStatus]);

  // Checkout success feedback
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutPack, setCheckoutPack] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setCheckoutSuccess(true);
      setCheckoutPack(params.get("pack"));
    }
  }, []);

  // --- Direct checkout from homepage pricing ---
  const [pendingPackId, setPendingPackId] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  // After auth, auto-buy the pending pack
  useEffect(() => {
    if (pendingPackId && session?.user?.id) {
      handleBuyDirect(pendingPackId);
      setPendingPackId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, pendingPackId]);

  async function handleBuyDirect(packId: string) {
    if (!session?.user?.id) {
      setPendingPackId(packId);
      setAuthModalOpen(true);
      return;
    }
    setLoadingPack(packId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors du paiement.");
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoadingPack(null);
    }
  }

  // F4 — Pro mode state (ex Mode Marchand)
  const [isMerchantMode, setIsMerchantMode] = useState(false);
  const [dismissedAssociators, setDismissedAssociators] = useState<Set<number>>(new Set());

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

  // Reset per-photo style overrides when files change
  useEffect(() => {
    setPerPhotoStyles(new Map());
  }, [files]);

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
          `"${files[invalidIndex].name}" ne semble pas être une photo d'intérieur. Uploadez une photo de pièce pour un meilleur résultat.`
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
      setError("Erreur lors du traitement des images. Vérifiez vos fichiers.");
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
          // Per-photo style override (indoor only, non-custom)
          let imgSurfacePrompt = surfacePrompt;
          let imgFurniturePrompt = furniturePrompt;
          let imgStyleId = effectiveStyleId;
          const overrideStyleId = perPhotoStyles.get(img.fileIndex);
          if (overrideStyleId && !isOutdoor) {
            const overrideStyle = STYLES.find((s) => s.id === overrideStyleId);
            if (overrideStyle) {
              imgSurfacePrompt = overrideStyle.surfacePrompt;
              imgFurniturePrompt = overrideStyle.furniturePrompt;
              imgStyleId = overrideStyle.id;
            }
          }

          const response = await resilientFetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: img.base64,
              surfacePrompt: imgSurfacePrompt,
              furniturePrompt: imgFurniturePrompt,
              styleId: imgStyleId,
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
            photoId: data.photoId,
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
              : "Erreur lors de la génération"
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
  }, [files, selectedStyle, customPrompt, withFurniture, filePreviewUrls, isOutdoor, selectedOutdoorStyle, outdoorSubtype, selectedRoomType, perPhotoStyles]);

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
    setPerPhotoStyles(new Map());
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
        setRefineError("Les surfaces de cette génération ont expiré. Regénérez depuis l'image originale.");
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
          <a href="/" className="text-xl font-semibold text-foreground tracking-tighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm">
            Versiroom
          </a>
          <nav className="flex items-center gap-2 sm:gap-6">
            {session && (
              <>
                <a href="/mes-biens" className="hidden sm:inline text-xs text-muted font-light hover:text-foreground transition-colors">
                  Mes biens
                </a>
                <a href="/ma-galerie" className="hidden sm:inline text-xs text-muted font-light hover:text-foreground transition-colors">
                  Ma galerie
                </a>
                <a href="/mes-dossiers" className="hidden sm:inline text-xs text-muted font-light hover:text-foreground transition-colors">
                  Mes dossiers
                </a>
              </>
            )}
            <a href="#pricing" className="hidden sm:inline text-xs text-muted font-light hover:text-foreground transition-colors">
              Tarifs
            </a>
            {session ? (
              <a
                href="/mes-biens"
                className="hidden sm:inline text-xs bg-foreground text-background px-3 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                Mes biens
              </a>
            ) : (
              <a
                href="#outil"
                className="text-xs bg-foreground text-background px-3 sm:px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                <span className="sm:hidden">Essayer</span>
                <span className="hidden sm:inline">Essayer gratuitement</span>
              </a>
            )}
            <AuthButton />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 sm:pt-28 pb-8 sm:pb-10 px-5 sm:px-8">
        <div ref={heroRef} className="reveal max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-[1.08] tracking-tighter mb-5 sm:mb-6">
            Votre pièce meublée,
            <br />
            <span className="font-light text-muted">en 90 secondes.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted font-light leading-relaxed max-w-2xl mx-auto mb-6 sm:mb-8">
            Uploadez une photo, choisissez un style parmi 12 ambiances curatées par des experts.
            <br className="hidden sm:inline" />
            Versiroom préserve votre espace &mdash; il ne le réinvente pas.
          </p>

          {/* Hero before/after — architectural illustration */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* AVANT — Pièce vide */}
              <div className="relative group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-foreground/[0.05]">
                  {/* Architectural SVG — empty room with window light */}
                  <svg className="w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Back wall */}
                    <rect x="40" y="30" width="320" height="220" fill="#e8e4de" />
                    {/* Floor */}
                    <path d="M0 250 L40 250 L40 300 L400 300 L400 250 L360 250 L360 250 L0 250Z" fill="#d4cdc2" />
                    <path d="M40 250 L0 300 L400 300 L360 250Z" fill="#cec6ba" />
                    {/* Floor planks */}
                    <line x1="80" y1="258" x2="40" y2="300" stroke="#c4bbb0" strokeWidth="0.5" />
                    <line x1="160" y1="254" x2="100" y2="300" stroke="#c4bbb0" strokeWidth="0.5" />
                    <line x1="240" y1="254" x2="200" y2="300" stroke="#c4bbb0" strokeWidth="0.5" />
                    <line x1="320" y1="258" x2="300" y2="300" stroke="#c4bbb0" strokeWidth="0.5" />
                    {/* Window */}
                    <rect x="140" y="60" width="120" height="140" rx="2" fill="#dce8f0" stroke="#c8c0b4" strokeWidth="1.5" />
                    <line x1="200" y1="60" x2="200" y2="200" stroke="#c8c0b4" strokeWidth="1" />
                    <line x1="140" y1="130" x2="260" y2="130" stroke="#c8c0b4" strokeWidth="1" />
                    {/* Window light on floor */}
                    <path d="M140 250 L120 300 L280 300 L260 250Z" fill="#e8e4de" fillOpacity="0.4" />
                    {/* Left wall perspective */}
                    <path d="M0 0 L40 30 L40 250 L0 300Z" fill="#ddd8d0" />
                    {/* Right wall perspective */}
                    <path d="M400 0 L360 30 L360 250 L400 300Z" fill="#ddd8d0" />
                    {/* Ceiling */}
                    <path d="M0 0 L40 30 L360 30 L400 0Z" fill="#f0ede8" />
                    {/* Baseboard */}
                    <line x1="40" y1="248" x2="360" y2="248" stroke="#c8c0b4" strokeWidth="2" />
                    {/* Outlet on wall */}
                    <rect x="310" y="200" width="8" height="12" rx="1" fill="none" stroke="#c8c0b4" strokeWidth="0.8" />
                  </svg>
                  {/* Real photo — static file, no API dependency */}
                  <img
                    src="/imageavant.jpg"
                    alt="Pièce vide avant home staging"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-2.5 left-2.5 text-xs font-medium text-muted bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  AVANT
                </span>
              </div>
              {/* APRÈS — Scandinave meublé */}
              <div className="relative group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-foreground/[0.03]">
                  {/* Architectural SVG — scandinavian furnished room */}
                  <svg className="w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Back wall — warm white */}
                    <rect x="40" y="30" width="320" height="220" fill="#f0ebe4" />
                    {/* Floor — light oak */}
                    <path d="M40 250 L0 300 L400 300 L360 250Z" fill="#d8c9ae" />
                    <rect x="40" y="246" width="320" height="4" fill="#d8c9ae" />
                    {/* Floor planks */}
                    <line x1="80" y1="258" x2="40" y2="300" stroke="#cebfa3" strokeWidth="0.6" />
                    <line x1="160" y1="254" x2="100" y2="300" stroke="#cebfa3" strokeWidth="0.6" />
                    <line x1="240" y1="254" x2="200" y2="300" stroke="#cebfa3" strokeWidth="0.6" />
                    <line x1="320" y1="258" x2="300" y2="300" stroke="#cebfa3" strokeWidth="0.6" />
                    {/* Window */}
                    <rect x="140" y="60" width="120" height="140" rx="2" fill="#e4eef5" stroke="#c8c0b4" strokeWidth="1.5" />
                    <line x1="200" y1="60" x2="200" y2="200" stroke="#c8c0b4" strokeWidth="1" />
                    <line x1="140" y1="130" x2="260" y2="130" stroke="#c8c0b4" strokeWidth="1" />
                    {/* Window light on floor */}
                    <path d="M140 250 L120 300 L280 300 L260 250Z" fill="white" fillOpacity="0.15" />
                    {/* Left wall perspective */}
                    <path d="M0 0 L40 30 L40 250 L0 300Z" fill="#ebe6de" />
                    {/* Right wall perspective */}
                    <path d="M400 0 L360 30 L360 250 L400 300Z" fill="#ebe6de" />
                    {/* Ceiling */}
                    <path d="M0 0 L40 30 L360 30 L400 0Z" fill="#f5f2ed" />
                    {/* PH5-style pendant lamp */}
                    <line x1="200" y1="0" x2="200" y2="55" stroke="#444" strokeWidth="0.5" />
                    <ellipse cx="200" cy="62" rx="22" ry="8" fill="#f0f0f0" stroke="#ddd" strokeWidth="0.5" />
                    <ellipse cx="200" cy="58" rx="18" ry="5" fill="#fff" stroke="#e8e8e8" strokeWidth="0.5" />
                    <ellipse cx="200" cy="55" rx="13" ry="4" fill="#f8f8f8" stroke="#eee" strokeWidth="0.5" />
                    {/* Sofa — light grey linen, 230cm */}
                    <rect x="55" y="175" width="160" height="55" rx="6" fill="#d5d0c8" />
                    <rect x="55" y="170" width="160" height="20" rx="5" fill="#ddd8d0" />
                    {/* Sofa back */}
                    <rect x="55" y="148" width="160" height="28" rx="4" fill="#ccc7bf" />
                    {/* Sofa legs — tapered wood */}
                    <line x1="65" y1="230" x2="62" y2="245" stroke="#a08860" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="205" y1="230" x2="208" y2="245" stroke="#a08860" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Cushions — Nordic pattern blue/grey */}
                    <rect x="80" y="160" width="28" height="24" rx="4" fill="#8fa8b8" />
                    <rect x="118" y="162" width="26" height="22" rx="4" fill="#b8c4c8" />
                    <rect x="155" y="160" width="28" height="24" rx="4" fill="#95a5a0" />
                    {/* Coffee table — light oak round */}
                    <ellipse cx="200" cy="262" rx="35" ry="10" fill="#c8b48e" />
                    <ellipse cx="200" cy="258" rx="35" ry="10" fill="#d4c4a0" />
                    {/* Table legs */}
                    <line x1="180" y1="260" x2="178" y2="278" stroke="#a08860" strokeWidth="2" />
                    <line x1="220" y1="260" x2="222" y2="278" stroke="#a08860" strokeWidth="2" />
                    {/* Book stack on table */}
                    <rect x="190" y="250" width="20" height="4" rx="0.5" fill="#c4a882" />
                    <rect x="192" y="246" width="16" height="4" rx="0.5" fill="#a8b8b0" />
                    {/* Floor lamp — AJ-style */}
                    <line x1="290" y1="118" x2="290" y2="244" stroke="#333" strokeWidth="2" />
                    <line x1="280" y1="244" x2="300" y2="244" stroke="#333" strokeWidth="2.5" />
                    <path d="M280 118 L290 110 L300 118 L296 120 L284 120Z" fill="#333" />
                    {/* Rug — 200x300cm wool */}
                    <ellipse cx="180" cy="270" rx="100" ry="22" fill="#e0d8cc" fillOpacity="0.5" />
                    {/* Wegner-style accent chair */}
                    <rect x="290" y="186" width="40" height="34" rx="4" fill="#d4c4a0" />
                    <path d="M288 185 C288 170 332 170 332 185" stroke="#b8a47c" strokeWidth="2" fill="none" />
                    <line x1="294" y1="220" x2="292" y2="242" stroke="#a08860" strokeWidth="2" strokeLinecap="round" />
                    <line x1="326" y1="220" x2="328" y2="242" stroke="#a08860" strokeWidth="2" strokeLinecap="round" />
                    {/* Plant — fiddle leaf in white pot */}
                    <rect x="52" y="210" width="18" height="22" rx="2" fill="#f0ebe4" stroke="#ddd" strokeWidth="0.5" />
                    <circle cx="61" cy="200" r="12" fill="#6b8f5e" fillOpacity="0.7" />
                    <circle cx="55" cy="194" r="8" fill="#7da06e" fillOpacity="0.6" />
                    <circle cx="67" cy="192" r="9" fill="#5a7e4c" fillOpacity="0.5" />
                    <line x1="61" y1="210" x2="61" y2="196" stroke="#6b7a50" strokeWidth="1.5" />
                    {/* Sofa shadow */}
                    <ellipse cx="135" cy="244" rx="85" ry="4" fill="#000" fillOpacity="0.04" />
                    {/* Baseboard */}
                    <line x1="40" y1="248" x2="360" y2="248" stroke="#d8d0c6" strokeWidth="2" />
                  </svg>
                  {/* Real photo — static file, no API dependency */}
                  <img
                    src="/imageapres.jpg"
                    alt="Salon scandinave meublé par Versiroom"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-2.5 left-2.5 text-xs font-medium text-sage bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  APRÈS
                </span>
              </div>
            </div>
          </div>

          {/* Social proof line */}
          <p className="text-xs text-muted font-light mb-6">
            12 styles disponibles &middot; Résultat en 90 secondes &middot; Téléchargement HD gratuit
          </p>

          <a
            href="#outil"
            className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-full font-medium hover:bg-foreground/85 active:scale-[0.99] transition-all duration-200 text-sm tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          >
            Essayer gratuitement
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
          <p className="text-sm text-foreground/60 font-light mt-3">
            3 visuels offerts · Sans carte bancaire · <a href="#pricing" className="underline hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm">Tarifs à partir de 9,90 €</a>
          </p>

          {/* Persona cards — 3 profils */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">

            {/* Architectes */}
            <a
              href="/architecte"
              className="group flex flex-col gap-1.5 bg-foreground/[0.03] border border-foreground/8 rounded-xl px-5 py-4 hover:bg-foreground/[0.06] hover:border-foreground/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              <p className="text-sm font-medium text-foreground leading-snug">
                Architectes d&apos;intérieur
              </p>
              <p className="text-xs text-muted font-light leading-relaxed">
                Un support de conversation prêt avant le premier RDV — sans attendre 3 jours un rendu.
              </p>
              <span className="text-sm text-sage font-medium mt-1 group-hover:translate-x-0.5 transition-transform duration-200 inline-block">
                Voir les cas d&apos;usage →
              </span>
            </a>

            {/* Marchands de biens */}
            <a
              href="/marchand"
              className="group flex flex-col gap-1.5 bg-foreground/[0.03] border border-foreground/8 rounded-xl px-5 py-4 hover:bg-foreground/[0.06] hover:border-foreground/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              <p className="text-sm font-medium text-foreground leading-snug">
                Marchands de biens
              </p>
              <p className="text-xs text-muted font-light leading-relaxed">
                Des visuels et dossiers PDF de pré-commercialisation en 10 minutes — sans prestataire.
              </p>
              <span className="text-sm text-sage font-medium mt-1 group-hover:translate-x-0.5 transition-transform duration-200 inline-block">
                Découvrir le Mode Pro →
              </span>
            </a>

            {/* Particuliers */}
            <a
              href="/particulier"
              className="group flex flex-col gap-1.5 bg-foreground/[0.03] border border-foreground/8 rounded-xl px-5 py-4 hover:bg-foreground/[0.06] hover:border-foreground/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              <p className="text-sm font-medium text-foreground leading-snug">
                Particuliers
              </p>
              <p className="text-xs text-muted font-light leading-relaxed">
                Votre pièce dans le style que vous choisissez — pas le salon de quelqu&apos;un d&apos;autre.
              </p>
              <span className="text-sm text-sage font-medium mt-1 group-hover:translate-x-0.5 transition-transform duration-200 inline-block">
                Commencer gratuitement →
              </span>
            </a>

          </div>
        </div>
      </section>

      {/* Liens personas déplacés après le pricing — les liens discrets sous le CTA Hero suffisent ici */}

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-foreground/10" />

      {/* Tool Section */}
      <section id="outil" className="pt-12 sm:pt-16 pb-12 sm:pb-16 px-5 sm:px-8 scroll-mt-16">
        <div ref={toolRef} className="reveal max-w-5xl mx-auto">
          {/* Checkout success feedback */}
          {checkoutSuccess && (
            <div className="mb-8 max-w-3xl mx-auto bg-sage/10 border border-sage/20 rounded-2xl px-5 py-4 text-center">
              <p className="text-sm font-medium text-foreground">
                Paiement confirmé — vos visuels sont disponibles.
              </p>
              <p className="text-xs text-muted font-light mt-1">
                {checkoutPack === "pro" ? "Abonnement Pro activé · 50 visuels/mois" : "Pack ajouté à votre compte"}
              </p>
            </div>
          )}
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Mettez en scène votre espace
            </h2>
            <p className="text-muted font-light">
              {session?.user ? "Générez vos visuels meublés" : "3 visuels gratuits · Sans créer de compte"}
            </p>
          </div>

          {/* F4 — Mode toggle: Standard / Pro (visible only when authenticated) */}
          {session && (
          <div className="flex justify-center mb-8" data-testid="mode-toggle">
            <div className="inline-flex rounded-full bg-foreground/5 p-0.5">
              <button
                onClick={() => setIsMerchantMode(false)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                  !isMerchantMode
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
                data-testid="mode-standard"
              >
                Standard
              </button>
              <button
                onClick={() => setIsMerchantMode(true)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                  isMerchantMode
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
                data-testid="mode-merchant"
              >
                Mode Pro
              </button>
            </div>
          </div>
          )}

          {/* F4 — Merchant Mode */}
          {isMerchantMode && (
            <div className="animate-fade-in-up mb-10">
              <MerchantMode />
              <div className="max-w-24 mx-auto border-t border-foreground/10 my-8" />
              <p className="text-xs text-muted font-light text-center mb-6">Ou générez des visuels à la volée :</p>
            </div>
          )}

          {/* Standard Mode — toujours visible (même en Pro) */}
          {(
          <>
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
                  Intérieur
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
                  Extérieur
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
                    Sélectionnez un type de pièce pour continuer
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

            {/* Per-photo style override (indoor, multi-photo only) */}
            {files.length > 1 && !isOutdoor && (
              <div className="mt-6 pt-6 border-t border-foreground/5 animate-fade-in-up">
                <p className="text-xs text-muted font-light mb-4">
                  Style par photo <span className="opacity-60">(optionnel — par défaut, toutes utilisent le style ci-dessus)</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((file, index) => (
                    <div key={`per-photo-${index}-${file.name}`} className="border border-foreground/5 rounded-xl p-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={filePreviewUrls[index]}
                        alt={`Photo ${index + 1}`}
                        className="w-full aspect-[4/3] object-cover rounded-lg mb-2"
                      />
                      <select
                        value={perPhotoStyles.get(index) || ""}
                        onChange={(e) => {
                          const newMap = new Map(perPhotoStyles);
                          if (e.target.value) {
                            newMap.set(index, e.target.value);
                          } else {
                            newMap.delete(index);
                          }
                          setPerPhotoStyles(newMap);
                        }}
                        aria-label={`Style pour la photo ${index + 1}`}
                        className="w-full text-xs font-light bg-foreground/5 border-0 rounded-lg px-2 py-1.5 text-foreground min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                      >
                        <option value="">Style global</option>
                        {STYLES.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
                    !withFurniture
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-foreground/5 text-muted hover:bg-foreground/10"
                  }`}
                >
                  Surfaces uniquement
                </button>
                <button
                  onClick={() => setWithFurniture(true)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 ${
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
                  : "Pièce finie sans meuble — idéal pour voir les surfaces"}
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
                    Génération en cours… ({currentProcessing + 1}/{files.length})
                  </>
                ) : (
                  <>
                    Générer la visualisation
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
              <div className={`grid gap-4 mx-auto ${files.length === 1 ? "grid-cols-1 max-w-xl" : "grid-cols-1 sm:grid-cols-2 max-w-4xl"}`}>
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
                          <div className="bg-background/90 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                            <span className="text-xs text-muted font-light">Génération…</span>
                          </div>
                        ) : done ? null : (
                          <div className="bg-background/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
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
                    ? `${generationElapsed}s — Estimation : jusqu'à 2 minutes par image`
                    : generationElapsed < 90
                    ? `${generationElapsed}s — Génération en cours…`
                    : `${generationElapsed}s — Presque terminé…`}
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
          {error && error.includes("Plus de visuels") ? (
            <div className="mb-12 bg-sage/5 border border-sage/20 rounded-2xl p-6 text-center">
              <p className="text-sm text-foreground font-medium">{error}</p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-sage font-medium hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
              >
                Voir les offres
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          ) : error ? (
            <div className="mb-12 bg-red-50/50 border border-red-200/60 rounded-2xl p-6 text-center">
              <p className="text-red-600/80 text-sm">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-3 text-xs text-red-400 underline underline-offset-4 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
              >
                Réessayer
              </button>
            </div>
          ) : null}

          {/* Step 3: Results */}
          {results.length > 0 && (
            <div id="step-results" className="animate-fade-in-up scroll-mt-28">
              <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-6">
                03 — Résultat
              </h3>
              <div className={`space-y-10 ${results.length === 1 ? "max-w-xl mx-auto" : ""}`}>
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
                              <div className="bg-background/90 backdrop-blur-sm rounded-xl px-5 py-4 shadow-sm text-center max-w-xs">
                                <div className="flex justify-center gap-1 mb-3">
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                                <p className="text-sm text-foreground font-medium mb-1">
                                  Ajustement en cours… jusqu&apos;à 2 minutes
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

                      {/* Photo associator for merchants */}
                      {session && result.photoId && !dismissedAssociators.has(index) && (
                        <PhotoAssociator
                          photoId={result.photoId}
                          onDismiss={() => setDismissedAssociators((prev) => { const next = new Set(prev); next.add(index); return next; })}
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
                            Votre itération n&apos;a pas été consommée.
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
                                Affiner ce résultat
                              </button>
                              <p className="text-xs text-muted font-light">
                                {iterationsRemaining} itération{iterationsRemaining > 1 ? "s" : ""} restante{iterationsRemaining > 1 ? "s" : ""} &mdash; affinez le mobilier, les couleurs ou la composition
                              </p>
                            </>
                          ) : (
                            <>
                              <button
                                disabled
                                title="Itérations épuisées — rechargez un pack"
                                className="inline-flex items-center gap-2 border border-foreground/10 text-muted px-5 min-h-[44px] py-2.5 rounded-full text-sm font-medium cursor-not-allowed"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                Affiner ce résultat
                              </button>
                              <p className="text-xs text-muted font-light">
                                0 itération restante
                              </p>
                              <div className="mt-2 bg-foreground/5 border border-foreground/10 rounded-xl p-4 max-w-sm mx-auto">
                                <p className="text-xs text-muted font-light mb-2">
                                  Pour continuer à affiner, continuez avec un pack — à partir de 9,90 €.
                                </p>
                                <a
                                  href="#pricing"
                                  className="text-xs text-sage font-medium hover:text-sage/80 transition-colors underline underline-offset-4"
                                >
                                  Voir les offres
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
                    Tout télécharger ({results.length} images)
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
                  className="inline-flex items-center justify-center gap-2 border border-foreground/10 text-muted px-7 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
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
          </>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-10 sm:py-14 px-5 sm:px-8 bg-background/40">
        <div ref={pricingRef} className="reveal max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Tarifs simples et transparents
            </h2>
            <p className="text-muted font-light">
              Essayez gratuitement, 3 visuels offerts sans carte bancaire
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch max-w-4xl mx-auto">
            {/* Découverte — Gratuit */}
            <div className="flex flex-col border border-foreground/8 rounded-2xl p-7 text-center bg-background hover:border-foreground/15 transition-colors">
              <p className="text-xs text-muted font-medium uppercase tracking-widest mb-4">Découverte</p>
              <p className="text-4xl font-bold text-foreground mb-0.5">0 €</p>
              <p className="text-xs text-muted font-light mb-1">3 visuels · 0 €/visuel</p>
              <p className="text-[11px] text-muted/60 font-light mb-6">Sans carte bancaire</p>
              <ul className="text-sm text-muted font-light space-y-2.5 text-left mb-8 flex-1">
                <li className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  12 styles disponibles
                </li>
                <li className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Téléchargement HD
                </li>
                <li className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Partage & comparateur
                </li>
                <li className="flex items-start gap-2.5 opacity-40 line-through">
                  <svg className="w-4 h-4 text-muted/30 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
                  Itérations
                </li>
                <li className="flex items-start gap-2.5 opacity-40 line-through">
                  <svg className="w-4 h-4 text-muted/30 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
                  Mode Pro
                </li>
              </ul>
              <div className="mt-auto">
                <a href="#outil" className="block w-full text-center border border-foreground/15 text-foreground px-4 py-3 rounded-full text-sm font-medium hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2">
                  Essayer
                </a>
              </div>
            </div>

            {/* Starter — Achat unique */}
            <div className="flex flex-col border border-foreground/8 rounded-2xl p-7 text-center bg-background hover:border-foreground/15 transition-colors">
              <p className="text-xs text-muted font-medium uppercase tracking-widest mb-4">Starter</p>
              <p className="text-4xl font-bold text-foreground mb-0.5">9,90 €</p>
              <p className="text-xs text-muted font-light mb-1">15 visuels · 0,66 €/visuel</p>
              <p className="text-[11px] text-sage font-medium mb-1">Achat unique — sans abonnement</p>
              <p className="text-[11px] text-muted/60 font-light mb-6">TTC · TVA 20% incluse</p>
              <ul className="text-sm text-muted font-light space-y-2.5 text-left mb-8 flex-1">
                <li className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  12 styles + mode personnalisé
                </li>
                <li className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  1 itération par photo
                </li>
                <li className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Historique des visuels
                </li>
                <li className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Recharge : +10 visuels à 5,90 €
                </li>
                <li className="flex items-start gap-2.5 opacity-40 line-through">
                  <svg className="w-4 h-4 text-muted/30 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
                  Mode Pro
                </li>
              </ul>
              <div className="mt-auto">
                <button
                  onClick={() => handleBuyDirect("starter")}
                  disabled={loadingPack !== null}
                  className="block w-full text-center bg-foreground text-background px-4 py-3 rounded-full text-sm font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40"
                >
                  {loadingPack === "starter" ? "Redirection..." : "Acheter"}
                </button>
              </div>
            </div>

            {/* Pro — Recommandé — 29€/mois */}
            <div className="flex flex-col border-2 border-sage/30 rounded-2xl p-7 text-center bg-background relative shadow-[0_8px_32px_rgba(125,155,118,0.12)]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sage text-white text-[11px] font-semibold px-4 py-1 rounded-full tracking-wider shadow-sm">Recommandé</span>
              <p className="text-xs text-sage font-medium uppercase tracking-widest mb-4">Pro</p>
              <p className="text-4xl font-bold text-foreground mb-0.5">29 €<span className="text-base font-normal text-muted">/mois</span></p>
              <p className="text-xs text-muted font-light mb-1">50 visuels/mois · 0,58 €/visuel</p>
              <p className="text-[11px] text-muted/60 font-light mb-2">TTC · TVA 20% incluse</p>
              <p className="text-xs text-sage font-medium mb-6">29 €/mois au lieu de 200-500 € chez un home stager</p>
              <ul className="text-sm text-muted font-light space-y-2.5 text-left mb-4 flex-1">
                <li className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  3 itérations par photo
                </li>
                <li className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><strong className="font-medium text-foreground">Mode Pro</strong></span>
                </li>
                <li className="flex items-start gap-2.5 pl-6">
                  <svg className="w-3.5 h-3.5 text-sage/70 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="text-xs">Dossiers de pré-commercialisation</span>
                </li>
                <li className="flex items-start gap-2.5 pl-6">
                  <svg className="w-3.5 h-3.5 text-sage/70 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="text-xs">PDF brandé (logo, couleurs)</span>
                </li>
                <li className="flex items-start gap-2.5 pl-6">
                  <svg className="w-3.5 h-3.5 text-sage/70 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="text-xs">Annonces & liens sans limite</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Recharge : +20 visuels à 9 €
                </li>
              </ul>
              <div className="mt-auto">
                <button
                  onClick={() => handleBuyDirect("pro")}
                  disabled={loadingPack !== null}
                  className="block w-full text-center bg-sage text-white px-4 py-3 rounded-full text-sm font-semibold hover:bg-sage/85 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40"
                >
                  {loadingPack === "pro" ? "Redirection..." : "S'abonner"}
                </button>
              </div>
            </div>

          </div>

          <p className="text-center text-[11px] text-muted/60 font-light mt-8">
            TVA récupérable pour les professionnels assujettis.
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="text-center px-5 sm:px-8 pb-6 pt-8">
        <p className="text-[11px] text-muted font-light">
          Visuels générés par intelligence artificielle &mdash; représentations indicatives non contractuelles.
        </p>
      </div>

      {/* Footer */}
      <Footer currentPage="/" />

      {/* Auth modal — auto-opened when redirected from protected route */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        callbackUrl={authCallbackUrl}
      />
    </div>
  );
}
