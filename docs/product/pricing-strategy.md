# Stratégie de Pricing — Versiroom
> Produit par @product-manager — 2026-03-25
> Mis à jour par @product-manager — 2026-03-27 : abonnement Pro 29€/mois (remplace le pack one-shot Pro 29€), crédits supplémentaires abonnés, pages dédiées par profil (/architecte, /marchand, /particulier).
> Décisions fondateur intégrées : packages crédits one-shot pour non-abonnés, abonnement Pro mensuel 29€ avec crédits inclus + rachats préférentiels, Mode Pro (ex Mode Marchand) inclus dans l'abonnement, F5 prix fixe par dossier, pages dédiées par persona remplacent la section personas homepage.

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

**Enseignement clé :** Le marché français est dominé par l'abonnement mensuel (Renovate Club 9,99€/mois illimité, Gepetto non publié). L'unique acteur à la carte en France est InterieurAI à 1,25€/photo. Pedra est à 29€/mois — exactement le prix retenu pour le Pro Versiroom. Versiroom adopte un modèle **hybride** : abonnement Pro 29€/mois pour les professionnels récurrents (Thomas, Claire), packages one-shot pour les usages ponctuels (Léa).

---

## 2. Stratégie de pricing Versiroom

### 2A. Modèle hybride — Abonnement Pro + Packages one-shot

**Coût API de référence :** ~0,10€ par génération (passe 1 + passe 2 OpenAI Responses API, voir functional-specs.md §7.1).

#### Plan gratuit — 3 générations à l'inscription (sans CB)

**Justification :** REimagineHome offre 3 designs gratuits — c'est la norme du marché pour lever la barrière d'entrée. Pedra offre 1 crédit sans CB. 3 générations permettent à Claire de tester 3 styles différents sur la même photo (usage naturel décrit dans le persona) et de constater la qualité avant d'acheter. En dessous de 3, la démonstration de valeur est insuffisante. Au-delà de 5, le coût d'acquisition en crédits offerts devient significatif (~0,50€/nouveau compte).

---

### 2B. Abonnement Pro — 29€/mois TTC (prix de lancement)

**Positionnement :** L'abonnement Pro est l'offre centrale pour les professionnels récurrents (Thomas, Claire). Le badge **"Prix de lancement"** indique que ce tarif est temporaire — sans date d'expiration communiquée, mais utilisé pour lever les hésitations des early adopters.

**Ce qui est inclus :**
- **50 crédits/mois** renouvelés chaque mois (non cumulables d'un mois sur l'autre)
- **Mode Pro** (ex Mode Marchand) : dossiers de pré-commercialisation batch jusqu'à 15 photos, PDF généré, lien partageable acquéreurs sans limite de durée
- **Dossiers de pré-commercialisation** : page de couverture, visuels avant/après, description du bien générée par IA, watermark optionnel
- **Liens partageables acquéreurs sans limite** : pas de TTL sur les liens des dossiers Pro (vs 30j pour les packs one-shot)
- **Itérations** : 3 itérations par photo
- **Mode Décorateur (F5)** : shopping list (+1 crédit/liste)
- **Annonce publique (F6)** : pages d'annonce illimitées
- **Export PDF** : dossiers de pré-commercialisation + shopping lists
- **Téléchargement HD** : inclus

**Justification tarifaire :**
- Aligné sur Pedra (29€/mois, 20 000+ pros EU) — le leader EU du marché immobilier : Versiroom apporte le même prix avec un pipeline qualité supérieur (2 passes, styles FR curatés).
- Vs Renovate Club (9,99€/mois illimité) : Versiroom ne joue pas sur le volume mais la qualité. 50 crédits/mois couvrent le besoin de Thomas (8-12 opérations/an = 40-80 photos/mois en pic).
- Vs home stager humain : Thomas dépensait 200-500€/planche. 29€/mois pour 50 crédits = 0,58€/photo. Réduction de 99,8%.
- Le badge "Prix de lancement" crée un sentiment d'urgence et fidélise les premiers abonnés sans nécessiter de date limite.

**Stripe architecture :** Mode `subscription` (pas `payment`). Prélèvement mensuel automatique. Renouvellement des crédits piloté par le webhook `customer.subscription.billing_cycle_anchor` ou `invoice.paid`. Les crédits non consommés ne se cumulent pas.

---

### 2C. Crédits supplémentaires — Rachat pour abonnés Pro

Les abonnés Pro ayant épuisé leurs 50 crédits mensuels peuvent racheter des crédits à tarif préférentiel, sans attendre le renouvellement mensuel.

#### Justification du tarif préférentiel

Un abonné Pro paie 29€/mois pour 50 crédits = 0,58€/crédit. S'il rachète des crédits en dehors de l'abonnement, il est logique de ne pas lui appliquer le tarif non-abonné (0,58€ à 0,98€/crédit selon le pack one-shot). Le tarif préférentiel fidélise l'abonné, évite le churn ("mon abonnement est insuffisant pour mon volume"), et génère un revenu additionnel sur les mois de forte activité.

#### Grille de rachat crédits supplémentaires (abonnés Pro uniquement)

| Pack rachat | Prix TTC | Crédits | Prix/crédit | Coût API/crédit | Marge brute | % marge | Comparaison vs non-abonné |
|---|---|---|---|---|---|---|---|
| **+20 crédits** | 9€ | 20 | 0,45€ | 0,10€ | 7,00€ | 78% | Découverte non-abonné = 0,98€/crédit → -54% |
| **+50 crédits** | 19€ | 50 | 0,38€ | 0,10€ | 14,00€ | 74% | Starter non-abonné = 0,745€/crédit → -49% |
| **+100 crédits** | 34€ | 100 | 0,34€ | 0,10€ | 24,00€ | 71% | Pro non-abonné inexistant à ce volume |

> Prix TTC. Les crédits rachetés sont valables 90 jours (pas de renouvellement mensuel imposé).

**Logique de grille :**
- Le +20 crédits (9€) cible les mois ponctuellement chargés de Thomas (fin de trimestre, opération imprévue). 9€ = ancrage micro-transaction impulsif.
- Le +50 crédits (19€) cible Claire en pic de chantier (plusieurs clients simultanés). 19€ < 29€/mois = perçu comme moins qu'un mois supplémentaire.
- Le +100 crédits (34€) cible les agences immobilières ou les marchands en haute saison. 0,34€/crédit est le prix le plus bas de toute la grille — fidélise les gros volumes sans créer un tier "agences" complexe à gérer.
- Le tarif préférentiel est réservé aux abonnés actifs — vérification côté serveur via statut Stripe subscription. Un non-abonné ne peut pas accéder à ces packs via une URL directe.

---

### 2D. Packages one-shot — Non-abonnés (Léa, usage ponctuel)

Les packages one-shot restent disponibles pour les utilisateurs non-abonnés (Léa, particuliers, pros à usage très ponctuel).

#### Grille tarifaire one-shot

| Pack | Prix TTC | Crédits | Prix/crédit | Coût API/crédit | Marge brute | % marge | Profil cible |
|---|---|---|---|---|---|---|---|
| **Découverte** | 4,90€ | 5 | 0,98€ | 0,10€ | 4,40€ | 90% | Léa — test ponctuel, 1 appartement |
| **Starter** | 14,90€ | 20 | 0,745€ | 0,10€ | 12,90€ | 87% | Léa régulière / particulier actif |
| ~~**Studio**~~ | ~~69€~~ | ~~150~~ | ~~0,46€~~ | ~~0,10€~~ | ~~54,00€~~ | ~~78%~~ | ~~Thomas / agences — gros volumes~~ — **SUPPRIMÉ (2026-03-25)** |

> Prix TTC. TVA 20% applicable pour les particuliers. Claire et Thomas récupèrent la TVA (usage professionnel). Les packs one-shot n'incluent pas le Mode Pro, les Dossiers de pré-commercialisation, ni les liens partageables acquéreurs sans limite.

**Justification de la suppression du pack Pro one-shot 29€ (remplacé par l'abonnement) :**
- Le pack Pro one-shot (29€ / 50 crédits) était identique en prix à l'abonnement Pro (29€/mois). À même prix, l'abonnement est objectivement supérieur (Mode Pro inclus, crédits récurrents, liens sans limite). Il n'y a aucune raison de proposer les deux.
- Un utilisateur qui avait besoin de 50 crédits ponctuels passera naturellement soit par Starter (20 crédits), soit par l'abonnement Pro (50 crédits récurrents).

#### Feature gating par offre

| Feature | Gratuit | Découverte | Starter | Pro Abonnement |
|---|---|---|---|---|
| Générations standard (12 styles) | 3 | 5 | 20 | 50/mois |
| Itérations par photo (F1) | 0 | 0 | 1 | 3 |
| Type de pièce (F2) | Oui | Oui | Oui | Oui |
| Mode Extérieur (F3) | Oui | Oui | Oui | Oui |
| **Mode Pro** (ex Mode Marchand, F4) | Non | Non | Non | **Oui (max 15 photos/dossier)** |
| **Dossiers de pré-commercialisation** (F4) | Non | Non | Non | **Oui — inclus** |
| Mode Décorateur — Shopping list (F5) | Non | Non | Non | Oui (+1 crédit/liste) |
| **Annonce publique (F6)** | **Non** | **Non** | **Non** | **Oui (illimité)** |
| Export PDF | Non | Non | Non | Oui |
| Lien partageable | Non | Non | Oui (7j) | **Oui — sans limite de durée** |
| Téléchargement HD | Oui | Oui | Oui | Oui |
| **Rachat crédits supplémentaires (tarif préférentiel)** | Non | Non | Non | **Oui** |

**Justification du gating Mode Pro/F4/F5 sur Pro Abonnement uniquement :** F4 (Mode Pro) et F5 (Décorateur) ont un coût marginal plus élevé (génération PDF, shopping list GPT-4.1 ~0,13€ vs 0,10€). Réserver ces features à l'abonnement Pro crée un incitatif clair à s'abonner pour Thomas et les agences. Le Starter couvre le besoin de Léa et de Claire en phase découverte.

**Justification des liens partageables sans limite de durée (Pro Abonnement) :** Thomas partage ses dossiers avec des acquéreurs pendant toute la durée de la commercialisation d'un bien (3-18 mois). Un TTL de 30 jours (offre one-shot) est inadapté à son workflow. L'abonnement Pro lève ce blocage — tant que l'abonnement est actif, les liens restent valides.

---

### 2E. F4 Mode Pro (ex Mode Marchand) — Inclus dans l'abonnement Pro

**Renommage (2026-03-27) :** "Mode Marchand" → "Mode Pro" partout dans le produit, les specs, et le pricing. Le terme "Marchand" était réducteur (uniquement B2B immobilier). "Pro" couvre tous les professionnels (architectes, marchands, agences).

**Définition du Mode Pro :** Upload d'un bien immobilier complet (jusqu'à 15 photos), génération des visuels meublés, constitution automatique d'un **Dossier de pré-commercialisation** (page de couverture, description du bien générée par GPT-4.1, visuels avant/après organisés par pièce, watermark optionnel, lien partageable acquéreurs sans limite de durée).

**Prix :** Inclus dans l'abonnement Pro 29€/mois — pas de facturation séparée par dossier.

**Justification de l'inclusion dans l'abonnement (vs prix fixe 29€/dossier antérieur) :**
- Un dossier complet (15 photos) consomme 15 crédits sur les 50 inclus = 30% des crédits mensuels. Thomas génère 2-3 dossiers/mois en rythme de croisière = 30-45 crédits. L'abonnement est parfaitement dimensionné.
- La valeur de l'abonnement Pro est plus simple à communiquer que "29€/dossier + pack crédits séparé pour les autres usages". L'abonnement tout-en-un élimine la friction de multiplication des achats.
- Coût API par dossier 15 photos : 15 × 0,10€ + PDF (0,10€) + description GPT-4.1 (~0,05€) = ~1,65€. Sur 29€/mois et 2-3 dossiers, le coût API représente 3,30-4,95€ sur les 29€ — marge confortable.
- L'argument ROI devient : "29€/mois pour remplacer 1 000-3 000€/mois de home stager humain."

**Renommage dossiers :** "Dossiers PDF avant/après" → "Dossiers de pré-commercialisation" — terminologie professionnelle utilisée par les marchands de biens et agences immobilières.

**Volume discount par dossier :** [SUPPRIMÉ — la logique de volume discount est désormais portée par l'abonnement Pro (50 crédits/mois) et les packs de rachat préférentiels. Pas de tarif séparé par dossier.]

---

### 2F. F5 Mode Décorateur — Prix fixe par dossier (inclus Pro)

**Définition du dossier :** Génération d'une shopping list de 10-15 produits réels sourcés (avec liens d'achat, prix indicatifs, alternatives budget), export PDF format moodboard pour présentation client.

**Prix recommandé : 9€ par dossier (1 pièce + shopping list)**

**Justification :**
- Positionnement : c'est une feature "plus" — le visuel existe déjà (il a coûté 1 crédit). Le dossier Décorateur est la valeur ajoutée sur le contenu, pas sur la génération image.
- Coût API : génération shopping list GPT-4.1 (~0,02€) + PDF (~0,01€) = ~0,03€. Marge brute de 99,7% à 9€.
- Psychologie : 9€ est un achat impulsif pour Léa (profil digital native, habituée aux micro-transactions). Pour Claire, c'est une note de frais anecdotique face aux 2-3h économisées sur la constitution d'un moodboard manuel.
- Ancrage : 9€ par rapport au 29€ du Pack Pro — le Décorateur est perçu comme un add-on abordable.
- Inclus dans l'abonnement Pro (+1 crédit/liste consommé sur les 50 crédits mensuels).

---

## 3. Psychologie des prix

**Ancrage principal :** L'**Abonnement Pro (29€/mois)** est l'offre visuellement mise en avant avec un badge "Recommandé" et un encart "Prix de lancement". Il ancre la perception de valeur pour toute la grille. Les packs Découverte et Starter semblent accessibles en comparaison, l'abonnement Pro semble logique pour les pros récurrents.

**Positionnement du badge "Prix de lancement" :** Pas de date d'expiration affichée. Le message : "Tarif de lancement — profitez-en avant la hausse." Ce positionnement crée une urgence douce sans dévaloriser le produit. Il sera retiré lorsque la base abonnés atteindra ~200 abonnés actifs.

**Price ending :** 4,90€ et 14,90€ utilisent le .90 (perception de prix bas, marché B2C Léa). 29€, 9€, 19€, 34€ utilisent des chiffres ronds (perception de sérieux, marché B2B Thomas et Claire). Cohérence avec les deux segments.

**Affichage recommandé :**
- Afficher le prix **par photo** sous l'abonnement Pro (ex. "0,58€ / photo") — c'est le repère de décision de Thomas.
- Afficher le prix **total mensuel** en grand et le prix/photo en petit.
- Sur la page pricing : mettre en avant "29€/mois — tout inclus" (Mode Pro, dossiers de pré-commercialisation, 50 crédits, liens sans limite).
- Mode Pro : afficher "29€/mois vs 200-500€ chez un prestataire par planche" — la comparaison est pertinente et imparable.
- Crédits supplémentaires : afficher le tarif préférentiel avec comparaison explicite : "+20 crédits à 9€ (vs 19€ en pack non-abonné)."

**Plan gratuit :** Afficher les 3 générations gratuites sans badge "Freemium" — utiliser "Essaie gratuitement, sans carte bancaire" comme CTA. Le mot "Freemium" positionne trop bas pour une marque premium.

---

## 4. Modélisation — Projection MRR à 6 mois (modèle hybride)

### 4.1 Hypothèses communes [HYPOTHÈSE — à valider avec données réelles]

- Coût infra fixe mensuel : 50€ (Replit + PostgreSQL)
- Coût acquisition phase 1 : 0€ (SEO organique + bouche-à-oreille)
- Taux de conversion gratuit → abonnement Pro : [HYPOTHÈSE : 5-8% — benchmark SaaS B2B similaires, plus bas que B2C one-shot car friction abonnement]
- Taux de conversion gratuit → pack one-shot (Léa) : [HYPOTHÈSE : 8-12% — benchmark SaaS B2C]
- MRR abonnements Pro : nombre d'abonnés actifs × 29€ (revenus récurrents)
- MRR packs one-shot : transactions × ARPU one-shot (~9,90€ — mix Découverte 40% + Starter 60%)
- MRR crédits supplémentaires abonnés : [HYPOTHÈSE : 20% des abonnés Pro rachètent des crédits 1 fois/mois, ARPU ~12€]
- Churn abonnement Pro mensuel : [HYPOTHÈSE : 5%/mois — SaaS B2B early stage]
- Croissance mensuelle base d'utilisateurs : [HYPOTHÈSE : +30% par mois en phase de lancement, décroissant à +15% au mois 4-6]

### 4.2 Seuil de rentabilité — Abonnement Pro 29€/mois

**Question clé : combien d'abonnés Pro pour atteindre le KPI North Star (3 000€/mois marge nette) ?**

| Abonnés Pro actifs | MRR abonnements | Marge brute abonnements (~86%) | MRR packs one-shot (estimé) | Marge brute one-shot | Total marge brute | Infra | Marge nette |
|---|---|---|---|---|---|---|---|
| 50 | 1 450€ | 1 247€ | 300€ | 258€ | 1 505€ | 50€ | **1 455€** |
| 80 | 2 320€ | 1 995€ | 400€ | 344€ | 2 339€ | 50€ | **2 289€** |
| **110** | **3 190€** | **2 743€** | **500€** | **430€** | **3 173€** | **50€** | **≈ 3 123€** |
| 140 | 4 060€ | 3 492€ | 600€ | 516€ | 4 008€ | 50€ | **3 958€** |

> **Seuil de rentabilité (KPI North Star 3 000€ marge nette) : ~110 abonnés Pro actifs.** C'est un objectif réaliste à 6 mois pour un produit avec 3 générations gratuites, une audience pro ciblée, et un positionnement qualité différencié.

**Comparaison avec l'ancien modèle one-shot pur :**
- Ancien modèle : 140 transactions/mois à ~26€ ARPU = 3 640€ recettes → 3 080€ marge nette.
- Nouveau modèle : 110 abonnés Pro = revenus récurrents + réduction churn. La prédictibilité du MRR est supérieure.
- L'abonnement crée un MRR stable, contrairement aux packs one-shot qui nécessitent de réacquérir chaque mois.

### 4.3 Projections MRR — 3 scénarios (modèle hybride)

| Scénario | Abonnés Pro | MRR abonnements | MRR one-shot | MRR crédits supp. | Recettes totales | Marge brute | Marge nette | Commentaire |
|---|---|---|---|---|---|---|---|---|
| **Conservateur** | 40 | 1 160€ | 200€ | 92€ | 1 452€ | 1 249€ | **1 199€** | Traction lente, SEO non indexé |
| **Base** | 110 | 3 190€ | 500€ | 254€ | 3 944€ | 3 392€ | **3 342€** | KPI North Star atteint |
| **Optimiste** | 200 | 5 800€ | 800€ | 464€ | 7 064€ | 6 075€ | **6 025€** | Viral loop actif, prescripteurs pro actifs |

> L'objectif KPI North Star (3 000€/mois marge nette) est atteint dans le **scénario Base à 110 abonnés Pro actifs**, soit environ 3,7 nouveaux abonnés par jour (avec churn à 5%). C'est un objectif ambitieux mais cohérent avec un positionnement pro et un pipeline qualité différencié.

### 4.4 Hypothèses à valider

1. [HYPOTHÈSE] Taux de conversion gratuit → abonnement Pro : 5-8%. Source : benchmarks SaaS B2B early stage. À mesurer dès le premier mois post-lancement.
2. [HYPOTHÈSE] Churn mensuel abonnement Pro : 5%. À mesurer après M2 (insuffisant de données avant). Seuil d'alarme : >10% sur 2 mois consécutifs.
3. [HYPOTHÈSE] 20% des abonnés Pro rachètent des crédits supplémentaires. À valider après 30 abonnés actifs.
4. [HYPOTHÈSE] Croissance +30%/mois. Fragile sans donnée de référence. À revoir si le SEO prend plus de 3 mois à indexer.
5. [HYPOTHÈSE] Coût infra 50€/mois. À reconfirmer avec @infrastructure sur la configuration Replit actuelle.
6. [HYPOTHÈSE] Stripe mode `subscription` compatible avec la gestion des crédits mensuels renouvelables. À valider avec @fullstack avant implémentation.

---

## 5. Décisions prises — Résumé actionnable

| Décision | Valeur | Justification |
|---|---|---|
| Modèle | **Hybride : abonnement Pro 29€/mois + packages one-shot** | Décision fondateur 2026-03-27. Abonnement pour les pros récurrents (Thomas, Claire), one-shot pour usage ponctuel (Léa) |
| Plan gratuit | 3 générations sans CB | Aligné REimagineHome (3 gratuits), démontre la qualité 2 passes |
| Offre mise en avant | **Abonnement Pro 29€/mois** avec badge "Prix de lancement" | Ancrage psychologique, MRR récurrent, profil Thomas/Claire |
| Abonnement Pro | 29€/mois TTC — 50 crédits + Mode Pro + Dossiers pré-commercialisation + liens sans limite | Aligné Pedra (29€/mois, leader EU). Tout inclus pour éliminer la friction multi-achats |
| **Crédits supplémentaires abonnés** | +20 crédits à 9€ / +50 crédits à 19€ / +100 crédits à 34€ | Tarif préférentiel vs non-abonné (-49% à -54%). Fidélise les gros volumes sans créer de tier complexe |
| **Mode Pro (ex Mode Marchand)** | Inclus dans l'abonnement Pro | Renommage 2026-03-27. Suppression du prix fixe 29€/dossier — l'abonnement est plus simple et plus avantageux |
| **Dossiers de pré-commercialisation (ex "Dossiers PDF avant/après")** | Inclus dans l'abonnement Pro | Renommage 2026-03-27 — terminologie professionnelle |
| F5 Mode Décorateur | +1 crédit/liste (inclus Pro) | Micro-transaction sur crédits, marge >99%, add-on post-génération |
| Feature gating F4/F5 | Abonnement Pro uniquement | Coût marginal supérieur, incitatif à s'abonner |
| F6 Annonce publique | Inclus Pro (0€ supplémentaire) | Coût API nul, extension naturelle du dossier, canal d'acquisition organique (footer "Généré par Versiroom") |
| ~~Pack Pro one-shot 29€~~ | ~~29€ / 50 crédits one-shot~~ | **REMPLACÉ par l'abonnement Pro 29€/mois (2026-03-27)** — à même prix, l'abonnement est supérieur |
| ~~Pack Studio~~ | ~~69€ / 150 crédits~~ | **SUPPRIMÉ (2026-03-25)** — simplifie la grille, Pro absorbe les features clés |
| Volume discount F4 par dossier | **SUPPRIMÉ** | La logique de volume est désormais portée par l'abonnement + packs de rachat préférentiels |

---

---

## 6. Pages dédiées par profil — /architecte, /marchand, /particulier

**Décision fondateur (2026-03-27) :** Les pages dédiées par profil remplacent la section personas actuellement sur la homepage. Cette section sera supprimée de la homepage.

### 6.1 Principe

Chaque page cible une persona et présente :
1. **Un avant/après dédié** — image représentative du cas d'usage du persona (chantier→meublé pour Thomas, pièce vide→ambiance pour Claire, appartement brut→style pour Léa)
2. **Des témoignages/commentaires contextualisés** — extraits de verbatims réels du persona ou [HYPOTHÈSE] en attente de témoignages réels
3. **Un CTA adapté au persona** :
   - `/architecte` → "Générer votre première planche en 90 secondes" (ancré sur le vocabulaire Claire)
   - `/marchand` → "Créer votre dossier de pré-commercialisation" (ancré sur le vocabulaire Thomas)
   - `/particulier` → "Visualiser votre futur appartement" (ancré sur le vocabulaire Léa)

### 6.2 Contenu minimal par page

| Élément | /architecte | /marchand | /particulier |
|---|---|---|---|
| H1 | "Le home staging virtuel qui parle à vos clients." | "Vos dossiers de pré-commercialisation en 10 minutes." | "Visualisez votre futur intérieur avant de l'acheter." |
| Avant/après dédié | Chantier → ambiance stylée (12 styles) | Bien brut → dossier PDF complet | Pièce vide → 3 styles différents |
| Argument clé | "Un support de conversation avec votre client dès le premier RDV" | "29€/mois vs 200-500€/planche chez un prestataire" | "Pas le salon de quelqu'un d'autre — le vôtre." |
| Témoignage contextualisé | Citation proche de : "Je n'attends plus 48h pour montrer quelque chose à mon client" | Citation proche de : "3 dossiers complets en une matinée" | Citation proche de : "J'ai enfin visualisé MON appartement en scandinave" |
| CTA principal | "Essayer gratuitement" → génération | "Créer mon premier dossier" → abonnement Pro | "Essayer gratuitement" → génération |
| CTA secondaire | "Voir les tarifs Pro" | "Voir les tarifs Pro" (badge "Prix de lancement") | "Voir les packs" |
| Mention pricing | "Abonnement Pro — 29€/mois, tout inclus" | "Abonnement Pro — 29€/mois · Dossiers illimités · 50 crédits/mois" | "Découvrez gratuitement — 3 générations sans CB" |

### 6.3 Relation avec la homepage

- La section personas (pills "Architectes / Marchands / Particuliers") sur la homepage est **supprimée**.
- La homepage devient généraliste : Hero + outil 3 étapes + pricing + galerie avant/après.
- Les liens vers les pages profil sont dans le header (nav secondaire) et le footer.
- Les pages profil sont les cibles naturelles des campagnes SEO longue traîne et des publicités ciblées par persona.

### 6.4 Specs fonctionnelles — renvoi

Les user stories détaillées de ces pages (US-F7-01 à US-F7-03) sont définies dans `docs/product/functional-specs.md` section F7.

---

**Handoff → @growth**
- Fichiers produits : `/home/user/Architecture/docs/product/pricing-strategy.md`
- Décisions prises (2026-03-27) : abonnement Pro 29€/mois (badge "Prix de lancement"), crédits supplémentaires abonnés (3 paliers : 9€/19€/34€), Mode Pro (ex Mode Marchand) inclus, Dossiers de pré-commercialisation (ex "Dossiers PDF avant/après") inclus, pages dédiées /architecte /marchand /particulier
- Points d'attention pour @growth :
  - Le taux de conversion gratuit → abonnement Pro (5-8%) est l'hypothèse critique — instrumenter dès J1 post-lancement auth
  - Seuil de rentabilité : 110 abonnés Pro actifs → MRR ~3 000€ marge nette. Objectif mensuel : +3,7 abonnés nets (nouveaux - churns)
  - Thomas est le profil le plus sensible au ROI (200-500€/planche → 29€/mois) — l'argument dossiers de pré-commercialisation est le hook principal pour l'acquisition B2B
  - Badge "Prix de lancement" à exploiter en activation : "tarif fondateur" dans les séquences email
  - Les pages /marchand et /architecte sont les cibles SEO prioritaires (intention transactionnelle forte)
- Hypothèses à valider en priorité : taux de conversion, churn mensuel, taux de rachat crédits supplémentaires

**Handoff → @legal**
- TVA 20% applicable pour les particuliers (Léa), récupérable pour les pros (Claire, Thomas)
- **Abonnement récurrent = nouveaux obligations CGV** : délai de rétractation 14j (exception Art. L221-28 13° applicable si premiers crédits consommés), mandat de prélèvement SEPA, procédure de résiliation claire
- Les CGU/CGV existantes (docs/legal/cgu-draft.md) sont basées sur le modèle one-shot — à mettre à jour pour inclure les conditions d'abonnement Pro
- F4 dossiers de pré-commercialisation : vérifier si les visuels générés nécessitent un disclaimer "image générée par IA" pour usage sur portails immobiliers (conformité loi anti-fraude immo)
- Crédits rachetés (TTL 90j) : documenter l'expiration des crédits dans les CGU (obligation légale)
