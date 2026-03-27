# Validation technique v24 — Lucas Moreau
**Date** : 27 mars 2026

---

## Modification 1 — Mood sentences (12 furniturePrompts)

**Verdict : VALIDE**

Position optimale confirmee. Les mood sentences ouvrent chaque furniturePrompt (ex: "A serene Nordic living space centered around..."). En GPT-4.1 Responses API, les premiers tokens du prompt injecte dans le builder pesent plus dans l'attention du modele. Placer l'intention atmospherique AVANT la liste de meubles oriente la composition globale avant les details — c'est exactement ce qu'on veut.

Impact token : +12-18 tokens par style (une phrase de 10-15 mots). Negligeable sur un prompt total de ~120 tokens. Aucun risque de dilution car la phrase est suivie immediatement par les instructions techniques concretes (dimensions, materiaux, formes). Le modele traite la mood sentence comme un "frame" compositional et les specs comme des contraintes — les deux se renforcent.

Flux Depth Pro : la mood sentence est en tete du prompt Flux aussi (style-first = correct pour la fenetre d'attention courte de Flux). Pas de conflit.

Risque : zero. Les mood sentences ne contiennent aucune directive de lumiere, aucune mention de fenetre/rideau, et restent coherentes avec les regles CLAUDE.md.

---

## Modification 2 — Condensation contraintes passe 2

**Verdict : MODIFIE — risque mineur a surveiller**

La ligne condensee dans le builder generique (l. 436) :
`"Freestanding objects only — no wall art, no shelving, no curtains. Room structure LOCKED (walls, floor, ceiling, windows, radiators unchanged). Shadows from new furniture are expected."`

Techniquement, les parentheses fonctionnent comme une enumeration pour GPT-4.1 — le modele les interprete comme des details de la clause precedente. Pas de perte semantique par rapport aux 2 constantes separees.

MAIS : la directive "Do not place furniture in front of radiators" a ete supprimee du builder generique. Elle reste presente dans les builders par type de piece (bedroom, dining, bathroom, entryway) via EQUIPMENT_PRESERVATION, mais le fallback generique (living_room, office, null) ne l'a plus.

**Risque concret** : un salon ou bureau avec radiateur visible pourrait recevoir un canape place devant. C'est un cas frequent en immobilier francais.

**Recommandation** : ajouter "not blocking radiators" dans la parenthese condensee :
`"Room structure LOCKED (walls, floor, ceiling, windows, radiators unchanged — do not block radiators)."`
Cout : +4 tokens. Protection : reelle.

---

## Modification 3 — Atmosphere directive

**Verdict : VALIDE**

`"professionally styled photograph for luxury real estate listing — lived-in and aspirational, not a sterile furniture catalog"`

Cette phrase est strategiquement excellente. Elle fait deux choses que les descripteurs DSLR ne font pas :
1. Ancre le CONTEXTE editorial (listing immobilier luxe) — oriente le modele vers un registre visuel specifique
2. Oppose deux esthetiques (lived-in vs sterile catalog) — le modele comprend les paires contrastees et evite activement le rendu "showroom"

Pas de redondance avec les descripteurs DSLR (f/8, grain, vignettage) qui sont des parametres TECHNIQUES de camera. La directive atmospherique est un parametre de DIRECTION ARTISTIQUE. Les deux operent a des niveaux differents.

Presente uniquement dans le builder generique (l. 431) — les builders par type de piece n'en beneficient pas. A considerer pour extension future.

---

## Modification 4 — Outdoor

**Verdict : A COMPLETER**

Les furniturePrompts outdoor dans outdoor-styles.ts n'ont PAS de mood sentences. Ils commencent directement par la description technique ("Contemporary outdoor furniture: modular low-profile..."). C'est coherent avec le style compact Flux, mais les builders outdoor Responses API beneficieraient d'une phrase d'intention (ex: "A contemporary urban terrace with clean geometric lines and restrained planting").

Les builders outdoor (l. 616-656) n'ont PAS la condensation du builder indoor — ils utilisent des directives explicites separees. C'est correct : les contraintes outdoor sont differentes (sky, guard rails, vegetation) et la fusion n'apporterait rien.

Le FLUX_NEGATIVE_PROMPT (l. 559-560) est partage indoor/outdoor. Les termes "stretched walls", "extra windows", "extra doors" sont inutiles en outdoor mais inoffensifs. Il manque des termes outdoor specifiques : "swimming pool, hot tub, built-in BBQ, pergola" (elements que le modele pourrait halluciner en exterieur).

**Recommandation** : creer un FLUX_NEGATIVE_PROMPT_OUTDOOR avec les termes specifiques, ou ajouter des termes outdoor au negative existant quand le mode outdoor est detecte.

---

## Resume

| Modification | Verdict | Action requise |
|---|---|---|
| 1 — Mood sentences | VALIDE | Aucune |
| 2 — Condensation | MODIFIE | Ajouter "not blocking radiators" dans la parenthese |
| 3 — Atmosphere directive | VALIDE | Considerer extension aux builders par type |
| 4 — Outdoor | A COMPLETER | Mood sentences outdoor + negative prompt outdoor |
