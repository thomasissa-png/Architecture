# Audit visuel v45 production -- Lucas Moreau
## 2026-04-04 | Generations #150/#151 et #147/#148 | Scandinave salon | gpt-image-1.5 v45

---

## VERDICT : AMELIORATION MAJEURE -- de 2.6/10 a 7.6/10

Les prompts v45 condenses avec action "Edit" et preservation AVANT style produisent un resultat radicalement superieur aux anciens prompts (audit #132-135 : 2.6/10). L'espace est RECONNAISSABLE. Les murs, le retrait central, le plafond plat sont preserves. C'est la premiere fois que gpt-image-1.5 edite au lieu de regenerer.

---

## Generation 1 : #150 (passe 1) + #151 (passe 2) -- Scandinave salon

### Preservation spatiale (critique)

| Element | Input | Output | Verdict |
|---------|-------|--------|---------|
| Angle de vue | Frontal legerement plongeant, decentre gauche | Frontal, meme hauteur, meme decentrage | PRESERVE |
| Retrait mur central | Avancee de mur ~30cm entre zone gauche et droite | Preservee, meme position, meme profondeur | PRESERVE |
| Plafond | Plat, placo brut avec bandes de jointoiement visibles | Plat, blanc lisse, jointoiement encore subtilement visible | PRESERVE (geometrie OK, finition appliquee) |
| Fenetres/portes | AUCUNE visible dans l'input | AUCUNE dans l'output | CORRECT |
| Cables/prises | 6+ boitiers electriques ronds, cables pendants au plafond | Nettoyes -- 1 radiateur blanc ajoute (coherent?) | NETTOYE (boitiers disparus, radiateur = ajout) |
| Sol | Chape brute grise | Parquet chene clair large lame | CORRECT (surfacePrompt) |
| Proportions piece | Large, ~6m x 4m, hauteur ~2.5m | Proportions identiques | PRESERVE |

Le radiateur blanc en bas a gauche dans la passe 1 est une INVENTION -- l'input n'a pas de radiateur. Neanmoins c'est un element mineur et physiquement coherent (emetteur de chaleur sur mur exterieur). Les prises electriques ont ete correctement nettoyees.

Le luminaire PH5-style en suspension est bien positionne la ou les cables pendaient. Coherent.

### Note : 7.8/10

---

## Generation 2 : #147 (passe 1) + #148 (passe 2) -- Scandinave salon (meme piece, cadrage legerement different)

### Preservation spatiale (critique)

| Element | Input | Output | Verdict |
|---------|-------|--------|---------|
| Angle de vue | Frontal, legerement plus recule que #150, plus centre | Frontal, meme position approximative | PRESERVE (leger recadrage) |
| Retrait mur central | Meme avancee de mur entre zones | Preservee | PRESERVE |
| Plafond | Plat, placo brut | Plat, blanc | PRESERVE |
| Fenetres | AUCUNE | AUCUNE | CORRECT |
| Sol | Chape brute | Parquet chene clair | CORRECT |
| Proportions | Identiques a #150 (meme piece) | Preservees | PRESERVE |

Meme qualite que #151. Le mobilier est quasiment identique (canape beige lin, fauteuil wing, table basse ronde, etagere echelle). La composition est un peu plus etale -- le mobilier est centre, la zone gauche avec le radiateur invente est vide. Distribution en profondeur correcte mais pas de zone secondaire en fond.

### Note : 7.4/10

---

## Grilles comparees

| # | Critere | Poids | #151 | #148 |
|---|---------|-------|------|------|
| 1 | Preservation spatiale | x3 | 8 | 7.5 |
| 2 | Contraintes lumiere | x1 | 8 | 8 |
| 3 | Vocabulaire photo | x1 | 7 | 7 |
| 4 | Structure prompt | x1 | 8 | 8 |
| 5 | Negative prompting | x1 | 8 | 8 |
| 6 | Compatibilite multi-modeles | x1 | N/A | N/A |
| 7 | Coherence I/O | x1 | 8 | 7 |
| 8 | Richesse descriptive | x1 | 7 | 7 |
| 9 | Adaptabilite conditions | x1 | 8 | 8 |
| 10 | Rendu final credible | x2 | 8 | 7.5 |
| | **Note ponderee /13** | | **7.8** | **7.5** |

(Critere 6 non applicable -- un seul modele en production, pas de Flux.)

## Comparaison avec audits precedents

| Version | Generations | Note Lucas | Preservation spatiale |
|---------|------------|------------|----------------------|
| v43 anciens builders | #132-135 Med. cuisine | **2.6/10** | 1/10 -- espace INVENTE de zero |
| v45 non deployes (bug P0) | #137-138 Med. cuisine | **2.8/10** | 1/10 -- anciens builders en prod |
| **v45 deployes** | **#147-151 Scand. salon** | **7.6/10** | **7.75/10 -- espace PRESERVE** |

**Delta : +5.0 points.** Le fix du bug de duplication de code (route.ts vs generation-pipeline.ts) + la restructuration v45 (preservation AVANT style, "Edit" en premier token) transforment completement le resultat.

## Points d'amelioration restants

| Priorite | Constat | Action |
|----------|---------|--------|
| P1 | Radiateur hallucine en passe 1 (inexistant dans l'input) | Renforcer "Do not ADD equipment not present in the input" |
| P1 | Mobilier quasi identique entre #148 et #151 (meme piece) | Attendu -- meme style, meme piece. Pas un bug. |
| P2 | Rendu un peu trop lisse/CGI-clean, manque de grain | Fondateur a decide NO GRAIN -- respecter la preference |
| P2 | Distribution profondeur correcte mais pas de zone secondaire en fond | Acceptable sur piece de taille moyenne |
| P3 | Le parquet est tres uniforme (pas de variation de teinte entre lames) | Ajouter "with subtle tonal variation between planks" au surfacePrompt |

---

**Lucas Moreau -- Expert IA Image**
Verdict : Les prompts v45 deployes sont un SUCCES. La preservation spatiale passe de catastrophique (1/10) a bonne (7.75/10). Le pipeline 2 passes avec gpt-image-1.5 fonctionne. Prochaine etape : tester sur des geometries plus complexes (voutes, poutres, fenetres multiples) pour confirmer la robustesse.
