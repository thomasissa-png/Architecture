# Re-audit Paysagiste — Prompts Extérieurs V2 — Camille Verdier — 25 mars 2026

## Tableau des notes par style — V1 → V2

| Style | Note V1 | Note V2 | Delta | Commentaire |
|---|---|---|---|---|
| Contemporain Outdoor | 6.0 | 8.2 | +2.2 | Stipa + Calamagrostis corrects, béton précis, uplights encastrés |
| Méditerranéen | 5.7 | 8.0 | +2.3 | Oliviers 150cm dans pots 90cm : physiologiquement crédible maintenant |
| Bohème Garden | 6.2 | 7.5 | +1.3 | Rudbeckia + Heuchera à la place de monstera : bien. Nephrolepis reste fragile (mi-ombre) |
| Minimaliste Urbain | 5.8 | 8.1 | +2.3 | Béton brossé 90x90, Stipa gigantea nommée, uplights flush = cohérence pro |
| Rooftop | 6.7 | 8.6 | +1.9 | Stipa remplace bambou instable, guirlandes sur mâts acier = signature rooftop |
| Cosy Balcon | 6.8 | 8.8 | +2.0 | Trachelospermum + Hedera : espèces correctes, passage 60cm préservé |

**Score global V2 : 8.2 / 10** (V1 : 6.1 / 10 — delta +2.1)

---

## Les 4 problèmes critiques V1 — état de résolution

### R1 — Échelle végétale conditionnelle CRITIQUE — RÉSOLU
Directive ajoutée dans `buildOutdoorFurnitureResponsesPrompt` et `buildOutdoorFurnitureFluxPrompt` :
"Scale all plants to match the space: on a balcony or small terrace (under 15m2) no plant exceeds 120cm total height. On a garden or large terrace, potted trees must not exceed 200cm."
Résolution complète. Conditionnelle = neutre sur les grands espaces.

### R2 — Textiles outdoor certifiés CRITIQUE — RÉSOLU
Directive intégrée dans les deux builders passe 2 outdoor :
"All cushions, rugs, and textiles must be outdoor-rated weather-resistant (Sunbrella-type acrylic or waterproof polyester). No indoor fabric textures."
Résolution complète. La mention Sunbrella-type est précise — le modèle la comprend.

### R3 — Éclairage éteint en conditions diurnes HAUTE — RÉSOLU
Directive présente dans les deux builders :
"All lighting fixtures must be OFF if the scene is in daylight — unlit lanterns, unlit string lights, no glowing bulbs, no visible flames."
Chaque furniturePrompt de style ajoute "(unlit daytime)" en fin d'élément lumineux. Double ancrage = robuste.

### R4 — Végétaux d'intérieur — négatif outdoor HAUTE — RÉSOLU
`OUTDOOR_NEGATIVE_PROMPT` complété : "monstera outdoors, fiddle-leaf fig outdoors, snake plant outdoors, string of pearls outdoors".
Les styles ont été corrigés à la source (Stipa, Calamagrostis, Trachelospermum, Hedera, Heuchera, Rudbeckia).
Résolution à deux niveaux : styles propres + filet de sécurité négatif.

---

## Frictions restantes pour atteindre 9/10

### F1 — Bohème Garden : Nephrolepis (Boston fern) en extérieur — MAJEUR
"Potted Nephrolepis (Boston fern)" figure dans le furniturePrompt. La fougère de Boston est une plante d'appartement — craint le gel, l'exposition directe et le vent. Pour un jardin bohème extérieur, remplacer par Dryopteris filix-mas (fougère mâle rustique) ou Polystichum setiferum — mêmes formes, plein air réel.

### F2 — Bohème Garden : rug outdoor sans épaisseur précisée — MINEUR
"Outdoor flat-weave cotton rug 160x230cm" — le coton extérieur se tache rapidement. Préférer "outdoor flat-weave polypropylene rug" pour cohérence avec la directive textiles outdoor-rated du builder.

### F3 — Builder passe 1 outdoor : murs et façades chauds — MINEUR
La directive "Keep the existing wall color and texture — do not warm, smooth, or repaint walls" est présente mais ne nomme pas le risque de color shift. Ajouter "Maintain exact wall color temperature — do not warm or cool the facade tone" (calque du pattern Sprint 18 passe 1 intérieur).

### F4 — 2 styles archétypaux toujours absents — RECOMMANDATION
Provençal (cyprès, lavande, fontaine murale, pierre de Cassis) et Industriel-Urbain (bacs acier galvanisé, béton brut, plantes grasses) représentent un manque commercial réel pour les agences du Sud et les cours d'immeuble haussmannien. Aucune correction V2 n'a adressé ce point.

---

**Handoff → @orchestrator**
- Fichiers lus : `/home/user/Architecture/lib/outdoor-styles.ts`, `/home/user/Architecture/app/api/generate/route.ts` (builders outdoor)
- Fichier produit : `/home/user/Architecture/docs/reviews/outdoor-reaudit-camille-v2.md`
- Décisions : score V2 8.2/10, 4 critiques V1 résolus, 2 frictions majeures/mineures résiduelles (Nephrolepis, coton rug), PROMPT_VERSION v19 confirmé
- Points d'attention : F1 (Nephrolepis) à corriger dans outdoor-styles.ts boheme_garden avant prochaine génération — risque crédibilité identique à monstera V1
