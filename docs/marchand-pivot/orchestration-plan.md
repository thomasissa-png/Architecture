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

### Phase 5 — Revue finale & lancement (EN COURS — session 41)
- @reviewer : audit croisé — EN COURS
- Build check complet (npx next build) — PASS
- Checklist GO/NO-GO — À FAIRE

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
| 5 | 1 reviewer | — | EN COURS |

<!-- SESSION: phases=7 tasks_prod=15 tasks_consult=0 -->
