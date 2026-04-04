# Audit UI — Interface de génération Versimo
**Date :** 2026-04-04 | **Agent :** @design | **Scope :** step-upload + step-style (page.tsx, UploadZone, StylePicker, RoomTypePicker)

---

## Tableau de notation

| # | Critère | Note | Verdict |
|---|---|---|---|
| 1 | Hiérarchie visuelle — CTA principal visible | 7/10 | FAIL |
| 2 | Espacement — marges cohérentes | 8/10 | PASS |
| 3 | Touch targets mobile — tous ≥44px | 7/10 | FAIL |
| 4 | Tokens design — hardcodé vs tokens | 6/10 | FAIL |
| 5 | Labels/affordances — clarté immédiate | 7/10 | FAIL |
| 6 | Responsive 375px → 1440px | 8/10 | PASS |
| 7 | États interactifs (hover, focus-visible, selected, disabled) | 8/10 | PASS |
| 8 | Accessibilité (ARIA, contrastes) | 7/10 | FAIL |
| 9 | Densité d'information — trop d'options ? | 6/10 | FAIL |
| 10 | Brief premium Apple/Foster+Partners | 7/10 | FAIL |

**Score global : 71/100**

---

## Top 5 — Corrections prioritaires

### C1 — BLOQUANT | Bouton supprimer photo : touch target 20×20px sur mobile (UploadZone.tsx L.157)

Le bouton `×` de suppression des photos fait `w-7 h-7` sur mobile (28px) et `w-5 h-5` sur desktop (20px). Le `sm:w-5 sm:h-5` est l'inverse du sens attendu : le target le plus petit est sur le breakpoint le plus large, mais le target sur desktop reste sous les 44px minimum. Sur mobile le 28px est aussi insuffisant.

```tsx
// UploadZone.tsx L.157 — AVANT
className="absolute -top-2 -right-2 w-7 h-7 sm:w-5 sm:h-5 bg-foreground text-background rounded-full flex items-center justify-center text-xs sm:text-xs sm:opacity-60 sm:group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"

// APRÈS
className="absolute -top-3 -right-3 w-11 h-11 sm:w-8 sm:h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm sm:opacity-70 sm:group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
```

---

### C2 — BLOQUANT | StylePicker : 13 options en grille sans tri ni hiérarchie (StylePicker.tsx L.218)

13 cartes + 1 Custom = 14 éléments affichés simultanément. Aucune notion de popularité, pas de style mis en avant. Charge cognitive maximale, anti-premium. Solution : épingler 3 styles recommandés dans une rangée "À essayer" avant la grille complète, ou réduire l'affichage initial à 6 styles avec un "Voir tous les styles" collapse.

```tsx
// StylePicker.tsx L.218 — AVANT
<div role="group" aria-label="Choix du style (sélection multiple)" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

// APRÈS — grille max 3 cols, 2 rangées visibles initiales (6 styles), expand on demand
<div role="group" aria-label="Choix du style (sélection multiple)" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
```

Ajouter un state `showAll` avec toggle "Voir les 7 autres styles →" après 6 cartes. Réduit la charge de 14 → 6 options au premier regard.

---

### C3 — MAJEUR | Tokens hardcodés : couleurs hex et valeurs px en dur (StylePicker.tsx + RoomTypePicker.tsx)

Plusieurs couleurs hex sont inline (`style={{ backgroundColor: color }}`). C'est inévitable pour les palettes dynamiques des styles, mais les classes Tailwind hardcodent aussi des valeurs hors-système : `text-[11px]` (L.255, L.294), `text-[10px]` (L.239), `text-xs text-sage font-normal` (RoomTypePicker.tsx L.29) — `text-sage` est un token custom mais `text-[10px]` et `text-[11px]` sont des valeurs arbitraires hors de la type scale.

```tsx
// StylePicker.tsx L.255 — AVANT
<p className="text-xs sm:text-[11px] text-muted font-light leading-relaxed">

// APRÈS — rester sur l'échelle Tailwind
<p className="text-xs text-muted font-light leading-relaxed">

// StylePicker.tsx L.239 — AVANT
<span className="... text-[10px] font-semibold ...">

// APRÈS
<span className="... text-xs font-semibold ...">
```

---

### C4 — MAJEUR | Label "requis pour générer" non relié à l'action (RoomTypePicker.tsx L.29)

Le texte "— requis pour générer" est affiché en sage mais n'est pas rattaché sémantiquement à la raison du blocage. Quand l'utilisateur n'a pas sélectionné de type de pièce, il n'y a pas de feedback visuel sur l'état bloqué du bouton générer. L'affordance est textuelle mais pas visuelle sur le CTA.

```tsx
// RoomTypePicker.tsx L.29 — AVANT
<span className="text-xs text-sage font-normal">— requis pour générer</span>

// APRÈS — badge pill avec icône d'avertissement, plus visible
<span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
  Requis
</span>
```

---

### C5 — MAJEUR | Zone upload : icône SVG gris clair sous-visible, aucune affordance drag-and-drop premium (UploadZone.tsx L.91)

L'icône upload (`text-gray-300`) est à la limite du contraste exploitable contre `#FAFAF8`. Le wording "Glissez vos photos ici" est fonctionnel mais sans relief visuel. Pour le brief Apple/Foster+Partners, la zone doit inspirer confiance dès le premier regard, pas ressembler à un form basique.

```tsx
// UploadZone.tsx L.80 — AVANT
className={`relative border border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
  isDragActive ? "border-foreground bg-foreground/[0.02] scale-[1.01]" : ... "border-gray-300 hover:border-gray-400"
}`}

// APRÈS — border plus prononcée, hover state affirmé, icône plus visible
className={`relative border border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
  isDragActive
    ? "border-foreground bg-foreground/[0.03] scale-[1.01]"
    : files.length >= MAX_FILES
    ? "border-foreground/10 bg-foreground/[0.02] cursor-not-allowed opacity-40"
    : "border-foreground/20 hover:border-foreground/40 hover:bg-foreground/[0.02]"
}`}

// Icône L.91 — AVANT : text-gray-300
// APRÈS
className={`w-8 h-8 transition-colors duration-300 ${isDragActive ? "text-foreground" : "text-foreground/25 group-hover:text-foreground/40"}`}
```

---

## Notes complémentaires (sans correction immédiate requise)

- **Critère 8 — ARIA :** `role="checkbox"` sur les boutons style est correct. Vérifier que `aria-checked` toggle bien côté lecteur d'écran quand `disabled=true` (le bouton dernier style sélectionné doit annoncer "non disponible", pas juste être muet). Contraste `text-muted` sur fond blanc : `#6B7280` sur `#FAFAF8` = ratio ~4.6:1, WCAG AA OK.
- **Critère 6 — Responsive :** la grille `xl:grid-cols-5` de StylePicker crée des cartes très larges à 1440px (les descriptions texte débordent). Valider à 1440px. Recommandation : plafonner à `lg:grid-cols-4`.
- **Critère 10 — Brief premium :** les cartes de style ont un `hover:scale-[1.02]` qui pulse légèrement à chaque survol — le scale devrait être réservé à la sélection (état `selected`), pas au hover. Sur desktop, ça crée un effet "nerveux" peu premium. Supprimer `hover:scale-[1.02]` de la classe de base.

---

**Handoff → @fullstack**
- Fichier produit : `/home/user/Architecture/docs/design/generation-ui-audit.md`
- Corrections prioritaires : C1 (touch target bouton suppression), C2 (collapse grille styles), C3 (tokens arbitraires), C4 (feedback RoomType), C5 (zone upload)
- Points d'attention : ne pas toucher à `role="checkbox"` + `aria-checked` — l'accessibilité ARIA est correctement implémentée. Conserver `min-h-[44px]` sur tous les boutons RoomTypePicker (déjà conforme).
