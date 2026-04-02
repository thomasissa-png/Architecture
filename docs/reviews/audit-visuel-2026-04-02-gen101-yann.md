# Audit visuel — Génération #101 Haussmannien salle de bain
**Date** : 2026-04-02 | **Agent** : Yann Duval | **Modèle** : GPT-image-1 pipeline 2 passes v39

---

## Analyse préservation spatiale (critère n°1)

INPUT : couloir de salle de bain très étroit (environ 1,2-1,4m de large), angle de vue portrait serré depuis le couloir d'entrée, baignoire encastrée sur la droite, carrelage gris en hauteur côté baignoire, convecteur électrique visible au premier plan droit, sol carrelage blanc 20x20, plafond bas, aucune fenêtre visible.

OUTPUT : la pièce est RADICALEMENT transformée. La largeur perçue est doublée (espace de 2,5-3m apparent). L'angle de vue est identique (portrait, depuis l'entrée, en enfilade) — c'est le seul point commun. Le convecteur a disparu. La baignoire est repositionnée à droite en îlot. Un double meuble vasque apparaît à gauche, inexistant dans l'input. La profondeur de la pièce semble augmentée d'au moins 50%. Les proportions sont fondamentalement différentes.

**ALERTE : l'espace n'est pas fidèle à l'original. La largeur est au minimum doublée, le convecteur a disparu, un second meuble vasque a été inventé. La géométrie de la pièce a été modifiée en profondeur.**

---

## Grille d'évaluation — 10 critères

| # | Critère | Poids | Note /10 | Commentaire |
|---|---------|-------|----------|-------------|
| 1 | Préservation spatiale | ×3 | 3/10 | Largeur doublée, convecteur supprimé, meuble vasque gauche inventé, profondeur augmentée. L'angle de vue en enfilade est préservé — seul point positif. |
| 2 | Fidélité stylistique | ×2 | 6/10 | Le lustre à cristaux et bras dorés est juste. Mais le parquet en chevrons haussmannien est remplacé par un tapis jute — erreur de style. Les matériaux (laiton vieilli, marbre) sont absents. Le meuble vasque en noyer foncé est acceptable mais trop contemporain. |
| 3 | Éclairage | ×1 | 6/10 | Lumière chaude cohérente avec l'ambiance Haussmannien. Le lustre apporte une touche juste. Mais les spots encastrés modernes (visibles plafond) trahissent le style. Pas de warm shift excessif mais la luminosité globale est augmentée artificiellement vs un input très sombre. |
| 4 | Hero pieces | ×1 | 5/10 | Lustre cristal/bronze doré : correct. Baignoire îlot : présente. Meuble vasque noyer : acceptable. Miroir rétroéclairé : trop contemporain pour du Haussmannien pur. Absence de robinetterie en laiton vieilli visible. |
| 5 | Cohérence matières | ×1 | 5/10 | Noyer foncé + laiton : cohérent. Tapis jute au sol : rupture avec le parquet chevrons prescrit. Carrelage crème dans la douche : neutre. La combinaison reste lisible mais le sol est une faute. |
| 6 | Crédibilité pro | ×2 | 6/10 | L'image est plaisante et vendable. Mais un architecte n'accepterait pas : la pièce ne correspond plus à la pièce d'origine, le miroir rétroéclairé LED est une pièce contemporaine dans un contexte Haussmannien, la porte à gauche (reflet miroir) crée une ambiguïté spatiale. |
| 7 | Complétude | ×1 | 7/10 | La douche à l'italienne, le meuble vasque, le tabouret teck, le panier osier, la fougère sont présents. Le porte-serviettes est présent (noir — cohérent). Pas de robinetterie laiton visible. |
| 8 | Vocabulaire visuel | ×1 | 5/10 | Palette crème/beige chaud : juste pour Haussmannien. Mais le marbre est absent, le laiton vieilli est à peine suggéré, la texture velours/cristal du style est totalement absente. L'ensemble est trop "spa contemporain". |
| 9 | Adaptabilité spatiale | ×1 | 4/10 | Le mobilier est surdimensionné pour une salle de bain étroite (double vasque inexistante, baignoire îlot dans un couloir). Le modèle a rendu l'espace habitable en l'agrandissant — ce qui est une falsification. |
| 10 | Potentiel photoréaliste | ×1 | 7/10 | L'image est convaincante comme photo de salle de bain de standing. Le grain, les ombres portées, la lumière sont réalistes. Mais ce n'est pas la salle de bain photographiée en input. |

---

## Calcul note finale

| Critère | Note | Poids | Score pondéré |
|---------|------|-------|---------------|
| Préservation spatiale | 3/10 | ×3 | 9 |
| Fidélité stylistique | 6/10 | ×2 | 12 |
| Éclairage | 6/10 | ×1 | 6 |
| Hero pieces | 5/10 | ×1 | 5 |
| Cohérence matières | 5/10 | ×1 | 5 |
| Crédibilité pro | 6/10 | ×2 | 12 |
| Complétude | 7/10 | ×1 | 7 |
| Vocabulaire visuel | 5/10 | ×1 | 5 |
| Adaptabilité spatiale | 4/10 | ×1 | 4 |
| Potentiel photoréaliste | 7/10 | ×1 | 7 |
| **TOTAL** | | **14** | **72** |

**Note finale : 72/140 = 5.1/10**

Note plafonnée à 5/10 (préservation spatiale < 7/10 — règle absolue).

**Note finale : 5.1/10 — PLAFONNÉE à 5.0/10**

---

## Synthèse (3 lignes)

Le pipeline produit une salle de bain Haussmannienne visuellement convaincante et commercialisable — mais ce n'est pas la salle de bain de l'input. La largeur est au moins doublée, le convecteur supprimé, un meuble vasque inventé côté gauche : le modèle a redessiné l'espace plutôt que de l'habiller. Le style Haussmannien est partiellement capturé (lustre cristal, noyer, palette crème) mais dilué par des éléments contemporains (miroir LED, spots encastrés, absence de marbre et laiton vieilli).

**Priorité absolue P0** : rétablir la géométrie de la pièce — angle de vue identique, largeur originale (couloir étroit), suppression du meuble vasque gauche inventé. **P1** : remplacer le tapis jute par du parquet chevrons chêne clair ou du carrelage marbre blanc. **P2** : robinetterie laiton vieilli visible, supprimer les spots encastrés modernes.
