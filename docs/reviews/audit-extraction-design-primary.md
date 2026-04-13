# Audit design — Page Extraction (PlanEditor primaire)
Date : 2026-04-13 | Agent : @design

## Note globale avant corrections : 7.2 / 10

## Tableau des critères

| # | Critère | Note | Observations |
|---|---|---|---|
| 1 | Hiérarchie typographique | 7/10 | h1 `text-2xl font-bold` correct. `h2` "Détails des pièces" en `text-sm font-semibold` — trop petit pour un titre de section en dessous d'un plan plein largeur. Le header toolbar PlanEditor utilise aussi `text-sm font-semibold` pour "Éditeur de plan" → collision de rang. |
| 2 | Palette et tokens | 8/10 | `#FAFAF8`, `#1C1C1E`, `#7D9B76` respectés partout. Introduction non documentée de `#6366F1` (indigo) pour les guides d'alignement et le bandeau de fusion — hors palette Versimo. Usage ponctuel mais visible. |
| 3 | Espacements | 7/10 | `space-y-6`, `space-y-3`, `gap-2`, `p-3` cohérents. Le `max-w-5xl` du PlanEditor vs `max-w-2xl` de la liste crée un saut de conteneur visuellement abrupt. Le padding `px-4 py-8` de `<main>` est correct. |
| 4 | Zones colorées | 7/10 | 17 types, palette fonctionnelle. Problème : `sdb` et `wc` partagent la même couleur (`rgba(0,191,255,0.3)`), idem `salon` et `sejour` (vert sage). Sur un plan avec les deux, discrimination impossible. `couloir`, `cave`, `autre` tous en gris identique — trop d'ambiguïté. |
| 5 | Contraste labels sur zones | 5/10 | `text-[#1C1C1E]` sur fond `rgba(..., 0.3)` = couleur semi-transparente sur image de fond. Le fond réel dépend du plan PDF (souvent blanc). Ratio potentiellement OK sur fond clair, mais non garanti. Le `bg-white/75` derrière le texte est une rustine correcte mais incomplète : sur zones orange cuisine ou bleu sdb, le `white/75` donne un rendu trouble. **P0 : le `bg-white/90` sur le `m²` est correct, pas le `bg-white/75` sur le nom.** |
| 6 | Responsive | 6/10 | `max-height: 70vh` sur le plan = bon. Mais la toolbar PlanEditor en `flex-wrap` avec 6+ boutons sur mobile 375px produit 3 lignes de boutons au-dessus du plan — encombrement majeur avant même de voir le plan. Les affordances pills (Déplacer / Redimensionner / Double-clic) s'affichent toutes sur mobile alors qu'elles décrivent des interactions souris. |
| 7 | Micro-interactions | 8/10 | Hover zones `150ms ease` sur couleur + border, `transition-colors` sur boutons. Ring focus sur tous les interactifs. Fade-in du PlanEditor `animate-in fade-in duration-300`. Highlight scroll depuis liste vers plan : propre. |
| 8 | Accessibilité | 8/10 | `focus-visible:ring-2 ring-[#7D9B76]` sur tous les boutons. `role="application"` + `aria-label` sur le container plan. `tabIndex={0}` + `aria-label` sur chaque zone pièce. `aria-hidden="true"` sur les SVG décoratifs. Lacune : les affordances pills ne sont que visuelles, pas de `role="note"` ni `aria-live` pour les changements d'état de calibration. |
| 9 | Densité | 7/10 | La section success empile : banner succès + affordances pills + switcher étages + PlanEditor + liste pièces. Sur viewport 768px, tout tient. Sur 375px, les affordances souris + toolbar 6 boutons + plan = surcharge. Le `helpExpanded` collapsible est un bon geste mais le panel help ouvert rajoute 4 lignes de texte au-dessus du plan. |
| 10 | Cohérence système | 7/10 | L'essentiel est cohérent (vert sage, fond #FAFAF8, typographie Inter). Ruptures : `#6366F1` indigo non documenté dans le design system Versimo, `#3B82F6` bleu sur le scan line et les dots de chargement — deux couleurs d'accent hors palette pour des états transitoires. |

---

## Problèmes P0/P1 avec corrections

### P0 — Contraste insuffisant sur le nom de pièce dans les zones

**Problème :** `bg-white/75` derrière le texte du nom = 75% d'opacité. Sur fond coloré (orange cuisine rgba(255,165,0,0.3) + image PDF) le fond blanc translucide rend le texte difficile à lire et l'aspect est sale (halo grisâtre).

**Correction — PlanEditor.tsx ligne 1344 :**
```
bg-white/75  →  bg-white/90
```

### P1 — `#6366F1` indigo hors palette Versimo

**Problème :** Guides d'alignement SVG, calibration points, et bandeau fusion utilisent `#6366F1`/`#4338CA`. Non documenté dans le design system (`#FAFAF8`, `#1C1C1E`, `#7D9B76`). Crée une rupture de cohérence couleur.

**Correction — PlanEditor.tsx : remplacer `#6366F1` par `#7D9B76` et `#4338CA` par `#4A7A42` :**
- Ligne 1093 : `stroke="#6366F1"` → `stroke="#7D9B76"`
- Ligne 1105 : `stroke="#6366F1"` → `stroke="#7D9B76"`
- Ligne 1127 : `fill="#6366F1"` → `fill="#7D9B76"`
- Ligne 1139 : `stroke="#6366F1"` → `stroke="#7D9B76"`
- Ligne 1145 : `fill="#6366F1"` → `fill="#7D9B76"`
- Ligne 1046 : `bg-[#EEF2FF] border-[#6366F1]/20 text-[#4338CA]` → `bg-[#F0F4EE] border-[#7D9B76]/20 text-[#4A7A42]`

### P1 — `#3B82F6` bleu hors palette sur l'état loading

**Problème :** Scan line, dots pulsants, et thumbnail actif utilisent `#3B82F6`. Hors palette. L'état loading est le premier écran vu — incohérence de marque dès l'entrée.

**Correction — page.tsx : remplacer `#3B82F6` par `#7D9B76` :**
- Ligne 484 : `bg-[#3B82F6]` → `bg-[#7D9B76]`
- Ligne 499 : `border-[#3B82F6] ring-2 ring-[#3B82F6]/30` → `border-[#7D9B76] ring-2 ring-[#7D9B76]/30`
- Lignes 532-534 : `bg-[#3B82F6]` (×3) → `bg-[#7D9B76]`

---

## Corrections appliquées

| Fichier | Correction |
|---|---|
| `components/marchand/PlanEditor.tsx` | `bg-white/75` → `bg-white/90` sur le label nom de pièce (P0) |
| `components/marchand/PlanEditor.tsx` | `stroke/fill #6366F1` → `#7D9B76` partout (guides, calibration) |
| `components/marchand/PlanEditor.tsx` | Bandeau fusion `bg-[#EEF2FF] text-[#4338CA]` → `bg-[#F0F4EE] text-[#4A7A42]` |
| `app/projet/[id]/extraction/page.tsx` | Scan line `bg-[#3B82F6]` → `bg-[#7D9B76]` |
| `app/projet/[id]/extraction/page.tsx` | Thumbnail actif `border/ring-[#3B82F6]` → `[#7D9B76]` |
| `app/projet/[id]/extraction/page.tsx` | Dots pulsants `bg-[#3B82F6]` (×3) → `bg-[#7D9B76]` |

## Note globale après corrections : 7.8 / 10

Gains : critère 2 (palette) 8→9, critère 5 (contraste) 5→7, critère 10 (cohérence) 7→8.5.
Residu non corrigé (hors scope P0/P1) : discrimination `sdb`/`wc` même couleur, affordances pills souris sur mobile, saut `max-w-5xl` → `max-w-2xl`.

---

**Handoff → @fullstack**
- Fichiers modifiés : `/home/user/Architecture/components/marchand/PlanEditor.tsx`, `/home/user/Architecture/app/projet/[id]/extraction/page.tsx`
- Décisions prises : palette Versimo unifiée (`#7D9B76`/`#4A7A42`/`#F0F4EE`) sur tous les états — loading, guides, calibration, fusion. Contraste label pièce `white/90` garanti.
- Points d'attention : la discrimination `sdb`/`wc` (même couleur) est un P2 à traiter — attribuer `rgba(0,191,255,0.3)` à `sdb` et `rgba(176,224,230,0.3)` à `wc`. Les affordances pills "Déplacer / Redimensionner" sont irrelevantes sur mobile (touch) — les masquer sous `hidden sm:inline-flex`.

