"use client";

/**
 * Fiche d'un bien — detail, photos associees, creation de dossier.
 */

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import AuthButton from "@/components/AuthButton";

interface Property {
  id: string;
  address_raw: string | null;
  address_normalized: string | null;
  city: string | null;
  postal_code: string | null;
  property_type: string | null;
  surface_m2: number | null;
  room_count: number | null;
  sale_price: number | null;
  dvf_median_price_m2: number | null;
  dvf_period: string | null;
  map_image_key: string | null;
  description_generated: string | null;
  description_final: string | null;
  photo_count?: number;
  dossier_count?: number;
  created_at: string;
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

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  loft: "Loft",
  studio: "Studio",
  duplex: "Duplex",
  bureau: "Bureau commercial",
};

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

export default function PropertyDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [unassociatedPhotos, setUnassociatedPhotos] = useState<UserPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Description editing
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState("");

  // Association modal
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [selectedForAssoc, setSelectedForAssoc] = useState<Set<string>>(new Set());

  // Dossier creation
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [selectedForDossier, setSelectedForDossier] = useState<Set<string>>(new Set());
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);
  const [isCreatingDossier, setIsCreatingDossier] = useState(false);
  const [dossierResult, setDossierResult] = useState<{ uuid: string; pdfUrl: string } | null>(null);

  // Inline toast (replaces alert())
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      window.location.href = "/";
    }
  }, [authStatus]);

  const fetchProperty = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`);
      if (!res.ok) {
        setError("Bien introuvable.");
        return;
      }
      const data = await res.json();
      setProperty(data.property);
    } catch {
      setError("Erreur de chargement.");
    }
  }, [propertyId]);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch {
      // ignore
    }
  }, [propertyId]);

  const fetchUnassociated = useCallback(async () => {
    try {
      const res = await fetch("/api/user/photos?associated=false");
      if (res.ok) {
        const data = await res.json();
        setUnassociatedPhotos(data.photos || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      Promise.all([fetchProperty(), fetchPhotos()]).then(() => setIsLoading(false));
    }
  }, [session, fetchProperty, fetchPhotos]);

  const handleSaveDescription = async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptionFinal: editDesc }),
      });
      if (res.ok) {
        const data = await res.json();
        setProperty(data.property);
        setIsEditingDesc(false);
      }
    } catch {
      // ignore
    }
  };

  const handleAssociatePhotos = async () => {
    if (selectedForAssoc.size === 0) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: Array.from(selectedForAssoc) }),
      });
      if (res.ok) {
        setShowAssociateModal(false);
        setSelectedForAssoc(new Set());
        fetchPhotos();
      }
    } catch {
      // ignore
    }
  };

  const handleDissociate = async (photoId: string) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: [photoId] }),
      });
      if (res.ok) {
        fetchPhotos();
      }
    } catch {
      // ignore
    }
  };

  const handleCreateDossier = async () => {
    if (selectedForDossier.size === 0) return;
    setIsCreatingDossier(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}/dossier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedPhotoIds: Array.from(selectedForDossier),
          coverPhotoId,
          photoOrder: Array.from(selectedForDossier),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDossierResult(data.dossier);
      } else {
        const data = await res.json();
        setToastMsg(data.error || "Erreur lors de la cr\u00e9ation du dossier.");
      }
    } catch {
      setToastMsg("Erreur r\u00e9seau.");
    } finally {
      setIsCreatingDossier(false);
    }
  };

  const toggleDossierPhoto = (photoId: string) => {
    setSelectedForDossier((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
        if (coverPhotoId === photoId) setCoverPhotoId(null);
      } else {
        next.add(photoId);
        if (!coverPhotoId) setCoverPhotoId(photoId);
      }
      return next;
    });
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted font-light text-sm">Chargement...</div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted font-light text-sm">{error || "Bien introuvable."}</p>
          <a href="/mes-biens" className="inline-block mt-4 text-xs text-sage font-medium hover:underline">
            Retour \u00e0 mes biens
          </a>
        </div>
      </div>
    );
  }

  const description = property.description_final || property.description_generated;
  const address = property.address_normalized || property.address_raw || "Bien sans adresse";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-foreground tracking-tighter">
            Versiroom
          </a>
          <nav className="flex items-center gap-2 sm:gap-6">
            <a href="/mes-biens" className="text-xs text-sage font-medium">
              Mes biens
            </a>
            <a href="/ma-galerie" className="text-xs text-muted font-light hover:text-foreground transition-colors">
              Ma galerie
            </a>
            <a href="/mes-dossiers" className="text-xs text-muted font-light hover:text-foreground transition-colors">
              Mes dossiers
            </a>
            <AuthButton />
          </nav>
        </div>
      </header>

      <main className="pt-24 pb-16 px-5 sm:px-8 max-w-6xl mx-auto" data-testid="bien-detail">
        {/* Breadcrumb */}
        <div className="mb-6">
          <a href="/mes-biens" className="text-xs text-muted font-light hover:text-foreground transition-colors">
            Mes biens
          </a>
          <span className="text-xs text-muted/50 mx-2">/</span>
          <span className="text-xs text-foreground font-light">{address.substring(0, 40)}</span>
        </div>

        {/* Header section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
              {address}
            </h1>

            {/* Property info pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {property.property_type && (
                <span className="text-xs bg-foreground/5 text-foreground px-3 py-1 rounded-xl font-light">
                  {TYPE_LABELS[property.property_type] || property.property_type}
                </span>
              )}
              {property.surface_m2 && (
                <span className="text-xs bg-foreground/5 text-foreground px-3 py-1 rounded-xl font-light">
                  {property.surface_m2} m&#178;
                </span>
              )}
              {property.room_count && (
                <span className="text-xs bg-foreground/5 text-foreground px-3 py-1 rounded-xl font-light">
                  {property.room_count} pi&#232;ces
                </span>
              )}
              {property.dvf_median_price_m2 && (
                <span className="text-xs bg-sage/10 text-sage px-3 py-1 rounded-xl font-light">
                  {property.dvf_median_price_m2.toLocaleString("fr-FR")} &#8364;/m&#178;
                </span>
              )}
              {property.sale_price && (
                <span className="text-xs bg-foreground text-background px-3 py-1 rounded-xl font-medium">
                  {property.sale_price.toLocaleString("fr-FR")} &#8364;
                </span>
              )}
            </div>

            {/* Description */}
            {isEditingDesc ? (
              <div className="mb-4">
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveDescription}
                    className="text-xs bg-sage text-white px-3 py-1.5 rounded-full font-medium hover:bg-sage/85 transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setIsEditingDesc(false)}
                    className="text-xs text-muted font-light px-3 py-1.5 rounded-full hover:text-foreground transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : description ? (
              <div className="mb-4">
                <p className="text-sm text-muted font-light leading-relaxed">{description}</p>
                <button
                  onClick={() => {
                    setEditDesc(description);
                    setIsEditingDesc(true);
                  }}
                  className="text-[10px] text-sage font-light mt-1 hover:underline"
                >
                  Modifier la description
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted/50 font-light mb-4">
                Description en cours d&apos;enrichissement...
              </p>
            )}
          </div>

          {/* Map */}
          <div>
            {property.map_image_key ? (
              <img
                src={`/api/logs/image?path=${encodeURIComponent(property.map_image_key)}`}
                alt="Carte du quartier"
                className="w-full rounded-2xl border border-foreground/5"
              />
            ) : (
              <div className="w-full aspect-video bg-foreground/[0.02] rounded-2xl border border-foreground/5 flex items-center justify-center">
                <span className="text-xs text-muted font-light">Carte en chargement...</span>
              </div>
            )}
          </div>
        </div>

        {/* Photos section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Photos du bien
              <span className="text-muted font-light text-sm ml-2">({photos.length})</span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetchUnassociated();
                  setShowAssociateModal(true);
                }}
                className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-full font-light hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                + Associer des photos
              </button>
              <a
                href={`/?propertyId=${propertyId}`}
                className="text-xs bg-sage text-white px-3 py-1.5 rounded-full font-medium hover:bg-sage/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                + Générer pour ce bien
              </a>
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-12 bg-foreground/[0.02] rounded-2xl border border-foreground/5">
              <p className="text-muted font-light text-sm">Aucune photo associ&#233;e &#224; ce bien.</p>
              <p className="text-xs text-muted/50 font-light mt-1">
                Associez des photos depuis votre galerie ou générez-en de nouvelles.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="bien-photos">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative bg-foreground/[0.02] rounded-2xl overflow-hidden border border-foreground/5"
                  >
                    {photo.output_image_key ? (
                      <img
                        src={`/api/logs/image?path=${encodeURIComponent(photo.output_image_key)}`}
                        alt={photo.style_id || "Photo"}
                        className="w-full aspect-[4/3] object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] bg-foreground/5 flex items-center justify-center">
                        <span className="text-xs text-muted font-light">Non disponible</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                      <span className="text-[10px] text-white/90 font-medium">
                        {STYLE_LABELS[photo.style_id || ""] || photo.style_id || ""}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDissociate(photo.id)}
                      className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-red-500/80 text-white text-[10px] px-2 py-1 rounded-lg font-medium hover:bg-red-500 focus-visible:outline-none"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>

              {/* Dossier creation */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => {
                    setShowDossierModal(true);
                    setSelectedForDossier(new Set());
                    setCoverPhotoId(null);
                    setDossierResult(null);
                  }}
                  className="text-xs bg-foreground text-background px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                  data-testid="create-dossier-btn"
                >
                  Cr&#233;er un dossier
                </button>
              </div>
            </>
          )}
        </section>

        {/* Associate modal */}
        {showAssociateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Associer des photos</h2>
                <button
                  onClick={() => {
                    setShowAssociateModal(false);
                    setSelectedForAssoc(new Set());
                  }}
                  className="text-muted hover:text-foreground text-lg font-light w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                >
                  x
                </button>
              </div>

              {unassociatedPhotos.length === 0 ? (
                <p className="text-sm text-muted font-light py-8 text-center">
                  Aucune photo non class&#233;e disponible.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted font-light mb-3">
                    {selectedForAssoc.size} photo{selectedForAssoc.size !== 1 ? "s" : ""} s&#233;lectionn&#233;e{selectedForAssoc.size !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                    {unassociatedPhotos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => {
                          setSelectedForAssoc((prev) => {
                            const next = new Set(prev);
                            if (next.has(photo.id)) next.delete(photo.id);
                            else next.add(photo.id);
                            return next;
                          });
                        }}
                        className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
                          selectedForAssoc.has(photo.id)
                            ? "border-sage"
                            : "border-transparent"
                        }`}
                      >
                        {photo.output_image_key ? (
                          <img
                            src={`/api/logs/image?path=${encodeURIComponent(photo.output_image_key)}`}
                            alt=""
                            className="w-full aspect-square object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-foreground/5" />
                        )}
                        {selectedForAssoc.has(photo.id) && (
                          <div className="absolute inset-0 bg-sage/20 flex items-center justify-center">
                            <div className="w-5 h-5 bg-sage rounded-full flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">v</span>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleAssociatePhotos}
                    disabled={selectedForAssoc.size === 0}
                    className="text-xs bg-sage text-white px-4 py-2 rounded-full font-medium hover:bg-sage/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Associer {selectedForAssoc.size} photo{selectedForAssoc.size !== 1 ? "s" : ""}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Dossier creation modal */}
        {showDossierModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Cr&#233;er un dossier</h2>
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="text-muted hover:text-foreground text-lg font-light w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                >
                  x
                </button>
              </div>

              {dossierResult ? (
                <div className="text-center py-8">
                  <p className="text-sm text-sage font-medium mb-4">Dossier cr&#233;&#233; avec succ&#232;s.</p>
                  <a
                    href={dossierResult.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs bg-foreground text-background px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors"
                  >
                    T&#233;l&#233;charger le PDF
                  </a>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted font-light mb-3">
                    S&#233;lectionnez les photos &#224; inclure dans le dossier. Cliquez sur la couverture souhait&#233;e.
                  </p>

                  {photos.length === 0 ? (
                    <p className="text-sm text-muted font-light py-8 text-center">
                      Associez d&#8217;abord des photos &#224; ce bien.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                        {photos.map((photo) => (
                          <div key={photo.id} className="relative">
                            <button
                              onClick={() => toggleDossierPhoto(photo.id)}
                              className={`w-full relative rounded-xl overflow-hidden border-2 transition-colors ${
                                selectedForDossier.has(photo.id)
                                  ? "border-sage"
                                  : "border-transparent"
                              }`}
                            >
                              {photo.output_image_key ? (
                                <img
                                  src={`/api/logs/image?path=${encodeURIComponent(photo.output_image_key)}`}
                                  alt=""
                                  className="w-full aspect-square object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full aspect-square bg-foreground/5" />
                              )}
                              {selectedForDossier.has(photo.id) && (
                                <div className="absolute inset-0 bg-sage/20" />
                              )}
                            </button>
                            {selectedForDossier.has(photo.id) && (
                              <button
                                onClick={() => setCoverPhotoId(photo.id)}
                                className={`absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                                  coverPhotoId === photo.id
                                    ? "bg-sage text-white"
                                    : "bg-[var(--background)]/80 text-foreground hover:bg-sage/20"
                                }`}
                              >
                                {coverPhotoId === photo.id ? "Couverture" : "Couverture ?"}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleCreateDossier}
                        disabled={selectedForDossier.size === 0 || isCreatingDossier}
                        className="text-xs bg-foreground text-background px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingDossier
                          ? "Cr\u00e9ation en cours..."
                          : `Cr\u00e9er le dossier (${selectedForDossier.size} photo${selectedForDossier.size !== 1 ? "s" : ""})`}
                      </button>
                    </>
                  )}
                </>
              )}
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
