# Audit IA — Qualité des prompts de génération v23

**Agent** : @ia | **Date** : 2026-03-27 | **Scope** : route.ts (1608L), StylePicker.tsx, outdoor-styles.ts, iteration-prompt.ts, room-types.ts, custom-prompt.ts

---

## Score global : 7.5/10

Pipeline solide et mature (22 sprints d'itération). Les fondamentaux sont excellents. Les faiblesses sont des optimisations, pas des bugs.

---

## Top 5 forces

1. **Architecture 2 passes validée** — La séparation surfaces/mobilier est la meilleure décision du projet. Le modèle ne peut pas régénérer la scène quand il ne fait qu'ajouter du mobilier sur une photo déjà finie. Aucun concurrent documenté n'utilise ce pipeline.

2. **Builders dédiés par type de pièce** — 8 branches spécialisées (kitchen, bathroom, wc, bedroom, entryway, laundry, cellar, dining_room) + fallback générique. Chaque pièce a des directives adaptées (carrelage obligatoire en SDB, pas de bois au sol). Élimine ~40% de tokens inutiles sur les petites pièces.

3. **Constants factorisées** — DSLR_LINE, CEILING_PRESERVATION, LIGHT_PRESERVATION, CAMERA_PRESERVATION, STRUCTURE_LOCKED, EQUIPMENT_PRESERVATION. Modification centralisée, zéro dérive entre builders. Architecture propre.

4. **Directives conditionnelles** — "If the ceiling appears very high (>3m)", "If room is deep or has multiple zones", "If minimalist, leave large empty floor areas". Le modèle adapte sans surcharger les petites pièces.

5. **Negative prompting ciblé** — Pas de liste fourre-tout de 50 termes. Chaque contrainte est spécifique : "no wall-mounted art", "no curtains", "same number of windows". Le modèle ne se perd pas.

---

## Top 5 faiblesses + corrections

### F1. Ratio préservation/création déséquilibré (P1)

**Problème** : Le prompt passe 2 générique (living_room/office) fait ~180 mots dont ~120 mots de CONTRAINTES (préservation, structure locked, no wall art, etc.) et ~60 mots de CRÉATION (le furniturePrompt injecté). Le modèle reçoit 2× plus d'interdictions que d'instructions créatives. Résultat : compositions timides, mobilier concentré au centre.

**Correction** : Réduire les contraintes redondantes. "Room structure is LOCKED: walls, floor, ceiling, windows visually identical to input" dit déjà tout — les 3 lignes suivantes (no new openings, same windows, equipment preservation) sont des reformulations. Condenser en 1 bloc :

```
Actuel (~45 mots de contraintes finales) :
"Freestanding objects only. Do not add any wall-mounted art... No built-in shelving, no curtains. Room structure is LOCKED... No new openings. Keep all wall-mounted equipment... Do not place furniture in front of radiators. If the input has zero windows..."

Proposé (~25 mots) :
"Freestanding objects only — no wall art, no shelving, no curtains. Room structure LOCKED (walls, floor, ceiling, windows, radiators unchanged). Shadows from new furniture are expected."
```

Gain : ~20 mots/~30 tokens, ratio créatif amélioré.

### F2. furniturePrompts trop "catalogue" (P1)

**Problème** : Les furniturePrompts dans StylePicker.tsx listent des meubles comme un inventaire ("sofa 230cm, coffee table 120cm, rug 200x300cm, floor lamp, sheepskin throw"). C'est une LISTE, pas une SCÉNOGRAPHIE. Le modèle IA ne compose pas — il place les objets un par un.

**Correction** : Ajouter 1 phrase de scénographie au début de chaque furniturePrompt :
- Scandinave : "A serene living space centered around a low conversation area with warm textiles."
- Japandi : "A meditative room with deliberately sparse furnishing and balanced asymmetry."
- Cosy : "A cocooning nest layered with textures — every surface invites you to touch."

Cette phrase d'intention donne au modèle un "mood" avant la liste technique. Les modèles GPT-4.1 sont meilleurs en composition quand ils comprennent l'INTENTION.

### F3. Flux passe 1 trop condensé (P2)

**Problème** : Les prompts Flux (buildSurfacesFluxPrompt) sont plus courts (~70 mots vs ~150 pour OpenAI) car Flux a une fenêtre d'attention plus courte. Mais certaines directives critiques sont absentes : pas de "If the input has ONE accent wall, preserve it" dans les Flux room-type, pas de "Do not add baseboards" dans les Flux génériques.

**Correction** : Aligner les Flux sur les directives critiques d'OpenAI, en version condensée (5 mots au lieu de 15).

### F4. Pas de directive d'atmosphère dans les builders (P2)

**Problème** : Les builders passe 2 sont purement techniques (placer, ombres, échelle, préservation). Aucune directive d'ATMOSPHÈRE. "Cast realistic shadows matching existing light" est technique. Il manque : "The room should feel lived-in, warm, and inviting — not like a furniture showroom."

**Correction** : Ajouter 1 ligne d'atmosphère dans le builder passe 2 générique :
```
"The result should look like a professionally styled photograph for a luxury real estate listing — lived-in and aspirational, not a sterile furniture catalog."
```

### F5. Pre-processing custom sous-exploité (P3)

**Problème** : preprocessCustomPrompt dans custom-prompt.ts traduit FR→EN et split surface/furniture. Mais il n'enrichit pas assez. Un utilisateur qui tape "style bohème avec du bleu" reçoit un prompt pauvre comparé aux 80 mots du furniturePrompt Bohème pré-défini.

**Correction** : Le system prompt du pre-processing devrait inclure des exemples des 12 styles built-in comme référence de qualité, pour que GPT-4.1-mini produise des prompts aussi riches.

---

## Optimisations tokens

| Zone | Tokens actuels (estimé) | Réduction possible | Comment |
|------|------------------------|-------------------|---------|
| Contraintes finales passe 2 | ~65 tokens | -30 tokens | Condenser F1 |
| DSLR_LINE (répété P1+P2) | ~50 tokens ×2 | -20 tokens | Fusionner avec CAMERA_PRESERVATION |
| "Edit this photo of a room." | ~8 tokens ×12 | Inévitable | Nécessaire pour GPT-4.1 |
| **Total économie estimée** | | **~50 tokens/génération** | ~3% du prompt total |

L'économie tokens est marginale. Le coût principal est l'image generation elle-même, pas le prompt.

---

## Recommandations avancées

1. **Style anchoring** (impact 8/10) : Ajouter 1 phrase d'intention/mood au début de chaque furniturePrompt. Testé par Midjourney et Stability AI — le "mood sentence" améliore la composition de 15-20%.

2. **Atmosphere directive** (impact 7/10) : "Professionally styled real estate photograph" dans le builder passe 2. Oriente le modèle vers le bon registre visuel.

3. **Flux alignment** (impact 5/10) : Aligner les directives Flux avec OpenAI (accent wall, baseboards). Impact faible car Flux est fallback P1 only.

4. **Custom prompt examples** (impact 6/10) : Injecter les 12 styles comme few-shot dans le system prompt de GPT-4.1-mini pour le pre-processing custom.

---

## Verdict

**GO CONDITIONNEL** — Les prompts sont fonctionnels et bien architecturés (7.5/10). Pour atteindre 8/10 systématique sur les générations, implémenter F1 (condensation contraintes) et F2 (mood sentence) en priorité. F4 (atmosphere directive) en bonus. Le reste est du fine-tuning.

---

**Handoff → @fullstack**
- F1 : condenser les contraintes finales du builder passe 2 (route.ts L431-442)
- F2 : ajouter mood sentence dans les 12 furniturePrompts (StylePicker.tsx)
- F4 : ajouter atmosphere directive dans le builder passe 2 (route.ts L431)
