/**
 * F4 — Mode Marchand: Public shareable dossier page.
 *
 * /dossier/[uuid] — SSR, no auth required, mobile-friendly.
 * OpenGraph metadata for link preview in messaging apps.
 * Valid for 30 days after creation.
 */

import { Metadata } from "next";
import {
  getDossierByUuid,
  getDossierPhotos,
  isDossierExpired,
  getDossierTitle,
  formatPrice,
  formatSurface,
} from "@/lib/dossier";
import { getMerchantProfile } from "@/lib/merchant";
import DossierPublicView from "@/components/DossierPublicView";
import ContactSticky from "@/components/ContactSticky";
import ShareButtons from "@/components/ShareButtons";
import RoomNav from "@/components/RoomNav";

interface PageProps {
  params: { uuid: string };
}

// ─── Dynamic metadata for OG previews ────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dossier = await getDossierByUuid(params.uuid);

  if (!dossier || isDossierExpired(dossier)) {
    return {
      title: "Dossier expiré — Versiroom",
      description: "Ce dossier de pré-commercialisation a expiré.",
    };
  }

  const title = getDossierTitle(dossier);
  const details: string[] = [];
  if (dossier.bien_type) details.push(dossier.bien_type);
  if (dossier.bien_surface) details.push(formatSurface(dossier.bien_surface));
  if (dossier.bien_prix) details.push(formatPrice(dossier.bien_prix));

  const description = details.length > 0
    ? `${title} — ${details.join(", ")}. Visuels meublés par Versiroom.`
    : `${title} — Visuels meublés par Versiroom.`;

  return {
    title: `${title} — Versiroom`,
    description,
    openGraph: {
      title: `${title} — Visualisation Versiroom`,
      description,
      type: "website",
      siteName: "Versiroom",
    },
  };
}

// ─── Server Component ────────────────────────────────────────────────
export default async function DossierPage({ params }: PageProps) {
  const dossier = await getDossierByUuid(params.uuid);

  // Dossier not found
  if (!dossier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Dossier introuvable
          </h1>
          <p className="text-muted font-light text-sm">
            Ce dossier n&apos;existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  // Dossier expired
  if (isDossierExpired(dossier)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Dossier expiré
          </h1>
          <p className="text-muted font-light text-sm">
            Ce dossier de pré-commercialisation a expiré.
            <br />
            Les dossiers sont disponibles pendant 30 jours après leur création.
          </p>
          <p className="text-xs text-muted/50 mt-4">
            Généré le {new Date(dossier.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
    );
  }

  // Load photos + merchant profile
  const [photos, profile] = await Promise.all([
    getDossierPhotos(params.uuid),
    getMerchantProfile(dossier.user_id),
  ]);
  const completedPhotos = photos.filter((p) => p.status === "completed");
  const hasMerchant = profile?.is_merchant === true;

  const title = getDossierTitle(dossier);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          {hasMerchant && profile?.logo_storage_key ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/api/logs/image?path=${encodeURIComponent(profile.logo_storage_key)}`}
              alt={profile.raison_sociale || "Logo"}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="text-xl font-semibold text-foreground tracking-tighter">
              Versiroom
            </span>
          )}
          <span className="text-xs text-muted font-light">
            {hasMerchant && profile?.raison_sociale ? profile.raison_sociale : "Dossier partagé"}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Title Section */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-2">
            {title}
          </h1>

          {/* Description commerciale */}
          {dossier.description_commerciale && (
            <p className="text-sm text-muted font-light mb-3 max-w-2xl">
              {dossier.description_commerciale}
            </p>
          )}

          {/* Property details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted font-light">
            {dossier.bien_adresse && (
              <span>{dossier.bien_adresse}</span>
            )}
            {dossier.bien_type && (
              <span className="capitalize">{dossier.bien_type}</span>
            )}
            {dossier.bien_surface && (
              <span>{formatSurface(dossier.bien_surface)}</span>
            )}
            {dossier.nb_pieces && (
              <span>{dossier.nb_pieces} pi{"\u00E8"}ces</span>
            )}
            {dossier.bien_prix && (
              <span>{formatPrice(dossier.bien_prix)}</span>
            )}
            {dossier.prix_moyen_m2 && (
              <span className="text-sage">
                {dossier.prix_moyen_m2.toLocaleString("fr-FR")} {"\u20AC"}/m{"\u00B2"} (quartier)
              </span>
            )}
          </div>

          <p className="text-xs text-muted/50 mt-2">
            Généré le {new Date(dossier.created_at).toLocaleDateString("fr-FR")} — Disponible jusqu&apos;au {new Date(dossier.expires_at).toLocaleDateString("fr-FR")}
          </p>
        </div>

        {/* Map preview */}
        {dossier.carte_image_key && (
          <div className="mb-8 rounded-2xl border border-foreground/5 overflow-hidden max-w-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/logs/image?path=${encodeURIComponent(dossier.carte_image_key)}`}
              alt="Carte du quartier"
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Share buttons + Room navigation */}
        {completedPhotos.length > 0 && (
          <div className="mb-6 space-y-4">
            <ShareButtons
              sharePath={`/dossier/${params.uuid}`}
              shareTitle={title}
            />
            <RoomNav
              rooms={completedPhotos.map((p) => ({
                id: `piece-${p.id}`,
                label: p.room_label || `Photo ${p.photo_index + 1}`,
              }))}
            />
          </div>
        )}

        {/* Photos grid */}
        {completedPhotos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted font-light">
              {dossier.status === "generating"
                ? "Génération en cours, revenez dans quelques instants."
                : "Aucun visuel disponible pour ce dossier."}
            </p>
          </div>
        ) : (
          <>
            <DossierPublicView
              photos={completedPhotos.map((p) => ({
                id: p.id,
                roomLabel: p.room_label || `Photo ${p.photo_index + 1}`,
                inputImageKey: p.input_image_key || "",
                outputImageKey: p.output_image_key || "",
              }))}
              dossierUuid={params.uuid}
            />
            {dossier.status === "partial" && (
              <p className="text-sm text-muted mt-2">
                Ce dossier présente {completedPhotos.length} visuel{completedPhotos.length > 1 ? "s" : ""} sur {photos.length} — certaines pièces n&apos;ont pas pu être générées.
              </p>
            )}
          </>
        )}

        {/* PDF download link */}
        {completedPhotos.length > 0 && (
          <div className="text-center mt-8 sm:mt-12">
            <a
              href={`/api/dossier/${params.uuid}/pdf`}
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
              data-testid="dossier-download-pdf"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Télécharger le PDF
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-foreground/5 text-center space-y-2 pb-20">
          {hasMerchant && (profile?.raison_sociale || profile?.telephone || profile?.email_pro) && (
            <p className="text-xs text-muted font-light">
              {[profile?.raison_sociale, profile?.telephone, profile?.email_pro].filter(Boolean).join(" — ")}
            </p>
          )}
          <p className="text-sm text-muted/60 font-light">
            Les visuels meubl{"\u00E9"}s sont g{"\u00E9"}n{"\u00E9"}r{"\u00E9"}s par intelligence artificielle {"\u00E0"} des fins de projection. Ils ne sont pas contractuels.
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
        telephone={hasMerchant ? profile?.telephone : null}
        email={hasMerchant ? profile?.email_pro : null}
        raisonSociale={hasMerchant ? profile?.raison_sociale : null}
      />
    </div>
  );
}
