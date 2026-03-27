# Audit Visuel Generations #31-36 — Lucas Moreau, Expert IA Image

Date : 2026-03-26

## Tableau Recapitulatif

| # | Style | Preserv. archi (x2) | Lumiere | Vocab photo | Prompt fidelite | Neg. prompt | Multi-modele | Coher. I/O | Richesse | Adaptabilite | Rendu final (x2) | **Pondere /10** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 31 | Scandinavian 2p | 8 | 8 | 8 | 9 | 8 | 7 | 7 | 8 | 8 | 8 | **8.0** |
| 32 | Japandi 2p | 7 | 7 | 8 | 8 | 6 | 7 | 7 | 7 | 7 | 7.5 | **7.2** |
| 33 | Japandi iter. | 5 | 6 | 6 | 3 | 2 | 5 | 7 | 4 | 6 | 5 | **4.8** |
| 34 | Contemp. outdoor | 8 | 8 | 7 | 7 | 7 | 7 | 7 | 6 | 8 | 7 | **7.3** |
| 35 | Contemp. outdoor iter. | 7 | 5 | 5 | 6 | 5 | 5 | 7 | 5 | 5 | 5 | **5.6** |
| 36 | Scandinavian p1 | 8 | 8 | 8 | 9 | 9 | 7 | 8 | 8 | 9 | 8.5 | **8.3** |

**Moyenne ponderee : 6.9/10**

## Analyse par Generation

### #31 Scandinavian (salon, 2 passes) — 8.0/10
Input : chantier brut, placo apparent, cables electriques pendants, chape beton. Pass1 : surfaces propres, sol chene clair, PH5-style pendant — transformation radicale mais angle identique. Output : canape lin clair, fauteuil bois cordage (Wegner-style), table basse chene, 2 lampadaires noirs asymetriques. La perspective est preservee : le coin de mur central reste au meme point de fuite. Le sol passe du beton brut a un parquet chene clair credible. Les prises electriques basses du mur droit ont disparu (acceptable — passe surfaces). Leger warm shift sur les murs (blanc froid input vers blanc creme output). Les ombres portees sous le canape et la table sont coherentes avec la source lumineuse du pendant. Rendu credible comme photo immobiliere.

### #32 Japandi (salon, 2 passes) — 7.2/10
Meme input que #31. Pass1 : suspension washi spherique, sol chene clair, murs blanc creme. Probleme : les cables electriques du mur gauche (coin haut) et la prise murale sont encore visibles en pass1 — la passe surfaces n'a pas nettoye ces elements de chantier. Output : canape bas beige, table basse bois, coussin au sol, vase wabi, orchidee. Composition minimaliste coherente Japandi (densite ~35%). Le point de fuite est legerement decale vers la droite par rapport a l'input — la colonne/retrait mural central parait plus etroite. Le warm shift est plus prononce que #31 (murs presque beige). Ombres portees presentes mais douces, coherentes. L'orchidee sur la table d'appoint est un cliche IA recurrent.

### #33 Japandi iteration "rajoute etageres mur" — 4.8/10
**Violation contrainte "no wall-mounted" : OUI.** Deux etageres metalliques noires type industriel posees contre les murs gauche et droit. Ces etageres sont freestanding (pieds au sol), pas fixees au mur — donc techniquement pas "wall-mounted", mais elles sont stylistiquement anti-Japandi (metal noir grille industrielle vs bois clair/minimalisme). Le mobilier du #32 (canape, table, coussin) a COMPLETEMENT DISPARU — l'iteration a remplace le contenu au lieu de l'enrichir. Les cables de chantier du mur gauche sont reapparus. Le sol a change de teinte (plus chaud, presque jute). La suspension washi est preservee. Le resultat ressemble a un showroom d'etageres vide, pas a un salon habite.

### #34 Contemporain outdoor (passe 1 seule) — 7.3/10
Input : cour interieure de type loft/atelier, charpente metallique apparente, verriere, baies vitrees, chape brute, regard d'eau. Output : sol remplace par carrelage gris clair rectangulaire, murs nettoyes, verriere preservee. La structure metallique (arcs, poteaux, traverses) est intacte — excellent respect de la geometrie complexe. La descente de gouttiere grise est conservee. Le regard d'eau au sol est preserve (bon detail). La porte bois a gauche et les paves de verre sont fideles. Lumiere naturelle zenitale coherente a travers la verriere. Pas de mobilier (passe 1 only) — conforme. Leger eclaircissement global des murs (physiquement correct avec le carrelage clair).

### #35 Contemporain outdoor iteration — 5.6/10
Un canape d'angle gris fonce est apparu au centre de la cour. Probleme majeur : le rendu a subi une degradation globale — les murs sont devenus gris/sales (perte de la finition propre de #34), les vitres des baies sont opaques/verdatres au lieu de transparentes. La charpente metallique est preservee mais les details des traverses sont moins nets. Le canape lui-meme est credible (ombres portees presentes, echelle correcte par rapport a la porte), mais il est seul — aucune table, plante, luminaire exterieur. La composition est desequilibree (un seul meuble dans un grand espace). Color grading froid gris-vert non present dans l'input. L'iteration a degrade la qualite des surfaces au lieu de simplement ajouter du mobilier.

### #36 Scandinavian passe 1 seule — 8.3/10
Input : piece avec murs violet fonce, parquet bois clair, fenetre a croisillons, radiateur convecteur sous fenetre. Output : murs blanc propre, parquet eclairci (chene blanchi), suspension PH5-style. Excellente preservation : la fenetre (position, taille, croisillons, appuis) est identique. Le radiateur convecteur est conserve — conforme a la directive Sprint 18 #147. La lumiere naturelle laterale depuis la fenetre est preservee avec le meme gradient ombre droite. Le passage de violet a blanc a logiquement augmente la luminosite ambiante (physiquement correct). Le luminaire PH5 est bien centre. Pas de fenetre hallucinee, pas de porte inventee. Meilleure generation du lot.

## Patterns Techniques Recurrents

1. **Pipeline 2 passes valide pour les generations completes** : #31 et #32 montrent que passe 1 (surfaces) + passe 2 (mobilier) produit des resultats coerents. Les surfaces de pass1 sont bien preservees en pass2.
2. **Les iterations detruisent le contexte precedent** : #33 et #35 montrent que l'iteration ne fait pas d'ajout incremental — elle regenere toute la scene. #33 a perdu tout le mobilier Japandi. #35 a degrade les surfaces propres de #34. C'est le probleme le plus grave du pipeline actuel.
3. **Warm color shift systematique** : toutes les generations interieures (#31, #32, #33, #36) derivent vers le beige/creme malgre "preserve color temperature". Plus prononce sur Japandi (#32) que Scandinave (#31).
4. **Cables de chantier residuels en pass1** : #32 pass1 conserve des cables electriques visibles au mur gauche. La passe surfaces devrait nettoyer ces elements.
5. **Preservation geometrie excellente sur structures complexes** : #34 (charpente metallique, verriere) montre que le modele gere bien les geometries non-rectangulaires.
6. **Radiateur preserve (#36)** : la directive Sprint 18 fonctionne — le convecteur sous fenetre est intact.
7. **Passe 1 seule souvent superieure** : #34 (7.3) et #36 (8.3) en passe 1 seule sont plus propres que certaines generations 2 passes, car pas de risque de degradation en passe 2.

## Recommandations P0

- **P0 : Fix iterations** — l'iteration doit recevoir l'image output precedente + instruction d'AJOUT, pas de regeneration. Actuellement le modele ne sait pas qu'il doit conserver le mobilier existant.
- **P0 : Warm shift** — renforcer "do not warm or cool the walls" dans le builder, ou ajouter au negative prompt "warm color cast, yellow tint, beige shift".
- **P1 : Nettoyage chantier en pass1** — ajouter "remove visible construction elements (dangling cables, junction boxes, tape)" au builder surfaces.
