# Audit Generation Entree — Sprint 20

**Date** : 2026-03-24
**Agents** : Yann Duval (Architecte d'Interieur) + Lucas Moreau (Expert IA Image)
**Image** : Grand espace brut type loft/rehabilitation, structure beton courbe, baies vitrees menuiseries noires
**Type de piece** : Entree (room type "entryway")
**Style** : A confirmer (probablement Scandinave ou Contemporain — mobilier neutre, tons beige/cream)

---

## Probleme critique identifie : PLAFOND NON FINI

Le plafond conserve une texture tres rugueuse/granuleuse de beton brut malgre l'ajout de spots encastres. L'incoherence entre spots encastres (finition) et surface brute (chantier) est le defaut majeur de cette generation.

---

## 1. Audit Yann Duval — Architecte d'Interieur

### Grille de notation

| # | Critere | Note /10 | Commentaire |
|---|---------|----------|-------------|
| 1 | Fidelite stylistique (x2) | 6/10 | Le mobilier est neutre et coherent mais manque d'identite stylistique forte — le style n'est pas immediatement identifiable |
| 2 | Vocabulaire visuel | 6/10 | Palette beige/cream/noir correcte mais generique — aucun "marqueur" stylistique distinctif |
| 3 | Hero pieces | 5/10 | Le portemanteau arbre noir est un bon choix d'entree mais trop generique (vu dans tous les catalogues). Le miroir pose est bien |
| 4 | Coherence matieres | 7/10 | Bois naturel + metal noir + textiles beige : palette coherente et credible |
| 5 | Eclairage | 4/10 | **CRITIQUE** : les spots encastres dans un plafond brut sont une aberration technique — on ne pose JAMAIS de spots dans du beton brut non fini. C'est le marqueur le plus evident de rendu IA |
| 6 | Credibilite pro (x2) | 4/10 | Un architecte d'interieur rejetterait immediatement ce rendu a cause du plafond. Aucun professionnel ne livrerait des spots dans un plafond chantier |
| 7 | Completude | 7/10 | Les elements d'entree sont presents (console, miroir, portemanteau, runner, tabouret). La distribution en profondeur avec les fauteuils au fond est bonne |
| 8 | Differenciation | 5/10 | Ce rendu pourrait etre n'importe quel style neutre — pas de signature |
| 9 | Adaptabilite spatiale | 8/10 | Le grand volume est bien exploite : mobilier distribue en profondeur, fauteuils au fond, lampadaire en milieu de piece. Bonne lecture de l'espace |
| 10 | Potentiel photorealiste | 5/10 | Le plafond brut tue le realisme. Sans ce defaut, le rendu serait credible |

**Note globale Yann Duval : 5.5/10** (moyenne ponderee, fidelite et credibilite x2)

Calcul : (6x2 + 6 + 5 + 7 + 4 + 4x2 + 7 + 5 + 8 + 5) / 12 = 67/12 = 5.58

### Points forts (Yann)

- Distribution en profondeur excellente — le grand volume lineaire est bien exploite avec des zones distinctes
- Le mobilier d'entree est pertinent : console + miroir pose + portemanteau + runner
- La palette matiere (bois naturel, metal noir, textiles neutres) est coherente
- Le reflet de la personne dans la vitre a disparu (bon nettoyage)
- Les menuiseries noires sont preservees

### Faiblesses critiques (Yann)

1. **PLAFOND** : Le probleme numero un. Les spots encastres dans du beton brut non fini sont un non-sens architectural absolu. C'est l'equivalent de poser un lustre Baccarat dans une grange sans toit. Le plafond devrait avoir une finition lisse (enduit, peinture, ou au minimum un lait de ciment) AVANT tout luminaire encastre.

2. **Luminaire vs structure** : Le builder dit "white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs" — c'est la BONNE intention, mais le modele a interprete "preserving" comme "ne rien changer a la surface". La geometrie (arcs) est preservee, mais la TEXTURE aussi, ce qui n'etait pas le but.

3. **Manque de style identifiable** : Dans un espace aussi spectaculaire (arcs en beton, double hauteur, baies vitrees), le mobilier devrait etre a la hauteur du volume. Les fauteuils beige au fond sont trop timides pour cet espace.

---

## 2. Audit Lucas Moreau — Expert IA Image

### Grille de notation

| # | Critere | Note /10 | Commentaire |
|---|---------|----------|-------------|
| 1 | Preservation architecturale (x2) | 7/10 | Les arcs structurels sont preserves, les baies vitrees et menuiseries noires aussi. Bon. Mais la TEXTURE du plafond aurait du etre modifiee (finition) — le modele ne distingue pas geometrie vs texture |
| 2 | Contraintes lumiere | 6/10 | L'eclairage naturel depuis les baies est globalement preserve, le contre-jour est attenue (acceptable). Mais les spots encastres creent une lumiere artificielle incoherente |
| 3 | Vocabulaire photo | 7/10 | Le rendu a une qualite photographique correcte : profondeur de champ, perspective, grain |
| 4 | Structure prompt | 5/10 | **C'est ici le probleme** — le prompt de passe 1 dit "preserve ceiling geometry" et "rough texture, irregular edges, patina intact" ce qui EMPECHE le modele de lisser le plafond entre les poutres |
| 5 | Negative prompting | 6/10 | Le negative prompt Flux ne mentionne rien sur "unfinished ceiling" ou "raw concrete ceiling" |
| 6 | Compatibilite multi-modeles | 6/10 | Le probleme se manifesterait sur les 2 providers (OpenAI et Flux) car c'est un probleme de PROMPT, pas de modele |
| 7 | Coherence I/O | 6/10 | Le format et les proportions sont preserves. Le nombre de fenetres et portes est correct. Mais la finition plafond est incoherente avec les spots |
| 8 | Richesse descriptive | 6/10 | Le surfacePrompt du style + le builder sont suffisamment detailles pour les murs et le sol, mais PAS pour le plafond |
| 9 | Adaptabilite conditions | 5/10 | Le prompt ne gere pas le cas "plafond beton brut massif" — il est calibre pour des plafonds plus conventionnels (placo, bois) |
| 10 | Rendu final credible (x2) | 5/10 | Le plafond brut avec spots encastres disqualifie le rendu pour un usage professionnel |

**Note globale Lucas Moreau : 5.8/10** (moyenne ponderee, preservation et rendu x2)

Calcul : (7x2 + 6 + 7 + 5 + 6 + 6 + 6 + 6 + 5 + 5x2) / 12 = 69/12 = 5.75

### Points forts (Lucas)

- Preservation des arcs en beton — la geometrie structurelle est intacte
- Menuiseries noires conservees avec fidelite
- Perspective et angle de vue bien preserves
- Le sol a ete correctement fini (beton cire / pierre claire)
- Les murs sont proprement blancs
- Le reflet humain dans la vitre a ete nettoye (le modele a bien gere)

### Faiblesses critiques (Lucas)

1. **PROMPT PASSE 1 — CONTRADICTION INTERNE** : La ligne du builder dit :
   > "Preserve the ceiling geometry exactly — vaults, beams, ribs, arches, and exposed structural elements must remain visible with their original rough texture, irregular edges, and surface patina intact. Apply the finish OVER the existing geometry. Do NOT smooth, flatten, or clean up beams or structural features."

   Le probleme est double :
   - "rough texture, irregular edges, and surface patina intact" s'applique aux POUTRES/ARCS (correct) mais le modele l'applique a TOUTE la surface du plafond, y compris les zones ENTRE les poutres
   - "Do NOT smooth, flatten, or clean up" est une instruction de preservation TOTALE — le modele ne peut pas distinguer "ne pas lisser les poutres" de "ne pas lisser le plafond entre les poutres"

2. **ABSENCE DE DIRECTIVE EXPLICITE POUR LA SURFACE INTER-POUTRES** : Le prompt ne dit JAMAIS "apply smooth white finish to the ceiling surface BETWEEN the beams". Il dit "white ceiling finish applied over existing ceiling geometry" (dans le surfacePrompt) mais ceci est CONTREDIT par le builder qui dit "do not smooth".

3. **LE MODELE A FAIT EXACTEMENT CE QU'ON LUI A DEMANDE** : C'est un probleme de prompt, pas de modele. Le prompt dit "ne pas lisser" = le modele ne lisse pas. Il ajoute les spots dans la surface brute parce qu'on ne lui a pas dit que la surface entre les poutres devait etre finie.

---

## 3. Diagnostic technique du probleme plafond

### Cause racine

Le builder `buildSurfacesResponsesPrompt` contient cette directive (ligne 78 de route.ts) :

```
"Preserve the ceiling geometry exactly — vaults, beams, ribs, arches, and exposed structural
elements must remain visible with their original rough texture, irregular edges, and surface
patina intact. Apply the finish OVER the existing geometry. Do NOT smooth, flatten, or clean
up beams or structural features."
```

Cette directive a ete ajoutee au Sprint 18 (item 148) pour corriger un probleme inverse : les poutres massives d'une generation Japandi etaient lissees, perdant leur caractere.

**Le probleme : cette directive ne distingue pas les ELEMENTS STRUCTURELS (poutres, arcs, nervures) de la SURFACE DE REMPLISSAGE (le plafond entre les poutres).** Le modele interprete "do not smooth, flatten, or clean up" comme une directive globale pour TOUT le plafond.

### Pourquoi "white ceiling finish applied over existing ceiling geometry" ne suffit pas

Le surfacePrompt dit bien "white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs". Mais :

1. Le builder CONTREDIT le surfacePrompt avec "do NOT smooth" (plus fort, plus explicite)
2. "Applied over" est vague — le modele ne sait pas si "over" signifie "comme une peinture sur du brut" ou "comme un enduit lisse"
3. Sur du beton brut massif avec traces de coffrage, "applied over" produit du beton peint en blanc (texture preservee, couleur changee) — ce qui n'est PAS une finition

### La confusion geometrie vs texture

Le prompt melange deux concepts :
- **Geometrie** = la FORME 3D du plafond (arcs, voutes, poutres, hauteur) — DOIT etre preservee
- **Texture de surface** = la FINITION (brut, coffrage, crepi, lisse) — DOIT etre modifiee pour paraitre fini

Le modele ne peut pas distinguer ces deux concepts quand le prompt dit "preserve... with their original rough texture" — il preserve TOUT.

---

## 4. Corrections recommandees

### P0 — Reecriture de la directive plafond dans buildSurfacesResponsesPrompt

**Ancien** (route.ts, ligne 78) :
```
"Preserve the ceiling geometry exactly — vaults, beams, ribs, arches, and exposed structural
elements must remain visible with their original rough texture, irregular edges, and surface
patina intact. Apply the finish OVER the existing geometry. Do NOT smooth, flatten, or clean
up beams or structural features."
```

**Nouveau propose** :
```
"Preserve the ceiling's 3D shape — vaults, arcs, and overall volume must keep their exact
form and curvature. Structural beams and ribs must remain visible and protruding.
HOWEVER, apply a smooth finished surface (plaster or paint) to ALL ceiling areas INCLUDING
the flat or curved surfaces between beams. The ceiling must look FINISHED — no raw concrete,
no formwork marks, no rough aggregate texture. Beams can keep a rustic wood or stone texture
if the style calls for it, but the infill ceiling surface between them must be smooth and
cleanly painted."
```

**Pourquoi ce changement fonctionne** :
- Separe explicitement la FORME (arcs, volume, courbure) de la SURFACE (finition)
- "INCLUDING the flat or curved surfaces between beams" = directive ciblee sur la zone problematique
- "No raw concrete, no formwork marks, no rough aggregate texture" = negative constraints explicites pour le beton brut
- "Beams can keep a rustic wood or stone texture if the style calls for it" = preserve le fix du Sprint 18 pour les poutres massives decoratives
- "infill ceiling surface" = vocabulaire architectural precis qui distingue remplissage vs structure

### P0 — Meme correction pour buildSurfacesFluxPrompt

**Ancien** (route.ts, ligne 93) :
```
"Preserve ceiling geometry — vaults, beams, ribs, arches remain visible with original
rough texture and edges. Apply finish over existing structure, do not smooth or flatten."
```

**Nouveau propose** :
```
"Preserve ceiling 3D shape — vaults, arcs, overall volume keep exact form. Beams and ribs
remain visible and protruding. Apply smooth plaster finish to ALL ceiling surfaces between
beams — no raw concrete, no formwork marks. Ceiling must look finished and cleanly painted.
Beams can keep rustic texture if style requires it."
```

### P1 — Clarification dans les 12 surfacePrompts (optionnel mais recommande)

Pour renforcer la directive, les surfacePrompts des 12 styles pourraient remplacer :
```
"white ceiling finish applied over existing ceiling geometry preserving any vault beams
or structural ribs"
```
par :
```
"smooth white plaster ceiling finish — ceiling surface between any beams must be smooth
and cleanly painted, beams and ribs remain visible and protruding with their form intact"
```

Ce changement clarifie que "finish" = surface lisse, pas juste un changement de couleur.

### P2 — Negative prompt Flux enrichi pour le plafond

Ajouter au `FLUX_NEGATIVE_PROMPT` (route.ts, ligne 152) :
```
"raw concrete ceiling, formwork marks on ceiling, unfinished ceiling texture, rough aggregate ceiling"
```

Filet de securite supplementaire pour Flux Depth Pro.

### P3 — Ajout luminaire override pour room type entryway

Le room type "entryway" dans `lib/room-types.ts` n'a pas de luminaire specifique dans son `roomSurfaceOverride`. Le modele invente donc des spots encastres generiques au lieu de suivre le luminaire prescrit par le style. Ajouter :

```
roomSurfaceOverride: "Additionally for this entryway: durable floor finish suitable for
an entrance — ceramic tiles, natural stone, or hard-wearing wood. For the ceiling light,
follow the style's prescribed fixture — do not default to recessed spots."
```

---

## 5. Impact et risques des corrections

### Risque de regression

La correction du Sprint 18 (item 148) avait ete ajoutee pour preserver les poutres massives blanchies qui etaient lissees. La nouvelle formulation "Beams can keep a rustic wood or stone texture if the style calls for it" preserve ce comportement tout en autorisant le lissage de la surface inter-poutres.

**Tests recommandes** :
- Regenerer l'image d'entree avec les nouveaux prompts (cas beton brut massif avec arcs)
- Regenerer une image avec poutres en bois apparentes (cas du Sprint 18 — verifier que les poutres ne sont pas lissees)
- Regenerer une image avec plafond plat simple (cas standard — verifier qu'il n'y a pas de regression)

### Cas limites a surveiller

1. **Plafonds voutes en pierre (type cave)** : la directive "smooth plaster" pourrait plaquer du platre sur de la pierre apparente voulue par le style (ex: Mediterraneen avec voutes en pierre). Le surfacePrompt Mediterraneen dit "if beams are visible whitewash them" — il faudra peut-etre ajouter "if stone vault, whitewash but preserve stone texture".

2. **Plafonds industriels (poutrelles metalliques + bac acier)** : le style Industriel pourrait vouloir garder le plafond brut. Le surfacePrompt Industriel dit "preserve existing wall finish and texture" mais ne mentionne pas le plafond explicitement. Le style Industriel devra peut-etre avoir une exception : "ceiling finish applied over existing structure, or left raw if Industrial style".

3. **Double hauteur / mezzanine** : les plafonds tres hauts sont souvent partiellement finis. La directive doit fonctionner meme quand seule une partie du plafond est accessible visuellement.

---

## 6. Observations secondaires

### Bon : distribution en profondeur
La generation distribue bien le mobilier sur toute la longueur de l'espace : console + miroir au premier plan, lampadaire au milieu, fauteuils au fond. La directive de distribution spatiale (Sprint 14, items 95-96) fonctionne bien sur ce type d'espace lineaire profond.

### Bon : nettoyage du reflet humain
Le reflet de la personne visible dans la vitre gauche de l'input a ete supprime. Le modele a correctement interprete que c'etait un artefact et non un element architectural.

### Attention : boitiers electriques
Les boitiers electriques orange/rouge visibles sur le mur droit de l'input semblent avoir disparu dans l'output. La directive "Preserve all wall-mounted fixed equipment" (Sprint 18, item 147) devrait les preserver. A verifier si c'est un probleme de taille (trop petits pour etre detectes) ou si le modele les a traites comme du "bruit de chantier" a nettoyer.

### Attention : luminaire invente
Le surfacePrompt du style prescrit un luminaire specifique (selon le style choisi — ex: PH5-style pour Scandinave, flush-mount chrome pour Contemporain). L'output montre des spots encastres, qui ne correspondent a aucun des 12 surfacePrompts. Le modele a "invente" un luminaire generique au lieu de suivre la prescription du style. Causes possibles :
- Le room type "entryway" n'a pas de luminaire override, creant un vide interpretatif
- Les spots encastres sont le "defaut generique" du modele pour une entree
- La directive "For the ceiling light fixture, follow the style description above exactly" dans le builder est trop faible face au biais du modele

---

## 7. Synthese et plan d'action

| Priorite | Action | Fichier | Impact |
|----------|--------|---------|--------|
| P0 | Reecrire directive plafond builder passe 1 (OpenAI) — separer geometrie 3D vs texture surface | route.ts L78 | Fix principal du probleme plafond |
| P0 | Reecrire directive plafond builder passe 1 (Flux) — aligner avec le fix OpenAI | route.ts L93 | Alignement multi-modeles |
| P1 | Clarifier "finish" dans les 12 surfacePrompts — "smooth plaster" au lieu de "finish applied over" | StylePicker.tsx | Renforcement — supprime l'ambiguite |
| P2 | Enrichir FLUX_NEGATIVE_PROMPT — "raw concrete ceiling, formwork marks" | route.ts L152 | Filet de securite Flux |
| P2 | Verifier preservation boitiers electriques | Test generation | Validation directive equipements fixes |
| P3 | Ajouter luminaire override pour room type entryway | room-types.ts | Eviter que le modele invente des spots |

### Notes finales croisees

- **Yann Duval** : 5.5/10 — Le plafond brut avec spots est un defaut eliminatoire en credibilite professionnelle. Sans ce defaut, la note serait environ 7.5/10 grace a la bonne distribution en profondeur et au mobilier d'entree pertinent.
- **Lucas Moreau** : 5.8/10 — Le probleme est 100% prompt (contradiction interne dans le builder). Le modele a fait exactement ce qu'on lui a demande. La correction proposee est chirurgicale et testable.

### Apprentissages consolides

1. **"Preserve rough texture" sur un element structurel BLOQUE la finition de la surface adjacente** — le modele ne distingue pas poutre vs surface entre les poutres quand la directive est globale
2. **"Do NOT smooth" est une directive trop puissante** — elle s'applique a TOUT le plafond, pas seulement aux poutres. Il faut etre chirurgical : "beams keep their form, surfaces between beams get smooth plaster"
3. **La directive du Sprint 18 etait correcte DANS SON CONTEXTE** (poutres lissees) mais produit l'effet inverse sur du beton brut massif — les corrections doivent etre CONDITIONNELLES ou SEPAREES (structure vs remplissage)
4. **Les spots encastres sont un marqueur d'incoherence** — si le plafond est brut, le modele devrait poser un luminaire en saillie (suspension, applique) et non des spots. Le surfacePrompt prescrit un luminaire specifique mais le modele l'a ignore au profit de spots generiques
5. **La separation geometrie/texture est un concept que les modeles ne comprennent PAS nativement** — il faut des directives explicites distinctes pour chacun ("keep the 3D shape" vs "apply smooth surface")

---

**Handoff -> @fullstack**
- Fichier produit : `/home/user/Architecture/docs/reviews/audit-entree-sprint20.md`
- Decisions : reecriture de la directive plafond dans les builders passe 1 (OpenAI + Flux) pour separer preservation de geometrie 3D et finition de surface
- Corrections P0 a appliquer dans `app/api/generate/route.ts` (lignes 78 et 93)
- Corrections P1 optionnelles dans `components/StylePicker.tsx` (12 surfacePrompts)
- Correction P2 dans `FLUX_NEGATIVE_PROMPT` (ligne 152 de route.ts)
- Correction P3 dans `lib/room-types.ts` (entryway luminaire override)
- Points d'attention : tester la regression sur les poutres en bois (Sprint 18), verifier le cas Industriel/Mediterraneen, verifier la preservation des boitiers electriques
