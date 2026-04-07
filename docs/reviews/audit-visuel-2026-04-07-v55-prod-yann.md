# Audit visuel v55 production — Yann Duval

**Date** : 2026-04-07 — Session 36 (bonus post-déploiement)
**Version pipeline** : v55 déployée en prod Replit
**Baseline** : audit v54 Yann 7.35/10 (NO-GO)
**Cible fondateur** : 9.5/10

---

## Score global v55 : **5.9/10** — NO-GO

La v55 montre une régression nette par rapport à la v54. Les pipelines complets (C et D) sont parfois crédibles mais au prix de hallucinations architecturales majeures (plafonds, portes, baignoires réinventés). Les pipelines surface-only (A/B) sabordent littéralement l'image : incrustations fantômes, collages visibles, preservation spatiale catastrophique. Le fondateur a raison : "pas joli joli" et "cata" sont les bons mots.

## Tableau récapitulatif

| # | Pipeline | Room | Mode | Préservation ×3 | Fidélité ×2 | Crédibilité ×2 | **Note /10** | Verdict |
|---|---|---|---|---|---|---|---|---|
| A | Scandi living #200 | living | pass1 only | **3/10** | 6/10 | 4/10 | **4.1** | NO-GO |
| B | Scandi living #202 | living | pass1 only (regen) | **3/10** | 6/10 | 4/10 | **4.2** | NO-GO |
| C | Scandi dining #203→#205 | dining | pipeline complet | **5/10** | 8/10 | 7/10 | **6.4** | FAIBLE |
| D | Japandi bathroom #201→#204 | bathroom | pipeline complet | **4/10** | 8/10 | 8/10 | **6.1** | FAIBLE |

Moyenne pondérée : **5.9/10**. Critère n°1 (préservation spatiale) effondré sur 4/4 pipelines → aucune note ne peut dépasser 7/10 par règle interne (×3).

---

## Pipeline A — Scandinavian living #200 (pass1 seule)

**ALERTE PRÉSERVATION SPATIALE : 3/10.** L'output n'est PAS le même espace que l'input.

Défauts observés :
- **Collage fantôme visible** : un rectangle translucide contenant un bout de la scène d'origine (chauffe-eau cylindrique, personnage, mur brique) est incrusté par-dessus une nouvelle scène régénérée. On voit littéralement les bords du rectangle. C'est un artefact de compositing du modèle — signature d'une édition ratée.
- **Plafond réinventé** : l'input a une poutre principale + un plafond très abîmé avec trous et plâtre pendant. L'output lisse presque tout et conserve juste la poutre centrale comme élément décoratif — la géométrie de ruine est effacée (OK pour finition propre) mais les nervures secondaires disparaissent.
- **Sol** : transformation chantier → parquet blanchi, cohérente avec le style.
- **Perspective** : légèrement altérée, la pièce paraît plus étirée en profondeur.
- **Clause ARCHITECTURAL_HONESTY** : clairement inopérante ici — le modèle a composité deux images au lieu d'éditer.

**Fidélité scandinave** : 6/10, parquet blanchi OK, mais le luminaire cloche "PH5-style" est présent alors qu'il n'est pas demandé en pass1 surface-only sur certains flows — à vérifier.

## Pipeline B — Scandinavian living #202 (regen même input)

Quasi-identique à A avec le MÊME artefact de collage rectangulaire. La seule différence : le luminaire est encore plus massif, le vieux radiateur rouge de l'input réapparaît au sol à droite (élément non demandé). **Déterminisme : haut mais dans le mauvais sens** — le modèle reproduit la même erreur structurelle d'une regen à l'autre. Le bug de compositing est SYSTÉMIQUE, pas aléatoire.

→ Insight : sur cet input spécifique (chantier très dégradé avec personnages, chauffe-eau, mur brique apparente), input_fidelity=high en pass1 déclenche un pattern de "copier-coller" d'une région source dans une scène régénérée. Le modèle n'arrive pas à fusionner.

## Pipeline C — Scandinavian dining #203→#205

**Réponse question 3 : OUI, l'output livre bien une SALLE À MANGER.** Table ronde en bois clair + 6 chaises bouclé crème (techniquement 5 visibles + 1 cachée), tapis crème, suspension cloche blanche. Le fix P0-A room_type est **visuellement confirmé en prod** — zéro sofa, zéro coffee table. C'est la seule vraie bonne nouvelle de cet audit.

MAIS :
- **Préservation plafond : 4/10**. Le plafond brut de l'input (poutres IPN métal + béton voûté + zones blanchies) devient en pass1 un plafond béton brut craquelé TRÈS différent géométriquement. Les poutres IPN disparaissent, remplacées par des craquelures esthétiques. C'est une hallucination de style "loft industriel".
- **Préservation portes/fenêtres** : fenêtre droite OK, mais la porte gauche de l'input (avec homme debout) est remplacée par une porte blanche fermée + pan de mur. Élimination d'ouverture = perte structurelle.
- **Chauffe-eau cylindrique** : préservé (bien).
- **Crédibilité pro** : le rendu final #205 est **visuellement propre et crédible pour Claire** — c'est l'image la plus vendable des 4. Mais si Claire compare avec le chantier réel, elle verra l'hallucination du plafond.
- **Fidélité scandi** : 8/10, excellente — table ronde bois, chaises bouclé, branchage en vase, linge de table.

**Note : 6.4/10** — cappée par la préservation plafond insuffisante.

## Pipeline D — Japandi bathroom #201→#204

**Réponse question 4 : d'où vient le "pas joli joli".**

Rendu final #204 séduisant au premier coup d'œil (palette bois clair + lin + papier washi, très Ilse Crawford). Mais à l'analyse :

1. **Radiateur électrique hallucinaire** : l'input a un convecteur blanc mural bas (équipement conservé = bien). L'output #204 le déplace + lui ajoute un sèche-serviettes noir au-dessus qui n'existait pas. Le convecteur semble flotter car son ancrage mural d'origine n'est plus cohérent avec la nouvelle géométrie du mur carrelé. **C'est ce que voit le fondateur.**
2. **Cabine de douche inventée** : l'input a UNE baignoire encastrée et RIEN d'autre. L'output ajoute une cabine de douche vitrée complète à gauche avec colonne de douche, pommeau, porte verre. **Hallucination structurelle majeure** — la clause ARCHITECTURAL_HONESTY a complètement échoué ici. On passe d'une SDB "baignoire seule" à "baignoire + douche italienne" = la pièce a doublé en équipements.
3. **Meuble vasque inventé** : idem, aucun lavabo dans l'input, l'output ajoute un meuble vasque chêne + miroir rétroéclairé. Pour une SDB japandi complète, c'est crédible mais ce n'est PAS le même espace.
4. **Plafond** : réhausse apparente + suspension washi ajoutée (cohérent avec le style prescrit).
5. **Transition carrelage/baignoire** : effectivement bizarre — le tablier de baignoire blanc se fond visuellement dans le sol parquet sans plinthe ni joint, donnant l'impression d'une baignoire "posée" sans encastrement.
6. **Proportions** : la pièce paraît 2x plus grande en output qu'en input. L'input est une SDB de 4 m² étroite ; l'output semble faire 7-8 m². **Perte d'échelle = problème majeur.**

**Fidélité japandi** : 8/10, exemplaire sur le moodboard. Mais pour Claire (architecte), c'est inutilisable : elle verrait immédiatement qu'on a inventé un lavabo et une douche qui n'existent pas dans le bien. Pour Thomas (marchand de biens), c'est frauduleux — montrer ça à un acquéreur = risque juridique.

**Note : 6.1/10**.

---

## Comparaison v54 → v55 : **MOINS BIEN**

- v54 (7.35/10) avait des problèmes de vaults hallucinés et warm shift, mais la préservation spatiale restait 7/10 sur la majorité des générations.
- v55 descend à 5.9/10 avec DEUX régressions nouvelles :
  - **Artefact de collage rectangulaire** (A et B) absent en v54 — nouveau bug introduit
  - **Hallucinations d'équipements entiers** (douche + lavabo inventés en D) — ARCHITECTURAL_HONESTY inefficace
- Le seul progrès réel : le fix bug room_type (C) — salle à manger = vraie salle à manger. Mais c'est un fix fonctionnel, pas qualitatif.
- **La clause ARCHITECTURAL_HONESTY n'a empêché aucune hallucination structurelle sur ces 4 pipelines.** Elle est inopérante dans sa formulation actuelle.

---

## Fixes prioritaires v56

### P0-1 : Fix artefact collage pass1 surface-only (pipelines A/B)
Cause racine probable : sur input chantier très dégradé avec éléments humains (personnages, chauffe-eau, équipement visible), `input_fidelity: high` force le modèle à "préserver à tout prix" certaines régions pixelales, produisant un compositing mal fusionné.

**Action** : dans `buildSurfacesResponsesPrompt` (pass1), ajouter clause de **suppression explicite des personnes** :
```
Remove any people, workers, or tools visible in the input. They are not part of the room — erase them completely and fill with the surrounding wall/floor finish. Do not preserve human figures.
```
Et tester `input_fidelity: "medium"` au lieu de "high" quand le nombre de pixels "humains" détectés dépasse un seuil (via vision ou heuristique couleur-peau).

### P0-2 : Renforcer ARCHITECTURAL_HONESTY avec inventaire explicite (pipeline D)
La clause actuelle dit "do not invent structures". Insuffisant. Il faut un **verrou par inventaire** :
```
CRITICAL — Structural inventory lock: Before generating, mentally list every fixed element in the input photo (windows, doors, bathtub, sink, shower, radiator, toilet, cabinets). The output MUST contain EXACTLY the same elements, no more, no less. Do NOT add a shower if there is no shower. Do NOT add a sink if there is no sink. Do NOT add a vanity if the input shows only a bathtub. If the input is a minimal bathroom with only a bathtub, the output is a minimal bathroom with only a bathtub — even in japandi style.
```
À propager dans les builders pass1 ET pass2 bathroom + kitchen (les pièces techniques avec équipements fixes).

### P0-3 : Ancrage d'échelle anti-expansion (pipeline D)
La SDB #204 a doublé en surface. Ajouter dans builders pass1 :
```
Preserve room dimensions exactly. If the input shows a 4m² narrow bathroom, the output must show the same 4m² narrow bathroom — do not widen, do not deepen, do not add square meters. The floor area in the output must match the floor area in the input, measured by tile count or plank count if visible.
```

### P1-1 : Préservation plafonds techniques (pipeline C)
Le plafond IPN + béton #203 est devenu un plafond craquelé stylistique en pass1. Ajouter dans `EQUIPMENT_PRESERVATION` :
```
Preserve all visible ceiling structure: exposed beams (wood, metal IPN, concrete), ductwork, electrical conduit, structural ribs. Apply white paint OVER them without changing their shape, position, or metal/concrete texture.
```

### P1-2 : Préservation ouvertures (pipeline C)
La porte gauche du #203 a disparu en pass1. Renforcer :
```
Every door and doorway visible in the input must remain in the output at the same position and same width. Do not close doorways with walls.
```

### P2-1 : Retester déterminisme après P0-1
Une fois le fix collage appliqué, regénérer A et B pour vérifier que le pattern de collage n'apparaît plus. Si persistance → descendre input_fidelity à "medium" globalement sur pass1.

---

## Verdict final

**NO-GO v55. Retour en arrière ou v56 urgente.**

- Le fix room_type (P0-A session 35) est **validé fonctionnellement** en prod — c'est le seul élément à conserver.
- Les 3 autres changements v55 (ARCHITECTURAL_HONESTY, suppression vaults, input_fidelity adaptive) n'ont produit aucun gain mesurable et ont même introduit un nouveau bug (collage pass1).
- Le fondateur ne peut PAS continuer à montrer ces rendus à des clients Claire/Thomas. La SDB avec douche inventée = faute professionnelle. Le salon avec rectangle fantôme = amateur.
- **Recommandation** : déployer v56 avec P0-1, P0-2, P0-3 dans la journée. Re-auditer 6 pipelines (2 salons, 2 SDB, 2 cuisines) avant de valider.

— Yann Duval, 2026-04-07
