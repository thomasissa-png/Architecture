# Rapport QA -- Session v36 (branche claude/session-recovery-analysis-jNy97)

Date : 2026-04-01
Agent : @qa
Commits audites : 5c4faf6, ca21fe6, a6bc3a3, 8acf302, 36bf05c, f81f0ce, 1df377f, 7fb587b, 2c9455f, b89a5f0

---

## Resume

| Resultat | Nombre |
|----------|--------|
| PASS     | 24     |
| FAIL     | 2      |
| WARNING  | 1      |

**Verdict : GO CONDITIONNEL** -- 2 FAIL a corriger avant deploy.

---

## 1. Coherence route.ts / generation-pipeline.ts

| Test | Statut | Details |
|------|--------|---------|
| 1.1 Constantes DSLR_LINE identiques | PASS | Identique dans les 2 fichiers (ligne 123 route.ts, ligne 105 generation-pipeline.ts). |
| 1.2 Constantes CEILING_PRESERVATION identiques | PASS | Identique dans les 2 fichiers. |
| 1.3 Constantes LIGHT_PRESERVATION identiques | PASS | Identique dans les 2 fichiers. |
| 1.4 Constantes WALL_PRESERVATION identiques | PASS | Identique, inclut "Do not add baseboards or moldings unless already present in the input." (v36 safeguard). |
| 1.5 Constantes CAMERA_PRESERVATION identiques | PASS | Identique dans les 2 fichiers. |
| 1.6 Constantes EQUIPMENT_PRESERVATION identiques | PASS | Identique, inclut "No curtains." (v36 safeguard). |
| 1.7 Constantes CONTACT_SHADOWS identiques | PASS | Identique dans les 2 fichiers. |
| 1.8 Constantes DEPTH_DISTRIBUTION identiques | PASS | Identique dans les 2 fichiers. |
| 1.9 IMAGE_MODEL configurable via env var | PASS | `(process.env.IMAGE_MODEL as string) \|\| "gpt-image-1"` dans les 2 fichiers. |
| 1.10 Import getStyleMaterialHint present | PASS | Importe depuis `@/lib/room-types` dans les 2 fichiers. |
| 1.11 Logique hasDedicatedBuilder identique | PASS | Meme liste ROOMS_WITH_DEDICATED_BUILDERS, meme logique `rt.roomFurnitureOverride + getStyleMaterialHint(styleId)` dans les 2 fichiers. |
| 1.12 PROMPT_VERSION coherent | **FAIL** | Les commentaires referent "v36" (5 occurrences dans chaque fichier) mais `PROMPT_VERSION` est toujours `"v35"` dans les 2 fichiers. Le PROMPT_VERSION aurait du etre incremente a "v36" puisque les commits 2c9455f et b89a5f0 modifient la structure des prompts (action-first token order, safeguards curtains/baseboards). **Impact** : les logs de generation en DB enregistreront "v35" au lieu de "v36", rendant l'audit croise Yann/Lucas impossible a coreler avec la bonne version. |
| 1.13 Ordre tokens action FIRST (passe 1) | PASS | Tous les builders commencent par `Edit this photo of a room. Apply this surface finish:` dans les 2 fichiers. CAMERA_PRESERVATION + LIGHT_PRESERVATION avant-dernier, DSLR_LINE en dernier. |
| 1.14 Ordre tokens action FIRST (passe 2) | PASS | Tous les builders commencent par `Add the following [...] to this photo of a finished room:` dans les 2 fichiers. CAMERA_PRESERVATION vers la fin, DSLR en dernier. |

---

## 2. TypeScript compilation

| Test | Statut | Details |
|------|--------|---------|
| 2.1 tsc --noEmit | PASS | Unique erreur dans `scripts/test-generation.ts:85` (pre-existante, hors scope). Aucune nouvelle erreur TypeScript introduite par les 10 commits. |

---

## 3. ESLint

| Test | Statut | Details |
|------|--------|---------|
| 3.1 next lint | PASS | "No ESLint warnings or errors". Aucune erreur introduite. |

---

## 4. Imports utilises

| Test | Statut | Details |
|------|--------|---------|
| 4.1 route.ts : getStyleMaterialHint utilise | PASS | Utilise ligne 1016. |
| 4.2 route.ts : ROOM_TYPES utilise | PASS | Utilise ligne 1014. |
| 4.3 route.ts : applyRoomTypeOverrides utilise | PASS | 3 occurrences. |
| 4.4 generation-pipeline.ts : imports identiques | PASS | getStyleMaterialHint (ligne 670), ROOM_TYPES (ligne 668), applyRoomTypeOverrides (2 occurrences). |

---

## 5. PDF generation

| Test | Statut | Details |
|------|--------|---------|
| 5.1 pdf-generator.ts utilise saveRawBuffer | PASS | Import ligne 11, utilise ligne 89 avec cle `dossiers/{uuid}/dossier.pdf`. Correct. |
| 5.2 dossier/[uuid]/pdf/route.ts : logique Y positions | PASS | Cover page : flux descendant coherent (headerY=792, heroStartY=732, heroHeight=220, yPos descent). Photo pages : beforeY=787, imgAreaHeight=356, afterY=401 -- pas de superposition. |
| 5.3 dossier/[uuid]/pdf/route.ts : saveImage vs saveRawBuffer | **FAIL** | Ligne 17 importe `saveImage` et ligne 983 l'utilise pour sauvegarder le PDF genere par pdf-lib. `saveImage()` convertit depuis base64 et enregistre sous `logs/dossier_{uuid}_pdf.jpg` -- cle incorrecte (extension .jpg pour un PDF, prefixe logs/ au lieu de dossiers/). Devrait utiliser `saveRawBuffer(Buffer.from(pdfBytes), 'dossiers/${uuid}/dossier.pdf')` comme le fait `lib/pdf-generator.ts`. **Impact** : le PDF genere a la volee par la route est stocke avec une cle .jpg, et le `pdf_storage_key` enregistre en DB pointe vers `logs/dossier_{uuid}_pdf.jpg` au lieu de `dossiers/{uuid}/dossier.pdf`. Le pre-generated PDF (via Puppeteer) et le fallback pdf-lib utilisent des cles differentes, ce qui peut causer un double stockage ou un 404 au rechargement. |
| 5.4 PrintPdfButton.tsx : fallback simplifie supprime | PASS | Le fallback est maintenant `window.print()` avec preparation des images print-only. Pas de generation PDF inline simplifiee. |
| 5.5 DossierPrintView.tsx : masque a l'ecran | PASS | `className="print-only hidden"` + `aria-hidden="true"`. CSS `@media print` override avec `display: block !important` dans globals.css. |

---

## 6. Style material hints

| Test | Statut | Details |
|------|--------|---------|
| 6.1 12 styles presents dans STYLE_MATERIAL_HINTS | PASS | scandinavian, contemporary, industrial, japandi, art-deco, mid-century, bohemian, mediterranean, cosy, wabi-sabi, maximalist, haussmannian -- 12 entrees. |
| 6.2 getStyleMaterialHint(null) | PASS | Retourne "Match the contemporary design style for all materials, finishes, and color palette." |
| 6.3 getStyleMaterialHint(undefined) | PASS | Meme path que null. |
| 6.4 getStyleMaterialHint("unknown-id") | PASS | Retourne `Match the unknown id design style for all materials, finishes, and color palette.` -- fallback generique sans crash. |

---

## 7. Mes-biens links

| Test | Statut | Details |
|------|--------|---------|
| 7.1 target="_blank" sur "Voir le dossier" | PASS | Ligne 440 du fichier mes-biens/page.tsx. |
| 7.2 target="_blank" sur "Voir l'annonce" | PASS | Ligne 451 du fichier mes-biens/page.tsx. |
| 7.3 last_dossier_uuid dans la query SQL | PASS | Sous-requete SELECT dans properties.ts ligne 231, mappee ligne 243. |

---

## 8. Prompt v36 structure

| Test | Statut | Details |
|------|--------|---------|
| 8.1 Passe 1 commence par "Edit this photo" | PASS | Tous les builders surface (kitchen, bathroom, wc, bedroom, laundry, cellar, entryway, fallback) dans les 2 fichiers. |
| 8.2 Passe 2 commence par "Add the following" | PASS | Tous les builders furniture (kitchen, bathroom, wc, bedroom, entryway, laundry, cellar, dining_room, fallback) dans les 2 fichiers. |
| 8.3 CAMERA_PRESERVATION vers la fin | PASS | Avant-dernier element dans chaque builder (concatene avec LIGHT_PRESERVATION en passe 1, avec room structure locked en passe 2). |
| 8.4 DSLR_LINE en dernier element | PASS | Dernier element de chaque tableau .join() dans tous les builders des 2 fichiers. |

---

## Bugs trouves

### BUG-1 : PROMPT_VERSION = "v35" au lieu de "v36" (HAUTE)

**Fichiers** : `app/api/generate/route.ts` (ligne 43), `lib/generation-pipeline.ts` (ligne 30)
**Comportement attendu** : PROMPT_VERSION = "v36" pour refleter les changements des commits 2c9455f et b89a5f0.
**Comportement reel** : "v35" -- les logs DB ne permettent pas de distinguer les generations pre/post v36.
**Correction** : changer `"v35"` en `"v36"` dans les 2 fichiers.
**Escalade** : @fullstack

### BUG-2 : saveImage() au lieu de saveRawBuffer() dans la route PDF pdf-lib (HAUTE)

**Fichier** : `app/api/dossier/[uuid]/pdf/route.ts` (lignes 17 et 983)
**Comportement attendu** : le PDF genere par pdf-lib est stocke sous `dossiers/{uuid}/dossier.pdf` via `saveRawBuffer`.
**Comportement reel** : `saveImage(pdfBase64, 'dossier_{uuid}_pdf')` stocke sous `logs/dossier_{uuid}_pdf.jpg`. L'extension .jpg est incorrecte, le prefixe `logs/` est incoherent avec `lib/pdf-generator.ts` qui utilise `dossiers/{uuid}/dossier.pdf`. Le `pdf_storage_key` en DB pointera vers une cle differente selon la methode de generation.
**Correction** : remplacer l'import `saveImage` par `saveRawBuffer`, et la ligne 982-983 par :
```ts
const pdfKey = `dossiers/${uuid}/dossier.pdf`;
await saveRawBuffer(Buffer.from(pdfBytes), pdfKey).catch((err) => { ... });
```
**Escalade** : @fullstack

### WARNING : Commentaire v34 dans generation-pipeline.ts (BASSE)

**Fichier** : `lib/generation-pipeline.ts` (ligne 29)
**Details** : L'historique du commentaire PROMPT_VERSION s'arrete a "v34" dans generation-pipeline.ts alors que route.ts va jusqu'a "v35". Pas d'impact fonctionnel mais incoherence documentaire.

---

## Auto-evaluation QA

- [x] Les builders sont identiques entre route.ts et generation-pipeline.ts (token order, constantes, logique)
- [x] TypeScript compile sans nouvelle erreur
- [x] ESLint passe sans erreur
- [x] Tous les imports ajoutes sont utilises
- [x] Les 12 styles ont un material hint
- [x] Les liens mes-biens s'ouvrent dans un nouvel onglet
- [x] La structure v36 (action FIRST, DSLR LAST) est respectee dans tous les builders
- [ ] PROMPT_VERSION non incremente a v36 -- BUG-1
- [ ] saveImage vs saveRawBuffer dans route PDF -- BUG-2

---

**Handoff -> @fullstack**
- Fichiers produits : `docs/qa/test-report-session-v36.md`
- Bugs a corriger :
  - BUG-1 : incrementer PROMPT_VERSION a "v36" dans `app/api/generate/route.ts` et `lib/generation-pipeline.ts`
  - BUG-2 : remplacer `saveImage` par `saveRawBuffer` dans `app/api/dossier/[uuid]/pdf/route.ts` (lignes 17 et 982-983) pour coherence avec `lib/pdf-generator.ts`
- Points d'attention : la cle de stockage PDF doit etre `dossiers/{uuid}/dossier.pdf` dans les 2 chemins de generation (Puppeteer et pdf-lib) pour eviter le double stockage
