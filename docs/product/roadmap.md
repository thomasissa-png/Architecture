# Roadmap — Versiroom
## Version 1.0 — 2026-03-25

---

## 0. Contexte de priorisation

**North Star** : 3 000€/mois de marge nette.
**Objectif 6 mois** : 500 utilisateurs actifs payants, MRR 5K€.
**Ressource** : 1 solo développeur + agents IA.
**Contrainte absolue** : F1 (itération), F2 (type de pièce), F3 (extérieur) sont LIVRÉS. La prochaine étape est la monétisation.

**Benchmark concurrentiel actualisé (2026-03-25) :**

| Concurrent | Modèle | Prix | Volume/styles | Lacune clé |
|---|---|---|---|---|
| Renovate Club (FR) | Abonnement mensuel | 9,99€/mois illimité | 80+ styles | Qualité génériques, pipeline single-pass, CGI perceptible |
| Gepetto (FR, Bordeaux) | Abonnement | Non publié | 30+ styles, app mobile | Positionnement qualité mais pas de pipeline 2 passes documenté |
| REimagineHome (US) | Abonnement | 14$/mois | Variable | Résultats génériques, pas multi-cible |
| HomeDesigns AI (US) | Abonnement | 27$/mois | 1 000 designs | Style CGI, abonnement uniquement |

**Espace libre non occupé** : qualité architecturale pipeline 2 passes + modèle one-shot (pas d'abonnement) + multi-cible explicite (architecte/marchand/particulier) + dossiers marchands automatiques.

---

## 1. Roadmap priorisée — Scores RICE

**Formule** : Score = (Reach × Impact × Confidence) / Effort
Reach = % des utilisateurs actifs touchés (1-10). Impact = 1 (faible) / 2 (moyen) / 3 (fort). Confidence = % de certitude sur les estimations. Effort = semaines-homme (1S=1, 2-3S=2, 1-2M=4, 2-3M=8, 3M+=12).

| Feature | Reach | Impact | Conf. | Effort | Score RICE | Priorité |
|---|---|---|---|---|---|---|
| **Auth + Crédits + Stripe** | 10 | 3 | 85% | 4 | **6,38** | NOW |
| **QA automatisée** | 8 | 2 | 90% | 3 | **4,80** | NOW |
| **F4 — Mode Marchand enrichi** | 6 | 3 | 70% | 8 | **1,58** | NEXT |
| **F5 — Mode Décorateur enrichi** | 5 | 3 | 60% | 12 | **0,75** | LATER |

### Justifications détaillées

**Auth + Crédits + Stripe — Score 6,38 (NOW)**
- Reach 10 : bloque 100% des utilisateurs actuels sur le freemium, c'est la porte d'entrée de toute la monétisation.
- Impact 3 : sans cette feature, le North Star 3 000€/mois est impossible. C'est le seul chemin vers les revenus.
- Confidence 85% : stack bien documentée (Stripe Checkout + Next.js Auth.js ou Clerk), patterns connus.
- Effort 4 semaines-homme : auth provider (Clerk recommandé, setup 2j), table users + credits PG (1j), Stripe Checkout + webhooks (4-5j), gating UI sur les features (3j), tests de bout en bout paiement (2j).
- Alternative écartée : garder sans auth et facturer par email → trop fragile, impossible à auditer.

**QA automatisée — Score 4,80 (NOW)**
- Reach 8 : chaque deploy sans tests risque de casser F1/F2/F3 pour tous les utilisateurs.
- Impact 2 : pas un revenu direct mais un multiplicateur de vélocité. Sans QA, chaque nouvelle feature génère des régressions non détectées.
- Confidence 90% : Vitest + Playwright sont les outils recommandés, architecture déjà documentée dans docs/qa/qa-strategy.md.
- Effort 3 semaines-homme : 25 tests unitaires (1,5j), 7 scénarios E2E Playwright (2j), CI GitHub Actions (0,5j).
- Justification ordre : QA AVANT F4/F5 car F4 et F5 sont des features complexes — les développer sans filet augmente exponentiellement le risque de régressions sur le pipeline 2 passes.

**F4 — Mode Marchand enrichi — Score 1,58 (NEXT)**
- Reach 6 : cible Thomas (marchand de biens) + agences immobilières. [HYPOTHÈSE : 30-40% des early adopters sont des pros de l'immobilier].
- Impact 3 : feature unique sur le marché. Aucun concurrent ne génère automatiquement un dossier de pré-commercialisation complet (page de garde + visuels meublés + description du bien). Débloque le pricing Pro 29€.
- Confidence 70% : la génération de dossier PDF est un nouveau domaine technique (html2canvas ou Puppeteer), latence batch 15 photos non validée en production.
- Effort 8 semaines-homme : agent marchand GPT-4.1 (description bien + titre) + batch photos + génération PDF A4 + page de garde automatique + tests E2E batch.
- Alternative écartée : F4 avant QA → trop risqué, une régression sur le pipeline cassait tout le batch.

**F5 — Mode Décorateur enrichi — Score 0,75 (LATER)**
- Reach 5 : cible Léa (particuliers) + décorateurs freelance. [HYPOTHÈSE : 25-30% des utilisateurs cherchent des références produits réels].
- Impact 3 : différenciation forte (shopping list IKEA/LM/MdM avec liens et prix), potentiel d'affiliation V2.
- Confidence 60% : les URLs produits catalogues changent fréquemment, la qualité des liens de recherche dynamiques est à valider, la monétisation affiliés requiert des partenariats formels.
- Effort 12 semaines-homme : post-processing GPT-4.1 pour identifier le mobilier + génération liens de recherche IKEA/LM/MdM + export PDF avec QR codes + UI shopping list + tests.
- Alternative écartée : F5 avant F4 → Thomas (persona avec le plus grand pouvoir d'achat pro) est mieux servi en premier. F5 en V1 sans affiliés génère peu de revenus directs.

---

## 2. Chemin critique — Dépendances

```
[F1 + F2 + F3 — LIVRÉS]
          │
          ▼
[Auth + Crédits + Stripe]  ←── BLOQUE tout le reste
          │
          ├──► [QA automatisée]  ←── BLOQUE F4/F5 (filet de sécurité)
          │         │
          │         ▼
          │    [F4 Mode Marchand]  ←── Requiert Auth (gating Pro 29€) + QA (batch fragile)
          │         │
          │         ▼
          │    [F5 Mode Décorateur]  ←── Requiert Auth (gating Pro 29€) + QA (post-processing GPT-4.1)
          │
          └──► [Domain propre + SEO]  ←── Peut démarrer en parallèle après Auth
```

**Dépendances critiques Auth + Crédits :**
- La table `users` (Clerk ou équivalent) doit exister avant tout gating de feature.
- La table `credits` (ou colonne sur `users`) doit être mise à jour par webhook Stripe (pas côté client).
- Le `sessionId` actuel (sans auth) dans F1 doit migrer vers `userId` après auth — prévoir la migration sans casser les sessions en cours.

**Dépendances F4 :**
- Dépend du gating Auth (package Pro 29€ minimum).
- Batch multi-photos : max 15 photos en parallèle → Promise.allSettled déjà en place, à étendre.
- Génération PDF : nouvelle dépendance (Puppeteer recommandé vs html2canvas — voir section 4).

**Dépendances F5 :**
- Dépend du gating Auth (package Pro 29€ minimum).
- Nouveau crédit supplémentaire pour la shopping list (décision prise dans functional-specs.md section F5).
- Programme affiliés IKEA France : approbation formelle requise, ne pas compter dessus en V1.

---

## 3. Question stratégique — Site unique ou sites séparés pour F4/F5

### Contexte
F4 (Mode Marchand) et F5 (Mode Décorateur) sont des use cases distincts avec des personas différents (Thomas vs Léa). La question est : les intégrer dans Versiroom ou créer des sous-domaines/sites séparés ?

### Arguments pour le site unique

- **Effets réseau** : une seule base d'utilisateurs, un seul entonnoir d'acquisition, un seul SEO à construire.
- **Complexité opérationnelle** : solo développeur — maintenir 2-3 codebases est hors de portée.
- **Cohérence marque** : Versiroom est positionné multi-cible depuis le début (pills Hero "Architectes / Marchands / Particuliers"). Pas de dissonance à intégrer les modes avancés dans le même outil.
- **Packaging crédits** : un seul système de crédits couvre tous les modes — plus simple pour l'utilisateur et pour la comptabilité.
- **Précédent concurrent** : Renovate Club et Gepetto proposent tous leurs modules dans un seul produit.

### Arguments pour les sites séparés

- **SEO ciblé** : une landing page dédiée "dossier de pré-commercialisation IA" rankerait mieux sur les requêtes marchands.
- **Messaging sans compromis** : une page 100% dédiée à Thomas, sans les pills "Léa" ou "Claire".
- **Pricing distinct** : un site marchand pourrait avoir un pricing B2B (facturation à l'opération, TVA) sans mélanger avec le B2C.

### Recommandation — Site unique avec landing pages dédiées

**Décision** : conserver un seul produit et une seule codebase. Créer des landing pages dédiées par use case (ex. `/marchand`, `/decorateur`) pour le SEO et le messaging ciblé, mais l'outil reste unifié.

**Justification** : la contrainte solo développeur est déterminante. Le gain SEO d'un sous-domaine séparé ne compense pas le coût de maintenance de 2 codebases et de 2 systèmes Auth/Stripe. Les landing pages dédiées apportent 80% du bénéfice SEO pour 10% de l'effort.

**Alternative écartée** : sous-domaine `marchand.versiroom.fr` — maintenir 2 déploiements Replit + 2 bases PG + 2 Stripe webhooks = risque opérationnel inacceptable en solo.

---

## 4. Contraintes techniques

### Auth provider — Choix entre Clerk et Auth.js

| Critère | Clerk | Auth.js (NextAuth v5) |
|---|---|---|
| Setup | 2j (SDK, webhooks) | 3-4j (config manuelle) |
| Coût | Gratuit jusqu'à 10 000 MAU | Gratuit (open source) |
| Webhooks Stripe sync | Natif (user metadata) | Manuel |
| Gestion sessions | Cookie + JWT natif Next.js | JWT custom |
| Recommandation | **Préféré** | Fallback si contrainte budget |

### Stripe Checkout — Architecture recommandée

- Mode `payment` (one-shot), pas `subscription`.
- Webhook `checkout.session.completed` → incrémenter `credits` en base PG.
- Ne JAMAIS faire confiance au retour client (`success_url`) pour créditer — uniquement le webhook.
- Idempotency key sur l'INSERT credits (éviter double-crédit si webhook rejoué).

### Génération PDF F4 — Puppeteer vs html2canvas

- **Puppeteer recommandé** : rendu fidèle, export A4 propre, gestion des images base64.
- **html2canvas écarté** : qualité dégradée sur les images IA (artefacts de compression), pas de contrôle sur le rendu multi-pages.
- Contrainte Replit : Puppeteer nécessite `chromium` en dépendance système → vérifier la compatibilité Replit avant de committer.

### Catalogues meubles F5 — Liens de recherche dynamiques

- URLs produits hardcodées : obsolètes en 24-48h → écarté (décision prise dans functional-specs.md).
- Liens de recherche dynamiques (ex. `ikea.com/fr/fr/search?q=canapé+scandinave`) : stables, suffisants pour V1.
- Scraping catalogue temps réel : écarté (fragilité, CGU, coût infra).
- Programme affiliés IKEA France : approbation formelle requise avant activation — pas en V1.

### Limites Replit

- Filesystem éphémère résolu (Object Storage en place, Sprint 17b).
- Pas de workers background : les jobs longs (batch F4, PDF) doivent être traités dans la requête API avec timeout étendu ou via une file de messages (à évaluer si nécessaire).
- PostgreSQL : pool singleton en place (lib/db.ts). Ajouter table `users` et table `credits` lors du sprint Auth.

---

## 5. Risques produit — 3 hypothèses critiques à valider

### Hypothèse 1 — [HYPOTHÈSE] Les utilisateurs paient sans essai gratuit obligatoire

**Risque** : le marché du home staging IA est habitué aux modèles freemium avec essai gratuit (Renovate Club est illimité à 9,99€/mois). Un package one-shot à 4,90€ sans essai préalable pourrait avoir un taux de conversion faible.

**Impact si faux** : le MRR 5K€ nécessite 140-150 packs/mois. Si le taux de conversion visiteur → achat est <1%, il faut 15 000 visiteurs/mois pour atteindre l'objectif.

**Validation** : lancer Auth + Crédits avec 1 génération gratuite incluse (sans CB) + 3 générations supplémentaires dans le pack Starter à 4,90€. Mesurer le taux de conversion gratuit → payant sur les 30 premiers jours. Seuil d'alarme : <5% de conversion.

### Hypothèse 2 — [HYPOTHÈSE] F4 Mode Marchand justifie le prix Pro 29€

**Risque** : Thomas compare Versiroom à un home stager à 200-500€/planche. Mais il compare aussi à Renovate Club à 9,99€/mois illimité. Le pricing Pro 29€ one-shot doit justifier sa valeur par rapport à un abonnement mensuel concurrent.

**Impact si faux** : F4 est la feature différenciante la plus avancée. Si Thomas choisit Renovate Club pour le volume et Versiroom ne capte que les architectes, le potentiel de marché est réduit de moitié.

**Validation** : interviews de 5 marchands de biens avant lancement F4. Question : "Combien payez-vous actuellement pour vos visuels de pré-commercialisation ?" + présentation du packaging. Seuil d'alarme : si <3/5 disent qu'ils paieraient 29€ pour le dossier complet.

### Hypothèse 3 — [HYPOTHÈSE] La qualité du pipeline 2 passes est perçue comme supérieure aux concurrents

**Risque** : Versiroom est meilleur techniquement (préservation géométrie, styles curatés par experts) mais les utilisateurs non-experts ne perçoivent pas forcément cette différence. Sur une annonce SeLoger, une image Renovate Club à 10€/mois peut paraître "suffisamment bonne".

**Impact si faux** : la différenciation qualité ne suffit pas à justifier le premium de prix. Il faut une différenciation fonctionnelle (F4 dossiers, F5 shopping list) plutôt que qualitative.

**Validation** : A/B test qualitatif — montrer côte à côte 5 générations Versiroom vs 5 générations Renovate Club à 10 non-experts (acheteurs immobilier, pas pros). Demander : "laquelle préféreriez-vous pour une annonce ?" + "combien paieriez-vous pour celle que vous préférez ?" Sans dévoiler les outils.

---

## 6. Jalons et timeline indicative

| Étape | Feature | Durée estimée | Livrables |
|---|---|---|---|
| **Sprint 20** | Auth + Crédits + Stripe | 3-4 semaines | Table users/credits PG, Clerk integration, Stripe Checkout webhooks, gating UI 4 packages, migration sessionId→userId |
| **Sprint 21** | QA automatisée | 2-3 semaines | 25 tests Vitest, 7 scénarios Playwright, CI GitHub Actions |
| **Sprint 22-23** | F4 Mode Marchand | 6-8 semaines | Agent GPT-4.1 description bien, batch 15 photos, export PDF A4, landing page /marchand |
| **Sprint 24-26** | F5 Mode Décorateur | 10-12 semaines | Shopping list post-processing, liens dynamiques IKEA/LM/MdM, export PDF QR, landing page /decorateur |

**Note** : ces durées sont des estimations pour un solo développeur. Tout sprint peut être accéléré avec @fullstack. La QA peut démarrer en parallèle du sprint Auth dès que les premiers fichiers sont stables.

---

**Handoff → @fullstack et @data-analyst**

Fichiers produits :
- `/home/user/Architecture/docs/product/roadmap.md`

Décisions prises :
- **Ordre de livraison** : Auth/Crédits/Stripe → QA → F4 Mode Marchand → F5 Mode Décorateur (ordre confirmé dans project-context.md 2026-03-24, conservé).
- **Site unique** : pas de sous-domaine séparé pour F4/F5 — landing pages dédiées suffisantes.
- **Auth provider** : Clerk recommandé (setup rapide, webhook natif) vs Auth.js (fallback).
- **Stripe** : mode `payment` one-shot uniquement, webhook obligatoire pour créditer.
- **Puppeteer** : recommandé pour PDF F4 (à valider compatibilité Replit avant commit).

Points d'attention pour @fullstack :
- Migration `sessionId` → `userId` en F1 doit être non-breaking (utilisateurs en cours ne perdent pas leurs itérations).
- Table `credits` : idempotency key sur les INSERT via webhook Stripe (risque double-crédit si webhook rejoué).
- Batch F4 : timeout Replit à surveiller sur 15 photos en parallèle (2 passes chacune = 30 appels API).
- `ADMIN_PASSWORD` env var existe déjà — protéger les endpoints Auth/admin avec la même pattern.

Points d'attention pour @data-analyst :
- Ajouter events `package_purchased`, `credits_consumed`, `feature_gated_hit` dans le tracking plan (PostHog).
- Mesurer le taux de conversion gratuit→payant dès le premier jour de lancement Auth.
- Seuil d'alarme hypothèse 1 : taux conversion <5% sur 30 jours → revoir le packaging.
