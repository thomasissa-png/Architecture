# Audit croise integral — Parcours Marchand Versimo — 2026-04-10

## Verdict : NO-GO

3 bugs bloquants empechent le parcours de fonctionner de bout en bout pour un projet non-immeuble (appartement/maison = 90% des cas de Thomas). Le paiement Stripe est un stub. Le PDF n'existe pas (JSON seulement).

---

## Bugs bloquants (le parcours ne fonctionne pas)

| # | Severite | Description | Fichier(s) |
|---|---|---|---|
| B1 | BLOQUANT | **Qualification casse : PUT vs PATCH.** Le frontend envoie PUT a `/qualify`, mais la route n'expose que PATCH. Resultat : 405 Method Not Allowed. Thomas est bloque a l'etape 4. | `qualification/page.tsx` L243 : `method: "PUT"` vs `qualify/route.ts` L42 : `export async function PATCH` |
| B2 | BLOQUANT | **Qualification casse : lot_id "default" vs UUID.** Pour les projets non-immeuble, la page cree un lot virtuel `id: "default"`. Le payload envoie `lot_id: "default"` a l'API qui valide `z.string().uuid()`. Resultat : 400. Thomas bloque a l'etape 4 pour TOUS les biens simples. | `qualification/page.tsx` L148-165 + L235 vs `qualify/route.ts` L26 |
| B3 | BLOQUANT | **Rooms sans lot_id = generation impossible.** L'extraction cree des rooms avec `lot_id = NULL`. Pour les non-immeubles, aucun code n'assigne les rooms au lot auto-cree. La route generate fait `JOIN pro_lots l ON r.lot_id = l.id` : 0 rooms trouvees. Thomas voit "Aucune piece a generer." | `extract/route.ts` (pas de lot_id), `validate/route.ts` (pas d'assignation), `generate/route.ts` L151-163 (JOIN) |

## Bugs importants (fonctionnalite degradee)

| # | Severite | Description | Fichier(s) |
|---|---|---|---|
| B4 | HAUTE | **Paiement = stub.** Le bouton "Payer 99 EUR" cree le projet SANS payer. `generate/route.ts` L130 : `// TODO: Verify credits/payment`. Pas de Stripe, pas de credits. Thomas genere gratuitement. | `generate/route.ts` L130-137, `nouveau/page.tsx` L471-509 |
| B5 | HAUTE | **PDF = JSON.** L'API `/dossier/pdf` retourne du JSON, pas un PDF. Le commentaire dit "V1 = JSON summary, le rendu PDF sera ajoute en Phase 5." Thomas ne peut pas envoyer de dossier a ses acquereurs. | `dossier/pdf/route.ts` L3-8, L200-209 |
| B6 | HAUTE | **Page liste projets absente (US-PM-03).** Aucune page `/pro` ou `/mes-projets`. Thomas ne peut pas retrouver ses projets entre les sessions. | Aucun fichier |
| B7 | HAUTE | **PDF multi-pages non gere.** L'extraction passe le PDF brut en base64 a GPT vision. Commentaire L92 : `// TODO: If PDF, render page 1 to image`. GPT-4.1 peut le gerer, mais le comportement est non teste. | `extract/route.ts` L92-93 |
| B8 | MOYENNE | **Validation photo URL incorrecte.** La page validation charge les photos via `visual_output_path` (le visuel genere) au lieu de `photo_path` (la photo source). A l'etape 3, il n'y a pas encore de visuels generes. L'image sera toujours `null`. | `validation/page.tsx` L79-81 |
| B9 | MOYENNE | **suggestLots() non implemente.** Pour les immeubles multi-etages, la suggestion de lots est un TODO. Thomas doit tout decouper manuellement. | `extract/route.ts` L169-176 |
| B10 | MOYENNE | **Partage (US-PM-24) non implemente.** La table `pro_share_links` existe mais aucune route ne cree de lien de partage. Pas de WhatsApp, email, ou lien tokenise. | Aucune route share |

---

## Couverture US (26 user stories)

| US | Titre | API | Frontend | Verdict |
|---|---|---|---|---|
| PM-01 | Creer projet | OK | OK | PASS |
| PM-02 | Upload plan mobile | OK (20Mo, HEIC) | OK (drag+drop) | PASS |
| PM-03 | Liste projets | ABSENTE | ABSENTE | **FAIL** |
| PM-04 | Extraction IA | OK | OK | PASS |
| PM-05 | Plan illisible fallback | OK (extraction_failed) | OK (lien vers saisie) | PASS |
| PM-06 | Estimer dimensions photo | Inclus dans extraction | N/A | PASS |
| PM-07 | Corriger pieces | OK (PUT validate + rooms[]) | OK (editable) | PASS |
| PM-08 | Decoupe lots immeuble | Partiel (suggestLots TODO) | Partiel | **PARTIEL** |
| PM-09 | Supprimer piece | OK (absent du body = delete) | OK | PASS |
| PM-10 | Cible acheteur | OK | **CASSE** (B1+B2) | **FAIL** |
| PM-11 | Style par lot | OK | **CASSE** (B1+B2) | **FAIL** |
| PM-12 | Budget/contraintes | OK | **CASSE** (B1+B2) | **FAIL** |
| PM-13 | Photos par piece | OK (POST rooms/:id/photo) | OK | PASS |
| PM-14 | Resume qualification | Non implemente | Non implemente | **FAIL** |
| PM-15 | Recommandations IA | OK | OK | PASS (si B1-B3 fixes) |
| PM-16 | Accepter/refuser reco | OK (PATCH reco/:id) | OK | PASS |
| PM-17 | Plan final recap | Non implemente | Non implemente | **FAIL** |
| PM-18 | Regenerer recos | OK (versioning) | Non implemente | **PARTIEL** |
| PM-19 | Paiement + generation | **STUB** (B4) | Bouton sans paiement | **FAIL** |
| PM-20 | Suivi generation | OK (GET /status polling) | OK | PASS |
| PM-21 | Dimensions dans prompt | OK (buildDimensionBlock) | N/A | PASS |
| PM-22 | Regenerer visuel | Non implemente | Non implemente | **FAIL** |
| PM-23 | Dossier PDF | **JSON seulement** (B5) | Partiel | **FAIL** |
| PM-24 | Partage dossier | Non implemente (B10) | Non implemente | **FAIL** |
| PM-25 | Gerer dossiers | Non implemente | Non implemente | **FAIL** |
| PM-26 | Description IA | OK | OK | PASS |

**Bilan : 12 PASS, 4 PARTIEL, 10 FAIL sur 26 US = 46% de couverture.**

---

## Securite

| Aspect | Verdict | Detail |
|---|---|---|
| Auth sur toutes les routes | PASS | `requireProjectOwnership` sur chaque route |
| Ownership check | PASS | Double query : existence + user_id match |
| Rate limiting | PASS | Par namespace (extract 3/h, recommend 5/h, generate 1/2min, description 10/h, projects 10/h) |
| Validation input (Zod) | PASS | Schemas Zod sur tous les body |
| IDOR protection | PASS | Lot ownership verifie via JOIN project_id |
| File type validation | PASS | MIME type whitelist + taille max |

---

## Donnees : flux etape 3 → etape 6

| Transition | Fonctionne | Probleme |
|---|---|---|
| Upload plan (E1) → Extraction (E2) | Oui | Plan stocke dans Object Storage, lu par extractPlanData |
| Extraction (E2) → Validation (E3) | Oui | Rooms en DB, chargees via GET /status |
| Upload photos (E3) → Serveur | Oui | POST rooms/:id/photo → Object Storage |
| Validation (E3) → Qualification (E4) | **Non** | B1+B2 cassent la qualification |
| Qualification (E4) → Recommandations (E5) | **Non** | Rooms sans lot_id → recommend retourne 0 rooms |
| Recommandations (E5) → Generation (E6) | **Non** | B3 : generate JOIN lot_id = 0 rooms |
| Generation (E6) → Dossier (E7) | Partiel | Visuels OK, mais PDF = JSON |

---

## Top 3 corrections prioritaires

1. **B1+B2+B3 ensemble** : fixer le flux lot_id pour les projets non-immeuble. Solution : dans `validate/route.ts`, si le projet n'est pas un immeuble, assigner automatiquement toutes les rooms au lot auto-cree. Dans `qualification/page.tsx`, utiliser le vrai lot_id au lieu de "default". Corriger PUT → PATCH.
2. **B5 : PDF reel.** Sans PDF, Thomas n'a rien a envoyer a ses acquereurs. Implementer le rendu PDF avec pdfkit ou @react-pdf/renderer.
3. **B4 : Paiement Stripe.** Sans paiement, le modele economique est inexistant. Implementer Stripe Checkout + webhook.

---

## Recommandation

**NO-GO.** Le parcours est casse pour tous les projets non-immeuble (B1+B2+B3), qui representent la majorite des cas d'usage de Thomas. Meme si ces bugs sont fixes, l'absence de PDF (B5), de paiement (B4), de page liste projets (B6), et de partage (B10) rend le produit inutilisable pour un marchand de biens en conditions reelles.

**Actions requises pour un GO CONDITIONNEL :**
1. Fixer B1+B2+B3 (parcours debloque) — @fullstack, 30 min
2. Implementer le PDF reel (B5) — @fullstack, 2h
3. Implementer la page liste projets (B6) — @fullstack, 1h
4. Implementer Stripe Checkout (B4) — @fullstack, 2-3h

---

**Handoff → @orchestrator**
- Fichiers produits : `docs/reviews/reviewer-audit-integral-session41.md`
- Decisions prises : NO-GO, 3 bugs bloquants identifies, 10/26 US en FAIL
- Points d'attention : B1+B2+B3 sont un seul cluster (flux lot_id casse), a fixer en priorite absolue. @fullstack doit corriger validate/route.ts (assignation lot_id auto) + qualification/page.tsx (PUT→PATCH, lot_id reel) + generation flow
