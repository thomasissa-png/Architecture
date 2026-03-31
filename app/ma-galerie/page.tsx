"use client";

/**
 * Ma galerie — Toutes les photos generees par l'utilisateur.
 * Filtres par style, type de piece, statut d'association.
 * Permet d'associer des photos non classees a un bien.
 */

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { useQueueStatus } from "@/lib/hooks/useQueueStatus";
import AuthModal from "@/components/AuthModal";
import Header from "@/components/Header";
import { STYLE_LABELS, translateRoomLabel } from "@/lib/constants";

/** Format relatif intelligent : "Aujourd'hui", "Hier", "Il y a 3 jours", puis "15 mars" au-dela de 7 jours */
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  // Reset to midnight for day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays >= 2 && diffDays <= 6) return `Il y a ${diffDays} jours`;

  // Beyond 7 days: "15 mars" or "15 mars 2025" if different year
  const day = date.getDate();
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  const month = months[date.getMonth()];
  if (date.getFullYear() !== now.getFullYear()) {
    return `${day} ${month} ${date.getFullYear()}`;
  }
  return `${day} ${month}`;
}

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

interface Property {
  id: string;
  address_raw: string | null;
  address_normalized: string | null;
  city: string | null;
}

export default function GaleriePage() {
  const { data: session, status: authStatus } = useSession();
  const { status: queueStatus, isPolling: isQueuePolling } = useQueueStatus();
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStyle, setFilterStyle] = useState<string>("");
  const [filterRoomType, setFilterRoomType] = useState<string>("");
  const [filterAssociated, setFilterAssociated] = useState<string>("");
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);
  const [associatingPhotoId, setAssociatingPhotoId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const detailModalRef = useRef<HTMLDivElement>(null);
  useScrollLock(!!selectedPhoto);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  // Focus trap + Escape + scroll lock for detail modal
  useEffect(() => {
    if (!selectedPhoto) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setSelectedPhoto(null); return; }
      if (e.key !== "Tab" || !detailModalRef.current) return;
      const focusable = detailModalRef.current.querySelectorAll<HTMLElement>(
        'button, input, a[href], [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    // Focus first element in modal
    setTimeout(() => {
      const firstFocusable = detailModalRef.current?.querySelector<HTMLElement>('button, input, a[href]');
      firstFocusable?.focus();
    }, 100);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhoto]);

  const fetchPhotos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStyle) params.set("styleId", filterStyle);
      if (filterRoomType) params.set("roomType", filterRoomType);
      if (filterAssociated) params.set("associated", filterAssociated);

      const res = await fetch(`/api/user/photos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch {
      console.error("Erreur chargement galerie");
    } finally {
      setIsLoading(false);
    }
  }, [filterStyle, filterRoomType, filterAssociated]);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties");
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (err) {
      console.error("Erreur chargement biens:", err);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPhotos();
      fetchProperties();
    }
  }, [session, fetchPhotos, fetchProperties]);

  // Auto-refresh gallery when a queued generation completes
  useEffect(() => {
    if (queueStatus && queueStatus.status === "done" && session?.user?.id) {
      fetchPhotos();
    }
  }, [queueStatus, session, fetchPhotos]);

  const handleAssociate = async (photoId: string, propertyId: string) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: [photoId] }),
      });
      if (res.ok) {
        setAssociatingPhotoId(null);
        fetchPhotos();
      } else {
        setToastMsg("Erreur lors de l'association. Réessayez.");
      }
    } catch {
      console.error("Erreur association");
      setToastMsg("Erreur lors de l'association. Réessayez.");
    }
  };

  const getPropertyLabel = (propertyId: string): string => {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return "Bien inconnu";
    return p.address_normalized || p.address_raw || p.city || "Bien sans adresse";
  };

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Header activePage="ma-galerie" />
        <main className="pt-24 pb-16 px-5 sm:px-8 max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="h-7 w-40 bg-foreground/5 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-24 bg-foreground/5 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-foreground/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">Ma galerie</h1>
          <p className="text-sm text-muted font-light">
            Connectez-vous pour voir votre galerie de photos générées.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="text-sm bg-foreground text-background px-6 py-2.5 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          >
            Se connecter
          </button>
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            callbackUrl="/ma-galerie"
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header activePage="ma-galerie" />
        <main className="pt-24 pb-16 px-5 sm:px-8 max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="h-7 w-40 bg-foreground/5 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-24 bg-foreground/5 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-foreground/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header activePage="ma-galerie" />

      <main className="pt-24 pb-16 px-5 sm:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Ma galerie</h1>
            <p className="text-sm text-muted font-light mt-1">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} générée{photos.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStyle}
              onChange={(e) => { setFilterStyle(e.target.value); setIsLoading(true); }}
              className="text-xs font-light bg-foreground/5 border-0 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              data-testid="filter-style"
            >
              <option value="">Tous les styles</option>
              {Object.entries(STYLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={filterRoomType}
              onChange={(e) => { setFilterRoomType(e.target.value); setIsLoading(true); }}
              className="text-xs font-light bg-foreground/5 border-0 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              data-testid="filter-room-type"
            >
              <option value="">Toutes les pièces</option>
              <option value="living_room">Salon</option>
              <option value="bedroom">Chambre</option>
              <option value="bedroom_adults">Chambre adulte</option>
              <option value="bedroom_children">Chambre enfant</option>
              <option value="kitchen">Cuisine</option>
              <option value="bathroom">Salle de bain</option>
              <option value="office">Bureau</option>
              <option value="dining_room">Salle à manger</option>
              <option value="entryway">Entrée</option>
              <option value="wc">WC</option>
              <option value="laundry">Buanderie</option>
              <option value="cellar">Cave</option>
            </select>

            <select
              value={filterAssociated}
              onChange={(e) => { setFilterAssociated(e.target.value); setIsLoading(true); }}
              className="text-xs font-light bg-foreground/5 border-0 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
            >
              <option value="">Toutes</option>
              <option value="true">Associées</option>
              <option value="false">Non classées</option>
            </select>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted font-light text-sm">Aucune photo pour le moment.</p>
            <a
              href="/#outil"
              className="inline-block mt-4 text-xs bg-foreground text-background px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors"
            >
              Générer ma première photo
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" data-testid="galerie-grid">
            {/* Skeleton card for queued generation */}
            {isQueuePolling && queueStatus && queueStatus.status !== "done" && queueStatus.status !== "failed" && (
              <div className="flex flex-col">
                <div className="relative bg-foreground/[0.02] rounded-2xl overflow-hidden border border-sage/20 animate-pulse">
                  <div className="w-full aspect-[4/3] bg-sage/5 flex flex-col items-center justify-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-sage rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <p className="text-xs text-sage font-medium">
                      {queueStatus.status === "processing" ? "Génération en cours…" : "En file d'attente…"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {photos.map((photo) => (
              <div key={photo.id} className="flex flex-col">
              <div
                className="group relative bg-foreground/[0.02] rounded-2xl overflow-hidden border border-foreground/5 hover:border-sage/30 transition-all cursor-pointer"
                data-testid="photo-card"
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* Thumbnail */}
                {photo.output_image_key ? (
                  <img
                    src={`/api/logs/image?path=${encodeURIComponent(photo.output_image_key)}`}
                    alt={photo.style_id || "Photo générée"}
                    className="w-full aspect-[4/3] object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="w-full aspect-[4/3] bg-foreground/5 items-center justify-center"
                  style={{ display: photo.output_image_key ? "none" : "flex" }}
                >
                  <span className="text-xs text-muted font-light">Image non disponible</span>
                </div>

                {/* Overlay info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/90">
                      {STYLE_LABELS[photo.style_id || ""] || photo.style_id || ""}
                    </span>
                    {photo.property_id ? (
                      <span className="text-xs bg-sage/80 text-white px-2 py-0.5 rounded-full">
                        {getPropertyLabel(photo.property_id).substring(0, 20)}
                      </span>
                    ) : (
                      <span className="text-xs bg-foreground/40 text-white px-2 py-0.5 rounded-full">
                        Non classée
                      </span>
                    )}
                  </div>
                </div>

                {/* Association action — only for unassociated photos */}
                {!photo.property_id && properties.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssociatingPhotoId(associatingPhotoId === photo.id ? null : photo.id);
                    }}
                    className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-background/90 text-foreground text-xs px-2 py-1 rounded-lg font-medium hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                  >
                    Associer
                  </button>
                )}

                {/* Association dropdown */}
                {associatingPhotoId === photo.id && (
                  <div
                    className="absolute top-10 right-0 sm:right-2 bg-background border border-foreground/10 rounded-xl shadow-lg p-2 z-10 min-w-[200px] max-w-[calc(100vw-2rem)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-xs text-muted font-light px-2 pb-1 border-b border-foreground/5">Associer à un bien :</p>
                    {properties.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleAssociate(photo.id, p.id)}
                        className="w-full text-left text-xs font-light px-2 py-1.5 min-h-[44px] flex items-center hover:bg-foreground/5 rounded-lg transition-colors"
                      >
                        {p.address_normalized || p.address_raw || p.city || "Bien sans adresse"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-foreground/50 font-light mt-1.5 px-1">{formatRelativeDate(photo.created_at)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Photo detail modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              ref={detailModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              className="bg-background rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                  {STYLE_LABELS[selectedPhoto.style_id || ""] || selectedPhoto.style_id || "Photo"}
                </h2>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-muted hover:text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded-full w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Fermer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Before / After */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {selectedPhoto.input_image_key && (
                  <div>
                    <p className="text-xs text-muted font-light mb-1">Avant</p>
                    <img
                      src={`/api/logs/image?path=${encodeURIComponent(selectedPhoto.input_image_key)}`}
                      alt="Avant"
                      className="w-full rounded-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                {selectedPhoto.output_image_key && (
                  <div>
                    <p className="text-xs text-sage font-medium mb-1">Après</p>
                    <img
                      src={`/api/logs/image?path=${encodeURIComponent(selectedPhoto.output_image_key)}`}
                      alt="Après"
                      className="w-full rounded-xl"
                      onError={(e) => {
                        e.currentTarget.src = "";
                        e.currentTarget.alt = "Image indisponible";
                        e.currentTarget.className = "w-full rounded-xl bg-foreground/5 aspect-[4/3] flex items-center justify-center text-xs text-muted font-light";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap gap-2 text-xs font-light text-muted">
                {selectedPhoto.room_type && (
                  <span className="bg-foreground/5 px-2 py-1 rounded-lg">{translateRoomLabel(selectedPhoto.room_type)}</span>
                )}
                {selectedPhoto.is_outdoor && (
                  <span className="bg-foreground/5 px-2 py-1 rounded-lg">Extérieur</span>
                )}
                <span className="bg-foreground/5 px-2 py-1 rounded-lg">
                  {new Date(selectedPhoto.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>

              {/* Association */}
              {selectedPhoto.property_id ? (
                <p className="mt-4 text-xs text-sage font-light">
                  Associée à : {getPropertyLabel(selectedPhoto.property_id)}
                </p>
              ) : properties.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs text-muted font-light mb-2">Associer à un bien :</p>
                  <div className="flex flex-wrap gap-2">
                    {properties.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          handleAssociate(selectedPhoto.id, p.id);
                          setSelectedPhoto(null);
                        }}
                        className="text-xs font-light bg-foreground/5 px-3 py-1.5 rounded-xl hover:bg-sage/10 hover:text-sage transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                      >
                        {p.address_normalized || p.address_raw || "Bien sans adresse"}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
        {/* Inline toast */}
        {toastMsg && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg animate-fade-in">
            {toastMsg}
          </div>
        )}
      </main>
    </div>
  );
}
