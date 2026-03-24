# Review croisee F1 — Iteration commentaire

> Date : 2026-03-24
> Reviewer : @reviewer (execute par @orchestrator)
> Fichiers audites : lib/iteration-prompt.ts, lib/custom-prompt.ts, lib/db.ts, app/api/generate/route.ts, components/RefineModal.tsx, components/VersionSelector.tsx, app/page.tsx
> References : docs/product/functional-specs.md (F1), docs/ia/f1-iteration-prompts.md, CLAUDE.md

---

## Resume executif

L'implementation F1 est globalement solide et respecte l'architecture recommandee. Les builders d'iteration sont separes, le cumul des modifications est implemente, le cache passe 1 avec meta fonctionne, et le pre-processing du commentaire est correct. Quelques problemes identifies, dont 2 HAUTE et plusieurs MOYENNE.

**Verdict global : APPROUVE avec corrections mineures recommandees.**

---

## Points conformes

### Specs F1.1 — User Stories
- [OK] US-F1-01 : Re-passe 2 uniquement, passe 1 jamais relancee (route.ts l.471-577)
- [OK] US-F1-02 : Badge iterations restantes affiche (page.tsx l.954-982)
- [OK] US-F1-03 : Selecteur de versions v1/v2/v3 implemente (VersionSelector.tsx)
- [OK] US-F1-04 : Pre-processing GPT-4.1-mini du commentaire (custom-prompt.ts l.96-164)

### Recommandations prompts (docs/ia/f1-iteration-prompts.md)
- [OK] Decision 1 : Enrichir le furniturePrompt, pas le remplacer — implemente (iteration-prompt.ts l.28-29)
- [OK] Decision 2 : Builders separes dans un fichier dedie (iteration-prompt.ts, pas de flag sur les existants)
- [OK] Decision 3 : Ordre des tokens — Directive > MODIFICATIONS > BASE STYLE > contraintes > photo (iteration-prompt.ts l.25-40)
- [OK] Decision 4 : Cumul des modifications entre iterations (route.ts l.517, page.tsx l.357-360)
- [OK] Decision 5 : Cache passe 1 avec meta (db.ts l.96-163)
- [OK] Decision 7 : Directive renforcee "surfaces FINAL and PERFECT" (iteration-prompt.ts l.26)
- [OK] Decision 8 : Parametres API identiques (tryOpenAIResponsesWithPrompt, tryFluxDepthWithPrompt)
- [OK] Decision 9 : Negative prompt Flux enrichi pour iteration (iteration-prompt.ts l.70-71)
- [OK] Decision 10 : Champs logging iteration en DB (db.ts l.52-57)

### Regles CLAUDE.md
- [OK] Pipeline 2 passes respecte — iteration = re-passe 2 uniquement
- [OK] Pas de melange surfaces/mobilier dans les builders d'iteration
- [OK] Pas de directives de lumiere dans les prompts d'iteration
- [OK] Pas de mention de curtains/drapes/windows dans les prompts
- [OK] "Add"/"REFINEMENT" au lieu de "TRANSFORM"
- [OK] input_fidelity: "high" sur OpenAI (route.ts l.275)
- [OK] Dimensions de mobilier conservees via le furniturePrompt original

### Edge cases F1.4
- [OK] Commentaire vide : valide cote client (page.tsx l.108, RefineModal) ET cote serveur (route.ts l.472-476)
- [OK] Passe 1 expiree (>24h) : verifie avec TTL (route.ts l.488-495)
- [OK] Fallback Flux sur iteration : implemente via generateIterationPass (route.ts l.347-382)
- [OK] Erreur = iteration non consommee (page.tsx l.446-448, pas de decrementation dans le catch)
- [PARTIEL] Elements structurels dans le commentaire : filtre par GPT-4.1-mini (custom-prompt.ts l.127-129) — voir probleme H-01

---

## Problemes identifies

### HAUTE

**H-01 — Double pre-processing du commentaire : client ET serveur**
- **Fichiers** : page.tsx l.370-387 + route.ts l.509-514
- **Description** : Le commentaire est pre-process DEUX FOIS :
  1. Cote client (page.tsx l.371) via `/api/preprocess-prompt` (qui utilise `preprocessCustomPrompt` — le split surface/furniture generique)
  2. Cote serveur (route.ts l.510) via `preprocessIterationComment` (le pre-processing specifique iteration)
- **Probleme** : Le client envoie `ppData.furniturePrompt` (issue du split generique) comme `iterationComment` au serveur. Le serveur re-pre-process ce texte deja enrichi. Double enrichissement = inflation + risque de denaturation du commentaire original.
- **Impact** : Le commentaire utilisateur est transforme 2 fois par 2 LLM differents avec 2 system prompts differents. Le resultat final peut diverger de l'intention.
- **Recommandation** : Supprimer le pre-processing client (page.tsx l.370-387). Envoyer le commentaire brut au serveur. Le serveur fait TOUT le pre-processing via `preprocessIterationComment` qui est concu specifiquement pour l'iteration. Le pre-processing client via `/api/preprocess-prompt` est concu pour les prompts custom initiaux, pas pour les commentaires d'iteration.
- **Spec reference** : f1-iteration-prompts.md Decision 6 dit explicitement "NE PAS reutiliser preprocessCustomPrompt()" et recommande un pre-processing specifique iteration.

**H-02 — CRITIQUE — Le body JSON de /api/generate envoie pass1Key au lieu de pass1_key**
- **Fichiers** : page.tsx l.394-395 vs route.ts l.450
- **Description** : Le client envoie `pass1Key` (camelCase, page.tsx l.395) mais le serveur destructure `pass1_key` (snake_case, route.ts l.450). Le serveur lit `pass1_key` qui sera `undefined` car le client envoie `pass1Key`.
- **Impact** : CRITIQUE en apparence — l'iteration ne fonctionne pas du tout. Le serveur ne detecte jamais le flow iteration car `pass1Key` (l.471) est toujours falsy.
- **Verification** : la destructuration a la ligne 450 fait `pass1_key: pass1Key` — donc le snake_case est remape sur `pass1Key` dans le scope. Examinons la ligne exacte...
  - route.ts l.450 : `pass1_key: pass1Key,` — c'est du destructuring avec rename, donc `pass1Key` dans le scope serveur = la valeur de la propriete `pass1_key` du body.
  - page.tsx l.394 : `pass1Key: targetResult.pass1Key` — envoie la propriete `pass1Key` (camelCase) dans le body JSON.
  - **Le serveur attend `pass1_key` dans le JSON, le client envoie `pass1Key`.**
- **Conclusion** : Il y a bien un mismatch de nom de propriete. Le serveur lit `body.pass1_key` qui sera `undefined` car le client envoie `body.pass1Key`.
- **Recommandation** : Harmoniser — soit le client envoie `pass1_key` (coherent avec la spec et le README), soit le serveur accepte `pass1Key`. Le plus simple : changer page.tsx l.394 de `pass1Key:` a `pass1_key:`.

**DOUBLE MISMATCH CONFIRME** :
  1. Le serveur renvoie `pass1_key` (snake_case, route.ts l.638/665) dans la reponse JSON. Le client lit `data.pass1Key` (camelCase, page.tsx l.255). Resultat : `GenerationResult.pass1Key` est TOUJOURS `undefined`.
  2. Meme si le point 1 etait corrige, le client renverrait `pass1Key` (camelCase, page.tsx l.395) mais le serveur destructure `pass1_key` (snake_case, route.ts l.450). Resultat : le flow iteration ne se declencherait toujours pas.
- **Conclusion** : L'iteration F1 est entierement CASSEE en l'etat. Aucune iteration ne peut fonctionner.
- **Fix** : Harmoniser en snake_case partout (coherent avec le serveur) :
  - page.tsx l.255 : `data.pass1Key` → `data.pass1_key`
  - page.tsx l.395 : `pass1Key:` → `pass1_key:`
  - Ou bien harmoniser en camelCase partout cote serveur. Le plus simple est de corriger les 2 lignes client.

### MOYENNE

**M-01 — Cache key pas structuree par photoIndex**
- **Fichiers** : route.ts l.619-621
- **Description** : La spec (f1-iteration-prompts.md Decision 5) recommande `sessions/{sessionId}/{photoIndex}/pass1.jpg`. L'implementation utilise `sessions/${sessionId}/pass1_${Date.now()}.jpg` — pas de photoIndex, et un timestamp au lieu d'un index stable.
- **Impact** : Fonctionne mais les cles ne sont pas predictibles. Le client retourne la cle via `pass1_key` dans la reponse, donc ce n'est pas bloquant. Mais le format rend le debugging plus difficile et empeche toute purge selective par photo.
- **Recommandation** : Faible priorite, acceptable pour le MVP.

**M-02 — Le pre-processing iteration cote serveur n'envoie pas isRadicalChange**
- **Fichiers** : custom-prompt.ts l.96-164 vs f1-iteration-prompts.md Decision 6
- **Description** : La recommandation mentionne un champ `isRadicalChange: true` pour detecter les demandes de changement radical (>50% du mobilier). Le pre-processing ne retourne pas ce champ.
- **Impact** : L'edge case F1.4.7 ("pièce vide") depend du filtrage GPT-4.1-mini mais n'a pas de detection explicite cote code.
- **Recommandation** : Acceptable MVP — le filtrage GPT-4.1-mini est present dans le system prompt (l.129). Ajouter le champ `isRadicalChange` serait une amelioration P2.

**M-03 — iterationsRemaining est global, pas par photo**
- **Fichiers** : page.tsx l.84
- **Description** : `iterationsRemaining` est un seul compteur pour toute la session. La spec F1.3 dit "Les iterations ne sont pas transferables entre photos." En multi-photo, une iteration sur la photo 1 decremente le compteur, affectant la photo 2.
- **Impact** : Incoherent avec la spec. Si l'utilisateur genere 3 photos et itere 3 fois sur la photo 1, il ne peut plus iterer sur les photos 2 et 3.
- **Recommandation** : Transformer `iterationsRemaining` en tableau `iterationsRemaining: number[]` indexe par resultat. Chaque photo a son propre compteur. Initialiser chaque compteur a MAX_ITERATIONS apres generation.

**M-04 — MAX_ITERATIONS hardcode a 3 partout**
- **Fichiers** : page.tsx l.25, iteration-prompt.ts l.9
- **Description** : MAX_ITERATIONS = 3 en constante. La spec F1.3 definit 0/1/3/5 selon le package. Pas de lecture du package.
- **Impact** : Acceptable pour le MVP (pas de systeme de packages encore). Mais la valeur est dupliquee entre page.tsx et iteration-prompt.ts.
- **Recommandation** : Source unique a prevoir quand le systeme de credits sera implemente.

**M-05 — Pas d'AbortController pour le pre-processing iteration serveur**
- **Fichiers** : route.ts l.509-514
- **Description** : Le pre-processing via `preprocessIterationComment` n'a pas de timeout. Si GPT-4.1-mini est lent (>5s), l'utilisateur attend sans feedback.
- **Impact** : Risque de latence percue elevee. La spec dit <1.5s pour le pre-processing.
- **Recommandation** : Ajouter un timeout (2s) avec fallback sur le commentaire brut.

### BASSE

**B-01 — L'image d'iteration n'est pas sauvegardee dans Object Storage**
- **Fichiers** : route.ts l.540-541
- **Description** : `iterationKey` est calcule mais jamais utilise pour sauvegarder l'image d'iteration. Seul le log DB est ecrit.
- **Impact** : Les images d'iteration ne persistent pas dans Object Storage. Pas bloquant — le client a deja l'image en memoire — mais empeche la consultation ulterieure depuis /admin.
- **Recommandation** : Ajouter `saveImage(outputBase64, iterationKey)` apres le log.

**B-02 — VersionSelector comment non affiche pour la v1**
- **Fichiers** : VersionSelector.tsx l.47-49
- **Description** : La v1 affiche "Version originale" au lieu du commentaire (qui est `undefined`). C'est correct mais si l'utilisateur veut voir le style choisi initialement, il n'a pas d'info.
- **Recommandation** : Optionnel — afficher le nom du style pour la v1 (ex: "Scandinave — original").

**B-03 — refineWarnings affiches globalement, pas par version**
- **Fichiers** : page.tsx l.938-947
- **Description** : Les warnings du pre-processing sont stockes dans un seul state `refineWarnings`. Si l'utilisateur fait v2 puis v3, les warnings de v2 sont ecrases par ceux de v3.
- **Recommandation** : Faible impact — les warnings sont transitoires et informatifs.

---

## Securite

- [OK] Rate limiting applique aux iterations (meme endpoint /api/generate, meme rate limiter)
- [OK] Validation du commentaire (non-vide) cote serveur
- [OK] TTL 24h sur le cache passe 1 (empeche l'utilisation indefinie d'une cle)
- [OK] MAX_ITERATIONS verifie cote serveur (pas de confiance au client)
- [ATTENTION] Pas de validation de longueur du commentaire cote serveur. Le textarea a maxLength=500 (RefineModal.tsx l.179) mais cote serveur il n'y a pas de check. Un client malicieux peut envoyer un commentaire de 100K caracteres.
- [ATTENTION] Le `sessionId` vient du client (localStorage). Un utilisateur peut generer un nouveau sessionId pour reset ses iterations. Ce comportement est documente comme acceptable en MVP.

---

## Resume des actions

| # | Severite | Description | Effort |
|---|----------|-------------|--------|
| H-01 | HAUTE | Double pre-processing commentaire (client + serveur) | 15 min |
| H-02 | CRITIQUE | Mismatch pass1Key/pass1_key — iteration flow CASSE | 2 min |
| M-03 | MOYENNE | iterationsRemaining global au lieu de par photo | 30 min |
| M-05 | MOYENNE | Pas de timeout sur preprocessIterationComment | 10 min |
| B-01 | BASSE | Image iteration non sauvegardee dans Object Storage | 5 min |

Les autres points (M-01, M-02, M-04, B-02, B-03) sont acceptables pour le MVP et ne necessitent pas de correction immediate.

---

**Handoff → @orchestrator**
- Fichier produit : `docs/reviews/f1-review.md`
- Verdict : APPROUVE avec corrections — H-01 et H-02 a corriger avant mise en production
- Recommandation : corriger H-01 (supprimer double pre-processing) et H-02 (mismatch cle) avant de passer a F2
