# F6-V2a — Export pré-formaté pour les portails immobiliers

> Produit par @product-manager — 2026-03-27
> Dépend de : `docs/product/f6-annonce-specs.md` (MVP F6 page annonce publique)
> Persona principal : Thomas Berger, 35 ans, marchand de biens à Bordeaux, 8-12 ops/an
> KPI North Star : 3 000€/mois de marge nette

---

## 0. Contexte et positionnement dans la roadmap

### Problème résiduel après F6 MVP

F6 MVP (page annonce publique `/annonce/[uuid]`) livre :
- Un bouton "Copier la description" → copie le texte brut de `description_final`
- Un bouton "Télécharger les photos" → ZIP de toutes les photos HD

Ce que F6 MVP ne résout PAS : Thomas doit encore **adapter manuellement** le texte pour chaque portail. SeLoger limite le titre à ~100 caractères. LeBonCoin limite la description à 4 000 caractères. Bien'ici exige des champs structurés (DPE, charges copro, etc.). Un texte généré par GPT-4.1 pour Versiroom fait souvent 600-900 mots — trop long pour certains portails, mal structuré pour d'autres.

### Ce que V2a ajoute

V2a est un **composant de reformatage intelligent** intégré à la page annonce publique. Il ne remplace pas le bouton "Copier la description" existant — il l'enrichit. Thomas sélectionne un portail dans un dropdown et copie un bloc de texte **déjà adapté** aux contraintes de ce portail : titre tronqué à la bonne longueur, description reformatée et raccourcie si besoin, champs structurés (surface, pièces, prix, DPE) pré-remplis dans le bon format.

### Positionnement dans la roadmap

V2a est défini comme feature **V2** dans `f6-annonce-specs.md` section 3 — il vient après le MVP F6. Il n'est pas bloquant pour le lancement mais augmente significativement la valeur perçue par Thomas (son pain point numéro 1 après la génération des visuels est la publication sur les portails). Il requiert que la table `annonces` et la page `/annonce/[uuid]` soient opérationnelles (dépendance F6 MVP).

**Dépendance stricte** : F6 MVP doit être en production avant de lancer V2a.

## 1. Contraintes portails — tableau de référence

> Sources : documentation publique LeBonCoin (4 000 caractères confirmés), spécifications techniques SeLoger flux pro PDF (gedeon.im), page Bien'ici corporate, conseils Logic-Immo. Les champs marqués [HYPOTHÈSE] sont des estimations professionnelles à confirmer dans l'interface de dépôt réelle avant la mise en production.

### 1.1 Tableau des portails cibles

| Portail | Cible principale | Accès Thomas | Titre max | Description max | Photos max | Champs structurés requis |
|---|---|---|---|---|---|---|
| **LeBonCoin** | Particuliers + pros | Compte particulier ou pro | 100 caractères [HYPOTHÈSE — recommandation officielle] | 4 000 caractères (confirmé) | 20 photos (pack pro) | Prix, type, surface, nb pièces, DPE mention |
| **SeLoger** | Agences + pros | Via agence partenaire ou direct | 100 caractères [HYPOTHÈSE] | 2 000 caractères [HYPOTHÈSE — non documenté publiquement] | Non limité dans les specs pro | Surface, pièces, prix TTC, honoraires si agent, DPE, charges copro si applicable |
| **Bien'ici** | Agences uniquement | Via agence (pas de compte particulier) | 100 caractères [HYPOTHÈSE] | 3 000 caractères [HYPOTHÈSE] | Non limité publiquement | Type bien, surface loi Carrez (copro), nb lots, charges annuelles, DPE obligatoire, risques nat. depuis 2023 |
| **Logic-Immo** | Agences uniquement | Via agence partenaire | 100 caractères [HYPOTHÈSE] | 2 500 caractères [HYPOTHÈSE] | Non limité publiquement | Date construction, chauffage, surfaces pièces principales, espaces ext. |

### 1.2 Champs obligatoires légaux communs (tous portails, vente 2025)

Ces mentions sont obligatoires par la réglementation française indépendamment du portail. V2a doit les intégrer dans le bloc exporté si les données sont disponibles en base :

| Mention légale | Source | Présence dans `properties` |
|---|---|---|
| Type de bien | Loi | `property_type` ✅ |
| Surface habitable (m²) | Loi | `surface_m2` ✅ |
| Localisation (ville minimum) | Loi | `city` ✅ |
| Prix de vente TTC | Loi | `sale_price` ✅ |
| Nombre de pièces | Loi | `room_count` ✅ |
| DPE (étiquette énergie + GES) | Obligatoire depuis 2022 | **Absent de `properties`** — voir section 5 edge cases |
| Mention copropriété (si applicable) | Loi | **Absent de `properties`** — voir section 5 |
| Disclaimer visuels IA | CGU portails + bonne pratique | Généré automatiquement par V2a |

### 1.3 Périmètre V2a — portails priorisés

Thomas est un marchand de biens avec un compte personnel ou agence. LeBonCoin est le portail le plus accessible (compte particulier suffisant, gratuit). SeLoger est le portail de référence pro mais exige un compte agence ou passe par un mandataire. Bien'ici et Logic-Immo sont réservés aux professionnels.

**Décision de périmètre** :

| Priorité | Portail | Justification |
|---|---|---|
| P0 — V2a | **LeBonCoin** | Accessible sans agence, le plus utilisé par les marchands de biens indépendants, contraintes documentées (4 000 chars) |
| P0 — V2a | **SeLoger** | Référence FR numéro 1, Thomas y publie via son accès agence ou mandataire, contrainte ~2 000 chars [HYPOTHÈSE] |
| P1 — V2a | **Bien'ici** | 15M visites/mois, mais réservé aux pros — Thomas y a accès si il travaille avec une agence partenaire |
| P2 — V2b | **Logic-Immo** | Réservé aux pros, 2ème portail 100% immo — reporté en V2b, faible différenciation vs SeLoger |
| P2 — V2b | **PAP** | Particulier à particulier seulement, Thomas est un professionnel — hors cible |

**V2a livre P0 (LeBonCoin + SeLoger) + P1 (Bien'ici).** Logic-Immo est documenté dans le tableau pour référence mais reporté en V2b.

## 2. User Stories JTBD

### US-V2a-01 — Publication LeBonCoin (portail principal)

**Format JTBD** : Quand je veux publier une annonce sur LeBonCoin pour un bien que j'ai photographié dans Versiroom, je veux obtenir un bloc de texte pré-formaté aux contraintes LeBonCoin (titre ≤100 chars, description ≤4 000 chars, disclaimer IA inclus) que je peux coller directement sans retouche manuelle, pour économiser 15 minutes de reformatage et éviter les rejets d'annonce pour non-conformité.

**Contexte Thomas** : Thomas est sur son laptop Windows au bureau. Il a déjà généré les visuels, sa page annonce Versiroom est ouverte. Il ouvre LeBonCoin dans un autre onglet, commence à créer l'annonce, et veut coller le contenu depuis Versiroom sans jongler entre les onglets.

**Critères de succès** :
- Thomas arrive à coller le titre sans le couper manuellement
- La description fait moins de 4 000 caractères
- Le disclaimer IA est présent
- Thomas ne retouche rien avant de publier

---

### US-V2a-02 — Publication SeLoger

**Format JTBD** : Quand je veux publier sur SeLoger via mon accès mandataire, je veux obtenir un bloc adapté au format SeLoger (~2 000 chars max, champs structurés séparés du corps de l'annonce) pour coller directement dans le formulaire SeLoger Pro sans adapter manuellement.

**Contexte Thomas** : Thomas travaille avec une agence partenaire qui lui donne accès au backoffice SeLoger Pro. L'interface SeLoger a des champs séparés (titre, corps de texte, surface, prix, etc.). Le bloc exporté Versiroom doit distinguer ce qui va dans quel champ.

**Critères de succès** :
- Le bloc copié identifie clairement "Titre :", "Description :", "Champs à remplir :" dans des sections distinctes
- La description est ≤2 000 caractères (limite SeLoger estimée)
- Les données structurées (surface, prix, pièces) sont séparées pour remplissage champ par champ

---

### US-V2a-03 — Publication multi-portails en une session

**Format JTBD** : Quand je dois publier le même bien sur 3 portails différents le même jour, je veux pouvoir générer rapidement les blocs pour chaque portail depuis la même page Versiroom, sans re-naviguer dans les menus, pour publier les 3 annonces en 20 minutes au lieu d'une heure.

**Contexte Thomas** : Thomas publie toujours sur LeBonCoin + SeLoger + Bien'ici en même temps (couverture max). Il a 3 onglets de portails ouverts. Il veut switcher rapidement entre les formats Versiroom.

**Critères de succès** :
- Le dropdown portail change le contenu instantanément (pas de reload)
- Thomas peut copier LeBonCoin, passer à SeLoger, copier, passer à Bien'ici, copier — en moins de 3 clics entre chaque
- Le compteur de caractères visible pour chaque portail rassure Thomas qu'il est dans les limites

---

### US-V2a-04 — Adaptation titre trop long

**Format JTBD** : Quand le titre auto-généré de mon annonce fait plus de 100 caractères, je veux que Versiroom me propose automatiquement une version raccourcie qui garde les informations clés (type, surface, ville), pour ne pas perdre de temps à le reformuler.

**Contexte Thomas** : Le titre auto-généré est `"{Type} {surface}m² — {ville}"` (format F6 MVP). Pour "Appartement 3 pièces 65m² avec terrasse — Bordeaux Chartrons" c'est 57 chars — OK. Mais un titre overridé par Thomas comme "Grand appartement lumineux entièrement rénové 3 pièces 65m² avec terrasse et vue dégagée sur jardins — Bordeaux secteur Chartrons 33300" ferait 140 chars — trop long pour LeBonCoin.

**Critères de succès** :
- Le titre tronqué à 97 chars + "..." reste informatif (type + surface + ville présents)
- Un badge "Titre adapté" avec le compteur de caractères prévient Thomas que la troncature a eu lieu
- Thomas peut voir le titre original et le titre tronqué côte à côte

---

### US-V2a-05 — Gestion photos > 20

**Format JTBD** : Quand mon bien a plus de 20 photos HD sur Versiroom, je veux que V2a me recommande les 20 meilleures à inclure sur LeBonCoin (qui limite à 20), pour publier dans les limites sans avoir à choisir manuellement parmi mes photos.

**Contexte Thomas** : Un appartement avec 6 pièces photographiées à 4 angles = 24 photos. LeBonCoin n'en accepte que 20. Thomas ne veut pas choisir — il veut une recommandation automatique (photos de pièces principales en premier, extras en dernier).

**Critères de succès** :
- Un avertissement "Ce portail accepte 20 photos max — vos 20 premières photos seront incluses dans le ZIP"
- Le ZIP téléchargé pour ce portail contient exactement 20 photos triées par room_type (pièces principales d'abord)

## 3. Specs fonctionnelles — composant ExportPortail

### 3.1 Emplacement et intégration

Le composant `ExportPortail` s'intègre dans la page `/annonce/[uuid]` existante (F6 MVP), sous le bouton "Copier la description" actuel. Il ne remplace pas ce bouton — il est complémentaire.

**Position dans la page** :
```
[Copier la description]         ← bouton existant F6 MVP (texte brut)
─────────────────────────────────
Exporter pour un portail immo
[Dropdown : Choisir un portail ▾]
[Voir le bloc formaté]
[Copier le texte formaté]
[Télécharger les photos (ZIP adapté)]  ← version filtrée si photos > limite portail
```

Le composant n'est visible que si l'utilisateur a un accès Pro (même gate que F6 MVP : `hasProAccess()`).

---

### 3.2 Composant dropdown — sélection du portail

```
Dropdown "Exporter pour..."
├── LeBonCoin           (accessible — icône verte)
├── SeLoger             (accessible — icône verte)
├── Bien'ici            (accessible — icône verte)
└── Logic-Immo          (bientôt disponible — grisé, tooltip "Disponible en V2b")
```

Au changement de sélection dans le dropdown :
- Le bloc de prévisualisation se met à jour instantanément (côté client, pas de requête serveur)
- Le compteur de caractères se met à jour
- Les avertissements (titre trop long, photos en excès) apparaissent ou disparaissent selon le portail

---

### 3.3 Bloc de prévisualisation

Le bloc est divisé en 3 zones visibles :

**Zone 1 — Titre**
```
TITRE (XX/100 caractères)
┌─────────────────────────────────┐
│ Appartement 65m² — Bordeaux     │
└─────────────────────────────────┘
[badge "Adapté" si troncature]
```

**Zone 2 — Description reformatée**
```
DESCRIPTION (XXX/4000 caractères pour LeBonCoin)
┌─────────────────────────────────────────────────┐
│ Bel appartement lumineux de 65m² situé dans le  │
│ secteur Chartrons à Bordeaux. 3 pièces, cuisine │
│ équipée, salon avec terrasse...                 │
│                                                  │
│ — Visuels générés par intelligence artificielle  │
│   à des fins de projection, non contractuels.   │
└─────────────────────────────────────────────────┘
```

**Zone 3 — Champs structurés** (visible uniquement pour SeLoger et Bien'ici qui ont des formulaires à champs séparés)
```
CHAMPS À REMPLIR DANS LE FORMULAIRE
• Surface : 65 m²
• Nombre de pièces : 3
• Prix : 185 000 €
• Ville : Bordeaux
• DPE : [À compléter manuellement]
```

---

### 3.4 Logique de reformatage par portail

#### LeBonCoin

| Champ | Logique |
|---|---|
| Titre | `properties.title_override` ou titre auto-généré — tronqué à 97 chars + "…" si dépassement |
| Description | `description_final` ou `description_generated` — tronquée à 3 800 chars (marge de sécurité sur 4 000) + disclaimer IA (150 chars max) ajouté à la fin |
| Disclaimer | "— Visuels IA à des fins de projection, non contractuels." (57 chars) |
| Photos | Avertissement si > 20 photos, ZIP limité aux 20 premières (triées par ordre room_type) |
| Format copié | Texte continu — titre + saut de ligne + description + disclaimer |

#### SeLoger

| Champ | Logique |
|---|---|
| Titre | Tronqué à 97 chars + "…" si dépassement |
| Description | Tronquée à 1 850 chars + disclaimer (marge sur ~2 000 chars [HYPOTHÈSE]) |
| Champs structurés | Affichés séparément : Surface, Pièces, Prix, Ville — Thomas les copie-colle champ par champ |
| Format copié | Deux sections séparées par `---` : "DESCRIPTION :" + "CHAMPS :" |

#### Bien'ici

| Champ | Logique |
|---|---|
| Titre | Tronqué à 97 chars + "…" si dépassement |
| Description | Tronquée à 2 850 chars + disclaimer (marge sur 3 000 chars [HYPOTHÈSE]) |
| Champs structurés | Surface, Surface loi Carrez si copro, Pièces, Prix, Ville, Nb lots copro si applicable |
| Mention copro | Ajout conditionnel si `properties.is_copro = true` : "Copropriété : XX lots — charges : XX€/an" |
| Format copié | Deux sections : "DESCRIPTION :" + "CHAMPS :" |

---

### 3.5 Bouton "Copier le texte formaté"

- Déclenche `navigator.clipboard.writeText()` avec le contenu du bloc prévisualisé
- Feedback toast : "Texte [LeBonCoin] copié !" pendant 3 secondes
- Fallback si clipboard API indisponible : sélectionne le texte dans le bloc (pour Ctrl+C manuel)

### 3.6 Bouton "Télécharger les photos (ZIP adapté)"

- Même logique que le ZIP F6 MVP (JSZip client-side) mais avec filtre portail
- Pour LeBonCoin : ZIP limité aux 20 premières photos (triées par room_type, salon en premier)
- Pour SeLoger et Bien'ici : ZIP de toutes les photos (pas de limite documentée)
- Nom du fichier : `photos-{portail}-{ville}-{surface}m2.zip` (ex : `photos-leboncoin-bordeaux-65m2.zip`)
- Barre de progression identique au ZIP F6 MVP (callbacks JSZip)

### 3.7 Compteur de caractères en temps réel

- Affiché en `XX/XXXX` sous chaque zone (titre et description)
- Couleur : gris si < 80% de la limite, orange si 80-95%, rouge si > 95%
- Le rouge déclenche un badge "Texte tronqué — informations complètes dans la description Versiroom"

## 4. Specs techniques

### 4.1 Architecture : côté client uniquement vs GPT-4.1-mini

**Décision : reformatage côté client en priorité, GPT-4.1-mini uniquement si troncature intelligente nécessaire.**

Justification :
- Le reformatage standard (tronquer à N chars, injecter disclaimer, séparer champs) est un traitement déterministe sur des chaînes de caractères — aucune IA requise.
- GPT-4.1-mini serait utile **uniquement** si on veut reformuler intelligemment la description (résumer 900 mots en 300 sans perdre le sens). Cette fonctionnalité est différée en V2b — en V2a, la troncature brute suffit.
- Coût GPT-4.1-mini : ~$0,001/appel. Avec Thomas qui exporte 3 portails × 8 biens/an = 24 appels/an → négligeable. Mais la latence (~500ms) et la variabilité du résultat plaident pour une implémentation déterministe.

**Implémentation** :

```typescript
// lib/portal-formatter.ts

export type PortalId = 'leboncoin' | 'seloger' | 'bienici';

export interface PortalConfig {
  id: PortalId;
  label: string;
  titleMaxChars: number;
  descriptionMaxChars: number;
  photosMaxCount: number | null; // null = pas de limite connue
  hasStructuredFields: boolean;
  notes?: string; // marqueur HYPOTHÈSE si applicable
}

export const PORTAL_CONFIGS: Record<PortalId, PortalConfig> = {
  leboncoin: {
    id: 'leboncoin',
    label: 'LeBonCoin',
    titleMaxChars: 100,       // recommandation officielle
    descriptionMaxChars: 4000, // confirmé
    photosMaxCount: 20,        // confirmé (pack pro)
    hasStructuredFields: false,
  },
  seloger: {
    id: 'seloger',
    label: 'SeLoger',
    titleMaxChars: 100,        // [HYPOTHÈSE]
    descriptionMaxChars: 2000, // [HYPOTHÈSE — non documenté publiquement]
    photosMaxCount: null,
    hasStructuredFields: true,
    notes: 'Limites non confirmées officiellement — à vérifier dans le backoffice SeLoger Pro',
  },
  bienici: {
    id: 'bienici',
    label: "Bien'ici",
    titleMaxChars: 100,        // [HYPOTHÈSE]
    descriptionMaxChars: 3000, // [HYPOTHÈSE]
    photosMaxCount: null,
    hasStructuredFields: true,
    notes: 'Limites non confirmées officiellement — à vérifier dans le backoffice Bien\'ici Pro',
  },
};

export const AI_DISCLAIMER = '— Visuels générés par intelligence artificielle à des fins de projection, non contractuels.';
// 87 chars — à déduire de descriptionMaxChars pour calculer la limite réelle du corps
```

### 4.2 Fonction de troncature titre

```typescript
function formatTitle(rawTitle: string, maxChars: number): { text: string; truncated: boolean } {
  if (rawTitle.length <= maxChars) return { text: rawTitle, truncated: false };
  // Tronquer au dernier espace avant maxChars - 3 pour ajouter "..."
  const cutIndex = rawTitle.lastIndexOf(' ', maxChars - 3);
  const safeIndex = cutIndex > 0 ? cutIndex : maxChars - 3;
  return { text: rawTitle.slice(0, safeIndex) + '…', truncated: true };
}
```

### 4.3 Fonction de troncature description

La description est tronquée à `descriptionMaxChars - AI_DISCLAIMER.length - 2` (les 2 = saut de ligne + espace). La troncature se fait au dernier saut de paragraphe ou au dernier espace, pour éviter de couper en milieu de phrase.

```typescript
function formatDescription(rawDescription: string, config: PortalConfig): string {
  const reservedForDisclaimer = AI_DISCLAIMER.length + 2;
  const bodyLimit = config.descriptionMaxChars - reservedForDisclaimer;

  let body = rawDescription;
  let truncated = false;

  if (rawDescription.length > bodyLimit) {
    // Couper au dernier paragraphe complet
    const lastParagraph = rawDescription.lastIndexOf('\n\n', bodyLimit);
    const lastSentence = rawDescription.lastIndexOf('. ', bodyLimit);
    const cutAt = Math.max(lastParagraph, lastSentence);
    body = rawDescription.slice(0, cutAt > 0 ? cutAt + 1 : bodyLimit);
    truncated = true;
  }

  return body + '\n\n' + AI_DISCLAIMER;
}
```

### 4.4 Stockage des configs portails

Les configs sont stockées dans `lib/portal-formatter.ts` (constante client-side). Pas de table DB, pas d'API — ces données évoluent rarement et une mise à jour de code suffit. Si un portail change ses limites, le développeur met à jour `PORTAL_CONFIGS` en une ligne.

**Alternative écartée** : table `portal_configs` en DB avec admin. Overkill pour 3 portails dont 2 ont des limites non officielles — la rigidité d'un schéma DB n'apporte rien quand les données sont déjà incertaines.

### 4.5 Le disclaimer IA est-il inclus dans le texte copié ?

**Oui, toujours, pour tous les portails.** Le disclaimer est inséré automatiquement en fin de description dans le texte copié. Thomas ne peut pas le supprimer dans V2a (il est partie intégrante du texte formaté).

Justification : le risque légal identifié en `f6-annonce-specs.md` section R1 (CGU portails, loi Hoguet) impose cette mesure conservatoire. Le disclaimer est court (87 chars) et ne nuit pas à la qualité de l'annonce.

### 4.6 Composant React — structure

```
components/
  ExportPortail.tsx        — composant principal (dropdown + prévisualisation + boutons)
lib/
  portal-formatter.ts      — configs portails + fonctions de formatage (client-side)
```

`ExportPortail.tsx` est un composant client (`'use client'`). Il reçoit les données de l'annonce via props depuis la page SSR `/annonce/[uuid]` (pas de fetch supplémentaire). Il n'appelle aucune API serveur — tout le reformatage est en mémoire côté client.

### 4.7 Props du composant

```typescript
interface ExportPortailProps {
  title: string;                    // titre de l'annonce (peut être overridé par Thomas)
  description: string;              // description_final ou description_generated
  surface: number | null;
  roomCount: number | null;
  price: number | null;
  city: string;
  propertyType: string;
  isCopro: boolean;
  coprroLots?: number | null;
  coprroChargesAnnuelles?: number | null;
  photos: { url: string; roomType: string; roomLabel: string }[];
}
```

### 4.8 Compatibilité mobile

Le composant doit fonctionner sur iPhone 15 Pro (device principal Thomas sur site). Le bouton "Copier le texte formaté" utilise `navigator.clipboard.writeText()` — disponible sur iOS Safari 13.4+. Le fallback `document.execCommand('copy')` est déprécié mais maintenu pour iOS < 13.4 (rare en 2026).

## 5. Edge cases

### 5.1 Données manquantes (fréquentes sur chantier brut)

| Cas | Comportement attendu |
|---|---|
| **Annonce sans description** (`description_final` ET `description_generated` null) | Le champ description du bloc exporté contient uniquement le disclaimer IA + "Description à venir." — le composant affiche un badge orange "Description incomplète — à compléter avant publication" |
| **Prix absent** (`sale_price` null ou 0) | Dans les champs structurés : afficher "Prix : Sur demande" — ne jamais afficher "Prix : 0 €" ou "Prix : null €" |
| **Surface absente** (`surface_m2` null) | Titre : utiliser `"{Type} — {ville}"` sans la surface. Champs structurés : ligne "Surface" absente du bloc |
| **Nombre de pièces absent** (`room_count` null) | Champs structurés : ligne "Pièces" absente du bloc |
| **Pas de DPE en base** (non stocké dans `properties`) | Champs structurés : ligne "DPE : À compléter manuellement" affichée en orange avec tooltip "Obligatoire depuis 2022 pour les annonces de vente" |
| **Bien en copropriété sans données copro** (`is_copro = true` mais `copro_lots` null) | Champs structurés Bien'ici/SeLoger : "Copropriété : données à compléter manuellement" |

### 5.2 Comportements de troncature

| Cas | Comportement attendu |
|---|---|
| **Titre > limite portail** | Titre tronqué au dernier espace avant la limite - 3 chars, suffixe "…". Badge "Titre adapté (XX/XX chars)" affiché. Thomas voit le titre original dans un toggle "Voir le titre complet" |
| **Description > limite portail** | Description tronquée au dernier saut de paragraphe ou de phrase. Disclaimer IA toujours présent en fin de texte. Badge "Description adaptée (XXXX/XXXX chars)" |
| **Description déjà dans les limites** | Aucune troncature. Disclaimer ajouté à la fin. Compteur vert |
| **Description + disclaimer > limite** | La description est tronquée pour faire de la place au disclaimer — le disclaimer n'est jamais coupé |

### 5.3 Photos en excès

| Cas | Comportement attendu |
|---|---|
| **Annonce ≤ 20 photos → LeBonCoin** | Pas d'avertissement. ZIP contient toutes les photos |
| **Annonce > 20 photos → LeBonCoin** | Avertissement orange : "LeBonCoin accepte 20 photos max — les 20 premières seront incluses dans le ZIP". Ordre des photos dans le ZIP : salon > chambre > cuisine > salle de bain > bureau > autres (ordre d'importance décroissant) |
| **Annonce > 20 photos → SeLoger ou Bien'ici** | Pas d'avertissement (pas de limite documentée) — ZIP de toutes les photos |
| **Annonce avec 0 photos associées** | Impossible (bouton "Créer une annonce" disabled si 0 photo en F6 MVP). Mais si les photos ont été supprimées après création : le bouton ZIP du composant V2a retourne un message "Aucune photo disponible" |

### 5.4 Caractères spéciaux dans la description

| Cas | Comportement attendu |
|---|---|
| **Apostrophes courbes `'` `'`** | Remplacées par l'apostrophe droite `'` (compatibilité encodage portails — certains flux CSV rejettent les guillemets typographiques) |
| **Guillemets `«»`** | Remplacés par guillemets droits `"` |
| **Retours à la ligne** | Maintenus dans la prévisualisation. Dans le texte copié : maintenus (LeBonCoin les supporte) sauf si portail requiert `<BR>` (SeLoger flux pro CSV — mais V2a est un copier-coller manuel, pas un flux automatisé) |
| **Emojis dans la description** | Autorisés pour LeBonCoin (Thomas les utilise parfois dans ses descriptions) — filtrés pour SeLoger et Bien'ici (portails professionnels, emojis déconseillés dans les CGU pro) |
| **HTML dans la description** | Balises HTML échappées — jamais de `<b>`, `<p>` etc. dans le texte copié (les portails rejettent le HTML en entrée manuelle) |

### 5.5 Comportements UI

| Cas | Comportement attendu |
|---|---|
| **Dropdown sans sélection** | L'état initial est "Choisir un portail" — les boutons "Copier" et "Télécharger" sont disabled jusqu'à sélection |
| **Clic "Copier" deux fois rapidement** | Le toast "Texte copié !" reste affiché 3s — pas de double toast superposé |
| **Clipboard API refusée par le navigateur** | Le texte dans le bloc de prévisualisation devient sélectionnable et un message "Sélectionnez le texte ci-dessous (Ctrl+C)" s'affiche |
| **Portail grisé (Logic-Immo)** | Clic sur l'option grisée → tooltip "Disponible prochainement" — pas d'action |
| **Annonce archivée** | La page `/annonce/[uuid]` retourne 404 (comportement F6 MVP) — V2a ne s'affiche jamais sur une annonce archivée |

## 6. Critères d'acceptation testables (Definition of Done)

### 6.1 Fonctionnels — happy path

- [ ] Le composant `ExportPortail` est visible sur `/annonce/[uuid]` sous le bouton "Copier la description" existant, uniquement pour les utilisateurs Pro (`hasProAccess()`)
- [ ] Le dropdown affiche 3 options actives (LeBonCoin, SeLoger, Bien'ici) + 1 option grisée (Logic-Immo)
- [ ] La sélection d'un portail dans le dropdown met à jour instantanément le bloc de prévisualisation sans rechargement de page
- [ ] Le titre affiché pour LeBonCoin est ≤ 100 caractères (test : injecter un titre de 150 chars → résultat ≤ 100 chars + "…")
- [ ] La description affichée pour LeBonCoin est ≤ 4 000 caractères (test : injecter une description de 5 000 chars → résultat ≤ 4 000 chars)
- [ ] La description affichée pour SeLoger est ≤ 2 000 caractères [HYPOTHÈSE — à adapter si limite confirmée différente]
- [ ] La description affichée pour Bien'ici est ≤ 3 000 caractères [HYPOTHÈSE — à adapter si limite confirmée différente]
- [ ] Le disclaimer IA est **toujours présent** en fin de description pour les 3 portails (test : vérifier la présence de la chaîne "artificielle" dans le texte copié)
- [ ] Le bouton "Copier le texte formaté" copie le texte dans le presse-papier (test : coller dans un éditeur de texte et vérifier le contenu)
- [ ] Le toast "Texte [NomPortail] copié !" s'affiche pendant 3 secondes après le clic
- [ ] Le bouton "Télécharger les photos (ZIP adapté)" génère un ZIP nommé `photos-{portail}-{ville}-{surface}m2.zip`
- [ ] Pour LeBonCoin avec > 20 photos : l'avertissement "20 photos max" est visible et le ZIP contient exactement 20 photos
- [ ] Pour LeBonCoin avec ≤ 20 photos : pas d'avertissement et le ZIP contient toutes les photos

### 6.2 Champs structurés

- [ ] Pour SeLoger et Bien'ici : le bloc copié contient une section "CHAMPS À REMPLIR" séparée de la description par `---`
- [ ] Les champs structurés affichent "Prix : Sur demande" si `sale_price` est null ou 0 (jamais "0 €")
- [ ] Les champs structurés n'affichent pas la surface si `surface_m2` est null (pas de "null m²")
- [ ] Les champs structurés n'affichent pas les pièces si `room_count` est null
- [ ] La ligne "DPE : À compléter manuellement" est affichée en orange si le DPE est absent de la base

### 6.3 Troncature et compteur

- [ ] Le badge "Titre adapté (XX/XX chars)" s'affiche quand le titre est tronqué
- [ ] Le badge "Description adaptée (XXXX/XXXX chars)" s'affiche quand la description est tronquée
- [ ] Le compteur de caractères passe en orange quand > 80% de la limite, en rouge quand > 95%
- [ ] Le disclaimer IA n'est jamais coupé — même quand la description est à la limite exacte

### 6.4 Caractères spéciaux

- [ ] Les apostrophes courbes (`'`) sont remplacées par des apostrophes droites dans le texte copié
- [ ] Les guillemets typographiques (`«»`) sont remplacés par des guillemets droits dans le texte copié
- [ ] Les emojis sont filtrés du texte copié pour SeLoger et Bien'ici (test : description avec emoji → texte copié sans emoji pour ces portails)

### 6.5 Accessibilité et performance

- [ ] `data-testid` sur tous les éléments interactifs : `export-portail-dropdown`, `export-portail-preview`, `export-portail-copy-btn`, `export-portail-zip-btn`, `export-portail-char-counter`
- [ ] Le composant est responsive sur iPhone 15 Pro (375px de large) — dropdown et boutons accessibles sans zoom
- [ ] Le changement de portail dans le dropdown est < 50ms (reformatage purement synchrone côté client)
- [ ] `next build` passe sans erreur après l'ajout du composant

### 6.6 Gate et sécurité

- [ ] Le composant `ExportPortail` n'est pas rendu si `!hasProAccess()` — le HTML n'est pas présent dans le DOM (pas juste masqué par CSS)
- [ ] Le composant fonctionne sur la page publique `/annonce/[uuid]` sans authentification côté client (les données de formatage sont dans les props SSR)

## 7. KPI et lien North Star

### 7.1 KPI de succès V2a

| KPI | Définition | Méthode de mesure | Cible [HYPOTHÈSE] |
|---|---|---|---|
| **Taux d'utilisation Export** | % d'annonces créées pour lesquelles le bouton "Copier texte formaté" est cliqué au moins une fois | Event PostHog `export_portail_copy` / `annonce_created` | > 40% à 30 jours post-lancement |
| **Distribution portails** | Répartition des clics par portail (LeBonCoin / SeLoger / Bien'ici) | Event PostHog `export_portail_copy` avec propriété `portal_id` | LeBonCoin > 50% (portail le plus accessible) |
| **Taux de troncature titre** | % d'exports où le titre a été tronqué | Event PostHog `export_portail_copy` avec propriété `title_truncated: true` | < 20% (la plupart des titres auto-générés sont courts) |
| **Taux d'export photos adapté** | % d'exports LeBonCoin avec avertissement > 20 photos | Event PostHog `export_portail_zip_download` avec propriété `photos_capped: true` | < 10% (Thomas a rarement 20+ photos par bien) |

### 7.2 Lien avec le North Star (3 000€/mois de marge nette)

V2a n'est pas une feature de monétisation directe — elle ne crée pas de revenus supplémentaires. Elle joue sur **deux leviers indirects** :

**Levier 1 — Rétention Thomas (prévention churn)**

Sans V2a, Thomas utilise Versiroom pour les visuels et repart sur d'autres outils pour la publication. Si un outil concurrent propose l'export portail natif, Thomas n'a plus de raison de rester sur Versiroom pour la partie publication. V2a crée de la **stickiness** : toute la chaîne de valeur immobilière est dans Versiroom.

Lien North Star : rétention × LTV. Thomas achète 2-3 packs Pro/an (8-12 biens × 1 pack = ~4 packs à 29€ = 116€/an). Sur 100 Thomas actifs, la rétention de 10% supplémentaire = 10 × 116€ = 1 160€/an de revenus supplémentaires.

**Levier 2 — Conversion freemium → Pro**

V2a est une feature Pro (gate `hasProAccess()`). Sa visibilité dans le flow annonce (même si grisée pour les utilisateurs gratuits) crée un **nudge de conversion** : "Pour exporter directement sur LeBonCoin, passez au Pack Pro." Ce nudge est positionné au moment où Thomas a déjà créé une annonce et réalise la valeur de Versiroom — moment optimal pour la conversion.

Lien North Star : conversion × panier moyen. Si V2a convertit 5% des utilisateurs gratuits qui créent une annonce → contribution directe au MRR.

## 8. Effort estimé

> Rappel CLAUDE.md Règle n°5 : en contexte 100% IA, l'effort est mesuré en complexité technique (dépendances, surface de code) et non en jours/homme. Ces estimations calibrent la séquence d'exécution, pas une timeline.

| Composant | Complexité | Dépendances |
|---|---|---|
| `lib/portal-formatter.ts` — configs + fonctions formatage | Faible — logique string déterministe | Aucune dépendance externe |
| `components/ExportPortail.tsx` — UI dropdown + prévisualisation | Moyenne — état React, compteur temps réel, clipboard API | `portal-formatter.ts` |
| Intégration dans `/annonce/[uuid]` — props SSR → client | Faible — ajout de props dans le composant page | `ExportPortail.tsx`, page existante F6 MVP |
| ZIP adapté par portail (filtre 20 photos LeBonCoin) | Faible — tri + slice sur tableau photos existant | JSZip déjà installé en F6 MVP |
| Events PostHog (tracking V2a) | Faible — 4 events avec propriétés | `docs/analytics/kpi-framework.md` |

**Séquence d'exécution** (dépendances strictes) :
1. `portal-formatter.ts` — pas de dépendance, premier à implémenter
2. `ExportPortail.tsx` — lit `portal-formatter.ts`
3. Intégration dans `/annonce/[uuid]` — page F6 MVP doit exister (dépendance stricte sur F6 MVP)
4. Tests unitaires `portal-formatter.ts` (fonctions de troncature sont testables sans DOM)
5. Events PostHog — peuvent être ajoutés après l'implémentation UI

**Précondition bloquante** : F6 MVP (table `annonces`, page `/annonce/[uuid]`, données en props) doit être en production avant de commencer V2a.

## 9. Agents spécialisés recommandés

L'implémentation de V2a ne nécessite pas d'agent spécialisé au-delà des agents existants. Cependant, deux validations spécifiques sont identifiées :

**@legal** (agent existant) — Vérification CGU portails sur visuels IA

Priorité : HAUTE. La section R1 de `f6-annonce-specs.md` a identifié le risque légal (CGU SeLoger/LeBonCoin sur les visuels IA). Le disclaimer est la mesure conservatoire — mais @legal doit confirmer que le disclaimer suffit et qu'il n'y a pas d'obligation d'étiquetage supplémentaire (ex : watermark IA sur les photos elles-mêmes). Cette validation est indépendante de V2a mais doit être traitée avant le lancement de F6 MVP.

**@qa** (agent existant) — Tests unitaires `portal-formatter.ts`

Les fonctions `formatTitle()` et `formatDescription()` sont des transformations déterministes sur des chaînes de caractères — idéalement couvertes par des tests unitaires Vitest. @qa doit produire la suite de tests pour ce module (cas nominaux + edge cases section 5) en même temps que @fullstack implémente.

---

## Hypothèses à valider

| # | Hypothèse | Impact si fausse | Comment valider |
|---|---|---|---|
| H1 | SeLoger limite la description à ~2 000 caractères | Si limite > 2 000 : la troncature est inutilement agressive. Si limite < 2 000 : certaines descriptions pourraient encore dépasser | Tester dans le backoffice SeLoger Pro (compte agence partenaire Thomas) |
| H2 | Bien'ici limite la description à ~3 000 caractères | Idem H1 | Tester dans le backoffice Bien'ici Pro |
| H3 | Le titre est limité à 100 caractères sur SeLoger et Bien'ici | Si limite différente : ajuster `titleMaxChars` dans `PORTAL_CONFIGS` | Tester dans les interfaces de dépôt d'annonce |
| H4 | LeBonCoin accepte 20 photos en compte particulier (pas seulement pack pro) | Si 20 photos = pack pro uniquement : l'avertissement ne s'applique qu'aux comptes pro LeBonCoin de Thomas | Vérifier dans l'interface LeBonCoin particulier |

---

**Handoff → @fullstack**

- Fichiers produits : `docs/product/f6-v2a-export-portails-specs.md`
- Dépendance bloquante : F6 MVP (`/annonce/[uuid]` + table `annonces` + props SSR) doit être en production
- Fichiers à créer :
  - `lib/portal-formatter.ts` — configs + `formatTitle()` + `formatDescription()` (signatures dans section 4.2 et 4.3)
  - `components/ExportPortail.tsx` — composant client, props interface dans section 4.7
- Fichier à modifier :
  - `app/annonce/[uuid]/page.tsx` — ajouter `<ExportPortail />` sous le bouton "Copier la description" existant, passer les données de l'annonce en props
- Points d'attention critiques :
  - Le composant est `'use client'` — tout le reformatage est synchrone côté client, aucune API serveur
  - Le gate `hasProAccess()` doit s'appliquer au niveau du rendu SSR (ne pas inclure le composant dans le HTML si non Pro)
  - Les limites SeLoger et Bien'ici sont des hypothèses (H1, H2, H3) — utiliser les valeurs de `PORTAL_CONFIGS` de façon à les modifier facilement sans toucher au composant UI
  - Le disclaimer IA (`AI_DISCLAIMER`) est inséré automatiquement — Thomas ne peut pas le supprimer en V2a
  - Pour le ZIP LeBonCoin > 20 photos : trier par room_type (salon > chambre > cuisine > sdb > bureau > autres) avant de prendre les 20 premières
- Handoff @qa simultané : demander à @qa de couvrir `lib/portal-formatter.ts` avec des tests unitaires Vitest (fonctions `formatTitle` et `formatDescription` sont purement synchrones, 100% testables)
