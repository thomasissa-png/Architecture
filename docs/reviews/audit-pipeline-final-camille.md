# Audit Final Pipeline Outdoor — Camille Verdier, v48

**Date** : 4 avril 2026 | **Fichiers audites** : generation-pipeline.ts, outdoor-styles.ts, outdoor-subtypes.ts, iteration-prompt.ts

## 1. PASS1/PASS2 PREAMBLE outdoor

Les builders outdoor (`buildOutdoorSurfacesResponsesPrompt`, `buildOutdoorFurnitureResponsesPrompt`) n'utilisent PAS les constantes indoor PASS1_PREAMBLE / PASS2_PREAMBLE. Ils ont leurs propres phrases d'ouverture adaptees : "Edit this exact outdoor photo. Preserve exactly: the space geometry..." (passe 1) et "Edit this outdoor photo. Keep all ground surfaces..." (passe 2). C'est CORRECT — les preambles indoor mentionnent "room geometry, ceiling shape, wall layout" qui n'ont aucun sens en exterieur. Les constantes CEILING_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, EQUIPMENT_PRESERVATION, ANTI_FENETRE ne sont pas injectees dans les builders outdoor. Propre.

## 2. "No ceiling" en passe 2

Present explicitement : "Open-air space — no ceiling." (ligne 545). Egalement present en passe 1 : "Open-air space — no ceiling, sky preserved as-is." (ligne 520). Parfait.

## 3. "Outdoor plants only"

Present en passe 2 : "Outdoor plants only — no houseplants (no monstera, no fiddle leaf, no pothos)." (ligne 549). Les 8 styles utilisent des vegetaux credibles : Stipa tenuissima, Calamagrostis, Olea europaea, Lavandula, Rosmarinus, Trachelospermum, Hedera helix, Pelargonium, Sedum, Sempervivum. Aucune plante d'interieur detectee. Excellent.

## 4. "choose one:" + resolveChooseOne

La fonction `resolveChooseOne` (ligne 332) est appelee dans `buildOutdoorFurnitureResponsesPrompt` (ligne 543). Les 8 styles utilisent massivement le pattern "(choose one: ...)" — en moyenne 5-7 alternatives par style. Le regex `\(choose one:\s*([^)]+)\)` fonctionne correctement. La variete entre generations est assuree. Valide.

## 5. Compositing : facades, garde-corps

Passe 1 : "Preserve all existing guard rails, exterior walls, facades, gates and fences." (ligne 525). Passe 2 : "Keep all ground surfaces, guard rails, walls, facades, and sky unchanged." (ligne 545). Les subtypes renforcent : balcon ajoute "preserve all railings and balcony edges exactly", rooftop ajoute "preserve skyline, horizon line, parapet walls and guard rails". Les vitrages de facade ne sont pas mentionnes explicitement — un risque mineur sur les terrasses attenantes avec baies vitrees.

## 6. Materiaux outdoor — credibilite

- **Sol** : beton 60x60, terracotta 30x30, gres irregulier, calcaire, IPE, composite — tous credibles exterieur.
- **Mobilier** : aluminium, acier galvanise, corten, teck, fer forge — resistance UV/intemperies OK.
- **Textiles** : "Sunbrella" (contemporain), "outdoor-rated" (directive builder), polypropylene (provencal, boheme) — credible. Manque la mention "déperlant" sur les coussins du style Cosy Balcon.
- **Eclairage** : "unlit daytime" present dans les 8 styles — regle anti-artefact IA respectee.

## 7. Note globale et top 3 ameliorations

**Note : 8.5 / 10** — Pipeline outdoor solide, bien decorrele de l'indoor, variete stylistique riche.

| Priorite | Amelioration |
|----------|-------------|
| P1 | Ajouter "Preserve glass doors, sliding bays, and facade glazing" dans le builder passe 1 outdoor — les baies vitrees de facade sont un angle mort actuel. |
| P1 | Ajouter "waterproof polyester" ou "deperlant" aux coussins du style Cosy Balcon — seul style sans mention textile outdoor explicite dans le furniturePrompt. |
| P2 | L'iteration outdoor (`buildIterationOutdoorFurnitureResponsesPrompt`) n'appelle pas `resolveChooseOne` — si le prompt d'iteration contient des "choose one:" herites, ils seront envoyes bruts au modele. Ajouter l'appel. |
