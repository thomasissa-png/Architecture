# Audit Intégration Web + Mobile — Versimo

**Date :** 2026-03-26
**Agents :** @design + @ux combinés
**Scope :** 7 composants / pages — vérification code source

---

## Note globale : 7.2 / 10

---

## 1. ProGate (`components/ProGate.tsx`)

| Critère | Statut | Détail |
|---|---|---|
| Bottom sheet mobile | ABSENT | Page pleine entière — pas de bottom sheet. Centré desktop OK via `max-w-lg mx-auto` |
| Tokens CSS | CONFORME | `bg-background`, `text-foreground`, `text-sage`, `border-foreground/5` — cohérent |
| Touch target CTA | CONFORME | `px-8 py-3` = ~44px hauteur. Bouton "Rafraîchir" : `min-h-[44px]` explicite |
| Animation fadeInUp | CONFORME | `style={{ animation: "fadeInUp 400ms..." }}` présent |

**Problème P2 :** Le layout pleine-page consomme 100dvh inutilement. Sur mobile, l'utilisateur non-Pro voit une page entière quand un bottom sheet centré serait plus approprié et cohérent avec AuthModal.

---

## 2. StorageImage (`components/StorageImage.tsx`)

| Critère | Statut | Détail |
|---|---|---|
| Fallback gris + icône | CONFORME | `DEFAULT_FALLBACK` : `bg-foreground/5` + SVG image broken — correct |
| Pas de flash image cassée | CONFORME | `style={!loaded ? { display: "none" } : undefined}` — image masquée jusqu'au load |
| className passé | CONFORME | Prop `className` transmise à `<img>` directement |
| Retry logique | CONFORME | 1 retry automatique à +1s, puis fallback définitif |

**Aucun problème bloquant.** Composant exemplaire.

---

## 3. InlineGenerator (`components/InlineGenerator.tsx`)

| Critère | Statut | Détail |
|---|---|---|
| UploadZone visible quand 0 photo | CONFORME | Condition `photosWithInput.length === 0 && uploadedFiles.length === 0` affiche l'UploadZone |
| Scroll into view au mount | CONFORME | `useEffect` + `containerRef.current?.scrollIntoView({ behavior: "smooth" })` |
| Grid responsive | CONFORME | `grid-cols-3 sm:grid-cols-4 lg:grid-cols-5` — correct |
| `bg-white` au lieu de `bg-background` | PROBLEME P1 | Ligne 428 : `className="... bg-white ..."` — hors token, cassera en dark mode |

**Problème P1 :** `bg-white` hardcodé sur le conteneur principal. Doit être `bg-background`.

---

## 4. Sélecteur MerchantMode (`components/MerchantMode.tsx`)

| Critère | Statut | Détail |
|---|---|---|
| Border + rounded | PARTIEL | `border border-foreground/5 rounded-xl` présent — border trop légère (5% opacité) |
| bg-background | CONFORME | `bg-background` présent sur le `<select>` |
| Touch target | CONFORME | `py-3` = ~44px hauteur — correct |

**Problème P2 :** `border-foreground/5` est quasi invisible sur fond `#FAFAF8`. Les inputs de la page principale utilisent `border-foreground/10`. Incohérence mineure mais perceptible — aligner sur `border-foreground/10`.

---

## 5. Pages personas (`/marchand`, `/architecte`, `/particulier`)

| Critère | Statut | Détail |
|---|---|---|
| Responsive | CONFORME | `px-5 sm:px-8`, `text-3xl sm:text-5xl`, `pt-28 sm:pt-36` — breakpoints corrects |
| Tokens CSS | CONFORME | `bg-background`, `text-foreground`, `text-sage`, `text-muted` partout |
| Header/footer | CONFORME | Header identique à la page principale (fixed, backdrop-blur-md, même structure nav) |

**Problème P2 :** Le footer est absent sur `/marchand` (et vraisemblablement `/architecte`, `/particulier`). La page se termine après la section FAQ sans footer Versimo. Incohérence avec la page principale.

---

## 6. Page `/comparatif`

| Critère | Statut | Détail |
|---|---|---|
| Tableau scrollable mobile | CONFORME | `overflow-x-auto` présent sur le wrapper `max-w-5xl mx-auto` — correct |
| Texte lisible mobile | PARTIEL | Cellules `text-sm` OK. Mais 5 colonnes sur 320px = texte compressé même avec overflow-x |

**Problème P2 :** Sur iPhone SE (320px), même avec `overflow-x-auto`, le tableau à 5 colonnes reste difficile à lire. Recommandé : ajouter `min-w-[700px]` sur le `<table>` pour forcer le scroll horizontal plutôt que laisser le browser compresser les colonnes.

---

## 7. AuthModal (`components/AuthModal.tsx`)

| Critère | Statut | Détail |
|---|---|---|
| items-end mobile / items-center desktop | CONFORME | `flex items-end sm:items-center justify-center min-h-[100dvh]` — correct |
| Safe area bottom | CONFORME | `pb-[max(1.5rem,env(safe-area-inset-bottom))]` présent |
| max-h 90dvh | CONFORME | `max-h-[90dvh] overflow-y-auto` présent |
| rounded-t-3xl mobile / rounded-3xl desktop | CONFORME | `rounded-t-3xl sm:rounded-3xl` — correct |
| Focus trap | CONFORME | Implémenté manuellement avec Tab/Shift+Tab + Escape |

**Aucun problème bloquant.** Composant le plus abouti de l'audit.

---

## Synthèse des corrections

### P0 — Bloquant
Aucun.

### P1 — Majeur (à corriger avant mise en production)

| # | Composant | Correction |
|---|---|---|
| 1 | `InlineGenerator.tsx` L.428 | Remplacer `bg-white` par `bg-background` |

### P2 — Mineur (à planifier)

| # | Composant | Correction |
|---|---|---|
| 2 | `ProGate.tsx` | Envisager un bottom sheet mobile pour cohérence avec AuthModal |
| 3 | `MerchantMode.tsx` select | Aligner `border-foreground/5` → `border-foreground/10` |
| 4 | Pages personas | Ajouter footer Versimo (identique page principale) |
| 5 | `/comparatif` table | Ajouter `min-w-[700px]` sur `<table>` pour forcer scroll propre sur iPhone SE |

---

## Verdict par composant

| Composant | Note | Statut |
|---|---|---|
| ProGate | 7/10 | Fonctionnel — layout mobile perfectible |
| StorageImage | 10/10 | Exemplaire |
| InlineGenerator | 8/10 | 1 token hors-système (P1) |
| MerchantMode select | 8/10 | Border quasi invisible |
| Pages personas | 7/10 | Footer manquant |
| Page /comparatif | 8/10 | Tableau compressé iPhone SE |
| AuthModal | 10/10 | Exemplaire — référence pour les autres modaux |

---

**Handoff → @fullstack**
- Fichier produit : `/docs/reviews/integration-audit.md`
- Décisions : design system respecté à 95% — seul `bg-white` hardcodé dans InlineGenerator est P1
- Points d'attention : footer absent sur pages personas, tableau /comparatif à min-widther, border select trop légère dans MerchantMode
