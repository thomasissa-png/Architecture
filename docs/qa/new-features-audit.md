# Audit nouvelles fonctionnalites — 2026-03-26

Audit code source statique. Chaque feature notee /10. Bugs classes P0/P1/P2.

---

## 1. InlineGenerator + UploadZone — 4/10

**OK** : UploadZone s'affiche si `photosWithInput.length === 0 && uploadedFiles.length === 0` (L456). Bouton "Choisir le style" apparait si `uploadedFiles.length > 0` (L466-480).

**P0 — uploadedFiles jamais utilises lors de la generation.** `handleGenerate` (L182-298) filtre uniquement `photos.filter(p => selectedPhotoIds.has(p.id) && p.input_image_key)`. Quand l'utilisateur uploade des fichiers via UploadZone (pas de photos serveur), `selectedPhotos` est vide, la fonction retourne immediatement (L184). Le bouton "Lancer la generation" affiche `selectedCount` = 0, donc `disabled`. Le parcours upload-direct est **mort** : l'utilisateur ne peut jamais generer.

**P2 — Accents manquants dans les textes visibles** (L273, 357, 401, 582, 601, 654, 671, 695) : "generation", "termine", "Retour a la selection". Voir section 10.

---

## 2. MerchantMode — Selecteur bien existant — 8/10

**OK** : Fetch `/api/properties` au mount (L143-151), conditionne par `session?.user?.id`. `handleSelectProperty` (L153-171) remplit tous les champs : nom, adresse, type, surface, prix, nb pieces, lat/lon, city, description. Le dropdown est rendu si `existingProperties.length > 0` (verifie dans le JSX).

**OK** : Si 0 biens existants, le dropdown n'apparait pas. Pas de crash.

**P2** : `.catch(() => {})` silencieux (L150) — aucun feedback utilisateur si le fetch echoue.

---

## 3. StorageImage — 9/10

**OK** : `imageKey` null/undefined/empty → fallback affiche (L69). `onError` → retry 1x apres 1s avec cache-buster `&t=` (L50-61). `onLoad` → `setLoaded(true)`, image visible (L64-66, L87). Image masquee par `display:none` avant chargement (L87).

**P2** : Si `imageKey` est une chaine vide `""`, `!imageKey` est true donc fallback OK. Correct.

Rien de bloquant.

---

## 4. ProGate — 8/10

**OK** : Non-Pro → ecran upgrade avec lock icon, liste features, CTA vers `/#pricing` (L57-141). Pro → `{children}` (L53-55). Auth loading → spinner (L44-50). Unauthenticated → `hasPro = false` (L24-28).

**OK** : `/api/user/credits` fail → `.catch()` met `hasPro = false` + `isLoading = false` (L37-39). L'ecran upgrade s'affiche. Pas de crash.

**P2** : Le bouton "Rafraichir la page" fait `window.location.reload()` mais le touch target `min-h-[44px]` est sur un `button` inline dans un `p` — risque de layout bizarre.

---

## 5. Hero statique — 10/10

**OK** : `src="/hero/before.jpg"` (L758) et `src="/hero/after.jpg"` (L844) dans `app/page.tsx`. Images statiques, pas de fetch.

**OK** : `/api/demo` n'est plus reference dans `page.tsx`. Il reste reference dans `StylePicker.tsx` (L22-143) pour les previews de style, mais c'est un usage separe et attendu (previews de style, pas le hero).

---

## 6. Pages personas — 9/10

**Marchand** (`app/marchand/page.tsx`) : Server Component (pas de "use client"). `export const metadata` present (L5-28). JSON-LD FAQPage (L48-59). Maillage interne : liens vers `/architecte`, `/particulier`, `/pricing`, `/blog` dans le footer.

**Architecte** (`app/architecte/page.tsx`) : Server Component. `export const metadata` (L5-28). JSON-LD FAQPage (L48-59). Maillage : `/marchand`, `/particulier`, `/pricing`, `/blog`.

**Particulier** (`app/particulier/page.tsx`) : Server Component. `export const metadata` (L5-29). JSON-LD FAQPage. Maillage : `/marchand`, `/architecte` dans footer.

**P2** : Les pages personas n'ont pas de lien vers `/comparatif` dans leur footer ou contenu. Le maillage interne vers la page comparatif est absent. La page `/comparatif` elle, a des liens vers les 3 personas + blog.

---

## 7. Page /comparatif — 9/10

**OK** : Tableau comparatif complet avec 10 criteres, 4 colonnes (Versimo, Gepetto, InterieurAI, Renovate Club). FAQ JSON-LD avec 3 questions. Metadata SEO completes avec canonical.

**OK** : Disclaimer "Donnees collectees en mars 2026 sur les sites publics des concurrents" (L243-248). "Non documente" au lieu de donnees inventees. Conforme a la regle zero-invention.

**OK** : Maillage interne vers `/architecte`, `/marchand`, `/particulier`, `/blog`.

**P2** : Pas de lien retour depuis les pages personas vers `/comparatif`.

---

## 8. Blog — 8/10

**OK** : Table `blog_posts` avec `CREATE TABLE IF NOT EXISTS` (L11-27 de `lib/blog.ts`). Index sur slug et published.

**OK** : Index blog gere 0 articles gracieusement — empty state "Bientot disponible" (L115-129 de `app/blog/page.tsx`). `try/catch` autour de `getBlogPosts` (L34-38).

**OK** : Page article avec Markdown parser maison (`markdownToHtml`, L47-69 de `app/blog/[slug]/page.tsx`). Gere headers, bold, italic, links, paragraphs. JSON-LD Article (L84-97). `generateMetadata` present (L13-43).

**P1** : Le parser Markdown est basique — pas de support pour : listes (`-`, `1.`), code blocks, images, blockquotes. Si un article utilise ces elements, le rendu sera casse. A documenter pour @fullstack.

**P2** : `dangerouslySetInnerHTML` avec du contenu DB (L167). Si un admin injecte du HTML malveillant dans le contenu, c'est un vecteur XSS. Le contenu vient de la DB mais aucun sanitizer n'est applique.

---

## 9. Menu ordre uniforme — 7/10

Ordre attendu : Mes biens → Ma galerie → Mes dossiers.

| Page | Ordre constate | Correct ? |
|---|---|---|
| `app/page.tsx` (L660-667) | Biens, Galerie, Dossiers | OK |
| `app/mes-biens/page.tsx` (L188-194) | Biens, Galerie, Dossiers | OK |
| `app/mes-biens/[id]/page.tsx` (L488-495) | Biens, Galerie, Dossiers | OK |
| `app/mes-dossiers/page.tsx` (L123-130) | Biens, Galerie, Dossiers | OK |
| **`app/ma-galerie/page.tsx` (L241-248)** | **Biens, Dossiers, Galerie** | **NON** |

**P1** : Sur `/ma-galerie`, l'ordre du menu est Biens → Dossiers → Galerie au lieu de Biens → Galerie → Dossiers. Incoherent avec toutes les autres pages.

---

## 10. Accents — 6/10

`app/page.tsx` : propre (accents corrects, utilise `Generer` avec accent L1090).

**P1 — InlineGenerator.tsx** : 7 chaines sans accents visibles par l'utilisateur :
- L273 : "Erreur lors de la generation" → "generation"
- L357 : idem
- L401 : "La generation est en cours" → "generation"
- L582 : "Retour a la selection" → "a" et "selection"
- L601 : "Lancer la generation" → "generation"
- L654 : "Termine" → "Termine"
- L671 : "termine" → "termine"
- L695 : "Erreur lors de la generation"
- L718 : "Associer les resultats a ce bien" → "resultats" et "a"

---

## Resume des bugs

| ID | Severite | Composant | Description |
|---|---|---|---|
| B1 | **P0** | InlineGenerator.tsx | uploadedFiles jamais injectes dans handleGenerate — parcours upload-direct inutilisable |
| B2 | **P1** | InlineGenerator.tsx | 9 chaines UI sans accents francais (generation, selection, termine, resultats) |
| B3 | **P1** | ma-galerie/page.tsx | Menu dans le mauvais ordre (Biens, Dossiers, Galerie) |
| B4 | **P1** | blog/[slug]/page.tsx | Parser Markdown incomplet (pas de listes, code, images) |
| B5 | **P2** | blog/[slug]/page.tsx | dangerouslySetInnerHTML sans sanitizer sur contenu DB |
| B6 | **P2** | MerchantMode.tsx | Fetch /api/properties silencieux en cas d'erreur |
| B7 | **P2** | Pages personas | Pas de lien vers /comparatif dans le maillage interne |
| B8 | **P2** | ProGate.tsx | Layout bouton "Rafraichir" potentiellement bancal |
| B9 | **P2** | StylePicker.tsx | preview URLs pointent vers /api/demo (dependance residuelle) |

## Scores par feature

| # | Feature | Score |
|---|---|---|
| 1 | InlineGenerator + UploadZone | 4/10 |
| 2 | MerchantMode selecteur biens | 8/10 |
| 3 | StorageImage | 9/10 |
| 4 | ProGate | 8/10 |
| 5 | Hero statique | 10/10 |
| 6 | Pages personas | 9/10 |
| 7 | Page /comparatif | 9/10 |
| 8 | Blog | 8/10 |
| 9 | Menu ordre uniforme | 7/10 |
| 10 | Accents | 6/10 |

**Score moyen : 7.8/10** — 1 bug P0, 3 bugs P1, 5 bugs P2.

Action prioritaire : corriger B1 (InlineGenerator uploadedFiles) avant tout le reste.
