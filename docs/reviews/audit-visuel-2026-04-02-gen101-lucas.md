# Audit Visuel — Gen #101 Haussmannian Bathroom — Lucas Moreau
**Date** : 2026-04-02 | **Modèle** : GPT-image-1 pipeline 2 passes v39 | **Style** : Haussmannian | **Type** : Salle de bain

---

## ALERTE : L'espace n'est pas fidèle à l'original

L'input montre une salle de bain TRÈS étroite (couloir ~1.2m de large), angle portrait serré, baignoire encastrée à droite, carrelage gris au sol et sur les murs du fond, convecteur électrique au premier plan droite. L'output présente une pièce BEAUCOUP plus large (~2.5m apparent), deux vasques distinctes, baignoire îlot à droite, sol en jonc/sisal orangé, plafond avec spots encastrés — espace fondamentalement différent. Note plafonnée à 5/10.

---

## Grille d'évaluation — 10 critères

| # | Critère | Poids | Observation | Note brute |
|---|---------|-------|-------------|-----------|
| 1 | **Préservation spatiale** | ×3 | Angle de vue modifié (légèrement plus ouvert). Largeur apparente de la pièce doublée. Baignoire encastrée → baignoire îlot freestanding. Convecteur supprimé. Carrelage gris fond → paroi de douche en mosaïque travertine. Espace couloir → espace salle de bain bourgeoise spacieuse. ESPACE IRRÉEL vs original. | 2/10 |
| 2 | **Contraintes lumière** | ×1 | Input : pièce sombre, éclairage ambiant froid, zéro fenêtre visible. Output : warm light généreuse, spots encastrés, lustre allumé, miroir rétroéclairé. Warm shift massif non justifié. Luminosité multipliée par 3+. | 3/10 |
| 3 | **Vocabulaire photo** | ×1 | Grain absent, rendu CGI-clean net. DOF cohérent avec f/8. Vignettage absent. Pas de natural lens distortion d'un 16-35mm. | 5/10 |
| 4 | **Structure prompt** | ×1 | Tous les éléments du furniturePrompt sont présents : vanity, miroir rétroéclairé, ladder towel (remplacé par sèche-serviettes mural noir), stool teck, panier woven, plante. Le lustre cristal/bronze doré du surfacePrompt est présent. Prompt bien suivi sur les objets. | 7/10 |
| 5 | **Negative prompting** | ×1 | Pas d'éléments explicitement interdits générés. Pas de rideaux, pas de wall art. Le sèche-serviettes mural noir remplace le towel ladder chrome (divergence matériaux). | 6/10 |
| 6 | **Compatibilité multi-modèles** | ×1 | Prompt intelligible pour GPT-4.1 ET Flux. Structure correcte. Mais "If large add soaking tub" a déclenché la baignoire îlot alors que la pièce est étroite — logique conditionnelle mal calibrée pour les espaces exigus. | 5/10 |
| 7 | **Cohérence I/O** | ×1 | Format portrait préservé. Ratio approximativement identique. Dimensions OK. | 7/10 |
| 8 | **Richesse descriptive** | ×1 | Prompts bien détaillés, dimensions explicites (80-90cm, 170x75cm), matériaux nommés (aged brass, marble, gilt bronze). Bonne richesse sans surcharge. | 8/10 |
| 9 | **Adaptabilité conditions** | ×1 | La pièce sombre et étroite de l'input n'est pas gérée : le modèle a ignoré les contraintes d'espace exigu et de lumière basse. La directive "If large add soaking tub" est mal interprétée — la pièce n'est PAS large. | 3/10 |
| 10 | **Rendu final crédible** | ×2 | En isolation, l'output est esthétiquement cohérent et vendable comme visuel de salle de bain Haussmannienne. Mais aucun rapport avec la pièce d'origine — ne passerait pas la vérification acheteur sur site. | 5/10 |

---

## Calcul note finale

| Critère | Note brute | Poids | Score pondéré |
|---------|-----------|-------|---------------|
| Préservation spatiale | 2/10 | ×3 | 6/30 |
| Contraintes lumière | 3/10 | ×1 | 3/10 |
| Vocabulaire photo | 5/10 | ×1 | 5/10 |
| Structure prompt | 7/10 | ×1 | 7/10 |
| Negative prompting | 6/10 | ×1 | 6/10 |
| Compatibilité multi-modèles | 5/10 | ×1 | 5/10 |
| Cohérence I/O | 7/10 | ×1 | 7/10 |
| Richesse descriptive | 8/10 | ×1 | 8/10 |
| Adaptabilité conditions | 3/10 | ×1 | 3/10 |
| Rendu final crédible | 5/10 | ×2 | 10/20 |
| **Total** | | **×14** | **60/140** |

**Note finale : 4.3/10** (plafonnée à 5/10 par règle préservation spatiale — mais le calcul brut donne déjà 4.3)

---

## Synthèse (3 lignes)

**Point critique.** La pièce d'origine est un couloir-salle de bain de ~1.2m de largeur avec baignoire encastrée et convecteur : le modèle a généré une salle de bain Haussmannienne spacieuse d'environ 2.5m de large avec baignoire îlot, ce qui constitue une recréation de scène, pas une édition. La préservation spatiale est à 2/10 — angle, proportions, équipements fixes, et surface au sol sont tous incorrects.

**Point secondaire.** Le warm shift est massif et non justifié : la pièce sombre de l'input (ambiance cold/neutre) devient une salle de bain dorée et bien éclairée. La directive "do not add warm tint or yellow cast" n'a pas été respectée, probablement écrasée par les matériaux chauds du furniturePrompt (aged brass, gilt bronze, teck).

**Recommandations P0.** (1) Ajouter dans le builder passe 2 une contrainte sur la baignoire conditionnelle : "Only add freestanding tub if the input room is clearly wider than 2m — in a narrow bathroom, keep the existing bathtub or omit it". (2) Renforcer la règle anti-warm-shift : "Warm-toned materials (brass, bronze, wood) must NOT shift the global color temperature — the wall color must stay as cooled/neutral as in passe 1 output". (3) Ajouter la détection de "bathroom narrow corridor" pour désactiver les éléments de meuble qui supposent une grande largeur (double vasque, baignoire îlot).

---

*Lucas Moreau — Expert IA Image — Versimo Audit #101*
