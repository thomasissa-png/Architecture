# Audit Prompts Outdoor Condenses — Camille Verdier — 4 avril 2026

Contexte : les builders outdoor de `generation-pipeline.ts` et `iteration-prompt.ts` ont ete condenses (~200 mots) pour le safety filter gpt-image-1.5. Evaluation de la robustesse post-condensation.

## Note globale : 7.5 / 10

Les directives fondamentales sont preservees. Les risques de regression sont contenus mais reels sur 3 points.

## Analyse des 4 axes

**1. Directives outdoor essentielles — 8/10.** "Open-air space — no ceiling, sky preserved as-is" est present en passe 1. La passe 2 dit "sky" dans la preservation mais ne repete PAS "no ceiling" explicitement — risque de plafond hallucine si le modele interprete une pergola existante comme un toit. La vegetation existante est mentionnee en passe 1 ("Preserve existing vegetation in the background") et en iteration ("Keep existing vegetation and background plants"). Correct.

**2. Materiaux outdoor — 7/10.** La passe 2 dit "outdoor-rated weather-resistant" pour les textiles — bon, mais ne nomme pas Sunbrella ni polypropylene. Les stylePrompts dans `outdoor-styles.ts` compensent (Sunbrella, polypropylene) donc acceptable. Le sol est delegue au surfacePrompt injecte — correct.

**3. Distribution en profondeur — 7/10.** Passe 2 : "Distribute furniture naturally across the available floor space. If space is large, create a primary seating group and a secondary accent further back." Suffisant pour les terrasses. Manque la distribution LATERALE (presente dans les builders indoor Sprint 14, absente ici).

**4. Risque de regression — 7/10.** Pas de mention "no indoor plants" ni "no monstera/pothos" dans les builders. La protection repose entierement sur les stylePrompts (qui nomment des especes outdoor). Un prompt custom outdoor pourrait generer du monstera. Le builder adjust outdoor (`buildAdjustOutdoorResponsesPrompt`) est le plus court (7 phrases) — aucune mention de vegetation, aucun "open-air", juste "outdoor photo". Risque si l'utilisateur demande "ajouter des plantes".

## Top 3 corrections (P0-P1)

**P0 — Ajouter "no ceiling" en passe 2.** Ligne 445 de `generation-pipeline.ts` : la preservation liste "guard rails, walls, facades, sky" mais omet "no ceiling, no roof". Ajouter dans la premiere phrase : "Open-air space — no ceiling." Un seul token, zero risque de depasser le filtre.

**P1 — Ajouter "outdoor plants only, no houseplants" dans le builder passe 2.** Ligne 451 apres "Scale plants to space" : ajouter "Use only outdoor species — no houseplants (no monstera, no pothos, no fiddle-leaf fig)." Protection contre les prompts custom et les hallucinations IA.

**P1 — Ajouter distribution laterale en passe 2.** Apres la directive de profondeur (ligne 448), ajouter : "If the space is also wide, add a lateral accent (planter, side table, floor lantern)." Aligne le builder outdoor sur le builder indoor (Sprint 14 #96).

## Handoff

Destinataire : @fullstack pour implementation des 3 corrections dans `generation-pipeline.ts`. Verifier aussi `iteration-prompt.ts` lignes 68-74 (iteration outdoor) qui manque "no ceiling" et "outdoor plants only".
