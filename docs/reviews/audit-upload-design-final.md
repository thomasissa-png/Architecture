# Audit Design — Page Upload Nouveau Projet
**Date :** 2026-04-13 | **Agent :** @design | **Fichier :** `app/projet/nouveau/page.tsx`

## Scores /10

| # | Critere | Note | Verdict |
|---|---------|------|---------|
| 1 | Hierarchie typo | 8.5 | Solide. h1 `text-2xl font-bold`, labels `text-sm font-medium`, placeholders `text-[#9B9A94]`. Manque : sous-titre trop pres du titre (mt-1 insuffisant, devrait etre mt-2). |
| 2 | Palette | 9.0 | Background #FAFAF8, foreground #1C1C1E, sage #7D9B76 respectes partout. Badge `bg-[#1C1C1E] text-[#FAFAF8]` coherent. |
| 3 | Espacements | 7.5 | **P1** `space-y-6` = 24px entre champs. OK. Mais `mb-1.5` (6px) entre label et input trop serré — standard est `mb-2` (8px). Corrigé ci-dessous. |
| 4 | Drop zone | 8.0 | Dashed border, feedback drag-over sage/5%, icone upload. **P1** : drop zone reduite a `p-4` quand fichiers presents — la zone devient quasi invisible (20x20px icone). Corrigé : taille minimale fixee. |
| 5 | Liste fichiers | 8.5 | Preview 48x48 image, icone PDF, grip drag, label etage sage, bouton supprimer 44px. Tres complet. "Etage 0" en index 0 est ambigu — "RDC" serait plus lisible. Corrigé. |
| 6 | Contraste | 8.5 | `#1C1C1E` sur `#FAFAF8` = ~17:1. `#9B9A94` sur blanc = ~3.8:1 — limite WCAG AA sur text informatif. Acceptable (non-essentiel). Focus ring sage visible. |
| 7 | Responsive | 8.0 | `max-w-2xl px-4` bon pour mobile. Aucune grille multi-colonnes sur desktop (single-column volontaire = correct pour un formulaire). Section pricing flex peut se serrer sur 375px mais reste lisible. |
| 8 | Micro-interactions | 7.0 | **P1** Focus ring sur tous interactifs, hover sur dropzone, drag opacity 40%. Manque : `transition-shadow` sur les inputs mais `transition-colors` absent — le ring apparait sans transition. Corrigé : `transition` unifié. |
| 9 | Densite | 9.0 | Formulaire aere, `space-y-6`, padding suffisant. La section pricing avec `text-3xl` pour "Gratuit" donne de l'air. Rien a corriger. |
| 10 | Coherence systeme | 8.5 | Memes tokens que Versimo principal : border `#D1D0CB`, radius `rounded-lg`, focus ring `ring-[#7D9B76]`. Le select manque l'icone chevron custom (apparence native selon OS). **P1** corrigé ci-dessous. |

**Moyenne : 8.25 / 10**

---

## Corrections P0/P1 appliquees directement

### P1-A — Label-input gap : `mb-1.5` → `mb-2` (3 occurrences)
### P1-B — Drop zone reduite : taille icone et padding minimum preserves quand fichiers presents
### P1-C — "Etage 0" → "RDC" (index 0), "Etage 1" → "1er", autres restent numériques
### P1-D — `transition-shadow` → `transition` sur tous les inputs (inclut colors + shadow)
### P1-E — Select : ajout chevron SVG custom en background-image pour coherence cross-browser
