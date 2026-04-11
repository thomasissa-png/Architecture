"use client";

/**
 * PlanEditor — Éditeur de plan interactif pour le parcours marchand.
 *
 * Rendu : Client Component (drag, resize, édition inline).
 *
 * Affiche le plan en image de fond avec des zones rectangulaires
 * semi-transparentes pour chaque pièce. Thomas peut :
 * - Déplacer les zones (drag mouse + touch)
 * - Redimensionner via 4 poignées aux coins
 * - Créer de nouvelles pièces
 * - Supprimer des pièces
 * - Éditer le nom (double-clic) et le type (select)
 * - Voir les surfaces recalculées en temps réel
 *
 * Pas de librairie externe — SVG natif + div positioned + React state.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export interface PlanRoom {
  id: string;
  name: string;
  roomType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  /** true = pièce ajoutée par Thomas (projet), false = pièce existante (extraite du plan) */
  isNew?: boolean;
}

interface PlanEditorProps {
  planImageUrl: string;
  rooms: PlanRoom[];
  onRoomsChange: (rooms: PlanRoom[]) => void;
  scaleFactor?: number;
}

type HandlePosition = "nw" | "ne" | "sw" | "se";

interface DragState {
  type: "move" | "resize";
  roomId: string;
  handle?: HandlePosition;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origWidth: number;
  origHeight: number;
}

// ─── Constants ──────────────────────────────────────────────────────

const ROOM_COLORS: Record<string, string> = {
  salon: "rgba(125, 155, 118, 0.3)",
  sejour: "rgba(125, 155, 118, 0.3)",
  chambre: "rgba(100, 149, 237, 0.3)",
  chambre_parentale: "rgba(70, 130, 220, 0.3)",
  cuisine: "rgba(255, 165, 0, 0.3)",
  sdb: "rgba(0, 191, 255, 0.3)",
  wc: "rgba(0, 191, 255, 0.3)",
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

const ROOM_BORDER_COLORS: Record<string, string> = {
  salon: "rgba(125, 155, 118, 0.8)",
  sejour: "rgba(125, 155, 118, 0.8)",
  chambre: "rgba(100, 149, 237, 0.8)",
  chambre_parentale: "rgba(70, 130, 220, 0.8)",
  cuisine: "rgba(255, 165, 0, 0.8)",
  sdb: "rgba(0, 191, 255, 0.8)",
  wc: "rgba(0, 191, 255, 0.8)",
  bureau: "rgba(147, 112, 219, 0.8)",
  entree: "rgba(200, 180, 140, 0.8)",
  dressing: "rgba(180, 160, 200, 0.8)",
  cellier: "rgba(160, 180, 140, 0.8)",
  terrasse: "rgba(100, 200, 100, 0.8)",
  garage: "rgba(120, 120, 140, 0.8)",
  salle_a_manger: "rgba(230, 140, 80, 0.8)",
  couloir: "rgba(169, 169, 169, 0.8)",
  cave: "rgba(169, 169, 169, 0.8)",
  autre: "rgba(169, 169, 169, 0.8)",
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  salon: "Salon",
  sejour: "Séjour",
  salle_a_manger: "Salle à manger",
  cuisine: "Cuisine",
  chambre: "Chambre",
  chambre_parentale: "Chambre parentale",
  sdb: "Salle de bain",
  wc: "WC",
  bureau: "Bureau",
  entree: "Entrée",
  dressing: "Dressing",
  cellier: "Cellier / Buanderie",
  terrasse: "Terrasse / Balcon",
  garage: "Garage",
  couloir: "Couloir",
  cave: "Cave",
  autre: "Autre",
};

const ROOM_TYPE_OPTIONS = Object.entries(ROOM_TYPE_LABELS);

const HANDLE_SIZE = 20;
const MIN_ROOM_SIZE = 40;

// ─── Helpers ────────────────────────────────────────────────────────

function colorForType(roomType: string): string {
  return ROOM_COLORS[roomType] || ROOM_COLORS.autre;
}

function borderForType(roomType: string): string {
  return ROOM_BORDER_COLORS[roomType] || ROOM_BORDER_COLORS.autre;
}

/** Calcule la surface en m² à partir des dimensions en pixels et du scale factor */
function computeSurface(widthPx: number, heightPx: number, scaleFactor: number): string {
  const widthM = widthPx / scaleFactor;
  const heightM = heightPx / scaleFactor;
  return (widthM * heightM).toFixed(1);
}

/** Clamp une valeur entre min et max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Component ──────────────────────────────────────────────────────

export default function PlanEditor({
  planImageUrl,
  rooms,
  onRoomsChange,
  scaleFactor = 50,
}: PlanEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  // Multi-selection for fusion (Shift+click or long-press second room)
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  // Long-press timer for touch rename
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the natural image dimensions to compute the displayed scale
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // ─── Image load ─────────────────────────────────────────────────

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgSize({ width: img.clientWidth, height: img.clientHeight });
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  }, []);

  // Recalc on window resize
  useEffect(() => {
    function handleResize() {
      const img = containerRef.current?.querySelector("img");
      if (img) {
        setImgSize({ width: img.clientWidth, height: img.clientHeight });
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // The ratio between displayed size and natural size — rooms are positioned in natural coords
  const displayScale = useMemo(() => {
    if (!imgSize || !naturalSize) return 1;
    return imgSize.width / naturalSize.width;
  }, [imgSize, naturalSize]);

  // ─── Pointer helpers ──────────────────────────────────────────────

  /** Get cursor position relative to the image container */
  const getRelativePos = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      // Return position in natural image coordinates
      return {
        x: (clientX - rect.left) / displayScale,
        y: (clientY - rect.top) / displayScale,
      };
    },
    [displayScale]
  );

  // ─── Drag / Resize logic ─────────────────────────────────────────

  const handlePointerDown = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      roomId: string,
      type: "move" | "resize",
      handle?: HandlePosition
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const pos = getRelativePos(clientX, clientY);

      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;

      setSelectedRoomId(roomId);
      setDragState({
        type,
        roomId,
        handle,
        startX: pos.x,
        startY: pos.y,
        origX: room.x,
        origY: room.y,
        origWidth: room.width,
        origHeight: room.height,
      });
    },
    [rooms, getRelativePos]
  );

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragState || !naturalSize) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const pos = getRelativePos(clientX, clientY);

      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;

      const maxW = naturalSize.width;
      const maxH = naturalSize.height;

      let updated: Partial<PlanRoom>;

      if (dragState.type === "move") {
        updated = {
          x: clamp(dragState.origX + dx, 0, maxW - dragState.origWidth),
          y: clamp(dragState.origY + dy, 0, maxH - dragState.origHeight),
        };
      } else {
        // Resize from handle
        let newX = dragState.origX;
        let newY = dragState.origY;
        let newW = dragState.origWidth;
        let newH = dragState.origHeight;

        switch (dragState.handle) {
          case "se":
            newW = clamp(dragState.origWidth + dx, MIN_ROOM_SIZE, maxW - dragState.origX);
            newH = clamp(dragState.origHeight + dy, MIN_ROOM_SIZE, maxH - dragState.origY);
            break;
          case "sw":
            newW = clamp(dragState.origWidth - dx, MIN_ROOM_SIZE, dragState.origX + dragState.origWidth);
            newH = clamp(dragState.origHeight + dy, MIN_ROOM_SIZE, maxH - dragState.origY);
            newX = dragState.origX + dragState.origWidth - newW;
            break;
          case "ne":
            newW = clamp(dragState.origWidth + dx, MIN_ROOM_SIZE, maxW - dragState.origX);
            newH = clamp(dragState.origHeight - dy, MIN_ROOM_SIZE, dragState.origY + dragState.origHeight);
            newY = dragState.origY + dragState.origHeight - newH;
            break;
          case "nw":
            newW = clamp(dragState.origWidth - dx, MIN_ROOM_SIZE, dragState.origX + dragState.origWidth);
            newH = clamp(dragState.origHeight - dy, MIN_ROOM_SIZE, dragState.origY + dragState.origHeight);
            newX = dragState.origX + dragState.origWidth - newW;
            newY = dragState.origY + dragState.origHeight - newH;
            break;
        }

        updated = { x: newX, y: newY, width: newW, height: newH };
      }

      onRoomsChange(
        rooms.map((r) => (r.id === dragState.roomId ? { ...r, ...updated } : r))
      );
    },
    [dragState, rooms, onRoomsChange, naturalSize, getRelativePos]
  );

  const handlePointerUp = useCallback(() => {
    setDragState(null);
  }, []);

  // Global listeners for drag
  useEffect(() => {
    if (!dragState) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      handlePointerMove(e);
    };
    const onUp = () => handlePointerUp();

    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragState, handlePointerMove, handlePointerUp]);

  // ─── Room actions ─────────────────────────────────────────────────

  const addNewRoom = useCallback(() => {
    if (!naturalSize) return;

    const id = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    // Place near last selected room if possible, otherwise center. Size = 15% of plan.
    const lastSelected = rooms.find((r) => r.id === selectedRoomId);
    const baseX = lastSelected ? lastSelected.x + lastSelected.width + 20 : naturalSize.width / 2 - naturalSize.width * 0.075;
    const baseY = lastSelected ? lastSelected.y : naturalSize.height / 2 - naturalSize.height * 0.075;
    const newRoom: PlanRoom = {
      id,
      name: "Nouvelle pièce",
      roomType: "autre",
      x: Math.round(clamp(baseX, 0, naturalSize.width * 0.8)),
      y: Math.round(clamp(baseY, 0, naturalSize.height * 0.8)),
      width: Math.round(naturalSize.width * 0.15),
      height: Math.round(naturalSize.height * 0.15),
      color: colorForType("autre"),
      isNew: true,
    };

    onRoomsChange([...rooms, newRoom]);
    setSelectedRoomId(id);
    setSelectedRoomIds(new Set([id]));
    // Auto-edit the name
    setTimeout(() => setEditingNameId(id), 100);
  }, [rooms, onRoomsChange, naturalSize, selectedRoomId]);

  /** Fusionner les pièces sélectionnées en une seule (bounding box englobante) */
  const mergeSelectedRooms = useCallback(() => {
    if (selectedRoomIds.size < 2) return;
    const selected = rooms.filter((r) => selectedRoomIds.has(r.id));
    if (selected.length < 2) return;

    // Compute bounding box
    const minX = Math.min(...selected.map((r) => r.x));
    const minY = Math.min(...selected.map((r) => r.y));
    const maxX = Math.max(...selected.map((r) => r.x + r.width));
    const maxY = Math.max(...selected.map((r) => r.y + r.height));

    // Use the name and type of the largest room
    const largest = selected.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b));

    const id = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const merged: PlanRoom = {
      id,
      name: largest.name,
      roomType: largest.roomType,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      color: colorForType(largest.roomType),
      isNew: true,
    };

    const remaining = rooms.filter((r) => !selectedRoomIds.has(r.id));
    onRoomsChange([...remaining, merged]);
    setSelectedRoomId(id);
    setSelectedRoomIds(new Set([id]));
    setTimeout(() => setEditingNameId(id), 100);
  }, [rooms, onRoomsChange, selectedRoomIds]);

  const deleteRoom = useCallback(
    (roomId: string) => {
      onRoomsChange(rooms.filter((r) => r.id !== roomId));
      if (selectedRoomId === roomId) setSelectedRoomId(null);
      setSelectedRoomIds((prev) => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
    },
    [rooms, onRoomsChange, selectedRoomId]
  );

  const updateRoomName = useCallback(
    (roomId: string, name: string) => {
      onRoomsChange(rooms.map((r) => (r.id === roomId ? { ...r, name } : r)));
    },
    [rooms, onRoomsChange]
  );

  const updateRoomType = useCallback(
    (roomId: string, roomType: string) => {
      onRoomsChange(
        rooms.map((r) =>
          r.id === roomId ? { ...r, roomType, color: colorForType(roomType) } : r
        )
      );
      setEditingTypeId(null);
    },
    [rooms, onRoomsChange]
  );

  // Deselect when clicking the background
  const handleBackgroundClick = useCallback(() => {
    setSelectedRoomId(null);
    setSelectedRoomIds(new Set());
    setEditingNameId(null);
    setEditingTypeId(null);
  }, []);

  // ─── Render ───────────────────────────────────────────────────────

  const isReady = imgSize && naturalSize;

  // Count existing vs new rooms
  const existingCount = rooms.filter((r) => !r.isNew).length;
  const newCount = rooms.filter((r) => r.isNew).length;
  const canMerge = selectedRoomIds.size >= 2;

  return (
    <div className="space-y-3">
      {/* Help text — ABOVE the editor so Thomas sees it first */}
      <div className="p-3 rounded-lg bg-[#F0F4EE] border border-[#7D9B76]/20 text-[13px] text-[#4A7A42] leading-relaxed">
        <p className="font-medium mb-1">Comment utiliser l&apos;éditeur :</p>
        <ul className="space-y-0.5 text-[12px]">
          <li>Glissez une pièce pour la déplacer. Tirez les coins pour redimensionner.</li>
          <li>Appui long sur le nom (ou double-clic) pour renommer.</li>
          <li>Shift+clic sur 2 pièces puis &quot;Fusionner&quot; pour casser un mur.</li>
          <li><span className="inline-block w-3 h-2 border-2 border-dashed border-[#7D9B76] rounded-sm mr-1" />= pièce projet (ajoutée par vous) &nbsp; <span className="inline-block w-3 h-2 border-2 border-solid border-[#6495ED] rounded-sm mr-1" />= pièce existante</li>
        </ul>
      </div>

      {/* Header toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-[#1C1C1E]">
            Éditeur de plan
          </h3>
          {(existingCount > 0 || newCount > 0) && (
            <span className="text-xs text-[#9B9A94]">
              {existingCount > 0 && <span>{existingCount} existante{existingCount > 1 ? "s" : ""}</span>}
              {existingCount > 0 && newCount > 0 && " + "}
              {newCount > 0 && <span className="text-[#7D9B76] font-medium">{newCount} projet</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Merge button — visible when 2+ rooms selected */}
          {canMerge && (
            <button
              type="button"
              onClick={mergeSelectedRooms}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                         bg-[#7D9B76] text-white text-xs font-medium
                         hover:bg-[#4A7A42] transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[#7D9B76] min-h-[44px]
                         shadow-sm"
              aria-label={`Fusionner les ${selectedRoomIds.size} pièces sélectionnées`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 3H5a2 2 0 00-2 2v3" />
                <path d="M21 8V5a2 2 0 00-2-2h-3" />
                <path d="M3 16v3a2 2 0 002 2h3" />
                <path d="M16 21h3a2 2 0 002-2v-3" />
              </svg>
              Fusionner ({selectedRoomIds.size})
            </button>
          )}
          <button
            type="button"
            onClick={addNewRoom}
            disabled={!isReady}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                       border border-dashed border-[#7D9B76] text-xs font-medium
                       text-[#7D9B76] hover:bg-[#7D9B76]/10 transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#7D9B76] min-h-[44px]
                       disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Ajouter une nouvelle pièce sur le plan"
          >
            <svg
              width="14"
              height="14"
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
            Nouvelle pièce
          </button>
        </div>
      </div>

      {/* Plan container */}
      <div
        ref={containerRef}
        className="relative overflow-auto rounded-lg border border-[#D1D0CB]/40
                   bg-[#F5F5F0] shadow-[0_1px_3px_rgba(28,28,30,0.06)]
                   touch-pan-x touch-pan-y"
        style={{ maxHeight: "70vh" }}
        onClick={handleBackgroundClick}
        role="application"
        aria-label="Éditeur de plan interactif — déplacez et redimensionnez les pièces"
      >
        {/* Plan image */}
        <img
          src={planImageUrl}
          alt="Plan du bien"
          onLoad={handleImageLoad}
          className="block w-full h-auto select-none pointer-events-none"
          draggable={false}
        />

        {/* Room overlays */}
        {isReady &&
          rooms.map((room) => {
            const isSelected = selectedRoomId === room.id;
            const isMultiSelected = selectedRoomIds.has(room.id);
            const isDragging = dragState?.roomId === room.id;
            const bgColor = room.color || colorForType(room.roomType);
            const brdColor = borderForType(room.roomType);
            const isNewRoom = room.isNew === true;

            // Displayed positions (scaled from natural coords)
            const dx = room.x * displayScale;
            const dy = room.y * displayScale;
            const dw = room.width * displayScale;
            const dh = room.height * displayScale;

            const surface = computeSurface(room.width, room.height, scaleFactor);

            return (
              <div
                key={room.id}
                className="absolute group"
                style={{
                  left: dx,
                  top: dy,
                  width: dw,
                  height: dh,
                  cursor: isDragging ? "grabbing" : "grab",
                  zIndex: isSelected ? 20 : isMultiSelected ? 15 : 10,
                  touchAction: "none",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Shift+click = multi-select for fusion
                  if (e.shiftKey) {
                    setSelectedRoomIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(room.id)) {
                        next.delete(room.id);
                      } else {
                        next.add(room.id);
                      }
                      // Also add current single-selected if not yet in set
                      if (selectedRoomId && !next.has(selectedRoomId)) {
                        next.add(selectedRoomId);
                      }
                      return next;
                    });
                  } else {
                    setSelectedRoomId(room.id);
                    setSelectedRoomIds(new Set([room.id]));
                  }
                }}
                onMouseDown={(e) => handlePointerDown(e, room.id, "move")}
                onTouchStart={(e) => {
                  handlePointerDown(e, room.id, "move");
                  // Long-press (500ms) to rename on touch
                  if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = setTimeout(() => {
                    setEditingNameId(room.id);
                  }, 500);
                }}
                onTouchEnd={() => {
                  if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                  }
                }}
                onTouchMove={() => {
                  // Cancel long-press if finger moves (drag)
                  if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${room.name} — ${surface} m²${isNewRoom ? " (projet)" : " (existante)"}. Déplacer avec la souris ou le doigt.`}
                onKeyDown={(e) => {
                  if (e.key === "Delete" || e.key === "Backspace") {
                    deleteRoom(room.id);
                  }
                }}
              >
                {/* Zone background — dashed border for new/project rooms, solid for existing */}
                <div
                  className="absolute inset-0 rounded-sm transition-shadow duration-150"
                  style={{
                    backgroundColor: isNewRoom ? bgColor.replace("0.3)", "0.4)") : bgColor,
                    border: isNewRoom
                      ? `2px dashed ${brdColor}`
                      : `2px solid ${brdColor}`,
                    boxShadow: isSelected || isMultiSelected
                      ? `0 0 0 2px ${brdColor}, 0 2px 8px rgba(0,0,0,0.15)`
                      : "none",
                  }}
                />

                {/* "PROJET" badge for new rooms */}
                {isNewRoom && (
                  <div className="absolute top-0.5 left-0.5 z-20">
                    <span className="text-[9px] font-bold text-white bg-[#7D9B76] rounded px-1 py-px uppercase tracking-wide">
                      Projet
                    </span>
                  </div>
                )}

                {/* Label — name + surface (bigger text for mobile) */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center
                             pointer-events-none select-none overflow-hidden px-1"
                >
                  {editingNameId === room.id ? (
                    <input
                      type="text"
                      value={room.name}
                      onChange={(e) => updateRoomName(room.id, e.target.value)}
                      onBlur={() => setEditingNameId(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") {
                          setEditingNameId(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      autoFocus
                      className="pointer-events-auto w-[90%] text-center text-[13px]
                                 font-semibold text-[#1C1C1E] bg-white/90 rounded
                                 border border-[#7D9B76] outline-none px-1 py-1
                                 focus-visible:ring-2 focus-visible:ring-[#7D9B76]
                                 min-h-[36px]"
                      aria-label="Renommer la pièce"
                    />
                  ) : (
                    <span
                      className="text-[13px] font-semibold text-[#1C1C1E] leading-tight
                                 truncate max-w-full text-center drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]
                                 pointer-events-auto cursor-text"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingNameId(room.id);
                      }}
                      title="Double-cliquer pour renommer (appui long sur mobile)"
                    >
                      {room.name || "Sans nom"}
                    </span>
                  )}

                  <span
                    className="text-[12px] text-[#1C1C1E]/70 leading-tight
                               drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
                  >
                    {surface} m²
                  </span>
                </div>

                {/* Rename button — visible when selected, for mobile accessibility */}
                {isSelected && editingNameId !== room.id && (
                  <button
                    type="button"
                    className="absolute -top-2 -left-2 w-7 h-7 rounded-full
                               bg-[#7D9B76] text-white flex items-center justify-center
                               shadow-md hover:bg-[#4A7A42] transition-colors z-30
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-[#7D9B76] focus-visible:ring-offset-1
                               min-w-[44px] min-h-[44px] -m-[9px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingNameId(room.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    aria-label={`Renommer ${room.name || "cette pièce"}`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}

                {/* Type selector (visible when selected) */}
                {isSelected && editingTypeId === room.id && (
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full z-30"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <select
                      value={room.roomType}
                      onChange={(e) => updateRoomType(room.id, e.target.value)}
                      onBlur={() => setEditingTypeId(null)}
                      autoFocus
                      className="text-[13px] text-[#1C1C1E] bg-white border border-[#D1D0CB]
                                 rounded-md px-2 py-1 shadow-md min-h-[44px]
                                 focus-visible:outline-none focus-visible:ring-2
                                 focus-visible:ring-[#7D9B76]"
                      aria-label={`Type de pièce pour ${room.name}`}
                    >
                      {ROOM_TYPE_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Delete button (top-right) */}
                {isSelected && (
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full
                               bg-[#B91C1C] text-white flex items-center justify-center
                               shadow-md hover:bg-[#991B1B] transition-colors z-30
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-[#B91C1C] focus-visible:ring-offset-1
                               min-w-[44px] min-h-[44px] -m-[8px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRoom(room.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    aria-label={`Supprimer ${room.name || "cette pièce"}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}

                {/* Type badge (bottom — click to change) — min-h-[44px] for mobile */}
                {isSelected && editingTypeId !== room.id && (
                  <button
                    type="button"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full z-30
                               text-[12px] font-medium text-[#1C1C1E] bg-white border
                               border-[#D1D0CB] rounded-full px-3 py-1 shadow-sm
                               hover:bg-[#F5F5F0] transition-colors min-h-[44px]
                               flex items-center
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-[#7D9B76]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTypeId(room.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    aria-label={`Changer le type de ${room.name}`}
                  >
                    {ROOM_TYPE_LABELS[room.roomType] || room.roomType}
                  </button>
                )}

                {/* Resize handles (visible when selected) — bigger for mobile */}
                {isSelected &&
                  (["nw", "ne", "sw", "se"] as HandlePosition[]).map((handle) => {
                    const isLeft = handle.includes("w");
                    const isTop = handle.includes("n");
                    const cursor =
                      handle === "nw" || handle === "se"
                        ? "nwse-resize"
                        : "nesw-resize";

                    return (
                      <div
                        key={handle}
                        className="absolute z-30"
                        style={{
                          width: HANDLE_SIZE,
                          height: HANDLE_SIZE,
                          left: isLeft ? -HANDLE_SIZE / 2 : undefined,
                          right: isLeft ? undefined : -HANDLE_SIZE / 2,
                          top: isTop ? -HANDLE_SIZE / 2 : undefined,
                          bottom: isTop ? undefined : -HANDLE_SIZE / 2,
                          cursor,
                          // Enlarge touch target to 44px
                          padding: 12,
                          margin: -12,
                        }}
                        onMouseDown={(e) => handlePointerDown(e, room.id, "resize", handle)}
                        onTouchStart={(e) => handlePointerDown(e, room.id, "resize", handle)}
                        role="img"
                        aria-label={`Redimensionner ${room.name} depuis le coin ${handle === "nw" ? "haut-gauche" : handle === "ne" ? "haut-droite" : handle === "sw" ? "bas-gauche" : "bas-droite"}`}
                        tabIndex={-1}
                      >
                        <div
                          className="w-full h-full rounded-sm bg-white border-2 shadow-sm"
                          style={{ borderColor: brdColor }}
                        />
                      </div>
                    );
                  })}
              </div>
            );
          })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-[#9B9A94]">
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-sm border"
            style={{
              backgroundColor: ROOM_COLORS.salon,
              borderColor: ROOM_BORDER_COLORS.salon,
            }}
            aria-hidden="true"
          />
          Salon
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-sm border"
            style={{
              backgroundColor: ROOM_COLORS.chambre,
              borderColor: ROOM_BORDER_COLORS.chambre,
            }}
            aria-hidden="true"
          />
          Chambre
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-sm border"
            style={{
              backgroundColor: ROOM_COLORS.cuisine,
              borderColor: ROOM_BORDER_COLORS.cuisine,
            }}
            aria-hidden="true"
          />
          Cuisine
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-sm border"
            style={{
              backgroundColor: ROOM_COLORS.sdb,
              borderColor: ROOM_BORDER_COLORS.sdb,
            }}
            aria-hidden="true"
          />
          SdB / WC
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-sm border"
            style={{
              backgroundColor: ROOM_COLORS.bureau,
              borderColor: ROOM_BORDER_COLORS.bureau,
            }}
            aria-hidden="true"
          />
          Bureau
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-sm border-2 border-dashed"
            style={{
              backgroundColor: "rgba(169, 169, 169, 0.3)",
              borderColor: "rgba(125, 155, 118, 0.8)",
            }}
            aria-hidden="true"
          />
          Projet
        </span>
      </div>

      {/* Surface warning */}
      <p className="text-[11px] text-[#C68A2E] bg-[#FFF8EE] border border-[#C68A2E]/20 rounded px-2 py-1.5 leading-relaxed">
        Les surfaces sont indicatives et dépendent du calibrage du plan. Pour des surfaces exactes, utilisez les mesures réelles de votre géomètre.
      </p>
    </div>
  );
}
