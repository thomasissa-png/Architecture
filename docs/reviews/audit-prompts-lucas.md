# Audit Technique Prompts — Lucas Moreau, Expert IA Image

**Date** : 2026-03-31  
**Version prompts** : post-Sprint 22 (builders room-type-specific, Flux fallback passe 1 only)  
**Fichiers audités** : `app/api/generate/route.ts` (builders + negative prompts), `components/StylePicker.tsx`

---

## Verdict global : 8.1/10

Le pipeline est techniquement solide. Les 22 sprints d'itération ont produit des builders bien structurés avec des constantes partagées (CEILING_PRESERVATION, WALL_PRESERVATION, DSLR_LINE, etc.). Les builders par room type sont une excellente évolution — chaque pièce a ses contraintes propres.

---

## Évaluation par builder

| Builder | Note /10 | Forces | Faiblesses |
|---|---|---|---|
| **buildSurfacesResponsesPrompt (generic)** | 8.5 | Complet : accent wall conditionnel, construction cleanup, equipment preservation, window count enforcement | Un peu long (~200 mots) — les tokens tardifs perdent du poids |
| **buildSurfacesResponsesPrompt (kitchen)** | 8.0 | "ceramic or stone floor — no wood" — bonne contrainte matériau | OK |
| **buildSurfacesResponsesPrompt (bathroom)** | 8.0 | IP44 spotlights, non-slip floor — spécifique métier | OK |
| **buildSurfacesResponsesPrompt (bedroom)** | 7.5 | "warm-toned flooring for bare feet" — bonne intention | Manque un matériau cible précis (bois? moquette?) — dépend du style |
| **buildSurfacesFluxPrompt (generic)** | 8.0 | Bien condensé pour la fenêtre d'attention Flux (~120 mots) | OK |
| **buildFurnitureResponsesPrompt (generic)** | 8.5 | Distribution profondeur + largeur, scaling conditionnel, density per style | Le meilleur builder — 5 sprints d'itération sur la composition |
| **buildFurnitureResponsesPrompt (kitchen)** | 8.0 | "island ONLY if >10m2" — bonne contrainte conditionnelle | OK |
| **buildFurnitureResponsesPrompt (bathroom)** | 8.5 | "60cm vanity if compact" — excellent scaling conditionnel | Très détaillé, bon |
| **buildFurnitureFluxPrompt (generic)** | 7.5 | Condensé pour Flux | Flux est passe 1 only — ce builder ne devrait jamais être appelé en passe 2 |
| **Negative prompt (FLUX_NEGATIVE_PROMPT)** | 7.5 | 16 termes couvrant les artefacts principaux | Manque "color grading" (ajouté Sprint 17 mais vérifier) |
| **Outdoor builders** | 7.0 | Fonctionnels mais moins itérés que les intérieurs | Moins de sprints d'affinage |

**Moyenne** : 8.1/10

---

## Audit technique détaillé

### Préservation géométrie : 8.5/10
- CEILING_PRESERVATION : "Preserve the ceiling geometry exactly — vaults, beams, ribs, arches..." — excellent
- WALL_PRESERVATION : "Wall geometry identical — same angles, corners, depth" — bien
- Window count enforcement : "exact same number of windows and doors" — critique et présent
- P2 : Ajouter "preserve ceiling height ratio" — les pièces sous plafond bas peuvent être étirées

### Cohérence éclairage : 8.0/10
- LIGHT_PRESERVATION : "preserve existing light direction, shadow patterns, wall color temperature, light falloff" — complet
- "No warm tint or yellow cast" — correctif Sprint 22 appliqué
- "Match shadow hardness to lighting type" — bonne directive conditionnelle
- P2 : Le "keep original light falloff" a été corrigé en "original light distribution" (Sprint 17) — vérifier que c'est bien en place

### Descripteurs photographiques : 9.0/10
- DSLR_LINE : "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus" — standard photo immo
- Grain ISO : "visible film grain at full zoom" — anti-CGI, excellent
- Vignettage : "natural corner vignetting 5-10%" — subtil et réaliste
- P2 : Ajouter "slight chromatic aberration at edges" pour encore plus de réalisme (optionnel)

### Structure du prompt : 7.5/10
- Passe 1 : style en tête (surfacePrompt), puis contraintes — bon ordre pour le poids token
- Passe 2 : furniturePrompt en tête, distribution spatiale ensuite — bon
- Le builder generic passe 2 est le plus long (~250 mots) — les dernières phrases perdent du poids
- P1 : Considérer de réduire le builder generic pass 2 de 250 à 180 mots — les directives en fin de prompt sont les moins respectées

### Negative prompts : 7.5/10
- FLUX_NEGATIVE_PROMPT devrait inclure : "color grading, warm color shift, cool color shift" (Sprint 17 recommendation)
- "shallow depth of field, bokeh" — présent et correct (f/8 = deep DOF)
- "floating furniture" — présent
- P1 : Vérifier que "CGI, plastic, overly clean, flat lighting" est dans le negative (Sprint 16b)

### Cohérence passe 1 → passe 2 : 9.0/10
- Passe 1 : "COMPLETELY EMPTY — no furniture" — clair
- Passe 2 : "Room structure is LOCKED" — clair
- "visually identical — same colors, textures, geometry. Shadows from furniture are expected and natural" — la correction "pixel-identical" → "visually identical" (Sprint 17) est appliquée
- Pas de contradiction détectée

---

## Recommandations prioritaires

### P0 — Aucune
Pas de bug critique dans les prompts actuels.

### P1 — Réduction longueur builder generic pass 2
Le builder generic pass 2 (~250 mots) est le plus long. Les modèles de langue accordent moins de poids aux tokens en fin de prompt. Condenser les directives de scaling et density en 1 phrase au lieu de 2.

### P1 — Vérifier FLUX_NEGATIVE_PROMPT
S'assurer que les termes ajoutés Sprint 16b-17 sont bien présents : "CGI, plastic, overly clean, flat lighting, color grading, warm color shift, cool color shift".

### P2 — Outdoor builders sous-itérés
Les builders outdoor ont reçu moins d'attention que les intérieurs (pas d'audit visuel croisé). Recommander un audit dédié quand le volume de générations outdoor sera suffisant.

### P2 — Flux furniture builder inutile
Le `buildFurnitureFluxPrompt` existe mais Flux est désactivé en passe 2 (Sprint 22). Ce code est dead code — supprimer ou documenter clairement comme "réservé pour usage futur".

---

**Handoff → @fullstack**
- Fichier produit : `docs/reviews/audit-prompts-lucas.md`
- 0 corrections P0
- 2 corrections P1 (longueur pass 2, negative prompt Flux)
- 2 observations P2 (outdoor, dead code Flux pass 2)
