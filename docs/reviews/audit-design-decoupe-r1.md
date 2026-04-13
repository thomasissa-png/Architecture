# Audit Design — Page "Découpe en biens" (Étape 3)

**Agent** : @design  
**Date** : 2026-04-13  
**Périmètre** : `app/projet/[id]/decoupe/page.tsx` + `components/marchand/PlanEditor.tsx`  
**Comparaison** : `extraction/page.tsx`, `validation/page.tsx`  
**Révision** : R1

---

## Scores par critère

| # | Critère | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Tokens — cohérence système | 6/10 | Palette principale respectée mais plusieurs hex en dur hors système |
| 2 | Hiérarchie visuelle | 8/10 | Plan à 70 %, sidebar à 30 %, CTA sticky bien positionné |
| 3 | Couleurs de lots | 7/10 | 12 couleurs distinctes mais 3 paires à contraste WCAG insuffisant |
| 4 | Plan Editor — lisibilité | 7.5/10 | Labels lisibles, overlays bien différenciés, boîte assignment mal positionnée |
| 5 | Interactions — états | 7/10 | Focus-visible complet, hover manquant sur les pills mobile |
| 6 | Responsive mobile | 6.5/10 | Pills scrollables OK, layout plan/sidebar correct, dropdown assignment inatteignable sur mobile |
| 7 | Feedback visuel — assignation | 8/10 | Changement de couleur immédiat via `roomLotColor()`, spinner CTA |
| 8 | Espacement | 7.5/10 | Rythme cohérent, gap-6 entre plan et sidebar, quelques micro-serrages |
| 9 | Cohérence cross-pages | 7/10 | Structure header/stepper/CTA sticky partagée, mais tokens dupliqués localement |
| 10 | États différenciés — cards, selects | 6.5/10 | Selected/highlighted bien traités, disabled states incomplets sur select lot |

**Note globale : 7.1/10**

---

## Problèmes classés par priorité

---

### P0 — Bloquant

#### P0-1 · Dropdown d'assignation inaccessible sur mobile

**Fichier** : `app/projet/[id]/decoupe/page.tsx` — ligne 500

**Problème** : Le dropdown "Assigner à un lot" est positionné en `absolute top-4 right-4` dans le conteneur du plan. Sur mobile, ce conteneur fait `100%` de largeur, la boîte sort du viewport ou chevauche le plan, et aucune alternative n'est proposée. Les pills mobiles (ligne 677) affichent les lots mais ne permettent pas l'assignation — elles sont purement informationnelles.

**Impact** : Thomas sur iPhone ne peut pas assigner une pièce à un lot. Fonctionnalité centrale de la page = bloquant.

**Fix** : Remplacer le dropdown `absolute` par un bottom sheet conditionnel sur mobile.

```tsx
// page.tsx — remplacer la div absolute (ligne 500) par :
{selectedRoomId && (
  <>
    {/* Desktop — dropdown absolu sur le plan */}
    <div className="hidden lg:block absolute top-4 right-4 bg-white border border-[#1C1C1E]/10 rounded-lg shadow-lg p-3 z-20 min-w-[200px]">
      {/* ... contenu actuel ... */}
    </div>

    {/* Mobile — bottom sheet sticky */}
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white border-t border-[#1C1C1E]/10 rounded-t-2xl p-4 shadow-2xl pb-[env(safe-area-inset-bottom)]">
      <p className="text-xs font-medium text-[#1C1C1E]/60 mb-3">Assigner à un lot :</p>
      <div className="flex flex-col gap-1">
        {lots.map((lot) => (
          <button key={lot.id} onClick={() => assignRoomToLot(selectedRoomId, lot.id)}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-[#1C1C1E]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] min-h-[44px]">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: lot.color }} />
            {lot.name}
          </button>
        ))}
        <hr className="my-1 border-[#1C1C1E]/10" />
        <button onClick={() => assignRoomToLot(selectedRoomId, null)}
          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[#1C1C1E]/60 rounded-lg hover:bg-[#1C1C1E]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] min-h-[44px]">
          <span className="w-3 h-3 rounded-full shrink-0 border border-dashed border-[#1C1C1E]/30" style={{ backgroundColor: UNASSIGNED_COLOR }} />
          Non assignée
        </button>
      </div>
    </div>
  </>
)}
```

---

#### P0-2 · Touch targets insuffisants sur le bouton de suppression de lot

**Fichier** : `app/projet/[id]/decoupe/page.tsx` — ligne 589

**Problème** : Le bouton de suppression `<svg>` fait `14×14px` avec `p-1`, soit environ `22×22px` au total — en dessous du minimum WCAG 2.2 AA de 44×44px sur mobile.

**Fix** :

```tsx
// Remplacer :
className="text-[#1C1C1E]/30 hover:text-red-500 transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] rounded"

// Par :
className="text-[#1C1C1E]/30 hover:text-red-500 transition-colors p-3 -m-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
```

---

### P1 — Majeur

#### P1-1 · Trois couleurs de lots en dessous du ratio WCAG AA 3:1 sur fond blanc

**Fichier** : `app/projet/[id]/decoupe/page.tsx` — ligne 23

**Problème** : Analyse des rapports de contraste des `LOT_COLORS` sur fond blanc (`#FAFAF8`) :

| Couleur | Hex | Ratio estimé | Statut |
|---------|-----|--------------|--------|
| Jaune amber | `#F59E0B` | ~1.8:1 | FAIL (3:1 requis pour éléments graphiques) |
| Rose pink | `#EC4899` | ~2.6:1 | FAIL |
| Jaune orange | `#F97316` | ~2.1:1 | FAIL |

Ces couleurs servent à colorer les rectangles de pièces sur le plan blanc — elles doivent passer 3:1 pour les éléments non-textuels (WCAG 2.2 AA).

**Fix** : Assombrir les trois teintes non-conformes.

```tsx
const LOT_COLORS = [
  "#7D9B76", // sage — OK
  "#6366F1", // indigo — OK
  "#D97706", // amber-600 remplace amber-500 (#F59E0B) — ratio ~3.2:1
  "#EF4444", // red — OK
  "#06B6D4", // cyan — OK
  "#DB2777", // pink-600 remplace pink-500 (#EC4899) — ratio ~3.1:1
  "#8B5CF6", // violet — OK
  "#10B981", // emerald — OK
  "#EA580C", // orange-600 remplace orange-500 (#F97316) — ratio ~3.3:1
  "#3B82F6", // blue — OK
  "#14B8A6", // teal — OK
  "#A855F7", // purple — OK
];
```

---

#### P1-2 · Tokens hex en dur hors système (8 occurrences)

**Fichier** : `app/projet/[id]/decoupe/page.tsx`

**Problème** : La palette est définie dans `globals.css` via des variables CSS (`--background`, `--foreground`, `--sage`). Ces tokens ne sont pas utilisés — tout est écrit en hex brut. Ce n'est pas conforme à l'architecture token du design system.

**Occurrences principales** :

| Ligne | Valeur en dur | Token équivalent |
|-------|--------------|------------------|
| 397 | `bg-[#FAFAF8]` | `bg-background` (var CSS) ou classe utilitaire custom |
| 411 | `text-[#1C1C1E]` | `text-foreground` |
| 414 | `text-[#1C1C1E]/60` | `text-foreground/60` — acceptable si var non disponible |
| 421 | `border-[#7D9B76]` | `border-sage` |
| 452 | `bg-[#7D9B76]/10` | `bg-sage/10` |
| 491 | `bg-[#1C1C1E]/5` | `bg-foreground/5` |
| 541 | `bg-[#1C1C1E]` | `bg-foreground` |
| 696 | `bg-[#FAFAF8]` | `bg-background` |

**Fix** : Déclarer les couleurs dans `tailwind.config.ts` pour pouvoir écrire `bg-background`, `text-foreground`, `bg-sage`.

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      background: "#FAFAF8",
      foreground: "#1C1C1E",
      sage: "#7D9B76",
      muted: "#58585B",
    }
  }
}
```

Puis remplacer `bg-[#FAFAF8]` → `bg-background`, `text-[#1C1C1E]` → `text-foreground`, `bg-[#7D9B76]` → `bg-sage` dans tous les fichiers du parcours marchand.

---

#### P1-3 · CTA sticky opacité insuffisante sur fond transparent à la limite de scroll

**Fichier** : `app/projet/[id]/decoupe/page.tsx` — ligne 696

**Problème** : Le CTA sticky utilise `bg-[#FAFAF8]` sans blur ni opacité renforcée. Quand le contenu scrolle sous la barre, les cards de lots sont lisibles en transparence — manque de séparation visuelle.

**Fix** :

```tsx
// Remplacer :
className="sticky bottom-0 bg-[#FAFAF8] border-t border-[#1C1C1E]/10 py-4 mt-8 -mx-4 px-4 flex items-center justify-between gap-3"

// Par :
className="sticky bottom-0 bg-[#FAFAF8]/95 backdrop-blur-sm border-t border-[#1C1C1E]/10 py-4 mt-8 -mx-4 px-4 flex items-center justify-between gap-3"
```

---

#### P1-4 · PlanEditor : couleurs de pièces en mode découpe ignorent la couleur de lot (conflit)

**Fichier** : `components/marchand/PlanEditor.tsx` — ligne 1196

**Problème** : Dans `PlanEditor`, la couleur du fond des pièces (`bgColor`) est calculée via `room.color || colorForType(room.roomType)`. Mais `colorForType()` retourne les couleurs par type de pièce (salon = vert sage, chambre = bleu, etc.) — des RGBA à 0.3 de transparence. Or la `page.tsx` passe bien `color: roomLotColor(r.id)` qui est un hex plein de lot (`#6366F1`, etc.).

Le problème est que `ROOM_COLORS` dans PlanEditor est un dictionnaire de RGBA strings, tandis que les couleurs de lots sont des hex pleins. La logique `bgColor.replace("0.3)", "0.55)")` (ligne 1316) tente de modifier un RGBA — ce replace ne fonctionnera pas sur un hex de lot comme `#6366F1`.

**Fix** : Détecter si la couleur est un hex ou un RGBA, et appliquer l'opacité correctement.

```tsx
// Helpers à ajouter dans PlanEditor.tsx :
function applyOpacityToColor(color: string, opacity: number): string {
  if (color.startsWith("rgba")) {
    return color.replace(/[\d.]+\)$/, `${opacity})`);
  }
  // Hex color — convert to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Dans le rendu des room overlays, remplacer :
backgroundColor: isHighlighted
  ? bgColor.replace("0.3)", "0.55)")
  : isNewRoom ? bgColor.replace("0.3)", "0.4)") : bgColor,

// Par :
backgroundColor: isHighlighted
  ? applyOpacityToColor(bgColor, 0.45)
  : isNewRoom ? applyOpacityToColor(bgColor, 0.35) : applyOpacityToColor(bgColor, 0.25),
```

---

#### P1-5 · Pills mobiles non interactives — information sans action

**Fichier** : `app/projet/[id]/decoupe/page.tsx` — ligne 677

**Problème** : Les pills mobiles en bas de page affichent les lots avec leur couleur et leur comptage de pièces. Ce sont des `<button>` mais sans onClick handler — cliquer ne fait rien. L'utilisateur mobile pourrait légitimement s'attendre à ce qu'un clic sur la pill filtre les pièces du lot ou sélectionne le lot actif.

**Fix** : Soit ajouter un comportement (filtrer les pièces du lot sélectionné sur le plan), soit convertir en `<div>` non-interactif pour ne pas créer de fausse affordance. La première option est recommandée.

```tsx
// Option 1 — ajouter un state activeLotId et filtrer visuellement :
const [activeLotId, setActiveLotId] = useState<string | null>(null);

// Dans les pills :
<button
  key={lot.id}
  onClick={() => setActiveLotId(prev => prev === lot.id ? null : lot.id)}
  className={`... ${activeLotId === lot.id ? "border-[#7D9B76] bg-[#7D9B76]/10" : "border-[#1C1C1E]/10 bg-white"}`}
>
```

---

#### P1-6 · Select "type de lot" — état focus-visible absent sur Safari

**Fichier** : `app/projet/[id]/decoupe/page.tsx` — ligne 605

**Problème** : Le `<select>` utilise `focus-visible:ring-2` en Tailwind. Sur Safari, les selects natifs n'appliquent pas les styles focus custom sans `appearance-none` ou override explicite. Le ring de focus disparaît sur Safari mobile.

**Fix** :

```tsx
// Remplacer :
className="w-full text-xs border border-[#1C1C1E]/10 rounded px-2 py-1 mb-2 bg-[#FAFAF8] text-[#1C1C1E]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76]"

// Par :
className="w-full text-xs border border-[#1C1C1E]/10 rounded px-2 py-1 mb-2 bg-[#FAFAF8] text-[#1C1C1E]/70 appearance-none focus:outline-none focus:ring-2 focus:ring-[#7D9B76]"
```

Note : utiliser `focus:` (pas `focus-visible:`) sur les `<select>` natifs pour assurer la compatibilité cross-browser.

---

### P2 — Mineur

#### P2-1 · Couleur multi-étage (`text-[#6366F1]`) — token hors système et incohérent

**Fichier** : `app/projet/[id]/decoupe/page.tsx` — ligne 625

**Problème** : L'indicateur "Étages X+Y" utilise `text-[#6366F1]` (indigo) — une couleur qui est aussi la 2ème couleur de lot. Si le lot 2 est indigo, un Thomas avec un lot multi-étages verra la même couleur pour deux significations différentes. Incohérence sémantique.

**Fix** : Utiliser une couleur informationnelle neutre distincte.

```tsx
// Remplacer :
<span className="text-[#6366F1]">

// Par :
<span className="text-[#1C1C1E]/50 font-medium">
```

---

#### P2-2 · Banner "pièce unique" — couleur d'information confondue avec succès

**Fichier** : `app/projet/[id]/decoupe/page.tsx` — ligne 452

**Problème** : La banner `isSingleLot` utilise `bg-[#7D9B76]/10 border-[#7D9B76]/20` — la couleur sage, identique aux banners de succès dans les autres pages. Mais ce message est informatif, pas un succès. Sur `extraction/page.tsx`, le même traitement vert est réservé aux confirmations positives.

**Fix** : Utiliser un traitement neutre pour les messages purement informatifs.

```tsx
// Remplacer :
className="bg-[#7D9B76]/10 border border-[#7D9B76]/20 rounded-lg p-4 mb-6"

// Par :
className="bg-[#1C1C1E]/[0.03] border border-[#1C1C1E]/10 rounded-lg p-4 mb-6"
```

---

#### P2-3 · PlanEditor — texte d'aide `text-[#4A7A42]` non défini dans le système

**Fichier** : `components/marchand/PlanEditor.tsx` — ligne 780

**Problème** : `text-[#4A7A42]` et `bg-[#F0F4EE]` sont des valeurs hardcodées qui n'existent pas dans les tokens définis dans `globals.css`. Ce vert foncé légèrement différent du sage (`#7D9B76`) crée une dérive imperceptible mais réelle.

**Fix** : Remplacer par le token sage avec opacité ajustée.

```tsx
// Remplacer :
className="p-3 rounded-lg bg-[#F0F4EE] border border-[#7D9B76]/20 text-[13px] text-[#4A7A42] leading-relaxed"

// Par :
className="p-3 rounded-lg bg-[#7D9B76]/8 border border-[#7D9B76]/20 text-[13px] text-[#7D9B76] leading-relaxed"
// Note : bg-[#7D9B76]/8 = ~équivalent visuel de #F0F4EE
```

---

#### P2-4 · Onglets d'étage — taille de touch target insuffisante

**Fichier** : `app/projet/[id]/decoupe/page.tsx` — ligne 466

**Problème** : Les boutons d'étage font `px-3 py-1.5` soit environ 36px de hauteur — en dessous des 44px WCAG 2.2 AA.

**Fix** :

```tsx
// Remplacer :
className={`px-3 py-1.5 text-sm rounded-md transition-colors ...`}

// Par :
className={`px-3 py-2.5 text-sm rounded-md transition-colors min-h-[44px] ...`}
```

---

#### P2-5 · Barre d'outils PlanEditor surchargée sur petits écrans

**Fichier** : `components/marchand/PlanEditor.tsx` — ligne 798

**Problème** : La barre d'outils contient jusqu'à 7 boutons (Annuler, Refaire, Fusionner, Nouvelle pièce, Calibrer, Options + séparateurs). Sur écran <375px, le `overflow-x-auto` sur `sm:flex-wrap` crée un scroll horizontal invisible pour l'utilisateur — aucun indicateur de scroll.

**Fix** : Masquer le label texte des boutons Annuler/Refaire en-dessous de `md` (actuellement `hidden sm:inline` = masqué sous 640px, déjà OK). Mais vérifier que le bouton Calibrer a bien son texte masqué sous sm — ligne 984 : `hidden sm:inline` est en place. OK, pas de changement code. Ajouter un indicateur de scroll subtil (fade gradient) sur le conteneur.

```tsx
// Wraper la toolbar dans un conteneur avec fade gradient :
<div className="relative">
  <div className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap scrollbar-hide">
    {/* boutons actuels */}
  </div>
  <div className="sm:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
</div>
```

---

## Synthèse des problèmes

| Priorité | Nombre | Exemples |
|----------|--------|---------|
| P0 | 2 | Dropdown assignation inaccessible mobile, touch target suppression lot |
| P1 | 6 | Contrastes WCAG lots, tokens hex en dur, CTA opacité, couleurs lot hex/RGBA conflict, pills non interactives, select focus Safari |
| P2 | 5 | Couleur multi-étage incohérente, banner info/succès confondue, token #4A7A42 hors système, onglets étage touch target, barre outils scroll |

---

## Points forts à conserver

- **Hiérarchie 70/30** desktop parfaitement exécutée — le plan est l'élément hero, sans ambiguïté.
- **Focus-visible universel** — chaque bouton, input et select de la page a son `focus-visible:ring-2 focus-visible:ring-[#7D9B76]`. Solide.
- **CTA sticky bien structuré** — le bouton Retour est visuellement subordonné (texte seul), le CTA primaire est dominant (fond sombre). Hiérarchie d'action correcte.
- **Feedback d'assignation immédiat** — `roomLotColor()` basé sur le state React garantit que la pièce change de couleur sans latence perceptible. Bonne architecture.
- **ARIA roles PlanEditor** — `role="application"`, `aria-label` sur les zones interactives, `min-h-[44px] min-w-[44px]` sur les handles WCAG (ligne 136-137 HANDLE_HIT_SIZE = 44).
- **Spinner CTA** — le state "saving" est correctement communiqué avec un spinner inline.
- **Animation transitions** — `transition-colors 150ms ease` cohérent sur tous les interactifs.

---

## Verdict

**Note globale : 7.1/10**

Le squelette de la page est solide : bonne hiérarchie, focus-visible rigoureux, feedback immédiat. Les problèmes principaux sont concentrés sur le mobile (P0-1 = la fonctionnalité centrale est inaccessible sur iPhone) et sur la conformité système des tokens. Une session de fix ciblée sur P0 + P1 amènerait la page à 8.5+/10.

**Priorité d'action recommandée** :
1. P0-1 — Bottom sheet mobile (bloquant fonctionnel)
2. P0-2 — Touch target suppression lot (WCAG bloquant)
3. P1-4 — Fix `applyOpacityToColor()` (bug visuel silencieux sur les couleurs de lots hex)
4. P1-1 — Correction des 3 couleurs WCAG (accessibilité)
5. P1-2 — Déclaration tokens dans tailwind.config (dette système)

---

**Handoff → @fullstack**

- Fichier produit : `/home/user/Architecture/docs/reviews/audit-design-decoupe-r1.md`
- Décisions prises :
  - Pattern bottom sheet mobile obligatoire pour tout dropdown d'assignation sur plan interactif (conforme au learning cross-projets "Modals mobile = bottom sheet")
  - 3 couleurs de lots remplacées par leurs variantes -600 pour conformité WCAG 3:1
  - Helper `applyOpacityToColor()` à créer dans PlanEditor pour unifier le traitement hex/rgba
  - Tokens à déclarer dans tailwind.config.ts (`background`, `foreground`, `sage`, `muted`)
- Points d'attention :
  - Le bottom sheet mobile doit inclure `pb-[env(safe-area-inset-bottom)]` pour iOS
  - Le select lot type nécessite `focus:` (pas `focus-visible:`) + `appearance-none` pour Safari
  - Les touch targets des boutons d'étage et de suppression de lot sont en dessous de 44px — corriger en même temps
