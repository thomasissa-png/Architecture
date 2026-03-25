# Re-audit Design Frontend — Versiroom
**Date :** 2026-03-25 | **Agent :** @design | **Scope :** globals.css, page.tsx (pricing), AuthModal.tsx, compte/page.tsx, MerchantMode.tsx, mes-dossiers/page.tsx

---

## Tableau 10 critères

| # | Critère | Note avant | Note après | Delta | Statut |
|---|---|---|---|---|---|
| 1 | **Cohérence tokens couleurs** — bg-white, var(), bg-background/40 | 5/10 | 8/10 | +3 | Résidu : `bg-foreground/8` dans AuthModal (divider), `bg-foreground/[0.01]` dans mes-dossiers (arbitraire) |
| 2 | **Typography scale** — text-[10px], classes hors-échelle | 6/10 | 8/10 | +2 | Résidu : `text-[11px]` ×2 dans page.tsx (sous bouton Affiner, badge statut dossier) |
| 3 | **Focus rings** — focus:ring vs focus-visible:ring | 4/10 | 7/10 | +3 | Résidu critique : inputs AuthModal utilisent `focus:ring-2` (pas `focus-visible:`) sur les 3 champs email/password/name |
| 4 | **Border cohérence** — /5 séparateurs, /10 interactifs | 5/10 | 8/10 | +3 | Résidu : inputs dans compte/page.tsx (`border-foreground/5` au lieu de `/10` pour interactifs) |
| 5 | **Rounded cohérence** — rounded-full sur CTAs | 6/10 | 9/10 | +3 | Conforme. CTAs primaires rounded-full, cards rounded-2xl, inputs rounded-xl. |
| 6 | **active:scale feedback** — CTAs primaires | 5/10 | 9/10 | +4 | Conforme sur tous les CTA primaires vérifiés. |
| 7 | **prefers-reduced-motion** | 3/10 | 9/10 | +6 | Conforme dans globals.css. Couvre fadeInUp + reveal + delays. |
| 8 | **Accessibilité WCAG 2.2 AA** — contrastes, ARIA | 6/10 | 8/10 | +2 | Résidu : toggle password (tabIndex=-1, acceptable) ; `bg-foreground/8` divider = valeur non-standard (rendu imprévisible). |
| 9 | **Hors-système Tailwind** — valeurs arbitraires restantes | 4/10 | 8/10 | +4 | Résidu : `bg-foreground/[0.01]`, `bg-foreground/[0.03]`, `bg-foreground/8` (3 occurrences) — non présents dans la palette définie. |
| 10 | **Cohérence cross-composants** — même pattern sur tous les fichiers | 5/10 | 8/10 | +3 | Résidu : spinner dans compte/page.tsx utilise `border-t-foreground` (pas `border-t-sage` comme dans mes-dossiers). |

**Score global : 8.2/10** (vs ~4.9/10 avant corrections)

---

## Tokens hors-système restants

| Valeur | Fichier | Ligne approx. | Correction |
|---|---|---|---|
| `bg-foreground/8` | AuthModal.tsx | ~276, ~278 | → `bg-foreground/10` (séparateur) |
| `focus:ring-2 focus:ring-sage/60` | AuthModal.tsx inputs | ~289, ~300, ~313 | → `focus-visible:ring-2 focus-visible:ring-sage/60` |
| `border border-foreground/5` sur inputs | compte/page.tsx | ~375, ~445 | → `border-foreground/10` (interactifs) |
| `bg-foreground/[0.01]` | mes-dossiers/page.tsx | ~184 | → `bg-foreground/[0.02]` ou supprimer (< seuil perceptible) |
| `bg-foreground/[0.03]` | mes-dossiers/page.tsx + compte | ~184, ~403 | → `bg-foreground/5` (hover state standard) |
| `text-[11px]` | page.tsx | ~1317, ~1333 | → `text-xs` |
| `border-t-foreground` (spinner) | compte/page.tsx | ~282 | → `border-t-sage` (aligner sur mes-dossiers) |

---

## Frictions restantes pour atteindre 9/10

**Bloquant (WCAG)**
- `focus:ring` → `focus-visible:ring` sur les 3 inputs AuthModal. Les inputs email/password/name activent le ring au clic souris — comportement non conforme WCAG 2.2 SC 2.4.11.

**Majeur (cohérence système)**
- `bg-foreground/8` : Tailwind interprète `/8` comme opacity 3.1% — valeur à la limite du perceptible, non documentée dans le système. Remplacer par `/10` (= 4%) qui est le token séparateur établi.
- `border-foreground/5` sur les inputs de compte/page.tsx : les interactifs doivent être `/10`, pas `/5` (règle établie au premier audit).

**Mineur (finition)**
- `text-[11px]` ×2 dans page.tsx : l'échelle typographique ne descend pas en dessous de `text-xs` (12px). Ces deux occurrences cassent la règle.
- Spinner incohérent (`border-t-foreground` vs `border-t-sage`) : choisir `border-t-sage` comme token de loading partout.
- `bg-foreground/[0.01]` (opacity 0.4%) dans les cards dossiers est imperceptible visuellement et peut être supprimé — seul le hover state `/[0.03]` → `bg-foreground/5` a de la valeur.

---

**Handoff → @fullstack**
- Fichiers concernés : `/components/AuthModal.tsx`, `/app/compte/page.tsx`, `/app/mes-dossiers/page.tsx`, `/app/page.tsx`
- 7 corrections listées ci-dessus, toutes des substitutions directes (search & replace)
- Priorité 1 : `focus:ring` → `focus-visible:ring` dans AuthModal (WCAG bloquant)
- Priorité 2 : `bg-foreground/8` → `/10`, `border-foreground/5` → `/10` sur inputs, `text-[11px]` → `text-xs`
