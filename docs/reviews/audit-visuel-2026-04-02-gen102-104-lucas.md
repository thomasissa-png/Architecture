# Audit visuel — Lucas Moreau — Générations #102-104 — 2026-04-02

Modèle : GPT-4.1 (passe 1 + passe 2). Version v39. 3 générations auditées.

---

## #102 — Industrial — Salle de bain — 144s

**ALERTE PRESERVATION SPATIALE : l'espace n'est PAS fidèle à l'original.**
Input : salle de bain étroite, carrelage blanc/gris, baignoire encastrée, convecteur au sol, angle très serré depuis l'embrasure de porte, profondeur ~2m visible.
Output : salle de bain plus large, murs béton ciré, douche à l'italienne avec paroi vitrée, meuble vasque, deux sèche-serviettes muraux, miroir LED. L'angle de vue est similaire mais la pièce est **entièrement reconfigurée**. La baignoire a changé de type (paroi vitrée ajoutée), le sol carrelé blanc est remplacé par béton continu, les murs carrelage supprimés. Le convecteur au sol a disparu. Aucun équipement d'origine préservé.

| # | Critère | Poids | Note | Observations |
|---|---------|-------|------|--------------|
| 1 | Préservation spatiale | ×3 | 3/10 | Pièce redessinée : carrelage mural supprimé, baignoire transformée, convecteur effacé, proportions élargies |
| 2 | Contraintes lumière | ×1 | 5/10 | Éclairage low-light cohérent mais warm shift prononcé (ambre/orange) vs input neutre-froid |
| 3 | Vocabulaire photo | ×1 | 7/10 | Grain visible, DOF correct, belle profondeur |
| 4 | Structure prompt | ×1 | 6/10 | Style industriel lisible (béton, métal noir, Edison) mais salle de bain ≠ salon |
| 5 | Negative prompting | ×1 | 4/10 | Convecteur disparu, carrelage effacé — éléments existants supprimés |
| 6 | Compatibilité multi-modèles | ×1 | 7/10 | Prompt GPT-4.1 fonctionnel |
| 7 | Cohérence I/O | ×1 | 6/10 | Ratio 1024×1536 préservé, mais contenu radicalement différent |
| 8 | Richesse descriptive | ×1 | 7/10 | Rendu riche et détaillé |
| 9 | Adaptabilité conditions | ×1 | 4/10 | Pièce sombre et étroite → le modèle a agrandi et éclairé artificiellement |
| 10 | Rendu final crédible | ×2 | 7/10 | Visuellement convaincant comme photo pro — mais ce n'est plus la même pièce |

**Note pondérée : (3×3 + 5 + 7 + 6 + 4 + 7 + 6 + 7 + 4 + 7×2) / 14 = (9+5+7+6+4+7+6+7+4+14)/14 = 69/14 = 4.9/10**

Synthèse : rendu industriel esthétiquement réussi mais échec de préservation spatiale total. La salle de bain a été redessinée de zéro. Note plafonnée à 5/10 per règle critique.

---

## #103 — Art Deco — Chantier brut (salon) — 160s

Input : grande pièce en chantier, plafond arraché avec poutres et plaques en vrac, sol vinyle gris, 2 personnes visibles, grande fenêtre droite, mur du fond en briques apparentes partiellement.
Output : salon Art Deco sombre et très atmosphérique. Voûtes inventées au plafond (non présentes dans l'input), murs en enduit doré-brun, sol chevrons noir/or, canapé bleu velours courbé, tapis chevron, luminaire lanterne. **La fenêtre est préservée en position et taille.** L'angle de vue est comparable.

**ALERTE PRESERVATION SPATIALE : voûte en berceau totalement inventée.** Le plafond input était plat/arraché, non vouté. Le modèle a généré une architecture voûtée gothico-Art Deco inexistante. Les deux personnes ont disparu (attendu). La profondeur de la pièce semble réduite.

| # | Critère | Poids | Note | Observations |
|---|---------|-------|------|--------------|
| 1 | Préservation spatiale | ×3 | 4/10 | Voûte inventée, profondeur réduite, briques effacées, plafond reconstruit — seule fenêtre correcte |
| 2 | Contraintes lumière | ×1 | 4/10 | Éclairage très sombre et warm — input était en lumière naturelle diurne abondante |
| 3 | Vocabulaire photo | ×1 | 7/10 | Grain et atmosphère photographiques corrects |
| 4 | Structure prompt | ×1 | 7/10 | Art Deco lisible, mobilier iconique, tapis chevron |
| 5 | Negative prompting | ×1 | 6/10 | Pas de rideaux, pas d'éléments interdits visibles |
| 6 | Compatibilité multi-modèles | ×1 | 7/10 | GPT-4.1 fonctionnel |
| 7 | Cohérence I/O | ×1 | 5/10 | Format préservé mais pièce méconnaissable |
| 8 | Richesse descriptive | ×1 | 8/10 | Rendu très détaillé, accessoires nombreux |
| 9 | Adaptabilité conditions | ×1 | 3/10 | Chantier brut → architecture inventée au lieu d'appliquée sur l'existant |
| 10 | Rendu final crédible | ×2 | 6/10 | Beau rendu Art Deco mais trop cinématographique, couleurs saturées |

**Note pondérée : (4×3 + 4 + 7 + 7 + 6 + 7 + 5 + 8 + 3 + 6×2) / 14 = (12+4+7+7+6+7+5+8+3+12)/14 = 71/14 = 5.1/10**

Synthèse : Art Deco stylistiquement cohérent mais la voûte inventée est un échec de préservation spatiale rédhibitoire. Chantier brut = cas limite difficile. Note plafonnée à 5/10.

---

## #104 — Art Deco — Même chantier brut — 154s (itération)

Input : identique à #103 (même espace chantier, même angle, même fenêtre).
Output : salon Art Deco plus clair. Voûtes toujours présentes mais moins sombres, texture dorée-crème, poutres en relief visible, fenêtre préservée avec radiateur en dessous (bon signe), chauffe-eau cylindrique visible à droite de la fenêtre (préservé). Angle de vue très proche de l'input. Proportions mieux respectées que #103. Canapé bleu velours courbé, tapis chevron, table basse dorée.

**ALERTE PRESERVATION SPATIALE (atténuée) : voûtes toujours inventées** — le plafond plat/arraché reste transformé en voûte architecturée. Cependant : fenêtre préservée, radiateur préservé, chauffe-eau préservé, profondeur mieux rendue.

| # | Critère | Poids | Note | Observations |
|---|---------|-------|------|--------------|
| 1 | Préservation spatiale | ×3 | 5/10 | Voûte inventée mais fenêtre + radiateur + chauffe-eau préservés, proportions meilleures qu'en #103 |
| 2 | Contraintes lumière | ×1 | 6/10 | Plus proche de la lumière naturelle input, warm shift modéré |
| 3 | Vocabulaire photo | ×1 | 7/10 | Grain, DOF, netteté corrects |
| 4 | Structure prompt | ×1 | 7/10 | Art Deco lisible, cohérent |
| 5 | Negative prompting | ×1 | 7/10 | Pas d'éléments interdits, équipements muraux préservés |
| 6 | Compatibilité multi-modèles | ×1 | 7/10 | GPT-4.1 fonctionnel |
| 7 | Cohérence I/O | ×1 | 6/10 | Format préservé, pièce partiellement reconnaissable |
| 8 | Richesse descriptive | ×1 | 7/10 | Détails fins, accessoires cohérents |
| 9 | Adaptabilité conditions | ×1 | 5/10 | Meilleure gestion du chantier brut vs #103 |
| 10 | Rendu final crédible | ×2 | 7/10 | Plus crédible que #103, lumière plus réaliste |

**Note pondérée : (5×3 + 6 + 7 + 7 + 7 + 7 + 6 + 7 + 5 + 7×2) / 14 = (15+6+7+7+7+7+6+7+5+14)/14 = 81/14 = 5.8/10**

Synthèse : meilleure génération des trois. Équipements muraux préservés (radiateur, chauffe-eau) — progrès réel vs #103. La voûte inventée reste le problème principal.

---

## Plan d'amélioration

**P0 — Chantier brut = cas critique.** Le modèle invente l'architecture quand le plafond est arraché. Ajouter dans le builder passe 1 : "If the ceiling is partially demolished or shows structural elements in progress, preserve the same ceiling height and flat plane — do NOT add vaults, arches or ornamental geometry."

**P1 — Salle de bain non reconnue comme telle (#102).** La pièce était une salle de bain, pas un salon. Le style "Industrial" a été appliqué sans tenir compte du type de pièce. Le roomType doit conditionner le furniturePrompt (mobilier SdB vs salon).

**P2 — Warm shift systématique.** Les 3 générations présentent un décalage chaud vs les inputs (neutres à froids). Renforcer "Do not add warm tint or yellow cast" — la directive existe mais l'effet persiste.

**P3 — #103 voûte trop sombre.** Le style Art Deco "sombre" écrase la lumière naturelle abondante de l'input. Rappel : la lumière de l'input est sacrée, les styles ne peuvent pas imposer une ambiance lumineuse opposée.
