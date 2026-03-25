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

## 2b. User Stories additionnelles

### Claire — L'Architecte (persona principal)

> En tant qu'architecte d'intérieur, je veux partager un lien de visualisation stylée avec mon client, pour lui présenter une direction esthétique en dehors du RDV, depuis son téléphone ou son ordinateur.

**Parcours Claire :**
1. Claire génère 2-3 ambiances sur une photo de chantier
2. Elle veut envoyer le résultat à son client sans qu'il installe quoi que ce soit
3. Elle utilise le bouton "Copier le lien" de l'ImageComparator existant → **F6 n'est PAS son outil**

**Verdict : F6 ne couvre pas le besoin de Claire, et c'est NORMAL.**

Claire ne crée pas une annonce immobilière commerciale. Elle partage une inspiration. Son besoin est déjà couvert par le lien partageable du Starter/Pro (30j). Elle n'a pas besoin de la page `/annonce/[uuid]` avec branding marchand, contact téléphonique et ZIP de photos.

**Action requise en V2** : envisager un "lien de présentation Claire" — page simplifiée sans coordonnées de contact, avec possibilité d'afficher plusieurs visuels côte à côte, sans branding marchand. Hors scope F6.

---

### Léa — L'Acheteuse (persona secondaire)

> En tant que primo-accédante, je veux partager mes inspirations de décoration avec mon partenaire ou ma famille, pour prendre des décisions ensemble avant d'acheter les meubles.

**Parcours Léa :**
1. Léa génère un visuel scandinave de son futur salon
2. Elle veut le partager sur WhatsApp ou Instagram
3. Elle utilise le bouton "Partager" (WhatsApp natif) de l'ImageComparator existant → **F6 n'est PAS son outil**

**Verdict : F6 ne couvre pas le besoin de Léa, et c'est NORMAL.**

Léa ne publie pas d'annonce immobilière. Elle partage une inspiration déco. Son besoin est couvert par les boutons de partage existants (WhatsApp, copier image, partage natif mobile). Elle n'a pas de profil marchand, pas de bien en base, pas de contact pro. La page `/annonce/[uuid]` serait une friction supplémentaire pour elle.

**Aucune action requise pour Léa dans F6.**

---

## 3. Scope MVP vs V2

### Ajout au MVP : résolution de la friction F2 (filtre room_type)

L'audit V5 Thomas (8.8/10) a identifié F2 — "filtre type de pièce absent dans /ma-galerie" — comme la **seule friction bloquante** pour passer 9/10. F6 crée une dépendance directe avec /ma-galerie (les photos de l'annonce sont groupées par room_type). Il est donc logique et peu coûteux de corriger F2 dans le même sprint :

- Ajouter `<select>` filtre `room_type` dans `/ma-galerie/page.tsx`
- Exposer le paramètre `room_type` dans `/api/user/photos`
- Estimation @fullstack : 2h (citée dans l'audit V5)

**Décision : F2 (filtre room_type) est intégré au scope du sprint F6. Coût marginal : 2h. Gain : +0.5 sur critère 9 (retrouvabilité) → Thomas passe 8.8 → 9.3/10.**

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

### Décision sur la Galerie plein écran (Lightbox)

La galerie plein écran est listée en V2. Cette décision est **maintenue** : Thomas utilise les photos sur des portails immo où il les uploade manuellement — la lightbox n'apporte rien à son workflow. Pour les acquéreurs qui consultent le lien envoyé par Thomas, une grille 2 colonnes avec click-to-open-tab est suffisant pour le MVP.

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

### Critères nominaux (happy path)

- [ ] Bouton "Créer une annonce" visible sur `/mes-biens/[id]` quand ≥1 photo associée
- [ ] Page `/annonce/[uuid]` accessible sans authentification (publique)
- [ ] Titre auto-généré : "{Type} {surface}m² — {ville}"
- [ ] Description commerciale affichée (depuis `description_final` ou `description_generated`)
- [ ] Photos groupées par type de pièce (`room_type`) avec labels FR
- [ ] Infos clés : surface, pièces, prix (formaté en euros avec séparateur de milliers), localisation
- [ ] Contact marchand : téléphone + email pro (depuis profil marchand)
- [ ] Logo + couleurs marchand appliqués sur la page
- [ ] Bouton "Copier le lien" fonctionnel (feedback toast "Lien copié !")
- [ ] Bouton "Copier la description" fonctionnel (feedback toast "Description copiée !")
- [ ] Bouton "Partager WhatsApp" fonctionnel (natif mobile, fallback wa.me sur desktop)
- [ ] Bouton "Télécharger les photos" génère un ZIP (JSZip client-side) nommé `annonce-{ville}-{surface}m2.zip`
- [ ] Footer "Annonce générée par Versiroom" avec lien vers le site
- [ ] Gate Pro+ : seuls les utilisateurs ayant acheté Pro/Studio peuvent créer une annonce
- [ ] Responsive mobile-first (iPhone 15 Pro = device principal Thomas)
- [ ] data-testid sur tous les éléments interactifs
- [ ] `next build` passe sans erreur

### Edge cases — Données manquantes (cas fréquents sur chantier brut)

- [ ] **Prix absent** : si `sale_price` est null ou 0, afficher "Prix sur demande" à la place du prix formaté — ne jamais afficher "0 €"
- [ ] **Description absente** : si `description_final` ET `description_generated` sont null, afficher un placeholder "Description à venir" avec un lien "Compléter depuis la fiche bien" (pas de bloc vide)
- [ ] **Surface absente** : si `surface_m2` est null, le titre devient "{Type} — {ville}" (pas de "null m²")
- [ ] **Nombre de pièces absent** : si `room_count` est null, la ligne infos clés n'affiche pas le champ pièces (pas de "null pièces")
- [ ] **Téléphone absent** : si `merchant_profiles.telephone` est null, masquer le bloc téléphone — ne pas afficher de champ vide
- [ ] **Email pro absent** : si `merchant_profiles.email_pro` est null, masquer le bloc email — ne pas afficher de champ vide
- [ ] **Aucun contact disponible** : si téléphone ET email sont null, afficher "Coordonnées disponibles sur demande" à la place du bloc contact
- [ ] **Logo absent** : si `merchant_profiles.logo_storage_key` est null, afficher les initiales du nom de l'entreprise dans un carré de la couleur principale du profil (fallback initiales)
- [ ] **Bien sans photos après création annonce** : impossible (bouton disabled si 0 photo), mais si une photo est supprimée après création, la galerie affiche uniquement les photos restantes sans planter

### Edge cases — Comportement et sécurité

- [ ] **UUID invalide** : si `/annonce/[uuid]` est appelé avec un UUID inexistant, retourner une page 404 Next.js propre (pas une erreur 500)
- [ ] **Annonce archivée** : si `annonces.status = 'archived'`, la page retourne 404 (même comportement que UUID inexistant — ne pas révéler l'existence de l'annonce)
- [ ] **Annonce d'un autre utilisateur** : la page est publique — n'importe qui peut la consulter avec le lien. Aucune donnée sensible ne doit apparaître (pas de solde de crédits, pas d'autres biens du marchand, pas de date d'achat du bien)
- [ ] **ZIP de 0 photo** : impossible (au moins 1 photo requise pour créer l'annonce), mais si toutes les photos sont supprimées post-création, le bouton ZIP retourne une erreur "Aucune photo disponible" au lieu de télécharger un ZIP vide
- [ ] **Double clic "Créer une annonce"** : si l'utilisateur clique deux fois rapidement, une seule annonce est créée (idempotence — vérifier en DB si une annonce existe déjà pour ce property_id avant d'en créer une nouvelle, et rediriger vers l'existante)
- [ ] **Titre override vide** : si l'utilisateur efface le titre généré et soumet vide, revenir au titre auto-généré (pas de titre vide en DB)

### Critères de performance

- [ ] **Temps de chargement page annonce** : < 2s sur connexion mobile 4G (les photos sont servies depuis Object Storage — utiliser `next/image` avec `sizes` appropriés)
- [ ] **ZIP < 30s** : pour un bien de 15 photos HD, la génération du ZIP côté client est < 30 secondes

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

## 10. Risques et mitigations

### R1 — Conformité légale : image IA sur portails immobiliers (CRITIQUE)

**Risque** : SeLoger, LeBonCoin, Bien'ici ont des CGU qui peuvent interdire l'usage de visuels générés par IA sans mention explicite. En France, la loi Hoguet et ses décrets d'application encadrent les visuels de bien à vendre — un visuel "trompeur" peut engager la responsabilité du mandataire.

**Impact** : Thomas utilise ces visuels sur des annonces commerciales. Si un portail détecte un visuel IA non signalé, Thomas risque la suppression de son annonce ou de son compte.

**Mitigation MVP** : Ajouter un disclaimer discret mais visible sur la page annonce et dans la description copiée : "Visuels générés par intelligence artificielle à des fins de projection — non contractuels." Ce disclaimer doit être inclus dans le texte de la description exportée vers les portails.

**Action** : Vérifier les CGU SeLoger/LeBonCoin/Bien'ici avant le lancement (à déléguer à @legal). En attendant, le disclaimer est la mesure conservatoire. Si les CGU sont permissives (ce qui est probable — la plupart acceptent le home staging virtuel), le disclaimer reste comme bonne pratique.

---

### R2 — Données personnelles du marchand sur une page publique (HAUTE)

**Risque** : La page `/annonce/[uuid]` affiche le téléphone et l'email pro de Thomas. Cette page est indexable par les moteurs de recherche (SSR, pas de noindex par défaut). Les robots de collecte d'emails vont aspirer ces coordonnées.

**Impact** : Thomas reçoit du spam, son téléphone pro est revendu à des bases de prospection. Atteinte à la confiance.

**Mitigation MVP** :
- Ajouter `<meta name="robots" content="noindex, nofollow">` sur toutes les pages `/annonce/[uuid]` — les annonces ne doivent pas être indexées (la valeur SEO des annonces individuelles est nulle, les portails immo ont déjà ce rôle)
- Afficher l'email en format obfusqué (protection anti-scraping CSS : `direction: rtl; unicode-bidi: bidi-override;`) ou via un bouton "Afficher l'email" (click-to-reveal)
- Le téléphone peut rester en clair (c'est une information que Thomas partage volontairement et qui est déjà sur ses plaquettes PDF)

---

### R3 — Accumulation d'annonces "zombies" en base (MOYENNE)

**Risque** : Thomas crée une annonce pour chaque bien. Il en a 8-12/an. Sur 3 ans, il y a 24-36 annonces en base, dont beaucoup sont pour des biens vendus depuis longtemps. La table `annonces` grossit, et des liens partagés continuent d'afficher des biens qui ne sont plus à vendre.

**Impact** : Un acquéreur suit un vieux lien WhatsApp et appelle Thomas pour un bien vendu depuis 18 mois. Friction pour Thomas.

**Mitigation MVP** : Ajouter un bouton "Archiver l'annonce" sur la fiche bien (`/mes-biens/[id]`). Statut `archived` → page 404. Pas d'expiration automatique en MVP (V2), mais le contrôle manuel est disponible immédiatement.

**Action** : La table `annonces` doit avoir `status` dès le MVP (déjà prévu dans le schéma — vérifier que le bouton d'archivage est dans le scope @fullstack).

---

### R4 — Latence ZIP sur mobile (BASSE)

**Risque** : JSZip côté client sur iPhone 15 Pro avec 15 photos HD (chaque photo ~2-3 Mo depuis Object Storage) = 30-45 Mo à télécharger + compresser en JavaScript. Sur 4G, le téléchargement seul prend 10-15s. La compression JS peut bloquer le thread principal.

**Impact** : Thomas attend une minute, pense que l'outil est cassé, rate l'UX promise.

**Mitigation MVP** : Afficher une barre de progression pendant la génération du ZIP ("Préparation de vos photos… 7/15"). JSZip supporte les callbacks de progression via `file.async()` itératif. Si > 10s, afficher "Encore quelques secondes..."

**Mitigation V2** : Générer le ZIP côté serveur (`/api/annonce/[uuid]/photos-zip`) et servir un lien de téléchargement direct. Plus rapide, ne bloque pas le thread JS. Différé en V2 car nécessite une route API dédiée avec streaming.

---

### R5 — Idempotence création annonce (BASSE)

**Risque** : Thomas clique deux fois sur "Créer une annonce" (double tap mobile, connexion lente). Deux annonces créées pour le même bien. Il envoie le mauvais lien à son acquéreur.

**Impact** : Deux pages publiques identiques pour le même bien, confusion.

**Mitigation MVP** : Déjà documenté dans les critères d'acceptation edge cases — vérifier en DB si une annonce active existe pour ce `property_id` avant d'en créer une. Si oui, rediriger vers l'existante (pas d'erreur, pas de doublon). La route `POST /api/annonce` doit être idempotente sur `property_id`.

---

## 11. Impact sur le score Thomas — Révision

| Critère | V5 (actuel) | Post-F6 | Delta | Justification |
|---|---|---|---|---|
| 1. Simplicité parcours | 8.5 | 9.0 | +0.5 | Workflow complet dans Versiroom — plus besoin de jongler entre outils |
| 4. Téléchargement HD | 9.0 | 9.5 | +0.5 | ZIP bulk download résout la friction F4 de l'audit Thomas |
| 5. Partage | 9.0 | 9.5 | +0.5 | Lien annonce publique + copier description pour portails |
| 9. Retrouvabilité | 9.0 | 9.5 | +0.5 | F2 (filtre room_type) résolu dans ce sprint + photos groupées par pièce sur l'annonce |
| 10. Confiance pro | 8.5 | 9.0 | +0.5 | Page annonce brandée avec logo = image pro + disclaimer légal IA = sérieux |

**Score estimé post-F6 : 9.3/10** (vs 8.8 actuel — seuil 9/10 dépassé, +0.5 vs estimation initiale grâce à F2)

Note : le score 9.3 intègre la résolution de F2 (filtre room_type) dans le même sprint. Sans F2, le score serait 9.1.

---

**Handoff → @fullstack**
- Fichiers produits : `docs/product/f6-annonce-specs.md`
- Scope : MVP uniquement (pas de QR code, pas d'intégration portails, pas d'analytics)
- Priorité d'implémentation : (1) Table + API, (2) Page publique SSR, (3) Bouton fiche bien, (4) ZIP download, (5) Actions partage
- Points d'attention : la page annonce est publique (SSR, pas de useSession) — même pattern que `/dossier/[uuid]`
