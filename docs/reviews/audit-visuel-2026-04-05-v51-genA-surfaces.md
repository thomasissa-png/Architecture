# Audit Visuel — Generation #184 (Surfaces Only, Scandinave)

**Date** : 2026-04-05
**Auditeurs** : Yann Duval (architecte d'interieur) + Lucas Moreau (expert IA image)
**Mode** : Surfaces uniquement (withFurniture: false) — piece VIDE attendue
**Style** : Scandinave
**Modele** : gpt-image-1.5 (Responses API)
**Version builders** : v51

---

## Verdict rapide

**Note globale Yann : 6.4/10** | **Note globale Lucas : 6.0/10**

La passe surfaces fait un bon travail sur la zone gauche (murs blancs, sol chene clair, mezzanine lisible) mais presente un **defaut majeur a droite** qui plafonne la note.

---

## ALERTE : Probleme majeur cote droit de l'image

Le "gros souci a droite" signale par le fondateur est confirme et identifie :

### Ce qui ne va pas

Le **mur porteur vertical en beton** qui separait les baies vitrees du rez-de-chaussee et celles de l'etage a ete **partiellement efface/absorbe par le traitement des murs blancs**. Dans l'input, ce poteau massif en beton brut est un element structurel majeur — il forme un T avec la dalle de mezzanine et separe clairement les deux niveaux de vitrage. Dans l'output :

1. **Le poteau vertical droit est devenu ambigu** — il est toujours present mais son volume et sa materialite ont ete alteres. Il ressemble a un montant de menuiserie plutot qu'a un poteau beton porteur.

2. **Les baies vitrees du rez-de-chaussee a droite sont deformees** — dans l'input, on voit clairement des portes-fenetres coulissantes/pliantes avec des montants metalliques noirs formant un ensemble coherent. Dans l'output, la partie basse droite des baies est comprimee, les proportions des ouvrants sont modifiees et la lecture de l'ouverture est confuse.

3. **Le raccord mur blanc / menuiserie noire** est mal gere — on voit une zone de transition brutale ou le traitement "mur blanc" s'arrete net contre les montants metalliques, sans le retour d'embrasure qu'on verrait sur un vrai chantier fini.

4. **La dalle de mezzanine cote droit** a perdu son epaisseur visible — dans l'input, la tranche de dalle beton est bien lisible entre les baies hautes et basses. Dans l'output, cette transition est noyee dans le blanc.

### Diagnostic technique (Lucas)

C'est une **hallucination de surface** : le modele a interprete le poteau beton et la tranche de dalle comme des "surfaces a finir" et les a recouverts de blanc, alors que ce sont des elements structurels porteurs qui doivent rester visibles (meme enduits, leur volume 3D doit etre preserve). Le modele n'a pas distingue "mur a peindre" de "structure porteuse a conserver".

---

## Partie Yann — Fidelite des surfaces

### 1. Murs : 7/10
- **Zone gauche** : bien traite. Le mur de fond sous la mezzanine est passe du beton brut au blanc propre. Bonne finition.
- **Mur du fond gauche (sous mezzanine)** : propre, blanc mat, coherent scandinave.
- **Zone droite** : le traitement blanc a "mange" les elements structurels (voir alerte). Le poteau beton est quasi invisible, la tranche de dalle effacee.
- **Bonne decision** : les menuiseries metalliques noires sont preservees (pas repeintes en blanc).

### 2. Sol : 8.5/10
- **Excellent choix** : parquet chene clair en lames larges, finition mate, grain visible. Parfaitement scandinave (whitewashed ash / light oak).
- **Coherence** : la teinte est froide et claire, pas de derive warm. Conforme aux directives.
- **Pose** : les lames sont paralleles, direction coherente avec la profondeur de la piece.
- **Petit bemol** : sous la mezzanine, le sol semble s'arreter un peu abruptement dans l'ombre — mais c'est acceptable.

### 3. Plafond : 7.5/10
- **Geometrie preservee** : la structure du plafond haut avec poutres/solives est bien visible. Les poutres ne sont pas lissees, on distingue leur relief.
- **Finition** : blanc applique sur la geometrie existante — conforme a la directive "white ceiling finish applied over existing ceiling geometry".
- **Double hauteur** : la sensation de volume est preservee. La hauteur sous plafond est respectee.
- **Mezzanine** : le dessous de la dalle est traite en blanc, ce qui est correct.

### 4. Luminaire : 7/10
- **Un pendant style PH (Poul Henningsen)** est visible, suspendu dans le volume double hauteur. C'est le bon choix pour du Scandinave — luminaire a abat-jour etage, diffusion douce.
- **Probleme** : il semble y en avoir deux (un visible en premier plan, un second plus a gauche). Dans l'input, il y avait un tube fluorescent au plafond. Remplacer un fluorescent par un ou deux PH-style est coherent, mais deux luminaires pour cet espace est discutable en mode surfaces — un seul aurait suffi.

### 5. Equipements fixes : 5/10
- **Pas de radiateur/convecteur visible dans l'input** a verifier, mais les prises et boitiers electriques du mur gauche (input) semblent nettoyes — c'est positif.
- **Les cables/gaines visibles** dans l'input (haut du mur gauche) ont ete nettoyes — bien.

### 6. Fenetres : 6/10
- **Baies hautes (etage)** : preservees en nombre et position. Les 3 carreaux du haut avec la structure metallique exterieure sont la. Correct.
- **Baies basses (RDC)** : c'est ici que ca se complique. Dans l'input, on voit clairement un ensemble de portes-fenetres pliantes/coulissantes formant un mur vitree continu. Dans l'output, les proportions sont modifiees — la baie la plus a droite semble comprimee, et le rapport hauteur/largeur des ouvrants a change.
- **Petite fenetre mezzanine gauche** : dans l'output, une petite ouverture carree apparait en haut a gauche sur le mur de la mezzanine. Elle n'est **pas clairement visible dans l'input** — possible hallucination de fenetre, ou elle existait mais etait cachee par le beton brut. A verifier.

### 7. Portes/Ouvertures : 6.5/10
- **Ouverture sous la mezzanine** (acces fond de piece) : preservee, visible dans les deux images.
- **Acces terrasse/exterieur** via les baies : preserve en principe mais degrade visuellement (voir point 6).

### 8. Le "gros souci a droite" : voir section ALERTE ci-dessus
- Le poteau porteur beton est efface/amoindri.
- La dalle de mezzanine perd sa lisibilite structurelle.
- Les proportions des baies basses sont alterees.
- **Impact** : c'est un defaut qui rend l'image non-montrable a un client architecte (Claire) — elle verrait immediatement que la structure ne tient pas debout sans ce poteau.

---

## Partie Lucas — Technique

### 1. Preservation spatiale : 6/10
- **Angle de vue** : identique. Meme position de camera, meme focal, meme perspective.
- **Proportions generales** : la piece est reconnaissable. La double hauteur, la mezzanine, l'orientation sont correctes.
- **Profondeur** : preservee — la zone sous mezzanine recule correctement.
- **MAIS** : la perte du poteau porteur droit modifie la lecture structurelle de l'espace. Ce n'est pas une piece avec un mur vitree continu — c'est une piece avec un poteau central qui divise les baies en deux registres. Cette distinction est perdue.
- La possible fenetre hallucinee en haut a gauche de la mezzanine est un ecart mineur mais reel.

### 2. Lumiere : 7.5/10
- **Direction** : la lumiere vient de la droite (baies vitrees), identique a l'input. Le soleil rasant en haut a droite est preserve.
- **Gradients** : le falloff gauche (zone sombre sous mezzanine) est preserve. Pas d'eclaircissement artificiel HDR.
- **Temperature** : neutre a froide, coherent avec l'input. Pas de warm shift.
- **Ombres** : les ombres portees des montants de fenetre sont presentes et coherentes.

### 3. Artefacts : 5.5/10
- **Zone de fusion droite** : le raccord entre le traitement mur blanc et les menuiseries metalliques est le principal artefact. On voit une zone ou le modele a hesite entre "peindre en blanc" et "conserver la menuiserie".
- **Tranche de dalle** : la transition entre le plafond blanc et le haut des baies est floue — on perd la lisibilite de l'epaisseur de la dalle beton.
- **Sol sous mezzanine** : le parquet se perd dans l'ombre — acceptable mais un peu abrupt.
- **Exterieur visible a travers les baies** : correctement preserve (on voit la terrasse brute et les structures metalliques exterieureses). Bon point — le modele n'a pas "fini" l'exterieur.

### 4. Photorealisme : 7/10
- L'image est globalement credible comme photo de chantier en cours de finition.
- La zone gauche est tres convaincante (murs blancs, parquet, plafond).
- La zone droite casse l'illusion pour un oeil averti.

---

## Grille 10 criteres — Double notation

| # | Critere | Poids | Note Yann | Note Lucas | Commentaire |
|---|---------|-------|-----------|------------|-------------|
| 1 | Preservation spatiale | x3 | 6 | 6 | Poteau porteur efface, baies deformees a droite. Angle et profondeur OK |
| 2 | Fidelite stylistique | x2 | 8 | 7.5 | Scandinave bien rendu (blanc, chene clair, PH pendant). Tres coherent |
| 3 | Eclairage | x1 | 7.5 | 7.5 | Lumiere naturelle preservee, pas de warm shift, falloff correct |
| 4 | Hero pieces | x1 | 7 | 7 | PH-style pendant correct. Mode surfaces = pas de mobilier attendu |
| 5 | Coherence matieres | x1 | 8 | 7.5 | Chene clair + blanc mat + beton apparent = palette scandinave coherente |
| 6 | Credibilite pro | x2 | 5.5 | 5.5 | Le poteau efface est redhibitoire pour Claire (architecte). Non montrable en l'etat |
| 7 | Completude | x1 | 7 | 7 | Sol, murs, plafond, luminaire : tous traites. Equipements fixes OK |
| 8 | Vocabulaire visuel | x1 | 7.5 | 7 | Materiaux bien rendus (grain du parquet, mat des murs). Zone droite floue |
| 9 | Adaptabilite spatiale | x1 | 7 | 6.5 | Le luminaire est a bonne echelle. La perte du poteau fausse la lecture spatiale |
| 10 | Potentiel photorealiste | x1 | 7 | 7 | Zone gauche = photo credible. Zone droite = doute |

### Calcul note Yann
(6x3 + 8x2 + 7.5 + 7 + 8 + 5.5x2 + 7 + 7.5 + 7 + 7) / 14 = (18 + 16 + 7.5 + 7 + 8 + 11 + 7 + 7.5 + 7 + 7) / 14 = 96 / 14 = **6.86/10**

### Calcul note Lucas
(6x3 + 7.5x2 + 7.5 + 7 + 7.5 + 5.5x2 + 7 + 7 + 6.5 + 7) / 14 = (18 + 15 + 7.5 + 7 + 7.5 + 11 + 7 + 7 + 6.5 + 7) / 14 = 93.5 / 14 = **6.68/10**

---

## Diagnostic du "gros souci a droite"

### Cause racine
Le modele traite TOUTES les surfaces opaques comme "a peindre en blanc". Il ne distingue pas :
- **Mur de remplissage** (a peindre) : correct
- **Poteau porteur beton** (element structurel) : devrait etre preserve dans son volume meme si enduit
- **Tranche de dalle** (element structurel) : idem

Le builder passe 1 dit "Preserve the ceiling geometry exactly — vaults, beams, ribs, arches" mais ne mentionne pas les **poteaux verticaux** ni les **tranches de dalles**. Ces elements sont "entre" le plafond et les murs — ni l'un ni l'autre — et tombent dans un angle mort du prompt.

### Solution recommandee — P0

Ajouter dans le builder passe 1 (buildSurfacesResponsesPrompt) :

**Directive structurelle elargie** :
"Preserve ALL structural elements — columns, posts, pilasters, slab edges, lintels, and load-bearing frames. Apply wall finish AROUND them, not OVER them. These elements define the spatial structure and must remain volumetrically visible even if painted."

Cette directive couvre :
- Poteaux beton (columns, posts)
- Tranches de dalles (slab edges)
- Linteaux (lintels)
- Cadres porteurs (load-bearing frames)

### Autres recommandations

| Priorite | Correction | Cible |
|----------|-----------|-------|
| P0 | Ajouter "columns, posts, slab edges, lintels" a la directive de preservation structurelle | route.ts / generation-pipeline.ts builder passe 1 |
| P1 | Verifier la fenetre hallucinee en haut a gauche de la mezzanine — si confirmee, renforcer la directive anti-hallucination | builders passe 1 |
| P1 | Limiter a 1 luminaire pendant sauf si l'input en montre plusieurs | surfacePrompts ou builder |
| P2 | Ameliorer le raccord mur/menuiserie — "apply wall finish with proper reveal/return at window frames" | builder passe 1 |

---

## Points positifs a conserver

1. **Sol chene clair** : excellente qualite de rendu, grain visible, teinte froide. Reference scandinave parfaite.
2. **Pas de mobilier** : le mode surfaces-only est respecte — piece vide, aucune hallucination de meuble.
3. **Lumiere preservee** : direction, intensite, temperature fideles a l'input. Pas de warm shift.
4. **Plafond** : la geometrie des poutres/solives est globalement preservee (sauf tranche de dalle droite).
5. **Exterieur non modifie** : la terrasse brute visible a travers les baies est laissee intacte.
6. **Cables/gaines nettoyes** : les elements de chantier du mur gauche sont effaces. Propre.

---

## Resume

| Metrique | Yann | Lucas |
|----------|------|-------|
| Note globale | 6.86/10 | 6.68/10 |
| Montrable a un client ? | Non (poteau efface) | Non (deformation structurelle) |
| Zone gauche seule | ~8/10 | ~7.5/10 |
| Zone droite seule | ~4.5/10 | ~4.5/10 |

La generation est a mi-chemin : la moitie gauche de l'image est un tres bon travail de finition scandinave sur chantier brut. La moitie droite est compromise par la perte du poteau porteur et la deformation des baies. Le fix P0 (directive structurelle elargie) devrait resoudre ce type de probleme sur les prochaines generations.

---

*Audit Yann Duval + Lucas Moreau — 2026-04-05*
