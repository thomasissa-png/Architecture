# Specs — Fusion Mode Standard + MerchantMode en un Mode Unique

> Décision fondateur 2026-04-03 : les 2 modes font la même chose, avoir 2 codebases cause des bugs récurrents (session, split mode, itérations implémentés dans un mode mais pas l'autre). Fusion obligatoire.

## Diagnostic

| Composant | Mode Standard (page.tsx) | MerchantMode | Garder |
|---|---|---|---|
| Upload | UploadZone (max 3-5) | UploadZone (max 15) | **UploadZone** — max selon plan |
| Config par photo | Cartes per-photo (2+ photos) | Cartes per-photo (toujours) | **Cartes per-photo toujours** |
| Style 1 photo | StylePicker global | Cartes per-photo | **Carte per-photo** (cohérent) |
| Génération API | /api/generate (client orchestre) | /api/dossier batch (serveur) | **/api/generate** (simplifié, client orchestre) |
| Visuel intermédiaire | Split mode client (pass1 visible) | Split mode serveur (polling) | **Split mode client** (plus réactif) |
| Résultats | ImageComparator + VersionSelector | DossierResult + page dossier | **ImageComparator** (unifié) |
| Itérations | RefineModal → /api/generate | handleIterate → /api/dossier PATCH | **RefineModal → /api/generate** (simplifié) |
| Association bien | Non | Post-génération | **Post-génération optionnel** (Pro) |
| Dossier PDF | Non | Oui | **Bouton "Créer un dossier"** (Pro, post-génération) |
| Page mes-dossiers | Supprimée | — | — |

## Architecture cible

### Flow unique (tous les utilisateurs)

```
Upload (UploadZone, max selon plan)
    ↓
Cartes per-photo (pièce + style + indoor/outdoor + format)
    ↓
Bouton Générer
    ↓
Loading avec visuels intermédiaires (pass1 visible)
    ↓
Résultats : ImageComparator × N photos
    - Bouton × supprimer un résultat
    - Bouton Affiner (RefineModal, itérations)
    - Bouton Télécharger / Partager
    ↓
[Pro only] Bouton "Associer à un bien" / "Créer un dossier"
```

### Composants à garder

- `UploadZone.tsx` — tel quel, prop `maxFiles` selon plan
- `StylePicker.tsx` — utilisé dans les cartes per-photo (dropdown)
- `ImageComparator.tsx` — comparateur avant/après
- `RefineModal.tsx` — modale d'itération
- `VersionSelector.tsx` — sélection versions itérées
- `PhotoAssociator.tsx` — association à un bien (Pro)

### Composants à supprimer

- `MerchantMode.tsx` — fusionné dans page.tsx
- `DossierProgress.tsx` — remplacé par le loading unifié de page.tsx
- `DossierResult.tsx` — remplacé par ImageComparator

### APIs

- `/api/generate` — reste l'API unique de génération (split mode + itérations)
- `/api/dossier` — reste pour la création/gestion de dossiers PDF, mais n'est plus le point d'entrée de la génération
- `/api/dossier/[uuid]` PATCH `action:"iterate"` — supprimé, les itérations passent par `/api/generate`

## Plan d'exécution (étapes incrémentales)

### Étape 1 — Mode unifié dans page.tsx (le plus gros morceau)

**Objectif** : un seul flow dans page.tsx pour tous les utilisateurs.

1. Supprimer la condition `{session && hasPro && <MerchantMode />}` / `{(!session || !hasPro) && <StandardMode />}`
2. Le flow est TOUJOURS : UploadZone → cartes per-photo → StylePicker dans chaque carte → Générer
3. Max photos : `maxFiles` basé sur le plan (gratuit=3, Starter=5, Pro=15)
4. La génération utilise `/api/generate` avec `splitMode: true` (client orchestre le batch comme aujourd'hui, avec `Promise.allSettled` + `MAX_CONCURRENT`)
5. Le loading montre les visuels intermédiaires (pass1) comme codé dans le fix React batching
6. Les résultats s'affichent dans `ImageComparator` avec `VersionSelector` + `RefineModal`

**Fichiers modifiés** : `app/page.tsx`
**Fichiers supprimés** : `components/MerchantMode.tsx`, `components/DossierProgress.tsx`, `components/DossierResult.tsx`

### Étape 2 — Association bien post-génération (Pro only)

**Objectif** : après la génération, un bouton "Associer à un bien" pour les Pro.

1. Reprendre `PhotoAssociator.tsx` existant
2. L'afficher sous chaque résultat pour les Pro
3. L'utilisateur peut associer ses photos à un bien existant ou en créer un

**Fichiers modifiés** : `app/page.tsx` (ajout conditionnel Pro)

### Étape 3 — Dossier PDF post-génération (Pro only)

**Objectif** : bouton "Créer un dossier" qui génère un dossier PDF à partir des photos associées.

1. L'utilisateur sélectionne un bien → voit ses photos → clique "Créer un dossier"
2. Appel à `/api/dossier` POST pour créer le dossier
3. Appel à `/api/dossier/[uuid]` PATCH pour attacher les photos

**Fichiers modifiés** : composant dédié (à créer), APIs dossier existantes

### Étape 4 — Nettoyage

1. Supprimer `MerchantMode.tsx`
2. Supprimer `DossierProgress.tsx`, `DossierResult.tsx`
3. Supprimer les références dans les imports
4. Nettoyer les APIs dossier (retirer la logique de génération, garder uniquement gestion/PDF)

## Estimation

- Étape 1 : le plus gros, ~4-6h agent
- Étape 2 : ~1h
- Étape 3 : ~2h
- Étape 4 : ~1h nettoyage

## Risques

- **Régression itérations** : le mode standard a déjà les itérations via RefineModal → /api/generate. C'est le flow à garder.
- **Régression batch** : le mode standard orchestre déjà le batch côté client (Promise.allSettled). C'est le flow à garder.
- **Perte fonctionnalité dossier** : les dossiers restent créables post-génération. Ce n'est plus le point d'entrée.

---

**Handoff → @fullstack**
- Commencer par l'Étape 1 (le plus impactant)
- Tester avec les 3 plans (gratuit, Starter, Pro) après chaque étape
- Ne PAS supprimer MerchantMode.tsx avant que l'Étape 1 soit validée en production
