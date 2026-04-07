# data-testid requis pour activer les tests e2e skippés

Ce document liste les `data-testid` que @fullstack doit ajouter dans le code
pour permettre à @qa d'activer les tests actuellement marqués `test.skip(...)`.

Chaque entrée précise :
- le testid attendu
- le composant source probable
- le (ou les) fichier(s) de tests qui en dépendent

## À ajouter

### Header / navigation

| testid | composant | utilisé par |
|---|---|---|
| `credits-badge` | `components/Header.tsx` — badge qui affiche le nombre de crédits restants | `generation-discovery.spec.ts`, `generation-stripe.spec.ts` |

### Upload & étapes

| testid | composant | utilisé par |
|---|---|---|
| `custom-prompt-toggle` | `components/StylePicker.tsx` — bouton qui bascule en mode texte libre | `generation-custom-prompt.spec.ts` (fallback existe via role name) |
| `room-type-picker` | `components/RoomTypePicker.tsx` — container de la section type de pièce | `generation-room-types.spec.ts` (fallback via id `#step-space-type`) |
| `outdoor-tab` | `components/StylePicker.tsx` / `app/page.tsx` — onglet Intérieur / Extérieur | `generation-outdoor.spec.ts` |
| `furniture-toggle-{index}` | `components/PhotoAssociator.tsx` ou équivalent par-tile | `generation-room-types.spec.ts` (E-BR2-001) |

### Résultats & actions par tile

| testid | composant | utilisé par |
|---|---|---|
| `result-tile-{index}` | container du résultat individuel (1 par photo) | `generation-room-types.spec.ts` (E-BR2-001) |
| `refine-button-{index}` | bouton Affiner par tile (1 par photo) | `generation-multi-photo.spec.ts` (E-BR3-001), `generation-iteration.spec.ts` (E-G10, E-BR4-001) |
| `refine-comment-input` | textarea du panneau Affiner | `generation-iteration.spec.ts` |
| `refine-submit` | bouton d'envoi du commentaire Affiner | `generation-iteration.spec.ts` |

### Toasts & feedback

| testid | composant | utilisé par |
|---|---|---|
| `toast-info-gallery` | toast bleu "votre image est dans la galerie" (BR-4) | `generation-iteration.spec.ts` (E-BR4-001) |

### Stripe / pricing

| testid | composant | utilisé par |
|---|---|---|
| `buy-starter-button` | `app/pricing/page.tsx` — CTA du tier Starter | `generation-stripe.spec.ts` |
| `post-purchase-banner` | bandeau post-achat sur `/pricing?success=1` ou `/compte` | `generation-stripe.spec.ts` |

### Gallerie

| testid | composant | utilisé par |
|---|---|---|
| `gallery-link` | lien header vers `/galerie` | `generation-refresh-tab.spec.ts` (E-G06) |

## Règle

- Les testids sont ajoutés UNIQUEMENT dans les composants rendus côté client.
- Format : `kebab-case`, avec suffixe `-{index}` pour les éléments répétés dans une liste.
- Une fois ajoutés, @qa retire les `test.skip(...)` dans les specs référencées et commit sur la même branche.

## Handoff

- @fullstack : ajouter les testids listés ci-dessus dans les composants cités.
- @qa (round 3) : activer les tests skippés une fois les testids en place.
