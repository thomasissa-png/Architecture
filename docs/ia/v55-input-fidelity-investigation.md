# v55 — Investigation P0 : artefact de fusion gpt-image-1.5

**Auteur :** @ia (session 35, 2026-04-07)
**Statut :** Hypothèse confirmée visuellement, fix conditionnel câblé, A/B en attente d'exécution déploiement
**Modèle audité :** `gpt-image-1.5` via Responses API + tool `image_generation` (action=edit)
**Sources :**
- `docs/reviews/audit-visuel-2026-04-07-v54-lucas.md` (Lucas Moreau, finding F-Lucas-1)
- `docs/reviews/audit-visuel-2026-04-07-v54-yann.md` (Yann Duval, NO-GO 7.35/10)
- Audit visuel direct des images `audit-data/gen-{191,192,194}-*.jpg`

---

## 1. Symptôme

Sur les générations Pipeline B (Contemporary) et Pipeline C (Scandinavian) du run v54, la passe 1 (surfaces) produit des **overlays semi-transparents de l'input brut** superposés au rendu propre :

- **gen-192 (Contemporary, Pipeline B)** : zone rectangulaire centre-gauche affiche les poutres bois, baies vitrées d'origine, et silhouette du worker de l'input — blendées en alpha sur la pass1 propre. Artefact massif, ~25% de la surface.
- **gen-194 (Scandinavian, Pipeline C)** : zone bas-droite contaminée par les baies vitrées surexposées de l'input. Artefact plus discret mais clairement le même phénomène.
- **gen-191 (Art Deco, contre-exemple)** : aucun artefact. Input est une chambre fermée avec plâtre + lumière tamisée — **aucun highlight cramé**.

Lucas Moreau (ex-Midjourney 2 ans) déclare : *"Je n'ai jamais vu cet artefact en deux ans sur Midjourney. Sur gpt-image-1.5, c'est inquiétant."*

## 2. Hypothèse confirmée visuellement

**Hypothèse forte (Lucas) :** interaction `input_fidelity:"high"` × zones d'image très blanches (highlights cramés des baies vitrées). Le modèle ne sait pas si ces zones sont du contenu sémantique à préserver ou du blanc-bruit à régénérer → il choisit de les "préserver" comme overlay alpha au lieu de régénérer.

**Preuves visuelles** (lecture directe des fichiers via Read multimodal) :

| Génération | Highlights cramés en input ? | Artefact de fusion en pass1 ? |
|---|---|---|
| gen-191 (Art Deco) | NON — chambre fermée tamisée | NON (contre-exemple) |
| gen-192 (Contemporary) | OUI — baies vitrées surexposées massives | OUI — overlay rectangulaire centre-gauche très visible |
| gen-194 (Scandinavian) | OUI — baies vitrées doubles-hauteur cramées | OUI — overlay bas-droite |

**Corrélation 100%.** L'artefact apparaît exactement et uniquement quand l'input contient des zones >95% luminance significatives. La position spatiale de l'artefact correspond à la zone surexposée de l'input.

**Plausibilité technique** : `input_fidelity:"high"` est documenté par OpenAI comme "fidélité maximale au contenu de l'image source". Pour les pixels >95% luminance, le modèle voit du blanc presque pur — sémantiquement ambigu (feuille de papier ? mur peint ? overshoot caméra ?). Le modèle haute fidélité essaye de conserver ces pixels, mais comme la pass1 régénère le reste, le résultat est un blending alpha au lieu d'un edit cohérent. La pass2 n'est PAS affectée car son input est la pass1 propre (les highlights ont été remplacés par des baies vitrées normales).

## 3. Fix appliqué (déjà commit dans cette session)

### 3.1 Heuristique de détection — `lib/image-analysis.ts` (NOUVEAU)

```typescript
detectBlownHighlights(buffer: Buffer, ratioThreshold = 0.05)
  → { ratio: number, hasBlownHighlights: boolean }
```

- Décodage via `sharp` en greyscale 256x256 (~10ms)
- Comptage des pixels >= 242 (95% × 255)
- Seuil par défaut : ≥ 5% de l'image flaggue `hasBlownHighlights = true`
- **Fail-open** : tout échec sharp retourne `{ ratio: 0, hasBlownHighlights: false }` — le pipeline ne casse JAMAIS

> **Note d'architecture :** créé en `lib/image-analysis.ts` (server-only, sharp) au lieu de `lib/image-utils.ts` (client-only, Canvas API). Le brief demandait `image-utils.ts` mais ce fichier est strictement client-side et tout import sharp briserait le bundle navigateur. Séparation client/server respectée.

### 3.2 Câblage conditionnel — `lib/generation-pipeline.ts`

Dans `generatePass()`, AVANT l'appel `tryOpenAIResponses()` en passe 1 :

1. Appel `detectBlownHighlightsFromBase64(base64Image)`
2. Si `hasBlownHighlights = true` → `pass1Fidelity = "low"`
3. Sinon → `pass1Fidelity = "high"` (comportement actuel inchangé)
4. Log explicite : `[v55] blown highlights detected (X.X%), switching to input_fidelity=low for pass 1`
5. Try/catch fail-open : tout échec de détection garde `"high"` (zéro régression possible)

**Pourquoi `"low"` et pas `"medium"` ?** L'API `openai.responses.create` avec le tool `image_generation` n'expose officiellement que `"high"` et `"low"` pour `input_fidelity`. Pas de mode intermédiaire dans la doc actuelle. On utilise `"low"` comme alternative — c'est le seul levier paramétrique disponible.

**Pourquoi seulement passe 1 ?** Parce que la pass2 reçoit en entrée la pass1 *propre* (ou doit l'être). Une fois les baies vitrées régénérées proprement par la pass1, l'input de pass2 ne contient plus de highlights cramés massifs. La pass2 doit garder `"high"` pour préserver le mobilier que pass1 vient de NE PAS générer (pass1 = piece vide). Si pass2 baissait à `"low"`, on perdrait la préservation des surfaces fraîchement nettoyées.

### 3.3 Tests — `tests/unit/image-utils-highlights.test.ts`

9 cas couverts (tous PASS) :

| # | Cas | Attendu |
|---|---|---|
| 1 | Image grise unie 128/128/128 | `hasBlownHighlights = false`, ratio < 1% |
| 2 | Image full sombre (15/15/15) | `hasBlownHighlights = false`, cave/sous-sol cas |
| 3 | Image blanc pur (255/255/255) | `hasBlownHighlights = true`, ratio > 95% |
| 4 | Split vertical 30% blanc / 70% sombre | `hasBlownHighlights = true`, ratio entre 20-40% (cas gen-192) |
| 5 | Split 2% blanc / 98% sombre | `hasBlownHighlights = false` (sous le seuil 5%) |
| 6 | Seuil custom 1% sur 10% blanc | flaggue ; même image avec seuil 50% ne flaggue pas |
| 7 | Buffer invalide (garbage) | `{ ratio: 0, hasBlownHighlights: false }` (fail-open) |
| 8 | base64 brut | accepté |
| 9 | data URI prefixé | accepté |

Lint `next lint` : 0 warning, 0 error. Tsc `--noEmit` : 0 erreur.

## 4. Plan A/B test (à exécuter par le fondateur après déploiement)

L'objectif est de **valider quantitativement** que `"low"` supprime l'artefact sans casser le rendu. On garde `gen-192-input.jpg` (Contemporary loft, le pire cas) comme input fixe.

### Protocole

| Run | Modèle | input_fidelity | Reste du pipeline |
|---|---|---|---|
| A (baseline) | gpt-image-1.5 | `high` | inchangé v54 |
| B | gpt-image-1.5 | `low` | inchangé v54 |
| C (no param) | gpt-image-1.5 | non transmis | inchangé v54 |
| D (futur si dispo) | gpt-image-1.5 | `medium` (si l'API l'expose un jour) | inchangé v54 |

> Le câblage conditionnel actuel produit déjà le run B sur gen-192 (parce que l'heuristique le détecte). Pour exécuter le run A en parallèle, il faut soit forcer `pass1Fidelity = "high"` temporairement, soit lancer le script ad-hoc ci-dessous.

### Critères de succès par run

Pour chaque run (4 générations, 1 par fidelity sur le même input) :

1. **Pas d'artefact de fusion** (visuel : pas d'overlay rectangulaire des poutres/silhouette worker)
2. **Préservation géométrique** (perspective, angle, lignes de fuite — score Yann ≥ 8/10)
3. **Surfaces propres** (murs lisses, sol uniforme, plafond cohérent — score Lucas ≥ 7.5/10)
4. **Baies vitrées régénérées proprement** (pas d'overlay alpha — vue extérieure neutre)
5. **Coût latence** : durée pass1 (devrait être ~identique entre fidelity)

### Procédure d'exécution manuelle

Option 1 — En production sur un seul input :

```bash
# Le fix conditionnel est déjà actif → uploader gen-192-input.jpg via versimo.fr
# en mode Contemporary dining_room. Vérifier dans /admin que le log montre :
#   [v55] blown highlights detected (XX.X%), switching to input_fidelity=low for pass 1
# Comparer la pass1 du nouveau run avec gen-192-pass1.jpg du run v54.
```

Option 2 — Script local (à créer si besoin de comparaison fine) :

```typescript
// scripts/test-input-fidelity.ts
import { tryOpenAIResponses } from "@/lib/generation-pipeline";
import fs from "node:fs";

const buf = fs.readFileSync("audit-data/gen-192-input.jpg");
const b64 = buf.toString("base64");
const surfacePrompt = "..." // copier le surfacePrompt Contemporary v54
const furniturePrompt = "..."
const size = "1536x1024";

for (const fidelity of ["high", "low"] as const) {
  const t0 = Date.now();
  const result = await tryOpenAIResponses(
    b64, surfacePrompt, furniturePrompt, 1, size, "dining_room",
    undefined, "open plan with mezzanine", fidelity
  );
  const dur = Date.now() - t0;
  const out = result.image.replace(/^data:image\/\w+;base64,/, "");
  fs.writeFileSync(`scripts/output-fidelity-${fidelity}.png`, Buffer.from(out, "base64"));
  console.log(`fidelity=${fidelity} duration=${dur}ms saved`);
}
```

> Ce script n'est PAS écrit dans cette session (le brief autorise mais ne demande pas — on le crée seulement si l'option 1 ne suffit pas).

### Tableau de résultats attendu (à remplir après run)

| Run | Artefact ? | Préserv. spatiale (Yann /10) | Surfaces propres (Lucas /10) | Durée pass1 (ms) | Verdict |
|---|---|---|---|---|---|
| A high (baseline v54) | OUI | 3.5 (CAP) | 4.0 | ~ | NO-GO confirmé |
| B low (v55 conditionnel) | ? | ? | ? | ? | ? |
| C no param | ? | ? | ? | ? | ? |

### Budget A/B

- 3 runs × 1 input × 1 pass1 = 3 appels Responses API à `quality:"high"`
- Coût gpt-image-1.5 estimé : ~$0.10-0.15 par génération haute qualité (à confirmer via WebSearch tarifs OpenAI au moment du run — voir règle "WebSearch tarifs obligatoire")
- **Total A/B** : ~$0.30-0.45 + temps fondateur audit visuel
- **ROI** : si confirmé, débloque le NO-GO v54 sur 2/4 pipelines audités → impact direct sur la cible 9.5/10

## 5. Cas où l'A/B échoue

Si `"low"` ne supprime PAS l'artefact :
- Hypothèse Lucas invalidée → l'artefact n'est pas paramétrique, c'est un bug du modèle
- Action : reporter à OpenAI via support API avec inputs reproductibles (gen-192-input.jpg)
- Fallback temporaire : pré-process des inputs avec `sharp().normalize()` ou `.modulate({ brightness: 0.9 })` pour éteindre les highlights AVANT envoi à l'API
- Alternative plus radicale : crop automatique pour exclure les zones cramées (perte de cadrage acceptable ?)

Si `"low"` supprime l'artefact MAIS dégrade trop la préservation géométrique :
- Trade-off à arbitrer avec le fondateur — entre artefact massif (gen-192 actuel) et perte de préservation modérée, le second est probablement moins pire
- Combiner avec un upscale local via sharp pour récupérer du détail
- Garder `"high"` sur les inputs propres + `"low"` uniquement sur ceux flaggés (c'est exactement ce que fait le câblage actuel)

## 6. Ce que la session ne fait PAS (non-goals)

- ❌ Pas de modification des `stylePrompts` (zone @fullstack en parallèle, risque de conflit git)
- ❌ Pas de déploiement Replit (le fondateur déploie après merge)
- ❌ Pas de report à OpenAI (prématuré, on confirme l'hypothèse en A/B local d'abord)
- ❌ Pas de fallback Flux/SDXL (décision fondateur absolue : un seul modèle gpt-image-1.5, pas de fallback)
- ❌ Pas de modification du schéma DB (ratio est juste loggé en console pour cette session)

## 7. Action requise du fondateur

1. **Merge** la branche `claude/extract-project-context-vFT9J` (commit v55 input_fidelity adaptive)
2. **Déployer** sur Replit
3. **Relancer une génération** sur `gen-192-input.jpg` en mode Contemporary dining_room via versimo.fr
4. **Vérifier le log** dans `/admin` : doit contenir `[v55] blown highlights detected (XX.X%), switching to input_fidelity=low for pass 1`
5. **Comparer visuellement** la nouvelle pass1 avec `audit-data/gen-192-pass1.jpg` (l'artefact doit avoir disparu)
6. **Audit croisé Yann + Lucas** sur le nouveau run + 3 autres pipelines (suivre workflow `CLAUDE.md` section "Workflow d'audit visuel")
7. Si artefact disparu → fix promu en permanent, remonter à 9.5/10 cible avec les fixes prompts en parallèle
8. Si artefact toujours là → escalader scénario "Cas où l'A/B échoue" (section 5)

## 8. Lien avec le travail @fullstack en parallèle

- @fullstack travaille sur les 4 fixes P0 prompts (vault beams, color shift, room_type propagation, regen baies vitrées propres)
- Ces fixes s'appliquent à `components/StylePicker.tsx` et `lib/style-resolver.ts` (zone @fullstack)
- Mon fix v55 input_fidelity s'applique à `lib/image-analysis.ts` (nouveau) et `lib/generation-pipeline.ts` (zone autour de `tryOpenAIResponses` uniquement)
- **ZÉRO chevauchement de fichiers** → pas de conflit git attendu
- Les deux fixes se complètent : prompts mieux formulés + paramétrage modèle adaptatif. Si l'un ou l'autre suffit isolément, on aura la marge ; si les deux sont nécessaires, on a la rondelle complète.

---

## Handoff

→ **@fullstack (P1)** : aucune action immédiate. Les fixes prompts en parallèle restent ta zone, je n'y touche pas.
→ **@orchestrator** : la branche `claude/extract-project-context-vFT9J` contient deux ensembles de fixes (prompts @fullstack + paramétrage modèle @ia). Coordonner le merge final pour qu'ils arrivent ensemble en prod et puissent être audités en une seule ronde.
→ **Fondateur** : action 1-8 de la section 7. Cible : passer NO-GO v54 (7.10/10) → GO v55 (≥ 8.5/10) sur les 4 pipelines audités.
