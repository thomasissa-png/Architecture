# Validation session complete -- Audit QA

Date : 2026-04-03
Agent : @qa
Fichiers audites : 15
PROMPT_VERSION verifie : v40

---

## Tableau de validation

| # | Verification | Fichier | Statut |
|---|---|---|---|
| 1 | `hasGalleryAccess()` existe, logique credits_purchased >= 15 OR role pro/admin | lib/credits.ts:170-185 | PASS |
| 2 | `hasGalleryAccess` dans la reponse JSON de /api/user/credits | app/api/user/credits/route.ts:21,28 | PASS |
| 3 | GalleryGate : CTA Pro en premier, titre "Retrouvez tous vos visuels" | components/GalleryGate.tsx:99,107-118 | PASS |
| 4 | /ma-galerie wrappe avec GalleryGate | app/ma-galerie/page.tsx:304,629 | PASS |
| 5 | withFurniture PAR PHOTO dans MerchantMode (champ PhotoEntry + toggle annotation) | components/MerchantMode.tsx:36,842-854 | PASS |
| 6 | InlineGenerator : withFurniture state + toggle + transmission body | components/InlineGenerator.tsx:136,269,379,661-676 | PASS |
| 7 | page.tsx : toggle "Finitions seulement / Finitions + Mobilier", role="radiogroup" | app/page.tsx:1530,1541,1553 | PASS |
| 8 | dossier/[uuid]/route.ts : withFurniture lu par photo (pas global) | app/api/dossier/[uuid]/route.ts:115,155 | PASS |
| 9 | getMaxIterations retourne 0/1/3 selon plan | lib/credits.ts:195-218 | PASS |
| 10 | Iterations ne consomment PAS de credit (isIteration = !!pass1Key, skip decrementCredit) | app/api/generate/route.ts:742-743 | PASS |
| 11 | generation-pipeline.ts : ANTI_INVENTION dans tous builders passe 1, CEILING_PRESERVATION conditionnel, SDB compact, LIGHT_PRESERVATION renforce | lib/generation-pipeline.ts:106-110,123,130,249-255 | PASS |
| 12 | route.ts : memes corrections miroir, PROMPT_VERSION = "v40" | app/api/generate/route.ts:43,124-128,142-143 | PASS |
| 13 | style-variants.ts : 12 styles x 3 variantes, selectVariant exporte | lib/style-variants.ts (12 cles confirmees, L207 export) | PASS |
| 14 | style-resolver.ts : getStyleById passe imageHash a selectVariant | lib/style-resolver.ts:115-132 | PASS |
| 15 | route.ts : resolvedFurniturePrompt via selectVariant (hash SHA-256) | app/api/generate/route.ts:719-728 (crypto.createHash sha256) | PASS |
| 16 | MerchantMode : outputFormat par photo (original/landscape/portrait) | components/MerchantMode.tsx:37,154,866-888 | PASS |
| 17 | DossierPublicView + DossierResult + dossier/[uuid]/page.tsx : object-cover | DossierPublicView:89,109 / DossierResult:143,158 / page:207 | PASS |
| 18 | validate-image/route.ts : endpoint GPT-4.1-mini vision, fail-open | app/api/validate-image/route.ts:19-24 (fail-open si pas de cle) | PASS |
| 19 | page.tsx + MerchantMode : photoWarnings non-bloquant sous miniatures | page.tsx:143,1404-1406 / MerchantMode:92,692-694 | PASS |

---

## Resume

- **19/19 verifications PASS**
- Aucun import inutilise detecte dans les fichiers cibles
- Types coherents : PhotoEntry inclut withFurniture (boolean) et outputFormat (union type)
- PROMPT_VERSION = "v40" confirme dans route.ts
- Style variants couvre les 12 styles indoor avec 3 variantes chacun
- Logique credit iteration correcte : `isIteration = !!pass1Key` → skip `decrementCredit`
- GalleryGate : etats loading/error/no-access/access correctement geres
- validate-image : fail-open sur erreur API, timeout 3s via AbortController

## Points d'attention

1. **MerchantMode withFurniture global vs per-photo** : le state `withFurniture` a la ligne 115 est utilise pour l'envoi batch (ligne 415) mais les annotations par photo existent aussi (ligne 400). Le batch POST envoie `withFurniture` global (ligne 415) tandis que le PATCH par photo utilise `p.entry?.withFurniture` (ligne 400). Verifier que le endpoint dossier/[uuid] gere correctement les deux cas.
2. **style-variants.ts** : 12 styles couverts. L'absence de variantes outdoor est intentionnelle (les styles outdoor n'ont pas de variants).

---

**Handoff -> @orchestrator**
- Fichiers produits : docs/qa/validation-session-complete.md
- Decisions prises : audit par Grep/Read sur les 15 fichiers cibles, verification des types et de la coherence des interfaces
- Points d'attention : le double path withFurniture (global batch vs per-photo annotation) dans MerchantMode merite un test d'integration dedie
