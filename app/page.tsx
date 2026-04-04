"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import StepIndicator from "@/components/StepIndicator";
import UploadZone from "@/components/UploadZone";
import StylePicker, { STYLES } from "@/components/StylePicker";
import ImageComparator from "@/components/ImageComparator";
import RefineModal from "@/components/RefineModal";
import VersionSelector from "@/components/VersionSelector";
import RoomTypePicker from "@/components/RoomTypePicker";
import OutdoorSubtypePicker from "@/components/OutdoorSubtypePicker";
import { ROOM_TYPE_LIST } from "@/lib/room-types";
import { OUTDOOR_SUBTYPE_LIST } from "@/lib/outdoor-subtypes";
import { processImage, isLikelyInterior } from "@/lib/image-utils";
import { OUTDOOR_STYLES, OUTDOOR_STYLE_LIST } from "@/lib/outdoor-styles";
import { useQueueStatus } from "@/lib/hooks/useQueueStatus";
import { useSession } from "next-auth/react";
import AuthModal from "@/components/AuthModal";
import PhotoAssociator from "@/components/PhotoAssociator";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

interface GenerationResult {
  originalUrl: string;
  generatedUrl: string;
  model: string;
  pass1Key?: string;
  photoId?: string;
  styleId?: string;
  styleName?: string;
  pass2Pending?: boolean;
  pass1Url?: string;
  // Per-result metadata for handleRefine/handleRegenerate
  isOutdoor?: boolean;
  outdoorSubtype?: string;
  customPromptUsed?: string;
  roomType?: string;
}

interface VersionEntry {
  imageUrl: string;
  comment?: string;
  model: string;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("versimo_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("versimo_session_id", sessionId);
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

function scrollToElement(id: string, delay = 600) {
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, delay);
}

/** Fetch WITHOUT AbortController signal — survives mobile tab-switch.
 *  The old MerchantMode used plain fetch() and never had this problem.
 *  AbortController + signal causes the browser to kill the fetch on tab-switch.
 *  We use Promise.race for timeout instead, which doesn't kill the fetch. */
async function resilientFetch(
  url: string,
  init: RequestInit,
  parentSignal?: AbortSignal
): Promise<Response> {
  const TIMEOUT_MS = 180_000; // 3 min

  // parentSignal is ONLY used for explicit user cancel (Annuler button).
  // We do NOT pass it to fetch — that would let the browser kill the fetch on tab-switch.
  // Instead we check it manually after the fetch completes.
  const fetchPromise = fetch(url, init);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("La génération a pris trop de temps. Vérifiez votre connexion et réessayez.")), TIMEOUT_MS);
  });

  // If user cancelled, reject immediately
  const cancelPromise = parentSignal
    ? new Promise<never>((_, reject) => {
        if (parentSignal.aborted) reject(new Error("Annulé"));
        parentSignal.addEventListener("abort", () => reject(new Error("Annulé")));
      })
    : new Promise<never>(() => {}); // never resolves

  try {
    const response = await Promise.race([fetchPromise, timeoutPromise, cancelPromise]);
    return response;
  } catch (err) {
    if (parentSignal?.aborted) throw err;
    if (err instanceof TypeError) {
      // Network error (not timeout, not cancel)
      throw new Error("Connexion perdue pendant la génération. Vérifiez votre réseau et réessayez.");
    }
    throw err;
  }
}

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [files, setFiles] = useState<File[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [perPhotoStyles, setPerPhotoStyles] = useState<Map<number, string[]>>(new Map());
  const [perPhotoRoomTypes, setPerPhotoRoomTypes] = useState<Map<number, string>>(new Map());
  const [perPhotoCustomPrompts, setPerPhotoCustomPrompts] = useState<Map<number, string>>(new Map());
  const [perPhotoOutdoor, setPerPhotoOutdoor] = useState<Map<number, boolean>>(new Map());
  const [perPhotoWithFurniture, setPerPhotoWithFurniture] = useState<Map<number, boolean>>(new Map());
  const [perPhotoFormat, setPerPhotoFormat] = useState<Map<number, "original" | "landscape" | "portrait">>(new Map());
  // withFurniture removed — per-photo toggle is the primary control (perPhotoWithFurniture)
  // handleRefine uses withFurniture: true directly
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [currentProcessing, setCurrentProcessing] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generationElapsed, setGenerationElapsed] = useState(0);
  const [preprocessWarnings, setPreprocessWarnings] = useState<string[]>([]);
  const [photoWarnings, setPhotoWarnings] = useState<Record<number, string>>({});

  // Async queue polling (when generation falls back to background processing)
  const { status: queueStatus, isPolling: isQueuePolling, startPolling: startQueuePolling, clearQueue } = useQueueStatus();
  const [queueToast, setQueueToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Auto-open auth modal when redirected from a protected route (middleware adds ?callbackUrl=)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authCallbackUrl, setAuthCallbackUrl] = useState<string | undefined>(undefined);

  // Changement 2 — Compte obligatoire avant génération
  // pendingGeneration = true quand l'utilisateur non connecté clique sur Générer
  const [pendingGeneration, setPendingGeneration] = useState(false);
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

  // Fetch maxIterations from API when session changes
  useEffect(() => {
    if (!session?.user?.id) {
      setMaxIterations(0);
      setIterationsRemaining(0);
      return;
    }
    fetch("/api/user/credits")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.maxIterations !== undefined) {
          setMaxIterations(data.maxIterations);
          setIterationsRemaining(data.maxIterations);
        }
        if (data?.credits !== undefined) {
          setUserCredits(data.credits);
        }
        if (data?.hasPro !== undefined) {
          setHasPro(data.hasPro);
        }
        if (data?.hasStarter !== undefined) {
          setHasStarter(data.hasStarter);
        }
      })
      .catch(() => { /* silently fail — iterations stay at 0 */ });
  }, [session?.user?.id, checkoutSuccess]); // Re-fetch after Stripe checkout

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
    const stripeTab = window.open("about:blank", "_blank");
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
        if (stripeTab) { stripeTab.location.href = data.url; } else { window.location.href = data.url; }
      }
    } catch {
      if (stripeTab) stripeTab.close();
      setLoadingPack(null);
    }
  }

  // Changement 2 — Ref pour la dernière version de handleGenerate (évite stale closure dans useEffect)
  const handleGenerateRef = useRef<() => void>(() => {});

  // Changement 2 — Callback après connexion réussie (credentials)
  // Ferme le modal et laisse le useEffect ci-dessous relancer la génération
  const handleAuthSuccess = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  // Changement 2 — Relancer la génération après auth réussie
  // Pour credentials : la session se met à jour sans reload, pendingGeneration est en mémoire
  // Pour OAuth : la page recharge, les fichiers sont perdus — pas de relance automatique
  useEffect(() => {
    if (pendingGeneration && authStatus === "authenticated" && files.length > 0) {
      setPendingGeneration(false);
      // Petit délai pour laisser le modal se fermer et le state se stabiliser
      setTimeout(() => {
        handleGenerateRef.current();
      }, 300);
    }
  }, [authStatus, pendingGeneration, files.length]);

  // F4 — Pro mode state
  const [dismissedAssociators, setDismissedAssociators] = useState<Set<number>>(new Set());

  // F3 — Outdoor state
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [outdoorSubtype, setOutdoorSubtype] = useState<string | null>("terrasse");
  const [selectedOutdoorStyle, setSelectedOutdoorStyle] = useState<string | null>(null);

  // User plan state
  const [hasPro, setHasPro] = useState(false);
  const [hasStarter, setHasStarter] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  // Max photos = min(crédits restants, 10) — pour tous les comptes
  const maxPhotos = Math.min(userCredits ?? 2, 10);

  // F1 — Iteration state (maxIterations fetched from API based on user pack)
  const [maxIterations, setMaxIterations] = useState(0);
  const [iterationsRemaining, setIterationsRemaining] = useState(0);
  const [versions, setVersions] = useState<VersionEntry[][]>([]); // per-result versions
  const [activeVersions, setActiveVersions] = useState<number[]>([]); // active version index per result
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [refineTargetIndex, setRefineTargetIndex] = useState<number>(0);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [lastRefineComment, setLastRefineComment] = useState<string>("");
  const [refineWarnings, setRefineWarnings] = useState<string[]>([]);

  // Regenerate state
  const [regenerateConfirmIndex, setRegenerateConfirmIndex] = useState<number | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [regeneratedIndex, setRegeneratedIndex] = useState<number | null>(null);
  const [regenerateElapsed, setRegenerateElapsed] = useState(0);
  const [refineElapsed, setRefineElapsed] = useState(0);

  const heroRef = useReveal();
  const toolRef = useReveal();
  const pricingRef = useReveal();

  // Multi-style toggle handler
  const handleStyleToggle = useCallback((styleId: string) => {
    setSelectedStyles((prev) => {
      if (prev.includes(styleId)) {
        // Don't allow deselecting the last style
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== styleId);
      }
      return [...prev, styleId];
    });
    // Clear customPrompt when deselecting custom
    if (selectedStyles.includes("custom") && selectedStyles.length > 1) {
      // Keep customPrompt if custom is still selected after toggle
    }
  }, [selectedStyles]);


  // F3 — Toggle handler: reset cross-states when switching modes
  const handleToggleOutdoor = useCallback((outdoor: boolean) => {
    setIsOutdoor(outdoor);
    if (outdoor) {
      // Switching to outdoor: reset indoor selections
      setSelectedStyles([]);
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

  // Queue status watcher — notify user when background generation completes or fails
  useEffect(() => {
    if (!queueStatus) return;
    if (queueStatus.status === "done") {
      setQueueToast({
        type: "success",
        message: "Votre visuel est prêt. Consultez votre galerie.",
      });
    } else if (queueStatus.status === "failed") {
      const reason = queueStatus.abandonReason;
      let msg = "La génération a échoué.";
      if (reason === "timeout") msg = "La génération a expiré après 45 minutes.";
      else if (reason === "max_retries") msg = "La génération a échoué après plusieurs tentatives.";
      else if (reason === "non_transient") msg = "La génération a rencontré une erreur définitive.";
      if (queueStatus.creditRefunded) msg += " Votre visuel a été remboursé automatiquement.";
      setQueueToast({ type: "error", message: msg });
    }
  }, [queueStatus]);

  // Auto-dismiss queue toast after 8s
  useEffect(() => {
    if (queueToast) {
      const t = setTimeout(() => setQueueToast(null), 8000);
      return () => clearTimeout(t);
    }
  }, [queueToast]);

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

  // Timer for regenerate elapsed time
  useEffect(() => {
    if (!isRegenerating) {
      setRegenerateElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setRegenerateElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRegenerating]);

  // Stable object URLs for file previews (no leak on re-render)
  const filePreviewUrls = useMemo(() => {
    return files.map((file) => URL.createObjectURL(file));
  }, [files]);

  useEffect(() => {
    return () => {
      filePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviewUrls]);

  // Reset per-photo overrides when files change
  useEffect(() => {
    setPerPhotoStyles(new Map());
    setPerPhotoRoomTypes(new Map());
    setPerPhotoCustomPrompts(new Map());
    setPerPhotoOutdoor(new Map());
    setPerPhotoWithFurniture(new Map());
    setPerPhotoFormat(new Map());
  }, [files]);

  // Abort controller for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Unified: all photos must have at least one style selected via per-photo cards
  const canGenerate =
    files.length > 0 &&
    perPhotoStyles.size === files.length &&
    (Array.from(perPhotoStyles.values()) as string[][]).every((v) => v.length > 0);

  const currentStep =
    results.length > 0
      ? 4
      : canGenerate
      ? 3
      : files.length > 0
      ? 2
      : 1;

  const handleGenerate = useCallback(async () => {
    if (files.length === 0) return;

    // Changement 2 — Compte obligatoire : si pas connecté, ouvrir AuthModal
    if (authStatus !== "authenticated") {
      setPendingGeneration(true);
      setAuthModalOpen(true);
      return;
    }

    // Check credits vs total jobs before launching
    const totalJobs = (Array.from(perPhotoStyles.values()) as string[][]).reduce((sum, v) => sum + v.length, 0);
    if (userCredits !== null && totalJobs > userCredits) {
      setError(`Vous avez ${userCredits} visuel${userCredits > 1 ? "s" : ""} restant${userCredits > 1 ? "s" : ""}, mais cette génération en nécessite ${totalJobs}. Réduisez le nombre de styles ou rechargez votre compte.`);
      return;
    }

    // Cancel any previous in-flight requests
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);
    setResults([]);
    setPreprocessWarnings([]);

    // Pre-check: validate that uploaded photos are rooms (blocking)
    // Convert blob URLs to data URIs for the validation API
    try {
      for (let i = 0; i < files.length; i++) {
        const dataUri = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(files[i]);
        });
        const res = await fetch("/api/validate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUri }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.isRoom) {
            setError(`La photo ${files.length > 1 ? (i + 1) + " " : ""}ne semble pas être une pièce ou un espace. Versimo fonctionne avec des photos de pièces vides (intérieur ou extérieur).`);
            return;
          }
        }
      }
    } catch {
      // Fail-open: if validation fails, continue with generation
    }

    setIsGenerating(true);
    scrollToElement("step-loading");

    // Custom prompt preprocessing is handled per-photo at the job level
    // (per-photo custom prompts are sent raw, same as the old multi-photo behavior)

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

    // Step 3: Build job list — each job is a (photo, style) pair
    interface GenerationJob {
      img: typeof processedImages[0];
      styleId: string;
      styleName: string;
      surfacePrompt: string;
      furniturePrompt: string;
      roomType: string | null;
      isOutdoor: boolean;
      outdoorSubtype: string | undefined;
      customPrompt: string;
      jobWithFurniture: boolean;
      outputFormat: "original" | "landscape" | "portrait";
    }

    const jobs: GenerationJob[] = [];

    // Unified: always use per-photo styles (even for 1 photo)
    for (const img of processedImages) {
      const imgIsOutdoor = perPhotoOutdoor.get(img.fileIndex) || isOutdoor;
      const overrideRoomType = perPhotoRoomTypes.get(img.fileIndex);
      const imgRoomType = overrideRoomType || selectedRoomType;
      const photoStyleIds = perPhotoStyles.get(img.fileIndex) || [];
      const overrideCustomPrompt = perPhotoCustomPrompts.get(img.fileIndex);
      const jobFurniture = perPhotoWithFurniture.get(img.fileIndex) !== false;
      const jobFormat = perPhotoFormat.get(img.fileIndex) || "original";

      for (const styleId of photoStyleIds) {
        if (styleId === "custom" && overrideCustomPrompt) {
          jobs.push({
            img,
            styleId: "custom",
            styleName: "Personnalisé",
            surfacePrompt: overrideCustomPrompt,
            furniturePrompt: overrideCustomPrompt,
            roomType: imgRoomType,
            isOutdoor: imgIsOutdoor,
            outdoorSubtype: imgIsOutdoor ? (overrideRoomType || outdoorSubtype || undefined) : undefined,
            customPrompt: overrideCustomPrompt,
            jobWithFurniture: jobFurniture,
            outputFormat: jobFormat,
          });
        } else if (imgIsOutdoor) {
          const oStyle = OUTDOOR_STYLES[styleId];
          if (oStyle) {
            jobs.push({
              img,
              styleId: oStyle.id,
              styleName: oStyle.label || styleId,
              surfacePrompt: oStyle.surfacePrompt,
              furniturePrompt: oStyle.furniturePrompt,
              roomType: imgRoomType,
              isOutdoor: true,
              outdoorSubtype: overrideRoomType || outdoorSubtype || undefined,
              customPrompt: "",
              jobWithFurniture: jobFurniture,
              outputFormat: jobFormat,
            });
          }
        } else {
          const style = STYLES.find((s) => s.id === styleId);
          if (style) {
            jobs.push({
              img,
              styleId: style.id,
              styleName: style.name,
              surfacePrompt: style.surfacePrompt,
              furniturePrompt: style.furniturePrompt,
              roomType: imgRoomType,
              isOutdoor: false,
              outdoorSubtype: undefined,
              customPrompt: "",
              jobWithFurniture: jobFurniture,
              outputFormat: jobFormat,
            });
          }
        }
      }
    }

    if (jobs.length === 0) {
      setIsGenerating(false);
      return;
    }

    // Step 4: Execute jobs in batches (max 2 concurrent)
    const MAX_CONCURRENT = 2;
    const allResults: GenerationResult[] = [];
    let hasPartialError = false;
    let hasQueued = false;

    for (let batch = 0; batch < jobs.length; batch += MAX_CONCURRENT) {
      if (controller.signal.aborted) break;
      const chunk = jobs.slice(batch, batch + MAX_CONCURRENT);
      setCurrentProcessing(batch);

      const batchResults = await Promise.allSettled(
        chunk.map(async (job) => {
          const response = await resilientFetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: job.img.base64,
              surfacePrompt: job.surfacePrompt,
              furniturePrompt: job.furniturePrompt,
              customPrompt: job.customPrompt || undefined,
              styleId: job.styleId,
              withFurniture: job.jobWithFurniture,
              outputFormat: job.outputFormat,
              width: job.img.width,
              height: job.img.height,
              sessionId: getSessionId(),
              roomType: job.roomType,
              isOutdoor: job.isOutdoor,
              outdoorSubtype: job.outdoorSubtype,
              // Progressive display: get pass1 immediately, pass2 separately
              splitMode: job.jobWithFurniture,
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

          // Handle async queue fallback (202 — generation queued for background processing)
          if (data.queued && data.queueId) {
            startQueuePolling(data.queueId);
            const queueError = new Error("__QUEUED__");
            queueError.name = "QueuedError";
            throw queueError;
          }

          // ── Split-mode: pass1 returned, launch pass2 in background ──
          console.log("[split-mode client] response data:", { pendingPass2: data.pendingPass2, pass1_key: !!data.pass1_key, splitMode: job.jobWithFurniture, hasImage: !!data.image });
          if (data.pendingPass2 && data.pass1_key) {
            const partialResult: GenerationResult = {
              originalUrl: filePreviewUrls[job.img.fileIndex],
              generatedUrl: data.image,
              model: data.model,
              pass1Key: data.pass1_key,
              styleId: job.styleId,
              styleName: job.styleName,
              pass2Pending: true,
              pass1Url: data.image,
              isOutdoor: job.isOutdoor,
              outdoorSubtype: job.outdoorSubtype,
              customPromptUsed: job.customPrompt || undefined,
              roomType: job.roomType || undefined,
            };

            // Optimistic credit decrement (server already debited)
            setUserCredits((prev) => prev !== null ? Math.max(0, prev - 1) : prev);

            // Add partial result immediately so user sees surfaces
            setResults((prev) => [...prev, partialResult]);

            // Launch pass 2 in background (fire-and-forget from batch perspective)
            const p2Pass1Key = data.pass1_key;
            resilientFetch("/api/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pass2Only: true,
                pass1_key: p2Pass1Key,
                sessionId: getSessionId(),
              }),
            }, controller.signal)
              .then(async (p2Response) => {
                if (controller.signal.aborted) return;
                if (!p2Response.ok) {
                  const p2Err = await p2Response.json().catch(() => ({}));
                  console.error("[pass2] failed:", p2Err.error);
                  setResults((prev) => {
                    const updated = prev.map((r) =>
                      r.pass1Key === p2Pass1Key
                        ? { ...r, pass2Pending: false, model: `${r.model} (ameublement échoué)` }
                        : r
                    );
                    if (!updated.some((r) => r.pass2Pending)) {
                      setTimeout(() => setIsGenerating(false), 0);
                    }
                    return updated;
                  });
                  return;
                }
                const p2Data = await p2Response.json();
                // Replace pass1 image with furnished result
                setResults((prev) => {
                  const updated = prev.map((r) =>
                    r.pass1Key === p2Pass1Key
                      ? {
                          ...r,
                          generatedUrl: p2Data.image,
                          model: p2Data.model,
                          pass2Pending: false,
                          photoId: p2Data.photoId || r.photoId,
                        }
                      : r
                  );
                  // If no more pending pass2, clear isGenerating
                  if (!updated.some((r) => r.pass2Pending)) {
                    setTimeout(() => setIsGenerating(false), 0);
                  }
                  return updated;
                });
                // Update versions array for this result
                setVersions((prev) =>
                  prev.map((entries) => {
                    if (entries.length > 0 && entries[0].imageUrl === partialResult.generatedUrl) {
                      return [{ imageUrl: p2Data.image, comment: undefined, model: p2Data.model }];
                    }
                    return entries;
                  })
                );
              })
              .catch((err) => {
                if (err instanceof Error && err.name === "AbortError") return;
                console.error("[pass2] error:", err);
                setResults((prev) => {
                  const updated = prev.map((r) =>
                    r.pass1Key === p2Pass1Key
                      ? { ...r, pass2Pending: false, model: `${r.model} (ameublement échoué)` }
                      : r
                  );
                  if (!updated.some((r) => r.pass2Pending)) {
                    setTimeout(() => setIsGenerating(false), 0);
                  }
                  return updated;
                });
              });

            return partialResult;
          }

          // Optimistic credit decrement (server already debited)
          setUserCredits((prev) => prev !== null ? Math.max(0, prev - 1) : prev);

          return {
            originalUrl: filePreviewUrls[job.img.fileIndex],
            generatedUrl: data.image,
            model: data.model,
            pass1Key: data.pass1_key,
            photoId: data.photoId,
            styleId: job.styleId,
            styleName: job.styleName,
            isOutdoor: job.isOutdoor,
            outdoorSubtype: job.outdoorSubtype,
            customPromptUsed: job.customPrompt || undefined,
          } as GenerationResult;
        })
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          allResults.push(result.value);
          // Split-mode results are already added to results via setResults in the split handler
          if (!result.value.pass2Pending && !result.value.pass1Url) {
            setResults((prev) => [...prev, result.value]);
          }
        } else {
          if (result.reason?.name === "AbortError") continue;
          // Queued jobs are not errors — they're being processed in the background
          if (result.reason?.name === "QueuedError") {
            hasQueued = true;
            continue;
          }
          hasPartialError = true;
          // For partial failures, show error but continue with other results
          if (allResults.length === 0 && batch + MAX_CONCURRENT >= jobs.length) {
            // Only set error if this is the last batch and no results yet
            setError(
              result.reason instanceof Error
                ? result.reason.message
                : "Erreur lors de la génération"
            );
          }
        }
      }
    }

    if (!controller.signal.aborted) {
      // Don't clear isGenerating if there are pending pass2 results — keep loading visible
      // The pass2 completion handler will clear isGenerating when all pass2 are done
      const hasPendingPass2 = allResults.some((r) => r.pass2Pending);
      if (!hasPendingPass2) {
        setIsGenerating(false);
      }
      if (hasQueued && allResults.length === 0) {
        // All jobs were queued — show info message
        setQueueToast({
          type: "info",
          message: "Le serveur est très sollicité. Votre visuel sera prêt sous peu dans votre galerie.",
        });
      } else if (hasQueued && allResults.length > 0) {
        setQueueToast({
          type: "info",
          message: "Certains visuels sont en file d'attente. Ils apparaîtront dans votre galerie.",
        });
      }
      if (hasPartialError && allResults.length > 0) {
        setError(`${allResults.length}/${jobs.length} génération${jobs.length > 1 ? "s" : ""} réussie${allResults.length > 1 ? "s" : ""}. Certains styles ont échoué.`);
      }
      if (allResults.length > 0) {
        setVersions(
          allResults.map((r) => [
            { imageUrl: r.generatedUrl, comment: undefined, model: r.model },
          ])
        );
        setActiveVersions(allResults.map(() => 0));
        setIterationsRemaining(maxIterations);
        scrollToElement("step-results");
      }
    }
  }, [files, filePreviewUrls, isOutdoor, outdoorSubtype, selectedRoomType, perPhotoStyles, perPhotoRoomTypes, perPhotoCustomPrompts, perPhotoOutdoor, perPhotoWithFurniture, perPhotoFormat, authStatus, startQueuePolling, maxIterations, userCredits]);

  // Changement 2 — Garder la ref à jour pour le useEffect post-auth
  handleGenerateRef.current = handleGenerate;

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
    setIterationsRemaining(maxIterations);
    setRefineError(null);
    setRefineWarnings([]);
    setLastRefineComment("");
    // Reset regenerate state
    setRegenerateConfirmIndex(null);
    setIsRegenerating(false);
    setRegeneratingIndex(null);
  };

  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setError(null);
    setPreprocessWarnings([]);
    // Clear pass2Pending on any results that were waiting for pass 2
    setResults((prev) =>
      prev.map((r) => r.pass2Pending ? { ...r, pass2Pending: false } : r)
    );
  };

  const handleFullReset = () => {
    abortControllerRef.current?.abort();
    setFiles([]);
    setSelectedStyles([]);
    setCustomPrompt("");
    setPerPhotoStyles(new Map());
    setPerPhotoRoomTypes(new Map());
    setPerPhotoCustomPrompts(new Map());
    setPerPhotoOutdoor(new Map());
    setPerPhotoWithFurniture(new Map());
    setPerPhotoFormat(new Map());
    setSelectedRoomType(null);
    setResults([]);
    setError(null);
    setIsGenerating(false);
    setPreprocessWarnings([]);
    setPhotoWarnings({});
    // Reset F1 state
    setVersions([]);
    setActiveVersions([]);
    setIterationsRemaining(maxIterations);
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
    // Reset regenerate state
    setRegenerateConfirmIndex(null);
    setIsRegenerating(false);
    setRegeneratingIndex(null);
    // Reset Changement 2 state
    setPendingGeneration(false);
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

      // Build previousModifications from versions UP TO the active version only.
      // This allows the user to select v1, click "Affiner", and iterate from v1
      // (ignoring v2/v3 comments) instead of always iterating from the latest.
      const targetVersions = versions[refineTargetIndex] || [];
      const activeIdx = activeVersions[refineTargetIndex] || 0;
      const previousModifications = targetVersions
        .slice(0, activeIdx + 1)
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
            userId: session?.user?.id || undefined,
            // Use per-result metadata (not global states) for outdoor/custom
            surfacePrompt: targetResult.isOutdoor && targetResult.styleId
              ? (OUTDOOR_STYLES[targetResult.styleId]?.surfacePrompt || "")
              : (targetResult.styleId && targetResult.styleId !== "custom"
                ? (STYLES.find((s) => s.id === targetResult.styleId)?.surfacePrompt || targetResult.customPromptUsed || "")
                : (targetResult.customPromptUsed || "")),
            furniturePrompt: targetResult.isOutdoor && targetResult.styleId
              ? (OUTDOOR_STYLES[targetResult.styleId]?.furniturePrompt || "")
              : (targetResult.styleId && targetResult.styleId !== "custom"
                ? (STYLES.find((s) => s.id === targetResult.styleId)?.furniturePrompt || targetResult.customPromptUsed || "")
                : (targetResult.customPromptUsed || "")),
            styleId: targetResult.styleId ?? "custom",
            withFurniture: true,
            width: 0,
            height: 0,
            isOutdoor: targetResult.isOutdoor || false,
            outdoorSubtype: targetResult.isOutdoor ? targetResult.outdoorSubtype : undefined,
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
        console.log("[refine] response:", { hasImage: !!data.image, model: data.model, iterationNumber: data.iterationNumber });

        if (!data.image) {
          throw new Error("Le serveur n'a pas retourné d'image. Réessayez.");
        }

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
    [results, refineTargetIndex, versions, activeVersions, session?.user?.id]
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

  const handleRegenerate = useCallback(async (index: number) => {
    const result = results[index];
    if (!result) return;

    setRegenerateConfirmIndex(null);
    setIsRegenerating(true);
    setRegeneratingIndex(index);
    setUserCredits((prev) => prev !== null ? Math.max(0, prev - 1) : prev);
    setError(null);

    // Cancel any previous in-flight requests
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Resolve surfacePrompt and furniturePrompt from styleId
    let surfacePrompt = "";
    let furniturePrompt = "";
    const styleId = result.styleId || "custom";

    if (result.customPromptUsed) {
      surfacePrompt = result.customPromptUsed;
      furniturePrompt = result.customPromptUsed;
    } else if (result.isOutdoor && OUTDOOR_STYLES[styleId]) {
      surfacePrompt = OUTDOOR_STYLES[styleId].surfacePrompt;
      furniturePrompt = OUTDOOR_STYLES[styleId].furniturePrompt;
    } else {
      const style = STYLES.find((s) => s.id === styleId);
      if (style) {
        surfacePrompt = style.surfacePrompt;
        furniturePrompt = style.furniturePrompt;
      }
    }

    // Convert blob: URL to base64 data URI (blob URLs can't be sent to the server)
    let imageDataUri = result.originalUrl;
    if (result.originalUrl.startsWith("blob:")) {
      try {
        const resp = await fetch(result.originalUrl);
        const blob = await resp.blob();
        imageDataUri = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch {
        setError("Impossible de lire l'image originale. Rechargez la page et réessayez.");
        setIsRegenerating(false);
        setRegeneratingIndex(null);
        setRegenerateConfirmIndex(null);
        return;
      }
    }

    // Recover original image dimensions
    let width = 0;
    let height = 0;
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => { width = img.naturalWidth; height = img.naturalHeight; resolve(); };
        img.onerror = reject;
        img.src = imageDataUri;
      });
    } catch {
      // Dimensions unknown — server will handle 0x0
    }

    try {
      const response = await resilientFetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageDataUri,
          surfacePrompt,
          furniturePrompt,
          customPrompt: result.customPromptUsed || undefined,
          styleId,
          withFurniture: true,
          outputFormat: "original",
          width,
          height,
          sessionId: getSessionId(),
          isOutdoor: result.isOutdoor || false,
          outdoorSubtype: result.isOutdoor ? result.outdoorSubtype : undefined,
          roomType: result.roomType || undefined,
          splitMode: true,
        }),
      }, controller.signal);

      if (!response.ok) {
        let errorMsg = "La régénération a échoué. Vérifiez votre connexion et réessayez";
        try {
          const data = await response.json();
          errorMsg = data.error || errorMsg;
        } catch {
          errorMsg = `Erreur serveur (${response.status}). Réessayez dans quelques instants.`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (data.pendingPass2 && data.pass1_key) {
        // Update result with pass1 immediately
        setResults((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...result,
            generatedUrl: data.image,
            model: data.model,
            pass1Key: data.pass1_key,
            pass2Pending: true,
            pass1Url: data.image,
          };
          return updated;
        });

        // Reset versions for this index
        setVersions((prev) => {
          const updated = [...prev];
          updated[index] = [{ imageUrl: data.image, comment: undefined, model: data.model }];
          return updated;
        });
        setActiveVersions((prev) => {
          const updated = [...prev];
          updated[index] = 0;
          return updated;
        });

        // Launch pass 2 in background
        const p2Pass1Key = data.pass1_key;
        resilientFetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pass2Only: true,
            pass1_key: p2Pass1Key,
            sessionId: getSessionId(),
          }),
        }, controller.signal)
          .then(async (p2Response) => {
            if (controller.signal.aborted) return;
            if (!p2Response.ok) {
              console.error("[regenerate pass2] failed");
              setResults((prev) => prev.map((r) =>
                r.pass1Key === p2Pass1Key
                  ? { ...r, pass2Pending: false, model: `${r.model} (ameublement échoué)` }
                  : r
              ));
              return;
            }
            const p2Data = await p2Response.json();
            setResults((prev) => prev.map((r) =>
              r.pass1Key === p2Pass1Key
                ? { ...r, generatedUrl: p2Data.image, model: p2Data.model, pass2Pending: false, photoId: p2Data.photoId || r.photoId }
                : r
            ));
            setVersions((prev) => prev.map((entries, i) => {
              if (i === index) {
                return [{ imageUrl: p2Data.image, comment: undefined, model: p2Data.model }];
              }
              return entries;
            }));
          })
          .catch((err) => {
            if (err instanceof Error && err.name === "AbortError") return;
            console.error("[regenerate pass2] error:", err);
            setResults((prev) => prev.map((r) =>
              r.pass1Key === p2Pass1Key
                ? { ...r, pass2Pending: false, model: `${r.model} (ameublement échoué)` }
                : r
            ));
          })
          .finally(() => {
            setIsRegenerating(false);
            setRegeneratingIndex(null);
            setRegeneratedIndex(index);
            setTimeout(() => setRegeneratedIndex(null), 3000);
          });
      } else {
        // Non-split response — replace directly
        setResults((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...result,
            generatedUrl: data.image,
            model: data.model,
            pass1Key: data.pass1_key,
            photoId: data.photoId,
            pass2Pending: false,
          };
          return updated;
        });
        setVersions((prev) => {
          const updated = [...prev];
          updated[index] = [{ imageUrl: data.image, comment: undefined, model: data.model }];
          return updated;
        });
        setActiveVersions((prev) => {
          const updated = [...prev];
          updated[index] = 0;
          return updated;
        });
        setIsRegenerating(false);
        setRegeneratingIndex(null);
        // Show "Nouveau résultat" badge briefly
        setRegeneratedIndex(index);
        setTimeout(() => setRegeneratedIndex(null), 3000);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "La régénération a échoué. Vérifiez votre connexion et réessayez.");
      setIsRegenerating(false);
      setRegeneratingIndex(null);
    }
  }, [results]);

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
          ctx.fillText("Généré par IA — Versimo", img.width - pad, img.height - pad);
          canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92);
        };
        img.src = result.generatedUrl;
      });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `versimo-${index + 1}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  };

  // Auto-scroll to per-photo config cards when files are added
  const prevFilesLength = useRef(0);
  useEffect(() => {
    if (files.length > 0 && prevFilesLength.current === 0) {
      scrollToElement("step-photo-config");
    }
    prevFilesLength.current = files.length;
  }, [files.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header variant="home" />

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
            Versimo préserve votre espace &mdash; il ne le réinvente pas.
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
                    alt="Salon scandinave meublé par Versimo"
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
            12 styles disponibles · Résultat en 90 secondes · Téléchargement HD{!session && " gratuit"}
          </p>

          <a
            href="#outil"
            className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 rounded-full font-medium hover:bg-foreground/85 active:scale-[0.99] transition-all duration-200 text-sm tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          >
            {session ? "Générer un visuel" : "Essayer gratuitement"}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
          {!session && (
            <p className="text-sm text-foreground/60 font-light mt-3">
              2 visuels offerts · Sans carte bancaire · <a href="#pricing" className="underline hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm">Tarifs à partir de 9,90 €</a>
            </p>
          )}

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
                {session ? "Découvrir →" : "Commencer gratuitement →"}
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
              {session?.user ? "Générez vos visuels meublés" : "2 visuels gratuits · Sans créer de compte"}
            </p>
          </div>

          {/* Unified flow — all users (Découverte, Starter, Pro) */}
          <StepIndicator currentStep={currentStep} />

          {/* Step 1: Upload */}
          <div className={files.length > 0 ? "mb-10" : "mb-0"}>
            <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-5">
              Upload
            </h3>
            {maxPhotos === 0 && userCredits === 0 ? (
              <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-6 text-center">
                <p className="text-sm text-foreground font-medium mb-2">Plus de visuels disponibles</p>
                <p className="text-xs text-muted font-light mb-3">Rechargez votre compte pour continuer à générer.</p>
                <a href="/pricing" className="text-xs text-sage font-medium underline underline-offset-4 hover:text-sage/80 transition-colors">
                  Recharger
                </a>
              </div>
            ) : (
              <UploadZone files={files} onFilesChange={setFiles} photoWarnings={photoWarnings} hidePreviews={files.length > 0} maxFiles={maxPhotos} />
            )}
          </div>

          {/* Step 2a: Type d'espace — HIDDEN (unified mode: per-photo cards handle this) — states kept for handleRefine compatibility */}
          <div id="step-space-type" className="hidden">
            <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-5">
              01 — Type d&apos;espace
            </h3>

            {/* Indoor / Outdoor toggle */}
            <div className="mb-6">
              <div
                role="radiogroup"
                aria-label="Choix entre intérieur et extérieur"
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
                {!selectedRoomType && selectedStyles.length > 0 && (
                  <p className="text-xs text-sage font-light text-center mt-2 animate-pulse">
                    ↑ Sélectionnez un type de pièce pour pouvoir générer
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

          {/* Step 2b: Style — HIDDEN (unified mode: per-photo cards handle this) — states kept for handleRefine compatibility */}
          <div id="step-style" className="hidden">
            <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-1">
              02 — Style
            </h3>
            <p className="text-xs text-muted/70 font-light mb-5">
              Vous pouvez sélectionner un ou plusieurs styles pour comparer
            </p>

            <StylePicker
              selectedStyles={selectedStyles}
              customPrompt={customPrompt}
              onStyleToggle={handleStyleToggle}
              onCustomPromptChange={setCustomPrompt}
              isOutdoor={isOutdoor}
              selectedOutdoorStyle={selectedOutdoorStyle}
              onSelectOutdoorStyle={setSelectedOutdoorStyle}
              disabled={isGenerating}
            />
          </div>

          {/* Per-photo config cards — always shown when files are uploaded */}
            {files.length > 0 && (
              <div id="step-photo-config" className="mb-10 scroll-mt-20 animate-fade-in-up">
                <h3 className="text-sm font-medium text-muted uppercase tracking-widest mb-5">
                  {files.length === 1 ? "Configurez votre photo" : "Configurez chaque photo"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {files.map((file, index) => {
                    const photoStyleIds = perPhotoStyles.get(index) || [];
                    const hasCustom = photoStyleIds.includes("custom");
                    const isPhotoOutdoor = perPhotoOutdoor.get(index) || false;

                    const togglePhotoStyle = (styleId: string) => {
                      const m = new Map<number, string[]>(perPhotoStyles);
                      const current: string[] = m.get(index) || [];
                      if (current.includes(styleId)) {
                        if (current.length === 1) return; // At least 1 style
                        m.set(index, current.filter((id: string) => id !== styleId));
                      } else {
                        m.set(index, [...current, styleId]);
                      }
                      setPerPhotoStyles(m);
                    };

                    const styleOptions = isPhotoOutdoor
                      ? OUTDOOR_STYLE_LIST.map((s) => ({ id: s.id, name: s.label }))
                      : STYLES.map((s) => ({ id: s.id, name: s.name }));

                    const photoWithFurniture = perPhotoWithFurniture.get(index) !== false;
                    const photoFormat = perPhotoFormat.get(index) || "original";

                    return (
                      <div key={`per-photo-${index}-${file.name}`} className="border border-foreground/5 rounded-2xl p-4 space-y-3 relative">
                        {/* Remove photo button */}
                        <button
                          type="button"
                          onClick={() => {
                            // Reindex all per-photo Maps when removing a photo
                            const reindex = <T,>(m: Map<number, T>): Map<number, T> => {
                              const next = new Map<number, T>();
                              m.forEach((v, k) => { if (k < index) next.set(k, v); else if (k > index) next.set(k - 1, v); });
                              return next;
                            };
                            setFiles((prev) => prev.filter((_, i) => i !== index));
                            setPerPhotoStyles(reindex(perPhotoStyles));
                            setPerPhotoRoomTypes(reindex(perPhotoRoomTypes));
                            setPerPhotoCustomPrompts(reindex(perPhotoCustomPrompts));
                            setPerPhotoOutdoor(reindex(perPhotoOutdoor));
                            setPerPhotoWithFurniture((prev) => reindex(prev));
                            setPerPhotoFormat((prev) => reindex(prev));
                          }}
                          aria-label={`Supprimer la photo ${index + 1}`}
                          className="absolute top-1.5 right-1.5 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-foreground/70 hover:bg-foreground/90 text-background text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 shadow-sm"
                        >
                          ×
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={filePreviewUrls[index]}
                          alt={`Photo ${index + 1}`}
                          className="w-full aspect-[4/3] object-cover rounded-xl"
                        />
                        {photoWarnings[index] && (
                          <p className="text-[10px] text-amber-600 font-medium leading-tight">
                            {photoWarnings[index]}
                          </p>
                        )}

                        {/* Toggle Intérieur / Extérieur */}
                        <div className="flex rounded-full bg-foreground/5 p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              const m = new Map(perPhotoOutdoor);
                              m.set(index, false);
                              setPerPhotoOutdoor(m);
                              const rm = new Map(perPhotoRoomTypes); rm.delete(index); setPerPhotoRoomTypes(rm);
                              const sm = new Map(perPhotoStyles); sm.delete(index); setPerPhotoStyles(sm);
                            }}
                            className={`flex-1 px-3 py-2 min-h-[44px] flex items-center justify-center rounded-full text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${!isPhotoOutdoor ? "bg-foreground text-background shadow-sm" : "text-muted"}`}
                          >
                            Intérieur
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const m = new Map(perPhotoOutdoor);
                              m.set(index, true);
                              setPerPhotoOutdoor(m);
                              const rm = new Map(perPhotoRoomTypes); rm.delete(index); setPerPhotoRoomTypes(rm);
                              const sm = new Map(perPhotoStyles); sm.delete(index); setPerPhotoStyles(sm);
                            }}
                            className={`flex-1 px-3 py-2 min-h-[44px] flex items-center justify-center rounded-full text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${isPhotoOutdoor ? "bg-foreground text-background shadow-sm" : "text-muted"}`}
                          >
                            Extérieur
                          </button>
                        </div>

                        {/* Type de pièce / sous-type */}
                        <div>
                          <label className="text-[11px] text-muted font-light block mb-1">
                            {isPhotoOutdoor ? "Type d'espace" : "Type de pièce"}
                          </label>
                          <select
                            value={perPhotoRoomTypes.get(index) || ""}
                            onChange={(e) => {
                              const m = new Map(perPhotoRoomTypes);
                              if (e.target.value) m.set(index, e.target.value); else m.delete(index);
                              setPerPhotoRoomTypes(m);
                            }}
                            className="w-full text-xs font-light bg-foreground/5 border-0 rounded-lg px-3 py-2 text-foreground min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                          >
                            <option value="">Non spécifié</option>
                            {isPhotoOutdoor
                              ? OUTDOOR_SUBTYPE_LIST.map((st) => (
                                  <option key={st.id} value={st.id}>{st.label}</option>
                                ))
                              : ROOM_TYPE_LIST.map((rt) => (
                                  <option key={rt.id} value={rt.id}>{rt.label}</option>
                                ))
                            }
                          </select>
                        </div>

                        {/* Styles (multi-select checkboxes) */}
                        <div>
                          <label className="text-[11px] text-muted font-light block mb-1">
                            Styles {photoStyleIds.length > 1 && <span className="text-foreground/60">({photoStyleIds.length} sélectionnés)</span>}
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {styleOptions.map((s) => {
                              const checked = photoStyleIds.includes(s.id);
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => togglePhotoStyle(s.id)}
                                  className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                                    checked
                                      ? "bg-foreground text-background"
                                      : "bg-foreground/5 text-muted hover:bg-foreground/10"
                                  }`}
                                >
                                  {s.name}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => togglePhotoStyle("custom")}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border border-dashed ${
                                hasCustom
                                  ? "bg-foreground text-background border-foreground"
                                  : "bg-transparent text-muted border-foreground/20 hover:bg-foreground/5"
                              }`}
                            >
                              Personnalisé
                            </button>
                          </div>
                        </div>

                        {/* Custom prompt */}
                        {hasCustom && (
                          <textarea
                            value={perPhotoCustomPrompts.get(index) || ""}
                            onChange={(e) => {
                              const m = new Map(perPhotoCustomPrompts);
                              m.set(index, e.target.value);
                              setPerPhotoCustomPrompts(m);
                            }}
                            placeholder="Décrivez le style souhaité..."
                            rows={2}
                            className="w-full text-xs font-light border border-foreground/10 rounded-lg px-3 py-2 resize-none focus:border-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 transition-colors placeholder:text-foreground/30"
                          />
                        )}

                        {/* Pièce meublée / Surfaces uniquement */}
                        <div className="flex gap-1 p-0.5 bg-foreground/5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              const m = new Map(perPhotoWithFurniture);
                              m.set(index, true);
                              setPerPhotoWithFurniture(m);
                            }}
                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                              photoWithFurniture ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
                            }`}
                          >
                            Pièce meublée
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const m = new Map(perPhotoWithFurniture);
                              m.set(index, false);
                              setPerPhotoWithFurniture(m);
                            }}
                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                              !photoWithFurniture ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
                            }`}
                          >
                            Surfaces uniquement
                          </button>
                        </div>

                        {/* Output format — Pro only */}
                        {hasPro && (
                          <div className="flex gap-1 p-0.5 bg-foreground/5 rounded-lg">
                            <button
                              type="button"
                              onClick={() => {
                                const m = new Map(perPhotoFormat);
                                m.set(index, "original");
                                setPerPhotoFormat(m);
                              }}
                              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                                photoFormat === "original" ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
                              }`}
                            >
                              Original
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const m = new Map(perPhotoFormat);
                                m.set(index, "landscape");
                                setPerPhotoFormat(m);
                              }}
                              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                                photoFormat === "landscape" ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
                              }`}
                            >
                              Paysage
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const m = new Map(perPhotoFormat);
                                m.set(index, "portrait");
                                setPerPhotoFormat(m);
                              }}
                              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                                photoFormat === "portrait" ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
                              }`}
                            >
                              Portrait
                            </button>
                          </div>
                        )}

                        {/* Appliquer à toutes — visible uniquement si plusieurs photos */}
                        {files.length > 1 && photoStyleIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newStyles = new Map(perPhotoStyles);
                              const newRoomTypes = new Map(perPhotoRoomTypes);
                              const newOutdoor = new Map(perPhotoOutdoor);
                              const newFurniture = new Map(perPhotoWithFurniture);
                              const newFormat = new Map(perPhotoFormat);
                              const newCustom = new Map(perPhotoCustomPrompts);
                              for (let i = 0; i < files.length; i++) {
                                if (i === index) continue;
                                newStyles.set(i, [...photoStyleIds]);
                                const rt = perPhotoRoomTypes.get(index);
                                if (rt) newRoomTypes.set(i, rt); else newRoomTypes.delete(i);
                                newOutdoor.set(i, isPhotoOutdoor);
                                newFurniture.set(i, photoWithFurniture);
                                newFormat.set(i, photoFormat);
                                const cp = perPhotoCustomPrompts.get(index);
                                if (cp) newCustom.set(i, cp); else newCustom.delete(i);
                              }
                              setPerPhotoStyles(newStyles);
                              setPerPhotoRoomTypes(newRoomTypes);
                              setPerPhotoOutdoor(newOutdoor);
                              setPerPhotoWithFurniture(newFurniture);
                              setPerPhotoFormat(newFormat);
                              setPerPhotoCustomPrompts(newCustom);
                            }}
                            className="w-full text-center text-xs text-sage hover:text-sage-dark font-medium py-1.5 rounded-lg hover:bg-sage/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                          >
                            Appliquer à toutes les photos
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Global options section removed — withFurniture + format toggles are now per-photo in the cards above */}

          {/* Generate Button */}
          {canGenerate && results.length === 0 && (
            <div id="step-generate" className="text-center mb-8 animate-fade-in-up sticky bottom-6 z-40 pb-[env(safe-area-inset-bottom)]">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-3 bg-foreground text-background px-10 py-4 rounded-full font-medium text-base hover:bg-foreground/85 transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Génération en cours… ({results.length + 1}/{(Array.from(perPhotoStyles.values()) as string[][]).reduce((sum, v) => sum + v.length, 0) || files.length})
                  </>
                ) : (
                  <>
                    {(() => {
                      const perPhotoStyleValues = Array.from(perPhotoStyles.values()) as string[][];
                      const totalCredits: number = perPhotoStyleValues.reduce((sum, v) => sum + v.length, 0);
                      return totalCredits > 1
                        ? `Générer — ${totalCredits} visuels`
                        : "Générer le visuel";
                    })()}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </>
                )}
              </button>
              {/* QW3 — Récapitulatif condensé sous le CTA */}
              {!isGenerating && (
                <p className="text-xs text-background/60 mt-2 font-light">
                  {(() => {
                    const allStyleIds = new Set<string>();
                    perPhotoStyles.forEach((ids) => ids.forEach((id) => allStyleIds.add(id)));
                    const styleNames = Array.from(allStyleIds).map((id) => {
                      if (id === "custom") return "Personnalisé";
                      const indoor = STYLES.find((s) => s.id === id);
                      if (indoor) return indoor.name;
                      const outdoor = OUTDOOR_STYLE_LIST.find((s) => s.id === id);
                      if (outdoor) return outdoor.label;
                      return id;
                    });
                    const allFurniture = Array.from(perPhotoWithFurniture.values());
                    const hasMixed = allFurniture.some((v) => v === true) && allFurniture.some((v) => v === false);
                    const modeLabel = hasMixed ? "Mixte" : (perPhotoWithFurniture.get(0) !== false ? "Pièce meublée" : "Surfaces uniquement");
                    return `${files.length} photo${files.length > 1 ? "s" : ""} · ${styleNames.length > 0 ? styleNames.join(", ") : "—"} · ${modeLabel}`;
                  })()}
                </p>
              )}
            </div>
          )}

          {/* Loading state with blur preview */}
          {isGenerating && (
            <div id="step-loading" className="space-y-6 py-8">
              {/* Blur preview placeholders */}
              <div className={`grid gap-4 mx-auto ${files.length === 1 ? "grid-cols-1 max-w-xl" : "grid-cols-1 sm:grid-cols-2 max-w-4xl"}`}>
                {files.map((file, i) => {
                  // Check if this photo has a partial result (pass1 surfaces visible)
                  const partialResult = results.find((r) => r.pass2Pending && r.originalUrl === filePreviewUrls[i]);
                  const done = results.some((r) => !r.pass2Pending && r.originalUrl === filePreviewUrls[i]);
                  const showPass1 = !!partialResult;
                  const active = i >= currentProcessing && i < currentProcessing + 2 && !done && !showPass1;
                  return (
                    <div key={i} className="relative rounded-2xl overflow-hidden border border-foreground/10">
                      <div className="aspect-[4/3]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={showPass1 ? partialResult.generatedUrl : filePreviewUrls[i]}
                          alt=""
                          className={`w-full h-full object-cover transition-all duration-700 ${done || showPass1 ? "" : "blur-sm brightness-95"}`}
                        />
                      </div>
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${done ? "opacity-0" : "opacity-100"}`}>
                        {showPass1 ? (
                          <div className="bg-background/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-sm text-center">
                            <div className="flex justify-center gap-1 mb-2">
                              <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                            <p className="text-sm text-foreground font-medium">Surfaces terminées</p>
                            <p className="text-xs text-muted font-light">Ameublement en cours…</p>
                          </div>
                        ) : active ? (
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
                      {done && !showPass1 && (
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

          {/* Queue polling banner */}
          {isQueuePolling && queueStatus && queueStatus.status !== "done" && queueStatus.status !== "failed" && (
            <div className="mb-8 bg-sage/5 border border-sage/20 rounded-2xl p-5 text-center animate-fade-in">
              <div className="flex justify-center gap-1 mb-3">
                <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <p className="text-sm text-foreground font-medium mb-1">
                Votre visuel est en cours de génération
              </p>
              <p className="text-xs text-muted font-light">
                {queueStatus.status === "processing"
                  ? "Traitement en cours… Le résultat apparaîtra dans votre galerie."
                  : `En file d'attente (tentative ${(queueStatus as { retryCount: number }).retryCount + 1})… Le résultat apparaîtra dans votre galerie.`}
              </p>
              <a
                href="/ma-galerie"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-sage font-medium hover:underline transition-colors"
              >
                Voir ma galerie
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          )}

          {/* Queue done banner */}
          {queueStatus && queueStatus.status === "done" && (
            <div className="mb-8 bg-green-50/50 border border-green-200/60 rounded-2xl p-5 text-center animate-fade-in">
              <p className="text-sm text-foreground font-medium mb-1">
                Votre visuel est prêt.
              </p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <a
                  href="/ma-galerie"
                  className="text-xs bg-sage text-white px-4 py-2 rounded-full font-medium hover:bg-sage/85 transition-colors"
                >
                  Voir dans ma galerie
                </a>
                <button
                  onClick={clearQueue}
                  className="text-xs text-muted hover:text-foreground transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {/* Queue failed banner */}
          {queueStatus && queueStatus.status === "failed" && (
            <div className="mb-8 bg-red-50/50 border border-red-200/60 rounded-2xl p-5 text-center animate-fade-in">
              <p className="text-sm text-red-600/80 font-medium mb-1">
                {queueStatus.abandonReason === "timeout"
                  ? "La génération a expiré après 45 minutes."
                  : queueStatus.abandonReason === "max_retries"
                  ? "La génération a échoué après plusieurs tentatives."
                  : "La génération a rencontré une erreur."}
              </p>
              {queueStatus.creditRefunded && (
                <p className="text-xs text-muted font-light">Votre crédit a été remboursé automatiquement.</p>
              )}
              <button
                onClick={clearQueue}
                className="mt-3 text-xs text-red-400 underline underline-offset-4 hover:text-red-600 transition-colors"
              >
                Fermer
              </button>
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

          {/* Step 3: Results — hidden during generation (split mode shows pass1 in loading block) */}
          {results.length > 0 && !isGenerating && (
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
                        <div className="relative rounded-2xl overflow-hidden border border-foreground/10 bg-foreground/5">
                          <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={displayUrl}
                              alt=""
                              className="w-full h-auto object-contain blur-sm brightness-95 transition-all duration-700"
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

                      {/* Regenerate loading state */}
                      {isRegenerating && regeneratingIndex === index && (
                        <div className="relative rounded-2xl overflow-hidden border border-foreground/10 bg-foreground/5">
                          <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={displayUrl}
                              alt=""
                              className="w-full h-auto object-contain blur-sm brightness-95 transition-all duration-700"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="bg-background/90 backdrop-blur-sm rounded-xl px-5 py-4 shadow-sm text-center max-w-xs">
                                <div className="flex justify-center gap-1 mb-3">
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                                <p className="text-sm text-foreground font-medium mb-1">
                                  Régénération en cours… jusqu&apos;à 2 minutes
                                </p>
                                <p className="text-xs text-muted font-light">
                                  {regenerateElapsed}s
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  abortControllerRef.current?.abort();
                                  setIsRegenerating(false);
                                  setRegeneratingIndex(null);
                                }}
                                className="mt-3 inline-flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-foreground/10 text-muted px-4 min-h-[36px] py-1.5 rounded-full text-xs font-medium hover:text-foreground hover:border-foreground/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comparator (hidden during refine loading or regenerate loading for this target) */}
                      {!(isRefining && isRefineTarget) && !(isRegenerating && regeneratingIndex === index) && (
                        <div className="relative">
                          {/* "Nouveau résultat" badge after regeneration */}
                          {regeneratedIndex === index && (
                            <div className="absolute top-3 left-3 z-20 bg-sage text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm animate-fade-in-up">
                              Nouveau résultat
                            </div>
                          )}
                          <ImageComparator
                            originalUrl={result.originalUrl}
                            generatedUrl={displayUrl}
                            styleLabel={results.length > 1 ? result.styleName : undefined}
                            model={resultVersions[activeIdx]?.model || result.model}
                          />
                          {/* Pass 2 pending overlay — surfaces shown while furniture generates */}
                          {result.pass2Pending && (
                            <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none z-10">
                              <div className="pointer-events-auto bg-background/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-sm border border-foreground/10 text-center max-w-xs">
                                <div className="flex justify-center gap-1 mb-2">
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                                <p className="text-sm text-foreground font-medium">
                                  Surfaces terminées — ameublement en cours
                                </p>
                                <p className="text-xs text-muted font-light mt-0.5">
                                  Encore 30 à 60 secondes
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Refine button — right after comparator, before share/associate */}
                      {!isRefining && !result.pass2Pending && maxIterations > 0 && (
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
                                Affiner {resultVersions.length > 1 ? `v${activeIdx + 1}` : "ce résultat"}
                              </button>
                              <p className="text-xs text-muted font-light">
                                {iterationsRemaining} itération{iterationsRemaining > 1 ? "s" : ""} restante{iterationsRemaining > 1 ? "s" : ""} &mdash; {resultVersions.length > 1 && activeIdx < resultVersions.length - 1 ? `itérera depuis la v${activeIdx + 1}` : "affinez le mobilier, les couleurs ou la composition"}
                              </p>
                            </>
                          ) : (
                            <>
                              <button
                                disabled
                                title="Itérations épuisées — rechargez des visuels pour continuer"
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
                                  Pour continuer à affiner, rechargez vos visuels.
                                </p>
                                <a
                                  href="/pricing"
                                  className="text-xs text-sage font-medium hover:text-sage/80 transition-colors underline underline-offset-4"
                                >
                                  Voir les offres
                                </a>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Regenerate button — visible for Starter+ plans, hidden during regeneration loading */}
                      {!isRefining && !result.pass2Pending && !(isRegenerating && regeneratingIndex === index) && (hasStarter || hasPro) && (
                        <div className="text-center">
                          {regenerateConfirmIndex === index ? (
                            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-4 max-w-sm mx-auto space-y-3">
                              <p className="text-xs text-muted font-light">
                                Consomme 1 visuel — votre résultat actuel sera remplacé
                              </p>
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => handleRegenerate(index)}
                                  disabled={isRegenerating}
                                  className="inline-flex items-center gap-1.5 bg-sage text-white px-4 min-h-[36px] py-1.5 rounded-full text-xs font-medium hover:bg-sage/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                >
                                  {isRegenerating && (
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  )}
                                  Confirmer
                                </button>
                                <button
                                  onClick={() => setRegenerateConfirmIndex(null)}
                                  disabled={isRegenerating}
                                  className="text-xs text-muted underline underline-offset-4 hover:text-foreground transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRegenerateConfirmIndex(index)}
                              disabled={isRegenerating}
                              className="text-xs text-muted font-light underline underline-offset-4 hover:text-foreground transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
                            >
                              {isRegenerating ? "Régénération en cours\u2026" : "Régénérer"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Photo associator — masqué après affinage/régénération */}
                      {session && result.photoId && !dismissedAssociators.has(index) && resultVersions.length <= 1 && regeneratedIndex !== index && (
                        <PhotoAssociator
                          photoId={result.photoId}
                          onDismiss={() => setDismissedAssociators((prev) => { const next = new Set(prev); next.add(index); return next; })}
                        />
                      )}

                      {/* Version selector — stays visible during refine so user can see/switch previous versions */}
                      <VersionSelector
                        versions={resultVersions}
                        activeVersion={activeIdx}
                        onSelect={(vIdx) => {
                          if (isRefining && isRefineTarget) return; // Disable switching while this result is refining
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
                              Réessayer
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

          {/* Refine Modal — rendered at root level, see below AuthModal */}
        </div>
      </section>

      {/* Pricing — masqué pour les utilisateurs connectés (gestion compte via /compte) */}
      {!session && (
      <section id="pricing" className="py-10 sm:py-14 px-5 sm:px-8 bg-background/40">
        <div ref={pricingRef} className="reveal max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Tarifs simples et transparents
            </h2>
            <p className="text-muted font-light">
              Essayez gratuitement, 2 visuels offerts sans carte bancaire
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch max-w-4xl mx-auto">
            {/* Découverte — Gratuit */}
            <div className="flex flex-col border border-foreground/8 rounded-2xl p-7 text-center bg-background hover:border-foreground/15 transition-colors">
              <p className="text-xs text-muted font-medium uppercase tracking-widest mb-4">Découverte</p>
              <p className="text-4xl font-bold text-foreground mb-0.5">0 €</p>
              <p className="text-xs text-muted font-light mb-1">2 visuels · 0 €/visuel</p>
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
      )}

      {/* Disclaimer */}
      <div className="text-center px-5 sm:px-8 pb-6 pt-8">
        <p className="text-[11px] text-muted font-light">
          Visuels générés par intelligence artificielle &mdash; représentations indicatives non contractuelles.
        </p>
      </div>

      {/* Footer */}
      <Footer currentPage="/" />

      {/* Refine Modal — must be at root level, not inside a scrollable container,
          to avoid z-index/stacking issues with useScrollLock (position:fixed on body) */}
      <RefineModal
        isOpen={isRefineModalOpen}
        onClose={() => setIsRefineModalOpen(false)}
        onSubmit={handleRefine}
        iterationsRemaining={iterationsRemaining}
        maxIterations={maxIterations}
        isLoading={isRefining}
        warnings={refineWarnings}
      />

      {/* Auth modal — auto-opened when redirected from protected route ou avant génération */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          // Si l'utilisateur ferme le modal sans se connecter, annuler la génération en attente
          setPendingGeneration(false);
        }}
        callbackUrl={authCallbackUrl}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Queue toast notification */}
      {queueToast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white text-xs font-medium px-5 py-3 rounded-full shadow-lg animate-fade-in-up flex items-center gap-2 ${
            queueToast.type === "success"
              ? "bg-green-600/90"
              : queueToast.type === "error"
              ? "bg-red-500/90"
              : "bg-sage/90"
          }`}
        >
          <span>{queueToast.message}</span>
          {queueToast.type === "success" && (
            <a href="/ma-galerie" className="underline underline-offset-2 font-semibold ml-1">
              Galerie
            </a>
          )}
          <button onClick={() => setQueueToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
