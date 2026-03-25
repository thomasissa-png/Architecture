# Audit Design — VisiRénov
> Agent @design — 2026-03-25
> Sources auditées : globals.css, page.tsx (hero + outil + pricing), layout.tsx, StylePicker.tsx, docs/strategy/creative-brief.md

---

## Grille d'audit — 10 critères

| # | Critère | Note /10 | Commentaire |
|---|---|---|---|
| 1 | Cohérence palette | 8/10 | Les 3 tokens (#FAFAF8, #1C1C1E, #7D9B76) sont appliqués de manière systématique via CSS custom properties. Sage utilisé avec retenue (pills, scrollbar, indicateurs). Point de vigilance : `text-muted` et `bg-gray-100/200` sont des classes Tailwind non définies comme tokens dans le design system — ils introduisent des gris parasites non contrôlés. La couleur `amber` du bloc warnings (amber-50, amber-200, amber-700) est la seule couleur hors-système justifiée fonctionnellement mais non documentée. |
| 2 | Typographie | 8/10 | Hiérarchie Inter bien construite : bold 700-800 pour les headings (tracking-tighter), light 300 pour les corps (font-light), medium 500 pour les labels UI. Incohérence mineure : le hero alterne `font-bold` et `font-light` dans le même H2 — intention stylistique correcte mais la classe `text-muted` du span n'est pas définie comme token. Tailles responsives bien gérées (text-3xl sm:text-5xl lg:text-7xl). |
| 3 | Espacement et rythme | 7/10 | Rythme vertical cohérent avec des blocs mb-16 entre les sections de l'outil. Padding horizontal unifié (px-5 sm:px-8). Problème identifié : les use-cases cards (section sous le hero) utilisent `pb-16` sans separator visuel clair entre hero et outil — la transition est abrupte. Le `max-w-24` du separator est anecdotique (6rem) et ne crée pas un vrai rythme de section. |
| 4 | Composants UI | 7/10 | Deux patterns de boutons coexistent : pill `rounded-full` (CTA principal, nav) et `rounded-full` sur les toggles de mode. Cohérence globalement bonne. Point faible : le bouton "Générer" est sticky avec `shadow-lg` — classe shadow non documentée dans le système, potentiellement incohérente avec la philosophie flat. Le toggle Intérieur/Extérieur (radiogroup) est bien exécuté avec states actif/inactif clairs. |
| 5 | Animations | 9/10 | Cubic-bezier (0.16, 1, 0.3, 1) cohérent dans les deux animations (fadeInUp 0.8s, reveal 0.7s) — ressort subtil typique Apple. Les delays (100ms-400ms) créent un échelonnement naturel. Les 3 dots de génération en bounce avec délais sont corrects. Seul défaut : `animate-bounce` natif Tailwind (courbe linéaire) sur les loading dots est moins raffiné que le cubic-bezier custom — légère rupture de qualité. |
| 6 | Responsive | 8/10 | Mobile-first correctement appliqué. Breakpoints sm: cohérents (text, padding, grid). Cibles tactiles ≥ 44px sur les boutons principaux (min-h-[44px] explicite sur le toggle indoor/outdoor). Point manquant : les cards de use-cases passent grid-cols-1 à sm:grid-cols-3 sans sm:grid-cols-2 intermédiaire — sur tablette (768px) les 3 cartes sont compressées. |
| 7 | Imagerie | 5/10 | Les visuels hero (avant/après) sont des SVG linéaires schématiques — intentionnellement épurés mais en dessous du positionnement "architecture-grade". Le brief est explicite : "jamais de stock photos" et "tout visuel doit être un résultat réel VisiRénov". Les SVG sont un placeholder acceptable en MVP mais créent une dissonance avec la promesse premium. Les emojis dans StylePicker (🪵, ◻️, ⚙️, 🎋…) introduisent un registre visuel grand-public contradictoire avec le positionnement sobre défini dans le brief (emojis interdits hors réseaux sociaux). |
| 8 | Contraste et accessibilité | 7/10 | Focus-visible:ring appliqué sur tous les CTA interactifs (sage/50 ring). ARIA roles présents sur le toggle radiogroup. Problème : `text-muted` et `text-muted/70` ne sont pas des tokens définis avec des valeurs hex vérifiables — impossible de valider le ratio WCAG AA (4.5:1) sans connaître la valeur réelle. Sur fond #FAFAF8, un gris à 60-70% d'opacité peut passer sous 4.5:1 sur les textes de corps. Les badges "AVANT/APRÈS" (text-[10px]) sont en dessous de 14px — les textes <14px réguliers nécessitent 7:1 (WCAG AAA) pour être accessibles. |
| 9 | Densité informationnelle | 8/10 | L'outil en 3 étapes est bien aéré. Le hero reste lisible sans surcharge. Les étapes (Upload > Type d'espace > Style > Options > Générer) sont correctement hiérarchisées. Point de vigilance : l'ajout de RoomTypePicker, OutdoorSubtypePicker, et du toggle Options crée 4-5 micro-décisions avant la génération — densité décisionnelle élevée pour Léa (particulière, attente de fluidité). |
| 10 | Impression premium | 7/10 | L'ensemble est propre et cohérent. Le backdrop-blur sur le header est un détail de qualité. Les rounded-2xl (16px) sur les cards et zones sont cohérents. Ce qui tire vers le bas : les SVG placeholder du hero, les emojis dans StylePicker, et l'absence de visuels réels VisiRénov. Le potentiel "architecture-grade" est présent dans la structure mais les assets visuels n'ont pas encore le niveau de la promesse. |

**Note globale : 7.4/10**

---

## Top 5 problèmes par sévérité

### P1 — BLOQUANT : Emojis dans StylePicker incompatibles avec le brief
Les 12 styles utilisent des emojis comme identifiants visuels (🪵, ◻️, ⚙️, 🎋, ✨, 🪑, 🌿, ☀️, 🛋️…). Le creative-brief interdit explicitement les emojis hors réseaux sociaux. Sur un produit positionné "architecture-grade / inspiration Foster+Partners", les emojis signalent un registre grand-public et brisent la cohérence du positionnement premium. Remplacer par des pastilles de couleur représentant la palette du style, ou des pictogrammes vectoriels en trait fin (stroke, 1px).

### P2 — MAJEUR : `text-muted` et gris Tailwind non tokenisés = WCAG non vérifiable
`text-muted`, `text-muted/70`, `bg-gray-100`, `bg-gray-200`, `border-gray-200/60` sont utilisés massivement mais ne sont pas définis comme tokens dans globals.css. Sans valeur hex connue, les contrastes WCAG AA (4.5:1 pour le texte normal) sont invérifiables. Sur fond #FAFAF8, un muted à ~50% de luminosité peut passer sous le seuil. Action : définir `--muted: #6B6B6E` (ou valeur équivalente) dans :root et tokeniser tous les gris.

### P3 — MAJEUR : Visuels hero en SVG schématique sous-dimensionnés pour le positionnement
Les SVG avant/après du hero communiquent "prototype" plutôt que "qualité architecturale". Le brief est formel : tout visuel de démonstration doit être un résultat réel VisiRénov. Ces SVG sont acceptables en alpha mais doivent être remplacés par de vraies captures du pipeline dès qu'une génération de qualité est disponible. En attendant, un texte descriptif fort est plus honnête qu'un placeholder schématique.

### P4 — MOYEN : `shadow-lg` sur le bouton sticky non aligné avec la philosophie flat
Le bouton "Générer la visualisation" utilise `shadow-lg` (Tailwind default ~0 20px 25px rgba(0,0,0,0.1)) qui n'est pas dans le design system. L'inspiration Apple/Foster+Partners évite les ombres portées expressives. Remplacer par `shadow-sm` ou une bordure fine (`ring-1 ring-foreground/10`) cohérente avec le style des cards.

### P5 — MINEUR : Badges AVANT/APRÈS en text-[10px] sous le seuil d'accessibilité
Les labels "AVANT" et "APRÈS" sur le hero utilisent `text-[10px]` (10px). En dessous de 14px en taille normale, WCAG exige un ratio 7:1 (AAA) pour être accessible. Ces labels sont décoratifs mais leur lisibilité sur mobile est compromise. Passer à `text-xs` (12px) minimum ou les rendre purement décoratifs avec aria-hidden.

---

## Recommandations actionnables

| Action | Priorité | Composant | Effort |
|---|---|---|---|
| Remplacer emojis StylePicker par pastilles couleur ou pictogrammes vectoriels | P1 | StylePicker.tsx | Moyen |
| Ajouter `--muted: #6B6B6E` dans :root + remplacer text-muted par var(--muted) | P2 | globals.css | Faible |
| Tokeniser `--border: rgba(28,28,30,0.08)` et remplacer les border-gray-200 | P2 | globals.css | Faible |
| Remplacer shadow-lg bouton sticky par shadow-sm ou ring-1 | P4 | page.tsx | Faible |
| Passer badges AVANT/APRÈS à text-xs minimum | P5 | page.tsx | Faible |
| Définir un breakpoint intermédiaire sm:grid-cols-2 pour les use-case cards | 6 | page.tsx | Faible |
| Prévoir le remplacement des SVG hero par captures réelles dès sprint suivant | P3 | page.tsx | Élevé (dépend IA) |

---

**Handoff → @fullstack**

- Fichier produit : `/home/user/Architecture/docs/design/design-audit.md`
- Décisions prises : audit complet 10 critères, note globale 7.4/10, 5 problèmes priorisés
- Actions immédiates sans dépendance externe (effort faible) :
  - Tokeniser `--muted` et `--border` dans globals.css (P2 — WCAG compliance)
  - Remplacer `shadow-lg` par `shadow-sm` sur le bouton sticky (P4)
  - Passer badges AVANT/APRÈS à `text-xs` (P5)
  - Ajouter `sm:grid-cols-2` sur les use-case cards (critère 6)
- Action prioritaire nécessitant une décision design :
  - Emojis StylePicker : choisir entre pastilles couleur ou pictogrammes vectoriels avant implémentation (P1)
- Point d'attention WCAG : valider que `--muted` tokenisé à #6B6B6E donne bien 4.5:1 sur fond #FAFAF8 (ratio réel : ~4.6:1 — juste au-dessus du seuil AA, à vérifier en dark mode si applicable)
