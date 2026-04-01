# Rapport de tests -- Session v35

**Date** : 2026-04-01
**Agent** : @qa
**Scope** : Fix furniture injection, Mes Biens links, PDF overlapping, PrintPdfButton, PDF Puppeteer, suppression fallback PDF

---

## A) Furniture injection fix -- route.ts + generation-pipeline.ts

### A1. ROOMS_WITH_DEDICATED_BUILDERS coherent entre les 2 fichiers

| Fichier | Liste |
|---|---|
| `app/api/generate/route.ts:997` | kitchen, bathroom, wc, bedroom_adults, bedroom_children, entryway, laundry, cellar |
| `lib/generation-pipeline.ts:657` | kitchen, bathroom, wc, bedroom_adults, bedroom_children, entryway, laundry, cellar |

**Verdict : PASS** -- les listes sont identiques.

### A2. trimmedFurniture pour dedicated builders

Les deux fichiers appliquent la meme logique :
1. Si `hasDedicatedBuilder && roomType` : `rt.roomFurnitureOverride` + style hint `"Match the ${styleId || "contemporary"} design style..."`.
2. Si `roomFurnitureOverride` est absent/vide : fallback sur `furniturePrompt.trim()`.

**Verdict : PASS** -- le style furniturePrompt (canape, table basse) n'est PAS injecte dans les rooms avec builders dedies.

### A3. Fallback living_room, office, dining_room

Pour les rooms sans dedicated builder, `trimmedFurniture = effectiveFurniturePrompt` (issu de `applyRoomTypeOverrides` qui merge le roomFurnitureOverride avec le style furniturePrompt).

`dining_room` est explicitement exclu du tableau ROOMS_WITH_DEDICATED_BUILDERS (commentaire route.ts:996) car il a des builders FURNITURE dedies mais pas de builder SURFACE dedie.

**Verdict : PASS**

### A4. Import ROOM_TYPES

- `route.ts:22` : `import { applyRoomTypeOverrides, ROOM_TYPES } from "@/lib/room-types";`
- `generation-pipeline.ts:7` : `import { applyRoomTypeOverrides, ROOM_TYPES } from "@/lib/room-types";`
- `lib/room-types.ts:26` : `export const ROOM_TYPES: Record<string, RoomType>`

**Verdict : PASS**

---

## B) Coherence SQL -- lib/properties.ts + mes-biens/page.tsx

### B1. Subquery last_dossier_uuid

`lib/properties.ts:230` :
```sql
(SELECT d.uuid FROM dossiers d
 WHERE LOWER(TRIM(d.bien_adresse)) = LOWER(TRIM(p.address_raw))
 AND d.user_id = p.user_id
 AND (d.status IS NULL OR d.status != 'archived')
 ORDER BY d.created_at DESC LIMIT 1) as last_dossier_uuid
```

La subquery est correcte : elle recupere le UUID du dossier le plus recent (non archive) correspondant a l'adresse du bien.

**Verdict : PASS**

### B2. Mapping last_dossier_uuid

`lib/properties.ts:242` : `last_dossier_uuid: row.last_dossier_uuid || null`

**Verdict : PASS**

### B3. Interface Property dans lib/properties.ts

**BUG DETECTE** : `last_dossier_uuid` est ABSENT de l'interface `Property` dans `lib/properties.ts:16-52`. Le champ est retourne par la query et mappe, mais le type ne le declare pas. Le cast `as Property` masque le probleme. A runtime cela fonctionne car JavaScript ignore les types, mais c'est une incoherence TypeScript.

Note : `getPropertyById()` (ligne 255) utilise un champ similaire nomme `last_dossier_path` (avec `COALESCE(d.slug, d.uuid::text)`) qui est egalement absent de l'interface.

**Verdict : FAIL** -- champ manquant dans l'interface TypeScript.

**Severite** : MOYENNE -- pas de crash a runtime mais incoherence de types. A signaler a @fullstack.

### B4. Utilisation dans mes-biens/page.tsx

Le composant declare sa propre interface locale (ligne 29) : `last_dossier_uuid?: string | null` -- correcte.
Utilisation (ligne 436-438) : lien conditionnel `href={/dossier/${property.last_dossier_uuid}}` avec `target="_blank"` et `rel="noopener noreferrer"`.
La condition `(property.dossier_count ?? 0) > 0 && property.last_dossier_uuid` est correcte (pas de lien si pas de dossier).

**Verdict : PASS**

---

## C) PDF overlapping fix -- pdf/route.ts

### C1. Calcul des positions Y

Valeurs (pdf-lib, origine Y = bas de page) :
- `PAGE_HEIGHT = 842` (A4 portrait)
- `MARGIN = 40`
- `imgAreaHeight = (842 - 130) / 2 = 356`
- `beforeY = 842 - 55 = 787` (top de la zone before)
- `afterY = 787 - 356 - 30 = 401` (top de la zone after, 30pt gap pour le label)

Trace des zones :
- **Before image** : de Y=787 (top) a Y=787-356=431 (bottom). Centree verticalement si plus petite.
- **Label "Avant"** : Y = 787 - 356 - 12 = 419
- **Separateur** : Y = 401 + 4 = 405
- **Label "Apres"** : Y = 401 + 8 = 409
- **After image** : de Y=401 (top) a Y=401-356=45 (bottom). Centree verticalement si plus petite.
- **Footer** : en dessous, FOOTER_HEIGHT=35, soit Y=35.

Verification de non-chevauchement :
- Bottom before (431) > Top label "Avant" (419) > Separateur (405) > Label "Apres" (409) > Top after (401) : OK, les zones ne se chevauchent pas.
- Bottom after (45) > Footer (35) : OK, 10pt de marge.

**Verdict : PASS** -- les images before et after sont clairement separees avec un gap de 30pt entre elles.

---

## D) PrintPdfButton

### D1. Props acceptees

Le composant accepte `title: string`, `dossierUuid: string`, `hasPdf: boolean`. Correct.

### D2. Comportement conditionnel

- `hasPdf === true` : `window.open(/api/dossier/${dossierUuid}/pdf, "_blank")` -- telechargement direct du PDF pre-genere.
- `hasPdf === false` : prepare les images print, change le titre du document, puis `window.print()`.

**Verdict : PASS**

### D3. Appel dans dossier/[uuid]/page.tsx

Ligne 419 : `<PrintPdfButton title={title} dossierUuid={dossier.uuid} hasPdf={!!dossier.pdf_storage_key} />`
Les props sont correctes : `dossier.uuid` pour le UUID, `!!dossier.pdf_storage_key` pour le boolean.

**Verdict : PASS**

### D4. Suppression du fallback "Version simplifiee"

Le composant ne contient plus de lien vers une version simplifiee. Seul le bouton "Telecharger le PDF" est present.

**Verdict : PASS**

---

## E) pdf-generator.ts (Puppeteer)

### E1. Imports

- `saveImage` importe depuis `@/lib/db` : correct.
- `puppeteer-core` et `@sparticuz/chromium` importes dynamiquement : correct (evite les problemes de bundling).

**Verdict : PASS**

### E2. saveImage appele avec le bon format

**BUG DETECTE** : `saveImage` attend un `string` (base64) comme premier argument (`lib/db.ts:205`). Or `pdf-generator.ts:89` passe `Buffer.from(pdfBuffer)` qui est un `Buffer`, pas une string base64.

Confirme par `tsc` : `error TS2345: Argument of type 'Buffer<ArrayBuffer>' is not assignable to parameter of type 'string'`.

De plus, `saveImage` fait `Buffer.from(base64, "base64")` en interne -- un `Buffer` reinterprete en base64 produirait des donnees corrompues si le code compilait.

**Verdict : FAIL**

**Severite** : CRITIQUE -- le PDF Puppeteer ne sera pas correctement stocke. Le buffer doit etre converti en base64 avant l'appel : `await saveImage(Buffer.from(pdfBuffer).toString("base64"), storageKey.replace("logs/", "").replace(".jpg", ""))` ou mieux, creer une fonction dediee `saveBuffer()` dans db.ts.

### E3. Cleanup browser (try/finally)

Le `finally` block (ligne 97-104) ferme le browser avec `browser.close()` entoure d'un try/catch. Le pattern est correct -- le browser est ferme meme en cas d'erreur.

**Verdict : PASS**

### E4. Erreur tsc supplementaire

`lib/pdf-generator.ts:37` : `Property 'defaultViewport' does not exist on type 'typeof Chromium'`. L'API `@sparticuz/chromium` n'expose pas `defaultViewport` dans ses types. Cela peut fonctionner a runtime si la propriete existe mais n'est pas typee.

**Verdict : FAIL (TypeScript)** -- erreur de types a corriger (potentiellement `(chromium.default as any).defaultViewport` ou mise a jour des types).

---

## F) Integration route dossier -- app/api/dossier/[uuid]/route.ts

### F1. Fire-and-forget

`generateDossierPdfBackground` (ligne 31-41) est appelee en fire-and-forget (ligne 556) :
```typescript
generateDossierPdfBackground(dossierUuid, dossier.slug).catch((err) => { ... });
```
Le `.catch()` empeche un unhandled rejection. Le call n'est pas `await`-ed. Correct.

**Verdict : PASS**

### F2. Mise a jour pdf_storage_key

Dans `generateDossierPdfBackground` (ligne 35) :
```typescript
await updateDossierStatus(uuid, "completed", { pdfStorageKey: pdfKey });
```
Et dans `lib/dossier.ts:415-418`, `updateDossierStatus` gere `pdfStorageKey` en l'ecrivant dans la colonne `pdf_storage_key`.

**Verdict : PASS**

### F3. PDF endpoint sert le stored PDF

`app/api/dossier/[uuid]/pdf/route.ts:211-231` : si `dossier.pdf_storage_key` existe, recupere le PDF depuis Object Storage via `getImage()` et le sert directement avec les bons headers (`Content-Type: application/pdf`, `Content-Disposition: attachment`). En cas d'echec, fallback sur la generation pdf-lib.

**Verdict : PASS**

### F4. Bug potentiel: NextResponse avec Uint8Array

`tsc` signale une erreur a la ligne 218 : `Argument of type 'Uint8Array<ArrayBufferLike>' is not assignable to parameter of type 'BodyInit | null | undefined'`. Le `getImage()` retourne un `Uint8Array` qui n'est pas directement accepte par `NextResponse` dans les types Next.js.

A runtime, cela fonctionne probablement car Node.js et le runtime Next.js acceptent les `Uint8Array` comme body. Mais le type est incorrect.

**Verdict : FAIL (TypeScript)** -- a corriger avec un cast ou une conversion `Buffer.from(pdfData)`.

---

## G) TypeScript check

```
npx tsc --noEmit
```

**4 erreurs detectees :**

| Fichier | Ligne | Erreur | Severite |
|---|---|---|---|
| `app/api/dossier/[uuid]/pdf/route.ts` | 218 | `Uint8Array` non assignable a `BodyInit` | MOYENNE |
| `lib/pdf-generator.ts` | 37 | `defaultViewport` n'existe pas sur `typeof Chromium` | MOYENNE |
| `lib/pdf-generator.ts` | 89 | `Buffer` non assignable a `string` (saveImage) | CRITIQUE |
| `scripts/test-generation.ts` | 85 | Overload incompatible (pre-existant, hors scope) | LOW |

L'erreur `scripts/test-generation.ts` est pre-existante et hors du scope de cette session.

**Verdict : FAIL** -- 3 nouvelles erreurs TypeScript dans les fichiers modifies.

---

## H) ESLint check

```
npx next lint --file [tous les fichiers modifies]
```

Resultat : `No ESLint warnings or errors`

**Verdict : PASS**

---

## Resume

| Test | Verdict | Severite si FAIL |
|---|---|---|
| A1. ROOMS_WITH_DEDICATED_BUILDERS coherent | **PASS** | -- |
| A2. trimmedFurniture dedicated builders | **PASS** | -- |
| A3. Fallback living_room/office/dining_room | **PASS** | -- |
| A4. Import ROOM_TYPES | **PASS** | -- |
| B1. Subquery last_dossier_uuid | **PASS** | -- |
| B2. Mapping last_dossier_uuid | **PASS** | -- |
| B3. Interface Property manque last_dossier_uuid | **FAIL** | MOYENNE |
| B4. Utilisation dans mes-biens | **PASS** | -- |
| C1. Calcul positions Y PDF | **PASS** | -- |
| D1. Props PrintPdfButton | **PASS** | -- |
| D2. Comportement conditionnel hasPdf | **PASS** | -- |
| D3. Appel dans dossier page | **PASS** | -- |
| D4. Suppression fallback | **PASS** | -- |
| E1. Imports pdf-generator | **PASS** | -- |
| E2. saveImage format incorrect | **FAIL** | CRITIQUE |
| E3. Cleanup browser try/finally | **PASS** | -- |
| E4. defaultViewport type manquant | **FAIL** | MOYENNE |
| F1. Fire-and-forget | **PASS** | -- |
| F2. Mise a jour pdf_storage_key | **PASS** | -- |
| F3. PDF endpoint sert stored PDF | **PASS** | -- |
| F4. NextResponse Uint8Array type | **FAIL** | MOYENNE |
| G. TypeScript tsc --noEmit | **FAIL** | 3 nouvelles erreurs |
| H. ESLint | **PASS** | -- |

**Score : 18 PASS / 5 FAIL**

---

## Bugs a corriger (escalade @fullstack)

### P0 -- CRITIQUE

1. **`lib/pdf-generator.ts:89`** : `saveImage(Buffer.from(pdfBuffer), storageKey)` passe un `Buffer` au lieu d'une `string` base64. Le PDF Puppeteer ne sera pas correctement stocke dans Object Storage.
   - **Fix propose** : soit `saveImage(Buffer.from(pdfBuffer).toString("base64"), "dossier_pdf_key")`, soit creer une variante `saveBuffer(buffer: Buffer, key: string)` dans `lib/db.ts` qui upload directement le buffer sans conversion base64.

### P1 -- MOYENNE

2. **`lib/properties.ts:16-52`** : l'interface `Property` ne declare pas `last_dossier_uuid?: string | null`. Le champ fonctionne a runtime grace au cast `as Property` mais le type est incomplet. Idem pour `last_dossier_path` utilise dans `getPropertyById()`.
   - **Fix propose** : ajouter `last_dossier_uuid?: string | null;` et `last_dossier_path?: string | null;` a l'interface.

3. **`lib/pdf-generator.ts:37`** : `chromium.default.defaultViewport` n'est pas dans les types de `@sparticuz/chromium`.
   - **Fix propose** : `defaultViewport: (chromium.default as Record<string, unknown>).defaultViewport as { width: number; height: number } | null` ou un simple cast `as any`.

4. **`app/api/dossier/[uuid]/pdf/route.ts:218`** : `new NextResponse(pdfData, ...)` ou `pdfData` est un `Uint8Array` non assignable a `BodyInit`.
   - **Fix propose** : `new NextResponse(Buffer.from(pdfData), ...)`.

---

**Handoff --> @fullstack**
- Fichiers audites : `app/api/generate/route.ts`, `lib/generation-pipeline.ts`, `lib/properties.ts`, `app/mes-biens/page.tsx`, `app/api/dossier/[uuid]/pdf/route.ts`, `components/PrintPdfButton.tsx`, `lib/pdf-generator.ts`, `app/api/dossier/[uuid]/route.ts`, `app/dossier/[uuid]/page.tsx`
- 1 bug CRITIQUE : `saveImage` recoit un Buffer au lieu d'un base64 string dans pdf-generator.ts
- 3 bugs MOYENNE : interface Property incomplete, 2 erreurs de types TypeScript
- Le fix furniture injection (salon dans cuisine) est correct et coherent entre route.ts et generation-pipeline.ts
- Le PDF overlapping fix est correct (positions Y tracees mathematiquement)
- Le PrintPdfButton et l'integration PDF serveur sont fonctionnellement corrects
