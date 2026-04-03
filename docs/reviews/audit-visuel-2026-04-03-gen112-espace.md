# Audit croisé Yann Duval + Lucas Moreau — Gen #112 Mid-Century Cuisine
Date : 2026-04-03 | Style : Mid-Century | Version : v41 | Focus : calibration d'échelle

---

## PROBLÈME CRITIQUE : Surestimation de l'espace — mobilier surdimensionné

### Analyse de l'input — Estimation de l'espace réel

L'analyse des indices visuels de l'input donne :

- **Prise électrique murale** (mur du fond, gauche) : ~8cm de côté → étalon de référence
- **Tuyaux d'alimentation** (fond mur, groupe cuivre) : ~2cm diamètre
- **Fenêtre** (mur gauche) : largeur estimée ~80-90cm, hauteur ~120cm
- **Mur du fond** (mur principal cuisine) : en rapportant la prise (~8cm) à la largeur totale du mur, largeur estimée **2,4–2,8m maximum**
- **Profondeur de la pièce** : faible — la perspective est compressée, la pièce semble avoir ~2,8–3,2m de profondeur
- **Conclusion Yann** : cette cuisine fait au mieux **2,6m × 3m**, soit ~7–8m². C'est une petite cuisine. Deux rangées de plans de travail (linéaire ou en L court) sont le maximum absolu. **3 plans de travail réalistes.**

### Analyse de l'output — Ce que le modèle a placé

- **Îlot central** : table ovale avec 2 tabourets, ~120cm de long, ~70cm de large
- **Plan de travail mural** : 5 modules (estimés à 60cm chacun = ~300cm de linéaire)
- **Meubles hauts** : 3 modules supplémentaires au-dessus
- **Luminaire Sputnik** : Ø ~60cm
- **Total mobilier** : occupe environ 80% de la surface au sol

**Le modèle a meublé une cuisine de ~15m² dans une pièce de ~7–8m².** L'îlot seul (120cm) laisserait ~70cm de passage de chaque côté dans cette pièce — soit en dessous du minimum ergonomique (90cm).

---

## Grille 10 critères — Yann Duval

| # | Critère | Poids | Note | Observation |
|---|---------|-------|------|-------------|
| 1 | Préservation spatiale | ×3 | **4/10** | Angle et fenêtre OK. Mais le volume meublé ne correspond pas à l'espace réel. La porte à droite est préservée. Le radiateur sous fenêtre est présent. |
| 2 | Fidélité stylistique | ×2 | 8/10 | Mid-Century très lisible : noyer, laiton, Sputnik, tabourets velours vert. Excellent. |
| 3 | Éclairage | ×1 | 7/10 | Lumière naturelle gauche préservée. Pas de warm shift excessif. |
| 4 | Hero pieces | ×1 | 8/10 | Sputnik laiton/noir conforme au style. Tabourets velours teal. Très bien. |
| 5 | Cohérence matières | ×1 | 8/10 | Noyer + laiton + velours + béton clair : palette Mid-Century cohérente. |
| 6 | Crédibilité pro | ×2 | 4/10 | Un pro ne montrerait pas une cuisine impossible à habiter. L'îlot bloque la circulation. |
| 7 | Complétude | ×1 | 7/10 | Tous les éléments d'une cuisine Mid-Century sont là. |
| 8 | Vocabulaire visuel | ×1 | 8/10 | Matériaux, textures, couleurs bien rendus. |
| 9 | Adaptabilité spatiale | ×1 | **2/10** | CRITIQUE. Mobilier dimensionné pour une cuisine de 15m² dans 7–8m². Circulation bloquée. |
| 10 | Potentiel photoréaliste | ×1 | 6/10 | Qualité d'image correcte mais l'incohérence d'échelle brise l'illusion. |

**Calcul pondéré :**
- Préservation (×3) : 4 × 3 = 12
- Fidélité (×2) : 8 × 2 = 16
- Éclairage (×1) : 7
- Hero pieces (×1) : 8
- Matières (×1) : 8
- Crédibilité (×2) : 4 × 2 = 8
- Complétude (×1) : 7
- Vocabulaire (×1) : 8
- Adaptabilité (×1) : 2
- Photoréalisme (×1) : 6

Total : 82 / (14 × 10) → **Note Yann : 5.9/10**

---

## Grille 10 critères — Lucas Moreau

| # | Critère | Poids | Note | Observation |
|---|---------|-------|------|-------------|
| 1 | Préservation spatiale | ×3 | **4/10** | Angle caméra OK. Fenêtre repositionnée légèrement. Proportions mur fond : le modèle a "élargi" mentalement la pièce. |
| 2 | Géométrie et perspective | ×2 | 5/10 | Les lignes de fuite sont plausibles mais le vanishing point semble légèrement décalé vers la droite vs input. |
| 3 | Éclairage et ombres | ×1 | 7/10 | Ombres portées cohérentes avec la fenêtre gauche. Pas d'artefact majeur. |
| 4 | Qualité de rendu | ×1 | 7/10 | Grain film ISO-like présent. Pas de CGI plastique. |
| 5 | Cohérence physique | ×1 | 3/10 | L'îlot à 30cm d'un plan de travail de 300cm dans une pièce de ~2,6m de large est physiquement impossible. |
| 6 | Crédibilité photo | ×2 | 5/10 | L'image est techniquement propre mais l'impossibilité d'échelle brise la crédibilité. |
| 7 | Détail surfaces | ×1 | 7/10 | Sol béton clair, murs blancs, plafond propre : surfaces conformes. |
| 8 | Précision matériaux | ×1 | 8/10 | Noyer veiné, laiton brossé, velours teal : rendu matières très bon. |
| 9 | Cohérence profondeur | ×1 | 4/10 | La profondeur de champ est correcte mais le mobilier ne "s'intègre" pas dans les proportions réelles. |
| 10 | Artefacts IA | ×1 | 7/10 | Peu d'artefacts visibles. Bonne qualité technique globale. |

**Note Lucas : 5.4/10**

---

## Diagnostic cause racine

Le modèle ne lit pas les indices métriques de l'input. Il génère un "kit Mid-Century cuisine" standard sans percevoir que :
1. La prise électrique = ~8cm → mur de fond = ~2,6m seulement
2. Le groupe de tuyaux = ~2cm → espace sous-niche = ~40cm de hauteur sous paillasse
3. La fenêtre + la porte occupent déjà ~1,4m sur les ~2,6m de largeur

Le prompt `furniturePrompt` Mid-Century décrit un ensemble de meubles dimensionnés pour une cuisine standard (~10-12m²) sans mécanisme d'adaptation à l'espace réel.

---

## Recommandations correctives — Texte exact à intégrer

### R1 — Directive d'échelle dans le builder passe 2 (route.ts) — CRITIQUE P0

Ajouter AVANT l'injection du furniturePrompt :

```
Before placing any furniture, estimate the room dimensions from visual cues in the photo:
electrical outlets (~8cm wide), door handles (~1m height), tiles (~30x30cm), pipes (~2cm diameter).
Scale ALL furniture to fit the ACTUAL room size. If the room appears smaller than 10 sqm, use:
- maximum 2 runs of kitchen cabinets (not 4-5)
- NO island if less than 3m clearance on both sides
- compact appliances only
Do NOT default to a standard 12-15 sqm kitchen layout in a visibly smaller space.
```

### R2 — Contrainte de passage ergonomique — HAUTE P1

```
Ensure minimum 90cm clearance between any two parallel furniture pieces.
Ensure minimum 60cm clearance between furniture and any wall.
If the room is too small for an island, replace with a narrow breakfast bar (max 40cm deep) or omit entirely.
```

### R3 — Calibration densité Mid-Century cuisine — MOYENNE P2

Dans le `furniturePrompt` Mid-Century (StylePicker.tsx), ajouter :

```
If the kitchen appears smaller than 10 sqm: limit to one L-shaped or linear run of walnut cabinets (max 2.4m wide), one compact island OR a 2-seat bar counter (not both), and one Sputnik pendant scaled to ceiling height.
```

---

## Résumé

| | Yann | Lucas |
|---|---|---|
| Note | 5.9/10 | 5.4/10 |
| Problème n°1 | Mobilier 15m² dans 7–8m² | Modèle "aveugle" aux indices métriques |
| Qualité stylistique | 8/10 — Mid-Century excellent | 8/10 — rendu matières très bon |
| Blocant | Adaptabilité spatiale 2/10 | Cohérence physique 3/10 |
| Action P0 | Directive d'échelle dans builder passe 2 | Contrainte de passage 90cm |

Le style Mid-Century est parfaitement exécuté. Le problème est exclusivement de calibration d'échelle. La correction R1 dans le builder passe 2 est suffisante pour résoudre 80% du problème sans toucher aux stylePrompts existants.
