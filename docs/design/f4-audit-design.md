# Audit Visuel — Mode Marchand F4
**Agent** : @design
**Date** : 2026-03-25
**Fichiers audites** : MerchantMode.tsx, DossierProgress.tsx, DossierResult.tsx, DossierPublicView.tsx, app/dossier/[uuid]/page.tsx

---

## Note globale : 7.2 / 10

Le socle est sain — les tokens CSS sont majoritairement respectes, la hierarchie typographique existe, les composants sont structurellement coherents avec le design system. Les ecarts sont localises mais certains cassent directement le premium feel : valeurs hardcodees `bg-gray-100/200`, usage de `bg-white/40` au lieu du token background, labels AVANT/APRES non systemisés, absence de focus-visible sur plusieurs elements interactifs critiques. Rien de bloquant au sens fonctionnel, mais 4 ecarts sont qualifiés "majeurs" au regard du positionnement architecture-grade.

---

## Tableau des 7 criteres

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Coherence tokens | 7/10 | Tokens CSS majoritairement utilises. 3 ecarts hardcodes identifies : `bg-gray-100`, `bg-gray-200`, `bg-white/40` |
| 2 | Typographie | 8/10 | Hierarchie claire et coherente. Un ecart mineur : `text-muted` non prefixe `text-[var(--muted)]` dans page.tsx (Server Component) |
| 3 | Espacements | 8/10 | Systeme coherent base sur les multiples de 4px. Ecart mineur : `gap-px` dans DossierPublicView (1px = valeur hors-systeme) |
| 4 | Responsive | 8/10 | Mobile-first respecte, breakpoints `sm:` coherents. Manque : la grille photos step "review" n'a pas de breakpoint `lg:` pour les tres larges ecrans |
| 5 | Accessibilite | 5/10 | Absence de `focus-visible` sur les boutons de navigation entre etapes et sur le bouton "Generer". Absence `aria-label` sur les boutons icones. Taille tactile 44px non garantie sur "Retour" et "Regenerer" |
| 6 | Animations | 8/10 | `animate-fade-in-up` coherent avec le reste du site. `transition-all duration-500` sur la barre de progression est correct. Pas de flash identifie |
| 7 | Premium feel | 7/10 | Le flow multi-etapes est propre. Cassures : pills de type de bien en `bg-gray-100` (look app generique), labels AVANT/APRES en `text-gray-400` (hors systeme), separateur `gap-px bg-[var(--border)]` dans DossierPublicView est ingenieux mais le 1px peut disparaitre sur certains ecrans haute densite |

---

## Ecarts au design system

### Bloquants (0)

Aucun ecart bloquant — le composant est deployable.

---

### Majeurs

**MerchantMode.tsx — ligne 449**
```
bg-gray-100 text-[var(--muted)] hover:bg-gray-200
```
Pills de type de bien (etat inactif) : `bg-gray-100` et `hover:bg-gray-200` sont des valeurs hardcodees qui n'appartiennent pas au systeme de tokens. En dark mode, ces valeurs restent grises claires — le contraste devient insuffisant. Ces pills sont le premier point d'interaction visible du flow : leur look "app generique grise" trahit le positionnement architecture-grade.

Fix : remplacer par `bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.09]` — coherent avec la convention utilisee dans DossierResult ligne 56 (`bg-[var(--foreground)]/5`).

---

**DossierResult.tsx — ligne 41**
```
bg-white/40
```
Le summary bar utilise `bg-white/40` au lieu du token background. En dark mode, ce blanc semi-transparent devient visuellement aberrant. Le pattern correct du systeme est `bg-[var(--background)]/80` (utilise dans le header de page.tsx ligne 107).

Fix : remplacer `bg-white/40` par `bg-[var(--background)]/60` pour maintenir la transparence d'effet verre tout en restant dans les tokens.

---

**DossierResult.tsx — ligne 118 / DossierPublicView.tsx — ligne 53**
```
text-gray-400
```
Le label "AVANT" utilise `text-gray-400`, valeur hardcodee, pendant que "APRES" utilise `text-[var(--sage)]`. Cette incoherence interne casse la symetrie visuelle et sort du systeme. Le label "AVANT" devrait utiliser `text-[var(--muted)]` pour rester dans les tokens tout en maintenant la differentiation semantique avec "APRES".

Fix : remplacer `text-gray-400` par `text-[var(--muted)]` dans les deux composants.

---

**MerchantMode.tsx, DossierResult.tsx, DossierPublicView.tsx — boutons interactifs**

Absence de `focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-2` sur les elements interactifs suivants :
- Bouton "Continuer" (MerchantMode.tsx ligne 462)
- Bouton "Generer le dossier" (MerchantMode.tsx ligne 659)
- Bouton "Copier le lien" (DossierResult.tsx ligne 54)
- Bouton "PDF" (DossierResult.tsx ligne 67)
- Bouton "Regenerer" (DossierResult.tsx ligne 95)
- Lien "Telecharger le PDF" (page.tsx ligne 172)

Le CLAUDE.md mentionne explicitement "focus rings" comme regle de developpement. Ces elements sont des actions critiques du flow marchand — l'accessibilite clavier est une exigence, pas une option.

Fix : ajouter `focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-2 focus-visible:outline-none` a chaque element.

---

### Mineurs

**MerchantMode.tsx — ligne 446**
```
min-h-[44px]
```
La taille tactile 44px est presente sur les pills de type de bien, c'est bien. Elle est absente sur les boutons "Retour" (ligne 486, 604, 564) qui ont seulement `text-xs font-light`. Ces boutons texte ont une zone de clic probable de ~20px de hauteur. Sur mobile, le tap rate sera mauvais.

Fix : ajouter `min-h-[44px] inline-flex items-center` aux boutons "Retour".

---

**DossierPublicView.tsx — ligne 41**
```
gap-px bg-[var(--border)]
```
La technique du "separateur 1px" par `gap-px` sur fond border est ingenieuse mais fragile : sur les ecrans Retina et les navigateurs qui arrondissent les sub-pixels, ce 1px peut disparaitre ou doubler. Le token `--border` n'est pas concu pour etre un fond de grille.

Fix (optionnel) : utiliser une bordure interne plutot qu'un gap. `grid-cols-2 divide-x divide-[var(--border)]` — plus robuste cross-browser.

---

**DossierResult.tsx — ligne 152**
```
bg-red-50 border border-red-100
```
Les etats d'echec utilisent des valeurs hardcodees (`bg-red-50`, `border-red-100`, `text-red-600`, `text-red-400`, `text-red-500`). Ces valeurs n'ont pas de token correspondant dans le systeme. En dark mode, `bg-red-50` est visuellement agressive (fond tres pale sur fond sombre).

Fix : creer des tokens `--error-bg` et `--error-border` dans globals.css, ou utiliser `bg-red-500/[0.08] border-red-500/20 text-red-500` pour rester en relative opacity scalable.

---

**page.tsx (dossier) — ligne 64, 80**
```
bg-background text-foreground text-muted
```
La page publique utilise les noms de classes Tailwind generiques (`bg-background`, `text-foreground`, `text-muted`) au lieu de `bg-[var(--background)]`. Ces classes fonctionnent si elles sont definies dans tailwind.config, mais creent une inconsistance syntaxique avec le reste du codebase qui utilise systematiquement la notation `var()`.

Note : c'est un Server Component donc pas de "use client" — mais la convention doit etre uniforme.

---

**DossierProgress.tsx — absence d'aria-live**

La zone de statut de generation (liste des photos avec "En cours...", "Termine", "Echec") ne declare pas `aria-live="polite"`. Les lecteurs d'ecran ne notifieront pas les utilisateurs des changements de statut pendant la generation, qui peut durer 30-90 secondes.

Fix : ajouter `aria-live="polite" aria-atomic="false"` sur le `div.space-y-1.5` (ligne 62).

---

## Elements qui cassent le premium feel

**1. Pills de type de bien en gris generique**
Le step "Info" presente le bien en premier. Les pills `bg-gray-100` avec texte gris ressemblent a un formulaire admin generique, pas a un outil architecture-grade. Versiroom se positionne contre Gepetto et Renovate Club sur la qualite — ce premier point de contact doit incarner ce positionnement. La correction vers `bg-[var(--foreground)]/5` restaure la coherence visuelle avec le reste des composants.

**2. Label "AVANT" en gris terne vs "APRES" en sage**
La paire AVANT/APRES est le moment de verite du produit — c'est le before/after qui justifie l'abonnement et la confiance du marchand Thomas. Avoir "APRES" mis en valeur par le sage et "AVANT" dans un gris generique hardcode casse la symetrie intentionnelle de ce moment. Il faut une coherence visuelle : les deux doivent etre dans le systeme, avec la differentiation assurée par le token sage vs muted.

**3. Absence de feedback visuel sur la generation de dossier**
Le step "generating" affiche une liste de statuts mais sans animation de "pulse" sur les photos en attente. L'experience pendant 30-90 secondes de generation est statique. Comparativement, le flow individuel (page principale) a des previews flouees avec status par image — le mode marchand est en retrait visuel sur ce point specifique. Ce n'est pas un ecart de token, mais un ecart d'experience premium.

**4. Summary bar en blanc hardcode**
`bg-white/40` dans DossierResult sur la barre de synthese du dossier cree une rupture subtile en dark mode et ne fait pas partie du vocabulaire de transparence du systeme. Le header de la page publique utilise correctement `bg-background/80` — le meme pattern doit s'appliquer.

---

## Conformite WCAG 2.2 AA

### Mode clair

| Element | Couleur avant | Couleur fond | Ratio | Statut |
|---------|---------------|--------------|-------|--------|
| Texte body `text-[var(--muted)]` sur `#FAFAF8` | ~`#6B7280` | `#FAFAF8` | ~4.6:1 | Passe AA |
| Texte `text-[var(--foreground)]` sur `#FAFAF8` | `#1C1C1E` | `#FAFAF8` | ~16:1 | Passe AAA |
| Texte blanc sur `bg-[var(--sage)]` | `#FFFFFF` | `#7D9B76` | ~3.5:1 | Echoue AA (4.5:1 requis pour texte normal) |
| Label "AVANT" `text-gray-400` sur `bg-white/80` | `#9CA3AF` | `~#FFFFFF` | ~2.5:1 | Echoue AA |
| `text-[var(--muted)]/60` (60% opacity) | ~60% de muted | `#FAFAF8` | ~2.8:1 | Echoue AA |

**Attention critique** : Le texte blanc sur `bg-[var(--sage)]` (#7D9B76) atteint seulement ~3.5:1. Pour les boutons d'action principaux (CTA "Generer", "PDF"), ce ratio est insuffisant pour le texte normal (requis 4.5:1). Ce point existait deja dans le design system principal mais est amplifie dans le mode marchand ou ces boutons portent des informations critiques (credits, PDF).

Recommandation : assombrir le sage a #5E7A57 pour atteindre 4.7:1 sur blanc — a valider avec le brand platform.

### Dark mode

Non verifie faute de tokens dark mode documentes dans le codebase. Les valeurs hardcodees (`bg-gray-100`, `bg-white/40`, `bg-red-50`) sont les premiers candidats a l'echec en dark mode.

---

## Synthese des fixes par priorite

| Priorite | Fichier | Ligne | Probleme | Fix |
|----------|---------|-------|----------|-----|
| Majeur | MerchantMode.tsx | 449 | `bg-gray-100 hover:bg-gray-200` hors tokens | `bg-[var(--foreground)]/[0.05] hover:bg-[var(--foreground)]/[0.09]` |
| Majeur | DossierResult.tsx | 41 | `bg-white/40` hors tokens | `bg-[var(--background)]/60` |
| Majeur | DossierResult.tsx | 118 | `text-gray-400` label AVANT | `text-[var(--muted)]` |
| Majeur | DossierPublicView.tsx | 53 | `text-gray-400` label AVANT | `text-[var(--muted)]` |
| Majeur | Multiple | — | Absence `focus-visible` sur 6 elements interactifs | Ajouter `focus-visible:ring-2 focus-visible:ring-[var(--sage)] focus-visible:ring-offset-2 focus-visible:outline-none` |
| Mineur | MerchantMode.tsx | 486/564/604 | Boutons "Retour" sous 44px | `min-h-[44px] inline-flex items-center` |
| Mineur | DossierProgress.tsx | 62 | Absence `aria-live` sur liste statuts | `aria-live="polite" aria-atomic="false"` |
| Mineur | DossierResult.tsx | 152 | `bg-red-50 border-red-100` hardcodes | `bg-red-500/[0.08] border-red-500/20` |
| Mineur | page.tsx | 64/80 | Syntaxe `bg-background` vs `bg-[var(--background)]` | Harmoniser vers `bg-[var(--background)]` |
| Mineur | DossierPublicView.tsx | 41 | `gap-px` fragile cross-browser | `divide-x divide-[var(--border)]` |
| Systemique | Design tokens | — | Contraste sage/blanc ~3.5:1 insuffisant WCAG AA | Assombrir sage a #5E7A57 ou augmenter poids du texte a font-semibold |

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/design/f4-audit-design.md`
- Decisions prises : 4 ecarts majeurs identifies, 6 mineurs, 0 bloquant. Tous les fixes sont specs avec valeurs exactes.
- Points d'attention :
  - Le contraste sage/blanc est un probleme systemique qui touche l'ensemble du design system, pas seulement F4 — a arbitrer avant correction
  - Les fixes `focus-visible` sont applicables en batch sur tous les boutons identifies
  - `aria-live` sur DossierProgress est independant et peut etre traite immediatement
  - La correction `bg-white/40` → `bg-[var(--background)]/60` est la plus rapide et la plus visible
