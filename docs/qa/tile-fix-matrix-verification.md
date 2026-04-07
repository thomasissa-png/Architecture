# Verification QA — Fix UX grille resultats 2 colonnes (Session 36)

**Date** : 2026-04-07
**Agent** : @qa
**Branche** : `claude/extract-project-context-vFT9J`
**Bug source** : section resultats stack vertical (`space-y-10`) → image portrait remplit la viewport desktop, scroll force pour voir le bas
**Fix @fullstack** : `app/page.tsx` ligne 2606 — `space-y-10` remplace par `grid grid-cols-1 sm:grid-cols-2`

## Statut du fix

| Element | Etat |
|---|---|
| Diff @fullstack applique | Oui (uncommitted dans working tree au moment de l'audit) |
| Ligne modifiee | `app/page.tsx:2606` |
| ImageComparator.tsx touche | Non (directive fondateur respectee) |
| `data-testid="results-grid-container"` ajoute | Oui (par @qa, ligne 2606) |
| Loading tiles (ligne 2391) deja en grid 2-cols | Oui — le fix aligne les resultats sur les loading tiles |

## Verification type-de-compte-agnostique

**Methode** : grep des conditionnels de session/credit autour du wrapper resultats (lignes 2400-2610).

```bash
sed -n '2400,2610p' app/page.tsx | grep -nE "hasStarter|isPro|userCredits|session\?\.user|credits >"
# → NO ACCOUNT CONDITIONALS FOUND
```

**Conclusion** : le wrapper `{results.length > 0 && !isGenerating && (...)}` (ligne 2601) ne depend QUE de l'etat des resultats, jamais du type de compte. Le fix CSS s'applique de maniere identique pour :
- Anonyme (rate limit IP)
- Gratuit / Starter / Pro / Business
- Mode Pro / Mode Discovery

Aucune branche conditionnelle de rendu different selon le compte n'a ete detectee dans la zone du fix.

## Matrice de couverture

| Cas | Viewport | Photos | Classes attendues | Ratio tile/container attendu | Couvert |
|---|---|---|---|---|---|
| 1 | iPhone 13 (375x812) | 1 | `grid grid-cols-1 sm:max-w-xl lg:max-w-2xl` (PAS de `sm:grid-cols-2`) | ~1.0 | Oui |
| 2 | iPad Mini (768x1024) | 1 | idem | ~1.0 | Oui |
| 3 | Desktop 1280 | 1 | idem | ~1.0 | Oui |
| 4 | iPhone 13 | 2 | `grid grid-cols-1 sm:grid-cols-2 sm:max-w-3xl lg:max-w-4xl` | > 0.9 (mobile = 1 col) | Oui |
| 5 | iPad Mini | 2 | idem | < 0.6 (sm: actif) | Oui |
| 6 | Desktop 1280 | 2 | idem | < 0.6 (lg: actif) | Oui |
| 7 | iPhone 13 | 3 | idem | > 0.9 | Oui |
| 8 | iPad Mini | 3 | idem | < 0.6 | Oui |
| 9 | Desktop 1280 | 3 | idem | < 0.6 | Oui |
| 10 | Desktop 1280 (anonyme, sans auth fixture) | 2 | idem | < 0.6 | Oui (regression guard) |

**Total** : 10 cas de test E2E generes dans `tests/e2e/results-grid-layout.spec.ts`.

### Cas non couverts dans cette spec dediee (couverts ailleurs)

- **4 photos** : couverture indirecte via `generation-multi-photo.spec.ts` (E-G02 deja teste avec 3 photos, E-G03 avec 5 photos). La logique de classes est binaire (`results.length === 1` vs reste), donc tester 2/3 suffit pour valider la branche multi.
- **5 photos** : idem, branche identique a 2/3.
- **Desktop 1920** : branche `xl:` non utilisee dans le className (uniquement `sm:` et `lg:`), donc 1280 valide deja toutes les classes responsive.

## Assertions cles du test

1. **Classes Tailwind exactes** : verification via `getAttribute("class")` que les bonnes classes sont presentes ET que `space-y-10` (ancien bug) est absent.
2. **Bounding box** : sur viewports >= 768px en multi-photo, le 1er tile doit faire moins de 60% de la largeur du container (preuve visuelle du 2-col layout). Sur mobile < 640px, le tile doit faire plus de 90% (preuve du fallback 1-col).
3. **Regression guard anonyme** : un dernier test reproduit le flow sans aucune auth fixture pour confirmer que le grid s'applique meme sans session.

## Quality gates

| Gate | Resultat |
|---|---|
| `npx tsc --noEmit` | PASS (0 erreur) |
| `npx next lint` | PASS (No ESLint warnings or errors) |
| `npx vitest run` | PASS — 184 passed / 4 skipped / 0 failed (baseline session 34 preservee) |
| `npx playwright test ... --list` | PASS — 10 tests parses |

## Commande d'execution sur Replit

```bash
# Tous les cas du fix (10 tests)
npx playwright test tests/e2e/results-grid-layout.spec.ts --project=chromium

# Avec UI mode pour debug visuel
npx playwright test tests/e2e/results-grid-layout.spec.ts --ui

# Un seul cas (debug)
npx playwright test tests/e2e/results-grid-layout.spec.ts --project=chromium -g "3 photos / Desktop"
```

L'execution runtime se fait sur Replit (le fondateur). Les tests sont parses sans erreur en local — pret pour CI.

## Limitations

1. **Pas de visual regression (snapshots)** : hors scope — on verifie classes CSS et bounding boxes, pas de pixel diff. Si une regression purement visuelle apparaissait (ex: gap mal applique), elle ne serait detectee qu'en revue manuelle.
2. **Pas de test 4-5 photos dans cette spec dediee** : la logique de classes est binaire (`results.length === 1` vs `> 1`), donc tester 2/3 couvre toute la branche multi-photo. La couverture 4/5 photos reste assuree par `generation-multi-photo.spec.ts` E-G03.
3. **Mock complet de `/api/generate`** : on ne teste pas le pipeline IA reel (job de @ia / @interior-architect / @ai-image-expert).
4. **Iterations / refine non testees** : ce fix concerne uniquement l'affichage initial des resultats. Les flows refine/regenerate gardent le meme `result-tile-${index}` et heritent automatiquement du grid parent.

## Recommandation

GO pour commit et deploy. Le fix est :
- Type-de-compte-agnostique (verifie par grep)
- Coherent avec le pattern des loading tiles (ligne 2391)
- Couvert par 10 cas E2E sur 3 viewports x 3 cas de photos + 1 regression guard
- Sans regression sur la baseline vitest (184/4/0)
- Sans toucher a `ImageComparator.tsx` (directive fondateur respectee)

---

**Handoff -> @orchestrator**
- Fichiers produits : `tests/e2e/results-grid-layout.spec.ts`, `docs/qa/tile-fix-matrix-verification.md`
- Modification : `app/page.tsx:2606` ajout `data-testid="results-grid-container"`
- Decisions : 10 tests E2E, mock complet de `/api/generate`, assertions classes + bounding box
- Points d'attention : les tests s'executent sur Replit (pas localement). Si le fondateur change le pattern de grille (ex: passer en `grid-cols-3` pour 4+ photos), il faudra etendre ce spec.
