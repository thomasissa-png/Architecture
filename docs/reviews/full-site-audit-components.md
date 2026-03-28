# Audit UX — Batch 2 : Navigation & Mode Pro

**Date** : 2026-03-28
**Agent** : @ux
**Pricing de référence** : Découverte GRATUIT / Starter 9,90€ one-shot / Pro 29€/mois
**Personas** : Claire (architecte), Thomas (marchand de biens), Léa (particulière)

---

## 1. AuthButton — Score : 8.2/10

### Findings

**P0 — Aucun**

**P1**
- L'avatar cliquable n'a pas d'`aria-label` décrivant son état *avec le nom de l'utilisateur*. `aria-label="Menu utilisateur"` est générique — un lecteur d'écran ne sait pas quel compte est ouvert. Correction : `aria-label={`Menu de ${session.user.name || session.user.email}`}`.
- Échec Escape sur le dropdown : le menu s'ouvre/ferme par clic et se ferme au clic extérieur, mais la touche Escape ne le ferme pas. Un `keydown Escape → setMenuOpen(false)` est manquant (le focus trap est dans AuthModal, pas dans ce dropdown).
- Lien "Mes dossiers" (`/mes-dossiers`) : libellé non cohérent avec le renommage en "Dossiers de pré-commercialisation" (project-context.md 2026-03-27). Thomas voit "Mes dossiers" alors que la page s'appelle autrement. Aligner le label.

**P2**
- "Acheter des crédits" dans le menu pointe vers `/pricing`. Si l'utilisateur est déjà Pro, ce lien devrait pointer vers les packs de recharge (section `/pricing#recharge`) plutôt que la page d'offres complète. Risque de désorienter Thomas qui cherche juste à recharger.
- Le badge crédits `{credits} cr.` est masqué sur mobile (`hidden sm:inline`). Thomas utilise son iPhone 15 Pro — il ne voit pas son solde de crédits en header mobile. Envisager une version ultra-compacte visible à toutes tailles.
- `signOut()` sans option `callbackUrl` : déconnexion renvoie vers la page par défaut NextAuth. Forcer `signOut({ callbackUrl: "/" })` pour garantir le retour à l'accueil.

### Heuristiques Nielsen

| # | Heuristique | Statut | Note |
|---|---|---|---|
| H1 | Visibilité état système | PASS | Badge crédits + badge Pro/Gratuit visible |
| H2 | Correspondance monde réel | FAIL | "Mes dossiers" ne correspond pas au renommage produit |
| H3 | Contrôle et liberté | FAIL | Escape ne ferme pas le dropdown |
| H4 | Cohérence | PASS | Patterns dropdown standards |
| H5 | Prévention erreurs | PASS | Confirmation non requise pour déconnexion (action réversible) |
| H6 | Reconnaissance | PASS | Options visibles dans le dropdown |
| H7 | Flexibilité | PASS | Accès rapide aux sections clés |
| H8 | Minimalisme | PASS | 6 liens, hiérarchie claire |
| H9 | Gestion erreurs | PASS | Fallback "..." si crédits non chargés |
| H10 | Aide | N/A | — |

---

## 2. AuthModal — Score : 9.0/10

### Findings

**P0 — Aucun**

**P1**
- Le bouton "Mot de passe oublié ?" déclenche un `setError()` avec un message statique (`"Fonctionnalité bientôt disponible. Contactez-nous à contact@versiroom.fr"`). Ce comportement est trompeur : un bouton interactif qui simule une erreur plutôt qu'une action dédiée viole H9. Corriger avec un état distinct `forgotPasswordSent` ou désactiver visuellement le bouton avec un tooltip `title="Bientôt disponible"` et `disabled` + style `cursor-not-allowed`.
- Le sous-titre mode inscription est `"Gratuit — 3 générations offertes sans CB."` — cohérent avec le pricing v3 (Découverte GRATUIT). Vérifier que la limite de 3 générations gratuites est bien appliquée côté API, sinon le message est inexact.

**P2**
- `focus()` déclenché via `setTimeout(..., 100)` : hack fragile sur les appareils lents. Remplacer par `requestAnimationFrame` ou l'attribut `autoFocus` sur le premier input.
- Le champ "Prénom (optionnel)" n'est visible qu'en mode inscription et n'a pas de `id` + `htmlFor` associé à son label (pas de label explicite — placeholder seulement). Ajouter `<label htmlFor="auth-name">Prénom</label>` pour conformité WCAG.
- La fenêtre modale est `bottom-anchored` sur mobile (slide depuis le bas) et `centered` sur desktop — pattern correct. Mais l'animation `fadeInUp 300ms` sur mobile peut être perturbante si l'utilisateur a `prefers-reduced-motion: reduce` activé. Ajouter `@media (prefers-reduced-motion: reduce) { animation: none }`.

### Heuristiques Nielsen

| # | Heuristique | Statut | Note |
|---|---|---|---|
| H1 | Visibilité état système | PASS | Spinner loading, messages erreur/succès |
| H2 | Correspondance monde réel | PASS | Vocabulaire clair, pas de jargon technique |
| H3 | Contrôle et liberté | PASS | Fermeture X, clic backdrop, Escape |
| H4 | Cohérence | PASS | Styles identiques aux autres inputs |
| H5 | Prévention erreurs | PASS | Validation longueur mdp en temps réel |
| H6 | Reconnaissance | PASS | Email 409 → bascule auto sur login |
| H7 | Flexibilité | PASS | Google OAuth + email/mdp |
| H8 | Minimalisme | PASS | Formulaire épuré, pas de champs superflus |
| H9 | Gestion erreurs | FAIL | Bouton "Mot de passe oublié" simule une erreur |
| H10 | Aide | PASS | Messages contextuels par type d'erreur |

---

## 3. ProGate — Score : 7.8/10

### Findings

**P0 — Aucun**

**P1**
- La ProGate affiche un mini-header Versiroom avec lien "Retour" mais **sans le composant `AuthButton`**. Si un utilisateur non connecté arrive sur une page Pro, il voit le header minimaliste sans possibilité de se connecter. Il doit cliquer "Retour" vers la page principale pour s'authentifier. Ajouter `<AuthButton />` dans le header de la ProGate pour permettre la connexion directement depuis le mur de paiement.
- Le CTA "Découvrir les offres Pro" pointe vers `/#pricing`. Sur mobile, ce lien ne scrolle pas toujours correctement vers la section pricing (comportement `#anchor` variable selon le SSR/CSR). Vérifier que la section pricing a bien l'`id="pricing"` et tester le scroll sur iOS Safari.
- Le texte "Pack Pro inclut" liste des features avec le libellé "Dossiers de présentation brandés" — le renommage officiel est "Dossiers de pré-commercialisation" (project-context.md 2026-03-27). Aligner.

**P2**
- Aucun prix affiché sur la ProGate. Un utilisateur bloqué ne sait pas combien coûte le Pro avant de cliquer. Ajouter le prix `29€/mois` sous le CTA ou dans la card des features. Exemple : `"Pro — 29€/mois · Résiliable à tout moment"`.
- "Rafraîchir la page" pour valider un accès Pro déjà activé : l'UX correcte serait de re-fetcher l'endpoint `/api/user/credits` sans reload. `window.location.reload()` est une solution de contournement brutale qui casse l'expérience sur les connexions lentes. Remplacer par un `re-fetch` + `setHasPro(true)` si la réponse confirme l'accès.
- État loading : spinner seul (`w-5 h-5`), pas de message. Un utilisateur sur connexion lente peut penser que la page est cassée. Ajouter un texte `"Vérification de votre accès…"` sous le spinner.

### Heuristiques Nielsen

| # | Heuristique | Statut | Note |
|---|---|---|---|
| H1 | Visibilité état système | FAIL | Loading sans message texte |
| H2 | Correspondance monde réel | FAIL | "Dossiers de présentation brandés" vs renommage produit |
| H3 | Contrôle et liberté | FAIL | Header sans AuthButton — impossible de se connecter directement |
| H4 | Cohérence | PASS | Design cohérent avec le reste |
| H5 | Prévention erreurs | PASS | N/A pour ce composant |
| H6 | Reconnaissance | PASS | Features listées clairement |
| H7 | Flexibilité | N/A | — |
| H8 | Minimalisme | PASS | Page épurée, focus sur l'upgrade |
| H9 | Gestion erreurs | FAIL | Reload brutal au lieu de re-fetch |
| H10 | Aide | FAIL | Prix absent — friction avant clic CTA |

---

## 4. MerchantMode — Score : 7.5/10

### Findings

**P0**
- **Accent manquant** : ligne 638, placeholder `"Ex : T3 renove avec vue"` — "renove" sans accent (`rénové`). Non conforme à la règle UTF-8 obligatoire (CLAUDE.md Règle n°13). Correction : `"Ex : T3 rénové avec vue"`.
- **Accent manquant** : ligne 660, label `"Nombre de pieces"` → `"Nombre de pièces"`.

**P1**
- Le flow démarre sur l'étape `"photos"` (ligne 64) mais le step indicator (s'il existe) doit le refléter. Si `currentStep === "photos"` est l'étape 1, l'étape "info" est l'étape 2 — mais le composant `DossierProgress` (non audité ici) doit recevoir le bon index. Vérifier la cohérence visuelle.
- La navigation entre étapes (`photos → annotate → style → review → generating → results`) n'a pas de bouton "Retour" systématique dans les étapes intermédiaires. Seule l'étape "info" en a un. Un utilisateur qui veut modifier son style après avoir été en "review" peut être bloqué si le bouton Retour manque à cette étape.
- L'ouverture automatique du dossier dans un nouvel onglet après génération (`window.open('/dossier/...', '_blank')`) est une action non sollicitée. Certains navigateurs bloquent les popups déclenchés programmatiquement (non suite à un clic direct utilisateur). Si bloqué, l'utilisateur ne sait pas où trouver son dossier. Remplacer par un CTA explicite "Voir le dossier" dans l'étape "results".
- Erreur 403 Mode Pro : le message `"Accès Pro requis. Contactez l'administrateur pour activer votre compte."` est incorrect — il n'y a pas d'administrateur à contacter, l'utilisateur doit souscrire au Pro. Corriger : `"Accès Pro requis — passez à l'offre Pro pour utiliser le Mode Pro."` avec un lien vers `/#pricing`.

**P2**
- Le label "Prix (€)" utilise `{"\u20AC"}` (ligne 674) au lieu du caractère UTF-8 direct `€`. Règle CLAUDE.md n°13 : utiliser les vrais caractères UTF-8. Idem ligne 685.
- Le `\u2014` (em-dash) ligne 499 devrait être le caractère `—` directement.
- Le composant charge les biens existants (`/api/properties`) même si l'utilisateur n'en a pas encore. Pas de gestion d'état vide : si `existingProperties` est vide, le bloc "Bien existant" est simplement masqué — c'est correct, mais le premier affichage charge inutilement l'API pour les nouveaux utilisateurs. Optimisation mineure : conditionner le fetch au fait que l'utilisateur ait au moins 1 bien (peut se vérifier côté API avec `?count=1`).
- L'input adresse n'a pas de `focus-visible:ring` déclaré, seulement `focus:border-foreground` (ligne 579). Sur navigation clavier, le focus ring est absent. Ajouter `focus-visible:ring-2 focus-visible:ring-sage/60`.

### Heuristiques Nielsen

| # | Heuristique | Statut | Note |
|---|---|---|---|
| H1 | Visibilité état système | PASS | Timer génération, status par photo |
| H2 | Correspondance monde réel | FAIL | Accents manquants, message erreur 403 inexact |
| H3 | Contrôle et liberté | FAIL | `window.open` automatique, retour manquant sur certaines étapes |
| H4 | Cohérence | PASS | Patterns inputs cohérents avec reste du projet |
| H5 | Prévention erreurs | PASS | Validation crédits avant génération |
| H6 | Reconnaissance | PASS | Quick select propriétés existantes |
| H7 | Flexibilité | PASS | Override style par photo + style global |
| H8 | Minimalisme | PASS | Enrichissement progressif, données optionnelles |
| H9 | Gestion erreurs | FAIL | Message 403 inexact + clipboard sans fallback UI |
| H10 | Aide | PASS | Placeholders informatifs, labels explicites |

---

## 5. ExportPortail — Score : 8.5/10

### Findings

**P0 — Aucun**

**P1**
- Le dropdown portail (`aria-haspopup="listbox"`) ne reçoit pas d'`aria-label`. Un lecteur d'écran lit juste "Choisir un portail, bouton, réduit". Ajouter `aria-label="Sélectionner le portail d'export"`.
- Le dropdown portail se ferme au clic sur une option mais **pas via Escape**. Ajouter un `useEffect` écoutant `keydown Escape → setDropdownOpen(false)` pour la navigation clavier.
- L'élément "Logic-Immo — bientôt" est un `<div>` avec `cursor-not-allowed` mais n'est pas un élément interactif accessible. Il ne peut pas recevoir le focus clavier. Remplacer par un `<button disabled>` avec `aria-disabled="true"` et `title="Disponible prochainement"`.

**P2**
- Pas de gestion de l'état "aucune photo disponible" dans la zone ZIP : `photos.length === 0` affiche `"Aucune photo disponible"` en texte simple, sans icône ni contexte. Si Thomas arrive sur l'export sans photos générées (cas d'erreur upstream), il ne comprend pas pourquoi. Ajouter : `"Les photos seront disponibles ici une fois la génération terminée."`.
- Le compteur de caractères passe en rouge à 95% (`counterColor`). Mais il n'y a pas de feedback ARIA pour les lecteurs d'écran quand le seuil est dépassé (`aria-live="polite"` manquant sur les compteurs). Ajouter sur le span compteur.
- `URL.revokeObjectURL(url)` (ligne 215) est appelé immédiatement après `a.click()`. Sur certains navigateurs (notamment Firefox), le revoke peut intervenir avant que le téléchargement soit initié. Envelopper dans un `setTimeout(() => URL.revokeObjectURL(url), 1000)`.

### Heuristiques Nielsen

| # | Heuristique | Statut | Note |
|---|---|---|---|
| H1 | Visibilité état système | PASS | "Préparation du ZIP…", compteurs caractères colorés |
| H2 | Correspondance monde réel | PASS | Labels portails reconnaissables |
| H3 | Contrôle et liberté | FAIL | Escape ne ferme pas le dropdown |
| H4 | Cohérence | PASS | Patterns boutons cohérents |
| H5 | Prévention erreurs | PASS | Avertissements titre tronqué, photos cappées |
| H6 | Reconnaissance | PASS | Preview texte avant copie |
| H7 | Flexibilité | PASS | Copie titre seul / description seule / tout |
| H8 | Minimalisme | PASS | Sections conditionnelles (structuredFields SeLoger seulement) |
| H9 | Gestion erreurs | PASS | "Copie échouée — sélectionnez le texte manuellement" |
| H10 | Aide | PASS | Notes portail, warnings inline |

---

## Synthèse et priorisation cross-composants

| Priorité | Composant | Finding | Action |
|---|---|---|---|
| P0 | MerchantMode | Accent manquant "renove" / "pieces" | Corriger les strings |
| P0 | MerchantMode | `\u20AC` et `\u2014` au lieu de caractères UTF-8 | Corriger les strings |
| P1 | AuthButton | Escape ne ferme pas le dropdown | Ajouter listener `keydown Escape` |
| P1 | AuthButton | "Mes dossiers" vs renommage produit | Mettre à jour le label |
| P1 | AuthModal | Bouton "Mot de passe oublié" simule une erreur | Remplacer par état dédié ou `disabled` |
| P1 | ProGate | Pas d'AuthButton dans le header de la gate | Ajouter `<AuthButton />` |
| P1 | ProGate | "Dossiers de présentation brandés" vs renommage | Aligner le libellé |
| P1 | ProGate | Prix absent de la page d'upgrade | Ajouter "29€/mois" sous le CTA |
| P1 | MerchantMode | `window.open` automatique après génération | Remplacer par CTA explicite |
| P1 | MerchantMode | Message erreur 403 inexact | Corriger avec lien vers `/#pricing` |
| P1 | ExportPortail | Escape ne ferme pas le dropdown | Ajouter listener `keydown Escape` |
| P1 | ExportPortail | "Logic-Immo" div non focusable | Remplacer par `<button disabled>` |
| P2 | AuthButton | Badge crédits masqué mobile | Afficher une version compacte |
| P2 | AuthModal | `setTimeout` focus → `requestAnimationFrame` | Robustesse mobile |
| P2 | AuthModal | `prefers-reduced-motion` non géré | Ajouter media query sur animation |
| P2 | ProGate | `window.location.reload()` brutal | Re-fetch `/api/user/credits` |
| P2 | MerchantMode | Input adresse sans `focus-visible:ring` | Ajouter ring clavier |
| P2 | ExportPortail | `URL.revokeObjectURL` trop immédiat | Wrapper dans `setTimeout` |

---

## Tests UX — Parcours Thomas (marchand de biens)

| Test | Critère de succès | Statut |
|---|---|---|
| Thomas peut se connecter depuis le modal sans quitter la page | Modal fermable, header visible | PASS |
| Thomas voit son solde de crédits sur mobile | Badge visible à 375px | FAIL — masqué mobile |
| Thomas accède au Mode Pro après connexion | ProGate disparaît si hasPro | PASS |
| Thomas comprend le prix avant de cliquer "Découvrir les offres Pro" | Prix visible sur ProGate | FAIL — prix absent |
| Thomas crée un dossier sans erreur de caractères | Labels corrects | FAIL — "renove", "pieces" sans accent |
| Thomas exporte son annonce LeBonCoin | ZIP téléchargé, texte copié | PASS |

---

**Handoff → @fullstack**
- Fichier produit : `/home/user/Architecture/docs/reviews/full-site-audit-components.md`
- Corrections P0 immédiates : accents `rénové`/`pièces` + remplacement `\u20AC`/`\u2014` dans MerchantMode.tsx
- Corrections P1 prioritaires : Escape dropdown (AuthButton + ExportPortail), AuthButton ARIA label, ProGate header + prix + libellé dossiers, MerchantMode message 403 + window.open → CTA, AuthModal mot de passe oublié
- Point d'attention : le renommage "Mode Marchand → Mode Pro" et "Dossiers PDF → Dossiers de pré-commercialisation" (project-context.md 2026-03-27) génère des incohérences dans ProGate et AuthButton — traiter en une seule passe de renommage global
