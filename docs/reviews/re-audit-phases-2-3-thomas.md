# Re-audit phases 2-3 -- Thomas Berger (post-corrections)

**Date** : 2026-04-11 | **Audit precedent** : Phase 2 = 6.2/10, Phase 3 = 7.2/10

---

## Phase 2 -- Comprehension plan : 7.8 / 10 (+1.6)

| # | Critere | Avant | Apres | Commentaire |
|---|---------|-------|-------|-------------|
| 1 | Comprehension spatiale | 5 | 8 | Bounding box IA (x_percent, y_percent, width_percent, height_percent) positionne les pieces sur le plan. Fallback grille si absent. Les rectangles correspondent aux vrais murs. |
| 2 | Surfaces | 7 | 7 | Inchange -- l'IA lit les cotes ou estime via porte 83cm. Correct. |
| 3 | Etages | 8 | 8 | Inchange -- multi-fichier = multi-etage, groupage propre. |
| 4 | Types de pieces | 6 | 6 | **NON CORRIGE.** ROOM_TYPE_LABELS dans RoomCard.tsx ne contient toujours pas salle de reunion, open space, accueil, local technique. Le prompt IA les mentionne ("offices, hallways, storage") mais le select UI n'a pas les options pro. Tout tombe dans "autre". |
| 5 | Correspondance plan/liste | 4 | 8 | Gros progres. Les bounding_box positionnent les zones la ou elles sont reellement. Le lien visuel plan/liste est maintenant reel. |
| 6 | Dimensions | 7 | 7 | Inchange -- toujours pas de "4.2m x 3.1m" en clair dans la liste. Surface seule. |
| 7 | Ajustement facile | 7 | 7 | Inchange. |
| 8 | Fusion/Split | 7 | 7 | Inchange. |
| 9 | Erreurs IA | 8 | 8 | Inchange. |
| 10 | Confiance | 5 | 8.5 | Badges "Fiable" / "A verifier" / "Incertain" affiches par piece avec code couleur vert/orange/rouge. Title avec pourcentage au survol. Thomas sait ou l'IA hesite. Calibration echelle cablee dans le parent. |

**Verdict : 7.8/10 -- PAS ENCORE 9.5. Manque 3 items :**

1. **Types pro absents du select UI** -- ROOM_TYPE_LABELS n'a pas salle de reunion, open space, accueil, local technique. Le prompt IA peut les detecter mais l'UI ne peut pas les afficher ni les selectionner. P1.
2. **Dimensions L x l non affichees** -- Seule la surface m2 apparait. "4.2m x 3.1m = 13.0 m2" en un coup d'oeil manque toujours. P2.
3. **scale_reference cache** -- Thomas ne sait pas si l'IA a lu les cotes ou estime via la porte. Un petit texte "Surfaces lues sur le plan" vs "Surfaces estimees" suffirait. P2.

---

## Phase 3 -- Photos + projection : 7.5 / 10 (+0.3)

| # | Critere | Avant | Apres | Commentaire |
|---|---------|-------|-------|-------------|
| 1 | Upload photos | 8 | 8 | Inchange. |
| 2 | Projection | 6 | 6.5 | Texte "Associez une photo a chaque piece" present. Mais le texte d'aide projection annonce ("Le visuel sera genere en tant que salon meuble" quand on change le type) est ABSENT. Grep ne trouve ni "projection" ni "astuce" ni "conseil" dans validation/page.tsx. Amelioration marginale. |
| 3 | Cloisons | 4 | 4 | **NON CORRIGE.** Toujours le meme deal-breaker : fusionner 2 bureaux en salon dans l'editeur ne change rien a la generation qui recoit 2 photos separees avec mur visible. |
| 4 | Distances/echelle | 7.5 | 7.5 | Inchange -- calibration cablee, dimensions injectees dans le prompt. |
| 5 | Style | 8.5 | 8.5 | Inchange. |
| 6 | Resultat individuel | 9 | 9 | Inchange. |
| 7 | Dossier PDF | 6.5 | 6.5 | Inchange -- toujours pas de DPE, surface par piece, prix de vente dans le PDF. |
| 8 | Page partageable | 8.5 | 8.5 | Inchange. |
| 9 | Qualite pro | 7 | 7 | Inchange -- pas de zoom/lightbox. |
| 10 | Workflow global | 6.5 | 6.5 | Inchange -- 7 etapes. |

**Verdict : 7.5/10 -- PAS ENCORE 9.5. Manque 3 items :**

1. **Cloisons non gerees** -- Deal-breaker inchange. Fusion plan ne se repercute pas sur la generation. Un marchand qui promet "2 bureaux deviennent 1 salon" ne peut pas le montrer en visuel. P0.
2. **Texte d'aide projection absent** -- Aucun feedback quand Thomas change "bureau" en "salon" dans le select. Zero guidage mental "ce select change le rendu IA". P1.
3. **PDF incomplet** -- Pas de DPE, pas de surface par piece, pas de prix de vente. Thomas retourne sur Canva pour sa plaquette. P1.
