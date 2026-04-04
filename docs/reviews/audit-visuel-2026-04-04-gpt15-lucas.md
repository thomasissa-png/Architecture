# Audit visuel gpt-image-1.5 -- Lucas Moreau
## 2026-04-04 | Generations #132-133 et #134-135 | Mediterranean kitchen | v43

---

## VERDICT GLOBAL : gpt-image-1.5 est CATASTROPHIQUE pour la preservation spatiale

Les deux generations detruisent integralement l'espace original. L'input est un chantier brut rectangulaire vu de face, avec 2 fenetres a gauche, un plafond plat (placoplatre rose), des murs en plaques vertes, et une porte a droite. Les outputs sont des pieces INVENTEES de toutes pieces -- voutes, arches, sol travertin, portes en bois massif -- qui n'ont AUCUN rapport avec la geometrie originale.

**gpt-image-1.5 est significativement PIRE que gpt-image-1 pour la preservation spatiale.** Le modele genere une image neuve au lieu d'editer l'existant. C'est un retour aux problemes de Sprint 10 (images.edit sans mask).

---

## Generation 1 : #132-133 (Mediterranean kitchen)

### ALERTE CRITIQUE : l'espace n'est PAS l'original. Note plafonnee a 5/10.

**Preservation spatiale -- comparaison systematique :**

| Element | Input | Pass1 | Output | Verdict |
|---------|-------|-------|--------|---------|
| Angle de vue | Frontal, legerement decentre gauche | Frontal, symetrique, recule | Frontal rapproche | MODIFIE |
| Plafond | Plat, placoplatre rose avec spots encastres | Voute en arcs (invente) | Plafond plat mais texture enduit | DETRUIT en P1, partiellement corrige en P2 |
| Fenetres | 2 fenetres blanches PVC, mur gauche | 1 fenetre bois brun a gauche (style change, nombre reduit) | Fenetre DISPARUE | HALLUCINATION puis SUPPRESSION |
| Porte droite | Ouverture brute dans placoplatre vert | Porte en bois massif + arche en pierre | Porte bois massif arrondie | INVENTEE |
| Mur face | Plat, 3 leses de placo vert, joints visibles, tuyauterie cuivre en bas | Lisse, blanc, demi-mur avec credence blanche | Mur lisse avec cuisine lineaire | DETRUIT |
| Mur gauche | Placo vert + 2 fenetres | Arche en pierre a gauche | Arche en pierre | INVENTE |
| Sol | Chape brute noire | Travertin clair en dalles | Carrelage terre cuite | INVENTE (coherent med. mais pas l'original) |
| Radiateur | Radiateur blanc sous fenetre gauche | Radiateur blanc visible (preserve!) | Disparu | Preserve en P1, perdu en P2 |
| Dimensions | Piece ~4x3m, hauteur ~2.5m | Piece ~6x5m, hauteur ~3.5m | Piece ~4x3m | DEFORMEES en P1 |
| Tuyauterie | Cuivre + PER visible en bas du mur face | Disparue | Disparue | SUPPRIMEE |

**Analyse pass1 :** La passe 1 est le desastre principal. Le modele a GENERE une piece mediterraneenne de toutes pieces au lieu d'appliquer des finitions sur l'existant. Voutes, arches en pierre, porte bois massif -- rien de cela n'existe dans l'input. Le ratio d'invention est ~90%. Seul le radiateur est preserve.

**Analyse output (pass2) :** La passe 2 prend cette piece inventee et y ajoute une cuisine lineaire. Le resultat est visuellement propre mais n'a RIEN a voir avec la piece originale. La fenetre a disparu. L'arche a gauche persiste. Le luminaire (lanterne fer forge) remplace les spots encastres.

**Grille 10 criteres :**

| # | Critere | Poids | Note | Justification |
|---|---------|-------|------|---------------|
| 1 | Preservation spatiale | x3 | 2/10 | Piece integralement reinventee. Aucun element geometrique preserve. |
| 2 | Contraintes lumiere | x1 | 3/10 | Lumiere naturelle laterale gauche presente mais fenetre modifiee. Eclairage reinvente. |
| 3 | Vocabulaire photo | x1 | 6/10 | Rendu propre, netteté correcte, pas de bokeh parasite. Mais trop lisse (CGI-clean). |
| 4 | Structure prompt | x1 | 4/10 | La cuisine est bien med. mais le prompt demandait de PRESERVER l'espace, pas de le recreer. |
| 5 | Negative prompting | x1 | 2/10 | Arches inventees, fenetre hallucinee puis supprimee, porte inventee. |
| 6 | Compatibilite multi-modeles | x1 | N/A | Un seul modele teste. |
| 7 | Coherence I/O | x1 | 5/10 | Ratio approximativement preserve (landscape). Dimensions coherentes. |
| 8 | Richesse descriptive | x1 | 6/10 | Cuisine detaillee (poignees, plan de travail bois, four encastre). |
| 9 | Adaptabilite conditions | x1 | 3/10 | Chantier brut = le modele a abandonne toute preservation et a genere du neuf. |
| 10 | Rendu final credible | x2 | 7/10 | Belle photo de cuisine med., mais ce n'est PAS cette piece. |

**Note ponderee : (2x3 + 3 + 6 + 4 + 2 + 5 + 6 + 3 + 7x2) / 14 = (6+3+6+4+2+5+6+3+14) / 14 = 49/14 = 3.5/10**

**PLAFONNEE a 5/10 (regle preservation spatiale), mais la note brute est 3.5.**

---

## Generation 2 : #134-135 (Mediterranean kitchen, meme input)

### ALERTE CRITIQUE : meme destruction spatiale. Note plafonnee a 5/10.

C'est le MEME input que la generation 1. Le resultat est different mais le probleme identique.

**Preservation spatiale -- comparaison systematique :**

| Element | Input | Pass1 | Output | Verdict |
|---------|-------|-------|--------|---------|
| Angle de vue | Frontal, legerement decentre gauche | Frontal, legerement decentre gauche (mieux!) | Frontal, centre, plus serre | P1 meilleur, P2 degrade |
| Plafond | Plat, placoplatre rose | Poutres blanchies (inventees mais coherent med.) | Plat, enduit gris-blanc | INVENTE en P1 puis lisse en P2 |
| Fenetres | 2 fenetres blanches PVC a gauche | Porte-fenetre noire arquee a gauche (1 au lieu de 2, style change) | DISPARUES | HALLUCINEE puis SUPPRIMEE |
| Porte droite | Ouverture brute dans placo | Ouverture grise simple | Disparue ou hors champ | SUPPRIMEE |
| Mur face | Placo vert, tuyauterie cuivre | Blanc lisse, credence blanche, arrivees d'eau preservees! | Mur cuisine avec hotte + credence | Tuyauterie transformee en arrivees cuisine (malin) |
| Sol | Chape brute noire | Travertin clair | Carrelage terre cuite petit format | INVENTE |
| Radiateur | Sous fenetre gauche | Absent | Radiateur colonne blanc a droite (deplace!) | PERDU puis REINVENTE ailleurs |
| Dimensions | ~4x3m | ~5x4m (elargie) | ~4x2.5m (retrecie) | INSTABLES |

**Analyse pass1 :** Legerement meilleur que Gen 1 -- l'angle de vue est plus fidele, les arrivees d'eau sont preservees (bonne idee pour une cuisine). Mais les poutres sont inventees, la fenetre est transformee en porte-fenetre noire arquee, et les dimensions sont elargies.

**Analyse output (pass2) :** La passe 2 SUPPRIME la fenetre/porte-fenetre a gauche. Le mur gauche est maintenant un mur plein. Le radiateur reapparait a droite (hallucination). L'angle est resserre. La cuisine est propre mais plus petite que l'espace reel.

**Grille 10 criteres :**

| # | Critere | Poids | Note | Justification |
|---|---------|-------|------|---------------|
| 1 | Preservation spatiale | x3 | 3/10 | Angle P1 meilleur, arrivees eau preservees. Mais fenetres, plafond, dimensions faux. |
| 2 | Contraintes lumiere | x1 | 4/10 | Lumiere plus neutre que Gen 1, mais source lumineuse supprimee (fenetre disparue). |
| 3 | Vocabulaire photo | x1 | 7/10 | Rendu plus photographique que Gen 1. Texture enduit credible. |
| 4 | Structure prompt | x1 | 4/10 | Cuisine med. lisible mais preservation non respectee. |
| 5 | Negative prompting | x1 | 3/10 | Fenetre supprimee, poutres inventees, radiateur deplace. |
| 6 | Compatibilite multi-modeles | x1 | N/A | Un seul modele. |
| 7 | Coherence I/O | x1 | 5/10 | Ratio landscape preserve. |
| 8 | Richesse descriptive | x1 | 7/10 | Accessoires med. coherents (vases ceramique, panier osier, bol turquoise). |
| 9 | Adaptabilite conditions | x1 | 3/10 | Meme probleme : chantier brut = regeneration totale. |
| 10 | Rendu final credible | x2 | 7/10 | Photo credible isolement, mais pas cette piece. |

**Note ponderee : (3x3 + 4 + 7 + 4 + 3 + 5 + 7 + 3 + 7x2) / 14 = (9+4+7+4+3+5+7+3+14) / 14 = 56/14 = 4.0/10**

**PLAFONNEE a 5/10, note brute 4.0.**

---

## Diagnostic technique : gpt-image-1.5 vs gpt-image-1

### Le probleme fondamental

gpt-image-1.5 se comporte comme un modele TEXT-TO-IMAGE, pas IMAGE-TO-IMAGE. Il VOIT l'input (via la vision), comprend "c'est un chantier brut, on veut du Mediterraneen", puis GENERE une cuisine mediterraneenne de zero. Il ne modifie pas l'image -- il en cree une nouvelle inspiree par le contexte.

C'est le MEME comportement que :
- images.edit avec mask full transparent (Sprint 10, point 66) -- genere du neuf
- Flux Depth Pro en passe 2 (Sprint 22, point 155) -- regenere la scene

### Comparaison avec gpt-image-1

Avec gpt-image-1 + input_fidelity "high", les Sprints 16-17 montraient :
- Preservation angle : 7-8/10 (l'angle restait globalement fidele)
- Preservation fenetres : 6-7/10 (nombre parfois faux mais position approximative)
- Preservation profondeur : 7/10 (dimensions proches)

Avec gpt-image-1.5, sur ces 2 generations :
- Preservation angle : 3-4/10 (reinvente)
- Preservation fenetres : 1/10 (supprimees ou hallucinee)
- Preservation profondeur : 2/10 (dimensions totalement fausses)

**Regression estimee : -4 points de preservation spatiale.**

### Hypotheses sur la cause

1. **input_fidelity "high" peut ne pas fonctionner de la meme maniere** sur gpt-image-1.5 -- le parametre existe-t-il encore ?
2. **Le modele est plus "creatif"** -- optimise pour la qualite esthetique au detriment de la fidelite geometrique.
3. **Le prompt de preservation n'est pas assez fort** pour ce modele -- gpt-image-1 repondait aux contraintes "same camera angle", gpt-image-1.5 les ignore.

---

## Plan d'action

### P0 -- CRITIQUE (bloquer le deploy)

1. **Verifier la documentation gpt-image-1.5** : le parametre `input_fidelity` est-il supporte ? Existe-t-il un equivalent ? Si non, c'est la cause racine.
2. **Rollback immediat vers gpt-image-1** si input_fidelity n'est pas supporte sur 1.5. La qualite esthetique ne vaut rien si l'espace est detruit.
3. **A/B test systematique** : meme input, meme prompt, gpt-image-1 vs 1.5. Comparer la preservation spatiale sur 5 inputs differents avant toute decision.

### P1 -- HAUTE

4. **Renforcer le prompt de preservation pour gpt-image-1.5** (si le modele est conserve) :
   - Ajouter un inventaire spatial explicite : "This room has: 2 windows on the left wall, 1 door on the right wall, flat ceiling, rectangular shape approximately 4x3m"
   - Ajouter : "The output MUST show the SAME room from the SAME angle. Do NOT generate a new room."
5. **Tester la passe 1 isolement** avec des contraintes de preservation renforcees -- si la passe 1 echoue, la passe 2 ne peut pas compenser.

### P2 -- MOYENNE

6. **Documenter les differences de comportement** gpt-image-1 vs 1.5 dans CLAUDE.md pour eviter toute regression future.
7. **Evaluer si gpt-image-1.5 fonctionne mieux sur des pieces finies** (pas chantier brut) -- le probleme est peut-etre specifique aux inputs tres degrades.

---

## Conclusion

Le fondateur a raison : c'est catastrophique. La migration vers gpt-image-1.5 est une regression majeure. Les deux generations produisent de belles images de cuisines mediterraneennes qui n'ont aucun rapport avec la piece originale. Pour un outil de home staging virtuel, c'est un deal-breaker absolu -- le client uploade SA piece et veut voir SA piece meublee, pas une piece random.

**Recommandation : rollback immediat vers gpt-image-1 en attendant un A/B test rigoureux.**

| Metrique | Gen 1 (#132-133) | Gen 2 (#134-135) |
|----------|-------------------|-------------------|
| Note brute | 3.5/10 | 4.0/10 |
| Note plafonnee | 5.0/10 | 5.0/10 |
| Preservation spatiale | 2/10 | 3/10 |
| Rendu esthetique | 7/10 | 7/10 |

---

*Audit realise par Lucas Moreau -- Expert IA Image*
*Modele audite : gpt-image-1.5 (v43)*
*Verdict : REGRESSION MAJEURE vs gpt-image-1. Rollback recommande.*
