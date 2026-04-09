# Architecture technique — Pipeline marchand Versimo

> **Version** : 1.0 | **Date** : 2026-04-09 | **Agent** : @ia
> **Persona** : Thomas Berger, 35 ans, marchand de biens, Bordeaux, 8-12 ops/an
> **Stack** : Next.js 14, OpenAI GPT-4.1 (vision + text) + gpt-image-1.5, PostgreSQL, Replit Object Storage
> **Refs** : `docs/marchand-pivot/ia/plan-analysis-research.md`, `docs/marchand-pivot/product/functional-specs.md`, `lib/generation-pipeline.ts`
> **PROMPT_VERSION pipeline existant** : v61

---

## 1. Nouveaux modules a creer

Tous les modules IA du pipeline marchand vont dans `src/lib/ai/`. Le code @fullstack les importe depuis les API routes et les pages.

### 1.1 `src/lib/ai/plan-extractor.ts` — Extraction JSON depuis plan

| Champ | Valeur |
|---|---|
| **Responsabilite** | Envoie le plan (image base64) a GPT-4.1 vision via `openai.responses.create`, avec un system prompt d'extraction structure. Retourne un JSON valide parsable par le schema Zod `PlanExtractionResult` |
| **Input** | `{ planBase64: string, mimeType: string, typeBien: TypeBien }` |
| **Output** | `PlanExtractionResult` (schema Zod — voir section 2) |
| **Modele IA** | GPT-4.1 vision (`openai.responses.create` avec image input) |
| **Structured output** | Oui — `response_format: { type: "json_schema", json_schema: { ... } }` enforce le schema directement cote API. Fallback : parsing JSON + validation Zod + 1 retry self-correction si echec |
| **Timeout** | 30s (plan complexe multi-pieces) |
| **Retry** | 1 retry automatique apres 5s si erreur API. Si echec double → retourner `{ status: "extraction_failed", reason: "API_ERROR" }` |

**Fonction exportee** :
```typescript
export async function extractPlanData(
  planBase64: string,
  mimeType: string,
  typeBien: TypeBien
): Promise<PlanExtractionResult>
```

**Logique interne** :
1. Construire le prompt systeme (voir section 4.1)
2. Appeler `openai.responses.create` avec l'image en input vision + le schema JSON en response_format
3. Parser la reponse JSON
4. Valider contre le schema Zod `PlanExtractionResult`
5. Si validation echoue : renvoyer l'erreur Zod au modele dans un second appel (self-correction)
6. Retourner le resultat valide ou lever une erreur typee

### 1.2 `src/lib/ai/architect-agent.ts` — Recommandations reagencement

| Champ | Valeur |
|---|---|
| **Responsabilite** | Analyse le JSON valide des pieces + qualification du lot (cible acheteur, style, budget, contraintes) et produit des recommandations de reagencement argumentees |
| **Input** | `{ rooms: ValidatedRoom[], lot: LotQualification }` |
| **Output** | `ArchitectRecommendationSet` (schema Zod — voir section 2) |
| **Modele IA** | GPT-4.1 text (`openai.responses.create` sans image — JSON pur suffisant) |
| **Structured output** | Oui — response_format json_schema |
| **Timeout** | 15s |
| **Retry** | 1 retry. Si echec → retourner `null` (le parcours continue sans recommandations, conformement a US-PM-15) |

**Fonction exportee** :
```typescript
export async function generateRecommendations(
  rooms: ValidatedRoom[],
  lot: LotQualification
): Promise<ArchitectRecommendationSet | null>
```

**Logique interne** :
1. Construire le contexte JSON (rooms + lot + budget + contraintes)
2. Injecter le system prompt architecte (voir section 4.2)
3. Appeler GPT-4.1 text avec response_format json_schema
4. Valider contre le schema Zod
5. Filtrer les recommandations par budget si budget renseigne (exclure celles dont estimated_cost > budget)
6. Retourner le set ou null si echec

### 1.3 `src/lib/ai/lot-splitter.ts` — Decoupe immeuble en lots

| Champ | Valeur |
|---|---|
| **Responsabilite** | Pour les immeubles, analyse le JSON d'extraction et propose un regroupement des pieces par lot (par etage, par zone). Purement heuristique + IA si l'heuristique echoue |
| **Input** | `{ rooms: ExtractedRoom[], typeBien: TypeBien, floorsCount: number }` |
| **Output** | `LotSuggestion[]` — chaque lot contient un tableau de room_ids |
| **Modele IA** | GPT-4.1-mini text (tache simple de regroupement, pas besoin du modele complet) |
| **Timeout** | 10s |
| **Fallback** | Si type_bien != "immeuble" → retourner un lot unique contenant toutes les pieces (zero appel IA) |

**Fonction exportee** :
```typescript
export async function suggestLots(
  rooms: ExtractedRoom[],
  typeBien: TypeBien,
  floorsCount: number
): Promise<LotSuggestion[]>
```

**Logique interne** :
1. Si type_bien != "immeuble" → lot unique, pas d'appel IA
2. Heuristique simple : regrouper par etage (champ `floor`). Si chaque etage a >= 1 piece humide (sdb/cuisine) → c'est un lot
3. Si l'heuristique echoue (pas d'info etage, ou etages incomplets) → appel GPT-4.1-mini avec le JSON des pieces pour suggerer le groupement
4. Retourner les suggestions pour validation utilisateur (jamais automatique)

### 1.4 `src/lib/ai/plan-enriched-prompt.ts` — Enrichissement prompt par dimensions

| Champ | Valeur |
|---|---|
| **Responsabilite** | Transforme les donnees validees d'une piece (dimensions, ouvertures, shape) en un bloc de texte injectable dans les prompts de generation existants (passe 1 et passe 2) |
| **Input** | `{ room: ValidatedRoom, recommendations: AcceptedRecommendation[] }` |
| **Output** | `{ dimensionBlock: string }` — texte a injecter dans le prompt |
| **Modele IA** | Aucun — logique pure TypeScript, zero appel API |
| **Latence** | < 1ms |

**Fonction exportee** :
```typescript
export function buildDimensionBlock(
  room: ValidatedRoom,
  recommendations?: AcceptedRecommendation[]
): string
```

**Exemple de sortie** :
```
Room dimensions: 5.0m wide x 3.7m deep (approximately 18.5 m²). Ceiling height: 2.50m. Rectangular room, wider than deep (ratio 1.35:1). Two windows on the left wall. One door on the right wall. Door handle reference at 1.0m height.
Accepted modifications: kitchen wall removed — open plan with living room (combined ~28 m²).
```

**Regles** :
- Si `is_estimated: true` → prefixer "approximately" devant chaque dimension
- Si `dimensions: null` → retourner une string vide (pas de fausse dimension)
- Si `surface_m2 < 5` → ajouter "Small room — scale furniture down"
- Si recommandation acceptee de type "cloison" → decrire la modification dans le bloc
- Ne jamais inventer de dimensions absentes du JSON valide

### 1.5 `src/lib/ai/description-generator.ts` — Description commerciale

| Champ | Valeur |
|---|---|
| **Responsabilite** | Genere un paragraphe commercial (80-120 mots, francais) pour un lot, destine au dossier PDF et aux annonces |
| **Input** | `{ lot: LotWithRooms, project: ProjectInfo }` |
| **Output** | `{ description: string }` |
| **Modele IA** | GPT-4.1-mini (tache redactionnelle simple, pas besoin du modele complet) |
| **Structured output** | Non — texte libre, pas de JSON |
| **Timeout** | 10s |
| **Fallback** | Texte template : "Bel appartement [type] de [surface] m² idealement situe au [adresse]. A decouvrir." |

**Fonction exportee** :
```typescript
export async function generateCommercialDescription(
  lot: LotWithRooms,
  project: ProjectInfo
): Promise<string>
```

**Logique interne** :
1. Construire le system prompt (voir section 4.3)
2. Injecter : adresse, type bien, surface, cible acheteur, style, liste des pieces avec surfaces
3. Appeler GPT-4.1-mini
4. Retourner le texte brut
5. Si erreur → retourner le texte template de fallback (pas de blocage du PDF)

---

## 2. Schemas Zod

Tous les schemas vivent dans `src/lib/ai/schemas/marchand-schemas.ts`. Ils sont importes par les modules IA ET par les API routes pour validation double (cote IA + cote route).

### 2.1 `PlanExtractionResult` — Sortie de l'extraction plan

```typescript
import { z } from "zod";

export const ExtractedRoomSchema = z.object({
  temp_id: z.string().describe("Identifiant temporaire unique (r1, r2, ...)"),
  name_raw: z.string().min(1).describe("Nom de la piece en francais tel que lu sur le plan"),
  surface_m2: z.number().positive().nullable().describe("Surface estimee en m2, null si non deductible"),
  dimensions: z.object({
    length_m: z.number().positive().describe("Longueur en metres"),
    width_m: z.number().positive().describe("Largeur en metres"),
  }).nullable().describe("Dimensions L x l, null si pas de cotes lisibles"),
  ceiling_height_m: z.number().positive().nullable().describe("Hauteur sous plafond, null si non indiquee"),
  windows_count: z.number().int().min(0).describe("Nombre de fenetres detectees"),
  doors_count: z.number().int().min(0).describe("Nombre de portes detectees"),
  floor: z.number().int().min(0).nullable().describe("Etage (0 = RDC), null si indetermine"),
  confidence: z.number().min(0).max(1).describe("Score de confiance IA 0-1 sur cette piece"),
  shape: z.enum(["rectangular", "square", "L-shaped", "narrow_corridor", "irregular"]).nullable()
    .describe("Forme approximative de la piece"),
  notes: z.string().nullable().describe("Notes IA (ex: mur porteur detecte, piece humide)"),
});

export const PlanExtractionResultSchema = z.object({
  rooms: z.array(ExtractedRoomSchema).min(1).describe("Liste des pieces detectees"),
  total_surface_m2: z.number().positive().nullable().describe("Surface totale estimee"),
  floors_count: z.number().int().min(1).describe("Nombre de niveaux detectes"),
  extraction_warnings: z.array(
    z.enum(["no_dimensions_found", "low_resolution", "partial_occlusion", "no_scale_reference", "technical_symbols_ignored"])
  ).describe("Avertissements d'extraction"),
  scale_reference: z.enum(["dimensions_on_plan", "door_standard_83cm", "scale_bar", "none"])
    .describe("Reference d'echelle utilisee par le modele"),
});

export type ExtractedRoom = z.infer<typeof ExtractedRoomSchema>;
export type PlanExtractionResult = z.infer<typeof PlanExtractionResultSchema>;
```

### 2.2 `ArchitectRecommendation` — Recommandations reagencement

```typescript
export const RecommendationSchema = z.object({
  id: z.string().describe("Identifiant unique (rec_1, rec_2, ...)"),
  title: z.string().min(5).max(100).describe("Titre court de la recommandation"),
  description: z.string().min(20).max(500).describe("Description argumentee 2-3 phrases"),
  action_type: z.enum(["redistribution", "cloison", "affectation", "deco", "sol", "luminaire"])
    .describe("Type d'action recommandee"),
  estimated_cost_eur: z.number().min(0).nullable()
    .describe("Cout estime en euros, null si non estimable"),
  impact_level: z.enum(["basse", "moyenne", "haute"])
    .describe("Impact sur la valeur percue du bien"),
  affected_rooms: z.array(z.string()).min(1)
    .describe("IDs des pieces concernees (temp_id ou room_id)"),
  rationale_buyer: z.string().max(200)
    .describe("Pourquoi cette modification parle a la cible acheteur"),
});

export const ArchitectRecommendationSetSchema = z.object({
  recommendations: z.array(RecommendationSchema).min(1).max(8)
    .describe("Liste de 1 a 8 recommandations, ordonnees par impact decroissant"),
  summary: z.string().max(300)
    .describe("Resume global de la strategie de valorisation du lot"),
});

export type ArchitectRecommendation = z.infer<typeof RecommendationSchema>;
export type ArchitectRecommendationSet = z.infer<typeof ArchitectRecommendationSetSchema>;
```

### 2.3 `LotDefinition` — Definition d'un lot

```typescript
export const LotDefinitionSchema = z.object({
  temp_id: z.string().describe("Identifiant temporaire du lot"),
  name: z.string().min(1).max(100).describe("Nom du lot (ex: T3 RDC gauche)"),
  room_ids: z.array(z.string()).min(1).describe("IDs des pieces dans ce lot"),
  surface_m2: z.number().positive().nullable().describe("Surface totale du lot"),
  floor: z.number().int().min(0).nullable().describe("Etage principal du lot"),
});

export const LotSuggestionSetSchema = z.object({
  lots: z.array(LotDefinitionSchema).min(1),
  grouping_strategy: z.enum(["by_floor", "by_zone", "manual_suggestion"])
    .describe("Strategie de groupement utilisee"),
});

export type LotDefinition = z.infer<typeof LotDefinitionSchema>;
export type LotSuggestionSet = z.infer<typeof LotSuggestionSetSchema>;
```

### 2.4 Types complementaires (non-IA, pour les API routes)

```typescript
// Enums partages entre schemas et API routes
export const TypeBienEnum = z.enum([
  "immeuble", "appartement", "maison", "bureaux", "local_commercial"
]);
export type TypeBien = z.infer<typeof TypeBienEnum>;

export const RoomTypeEnum = z.enum([
  "salon", "cuisine", "chambre", "sdb", "wc", "bureau", "couloir", "cave", "autre"
]);
export type RoomType = z.infer<typeof RoomTypeEnum>;

export const TargetBuyerEnum = z.enum([
  "famille", "couple_sans_enfant", "etudiant",
  "investisseur_locatif", "senior", "professionnel_liberal"
]);
export type TargetBuyer = z.infer<typeof TargetBuyerEnum>;

export const ProjectStatusEnum = z.enum([
  "plan_uploaded", "extraction_done", "validated", "qualified",
  "plan_final", "generating", "visuals_done", "delivered", "extraction_failed"
]);
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;

// Room validee (post-correction utilisateur)
export const ValidatedRoomSchema = ExtractedRoomSchema.extend({
  id: z.string().uuid().describe("UUID DB"),
  room_type: RoomTypeEnum,
  lot_id: z.string().uuid().nullable(),
  is_estimated: z.boolean(),
  photo_path: z.string().nullable().describe("Cle Object Storage de la photo source"),
});
export type ValidatedRoom = z.infer<typeof ValidatedRoomSchema>;

// Qualification lot
export const LotQualificationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  target_buyer: TargetBuyerEnum,
  style_id: z.string(),
  budget_travaux: z.number().nullable(),
  contraintes: z.string().nullable(),
  notes_commerciales: z.string().nullable(),
  rooms: z.array(ValidatedRoomSchema),
});
export type LotQualification = z.infer<typeof LotQualificationSchema>;
```

---

## 3. API Routes

Toutes les routes marchands sont sous `/api/pro/`. Elles sont distinctes des routes grand public (`/api/generate`, `/api/replay`, etc.) pour isoler le parcours marchand.

### 3.1 `POST /api/pro/projects` — Creation projet + upload plan

| Champ | Valeur |
|---|---|
| **Fichier** | `app/api/pro/projects/route.ts` |
| **Auth** | Session cookie NextAuth obligatoire |
| **Rate limit** | 10 projets/heure par user |
| **Request** | `multipart/form-data` : `{ adresse: string, type_bien: TypeBien, surface_totale?: number, plan_file: File }` |
| **Validation** | Zod sur les champs texte. Fichier : PDF/JPG/PNG/HEIC/WEBP, max 20 Mo. Si PDF > 10 pages : seule page 1 retenue |
| **Logique** | 1. Valider inputs. 2. Convertir HEIC → JPEG si necessaire. 3. Stocker le plan dans Object Storage (`pro/{project_id}/plan.{ext}`). 4. INSERT dans `projects` (status = "plan_uploaded"). 5. Si bien = immeuble, creer 0 lot (attente decoupe etape 3). Si bien != immeuble, creer 1 lot automatique |
| **Response 201** | `{ project_id: string, status: "plan_uploaded" }` |
| **Response 4xx** | `{ error: "PLAN_REQUIRED" \| "FILE_TOO_LARGE" \| "INVALID_TYPE" \| "UNAUTHENTICATED" }` |
| **Idempotence** | Dedoublonnage sur (user_id, adresse, created_at < 5s) |

### 3.2 `POST /api/pro/projects/:id/extract` — Extraction IA plan

| Champ | Valeur |
|---|---|
| **Fichier** | `app/api/pro/projects/[id]/extract/route.ts` |
| **Auth** | Session cookie + verification ownership (project.user_id === session.user.id) |
| **Rate limit** | 3 extractions/projet (anti-boucle couteuse) |
| **Request** | `{}` (le plan est deja en Object Storage) |
| **Logique** | 1. Lire le plan depuis Object Storage. 2. Convertir en base64 (si PDF → render page 1 en image via `pdf-lib` ou `sharp`). 3. Appeler `extractPlanData()` (section 1.1). 4. Si succes : INSERT rooms dans DB, mettre status = "extraction_done". 5. Si type_bien = "immeuble" et floorsCount > 1 : appeler `suggestLots()` (section 1.3) et stocker les suggestions. 6. Si echec : status = "extraction_failed" |
| **Response 200** | `{ status: "extraction_done", rooms_count: number, rooms: ExtractedRoom[], lot_suggestions?: LotDefinition[] }` |
| **Response 422** | `{ status: "extraction_failed", reason: "PLAN_UNREADABLE" \| "NO_ROOMS_DETECTED" \| "API_ERROR" }` |
| **Note** | L'appel GPT-4.1 vision coute ~$0.04 par plan. Le rate limit a 3/projet empeche un usage abusif (cout max par projet : $0.12) |

### 3.3 `PATCH /api/pro/projects/:id/rooms/:room_id` — Correction piece

| Champ | Valeur |
|---|---|
| **Fichier** | `app/api/pro/projects/[id]/rooms/[room_id]/route.ts` |
| **Auth** | Session cookie + ownership |
| **Rate limit** | 100 PATCH/min par user (auto-save debounce 500ms cote client) |
| **Request** | `{ room_name?: string, surface_m2?: number, room_type?: RoomType, floor?: number, lot_id?: string }` |
| **Logique** | 1. Valider champs via Zod partial. 2. UPDATE room. 3. Si lot_id change → verifier que le lot appartient au meme projet |
| **Response 200** | `{ room_id: string, updated_at: string }` |
| **Response 422** | `{ error: "VALIDATION_ERROR", fields: string[] }` |

### 3.4 `PUT /api/pro/projects/:id/validate` — Validation plan

| Champ | Valeur |
|---|---|
| **Fichier** | `app/api/pro/projects/[id]/validate/route.ts` |
| **Auth** | Session cookie + ownership |
| **Request** | `{}` |
| **Logique** | 1. Verifier que toutes les pieces ont un nom et un room_type. 2. Si immeuble : verifier que chaque piece est assignee a un lot. 3. Si tout OK : status = "validated" |
| **Response 200** | `{ status: "validated", rooms_count: number, lots_count: number }` |
| **Response 422** | `{ error: "INCOMPLETE_DATA", missing: string[] }` |

### 3.5 `POST /api/pro/projects/:id/lots/:lot_id/recommendations` — Recommandations architecte

| Champ | Valeur |
|---|---|
| **Fichier** | `app/api/pro/projects/[id]/lots/[lot_id]/recommendations/route.ts` |
| **Auth** | Session cookie + ownership |
| **Rate limit** | 5 generations/lot |
| **Request** | `{}` (donnees en DB) |
| **Logique** | 1. Charger rooms du lot + qualification. 2. Appeler `generateRecommendations()` (section 1.2). 3. Si succes : INSERT recommendations en DB, archiver les anciennes (is_active = false). 4. Si echec : retourner erreur sans bloquer le parcours |
| **Response 200** | `{ recommendations: ArchitectRecommendation[], generated_at: string }` |
| **Response 422** | `{ error: "API_ERROR" \| "PARSING_FAILED" }` |

### 3.6 `POST /api/pro/projects/:id/generate` — Generation visuels batch

| Champ | Valeur |
|---|---|
| **Fichier** | `app/api/pro/projects/[id]/generate/route.ts` |
| **Auth** | Session cookie + ownership + verification credits/paiement |
| **Rate limit** | 1 job/projet en parallele |
| **Request** | `{ lot_ids?: string[] }` (null = tous les lots) |
| **Logique** | 1. Verifier credits ou paiement Stripe. 2. Debiter credits. 3. Pour chaque piece des lots selectionnes : determiner si photo source ou prompt-only. 4. Enqueue les generations (max 2 concurrentes). 5. Retourner immediatement le job_id (HTTP 202). 6. Les generations s'executent en background via la queue existante (`/api/cron/process-queue`) ou inline via `Promise.allSettled` avec pool de 2 |
| **Response 202** | `{ job_id: string, estimated_rooms: number, credits_debited: number }` |
| **Response 402** | `{ error: "INSUFFICIENT_CREDITS" \| "PAYMENT_REQUIRED" }` |
| **Response 409** | `{ error: "ALREADY_GENERATING" }` |
| **Integration pipeline** | Chaque piece passe par `generateSingle()` de `lib/generation-pipeline.ts` avec le prompt enrichi par `buildDimensionBlock()` (section 1.4). Voir section 6 pour les details d'integration |

### 3.7 `GET /api/pro/projects/:id/lots/:lot_id/pdf` — Dossier PDF

| Champ | Valeur |
|---|---|
| **Fichier** | `app/api/pro/projects/[id]/lots/[lot_id]/pdf/route.ts` |
| **Auth** | Session cookie + ownership. OU token de partage valide (voir share_links) |
| **Rate limit** | 10 PDF/heure par user |
| **Request** | `{}` ou `?token=UUID` (acces tokenise) |
| **Logique** | 1. Charger toutes les donnees du lot (rooms, visuels, description). 2. Si description absente → appeler `generateCommercialDescription()` (section 1.5). 3. Generer le PDF server-side (lib recommandee : `@react-pdf/renderer` ou `pdfkit`). 4. Streamer le PDF en reponse |
| **Response 200** | PDF binaire (`Content-Type: application/pdf`) |
| **Response 409** | `{ error: "VISUALS_NOT_READY" }` |
| **Response 403** | `{ error: "TOKEN_EXPIRED" \| "UNAUTHORIZED" }` |
| **Pas de cache** | Le PDF est regenere a chaque demande pour garantir la fraicheur (cf US-PM-23) |

### 3.8 `POST /api/pro/projects/:id/lots/:lot_id/share-link` — Lien de partage

| Champ | Valeur |
|---|---|
| **Fichier** | `app/api/pro/projects/[id]/lots/[lot_id]/share-link/route.ts` |
| **Auth** | Session cookie + ownership |
| **Request** | `{ expires_in_days?: number }` (defaut : 30) |
| **Logique** | 1. Verifier si un share_link actif existe deja pour ce lot. Si oui, retourner le meme. 2. Sinon, generer un token UUID v4, INSERT dans `share_links`. 3. Retourner l'URL publique |
| **Response 200** | `{ share_url: string, expires_at: string }` |

### 3.9 `GET /api/pro/projects/:id/status` — Polling progression generation

| Champ | Valeur |
|---|---|
| **Fichier** | `app/api/pro/projects/[id]/status/route.ts` |
| **Auth** | Session cookie + ownership |
| **Logique** | SELECT rooms.generation_status GROUP BY lot_id. Retourne le statut de chaque piece. Le client poll toutes les 3s |
| **Response 200** | `{ rooms: Array<{ id: string, lot_id: string, name: string, generation_status: string, visual_output_path?: string }> }` |

---

## 4. Prompts systeme

Les prompts sont stockes dans `src/lib/ai/prompts/marchand-prompts.ts` comme constantes exportees. Ils seront verses dans `docs/ia/prompt-library.md` a la prochaine revision du prompt library global.

### 4.1 System prompt extraction plan (GPT-4.1 vision)

```typescript
export const PLAN_EXTRACTION_SYSTEM_PROMPT = `You are an expert architectural floor plan analyzer. Your job is to extract structured data from a floor plan image (photograph, scan, or CAD export).

TASK: Analyze this floor plan and return a JSON object listing every room with its properties.

EXTRACTION RULES:
1. ROOM IDENTIFICATION: Identify every enclosed space. Include living rooms, bedrooms, kitchens, bathrooms, toilets, offices, hallways, storage, cellars. Exclude outdoor spaces (balconies, terraces) unless they are enclosed.
2. DIMENSIONS: Read all dimension annotations (cotes) on the plan. If dimensions are printed in centimeters, convert to meters. If no dimensions are readable, set dimensions to null and add "no_dimensions_found" to warnings.
3. SURFACE ESTIMATION: If dimensions are available, calculate surface = length × width. If dimensions are null, estimate surface from the relative proportions of rooms using the door as scale reference (standard French door = 83cm wide).
4. SCALE REFERENCE: Report which scale reference you used: "dimensions_on_plan" if cotes are readable, "door_standard_83cm" if you estimated from door width, "scale_bar" if a graphical scale is present, "none" if no reference was available.
5. WINDOWS & DOORS: Count windows (typically thin parallel lines on exterior walls) and doors (arcs or gaps in walls) for each room.
6. FLOOR DETECTION: If the plan shows multiple floors or levels, set the floor number for each room (0 = ground floor). If single level, all rooms are floor 0.
7. CONFIDENCE: Rate your confidence 0-1 for each room. Lower confidence for: rooms partially occluded, dimensions estimated (not read), ambiguous room function.
8. IGNORE: Electrical symbols, plumbing symbols, dimension arrows (just read the numbers), furniture drawn on plan, north arrow, title block.

TYPE DE BIEN CONTEXT: This plan is for a "${typeBien}". If "immeuble", there may be multiple units — identify them if possible.

OUTPUT: Return valid JSON matching the provided schema. French room names. No commentary outside the JSON.`;
```

**Test cases** (a executer avant integration) :

| # | Input | Output attendu | Critere |
|---|---|---|---|
| TC-01 | Plan PDF cote A3, appartement 3 pieces | 3-4 rooms avec dimensions, confidence > 0.7, scale_reference = "dimensions_on_plan" | Dimensions a ±15% des valeurs reelles |
| TC-02 | Photo iPhone d'un plan affiche au mur, basse resolution | Rooms detectees mais dimensions = null, warning "low_resolution", confidence < 0.6 | Pas de fausses dimensions inventees |
| TC-03 | Plan sans cotes, porte visible | Rooms avec surfaces estimees, scale_reference = "door_standard_83cm", is_estimated = true | Surfaces raisonnables (pas 2m2 pour un salon) |

### 4.2 System prompt architecte (GPT-4.1 text)

```typescript
export const ARCHITECT_RECOMMENDATION_SYSTEM_PROMPT = `Tu es un architecte d'intérieur expert en valorisation immobilière pour marchands de biens. Tu as 20 ans d'expérience dans l'optimisation de biens avant revente.

CONTEXTE: Un marchand de biens t'envoie les données d'un lot (pièces, dimensions, cible acheteur, style choisi, budget travaux, contraintes). Tu dois produire des recommandations de réagencement qui MAXIMISENT la valeur perçue par la cible acheteur.

RÈGLES:
1. Chaque recommandation doit être ACTIONNABLE et CHIFFRABLE (coût estimé en euros).
2. RESPECTER LE BUDGET: si budget_travaux est renseigné, ne jamais proposer d'action dont le coût dépasse le budget restant. Si budget < 5000€, limiter aux actions décoratives (peinture, sol, luminaires).
3. RESPECTER LES CONTRAINTES: si "PMR" est mentionné, inclure au moins 1 recommandation accessibilité. Si "pas de mur porteur" est mentionné, ne jamais proposer de démolition.
4. ADAPTER À LA CIBLE: 
   - famille → espace ouvert cuisine/séjour, chambre enfant, rangements
   - couple_sans_enfant → espace de vie lumineux, suite parentale, dressing
   - etudiant → optimisation m², bureau intégré, kitchenette fonctionnelle
   - investisseur_locatif → rendement locatif, séparation zones, cuisine équipée
   - senior → accessibilité, douche italienne, lumière naturelle, pas de marches
   - professionnel_liberal → bureau séparé, accueil client, isolation phonique
5. MAXIMUM 8 recommandations par lot, ordonnées par impact décroissant.
6. Ne jamais recommander des travaux structurels lourds (fondations, toiture) — hors scope marchand de biens.
7. Le champ "rationale_buyer" explique POURQUOI cette modification parle à la cible — c'est l'argument de vente.

STYLE CHOISI: ${style_id}. Les recommandations doivent être cohérentes avec ce style (ne pas recommander du béton ciré si le style est Haussmannien).

OUTPUT: JSON structuré selon le schema fourni. Pas de texte hors JSON.`;
```

**Test cases** :

| # | Input | Output attendu | Critere |
|---|---|---|---|
| TC-04 | Lot T3 65m2, cible famille, style Scandinave, budget 30000€ | 3-5 recos : ouvrir cuisine/sejour (~3500€), sol stratifie (~4000€), luminaires (~1500€) | Somme couts < 30000€, rationale_buyer mentionne "famille" |
| TC-05 | Lot T1 25m2, cible etudiant, budget 5000€ | 2-3 recos : peinture claire (~800€), luminaire (~300€), optimisation rangement (~1500€) | Aucune reco structurelle (budget < 5000€) |
| TC-06 | Lot T4, cible senior, contrainte PMR | Au moins 1 reco accessibilite (douche italienne, seuils, largeur couloir) | action_type "deco" ou "sol" pour PMR |

### 4.3 System prompt description commerciale (GPT-4.1-mini)

```typescript
export const COMMERCIAL_DESCRIPTION_SYSTEM_PROMPT = `Tu es un rédacteur immobilier professionnel. Tu rédiges des descriptions d'annonces pour des marchands de biens.

RÈGLES:
1. 80-120 mots maximum, en français.
2. Ton professionnel et engageant, pas d'exagération ("exceptionnel", "unique") — factuel et valorisant.
3. Commencer par le type de bien et la localisation.
4. Mentionner les atouts clés : surface, nombre de pièces, exposition si connue, style de décoration.
5. Adapter le vocabulaire à la cible acheteur :
   - famille → "espace de vie généreux", "chambres spacieuses", "quartier familial"
   - investisseur → "potentiel locatif", "secteur recherché", "rentabilité"
   - senior → "plain-pied", "lumineux", "calme"
6. NE JAMAIS mentionner Versimo, l'IA, ou le fait que les visuels sont virtuels.
7. NE JAMAIS inventer des informations non fournies (exposition, parking, cave).
8. Terminer par une phrase d'appel à action subtile.

OUTPUT: Texte brut en français, sans guillemets englobants, sans markdown.`;
```

**Test cases** :

| # | Input | Output attendu | Critere |
|---|---|---|---|
| TC-07 | T3 65m2, Bordeaux, famille, Haussmannien | Description 80-120 mots, mentionne Bordeaux, 65m2, famille, haussmannien | Pas de mention IA/Versimo, ton pro |
| TC-08 | T1 25m2, Nantes, etudiant, Contemporain | Description courte, mentionne potentiel etudiant, quartier | Vocabulaire adapte etudiant |

---

## 5. Modele de donnees enrichi

Le schema est defini dans `docs/marchand-pivot/product/functional-specs.md` section 9. Ci-dessous, la version enrichie avec les types exacts, les index de performance, et les colonnes ajoutees pour le pipeline IA.

### 5.1 Tables SQL

```sql
-- ============================================================
-- Table: projects
-- 1 projet = 1 bien immobilier de Thomas
-- ============================================================
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  adresse         TEXT NOT NULL CHECK (char_length(adresse) BETWEEN 5 AND 200),
  type_bien       TEXT NOT NULL CHECK (type_bien IN ('immeuble','appartement','maison','bureaux','local_commercial')),
  surface_totale  DECIMAL(8,2) CHECK (surface_totale > 0 AND surface_totale <= 10000),
  plan_file_path  TEXT,                          -- cle Object Storage du plan original
  plan_mime_type  TEXT,                          -- 'image/jpeg', 'application/pdf', etc.
  status          TEXT NOT NULL DEFAULT 'plan_uploaded'
                  CHECK (status IN ('plan_uploaded','extraction_done','validated','qualified',
                                    'plan_final','generating','visuals_done','delivered','extraction_failed')),
  extraction_data JSONB,                         -- PlanExtractionResult brut (archive debug)
  stripe_payment_id TEXT,                        -- ID Stripe si paiement one-shot
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
-- Index idempotence creation
CREATE INDEX idx_projects_dedup ON projects(user_id, adresse, created_at);

-- ============================================================
-- Table: lots
-- 1 lot = 1 unite (appartement dans un immeuble, ou le bien entier)
-- ============================================================
CREATE TABLE lots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  floor                 INTEGER DEFAULT 0 CHECK (floor >= 0 AND floor <= 20),
  target_buyer          TEXT CHECK (target_buyer IN ('famille','couple_sans_enfant','etudiant',
                                                     'investisseur_locatif','senior','professionnel_liberal')),
  style_id              TEXT,                    -- ref aux 12 styles Versimo (StylePicker)
  custom_style_text     TEXT,                    -- si style custom, texte libre
  budget_travaux        DECIMAL(10,2) CHECK (budget_travaux >= 0),
  contraintes           TEXT CHECK (char_length(contraintes) <= 500),
  notes_commerciales    TEXT CHECK (char_length(notes_commerciales) <= 1000),
  commercial_description TEXT,                   -- description IA ou manuelle
  description_is_manual BOOLEAN NOT NULL DEFAULT FALSE,
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','qualified','plan_final','generating','visuals_done','pdf_ready')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lots_project_id ON lots(project_id);

-- ============================================================
-- Table: rooms
-- 1 room = 1 piece extraite ou saisie manuellement
-- ============================================================
CREATE TABLE rooms (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id              UUID REFERENCES lots(id) ON DELETE CASCADE,
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  room_type           TEXT NOT NULL DEFAULT 'autre'
                      CHECK (room_type IN ('salon','cuisine','chambre','sdb','wc','bureau','couloir','cave','autre')),
  surface_m2          DECIMAL(6,2) CHECK (surface_m2 > 0 AND surface_m2 < 1000),
  length_m            DECIMAL(5,2) CHECK (length_m > 0),
  width_m             DECIMAL(5,2) CHECK (width_m > 0),
  ceiling_height_m    DECIMAL(4,2) CHECK (ceiling_height_m > 0),
  windows_count       INTEGER NOT NULL DEFAULT 0 CHECK (windows_count >= 0),
  doors_count         INTEGER NOT NULL DEFAULT 1 CHECK (doors_count >= 0),
  floor               INTEGER DEFAULT 0,
  shape               TEXT CHECK (shape IN ('rectangular','square','L-shaped','narrow_corridor','irregular')),
  is_estimated        BOOLEAN NOT NULL DEFAULT FALSE,
  confidence          DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  photo_path          TEXT,                      -- cle Object Storage photo source
  visual_pass1_path   TEXT,                      -- cle Object Storage resultat passe 1
  visual_output_path  TEXT,                      -- cle Object Storage resultat final meuble
  generation_status   TEXT NOT NULL DEFAULT 'pending'
                      CHECK (generation_status IN ('pending','generating_pass1','generating_pass2','done','failed')),
  generation_error    TEXT,                      -- message d'erreur si failed
  source              TEXT NOT NULL DEFAULT 'ai_extraction'
                      CHECK (source IN ('ai_extraction','manual')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rooms_lot_id ON rooms(lot_id);
CREATE INDEX idx_rooms_project_id ON rooms(project_id);
CREATE INDEX idx_rooms_generation_status ON rooms(generation_status);

-- ============================================================
-- Table: recommendations
-- Recommandations architecte IA par lot
-- ============================================================
CREATE TABLE recommendations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id              UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  action_type         TEXT NOT NULL CHECK (action_type IN ('redistribution','cloison','affectation','deco','sol','luminaire')),
  estimated_cost_eur  DECIMAL(8,2),
  impact_level        TEXT NOT NULL CHECK (impact_level IN ('basse','moyenne','haute')),
  affected_rooms      TEXT[] NOT NULL,           -- array de room UUIDs
  rationale_buyer     TEXT,
  is_accepted         BOOLEAN,                   -- null = pas encore decide
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  version             INTEGER NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recommendations_lot_id ON recommendations(lot_id);
CREATE INDEX idx_recommendations_active ON recommendations(lot_id, is_active);

-- ============================================================
-- Table: share_links
-- Liens de partage tokenises pour les acquereurs
-- ============================================================
CREATE TABLE share_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id            UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  token             TEXT UNIQUE NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at  TIMESTAMPTZ
);

CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_lot_id ON share_links(lot_id);

-- ============================================================
-- Extension table generation_logs existante
-- ============================================================
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS lot_id UUID REFERENCES lots(id);
ALTER TABLE generation_logs ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_project ON generation_logs(project_id);
```

### 5.2 Schema Object Storage (cles)

```
pro/{project_id}/plan.{jpg|pdf|png}                     -- Plan original uploade
pro/{project_id}/{lot_id}/{room_id}/source.jpg           -- Photo source de la piece
pro/{project_id}/{lot_id}/{room_id}/pass1.jpg            -- Resultat passe 1 (surfaces)
pro/{project_id}/{lot_id}/{room_id}/output.jpg           -- Resultat final meuble
```

### 5.3 Relations

```
users (1) → (N) projects
projects (1) → (N) lots
lots (1) → (N) rooms
lots (1) → (N) recommendations
lots (1) → (N) share_links
rooms (1) → (N) generation_logs (via room_id, extension table existante)
```

---

## 6. Integration avec le pipeline existant

### 6.1 Principe : zero reecriture du pipeline

Le pipeline de generation existant (`lib/generation-pipeline.ts`, PROMPT_VERSION v61) est **inchange**. Le parcours marchand s'y branche par injection de contexte supplementaire dans les prompts, pas par modification du pipeline lui-meme.

```
                     ┌─────────────────────────────────┐
                     │  Parcours grand public existant  │
                     │  (page.tsx → /api/generate)      │
                     │                                   │
                     │  surfacePrompt + furniturePrompt   │
                     │  + photo base64 + styleId          │
                     │         │                          │
                     └─────────┤──────────────────────────┘
                               │
                               ▼
            ┌──────────────────────────────────┐
            │   lib/generation-pipeline.ts     │
            │                                  │
            │   generateSingle()               │
            │     → extractRoomInventory()     │
            │     → buildSurfacesPrompt()      │
            │     → tryOpenAIResponses() P1    │
            │     → buildFurniturePrompt()     │
            │     → tryOpenAIResponses() P2    │
            │     → cropImageFromCanvas()      │
            │                                  │
            └──────────────────────────────────┘
                               ▲
                               │
                     ┌─────────┤──────────────────────────┐
                     │  Parcours marchand (NOUVEAU)       │
                     │  (/api/pro/projects/:id/generate)  │
                     │                                     │
                     │  surfacePrompt + furniturePrompt     │
                     │  + photo base64 (ou null)            │
                     │  + styleId                           │
                     │  + dimensionBlock (INJECTION PLAN)   │
                     │         │                            │
                     └─────────┘                            │
                                                            │
```

### 6.2 Point d'injection : `plan-enriched-prompt.ts`

Le module `plan-enriched-prompt.ts` (section 1.4) produit un `dimensionBlock` (string de 1-3 phrases). Ce bloc est **concatene** au debut du `surfacePrompt` et du `furniturePrompt` avant l'appel a `generateSingle()`.

```typescript
// Dans /api/pro/projects/:id/generate/route.ts
import { buildDimensionBlock } from "@/lib/ai/plan-enriched-prompt";
import { generateSingle } from "@/lib/generation-pipeline";

// Pour chaque piece du lot :
const dimensionBlock = buildDimensionBlock(room, acceptedRecommendations);

// Enrichir les prompts AVANT de les passer au pipeline
const enrichedSurfacePrompt = dimensionBlock
  ? `${dimensionBlock}\n${surfacePrompt}`
  : surfacePrompt;
const enrichedFurniturePrompt = dimensionBlock
  ? `${dimensionBlock}\n${furniturePrompt}`
  : furniturePrompt;

// Appeler le pipeline existant — AUCUNE modification de generateSingle
const result = await generateSingle({
  imageBase64: room.photo_path ? await loadPhotoBase64(room.photo_path) : null,
  surfacePrompt: enrichedSurfacePrompt,
  furniturePrompt: enrichedFurniturePrompt,
  styleId: lot.style_id,
  roomType: room.room_type,
  width: room.photo_path ? photoWidth : null,
  height: room.photo_path ? photoHeight : null,
});
```

### 6.3 Cas "sans photo" (prompt-only)

Quand Thomas n'a pas de photo source pour une piece, le pipeline recoit `imageBase64: null`. Le pipeline existant doit gerer ce cas :

**Modification MINIMALE de `lib/generation-pipeline.ts`** :

Dans `generateSingle()`, ajouter un branchement :
- Si `imageBase64` est fourni → pipeline 2 passes standard (passe 1 surfaces, passe 2 mobilier)
- Si `imageBase64` est null → generation single-pass en mode "text-to-image" via `openai.responses.create` avec le tool `image_generation` SANS image input, prompt combine (surfaces + mobilier + dimensions)

```typescript
// Ajout dans generateSingle() — branchement prompt-only
if (!imageBase64) {
  // Mode prompt-only : une seule passe, pas de photo source
  const combinedPrompt = `Generate a realistic interior photo of a ${roomType} room. ${enrichedSurfacePrompt}. ${enrichedFurniturePrompt}. ${DSLR_LINE}`;
  const result = await tryOpenAIResponses(combinedPrompt, null, outputSize, "high");
  return result;
}
// Sinon : pipeline 2 passes standard
```

**Impact** : ~10 lignes ajoutees dans `generateSingle()`. Aucune modification des builders de prompt existants.

**Qualite attendue** : les visuels prompt-only seront de qualite inferieure aux visuels avec photo (pas de geometrie reelle a preserver). Le badge "Genere depuis le plan" dans l'UI previent Thomas (cf US-PM-20).

### 6.4 Gestion de la concurrence

Le pipeline existant utilise `MAX_CONCURRENT = 2` (2 generations simultanees). Le parcours marchand reutilise cette meme contrainte :

```typescript
// Pool de concurrence pour un projet marchand
const MAX_CONCURRENT_ROOMS = 2;

async function generateAllRooms(rooms: ValidatedRoom[], lot: LotQualification) {
  const results: GenerationResult[] = [];
  const pool: Promise<void>[] = [];

  for (const room of rooms) {
    if (pool.length >= MAX_CONCURRENT_ROOMS) {
      await Promise.race(pool);
    }

    const job = (async () => {
      // Mettre a jour generation_status = "generating_pass1"
      await updateRoomStatus(room.id, "generating_pass1");

      const result = await generateSingle({ /* ... */ });

      // Sauvegarder le resultat dans Object Storage + DB
      await saveRoomVisual(room.id, result);
      await updateRoomStatus(room.id, "done");

      results.push(result);
    })().catch(async (err) => {
      await updateRoomStatus(room.id, "failed", err.message);
    });

    pool.push(job);
  }

  await Promise.allSettled(pool);
  return results;
}
```

### 6.5 Modifications exactes de `lib/generation-pipeline.ts`

| Modification | Lignes estimees | Risque regression |
|---|---|---|
| Ajout branchement `imageBase64 === null` dans `generateSingle()` | ~15 lignes | Faible — le path existant n'est pas modifie, c'est un branchement `if/else` |
| Export de `generateSingle` si pas deja exporte | 1 ligne | Zero |
| Aucune autre modification | — | — |

Les constantes de prompt (`PASS1_PREAMBLE_V53`, `PRESERVATION_V53`, `CLEANUP_V53`, etc.) restent intactes. Les builders (`buildSurfacesResponsesPrompt`, `buildFurnitureResponsesPrompt`) restent intacts. Le `dimensionBlock` est injecte en AMONT, dans la route API marchand, pas dans le pipeline.

---

## 7. Couts et rate limiting

### 7.1 Tarifs API (verifies via WebSearch — 2026-04-09)

| Modele | Usage | Tarif input | Tarif output | Source |
|---|---|---|---|---|
| GPT-4.1 vision | Extraction plan | $2.00/MTok | $8.00/MTok | [OpenAI Pricing](https://openai.com/api/pricing/) |
| GPT-4.1 text | Recommandations | $2.00/MTok | $8.00/MTok | [OpenAI Pricing](https://openai.com/api/pricing/) |
| GPT-4.1-mini | Lot splitting, description, pre-processing | $0.40/MTok | $1.60/MTok | [OpenAI Pricing](https://openai.com/api/pricing/) |
| gpt-image-1.5 (1536x1024, high) | Generation visuels | $0.20/image | — | [AI Free API](https://www.aifreeapi.com/en/posts/gpt-image-1-5-pricing) |
| gpt-image-1.5 (1024x1024, high) | Generation visuels | $0.133/image | — | [AI Free API](https://www.aifreeapi.com/en/posts/gpt-image-1-5-pricing) |

### 7.2 Cout par etape — Cas type : immeuble 6 lots, 4 pieces/lot = 24 pieces

| Etape | Appels | Modele | Tokens estimes (in/out) | Cout unitaire | Sous-total |
|---|---|---|---|---|---|
| Extraction plan (1 par lot ou 1 global) | 1-6 appels | GPT-4.1 vision | ~2000 in + 800 out par appel | ~$0.010 | $0.01–$0.06 |
| Suggestion lots | 1 appel | GPT-4.1-mini | ~1000 in + 500 out | ~$0.001 | $0.001 |
| Recommandations (1 par lot) | 6 appels | GPT-4.1 text | ~1500 in + 1000 out | ~$0.011 | $0.07 |
| Description commerciale (1 par lot) | 6 appels | GPT-4.1-mini | ~800 in + 300 out | ~$0.001 | $0.006 |
| Pre-processing custom prompts | 0-6 appels | GPT-4.1-mini | ~500 in + 300 out | ~$0.001 | $0–$0.006 |
| Generation visuels passe 1 (surfaces) | 24 appels | gpt-image-1.5 (landscape high) | — | $0.20 | $4.80 |
| Generation visuels passe 2 (mobilier) | 24 appels | gpt-image-1.5 (landscape high) | — | $0.20 | $4.80 |
| Vision pre-pass (room inventory) | 24 appels | GPT-4.1-mini | ~1000 in + 200 out | ~$0.001 | $0.024 |
| **TOTAL par bien (24 pieces)** | **~92 appels** | | | | **~$9.76** |

### 7.3 Cout par piece (unitaire)

| Configuration | Cout |
|---|---|
| 1 piece AVEC photo (pipeline 2 passes) | ~$0.41 ($0.20 P1 + $0.20 P2 + $0.01 vision/overhead) |
| 1 piece SANS photo (prompt-only, 1 passe) | ~$0.21 ($0.20 generation + $0.01 overhead) |
| Extraction + recommandation + description (par lot, 4 pieces) | ~$0.02 |

### 7.4 ROI par bien

```
ROI = (Temps humain economise × cout horaire) / Cout API mensuel

Hypotheses :
- Home stager humain : 250€/planche × 24 pieces = 6 000€ (estimation basse : 3 planches/lot × 6 lots)
- Temps economise : ~72h de delai → ~15 min
- Cout API Versimo : ~9.76€ (~$9.76 au taux 1:1 simplifie)

ROI = 6 000€ / 9.76€ = 614

ROI >> 3 : feature IA massivement justifiee.
```

**Note** : le cout par bien est monte de ~$2.71 (estimation initiale dans `plan-analysis-research.md`) a ~$9.76. La raison : les tarifs gpt-image-1.5 en resolution haute (landscape, $0.20/image) sont plus eleves que l'estimation initiale basee sur les tarifs gpt-image-1 ($0.04-0.08). Le ROI reste extremement favorable (614x). Le prix de vente de 99€/bien couvre le cout API avec une marge de ~89€/bien.

### 7.5 Marge par bien pour Versimo

| Metrique | Valeur |
|---|---|
| Prix de vente | 99€ TTC |
| TVA 20% | -16.50€ |
| Cout API (24 pieces, estimation haute) | -9.76€ |
| Cout infra (Replit, DB, Object Storage) | ~-0.50€ (amortissement) |
| **Marge nette par bien** | **~72.24€** |
| **Marge nette %** | **~73%** |

Pour un abonne Pro (50 credits/mois a 29€) generant un bien de 6 pieces (6 credits) :
- Cout API : ~$2.46 (6 pieces × $0.41)
- Revenu attribue : 29€ × (6/50) = 3.48€
- Marge par bien (abonne) : 3.48€ - 2.46€ = ~1.02€

**Observation** : le modele abonnement est viable uniquement si la majorite des abonnes ne consomment PAS tous leurs 50 credits. A pleine consommation, la marge par credit est tres serree. Le paiement a la mission (99€/bien) est nettement plus rentable. Recommandation : surveiller le taux de consommation des credits Pro et ajuster si necessaire.

### 7.6 Rate limiting par etape

| Endpoint | Rate limit | Justification |
|---|---|---|
| POST /api/pro/projects | 10 projets/h par user | Anti-spam creation |
| POST /extract | 3 extractions/projet | Cout GPT-4.1 vision ($0.01-0.04 par appel). 3 tentatives = cout max $0.12 |
| PATCH /rooms/:id | 100/min par user | Auto-save debounce 500ms cote client |
| POST /recommendations | 5 generations/lot | Cout GPT-4.1 text (~$0.01 par appel). 5 tentatives = $0.05 max |
| POST /generate | 1 job/projet en parallele | Eviter surcharge API OpenAI + cout image eleve |
| GET /pdf | 10/h par user | CPU server PDF generation |
| POST /share-link | 20/lot/jour | Anti-abuse generation de liens |
| GET /status (polling) | Implicite 3s interval cote client | Pas de rate limit serveur — requete legere (SELECT) |

### 7.7 Alertes de cout

Le monitoring existant (`generation_logs` PostgreSQL) est etendu pour le parcours marchand. Alertes recommandees :

| Alerte | Seuil | Action |
|---|---|---|
| Cout API journalier global | > 50€/jour | Notification fondateur + revue des generations du jour |
| Cout API par projet | > 20€ | Verifier si abus (regenerations en boucle) |
| Taux d'echec extraction | > 30% des projets | Auditer les plans echoues, ameliorer le prompt d'extraction |
| Taux d'echec generation passe 2 | > 10% des pieces | Auditer les prompts, verifier rate limits OpenAI |
| Latence P95 generation complete (24 pieces) | > 15 minutes | Verifier concurrence, envisager augmentation MAX_CONCURRENT |

---

---

**Handoff → @fullstack**

- **Fichiers produits** : `docs/marchand-pivot/ia/technical-architecture.md`

- **Decisions prises** :
  1. **GPT-4.1 vision** pour extraction plan (deja dans la stack, zero integration nouvelle, structured output enforce le schema)
  2. **GPT-4.1 text** pour recommandations architecte (pas vision — le JSON structure suffit, cout moindre)
  3. **GPT-4.1-mini** pour lot splitting, descriptions commerciales, pre-processing custom (taches simples, cout negligeable)
  4. **gpt-image-1.5** pour visuels (pipeline existant inchange, modele unique, pas de fallback — decision fondateur)
  5. **Zero reecriture du pipeline** : `lib/generation-pipeline.ts` conserve tel quel. Le `dimensionBlock` est injecte en amont dans la route API marchand, pas dans les builders
  6. **Seule modification du pipeline** : ajout d'un branchement `imageBase64 === null` dans `generateSingle()` (~15 lignes) pour le mode prompt-only sans photo
  7. **Cout par bien (24 pieces)** : ~$9.76 → marge nette 73% sur le prix de vente 99€. ROI 614x vs home stager humain

- **Points d'attention** :
  1. **Schemas Zod** dans `src/lib/ai/schemas/marchand-schemas.ts` — a creer EN PREMIER car importes par tous les modules
  2. **Modules IA** dans `src/lib/ai/` — 5 fichiers : `plan-extractor.ts`, `architect-agent.ts`, `lot-splitter.ts`, `plan-enriched-prompt.ts`, `description-generator.ts`
  3. **Prompts** dans `src/lib/ai/prompts/marchand-prompts.ts` — 3 system prompts avec test cases documentes
  4. **Tables SQL** : 5 tables nouvelles (`projects`, `lots`, `rooms`, `recommendations`, `share_links`) + ALTER TABLE sur `generation_logs`. Creer les tables avec `CREATE TABLE IF NOT EXISTS` comme le pattern existant dans `lib/db.ts`
  5. **Object Storage** : cles sous `pro/{project_id}/...` — schema documente en section 5.2
  6. **Rate limits** : extractions limitees a 3/projet (anti-boucle couteuse), generation 1 job/projet
  7. **Concurrence** : max 2 pieces generees en parallele (meme contrainte que pipeline existant)
  8. **PDF** : regenere a chaque demande, pas de cache. Lib recommandee : `@react-pdf/renderer` ou `pdfkit`
  9. **Marge abonne Pro** serree a pleine consommation (1.02€/bien de 6 pieces). Surveiller le taux de consommation des credits
  10. **Secrets** : aucun nouveau secret. Le `OPENAI_API_KEY` existant couvre tous les modeles GPT-4.1 + gpt-image-1.5
