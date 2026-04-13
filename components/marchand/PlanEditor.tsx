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
  onScaleFactorChange?: (sf: number) => void;
  /** ID de la pièce survolée dans la liste — highlight visuel sur le plan */
  highlightedRoomId?: string | null;
  /** Callback quand une pièce est cliquée sur le plan (pour scroll-into-view dans la liste) */
  onRoomClick?: (roomId: string) => void;
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

/** Point for calibration line */
interface CalibrationPoint {
  x: number;
  y: number;
}

type ViewMode = "projet" | "actuel";

// ─── Constants ──────────────────────────────────────────────────────

const ROOM_COLORS: Record<string, string> = {
  salon: "rgba(125, 155, 118, 0.3)",
  sejour: "rgba(125, 155, 118, 0.3)",
  chambre: "rgba(100, 149, 237, 0.3)",
  chambre_parentale: "rgba(70, 130, 220, 0.3)",
  cuisine: "rgba(255, 165, 0, 0.3)",
  sdb: "rgba(0, 191, 255, 0.3)",
  wc: "rgba(168, 85, 247, 0.3)",
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
  wc: "rgba(168, 85, 247, 0.8)",
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

const HANDLE_SIZE = 16; // taille visuelle de la poignée
const HANDLE_HIT_SIZE = 44; // zone de hit touch (WCAG 2.2 AA — 44×44px minimum)
const MIN_ROOM_SIZE = 40;
const SNAP_GRID = 10;
const SNAP_GUIDE_THRESHOLD = 8;
const UNDO_MAX_HISTORY = 20;

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

/** Snap une valeur sur la grille la plus proche */
function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Distance entre deux points en pixels */
function distancePx(a: CalibrationPoint, b: CalibrationPoint): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/** Trouve les guides d'alignement : bords d'une room qui s'alignent avec les bords des autres rooms */
function findAlignmentGuides(
  movingRoom: PlanRoom,
  otherRooms: PlanRoom[],
  threshold: number
): { horizontal: number[]; vertical: number[] } {
  const horizontal: number[] = [];
  const vertical: number[] = [];

  const movingEdges = {
    left: movingRoom.x,
    right: movingRoom.x + movingRoom.width,
    top: movingRoom.y,
    bottom: movingRoom.y + movingRoom.height,
    centerX: movingRoom.x + movingRoom.width / 2,
    centerY: movingRoom.y + movingRoom.height / 2,
  };

  for (const other of otherRooms) {
    const otherEdges = {
      left: other.x,
      right: other.x + other.width,
      top: other.y,
      bottom: other.y + other.height,
      centerX: other.x + other.width / 2,
      centerY: other.y + other.height / 2,
    };

    // Vertical guides (x-axis alignment)
    for (const mEdge of [movingEdges.left, movingEdges.right, movingEdges.centerX]) {
      for (const oEdge of [otherEdges.left, otherEdges.right, otherEdges.centerX]) {
        if (Math.abs(mEdge - oEdge) < threshold) {
          vertical.push(oEdge);
        }
      }
    }

    // Horizontal guides (y-axis alignment)
    for (const mEdge of [movingEdges.top, movingEdges.bottom, movingEdges.centerY]) {
      for (const oEdge of [otherEdges.top, otherEdges.bottom, otherEdges.centerY]) {
        if (Math.abs(mEdge - oEdge) < threshold) {
          horizontal.push(oEdge);
        }
      }
    }
  }

  // Deduplicate
  return {
    horizontal: horizontal.filter((v, i, a) => a.indexOf(v) === i),
    vertical: vertical.filter((v, i, a) => a.indexOf(v) === i),
  };
}

// ─── Component ──────────────────────────────────────────────────────

export default function PlanEditor({
  planImageUrl,
  rooms,
  onRoomsChange,
  scaleFactor = 50,
  onScaleFactorChange,
  highlightedRoomId,
  onRoomClick,
}: PlanEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const justDraggedRef = useRef(false);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  // Multi-selection for fusion (Shift+click or long-press second room)
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  // Pending delete confirmation (UX C1)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // Toolbar collapse — advanced options hidden by default (UX C3)
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  // Mobile fusion mode — "Fusionner avec..." tap flow (Moi)
  const [fusionMode, setFusionMode] = useState(false);
  // Zoom level (Moi)
  const [zoomLevel, setZoomLevel] = useState(1);
  // Help collapsed by default (UX C5)
  const [helpExpanded, setHelpExpanded] = useState(false);
  // Long-press timer for touch rename
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the natural image dimensions to compute the displayed scale
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // P1 — Cleanup long-press timer on unmount (QA B6)
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, []);

  // ─── Undo / Redo ────────────────────────────────────────────────
  const [undoStack, setUndoStack] = useState<PlanRoom[][]>([]);
  const [redoStack, setRedoStack] = useState<PlanRoom[][]>([]);
  const skipSnapshotRef = useRef(false);

  // Ref to always capture latest rooms for undo snapshots (avoids stale closure)
  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;

  /** Push current rooms state onto undo stack before a mutation */
  const pushUndo = useCallback(() => {
    setUndoStack((prev) => {
      const next = [...prev, roomsRef.current];
      if (next.length > UNDO_MAX_HISTORY) next.shift();
      return next;
    });
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, rooms]);
    skipSnapshotRef.current = true;
    onRoomsChange(prev);
  }, [undoStack, rooms, onRoomsChange]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, rooms]);
    skipSnapshotRef.current = true;
    onRoomsChange(next);
  }, [redoStack, rooms, onRoomsChange]);

  // ─── Calibration ────────────────────────────────────────────────
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPointA, setCalibrationPointA] = useState<CalibrationPoint | null>(null);
  const [calibrationPointB, setCalibrationPointB] = useState<CalibrationPoint | null>(null);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationInput, setCalibrationInput] = useState("");
  const [isCalibrated, setIsCalibrated] = useState(false);

  // ─── View mode toggle ──────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("projet");

  // ─── Alignment guides ──────────────────────────────────────────
  const [alignmentGuides, setAlignmentGuides] = useState<{ horizontal: number[]; vertical: number[] }>({ horizontal: [], vertical: [] });

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

  // ─── Keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z) ─────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

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

      // If calibrating, ignore room drag
      if (isCalibrating) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const pos = getRelativePos(clientX, clientY);

      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;

      // Push undo snapshot before drag starts
      pushUndo();

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
    [rooms, getRelativePos, isCalibrating, pushUndo]
  );

  // rAF throttle to avoid excessive re-renders during drag (QA B5)
  const rafRef = useRef<number | null>(null);

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragState || !naturalSize) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      // Cancel previous frame if not yet rendered
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const pos = getRelativePos(clientX, clientY);

      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;

      const maxW = naturalSize.width;
      const maxH = naturalSize.height;

      let updated: Partial<PlanRoom>;

      if (dragState.type === "move") {
        const rawX = clamp(dragState.origX + dx, 0, maxW - dragState.origWidth);
        const rawY = clamp(dragState.origY + dy, 0, maxH - dragState.origHeight);
        updated = {
          x: snapToGrid(rawX, SNAP_GRID),
          y: snapToGrid(rawY, SNAP_GRID),
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

        updated = {
          x: snapToGrid(newX, SNAP_GRID),
          y: snapToGrid(newY, SNAP_GRID),
          width: snapToGrid(newW, SNAP_GRID),
          height: snapToGrid(newH, SNAP_GRID),
        };
      }

      // Compute alignment guides for visual feedback
      const movingRoom: PlanRoom = {
        ...rooms.find((r) => r.id === dragState.roomId)!,
        ...updated,
      };
      const otherRooms = rooms.filter((r) => r.id !== dragState.roomId);
      setAlignmentGuides(findAlignmentGuides(movingRoom, otherRooms, SNAP_GUIDE_THRESHOLD));

      onRoomsChange(
        rooms.map((r) => (r.id === dragState.roomId ? { ...r, ...updated } : r))
      );
      }); // end requestAnimationFrame
    },
    [dragState, rooms, onRoomsChange, naturalSize, getRelativePos]
  );

  const handlePointerUp = useCallback(() => {
    if (dragState) {
      // Mark that we just finished a drag — prevent onClick from firing onRoomClick
      justDraggedRef.current = true;
      requestAnimationFrame(() => { justDraggedRef.current = false; });
    }
    setDragState(null);
    setAlignmentGuides({ horizontal: [], vertical: [] });
  }, [dragState]);

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
    pushUndo();

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
  }, [rooms, onRoomsChange, naturalSize, selectedRoomId, pushUndo]);

  /** Fusionner les pièces sélectionnées en une seule (bounding box englobante) */
  const mergeSelectedRooms = useCallback(() => {
    if (selectedRoomIds.size < 2) return;
    pushUndo();
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
  }, [rooms, onRoomsChange, selectedRoomIds, pushUndo]);

  /** P1 — Request delete shows confirmation inline (UX C1) */
  const requestDelete = useCallback((roomId: string) => {
    setPendingDeleteId(roomId);
  }, []);

  /** P1 — Confirm delete after user approval */
  const confirmDelete = useCallback(
    (roomId: string) => {
      pushUndo();
      onRoomsChange(rooms.filter((r) => r.id !== roomId));
      if (selectedRoomId === roomId) setSelectedRoomId(null);
      setSelectedRoomIds((prev) => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
      setPendingDeleteId(null);
    },
    [rooms, onRoomsChange, selectedRoomId, pushUndo]
  );

  const cancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const updateRoomName = useCallback(
    (roomId: string, name: string) => {
      onRoomsChange(rooms.map((r) => (r.id === roomId ? { ...r, name } : r)));
    },
    [rooms, onRoomsChange]
  );

  /** Push undo snapshot when rename is committed (on blur or Enter).
   *  P1 — If the name is empty/whitespace, restore the previous name (QA B3). */
  const commitRoomName = useCallback(
    (roomId: string, previousName: string) => {
      const room = rooms.find((r) => r.id === roomId);
      if (room && (!room.name || !room.name.trim())) {
        // Restore old name — do NOT push undo for a no-op
        onRoomsChange(rooms.map((r) => (r.id === roomId ? { ...r, name: previousName || "Sans nom" } : r)));
      } else {
        pushUndo();
      }
      setEditingNameId(null);
    },
    [rooms, onRoomsChange, pushUndo]
  );
  // Track the name at edit start for rollback on empty
  const editNameBeforeRef = useRef<string>("");

  const updateRoomType = useCallback(
    (roomId: string, roomType: string) => {
      pushUndo();
      onRoomsChange(
        rooms.map((r) =>
          r.id === roomId ? { ...r, roomType, color: colorForType(roomType) } : r
        )
      );
      setEditingTypeId(null);
    },
    [rooms, onRoomsChange, pushUndo]
  );

  // ─── Calibration click logic ──────────────────────────────────────
  const handleCalibrationClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isCalibrating) return;
      e.stopPropagation();

      const pos = getRelativePos(e.clientX, e.clientY);
      const point: CalibrationPoint = { x: pos.x, y: pos.y };

      if (!calibrationPointA) {
        setCalibrationPointA(point);
      } else if (!calibrationPointB) {
        setCalibrationPointB(point);
        setShowCalibrationModal(true);
      }
    },
    [isCalibrating, calibrationPointA, calibrationPointB, getRelativePos]
  );

  const confirmCalibration = useCallback(() => {
    if (!calibrationPointA || !calibrationPointB) return;
    const distMetres = parseFloat(calibrationInput);
    if (!distMetres || distMetres <= 0) return;

    const distPx = distancePx(calibrationPointA, calibrationPointB);
    // P0 — Guard against div/0 when both points are (nearly) the same pixel
    if (distPx < 1) return;
    const newScaleFactor = distPx / distMetres;

    if (onScaleFactorChange) {
      onScaleFactorChange(newScaleFactor);
    }

    setIsCalibrated(true);
    setIsCalibrating(false);
    setCalibrationPointA(null);
    setCalibrationPointB(null);
    setShowCalibrationModal(false);
    setCalibrationInput("");
  }, [calibrationPointA, calibrationPointB, calibrationInput, onScaleFactorChange]);

  const cancelCalibration = useCallback(() => {
    setIsCalibrating(false);
    setCalibrationPointA(null);
    setCalibrationPointB(null);
    setShowCalibrationModal(false);
    setCalibrationInput("");
  }, []);

  // Deselect when clicking the background
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isCalibrating) {
        handleCalibrationClick(e);
        return;
      }
      setSelectedRoomId(null);
      setSelectedRoomIds(new Set());
      setEditingNameId(null);
      setEditingTypeId(null);
    },
    [isCalibrating, handleCalibrationClick]
  );

  // ─── Render ───────────────────────────────────────────────────────

  const isReady = imgSize && naturalSize;

  // Filter rooms based on view mode
  const visibleRooms = viewMode === "actuel" ? rooms.filter((r) => !r.isNew) : rooms;

  // Count existing vs new rooms
  const existingCount = rooms.filter((r) => !r.isNew).length;
  const newCount = rooms.filter((r) => r.isNew).length;
  const canMerge = selectedRoomIds.size >= 2;

  // Scale indicator text
  const scaleIndicatorText = isCalibrated
    ? `1 m = ${scaleFactor.toFixed(0)} px`
    : null;

  return (
    <div className="space-y-3">
      {/* P2 — Help text collapsible (UX C5) — single line + expand */}
      <div className="p-3 rounded-lg bg-[#F0F4EE] border border-[#7D9B76]/20 text-[13px] text-[#4A7A42] leading-relaxed">
        <p>
          Déplacez les pièces, redimensionnez-les, ou ajoutez-en de nouvelles.{" "}
          <button
            type="button"
            onClick={() => setHelpExpanded((v) => !v)}
            className="underline underline-offset-2 hover:text-[#4A7A42]/80 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] rounded"
          >
            {helpExpanded ? "Réduire" : "En savoir plus"}
          </button>
        </p>
        {helpExpanded && (
          <ul className="space-y-0.5 text-[12px] mt-2">
            <li>Glissez une pièce pour la déplacer. Tirez les coins pour redimensionner.</li>
            <li>Appui long sur le nom (ou double-clic) pour renommer.</li>
            <li>Shift+clic (ou « Fusionner avec… » sur mobile) sur 2 pièces pour casser un mur.</li>
            <li><span className="inline-block w-3 h-2 border-2 border-dashed border-[#7D9B76] rounded-sm mr-1" />= pièce projet (ajoutée par vous) &nbsp; <span className="inline-block w-3 h-2 border-2 border-solid border-[#6495ED] rounded-sm mr-1" />= pièce existante</li>
          </ul>
        )}
      </div>

      {/* Header toolbar */}
      <div className="flex items-center justify-between gap-2 sm:flex-wrap">
        <div className="flex items-center gap-3 shrink-0">
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
          {scaleIndicatorText && (
            <span className="text-[11px] text-[#7D9B76] bg-[#F0F4EE] rounded px-1.5 py-0.5 font-mono">
              {scaleIndicatorText}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap">
          {/* P2 — Undo / Redo with text labels (UX C4) */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="inline-flex items-center gap-1 px-2.5 h-10 rounded-md
                       border border-[#D1D0CB]/60 text-[#1C1C1E]/70 text-xs
                       hover:bg-[#F5F5F0] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#7D9B76] min-w-[44px] min-h-[44px]
                       disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Annuler (Ctrl+Z)"
            title="Annuler (Ctrl+Z)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
            <span className="hidden sm:inline">Annuler</span>
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="inline-flex items-center gap-1 px-2.5 h-10 rounded-md
                       border border-[#D1D0CB]/60 text-[#1C1C1E]/70 text-xs
                       hover:bg-[#F5F5F0] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#7D9B76] min-w-[44px] min-h-[44px]
                       disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Refaire (Ctrl+Shift+Z)"
            title="Refaire (Ctrl+Shift+Z)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" />
            </svg>
            <span className="hidden sm:inline">Refaire</span>
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-[#D1D0CB]/40 mx-0.5" aria-hidden="true" />

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

          {/* P1 — Mobile fusion button (Moi) — visible when 1 room selected and not in canMerge mode */}
          {selectedRoomId && !canMerge && (
            <button
              type="button"
              onClick={() => {
                if (fusionMode) {
                  setFusionMode(false);
                } else {
                  // Ensure the single selected room is in the multi-select set
                  setSelectedRoomIds(new Set([selectedRoomId]));
                  setFusionMode(true);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                         text-xs font-medium transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[#7D9B76] min-h-[44px]
                         ${fusionMode
                           ? "bg-[#7D9B76] text-white shadow-sm"
                           : "border border-[#D1D0CB]/60 text-[#1C1C1E]/70 hover:bg-[#F5F5F0]"
                         }`}
              aria-label={fusionMode ? "Annuler la fusion" : "Fusionner avec une autre pièce"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 3H5a2 2 0 00-2 2v3" />
                <path d="M21 8V5a2 2 0 00-2-2h-3" />
                <path d="M3 16v3a2 2 0 002 2h3" />
                <path d="M16 21h3a2 2 0 002-2v-3" />
              </svg>
              {fusionMode ? "Annuler fusion" : "Fusionner avec…"}
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

          {/* Calibration — always visible (Thomas needs to see it) */}
          <button
            type="button"
            onClick={() => {
              if (isCalibrating) {
                cancelCalibration();
              } else {
                setIsCalibrating(true);
                setCalibrationPointA(null);
                setCalibrationPointB(null);
              }
            }}
            disabled={!isReady}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                       text-xs font-medium transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#7D9B76] min-h-[44px]
                       disabled:opacity-40 disabled:cursor-not-allowed
                       ${isCalibrating
                         ? "bg-[#7D9B76] text-white shadow-sm"
                         : "border border-[#D1D0CB]/60 text-[#1C1C1E]/70 hover:bg-[#F5F5F0]"
                       }`}
            aria-label={isCalibrating ? "Annuler la calibration" : "Calibrer les distances"}
            title={isCalibrating ? "Cliquez pour annuler" : "Calibrer les distances réelles"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.3 15.3a2.4 2.4 0 010 3.4l-2.6 2.6a2.4 2.4 0 01-3.4 0L2.7 8.7a2.41 2.41 0 010-3.4l2.6-2.6a2.41 2.41 0 013.4 0z" />
              <line x1="14.5" y1="12.5" x2="11.5" y2="9.5" />
            </svg>
            <span className="hidden sm:inline">{isCalibrating ? "Annuler" : "Calibrer"}</span>
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-[#D1D0CB]/40 mx-0.5" aria-hidden="true" />

          {/* Advanced options toggle — plan/projet only */}
          <button
            type="button"
            onClick={() => setShowAdvancedTools((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 h-10 rounded-md
                       border border-[#D1D0CB]/60 text-[#1C1C1E]/70 text-xs
                       hover:bg-[#F5F5F0] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#7D9B76] min-w-[44px] min-h-[44px]"
            aria-expanded={showAdvancedTools}
            aria-label="Options avancées"
          >
            Options
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              className={`transition-transform ${showAdvancedTools ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Advanced tools row — View mode toggle plan/projet */}
      {showAdvancedTools && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* View mode toggle */}
          {newCount > 0 && (
            <div className="inline-flex rounded-md border border-[#D1D0CB]/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("actuel")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors
                           min-h-[44px]
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[#7D9B76] focus-visible:ring-inset
                           ${viewMode === "actuel"
                             ? "bg-[#1C1C1E] text-white"
                             : "text-[#1C1C1E]/70 hover:bg-[#F5F5F0]"
                           }`}
                aria-label="Voir le plan actuel (sans les pièces projet)"
                aria-pressed={viewMode === "actuel"}
              >
                Plan actuel
              </button>
              <button
                type="button"
                onClick={() => setViewMode("projet")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors
                           min-h-[44px]
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[#7D9B76] focus-visible:ring-inset
                           ${viewMode === "projet"
                             ? "bg-[#7D9B76] text-white"
                             : "text-[#1C1C1E]/70 hover:bg-[#F5F5F0]"
                           }`}
                aria-label="Voir le projet complet (existantes + projet)"
                aria-pressed={viewMode === "projet"}
              >
                Mon projet
              </button>
            </div>
          )}
        </div>
      )}

      {/* Calibration instruction banner */}
      {isCalibrating && (
        <div className="p-3 rounded-lg bg-[#EEF2FF] border border-[#6366F1]/20 text-[13px] text-[#4338CA] leading-relaxed">
          <p className="font-medium">
            {!calibrationPointA
              ? "Cliquez sur le premier point de la distance de référence (ex : un bord de porte)"
              : "Cliquez sur le deuxième point (ex : l'autre bord de la porte)"}
          </p>
          <p className="text-[12px] mt-0.5 text-[#4338CA]/70">
            Choisissez une distance dont vous connaissez la mesure réelle (porte, fenêtre, mur...).
          </p>
        </div>
      )}

      {/* P1 — Fusion mode banner */}
      {fusionMode && (
        <div className="p-2.5 rounded-lg bg-[#F0F4EE] border border-[#7D9B76]/20 text-[13px] text-[#4A7A42]">
          Touchez la pièce à fusionner avec <strong>{rooms.find((r) => r.id === selectedRoomId)?.name || "la pièce sélectionnée"}</strong>.
        </div>
      )}

      {/* Plan container */}
      <div
        className="relative overflow-auto rounded-lg border border-[#D1D0CB]/40
                   bg-[#F5F5F0] shadow-[0_1px_3px_rgba(28,28,30,0.06)]"
        style={{ maxHeight: "70vh" }}
      >
        <div
          ref={containerRef}
          className="relative touch-pan-x touch-pan-y"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "top left",
            /* Ensure the scrollable area accounts for the zoomed size */
            width: zoomLevel !== 1 ? `${100 / zoomLevel}%` : "100%",
          }}
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

        {/* Alignment guides SVG overlay */}
        {isReady && dragState && (alignmentGuides.horizontal.length > 0 || alignmentGuides.vertical.length > 0) && (
          <svg
            className="absolute inset-0 pointer-events-none z-[5]"
            style={{ width: imgSize!.width, height: imgSize!.height }}
            aria-hidden="true"
          >
            {alignmentGuides.vertical.map((x, i) => (
              <line
                key={`v-${i}`}
                x1={x * displayScale}
                y1={0}
                x2={x * displayScale}
                y2={imgSize!.height}
                stroke="#7D9B76"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.7"
              />
            ))}
            {alignmentGuides.horizontal.map((y, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={y * displayScale}
                x2={imgSize!.width}
                y2={y * displayScale}
                stroke="#7D9B76"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.7"
              />
            ))}
          </svg>
        )}

        {/* Calibration points + line overlay */}
        {isReady && isCalibrating && calibrationPointA && (
          <svg
            className="absolute inset-0 pointer-events-none z-[25]"
            style={{ width: imgSize!.width, height: imgSize!.height }}
            aria-hidden="true"
          >
            {/* Point A */}
            <circle
              cx={calibrationPointA.x * displayScale}
              cy={calibrationPointA.y * displayScale}
              r={6}
              fill="#7D9B76"
              stroke="#fff"
              strokeWidth="2"
            />
            {/* Point B + connecting line */}
            {calibrationPointB && (
              <>
                <line
                  x1={calibrationPointA.x * displayScale}
                  y1={calibrationPointA.y * displayScale}
                  x2={calibrationPointB.x * displayScale}
                  y2={calibrationPointB.y * displayScale}
                  stroke="#7D9B76"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
                <circle
                  cx={calibrationPointB.x * displayScale}
                  cy={calibrationPointB.y * displayScale}
                  r={6}
                  fill="#7D9B76"
                  stroke="#fff"
                  strokeWidth="2"
                />
              </>
            )}
          </svg>
        )}

        {/* Calibration crosshair cursor */}
        {isCalibrating && (
          <div
            className="absolute inset-0 z-[24]"
            style={{ cursor: "crosshair" }}
          />
        )}

        {/* Room overlays */}
        {isReady &&
          visibleRooms.map((room) => {
            const isSelected = selectedRoomId === room.id;
            const isMultiSelected = selectedRoomIds.has(room.id);
            const isHighlighted = highlightedRoomId === room.id;
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
                  // P1 — Fusion mode: second tap merges with the first room (Moi)
                  if (fusionMode && selectedRoomId && room.id !== selectedRoomId) {
                    const mergeIds = new Set([selectedRoomId, room.id]);
                    setSelectedRoomIds(mergeIds);
                    setFusionMode(false);
                    // Auto-merge after setting the IDs — use a microtask to let state settle
                    setTimeout(() => {
                      // Inline merge logic (same as mergeSelectedRooms but with explicit IDs)
                      const selected = rooms.filter((r) => mergeIds.has(r.id));
                      if (selected.length < 2) return;
                      pushUndo();
                      const minX = Math.min(...selected.map((r) => r.x));
                      const minY = Math.min(...selected.map((r) => r.y));
                      const maxX = Math.max(...selected.map((r) => r.x + r.width));
                      const maxY = Math.max(...selected.map((r) => r.y + r.height));
                      const largest = selected.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b));
                      const newId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                      const merged: PlanRoom = {
                        id: newId, name: largest.name, roomType: largest.roomType,
                        x: minX, y: minY, width: maxX - minX, height: maxY - minY,
                        color: colorForType(largest.roomType), isNew: true,
                      };
                      const remaining = rooms.filter((r) => !mergeIds.has(r.id));
                      onRoomsChange([...remaining, merged]);
                      setSelectedRoomId(newId);
                      setSelectedRoomIds(new Set([newId]));
                      setTimeout(() => setEditingNameId(newId), 100);
                    }, 0);
                    return;
                  }
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
                    // Notify parent for scroll-into-view — but NOT after drag/resize
                    if (!justDraggedRef.current) {
                      onRoomClick?.(room.id);
                    }
                    // Cancel fusion mode if user clicks without using it
                    if (fusionMode) setFusionMode(false);
                  }
                }}
                onMouseDown={(e) => handlePointerDown(e, room.id, "move")}
                onTouchStart={(e) => {
                  handlePointerDown(e, room.id, "move");
                  // Long-press (500ms) to rename on touch
                  if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = setTimeout(() => {
                    editNameBeforeRef.current = room.name || "Sans nom";
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
                    requestDelete(room.id);
                  }
                }}
              >
                {/* Zone background — dashed border for new/project rooms, solid for existing */}
                <div
                  className="absolute inset-0 rounded-sm"
                  style={{
                    backgroundColor: isHighlighted
                      ? bgColor.replace("0.3)", "0.55)")
                      : isNewRoom ? bgColor.replace("0.3)", "0.4)") : bgColor,
                    border: isHighlighted
                      ? `3px solid ${brdColor}`
                      : isNewRoom
                        ? `2px dashed ${brdColor}`
                        : `2px solid ${brdColor}`,
                    boxShadow: isHighlighted
                      ? `0 0 0 3px ${brdColor}, 0 4px 12px rgba(0,0,0,0.25)`
                      : isSelected || isMultiSelected
                        ? `0 0 0 2px ${brdColor}, 0 2px 8px rgba(0,0,0,0.15)`
                        : "none",
                    transition: "box-shadow 150ms ease, background-color 150ms ease, border 150ms ease",
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
                      onBlur={() => commitRoomName(room.id, editNameBeforeRef.current)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") {
                          commitRoomName(room.id, editNameBeforeRef.current);
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
                                 truncate max-w-full text-center
                                 bg-white/90 rounded px-1
                                 pointer-events-auto cursor-text"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        editNameBeforeRef.current = room.name || "Sans nom";
                        setEditingNameId(room.id);
                      }}
                      title="Double-cliquer pour renommer (appui long sur mobile)"
                    >
                      {room.name || "Sans nom"}
                    </span>
                  )}

                  <span
                    className="text-[12px] font-medium text-[#1C1C1E] leading-tight
                               bg-white/90 rounded px-1"
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
                      editNameBeforeRef.current = room.name || "Sans nom";
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

                {/* Delete button (top-right) — triggers confirmation (UX C1) */}
                {isSelected && pendingDeleteId !== room.id && (
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
                      requestDelete(room.id);
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

                {/* P1 — Delete confirmation inline (UX C1) */}
                {pendingDeleteId === room.id && (
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full z-40
                               flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white
                               border border-[#B91C1C]/30 shadow-lg text-xs whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <span className="text-[#1C1C1E]">Supprimer {room.name || "cette pièce"} ?</span>
                    <button
                      type="button"
                      onClick={() => confirmDelete(room.id)}
                      className="px-2 py-1 rounded bg-[#B91C1C] text-white font-medium
                                 hover:bg-[#991B1B] transition-colors min-h-[44px] min-w-[44px]
                                 focus-visible:outline-none focus-visible:ring-2
                                 focus-visible:ring-[#B91C1C]"
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={cancelDelete}
                      className="px-2 py-1 rounded border border-[#D1D0CB] text-[#1C1C1E]
                                 hover:bg-[#F5F5F0] transition-colors min-h-[44px] min-w-[44px]
                                 focus-visible:outline-none focus-visible:ring-2
                                 focus-visible:ring-[#7D9B76]"
                    >
                      Non
                    </button>
                  </div>
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

                {/* Resize handles — TOUJOURS visibles (mobile n'a pas de hover) */}
                {(["nw", "ne", "sw", "se"] as HandlePosition[]).map((handle) => {
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
                          // Enlarge touch target to HANDLE_HIT_SIZE (44px)
                          padding: (HANDLE_HIT_SIZE - HANDLE_SIZE) / 2,
                          margin: -(HANDLE_HIT_SIZE - HANDLE_SIZE) / 2,
                          opacity: isSelected ? 1 : 0.6,
                          transition: "opacity 150ms ease",
                        }}
                        onMouseDown={(e) => handlePointerDown(e, room.id, "resize", handle)}
                        onTouchStart={(e) => handlePointerDown(e, room.id, "resize", handle)}
                        role="presentation"
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
        {/* P1 — Zoom controls (Moi) — positioned bottom-right of scrollable area */}
        <div className="absolute bottom-3 right-3 z-30 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
            disabled={zoomLevel >= 3}
            className="w-10 h-10 rounded-md bg-white/90 border border-[#D1D0CB]/60
                       text-[#1C1C1E] text-lg font-medium shadow-sm
                       hover:bg-[#F5F5F0] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#7D9B76] min-w-[44px] min-h-[44px]
                       disabled:opacity-30 disabled:cursor-not-allowed
                       flex items-center justify-center"
            aria-label="Zoomer"
          >
            +
          </button>
          {zoomLevel !== 1 && (
            <span className="text-[10px] text-center text-[#9B9A94] font-mono">
              {Math.round(zoomLevel * 100)}%
            </span>
          )}
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
            disabled={zoomLevel <= 0.5}
            className="w-10 h-10 rounded-md bg-white/90 border border-[#D1D0CB]/60
                       text-[#1C1C1E] text-lg font-medium shadow-sm
                       hover:bg-[#F5F5F0] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[#7D9B76] min-w-[44px] min-h-[44px]
                       disabled:opacity-30 disabled:cursor-not-allowed
                       flex items-center justify-center"
            aria-label="Dézoomer"
          >
            −
          </button>
        </div>
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
              backgroundColor: ROOM_COLORS.salon.replace("0.3)", "0.4)"),
              borderColor: ROOM_BORDER_COLORS.salon,
            }}
            aria-hidden="true"
          />
          Pièce ajoutée (projet)
        </span>
      </div>

      {/* Surface warning */}
      <p className="text-[11px] text-[#C68A2E] bg-[#FFF8EE] border border-[#C68A2E]/20 rounded px-2 py-1.5 leading-relaxed">
        {isCalibrated
          ? "Échelle calibrée. Les surfaces sont des estimations basées sur votre calibration. Pour des surfaces exactes, utilisez les mesures de votre géomètre."
          : "Les surfaces sont indicatives et dépendent du calibrage du plan. Utilisez le bouton « Calibrer » pour améliorer la précision."}
      </p>

      {/* Calibration modal */}
      {showCalibrationModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelCalibration();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Calibration de l'échelle"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-w-sm w-full sm:mx-4 space-y-4">
            <h4 className="text-base font-semibold text-[#1C1C1E]">
              Calibrer l&apos;échelle
            </h4>
            <p className="text-sm text-[#9B9A94] leading-relaxed">
              Quelle est la distance réelle entre les 2 points que vous avez tracés ?
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={calibrationInput}
                onChange={(e) => setCalibrationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmCalibration();
                  if (e.key === "Escape") cancelCalibration();
                }}
                autoFocus
                placeholder="Ex : 0.83"
                className="flex-1 text-sm text-[#1C1C1E] bg-white border border-[#D1D0CB]
                           rounded-lg px-3 py-2 min-h-[44px]
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[#7D9B76]"
                aria-label="Distance réelle en mètres"
              />
              <span className="text-sm text-[#9B9A94] font-medium">mètres</span>
            </div>
            <p className="text-[11px] text-[#9B9A94]">
              Astuce : une porte standard mesure 0,83 m de large, une baie vitrée entre 1,80 et 2,40 m.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={cancelCalibration}
                className="px-4 py-2 rounded-lg text-sm text-[#1C1C1E]/70
                           border border-[#D1D0CB]/60 hover:bg-[#F5F5F0]
                           transition-colors min-h-[44px]
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[#7D9B76]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmCalibration}
                disabled={!calibrationInput || parseFloat(calibrationInput) <= 0}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white
                           bg-[#7D9B76] hover:bg-[#4A7A42] transition-colors
                           min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[#7D9B76] focus-visible:ring-offset-1"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
