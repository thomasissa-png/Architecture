# Audit Design — Contour du bâtiment (PlanEditor.tsx)
**Date :** 2026-04-13 | **Agent :** @design | **Note : 5.5/10**

---

## Périmètre audité
`components/marchand/PlanEditor.tsx` — lignes 1206-1258 (overlay building outline)

---

## Résultats par critère

### 1. Rouge vs palette sage — INCOHÉRENT (P1)
`rgba(220, 60, 60, 0.7)` est un rouge vif hors palette. La palette Versimo est `#FAFAF8 / #1C1C1E / #7D9B76`. Le rouge casse la cohérence visuelle : les guides d'alignement utilisent `#7D9B76`, les states d'erreur globaux n'ont pas de token rouge défini. Deux lectures conflictuelles : "erreur/danger" (rouge) vs "délimitation informative" (intention réelle).

**Correction P1 :** Utiliser `#7D9B76` (sage) avec opacité 0.85 pour le border dashed et les poignées. Si le rouge signifie "attention requise" (outline non validé), documenter ce token sémantique et l'appliquer uniformément.

---

### 2. Poignées 14×14px — NON-CONFORME WCAG (P0)
Les 4 poignées de coin font `14px × 14px` (width/height hardcodés). Le standard WCAG 2.5.5 exige 44×44px de zone de tap minimum sur mobile. Le `pointer-events-auto` est actif. Sur un plan zoomé à 0.5×, la zone effective tombe à 7×7px.

**Correction P0 :**
```tsx
// Remplacer dans le style des handles :
width: 14, height: 14,  // visuel conservé
// Ajouter une zone de tap transparente :
padding: 15,  // zone de tap = 14 + 30 = 44px
// OU utiliser un wrapper :
<div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  <div style={{ width: 14, height: 14, borderRadius: '50%', ... }} />
</div>
```

---

### 3. z-index [2] vs pièces — RISQUE DE MASQUAGE (P1)
Le contour est à `z-[2]`. Les guides d'alignement sont à `z-[5]`, la calibration à `z-[25]`. Les pièces (rooms) ne sont pas visibles dans l'extrait audité — leur z-index est inconnu. Si les pièces sont à `z-[3]` ou plus, elles recouvrent le contour. Le contour devrait visuellement être **sous les pièces** (fond de référence) mais ses poignées de resize doivent être **au-dessus**.

**Correction P1 :** Séparer l'overlay visuel (z-[1]) des poignées interactives (z-[4], juste sous les guides d'alignement à z-[5]). Vérifier le z-index des rooms dans le reste du composant avant d'ajuster.

---

### 4. Label — LISIBILITÉ FRAGILE (P2)
Position `-top-5 left-1` (−20px, hors du rectangle). Sur un outline positionné en haut du plan (`y_percent` faible), le label se retrouve hors du viewport ou tronqué. Taille `text-[10px]` = 10px, en dessous du minimum WCAG 1.4.4 (texte lisible sans zoom). Background `rgba(255,255,255,0.85)` sans padding suffisant.

**Correction P2 :** `text-[11px]` minimum, position `top-1 left-1` (à l'intérieur du rectangle), ajouter `px-1.5 py-0.5` pour le fond. Ou afficher le label en bas si `y_percent < 10`.

---

### 5. Tokens hardcodés — VIOLATION TOTALE (P1)
Tous les styles sont hardcodés en inline. Liste exhaustive :
- `rgba(220, 60, 60, 0.7)` — border
- `rgba(220, 60, 60, 0.15)` — boxShadow
- `rgba(220, 60, 60, 0.9)` — handles background + label color
- `"2px solid white"` — handle border
- `"rgba(255,255,255,0.85)"` — label background
- `14` (px) — handle size
- `"2px"` — borderRadius

Aucune valeur ne référence un token du design system.

**Correction P1 :** Extraire dans des constantes CSS ou des tokens Tailwind. À minima, créer un objet `OUTLINE_STYLE` en haut du fichier et remplacer toutes les valeurs inline par ses propriétés. Idéalement, migrer vers tokens sémantiques (`color-interactive-outline`, `color-interactive-handle`).

---

## Synthèse

| Critère | Sévérité | Statut |
|---|---|---|
| Touch targets poignées 14px | P0 | BLOQUANT — non-conforme WCAG 2.5.5 |
| Rouge hors palette | P1 | Incohérence brand |
| z-index contour vs pièces | P1 | Risque fonctionnel |
| Tokens hardcodés (7 valeurs) | P1 | Dette design |
| Label position/taille | P2 | Lisibilité dégradée |

**Note : 5.5/10** — La fonctionnalité est présente et fonctionnelle mais cumule 1 BLOQUANT WCAG, 3 P1 de cohérence système, et une dette tokens totale.

---

**Handoff → @fullstack**
- Fichier : `components/marchand/PlanEditor.tsx` lignes 1220-1257
- P0 à corriger en priorité : zones de tap poignées → envelopper chaque handle dans un div 44×44px transparent avec `pointer-events-auto`
- P1 : remplacer `rgba(220,60,60,...)` par `#7D9B76` avec opacités 0.85/0.15/0.9
- P1 : auditer z-index des rooms avant d'ajuster z-[2] du contour
- P1 : extraire les 7 valeurs inline dans un objet constant
