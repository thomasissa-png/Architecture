# Audit Design Frontend — Versimo
**Date :** 2026-03-25 | **Agent :** @design | **Scope :** 8 fichiers frontend

---

## Section 1 — Tableau de notation (10 critères /10)

| Critère | Note | Constat |
|---|---|---|
| **Tokens couleurs** | 7/10 | CSS vars correctement définies. Violations : `bg-white/40` (pricing section page.tsx L1400), `bg-[#f0ede8]` / `bg-[#f5f2ed]` (hero SVG containers), `border-foreground/12` (AuthModal — /12 n'est pas un multiple Tailwind standard). |
| **Tokens radius** | 6/10 | Mix `rounded-2xl`, `rounded-xl`, `rounded-3xl`, `rounded-full` sans règle claire par niveau de composant. Le save button de /compte utilise `rounded-xl` là où tous les CTA primaires utilisent `rounded-full`. Incohérence structurelle. |
| **Typo weights** | 8/10 | Hiérarchie `font-light / font-medium / font-bold` bien tenue. Anomalie : `hover:bg-foreground/75` sur le CTA submit AuthModal (L356) — l'opacité hover est 85 partout ailleurs, 75 ici. Minor mais détectable. |
| **Hiérarchie CTA** | 6/10 | 3 patterns concurrents pour les boutons secondaires : `border border-foreground/15`, `border border-foreground/10`, `bg-foreground/5`. Aucune règle décidée. Le CTA save du /compte (sage fill + `text-white`) introduit un 4e pattern hors-système. |
| **Espacement** | 7/10 | Section spacing cohérent (`py-16 sm:py-24`). Détail : le pricing inline (page.tsx) a `mb-14` sur le titre, le /pricing autonome aussi — OK. Mais la répétition du texte "Payez uniquement ce que vous utilisez" (L1411 ET L183 dans /pricing) trahit un copier-coller non rationalisé. |
| **Shadows/borders** | 5/10 | `shadow-2xl` sur la modale AuthModal, `shadow-lg` sur les dropdowns — non documentés en tokens. `border-foreground/5` (header), `border-foreground/10` (cards), `border-foreground/15` (boutons secondaires) : 3 niveaux de border opacity sans token nommé. |
| **Animations** | 8/10 | `fadeInUp 300ms cubic-bezier(0.16,1,0.3,1)` cohérent. `animate-pulse` sur avatar loading correct. `active:scale-[0.99]` sur CTA AuthModal bien — mais absent des CTA de page.tsx et pricing. Inconsistance micro-interaction. |
| **États interactifs** | 7/10 | `focus-visible:ring-2 focus-visible:ring-sage/50` globalement appliqué. Manque : les `<a>` du footer n'ont pas de focus ring. Les inputs du /compte utilisent `focus:ring-2` (sans `focus-visible`) — déclenche le ring au clic souris aussi. |
| **Responsive** | 8/10 | Mobile-first bien tenu, breakpoints `sm:` cohérents. Grille pricing 4 colonnes `lg:grid-cols-4` peut produire des cards trop étroites sur tablette (768-1024px). Header nav `hidden sm:inline` correct. |
| **Impression premium** | 7/10 | L'ensemble est propre. Deux ruptures : (1) le CTA "Enregistrer le profil" en `bg-[var(--sage)] text-white rounded-xl` dans /compte casse le langage visuel (sage n'est jamais utilisé comme fond de CTA primaire ailleurs — c'est toujours foreground). (2) Les labels de section `uppercase tracking-widest` du /compte (`SIRET`, `Identité visuelle`) sont en `text-[var(--muted)]` — l'uppercase sur du muted perd en lisibilité. |

**Moyenne : 6.9/10**

---

## Section 2 — Top 10 corrections (classes exactes)

**C1 — BLOQUANT : CTA primaire /compte hors-système**
```
// bg-[var(--sage)] text-white rounded-xl
→ bg-foreground text-background rounded-full
```
Le sage n'est jamais un fond de CTA primaire. Ce bouton doit respecter le pattern foreground/background de toutes les pages.

**C2 — BLOQUANT : `bg-white/40` pricing section (page.tsx L1400)**
```
// bg-white/40
→ bg-foreground/[0.02]
```
`bg-white` est un token hors-système. Remplacer par une opacity foreground pour garder la cohérence dark-mode ready.

**C3 — MAJEUR : Focus ring sur inputs /compte (`focus:ring` → `focus-visible:ring`)**
```
// focus:ring-2 focus:ring-[var(--sage)]/50
→ focus-visible:ring-2 focus-visible:ring-sage/50
```
S'applique à tous les `<input>` et `<select>` de /compte/page.tsx. Évite le ring au clic souris.

**C4 — MAJEUR : Hover opacity AuthModal CTA submit (85 partout, 75 ici)**
```
// hover:bg-foreground/75
→ hover:bg-foreground/85
```
Ligne 356 de AuthModal.tsx. Uniformise le feedback hover sur tous les CTA primaires.

**C5 — MAJEUR : `active:scale-[0.99]` manquant sur CTA page.tsx et pricing**
```
// bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-colors
→ bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 active:scale-[0.99] transition-all duration-200
```
Ajouter sur tous les boutons primaires de page.tsx et /pricing pour uniformiser la micro-interaction.

**C6 — MAJEUR : Border opacity non tokenisée — normaliser à 2 niveaux**
```
// border-foreground/5  (header séparateur)  → OK, garder
// border-foreground/10 (cards standard)     → OK, garder
// border-foreground/15 (boutons secondaires) → remplacer par border-foreground/10
// border-foreground/12 (AuthModal Google btn) → remplacer par border-foreground/10
```
Réduire à 2 niveaux : `/5` pour séparateurs, `/10` pour surfaces interactives.

**C7 — MAJEUR : Focus ring manquant sur liens footer**
```
// <a href="..." className="hover:text-foreground transition-colors py-2">
→ ajouter : focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded
```

**C8 — MOYEN : Labels uppercase /compte — passer en foreground/50**
```
// text-sm font-medium text-[var(--muted)] uppercase tracking-widest
→ text-xs font-medium text-foreground/40 uppercase tracking-widest
```
`text-[var(--muted)]` sur uppercase = ratio de contraste limite. `text-foreground/40` est plus lisible et reste dans la hiérarchie.

**C9 — MOYEN : Containers hero SVG — couleurs hardcodées → tokens**
```
// bg-[#f0ede8]  → bg-foreground/[0.05]
// bg-[#f5f2ed]  → bg-foreground/[0.03]
```
Les deux conteneurs `aspect-[4/3] rounded-2xl` du hero utilisent des hex hardcodés hors-système.

**C10 — MOYEN : Bouton secondaire /compte "Rechercher" — radius incohérent**
```
// rounded-xl (boutons lookup SIRET et search)
→ rounded-full
```
Tous les boutons d'action de la page principale et pricing sont `rounded-full`. Les boutons inline du /compte utilisent `rounded-xl` sans justification.

---

## Section 3 — Tokens hors-système détectés

| Fichier | Token hors-système | Ligne(s) | Remplacement |
|---|---|---|---|
| app/page.tsx | `bg-white/40` | L1400 | `bg-foreground/[0.02]` |
| app/page.tsx | `bg-[#f0ede8]`, `bg-[#f5f2ed]` | L701, L746 | `bg-foreground/[0.05]`, `bg-foreground/[0.03]` |
| app/page.tsx | `text-gray-400` (label AVANT) | L740 | `text-muted` |
| app/page.tsx | `bg-white/80` (badge AVANT) | L740 | `bg-background/80` |
| app/compte/page.tsx | `bg-[var(--background)]` | L281, L289, L302 | `bg-background` (syntaxe Tailwind directe) |
| app/compte/page.tsx | `text-[var(--foreground)]`, `text-[var(--muted)]` (inline) | Multiple | Utiliser `text-foreground`, `text-muted` directement |
| app/compte/page.tsx | `bg-[var(--sage)] text-white` | L686 | `bg-foreground text-background` |
| components/AuthModal.tsx | `border-foreground/12` | L262 | `border-foreground/10` |
| globals.css | `#e8e6e1`, `#d8d4cc`, `#c8c3ba`, `#eef2ec`, etc. | L81-L109 | Tokens CSS vars nommés ou classes Tailwind |

**Observation :** Le /compte utilise systématiquement `var(--token)` en inline Tailwind (`text-[var(--foreground)]`) au lieu de l'alias Tailwind direct (`text-foreground`). C'est verbeux et fragile — les deux sont équivalents si Tailwind est configuré avec les CSS vars.

---

## Section 4 — Score global

**6.9/10**

La base est solide : système de tokens CSS défini, typographie Inter cohérente, focus rings déployés, animations éprouvées. Les points de friction sont concentrés sur trois zones : (1) le CTA du /compte qui introduit un pattern sage-as-primary hors-système, (2) la prolifération des niveaux de border opacity non tokenisés, (3) les syntaxes `var(--token)` inline qui contournent les alias Tailwind. Aucun bloquant visuel majeur — l'impression générale reste premium — mais la dette s'accumule sur les pages secondaires.

**Priorité d'exécution :** C1 → C2 → C4 → C6 → C3.

---

**Handoff → @fullstack**
- Fichier produit : `/home/user/Architecture/docs/reviews/frontend-audit-design.md`
- Décisions prises : 10 corrections priorisées avec classes Tailwind exactes, 9 tokens hors-système identifiés
- Points d'attention : C1 (CTA /compte) est le seul bloquant visuel. C3 (focus-visible vs focus) est un point WCAG 2.2. La syntaxe `var(--token)` vs alias Tailwind direct affecte /compte/page.tsx sur ~15 occurrences — corriger en une passe.
