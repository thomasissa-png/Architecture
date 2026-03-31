/**
 * MerchantInfoBlock — Bloc "Votre interlocuteur" pour les pages publiques
 * annonce et dossier. Affiche les coordonnees du marchand de biens.
 *
 * Regle : si un champ est absent, la ligne n'est pas affichee.
 * Ne s'affiche pas du tout si merchantProfile est null ou is_merchant=false.
 */

import StorageImage from "@/components/StorageImage";

interface MerchantInfoBlockProps {
  raisonSociale: string | null;
  adresse: string | null;
  telephone: string | null;
  emailPro: string | null;
  siret: string | null;
  logoStorageKey: string | null;
  couleurPrincipale?: string;
}

export default function MerchantInfoBlock({
  raisonSociale,
  adresse,
  telephone,
  emailPro,
  siret,
  logoStorageKey,
  couleurPrincipale,
}: MerchantInfoBlockProps) {
  // Nothing to show if no info at all
  const hasAnyInfo = raisonSociale || adresse || telephone || emailPro || siret;
  if (!hasAnyInfo) return null;

  return (
    <section
      className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl p-6 sm:p-8"
      data-testid="merchant-info-block"
    >
      <h2 className="text-sm font-medium text-foreground mb-5">
        Votre interlocuteur
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        {/* Logo or initials */}
        {logoStorageKey ? (
          <div className="shrink-0">
            <StorageImage
              imageKey={logoStorageKey}
              alt={raisonSociale || "Logo"}
              className="h-14 w-auto max-w-[140px] object-contain rounded-xl"
            />
          </div>
        ) : raisonSociale ? (
          <div
            className="shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl text-lg font-semibold text-white"
            style={{ backgroundColor: couleurPrincipale || "#7D9B76" }}
          >
            {raisonSociale
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0].toUpperCase())
              .join("")}
          </div>
        ) : null}

        {/* Info lines */}
        <div className="space-y-2 min-w-0">
          {raisonSociale && (
            <p
              className="text-sm font-semibold"
              style={{ color: couleurPrincipale || "#1C1C1E" }}
            >
              {raisonSociale}
            </p>
          )}

          {adresse && (
            <p className="text-sm text-muted font-normal leading-relaxed">
              {adresse}
            </p>
          )}

          {telephone && (
            <p className="text-sm text-muted font-normal">
              <span className="text-muted/60 mr-1.5">Tel.</span>
              <a
                href={`tel:${telephone}`}
                className="hover:text-foreground transition-colors"
              >
                {telephone}
              </a>
            </p>
          )}

          {emailPro && (
            <p className="text-sm text-muted font-normal">
              <span className="text-muted/60 mr-1.5">Email</span>
              <a
                href={`mailto:${emailPro}`}
                className="hover:text-foreground transition-colors"
              >
                {emailPro}
              </a>
            </p>
          )}

          {siret && (
            <p className="text-xs text-muted/50 font-light mt-3">
              SIRET {siret}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
