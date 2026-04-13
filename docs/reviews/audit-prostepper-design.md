# Audit Design — ProStepper.tsx
**Date** : 2026-04-13 | **Agent** : @design | **Fichier cible** : `components/marchand/ProStepper.tsx`

---

## Scores /10

| Critère | Score | Diagnostic |
|---|---|---|
| Hiérarchie visuelle | 6.5/10 | Step active lisible, mais le contraste step active vs completed est faible (les deux sont des cercles pleins foncés) |
| Espacement | 6/10 | `gap-0` entre items desktop — les connecteurs "flottent" sans respiration latérale. Padding global absent |
| **Ancrage visuel** | **4/10** | **Cause principale du "flottant" : le `<nav>` est transparent, posé sur le fond parent sans délimitation propre** |
| Responsive | 7.5/10 | La bascule horizontal/vertical est bien pensée. Touch targets 44px OK. Sublabels masqués sur mobile = bonne décision |
| Premium feel | 5/10 | Dots w-10 h-10 corrects mais connecteur h-0.5 trop fin. Ring active à 10% d'opacité : imperceptible. Le composant est fonctionnel mais pas "architecture-grade" |

---

## Problèmes identifiés

### P0 — Ancrage visuel nul (cause racine du "flottant")

Le `<nav>` n'a aucun fond, border, ni padding. Posé sur n'importe quel fond de page, il n'a pas de masse propre. Un stepper de parcours pro doit se lire comme un élément UI discret mais ancré, pas comme du texte flottant.

**Diff desktop `<nav>` :**
```
Actuel  : className="w-full overflow-x-auto"
Proposé : className="w-full overflow-x-auto bg-[#FAFAF8] border border-[#E8E7E2] rounded-xl px-6 py-5 shadow-[0_1px_4px_0_rgba(28,28,30,0.06)]"
```

**Diff mobile `<ol>` :**
```
Actuel  : className="flex sm:hidden flex-col gap-1.5 px-1"
Proposé : className="flex sm:hidden flex-col gap-2 px-4 py-4"
```

---

### P0 — Ring active imperceptible

`ring-[#1C1C1E]/10` = opacité 10% sur fond clair ≈ invisible. La step active doit se distinguer nettement des completed.

**Diff `DOT_STYLES.active` :**
```
Actuel  : "bg-[#1C1C1E] text-white ring-4 ring-[#1C1C1E]/10"
Proposé : "bg-[#1C1C1E] text-white ring-4 ring-[#1C1C1E]/20 shadow-[0_0_0_4px_rgba(28,28,30,0.08)]"
```

Ou plus lisible encore : dissocier completed (sage) et active (foreground) via un outline externe.

**Variante plus différenciante pour active :**
```
Proposé : "bg-[#1C1C1E] text-white outline outline-2 outline-offset-2 outline-[#1C1C1E]"
```

---

### P1 — Connecteur trop fin et pas assez ancré

`h-0.5` (2px) sur fond blanc = quasi invisible. Standard Apple : 1px minimum mais avec couleur affirmée.

**Diff connecteur desktop :**
```
Actuel  : className="flex-1 h-0.5 mx-2 mt-5 self-start ..."
Proposé : className="flex-1 h-px mx-3 mt-[20px] self-start ..."
```
Note : `mt-[20px]` pour centrer précisément sur le dot w-10 (20px = moitié de 40px).

**Diff connecteur mobile :**
```
Actuel  : className="w-0.5 h-3 mt-0.5 ..."
Proposé : className="w-px h-4 mt-1 ..."
```

---

### P1 — Espacement desktop trop serré (`gap-0`)

Avec 7 steps et `flex justify-between gap-0`, les labels de 10-12 caractères risquent de se chevaucher sur tablette. Le `min-w-[60px]` sur le button est trop juste pour "Recommandations".

**Diff `<ol>` desktop :**
```
Actuel  : className="hidden sm:flex items-start justify-between gap-0"
Proposé : className="hidden sm:flex items-start justify-between gap-2"
```

Et élargir le min-width du button :
```
Actuel  : className="flex flex-col items-center min-w-[60px] ..."
Proposé : className="flex flex-col items-center min-w-[72px] ..."
```

---

### P1 — Sublabel toujours en `#9B9A94` quelle que soit l'étape

Le sublabel de l'étape active devrait être légèrement plus visible que celui des étapes locked. Actuellement identique visuellement.

**Diff sublabel :**
```
Actuel  : <span className="text-[11px] text-[#9B9A94] leading-[14px] text-center">
Proposé : <span className={`text-[11px] leading-[14px] text-center ${state === "active" ? "text-[#6B6A64]" : "text-[#9B9A94]"}`}>
```

---

## Récapitulatif des diffs par ordre de priorité

| # | Localisation | Classe actuelle (extrait) | Classe proposée |
|---|---|---|---|
| P0-A | `<nav>` | `w-full overflow-x-auto` | `+ bg-[#FAFAF8] border border-[#E8E7E2] rounded-xl px-6 py-5 shadow-[0_1px_4px_0_rgba(28,28,30,0.06)]` |
| P0-B | `DOT_STYLES.active` | `ring-4 ring-[#1C1C1E]/10` | `outline outline-2 outline-offset-2 outline-[#1C1C1E]` |
| P1-A | Connecteur desktop | `h-0.5 mx-2 mt-5` | `h-px mx-3 mt-[20px]` |
| P1-B | `<ol>` desktop | `gap-0` | `gap-2` |
| P1-C | Button desktop min-width | `min-w-[60px]` | `min-w-[72px]` |
| P1-D | `<ol>` mobile | `gap-1.5 px-1` | `gap-2 px-4 py-4` |
| P1-E | Sublabel | `text-[#9B9A94]` fixe | conditionnel `text-[#6B6A64]` sur active |

---

## Note globale avant/après estimation

| | Score |
|---|---|
| Avant | 5.8/10 |
| Après P0+P1 | 7.5/10 |

Le fond subtle + border + shadow légère (P0-A) apporte 80% du gain de poids visuel. Les autres diffs sont des raffinements.

---

**Handoff → @fullstack**
- Fichier concerné : `components/marchand/ProStepper.tsx`
- Diffs à appliquer dans l'ordre : P0-A (nav wrapper) → P0-B (ring active) → P1-A/B/C (connecteur + gap) → P1-D/E (mobile + sublabel)
- Aucun changement de logique ou de props — modifications purement Tailwind
- Vérifier visuellement sur fond `#FAFAF8` ET sur fond blanc pur après application (le shadow doit rester subtil)
