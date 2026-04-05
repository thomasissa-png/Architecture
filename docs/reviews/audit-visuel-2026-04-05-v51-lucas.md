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

**Contexte** : Piece brute en chantier, murs placo non peints (bandes visibles), sol beton brut, cables electriques pendants au plafond et en mur (sorties luminaires + prises), aucune fenetre visible. Eclairage artificiel diffus. Piece rectangulaire, vue en coin (mur gauche + mur fond).

### Preservation spatiale (critere n°1)

- **Angle de vue** : IDENTIQUE — meme position camera en coin, meme orientation vers l'angle droit de la piece. Excellent.
- **Dimensions/proportions** : Fideles. La piece rectangulaire est respectee dans ses proportions. L'angle du coin au fond est au meme endroit. Pas d'elargissement ni de compression visible.
- **Profondeur** : Correcte. Le mur du fond est a la bonne distance. La profondeur est naturelle.
- **Fenetres/portes** : AUCUNE fenetre dans l'input, AUCUNE dans l'output. Parfait — le comptage anti-fenetre fonctionne. Pas de porte visible dans les deux.
- **Plafond** : La geometrie du plafond est preservee — on retrouve le ressaut/decaisse au centre qui existait dans l'input. La jonction plafond/mur est fidele.
- **Forme des murs** : Le renfoncement/retrait de mur gauche est preserve. La colonne/pilier entre les deux plans de mur est bien la.

**Verdict preservation** : 8.5/10 — Excellente preservation spatiale. L'espace est clairement le meme. Le coin, les proportions, le decaisse plafond, le retrait de mur sont tous fideles.

### Analyse technique

- **Surfaces passe 1** : Murs blancs propres (bon nettoyage du placo brut), sol bois clair (honey-toned wood conforme au Bohemian). Plafond blanc propre. Les cables electriques ont ete nettoyes. Prises non visibles (nettoyees ou cachees par le mobilier).
- **Mobilier passe 2** : Lit enfant en bois naturel avec literie boheme (motifs geometriques, terracotta), table de chevet en rotin/bois, etagere basse avec livres, petit bureau + tabouret enfant, panier tresse au sol, tapis motifs arc-en-ciel/soleils. Suspension en osier tresse (rattan pendant). Distribution correcte dans la profondeur.
- **Eclairage** : L'eclairage diffus de l'input est preserve. Pas de source de lumiere naturelle dans l'input, pas de lumiere naturelle inventee dans l'output. Les ombres portees sous le lit et les meubles sont coherentes avec un eclairage du plafond. Pas de warm shift excessif.
- **Ombres** : Les ombres portees du lit et du mobilier sont presentes et coherentes. L'ombre sous l'etagere est naturelle. Pas de mobilier flottant.
- **Artefacts** : Aucun artefact majeur visible. Le contour du mobilier est net. Les textures bois et tissu sont credibles.
- **Rendu photo** : Le rendu est propre et lisse (conforme regle fondateur anti-grain). La nettete est bonne. Le contraste est naturel.

### Grille 10 criteres

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale | 8.5/10 | Angle, proportions, decaisse plafond, retrait mur — tout est fidele |
| 2 | Contraintes lumiere | 8/10 | Eclairage diffus preserve, pas de warm shift, ombres coherentes |
| 3 | Vocabulaire photo | 7.5/10 | Rendu propre, nettete correcte, pas de flou suspect |
| 4 | Structure prompt | 8/10 | Pipeline 2 passes complet, style Bohemian lisible et coherent |
| 5 | Negative prompting | 9/10 | Zero fenetre hallucinee, zero rideau, zero art mural |
| 6 | Compatibilite multi-modeles | N/A | Modele unique |
| 7 | Coherence I/O | 8.5/10 | Ratio paysage preserve, dimensions coherentes |
| 8 | Richesse descriptive | 8/10 | Textiles bohemes, motifs, materiaux naturels, palette terracotta lisible |
| 9 | Adaptabilite conditions | 8.5/10 | Piece aveugle bien geree, chantier brut transforme proprement |
| 10 | Rendu final credible | 8/10 | Credible comme photo immobiliere de chambre enfant. Echelle mobilier correcte |

**Note ponderee** : (8.5×3 + 8 + 7.5 + 8 + 9 + 8.5 + 8 + 8.5 + 8×2) / 14 = **8.2/10**

**Points forts** :
- Preservation spatiale excellente sur une piece difficile (chantier brut sans fenetre)
- Zero hallucination architecturale
- Distribution mobilier equilibree (lit + bureau + etagere)
- Style Bohemian enfant credible et coherent

**Points d'amelioration** :
- P3 : Le sol bois est un peu trop uniforme — un grain plus visible ancrerait le realisme
- P3 : La suspension osier est un peu petite pour le volume de la piece

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
