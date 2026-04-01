"use client";

/**
 * DossierPrintView — Print-optimized layout for /dossier/[uuid].
 *
 * Hidden on screen (display:none), shown only in @media print.
 * Renders a clean multi-page PDF layout:
 *   - Cover page: hero image, title, description, property details, merchant info
 *   - One page per room: before (top) + after (bottom) stacked vertically
 *   - Footer: AI disclaimer on every page
 *
 * Uses the same StorageImage component for image URLs.
 * The browser's print engine handles pagination, fonts (Inter), and image rendering.
 */

import StorageImage from "@/components/StorageImage";

interface PrintPhoto {
  id: number;
  roomLabel: string;
  inputImageKey: string;
  outputImageKey: string;
  styleLabel?: string;
}

interface MerchantInfo {
  raisonSociale: string | null;
  adresse: string | null;
  telephone: string | null;
  emailPro: string | null;
  siret: string | null;
  logoStorageKey: string | null;
  couleurPrincipale: string | null;
}

interface PropertyInfo {
  dpeClasse?: string | null;
  gesClasse?: string | null;
}

interface DossierPrintViewProps {
  title: string;
  description: string | null;
  address: string | null;
  bienType: string | null;
  surface: string | null;
  nbPieces: number | null;
  price: string | null;
  pricePerM2: string | null;
  prixMoyenM2: string | null;
  dateCreated: string;
  photos: PrintPhoto[];
  merchant: MerchantInfo | null;
  property: PropertyInfo | null;
  dossierUrl: string;
}

const AI_DISCLAIMER = "Visuels d\u2019am\u00e9nagement g\u00e9n\u00e9r\u00e9s par intelligence artificielle \u2014 le bien est livr\u00e9 brut. Images non contractuelles.";

export default function DossierPrintView({
  title,
  description,
  address,
  bienType,
  surface,
  nbPieces,
  price,
  pricePerM2,
  prixMoyenM2,
  dateCreated,
  photos,
  merchant,
  property,
  dossierUrl,
}: DossierPrintViewProps) {
  return (
    <div className="print-only hidden" aria-hidden="true">
      {/* ─── Cover Page ─────────────────────────────────────────── */}
      <div className="print-cover">
        {/* Header: logo/brand + merchant info */}
        <div className="flex items-start justify-between mb-6">
          <div>
            {merchant?.logoStorageKey ? (
              <StorageImage
                imageKey={merchant.logoStorageKey}
                alt={merchant.raisonSociale || "Logo"}
                className="h-10 w-auto object-contain"
                loading="eager"
              />
            ) : merchant?.raisonSociale ? (
              <span
                className="text-lg font-semibold"
                style={{ color: merchant.couleurPrincipale || "#1C1C1E" }}
              >
                {merchant.raisonSociale}
              </span>
            ) : (
              <span className="text-lg font-semibold text-[#1C1C1E] tracking-tighter">
                Versimo
              </span>
            )}
          </div>
          {merchant && (
            <div className="text-right text-[9pt] text-[#666]">
              {merchant.raisonSociale && <div>{merchant.raisonSociale}</div>}
              {merchant.adresse && <div>{merchant.adresse}</div>}
              {merchant.telephone && <div>{merchant.telephone}</div>}
              {merchant.emailPro && <div>{merchant.emailPro}</div>}
            </div>
          )}
        </div>

        {/* Hero image */}
        {photos[0]?.outputImageKey && (
          <div className="print-cover-hero mb-5">
            <StorageImage
              imageKey={photos[0].outputImageKey}
              alt={title}
              className="w-full rounded-lg"
              loading="eager"
            />
          </div>
        )}

        {/* Title */}
        <h1
          className="text-[22pt] font-semibold tracking-tight mb-2"
          style={{ color: merchant?.couleurPrincipale || "#1C1C1E" }}
        >
          {title}
        </h1>

        {/* Description */}
        {description && (
          <div className="mb-3 max-w-[480pt]">
            {description.split(/\n\n+/).map((paragraph, idx) => (
              <p key={idx} className="text-[10pt] text-[#555] leading-relaxed mb-2">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        )}

        {/* Property details line */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9pt] text-[#666] mb-2">
          {address && <span>{address}</span>}
          {bienType && <span className="capitalize">{bienType}</span>}
          {surface && <span>{surface}</span>}
          {nbPieces && <span>{nbPieces} pièces</span>}
          {price && (
            <span
              className="text-white px-2.5 py-1 rounded-lg font-medium text-[8pt]"
              style={{ backgroundColor: merchant?.couleurPrincipale || "#1C1C1E" }}
            >
              {price}
            </span>
          )}
          {pricePerM2 && (
            <span className="text-[8pt] border border-[#ddd] px-2.5 py-1 rounded-full">
              {pricePerM2} €/m²
            </span>
          )}
          {prixMoyenM2 && (
            <span className="text-[8pt] bg-[#7D9B76]/10 text-[#7D9B76] px-2.5 py-1 rounded-lg font-medium">
              {prixMoyenM2} €/m² (quartier)
            </span>
          )}
          {property?.dpeClasse && (
            <span className="text-[8pt] font-medium px-2.5 py-1 rounded-lg bg-[#7D9B76] text-white">
              DPE {property.dpeClasse}
            </span>
          )}
        </div>

        {/* Date */}
        <p className="text-[8pt] text-[#999] mb-4">
          Généré le {dateCreated}
        </p>

        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />

        {/* Cover footer */}
        <div className="border-t border-[#eee] pt-3 mt-4">
          <p className="text-[7pt] text-[#999] text-center">
            {AI_DISCLAIMER}
          </p>
          <p className="text-[7pt] text-[#bbb] text-center mt-1">
            {dossierUrl} — Versimo © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* ─── Photo Pages (one per room) ─────────────────────────── */}
      {photos.map((photo) => (
        <div key={photo.id} className="print-photo-page">
          {/* Room label */}
          <div className="mb-3 pb-2 border-b border-[#eee]">
            <h2
              className="text-[13pt] font-semibold"
              style={{ color: merchant?.couleurPrincipale || "#1C1C1E" }}
            >
              {photo.roomLabel}
              {photo.styleLabel && (
                <span className="text-[10pt] font-normal text-[#888] ml-2">
                  — {photo.styleLabel}
                </span>
              )}
            </h2>
          </div>

          {/* Before image */}
          <div className="mb-1">
            <p className="text-[7pt] font-semibold text-[#999] uppercase tracking-widest mb-1">
              Avant home staging
            </p>
            <StorageImage
              imageKey={photo.inputImageKey}
              alt={`${photo.roomLabel} — avant`}
              className="w-full rounded"
              loading="eager"
            />
          </div>

          {/* Separator */}
          <div className="border-t border-[#7D9B76]/20 my-2" />

          {/* After image */}
          <div className="mb-1">
            <p className="text-[7pt] font-semibold uppercase tracking-widest mb-1" style={{ color: "#7D9B76" }}>
              Après home staging
            </p>
            <StorageImage
              imageKey={photo.outputImageKey}
              alt={`${photo.roomLabel} — après`}
              className="w-full rounded"
              loading="eager"
            />
          </div>

          {/* Page footer */}
          <div className="mt-auto pt-3">
            <p className="text-[7pt] text-[#999] text-center">
              {AI_DISCLAIMER}
            </p>
            {merchant?.raisonSociale && (
              <p className="text-[7pt] text-[#bbb] text-center mt-0.5">
                {[merchant.raisonSociale, merchant.telephone].filter(Boolean).join(" — ")}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* ─── Merchant Info Page (last page, if merchant) ─────────── */}
      {merchant && (merchant.raisonSociale || merchant.telephone || merchant.emailPro) && (
        <div className="print-photo-page flex flex-col items-center justify-center text-center">
          <div className="flex-1" />

          {merchant.logoStorageKey && (
            <div className="mb-4">
              <StorageImage
                imageKey={merchant.logoStorageKey}
                alt={merchant.raisonSociale || "Logo"}
                className="h-16 w-auto object-contain mx-auto"
                loading="eager"
              />
            </div>
          )}

          {merchant.raisonSociale && (
            <h2
              className="text-[18pt] font-semibold mb-4"
              style={{ color: merchant.couleurPrincipale || "#1C1C1E" }}
            >
              {merchant.raisonSociale}
            </h2>
          )}

          <div
            className="w-24 h-px mx-auto mb-4"
            style={{ backgroundColor: merchant.couleurPrincipale || "#1C1C1E", opacity: 0.3 }}
          />

          <div className="text-[10pt] text-[#555] space-y-1.5">
            {merchant.adresse && <p>{merchant.adresse}</p>}
            {merchant.telephone && <p className="font-semibold text-[12pt]">{merchant.telephone}</p>}
            {merchant.emailPro && <p>{merchant.emailPro}</p>}
            {merchant.siret && <p className="text-[9pt] text-[#999]">SIRET : {merchant.siret}</p>}
          </div>

          <p className="text-[8pt] text-[#999] mt-6">
            Voir le dossier en ligne : {dossierUrl}
          </p>

          <div className="flex-1" />

          <div className="border-t border-[#eee] pt-3 mt-4 w-full">
            <p className="text-[7pt] text-[#bbb]">
              Dossier généré par Versimo — versimo.fr — © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
