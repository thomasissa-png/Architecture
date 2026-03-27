# Migration GPT-4.1 vers GPT Image 1.5 -- Plan de migration

> Date : 2026-03-27
> Agent : @ia
> Statut : DIAGNOSTIC COMPLET -- en attente de validation avant application
> Prompt version actuelle : v24

---

## 1. Recherche web : comment GPT Image 1.5 fonctionne

### 1.1 Architecture Responses API + image_generation tool

La Responses API fonctionne en 2 couches :
- **Couche raisonnement** : le `model` de niveau superieur (ex: `gpt-4.1`) analyse l'image input via la vision, comprend le prompt, et decide d'appeler le tool `image_generation`
- **Couche generation d'image** : le tool `image_generation` utilise un modele GPT Image en arriere-plan (par defaut `gpt-image-1`, desormais configurable)

**Changement cle** : depuis mars 2026, le tool `image_generation` accepte un parametre `model` qui permet de specifier quel modele image utiliser.

### 1.2 Parametres du tool image_generation (mis a jour)

```typescript
tools: [
  {
    type: "image_generation",
    model: "gpt-image-1.5",        // NOUVEAU - specifier le modele image
    input_fidelity: "high",         // INCHANGE - supporte sur gpt-image-1.5
    size: "1536x1024",              // INCHANGE - memes formats supportes
    // Nouveaux parametres optionnels :
    // action: "edit" | "generate" | "auto"  // defaut "auto"
    // background: "transparent" | "opaque" | "auto"  // defaut "auto"
  }
]
```

### 1.3 Nom du modele

- Slug API : `gpt-image-1.5`
- Alternatives : `chatgpt-image-latest` (alias, pointe vers la derniere version)
- Famille : gpt-image-1.5, gpt-image-1, gpt-image-1-mini

### 1.4 Compatibilite des parametres existants

| Parametre | gpt-image-1 (actuel) | gpt-image-1.5 | Compatible ? |
|---|---|---|---|
| `input_fidelity: "high"` | Supporte | Supporte (5 premieres images) | OUI |
| `size: "1024x1024"` | Supporte | Supporte | OUI |
| `size: "1536x1024"` | Supporte | Supporte | OUI |
| `size: "1024x1536"` | Supporte | Supporte | OUI |
| Format reponse `image_generation_call` | OUI | OUI | OUI |
| Champ `result` (base64) | OUI | OUI | OUI |

### 1.5 Ameliorations GPT Image 1.5 vs GPT Image 1

- **4x plus rapide** (latence generation)
- **Meilleur suivi d'instructions** (instruction following)
- **Meilleure preservation des inputs** (input fidelity ameliore)
- **20% moins cher** par image
- **Texte plus dense** dans les images (non pertinent pour nous)
- **Nouveau parametre `action`** : force "edit" ou "generate" (utile pour notre pipeline)

### 1.6 Pricing compare (source : openai.com/api/pricing, mars 2026)

#### GPT Image 1 (actuel, via gpt-4.1 + image_generation)

| Quality | 1024x1024 | 1536x1024 | 1024x1536 |
|---|---|---|---|
| Low | $0.011 | $0.016 | $0.016 |
| Medium | $0.042 | $0.063 | $0.063 |
| High | $0.167 | $0.250 | $0.250 |

#### GPT Image 1.5

| Quality | 1024x1024 | 1536x1024 | 1024x1536 |
|---|---|---|---|
| Low | $0.009 | $0.013 | $0.013 |
| Medium | $0.034 | $0.050 | $0.051 |
| High | $0.133 | $0.199 | $0.200 |

**Economie estimee : ~20% sur le cout image output.**

Note importante : ces prix couvrent uniquement le cout de generation d'image. Le cout total inclut aussi les tokens texte input (prompt) et les tokens image input (vision). Le cout du modele de raisonnement (`gpt-4.1`) reste inchange.

---

## 2. Diagnostic : lignes de route.ts a modifier

### 2.1 Occurrences du modele dans route.ts

**Fichier** : `app/api/generate/route.ts`

| Ligne | Code actuel | Contexte |
|---|---|---|
| 689 | `model: "gpt-4.1"` | `tryOpenAIResponses()` -- generation passes 1 et 2 |
| 708-710 | `type: "image_generation", input_fidelity: "high"` | Tool config dans `tryOpenAIResponses()` |
| 733 | `model: \`OpenAI GPT-4.1 (pass ${pass})\`` | Label de logging retourne |
| 825 | `model: "gpt-4.1"` | `tryOpenAIResponsesWithPrompt()` -- iterations |
| 841-842 | `type: "image_generation", input_fidelity: "high"` | Tool config dans `tryOpenAIResponsesWithPrompt()` |
| 866 | `model: "OpenAI GPT-4.1 (iteration)"` | Label de logging retourne |

### 2.2 Fichiers NON concernes

- `lib/custom-prompt.ts` : utilise `gpt-4.1-mini` pour le pre-processing texte -- NE PAS TOUCHER
- `app/api/merchant/enrich-property/route.ts` : utilise `gpt-4.1-mini` -- NE PAS TOUCHER
- `app/api/blog/generate/route.ts` : utilise `gpt-4.1-mini` -- NE PAS TOUCHER
- `app/api/properties/route.ts` : utilise `gpt-4.1-mini` -- NE PAS TOUCHER
- Fallback Flux Depth Pro : aucun changement requis
- Builders de prompts : aucun changement requis

### 2.3 Architecture cle a comprendre

Le `model: "gpt-4.1"` au niveau Responses API est le **modele de raisonnement** qui :
1. Recoit l'image input via la vision
2. Lit le prompt texte
3. Decide d'appeler le tool `image_generation`
4. Le tool utilise un modele GPT Image en arriere-plan

Actuellement, le tool `image_generation` n'a PAS de parametre `model`, donc il utilise le modele image par defaut (gpt-image-1).

**La migration consiste a ajouter `model: "gpt-image-1.5"` dans la config du tool, sans changer le modele de raisonnement.**

---

## 3. Plan de migration avec diffs exacts

### 3.1 Modification 1 : tryOpenAIResponses() (ligne ~706-712)

**Avant :**
```typescript
tools: [
  {
    type: "image_generation",
    input_fidelity: "high",
    size: size as "1024x1024" | "1536x1024" | "1024x1536",
  },
],
```

**Apres :**
```typescript
tools: [
  {
    type: "image_generation",
    model: "gpt-image-1.5",
    input_fidelity: "high",
    size: size as "1024x1024" | "1536x1024" | "1024x1536",
  },
],
```

### 3.2 Modification 2 : tryOpenAIResponses() label de logging (ligne 733)

**Avant :**
```typescript
model: `OpenAI GPT-4.1 (pass ${pass})`,
```

**Apres :**
```typescript
model: `OpenAI GPT-Image-1.5 (pass ${pass})`,
```

### 3.3 Modification 3 : tryOpenAIResponsesWithPrompt() (ligne ~839-845)

**Avant :**
```typescript
tools: [
  {
    type: "image_generation",
    input_fidelity: "high",
    size: size as "1024x1024" | "1536x1024" | "1024x1536",
  },
],
```

**Apres :**
```typescript
tools: [
  {
    type: "image_generation",
    model: "gpt-image-1.5",
    input_fidelity: "high",
    size: size as "1024x1024" | "1536x1024" | "1024x1536",
  },
],
```

### 3.4 Modification 4 : tryOpenAIResponsesWithPrompt() label (ligne 866)

**Avant :**
```typescript
model: "OpenAI GPT-4.1 (iteration)",
```

**Apres :**
```typescript
model: "OpenAI GPT-Image-1.5 (iteration)",
```

### 3.5 Modification optionnelle : parametre action pour les iterations

Pour les iterations (edits sur image existante), ajouter `action: "edit"` peut forcer le modele en mode edition plutot que laisser "auto" decider :

```typescript
tools: [
  {
    type: "image_generation",
    model: "gpt-image-1.5",
    input_fidelity: "high",
    action: "edit",  // force le mode edition pour les iterations
    size: size as "1024x1024" | "1536x1024" | "1024x1536",
  },
],
```

**Recommandation** : tester d'abord sans `action` (defaut "auto"), puis tester avec `action: "edit"` si les iterations montrent des regressions.

### 3.6 Modification optionnelle : incrementer PROMPT_VERSION

**Avant :**
```typescript
export const PROMPT_VERSION = "v24";
```

**Apres :**
```typescript
export const PROMPT_VERSION = "v25";
```

Justification : permet aux agents d'audit (Yann Duval, Lucas Moreau) de correler les changements de qualite avec le changement de modele.

### 3.7 AUCUNE modification sur le model de raisonnement

Le `model: "gpt-4.1"` au niveau `openai.responses.create()` **reste gpt-4.1**. C'est le modele de raisonnement/vision qui interprete le prompt. Le changer pour gpt-5 ou autre est une decision separee et independante de la migration du modele image.

### 3.8 Recapitulatif des changements

| # | Fichier | Ligne | Changement | Type |
|---|---|---|---|---|
| 1 | route.ts | ~708 | Ajout `model: "gpt-image-1.5"` dans tools | REQUIS |
| 2 | route.ts | 733 | Label logging → `GPT-Image-1.5` | REQUIS |
| 3 | route.ts | ~841 | Ajout `model: "gpt-image-1.5"` dans tools | REQUIS |
| 4 | route.ts | 866 | Label logging → `GPT-Image-1.5` | REQUIS |
| 5 | route.ts | 32 | PROMPT_VERSION → "v25" | RECOMMANDE |
| 6 | route.ts | iterations | Ajout `action: "edit"` | OPTIONNEL (a tester) |

**Total : 4 modifications requises, 1 recommandee, 1 optionnelle. Zero changement de prompt, zero changement de pipeline, zero changement de fallback.**

---

## 4. Risques identifies et mitigations

### 4.1 Risque TypeScript : le SDK OpenAI accepte-t-il `model` dans le tool ?

**Risque** : le type TypeScript du SDK openai peut ne pas encore inclure `model` dans le type `ImageGeneration` du tool.

**Mitigation** :
- Verifier la version du SDK installee (`npm ls openai`)
- Si le type n'est pas a jour, utiliser un cast temporaire :
  ```typescript
  tools: [
    {
      type: "image_generation",
      model: "gpt-image-1.5",
      input_fidelity: "high",
      size: size as "1024x1024" | "1536x1024" | "1024x1536",
    } as any,
  ],
  ```
- Mettre a jour le SDK openai vers la derniere version (`npm install openai@latest`)

### 4.2 Risque : changement de comportement du modele image

**Risque** : GPT Image 1.5 peut produire des resultats visuellement differents de GPT Image 1 (meilleur suivi d'instructions = potentiellement plus de changements sur l'image).

**Mitigation** :
- Tester avec 3-4 images connues (les memes que les audits precedents)
- Comparer les rendus pass 1 (surfaces) : la geometrie doit etre preservee
- Comparer les rendus pass 2 (mobilier) : le mobilier doit etre present et bien distribue
- Si regression : rollback en supprimant `model: "gpt-image-1.5"` du tool (retour au defaut)

### 4.3 Risque : rate limits differents

**Risque** : GPT Image 1.5 a des limites d'images par minute (IPM) differentes selon le tier :
- Tier 1 : 5 IPM
- Tier 2 : 20 IPM
- Tier 3 : 50 IPM
- Tier 4 : 150 IPM
- Tier 5 : 250 IPM

**Mitigation** :
- Verifier le tier actuel du compte OpenAI
- Le pipeline 2 passes = 2 images par generation. A 5 IPM (Tier 1), ca limite a 2.5 generations/minute.
- Le rate limit existant de Versiroom (10 req/min/IP) est deja un garde-fou cote client
- Si necessaire, ajouter un retry avec backoff sur les erreurs 429

### 4.4 Risque : cout total potentiellement different

**Risque** : le prix par image output est 20% moins cher, mais `input_fidelity: "high"` sur gpt-image-1.5 consomme plus de tokens input image (les 5 premieres images sont preservees en haute fidelite).

**Mitigation** :
- Le pipeline n'envoie qu'une seule image par appel (jamais 5+)
- Le cout input sera similaire ou legerement superieur
- Le cout output est 20% moins cher
- **Bilan net : economie estimee ~15-20% par generation**

### 4.5 Risque : verification organisation requise

**Risque** : OpenAI peut exiger une verification d'organisation pour acceder a GPT Image 1.5.

**Mitigation** :
- Verifier dans le dashboard OpenAI si la verification est deja faite
- Si non, la lancer avant la migration (peut prendre quelques jours)

---

## 5. Plan de test

### 5.1 Pre-requis

1. Mettre a jour le SDK openai : `npm install openai@latest`
2. Verifier le tier du compte OpenAI (dashboard)
3. Verifier que la verification d'organisation est validee

### 5.2 Tests unitaires (avant deploy)

1. **Test TypeScript** : `npm run build` -- verifier que le type `model` est accepte dans le tool
2. **Test API local** : generer 1 image avec un style simple (Scandinave) sur une photo connue
3. **Verifier la reponse** : le champ `image_generation_call` doit toujours etre present dans `response.output`
4. **Verifier le base64** : l'image doit etre un PNG valide decodable

### 5.3 Tests de regression fonctionnelle

Pour chaque test, utiliser la meme image input que les audits Sprint 16b/17 :

| Test | Description | Critere PASS |
|---|---|---|
| T1 | Passe 1 seule (Scandinave) | Geometrie preservee, surfaces appliquees, piece vide |
| T2 | Pipeline complet (Scandinave) | Mobilier present, distribue en profondeur, surfaces intactes |
| T3 | Pipeline complet (Art Deco) | Style differencie, herringbone parquet, luminaire specifique |
| T4 | Pipeline complet (Japandi) | Minimaliste, poutres preservees si presentes |
| T5 | Iteration sur resultat T2 | Mobilier ajoute/modifie sans perte de l'existant |
| T6 | Fallback Flux | Couper la cle OpenAI, verifier que Flux Depth Pro fonctionne |
| T7 | Image portrait (1024x1536) | Ratio preserve, pas de deformation |
| T8 | Image paysage (1536x1024) | Ratio preserve, pas de deformation |

### 5.4 Tests de performance

| Metrique | Baseline (GPT Image 1) | Cible (GPT Image 1.5) |
|---|---|---|
| Latence passe 1 | ~30-45s | ~10-15s (4x plus rapide attendu) |
| Latence passe 2 | ~30-45s | ~10-15s |
| Latence totale 2 passes | ~60-90s | ~20-30s |
| Cout par generation | ~$0.10-0.13 | ~$0.07-0.10 |

### 5.5 Tests d'audit agents

Apres deploy, lancer un audit croise Yann Duval + Lucas Moreau sur 3-4 generations pour verifier :
- Fidelite stylistique (Yann) >= 7.5/10
- Preservation geometrie (Lucas) >= 7.5/10
- Qualite photorealiste (Lucas) >= 7.5/10

### 5.6 Rollback

Si regression detectee :
1. Supprimer `model: "gpt-image-1.5"` des 2 blocs tools
2. Remettre les labels de logging a "GPT-4.1"
3. Remettre PROMPT_VERSION a "v24"
4. Deploy

**Temps de rollback estime : 2 minutes.**

---

## 6. ROI de la migration

```
Economie mensuelle estimee (a 1000 generations/semaine) :
- Avant : ~$0.12/generation x 4000/mois = ~$480/mois (cout image output uniquement)
- Apres : ~$0.09/generation x 4000/mois = ~$360/mois
- Economie : ~$120/mois (-25%)

Gain de latence :
- Avant : ~70s par generation complete
- Apres : ~25s par generation complete (estimation 4x)
- Experience utilisateur : de "90 secondes" a "30 secondes" — en dessous du seuil de frustration

ROI = (temps dev migration ~30 min) / (economie $120/mois + UX nettement amelioree)
→ ROI immediat, pas de discussion.
```

---

## 7. Checklist pre-migration

- [ ] Mettre a jour le SDK openai (`npm install openai@latest`)
- [ ] Verifier la verification d'organisation dans le dashboard OpenAI
- [ ] Verifier le tier (IPM) du compte
- [ ] Appliquer les 4 modifications requises dans route.ts
- [ ] Incrementer PROMPT_VERSION a "v25"
- [ ] `npm run build` -- verifier zero erreur TypeScript
- [ ] Tester en local sur 1 generation (T1)
- [ ] Deploy sur Replit
- [ ] Tester T1-T8 en production
- [ ] Lancer audit agents sur 3-4 generations
- [ ] Mettre a jour project-context.md (Outils IA utilises)
- [ ] Mettre a jour CLAUDE.md (Regles Prompts IA)

---

**Handoff -> @fullstack**
- Fichier produit : `docs/ia/migration-gpt-image-1.5.md`
- Decision prise : migration du modele image de gpt-image-1 (implicite) vers gpt-image-1.5 (explicite) via le parametre `model` du tool `image_generation`. Le modele de raisonnement `gpt-4.1` reste inchange.
- Points d'attention :
  - 4 modifications dans `app/api/generate/route.ts` (lignes ~708, 733, ~841, 866)
  - Verifier la version du SDK openai (le type `model` dans le tool doit etre supporte)
  - Tester le build TypeScript avant deploy
  - Rollback trivial : supprimer `model: "gpt-image-1.5"` des tools
  - Le parametre `action: "edit"` est optionnel et a tester separement (iterations seulement)

---

Sources :
- [GPT Image 1.5 Model | OpenAI](https://platform.openai.com/docs/models/gpt-image-1.5)
- [Image generation guide | OpenAI](https://developers.openai.com/api/docs/guides/image-generation)
- [Create a model response | OpenAI API Reference](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [Pricing | OpenAI](https://openai.com/api/pricing/)
- [OpenAI Image Generation API Pricing 2026](https://www.aifreeapi.com/en/posts/openai-image-generation-api-pricing)
- [GPT Image 1 vs GPT Image 1.5](https://www.aifreeapi.com/en/posts/gpt-image-1-vs-gpt-image-1-5)
- [Changelog | OpenAI](https://platform.openai.com/docs/changelog)
