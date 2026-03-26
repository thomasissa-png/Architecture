/**
 * F6 — Annonce immobili\u00E8re publique.
 *
 * /annonce/[uuid] — SSR, no auth required, mobile-friendly.
 * OpenGraph metadata for link preview in messaging apps.
 * Valid for 90 days after creation.
 */

import { Metadata } from "next";
import { getAnnonceByUuid, isAnnonceActive } from "@/lib/annonce";
import { getPropertyById } from "@/lib/properties";
import { getUserPhotos } from "@/lib/user-photos";
import { getMerchantProfile } from "@/lib/merchant";
import AnnoncePublicView from "@/components/AnnoncePublicView";
import AnnonceGallery from "@/components/AnnonceGallery";
import ContactSticky from "@/components/ContactSticky";
import RoomNav from "@/components/RoomNav";
import { ROOM_TYPE_LABELS } from "@/lib/constants";

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
  const annonce = await getAnnonceByUuid(params.uuid);

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
  if (property?.surface_m2) details.push(`${property.surface_m2}m\u00B2`);
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
  const annonce = await getAnnonceByUuid(params.uuid);

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

  // Load property + photos + merchant in parallel
  const [property, photos, merchant] = await Promise.all([
    getPropertyById(annonce.property_id, annonce.user_id),
    getUserPhotos(annonce.user_id, { propertyId: annonce.property_id }),
    getMerchantProfile(annonce.user_id),
  ]);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          {hasMerchant && merchant?.logo_storage_key ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/api/logs/image?path=${encodeURIComponent(merchant.logo_storage_key)}`}
              alt={merchant.raison_sociale || "Logo"}
              className="h-8 w-auto object-contain"
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
          <span className="text-xs text-muted font-light">
            {hasMerchant && merchant?.raison_sociale
              ? merchant.raison_sociale
              : "Annonce immobilière"}
          </span>
        </div>
      </header>

      {/* Hero photo — first completed photo, full-width above the fold */}
      {completedPhotos.length > 0 && (() => {
        // Prefer first photo from living_room group, fallback to first overall
        const heroPhoto = (photosByRoom["living_room"]?.[0]) || completedPhotos[0];
        return (
          <div className="w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/logs/image?path=${encodeURIComponent(heroPhoto.output_image_key!)}`}
              alt={heroPhoto.room_label || "Photo principale"}
              className="w-full aspect-[16/9] object-cover rounded-b-2xl"
              data-testid="annonce-hero-photo"
            />
          </div>
        );
      })()}

      {/* Content */}
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Title + key info */}
        <div className="mb-8 sm:mb-10">
          <h1
            className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3"
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
              className="text-xs bg-foreground text-background px-3 py-1.5 rounded-xl font-medium"
              data-testid="annonce-price"
            >
              {property.sale_price ? formatPrice(property.sale_price) : "Prix sur demande"}
            </span>
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

        {/* CTA — Call to action above fold (Marc P1) */}
        {hasMerchant && merchant?.telephone && (
          <div className="mb-8">
            <a
              href={`tel:${merchant.telephone}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sage text-white rounded-full text-sm font-medium hover:opacity-90 active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Appeler {merchant.raison_sociale || "le vendeur"}
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
            <p className="text-muted font-light">
              Aucune photo disponible pour cette annonce.
            </p>
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
            annonceUuid={params.uuid}
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

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-foreground/5 text-center pb-20">
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
      />
    </div>
  );
}
