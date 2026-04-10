# Audit QA -- Parcours Marchand Versimo (Session 41)

**Date** : 2026-04-10
**Auditeur** : @qa
**Scope** : 12 API routes + 7 pages frontend + 6 modules backend
**Verdict** : **FAIL -- 3 bugs bloquants (P0), 5 bugs majeurs (P1), 4 points de vigilance (P2)**

---

## Bugs trouves

| # | Severite | Fichier | Ligne | Description | Impact |
|---|----------|---------|-------|-------------|--------|
| B1 | **P0** | `app/projet/[id]/qualification/page.tsx` | 244 | Le frontend envoie `method: "PUT"` mais la route qualify exporte uniquement `PATCH`. Le serveur retournera 405 Method Not Allowed. **Le parcours est casse a l'etape 4.** | Blocage complet de la qualification |
| B2 | **P0** | `app/projet/[id]/dossier/page.tsx` | 259-262 | `handleGeneratePdf()` appelle `POST /dossier/pdf` SANS body JSON (ni `lot_ids`). Le schema Zod exige `lot_ids: z.array(uuid).min(1)` -- le serveur retournera 400 VALIDATION_ERROR a chaque appel. **Le PDF ne peut jamais etre genere.** | Aucun PDF generable |
| B3 | **P0** | `app/projet/[id]/dossier/page.tsx` | 272 | Le frontend attend `data.pdf_url` dans la reponse. Mais la route `/dossier/pdf` retourne un JSON structure `{ project, lots, generated_at }` -- il n'y a PAS de champ `pdf_url`. Ce n'est pas un vrai PDF, c'est un JSON summary (V1). `pdfUrl` sera toujours `null`. | Bouton "Telecharger PDF" invisible/inoperant |
| B4 | **P1** | `app/api/pro/projects/[id]/status/route.ts` | 42-45 | La query SQL ne selectionne PAS `surface_m2` ni `photo_path`. Or la page validation (etape 3) attend `surface_m2` depuis cette route, et la page dossier (etape 7) attend `photo_path`. Resultat : `surface_m2` sera toujours `undefined` (pas d'erreur JS mais champ vide), `photo_path` sera toujours `null` (pas de photo "avant" dans le dossier). | Donnees manquantes sur 3 pages |
| B5 | **P1** | `app/api/pro/projects/[id]/qualify/route.ts` | 42+ | La route `PATCH /qualify` n'a AUCUNE verification de statut projet. Un projet en `plan_uploaded` ou `generating` pourrait etre qualifie. La machine a etats n'est pas respectee. | Corruption de l'etat projet |
| B6 | **P1** | `app/api/pro/projects/[id]/generate/route.ts` | 151,163 | `JOIN pro_lots l ON r.lot_id = l.id` est un INNER JOIN. Les rooms sans `lot_id` (qui est NULL en DB) sont silencieusement exclues. Or les rooms inserees par `validate` (nouvelles pieces manuelles) n'ont PAS de `lot_id` assigne -- elles seront ignorees a la generation. | Pieces manuelles jamais generees |
| B7 | **P1** | `app/projet/[id]/validation/page.tsx` | 79 | La page charge les photos via `visual_output_path` au lieu de `photo_path`. `visual_output_path` est le resultat de generation (etape 6), pas la photo source (etape 3). En etape 3, ce champ est forcement null. Les photos uploadees par l'utilisateur ne s'affichent pas. | Photos uploadees invisibles en etape 3 |
| B8 | **P1** | `app/api/pro/projects/[id]/validate/route.ts` | 179-185 | La validation REFUSE les rooms avec `room_type === "autre"`. Or l'extraction (etape 2) insere TOUTES les rooms avec `room_type = 'autre'` par defaut (L145 de extract/route.ts). Si l'utilisateur ne corrige pas chaque type, la validation echoue avec un message cryptique listant des UUIDs. | UX degradee -- message d'erreur incomprehensible |

---

## Flux de donnees E2E (etape par etape)

### Etape 1 : Creation projet (page nouveau + POST /projects)
**Status** : OK (avec reserves)

- Le formulaire envoie correctement un FormData avec adresse, type_bien, surface_totale, plan_file
- La route cree le projet, upload le plan dans Object Storage, auto-cree un lot pour les non-immeubles
- La deduplication fonctionne (meme user + meme adresse + < 5s)
- **Reserve** : le paiement n'est PAS implemente (TODO L131-136 de generate/route.ts). Le `PRICE_PER_BIEN = "99EUR"` est affiche mais jamais collecte.

### Etape 2 : Extraction IA (page extraction + POST /extract)
**Status** : OK

- L'extraction appelle GPT-4.1 vision, parse le resultat avec Zod, insere les rooms en DB
- Le rate limit (3 extractions/projet) fonctionne
- Le fallback `extraction_failed` fonctionne (L103-116)
- Les rooms sont inserees avec `room_type = 'autre'` par defaut -- c'est correct, corrige en etape 3
- La redirection 409 pour les projets deja extraits est bien geree

### Etape 3 : Validation (page validation + PUT /validate + POST /rooms/:id/photo)
**Status** : Partiellement KO (B4, B7, B8)

- Le flux 3 phases (upload photos existantes -> validate -> upload photos nouvelles) est bien concu
- Le `room_id_mapping` est correctement retourne pour les nouvelles pieces (RETURNING id)
- **B7** : la page affiche `visual_output_path` au lieu de `photo_path` -- les photos uploadees sont invisibles
- **B4** : `surface_m2` n'est pas retourne par la route status, le champ sera vide au chargement
- **B8** : le room_type "autre" est rejete par la validation -- les pieces non corrigees bloquent

### Etape 4 : Qualification (page qualification + PATCH /qualify)
**Status** : **KO BLOQUANT (B1, B5)**

- **B1** : la page envoie PUT mais la route n'accepte que PATCH -- 405 garanti
- **B5** : aucune verification de statut -- un projet en n'importe quel etat peut etre qualifie
- La page cree un lot virtuel "default" si aucun lot -- mais ce lot aura l'id "default" qui n'est pas un UUID, et le schema Zod de qualify exige des UUIDs

### Etape 5 : Recommandations (page recommandations + POST /recommend + PATCH /recommendations/:recId)
**Status** : OK (avec reserves)

- Le chargement des lots, l'appel agent IA, l'insertion en DB avec versioning fonctionnent
- L'acceptation/refus est fire-and-forget (OK pour l'UX, risque de perte si erreur silencieuse)
- **Reserve** : pas de verification que la room a un `lot_id` -- la query L112 de recommend utilise `WHERE lot_id = $1` ce qui est correct
- **Reserve** : les recommandations ne sont pas consommees en aval (la generation n'utilise pas les recommandations acceptees pour adapter les prompts)

### Etape 6 : Generation visuels (page generation + POST /generate + GET /status polling)
**Status** : Partiellement KO (B6)

- Le pipeline 2 passes (surfaces puis mobilier) est correctement implemente
- Le pool de concurrence (max 2 simultanes) fonctionne
- Le deadline check (150s) est bien la
- Le polling toutes les 3s fonctionne avec detection de completion
- **B6** : l'INNER JOIN exclut les rooms sans lot_id -- les pieces manuelles ne sont JAMAIS generees
- **Reserve** : le prompt utilise `styleId + " style"` directement au lieu du surfacePrompt/furniturePrompt du StylePicker -- la qualite sera significativement inferieure aux prompts de l'outil B2C

### Etape 7 : Dossier (page dossier + POST /dossier/pdf + POST/PUT description)
**Status** : **KO BLOQUANT (B2, B3)**

- **B2** : handleGeneratePdf() n'envoie pas de lot_ids -- le serveur retourne 400
- **B3** : la route retourne un JSON, pas un PDF ni une URL -- il n'y a aucune generation PDF implementee
- La generation de description IA fonctionne (POST /lots/:lotId/description)
- L'edition manuelle fonctionne (PUT /lots/:lotId/description)
- Le partage (WhatsApp, email, copie lien) fonctionne mais le lien `/dossier/${projectId}` pointe vers une route qui n'existe probablement pas (pas de page publique)

---

## Machine a etats -- analyse de conformite

```
plan_uploaded -> extraction_done -> validated -> qualified -> plan_final -> generating -> visuals_done -> delivered
```

| Route | Statut verifie | Statuts acceptes | Conforme |
|-------|----------------|-----------------|----------|
| POST /extract | Oui | plan_uploaded, extraction_failed | OK |
| PUT /validate | Oui | extraction_done | OK |
| PATCH /qualify | **NON** | (aucune verification) | **KO (B5)** |
| POST /recommend | Oui | validated, qualified, plan_final | OK |
| POST /generate | Oui | validated, qualified, plan_final | OK |
| POST /dossier/pdf | **NON** | (aucune verification) | KO (mineur) |

**Note** : la transition `qualified -> plan_final` n'est jamais declenchee. `plan_final` semble etre un etat intermediaire jamais atteint dans le parcours actuel.

---

## Auth et ownership

Toutes les routes sont protegees par `requireProjectOwnership()` qui :
1. Verifie la session NextAuth (401 si absent)
2. Verifie que le projet existe (404 si absent)
3. Verifie que l'utilisateur est proprietaire (403 si non)

**Verdict** : OK sur toutes les routes. La protection IDOR est correcte.

La route POST /projects utilise `getServerSession(authOptions)` au lieu de `requireAuth()` -- legere inconsistance mais fonctionnellement correct.

---

## Gestion d'erreurs

| Route | try/catch | Message explicite | Rate limit | Verdict |
|-------|-----------|-------------------|------------|---------|
| POST /projects | Oui | Oui | 10/h/user | OK |
| POST /extract | Oui | Oui | 3/projet | OK |
| PUT /validate | Oui | Oui | Non | OK (lecture seule) |
| PATCH /qualify | Oui | Oui | Non | OK |
| POST /recommend | Oui | Oui | 5/projet/h | OK |
| POST /generate | Oui | Oui | 1 concurrent/projet | OK |
| GET /status | Oui | Oui | Non | OK (lecture seule) |
| PATCH /recommendations/:recId | Oui | Oui | Non | OK |
| POST /rooms/:roomId/photo | Oui | Oui | Non | Attention (pas de rate limit sur upload) |
| POST/PUT /lots/:lotId/description | Oui | Oui | 10/lot/h | OK |
| POST /dossier/pdf | Oui | Oui | Non | OK |

---

## Points de vigilance (P2)

| # | Fichier | Description |
|---|---------|-------------|
| V1 | `generate/route.ts` L252-253 | Les prompts de generation sont construits inline (`"style surfaces"`, `"style furniture for room_type"`) au lieu d'utiliser les stylePrompts enrichis de StylePicker.tsx. La qualite des visuels sera bien inferieure a l'outil B2C. |
| V2 | `dossier/page.tsx` L284 | Le lien de partage utilise `/dossier/${projectId}` mais cette route publique n'existe pas dans le codebase. Le partage produit un 404 pour les acquereurs. |
| V3 | `generate/route.ts` L256 | `getOutputSize(1536, 1024)` est hardcode en landscape. Le ratio de l'image source n'est pas respecte -- les visuels seront deformes si la photo est en portrait. |
| V4 | `dossier/page.tsx` L195 | `handleGeneratePdf()` est appele dans un `useEffect` (auto-trigger au chargement). Meme si le bug B2 etait corrige, cela declencherait un appel API automatique a chaque visite -- comportement probablement non souhaite. |

---

## Couverture tests existants

### Tests unitaires marchand (6 fichiers, ~40 tests)
- `schemas.test.ts` : validation Zod des schemas -- OK
- `auth-helpers.test.ts` : requireAuth, isErrorResponse, requireProjectOwnership, checkRateLimit -- OK
- `plan-extractor.test.ts` : extractPlanData cas nominal, null, retry, erreurs -- OK
- `architect-agent.test.ts` : generateRecommendations -- OK
- `description-generator.test.ts` : generateCommercialDescription -- OK
- `db.test.ts` : CRUD project, lot, room, recommendation -- OK

### Tests E2E marchand (3 fichiers)
- `merchant-api.spec.ts` : tests des routes API
- `merchant-biens.spec.ts` : parcours "mes biens"
- `merchant-compte.spec.ts` : parcours compte

### Couverture des bugs trouves

| Bug | Couvert par un test ? | Raison |
|-----|----------------------|--------|
| B1 (PUT vs PATCH) | **Non** | Aucun test E2E du parcours etape 4 |
| B2 (PDF sans lot_ids) | **Non** | Aucun test E2E du parcours etape 7 |
| B3 (pdf_url absent) | **Non** | Aucun test E2E du parcours etape 7 |
| B4 (surface_m2 manquant) | **Non** | Aucun test d'integration status -> validation |
| B5 (qualify sans status check) | **Non** | Aucun test de la machine a etats |
| B6 (rooms sans lot exclues) | **Non** | Aucun test d'integration validate -> generate |
| B7 (visual_output vs photo_path) | **Non** | Aucun test E2E etape 3 |
| B8 (room_type "autre" rejete) | **Non** | Aucun test d'integration extract -> validate |

**Verdict** : les tests unitaires couvrent bien les modules isoles mais **aucun test ne couvre le flux E2E entre les etapes**. Les 8 bugs trouves sont tous des bugs d'INTEGRATION entre composants -- exactement le type de bug que les tests unitaires ne detectent pas.

---

## Recommandations

### Corrections P0 (a faire immediatement)

1. **B1** : `app/projet/[id]/qualification/page.tsx` L244 -- changer `method: "PUT"` en `method: "PATCH"`
2. **B2** : `app/projet/[id]/dossier/page.tsx` `handleGeneratePdf()` -- ajouter le body `{ lot_ids: lotDossiers.map(l => l.id) }`
3. **B3** : Soit implementer la generation PDF reelle dans la route, soit adapter le frontend pour afficher le JSON structure comme un dossier (ce qui est deja fait dans la page). Supprimer le bouton "Telecharger PDF" tant que le PDF n'est pas implemente.

### Corrections P1

4. **B4** : Ajouter `r.surface_m2, r.photo_path` dans la query SELECT de `status/route.ts`
5. **B5** : Ajouter une verification de statut dans `qualify/route.ts` -- accepter uniquement `validated` et `extraction_done`
6. **B6** : Changer `JOIN pro_lots` en `LEFT JOIN pro_lots` dans `generate/route.ts`, ou s'assurer que toutes les rooms ont un lot_id assigne (via validate ou un lot par defaut)
7. **B7** : Dans `validation/page.tsx` L79, utiliser `r.photo_path` au lieu de `r.visual_output_path` (qui necessite le fix B4)
8. **B8** : Soit retirer la validation qui rejette `room_type === "autre"`, soit la transformer en avertissement non-bloquant

### Tests d'integration a ajouter

9. Un test qui enchaine extract -> validate -> qualify -> generate et verifie que les donnees circulent
10. Un test qui ajoute une piece manuelle en etape 3 et verifie qu'elle est generee en etape 6
11. Un test de la machine a etats qui verifie que chaque route refuse les statuts invalides

---

**Handoff -> @fullstack**
- Fichiers a corriger :
  - `/home/user/Architecture/app/projet/[id]/qualification/page.tsx` (B1)
  - `/home/user/Architecture/app/projet/[id]/dossier/page.tsx` (B2, B3)
  - `/home/user/Architecture/app/api/pro/projects/[id]/status/route.ts` (B4)
  - `/home/user/Architecture/app/api/pro/projects/[id]/qualify/route.ts` (B5)
  - `/home/user/Architecture/app/api/pro/projects/[id]/generate/route.ts` (B6)
  - `/home/user/Architecture/app/projet/[id]/validation/page.tsx` (B7)
  - `/home/user/Architecture/app/api/pro/projects/[id]/validate/route.ts` (B8)
- Decisions prises : audit de flux E2E, pas seulement du code
- Points d'attention : le parcours est casse en production a 2 endroits (etape 4 et etape 7). Corriger B1 et B2 en priorite absolue.
