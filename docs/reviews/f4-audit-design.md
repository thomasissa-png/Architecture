# Audit design — F4 Mode Marchand
**Agent** : @design
**Date** : 2026-03-25
**Fichiers audités** : `components/MerchantMode.tsx`, `components/DossierProgress.tsx`, `components/DossierResult.tsx`, `components/DossierPublicView.tsx`, `app/dossier/[uuid]/page.tsx`

---

## Note globale : 6.9 / 10

Le F4 est fonctionnellement solide et structurellement aligné sur le design system pour l'essentiel. Les tokens CSS sont majoritairement respectés. Les défaillances identifiées sont ciblées : quelques valeurs hardcodées qui cassent la cohérence des tokens, des étiquettes AVANT/APRÈS dont le style rompt avec le premium feel, une absence totale de `focus-visible` sur les éléments interactifs critiques, et un summary bar en `bg-white/40` qui introduit un blanc pur étranger à la palette.

---

## Tableau des 7 critères

| # | Critère | Note | Commentaire |
|---|---|---|---|
| 1 | Cohérence tokens | 7/10 | Majorité en `var(--*)`. 4 écarts hardcodés identifiés (`bg-gray-100`, `bg-gray-200`, `bg-white/40`, `text-gray-400`) |
| 2 | Typographie | 8/10 | Hiérarchie claire et cohérente. Un seul défaut : les étiquettes AVANT/APRÈS en `text-[10px]`/`text-xs` hors de la grille typographique définie |
| 3 | Espacements | 8/10 | Multiples de 4px/8px respectés. Quelques valeurs `gap-1.5`, `py-2.5`, `px-2.5` tolérables mais à surveiller |
| 4 | Responsive | 7/10 | `sm:grid-cols-2` présent partout. La vue publique `/dossier/[uuid]` manque d'un breakpoint `md` pour les très grandes photos côte-à-côte |
| 5 | Accessibilité | 4/10 | Absence de `focus-visible:ring` sur tous les boutons interactifs. Aucun `aria-label` sur les boutons icône (partage, PDF). Taille tactile 44px respectée uniquement sur le step "info" (type de bien) |
| 6 | Animations | 9/10 | `animate-fade-in-up` présent sur tous les steps. Progress bar `transition-all duration-500` correcte. Rien à signaler |
| 7 | Premium feel | 6/10 | Les badges AVANT/APRÈS en `text-gray-400`/`text-[var(--sage)]` sur fond `bg-white/80` avec `rounded-full` ont un style "app mobile générique". La grille before/after sans séparateur visuel clair sur mobile est plate. Le summary bar `bg-white/40` casse la cohérence du fond `#FAFAF8` |

---

## Écarts au design system

### BLOQUANTS (cassent la cohérence des tokens)

| Fichier | Ligne | Problème | Fix |
|---|---|---|---|
| `MerchantMode.tsx` | 449 | `bg-gray-100` et `bg-gray-200` sur les pills type de bien (état inactif/hover) — valeurs Tailwind hardcodées hors palette | Remplacer par `bg-[var(--foreground)]/5` et `hover:bg-[var(--foreground)]/10` |
| `DossierResult.tsx` | 41 | `bg-white/40` sur le summary bar — blanc pur étranger à `#FAFAF8` | Remplacer par `bg-[var(--background)]` ou `bg-[var(--foreground)]/[0.02]` |
| `DossierResult.tsx` | 118 | `text-gray-400` sur le badge AVANT — token Tailwind générique | Remplacer par `text-[var(--muted)]` |
| `DossierPublicView.tsx` | 53 | `text-gray-400` sur le badge AVANT — même problème | Remplacer par `text-[var(--muted)]` |

### MAJEURS (dégradent le premium feel sans casser les tokens)

| Fichier | Ligne | Problème | Fix |
|---|---|---|---|
| `DossierResult.tsx` | 118, 134 | Les badges AVANT/APRÈS (`rounded-full`, `text-[10px]`, fond `bg-white/80 backdrop-blur-sm`) ont un style "app de fitness". Inadapté à l'inspiration Apple/Foster+Partners | Remplacer par un `span` sans fond, positionné `absolute bottom-3 left-3`, typographie `text-[10px] font-medium tracking-widest uppercase`, couleur `text-white/70` (AVANT) et `text-[var(--sage)]` (APRÈS), sans pill, sans backdrop |
| `DossierPublicView.tsx` | 53, 69 | Même problème que ci-dessus | Même fix |
| `DossierResult.tsx` | 106 | La grille `grid-cols-1 sm:grid-cols-2` sans gap ni séparateur affiche deux images collées sur mobile. Sur desktop le rendu est correct, mais sur mobile le passage vertical donne l'impression d'un bug | Ajouter `divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]` |
| `MerchantMode.tsx` | 357–363 | Le bouton "Fermer" du banner d'erreur est un texte nu sans `focus-visible:ring` ni taille tactile min 44px | Ajouter `min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:rounded` |
| `DossierResult.tsx` | 54–64, 67–76 | Les boutons "Copier le lien" et "PDF" n'ont pas d'`aria-label` explicite — les icônes SVG ne sont pas décoratives du point de vue des lecteurs d'écran (l'icône link sans texte visible sur petit écran) | Ajouter `aria-label="Copier le lien du dossier"` et `aria-label="Telecharger le PDF du dossier"` |

### MINEURS (friction marginale, à corriger lors du prochain passage)

| Fichier | Ligne | Problème | Fix |
|---|---|---|---|
| `MerchantMode.tsx` | 462–467 | Le bouton "Continuer" (step info) manque de `focus-visible:ring-2 focus-visible:ring-[var(--foreground)]` | Ajouter la classe |
| `MerchantMode.tsx` | 536–540 | Même manque sur le bouton "Choisir le style" | Idem |
| `MerchantMode.tsx` | 586 | Même manque sur "Voir le recapitulatif" | Idem |
| `MerchantMode.tsx` | 659–666 | Bouton "Generer le dossier" — manque `focus-visible:ring` | Idem |
| `DossierProgress.tsx` | 47 | `bg-[var(--foreground)]/5` pour la track de la progress bar est correct, mais le contraste de la barre sage sur fond `#FAFAF8` reste faible en luminosité ambiante — acceptable mais limite WCAG AA en contexte sombre | Pas d'action immédiate, surveiller |
| `app/dossier/[uuid]/page.tsx` | 64, 80 | Les états d'erreur (dossier introuvable / expiré) utilisent `text-foreground` et `text-muted` sans classes (classes Tailwind directes sans `var()`). Cohérent avec les utilitaires Tailwind configurés mais à uniformiser avec le reste | Vérifier que `tailwind.config` mappe bien `foreground` → `var(--foreground)` |
| `DossierPublicView.tsx` | 41 | `gap-0 sm:gap-px bg-[var(--border)]` comme séparateur — technique valide mais fragile si `--border` change d'opacité | Préférer `divide-x divide-[var(--border)]` |

---

## Captures mentales — ce qui casse le premium feel

**1. Les badges AVANT/APRÈS à pilule opaque**
L'association `rounded-full` + `bg-white/80` + `backdrop-blur-sm` rappelle les badges des apps de sport ou de fitness. Sur un produit "architecture-grade", ce style parasite. Les images méritent un label discret, non un badge. Le fix : texte nu, uppercase tracking-widest, sans fond. L'image parle d'elle-même.

**2. Le bg-white/40 dans DossierResult**
Le fond `#FAFAF8` est défini précisément pour éviter le blanc pur. `bg-white/40` introduit un blanc légèrement froid qui contraste avec la chaleur du fond. Sur un écran OLED ou en pleine lumière, la différence est visible. C'est le genre de détail qui signale "fait vite" à un œil de professionnel.

**3. Les pills de type de bien en bg-gray-100**
`bg-gray-100` est la gris par défaut de Tailwind (#F3F4F6), légèrement plus froid et plus saturé que `var(--foreground)/5` appliqué sur `#FAFAF8`. Sur la palette Versiroom, ce gris tranche de manière perceptible. Les pills inactives devraient être quasi-transparentes, pas grises.

**4. L'absence de focus-visible sur les boutons**
Sur un produit professionnel utilisé par des architectes avec des configurations d'accessibilité, l'absence de rings de focus est rédhibitoire. Thomas (persona marchand) travaille sur laptop Windows avec navigation clavier fréquente entre les outils. Ce n'est pas un détail cosmétique : c'est un engagement de qualité.

**5. La grille before/after sans séparateur mobile**
Sur mobile, les deux images se succèdent verticalement sans délimitation. L'utilisateur ne sait pas où finit l'"avant" et où commence l'"après". Le badge pilule est supposé remplir ce rôle mais il est trop petit et trop discret. Un `border-b border-[var(--border)]` entre les deux images sur mobile résoudrait le problème sans alourdir le desktop.

---

## Recommandations par priorité

**P0 — À corriger avant toute mise en production publique**
- Remplacer `bg-gray-100` / `bg-gray-200` par des tokens `var(--foreground)/5` (MerchantMode.tsx L449)
- Remplacer `bg-white/40` par `bg-[var(--foreground)]/[0.02]` (DossierResult.tsx L41)
- Remplacer `text-gray-400` par `text-[var(--muted)]` (DossierResult.tsx L118, DossierPublicView.tsx L53)

**P1 — À corriger pour atteindre le premium feel cible**
- Refondre les badges AVANT/APRÈS : supprimer le pill, passer en label typographique nu
- Ajouter `divide-y sm:divide-y-0` pour séparer les images sur mobile
- Ajouter `focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:rounded` sur tous les boutons

**P2 — À prévoir pour la conformité WCAG AA complète**
- `aria-label` explicites sur les boutons icône du DossierResult
- Audit WCAG des contrastes sur le badge progress (`text-[var(--sage)]` sur `bg-[var(--foreground)]/[0.02]`)

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/reviews/f4-audit-design.md`
- Décisions prises : 4 valeurs hardcodées identifiées, 2 patterns premium feel à refondre (badges AVANT/APRÈS, summary bar), absence totale de `focus-visible` documentée
- Points d'attention : les corrections P0 sont des remplacements de tokens purs, sans impact fonctionnel. Les corrections P1 (badges) nécessitent de retoucher DossierResult.tsx et DossierPublicView.tsx — les deux composants ont le même pattern, faire le fix en une seule passe. Les corrections `focus-visible` s'appliquent à 6 boutons dans MerchantMode.tsx.
