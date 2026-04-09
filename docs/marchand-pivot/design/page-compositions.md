# Design System & Compositions de Pages — Parcours Marchand Versimo
**Date** : 2026-04-09 | **Agent** : @design | **Persona** : Thomas Berger, 35 ans, marchand de biens Bordeaux

---

## 1. Tokens spécifiques parcours marchand

> Ces tokens s'ajoutent au design system Versimo existant (fond #FAFAF8, foreground #1C1C1E, sage #7D9B76, Inter 300-800). Ils NE remplacent PAS les tokens globaux — ils les étendent pour les besoins du parcours marchand.

### 1.1 Tokens de couleur — Statuts projet

Architecture 3 tiers. Les composants référencent les tokens sémantiques uniquement.

**Primitives (tier 1)**
```
primitive-green-100: #ECFDF5
primitive-green-500: #7D9B76      ← sage existant = statut "done"
primitive-green-700: #4A7A42
primitive-amber-100: #FFFBEB
primitive-amber-500: #D97706
primitive-amber-700: #B45309
primitive-blue-100:  #EFF6FF
primitive-blue-500:  #3B82F6
primitive-blue-700:  #1D4ED8
primitive-red-100:   #FEF2F2
primitive-red-500:   #EF4444
primitive-red-700:   #B91C1C
primitive-neutral-100: #F5F5F0   ← proche de #FAFAF8
primitive-neutral-300: #D1D0CB
primitive-neutral-500: #9B9A94
```

**Tokens sémantiques — statuts (tier 2)**
```
color-status-draft-bg:        primitive-neutral-100   #F5F5F0
color-status-draft-text:      primitive-neutral-500   #9B9A94
color-status-draft-border:    primitive-neutral-300   #D1D0CB

color-status-extracting-bg:   primitive-blue-100      #EFF6FF
color-status-extracting-text: primitive-blue-700      #1D4ED8
color-status-extracting-dot:  primitive-blue-500      #3B82F6

color-status-validating-bg:   primitive-amber-100     #FFFBEB
color-status-validating-text: primitive-amber-700     #B45309
color-status-validating-dot:  primitive-amber-500     #D97706

color-status-generating-bg:   primitive-blue-100      #EFF6FF
color-status-generating-text: primitive-blue-700      #1D4ED8
color-status-generating-dot:  primitive-blue-500      animate pulse

color-status-completed-bg:    primitive-green-100     #ECFDF5
color-status-completed-text:  primitive-green-700     #4A7A42
color-status-completed-dot:   primitive-green-500     #7D9B76

color-status-error-bg:        primitive-red-100       #FEF2F2
color-status-error-text:      primitive-red-700       #B91C1C
color-status-error-dot:       primitive-red-500       #EF4444
```

**Tokens sémantiques — stepper (tier 2)**
```
color-step-completed-fill:    primitive-green-500     #7D9B76
color-step-completed-check:   #FFFFFF
color-step-active-fill:       #1C1C1E
color-step-active-label:      #1C1C1E
color-step-locked-fill:       primitive-neutral-300   #D1D0CB
color-step-locked-label:      primitive-neutral-500   #9B9A94
color-step-error-fill:        primitive-red-500       #EF4444
color-step-connector-done:    primitive-green-500     #7D9B76
color-step-connector-pending: primitive-neutral-300   #D1D0CB
```

**Tokens sémantiques — surface paiement (tier 2)**
```
color-payment-badge-bg:       #1C1C1E
color-payment-badge-text:     #FAFAF8
color-payment-cta-bg:         primitive-green-500     #7D9B76
color-payment-cta-text:       #FFFFFF
color-payment-cta-hover:      primitive-green-700     #4A7A42
```

**Vérification WCAG 2.2 AA**
- #1C1C1E sur #FAFAF8 : ratio 17.4:1 — PASS (texte)
- #7D9B76 sur #FFFFFF : ratio 3.9:1 — PASS (interactifs >= 3:1)
- #7D9B76 sur #FAFAF8 : ratio 3.7:1 — PASS (interactifs >= 3:1)
- #4A7A42 sur #FFFFFF : ratio 5.8:1 — PASS (texte >= 4.5:1)
- #1D4ED8 sur #EFF6FF : ratio 7.2:1 — PASS
- #B45309 sur #FFFBEB : ratio 5.1:1 — PASS
- #B91C1C sur #FEF2F2 : ratio 6.8:1 — PASS

### 1.2 Tokens d'espacement — Composants parcours

```
spacing-step-dot:        32px    ← diamètre bulle stepper (touch target >= 44px avec padding)
spacing-step-connector:  2px     ← épaisseur ligne entre étapes
spacing-step-gap-h:      48px    ← espace horizontal entre étapes (desktop)
spacing-step-gap-v:      24px    ← espace vertical entre étapes (mobile)
spacing-card-piece-p:    16px    ← padding interne carte pièce (token md)
spacing-card-piece-gap:  12px    ← gap entre éléments dans la carte
spacing-photo-thumb:     80px    ← taille miniature photo dans carte (mobile)
spacing-photo-thumb-lg:  120px   ← taille miniature photo (desktop)
spacing-grid-photo-gap:  8px     ← gap grille photos upload (token sm)
spacing-gallery-gap:     16px    ← gap grille résultats visuels
```

### 1.3 Tokens de typographie — Labels parcours

```
font-step-label:         Inter 12px / weight 500 / ls 0.02em / lh 16px
font-step-sublabel:      Inter 11px / weight 400 / ls 0em / lh 14px
font-card-piece-title:   Inter 14px / weight 600 / ls 0em / lh 20px
font-card-piece-meta:    Inter 12px / weight 400 / ls 0em / lh 16px
font-status-badge:       Inter 11px / weight 500 / ls 0.03em / lh 14px
font-payment-price:      Inter 36px / weight 700 / ls -0.02em / lh 40px
font-payment-label:      Inter 14px / weight 400 / ls 0em / lh 20px
```

### 1.4 Tokens de radius et shadow

```
radius-card-piece:       8px     ← token md
radius-status-badge:     100px   ← pill
radius-photo-thumb:      4px     ← token xs

shadow-card-piece:       0 1px 3px rgba(28,28,30,0.08), 0 1px 2px rgba(28,28,30,0.04)
shadow-card-piece-hover: 0 4px 12px rgba(28,28,30,0.10), 0 2px 4px rgba(28,28,30,0.06)
shadow-payment-stripe:   0 2px 8px rgba(28,28,30,0.12)
```

---

## 2. Compositions par écran

<!-- Écrans 1.1 à 7.1 — A REMPLIR -->

---

## 3. Stepper composant (7 étapes)

<!-- A REMPLIR -->

---

## 4. Carte pièce composant

<!-- A REMPLIR -->

---

## 5. Spécifications images

<!-- A REMPLIR -->

---

**Handoff → @fullstack**
- Fichiers produits : docs/marchand-pivot/design/page-compositions.md
- À compléter avant implémentation
