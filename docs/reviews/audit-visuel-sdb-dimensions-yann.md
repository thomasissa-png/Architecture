# Audit salle de bain — Probleme de dimensions — Yann Duval, Architecte d'interieur

Date : 2026-03-28
Contexte : Le fondateur signale "on y est toujours pas pour les dimensions de piece" sur la derniere generation SDB.
Methode : Audit structural des prompts bathroom (builders route.ts + roomFurnitureOverride room-types.ts) + comparaison avec les autres types de pieces qui fonctionnent mieux + lecons de l'audit Sprint 20 (note 3.2/10).

---

## 1. Diagnostic — Pourquoi les dimensions sont fausses en salle de bain

### 1.1 Le roomFurnitureOverride de bathroom manque de dimensions

Le prompt actuel :
```
"Bathroom fixtures and accessories: frameless glass walk-in shower enclosure with chrome
rain showerhead and handheld fixture mounted on the wall, wall-mounted vanity unit 80cm
wide with integrated basin and large backlit rectangular mirror above, fluffy folded
towels in neutral tones on open shelving or towel ladder, a small stool or side table
with soap dispenser and candle, potted humidity-loving plant (fern or pothos) in ceramic
pot, woven basket for storage on the floor. No freestanding bathtub unless room is large.
Clean and spa-like atmosphere. No armchairs, no floor lamps."
```

**Seule dimension presente** : vasque 80cm de large.

**Dimensions ABSENTES** :
- La douche n'a ni largeur ni profondeur (un walk-in peut faire 80x80cm dans un petit espace ou 120x200cm dans un grand — le modele ne sait pas)
- Le miroir n'a pas de dimensions ("large" est subjectif)
- Le tabouret/table d'appoint n'a pas de dimensions
- Le panier n'a pas de dimensions
- La plante n'a pas de dimensions
- Le towel ladder n'a pas de hauteur

**Comparaison avec les pieces qui marchent** :
- Chambre adultes : "bed 160cm wide", "bedside tables 45cm wide", "rug 160x230cm"
- Chambre enfants : "bed 90cm wide", "bedside table 40cm wide", "rug 120x170cm", "shelving 100cm wide", "desk 80cm wide"
- Cuisine : "island ONLY if kitchen > 10m2", "countertop 60cm deep"

La chambre enfants a CINQ dimensions explicites. La SDB en a UNE.

### 1.2 Le builder bathroom passe 2 n'a aucune directive de scaling conditionnel

Le builder actuel :
```
"Place all elements with correct perspective and scale. Use door frame (204cm)
as scale reference. Cast realistic shadows matching existing light."
```

**Probleme 1** : "Use door frame (204cm) as scale reference" — dans une salle de bain, la porte n'est souvent PAS visible dans le cadrage (la photo est prise DEPUIS la porte). Si le modele ne voit pas de porte, il n'a aucune reference d'echelle.

**Probleme 2** : Aucune directive conditionnelle de taille, contrairement aux autres pieces :
- Chambre : "if compact room, use 140cm bed instead of 160cm, skip bench at foot"
- Salle a manger : "If room appears compact, use round table 120cm with 4 chairs instead of 180cm with 6"
- Cuisine : "ONLY if kitchen is wide enough (visible floor area suggests >10m2)"

La SDB n'a aucune logique "si petit, alors reduire".

**Probleme 3** : La directive "Wall-mounted vanity and mirror expected. Other items (stool, basket, plant) freestanding." ne donne AUCUNE indication de proportion. Le modele ne sait pas que dans une SDB de 4m2, le panier doit faire 30cm de diametre, pas 50cm.

### 1.3 Les salles de bain sont les pieces les plus variables en taille

C'est un point critique que je dois souligner en tant qu'architecte d'interieur. Une salle de bain peut faire :
- **2.5 m2** : SDB compacte d'appartement parisien T2 (douche 70x70, vasque 50cm, c'est tout)
- **4-5 m2** : SDB standard d'appartement T3/T4 (douche 80x120, vasque 80cm, petit meuble)
- **8-12 m2** : SDB de maison / haut de gamme (douche italienne 120x200, double vasque 120cm, baignoire ilot)
- **15+ m2** : SDB suite parentale luxe (tout l'equipement + fauteuil + dressing integre)

La plage de variation est ENORME — un facteur 6x entre la plus petite et la plus grande. Comparer avec un salon : la variation est plutot 2-3x. Le modele IA n'a aucune chance de deviner la bonne echelle sans directives explicites.

### 1.4 Absence de reference d'echelle alternative a la porte

Dans une salle de bain, les references d'echelle visibles sont :
- La hauteur sous plafond (~250cm standard)
- Les carreaux de carrelage (si visibles apres passe 1 — typiquement 30x60cm ou 60x60cm)
- Les prises/interrupteurs (~110cm du sol)
- Les canalisations (si visibles)

Le prompt ne mentionne AUCUNE de ces references alternatives.

---

## 2. Score de l'audit structural des prompts SDB

Je note les prompts eux-memes (pas une generation specifique), en evaluant leur capacite a produire un bon resultat.

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Fidelite stylistique (x2) | 5/10 | Le furnitureOverride est generique (aucune declinaison par style). Toutes les SDB Scandinave, Japandi, Art Deco recevront les MEMES fixtures. |
| 2 | Vocabulaire visuel | 6/10 | Les elements sont nommes (shower, vanity, mirror, towels, stool) mais sans materiaux specifiques par style. |
| 3 | Hero pieces | 4/10 | La douche walk-in est presente mais sans dimensions. Le miroir "large backlit" est flou. Pas de variante baignoire/douche italienne. |
| 4 | Coherence matieres | 5/10 | "Chrome" est le seul materiau de robinetterie — pas de laiton brosse, pas de noir mat. Le roomSurfaceOverride parle de ceramic tiles mais le furnitureOverride ne les coordonne pas. |
| 5 | Eclairage | 4/10 | "Recessed IP44 ceiling spotlights" est correct mais basique. Pas de bandeau LED sous miroir, pas d'applique murale. L'eclairage SDB est un sujet majeur (zone miroir = 300-500 lux minimum). |
| 6 | Credibilite pro (x2) | 4/10 | L'absence de dimensions conduit a des generations ou la douche est aussi large que le mur, le miroir prend toute la hauteur, le panier fait 60cm de diametre. Aucun architecte ne montrerait ca. |
| 7 | Completude | 5/10 | Les elements de base sont la. Manquent : robinetterie vasque explicite, porte-serviettes mural chauffe, tapis de bain, poubelle, distributeur savon mural. |
| 8 | Differenciation | 3/10 | Le furnitureOverride est IDENTIQUE pour les 12 styles. La SDB Japandi devrait avoir du bois brut et des lignes epurees, l'Art Deco du marbre et du laiton, le Mediterraneen de la terre cuite et du fer forge. |
| 9 | Adaptabilite spatiale | 2/10 | C'est le coeur du probleme. ZERO directive de scaling conditionnel. Le meme prompt s'applique a une SDB de 3m2 et une de 15m2. |
| 10 | Potentiel photorealiste | 5/10 | Les descripteurs DSLR sont injectes par le builder generique — correct. Mais sans echelle coherente, le rendu ne sera jamais credible. |

**Note moyenne ponderee : 4.1/10**

---

## 3. Plan de corrections — par priorite

### P0 — Dimensions explicites dans le roomFurnitureOverride

**Fichier** : `lib/room-types.ts`, cle `bathroom.roomFurnitureOverride`

**Ancien** :
```
"Bathroom fixtures and accessories: frameless glass walk-in shower enclosure with chrome
rain showerhead and handheld fixture mounted on the wall, wall-mounted vanity unit 80cm
wide with integrated basin and large backlit rectangular mirror above, fluffy folded
towels in neutral tones on open shelving or towel ladder, a small stool or side table
with soap dispenser and candle, potted humidity-loving plant (fern or pothos) in ceramic
pot, woven basket for storage on the floor. No freestanding bathtub unless room is large.
Clean and spa-like atmosphere. No armchairs, no floor lamps."
```

**Nouveau** :
```
"Bathroom fixtures and accessories: frameless glass walk-in shower enclosure 80-90cm wide
with chrome rain showerhead 25cm diameter and handheld fixture mounted on the wall,
wall-mounted vanity unit 80cm wide 45cm deep with integrated basin and chrome mixer tap,
rectangular backlit mirror 70cm wide 90cm tall centered above the basin,
wall-mounted towel ladder 45cm wide 150cm tall in chrome or matte black with folded towels
in neutral tones, small teak stool 30cm diameter 45cm tall with soap dispenser and candle,
one potted fern 25cm pot diameter on the floor near the shower,
woven basket 30cm diameter on the floor for storage.
If room appears large (deep or double-width), add a freestanding soaking tub 170x75cm as well.
Clean and spa-like atmosphere. No armchairs, no floor lamps, no decorative furniture."
```

**Changements cles** :
- Douche : 80-90cm wide (contrainte la plus critique — empeche une douche de 2m de large)
- Showerhead : 25cm diameter (empeche un pomme de douche geante)
- Vanity : 45cm deep ajoute (empeche un meuble qui sort du mur de 80cm)
- Mirror : 70x90cm (empeche un miroir mur-a-mur)
- Towel ladder : 45x150cm (ancre en hauteur, reference d'echelle)
- Stool : 30cm diameter, 45cm tall (empeche un tabouret de salon)
- Fern : pot 25cm (empeche une plante geante)
- Basket : 30cm diameter (empeche un panier a linge geant)
- Bathtub : 170x75cm (dimensions standard baignoire ilot)

### P1 — Scaling conditionnel dans le builder bathroom passe 2

**Fichier** : `app/api/generate/route.ts`, fonction `buildFurnitureResponsesPrompt`, bloc `bathroom`

**Ancien** :
```js
if (roomTypeId === "bathroom") {
    return [
      `Add the following bathroom fixtures and accessories to this photo of a finished room: ${furniturePrompt}.`,
      "Wall-mounted vanity and mirror expected. Other items (stool, basket, plant) freestanding.",
      "Place all elements with correct perspective and scale. Use door frame (204cm) as scale reference. Cast realistic shadows matching existing light.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "No curtains.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }
```

**Nouveau** :
```js
if (roomTypeId === "bathroom") {
    return [
      `Add the following bathroom fixtures and accessories to this photo of a finished room: ${furniturePrompt}.`,
      "Wall-mounted vanity and mirror expected. Other items (stool, basket, plant) freestanding.",
      "Bathrooms are typically small — scale ALL fixtures to fit within the visible floor area. If the room appears compact (one wall visible is under 2m), use a 60cm vanity instead of 80cm, skip the stool and basket, keep only essentials (shower, vanity, mirror, towel ladder). The shower enclosure must NOT extend beyond one-third of any visible wall.",
      "Use ceiling height (~250cm), tile size, and visible plumbing as scale references. Every fixture must leave at least 60cm clear passage width between it and the opposite wall or fixture. Cast realistic shadows matching existing light.",
      STRUCTURE_LOCKED,
      EQUIPMENT_PRESERVATION,
      "No curtains.",
      CAMERA_AND_PHOTO,
    ].join(" ");
  }
```

**Changements cles** :
- "Bathrooms are typically small" — ancre le modele dans une hypothese de petitesse plutot que de grandeur
- Scaling conditionnel : "if compact, use 60cm vanity, skip stool/basket"
- Contrainte de proportion douche : "must NOT extend beyond one-third of any visible wall"
- References d'echelle alternatives : "ceiling height (~250cm), tile size, visible plumbing" — remplace la porte (souvent hors cadre)
- Contrainte de passage : "60cm clear passage" — c'est la norme NF P 40-201 pour les SDB (circulation minimum)
- Suppression de "Use door frame (204cm) as scale reference" qui ne fonctionne pas en SDB

### P1 — Meme correction pour le builder Flux

**Fichier** : `app/api/generate/route.ts`, fonction `buildFurnitureFluxPrompt`, bloc `bathroom`

**Ancien** :
```js
if (roomTypeId === "bathroom") {
    return [
      `${furniturePrompt}, placed in this finished bathroom interior.`,
      "Wall-mounted vanity and mirror expected. Other items freestanding.",
      "Correct perspective and scale. Realistic shadows matching existing light.",
      FLUX_STRUCTURE,
      FLUX_EQUIPMENT,
      "No curtains.",
      FLUX_PHOTO,
    ].join(" ");
  }
```

**Nouveau** :
```js
if (roomTypeId === "bathroom") {
    return [
      `${furniturePrompt}, placed in this finished bathroom interior.`,
      "Wall-mounted vanity and mirror expected. Other items freestanding. Bathrooms are typically small — scale all fixtures to visible floor area. Shower enclosure must not exceed one-third of any visible wall.",
      "Use ceiling height and tile size as scale references. 60cm minimum clear passage between fixtures. Correct perspective and scale. Realistic shadows.",
      FLUX_STRUCTURE,
      FLUX_EQUIPMENT,
      "No curtains.",
      FLUX_PHOTO,
    ].join(" ");
  }
```

### P2 — Differenciation SDB par style (furnitureOverride non monolithique)

Actuellement, le `roomFurnitureOverride` est IDENTIQUE pour les 12 styles. C'est un probleme de differenciation mais aussi de dimensions : une SDB Japandi DOIT etre plus depouille (moins d'objets) qu'une SDB Maximaliste.

**Recommandation** : Creer un systeme de declinaisons SDB par style, au minimum pour les 4 groupes :

1. **Minimaliste** (Scandinave, Japandi, Wabi-Sabi, Contemporain) : douche + vasque + miroir. RIEN D'AUTRE. Pas de stool, pas de basket, pas de plante. "Leave floor area mostly empty."
2. **Classique** (Haussmannien, Art Deco, Mid-Century) : douche + vasque + miroir + tabouret + accessoires chromes/laiton. Robinetterie laiton brosse au lieu de chrome.
3. **Chaleureux** (Cosy, Boheme, Mediterraneen) : douche + vasque + miroir + panier + plante + tapis de bain + bougies. Materiaux : teck, terre cuite, rotin.
4. **Maximal** (Maximaliste, Industriel) : douche + vasque + miroir + tabouret + plante + panier + etagere ouverte. Pas de restriction "keep floor empty".

Cela resoudrait aussi le probleme de surcargement : les styles minimalistes RETIRENT des objets au lieu d'en ajouter.

**Implementation concrete** : dans `lib/room-types.ts`, remplacer le `roomFurnitureOverride` statique par une fonction `getBathroomFurniture(styleId: string)` qui retourne le prompt adapte. Cela requiert un refactoring mineur du pipeline.

### P2 — References d'echelle dans le surfacePrompt SDB

**Fichier** : `app/api/generate/route.ts`, builder surfaces bathroom

La passe 1 pose le carrelage. Ce carrelage est ensuite la MEILLEURE reference d'echelle pour la passe 2 — mais seulement si sa taille est specifiee.

**Ajout dans le builder surfaces bathroom** :
```
"Floor tiles 30x30cm or 60x60cm with visible grout lines. Wall tiles 30x60cm format."
```

Cela donne au modele une grille de reference mesuree pour la passe 2. Les joints visibles permettent au modele de "compter" et d'estimer la taille de la piece.

### P3 — Negative prompt SDB enrichi pour les surdimensionnements

**Fichier** : `lib/room-types.ts`, cle `bathroom.roomNegativeOverride`

**Ancien** :
```
"sofa, coffee table, TV unit, dining table, bed, wardrobe, office desk, floor lamp,
armchair, lounge chair, bouclé chair, tripod lamp, arc lamp"
```

**Nouveau** :
```
"sofa, coffee table, TV unit, dining table, bed, wardrobe, office desk, floor lamp,
armchair, lounge chair, bouclé chair, tripod lamp, arc lamp, oversized bathtub,
double vanity in small room, chandelier, full-height cabinet, room-spanning mirror"
```

Ajout des elements SDB specifiquement surdimensionnes.

---

## 4. Synthese et priorites

| Priorite | Action | Impact attendu | Fichier |
|----------|--------|----------------|---------|
| **P0** | Dimensions explicites dans roomFurnitureOverride | Les fixtures auront une taille ancree au lieu d'etre "au feeling" du modele | `lib/room-types.ts` |
| **P1** | Scaling conditionnel + references d'echelle alternatives dans builder | Les petites SDB auront des fixtures reduites, les grandes pourront avoir une baignoire | `app/api/generate/route.ts` |
| **P1** | Meme correction pour Flux builder | Coherence multi-modeles | `app/api/generate/route.ts` |
| **P2** | Differenciation SDB par style | Les SDB Japandi ne seront plus identiques aux SDB Maximalistes | `lib/room-types.ts` + refactoring mineur |
| **P2** | Format carrelage explicite en passe 1 | Grille de reference mesuree pour la passe 2 | `app/api/generate/route.ts` |
| **P3** | Negative prompt enrichi | Bloque les surdimensionnements specifiques SDB | `lib/room-types.ts` |

---

## 5. Apprentissages consolides

1. **Les salles de bain sont les pieces les plus sensibles aux dimensions** — la plage de variation de taille (2.5m2 a 15m2) est la plus large de toutes les pieces. Sans dimensions explicites, le modele surestime systematiquement.

2. **La reference "door frame 204cm" ne fonctionne pas en SDB** — la photo est presque toujours prise depuis la porte. Utiliser le plafond (~250cm), les carreaux (30x60, 60x60) et la plomberie visible comme alternatives.

3. **Le scaling conditionnel est le pattern qui fonctionne** — la chambre ("if compact, 140cm bed instead of 160cm") et la salle a manger ("if compact, round 120cm table instead of 180cm") produisent des generations correctement proportionnees. La SDB doit suivre le meme pattern.

4. **Un prompt monolithique pour les 12 styles est un echec de differenciation** — les SDB Japandi, Art Deco et Boheme ne peuvent pas etre identiques. La densitee d'objets est le levier principal : les styles minimalistes retirent, les styles maximalistes ajoutent.

5. **Les dimensions en centimetres dans le prompt sont le meilleur outil anti-surdimensionnement** — les generations avec dimensions explicites (chambre enfants : 5 dimensions, note correcte) sont systematiquement mieux proportionnees que celles sans (SDB : 1 dimension, note 3.2/10). Le cout en tokens est negligeable (~20 mots de plus).

6. **La contrainte de passage (60cm minimum) est une norme NF** — elle n'est pas qu'une recommandation, c'est une obligation reglementaire en SDB neuve. L'integrer dans le prompt empeche les fixtures de toucher les murs opposes.

---

## 6. Note structurelle de l'audit

**4.1/10** — les prompts SDB actuels sont structurellement insuffisants pour produire des generations credibles. Le probleme n'est pas le modele, c'est l'absence d'information dimensionnelle dans le prompt. Les corrections P0 et P1 devraient remonter la note au-dessus de 7/10 sur les prochaines generations.

---

## Handoff

- **Destinataire** : @ai-image-expert (Lucas Moreau) pour validation technique des corrections de prompts
- **Destinataire** : @fullstack pour implementation des corrections P0-P1 dans route.ts et room-types.ts
- **Fichiers produits** : `docs/reviews/audit-visuel-sdb-dimensions-yann.md`
- **Fichiers a modifier** : `lib/room-types.ts` (roomFurnitureOverride + roomNegativeOverride), `app/api/generate/route.ts` (builders bathroom passe 2 GPT + Flux, builder surfaces passe 1)
- **Decision cle** : les dimensions en cm dans le prompt sont le mecanisme principal de controle d'echelle — pas de shortcut possible
- **Alternative ecartee** : utiliser un pre-processing d'image pour estimer la surface de la piece (trop complexe, trop fragile, trop lent) — les dimensions dans le prompt sont plus fiables et immediates
