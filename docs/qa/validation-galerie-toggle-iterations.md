# Rapport de validation — Galerie Gate, Toggle Finitions/Mobilier, Limites iterations

**Date** : 2026-04-02 | **Agent** : @qa | **Scope** : 3 fonctionnalites de la session courante

---

## Fonctionnalite 1 — Galerie Gate Starter+Pro

| # | Verification | Statut | Detail |
|---|---|---|---|
| 1.1 | `hasGalleryAccess()` : logique correcte (credits_purchased >= 15 OR role pro/admin) | PASS | `lib/credits.ts:170-184` — appelle `hasProAccess()` en premier (couvre role pro/admin + achat 50+ credits), puis verifie `SUM(credits_purchased) >= 15` via requete SQL. Logique conforme a la spec. |
| 1.2 | L'API expose `hasGalleryAccess` dans la reponse | PASS | `app/api/user/credits/route.ts:28` — `hasGalleryAccess: hasGallery` present dans la reponse JSON. Appele en parallele avec les autres checks via `Promise.all`. |
| 1.3 | GalleryGate wraps correctement le contenu de ma-galerie | PASS | `app/ma-galerie/page.tsx:304-629` — `<GalleryGate>` enveloppe le `<main>` et tout le contenu de la galerie. Le Header reste en dehors (correct). Les etats auth loading/unauthenticated sont geres avant le GalleryGate (early return). |
| 1.4 | 4 etats UI implementes (loading, erreur, acces refuse, acces accorde) | PASS | `components/GalleryGate.tsx` — Loading (skeleton, lignes 54-61), Erreur (message + bouton Reessayer, lignes 64-78), Acces accorde (render children, lignes 81-83), Acces refuse (ecran upgrade, lignes 86-131). |
| 1.5 | CTA Pro en premier, Starter en secondaire | PASS | `components/GalleryGate.tsx:106-118` — CTA primaire : "Pro — 50 visuels — 29 EUR/mois" (lien sage, style primaire). CTA secondaire : "ou Pack Starter — 15 visuels — 14,90 EUR" (lien texte). |
| 1.6 | Accessibilite : focus-visible, touch targets 44px | PASS | Bouton Reessayer (ligne 72) : `focus-visible:ring-2`. CTA Pro (ligne 108) : `focus-visible:ring-2`. Bouton "Verifier mon acces" (ligne 125) : `min-h-[44px]` + `focus-visible:ring-1`. |

**Ecarts mineurs (non bloquants)** :
- Le titre GalleryGate est "Retrouvez tous vos visuels" au lieu de "Votre galerie vous attend" (spec ligne 61). Acceptable — le texte est plus explicite.
- Le corps est "L'historique de vos visuels generes, telechargeables a tout moment" au lieu de "L'historique de vos visuels est disponible des votre premier pack." Acceptable — meme intention.
- Le CTA Starter dit "ou Pack Starter — 15 visuels — 14,90 EUR" au lieu de "Demarrer avec Starter — 14,90 EUR" (spec). Le brief utilisateur demandait explicitement Pro en premier avec ce format, donc conforme au brief.

**Verdict Fonctionnalite 1** : **PASS**

---

## Fonctionnalite 2 — Toggle Finitions/Mobilier

| # | Verification | Statut | Detail |
|---|---|---|---|
| 2.1 | State `withFurniture` existe dans MerchantMode ET InlineGenerator | PASS | `MerchantMode.tsx:112` — `useState(true)`. `InlineGenerator.tsx:136` — `useState(true)`. Default `true` dans les deux. |
| 2.2 | Toggle UI avec bons labels ("Finitions seulement" / "Finitions + Mobilier") | PASS | Labels conformes dans les 3 composants : `MerchantMode.tsx:793,805` + `952,964` (2 toggles), `InlineGenerator.tsx:669,681`, `app/page.tsx:1512,1524`. |
| 2.3 | `withFurniture` transmis dans le body des fetch | PASS | `MerchantMode.tsx:351` — `body: JSON.stringify({ action: "generate", withFurniture })`. `InlineGenerator.tsx:269,379` — `withFurniture` dans le body. `app/page.tsx:627` — `withFurniture` dans le body. |
| 2.4 | Toggle disabled pendant isGenerating | PASS | `MerchantMode.tsx:781` — `${isGenerating ? "opacity-50 pointer-events-none" : ""}` sur le container du toggle. `InlineGenerator.tsx:657` — meme pattern. `app/page.tsx:1496` — toggle non rendu si `isGenerating` (`!isGenerating` dans la condition). |
| 2.5 | Accessibilite : role="radiogroup", role="radio", aria-checked | PASS | Les 3 composants utilisent `role="radiogroup"` + `aria-label="Mode de generation"` sur le container, `role="radio"` + `aria-checked` sur chaque bouton. Touch targets `min-h-[44px]` + `focus-visible:ring-2`. |
| 2.6 | AUCUNE occurrence de "Surfaces uniquement" ou "Surfaces + Mobilier" dans le code source | PASS | Grep sur `*.{ts,tsx,js,jsx}` : 0 resultat. Les anciennes formulations n'existent que dans les docs/specs/reviews. |

**Note** : MerchantMode a 2 toggles identiques — un dans l'etape "annotate" (ligne 781) et un dans l'etape "style" (ligne 940). Les deux partagent le meme state `withFurniture`. C'est correct car le toggle est visible dans les 2 etapes du flow.

**Verdict Fonctionnalite 2** : **PASS**

---

## Fonctionnalite 3 — Limites iterations par pack

| # | Verification | Statut | Detail |
|---|---|---|---|
| 3.1 | `getMaxIterations()` retourne : 0 (anonyme/gratuit), 1 (starter), 3 (pro/admin) | PASS | `lib/credits.ts:195-218` — `null` userId → 0, `hasProAccess()` → 3, `totalPurchased >= 15` → 1, sinon 0. Conforme. |
| 3.2 | Plus AUCUNE reference a `MAX_ITERATIONS` dans le code source | PASS | Grep sur `*.{ts,tsx,js,jsx}` : 0 resultat. La constante a ete completement supprimee. |
| 3.3 | Le frontend fetche `maxIterations` via `/api/user/credits` | PASS | `app/page.tsx:179-191` — useEffect fetche `/api/user/credits` et extrait `data.maxIterations` pour `setMaxIterations()` et `setIterationsRemaining()`. |
| 3.4 | Le backend verifie les limites via `getMaxIterations()` dans generate ET dossier routes | PASS | `app/api/generate/route.ts:750` — `getMaxIterations(session?.user?.id)` + check `previousModifications.length >= userMaxIter`. `app/api/dossier/[uuid]/route.ts:293` — `getMaxIterations(session.user.id)` + check `currentIterations >= maxIter`. |
| 3.5 | Les iterations ne consomment PAS de credit | **FAIL** | **BUG** — `app/api/generate/route.ts:653-661` : `decrementCredit()` est appele AVANT le parsing du body, donc AVANT de savoir si la requete est une iteration ou une generation. Les iterations depuis `app/page.tsx` (flow F1 standard) consomment un credit. Ligne 950 confirme : "credit was already decremented optimistically". Pas de refund pour les iterations reussies. |

### Detail du bug 3.5

**Fichier** : `app/api/generate/route.ts`
**Lignes** : 653-661 (decrementCredit) et 950 (commentaire confirmant)
**Impact** : Chaque iteration depuis la page principale coute 1 credit a l'utilisateur. Un utilisateur Starter (15 credits, 1 iteration max) perd un credit pour chaque iteration. Un utilisateur Pro (50 credits, 3 iterations max) perd jusqu'a 3 credits supplementaires par generation.
**Cause racine** : Le `decrementCredit` est appele en amont du parsing du body, dans le bloc generique d'auth. Le code ne distingue pas encore si c'est une generation ou une iteration.
**Note** : Les iterations via le dossier route (`/api/dossier/[uuid]`) NE sont PAS affectees car elles utilisent le header `X-Internal-Dossier: true` qui bypass le credit check (ligne 640-650). Seul le flow F1 (page principale) est touche.
**Fix recommande** : Apres le parsing du body, si `pass1_key` est present (= iteration), refund le credit immediatement via `addCredits(session.user.id, 1)`. Ou mieux : deplacer le `decrementCredit` apres le parsing du body et ne l'appeler que si `!pass1Key`.

**Verdict Fonctionnalite 3** : **FAIL** (1 bug)

---

## Synthese

| Fonctionnalite | Verifications | PASS | FAIL | Verdict |
|---|---|---|---|---|
| 1 — Galerie Gate | 6 | 6 | 0 | PASS |
| 2 — Toggle Finitions/Mobilier | 6 | 6 | 0 | PASS |
| 3 — Limites iterations | 5 | 4 | 1 | FAIL |
| **Total** | **17** | **16** | **1** | — |

---

## Verdict global : NO-GO

**1 bug bloquant** empechant le GO :

| Bug | Severite | Fichier | Ligne | Description |
|---|---|---|---|---|
| BUG-ITER-CREDIT | **P0 CRITIQUE** | `app/api/generate/route.ts` | 653 | Les iterations depuis page.tsx consomment un credit. Les utilisateurs Starter perdent des credits a chaque iteration, contrairement a la spec ("les iterations ne consomment PAS de credit"). |

**Action requise** : @fullstack doit corriger le bug BUG-ITER-CREDIT avant la mise en production. Fix minimal : ajouter une condition `!pass1Key` au `decrementCredit`, ou refund immediat si `pass1Key` est detecte apres parsing.

---

**Handoff → @fullstack**
- Fichier produit : `docs/qa/validation-galerie-toggle-iterations.md`
- Decisions prises : 16/17 verifications PASS, 1 bug P0 identifie
- Bug a corriger : `app/api/generate/route.ts:653` — iterations consomment un credit alors qu'elles ne devraient pas
- Points d'attention : seul le flow F1 (page principale) est touche, le flow dossier est correct (bypass via X-Internal-Dossier)
