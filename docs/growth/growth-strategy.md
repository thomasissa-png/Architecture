# Stratégie Growth — VisiRénov
> Produit par @growth — 2026-03-25
> Sources : project-context.md, pricing-strategy.md, kpi-framework.md, personas.md, competitive-benchmark.md
> Objectif : 3 000€/mois de marge nette = ~140 transactions/mois (KPI North Star)

---

## Section 1 — Unit Economics par persona

### Hypothèses de calcul

Coût IA par génération : 0,10€ (2 passes OpenAI gpt-4.1, source : pricing-strategy.md §2A).
Coût infra Replit + PostgreSQL + Object Storage : [HYPOTHESE : 40-80€/mois fixe, hors acquisition].
Coût acquisition par canal : estimé ci-dessous, aucune donnée terrain disponible en alpha.

### Tableau unit economics

| Métrique | Claire (Architecte) | Thomas (Marchand) | Léa (Acheteuse) |
|---|---|---|---|
| **Package d'entrée naturel** | Pro 29€ (50 crédits) | Studio 69€ (150 crédits) ou F4 29€/dossier | Découverte 4,90€ ou Starter 14,90€ |
| **Fréquence d'achat estimée** | [HYPOTHESE : 1 pack/mois — 2-3 opérations mois] | [HYPOTHESE : 1 pack/opération, 8-12 ops/an = 1 pack/mois en pic] | [HYPOTHESE : 1 pack unique, renouvellement si déménagement] |
| **Panier moyen** | 29€ | 50€ (mix Studio + F4 dossier) | 9,90€ (mix Découverte + Starter) |
| **Durée de vie estimée** | [HYPOTHESE : 12 mois — usage récurrent tant que le cabinet tourne] | [HYPOTHESE : 6 mois actifs/an — saisonnalité immo] | [HYPOTHESE : 2-3 mois — pic autour de l'emménagement] |
| **LTV estimée** | 29€ × 12 = **348€** | 50€ × 8 = **400€** | 9,90€ × 2 = **~20€** |
| **CAC cible SEO** | [HYPOTHESE : 10-20€] | [HYPOTHESE : 15-30€] | [HYPOTHESE : 2-5€] |
| **CAC cible Paid (Meta/Google)** | [HYPOTHESE : 40-80€] | [HYPOTHESE : 60-120€] | [HYPOTHESE : 8-20€] |
| **CAC cible Referral** | [HYPOTHESE : 5-15€] | [HYPOTHESE : 10-25€] | [HYPOTHESE : 1-5€] |
| **Ratio LTV/CAC (SEO)** | 348 / 15 = **23x** | 400 / 22 = **18x** | 20 / 3 = **7x** |
| **Ratio LTV/CAC (Paid)** | 348 / 60 = **6x** | 400 / 90 = **4x** | 20 / 14 = **1,4x — SOUS LE SEUIL** |

> ALERTE : Léa via paid est non-rentable (LTV/CAC < 3x). Elle doit être acquise via SEO, viral ou referral uniquement. Aucun budget paid pour ce persona avant validation LTV terrain.

> Toutes les LTV et CAC sont des hypothèses de travail. À recalibrer à J+60 avec les premières cohortes payantes.

---

## Section 2 — Top 3 canaux par persona

### Claire — Architecte d'intérieur

| Rang | Canal | Justification |
|---|---|---|
| 1 | **SEO longue traîne pro** | Claire cherche activement des outils sur Google ("outil home staging architecte", "rendu intérieur rapide client") — intention d'achat explicite, LTV/CAC > 20x. |
| 2 | **LinkedIn outreach ciblé** | Claire est sur LinkedIn, abonnée à des comptes d'archi d'intérieur. Un post montrant un avant/après concret sur une pièce chantier convertit sans budget. |
| 3 | **Referral professionnel** | Les architectes recommandent leurs outils entre eux (réseau DPLG, forums ArchiExpo). Un programme referral B2B avec crédit offert au parrain est activable en J+14. |

### Thomas — Marchand de biens

| Rang | Canal | Justification |
|---|---|---|
| 1 | **LinkedIn outreach marchands + réseaux immo** | Thomas est sur LinkedIn, dans des groupes Facebook marchands de biens, sur des forums SNPI. Un message direct montrant "29€ vs 500€ home stager" déclenche immédiatement l'intérêt. |
| 2 | **SEO requêtes transactionnelles immo** | Requêtes : "home staging virtuel appartement", "visuels meublés annonce immobilière", "staging IA marchands de biens" — intention d'achat forte, Thomas cherche des outils. |
| 3 | **Partenariats réseaux immobiliers** | Un accord avec une école de marchands de biens (Bevouac, Club Immobilier) ou un groupement (APAS, Pluris Immobilier) donne accès à des centaines de Thomas d'un coup. |

### Léa — Acheteuse particulière

| Rang | Canal | Justification |
|---|---|---|
| 1 | **Partage natif viral (WhatsApp + Instagram)** | Léa partage déjà ses coups de coeur déco. Le résultat avant/après VisiRénov dans sa propre pièce est nativement partageable — boucle virale gratuite. |
| 2 | **SEO inspiration déco** | Requêtes : "visualiser sa déco avant achat", "home staging virtuel appartement gratuit", "décoration intérieure IA" — Léa cherche sur Google avant de télécharger une app. |
| 3 | **Pinterest (contenu organique)** | Léa est sur Pinterest pour l'inspiration déco. Des épingles avant/après stylisées (Japandi, Scandinave) avec lien vers VisiRénov captent une audience qualifiée au moment exact où elle cherche de l'inspiration. |

---

## Section 3 — Boucle virale : amplifier le partage existant

### Diagnostic de l'existant

Le partage WhatsApp, copie d'image et native share (iOS) sont en place dans ImageComparator.tsx (Sprint 2, correction 11). C'est un socle fonctionnel. Le problème : le partage existe mais n'est pas incentivé.

### Trois leviers pour amplifier

**Levier 1 — Watermark discret "Généré avec VisiRénov" sur les exports HD**

Chaque image téléchargée ou partagée porte un watermark bas de gamme discret en bas à droite. Quand Thomas l'envoie à un acquéreur ou que Léa le poste sur Instagram, le visuel se fait sa propre publicité. Implémentation : canvas overlay côté client avant le téléchargement, texte blanc semi-transparent. Coût : zéro. Délai : < 1 semaine.

Ajout d'une option "Retirer le watermark" réservée aux packs Pro et Studio — crée un incitatif à monter en gamme.

**Levier 2 — Referral program simple : 5 crédits offerts au parrain + 3 à l'invité**

Mécanique : chaque utilisateur inscrit reçoit un lien de parrainage. Si l'invité génère au moins 1 image, le parrain reçoit 5 crédits (valeur 0,50€ coût API, valeur perçue 4-8€). L'invité reçoit 3 crédits gratuits supplémentaires (en plus des 3 du plan gratuit). Côté technique : requiert que l'auth soit en place (étape 4 de la roadmap). À préparer maintenant, activer au lancement Auth.

Mécanique activable immédiatement sans auth : sur la page de résultat, bouton "Partager et obtenir 3 crédits bonus à l'inscription" qui génère un lien avec paramètre UTM ref. Au lancement Auth, le système est rétroactif.

**Levier 3 — "Galerie de réalisations" publique (opt-in)**

Proposer à chaque utilisateur d'ajouter son avant/après à une galerie publique sur le site (opt-in explicite, RGPD conforme). La galerie fonctionne comme preuve sociale permanente, génère du SEO image, et donne envie aux visiteurs d'essayer. Chaque image en galerie porte un lien "Créer le vôtre". Coût de mise en place : 3-5 jours développement. Impact : preuves sociales permanentes + SEO.

---

## Section 4 — Projection M1-M6

### Hypothèses structurantes

- Lancement Auth + Crédits + Stripe : M2 (conforme roadmap.md)
- SEO commence à générer du trafic qualifié : M3-M4 (délai d'indexation)
- Prix moyen par transaction : [HYPOTHESE : 22€ — mix Découverte 15% + Starter 25% + Pro 40% + Studio 15% + F4 5%]
- Marge brute moyenne : [HYPOTHESE : 87% — pondération des marges par tier (source : pricing-strategy.md)]
- Coût infra fixe : [HYPOTHESE : 60€/mois]
- Coût acquisition mensuel : cf. scénarios ci-dessous

### Tableau de projection M1-M6

| Mois | Scenario | Visiteurs/mois | Taux activation (→ 1 gen gratuite) | Taux conversion (→ achat) | Transactions | Revenu brut | Coût IA | Coût infra | Budget acq. | Marge nette |
|---|---|---|---|---|---|---|---|---|---|---|
| **M1** (alpha, pas d'auth) | Base | 300 | 40% | 0% | 0 | 0€ | ~12€ (gen test) | 60€ | 0€ | **-72€** |
| **M2** (lancement Auth+Stripe) | Conservateur | 600 | 35% | 2% | 4 | 88€ | 40€ | 60€ | 50€ | **-62€** |
| **M2** | Base | 800 | 40% | 3% | 10 | 220€ | 100€ | 60€ | 100€ | **-40€** |
| **M2** | Optimiste | 1 200 | 45% | 4% | 22 | 484€ | 200€ | 60€ | 150€ | **+74€** |
| **M3** (SEO démarre) | Conservateur | 900 | 35% | 3% | 9 | 198€ | 90€ | 60€ | 80€ | **-32€** |
| **M3** | Base | 1 500 | 40% | 4% | 24 | 528€ | 240€ | 60€ | 120€ | **+108€** |
| **M3** | Optimiste | 2 500 | 45% | 5% | 56 | 1 232€ | 560€ | 60€ | 200€ | **+412€** |
| **M4** (SEO + referral) | Conservateur | 1 200 | 35% | 4% | 17 | 374€ | 170€ | 60€ | 80€ | **+64€** |
| **M4** | Base | 2 500 | 40% | 5% | 50 | 1 100€ | 500€ | 60€ | 150€ | **+390€** |
| **M4** | Optimiste | 4 000 | 50% | 6% | 120 | 2 640€ | 1 200€ | 60€ | 250€ | **+1 130€** |
| **M5** (F4 Marchand live) | Conservateur | 1 500 | 35% | 4% | 21 | 462€ | 210€ | 60€ | 100€ | **+92€** |
| **M5** | Base | 3 500 | 42% | 6% | 88 | 1 936€ | 880€ | 60€ | 200€ | **+796€** |
| **M5** | Optimiste | 6 000 | 50% | 7% | 210 | 4 620€ | 2 100€ | 60€ | 300€ | **+2 160€** |
| **M6** (cible North Star) | Conservateur | 2 000 | 35% | 5% | 35 | 770€ | 350€ | 60€ | 120€ | **+240€** |
| **M6** | Base | 5 000 | 42% | 7% | 147 | 3 234€ | 1 470€ | 60€ | 250€ | **+1 454€** |
| **M6** | Optimiste | 9 000 | 50% | 8% | 360 | 7 920€ | 3 600€ | 60€ | 400€ | **+3 860€** |

> ALERTE : Le scénario conservateur n'atteint pas 3 000€/mois de marge nette à M6. Le North Star est atteignable en scénario Base (1 454€ à M6, extrapolation à 3 000€ vers M8-M9) ou en scénario Optimiste (M5-M6). La variable critique est le taux de conversion visiteur → acheteur, non le trafic. Priorité absolue : optimiser l'onboarding des 3 générations gratuites pour maximiser la conversion.

### Seuils d'alarme

- Si taux activation < 25% à M2 : retravailler l'onboarding (UX) avant d'investir en acquisition
- Si taux conversion < 2% à M3 : suspect pricing ou valeur perçue — tester Starter à 9,90€ (split test)
- Si panier moyen < 15€ à M4 : le mix penche trop vers Léa (faible LTV) — renforcer acquisition Claire et Thomas
- Si coût IA dépasse 50% du revenu brut : revoir le coût par passe ou introduire un plafond de générations daily

### Canaux prioritaires M1-M6 et budget indicatif

| Canal | Budget M1-M2 | Budget M3-M4 | Budget M5-M6 | Objectif |
|---|---|---|---|---|
| SEO (temps fondateur) | 0€ + 2h/sem | 0€ + 3h/sem | 0€ + 2h/sem | Trafic organique durable, requêtes pro |
| LinkedIn outreach (manuel) | 0€ + 3h/sem | 0€ + 2h/sem | 0€ + 1h/sem | Acquisition Thomas + Claire direct |
| Referral program | 0€ (préparation) | Crédits offerts ~50€/mois | Crédits offerts ~100€/mois | Boucle virale, CAC quasi-zéro |
| Pinterest organique | 0€ + 1h/sem | 0€ + 1h/sem | 0€ + 1h/sem | Acquisition Léa, inspiration déco |
| Paid (Meta/Google) | 0€ | 0€ | [HYPOTHESE : 200-300€/mois si CAC < 40€ prouvé] | Scaling après validation conversion |

> Paid activé uniquement si LTV/CAC > 3x prouvé sur données terrain. Aucun budget paid avant M5.

---

## Hypothèses à valider en priorité

1. [HYPOTHESE] Panier moyen 22€ — à mesurer sur les 50 premières transactions (mix réel des packages)
2. [HYPOTHESE] Taux conversion 3-5% à M2-M3 — benchmark SaaS B2C est 2-8% sur freemium (source : Andreessen Horowitz SaaS benchmarks, non vérifié terrain)
3. [HYPOTHESE] LTV Claire 348€ sur 12 mois — suppose un usage mensuel récurrent non prouvé
4. [HYPOTHESE] LTV Thomas 400€ — suppose 8 opérations actives en 6 mois actifs
5. [HYPOTHESE] CAC SEO 10-20€ — suppose un taux de closing de 3% sur trafic organique qualifié

---

**Handoff → @data-analyst**
- Fichiers produits : `/home/user/Architecture/docs/growth/growth-strategy.md`
- Décisions prises : pas de paid avant M5 ; Léa acquise uniquement via SEO/viral/referral (LTV trop faible pour paid) ; watermark comme levier viral prioritaire (activable sans auth) ; referral program à préparer maintenant, activer au lancement Auth
- Points d'attention : le taux de conversion visiteur → acheteur est la variable critique — instruire cet événement en P0 dès le lancement Auth. Mesurer le mix packages réel dès J+7 pour recalibrer le panier moyen. Créer une cohorte par persona dès M2 (Claire vs Thomas vs Léa identifiés par self-déclaration à l'inscription ou par comportement — nb photos/session, style choisi).

**Handoff → @social**
- Fichiers produits : `/home/user/Architecture/docs/growth/growth-strategy.md`
- Décisions prises : LinkedIn = canal principal pour Claire et Thomas (outreach manuel M1-M2, contenu organique M3+) ; Pinterest = canal Léa (avant/après stylisés, 0 budget) ; Instagram = relais partage natif Léa
- Points d'attention : les contenus LinkedIn doivent citer des chiffres réels (90 secondes, 29€ vs 500€ home stager) issus de value-proposition.md — aucun chiffre inventé. Les accroches LinkedIn et Instagram validées sont dans brand-voice.md Section 4. Le watermark sur les exports HD est un prérequis pour que le partage Léa devienne un canal d'acquisition — coordonner avec @fullstack.
