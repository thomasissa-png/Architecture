# Changements Produit v2 — Versimo

> Produit par @product-manager — 2026-03-31
> Demande fondateur : 3 modifications produit à implémenter

---

## Changement 1 — Crédits gratuits : 3 → 2

### Contexte
Le coût API par génération est ~0,10-0,20€ (2 passes OpenAI). À 3 crédits gratuits par compte, le coût d'acquisition par nouveau compte est ~0,30-0,60€. Réduire à 2 diminue ce coût de 33%.

### Spec fonctionnelle

- **Avant** : 3 générations offertes à l'inscription (one-time)
- **Après** : 2 générations offertes à l'inscription (one-time)
- Le compteur de crédits gratuits affiche "2 crédits restants" à la création de compte
- Les comptes existants avec des crédits restants conservent leur solde actuel (pas de rétroaction)

### User Story

**US-V2-01 — Découvrir Versimo avec 2 photos gratuites (Léa, Claire, Thomas)**
- Given : Un nouvel utilisateur crée un compte
- When : Son compte est initialisé
- Then : Il dispose de 2 crédits gratuits
- Critère : 2 crédits suffisent pour tester 2 styles sur la même photo OU 1 style sur 2 photos différentes

### Impact sur la démonstration de valeur
- 2 photos = suffisant pour voir la qualité du pipeline 2 passes et comparer avant/après
- La sélection multi-styles (Changement 3) compense : l'utilisateur peut comparer 2 styles en 2 crédits
- Si conversion trop basse, on pourra remonter à 3 (A/B testable)

### Fichiers CODE à modifier

| Fichier | Modification |
|---|---|
| `app/page.tsx` | Chercher toute mention de "3 visuels" ou "3 photos" → remplacer par "2" |
| `app/pricing/page.tsx` | Tier Découverte : "3 générations" → "2 générations" |
| `app/particulier/page.tsx` | Section gratuit : "3" → "2" |
| `app/architecte/page.tsx` | Section gratuit : "3" → "2" |
| `app/marchand/page.tsx` | Section gratuit : "3" → "2" |
| `app/comparatif/page.tsx` | Colonne Découverte : "3" → "2" |
| `lib/credits.ts` ou équivalent | Constante `FREE_CREDITS = 3` → `FREE_CREDITS = 2` |
| `app/api/generate/route.ts` | Si le rate limit gratuit est hardcodé à 3, passer à 2 |

### Fichiers DOCS à modifier

| Fichier | Modification |
|---|---|
| `docs/product/pricing-strategy.md` | Tier Découverte : "3 générations offertes" → "2 générations offertes", justification mise à jour |
| `docs/product/functional-specs.md` | Toute mention de "3 générations gratuites" → "2" |
| `docs/legal/cgu-draft.md` | Article 4 : "3 Générations" → "2 Générations" dans le tier Découverte |
| `CLAUDE.md` | Section Pricing si mentionné |

---

## Changement 2 — Compte obligatoire avant génération

### Contexte
Actuellement, un utilisateur peut générer sans compte. Problèmes : pas de tracking des crédits consommés, pas de capture email pour le funnel, pas de galerie persistante. La création de compte doit être requise AVANT la première génération.

### Spec fonctionnelle

**Flow actuel** : Upload → Style → Clic Générer → Génération se lance
**Nouveau flow** : Upload → Style → Clic Générer → **AuthModal s'ouvre** → Création compte (ou connexion) → Génération se lance automatiquement

### User Stories

**US-V2-02 — Créer mon compte au moment de générer (Léa)**
- Given : Léa a uploadé une photo et sélectionné un style, elle n'est pas connectée
- When : Elle clique sur "Générer"
- Then : Le AuthModal s'ouvre avec le message "Créez votre compte gratuit pour générer votre premier visuel"
- And : Après inscription/connexion réussie, la génération se lance automatiquement (sans recliquer)
- Critère : Léa ne perd PAS sa photo uploadée ni son style sélectionné pendant l'inscription

**US-V2-03 — Me connecter si j'ai déjà un compte (Thomas)**
- Given : Thomas a déjà un compte mais n'est pas connecté
- When : Il clique sur "Générer"
- Then : Le AuthModal s'ouvre avec l'onglet connexion
- And : Après connexion, la génération se lance avec ses crédits existants
- Critère : Le compteur de crédits s'affiche immédiatement après connexion

**US-V2-04 — Générer directement si déjà connecté (Claire)**
- Given : Claire est déjà connectée
- When : Elle clique sur "Générer"
- Then : La génération se lance immédiatement (pas de modal)
- Critère : Aucune friction supplémentaire pour les utilisateurs connectés

### Edge cases

1. **Inscription échouée** (email déjà pris, erreur réseau) : le AuthModal affiche l'erreur, la photo et le style restent en place
2. **Fermeture du modal sans s'inscrire** : retour à l'état précédent (photo + style conservés), pas de génération
3. **OAuth (Google)** : même flow — après callback OAuth, la génération se lance
4. **Multi-photos** : les photos uploadées + styles per-photo sont conservés dans le state React pendant l'inscription

### Fichiers CODE à modifier

| Fichier | Modification |
|---|---|
| `app/page.tsx` | Dans `handleGenerate()` : ajouter un check `if (!session) { setPendingGeneration(true); setShowAuthModal(true); return; }`. Après auth success (callback), si `pendingGeneration === true`, relancer `handleGenerate()` |
| `components/AuthModal.tsx` | Ajouter une prop `onAuthSuccess?: () => void` callback appelé après inscription/connexion réussie |
| `app/page.tsx` | Le AuthModal reçoit `onAuthSuccess={() => { if (pendingGeneration) handleGenerate(); }}` |
| `app/page.tsx` | Nouveau state : `const [pendingGeneration, setPendingGeneration] = useState(false)` |

### Fichiers DOCS à modifier

| Fichier | Modification |
|---|---|
| `docs/product/functional-specs.md` | Ajouter la user story du flow inscription-avant-génération |
| `docs/ux/user-flows.md` | Mettre à jour le parcours utilisateur (étape AuthModal entre Style et Génération) |
| `CLAUDE.md` | Section "Parcours Utilisateur" : ajouter l'étape AuthModal |

---

## Changement 3 — Sélection multi-styles simultanée

### Contexte
Actuellement, on sélectionne 1 style par photo. Les pros (Claire, Thomas) veulent comparer plusieurs ambiances sur la même pièce pour présenter des options à leurs clients. Chaque style sélectionné consomme 1 crédit.

### Spec fonctionnelle

- **Avant** : Radio buttons dans StylePicker — 1 seul style sélectionnable
- **Après** : Checkboxes dans StylePicker — 1 à N styles sélectionnables simultanément
- Chaque style = 1 crédit. Compteur visible : "3 styles sélectionnés = 3 crédits"
- Les générations se lancent en parallèle (ou séquentiellement selon la charge)
- Les résultats s'affichent dans un carrousel/grille de comparaison

### User Stories

**US-V2-05 — Sélectionner plusieurs styles pour comparer (Claire)**
- Given : Claire a uploadé une photo de salon
- When : Elle clique sur Scandinave ET Japandi ET Contemporain dans le StylePicker
- Then : Les 3 styles sont cochés, un badge affiche "3 styles — 3 crédits"
- And : Au clic sur Générer, 3 générations se lancent
- And : Les 3 résultats s'affichent côte à côte dans un carrousel
- Critère : Claire peut comparer les 3 résultats dans le même écran sans scroller

**US-V2-06 — Voir le coût avant de générer (Thomas)**
- Given : Thomas a sélectionné 4 styles
- When : Il regarde le bouton Générer
- Then : Le bouton affiche "Générer (4 crédits)" au lieu de juste "Générer"
- And : Si ses crédits sont insuffisants, le bouton est désactivé avec message "X crédits nécessaires, Y disponibles — Recharger"
- Critère : Thomas ne peut JAMAIS lancer une génération sans crédits suffisants

**US-V2-07 — Désélectionner un style (Léa)**
- Given : Léa a sélectionné 3 styles
- When : Elle clique sur un style déjà sélectionné
- Then : Le style est désélectionné, le compteur passe à 2
- Critère : Au moins 1 style doit rester sélectionné pour que Générer soit actif

### UX détaillée

- StylePicker : checkboxes (carré coché) au lieu de radio (rond rempli)
- Indicateur de sélection : badge numéroté sur chaque carte style sélectionnée (1, 2, 3...)
- Compteur de crédits : sous le StylePicker, texte "X style(s) sélectionné(s) — X crédit(s)"
- Bouton Générer : "Générer (X crédits)" — dynamique
- Résultats : grille horizontale scrollable avec les N résultats, chacun avec son label de style
- Chaque résultat a son propre comparateur avant/après et ses boutons de partage/téléchargement

### Edge cases

1. **1 seul style sélectionné** : comportement identique à l'actuel (backward compatible)
2. **Crédits insuffisants** : bouton Générer désactivé + message clair
3. **Mode multi-photo + multi-style** : chaque photo × chaque style = N crédits. Ex : 2 photos × 3 styles = 6 crédits. Compteur doit refléter le total.
4. **Échec partiel** : si 2/3 générations réussissent et 1 échoue, afficher les 2 résultats + message d'erreur sur la 3e. Le crédit de la génération échouée est remboursé.
5. **Custom prompt + multi-styles** : le mode Custom compte comme 1 style. On peut sélectionner Custom + Scandinave + Japandi = 3 crédits.
6. **Itérations (F1)** : l'itération s'applique à UN résultat spécifique, pas à tous. Le bouton "Affiner" est sur chaque carte de résultat individuellement.

### Fichiers CODE à modifier

| Fichier | Modification |
|---|---|
| `components/StylePicker.tsx` | Radio → Checkboxes. State passe de `selectedStyle: string` à `selectedStyles: string[]`. Props onChange retourne un tableau |
| `app/page.tsx` | State `selectedStyle` → `selectedStyles: string[]`. `handleGenerate()` boucle sur chaque style et lance N générations. Résultats stockés dans un tableau |
| `app/page.tsx` | Bouton Générer : affiche "(X crédits)" dynamiquement |
| `app/page.tsx` | Section résultats : carrousel/grille au lieu d'un seul comparateur |
| `components/ImageComparator.tsx` | Pas de modification — instancié N fois (1 par résultat) |
| `app/api/generate/route.ts` | Pas de modification — appelé N fois côté client (1 appel par style) |

### Fichiers DOCS à modifier

| Fichier | Modification |
|---|---|
| `docs/product/functional-specs.md` | Ajouter les user stories multi-styles |
| `docs/ux/user-flows.md` | Mettre à jour le flow de sélection de style |
| `CLAUDE.md` | Section "Parcours Utilisateur" étape 2 : mentionner la sélection multiple |

---

## Résumé des impacts croisés

| Changement | Impact sur les autres |
|---|---|
| 2 crédits gratuits | Le multi-styles rend les 2 crédits plus stratégiques (2 styles sur 1 photo = test complet) |
| Compte obligatoire | Nécessaire pour le multi-styles (tracking des crédits consommés) |
| Multi-styles | Consomme plus de crédits → accélère la conversion vers Starter/Pro |

### Ordre d'implémentation recommandé

1. **Compte obligatoire** (Changement 2) — prérequis pour le tracking des crédits
2. **2 crédits gratuits** (Changement 1) — trivial, quelques constantes à changer
3. **Multi-styles** (Changement 3) — le plus complexe, nécessite refactor du StylePicker + résultats

---

**Handoff → @fullstack**
- Fichiers produits : `docs/product/product-changes-v2.md`
- Décisions prises : 3 changements spécifiés avec user stories, edge cases, fichiers à modifier
- Points d'attention : le Changement 2 (compte obligatoire) est un prérequis du Changement 3 (multi-styles). Le Changement 1 (2 crédits) est indépendant et trivial.
