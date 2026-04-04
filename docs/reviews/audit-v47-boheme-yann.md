# Audit Visuel v47 — Boheme Bureau | Yann Duval

**Date** : 2026-04-04 | **Version** : v47 (gpt-image-1.5) | **Style** : Boheme | **Piece** : Bureau/salon, murs aubergine

---

## Reponses aux 5 questions du fondateur

**1. Piece respectee ?** PARTIELLEMENT. Le mur accent violet est preserve (bon). Mais l'angle de vue est elargi (effet grand-angle absent de l'input) et une 3eme fenetre apparait au fond dans les 2 generations alors que l'input n'en montre que 2. Le convecteur est preserve dans les 2 cas (progres Sprint 18). La profondeur semble etiree.

**2. Variete entre #158 et #160 ?** OUI. Le bureau passe du fond (mur violet, #158) a la fenetre gauche (#160). Le fauteuil rotin (#158) est remplace par un fauteuil tissu (#160). Le luminaire passe d'un abat-jour cylindrique a une sphere tressee. La composition est distincte.

**3. Boheme credible ?** OUI. Tapis kilim, coussins ethniques, table basse bois brut, rotin, bougies, plantes, pouf — le vocabulaire est correct. Pas un Boheme maximal (type riad), plutot un Boheme nordique epure, mais coherent et professionnel.

**4. Distribution spatiale ?** BONNE. Canape a droite, tapis central, fauteuil/bureau a gauche, bibliotheque au fond — les 3 plans sont occupes. #160 est legerement meilleur (bureau a gauche equilibre le canape a droite).

**5. Artefacts IA ?** La 3eme fenetre hallucinee (presente dans les 2 outputs) est l'artefact le plus critique. Le rendu est propre, pas de mobilier flottant ni d'ombres incoherentes.

---

## Grille de notation

| # | Critere | Poids | #158 | #160 |
|---|---------|-------|------|------|
| 1 | Preservation spatiale | x3 | 6 | 6 |
| 2 | Fidelite stylistique | x2 | 7.5 | 7.5 |
| 3 | Eclairage | x1 | 7 | 7 |
| 4 | Hero pieces | x1 | 7 | 7.5 |
| 5 | Coherence matieres | x1 | 8 | 8 |
| 6 | Credibilite pro | x2 | 7 | 7.5 |
| 7 | Completude | x1 | 8 | 8 |
| 8 | Vocabulaire visuel | x1 | 7.5 | 7.5 |
| 9 | Adaptabilite spatiale | x1 | 7 | 7.5 |
| 10 | Potentiel photorealiste | x1 | 7 | 7 |

| Generation | Note ponderee /14 | Note /10 |
|------------|-------------------|----------|
| #158 | 94.5/14 | **6.75** |
| #160 | 97/14 | **6.93** |

---

## Verdict

**ALERTE : fenetre hallucinee dans les 2 generations.** Le fond de piece montre une 3eme fenetre absente de l'input. C'est le facteur limitant (note plafonnee par preservation spatiale a 6/10). L'angle elargi (grand-angle) etire aussi les proportions.

**Points forts** : mur accent violet preserve, convecteur intact, mobilier boheme credible (kilim, rotin, bois brut, bougies), variete reelle entre les 2 generations, distribution spatiale equilibree.

**Points faibles** : hallucination fenetre (bug recurrent Sprint 12/23), leger warm shift sur les murs non-accent (blanc froid input vers gris-beige), angle de vue elargi vs input.

**Recommandation P0** : la directive anti-hallucination fenetre ("EXACTLY the same number of windows") du Sprint 23 ne semble pas suffisante sur cette piece. Le mur du fond etant hors champ dans l'input, le modele "invente" une fenetre pour combler. Investiguer si le comptage explicite est bien present dans les prompts v47.

**Score global session** : **6.84/10** — Bon style, preservation insuffisante.
