# Audit IA Sprint 22 — Corrections prompts + agents

**Agent** : @ia | **Date** : 2026-03-27 | **PROMPT_VERSION** : v23

---

## 1. Corrections prompts Sprint 22 (7 items)

| # | Correction | Statut | Localisation |
|---|-----------|--------|-------------|
| P0-1 | Flux Depth Pro interdit passe 2 | PRESENT | `route.ts:984-986` — `if (pass !== 2 && process.env.REPLICATE_API_TOKEN)` skip Flux quand pass === 2 |
| P0-2 | Iterations preservent mobilier | PRESENT | `iteration-prompt.ts:26` — "REMAIN exactly as they are" dans les 6 builders (indoor Responses/Flux, outdoor Responses/Flux, adjust Responses/Flux) |
| P0-3 | allowWallMounted conditionnel | PRESENT | `custom-prompt.ts:145-220` — flag dans `preprocessIterationComment`, `iteration-prompt.ts:46-48` — suppression conditionnelle de "Do NOT attach to walls" |
| P1-1 | Cosy enrichi | PRESENT | `StylePicker.tsx:114` — chunky knit throw, pillar candles, layered cushions velvet/linen/boucle, string of pearls, cognac cushion |
| P1-2 | Prises electriques passe 1 | PRESENT | `route.ts:116,129,142,156,169,182,196,210,227,238,261,308` — "electrical outlets, round black wall boxes, cable exits" dans TOUS les builders passe 1 (indoor generique, room-type specifiques, outdoor, Flux) |
| P1-3 | Passe 2 forcee + retry | PRESENT | `route.ts:1461-1488` — boucle `for attempt 1..2`, fallback passe 1 seule avec `pass2Failed` flag |
| P2-1 | Anti-warm shift + grain | PRESENT | `route.ts:104` (LIGHT_PRESERVATION) + lignes 229,240,251,263,275,287,298,314,448,557,612,660 — "no warm tint or yellow cast" + "film grain visible at 100% zoom" dans tous les builders |

**Verdict corrections : 7/7 PRESENT**

---

## 2. Agents (5 fichiers)

| Critere | interior-architect | ai-image-expert | paysagiste | marchand-de-biens | client-mandataire |
|---------|-------------------|----------------|------------|-------------------|-------------------|
| Frontmatter correct | CONFORME | CONFORME | CONFORME | CONFORME | CONFORME |
| Protocole entree | CONFORME | CONFORME | CONFORME | CONFORME | CONFORME |
| Grille 10 criteres | CONFORME (poids x2 sur #1 et #6) | CONFORME (poids x2 sur #1 et #10) | CONFORME | CONFORME | CONFORME |
| Regles memoire Sprint 22 | CONFORME (7 regles L81-89) | CONFORME (5 regles L79-84) | N/A (outdoor) | N/A (UX) | N/A (UX) |
| Methode audit visuel | CONFORME (curl + Read + batch 6) | CONFORME (curl + Read + batch 6) | CONFORME (batch 6) | N/A | N/A |
| Collaboration croisee | CONFORME (Lucas + Camille) | CONFORME (Yann + Camille) | CONFORME (Lucas) | CONFORME (Marc) | CONFORME (Thomas) |

**Verdict agents : 5/5 CONFORME** — agents specialises (marchand/client) n'ont pas de regles memoire prompt, ce qui est correct (domaine UX, pas prompts).

---

## 3. Coherence inter-fichiers

| Verification | Resultat |
|-------------|---------|
| CLAUDE.md Sprint 22 vs agents | COHERENT — les 7 regles memoire sont identiques dans CLAUDE.md, interior-architect.md et ai-image-expert.md |
| Prompt /admin vs agents | COHERENT — mentionne les 3 agents (Yann, Lucas, Camille), grilles 10 criteres, batch 6 |
| PROMPT_VERSION v23 vs changements | COHERENT — v23 documente les corrections Sprint 22 dans le commentaire historique L30-31 |
| Flux interdit P2 dans CLAUDE.md vs route.ts | COHERENT — regle CLAUDE.md "NE JAMAIS utiliser Flux Depth Pro en passe 2" = `if (pass !== 2)` dans route.ts |

**Zero incoherence detectee.**

---

## 4. Detection de regressions

| Verification | Resultat |
|-------------|---------|
| Builders standard (pas iteration) | OK — pas de modification accidentelle, prompts indoor/outdoor intacts |
| Styles autres que Cosy | OK — verification par Grep : seul le Cosy a ete modifie dans StylePicker.tsx (furniturePrompt) |
| Prompts outdoor | OK — `buildOutdoorSurfacesResponsesPrompt` et `buildOutdoorFurnitureResponsesPrompt` intacts, contiennent anti-warm shift + grain |
| Fallback Flux passe 1 | OK — `if (pass !== 2 && process.env.REPLICATE_API_TOKEN)` autorise Flux en passe 1 |
| Iteration outdoor | OK — `buildIterationOutdoorFurnitureResponsesPrompt` et Flux contiennent "REMAIN exactly" |

**Zero regression detectee.**

---

## 5. Recommandations

1. **Budget IA mensuel toujours indefini** dans project-context.md — a definir avant mise en production commerciale
2. **PROMPT_VERSION** : documenter le changelog v22->v23 dans un commentaire inline (actuellement le commentaire historique saute de v18 a v23)
3. **Paysagiste** : n'a pas de regles memoire specifiques au warm shift / grain pour les prompts outdoor — les builders outdoor les incluent deja, mais l'agent devrait les connaitre pour ses audits

---

## 6. Verdict final

**GO** — Les 7 corrections Sprint 22 sont presentes et correctement implementees. Les 5 agents sont conformes. Zero incoherence inter-fichiers. Zero regression detectee. Le codebase est coherent et pret pour les audits visuels.

---

**Handoff → @orchestrator**
- Fichier produit : `docs/reviews/ia-audit-sprint22.md`
- Decisions validees : 7/7 corrections presentes, 5/5 agents conformes, 0 regression
- Points d'attention : budget IA mensuel a definir, changelog PROMPT_VERSION v19-v22 manquant dans le commentaire
