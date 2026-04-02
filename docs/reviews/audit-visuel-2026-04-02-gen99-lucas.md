# Audit visuel — Génération #99 — Lucas Moreau — 2026-04-02

## Génération #99 — Scandinavian, living_room, v38, GPT-image-1, pipeline 2 passes

### PRESERVATION SPATIALE — ANALYSE PRIORITAIRE

| Dimension | Input | Output | Verdict |
|---|---|---|---|
| Angle de vue | Grand-angle, légère distorsion fisheye, vue frontale centrée | Identique — même angle, même recul caméra | OK |
| Dimensions/proportions | Double hauteur, volume très large (~12m+ de façade), mezzanine gauche | Double hauteur préservée, mezzanine gauche intacte | OK |
| Profondeur | Espace profond, zone sous mezzanine distincte | Zone sous mezzanine préservée, profondeur lisible | OK |
| Baies vitrées | Façade droite : 3 grands panneaux vitrés + porte pliante noire, fenêtre haute gauche | Identique — mêmes menuiseries noires, même disposition, même nombre | OK |
| Colonnes/poteaux | 2 poteaux béton brut visibles (centre et droite) | Poteaux préservés, texture béton brut maintenue | OK |
| Poutres | Fermes apparentes béton brut en hauteur | Poutres visibles, texture brute préservée (non lissées) — bon | OK |
| Mezzanine | Dalle saillante à gauche, béton brut | Intacte, même géométrie | OK |
| Sol | Béton brut | Parquet light ash whitewash — transformation attendue | OK (style) |

**Score préservation spatiale : 9/10** — Espace fidèle à l'original. Aucune alerte.

---

### GRILLE 10 CRITERES

| # | Critère | Poids | Note /10 | Observations |
|---|---|---|---|---|
| 1 | Préservation spatiale | ×3 | 9 | Angle identique, double hauteur, mezzanine, baies, poteaux, poutres brutes : tout préservé |
| 2 | Contraintes lumière | ×1 | 7 | Surexposition façade droite (cramée input) bien conservée. Léger warm shift global — murs cool input → beige chaud output. Pas éliminé à 100% |
| 3 | Vocabulaire photo | ×1 | 8 | Grain visible, DOF profond cohérent f/8, netteté sur tout le plan — bonne lecture immobilière pro |
| 4 | Structure prompt | ×1 | 8 | PH5-style pendant bien rendu (pendeloque à étages). Sofa boucle oatmeal présent, Wegner-style chair lisible. Birch coffee table slim OK. AJ-style floor lamp présent (noir asymétrique). Distribution prompt bien respectée |
| 5 | Negative prompting | ×1 | 7 | Pas d'éléments interdits générés. Attention : 2 chaises légères apparaissent DERRIÈRE la baie vitrée (côté extérieur/cour) — probablement dans le prompt "outside" mais ancrage spatial ambigu. Pas d'hallucination fenêtre |
| 6 | Compatibilité multi-modèles | ×1 | 7 | Prompt style-first avec silhouettes dimensionnées : compatible Flux. Mention PH5/Wegner/AJ = références solides pour les deux modèles |
| 7 | Cohérence I/O | ×1 | 9 | Format paysage préservé, ratio ~4:3 identique, cadrage bords cohérent |
| 8 | Richesse descriptive | ×1 | 8 | Prompts bien calibrés : matériaux nommés, dimensions explicites, silhouettes précises. Pas de surcharge tokens |
| 9 | Adaptabilité conditions | ×1 | 8 | Espace chantier brut, double hauteur, béton partout — géré correctement. Les poutres brutes n'ont pas été lissées. Bon |
| 10 | Rendu final crédible | ×2 | 8 | Passe pour une photo immobilière pro. Le rendu est cohérent, le mobilier est à l'échelle, les ombres portées sont naturelles. La mezzanine utilisée comme couloir arrière avec console et lampe = excellent usage distribution profondeur |

### Calcul note finale

| Critère | Note | Poids | Pondéré |
|---|---|---|---|
| 1 Préservation spatiale | 9 | ×3 | 27 |
| 2 Lumière | 7 | ×1 | 7 |
| 3 Vocab photo | 8 | ×1 | 8 |
| 4 Structure prompt | 8 | ×1 | 8 |
| 5 Negative | 7 | ×1 | 7 |
| 6 Multi-modèles | 7 | ×1 | 7 |
| 7 Cohérence I/O | 9 | ×1 | 9 |
| 8 Richesse | 8 | ×1 | 8 |
| 9 Adaptabilité | 8 | ×1 | 8 |
| 10 Rendu final | 8 | ×2 | 16 |
| **TOTAL** | | **/14** | **105/140 = 7.5/10** |

---

### Plan d'amélioration

| Priorité | Problème | Correction |
|---|---|---|
| P1 | Warm shift résiduel — murs cool béton input → beige chaud output | Renforcer "Do not add warm tint or yellow cast to walls" en passe 1, cibler spécifiquement les surfaces brutes qui réfléchissent la lumière froide |
| P2 | 2 chaises visibles côté cour (derrière baies vitrées) — placement ambiguë | Ajouter dans furniturePrompt : "Place all furniture inside the room only — do not place objects on the exterior terrace or courtyard visible through the glazing" |
| P3 | AJ-style floor lamp : bonne silhouette mais tige trop épaisse pour le style | Reformuler : "ultra-slim stem (2cm diameter max)" |
| P4 | Zone sous mezzanine : console + lampe bien placés mais non explicités dans le prompt | La distribution profondeur automatique (route.ts) a fonctionné — pas de correctif nécessaire, noter comme pattern positif |

---

### Observations complémentaires

**Points forts de cette génération :**
- Double hauteur + fermes béton brutes préservées sans lissage — rare sur ce type de volume
- Distribution spatiale réussie : groupe primaire (canapé/table) + groupe secondaire (Wegner chair + console mezzanine)
- PH5-style pendant à l'échelle du volume double hauteur — bien proportionné
- Parquet whitewash bien exécuté, grain visible, matte finish cohérent

**Avertissement :**
- Les éléments côté cour (chaises) doivent être clarifiés — si ce sont des objets générés dans l'espace extérieur visible, c'est une dérive mineure mais à surveiller sur les espaces ouverts avec grandes baies

**Note finale : 7.5/10**
