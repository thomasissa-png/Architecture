# Changements Produit v2 — Versimo

> Produit par @product-manager — 2026-03-31
> Demande fondateur : 3 modifications produit à implémenter
> Révisé : 2026-03-31 — vérification cohérence docs existants (pricing-strategy.md, cgu-draft.md, functional-specs.md)

---

## Changement 1 — Crédits gratuits : 3 → 2

### Contexte
Le coût API par génération est ~0,10-0,20€ (2 passes OpenAI). À 3 crédits gratuits par compte, le coût d'acquisition par nouveau compte est ~0,30-0,60€. Réduire à 2 diminue ce coût de 33%.

### Spec fonctionnelle

- **Avant** : 3 générations offertes à l'inscription (one-time)
- **Après** : 2 générations offertes à l'inscription (one-time)
- Le compteur de crédits gratuits affiche "2 crédits restants" à la création de compte
- Les comptes existants avec des crédits restants conservent leur solde actuel (pas de rétroaction)
- Les comptes Découverte existants qui ont déjà consommé leurs 3 crédits ne sont pas affectés

### User Stories

**US-V2-01a — Découvrir Versimo avec 2 crédits gratuits (Léa)**
- Given : Léa crée un compte Versimo pour la première fois
- When : Son compte est initialisé
- Then : Son compteur affiche "2 crédits gratuits"
- Critère : Elle peut tester 2 styles différents sur son salon OU 1 style sur 2 photos de son appartement — suffisant pour comparer avant/après sur chaque photo

**US-V2-01b — Évaluer Versimo avant d'investir (Thomas)**
- Given : Thomas entend parler de Versimo et crée un compte pour évaluer avant d'acheter un pack Starter
- When : Son compte est initialisé
- Then : Il dispose de 2 crédits gratuits pour tester le pipeline 2 passes sur une photo de bien
- Critère : Thomas peut générer 1 photo × 1 style + 1 photo × 1 autre style — suffisant pour juger la qualité et décider d'acheter Starter ou Pro

**US-V2-01c — Tester une direction esthétique avant RDV client (Claire)**
- Given : Claire teste Versimo sur un projet avant d'envisager un abonnement Pro
- When : Son compte est créé
- Then : Elle a 2 crédits pour générer 2 ambiances différentes sur la même photo de chantier
- Critère : Avec le multi-styles (Changement 3), Claire peut sélectionner Scandinave + Japandi = 2 crédits consommés en une seule génération — démonstration complète du pipeline en 1 clic

### Impact sur la démonstration de valeur
- 2 crédits = suffisant pour voir la qualité du pipeline 2 passes et comparer 2 ambiances avant/après
- La sélection multi-styles (Changement 3) compense : l'utilisateur peut comparer 2 styles en 2 crédits en une seule opération
- Si conversion trop basse, on pourra remonter à 3 (A/B testable — la constante `FREE_CREDITS` est le seul point de changement)
- Note économique : 2 crédits × 0,10€ = 0,20€ de coût d'acquisition maximum par compte, contre 0,30€ précédemment

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

| Fichier | Sections concernées | Modification |
|---|---|---|
| `docs/product/pricing-strategy.md` | Section 2 Tier Découverte, Section 5 unit economics (coût Découverte), Section 7 tableau /pricing | "3 générations offertes" → "2 générations offertes" dans TOUTES les occurrences + justification mise à jour : "2 crédits = tester 2 ambiances multi-styles en une opération" |
| `docs/product/functional-specs.md` | Section F1.3 Règles métier | Vérifier et remplacer toute mention de "3 générations gratuites" → "2" |
| `docs/legal/cgu-draft.md` | Article 3.1 ("3 générations gratuites"), Article 4.2 tableau (colonne Découverte "3 générations"), Article 4.4 tableau (même ligne) | Remplacer "3 générations" par "2 générations" dans ces 3 occurrences |
| `CLAUDE.md` | Section Pricing du contexte produit si mentionné | Vérifier et corriger |

> ⚠️ Incohérence détectée dans les docs existants : `pricing-strategy.md` contient une justification de 3 crédits basée sur l'argument "En dessous de 3, la démonstration de valeur est insuffisante" (section 2, Tier Découverte). Cette justification est OBSOLETE avec le Changement 3 (multi-styles). Lors de la mise à jour, remplacer par : "2 crédits = démonstration complète avec le multi-styles. 2 styles sur la même photo = 2 crédits. La valeur du pipeline est visible en une opération."

---

## Changement 2 — Compte obligatoire avant génération

### Contexte
Actuellement, un utilisateur peut générer sans compte. Problèmes : pas de tracking des crédits consommés, pas de capture email pour le funnel, pas de galerie persistante. La création de compte doit être requise AVANT la première génération.

### Spec fonctionnelle

**Flow actuel** : Upload → Style → Clic Générer → Génération se lance
**Nouveau flow** : Upload → Style → Clic Générer → **AuthModal s'ouvre si non connecté** → Création compte (ou connexion) → Génération se lance automatiquement

#### États du bouton Générer
- **Non connecté** : clic → ouvre AuthModal (pas de génération)
- **Connecté, crédits > 0** : clic → génération immédiate
- **Connecté, crédits = 0** : clic → modal d'upsell vers Starter/Pro (pas l'AuthModal)

#### Ce que le state React doit préserver pendant l'inscription
- Photos uploadées (tableau de File objects ou URLs blob)
- Style(s) sélectionné(s) — tableau string[] après Changement 3
- Type de pièce sélectionné (si F2 en place)
- Prompt custom (si mode Custom)

### User Stories

**US-V2-02 — Créer mon compte au moment de générer (Léa)**
- Given : Léa a uploadé une photo de son salon et sélectionné le style Scandinave, elle n'est pas connectée
- When : Elle clique sur "Générer"
- Then : Le AuthModal s'ouvre avec le message "Créez votre compte gratuit pour générer votre premier visuel — 2 générations offertes"
- And : Après inscription réussie, la génération se lance automatiquement sans que Léa reclique
- And : Son compteur affiche "2 crédits" et le premier est immédiatement consommé par la génération en cours
- Critère : Léa ne perd PAS sa photo uploadée, son style sélectionné, ni aucun autre élément de contexte pendant l'inscription

**US-V2-03 — Me connecter si j'ai déjà un compte (Thomas)**
- Given : Thomas a déjà un compte Pro actif mais n'est pas connecté sur la session en cours
- When : Il clique sur "Générer" après avoir uploadé 3 photos et sélectionné le style Haussmannien
- Then : Le AuthModal s'ouvre avec l'onglet connexion par défaut (pas inscription)
- And : Après connexion, la génération se lance avec ses crédits Pro existants
- And : Son solde Pro s'affiche immédiatement dans le header
- Critère : Thomas ne perd aucune de ses 3 photos ni sa sélection de style pendant la connexion

**US-V2-04 — Générer directement si déjà connecté (Claire)**
- Given : Claire est connectée à son compte Starter
- When : Elle clique sur "Générer" après avoir uploadé une photo de chantier
- Then : La génération se lance immédiatement sans aucun modal intermédiaire
- Critère : Zéro friction supplémentaire pour les utilisateurs connectés — comportement identique à l'actuel pour eux

**US-V2-05 — Voir quel onglet s'ouvre selon le contexte (Léa, retour)**
- Given : Léa a déjà un compte Découverte (créé hier) mais n'est pas connectée
- When : Elle clique sur "Générer"
- Then : Le AuthModal s'ouvre sur l'onglet "Connexion" en priorité (pas "Inscription") car un email est détectable dans le localStorage ou via suggestion browser
- And : Un lien "Pas encore de compte ? Créer un compte" est disponible si besoin
- Critère : L'onglet par défaut est "Connexion" si le localStorage contient un email précédemment saisi, "Inscription" sinon

### Edge cases

1. **Inscription échouée — email déjà pris** : le AuthModal reste ouvert, affiche "Cet email est déjà utilisé — connectez-vous ou réinitialisez votre mot de passe". La photo et le style sont intacts. Le lien "Se connecter" bascule sur l'onglet connexion sans perdre l'email pré-rempli.
2. **Inscription échouée — erreur réseau** : AuthModal reste ouvert, message "Erreur de connexion — réessayez". Bouton "Réessayer" sans refermer le modal. Photo et style intacts.
3. **Fermeture du modal (croix ou clic hors modal)** : AuthModal se ferme, retour à l'état exact avant le clic Générer (photo + style + type de pièce + prompt custom conservés). Pas de génération. Bouton Générer redevient actif.
4. **OAuth Google — redirect** : si OAuth entraîne un redirect de page (comportement Next.js Auth), le state React est perdu. Solution : avant de lancer le redirect OAuth, sérialiser le state complet dans le sessionStorage (`versimo_pending_state`). Après le callback OAuth, lire et restaurer ce state, puis déclencher la génération.
5. **OAuth Google — popup** : si OAuth s'ouvre en popup (option Next.js Auth), pas de redirect = pas de perte de state. Après fermeture de la popup et callback, déclencher la génération normalement.
6. **Multi-photos avec state complexe** : si l'utilisateur a 3 photos uploadées + 2 styles sélectionnés (Changement 3), TOUT ce state est sérialisé dans `pendingGenerationState` avant l'AuthModal. Après auth, le state est restauré intégralement avant de relancer `handleGenerate()`.
7. **Timeout d'inscription (>30s sans réponse serveur)** : le AuthModal affiche "La création de compte prend du temps — si le problème persiste, contactez contact@versimo.fr". Photo et style intacts.
8. **Compte créé mais crédits non initialisés (race condition)** : la génération qui se lance post-inscription vérifie le solde. Si solde = 0 malgré inscription réussie, afficher "Vos crédits sont en cours d'activation — réessayez dans quelques secondes" avec retry automatique × 3.
9. **Mobile — AuthModal sur petit écran** : le modal est full-screen sur mobile (< 640px) pour éviter le clavier qui masque les champs. Scroll interne si le contenu dépasse la hauteur visible.
10. **Session expirée pendant utilisation** : si la session expire pendant que l'utilisateur travaille (token JWT périmé), le clic sur Générer affiche l'AuthModal avec message "Votre session a expiré — reconnectez-vous". L'état de travail (photos + styles) est préservé.

### Fichiers CODE à modifier

| Fichier | Modification |
|---|---|
| `app/page.tsx` | Dans `handleGenerate()` : ajouter check `if (!session) { serializePendingState(); setPendingGeneration(true); setShowAuthModal(true); return; }` |
| `app/page.tsx` | Nouveau state : `const [pendingGeneration, setPendingGeneration] = useState(false)` |
| `app/page.tsx` | Nouvelle fonction `serializePendingState()` : écrit photos+styles+roomType+customPrompt dans sessionStorage clé `versimo_pending_state` |
| `app/page.tsx` | Nouvelle fonction `restorePendingState()` : lit sessionStorage, restaure le state React, efface la clé |
| `app/page.tsx` | `handleGenerate()` appelé automatiquement après auth success si `pendingGeneration === true` (via `useEffect` sur `session` + `pendingGeneration`) |
| `components/AuthModal.tsx` | Ajouter prop `onAuthSuccess?: () => void` — callback déclenché après inscription ou connexion réussie |
| `components/AuthModal.tsx` | Ajouter prop `defaultTab?: 'signin' \| 'signup'` — déterminé par présence d'email dans localStorage |
| `app/api/auth/callback/route.ts` | Après callback OAuth : lire `versimo_pending_state` depuis sessionStorage côté client (via redirect vers une page intermédiaire qui restaure le state) |

### Fichiers DOCS à modifier

| Fichier | Sections concernées | Modification |
|---|---|---|
| `docs/product/functional-specs.md` | Ajouter section F6 — Authentification obligatoire avant génération | Ajouter les user stories US-V2-02 à US-V2-05 et les edge cases |
| `docs/ux/user-flows.md` | Parcours principal (Upload → Style → Générer) | Ajouter l'étape "AuthModal si non connecté" entre Style et Génération, avec branche "déjà connecté → génération directe" |
| `docs/legal/cgu-draft.md` | Article 3.1 ("sans nécessité de créer un compte") | ⚠️ INCOHÉRENCE : l'article 3.1 dit actuellement "sans nécessité de créer un compte ni de fournir des coordonnées bancaires". Avec le Changement 2, ce n'est plus exact. Remplacer par : "La création d'un compte gratuit est requise pour lancer la génération. L'inscription est gratuite, sans carte bancaire. 2 générations sont offertes à l'inscription." |
| `CLAUDE.md` | Section "Parcours Utilisateur (3 étapes)" | Ajouter l'étape AuthModal : "Upload → Style → **[Si non connecté : Inscription/Connexion]** → Générer → Résultat" |

> ⚠️ Incohérence détectée dans les docs existants : `docs/legal/cgu-draft.md` Article 3.1 et Article 3.2 sont en contradiction directe avec ce changement. Article 3.1 : "sans nécessité de créer un compte" — à corriger. Article 3.2 : "[FONCTIONNALITE EN COURS DE DEVELOPPEMENT]" — à retirer (la feature est maintenant spécifiée). Ces 2 modifications CGU sont bloquantes avant ouverture des inscriptions.

---

## Changement 3 — Sélection multi-styles simultanée

### Contexte
Actuellement, on sélectionne 1 style par photo. Les pros (Claire, Thomas) veulent comparer plusieurs ambiances sur la même pièce pour présenter des options à leurs clients. Chaque style sélectionné consomme 1 crédit.

### Spec fonctionnelle

- **Avant** : Radio buttons dans StylePicker — 1 seul style sélectionnable
- **Après** : Checkboxes dans StylePicker — 1 à N styles sélectionnables simultanément
- Chaque style = 1 crédit. Compteur visible : "3 styles sélectionnés = 3 crédits"
- Les générations se lancent en parallèle avec `Promise.allSettled` (max 3 concurrentes — cohérent avec la limite existante dans route.ts)
- Les résultats s'affichent dans une grille de comparaison (1 carte par style, label en dessous)
- Comportement backward compatible : 1 style sélectionné = comportement identique à l'actuel

#### Contrainte de parallélisme
La limite de concurrence existante dans `app/api/generate/route.ts` est de 2 requêtes simultanées par IP (rate limit). Avec le multi-styles côté client, si l'utilisateur lance 5 styles en parallèle, les appels côté serveur sont indépendants et le rate limiter les verra comme 5 requêtes consécutives rapides. Solution : la file d'attente côté client limite à **2 générations simultanées maximum**, les autres attendent en queue avec indicateur de progression ("3/5 — Style Japandi en attente...").

### User Stories

**US-V2-06 — Sélectionner plusieurs styles pour comparer (Claire)**
- Given : Claire a uploadé une photo de salon d'un appartement en cours de rénovation et est connectée à son compte Pro
- When : Elle clique sur Scandinave ET Japandi ET Contemporain dans le StylePicker
- Then : Les 3 styles sont cochés, un compteur affiche "3 styles sélectionnés — 3 crédits"
- And : Au clic sur Générer, 3 générations se lancent (2 en parallèle, 1 en attente)
- And : Les 3 résultats s'affichent en grille avec le label du style sous chaque comparateur
- Critère : Claire peut voir les 3 ambiances dans la même vue sans changer de page, et envoyer les 3 liens par email à son client pour qu'il choisisse

**US-V2-07 — Voir le coût total avant de générer (Thomas)**
- Given : Thomas a uploadé 1 photo d'un appartement à rénover et sélectionné 4 styles (Contemporain, Haussmannien, Mid-Century, Industriel) pour ses plaquettes
- When : Il regarde le bouton Générer
- Then : Le bouton affiche "Générer — 4 crédits"
- And : Son solde affiché dans le header montre "32 crédits restants → 28 après génération"
- And : Si ses crédits tombent à 0 en cours de route (ex : 2 générations réussies, plus de crédits pour les 2 suivantes), les 2 générations restantes sont annulées avec message "Crédits insuffisants pour terminer — 2/4 styles générés. Rechargez pour continuer."
- Critère : Thomas ne peut JAMAIS lancer une génération sans crédits suffisants POUR L'ENSEMBLE de la sélection — le bouton est désactivé si crédits < nombre de styles sélectionnés

**US-V2-08 — Désélectionner un style (Léa)**
- Given : Léa a sélectionné 3 styles (Scandinave, Cosy, Bohème) avec ses 2 crédits gratuits
- When : Elle réalise qu'elle n'a que 2 crédits et clique sur Bohème pour le désélectionner
- Then : Bohème est désélectionné, le compteur passe à "2 styles — 2 crédits"
- And : Le bouton Générer redevient actif (2 crédits disponibles = 2 crédits requis)
- Critère : Au moins 1 style doit rester sélectionné pour que Générer soit actif. Désélectionner le dernier style restant est impossible (la checkbox du dernier style actif est non-décoché — curseur interdit + tooltip "Au moins 1 style requis").

**US-V2-09 — Générer plusieurs styles en Mode Pro batch (Thomas)**
- Given : Thomas est en Mode Pro, a uploadé 5 photos d'un appartement et sélectionné 2 styles (Contemporain + Haussmannien)
- When : Il clique sur Générer
- Then : 5 × 2 = 10 crédits sont consommés, 10 générations se lancent en file (2 concurrentes max)
- And : Une barre de progression globale affiche "3/10 générations terminées"
- And : Chaque photo terminée s'affiche dans la grille au fur et à mesure (pas d'attente du lot complet)
- Critère : Le compteur de crédits se décrémente en temps réel à chaque génération terminée

### UX détaillée

- StylePicker : checkboxes (carré coché) au lieu de radio (rond rempli)
- Indicateur de sélection : badge numéroté sur chaque carte style sélectionnée (1, 2, 3...)
- Compteur de crédits : sous le StylePicker, texte "X style(s) sélectionné(s) — X crédit(s) par photo"
- Si multi-photos : "Y photo(s) × X style(s) = Z crédits au total"
- Bouton Générer : "Générer — X crédits" (dynamique, calcul = nb_photos × nb_styles)
- Si crédits insuffisants : bouton désactivé, texte rouge "X crédits nécessaires, Y disponibles — [Recharger]"
- Résultats : grille scrollable horizontalement (desktop) / verticalement (mobile) avec les N résultats
- Chaque carte résultat : comparateur avant/après + label style + boutons télécharger/partager/affiner
- Ordre des cartes : ordre de sélection des styles (pas d'ordre alphabétique)
- Carte en cours de génération : squelette animé avec label style + spinner + "~45s"
- Carte échouée : fond grisé + icône erreur + "Génération échouée — [Réessayer ce style]" (1 crédit remboursé)

### Edge cases

1. **1 seul style sélectionné** : comportement identique à l'actuel — 1 comparateur, pas de grille. Backward compatible.
2. **Crédits insuffisants au moment du clic** : bouton Générer désactivé tant que nb_crédits_disponibles < nb_styles × nb_photos. Le calcul se met à jour en temps réel quand l'utilisateur coche/décoche des styles.
3. **Découverte (2 crédits gratuits) + 3 styles sélectionnés** : le bouton Générer est désactivé avec message "3 crédits nécessaires, 2 disponibles — Choisissez 2 styles max ou [Passez au Starter]". L'upsell est contextuel et naturel.
4. **Mode multi-photo + multi-style** : nb_crédits = nb_photos × nb_styles. Ex : 2 photos × 3 styles = 6 crédits. Le compteur calcule et affiche le total. Si une combinaison photo+style échoue, seul ce crédit est remboursé, les autres sont consommés.
5. **Échec partiel (ex : 2/3 générations réussissent)** : les 2 résultats réussis s'affichent normalement. La 3e carte affiche l'état erreur avec bouton "Réessayer ce style" (consomme 1 crédit supplémentaire) et le crédit de l'échec est remboursé automatiquement.
6. **Custom prompt + multi-styles** : le mode Custom compte comme 1 style. On peut sélectionner Custom + Scandinave + Japandi = 3 crédits. Le pre-processing GPT-4.1-mini s'applique au prompt Custom, les styles prédéfinis utilisent leurs prompts natifs.
7. **Custom seul (sans autre style)** : comportement identique au mode Custom actuel. Backward compatible.
8. **Itérations (F1) sur résultats multi-styles** : le bouton "Affiner" est présent sur CHAQUE carte de résultat individuellement. Affiner le résultat Scandinave ne consomme pas l'itération du résultat Japandi. Les compteurs d'itérations sont indépendants par résultat.
9. **Déselection en cours de génération** : une fois le clic Générer effectué et les générations lancées, la sélection est verrouillée (les checkboxes passent en disabled). Impossible de désélectionner un style dont la génération est en cours.
10. **Tous les styles sélectionnés (12 styles)** : edge case extrême — 12 crédits consommés, 12 générations en file (2 concurrentes × 6 batches). Afficher un avertissement avant lancement : "Vous allez lancer 12 générations (12 crédits). Confirmer ?" — modal de confirmation.
11. **Rechargement de page pendant génération** : les générations en cours sont perdues (state React non persisté). Message préventif dans l'UI : "Ne rechargez pas la page pendant la génération". Les crédits des générations non terminées sont remboursés via webhook serveur (si générations trackées en DB).
12. **Mobile — grille multi-résultats** : sur mobile (< 640px), la grille est verticale (1 résultat par ligne). Le scroll vertical long est compensé par un bouton flottant "Revenir en haut" après le 2e résultat.

### Fichiers CODE à modifier

| Fichier | Modification |
|---|---|
| `components/StylePicker.tsx` | Radio → Checkboxes. State passe de `selectedStyle: string` à `selectedStyles: string[]`. Props `onChange` retourne `string[]`. Prop `disabled?: boolean` pour verrouiller pendant génération |
| `app/page.tsx` | State `selectedStyle` → `selectedStyles: string[]`. Initialiser à `[]` (aucun style) ou `['scandinave']` (1 style par défaut — décision UX à confirmer) |
| `app/page.tsx` | `handleGenerate()` : boucle sur `selectedStyles`, lance N appels `fetch('/api/generate')` en queue de 2 concurrents max (avec `p-limit` ou implémentation manuelle) |
| `app/page.tsx` | State `results` : `GenerationResult[]` (tableau) au lieu d'un seul résultat. Interface `GenerationResult = { styleId: string; status: 'pending' \| 'loading' \| 'success' \| 'error'; outputImage?: string; errorMessage?: string }` |
| `app/page.tsx` | Bouton Générer : label dynamique `Générer — ${nbPhotos × selectedStyles.length} crédit(s)`. Désactivé si `userCredits < nbPhotos × selectedStyles.length \|\| selectedStyles.length === 0` |
| `app/page.tsx` | Section résultats : map sur `results[]`, instancie 1 `<ImageComparator>` par résultat réussi, 1 skeleton par résultat en cours, 1 carte erreur par résultat échoué |
| `components/ImageComparator.tsx` | Ajouter prop `styleLabel: string` pour afficher le nom du style sous le comparateur. Pas de modification fonctionnelle. |
| `app/api/generate/route.ts` | Pas de modification — appelé N fois côté client (1 appel par style par photo) |

### Fichiers DOCS à modifier

| Fichier | Sections concernées | Modification |
|---|---|---|
| `docs/product/functional-specs.md` | Ajouter section F7 — Sélection multi-styles | Ajouter US-V2-06 à US-V2-09, edge cases, wireframes ASCII |
| `docs/ux/user-flows.md` | Étape 2 — Sélection de style | Mettre à jour : radio → checkboxes, compteur de crédits, grille de résultats |
| `CLAUDE.md` | Section "Parcours Utilisateur (3 étapes)" étape 2 | Mentionner : "Choix parmi 12 styles (sélection multiple possible — 1 crédit par style)" |

> ⚠️ Incohérence détectée dans les docs existants : `docs/product/functional-specs.md` section F1.3 Règles métier mentionne un tier "Business 79€" qui n'existe plus dans la v3 du pricing (3 tiers uniquement : Découverte, Starter, Pro). Cette ligne est obsolète : "Business (79€) = 5 itérations". À corriger lors de la mise à jour de functional-specs.md : remplacer par la grille actuelle (Découverte = 0, Starter = 1, Pro = 3).

---

## Résumé des impacts croisés

| Changement | Impact sur les autres |
|---|---|
| 2 crédits gratuits | Le multi-styles rend les 2 crédits plus stratégiques : 2 styles sur 1 photo = test complet en une opération. Sans multi-styles, 2 crédits serait insuffisant pour démontrer la valeur — avec multi-styles, c'est exactement le bon niveau. |
| Compte obligatoire | Prérequis strict du Changement 3 (tracking crédits multi-styles sans compte = impossible). Prérequis strict du Changement 1 (compteur crédits = requiert un compte). |
| Multi-styles | Consomme plus de crédits plus rapidement → accélère la conversion vers Starter/Pro. Augmente le coût d'acquisition si un Découverte utilise ses 2 crédits sur 2 styles simultanément (0,20€ au lieu de 0,10€ si 1 seul style). Ce coût reste acceptable. |

### Incohérences docs existants — récapitulatif pour @fullstack

Ces corrections sont à effectuer EN MÊME TEMPS que l'implémentation des 3 changements. Elles ne sont pas des changements produit mais des mises à jour de cohérence documentaire :

| Fichier | Incohérence | Correction |
|---|---|---|
| `docs/product/pricing-strategy.md` | Justification 3 crédits gratuits obsolète (section Tier Découverte) | Remplacer par justification 2 crédits + multi-styles |
| `docs/legal/cgu-draft.md` | Article 3.1 : "sans nécessité de créer un compte" | Remplacer : compte requis, gratuit, 2 générations offertes |
| `docs/legal/cgu-draft.md` | Article 3.2 : "[FONCTIONNALITE EN COURS DE DEVELOPPEMENT]" | Retirer ce tag, la feature est spécifiée |
| `docs/product/functional-specs.md` | F1.3 : tier "Business 79€ = 5 itérations" | Remplacer par grille actuelle : Découverte = 0, Starter = 1, Pro = 3 |

### Ordre d'implémentation recommandé

Ces 3 changements sont à implémenter dans cet ordre (dépendances strictes) :

1. **Compte obligatoire** (Changement 2) — prérequis pour les deux autres. Sans système d'auth, ni le compteur de crédits (Changement 1) ni le multi-styles avec décompte par crédit (Changement 3) ne fonctionnent.
2. **2 crédits gratuits** (Changement 1) — trivial une fois le système d'auth en place. Modifier `FREE_CREDITS = 2` dans la logique d'initialisation du compte + mettre à jour les pages marketing.
3. **Multi-styles** (Changement 3) — le plus complexe. Nécessite : auth en place (Changement 2), compteur crédits fonctionnel (Changement 1), refactor StylePicker, refactor résultats (tableau → grille), file d'attente de génération.

### Critères de go/no-go par changement

**Changement 1 (2 crédits) — go si :**
- [ ] `FREE_CREDITS = 2` en DB et code
- [ ] Toutes les pages marketing affichent "2 générations gratuites"
- [ ] Les 3 articles CGU modifiés (3.1, 4.2, 4.4)
- [ ] Les comptes existants non affectés (vérification script DB)

**Changement 2 (compte obligatoire) — go si :**
- [ ] `handleGenerate()` bloque si `!session` et ouvre AuthModal
- [ ] State complet préservé après inscription/connexion (photos + styles + roomType + customPrompt)
- [ ] OAuth Google testé (redirect via sessionStorage + restauration state)
- [ ] Article 3.1 CGU mis à jour
- [ ] Test E2E : nouvel utilisateur complète le parcours inscription → première génération sans perte de données

**Changement 3 (multi-styles) — go si :**
- [ ] StylePicker accepte N sélections simultanées
- [ ] Compteur crédits = nb_photos × nb_styles en temps réel
- [ ] Bouton Générer désactivé si crédits insuffisants
- [ ] File d'attente 2 concurrents max côté client
- [ ] Grille résultats affiche N cartes avec label style
- [ ] Échec partiel : crédit remboursé, autres résultats affichés
- [ ] Test E2E : Claire sélectionne 3 styles, génère, voit 3 résultats en grille

---

**Handoff → @fullstack**
- Fichiers produits : `docs/product/product-changes-v2.md`
- Décisions prises : 3 changements spécifiés avec user stories (3 personas couverts chacun), edge cases exhaustifs, fichiers à modifier, critères de go/no-go
- Points d'attention :
  1. Le Changement 2 (compte obligatoire) est un prérequis strict des Changements 1 et 3 — implémenter dans cet ordre
  2. L'OAuth Google nécessite une attention particulière : le redirect de page détruit le state React. La sérialisation dans sessionStorage est obligatoire avant le redirect.
  3. Le multi-styles avec file d'attente 2 concurrents respecte le rate limiter existant — ne pas augmenter la concurrence au-delà de 2 sans modifier le rate limiter serveur
  4. 4 incohérences documentaires à corriger simultanément (voir tableau "Incohérences docs existants")
  5. `functional-specs.md` section F1.3 contient une référence au tier "Business 79€" disparu — à corriger lors du passage en revue du fichier
