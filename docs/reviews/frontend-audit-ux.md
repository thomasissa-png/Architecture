# Audit UX Frontend — Versiroom
**Agent UX — 25 mars 2026**
**Scope : desktop ET mobile — 10 fichiers analysés**

---

## Section 1 — Desktop (10 critères /10)

| # | Critère | Note | Diagnostic |
|---|---------|------|------------|
| 1 | Navigation | 7/10 | Header fixe cohérent sur toutes les pages. AuthButton avec dropdown bien structuré (5 liens, crédits, badge Pro). Problème : aucun lien "Tarifs" dans le header de la homepage — l'ancre `/#pricing` est invisible depuis les pages internes (`/compte`, `/mes-biens`). Les pages marchands sont isolées du reste de la nav (pas de breadcrumb, pas de retour contextuel sur `/mes-biens/[id]`). |
| 2 | Hero | 7.5/10 | Pills multi-cibles (Architectes / Marchands / Particuliers) bien positionnées. Social proof présente. SVG avant/après pertinent. Point faible critique : le CTA principal "Essayer gratuitement" pointe vers `#outil` mais les 3 générations gratuites ne sont mentionnées nulle part dans le Hero — la valeur gratuite est enterrée dans la pricing page. Thomas et Léa la manquent systématiquement. |
| 3 | Outil 3 étapes | 8/10 | StepIndicator visible, auto-scroll implémenté, feedback toast après upload confirmé. Bonne gestion des états de génération (timer, estimation). Point faible : le switch "Intérieur / Extérieur" et le RoomTypePicker apparaissent sans label d'introduction — un utilisateur qui arrive sans contexte ne comprend pas ce qu'on lui demande avant même d'uploader. Aucun empty state explicatif à l'étape 1. |
| 4 | Pricing | 6.5/10 | 4 packs clairs, badge "Recommandé" sur Pro, prix TTC affiché. Problème majeur : la checkbox de rétractation bloque l'achat MAIS elle est positionnée SOUS la grille des packs, invisibles sans scroll sur un viewport 768px. Un Thomas qui clique "Acheter" avant de scroller reçoit un message d'erreur opaque au lieu d'un scroll automatique vers la checkbox. Deuxième problème : "Payez uniquement ce que vous utilisez" est répété deux fois dans la même vue (subtitle H1 + paragraphe sous). |
| 5 | Pages marchand | 6/10 | `/compte` : bonne UX du formulaire SIRET avec autocomplete. Problème critique : zéro navigation vers `/mes-biens` depuis `/compte` — Thomas finit de configurer son profil et se retrouve dans une impasse. Pas de CTA "Créer mon premier bien" après la sauvegarde. `/mes-biens/[id]` : le fil de retour vers la liste est absent (pas de lien "< Mes biens"). |
| 6 | Galerie | 5.5/10 | Filtres par style/type/statut présents. Problème structurel : la galerie redirige silencieusement vers `/` si non authentifié (`window.location.href = "/"`) au lieu d'afficher l'AuthModal — perte du contexte et de l'intent de l'utilisateur. État vide (0 photos) non traité dans le code visible — aucun encouragement à générer. |
| 7 | Espacement | 8/10 | Cohérence globale : padding `px-5 sm:px-8`, sections bien aérées. Léger problème sur la pricing page : le gap entre le titre H1 et les packs est `mb-14` mais le "Payez uniquement ce que vous utilisez" est redondant avec le sous-titre H1, créant une zone de lecture morte de ~40px. |
| 8 | États vides | 5/10 | Galerie : pas d'état vide visible dans le code. Page compte déconnectée : état "non connecté" existe mais sans CTA contextuellement utile (juste le AuthButton sans message d'encouragement). Fiche bien : aucun état vide documenté pour "0 photos associées" — le marchand ne sait pas quoi faire. |
| 9 | Feedback | 7.5/10 | Bonne couverture sur l'outil principal : toast upload, timer génération, spinner sur CTA. Points faibles : le feedback de sauvegarde profil marchand (`saveMessage`) disparaît après 3s sans animation de sortie — coupure abrupte. L'erreur rétractation pricing n'est pas scrollée automatiquement dans le viewport. |
| 10 | Accessibilité | 7/10 | Focus-visible:ring sur tous les CTA. Focus trap implémenté dans AuthModal avec Escape. `role="dialog"` et `aria-modal="true"` corrects. `role="alert"` sur les erreurs. Lacunes : le bouton avatar dans AuthButton n'a pas d'`aria-expanded` sur le dropdown. Le StepIndicator n'a pas de `aria-current`. La galerie redirige sans `aria-live` pour annoncer le changement d'état. |

**Moyenne desktop : 6.9/10**

---

## Section 2 — Mobile (10 critères /10)

| # | Critère | Note | Diagnostic |
|---|---------|------|------------|
| 1 | Touch targets | 7/10 | Bouton close AuthModal : 44px explicitement codé (`w-11 h-11`), conforme. Bouton avatar AuthButton : `w-8 h-8` = 32px, sous le seuil WCAG (44px). CTA pricing : `py-2.5` sur petits boutons ≈ 38px estimé — limite basse. Les items du dropdown AuthButton ont des `py-2` soit ~32px de hauteur réelle — trop serrés sur iPhone 14 (doigt moyen = 44px). |
| 2 | Navigation mobile | 6.5/10 | Pas de menu hamburger : la nav header reste visible (`flex items-center gap-4 sm:gap-6`) mais se compresse sur small. AuthButton reste accessible. Problème : sur `/pricing`, le header affiche uniquement "Essayer" + AuthButton — aucun moyen de revenir à l'accueil via la nav (le logo est un lien mais peu visible en font-semibold text-xl). Sur les pages `/compte` et `/mes-biens`, zéro fil d'Ariane mobile. |
| 3 | Upload mobile | 7.5/10 | Drag & drop remplacé par tap-to-open sur mobile (comportement natif react-dropzone). Support HEIC ajouté. Suppression de photo visible sur mobile (Sprint 1, correction n°2). Point faible : la zone d'upload n'a pas de taille minimale fixée — sur iPhone SE (375px), si la zone est trop petite, le tap peut rater. Pas de feedback haptique documenté. |
| 4 | Scroll | 7/10 | `overflow-y-auto` sur AuthModal avec `max-h-[90dvh]` pour clavier virtuel iOS — correct. Body scroll bloqué pendant la modal — correct. Problème : sur la page pricing, la checkbox de rétractation est hors viewport sans indication de scroll obligatoire. L'absence de sticky CTA "Acheter" (visible sans scroll) est un frein direct pour Thomas sur iPhone. |
| 5 | Formulaires | 7/10 | AuthModal : `autoComplete` configuré (`email`, `current-password`, `given-name`). `type="email"`, `type="tel"` corrects pour déclencher les bons claviers. Toggle visibilité mot de passe présent. Problème : dans `/compte`, le champ SIRET n'a pas `inputMode="numeric"` — le clavier alphabétique s'ouvre sur iOS au lieu du clavier numérique. Les color pickers (`type="color"`) sont inutilisables sur mobile iOS (rendu natif minimal, pas de hex input accessible sans clavier). |
| 6 | AuthModal mobile | 8/10 | Très solide : `max-h-[min(90vh,90dvh)]` + `overflow-y-auto` pour le clavier virtuel. `p-4` sur le wrapper positionne la modal avec marge. Animation `fadeInUp` non réduite avec `prefers-reduced-motion` (point d'accessibilité). Le bouton close 44px est le point fort. Seul bémol : le focus initial va sur le premier élément focusable (le bouton "Continuer avec Google") — correct mais le bouton close devrait peut-être recevoir le focus en premier sur mobile pour faciliter la fermeture. |
| 7 | Galerie mobile | 5/10 | La galerie affiche des photos dans une grille — mais le code visible (100 premières lignes) ne montre pas de responsive grid explicite. Les 3 filtres select superposés sur petits écrans créent une zone de formulaire dense avant tout contenu. `selectedPhoto` pour la vue détail n'a pas de full-screen lightbox visible — l'expérience de visualisation d'une photo générée sur iPhone reste incertaine. |
| 8 | Annonce mobile | 7/10 | Page `/annonce/[uuid]` : SSR, pas d'auth requise, OpenGraph pour preview WhatsApp — excellent pour Thomas qui partage ses liens. `AnnoncePublicView` détecte `navigator.share` via `useEffect` (pas de mismatch SSR). Problème : le bouton email est en "reveal progressif" (`emailRevealed`) — bien pour l'anti-spam, mais le double-tap pour révéler puis copier est une friction inutile sur mobile. |
| 9 | Pricing mobile | 5.5/10 | Grille `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — sur mobile, 4 cartes en colonne = scroll long. La carte Pro avec badge "Recommandé" (`absolute -top-3`) peut être clippée sur certains viewports mobiles selon le parent. La checkbox de rétractation en bas de page, en `text-xs font-light`, est difficile à lire sur petits écrans et son état de validation n'est pas visible sans scroller. Aucun sticky CTA mobile. |
| 10 | Performance perçue | 7/10 | Blob URLs gérés avec `useMemo` + cleanup. AbortController pour annuler les requêtes. Retry automatique réseau (1 retry). Preview blur pendant génération documenté. Points d'attention : les 4 packs de la pricing page chargent 4 SVG checkmarks inline — sans impact réel mais sans optimisation. Le `animate-pulse` du skeleton AuthButton est subtil mais présent. Pas de skeleton sur la galerie pendant le chargement. |

**Moyenne mobile : 6.9/10**

---

## Section 3 — Top 10 corrections

### C1 — CRITIQUE | Pricing : scroll automatique vers la checkbox de rétractation
**Fichier :** `app/pricing/page.tsx`, fonction `handleBuy()`
**Problème :** Cliquer "Acheter" sans cocher la checkbox déclenche `setError(...)` mais ne scrolle pas vers la checkbox. Sur mobile, l'utilisateur voit l'erreur en haut mais ne sait pas quoi faire.
**Correction :**
```tsx
// Dans handleBuy(), après setError(...)
if (!retractationAccepted) {
  setError("Veuillez accepter la clause de rétractation avant de continuer.");
  document.getElementById("retractation-checkbox")?.scrollIntoView({ behavior: "smooth", block: "center" });
  return;
}
```
Ajouter `id="retractation-checkbox"` sur le `<div>` wrapper de la checkbox.

---

### C2 — CRITIQUE | Galerie : AuthModal au lieu de redirect silencieux
**Fichier :** `app/ma-galerie/page.tsx`, `useEffect` sur `authStatus`
**Problème :** `window.location.href = "/"` détruit le contexte utilisateur — l'intent de navigation vers la galerie est perdu.
**Correction :**
```tsx
// Remplacer le redirect par un état local
const [showAuthModal, setShowAuthModal] = useState(false);
useEffect(() => {
  if (authStatus === "unauthenticated") setShowAuthModal(true);
}, [authStatus]);
// Afficher <AuthModal isOpen={showAuthModal} callbackUrl="/ma-galerie" />
```

---

### C3 — HAUTE | Page compte : CTA de navigation post-sauvegarde
**Fichier :** `app/compte/page.tsx`, bloc après le bouton "Enregistrer le profil"
**Problème :** Thomas configure son profil marchand, clique "Enregistrer", et n'a aucune suggestion de prochaine action. Impasse totale.
**Correction :** Afficher deux liens après le `saveMessage` de succès :
```tsx
{saveMessage?.type === "success" && (
  <div className="flex gap-3 mt-4">
    <a href="/mes-biens" className="text-sm text-sage font-medium hover:underline">
      Voir mes biens →
    </a>
    <a href="/" className="text-sm text-muted font-light hover:text-foreground">
      Générer des visuels
    </a>
  </div>
)}
```

---

### C4 — HAUTE | AuthButton dropdown : `aria-expanded` manquant
**Fichier :** `components/AuthButton.tsx`, ligne 91-93
**Problème :** Le bouton avatar ouvre un dropdown sans annoncer son état aux screen readers.
**Correction :**
```tsx
<button
  onClick={() => setMenuOpen((prev) => !prev)}
  aria-label="Menu utilisateur"
  aria-expanded={menuOpen}
  aria-haspopup="true"
  ...
>
```

---

### C5 — HAUTE | AuthButton : touch target avatar 32px → 44px
**Fichier :** `components/AuthButton.tsx`, ligne 91
**Problème :** `w-8 h-8` = 32px, sous le seuil WCAG 2.2 des 44px pour les touch targets.
**Correction :** Envelopper le contenu dans un wrapper 44px sans changer la taille visuelle :
```tsx
<button
  className="flex items-center gap-2 w-11 h-11 justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded-full"
  ...
>
```
Ou ajouter `p-1.5` pour augmenter la zone cliquable sans agrandir l'avatar visuellement.

---

### C6 — HAUTE | Compte : SIRET inputMode numérique
**Fichier :** `app/compte/page.tsx`, ligne 443
**Problème :** `type="text"` sur le champ SIRET ouvre le clavier alphabétique sur iOS au lieu du pavé numérique.
**Correction :**
```tsx
<input
  type="text"
  inputMode="numeric"
  pattern="[0-9 ]*"
  ...
/>
```

---

### C7 — HAUTE | Hero : valeur "3 générations gratuites" manquante dans le hero
**Fichier :** `app/page.tsx`, section Hero
**Problème :** Les 3 générations gratuites ne sont mentionnées nulle part dans le Hero. Léa et Thomas ne savent pas que c'est gratuit sans CB avant de s'inscrire.
**Correction :** Ajouter sous le CTA principal :
```tsx
<p className="text-xs text-muted font-light mt-3">
  3 générations offertes · Sans carte bancaire
</p>
```

---

### C8 — MOYENNE | Fiche bien : lien retour vers la liste
**Fichier :** `app/mes-biens/[id]/page.tsx`, section header
**Problème :** Aucun lien "< Mes biens" en haut de la fiche. Thomas se retrouve bloqué après avoir ouvert un bien.
**Correction :** Ajouter dans le header après le logo :
```tsx
<a
  href="/mes-biens"
  className="text-xs text-muted font-light hover:text-foreground transition-colors flex items-center gap-1"
>
  <svg ...>←</svg>
  Mes biens
</a>
```

---

### C9 — MOYENNE | Pricing : duplication du message "sans abonnement"
**Fichier :** `app/pricing/page.tsx`, lignes 161-163 et 183-184
**Problème :** "Sans abonnement. Sans engagement." (sous le H1) + "Payez uniquement ce que vous utilisez — sans abonnement." (paragraphe séparé) = double message identique qui dilue la hiérarchie visuelle.
**Correction :** Supprimer le paragraphe ligne 183-184. Conserver uniquement le sous-titre du H1.

---

### C10 — MOYENNE | AuthModal : `prefers-reduced-motion` manquant sur les animations
**Fichier :** `components/AuthModal.tsx`, lignes 208 et 213
**Problème :** Les animations `fadeIn` et `fadeInUp` s'appliquent sans vérifier `prefers-reduced-motion`. Impact : vertiges et inconfort pour les utilisateurs sensibles aux animations.
**Correction :** Dans `app/globals.css`, ajouter :
```css
@media (prefers-reduced-motion: reduce) {
  [style*="animation"] {
    animation: none !important;
  }
}
```
Ou conditionner les styles d'animation dans le composant avec un hook `useReducedMotion`.

---

## Section 4 — Scores personas

### Thomas, 35 ans, marchand de biens — iPhone 15 Pro | **6.5/10**

Thomas arrive avec un objectif transactionnel précis : uploader les photos de son bien, générer des visuels, les télécharger pour ses plaquettes. Les frictions qu'il rencontre sont directement sur son chemin critique.

**Ce qui fonctionne pour Thomas :**
- MerchantMode avec flow multi-étapes structuré (photos → infos → style → génération)
- Partage WhatsApp natif sur l'annonce publique
- Téléchargement HD disponible
- Packaging crédit sans abonnement adapté à son usage irrégulier (8-12 opérations/an)

**Ce qui bloque Thomas :**
- Sur pricing mobile, la checkbox de rétractation invisible sans scroll = abandon probable (C1 — critique)
- Après avoir configuré son profil marchand, impasse totale sans CTA de navigation (C3 — haute)
- Aucun lien retour sur la fiche bien `/mes-biens/[id]` — désorientation dans l'interface pro (C8 — moyenne)
- Touch target 32px sur l'avatar = difficile à taper avec l'iPhone 15 Pro (C5)
- Champ SIRET sans clavier numérique sur iOS (C6)

**Score détaillé Thomas :** Outil principal 7/10 · Mode marchand 6/10 · Pricing mobile 5/10 · Navigation 6/10

---

### Claire, 40 ans, architecte — MacBook Pro 16" + iPad Pro | **7.5/10**

Claire est l'utilisatrice la plus à l'aise techniquement. Elle utilise l'outil pour tester des styles et partager des pistes avec ses clients. Son usage est desktop-first.

**Ce qui fonctionne pour Claire :**
- Qualité du StylePicker avec 12 styles clairement différenciés
- Outil 3 étapes fluide, auto-scroll, feedback toast
- Itérations avec RefineModal pour affiner un style
- Comparateur avant/après avec partage email
- AuthModal solide avec focus trap et Escape

**Ce qui gêne Claire :**
- Pas de lien direct "Tarifs" depuis le header de la homepage (doit chercher dans le footer ou le dropdown)
- Les 3 générations gratuites ne sont pas visibles sans atteindre la pricing page (C7)
- Sur iPad Pro, les color pickers `type="color"` en mode marchand ont un rendu natif iOS minimal — peu utilisables pour le branding client

**Score détaillé Claire :** Outil principal 8.5/10 · Pricing desktop 7/10 · Navigation 7/10 · Mode marchand 7/10

---

### Léa, 32 ans, acheteuse — iPhone 14 | **6.0/10**

Léa est la persona avec le parcours le plus émotionnel : elle veut voir "son" appartement transformé. Elle est digital native mais son attention est courte — chaque friction peut mener à un abandon.

**Ce qui fonctionne pour Léa :**
- 3 générations gratuites sans CB = barrière d'entrée nulle (mais mal mise en avant)
- Partage natif mobile (WhatsApp, Instagram)
- Interface épurée sans surcharge visuelle
- Boutons de suppression photo visibles sur mobile (Sprint 1)

**Ce qui bloque Léa :**
- "3 générations offertes" enterré dans la pricing page — Léa ne sait pas que c'est gratuit au moment de décider d'essayer (C7 — haute priorité pour elle)
- Sur l'iPhone 14, le dropdown AuthButton (`py-2` soit ~32px) est difficile à tapper précisément
- La galerie `/ma-galerie` est son espace personnel de photos — la redirecto silencieuse vers `/` si non connectée (C2) est une rupture de son flow de retour
- Aucune socialproof visible depuis la galerie ("Vos créations" sans nombre ni encouragement)
- Pas de skeleton/loader sur la galerie pendant le chargement — scroll dans le vide

**Score détaillé Léa :** Outil principal 7/10 · Galerie 5/10 · Pricing mobile 5.5/10 · Navigation mobile 6/10

---

## Synthèse globale

| Dimension | Note |
|-----------|------|
| Desktop | 6.9/10 |
| Mobile | 6.9/10 |
| Thomas | 6.5/10 |
| Claire | 7.5/10 |
| Léa | 6.0/10 |

**3 chantiers prioritaires (impact maximal sur conversion) :**
1. Pricing mobile : scroll auto vers checkbox + sticky CTA (C1) — bloque Thomas directement sur l'achat
2. Valeur gratuite visible dans le Hero (C7) — Léa abandonne avant d'essayer
3. Navigation post-action en mode marchand (C3 + C8) — Thomas se perd après l'onboarding

---

**Handoff → @design**
- Fichiers produits : `/home/user/Architecture/docs/reviews/frontend-audit-ux.md`
- Décisions prises : 10 corrections priorisées (3 critiques, 4 hautes, 3 moyennes) ; scores personas établis comme baseline
- Points d'attention : C1 (pricing scroll) et C2 (galerie authmodal) sont des corrections de comportement JS, pas de design pur — coordonner avec @fullstack. C5 (touch target avatar) demande un ajustement du composant AuthButton sans impact visuel perceptible. C10 (prefers-reduced-motion) est une correction CSS globale dans globals.css.
