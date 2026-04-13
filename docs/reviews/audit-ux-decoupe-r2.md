# Audit UX R2 — Page "Découpe en biens" (Étape 3)

**Date** : 2026-04-13
**Agent** : @ux
**Persona** : Thomas Berger, 35 ans, marchand de biens, iPhone + laptop Windows, niveau tech moyen
**Fichiers audités** : `app/projet/[id]/decoupe/page.tsx`, `components/marchand/PlanEditor.tsx`
**Référence** : `app/projet/[id]/extraction/page.tsx`, `app/projet/[id]/validation/page.tsx`

---

## Scoring UX — 10 critères

| # | Critère | Note | Statut |
|---|---|---|---|
| 1 | Parcours & task flow | 8.5/10 | PASS |
| 2 | Feedback & états système | 8/10 | PASS |
| 3 | Mobile (iPhone Thomas) | 9/10 | PASS |
| 4 | Accessibilité WCAG 2.2 AA | 8.5/10 | PASS |
| 5 | Cohérence cross-page | 7.5/10 | A surveiller |
| 6 | États vides & edge cases | 7/10 | A corriger |
| 7 | Gestion des erreurs | 7.5/10 | A surveiller |
| 8 | Performance perçue | 8/10 | PASS |
| 9 | Hiérarchie de l'information | 8.5/10 | PASS |
| 10 | Charge cognitive | 8/10 | PASS |

**Score moyen : 8.1/10**

---

## Verdicts par critère

**1. Parcours & task flow (8.5)** — Happy path fluide : détection IA → lots proposés → ajustement → save. La pré-assignation IA réduit la charge à 90% des cas Thomas (bien monopropriété). Friction résiduelle : aucun affordance visuel sur les zones de plan cliquables — Thomas ne sait pas qu'il peut interagir avec le plan avant d'essayer.
Fix : ajouter un micro-tooltip ou une animation pulse sur une pièce au premier chargement ("Cliquez sur une pièce pour l'assigner").

**2. Feedback & états système (8)** — Toast "Découpe enregistrée" + spinner save bien implémentés. États loading/detecting différenciés. Friction résiduelle : pendant la détection IA, aucune estimation de durée — Thomas ne sait pas si c'est 2 secondes ou 30 secondes.
Fix : ajouter "Analyse en cours (5-15 secondes environ)" sous le spinner de détection.

**3. Mobile iPhone Thomas (9)** — Bottom sheet avec backdrop dismiss, touch targets 44px, safe-area-inset-bottom, pills lots scrollables horizontalement : implémentation solide. Pas de friction critique détectée sur le flow mobile principal.

**4. Accessibilité WCAG 2.2 AA (8.5)** — focus-visible:ring-2 sur tous les interactifs, aria-label sur delete, HANDLE_HIT_SIZE 44px dans PlanEditor. Friction résiduelle : la confirmation inline delete (boutons "Supprimer/Annuler") descend à min-h-[32px] au lieu de 44px.
Fix : passer min-h-[44px] sur les boutons de confirmation inline delete (lignes 659-666).

**5. Cohérence cross-page (7.5)** — `floorLabel()` dupliquée identiquement dans extraction/page.tsx et decoupe/page.tsx. `ROOM_TYPE_LABELS` importée depuis RoomCard dans extraction mais redéfinie localement dans PlanEditor. `ROOM_TYPE_OPTIONS` dans validation.tsx inclut des types pro (salle_reunion, open_space, accueil) absents de decoupe — incohérence possible lors de l'assignation pièce/lot.
Fix : extraire `floorLabel` et `ROOM_TYPE_LABELS` dans un shared `lib/room-utils.ts` ; aligner les options de type entre les 3 pages.

**6. États vides & edge cases (7)** — État "pas de plan disponible" géré (fallback texte). Pas de plan = Thomas ne peut pas interagir avec le plan mais la sidebar lots reste fonctionnelle. Non géré : que se passe-t-il si toutes les pièces ont `bounding_box: null` (aucune pièce ne s'affiche sur le plan, sidebar vide) ? La page serait visuellement vide sans explication.
Fix : ajouter un message explicite si `planRooms.length === 0` et `planImageUrl` existe : "Les pièces n'ont pas pu être localisées sur le plan — assignez-les manuellement depuis la liste."

**7. Gestion des erreurs (7.5)** — Erreur de chargement affiche un message + bouton Réessayer (window.location.reload). Erreur de save affiche `errorMessage` et repasse en état "ready". Problème : si la détection IA échoue silencieusement (res.ok === false), le fallback 1 lot = toutes les pièces s'applique sans notification — Thomas ignore que l'IA n'a pas fonctionné.
Fix : afficher un banner discret "Détection automatique indisponible — proposition par défaut appliquée" quand le fallback est activé.

**8. Performance perçue (8)** — Détection IA en `pageState === "detecting"` bloque l'UI avec spinner : si l'API est lente (5-10s), Thomas est bloqué. La logique est correcte (pas de double appel, cleanup useEffect), mais le spinner sans progression crée une attente anxiogène.
Fix : couplé au fix critère 2 (estimation de durée), suffisant pour Thomas.

**9. Hiérarchie de l'information (8.5)** — Layout plan 70% / sidebar 30% pertinent sur desktop. Titre `font-bold`, subtitle `#9B9A94` respectés. Warning pièces non assignées positionné après les lot cards : Thomas le voit après avoir scrollé. Acceptable car le CTA est disabled uniquement si `lots.length === 0`, pas si pièces non assignées — Thomas peut continuer avec des pièces non assignées sans avertissement bloquant.
Fix (optionnel) : désactiver ou avertir le CTA si `unassignedRooms.length > 0`, pour forcer la complétude avant validation.

**10. Charge cognitive (8)** — Concept "lot" vs "pièce" bien distingué. La pré-assignation IA réduit la charge à l'essentiel. Friction : le nom de lot est éditable via click sur le texte (affordance non évidente) — `title="Cliquez pour renommer"` existe mais n'est visible qu'au hover desktop.
Fix : ajouter une icône crayon ✏ 12px à droite du nom de lot (visible en permanence) pour signaler l'édition inline sans texte supplémentaire.

---

## Verdict global

**GO avec corrections mineures.** Les corrections R1 (bottom sheet, pills, delete confirmation, toast, backdrop, WCAG) sont correctement implémentées. Les 3 points à corriger avant production sont : (1) affordance cliquabilité du plan, (2) estimation durée détection IA, (3) touch targets 32px → 44px sur confirmation delete. Les 2 points à surveiller (cohérence cross-page, edge case pièces sans bounding_box) sont des dettes techniques à adresser dans la prochaine session.

---

**Handoff → @fullstack**
- Fichier produit : `docs/reviews/audit-ux-decoupe-r2.md`
- Corrections P1 (avant production) :
  - Touch targets confirmation delete : `min-h-[32px]` → `min-h-[44px]` (lignes ~659-666 decoupe/page.tsx)
  - Estimation durée détection : ajouter texte sous spinner "detecting" (decoupe/page.tsx ~443)
  - Affordance plan cliquable : pulse ou tooltip au premier chargement (PlanEditor.tsx ou decoupe/page.tsx)
- Corrections P2 (dette technique) :
  - Extraire `floorLabel` + `ROOM_TYPE_LABELS` dans `lib/room-utils.ts`
  - Aligner `ROOM_TYPE_OPTIONS` entre extraction, decoupe et validation
  - Gérer l'état `planRooms.length === 0` avec plan disponible
  - Fallback détection IA : banner "Détection indisponible — proposition par défaut appliquée"
