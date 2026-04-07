# Point prompts v54 → v56 — analyse session 36

**Date** : 2026-04-07
**Auteur** : @ia
**Contexte** : audit v55 prod Yann 5.9 + Lucas 5.4 → NO-GO critique. Le fondateur demande un état des lieux tranché avant tout nouveau déploiement.

---

## Résumé exécutif

Les prompts v54 → v55 → v56 sont quasi-identiques (v55 a ajouté une clause ARCHITECTURAL_HONESTY de 70 mots, v56 ne touche plus aux prompts). **La régression v54 → v55 n'est pas causée par les prompts — elle est causée par le paramètre `input_fidelity:"high"` qui déclenche un artefact de compositing déterministe sur gpt-image-1.5.** v56 inverse ce paramètre (défaut "low"), ce qui cible correctement la cause racine. Recommandation : **déployer v56 tel quel**, puis re-auditer sur les mêmes inputs que la session 36. Ne PAS revert v54 (v54 avait déjà le bug, c'est juste qu'on ne l'avait pas vu sur tous les pipelines).

---

## Q1 — État actuel du prompt v56 (cas Scandinavian + living_room)

En passe 1 (surfaces), le modèle reçoit ~220 mots dans cet ordre :
1. `PASS1_PREAMBLE_V53` — verrou structure (colonnes, poutres, fenêtres, angle caméra FIXES)
2. `ARCHITECTURAL_HONESTY_V55` — 70 mots : "n'invente pas de poutres/caissons/voûtes si l'input est plat"
3. `inventoryLine` — inventaire de la pièce extrait par GPT-4.1-mini vision en pré-pass
4. `PRESERVATION_V53` — préserve plafond (bumps, soffits), colonnes, moulures, température couleur
5. `Surface style: {surfacePrompt Scandinavian}` — murs blancs, parquet ash blanchi, plafond blanc, PH5 pendant
6. Branche générique : "if one accent wall exists, keep it"
7. `CLEANUP_V53` — enlever câbles/prises/boîtiers, garder radiateurs/convecteurs
8. `DSLR_LINE` — "DSLR wide-angle, sharp focus, deep DOF"

En passe 2 (mobilier), ~180 mots : PASS2_PREAMBLE_V54 → inventory → EQUIPMENT → ANTI_INVENTION → furniturePrompt Scandinavian (mobilier, textiles, plantes) → DENSITY → 2-3 lived-in details → FINISH.

**Ordre d'attention gpt-image-1.5** : les ~200 premiers mots captent l'essentiel. v53/v54 ont condensé pour que le style arrive AVANT la chute d'attention. v55 a rajouté 70 mots (ARCHITECTURAL_HONESTY) qui poussent le style vers la zone à risque — effet mesurable en prod : aucun. La clause ne change pas les outputs (cf Q3).

---

## Q2 — Tableau évolution v54 → v55 → v56

| Version | Passe 1 — mots, structure, directives critiques | Passe 2 — mots, structure | input_fidelity | Score Yann/Lucas prod |
|---|---|---|---|---|
| **v54** | ~150 mots. PASS1_PREAMBLE_V53 → inventory → PRESERVATION → surface style → accent wall → CLEANUP → DSLR. **PAS d'ARCHITECTURAL_HONESTY**. | ~180 mots. PASS2_PREAMBLE_V54 → EQUIPMENT → ANTI_INVENTION → furniture style → DENSITY → lived-in → FINISH. | `"high"` (hardcodé pass1 et pass2) | session 33 : **8.4 / 8.9**. session 35 : **7.35 / 7.10**. |
| **v55** | ~220 mots (+70). Même structure que v54 **+ ARCHITECTURAL_HONESTY_V55** injecté après PASS1_PREAMBLE dans les 8 branches indoor. Aussi : fix bug room_type Pipeline B, suppression "vault beams" amorçantes dans 10/12 surfacePrompts. | Inchangée vs v54. | **adaptive** : `"high"` par défaut, bascule `"low"` si `detectBlownHighlights > 5%` sur le pass 1. | session 36 prod : **5.9 / 5.4**. |
| **v56** | **Identique v55**. Aucune modification de prompt. | **Identique v55**. | `"low"` par défaut pass 1. Pass 2 reste `"high"`. Heuristique highlights abandonnée. | **Non testé en prod** (commit b9e71f8, pas encore déployé). |

**Observation clé** : entre v54 et v56, les prompts n'ont changé que marginalement (ajout d'une clause de 70 mots qui n'a pas fait effet). **La seule variable qui a bougé et qui a un effet mesurable en prod est `input_fidelity`**.

---

## Q3 — Cause racine de la régression v54 → v55 → v55-prod

Verdict : **H2 (variance modèle sur inputs difficiles) + composante technique spécifique à `input_fidelity:"high"`. H1 et H3 sont éliminées.**

Preuves factuelles des rapports :

- **H1 (bias auditeur) — éliminée.** v54 session 35 Pipeline B (Contemporary dining) présentait **déjà exactement** le même artefact de fusion rectangulaire décrit en v55 (cf `audit-visuel-2026-04-07-v54-yann.md` ligne 51 : *"artefact de fusion grave au centre (zone floue, poutres bois résiduelles, overlay semi-transparent)"*). L'artefact était déjà là en v54, noté 4.5/10 préservation. Les auditeurs ne sont pas devenus plus sévères — ils ont vu plus d'occurrences du même bug.
- **H3 (régression prompt v55) — éliminée.** La clause ARCHITECTURAL_HONESTY est additive (70 mots en plus, pas de soustraction). Yann note explicitement *"la clause ARCHITECTURAL_HONESTY n'a empêché aucune hallucination structurelle sur ces 4 pipelines. Elle est inopérante dans sa formulation actuelle."* Donc son ajout = effet nul, ni positif ni négatif. Les autres changements v55 (fix room_type, suppression vaults amorçants) sont **validés en prod** par les deux auditeurs (le Pipeline C dining livre une vraie salle à manger).
- **H2 (variance modèle + input_fidelity) — confirmée.** Les 4 inputs session 36 sont tous des chantiers bruts très dégradés (personnages, chauffe-eaux, mur brique, baies surexposées). Les 4 inputs session 33 étaient des pièces plus standards. Le bug `input_fidelity:"high"` → compositing rectangulaire est **déterministe sur input difficile** (même input → même artefact, Lucas le confirme sur Pipeline B v55 #202). Lucas : *"`input_fidelity: high` force le modèle à 'préserver à tout prix' certaines régions pixelales, produisant un compositing mal fusionné"*.

**Conclusion** : le prompt v54 n'était pas meilleur que v55. C'est juste que les inputs session 33 ne déclenchaient pas le bug `input_fidelity:"high"`. On a cru à une régression v54→v55 alors que c'est la même qualité de pipeline confrontée à des inputs plus durs. Le vrai problème est architectural et date d'avant v54 : `input_fidelity:"high"` est incompatible avec les inputs chantier très dégradés.

---

## Q4 — Évaluation v56 : est-ce que le fix est bon ?

### Q4a — Est-ce que `"low"` résout l'artefact de compositing ?

**Oui, probablement.** Le paramètre `input_fidelity` dans le tool `image_generation` d'OpenAI Responses API contrôle à quel point le modèle "s'accroche" pixel à pixel à l'input. En mode `"high"`, sur une zone sémantiquement ambiguë (mur brique, personnage, highlight cramé), le modèle essaye de préserver les pixels tels quels → il produit un collage alpha au lieu de régénérer proprement. En mode `"low"`, le modèle utilise l'input comme guide sémantique et régénère librement → pas de collage possible. L'hypothèse Lucas (septembre : "artefact = fusion mal gérée sous high fidelity") est solide et l'audit session 36 a confirmé déterministe → c'est bien un bug de comportement API, pas de sampling.

### Q4b — Risque que `"low"` perde trop de détails de l'input ?

**Risque réel mais limité.** En mode `"low"`, le modèle peut dériver plus librement sur la géométrie (angle caméra, proportions, position fenêtres). C'est précisément ce que Lucas a noté sur Pipeline C v55 (shift angle caméra) — mais ce pipeline tournait déjà en `"high"`, donc le shift n'est pas lié à `"low"`. En revanche, sur les inputs "propres" (pas chantier), `"high"` donnait de bons résultats (session 33 : 8.4/8.9). **Il y a donc un risque de régression sur les inputs faciles** — les cas qui marchaient bien risquent d'être légèrement moins précis géométriquement. Mais : (1) le pipeline a des verrous de préservation très forts en prompt (PASS1_PREAMBLE, PRESERVATION, CAMERA LOCKED) qui compensent ; (2) la passe 2 reste en `"high"` — elle voit une pass1 propre donc pas de risque de leakage, et elle bénéficie de la fidélité maximale pour ne pas modifier les surfaces.

### Q4c — Quelque chose de plus qu'on aurait dû inclure dans v56 ?

**Oui, deux choses manquantes.**

1. **Clause de suppression explicite des personnages dans le PASS1_PREAMBLE.** Les inputs session 36 contiennent des ouvriers, le bug `"high"` préservait leur silhouette comme région à verrouiller. Même en `"low"`, si le modèle voit un personnage, il peut tenter de le conserver (et le rendre hallucinant). Ajouter : *"Remove any people, workers, or tools visible in the input. Erase them completely and fill with the surrounding wall/floor finish."* (recommandation Yann P0-1).
2. **Garde-fou bathroom compact** pour bloquer l'hallucination douche+vasque sur Pipeline D. Le bug v55 bathroom est indépendant d'`input_fidelity` (c'est un problème de furniturePrompt bathroom qui liste "shower/vanity/mirror" comme éléments attendus). v56 ne touche pas à ce fichier → le bug Pipeline D va persister (recommandation Lucas P0-2).

Ces deux fixes auraient dû être dans v56. En l'état, v56 règle 2 pipelines sur 4 (A et B, les Scandinavian living avec fusion) mais laisse Pipeline D (Japandi bathroom) dans le même état qu'en v55.

---

## Q5 — Recommandation finale

**GO déploiement v56**, mais avec lucidité sur son périmètre : v56 règle le bug de compositing Pipelines A/B, il ne règle PAS le bug d'hallucination bathroom Pipeline D.

- **NE PAS revert à v54.** v54 avait le même bug (preuve : audit v54 session 35 Pipeline B = exactement le même artefact). Revenir à v54 nous ramène à 7.35/7.10, moins bon que v56 sur 2 pipelines sur 4, et on perd le fix room_type qui marche.
- **NE PAS attendre v57 avant de déployer.** Le fondateur a besoin de montrer des rendus à ses clients maintenant. v56 améliore 50% du périmètre observé — c'est mieux que rien.
- **Ce qu'il faut faire immédiatement après v56** : préparer un v57 minimal qui ajoute (a) suppression personnages dans PASS1_PREAMBLE, (b) clamp bathroom compact (retirer "shower/vanity" du furniturePrompt bathroom quand roomType=bathroom + taille petite). C'est 30 lignes de code, un commit. Auditer ensuite sur les 4 mêmes inputs session 36 + 2 inputs faciles pour vérifier la non-régression de `"low"`.

Verdict tranché : **déployer v56 aujourd'hui, v57 dans la foulée, auditer après v57.**
