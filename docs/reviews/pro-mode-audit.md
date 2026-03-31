# Audit Mode Pro — Tous les scénarios

**Date** : 2026-03-31
**Méthode** : Lecture de code (pas d'exécution)
**Fichiers audités** : MerchantMode.tsx, route.ts (dossier), route.ts (dossier/[uuid]), lib/dossier.ts, lib/properties.ts, lib/style-resolver.ts, app/mes-biens/page.tsx, app/mes-biens/[id]/page.tsx, app/api/properties/[id]/dossier/route.ts, app/api/annonce/route.ts, lib/annonce.ts, lib/outdoor-styles.ts

---

## Tableau des scénarios

| # | Scénario | Chemin | Résultat attendu | Résultat réel (code) | Bug ? |
|---|---|---|---|---|---|
| S1 | Upload photos + style prédéfini + génération dossier | MerchantMode → POST /api/dossier → POST /api/dossier/[uuid] (photos) → PATCH generate | Dossier créé, photos générées avec le style choisi | OK — le chemin fonctionne pour les styles indoor prédéfinis | Non |
| S2 | Upload photos + style "custom" (personnalisé) | MerchantMode → styleId="custom" + customPrompt | Dossier généré avec le prompt custom préprocessé | OK si customPrompt non vide — le code gère le cas custom (ligne 356-388 de [uuid]/route.ts) | **P1** — voir BUG-1 |
| S3 | Upload photos outdoor + style outdoor | MerchantMode → isOutdoor=true + outdoorStyleId | Dossier généré avec le style outdoor choisi | **CASSÉ** — outdoorStyleId perdu, mauvais style appliqué | **P0** — voir BUG-2 |
| S4 | Upload photos outdoor + outdoor subtype | MerchantMode → outdoorSubtype | Subtype pris en compte dans la génération | **CASSÉ** — outdoorSubtype jamais stocké ni utilisé | **P1** — voir BUG-3 |
| S5 | Auto-création bien depuis dossier MerchantMode | POST /api/dossier → findOrCreatePropertyByAddress | Bien créé dans "Mes biens" avec toutes les infos | **PARTIEL** — bien créé mais incomplet | **P1** — voir BUG-4 |
| S6 | Créer un bien dans "Mes biens" → fiche | app/mes-biens → POST /api/properties → redirect /mes-biens/[id] | Bien créé, fiche accessible et éditable | OK — le flow de création fonctionne |  Non |
| S7 | Éditer les infos complémentaires d'un bien | /mes-biens/[id] → PATCH /api/properties/[id] | Sauvegarde DPE, GES, étage, etc. | OK — updateProperty gère tous les champs | Non |
| S8 | Créer un dossier depuis "Mes biens" (photos existantes) | /mes-biens/[id] → POST /api/properties/[id]/dossier | Dossier créé avec photos déjà générées | **PARTIELLEMENT CASSÉ** — voir BUG-5 | **P1** |
| S9 | Créer une annonce depuis un bien | /mes-biens/[id] → POST /api/annonce | Annonce créée à partir du bien + photos | OK — flow fonctionnel si photos associées | Non |
| S10 | Lien dossier ↔ bien (auto-créé) | dossier.bien_adresse ↔ property.address_raw | Le bien affiche le dossier associé | **FRAGILE** — jointure sur LOWER(TRIM(adresse)) | **P2** — voir BUG-6 |
| S11 | Itérations/refine sur photos de dossier | Mode Pro après génération | Modifier une photo générée (ajuster le mobilier, le style) | **INEXISTANT** — aucune fonctionnalité d'itération | **P1** — voir BUG-7 |
| S12 | Régénérer une photo individuelle de dossier | MerchantMode → PATCH regenerate | Photo re-générée, crédit consommé puis remboursé si échec | OK — le flow existe et gère le remboursement | Non |
| S13 | Batch de photos mixtes (indoor + outdoor) dans un dossier | MerchantMode avec certaines photos indoor et d'autres outdoor | Chaque photo générée avec le bon pipeline | **CASSÉ pour les outdoor** — même bug que S3 | **P0** |
| S14 | Bien auto-créé non éditable (bug remonté) | findOrCreatePropertyByAddress → /mes-biens/[id] | Le bien doit être éditable comme un bien créé manuellement | Le bien EST techniquement éditable (même API PATCH) mais incomplet | **P1** — voir BUG-4 |
| S15 | Multi-styles globaux | MerchantMode globalStyles array | Pouvoir appliquer un style différent par photo via style global | **BUG** — seul globalStyles[0] est envoyé au dossier | **P2** — voir BUG-8 |

---

## Liste des bugs par sévérité

### P0 — Bloquants

#### BUG-2 : Photos outdoor — style outdoor perdu, mauvais style appliqué
- **Fichier** : `components/MerchantMode.tsx` ligne 339, `app/api/dossier/[uuid]/route.ts` lignes 87-96 et 348
- **Cause racine** : MerchantMode envoie `outdoorStyleId` dans le body de l'upload (ligne 342), mais :
  1. Le `styleId` envoyé est `p.entry?.styleOverride?.id || globalStyles[0] || "custom"`. Or pour les photos outdoor, `styleOverride` est toujours `null` (le dropdown outdoor utilise `outdoorStyleId`, pas `styleOverride`). Donc le styleId tombe à `globalStyles[0]` (un style indoor) ou `"custom"`.
  2. Le POST handler `/api/dossier/[uuid]` ne lit pas `outdoorStyleId` du body (absent du type à la ligne 88-96).
  3. Dans `generateSinglePhoto` (ligne 348), `effectiveStyleId` est un style indoor, mais `photo.is_outdoor` est `true`, donc `getStyleById(indoorStyleId, true)` cherche dans `OUTDOOR_STYLES` et ne trouve pas → **crash "Style introuvable"**.
- **Impact** : Toute photo outdoor dans un dossier Pro échoue ou utilise le mauvais style.
- **Fix proposé** : 
  1. Dans MerchantMode ligne 339 : `styleId: p.entry?.isOutdoor ? (p.entry?.outdoorStyleId || globalStyles[0] || "custom") : (p.entry?.styleOverride?.id || globalStyles[0] || "custom")`
  2. Stocker `outdoorStyleId` et `outdoorSubtype` dans `dossier_photos` (nouvelles colonnes)
  3. Dans `generateSinglePhoto` : utiliser `photo.outdoor_style_id || photo.style_id` quand `photo.is_outdoor`

### P1 — Importants

#### BUG-1 : Style custom avec prompt vide → génération avec prompts vides
- **Fichier** : `app/api/dossier/[uuid]/route.ts` lignes 356-378
- **Cause racine** : Si l'utilisateur choisit "Personnalisé" comme style mais ne saisit pas de texte dans le champ custom, `customPrompt` est `""`. Le code stocke `custom_prompt = ""` en DB, puis `generateSinglePhoto` envoie `surfacePrompt = ""` et `furniturePrompt = ""` au generate API. Le résultat sera une génération incohérente ou un échec silencieux.
- **Impact** : Génération de mauvaise qualité sans message d'erreur explicite.
- **Fix proposé** : Validation côté client (MerchantMode) : si `styleId === "custom"` et `customPrompt` est vide → bloquer avec message "Décrivez le style souhaité". Côté serveur : si `effectiveStyleId === "custom"` et `custom_prompt` est vide → fallback sur "scandinavian" avec warning log.

#### BUG-3 : Outdoor subtype jamais stocké ni utilisé dans les dossiers
- **Fichier** : `components/MerchantMode.tsx` ligne 343, `app/api/dossier/[uuid]/route.ts`, `lib/dossier.ts`
- **Cause racine** : MerchantMode envoie `outdoorSubtype` dans le body de l'upload, mais la colonne n'existe pas dans `dossier_photos`, le POST handler ne la lit pas, et `generateSinglePhoto` ne l'envoie pas au generate API (qui attend `outdoorSubtype` pour appliquer les overrides de sous-type).
- **Impact** : Les sous-types outdoor (terrasse, balcon, jardin, cour, etc.) sont ignorés dans les dossiers Pro — les photos outdoor sont générées sans contexte de sous-type.
- **Fix proposé** : Ajouter colonne `outdoor_subtype VARCHAR(50)` à `dossier_photos`, la passer dans le POST handler, et l'envoyer au generate API dans `generateSinglePhoto`.

#### BUG-4 : Bien auto-créé depuis dossier incomplet (pas d'enrichissement)
- **Fichier** : `app/api/dossier/route.ts` lignes 89-98, `lib/properties.ts` lignes 188-220
- **Cause racine** : `findOrCreatePropertyByAddress` crée un bien avec uniquement : `address_raw`, `property_type`, `surface_m2`, `sale_price`, `room_count`. Mais il ne stocke PAS :
  - `address_normalized` (absent)
  - `latitude` / `longitude` (pourtant disponibles dans le body du POST dossier — enrichedLat/enrichedLon)
  - `city` / `postal_code` (pourtant disponibles — enrichedCity/enrichedPostcode)
  - `dvf_median_price_m2` (pourtant disponible — enrichedPrixM2)
  - `description_generated` (pourtant disponible — enrichedDescription)
  - `map_image_key` (pourtant disponible — enrichedCarteKey)
- **Impact** : Le bien auto-créé apparaît dans "Mes biens" mais sans carte, sans description, sans géolocalisation. L'utilisateur a l'impression que le bien est "vide" ou "cassé" comparé à un bien créé manuellement depuis "Mes biens" (qui bénéficie de l'enrichissement via l'autocomplétion d'adresse).
- **Fix proposé** : Passer toutes les données d'enrichissement à `findOrCreatePropertyByAddress` (latitude, longitude, city, postal_code, dvf_median_price_m2, description, map_image_key) et les stocker en DB.

#### BUG-5 : Dossier depuis "Mes biens" — pas de choix de style
- **Fichier** : `app/api/properties/[id]/dossier/route.ts`, `app/mes-biens/[id]/page.tsx` lignes 404-434
- **Cause racine** : Quand un dossier est créé depuis la fiche d'un bien (/mes-biens/[id]), le POST `/api/properties/[id]/dossier` :
  1. Ne demande PAS de style global → le dossier est créé avec `global_style_id = null`
  2. Les photos sont ajoutées avec `styleId: photo.style_id` (le style de la user_photo, qui peut être null pour les photos uploadées sans génération)
  3. Dans `generateSinglePhoto` ligne 348 : `effectiveStyleId = photo.style_id || dossier.global_style_id || "scandinavian"` → tombe en fallback "scandinavian" pour TOUTES les photos sans style
  4. Le dossier marque toutes les photos comme "completed" immédiatement (ligne 145-149) car les `user_photos` ont déjà un `output_image_key` — les photos NE SONT PAS re-générées avec un nouveau style
- **Impact** : Le dossier depuis "Mes biens" est un simple assemblage PDF des photos déjà générées, sans possibilité de choisir un style cohérent. C'est un dossier "tel quel", pas un dossier de pré-commercialisation avec un style unifié.
- **Fix proposé** : Ajouter un sélecteur de style dans la modale de création de dossier dans la fiche bien. Si l'utilisateur choisit un style différent de l'original → re-générer les photos.

#### BUG-7 : Pas d'itération/refine sur les photos de dossier
- **Fichier** : N/A (fonctionnalité absente)
- **Cause racine** : Le système d'itération (iterate/adjust/restyle via `pass1_key` + `iterationComment`) n'existe que dans le flow principal (`app/api/generate/route.ts` + `page.tsx`). Il n'y a aucun lien entre les photos de dossier et le système d'itération :
  - `dossier_photos` n'a pas de champ `pass1_key` exploitable côté client
  - Pas de bouton "Modifier" sur les photos de dossier dans DossierResult
  - Le PATCH "regenerate" re-génère depuis zéro, pas depuis la passe 1
- **Impact** : L'utilisateur Pro ne peut pas affiner ses visuels — il peut seulement "régénérer" (relancer la génération complète). Comparé au mode gratuit où l'itération est disponible, c'est un recul fonctionnel.
- **Fix proposé** : Phase 2 (après redesign @product-manager) — ajouter l'itération sur les photos de dossier. Stocker `pass1_key` dans `dossier_photos`, exposer un endpoint d'itération, ajouter l'UI dans le résultat du dossier.

### P2 — Mineurs

#### BUG-6 : Lien dossier ↔ bien fragile (jointure sur adresse texte)
- **Fichier** : `lib/properties.ts` lignes 242, 265-266
- **Cause racine** : La jointure entre `properties` et `dossiers` est faite via `LOWER(TRIM(d.bien_adresse)) = LOWER(TRIM(p.address_raw))`. Cette jointure textuelle est fragile :
  - Si l'adresse est légèrement différente (virgule, espace, abréviation), le lien casse
  - Pas de clé étrangère → pas de contrainte d'intégrité
  - Pas d'index sur `LOWER(TRIM(dossiers.bien_adresse))`  → performance dégradée sur gros volumes
- **Impact** : Certains dossiers pourraient ne pas apparaître sur la fiche du bien, et inversement.
- **Fix proposé** : Ajouter une colonne `property_id UUID` dans `dossiers` avec FK vers `properties.id`. Remplir à la création du dossier (quand `findOrCreatePropertyByAddress` retourne le property). Backfill les dossiers existants.

#### BUG-8 : Multi-styles globaux — seul le premier est utilisé
- **Fichier** : `components/MerchantMode.tsx` lignes 298, 339
- **Cause racine** : `globalStyles` est un `string[]` permettant potentiellement de sélectionner plusieurs styles. Mais `globalStyleId: globalStyles[0]` (ligne 298) n'envoie que le premier. Et `styleId: ... || globalStyles[0]` (ligne 339) utilise aussi seulement le premier.
- **Impact** : Si l'UI permet de sélectionner plusieurs styles globaux (pas vérifié visuellement), seul le premier est appliqué.
- **Fix proposé** : Clarifier l'intention — si multi-style, distribuer les styles sur les photos (round-robin ou au choix). Sinon, limiter `globalStyles` à un seul élément.

---

## Synthèse des bugs par fichier

| Fichier | Bugs | Sévérité max |
|---|---|---|
| `components/MerchantMode.tsx` | BUG-2 (styleId outdoor), BUG-1 (validation custom vide), BUG-8 (multi-styles) | P0 |
| `app/api/dossier/[uuid]/route.ts` | BUG-2 (POST ignore outdoorStyleId), BUG-3 (POST ignore outdoorSubtype), BUG-1 (custom vide), BUG-7 (pas d'itération) | P0 |
| `lib/dossier.ts` | BUG-3 (pas de colonne outdoor_subtype) | P1 |
| `app/api/dossier/route.ts` | BUG-4 (auto-création bien incomplet) | P1 |
| `lib/properties.ts` | BUG-4 (findOrCreatePropertyByAddress incomplet), BUG-6 (jointure textuelle) | P1 |
| `app/api/properties/[id]/dossier/route.ts` | BUG-5 (pas de choix de style) | P1 |
| `app/mes-biens/[id]/page.tsx` | BUG-5 (UI dossier sans style) | P1 |

---

## Recommandations pour le redesign (@product-manager)

1. **Unifier le modèle de données** : ajouter `property_id` FK dans `dossiers` au lieu de la jointure textuelle
2. **Stocker les métadonnées outdoor** : colonnes `outdoor_style_id` et `outdoor_subtype` dans `dossier_photos`
3. **Enrichir le bien auto-créé** : transmettre toutes les données d'enrichissement
4. **Ajouter le choix de style dans le flow "Mes biens" → Dossier**
5. **Itérations sur photos de dossier** : le Pro devrait avoir AU MOINS les mêmes capacités que le gratuit
6. **Validation custom prompt** : bloquer si style = custom et prompt vide

---

---

## Statut des corrections (2026-03-31)

| Bug | Sévérité | Statut | Notes |
|---|---|---|---|
| BUG-1 | P1 | CORRIGE (commit a114929) | Validation custom prompt vide ajoutée |
| BUG-2 | P0 | CORRIGE | outdoorStyleId lu, stocké en DB, utilisé dans generateSinglePhoto |
| BUG-3 | P1 | CORRIGE | Colonnes outdoor_style_id + outdoor_subtype ajoutées à dossier_photos |
| BUG-4 | P1 | CORRIGE | updateProperty appelé après findOrCreatePropertyByAddress avec geo data |
| BUG-5 | P1 | CORRIGE | Sélecteur de style ajouté dans la modale dossier depuis Mes biens + auto-génération |
| BUG-6 | P2 | REPORTE Pro v2 | Jointure textuelle — nécessite refonte schema DB avec FK property_id |
| BUG-7 | P1 | REPORTE Pro v2 | Itération sur photos dossier — feature gap, fait partie du redesign |
| BUG-8 | P2 | CORRIGE | globalStyles limité à un seul élément (sélection remplace au lieu d'ajouter) |

---

**Handoff → @product-manager**
- Fichier produit : `docs/reviews/pro-mode-audit.md`
- 2 bugs P0, 5 bugs P1, 2 bugs P2 identifiés — **6 corrigés, 2 reportés**
- BUG-6 (FK property_id) et BUG-7 (itération photos dossier) sont reportés au redesign Pro v2
- Les bugs P0 (outdoor dans dossier) sont corrigés
