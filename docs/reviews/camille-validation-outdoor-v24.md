# Validation Outdoor v24 — Camille Verdier — 27 mars 2026

Objectif : evaluer les prompts outdoor actuels (8 styles) par rapport aux indoor v24 enrichis avec mood sentences. Identifier le desequilibre qualitatif et proposer des corrections.

## Tableau recapitulatif — 8 styles outdoor

| Style | Surface /10 | Furniture /10 | Vegetaux OK ? | Textiles UV ? | Mood sentence ? | Note globale |
|---|---|---|---|---|---|---|
| Contemporain Outdoor | 8.5 | 8.0 | Oui (Stipa, Calamagrostis) | Oui (Sunbrella-type) | Non | **8.2** |
| Mediterraneen | 8.0 | 8.2 | Oui (olivier, romarin, lavande) | Partiel (linen runner = pas outdoor) | Non | **8.0** |
| Boheme Garden | 7.5 | 7.8 | Oui (Heuchera, Dryopteris, Rudbeckia) | Oui (polypropylene) | Non | **7.6** |
| Provencal | 7.0 | 7.5 | Oui (cypres, lavande) | Partiel (cream cushions "outdoor-rated" OK, polypropylene rug OK) | Non | **7.2** |
| Industriel Urbain | 7.5 | 7.8 | Oui (Stipa, Sedum, Equisetum) | Oui (polypropylene) | Non | **7.6** |
| Minimaliste Urbain | 8.5 | 8.3 | Oui (Stipa gigantea) | Oui (waterproof cushions) | Non | **8.4** |
| Rooftop | 8.5 | 8.5 | Oui (Stipa tenuissima) | Oui (Sunbrella-type) | Non | **8.5** |
| Cosy Balcon | 8.0 | 8.5 | Oui (Trachelospermum, Hedera) | Oui (waterproof) | Non | **8.2** |

**Score global outdoor : 8.0/10** — Techniquement solide. Mais aucune mood sentence.

## Probleme 1 — Desequilibre qualitatif indoor vs outdoor

Les indoor v24 ouvrent chaque furniturePrompt par une phrase d'intention :
- Scandinave : "A serene Nordic living space centered around a low conversation area..."
- Contemporain : "A refined editorial interior with sculptural accents and restrained luxury."
- Cosy : "A cocooning nest where every surface invites you to touch."

Les outdoor commencent tous par une liste seche : "Contemporary outdoor furniture: modular low-profile L-shaped outdoor sofa..."

Le modele GPT-4.1 utilise les premiers tokens du prompt comme ancrage stylistique principal. Sans mood sentence, le mobilier outdoor est place de maniere fonctionnelle mais sans intention paysagere. C'est la difference entre un catalogue et un projet.

## Mood sentences proposees — 8 styles outdoor

| Style | Mood sentence proposee |
|---|---|
| Contemporain Outdoor | "A sleek outdoor living room where clean lines meet open sky — everything is deliberate, nothing is decorative." |
| Mediterraneen | "A sun-warmed courtyard where wrought iron and terracotta age together under olive branches." |
| Boheme Garden | "A free-spirited garden corner where mismatched textures and trailing greenery blur the line between wild and curated." |
| Provencal | "A timeless Provencal terrace bathed in dry heat — stone, iron, and lavender, nothing more." |
| Industriel Urbain | "A reclaimed urban courtyard where raw concrete and galvanized steel frame tough, graphic plantings." |
| Minimaliste Urbain | "A contemplative outdoor platform where negative space is the main material." |
| Rooftop | "A sky-level retreat where the city panorama is the backdrop and the furniture stays low to preserve the view." |
| Cosy Balcon | "A tiny open-air nook that feels like an extension of the living room — intimate, warm, slightly overgrown." |

## Probleme 2 — Mediterraneen : linen runner non outdoor

Le furniturePrompt Mediterraneen contient "linen table runner 40x120cm in natural ecru with fringe edge". Le lin absorbe l'humidite, moisit, et se decolore au soleil en 2 mois. Remplacer par "outdoor-rated woven polypropylene table runner 40x120cm in natural ecru with fringe edge".

## Probleme 3 — Provencal : surfacePrompt mentionne un plafond

Le surfacePrompt Provencal contient "white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs". C'est une directive INTERIEURE copiee-collee. Un espace Provencal exterieur n'a pas de plafond. Remplacer par "open sky preserved as-is" (deja present en fin de prompt, mais la clause plafond doit etre supprimee).

## Probleme 4 — Provencal : fontaine murale = element mural

"wall-mounted stone fountain basin 50cm with copper spout" est un element MURAL. Le builder passe 2 interdit les elements muraux ("Ground surfaces are LOCKED... Guard rails, walls, facades unchanged"). Risque de contradiction. Remplacer par "freestanding stone fountain basin 50cm on low plinth with copper spout (dry in daylight)".

## Probleme 5 — Industriel Urbain : surfacePrompt mentionne un plafond

Meme probleme que Provencal : "exposed ceiling with any visible pipes or beams preserved". Un espace industriel-urbain exterieur (cour d'immeuble, arriere-cour) n'a pas de plafond expose. Supprimer et conserver uniquement "open sky preserved as-is".

## Verdict

Les prompts outdoor sont **techniquement corrects** (vegetaux, textiles, echelle) grace aux Sprints V1/V2. Mais ils accusent un **retard qualitatif de 1 version** par rapport aux indoor v24 :

1. **Mood sentences absentes** — impact direct sur la coherence stylistique des generations. Sprint necessaire : OUI.
2. **2 surfacePrompts avec clause plafond** (Provencal, Industriel Urbain) — copie-colle interieur non nettoyee. Correction P0.
3. **1 textile non outdoor** (Mediterraneen linen runner) — correction P1.
4. **1 element mural contradictoire** (Provencal fontaine) — correction P1.

**Recommandation** : un micro-sprint de 30 minutes suffit. Ajouter les 8 mood sentences en tete des furniturePrompts, supprimer les clauses plafond des 2 surfacePrompts, corriger le linen runner et la fontaine murale. Pas besoin d'un sprint complet — les fondations V2 sont solides.

---

**Handoff -> @ai-image-expert (Lucas Moreau)**
- Fichiers lus : `lib/outdoor-styles.ts`, `app/api/generate/route.ts` (4 builders outdoor), `components/StylePicker.tsx` (indoor v24 pour comparaison)
- Fichier produit : `docs/reviews/camille-validation-outdoor-v24.md`
- Decisions : 8 mood sentences proposees, 5 corrections factuelles identifiees (2 plafonds, 1 textile, 1 fontaine murale, 0 vegetal)
- Action requise : Lucas valide que les mood sentences n'interfereront pas avec les directives de preservation du builder passe 2
