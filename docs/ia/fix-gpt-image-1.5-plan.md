# Fix GPT-Image-1.5 sur Versimo -- Plan d'action

> Date : 2026-04-04
> Agent : @ia
> Decision fondateur : on reste sur gpt-image-1.5, on adapte les prompts au modele
> Statut : PLAN VALIDE -- en attente d'execution

---

## 1. Diagnostic : pourquoi les generations sont mauvaises (Lucas 2.6/10)

### 1.1 Bug P0 confirme : les prompts v45 sont du CODE MORT

**Fichiers concernes :**
- `app/api/generate/route.ts` (PRODUCTION) -- contient ses PROPRES copies locales des builders
- `lib/generation-pipeline.ts` (JAMAIS APPELE par route.ts) -- contient les builders v45 avec PREAMBLE

**Preuve :**
- `route.ts` n'importe RIEN de `generation-pipeline.ts` (zero ligne `import ... from "@/lib/generation-pipeline"`)
- `route.ts` definit localement `buildSurfacesResponsesPrompt()`, `buildFurnitureResponsesPrompt()`, `buildOutdoorSurfacesResponsesPrompt()`, `buildOutdoorFurnitureResponsesPrompt()`
- Ces copies locales sont les ANCIENNES versions (pre-v45) : pas de `PASS1_PREAMBLE`, pas de `PASS2_PREAMBLE`, pas de `CHANGE ONLY`, pas de `ADD`
- Seul le fichier `generation-pipeline.ts` est utilise par le cron queue (`app/api/cron/process-queue/route.ts`) et le test endpoint (`app/api/test-generation/route.ts`)
- En production directe (non-queue), c'est `route.ts` qui tourne avec les vieux builders

**Impact :** le fondateur testait les anciens prompts (sans preservation-first) en croyant tester v45. Toutes les notes d'audit sont biaisees.

### 1.2 Bug P0 confirme : `action: "edit"` absent en production

**Dans `route.ts` (ligne 493-500) :**
```typescript
tools: [{
  type: "image_generation",
  model: IMAGE_MODEL,
  quality: "high",
  input_fidelity: "high",
  size: size,
  // PAS DE action: "edit" !!!
}]
```

**Dans `generation-pipeline.ts` (ligne 507-514) :**
```typescript
tools: [{
  type: "image_generation",
  model: IMAGE_MODEL,
  action: "edit",        // PRESENT
  quality: "high",
  input_fidelity: "high",
  size: size,
}]
```

**Impact :** Sans `action: "edit"`, le modele est en mode `"auto"` par defaut. Sur gpt-image-1.5, le mode auto LAISSE LE MODELE DECIDER s'il edite ou genere. Quand l'ecart stylistique est grand (chantier brut vers Mediterraneen), le modele CHOISIT de generer une nouvelle image au lieu d'editer. C'est la cause racine de la perte de geometrie.

### 1.3 Differences structurelles entre les deux versions

| Aspect | route.ts (PRODUCTION) | generation-pipeline.ts (v45) |
|---|---|---|
| PASS1_PREAMBLE | ABSENT | "Edit this exact photo. PRESERVE EXACTLY: ..." |
| PASS2_PREAMBLE | ABSENT | "Edit this photo of a finished room. PRESERVE EXACTLY: ..." |
| action: "edit" | ABSENT (mode auto) | PRESENT |
| Ordre prompt passe 1 | "Edit this photo..." + style + preservation en FIN | PREAMBLE + ANTI_FENETRE + CAMERA + LIGHT + ... + "CHANGE ONLY" + style |
| Ordre prompt passe 2 | "Add furniture..." + style + preservation en FIN | PREAMBLE + CAMERA + LIGHT + ... + "ADD" + style |
| Outdoor passe 1 | Ancien format sans preamble fort | "Edit this exact outdoor photo. PRESERVE EXACTLY: ..." |
| Outdoor passe 2 | Ancien format (preservation en milieu) | "Edit this photo of a finished outdoor space. PRESERVE EXACTLY: ..." |
| detectMimeType() | PRESENT (PNG/JPEG/WEBP detection) | ABSENT (hardcode image/jpeg) |

### 1.4 Prompts logges en DB potentiellement tronques

Les prompts finaux construits sont logges en DB via `builtPromptPass1/builtPromptPass2`, mais ils sont reconstruits APRES la generation (lignes 1332-1337 de route.ts). C'est correct -- ils refletent ce qui a ete envoye. Mais si l'audit mentionne des prompts tronques a ~15 mots en DB, c'est un probleme de colonne TEXT tronquee ou d'affichage dans /admin.

---

## 2. Plan d'action IMMEDIAT : brancher les vrais builders v45

### 2.1 Supprimer les copies locales dans route.ts

**Action concrete :**
1. Supprimer de `route.ts` les fonctions locales :
   - `buildSurfacesResponsesPrompt()` (lignes ~137-252)
   - `buildFurnitureResponsesPrompt()` (lignes ~263-395)
   - `buildOutdoorSurfacesResponsesPrompt()` (lignes ~398-420)
   - `buildOutdoorFurnitureResponsesPrompt()` (lignes ~422-443)
   - `tryOpenAIResponses()` (lignes ~446-526)
   - `tryOpenAIResponsesWithPrompt()` (lignes ~541+)
2. Supprimer les constantes dupliquees :
   - `DSLR_LINE`, `CEILING_PRESERVATION`, `COLUMN_PRESERVATION`, `LIGHT_PRESERVATION`, `WALL_PRESERVATION`, `CAMERA_PRESERVATION`, `ANTI_FENETRE`, `ANTI_INVENTION`
   - `EQUIPMENT_PRESERVATION`, `CONTACT_SHADOWS`, `DEPTH_DISTRIBUTION_KITCHEN`, `DEPTH_DISTRIBUTION_BEDROOM`
   - `IMAGE_MODEL`, `API_TIMEOUT_MS`, `getOpenAI()`, `withTimeout()`
   - `getOutputSize()`, `checkRateLimit()`, `rateLimitMap`, `RATE_LIMIT_*`
3. Ajouter les imports depuis `generation-pipeline.ts`

### 2.2 Ajouter `action: "edit"` dans generation-pipeline.ts (deja fait)

Deja present dans generation-pipeline.ts. Rien a faire ici.

### 2.3 Conserver detectMimeType() de route.ts

`generation-pipeline.ts` hardcode `image/jpeg` dans le data URI. Il faut :
1. Copier `detectMimeType()` dans `generation-pipeline.ts`
2. L'utiliser dans `tryOpenAIResponses()` et `tryOpenAIResponsesWithPrompt()`

### 2.4 Verifier les exports de generation-pipeline.ts

S'assurer que toutes les fonctions/constantes necessaires par route.ts sont exportees :
- `buildSurfacesResponsesPrompt` -- deja exporte
- `buildFurnitureResponsesPrompt` -- deja exporte
- `buildOutdoorSurfacesResponsesPrompt` -- deja exporte
- `buildOutdoorFurnitureResponsesPrompt` -- deja exporte
- `tryOpenAIResponses` -- deja exporte
- `tryOpenAIResponsesWithPrompt` -- verifier
- `getOutputSize` -- deja exporte
- `checkRateLimit` -- deja exporte
- `withTimeout` -- deja exporte
- `PROMPT_VERSION` -- deja exporte
- `ROUTE_DEADLINE_MS` -- a verifier

### 2.5 Estimation d'impact

- **Risque** : faible -- on remplace des copies dupliquees par les originaux qui sont deja testes via le cron queue
- **Temps** : 30 minutes de refactoring par @fullstack
- **Test** : une generation Scandinave + une generation Mediterraneen + une outdoor suffisent
- **Rollback** : git revert si regression

---

## 3. Plan d'action STRATEGIQUE : optimiser les prompts pour gpt-image-1.5

### 3.1 Levier 1 : `action: "edit"` force (DEJA DANS v45)

Le parametre `action: "edit"` est le levier le plus important. Il FORCE le modele en mode edition plutot que de le laisser decider. Sans ce parametre, gpt-image-1.5 (plus creatif que gpt-image-1) choisit souvent de regenerer la scene quand le style est eloigne de l'input.

**Statut :** deja present dans generation-pipeline.ts, absent dans route.ts en production. Le fix 2.1 corrige cela.

### 3.2 Levier 2 : Preservation FIRST (DEJA DANS v45 PREAMBLES)

Les PREAMBLES v45 placent la preservation en PREMIER token du prompt :
```
"Edit this exact photo. PRESERVE EXACTLY: the room geometry, camera angle,
every window position and count, every door position and count, wall layout,
ceiling shape, room dimensions. The output room must be geometrically identical
to the input."
```

C'est aligne avec la best practice OpenAI : "State exclusions and invariants explicitly" et "repeat the preserve list on each iteration."

**Statut :** deja dans generation-pipeline.ts. Le fix 2.1 l'active en production.

### 3.3 Levier 3 : Ancrage geometrique par description de l'input (NOUVEAU -- a tester)

**Recommandation Yann Duval** : decrire l'input avant de demander le changement.

**Principe :** au lieu de dire "Edit this photo", dire "This photo shows a room with a FLAT ceiling, 2 windows on the left wall, 1 door on the right wall. Edit it to..."

**Comment l'implementer :**
- Option A (runtime) : utiliser gpt-4.1-mini en pre-pass (~0.5s, ~$0.001) pour decrire automatiquement la geometrie de l'input ("flat ceiling, 2 windows left wall, 1 door right, rectangular room ~4x6m"). Injecter cette description dans le PREAMBLE.
- Option B (prompt only) : renforcer le PREAMBLE avec "Count the windows, doors, and structural features in this photo. The output MUST have the EXACT SAME count."

**Recommandation :** commencer par Option B (zero cout, zero latence). Si les resultats ne s'ameliorent pas apres 10 generations, tester Option A.

**Nouveau PASS1_PREAMBLE propose (v46) :**
```
"Edit this exact photo. Before ANY change, count: how many windows? how many
doors? what is the ceiling shape (flat/vault/beam)? The output MUST preserve
ALL of these EXACTLY. PRESERVE: room geometry, camera angle, every window
position, every door position, wall layout, ceiling shape, room dimensions."
```

### 3.4 Levier 4 : Neutraliser la passe 1 stylistiquement (NOUVEAU -- a tester)

**Recommandation Yann Duval** : la passe 1 applique un style (ex: "terracotta tiles, white plaster walls") qui est TROP eloigne du chantier brut. Le modele regenere au lieu d'editer parce que l'ecart visuel est trop grand.

**Principe :** la passe 1 ne devrait faire que du "clean-up" neutre :
- Murs : blanc mat propre (pas de couleur de style)
- Sol : beton lisse ou parquet clair neutre (pas de terracotta ou herringbone)
- Plafond : blanc mat propre
- Luminaire : aucun (ou preservation de l'existant)

Puis la passe 2 (ou une passe 1.5 intermediaire) applique la finition de surface stylistique.

**Avantages :**
- L'ecart visuel passe 1 est minimal (brut vers propre blanc) -- le modele reste en mode edition
- La geometrie est mieux preservee car le changement demande est faible
- Le sol et les murs prennent leur couleur finale en passe 2 ou 1.5

**Inconvenients :**
- Ajouter une passe 1.5 = +1 appel API = +$0.06-0.10 = +20-40s de latence
- La passe 2 devrait faire plus de travail (surfaces + mobilier = retour au probleme single-pass)

**Recommandation :** NE PAS ajouter de passe 1.5. Garder le pipeline 2 passes mais REDUIRE l'ambition stylistique de la passe 1 :
- Garder le materiau de sol du style MAIS simplifier (ex: "oak plank flooring" au lieu de "whitewashed ash with visible grain and knots")
- Garder la couleur des murs du style MAIS simplifier (ex: "warm white walls" au lieu de "terracotta plaster with hand-troweled texture")
- Supprimer les descripteurs de texture et finition elabores de la passe 1
- La passe 2 peut affiner la texture via les furniturePrompts (tapis qui couvre le sol, objets deco qui ajoutent de la texture)

### 3.5 Levier 5 : Reduction de la longueur du prompt (NOUVEAU -- a tester)

Les prompts actuels font ~400-500 mots par passe. La documentation OpenAI recommande des prompts de spec clairs et structures. Mais trop de contraintes simultanées DILUENT le signal principal.

**Principe :** chaque passe devrait avoir UN objectif clair en 1 phrase, suivi de 3-5 contraintes critiques, pas 15.

**Proposition de structure passe 1 (v46) :**
```
[PREAMBLE - 2 phrases : edit + preserve]
[WHAT TO CHANGE - 1 phrase : surface finish description]
[TOP 3 CONSTRAINTS : anti-fenetre, camera locked, no furniture]
[DSLR LINE]
```

Total : ~100-120 mots au lieu de ~400.

Les contraintes secondaires (equipment preservation, wall geometry, ceiling geometry) sont IMPLICITES dans le PREAMBLE "room must be geometrically identical." Ne les repeter que si le modele les viole systematiquement.

**Risque :** le modele pourrait violer des contraintes qu'on ne mentionne plus (ex: lisser les poutres). Mitigation : ajouter les contraintes une par une uniquement quand un pattern de violation est detecte.

### 3.6 Levier 6 : `input_fidelity` et `quality` (verifier la config actuelle)

- `input_fidelity: "high"` est deja en place dans les deux fichiers -- correct
- `quality: "high"` est deja en place -- correct
- Verifier que la resolution de sortie (`size`) correspond bien au ratio de l'input -- deja gere par `getOutputSize()`

Pas d'action supplementaire ici.

### 3.7 Levier 7 : Separation nette "ce qui change" vs "ce qui ne change pas"

La best practice officielle gpt-image-1.5 est : "change only X + keep everything else the same."

Les PREAMBLES v45 font deja cela ("CHANGE ONLY the surface finishes" / "ADD the following furniture"). Mais les constantes qui suivent (CEILING_PRESERVATION, WALL_PRESERVATION, etc.) re-detaillent ce qu'il faut garder, ce qui cree de la confusion.

**Proposition :** fusionner toutes les preservation constantes en UNE SEULE ligne compacte apres le PREAMBLE :
```
"Keep EVERYTHING else: camera angle, windows, doors, walls, ceiling shape,
structural elements, fixed equipment, lighting conditions."
```

Au lieu de 7 constantes separees qui totalisent ~300 mots.

---

## 4. Ordre d'execution recommande

### Phase 1 : Fix immediat (30 min -- @fullstack)
1. `route.ts` : supprimer toutes les copies locales des builders + constantes + fonctions utilitaires
2. `route.ts` : importer depuis `generation-pipeline.ts`
3. `generation-pipeline.ts` : ajouter `detectMimeType()` et l'utiliser dans `tryOpenAIResponses()`
4. Verifier que `action: "edit"` est present (deja fait dans generation-pipeline.ts)
5. Deploy + tester 2-3 generations

### Phase 2 : Mesurer l'impact de v45 + action:edit (1 jour)
6. Generer 6 images de test : 2 faciles (Scandinave sur piece blanche), 2 moyens (Japandi sur chantier), 2 difficiles (Mediterraneen sur chantier brut)
7. Audit croise Yann + Lucas sur ces 6 generations
8. Si les notes passent au-dessus de 7/10 en moyenne -- STOP, v45 + action:edit suffisent
9. Si les notes restent sous 6/10 -- passer a la Phase 3

### Phase 3 : Optimisations strategiques (si necessaire)
10. Tester le Levier 3 (ancrage geometrique par comptage) -- v46
11. Tester le Levier 5 (prompts compacts ~120 mots) -- v47
12. Tester le Levier 4 (neutralisation stylistique passe 1) -- v48
13. Chaque levier teste sur 4 generations + audit rapide

### Phase 4 : Stabilisation
14. Consolider les leviers qui marchent dans une version finale
15. Audit complet 12 styles

---

## 5. Estimation des couts

| Poste | Cout unitaire | Volume test | Total |
|---|---|---|---|
| Generation gpt-image-1.5 (2 passes) | ~$0.12-0.20 | 20 generations de test | ~$3-4 |
| Pre-processing custom GPT-4.1-mini | ~$0.001 | 20 | ~$0.02 |
| Ancrage geometrique GPT-4.1-mini (si Option A Levier 3) | ~$0.002 | 20 | ~$0.04 |
| **Total Phase 1-3** | | | **~$4 max** |

Le cout de debug est negligeable. Le gain en qualite (notes d'audit 5.7 vers 8+) justifie largement l'investissement.

---

## 6. Risques et mitigations

| Risque | Probabilite | Mitigation |
|---|---|---|
| v45 + action:edit ne suffisent pas | Moyenne | Leviers 3-5 deja documentes, prets a deployer |
| Prompts compacts perdent des contraintes | Faible | Re-ajouter une par une si violation detectee |
| Latence augmentee avec passe supplementaire | N/A | On NE recommande PAS de passe supplementaire |
| gpt-image-1.5 change de comportement (update OpenAI) | Faible | Prompt versioning + audit continu |

---

## 7. Critere de succes

- **Seuil minimum** : note moyenne Yann >= 7.0/10 ET note moyenne Lucas >= 6.5/10 sur 6 generations
- **Seuil cible** : note moyenne Yann >= 8.0/10 ET note moyenne Lucas >= 7.5/10
- **Preservation spatiale** : aucune generation CAPpee a 5/10 pour perte de geometrie

---

**Handoff -> @fullstack**
- Fichier produit : `docs/ia/fix-gpt-image-1.5-plan.md`
- Action immediate : Phase 1 (brancher les vrais builders v45 dans route.ts, supprimer les copies locales, ajouter detectMimeType dans generation-pipeline.ts)
- Points d'attention : `action: "edit"` DOIT etre present dans le tool config, les PREAMBLES DOIVENT etre les premiers tokens de chaque prompt, ne pas perdre `detectMimeType()` lors de la migration
- Apres deploy : generer 6 images de test pour valider l'impact avant d'aller plus loin
