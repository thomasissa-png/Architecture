# v56 — input_fidelity default "low" + abandon heuristique highlights

**Date** : 2026-04-07 (session 36, post-audit Yann 5.9 + Lucas 5.4 prod v55)
**Décision** : inverser la logique `input_fidelity`

## Contexte
v55 (session 35) avait introduit une heuristique adaptive : défaut `"high"`, bascule sur `"low"` si `detectBlownHighlights` détectait >5% de pixels >95% luminance. Basée sur hypothèse Lucas session 35 : artefact de fusion corrélé aux highlights cramés des baies vitrées.

## Invalidation en prod
Audit croisé Yann (5.9/10) + Lucas (5.4/10) sur 4 pipelines v55 prod (sessions 36) :
- Les 4 pipelines ont `fidelity=high` dans les logs (heuristique n'a pas déclenché)
- 3/4 pipelines montrent quand même le leakage / artefact de compositing
- Le phénomène est **déterministe** (reproductible sur regen du même input)
- Fondateur clarification : "cata = morceaux de murs et sols de l'input visibles dans l'output"

**Conclusion** : les highlights cramés ne sont PAS le bon trigger. Le leakage est provoqué par `input_fidelity:"high"` en général, indépendamment du contenu de l'input.

## Décision v56
1. Défaut `inputFidelity = "low"` dans `tryOpenAIResponses()` (pass 1)
2. Pass 2 reste explicitement `"high"` (son input = pass1 propre, pas de risque de leakage, bénéfice préservation surfaces finies)
3. Abandon du câblage conditionnel `detectBlownHighlights` (heuristique supprimée du flow)
4. `lib/image-analysis.ts` + ses 9 tests CONSERVÉS (réutilisation future potentielle)

## Fallback si v56 échoue
Si audit ronde 3 montre perte de détails fins avec `"low"` (Yann/Lucas notent une perte de précision surface), introduire une heuristique INVERSE : défaut `"low"`, remonter à `"high"` seulement si métrique spécifique (ex: variance locale > seuil = input très détaillé qui mérite haute fidélité).

## Validation attendue
Fondateur déploie v56 + relance 4 générations sur mêmes inputs que la session 36 (Scandinavian living #200, Scandinavian dining #203, Japandi bathroom #201). Vérification visuelle : l'artefact de compositing rectangulaire doit avoir disparu des 2 pipelines Scandi living.
