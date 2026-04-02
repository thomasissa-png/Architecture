# Audit global des prompts de generation — v39

**Agent** : @ia
**Date** : 2026-04-02
**Scope** : 3 problemes recurrents sur generations #99-104
**Fichiers audites** : generation-pipeline.ts, route.ts, StylePicker.tsx, room-types.ts, style-variants.ts, style-resolver.ts

---

## 1. Warm shift systematique

### Cause racine

Le probleme n'est PAS dans les builders (LIGHT_PRESERVATION dit correctement "No warm tint or yellow cast"). La cause racine est triple :

**A. Les surfacePrompts contiennent des descripteurs intrinsequement chauds**

8 des 12 surfacePrompts injectent des termes qui orientent le modele vers le chaud AVANT que LIGHT_PRESERVATION ne soit lu (les premiers tokens pesent plus dans GPT-image-1) :

| Style | Terme chaud dans surfacePrompt | Fichier |
|---|---|---|
| Japandi | "subtle sand undertone" | StylePicker.tsx:56 |
| Mid-Century | "subtle ivory undertone", "warm walnut-toned" | StylePicker.tsx:78 |
| Bohemian | "warm honey-toned wood" | StylePicker.tsx:89 |
| Cosy | "subtle cream undertone", "warm fabric drum pendant" | StylePicker.tsx:111 |
| Wabi-Sabi | "soft matte warm grey" | StylePicker.tsx:122 |
| Mediterranean | "warm travertine" | StylePicker.tsx:100 |
| Haussmannian | (neutre — OK) | — |
| Scandinavian | (neutre — OK) | — |

Ces descripteurs sont en TETE de prompt (position 1 = poids maximal). Le modele interprete "warm" et "cream" comme une directive de temperature couleur globale, pas seulement pour le materiau nomme.

**B. Les furniturePrompts (passe 2) renforcent le biais chaud**

LIGHT_PRESERVATION de la passe 2 dit "warm-toned materials do NOT shift the overall lighting warm", mais les furniturePrompts contiennent massivement "warm" : "warm cream" (Cosy), "warm ecru" (Japandi), "warm cognac" (Industrial, Cosy), "warm sand" (Mediterranean), "warm straw" (Japandi). Le modele recoit ces termes avant la directive de preservation.

**C. Le DSLR_LINE demande du grain ISO 200 et du vignettage**

Le vignettage naturel assombrit les coins, ce qui peut pousser le modele a compenser en rechauffant les zones centrales (biais de balance auto du modele).

### Corrections proposees

**Correction 1 — Neutraliser les surfacePrompts** (StylePicker.tsx + style-resolver.ts)

Remplacer les qualificatifs thermiques par des descripteurs chromatiques neutres :

| Ancien | Nouveau | Ligne approx. |
|---|---|---|
| `subtle sand undertone` (Japandi) | `very subtle warm-neutral undertone` | StylePicker.tsx:56 |
| `subtle ivory undertone` (Mid-Century) | `very subtle neutral undertone` | StylePicker.tsx:78 |
| `warm walnut-toned wood plank` (Mid-Century) | `medium walnut-toned wood plank` | StylePicker.tsx:78 |
| `warm honey-toned wood plank` (Bohemian) | `honey-toned wood plank` | StylePicker.tsx:89 |
| `subtle cream undertone` (Cosy) | `very subtle neutral-cream undertone` | StylePicker.tsx:111 |
| `warm fabric drum pendant` (Cosy) | `fabric drum pendant light in natural cream tone` | StylePicker.tsx:111 |
| `soft matte warm grey` (Wabi-Sabi) | `soft matte cool-neutral grey` | StylePicker.tsx:122 |
| `warm travertine` (Mediterranean) | `travertine` | StylePicker.tsx:100 |

IMPORTANT : appliquer les memes changements dans `lib/style-resolver.ts` (lignes 27-107, copie server-side des prompts).

**Correction 2 — Renforcer LIGHT_PRESERVATION** (generation-pipeline.ts:107, route.ts:125)

Ancien :
```
No warm tint or yellow cast. Raw concrete, bare masonry, and grey plaster must stay cool-grey — do not shift to beige, sand, or warm stone.
```

Nouveau :
```
No warm tint or yellow cast. The output color temperature must match the input exactly — measure by the whites (walls, ceiling, window frames). Raw concrete, bare masonry, and grey plaster must stay cool-grey — do not shift to beige, sand, or warm stone. Warm-toned MATERIALS (wood, brass, leather) have warm LOCAL color but must NOT shift the GLOBAL white balance.
```

**Correction 3 — Supprimer "warm" des furniturePrompts** (StylePicker.tsx, style-resolver.ts, style-variants.ts)

Remplacer `warm cream` par `cream`, `warm ecru` par `ecru`, `warm sand` par `sand`, `warm cognac` par `cognac`, `warm straw` par `straw` dans TOUS les furniturePrompts des 3 fichiers. Le mot "warm" qualifiant un materiau est redondant (le cognac est deja chaud) et pollue la balance couleur globale.

---

## 2. Inventions architecturales sur chantier brut

### Cause racine

**A. "Refinish the floor and repaint or replaster the walls" est une instruction creative trop ouverte**

Le builder generique passe 1 (generation-pipeline.ts:210, route.ts:229) dit "Refinish the floor and repaint or replaster the walls". Sur un chantier brut (plafond arrache, cloisons manquantes, platre nu), le modele interprete "refinish" comme une permission de RECREER la surface, pas juste de la finir. Il invente alors des voutes, des arches, des parois vitrees pour "finir" l'espace.

**B. CEILING_PRESERVATION dit "smooth plaster BETWEEN beams" — sur plafond arrache, il n'y a PAS de beams**

Si le plafond est arrache (poutrelles metalliques nues, hourdis visible, cables pendants), le modele lit "smooth plaster between beams" et cree un plafond fini avec des fausses poutres decoratives. La directive presuppose un plafond existant.

**C. Aucune directive de NON-CREATION**

Les builders disent "preserve geometry" mais ne disent jamais "do NOT create architectural elements that are not visible in the input". Le modele prend le silence comme une permission.

### Corrections proposees

**Correction 4 — Ajouter une directive anti-invention explicite dans les builders passe 1**

Apres WALL_PRESERVATION, ajouter une nouvelle constante dans generation-pipeline.ts et route.ts :

```typescript
const ANTI_INVENTION = "Do NOT invent architectural elements absent from the input: no arches, no vaults, no glass partitions, no columns, no niches, no decorative ceiling coffers. If the ceiling is damaged or stripped, apply a simple flat white finish — do not reconstruct ornamental geometry. If a wall is partially demolished, keep it as-is — do not complete or extend it.";
```

Injecter ANTI_INVENTION dans tous les builders passe 1 (generique + 7 dedies : kitchen, bathroom, wc, bedroom, laundry, cellar, entryway) entre WALL_PRESERVATION et CAMERA_PRESERVATION.

**Correction 5 — Conditionner CEILING_PRESERVATION au cas du plafond degrade**

Ancien (generation-pipeline.ts:106, route.ts:124) :
```
Smooth plaster over ceiling surface BETWEEN beams only — formwork marks, seams refinished.
```

Nouveau :
```
If the ceiling has visible beams: smooth plaster BETWEEN beams only, formwork marks and seams refinished. If the ceiling is stripped, damaged, or shows bare structure (metal joists, hollow-core slabs, cables): apply a flat white finish without adding any ornamental geometry — no coffers, no moldings, no vaults.
```

**Correction 6 — Remplacer "Refinish" par "Apply the described finish to"**

generation-pipeline.ts:210, route.ts:229 — builder generique passe 1 :

Ancien :
```
Refinish the floor and repaint or replaster the walls.
```

Nouveau :
```
Apply the described finish to the existing floor and walls. Do not add structural elements that are absent from the input.
```

---

## 3. Variance inter-generation

### Cause racine

**A. Le systeme de variantes (style-variants.ts) est actif et deterministe par image hash**

Le fichier `style-variants.ts` definit 3 furniturePrompts par style (v1, v2, v3) avec des compositions tres differentes (ex: Art Deco v1 = canape emeraude + cabinet laque / v2 = canape saphir + piedestal marbre / v3 = canape blush pink + table laque noire). La selection est deterministe via `selectVariant()` qui hash `imageBase64.slice(0,32) + styleId`.

**B. Le meme input produit le meme hash = le meme variant = meme resultat SAUF si l'image base64 change**

Le hash utilise les 32 premiers caracteres du base64 APRES la virgule du data URL (route.ts:723). Si le client re-encode l'image (compression JPEG differente, resize different), les 32 premiers chars changent et le variant change. Cela explique le delta 1.5 pts entre #103 et #104 Art Deco : les 2 generations ont probablement utilise 2 variants differents (emeraude vs saphir vs blush = styles visuellement tres eloignes).

**C. La temperature du modele GPT-image-1 ajoute de la variance stochastique**

Meme avec le meme prompt exact, GPT-image-1 produit des outputs differents (pas de seed). Cette variance est irreductible.

### Verdict : la variance est un BUG pour le cas "meme photo, meme style" et une FEATURE pour le cas "photos differentes"

Le systeme de variantes est une bonne idee pour la diversite du catalogue, mais il produit un resultat imprevisible pour l'utilisateur qui re-genere la meme photo.

### Corrections proposees

**Correction 7 — Stabiliser le hash par fichier, pas par encodage**

route.ts:723 — remplacer le hash base64 par un hash du contenu image decompresse.

Ancien :
```typescript
const imageHash = image.slice(image.indexOf(",") + 1, image.indexOf(",") + 33);
```

Nouveau :
```typescript
const crypto = await import("crypto");
const imageData = image.slice(image.indexOf(",") + 1);
const imageHash = crypto.createHash("sha256").update(imageData).digest("hex").slice(0, 16);
```

Meme correction dans style-resolver.ts:132 si le imageHash y est passe.

**Correction 8 — Reduire l'ecart entre variantes d'un meme style**

Les 3 variantes par style sont trop eloignees visuellement (emeraude vs saphir vs blush pour Art Deco). Recommandation : les variantes doivent partager le meme hero piece (canape meme couleur) et ne varier que sur les pieces secondaires (fauteuil accent, luminaire, table basse). Le delta visuel max entre 2 variantes devrait etre l'equivalent de ~1 pt Yann, pas 1.5.

Ce n'est pas une correction de code mais une reecriture des variantes dans style-variants.ts — a produire par @interior-architect.

---

## Resume des corrections par fichier

| # | Fichier | Correction | Priorite |
|---|---|---|---|
| C1 | StylePicker.tsx (8 surfacePrompts) + style-resolver.ts (8 surfacePrompts) | Neutraliser "warm/sand/ivory/cream" dans surfacePrompts | P0 |
| C2 | generation-pipeline.ts:107 + route.ts:125 | Renforcer LIGHT_PRESERVATION (white balance par les blancs) | P0 |
| C3 | StylePicker.tsx + style-resolver.ts + style-variants.ts | Supprimer "warm" devant materiaux dans furniturePrompts | P1 |
| C4 | generation-pipeline.ts + route.ts (nouvelle constante + injection 8 builders) | Ajouter ANTI_INVENTION | P0 |
| C5 | generation-pipeline.ts:106 + route.ts:124 | Conditionner CEILING_PRESERVATION au plafond degrade | P0 |
| C6 | generation-pipeline.ts:210 + route.ts:229 | Remplacer "Refinish" par "Apply the described finish" | P1 |
| C7 | route.ts:723 | Hash SHA-256 du contenu image complet | P1 |
| C8 | style-variants.ts (12 styles x 3 variantes) | Reduire ecart visuel entre variantes — @interior-architect | P2 |

---

**Handoff -> @fullstack**
- Fichier produit : `docs/ia/audit-prompts-global-v39.md`
- Corrections C1 a C7 : texte exact a remplacer documente ci-dessus, a implementer dans les fichiers cibles
- Correction C8 : a produire par @interior-architect puis implementer par @fullstack
- Point d'attention : les modifications C1/C3 doivent etre propagees dans 3 fichiers (StylePicker.tsx, style-resolver.ts, style-variants.ts) — les prompts y sont dupliques
- PROMPT_VERSION : incrementer a v40 apres application des corrections
