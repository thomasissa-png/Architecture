"use client";

/**
 * Fiche d'un bien — detail, photos associees, creation de dossier.
 */

import React from "react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import AuthButton from "@/components/AuthButton";
import InlineGenerator from "@/components/InlineGenerator";
import { STYLE_LABELS, TYPE_LABELS } from "@/lib/constants";

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
  latitude: string | null;
  longitude: string | null;
  map_image_key: string | null;
  description_generated: string | null;
  description_final: string | null;
  dpe_classe: string | null;
  ges_classe: string | null;
  etage: number | null;
  ascenseur: boolean | null;
  parking: boolean | null;
  cave: boolean | null;
  charges_copro_annuelles: number | null;
  annee_construction: number | null;
  exposition: string | null;
  taxe_fonciere: number | null;
  nb_lots_copro: number | null;
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

  // Complementary info form
  const [compInfo, setCompInfo] = useState({
    dpeClasse: "" as string,
    gesClasse: "" as string,
    etage: "" as string,
    ascenseur: false,
    parking: false,
    cave: false,
    chargesCoproAnnuelles: "" as string,
    anneeConstruction: "" as string,
    exposition: "" as string,
    taxeFonciere: "" as string,
    nbLotsCopro: "" as string,
  });
  const [isSavingCompInfo, setIsSavingCompInfo] = useState(false);
  const [compInfoSaved, setCompInfoSaved] = useState(false);

  // Annonce creation + archiving
  const [isCreatingAnnonce, setIsCreatingAnnonce] = useState(false);
  const [activeAnnonceUuid, setActiveAnnonceUuid] = useState<string | null>(null);
  const [isArchivingAnnonce, setIsArchivingAnnonce] = useState(false);

  // Description regeneration
  const [isRegeneratingDesc, setIsRegeneratingDesc] = useState(false);

  // Delete property
  const [isDeletingProperty, setIsDeletingProperty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Inline generator
  const [showGenerator, setShowGenerator] = useState(false);

  // Dossier creation
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [selectedForDossier, setSelectedForDossier] = useState<Set<string>>(new Set());
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);
  const [isCreatingDossier, setIsCreatingDossier] = useState(false);
  const [dossierResult, setDossierResult] = useState<{ uuid: string; slug?: string; identifier?: string; pdfUrl: string } | null>(null);

  // Modal refs for focus trap
  const associateModalRef = useRef<HTMLDivElement>(null);
  const dossierModalRef = useRef<HTMLDivElement>(null);

  // Inline toast (replaces alert())
  const [toastMsg, setToastMsg] = useState<React.ReactNode | null>(null);
  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  // Focus trap + Escape + scroll lock for modals
  useEffect(() => {
    const isOpen = showAssociateModal || showDossierModal;
    if (!isOpen) return;
    document.body.style.overflow = "hidden";

    const modalRef = showAssociateModal ? associateModalRef : dossierModalRef;
    const closeModal = () => {
      if (showAssociateModal) { setShowAssociateModal(false); setSelectedForAssoc(new Set()); }
      if (showDossierModal) setShowDossierModal(false);
    };

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
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
    // Focus first element
    setTimeout(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>('button, input, a[href]');
      firstFocusable?.focus();
    }, 100);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [showAssociateModal, showDossierModal]);

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      window.location.href = "/";
    }
  }, [authStatus]);

  const fetchProperty = useCallback(async (retryCount = 0) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`);
      if (!res.ok) {
        // On first attempt, retry once after a short delay — handles race condition
        // where the redirect from creation arrives before the DB write is visible.
        if (retryCount === 0) {
          await new Promise((r) => setTimeout(r, 800));
          return fetchProperty(1);
        }
        if (res.status === 404) {
          setError("Bien introuvable.");
        } else {
          setError("Erreur de chargement. Veuillez rafraîchir la page.");
        }
        return;
      }
      const data = await res.json();
      setProperty(data.property);
    } catch {
      if (retryCount === 0) {
        await new Promise((r) => setTimeout(r, 800));
        return fetchProperty(1);
      }
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
    } catch (err) {
      console.error("Erreur chargement photos:", err);
    }
  }, [propertyId]);

  const fetchUnassociated = useCallback(async () => {
    try {
      const res = await fetch("/api/user/photos?associated=false");
      if (res.ok) {
        const data = await res.json();
        setUnassociatedPhotos(data.photos || []);
      }
    } catch (err) {
      console.error("Erreur chargement photos non associees:", err);
    }
  }, []);

  const fetchActiveAnnonce = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/annonce`);
      if (res.ok) {
        const data = await res.json();
        setActiveAnnonceUuid(data.uuid || null);
      }
    } catch (err) {
      console.error("Erreur chargement annonce:", err);
    }
  }, [propertyId]);

  useEffect(() => {
    if (session?.user?.id) {
      Promise.all([fetchProperty(), fetchPhotos(), fetchActiveAnnonce()]).then(() => setIsLoading(false));
    }
  }, [session, fetchProperty, fetchPhotos, fetchActiveAnnonce]);

  // Sync compInfo when property loads
  useEffect(() => {
    if (property) {
      setCompInfo({
        dpeClasse: property.dpe_classe || "",
        gesClasse: property.ges_classe || "",
        etage: property.etage != null ? String(property.etage) : "",
        ascenseur: property.ascenseur === true,
        parking: property.parking === true,
        cave: property.cave === true,
        chargesCoproAnnuelles: property.charges_copro_annuelles != null ? String(property.charges_copro_annuelles) : "",
        anneeConstruction: property.annee_construction != null ? String(property.annee_construction) : "",
        exposition: property.exposition || "",
        taxeFonciere: property.taxe_fonciere != null ? String(property.taxe_fonciere) : "",
        nbLotsCopro: property.nb_lots_copro != null ? String(property.nb_lots_copro) : "",
      });
    }
  }, [property]);

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
    } catch (err) {
      console.error("Erreur sauvegarde description:", err);
    }
  };

  const handleRegenerateDescription = async () => {
    if (!property?.address_raw) return;
    setIsRegeneratingDesc(true);
    try {
      const res = await fetch("/api/merchant/enrich-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adresse: property.address_raw,
          surface: property.surface_m2 || undefined,
          type: property.property_type || undefined,
          nbPieces: property.room_count || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.description) {
          // Save the new description to the property
          const patchRes = await fetch(`/api/properties/${propertyId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ descriptionGenerated: data.description }),
          });
          if (patchRes.ok) {
            const patchData = await patchRes.json();
            setProperty(patchData.property);
            setToastMsg("Description générée avec succès.");
          }
        } else {
          setToastMsg("La description n'a pas pu être générée. Réessayez.");
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setToastMsg(errData.error || "Erreur lors de la génération de la description.");
      }
    } catch {
      setToastMsg("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setIsRegeneratingDesc(false);
    }
  };

  const handleSaveCompInfo = async () => {
    setIsSavingCompInfo(true);
    setCompInfoSaved(false);
    try {
      const body: Record<string, string | number | boolean | null> = {
        dpeClasse: compInfo.dpeClasse || null,
        gesClasse: compInfo.gesClasse || null,
        etage: compInfo.etage ? parseInt(compInfo.etage, 10) : null,
        ascenseur: compInfo.ascenseur,
        parking: compInfo.parking,
        cave: compInfo.cave,
        chargesCoproAnnuelles: compInfo.chargesCoproAnnuelles ? parseInt(compInfo.chargesCoproAnnuelles, 10) : null,
        anneeConstruction: compInfo.anneeConstruction ? parseInt(compInfo.anneeConstruction, 10) : null,
        exposition: compInfo.exposition || null,
        taxeFonciere: compInfo.taxeFonciere ? parseInt(compInfo.taxeFonciere, 10) : null,
        nbLotsCopro: compInfo.nbLotsCopro ? parseInt(compInfo.nbLotsCopro, 10) : null,
      };

      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setProperty(data.property);
        setCompInfoSaved(true);
        setTimeout(() => setCompInfoSaved(false), 3000);
      }
    } catch (err) {
      console.error("Erreur sauvegarde infos complementaires:", err);
    } finally {
      setIsSavingCompInfo(false);
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
      } else {
        setToastMsg("Erreur lors de l'association. Réessayez.");
      }
    } catch (err) {
      console.error("Erreur association photos:", err);
      setToastMsg("Erreur lors de l'association. Réessayez.");
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
      } else {
        setToastMsg("Erreur lors de la dissociation. Réessayez.");
      }
    } catch (err) {
      console.error("Erreur dissociation photo:", err);
      setToastMsg("Erreur lors de la dissociation. Réessayez.");
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
        // Auto-open dossier page in new tab (primary action)
        const dossierPath = data.dossier.identifier || data.dossier.slug || data.dossier.uuid;
        window.open(`/dossier/${dossierPath}`, '_blank');
      } else {
        const data = await res.json();
        setToastMsg(data.error || "Erreur lors de la création du dossier.");
      }
    } catch {
      setToastMsg("Erreur réseau.");
    } finally {
      setIsCreatingDossier(false);
    }
  };

  const handleArchiveAnnonce = async () => {
    if (!activeAnnonceUuid || isArchivingAnnonce) return;
    setIsArchivingAnnonce(true);
    try {
      const res = await fetch(`/api/annonce/${activeAnnonceUuid}/archive`, {
        method: "POST",
      });
      if (res.ok) {
        setActiveAnnonceUuid(null);
        setToastMsg("Annonce archivée.");
      } else {
        const data = await res.json();
        setToastMsg(data.error || "Erreur lors de l'archivage.");
      }
    } catch {
      setToastMsg("Erreur réseau.");
    } finally {
      setIsArchivingAnnonce(false);
    }
  };

  const handleDeleteProperty = async () => {
    setShowDeleteConfirm(false);
    setIsDeletingProperty(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/mes-biens";
      } else {
        const data = await res.json();
        setToastMsg(data.error || "Erreur lors de la suppression.");
      }
    } catch {
      setToastMsg("Erreur réseau.");
    } finally {
      setIsDeletingProperty(false);
    }
  };

  const handleCreateAnnonce = async () => {
    if (isCreatingAnnonce) return;
    setIsCreatingAnnonce(true);
    try {
      const res = await fetch("/api/annonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      if (res.ok) {
        const data = await res.json();
        window.open(`/annonce/${data.identifier || data.uuid}`, '_blank');
      } else if (res.status === 403) {
        setToastMsg(
          <span>
            Cette fonctionnalité est réservée au Pack Pro.{" "}
            <a href="/pricing" className="underline font-semibold">Voir les tarifs</a>
          </span>
        );
      } else {
        const data = await res.json();
        setToastMsg(data.error || "Erreur lors de la création de l'annonce.");
      }
    } catch {
      setToastMsg("Erreur réseau.");
    } finally {
      setIsCreatingAnnonce(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted font-light text-sm">{error}</p>
          <a href="/mes-biens" className="inline-block mt-4 text-xs text-sage font-medium hover:underline">
            Retour à mes biens
          </a>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted font-light text-sm">Chargement...</div>
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
          <a href="/mes-biens" className="text-xs text-muted font-light hover:text-foreground transition-colors min-h-[44px] inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded">
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
                  {property.surface_m2} m²
                </span>
              )}
              {property.room_count && (
                <span className="text-xs bg-foreground/5 text-foreground px-3 py-1 rounded-xl font-light">
                  {property.room_count} pièces
                </span>
              )}
              {property.dvf_median_price_m2 && (
                <span className="text-xs bg-sage/10 text-sage px-3 py-1 rounded-xl font-light">
                  {property.dvf_median_price_m2.toLocaleString("fr-FR")} €/m²
                </span>
              )}
              {property.sale_price && (
                <span className="text-xs bg-foreground text-background px-3 py-1 rounded-xl font-medium">
                  {property.sale_price.toLocaleString("fr-FR")} €
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
                <div className="max-w-2xl space-y-3">
                  {description.split(/\n\n+/).map((paragraph, idx) => (
                    <p key={idx} className="text-sm text-muted font-light leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setEditDesc(description);
                    setIsEditingDesc(true);
                  }}
                  className="text-xs text-sage font-light mt-1 hover:underline min-h-[44px] inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
                >
                  Modifier la description
                </button>
                <button
                  onClick={handleRegenerateDescription}
                  disabled={isRegeneratingDesc}
                  className="text-xs text-muted/50 font-light mt-1 ml-3 hover:text-sage hover:underline transition-colors disabled:opacity-50 min-h-[44px] inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded"
                >
                  {isRegeneratingDesc ? "Régénération..." : "Regénérer"}
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-xs text-muted/50 font-light mb-2">
                  Aucune description disponible.
                </p>
                <button
                  onClick={handleRegenerateDescription}
                  disabled={isRegeneratingDesc}
                  className="text-xs bg-sage text-white px-3 py-1.5 rounded-full font-medium hover:bg-sage/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="regenerate-description"
                >
                  {isRegeneratingDesc ? "Génération en cours..." : "Générer la description"}
                </button>
              </div>
            )}
          </div>

          {/* Map */}
          <div>
            {property.latitude && property.longitude ? (
              <div className="w-full rounded-2xl border border-foreground/5 overflow-hidden">
                <iframe
                  title="Carte du quartier"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(property.longitude) - 0.008},${Number(property.latitude) - 0.005},${Number(property.longitude) + 0.008},${Number(property.latitude) + 0.005}&layer=mapnik&marker=${property.latitude},${property.longitude}`}
                />
              </div>
            ) : property.map_image_key ? (
              <img
                src={`/api/logs/image?path=${encodeURIComponent(property.map_image_key)}`}
                alt="Carte du quartier"
                className="w-full rounded-2xl border border-foreground/5"
              />
            ) : null}
          </div>
        </div>

        {/* Informations complementaires */}
        <section className="mb-10 p-5 bg-foreground/[0.02] rounded-2xl border border-foreground/5" data-testid="comp-info-section">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Informations complémentaires
          </h2>
          <p className="text-xs text-muted font-light mb-4">
            Ces informations seront affichées automatiquement sur l&apos;annonce et le dossier.
          </p>

          {/* DPE + GES row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <label htmlFor="dpe-classe" className="block text-xs font-medium text-foreground mb-1">
                DPE
              </label>
              <select
                id="dpe-classe"
                data-testid="dpe-classe-select"
                value={compInfo.dpeClasse}
                onChange={(e) => setCompInfo((p) => ({ ...p, dpeClasse: e.target.value }))}
                className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                <option value="">--</option>
                {["A", "B", "C", "D", "E", "F", "G"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {!compInfo.dpeClasse && (
                <p className="text-[11px] text-red-500/80 font-light mt-0.5 flex items-center gap-1" data-testid="dpe-warning">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  DPE requis par la loi
                </p>
              )}
            </div>
            <div>
              <label htmlFor="ges-classe" className="block text-xs font-medium text-foreground mb-1">
                GES
              </label>
              <select
                id="ges-classe"
                data-testid="ges-classe-select"
                value={compInfo.gesClasse}
                onChange={(e) => setCompInfo((p) => ({ ...p, gesClasse: e.target.value }))}
                className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                <option value="">--</option>
                {["A", "B", "C", "D", "E", "F", "G"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="etage" className="block text-xs font-medium text-foreground mb-1">
                Étage
              </label>
              <input
                id="etage"
                type="number"
                min="0"
                data-testid="etage-input"
                value={compInfo.etage}
                onChange={(e) => setCompInfo((p) => ({ ...p, etage: e.target.value }))}
                placeholder="ex: 3"
                className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="ascenseur-checkbox"
                  checked={compInfo.ascenseur}
                  onChange={(e) => setCompInfo((p) => ({ ...p, ascenseur: e.target.checked }))}
                  className="w-4 h-4 rounded border-foreground/20 text-sage focus:ring-sage/50"
                />
                <span className="text-xs font-light text-foreground">Ascenseur</span>
              </label>
            </div>
          </div>

          {/* Parking + Cave + Exposition */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="parking-checkbox"
                  checked={compInfo.parking}
                  onChange={(e) => setCompInfo((p) => ({ ...p, parking: e.target.checked }))}
                  className="w-4 h-4 rounded border-foreground/20 text-sage focus:ring-sage/50"
                />
                <span className="text-xs font-light text-foreground">Parking</span>
              </label>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="cave-checkbox"
                  checked={compInfo.cave}
                  onChange={(e) => setCompInfo((p) => ({ ...p, cave: e.target.checked }))}
                  className="w-4 h-4 rounded border-foreground/20 text-sage focus:ring-sage/50"
                />
                <span className="text-xs font-light text-foreground">Cave</span>
              </label>
            </div>
            <div>
              <label htmlFor="exposition" className="block text-xs font-medium text-foreground mb-1">
                Exposition
              </label>
              <select
                id="exposition"
                data-testid="exposition-select"
                value={compInfo.exposition}
                onChange={(e) => setCompInfo((p) => ({ ...p, exposition: e.target.value }))}
                className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                <option value="">--</option>
                {["Nord", "Sud", "Est", "Ouest", "Nord-Est", "Nord-Ouest", "Sud-Est", "Sud-Ouest"].map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="annee-construction" className="block text-xs font-medium text-foreground mb-1">
                Année construction
              </label>
              <input
                id="annee-construction"
                type="number"
                min="1800"
                max="2030"
                data-testid="annee-construction-input"
                value={compInfo.anneeConstruction}
                onChange={(e) => setCompInfo((p) => ({ ...p, anneeConstruction: e.target.value }))}
                placeholder="ex: 1975"
                className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              />
            </div>
          </div>

          {/* Charges + Taxe + Lots */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label htmlFor="charges-copro" className="block text-xs font-medium text-foreground mb-1">
                Charges copro (€/an)
              </label>
              <input
                id="charges-copro"
                type="number"
                min="0"
                data-testid="charges-copro-input"
                value={compInfo.chargesCoproAnnuelles}
                onChange={(e) => setCompInfo((p) => ({ ...p, chargesCoproAnnuelles: e.target.value }))}
                placeholder="ex: 2400"
                className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              />
            </div>
            <div>
              <label htmlFor="taxe-fonciere" className="block text-xs font-medium text-foreground mb-1">
                Taxe foncière (€/an)
              </label>
              <input
                id="taxe-fonciere"
                type="number"
                min="0"
                data-testid="taxe-fonciere-input"
                value={compInfo.taxeFonciere}
                onChange={(e) => setCompInfo((p) => ({ ...p, taxeFonciere: e.target.value }))}
                placeholder="ex: 800"
                className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              />
            </div>
            <div>
              <label htmlFor="nb-lots" className="block text-xs font-medium text-foreground mb-1">
                Nb lots copro
              </label>
              <input
                id="nb-lots"
                type="number"
                min="1"
                data-testid="nb-lots-copro-input"
                value={compInfo.nbLotsCopro}
                onChange={(e) => setCompInfo((p) => ({ ...p, nbLotsCopro: e.target.value }))}
                placeholder="ex: 24"
                className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveCompInfo}
              disabled={isSavingCompInfo}
              data-testid="save-comp-info-btn"
              className="text-xs bg-sage text-white px-4 py-2 rounded-full font-medium hover:bg-sage/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
            >
              {isSavingCompInfo ? "Enregistrement..." : "Enregistrer"}
            </button>
            {compInfoSaved && (
              <span className="text-xs text-sage font-medium" data-testid="comp-info-saved">
                Enregistré
              </span>
            )}
          </div>
        </section>

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
              <button
                onClick={() => setShowGenerator(true)}
                className="text-xs bg-sage text-white px-3 py-1.5 rounded-full font-medium hover:bg-sage/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                + Générer pour ce bien
              </button>
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-12 bg-foreground/[0.02] rounded-2xl border border-foreground/5">
              <p className="text-muted font-light text-sm">Aucune photo associée à ce bien.</p>
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
                      <span className="text-xs text-white/90 font-medium">
                        {STYLE_LABELS[photo.style_id || ""] || photo.style_id || ""}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDissociate(photo.id)}
                      className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-red-500/80 text-white text-xs px-2 py-1 rounded-lg font-medium hover:bg-red-500 focus-visible:outline-none"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>

              {/* Dossier + Annonce creation */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => {
                    setShowDossierModal(true);
                    setSelectedForDossier(new Set());
                    setCoverPhotoId(null);
                    setDossierResult(null);
                  }}
                  className="text-xs bg-foreground text-background px-4 py-2.5 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                  data-testid="create-dossier-btn"
                >
                  Créer un dossier
                </button>
                <button
                  onClick={handleCreateAnnonce}
                  disabled={isCreatingAnnonce || photos.length === 0}
                  className="text-xs bg-sage text-white px-4 py-2.5 rounded-full font-medium hover:bg-sage/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                  data-testid="create-annonce-btn"
                >
                  {isCreatingAnnonce ? "Création..." : "Créer une annonce"}
                </button>
                {activeAnnonceUuid && (
                  <button
                    onClick={handleArchiveAnnonce}
                    disabled={isArchivingAnnonce}
                    className="text-xs border border-red-300 text-red-600 px-4 py-2.5 rounded-full font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50"
                    data-testid="archive-annonce-btn"
                  >
                    {isArchivingAnnonce ? "Archivage..." : "Archiver l'annonce"}
                  </button>
                )}
              </div>
              {!compInfo.dpeClasse && (
                <p className="text-xs text-amber-600 font-light mt-2" data-testid="dpe-annonce-warning">
                  Pensez à renseigner le DPE avant de publier votre annonce.
                </p>
              )}
            </>
          )}

          {/* Inline generator panel — outside photos ternary so it works even with 0 photos */}
          {showGenerator && (
            <InlineGenerator
              propertyId={propertyId}
              photos={photos}
              onClose={() => setShowGenerator(false)}
              onPhotosGenerated={() => {
                fetchPhotos();
                setShowGenerator(false);
              }}
            />
          )}
        </section>

        {/* Associate modal */}
        {showAssociateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div ref={associateModalRef} role="dialog" aria-modal="true" aria-label="Associer des photos" className="bg-background rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Associer des photos</h2>
                <button
                  onClick={() => {
                    setShowAssociateModal(false);
                    setSelectedForAssoc(new Set());
                  }}
                  className="text-muted hover:text-foreground w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                  aria-label="Fermer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {unassociatedPhotos.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted font-light">
                    Aucune photo disponible.
                  </p>
                  <p className="text-xs text-muted/50 font-light mt-1">
                    Générez d&apos;abord des visuels dans le mode Standard.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted font-light mb-3">
                    {selectedForAssoc.size} photo{selectedForAssoc.size !== 1 ? "s" : ""} sélectionnée{selectedForAssoc.size !== 1 ? "s" : ""}
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
                              <span className="text-white text-xs font-bold">v</span>
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
            <div ref={dossierModalRef} role="dialog" aria-modal="true" aria-label="Créer un dossier" className="bg-background rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Créer un dossier</h2>
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="text-muted hover:text-foreground w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                  aria-label="Fermer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {dossierResult ? (
                <div className="text-center py-8">
                  <p className="text-sm text-sage font-medium mb-4">Dossier créé avec succès.</p>
                  <div className="flex flex-col items-center gap-2">
                    <a
                      href={`/dossier/${dossierResult.identifier || dossierResult.slug || dossierResult.uuid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs bg-foreground text-background px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors"
                    >
                      Voir le dossier
                    </a>
                    <a
                      href={dossierResult.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-muted hover:text-foreground transition-colors font-light"
                    >
                      Télécharger le PDF
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted font-light mb-3">
                    Sélectionnez les photos à inclure dans le dossier. Cliquez sur la couverture souhaitée.
                  </p>

                  {photos.length === 0 ? (
                    <p className="text-sm text-muted font-light py-8 text-center">
                      Associez d&apos;abord des photos à ce bien.
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
                                className={`absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded-md font-medium ${
                                  coverPhotoId === photo.id
                                    ? "bg-sage text-white"
                                    : "bg-background/80 text-foreground hover:bg-sage/20"
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
                          ? "Création en cours..."
                          : `Créer le dossier (${selectedForDossier.size} photo${selectedForDossier.size !== 1 ? "s" : ""})`}
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
        {/* Delete property — bottom of page, discrete */}
        <div className="mt-16 pt-8 border-t border-foreground/5">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeletingProperty}
            className="text-xs text-red-400 font-light hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {isDeletingProperty ? "Suppression..." : "Supprimer ce bien"}
          </button>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
              aria-describedby="delete-confirm-desc"
              className="bg-background rounded-2xl max-w-sm w-full p-6"
            >
              <h2 id="delete-confirm-title" className="text-sm font-semibold text-foreground mb-2">
                Supprimer ce bien ?
              </h2>
              <p id="delete-confirm-desc" className="text-xs text-muted font-light mb-6">
                Cette action est irréversible. Les photos associées seront dissociées.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs text-muted font-light px-4 py-2 rounded-full hover:text-foreground transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteProperty}
                  className="text-xs bg-red-500 text-white px-4 py-2 rounded-full font-medium hover:bg-red-600 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50 focus-visible:ring-offset-2"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
