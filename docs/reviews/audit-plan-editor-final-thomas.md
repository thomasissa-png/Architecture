# Audit PlanEditor FINAL -- Thomas Berger, Marchand de Biens

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux
> Composants : `components/marchand/PlanEditor.tsx` + `app/projet/[id]/extraction/page.tsx`
> Cas d'usage : bureaux 200m2 a transformer en T4
> Baseline : audit session 42 = 8.2/10
> Seuil : 9.5/10 (preference fondateur)
> Date : 2026-04-11

---

## Nouvelles features auditees

1. **Calibration echelle** -- Bouton "Calibrer", 2 points + modal distance reelle, crosshair, ligne tiretee indigo, indication "1 m = Xpx". Astuce porte 0.83m. Modal bottom-sheet mobile avec safe-area. BIEN.
2. **Undo/Redo** -- 20 etats, Ctrl+Z / Ctrl+Shift+Z, boutons toolbar avec icones, disabled quand vide, snapshot avant chaque mutation. BIEN.
3. **Snap-to-grid 10px + guides alignement bleus** -- Snap sur toutes les ops, guides tiretees indigo entre bords/centres de pieces. Dedupliques. BIEN.
4. **Toggle "Plan actuel / Mon projet"** -- Segmented control, filtre `isNew`, visible seulement quand il y a des pieces projet. BIEN.

---

## Note : 8.8 / 10 (+0.6 vs session 42)

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Comprehension immediate | 9 | Texte d'aide en haut, instructions claires, legende complete. |
| 2 | Placement des pieces | 7 | Toujours en grille, pas sur le plan reel. Acceptable. |
| 3 | Manipulation | 9 | Snap-to-grid, guides alignement, undo/redo, poignees 20px. Solide. |
| 4 | Creation de pieces | 8 | Pres de la selection, taille proportionnelle, badge Projet. |
| 5 | Suppression/fusion | 8.5 | Multi-select + fusionner. Pas de detection automatique d'adjacence. |
| 6 | Surfaces | 7 | Calibration presente MAIS non cablee dans la page parent (voir P0). |
| 7 | Types de pieces | 9.5 | 17 types couvrent tout le vocabulaire immo. |
| 8 | Etat existant vs futur | 9 | Toggle plan actuel/projet. Distinction visuelle claire. |
| 9 | Mobile | 7.5 | Touch targets 44px, appui long rename. Mais ZERO pinch-to-zoom sur plan 200m2. |
| 10 | Resultat | 7 | Pas d'export PDF du plan modifie. La calibration ne remonte pas au parent. |

---

## Corrections pour atteindre 9.5/10

### P0 -- Calibration non cablee (BLOQUANT)

`extraction/page.tsx` ligne 618 : `scaleFactor={50}` est hardcode, `onScaleFactorChange` n'est PAS passe.
La calibration fonctionne visuellement dans PlanEditor mais ne remonte JAMAIS au parent.
`syncPlanToExtracted` ligne 200 utilise toujours `scaleFactor: 50` hardcode.

**Fix** : ajouter un state `scaleFactor` dans ExtractionPage, le passer en prop avec le callback, et l'utiliser dans `handlePlanRoomsChange`.

Fichier : `app/projet/[id]/extraction/page.tsx`, lignes 178-204 et 618.

### P1 -- Pinch-to-zoom absent

Sur mon iPhone 15 Pro, un plan de bureaux de 200m2 avec 10+ pieces est ILLISIBLE sans zoom.
Le container a `touch-pan-x touch-pan-y` mais pas de gestion du pinch-to-zoom.
Le CSS `overflow: auto` ne suffit pas sur mobile pour un plan complexe.

**Fix** : ajouter un state `zoomLevel` (1x-3x) avec boutons +/- dans la toolbar (min-h 44px) + transformation CSS `scale()` sur le container interne. Alternative : `touch-action: manipulation` + gestion native du zoom navigateur.

Fichier : `components/marchand/PlanEditor.tsx`, lignes 910-916.

### P1 -- Export PDF du plan modifie absent

Quand je casse 3 murs et cree 2 pieces dans mon projet de bureaux-en-T4, je veux pouvoir telecharger le plan modifie en PDF pour ma plaquette. Aujourd'hui il n'y a aucun bouton d'export.

**Fix** : bouton "Telecharger le plan" dans la toolbar, qui capture le container en canvas (html2canvas ou dom-to-image) puis genere un PDF avec le plan + legende + surfaces.

### P2 -- Detection d'adjacence automatique

Quand 2 pieces se touchent apres un drag, proposer automatiquement "Fusionner ces 2 pieces ?".
Aujourd'hui il faut Shift+clic manuellement sur chacune.

**Fix** : dans `handlePointerUp`, verifier si la piece deplacee a un bord a moins de 5px d'une autre piece. Si oui, afficher un toast "Fusionner avec [nom] ?" pendant 3 secondes.

---

## Verdict

**8.8/10 -- SOUS LE SEUIL 9.5/10.** Iteration corrective requise.

Le P0 (calibration non cablee) est un bug fonctionnel : Thomas fait l'effort de calibrer son plan et les surfaces restent fausses. Les P1 (pinch-to-zoom + export PDF) sont des manques fonctionnels critiques pour un marchand de biens qui travaille sur des plans de 200m2 depuis son iPhone et qui a besoin de ces plans dans ses plaquettes.
