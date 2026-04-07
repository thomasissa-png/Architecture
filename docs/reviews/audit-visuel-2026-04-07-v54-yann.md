# Audit visuel Versimo — Pipeline v54 (session 35)

**Auditeur :** Yann Duval — Architecte d'intérieur
**Date :** 2026-04-07
**Modèle audité :** gpt-image-1.5 (Responses API, input_fidelity high)
**Cible fondateur :** 9.5/10 minimum
**Score précédent (session 33) :** 8.2/10

---

## Score global moyen pondéré : **7.35 / 10** — NO-GO v54

On progresse sur la passe 1 (vraie maîtrise des finitions sur chantier brut), mais la passe 2 trahit deux défauts structurels : **une dérive d'angle/cadrage** systématique et un **bug de propagation room_type** (Pipeline B) qui disqualifie le livrable pour un professionnel. À 7.35, on est sous la barre fondateur de 2.15 points — il faut itérer.

## Tableau récapitulatif

| Gen | Style / Pièce | Préserv. spatiale ×3 | Fidélité ×2 | Crédib. pro ×2 | **Global /10** | Verdict |
|---|---|---|---|---|---|---|
| A — Med. bedroom (#193→#195) | 6.0 | 8.5 | 8 | **7.64** | NO-GO |
| B — Contemp. dining (#192→#196) | 4.5 | 3.0 | 2 | **5.00 (CAP)** | NO-GO P0 |
| C — Scand. LR pass1 (#194) | 7.5 | 8 | 8 | **7.86** | GO conditionnel |
| D — Art Deco pass2 (#191) | 9.0 | 9 | 8.5 | **8.93** | GO quasi-cible |

---

## Détail par génération

### Génération A — Mediterranean / bedroom_adults (#193 pass1 + #195 pass2) — 7.64/10

**Préservation spatiale : 6.0/10 — ALERTE**
Le cadrage a été resserré significativement entre input et pass1. **Le modèle a inventé un plafond à caissons** alors que l'input est en plaques de BA13 avec câbles pendants. C'est une fabrication, pas une finition. Le décrochement mural au fond a été modifié, le pilier d'angle central repositionné. Angle de vue tilté vers le bas dans pass1 vs input plus frontal.

**Fidélité stylistique : 8.5/10**
Lanterne wrought iron correcte, terre cuite au sol convaincante, enduit chaulé crédible. Bon Méditerranéen version Ibiza/Luberon.

**Crédibilité pro : 8/10**
Résultat final (#195) vendable à Claire — mobilier cohérent, échelle correcte. Mais un architecte verra le plafond inventé.

**Défauts P0 :**
1. **Plafond à caissons hallucinés** (pass1) : le prompt "preserving any vault beams or structural ribs — if beams are visible whitewash them" est AMORÇANT — le modèle lit "beams" et en crée.
2. **Recadrage 4:3 → 3:2** : déformation du ratio.
3. Ombre portée du lit trop molle à gauche.

**Fix surface_prompt Mediterranean :** voir Synthèse ci-dessous.

---

### Génération B — Contemporary / dining_room (#192 pass1 + #196 pass2) — **5.00 BUG P0**

**Préservation spatiale : 4.5/10 — ALERTE ROUGE**
L'input brut montre un loft industriel béton brut avec mezzanine et baies vitrées. Le pass1 a préservé la géométrie générale mais avec un **artefact de fusion grave au centre** (zone floue, poutres bois résiduelles, overlay semi-transparent). L'output final a encore modifié l'angle, le mur de droite est devenu un **passage ouvert vers une autre pièce** — élément architectural inventé.

**Fidélité stylistique : 3.0/10**
**BUG CLIENT CONFIRMÉ — ce n'est PAS une salle à manger.** L'output livre un **salon** complet : canapé courbe 4 places, table basse ronde travertin cannelé, fauteuil cantilever cuir noir, lampadaire Serge Mouille, crédence noyer. La table à manger avec 6 chaises n'apparaît QUE au fond (élément secondaire mini, presque invisible).

**Cause racine :** le `furniture_prompt` concatène la description dining_room PUIS un bloc `STYLE OVERRIDE` (architect's living room balancing warmth and rigor) qui est plus détaillé et plus long → le modèle tranche pour le bloc OVERRIDE. **Bug de propagation côté client**, à remonter à @fullstack.

**Crédibilité pro : 2/10**
Un architecte qui demande "salle à manger" et reçoit un salon ferme l'app immédiatement. Note plafonnée à 5.0/10 par la règle préservation spatiale.

**Défauts P0 :**
1. **Bug client propagation room_type → @fullstack P0**
2. Artefact fusion pass1 (zone centrale floue avec poutres fantômes)
3. Mur de droite hallucine un passage architectural

---

### Génération C — Scandinavian / living_room (#194 pass1 seule) — 7.86/10

**Préservation spatiale : 7.5/10**
Mezzanine, hauteur sous plafond, baies vitrées à la française, poutre apparente : tout est préservé. Angle identique. **Halo flou en bas à droite** (overlay de l'input qui fuit dans l'output — même problème que #192 sur les zones très surexposées).

**Fidélité / qualité surfaces : 8/10**
- Murs blancs doux : OK, luminosité préservée
- Sol chêne blanchi wide-plank : très correct, grain visible
- **Luminaire PH5-style : présent, bien formé, bien positionné. Enfin.** C'est le meilleur PH5 qu'on ait vu (validation Sprint 16b).

**Défauts :**
1. Halo flou baies vitrées surexposées
2. Moellons béton de la poutre mezzanine partiellement lissés
3. Poteau béton gauche a perdu ses imperfections (patine, coulures)

---

### Génération D — Art Deco / bedroom_adults (#191 pass2 seule) — **8.93/10**

**Préservation spatiale : 9/10**
Mêmes murs, mêmes moulures, même chevron parquet, même corniche, même luminaire laiton entre pass1 et output. **Zéro dérive d'angle.** C'est ce qu'on attend du pipeline.

**Fidélité stylistique : 9/10**
- Armoire laquée noir avec incrustations laiton Art Deco : EXCELLENTE silhouette (référence Ruhlmann/Dunand)
- Tête de lit capitonnée géométrique : très juste
- Fauteuil club velours vert canard, piétement laiton conique : parfait (référence Paul Frankl)
- Banc de pied velours vert avec bordure laiton : cohérent
- Chevets laqués + appliques colonnes : cohérent Art Deco

**Critiques mineures (pour viser 9.5+) :**
1. Manque d'audace Art Deco "vrai" — pas de miroir soleil, vase géométrique (contrainte passe 2 freestanding only)
2. Tapis un peu petit
3. Lampe gauche abat-jour légèrement asymétrique

**Verdict : GO — c'est le seul livrable de la série qui approche la cible fondateur. Validation que le pipeline 2 passes SÉPARÉ fonctionne quand les surfaces sont déjà propres.**

---

## Synthèse — Fixes prioritaires v55

### P0 — Bugs bloquants

**1. Bug propagation room_type (Pipeline B) → @fullstack**
Le `furniture_prompt` envoyé au modèle contient 2 blocs contradictoires (dining_room + STYLE OVERRIDE living room). Auditer `components/StylePicker.tsx` + le builder de prompt mobilier côté client. Le backend doit recevoir UN SEUL bloc mobilier cohérent avec le room_type.

**2. Hallucination éléments structurels — surface_prompt tous styles**
Ajouter dans le builder passe 1 (route.ts ou generation-pipeline.ts, pas dans les stylePrompts) :

```
ARCHITECTURAL HONESTY: Do NOT invent structural elements that are not visibly present in the input photo. If the input ceiling is flat, keep it flat — do not add beams, coffers, vaults, or ribs. If the input has no moldings, do not add moldings. Apply finishes over the EXISTING geometry only.
```

**3. Nettoyer les surfacePrompts amorçants**
**Remplacer PARTOUT** dans `components/StylePicker.tsx` (les 12 styles concernés : Scandinavian, Mediterranean, Contemporary, Japandi, etc.) :

> `white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs`

**Par** :

> `white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers`

Pour Mediterranean uniquement, ajouter en fin de surfacePrompt :

> `If — and only if — the input already shows visible ceiling beams, whitewash them in place without relocating them.`

### P1 — Qualité

**4. Halo flou sur baies vitrées surexposées (Pipelines B, C)**
Ajouter dans le builder passe 1 :
```
Regenerate over-exposed windows as clean glazed surfaces. Do not preserve blown highlights as semi-transparent overlays of the input.
```

**5. Préservation texture béton brut (Pipeline C poteau gauche)**
Renforcer la directive Sprint 23 dans le builder passe 1 :
```
If any wall, column, or beam shows raw concrete, exposed brick, or masonry in the input, preserve its EXACT surface texture including patina, formwork marks, drips, and irregularities. Do NOT smooth, clean, or paint over these surfaces unless the style explicitly prescribes a limewash.
```

**6. Mediterranean furniture_prompt — tapis trop petit**
Actuel : `a soft area rug 160x230cm beside the bed`
Nouveau : `a soft wool area rug 200x300cm extending under the full lower two-thirds of the bed and both bedside tables`

### P2 — Polish (visée 9.5)

**7. Art Deco furniture_prompt enrichir**
Ajouter `matching bedside lamps with identical pleated silk drum shades, symmetrical positioning`

**8. Passe 1 — figer le ratio d'input**
Pipeline A pass1 est recadré (4:3 → 3:2). Ajouter dans le builder passe 1 :
```
Output dimensions must match the input aspect ratio exactly. Do NOT crop, zoom, or reframe.
```

---

## Verdict final pipeline v54 : **NO-GO**

**Raisons :**
- Score moyen 7.35/10 très en-dessous de la cible 9.5 fondateur
- 1 bug client P0 (propagation room_type) qui livre un salon au lieu d'une salle à manger
- 2 générations sur 4 montrent des **hallucinations structurelles** (plafond à caissons inventé, passage mural inventé) — **régression vs audits session 33**
- Seule la passe 2 isolée (Pipeline D Art Deco) approche la cible à 8.93 — validation que le pipeline 2 passes séparé fonctionne quand les surfaces sont déjà propres

**Ce qui marche :**
- Le luminaire PH5 Scandinave est enfin crédible (fix Sprint 16b validé)
- Le rendu Art Deco freestanding est excellent
- Les finitions Mediterranean (terre cuite, chaulé) sont fidèles quand la géométrie n'est pas touchée

**Prochaine étape :** appliquer les fixes P0 (1, 2, 3), relancer 4 nouvelles générations sur les MÊMES inputs pour comparaison A/B, puis nouvel audit croisé avec Lucas.

---

## Fichiers pertinents

- Métadonnées : `/home/user/Architecture/audit-data/logs.json`
- Images auditées : `audit-data/gen-19[1-6]-*.jpg`
- **Prompts à modifier** : `components/StylePicker.tsx` (surfacePrompts Mediterranean, Scandinavian, Contemporary + 9 autres styles avec formulation "vault beams")
- **Builder à modifier** : `app/api/generate/route.ts` ou `lib/generation-pipeline.ts` (builder passe 1 — ajout ARCHITECTURAL HONESTY + ratio lock + window regeneration)
- **Bug client à investiguer** : builder de `furniture_prompt` côté `components/StylePicker.tsx` ou `app/page.tsx` (concaténation dining_room + STYLE OVERRIDE)

## Handoff

→ **@fullstack** (P0) : investiguer et fixer le bug propagation room_type sur Pipeline B (concaténation `STYLE OVERRIDE` dans `furniture_prompt`). Voir Pipeline B pour contexte complet.

→ **@fullstack** (P0) : appliquer fixes prompts 1+2+3 dans `components/StylePicker.tsx` et `lib/generation-pipeline.ts` (ARCHITECTURAL HONESTY + nettoyage formulations amorçantes "vault beams").

→ **Validation visuelle ronde 2** : relancer 4 générations sur les mêmes inputs après fixes, ré-auditer Yann + Lucas en parallèle. Cible 9.5/10.
