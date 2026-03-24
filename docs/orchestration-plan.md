# Plan d'orchestration — VisiRenov F1 Iteration commentaire

## Demande utilisateur
Implementer F1 (Iteration commentaire) : permettre a l'utilisateur d'affiner un resultat genere en saisissant un commentaire, declenchant une re-passe 2 uniquement (surfaces preservees). Inclure obligatoirement les agents metier Yann Duval et Lucas Moreau pour la strategie prompts.

## Mode detecte
Projet existant (MVP, 18 sprints d'historique) — Phases ciblees uniquement

## Profil utilisateur
- Niveau technique : Technique (fondateur solo + agents IA)
- Ton de communication : Technique
- Mode d'interaction : Standard (validation entre phases)

## Complexite estimee
Moyenne — 4 agents (Yann, Lucas, fullstack, reviewer), 3 phases

## Plan par phase

### Phase 1 — Audit prompts iteration (Yann + Lucas en parallele)
- Agents : Yann Duval (interior-architect), Lucas Moreau (ai-image-expert)
- Parallelisation : OUI (pas de dependance entre eux)
- Statut : Termine
- Livrables attendus : docs/ia/f1-iteration-prompts-yann.md, docs/ia/f1-iteration-prompts-lucas.md, docs/ia/f1-iteration-prompts.md (fusionne)
- Livrables recus : docs/ia/f1-iteration-prompts-yann.md (Yann — stylistique), docs/ia/f1-iteration-prompts-lucas.md (Lucas — technique), docs/ia/f1-iteration-prompts.md (fusionne pour @fullstack)
- Verdict verification : OK — recommandations coherentes, pas de contradiction entre les deux agents. Decisions cles alignees : enrichir pas remplacer, builders separes, modifications en tete du prompt, cumul des iterations, meta.json avec cache passe 1

### Phase 2 — Implementation fullstack
- Agents : @fullstack
- Parallelisation : NON (depend des recommandations Phase 1)
- Statut : En attente
- Livrables attendus : modifications de route.ts, page.tsx, composants, lib/
- Livrables recus : []
- Verdict verification : []

### Phase 3 — Review croisee
- Agents : @reviewer
- Parallelisation : NON (depend de Phase 2)
- Statut : En attente
- Livrables attendus : docs/reviews/f1-review.md
- Livrables recus : []
- Verdict verification : []

## Feedbacks remontants
| # | Severite | Agent source | Agent cible | Probleme | Statut |
|---|---|---|---|---|---|

## Decisions d'arbitrage
| # | Sujet | Decision | Justification | Agents impactes |
|---|---|---|---|---|
