"use client";

/**
 * Page extraction IA (Étape 2).
 *
 * Rendu : Client Component — appel API + polling + affichage résultats.
 *
 * Au mount : appelle POST /api/pro/projects/[id]/extract.
 * Affiche les pièces extraites groupées par étage avec édition inline.
 * Bouton "Valider et continuer" redirige vers /projet/[id]/validation.
 * En cas d'erreur : message + lien vers saisie manuelle (validation).
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProStepper from "@/components/marchand/ProStepper";
import { ROOM_TYPE_LABELS } from "@/components/marchand/RoomCard";
import PlanEditor, { type PlanRoom } from "@/components/marchand/PlanEditor";

// ─── Types ──────────────────────────────────────────────────────────

interface BoundingBox {
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
}

interface ExtractedRoom {
  id: string;
  name: string;
  room_type: string;
  surface_m2?: number | null;
  length_m?: number | null;
  width_m?: number | null;
  floor_index: number;
  is_new?: boolean;
  confidence?: number;
  bounding_box?: BoundingBox | null;
}

type ExtractionState = "idle" | "loading" | "success" | "error";

/** Label français pour un numéro d'étage */
function floorLabel(floorIndex: number): string {
  if (floorIndex === 0) return "Rez-de-chaussée";
  if (floorIndex === 1) return "Étage 1";
  return `Étage ${floorIndex}`;
}

/** Room type options for the select dropdown */
const ROOM_TYPE_OPTIONS = Object.entries(ROOM_TYPE_LABELS);

// ─── Plan Editor helpers ────────────────────────────────────────────

/** Couleurs par type de pièce pour l'éditeur de plan */
const PLAN_ROOM_COLORS: Record<string, string> = {
  salon: "rgba(125, 155, 118, 0.3)",
  sejour: "rgba(125, 155, 118, 0.3)",
  chambre: "rgba(100, 149, 237, 0.3)",
  chambre_parentale: "rgba(70, 130, 220, 0.3)",
  cuisine: "rgba(255, 165, 0, 0.3)",
  sdb: "rgba(0, 191, 255, 0.3)",
  wc: "rgba(160, 100, 220, 0.3)",
  bureau: "rgba(147, 112, 219, 0.3)",
  entree: "rgba(200, 180, 140, 0.3)",
  dressing: "rgba(180, 160, 200, 0.3)",
  cellier: "rgba(160, 180, 140, 0.3)",
  terrasse: "rgba(100, 200, 100, 0.3)",
  garage: "rgba(120, 120, 140, 0.3)",
  salle_a_manger: "rgba(230, 140, 80, 0.3)",
  couloir: "rgba(169, 169, 169, 0.3)",
  cave: "rgba(169, 169, 169, 0.3)",
  autre: "rgba(169, 169, 169, 0.3)",
};

/**
 * Distribue les pièces en grille sur le plan quand elles n'ont pas de coordonnées.
 * Les dimensions sont proportionnelles aux surfaces extraites (si disponibles).
 * Retourne des PlanRoom avec positions et dimensions calculées.
 */
function distributeRoomsOnPlan(
  rooms: ExtractedRoom[],
  planWidth: number,
  planHeight: number
): PlanRoom[] {
  const count = rooms.length;
  if (count === 0) return [];

  // Grille : colonnes = ceil(sqrt(n)), lignes = ceil(n/cols)
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  // Marge entre les zones (10% du plan)
  const marginX = planWidth * 0.05;
  const marginY = planHeight * 0.05;
  const usableW = planWidth - marginX * 2;
  const usableH = planHeight - marginY * 2;

  const cellW = usableW / cols;
  const cellH = usableH / rows;

  // Compute proportional sizing based on surface_m2 (if available)
  const surfaces = rooms.map((r) => r.surface_m2 ?? 10); // default 10m2 if unknown
  const maxSurface = Math.max(...surfaces, 1);

  return rooms.map((room, i) => {
    // Si la pièce a un bounding_box IA, utiliser les coordonnées réelles
    if (room.bounding_box) {
      const bb = room.bounding_box;
      return {
        id: room.id,
        name: room.name || "Sans nom",
        roomType: room.room_type || "autre",
        x: Math.round(planWidth * bb.x_percent / 100),
        y: Math.round(planHeight * bb.y_percent / 100),
        width: Math.max(40, Math.round(planWidth * bb.width_percent / 100)),
        height: Math.max(30, Math.round(planHeight * bb.height_percent / 100)),
        color: PLAN_ROOM_COLORS[room.room_type] || PLAN_ROOM_COLORS.autre,
        isNew: false,
      };
    }

    // Sinon fallback sur la grille
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Scale between 40% and 90% of cell based on surface ratio
    const surfaceRatio = (room.surface_m2 ?? 10) / maxSurface;
    const fillRatio = 0.40 + surfaceRatio * 0.50; // 40% min, 90% max
    const roomW = Math.round(cellW * fillRatio);
    const roomH = Math.round(cellH * fillRatio);

    return {
      id: room.id,
      name: room.name || "Sans nom",
      roomType: room.room_type || "autre",
      x: Math.round(marginX + col * cellW + (cellW - roomW) / 2),
      y: Math.round(marginY + row * cellH + (cellH - roomH) / 2),
      width: roomW,
      height: roomH,
      color: PLAN_ROOM_COLORS[room.room_type] || PLAN_ROOM_COLORS.autre,
      isNew: false,
    };
  });
}

/**
 * Synchronise les modifications du PlanEditor vers les ExtractedRoom.
 * Retourne les ExtractedRoom mises à jour (noms, types, ajouts, suppressions).
 */
function syncPlanToExtracted(
  planRooms: PlanRoom[],
  scaleFactor: number
): ExtractedRoom[] {
  return planRooms.map((pr) => ({
    id: pr.id,
    name: pr.name,
    room_type: pr.roomType,
    surface_m2: parseFloat(((pr.width / scaleFactor) * (pr.height / scaleFactor)).toFixed(1)),
    floor_index: 0,
    is_new: pr.isNew ?? false,
  }));
}

// ─── Component ──────────────────────────────────────────────────────

export default function ExtractionPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [state, setState] = useState<ExtractionState>("idle");
  const [rooms, setRooms] = useState<ExtractedRoom[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [projectAdresse, setProjectAdresse] = useState<string | null>(null);
  const [planPath, setPlanPath] = useState<string | null>(null);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const nextTempIdRef = useRef(1);
  const roomListRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  // Parse planPath into array — handles single path or JSON array string
  // For PDFs: use the -preview.png version for display in <img> tags
  const parsedPlanPaths = useMemo(() => {
    if (!planPath) return [];
    let paths: string[];
    try {
      if (planPath.startsWith("[")) {
        const parsed = JSON.parse(planPath);
        paths = Array.isArray(parsed) ? (parsed as string[]) : [planPath];
      } else {
        paths = [planPath];
      }
    } catch {
      paths = [planPath];
    }
    // PDF files can't be displayed in <img> tags — use the preview PNG instead
    return paths.map((p) =>
      p.toLowerCase().endsWith(".pdf") ? p.replace(/\.pdf$/i, "-preview.png") : p
    );
  }, [planPath]);

  // ─── Plan Editor state ────────────────────────────────────────────
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [planRooms, setPlanRooms] = useState<PlanRoom[]>([]);
  const [planNaturalWidth, setPlanNaturalWidth] = useState(0);
  const planInitializedRef = useRef(false);
  // P0 — scaleFactor lifted to parent so syncPlanToExtracted uses calibrated value (Thomas)
  const [scaleFactor, setScaleFactor] = useState(50);
  // P1 UX — état dirty : Thomas a modifié le plan, signal visuel de prise en compte
  const [isPlanDirty, setIsPlanDirty] = useState(false);

  // Quand les rooms extraites changent ET que le plan est visible, initialiser les PlanRooms
  const initializePlanRooms = useCallback(
    (extractedRooms: ExtractedRoom[], imgWidth: number, imgHeight: number) => {
      if (imgWidth === 0 || imgHeight === 0) return;
      const distributed = distributeRoomsOnPlan(extractedRooms, imgWidth, imgHeight);
      setPlanRooms(distributed);
      planInitializedRef.current = true;
    },
    []
  );

  // Quand le PlanEditor modifie les rooms, synchroniser vers ExtractedRoom
  const handlePlanRoomsChange = useCallback(
    (newPlanRooms: PlanRoom[]) => {
      setPlanRooms(newPlanRooms);
      // P0 — Use the calibrated scaleFactor instead of hardcoded 50 (Thomas)
      const synced = syncPlanToExtracted(newPlanRooms, scaleFactor);
      setRooms(synced);
      // P1 UX — signaler que le plan a été modifié
      setIsPlanDirty(true);
    },
    [scaleFactor]
  );

  // Charger les dimensions naturelles du plan quand on ouvre l'editeur
  const handleOpenPlanEditor = useCallback(() => {
    if (!parsedPlanPaths.length) return;
    setShowPlanEditor(true);

    // Si pas encore initialise, charger l'image pour obtenir les dimensions naturelles
    if (!planInitializedRef.current) {
      const imgUrl = `/api/logs/image?path=${encodeURIComponent(parsedPlanPaths[activePlanIndex] ?? parsedPlanPaths[0])}`;
      const img = new Image();
      img.onload = () => {
        setPlanNaturalWidth(img.naturalWidth);
        initializePlanRooms(rooms, img.naturalWidth, img.naturalHeight);
      };
      img.src = imgUrl;
    }
  }, [parsedPlanPaths, activePlanIndex, rooms, initializePlanRooms]);

  // ─── Timer for loading state ──────────────────────────────────────

  useEffect(() => {
    if (state !== "loading") return;

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  // ─── Auto-open PlanEditor quand extraction réussie ────────────────
  useEffect(() => {
    if (state === "success" && parsedPlanPaths.length > 0 && !showPlanEditor) {
      handleOpenPlanEditor();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, parsedPlanPaths.length]);

  // ─── Scroll-into-view quand clic sur une pièce du plan ──────────
  const handlePlanRoomClick = useCallback((roomId: string) => {
    const el = roomListRefsMap.current.get(roomId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Flash visuel temporaire
      setHoveredRoomId(roomId);
      setTimeout(() => setHoveredRoomId((prev) => (prev === roomId ? null : prev)), 1500);
    }
  }, []);

  // ─── Trigger extraction on mount ──────────────────────────────────

  const runExtraction = useCallback(async () => {
    setState("loading");
    setElapsedSeconds(0);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/pro/projects/${projectId}/extract`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setState("error");
        if (data.reason === "NO_ROOMS_DETECTED") {
          setErrorMessage(
            "Plan illisible — aucune pièce détectée. Passez à l'étape suivante pour saisir les pièces manuellement."
          );
        } else if (response.status === 429) {
          setErrorMessage(data.message || "Trop de tentatives. Réessayez plus tard.");
        } else if (response.status === 409) {
          // Already extracted — redirect to validation
          router.push(`/projet/${projectId}/validation`);
          return;
        } else {
          setErrorMessage(data.message || "Erreur lors de l'analyse du plan.");
        }
        return;
      }

      // Success — ensure floor_index is present (default 0 for backward compat)
      const extractedRooms: ExtractedRoom[] = (data.rooms || []).map(
        (r: Record<string, unknown>) => ({
          id: String(r.id ?? ""),
          name: String(r.name ?? ""),
          room_type: String(r.room_type ?? "autre"),
          surface_m2: r.surface_m2 != null ? Number(r.surface_m2) : null,
          length_m: r.length_m != null ? Number(r.length_m) : null,
          width_m: r.width_m != null ? Number(r.width_m) : null,
          floor_index: typeof r.floor_index === "number" ? r.floor_index : 0,
          confidence: typeof r.confidence === "number" ? r.confidence : undefined,
          bounding_box: r.bounding_box && typeof r.bounding_box === "object"
            ? r.bounding_box as BoundingBox
            : undefined,
        })
      );
      setRooms(extractedRooms);
      setState("success");
    } catch {
      setState("error");
      setErrorMessage("Erreur de connexion. Vérifiez votre réseau et réessayez.");
    }
  }, [projectId, router]);

  useEffect(() => {
    // Check project status first to avoid flash on back navigation
    async function checkAndRun() {
      try {
        const res = await fetch(`/api/pro/projects/${projectId}/status`);
        if (res.ok) {
          const data = await res.json();
          const status = data.project_status;
          if (data.project_adresse) setProjectAdresse(data.project_adresse);
          if (data.project_plan_path) setPlanPath(data.project_plan_path);
          // If already past extraction, redirect immediately without loading flash
          if (status && status !== "plan_uploaded" && status !== "extraction_failed") {
            router.replace(`/projet/${projectId}/validation`);
            return;
          }
        }
      } catch {
        // Status check failed — proceed with extraction anyway
      }
      runExtraction();
    }
    checkAndRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Room editing (local state only) ──────────────────────────────

  /** Group rooms by floor_index */
  const roomsByFloor = useMemo(() => {
    const map = new Map<number, ExtractedRoom[]>();
    for (const room of rooms) {
      const floor = room.floor_index ?? 0;
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor)!.push(room);
    }
    // Sort by floor index
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [rooms]);

  const hasMultipleFloors = roomsByFloor.length > 1;

  /** Update a single room field */
  const updateRoom = useCallback(
    (roomId: string, updates: Partial<ExtractedRoom>) => {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, ...updates } : r))
      );
    },
    []
  );

  /** Delete a room */
  const deleteRoom = useCallback((roomId: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  }, []);

  /** Add a new empty room to a given floor */
  const addRoom = useCallback((floorIndex: number) => {
    const tempId = `temp_${nextTempIdRef.current++}`;
    const newRoom: ExtractedRoom = {
      id: tempId,
      name: "",
      room_type: "autre",
      surface_m2: null,
      floor_index: floorIndex,
    };
    setRooms((prev) => [...prev, newRoom]);
    // Auto-focus the name field
    setTimeout(() => setEditingNameId(tempId), 50);
  }, []);

  // ─── Navigation ──────────────────────────────────────────────────

  const handleContinue = useCallback(() => {
    router.push(`/projet/${projectId}/validation`);
  }, [router, projectId]);

  const handleSkipToManual = useCallback(() => {
    router.push(`/projet/${projectId}/validation`);
  }, [router, projectId]);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Header variant="internal" />

      <main className="flex-1 w-full px-4 pt-20 pb-8">
        {/* Stepper — centré max-w-2xl */}
        <div className="max-w-2xl mx-auto mb-8">
          <ProStepper
            currentStep={2}
            completedSteps={[1]}
            errorSteps={state === "error" ? [2] : []}
            projectId={projectId}
          />
        </div>

        {/* Page title — centré max-w-2xl */}
        <div className="max-w-2xl mx-auto mb-6">
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
            Extraction du plan
          </h1>
          {projectAdresse && (
            <p className="text-sm text-[#9B9A94] mt-0.5">{projectAdresse}</p>
          )}
          <p className="text-sm text-[#9B9A94] mt-1">
            L&apos;IA analyse votre plan pour détecter les pièces et leurs dimensions.
          </p>
        </div>

        {/* Loading state */}
        {state === "loading" && (
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-16 gap-4">
            {/* Scan animation with plan thumbnail(s) */}
            <div className="relative w-48 h-48 rounded-lg bg-[#F5F5F0] overflow-hidden">
              {parsedPlanPaths.length > 0 ? (
                <img
                  src={`/api/logs/image?path=${encodeURIComponent(parsedPlanPaths[activePlanIndex] ?? parsedPlanPaths[0])}`}
                  alt={`Plan ${activePlanIndex + 1}/${parsedPlanPaths.length} en cours d'analyse`}
                  className="w-full h-full object-contain opacity-60"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#D1D0CB"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18M3 9h18M3 15h18M15 3v18" />
                  </svg>
                </div>
              )}
              {/* Scan line */}
              <div
                className="absolute left-0 right-0 h-0.5 bg-[#7D9B76] animate-[scanLine_2s_ease-in-out_infinite]"
                aria-hidden="true"
              />
            </div>

            {/* Multi-plan thumbnails */}
            {parsedPlanPaths.length > 1 && (
              <div className="flex items-center gap-2 mt-2">
                {parsedPlanPaths.map((path, i) => (
                  <button
                    key={path}
                    type="button"
                    onClick={() => setActivePlanIndex(i)}
                    className={`w-10 h-10 rounded border overflow-hidden transition-all
                      ${i === activePlanIndex
                        ? "border-[#7D9B76] ring-2 ring-[#7D9B76]/30"
                        : "border-[#D1D0CB] opacity-60 hover:opacity-100"
                      }`}
                    aria-label={`Voir plan ${i + 1}`}
                  >
                    <img
                      src={`/api/logs/image?path=${encodeURIComponent(path)}`}
                      alt={`Plan ${i + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
                <span className="text-xs text-[#9B9A94] ml-1">
                  Plan {activePlanIndex + 1}/{parsedPlanPaths.length}
                </span>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm font-medium text-[#1C1C1E]">
                Analyse du plan en cours…
              </p>
              <p className="text-xs text-[#9B9A94] mt-1">
                {elapsedSeconds < 10
                  ? "Détection des pièces et dimensions (~30 secondes)"
                  : elapsedSeconds < 30
                    ? `${elapsedSeconds}s — Extraction en cours…`
                    : `${elapsedSeconds}s — Presque terminé…`}
              </p>
            </div>

            {/* Pulsing dots */}
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-[#7D9B76] animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-[#7D9B76] animate-pulse [animation-delay:200ms]" />
              <span className="w-2 h-2 rounded-full bg-[#7D9B76] animate-pulse [animation-delay:400ms]" />
            </div>
          </div>
        )}

        {/* Error state */}
        {state === "error" && (
          <div className="max-w-2xl mx-auto py-8">
            <div
              className="p-4 rounded-lg bg-[#FEF2F2] border border-[#EF4444]/20 mb-6"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B91C1C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#B91C1C]">
                    Extraction impossible
                  </p>
                  <p className="text-sm text-[#B91C1C]/80 mt-1">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={runExtraction}
                className="flex-1 py-2.5 px-4 rounded-lg border border-[#D1D0CB] bg-white
                           text-sm font-medium text-[#1C1C1E] hover:bg-[#F5F5F0]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
              >
                Réessayer l&apos;extraction
              </button>
              <button
                onClick={handleSkipToManual}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#7D9B76] text-white
                           text-sm font-medium hover:bg-[#4A7A42]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76] focus-visible:ring-offset-2"
              >
                Saisir les pièces manuellement
              </button>
            </div>
          </div>
        )}

        {/* Success state */}
        {state === "success" && (
          <div className="space-y-6">
            {/* Summary — centré */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#ECFDF5] text-sm text-[#4A7A42]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {rooms.length} pièce{rooms.length > 1 ? "s" : ""} détectée{rooms.length > 1 ? "s" : ""}
              </div>
            </div>

            {/* Plan Editor — pleine largeur, composant principal */}
            {parsedPlanPaths.length > 0 && showPlanEditor && planNaturalWidth > 0 && (
              <div className="w-full max-w-5xl mx-auto space-y-3">
                {/* Affordances pills — actions disponibles en un coup d'oeil */}
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#6B6A65] bg-[#F5F5F0] rounded-full px-3 py-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                    Déplacer les pièces
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#6B6A65] bg-[#F5F5F0] rounded-full px-3 py-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    Redimensionner (coins)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#6B6A65] bg-[#F5F5F0] rounded-full px-3 py-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Double-clic = renommer
                  </span>
                </div>

                {/* Switcher d'étage — visible uniquement si plusieurs plans */}
                {parsedPlanPaths.length > 1 && (
                  <div className="flex items-center gap-2 px-1" role="tablist" aria-label="Navigation par étage">
                    {parsedPlanPaths.map((path, i) => (
                      <button
                        key={path}
                        type="button"
                        role="tab"
                        aria-selected={i === activePlanIndex}
                        onClick={() => {
                          setActivePlanIndex(i);
                          planInitializedRef.current = false;
                          const imgUrl = `/api/logs/image?path=${encodeURIComponent(path)}`;
                          const img = new Image();
                          img.onload = () => {
                            setPlanNaturalWidth(img.naturalWidth);
                            initializePlanRooms(rooms, img.naturalWidth, img.naturalHeight);
                          };
                          img.src = imgUrl;
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                          ${i === activePlanIndex
                            ? "bg-[#7D9B76] text-white"
                            : "bg-[#F5F5F0] text-[#9B9A94] hover:bg-[#ECFDF5] hover:text-[#4A7A42]"
                          }
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76]`}
                      >
                        <span>{i === 0 ? "RDC" : `Étage ${i}`}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div id="plan-editor-section" className="animate-in fade-in duration-300">
                  <PlanEditor
                    planImageUrl={`/api/logs/image?path=${encodeURIComponent(parsedPlanPaths[activePlanIndex] ?? parsedPlanPaths[0])}`}
                    rooms={planRooms}
                    onRoomsChange={handlePlanRoomsChange}
                    scaleFactor={scaleFactor}
                    onScaleFactorChange={(sf) => setScaleFactor(sf)}
                    highlightedRoomId={hoveredRoomId}
                    onRoomClick={handlePlanRoomClick}
                  />
                </div>
              </div>
            )}

            {/* Rooms grouped by floor — centré, en dessous du plan */}
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center gap-2 border-b border-[#D1D0CB]/40 pb-2">
                <h2 className="text-sm font-semibold text-[#1C1C1E]">
                  Détails des pièces
                </h2>
                {isPlanDirty && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7D9B76] bg-[#ECFDF5] rounded-full px-2 py-0.5">
                    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
                    Modifié
                  </span>
                )}
              </div>
              {roomsByFloor.map(([floorIndex, floorRooms]) => {
                const planPreview = parsedPlanPaths[floorIndex] ?? parsedPlanPaths[0] ?? null;

                return (
                  <section key={floorIndex} aria-label={floorLabel(floorIndex)}>
                    {/* Floor header with plan preview */}
                    {hasMultipleFloors && (
                      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-[#D1D0CB]/40">
                        {planPreview && (
                          <div className="flex-shrink-0 w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] rounded border border-[#D1D0CB]/40 overflow-hidden bg-[#F5F5F0]">
                            <img
                              src={`/api/logs/image?path=${encodeURIComponent(planPreview)}`}
                              alt={`Plan ${floorLabel(floorIndex)}`}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div>
                          <h2 className="text-sm font-semibold text-[#1C1C1E]">
                            {floorLabel(floorIndex)}
                          </h2>
                          <p className="text-xs text-[#9B9A94]">
                            {floorRooms.length} pièce{floorRooms.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Room list for this floor */}
                    <div className="space-y-2">
                      {floorRooms.map((room) => (
                        <div
                          key={room.id}
                          ref={(el) => {
                            if (el) roomListRefsMap.current.set(room.id, el);
                            else roomListRefsMap.current.delete(room.id);
                          }}
                          onMouseEnter={() => setHoveredRoomId(room.id)}
                          onMouseLeave={() => setHoveredRoomId((prev) => (prev === room.id ? null : prev))}
                          className={`flex items-center gap-2 p-3 rounded-lg bg-white border
                                     shadow-[0_1px_3px_rgba(28,28,30,0.06)] transition-all duration-150
                                     ${hoveredRoomId === room.id
                                       ? "border-[#7D9B76] ring-2 ring-[#7D9B76]/20 bg-[#FAFFF8]"
                                       : "border-[#D1D0CB]/40"}`}
                        >
                          {/* Room type icon */}
                          <div className="flex-shrink-0 w-9 h-9 rounded bg-[#F5F5F0] flex items-center justify-center">
                            <span className="text-base leading-none" aria-hidden="true">
                              {room.room_type === "salon" && "🛋️"}
                              {room.room_type === "sejour" && "🛋️"}
                              {room.room_type === "salle_a_manger" && "🍽️"}
                              {room.room_type === "cuisine" && "🍳"}
                              {room.room_type === "chambre" && "🛏️"}
                              {room.room_type === "chambre_parentale" && "🛏️"}
                              {room.room_type === "sdb" && "🚿"}
                              {room.room_type === "wc" && "🚽"}
                              {room.room_type === "bureau" && "💻"}
                              {room.room_type === "entree" && "🚪"}
                              {room.room_type === "dressing" && "👔"}
                              {room.room_type === "cellier" && "🧺"}
                              {room.room_type === "terrasse" && "🌿"}
                              {room.room_type === "garage" && "🚗"}
                              {room.room_type === "couloir" && "🚪"}
                              {room.room_type === "cave" && "📦"}
                              {(!room.room_type || room.room_type === "autre") && "📐"}
                            </span>
                          </div>

                          {/* Name (editable on click) */}
                          <div className="flex-1 min-w-0">
                            {editingNameId === room.id ? (
                              <input
                                type="text"
                                value={room.name}
                                onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                                onBlur={() => setEditingNameId(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === "Escape") {
                                    setEditingNameId(null);
                                  }
                                }}
                                autoFocus
                                className="w-full text-sm font-medium text-[#1C1C1E] bg-transparent
                                           border-b-2 border-[#7D9B76] outline-none py-0.5
                                           focus-visible:ring-0 focus-visible:border-b-2"
                                aria-label="Nom de la pièce"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingNameId(room.id)}
                                className="text-left w-full text-sm font-medium text-[#1C1C1E] truncate
                                           hover:text-[#7D9B76] transition-colors cursor-text
                                           focus-visible:outline-none focus-visible:ring-2
                                           focus-visible:ring-[#7D9B76] rounded py-0.5"
                                title="Cliquer pour renommer"
                              >
                                {room.name || "Sans nom"}
                              </button>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              {room.surface_m2 != null && (
                                <span className="text-xs text-[#9B9A94]">{room.surface_m2} m²</span>
                              )}
                              {room.length_m != null && room.width_m != null && (
                                <span className="text-xs text-[#9B9A94]">{room.length_m} × {room.width_m} m</span>
                              )}
                              {room.confidence != null && (
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight ${
                                    room.confidence >= 0.8
                                      ? "bg-[#ECFDF5] text-[#047857]"
                                      : room.confidence >= 0.5
                                        ? "bg-[#FFFBEB] text-[#B45309]"
                                        : "bg-[#FEF2F2] text-[#B91C1C]"
                                  }`}
                                  title={`Confiance IA : ${Math.round(room.confidence * 100)}%`}
                                >
                                  {room.confidence >= 0.8
                                    ? "Fiable"
                                    : room.confidence >= 0.5
                                      ? "À vérifier"
                                      : "Incertain"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Room type select */}
                          <select
                            value={room.room_type}
                            onChange={(e) => updateRoom(room.id, { room_type: e.target.value })}
                            className="flex-shrink-0 text-xs text-[#1C1C1E] bg-[#F5F5F0] border border-[#D1D0CB]/40
                                       rounded-md px-2 py-1.5 min-h-[44px] min-w-[44px]
                                       focus-visible:outline-none focus-visible:ring-2
                                       focus-visible:ring-[#7D9B76] cursor-pointer"
                            aria-label={`Type de la pièce ${room.name}`}
                          >
                            {ROOM_TYPE_OPTIONS.map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => deleteRoom(room.id)}
                            className="flex-shrink-0 w-11 h-11 flex items-center justify-center
                                       rounded-md text-[#9B9A94] hover:text-[#B91C1C] hover:bg-[#FEF2F2]
                                       transition-colors focus-visible:outline-none
                                       focus-visible:ring-2 focus-visible:ring-[#B91C1C]"
                            aria-label={`Supprimer ${room.name || "cette pièce"}`}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                              <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add room button */}
                    <button
                      type="button"
                      onClick={() => addRoom(floorIndex)}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5
                                 rounded-lg border border-dashed border-[#D1D0CB] text-sm
                                 text-[#9B9A94] hover:text-[#7D9B76] hover:border-[#7D9B76]
                                 transition-colors focus-visible:outline-none
                                 focus-visible:ring-2 focus-visible:ring-[#7D9B76]
                                 min-h-[44px]"
                      aria-label={`Ajouter une pièce ${hasMultipleFloors ? `au ${floorLabel(floorIndex).toLowerCase()}` : ""}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Ajouter une pièce
                    </button>
                  </section>
                );
              })}

              {rooms.length === 0 && (
                <div className="text-center py-10 px-4 rounded-lg border-2 border-dashed border-[#D1D0CB]">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#D1D0CB"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-3"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18M3 9h18M3 15h18M15 3v18" />
                  </svg>
                  <p className="text-sm font-medium text-[#1C1C1E] mb-1">
                    Aucune pièce détectée automatiquement
                  </p>
                  <p className="text-xs text-[#9B9A94] mb-4">
                    Le plan n&apos;a pas pu être lu. Ajoutez les pièces manuellement ou passez à l&apos;étape suivante.
                  </p>
                  <button
                    type="button"
                    onClick={() => addRoom(0)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7D9B76] text-white
                               text-sm font-medium hover:bg-[#4A7A42] transition-colors
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] focus-visible:ring-offset-2
                               min-h-[44px]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Ajouter une pièce
                  </button>
                </div>
              )}

              {/* Navigation — sticky sur mobile pour accès permanent */}
              <div className="sticky bottom-0 z-20 -mx-4 px-4 pb-4 pt-3 bg-[#FAFAF8] shadow-[0_-4px_12px_rgba(28,28,30,0.08)] sm:static sm:mx-0 sm:px-0 sm:pb-0 sm:pt-4 sm:bg-transparent sm:shadow-none sm:border-t sm:border-[#D1D0CB]/40">
                <div className="flex gap-3">
                  <button
                    onClick={() => router.back()}
                    className="py-2.5 px-4 rounded-lg border border-[#D1D0CB] bg-white
                               text-sm font-medium text-[#1C1C1E] hover:bg-[#F5F5F0]
                               transition-colors focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-[#7D9B76]
                               min-h-[44px]"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleContinue}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-[#7D9B76] text-white
                               text-sm font-medium hover:bg-[#4A7A42]
                               transition-colors focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-[#7D9B76] focus-visible:ring-offset-2
                               min-h-[44px]"
                  >
                    Valider et continuer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Scan line animation */}
      <style jsx>{`
        @keyframes scanLine {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
