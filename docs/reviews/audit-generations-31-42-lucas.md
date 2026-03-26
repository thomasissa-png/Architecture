# Audit Generations #31-42 — Agent Expert IA Image (Lucas Moreau)

**Date** : 2026-03-26
**Auditeur** : Lucas Moreau — Expert IA Image
**Scope** : Generations #31 a #42 (12 generations)
**Methode** : Audit sur prompts construits uniquement — les images de production sont inaccessibles (404, filesystem ephemere Replit). Les notes refletent la qualite du prompt engineering, pas le rendu visuel final.

---

## Tableau recapitulatif

| # | Style | Version | Modele P1→P2 | Duree P2 | Note prompt /10 | Commentaire cle |
|---|-------|---------|--------------|----------|-----------------|-----------------|
| 31 | Scandinavian | null | GPT-4.1→GPT-4.1 | 67s | 7.8 | Bon pipeline 2 passes, builders pre-v22 |
| 32 | Japandi | null | GPT-4.1→GPT-4.1 | 70s | 7.8 | Idem, coherent avec #31 |
| 33 | Japandi iteration | null | GPT-4.1 | 72s | 4.5 | BUG : "etageres murales" sabotees par negative prompting |
| 34 | Outdoor contemporary | v21 | GPT-4.1 | - | 8.0 | Prompt outdoor bien structure, redondance mineure |
| 35 | Outdoor iteration | v21 | GPT-4.1 | 40s | 7.5 | Iteration outdoor correcte |
| 36 | Scandinavian | v22 | GPT-4.1 | - (P1) | 8.5 | Builders v22 : descripteurs photo complets, preservation solide |
| 37 | Cosy entryway | v22 | GPT-4.1→GPT-4.1 | 74s | 8.2 | Override entree bon calibrage, risque ecrasement surfacePrompt |
| 38 | Cosy bedroom | v22 | GPT-4.1→GPT-4.1 | 43s | 8.6 | Descripteur sensoriel "bare feet" excellent, prompt concis |
| 39 | Scandinavian | v22 | GPT-4.1 | - (P1) | 8.5 | Identique #36, builders stables |
| 40 | Contemporary | v22 | GPT-4.1 | - (P1) | 8.4 | P1 seul, preservation structurelle solide |
| 41 | Contemporary dining | v22 | GPT-4.1→Flux | 130s | 7.6 | Fallback Flux 2x plus lent, perte potentielle de fidelite |
| 42 | Contemporary entryway | v22 | GPT-4.1→Flux | 130s | 7.4 | Idem + override entree ecrase surfacePrompt du style |

**Moyenne** : 7.7/10 (+1.9 pts vs anciens builders pre-Sprint 17)

---

## Analyse technique par generation

**#31-32 (null, GPT-4.1→GPT-4.1)** — Builders pre-v22. Pipeline 2 passes fonctionnel, descripteurs photo presents mais incomplets (pas de grain ISO, pas de vignettage). Preservation structurelle basique. Solide sans etre excellent.

**#33 (iteration, null)** — DEFAUT CRITIQUE. L'utilisateur demande "etageres sur le mur" mais le builder injecte "Do NOT attach anything to walls / freestanding objects only". Le prompt contredit la demande utilisateur. Le pipeline d'iteration n'a aucun mecanisme pour deroger aux regles du builder quand la demande explicite le justifie. Note : 4.5/10.

**#34-35 (outdoor v21)** — Prompts outdoor bien concus : preservation drains/regards/plaques, vegetation existante, blocs de verre. Redondance "no ceiling, sky preserved" inutile pour un espace ouvert — gaspillage de tokens. Iteration #35 coherente.

**#36, 39, 40 (v22, P1 only)** — Les builders v22 sont un saut qualitatif : DSLR full-frame 16-35mm f/8, deep DOF sharp focus, grain ISO 200, vignettage naturel, preservation geometrie plafond voutes/poutres, ancrage temperature couleur murs. Excellent prompt engineering photographique.

**#37 (cosy entryway, v22)** — L'override entree "ceramic tiles, natural stone, hard-wearing wood" ECRASE le surfacePrompt Cosy (light oak). Contradiction : le style prescrit un materiau, l'override en impose un autre. Le modele recoit deux instructions de sol concurrentes. Le calibrage spatial "do not overcrowd" est pertinent.

**#38 (cosy bedroom, v22)** — Meilleur prompt du lot. "Warm-toned flooring suitable for bare feet" est un descripteur sensoriel qui guide sans dicter — le modele choisit le materiau adapte au style. A generaliser comme pattern pour les overrides piece.

**#41-42 (contemporary, GPT-4.1→Flux)** — Fallback Flux Depth Pro declenche en passe 2. Duree 130s vs ~70s GPT-4.1 = quasi 2x. Le prompt Flux est correctement condense mais la profondeur-map peut perdre des details fins (ombres portees, reflets). #42 cumule le probleme de l'override entree (cf. #37).

---

## Patterns identifies

| Pattern | Impact | Frequence |
|---------|--------|-----------|
| Builders v22 = saut qualitatif (descripteurs photo, preservation structurelle) | ++ | 7/12 generations |
| Override room-type ecrase surfacePrompt du style (entree, chambre) | -- | 3/12 generations |
| Iteration user sabotee par negative prompting rigide | --- | 1/12 mais bloquant |
| Fallback Flux 2x plus lent, declenche sur 2 generations consecutives | - | 2/12 generations |
| Descripteur sensoriel > materiau impose (pattern #38) | ++ | 1/12 (a generaliser) |

---

## Plan d'action

### P0 — Critique (iteration sabotee)
- **Fix pipeline iteration** : quand l'utilisateur demande explicitement un element mural (etageres, miroir, tableau), le builder d'iteration DOIT deroger a la regle "freestanding only". Implementer une whitelist contextuelle : si le prompt utilisateur contient "etagere/shelf/mirror/frame/wall art", supprimer la clause "Do NOT attach anything to walls" pour cette generation uniquement.
- **Owner** : @fullstack — modifier le builder d'iteration dans route.ts

### P1 — Haute (overrides room-type)
- **Harmoniser overrides room-type avec surfacePrompt du style** : l'override ne doit PAS dicter un materiau ("ceramic tiles") mais une CONTRAINTE fonctionnelle ("durable floor suitable for entrance"). Le surfacePrompt du style choisit le materiau, l'override filtre par contrainte. Pattern #38 "bare feet" = reference.
- **Owner** : @fullstack — modifier les overrides entryway/bedroom dans route.ts

### P2 — Moyenne (Flux fallback)
- **Monitorer frequence fallback Flux** : si >20% des P2 tombent sur Flux, investiguer pourquoi GPT-4.1 echoue (rate limit ? timeout ? contenu flag ?). Logger le motif d'echec GPT-4.1 avant fallback.
- **Owner** : @fullstack — ajouter error_reason dans les logs DB

### P3 — Basse (optimisations prompt)
- **Supprimer redondance outdoor** : retirer "no ceiling" des prompts outdoor (implicite).
- **Generaliser descripteurs sensoriels** : remplacer les materiaux imposes dans les overrides par des descripteurs type "warm underfoot / easy to clean / hard-wearing".

### P4 — Tracking
- **Validation visuelle requise** : cet audit est sur prompts uniquement. Les notes sont des estimations de qualite prompt. Une validation sur images reelles est necessaire pour confirmer les scores, en particulier pour les generations Flux (#41, #42).

---

## Handoff

- **Destinataire** : @fullstack pour P0 (fix iteration) et P1 (overrides room-type)
- **Livrables amont** : cet audit (`docs/reviews/audit-generations-31-42-lucas.md`)
- **Blocage** : le P0 est bloquant pour le mode iteration — tout utilisateur demandant un element mural verra sa demande ignoree
- **Prochaine etape** : re-auditer apres fix P0/P1 sur 3-4 generations avec images accessibles
