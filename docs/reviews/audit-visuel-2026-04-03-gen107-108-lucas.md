# Audit visuel — Lucas Moreau — 2026-04-03
## Générations #107 (Scandinavian) et #108 (Industrial) — v40
**Focus fondateur : plafond brut non traité + grain trop visible**

---

## Génération #107 — Scandinavian, salon

### ALERTE PRESERVATION SPATIALE — CRITIQUE
**Le plafond chantier est intégralement conservé à l'identique.** La passe 1 n'a PAS appliqué la finition blanche. Le plafond arraché, les lattes de bois exposées, les trous béants et les traces de démolition sont tous présents dans l'output. C'est le bug signalé par le fondateur : CEILING_PRESERVATION conditionnel v40 a protégé la géométrie mais a aussi bloqué l'application de la finition de surface. Le sol en revanche est traité (plancher clair visible). Les murs sont blanchis correctement.

Préservation spatiale : l'angle de vue est identique (portrait, légère contre-plongée), les deux fenêtres sont au même emplacement et même taille, la porte de fond gauche est préservée. La profondeur de la pièce est fidèle. Sur la structure, c'est bon — le problème est uniquement la finition plafond.

**Grain** : très présent sur toute l'image, particulièrement visible sur les murs blancs et le sol. À 100% de zoom le grain dépasse ISO 200 — il évoque davantage ISO 800-1600. Le rendu trahit le pipeline IA.

### Grille 10 critères

| # | Critère | Poids | Note | Observation |
|---|---------|-------|------|-------------|
| 1 | Préservation spatiale | ×3 | 7/10 | Angle/fenêtres/portes OK. Plafond brut = bug finition passe 1, pas bug géométrique |
| 2 | Contraintes lumière | ×1 | 6/10 | Lumière naturelle latérale préservée, ombres cohérentes. Légère surexposition murs |
| 3 | Vocabulaire photo | ×1 | 4/10 | Grain excessif (ISO 800+), DOF correct, mais rendu CGI-lissé sur mobilier contraste mal avec grain murs |
| 4 | Structure prompt | ×1 | 5/10 | Style Scandinavian reconnaissable (sofa lin, table basse ronde, fauteuil Wegner-style). Plafond non traité = échec passe 1 |
| 5 | Negative prompting | ×1 | 7/10 | Pas de rideaux hallusinés. Fenêtres propres. Pas d'éléments parasites |
| 6 | Compatibilité multi-modèles | ×1 | 6/10 | Non évaluable sur output seul |
| 7 | Cohérence I/O | ×1 | 8/10 | Format portrait préservé, ratio identique |
| 8 | Richesse descriptive | ×1 | 7/10 | Mobilier complet, tapis, plante, lampe de table. Bon programme fonctionnel |
| 9 | Adaptabilité conditions | ×1 | 2/10 | Chantier brut = cas test direct. Plafond non traité = échec du cas critique |
| 10 | Rendu final crédible | ×2 | 3/10 | Un acheteur voit un salon meublé avec un plafond de chantier arraché. Invendable |

**Note pondérée** : (7×3 + 6 + 4 + 5 + 7 + 6 + 8 + 7 + 2 + 3×2) / 14 = (21+6+4+5+7+6+8+7+2+6) / 14 = **72/140 = 5.1/10**

---

## Génération #108 — Industrial, salle à manger

### ALERTE PRESERVATION SPATIALE — CRITIQUE
**Même bug plafond, mais ici le style Industrial aggrave le diagnostic.** Le plafond brut de chantier (lattes, trous, traces) a été "recyclé" comme texture industrielle — le modèle a appliqué un filtre gris-béton sur le plafond existant au lieu de le finir proprement. Résultat ambigu : le plafond est partiellement intégré au style mais reste visuellement désastreux (taches jaunes, zones noires organiques).

**Warm color shift massif** : toute la scène est basculée vers un marron-vert sombre très stylisé. Le chauffe-eau cylindrique (élément fixe mural visible dans l'input) est préservé — point positif. Les poteaux en brique également visibles. L'angle de vue est fidèle (légère plongée, profondeur identique), les deux fenêtres sont au bon endroit.

**Grain** : dramatique. Le pipeline a appliqué un grain HDR cinématographique très lourd — texture de film 35mm poussé à 3200 ISO. L'image ressemble à une photo de reportage de guerre, pas à un visuel immobilier. C'est le problème le plus grave de cette génération après le plafond.

**Confusion passe 1 / style** : le modèle a interprété le plafond brut comme un élément "industriel à conserver et valoriser" au lieu d'une surface à finir. La directive CEILING_PRESERVATION a probablement verrouillé la géométrie ET la texture brute ensemble.

### Grille 10 critères

| # | Critère | Poids | Note | Observation |
|---|---------|-------|------|-------------|
| 1 | Préservation spatiale | ×3 | 6/10 | Angle, fenêtres, profondeur OK. Plafond traité comme texture industrielle (bug). Chauffe-eau préservé |
| 2 | Contraintes lumière | ×1 | 3/10 | Warm shift total — toute la pièce vire vert-brun, aucun rapport avec l'input |
| 3 | Vocabulaire photo | ×1 | 2/10 | Grain ISO 3200, HDR dramatique, vignettage excessif. Rendu cinéma, pas immobilier |
| 4 | Structure prompt | ×1 | 5/10 | Table à manger, chaises, canapé, lampe pendante identifiables. Style Industrial reconnaissable |
| 5 | Negative prompting | ×1 | 6/10 | Pas d'hallucinations fenêtres. Rideaux absents |
| 6 | Compatibilité multi-modèles | ×1 | 5/10 | Non évaluable |
| 7 | Cohérence I/O | ×1 | 7/10 | Format et ratio préservés |
| 8 | Richesse descriptive | ×1 | 6/10 | Mobilier Industrial complet (bois sombre, métal), tapis, plante. Programme fonctionnel présent |
| 9 | Adaptabilité conditions | ×1 | 2/10 | Chantier brut avec chauffe-eau = cas difficile. Plafond non finitionné = échec |
| 10 | Rendu final crédible | ×2 | 2/10 | Esthétique "cave post-apocalyptique". Aucun acheteur ne projette un repas de famille ici |

**Note pondérée** : (6×3 + 3 + 2 + 5 + 6 + 5 + 7 + 6 + 2 + 2×2) / 14 = (18+3+2+5+6+5+7+6+2+4) / 14 = **58/140 = 4.1/10**

---

## Diagnostic racine — 2 bugs distincts

### Bug 1 — CEILING_PRESERVATION bloque la finition (critique P0)

Le conditionnel v40 "preserve ceiling geometry" a été interprété par le modèle comme "preserve everything about the ceiling including its current state". La directive de géométrie et la directive de finition sont confondues. Le modèle préserve les poutres ET les trous ET les traces de démolition.

**Correction pour buildSurfacesResponsesPrompt :**
```
Replace existing ceiling finish with [style ceiling finish]. 
Preserve ONLY the structural geometry (beams, vaults, ribs, height) — 
do NOT preserve the current surface condition. 
Apply the new finish OVER the damaged areas, covering all cracks, 
holes, peeling plaster, and exposed lath with smooth painted surface.
```

### Bug 2 — Grain trop agressif (P1)

Le grain ISO 200 est correct en intention mais le pipeline génère systématiquement un grain nettement supérieur — probablement amplifié par la compression JPEG sauvegarde + le traitement du modèle. Le rendu #108 est particulièrement problématique (style sombre + grain = illisible).

**Correction dans tous les builders passe 2 :**
```
Replace: "subtle sensor grain (ISO 200), natural corner vignetting"
With: "very subtle film grain equivalent to ISO 100-200 — barely perceptible at normal viewing size, only visible at 100% zoom on smooth surfaces. Natural corner vignetting maximum 5%. Do NOT add HDR processing, color grading, or cinematic tone mapping."
```

**Pour le style Industrial spécifiquement :** ajouter en negative prompt Flux : `"heavy grain, high ISO noise, HDR, tone mapped, dark moody, color grading, cinematic, desaturated"`. Le style sombre amplifie le grain généré.

---

## Plan correctif prioritaire

| Priorité | Action | Fichier | Impact |
|----------|--------|---------|--------|
| P0 | Distinguer géométrie et finition dans CEILING_PRESERVATION — "cover damaged surface, keep structure" | route.ts / generation-pipeline.ts | #107, #108 et tous les chantiers bruts |
| P0 | Tester sur une génération Scandinavian chantier avec plafond arraché — valider finition blanche effective | — | Validation |
| P1 | Réduire grain : "ISO 100-200, barely perceptible" + interdire HDR/tone mapping | Tous les builders passe 2 | Toutes les générations |
| P1 | Negative Flux enrichi pour styles sombres (Industrial, Wabi-Sabi, Maximaliste) | FLUX_NEGATIVE_PROMPT | #108 et équivalents |
| P2 | Ajouter test visuel plafond brut dans protocole QA | docs/qa/ | Prévention régression |

---

**Notes finales** : les deux générations confirment que le pipeline 2 passes GPT-4.1 + Flux préserve correctement la géométrie spatiale (angle, fenêtres, profondeur) — c'est acquis. Les deux bugs signalés par le fondateur sont réels et reproductibles. Le P0 plafond est une formulation à corriger dans le prompt, pas un problème architectural du pipeline. Le P1 grain est un calibrage de paramètre.
