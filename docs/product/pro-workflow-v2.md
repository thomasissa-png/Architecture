# Mode Pro — Workflow v2 (Thomas flow)

> Décision fondateur 2026-03-31. Le dossier se crée APRES la génération, pas avant.
> Le flow Pro = flow gratuit + annotation pièce/style par photo + rattachement à un bien en fin de parcours.

---

## 1. User flow étape par étape

### Étape 1 — Upload (identique au flow gratuit)
- Thomas uploade 1 à 15 photos depuis la homepage
- Auto-transition vers l'annotation dès qu'au moins 1 photo est chargée

### Étape 2 — Annotation par photo
Pour chaque photo, Thomas choisit :
- **Type de pièce** : salon, chambre, cuisine, salle de bain, bureau, etc.
- **Style** : parmi les 12 styles, ou Custom (textarea FR)
- **Intérieur / Extérieur** : toggle par photo

Pas d'infos de bien à cette étape. Thomas est dans son flow de travail.

### Étape 3 — Génération
- Bouton "Générer les visuels" — identique au flow gratuit
- Pipeline 2 passes pour chaque photo (parallèle, max 2 concurrent)
- Barre de progression par photo (DossierProgress existant réutilisé)
- Si erreur sur une photo : marquée "Échec", les autres continuent

### Étape 4 — Rattachement (NOUVEAU — après génération)
Quand toutes les photos sont générées, une modale ou un panneau s'affiche :

**Option A — Ajouter à un bien existant**
- Liste déroulante des biens de Thomas (adresse + type)
- Sélection → les visuels sont attachés à ce bien
- Nouveau dossier créé sous ce bien

**Option B — Créer un nouveau bien**
- Champs : adresse (autocomplete API), type de bien, surface (optionnel), prix (optionnel)
- Validation → bien créé + dossier attaché

**Option C — Ignorer / Télécharger sans bien**
- Lien "Télécharger les visuels et continuer" (sans créer de bien)
- Les visuels sont sauvegardés dans la galerie de Thomas sans bien associé

### Étape 5 — Résultats
- Page dossier ouverte (ou galerie si option C)
- Comparateur avant/après par photo
- Téléchargement HD, partage WhatsApp, lien dossier acquéreur

---

## 2. Cas edge

| Cas | Comportement |
|-----|--------------|
| Pas de bien existant | Seule l'option B (créer) est affichée, sans liste déroulante |
| Thomas annule la modale de rattachement | Les visuels restent dans sa galerie sans bien associé (option C implicite) |
| Erreur génération sur toutes les photos | Étape 4 non affichée. Bouton "Réessayer" uniquement |
| Erreur génération partielle (>= 1 succès) | Étape 4 affichée. Les photos en erreur sont marquées "Indisponible" dans le dossier |
| Thomas non Pro au moment de la génération | ProGate bloquant avant l'étape 3 (gating côté serveur inchangé) |
| Thomas n'a pas assez de crédits | Message d'erreur avant génération : "Il vous manque X crédit(s). Recharger ?" |
| Double clic sur "Générer" | Désactivation du bouton dès le premier clic (état loading) |
| Session expirée pendant la génération | Erreur 401 → redirection login → retour sur la page avec photos conservées en session |

---

## 3. Ce qui change

### UI — MerchantMode.tsx

**Supprimer**
- L'étape `"info"` et le formulaire adresse/surface/prix/type en tête de flow
- Le state `selectedPropertyId` en entrée de composant (il devient un état de l'étape 4)
- L'étape `"review"` (récapitulatif avant génération — superflu si les infos arrivent après)

**Modifier**
- `MerchantStep` : supprimer `"info"` et `"review"`, ajouter `"attach"` entre `"generating"` et `"results"`
- Flow : `"photos"` → `"annotate"` → `"style"` → `"generating"` → `"attach"` → `"results"`
- L'étape `"attach"` = modale ou panneau avec les 3 options A/B/C
- L'auto-open `window.open('/dossier/...')` : différer après le rattachement (ou immédiatement si option C)

**Nouveau composant** : `AttachToBienPanel.tsx`
- Props : `dossierUuid`, `existingProperties[]`, `onAttach(propertyId)`, `onCreate(formData)`, `onSkip()`
- Charge la liste via `GET /api/properties` (déjà existant)
- Formulaire de création avec autocomplete adresse (déjà implémenté dans le MerchantMode actuel)

### API

| Endpoint | Changement |
|----------|------------|
| `POST /api/dossier` | Rendre `property_id` optionnel (null acceptable à la création) |
| `PATCH /api/dossier/[uuid]/attach` | **NOUVEAU** — attache un dossier existant à un bien (property_id requis) |
| `POST /api/properties` | Inchangé — crée le bien + retourne l'id pour enchaîner avec PATCH ci-dessus |
| `GET /api/properties` | Inchangé |

Payload `PATCH /api/dossier/[uuid]/attach` :
```json
{ "property_id": "uuid-du-bien" }
```
Response 200 : `{ "dossier": { "uuid": "...", "property_id": "..." } }`

### DB

- Table `dossiers` : colonne `property_id` déjà présente — rendre nullable si ce n'est pas déjà le cas
- Aucune migration structurelle nécessaire si `property_id` est déjà nullable

---

## 4. Ce qui NE change PAS

- Pipeline de génération (2 passes, route.ts, builders, Flux fallback)
- Gating Pro (ProGate.tsx, vérification côté serveur)
- Décompte crédits (inchangé, côté serveur après succès passe 2)
- DossierProgress.tsx et DossierResult.tsx (réutilisés tels quels)
- Page publique `/dossier/[uuid]` (inchangée)
- Page "Mes biens" et "Mes dossiers" (inchangées)

---

## 5. Priorisation

| Item | Priorité | Dépendance |
|------|----------|------------|
| Supprimer étape "info" au début | P0 | Aucune |
| Créer `AttachToBienPanel.tsx` | P0 | Aucune |
| Rendre `property_id` nullable dans POST /api/dossier | P0 | Aucune |
| `PATCH /api/dossier/[uuid]/attach` | P0 | POST nullable |
| Mettre à jour `MerchantStep` et le flow | P0 | AttachToBienPanel |
| Différer window.open après rattachement | P1 | Flow mis à jour |

---

**Handoff → @fullstack**
- Fichiers à modifier : `components/MerchantMode.tsx`, `app/api/dossier/route.ts`
- Fichiers à créer : `components/AttachToBienPanel.tsx`, `app/api/dossier/[uuid]/attach/route.ts`
- Décisions prises : `property_id` nullable à la création ; PATCH dédié pour le rattachement post-génération ; option "Ignorer" obligatoire (Thomas ne doit jamais être bloqué)
- Points d'attention : l'autocomplete adresse et le formulaire de création bien existent déjà dans MerchantMode — extraire et réutiliser dans AttachToBienPanel sans dupliquer la logique
