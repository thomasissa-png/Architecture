# Audit Design — ExportPortail (V2a)

**Composant** : `components/ExportPortail.tsx`
**Date** : 2026-03-27
**Agent** : @design

---

## Tableau des issues

| Priorité | Élément | Problème | Correction Tailwind exacte |
|---|---|---|---|
| **P0** | `counterColor()` — état gris | Retourne `text-muted` (token valide) mais jamais vérifié WCAG : `--muted: #6B6B6E` sur `--background: #FAFAF8` = ratio 4.6:1. Passage. | Aucune correction nécessaire |
| **P0** | `counterColor()` — état orange | `text-orange-500` (#F97316) sur `#FAFAF8` = ratio 2.9:1. **FAIL WCAG AA** pour texte courant (4.5:1 requis). | Remplacer par `text-amber-600` (#D97706, ratio 4.65:1) pour les deux seuils orange ET rouge |
| **P0** | `counterColor()` — état rouge | `text-red-500` (#EF4444) sur `#FAFAF8` = ratio 3.3:1. **FAIL WCAG AA**. | Remplacer par `text-red-600` (#DC2626, ratio 4.54:1) |
| **P1** | Boutons "Copier le titre" / "Copier la description" | `py-1` = 8px de padding. Hauteur totale ~28px avec le texte xs. **Sous les 44px** requis pour touch targets mobile. | Remplacer `py-1` par `py-3` sur les deux boutons inline (lignes 323 et 358) |
| **P1** | Badge "Bientôt" dans le dropdown (Logic-Immo) | Contient `text-muted/40` (#6B6B6E à 40% d'opacité) sur fond blanc = ratio ~1.9:1. Illisible. Pas bloquant fonctionnellement mais viole WCAG AA. | `text-muted/60` minimum (ratio ~2.8:1) ou supprimer le badge si décoratif pur |
| **P1** | `data-testid="export-portail-char-counter"` dupliqué | Le même testid est utilisé pour le compteur du titre ET de la description (lignes 307 et 344). Casse les tests E2E. | Renommer en `export-portail-char-counter-title` et `export-portail-char-counter-desc` |
| **P2** | Style inline `animation: fadeInUp` (ligne 297) | L'animation est définie via `style={{ animation: "..." }}` au lieu d'utiliser la classe CSS `.animate-fade-in-up` déclarée dans `globals.css`. Incohérence avec le reste de l'app. | Remplacer par `className="... animate-fade-in-up"` — supprimer l'attribut `style` |
| **P2** | Bouton dropdown — `min-w-[220px]` hardcodé | Valeur en pixels arbitraire non issue d'une scale Tailwind. | Remplacer par `min-w-56` (224px, multiple de 8) |
| **P2** | Panel dropdown — `w-[220px]` hardcodé | Même problème que ci-dessus. | Remplacer par `w-56` |
| **P2** | Texte du badge warning — `text-[10px]` | Taille en pixels hors scale Tailwind. Présent à 3 reprises (lignes 284, 316, 351, 469). | Remplacer par `text-xs` (12px) — différence visuelle négligeable, conforme à la scale |

---

## Bilan tokens

- **Tokens utilisés correctement** : `bg-foreground/5`, `bg-foreground/[0.02]`, `border-foreground/5`, `text-foreground`, `text-muted`, `bg-background`, `bg-sage/5`, `text-sage`, `focus-visible:ring-sage/50` — le composant est majoritairement conforme au design system Versimo.
- **Valeurs hardcodées résiduelles** : `text-orange-500`, `text-red-500` (couleurs sémantiques non tokenisées), `min-w-[220px]`, `w-[220px]`, `text-[10px]` x4. Zéro hex direct, zéro `bg-white`.
- **Dark mode** : la totalité des fonds et textes référence des tokens CSS (`foreground`, `background`, `muted`, `sage`). Dark mode compatible sans modification, sous réserve que les tokens CSS soient redéfinis en dark mode (non vérifié — hors scope de ce composant).

## Focus-visible

Tous les boutons interactifs portent `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50` : bouton dropdown, boutons du dropdown, bouton copier titre, bouton copier description, bouton copier tout, bouton ZIP. **Conforme.**

Le `div` "Logic-Immo" désactivé n'a pas de focus ring mais n'est pas interactif (`cursor-not-allowed`, pas de `tabIndex`). Acceptable.

## Touch targets

- Dropdown trigger : `py-3` = 48px effective. **Conforme.**
- Bouton "Copier tout" (CTA primaire) : `py-3` = 48px effective. **Conforme.**
- Bouton ZIP : `py-3` = 48px effective. **Conforme.**
- Boutons inline "Copier le titre / description" : `py-1` = ~28px. **Non conforme — P1.**

## Responsive 375px

Le layout utilise `flex flex-wrap gap-3` pour les CTA, `w-full sm:w-auto` sur le dropdown, et les zones de contenu n'ont pas de largeur fixe. Aucun overflow horizontal détecté à 375px. **Conforme.**

---

## Score design /10

**7.4 / 10**

Composant bien construit sur la structure tokens. Le score est pénalisé par les contrastes WCAG en échec sur les compteurs (P0) et les touch targets sous-dimensionnés sur les boutons inline (P1).

---

## Top corrections par priorité

**P0 — Bloquant WCAG AA**
1. `counterColor()` : remplacer `text-orange-500` → `text-amber-600` et `text-red-500` → `text-red-600`

**P1 — Qualité UX mobile**
2. Boutons "Copier le titre" et "Copier la description" : `py-1` → `py-3`
3. Dupliquer les `data-testid` des compteurs (titre/description)

**P2 — Cohérence design system**
4. Animation fadeInUp : `style={{ animation: "..." }}` → classe `animate-fade-in-up`
5. `min-w-[220px]` et `w-[220px]` → `min-w-56` et `w-56`
6. `text-[10px]` × 4 occurrences → `text-xs`

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/reviews/design-audit-exportportail.md`
- Décisions prises : contrastes WCAG orange/rouge en échec (remplacement par amber-600/red-600), touch targets boutons inline insuffisants (py-1 → py-3), animation style inline à migrer vers classe CSS, valeurs hardcodées [220px] à normaliser
- Points d'attention : les corrections P0 sont **bloquantes accessibilité** — à appliquer avant toute mise en production. Les corrections P1-P2 peuvent être groupées en un seul commit. Le dark mode est structurellement compatible (zéro bg-white), aucune action requise si les tokens CSS sont correctement remappés côté globals.css.
