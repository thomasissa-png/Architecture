# Audit v48 — Art Deco chambre enfant — Lucas Moreau
**Date** : 2026-04-04 | **Modele** : gpt-image-1.5 | **Version** : v48 (pre-passe vision + anti-grand-angle)

---

## Generation 1 (#161/#162)

**Preservation spatiale : 5/10 — ALERTE : l'espace n'est pas fidele a l'original.**
- Angle de vue : MODIFIE. L'input est un cadrage portrait plongeant vers le coin droit. L'output est un grand-angle recule montrant la piece entiere en vue quasi frontale. Le point de vue a clairement recule et pivote.
- Fenetres : l'input montre 2 fenetres (une principale visible, une seconde partiellement coupee a gauche). L'output ne montre qu'une seule fenetre — la seconde a disparu.
- Convecteur : SUPPRIME. Le radiateur electrique sous la fenetre principale est absent.
- Proportions : la piece parait plus grande et plus haute qu'en realite (effet grand-angle residuel).
- Profondeur : etiree, le mur du fond est visible alors qu'il ne l'etait pas dans l'input.

| # | Critere | Note |
|---|---------|------|
| 1 | Preservation spatiale (x3) | 5/10 |
| 2 | Contraintes lumiere | 6/10 |
| 3 | Vocabulaire photo | 7/10 |
| 4 | Structure prompt | 7/10 |
| 5 | Negative prompting | 4/10 |
| 6 | Compatibilite multi-modeles | N/A |
| 7 | Coherence I/O | 4/10 |
| 8 | Richesse descriptive | 7/10 |
| 9 | Adaptabilite conditions | 6/10 |
| 10 | Rendu final credible (x2) | 7/10 |

**Note ponderee : 5.0/10** (plafonnee par preservation spatiale — fenetre manquante + convecteur supprime + angle modifie)

Points positifs : mobilier Art Deco enfant coherent (tete de lit eventail, motifs geometriques or/noir/vert), herringbone parquet fonce conforme au style, luminaire plafonnier geometrique laiton/verre correct. Le rendu est visuellement seduisant en isolation.

---

## Generation 2 — regeneration (#163/#164)

**Preservation spatiale : 7/10 — Nettement meilleure que la gen 1.**
- Angle de vue : PLUS FIDELE. Le cadrage reste en legere plongee, plus proche de l'input. La piece n'est pas artificiellement elargie.
- Fenetres : 1 fenetre principale bien placee, proportions respectees. La 2e fenetre (partielle a gauche dans l'input) est absente mais c'etait un cadrage limite.
- Convecteur : SUPPRIME (meme defaut).
- Mur accent violet : PRESERVE sur le mur droit. C'est un progres majeur — la gen 1 avait efface tout le violet.
- Profondeur : correcte, proportionnelle a l'input.

| # | Critere | Note |
|---|---------|------|
| 1 | Preservation spatiale (x3) | 7/10 |
| 2 | Contraintes lumiere | 7/10 |
| 3 | Vocabulaire photo | 7/10 |
| 4 | Structure prompt | 8/10 |
| 5 | Negative prompting | 5/10 |
| 6 | Compatibilite multi-modeles | N/A |
| 7 | Coherence I/O | 6/10 |
| 8 | Richesse descriptive | 7/10 |
| 9 | Adaptabilite conditions | 7/10 |
| 10 | Rendu final credible (x2) | 8/10 |

**Note ponderee : 7.1/10**

Points positifs : mur accent violet preserve (directive conditionnelle Sprint 18 fonctionne), tete de lit Art Deco avec liserets dores, luminaire lanterne geometrique laiton spectaculaire, herringbone fonce conforme, mobilier enfant credible (petit bureau, etagere basse, peluches). Composition distribuee en profondeur.

---

## Reponses aux 6 questions v48

| Question | Verdict |
|----------|---------|
| 1. Pre-passe vision | **Partiellement efficace.** Gen 2 montre une preservation nettement meilleure (mur accent, angle). Gen 1 reste une regeneration. La pre-passe aide mais n'est pas deterministe. |
| 2. Grand-angle corrige | **Partiellement.** Gen 2 n'a plus l'effet grand-angle excessif. Gen 1 a encore un recul artificiel. Progression reelle vs v47. |
| 3. resolveChooseOne | **OUI.** Mobilier different : gen 1 a un tapis runner geometrique or/noir + meuble bas ouvert. Gen 2 a un tapis rectangulaire creme/geometrique + bureau noir avec chaise verte. Diversification confirmee. |
| 4. action:"edit" | **Gen 2 = edition credible** (mur accent preserve). **Gen 1 = regeneration** (angle change, fenetre perdue, violet efface). |
| 5. Artefacts | Gen 1 : RAS. Gen 2 : leger flou sur le bord du tapis, acceptable. Pas d'objets flottants. |
| 6. vs v47 Boheme (5.0) | **Gen 2 a 7.1 = +2.1 pts.** Progression significative. Gen 1 a 5.0 = stagnation. Moyenne 6.05 vs 5.0. |

## Defauts recurrents (P0-P1)

- **P0 : Convecteur supprime** dans les 2 generations. La directive EQUIPMENT_PRESERVATION ne fonctionne pas pour les convecteurs electriques bas. Ajouter "low wall-mounted electric convector heater" a la liste explicite.
- **P1 : Ratio I/O** — l'input est portrait, les 2 outputs sont carres/quasi-carres. Le parametre size ne respecte pas le ratio original.
- **P1 : Determinisme** — meme input, resultats tres differents en preservation (5 vs 7). La pre-passe vision devrait stabiliser davantage.
