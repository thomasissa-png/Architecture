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
- **Roadmap produit** :
  1. Commentaire sur visuel généré → nouvelle génération (1 à 3 itérations selon package)
  2. Option type de pièce (salon, chambre, salle de bain, cuisine, etc.)
  3. Option extérieur (terrasse, balcon, patio, etc.)
  4. Mode marchand de biens : dossiers de pré-commercialisation automatiques
  5. Mode décorateur d'intérieur : meublage à partir de vrais produits (IKEA, Leroy Merlin, etc.) avec présentation produits/prix/liens

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
