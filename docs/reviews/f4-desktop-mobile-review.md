# Revue croisee PC + Mobile — F4 Mode Marchand — 2026-03-25

## Resume executif (non-technique)

Le parcours Mode Marchand est globalement solide sur PC et mobile. Les composants F4 principaux (MerchantMode, DossierResult, DossierProgress) utilisent correctement les CSS tokens et les breakpoints responsives. Cependant, **7 problemes mobiles** et **5 problemes de tokens/accents** empechent de confirmer un 9/10 en l'etat. Les corrections sont toutes mineures a moyennes (aucun blocage structurel) mais certaines touchent l'experience tactile directe de Thomas sur iPhone.

## Resume technique

- **PC : 8.5/10** — Solide, grilles responsives, hover states. Quelques incoh. de max-width entre pages et tokens non-standard.
- **Mobile : 7.5/10** — Plusieurs boutons sous 44px, textes a 9-10px, PhotoAssociator sans tokens CSS, accents manquants sur des textes utilisateur.
- **Recommandation : GO avec reserves** — Les 12 corrections listees sont necessaires avant de confirmer 9/10.

---

## Audit page par page

### Legende
- **OK** = conforme aux criteres
- **KO** = probleme detecte (detail dans colonne "Problemes")
- **--** = non applicable

| # | Page / Composant | PC | Mobile | Problemes detectes |
|---|---|---|---|---|
| 1 | `app/page.tsx` — Header + toggle Mode Marchand | OK | KO | **M-01** : liens "Mes biens", "Ma galerie", "Mes dossiers" masques en mobile (`hidden sm:inline`) — Thomas sur iPhone n'a AUCUNE navigation vers ses biens/dossiers depuis la page d'accueil sauf via le menu AuthButton (qui ne contient pas ces liens). **M-02** : hero SVG utilise `text-gray-400/50` et `bg-white/80` au lieu de tokens. |
| 2 | `components/MerchantMode.tsx` — Formulaire multi-etapes | OK | KO | **M-03** : bouton "Etape suivante" manque l'accent (`Etape` au lieu de `Etape` → en fait c'est un texte brut sans entite HTML, devrait etre `\u00C9tape`). **M-04** : texte `text-[10px]` pour les helpers (l.588, l.630) — limite lisibilite sur mobile. Le formulaire info utilise `sm:grid-cols-2` correctement. Boutons type de bien ont `min-h-[44px]` — OK. |
| 3 | `components/DossierResult.tsx` — Resultats | OK | KO | **M-05** : barre d'actions (WhatsApp + Partager + PDF) en `flex flex-wrap gap-2` — sur iPhone SE (375px), les 3 boutons s'empilent mais le bouton "Partager avec un acquereur" (long label) peut deborder. **M-06** : lien "Telecharger HD" n'a pas de `min-h-[44px]` — cible tactile trop petite. **M-07** : bouton "Regenerer" a `min-h-[44px]` — OK. |
| 4 | `components/DossierProgress.tsx` | OK | OK | Bien structure. Tokens CSS corrects partout. Textes xs minimum. |
| 5 | `app/mes-biens/page.tsx` — Liste des biens | OK | KO | **T-01** : utilise `text-foreground`, `bg-foreground`, `text-muted`, `bg-sage` directement (classes Tailwind) au lieu de `var(--foreground)`. Fonctionne car `tailwind.config` mappe les tokens, mais inconsistant avec les autres composants F4 qui utilisent `[var(--foreground)]`. **D-01** : aucun `data-testid` sur la page. **A-01** : texte "generez-en" sans accent (l.431). |
| 6 | `app/mes-biens/[id]/page.tsx` — Fiche bien | OK | KO | **M-08** : bouton "Retirer" photo — `sm:opacity-0 sm:group-hover:opacity-100` avec fallback `opacity-100` par defaut — OK mobile. **A-02** : "Generer pour ce bien" sans accent (l.422). **A-03** : "generez-en" sans accent (l.431). **D-02** : aucun `data-testid` sur les elements cles de la page. Modals association + dossier : fermeture avec `min-h-[44px]` sur bouton X — OK. |
| 7 | `app/ma-galerie/page.tsx` — Galerie photos | OK | KO | **M-09** : modal detail photo — grille `grid-cols-2` FIXE pour avant/apres, ne passe PAS en 1 colonne sur mobile. Sur iPhone SE, 2 images cote-a-cote dans un modal de 375px = images trop petites. **M-10** : bouton fermer modal a `min-h-[44px] min-w-[44px]` — OK. **D-03** : aucun `data-testid`. |
| 8 | `app/mes-dossiers/page.tsx` — Liste dossiers | OK | OK | Bien structure. Utilise les tokens `[var(--...)]` partout. Bouton "Copier le lien" petit mais `px-1.5 py-1` donne une cible suffisante. **D-04** : aucun `data-testid`. Header utilise `max-w-4xl` — inconsistant avec les autres pages (`max-w-6xl`). |
| 9 | `app/compte/page.tsx` — Profil marchand | OK | OK | Formulaire bien responsive (`sm:grid-cols-2`). Tous les inputs pleine largeur. Tokens `[var(--...)]` coherents. `data-testid` presents partout. Color picker petit (w-10 h-10) mais acceptable sur mobile. |
| 10 | `app/dossier/[uuid]/page.tsx` — Page partageable | OK | OK | SSR, bien responsive. `max-w-6xl`. Textes adequats. **A-04** : "Dossier partage" sans accent (l.127). Footer disclaimer OK. |
| 11 | `components/PhotoAssociator.tsx` | KO | KO | **T-02** : utilise des classes Tailwind DIRECTES (`bg-foreground/[0.03]`, `text-muted`, `text-sage`, etc.) au lieu de `[var(--foreground)]`. Inconsistant avec les composants F4 principaux. **A-05** : "Associer a un bien ?" sans accent (l.71). **M-11** : boutons a `text-[11px]` avec `py-1.5` — hauteur reelle ~28px, sous le seuil 44px tactile. Pas de `min-h-[44px]`. |
| 12 | `components/DossierPublicView.tsx` | OK | OK | Tokens corrects (`[var(--...)]`). Grille `sm:grid-cols-2` — passe en 1 col sur mobile. Images `object-cover` avec `aspect-[4/3]`. |

---

## Problemes detectes — Detail et resolution

### MOBILES (M-xx)

| ID | Criticite | Composant | Probleme | Resolution proposee | Agent |
|---|---|---|---|---|---|
| M-01 | **BLOQUANT** | `app/page.tsx` l.644-651 | Navigation "Mes biens / Ma galerie / Mes dossiers" masquee sur mobile (`hidden sm:inline`). Thomas sur iPhone ne peut pas naviguer vers ses biens/dossiers depuis la page d'accueil. | Ajouter ces liens dans le menu dropdown de AuthButton pour les utilisateurs connectes, OU creer un menu hamburger mobile. | @fullstack |
| M-05 | MAJEUR | `DossierResult.tsx` l.88 | 3 boutons d'action en ligne peuvent deborder sur iPhone SE (375px) quand les labels sont longs. | Passer les boutons en `flex flex-col sm:flex-row` ou reduire le label "Partager avec un acquereur" en "Partager" sur mobile. | @fullstack |
| M-06 | MAJEUR | `DossierResult.tsx` l.196-202 | Lien "Telecharger HD" sans taille tactile minimum. | Ajouter `min-h-[44px] inline-flex items-center` au lien. | @fullstack |
| M-09 | MAJEUR | `ma-galerie/page.tsx` l.316 | Modal detail : grille `grid-cols-2` fixe pour avant/apres. Images trop petites sur petit ecran. | Changer en `grid grid-cols-1 sm:grid-cols-2`. | @fullstack |
| M-11 | MAJEUR | `PhotoAssociator.tsx` l.74-91 | Boutons a ~28px de hauteur, sous le seuil tactile de 44px. | Ajouter `min-h-[44px]` a tous les boutons du composant. | @fullstack |
| M-03 | MINEUR | `MerchantMode.tsx` l.734 | "Etape suivante" — accent manquant dans le texte visible. | Corriger en `\u00C9tape suivante` ou entite HTML. | @fullstack |
| M-04 | MINEUR | `MerchantMode.tsx` l.588, 630 | Textes helpers a `text-[10px]` — lisibilite limite sur mobile. | Acceptable car textes secondaires, mais envisager `text-[11px]`. | -- |

### TOKENS CSS (T-xx)

| ID | Criticite | Composant | Probleme | Resolution proposee | Agent |
|---|---|---|---|---|---|
| T-01 | MINEUR | `mes-biens/page.tsx` | Utilise `text-foreground`, `bg-sage` directement via Tailwind au lieu de `[var(--foreground)]`. Fonctionnellement identique (config Tailwind mapee) mais inconsistant avec les autres pages F4. | Harmoniser vers la convention `[var(--...)]` OU accepter la convention Tailwind tant que le mapping est en place. Non bloquant. | @fullstack |
| T-02 | MINEUR | `PhotoAssociator.tsx` | Meme probleme que T-01. Classes Tailwind directes. | Harmoniser. | @fullstack |

Note : les composants hors F4 (ImageComparator, UploadZone, StepIndicator, RefineModal) utilisent egalement `bg-gray-*`, `text-gray-*`, `bg-white`, `border-gray-*`. Ce n'est pas un probleme F4 specifique — c'est une dette technique pre-existante sur les composants partages.

### ACCENTS FRANCAIS (A-xx)

| ID | Criticite | Composant | Texte incorrect | Correction |
|---|---|---|---|---|
| A-01 | MINEUR | `mes-biens/[id]/page.tsx` l.431 | "generez-en" | "g\u00e9n\u00e9rez-en" |
| A-02 | MINEUR | `mes-biens/[id]/page.tsx` l.422 | "Generer pour ce bien" | "G\u00e9n\u00e9rer pour ce bien" |
| A-03 | MINEUR | `MerchantMode.tsx` l.631 | "Generee automatiquement" | "G\u00e9n\u00e9r\u00e9e automatiquement" |
| A-04 | MINEUR | `dossier/[uuid]/page.tsx` l.127 | "Dossier partage" | "Dossier partag\u00e9" |
| A-05 | MINEUR | `PhotoAssociator.tsx` l.71 | "Associer a un bien ?" | "Associer \u00e0 un bien ?" |
| A-06 | MINEUR | `AuthButton.tsx` l.142 | "Acheter des credits" | "Acheter des cr\u00e9dits" |
| A-07 | MINEUR | `AuthButton.tsx` l.151 | "Se deconnecter" | "Se d\u00e9connecter" |

### DATA-TESTID (D-xx)

| ID | Criticite | Page | Resolution |
|---|---|---|---|
| D-01 | MINEUR | `mes-biens/page.tsx` | Ajouter `data-testid` sur : liste biens, bouton creer, formulaire creation. |
| D-02 | MINEUR | `mes-biens/[id]/page.tsx` | Ajouter `data-testid` sur : fiche bien, boutons action, modals. |
| D-03 | MINEUR | `ma-galerie/page.tsx` | Ajouter `data-testid` sur : grille photos, filtres, modal detail. |
| D-04 | MINEUR | `mes-dossiers/page.tsx` | Ajouter `data-testid` sur : liste dossiers, bouton copier. |

### PC (P-xx)

| ID | Criticite | Probleme | Resolution |
|---|---|---|---|
| P-01 | MINEUR | Max-width inconsistant : `mes-dossiers` utilise `max-w-4xl` tandis que les autres pages F4 utilisent `max-w-6xl`. | Harmoniser a `max-w-6xl` pour coherence visuelle. |

---

## Scores

### Score PC : 8.5 / 10

Points forts :
- Grilles 2+ colonnes sur toutes les pages (sm:grid-cols-2, lg:grid-cols-3)
- Hover states presents sur tous les elements interactifs
- Focus-visible:ring sur pratiquement tous les boutons et inputs
- Tokens CSS globalement coherents sur les composants F4 principaux

Points de deduction :
- -0.5 : tokens inconsistants entre pages (T-01, T-02)
- -0.5 : max-width inconsistant (P-01)
- -0.5 : accents francais manquants sur ~7 textes visibles

### Score Mobile : 7.5 / 10

Points forts :
- Formulaires en pleine largeur sur mobile partout
- Boutons principaux ont `min-h-[44px]`
- Grilles passent en 1 colonne sur mobile (sauf galerie modal)
- Upload zone et StylePicker bien adaptes

Points de deduction :
- -1.0 : M-01 BLOQUANT — navigation inaccessible sur mobile
- -0.5 : M-05, M-06 — debordement boutons et cible tactile insuffisante
- -0.5 : M-09 — modal galerie non responsive
- -0.5 : M-11 — PhotoAssociator sous seuil tactile

---

## Decisions a confirmer

1. **Navigation mobile** : faut-il un menu hamburger ou ajouter les liens dans le dropdown AuthButton ? Le hamburger est plus standard, mais le dropdown est plus rapide a implementer.
2. **Convention tokens** : accepter la coexistence `text-foreground` (Tailwind) et `text-[var(--foreground)]` (CSS direct), ou harmoniser vers l'une des deux conventions ?

---

## Verdict final

**CORRECTIONS REQUISES** — Le score mobile 7.5/10 est sous le seuil de 9/10 demande.

Les corrections necessaires pour atteindre 9/10 :
1. [BLOQUANT] Rendre la navigation accessible sur mobile (M-01)
2. [MAJEUR] 4 corrections de cibles tactiles et responsive (M-05, M-06, M-09, M-11)
3. [MINEUR] 7 accents francais a corriger (A-01 a A-07)
4. [MINEUR] 4 pages sans data-testid (D-01 a D-04)

Apres ces corrections, le score devrait passer a :
- **PC : 9.0-9.2 / 10**
- **Mobile : 9.0-9.2 / 10**

---

**Handoff → @orchestrator**
- Fichiers produits : `docs/reviews/f4-desktop-mobile-review.md`
- Decisions prises : GO avec reserves, 12 corrections identifiees avant confirmation 9/10
- Points d'attention : M-01 BLOQUANT (navigation mobile), 4 corrections majeures de responsive, 7 accents manquants. Agent a reinvoquer : @fullstack pour les 12 corrections.
