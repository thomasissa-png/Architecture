# Contexte Projet — VisiRénov

> Ce fichier est lu par tous les agents avant toute action.
> Remplis chaque champ. Les champs vides bloquent les agents.
> **ATTENTION** : ce fichier peut contenir des informations stratégiques (budget, pricing, concurrents). S'assurer que le repo est **privé** si des données confidentielles y sont renseignées.
> Dernière mise à jour : 2026-03-24 (v2 — ajout KPI marge, packages, anti-mots, timeline)

---

## Identité
- **Nom du projet** : VisiRénov
- **URL (si existante)** : https://architecture-toum92.replit.app/
- **Secteur** : PropTech / Home Staging Virtuel — Génération de visuels meublés par IA à partir de photos de pièces vides
- **Stade** : [x] MVP
- **Date de début** : 2026 (alpha en cours)

---

## Cible
- **Persona principal** :
  - **Claire** — 40 ans, architecte d'intérieur DPLG indépendante à Lyon, 15 ans d'XP. Besoin : générer rapidement 2-3 ambiances pour valider une direction esthétique avec ses clients dès le premier RDV, au lieu d'attendre 2-3 jours par planche de rendu 3D. Frustration : les outils de rendu sont trop lents, les clients veulent "voir" immédiatement.
  - **Thomas** — 35 ans, marchand de biens à Bordeaux, 8-12 opérations/an. Besoin : simuler des visuels meublés pour ses plaquettes de pré-commercialisation et annonces immobilières. Frustration : payer 200-500€ par planche à un home stager, délai de 48-72h, les acquéreurs ne se projettent pas sur des murs vides.
  - **Léa** — 32 ans, chef de projet digital à Nantes, primo-accédante. Besoin : visualiser différents styles de déco dans SES pièces avant d'acheter. Frustration : Pinterest montre de belles photos mais jamais dans SA pièce.
- **Problème principal** : Créer des visuels meublés de qualité professionnelle est lent (2-3 jours) et cher (200-1500€ par planche). Les acquéreurs et clients ne se projettent pas sur des photos de pièces vides, ce qui ralentit les ventes et les décisions de décoration.
- **Alternative actuelle** : Home stagers humains (200-500€/planche, 48-72h), modélisation 3D (encore plus cher, plusieurs jours), ou rien (photos de murs vides sur les annonces).
- **Persona secondaire** : Agences immobilières, promoteurs, décorateurs freelance.

---

## Positionnement
- **Promesse unique** : Un visuel meublé de qualité architecte d'intérieur en 90 secondes, à partir d'une simple photo.
- **Ton de marque** : Premium et sobre
- **3 mots qui DÉFINISSENT la marque** : Qualité, Efficacité, Valeur ajoutée
- **3 mots qui ne DÉFINISSENT PAS la marque** : Cheap, Fake, Gadget
- **Concurrent principal** : ⚠️ À COMPLÉTER PAR AGENTS — Benchmark concurrentiel à réaliser par @creative-strategy (HomeDesigns AI, REimagineHome, Virtual Staging AI, DecorMatters, etc.)
- **Notre différence clé vs lui** : ⚠️ À COMPLÉTER PAR AGENTS — Dépend du benchmark ci-dessus

---

## Objectifs
- **Objectif principal à 6 mois** : 500 utilisateurs actifs payants, MRR 5K€
- **KPI North Star** : 3 000€/mois de marge nette (revenus - coûts IA/infra/acquisition)
- **KPI secondaire** : 1 000 photos générées par semaine (indicateur de volume/adoption)
- **Objectif secondaire** : Devenir le leader du marché français du home staging virtuel par IA
- **Ce que le succès ressemble à 12 mois** : N°1 du marché FR, rentabilité prouvée, expansion des use cases (extérieur, dossiers marchands, catalogue produits réels)

---

## Stack technique
- **Frontend** : [x] Next.js 14, [x] React, TypeScript, Tailwind CSS, App Router
- **Backend** : Next.js API Routes (App Router) — ⚠️ À CONFIRMER si évolution prévue
- **Base de données** : PostgreSQL + Replit Object Storage (images persistantes)
- **Authentification** : À implémenter (aucune en place) — requis pour le système de packages/crédits
- **Hébergement** : Replit
- **Outils IA utilisés** :
  - **Primary** : OpenAI Responses API (gpt-4.1) avec tool image_generation + input_fidelity "high"
  - **Fallback** : Flux Depth Pro via Replicate (black-forest-labs/flux-depth-pro)
  - **Pre-processing prompts custom** : GPT-4.1-mini (traduction FR→EN, split surface/furniture, enrichissement)
  - **Pipeline** : 2 passes — passe 1 surfaces (murs/sol/plafond/luminaire) → passe 2 mobilier (meubles/textiles/déco)
  - **Agents qualité prompts** : Yann Duval (architecte d'intérieur) + Lucas Moreau (expert IA image)
- **Budget IA mensuel (tokens)** : ⚠️ À DÉFINIR
- **Volume d'usage IA prévu** : Cible 1 000 générations/semaine (= ~2 000 appels API/semaine avec pipeline 2 passes)
- **Latence IA cible** : <90 secondes par génération complète (2 passes)
- **Outils d'analytics** : ⚠️ À DÉFINIR — [Logging PostgreSQL en place, pas d'analytics utilisateur]

---

## Modèle économique et juridique
- **Modèle économique** : Vente de packages (crédits de génération) — PAS d'abonnement mensuel pour le lancement
  - Pricing actuel sur le site (tiers SaaS mensuel) à REMPLACER par un système de packages unitaires
  - Grille de packages : ⚠️ À DÉFINIR PAR AGENTS — @product-manager doit concevoir les tiers (nombre de crédits, prix, itérations incluses)
- **Pays de commercialisation** : France
- **Données sensibles collectées** : [x] Non — Photos de pièces vides uniquement, pas de données personnelles sensibles
- **Utilisation d'IA générative** : [x] Oui — Génération d'images meublées à partir de photos de pièces vides (OpenAI gpt-4.1 image generation + Flux Depth Pro)

---

## Contraintes
- **Budget mensuel infrastructure** : Pas de limite fixe — choix doivent être raisonnables et ROI positif
- **Budget mensuel acquisition** : Pas de limite fixe — choix doivent être raisonnables et ROI positif
- **Budget analytics** : Pas de limite fixe — choix doivent être raisonnables et ROI positif
- **Timeline de lancement** : ASAP — le plus tôt possible, prioriser la vitesse de mise en marché
- **Contraintes légales ou sectorielles** : Aucune identifiée à ce stade (voir section implications juridiques ci-dessous)
- **Ressources disponibles** : [x] Solo + agents IA

---

## Existant (projets en place uniquement)
- **URL du site actuel** : https://architecture-toum92.replit.app/
- **Admin** : https://architecture-toum92.replit.app/admin
- **API Logs** : https://architecture-toum92.replit.app/api/logs
- **Comptes sociaux existants** : Aucun
- **Outils analytics en place** : Logging PostgreSQL interne (generations, timing, prompts), pas d'analytics front-end
- **Contenu existant** : Landing page avec Hero, outil 3 étapes, section pricing
- **Historique SEO** : Sous-domaine Replit, non indexé, pas de domaine propre
- **Base email** : Aucune

---

## Stade du projet & Roadmap

- **Statut actuel** : Alpha fonctionnelle — pipeline 2 passes opérationnel, 12 styles, 28+ générations de test
- **Fonctionnalités live** : Upload multi-photos, 12 styles + custom, comparateur avant/après, téléchargement HD, partage (WhatsApp, copie, natif), pricing affiché
- **Roadmap produit** (features détaillées dans docs/product/functional-specs.md) :
  1. Commentaire sur visuel généré → nouvelle génération (1 à 3 itérations selon package)
  2. Option type de pièce (salon, chambre, salle de bain, cuisine, etc.)
  3. Option extérieur (terrasse, balcon, patio, etc.)
  4. Mode marchand de biens : dossiers de pré-commercialisation automatiques
  5. Mode décorateur d'intérieur : meublage à partir de vrais produits (IKEA, Leroy Merlin, etc.) avec présentation produits/prix/liens

### Ordre de développement validé (2026-03-24)

> Décidé par le fondateur. Remplace l'ordre suggéré par @product-manager (F2→F1→F3→F4→F5).

| Étape | Feature | Justification |
|-------|---------|---------------|
| 1 | **F1 — Itération commentaire** | Boucle de feedback = rétention + valeur perçue immédiate |
| 2 | **F2 — Type de pièce** | Effort minimal, impact qualité sur toutes les générations |
| 3 | **F3 — Extérieur** | Élargit le marché (terrasses, balcons) avant monétisation |
| 4 | **Auth + Crédits + Stripe** | Monétisation — packages one-shot (4,90€ à 69€), gating F4/F5 |
| 5 | **QA automatisée** | Vitest + Playwright, stabiliser avant les features avancées |
| 6 | **F4 — Mode marchand** | Feature pro (réservée package Pro+), dossiers batch |
| 7 | **F5 — Mode décorateur** | Feature premium, shopping list produits réels, la plus complexe |

---

## Historique des interventions agents

> Ce tableau est le journal de bord du projet. Chaque agent DOIT le compléter après chaque livrable.
> La colonne "Pourquoi" est obligatoire : elle capture le raisonnement, pas juste la décision.
> Tout agent démarrant une session DOIT lire ce tableau pour comprendre les décisions passées et leur justification.

| Agent | Date | Livrable produit | Décisions clés | Pourquoi / Alternatives écartées |
|-------|------|-----------------|----------------|----------------------------------|
| UX Director (Maxime) | Sprint 1 | Audit UX 7 corrections | Auto-scroll, feedback toast, focus-visible, timer loader | Parcours 3 étapes fluide — alternatives : wizard multi-page (trop lourd pour MVP) |
| Architecte Intérieur (Yann) | Sprint 5 | Réécriture 12 prompts | Enrichissement 20→60-80 mots, hero pieces, palettes, textiles | Qualité génération insuffisante avec prompts courts — alt : fine-tune (trop cher/long) |
| Expert IA Image (Lucas) | Sprint 6 | Audit pipeline IA | Descripteurs photo DSLR, cohérence éclairage, restructuration prompt | Rendu "CGI" trahissait l'IA — alt : post-processing (latence +++) |
| Yann + Lucas | Sprint 7-9 | Fix images identiques à input | Abandon images.edit/SDXL, stratégie action-dominante | images.edit = inpainting inadapté, SDXL prompt_strength trop binaire |
| Yann + Lucas | Sprint 10 | Migration Responses API + Flux | OpenAI Responses API primary, Flux Depth Pro fallback | Vision contextuelle > inpainting pixel, depth map > prompt_strength |
| Yann + Lucas | Sprint 11-18 | Pipeline 2 passes, split prompts, 18+ sprints d'itération | Surfaces séparées du mobilier, prompts conditionnels, logging PG | Single-pass échouait systématiquement — le modèle régénère au lieu d'éditer quand trop de changements |
| @product-manager | 2026-03-24 | docs/product/functional-specs.md — section F1 complète | Pipeline itération = re-passe 2 uniquement sur pass1 caché ; 0/1/3/5 itérations par package Gratuit/Starter/Pro/Business ; sessionId sans auth ; crédit non consommé si erreur serveur ou validation GPT-4.1-mini | Passe 1 non relancée = économie coût serveur + préserve cohérence surfaces ; pas d'auth complète pour réduire friction MVP |
| @product-manager | 2026-03-24 | docs/product/functional-specs.md — section F5 complète (F5.1→F5.7) | Shopping list via GPT-4.1 post-génération (pas de scraping temps réel) ; liens de recherche dynamiques IKEA/Leroy Merlin/MdM (pas d'URLs produit hardcodées) ; 1 crédit supplémentaire pour la liste ; affiliés désactivés en V1 (validation légale requise) ; alternatives budget via GPT-4.1-mini (pas de deuxième appel GPT-4.1 plein) ; export PDF A4 avec QR codes | Liens de recherche vs liens produits directs : les URLs produits changent fréquemment et casseraient en 24-48h. Scraping catalogue temps réel écarté (coût infra, fragilité, CGU enseignes). Affiliés V2 uniquement : programme d'affiliation IKEA France nécessite approbation formelle |
| @product-manager | 2026-03-24 | docs/product/functional-specs.md — Specs complètes F1-F5 + Packages crédits (sections 6 + 7) | Packages one-shot 4 tiers (4,90€/14,90€/29€/69€) vs abonnement. Feature gating : F4 Mode Marchand à partir du Pro (29€). F5 Décorateur à partir du Pro. F1 itérations : 0/1/3/5 selon tier. Ordre livraison : F2→F1→F3→F4→F5. KPI 3 000€/mois = 140-150 packs/mois. Matrice dépendances F1-F5. | Packages choisis vs abonnement : Thomas (8-12 ops/an) et Léa (1 appart) ont des pics de besoin, pas d'usage régulier — abonnement crée du churn. F4 réservé Pro : coût batch 15 photos = ~1,50€ coût API. F2 en premier car effort minimal + impact maximal sur qualité de toutes les générations. |
| @product-manager | 2026-03-24 | docs/product/functional-specs.md — section F3 enrichie (F3.1→F3.7) | Pipeline outdoor fondamentalement différent du indoor : suppression directives plafond/luminaire/peinture murale, injection "open-air space — no ceiling, sky preserved as-is". 6 styles outdoor dédiés (pas d'adaptation des 12 styles intérieur). 5 sous-types avec blocs prompt additifs. 4 user stories (dont US-F3-04 alerte détection intérieur). Negative prompt outdoor explicite. Coût crédit identique indoor. F3 et F2 mutuellement exclusifs en UI. | Styles outdoor dédiés (vs adaptation des 12 intérieurs) : les prompts intérieur contiennent des références structurelles (plafond, mur, luminaire) qu'il faudrait filtrer à chaque style — plus simple et plus sûr de créer 6 styles propres dès le départ. Même coût crédit : pas de raison de charger davantage pour l'outdoor, le pipeline a la même complexité. |
| @qa | 2026-03-24 | docs/qa/qa-strategy.md — Audit criteres F1-F5 + scenarios E2E + tests unitaires + matrice couverture + strategie mocking | 25 tests unitaires (P0/P1/P2), 7 scenarios E2E Playwright avec code, audit testabilite de chaque critere d'acceptation, 5 criteres non testables identifies avec strategies alternatives, seuils coverage 80-90%, axe-core accessibilite, tracking plan couverture 0% (features non implementees). Escalades : contraste Sage AA, criteres visuels non testables, data-testid a ajouter par @fullstack. | Tests sur les prompts (pas sur les images generees) : la sortie IA est non deterministe, donc on teste que les bons prompts sont construits et envoyes. Vitest + Playwright choisis (conformes au stack Next.js 14). Pas de Jest/Cypress car aucun framework de test existant dans le projet. |
| @fullstack | 2026-03-24 | components/RefineModal.tsx, components/VersionSelector.tsx, app/page.tsx (F1 frontend) | RefineModal avec focus trap, Escape, aria-modal, Cmd+Enter submit, body scroll lock, warnings pre-processing. VersionSelector avec pilules v1/v2/v3 et legende commentaire. page.tsx : versions[] par resultat, activeVersions[], iterationsRemaining, handleRefine avec pre-process + fetch pass1Key, refine loading/error/retry/modify, max_iterations_reached avec upsell, reset complet F1. | Architecture : les versions sont stockees par index de resultat (pas globalement) pour supporter le multi-photo. Le comparateur affiche la version active selectionnee. L'iteration n'est pas decrementee en cas d'erreur (spec F1.4). Le pre-processing du commentaire reutilise /api/preprocess-prompt existant (Sprint 17). Backend /api/generate doit accepter pass1Key pour sauter la passe 1 — implementation backend separee. |
| @fullstack | 2026-03-24 | lib/iteration-prompt.ts (builders), lib/db.ts (fix INSERT iteration), lib/custom-prompt.ts (preprocessIterationComment), app/api/generate/route.ts (flux iteration backend F1) | Builders d'iteration separes des builders standard (pas de flag). Cumul modifications avec label (current). Iteration flow dans route.ts : pass1_key -> load cache -> TTL 24h -> preprocess GPT-4.1-mini -> builders iteration -> re-passe 2 only. Standard flow : sauvegarde pass1 dans Object Storage + retourne pass1_key. Fix INSERT SQL manquant 6 colonnes iteration. | Builders separes (vs flag sur les existants) : le prompt d'iteration est fondamentalement different (modifications first, surfaces LOCKED renforcee, pas de passe 1). tryOpenAIResponsesWithPrompt / tryFluxDepthWithPrompt dedies : evitent de complexifier les fonctions standard avec des branches. MAX_ITERATIONS=3 en constante (configurable par package plus tard). TTL 24h verifie cote serveur (pas confiance au client). |
| @reviewer | 2026-03-24 | docs/reviews/f1-review.md | Review F1 : CRITIQUE H-02 double mismatch pass1Key/pass1_key (iteration cassee). HAUTE H-01 double pre-processing commentaire. MOYENNE M-03 iterationsRemaining global au lieu de par photo. | H-02 est un bug bloquant : le serveur attend pass1_key mais le client envoie pass1Key. H-01 : le client pre-process via preprocessCustomPrompt puis le serveur re-pre-process via preprocessIterationComment — double transformation. |
| Yann+Lucas | 2026-03-24 | docs/ia/f2-room-type-prompts.md | 8 types de piece (salon, chambre, sdb, cuisine, bureau, entree, sam, buanderie). roomFurnitureOverride REMPLACE le furniturePrompt du style (sauf Salon). Exception built-in pour Kitchen et Bathroom. roomType stocke dans Pass1Meta. Auto-detection optionnelle GPT-4.1-mini vision. | Remplacement au lieu de concatenation : les meubles d'un salon n'ont rien a voir avec ceux d'une salle de bain. Exception built-in : une cuisine sans plan de travail n'est pas credible — la regle "freestanding only" doit etre assouplie pour kitchen/bathroom. |
| @fullstack | 2026-03-24 | lib/room-types.ts (nouveau), components/RoomTypePicker.tsx (nouveau), page.tsx + route.ts + db.ts (modifies) | F2 implemente : 8 types de piece avec overrides, selecteur UI, exception built-in kitchen/bathroom dans builders, negative prompt conditionnel, roomType dans Pass1Meta. Fix F1 H-02 (pass1_key mismatch) et H-01 (double pre-processing). | Builders modifies pour accepter roomTypeId parametre conditionnel (pas de builder separe par type). applyRoomTypeOverrides() centralise la logique d'override dans lib/room-types.ts. |
| @reviewer | 2026-03-24 | docs/reviews/f2-review.md | Review F2 : VALIDE AVEC RESERVES. HAUTE H-01 iteration ignore roomType (freestanding-only hardcode dans iteration-prompt.ts). HAUTE H-02 roomType absent des generation_logs. MOYENNE M-01 directive lumiere dans bedroom override. Fix F1 H-01/H-02 confirmes resolus. | H-01 : les builders d'iteration n'ont pas de parametre roomTypeId, donc une iteration sur cuisine perd les built-ins. H-02 : pas de colonne room_type dans la table, impossible d'auditer par type de piece. |
| @orchestrator | 2026-03-24 | lib/db.ts, app/page.tsx (Sprint 19 — 3 bug fixes) | Fix StorageClient resilient (retry/reinit sur erreur SDK), fix iterations cassees (meme cause racine), RoomTypePicker avant StylePicker en mode interieur | Cause racine P1a+P1b : SDK @replit/object-storage entre en etat "error" permanent si sidecar indisponible a l'init, jamais de recovery. Solution : detection etat error + reinit + withStorageRetry wrapper. P2 : uniformisation flow interieur/exterieur. |
| @reviewer | 2026-03-24 | docs/reviews/sprint19-image-storage-review.md | VALIDE AVEC RESERVES : fix StorageClient correct (retry borne, toutes ops wrappees, fallback propre). H-01 acces SDK interne (state.status) fragile mais seule option. M-01 race condition singleton faible impact. M-02 Pool PG dupliquee dans /api/logs. | Acces a state.status verifie dans le code source SDK (champ @hidden, pas d'API publique alternative). Race condition theorique mais impact negligeable en alpha. Epingler version SDK recommande en P1. |
| @ia | 2026-03-24 | app/api/generate/route.ts (modifie) | Sprint 20 Option B : prompts modulaires par type de piece. 4 builders recrits avec branches dediees par piece (kitchen, bathroom, wc, bedroom, entryway, laundry, cellar, dining_room). Fallback generique pour salon/bureau/null. buildSurfacesFluxPrompt recoit roomTypeId. Surface overrides bypasses pour pieces a builder dedie (evite duplication tokens). Fix : roomTypeId passe en passe 1 OpenAI (etait manquant). Suppression SMALL_ROOMS/WET_ROOMS inutilises. | Option B choisie vs A (44 fonctions inmaintenable) et C (gains trop modestes). Les builders dedies absorbent les directives des room overrides directement, eliminant ~40% de tokens inutiles sur les petites pieces. Le remplacement furniturePrompt par applyRoomTypeOverrides est conserve (necessaire pour substituer canape par lit en chambre). |
| @reviewer | 2026-03-24 | docs/reviews/option-b-prompt-review.md | VALIDE AVEC RESERVES. H-01 : builders iteration (iteration-prompt.ts) non alignes sur logique par piece (wc/laundry manquent built-in, distribution profondeur non conditionnee). H-02 : dining_room dans ROOMS_WITH_DEDICATED_BUILDERS mais pas de surface builder dedie (bombe a retardement si override ajoute). M-01 : roomSurfaceOverride redondants dans room-types.ts. M-02 : CEILING_PRESERVATION absent de laundry/cellar. | Pas de bloquant — H-01 impacte uniquement les iterations F1 sur wc/laundry (rare en alpha), H-02 impacte uniquement si roomSurfaceOverride dining_room modifie (vide actuellement). |

---

## Performance des agents

> Ce tableau mesure la qualité de chaque intervention. Rempli par l'agent après livraison, validé/corrigé par @reviewer.
> Un agent avec 2+ interventions à <3/5 en spécificité → son prompt doit être revu.

| Agent | Date | Livrable | Complétude | Cohérence | Actionnabilité | Messages | Spécificité | Notes |
|-------|------|----------|------------|-----------|----------------|----------|-------------|-------|
| | | | | | | | | |

**Légende (échelle 1-5 alignée avec CLAUDE.md) :**
- **Complétude** : 1 (sections manquantes) → 3 (sections principales couvertes) → 5 (tout rempli, rien à ajouter)
- **Cohérence** : 1 (contredit des livrables existants) → 3 (pas de contradiction) → 5 (référence explicitement les livrables amont)
- **Actionnabilité** : 1 (trop vague) → 3 (implémentable avec interprétation) → 5 (directement implémentable, zéro ambiguïté)
- **Messages** : 1 (silencieux sur les manques) → 3 (a signalé certains manques) → 5 (a signalé tous les manques, hypothèses marquées)
- **Spécificité** : 1 (générique) → 3 (partiellement spécifique) → 5 (100% taillé pour ce projet)

---

## Notes libres

- Le CLAUDE.md contient l'historique complet des 18 sprints d'itération (155+ points) — c'est la mémoire technique du projet.
- Les agents Yann Duval et Lucas Moreau sont définis dans agents/ (pas dans .claude/agents/) — ce sont des agents métier spécifiques au projet, pas des agents Gradient génériques.
- Le pipeline 2 passes est la décision architecturale la plus critique : toutes les approches single-pass ont échoué (sprints 7-10).
- 7/12 styles n'ont jamais été testés en pipeline 2 passes complet (Contemporain, Bohème, Méditerranéen, Cosy, Wabi-Sabi, Maximaliste, Haussmannien).
