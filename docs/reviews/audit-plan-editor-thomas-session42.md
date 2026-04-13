# Audit PlanEditor -- Thomas Berger, Marchand de Biens (Session 42)

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux, iPhone 15 Pro + laptop Windows.
> Composant audite : `components/marchand/PlanEditor.tsx` + integration dans `app/projet/[id]/extraction/page.tsx`
> Cas d'usage : bureaux 200m2 a transformer en T4 (casser des murs, fusionner des pieces, creer une salle de bain)
> Date : 2026-04-11
> Seuil : 10/10

---

## Audit initial : 5.8 / 10

"L'editeur affiche des rectangles sur un plan et je peux les deplacer, mais pour mon vrai boulot -- casser un mur entre 2 salles de reunion pour faire un grand salon -- il n'y a aucune fonctionnalite. C'est un Powerpoint avec des rectangles, pas un outil de marchand de biens."

---

## Corrections appliquees (P0 + P1)

### P0-1 -- FUSION de pieces : FAIT
- Ajout multi-selection (Shift+clic) avec `selectedRoomIds: Set<string>`
- Bouton "Fusionner (N)" visible dans la toolbar quand 2+ pieces selectionnees
- La fusion cree un bounding box englobant les pieces, garde le nom/type de la plus grande, marque comme `isNew: true`
- Auto-edit du nom apres fusion pour que Thomas renomme immediatement

### P0-2 -- Distinction EXISTANT vs PROJET : FAIT
- Ajout champ `isNew?: boolean` sur PlanRoom
- Pieces extraites par l'IA : `isNew: false`, bordure SOLIDE, opacite standard
- Pieces creees manuellement ou fusionnees : `isNew: true`, bordure POINTILLEE, badge vert "PROJET", opacite +10%
- Compteur "X existantes + Y projet" dans la toolbar
- Legende enrichie avec le style "Projet" (bordure pointillee)

### P1-1 -- Placement PROPORTIONNEL aux surfaces : FAIT
- `distributeRoomsOnPlan` utilise `surface_m2` pour dimensionner les rectangles
- Ratio : plus grande piece = 90% de la cellule, plus petite = 40% minimum
- L'open space de 80m2 est visuellement bien plus grand que les WC de 2m2

### P1-2 -- Warning sur les surfaces indicatives : FAIT
- Ajout bandeau orange "Surfaces indicatives" sous la legende
- Le scaleFactor reste hardcode a 50 (la calibration interactive est P2)

### P1-3 -- Texte d'aide EN HAUT + tailles mobiles : FAIT
- Texte d'aide deplace AU-DESSUS de l'editeur (fond vert clair, instructions claires)
- Instructions : drag, resize, appui long pour renommer, Shift+clic pour fusionner
- Explication visuelle de la distinction existant/projet dans le texte d'aide
- Noms de pieces : 11px -> 13px
- Surfaces : 10px -> 12px
- Badge type : 10px/min-h-28px -> 12px/min-h-44px
- Bouton supprimer : w-6/h-6 -> w-8/h-8
- HANDLE_SIZE : 12px -> 20px (touch padding 12px -> 44px total)
- Ajout bouton crayon (rename) visible quand piece selectionnee (44px min touch target)

### P1-4 -- Types de pieces immobiliers complets : FAIT
- 9 types -> 17 types : +sejour, +salle_a_manger, +chambre_parentale, +entree, +dressing, +cellier, +terrasse, +garage
- Couleurs distinctes pour chaque nouveau type
- Propage dans PlanEditor.tsx, RoomCard.tsx (export ROOM_TYPE_LABELS), extraction/page.tsx (emojis)

### P1-5 -- Rename tactile (appui long) : FAIT
- Long-press 500ms sur une piece = ouvre le champ de rename (pas besoin de double-clic)
- Si le doigt bouge (drag), le long-press est annule (pas de conflit drag/rename)
- Cleanup du timer au touchEnd

### P1-6 -- Nouvelle piece positionnee intelligemment : FAIT
- La nouvelle piece apparait pres de la derniere piece selectionnee (pas au centre)
- Taille = 15% du plan (pas 100x80px fixe)

---

## Re-evaluation apres corrections : 8.2 / 10

| # | Critere | Avant | Apres | Commentaire |
|---|---------|-------|-------|-------------|
| 1 | Comprehension immediate | 6 | 9 | Le texte d'aide est EN HAUT, bien visible, avec instructions claires + distinction existant/projet expliquee visuellement. |
| 2 | Placement des pieces | 4 | 7 | Les rectangles sont proportionnels aux surfaces. Un open space est plus grand qu'un WC. Pas parfait (toujours en grille, pas sur le plan exact), mais bien mieux. |
| 3 | Manipulation | 7 | 8.5 | Poignees de 20px, touch target 44px, appui long pour renommer. Le drag/resize est solide. Il manque snap-to-grid. |
| 4 | Creation de pieces | 6 | 8 | Nouvelle piece pres de la selection, taille proportionnelle, marquee "Projet", auto-edit du nom. |
| 5 | Suppression/fusion | 2 | 8.5 | Shift+clic pour multi-selectionner, bouton "Fusionner" en toolbar, bounding box automatique. Il manque la detection automatique d'adjacence. |
| 6 | Surfaces | 5 | 6.5 | Les surfaces se recalculent en temps reel, warning "indicatif" present. Mais la calibration n'est pas encore interactive (P2). |
| 7 | Types de pieces | 7 | 9.5 | 17 types disponibles couvrant 100% du vocabulaire immobilier courant. Chambre parentale, entree, dressing, cellier, terrasse, garage. |
| 8 | Etat existant vs futur | 1 | 8 | Bordure solide vs pointillee, badge "PROJET", compteur dans la toolbar. Clair d'un coup d'oeil. Il manque le mode "avant/apres" toggle (P3). |
| 9 | Mobile | 5 | 8 | Texte 13px/12px lisible, poignees 20px, touch targets 44px, appui long pour renommer, bouton crayon visible. Il manque pinch-to-zoom (P3). |
| 10 | Resultat | 4 | 7 | Plan avec distinction existant/projet, surfaces indicatives, synchro vers ExtractedRoom avec `is_new`. Il manque la calibration des surfaces et l'export PDF du plan. |

---

## Ce qui manque pour le 10/10

| Prio | Item | Note impact |
|------|------|-------------|
| P2 | **Calibration interactive du scaleFactor** -- "Tracez une distance connue" | +1.5 sur critere 6 |
| P2 | **Snap-to-grid / guides d'alignement** -- pour aligner les pieces entre elles | +0.5 sur critere 3 |
| P2 | **Undo/Redo** -- Ctrl+Z pour revenir en arriere | +0.5 sur critere 3 |
| P2 | **Detection d'adjacence automatique** -- proposer fusion quand 2 pieces se touchent | +0.5 sur critere 5 |
| P3 | **Pinch-to-zoom sur mobile** -- pour naviguer dans un plan complexe | +1.0 sur critere 9 |
| P3 | **Toggle avant/apres** -- voir le plan original vs le plan projet | +1.0 sur critere 8 |
| P3 | **Export PDF du plan modifie** -- pour la plaquette commerciale | +1.0 sur critere 10 |

---

## Fichiers modifies

- `components/marchand/PlanEditor.tsx` -- P0 fusion, P0 distinction existant/projet, P1 texte d'aide, P1 tailles mobile, P1 types, P1 long-press rename, P1 nouvelle piece intelligente
- `app/projet/[id]/extraction/page.tsx` -- P1 placement proportionnel, P1 types, P1 emojis
- `components/marchand/RoomCard.tsx` -- P1 types (ROOM_TYPE_LABELS export)
