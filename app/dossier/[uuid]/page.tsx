/**
 * F4 — Mode Pro (ex Mode Marchand): Public shareable dossier page.
 *
 * /dossier/[uuid] — SSR, no auth required, mobile-friendly.
 * OpenGraph metadata for link preview in messaging apps.
 * Valid for 30 days after creation.
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getDossierByIdentifier,
  getDossierPhotos,
  isDossierExpired,
  getDossierTitle,
  formatPrice,
  formatSurface,
} from "@/lib/dossier";
import { getMerchantProfile } from "@/lib/merchant";
import { getPropertyByUserAndAddress } from "@/lib/properties";
import DossierPublicView from "@/components/DossierPublicView";
import DossierCaracteristiques from "@/components/DossierCaracteristiques";
import ContactSticky from "@/components/ContactSticky";
import MerchantInfoBlock from "@/components/MerchantInfoBlock";
import ShareButtons from "@/components/ShareButtons";
import RoomNav from "@/components/RoomNav";
import StorageImage from "@/components/StorageImage";
import MerchantBrandWrapper from "@/components/MerchantBrandWrapper";
import { translateRoomLabel } from "@/lib/constants";
import DossierAutoRefresh from "@/components/DossierAutoRefresh";
import DossierPrintView from "@/components/DossierPrintView";
import PrintPdfButton from "@/components/PrintPdfButton";

interface PageProps {
  params: { uuid: string };
}

// ─── Dynamic metadata for OG previews ────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { dossier } = await getDossierByIdentifier(params.uuid);

  if (!dossier || isDossierExpired(dossier)) {
    return {
      title: "Dossier expiré — Versimo",
      description: "Ce dossier de pré-commercialisation a expiré.",
    };
  }

  const title = getDossierTitle(dossier);
  const details: string[] = [];
  if (dossier.bien_type) details.push(dossier.bien_type);
  if (dossier.bien_surface) details.push(formatSurface(dossier.bien_surface));
  if (dossier.bien_prix) details.push(formatPrice(dossier.bien_prix));

  const description = details.length > 0
    ? `${title} — ${details.join(", ")}. Visuels meublés par Versimo.`
    : `${title} — Visuels meublés par Versimo.`;

  // Hero image for OG preview (first completed photo)
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://versimo.fr";
  const photos = await getDossierPhotos(dossier.uuid);
  const heroPhoto = photos.find((p) => p.status === "completed" && p.output_image_key);
  const ogImages = heroPhoto?.output_image_key
    ? [{ url: `${BASE_URL}/api/logs/image?path=${encodeURIComponent(heroPhoto.output_image_key)}`, width: 1200, height: 630, alt: title }]
    : [{ url: `${BASE_URL}/imageapres.jpg`, width: 1200, height: 630, alt: "Versimo — Home staging virtuel par IA" }];

  return {
    title: `${title} — Versimo`,
    description,
    openGraph: {
      title: `${title} — Visualisation Versimo`,
      description,
      type: "website",
      siteName: "Versimo",
      images: ogImages,
    },
  };
}

// ─── Server Component ────────────────────────────────────────────────
export default async function DossierPage({ params }: PageProps) {
  const { dossier, redirectToSlug } = await getDossierByIdentifier(params.uuid);

  // 301 redirect from UUID to slug for SEO + clean URLs
  if (redirectToSlug && dossier?.slug) {
    redirect(`/dossier/${dossier.slug}`);
  }

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

  // Canonical identifier for links: prefer slug, fallback to uuid
  const dossierIdentifier = dossier.slug || dossier.uuid;

  // Load photos + merchant profile + property + session (for characteristics + owner check)
  const [photos, profile, linkedProperty, session] = await Promise.all([
    getDossierPhotos(dossier.uuid),
    getMerchantProfile(dossier.user_id),
    dossier.bien_adresse
      ? getPropertyByUserAndAddress(dossier.user_id, dossier.bien_adresse)
      : null,
    getServerSession(authOptions),
  ]);
  const completedPhotos = photos.filter((p) => p.status === "completed");
  const hasMerchant = profile?.is_merchant === true;
  const isOwner = session?.user?.id === dossier.user_id;

  const title = getDossierTitle(dossier);

  return (
    <MerchantBrandWrapper
      font={hasMerchant ? profile?.police : null}
      couleurPrincipale={hasMerchant ? profile?.couleur_principale : null}
      couleurSecondaire={hasMerchant ? profile?.couleur_secondaire : null}
    >
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          {hasMerchant && profile?.logo_storage_key ? (
            <StorageImage
              imageKey={profile.logo_storage_key}
              alt={profile.raison_sociale || "Logo"}
              className="h-8 w-auto object-contain"
              loading="eager"
            />
          ) : hasMerchant && profile?.raison_sociale ? (
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: profile.couleur_principale || "#7D9B76" }}
            >
              {profile.raison_sociale
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0].toUpperCase())
                .join("")}
            </span>
          ) : (
            <span className="text-xl font-semibold text-foreground tracking-tighter">
              Versimo
            </span>
          )}
          <div className="flex items-center gap-3">
            {isOwner && (
              <a
                href={linkedProperty ? `/mes-biens/${linkedProperty.id}` : "/mes-biens"}
                className="inline-flex items-center gap-1 text-xs text-sage font-light hover:text-sage/80 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Modifier
              </a>
            )}
            <span className="text-xs text-muted font-light">
              {hasMerchant && profile?.raison_sociale ? profile.raison_sociale : "Dossier partagé"}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Hero photo — first completed photo above title (Marc P0-2) */}
        {completedPhotos[0]?.output_image_key && (
          <div className="mb-6 rounded-2xl overflow-hidden">
            <StorageImage
              imageKey={completedPhotos[0].output_image_key}
              alt={title}
              className="w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Title Section */}
        <div className="mb-8 sm:mb-12">
          <h1
            className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2"
            style={{ color: "var(--brand-primary, #1C1C1E)" }}
          >
            {title}
          </h1>

          {/* Description commerciale — split into visual paragraphs */}
          {dossier.description_commerciale ? (
            <div className="max-w-2xl space-y-4 mb-3">
              {dossier.description_commerciale.split(/\n\n+/).map((paragraph, idx) => (
                <p key={idx} className="text-sm text-muted font-light leading-relaxed">
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted font-light mb-3">
              Description en cours de r&eacute;daction.
            </p>
          )}

          {/* Property details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted font-light">
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
              <span>{dossier.nb_pieces} pièces</span>
            )}
            <span
              className="text-xs text-white px-3 py-1.5 rounded-xl font-medium"
              style={{ backgroundColor: "var(--brand-primary, #1C1C1E)" }}
            >
              {dossier.bien_prix ? formatPrice(dossier.bien_prix) : "Prix sur demande"}
            </span>
            {dossier.prix_moyen_m2 ? (
              <span className="text-xs bg-sage/10 text-sage px-3 py-1.5 rounded-xl font-medium">
                {dossier.prix_moyen_m2.toLocaleString("fr-FR")} €/m² (quartier)
              </span>
            ) : dossier.bien_prix && dossier.bien_surface && dossier.bien_surface > 0 ? (
              <span className="text-xs border border-foreground/10 text-muted px-3 py-1.5 rounded-full font-medium">
                {Math.round(dossier.bien_prix / dossier.bien_surface).toLocaleString("fr-FR")} €/m²
              </span>
            ) : null}
            {linkedProperty?.dpe_classe && (() => {
              const DPE_BADGE_COLORS: Record<string, string> = {
                A: "bg-[#319834] text-white",
                B: "bg-[#33a357] text-white",
                C: "bg-[#cbdb2a] text-foreground",
                D: "bg-[#f0e50a] text-foreground",
                E: "bg-[#f0b40a] text-foreground",
                F: "bg-[#eb6235] text-white",
                G: "bg-[#d7221f] text-white",
              };
              const cls = DPE_BADGE_COLORS[linkedProperty.dpe_classe!] || "bg-foreground/10 text-foreground";
              return (
                <span
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium ${cls}`}
                  data-testid="dossier-dpe-inline"
                >
                  DPE {linkedProperty.dpe_classe}
                </span>
              );
            })()}
          </div>

          <p className="text-xs text-muted/50 mt-2">
            Généré le {new Date(dossier.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>

        {/* Analyse du marché — prix au m² comparatif */}
        {dossier.bien_prix && dossier.bien_surface && dossier.bien_surface > 0 && (
          (() => {
            const prixM2Bien = Math.round(dossier.bien_prix! / dossier.bien_surface!);
            const prixM2Quartier = dossier.prix_moyen_m2;
            const ecart = prixM2Quartier
              ? Math.round(((prixM2Bien - prixM2Quartier) / prixM2Quartier) * 100)
              : null;

            return (
              <div className="mb-8 bg-foreground/[0.02] border border-foreground/5 rounded-2xl p-5" data-testid="dossier-market-analysis">
                <h2 className="text-sm font-medium text-foreground mb-4">Analyse du marché</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Prix au m² du bien */}
                  <div>
                    <p className="text-xs text-muted font-light mb-1">Prix au m² du bien</p>
                    <p className="text-lg font-semibold text-foreground">
                      {prixM2Bien.toLocaleString("fr-FR")} €/m²
                    </p>
                  </div>

                  {/* Prix moyen quartier */}
                  {prixM2Quartier && (
                    <div>
                      <p className="text-xs text-muted font-light mb-1">Prix moyen du quartier</p>
                      <p className="text-lg font-semibold text-foreground">
                        {prixM2Quartier.toLocaleString("fr-FR")} €/m²
                      </p>
                    </div>
                  )}

                  {/* Ecart */}
                  {ecart !== null && (
                    <div>
                      <p className="text-xs text-muted font-light mb-1">Écart</p>
                      <p className={`text-lg font-semibold ${ecart < 0 ? "text-sage" : ecart > 0 ? "text-orange-500" : "text-foreground"}`}>
                        {ecart > 0 ? "+" : ""}{ecart} %
                        <span className="text-xs font-light text-muted ml-1.5">
                          {ecart < 0 ? "sous le marché" : ecart > 0 ? "au-dessus du marché" : "dans la moyenne"}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* Map preview — iframe OSM (no server dependency) */}
        {dossier.latitude && dossier.longitude ? (
          <div className="mb-8 rounded-2xl border border-foreground/5 overflow-hidden max-w-lg">
            <iframe
              title="Carte du quartier"
              width="100%"
              height="250"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(dossier.longitude) - 0.008},${Number(dossier.latitude) - 0.005},${Number(dossier.longitude) + 0.008},${Number(dossier.latitude) + 0.005}&layer=mapnik&marker=${dossier.latitude},${dossier.longitude}`}
            />
          </div>
        ) : dossier.carte_image_key ? (
          <div className="mb-8 rounded-2xl border border-foreground/5 overflow-hidden max-w-lg">
            <StorageImage
              imageKey={dossier.carte_image_key}
              alt="Carte du quartier"
              className="w-full h-auto"
            />
          </div>
        ) : null}

        {/* Caracteristiques from property */}
        {linkedProperty && (
          <DossierCaracteristiques property={linkedProperty} />
        )}

        {/* Share buttons + Room navigation */}
        {completedPhotos.length > 0 && (
          <div className="mb-6 space-y-4">
            <ShareButtons
              sharePath={`/dossier/${dossierIdentifier}`}
              shareTitle={title}
            />
            <RoomNav
              rooms={completedPhotos.map((p) => ({
                id: `piece-${p.id}`,
                label: translateRoomLabel(p.room_label, `Photo ${p.photo_index + 1}`),
              }))}
            />
          </div>
        )}

        {/* Photos grid */}
        {completedPhotos.length === 0 ? (
          (dossier.status === "generating" || dossier.status === "draft") ? (
            <DossierAutoRefresh dossierUuid={dossier.uuid} />
          ) : (
            <div className="text-center py-16">
              <p className="text-muted font-light">
                Aucun visuel disponible pour ce dossier.
              </p>
            </div>
          )
        ) : (
          <>
            <DossierPublicView
              photos={completedPhotos.map((p) => ({
                id: p.id,
                roomLabel: translateRoomLabel(p.room_label, `Photo ${p.photo_index + 1}`),
                inputImageKey: p.input_image_key || "",
                outputImageKey: p.output_image_key || "",
              }))}
              dossierUuid={dossierIdentifier}
            />
            {dossier.status === "partial" && (
              <p className="text-sm text-muted mt-2">
                Ce dossier présente {completedPhotos.length} visuel{completedPhotos.length > 1 ? "s" : ""} sur {photos.length} — certaines pièces n&apos;ont pas pu être générées.
              </p>
            )}
          </>
        )}

        {/* PDF download — browser print (HD) + legacy fallback */}
        {completedPhotos.length > 0 && (
          <div className="text-center mt-8 sm:mt-12 no-print">
            <PrintPdfButton
              title={title}
              fallbackPdfUrl={`/api/dossier/${dossier.uuid}/pdf`}
            />
          </div>
        )}

        {/* Merchant info block — before footer */}
        {hasMerchant && profile && (
          <div className="mt-10 mb-10">
            <MerchantInfoBlock
              raisonSociale={profile.raison_sociale}
              adresse={profile.adresse}
              telephone={profile.telephone}
              emailPro={profile.email_pro}
              siret={profile.siret}
              logoStorageKey={profile.logo_storage_key}
              couleurPrincipale={profile.couleur_principale}
            />
          </div>
        )}

        {/* Footer */}
        <div
          className="mt-12 pt-6 border-t text-center space-y-2 pb-20"
          style={{ borderColor: "var(--brand-secondary, rgba(28,28,30,0.05))" }}
        >
          {hasMerchant && (profile?.raison_sociale || profile?.telephone || profile?.email_pro) && (
            <p className="text-xs text-muted font-light">
              {[profile?.raison_sociale, profile?.telephone, profile?.email_pro].filter(Boolean).join(" — ")}
            </p>
          )}
          <p className="text-sm text-muted/60 font-light">
            Visuels d&apos;aménagement générés par intelligence artificielle — le bien est livré brut. Ces images sont à titre indicatif et ne sont pas contractuelles.
          </p>
          <p className="text-xs text-muted/40 font-light mt-1">
            Disponible jusqu&apos;au {new Date(dossier.expires_at).toLocaleDateString("fr-FR")}
          </p>
          <p className="text-xs text-muted/40 font-light mt-1">
            <a
              href="https://versimo.fr/"
              className="hover:text-muted/60 transition-colors underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Versimo
            </a>
            {" "}&mdash; © {new Date().getFullYear()}
          </p>
        </div>
      </main>

      {/* Sticky contact CTA */}
      <ContactSticky
        telephone={hasMerchant ? profile?.telephone : null}
        email={hasMerchant ? profile?.email_pro : null}
        raisonSociale={hasMerchant ? profile?.raison_sociale : null}
        title={title}
        brandColor={hasMerchant ? profile?.couleur_principale : null}
      />

      {/* Print-only view — hidden on screen, shown in @media print */}
      {completedPhotos.length > 0 && (
        <DossierPrintView
          title={title}
          description={dossier.description_commerciale}
          address={dossier.bien_adresse}
          bienType={dossier.bien_type}
          surface={dossier.bien_surface ? formatSurface(dossier.bien_surface) : null}
          nbPieces={dossier.nb_pieces}
          price={dossier.bien_prix ? formatPrice(dossier.bien_prix) : null}
          pricePerM2={
            dossier.bien_prix && dossier.bien_surface && dossier.bien_surface > 0
              ? Math.round(dossier.bien_prix / dossier.bien_surface).toLocaleString("fr-FR")
              : null
          }
          prixMoyenM2={
            dossier.prix_moyen_m2
              ? dossier.prix_moyen_m2.toLocaleString("fr-FR")
              : null
          }
          dateCreated={new Date(dossier.created_at).toLocaleDateString("fr-FR")}
          photos={completedPhotos.map((p) => ({
            id: p.id,
            roomLabel: translateRoomLabel(p.room_label, `Photo ${p.photo_index + 1}`),
            inputImageKey: p.input_image_key || "",
            outputImageKey: p.output_image_key || "",
            styleLabel: p.style_id || undefined,
          }))}
          merchant={
            hasMerchant && profile
              ? {
                  raisonSociale: profile.raison_sociale,
                  adresse: profile.adresse,
                  telephone: profile.telephone,
                  emailPro: profile.email_pro,
                  siret: profile.siret,
                  logoStorageKey: profile.logo_storage_key,
                  couleurPrincipale: profile.couleur_principale,
                }
              : null
          }
          property={
            linkedProperty
              ? {
                  dpeClasse: linkedProperty.dpe_classe,
                  gesClasse: linkedProperty.ges_classe,
                }
              : null
          }
          dossierUrl={`https://versimo.fr/dossier/${dossierIdentifier}`}
        />
      )}
    </div>
    </MerchantBrandWrapper>
  );
}
