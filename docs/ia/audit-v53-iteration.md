# Audit Prompts Passe 1 v53 — Notation et Fixes

**Date** : 2026-04-05 | **Agent** : @ia | **Version** : v53

## Constantes v53 analysees

```
PASS1_PREAMBLE_V53 (~48 mots) : "Edit this photo. Keep exact room geometry..."
PRESERVATION_V53 (~44 mots) : "Ceiling: keep every bump... Columns... Slab edges..."
CLEANUP_V53 (~39 mots) : "Remove loose construction... Keep fixed equipment... Room stays EMPTY"
DSLR_LINE (~14 mots) : "DSLR wide-angle, sharp focus..."
```

Total builder generique (sans surfacePrompt) : ~145 mots constants + ~30-40 mots surfacePrompt = ~180 mots. EXCELLENT. Objectif 220 atteint avec marge.

## Notation critere par critere

### 1. Concision (x2) — 9/10
~180 mots au lieu de ~663. Chaque phrase porte une information distincte. Un seul doute : "typically 25-40cm for concrete" et "typically 20-25cm" dans PRESERVATION_V53 ajoutent ~10 mots de dimensions que le modele ne peut pas verifier sur une photo. Le modele voit des pixels, pas des centimetres.

**Fix** : retirer les dimensions typiques (le modele preserve ce qu'il voit, pas ce qu'il mesure).
```
ANCIEN: "Columns and posts: keep full width (typically 25-40cm for concrete). Slab edges: keep full thickness (typically 20-25cm)."
NOUVEAU: "Columns and posts: keep full width. Slab edges: keep full thickness."
```

### 2. Ordre tokens (x3) — 8/10
PASS1_PREAMBLE_V53 en premier = structure lock. Bon. MAIS : le PREAMBLE commence par "Edit this photo" (action) avant la preservation. Pour gpt-image-1.5, la preservation doit etre le PREMIER concept (cf. commentaire l.194-196 du code : "preservation is stated FIRST"). "Edit" active le mode creatif avant que la contrainte n'arrive.

**Fix** : inverser — preservation PUIS action.
```
ANCIEN PREAMBLE: "Edit this photo. Keep exact room geometry, camera angle, all windows and doors (count and positions), wall layout, ceiling shape, room dimensions — FIXED, no stretch."
NOUVEAU PREAMBLE: "Keep exact room geometry, camera angle, all windows and doors (count and positions), wall layout, ceiling shape, room dimensions — FIXED, no stretch. Edit surfaces only:"
```

### 3. Clarete (x2) — 8/10
"Room stays COMPLETELY EMPTY" dans CLEANUP_V53 est clair mais "no bathroom elements" est ambigu — une baignoire existante est-elle un "bathroom element" a supprimer ou un equipement fixe a preserver ? Contradiction avec "Keep all fixed equipment in place" juste avant.

**Fix** :
```
ANCIEN: "Room stays COMPLETELY EMPTY — no furniture, no fixtures, no bathroom elements."
NOUVEAU: "Room stays COMPLETELY EMPTY — no furniture, no new fixtures. Existing built-in fixtures (bathtub, shower, toilet, sink) stay."
```

### 4. Completude (x2) — 7/10
Manques identifies :
- **Fenetres/portes** : PASS1_PREAMBLE_V53 dit "all windows and doors" mais pas le comptage EXACT (la constante ANTI_FENETRE v51 avait "EXACT same count"). En v53 c'est dilue.
- **Moulures** : aucune mention. Sur du Haussmannien avec corniches, le modele peut les lisser.
- **Mur accent** : present dans le builder bedroom et fallback ("if one accent wall exists") mais ABSENT du builder kitchen et bathroom. Une cuisine peut avoir un mur accent.

**Fix PREAMBLE** (renforcer comptage) :
```
AJOUTER en fin de PREAMBLE: "EXACT same count of windows and doors at same positions."
```

**Fix PRESERVATION** (moulures) :
```
AJOUTER en fin de PRESERVATION: "Mouldings, cornices, and decorative trims: keep shape and position, paint over."
```

**Fix kitchen/bathroom** : ajouter la ligne accent wall dans ces builders.

### 5. Coherence P1→P2 (x1) — 9/10
PASS2_PREAMBLE dit "wall colors, floor material, and ceiling finish are final — keep them unchanged". Coherent avec le fait que P1 les a poses. Le seul risque : CLEANUP_V53 dit "no bathroom elements" ce qui pourrait supprimer une baignoire que P2 s'attend a trouver (corrige par le fix clarete ci-dessus).

## Note globale ponderee

| Critere | Poids | Note | Score |
|---|---|---|---|
| Concision | x2 | 9 | 18 |
| Ordre tokens | x3 | 8 | 24 |
| Clarete | x2 | 8 | 16 |
| Completude | x2 | 7 | 14 |
| Coherence P1-P2 | x1 | 9 | 9 |
| **Total** | **x10** | | **81/100 = 8.1/10** |

## Resume des fixes (ordre de priorite)

1. **P0** : Inverser PREAMBLE — preservation AVANT "Edit" (poids x3, gain +1pt)
2. **P0** : Clarifier "no bathroom elements" → "existing built-in fixtures stay" (evite suppression baignoire)
3. **P1** : Ajouter "EXACT same count" pour fenetres/portes dans PREAMBLE
4. **P1** : Ajouter moulures/corniches dans PRESERVATION_V53
5. **P2** : Retirer dimensions cm des poteaux/dalles (le modele voit des pixels)
6. **P2** : Propager "accent wall" dans kitchen et bathroom builders
