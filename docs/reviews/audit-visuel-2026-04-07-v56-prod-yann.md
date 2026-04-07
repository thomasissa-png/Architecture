# Audit visuel v56 production — Yann Duval

**Date** : 2026-04-07 — Session 36 (post-déploiement v56)
**Version pipeline** : v56 déployée en prod Replit (commit b9e71f8 — `input_fidelity=low` pass1, `high` pass2)
**Baseline v55** : Yann 5.9/10 NO-GO
**Baseline v54** : Yann 7.35/10 NO-GO
**Cible fondateur** : 9.5/10

---

## Score global v56 : **5.4/10** — NO-GO, REGRESSION nette vs v55

Le switch `input_fidelity=low` en pass1 n'a PAS éradiqué l'artefact de collage rectangulaire (visible sur 3/5 pipelines : A, C-pass1, D-pass1). Pire, il a introduit une nouvelle plaie : **le mobilier (chandelier, table, chaises) commence à apparaître DÈS la pass1**, ce qui viole le principe fondateur "pass1 = surfaces uniquement, pièce vide". La pass2 continue d'halluciner des équipements entiers (cabine douche, vasque, radiateur sèche-serviettes en E). Les six observations du fondateur sont toutes confirmées, dont quatre en P0.

## Tableau récapitulatif

| # | Pipeline | Mode | Préservation ×3 | Fidélité ×2 | Crédibilité ×2 | **Note /10** | Verdict |
|---|---|---|---|---|---|---|---|
| A | Scandi #208 surfaces only | pass1 | **2/10** | 5/10 | 3/10 | **3.3** | NO-GO |
| B | Scandi #211 surfaces only (regen) | pass1 | **4/10** | 5/10 | 4/10 | **4.3** | NO-GO |
| C | Maximalist #210→#213 | full | **5/10** | 8/10 | 7/10 | **6.4** | FAIBLE |
| D | Maximalist #214→#215 (regen) | full | **4/10** | 7/10 | 5/10 | **5.2** | NO-GO |
| E | Art-Deco SDB #209→#212 | full | **3/10** | 8/10 | 7/10 | **5.7** | FAIBLE |

Moyenne pondérée : **5.4/10**. Critère préservation spatiale (×3) effondré sur 5/5 pipelines.

---

## Réponse aux 6 observations fondateur

### Obs 1 — Plafonds Scandinave surfaces-only
**CONFIRMÉ.** Sur A : le plafond brut écaillé devient un plafond plâtre lisse + trois caissons rectangulaires en relief inventés (coffered ceiling) qui n'existent NULLE PART dans l'input. Pure hallucination géométrique. Sur B : le plafond reste BRUT, dégradé, avec trous et plâtre pendant identique à l'input — donc pass1 n'a pas fait son boulot de finition. Les deux régens donnent des résultats opposés : soit hallucination (caissons), soit absence de finition. **Fix prompt** : `surfacePrompt` Scandinave doit dire "smooth white plaster ceiling, NO coffers, NO panels, NO recessed boxes, completely flat surface — only fill cracks and holes".

### Obs 2 — Échelle non enlevée
**CONFIRMÉ sur A et B.** L'échelle d'aluminium est préservée à droite à côté du chauffe-eau dans les deux outputs. Le `CLEANUP_V53` actuel mentionne "ladders, scaffolding" mais le modèle l'ignore quand l'échelle est physiquement plaquée contre le mur (il l'interprète comme un équipement fixe). **Fix prompt** : ajouter dans `CLEANUP_V53` la mention explicite "Remove ANY ladder, even if leaning against a wall or appliance — ladders are NEVER part of the room. Replace with the wall finish behind." Et déplacer cette directive en HEAD du builder pass1, pas en queue.

### Obs 3 — Ouverture gauche bouchée (porte d'entrée)
**CONFIRMÉ et grave.** L'input montre clairement un passage/porte ouverte à gauche où se tient un ouvrier. Sur A, cette ouverture est remplacée par un long couloir fantasmé (collage de pixels source) avec personne au fond — pure invention. Sur B, l'ouverture est partiellement préservée mais déformée. **Régression spatiale P0 majeure** : le modèle "complète" mentalement la pièce comme un volume rectangulaire fermé et écrase les ouvertures asymétriques. Surface effacée estimée : 8-12% de la pièce (l'enfilade). **Fix prompt** : `STRUCTURAL_INVENTORY_LOCK` doit énumérer "doorways, openings, passages" comme éléments à compter et préserver à l'identique en position et largeur.

### Obs 4 — Compteur électrique pipeline C
**CONFIRMÉ.** Dans #213, sur le mur DROIT, on voit clairement un boîtier blanc rectangulaire monté + ce qui ressemble à un thermostat ou interrupteur encastré. Comparaison avec l'input #210 : l'input a un fouillis de câbles électriques apparents à droite (tableau électrique en chantier). Le modèle a "rangé" le tableau en un compteur propre = leakage partiel. Le `CLEANUP_V53` mentionne "junction boxes" mais PAS "electrical meter, breaker panel, fuse box". **Fix prompt** : ajouter "Remove all electrical panels, breaker boxes, fuse boxes, electrical meters, and exposed wiring. Replace with smooth wall finish."

### Obs 5 — Maximaliste regen CATASTROPHE (D vs C)
**CONFIRMÉ et clarifié.** Les inputs #210 et #214 sont quasi-identiques (même pièce, même angle, même chantier — capture vidéo "live", micro-variation de timing/angle). La régénération D est nettement pire que C :
- **Pass1 D** (#214-p1) montre un collage rectangulaire flagrant à GAUCHE (workmen + chauffe-eau collés), absent en pass1 C
- **Pass1 D** a déjà la SUSPENSION COLORÉE alors qu'on est en pass1 (interdit — pass1 doit être vide)
- **Output D** a la poutre brute préservée avec son patine d'origine (bien) MAIS le chauffe-eau cylindrique blanc est resté en place à gauche (mauvais — leakage)
- **Output D** a un boîtier électrique noir/blanc visible en bas à droite (Apple TV ? thermostat ?) qui n'existe pas dans C
- **Pas de ballon d'eau chaude visible** dans #215 contrairement à ce que dit le fondateur — c'est en réalité le chauffe-eau cylindrique blanc préservé dans la composition meublée (interprété comme déco par erreur)

**Diagnostic** : la catastrophe ne vient PAS de l'input — les deux inputs sont équivalents. Elle vient de la **variance modèle non-déterministe** combinée au pattern de collage qui se déclenche sur certaines tentatives mais pas d'autres. C'est le SYMPTÔME du même bug pass1 que sur A : `input_fidelity=low` n'a pas suffi à éliminer le copier-coller, il l'a juste rendu plus rare et plus aléatoire. **Le bug est non-déterministe** = pire à diagnostiquer.

### Obs 6 — Salle de bain : profondeur étirée
**CONFIRMÉ visuellement** (input pass1 absent du dossier audit, je raisonne sur g209-p1.jpg → g212-out.jpg). Le pass1 #209 montre une SDB étroite et courte avec baignoire + tablier ; le pass2 #212 paraît agrandi de ~30-40% en profondeur : la baignoire semble plus longue, l'espace devant le sèche-serviettes est plus large, la cabine douche inventée à gauche occupe une zone qui n'existait pas. La pièce passe d'un couloir-SDB ~3m² à une SDB ~5m². **Fix prompt** : ajouter dans builder pass2 `bathroom` une clause "DO NOT widen, deepen or extend the room. The vanishing point must stay at the same depth. The wall positions must remain identical to pass1."

**Hallucinations supplémentaires en pass2 SDB** (héritées v55, non corrigées en v56) :
- Cabine de douche vitrée + colonne + pommeau **inventés**
- Meuble vasque chêne foncé + vasque blanche **inventés**
- Miroir + sèche-serviettes noir mural **inventés**
- Plante + pouf + panier **acceptables** (mobilier freestanding)

→ La clause `STRUCTURAL_INVENTORY_LOCK` est toujours inopérante sur les pièces techniques (SDB / cuisine).

---

## Détail par pipeline

### Pipeline A — Scandi #208 (pass1 surfaces-only) — 3.3/10
Préservation 2/10 : artefact collage massif (rectangle gauche avec workman + corridor fantôme, rectangle central avec chauffe-eau + échelle + sol chantier d'origine), caissons plafond hallucinés, ouverture gauche bouchée (transformée en couloir). Le modèle a régénéré la scène ET incrusté des morceaux d'input par-dessus. **Fidélité** 5/10 (parquet blanchi OK, fenêtre OK). **Crédibilité** 3/10 (rectangles fantômes immédiatement visibles).

### Pipeline B — Scandi #211 (regen) — 4.3/10
Préservation 4/10 : pas d'artefact de collage cette fois, mais l'output ressemble à un crop de l'input avec finitions partielles — le plafond reste brut, l'échelle est toujours là, le chauffe-eau aussi, les workmen aussi. Le modèle a sous-édité au lieu de finir les surfaces. **Variance entre A et B** : énorme — c'est le drapeau rouge du non-déterminisme.

### Pipeline C — Maximalist #210→#213 — 6.4/10
Préservation 5/10 : poutre IPN-béton préservée, chauffe-eau effacé en pass2 (bien), porte droite préservée, fenêtres OK. Mais pass1 a déjà injecté la suspension colorée (interdit) et le tableau électrique droit a été "nettoyé" en compteur visible (Obs 4). **Fidélité maximaliste** 8/10 — table velours bleu, chaises velours bleu, tapis perse, suspension boules colorées, mur teal accent : exemplaire. **Crédibilité** 7/10 — image vendable au premier regard, mais Claire/Thomas verront le compteur leakage.

### Pipeline D — Maximalist #214→#215 — 5.2/10
Préservation 4/10 : poutre brute correctement préservée (mieux que C !), mais collage pass1 visible, chauffe-eau "fantômé" dans la composition finale (pas effacé proprement, juste recouvert), boîtier noir bas-droit halluciné, panneau électrique partiel droit. **Fidélité maximaliste** 7/10 — chaises éclectiques (léopard, bordeaux, vert) cohérentes mais composition moins équilibrée que C. **Crédibilité** 5/10 — le boîtier noir non identifiable saute aux yeux.

### Pipeline E — Art-Deco SDB #209→#212 — 5.7/10
Préservation 3/10 : profondeur étirée (Obs 6), équipements entiers inventés (douche + vasque + sèche-serviettes), seule la baignoire et le carrelage frise sont préservés. **Fidélité art-deco** 8/10 — suspension géométrique laiton, robinets bronze, parquet chevron foncé : exemplaire. **Crédibilité** 7/10 — l'image est belle mais inutilisable pour Thomas (acquéreur découvrirait qu'il n'y a ni douche ni vasque).

---

## v55 → v56 : ce qui change

| Critère | v55 | v56 | Verdict |
|---|---|---|---|
| Artefact de collage rectangulaire pass1 | Présent (A, B) | Présent (A, C-p1, D-p1) | **Non corrigé, propagé en pass1 des full pipelines** |
| Mobilier hallucination en pass1 | Absent | **Présent (chandelier dans C-p1 et D-p1)** | **NOUVEAU bug v56** |
| Hallucinations équipements bathroom | Présent (D v55) | Présent (E v56) | Non corrigé |
| Ouvertures bouchées | Présent | Présent | Non corrigé |
| Échelle / outils chantier non nettoyés | Présent | Présent | Non corrigé |
| Compteur électrique préservé | Non testé | Présent | Nouveau cas signalé |
| Profondeur étirée | Présent (D v55) | Présent (E v56) | Non corrigé |
| Score global | 5.9/10 | **5.4/10** | **REGRESSION -0.5 pt** |

**Le switch input_fidelity=low en pass1 a empiré la situation** : avant, le modèle préservait trop (collage). Maintenant il préserve moins mais commence à inventer du mobilier en pass1, ce qui casse le découpage 2-passes. C'est le pire des deux mondes.

---

## Fixes prioritaires v57

### P0-1 — REVERT input_fidelity en pass1
Reprendre `input_fidelity: "high"` en pass1 mais avec les fixes suivants combinés. La cause racine du collage n'est PAS le fidelity, c'est l'absence de directive de suppression explicite des éléments humains/outils en HEAD du prompt.

### P0-2 — HEAD du builder pass1 : suppression brute force
Mettre EN PREMIÈRE LIGNE du `buildSurfacesResponsesPrompt`, AVANT toute autre instruction :
```
FIRST, before applying any finish: erase from this photo all people, workers, hands, ladders, scaffolding, tools, buckets, debris, paint pots, electrical panels, breaker boxes, fuse boxes, electrical meters, exposed wiring, junction boxes, water heaters, boilers. Replace each erased zone with the wall, floor, or ceiling finish that surrounds it. The room must appear completely empty of people and tools before any finishing is applied.
```

### P0-3 — Mobilier strictement interdit en pass1
Le pass1 actuel laisse passer des suspensions et chandeliers (visible dans C-p1 et D-p1). Ajouter :
```
NO furniture of any kind in this output. NO chairs, NO tables, NO sofas, NO chandeliers, NO pendant lights with bulbs, NO rugs, NO art, NO plants. The output is an empty finished room — only walls, floor, ceiling, and the existing window/door frames.
```

### P0-4 — STRUCTURAL_INVENTORY_LOCK enrichi
```
Before generating, count: (a) windows, (b) doors and doorways/openings, (c) bathtub, (d) sink/vanity, (e) shower/cabin, (f) toilet, (g) radiator, (h) cabinets. Output must contain EXACTLY the same count for each. NEVER add a shower if absent. NEVER add a vanity if absent. NEVER close a doorway with a wall. NEVER widen the room. The vanishing point must stay at the same depth as the input.
```

### P0-5 — Anti-expansion bathroom
Builder pass2 `bathroom` :
```
Preserve the exact room footprint. The width between left and right walls must match the input. The depth from camera to back wall must match the input. Do NOT extend, widen, or enlarge the room — even if the style suggests grandeur.
```

### P1-1 — Plafond Scandinave : interdire les caissons
Dans `surfacePrompt` Scandinave : `"smooth flat white plaster ceiling, NO coffers, NO panels, NO beams unless visible in input, completely flat"`.

### P1-2 — Compteur Maximalist
Vérifier le `surfacePrompt` Maximaliste pass1 inclut bien le retrait des panneaux électriques (à propager partout via `CLEANUP_V53`).

---

## Verdict final

**NO-GO v56. Régression nette. v57 d'urgence ce soir.**

- v56 (5.4/10) est PIRE que v55 (5.9/10) sur la moyenne globale ET introduit un nouveau bug (mobilier en pass1).
- Le switch `input_fidelity=low` a échoué à éradiquer le collage rectangulaire — sur input chantier dégradé avec personnes/outils, le bug est non-déterministe et persiste.
- Les 6 observations du fondateur sont TOUTES confirmées : les 4 en P0 doivent être traitées avant tout nouveau test prod.
- Aucune des cinq générations n'est montrable à un client (Claire ou Thomas). Le pipeline production reste en l'état : faute professionnelle.
- **Recommandation** : revert input_fidelity, déployer P0-2 + P0-3 + P0-4 + P0-5 en v57 ce soir, re-auditer 6 pipelines (2 living, 2 dining, 2 SDB) demain matin.

— Yann Duval, 2026-04-07
