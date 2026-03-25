/**
 * F6 — Annonce immobiliere publique.
 *
 * /annonce/[uuid] — SSR, no auth required, mobile-friendly.
 * OpenGraph metadata for link preview in messaging apps.
 * Valid for 90 days after creation.
 */

import { Metadata } from "next";
import { getAnnonceByUuid, isAnnonceExpired, isAnnonceActive } from "@/lib/annonce";
import { getPropertyById } from "@/lib/properties";
import { getUserPhotos } from "@/lib/user-photos";
import { getMerchantProfile } from "@/lib/merchant";
import AnnoncePublicView from "@/components/AnnoncePublicView";

interface PageProps {
  params: { uuid: string };
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  living_room: "Salon",
  bedroom: "Chambre",
  kitchen: "Cuisine",
  bathroom: "Salle de bain",
  office: "Bureau",
  dining_room: "Salle a manger",
  hallway: "Entree",
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

  if (!annonce || isAnnonceExpired(annonce)) {
    return {
      title: "Annonce expiree - Versiroom",
      description: "Cette annonce a expire.",
    };
  }

  const property = await getPropertyById(annonce.property_id, annonce.user_id);
  const title = annonce.title || "Annonce immobiliere";

  const details: string[] = [];
  if (property?.surface_m2) details.push(`${property.surface_m2}m\u00B2`);
  if (property?.room_count) details.push(`${property.room_count} pi\u00E8ces`);
  if (property?.sale_price) details.push(formatPrice(property.sale_price));

  const description = details.length > 0
    ? `${title} - ${details.join(", ")}. Visuels par Versiroom.`
    : `${title} - Visuels par Versiroom.`;

  return {
    title: `${title} - Versiroom`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Versiroom",
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
            Cette annonce n&apos;existe pas ou a ete supprimee.
          </p>
        </div>
      </div>
    );
  }

  // Expired or archived
  if (!isAnnonceActive(annonce)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Annonce expiree
          </h1>
          <p className="text-muted font-light text-sm">
            Cette annonce n&apos;est plus disponible.
          </p>
          <p className="text-xs text-muted/50 mt-4">
            Publiee le {new Date(annonce.created_at).toLocaleDateString("fr-FR")}
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
            Le bien associe a cette annonce n&apos;existe plus.
          </p>
        </div>
      </div>
    );
  }

  const completedPhotos = photos.filter((p) => p.output_image_key);
  const title = annonce.title || "Annonce immobiliere";
  const description = property.description_final || property.description_generated;
  const hasMerchant = merchant?.is_merchant === true;

  // Group photos by room_type
  const photosByRoom: Record<string, typeof completedPhotos> = {};
  for (const photo of completedPhotos) {
    const key = photo.room_type || "other";
    if (!photosByRoom[key]) photosByRoom[key] = [];
    photosByRoom[key].push(photo);
  }

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
          ) : (
            <span className="text-xl font-semibold text-foreground tracking-tighter">
              Versiroom
            </span>
          )}
          <span className="text-xs text-muted font-light">
            {hasMerchant && merchant?.raison_sociale
              ? merchant.raison_sociale
              : "Annonce immobiliere"}
          </span>
        </div>
      </header>

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
            {property.sale_price && (
              <span
                className="text-xs bg-foreground text-background px-3 py-1.5 rounded-xl font-medium"
                data-testid="annonce-price"
              >
                {formatPrice(property.sale_price)}
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

        {/* Photo gallery grouped by room */}
        {completedPhotos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted font-light">
              Aucune photo disponible pour cette annonce.
            </p>
          </div>
        ) : (
          <div className="space-y-8 mb-10" data-testid="annonce-gallery">
            {Object.entries(photosByRoom).map(([roomType, roomPhotos]) => (
              <div key={roomType}>
                <h2 className="text-sm font-medium text-foreground mb-3">
                  {ROOM_TYPE_LABELS[roomType] || roomType === "other"
                    ? ROOM_TYPE_LABELS[roomType] || "Autres"
                    : roomType}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {roomPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative bg-foreground/[0.02] rounded-2xl overflow-hidden border border-foreground/5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/logs/image?path=${encodeURIComponent(photo.output_image_key!)}`}
                        alt={photo.room_label || ROOM_TYPE_LABELS[photo.room_type || ""] || "Photo"}
                        className="w-full aspect-[4/3] object-cover"
                        loading="lazy"
                      />
                      {photo.room_label && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                          <span className="text-[10px] text-white/90 font-medium">
                            {photo.room_label}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="mb-10" data-testid="annonce-description">
            <h2 className="text-sm font-medium text-foreground mb-3">Description</h2>
            <p className="text-sm text-muted font-light leading-relaxed whitespace-pre-line max-w-2xl">
              {description}
            </p>
          </div>
        )}

        {/* Contact */}
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
              {merchant?.email_pro && (
                <a
                  href={`mailto:${merchant.email_pro}`}
                  className="block text-sm text-muted font-light hover:text-foreground transition-colors"
                  data-testid="annonce-email"
                >
                  {merchant.email_pro}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action buttons — client component */}
        {completedPhotos.length > 0 && (
          <AnnoncePublicView
            annonceUuid={params.uuid}
            description={description || ""}
            photos={completedPhotos.map((p) => ({
              id: p.id,
              outputImageKey: p.output_image_key!,
              roomLabel: p.room_label || ROOM_TYPE_LABELS[p.room_type || ""] || "Photo",
            }))}
          />
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-foreground/5 text-center">
          <p className="text-xs text-muted/40 font-light">
            Annonce generee par{" "}
            <a
              href="https://architecture-toum92.replit.app/"
              className="hover:text-muted/60 transition-colors underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Versiroom
            </a>
            {" "}&mdash; Visuels generes par intelligence artificielle a titre de simulation.
          </p>
        </div>
      </main>
    </div>
  );
}
