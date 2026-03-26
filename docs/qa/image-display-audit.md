# Audit affichage images — Versiroom

Date : 2026-03-26 | Agent : @qa

## Tableau de synthese par scenario

| # | Scenario | Source image | Null gere | onError | Retry | Probleme |
|---|----------|-------------|-----------|---------|-------|----------|
| 1 | Hero avant/apres | `/api/demo?...` | N/A (URL fixe) | OUI (1 retry timer 2s) | OUI (1 retry) | Apres retry, si echec : `<img>` reste `display:none`, SVG visible = fallback OK |
| 2 | Mode Standard — resultats | data URI (base64 inline depuis `data.image`) | N/A (data URI) | NON | NON | Data URI = pas de requete reseau, fiable. Pas de probleme. |
| 3 | Mode Marchand — DossierResult | `/api/logs/image?path=...` | PARTIEL | NON | NON | **P1** — voir ci-dessous |
| 4 | Ma galerie — grille | `/api/logs/image?path=...` | OUI (fallback div) | OUI (hide img, show fallback) | NON | **P2** — pas de retry |
| 5 | Ma galerie — modal detail | `/api/logs/image?path=...` | OUI (conditionnel) | PARTIEL | NON | **P2** — `onError` set `src=""` sur output (loop potentielle img cassee) |
| 6 | Fiche bien — photos | `/api/logs/image?path=...` | OUI (fallback "Non disponible") | NON | NON | **P2** — aucun onError sur `<img>`, image cassee si 404 |
| 7 | Fiche bien — carte | `/api/logs/image?path=...` | OUI (conditionnel render) | NON | NON | **P2** — aucun onError, image cassee si storage fail |
| 8 | InlineGenerator — selection | `/api/logs/image?path=...` | OUI (div vide si pas de key) | NON | NON | **P2** — aucun onError |
| 9 | InlineGenerator — preview generation | `/api/logs/image?path=...` | OUI (div vide si pas de key) | NON | NON | **P2** — aucun onError |
| 10 | Annonce publique — hero | `/api/logs/image?path=...` | OUI (conditionnel render) | NON | NON | **P1** — page publique, image cassee visible par acquereurs |
| 11 | Annonce publique — galerie | `/api/logs/image?path=...` | NON (force `!` sur key) | NON | NON | **P1** — `output_image_key!` = crash si null, aucun onError |
| 12 | Annonce publique — lightbox | `/api/logs/image?path=...` | NON (force `!` sur key) | NON | NON | **P1** — meme probleme que galerie |
| 13 | Dossier public — hero | `/api/logs/image?path=...` | OUI (conditionnel render) | NON | NON | **P2** — pas d'onError |
| 14 | Dossier public — avant/apres | `/api/logs/image?path=...` | NON (`|| ""` = requete vide) | NON | NON | **P1** — `output_image_key || ""` envoie `path=` vide a l'API |
| 15 | DossierPublicView | `/api/logs/image?path=...` | NON (interface non-nullable) | NON | NON | **P1** — aucun onError, pages publiques partagees |
| 16 | PDF dossier | `getImage()` direct | OUI (null check) | OUI (try/catch JPG+PNG) | NON | OK — bien gere, espace vide si image absente |
| 17 | API /api/logs/image | Object Storage | OUI (400 si "null"/"undefined") | OUI (500 avec detail) | OUI (via withStorageRetry) | OK |

## Bugs identifies

### P0 — Critique (crash ou donnees corrompues)

Aucun P0.

### P1 — Haute (image cassee visible par les utilisateurs finaux)

**P1-1 : DossierResult — `inputImageKey || ""` envoie une requete invalide**
- Fichier : `components/DossierResult.tsx` ligne 165
- `src={/api/logs/image?path=${encodeURIComponent(photo.inputImageKey || "")}}` — si `inputImageKey` est null, envoie `path=` vide, l'API retourne un JSON 400 et le navigateur affiche l'icone image cassee.
- Meme probleme ligne 181 pour `outputImageKey`.
- Pas d'`onError` handler.
- Impact : mode Marchand, visible apres generation d'un dossier.

**P1-2 : Annonce publique — `output_image_key!` non-null assertion**
- Fichier : `app/annonce/[uuid]/page.tsx` lignes 209, 309, 316, 484
- Le code filtre `completedPhotos` avec `.filter(p => p.output_image_key)` en amont, MAIS les photos sont passees a `AnnonceGallery` avec `p.output_image_key!` — si le filtre est modifie ou contourne, crash TypeScript silencieux en runtime.
- L'image hero (ligne 209) et toutes les photos galerie n'ont aucun `onError`.
- Impact : page publique visible par les acquereurs potentiels.

**P1-3 : Dossier public — `output_image_key || ""` propage une requete vide**
- Fichier : `app/dossier/[uuid]/page.tsx` ligne 270
- `outputImageKey: p.output_image_key || ""` — une string vide est passee a `DossierPublicView` qui l'encode et envoie une requete `/api/logs/image?path=` vide.
- Aucun `onError` dans `DossierPublicView.tsx`.
- Impact : page publique partageable — image cassee chez le client.

**P1-4 : AnnonceGallery et DossierPublicView — zero onError sur toutes les `<img>`**
- Fichiers : `components/AnnonceGallery.tsx` lignes 58-63, `components/DossierPublicView.tsx` lignes 71-76, 92-97
- Si Object Storage est lent ou en erreur, TOUTES les images affichent l'icone cassee sans fallback.
- Impact : pages publiques, reputation professionnelle du marchand.

### P2 — Moyenne (UX degradee, pages privees)

**P2-1 : Fiche bien — aucun onError sur les `<img>` de photos**
- Fichier : `app/mes-biens/[id]/page.tsx` lignes 866-871
- Le null est gere (fallback "Non disponible"), mais si la key existe et que le storage echoue, image cassee.

**P2-2 : InlineGenerator — aucun onError sur les thumbnails**
- Fichier : `components/InlineGenerator.tsx` lignes 490-495, 598-605
- Le null est gere (div vide), mais erreur storage = image cassee.

**P2-3 : Galerie modal — `onError` set `src=""` puis modifie className**
- Fichier : `app/ma-galerie/page.tsx` lignes 452-455
- `e.currentTarget.src = ""` peut declencher un second `onerror` (boucle). La modification de className sur un `<img>` avec `flex` ne fait rien (img est un element remplace, `display: flex` est ignore).

## Synthese

- **2 composants bien proteges** : Hero homepage (SVG fallback + retry) et PDF (null check + try/catch).
- **6 composants sans aucun onError** : DossierResult, AnnonceGallery, DossierPublicView, Lightbox, fiche bien photos, InlineGenerator.
- **Pattern manquant global** : il n'existe pas de composant `<SafeImage>` reutilisable avec onError + fallback + retry optionnel. Chaque `<img>` reimplemente (ou pas) sa propre gestion d'erreur.
- **Les pages publiques (annonce, dossier) sont les plus exposees** et les moins protegees.

## Recommandation

Creer un composant `<StorageImage>` qui encapsule :
1. `onError` avec fallback visuel (placeholder gris + texte)
2. 1 retry automatique apres 2s (comme le hero)
3. Guard `null`/`undefined` sur la key (ne rend pas de `<img>` si key absente)
4. Reutiliser partout au lieu des `<img>` directs.

Signaler a @fullstack pour implementation.

---
**Handoff → @fullstack**
- Fichier produit : `docs/qa/image-display-audit.md`
- Bugs P1 : 4 bugs sur les pages publiques (DossierResult, annonce, dossier public, galeries)
- Bugs P2 : 3 bugs sur les pages privees (fiche bien, InlineGenerator, galerie modal)
- Recommandation : creer un composant `<StorageImage>` reutilisable avec onError + retry + null guard
- Points d'attention : les pages publiques `/annonce/[uuid]` et `/dossier/[uuid]` sont les plus critiques car visibles par les clients finaux des marchands de biens
---
