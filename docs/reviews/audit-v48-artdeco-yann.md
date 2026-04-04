# Audit v48 — Art Deco chambre enfant | Yann Duval | 2026-04-04

## Generation #162 — Art Deco chambre enfant

**ALERTE : l'espace N'EST PAS fidele a l'original.**

- **Angle** : recule et elargi. L'input est un cadrage portrait serre en plongee legere, focale ~35mm. L'output passe en vue quasi-frontale grand-angle avec plafond + mur gauche entier visible. Le champ de vision est significativement plus large que l'input.
- **Fenetres** : 1 fenetre visible dans l'input (double battant central). L'output montre la meme fenetre MAIS la fenetre de gauche (coupee dans l'input) apparait maintenant en entier — consequence du recul de camera.
- **Convecteur** : DISPARU. Le radiateur electrique sous la fenetre est supprime.
- **Mur gauche** : dans l'input, on voit a peine le retour du mur gauche avec le bord d'une 2e fenetre. L'output invente un mur gauche complet avec un angle de piece visible.
- **Proportions** : la piece parait 40% plus grande que dans l'input. L'anti-grand-angle n'a PAS corrige le probleme sur cette generation.
- **Murs** : les murs violets sont remplaces par gris clair — transformation OK pour du home staging, mais les murs violets auraient pu etre preserves comme mur accent.

| Critere | Note | Commentaire |
|---|---|---|
| Preservation spatiale (x3) | 4/10 | Angle recule, champ elargi, convecteur supprime, proportions faussees |
| Fidelite stylistique (x2) | 7/10 | Art Deco lisible : tete de lit en eventail, motifs geometriques dores/noirs, plafonnier hexagonal |
| Eclairage (x1) | 7/10 | Lumiere naturelle coherente, pas de warm shift excessif |
| Hero pieces (x1) | 7/10 | Tete de lit Art Deco, tapis geometrique, meuble bas noir/laiton — correct pour enfant |
| Coherence matieres (x1) | 7/10 | Noir/laiton/velours emeraude — palette Deco coherente |
| Credibilite pro (x2) | 5/10 | L'espace modifie empeche toute utilisation pro — la piece ne correspond plus a la photo |
| Completude (x1) | 7/10 | Lit, chevet, meuble rangement, tapis, bureau — complet pour une chambre enfant |
| Vocabulaire visuel (x1) | 7/10 | Geometrie, laiton, velours — vocabulaire Deco present |
| Adaptabilite spatiale (x1) | 6/10 | Mobilier a bonne echelle mais place dans un espace agrandi artificiellement |
| Potentiel photorealiste (x1) | 6/10 | Rendu propre mais leger aspect catalogue, tapis trop graphique/plat |

**Note ponderee : 5.6/10** (CAPpee par preservation spatiale)

---

## Generation #164 — Art Deco chambre enfant (regeneration)

**NETTE AMELIORATION de la preservation spatiale.**

- **Angle** : BEAUCOUP plus fidele a l'input. Le cadrage est plus serre, la plongee legere est mieux preservee. Le plafond est visible mais l'angle est proche de l'original.
- **Fenetres** : 1 fenetre principale visible, coherent avec l'input. La fenetre de gauche reste hors champ.
- **Convecteur** : DISPARU egalement (meme probleme que #162).
- **Mur accent violet** : PRESERVE sur le mur du fond/droit. C'est un progres majeur — le violet d'origine est conserve comme mur accent Art Deco. Excellent choix stylistique.
- **Proportions** : la piece garde des proportions proches de l'original. L'anti-grand-angle semble avoir fonctionne ici.
- **Sol** : herringbone sombre remplace le parquet clair — transformation Art Deco classique, acceptable.

| Critere | Note | Commentaire |
|---|---|---|
| Preservation spatiale (x3) | 6.5/10 | Angle proche, proportions correctes, mur accent preserve. Convecteur disparu (-1), leger elargissement residuel (-0.5) |
| Fidelite stylistique (x2) | 8/10 | Tete de lit Art Deco geometrique doree/emeraude, plafonnier polygonal laiton, palette noir/or/emeraude — tres Ruhlmann |
| Eclairage (x1) | 7/10 | Lumiere naturelle preservee, plafonnier dore coherent |
| Hero pieces (x1) | 8/10 | Tete de lit stepped Art Deco, plafonnier geometrique laiton, chevet noir/or — pieces signature |
| Coherence matieres (x1) | 8/10 | Velours emeraude + laiton + noir laque + violet — harmonie audacieuse et coherente |
| Credibilite pro (x2) | 7/10 | Le mur accent violet eleve la credibilite — un architecte montrerait ca. Le convecteur manquant reste un defaut |
| Completude (x1) | 7/10 | Lit, chevet, rangement, bureau/chaise, tapis, panier — complet |
| Vocabulaire visuel (x1) | 8/10 | Motifs geometriques, laiton, velours, stepped forms — vocabulaire Deco riche |
| Adaptabilite spatiale (x1) | 7/10 | Mobilier bien proportionne a l'espace reel |
| Potentiel photorealiste (x1) | 7/10 | Meilleur rendu que #162, textures plus credibles, tapis moins plat |

**Note ponderee : 7.1/10**

---

## Reponses aux questions du fondateur

1. **Piece respectee ?** #162 NON (angle recule, champ elargi, +40% surface percu). #164 OUI en grande partie (angle fidele, proportions correctes, mur accent preserve). Convecteur disparu dans les 2 cas.

2. **Grand-angle corrige vs Boheme v47 ?** Partiellement. #162 montre encore un elargissement net. #164 est BIEN meilleur — l'anti-grand-angle semble fonctionner mais de facon inconsistante (1 sur 2).

3. **2 resultats differents ?** OUI, variete reelle : placement du lit inverse, mur accent preserve vs supprime, plafonnier different (flush hexagonal vs suspension polygonale), motifs tapis differents, couleur couverture similaire mais motifs distincts. Le resolveChooseOne semble fonctionner.

4. **Art Deco chambre enfant credible ?** OUI. Les 2 generations capturent bien l'esprit Art Deco adapte enfant : geometrie doree sans exces, velours emeraude, noir/laiton. #164 est particulierement reussi avec le mur violet comme accent — ca donne une chambre enfant chic, pas un boudoir des annees 20.

5. **Notes : #162 = 5.6/10 | #164 = 7.1/10**

## P0 — Corrections prioritaires

- **Convecteur/radiateur** : toujours supprime malgre EQUIPMENT_PRESERVATION. Le chauffe-eau a ete ajoute en Sprint 23 mais le convecteur electrique mural semble echapper a la detection. Ajouter "wall-mounted electric convector heater" a la liste explicite.
- **Consistance anti-grand-angle** : fonctionne 1 fois sur 2. Investiguer pourquoi #162 elargit et #164 non (meme input, meme style).
