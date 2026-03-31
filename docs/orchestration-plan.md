# Plan d'orchestration — Versimo Bug Fixes Audit Pro

## Demande utilisateur
Corriger les 9 bugs identifies dans docs/reviews/pro-mode-audit.md par priorite.

## Mode detecte
Projet existant — Stade MVP, code en production sur Replit.

## Profil utilisateur
- Niveau technique : Expert
- Ton de communication : Technique
- Mode d'interaction : Autopilot (corrections ciblees)

## Complexite estimee
Legere — 2 agents (fullstack + orchestrateur), 1 phase

## Diagnostic apres lecture du code

### Bugs DEJA CORRIGES (verifies dans le code actuel)
- **BUG-2 (P0)** : outdoor style perdu — CORRIGE. `dossier/[uuid]/route.ts` POST lit `outdoorStyleId`/`outdoorSubtype` (L95-96), les passe a `addDossierPhoto` (L133-134). `generateSinglePhoto` utilise `photo.outdoor_style_id` pour outdoor (L352-353). Migration DB en place (L197-201 de dossier.ts).
- **BUG-1 (P1)** : custom prompt vide — CORRIGE. Validation `!rawPrompt.trim()` (L366-368).
- **BUG-3 (P1)** : outdoor_subtype pas stocke — CORRIGE. Colonnes DB, types, INSERT, et envoi au generate API tous en place.
- **BUG-4 (P1)** : bien auto-cree incomplet — CORRIGE. `POST /api/dossier` appelle `updateProperty` avec geo data (L91-114).

### Bugs A CORRIGER
- **BUG-5 (P1)** : Dossier depuis "Mes biens" sans choix de style — la modale ne propose pas de selecteur de style, les photos sont assemblees "tel quel".
- **BUG-8 (P2)** : `globalStyles` est un array mais seul `globalStyles[0]` est utilise partout.

### Bugs REPORTES a Pro v2
- **BUG-7 (P1)** : Pas d'iteration sur photos de dossier — feature gap, fait partie du redesign.
- **BUG-6 (P2)** : Jointure dossier/bien sur adresse texte — redesign DB necessaire.

## Plan d'execution

### Phase unique — Corrections ciblees
- Agent : orchestrateur (corrections directes, bugs chirurgicaux)
- Mission : BUG-5 + BUG-8 + documentation BUG-7/BUG-6
- Statut : COMPLETE

## Corrections appliquees

### BUG-5 (P1) — Dossier depuis "Mes biens" sans choix de style
Fichiers modifies :
- `app/mes-biens/[id]/page.tsx` : ajout state `dossierStyleId`, selecteur de style dans la modale, envoi `globalStyleId` a l'API, redirect vers dossier si re-generation
- `app/api/properties/[id]/dossier/route.ts` : lecture `globalStyleId`, creation dossier avec style, re-generation auto si style choisi (fire-and-forget PATCH generate)
- `app/dossier/[uuid]/page.tsx` : auto-refresh pour dossiers en "generating"/"draft" status
- `components/DossierAutoRefresh.tsx` : nouveau composant client pour le polling visuel

### BUG-8 (P2) — globalStyles array → single select
Fichier modifie : `components/MerchantMode.tsx` — `onStyleToggle` remplace la selection au lieu d'ajouter

### BUG-7 (P1) + BUG-6 (P2) — Documentes comme reportes
Fichier modifie : `docs/reviews/pro-mode-audit.md` — tableau de statut ajoute

## Metriques live
| Phase | Agents | Paralleles | Relances | P0 | Cout estime | Statut |
|---|---|---|---|---|---|---|
| 1 | 0 (orchestrateur direct) | 0 | 0 | 0 | ~$0 | COMPLETE |

<!-- SESSION: phases=1 tasks_prod=0 tasks_consult=0 -->
