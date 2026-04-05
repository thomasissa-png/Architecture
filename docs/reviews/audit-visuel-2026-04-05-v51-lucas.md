# Audit Visuel v51 — Lucas Moreau (Expert IA Image)

**Date** : 2026-04-05
**Version prompts** : v51
**Modele** : gpt-image-1.5 via Responses API (pipeline 2 passes)
**Corrections v51** : anti-elargissement, plomberie, comptage radiateurs, anti-fenetre outdoor, CAMERA_PRESERVATION iterations

---

## Synthese executive

| Gen | Style | Piece | Yann | Lucas | Plafond |
|-----|-------|-------|------|-------|---------|
| A | Scandinavian | Living room | — | /10 | — |
| B | Bohemian | Chambre enfant | — | /10 | — |
| C | Boheme | Garden (outdoor) | — | /10 | — |
| D | Japandi | Bathroom | — | /10 | — |
| E | Bohemian | Living room | — | /10 | — |
| F | Maximalist | Chambre enfant + iter | — | /10 | — |

**Moyenne Lucas** : —/10

---

## Gen A — Scandinavian living room (1536x995)

**Contexte** : Loft brut en chantier, double hauteur avec mezzanine beton, mur de baies vitrees en facade (portes-fenetres + impostes), poutre beton apparente, sol brut, murs non finis. Eclairage naturel intense entrant par la droite (soleil direct).

**ATTENTION : Output = passe 1 seule (surfaces uniquement, aucun mobilier).** La passe 2 a echoue ou n'a pas ete lancee. L'output est une piece finie mais VIDE.

### Preservation spatiale (critere n°1)

- **Angle de vue** : IDENTIQUE — meme position camera, meme hauteur, meme orientation vers la mezzanine et les baies vitrees. Excellent.
- **Dimensions/proportions** : La piece apparait legerement PLUS LARGE a gauche — le mur gauche semble recule, l'espace sous la mezzanine parait plus volumineux que sur l'input. Le pilier beton central est preserve mais les proportions generales montrent un elargissement subtil.
- **Profondeur** : Correcte. La mezzanine est a la bonne profondeur, le recul vers les baies est fidele.
- **Fenetres/portes** : Les baies vitrees droites sont preservees (meme disposition en croix). MAIS l'output ajoute une PETITE FENETRE carree sur le mur gauche au-dessus de la mezzanine qui N'EXISTE PAS dans l'input. C'est une hallucination architecturale. Les impostes hautes sont bien preservees.
- **Mezzanine** : Preservee, meme position, meme profondeur. La rampe/garde-corps n'etait pas visible dans l'input et reste absente.
- **Poutres/plafond** : Les poutres beton du plafond sont preservees dans leur position MAIS leur texture est completement LISSEE — elles sont devenues des poutres blanches propres au lieu du beton brut gris/sale. La geometrie du plafond en pente est correcte. Un element de plafond qui ressemblait a un neon industriel a ete remplace par des suspensions PH5-style (coherent avec le surfacePrompt Scandinave).
- **Forme des murs** : Le mur gauche a ete lisse et blanchi (attendu). Le pilier beton central est preserve.

**Verdict preservation** : 6.5/10 — L'angle et la structure globale sont bons, MAIS la fenetre hallucinee au-dessus de la mezzanine est un defaut grave et l'elargissement lateral est visible. Les poutres lissees sont acceptables pour du Scandinave (c'est une finition) mais la texture originale est perdue.

### Grille 10 criteres

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale | 6.5/10 | Fenetre hallucinee mur gauche haut, leger elargissement lateral |
| 2 | Contraintes lumiere | 8/10 | Direction lumiere preservee (soleil entrant droite), gradients ombres naturels, pas de warm shift |
| 3 | Vocabulaire photo | 7/10 | Rendu propre, pas de grain visible (conforme regle fondateur anti-grain), nettete correcte |
| 4 | Structure prompt | 6/10 | Passe 1 surfaces OK mais passe 2 absente — livraison incomplete |
| 5 | Negative prompting | 5/10 | Fenetre hallucinee = echec du comptage anti-fenetre |
| 6 | Compatibilite multi-modeles | N/A | Modele unique gpt-image-1.5 |
| 7 | Coherence I/O | 8/10 | Ratio paysage preserve, dimensions coherentes |
| 8 | Richesse descriptive | 7/10 | Sol whitewashed ash visible, luminaires PH5, murs blancs — style lisible |
| 9 | Adaptabilite conditions | 7/10 | Chantier brut transforme proprement, mezzanine respectee |
| 10 | Rendu final credible | 5/10 | Piece vide sans mobilier = pas credible comme visuel de home staging |

**Note ponderee** : (6.5×3 + 8 + 7 + 6 + 5 + 8 + 7 + 7 + 5×2) / 14 = **6.4/10**

**Problemes majeurs** :
- P0 : Fenetre hallucinee sur mur gauche au-dessus de la mezzanine
- P0 : Passe 2 absente — piece vide livree comme resultat final
- P2 : Poutres beton lissees (perte texture, acceptable mais notable)

---

## Gen B — Bohemian chambre enfant (1536x1152)

*En cours d'analyse...*

---

## Gen C — Boheme garden exterieur (1536x882)

*En cours d'analyse...*

---

## Gen D — Japandi bathroom (964x1280)

*En cours d'analyse...*

---

## Gen E — Bohemian living room (1152x1536)

*En cours d'analyse...*

---

## Gen F — Maximalist chambre enfant + iteration (962x1280)

*En cours d'analyse...*

---

## Plan d'amelioration

*A completer apres analyse.*

---

## Handoff

- **Destinataire** : @orchestrator, @interior-architect (Yann Duval)
- **Livrables** : Ce rapport d'audit visuel v51
- **Action requise** : Audit croise Yann Duval sur les memes generations
