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

interface PageProps {
  params: { uuid: string };
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  living_room: "Salon",
  bedroom: "Chambre",
  kitchen: "Cuisine",
  bathroom: "Salle de bain",
  office: "Bureau",
  dining_room: "Salle \u00E0 manger",
  hallway: "Entr\u00E9e",
  terrace: "Terrasse",
  balcony: "Balcon",
  garden: "Jardin",
};

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
      description: "Cette annonce n'existe pas ou a \u00E9t\u00E9 supprim\u00E9e.",
      robots: "noindex, nofollow",
    };
  }

  const [property, photos] = await Promise.all([
    getPropertyById(annonce.property_id, annonce.user_id),
    getUserPhotos(annonce.user_id, { propertyId: annonce.property_id }),
  ]);
  const title = annonce.title || "Annonce immobili\u00E8re";

  const details: string[] = [];
  if (property?.surface_m2) details.push(`${property.surface_m2}m\u00B2`);
  if (property?.room_count) details.push(`${property.room_count} pi\u00E8ces`);
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
            Cette annonce n&apos;existe pas ou a \u00E9t\u00E9 supprim\u00E9e.
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
            Cette annonce n&apos;existe pas ou a \u00E9t\u00E9 supprim\u00E9e.
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
            Le bien associ{"\u00E9"} {"\u00E0"} cette annonce n&apos;existe plus.
          </p>
        </div>
      </div>
    );
  }

  const completedPhotos = photos.filter((p) => p.output_image_key);
  const title = annonce.title || "Annonce immobili\u00E8re";
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
              : "Annonce immobili\u00E8re"}
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
                {property.surface_m2} m{"\u00B2"}
              </span>
            )}
            {property.room_count && (
              <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light">
                {property.room_count} pi{"\u00E8"}ce{property.room_count > 1 ? "s" : ""}
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
                Prix moyen quartier : {property.dvf_median_price_m2.toLocaleString("fr-FR")} {"\u20AC"}/m{"\u00B2"}
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

        {/* Description */}
        <div className="mb-10" data-testid="annonce-description">
          <h2 className="text-sm font-medium text-foreground mb-3">Description</h2>
          {description ? (
            <p className="text-sm text-muted font-light leading-relaxed whitespace-pre-line max-w-2xl">
              {description}
            </p>
          ) : (
            <p className="text-sm text-muted font-light">
              Description en cours de r{"\u00E9"}daction
            </p>
          )}
        </div>

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
            Projection d&apos;am{"\u00E9"}nagement r{"\u00E9"}alis{"\u00E9"}e par Versiroom — le bien est livr{"\u00E9"} brut. Visuels non contractuels.
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
            {" "}&mdash; {"\u00A9"} {new Date().getFullYear()}
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
