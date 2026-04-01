# Audit Technique Prompts v33 -- Lucas Moreau

**Date** : 2026-04-01
**Auditeur** : Lucas Moreau (Expert IA Image)
**Version audite** : PROMPT_VERSION = "v33"
**Fichiers audites** :
- `app/api/generate/route.ts` (builders inline, chemin direct HTTP)
- `lib/generation-pipeline.ts` (builders inline, chemin queue cron)
- `components/StylePicker.tsx` (12 surfacePrompts + furniturePrompts)
- `lib/iteration-prompt.ts` (builders iteration)

---

## 1. VERDICT GLOBAL : Pas de divergence de prompts -- la regression est AILLEURS

### Hypothese initiale infirmee

L'hypothese prioritaire etait que `generation-pipeline.ts` contiendrait des prompts obsoletes par rapport a `route.ts`. **J'ai compare les deux fichiers builder par builder, constante par constante. Les prompts sont strictement identiques.**

- DSLR_LINE : identique
- CEILING_PRESERVATION : identique
- LIGHT_PRESERVATION : identique
- WALL_PRESERVATION : identique
- CAMERA_PRESERVATION : identique
- STRUCTURE_LOCKED : identique
- EQUIPMENT_PRESERVATION : identique
- CONTACT_SHADOWS : identique
- DEPTH_DISTRIBUTION : identique
- CAMERA_AND_PHOTO : identique
- buildSurfacesResponsesPrompt() : identique (tous 9 room types + fallback)
- buildFurnitureResponsesPrompt() : identique (tous 10 room types + fallback)
- buildOutdoorSurfacesResponsesPrompt() : identique
- buildOutdoorFurnitureResponsesPrompt() : identique

**La duplication de code est un risque de regression futur majeur, mais a date v33 les deux fichiers sont synchrones.**

---

## 2. Evaluation des prompts v33 sur ma grille 10 criteres

Je note les PROMPTS (pas des images) sur la capacite attendue a produire un bon resultat.

| # | Critere | Poids | Note /10 | Analyse |
|---|---------|-------|----------|---------|
| 1 | **Preservation architecturale** | x2 | **8.5** | CAMERA_PRESERVATION + WALL_PRESERVATION + CEILING_PRESERVATION = trio solide. Vanishing points, lens distortion, angles, field of view explicitement ancres. Les voutes/poutres sont protegees par "keep 3D shape". Bon. |
| 2 | **Contraintes lumiere** | x1 | **8.0** | LIGHT_PRESERVATION est bien formule : direction, ombres, intensite relative, temperature couleur, pas de warm tint. "Do not artificially brighten darker areas" -- correct. Manque une clause sur les hautes lumieres (fenetres cramees). |
| 3 | **Vocabulaire photo** | x1 | **8.5** | DSLR_LINE couvre f/8, deep DOF, sharp focus, grain ISO, vignettage 5-10%. Complet et techniquement juste. Le grain "visible at 100% zoom" est la bonne formulation. |
| 4 | **Structure prompt** | x1 | **7.0** | Passe 1 bien structuree (action, style, preservation, nettoyage, empty, camera, photo). Passe 2 : le furniturePrompt du StylePicker est un BLOB de 60+ mots injecte dans le builder -- le modele peut perdre la hierarchie des instructions. Voir P1 ci-dessous. |
| 5 | **Negative prompting** | x1 | **7.5** | "No furniture" (passe 1), "No curtains" (passe 2), "No wall art, no shelving" -- correct. Mais "no curtains" est repete dans presque tous les builders de passe 2 sauf dining_room et le fallback generique. Dining_room dit "no curtains" dans sa propre phrase. Le fallback dit "no curtains" aussi. OK, couverture complete. |
| 6 | **Compatibilite multi-modeles** | x1 | **N/A** | Flux Depth Pro retire. Un seul modele (GPT-image-1). Ce critere n'est plus pertinent. |
| 7 | **Coherence I/O** | x1 | **8.5** | getOutputSize() gere 3 ratios (landscape, portrait, square). Le ratio 1.3/0.77 est un choix raisonnable. Le size est passe au tool image_generation. Correct. |
| 8 | **Richesse descriptive** | x1 | **8.0** | Les 12 stylePrompts sont riches : dimensions (230cm, 120cm, 200x300cm), materiaux (boucle, walnut, brass), silhouettes (channel-tufted, biomorphic, tapered legs). Bon niveau de detail pour ancrer le modele. |
| 9 | **Adaptabilite conditions** | x1 | **7.5** | "keeping the same overall brightness as the input photo" dans tous les surfacePrompts -- bonne formulation neutre. "Do not artificially brighten darker areas" -- protege les pieces sombres. Manque une clause explicite pour les pieces sans fenetre (sous-sols, caves) -- le builder cellar ne mentionne pas l'absence de lumiere naturelle. |
| 10 | **Rendu final credible** | x2 | **7.5** | Le combo grain + vignettage + deep DOF + sharp focus est juste. "Luxury real estate listing photo -- lived-in, not a sterile catalog" est une bonne directive de rendu. Mais cette phrase n'apparait QUE dans le builder fallback generique (living_room, office, null) -- pas dans les 9 builders dedies. C'est un probleme. |

**Note globale ponderee : (8.5x2 + 8.0 + 8.5 + 7.0 + 7.5 + 8.5 + 8.0 + 7.5 + 7.5x2) / 13 = 7.9/10**

Les prompts v33 sont solides. A 7.9/10, ils ne devraient PAS produire une "regression catastrophique". La cause de la regression est probablement ailleurs (infrastructure, modele, parametres API).

---

## 3. Problemes identifies -- par priorite

### P0 -- CRITIQUE : Duplication integrale des builders entre 2 fichiers

**Fichiers** : `route.ts` (builders prives) vs `generation-pipeline.ts` (builders exportes)
**Impact** : Toute modification future dans un fichier qui oublie l'autre = divergence silencieuse = regression garantie.

`route.ts` definit ses propres `buildSurfacesResponsesPrompt`, `buildFurnitureResponsesPrompt`, etc. comme fonctions privees (pas exportees).
`generation-pipeline.ts` definit les memes fonctions avec le meme code, exportees.

Le cron worker utilise `generation-pipeline.ts`. Le chemin HTTP direct utilise `route.ts`.

**A date : les prompts sont identiques. Mais c'est un accident -- rien ne garantit la synchronisation.**

**Correction** : route.ts doit IMPORTER les builders depuis `generation-pipeline.ts` au lieu de les dupliquer. Supprimer toutes les fonctions de build et les constantes de `route.ts`, remplacer par :
```typescript
import {
  buildSurfacesResponsesPrompt,
  buildFurnitureResponsesPrompt,
  buildOutdoorSurfacesResponsesPrompt,
  buildOutdoorFurnitureResponsesPrompt,
  tryOpenAIResponses,
  tryOpenAIResponsesWithPrompt,
  generatePass,
  generateIterationPass,
  getOutputSize,
  PROMPT_VERSION,
} from "@/lib/generation-pipeline";
```

### P0 -- CRITIQUE : "Luxury real estate listing photo" absent de 9/10 builders passe 2

**Fichiers** : `route.ts` ligne 373, `generation-pipeline.ts` ligne 354
**Impact** : Seuls les living rooms et offices recoivent la directive de rendu "luxury real estate listing". Les bedrooms, kitchens, bathrooms, WC, entryways, laundry, cellars et dining rooms ne la recoivent PAS. Le modele genere un rendu generique au lieu d'un rendu immobilier premium.

Cette directive est la seule phrase qui guide l'INTENTION esthetique globale. Sans elle, le modele produit un rendu "catalogue meuble" au lieu d'une photo de bien immobilier.

**Correction** : Ajouter "Result should look like a luxury real estate listing photo -- lived-in, not a sterile catalog." dans TOUS les builders passe 2 (ou mieux, creer une constante partagee).

### P1 -- HAUTE : Builders passe 2 dedies n'ont PAS de directive anti-warm-shift

**Fichiers** : Les builders kitchen, bathroom, WC, bedroom, entryway, laundry, cellar dans les deux fichiers
**Impact** : La directive "No warm tint or yellow cast" n'existe QUE dans le builder fallback generique (ligne 375/356). Les 7 builders dedies disent seulement "Preserve existing light direction and color temperature." -- formulation plus faible.

La regle CLAUDE.md est explicite : "Do not add any warm tint or yellow cast" dans TOUS les builders. C'est un manquement.

**Correction** : Dans chaque builder dedie de passe 2, remplacer :
```
"Preserve existing light direction and color temperature."
```
par :
```
"Preserve existing light direction and color temperature. No warm tint or yellow cast."
```

### P1 -- HAUTE : Builders passe 2 dedies n'ont PAS de directive anti-duplication

**Fichiers** : Tous les builders dedies sauf le fallback generique
**Impact** : "No duplicate items unless style calls for a pair" est absent des builders kitchen, bathroom, WC, bedroom, entryway, laundry, cellar, dining. Le modele peut generer 2 lampadaires, 2 tapis, 2 plantes identiques dans ces pieces.

**Correction** : Ajouter cette clause ou integrer dans EQUIPMENT_PRESERVATION / une constante partagee.

### P1 -- HAUTE : Directive "Furniture must not touch walls" absente des builders dedies

**Fichiers** : Builders bedroom, kitchen, bathroom, WC, entryway, laundry, cellar
**Impact** : Seuls le fallback generique et dining disent que le mobilier ne doit pas toucher les murs. Les meubles colles aux murs detruisent la perspective et revelent l'IA (pas d'ombre de retrait).

**Correction** : Ajouter dans chaque builder dedie ou dans une constante partagee.

### P2 -- MOYENNE : Pas de directive de rendu pour les pieces utilitaires

**Fichiers** : Builders laundry et cellar
**Impact** : "Luxury real estate listing photo" est inapproprie pour une buanderie ou une cave. Mais l'absence de TOUTE directive de rendu laisse le modele sans guide esthetique. Il faut une directive adaptee : "Clean and functional photograph suitable for a real estate listing."

### P2 -- MOYENNE : surfacePrompt "bedroom" dit "Warm-toned flooring suitable for bare feet" sans nommer un materiau

**Fichiers** : Builder passe 1 bedroom (ligne 175/156)
**Impact** : La regle CLAUDE.md est explicite : "TOUJOURS nommer le materiau de sol cible". "Warm-toned flooring suitable for bare feet" est vague -- le modele choisit aleatoirement entre parquet, moquette, liege.

Le StylePicker nomme bien le sol dans chaque surfacePrompt (ex: "light oak wide-plank flooring"). Mais le builder bedroom ECRASE cette information en ajoutant sa propre directive de sol generique en premiere position, avant l'injection du surfacePrompt.

**Correction** : Supprimer "Warm-toned flooring suitable for bare feet." du builder bedroom. Le surfacePrompt du StylePicker contient deja le materiau cible precis.

### P2 -- MOYENNE : Constantes MAX_PASS_RETRIES et RETRY_DELAY_MS declarees APRES leur utilisation

**Fichiers** : `generation-pipeline.ts` lignes 566-582
**Impact** : `generateIterationPass()` (ligne 566) utilise `MAX_PASS_RETRIES` qui n'est declare qu'a la ligne 582. En JavaScript/TypeScript, les `const` ne sont PAS hoisted. Cela ne cause pas d'erreur a l'execution car la fonction n'est appelee qu'apres l'evaluation du module, mais c'est un bug latent de lisibilite et de maintenabilite.

**Correction** : Deplacer les constantes avant `generateIterationPass()`.

### P3 -- BASSE : Commentaires de builder obsoletes

- Kitchen builder passe 2 dit "no depth distribution" en commentaire mais inclut DEPTH_DISTRIBUTION dans le prompt
- Bathroom builder dit "no depth distribution" en commentaire mais n'inclut effectivement pas DEPTH_DISTRIBUTION (correct)
- Bedroom builder dit "no depth distribution, no double-height scaling" mais inclut DEPTH_DISTRIBUTION

Les commentaires ne correspondent plus au code apres v33. Risque de confusion lors des prochaines modifications.

---

## 4. Analyse de la cause racine de la "regression catastrophique"

Les prompts v33 notent 7.9/10 -- ils ne sont pas la cause d'une chute brutale de qualite. Voici mes hypotheses alternatives, par ordre de probabilite :

### Hypothese A : Le chemin queue (cron) ne gere pas le roomType correctement

Dans `generation-pipeline.ts` ligne 670-676, il y a une logique complexe :
```typescript
const hasDedicatedBuilder = roomType && ROOMS_WITH_DEDICATED_BUILDERS.includes(roomType);
trimmedSurface = hasDedicatedBuilder ? surfacePrompt.trim() : effectiveSurfacePrompt;
```

Si le roomType n'est pas correctement transmis depuis la queue (ex: `null` au lieu de `"living_room"`), le builder fallback est utilise au lieu du builder dedie. Cela pourrait produire des resultats generiques au lieu de resultats adaptes a la piece.

**Verification necessaire** : Inspecter les logs de la table `generation_queue` pour verifier si `room_type` est correctement renseigne dans les jobs en queue.

### Hypothese B : Le modele gpt-image-1 a change cote OpenAI

Le commentaire v32 mentionne un revert de gpt-image-1.5 vers gpt-image-1 suite a une "regression spatiale". Si OpenAI a modifie le modele gpt-image-1 sous le capot (ce qui arrive regulierement avec les modeles en production), cela pourrait expliquer une degradation soudaine sans changement de prompts.

**Verification necessaire** : Comparer les timestamps des generations dites "catastrophiques" avec les dates connues de mises a jour OpenAI.

### Hypothese C : Le double retry de passe 2 dans le pipeline cron cree un triple retry

`runGenerationPipeline()` (ligne 706) fait un retry passe 2 (2 tentatives).
Mais `generatePass()` (ligne 599) fait AUSSI un retry interne (2 tentatives via `tryOpenAIResponses`).

Total pour passe 2 via cron : 2 tentatives pipeline x 2 tentatives internes = 4 appels API maximum.
Total pour passe 2 via route directe : 2 tentatives route x 2 tentatives internes = 4 appels API.

Ce n'est pas une cause de regression de qualite, mais c'est un gaspillage de credits API.

### Hypothese D : Timeout budget insuffisant pour le cron

Le pipeline timeout est de 130s. Avec deux passes GPT-image-1 (chacune pouvant prendre 60-90s), on est tres juste. Si passe 1 prend 80s, il reste 50s pour passe 2 -- insuffisant pour retry.

Dans route.ts, il y a une gestion explicite du budget restant (ligne 1104-1122) qui skip passe 2 si < 30s restent. **Cette logique n'existe PAS dans `generation-pipeline.ts`.** Le pipeline cron tente passe 2 meme s'il ne reste que 10s, ce qui provoque un timeout qui est traite comme un echec et declenche un retry du JOB ENTIER.

---

## 5. Plan d'action

| Priorite | Action | Impact attendu | Effort |
|----------|--------|----------------|--------|
| **P0** | Supprimer les builders dupliques de route.ts, importer depuis generation-pipeline.ts | Elimine le risque de divergence future | 30 min |
| **P0** | Ajouter "luxury real estate listing photo" dans tous les builders passe 2 dedies | Rendu immobilier pro pour toutes les pieces | 15 min |
| **P1** | Ajouter "No warm tint or yellow cast" dans tous les builders passe 2 dedies | Anti-derive chromatique | 10 min |
| **P1** | Ajouter "No duplicate items" dans les builders dedies | Anti-duplication mobilier | 10 min |
| **P1** | Ajouter "Furniture must not touch walls" dans les builders dedies | Meilleure perspective/ombres | 10 min |
| **P1** | Ajouter gestion budget temps dans runGenerationPipeline (skip pass2 si < 30s) | Evite les timeouts de job | 20 min |
| **P2** | Supprimer "Warm-toned flooring" du builder bedroom (le style fournit deja le materiau) | Coherence sol bedroom | 5 min |
| **P2** | Ajouter directive rendu adaptee pour laundry/cellar | Rendu fonctionnel credible | 10 min |
| **P3** | Corriger les commentaires obsoletes (DEPTH_DISTRIBUTION dans kitchen/bedroom) | Maintenabilite | 5 min |
| **P3** | Reordonner constantes MAX_PASS_RETRIES dans generation-pipeline.ts | Lisibilite | 5 min |

---

## 6. Recommandation sur la cause de la regression

**Les prompts v33 ne sont PAS la cause d'une regression catastrophique.** A 7.9/10, ils sont dans la continuite de v31/v32.

La regression signale par le fondateur est probablement due a un ou plusieurs de ces facteurs :
1. **Modele OpenAI gpt-image-1 modifie cote serveur** (hypothese la plus probable -- non maitrisable)
2. **Jobs en queue qui ne transmettent pas correctement le roomType** (verifiable dans les logs)
3. **Timeouts pipeline cron provoquant des livraisons de passe 1 seule** (verifiable dans les logs)

**Action immediate recommandee** : Consulter les logs de production (`/api/logs`) pour verifier :
- Combien de generations recentes sont "pass2 failed" ?
- Combien passent par la queue vs le chemin direct ?
- Les roomType sont-ils renseignes dans les jobs queue ?
- Le modele retourne-t-il des erreurs specifiques ?

---

## Handoff

**Destinataire** : @interior-architect (Yann Duval) pour audit croise visuel des generations recentes
**Destinataire** : @fullstack pour correction P0 (deduplication builders) et P1 (directives manquantes)
**Fichiers produits** : `docs/reviews/audit-prompts-v33-lucas.md`
**Prochaine etape** : Recuperer les logs de production pour identifier la cause reelle de la regression (modele, queue, timeout)
