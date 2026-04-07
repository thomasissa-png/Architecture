# Audit technique Versimo — Pipeline v54 (session 35)

**Auditeur :** Lucas Moreau — Expert IA Image
**Date :** 2026-04-07
**Modèle :** gpt-image-1.5 (Responses API + image_generation tool, input_fidelity high)
**Cible fondateur :** 9.5/10
**Audit croisé avec :** Yann Duval (architecte d'intérieur, score 7.35/10 NO-GO)

---

## Score global moyen pondéré : **7.10 / 10 — NO-GO v54**

Triangulation avec Yann : je confirme l'intégralité des findings P0. J'aggrave Pipeline B (artefact de fusion massif, anomalie de génération qui sort du registre "qualité prompt" pour entrer dans "anomalie modèle"). Je nuance Pipeline A (le rendu final est très vendable malgré l'hallucination du plafond — mais la règle préservation spatiale s'applique). Je confirme Pipeline D comme la seule sortie cible-compatible.

## Tableau récapitulatif

| Gen | Préserv. spat. ×3 | Hallucinations | Lumière | Color shift | Photoréal. ×2 | Global /10 |
|---|---|---|---|---|---|---|
| A — Med. bedroom (#193→#195) | 5.0 (CAP) | Plafond caissons inventé | 7.5 | Léger warm shift OK | 8.5 | **6.71** |
| B — Contemp. dining (#192→#196) | 3.5 (CAP) | Fusion artifact + passage hallucinés | 4.0 | Cool shift fort | 6.0 | **4.50** |
| C — Scand. LR pass1 (#194) | 7.5 | Halo flou bas droite | 7.0 | Neutre OK | 7.5 | **7.43** |
| D — Art Deco pass2 (#191) | 9.5 | Aucune | 8.5 | Neutre | 8.5 | **8.93** |

---

## Triangulation avec Yann (findings P0)

### Pipeline A — Plafond à caissons hallucinés : **CONFIRMÉ**
L'input est sans ambiguïté : plafond plat en plaques de BA13 avec bandes de joint visibles, deux câbles électriques pendants, un boîtier d'éclairage temporaire bleu. Aucune poutre, aucune nervure, aucun caisson. La pass1 produit un plafond à **9 caissons quadrillés** avec poutres blanchies en relief — c'est une **fabrication géométrique pure**, pas une finition. Le modèle a lu "vault beams or structural ribs — if beams are visible whitewash them" et a halluciné les beams pour avoir quelque chose à blanchir. C'est un cas d'école d'**amorçage par négation positive** : mentionner un élément structurel même conditionnellement le rend probable dans la sortie.

**Observation technique additionnelle :** la perspective de la pass1 est aussi modifiée — l'angle de vue est plus frontal, les lignes de fuite du sol convergent vers un point différent (~5° de dérive). Le pilier d'angle central a été déplacé d'environ 8% vers la droite. Le ratio est passé de 4:3 à approximativement 3:2 (recadrage par le haut, perte d'environ 15% de la hauteur d'origine).

### Pipeline B — Bug propagation room_type : **CONFIRMÉ + AGGRAVÉ**
L'output #196 est sans aucun doute un **salon avec coin repas en arrière-plan**, pas une salle à manger. Au premier plan : canapé courbe 4 places gris clair, table basse ronde travertin cannelé, lampadaire articulé noir, fauteuil cantilever cuir noir, crédence noyer. La table à manger 6 chaises est reléguée au tiers arrière de l'image, à peine visible — exactement l'inversion de hiérarchie qu'on attendrait. Le bug client est confirmé à 100%.

**Mais le vrai problème de Pipeline B est ailleurs :** la pass1 #192 contient un **artefact de fusion catastrophique**. Une zone rectangulaire centre-gauche montre un overlay semi-transparent de l'input brut (poutres bois, baies vitrées d'origine, silhouette du worker) **superposée à la pass1 propre**. Ce n'est pas un défaut de prompt, c'est une **anomalie au niveau du modèle ou du tool image_generation** — soit input_fidelity:"high" a appliqué un blending alpha au lieu d'un edit complet, soit le modèle a essayé d'interpoler entre input et sortie target sans converger. Je n'ai jamais vu cet artefact en deux ans sur Midjourney. Sur gpt-image-1.5, c'est inquiétant.

**Mur droit du Pipeline B (passage hallucinés) :** CONFIRMÉ. L'input a un mur plein à droite ; l'output #196 ouvre un passage architectural avec une enfilade de pièce. C'est cohérent avec le STYLE OVERRIDE qui décrit un "background" avec credenza et olive tree — le modèle a créé l'espace nécessaire pour caser le mobilier promis.

### Halo flou baies vitrées surexposées (Pipelines B + C) : **CONFIRMÉ**
Pipeline C #194 : zone bas-droite très clairement contaminée par l'overlay input semi-transparent. Pipeline B #192 : même phénomène, plus large. **Hypothèse technique :** input_fidelity:"high" + zones d'image très blanches (highlights cramés des baies vitrées) → le modèle ne sait pas si ces zones sont du contenu à préserver ou du blanc à régénérer. Il choisit de les "préserver" comme overlay alpha. **Fix prompt insuffisant** — le problème est paramétrique. Tester input_fidelity:"medium" sur les inputs avec zones >95% luminance.

### Cause racine "vault beams" amorçant : **CONFIRMÉ + élargi**
Yann a raison sur la formulation. Mais je vais plus loin : la formulation `preserving any vault beams or structural ribs` est présente dans **les 12 surfacePrompts**, et n'est jamais utile sauf sur 1-2 styles spécifiques (Mediterranean, Industrial). Pour les 10 autres styles c'est un bruit qui amorce systématiquement le modèle à inventer du relief de plafond.

---

## Findings additionnels (que Yann n'a pas vus en détail)

### F1 — Color shift cool sur Pipeline B (P1)
Les murs béton brut de l'input ont une dominante chaude (béton ciré ocre, lumière fin de journée). L'output #196 vire **cool/grisé** : murs gris perle, sol béton lissé gris bleuté, ambiance "showroom Boffi". La directive `very light neutral grey walls barely tinted from the original` est trop forte — `barely tinted` ne s'oppose pas au shift puisque le modèle remplace la dominante. Reformuler en : `keep the exact warm/cool tone of the input walls, only neutralizing saturation`.

### F2 — Lignes de fuite Pipeline A
Vérification rapide à la règle virtuelle : les lignes du sol terre cuite #195 ne convergent pas vers le même point de fuite que l'input. Le modèle a "redressé" la perspective vers une vue plus orthogonale. Yann a noté "tilté vers le bas" — je précise : c'est un changement de **focal apparent** (l'input est ~24mm équivalent, la sortie est ~35mm équivalent). Le modèle a réduit la distorsion grand-angle. Pour Claire (architecte), c'est immédiatement détectable.

### F3 — Pipeline D — micro-asymétrie d'éclairage (P2)
Les deux lampes de chevet #191 ont des températures de couleur légèrement différentes (~200K d'écart, lampe gauche plus chaude). C'est cosmétique mais empêche d'atteindre 9.5. Fix : `bedside lamps must emit light at identical color temperature (2700K)`.

### F4 — Pipeline C poteau béton gauche (P1)
Confirmation que le poteau béton brut gauche a perdu ses coulures et marques de banchage. La directive Sprint 23 sur la préservation béton brut ne tient pas face à un surface_prompt qui dit "soft white walls". **Conflit prompt à arbitrer** : la directive "préserver béton brut visible" doit primer sur "soft white walls" si le modèle voit du béton brut dans l'input. Aujourd'hui le surface_prompt gagne.

### F5 — Pipeline A — luminaire lanterne wrought iron (P2)
La lanterne du #195 est correcte mais elle est suspendue au **caisson central halluciné**. Si on retire les caissons (fix Yann), il faut s'assurer que le modèle accroche la lanterne au plafond plat sans créer de nouveau prétexte structurel.

### F6 — Pas de grain photographique (conforme préférence fondateur)
Toutes les sorties sont "CGI-clean" — conforme à la décision fondateur. RAS. Le rendu D Art Deco est même bluffant de propreté. Sur A et C ça donne un côté "rendu V-Ray" mais c'est ce qui est demandé.

---

## Fixes prioritaires v55 (complément à Yann)

### F-Lucas-1 — Tester input_fidelity (P0, technique modèle)
Lancer un A/B sur Pipeline B input avec :
- `input_fidelity: "high"` (actuel) → produit l'artefact de fusion
- `input_fidelity: "medium"` → vérifier si l'artefact disparaît
- `input_fidelity: "low"` → fallback si medium insuffisant

**Hypothèse forte :** l'artefact est lié à l'interaction entre input_fidelity high et les zones d'input à >95% luminance (baies vitrées surexposées). Si confirmé, basculer dynamiquement sur "medium" quand le pré-process détecte des highlights cramés.

### F-Lucas-2 — Color shift Pipeline B (P0, prompt)
Remplacer dans le surface_prompt Contemporary :
> `very light neutral grey walls barely tinted from the original keeping the same overall brightness as the input photo`

Par :
> `walls in light neutral grey that preserves the EXACT warm/cool temperature of the input walls — neutralize saturation but do not shift hue`

### F-Lucas-3 — Conflit béton brut vs surface_prompt (P1)
Ajouter dans le builder passe 1, après ARCHITECTURAL HONESTY :
> `MATERIAL HONESTY: If the input shows raw concrete columns, beams, or walls (formwork marks, drips, patina), preserve them exactly as-is, even if the style description prescribes a different wall finish. Only finish the surfaces that are clearly drywall, plaster, or paintable in the input.`

### F-Lucas-4 — Lock perspective/focale (P1, complément du ratio lock de Yann)
Le ratio lock de Yann ne suffit pas — le modèle peut conserver le ratio en modifiant la focale apparente. Ajouter :
> `Preserve the exact camera focal length apparent in the input — do not flatten wide-angle distortion, do not zoom in, do not change the vanishing points position.`

### F-Lucas-5 — Régénération clean des baies surexposées (P1, complément Yann)
Compléter le fix Yann sur les windows :
> `Regenerate over-exposed windows as clean glazed surfaces showing a soft neutral exterior. Do NOT carry blown highlights as semi-transparent overlays. The exterior view through the glass must be a fresh generation, not a copy of the input pixels.`

### F-Lucas-6 — Suppression "vault beams" sur 10/12 styles (P0, prompts)
Conformément au fix Yann mais étendu : supprimer la mention `vault beams or structural ribs` de **10 styles** (Scandinavian, Contemporary, Japandi, Cosy, Wabi-Sabi, Maximaliste, Boheme, Mid-Century, Art Deco, Haussmannien). Garder uniquement sur **Mediterranean** et **Industriel** avec la formulation conditionnelle stricte de Yann.

---

## Verdict final pipeline v54 : **NO-GO**

**Score moyen 7.10/10** — sous la cible fondateur de 2.4 points. Régression vs session 33 (8.2/10).

**Blocages techniques :**
1. **Bug client room_type** (P0 @fullstack) — Pipeline B livre un salon au lieu d'une salle à manger. Inacceptable pour Claire et Thomas.
2. **Anomalie modèle artefact de fusion** (P0 @ia, technique) — Pipeline B + C montrent des overlays semi-transparents de l'input. Probable interaction input_fidelity:"high" × highlights cramés. Tester variantes input_fidelity et pré-processing des zones >95% luminance.
3. **Hallucinations structurelles** (P0 prompts) — plafond caissons Pipeline A, passage mural Pipeline B. Cause racine = formulation amorçante "vault beams" dans 12 stylePrompts + STYLE OVERRIDE qui invente l'espace nécessaire au mobilier.

**Ce qui marche :**
- **Pipeline D Art Deco passe 2 isolée à 8.93/10** valide définitivement le pipeline 2 passes séparé. Quand les surfaces sont propres, la passe 2 freestanding only délivre.
- **PH5 Scandinave Pipeline C** : enfin crédible (validation Sprint 16b).
- **Finitions Mediterranean** (terre cuite, chaulé) excellentes — c'est la géométrie qui pèche, pas le style.

**Recommandation :** appliquer les fixes Yann (P0 #1, #2, #3) + mes fixes (F-Lucas-1 sur input_fidelity, F-Lucas-2 sur color shift). Relancer 4 générations sur les MÊMES inputs. Audit croisé Yann + Lucas en parallèle. Si ronde 2 < 8.5/10, escalader à @ia pour investigation modèle (artefact de fusion = potentiellement un bug gpt-image-1.5 à reporter à OpenAI).

---

## Handoff

→ **@fullstack (P0)** : bug propagation room_type Pipeline B (cf. rapport Yann pour détail)
→ **@fullstack (P0)** : appliquer fixes prompts F-Lucas-2, F-Lucas-3, F-Lucas-4, F-Lucas-5, F-Lucas-6 dans `components/StylePicker.tsx` + `lib/generation-pipeline.ts`
→ **@ia (P0)** : tester input_fidelity:"medium" vs "high" sur Pipeline B input — investigation artefact de fusion
→ **@ia (P1)** : pré-processing optionnel des inputs avec highlights cramés (>95% luminance sur zones >5% de l'image)
→ **Validation ronde 2** : relancer 4 générations sur mêmes inputs, audit croisé Yann + Lucas, cible 9.0/10 minimum
