"use client";

/**
 * Page découpe en biens/lots (Étape 3).
 *
 * Rendu : Client Component — assignation visuelle des pièces aux lots.
 *
 * Au mount : charge les pièces du projet et lance la détection IA.
 * Thomas clique sur une pièce du plan pour changer son lot.
 * Bouton "Confirmer et continuer" sauvegarde et redirige vers /validation.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProStepper from "@/components/marchand/ProStepper";
import PlanEditor, { type PlanRoom } from "@/components/marchand/PlanEditor";
import { getCompletedSteps } from "@/lib/constants";

// ─── Constants ─────────────────────────────────────────────────────

const LOT_COLORS = [
  "#7D9B76", "#6366F1", "#D97706", "#EF4444", "#06B6D4",
  "#DB2777", "#8B5CF6", "#10B981", "#EA580C", "#3B82F6",
  "#14B8A6", "#A855F7",
];

const UNASSIGNED_COLOR = "#D1D0CB";

const LOT_TYPE_OPTIONS = [
  { value: "appartement", label: "Appartement" },
  { value: "commerce", label: "Commerce" },
  { value: "bureau", label: "Bureau" },
  { value: "parking", label: "Parking" },
  { value: "autre", label: "Autre" },
];

// ─── Types ─────────────────────────────────────────────────────────

interface RoomData {
  id: string;
  name: string;
  room_type: string;
  surface_m2: number | null;
  floor: number;
  lot_id: string | null;
  bounding_box?: {
    x_percent: number;
    y_percent: number;
    width_percent: number;
    height_percent: number;
  } | null;
}

interface LotData {
  id: string;
  name: string;
  lot_type: string;
  color: string;
  room_ids: string[];
}

interface DetectedLot {
  lot_name: string;
  lot_type: string;
  room_ids: string[];
}

type PageState = "loading" | "detecting" | "ready" | "saving" | "error";

// ─── Helpers ───────────────────────────────────────────────────────

function floorLabel(floorIndex: number): string {
  if (floorIndex === 0) return "Rez-de-chaussée";
  if (floorIndex === 1) return "Étage 1";
  return `Étage ${floorIndex}`;
}

// ─── Component ─────────────────────────────────────────────────────

export default function DecoupePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // ─── State ─────────────────────────────────────────────────────
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState("extraction_done");
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [lots, setLots] = useState<LotData[]>([]);
  const [planImageUrl, setPlanImageUrl] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState(0);
  const [renamingLotId, setRenamingLotId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingLotId, setDeletingLotId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [highlightedLotId, setHighlightedLotId] = useState<string | null>(null);
  const [detectionFallback, setDetectionFallback] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ─── Derived ───────────────────────────────────────────────────
  const floors = useMemo(() => {
    const set = new Set(rooms.map((r) => r.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms]);

  const roomsOnFloor = useMemo(
    () => rooms.filter((r) => r.floor === activeFloor),
    [rooms, activeFloor]
  );

  const unassignedRooms = useMemo(
    () => rooms.filter((r) => !r.lot_id),
    [rooms]
  );

  const isSingleLot = lots.length === 1 && unassignedRooms.length === 0;

  // ─── Room → lot color mapping ──────────────────────────────────
  const roomLotColor = useCallback(
    (roomId: string): string => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room?.lot_id) return UNASSIGNED_COLOR;
      const lot = lots.find((l) => l.id === room.lot_id);
      return lot?.color || UNASSIGNED_COLOR;
    },
    [rooms, lots]
  );

  // ─── Plan rooms for PlanEditor ─────────────────────────────────
  const planRooms: PlanRoom[] = useMemo(() => {
    return roomsOnFloor
      .filter((r) => r.bounding_box)
      .map((r) => ({
        id: r.id,
        name: r.name,
        roomType: r.room_type,
        x: r.bounding_box!.x_percent,
        y: r.bounding_box!.y_percent,
        width: r.bounding_box!.width_percent,
        height: r.bounding_box!.height_percent,
        color: roomLotColor(r.id),
      }));
  }, [roomsOnFloor, roomLotColor]);

  // ─── Load project data ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Load project status
        const statusRes = await fetch(`/api/pro/projects/${projectId}/status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (!cancelled) setProjectStatus(statusData.project_status || "extraction_done");
          if (!cancelled && statusData.project_plan_path) {
            // Convert storage path to displayable image URL
            const planPath = statusData.project_plan_path;
            // Handle JSON array of paths (multi-page PDF) — use first page
            let firstPath = planPath;
            try {
              if (planPath.startsWith("[")) {
                const parsed = JSON.parse(planPath);
                firstPath = Array.isArray(parsed) ? parsed[0] : planPath;
              }
            } catch { /* use raw path */ }
            // For PDFs, use the preview PNG
            if (firstPath.endsWith(".pdf")) firstPath = firstPath + "-preview.png";
            setPlanImageUrl(`/api/logs/image?path=${encodeURIComponent(firstPath)}`);
          }
        }

        // Load rooms
        const roomsRes = await fetch(`/api/pro/projects/${projectId}/rooms`);
        if (!roomsRes.ok) throw new Error("Impossible de charger les pièces.");
        const roomsData = await roomsRes.json();
        if (!cancelled) setRooms(roomsData.rooms || []);

        // Check if lots already exist
        const lotsRes = await fetch(`/api/pro/projects/${projectId}/lots`);
        if (lotsRes.ok) {
          const lotsData = await lotsRes.json();
          const existingLots = lotsData.lots || [];
          if (existingLots.length > 0) {
            // Lots already defined — rebuild state
            const rebuiltLots: LotData[] = existingLots.map((l: { id: string; name: string; lot_type?: string; color?: string; rooms?: { id: string }[] }, i: number) => ({
              id: l.id,
              name: l.name,
              lot_type: l.lot_type || "appartement",
              color: l.color || LOT_COLORS[i % LOT_COLORS.length],
              room_ids: (l.rooms || []).map((r: { id: string }) => r.id),
            }));
            if (!cancelled) {
              setLots(rebuiltLots);
              // Set lot_id on rooms
              setRooms((prev) =>
                prev.map((room) => {
                  const lot = rebuiltLots.find((l: LotData) => l.room_ids.includes(room.id));
                  return { ...room, lot_id: lot?.id || null };
                })
              );
              setPageState("ready");
              return;
            }
          }
        }

        // No lots yet — trigger detection
        if (!cancelled) {
          setPageState("detecting");
          detectLots(roomsData.rooms || []);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage((err as Error).message);
          setPageState("error");
        }
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ─── Detect lots via IA ────────────────────────────────────────
  const detectLots = useCallback(
    async (currentRooms: RoomData[]) => {
      try {
        const res = await fetch(`/api/pro/projects/${projectId}/lots/detect`, {
          method: "POST",
        });

        let detected: DetectedLot[] = [];
        if (res.ok) {
          const data = await res.json();
          detected = data.lots || [];
        }

        // Fallback: 1 lot = all rooms
        if (detected.length === 0) {
          detected = [
            {
              lot_name: "Lot 1",
              lot_type: "appartement",
              room_ids: currentRooms.map((r) => r.id),
            },
          ];
          setDetectionFallback(true);
        }

        // Build lots with colors
        const newLots: LotData[] = detected.map((d, i) => ({
          id: `temp_${i}`,
          name: d.lot_name,
          lot_type: d.lot_type || "appartement",
          color: LOT_COLORS[i % LOT_COLORS.length],
          room_ids: d.room_ids,
        }));

        setLots(newLots);

        // Assign lot_id to rooms
        setRooms((prev) =>
          prev.map((room) => {
            const lot = newLots.find((l) => l.room_ids.includes(room.id));
            return { ...room, lot_id: lot?.id || null };
          })
        );

        setPageState("ready");
      } catch {
        // Fallback on error: 1 lot = all rooms
        setDetectionFallback(true);
        const fallbackLot: LotData = {
          id: "temp_0",
          name: "Lot 1",
          lot_type: "appartement",
          color: LOT_COLORS[0],
          room_ids: currentRooms.map((r) => r.id),
        };
        setLots([fallbackLot]);
        setRooms((prev) =>
          prev.map((room) => ({ ...room, lot_id: fallbackLot.id }))
        );
        setPageState("ready");
      }
    },
    [projectId]
  );

  // ─── Assign room to lot ────────────────────────────────────────
  const assignRoomToLot = useCallback(
    (roomId: string, lotId: string | null) => {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, lot_id: lotId } : r))
      );
      // Update lot room_ids
      setLots((prev) =>
        prev.map((lot) => ({
          ...lot,
          room_ids: lotId === lot.id
            ? Array.from(new Set([...lot.room_ids, roomId]))
            : lot.room_ids.filter((id) => id !== roomId),
        }))
      );
      setSelectedRoomId(null);
    },
    []
  );

  // ─── Add lot ───────────────────────────────────────────────────
  const addLot = useCallback(() => {
    const newIndex = lots.length;
    const newLot: LotData = {
      id: `temp_${Date.now()}`,
      name: `Lot ${newIndex + 1}`,
      lot_type: "appartement",
      color: LOT_COLORS[newIndex % LOT_COLORS.length],
      room_ids: [],
    };
    setLots((prev) => [...prev, newLot]);
  }, [lots.length]);

  // ─── Delete lot (with confirmation) ─────────────────────────────
  const confirmDeleteLot = useCallback(
    (lotId: string) => {
      // Unassign rooms from this lot
      setRooms((prev) =>
        prev.map((r) => (r.lot_id === lotId ? { ...r, lot_id: null } : r))
      );
      setLots((prev) => prev.filter((l) => l.id !== lotId));
      setDeletingLotId(null);
    },
    []
  );

  // ─── Click-outside dismiss for dropdown ────────────────────────
  useEffect(() => {
    if (!selectedRoomId) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSelectedRoomId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedRoomId]);

  // ─── Rename lot ────────────────────────────────────────────────
  const startRename = useCallback((lotId: string, currentName: string) => {
    setRenamingLotId(lotId);
    setRenameValue(currentName);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  }, []);

  const finishRename = useCallback(() => {
    if (renamingLotId && renameValue.trim()) {
      setLots((prev) =>
        prev.map((l) =>
          l.id === renamingLotId ? { ...l, name: renameValue.trim() } : l
        )
      );
    }
    setRenamingLotId(null);
  }, [renamingLotId, renameValue]);

  // ─── Change lot type ───────────────────────────────────────────
  const changeLotType = useCallback((lotId: string, newType: string) => {
    setLots((prev) =>
      prev.map((l) => (l.id === lotId ? { ...l, lot_type: newType } : l))
    );
  }, []);

  // ─── Save and continue ─────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setPageState("saving");
    try {
      const payload = {
        lots: lots.map((l) => ({
          name: l.name,
          lot_type: l.lot_type,
          color: l.color,
          room_ids: l.room_ids,
        })),
      };

      const res = await fetch(`/api/pro/projects/${projectId}/lots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Erreur lors de la sauvegarde.");
      }

      // Show success toast before redirect
      setSaveToast(true);
      await new Promise((r) => setTimeout(r, 800));
      router.push(`/projet/${projectId}/validation`);
    } catch (err) {
      setErrorMessage((err as Error).message);
      setPageState("ready");
    }
  }, [lots, projectId, router]);

  // ─── Handle room click on plan ─────────────────────────────────
  const handlePlanRoomClick = useCallback((roomId: string) => {
    setSelectedRoomId((prev) => (prev === roomId ? null : roomId));
  }, []);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
      <Header />

      <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
        {/* Stepper */}
        <div className="mb-8">
          <ProStepper
            currentStep={3}
            completedSteps={getCompletedSteps(projectStatus)}
            projectId={projectId}
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#1C1C1E] mb-2">
          Découpe en biens
        </h1>
        <p className="text-sm text-[#9B9A94] mb-6">
          Assignez chaque pièce à un lot. Cliquez sur une pièce du plan pour changer son lot.
        </p>

        {/* Loading / Detecting */}
        {(pageState === "loading" || pageState === "detecting") && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-[#7D9B76] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#1C1C1E]/60">
              {pageState === "loading"
                ? "Chargement des pièces..."
                : "Détection automatique des lots..."}
            </p>
            {pageState === "detecting" && (
              <p className="text-xs text-[#1C1C1E]/40">5 à 15 secondes environ</p>
            )}
          </div>
        )}

        {/* Error */}
        {pageState === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{errorMessage}</p>
            <button
              onClick={() => {
                setPageState("loading");
                setErrorMessage(null);
                window.location.reload();
              }}
              className="mt-2 text-sm text-red-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] rounded"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Main content */}
        {(pageState === "ready" || pageState === "saving") && (
          <>
            {/* Fallback detection banner */}
            {detectionFallback && (
              <div className="bg-[#1C1C1E]/[0.03] border border-[#1C1C1E]/10 rounded-lg p-4 mb-4">
                <p className="text-sm text-[#1C1C1E]/60">
                  Détection automatique indisponible — proposition par défaut appliquée. Ajustez manuellement si nécessaire.
                </p>
              </div>
            )}

            {/* Simple case message */}
            {isSingleLot && !detectionFallback && (
              <div className="bg-[#1C1C1E]/[0.03] border border-[#1C1C1E]/10 rounded-lg p-4 mb-6">
                <p className="text-sm text-[#1C1C1E]">
                  Toutes les pièces sont dans un seul bien. Vous pouvez ajouter des lots si nécessaire.
                </p>
              </div>
            )}

            {/* Floor tabs */}
            {floors.length > 1 && (
              <div className="flex gap-2 mb-4">
                {floors.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFloor(f)}
                    className={`px-3 py-2.5 text-sm rounded-md transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] ${
                      f === activeFloor
                        ? "bg-[#1C1C1E] text-white"
                        : "bg-[#1C1C1E]/5 text-[#1C1C1E]/60 hover:bg-[#1C1C1E]/10"
                    }`}
                  >
                    {floorLabel(f)}
                  </button>
                ))}
              </div>
            )}

            {/* Layout: Plan + Sidebar */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Plan (70%) */}
              <div className="flex-1 lg:w-[70%] relative">
                {planImageUrl ? (
                  <>
                    <PlanEditor
                      planImageUrl={planImageUrl}
                      rooms={planRooms}
                      onRoomsChange={() => {}}
                      onRoomClick={handlePlanRoomClick}
                      highlightedRoomId={selectedRoomId}
                    />
                    {planRooms.length === 0 && roomsOnFloor.length > 0 && (
                      <p className="text-xs text-[#1C1C1E]/40 mt-2 text-center">
                        Les pièces n&apos;ont pas pu être localisées sur le plan — assignez-les depuis la liste ci-contre.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="bg-[#1C1C1E]/5 rounded-lg p-8 text-center">
                    <p className="text-sm text-[#1C1C1E]/40">
                      Pas d&apos;image de plan disponible
                    </p>
                  </div>
                )}

                {/* Room assignment — Desktop dropdown */}
                {selectedRoomId && (
                  <div ref={dropdownRef} className="hidden lg:block absolute top-4 right-4 bg-white border border-[#1C1C1E]/10 rounded-lg shadow-lg p-3 z-20 min-w-[200px]">
                    <p className="text-xs text-[#1C1C1E]/60 mb-2">
                      Assigner à un lot :
                    </p>
                    {lots.map((lot) => (
                      <button
                        key={lot.id}
                        onClick={() => assignRoomToLot(selectedRoomId, lot.id)}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-[#1C1C1E]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: lot.color }}
                        />
                        {lot.name}
                      </button>
                    ))}
                    <hr className="my-1.5 border-[#1C1C1E]/10" />
                    <button
                      onClick={() => assignRoomToLot(selectedRoomId, null)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-[#1C1C1E]/60 rounded hover:bg-[#1C1C1E]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-dashed border-[#1C1C1E]/30"
                        style={{ backgroundColor: UNASSIGNED_COLOR }}
                      />
                      Non assignée
                    </button>
                  </div>
                )}

                {/* Room assignment — Mobile bottom sheet */}
                {selectedRoomId && (
                  <>
                    <div
                      className="lg:hidden fixed inset-0 bg-black/20 z-40"
                      onClick={() => setSelectedRoomId(null)}
                    />
                    <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white border-t border-[#1C1C1E]/10 rounded-t-2xl p-4 shadow-2xl pb-[env(safe-area-inset-bottom)]">
                      <div className="w-10 h-1 bg-[#1C1C1E]/10 rounded-full mx-auto mb-3" />
                      <p className="text-xs font-medium text-[#1C1C1E]/60 mb-3">
                        Assigner «{rooms.find((r) => r.id === selectedRoomId)?.name}» à :
                      </p>
                      <div className="flex flex-col gap-1">
                        {lots.map((lot) => (
                          <button
                            key={lot.id}
                            onClick={() => assignRoomToLot(selectedRoomId, lot.id)}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-[#1C1C1E]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] min-h-[44px]"
                          >
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: lot.color }}
                            />
                            {lot.name}
                          </button>
                        ))}
                        <hr className="my-1 border-[#1C1C1E]/10" />
                        <button
                          onClick={() => assignRoomToLot(selectedRoomId, null)}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[#1C1C1E]/60 rounded-lg hover:bg-[#1C1C1E]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] min-h-[44px]"
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0 border border-dashed border-[#1C1C1E]/30"
                            style={{ backgroundColor: UNASSIGNED_COLOR }}
                          />
                          Non assignée
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sidebar lots (30%) */}
              <div className="lg:w-[30%] space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-[#1C1C1E]">
                    Lots ({lots.length})
                  </h2>
                  <button
                    onClick={addLot}
                    disabled={lots.length >= 12}
                    className="text-xs px-2.5 py-1 rounded-md bg-[#1C1C1E] text-white hover:bg-[#1C1C1E]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
                  >
                    + Ajouter un lot
                  </button>
                </div>

                {/* Lot cards */}
                {lots.map((lot) => {
                  const lotRooms = rooms.filter((r) => r.lot_id === lot.id);
                  const totalSurface = lotRooms.reduce(
                    (s, r) => s + (r.surface_m2 ?? 0),
                    0
                  );

                  return (
                    <div
                      key={lot.id}
                      className={`border rounded-lg p-3 bg-white transition-colors cursor-pointer ${
                        highlightedLotId === lot.id
                          ? "border-[#7D9B76] shadow-sm"
                          : "border-[#1C1C1E]/10 hover:border-[#1C1C1E]/20"
                      }`}
                      onMouseEnter={() => setHighlightedLotId(lot.id)}
                      onMouseLeave={() => setHighlightedLotId(null)}
                    >
                      {/* Header: color + name + actions */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: lot.color }}
                        />
                        {renamingLotId === lot.id ? (
                          <input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={finishRename}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") finishRename();
                              if (e.key === "Escape") setRenamingLotId(null);
                            }}
                            className="flex-1 text-sm font-medium border border-[#7D9B76] rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#7D9B76]"
                          />
                        ) : (
                          <button
                            onClick={() => startRename(lot.id, lot.name)}
                            className="flex-1 text-left text-sm font-medium text-[#1C1C1E] hover:text-[#7D9B76] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] rounded"
                            title="Cliquez pour renommer"
                          >
                            {lot.name}
                          </button>
                        )}
                        {lots.length > 1 && (
                          deletingLotId === lot.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => confirmDeleteLot(lot.id)}
                                className="text-xs px-2.5 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[44px]"
                              >
                                Supprimer
                              </button>
                              <button
                                onClick={() => setDeletingLotId(null)}
                                className="text-xs px-2.5 py-2 text-[#1C1C1E]/50 hover:text-[#1C1C1E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] rounded min-h-[44px]"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingLotId(lot.id)}
                              className="text-[#1C1C1E]/30 hover:text-red-500 transition-colors p-3 -m-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                              title="Supprimer ce lot"
                              aria-label={`Supprimer ${lot.name}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </button>
                          )
                        )}
                      </div>

                      {/* Lot type */}
                      <select
                        value={lot.lot_type}
                        onChange={(e) => changeLotType(lot.id, e.target.value)}
                        className="w-full text-xs border border-[#1C1C1E]/10 rounded px-2 py-1.5 mb-2 bg-[#FAFAF8] text-[#1C1C1E]/70 appearance-none focus:outline-none focus:ring-2 focus:ring-[#7D9B76]"
                      >
                        {LOT_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs text-[#1C1C1E]/50">
                        <span>{lotRooms.length} pièce{lotRooms.length > 1 ? "s" : ""}</span>
                        {totalSurface > 0 && (
                          <span>{totalSurface.toFixed(1)} m²</span>
                        )}
                        {/* Multi-floor indicator */}
                        {(() => {
                          const lotFloors = new Set(lotRooms.map((r) => r.floor));
                          if (lotFloors.size > 1) {
                            return (
                              <span className="text-[#1C1C1E]/50 font-medium">
                                Étages {Array.from(lotFloors).sort().join("+")}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Room list */}
                      {lotRooms.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {lotRooms.slice(0, 6).map((r) => (
                            <div
                              key={r.id}
                              className="text-xs text-[#1C1C1E]/60 truncate"
                            >
                              {r.name}
                              {r.surface_m2 ? ` — ${r.surface_m2} m²` : ""}
                            </div>
                          ))}
                          {lotRooms.length > 6 && (
                            <div className="text-xs text-[#1C1C1E]/40">
                              + {lotRooms.length - 6} pièce{lotRooms.length - 6 > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unassigned rooms warning */}
                {unassignedRooms.length > 0 && (
                  <div className="border border-dashed border-amber-300 rounded-lg p-3 bg-amber-50">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-amber-500 shrink-0">
                        <path d="M7 1L13 12H1L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
                        <path d="M7 5.5v2.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      <p className="text-xs font-medium text-amber-700">
                        {unassignedRooms.length} pièce{unassignedRooms.length > 1 ? "s" : ""} non assignée{unassignedRooms.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-xs text-amber-600/80 mb-2">
                      Cliquez sur une pièce du plan pour l&apos;assigner à un lot.
                    </p>
                    {unassignedRooms.map((r) => (
                      <div
                        key={r.id}
                        className="text-xs text-amber-700/60 truncate"
                      >
                        {r.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile lot pills */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mt-4 -mx-4 px-4">
              {lots.map((lot) => (
                <button
                  key={lot.id}
                  onClick={() => setHighlightedLotId((prev) => prev === lot.id ? null : lot.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs whitespace-nowrap border transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] ${
                    highlightedLotId === lot.id
                      ? "border-[#7D9B76] bg-[#7D9B76]/10"
                      : "border-[#1C1C1E]/10 bg-white"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: lot.color }}
                  />
                  {lot.name}
                  <span className="text-[#1C1C1E]/40">
                    ({rooms.filter((r) => r.lot_id === lot.id).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Recap summary */}
            {lots.length > 1 && (
              <div className="mt-6 bg-[#1C1C1E]/[0.02] border border-[#1C1C1E]/10 rounded-lg px-4 py-3">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#1C1C1E]/60">
                  {lots.map((lot) => {
                    const lr = rooms.filter((r) => r.lot_id === lot.id);
                    const s = lr.reduce((a, r) => a + (r.surface_m2 ?? 0), 0);
                    return (
                      <span key={lot.id} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lot.color }} />
                        {lot.name} : {lr.length} pièce{lr.length > 1 ? "s" : ""}
                        {s > 0 && <span className="text-[#1C1C1E]/40">({s.toFixed(0)} m²)</span>}
                      </span>
                    );
                  })}
                  <span className="font-medium text-[#1C1C1E]/80">
                    Total : {rooms.filter((r) => r.lot_id).length}/{rooms.length} pièces
                    {(() => {
                      const total = rooms.filter((r) => r.lot_id).reduce((a, r) => a + (r.surface_m2 ?? 0), 0);
                      return total > 0 ? ` · ${total.toFixed(0)} m²` : "";
                    })()}
                  </span>
                </div>
              </div>
            )}

            {/* CTA sticky */}
            <div className="sticky bottom-0 bg-[#FAFAF8]/95 backdrop-blur-sm border-t border-[#1C1C1E]/10 py-4 mt-8 -mx-4 px-4 flex items-center justify-between gap-3">
              <button
                onClick={() => router.push(`/projet/${projectId}/extraction`)}
                className="px-4 py-2.5 text-sm text-[#1C1C1E]/60 hover:text-[#1C1C1E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] rounded-lg min-h-[44px]"
              >
                Retour
              </button>
              <button
                onClick={handleSave}
                disabled={pageState === "saving" || lots.length === 0}
                className="px-6 py-2.5 text-sm font-medium bg-[#1C1C1E] text-white rounded-lg hover:bg-[#1C1C1E]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
              >
                {pageState === "saving" ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  "Confirmer et continuer"
                )}
              </button>
            </div>
          </>
        )}
      </main>

      <Footer />

      {/* Save success toast */}
      {saveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E] text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Découpe enregistrée
        </div>
      )}
    </div>
  );
}
