# Audit final — Annonce + Dossier : atteindre 10/10
> Personas : Thomas Berger (marchand de biens, 35 ans) et Marc Leroy (acquereur, iPhone, 30 secondes)
> Date : 2026-03-26

---

## Score global

| Persona | Score actuel | Cible |
|---|---|---|
| Thomas (marchand) | **7.6 / 10** | 10 / 10 |
| Marc (acquereur) | **7.2 / 10** | 10 / 10 |

---

## Criteres Thomas

### C1 — Titre vendeur et pro : 7/10
**Probleme.** `app/api/annonce/route.ts` L.77-104 genere "T3 60 m² — Rue Henri Barbusse, Le Mans". Format factuel correct mais pas vendeur. Thomas ne peut pas editer le titre depuis l'annonce publique — le lien "Modifier" (L.201-209) renvoie vers `/mes-biens/[id]`, pas vers un champ titre inline.

**Fix P0.** Dans `app/api/annonce/route.ts` L.77-93, integrer `property.propertyType` dans le titre : `Appartement T3 60 m² — Centre-ville, Le Mans`. Ajouter un champ titre editable dans la page de gestion du bien (PATCH `/api/annonce/[uuid]`).

### C2 — Description complete : 8/10
**Probleme.** `generateDescription()` dans `enrich-property/route.ts` L.189-195 n'injette que type/surface/adresse/nbPieces/prixMoyenM2. Les champs riches (`dpe_classe`, `parking`, `cave`, `etage`, `exposition`) sont ignores lors de l'appel depuis `api/properties/route.ts` L.47-52.

**Fix P1.** Passer `dpeClasse`, `parking`, `etage`, `exposition` dans l'appel `enrichProperty()` (L.47-52) et les injecter dans `userParts` (L.189-195). Le system prompt (L.173) gere deja ces infos si fournies.

### C3 — Infos financieres claires : 8/10
**Probleme.** Prix/m2 DU BIEN absent de l'annonce publique (`annonce/page.tsx` L.265-270) — seul le prix quartier DVF est affiche. Les charges copro (L.449-452) sont en texte gris minuscule, invisibles sur mobile.

**Fix P1.** `annonce/page.tsx` L.265 : ajouter pill `${Math.round(sale_price/surface_m2).toLocaleString()} €/m²` conditionnel sur `sale_price && surface_m2`. L.449-464 : passer les charges en pill identique aux autres caracteristiques.

### C4 — Dossier fait "plaquette pro" : 8/10
**Probleme.** Date "Genere le 26/03/2026" (`dossier/page.tsx` L.226-228) affichee en evidence sous le titre — impression de document perime. Le copyright Versiroom en footer (L.381-390) affaiblit la marque blanche quand `hasMerchant` est true.

**Fix P1.** `dossier/page.tsx` L.226 : remplacer par "Dossier de pre-commercialisation" ou deplacer la date dans le footer discret. L.381-390 : conditionner `{!hasMerchant && <a href="...">Versiroom</a>}`.

### C5 — Thomas peut tout modifier avant envoi : 6/10
**Probleme majeur.** Aucun champ titre editable sur l'annonce. Description generee par IA sans bouton "Regenerer" ni textarea editable. Thomas ne peut pas corriger une description ratee avant de partager le lien.

**Fix P0.** Dans `/mes-biens/[id]` : ajouter champ titre editable (PATCH `/api/annonce/[uuid]`), bouton "Regenerer la description" (re-appel `/api/merchant/enrich-property`), textarea description editable avec sauvegarde.

---

## Criteres Marc

### C6 — Comprendre le bien en 30s sur iPhone : 7/10
**Probleme.** Sur mobile les pills surface/pieces/prix (L.248-275) sont en `flex-wrap` et peuvent se reordonner si le titre est long. Pas de recap visuel fixe et hierarchise au-dessus de la fold.

**Fix P1.** `annonce/page.tsx` L.248 : entourer les 3 pills critiques (surface, pieces, prix) dans un `div` avec `flex flex-nowrap gap-2 mb-2`, separes des pills secondaires (ville, quartier DVF).

### C7 — Appeler en 1 tap : 9/10
**Ce qui est bien.** CTA "Appeler" au-dessus de la fold (L.287-298) + `ContactSticky` (L.532-538). Quasi-parfait.

**Probleme mineur.** Si `hasMerchant=false`, zero bouton d'appel — Marc lit l'annonce sans pouvoir contacter.

**Fix P2.** Afficher un lien email de contact si `telephone` absent mais `email_pro` present — cas edge mais existant.

### C8 — Photos aident a se projeter : 8/10
**Probleme.** Aucune mention visible que les visuels sont des projections IA. La mention "Projection d'amenagement" est en footer (L.516-517), jamais vue sur mobile. Marc peut douter de la realite du bien.

**Fix P1.** `annonce/page.tsx` L.234 (apres la hero photo) : ajouter `<p className="text-xs text-muted/60 text-center py-1.5">Visuels d'amenagement — bien livre vide</p>`.

### C9 — Quartier decrit (transports, ecoles, commerces) : 7/10
**Probleme majeur.** L'annonce publique n'affiche PAS de carte. Le dossier a une carte OSM (`dossier/page.tsx` L.280-301) mais l'annonce n'en a aucune. Marc voit l'adresse texte (L.279-283) mais aucune localisation visuelle.

**Fix P0.** `annonce/page.tsx` apres L.283 : ajouter le meme bloc iframe OSM que le dossier, conditionnel sur `property.latitude && property.longitude`. Verifier que `lib/properties.ts` expose ces colonnes — si absent, les ajouter et les alimenter depuis `enrichProperty()`.

### C10 — Marc a envie d'appeler apres lecture : 7/10
**Probleme.** La page annonce se termine sur le footer Versiroom (L.509-528), pas sur un CTA. L'ordre actuel : photos → description → caracteristiques → contact → actions partage → footer. Marc finit sa lecture sur le branding, pas sur l'invite a agir.

**Fix P1.** `annonce/page.tsx` : reordonner → hero → prix/CTA1 → photos → description → CTA2 (bouton "Appeler" identique a L.287) → caracteristiques → contact → footer.

---

## Corrections priorisees

### P0 — Bloquant (score < 7)

| # | Fichier | Ligne | Action |
|---|---|---|---|
| 1 | `app/mes-biens/[id]` | — | Ajouter titre editable + textarea description + bouton regenerer |
| 2 | `annonce/[uuid]/page.tsx` | Apres L.283 | Ajouter iframe carte OSM conditionnel sur lat/lon |
| 3 | `app/api/annonce/route.ts` | L.77-93 | Integrer `propertyType` dans le titre auto-genere |

### P1 — Important (score 7-8)

| # | Fichier | Ligne | Action |
|---|---|---|---|
| 4 | `annonce/[uuid]/page.tsx` | L.265 | Pill prix/m2 du bien (`sale_price / surface_m2`) |
| 5 | `annonce/[uuid]/page.tsx` | L.234 | Mention "Visuels d'amenagement — bien livre vide" sous hero |
| 6 | `annonce/[uuid]/page.tsx` | L.287-298 | Dupliquer CTA "Appeler" en fin de page avant footer |
| 7 | `annonce/[uuid]/page.tsx` | L.248 | flex-nowrap sur pills surface/pieces/prix |
| 8 | `dossier/[uuid]/page.tsx` | L.226-228 | Masquer date de generation ou la deplacer en footer |
| 9 | `dossier/[uuid]/page.tsx` | L.381-390 | Conditionner lien Versiroom a `!hasMerchant` |
| 10 | `app/api/properties/route.ts` | L.47-52 | Passer dpe/parking/etage/exposition a `enrichProperty` |

### P2 — Amelioration (score 8-9)

| # | Fichier | Ligne | Action |
|---|---|---|---|
| 11 | `annonce/[uuid]/page.tsx` | L.449-464 | Passer charges copro en pill visible (meme style que autres) |
| 12 | `annonce/[uuid]/page.tsx` | L.199 | Si `!hasMerchant && email_pro`, afficher lien email de contact |

---

## Tests UX — Validation post-correction

| Test | Critere de succes | Statut |
|---|---|---|
| Thomas modifie le titre avant partage | Champ editable dans tableau de bord | ❌ |
| Carte visible sur l'annonce publique | Iframe OSM si lat/lon present | ❌ |
| Marc comprend en 5s que le bien est livre vide | Mention texte sous la hero | ❌ |
| Prix/m2 du bien visible sans calcul | Pill explicite sur l'annonce | ❌ |
| CTA "Appeler" visible apres lecture complete | Bouton en fin de page | ❌ |
| Dossier sans date de generation apparente | Date masquee ou en footer | ❌ |
| Copyright Versiroom absent sur dossier marchand | Conditionnel `!hasMerchant` | ❌ |

---

**Handoff → @fullstack**
- Fichier produit : `docs/reviews/final-audit-10-10.md`
- Corrections P0 (a traiter en priorite) : carte OSM annonce, titre editable annonce, `propertyType` dans titre auto
- Corrections P1 : pill prix/m2 bien, mention IA sous hero, CTA duplique en fin de page, masquage date dossier, whitlabel Versiroom
- Point d'attention critique : verifier que `properties` table expose `latitude`/`longitude` avant d'ajouter la carte annonce — si absent, ajouter la colonne dans `lib/properties.ts` et l'alimenter depuis `enrichProperty()`
