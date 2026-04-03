# Validation Session v40 — Audit QA complet

**Date** : 2026-04-03
**Agent** : @qa
**Scope** : 17 corrections, 19 fichiers audites
**Methode** : Grep + Read sur chaque fichier, verification code + types + imports

---

## Tableau de verification

| # | Correction | Fichier | Statut | Detail |
|---|---|---|---|---|
| 1 | hasGalleryAccess() existe, logique credits >= 15 OR pro/admin | lib/credits.ts:170-185 | PASS | Fonction presente, reuse hasProAccess + SUM(credits_purchased) >= 15 |
| 2 | hasGalleryAccess dans reponse JSON /api/user/credits | app/api/user/credits/route.ts:18-29 | PASS | Promise.all inclut hasGalleryAccess, retourne dans JSON |
| 3 | GalleryGate composant avec CTA Pro + "Retrouvez tous vos visuels" | components/GalleryGate.tsx:98-119 | PASS | H1 = "Retrouvez tous vos visuels", CTA Pro en premier, Starter en secondaire |
| 4 | /ma-galerie wrappe avec GalleryGate | app/ma-galerie/page.tsx:304+629 | PASS | Import ligne 16, wrapping lignes 304-629 |
| 5 | withFurniture PAR PHOTO dans MerchantMode | components/MerchantMode.tsx:36-37,400 | PASS | PhotoEntry a withFurniture:boolean, upload envoie p.entry?.withFurniture par photo |
| 5b | withFurniture toggle dans annotation MerchantMode | components/MerchantMode.tsx:842-854 | PASS | Toggle par photo dans la zone annotation |
| 6 | InlineGenerator withFurniture state + toggle + body | components/InlineGenerator.tsx:136,269,379 | PASS | State ligne 136, transmis dans body lignes 269 et 379 |
| 7 | Toggle "Finitions seulement / Finitions + Mobilier" + radiogroup | app/page.tsx:1530-1553 | PASS | role="radiogroup" + labels corrects |
| 8 | Dossier route lit withFurniture par photo | app/api/dossier/[uuid]/route.ts:155,716 | PASS | Upload: photo.withFurniture. Generation: photo.with_furniture per-photo |
| 9 | getMaxIterations retourne 0/1/3 | lib/credits.ts:195-218 | PASS | Anonymous=0, Decouverte=0, Starter(>=15)=1, Pro/Admin=3 |
| 10 | Iterations ne consomment PAS de credit | app/api/generate/route.ts:742-743 | PASS | isIteration = !!pass1Key, credit skip si isIteration |
| 11 | ANTI_INVENTION + CEILING conditionnel + SDB compact + LIGHT renforce | lib/generation-pipeline.ts:106-110,130,253 | PASS | ANTI_INVENTION dans tous builders passe 1, SDB compact (60cm vanity), LIGHT_PRESERVATION avec anti-warm-shift |
| 12 | Memes corrections miroir dans route.ts, PROMPT_VERSION v40 | app/api/generate/route.ts:43,128,142 | PASS | PROMPT_VERSION = "v40", ANTI_INVENTION + CEILING + LIGHT presents |
| 13 | 12 styles x 3 variantes dans style-variants.ts | lib/style-variants.ts | PASS | 12 styles (scandinavian a haussmannian), chacun 3 furnitureVariants + 3 accentPalettes |
| 14 | getStyleById passe imageHash a selectVariant | lib/style-resolver.ts:131-133 | PASS | if (imageHash) selectVariant(imageHash, styleId) |
| 15 | resolvedFurniturePrompt via selectVariant (hash SHA-256) | app/api/generate/route.ts:722-728 | PASS | crypto.createHash("sha256"), selectVariant, resolvedFurniturePrompt |
| 16 | outputFormat par photo (Original/Paysage/Portrait) | components/MerchantMode.tsx:37,866-888 | PASS | PhotoEntry.outputFormat, toggle 3 options dans annotation |
| 17 | object-cover (plus de bandes grises) | dossier/[uuid]/page.tsx + DossierPublicView + DossierResult | PASS | object-cover present dans les 3 fichiers |
| 18 | validate-image endpoint GPT-4.1-mini vision, fail-open | app/api/validate-image/route.ts | PASS | model gpt-4.1-mini, fail-open sur erreur/timeout (3s), retourne isRoom:true |
| 19 | photoWarnings non-bloquant sous miniatures | app/page.tsx:1404 + MerchantMode.tsx:692 | PASS | Affichage conditionnel sans blocage de la generation |

---

## Anomalies detectees

| # | Severite | Description | Fichier | Recommandation |
|---|---|---|---|---|
| A1 | MOYENNE | Le PATCH generate du dossier envoie withFurniture en global (MerchantMode.tsx:415) alors que la generation lit photo.with_furniture par photo (route.ts:716). Le champ global n'est PAS utilise cote serveur pour la generation batch — le per-photo prime. | MerchantMode.tsx:415 | Supprimer withFurniture du body PATCH generate ou documenter qu'il est ignore. Pas de bug fonctionnel mais code trompeur. |
| A2 | BASSE | La variable `withFurniture` ligne 115 de MerchantMode.tsx est un state global qui ne sert que pour le PATCH generate (inutile). Les toggles par photo modifient entry.withFurniture. | MerchantMode.tsx:115 | Nettoyage : supprimer le state global si confirme qu'il est inutile apres verification du flow complet. |
| A3 | INFO | InlineGenerator a un withFurniture global (pas par photo) — coherent car il genere un style a la fois sur des photos selectionnees. Pas un bug. | components/InlineGenerator.tsx:136 | Aucune action requise. |
| A4 | BASSE | style-variants.ts: selectVariant utilise un hash simple (shift+XOR) au lieu du SHA-256 de route.ts. Les deux ne produisent pas le meme index pour la meme image. | lib/style-variants.ts:218-222 vs route.ts:725 | Verifier que c'est voulu : route.ts passe le SHA-256 hex comme imageHash string a selectVariant, qui re-hash cette string. Le resultat est deterministe mais le double-hash est redondant. Pas de bug fonctionnel. |

---

## Verdict global

**19/19 verifications PASS** — Aucun bug bloquant ou haute severite.
2 anomalies MOYENNE/BASSE (code trompeur, pas de regression fonctionnelle).

Les 17 corrections sont correctement implementees et coherentes entre client et serveur.

---

**Handoff -> @orchestrator**
- Fichier produit : `docs/qa/validation-session-v40.md`
- Decisions prises : audit par Grep+Read, pas de tests automatises (pas de suite de tests existante)
- Points d'attention : A1/A2 sont du nettoyage de code non-urgent, signaler a @fullstack lors du prochain sprint
