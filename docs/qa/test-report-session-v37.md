# Test Report — Session v37 (branche claude/session-recovery-analysis-jNy97)

Date : 2026-04-01

## Resultats lint / typecheck

| Verification | Resultat |
|---|---|
| `npx next lint` | **PASS** — 0 erreurs, 0 warnings |
| `npx tsc --noEmit` | **PASS** — 0 erreurs TypeScript |

## Verifications detaillees

| # | Verification | Resultat | Detail |
|---|---|---|---|
| 1 | Imports orphelins — DossierResult.tsx | **PASS** | 3 imports (useState, StorageImage, RefineModal, translateRoomLabel) tous utilises |
| 2 | Imports orphelins — MerchantMode.tsx | **PASS** | Lint passe sans erreur |
| 3 | Imports orphelins — dossier/[uuid]/route.ts | **PASS** | `incrementIterationCount` importe et utilise (l.373), `saveUserPhoto` importe et utilise (l.433, l.688) |
| 4 | Imports orphelins — lib/dossier.ts | **PASS** | Tous les exports sont consommes |
| 5 | Props DossierResult dans MerchantMode | **PASS** | MerchantMode passe `photos`, `dossierUuid`, `onDownloadPdf`, `onRegenerate`, `onIterate`, `isRegenerating`, `isIterating` — correspond exactement a `DossierResultProps` (l.29-37 de DossierResult.tsx). `DossierPhotoStatus` (MerchantMode l.38-49) inclut `pass1ImageKey` et `iterationCount`, mappes correctement via `p.pass1ImageKey ?? p.pass1_image_key` et `p.iterationCount ?? p.iteration_count` |
| 6 | Iterate ne consomme PAS de credit | **PASS** | Le bloc `action === "iterate"` (l.253-387 de route.ts) n'appelle ni `getUserCredits` ni `decrementCredit`. Le flag `_skipCreditCheck: true` est envoye a l'API generate. Aucun refund non plus (coherent). |
| 7 | Regenerate consomme un credit | **PASS** | `decrementCredit` appele l.410, avec refund l.450 en cas d'echec |
| 8 | Reset iteration_count sur regenerate | **PASS** | l.430 : `UPDATE dossier_photos SET iteration_count = 0 WHERE id = $1` |
| 9 | saveUserPhoto fire-and-forget | **PASS** | 2 occurrences : l.433 `.catch(err => console.error(...))` (regenerate) et l.688 `.catch(err => console.error(...))` (batch). Aucun `await` devant — non-bloquant |
| 10 | `DEPTH_DISTRIBUTION` (sans suffixe) supprime | **PASS** | Grep `const DEPTH_DISTRIBUTION = ` retourne 0 resultats dans route.ts et generation-pipeline.ts. Seuls `DEPTH_DISTRIBUTION_KITCHEN` et `DEPTH_DISTRIBUTION_BEDROOM` existent |
| 11 | Synchronisation route.ts / generation-pipeline.ts | **PASS** | Constantes identiques : `DEPTH_DISTRIBUTION_KITCHEN` (meme texte), `DEPTH_DISTRIBUTION_BEDROOM` (meme texte), `EQUIPMENT_PRESERVATION`, `CONTACT_SHADOWS`. Builders kitchen/bathroom/wc/bedroom/entryway identiques ligne a ligne (passe 1 et passe 2). Regex floor strip kitchen identique : `/,?\s*(wide-plank\|herringbone\|wood\|ash\|oak\|walnut\|parquet)\s+flooring[^,.]*/gi` |
| 12 | Kitchen pass2 : pas de pendant | **PASS** | l.254 route.ts et l.235 generation-pipeline.ts : "Do NOT add a ceiling pendant — the ceiling light was already placed in pass 1." |
| 13 | Kitchen floor strip regex | **PASS** | Identique dans les 2 fichiers, retire les directives wood/parquet du surfacePrompt cuisine |
| 14 | Bedroom floor tone (pas hardcode warm) | **PASS** | l.177 route.ts : "Flooring per style description above" — pas de "warm" hardcode. Idem l.158 generation-pipeline.ts |
| 15 | Room-types pendant light kitchen | **PASS** | `roomFurnitureOverride` pour kitchen dans room-types.ts ne mentionne pas "pendant light 30cm" (retire) |
| 16 | Header uniformite menu | **PASS** | "Tarifs" (l.56-60) et "Nouveau visuel" (l.71-77, conditionne a session) rendus sans condition de variant. Visibles sur home ET pages internes. Mobile dropdown idem (l.124-148) |
| 17 | iteration_count migration DB | **PASS** | l.205-207 de lib/dossier.ts : `ALTER TABLE dossier_photos ADD COLUMN iteration_count INTEGER DEFAULT 0` avec `EXCEPTION WHEN duplicate_column` (idempotent) |
| 18 | incrementIterationCount function | **PASS** | l.540-549 de lib/dossier.ts : `UPDATE ... SET iteration_count = COALESCE(iteration_count, 0) + 1 ... RETURNING iteration_count`. Gere le cas NULL via COALESCE |
| 19 | DossierPhoto interface | **PASS** | l.62 : `iteration_count: number` present dans l'interface |

## Verdict

**19/19 PASS** — Aucun FAIL detecte. Les modifications de cette session sont coherentes, compilent sans erreur, et les comportements metier (credits, fire-and-forget, synchronisation prompts) sont corrects.
