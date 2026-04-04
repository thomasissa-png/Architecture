# Audit visuel v45 -- Lucas Moreau
## 2026-04-04 | Generations #137 (passe 1) et #138 (passe 2) | Mediterranean kitchen | v45

---

## VERDICT GLOBAL : "AUCUN EFFET" CONFIRME -- BUG TECHNIQUE IDENTIFIE

Le fondateur a raison : les prompts v45 n'ont AUCUN effet. La cause n'est PAS le modele gpt-image-1.5, ni la structure des prompts v45. La cause est un **bug de duplication de code** : les prompts v45 existent dans `lib/generation-pipeline.ts` mais ne sont JAMAIS utilises en production.

La route de production (`app/api/generate/route.ts`) contient ses PROPRES copies des builders, restees a l'ancienne version (style AVANT preservation, CAMERA/LIGHT en fin de prompt). Le fichier `generation-pipeline.ts` n'est importe que par le cron/queue et les scripts de test.

**Les generations #137 et #138 ont ete produites avec les anciens prompts, pas les v45.**

---

## DIAGNOSTIC TECHNIQUE (3 problemes identifies)

### BUG P0 : Duplication de code -- les v45 sont du code mort

| Fichier | Utilise en production | Format des builders |
|---|---|---|
| `app/api/generate/route.ts` | OUI (route POST /api/generate) | ANCIEN : `"Edit this photo of a kitchen. Apply this surface finish: ..."` + CAMERA/LIGHT en FIN |
| `lib/generation-pipeline.ts` | NON (cron/queue/tests seulement) | v45 : `PASS1_PREAMBLE` en tete + preservation AVANT style + `"CHANGE ONLY..."` |

La route principale n'importe rien de `generation-pipeline.ts`. Les 2 fichiers ont des copies independantes de :
- `buildSurfacesResponsesPrompt()`
- `buildFurnitureResponsesPrompt()`
- `tryOpenAIResponses()`
- Toutes les constantes (CAMERA_PRESERVATION, LIGHT_PRESERVATION, etc.)

**Impact** : chaque amelioration de prompt faite dans `generation-pipeline.ts` est invisible en production. Tous les audits precedents basees sur la lecture de ce fichier evaluaient du code mort.

**Fix** : supprimer les copies dans `route.ts` et importer depuis `generation-pipeline.ts`. Alternativement, propager les prompts v45 dans `route.ts`. La premiere option est la bonne architecture.

### BUG P1 : Les prompts logges en DB ne correspondent pas aux prompts envoyes

Les champs `built_prompt_pass1` et `built_prompt_pass2` dans le JSON sont extremement courts (~15 mots) :
- Pass 1 : "Mediterranean kitchen with white lime plaster, terracotta flooring, and integrated cabinetry"
- Pass 2 : "Mediterranean style kitchen with white lime plaster walls, terracotta tiles, wrought iron lighting, and specified cabinetry layout"

Ces valeurs ne correspondent ni aux builders de `route.ts` (~200 mots) ni a ceux de `generation-pipeline.ts` (~250 mots). Elles ne correspondent pas non plus au `surfacePrompt` du style Mediterranean dans StylePicker.tsx (~60 mots).

Hypotheses :
1. Le logging echoue silencieusement et un fallback inscrit un resume
2. La colonne `built_prompt_pass1` en DB tronque le texte
3. Le pre-processing GPT-4.1-mini est applique aux styles predefinis et produit un resume

**Impact** : impossible d'auditer les prompts reellement envoyes au modele a partir de la DB. L'auditabilite du pipeline est compromise.

### PROBLEME P2 : gpt-image-1.5 ne preserve PAS la geometrie (confirme)

Meme si les prompts v45 etaient injectes, l'audit precedent (#132-135, v43) avait deja demontre que gpt-image-1.5 regenere la scene au lieu de l'editer. Les generations #137-138 confirment ce comportement :
- 2 fenetres PVC disparues, remplacees par 2 portes en bois massif
- Plafond plat (placoplatre) transforme en voute avec arche
- Sol brut remplace par travertin/terre cuite
- Angle de vue frontal approximativement conserve mais toutes les proportions changent

Ce comportement est inherent au modele, pas aux prompts. gpt-image-1.5 est "plus creatif" que gpt-image-1 (selon la doc OpenAI) et ignore les contraintes de preservation meme placees en premiere position.

---

## ANALYSE VISUELLE

### Generation #137 -- Passe 1 (surfaces)

**Input** : Chantier brut, piece rectangulaire vue de face. 2 fenetres PVC blanches a gauche, plafond plat en placoplatre rose avec spots et cables, murs en plaques vertes (hydrofuges) avec joints, porte a droite, sol brut noir/brun, tuyauterie cuivre au mur du fond, radiateur sous fenetre.

**Output passe 1** : Piece COMPLETEMENT INVENTEE.

#### ALERTE PRESERVATION SPATIALE : l'espace n'est PAS fidele a l'original

| Element | Input | Output passe 1 | Verdict |
|---|---|---|---|
| Fenetres | 2 fenetres PVC blanches a gauche | 0 fenetres, 2 portes bois massif | DETRUIT |
| Plafond | Plat, placoplatre rose | Voute en arc avec arche | INVENTE |
| Sol | Brut noir/brun | Travertin/terre cuite | OK (attendu) |
| Murs | Plaques vertes hydrofuges | Blancs enduits | OK (attendu) |
| Porte | 1 porte a droite | 2 portes bois massif | MODIFIE |
| Radiateur | Sous fenetre gauche | Deplace a droite | DEPLACE |
| Tuyauterie | Cuivre visible au mur fond | Disparue | SUPPRIME |
| Angle de vue | Frontal, legerement plongeant | Frontal | APPROXIMATIF |
| Proportions piece | Rectangle ~3:2 | Plus large, proportions differentes | MODIFIE |

La preservation spatiale est a **1/10**. L'espace n'a plus rien a voir avec l'original. Note CAPpee a 5/10 maximum.

#### Grille 10 criteres -- Generation #137

| # | Critere | Poids | Note /10 | Commentaire |
|---|---------|-------|----------|-------------|
| 1 | Preservation spatiale | x3 | 1/10 | Fenetres supprimees, plafond invente (voute), proportions modifiees, porte dedoublee, radiateur deplace |
| 2 | Contraintes lumiere | x1 | 3/10 | Eclairage naturel des fenetres disparu, remplace par un eclairage artificiel diffus |
| 3 | Vocabulaire photo | x1 | 6/10 | Rendu photographique credible, netteté correcte, mais trop propre (CGI-clean) |
| 4 | Structure prompt | x1 | 2/10 | Le prompt v45 n'est PAS injecte (bug P0). Les anciens prompts sont utilises |
| 5 | Negative prompting | x1 | 1/10 | Fenetres disparues, voute inventee, portes hallucinees -- toutes les contraintes negatives violees |
| 6 | Compatibilite multi-modeles | x1 | N/A | Un seul modele (gpt-image-1.5), pas de fallback |
| 7 | Coherence I/O | x1 | 5/10 | Ratio landscape preserve (1280x968 -> 1536x1024), format OK |
| 8 | Richesse descriptive | x1 | 3/10 | Le prompt est trop court (~15 mots logges) ou non-construit |
| 9 | Adaptabilite conditions | x1 | 2/10 | Chantier brut = le pire cas pour gpt-image-1.5 qui regenere au lieu d'editer |
| 10 | Rendu final credible | x2 | 6/10 | Le rendu est visuellement agreable en soi, mais ce n'est PAS la meme piece |

**Note ponderee** : (1x3 + 3 + 6 + 2 + 1 + 5 + 3 + 2 + 6x2) / 14 = (3 + 3 + 6 + 2 + 1 + 5 + 3 + 2 + 12) / 14 = 37/14 = **2.6/10** -> CAPpee a **2.6/10** (preservation spatiale catastrophique, bien en dessous du cap a 5)

### Generation #138 -- Passe 2 (mobilier sur passe 1)

**Input passe 2** : Le resultat de la passe 1 (piece inventee avec voute, 2 portes bois, travertin).

**Output passe 2** : Cuisine meublee coherente avec la passe 1.

#### Preservation par rapport a la passe 1 (source directe)

| Element | Passe 1 | Passe 2 | Verdict |
|---|---|---|---|
| Voute | Presente | Presente | PRESERVE |
| Portes bois | 2 portes | 2 portes, memes positions | PRESERVE |
| Sol travertin | Travertin clair | Terre cuite plus saturee | MODIFIE (teinte) |
| Murs blancs | Blancs | Blancs avec texture plâtre | PRESERVE |
| Chauffe-eau | Mur droit | Mur gauche, meme apparence | DEPLACE |
| Radiateur | A droite | A droite | PRESERVE |
| Luminaire | Lanterne fer forge | Pendentif rotin/osier | MODIFIE |
| Grille ventilation | Absente | Ajoutee en haut droite | INVENTE |

La passe 2 preserve correctement la geometrie de la passe 1 (voute, portes, proportions). Le changement de luminaire (fer forge -> rotin) est une regression : le luminaire avait ete place en passe 1 et ne devrait pas changer en passe 2.

#### Grille 10 criteres -- Generation #138

| # | Critere | Poids | Note /10 | Commentaire |
|---|---------|-------|----------|-------------|
| 1 | Preservation spatiale (vs input original) | x3 | 1/10 | L'espace est TOUJOURS invente -- la passe 2 ne peut pas compenser la passe 1 |
| 2 | Contraintes lumiere | x1 | 5/10 | Eclairage sous-meuble coherent, ombres correctes sur les caissons |
| 3 | Vocabulaire photo | x1 | 7/10 | Rendu photographique credible, bon niveau de detail sur le mobilier |
| 4 | Structure prompt | x1 | 3/10 | Le mobilier est pertinent pour le style Mediterranean mais le prompt est trop court |
| 5 | Negative prompting | x1 | 4/10 | Pas de rideaux ni de decorations murales excessives, mais luminaire modifie et grille inventee |
| 6 | Compatibilite multi-modeles | x1 | N/A | Un seul modele |
| 7 | Coherence I/O | x1 | 6/10 | Format preserve, ratio OK |
| 8 | Richesse descriptive | x1 | 4/10 | Le furniturePrompt est trop court pour guider une cuisine complete |
| 9 | Adaptabilite conditions | x1 | 3/10 | La source (passe 1) est propre, mais l'enchainement ne corrige pas la derive geometrique |
| 10 | Rendu final credible | x2 | 7/10 | La cuisine est credible EN SOI -- mais ce n'est pas CETTE cuisine |

**Note ponderee** : (1x3 + 5 + 7 + 3 + 4 + 6 + 4 + 3 + 7x2) / 14 = (3 + 5 + 7 + 3 + 4 + 6 + 4 + 3 + 14) / 14 = 49/14 = **3.5/10** -> CAPpee a **3.5/10**

---

## DIAGNOSTIC : POURQUOI "AUCUN EFFET"

### Cause racine immediate : les prompts v45 ne sont pas injectes

```
app/api/generate/route.ts       <-- UTILISE EN PRODUCTION
  - Contient ses propres copies de buildSurfacesResponsesPrompt(), buildFurnitureResponsesPrompt(), tryOpenAIResponses()
  - Format ANCIEN : style en premier, preservation en fin de prompt
  - N'importe RIEN de generation-pipeline.ts

lib/generation-pipeline.ts      <-- CODE MORT (sauf cron/queue)
  - Contient les prompts v45 (PASS1_PREAMBLE en tete, preservation AVANT style)
  - Importe par : scripts/test-generation.ts, app/api/cron/process-queue/route.ts, app/api/test-generation/route.ts
  - NON importe par la route principale
```

Les modifications v45 ont ete faites dans le mauvais fichier. La route de production n'a pas ete mise a jour.

### Cause racine profonde : gpt-image-1.5 regenere les scenes

Meme si les prompts v45 etaient injectes, l'audit precedent (generations #132-135 sur v43) a demontre que gpt-image-1.5 detruit la geometrie sur les chantiers bruts. Le modele est "plus creatif" et interprete le prompt comme une description de scene a generer, pas une image a editer.

Les parametres `action: "edit"` et `input_fidelity: "high"` dans le tool image_generation ne suffisent pas a forcer le mode edition.

### Comparaison avec gpt-image-1

| Critere | gpt-image-1 (v43) | gpt-image-1.5 (v45) |
|---|---|---|
| Preservation fenetres | Generalement correcte (80%+) | ECHEC : fenetres supprimees, portes inventees |
| Preservation plafond | Correcte si pas de voute | ECHEC : plafond plat transforme en voute |
| Preservation angle | Correcte | Approximative |
| Preservation equipements | Partiellement (80%) | Partielle (radiateur deplace) |
| Rendu visuel | 7-8/10 | 6-7/10 (trop propre, pas de grain) |
| Latence | ~50-80s | ~55s (similaire) |

---

## PLAN D'AMELIORATION

### P0 -- CRITIQUE : Unifier les builders (deduplication)

**Action** : Supprimer les copies locales dans `app/api/generate/route.ts` et importer depuis `lib/generation-pipeline.ts`.

Fichiers a modifier :
- `app/api/generate/route.ts` : supprimer les fonctions dupliquees, ajouter les imports
- Verifier que `route.ts` et `generation-pipeline.ts` partagent exactement les memes constantes

**Risque** : aucun si les exports sont bien aligns. La queue/cron utilise deja `generation-pipeline.ts`.

### P0 -- CRITIQUE : Revenir a gpt-image-1

**Evidence** :
- Audit #132-135 (v43) : gpt-image-1.5 detruit la geometrie
- Audit #137-138 (v45) : gpt-image-1.5 detruit la geometrie MALGRE les prompts v45
- Les meilleurs resultats historiques (Yann 8.2, Lucas 8.3 sur #36) sont tous sur gpt-image-1

Le `IMAGE_MODEL` dans `generation-pipeline.ts` ET `route.ts` doit revenir a `"gpt-image-1"` tant que gpt-image-1.5 ne supporte pas un mode edition fidele.

Decision fondateur requise : le fondateur a dit "decision absolue, on le fait marcher". Mais les donnees montrent que gpt-image-1.5 est incapable de preserver la geometrie sur chantier brut. Il faut arbitrer entre latence (/4) et qualite (destruction spatiale).

### P1 -- HAUTE : Verifier les prompts logges en DB

**Action** : ajouter un `console.log` du `builtPromptPass1` complet juste avant le `logGeneration()` dans route.ts pour verifier si le prompt complet est bien construit. Si les prompts en DB sont tronques, identifier la cause (taille colonne TEXT, serialization, etc.).

### P2 -- MOYENNE : Tester les prompts v45 sur gpt-image-1

Les restructurations v45 (preservation AVANT style, "CHANGE ONLY" en tete) n'ont jamais ete testees sur gpt-image-1 puisqu'elles n'etaient pas injectees. Apres le fix P0, lancer un test A/B :
- v44 (ancien format, style en premier) sur gpt-image-1
- v45 (nouveau format, preservation en premier) sur gpt-image-1

Si v45 ameliore la preservation sur gpt-image-1, c'est un gain reel.

### P3 -- BASSE : Reevaluer gpt-image-1.5 dans 1-2 mois

OpenAI peut ameliorer le mode edition de gpt-image-1.5. Reevaluer periodiquement avec un test standardise (meme input chantier brut, meme style Mediterranean).

---

## SYNTHESE

| Generation | Style | Modele | Passe | Note Lucas | Cause principale |
|---|---|---|---|---|---|
| #137 | Mediterranean | gpt-image-1.5 | Passe 1 (surfaces) | **2.6/10** | Geometrie INVENTEE (fenetres, voute, portes) + prompts v45 non injectes |
| #138 | Mediterranean | gpt-image-1.5 | Passe 2 (mobilier) | **3.5/10** | Heritage de la passe 1 detruite + luminaire modifie |

**Moyenne** : 3.05/10

**Le probleme n'est PAS les prompts v45.** Le probleme est double :
1. Les prompts v45 ne sont pas injectes (bug de duplication route.ts / generation-pipeline.ts)
2. gpt-image-1.5 est structurellement incapable de preserver la geometrie sur chantier brut

**Recommandation** : Fix P0 (deduplication) + revert gpt-image-1, puis tester les prompts v45 sur gpt-image-1 pour evaluer leur impact reel.

---

*Lucas Moreau -- Expert IA Image, audit visuel v45 #137-138*
*Prochaine etape : verifier le fix P0, relancer une generation Mediterranean kitchen sur gpt-image-1 avec les vrais prompts v45, comparer.*
