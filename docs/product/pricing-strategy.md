# Stratégie de Pricing — Versiroom

> Produit par @product-manager — 2026-03-27 (v3)
> Refonte fondateur : 3 tiers uniquement (Découverte/Starter/Pro), recharge crédits au prix du tier souscrit.
> Remplace intégralement la version précédente (4 tiers + packs one-shot).

---

## 1. Benchmark prix concurrents

| Concurrent | Modèle | Prix | Inclus | Marché |
|---|---|---|---|---|
| **Renovate Club (FR)** | Abonnement | 9,99€/mois illimité | 80+ styles, intérieur + extérieur | Pros immo FR |
| **Gepetto (FR)** | Abonnement | Non publié (Starter ~10/mois, Pro ~25/mois) | Staging + rénovation, app mobile | Pros immo FR |
| **Pedra (EU)** | Abonnement | 29€/mois | Staging 25s, 20 000+ pros | Agents immo EU |
| **InterieurAI (FR)** | Mixte | 1,25€/photo ou abonnement | ~50 styles, préservation archi | Mix |
| **REimagineHome (US)** | Abonnement | $14-99/mois | 3 designs gratuits | Agents immo US |
| **Collov AI (US)** | Mixte | $0,17/photo — $16-39/mois | 300+ marques, MLS-compliant | Grands réseaux US |

**Enseignement** : le marché FR est dominé par l'abonnement. Pedra (29€/mois) est le benchmark EU. Versiroom adopte un modèle 3 tiers avec recharge — simplicité + flexibilité.

---

## 2. Les 3 tiers Versiroom

### Décision fondateur (non négociable)

- **3 tiers seulement** : Découverte (gratuit), Starter (one-shot), Pro (abonnement)
- **Seul le Pro est en abonnement mensuel** — Starter est un achat unique
- **Recharge de crédits** au prix unitaire du tier acheté/souscrit
- Plus de packs séparés — le modèle est tier + recharge

### Coût API de référence

~0,10€ par génération (passe 1 + passe 2 OpenAI Responses API).

---

### Tier 1 — Découverte (GRATUIT)

| | |
|---|---|
| **Prix** | 0€ — sans carte bancaire, sans inscription obligatoire |
| **Crédits inclus** | 3 générations offertes (one-time) |
| **Recharge** | Non disponible — upgrade vers Starter ou Pro pour continuer |
| **Features** | 12 styles intérieurs + 8 styles extérieurs, comparateur avant/après, téléchargement HD, sans filigrane |
| **Exclusions** | Mode Pro (dossiers), itérations, annonces publiques, export portails |
| **Persona cible** | Léa (test), Claire (découverte), Thomas (évaluation) |

**Justification** : 3 générations = tester 3 styles sur la même photo (usage naturel de Claire). Suffisant pour démontrer la qualité du pipeline 2 passes. En dessous de 3, la démonstration de valeur est insuffisante. Au-dessus de 5, le coût d'acquisition en crédits offerts devient significatif (~0,50€/nouveau compte). Aligné sur REimagineHome (3 designs gratuits).

---

### Tier 2 — Starter

| | |
|---|---|
| **Prix** | 9,90€ TTC — **achat unique** (pas d'abonnement) |
| **Crédits inclus** | 15 générations (pas de renouvellement mensuel, pas d'expiration) |
| **Recharge** | +10 crédits = 5,90€ (0,59€/crédit) |
| **Features** | Tout Découverte + 1 itération par photo + historique des générations |
| **Exclusions** | Mode Pro (dossiers, PDF brandé, annonces), export portails |
| **Persona cible** | Léa (usage ponctuel), Claire (projets ponctuels) |
| **Coût API** | 15 × 0,10€ = 1,50€ |
| **Marge brute** | 8,40€ (85%) |

**Justification** : 9,90€ est le prix psychologique du "premier achat" — micro-transaction impulsive pour Léa. Le modèle one-shot (pas d'abonnement) colle à l'usage ponctuel de Léa (1 appartement, pas d'usage récurrent) et de Claire en projet unique. Seul le Pro est en abonnement — les professionnels récurrents (Thomas, Claire multi-projets) ont besoin du renouvellement mensuel, pas les particuliers.

**Recharge Starter** : 0,59€/crédit. Les crédits Starter n'expirent pas — l'utilisateur recharge quand il en a besoin, au même prix unitaire. Pas de pression temporelle.

---

### Tier 3 — Pro

| | |
|---|---|
| **Prix** | 29€/mois TTC (badge "Prix de lancement") |
| **Crédits inclus** | 50 générations/mois (renouvelés, non cumulables) |
| **Recharge** | +20 crédits = 9€ (0,45€/crédit) |
| **Features** | Tout Starter + Mode Pro complet : dossiers de pré-commercialisation batch (jusqu'à 15 photos), PDF brandé (logo, couleurs, coordonnées), annonces publiques illimitées, liens partageables acquéreurs sans limite de durée, export portails immo, 3 itérations par photo, description IA, enrichissement adresse |
| **Persona cible** | Thomas (usage principal), Claire (multi-projets) |
| **Coût API** | 50 × 0,10€ = 5€/mois |
| **Marge brute** | 24€/mois (83%) |

**Justification** : 29€/mois aligné sur Pedra (29€, 20 000+ pros EU). 50 crédits couvrent le pic d'activité de Thomas (8-12 ops/an = 3-5 photos/op = 40-60 photos en mois chargé). Le Mode Pro (dossiers, PDF, annonces) est le différenciateur principal — c'est ce que Thomas paie réellement, les crédits sont le véhicule.

**Recharge Pro** : 0,45€/crédit — le prix le plus bas de toute la grille. Fidélise les gros volumes sans créer un tier "agences" complexe.

---

## 3. Grille de recharge par tier

| Tier | Pack recharge | Prix TTC | Crédits | Prix/crédit | Marge |
|---|---|---|---|---|---|
| Découverte | ❌ Non disponible | — | — | — | — |
| **Starter** | +10 crédits | 5,90€ | 10 | 0,59€ | 83% |
| **Starter** | +25 crédits | 12,90€ | 25 | 0,52€ | 81% |
| **Pro** | +20 crédits | 9€ | 20 | 0,45€ | 78% |
| **Pro** | +50 crédits | 19€ | 50 | 0,38€ | 74% |

> Les crédits rechargés sont valables 90 jours (pas de renouvellement mensuel).
> La recharge n'est accessible qu'aux abonnés actifs — vérification côté serveur via statut Stripe subscription.
> Un utilisateur Découverte (gratuit) ne peut pas recharger — il doit upgrader vers Starter ou Pro.

**Logique de la grille** :
- Starter +10 (5,90€) : micro-transaction pour Léa qui veut "juste 2-3 de plus"
- Starter +25 (12,90€) : Claire en pic de projets
- Pro +20 (9€) : Thomas en fin de trimestre, opération imprévue
- Pro +50 (19€) : agences ou marchands en haute saison

---

## 4. Feature gating par tier

| Feature | Découverte | Starter | Pro |
|---|---|---|---|
| Générations intérieures (12 styles) | ✅ | ✅ | ✅ |
| Générations extérieures (8 styles) | ✅ | ✅ | ✅ |
| Comparateur avant/après | ✅ | ✅ | ✅ |
| Téléchargement HD sans filigrane | ✅ | ✅ | ✅ |
| Partage WhatsApp / copie lien | ✅ | ✅ | ✅ |
| Itérations par photo | 0 | 1 | 3 |
| Historique des générations | ❌ | ✅ | ✅ |
| Mode Pro (dossiers batch) | ❌ | ❌ | ✅ |
| PDF brandé (logo, couleurs) | ❌ | ❌ | ✅ |
| Annonces publiques | ❌ | ❌ | ✅ |
| Liens partageables sans limite | ❌ | ❌ | ✅ |
| Export portails immo | ❌ | ❌ | ✅ |
| Description IA | ❌ | ❌ | ✅ |
| Enrichissement adresse | ❌ | ❌ | ✅ |
| Recharge crédits | ❌ | ✅ | ✅ |

---

## 5. Unit economics et projection North Star

### Par tier

| Tier | Prix/mois | Coût API | Marge brute | % marge |
|---|---|---|---|---|
| Découverte | 0€ | 0,30€ (one-time) | -0,30€ | — |
| Starter | 9,90€ | 1,50€ | 8,40€ | 85% |
| Pro | 29€ | 5€ | 24€ | 83% |

### Projection North Star (3 000€/mois marge nette)

Hypothèse : marge nette = marge brute - coûts fixes (hébergement ~50€/mois, domaine ~10€/mois).

| Scénario | Mix | Abonnés | Recharges | Marge nette/mois |
|---|---|---|---|---|
| **Conservateur** | Starter dominant | 150 Starter (one-shot) + 40 Pro (abo) | +500€ recharges | 150×8,40 + 40×24 + 500 - 60 = **2 660€** |
| **Base** | Mixte | 120 Starter (one-shot) + 80 Pro (abo) | +800€ recharges | 120×8,40 + 80×24 + 800 - 60 = **3 668€** ✅ |
| **Optimiste** | Pro dominant | 80 Starter (one-shot) + 120 Pro (abo) | +1200€ recharges | 80×8,40 + 120×24 + 1200 - 60 = **4 692€** |

**Note** : les Starter sont des achats uniques, pas récurrents. Le revenu Starter dépend du flux de nouveaux utilisateurs. Le Pro (abonnement) génère le revenu récurrent. Les recharges (Starter + Pro) complètent.

**Seuil North Star** : ~80 Pro abonnés + flux Starter + recharges = 3 000€/mois.

---

## 6. Migration depuis l'ancien modèle

### Ce qui change

| Avant (v2) | Après (v3) |
|---|---|
| 4 tiers (Gratuit + Découverte 4,90€ + Starter 14,90€ + Pro 29€) | 3 tiers (Découverte gratuit + Starter 9,90€ one-shot + Pro 29€/mois) |
| Packs one-shot séparés | Starter = one-shot, Pro = abonnement, recharge pour les deux |
| Découverte = pack payant 4,90€/5 crédits | Découverte = gratuit (3 crédits) |
| Starter = pack payant 14,90€/20 crédits | Starter = achat unique 9,90€, 15 crédits sans expiration |
| Tout en one-shot sauf Pro | Seul le Pro est en abonnement mensuel (50 crédits renouvelés) |

### Impact code

- **Stripe** : créer 1 subscription (Pro 29€/mois) + 1 produit one-time (Starter 9,90€) + 4 produits recharge (one-time payments)
- **page /pricing** : refondre avec 3 colonnes au lieu de 4, highlight sur Pro
- **pages /marchand, /architecte, /particulier** : mettre à jour les mentions de prix
- **lib/credits.ts** : adapter la logique de recharge (vérifier tier actif, appliquer le bon prix)
- **middleware auth** : vérifier le tier pour le feature gating (Mode Pro = Pro only)

---

## 7. Présentation sur /pricing

### Recommandation layout

3 colonnes, Pro en highlight (bordure sage, badge "Recommandé") :

| | Découverte | Starter | **Pro** |
|---|---|---|---|
| Prix | Gratuit | 9,90€ (one-shot) | **29€/mois** |
| Crédits | 3 offertes | 15 (sans expiration) | **50/mois** |
| Itérations | — | 1/photo | **3/photo** |
| Mode Pro | — | — | **✅ Complet** |
| Recharge | — | Dès 5,90€ | **Dès 9€** |
| CTA | Essayer | S'abonner | **S'abonner** |

Le Pro est le tier mis en avant (ancrage à 29€ vs 200-500€ home stager). Le Starter est le stepping stone pour Léa et les architectes occasionnels.

---

## Handoff

→ **@fullstack** : implémenter les 2 subscriptions Stripe + 4 produits recharge + refondre /pricing + mettre à jour les 3 landing pages
→ **@copywriter** : adapter le copy /pricing avec les 3 tiers et le mécanisme de recharge
→ **@legal** : vérifier la conformité des abonnements (droit de rétractation contenu numérique, case à cocher)

---

## Hypothèses à valider

- [HYPOTHÈSE] : 9,90€ Starter vs 14,90€ — à A/B tester après lancement
- [HYPOTHÈSE] : 15 crédits/mois Starter suffisent pour Léa — surveiller le taux de recharge M1-M3
- [HYPOTHÈSE] : le ratio Starter/Pro sera 50/50 — ajuster projection si données divergent
- [HYPOTHÈSE] : les recharges représentent ~25% du revenu — à mesurer
