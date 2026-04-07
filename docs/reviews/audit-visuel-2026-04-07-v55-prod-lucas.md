# Audit visuel v55 PROD — Lucas Moreau
**Date** : 2026-04-07
**Session** : 36 (bonus post-deploiement Replit)
**Pipeline** : v55 (fix P0-A bug room_type + architectural honesty + input_fidelity adaptive)
**Baseline v54** : Lucas 7.10/10 (NO-GO)
**Cible fondateur** : 9.5/10

## Score global v55 : **5.4/10** — NO-GO CRITIQUE

Regression severe vs v54 (-1.7). Le fix P0-A dining_room fonctionne visuellement (C livre une vraie salle a manger), mais **trois defauts P0 nouveaux** sont apparus : (1) artefact de fusion photo massif sur A+B (deterministe), (2) hallucinations structurelles geantes sur D (douche + vasque + miroir LED inventes dans une SDB ne contenant qu'une baignoire), (3) changements d'angle camera sur C. Le fondateur a raison sur les deux plaintes : "SDB pas joli joli" = hallucinations P0, "salons cata" = artefact fusion P0.

## Tableau recapitulatif

| Pipeline | Room | Preservation spatiale ×3 | Rendu photo ×2 | Note finale | Verdict |
|---|---|---|---|---|---|
| **A** Scandi living #200 | living_room | 2/10 (fusion crop) | 4/10 | **3.5/10** | NO-GO P0 |
| **B** Scandi living #202 | living_room | 2/10 (fusion crop, idem A) | 4/10 | **3.5/10** | NO-GO P0 |
| **C** Scandi dining #203/205 | dining_room | 5/10 (angle shift) | 8/10 | **7.2/10** | GO conditionnel |
| **D** Japandi bath #201/204 | bathroom | 1/10 (hallucinations massives) | 7/10 | **4.0/10** | NO-GO P0 |

Moyenne ponderee : **5.4/10**. Trois pipelines sur quatre en NO-GO.

## Triangulation avec Yann

Yann audite en parallele. Mes observations techniques (hallucinations structurelles D, artefact fusion A/B, shift angle C) sont visibles a l'oeil nu et ne depassent pas le champ de l'architecte d'interieur. Je m'attends a une convergence forte (+/- 0.5 point).

## Detail par pipeline

### Pipeline A — Scandinavian living #200 (3.5/10) — NO-GO P0

**ALERTE : artefact de fusion photo.** L'output montre clairement un rectangle central contenant une version **assombrie et non-editee** de l'input d'origine (murs bruts, brique, briquette, convecteur, personnage debout), **colle au centre** d'une piece exterieure regeneree (sol chene clair large-plank, murs blancs, plafond blanc, poutre preservee). La transition est nette — bord droit vertical visible a ~60% de la largeur, bord gauche idem. C'est exactement le type d'artefact produit par le modele quand `input_fidelity: "high"` preserve trop agressivement une region centrale tout en laissant le reste se regenerer.

Preservation spatiale : partielle (la poutre centrale et la geometrie globale sont la), mais la fusion casse toute credibilite. Lumiere : incoherente entre la zone "preservee" (tons froids) et la zone "regeneree" (tons chauds). Rendu : inutilisable en l'etat.

**Diagnostic** : la heuristique input_fidelity adaptive ne s'est pas declenchee (logs = fidelity=high) mais l'input n'a PAS de highlights cramees evidentes — le bug est ailleurs. Mon hypothese : `input_fidelity: high` + prompt de surfaces qui liste trop d'elements a modifier (sol + murs + plafond) declenche un mode "preserve le centre, regenere autour" propre au Responses API. **Le meme artefact apparaissait deja sur le Pipeline B Contemporary session 35** — la bascule adaptive `low` est obligatoire ici.

### Pipeline B — Scandinavian living #202 (3.5/10) — NO-GO P0 (deterministe)

**Meme input, meme output.** L'artefact de fusion est identique (meme position, meme intensite, meme personnage preserve au centre). **Determinisme confirme** : ce n'est pas un hasard de sampling, c'est un bias structurel du pipeline v55 sur cet input. Relancer ne resout rien. Fix obligatoire cote parametres API.

### Pipeline C — Scandinavian dining #203/205 (7.2/10) — GO conditionnel

**Bonne nouvelle : fix P0-A visuellement confirme.** L'output livre une vraie salle a manger : table ronde chene clair 120cm, 5 chaises boucle creme, tapis texture, pendant blanc centre, vase avec branches. Aucune contamination "salon" (pas de canape, pas de coffee table). Le fix room_type fonctionne end-to-end en prod.

**Mais** : preservation spatiale moyenne (5/10). Comparaison input vs output :
- Angle camera **legerement abaisse** (l'input est en plongee douce, l'output est plus horizontal)
- Les deux fenetres de droite sont preservees (position, nombre, taille OK)
- Le chauffe-eau cylindrique a droite : preserve (bon)
- **Le plafond beton brut avec tuyauteries a ete transforme en plafond beton brut "propre"** — acceptable, c'est cohesif avec le style
- Le personnage de droite a disparu (normal, c'est une photo de chantier)

Rendu photorealiste : excellent (8/10), lumiere naturelle preservee, ombres portees coherentes sous le tapis et les chaises, pas de warm shift. Echelle mobilier coherente.

**Verdict** : c'est la meilleure des 4 generations. Si l'angle etait preserve strict, ce serait 8.5/10.

### Pipeline D — Japandi bathroom #201/204 (4.0/10) — NO-GO P0 CRITIQUE

**ALERTE : hallucinations structurelles massives en passe 2.** L'input est une SDB minuscule contenant UNIQUEMENT une baignoire encastree + un convecteur electrique mural + du carrelage mural gris. Pass1 preserve correctement cette realite (baignoire, convecteur, pendant papier japandi). **Passe 2 invente** :
- Une **cabine de douche a l'italienne** complete avec paroi verre + colonne de douche + pommeau (n'existe PAS dans l'input)
- Un **meuble vasque bois clair + vasque ceramique + robinetterie** (n'existe PAS)
- Un **miroir retroeclaire LED** au-dessus de la vasque (n'existe PAS)
- Un **seche-serviettes noir mat mural** avec serviettes (n'existe PAS)
- Un **tabouret bois + plante + panier osier** (ok freestanding, acceptable)

La baignoire d'origine a **disparu** au profit de la douche. Le convecteur mural (preserve en pass1) est toujours la mais transforme en element decoratif. Preservation spatiale : 1/10.

**Diagnostic technique** : le furniturePrompt bathroom contient vraisemblablement "shower", "vanity", "mirror" comme elements "obligatoires" et le modele les INVENTE quand ils manquent, au lieu de se limiter au freestanding. **C'est exactement le bug room_type inverse** : au lieu de contaminer avec du salon, il contamine avec des equipements fixes de SDB complete. Le prompt bathroom doit detecter "compact/minimal" et se limiter strictement au freestanding (tabouret, panier, plante, miroir pose, textile).

Rendu photo : 7/10 (si on oublie que c'est totalement faux). Lumiere chaude coherente, ombres correctes, materiaux credibles.

## Comparaison v54 → v55

| Axe | v54 (7.10) | v55 (5.4) | Delta |
|---|---|---|---|
| Architectural honesty | N/A | Effet visible (pas de vault beams inventees) | + |
| Bug room_type | Contamine dining avec sofa | **Fix OK visuel (C)** | +++ |
| Artefact fusion Pipeline B | Contemporary uniquement | **Generalise a Scandinavian A+B** | --- |
| Hallucinations SDB | Non teste | **Massives (D)** | --- |
| Shift angle camera | Rare | Present (C) | - |

**Verdict comparaison** : v55 resout le bug room_type mais introduit/revele deux regressions P0 plus graves. Le fix architectural honesty a probablement rendu le modele trop "libre" sur la passe 2 (il invente des equipements fixes) et le parametrage `input_fidelity: high` sans bascule declenche l'artefact fusion.

## Reponses aux questions

1. **v54 vs v55** : MOINS BIEN. 7.10 → 5.4. Les fixes ont introduit des regressions.
2. **Artefact fusion** : OUI, present sur A et B (determinisme). La heuristique adaptive n'a pas declenche — il faut baisser son seuil ou la forcer sur rooms interior avec murs bruts.
3. **Pipeline C fix room_type** : OUI visuellement valide. Vraie dining room livree.
4. **Pipeline D bathroom** : hallucinations massives (douche + vasque + miroir + seche-serviettes inventes). Cause : furniturePrompt bathroom trop directif, ne s'adapte pas aux SDB compactes existantes.
5. **Determinisme A vs B** : confirme — meme artefact, meme position. Pas aleatoire.
6. **Verdict v55** : **NO-GO CRITIQUE**. Rollback recommande ou hotfix immediat.

## Fixes prioritaires v56

**P0-1 Artefact fusion A/B (pipeline surfaces interior)**
- Forcer `input_fidelity: "low"` quand le prompt surfaces modifie 3+ elements (murs + sol + plafond) OU quand l'input contient >20% de surfaces brutes (briques, beton, platre)
- Alternative : splitter la passe 1 en deux sous-passes (murs+plafond, puis sol) pour eviter le mode fusion
- Test de non-regression : relancer gen-200 et gen-202 apres fix

**P0-2 Hallucinations SDB (furniturePrompt bathroom)**
- Detection "compact bathroom" dans le builder : si dimension input < X, livrer uniquement freestanding (tabouret, panier, plante, textile, miroir POSE ou mural leger)
- Retirer toute mention de "shower", "vanity", "sink", "mirror cabinet", "towel rail" du prompt de base bathroom
- Ajouter clause explicite : "Do NOT add fixed plumbing fixtures that are not already visible in the input photo. Preserve the existing bathtub/shower/toilet exactly as seen."

**P0-3 Preservation angle camera (C)**
- Renforcer CAMERA_PRESERVATION passe 2 : "Do NOT tilt or lower the camera angle — match the input vertical angle within 2 degrees"

**P1-1 Loguer `input_fidelity` reel (pas juste la config)**
- Verifier que l'heuristique adaptive s'execute reellement et logger sa decision (highlights_ratio_measured, decision_taken)

## Verdict final

**NO-GO v55 — 5.4/10.** Rollback ou hotfix P0-1 + P0-2 obligatoire avant toute demo/usage commercial. Le fix P0-A dining_room est valide et doit etre garde. Le Pipeline C est la seule generation publiable (avec reserve angle).
