# Specs — Galerie Gate + Toggle Surfaces/Mobilier

**Projet** : Versimo | **Date** : 2026-04-02 | **Statut** : Prêt pour @fullstack

---

## Correction 1 — Galerie historique réservée Starter + Pro

### Règle d'accès

| Pack | Accès /ma-galerie |
|---|---|
| Découverte (gratuit, 0 achat) | Refusé → écran upgrade |
| Starter (achat one-shot ≥ 1 crédit consommé) | Autorisé |
| Pro (abonnement actif) | Autorisé |
| Admin | Autorisé |

**Logique** : `hasGalleryAccess` = role IN ('pro','admin') OU total_credits_purchased >= 15 (seuil Starter 14,90€ = 15 crédits). Si l'achat Starter n'est pas encore consommé, l'accès est quand même accordé dès l'achat.

### Implémentation recommandée

- Créer `hasGalleryAccess(userId)` dans `lib/credits.ts` — miroir de `hasProAccess()` avec seuil adapté (credits_purchased >= 15 OR role IN ('pro','admin'))
- Créer `GalleryGate` dans `components/GalleryGate.tsx` — wrapper identique à `ProGate` mais avec message upgrade spécifique
- Appeler `GalleryGate` en tête de `app/ma-galerie/page.tsx`

### US-GAL-01 : Accéder à la galerie (utilisateur Starter ou Pro)

**Persona** : Thomas (marchand de biens) ou Claire (architecte)
**Epic** : Galerie historique
**Dépendances** : Auth + Stripe opérationnels
**Priorité RICE** : R=8 I=7 C=9 E=1 → Score=504

#### Job-to-be-done
En tant que Thomas, je veux accéder à l'historique de mes générations afin de retrouver et retélécharger un visuel produit il y a plusieurs jours.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN utilisateur connecté avec credits_purchased >= 15 WHEN il navigue vers /ma-galerie THEN la page se charge et affiche ses générations
- [ ] GIVEN utilisateur connecté avec role='pro' WHEN il navigue vers /ma-galerie THEN la page se charge sans redirect
- [ ] GIVEN admin WHEN il navigue vers /ma-galerie THEN accès autorisé

**Cas d'erreur :**
- [ ] GIVEN utilisateur connecté avec credits_purchased = 0 (Découverte) WHEN il navigue vers /ma-galerie THEN affichage du composant GalleryGate (pas de redirect, pas de 403 — rester sur la page avec l'écran d'upgrade)
- [ ] GIVEN utilisateur non connecté WHEN il navigue vers /ma-galerie THEN redirect vers /login (middleware existant — aucun changement)

**Cas limites :**
- [ ] GIVEN utilisateur ayant acheté Starter mais n'ayant pas encore généré WHEN il navigue vers /ma-galerie THEN accès accordé (la galerie est vide — état vide affiché)
- [ ] GIVEN utilisateur Pro dont l'abonnement a expiré cette nuit WHEN il navigue vers /ma-galerie THEN GalleryGate affiché (hasProAccess() retourne false)

**Permissions :**
- [ ] GIVEN utilisateur Découverte WHEN il accède à /ma-galerie THEN GalleryGate affiché avec CTA "Démarrer avec Starter — 14,90€"

**Données existantes :**
- [ ] GIVEN utilisateur Starter avec 8 générations existantes WHEN hasGalleryAccess() THEN toutes les générations restent visibles, aucune n'est supprimée

#### 5 états UI — GalleryGate (écran upgrade)

| État | Comportement | Message/Affichage |
|---|---|---|
| Défaut | Utilisateur Découverte sur /ma-galerie | Titre : "Votre galerie vous attend" — Corps : "L'historique de vos visuels est disponible dès votre premier pack." — CTA primaire : "Démarrer avec Starter — 14,90€" — CTA secondaire : "Voir les formules" |
| Loading | Vérification hasGalleryAccess() en cours | Skeleton 2 lignes (même hauteur que la galerie réelle) |
| Vide | Pas applicable — GalleryGate ne charge pas de données | N/A |
| Erreur | /api/user/credits timeout ou 500 | "Impossible de vérifier votre accès — réessayez" + bouton Réessayer |
| Succès | hasGalleryAccess() = true | Rend le contenu normal de /ma-galerie |

#### Payload API
- **Endpoint** : GET /api/user/credits (existant)
- **Réponse** : `{ hasPro: boolean, credits: number, creditsUsed: number, totalPurchased: number }`
- Ajouter `hasGalleryAccess: boolean` à la réponse (= hasPro OR totalPurchased >= 15)

---

## Correction 2 — Toggle Surfaces / Mobilier dans MerchantMode et InlineGenerator

### Règle de comportement

- Toggle par batch dans MerchantMode (1 toggle → s'applique à toutes les photos)
- Toggle par génération dans InlineGenerator (1 toggle par fiche bien)
- Valeur par défaut : `withFurniture = true` dans les deux composants
- Les itérations (handleRefine) ne sont pas concernées — elles forcent `true` par design

### US-TOG-01 : Choisir le mode de génération dans MerchantMode

**Persona** : Thomas (marchand de biens)
**Epic** : Mode Pro
**Dépendances** : MerchantMode opérationnel
**Priorité RICE** : R=7 I=8 C=9 E=1 → Score=504

#### Job-to-be-done
En tant que Thomas, je veux choisir "Surfaces uniquement" ou "Surfaces + Mobilier" pour mon batch de photos afin d'adapter les visuels au stade de mon dossier (avant/après travaux, ou pré-commercialisation meublée).

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas sur MerchantMode avec 3 photos uploadées WHEN il sélectionne "Surfaces uniquement" THEN toutes les photos du batch sont générées avec `withFurniture: false`
- [ ] GIVEN Thomas sur MerchantMode WHEN l'interface s'affiche THEN le toggle est sur "Surfaces + Mobilier" par défaut (withFurniture = true)
- [ ] GIVEN Thomas a sélectionné "Surfaces uniquement" WHEN il lance la génération THEN le body de chaque requête contient `withFurniture: false`

**Cas d'erreur :**
- [ ] GIVEN Thomas change de valeur du toggle AFTER avoir lancé la génération THEN le toggle est désactivé (disabled) pendant la génération, la valeur initiale est conservée pour toutes les photos en cours

**Cas limites :**
- [ ] GIVEN Thomas a 5 photos et change le toggle après que 2 photos ont été générées THEN photos déjà générées : leur valeur est figée. Photos restantes : le toggle est désactivé pendant la génération (comportement non applicable — le toggle doit être désactivé dès le lancement)
- [ ] GIVEN Thomas remet les photos à zéro (reset batch) THEN le toggle revient à la valeur par défaut (true)

**Permissions :**
- [ ] GIVEN utilisateur non-Pro accédant à MerchantMode THEN le toggle est affiché — il suit les règles d'accès existantes de MerchantMode (pas de logique supplémentaire)

**Données existantes :**
- [ ] GIVEN MerchantMode avec génération précédente WHEN nouveau batch lancé THEN withFurniture reprend la valeur par défaut (true), pas la valeur du batch précédent

#### 5 états UI — Toggle MerchantMode

| État | Comportement | Message/Affichage |
|---|---|---|
| Défaut | Avant lancement | Toggle 2 boutons : "Surfaces + Mobilier" (actif) / "Surfaces uniquement". Positionné au-dessus du bouton "Générer" |
| Loading | Génération en cours | Toggle disabled (opacity-50, pointer-events-none), valeur figée |
| Vide | N/A — toggle toujours visible si photos présentes | N/A |
| Erreur | N/A — le toggle n'a pas d'état d'erreur propre | N/A |
| Succès | Génération terminée | Toggle réactivé, valeur conservée (pour relance éventuelle) |

---

### US-TOG-02 : Choisir le mode de génération dans InlineGenerator

**Persona** : Thomas (fiche bien) ou Claire (génération depuis une annonce)
**Epic** : Génération inline
**Dépendances** : InlineGenerator opérationnel
**Priorité RICE** : R=6 I=7 C=9 E=1 → Score=378

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN InlineGenerator ouvert sur une fiche bien WHEN l'utilisateur sélectionne "Surfaces uniquement" THEN le body de la requête contient `withFurniture: false`
- [ ] GIVEN InlineGenerator WHEN affiché THEN `withFurniture = true` par défaut

**Cas d'erreur :**
- [ ] GIVEN InlineGenerator en cours de génération WHEN l'utilisateur tente de changer le toggle THEN toggle désactivé — la valeur initiale est conservée

**Cas limites :**
- [ ] GIVEN InlineGenerator resetté THEN toggle revient à true

**Permissions :**
- [ ] GIVEN tout utilisateur connecté accédant à InlineGenerator THEN le toggle est visible (pas de gating supplémentaire)

**Données existantes :**
- [ ] GIVEN InlineGenerator avec résultat précédent visible WHEN nouvelle génération lancée THEN withFurniture reprend la valeur du toggle courant (pas celle de la génération précédente)

---

## Impact technique — Fichiers à modifier

### Correction 1 — Galerie gate

| Fichier | Action |
|---|---|
| `lib/credits.ts` | Ajouter `hasGalleryAccess(userId)` — credits_purchased >= 15 OR role IN ('pro','admin') |
| `app/api/user/credits/route.ts` | Ajouter `hasGalleryAccess` dans la réponse JSON |
| `components/GalleryGate.tsx` | Créer (copier structure ProGate, adapter message + CTA) |
| `app/ma-galerie/page.tsx` | Wrapper le contenu avec `<GalleryGate>` |

### Correction 2 — Toggle withFurniture

| Fichier | Action |
|---|---|
| `components/MerchantMode.tsx` | Ajouter état `withFurniture` (useState, défaut true) + toggle UI au-dessus du CTA générer + passer `withFurniture` dans chaque appel generateSinglePhoto (ligne ~626) |
| `components/InlineGenerator.tsx` | Ajouter état `withFurniture` (useState, défaut true) + toggle UI + transmettre `withFurniture` dans le body fetch |

Aucune modification requise sur `route.ts`, `generation-pipeline.ts` ou le backend — ils supportent déjà `withFurniture`.

---

## Handoff → @fullstack

- **Fichiers produits** : `/home/user/Architecture/docs/product/gallery-gate-and-pass-toggle-specs.md`
- **Décisions prises** :
  - Seuil Starter = credits_purchased >= 15 (correspond au pack Starter 14,90€ / 15 crédits)
  - Toggle MerchantMode = par batch (pas par photo individuelle)
  - Toggle désactivé pendant génération pour éviter les états incohérents mid-batch
  - GalleryGate = page inline (pas redirect) — l'URL reste /ma-galerie, le contenu est remplacé par l'écran upgrade
- **Points d'attention** :
  - `hasGalleryAccess` doit être cohérente avec `hasProAccess` existante dans lib/credits.ts — ne pas dupliquer la logique Stripe, appeler hasProAccess() en interne
  - Le toggle MerchantMode doit être disabled dès le premier appel generateSinglePhoto (état isGenerating existant) — pas de gestion supplémentaire
  - Ne pas modifier le comportement des itérations (handleRefine) — withFurniture forcé à true par design, documenté dans CLAUDE.md

---

*Mis à jour dans project-context.md — voir Historique des interventions agents.*
