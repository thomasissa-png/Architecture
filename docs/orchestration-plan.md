# Plan d'orchestration — VisiRenov F1 Review + F2 Type de piece

## Demande utilisateur
Phase 3 : Review croisee de l'implementation F1 (iteration commentaire). Puis lancement F2 (type de piece) : audit prompts Yann+Lucas, implementation fullstack, review.

## Mode detecte
Projet existant (MVP, 18 sprints d'historique) — Phases ciblees uniquement

## Profil utilisateur
- Niveau technique : Technique (fondateur solo + agents IA)
- Ton de communication : Technique
- Mode d'interaction : Standard (validation entre phases)

## Complexite estimee
Moyenne — 5 agents (reviewer, Yann, Lucas, fullstack, reviewer), 2 features sur 5 phases

---

## F1 — Iteration commentaire

### Phase 1 — Audit prompts iteration (Yann + Lucas en parallele)
- Statut : TERMINE
- Livrables : docs/ia/f1-iteration-prompts-yann.md, docs/ia/f1-iteration-prompts-lucas.md, docs/ia/f1-iteration-prompts.md
- Verdict : OK

### Phase 2 — Implementation fullstack
- Statut : TERMINE
- Livrables : lib/iteration-prompt.ts, lib/custom-prompt.ts (modifie), lib/db.ts (modifie), app/api/generate/route.ts (modifie), components/RefineModal.tsx, components/VersionSelector.tsx, app/page.tsx (modifie)
- Verdict : A verifier par Phase 3

### Phase 3 — Review croisee F1
- Agents : @reviewer
- Statut : EN COURS
- Livrables attendus : docs/reviews/f1-review.md
- Livrables recus : []
- Verdict verification : []

---

## F2 — Type de piece

### Phase F2.1 — Audit prompts par type de piece (Yann + Lucas en parallele)
- Agents : Yann Duval (interior-architect), Lucas Moreau (ai-image-expert)
- Parallelisation : OUI
- Statut : En attente (apres Phase 3 F1)
- Livrables attendus : docs/ia/f2-room-type-prompts.md
- Livrables recus : []
- Verdict verification : []

### Phase F2.2 — Implementation fullstack
- Agents : @fullstack
- Statut : En attente (apres Phase F2.1)
- Livrables attendus : lib/room-types.ts (nouveau), components/RoomTypePicker.tsx (nouveau), app/page.tsx (modifie), app/api/generate/route.ts (modifie), lib/custom-prompt.ts (modifie)
- Livrables recus : []
- Verdict verification : []

### Phase F2.3 — Review croisee F2
- Agents : @reviewer
- Statut : En attente (apres Phase F2.2)
- Livrables attendus : docs/reviews/f2-review.md
- Livrables recus : []
- Verdict verification : []

---

## Feedbacks remontants
| # | Severite | Agent source | Agent cible | Probleme | Statut |
|---|---|---|---|---|---|

## Decisions d'arbitrage
| # | Sujet | Decision | Justification | Agents impactes |
|---|---|---|---|---|
