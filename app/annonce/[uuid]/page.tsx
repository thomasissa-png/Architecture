/**
 * F6 — Annonce immobili\u00E8re publique.
 *
 * /annonce/[uuid] — SSR, no auth required, mobile-friendly.
 * OpenGraph metadata for link preview in messaging apps.
 * Valid for 90 days after creation.
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnnonceByIdentifier, isAnnonceActive } from "@/lib/annonce";
import { getPropertyById } from "@/lib/properties";
import { getUserPhotos } from "@/lib/user-photos";
import { getMerchantProfile } from "@/lib/merchant";
import { hasProAccess } from "@/lib/credits";
import AnnoncePublicView from "@/components/AnnoncePublicView";
import ExportPortail from "@/components/ExportPortail";
import AnnonceGallery from "@/components/AnnonceGallery";
import ContactSticky from "@/components/ContactSticky";
import MerchantInfoBlock from "@/components/MerchantInfoBlock";
import RoomNav from "@/components/RoomNav";
import { ROOM_TYPE_LABELS } from "@/lib/constants";
import StorageImage from "@/components/StorageImage";
import MerchantBrandWrapper from "@/components/MerchantBrandWrapper";

interface PageProps {
  params: { uuid: string };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// ─── Dynamic metadata for OG previews ────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { annonce } = await getAnnonceByIdentifier(params.uuid);

  if (!annonce || !isAnnonceActive(annonce)) {
    return {
      title: "Annonce introuvable - Versiroom",
      description: "Cette annonce n'existe pas ou a été supprimée.",
      robots: "noindex, nofollow",
    };
  }

  const [property, photos] = await Promise.all([
    getPropertyById(annonce.property_id, annonce.user_id),
    getUserPhotos(annonce.user_id, { propertyId: annonce.property_id }),
  ]);
  const title = annonce.title || "Annonce immobilière";

  const details: string[] = [];
  if (property?.surface_m2) details.push(`${property.surface_m2}m²`);
  if (property?.room_count) details.push(`${property.room_count} pièces`);
  if (property?.sale_price) details.push(formatPrice(property.sale_price));

  const description = details.length > 0
    ? `${title} - ${details.join(", ")}. Visuels par Versiroom.`
    : `${title} - Visuels par Versiroom.`;

  const firstPhoto = photos.find((p) => p.output_image_key);
  const ogImages = firstPhoto?.output_image_key
    ? [{ url: `/api/logs/image?path=${encodeURIComponent(firstPhoto.output_image_key)}` }]
    : undefined;

  return {
    title: `${title} - Versiroom`,
    description,
    robots: "noindex, nofollow",
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Versiroom",
      ...(ogImages ? { images: ogImages } : {}),
    },
  };
}

// ─── Server Component ────────────────────────────────────────────────
export default async function AnnoncePage({ params }: PageProps) {
  const { annonce, redirectToSlug } = await getAnnonceByIdentifier(params.uuid);

  // 301 redirect from UUID to slug for SEO + clean URLs
  if (redirectToSlug && annonce?.slug) {
    redirect(`/annonce/${annonce.slug}`);
  }

  // Not found
  if (!annonce) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Annonce introuvable
          </h1>
          <p className="text-muted font-light text-sm">
            Cette annonce n&apos;existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  // Expired or archived — same message as "not found" to avoid revealing existence
  if (!isAnnonceActive(annonce)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Annonce introuvable
          </h1>
          <p className="text-muted font-light text-sm">
            Cette annonce n&apos;existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  // Load property + photos + merchant + session in parallel
  const [property, photos, merchant, session] = await Promise.all([
    getPropertyById(annonce.property_id, annonce.user_id),
    getUserPhotos(annonce.user_id, { propertyId: annonce.property_id }),
    getMerchantProfile(annonce.user_id),
    getServerSession(authOptions),
  ]);

  const isOwner = session?.user?.id === annonce.user_id;
  // Pro access check for V2a ExportPortail — only query if owner (avoid useless DB call for visitors)
  const hasPro = isOwner && session?.user?.id
    ? await hasProAccess(session.user.id)
    : false;

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Bien introuvable
          </h1>
          <p className="text-muted font-light text-sm">
            Le bien associé à cette annonce n&apos;existe plus.
          </p>
        </div>
      </div>
    );
  }

  const completedPhotos = photos.filter((p) => p.output_image_key);
  const title = annonce.title || "Annonce immobilière";
  const description = property.description_final || property.description_generated;
  const hasMerchant = merchant?.is_merchant === true;

  // Group photos by room_type
  const photosByRoom: Record<string, typeof completedPhotos> = {};
  for (const photo of completedPhotos) {
    const key = photo.room_type || "other";
    if (!photosByRoom[key]) photosByRoom[key] = [];
    photosByRoom[key].push(photo);
  }

  // Sort room groups in a logical visit order
  const ROOM_ORDER = [
    "living_room", "bedroom", "kitchen", "bathroom",
    "dining_room", "office", "hallway", "terrace",
    "balcony", "garden", "other",
  ];
  const sortedRoomEntries = Object.entries(photosByRoom).sort(
    ([a], [b]) => {
      const ia = ROOM_ORDER.indexOf(a);
      const ib = ROOM_ORDER.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    }
  );

  return (
    <MerchantBrandWrapper
      font={hasMerchant ? merchant?.police : null}
      couleurPrincipale={hasMerchant ? merchant?.couleur_principale : null}
      couleurSecondaire={hasMerchant ? merchant?.couleur_secondaire : null}
    >
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          {hasMerchant && merchant?.logo_storage_key ? (
            <StorageImage
              imageKey={merchant.logo_storage_key}
              alt={merchant.raison_sociale || "Logo"}
              className="h-8 w-auto object-contain"
              loading="eager"
            />
          ) : hasMerchant && merchant?.raison_sociale ? (
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: merchant.couleur_principale || "#7D9B76" }}
            >
              {merchant.raison_sociale
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0].toUpperCase())
                .join("")}
            </span>
          ) : (
            <span className="text-xl font-semibold text-foreground tracking-tighter">
              Versiroom
            </span>
          )}
          <div className="flex items-center gap-3">
            {isOwner && (
              <a
                href={`/mes-biens/${annonce.property_id}`}
                className="inline-flex items-center gap-1 text-xs text-sage font-light hover:text-sage/80 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Modifier
              </a>
            )}
            <span className="text-xs text-muted font-light">
              {hasMerchant && merchant?.raison_sociale
                ? merchant.raison_sociale
                : "Annonce immobilière"}
            </span>
          </div>
        </div>
      </header>

      {/* Hero photo — first completed photo, full-width above the fold */}
      {completedPhotos.length > 0 && (() => {
        // Prefer first photo from living_room group, fallback to first overall
        const heroPhoto = (photosByRoom["living_room"]?.[0]) || completedPhotos[0];
        return (
          <div className="w-full">
            <StorageImage
              imageKey={heroPhoto.output_image_key}
              alt={heroPhoto.room_label || "Photo principale"}
              className="w-full max-h-[50vh] sm:max-h-[60vh] object-cover rounded-b-2xl"
              loading="eager"
            />
          </div>
        );
      })()}

      {/* Content */}
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Title + key info */}
        <div className="mb-8 sm:mb-10">
          <h1
            className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3"
            style={{ color: "var(--brand-primary, #1C1C1E)" }}
            data-testid="annonce-title"
          >
            {title}
          </h1>

          {/* Key info pills */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {property.surface_m2 && (
              <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light">
                {property.surface_m2} m²
              </span>
            )}
            {property.room_count && (
              <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light">
                {property.room_count} pièce{property.room_count > 1 ? "s" : ""}
              </span>
            )}
            {property.city && (
              <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light">
                {property.city}
                {property.postal_code ? ` (${property.postal_code})` : ""}
              </span>
            )}
            <span
              className="text-xs text-white px-3 py-1.5 rounded-xl font-medium"
              style={{ backgroundColor: "var(--brand-primary, #1C1C1E)" }}
              data-testid="annonce-price"
            >
              {property.sale_price ? formatPrice(property.sale_price) : "Prix sur demande"}
            </span>
            {property.sale_price && property.surface_m2 && property.surface_m2 > 0 && (
              <span
                className="text-xs bg-foreground/10 text-foreground px-3 py-1.5 rounded-xl font-medium"
                data-testid="annonce-price-m2"
              >
                {Math.round(property.sale_price / property.surface_m2).toLocaleString("fr-FR")} €/m²
              </span>
            )}
            {property.dvf_median_price_m2 && (
              <span className="text-xs bg-sage/10 text-sage px-3 py-1.5 rounded-xl font-medium">
                Prix moyen quartier : {property.dvf_median_price_m2.toLocaleString("fr-FR")} €/m²
              </span>
            )}
          </div>

          {/* Address */}
          {property.address_normalized && (
            <p className="text-sm text-muted font-light">
              {property.address_normalized}
            </p>
          )}
        </div>

        {/* V2a — Export pre-formatted for portals (Pro owners only) — above gallery for visibility */}
        {isOwner && hasPro && completedPhotos.length > 0 && (
          <ExportPortail
            title={title}
            description={description || ""}
            surface={property.surface_m2}
            roomCount={property.room_count}
            price={property.sale_price}
            city={property.city || ""}
            propertyType={property.property_type || "Bien immobilier"}
            isCopro={!!(property.nb_lots_copro && property.nb_lots_copro > 0)}
            coproLots={property.nb_lots_copro}
            coproChargesAnnuelles={property.charges_copro_annuelles}
            dpeClasse={property.dpe_classe}
            gesClasse={property.ges_classe}
            merchantName={hasMerchant ? merchant?.raison_sociale : null}
            merchantPhone={hasMerchant ? merchant?.telephone : null}
            photos={completedPhotos.map((p) => ({
              id: p.id,
              outputImageKey: p.output_image_key!,
              roomType: p.room_type || "other",
              roomLabel: p.room_label || ROOM_TYPE_LABELS[p.room_type || ""] || "Photo",
            }))}
            annonceUuid={annonce.slug || annonce.uuid}
          />
        )}

        {/* CTA — Call to action above fold (Marc P1) */}
        {hasMerchant && merchant?.telephone && (
          <div className="mb-8">
            <a
              href={`tel:${merchant.telephone}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white rounded-full text-sm font-medium hover:opacity-90 active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              style={{ backgroundColor: "var(--brand-primary, #7D9B76)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Appeler {merchant.raison_sociale || "le vendeur"}
            </a>
          </div>
        )}
        {hasMerchant && !merchant?.telephone && merchant?.email_pro && (
          <div className="mb-8">
            <a
              href={`mailto:${merchant.email_pro}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white rounded-full text-sm font-medium hover:opacity-90 active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              style={{ backgroundColor: "var(--brand-primary, #7D9B76)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Envoyer un message
            </a>
          </div>
        )}

        {/* Room navigation — sticky pills */}
        {completedPhotos.length > 1 && sortedRoomEntries.length > 1 && (
          <div className="mb-6">
            <RoomNav
              rooms={sortedRoomEntries.map(([roomType]) => ({
                id: `piece-${roomType}`,
                label: ROOM_TYPE_LABELS[roomType] || (roomType === "other" ? "Autres" : roomType),
              }))}
            />
          </div>
        )}

        {/* Photo gallery grouped by room — with lightbox */}
        {completedPhotos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted font-light mb-4">
              Photos en cours de pr&eacute;paration &mdash; contactez-nous pour les recevoir en avant-premi&egrave;re
            </p>
            {hasMerchant && (merchant?.telephone || merchant?.email_pro) && (
              <a
                href={merchant?.telephone ? `tel:${merchant.telephone}` : `mailto:${merchant?.email_pro}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sage text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {merchant?.telephone ? "Appeler" : "Envoyer un message"}
              </a>
            )}
          </div>
        ) : (
          <AnnonceGallery
            photosByRoom={sortedRoomEntries.map(([roomType, roomPhotos]) => ({
              roomType,
              roomLabel: ROOM_TYPE_LABELS[roomType] || (roomType === "other" ? "Autres" : roomType),
              photos: roomPhotos.map((p) => ({
                id: p.id,
                outputImageKey: p.output_image_key!,
                roomType: p.room_type || "other",
                roomLabel: p.room_label || ROOM_TYPE_LABELS[p.room_type || ""] || null,
              })),
            }))}
            allPhotos={sortedRoomEntries.flatMap(([, roomPhotos]) =>
              roomPhotos.map((p) => ({
                src: `/api/logs/image?path=${encodeURIComponent(p.output_image_key!)}`,
                alt: p.room_label || ROOM_TYPE_LABELS[p.room_type || ""] || "Photo",
              }))
            )}
          />
        )}

        {/* Atouts scannables — max 4 items */}
        {(() => {
          const atouts: { icon: string; label: string }[] = [];
          if (property.parking) atouts.push({ icon: "P", label: "Parking" });
          if (property.cave) atouts.push({ icon: "C", label: "Cave" });
          if (property.exposition) atouts.push({ icon: "☀", label: `Exposition ${property.exposition}` });
          if (property.ascenseur) atouts.push({ icon: "↑", label: "Ascenseur" });
          const display = atouts.slice(0, 4);
          if (display.length === 0) return null;
          return (
            <div className="mb-6 flex flex-wrap gap-2" data-testid="annonce-atouts">
              {display.map((a) => (
                <span
                  key={a.label}
                  className="inline-flex items-center gap-1.5 text-xs bg-sage/10 text-sage px-3 py-1.5 rounded-xl font-medium"
                >
                  <span className="text-[10px] opacity-70">{a.icon}</span>
                  {a.label}
                </span>
              ))}
            </div>
          );
        })()}

        {/* Description — split into visual paragraphs for structured reading */}
        <div className="mb-10" data-testid="annonce-description">
          <h2 className="text-sm font-medium text-foreground mb-3">Description</h2>
          {description ? (
            <div className="max-w-2xl space-y-4">
              {description.split(/\n\n+/).map((paragraph, idx) => (
                <p key={idx} className="text-sm text-muted font-light leading-relaxed">
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted font-light">
              Description en cours de rédaction
            </p>
          )}
        </div>

        {/* Caracteristiques — displayed only if at least one field is filled */}
        {(property.dpe_classe || property.ges_classe || property.etage != null || property.parking || property.cave || property.charges_copro_annuelles || property.annee_construction || property.exposition || property.taxe_fonciere || property.nb_lots_copro) && (
          <div className="mb-10" data-testid="annonce-caracteristiques">
            <h2 className="text-sm font-medium text-foreground mb-4">Caractéristiques</h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {/* DPE badge */}
              {property.dpe_classe && (() => {
                const dpeColors: Record<string, string> = {
                  A: "bg-[#319834] text-white",
                  B: "bg-[#33a357] text-white",
                  C: "bg-[#cbdb2a] text-foreground",
                  D: "bg-[#f0e50a] text-foreground",
                  E: "bg-[#f0b40a] text-foreground",
                  F: "bg-[#eb6235] text-white",
                  G: "bg-[#d7221f] text-white",
                };
                const cls = dpeColors[property.dpe_classe] || "bg-foreground/10 text-foreground";
                return (
                  <span className={`text-xs px-3 py-1.5 rounded-xl font-medium ${cls}`} data-testid="annonce-dpe-badge">
                    DPE {property.dpe_classe}
                  </span>
                );
              })()}

              {/* GES badge */}
              {property.ges_classe && (() => {
                const gesColors: Record<string, string> = {
                  A: "bg-[#a9d6f5] text-foreground",
                  B: "bg-[#78b9e7] text-foreground",
                  C: "bg-[#559fd4] text-white",
                  D: "bg-[#3c7cb5] text-white",
                  E: "bg-[#2d5f8f] text-white",
                  F: "bg-[#5b3a80] text-white",
                  G: "bg-[#3e1f5e] text-white",
                };
                const cls = gesColors[property.ges_classe] || "bg-foreground/10 text-foreground";
                return (
                  <span className={`text-xs px-3 py-1.5 rounded-xl font-medium ${cls}`} data-testid="annonce-ges-badge">
                    GES {property.ges_classe}
                  </span>
                );
              })()}

              {/* Passoire thermique warning */}
              {property.dpe_classe && (property.dpe_classe === "F" || property.dpe_classe === "G") && (
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-xl font-medium" data-testid="annonce-passoire">
                  Passoire énergétique
                </span>
              )}

              {/* Etage + ascenseur */}
              {property.etage != null && (
                <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light" data-testid="annonce-etage">
                  {property.etage === 0 ? "RDC" : `${property.etage}e étage`}
                  {property.ascenseur ? " — ascenseur" : ""}
                </span>
              )}

              {/* Parking */}
              {property.parking && (
                <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light" data-testid="annonce-parking">
                  Parking
                </span>
              )}

              {/* Cave */}
              {property.cave && (
                <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light" data-testid="annonce-cave">
                  Cave
                </span>
              )}

              {/* Exposition */}
              {property.exposition && (
                <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light" data-testid="annonce-exposition">
                  Exposition {property.exposition}
                </span>
              )}

              {/* Annee construction */}
              {property.annee_construction && (
                <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light" data-testid="annonce-annee">
                  Construit en {property.annee_construction}
                </span>
              )}
            </div>

            {/* Charges + taxe + lots en texte */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted font-light">
              {property.charges_copro_annuelles && (
                <span data-testid="annonce-charges">
                  Charges copro : {property.charges_copro_annuelles.toLocaleString("fr-FR")} €/an
                </span>
              )}
              {property.taxe_fonciere && (
                <span data-testid="annonce-taxe">
                  Taxe foncière : {property.taxe_fonciere.toLocaleString("fr-FR")} €/an
                </span>
              )}
              {property.nb_lots_copro && (
                <span data-testid="annonce-lots">
                  Copropriété de {property.nb_lots_copro} lots
                </span>
              )}
            </div>
          </div>
        )}

        {/* Carte du quartier — OSM iframe */}
        {property.latitude && property.longitude && (
          <div className="mb-10">
            <h2 className="text-sm font-medium text-foreground mb-3">Localisation</h2>
            <div className="rounded-2xl border border-foreground/5 overflow-hidden">
              <iframe
                title="Carte du quartier"
                width="100%"
                height="280"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(property.longitude) - 0.008},${Number(property.latitude) - 0.005},${Number(property.longitude) + 0.008},${Number(property.latitude) + 0.005}&layer=mapnik&marker=${property.latitude},${property.longitude}`}
              />
            </div>
          </div>
        )}

        {/* Contact — only shown if merchant has phone or email, otherwise ContactSticky handles fallback */}
        {hasMerchant && (merchant?.telephone || merchant?.email_pro) && (
          <div className="mb-10 p-5 bg-foreground/[0.02] rounded-2xl border border-foreground/5" data-testid="annonce-contact">
            <h2 className="text-sm font-medium text-foreground mb-3">Contact</h2>
            <div className="space-y-2">
              {merchant?.raison_sociale && (
                <p className="text-sm font-medium text-foreground">
                  {merchant.raison_sociale}
                </p>
              )}
              {merchant?.telephone && (
                <a
                  href={`tel:${merchant.telephone}`}
                  className="block text-sm text-muted font-light hover:text-foreground transition-colors"
                  data-testid="annonce-telephone"
                >
                  {merchant.telephone}
                </a>
              )}
              {/* Email is revealed client-side via AnnoncePublicView for anti-scraping */}
            </div>
          </div>
        )}

        {/* Action buttons — client component */}
        {completedPhotos.length > 0 && (
          <AnnoncePublicView
            annonceUuid={annonce.slug || annonce.uuid}
            description={description || ""}
            city={property.city}
            surfaceM2={property.surface_m2}
            contactEmail={hasMerchant ? merchant?.email_pro : null}
            photos={completedPhotos.map((p) => ({
              id: p.id,
              outputImageKey: p.output_image_key!,
              roomLabel: p.room_label || ROOM_TYPE_LABELS[p.room_type || ""] || "Photo",
            }))}
          />
        )}

        {/* Merchant info block — before footer */}
        {hasMerchant && merchant && (
          <div className="mt-10 mb-10">
            <MerchantInfoBlock
              raisonSociale={merchant.raison_sociale}
              adresse={merchant.adresse}
              telephone={merchant.telephone}
              emailPro={merchant.email_pro}
              siret={merchant.siret}
              logoStorageKey={merchant.logo_storage_key}
              couleurPrincipale={merchant.couleur_principale}
            />
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-12 pt-6 border-t text-center pb-20"
          style={{ borderColor: "var(--brand-secondary, rgba(28,28,30,0.05))" }}
        >
          {hasMerchant && (merchant?.raison_sociale || merchant?.telephone || merchant?.email_pro) && (
            <p className="text-xs text-muted font-light mb-2">
              {[merchant?.raison_sociale, merchant?.telephone, merchant?.email_pro].filter(Boolean).join(" — ")}
            </p>
          )}
          <p className="text-sm text-muted/60 font-light">
            Projection d&apos;aménagement réalisée par Versiroom — le bien est livré brut. Visuels non contractuels.
          </p>
          <p className="text-xs text-muted/40 font-light mt-1">
            <a
              href="https://architecture-toum92.replit.app/"
              className="hover:text-muted/60 transition-colors underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Versiroom
            </a>
            {" "}&mdash; © {new Date().getFullYear()}
          </p>
        </div>
      </main>

      {/* Sticky contact CTA */}
      <ContactSticky
        telephone={hasMerchant ? merchant?.telephone : null}
        email={hasMerchant ? merchant?.email_pro : null}
        raisonSociale={hasMerchant ? merchant?.raison_sociale : null}
        title={title}
        brandColor={hasMerchant ? merchant?.couleur_principale : null}
      />
    </div>
    </MerchantBrandWrapper>
  );
}
