# Diagnostic Pipeline d'Iteration — Cause racine et solution

**Date** : 2026-03-25
**Agents** : Lucas Moreau (Expert IA Image) + Agent @ia
**Severite** : CRITIQUE — le mobilier existant disparait a chaque iteration

---

## 1. Cause racine identifiee

L'image envoyee au modele lors d'une iteration est **l'image de la passe 1 (surfaces uniquement, piece VIDE)**, jamais le resultat meuble.

### Preuve dans le code

**route.ts ligne 1165** :
```ts
const result = await generateIterationPass(cached.imageBase64, responsesPrompt, fluxPrompt, outputSize);
```

`cached.imageBase64` provient de `getPass1Cache(pass1Key)` (ligne 1091), qui retourne l'image sauvegardee par `savePass1Cache` apres la passe 1. Cette image est la piece avec surfaces finies mais **ZERO mobilier**.

**iteration-prompt.ts ligne 29** :
```
"Add ONLY the items described in the changes above. Do NOT add any other furniture [...]
Leave the rest of the floor empty."
```

Le prompt est **exclusif** : il interdit explicitement d'ajouter quoi que ce soit qui n'est pas dans le commentaire utilisateur. Combine avec l'image vide en entree, le resultat ne peut contenir QUE l'element demande.

### Chaine causale complete

1. Client envoie `pass1_key` + `iterationComment: "ajoute une etagere"`
2. Serveur charge `cached.imageBase64` = image passe 1 (piece vide, surfaces finies)
3. Prompt d'iteration dit "Add ONLY the items described" + "Leave the rest of the floor empty"
4. Modele recoit une piece vide + instruction d'ajouter une etagere = resultat avec etagere seule
5. Tout le mobilier de la generation precedente a disparu

### Pourquoi cette architecture a ete choisie (Sprint 11)

Le design original partait du principe que chaque iteration "repart des surfaces" pour eviter la degradation progressive (chaque passe de generation degrade legerement la qualite). C'etait coherent quand l'iteration etait concue comme "refaire la passe 2 avec un nouveau furniturePrompt complet". Mais l'usage reel est different : l'utilisateur veut **ajuster** le resultat existant, pas le regenerer.

---

## 2. Reponses aux 4 questions

**Q1 — Quelle image est envoyee ?**
L'image de passe 1 (surfaces, piece vide). Jamais le resultat meuble.

**Q2 — Le pipeline 2 passes est-il relance ?**
Non. Seule la passe 2 est relancee (ligne 1081 : "re-pass 2 only"). Mais sur l'image vide, pas sur le resultat.

**Q3 — Comment le commentaire est-il interprete ?**
Via `preprocessIterationComment()` (GPT-4.1-mini) qui enrichit le commentaire EN → traduit et ajoute des details (materiaux, dimensions). Mais il n'y a **aucune classification** du type d'action (ajout/suppression/modification/changement de style). Tous les commentaires passent par le meme chemin.

**Q4 — Pourquoi le mobilier disparait ?**
Double cause : (A) l'image source est vide, (B) le prompt est exclusif ("ONLY [...] Leave the rest empty"). Le modele fait exactement ce qu'on lui demande.

---

## 3. Solution proposee

### 3.1 Classification du commentaire (GPT-4.1-mini)

Ajouter un champ `actionType` au preprocessing dans `lib/custom-prompt.ts` :

```ts
type IterationAction = "adjust" | "restyle";

// adjust = ajout, suppression, modification d'elements individuels
//   → image source = resultat meuble precedent, 1 passe unique
// restyle = changement de style complet, "refais tout", "change le style"
//   → image source = passe 1 (vide), pipeline passe 2 standard
```

System prompt GPT-4.1-mini (ajout au preprocessing existant) :
```
Classify this user comment as one of:
- "adjust": adding, removing, replacing, or moving individual items
- "restyle": changing the entire style, starting over, or requesting a completely different look

Examples:
- "ajoute une etagere" → adjust
- "remplace la table par une plus grande" → adjust
- "supprime le canape" → adjust
- "change tout en scandinave" → restyle
- "refais le mobilier completement" → restyle
```

### 3.2 Routing par type d'action

```
┌─────────────────┐
│  Commentaire     │
│  utilisateur     │
└────────┬────────┘
         │ GPT-4.1-mini
         ▼
    ┌──────────┐
    │ classify │
    └────┬─────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 adjust    restyle
    │         │
    ▼         ▼
 Image =   Image =
 resultat  passe 1
 meuble    (vide)
    │         │
    ▼         ▼
 1 passe   1 passe
 additive  exclusive
 (garder   (pipeline
 existant) actuel)
```

### 3.3 Nouveau prompt pour le mode "adjust"

Le prompt actuel (exclusif) reste utilise pour `restyle`. Pour `adjust`, nouveau prompt :

```
"This photo shows a FURNISHED room. The furniture and decoration visible in this photo
are the BASELINE. Keep ALL existing furniture exactly as-is unless the change below
explicitly asks to remove or replace something.

APPLY THIS CHANGE: {enrichedComment}

Rules:
- If the change says ADD: place the new item naturally among existing furniture
- If the change says REMOVE: remove only that specific item, keep everything else
- If the change says REPLACE: swap only the specified item, keep everything else
- Do NOT move or alter any furniture not mentioned in the change

Room structure LOCKED — walls, floor, ceiling, windows, doors unchanged.
[...memes directives camera/DSLR/ombres que l'actuel...]"
```

### 3.4 Image source pour le mode "adjust"

**Probleme** : le resultat meuble n'est pas stocke en cache (seule la passe 1 est cachee).

**Solution** : stocker egalement le dernier resultat meuble dans Object Storage.

```ts
// Dans savePass1Cache, ajouter un parametre optionnel
export async function saveIterationBase(
  pass1Key: string,
  furnishedImageBase64: string
): Promise<void> {
  const iterBaseKey = pass1Key.replace(".jpg", "_furnished.jpg");
  // ... upload to Object Storage
}

export async function getIterationBase(
  pass1Key: string
): Promise<string | null> {
  const iterBaseKey = pass1Key.replace(".jpg", "_furnished.jpg");
  // ... download from Object Storage, return base64 or null
}
```

Apres chaque passe 2 reussie ET apres chaque iteration reussie : sauvegarder le resultat comme nouvelle base d'iteration.

### 3.5 Modifications de code necessaires

| Fichier | Modification |
|---|---|
| `lib/custom-prompt.ts` | Ajouter classification `actionType` dans `preprocessIterationComment()` |
| `lib/db.ts` | Ajouter `saveIterationBase()` et `getIterationBase()` |
| `lib/iteration-prompt.ts` | Ajouter `buildAdjustFurnitureResponsesPrompt()` et version Flux (prompt additif) |
| `app/api/generate/route.ts` | Router sur `actionType` : adjust → image meublee + prompt additif, restyle → image vide + prompt exclusif actuel |
| `app/api/generate/route.ts` | Apres chaque passe 2 et chaque iteration : appeler `saveIterationBase()` |
| `app/page.tsx` | Envoyer `actionType` dans le body (optionnel — le serveur peut le determiner seul) |

---

## 4. Risques et mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Degradation progressive (chaque iteration degrade la qualite) | Moyen — apres 3 iterations le rendu se degrade | MAX_ITERATIONS = 3 est deja en place. Ajouter `input_fidelity: "high"` (deja fait). Accepter le trade-off : qualite legerement inferieure vs mobilier qui disparait = largement preferable |
| Classification GPT-4.1-mini incorrecte | Bas — les cas sont simples | Fallback : si doute, default = "adjust" (le cas majoritaire). L'utilisateur peut toujours relancer une generation complete |
| Stockage supplementaire Object Storage | Bas — 1 image JPEG par generation | ~200KB par image, TTL 24h comme la passe 1 existante |
| Prompt additif trop conservateur (le modele ne change rien) | Moyen | Le prompt dit "Keep ALL existing furniture" mais aussi "APPLY THIS CHANGE" — l'instruction d'action est claire. Si le modele est trop conservateur, augmenter le poids de l'instruction d'action |
| Prompt additif ajoute des artefacts (le modele "retouche" le mobilier existant) | Moyen | "Keep ALL existing furniture exactly as-is" + "Do NOT move or alter" devrait suffire. A tester empiriquement |

---

## 5. Cout additionnel

- **Classification GPT-4.1-mini** : deja en place pour le preprocessing, ajouter 1 champ au JSON de sortie = ~0 cout supplementaire
- **Stockage** : ~200KB supplementaires par generation, meme TTL 24h = negligeable
- **Latence** : identique — 1 passe au lieu de 1, meme modele, meme pipeline

---

## 6. Auto-evaluation

- [x] Cause racine identifiee avec preuves dans le code (lignes precises)
- [x] Solution compatible avec le budget existant (zero cout supplementaire)
- [x] Fallback prevu (classification incorrecte → default "adjust")
- [x] Pas de modification des prompts de generation standard (pipeline 2 passes intact)
- [x] Modifications limitees a 4 fichiers, retrocompatible

---

**Handoff → @fullstack**
- Fichier produit : `docs/reviews/iteration-pipeline-diagnostic.md`
- Decisions prises : routing par classification de commentaire (adjust/restyle), stockage du resultat meuble en cache, nouveau prompt additif pour le mode adjust
- Points d'attention : tester empiriquement le prompt additif sur 3-4 cas (ajout, suppression, remplacement) avant deploy. Le mode "restyle" est le pipeline actuel inchange. `saveIterationBase()` doit etre fire-and-forget comme `savePass1Cache()`.
