# Audit UX — ProStepper.tsx
Date : 2026-04-13 | Agent : @ux | Persona : Thomas, 35 ans, marchand de biens, iPhone 15 Pro + laptop

---

## Scores /10

| Critère | Score | Diagnostic |
|---|---|---|
| Clarté progression | 6/10 | 7 étapes visibles mais l'étape active ne s'impose pas visuellement — ring 10% opacité quasi invisible |
| Affordance | 5/10 | Aucun indicateur que les étapes complétées sont cliquables. `cursor-not-allowed` sur locked = correct, mais les completed ne signalent pas leur interactivité |
| Responsive (mobile Thomas) | 5/10 | Double bouton par step (dot + label) = 14 éléments focusables. Sublabels absents sur mobile. Connecteur `h-3` trop court, le fil visuel se perd |
| Accessibilité | 6/10 | `aria-current="step"` correct, `aria-label` correct. Mais l'état error = `!` à 10px sans `role="alert"`, pas lisible. 2 boutons focusables par étape mobile |
| Ancrage visuel | 4/10 | `nav` sans fond ni bordure — le stepper flotte sur la page, pas de `position: sticky` ni de séparation visuelle avec le contenu |

**Score global : 5.2/10** — insuffisant pour Thomas qui ne cherche pas où il en est dans le parcours.

---

## Recommandations

### P0 — Ancrage visuel (cause principale du ressenti "volant")

**Problème** : le `<nav>` n'a aucun fond, aucune frontière visuelle. Sur la page, il disparaît dans le contenu.

**Changement** : ajouter `bg-[#FAFAF8] border-b border-[#E8E7E3] sticky top-0 z-20 px-6 py-4` sur le `<nav>`.

```
Avant : className="w-full overflow-x-auto"
Après : className="w-full overflow-x-auto bg-[#FAFAF8] border-b border-[#E8E7E3] sticky top-0 z-20 px-6 py-4"
```

### P0 — Étape active illisible (ring 10% = invisible)

**Problème** : `ring-[#1C1C1E]/10` sur le dot actif est à 10% d'opacité. Thomas ne sait pas où il en est.

**Changement** : remplacer le ring par un fond et une ombre portée nette.

```
Avant  (DOT_STYLES.active) : "bg-[#1C1C1E] text-white ring-4 ring-[#1C1C1E]/10"
Après  (DOT_STYLES.active) : "bg-[#1C1C1E] text-white ring-4 ring-[#1C1C1E]/20 shadow-md"
```

Et ajouter un label actif plus visible — passer le sublabel actif en non-masqué mobile :

```
Avant (sublabel desktop) : <span className="text-[11px] text-[#9B9A94] ...">
Après (sublabel actif)   : <span className={`text-[11px] leading-[14px] text-center ${state === "active" ? "text-[#1C1C1E] font-medium" : "text-[#9B9A94]"}`}>
```

### P0 — Double bouton mobile (14 focusables au lieu de 7)

**Problème** : chaque step mobile a un bouton dot ET un bouton label indépendants. Double duplication DOM et accessibilité cassée.

**Changement** : fusionner en un seul `<button>` wrappant dot + label.

```
Avant : <button ...>{dot}</button>  +  <button ...><span>{label}</span></button>
Après : <button ... className="flex items-center gap-2.5 min-h-[44px]">
          <div>{dot}</div>
          <span className={`text-xs ... ${LABEL_STYLES[state]}`}>{step.label}</span>
        </button>
```

Supprimer le wrapper `<div className="flex flex-col items-center">` et le second `<button>`. Connecteur reste en dehors, dans le `<li>`.

### P1 — Affordance : les étapes completed ne signalent pas leur cliquabilité

**Problème** : hover effect `opacity-70` est invisible au survol passif. Thomas ne découvrira jamais qu'il peut revenir à l'étape 1.

**Changement** : ajouter `underline-offset-2 hover:underline` sur le label des completed, ou remplacer `hover:opacity-70` par `hover:opacity-80` + `hover:ring-2`.

```
Avant (button completed) : "cursor-pointer hover:opacity-70 focus-visible:..."
Après                    : "cursor-pointer hover:opacity-75 hover:ring-2 hover:ring-[#7D9B76]/30 focus-visible:..."
```

### P1 — Sublabels masqués sur mobile : Thomas perd le contexte

**Problème** : `sm:hidden` masque les sublabels. "Analyse" sans "Détection des pièces" ne dit rien à Thomas.

**Changement** : afficher le sublabel de l'étape active uniquement sur mobile, masquer les autres.

```
Ajouter après le label dans le bloc mobile :
{state === "active" && (
  <span className="text-[10px] text-[#9B9A94] leading-3 block mt-0.5">
    {step.sublabel}
  </span>
)}
```

### P1 — Connecteur mobile trop court (`h-3` = 12px)

**Problème** : le fil entre les dots est de 12px. Sur 7 étapes le parcours vertical semble segmenté, pas continu.

**Changement** : `h-3` → `h-5` (20px).

```
Avant : className={`w-0.5 h-3 mt-0.5 transition-colors ...`}
Après : className={`w-0.5 h-5 mt-0.5 transition-colors ...`}
```

### P1 — État error sans signal sonore/ARIA

**Problème** : le `!` est affiché à 10px (mobile) ou en dot rouge (desktop), mais sans `role="alert"`. Un lecteur d'écran ne signale pas l'erreur proactivement.

**Changement** : ajouter un span visuellement masqué dans le dot error.

```
Avant : <span aria-hidden="true">!</span>
Après : <><span aria-hidden="true">!</span><span className="sr-only">Erreur à cette étape</span></>
```

---

## Tests UX — ProStepper

| Test | Critère | Statut |
|---|---|---|
| Thomas sait où il en est sans effort | Étape active visible en 1 seconde | ❌ ring 10% invisible |
| Thomas peut revenir en arrière | Étapes complétées signalent leur cliquabilité | ❌ affordance manquante |
| Navigation clavier complète | 7 éléments focusables (1 par step) sur mobile | ❌ 14 actuellement |
| WCAG 2.2 AA focus-visible | `focus-visible:ring-2 ring-[#7D9B76]` présent | ✅ |
| Touch target >= 44px mobile | `min-w-[44px] min-h-[44px]` présent | ✅ |
| Stepper ancré à la page | Sticky top-0 + fond + border-bottom | ❌ absent |
| État error lisible screen reader | sr-only sur le message d'erreur | ❌ absent |

---

**Handoff → @fullstack**
- Fichier audité : `components/marchand/ProStepper.tsx`
- P0 (3 corrections, bloquer le merge) : sticky + fond sur `<nav>`, ring actif visible, fusion double bouton mobile
- P1 (4 corrections) : affordance hover completed, sublabel actif mobile, connecteur h-5, sr-only erreur
- Aucun changement de logique ni de props requis — modifications CSS/JSX uniquement
