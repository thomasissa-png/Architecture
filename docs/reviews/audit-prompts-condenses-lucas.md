# Audit technique prompts condenses v45 — Lucas Moreau

Date : 2026-04-04 | Modele cible : gpt-image-1.5 | Fichiers : generation-pipeline.ts, iteration-prompt.ts

## 1. Longueur totale par prompt (comptage mots)

### Constantes partagees (injectees dans chaque prompt)
- PASS1_PREAMBLE : ~28 mots
- PASS2_PREAMBLE : ~37 mots
- CAMERA_PRESERVATION : 13 mots
- LIGHT_PRESERVATION : 26 mots
- CEILING_PRESERVATION : 28 mots
- COLUMN_PRESERVATION : 14 mots
- WALL_PRESERVATION : 24 mots
- ANTI_FENETRE : 16 mots
- ANTI_INVENTION : 19 mots
- DSLR_LINE : 17 mots

**Socle passe 1 (constantes seules) : ~185 mots** avant injection du surfacePrompt.
**Socle passe 2 (constantes seules) : ~110 mots** avant injection du furniturePrompt.

### Prompts assembles (constantes + builder + surfacePrompt/furniturePrompt)

| Builder | Mots estimés (hors style inject) | + style inject (~40-60 mots) | Total |
|---------|----------------------------------|------------------------------|-------|
| Passe 1 generic | ~230 | +50 | **~280** |
| Passe 1 kitchen | ~235 | +50 | **~285** |
| Passe 2 generic (living) | ~220 | +80 | **~300** |
| Passe 2 kitchen | ~280 | +80 | **~360** |
| Passe 2 bathroom | ~250 | +80 | **~330** |
| Iteration adjust | ~120 | +variable | **~150-180** |
| Iteration furniture | ~140 | +variable | **~170-200** |

**Verdict** : La zone optimale pour gpt-image-1.5 est 150-350 mots. Les builders passe 1 et passe 2 generiques sont dans la zone. Le builder kitchen passe 2 est a la limite haute (~360) a cause du bloc KITCHEN DENSITY (78 mots a lui seul). Les builders iteration sont excellents (150-200 mots). Par rapport aux anciens prompts (~800 mots), la reduction est massive et bien calibree.

## 2. Termes safety filter — etat des lieux

| Terme risque | Passe 1 | Passe 2 | Iteration | Statut |
|-------------|---------|---------|-----------|--------|
| SURGICAL / SURGICAL EDIT | absent | absent | absent | OK — supprime |
| LOCKED (caps) | absent | absent | absent | OK — supprime |
| DO NOT (repete >2x) | 1x passe 2 kitchen, 1x bathroom | 1x generic | 0 | OK — 1 occurrence isolee max |
| NEVER | 1x kitchen density, 1x generic depth | 0 | 0 | ATTENTION — 2 occurrences |
| 95% identical pixels | absent | absent | absent | OK — supprime |
| EXACTLY (caps) | 1x outdoor passe 1 ("PRESERVE EXACTLY") | 0 | 0 | ATTENTION — 1 occurrence |
| COMPLETELY EMPTY (caps) | toutes passe 1 | 0 | 0 | RISQUE MOYEN — repete 8x |

**Les termes les plus agressifs (SURGICAL, LOCKED, 95% identical) sont bien supprimes.** Reste des traces mineures.

## 3. Signal principal — clarte malgre condensation

**Passe 1** : Signal clair. "Edit this photo. Preserve [geometry]. CHANGE ONLY the surface finishes: [style]." L'action est en 1er token ("Edit"), la preservation en 2e position, le style en 3e. Structure correcte pour gpt-image-1.5 qui pese davantage les premiers tokens.

**Passe 2** : Signal clair. "Edit this photo of a finished room. [...] ADD the following furniture: [style]." Le mot "ADD" est bien l'action dominante. La preservation des surfaces est en preamble avant l'action — correct car gpt-image-1.5 doit d'abord comprendre que les surfaces sont finales.

**Iteration** : Excellent. "Edit this photo. Keep all surfaces unchanged. [...] Apply these changes: [liste]." Prompt le plus propre du lot, signal chirurgical sans le mot "surgical".

## 4. Risque de dilution — passe 2 kitchen

Le builder kitchen passe 2 est le plus long (~360 mots). Le bloc KITCHEN DENSITY a lui seul fait 78 mots avec 3 branches conditionnelles ("if compact / if medium / if large"). Pour gpt-image-1.5, ce bloc est problematique : le modele ne parse pas les conditionnelles comme un switch/case. Il lit tout lineairement et les instructions "no island, no stools" coexistent avec "add stools if island exists" dans le meme prompt. Le modele risque de retenir la derniere instruction lue.

**Les furniturePrompts des 12 styles contiennent des "choose one:" (ex: "accent chair: choose one: Eames, Wegner, Barcelona").** Ces constructions ajoutent ~15-20 mots par choix et le modele doit prendre une decision arbitraire. Ce n'est pas un probleme de safety filter mais de dilution : le modele genere parfois un hybride au lieu de choisir.

## 5. Termes residuels potentiellement problematiques

| Terme | Localisation | Risque safety | Action recommandee |
|-------|-------------|---------------|-------------------|
| "COMPLETELY EMPTY" (caps) | 8x passe 1 builders | Moyen — formulation assertive repetee | Passer en minuscules "completely empty" |
| "PRESERVE EXACTLY" (caps) | outdoor passe 1 | Faible — 1 occurrence | Passer en "Preserve exactly" (caps initiale seule) |
| "NEVER cluster" | 2x passe 2 | Faible — dans contexte spatial | Remplacer par "Avoid clustering" |
| "must not touch walls" | 3x passe 2 | Faible | OK tel quel |
| "FINAL" (caps) | PASS2_PREAMBLE | Faible — 1 occurrence | Acceptable |

Aucun de ces termes n'est un trigger fort individuellement. Le risque cumule est faible. Si les rejections persistent, descendre les CAPS restants en priorite.

## Note technique : 8.2/10

**Points forts** : Reduction de 800 a ~280-360 mots reussie. Structure "Edit > Preserve > Change/Add" correcte pour gpt-image-1.5. Termes safety les plus agressifs supprimes. Iteration-prompt.ts exemplaire (concis, clair, zero CAPS inutiles). Constantes partagees = zero duplication, maintenance facile.

**Points faibles** : Kitchen passe 2 trop long. CAPS residuels. Conditionnelles density parsees lineairement.

## Top 3 corrections

**P0 — Condenser KITCHEN DENSITY** : Remplacer les 3 branches conditionnelles (78 mots) par une seule directive : "Scale kitchen to apparent width — fewer elements if compact, full set if spacious. Skip island under 10m2." (~20 mots). Le modele infere mieux une regle proportionnelle qu'un switch/case textuel.

**P1 — Descendre tous les CAPS restants** : "COMPLETELY EMPTY" > "completely empty", "PRESERVE EXACTLY" > "Preserve exactly", "CHANGE ONLY" > "Change only", "FULL DEPTH" > "full depth". Les CAPS inutiles augmentent le risque cumule de trigger safety sans apporter de signal supplementaire pour gpt-image-1.5 (contrairement a gpt-image-1 qui y etait plus sensible).

**P2 — Remplacer les "choose one:" dans les furniturePrompts** : Au lieu de lister 3 options et demander au modele de choisir, pre-selectionner la piece la plus representative par style. "accent chair: choose one: Eames lounge, Wegner shell, Barcelona" > "Eames-style lounge chair". Reduit les mots, elimine l'ambiguite, evite les hybrides.

---
*Lucas Moreau — Audit prompt engineering v45, gpt-image-1.5*
