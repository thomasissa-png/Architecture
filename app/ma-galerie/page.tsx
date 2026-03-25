"use client";

/**
 * Ma galerie — Toutes les photos generees par l'utilisateur.
 * Filtres par style, type de piece, statut d'association.
 * Permet d'associer des photos non classees a un bien.
 */

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import AuthButton from "@/components/AuthButton";

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

const STYLE_LABELS: Record<string, string> = {
  scandinavian: "Scandinave",
  contemporary: "Contemporain",
  industrial: "Industriel",
  japandi: "Japandi",
  art_deco: "Art Deco",
  mid_century: "Mid-Century",
  bohemian: "Boheme",
  mediterranean: "Mediterraneen",
  cozy: "Cosy",
  wabi_sabi: "Wabi-Sabi",
  maximalist: "Maximaliste",
  haussmannian: "Haussmannien",
  custom: "Personnalise",
};

export default function GaleriePage() {
  const { data: session, status: authStatus } = useSession();
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStyle, setFilterStyle] = useState<string>("");
  const [filterAssociated, setFilterAssociated] = useState<string>("");
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);
  const [associatingPhotoId, setAssociatingPhotoId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      window.location.href = "/";
    }
  }, [authStatus]);

  const fetchPhotos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStyle) params.set("styleId", filterStyle);
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
  }, [filterStyle, filterAssociated]);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties");
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPhotos();
      fetchProperties();
    }
  }, [session, fetchPhotos, fetchProperties]);

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
      }
    } catch {
      console.error("Erreur association");
    }
  };

  const getPropertyLabel = (propertyId: string): string => {
    const p = properties.find((p) => p.id === propertyId);
    if (!p) return "Bien inconnu";
    return p.address_normalized || p.address_raw || p.city || "Bien sans adresse";
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted font-light text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-foreground tracking-tighter">
            Versiroom
          </a>
          <nav className="flex items-center gap-2 sm:gap-6">
            <a href="/mes-biens" className="text-xs text-muted font-light hover:text-foreground transition-colors">
              Mes biens
            </a>
            <a href="/mes-dossiers" className="text-xs text-muted font-light hover:text-foreground transition-colors">
              Mes dossiers
            </a>
            <a href="/ma-galerie" className="text-xs text-sage font-medium">
              Ma galerie
            </a>
            <AuthButton />
          </nav>
        </div>
      </header>

      <main className="pt-24 pb-16 px-5 sm:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Ma galerie</h1>
            <p className="text-sm text-muted font-light mt-1">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} generee{photos.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStyle}
              onChange={(e) => { setFilterStyle(e.target.value); setIsLoading(true); }}
              className="text-xs font-light bg-foreground/5 border-0 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
            >
              <option value="">Tous les styles</option>
              {Object.entries(STYLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={filterAssociated}
              onChange={(e) => { setFilterAssociated(e.target.value); setIsLoading(true); }}
              className="text-xs font-light bg-foreground/5 border-0 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
            >
              <option value="">Toutes</option>
              <option value="true">Associees</option>
              <option value="false">Non classees</option>
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
              Generer ma premiere photo
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative bg-foreground/[0.02] rounded-2xl overflow-hidden border border-foreground/5 hover:border-sage/30 transition-all cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                {/* Thumbnail */}
                {photo.output_image_key ? (
                  <img
                    src={`/api/logs/image?path=${encodeURIComponent(photo.output_image_key)}`}
                    alt={photo.style_id || "Photo generee"}
                    className="w-full aspect-[4/3] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] bg-foreground/5 flex items-center justify-center">
                    <span className="text-xs text-muted font-light">Image non disponible</span>
                  </div>
                )}

                {/* Overlay info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-white/90">
                      {STYLE_LABELS[photo.style_id || ""] || photo.style_id || ""}
                    </span>
                    {photo.property_id ? (
                      <span className="text-[9px] bg-sage/80 text-white px-2 py-0.5 rounded-full">
                        {getPropertyLabel(photo.property_id).substring(0, 20)}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-foreground/40 text-white px-2 py-0.5 rounded-full">
                        Non classee
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
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-foreground text-[10px] px-2 py-1 rounded-lg font-medium hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                  >
                    Associer
                  </button>
                )}

                {/* Association dropdown */}
                {associatingPhotoId === photo.id && (
                  <div
                    className="absolute top-10 right-2 bg-white border border-foreground/10 rounded-xl shadow-lg p-2 z-10 min-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[10px] text-muted font-light px-2 pb-1 border-b border-foreground/5">Associer a un bien :</p>
                    {properties.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleAssociate(photo.id, p.id)}
                        className="w-full text-left text-xs font-light px-2 py-1.5 hover:bg-foreground/5 rounded-lg transition-colors"
                      >
                        {p.address_normalized || p.address_raw || p.city || "Bien sans adresse"}
                      </button>
                    ))}
                  </div>
                )}
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
              className="bg-background rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {STYLE_LABELS[selectedPhoto.style_id || ""] || selectedPhoto.style_id || "Photo"}
                </h2>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-muted hover:text-foreground text-lg font-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded-full w-8 h-8 flex items-center justify-center"
                >
                  x
                </button>
              </div>

              {/* Before / After */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {selectedPhoto.input_image_key && (
                  <div>
                    <p className="text-[10px] text-muted font-light mb-1">Avant</p>
                    <img
                      src={`/api/logs/image?path=${encodeURIComponent(selectedPhoto.input_image_key)}`}
                      alt="Avant"
                      className="w-full rounded-xl"
                    />
                  </div>
                )}
                {selectedPhoto.output_image_key && (
                  <div>
                    <p className="text-[10px] text-sage font-medium mb-1">Apres</p>
                    <img
                      src={`/api/logs/image?path=${encodeURIComponent(selectedPhoto.output_image_key)}`}
                      alt="Apres"
                      className="w-full rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap gap-2 text-xs font-light text-muted">
                {selectedPhoto.room_type && (
                  <span className="bg-foreground/5 px-2 py-1 rounded-lg">{selectedPhoto.room_type}</span>
                )}
                {selectedPhoto.is_outdoor && (
                  <span className="bg-foreground/5 px-2 py-1 rounded-lg">Exterieur</span>
                )}
                <span className="bg-foreground/5 px-2 py-1 rounded-lg">
                  {new Date(selectedPhoto.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>

              {/* Association */}
              {selectedPhoto.property_id ? (
                <p className="mt-4 text-xs text-sage font-light">
                  Associee a : {getPropertyLabel(selectedPhoto.property_id)}
                </p>
              ) : properties.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs text-muted font-light mb-2">Associer a un bien :</p>
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
      </main>
    </div>
  );
}
