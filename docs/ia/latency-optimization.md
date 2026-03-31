# Versiroom -- Analyse d'optimisation de la latence

**Agent** : @ia
**Date** : 2026-03-31
**Prompt version analysee** : v30
**Pipeline actuel** : 2 passes sequentielles (surfaces puis mobilier) via OpenAI Responses API gpt-4.1 + gpt-image-1.5
**Latence observee** : ~90+ secondes par generation complete
**Objectif** : reduire la latence sans degrader la qualite ni casser le pipeline

---

## Synthese des trouvailles

Apres lecture complete de `app/api/generate/route.ts` (1633 lignes), `lib/db.ts` (624 lignes) et `lib/image-utils.ts` (141 lignes), voici les goulots d'etranglement identifies et les optimisations recommandees, classees par impact decroissant.

---

## Recommandation 1 -- Parametre `quality` sur le tool image_generation

**Constat** : Le code ne passe aucun parametre `quality` au tool `image_generation` (ligne 726-732 de route.ts). Par defaut, OpenAI utilise `quality: "high"`, soit le tier le plus lent et le plus cher.

**Optimisation** :
- Passe 1 (surfaces) : `quality: "low"` ou `"medium"`. La passe 1 produit une piece VIDE avec des finitions de surface. Le resultat n'est jamais vu par l'utilisateur final (sauf en mode surfaces-only). Il sert d'input a la passe 2. Un quality low/medium suffit largement.
- Passe 2 (mobilier) : `quality: "medium"` pour l'usage standard, `"high"` uniquement pour un tier premium eventuel.

**Estimation du gain** :
- GPT Image 1.5 est annonce jusqu'a 4x plus rapide que DALL-E 3, mais le parametre quality influence directement la vitesse de generation. Low est significativement plus rapide que high.
- Gain estime : **15-30 secondes** sur les 2 passes combinees (le plus gros levier).

**Cout** :
- Low 1024x1024 : $0.009 vs High : $0.133 (15x moins cher)
- Low 1536x1024 : $0.013 vs High : $0.200 (15x moins cher)
- Medium 1024x1024 : ~$0.034 vs High : $0.133 (4x moins cher)

| Scenario | Cout 2 passes (landscape) | Gain latence estime | Qualite |
|---|---|---|---|
| Actuel : high + high | ~$0.40 | baseline | maximale |
| low + medium | ~$0.063 | -15 a -30s | suffisante (passe 1 invisible) |
| medium + medium | ~$0.10 | -10 a -20s | bonne |
| low + high | ~$0.213 | -10 a -15s | passe 2 maximale |

**Risque** : Faible. La passe 1 est un intermediaire -- sa qualite n'affecte le resultat final que si la passe 2 ne corrige pas les defauts. A tester sur 5-10 generations comparatives.
**Difficulte d'implementation** : Triviale (1 ligne ajoutee par appel).
**Change la qualite de sortie** : Non pour passe 1. Potentiellement leger pour passe 2 en medium (a valider par audit visuel).

---

## Recommandation 2 -- Parametre `detail: "low"` sur input_image de la passe 1

**Constat** : Les deux passes utilisent `detail: "high"` sur le content block `input_image` (lignes 716 et 857). Ce parametre controle la resolution a laquelle le modele de VISION (gpt-4.1) analyse l'image input.

- `detail: "high"` : l'image est decoupee en tiles de 512px, chaque tile coute 129 tokens + base 65 tokens. Une image 2048x1536 = potentiellement des milliers de tokens d'input image.
- `detail: "low"` : l'image est reduite a 512x512, cout fixe de 85 tokens. 

**Optimisation** :
- Passe 1 : passer a `detail: "low"`. La passe 1 n'a pas besoin de voir chaque detail de l'image de chantier -- elle doit comprendre la geometrie globale (murs, plafond, sol, fenetres) et appliquer des finitions. La structure spatiale est bien perceptible a 512px.
- Passe 2 : garder `detail: "high"`. La passe 2 doit placer du mobilier avec precision par rapport aux surfaces finies de la passe 1.

**Estimation du gain** : **3-8 secondes** sur la passe 1 (moins de tokens a traiter par le modele de vision avant de generer).

**Risque** : Moyen. Si le modele ne percoit pas un element structural subtil (poutre fine, mur accent discret) a 512px, il pourrait le lisser. A tester specifiquement sur des pieces avec poutres et murs accent.
**Difficulte d'implementation** : Triviale (changer `"high"` en `"low"` a la ligne 716).
**Change la qualite de sortie** : Potentiellement sur la passe 1 pour les details fins. A valider.

---

## Recommandation 3 -- Reduire la resolution client de 2048px a 1536px

**Constat** : `lib/image-utils.ts` redimensionne les images client a `MAX_DIMENSION = 2048` (ligne 6). Cependant, la resolution de sortie maximale de gpt-image-1.5 est 1536x1024. Envoyer une image 2048px au modele qui produit du 1536px max est un gaspillage de bande passante et de tokens d'input.

**Optimisation** : Reduire `MAX_DIMENSION` de 2048 a 1536.

**Estimation du gain** :
- Taille du payload base64 reduite de ~30% (1536/2048 au carre ≈ 56% des pixels).
- Upload client plus rapide : **1-3 secondes** sur connexion mobile.
- Moins de tokens d'input image si `detail: "high"` est conserve : moins de tiles a decouper.
- Total estime : **2-5 secondes** de gain.

**Risque** : Aucun. L'output est deja 1536px max. Envoyer un input plus grand que l'output ne sert a rien.
**Difficulte d'implementation** : Triviale (changer une constante).
**Change la qualite de sortie** : Non. L'output est identique (1536x1024 max).

---

## Recommandation 4 -- savePass1Cache en parallele au lieu de bloquant

**Constat** : Apres la passe 1 (ligne 1438-1453), `savePass1Cache` est `await`-ed de maniere bloquante AVANT de lancer la passe 2. Cette operation ecrit 2 fichiers dans Object Storage (image + meta JSON) avec verification read-after-write.

```typescript
// Ligne 1438-1453 — BLOQUANT
try {
  await savePass1Cache(pass1CacheKey, pass1Base64, { ... });
  pass1Saved = true;
} catch (err) {
  console.error("Pass1 cache save failed:", err);
}
```

La passe 2 n'a pas besoin que le cache soit sauvegarde. Elle n'utilise que `pass1Base64` qui est deja en memoire.

**Optimisation** : Lancer `savePass1Cache` en fire-and-forget (sans await) et demarrer la passe 2 immediatement. Capturer le resultat via une promise pour mettre a jour `pass1Saved` plus tard.

```typescript
// PARALLELISE
const pass1CachePromise = savePass1Cache(pass1CacheKey, pass1Base64, { ... })
  .then(() => { pass1Saved = true; })
  .catch((err) => console.error("Pass1 cache save failed:", err));

// Lancer passe 2 IMMEDIATEMENT
console.log("Starting pass 2 (furniture)...");
```

**Estimation du gain** : **1-3 secondes** (temps d'upload + read-after-write verification dans Object Storage).

**Risque** : Aucun sur la qualite. Risque mineur : si la passe 2 echoue et qu'on veut retourner pass1_key, le cache pourrait ne pas etre encore ecrit. Mais le `pass1Saved` flag gere deja ce cas.
**Difficulte d'implementation** : Faible.
**Change la qualite de sortie** : Non.

---

## Recommandation 5 -- Eliminer les await de saveUserPhoto et logGeneration avant response

**Constat** : Depuis le Sprint 19 (Replit autoscale), `logGeneration` et `saveUserPhoto` sont `await`-ed AVANT de retourner la response (lignes 1526-1574, 1586-1601). Le commentaire explique que Replit tue le worker apres l'envoi de la reponse.

C'est un compromis latence vs fiabilite. Les operations de sauvegarde ajoutent de la latence visible par l'utilisateur :
- `saveUserPhoto` : 3 appels `saveImage` (output + input + pass1) avec read-after-write + retry + 1 INSERT DB = potentiellement **3-8 secondes**.
- `logGeneration` : 3 appels `saveImage` + 1 INSERT DB = potentiellement **3-8 secondes** supplementaires.

**Optimisation possible** : Utiliser `waitUntil()` de Next.js (si disponible sur Replit) ou un mecanisme de background job. Alternativement, retourner la reponse avec un streaming partiel (envoyer l'image immediatement, continuer les sauvegardes en arriere-plan).

**Estimation du gain** : **5-15 secondes** (le deuxieme plus gros levier apres le quality parameter).

**Risque** : Moyen-haut. Si Replit tue effectivement le worker apres la reponse, les images et logs seraient perdus. Il faut valider que `waitUntil()` ou un equivalent fonctionne sur l'infra Replit.
**Difficulte d'implementation** : Moyenne (necessite de valider le comportement Replit).
**Change la qualite de sortie** : Non.

---

## Recommandation 6 -- Reutiliser le client OpenAI (connection pooling)

**Constat** : Les fonctions `tryOpenAIResponses` et `tryOpenAIResponsesWithPrompt` instancient un nouveau `new OpenAI({ apiKey: ... })` a chaque appel (lignes 690 et 844). Cela signifie qu'un nouveau client HTTP est cree pour chaque passe.

**Optimisation** : Creer un singleton OpenAI client au niveau du module (comme le pool PostgreSQL dans db.ts).

```typescript
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}
```

**Estimation du gain** : **0.1-0.5 secondes** par requete (economie sur le handshake TLS/DNS pour la passe 2 qui reutilise la connexion de la passe 1).

**Risque** : Aucun. C'est un pattern standard.
**Difficulte d'implementation** : Triviale.
**Change la qualite de sortie** : Non.

---

## Recommandation 7 -- Modele plus rapide pour la passe 1

**Constat** : Les deux passes utilisent `model: "gpt-4.1"` pour le raisonnement vision. La passe 1 (surfaces) est une tache plus simple que la passe 2 (mobilier) -- elle n'a pas besoin de comprendre le style, juste d'appliquer des finitions basiques.

**Optimisation possible** : Utiliser `gpt-4.1-mini` pour la passe 1 (si compatible avec le tool image_generation). Le modele mini est plus rapide pour le raisonnement vision.

**Estimation du gain** : **3-10 secondes** sur la passe 1 (latence reduite du modele de raisonnement).

**Risque** : Moyen. Le modele mini pourrait etre moins precis sur la preservation de la geometrie (voutes, poutres, murs accent). Les 22 sprints de prompt engineering ont ete calibres sur gpt-4.1. A tester rigoureusement.
**Difficulte d'implementation** : Faible (changer le model string). Moyenne si on veut A/B tester.
**Change la qualite de sortie** : Potentiellement sur la passe 1. A valider par audit visuel Yann/Lucas.

---

## Recommandation 8 -- Output format PNG vers JPEG

**Constat** : Flux Depth Pro est configure avec `output_format: "png"` (ligne 809). Le PNG est ensuite telecharge, converti en base64, et passe a la passe 2. Le PNG est 3-5x plus lourd que le JPEG pour une photo.

**Optimisation** : Passer `output_format: "jpg"` pour Flux (fallback). Pour OpenAI, le resultat est toujours en PNG (pas de parametre), mais la conversion en JPEG avant de l'envoyer a la passe 2 reduirait la taille du payload.

**Estimation du gain** : **0.5-2 secondes** (download plus rapide du resultat Flux + payload plus petit pour la passe 2).

**Risque** : Faible. La compression JPEG a 85% est invisible pour le home staging. L'image finale est deja servie en JPEG au client.
**Difficulte d'implementation** : Triviale pour Flux. Faible pour la reconversion OpenAI.
**Change la qualite de sortie** : Negligeable (compression JPEG quasi-lossless a 85%).

---

## Recommandation 9 -- Cache passe 1 pour les iterations (deja en place)

**Constat** : Le cache passe 1 est deja implemente (`savePass1Cache` / `getPass1Cache`). Les iterations (F1) reutilisent la passe 1 cachee et ne font que la passe 2. C'est deja une optimisation significative pour les iterations.

**Optimisation supplementaire** : Pour un meme style applique a la meme photo (ex: l'utilisateur change d'avis sur le style), on pourrait theoriquement reutiliser la passe 1 si le `surfacePrompt` est identique. Mais les surfacePrompts different par style, donc cette optimisation a un impact limite.

**Estimation du gain** : Deja en place pour les iterations (gain de ~45s par iteration). Pas d'optimisation supplementaire facile.

---

## Tableau recapitulatif

| # | Optimisation | Gain estime | Risque | Difficulte | Modifie la qualite |
|---|---|---|---|---|---|
| 1 | quality: low/medium sur image_generation | 15-30s | Faible | Triviale | Non (passe 1) / A tester (passe 2) |
| 2 | detail: "low" sur input_image passe 1 | 3-8s | Moyen | Triviale | A tester (passe 1) |
| 3 | MAX_DIMENSION 2048 -> 1536 | 2-5s | Aucun | Triviale | Non |
| 4 | savePass1Cache en parallele | 1-3s | Aucun | Faible | Non |
| 5 | Deplacer saveUserPhoto/logGeneration post-reponse | 5-15s | Moyen-haut | Moyenne | Non |
| 6 | Singleton OpenAI client | 0.1-0.5s | Aucun | Triviale | Non |
| 7 | gpt-4.1-mini pour passe 1 | 3-10s | Moyen | Faible | A tester |
| 8 | Output PNG -> JPEG pour Flux | 0.5-2s | Faible | Triviale | Negligeable |

**Gain total estime (combinaison 1+3+4+6)** : **18-38 secondes** avec risque zero/faible.
**Gain total estime (toutes les optimisations)** : **30-73 secondes** avec certaines a valider.

---

## Plan d'implementation recommande

### Phase 1 -- Gains garantis (risque zero, implementation immediate)

1. **MAX_DIMENSION 2048 -> 1536** dans `lib/image-utils.ts` (R3)
2. **Singleton OpenAI client** dans `route.ts` (R6)
3. **savePass1Cache en parallele** dans `route.ts` (R4)
4. **quality: "low"** pour la passe 1 sur le tool `image_generation` (R1 partiel)

Gain estime : **18-36 secondes**. Zero impact qualite sur le livrable final.

### Phase 2 -- Gains a valider (necessite audit visuel)

5. **quality: "medium"** pour la passe 2 (R1 complet) -- lancer 10 generations comparatives high vs medium, faire auditer par agents Yann/Lucas
6. **detail: "low"** pour la passe 1 (R2) -- tester sur 5 images avec poutres/murs accent
7. **gpt-4.1-mini** pour la passe 1 (R7) -- tester sur 10 images variees

### Phase 3 -- Gains structurels (necessite validation infra)

8. **Deplacer les sauvegardes post-reponse** (R5) -- valider que `waitUntil()` ou equivalent fonctionne sur Replit
9. **Output JPEG pour Flux** (R8) -- changement mineur

---

## Comparaison avec la concurrence

Gepetto annonce 15 secondes par generation. Avec les optimisations Phase 1 (zero risque), on passerait de ~90s a ~55-70s. Avec Phase 1+2, on viserait ~35-50s. La parite a 15s n'est probablement pas atteignable avec un pipeline 2 passes sequentielles sur gpt-4.1 -- Gepetto utilise probablement un modele single-pass optimise ou un modele fine-tune plus rapide.

Pour atteindre 15s, il faudrait envisager des changements architecturaux plus profonds (hors scope de cette analyse) :
- Single-pass fine-tuned model (abandon du pipeline 2 passes)
- Modele Flux fine-tune sur le home staging (single-pass, ~5-10s)
- Pipeline hybride : modele rapide pour l'apercu + modele lent pour le HD en arriere-plan

---

**Handoff -> @fullstack**
- Fichiers produits : `docs/ia/latency-optimization.md`
- Decisions prises : 9 optimisations identifiees, classees par risque/gain. Phase 1 (4 optimisations) implementable immediatement sans risque qualite.
- Points d'attention : les recommandations 1 (quality) et 2 (detail) necessitent un audit visuel par les agents Yann Duval et Lucas Moreau avant deploiement en production. La recommandation 5 (post-reponse) necessite une validation du comportement Replit autoscale par @infrastructure.

---

Sources consultees :
- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [GPT Image 1.5 Model](https://platform.openai.com/docs/models/gpt-image-1.5)
- [Image generation tool docs](https://platform.openai.com/docs/guides/tools-image-generation)
- [input_fidelity cookbook](https://developers.openai.com/cookbook/examples/generate_images_with_high_input_fidelity)
- [GPT Image 1.5 Production Guide](https://evolink.ai/blog/gpt-image-1-5-api-guide)
- [OpenAI Image Generation Pricing 2026](https://www.aifreeapi.com/en/posts/openai-image-generation-api-pricing)
- [Images and vision guide](https://platform.openai.com/docs/guides/images-vision)
