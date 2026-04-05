# Audit visuel v48 — Japandi salon — Yann Duval
**Date** : 2026-04-05 | **Version builders** : v48 | **Modele** : gpt-image-1.5

## Contexte
Piece : salon chantier brut, ~25-30m2, murs placo blanc non peints, sol beton brut, cables electriques pendants au plafond, boitiers electriques visibles aux murs. Piece en L avec renfoncement mur gauche. Aucune fenetre visible dans le cadrage. 2 generations Japandi sur la meme photo input.

---

## Generation #166 — Japandi salon (1ere generation)

### Preservation spatiale
- **Angle de vue** : MODIFIE. L'input est un grand-angle avec plafond bien visible et coin de mur en L au centre. L'output recadre la scene — le ratio passe de paysage a quasi-carre, le plafond est ecrase, l'angle est legerement plongeant au lieu d'etre droit. La niche murale gauche n'existait PAS dans l'input (inventee pour y placer un bonsai).
- **Dimensions/proportions** : la piece parait plus petite. Le mur du fond semble rapproche.
- **Fenetres/portes** : aucune fenetre dans l'input, aucune dans l'output — correct.
- **Prises/cables** : les cables plafond sont remplaces par le luminaire (correct). Les boitiers muraux sont nettoyes (correct).
- **Note** : 5/10 — le ratio d'image change, la niche est hallucinee, l'angle est modifie.

ALERTE : l'espace n'est pas fidele a l'original. Niche murale inventee, proportions modifiees, ratio d'image different.

### Grille 10 criteres

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale (x3) | 5/10 | Niche hallucinee, ratio modifie, profondeur ecrasee |
| 2 | Fidelite stylistique (x2) | 8/10 | Japandi bien capture : canape bois/lin, table basse noire laquee, pouf indigo, washi pendant |
| 3 | Eclairage (x1) | 7/10 | Lumiere douce coherente, leger warm shift acceptable |
| 4 | Hero pieces (x1) | 7/10 | Washi pendant (Noguchi-style), canape a lattes bois — corrects. Table basse noire un peu generique |
| 5 | Coherence matieres (x1) | 8/10 | Bois/lin/laque noire — palette Japandi coherente |
| 6 | Credibilite pro (x2) | 5/10 | CAPpee par la niche inventee. Un archi verrait immediatement que l'espace est different |
| 7 | Completude (x1) | 4/10 | **PROBLEME PRINCIPAL** : tout le mobilier est concentre au CENTRE de la piece. Enorme zone vide a droite et derriere. La piece parait inoccupee |
| 8 | Vocabulaire visuel (x1) | 7/10 | Tapis raye, textures lisibles, palette tonale douce |
| 9 | Adaptabilite spatiale (x1) | 4/10 | Le mobilier occupe ~20% de la surface. Pour un salon de 25m2, il manque cruellement un coin lecture, un meuble bas au fond, un fauteuil accent |
| 10 | Potentiel photorealiste (x1) | 7/10 | Rendu propre, eclairage credible, mais trop "catalogue" |

**Note ponderee : 5.7/10** (CAPpee par preservation spatiale)

---

## Generation #168 — Japandi salon (regeneration)

### Preservation spatiale
- **Angle de vue** : MODIFIE mais moins que #166. Le ratio reste plus carre que l'input paysage. L'angle est legerement different (plus frontal).
- **Dimensions** : la piece parait un peu plus fidele en largeur mais le plafond reste ecrase.
- **Niche** : ABSENTE cette fois — le mur gauche est plein, coherent avec l'input. Progres.
- **Prises/cables** : nettoyes correctement.
- **Note** : 6/10 — ratio encore modifie mais pas de hallucination structurelle.

### Grille 10 criteres

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale (x3) | 6/10 | Ratio encore modifie, plafond ecrase, mais pas de niche hallucinee |
| 2 | Fidelite stylistique (x2) | 8/10 | Japandi lisible : canape bois clair/lin ecru, table basse frene, gueridon rond |
| 3 | Eclairage (x1) | 7/10 | Douce, neutre, coherente. Pas de warm shift excessif |
| 4 | Hero pieces (x1) | 7/10 | Washi pendant (meme que #166), canape bas lattes bois clair — bon. Gueridon avec theiere = touche japonaise pertinente |
| 5 | Coherence matieres (x1) | 8/10 | Frene/lin/jute/ceramique — palette unifiee, plus chaleureuse que #166 |
| 6 | Credibilite pro (x2) | 6/10 | Meilleur que #166 grace a l'absence de niche. Le gueridon avec theiere ajoute de la vie |
| 7 | Completude (x1) | 5/10 | **MEME PROBLEME** : tout le mobilier est encore concentre dans la moitie gauche/centre. L'arriere droit est un desert. Le coussin au sol seul ne remplit pas l'espace |
| 8 | Vocabulaire visuel (x1) | 7/10 | Tapis jute, coussin lin, theiere fonte — references correctes |
| 9 | Adaptabilite spatiale (x1) | 5/10 | ~25% de surface meublee. Le gueridon est un progres vs #166 (ajout lateral droit) mais insuffisant. Il manque un meuble bas/buffet au fond, un fauteuil |
| 10 | Potentiel photorealiste (x1) | 7/10 | Meme qualite que #166, propre mais un peu lisse |

**Note ponderee : 6.3/10**

---

## Diagnostic principal : "On ne joue pas assez avec l'espace"

Le fondateur a raison. Les 2 generations souffrent du MEME probleme :

1. **Profondeur non exploitee** : tout le mobilier est concentre dans le premier tiers de la piece. L'arriere (mur du fond, coin droit) est completement vide. Sur un salon de 25-30m2, c'est inacceptable.
2. **Distribution laterale desequilibree** : le canape et la table basse forment un bloc centre-gauche. Le cote droit n'a qu'un coussin au sol (#166) ou un petit gueridon (#168). Aucun anchor piece a droite.
3. **Ratio meuble/vide** : ~20-25% au lieu des ~40% attendus pour le Japandi. Le Japandi est sobre, pas vide. Un interieur Japandi credible (Norm Architects, Keiji Ashizawa) aurait : un coin assise principal + un meuble de rangement bas (tansu) + un coin lecture/the secondaire + une plante sculpturale.
4. **Piece non habitee** : les 2 outputs ressemblent a un showroom temporaire, pas a un salon vecu. Il manque la COUCHE SECONDAIRE (meuble bas au fond, lampadaire, plante, assise d'appoint).

### Variete entre les 2 regenerations
Faible. Les 2 sont quasi-identiques : meme canape (bois + lin ecru), meme washi pendant, meme composition centree. La palette change legerement (plus sombre #166, plus claire #168) et #168 ajoute un gueridon. Ce n'est pas une vraie "regeneration" — c'est une variation mineure.

---

## Plan d'amelioration

**P0 — Distribution spatiale** : le furniturePrompt Japandi doit EXPLICITEMENT demander un groupe secondaire en arriere-plan. Suggestion : "If the room is deeper than 4m, add a secondary zone at the back: low wooden sideboard (tansu-style, 120cm wide, 40cm high) with a ceramic vase and a sculptural dried branch. Add a floor cushion (zabuton) or low stool near this zone."

**P0 — Ratio meuble/vide** : ajouter une directive de densite dans le furniturePrompt Japandi : "Fill approximately 35-40% of the floor area with furniture and rugs. The room should feel curated but LIVED-IN, not empty."

**P1 — Variete regeneration** : le pipeline devrait introduire une variation structurelle entre regenerations (ex: canape a gauche vs a droite, palette chaude vs froide, types de canape differents). Actuellement le modele reproduit la meme composition.

**P1 — Preservation ratio image** : le ratio de sortie doit correspondre au ratio de l'input. Un input paysage ne doit pas devenir carre.

**P2 — Ancrage lateral** : ajouter "distribute furniture across the full width — if one side has the main seating, the opposite side needs a visual anchor (accent chair, floor lamp, plant on low stand)."
