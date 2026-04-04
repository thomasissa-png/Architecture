# Audit condensation prompts v45 — Agent @ia

**Date** : 2026-04-04
**Fichiers audites** : `lib/generation-pipeline.ts`, `lib/iteration-prompt.ts`
**Objectif** : passer de ~800 mots a ~200 mots par prompt pour eliminer les rejections safety filter gpt-image-1.5
**Contexte** : 8 rejections consecutives sur iterations avec anciens prompts

---

## 1. Safety filter — termes a risque restants

**iteration-prompt.ts** : CLEAN. Zero CAPS agressif, zero "DO NOT" repete, zero "NEVER", zero "MUST". Ton neutre et instructif. Le travail de condensation est excellent ici.

**generation-pipeline.ts** : ameliore mais 4 zones a risque residuelles :

| Ligne | Terme | Risque | Correction suggeree |
|---|---|---|---|
| ~134 | `NOT wood, NOT parquet` (CAPS) | Moyen — double negation en CAPS | `ceramic or stone tiles only` (positif) |
| ~266 | `Do NOT add a ceiling pendant` | Moyen — negation directive | `Ceiling light already set in pass 1 — skip it here` |
| ~420 | `PRESERVE EXACTLY:` (outdoor P1) | Faible — CAPS mais contexte preservation | Acceptable — "Edit this outdoor photo. Keep the space geometry..." |
| ~445 | `PRESERVE EXACTLY:` (outdoor P2) | Faible — idem | Acceptable |
| ~285 | `LOCKED elements` | Faible — langage directif | `Treat existing fixtures as fixed` |

Les constantes partagees (PASS1_PREAMBLE, PASS2_PREAMBLE, ANTI_FENETRE etc.) sont propres — ton factuel, pas de langage agressif.

**Verdict safety** : 7/10 — les iterations (source des 8 rejections) sont clean. Les builders principaux ont 3 corrections mineures a faire.

## 2. Signal/bruit

**Meilleur qu'avant.** Les prompts iteration sont passes de ~400 mots a ~120 mots. Chaque phrase a un role clair. Le pattern "Edit this photo. [preserve]. [change]. [constraints]. [photo quality]." est lisible et hierarchise.

Les builders generation-pipeline restent plus longs (~200-300 mots pour kitchen/bathroom) mais c'est justifie par la complexite de ces pieces. Le fallback generique est a ~180 mots — bon ratio.

**Point faible** : les constantes CEILING_PRESERVATION et WALL_PRESERVATION sont encore des phrases longues (~25 mots chacune). A condenser si les rejections persistent sur les generations (pas les iterations).

**Verdict signal/bruit** : 8/10

## 3. Directives perdues critiques

| Directive historique | Presente ? | Risque regression |
|---|---|---|
| Anti-warm shift | OUI — LIGHT_PRESERVATION "Keep whites neutral" | OK |
| Anti-fenetre hallucinee | OUI — ANTI_FENETRE "Same number... Solid walls stay solid" | OK |
| Scaling mobilier compact | OUI — conditionals kitchen/bathroom/bedroom | OK |
| Contact shadows | OUI — CONTACT_SHADOWS constant | OK |
| Equipment preservation (radiateurs) | OUI — EQUIPMENT_PRESERVATION + builders | OK |
| Distribution profondeur | OUI — fallback + kitchen + bedroom specifiques | OK |
| Anti-invention archi | OUI — ANTI_INVENTION constant | OK |
| Column preservation | OUI — COLUMN_PRESERVATION constant | OK |
| Accent wall preservation | OUI — bedroom + fallback builders | OK |
| **Grain ISO / vignetting** | ABSENT — conforme decision fondateur (interdit) | OK |

**Aucune directive critique perdue.** Toutes les corrections des Sprints 12-24 sont preservees dans les constantes ou les builders dedies.

**Verdict directives** : 9/10

## 4. Compatibilite gpt-image-1.5

- "Edit this photo" en premier token de chaque prompt : OUI (PASS1_PREAMBLE, PASS2_PREAMBLE, iterations)
- Preservation AVANT style : OUI — PREAMBLE puis ANTI_FENETRE puis CAMERA puis LIGHT puis style
- Pattern keep/change clair : OUI — "CHANGE ONLY the surface finishes: ..." / "ADD the following..."
- `action: "edit"` dans le tool config : OUI (ligne 519)
- `input_fidelity: "high"` : OUI (ligne 520)

**Verdict compatibilite** : 9/10 — alignement correct avec la doc OpenAI image editing.

## 5. Verdict global

**Note : 8/10**

**Verdict : GO conditionnel** — deployer les iterations immediatement (clean, source des rejections). Corriger 3 formulations dans generation-pipeline.ts avant le prochain batch de generations.

### Corrections P1 (avant prochaines generations)

1. Ligne ~134 : `NOT wood, NOT parquet` → `ceramic or stone tiles only`
2. Ligne ~266 : `Do NOT add a ceiling pendant` → `Ceiling light already set — skip here`
3. Ligne ~285 : `LOCKED elements` → `fixed elements`

### Corrections P2 (si rejections persistent)

4. Outdoor builders : `PRESERVE EXACTLY:` → `Keep the following unchanged:`
5. Condenser CEILING_PRESERVATION et WALL_PRESERVATION de ~25 mots a ~15 mots

---

**Handoff → @fullstack**
- Fichiers a modifier : `lib/generation-pipeline.ts` (3 corrections P1 lignes ~134, ~266, ~285)
- Pas de modification iteration-prompt.ts — prompts clean
- Deployer en l'etat pour les iterations, appliquer P1 avant prochaines generations
