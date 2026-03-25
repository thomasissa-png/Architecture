# Plan d'orchestration — Versiroom F1 Review + F2 Type de piece

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
- Reserves initialement ouvertes :
  - H-01 : Iteration F1 ignore roomType — **RESOLU** (iteration-prompt.ts a desormais des branches par piece : kitchen, bathroom, wc, laundry, cellar, entryway)
  - H-02 : roomType absent des generation_logs — **RESOLU** (colonne room_type dans schema + migration + logGeneration dans route.ts)
  - M-01 : Directive lumiere dans bedroom surfaceOverride — **RESOLU** (Sprint 20 Option B, builders dedies par piece)
  - M-03 : Pre-processing custom ne recoit pas roomType — reste ouvert (impact faible)

---

## F3 — Exterieur

### Phase F3.1 — Audit prompts outdoor (Yann + Lucas en parallele)
- Agents : Yann Duval (interior-architect), Lucas Moreau (ai-image-expert)
- Parallelisation : OUI
- Statut : TERMINE (2026-03-24)
- Livrables attendus : docs/ia/f3-outdoor-prompts.md
- Livrables recus : [docs/ia/f3-outdoor-prompts.md]
- Verdict verification : OK

### Phase F3.2 — Implementation fullstack
- Agents : @fullstack
- Statut : TERMINE (2026-03-24)
- Livrables recus : lib/outdoor-styles.ts, lib/outdoor-subtypes.ts, app/api/generate/route.ts, app/page.tsx, lib/db.ts, lib/iteration-prompt.ts (builders outdoor)
- Reserves F2 H-01, H-02, M-01 resolues dans Sprint 20 Option B (builders modulaires par piece)

### Phase F3.3 — Review croisee F3
- Agents : @reviewer
- Statut : TERMINE (2026-03-24)
- Livrables recus : [docs/reviews/f3-review.md]
- Verdict : VALIDE AVEC RESERVES (M-02 US-F3-04 non implementee, M-03 custom prompt sans isOutdoor)

---

## Sprint 19 — Bug Fixes Production (2026-03-24)

### Diagnostic
3 bugs remontes par l'utilisateur :

**P1a — Images back-office disparaissent** : Malgre la migration vers @replit/object-storage (Sprint 16), les images continuent a disparaitre. L'erreur "fetch failed" lors de l'init du StorageClient indique un probleme d'initialisation du SDK ou de provisioning du bucket.

**P1b — Iterations cassees** : Meme cause racine que P1a. `getPass1Cache()` utilise le StorageClient qui echoue. L'erreur exacte cote client : "Error during client initialization: fetch failed. Votre iteration n'a pas ete consommee."

**P2 — Type de piece avant style** : En mode interieur, RoomTypePicker est APRES StylePicker (page.tsx:726-732). En mode outdoor, le subtype est DANS StylePicker. Demande : uniformiser en mettant type de piece AVANT style pour l'interieur.

### Phase S19.1 — Fix @fullstack
- Agent : @orchestrator (corrections directes — diagnostic clair, pas de delegation necessaire)
- Statut : TERMINE (2026-03-24)
- Diagnostic orchestrateur (2026-03-24) :
  - **Cause racine P1a + P1b** : Le SDK @replit/object-storage communique avec un sidecar local (127.0.0.1:1106). Si le sidecar est indisponible au moment de l'init, le StorageClient passe en etat "error" definitif (ligne 130-136 du SDK). Le singleton `storageClient` dans db.ts (ligne 69-76) ne se reinitialise JAMAIS apres echec. Toutes les operations (saveImage, getImage, savePass1Cache, getPass1Cache) echouent ensuite avec "Error during client initialization: fetch failed".
  - **Solution P1a + P1b** : Ajouter retry/reinit dans getStorage() — si le client est en etat error, creer un nouveau Client. Ajouter aussi un try/catch avec retry autour des operations individuelles (uploadFromBytes, downloadAsBytes).
  - **Cause P2** : Dans page.tsx, RoomTypePicker (ligne 725-733) est APRES StylePicker (ligne 710-723). Il faut inverser : type de piece AVANT style en mode interieur.
- Corrections a effectuer :
  1. Refaire getStorage() avec retry/reinit si client en etat error
  2. Ajouter retry automatique (1 tentative) sur chaque operation storage (upload/download)
  3. Deplacer RoomTypePicker AVANT StylePicker en mode interieur dans page.tsx
- Livrables attendus : lib/db.ts, app/page.tsx modifies
- Criteres d'acceptation :
  - StorageClient se reinitialise apres un echec init
  - Les operations storage font 1 retry automatique
  - Images persistent entre redeploys (via Object Storage fonctionnel)
  - Iteration fonctionne sans erreur init (meme cause racine)
  - Type de piece apparait avant style en mode interieur

---

## Sprint 21 — Audit production + fixes itération (2026-03-24)

### Phase S21.1 — Fix backoffice vide
- Agent : @orchestrator (correction directe)
- Statut : TERMINE (2026-03-24)
- Cause racine : CREATE TABLE IF NOT EXISTS ne vérifie pas les colonnes manquantes → logGeneration() échouait silencieusement → 0 logs → backoffice vide
- Fix : 19 ALTER TABLE idempotents dans ensureTable() (lib/db.ts)
- Commit : 82d1e38

### Phase S21.2 — Audit croisé Yann + Lucas sur générations #29 et #30 (Maximalist)
- Agents : Yann Duval + Lucas Moreau (en parallèle)
- Statut : TERMINE (2026-03-24)
- Résultats :
  - #29 passe 1 : Yann 7.6/10, Lucas 8.1/10 — lustre Murano excellent, élimination chantier parfaite
  - #30 itération "ajoute WC" : Yann 2.8/10, Lucas 3.8/10 — bug BASE STYLE + wall art hallucination
- Recommandations convergentes : itérations toujours exclusives, no wall art explicite, no baseboards, filtre sanitaire

### Phase S21.3 — Implémentation fixes audit
- Agent : @orchestrator (corrections directes)
- Statut : TERMINE (2026-03-24)
- Fixes appliqués :
  - P0 : Itérations TOUJOURS exclusives (suppression BASE STYLE des 4 builders iteration)
  - P0 : "no wall art/paintings/prints/mirrors" dans tous builders passe 2 (regular + iteration, OpenAI + Flux)
  - P1 : "no baseboards unless in input" dans builders passe 1 (generic OpenAI + Flux)
  - P1 : Filtre sanitaire dans pre-processing itération (GPT-4.1-mini)
- Commit : a0ccf01

---

## Feedbacks remontants
| # | Severite | Agent source | Agent cible | Probleme | Statut |
|---|---|---|---|---|---|
| 1 | P0 | utilisateur | @orchestrator | Images Object Storage disparaissent | RESOLU — withStorageRetry + reinit client |
| 2 | P0 | utilisateur | @orchestrator | Iteration "fetch failed" init client | RESOLU — meme fix (cause racine partagee) |
| 3 | P2 | utilisateur | @orchestrator | Type de piece apres style au lieu d'avant | RESOLU — RoomTypePicker avant StylePicker |
| 4 | P0 | utilisateur | @orchestrator | Backoffice vide (aucun log) | RESOLU — 19 ALTER TABLE migrations |
| 5 | P0 | Yann+Lucas | @orchestrator | Iteration injecte BASE STYLE complet | RESOLU — itérations toujours exclusives |
| 6 | P0 | Yann+Lucas | @orchestrator | Wall art hallucination sur styles chargés | RESOLU — negative prompt explicite |

## Decisions d'arbitrage
| # | Sujet | Decision | Justification | Agents impactes |
|---|---|---|---|---|
| 1 | Reserves F2 | Inclure fix H-01, H-02, M-01 dans Phase F3.2 | Corriger avant d'ajouter outdoor pour ne pas accumuler la dette | @fullstack |
| 2 | Object Storage | Si le SDK ne fonctionne pas, migrer vers PostgreSQL bytea ou base64 stocke dans une table dediee | Replit Object Storage est le seul point de defaillance des 2 bugs P0 | @fullstack |
| 3 | Itérations exclusives | Supprimer BASE STYLE des itérations (toujours exclusif) | Les modifications accumulées décrivent tout ce que l'utilisateur veut. Alt écartée : isExclusive conditionnel (trop fragile). | @fullstack, @ia |
