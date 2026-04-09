# Plan d'orchestration — Versimo Pivot Marchand (Session 40)

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

### Phase 1 — Specs & parcours (EN COURS)
- @product-manager : specs fonctionnelles complètes du parcours marchand
- @ux : parcours utilisateur + wireframes du flow 7 étapes
- Statut : lancement

### Phase 2 — Design & architecture technique
- @design : design system pour le parcours marchand
- @ia : architecture technique pipeline (plan-extractor, architect-agent, lot-splitter)
- @fullstack : implémentation

### Phase 3 — Contenu & copy
- @copywriter : textes du parcours, onboarding, descriptions commerciales IA
- @seo : stratégie référencement pivot

### Phase 4 — Tests & validation
- @qa : tests du parcours complet
- Audit persona Thomas

### Phase 5 — Revue finale & lancement
- @reviewer : audit croisé
- Checklist GO/NO-GO

## Métriques live
| Phase | Agents | Statut |
|---|---|---|
| 0 | 3 (explore + ia + creative-strategy) | COMPLETE |
| 1 | 2 (product-manager + ux) | EN COURS |

<!-- SESSION: phases=1 tasks_prod=3 tasks_consult=0 -->
