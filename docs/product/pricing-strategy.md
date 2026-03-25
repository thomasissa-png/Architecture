# Stratégie de Pricing — Versiroom
> Produit par @product-manager — 2026-03-25
> Décisions fondateur intégrées : packages crédits (pas d'abonnement), F4 prix fixe par dossier, F5 prix fixe par dossier.

---

## 1. Benchmark prix concurrents

| Concurrent | Modèle | Prix | Ce qui est inclus | Marché cible |
|---|---|---|---|---|
| **Renovate Club (FR)** | Abonnement mensuel | 9,99€/mois ou 109,99€/an | Illimité, 80+ styles, intérieur + extérieur | Pros immo FR |
| **Gepetto (FR)** | Abonnement mensuel | Non publié (tiers "Starter" ~10 stagings/mois, "Pro" ~25 stagings/mois) | Staging + rénovation + sky + peinture, app mobile | Pros immo FR |
| **InterieurAI (FR)** | À la carte + abonnement | 1,25€/photo, abonnement illimité (prix exact [À VÉRIFIER — promo -50% annoncée en 2026]) | Essai gratuit, ~50 styles, préservation architecture | Mix particuliers + pros |
| **Pedra (EU)** | Abonnement mensuel | 29€/mois | Staging en 25s, 20 000+ pros, 1 crédit gratuit sans CB | Agents immo EU |
| **REimagineHome (US)** | Abonnement mensuel | $14 à $99/mois | Staging + démeublage + extérieur, 3 designs gratuits | Agents immo US |
| **Collov AI (US)** | À la carte + abonnement | $0,17/photo — $16/mois 60 images — $39/mois avancé | Visual agent, 300+ marques meubles, MLS-compliant | Agents immo US grands réseaux |
| **HomeDesigns AI (US)** | Abonnement | $27/mois (100 designs) — $29/mois (1 000 designs) | 80+ styles, Furniture Finder, Color Swap | Large (DIY + pro) |
| **Virtual Staging AI (US/Zillow)** | À la carte + abonnement | ~$0,53/photo — $16/mois 6 photos | Rapidité 10s, staging uniquement | Agents immo US |

**Enseignement clé :** Le marché français est dominé par l'abonnement mensuel (Renovate Club 9,99€/mois illimité, Gepetto non publié). L'unique acteur à la carte en France est InterieurAI à 1,25€/photo. Versiroom est seul sur le modèle **packages one-shot** — différenciation assumée par décision fondateur.

---

## 2. Stratégie de pricing Versiroom

### 2A. Packages crédits — Génération IA

**Coût API de référence :** ~0,10€ par génération (passe 1 + passe 2 OpenAI Responses API, voir functional-specs.md §7.1).

#### Plan gratuit — recommandation : 3 générations à l'inscription (sans CB)

**Justification :** REimagineHome offre 3 designs gratuits — c'est la norme du marché pour lever la barrière d'entrée. Pedra offre 1 crédit sans CB. 3 générations permettent à Claire de tester 3 styles différents sur la même photo (usage naturel décrit dans le persona) et de constater la qualité avant d'acheter. En dessous de 3, la démonstration de valeur est insuffisante. Au-delà de 5, le coût d'acquisition en crédits offerts devient significatif (~0,50€/nouveau compte).

#### Grille tarifaire

| Pack | Prix TTC | Crédits | Prix/crédit | Coût API/crédit | Marge brute | % marge | Profil cible |
|---|---|---|---|---|---|---|---|
| **Découverte** | 4,90€ | 5 | 0,98€ | 0,10€ | 4,40€ | 90% | Léa — test ponctuel, 1 appartement |
| **Starter** | 14,90€ | 20 | 0,745€ | 0,10€ | 12,90€ | 87% | Léa régulière / Claire découverte |
| **Pro** | 29€ | 50 | 0,58€ | 0,10€ | 24,00€ | 83% | **Claire — volume mensuel normal** |
| **Studio** | 69€ | 150 | 0,46€ | 0,10€ | 54,00€ | 78% | Thomas / agences — gros volumes |

> Prix HT. TVA 20% applicable pour les particuliers. Claire et Thomas récupèrent la TVA (usage professionnel).

**Justification vs concurrents :**
- Vs InterieurAI (1,25€/photo à la carte) : Versiroom Pro à 0,58€/photo est 54% moins cher sur le volume, tout en étant perçu comme premium (pipeline 2 passes, styles curatés).
- Vs Renovate Club (9,99€/mois illimité) : Versiroom ne joue pas le même terrain. L'illimité de Renovate Club génère de la quantité ; Versiroom génère de la qualité. Thomas dépensait 200-500€/planche — 0,58€ est une réduction de 99,8%.
- Vs Collov ($0,17/photo) : imbattable sur le prix brut, mais 100% US sans localisation France et sans pipeline qualité.

**Plan recommandé mis en avant visuellement** : Pack Pro (29€ / 50 crédits) — ancrage psychologique sur "moins de 0,60€ par photo".

#### Feature gating par pack

| Feature | Gratuit | Découverte | Starter | Pro | Studio |
|---|---|---|---|---|---|
| Générations standard (12 styles) | 3 | 5 | 20 | 50 | 150 |
| Itérations par photo (F1) | 0 | 0 | 1 | 3 | 5 |
| Type de pièce (F2) | Oui | Oui | Oui | Oui | Oui |
| Mode Extérieur (F3) | Oui | Oui | Oui | Oui | Oui |
| Mode Marchand (F4) | Non | Non | Non | Oui (max 10 photos/dossier) | Oui (max 15 photos) |
| Mode Décorateur — Shopping list (F5) | Non | Non | Non | Oui (+1 crédit/liste) | Oui (+1 crédit/liste) |
| Export PDF | Non | Non | Non | Oui | Oui |
| Lien partageable | Non | Non | Oui (7j) | Oui (30j) | Oui (90j) |
| Téléchargement HD | Oui | Oui | Oui | Oui | Oui |

**Justification du gating F4/F5 sur Pro+ uniquement :** F4 (Mode Marchand) et F5 (Décorateur) ont un coût marginal plus élevé (génération PDF, shopping list GPT-4.1 ~0,13€ vs 0,10€). Réserver ces features aux packs Pro et Studio crée un incitatif clair à monter en gamme pour Thomas et les agences. Le Starter couvre le besoin de Léa et de Claire en phase découverte.

---

### 2B. F4 Mode Marchand — Prix fixe par dossier

**Définition du dossier :** Upload d'un bien immobilier complet (jusqu'à 15 photos), génération des visuels meublés, constitution automatique d'un dossier PDF de pré-commercialisation (page de garde, description du bien générée par GPT-4.1, visuels avant/après organisés par pièce, watermark optionnel).

**Prix recommandé : 29€ par dossier (5-15 photos)**

**Justification :**
- Référence marché : un home stager humain facture 200-500€ par planche, soit 1 000-3 000€ pour un appartement 5 pièces. Versiroom à 29€ représente une économie de 97-99%.
- Référence concurrents IA : aucun concurrent ne propose de dossier PDF automatisé. C'est une feature unique — le prix peut être premium sans référence directe.
- Coût API estimé : 15 photos × 0,10€ + génération PDF (0,10€ serverless) + description GPT-4.1 (~0,05€) = ~1,65€ de coût IA. Marge brute de 94% à 29€.
- Psychologie du prix : 29€ est le même prix que le Pack Pro (50 crédits). L'utilisateur perçoit le Mode Marchand comme une valeur équivalente à 50 générations individuelles — l'ancrage est favorable.
- Thomas paie son home stager entre 200 et 500€ pour ce qu'un dossier Versiroom fait en 10 minutes à 29€. L'argument ROI est imparable.

**Volume discount :** [HYPOTHÈSE — à valider en phase go-to-market]
- 1 dossier : 29€
- 5 dossiers : 120€ (24€/dossier, -17%)
- 10 dossiers : 220€ (22€/dossier, -24%)

Le volume discount cible les agences immobilières (persona secondaire) qui traitent 20-50 mandats/mois. À valider avant implémentation par une série d'entretiens Thomas.

---

### 2C. F5 Mode Décorateur — Prix fixe par dossier

**Définition du dossier :** Génération d'une shopping list de 10-15 produits réels sourcés (avec liens d'achat, prix indicatifs, alternatives budget), export PDF format moodboard pour présentation client.

**Prix recommandé : 9€ par dossier (1 pièce + shopping list)**

**Justification :**
- Positionnement : c'est une feature "plus" — le visuel existe déjà (il a coûté 1 crédit). Le dossier Décorateur est la valeur ajoutée sur le contenu, pas sur la génération image.
- Coût API : génération shopping list GPT-4.1 (~0,02€) + PDF (~0,01€) = ~0,03€. Marge brute de 99,7% à 9€.
- Psychologie : 9€ est un achat impulsif pour Léa (profil digital native, habituée aux micro-transactions). Pour Claire, c'est une note de frais anecdotique face aux 2-3h économisées sur la constitution d'un moodboard manuel.
- Ancrage : 9€ par rapport au 29€ du Pack Pro — le Décorateur est perçu comme un add-on abordable.
- Risque de cannibalisation du Pack Studio : faible — les utilisateurs Studio consomment la shopping list en crédits (+1 crédit/liste à 0,46€), ce qui est inférieur aux 9€ one-shot. Fidélise les gros volumes.

---

## 3. Psychologie des prix

**Ancrage principal :** Le Pack Pro (29€ / 50 crédits) est l'offre visuellement mise en avant avec un badge "Recommandé". Il ancre la perception de valeur pour toute la grille. Les packs Découverte et Starter semblent accessibles en comparaison, le Studio semble logique pour les pros volume.

**Price ending :** 4,90€ et 14,90€ utilisent le .90 (perception de prix bas, marché B2C Léa). 29€ et 69€ utilisent des chiffres ronds (perception de sérieux, marché B2B Thomas et Claire). Cohérence avec les deux segments.

**Affichage recommandé :**
- Afficher le prix **par photo** sous chaque pack (ex. "0,58€ / photo") — c'est le repère de décision de Thomas.
- Afficher le prix **total** en grand et le prix/photo en petit — le total doit être visible pour les petits packs (décision d'achat rapide), le ratio pour les grands.
- Ne pas afficher de "économisez X% vs home stager humain" sur la page pricing — réserver cet argument pour la landing page et les pages personas. Sur la page pricing, l'utilisateur a déjà décidé d'acheter.
- F4 Mode Marchand : afficher "29€ vs 200-500€ chez un prestataire" — la comparaison est pertinente ici car c'est une décision d'investissement, pas une consommation de crédits.

**Plan gratuit :** Afficher les 3 générations gratuites sans badge "Freemium" — utiliser "Essaie gratuitement, sans carte bancaire" comme CTA. Le mot "Freemium" positionne trop bas pour une marque premium.

---

## 4. Modélisation — Projection MRR à 6 mois

### 4.1 Hypothèses communes [HYPOTHÈSE — à valider avec données réelles]

- Coût infra fixe mensuel : 50€ (Replit + PostgreSQL)
- Coût acquisition phase 1 : 0€ (SEO organique + bouche-à-oreille)
- Taux de conversion gratuit → payant : [HYPOTHÈSE : 8-12% — benchmark SaaS B2C similaires]
- ARPU cible (mix de packs) : [HYPOTHÈSE : 22-28€ par transaction — mix Starter 40% + Pro 45% + Studio 15%]
- Croissance mensuelle base d'utilisateurs : [HYPOTHÈSE : +30% par mois en phase de lancement, décroissant à +15% au mois 4-6]

### 4.2 ARPU estimé

| Mix de ventes | Calcul | ARPU |
|---|---|---|
| Starter 40% + Pro 45% + Studio 15% | (14,90×0,40) + (29×0,45) + (69×0,15) | 5,96 + 13,05 + 10,35 = **29,36€** |

[HYPOTHÈSE : mix basé sur le comportement habituel des utilisateurs SaaS B2B/B2C — les pros tendent vers Pro et Studio, les particuliers vers Starter]

### 4.3 Projections MRR — 3 scénarios

| Scénario | Transactions/mois | Recettes brutes | Marge brute (~86%) | Marge nette (- 50€ infra) | Commentaire |
|---|---|---|---|---|---|
| **Conservateur** | 60 | 60 × 22€ = 1 320€ | 1 135€ | 1 085€ | Traction lente, SEO non indexé |
| **Base** | 140 | 140 × 26€ = 3 640€ | 3 130€ | 3 080€ | KPI North Star atteint (3 000€ marge nette) |
| **Optimiste** | 220 | 220 × 29€ = 6 380€ | 5 487€ | 5 437€ | Viral loop actif, Claire prescrit à ses confrères |

> L'objectif KPI North Star (3 000€/mois marge nette) est atteint dans le **scénario Base à 140 transactions/mois**, soit ~4,7 transactions par jour. C'est un objectif réaliste pour un produit avec 3 générations gratuites et une audience pro.

### 4.4 Hypothèses à valider

1. [HYPOTHÈSE] Taux de conversion gratuit → payant : 8-12%. Source : benchmarks SaaS B2C. À mesurer dès le premier mois post-lancement.
2. [HYPOTHÈSE] ARPU 22-29€. Dépend fortement du ratio Starter/Pro/Studio réel — à ajuster après 30 premiers achats.
3. [HYPOTHÈSE] Croissance +30%/mois. Fragile sans donnée de référence. À revoir si le SEO prend plus de 3 mois à indexer.
4. [HYPOTHÈSE] Volume discount F4 (-17%/-24%). Aucune validation terrain avec Thomas. À ne pas implémenter avant 3 entretiens marchands de biens.
5. [HYPOTHÈSE] Coût infra 50€/mois. À reconfirmer avec @infrastructure sur la configuration Replit actuelle.

---

## 5. Décisions prises — Résumé actionnable

| Décision | Valeur | Justification |
|---|---|---|
| Modèle | Packages one-shot (pas d'abonnement) | Décision fondateur, différenciation vs Renovate Club / Gepetto |
| Plan gratuit | 3 générations sans CB | Aligné REimagineHome (3 gratuits), démontre la qualité 2 passes |
| Pack mis en avant | Pro 29€ / 50 crédits | Ancrage psychologique, profil Claire (usage mensuel normal) |
| F4 Mode Marchand | 29€/dossier fixe | ROI vs home stager humain (200-500€), marge 94% |
| F5 Mode Décorateur | 9€/dossier fixe | Micro-transaction, marge >99%, add-on post-génération |
| Feature gating F4/F5 | Pro et Studio uniquement | Coût marginal supérieur, incitatif montée en gamme |
| Volume discount F4 | [HYPOTHÈSE] À valider avant implémentation | Risque de complexité pricing sans validation terrain |

---

**Handoff → @growth**
- Fichiers produits : `/home/user/Architecture/docs/product/pricing-strategy.md`
- Décisions prises : packages one-shot (4 tiers), 3 générations gratuites sans CB, F4 à 29€/dossier, F5 à 9€/dossier, Pack Pro mis en avant comme ancrage
- Points d'attention pour @growth :
  - Le taux de conversion gratuit → payant (8-12%) est une hypothèse critique — instrumenter dès J1 post-lancement auth
  - Thomas est le profil le plus sensible au ROI (200-500€ → 29€) — l'argument dossier marchand est à traiter dans les séquences d'activation et les ads si paid activé
  - Le Pack Studio (69€) cible les agences immobilières (persona secondaire) — identifier un canal B2B dédié (LinkedIn, partenariats portails immo)
  - Aucun concurrent français ne propose de dossier PDF automatisé — à exploiter dans les contenus SEO et les démos
- Hypothèses à valider en priorité : taux de conversion, ARPU réel post 30 premiers achats, volume discount F4

**Handoff → @legal**
- TVA 20% applicable pour les particuliers (Léa), récupérable pour les pros (Claire, Thomas)
- Modèle one-shot = pas d'abonnement récurrent = pas de prélèvement SEPA, pas de résiliation à gérer — simplifie les CGV
- Générations gratuites sans CB = pas de données bancaires collectées à l'inscription — impact sur les CGU et la politique de confidentialité
- F4 dossier marchand : vérifier si les visuels générés nécessitent un disclaimer "image générée par IA" pour usage sur portails immobiliers (conformité loi anti-fraude immo)
