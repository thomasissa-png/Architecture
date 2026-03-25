# Backlog — VisiRénov
> Produit par @product-manager — 2026-03-25
> Source : roadmap.md (RICE), kpi-framework.md, functional-specs.md, project-context.md
> Destinataires : @fullstack (implémentation), @qa (couverture tests)

---

## Conventions

- **Priorité** : P0 = bloquant North Star / P1 = impact direct revenus / P2 = qualité ou différenciation
- **KPI associé** : référence directe à kpi-framework.md Section 3 ou Section 4
- **Personas** : Claire (architecte), Thomas (marchand), Léa (particulière)

---

## Epic 1 — Auth + Crédits + Stripe

> Bloquant absolu. Sans auth, aucune monétisation possible. Score RICE 6,38 — NOW.
> Dépendance : table `users` (Clerk) + table `credits` (PG) + webhook Stripe.

---

### US-AUTH-01 : Inscription et connexion par email

**Persona** : Claire / Thomas / Léa
**Story** : En tant qu'utilisateur, je veux m'inscrire et me connecter avec mon email, afin de retrouver mes crédits et mes générations entre chaque session.
**Critères d'acceptation** :
- [ ] CA-1 : L'utilisateur peut créer un compte via Clerk (email + mot de passe ou magic link).
- [ ] CA-2 : À la première connexion, 1 crédit gratuit est automatiquement crédité sur son compte (sans CB requise).
- [ ] CA-3 : Le `sessionId` anonyme actuel (F1 itérations) migre vers `userId` sans perte des itérations en cours.
- [ ] CA-4 : Un utilisateur non connecté voyant la page génération est invité à se connecter avant de lancer (modal non-bloquant avec CTA "Essayer gratuitement").
**KPI** : `taux_activation` (visiteur → 1ère génération) — cible >30% — kpi-framework.md Section 3 Activation.
**Priorité** : P0

---

### US-AUTH-02 : Tableau de bord crédits restants

**Persona** : Thomas / Claire
**Story** : En tant qu'utilisateur connecté, je veux voir mes crédits restants en permanence dans l'interface, afin de savoir quand en acheter sans être surpris par un blocage.
**Critères d'acceptation** :
- [ ] CA-1 : Le solde de crédits est affiché dans le header (ex. "3 crédits restants") dès la connexion.
- [ ] CA-2 : Quand le solde atteint 0, un message contextuel invite à acheter un package (modal, pas un blocage brutal).
- [ ] CA-3 : Le solde se met à jour en temps réel après chaque génération complète (sans reload de page).
**KPI** : `package_viewed` depuis source `credits_empty` — kpi-framework.md Section 4 Events core.
**Priorité** : P0

---

### US-AUTH-03 : Achat d'un package crédits via Stripe Checkout

**Persona** : Thomas / Claire
**Story** : En tant qu'utilisateur dont les crédits sont épuisés, je veux acheter un package de crédits en quelques clics, afin de reprendre mes générations immédiatement sans quitter l'application.
**Critères d'acceptation** :
- [ ] CA-1 : 4 packages disponibles — Starter 4,90€ / Pro 14,90€ / Business 29€ / Studio 69€ — affichés dans une modal ou page dédiée.
- [ ] CA-2 : Clic sur un package → redirection vers Stripe Checkout (mode `payment`, pas `subscription`).
- [ ] CA-3 : Après paiement validé, le webhook `checkout.session.completed` crédite les crédits en base PG (jamais côté client).
- [ ] CA-4 : L'idempotency key est vérifiée sur l'INSERT crédits — un webhook rejoué ne double-crédite pas le compte.
**KPI** : `taux_conversion_free_paid` — cible 8-12% — kpi-framework.md Section 3 Revenu.
**Priorité** : P0

---

### US-AUTH-04 : Décompte d'un crédit à chaque génération

**Persona** : Tous
**Story** : En tant que système, je veux déduire 1 crédit du compte utilisateur à chaque génération complète (2 passes réussies), afin de garantir l'intégrité du modèle économique.
**Critères d'acceptation** :
- [ ] CA-1 : La déduction se fait côté serveur (`route.ts`), uniquement après succès des 2 passes — jamais à l'initiation.
- [ ] CA-2 : Si le solde est à 0 au moment de l'appel API, la génération est refusée avec un code HTTP 402 et un message actionnable ("Créditez votre compte pour continuer").
- [ ] CA-3 : L'event `credits_consumed` est tracké avec `style_id`, `room_type`, `model_used` (kpi-framework.md Section 4).
**KPI** : `package_purchased` / `credits_consumed` ratio — surveillance coût IA vs revenus.
**Priorité** : P0

---

### US-AUTH-05 : Feature gating par package

**Persona** : Thomas (Business), Claire (Pro)
**Story** : En tant qu'utilisateur du package Business, je veux accéder au Mode Marchand (F4), afin de générer des dossiers de pré-commercialisation non disponibles aux packages inférieurs.
**Critères d'acceptation** :
- [ ] CA-1 : F4 (Mode Marchand) est accessible uniquement aux packages Business 29€ et Studio 69€.
- [ ] CA-2 : F5 (Mode Décorateur) est accessible uniquement aux packages Business 29€ et Studio 69€.
- [ ] CA-3 : Un utilisateur Starter/Pro tentant d'accéder à F4/F5 voit un message d'upsell (modal) avec le package minimum requis mis en avant.
- [ ] CA-4 : Le gating est vérifié côté serveur à chaque appel API (pas seulement côté UI).
**KPI** : `feature_gated_hit` — mesure la demande latente pour F4/F5 — kpi-framework.md Section 4.
**Priorité** : P1

---

## Epic 2 — QA Automatisée

> Filet de sécurité avant F4/F5. Score RICE 4,80 — NOW.
> Dépendance : Epic 1 doit être stable pour couvrir les flux auth/paiement.

---

### US-QA-01 : Tests unitaires pipeline prompts (Vitest)

**Persona** : N/A (infrastructure qualité)
**Story** : En tant que développeur, je veux des tests unitaires sur les fonctions de construction de prompts, afin de détecter toute régression sur les prompts passe 1/passe 2 avant chaque déploiement.
**Critères d'acceptation** :
- [ ] CA-1 : Les fonctions `buildSurfacesResponsesPrompt()`, `buildFurnitureResponsesPrompt()`, `buildSurfacesFluxPrompt()`, `buildFurnitureFluxPrompt()` sont couvertes par des tests Vitest.
- [ ] CA-2 : Chaque test vérifie que le prompt généré contient les directives critiques (ex. "DO NOT change walls", "freestanding objects ONLY").
- [ ] CA-3 : Les tests couvrent les 12 styles + le mode Custom (prompt enrichi post-GPT-4.1-mini).
- [ ] CA-4 : `vitest run` passe sans erreur avant tout merge sur `main`.
**KPI** : Réduction du taux de régression silencieuse sur le pipeline IA (0 incident détecté en prod sans alerte test).
**Priorité** : P0

---

### US-QA-02 : Tests E2E parcours génération (Playwright)

**Persona** : Léa (parcours standard), Thomas (batch)
**Story** : En tant que développeur, je veux des tests E2E sur les parcours critiques utilisateur, afin de valider que chaque déploiement ne casse pas le tunnel upload → génération → téléchargement.
**Critères d'acceptation** :
- [ ] CA-1 : Test E2E : upload 1 photo JPG → sélection style Scandinave → génération → image de résultat présente dans le DOM.
- [ ] CA-2 : Test E2E : upload 3 photos → génération batch → "Tout télécharger" déclenche 3 téléchargements.
- [ ] CA-3 : Test E2E : utilisateur sans crédits → tentative de génération → modal d'achat apparaît (après Epic 1).
- [ ] CA-4 : Les tests tournent dans CI GitHub Actions à chaque push sur `main`.
**KPI** : `generation_completed` success rate en prod — cible >95% — kpi-framework.md Section 4.
**Priorité** : P0

---

### US-QA-03 : CI/CD Pipeline GitHub Actions

**Persona** : N/A
**Story** : En tant que développeur solo, je veux un pipeline CI automatique qui lance les tests avant chaque déploiement sur Replit, afin de ne pas déployer un build cassé en production.
**Critères d'acceptation** :
- [ ] CA-1 : Push sur `main` → CI lance `vitest run` + `playwright test` en parallèle.
- [ ] CA-2 : Si un test échoue, le déploiement Replit est bloqué et une notification est envoyée.
- [ ] CA-3 : Le pipeline inclut un lint TypeScript (`tsc --noEmit`) pour détecter les erreurs de typage.
**KPI** : Nombre de régressions détectées en CI avant prod (0 incident silent en prod est le seuil de succès).
**Priorité** : P1

---

## Epic 3 — F4 Mode Marchand

> Feature différenciante pour Thomas. Score RICE 1,58 — NEXT.
> Dépendances : Epic 1 (gating Business 29€) + Epic 2 (filet de sécurité batch).

---

### US-F4-01 : Création d'un dossier de pré-commercialisation

**Persona** : Thomas
**Story** : En tant que marchand de biens, je veux créer un dossier de pré-commercialisation en renseignant l'adresse du bien et en uploadant ses photos, afin de générer automatiquement un document professionnel pour mes acquéreurs.
**Critères d'acceptation** :
- [ ] CA-1 : Un formulaire de création de dossier collecte : adresse du bien, type (appartement/maison/loft), surface (m²), photos (max 15).
- [ ] CA-2 : Le dossier est sauvegardé en base PG avec `user_id` et un statut (`draft` / `generating` / `complete`).
- [ ] CA-3 : Le formulaire n'est accessible qu'aux comptes Business 29€ ou Studio 69€ (gating vérifié côté serveur).
**KPI** : Taux activation F4 parmi les utilisateurs Business — cible >50% dans les 30j post-achat pack Business.
**Priorité** : P1

---

### US-F4-02 : Génération batch des visuels meublés

**Persona** : Thomas
**Story** : En tant que marchand de biens, je veux générer automatiquement des visuels meublés pour toutes les photos de mon dossier en un clic, afin de ne pas avoir à lancer chaque génération manuellement.
**Critères d'acceptation** :
- [ ] CA-1 : Clic sur "Générer le dossier" → toutes les photos du dossier sont traitées via `Promise.allSettled` (max 2 concurrentes pour respecter les limites API).
- [ ] CA-2 : Une barre de progression affiche l'avancement photo par photo (ex. "3/8 photos traitées").
- [ ] CA-3 : Les photos en erreur sont signalées individuellement — le dossier n'est pas bloqué par une erreur partielle.
- [ ] CA-4 : 1 crédit est consommé par photo générée (décompte côté serveur, vérification solde avant chaque appel).
**KPI** : `taux_batch` (photos_uploaded / sessions) — cible moyenne >3 photos/session Thomas — kpi-framework.md Section 1.
**Priorité** : P1

---

### US-F4-03 : Agent marchand — description automatique du bien

**Persona** : Thomas
**Story** : En tant que marchand de biens, je veux qu'un agent IA génère automatiquement le texte de présentation du bien (titre, description, points forts), afin de disposer d'un document de pré-commercialisation complet sans rédiger manuellement.
**Critères d'acceptation** :
- [ ] CA-1 : L'agent GPT-4.1 reçoit en input : adresse, type, surface, style sélectionné, et génère un titre accrocheur (<15 mots) + une description (~150 mots) + 3 points forts.
- [ ] CA-2 : Le texte généré est éditable par Thomas avant export (textarea pré-rempli).
- [ ] CA-3 : Le texte est en français, ton professionnel immobilier, sans mentions de l'IA dans le document final.
**KPI** : Taux d'utilisation de l'agent vs texte manuel (track `agent_description_used: boolean` dans l'event dossier).
**Priorité** : P1

---

### US-F4-04 : Export PDF dossier complet

**Persona** : Thomas
**Story** : En tant que marchand de biens, je veux exporter mon dossier en PDF A4 prêt à envoyer, afin de le partager directement avec mes acquéreurs ou de l'attacher à mes annonces immobilières.
**Critères d'acceptation** :
- [ ] CA-1 : Le PDF contient : page de garde (adresse, photo principale meublée, logo VisiRénov), description du bien, visuels meublés (1 par page, format A4 paysage), mentions légales minimales.
- [ ] CA-2 : La génération PDF utilise Puppeteer (HTML → PDF A4, résolution 150 DPI minimum).
- [ ] CA-3 : Le PDF est disponible en téléchargement <30 secondes après la fin des générations visuelles.
- [ ] CA-4 : La compatibilité Puppeteer avec l'environnement Replit est validée avant le commit (test manuel en staging).
**KPI** : `result_downloaded` avec `is_batch: true` — kpi-framework.md Section 4 Events core.
**Priorité** : P1

---

## Epic 4 — F5 Mode Décorateur

> Feature différenciante pour Léa. Score RICE 0,75 — LATER.
> Dépendances : Epic 1 (gating Business 29€) + Epic 2 + Epic 3 (pattern dossier réutilisable).

---

### US-F5-01 : Identification du mobilier sur l'image générée

**Persona** : Léa
**Story** : En tant que particulière, je veux que l'application identifie automatiquement les meubles présents dans mon visuel généré, afin de savoir exactement quels objets acheter pour reproduire l'ambiance.
**Critères d'acceptation** :
- [ ] CA-1 : Après la génération, un appel post-processing GPT-4.1 analyse l'image et retourne une liste de 6-12 éléments de mobilier identifiés (type, couleur, matière, dimensions estimées).
- [ ] CA-2 : La liste est présentée dans une UI shopping list (composant dédié) sous le comparateur avant/après.
- [ ] CA-3 : Si le post-processing échoue, l'image générée reste disponible sans la shopping list (degraded mode, pas d'erreur bloquante).
**KPI** : Taux d'engagement sur la shopping list — `shopping_list_opened` event (à créer).
**Priorité** : P1

---

### US-F5-02 : Shopping list avec liens IKEA, Leroy Merlin, MdM

**Persona** : Léa
**Story** : En tant que particulière, je veux trouver directement les meubles identifiés sur IKEA, Leroy Merlin et Maisons du Monde, afin de passer à l'achat sans recherche supplémentaire.
**Critères d'acceptation** :
- [ ] CA-1 : Chaque élément de la shopping list dispose d'un lien de recherche dynamique vers IKEA FR, Leroy Merlin FR et MdM FR (pas d'URL produit hardcodée — liens de recherche par mots-clés).
- [ ] CA-2 : Les liens s'ouvrent dans un nouvel onglet.
- [ ] CA-3 : Une mention "Liens non affiliés — résultats de recherche" est affichée sous la liste (conformité et transparence).
- [ ] CA-4 : Si un catalogue change ses URLs de recherche, les liens restent fonctionnels (structure de requête générique validée pour les 3 catalogues).
**KPI** : `shopping_link_clicked` event par catalogue (IKEA/LM/MdM) — mesure l'engagement et le potentiel affilié V2.
**Priorité** : P2

---

### US-F5-03 : Export PDF avec QR codes

**Persona** : Léa
**Story** : En tant que particulière, je veux exporter ma shopping list en PDF avec des QR codes pointant vers chaque produit, afin de pouvoir scanner les codes directement en magasin ou envoyer le document à mon partenaire.
**Critères d'acceptation** :
- [ ] CA-1 : Le PDF contient le visuel généré + la liste de meubles avec QR code par produit (lien de recherche encodé).
- [ ] CA-2 : Les QR codes sont générés côté serveur (librairie `qrcode` ou équivalent) — pas de service tiers externe.
- [ ] CA-3 : Le PDF est en format A4 portrait, téléchargeable <15 secondes.
**KPI** : `result_downloaded` avec `format: pdf_shopping` — mesure l'usage du format export déco.
**Priorité** : P2

---

## Synthèse des priorités

| Story | Epic | Priorité | Persona | Bloquant |
|---|---|---|---|---|
| US-AUTH-01 | Auth | P0 | Tous | North Star |
| US-AUTH-02 | Auth | P0 | Thomas/Claire | North Star |
| US-AUTH-03 | Auth | P0 | Thomas/Claire | North Star |
| US-AUTH-04 | Auth | P0 | Tous | North Star |
| US-AUTH-05 | Auth | P1 | Thomas | F4/F5 gating |
| US-QA-01 | QA | P0 | Dev | Sécurité F4/F5 |
| US-QA-02 | QA | P0 | Dev | Sécurité prod |
| US-QA-03 | QA | P1 | Dev | Vélocité |
| US-F4-01 | F4 | P1 | Thomas | Rev. Pro |
| US-F4-02 | F4 | P1 | Thomas | Rev. Pro |
| US-F4-03 | F4 | P1 | Thomas | Diff. marché |
| US-F4-04 | F4 | P1 | Thomas | Rev. Pro |
| US-F5-01 | F5 | P1 | Léa | Diff. marché |
| US-F5-02 | F5 | P2 | Léa | Affiliés V2 |
| US-F5-03 | F5 | P2 | Léa | Engagement |

---

**Handoff → @fullstack et @qa**

Fichiers produits :
- `/home/user/Architecture/docs/product/backlog.md`

Décisions prises :
- **Ordre de livraison** : Epic 1 (Auth/Crédits/Stripe) en totalité → Epic 2 (QA) → Epic 3 (F4 Marchand) → Epic 4 (F5 Décorateur). Cet ordre est verrouillé dans roadmap.md et conservé ici.
- **Gating** : F4 et F5 sont accessibles Business 29€ minimum — vérifié côté serveur, pas seulement UI (US-AUTH-05 CA-4).
- **Stripe** : mode `payment` one-shot uniquement. Webhook obligatoire. Idempotency key sur INSERT crédits (US-AUTH-03 CA-4).
- **Puppeteer** : recommandé pour PDF F4 — compatibilité Replit à valider en staging avant commit (US-F4-04 CA-4).
- **Liens catalogues F5** : dynamiques uniquement (recherche par mots-clés), jamais d'URLs hardcodées (US-F5-02 CA-1).

Points d'attention pour @fullstack :
- Migration `sessionId` → `userId` (US-AUTH-01 CA-3) doit être non-breaking pour les itérations en cours.
- La déduction de crédit (US-AUTH-04) se fait uniquement après succès des 2 passes — prévoir le rollback si passe 2 échoue après passe 1 réussie.
- Batch F4 (US-F4-02) : max 2 génération concurrentes pour respecter les limites API OpenAI/Flux — `Promise.allSettled` déjà en place à étendre.

Points d'attention pour @qa :
- US-QA-01 : couvrir les 12 styles × 2 prompts (surface + furniture) = 24 cas de test unitaires minimum.
- US-QA-02 CA-3 : le test "crédits épuisés → modal achat" ne peut être écrit qu'après Epic 1 livré — prévoir le mock.
- Le CI doit bloquer le déploiement Replit si un test échoue (US-QA-03 CA-2) — documenter le hook Replit deploy dans qa-strategy.md.
