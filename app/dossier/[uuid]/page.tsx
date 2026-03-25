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
import DossierPublicView from "@/components/DossierPublicView";

interface PageProps {
  params: { uuid: string };
}

// ─── Dynamic metadata for OG previews ────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dossier = await getDossierByUuid(params.uuid);

  if (!dossier || isDossierExpired(dossier)) {
    return {
      title: "Dossier expire — Versiroom",
      description: "Ce dossier de pre-commercialisation a expire.",
    };
  }

  const title = getDossierTitle(dossier);
  const details: string[] = [];
  if (dossier.bien_type) details.push(dossier.bien_type);
  if (dossier.bien_surface) details.push(formatSurface(dossier.bien_surface));
  if (dossier.bien_prix) details.push(formatPrice(dossier.bien_prix));

  const description = details.length > 0
    ? `${title} — ${details.join(", ")}. Visualisation par Versiroom.`
    : `${title} — Visualisation par Versiroom.`;

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
            Ce dossier n&apos;existe pas ou a ete supprime.
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
            Dossier expire
          </h1>
          <p className="text-muted font-light text-sm">
            Ce dossier de pre-commercialisation a expire.
            <br />
            Les dossiers sont disponibles pendant 30 jours apres leur creation.
          </p>
          <p className="text-xs text-muted/50 mt-4">
            Cree le {new Date(dossier.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
    );
  }

  // Load photos
  const photos = await getDossierPhotos(params.uuid);
  const completedPhotos = photos.filter((p) => p.status === "completed");

  const title = getDossierTitle(dossier);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <span className="text-xl font-semibold text-foreground tracking-tighter">
            Versiroom
          </span>
          <span className="text-xs text-muted font-light">
            Dossier partage
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
            {dossier.bien_prix && (
              <span>{formatPrice(dossier.bien_prix)}</span>
            )}
          </div>

          <p className="text-xs text-muted/50 mt-2">
            Cree le {new Date(dossier.created_at).toLocaleDateString("fr-FR")} — Expire le {new Date(dossier.expires_at).toLocaleDateString("fr-FR")}
          </p>
        </div>

        {/* Photos grid */}
        {completedPhotos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted font-light">
              {dossier.status === "generating"
                ? "Generation en cours..."
                : "Aucune visualisation disponible."}
            </p>
          </div>
        ) : (
          <DossierPublicView
            photos={completedPhotos.map((p) => ({
              id: p.id,
              roomLabel: p.room_label || `Photo ${p.photo_index + 1}`,
              inputImageKey: p.input_image_key || "",
              outputImageKey: p.output_image_key || "",
            }))}
            dossierUuid={params.uuid}
          />
        )}

        {/* PDF download link */}
        {completedPhotos.length > 0 && (
          <div className="text-center mt-8 sm:mt-12">
            <a
              href={`/api/dossier/${params.uuid}/pdf`}
              className="inline-flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
              data-testid="dossier-download-pdf"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Telecharger le PDF
            </a>
          </div>
        )}

        {/* AI Disclaimer */}
        <div className="mt-12 pt-6 border-t border-foreground/5 text-center">
          <p className="text-xs text-muted/40 font-light">
            Simulation generee par intelligence artificielle — Versiroom
          </p>
        </div>
      </main>
    </div>
  );
}
