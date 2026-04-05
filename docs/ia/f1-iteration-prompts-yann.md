# F1 Iteration Prompts — Recommandations Yann Duval (Architecte d'Interieur)

> Agent : Yann Duval — Architecte d'interieur, 20 ans XP
> Date : 2026-03-24
> Mission : Strategie stylistique pour la construction du prompt d'iteration F1

---

## 1. Principe fondamental : enrichir, ne jamais remplacer

Le commentaire utilisateur doit **enrichir** le furniturePrompt du style, pas le remplacer. Le style reste l'ancre stylistique — le commentaire apporte des **modifications chirurgicales** dans ce cadre.

**Pourquoi** : si on remplace le furniturePrompt par le commentaire enrichi, on perd la coherence stylistique complete (hero pieces, palette, proportions, densite). Le resultat sera un "collage" d'elements sans unite.

### Strategie de construction recommandee

```
PROMPT ITERATION = furniturePrompt du style ORIGINAL
                 + " MODIFICATIONS: " + commentaire enrichi par GPT-4.1-mini
                 + " All other elements from the original description remain unchanged."
```

Le mot-cle "MODIFICATIONS" signale au modele que seuls certains elements changent. Le rappel final ("remain unchanged") ancre tout le reste.

---

## 2. Taxonomie des modifications acceptables

### Tier 1 — Substitutions directes (le plus courant, le plus sur)
- Changer la couleur d'un meuble : "canape beige → canape anthracite"
- Changer le materiau : "canape boucle → canape velours"
- Changer un meuble specifique : "remplace le fauteuil par un rocking-chair"
- Ajouter un element freestanding : "ajoute un lampadaire"
- Retirer un element : "enleve la plante"

**Risque** : faible. Le modele comprend bien les substitutions ponctuelles.

### Tier 2 — Modifications d'ambiance (modere)
- "Plus chaleureux" → enrichir avec : "warm-toned textiles, additional warm cognac and terracotta accents"
- "Plus minimaliste" → enrichir avec : "remove secondary accent pieces, leave 40% more empty floor"
- "Plus de couleur" → enrichir avec : "add one bold accent cushion in [couleur], replace neutral rug with patterned one"

**Risque** : modere. L'enrichissement GPT-4.1-mini doit traduire l'intention en elements concrets. Sans enrichissement, "plus chaleureux" est trop vague pour le modele de generation.

### Tier 3 — Changements radicaux (a filtrer ou avertir)
- "Change tout le mobilier" → revient a une nouvelle generation, pas une iteration
- "Passe en style scandinave" (alors que le style initial est Art Deco) → contradiction avec le furniturePrompt original
- "Ajoute une cuisine equipee" → element structurel, non supporte

**Regle** : les commentaires Tier 3 doivent declencher un warning et/ou un redirect vers "Relancer avec un autre style".

---

## 3. Enrichissement stylistique par GPT-4.1-mini

Le system prompt du pre-processing GPT-4.1-mini doit inclure des regles specifiques pour l'iteration (differentes du pre-processing custom initial) :

### Regles obligatoires pour le pre-processing iteration

1. **Traduire FR→EN** (comme pour le custom)
2. **Enrichir avec dimensions/materiaux/couleurs** : "canape gris" → "charcoal grey boucle three-seat sofa 230cm wide"
3. **Respecter le style en cours** : le system prompt doit recevoir le nom du style pour contextualiser. "Ajoute un lampadaire" en Scandinave → "slim matte white floor lamp with paper shade" vs en Industriel → "matte black iron tripod floor lamp"
4. **Filtrer les elements structurels** : fenetres, murs, portes, plafond → warning
5. **Filtrer les elements muraux** : tableaux accroches, etageres murales, rideaux → warning
6. **Detecter les contradictions de style** : si l'utilisateur demande un element fortement associe a un autre style (ex: "tatami" en Art Deco), enrichir en adaptant au style actuel ou avertir
7. **Ne PAS toucher aux surfaces** : le commentaire d'iteration ne doit JAMAIS generer de modifications de surfacePrompt. Meme si l'utilisateur dit "murs plus clairs", filtrer avec warning.
8. **Detecter les demandes de "tout changer"** : "change tout", "refais completement", "autre chose" → warning "Pour un changement radical, relancez une nouvelle generation."

### Format de sortie GPT-4.1-mini pour iteration

```json
{
  "modifications": "charcoal grey boucle three-seat sofa replacing the current beige one, add a small brass side table 40cm near the armchair",
  "warnings": ["Les modifications de murs ne sont pas possibles en mode affinage."],
  "isRadicalChange": false
}
```

**Note** : le champ `isRadicalChange` permet au frontend de bloquer ou avertir avant d'envoyer la requete.

---

## 4. Garde-fous stylistiques par style

Certains styles ont des contraintes specifiques que le commentaire ne doit pas violer :

| Style | Contrainte | Raison |
|-------|-----------|--------|
| Japandi | Densite max 30% du sol | L'essence du style est le vide. "Ajoute plus de meubles" doit etre attenue. |
| Wabi-Sabi | Pas de symetrie, pas de neuf | "Organise les meubles symetriquement" ou "meuble neuf brillant" contredit le style. |
| Minimaliste/Scandinave | Pas de surcharge | "Ajoute beaucoup de coussins" doit etre modere (max 3-4, pas 10). |
| Maximaliste | Pas de depouillement | "Enleve presque tout" tue le style. Avertir. |
| Art Deco | Materiaux nobles uniquement | "Canape en tissu basique" → enrichir vers "velvet" ou "silk" pour rester coherent. |

Ces contraintes doivent etre injectees dans le system prompt de GPT-4.1-mini selon le styleId en cours.

---

## 5. Preservation de la coherence inter-iterations

### Probleme anticipe
L'utilisateur fait 3 iterations successives :
1. "Canape anthracite" → OK
2. "Ajoute un tapis berbere" → OK
3. "Plus de plantes" → le modele risque de "oublier" les modifications 1 et 2

### Solution recommandee
Le prompt d'iteration N doit inclure un **cumul** des modifications precedentes :

```
MODIFICATIONS (cumulative):
- v2: charcoal grey sofa replacing beige
- v3: added Berber-style rug 200x300cm in cream and brown
- v4 (current): add 2-3 trailing green plants in terracotta pots
All other elements from the original style description remain unchanged.
```

**Pourquoi** : le modele de generation ne "se souvient" pas des iterations precedentes. Il recoit l'image de la passe 1 (surfaces) + le prompt. Sans cumul, il risque de revenir au furniturePrompt original sur les elements non mentionnes dans l'iteration courante.

**Important** : l'input image de la passe 2 iteration est TOUJOURS la passe 1 (surfaces), pas le resultat de l'iteration precedente. Donc le prompt est la seule source de verite pour tout le mobilier.

---

## 6. Exemples concrets de prompts d'iteration

### Exemple 1 : Scandinave, iteration "canape anthracite"

**furniturePrompt original** (Scandinave) :
```
Scandinavian furniture with clean geometric lines: large straight three-seat sofa in oatmeal boucle with low squared arms and birch legs 230cm wide, [...]
```

**Commentaire utilisateur** : "Je voudrais un canape anthracite plutot"

**Enrichissement GPT-4.1-mini** :
```json
{
  "modifications": "dark charcoal grey boucle three-seat sofa with low squared arms and birch legs 230cm wide replacing the oatmeal boucle sofa",
  "warnings": [],
  "isRadicalChange": false
}
```

**Prompt final passe 2 iteration** :
```
[furniturePrompt Scandinave original]
MODIFICATIONS: dark charcoal grey boucle three-seat sofa with low squared arms and birch legs 230cm wide replacing the oatmeal boucle sofa. All other elements from the original description remain unchanged.
```

### Exemple 2 : Art Deco, iteration "moins dore"

**Commentaire** : "C'est trop dore, je voudrais des tons plus subtils"

**Enrichissement GPT-4.1-mini** :
```json
{
  "modifications": "replace brass elements with brushed antique silver and pewter finishes. Coffee table in brushed pewter with smoked glass. Side tables in antique silver. Keep the emerald velvet sofa as-is.",
  "warnings": [],
  "isRadicalChange": false
}
```

---

## 7. Recommandations pour le builder de prompt d'iteration (route.ts)

### Nouvelle fonction suggeree : `buildIterationFurniturePrompt()`

```
function buildIterationFurniturePrompt(
  originalFurniturePrompt: string,
  modifications: string,
  iterationHistory: string[] // cumul des modifications precedentes
): string
```

Le builder doit :
1. Prendre le furniturePrompt original du style (pas celui de l'iteration precedente)
2. Ajouter le bloc MODIFICATIONS avec cumul
3. Utiliser le meme wrapper que `buildFurnitureResponsesPrompt()` (distribution profondeur, ombres, freestanding only, etc.)
4. Ajouter une directive specifique : "Apply the listed modifications while keeping all other furniture and decoration from the original description."

### Directive supplementaire pour l'iteration

Ajouter dans le builder d'iteration :
```
"This is a REFINEMENT of a previous generation. The room surfaces are already finished and must stay exactly as they are. Focus ONLY on adjusting the furniture and decoration as described in the modifications."
```

Cette directive clarifie au modele que c'est une iteration, pas une generation de zero.

---

## 8. Verdict et priorites

| Priorite | Recommandation | Impact |
|----------|---------------|--------|
| P0 | Enrichir le furniturePrompt, ne JAMAIS le remplacer | Coherence stylistique |
| P0 | Cumuler les modifications des iterations precedentes | Persistance des changements |
| P0 | System prompt GPT-4.1-mini specifique pour l'iteration (different du custom) | Qualite de l'enrichissement |
| P1 | Injecter le styleId dans le system prompt pour contextualiser l'enrichissement | Coherence avec le style |
| P1 | Filtrer les demandes structurelles + murales + radicales | Prevention des echecs |
| P2 | Garde-fous de densite par style (Japandi 30%, Wabi-Sabi 40%) | Respect de l'identite stylistique |
| P2 | Detecter les contradictions de style | UX de qualite |

---

**Handoff → Lucas Moreau + @fullstack**
- Fichier produit : `docs/ia/f1-iteration-prompts-yann.md`
- Decisions cles : enrichir pas remplacer, cumul des modifications, system prompt GPT-4.1-mini specifique iteration
- Points d'attention : la passe 2 iteration recoit l'image passe 1 (pas l'iteration precedente), donc le prompt est la seule source de verite pour le mobilier
