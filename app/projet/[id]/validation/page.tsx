"use client";

/**
 * Page validation et association photos/pièces (Étape 3).
 *
 * Rendu : Client Component — tableau éditable, upload photos.
 *
 * Charge les pièces du projet. Thomas peut renommer, changer le type,
 * modifier la surface, associer une photo à chaque pièce, et ajouter
 * des pièces manuellement. Les modifications sont sauvegardées à la
 * validation (PUT /api/pro/projects/[id]/validate).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProStepper from "@/components/marchand/ProStepper";
import { getCompletedSteps } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────────────────

interface RoomEntry {
  id: string;
  name: string;
  room_type: string;
  surface_m2: number | null;
  photoUrl: string | null;
  photoFile: File | null;
  isNew?: boolean;
}

const ROOM_TYPE_OPTIONS = [
  { value: "salon", label: "Salon" },
  { value: "cuisine", label: "Cuisine" },
  { value: "chambre", label: "Chambre" },
  { value: "sdb", label: "Salle de bain" },
  { value: "wc", label: "WC" },
  { value: "bureau", label: "Bureau" },
  { value: "couloir", label: "Couloir" },
  { value: "cave", label: "Cave" },
  { value: "autre", label: "Autre" },
] as const;

// ─── Component ──────────────────────────────────────────────────────

export default function ValidationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [rooms, setRooms] = useState<RoomEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [projectStatus, setProjectStatus] = useState<string>("extraction_done");

  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [isDirty, setIsDirty] = useState(false);

  // ─── Load rooms from project ─────────────────────────────────────

  useEffect(() => {
    async function loadRooms() {
      try {
        const response = await fetch(`/api/pro/projects/${projectId}/status`);
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setError(data?.message || `Impossible de charger les données du projet (erreur ${response.status}).`);
          setIsLoading(false);
          return;
        }
        const data = await response.json();
        if (data.project?.status) {
          setProjectStatus(data.project.status);
        }
        const loadedRooms: RoomEntry[] = (data.rooms || []).map(
          (r: { id: string; name: string; room_type: string; surface_m2?: number | null; photo_path?: string | null }) => ({
            id: r.id,
            name: r.name,
            room_type: r.room_type || "autre",
            surface_m2: r.surface_m2 ?? null,
            photoUrl: r.photo_path
              ? `/api/logs/image?path=${encodeURIComponent(r.photo_path)}`
              : null,
            photoFile: null,
          })
        );
        setRooms(loadedRooms);
      } catch {
        setError("Erreur de connexion.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRooms();
  }, [projectId]);

  // ─── Dirty tracking (no auto-save — API batch PATCH not available) ─

  // ─── Room editing ────────────────────────────────────────────────

  const updateRoom = useCallback((roomId: string, field: keyof RoomEntry, value: string | number | null) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, [field]: value } : r))
    );
    setIsDirty(true);
  }, []);

  const deleteRoom = useCallback((roomId: string, roomName: string) => {
    const confirmed = window.confirm(
      `Supprimer "${roomName || "cette pièce"}" ? Cette action est irréversible.`
    );
    if (!confirmed) return;
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setIsDirty(true);
  }, []);

  const addRoom = useCallback(() => {
    const newRoom: RoomEntry = {
      id: `new-${Date.now()}`,
      name: "",
      room_type: "autre",
      surface_m2: null,
      photoUrl: null,
      photoFile: null,
      isNew: true,
    };
    setRooms((prev) => [...prev, newRoom]);
    setIsDirty(true);
  }, []);

  // ─── Photo upload per room ───────────────────────────────────────

  const handlePhotoSelect = useCallback((roomId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, photoUrl: url, photoFile: file } : r
      )
    );
    setIsDirty(true);
  }, []);

  // ─── Validate and continue ───────────────────────────────────────

  // ─── Upload a single room photo to the server ────────────────────
  const uploadRoomPhoto = useCallback(
    async (roomId: string, file: File): Promise<boolean> => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(
        `/api/pro/projects/${projectId}/rooms/${roomId}/photo`,
        { method: "POST", body: formData }
      );
      return res.ok;
    },
    [projectId]
  );

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    setUploadProgress(null);
    setValidationErrors([]);
    setError(null);

    try {
      // ── Phase 1 : upload photos des pièces EXISTANTES (avant validate) ─
      const existingWithPhoto = rooms.filter(
        (r) => r.photoFile && !r.id.startsWith("new-")
      );
      const newWithPhoto = rooms.filter(
        (r) => r.photoFile && r.id.startsWith("new-")
      );
      const totalUploads = existingWithPhoto.length + newWithPhoto.length;
      let uploadedCount = 0;

      for (const room of existingWithPhoto) {
        uploadedCount++;
        setUploadProgress(
          `Upload photo ${uploadedCount}/${totalUploads}…`
        );
        const ok = await uploadRoomPhoto(room.id, room.photoFile!);
        if (!ok) {
          setError(
            `Échec de l'upload de la photo pour « ${room.name || "pièce"} ». Réessayez.`
          );
          return;
        }
      }

      // ── Phase 2 : appel PUT /validate (crée les nouvelles pièces) ──
      setUploadProgress(
        totalUploads > 0 ? "Validation en cours…" : null
      );

      const response = await fetch(`/api/pro/projects/${projectId}/validate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: rooms.map((r) => ({
            id: r.id,
            name: r.name,
            room_type: r.room_type,
            surface_m2: r.surface_m2,
            isNew: r.isNew || false,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.missing) {
          setValidationErrors(data.missing);
        } else {
          setError(data.message || "Erreur lors de la validation.");
        }
        return;
      }

      // ── Phase 3 : upload photos des pièces NOUVELLES (après validate) ─
      // Le validate retourne un mapping old_id → new_id pour les pièces créées
      const idMapping: Record<string, string> = data.room_id_mapping || {};

      for (const room of newWithPhoto) {
        const realId = idMapping[room.id];
        if (!realId) {
          console.warn(
            `[validation] Pas de mapping d'ID pour la pièce « ${room.name} » (${room.id}) — photo non uploadée`
          );
          continue;
        }
        uploadedCount++;
        setUploadProgress(
          `Upload photo ${uploadedCount}/${totalUploads}…`
        );
        const ok = await uploadRoomPhoto(realId, room.photoFile!);
        if (!ok) {
          // Non bloquant : la validation est déjà faite, on log l'erreur
          console.error(
            `[validation] Échec upload photo pour nouvelle pièce « ${room.name} » (${realId})`
          );
        }
      }

      // Success — navigate to qualification (step 4)
      setIsDirty(false);
      router.push(`/projet/${projectId}/qualification`);
    } catch {
      setError("Erreur de connexion. Vérifiez votre réseau.");
    } finally {
      setIsValidating(false);
      setUploadProgress(null);
    }
  }, [projectId, router, rooms, uploadRoomPhoto]);

  // ─── Draft save ─────────────────────────────────────────────────

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const handleSaveDraft = useCallback(async () => {
    if (rooms.length === 0) return;
    setIsSavingDraft(true);
    setError(null);

    try {
      const response = await fetch(`/api/pro/projects/${projectId}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: rooms.map((r) => ({
            id: r.id,
            name: r.name,
            room_type: r.room_type,
            surface_m2: r.surface_m2,
            isNew: r.isNew || false,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.message || "Erreur lors de la sauvegarde du brouillon.");
        return;
      }

      const data = await response.json();

      // Update room IDs for newly created rooms
      if (data.room_id_mapping) {
        setRooms((prev) =>
          prev.map((r) => {
            const newId = data.room_id_mapping[r.id];
            return newId ? { ...r, id: newId, isNew: false } : r;
          })
        );
      }

      setIsDirty(false);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch {
      setError("Erreur de connexion lors de la sauvegarde.");
    } finally {
      setIsSavingDraft(false);
    }
  }, [projectId, rooms]);

  // ─── Stats ───────────────────────────────────────────────────────

  const roomsWithPhoto = rooms.filter((r) => r.photoUrl).length;
  const totalRooms = rooms.length;

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Header variant="internal" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <ProStepper
            currentStep={3}
            completedSteps={getCompletedSteps(projectStatus)}
            projectId={projectId}
          />
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
            Vérifiez les pièces de votre bien
          </h1>
          <p className="text-sm text-[#9B9A94] mt-1">
            Corrigez les noms, types et surfaces si nécessaire. Associez une photo à chaque pièce.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-sm text-[#9B9A94]">
              <svg
                className="animate-spin w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Chargement des pièces…
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="p-3 rounded-lg bg-[#FEF2F2] text-sm text-[#B91C1C] mb-4"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div
            className="p-4 rounded-lg bg-[#FFFBEB] border border-[#D97706]/20 mb-4"
            role="alert"
          >
            <p className="text-sm font-medium text-[#B45309] mb-2">
              Informations manquantes :
            </p>
            <ul className="list-disc list-inside text-sm text-[#B45309]/80 space-y-1">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Room list */}
        {!isLoading && (
          <div className="space-y-4">
            {/* Counter */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#9B9A94]">
                {roomsWithPhoto}/{totalRooms} pièce{totalRooms > 1 ? "s" : ""} avec photo
              </p>
              {isDirty && (
                <span className="text-xs text-[#D97706]">
                  Modifications non sauvegardées
                </span>
              )}
            </div>

            {/* Room entries */}
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-4 rounded-lg bg-white border border-[#D1D0CB]/40
                           shadow-[0_1px_3px_rgba(28,28,30,0.08),0_1px_2px_rgba(28,28,30,0.04)]"
              >
                <div className="flex gap-3">
                  {/* Photo section */}
                  <div className="flex-shrink-0 w-20 h-20 sm:w-[100px] sm:h-[100px]">
                    {room.photoUrl ? (
                      <div className="relative w-full h-full rounded overflow-hidden">
                        <img
                          src={room.photoUrl}
                          alt={`Photo de ${room.name || "pièce"}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => {
                            if (room.photoUrl?.startsWith("blob:")) {
                              URL.revokeObjectURL(room.photoUrl);
                            }
                            setRooms((prev) =>
                              prev.map((r) =>
                                r.id === room.id
                                  ? { ...r, photoUrl: null, photoFile: null }
                                  : r
                              )
                            );
                          }}
                          className="absolute top-1 right-1 w-8 h-8 min-w-[44px] min-h-[44px] rounded-full bg-black/50
                                     flex items-center justify-center text-white
                                     hover:bg-black/70 transition-colors"
                          aria-label="Supprimer la photo"
                        >
                          <svg
                            width="10"
                            height="10"
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
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const ref = fileInputRefs.current.get(room.id);
                          ref?.click();
                        }}
                        className="w-full h-full rounded border-2 border-dashed border-[#D1D0CB]
                                   flex flex-col items-center justify-center gap-1
                                   text-[#9B9A94] hover:border-[#7D9B76] hover:text-[#7D9B76]
                                   transition-colors cursor-pointer
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
                        aria-label={`Ajouter une photo pour ${room.name || "cette pièce"}`}
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
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        <span className="text-[10px]">Photo</span>
                      </button>
                    )}
                    <input
                      ref={(el) => {
                        if (el) fileInputRefs.current.set(room.id, el);
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoSelect(room.id, file);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  {/* Fields */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Name */}
                    <input
                      type="text"
                      value={room.name}
                      onChange={(e) => updateRoom(room.id, "name", e.target.value)}
                      placeholder="Nom de la pièce"
                      className="w-full px-2.5 py-1.5 rounded border border-[#D1D0CB] bg-transparent
                                 text-sm font-medium text-[#1C1C1E] placeholder-[#9B9A94]
                                 focus:outline-none focus:ring-1 focus:ring-[#7D9B76] focus:border-transparent"
                      aria-label={`Nom de la pièce ${room.name || ""}`}
                    />

                    <div className="flex gap-2">
                      {/* Type */}
                      <select
                        value={room.room_type}
                        onChange={(e) => updateRoom(room.id, "room_type", e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded border border-[#D1D0CB] bg-white
                                   text-xs text-[#1C1C1E]
                                   focus:outline-none focus:ring-1 focus:ring-[#7D9B76]"
                        aria-label={`Type de ${room.name || "pièce"}`}
                      >
                        {ROOM_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {/* Surface */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={room.surface_m2 ?? ""}
                          onChange={(e) =>
                            updateRoom(
                              room.id,
                              "surface_m2",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          placeholder="m²"
                          min={1}
                          max={500}
                          className="w-16 px-2 py-1.5 rounded border border-[#D1D0CB] bg-white
                                     text-xs text-[#1C1C1E] text-right
                                     focus:outline-none focus:ring-1 focus:ring-[#7D9B76]"
                          aria-label={`Surface de ${room.name || "pièce"} en m²`}
                        />
                        <span className="text-xs text-[#9B9A94]">m²</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteRoom(room.id, room.name)}
                    className="flex-shrink-0 self-start p-1.5 rounded-md text-[#9B9A94]
                               hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]"
                    aria-label={`Supprimer ${room.name || "cette pièce"}`}
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
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>

                {/* Warning if no photo */}
                {!room.photoUrl && (
                  <p className="mt-2 text-xs text-[#D97706] flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Pas de photo — cette pièce ne sera pas générée
                  </p>
                )}

                {/* Warning: local photo not yet persisted */}
                {room.photoFile && (
                  <p className="mt-2 text-xs text-[#9B9A94] flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Photo enregistrée lors de la validation
                  </p>
                )}
              </div>
            ))}

            {/* Empty state */}
            {rooms.length === 0 && !isLoading && (
              <div className="text-center py-12 border-2 border-dashed border-[#D1D0CB] rounded-lg">
                <p className="text-sm text-[#9B9A94] mb-3">
                  Aucune pièce ajoutée
                </p>
                <button
                  onClick={addRoom}
                  className="text-sm font-medium text-[#7D9B76] hover:text-[#4A7A42]
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] rounded"
                >
                  + Ajouter votre première pièce
                </button>
              </div>
            )}

            {/* Add room button */}
            {rooms.length > 0 && (
              <button
                onClick={addRoom}
                className="w-full py-2.5 rounded-lg border border-dashed border-[#D1D0CB]
                           text-sm font-medium text-[#9B9A94] hover:text-[#7D9B76] hover:border-[#7D9B76]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
              >
                + Ajouter une pièce manuellement
              </button>
            )}

            {/* Draft saved feedback */}
            {draftSaved && (
              <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#7D9B76]/20 text-sm text-[#4A7A42] flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Brouillon sauvegardé
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-[#D1D0CB]/40">
              <button
                onClick={() => router.back()}
                className="py-2.5 px-4 rounded-lg border border-[#D1D0CB] bg-white
                           text-sm font-medium text-[#1C1C1E] hover:bg-[#F5F5F0]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
              >
                Retour
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft || rooms.length === 0}
                className="py-2.5 px-4 rounded-lg border border-[#7D9B76] bg-white
                           text-sm font-medium text-[#7D9B76] hover:bg-[#F0FDF4]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
              >
                {isSavingDraft ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sauvegarde…
                  </span>
                ) : "Sauvegarder le brouillon"}
              </button>
              <button
                onClick={handleValidate}
                disabled={isValidating || rooms.length === 0}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#7D9B76] text-white
                           text-sm font-medium hover:bg-[#4A7A42]
                           disabled:bg-[#D1D0CB] disabled:cursor-not-allowed
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76] focus-visible:ring-offset-2"
              >
                {isValidating ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {uploadProgress || "Validation…"}
                  </span>
                ) : (
                  "Valider et continuer"
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
