# Protocole d'amélioration des prompts — Versiroom

> Document de référence. TOUS les agents (Yann, Lucas, Camille, @ia, @fullstack) DOIVENT lire ce document avant de toucher un prompt.
> Date : 2026-03-27 | Version : 1.0

---

## 1. Grille de validation pondérée (critère n°1 = géométrie)

| # | Critère | Poids | Description | Vérification |
|---|---|---|---|---|
| G1 | **Préservation géométrie** | ×3 | Angle caméra, perspective, vanishing points, dimensions pièce IDENTIQUES à l'input | Superposition visuelle input vs output |
| G2 | **Préservation éléments structurels** | ×3 | Fenêtres, portes, murs — même position, même taille, même NOMBRE. Zéro ajout, zéro suppression | Comptage éléments input vs output |
| G3 | **Pas de hallucination architecturale** | ×2 | Pas de fenêtre inventée, pas de porte ajoutée, pas de mur déplacé, pas de voûte aplatie | Comparaison structurelle |
| G4 | **Préservation équipements fixes** | ×2 | Radiateurs, convecteurs, prises (masquées en P1 = OK), thermostats | Vérification visuelle |
| G5 | **Fidélité stylistique** | ×2 | Le résultat correspond au style promis (mobilier, palette, ambiance) | Audit agent expert (Yann/Camille) |
| G6 | **Crédibilité photographique** | ×2 | Ressemble à une photo DSLR, pas à du CGI. Grain, ombres, lumière cohérents | Audit agent expert (Lucas) |
| G7 | **Préservation lumière** | ×1 | Température couleur, direction ombres, gradients conservés. Pas de warm shift | Comparaison colorimétrique |
| G8 | **Composition / échelle** | ×1 | Mobilier proportionné à la pièce, distribué en profondeur | Audit agent expert |
| G9 | **Préservation plafond** | ×1 | Voûtes, poutres, caissons gardent leur géométrie 3D. Pas de lissage | Comparaison P1 vs input |
| G10 | **Pas de marqueur IA** | ×1 | Pas de lampadaire arc générique, pas de duplication, pas de CGI-clean | Checklist visuelle |

**Score = somme pondérée / 18 × 10** (total poids = 18)

**Seuils** :
- ≥ 9.0 : GO production
- 8.0-8.9 : GO avec réserves documentées
- < 8.0 : NO-GO — investigation requise
- G1 ou G2 < 7 : **BLOQUANT** — régression géométrie inacceptable

---

## 2. Catégories de modification

### APPLIQUER (zéro risque)
- Le changement est **ADDITIF** : ajoute une précision SANS modifier le texte existant
- Ne touche PAS aux constantes partagées (DSLR_LINE, CEILING_PRESERVATION, LIGHT_PRESERVATION, CAMERA_PRESERVATION)
- Ne touche PAS aux builders génériques (buildSurfacesResponsesPrompt, buildFurnitureResponsesPrompt) sauf ajout d'une phrase EN FIN de prompt
- Exemple : ajouter "(tall narrow upright feathery grass plume)" après "Calamagrostis Karl Foerster"

### REPORTER (test nécessaire)
- Le changement touche un élément partagé par plusieurs styles ou builders
- Le changement remplace un mot/phrase existant (SUBSTITUTIF)
- Le changement impacte une constante globale
- **Procédure** : générer 3 images du benchmark avec et sans le changement, comparer les scores

### REJETER
- Le changement contredit une règle CLAUDE.md
- Le changement casse le pipeline 2 passes (mélange surfaces + mobilier)
- Le changement ajoute des directives de lumière dans les stylePrompts
- Le changement mentionne curtains/drapes/windows

---

## 3. Procédure step-by-step

```
1. IDENTIFIER   → Audit agent, feedback utilisateur, ou logs production
2. CLASSIFIER   → P0 (bloquant) / P1 (haute) / P2 (moyenne)
3. PROPOSER     → Diff exact (old_string → new_string) dans le bon fichier
4. TRIER        → APPLIQUER / REPORTER / REJETER (critères section 2)
5. SI APPLIQUER → Implémenter, bump PROMPT_VERSION, commit avec changelog
6. SI REPORTER  → Générer 3 images benchmark avant/après, comparer scores grille §1
7. VÉRIFIER     → Replay 3 générations anciennes avec nouveaux prompts
8. SI RÉGRESSION → REVERT immédiat + documenter pourquoi dans le changelog
```

---

## 4. Règles anti-régression

1. **JAMAIS** modifier un prompt qui fonctionne à ≥8/10 sans test benchmark
2. **JAMAIS** modifier les 4 constantes globales (DSLR_LINE, CEILING_PRESERVATION, LIGHT_PRESERVATION, CAMERA_PRESERVATION) sans test sur 12 styles indoor + 8 outdoor
3. **JAMAIS** modifier les builders génériques sans test sur 3+ styles ET 3+ types de pièce
4. **TOUJOURS** additif > substitutif. Ajouter une précision plutôt que remplacer un mot
5. **TOUJOURS** incrémenter PROMPT_VERSION à chaque changement de prompt
6. **TOUJOURS** documenter dans le PROMPT_CHANGELOG (section 6) : ce qui a changé, pourquoi, score avant/après
7. **Exception substitutive autorisée** : remplacement d'un marqueur IA générique par une pièce spécifique (ex: arc lamp → Flos IC)
8. **Détection régression modèle** : cron hebdo 3 images benchmark. Si SSIM baisse >0.05 sur ≥2 images → alerte + freeze

---

## 5. Benchmark fixe

### Composition (15 images — à constituer)
- 5 pièces vides intérieures (salon, chambre, SDB, cuisine, entrée)
- 3 pièces avec contraintes (voûte, poutres, double hauteur, convecteur, mur accent)
- 3 pièces conditions difficiles (sombre, fenêtres cramées, chantier brut)
- 4 extérieurs (terrasse, balcon, jardin, rooftop)

### Utilisation
- **Avant chaque bump PROMPT_VERSION** : run complet 15 images
- **Après migration modèle** : run complet + audit agents
- **Cron hebdo** : 3 images (détection changement modèle côté serveur)

### Métriques automatiques
- **SSIM** input vs output : préservation structure (seuil ≥0.65)
- **SSIM** run N vs run N-1 : stabilité entre versions (delta <0.05)
- **Score agents** : grille §1 sur les 15 images

---

## 6. PROMPT_CHANGELOG

| Version | Date | Changements | Pourquoi | Score avant | Score après | Régressé ? |
|---|---|---|---|---|---|---|
| v1-v5 | Sprints 1-7 | Prompts basiques, single-pass | Première implémentation | — | ~3/10 | — |
| v6-v10 | Sprints 8-12 | Pipeline 2 passes, action-dominante | Single-pass régénérait au lieu d'éditer | ~3/10 | ~5/10 | Non |
| v11-v15 | Sprints 13-16 | Split surfacePrompt/furniturePrompt, distribution profondeur | Style écrasait les contraintes préservation | ~5/10 | ~6.5/10 | Non |
| v16-v17 | Sprint 17 | Custom pre-processing GPT-4.1-mini, fix "pixel-identical" | Custom FR brut = 3.3/10. "pixel-identical" = modèle ultra-conservateur | ~6.5/10 | ~7.3/10 | Non |
| v18 | Sprint 18+ | Préservation équipements, texture poutres, murs accent, sol cible | Radiateurs supprimés, poutres lissées, sol "preserved" sur chantier brut | ~7.3/10 | ~7.8/10 | Non |
| v19-v20 | Sprint 19-20 | Builders modulaires par pièce (kitchen, bathroom, etc.) | Cuisine sans plan de travail pas crédible avec "freestanding only" | ~7.8/10 | ~7.9/10 | Non |
| v21 | Sprint 21 | Outdoor styles + itérations exclusives, no wall art | Itération injectait BASE STYLE complet, wall art hallucination | ~7.9/10 | ~8.0/10 | Non |
| v22 | Sprint 22 | Prompt versioning DB, mood sentences, condensation | Audits non corrélables sans version. Mood sentences améliorent composition | ~8.0/10 | ~8.0/10 | Non |
| v23 | Sprint 22b | Corrections Camille outdoor (plafonds, textiles, fontaine) | 2 outdoor avaient des plafonds parasol. Textiles coton→polypropylène | ~8.0/10 | ~8.0/10 | Non |
| v24 | Sprint 22c | Prompts validés Yann/Lucas/Camille (baseline actuelle) | Validation croisée 3 experts | Yann 8.0, Camille 7.8 | Baseline | Non |
| v25 | 2026-03-27 | 5 corrections additives (Flos IC, no duplicate, plantes visuelles, lanternes, matériaux) | Triage @ia : 5 APPLIQUER (additifs), 4 REPORTER (risque régression) | v24 baseline | À mesurer | — |
| v26 | 2026-03-27 | Migration gpt-image-1 → gpt-image-1.5 | @elon : latence /4, coût -20%, qualité +. Zéro changement prompts | v25 | À mesurer | — |

---

## 7. Template de triage

Pour chaque session de modifications, créer `docs/ia/prompt-triage-vNN.md` avec :

```markdown
# Triage prompts vNN

## Baseline
- Score Yann : X/10
- Score Lucas : X/10
- Score Camille : X/10
- Géométrie : X/10

## Recommandations

| # | Source | Priorité | Description | Décision | Justification |
|---|---|---|---|---|---|
| 1 | Yann | P1 | ... | APPLIQUER/REPORTER/REJETER | ... |

## Diffs (APPLIQUER uniquement)

### Rec-N : [description]
- Fichier : `path/to/file.ts`
- old_string : `...`
- new_string : `...`
- Risque régression : AUCUN (additif) / FAIBLE / MOYEN

## Post-application
- PROMPT_VERSION : vN-1 → vN
- Benchmark run : [lien vers résultats]
- Score après : Yann X/10, Lucas X/10, Camille X/10
- Régression détectée : OUI/NON
```

---

**Handoff → tous les agents**
- Ce document est la référence unique pour toute modification de prompt
- Aucune modification de prompt n'est autorisée sans suivre ce protocole
- Le fondateur valide les décisions REPORTER avant test
- G1 (géométrie ×3) et G2 (éléments structurels ×3) sont BLOQUANTS
