/**
 * Caracteristiques section — shared between annonce and dossier pages.
 * Displays DPE, GES, etage, parking, cave, exposition, etc.
 * Only renders fields that are filled (no "Non renseigne").
 */

import { Property } from "@/lib/properties";

const DPE_COLORS: Record<string, string> = {
  A: "bg-[#319834] text-white",
  B: "bg-[#33a357] text-white",
  C: "bg-[#cbdb2a] text-foreground",
  D: "bg-[#f0e50a] text-foreground",
  E: "bg-[#f0b40a] text-foreground",
  F: "bg-[#eb6235] text-white",
  G: "bg-[#d7221f] text-white",
};

const GES_COLORS: Record<string, string> = {
  A: "bg-[#a9d6f5] text-foreground",
  B: "bg-[#78b9e7] text-foreground",
  C: "bg-[#559fd4] text-white",
  D: "bg-[#3c7cb5] text-white",
  E: "bg-[#2d5f8f] text-white",
  F: "bg-[#5b3a80] text-white",
  G: "bg-[#3e1f5e] text-white",
};

interface DossierCaracteristiquesProps {
  property: Property;
}

export default function DossierCaracteristiques({ property }: DossierCaracteristiquesProps) {
  const hasAny =
    property.dpe_classe ||
    property.ges_classe ||
    property.etage != null ||
    property.parking ||
    property.cave ||
    property.charges_copro_annuelles ||
    property.annee_construction ||
    property.exposition ||
    property.taxe_fonciere ||
    property.nb_lots_copro;

  if (!hasAny) return null;

  return (
    <div className="mb-8" data-testid="dossier-caracteristiques">
      <h2 className="text-sm font-medium text-foreground mb-4">
        Caract{"\u00E9"}ristiques
      </h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {/* DPE badge */}
        {property.dpe_classe && (
          <span
            className={`text-xs px-3 py-1.5 rounded-xl font-medium ${DPE_COLORS[property.dpe_classe] || "bg-foreground/10 text-foreground"}`}
            data-testid="dossier-dpe-badge"
          >
            DPE {property.dpe_classe}
          </span>
        )}

        {/* GES badge */}
        {property.ges_classe && (
          <span
            className={`text-xs px-3 py-1.5 rounded-xl font-medium ${GES_COLORS[property.ges_classe] || "bg-foreground/10 text-foreground"}`}
            data-testid="dossier-ges-badge"
          >
            GES {property.ges_classe}
          </span>
        )}

        {/* Passoire thermique */}
        {property.dpe_classe && (property.dpe_classe === "F" || property.dpe_classe === "G") && (
          <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-xl font-medium" data-testid="dossier-passoire">
            Passoire {"\u00E9"}nerg{"\u00E9"}tique
          </span>
        )}

        {/* Etage + ascenseur */}
        {property.etage != null && (
          <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light" data-testid="dossier-etage">
            {property.etage === 0 ? "RDC" : `${property.etage}e {"\u00E9"}tage`}
            {property.ascenseur ? " \u2014 ascenseur" : ""}
          </span>
        )}

        {/* Parking */}
        {property.parking && (
          <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light" data-testid="dossier-parking">
            Parking
          </span>
        )}

        {/* Cave */}
        {property.cave && (
          <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light" data-testid="dossier-cave">
            Cave
          </span>
        )}

        {/* Exposition */}
        {property.exposition && (
          <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light" data-testid="dossier-exposition">
            Exposition {property.exposition}
          </span>
        )}

        {/* Annee construction */}
        {property.annee_construction && (
          <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light" data-testid="dossier-annee">
            Construit en {property.annee_construction}
          </span>
        )}
      </div>

      {/* Charges + taxe + lots */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted font-light">
        {property.charges_copro_annuelles && (
          <span data-testid="dossier-charges">
            Charges copro : {property.charges_copro_annuelles.toLocaleString("fr-FR")} {"\u20AC"}/an
          </span>
        )}
        {property.taxe_fonciere && (
          <span data-testid="dossier-taxe">
            Taxe fonci{"\u00E8"}re : {property.taxe_fonciere.toLocaleString("fr-FR")} {"\u20AC"}/an
          </span>
        )}
        {property.nb_lots_copro && (
          <span data-testid="dossier-lots">
            Copropri{"\u00E9"}t{"\u00E9"} de {property.nb_lots_copro} lots
          </span>
        )}
      </div>
    </div>
  );
}
