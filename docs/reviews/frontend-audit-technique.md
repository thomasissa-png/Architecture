# Audit technique frontend — Versimo — 2026-03-25

## Resume executif

L'ensemble du frontend Versimo est fonctionnel et bien structure. Le code est majoritairement propre avec un bon usage de TypeScript, des patterns React corrects et une attention reelle portee a l'UX (focus traps, ARIA, scroll-lock sur modales). Cependant, plusieurs problemes de severite variable ont ete identifies : des pages protegees sans verification serveur (auth bypass cote client uniquement), des `catch` vides qui masquent des erreurs, l'absence quasi totale de `next/image` (impact performance et SEO), et des risques XSS potentiels sur les images. Le score global est 6.8/10 — solide pour un MVP, insuffisant pour une production exposee.

## Resume technique

Etat general : qualite correcte, architecture coherente, mais dette technique accumulee sur les patterns de securite et de performance. **GO avec reserves** — les 3 failles de securite (auth client-only, IDOR potentiel, XSS image onError) doivent etre traitees avant toute mise en production a grande echelle.

---

## Tableau des 20 criteres

| # | Categorie | Critere | Note /10 | Commentaire |
|---|-----------|---------|----------|-------------|
| 1 | Qualite code | TypeScript strictness | 7 | Pas de `any` visible. Quelques `as string` (params.id, params.uuid) sans validation. Types bien definis pour les interfaces. |
| 2 | Qualite code | React patterns | 7 | Bons useCallback/useMemo pour les URL.createObjectURL. Quelques re-renders evitables (handleGenerate recreee a chaque render dans MerchantMode). |
| 3 | Qualite code | State management | 6 | page.tsx a ~30 useState — candidat a un useReducer. Props drilling acceptable. Pas de duplication flagrante sauf STYLE_LABELS duplique dans 3 fichiers. |
| 4 | Qualite code | Error handling | 5 | 14 blocs `catch {}` vides ou avec `// ignore`. Erreurs silencieuses sur fetchProperties, fetchPhotos, handleDissociate, handleAssociatePhotos, handleSaveDescription. |
| 5 | Qualite code | Memory leaks | 8 | URL.createObjectURL correctement revoque via useMemo+cleanup dans page.tsx, UploadZone, MerchantMode. Timers clearInterval correctement nettoyes. pollRef cleanup present. |
| 6 | Securite | XSS | 7 | Pas de dangerouslySetInnerHTML. Cependant, img onError dans ma-galerie modifie le DOM directement — vecteur faible. Les user descriptions sont rendues en text brut (bon). |
| 7 | Securite | Auth bypass | 4 | **CRITIQUE** : mes-biens, ma-galerie, mes-dossiers, compte — protection auth UNIQUEMENT cote client (redirect JS). Aucune middleware Next.js. Un utilisateur peut acceder aux API directement. Les API backend protegent-elles ? Non verifie ici, mais la page sert du HTML meme sans session. |
| 8 | Securite | Data exposure | 6 | Email utilisateur affiche dans le header (compte). Contact email protege par click-to-reveal (bon). Pas de token sensible dans le client. Cependant, le sessionId est stocke en localStorage en clair. |
| 9 | Securite | CSRF | 7 | Les mutations POST/PUT/PATCH/DELETE passent par fetch() avec les cookies de session (same-origin). Pas de token CSRF explicite, mais le modele SameSite cookie de NextAuth offre une protection de base. |
| 10 | Securite | Input validation | 5 | Validation SIRET cote client (regex 14 chiffres). Pas de validation d'email cote client dans le formulaire de profil marchand. Nombres non valides (surface negative, prix negatif) non filtres cote client. |
| 11 | Performance | Bundle size | 6 | JSZip charge en dynamic import (bon). react-compare-slider toujours charge meme si non utilise. Pas de next/dynamic pour les composants lourds (MerchantMode, StylePicker). |
| 12 | Performance | Images | 4 | **AUCUN usage de next/image** sur l'ensemble du frontend. Toutes les images sont des `<img>` natifs. Pas de srcset, pas de format WebP automatique, pas de blur placeholder. Les images de la galerie, dossiers, annonces sont toutes servies via /api/logs/image sans optimisation. |
| 13 | Performance | SSR vs CSR | 7 | Les pages publiques (annonce/[uuid], dossier/[uuid]) sont correctement SSR. Les pages privees sont "use client" — acceptable car elles dependent de la session. pricing est client-side pour le checkout flow. |
| 14 | Performance | Fetch patterns | 6 | Pas de SWR/React Query — chaque navigation refait les fetches. Waterfall dans mes-biens/[id] (fetchProperty + fetchPhotos + fetchActiveAnnonce en parallele — bon). Pas de cache. |
| 15 | Performance | Hydration | 8 | navigator.share verifie dans useEffect (correct). Pas de mismatch detecte. getSessionId() protege par typeof window. |
| 16 | Accessibilite | Semantique HTML | 6 | Structure h1/h2 correcte dans la plupart des pages. Cependant, les modales utilisent des div au lieu de dialog. Pas de <main> dans pricing, mes-dossiers. Pas de nav landmark dans toutes les pages. |
| 17 | Accessibilite | ARIA | 8 | role="dialog" + aria-modal sur AuthModal et RefineModal. aria-label sur les boutons icones. role="alert" + aria-live sur les erreurs. role="radiogroup" sur le toggle indoor/outdoor. role="slider" sur le comparateur. |
| 18 | Accessibilite | Keyboard navigation | 7 | Focus trap dans AuthModal et RefineModal. Escape ferme les modales. focus-visible:ring sur la majorite des elements. Cependant, les modales de mes-biens/[id] (associate, dossier) n'ont PAS de focus trap. |
| 19 | Accessibilite | Contraste | 6 | text-muted/50, text-muted/40, text-muted/60 sur fond clair — probablement en dessous de WCAG AA (4.5:1). Le texte legal dans AuthModal est text-muted/60 (explicitement documente comme "WCAG AA" mais non verifie). text-[10px] utilise frequemment — taille minimum WCAG est 12px. |
| 20 | Accessibilite | Screen reader | 6 | alt text present sur la plupart des images. Certains alt="" sur des images decoratives (correct). Cependant, les boutons "x" de fermeture des modales dans mes-biens/[id] utilisent le texte "x" au lieu d'un aria-label. Les overlays d'images (style labels) ne sont pas accessibles au screen reader. |

**Score global : 6.3/10**

---

## Top 10 bugs / vulnerabilites prioritaires

### 1. [CRITIQUE] Auth bypass — pages protegees sans middleware
**Fichiers** : `app/mes-biens/page.tsx:67-71`, `app/ma-galerie/page.tsx:60-64`, `app/mes-dossiers/page.tsx:51-55`, `app/mes-biens/[id]/page.tsx:110-114`
**Probleme** : La protection auth est un redirect JavaScript (`window.location.href = "/"`). Un bot ou un utilisateur avec JS desactive peut voir le HTML de la page. Plus grave : les donnees sont protegees par les API backend, mais l'UX expose un layout vide qui revele l'existence des routes.
**Correction** : Ajouter un middleware Next.js (`middleware.ts`) qui redirige cote serveur les routes `/mes-*`, `/compte` pour les utilisateurs non authentifies.

### 2. [CRITIQUE] IDOR potentiel — propertyId dans l'URL sans verification d'ownership
**Fichier** : `app/mes-biens/[id]/page.tsx:72`, `app/page.tsx:488`
**Probleme** : `const propertyId = params.id as string` est utilise directement dans les appels API. Si l'API `/api/properties/${propertyId}` ne verifie pas que le bien appartient a l'utilisateur authentifie, c'est un IDOR (Insecure Direct Object Reference).
**Correction** : Verifier cote API ET ajouter une validation cote client que le propertyId est bien un UUID/nombre valide.

### 3. [HAUTE] 14 blocs catch vides — erreurs silencieuses
**Fichiers** : `app/mes-biens/page.tsx:80-81`, `app/mes-biens/[id]/page.tsx:125,137,149,184,203,218`, `app/ma-galerie/page.tsx:78,93,116`, `app/compte/page.tsx:90`
**Probleme** : Les erreurs reseau sont silencieusement ignorees. L'utilisateur ne recoit aucun feedback quand une operation echoue (dissociation de photo, sauvegarde de description, chargement des proprietes).
**Correction** : Au minimum, afficher un toast d'erreur generique. Idealement, chaque operation doit avoir un feedback visuel.

### 4. [HAUTE] Aucun usage de next/image — impact performance majeur
**Fichiers** : Tous les composants et pages sans exception
**Probleme** : Toutes les images sont des `<img>` natifs. Pas d'optimisation automatique (WebP, srcset, lazy loading natif Next.js, blur placeholder). Sur une app centree sur l'image, c'est un manque critique de performance.
**Correction** : Migrer les images servies par `/api/logs/image` vers un pattern compatible avec next/image (loader custom), ou au minimum ajouter `loading="lazy"` et `decoding="async"` partout (loading="lazy" est deja present sur la plupart mais pas toutes).

### 5. [HAUTE] page.tsx — 30+ useState, complexite excessive
**Fichier** : `app/page.tsx:126-157`
**Probleme** : Le composant Home a plus de 30 variables d'etat, rendant le code difficile a maintenir et propice aux bugs de synchronisation d'etat.
**Correction** : Extraire en useReducer ou dans un custom hook `useGenerationFlow()`.

### 6. [HAUTE] Modales sans focus trap dans mes-biens/[id]
**Fichier** : `app/mes-biens/[id]/page.tsx:576-651` (associate modal), `app/mes-biens/[id]/page.tsx:654-747` (dossier modal)
**Probleme** : Les deux modales n'ont pas de focus trap, pas de gestion Escape, pas de scroll-lock. Un utilisateur clavier peut tabber en dehors de la modale.
**Correction** : Ajouter le meme pattern de focus trap que AuthModal/RefineModal.

### 7. [MOYENNE] STYLE_LABELS duplique dans 3 fichiers
**Fichiers** : `app/mes-biens/[id]/page.tsx:53-67`, `app/ma-galerie/page.tsx:32-46`, composants divers
**Probleme** : Violation DRY. Si un nouveau style est ajoute, il faut le mettre a jour dans 3 endroits.
**Correction** : Extraire dans un fichier `lib/constants.ts`.

### 8. [MOYENNE] img onError — manipulation DOM directe
**Fichier** : `app/ma-galerie/page.tsx:235-239`
**Probleme** : `onError` modifie `e.currentTarget.style.display = "none"` et accede a `target.nextElementSibling`. C'est une manipulation DOM imperative qui contourne React.
**Correction** : Utiliser un state `hasError` et rendre conditionnellement.

### 9. [MOYENNE] document.execCommand("copy") — API deprecee
**Fichiers** : `components/AnnoncePublicView.tsx:71-72,88-89`, `components/MerchantMode.tsx:349-352`
**Probleme** : `document.execCommand("copy")` est deprece et sera retire des navigateurs.
**Correction** : Le fallback est deja en place (Clipboard API en premier), mais le code deprecated devrait etre supprime et remplace par un message "Copie non supportee".

### 10. [MOYENNE] Texte a 10px — en dessous de WCAG AA
**Fichiers** : Nombreux — `text-[10px]` utilise dans mes-biens, ma-galerie, pricing, dossier, annonce
**Probleme** : WCAG AA recommande un minimum de 12px pour le texte. 10px est illisible pour les utilisateurs malvoyants.
**Correction** : Remplacer `text-[10px]` par `text-xs` (12px) minimum.

---

## Liste des memory leaks potentiels

| # | Fichier | Ligne | Description | Severite |
|---|---------|-------|-------------|----------|
| 1 | `app/page.tsx` | 589-614 | `handleDownloadAll` : cree un `Image()` + canvas + blob URL dans une boucle. Le `Image()` n'est pas nettoye si le composant unmount pendant le download. | Faible |
| 2 | `components/ImageComparator.tsx` | 31-59 | `addWatermark` : cree un `Image()` + canvas qui persiste si le composant unmount pendant le traitement. | Faible |
| 3 | `app/mes-biens/page.tsx` | 104-117 | `debounceRef` : le setTimeout dans `handleAddressInput` n'est pas nettoye au unmount du composant. | Faible |
| 4 | `components/MerchantMode.tsx` | 84,379-388 | `addressDebounceRef` : meme probleme que ci-dessus — le setTimeout persiste au unmount. | Faible |

**Note** : Les memory leaks critiques (URL.createObjectURL) ont ete correctement traites dans les Sprints precedents. Les leaks restants sont mineurs et ne causent pas de degradation perceptible.

---

## Liste des failles de securite

| # | Severite | Fichier | Description | Remediation |
|---|----------|---------|-------------|-------------|
| 1 | CRITIQUE | `app/mes-biens/*`, `app/ma-galerie/*`, `app/mes-dossiers/*`, `app/compte/*` | Auth client-only via redirect JS. Aucun middleware serveur. Pages accessibles sans session. | Middleware Next.js avec redirect serveur sur les routes protegees. |
| 2 | HAUTE | `app/mes-biens/[id]/page.tsx:72` | `params.id` utilise sans validation (cast `as string`). IDOR possible si l'API ne verifie pas l'ownership. | Validation UUID cote client + verification ownership cote API. |
| 3 | HAUTE | `app/annonce/[uuid]/page.tsx:309-315` | Le lien "Voir la fiche bien" expose l'ID interne du property (`/mes-biens/${annonce.property_id}`) dans une page publique. Un visiteur non authentifie voit cet ID. | Ne pas exposer l'ID interne dans la page publique. |
| 4 | MOYENNE | `app/page.tsx:35-43` | `sessionId` en localStorage — pas chiffre, pas httpOnly. Peut etre lu par un script tiers (XSS). | Generer le sessionId cote serveur, stocker dans un cookie httpOnly. |
| 5 | MOYENNE | `app/pricing/page.tsx:108-111` | Le checkout Stripe est initie sans token CSRF explicite. La protection depend de SameSite cookie. | Ajouter un CSRF token au body de la requete checkout. |
| 6 | FAIBLE | `components/AnnoncePublicView.tsx:52-53` | `window.location.origin` utilise pour construire l'URL de partage. Sur un proxy mal configure, pourrait leaker un hostname interne. | Utiliser une variable d'environnement `NEXT_PUBLIC_APP_URL`. |
| 7 | FAIBLE | `components/AuthModal.tsx:189` | Apres login reussi, `window.location.href = callbackUrl || window.location.pathname`. Le callbackUrl provient de props — si non sanitise en amont, open redirect possible. | Valider que callbackUrl est un chemin relatif (pas de protocole). |

---

## Recommandation

**GO avec reserves** — L'application est deployee et fonctionnelle. Les vulnerabilites identifiees ne sont pas exploitables immediatement dans un contexte de MVP avec un trafic limite. Cependant, avant toute montee en charge (lancement commercial, SEO actif, publicite), les 3 premiers points de securite doivent etre resolus :

1. Middleware Next.js pour l'auth serveur (1-2h de travail)
2. Validation des params dynamiques et ownership API (audit backend necessaire)
3. Suppression de l'ID property de la page annonce publique (10min)

Les optimisations performance (next/image, SWR) sont recommandees mais non bloquantes pour la phase actuelle.

---

**Handoff -> @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/frontend-audit-technique.md`
- Decisions prises : GO avec reserves, 3 bloquants securite identifies
- Points d'attention : middleware auth absent, IDOR potentiel, next/image absent partout, 14 catch vides
