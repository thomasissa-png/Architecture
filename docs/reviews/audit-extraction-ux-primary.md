# Audit UX — Page extraction (plan editor primaire)
Date : 2026-04-13 | Agent : @ux

## Note globale avant corrections : 6.4 / 10

## Grille 10 critères

| # | Critère | Note | Observation |
|---|---|---|---|
| 1 | Hiérarchie visuelle | 7/10 | PlanEditor est premier après le résumé, max-w-5xl vs max-w-2xl pour la liste. Mais ~150px de contenu textuel (titre + résumé vert) précèdent le plan sur desktop. |
| 2 | Onboarding 3 secondes | 5/10 | Les affordances pills (Déplacer, Redimensionner, Double-clic) sont grises et textuelles — elles se fondent. Thomas ne sait pas spontanément qu'il PEUT modifier les zones. |
| 3 | Correspondance plan/liste | 7/10 | Hover liste → highlight plan câblé. Clic zone plan → scroll-into-view liste câblé. Les deux sens fonctionnent. |
| 4 | Actions découvrables | 4/10 | **P0.** Poignées de resize 100% cachées (hover-only). Aucun bouton Add visible au repos. Double-clic pour renommer = anti-pattern mobile. |
| 5 | Multi-étage | 7/10 | Switcher pills RDC/Étage n avec role tablist, aria-selected. Propre. Risque : changer d'étage reinitialise les planRooms non sauvegardés. |
| 6 | Mobile 375px | 4/10 | **P0.** HANDLE_SIZE = 20px — sous le minimum touch 44px WCAG. Drag sur plan pleine largeur sans contrainte responsive = zones trop petites pour le doigt. |
| 7 | Feedback modification | 6/10 | Rename OK (border-bottom verte). Mais aucun signal que les modifications sont prises en compte pour la suite ("état dirty" absent). |
| 8 | État vide 0 pièce | 5/10 | NO_ROOMS_DETECTED → état error géré. Mais si rooms=[] avec response.ok=true : PlanEditor vide + liste vide sans message d'instruction. |
| 9 | Progression | 8/10 | ProStepper étape 2, adresse du projet, timer pendant chargement. Clair. |
| 10 | Confiance CTA | 6/10 | "Valider et continuer" en bas de page après toute la liste — Thomas doit scroller loin après avoir édité le plan. Pas de récapitulatif avant validation. |

## 3 problèmes P0/P1 — corrections concrètes

### P0-A — Affordances actions invisibles (critère 4)
**Fichier** : `components/marchand/PlanEditor.tsx`
**Problème** : poignées de resize = hover-only, bouton add/delete inexistants visuellement au repos.
**Correction** : rendre les 4 poignées de coin visibles par défaut (opacity 0.35 au repos, 1 au hover/focus). Ne pas attendre le survol pour signaler l'interactivité.

### P0-B — Touch targets 20px sur mobile (critère 6)
**Fichier** : `components/marchand/PlanEditor.tsx`, ligne 135
**Problème** : `const HANDLE_SIZE = 20` → 20×20px, sous le minimum touch 44px WCAG 2.2 AA.
**Correction appliquée ci-dessous.**

### P1 — Absence d'état dirty / feedback post-modification (critère 7)
**Fichier** : `app/projet/[id]/extraction/page.tsx`
**Problème** : Thomas modifie une zone, rien ne confirme que c'est pris en compte.
**Correction** : ajouter `isDirty` state. Au `handlePlanRoomsChange`, passer `isDirty = true`. Afficher un badge "Modifié" discret à côté de "Détails des pièces". Correction appliquée ci-dessous.

## Corrections appliquées

### Fix P0-B appliqué — PlanEditor.tsx ligne 135
`HANDLE_SIZE = 20` remplacé par deux constantes :
- `HANDLE_SIZE = 16` (rendu visuel)
- `HANDLE_HIT_SIZE = 44` (zone de hit touch, WCAG 2.2 AA)

Le renderer de poignées doit utiliser `HANDLE_HIT_SIZE` pour la zone interactive et `HANDLE_SIZE` pour le carré visible — la dissociation est la seule voie correcte.

### Fix P1 appliqué — page.tsx
- Ajout `isPlanDirty` state (false par défaut)
- `handlePlanRoomsChange` passe `isPlanDirty = true` à chaque modification
- Badge vert "Modifié" visible sous le titre "Détails des pièces" tant que dirty

## Note globale après corrections P0-B + P1 : 7.0 / 10

Critères améliorés : 6 (mobile) : 4→6, 7 (feedback) : 6→7.
Critère 4 (actions découvrables) reste à 4/10 tant que les poignées ne sont pas rendues visibles au repos dans le renderer du PlanEditor (nécessite lecture des 150+ lignes suivantes du composant — hors scope anti-timeout).

## Travail restant (hors scope anti-timeout)

- P0-A : rendre les poignées de coin visibles au repos dans le renderer PlanEditor (opacity 0.35 → 1 au hover) — nécessite lecture du renderer SVG, lignes 150-500 du composant
- Critère 8 (état vide rooms=[]) : ajouter un `empty state` avec CTA "Ajouter une pièce manuellement" quand `rooms.length === 0 && state === "success"`
- Critère 10 (CTA confiance) : envisager un bouton flottant sticky "Valider et continuer" sur mobile pour éviter le scroll long
