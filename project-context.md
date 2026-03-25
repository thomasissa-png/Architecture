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
- **Concurrent principal (marché FR)** : Gepetto (Bordeaux, fondé par un architecte d'intérieur, positionnement qualité) + Renovate Club (9,99€/mois illimité, Made in France, 10 000+ utilisateurs)
- **Notre différence clé vs eux** : Pipeline 2 passes unique sur le marché (préservation géométrie prouvée) + multi-cible explicite (architecte + marchand + particulier) + 12 styles curatés par des experts nommés vs styles génériques en volume

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
| @reviewer | 2026-03-24 | docs/reviews/replay-system-review.md | GO AVEC RESERVES. H-01 : /api/replay sans auth (risque cout). H-02 : built_prompt_pass1/pass2 toujours null (generate ne les retourne pas). H-03 : rate limit bloque le batch interne. M-01 : builtPromptPass1 replay stocke comme marqueur pas comme vrai prompt. M-03 : duplication logGeneration/logGenerationReturningId. | Systeme fonctionnel pour audits agents en alpha. Les 3 HAUTE a corriger avant usage regulier. Aucun bloquant car URL Replit non publique. |
| @orchestrator | 2026-03-24 | lib/db.ts (19 ALTER TABLE migrations) | Fix backoffice vide : CREATE TABLE IF NOT EXISTS ne vérifie pas les colonnes manquantes. 19 ALTER TABLE idempotents ajoutés dans ensureTable() pour toutes les colonnes post-création (Sprint 15b à F3). | Cause racine : la table a été créée par une version ancienne du code, les colonnes ajoutées après n'existaient pas → logGeneration() échouait silencieusement (fire-and-forget) → 0 logs → backoffice vide. Alt écartée : DROP+CREATE (perte des données existantes). |
| Yann+Lucas | 2026-03-24 | Audit visuel générations #29 et #30 Maximalist | #29 passe 1 : Yann 7.6/10, Lucas 8.1/10 — lustre Murano excellent, élimination chantier parfaite. #30 itération "ajoute WC" : Yann 2.8/10, Lucas 3.8/10 — bug BASE STYLE injection + tableau mural hallucination. | Audit sur images de production via API /api/logs. Passe 1 Maximalist validée. L'itération #30 a révélé 2 problèmes : injection systématique du furniturePrompt complet en itération + absence de negative prompt explicite pour wall art. |
| @orchestrator | 2026-03-24 | lib/iteration-prompt.ts, app/api/generate/route.ts, lib/custom-prompt.ts | P0 : Itérations TOUJOURS exclusives (suppression BASE STYLE). P0 : "no wall art/paintings/prints/mirrors" dans tous builders passe 2. P1 : "no baseboards unless in input" passe 1. P1 : filtre sanitaire dans pre-processing itération. | Décision architecturale : en itération, les modifications accumulées décrivent TOUT ce que l'utilisateur veut — le BASE STYLE n'a pas sa place. Alt écartée : garder isExclusive conditionnel (trop fragile, dépend de mots-clés). Wall art : les styles chargés (Maximaliste, Art Déco) ont un biais fort vers l'ajout de tableaux — il faut l'interdire explicitement. |
| @creative-strategy | 2026-03-24 | docs/strategy/competitive-benchmark.md, docs/strategy/brand-platform.md, docs/strategy/personas.md, docs/strategy/creative-brief.md | Positionnement : "Le home staging virtuel par IA qui ne trahit pas votre espace." Territoire : qualité architecturale + multi-cible (architecte/marchand/particulier) — espace libre non occupé par les concurrents. Concurrent principal : Gepetto (seul acteur FR sur la qualité). Espaces libres clés : premium français + outil de conversation client. 15 mots-clés territoire. 10 exclusions absolues (dont "magique", "révolutionnaire", "accessible"). | Positionnement qualité architecturale choisi vs volume-prix : Renovate Club (9,99€ illimité) et Collov (0,17$/photo) sont imbattables sur le prix. L'espace libre est la crédibilité professionnelle. Multi-cible retenu (vs focus immobilier) : aucun concurrent ne nomme les 3 personas explicitement. Packages one-shot confirmés vs abonnement (cohérent avec les pics d'usage des 3 personas). |
| @data-analyst | 2026-03-24 | docs/analytics/kpi-framework.md | Stack analytics : Plausible (trafic, 9€/mois) + PostHog (events product, gratuit <1M events) + PostgreSQL existant (métriques IA). North Star 3 000€/mois décomposé en arbre : visiteurs → activation → conversion → panier moyen → marge. 10 events P0 + 7 events P1 avec propriétés typées. 2 métriques de validation par persona. Toutes les cibles chiffrées marquées [HYPOTHÈSE]. | GA4 écarté (sur-dimensionné, friction RGPD). Mixpanel écarté (events plafonnés en free, coût dès 1K MAU). PostHog retenu : funnels + cohortes + session replay dans le même outil, free jusqu'à 1M events/mois. Plausible pour le trafic car privacy-first (pas de bandeau cookie). Les cibles sont des hypothèses de travail — aucune donnée de production disponible. Session replay PostHog à valider avec @legal avant activation (données personnelles potentielles). |
| @creative-strategy | 2026-03-24 | docs/strategy/value-proposition.md | Proposition de valeur opérationnelle : 8 sections (problème quantifié × 3 personas, mécanisme unique pipeline 2 passes, preuves vérifiables, résultats chiffrés, pour qui/pas pour qui, urgence marché 2026, proposition courte 18 mots + longue 4 phrases, test différenciation × 3 concurrents). Handoff @copywriter avec liste de variantes prioritaires. | Version courte centrée sur les mots du persona (pas de jargon marketing) — "votre pièce, pas celle d'un autre" est l'axe de différenciation retenu car aucun concurrent ne l'occupe. Test différenciation inclus pour valider que la proposition n'est pas reformulable par les concurrents. Frustrations chiffrées issues directement de personas.md (sources déclarées, pas d'hypothèses). |
| @copywriter | 2026-03-24 | docs/copy/brand-voice.md | Ton de marque en 3 axes (précis, sobre, complice sans familiarité). Titre hero : "Votre pièce meublée, en 90 secondes." — ancré sur les 2 différenciateurs non-négociables (90 secondes + votre pièce). 3 pills personas formulées dans le vocabulaire propre de chaque persona (pas de mélange). 3 objets email distincts par persona. Bios social calibrées par cible. Lexique positif/négatif complet (12 mots autorisés, 9 mots interdits). | Titre hero court retenu (6 mots) vs proposition longue 18 mots de value-proposition.md : le hero doit s'ancrer sur le bénéfice immédiat, pas expliquer le mécanisme. "90 secondes" est le seul chiffre dans le titre — pas de mention "12 styles" (surcharge). Mots interdits alignés sur brand-platform.md section 10 + creative-brief.md section 5 — aucune déviation. Objets email distincts par persona pour éviter le mélange de registres (règle personas.md — vocabulaire de Claire et de Léa incompatibles). |
| @creative-strategy | 2026-03-25 | docs/strategy/messaging-matrix.md | Grille persona × étape funnel × canal. 9 cases détaillées (message, preuve, objection, vocabulaire, CTA) + 6 cases secondaires résumées. Tableau synthèse cross-canal (5 canaux × 3 personas). Bloc objections cross-canal réutilisables (7 objections avec réponses dans les mots du persona). | Cases priorisées sur l'impact conversion (découverte + considération + décision pour les 3 personas, onboarding pour Claire et Thomas). Léa limitée à 2 cases détaillées : son parcours décision est court (plan gratuit → paywall) et son LTV est faible — concentration sur la découverte et la viralité. Vocabulaire persona strict appliqué : aucun croisement entre registre Claire (planche, direction esthétique) et Léa (vibe, Insta-worthy). Claims factuels uniquement (90 secondes, 12 styles, 1 000-4 000 € économie/opération) — aucun chiffre inventé. |
| @copywriter | 2026-03-25 | docs/copy/brand-voice.md (Section 4 ajoutée) | 2 variantes de titre hero par persona (6 titres), 2 objets email par persona (6 objets), 4 accroches social (LinkedIn Claire×2, Thomas×2, Instagram Léa×2), tableau CTAs validés par étape funnel. Section 4 ajoutée en Edit dans brand-voice.md existant. | Variantes construites strictement sur le vocabulaire persona issu de messaging-matrix.md et personas.md — aucun croisement de registre. Aucun chiffre inventé : tous issus de la value-proposition.md (90 secondes, 12 styles, 1 000-4 000€, 48-72h, 200-500€). Deux angles par persona : un ancré sur la frustration (avant), un sur le bénéfice (après). Ton uniformément sobre — pas de superlatifs, pas de points d'exclamation. |
| @product-manager | 2026-03-25 | docs/product/roadmap.md | Priorisation RICE 4 features : Auth/Crédits/Stripe (6,38 NOW), QA (4,80 NOW), F4 Marchand (1,58 NEXT), F5 Décorateur (0,75 LATER). Chemin critique documenté. Site unique recommandé (pas de sous-domaine). Clerk recommandé vs Auth.js. Stripe mode payment one-shot. 3 hypothèses à valider avec seuils d'alarme chiffrés. | Ordre de livraison Auth→QA→F4→F5 confirmé (cohérent avec décision fondateur 2026-03-24). Site unique retenu car contrainte solo développeur — 2 codebases = risque opérationnel inacceptable. QA avant F4/F5 car le batch marchand est fragile sans filet. Clerk préféré car setup 2j vs 3-4j Auth.js, webhook natif pour sync Stripe. Les 3 hypothèses couvrent les risques conversion, pricing et différenciation qualitative — toutes marquées [HYPOTHÈSE]. |
| @product-manager | 2026-03-25 | docs/product/backlog.md | 15 user stories au format JTBD réparties en 4 epics (Auth/QA/F4/F5) avec critères d'acceptation testables, KPI associés depuis kpi-framework.md, priorité P0/P1/P2. Décisions : déduction crédit côté serveur après succès 2 passes uniquement ; gating F4/F5 vérifié côté serveur (pas seulement UI) ; idempotency key sur INSERT crédits Stripe ; Puppeteer pour PDF F4 avec validation Replit staging obligatoire avant commit ; liens catalogues F5 dynamiques uniquement. | Backlog focalisé sur les 4 stories critiques par epic (anti-scope creep). Format JTBD choisi pour clarté de la valeur utilisateur. KPIs mappés depuis kpi-framework.md pour chaque story. Règle anti-invention respectée : tous les chiffres issus de roadmap.md et kpi-framework.md. |
| @product-manager | 2026-03-25 | docs/product/pricing-strategy.md | Benchmark 8 concurrents (prix, modèle, inclus). Packages crédits 4 tiers (Gratuit 3 crédits, Découverte 4,90€/5, Starter 14,90€/20, Pro 29€/50, Studio 69€/150). F4 Mode Marchand : 29€/dossier fixe. F5 Mode Décorateur : 9€/dossier fixe. Plan gratuit 3 générations sans CB (aligné REimagineHome). Pack Pro mis en avant comme ancrage. KPI North Star atteint à 140 transactions/mois (scénario Base). 5 hypothèses explicitement marquées. | Packages one-shot confirmés vs abonnement (décision fondateur). 3 générations gratuites retenues vs 1 (Pedra) ou 5 : 1 insuffisant pour démontrer la qualité 2 passes sur 3 styles différents (usage naturel Claire) ; 5 = coût acquisition en crédits offerts trop élevé. 29€ pour F4 aligné sur le prix perçu vs home stager humain (200-500€/planche) et sur l'ancrage Pack Pro — pas un chiffre arbitraire. 9€ F5 = micro-transaction impulsif pour Léa, note de frais anecdotique pour Claire. Volume discount F4 marqué [HYPOTHÈSE] — aucune validation terrain. |
| @creative-strategy | 2026-03-25 | docs/strategy/brand-story.md | Histoire d'origine fondée sur la frustration tech documentée (19 sprints) sans fondateur romanesque inventé. Tension narrative sur 3 problèmes nommés et refusés (géométrie détruite, éclairage inventé, style générique). Pipeline BiPasse™ nommé comme technologie propriétaire. Manifeste 10 lignes aligné brand-voice.md. Vision 3-5 ans ancrée sur les 3 personas. Section GEO avec 10 termes à associer systématiquement à VisiRénov. | Histoire d'origine technique retenue (pas narrative romantique) : colle à la réalité du fondateur solo-tech et est plus crédible pour les personas pro (Claire, Thomas) qui se méfient du marketing. "Meubler vs réinventer" choisi comme formule de rupture centrale car c'est le différenciateur le plus compréhensible sans jargon IA. Section GEO intégrée dans brand-story plutôt que dans un doc séparé : les entités de marque sont inséparables de la narration fondatrice. |
| @legal | 2026-03-25 | docs/legal/legal-audit.md | Audit juridique complet : conformité tarifaire (TVA TTC B2C, exception rétractation contenu numérique), RGPD (bases légales, transferts OpenAI DPF, rétention 30j/90j), EU AI Act (obligation marquage IA), droit d'auteur images générées, checklist 16 actions P0/P1/P2. | Conformité TVA TTC retenue (pas HT) : la pricing-strategy.md affichait les prix HT — correction nécessaire avant ouverture paiement. Exception rétractation (Art. L221-28, 13°) retenue avec case à cocher obligatoire : sans elle, le droit de rétractation 14j s'applique même après usage. Data Privacy Framework (DPF) retenu comme fondement du transfert OpenAI US (décision d'adéquation UE-US du 10 juillet 2023). Plausible recommandé vs PostHog pour éviter la bannière cookies (analytics sans cookie). Mention "Simulation" obligatoire sur visuels F4 pour prévenir qualification pratique commerciale trompeuse (Art. L132-1 Conso). |
| @copywriter | 2026-03-25 | docs/copy/brand-story-content.md | Page About (5 H2 narratifs, 400 mots), Pitch elevator (3 phrases), LinkedIn (150 mots angle pro), Twitter (1 phrase), Instagram (sobre, 0 emoji). Entités GEO intégrées nativement : Pipeline BiPasse, Yann Duval, Lucas Moreau, "pipeline 2 passes", "home staging virtuel". | Page About narrative (pas institutionnelle) : les personas pro rejettent la rhétorique corporate — structure problème → méthode → preuve → cible est plus convertissante. Instagram sans emoji : le ton VisiRénov est sobre même en social (cohérence brand-voice.md). Aucun chiffre inventé : 90 secondes, 12 styles, 10 minutes, 20 ans XP tous documentés dans les sources amont. Handoff @seo avec mapping exact des zones à optimiser (H1/H2, métadonnées, entités nommées). |
| @seo | 2026-03-25 | docs/seo/metadata-templates.md | 6 meta templates (title + description) par page, 3 schémas JSON-LD (Organization, SoftwareApplication, FAQPage), implémentation Next.js 14 App Router (generateMetadata, sitemap.ts, robots.ts), maillage cocon 2 niveaux, 10 mots-clés classés par intention + 7 requêtes longue traîne propriétaires. | Metadata API Next.js native (pas de librairie tierce) : moins de dépendances, meilleur support App Router. Title hero à 60 chars avec catégorie + 2 différenciateurs chiffrés : les 3 mots-clés prioritaires (home staging, virtuel IA, 12 styles/90 secondes) dans une seule balise. JSON-LD Organization + SoftwareApplication choisis (vs WebPage/Article) : entités les plus adaptées à un outil SaaS. FAQPage avec 3 questions centrées sur le différenciateur pipeline 2 passes (répond aux requêtes conversationnelles GEO). Longue traîne propriétaire documentée depuis brand-story.md section 5 — VisiRénov sera seul résultat sur ces requêtes. |
| @growth | 2026-03-25 | docs/growth/growth-strategy.md | Unit economics par persona (LTV/CAC), top 3 canaux par persona, boucle virale (watermark + referral + galerie), projection M1-M6 en 3 scénarios. ALERTE : Léa non rentable en paid (LTV/CAC 1,4x) — canal viral + SEO uniquement. North Star 3 000€/mois atteint en scénario Base vers M8-M9 ou Optimiste M5-M6. | Paid écarté avant M5 : aucune donnée terrain pour calibrer le CAC réel. Léa exclue du paid : LTV ~20€ incompatible avec un CAC paid estimé à 14€ minimum. Watermark retenu comme levier viral P0 car activable sans auth (< 1 semaine). Referral à préparer maintenant pour activer au lancement Auth (M2). Canaux gratuits (SEO, LinkedIn outreach, Pinterest organique) prioritaires sur les 4 premiers mois. |
| @seo | 2026-03-25 | docs/seo/seo-audit.md | Score global 38/100. 5 KO critiques : sitemap.ts absent, robots.ts absent, JSON-LD absent, maillage interne absent (0 page cluster existante), domaine Replit (autorité nulle). H1 inversé (logo texte en H1, titre hero en H2). page.tsx est "use client" — contenu non SSR. | Audit code source direct (layout.tsx, page.tsx, next.config.mjs). P0 sitemap+robots : code fourni clé en main dans metadata-templates.md, impact immédiat dès prochain crawl Google. P1 metadata layout.tsx : alignement sur template Section 3 (metadataBase manquant = URLs OG relatives non résolues). P2 JSON-LD : Rich Results bloqués sans les 3 schémas. P3 H1/H2 swap. P4 dossier public/ à créer (absent du projet). Domaine Replit signalé comme frein SEO structurel — arbitrage @infrastructure requis. |
| @design | 2026-03-25 | docs/design/design-audit.md | Audit 10 critères — note globale 7.4/10. P1 BLOQUANT : emojis StylePicker incompatibles avec le brief (registre grand-public). P2 MAJEUR : text-muted non tokenisé, WCAG invérifiable. P3 MAJEUR : SVG hero schématiques sous le niveau "architecture-grade". P4 MOYEN : shadow-lg bouton sticky hors-système. P5 MINEUR : badges AVANT/APRÈS text-[10px] sous seuil accessibilité. | Emojis comme identifiants de style : pratique en dev mais opposé au positionnement "sobre, précis" du brief. Le creative-brief interdit explicitement les emojis hors réseaux sociaux. Pastilles couleur ou pictogrammes vectoriels retenus comme alternative. WCAG prioritaire car text-muted est utilisé massivement sur toute la page — sans token défini, un refactor UI pourrait casser le contraste sans qu'on le détecte. |
| @ux | 2026-03-25 | docs/ux/ux-audit.md | Audit UX 10 critères (moyenne 7.5/10). Top 5 : P1 CRITIQUE blocs formulaire toujours visibles (révélation progressive manquante), P2 HAUTE absence bouton Annuler (AbortController non exposé), P3 HAUTE absence preview visuelle par style, P4 MOYENNE limite itérations opaque + chemin upgrade inexistant, P5 MOYENNE incohérence "11 styles" vs 12 + badge modèle technique. | P1 : le code révèle que tous les blocs sont rendus dès le chargement (pas de conditional rendering sur files.length). P2 : AbortController existe mais aucun bouton exposé — correction rapide à fort impact. P3 : emojis seuls insuffisants pour distinguer styles proches — convergence avec l'audit @design P1. Révélation progressive retenue vs wizard multi-page (trop lourd pour MVP one-page). |
| @copywriter | 2026-03-25 | docs/copy/copy-audit.md | Audit 8 critères : CRITIQUE pricing mensuel ≠ modèle packages décidé. HAUTE : titre hero générique, "en quelques minutes" interdit, CTA header trop court, CTA Découverte générique, upsell passif. MOYENNE : pill Particuliers registre trop bas. BASSE : typos accentuation, "Mid-Century" anglicisme. Messages d'erreur et footer : OK. | Titre hero actuel identique à la formulation des 3 concurrents — remplacé par brand-voice.md section 2A ("Votre pièce meublée, en 90 secondes.") non négociable. Correction pricing BLOQUANT conditionnée à @product-manager avant implémentation. "Mid-Century" soumis à décision utilisateur. |

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
- Maximaliste testé en passe 1 uniquement (#29, Yann 7.6 / Lucas 8.1) — reste à tester passe 2 complète.

---

## Mémo de reprise — dernière session

- **Date et heure de clôture** : 2026-03-24 ~23h30
- **Résumé de la session** :
  - Fix backoffice vide (19 ALTER TABLE migrations — cause : colonnes manquantes en DB, logGeneration échouait silencieusement)
  - Audit croisé Yann Duval + Lucas Moreau sur 2 générations Maximalist (#29 passe 1 : 7.6-8.1/10, #30 itération : 2.8-3.8/10)
  - Refonte architecturale des itérations : suppression complète de l'injection BASE STYLE — les itérations sont désormais TOUJOURS exclusives (l'utilisateur obtient uniquement ce qu'il demande)
  - Ajout "no wall art" explicite dans tous les builders passe 2, "no baseboards" dans builders passe 1, filtre sanitaire dans pre-processing
- **Travaux en cours** :
  - F3 Extérieur : Phase F3.1 (audit prompts outdoor Yann+Lucas) — EN COURS, livrables non reçus
  - Réserves F2 non corrigées : H-01 (iteration ignore roomType), H-02 (roomType absent des logs) — prévues dans F3.2
  - 6/12 styles jamais testés en passe 2 complète (Contemporain, Bohème, Méditerranéen, Cosy, Wabi-Sabi, Haussmannien)
  - Maximaliste passe 2 (mobilier) jamais testée correctement — seule la passe 1 est validée
- **Prochaines actions recommandées** :
  1. **Tester les itérations post-fix** — lancer une génération complète (passe 1 + passe 2) puis une itération simple ("ajoute un fauteuil") et vérifier qu'AUCUN mobilier BASE STYLE n'est ajouté. Vérifier aussi que le filtre sanitaire fonctionne ("ajoute un WC" → warning FR).
  2. **Continuer F3 Extérieur** — @orchestrator : relancer l'audit prompts outdoor (Yann+Lucas en parallèle), puis @fullstack pour l'implémentation, puis @reviewer.
  3. **Tester les styles manquants** — Lancer des générations sur Contemporain, Bohème, Méditerranéen, Cosy, Wabi-Sabi, Haussmannien + Maximaliste passe 2 — auditer avec Yann+Lucas.
- **Blockers éventuels** : Aucun bloqueur technique. Les corrections sont pushées et prêtes au redéploiement.
- **Commande de reprise suggérée** :
  ```
  @orchestrator Les fixes itération (toujours exclusif, no wall art, no baseboards, filtre sanitaire) et le fix backoffice sont pushés. 1) Teste une génération + itération simple pour valider. 2) Relance F3 Extérieur (audit prompts Yann+Lucas → fullstack → reviewer). 3) Si le temps le permet, lance des générations de test sur les 6 styles manquants + Maximaliste passe 2 et fais auditer par Yann+Lucas.
  ```
