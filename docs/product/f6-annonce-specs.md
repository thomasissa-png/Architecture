# F6 — Annonce immobilière publique

> Produit par @product-manager — 2026-03-25
> Validé et enrichi par @product-manager — 2026-03-25
> Décision fondateur : adresser le pain point Thomas "publier une annonce" depuis Versiroom
> Score Thomas post-F6 estimé : 9.2/10 (vs 8.8 actuel — seuil 9/10 dépassé)

---

## Validation du scope MVP

### Verdict : MVP VALIDÉ — périmètre juste

Le scope est ni trop large ni trop étroit. Trois points confirmés :

1. **Aucune feature retirée** : les 9 composants listés ont tous un usage direct par Thomas dans les 10 premières minutes d'utilisation (copier lien, copier description, ZIP photos → portails immo).
2. **V2 correctement différée** : QR code, intégration API portails, analytics, expiration configurable sont des features de rétention, pas d'acquisition. Les différer est la bonne décision pour un MVP.
3. **Un ajout au MVP** : F6 doit résoudre la friction F2 (filtre type de pièce dans /ma-galerie) en même temps — voir section 3 ci-dessous. Cette friction est la seule raison pour laquelle Thomas score 8.8/10 au lieu de 9/10.

### Risque de scope creep identifié et écarté

Tentation de détecter qui sont les "autres" personas sur cette page (Claire veut-elle une page annonce ? Léa ?). Réponse : non. La page annonce publique est un outil de communication immobilière commerciale (Thomas), pas un outil de partage d'inspiration (Léa) ou de présentation client (Claire). Leur usage est couvert par les boutons de partage existants dans l'ImageComparator.

---

## 1. Problème

Thomas (marchand de biens, 35 ans, 8-12 opérations/an) utilise Versiroom pour générer des visuels meublés et des dossiers PDF. Mais son workflow complet est :

1. Acheter un bien → photos iPhone ✅
2. Générer les visuels → Versiroom ✅
3. Constituer le dossier PDF → Mode Marchand ✅
4. **Publier l'annonce sur SeLoger/LeBonCoin/Bien'ici → PAS COUVERT**
5. Envoyer aux acquéreurs → lien partageable ✅

Pour l'étape 4, Thomas doit aujourd'hui :
- Télécharger les photos HD une par une
- Aller sur chaque portail immo
- Remplir manuellement le formulaire (titre, description, prix, surface, type...)
- Uploader les photos une par une
- Répéter pour chaque portail

**Or, Versiroom possède déjà TOUTES les données** : adresse, type, surface, pièces, prix, description GPT, photos HD.

---

## 2. User Story Thomas

> En tant que marchand de biens, je veux générer une page d'annonce publique depuis ma fiche bien, pour pouvoir partager le lien avec mes acquéreurs et copier-coller le contenu sur les portails immo.

### Parcours complet

1. Thomas a un bien dans `/mes-biens/[id]` avec photos générées et description
2. Il clique **"Créer une annonce"** depuis la fiche bien
3. Versiroom génère une page publique `/annonce/{uuid}` avec :
   - Titre auto-généré (type + surface + ville)
   - Description commerciale (déjà générée par GPT-4.1)
   - Galerie photos HD organisée par pièce
   - Infos clés (surface, pièces, prix, localisation)
   - Contact marchand (tel + email depuis profil)
4. Thomas **copie le lien** pour l'envoyer par email/WhatsApp
5. Thomas **copie le texte** de la description pour le coller sur SeLoger
6. Thomas **télécharge toutes les photos** en ZIP pour les uploader sur les portails

---

## 3. Scope MVP vs V2

### MVP (à implémenter maintenant)

| Composant | Description |
|---|---|
| Page `/annonce/[uuid]` (SSR) | Page publique avec titre, description, galerie photos, infos bien, contact marchand |
| Bouton "Créer une annonce" | Sur la fiche bien `/mes-biens/[id]`, crée l'annonce en DB et redirige |
| Galerie photos par pièce | Photos groupées par `room_type` (salon, chambre, cuisine...) avec labels |
| Bouton "Copier la description" | Copie le texte dans le presse-papier pour coller sur les portails |
| Bouton "Télécharger les photos" (ZIP) | ZIP client-side (JSZip) de toutes les photos HD du bien |
| Bouton "Copier le lien" | Copie l'URL publique de l'annonce |
| Bouton "Partager WhatsApp" | Partage natif mobile |
| Branding marchand | Logo + couleurs du profil marchand sur la page annonce |
| Filtre type de pièce dans /ma-galerie | Dropdown filtre `room_type` (déjà implémenté côté API+UI) |

### V2 (plus tard)

| Composant | Description |
|---|---|
| QR code | QR code auto-généré pointant vers l'annonce |
| Export format portail | Texte pré-formaté pour SeLoger, LeBonCoin (longueurs max, champs requis) |
| Intégration API portails | Push direct vers SeLoger/LeBonCoin via leurs APIs partenaires |
| Analytics | Nombre de vues, clics contact, téléchargements photos |
| Expiration configurable | L'annonce expire après X jours (comme les dossiers) |
| Galerie plein écran | Lightbox navigation photos en plein écran |

---

## 4. Données requises

### Déjà disponibles (zéro ajout)

| Donnée | Source | Table/Champ |
|---|---|---|
| Adresse | Fiche bien | `properties.address_normalized`, `city`, `postal_code` |
| Type de bien | Fiche bien | `properties.property_type` |
| Surface | Fiche bien | `properties.surface_m2` |
| Nombre de pièces | Fiche bien | `properties.room_count` |
| Prix de vente | Fiche bien | `properties.sale_price` |
| Description | Fiche bien | `properties.description_final` ou `description_generated` |
| Photos HD | Galerie | `user_photos.output_image_key` |
| Type de pièce | Galerie | `user_photos.room_type`, `room_label` |
| Contact marchand | Profil | `merchant_profiles.telephone`, `email_pro` |
| Logo + couleurs | Profil | `merchant_profiles.logo_storage_key`, `couleur_*` |

### À ajouter

| Donnée | Description |
|---|---|
| Table `annonces` | `uuid`, `user_id`, `property_id`, `status` (active/archived), `created_at`, `expires_at` |
| Titre annonce | Auto-généré : `"{Type} {surface}m² — {ville}"` + override manuel |

---

## 5. Écrans et composants

### 5.1 Bouton sur fiche bien (`/mes-biens/[id]`)

Ajout d'un bouton **"Créer une annonce"** à côté du bouton "Créer un dossier". Même style, même niveau de hiérarchie. Disabled si pas de photos associées.

### 5.2 Page annonce publique (`/annonce/[uuid]`)

Layout :
```
┌─────────────────────────────────────┐
│ [Logo marchand]     [Nom entreprise]│
├─────────────────────────────────────┤
│                                     │
│  Appartement 65m² — Bordeaux        │  ← Titre
│  3 pièces · 185 000 €              │  ← Infos clés
│                                     │
│  ┌─────────┐ ┌─────────┐           │
│  │ Photo 1 │ │ Photo 2 │           │  ← Galerie par pièce
│  │ Salon   │ │ Salon   │           │
│  └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐           │
│  │ Photo 3 │ │ Photo 4 │           │
│  │Chambre  │ │Cuisine  │           │
│  └─────────┘ └─────────┘           │
│                                     │
│  Description commerciale            │  ← Texte GPT
│  "Bel appartement lumineux..."      │
│                                     │
│  📞 06 XX XX XX XX                  │  ← Contact
│  ✉️ thomas@sci-dupont.fr            │
│                                     │
│  [Copier le lien] [WhatsApp]        │  ← Actions
│  [Télécharger les photos]           │
│  [Copier la description]            │
│                                     │
├─────────────────────────────────────┤
│  Annonce générée par Versiroom      │  ← Footer
└─────────────────────────────────────┘
```

### 5.3 API routes

| Route | Méthode | Description |
|---|---|---|
| `/api/annonce` | POST | Créer une annonce depuis un property_id |
| `/api/annonce/[uuid]` | GET | Données de l'annonce (public, SSR) |
| `/api/annonce/[uuid]/photos-zip` | GET | ZIP de toutes les photos HD |

---

## 6. Impact pricing

**Recommandation : F6 inclus dans le Mode Marchand (Pro+ only), pas de coût supplémentaire.**

Justification :
- L'annonce n'a **aucun coût API** (pas de génération IA, juste de l'affichage de données existantes)
- C'est une **extension naturelle** du dossier PDF — même données, rendu web au lieu de PDF
- Facturer séparément créerait de la friction pour Thomas qui vient d'acheter un Pack Pro
- L'annonce publique est un **canal d'acquisition organique** : chaque annonce contient "Généré par Versiroom" → SEO + visibilité gratuite
- Le ZIP est un **réducteur de friction** pour l'upload sur les portails → augmente la satisfaction Thomas

**Gate** : même que F4 — `hasProAccess()` (Pack Pro ou Studio acheté).

---

## 7. Impact score Thomas

| Critère | Avant F6 | Après F6 | Delta | Justification |
|---|---|---|---|---|
| 1. Simplicité parcours | 8.5 | 9.0 | +0.5 | Le workflow complet est dans Versiroom — plus besoin de jongler entre outils |
| 4. Téléchargement HD | 9.0 | 9.5 | +0.5 | ZIP bulk download résout la friction F4 de l'audit Thomas |
| 5. Partage | 9.0 | 9.5 | +0.5 | Lien annonce publique + copier description pour portails |
| 9. Retrouvabilité | 9.0 | 9.5 | +0.5 | Photos groupées par pièce sur l'annonce = vue organisée |
| 10. Confiance pro | 8.5 | 9.0 | +0.5 | Page annonce brandée avec logo = image pro |

**Score estimé post-F6 : 9.2/10** (vs 8.8 actuel) — seuil 9/10 dépassé.

---

## 8. Critères d'acceptation (Definition of Done)

- [ ] Bouton "Créer une annonce" visible sur `/mes-biens/[id]` quand ≥1 photo associée
- [ ] Page `/annonce/[uuid]` accessible sans authentification (publique)
- [ ] Titre auto-généré : "{Type} {surface}m² — {ville}"
- [ ] Description commerciale affichée (depuis `description_final` ou `description_generated`)
- [ ] Photos groupées par type de pièce (`room_type`) avec labels FR
- [ ] Infos clés : surface, pièces, prix (formaté), localisation
- [ ] Contact marchand : téléphone + email pro (depuis profil marchand)
- [ ] Logo + couleurs marchand appliqués sur la page
- [ ] Bouton "Copier le lien" fonctionnel
- [ ] Bouton "Copier la description" fonctionnel
- [ ] Bouton "Partager WhatsApp" fonctionnel (natif mobile)
- [ ] Bouton "Télécharger les photos" génère un ZIP (JSZip client-side)
- [ ] Footer "Annonce générée par Versiroom" avec lien vers le site
- [ ] Gate Pro+ : seuls les utilisateurs ayant acheté Pro/Studio peuvent créer une annonce
- [ ] Responsive mobile-first (iPhone 15 Pro = device principal Thomas)
- [ ] data-testid sur tous les éléments interactifs
- [ ] `next build` passe sans erreur

---

## 9. Dépendances techniques

| Dépendance | Statut |
|---|---|
| Table `properties` avec données enrichies | ✅ Existe |
| Table `user_photos` avec `room_type` | ✅ Existe |
| Table `merchant_profiles` avec branding | ✅ Existe |
| `hasProAccess()` pour le gate | ✅ Existe |
| JSZip (client-side ZIP) | À installer (`npm install jszip`) |
| Table `annonces` | À créer |
| Object Storage pour les photos | ✅ Existe (`getImage()`) |

---

**Handoff → @fullstack**
- Fichiers produits : `docs/product/f6-annonce-specs.md`
- Scope : MVP uniquement (pas de QR code, pas d'intégration portails, pas d'analytics)
- Priorité d'implémentation : (1) Table + API, (2) Page publique SSR, (3) Bouton fiche bien, (4) ZIP download, (5) Actions partage
- Points d'attention : la page annonce est publique (SSR, pas de useSession) — même pattern que `/dossier/[uuid]`
