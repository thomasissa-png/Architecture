# Analyse de plans architecturaux par IA -- Recherche technique

> Projet : Versimo (pivot marchand de biens)
> Date : 2026-04-09
> Agent : @ia
> Stack actuelle : Next.js 14, OpenAI gpt-image-1.5 (Responses API), pipeline 2 passes

---

## 1. Modeles disponibles pour l'analyse de plans

### Modeles vision generalistes

| Modele | Capacite analyse plan | Formats input | Precision dimensions | Cout / appel (plan A3) | Latence estimee |
|---|---|---|---|---|---|
| **GPT-4.1 vision** (OpenAI Responses API) | Identification pieces, portes, fenetres, cotes. OCR des annotations. Raisonnement spatial bon mais pas parfait sur mesures precises | JPEG, PNG, PDF (via conversion), WEBP | ~70-80% sur cotes lisibles. Faible sur plans basse resolution ou cotes occultees | ~$0.02-0.05 (image ~1500 tokens + ~500 tokens output) | 3-6s |
| **Claude 3.5 Sonnet vision** (Anthropic Messages API) | Excellent en raisonnement spatial et description structuree. Extraction pieces/fonctions fiable. OCR moyen sur petits textes techniques | JPEG, PNG, WEBP, GIF, PDF (natif) | ~65-75% sur cotes. Meilleur que GPT-4.1 pour le raisonnement qualitatif (ex: "cette piece est mal agencee") | ~$0.01-0.03 (3$/MTok in, 15$/MTok out) | 3-8s |
| **Gemini 2.0 Flash** (Google AI) | Contexte 1M tokens. Peut ingerer plans multi-pages. Detection pieces correcte, OCR competitif | JPEG, PNG, PDF (natif multi-page), WEBP | ~65-75% sur cotes. Rapide mais moins precis que GPT-4.1 sur details fins | ~$0.005-0.015 (tarifs Flash tres bas) | 1-3s |
| **Gemini 2.5 Pro** (Google AI) | Meilleur raisonnement spatial de la gamme Google. Contexte 1M. Multi-page natif | JPEG, PNG, PDF, WEBP | ~75-80% sur cotes. Comparable a GPT-4.1 | ~$0.02-0.06 | 5-10s |

### Plateformes specialisees

| Plateforme | Specialite | API disponible | Precision | Cout | Limitation Versimo |
|---|---|---|---|---|---|
| **Archilogic** (Floor Plan SDK + GraphQL API) | Digitalisation de plans, modeles 3D interactifs, SDK spatial | Oui (GraphQL API, Floor Plan Engine SDK) | Haute (pipeline specialise murs/portes/fenetres) | Sur devis entreprise (pas de tarif public par appel) | Surdimensionne pour le use case. Integration lourde. Pas de generation visuelle |
| **Maket** | Reconnaissance de plans + generation d'agencements IA | Non (produit SaaS, pas d'API publique) | Bonne (murs, portes, fenetres en < 1 min) | Plans a partir de $29/mois | Pas d'API = pas integrable dans Versimo |
| **TestFit** | Faisabilite immobiliere, site planning | Non (pas d'API) | Haute pour faisabilite lots/parcelles | $100/mois (Urban Planner) | Outil standalone, pas d'API, cible promoteurs pas marchands de biens |
| **Planner 5D** | Modelisation 3D interieure | Non (pas d'API publique exploitable) | N/A (outil de creation, pas d'analyse) | Free / Premium $7-25/mois | Pas d'analyse de plan existant, pas d'API |
| **Drafto** | Conversion plan 2D vers render 3D | Non (produit SaaS) | Bonne identification pieces/dimensions | [A TESTER] | Pas d'API, produit concurrent direct |

### Verdict

**Aucune API specialisee plan n'est integrable simplement dans Versimo.** Les plateformes specialisees (Archilogic, Maket, TestFit) sont soit sans API, soit en modele entreprise surdimensionne. La meilleure option est un **modele vision generaliste** avec prompt engineering specifique plan.

---

## 2. Pipeline technique recommande

```
Upload plan (PDF/JPG)
       |
       v
  [1. EXTRACTION]  GPT-4.1 vision
  Identification pieces, dimensions, ouvertures
  → JSON structure {pieces: [{nom, m2, dimensions, fenetres, portes}]}
       |
       v
  [2. VALIDATION]  UI Next.js (client)
  Tableau editable : l'utilisateur corrige noms/dimensions
  → JSON valide
       |
       v
  [3. RECOMMANDATIONS]  GPT-4.1 text (pas vision)
  Analyse du JSON valide → suggestions reagencement
  → JSON {recommandations: [{piece, action, justification}]}
       |
       v
  [4. GENERATION VISUELS]  gpt-image-1.5 (pipeline 2 passes existant)
  1 generation par piece avec prompt enrichi des dimensions
  → Images avant/apres par piece
```

| Etape | Modele recommande | Justification |
|---|---|---|
| 1. Extraction | **GPT-4.1 vision** | Deja dans la stack (zero cout d'integration). Meilleur OCR sur cotes que Claude. Structured output via Responses API |
| 2. Validation | **UI client (pas d'IA)** | Les dimensions extraites par IA ne sont JAMAIS fiables a 100%. L'utilisateur DOIT valider. C'est aussi un point de confiance UX |
| 3. Recommandations | **GPT-4.1 text** | Raisonnement sur JSON structure. Pas besoin de vision. Cout minimal (~$0.01). Contexte metier marchand de biens injectable en system prompt |
| 4. Visuels | **gpt-image-1.5** (existant) | Pipeline 2 passes deja en place. Le prompt est enrichi avec les dimensions validees de l'etape 2 |

---

## 3. Generation de visuels contraints par plan

### Probleme central

gpt-image-1.5 ne "comprend" pas les dimensions au sens geometrique. Ecrire "piece de 4.2m x 3.1m" dans le prompt ne garantit PAS que l'image generee respecte ces proportions.

### Options evaluees

| Option | Description | Faisabilite | Precision spatiale | Cout additionnel | Recommandation |
|---|---|---|---|---|---|
| **(a) Prompt enrichi dimensions** | Injecter "room is 4.2m wide x 3.1m deep, rectangular" + references d'echelle ("door handle at 1m, ceiling at 2.5m") dans le prompt existant | Immediate (zero code nouveau) | Moyenne. Le modele respecte le ratio approximatif mais pas les dimensions exactes | $0 | **RECOMMANDE comme V1** |
| **(b) Depth map / ControlNet** | Generer une depth map du plan 2D, l'utiliser comme contrainte spatiale (Flux Depth Pro ou ControlNet) | Moyenne. Necessite conversion plan 2D → depth map (non trivial) | Haute si depth map correcte | +$0.05-0.10/image (Replicate) | Ecarte : Flux interdit par decision fondateur. ControlNet = nouveau provider |
| **(c) Render 3D → img2img** | Generer un render 3D basique (Three.js / Blender headless) a partir des dimensions, puis l'utiliser comme input de gpt-image-1.5 | Complexe (pipeline 3D server-side) | Tres haute (la geometrie 3D est exacte) | Infra 3D server-side a deployer | Ecarte V1 : trop complexe. Possible V2 si demande marche |
| **(d) Photo de la piece reelle** | L'utilisateur uploade la photo de la piece ET le plan. Les dimensions du plan enrichissent le prompt applique a la photo | Immediate (extension du flow actuel) | Haute (la photo EST la geometrie reelle) | $0 | **RECOMMANDE en complement de (a)** |

### Recommandation

**V1 : Option (a) + (d) combinees.** Le plan sert de SOURCE DE DONNEES (extraction pieces + dimensions), pas de source d'image. Les visuels sont generes soit depuis les photos reelles uploadees (cas ideal), soit depuis un prompt enrichi des dimensions extraites du plan (cas sans photo). Le prompt inclut :
- Ratio de la piece (ex: "rectangular room, wider than deep, ratio 1.35:1")
- Hauteur sous plafond (ex: "ceiling height 2.50m")
- Position des ouvertures (ex: "one window on the left wall, door on the right wall")
- References d'echelle (poignee de porte 1m, prise electrique 30cm)

Cela s'integre DIRECTEMENT dans le pipeline 2 passes existant sans modification d'architecture.

---

## 4. Risques et limitations

- **Precision OCR insuffisante** : les cotes sur plans architecturaux sont souvent petites, en police technique, partiellement occultees par des lignes. GPT-4.1 vision rate ~20-30% des cotes. La validation utilisateur est OBLIGATOIRE, pas optionnelle
- **Plans non cotes** : certains plans de marchands de biens sont des scans basse resolution sans cotes (photos de plaquettes, screenshots portails immo). L'IA ne peut PAS inventer des dimensions. Fallback : estimation par ratio porte standard (83cm) comme reference d'echelle
- **Fidelite geometrique des visuels** : gpt-image-1.5 ne respecte pas les dimensions au pixel pres. Les visuels sont des SUGGESTIONS d'ambiance, pas des rendus d'architecte. A communiquer clairement dans l'UX
- **Multi-niveaux / duplex** : un plan d'immeuble multi-etages necessite une segmentation par niveau. Le pipeline doit gerer l'association plan-niveau → pieces
- **Legende et symboles techniques** : les symboles electriques, plomberie, chauffage ne sont pas toujours bien interpretes par les modeles vision. Risque de confusion avec du mobilier
- **Rotation et echelle** : les plans scannes sont souvent tournes ou sans echelle. Pre-processing necessaire (detection nord, detection echelle graphique)
- **Volume d'appels** : 24 pieces = 24 extractions + 24 generations 2 passes = 72 appels OpenAI minimum. Risque de rate limiting (gpt-image-1.5 : [A TESTER] RPM sur le tier actuel)
- **Cout cumule** : a $0.10-0.20/piece (extraction + 2 passes generation), un immeuble 6 lots coute $2.40-4.80 en API. Acceptable mais a monitorer si usage intensif

---

## 5. Cout estime par bien (immeuble 6 lots, 4 pieces/lot = 24 pieces)

| Etape | Appels | Cout unitaire | Sous-total |
|---|---|---|---|
| Upload + extraction plan (1 plan par lot, 6 plans) | 6 appels GPT-4.1 vision | ~$0.04 | $0.24 |
| Pre-processing prompts custom (si applicable) | 6 appels GPT-4.1-mini | ~$0.001 | $0.006 |
| Recommandations reagencement (1 par lot) | 6 appels GPT-4.1 text | ~$0.01 | $0.06 |
| Generation visuels passe 1 (surfaces) | 24 appels gpt-image-1.5 | ~$0.05 | $1.20 |
| Generation visuels passe 2 (mobilier) | 24 appels gpt-image-1.5 | ~$0.05 | $1.20 |
| **TOTAL par bien** | **66 appels** | | **~$2.71** |

### Contexte ROI marchand de biens

| Metrique | Valeur |
|---|---|
| Cout Versimo par bien (API) | ~$2.71 (~2.50 EUR) |
| Cout home stager humain (6 lots × 3 visuels) | 1 500 - 3 000 EUR |
| **Economie** | **99.8%** |
| Temps humain economise | ~48-72h de delai → ~10-15 min |
| ROI (template standard) | (48h × 50 EUR/h) / 2.50 EUR = **960** |

> ROI > 3 : feature IA massivement justifiee. Le cout API est negligeable face a la valeur.

### Notes sur les tarifs

Les couts gpt-image-1.5 sont estimes sur la base des tarifs gpt-image-1 connus ($0.04-0.08/image selon taille). [A TESTER] : verifier les tarifs exacts de gpt-image-1.5 sur la page pricing OpenAI apres release publique. Les tarifs GPT-4.1 vision sont bases sur $2/MTok input, $8/MTok output (tarifs publics avril 2025).

---

**Handoff -> @fullstack**
- Fichier produit : `docs/marchand-pivot/ia/plan-analysis-research.md`
- Decisions prises : GPT-4.1 vision pour extraction (deja dans la stack), validation utilisateur obligatoire (pas d'automatisation aveugle), enrichissement prompt par dimensions (pas de pipeline 3D), gpt-image-1.5 existant pour les visuels
- Points d'attention : precision OCR ~70-80% (validation utilisateur obligatoire), rate limiting sur 72 appels sequentiels (paralleliser par lot, max 2 concurrent comme existant), cout ~$2.71/bien (ROI 960x), aucune API specialisee plan integrable simplement
- A implementer dans `src/lib/ai/` : `plan-extractor.ts` (extraction JSON depuis plan via GPT-4.1 vision), schema Zod pour la structure pieces/dimensions, enrichissement du prompt pipeline existant avec dimensions

---

Sources :
- [Archilogic -- Spatial data platform](https://www.archilogic.com)
- [Maket -- AI Floorplan Recognizer](https://www.maket.ai/post/ai-floorplan-recognizer-upload-an-existing-plan-get-right-to-editing)
- [Drafto -- AI Floor Plan to Render](https://www.getdrafto.com/ai-floor-plan-to-render)
- [TestFit Pricing](https://www.testfit.io/pricing)
- [Planner 5D Pricing](https://planner5d.com/pricing)
- [OpenAI GPT-4.1 Multimodal Analysis](https://blog.roboflow.com/gpt-4-1-multimodal/)
- [OpenAI GPT-4.1 Model](https://developers.openai.com/api/docs/models/gpt-4.1)
- [Construction Drawing & Floor Plan Analysis With AI](https://www.businesswaretech.com/blog/architectural-floor-plan-analysis)
- [Survey of Floor Plan Recognition](https://dl.acm.org/doi/10.1145/3747227.3747250)
