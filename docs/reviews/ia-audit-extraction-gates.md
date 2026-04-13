# Audit IA - plan-extractor.ts (prompt, sanitize, gates, retry)

**Agent** : @ia | **Date** : 2026-04-13 | **Fichier** : `lib/marchand/plan-extractor.ts`

---

## 1. Prompt GPT (buildSystemPrompt) -- 8.5/10

**Points forts** : structure STEP 1-6 claire, priority order pour les surfaces (ecrit > calcul > estimation), sanity check par type de piece, self-review obligatoire, structured output JSON Schema strict.

**Faiblesses identifiees** :

- **F1 (P0) -- Pas d'ancrage d'echelle explicite pour les bounding boxes.** Le prompt dit "trace the walls" mais GPT-4.1 vision ne sait pas ou sont les murs si le plan est un scan basse resolution ou un croquis a main levee. Il manque une instruction : "use the TITLE BLOCK or BORDER of the plan as 0%/100% reference". Sans cela, les bbox derivent de 10-20% sur les scans avec marges inegales.

- **F2 (P1) -- Le sanity check plafonne a 200m2/floor et 60m2/room.** Un loft ou un plateau commercial depasse facilement ces seuils. Le `typeBien` est passe mais jamais utilise pour ajuster les plafonds (un "immeuble" peut avoir des plateaux de 300m2).

- **F3 (P1) -- Absence de directive sur les unites ambigues.** Les plans francais ecrivent parfois "4,50" (metres) ou "450" (cm) pour la meme dimension. Le prompt dit "if > 50, divide by 100" mais ne couvre pas le cas "4.50" lu comme "450" par OCR (point decimal manque).

## 2. sanitizeSurfaces() -- 7/10

**Detection 10x (Fix 0)** : utilise la mediane > 50m2 comme signal. Robuste sur les cas classiques (toutes les surfaces 10x trop grandes). Mais :

- **F4 (P0) -- Faux positifs sur grands logements legaux.** Un T5 de 120m2 avec salon 45m2, 3 chambres 18m2, cuisine 20m2 a une mediane de ~20m2 : OK. Mais un loft avec 1 piece de 80m2 + 1 SDB de 5m2 a une mediane de 42.5m2 : OK aussi. Le seuil 50 est correct pour le residentiel standard. **Risque reel** : un plan avec 3 pieces de 55m2 (plateau commercial) sera divise par 10 a tort. Le `typeBien` devrait moduler le seuil (50 pour appartement, 150 pour immeuble/commerce).

- **F5 (P1) -- Math incorrecte sur les dimensions apres /10.** Ligne 399 : `Math.round(room.dimensions.length_m * 100 / Math.sqrt(10)) / 100`. Si la surface est /10, les dimensions devraient etre /sqrt(10) (~3.16). Le calcul est `* 100 / sqrt(10) / 100` = `/ sqrt(10)`. Correct mathematiquement, mais la formule est illisible. Et surtout elle suppose que L et W sont egalement faux, ce qui n'est pas toujours le cas (une seule dimension peut etre mal lue).

- **F6 (P1) -- Cap a 80m2 destructif.** Ligne 433 : `surface_m2 = null`. Detruire la surface au lieu de la marquer suspecte empeche tout recours utilisateur. Mieux : capper a 80 et mettre confidence = 0.2 + ajouter un warning.

## 3. validateExtraction() -- 7.5/10

**Gates couvertes** : surfaces aberrantes (G1), total incoherent (G2), bbox hors limites (G3), bbox vides (G4), proportionnalite bbox/surface (G5), minimum 2 pieces (G6), doublons (G7). Bonne couverture.

**Gates manquantes** :

- **F7 (P0) -- Pas de gate sur le chevauchement des bbox.** Le prompt dit "never overlapping" mais aucune gate ne le verifie. GPT genere frequemment des bbox qui se superposent a 30-50%. C'est le bug le plus visible pour l'utilisateur (pieces empilees sur le plan).

- **F8 (P1) -- Pas de gate sur la couverture du plan.** Si toutes les bbox couvrent seulement 20% de l'image (toutes concentrees en haut a gauche), c'est un echec d'extraction. Gate manquante : union des bbox >= 40% de l'image.

- **F9 (P1) -- Pas de gate sur la coherence surface/bbox individuelle.** G5 compare le min/max global, mais ne detecte pas un salon de 40m2 avec une bbox de 2% et un WC de 3m2 avec une bbox de 15%. Il faut un check piece par piece.

## 4. Retry -- 5/10

- **F10 (P0) -- Le retry est aveugle.** `route.ts` ligne 186 relance `extractMultiplePlans` avec exactement le meme prompt. GPT-4.1 est deterministe a temperature basse avec structured output -- le retry produit souvent le meme resultat. Le prompt de retry DOIT inclure les erreurs detectees : "Your previous extraction had these issues: [G1 FAIL: salon 258m2, G3 FAIL: 2 rooms out of bounds]. Fix these specific problems."

- **F11 (P1) -- Un seul retry.** Sur les plans complexes (scans basse resolution, croquis), 2 retries avec prompt enrichi progressif seraient justifies (1er retry = erreurs specifiques, 2eme retry = simplification "ignore small rooms, focus on main spaces").

## Score global : 7.5/10

**Verdict** : < 9.5, recommandations concretes ci-dessous.

## Diffs recommandes

### Diff 1 -- F7 : Gate chevauchement bbox (P0)

```typescript
// Ajouter apres GATE 7 dans validateExtraction()
// GATE 8 — No significant bbox overlap between rooms
let overlaps = 0;
for (let i = 0; i < data.rooms.length; i++) {
  for (let j = i + 1; j < data.rooms.length; j++) {
    const a = data.rooms[i].bounding_box;
    const b = data.rooms[j].bounding_box;
    if (!a || !b) continue;
    const overlapX = Math.max(0, Math.min(a.x_percent + a.width_percent, b.x_percent + b.width_percent) - Math.max(a.x_percent, b.x_percent));
    const overlapY = Math.max(0, Math.min(a.y_percent + a.height_percent, b.y_percent + b.height_percent) - Math.max(a.y_percent, b.y_percent));
    const overlapArea = overlapX * overlapY;
    const smallerArea = Math.min(a.width_percent * a.height_percent, b.width_percent * b.height_percent);
    if (smallerArea > 0 && overlapArea / smallerArea > 0.3) overlaps++;
  }
}
gates.push({
  id: "G8_NO_OVERLAP",
  label: "Pas de chevauchement significatif entre pieces",
  passed: overlaps === 0,
  detail: overlaps > 0 ? `${overlaps} paire(s) de pieces se chevauchent (>30%)` : undefined,
});
```

### Diff 2 -- F10 : Retry avec contexte d'erreur (P0)

Dans `route.ts`, remplacer le retry aveugle par un appel avec prompt enrichi. Le plus simple : exporter une variante `extractPlanDataWithHints()` qui ajoute un message user supplementaire listant les gates en echec.

### Diff 3 -- F4 : Seuil 10x conditionnel au typeBien (P1)

```typescript
// Dans sanitizeSurfaces(), remplacer le seuil fixe 50 par :
const medianThreshold = typeBien === "immeuble" || typeBien === "commerce" ? 150 : 50;
if (median > medianThreshold) { ... }
```
Necessite de passer `typeBien` a `sanitizeSurfaces()`.

---

**Handoff -> @fullstack**
- Fichier audite : `lib/marchand/plan-extractor.ts`
- P0 : F7 (gate overlap bbox) + F10 (retry avec contexte)
- P1 : F4 (seuil typeBien), F6 (cap non-destructif), F8 (couverture plan), F9 (coherence individuelle)
- Le code dans `app/api/pro/projects/[id]/extract/route.ts` doit etre modifie pour le retry contextuel (passer les gates en echec au prompt)
