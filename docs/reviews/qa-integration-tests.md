# QA Integration Tests — Versiroom

**Date** : 2026-03-25
**Branche** : `claude/fix-lint-e2e-tests-4VmSc`
**Agent** : @qa

---

## Test 1 — Build + TypeScript

| Commande | Resultat |
|---|---|
| `npx tsc --noEmit` | PASS — aucune erreur |
| `npx next build` | PASS — build complet, toutes les pages et routes API compilees |

**Verdict : PASS**

---

## Test 2 — Verification des imports

### Composants (`@/components/*`)

23 composants importes dans `app/` — tous les fichiers existent dans `components/` :

- AuthButton, AuthModal, AnnoncePublicView, AnnonceGallery, ContactSticky, RoomNav
- DossierPublicView, DossierCaracteristiques, ShareButtons, StepIndicator, UploadZone
- StylePicker, ImageComparator, RefineModal, VersionSelector, RoomTypePicker
- OutdoorSubtypePicker, MerchantMode, PhotoAssociator, Providers, Lightbox
- DossierResult, DossierProgress

### Librairies (`@/lib/*`)

17 modules lib importes — tous les fichiers existent dans `lib/` :

- constants, image-utils, outdoor-styles, annonce, properties, user-photos, merchant
- dossier, db, custom-prompt, auth, credits, stripe, iteration-prompt, room-types
- outdoor-subtypes, image-metrics

**Verdict : PASS** — zero import casse.

---

## Test 3 — Verification des data-testid

### Couverture

- 120+ data-testid repartis sur les pages et composants
- Tous les formulaires critiques sont couverts (auth, merchant profile, bien detail, dossier, annonce)
- Les grilles/listes ont des testids (galerie-grid, biens-list, dossiers-list)

### Doublons

| data-testid | Fichier 1 | Fichier 2 | Severite |
|---|---|---|---|
| `dossier-download-pdf` | `app/dossier/[uuid]/page.tsx:263` | `components/DossierResult.tsx:123` | Basse — pages differentes, jamais dans le meme DOM |

### Observation — ROOM_TYPE_LABELS non centralise

`app/annonce/[uuid]/page.tsx:23` definit un `ROOM_TYPE_LABELS` local au lieu d'importer depuis `lib/constants.ts`. Ce n'est pas un bug (le fichier fonctionne) mais une dette technique : si les labels changent, il faudra mettre a jour 2 endroits.

**Verdict : PASS avec 1 doublon basse severite + 1 dette technique**

---

## Test 4 — Verification des z-index

### Hierarchie observee

| Composant | z-index | Fichier |
|---|---|---|
| Header (toutes pages) | `z-50` | `app/page.tsx:636`, `app/ma-galerie/page.tsx:109,160,189`, etc. |
| RoomNav (sous-nav sticky) | `z-40` | `components/RoomNav.tsx:24` |
| Generate CTA sticky | `z-40` | `app/page.tsx:1053` |
| ContactSticky | `z-[95]` | `components/ContactSticky.tsx:26` |
| Lightbox | `z-[100]` | `components/Lightbox.tsx:66` |
| Lightbox controls | `z-[101]` | `components/Lightbox.tsx:75,84,92,105` |
| AuthModal | `z-[100]` | `components/AuthModal.tsx:200` |
| RefineModal | `z-50` | `components/RefineModal.tsx:116` |
| Dropdown menus | `z-50`, `z-20`, `z-10` | Divers |

### Analyse des conflits

- **Lightbox et AuthModal partagent z-[100]** : pas de conflit reel car ils ne coexistent jamais (la lightbox est dans les pages annonce/dossier, le modal auth se ferme avant interaction galerie).
- **RefineModal a z-50 (meme que Header)** : potentiellement problematique si le header est visible pendant le modal. Cependant, RefineModal est un `fixed inset-0` qui couvre tout l'ecran, donc visuellement correct.
- **ContactSticky z-[95] sous Lightbox z-[100]** : correct, la lightbox doit etre au-dessus du CTA contact.

**Verdict : PASS** — hierarchie coherente, pas de conflit fonctionnel.

---

## Test 5 — Verification des routes API

32 routes API detectees, toutes avec les bons exports HTTP :

| Route | Methodes |
|---|---|
| `/api/generate` | POST |
| `/api/preprocess-prompt` | POST |
| `/api/auth/[...nextauth]` | GET, POST (via `export { handler as GET, handler as POST }`) |
| `/api/auth/register` | POST |
| `/api/user/credits` | GET |
| `/api/user/photos` | GET |
| `/api/properties` | POST, GET |
| `/api/properties/[id]` | GET, PATCH, DELETE |
| `/api/properties/[id]/photos` | POST, GET, DELETE |
| `/api/properties/[id]/dossier` | POST |
| `/api/properties/[id]/annonce` | GET |
| `/api/dossier` | POST, GET |
| `/api/dossier/[uuid]` | GET, POST, PATCH |
| `/api/dossier/[uuid]/pdf` | GET |
| `/api/annonce` | POST |
| `/api/annonce/[uuid]` | GET |
| `/api/annonce/[uuid]/archive` | POST |
| `/api/merchant/profile` | GET, PUT, POST |
| `/api/merchant/enrich-property` | GET, POST |
| `/api/merchant/lookup-siret` | POST |
| `/api/stripe/checkout` | POST |
| `/api/stripe/webhook` | POST |
| `/api/logs` | GET |
| `/api/logs/image` | GET |
| `/api/logs/storage-check` | GET |
| `/api/health` | GET |
| `/api/replay` | POST |
| `/api/replay/batch` | POST |
| `/api/demo` | GET |
| `/api/demo/generate` | POST |
| `/api/admin/add-credits` | POST |
| `/api/admin/seed-user` | POST |
| `/api/admin-auth` | POST |

**Verdict : PASS** — toutes les routes exportent les methodes attendues.

---

## Test 6 — Verification lib/constants.ts

### STYLE_LABELS

- Defini dans `lib/constants.ts:6` — 13 styles (12 + custom)
- Importe dans : `app/ma-galerie/page.tsx`, `app/mes-biens/[id]/page.tsx`
- Utilise pour : filtres galerie, labels dans cartes photos

### TYPE_LABELS

- Defini dans `lib/constants.ts:22` — 6 types de biens
- Importe dans : `app/mes-biens/page.tsx`, `app/mes-biens/[id]/page.tsx`
- Utilise pour : filtres biens, labels dans cartes

### Observation — ROOM_TYPE_LABELS manquant dans constants.ts

`app/annonce/[uuid]/page.tsx` definit ses propres `ROOM_TYPE_LABELS` localement (10 room types). Ce dictionnaire n'est pas centralise dans `lib/constants.ts`. Pas de bug fonctionnel, mais risque de desynchronisation si les labels changent.

**Verdict : PASS** — imports corrects, centralisation effective pour STYLE_LABELS et TYPE_LABELS.

---

## Test 7 — Verification des migrations DB

### generation_logs (lib/db.ts)

- **CREATE TABLE** : 27 colonnes dans le schema initial
- **ALTER TABLE** (migrateColumns) : 16 colonnes migrables (idempotent via `EXCEPTION WHEN duplicate_column`)
- Colonnes de migration : built_prompt_pass1/pass2, image paths, iteration fields (is_iteration, iteration_number, session_id, user_comment_raw/enriched, pass1_cache_key), room_type, outdoor fields, prompt_version, replay fields (is_replay, replay_source_id, replay_label, pixel_diff_pct, color_shift_score)

### properties (lib/properties.ts)

- **CREATE TABLE** : 22 colonnes dans le schema initial
- **ALTER TABLE** : 11 colonnes migrables (dpe_classe, ges_classe, etage, ascenseur, parking, cave, charges_copro_annuelles, annee_construction, exposition, taxe_fonciere, nb_lots_copro)

### dossiers + dossier_photos (lib/dossier.ts)

- **CREATE TABLE dossiers** : 16 colonnes
- **CREATE TABLE dossier_photos** : 13 colonnes
- **ALTER TABLE dossiers** : 8 colonnes migrables (enrichment: latitude, longitude, ville, code_postal, description_commerciale, carte_image_key, prix_moyen_m2, nb_pieces)

### users + purchases (lib/db.ts)

- **CREATE TABLE users** : 6 colonnes
- **CREATE TABLE purchases** : 8 colonnes
- **ALTER TABLE users** : 1 colonne (password_hash)

### merchant_profiles (lib/merchant.ts)

- **CREATE TABLE** : schema auto-cree

### annonces (lib/annonce.ts)

- **CREATE TABLE** : schema auto-cree

### user_photos (lib/user-photos.ts)

- **CREATE TABLE** : schema auto-cree

**Verdict : PASS** — toutes les migrations sont idempotentes (CREATE IF NOT EXISTS + ALTER with EXCEPTION handler). Pas de risque de crash au deploy.

---

## Resume

| Test | Resultat | Issues |
|---|---|---|
| 1. Build + TypeScript | PASS | - |
| 2. Imports | PASS | - |
| 3. data-testid | PASS (mineur) | 1 doublon basse severite (`dossier-download-pdf`) |
| 4. z-index | PASS | - |
| 5. Routes API | PASS | - |
| 6. lib/constants.ts | PASS (observation) | ROOM_TYPE_LABELS non centralise dans annonce page |
| 7. Migrations DB | PASS | - |

**Resultat global : 7/7 PASS** — aucun bug bloquant, aucune regression detectee.

### Points d'amelioration (non bloquants)

1. **ROOM_TYPE_LABELS** : centraliser dans `lib/constants.ts` et importer dans `app/annonce/[uuid]/page.tsx` (dette technique)
2. **data-testid doublon** : renommer `dossier-download-pdf` dans `DossierResult.tsx` en `dossier-result-download-pdf` pour eviter toute ambiguite dans les tests E2E futurs
