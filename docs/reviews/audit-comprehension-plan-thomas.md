# Audit Comprehension Plan - Thomas Berger

**Date** : 2026-04-11 | **Note globale : 6.2 / 10**

## Grille d'evaluation

| # | Question | Note | Commentaire |
|---|----------|------|-------------|
| 1 | Comprehension spatiale | 5/10 | L'IA detecte les pieces closes, les portes, les fenetres (compte par piece). Mais elle ne retourne PAS de coordonnees spatiales — les zones sur le plan sont distribuees en grille aleatoire (`distributeRoomsOnPlan`), pas positionnees ou elles sont reellement sur le plan. Les rectangles colores ne correspondent pas aux vrais murs. |
| 2 | Surfaces | 7/10 | L'IA lit les cotes si elles sont imprimees, sinon estime via la largeur de porte standard (83cm). Chaque piece a un `confidence` 0-1 et un flag `is_estimated`. Correct sur un plan cote, approximatif sinon. |
| 3 | Etages | 8/10 | `extractMultiplePlans` traite chaque fichier comme un etage distinct (floorIndex auto-incremente). La liste est groupee par etage avec header "Rez-de-chaussee" / "Etage 1". Miniature du plan par etage. Solide. |
| 4 | Types de pieces | 6/10 | `inferRoomType` reconnait salon, cuisine, chambre, sdb, wc, bureau, couloir, cave. Mais "salle de reunion" tombe dans "autre" — aucune correspondance pour les locaux pro (bureau open space, salle de reunion, accueil, local technique). Pour un immeuble de bureaux, c'est insuffisant. |
| 5 | Correspondance plan/liste | 4/10 | C'est le GROS probleme. Les zones rectangulaires sont placees en grille proportionnelle aux surfaces, PAS aux positions reelles sur le plan. Si j'ai 6 bureaux, je vois 6 rectangles alignes en grille au-dessus du plan — impossible de savoir lequel est lequel. Le lien visuel plan/liste est factice. |
| 6 | Dimensions | 7/10 | `length_m` et `width_m` sont extraits et stockes en DB. La surface est affichee en m2 dans la liste. Mais les dimensions brutes (L x l) ne sont PAS affichees dans l'UI de la liste — seulement la surface. Pour verifier, il faut ouvrir l'editeur et regarder le recalcul pixel, ce qui n'est pas intuitif. |
| 7 | Ajustement facile | 7/10 | Clic sur le nom pour renommer, select pour changer le type, poubelle pour supprimer, bouton "+ Ajouter une piece". Undo/Redo (Ctrl+Z). Dans l'editeur de plan : drag, resize via 4 poignees. Correct sur desktop. Sur mobile : les 4 poignees de resize a 20px c'est serieux, le long-press pour renommer fonctionne. |
| 8 | Fusion/Split | 7/10 | Fusion implementee : Shift+clic desktop, bouton "Fusionner avec..." sur mobile avec mode fusion (tap la 2e piece). Bounding box englobante. Pas de split (scinder une piece en 2). Pour mon scenario "fusionner 2 bureaux en salon", ca marche. |
| 9 | Erreurs IA | 8/10 | Sortie de secours propre : message d'erreur clair ("Plan illisible"), bouton "Reessayer l'extraction" + bouton vert "Saisir les pieces manuellement". Self-correction Zod si le JSON est invalide. Rate limit 3 essais/projet avec message. Retry auto avec 5s de delai. Bien pense. |
| 10 | Confiance | 5/10 | Le score `confidence` par piece existe en DB mais n'est PAS affiche dans l'UI. Je n'ai aucune indication visuelle que l'IA est sure a 30% ou 95% d'une piece. Le `scale_reference` (cotes lues vs estimation porte) n'est pas montre non plus. Je valide a l'aveugle. |

## Les 5 problemes les plus graves

1. **P0 — Les zones sur le plan ne correspondent pas aux vraies positions des pieces.** `distributeRoomsOnPlan` place les rectangles en grille mathematique. Si j'ai un couloir en L au centre du plan, je vois un rectangle quelque part dans la grille. Pas de mapping reel plan-pieces. L'editeur visuel est un outil de placement MANUEL, pas de comprehension spatiale.

2. **P0 — Le score de confiance IA est cache.** `confidence` est en DB, jamais affiche. Quand l'IA dit "surface estimee, confiance 0.3", je ne le sais pas. Je risque de valider des surfaces fausses sans le savoir.

3. **P1 — Les types de pieces pro sont absents.** "salle de reunion", "accueil", "open space", "local technique", "archives", "salle serveur" tombent tous dans "autre". Pour un immeuble de bureaux, c'est la moitie des pieces.

4. **P1 — Les dimensions L x l ne sont pas affichees dans la liste.** Seule la surface m2 apparait. Pour verifier, je dois calculer mentalement ou ouvrir l'editeur. Un marchand veut voir "4.2m x 3.1m = 13.0 m2" d'un coup d'oeil.

5. **P2 — Le `scale_reference` n'est pas communique.** L'IA dit si elle a lu les cotes sur le plan ou si elle a estime via la porte standard. Cette info est critique pour la confiance mais elle est cachee.

## Ce qui marche bien

- **Pipeline multi-etage** : chaque fichier = un etage, fusion propre, header par etage avec miniature du plan. Mon scenario RDC + Etage 1 fonctionne.
- **Gestion d'erreur** : sortie de secours vers saisie manuelle, messages en francais, retry automatique, self-correction Zod.
- **Editeur de plan** : undo/redo, calibration (tracer une ligne + entrer la distance reelle), guides d'alignement, zoom, mode fusion mobile. Fonctionnel et bien pense.
- **Animation de loading** : miniature du plan avec barre de scan animee, timer en secondes, estimation "~30 secondes". Thomas sait ce qui se passe.
- **PDF support** : conversion PDF vers PNG via pdf-to-img avant envoi a GPT-4.1. Pas besoin que Thomas convertisse son plan.
