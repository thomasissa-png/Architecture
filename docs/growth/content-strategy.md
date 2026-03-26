# Stratégie de contenu — Versiroom
> Produit par @growth — 2026-03-26
> Sources : growth-strategy.md, personas.md, seo-audit.md, brand-voice.md
> Objectif : trafic organique + visibilité LLM + nurturing, 100% automatisable par fondateur solo + agents IA

---

## Principes directeurs

- Aucun canal ne suppose de production manuelle régulière — tout contenu est généré par IA et publié automatiquement
- Le blog sert le SEO (Google) ET le GEO (réponses LLM comme ChatGPT/Perplexity)
- Priorité personas : Claire (architecte) > Thomas (marchand) > Léa (particulière)
- Léa ne justifie aucun budget paid — elle doit être captée par viralité/SEO/social organique

---

## 1. Stratégie Blog

### 10 articles prioritaires

| # | Titre | Mot-clé cible | Persona | Angle | Format |
|---|---|---|---|---|---|
| 1 | "Home staging virtuel IA : comment ça marche en 2026 ?" | home staging virtuel IA | Tous | Guide explicatif, réponse directe aux LLM — article de référence | Guide pratique |
| 2 | "5 outils de home staging IA comparés (prix, qualité, rapidité)" | home staging IA comparatif | Thomas + Claire | Comparatif objectif — Versiroom positionné sur rapport qualité/prix | Comparatif |
| 3 | "Architecte d'intérieur : gagner du temps avec le staging IA avant le 1er RDV client" | outil home staging architecte | Claire | Use case Claire — 90 secondes vs 2 jours de rendu 3D | Étude de cas |
| 4 | "Marchand de biens : 3 visuels meublés en 10 minutes pour votre dossier de pré-commercialisation" | visuels meublés annonce immobilière | Thomas | ROI immédiat — 29€ vs 500€ home stager humain | Étude de cas |
| 5 | "Home staging virtuel appartement : guide complet pour les particuliers" | home staging virtuel appartement | Léa | Longue traîne large — visualiser sa déco avant emménagement | Guide pratique |
| 6 | "Aménagement IA : 12 styles de déco pour visualiser votre intérieur" | aménagement IA intérieur | Léa + Claire | Contenu SEO image-rich — galerie 12 styles avant/après, cible Pinterest | Inspiration |
| 7 | "Home staging virtuel vs home stager humain : quel ROI pour un marchand de biens ?" | home staging virtuel prix | Thomas | Calcul économique précis — 1 500€ vs 29€, temps de retour, cas d'usage | Analyse |
| 8 | "Staging IA pour annonce immobilière : comment multiplier vos demandes de visite" | staging IA immobilier | Thomas | Angle conversion annonce — lien avec photos meublées et taux de clic SeLoger/LeBonCoin | Guide pratique |
| 9 | "Visualiser sa décoration avant d'acheter des meubles : 4 méthodes comparées" | visualiser décoration avant achat | Léa | Comparatif d'apps — positionne Versiroom sur rapidité + réalisme + gratuité des 3 premières | Comparatif |
| 10 | "Japandi, scandinave, wabi-sabi : quel style d'intérieur vous correspond ?" | style intérieur japandi scandinave | Léa | SEO inspiration déco + signal GEO — article encyclopédique sur les 12 styles | Guide pratique |

### Pipeline d'automatisation blog

**Génération :** GPT-4o produit chaque article en une passe à partir d'un prompt template structuré :
```
Rôle : expert home staging et décoration intérieure
Cible : [persona]
Mot-clé principal : [mot-clé]
Titre : [titre]
Angle : [angle]
Longueur : 1 200-1 800 mots
Sections obligatoires : intro (réponse directe à la question — pour GEO), contexte, guide/comparatif, exemples concrets, FAQ 3 questions, CTA Versiroom
Ton : [brand-voice.md §2]
```

**Enrichissement visuel :** chaque article intègre 2-3 avant/après générés avec Versiroom (captures d'écran de production dans public/logs/ ou Object Storage). Les images servent le SEO image ET la preuve sociale.

**Publication :** workflow Next.js — les articles sont des fichiers `.mdx` dans `app/blog/`. Un script Node.js lit le fichier MDX généré et le place dans le bon dossier via l'API GitHub. Publication automatique au déploiement Replit.

**Fréquence cible :** 2 articles/semaine (batch généré le lundi, publié mardi + jeudi). Volume total M1-M6 : ~48 articles.

**Temps fondateur :** 30 min/semaine pour relire et valider les 2 articles (pas de rédaction, uniquement validation).

---

## 2. Stratégie Social

### Canaux par persona

| Persona | Canal 1 | Canal 2 | Hors scope |
|---|---|---|---|
| Claire (architecte) | LinkedIn | — | TikTok/Instagram (pas son usage pro) |
| Thomas (marchand) | LinkedIn | Facebook groupes marchands | — |
| Léa (particulière) | Instagram Reels | Pinterest | LinkedIn |

### 10 posts types

| # | Format | Canal | Persona | Contenu type | Hook |
|---|---|---|---|---|---|
| 1 | Avant/après image | Instagram + LinkedIn | Tous | Photo chantier brut → même pièce en style Scandinave (généré Versiroom) | "90 secondes pour voir à quoi ressemblera ce salon vide." |
| 2 | Carousel 6 slides | LinkedIn | Claire | Slide 1 : problème (client ne visualise pas). Slide 2-5 : 4 styles sur même pièce. Slide 6 : CTA essai gratuit | "Votre client ne voit pas ce que vous voyez. Voici comment changer ça." |
| 3 | Reel 30s | Instagram | Léa | Screen recording : upload photo appartement vide → choix style Japandi → résultat. Musique tendance. | "POV : tu viens d'acheter ton appart et tu veux voir à quoi ça peut ressembler" |
| 4 | Chiffre choc | LinkedIn | Thomas | Visuel texte : "1 500€ pour un home stager humain. 29€ pour Versiroom. Résultat en 90 secondes." | Pas de hook nécessaire — le chiffre parle seul |
| 5 | Tutoriel étapes | Instagram Reels + TikTok | Léa | 3 étapes en 60s : upload → style → télécharger. Voice-over IA. | "Je vais te montrer comment visualiser ta déco en 60 secondes" |
| 6 | Comparatif 12 styles | Pinterest | Léa | Épingle statique : même pièce en 4 styles (2x2 grid). Alt text SEO. Lien vers article blog #6 | "Quel style est fait pour vous ?" |
| 7 | Témoignage reformulé | LinkedIn | Thomas + Claire | Citation reformulée d'un avis utilisateur + résultat avant/après | "Ce marchand de biens a réduit son délai de commercialisation de 3 semaines." |
| 8 | Avant/après timelapse | Instagram Reels | Léa | Transition slider animée (CSS ou CapCut template) entre photo vide et photo meublée | "Ton appartement vide → Ton appartement rêvé" |
| 9 | Post éducatif | LinkedIn | Claire + Thomas | "3 erreurs courantes dans les photos d'annonces immobilières (et comment les éviter)" — 5 phrases, pas de slide | Utile + expert sans promotion directe |
| 10 | Épingle tendance | Pinterest | Léa | Épingle vidéo 15s : résultat Wabi-Sabi ou Japandi sur fond de musique lo-fi. Titre SEO Pinterest. | "Style Japandi — visualiser votre intérieur" |

### Fréquence

| Canal | Fréquence | Posts/mois |
|---|---|---|
| LinkedIn | 3 posts/semaine | 12 |
| Instagram | 4 posts/semaine (mix Reels + images) | 16 |
| Pinterest | 5 épingles/semaine | 20 |
| **Total** | | **48 posts/mois** |

### Pipeline d'automatisation social

**Génération texte :** GPT-4o produit les captions, hooks et alt texts à partir d'un prompt template par format (carousel, reel, épingle). Un batch de 12 posts LinkedIn est généré en une passe le lundi.

**Génération visuels :** les avant/après sont automatiquement extraits des générations de production (logs Object Storage). Un script Python sélectionne les meilleures paires (filtrées par style_id) et les formate pour chaque réseau (ratio 1:1 Instagram, 9:16 Reels, 1000x1500 Pinterest).

**Scheduling :** Buffer ou Publer (API disponible). Un cron hebdomadaire pushes les 12 posts du batch via API. Coût : ~15€/mois Buffer Essentials.

**Temps fondateur :** 20 min/semaine pour valider le batch avant publication automatique.

---

## 3. Stratégie Email

### Séquence onboarding (inscription → conversion)

**Déclencheur :** signup (lancement Auth M2)

| Email | Délai | Objet | Contenu | CTA |
|---|---|---|---|---|
| E1 — Bienvenue | J+0 | "Vos 3 générations gratuites vous attendent" | Ce que Versiroom fait, comment ça marche en 3 étapes, lien direct vers l'outil | "Générer ma première image" |
| E2 — Activation | J+2 (si pas de génération) | "Vous n'avez pas encore essayé — voici pourquoi ça vaut le coup" | Avant/après d'un style populaire (Scandinave ou Japandi), 1 chiffre (90 secondes), preuve sociale | "Essayer maintenant" |
| E3 — Upsell post-génération | J+1 après 1ère génération | "Comment avez-vous trouvé le résultat ?" | Félicitations, rappel des crédits restants, explication de ce qu'on gagne avec le pack Pro | "Passer au Pro — 29€" |
| E4 — Urgence crédits | Quand crédit = 1 | "Il vous reste 1 génération gratuite" | Récapitulatif de ce que l'utilisateur a déjà créé, tarifs, CTA fort | "Continuer avec le pack Starter" |
| E5 — Réactivation | J+7 sans activité post-signup | "Une seule photo suffit pour voir la différence" | 1 before/after fort, 1 question rhétorique ("À quoi ressemble votre salon en Japandi ?"), lien direct | "Voir mon espace transformé" |

### Séquences nurturing par persona

**Détection persona :** à l'inscription, un champ radio "Je suis : Architecte / Professionnel immo / Particulier" suffit. Alternativement, le comportement (nombre de photos uploadées, style choisi) permet une segmentation automatique à J+7.

**Claire (architecte) — séquence 3 emails post-achat**

| Email | Objet | Angle |
|---|---|---|
| C1 — J+1 après achat Pro | "Comment présenter vos visuels Versiroom à vos clients" | Tips pro : présenter 3 styles max, créer une mini-planche, usage iPad en réunion |
| C2 — J+14 | "Vos confrères architectes l'utilisent aussi" | Preuve sociale pro + referral (5 crédits si parrainage d'un confrère) |
| C3 — J+28 (avant expiration) | "Vos crédits expirent dans 3 jours" | Rappel + offre renouvellement |

**Thomas (marchand) — séquence 3 emails post-achat**

| Email | Objet | Angle |
|---|---|---|
| T1 — J+1 après achat Studio | "Intégrer vos visuels Versiroom dans une plaquette SeLoger" | Guide pratique : export HD, formats acceptés, angle de mise en valeur |
| T2 — J+10 | "Votre prochain dossier, votre prochaine opération" | ROI calculé (temps + argent), présentation du pack F4 dossier si pas encore utilisé |
| T3 — J+25 | "Préparez votre prochain achat — renouveler votre pack" | Offre de renouvellement avec 10% remise si renouvellement avant expiration |

**Léa (particulière) — séquence légère (LTV faible, ne pas sur-solliciter)**

| Email | Objet | Angle |
|---|---|---|
| L1 — J+3 après génération | "Aimeriez-vous partager votre résultat ?" | Encouragement partage Instagram/WhatsApp + CTA partage natif, referral program |
| L2 — J+30 | "Les nouvelles tendances déco pour votre intérieur" | Éditorial léger — 3 styles populaires du mois, lien vers article blog inspiration |

### Outils et automatisation email

**Outil recommandé :** Brevo (ex-Sendinblue) — plan gratuit jusqu'à 300 emails/jour, API robuste, séquences comportementales. Coût : 0€ jusqu'à ~2 000 contacts actifs.

**Intégration :** à la création du compte utilisateur (Auth M2), un appel API Brevo crée le contact et déclenche la séquence onboarding selon le persona déclaré. Un webhook post-génération déclenche E3. Un cron vérifie les crédits restants et déclenche E4.

**Templates :** générés par GPT-4o sur template HTML Brevo minimaliste (couleurs Versiroom : #FAFAF8 / #1C1C1E / #7D9B76). 1 template/séquence, personnalisation via variables Brevo.

**Temps fondateur :** 1h pour configurer les séquences et webhooks à M2. Ensuite 0 maintenance.

---

## 4. Calendrier éditorial mensuel type

### Planning semaine type (post M2 — Auth live)

| Jour | Action | Automatisé ? |
|---|---|---|
| Lundi | Batch generation : 2 articles blog + 12 posts LinkedIn + 16 posts Instagram via GPT-4o | Oui — script batch |
| Mardi | Publication article blog #1 + 3 posts sociaux (planifiés Buffer) | Oui — Buffer API |
| Mercredi | 3 posts sociaux publiés automatiquement | Oui |
| Jeudi | Publication article blog #2 + 3 posts sociaux | Oui |
| Vendredi | 3 posts sociaux + 5 épingles Pinterest | Oui |
| Samedi | 2 Reels Instagram + 5 épingles Pinterest | Oui |
| **Fondateur** | 30 min validation batch lundi + 10 min monitoring KPIs vendredi | Manuel |

### KPIs par canal

| Canal | KPI primaire | KPI secondaire | Seuil d'alerte | Outil de mesure |
|---|---|---|---|---|
| Blog SEO | Sessions organiques/mois | Position moyenne sur mots-clés cibles | < 200 sessions à M3 → retravailler les H1/meta | Google Search Console |
| LinkedIn | Impressions + CTR profil | Leads entrants (messages DM) | CTR < 1% → changer le hook | LinkedIn Analytics natif |
| Instagram | Taux de sauvegarde Reels | Clics lien bio | Sauvegarde < 3% → changer le format | Instagram Insights |
| Pinterest | Impressions mensuelles | Clics sortants vers site | < 1 000 impressions/mois à M2 → retravailler les titres | Pinterest Analytics |
| Email onboarding | Taux ouverture E1 | Taux activation (clic → génération) | Ouverture < 40% → retravailler objet | Brevo Analytics |
| Email nurturing | Taux conversion E3 (upsell) | Revenu attribuable email | Conversion < 5% → retravailler CTA E3 | Brevo + Stripe |

### Mix mensuel type (M3+)

| Type de contenu | Volume/mois | Temps fondateur |
|---|---|---|
| Articles blog | 8 | 2h validation |
| Posts LinkedIn | 12 | 30 min validation |
| Posts Instagram / Reels | 16 | 20 min validation |
| Épingles Pinterest | 20 | 10 min |
| Emails automatisés envoyés | Variable (base contacts) | 0 min (déjà configuré) |
| **Total fondateur** | | **~3h/semaine** |

---

## Hypothèses à valider

1. [HYPOTHESE] Trafic blog : 200 sessions organiques/mois à M3 avec 8 articles publiés — dépend de l'autorité du domaine (actuellement sous-domaine Replit, frein SEO documenté dans seo-audit.md §10)
2. [HYPOTHESE] Taux ouverture email : 40-50% à M2 — benchmarks Brevo B2C France, non vérifié terrain
3. [HYPOTHESE] Buffer Essentials suffit pour le volume — à confirmer selon les canaux activés (3 canaux = plan gratuit suffisant, 5+ canaux = plan 15€/mois)
4. [HYPOTHESE] Conversion E3 (upsell post-génération) : 5% — à mesurer dès M2

---

**Handoff → @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/growth/content-strategy.md`
- Décisions prises : blog MDX intégré à Next.js (pas de CMS tiers), Brevo email (plan gratuit M2), Buffer scheduling social, pipeline batch GPT-4o le lundi
- Points d'attention :
  1. Le blog nécessite la création de `app/blog/` et d'un layout MDX — tâche @fullstack avant publication M2
  2. Le domaine Replit est un frein SEO structurel (seo-audit.md §10) — sans domaine propre, les articles blog auront une autorité faible. Arbitrer domaine propre avant de lancer la production de contenu
  3. La séquence email nécessite l'Auth live (M2 roadmap) + webhook post-génération — coordonner avec @fullstack
  4. Les avant/après pour les posts sociaux sont extraits de l'Object Storage (logs) — les 7 styles non testés en 2 passes (backlog Sprint 17b) devraient être générés pour alimenter le contenu social
