# Plan d'orchestration — Versimo Pivot Marchand (Sessions 40-41)

## Demande fondateur
Pivot Versimo vers plateforme de pré-commercialisation immobilière pour marchands de biens. Parcours complet : upload plan → extraction IA → validation → qualification → recommandations architecte → génération visuels → dossier PDF par lot.

## Mode détecté
Projet existant — Pivot majeur sur MVP en production. Branche : `claude/extract-project-context-UBjf0`.

## Profil utilisateur
- Niveau technique : Expert
- Ton : Direct, exigeant, zéro MVP
- Mode : Autopilot avec validation milestones

## Décisions fondateur Phase 0
- KPI North Star : nombre de dossiers de pré-commercialisation complétés
- Pricing : 99€/bien (confirmé)
- Mode photo simple : landing page dédiée possible plus tard
- Existant (Mode Pro, Mes biens, dossiers) : absorbé dans le nouveau parcours
- Scope V1 : 7 étapes (upload → extraction → validation → qualification → recommandations → visuels → dossier PDF)

## Phases planifiées

### Phase 0 — Recherche & fondations (COMPLETE)
- @creative-strategy : workflow marchand + benchmark — `docs/marchand-pivot/strategy/marchand-workflow-research.md`
- @ia : recherche IA analyse plans — `docs/marchand-pivot/ia/plan-analysis-research.md`
- Exploration codebase : audit complet existant (MerchantMode, DB, PDF, properties)
- Checkpoint fondateur : VALIDÉ

### Phase 1 — Specs & parcours (COMPLETE)
- @product-manager : specs fonctionnelles 26 US — `docs/marchand-pivot/product/functional-specs.md`
- @ux : parcours 7 étapes + wireframes — `docs/marchand-pivot/ux/user-flows.md`

### Phase 2a — Design & architecture technique (COMPLETE)
- @design : design system + compositions — `docs/marchand-pivot/design/page-compositions.md`
- @ia : architecture technique pipeline — `docs/marchand-pivot/ia/technical-architecture.md`

### Phase 2b — Implémentation backend (COMPLETE)
- @fullstack A : 5 modules `lib/marchand/*` (schemas, db, plan-extractor, architect-agent, description-generator)
- @fullstack B : 6 API routes `app/api/pro/projects/*` (create, extract, validate, recommend, generate, status)

### Phase 2c — Implémentation frontend + copy (COMPLETE)
- @fullstack C : 3 composants + 4 pages (étapes 1, 2, 3, 6)
- @fullstack D : 3 pages (étapes 4, 5, 7)
- @copywriter : textes FR 7 étapes — `docs/marchand-pivot/copy/parcours-copy.md`

### Phase 3 — Routes manquantes + câblage (COMPLETE — session 41)
- @fullstack : Fix table names `pro_*` dans 7 fichiers existants + `ensureProTables()` dans tous les handlers
- @fullstack : Câblage real `extractPlanData()` dans extract route (suppression stub)
- @fullstack : Câblage real `generateRecommendations()` dans recommend route (suppression stub)
- @fullstack : 5 API routes manquantes créées (GET lots, PATCH qualify, PATCH rec/[recId], POST+PUT description, POST dossier/pdf)
- Build + lint : PASS

### Phase 4 — Tests & validation (COMPLETE — session 41)
- @qa : 161 tests unitaires Vitest pour 6 modules `lib/marchand/*` — 100% PASS, 0 fail — COMPLETE
- @marchand-de-biens : audit persona Thomas — 7.4/10, 8 P0, 15 P1, 9 P2 — COMPLETE
- @fullstack : Fix 8 P0 + 5 P1 identifiés par l'audit — 8 fichiers modifiés — COMPLETE
- Build PASS, lint 0 errors, 1383 tests pass post-fix

### Phase 5 — Revue finale & lancement (COMPLETE — session 41)
- @reviewer : audit croisé — GO CONDITIONNEL — `docs/reviews/cross-review-marchand-session41.md`
- Build check complet (npx next build) — PASS
- Checklist GO/NO-GO : **GO CONDITIONNEL pour beta privée**
- 5 gates docs auditées : 4 GO, 1 GO CONDITIONNEL (user-flows G7)
- Backend + API + Frontend + Tests : tous GO
- 8/8 P0 persona corrigés
- 5 gaps identifies pour session 42 (PATCH rooms, Stripe, upload photos, PDF réel, lot-splitter)

### Phase 6 — Extraction plan v2 + gates qualité (COMPLETE — session 43)
- @orchestrator : prompt extraction reécrit (6 étapes, surfaces écrites, self-review, bounding boxes murs)
- @orchestrator : 8 quality gates (G1-G8) + sanitizeSurfaces avec log + retry auto
- @orchestrator : ProStepper redesigné, z-index header, scroll fix, filtrage par étage, cache planRooms
- @design + @ux : audits ProStepper (5.8 et 5.2 → redesign appliqué)
- @marchand-de-biens : audit extraction 9.0→9.5/10 PASS
- @qa + @ia + @moi + @marchand : 4 audits gates convergents → 7 corrections P0/P1 appliquées
- @product-manager : specs lots/biens (6 US, modèle données, écrans, prompt IA)
- Build PASS, ~12 commits

### Phase 7 — Implémentation lots/biens (À FAIRE — session 44)
- @fullstack : page decoupe, endpoint detection IA, ProStepper 8 étapes
- @marchand-de-biens : audit UX jusqu'à 9.5/10
- Deploy Replit + test avec vrai PDF d'immeuble

## Métriques live
| Phase | Agents | Parallèles | Statut |
|---|---|---|---|
| 0 | 3 (explore + ia + creative-strategy) | 3 | COMPLETE |
| 1 | 2 (product-manager + ux) | 2 | COMPLETE |
| 2a | 2 (ia + design) | 2 | COMPLETE |
| 2b | 2 (fullstack A + B) | 2 | COMPLETE |
| 2c | 3 (fullstack C + D + copywriter) | 2 | COMPLETE |
| 3 | 2 fullstack (A fix + B create) | 2 | COMPLETE |
| 4 | 4 (qa + marchand + 2 fullstack fix) | 4 | COMPLETE |
| 5 | 1 reviewer | — | COMPLETE |
| 6 | 8 (orchestrator + design + ux + qa + ia + moi + marchand + PM) | 4 | COMPLETE |
| 7 | TBD (fullstack + marchand) | — | À FAIRE |

<!-- SESSION: phases=8 tasks_prod=18 tasks_consult=4 -->
