# Plan d'orchestration — VisiRenov F1 Review + F2 Type de piece

## Demande utilisateur
Phase 3 : Review croisee de l'implementation F1 (iteration commentaire). Puis lancement F2 (type de piece) : audit prompts Yann+Lucas, implementation fullstack, review.

## Mode detecte
Projet existant (MVP, 18 sprints d'historique) — Phases ciblees uniquement

## Profil utilisateur
- Niveau technique : Technique (fondateur solo + agents IA)
- Ton de communication : Technique
- Mode d'interaction : Standard (validation entre phases)

## Complexite estimee
Moyenne — 5 agents (reviewer, Yann, Lucas, fullstack, reviewer), 2 features sur 5 phases

---

## F1 — Iteration commentaire

### Phase 1 — Audit prompts iteration (Yann + Lucas en parallele)
- Statut : TERMINE
- Livrables : docs/ia/f1-iteration-prompts-yann.md, docs/ia/f1-iteration-prompts-lucas.md, docs/ia/f1-iteration-prompts.md
- Verdict : OK

### Phase 2 — Implementation fullstack
- Statut : TERMINE
- Livrables : lib/iteration-prompt.ts, lib/custom-prompt.ts (modifie), lib/db.ts (modifie), app/api/generate/route.ts (modifie), components/RefineModal.tsx, components/VersionSelector.tsx, app/page.tsx (modifie)
- Verdict : A verifier par Phase 3

### Phase 3 — Review croisee F1
- Agents : @reviewer
- Statut : TERMINE (2026-03-24)
- Livrables attendus : docs/reviews/f1-review.md
- Livrables recus : [docs/reviews/f1-review.md]
- Verdict verification : APPROUVE avec corrections
- Problemes critiques :
  - H-02 CRITIQUE : double mismatch pass1Key/pass1_key — iteration F1 entierement cassee
  - H-01 HAUTE : double pre-processing commentaire (client + serveur)
  - M-03 MOYENNE : iterationsRemaining global au lieu de par photo

---

## F2 — Type de piece

### Phase F2.1 — Audit prompts par type de piece (Yann + Lucas en parallele)
- Agents : Yann Duval (interior-architect), Lucas Moreau (ai-image-expert)
- Parallelisation : OUI
- Statut : TERMINE (2026-03-24)
- Livrables attendus : docs/ia/f2-room-type-prompts.md
- Livrables recus : [docs/ia/f2-room-type-prompts.md]
- Verdict verification : OK
- Decisions cles :
  - roomFurnitureOverride REMPLACE le furniturePrompt du style (sauf Salon)
  - Exception built-in pour Kitchen et Bathroom dans le builder passe 2
  - Auto-detection optionnelle via GPT-4.1-mini vision
  - roomType stocke dans Pass1Meta pour coherence F1 iterations

### Phase F2.2 — Implementation fullstack
- Agents : @fullstack
- Statut : TERMINE (2026-03-24)
- Livrables attendus : lib/room-types.ts (nouveau), components/RoomTypePicker.tsx (nouveau), app/page.tsx (modifie), app/api/generate/route.ts (modifie), lib/db.ts (modifie)
- Livrables recus : [lib/room-types.ts, components/RoomTypePicker.tsx, app/page.tsx, app/api/generate/route.ts, lib/db.ts]
- Verdict verification : OK
- Corrections bonus F1 incluses :
  - H-02 FIX : pass1Key/pass1_key mismatch (page.tsx l.255, l.395)
  - H-01 FIX : suppression double pre-processing commentaire (page.tsx handleRefine)

### Phase F2.3 — Review croisee F2
- Agents : @reviewer
- Statut : TERMINE (2026-03-24)
- Livrables attendus : docs/reviews/f2-review.md
- Livrables recus : [docs/reviews/f2-review.md]
- Verdict verification : VALIDE AVEC RESERVES
- Reserves ouvertes :
  - H-01 : Iteration F1 ignore roomType (freestanding-only hardcode dans iteration-prompt.ts)
  - H-02 : roomType absent des generation_logs
  - M-01 : Directive lumiere dans bedroom surfaceOverride
  - M-03 : Pre-processing custom ne recoit pas roomType

---

## F3 — Exterieur

### Phase F3.1 — Audit prompts outdoor (Yann + Lucas en parallele)
- Agents : Yann Duval (interior-architect), Lucas Moreau (ai-image-expert)
- Parallelisation : OUI
- Statut : EN COURS
- Livrables attendus : docs/ia/f3-outdoor-prompts.md
- Livrables recus : []
- Verdict verification : []

### Phase F3.2 — Implementation fullstack
- Agents : @fullstack
- Statut : En attente (depend Phase F3.1)
- Livrables attendus :
  - lib/outdoor-styles.ts (nouveau — 6 styles outdoor)
  - lib/outdoor-types.ts (nouveau — 5 sous-types)
  - components/StylePicker.tsx ou OutdoorStylePicker.tsx (toggle indoor/outdoor + styles outdoor)
  - components/RoomTypePicker.tsx (masque en mode outdoor)
  - app/api/generate/route.ts (builders outdoor dedies)
  - app/page.tsx (integration mode exterieur)
  - lib/custom-prompt.ts (isOutdoor dans pre-processing)
  - lib/db.ts (is_outdoor + outdoor_subtype dans logs)
  - + Fix reserves F2 : H-01, H-02, M-01

### Phase F3.3 — Review croisee F3
- Agents : @reviewer
- Statut : En attente (depend Phase F3.2)
- Livrables attendus : docs/reviews/f3-review.md

---

## Sprint 19 — Bug Fixes Production (2026-03-24)

### Diagnostic
3 bugs remontes par l'utilisateur :

**P1a — Images back-office disparaissent** : Malgre la migration vers @replit/object-storage (Sprint 16), les images continuent a disparaitre. L'erreur "fetch failed" lors de l'init du StorageClient indique un probleme d'initialisation du SDK ou de provisioning du bucket.

**P1b — Iterations cassees** : Meme cause racine que P1a. `getPass1Cache()` utilise le StorageClient qui echoue. L'erreur exacte cote client : "Error during client initialization: fetch failed. Votre iteration n'a pas ete consommee."

**P2 — Type de piece avant style** : En mode interieur, RoomTypePicker est APRES StylePicker (page.tsx:726-732). En mode outdoor, le subtype est DANS StylePicker. Demande : uniformiser en mettant type de piece AVANT style pour l'interieur.

### Phase S19.1 — Fix @fullstack
- Agent : @fullstack
- Statut : EN COURS
- Corrections a effectuer :
  1. Diagnostiquer et fixer le StorageClient (ou implementer alternative robuste)
  2. Fixer le flux d'iteration (meme cause racine)
  3. Deplacer RoomTypePicker AVANT StylePicker en mode interieur
- Livrables attendus : lib/db.ts, app/page.tsx modifies
- Criteres d'acceptation :
  - Images persistent entre redeploys
  - Iteration fonctionne sans erreur init
  - Type de piece apparait avant style en mode interieur

---

## Feedbacks remontants
| # | Severite | Agent source | Agent cible | Probleme | Statut |
|---|---|---|---|---|---|
| 1 | P0 | utilisateur | @fullstack | Images Object Storage disparaissent | EN COURS |
| 2 | P0 | utilisateur | @fullstack | Iteration "fetch failed" init client | EN COURS |
| 3 | P2 | utilisateur | @fullstack | Type de piece apres style au lieu d'avant | EN COURS |

## Decisions d'arbitrage
| # | Sujet | Decision | Justification | Agents impactes |
|---|---|---|---|---|
| 1 | Reserves F2 | Inclure fix H-01, H-02, M-01 dans Phase F3.2 | Corriger avant d'ajouter outdoor pour ne pas accumuler la dette | @fullstack |
| 2 | Object Storage | Si le SDK ne fonctionne pas, migrer vers PostgreSQL bytea ou base64 stocke dans une table dediee | Replit Object Storage est le seul point de defaillance des 2 bugs P0 | @fullstack |
