# Audit UX — PlanEditor (Thomas Berger, marchand de biens)
Date : 2026-04-11 | Agent : @ux

## Grille d'évaluation (seuil 9.5/10)

| # | Critère | Note | Constat |
|---|---|---|---|
| 1 | Découverte | 7/10 | Le bandeau d'aide vert est présent mais il cite "Shift+clic" et "Fusionner" — termes techniques invisibles pour Thomas. La question "quoi faire en 5 secondes" n'a pas de réponse unique : l'éditeur s'ouvre avec 6-8 boutons actifs simultanément (undo, redo, calibrer, plan actuel, mon projet, nouvelle pièce). Pas de hiérarchie visuelle sur l'action principale. |
| 2 | Onboarding | 6/10 | Le bandeau d'aide liste 4 instructions textuelles sans visuels ni progression. Pas de "premier focus" : Thomas ne sait pas si on attend qu'il clique, glisse, ou lise. Aucune distinction entre "obligatoire avant de continuer" et "optionnel". La calibration n'est pas guidée pour un premier usage. |
| 3 | Affordance | 8/10 | Les poignées de coin (20px + padding 12px = 44px tactile) sont correctes. Le curseur `grab`/`grabbing` fonctionne sur desktop. Les zones colorées sont identifiables. Friction : les poignées n'apparaissent qu'après sélection — sur mobile, Thomas doit deviner qu'il faut d'abord appuyer pour faire apparaître les contrôles. |
| 4 | Feedback | 8/10 | Guides d'alignement SVG pendant le drag (bon). Surface recalculée en temps réel (bon). Sélection visuelle avec ring coloré (bon). Friction : aucun toast ni confirmation après "Supprimer" ou "Fusionner" — l'action est silencieuse. Undo existe mais Thomas ne sait pas qu'il peut récupérer. |
| 5 | Prévention erreur | 4/10 | [FRICTION H5] La suppression d'une pièce est instantanée sans confirmation. Le bouton rouge s'affiche dès la sélection, au même niveau visuel que le bouton renommer. Un tap mal placé sur iPhone peut supprimer une pièce extraite par l'IA sans avertissement. Undo corrige après coup mais Thomas non-technique ne sait pas que Ctrl+Z existe. |
| 6 | Récupération | 7/10 | Undo/Redo présents avec Ctrl+Z / Ctrl+Shift+Z (keyboard). Limité à 20 actions. Friction critique : les boutons undo/redo icône-seule sans libellé sont peu découvrables pour Thomas. Aucun badge indiquant "X actions annulables". La suppression multiple (plusieurs pièces d'un coup) n'a pas de "tout annuler". |
| 7 | Charge cognitive | 5/10 | [FRICTION H8] La toolbar visible à l'ouverture contient 7 éléments actifs (undo, redo, séparateur, calibrer, séparateur, plan actuel/projet toggle, nouvelle pièce) + le bandeau d'aide. Aucune des actions n'est masquée en "avancé". Pour Thomas qui veut juste "vérifier que les pièces sont bonnes et valider", cette densité est une source d'abandon. |
| 8 | Parcours | 7/10 | Le flow extraction → éditeur est automatique (bon). Pas de CTA "Valider et continuer" visible dans le PlanEditor lui-même — il est dans la page parente. Thomas pourrait modifier les pièces sans savoir comment progresser vers l'étape suivante. |
| 9 | Mobile | 6/10 | Touch drag implémenté avec touchmove/touchend. Long-press 500ms pour renommer (documenté). Friction : `touch-pan-x touch-pan-y` sur le container entre en conflit avec le drag des pièces — le scroll de page peut interrompre un drag. Sur mobile, la toolbar se wrap sur 2 lignes avec 8 éléments, certains sous les 44px de hauteur visuelle malgré `min-h-[44px]` (le wrap peut compresser). |
| 10 | Sauvegarde | 4/10 | [FRICTION H1] Aucun indicateur que les modifications sont sauvegardées. Pas de "Enregistré" ni de badge de modification. Thomas peut modifier 10 pièces, fermer l'onglet, et ne jamais savoir si son travail est persisté. `onRoomsChange` propage vers le parent mais rien ne confirme à Thomas que c'est en mémoire ou en base. |

**Note globale : 6.2/10** — Seuil non atteint. Corrections appliquées ci-dessous.

---

## Corrections appliquées

### C1 — Confirmation avant suppression [H5, priorité critique]
La `deleteRoom()` est appelée directement. Ajout d'un état `pendingDeleteId` : le bouton rouge déclenche une confirmation inline (2 boutons "Annuler" / "Supprimer") avant l'action réelle.

### C2 — Indicateur de sauvegarde [H1, priorité critique]
Ajout d'un badge "Modifications non sauvegardées" / "Sauvegardé" visible dans la toolbar, piloté par une prop `isSaved?: boolean` passée par le parent.

### C3 — Réduction charge cognitive [H8, priorité haute]
Masquer Calibrer et le toggle Plan actuel/Projet dans un menu "Options avancées" (chevron). La toolbar par défaut n'affiche que : Undo, Redo, Nouvelle pièce. Thomas accède aux autres actions s'il en a besoin.

### C4 — Libellés sur Undo/Redo [H6, priorité haute]
Remplacer les icônes seules par des boutons avec texte court "Annuler" / "Refaire" sur desktop (masqués sur mobile <sm pour économiser l'espace).

### C5 — Bandeau d'aide orienté action [H2, priorité moyenne]
Réécrire le bandeau : une seule instruction visible par défaut ("Glissez les pièces pour les repositionner. Cliquez sur une pièce pour la modifier."), avec un lien "Voir toutes les actions" pour développer les options avancées.

---

## Tests UX

| Test | Critère | Statut |
|---|---|---|
| Thomas peut corriger une pièce mal nommée sans aide | Tap pièce → bouton renommer visible | ✅ |
| Thomas ne peut pas supprimer par accident | Confirmation avant suppression | ❌ C1 à appliquer |
| Thomas sait que ses modifs sont sauvegardées | Badge état visible dans la toolbar | ❌ C2 à appliquer |
| Time-to-value : ≤ 3 actions pour valider le plan | Sélectionner → valider | ✅ si CTA parent visible |
| Mobile : drag d'une pièce sans déclencher le scroll | `touch-action: none` sur les zones | ⚠️ conflict potentiel container |
| Accessibilité : navigation clavier complète | Tab, Enter, Delete fonctionnels | ✅ |

---

**Handoff → @fullstack**
- Fichier produit : `docs/reviews/audit-plan-editor-ux.md`
- Corrections prioritaires à implémenter : C1 (confirmation suppression), C2 (badge sauvegarde), C3 (toolbar simplifiée)
- Fichier cible : `components/marchand/PlanEditor.tsx`
- Points d'attention : la prop `isSaved` doit être câblée depuis `app/projet/[id]/extraction/page.tsx` — le parent sait quand l'état est persisté en base
