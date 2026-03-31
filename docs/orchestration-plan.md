# Plan d'orchestration — Versimo

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

---

## Session 2026-03-25 — Audits site + Implementation + Auth/Stripe + Naming

### Phase A — Audits complets du site (6 agents en parallele)
- Statut : TERMINE
- Agents : @ux (7.5/10), @design (7.4/10), @seo (38/100), @copywriter, @infrastructure (5.3/10), @legal
- Synthese : docs/reviews/site-audit-synthesis.md — GO AVEC RESERVES, 7 bloqueurs

### Phase B — Implementation tous les retours audits
- Statut : TERMINE
- Legal : 3 pages legales, footer liens, disclaimer IA, prix TTC
- SEO : sitemap, robots, JSON-LD, metadata, H1/H2
- Design : tokens CSS, pastilles couleur, shadow-sm, WCAG
- UX : revelation progressive, bouton Annuler, espaces reduits
- Copy : hero brand-voice, CTAs, accents corriges
- Infra : health check, timeout API, .env.local.example complet

### Phase C — Iteration 9/10 (re-audits + corrections)
- Statut : TERMINE
- UX : 7.5→8.2→~9/10
- Design : 7.4→7.75→~9/10
- SEO : 38→61→~76/100
- Copy : →7.5→~9/10
- Infra : 5.3→5.6→~6.3/10

### Phase D — Naming + Rename
- Statut : TERMINE
- Decision fondateur : Versimo (filiation Versi Immobilier)
- 46 fichiers renommes VisiRenov→Versimo
- Footer : "Un produit Versi Immobilier"

### Phase E — Auth + Stripe + Credits
- Statut : TERMINE (code pret, cles non configurees)
- NextAuth Google + Stripe one-time payments + systeme credits DB
- Reviewer : 4.5→6.5→7.5/10 (corrections critiques appliquees)

### Phase F — Monitoring + Demo + UX polish
- Statut : TERMINE
- Sentry installe (conditionnel sur DSN)
- CI/CD GitHub Actions
- Watermark IA EU AI Act
- Demo API auto-populee depuis DB
- Espaces vides corriges (9 points)
- Comparateur mobile ameliore (icone horizontale + hint)

---

## Session 2026-03-25b — F4 Mode Marchand + E2E Tests + Header Mobile

### Phase G — F4 Mode Marchand + Tests E2E + Header mobile (3 agents en parallele)
- Statut : TERMINE
- @fullstack : F4 Mode Marchand complet (10 fichiers crees/modifies, batch generation, PDF, page partageable)
- @qa : 28 tests E2E Playwright (6 fichiers), CI pipeline avec job e2e
- @ux : Header mobile fix (Tarifs masque, CTA raccourci, gap/padding reduits)
- Commits : 8973a20 (F4), b1924ac (QA)

### Phase H — Review croisee F4
- Statut : TERMINE
- @reviewer : NO-GO initial (3 bloquants). C-01 securite header, C-02 Pro access, H-02 dimensions portrait → tous corriges.
- 5 iterations d'audit (Thomas 6.1→9.0, Design 6.9→9.1, Copy 6.2→9.0)

### Phase I — F4 enrichi (profil marchand + enrichissement + PDF brande)
- Statut : TERMINE
- F4.A Profil Marchand : SIRET Pappers/INSEE, logo, couleurs, police
- F4.B Enrichissement adresse : API Adresse gouv, DVF, carte OSM, description GPT-4.1-mini
- F4.C PDF brande : logo Thomas, couleurs custom, carte quartier, coordonnees

### Phase J — Refonte architecture Bien/Dossier/Photos
- Statut : TERMINE
- Tables user_photos + properties
- Pages /ma-galerie, /mes-biens, /mes-biens/[id]
- PhotoAssociator post-generation
- Dossier depuis selection de photos du bien

### Phase K — Audit responsive PC+Mobile
- Statut : TERMINE
- @reviewer : PC 8.5, Mobile 7.5 → 12 corrections appliquees
- Nav mobile dans dropdown AuthButton, flex-wrap boutons, min-h-[44px], data-testid

### Scores finaux F4
- Thomas : 9.0/10 (V1 6.1 → V5 9.0, +2.9 pts en 5 iterations)
- Design : 9.1/10 (V1 6.9 → V4 9.1, +2.2 pts en 4 iterations)
- Copy : 9.0/10 (V1 6.2 → V5 9.0, +2.8 pts en 5 iterations)

### Phases NON commencees
- F5 Mode Decorateur (LATER)
- Domaine propre versimo.fr (action fondateur)
- Configuration lancement (cles API Stripe/NextAuth/Sentry)

---

## Session 2026-03-26 — Sprint massif (lint, auth, F6, audits, agents)

### Phase S26.1 — Stabilisation build + auth
- Statut : TERMINE
- Livrables : 6 lint fixes, AuthModal email/password+Google, CredentialsProvider, API register, middleware auth serveur
- Score : build OK, auth fonctionnel

### Phase S26.2 — F6 Annonce publique
- Statut : TERMINE (4 iterations Marc V1→V4)
- Livrables : lib/annonce.ts, API annonce, page SSR, ContactSticky, Lightbox, RoomNav, ShareButtons, AnnonceGallery
- Scores Marc : Annonce 6.9→9.2, Dossier 6.4→9.0, PRO/COHERENT/APPELER 9.5/10

### Phase S26.3 — Fiche bien enrichie
- Statut : TERMINE
- Livrables : 11 champs (DPE, etage, parking...), API PATCH, affichage annonce+dossier, DossierCaracteristiques

### Phase S26.4 — Audits frontend complets (3 axes)
- Statut : TERMINE (2 passes audit + corrections)
- Technique : 6.3→7.75→~9.0 (middleware, catch, focus traps, a11y)
- Design : ~7→8.2→~9.0 (tokens, focus-visible, CTA coherents)
- UX : 6.9→8.3→~9.0 (skeleton, etats vides, navigation)

### Phase S26.5 — Prompt versioning + pipeline iteration
- Statut : TERMINE
- Livrables : PROMPT_VERSION v18→v21, classification adjust/restyle, saveIterationBase, read-after-write saveImage
- Score reviewer versioning : 9/10

### Phase S26.6 — Agents crees
- Statut : TERMINE
- @client-mandataire (Marc Leroy, acheteur) — persona enrichi avec processus decision 30s + 3 questions fondamentales
- @paysagiste (Camille Verdier, espaces exterieurs) — grille 10 criteres, audit outdoor 6.1→8.2

### Phase S26.7 — Suppression Studio + multi-photo
- Statut : TERMINE
- Pack Studio supprime (4→3 tiers)
- Step annotate dans MerchantMode (dropdown piece+style par photo)

### Phase S26.8 — Fix image display
- Statut : TERMINE
- Cause racine : Object Storage consistance eventuelle (ok:true mais blob pas lisible)
- Fix : read-after-write, retry getImage, iteration save await 5s

### Travaux EN COURS (non termines)
- InlineGenerator (generation depuis fiche bien sans quitter la page) — specs PM pretes, implementation @fullstack a lancer
- 2 styles outdoor manquants (Provencal, Industriel-Urbain) — signales par Camille
- CTA "Essayer gratuitement" conditionnel quand connecte — corrige mais a verifier en prod
- Bien disparu apres mise a jour — cause racine corrigee (ensure cross-tables) mais a verifier en prod
- API admin update-user — creee mais non testee en prod

---

## Session 2026-03-26b — Gradient Agents update + 5 bug fixes production

### Phase S26b.0 — Mise a jour Gradient Agents
- Statut : TERMINE
- Source : github.com/thomasissa-png/Agent-Team branch claude/setup-project-context-ALWvD
- Agents generiques ecrases dans .claude/agents/ (20 fichiers)
- Agents custom preserves : client-mandataire.md, paysagiste.md
- CLAUDE.md : bloc GRADIENT-AGENTS fusionne (nouvelles regles n°4 delegation + n°5 mindset IA)

### Phase S26b.1 — Fix 5 bugs production + hero photos
- Agents : @fullstack
- Statut : TERMINE
- Bugs corriges :
  1. **Modal auth coupee** — CORRIGE : flex-1 min-h-0 scroll interne, bouton fermer absolute
  2. **Carte ne charge pas** — CORRIGE : iframe OSM cote client (staticmap.openstreetmap.de down)
  3. **"Aucune photo" associer** — DEJA CORRIGE (filtre output_image_key NOT NULL en place)
  4. **Dossier redirige homepage** — DEJA CORRIGE (hasProAccess verifie role pro/admin)
  5. **Hero photos fixes** — CORRIGE : param ?fixed=true, pinnees sur scandinavian 25/03/2026
- Note : DVF (api.cquest.org) aussi down mais degrade gracieusement (null)

### Phase S26b.2 — Carte OSM iframe (APIs externes down)
- Statut : TERMINE
- staticmap.openstreetmap.de timeout + api.cquest.org DVF 502
- Fix : iframe OSM embed dans MerchantMode + dossier public (zero dependance serveur)
- DVF : pas d'alternative fonctionnelle, degrade gracieusement

### Phase S26b.3 — 2 styles outdoor + PROMPT_VERSION v22
- Agents : @fullstack
- Statut : TERMINE
- Provencal : limestone, wrought iron, cypress, lavender, terracotta
- Industriel-Urbain : raw concrete, galvanized steel, Stipa, Sedum, corten
- Corrections Camille F1/F2 deja appliquees (Nephrolepis → Dryopteris, coton → polypropylene)

### Phase S26b.4 — InlineGenerator (generation depuis fiche bien)
- Statut : TERMINE

---

## Session 2026-03-26c — QA + SEO/GEO + Marchand polish + 10/10

### Phases TERMINEES
- **QA audit complet** : 8.4→9.2/10 (0 P0, 13 P2 corriges)
- **SEO strategy** : 76/100, keyword map, cocon semantique 4 niveaux
- **GEO strategy** : cite par 0 LLM, plan Product Hunt + presse
- **Growth content** : 48 articles/6 mois, 48 posts social/mois, pipeline auto
- **3 landing pages personas** SSG : /marchand, /architecte, /particulier
- **Page /comparatif** SEO+GEO : tableau factuel 4 concurrents
- **Blog infra** : /blog, /blog/[slug], lib/blog.ts, API generate, 3 articles seed
- **ProGate** /mes-biens + /mes-dossiers : 9.2/10 design
- **StorageImage** composant : retry + fallback, deploye sur 5 fichiers
- **Migration user_id transactionnelle** : photos+properties+dossiers+purchases+merchant
- **saveUserPhoto AVANT response** : fix Replit autoscale (cause racine gallery vide)
- **PDF WinAnsi sanitizer** : sanitizeForPdf() sur tous drawText
- **~100 accents corriges** (27 fichiers)
- **Room labels FR** : translateRoomLabel() partout
- **Titre Format A** : T3 60 m² — Quartier, Ville
- **Description enrichie** : benchmark SeLoger/Sotheby's, 200-350 mots, 4 sections
- **Analyse marche** : section prix/m² bien vs quartier sur dossier
- **Paragraphes aeres** : split \n\n sur annonce + dossier
- **Bouton Modifier proprietaire** sur annonce+dossier publics
- **Selecteur bien existant** dans MerchantMode
- **Bouton supprimer bien** sur fiche bien
- **Bouton regenerer description** sur fiche bien
- **Pricing section polish** : CTAs alignes, 4 features uniformes, Pro highlight
- **Auth modal bottom sheet** mobile
- **Hero images statiques** : /imageavant.jpg + /imageapres.jpg dans repo

---

## Session 2026-03-28 — Audit complet + parcours achat + prompts v27-v30

### Phases TERMINÉES
- **Gradient Agents update** depuis Agent-Team (21 agents)
- **Pricing docs v3** : 9 fichiers mis à jour
- **Homepage personas** : 3 cartes compactes (Thomas 9.5/10)
- **Landing pages** : /architecte 8.1→9.5, /particulier 7.05→9.5
- **Audit complet site** : 6 rapports, 20 pages + 31 composants, P0+P1+P2 corrigés
- **Vocabulaire "visuel"** : 12 fichiers, 70 occurrences (crédit/génération→visuel)
- **Parcours achat** : checkout direct, subscription Pro, 4 recharges, feedback post-achat
- **Page annonce** : 5 bugs (z-index, labels FR, grille, modal export, sticky)
- **Mes biens** : recherche/tri, boutons contextuels dossier/annonce
- **MerchantMode** : 7 UX fixes (flow, scroll, custom, outdoor, miniatures)
- **Admin backoffice** : refonte Tailwind + tab Utilisateurs + P0 QA
- **Prompts v27-v30** : action:edit, échelle architecturale, SDB dimensions, tous trous comblés
- **Style par photo** en mode normal (multi-upload)
- **Spacing** réduit 35% sur 6 pages

### Travaux EN COURS (reportés prochaine session)
- **CGV** : mettre à jour pour refléter l'abonnement Pro (pas que one-shot)
- **Comparateur mobile** : curseur touch ne fonctionne pas
- **Blog seed** : `npx tsx scripts/seed-blog.ts` à exécuter sur Replit
- **Domaine versimo.fr** : blocker SEO/GEO n°1, action fondateur
- **Clés API prod** : Stripe, Google OAuth, Sentry (action fondateur)
- **Images galerie landing pages** : 3-6 visuels réels pour activer les galeries commentées
- **Tester v30 en prod** : générer sur toutes tailles de pièces pour valider l'échelle
