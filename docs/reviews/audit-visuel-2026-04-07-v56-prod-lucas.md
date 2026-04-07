# Audit visuel v56 PROD — Lucas Moreau

**Date** : 2026-04-07
**Session** : 36 (post-deploy v56, `input_fidelity=low` pass1)
**Périmètre** : 5 pipelines, 10 générations (#208-215)
**Baseline** : v55 = 5.4/10 (Lucas) / v54 = 7.10/10

---

## Résumé exécutif

**Score global v56 : 4.8/10** (régression de -0.6 vs v55, -2.3 vs v54).

**Verdict architectural : la recommandation de passer `input_fidelity` à `"low"` en passe 1 était ERRONÉE.** Je révise publiquement ma position de session 36. L'artefact de compositing déterministe que j'avais identifié en session 35/36 **n'a PAS disparu** — il est au contraire devenu PLUS visible, car le fond environnant est maintenant fortement restylé tandis que les zones-rectangles préservées contiennent toujours des pixels bruts de l'input. Le contraste visuel entre les deux zones est maximal. v56 cumule donc les défauts de v55 (artefact compositing) + nouveaux défauts spécifiques à "low" (préservation spatiale dégradée, ouvertures bouchées, variance énorme).

**Verdict GO/NO-GO : NO-GO. Rollback vers v54 (fidelity=high) ou investigation API-level urgente.**

---

## Tableau récapitulatif

| # | Pipeline | Style | Preservation | Rendu | Compositing | Note |
|---|----------|-------|--------------|-------|-------------|------|
| A | #208 Scandi living | scandinavian | 3/10 | 7/10 | **PRÉSENT** (2 rectangles) | **4.5/10** |
| B | #211 Scandi regen | scandinavian | 4/10 | 5/10 | **PRÉSENT** (zones input) | **4.5/10** |
| C | #213 Maximalist v1 | maximalist | 6/10 | 8/10 | partiel (compteur R) | **6.8/10** |
| D | #215 Maximalist regen | maximalist | 3/10 | 7/10 | **PRÉSENT** (ballon+compteur+poutre) | **4.2/10** |
| E | #212 Art Deco SDB | art-deco | 4/10 | 8/10 | non-compositing (dolly) | **5.2/10** |

Moyenne pondérée : **4.8/10**.

---

## Réponse aux 6 observations fondateur

### Obs 1 — Plafonds Scandi mal nettoyés (A+B)

**Confirmé + aggravé.** A : plafond nettoyé avec caissons blancs propres MAIS une large zone centre-droite préserve la texture brute de l'input (plâtre écaillé, poutre apparente) sous forme de rectangle avec bords verticaux nets. B : plafond presque entièrement préservé en état brut (béton, taches d'humidité, structure porteuse visible), seul le coin haut-gauche est "nettoyé". C'est le mécanisme de compositing déterministe — le modèle protège certaines zones input au pixel près et restyle le reste.

### Obs 2 — Échelle non enlevée (A+B)

**Confirmé.** L'échelle est préservée au centre de l'image dans A (devant le ballon d'eau) et dans B (même position). Elle est **INCLUSE dans le rectangle de pixels préservés** — ce n'est pas une hallucination, c'est un leakage direct. Le prompt CLEANUP ne peut rien y faire : les pixels de cette zone ne sont simplement pas régénérés. Position exacte : x≈55-65%, y≈30-75%.

### Obs 3 — Ouverture gauche bouchée (A+B) — P0 SPATIAL

**Confirmé, critique.** L'input a une ouverture architecturale claire à gauche (porte/passage vers couloir, visible par la profondeur lumineuse). Dans A : l'ouverture est totalement bouchée par un mur blanc plat, remplacée par un petit miroir vertical. Dans B : idem, mur opaque + personnage partiellement visible dans ce qui semble un miroir. ~100% de la zone ouverte est effacée. Les lignes de fuite vers ce couloir ont été supprimées → la pièce paraît fermée alors qu'elle est ouverte.

**Mécanisme suspecté** : `fidelity=low` donne au modèle la licence de "simplifier" les zones de faible prior (couloir sombre) et de les remplacer par un mur plat — alors qu'en `fidelity=high` le modèle respectait mieux la topologie. C'est une régression directe du switch v56.

### Obs 4 — Compteur électrique visible Maximalist v1 (C)

**Confirmé.** Dans #213, objet rectangulaire gris/bleu à x≈92%, y≈40-55% qui ressemble à un tableau/compteur électrique halluciné (l'input n'en a pas à cette position). C'est un mix leakage (pixels input bruts dans cette zone) + hallucination (le modèle interprète la zone non-nettoyée comme un équipement technique et ajoute des détails type interrupteurs). CLEANUP_V53 ne couvre probablement pas "electrical panels / breaker boxes / meters" explicitement — à vérifier.

### Obs 5 — Maximalist regen catastrophe (D vs C)

**Inputs C et D visuellement quasi-identiques** (même pièce, même angle, même conditions de lumière, quelques différences mineures d'encombrement/personnages). Les md5 diffèrent mais c'est du bruit.

**Différences output** :
- C : plafond propre, 1 défaut (compteur droite), meubles bien proportionnés, chaises homogènes.
- D : plafond dégradé (poutre brute leakée), **ballon d'eau chaude massif préservé à gauche**, compteur droite aussi, chaises hétérogènes (probablement délibéré Maximaliste mais mauvaise cohésion).

**Verdict** : le problème est dans le **pipeline, pas dans l'input**. La variance est énorme sur inputs quasi-identiques → le seed/déterminisme v56 est pire qu'en v55. Hypothèse : `fidelity=low` donne plus de latitude au modèle, qui entre dans des "modes" de génération différents selon un micro-bruit d'input. **Moins prévisible, plus variable, plus dangereux en production.**

### Obs 6 — SDB profondeur agrandie (E) — analyse photo

Pass1 (#209) : pièce courte, baignoire occupe ~50% de la largeur cadrée, profondeur apparente ~2.0-2.2m, focale ~24mm équivalent.

Output (#212) : mêmes murs (carreaux motif préservés) MAIS ajout d'une colonne de douche + meuble vasque + sèche-serviettes **dans la même profondeur de champ** → la pièce paraît 1.6x plus longue. Les lignes de fuite convergent toujours vers le fond mais **plus loin**.

**Diagnostic** : ce n'est PAS un changement de focale (les distortions grand-angle latérales sont identiques). C'est un **dolly back** : le modèle a reculé virtuellement la caméra de ~80cm pour caser les éléments ajoutés (vasque, sèche-serviettes, chevalet) sans comprimer le premier plan. L'agrandissement apparent est d'environ **+60% en profondeur**.

**Fix prompt proposé v57** :
```
Preserve apparent focal length and camera distance EXACTLY.
Do NOT dolly back. Do NOT zoom out.
If new furniture does not fit in the visible frame, crop it — do not expand the room.
The visible wall area, floor area, and ceiling area must match the input pixel by pixel.
```

---

## Analyse : artefact de compositing v55 → v56

**Hypothèse session 35/36** : le pipeline applique un compositing déterministe qui préserve certaines zones input au pixel près (rectangles avec bords verticaux/horizontaux nets), et régénère le reste.

**Test v56** : disparu ? **NON. Artefact PRÉSENT sur 4/5 pipelines**, plus visible qu'en v55.

**Preuves visuelles** :
- **#208** : deux rectangles nets (personnage à gauche + ballon/échelle au centre) avec bords verticaux à x≈18% et x≈55-65%.
- **#211** : même pattern, personnage gauche + zone ballon/échelle centre.
- **#214 pass1** : **preuve la plus spectaculaire** — rectangle central parfaitement net contenant pixels input bruts (personnage, ballon, câbles) tandis que le reste est restylé en Maximaliste (mur teal, parquet, lustre globes). Bords verticaux au pixel près.
- **#215 output** : ballon d'eau + poutre + compteur préservés en zones distinctes.

**Conclusion** : `input_fidelity=low` **ne désactive pas** le mécanisme de compositing — il le rend plus contrasté. Il faut chercher ailleurs : ce comportement est probablement intrinsèque à la manière dont le tool `image_generation` via Responses API gère les refs visuelles (possible découpe automatique en tiles/patches avec préservation de certains). **À investiguer API-level avec OpenAI**, pas côté prompt.

---

## Triangulation avec Yann

À confronter avec l'audit Yann en parallèle :
- Si Yann note aussi la préservation spatiale à <5/10 → alignement, NO-GO confirmé.
- Si Yann trouve les styles bien restitués (C Maximaliste OK, E Art Deco OK) → alignement avec mon 7-8/10 en rendu.
- Point de friction possible : Yann pourrait être plus clément sur C (Maximaliste convaincant sauf compteur). Je maintiens 6.8 car un défaut équipement mural en zone visible = -1.5 pt structurel.

---

## Fixes prioritaires v57

**P0 — Rollback immédiat `input_fidelity=high` en passe 1.** v56 est pire que v55. La justification "high trop conservateur" était une mauvaise lecture : le vrai problème est le compositing, pas le niveau de fidélité.

**P0 — Investigation API-level compositing.** Contacter OpenAI support ou tester avec d'autres paramètres (image input via base64 vs URL, single image vs multi-image, `previous_response_id` pattern) pour comprendre pourquoi certaines zones sont préservées au pixel près.

**P1 — Prompt anti-dolly-back** (voir fix proposé Obs 6) pour pipelines bathroom/small rooms.

**P1 — Enrichir CLEANUP_V53** avec : "electrical panel, breaker box, meter, junction box with terminals".

**P2 — Test contrôlé** : régénérer #208 avec `fidelity=high` + `fidelity=low` + `fidelity=auto` sur le même input pour mesurer si l'un des trois supprime le compositing. Si non → le bug est API.

**P2 — Considérer un bypass architectural** : passer temporairement au pipeline mask-based (inpainting explicite des zones non-nettoyées) en attendant résolution.

---

## Verdict GO/NO-GO v56

**NO-GO. ROLLBACK v54.**

v56 = 4.8/10. v55 = 5.4/10. v54 = 7.10/10. La trajectoire est descendante depuis 2 sessions. Le switch `fidelity=low` a aggravé la préservation spatiale sans résoudre le compositing. **Je regrette ma recommandation de session 36** et recommande :

1. Revert `input_fidelity` à `"high"` (ou `"auto"`) dans route.ts passe 1 — immédiat.
2. Ouvrir ticket OpenAI sur le comportement de compositing déterministe observé.
3. Suspendre v56 en prod jusqu'à investigation.

Score v56 global : **4.8/10 — artefact compositing PERSISTE et AGGRAVÉ**.

---

*Lucas Moreau — ex-Midjourney, ex-Getty AI Lab, ex-Sotheby's Digital*
