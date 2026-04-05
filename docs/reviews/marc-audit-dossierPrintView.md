# Audit Acheteur — DossierPrintView (fallback browser-print) — 2026-04-05

**Persona** : Marc Leroy, 38 ans, cadre tech Bordeaux, iPhone 14 Pro, 40+ visites, 30 secondes pour décider.
**Périmètre audité** : `components/DossierPrintView.tsx` + styles `@media print` dans `app/globals.css` + données transmises depuis `app/dossier/[uuid]/page.tsx`.
**Contexte de déclenchement** : ce composant est rendu quand `hasPdf: false` (pas de PDF pré-généré en Object Storage). `PrintPdfButton` déclenche `window.print()`, le navigateur applique `@media print`, `.screen-only` disparaît, `.print-only` s'affiche.

---

## Verdict rapide

**PEUT-ETRE — Marc hésite.** Le PDF browser-print est lisible et structuré, mais il souffre de trois lacunes sérieuses par rapport à la page web : l'analyse de marché (avec l'écart en %) disparaît, la carte OSM est absente, et les caractéristiques détaillées du bien (étage, parking, charges, taxe foncière) ne sont pas transmises. Sur iPhone, `max-height: 38vh` sur chaque photo risque de rendre les avant/après trop petits pour juger la transformation. Le disclaimer IA est présent partout. Le contact vendeur est présent sur chaque page. La confiance est là — mais les informations décisionnelles manquantes poussent Marc à aller chercher le lien web plutôt que d'appeler directement depuis le PDF.

---

## Notes

| # | Critere | Note /10 | Observation |
|---|---------|----------|-------------|
| 1 | Premiere impression | 7/10 | La couverture existe : hero image (première photo meublée), titre en 22pt, prix en badge couleur brand. Mais `max-height: 40vh` pour le hero signifie ~260px sur un écran A4 — correct sans être saisissant. Pas d'image de couverture pleine page. La hiérarchie cover existe mais reste timide. |
| 2 | Qualite des visuels | 6/10 | `max-height: 38vh` par image sur les pages pièces (avant + après empilées) = ~240px chacune sur A4. En portrait A4 (842pt de haut), chaque image n'occupe qu'un tiers de la hauteur utile. La transformation avant/après n'est pas immédiatement impressive — les photos sont trop petites pour que Marc juge la qualité IA. Le `object-fit: contain` (pas `cover`) laisse des bandes noires potentielles si les ratios sont différents. |
| 3 | Informations essentielles | 7/10 | Prix (badge couleur brand), surface, nombre de pièces, adresse, type de bien, DPE, prix/m² du bien ET prix/m² du quartier sont tous présents sur la couverture. GES absent (transmis dans `property` mais non affiché). La couverture est dense en infos critiques. Perte notable : pas de calcul de l'écart % bien vs quartier (affiché sur la page web dans `data-testid="dossier-market-analysis"`). |
| 4 | Projection dans les pieces | 7/10 | Une page par pièce, avant en haut / après en bas avec séparateur vert sage, labels "Avant home staging" / "Après home staging". La structure est claire. Mais la taille réduite des photos (38vh max) affaiblit l'impact de la projection. Le `styleLabel` (id du style, ex: `scandinavian`) est affiché brut — Marc voit "scandinavian" pas "Scandinave". |
| 5 | Organisation par piece | 8/10 | Titres de pièces en couleur brand, pagination automatique (une page par pièce via `page-break-before: always`), séparateur coloré entre avant/après. La hiérarchie est nette. Seul bémol : pas de numérotation des pages ni de sommaire en couverture. |
| 6 | Contact vendeur | 8/10 | Footer de chaque page pièce : raison sociale + téléphone du marchand. Page de clôture complète : logo, raison sociale, adresse, téléphone (en 12pt, mis en avant), email, SIRET, lien dossier web. Très complet. Point négatif : les coordonnées en PDF browser-print ne sont pas des liens cliquables (les liens PDF ne sont pas générés par `window.print()`). Marc ne peut pas "tapper" le numéro depuis un PDF browser. |
| 7 | Partage conjoint(e) | 6/10 | Le PDF browser-print n'a pas de lien de partage direct. Le `dossierUrl` est imprimé en bas de couverture et sur la dernière page — Marc peut retaper l'URL ou scanner s'il y avait un QR code (absent ici, contrairement au PDF pdf-lib v4). Pour partager à sa conjointe le soir sur MacBook, Marc est obligé de retourner sur la page web ou de retaper l'URL. |
| 8 | Mobile iPhone | 5/10 | C'est le point faible principal. Sur iPhone, `window.print()` ouvre l'aperçu natif iOS qui simule une impression A4. Les images `max-height: 38vh` sont calculées par rapport à la viewport de l'aperçu, pas par rapport au papier. Le rendu final en PDF peut être satisfaisant sur desktop Chrome/Safari, mais sur iOS Safari l'aperçu d'impression compresse souvent les images différemment. Pas de test possible sans device physique, mais la dépendance au moteur d'impression natif iOS est une fragilité structurelle. Par ailleurs, `object-fit: contain` vs `cover` peut produire des images flottantes dans leur cadre. |
| 9 | Confiance / credibilite | 8/10 | Disclaimer IA présent sur CHAQUE page (couverture + toutes les pages pièces) : "Visuels d'aménagement générés par intelligence artificielle — le bien est livré brut. Images non contractuelles." Page de clôture avec SIRET du marchand = signal fort de professionnalisme. Branding marchand (couleur + logo) cohérent. Legère perte vs PDF pdf-lib v4 : pas de numéro de page, pas de QR code. |
| 10 | Rapidite de decision | 6/10 | La couverture contient les infos critiques (prix, surface, localisation, DPE). Marc peut scanner en 10 secondes. Mais l'absence de l'analyse de marché (écart %) et des caractéristiques détaillées force un retour sur la page web pour décider. Le PDF n'est pas auto-suffisant pour la décision — il est un aperçu visuel, pas un dossier complet. Marc finira par appeler, mais depuis la page web, pas depuis le PDF. |

**Moyenne** : 6.8 / 10

---

## Les 3 questions fondamentales

| Question | Note /10 | Observation |
|----------|----------|-------------|
| Ca a l'air PRO ? | 7/10 | Branding marchand (couleur, logo), structure en pages, disclaimer légal, SIRET sur la dernière page. Pro mais pas premium — le PDF pdf-lib v4 est plus soigné (QR code, pagination, polices). |
| C'est COHERENT ? | 8/10 | Photos avant/après correctement étiquetées, infos couverture cohérentes avec la page web, style label présent par pièce. Un seul incohérence : `styleLabel` affiché en id technique (`scandinavian`) et non en label FR (`Scandinave`). |
| Ca me fait APPELER ? | 6/10 | Le téléphone est visible sur chaque page footer et sur la dernière page. Mais les liens ne sont pas cliquables en browser-print — Marc doit mémoriser ou retaper. Sur desktop c'est acceptable, sur iPhone c'est une friction réelle. |

---

## Problemes critiques

### P1 — Analyse du marché absente du PDF (critique pour Marc)

La section `data-testid="dossier-market-analysis"` de la page web (prix/m² du bien, prix/m² du quartier, écart %) n'est pas dans `DossierPrintView`. Or c'est LA donnée décisionnelle pour Marc : il compare systématiquement 5-10 annonces, et la première chose qu'il regarde après le prix, c'est si le bien est sous ou au-dessus du marché. Cette information existe (les props `pricePerM2` et `prixMoyenM2` sont transmises), mais elle n'est affichée que comme badges inline dans la ligne de détails de couverture — sans le calcul de l'écart et son interprétation textuelle ("sous le marché", "dans la moyenne", "+8% au-dessus").

**Impact** : Marc voit "3 200 €/m²" et "3 500 €/m² (quartier)" dans des badges, mais doit faire le calcul mental. Sur la page web, il voit directement "-8% sous le marché" en vert sage. La décision est plus rapide sur web que sur PDF.

### P2 — Caractéristiques détaillées absentes du PDF

`DossierCaracteristiques` (étage + ascenseur, parking, cave, exposition, année construction, charges copro annuelles, taxe foncière, nombre de lots copro, GES) est rendu dans la page web via `linkedProperty`. Ces données sont transmises à `DossierPrintView` via la prop `property`, mais seuls `dpeClasse` et `gesClasse` sont dans l'interface — et même le GES n'est pas rendu dans le composant (l'interface le prévoit mais aucun élément JSX ne l'affiche).

Les charges de copropriété et la taxe foncière sont des critères attendus standard pour Marc (il a visité 40+ biens, il les cherche systématiquement). Leur absence du PDF oblige un retour sur la page web.

### P3 — Carte absente du PDF

La carte OSM (iframe) ou l'image `carte_image_key` est visible sur la page web. Elle n'est pas dans `DossierPrintView`. Un iframe ne s'imprime pas. Si une image statique de la carte (`carte_image_key`) est disponible, elle pourrait être incluse dans le PDF — mais elle ne l'est pas.

**Impact** : Marc est obsédé par la localisation (critère n°3 dans son processus de décision). L'adresse seule ne suffit pas — il veut voir le quartier, les rues, la proximité transports.

---

## Ameliorations recommandees

### A1 — Ajouter un bloc "Analyse du marché" en couverture PDF (P1)

Après les badges de détails et avant la date, ajouter un mini-bloc 3 colonnes (ou 3 items en ligne) reprenant le calcul qui existe déjà dans `page.tsx` :

```tsx
{pricePerM2 && prixMoyenM2 && (() => {
  const p1 = parseInt(pricePerM2.replace(/\s/g, ""), 10);
  const p2 = parseInt(prixMoyenM2.replace(/\s/g, ""), 10);
  const ecart = Math.round(((p1 - p2) / p2) * 100);
  return (
    <div className="flex gap-4 text-[8pt] mt-2 p-2 bg-[#f9f9f7] rounded-lg">
      <div>
        <p className="text-[#999] mb-0.5">Prix/m² du bien</p>
        <p className="font-semibold text-[#1C1C1E]">{pricePerM2} €/m²</p>
      </div>
      <div>
        <p className="text-[#999] mb-0.5">Quartier</p>
        <p className="font-semibold text-[#1C1C1E]">{prixMoyenM2} €/m²</p>
      </div>
      <div>
        <p className="text-[#999] mb-0.5">Écart</p>
        <p className={`font-semibold ${ecart < 0 ? "text-[#7D9B76]" : "text-orange-500"}`}>
          {ecart > 0 ? "+" : ""}{ecart}%
          <span className="font-normal text-[#999] ml-1">
            {ecart < 0 ? "sous le marché" : ecart > 0 ? "au-dessus" : "dans la moyenne"}
          </span>
        </p>
      </div>
    </div>
  );
})()}
```

### A2 — Ajouter les caractéristiques détaillées en couverture (P2)

Transmettre les champs `etage`, `parking`, `cave`, `exposition`, `charges_copro_annuelles`, `taxe_fonciere`, `gesClasse` dans l'interface `PropertyInfo` et les afficher sous forme de badges après la ligne de prix — même logique que `DossierCaracteristiques`. Cela représente 4-5 lignes JSX conditionnelles.

### A3 — Ajouter l'image statique de la carte si disponible (P3)

Transmettre `carteImageKey` en prop optionnelle et, si disponible, afficher un `StorageImage` sous les caractéristiques en couverture (ou en dernière page avant la page marchand). Limiter à `max-height: 120pt` pour ne pas dépasser la couverture.

```tsx
{carteImageKey && (
  <div className="mt-3 rounded overflow-hidden" style={{ maxHeight: "120pt" }}>
    <StorageImage imageKey={carteImageKey} alt="Carte du quartier" className="w-full" loading="eager" />
  </div>
)}
```

### A4 — Corriger le styleLabel (mineure)

`photo.style_id` est un identifiant technique (`scandinavian`, `art_deco`). Il faudrait un mapping vers le label FR ou passer directement `styleLabel` depuis le composant parent avec le libellé humain.

### A5 — Augmenter la hauteur des photos pièces sur A4

Remplacer `max-height: 38vh` par une logique basée sur le contenu de la page. Sur A4 portrait (842pt de haut), avec un header pièce (~30pt), deux images, deux labels, un séparateur et un footer, chaque image peut occuper jusqu'à ~320pt soit ~38% de la hauteur totale. Utiliser `height: 36vh` avec `object-fit: cover` (pas `contain`) pour remplir le cadre sans bandes noires.

---

## Ce qui fonctionne bien

- **Disclaimer IA sur chaque page** : présent en footer de la couverture ET de chaque page pièce. Légalement correct, rassure Marc.
- **Page de clôture marchand** : logo centré, coordonnées complètes, SIRET, lien web. Professionnelle.
- **Branding marchand appliqué** : couleur primaire sur les titres, le prix, le séparateur, le footer de couverture. Le PDF est visuellement cohérent avec la page web.
- **Séparateur avant/après vert sage** : le contraste visuel entre la photo brute et la photo meublée est bien marqué. Marc comprend instantanément ce que le home staging apporte.
- **Une pièce par page** : la pagination automatique est correcte, chaque pièce a son propre espace.
- **Prix + surface + DPE visibles sans scroll** en couverture.

---

## Contexte : PDF browser-print vs PDF pdf-lib

Ce composant est le **fallback** déclenché quand `hasPdf: false`. En production, dès que le PDF est pré-généré via `/api/dossier/[uuid]/pdf` (pdf-lib, audité en V4 — note 8.6/10), c'est ce dernier qui est téléchargé directement. `DossierPrintView` n'est utilisé que :
1. Avant que le PDF pdf-lib soit généré (latence entre création du dossier et génération PDF)
2. En cas d'échec de génération PDF serveur

**Recommandation** : les corrections A1/A2/A3 restent utiles pour le fallback, mais la priorité doit aller à la fiabilité du PDF pdf-lib (s'assurer que `hasPdf: true` dans 100% des cas réussis). Si le PDF pdf-lib est toujours disponible, ce composant devient une assurance-qualité dégradée plutôt qu'un chemin critique.

---

**Note finale** : 6.8 / 10 — PEUT-ETRE (Marc consulte la page web pour compléter, appelle depuis là)
**Note PDF pdf-lib v4** (audit précédent) : 8.6 / 10 — OUI (Marc appelle directement)
**Gap à combler** : +1.8 pt — principalement sur l'analyse de marché (A1) et les caractéristiques (A2).
