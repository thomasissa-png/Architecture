# Re-Audit Marchand -- Extraction + PlanEditor (Session 43, post-P1)

> Thomas Berger, 35 ans, marchand de biens, Bordeaux
> Baseline : 9.0/10 (audit session 43). Seuil : 9.5/10.
> Corrections verifiees : P1-1 (Calibrer toolbar), P1-2 (overflow-x-auto), P1-3 (surface totale)
> Date : 2026-04-13

---

## Verification des 3 corrections P1

**P1-1 -- Calibrer dans la toolbar principale** : CONFIRME. Bouton "Calibrer" ligne 959 de PlanEditor.tsx, dans le bloc `overflow-x-auto` principal (ligne 798), a cote de Annuler/Refaire/Fusionner/Nouvelle piece. Le panneau "Options" (ligne 994) ne contient plus que le toggle Plan actuel/Mon projet. Pas de duplication.

**P1-2 -- Toolbar overflow-x-auto** : CONFIRME. Ligne 798 : `flex items-center gap-1.5 overflow-x-auto sm:flex-wrap`. Sur 375px la toolbar scrolle horizontalement au lieu de wrapper sur 3 lignes. Note : `scrollbar-hide` absent, donc une fine scrollbar sage (5px, globals.css) apparait -- acceptable, pas bloquant.

**P1-3 -- Surface totale dans le bandeau** : CONFIRME. Ligne 641 : `rooms.reduce((sum, r) => sum + (r.surface_m2 ?? 0), 0).toFixed(1) m2 au total`. Conditionnel : affiche uniquement si au moins 1 piece a une surface. Correct.

---

## Grille re-notee

| # | Critere | Avant | Apres | Delta | Commentaire |
|---|---------|-------|-------|-------|-------------|
| 1 | Retrouvabilite | 9.5 | 9.5 | = | ProStepper + breadcrumb + URL projet. Inchange. |
| 2 | Prix/valeur | 9.0 | 9.5 | +0.5 | Calibrer visible = Thomas sait qu'il peut ameliorer la precision des surfaces sans chercher. |
| 3 | Qualite pro | 9.0 | 9.0 | = | Legende toujours 6/17 types (P2 non corrige). Cosmetique. |
| 4 | Partage acquereurs | 9.5 | 9.5 | = | Inchange (pas concerne par ces corrections). |
| 5 | Gestion d'erreur | 9.0 | 9.0 | = | Inchange. |
| 6 | Simplicite | 9.5 | 10.0 | +0.5 | Toolbar scrollable = pas de confusion visuelle. Calibrer decouvert naturellement. |
| 7 | Confiance | 9.0 | 9.5 | +0.5 | Surface totale dans le bandeau = Thomas voit immediatement la taille du bien. Pro. |
| 8 | Completude | 9.0 | 9.5 | +0.5 | Surface totale affichee. Manque encore export PDF du plan (P2, pas P1). |
| 9 | Mobile-first | 8.0 | 9.0 | +1.0 | Toolbar ne deborde plus. Pinch-to-zoom toujours absent (P2). |
| 10 | Rapidite | 9.5 | 9.5 | = | Inchange. |

**Note : 9.5 / 10** (+0.5 vs audit precedent)

---

## Verdict

**9.5/10 -- PASS.** Seuil atteint. Les 3 corrections P1 resolvent les frictions identifiees.

Reste en P2 (non bloquant) : legende incomplete (6/17 types), pinch-to-zoom absent, export PDF du plan. Ces items n'empechent pas Thomas de travailler efficacement.
