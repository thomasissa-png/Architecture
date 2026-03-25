# Audit Paysagiste — Prompts Extérieurs — Camille Verdier — 25 mars 2026

## Contexte

Audit des 6 styles extérieurs de Versiroom (lib/outdoor-styles.ts) et des builders outdoor de route.ts.
Méthode : analyse statique des prompts surfacePrompt + furniturePrompt + builders. Pas de visuels générés disponibles.

---

## Tableau des notes par style /10

| Style | Végétal | Sol | Mobilier | Dimensions | Éclairage | Ambiance | Note globale |
|---|---|---|---|---|---|---|---|
| Contemporain Outdoor | 4 | 8 | 7 | 7 | 4 | 6 | **6.0** |
| Méditerranéen | 6 | 5 | 6 | 5 | 5 | 7 | **5.7** |
| Bohème Garden | 5 | 6 | 6 | 6 | 7 | 7 | **6.2** |
| Minimaliste Urbain | 5 | 7 | 7 | 7 | 3 | 6 | **5.8** |
| Rooftop | 4 | 7 | 8 | 8 | 6 | 7 | **6.7** |
| Cosy Balcon | 6 | 6 | 7 | 7 | 7 | 8 | **6.8** |

**Score global prompts styles : 6.2 / 10**

---

## Analyse détaillée par style

### 1. Contemporain Outdoor — 6.0/10

**Prompt actuel (surface)**
`Contemporary outdoor: large-format smooth grey concrete pavers 60x60cm with narrow joints, preserve all existing guard rails and exterior walls unchanged, no ceiling — open sky preserved as-is`

**Prompt actuel (furniture)**
`Contemporary outdoor furniture: modular L-shaped outdoor sofa 240cm in charcoal weather-resistant fabric with aluminium frame, rectangular tempered glass coffee table 100x60cm on black steel legs, two unlit ground lanterns 30cm tall in dark metal flanking the seating area, single tall architectural planter 80cm with clipped boxwood sphere, neutral outdoor cushions in graphite and off-white. Clean geometric layout, no clutter.`

**Observations Camille**
- Sol : béton 60x60 est précis, c'est bien. Mais zéro variation pour les grandes terrasses (pas de bande de rive, pas de joint coloré).
- Végétal : buis taillé en sphère unique — trop générique, trop "entrée d'immeuble". Un Calamagrostis acutiflora ou un Stipa tenuissima aurait plus de tenue architecturale.
- Mobilier : sofa 240cm avec aluminium est crédible. Mais le "tempered glass coffee table" va poser un problème de photorealisme (le modèle va souvent rater le rendu du verre extérieur).
- Éclairage : "two unlit ground lanterns" — non éclairées = quasi invisibles sur un rendu de jour. Soit on précise "unlit daytime shot", soit on les remplace par des bornes encastrées.
- Manque : aucune plante en strate basse, aucune indication de hauteur par rapport à la vue.

**Prompt amélioré (surface)**
`Contemporary outdoor: large-format grey concrete pavers 60x60cm laid in linear bond with 4mm grey grouted joints, narrow stainless steel expansion joint every 3m, preserve all existing guard rails and exterior walls unchanged, open sky preserved as-is.`

**Prompt amélioré (furniture)**
`Contemporary outdoor furniture: modular low-profile L-shaped outdoor sofa 240cm in graphite grey Sunbrella-type fabric with powder-coated matt black aluminium frame, rectangular concrete-fibre side table 90x45cm, two cast-concrete rectangular planters 100x30cm with single Stipa tenuissima grass clump each, one tall fibrecite planter 70cm with Calamagrostis Karl Foerster 120cm tall, four stainless steel recessed ground uplights along the planter edge. No clutter, generous empty floor space between furniture and guard rail.`

---

### 2. Méditerranéen — 5.7/10

**Prompt actuel (surface)**
`Mediterranean outdoor: natural stone or warm terracotta floor tiles with aged patina, preserve all existing walls facades and guard rails unchanged, no ceiling — open sky preserved as-is`

**Prompt actuel (furniture)**
`Mediterranean outdoor furniture: round wrought-iron table 120cm in antique white with matching 4 bistro chairs, two large terracotta pots 50cm with olive trees, ceramic lanterns with candles on the table, linen table runner in natural ecru, small herb pots (rosemary, lavender) along the wall edge. Warm convivial atmosphere with natural materials.`

**Observations Camille**
- Sol : "natural stone or warm terracotta" est ambigu — le modèle doit choisir. Il faut nommer un seul matériau. Sur une terrasse, tomettes 30x30 ou pierre de Bourgogne 40x60 — il faut trancher.
- Végétal : "olive trees" dans des pots 50cm = physiologiquement aberrant. Un olivier adulte nécessite un bac d'au moins 80-100cm pour tenir. Risque fort d'échelle incohérente.
- Mobilier : la table ronde 120cm en fer forgé blanc est cohérente mais très clichée. Aucun accessoire outdoor distinctif (carafe en grès, bol d'olives en céramique artisanale).
- Dimensions : "small herb pots" sans dimensions = le modèle va placer des pots miniatures ou des pots de jardinerie.
- Éclairage : seulement des bougies dans des lanternes — pour un espace extérieur de jour, c'est suffisant mais le rendu de flamme de bougie sur une photo plein soleil sera invisible.

**Prompt amélioré (surface)**
`Mediterranean outdoor: reclaimed Provençal terracotta tiles 30x30cm with natural irregular patina and slightly raised grout joints in light ochre mortar, low dry-stone rendered wall coping in warm limestone, preserve all existing walls facades and guard rails unchanged, open sky preserved as-is.`

**Prompt amélioré (furniture)**
`Mediterranean outdoor furniture: round wrought-iron table 120cm in aged antique white finish with 4 matching bistro armchairs with woven rush seats, two glazed terracotta planters 90cm diameter with standard-trained olive trees 150cm overall height, three smaller terracotta pots 25-30cm with rosemary and lavender along the wall base, ceramic lanterns 25cm tall on table surface with unlit pillar candles, linen table runner 40x120cm in natural ecru with fringe edge. Warm convivial atmosphere.`

---

### 3. Bohème Garden — 6.2/10

**Prompt actuel (surface)**
`Bohemian garden outdoor: reclaimed irregular stone pavers with white gravel borders, preserve all existing vegetation walls and fences unchanged, no ceiling — open sky preserved as-is`

**Prompt actuel (furniture)**
`Bohemian garden furniture: two round waterproof floor poufs 50cm in terracotta and mustard, low pallet-style coffee table 90x60cm with weathered wood finish, outdoor jute rug 160x230cm, three hanging macrame plant holders on a freestanding wooden rack 180cm tall, potted tropical plants (monstera, fern) in woven baskets, battery-powered string lights draped loosely on the rack. Relaxed layered eclectic atmosphere.`

**Observations Camille**
- Sol : "reclaimed irregular stone pavers with white gravel borders" est cohérent et précis. Bien.
- Végétal : monstera et fougères dans un jardin extérieur — problème. Ce sont des plantes d'intérieur. Dehors en France, elles ne résistent pas. Pour un jardin bohème extérieur : agapanthes, hortensias, rudbeckias, cosmos, herbes hautes.
- Mobilier : les poufs outdoor en jute sont un piège — le jute ne résiste pas à la pluie. Préciser "weatherproof polyester in jute look".
- Le rack macramé en bois 180cm est fragile sur un jardin exposé. Cohérent stylistiquement mais le modèle va souvent produire quelque chose de trop instable visuellement.
- Éclairage : guirlandes sur rack = bien. Préciser "warm white 2200K" pour éviter que le modèle génère des guirlandes multicolores.
- Rug outdoor 160x230cm en jute = non-durable sans préciser "outdoor-rated flat-weave rug".

**Prompt amélioré (surface)**
`Bohemian garden outdoor: reclaimed irregular sandstone pavers 20-40cm variable size with moss-filled joints and raked white marble gravel borders 30cm wide, preserve all existing fences hedges and background trees unchanged, open sky preserved as-is.`

**Prompt amélioré (furniture)**
`Bohemian garden furniture: two round weatherproof floor cushions 55cm in terracotta and mustard outdoor polyester fabric, low reclaimed-wood pallet coffee table 90x60cm aged grey finish, outdoor flat-weave cotton rug 160x230cm in warm earthy tones, freestanding bamboo rack 180cm with three hanging macrame plant holders, potted agapanthus 60cm tall in woven sea-grass basket, potted cosmos and rudbeckia mix in terracotta pots 30cm, battery string lights 2200K warm white draped loosely on the bamboo rack. Layered informal atmosphere.`

---

### 4. Minimaliste Urbain — 5.8/10

**Prompt actuel (surface)**
`Minimalist urban outdoor: smooth polished concrete floor with millimetric joints in light grey, preserve all existing guard rails walls and facades unchanged, no ceiling — open sky preserved as-is`

**Prompt actuel (furniture)**
`Minimalist urban outdoor furniture: two teak sun loungers 190cm with clean straight lines and light grey cushions, low rectangular concrete-fibre coffee table 80x40cm, one tall concrete planter 90cm with single ornamental grass (Miscanthus), no decorative objects, no textiles beyond cushions. Strict geometric arrangement, generous empty floor space.`

**Observations Camille**
- Sol : béton poli avec "millimetric joints" est précis. Mais "polished concrete" extérieur est un risque (glissant, entretien lourd) — pour un rendu crédible, préférer "brushed concrete" ou "honed concrete".
- Végétal : Miscanthus dans un planter est crédible mais sans espèce précise — "Miscanthus sinensis Gracillimus" ou "Stipa gigantea" donneraient une silhouette distinctive.
- Mobilier : bains de soleil teck 190cm sont réalistes. Mais la scène est trop vide — le modèle va souvent ajouter des éléments parasites pour "compléter". Ajouter au moins une table d'appoint.
- Éclairage : aucune mention. Pour un minimaliste urbain, les spots encastrés dans le sol sont une signature — leur absence rend le rendu générique.
- Le "no decorative objects" risque de produire une scène CGI stérile — autoriser un seul élément d'ancrage (galets, gravier blanc dans plateau).

**Prompt amélioré (surface)**
`Minimalist urban outdoor: brushed light grey concrete floor 90x90cm large slabs with 6mm charcoal grouted joints, immaculate smooth finish free of stains, preserve all existing guard rails walls and facades unchanged, open sky preserved as-is.`

**Prompt amélioré (furniture)**
`Minimalist urban outdoor furniture: two teak sun loungers 195cm with clean straight slatted frame and light stone-grey waterproof cushions, low rectangular fibrecite side table 80x40cm in light grey, one tall square concrete planter 90cm with single Stipa gigantea 120cm grass plume, four recessed stainless steel ground-level uplights 12cm diameter flush with floor surface, small round polished concrete tray 30cm with three white river stones on the coffee table. Strict geometry, large empty floor zone preserved between items.`

---

### 5. Rooftop — 6.7/10

**Prompt actuel (surface)**
`Rooftop outdoor: IPE wood deck planks silver-grey patina 140mm wide, preserve existing parapet walls guard rails and skyline exactly as in the input, no ceiling — open sky preserved as-is`

**Prompt actuel (furniture)**
`Rooftop furniture: modular weatherproof banquette 200cm in charcoal grey with deep seat cushions, large parasol 3m deported on weighted base in matte black, rectangular dining table 160cm in powder-coated dark steel with 4 stacking outdoor chairs, two floor lanterns 40cm with LED candles, single potted bamboo 150cm in dark grey fibrecite planter. Urban lounge atmosphere, preserve city view.`

**Observations Camille**
- Sol : IPE 140mm silver-grey est précis et réaliste — c'est exactement ce qu'on voit sur les bons rooftops parisiens. Très bien.
- Végétal : bambou 150cm dans un planter sur rooftop — risque vent. Plus crédible : bambou 120cm en pot lesté, ou herbe ornementale (Miscanthus). Le bambou 150cm peut partir en vrille sur le rendu si le modèle l'exagère.
- Mobilier : parasol déporté 3m sur base lestée est excellent et très réaliste. Table acier + chaises empilables = crédible pro.
- Éclairage : lanternes LED au sol = bien. Mais sur un rooftop, les guirlandes sur câbles tendus entre des mâts sont une signature — plus distinctive.
- Dimensions globalement bien renseignées — c'est le style le plus solide techniquement.
- "preserve city view" est une excellente directive — elle évite que le modèle bouche la vue.

**Prompt amélioré (surface)**
`Rooftop outdoor: IPE hardwood deck planks 140mm wide silver-grey naturally weathered patina with stainless steel hidden fixings, deck laid parallel to the building facade, preserve existing parapet walls guard rails and city skyline exactly as in the input, open sky preserved as-is.`

**Prompt amélioré (furniture)**
`Rooftop furniture: L-shaped modular weatherproof sofa 220cm x 180cm in anthracite grey Sunbrella-type fabric with dark aluminium frame, large offset parasol 3m on weighted telescopic base in matt black, rectangular dining table 160x80cm in matt dark grey powder-coated steel with 4 stacking polypropylene outdoor chairs in charcoal, two floor lanterns 45cm in dark metal with LED pillar candles, two fibrecite rectangular planters 100x40cm with Stipa tenuissima grass 80cm tall, string lights 2200K on two freestanding stainless steel posts 2m tall along the parapet. Preserve city view — no furniture blocking the skyline.`

---

### 6. Cosy Balcon — 6.8/10

**Prompt actuel (surface)**
`Cosy balcony outdoor: warm wood composite deck planks 120mm in honey tone, preserve existing guard rails and balcony structure unchanged, no ceiling — open sky preserved as-is`

**Prompt actuel (furniture)**
`Cosy balcony furniture — COMPACT items only: round zinc bistro table 60cm, two folding metal chairs in matte black with small seat cushions in cream, one tall narrow planter 70cm with trailing ivy or string of pearls, battery LED string lights draped along the guard rail (not attached to wall), small ceramic lantern with candle on the table. Intimate minimal setup suited to a small balcony.`

**Observations Camille**
- C'est le prompt le plus cohérent et le mieux adapté à l'espace. La logique "compact items only" est bien ancrée.
- Sol : bois composite 120mm miel est précis. Bien.
- Végétal : "trailing ivy or string of pearls" — string of pearls est une plante d'intérieur, pas adaptée au balcon extérieur. Lierre oui, jasmin étoilé (Trachelospermum) serait encore mieux pour l'ambiance cosy.
- Mobilier : table zinc 60cm + chaises pliantes = parfait pour balcon. Très crédible.
- Éclairage : guirlandes LED sur garde-corps = signature cosy. Bien. "Not attached to wall" est une bonne précaution anti-hallucination.
- Manque : aucune indication de largeur de balcon — le sous-type "balcon" dans outdoor-subtypes.ts gère ça, mais le prompt style pourrait renforcer.

**Prompt amélioré (surface)**
`Cosy balcony outdoor: warm honey-toned wood composite deck planks 120mm wide with concealed aluminium fixings, clean matte finish, preserve existing guard rails and balcony structure and floor edges unchanged, open sky preserved as-is.`

**Prompt amélioré (furniture)**
`Cosy balcony furniture — COMPACT items only, suited to a narrow balcony: round zinc-top bistro table 60cm diameter, two folding metal chairs in matt black with small cream waterproof seat pads, one tall narrow planter 25x25x70cm with Trachelospermum jasminoides (star jasmine) trailing 40cm, one narrow planter 60x15cm along the guard rail with trailing Hedera helix (ivy), battery-powered warm white LED string lights 2200K draped along the guard rail inner edge, small ceramic lantern 15cm with unlit pillar candle on the table surface. Intimate, slightly lived-in atmosphere. Leave 60cm clear passage width.`

---

## Recommandations builders outdoor (route.ts)

### R1 — CRITIQUE : Échelle végétale conditionnelle

Le builder passe 2 outdoor ne contient aucune directive sur la hauteur des végétaux. Résultat probable : palmiers de 6m sur un balcon.

Ajouter dans `buildOutdoorFurnitureResponsesPrompt` et `buildOutdoorFurnitureFluxPrompt` :

`"Scale all plants to match the space: on a balcony or small terrace (under 15m2) no plant exceeds 120cm total height. On a garden or large terrace, potted trees must not exceed 200cm."`

### R2 — CRITIQUE : Textiles outdoor certifiés

Aucun builder ne précise la résistance intempéries des textiles. Ajouter dans `buildOutdoorFurnitureResponsesPrompt` :

`"All cushions, rugs, and textiles must be outdoor-rated weather-resistant (Sunbrella-type acrylic or waterproof polyester). No indoor fabric textures."`

### R3 — HAUTE : Éclairage éteint en conditions diurnes

Les lanternes et guirlandes sont générées allumées même en plein soleil. Ajouter dans `buildOutdoorFurnitureResponsesPrompt` :

`"Lanterns and string lights are present but unlit — it is a daytime shot. No glowing bulbs, no visible flames in daylight."`

### R4 — HAUTE : Négatif outdoor — végétaux d'intérieur

Ajouter au `OUTDOOR_NEGATIVE_PROMPT` existant : `"monstera outdoors, fiddle-leaf fig outdoors, snake plant outdoors, string of pearls outdoors"`.

### R5 — MOYENNE : Passe 1 outdoor — joints et ressauts

Ajouter dans `buildOutdoorSurfacesResponsesPrompt` : `"Preserve all expansion joints, step nosings, level changes, and threshold transitions in the ground surface."`

### R6 — MOYENNE : 2 styles manquants à créer

- **Provençal** : cyprès columnaires, lavande en masse, fontaine murale, pierre de Cassis — très demandé par les agences immobilières du Sud
- **Industriel-Urbain** : bacs acier galvanisé, béton brut, plantes grasses, mobilier métal soudé — adapté aux cours et patios urbains

---

## Score global

| Dimension | Note /10 |
|---|---|
| Précision végétale (espèces, échelle) | 4.5 |
| Précision matériaux sol | 6.5 |
| Crédibilité mobilier outdoor | 6.5 |
| Dimensions et proportions | 6.5 |
| Éclairage (logique jour/nuit) | 5.0 |
| Ambiance et cohérence stylistique | 6.8 |
| Qualité des builders outdoor | 7.0 |
| Négatifs outdoor | 6.0 |

**Score global : 6.1 / 10**

La structure pipeline est solide — séparation passe 1/passe 2, preservation ciel, garde-corps, absence de plafond : tout ça est bien pensé. Les points faibles sont le vocabulaire végétal (risque d'espèces d'intérieur en extérieur, absence d'échelle), l'éclairage diurne non géré pour les éléments lumineux, et deux styles archétypaux manquants.

---

**Handoff → @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/outdoor-prompt-audit-camille.md`
- Décisions prises : audit statique 6 styles outdoor + builders route.ts, prompts améliorés proposés pour chaque style, 6 recommandations builders
- Points d'attention :
  - R1 (échelle végétale) et R2 (textiles outdoor) sont CRITIQUES — à intégrer dans builders avant prochaines générations
  - Végétaux d'intérieur dans styles extérieurs (monstera, string of pearls) = erreur crédibilité pro
  - 2 styles manquants identifiés : Provençal et Industriel-Urbain
  - Prompts améliorés prêts à copier dans lib/outdoor-styles.ts sans modification d'architecture
