# Decision architecturale pipeline v57 — session 36
**Date** : 2026-04-07
**Auteur** : @ia (apres stall de l'instance precedente, relance focalisee)
**Mandat fondateur** : systeme qui marche sur 4 modes user (surfaces-only, pipeline complet, affiner, regenerer), la plus performante possible.

## Decision

**Option 2 — Rollback v54 + preservation selective**

Justification :
- Trajectoire v54 (7.22) → v55 (5.65) → v56 (5.10) = regression monotone de -2.12 pts en 2 iterations. Chaque changement de v55/v56 a empire le systeme. Le point de reference stable le plus recent est v54.
- Lucas revise publiquement sa position et recommande explicitement le rollback `input_fidelity=high`. Yann confirme NO-GO v56 et demande v57 d'urgence. Les deux auditeurs convergent.
- L'artefact de compositing deterministe (diagnostic initial ayant motive v55/v56) est intrinseque au pipeline selon Lucas — le baisser la fidelite n'est pas la bonne reponse, c'est une investigation API-level qui est requise (hors scope immediat).
- Les fixes P0-A room_type (commit 45a1552) et la propagation cross-handler sont visuellement confirmes en prod et orthogonaux a la question fidelity → les garder ne reintroduit aucun risque.
- Options 3/4/5 (pre-processing sharp, mask-based, split calls) sont des explorations non evaluees. Les tenter maintenant sans repere stable, c'est empiler de l'incertitude sur une trajectoire deja descendante. Stabiliser d'abord, explorer ensuite.
- Le mode Affiner (ligne 682) n'a jamais ete touche par v56 — il reste a `input_fidelity="high"` et cette coherence doit etre maintenue sur tous les modes.

## Ce qui change

- `lib/generation-pipeline.ts` : parametre `inputFidelity` defaut `"low"` → `"high"` dans `tryOpenAIResponsesSurfaces` / `tryOpenAIResponsesFurniture` (revert v56, retour v54)
- `lib/generation-pipeline.ts` ligne 682 : `tryOpenAIResponsesWithPrompt` laisser `"high"` (inchange, coherent)
- `lib/generation-pipeline.ts` : supprimer l'import et l'appel a `detectBlownHighlightsFromBase64` (heuristique v55 abandonnee definitivement). Le fichier `lib/image-analysis.ts` est conserve pour reutilisation future eventuelle, mais plus reference dans le pipeline.
- `lib/generation-pipeline.ts` : supprimer la clause ARCHITECTURAL_HONESTY (v55) dans les builders de prompts passe 1. Cette clause n'a pas ameliore les audits et ajoute du bruit token.
- `lib/generation-pipeline.ts` : supprimer toute logique conditionnelle `if (fidelity === "low")` introduite en v56 (branches mortes apres rollback).
- `lib/generation-pipeline.ts` : constante `PROMPT_VERSION` → `"v57"`
- `CLAUDE.md` : ajouter entree Sprint dans l'historique documentant le rollback et la decision.
- **PRESERVE** : fix P0-A room_type, propagation cross-handler route.ts, suppression "vault beams" 10/12 styles, builders v54 hors clauses v55/v56.

## Ce qui est PRESERVE (non touche par la decision)

- Fix P0-A room_type (commit 45a1552) : visuellement confirme sur Pipeline C dining → ne pas revert
- Propagation cross-handler route.ts (commit 45a1552 b) : idem
- Suppression vault beams sur 10/12 styles : neutre mais coherent
- Bug Affiner "Requete invalide" : ticket @fullstack separe, hors scope v57
- `lib/image-analysis.ts` : fichier conserve (code mort) pour eventuelle reutilisation future

## Garantie sur les 4 modes user

| Mode | Version actuelle (v56) | Apres v57 | Score cible |
|---|---|---|---|
| 1 — Surfaces-only | fidelity=low | fidelity=high (rollback v54) | ≥8/10 |
| 2 — Pipeline complet | p1=low, p2=high | p1=high, p2=high | ≥8/10 |
| 3 — Affiner | fidelity=high (inchange) | fidelity=high (inchange) | ≥8/10 hors bug "Requete invalide" |
| 4 — Regenerer | herite Mode 1 ou 2 | herite Mode 1 ou 2 | ≥8/10 |

Tous les modes convergent sur `input_fidelity="high"` = coherence totale. Aucun mode user n'est laisse avec un parametre degrade.

## Criteres de rollback si v57 echoue

Si apres deploiement, l'audit Yann+Lucas sur les 5 memes pipelines v56 donne moyenne < 7.0/10 :
1. Passer a **Option 3** (pre-processing via sharp — `normalize().modulate({brightness: 0.95})` sur input avant envoi API pour casser le prior de preservation pixel-exacte)
2. Si Option 3 echoue a son tour : escalader investigation API-level OpenAI (ticket support) + envisager **Option 4** (bypass mask-based images.edit) malgre contradiction historique sprint 10
3. Ne PAS tenter Option 5 (split API calls) sans evaluation cout prealable — 3x latence + 3x cost

Declencheur de rollback : audit croise sur 5 generations v57 avec moyenne Yann+Lucas < 7.0. Audit a lancer des deploiement confirme.

## Brief @fullstack pour implementation v57

**Fichiers** :
- `lib/generation-pipeline.ts` (changements principaux)
- `CLAUDE.md` (entree historique Sprint 25)

**Operations** :
1. Grep `input_fidelity` dans `lib/generation-pipeline.ts` → identifier les 2-3 sites v56 (hors ligne 682)
2. Remplacer `"low"` par `"high"` sur ces sites
3. Supprimer les imports/appels `detectBlownHighlightsFromBase64`
4. Supprimer les blocs de texte `ARCHITECTURAL_HONESTY` des builders passe 1
5. Supprimer les branches conditionnelles mortes `if (fidelity === "low")`
6. Bumper `PROMPT_VERSION` a `"v57"`
7. `npx next lint` pour verifier zero import non-utilise (regle CLAUDE.md)
8. `npx tsc --noEmit` pour verifier zero erreur TS

**Tests post-deploy** :
- Lancer 5 generations sur les memes inputs que l'audit v56 (pipelines A-E)
- Archiver les ids pour audit croise Yann+Lucas
- Verifier que les 4 modes user fonctionnent (smoke test manuel : surfaces-only, pipeline complet, affiner, regenerer)

**Commit message** :
```
fix(pipeline): rollback v57 input_fidelity=high + remove v55/v56 heuristics

- Revert input_fidelity low -> high on surfaces and furniture passes
- Remove detectBlownHighlightsFromBase64 heuristic (v55 abandoned)
- Remove ARCHITECTURAL_HONESTY clause from pass 1 builders (v55)
- Remove dead conditional branches if (fidelity === "low") (v56)
- Preserve P0-A room_type fix and cross-handler propagation
- PROMPT_VERSION v56 -> v57

Audit v56 trajectory: 7.22 -> 5.65 -> 5.10 (-2.12 pts). Lucas and Yann
converge on rollback. Compositing artifact is API-level, not fidelity-level.
```

## Justification vs options ecartees

- **Option 1 (rollback pur v54)** : ecarte car perd le fix P0-A room_type visuellement confirme en prod. Regression utilisateur inutile alors que le fix est orthogonal a la question fidelity.
- **Option 3 (pre-processing sharp)** : ecarte pour v57 car non evalue, ajoute une incertitude supplementaire sur une trajectoire deja descendante. Reserve comme plan B si v57 echoue.
- **Option 4 (mask-based images.edit)** : ecarte car contredit decision fondateur sprint 10 (images.edit abandonne definitivement apres tests exhaustifs). Reserve comme plan C apres escalade OpenAI.
- **Option 5 (split API calls)** : ecarte car cout x3 + latence x3 non budgete, ROI non demontre, pas de donnees sur l'efficacite. Ne repond pas au critere "la plus performante possible".
