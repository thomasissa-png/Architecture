# Re-audit technique frontend Versimo -- 2026-03-25

Audit precedent : 6.3/10 (2026-03-22). Cible : valider les 8 corrections annoncees.

## Tableau comparatif 10 criteres

| # | Critere | Avant | Apres | Delta | Constat |
|---|---------|-------|-------|-------|---------|
| 1 | Auth serveur (middleware) | 3 | 8 | +5 | middleware.ts JWT sur 4 routes protegees. **Reserve** : fallback `"dev-secret-change-me"` sans garde `NODE_ENV === "production"` (lib/auth.ts le fait, middleware non). |
| 2 | Gestion erreurs (catch) | 2 | 8 | +6 | Zero catch vide restant dans les .ts/.tsx. console.error partout. |
| 3 | Constantes centralisees | 4 | 9 | +5 | STYLE_LABELS/TYPE_LABELS dans lib/constants.ts, importe par ma-galerie et mes-biens/[id]. |
| 4 | Taille texte WCAG | 4 | 9 | +5 | Zero occurrence text-[10px] dans le code source. text-xs (12px) partout. |
| 5 | Clipboard API | 5 | 9 | +4 | AnnoncePublicView utilise navigator.clipboard.writeText. MerchantMode aussi. execCommand absent du code actif. |
| 6 | Focus traps modales | 3 | 8.5 | +5.5 | useEffect avec Tab trap, Escape, scroll lock, auto-focus sur les 2 modales (associer + dossier). role="dialog" + aria-modal + aria-label OK. |
| 7 | ARIA attributs | 5 | 8 | +3 | aria-expanded + aria-haspopup sur AuthButton. aria-label sur boutons Fermer. |
| 8 | prefers-reduced-motion | 0 | 9 | +9 | Media query dans globals.css couvre animations + transitions + delays. |
| 9 | Optimisation images (next/image) | 2 | 2 | 0 | Non corrige (prevu). Toutes les `<img>` restent natives. Impact LCP mesurable. |
| 10 | Secret management | 7 | 7 | 0 | middleware.ts L18 : `process.env.NEXTAUTH_SECRET \|\| "dev-secret-change-me"` sans condition NODE_ENV. Risque : en prod sans la variable, le secret hardcode est utilise. |

## Score global : 7.75 / 10 (+1.45)

## Vulnerabilites restantes

1. **HAUTE** : middleware.ts utilise un secret fallback sans garde production. Si `NEXTAUTH_SECRET` absent en prod, l'auth repose sur une valeur publique dans le code source. Fix : aligner sur lib/auth.ts (`production ? undefined : fallback`).
2. **MOYENNE** : Zero `next/image` -- pas de lazy loading optimise, pas de format WebP/AVIF automatique, pas de dimensionnement serveur. Impact CWV sur pages avec beaucoup de photos (mes-biens/[id], ma-galerie).
3. **BASSE** : Les liens de navigation dans mes-biens/[id] utilisent `<a href>` au lieu de `next/link` (full page reload au lieu de client navigation).

## Ce qui manque pour 9/10

| Action | Impact estime | Effort |
|--------|---------------|--------|
| Garde NODE_ENV sur le secret middleware | +0.5 | 1 ligne |
| Migration `<img>` vers `next/image` (pages cles) | +0.5 | 2-3h |
| Migration `<a href>` vers `next/link` | +0.15 | 30min |
| Ajout aria-live sur les toasts inline | +0.1 | 5min |

---
**Handoff -> @orchestrator**
- Fichier produit : docs/reviews/frontend-reaudit-technique.md
- Decision : GO avec reserves (secret middleware + next/image)
- Points d'attention : 1 vuln HAUTE (secret fallback middleware L18), next/image reste la dette technique principale
