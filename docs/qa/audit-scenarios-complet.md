# Audit exhaustif des scenarios de generation — Versimo

**Date** : 2026-04-03
**Agent** : @qa
**Fichiers audites** : `app/api/generate/route.ts`, `app/api/dossier/[uuid]/route.ts`, `app/api/dossier/route.ts`, `lib/credits.ts`, `app/page.tsx`, `components/MerchantMode.tsx`, `components/InlineGenerator.tsx`, `app/api/user/credits/route.ts`

---

## Synthese

| Profil | Scenarios | PASS | FAIL | WARN |
|---|---|---|---|---|
| Decouverte (anonyme) | 5 | 3 | 1 | 1 |
| Starter (connecte, credits > 0) | 8 | 5 | 2 | 1 |
| Pro (connecte, role pro / 50+ credits) | 8 | 8 | 0 | 0 |
| Transversal | 6 | 6 | 0 | 0 |
| **TOTAL** | **27** | **22** | **3** | **2** |

---

## Decouverte (anonyme, pas de compte)

| # | Scenario | Verdict | Fichier:Ligne | Detail |
|---|---|---|---|---|
| 1 | Generation simple 1 photo : rate limit IP, pas de credit check | **PASS** | `route.ts:641-666` | Le rate limit IP est applique a toutes les requetes (l.641-643, 10 req/min). Pour les anonymes : `session` est null, le bloc credit check (l.745) est conditionne par `session?.user?.id && !isIteration` — si pas de session, aucun decrement. L'anonyme passe librement avec rate limit IP seul. |
| 2 | Generation multi-photo (2-5) : meme rate limit | **PASS** | `page.tsx:400-404` | Chaque photo est un appel distinct a `/api/generate` (l.641 dans la boucle batch). Chaque appel est rate-limite individuellement par IP. Le rate limit est par requete, pas par "session de generation". Avec MAX_CONCURRENT=2 et 5 photos, 5 requetes en ~3 batches — passe sous la limite de 10/min. |
| 3 | Iterations : bloquees (maxIterations=0), message clair | **PASS** | `credits.ts:196`, `route.ts:786-793` | `getMaxIterations(null)` retourne 0 (l.196). Le serveur verifie `previousModifications.length >= userMaxIter` (l.787). Avec maxIter=0, des la premiere iteration le serveur retourne 403 avec message "Connectez-vous pour acceder aux iterations". |
| 4 | Galerie /ma-galerie : bloquee (GalleryGate) | **PASS** | `components/GalleryGate.tsx:32` | GalleryGate fetch `/api/user/credits` et verifie `data?.hasGalleryAccess`. Pour un anonyme, l'API retourne 401 (l.12-13 de credits/route.ts), donc `hasAccess` reste false. La galerie affiche le gate (connexion requise). |
| 5 | Mode Pro MerchantMode : visible ? accessible ? | **FAIL** | `page.tsx:1264-1266` | **BUG CRITIQUE DE FLUX** : `MerchantMode` est affiche pour TOUS les utilisateurs connectes (`{session && (` l.1264). Un Decouverte connecte (0 credits, pas Pro) voit le formulaire MerchantMode. Quand il clique "Generer", l'appel `POST /api/dossier` retourne 403 "Le Mode Pro est reserve aux abonnes Pro" (`dossier/route.ts:31-35`). **Le composant est visible mais inutilisable** — l'erreur arrive tardivement apres upload + annotation. Le message affiche est correct grace au traitement l.428-430 de MerchantMode.tsx. **IMPACT** : UX trompeuse pour Decouverte, l'utilisateur passe du temps a configurer ses photos pour rien. **NOTE** : en pratique, un utilisateur Decouverte CONNECTE devrait voir le mode standard, mais le code ne distingue pas Decouverte/Starter/Pro cote client pour le rendu — seul `session` est verifie. |

> **WARN** sur scenario 5 additionnel : un utilisateur anonyme (pas de session) voit le mode standard (3 etapes), ce qui est correct (`!session && (` l.1271). Mais la page ne montre plus aucun generateur standard aux utilisateurs connectes sans Pro — ils ne voient QUE MerchantMode, qui echoue au POST /api/dossier. **Bug UX** : un utilisateur Starter connecte ne peut PAS generer via le mode standard (la section est cachee par `!session`). Il doit passer par MerchantMode, qui est reserve Pro. VOIR scenario 6.

---

## Starter (connecte, credits > 0, pas Pro)

| # | Scenario | Verdict | Fichier:Ligne | Detail |
|---|---|---|---|---|
| 6 | Generation simple : decrement 1 credit | **FAIL** | `page.tsx:1264-1271` | **BUG CRITIQUE** : le mode standard (Upload/Style/Generer en 3 etapes) est affiche uniquement pour `!session` (l.1271). Un utilisateur Starter CONNECTE voit MerchantMode a la place (l.1264). Quand il lance MerchantMode, le POST /api/dossier echoue avec 403 car il n'a pas l'acces Pro. **RESULTAT** : un Starter connecte ne peut pas generer du tout. **FIX REQUIS** : afficher le mode standard pour les utilisateurs connectes NON-Pro, et MerchantMode uniquement pour les Pro. Ou bien permettre la creation de dossier pour Starter avec des limites differentes. |
| 7 | Generation multi-photo : decrement 1 credit PAR photo | **FAIL** | Meme cause que #6 | Le Starter connecte ne peut pas acceder au generateur. Si le bug #6 etait corrige et le Starter avait acces au mode standard : le decrement 1 credit par photo fonctionne correctement dans `route.ts:745-753` (decrement optimiste avant generation, un appel par photo). |
| 8 | Iterations : 1 iteration max | **PASS** (logique serveur) | `credits.ts:200-205` | `getMaxIterations` : si pas Pro et credits > 0, retourne 1 (l.205). Correct. La verification serveur `previousModifications.length >= userMaxIter` (route.ts:787) bloquera apres la 1ere iteration. |
| 9 | Iterations ne consomment PAS de credit (pass1Key skip) | **PASS** | `route.ts:744-745` | `const isIteration = !!pass1Key;` puis `if (!isInternalDossierCall && session?.user?.id && !isIteration)` — si isIteration est true, le bloc decrementCredit est saute. Confirme : les iterations sont gratuites. |
| 10 | Galerie /ma-galerie : accessible si totalPurchased >= 15 | **PASS** | `credits.ts:170-185` | `hasGalleryAccess` : verifie d'abord Pro (retourne true si oui), sinon verifie `SUM(credits_purchased) >= 15`. Un Starter qui a achete le pack 15 credits a acces. Un Starter avec seulement des credits offerts/admin (pas d'achat) n'a PAS acces — c'est logique par conception. |
| 11 | Mode Pro : bloque au POST /api/dossier (hasProAccess = false) | **PASS** | `dossier/route.ts:30-35` | `hasProAccess` retourne false pour Starter (ni role pro/admin, ni achat >= 50 credits). Le POST retourne 403. Correct. |
| 12 | Toggle Finitions/Mobilier : visible et fonctionnel (page.tsx) | **WARN** | `page.tsx:1526-1563` | Le toggle est rendu dans le mode standard (l.1527, condition `canGenerate && results.length === 0`). **MAIS** le mode standard n'est visible que pour `!session`. Un Starter connecte ne voit pas ce toggle car il est dans MerchantMode. Dans MerchantMode, le toggle global `withFurniture` existe (l.115) + toggle per-photo (l.36, `withFurniture` dans PhotoEntry). Le toggle global est fonctionnel dans MerchantMode... mais le Starter ne peut pas lancer la generation (bug #6). |
| 13 | Choix format : NON visible (Pro only dans MerchantMode) | **PASS** (par construction) | `MerchantMode.tsx:866-888` | Le choix de format (Original/Paysage/Portrait) est dans l'annotation per-photo de MerchantMode. Puisque MerchantMode est bloque pour Starter au niveau API, le format n'est pas fonctionnel pour eux — conforme au comportement attendu. |

---

## Pro (connecte, role='pro' ou credits_purchased >= 50)

| # | Scenario | Verdict | Fichier:Ligne | Detail |
|---|---|---|---|---|
| 14 | Generation simple : decrement 1 credit | **PASS** | `dossier/[uuid]/route.ts:725-728` | Dans le batch, `decrementCredit(userId)` est appele pour chaque photo (l.725). Si echec, l'erreur est attrapee et le credit rembourse (l.761). |
| 15 | Generation multi-photo : decrement 1 credit PAR photo | **PASS** | `dossier/[uuid]/route.ts:720-728` | La boucle `photos.map(async (photo) => { ... decrementCredit(userId) ... })` (l.721-726) decremente 1 credit par photo. Verification prealable : `credits < pendingPhotos.length` (l.502) verifie le solde total avant de lancer le batch. |
| 16 | Iterations : 3 max | **PASS** | `credits.ts:198-199` | `hasProAccess` retourne true → `getMaxIterations` retourne 3 (l.199). Dans dossier iterate (l.313-314) : `currentIterations >= maxIter` bloque au-dela de 3. |
| 17 | Mode Pro MerchantMode : accessible, toggle visible | **PASS** | `page.tsx:1264`, `MerchantMode.tsx:115` | MerchantMode est rendu pour tout `session`. Le Pro passe le check `hasProAccess` (dossier/route.ts:30-31). Le toggle global `withFurniture` (l.115) et per-photo (l.36) sont fonctionnels. Le `withFurniture` global est transmis au PATCH generate (l.415) et le per-photo est transmis dans le POST photos (l.400). |
| 18 | Choix format par photo (Original/Paysage/Portrait) : visible et transmis | **PASS** | `MerchantMode.tsx:866-888`, `dossier/[uuid]/route.ts:585-597` | Le format est selectionne dans l'annotation (l.866-888), envoye dans le POST /api/dossier/[uuid] (l.401 `outputFormat`), stocke dans la DB (l.157), lu dans `generateSinglePhoto` (l.585-597) pour calculer outputWidth/outputHeight. |
| 19 | Regenerer : consomme 1 credit, variation semantique (COMPOSITION_HINTS) | **PASS** | `dossier/[uuid]/route.ts:436-443,654-665` | `decrementCredit` appele l.436 avant generation. Si echec, `addCredits(userId, 1)` rembourse l.476. `COMPOSITION_HINTS` (l.654-663) ajoute une variation au furniturePrompt via `Date.now() % COMPOSITION_HINTS.length` — different a chaque regeneration. |
| 20 | Association bien : propertyId stocke + propage | **PASS** | `dossier/[uuid]/route.ts:213-264` | Action "attach" : `updateDossierInfo` stocke le propertyId sur le dossier (l.233). Si propertyId fourni, boucle sur les photos du dossier et `UPDATE user_photos SET property_id = $1` (l.243-248). Si pas de propertyId mais adresse, auto-creation de property via `findOrCreatePropertyByAddress` (l.254-261). |
| 21 | Galerie : accessible | **PASS** | `credits.ts:172` | `hasGalleryAccess` : `hasProAccess` retourne true → galerie accessible. |

---

## Transversal

| # | Scenario | Verdict | Fichier:Ligne | Detail |
|---|---|---|---|---|
| 22 | force-dynamic sur /api/generate | **PASS** | `route.ts:1` | `export const dynamic = "force-dynamic";` — premiere ligne du fichier. |
| 23 | force-dynamic sur /api/dossier/[uuid] | **PASS** | `dossier/[uuid]/route.ts:30` | `export const dynamic = "force-dynamic";` present. |
| 24 | force-dynamic sur /api/user/credits | **PASS** | `user/credits/route.ts:1` | `export const dynamic = "force-dynamic";` — premiere ligne. |
| 25 | Iterations gratuites : decrementCredit PAS appele quand pass1Key present | **PASS** | `route.ts:744-745` | `const isIteration = !!pass1Key; if (!isInternalDossierCall && session?.user?.id && !isIteration)` — le decrement est saute pour les iterations. Confirme aussi dans le commentaire l.986 "Iteration succeeded — no credit consumed". |
| 26 | Erreur generation : credit rembourse (addCredits) | **PASS** | `route.ts:1188-1193,1340-1349` | **Deux chemins de remboursement** : (1) Si passe 2 echoue apres 2 tentatives : `addCredits(session.user.id, 1)` l.1189. (2) Si erreur globale dans le catch : `addCredits(session.user.id, 1)` l.1341. Les deux sont conditionnes par `session?.user?.id && !_pass1Key` (pas de remboursement pour iterations). **Queue fallback** : si l'erreur est transiente et le user est connecte, enqueue (l.1297-1331) au lieu de rembourser — le credit reste reserve. |
| 27 | withFurniture transmis dans TOUS les flux | **PASS** | Voir detail | **page.tsx** : transmis l.650 `withFurniture` dans le body JSON. **MerchantMode** : transmis per-photo l.400 `withFurniture: p.entry?.withFurniture !== false` et global l.415. **dossier batch** : lu l.733 `photo.with_furniture !== false` et passe a `generateSinglePhoto`. **dossier iterate** : envoie `withFurniture: true` en dur (l.369) — semantiquement correct car l'iteration est toujours une passe 2 (mobilier). **InlineGenerator** : transmis l.269. **generateSinglePhoto** : recoit `withFurniture` param l.548. Tous les flux transmettent correctement le parametre. |

---

## Bugs critiques identifies

### BUG-1 (CRITIQUE) : Utilisateurs connectes non-Pro bloques sans generateur

**Fichier** : `app/page.tsx:1264-1271`
**Impact** : Un utilisateur Starter connecte ne peut ni utiliser le mode standard (cache par `!session`), ni le Mode Pro (bloque par `hasProAccess` au niveau API).
**Comportement actuel** : Le mode standard est reserve aux anonymes. Le MerchantMode est affiche a tous les connectes mais le POST /api/dossier exige Pro.
**Resultat** : Un Starter connecte se retrouve dans un dead-end UX — il voit MerchantMode, configure ses photos, et recoit une erreur 403 au lancement.
**Fix propose** : Conditionner l'affichage ainsi :
- Anonyme : mode standard (3 etapes)
- Starter connecte : mode standard (3 etapes) avec toggle visible
- Pro connecte : MerchantMode

```tsx
// Au lieu de :
{session && (<MerchantMode />)}
{!session && (<>...mode standard...</>)}

// Il faudrait :
{session && hasPro && (<MerchantMode />)}
{(!session || (session && !hasPro)) && (<>...mode standard...</>)}
```

**Signale a** : @fullstack pour correction prioritaire.

### BUG-2 (MOYENNE) : getMaxIterations retourne 1 pour Starter basee sur credits > 0 au lieu de totalPurchased

**Fichier** : `lib/credits.ts:200-205`
**Comportement** : `getMaxIterations` retourne 1 si `credits > 0`. Un utilisateur qui a recu des credits gratuits (admin) SANS achat Starter (< 15 credits achetes) obtient quand meme 1 iteration.
**Analyse** : Le commentaire (l.194) dit "Starter (purchased >= 15 credits)" mais le code verifie `getUserCredits(userId) > 0` — pas le total achete. C'est une divergence spec/code. Cependant, c'est potentiellement intentionnel ("if you have credits, you've paid" l.203) comme raccourci acceptable.
**Signale a** : @product-manager pour clarification.

---

## Auto-evaluation

- Chaque chemin critique du persona principal est-il couvert ? **Partiellement** — le BUG-1 bloque les Starter.
- Le pipeline complet tourne-t-il ? Non audite (audit de code, pas d'execution).
- Les credits sont-ils correctement geres ? **Oui** pour les flux fonctionnels. Decrement optimiste + remboursement en cas d'echec.
- Les iterations sont-elles gratuites ? **Oui**, confirme a 3 endroits dans le code.
- force-dynamic present partout ? **Oui** sur les 3 routes critiques verifiees + 30+ autres routes.

---

**Handoff -> @fullstack**
- Fichiers produits : `docs/qa/audit-scenarios-complet.md`
- Decisions prises : classification des bugs par severite, verification ligne par ligne de chaque flux
- Points d'attention : **BUG-1 est bloquant** — les utilisateurs Starter connectes ne peuvent pas generer. Le fix requiert une refonte de la logique d'affichage conditionnelle dans page.tsx basee sur le statut Pro (necessite un fetch `/api/user/credits` pour obtenir `hasPro` cote client). BUG-2 est a clarifier avec @product-manager.
