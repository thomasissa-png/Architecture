# F3 Outdoor Prompts — Recommandations Yann Duval + Lucas Moreau

## 1. Les 6 styles outdoor

### Contemporain Outdoor
- **surfacePrompt**: "Contemporary outdoor: large-format smooth grey concrete pavers 60x60cm with narrow joints, preserve all existing guard rails and exterior walls unchanged, no ceiling — open sky preserved as-is"
- **furniturePrompt**: "Contemporary outdoor furniture: modular L-shaped outdoor sofa 240cm in charcoal weather-resistant fabric with aluminium frame, rectangular tempered glass coffee table 100x60cm on black steel legs, two LED ground lanterns 30cm tall flanking the seating area, single tall architectural planter 80cm with clipped boxwood sphere, neutral outdoor cushions in graphite and off-white. Clean geometric layout, no clutter."

### Méditerranéen
- **surfacePrompt**: "Mediterranean outdoor: natural stone or warm terracotta floor tiles with aged patina, preserve all existing walls facades and guard rails unchanged, no ceiling — open sky preserved as-is"
- **furniturePrompt**: "Mediterranean outdoor furniture: round wrought-iron table 120cm in antique white with matching 4 bistro chairs, two large terracotta pots 50cm with olive trees, ceramic lanterns with candles on the table, linen table runner in natural ecru, small herb pots (rosemary, lavender) along the wall edge. Warm convivial atmosphere with natural materials."

### Bohème Garden
- **surfacePrompt**: "Bohemian garden outdoor: reclaimed irregular stone pavers with white gravel borders, preserve all existing vegetation walls and fences unchanged, no ceiling — open sky preserved as-is"
- **furniturePrompt**: "Bohemian garden furniture: two round waterproof floor poufs 50cm in terracotta and mustard, low pallet-style coffee table 90x60cm with weathered wood finish, outdoor jute rug 160x230cm, three hanging macrame plant holders on a freestanding wooden rack 180cm tall, potted tropical plants (monstera, fern) in woven baskets, battery-powered string lights draped loosely on the rack. Relaxed layered eclectic atmosphere."

### Minimaliste Urbain
- **surfacePrompt**: "Minimalist urban outdoor: smooth polished concrete floor with millimetric joints in light grey, preserve all existing guard rails walls and facades unchanged, no ceiling — open sky preserved as-is"
- **furniturePrompt**: "Minimalist urban outdoor furniture: two teak sun loungers 190cm with clean straight lines and light grey cushions, low rectangular concrete-fibre coffee table 80x40cm, one tall concrete planter 90cm with single ornamental grass (Miscanthus), no decorative objects, no textiles beyond cushions. Strict geometric arrangement, generous empty floor space."

### Rooftop
- **surfacePrompt**: "Rooftop outdoor: IPE wood deck planks silver-grey patina 140mm wide, preserve existing parapet walls guard rails and skyline exactly as in the input, no ceiling — open sky preserved as-is"
- **furniturePrompt**: "Rooftop furniture: modular weatherproof banquette 200cm in charcoal grey with deep seat cushions, large parasol 3m deported on weighted base in matte black, rectangular dining table 160cm in powder-coated dark steel with 4 stacking outdoor chairs, two floor lanterns 40cm with LED candles, single potted bamboo 150cm in dark grey fibrecite planter. Urban lounge atmosphere, preserve city view."

### Cosy Balcon
- **surfacePrompt**: "Cosy balcony outdoor: warm wood composite deck planks 120mm in honey tone, preserve existing guard rails and balcony structure unchanged, no ceiling — open sky preserved as-is"
- **furniturePrompt**: "Cosy balcony furniture — COMPACT items only: round zinc bistro table 60cm, two folding metal chairs in matte black with small seat cushions in cream, one tall narrow planter 70cm with trailing ivy or string of pearls, battery LED string lights draped along the guard rail (not attached to wall), small ceramic lantern with candle on the table. Intimate minimal setup suited to a small balcony."

---

## 2. Les 5 sous-types extérieur — overrides

### Terrasse
- **subtypeSurfaceOverride**: "Attached terrace with hard-surface ground — preserve house facade and any steps or level changes."
- **subtypeFurnitureOverride**: "" (pas d'override — le style suffit)
- **subtypeNegativeOverride**: "lawn, grass, garden path"

### Balcon
- **subtypeSurfaceOverride**: "Enclosed balcony with existing guard rail — preserve all railings and balcony edges exactly."
- **subtypeFurnitureOverride**: "Compact furniture only — bistro table 60cm max, folding chairs, no large garden sets, no sun loungers, no parasol wider than 180cm."
- **subtypeNegativeOverride**: "large sofa, sun lounger, large parasol, garden set"

### Patio
- **subtypeSurfaceOverride**: "Enclosed outdoor patio space with partial shade — preserve any existing surrounding walls, arches, columns, and overhead beams."
- **subtypeFurnitureOverride**: "" (le style suffit)
- **subtypeNegativeOverride**: "lawn, grass, open sky horizon"

### Jardin
- **subtypeSurfaceOverride**: "Garden with natural ground — preserve all existing trees, grass, hedges and background vegetation. Only update the ground surface in the foreground seating zone."
- **subtypeFurnitureOverride**: "Place furniture in the foreground only — do not alter background vegetation or tree line."
- **subtypeNegativeOverride**: "paved floor, concrete, wooden deck (unless already present)"

### Rooftop
- **subtypeSurfaceOverride**: "Rooftop terrace — preserve skyline, horizon line, parapet walls and guard rails exactly as in the input. Do not invent new railings or barriers."
- **subtypeFurnitureOverride**: "" (le style Rooftop couvre déjà)
- **subtypeNegativeOverride**: "lawn, garden path, trees (unless already present)"

---

## 3. Builders outdoor — recommandations

### buildOutdoorSurfacesPrompt(surfacePrompt, subtypeOverride)
Structure :
1. "Edit this outdoor photo. Keep exact same camera angle, lens distortion, vanishing points."
2. "Open-air space — no ceiling, sky preserved as-is. Preserve highlights — do not recover blown-out sky."
3. "{surfacePrompt}" (style surface)
4. "{subtypeOverride}" (sous-type surface)
5. "Preserve all existing guard rails, exterior walls, facades, gates and fences. Do not add or remove any vertical structure."
6. "Preserve existing vegetation in the background. Only modify ground surface in the foreground zone."
7. "No furniture in this pass — EMPTY outdoor space with finished ground only."
8. "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting."

### buildOutdoorFurniturePrompt(furniturePrompt, subtypeOverride)
Structure :
1. "Add outdoor furniture and decoration to this photo of a finished outdoor space."
2. "{furniturePrompt}" (style furniture)
3. "{subtypeOverride}" (sous-type furniture)
4. "Distribute furniture naturally across the available floor space. If space is large, create a primary seating group and a secondary accent further back."
5. "Ground surfaces are LOCKED — same material, color, texture. Guard rails, walls, facades unchanged."
6. "Every piece must cast realistic shadows consistent with the existing natural light direction."
7. "DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting."

### OUTDOOR_NEGATIVE_PROMPT
"indoor sofa, area rug, floor lamp, ceiling light, chandelier, curtains, drapes, wallpaper, baseboard, interior door, radiator, electrical outlet, kitchen appliances, ceiling, roof, indoor plant pot on parquet, distorted perspective, fisheye, stretched walls, cartoon, illustration, 3D render, CGI, watermark, text, blurry"

---

## 4. Intégration F1 itérations outdoor

- Pass1Meta doit stocker `isOutdoor: true` et `outdoorSubtype: string`
- Les builders d'itération outdoor utilisent `buildIterationOutdoorFurnitureResponsesPrompt()` et `buildIterationOutdoorFurnitureFluxPrompt()` dédiés
- Même logique que l'intérieur : modifications EN PREMIER, cumul, surfaces LOCKED
- Exception : pas de directive plafond/luminaire dans les contraintes de lock
- Remplacer "Room structure is LOCKED — walls, floor, ceiling" par "Ground surface and vertical structures are LOCKED — guard rails, walls, facades"
