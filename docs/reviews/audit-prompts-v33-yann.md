# Audit prompts v33 — Yann Duval, Architecte d'interieur

Date : 2026-04-01
Version auditee : v33 (post-Sprint 23)
Methode : audit statique des prompts (StylePicker.tsx, route.ts, generation-pipeline.ts, iteration-prompt.ts, room-types.ts, custom-prompt.ts)
Contexte : le fondateur signale une regression catastrophique de qualite

---

## Verdict global

**Les prompts v33 sont structurellement sains.** Je ne trouve PAS de regression catastrophique par rapport aux regles documentees dans CLAUDE.md. Les principes fondamentaux (split surface/furniture, preservation lumiere, pas de curtains dans les styles, pas de TRANSFORM) sont tous respectes. La qualite des stylePrompts est bonne a tres bonne.

Cependant, j'identifie **7 problemes de severite variable** qui, cumules, peuvent produire des resultats decevants selon le contexte d'input. Voici mon analyse complete.

---

## Grille d'evaluation des PROMPTS (pas d'images)

| # | Critere | Note /10 | Commentaire |
|---|---------|----------|-------------|
| 1 | **Fidelite stylistique** (x2) | 8.0 | Les 12 surfacePrompts + furniturePrompts capturent bien l'essence de chaque style. References correctes (PH5, Wegner, AJ, Sputnik). |
| 2 | **Vocabulaire visuel** | 7.5 | Materiaux et textures bien decrits. Quelques styles manquent de precision sensorielle (cf. Cosy, Wabi-Sabi). |
| 3 | **Hero pieces** | 8.0 | Pieces iconiques presentes dans la majorite des styles. Contemporain un peu faible (Flos IC-style est bien mais pourrait etre plus affirme). |
| 4 | **Coherence matieres** | 7.5 | Globalement coherent. Le Haussmannien melange bergere + Persian rug de facon un peu passe-partout. |
| 5 | **Eclairage** | 6.0 | PROBLEME MAJEUR : contradiction entre surfacePrompts ("warm tint") et builder ("do not add warm tint"). Voir P0-1. |
| 6 | **Credibilite pro** (x2) | 7.0 | Les prompts produiraient des images montables a un client, MAIS la longueur totale des prompts construits (300+ mots passe 2 generic) dilue l'instruction principale. |
| 7 | **Completude** | 7.0 | Les builders sont complets. Mais les room-type overrides pour bedroom/kitchen REMPLACENT le furniturePrompt stylistique → perte d'identite de style. Voir P0-2. |
| 8 | **Differenciation** | 6.5 | Les 12 furniturePrompts sont bien distincts. MAIS quand roomFurnitureOverride remplace le prompt, tous les styles produisent la meme chambre/cuisine. |
| 9 | **Adaptabilite spatiale** | 7.5 | Bonnes directives conditionnelles (compact room, scaling, depth). |
| 10 | **Potentiel photorealiste** | 7.5 | DSLR, grain, vignetting bien presents. |

**Note moyenne ponderee : 7.1/10**

---

## Problemes identifies — par priorite

### P0-1 — CONTRADICTION ECLAIRAGE : surfacePrompts disent "warm tint", builder interdit "warm tint"

**Fichiers** : `components/StylePicker.tsx` (lignes 56, 67, 78, 111, 133, 144) vs `app/api/generate/route.ts` (ligne 125, constante LIGHT_PRESERVATION)

**Constat** : 6 des 12 surfacePrompts contiennent des directives de temperature de couleur chaude :
- Japandi : "soft **warm** white walls with very subtle **sand** undertone"
- Art Deco : "slightly **warm** white walls"
- Mid-Century : "soft white walls with barely visible **warm tint**"
- Cosy : "soft white walls with barely visible **warm tint**"
- Maximaliste : "remaining areas in **warm** white"
- Haussmannien : "soft **warm** white walls"

Pendant ce temps, le builder LIGHT_PRESERVATION dit textuellement : **"Do not add any warm tint or yellow cast — if the input walls are cool-toned or neutral, the output walls must remain the same temperature."**

Le modele recoit un message contradictoire. Selon l'input, il peut soit :
- Ignorer le surfacePrompt et garder les murs froids (resultat terne, sans l'identite du style)
- Ignorer le builder et rechauffer les murs (warm color shift, regresse les corrections du Sprint 18)
- Osciller entre les deux d'une generation a l'autre (incoherence)

**Impact** : Ce conflit est la cause probable N.1 de resultats inconsistants. Sur un input a murs blancs froids, le modele est paralyse. Sur un input deja chaud, il surchauffe.

**Correction proposee** : Les surfacePrompts doivent decrire la COULEUR CIBLE sans utiliser le mot "warm" quand LIGHT_PRESERVATION interdit le rechauffement. Remplacer par des descripteurs de couleur neutres :
- Japandi : "off-white walls with very subtle sand undertone" (supprimer "warm")
- Art Deco : "smooth off-white walls with a hint of cream"
- Mid-Century : "soft white walls with the faintest ivory undertone"
- Cosy : "soft white walls with the faintest ivory undertone"
- Maximaliste : "remaining areas in clean warm white" → "remaining areas in off-white"
- Haussmannien : "soft off-white walls with classic Parisian warmth" → "soft off-white walls"

ET modifier LIGHT_PRESERVATION pour clarifier : "Do not shift the overall color temperature beyond what the surface finish specifies. If the input walls are cool and the style calls for off-white, apply a subtle finish change but do not add yellow cast."

---

### P0-2 — PERTE D'IDENTITE STYLISTIQUE : roomFurnitureOverride REMPLACE le furniturePrompt

**Fichiers** : `lib/room-types.ts` (ligne 210-214) + `app/api/generate/route.ts` (ligne 1015-1021)

**Constat** : Quand un utilisateur choisit "Chambre adultes" + "Scandinave", le code fait :
```
effectiveFurniturePrompt = rt.roomFurnitureOverride  // Generic bedroom furniture
```
Le furniturePrompt scandinave (avec AJ lamp, Wegner chair, Nordic cushions, sheepskin) est **completement jete a la poubelle**. A la place, le modele recoit :
```
"Adult bedroom furniture: upholstered double bed 160cm wide with padded headboard..."
```
C'est un prompt de chambre GENERIQUE sans aucun marqueur de style. Le Scandinave, le Japandi, le Cosy et le Maximaliste produisent **exactement la meme chambre**.

C'est vrai pour TOUS les room types ayant un roomFurnitureOverride : bedroom_adults, bedroom_children, bathroom, kitchen, wc, office, entryway, laundry, cellar, dining_room.

Seul "living_room" conserve le furniturePrompt stylistique (roomFurnitureOverride est vide).

**Impact** : C'est potentiellement LA cause de la "catastrophe" signalee. Si le fondateur teste des chambres, cuisines ou salles de bain, il obtient un mobilier generique identique quel que soit le style choisi. C'est exactement ce que signifie "regression catastrophique" — les generations sont indifferenciees.

**Correction proposee** : Le roomFurnitureOverride ne doit PAS remplacer, il doit ENRICHIR le furniturePrompt stylistique. Concretement, pour chaque room type, creer des furniturePrompts STYLISTIQUES par piece :
- Option A (rapide) : concatener `furniturePrompt + roomFurnitureOverride` au lieu de remplacer, en prefixant le roomFurnitureOverride par "Adapted for [room type]: "
- Option B (meilleure) : creer un tableau `ROOM_STYLE_PROMPTS[roomType][styleId]` avec 12 x 10 prompts dedies
- Option C (pragmatique) : modifier `applyRoomTypeOverrides` pour FUSIONNER les deux prompts — le roomFurnitureOverride fournit la LISTE DE MEUBLES (lit, chevets, armoire), le furniturePrompt fournit le STYLE (materiaux, textures, couleurs, references)

**Ma recommandation** : Option C. Modifier `applyRoomTypeOverrides` ainsi :
```typescript
effectiveFurniturePrompt: rt.roomFurnitureOverride
  ? `${rt.roomFurnitureOverride} Style: use materials, textures, colors and design references from the following: ${furniturePrompt}`
  : furniturePrompt,
```
Cela preserve la liste fonctionnelle de meubles par piece tout en injectant l'ADN stylistique.

---

### P1-1 — DILUTION DU PROMPT : le builder generique passe 2 fait ~180 mots de directives

**Fichier** : `app/api/generate/route.ts` (lignes 369-379)

**Constat** : Le builder generique (fallback, utilise pour living_room, office, null) produit ~180 mots de directives auxquels s'ajoute le furniturePrompt (~80-95 mots). Total : ~275 mots.

Le CLAUDE.md dit "chaque passe ~6-8 phrases max". Le prompt actuel fait 9-10 phrases longues. Ce n'est pas catastrophique mais c'est a la limite. Les directives tardives dans le prompt (apres le token 200) recoivent moins d'attention du modele — c'est un comportement documente de GPT-image-1.

Les directives les plus critiques (depth distribution, contact shadows, scale references) sont en position 2-5 — c'est correct. Mais "Respect style density" et "No duplicate items" sont en position 7-8 et risquent d'etre ignorees.

**Correction proposee** : Condenser les 3 dernieres phrases en 2. Fusionner "Respect style density" et "Freestanding only" :
```
"Freestanding only — no wall art, no shelving, no curtains. Respect style density. Structure LOCKED. Do not block radiators. Same window count."
```

---

### P1-2 — COSY TOUJOURS SOUS-DIFFERENCIE malgre les corrections Sprint 17

**Fichier** : `components/StylePicker.tsx` (lignes 110-113)

**Constat** : Le furniturePrompt Cosy mentionne bien "chunky knit throw", "pillar candles", "layered cushions" (corrections Sprint 17). MAIS il manque encore :
- Aucune **bougie parfumee** ni **photophore** (quintessence du Cosy/hygge)
- Le plaid est "cream wool" — trop monochrome, il faut un contraste de matiere (un plaid chunky knit + un throw en fausse fourrure)
- "string of pearls in cream ribbed ceramic hanging planter" — c'est une plante suspendue, donc fixee au mur/plafond. Contredit "freestanding only" du builder.

De plus, le surfacePrompt dit "warm fabric drum pendant light in cream tone" — c'est anodin. Un Cosy devrait avoir un luminaire plus evocateur (ex: suspension osier tresse ajouree diffusant une lumiere tamisee).

**Correction proposee** :
- surfacePrompt : "woven rattan dome pendant light casting dappled light patterns 50cm diameter"
- furniturePrompt : ajouter "3 glass votive holders with tea light candles on wooden tray" + remplacer "string of pearls in hanging planter" par "trailing pothos in cream stoneware floor planter 30cm"
- ajouter "one faux fur throw in warm taupe draped over the armchair"

---

### P1-3 — MENTION DE "NO CURTAINS" DANS LES BUILDERS = AMORCE NEGATIVE

**Fichier** : `app/api/generate/route.ts` (8 occurrences de "No curtains" ou "no curtains")

**Constat** : Le CLAUDE.md Sprint 12 dit textuellement : **"NE JAMAIS mentionner curtains/drapes meme en negatif — mentionner un element meme en negatif AMORCE le modele a les generer."** (Point 85)

Or le builder actuel ecrit "No curtains" dans presque tous les room types. C'est une contradiction directe avec la regle. Meme si les stylePrompts ont ete nettoyes (pas de "curtain" dans StylePicker), le builder les reintroduit en negatif.

**Impact** : Risque d'hallucination de rideaux/fenetres, surtout sur les pieces sans fenetres.

**Correction proposee** : Supprimer "No curtains" de TOUS les builders. La directive "Freestanding only" couvre deja l'interdiction sans nommer l'element. Remplacer par rien, ou au maximum par "No window treatments" si absolument necessaire (mais meme ca mentionne "window").

---

### P2-1 — DUPLICATION route.ts / generation-pipeline.ts

**Fichiers** : `app/api/generate/route.ts` + `lib/generation-pipeline.ts`

**Constat** : Les deux fichiers contiennent des copies identiques de :
- Toutes les constantes (DSLR_LINE, CEILING_PRESERVATION, etc.)
- Tous les builders (buildSurfacesResponsesPrompt, buildFurnitureResponsesPrompt, etc.)
- Les fonctions utilitaires (getOutputSize, checkRateLimit, withTimeout)

Quand un prompt est modifie dans un fichier, il faut le modifier dans l'autre. Le risque de desynchronisation est reel. Le commentaire "Extracted from route.ts to avoid duplication (Sprint 23)" est ironique — l'extraction a CREE de la duplication au lieu de la supprimer.

**Correction proposee** : route.ts doit importer les builders depuis generation-pipeline.ts. Supprimer les builders de route.ts et utiliser les exports de generation-pipeline.ts.

---

### P2-2 — WABI-SABI : "60 percent of floor empty" vs directive depth distribution

**Fichier** : `components/StylePicker.tsx` (ligne 124) vs `app/api/generate/route.ts` (constante DEPTH_DISTRIBUTION)

**Constat** : Le furniturePrompt Wabi-Sabi dit "leave at least 60 percent of the floor area completely empty for serene intentional space". En meme temps, le builder dit "Distribute furniture across FULL DEPTH and WIDTH".

Ces deux directives ne sont pas directement contradictoires (on peut distribuer peu de meubles en profondeur), mais le modele peut les percevoir comme conflictuelles. "Full depth" evoque une occupation dense, "60% empty" evoque du vide.

**Correction proposee** : Ajouter une condition dans le furniturePrompt Wabi-Sabi : "place the few pieces at varying depths to avoid clustering — but leave at least 60 percent of the floor empty".

---

### P2-3 — ITERATION RESTYLE : le furniturePrompt original n'est PAS injecte

**Fichier** : `lib/iteration-prompt.ts` (ligne 13)

**Constat** : Le parametre `_furniturePrompt` (avec underscore) n'est **jamais utilise** dans `buildIterationFurnitureResponsesPrompt`. Le prompt d'iteration ne contient que les modifications cumulees — il ne rappelle PAS le style original.

Si l'utilisateur demande "ajouter une plante", le modele ne sait pas que le style etait Scandinave. Il ajoutera une plante generique au lieu d'un pothos dans un pot gris stoneware.

**Correction proposee** : Ajouter le furniturePrompt original comme contexte de style :
```
`The original style for this room was: ${furniturePrompt}. Keep all existing furniture consistent with this style.`
```

---

## Synthese des corrections par priorite

| Priorite | Issue | Impact | Effort |
|----------|-------|--------|--------|
| **P0-1** | Contradiction warm tint (surfacePrompts vs LIGHT_PRESERVATION) | Inconsistance colorimetrique majeure | Faible (editer 6 surfacePrompts + 1 constante) |
| **P0-2** | roomFurnitureOverride REMPLACE le style | Perte totale d'identite stylistique sur 10/12 room types | Moyen (modifier applyRoomTypeOverrides) |
| **P1-1** | Dilution prompt passe 2 (280 mots) | Directives tardives ignorees | Faible (condensation) |
| **P1-2** | Cosy sous-differencie | Style generique "hotel business" | Faible (editer prompts) |
| **P1-3** | "No curtains" en negatif = amorce | Risque hallucination rideaux/fenetres | Faible (supprimer 8 mentions) |
| **P2-1** | Duplication route.ts / generation-pipeline.ts | Risque desynchronisation | Moyen (refactoring imports) |
| **P2-2** | Wabi-Sabi 60% vide vs depth distribution | Conflit potentiel | Negligeable |
| **P2-3** | Iteration restyle sans contexte de style | Perte de style en iteration | Faible |

---

## Hypothese sur la "catastrophe" signalee par le fondateur

Apres analyse complete, je formule cette hypothese :

**La regression n'est PAS dans les prompts eux-memes (qui sont globalement bons pour le living_room) mais dans l'interaction entre les prompts et le systeme de room types.**

Si le fondateur teste des chambres, cuisines, salles de bain ou tout autre room type, le P0-2 explique tout : le furniturePrompt stylistique est SUPPRIME et remplace par un prompt generique. Le resultat est une piece fonctionnellement correcte mais stylistiquement morte — identique pour les 12 styles.

C'est une regression par rapport aux attentes car :
1. L'utilisateur choisit un style visuellement attrayant dans le picker
2. Il choisit un room type (chambre, cuisine...)
3. Le systeme JETTE le style et genere du generique
4. L'utilisateur obtient un resultat fade et indifferencie

Combine avec le P0-1 (contradiction warm tint qui rend les couleurs inconsistantes), cela suffit a expliquer une perception de "catastrophe".

---

## Recommandation de plan d'action

1. **Immediate (P0)** : Corriger P0-2 (fusion style + room type) — c'est le correctif qui aura le plus d'impact sur la qualite percue
2. **Immediate (P0)** : Corriger P0-1 (harmoniser temperature couleur) — supprime l'inconsistance
3. **Court terme (P1)** : Supprimer "No curtains" des builders, condenser le prompt passe 2, enrichir le Cosy
4. **Moyen terme (P2)** : Refactorer la duplication, ajuster Wabi-Sabi, ajouter contexte style aux iterations

---

Handoff : @fullstack pour implementation des corrections P0 (priorite P0-2 en premier). @ai-image-expert (Lucas Moreau) pour validation technique post-correction via audit croise des generations.
