# Revue croisee — Versiroom F6 (Annonce immobiliere publique) + Session complete — 2026-03-25

## Resume executif (non-technique)

L'implementation F6 est fonctionnelle et couvre la majorite du parcours Thomas. La page annonce publique existe, les photos sont groupees par piece, les boutons de partage fonctionnent, et l'idempotence est respectee. Cependant, **5 ecarts significatifs** existent entre les specs et le code : le statut "archive" retourne 410 au lieu de 404 (fuite d'information), l'edge case "Prix sur demande" n'est pas gere, le disclaimer IA n'est pas dans le footer de la page, F6 n'est pas mentionne dans la page pricing, et le filtre room_type dans /ma-galerie (integre au scope F6 par decision PM) est partiellement implemente. L'authentification email/password et la recherche entreprise sont solides. **On peut avancer, mais 3 corrections sont bloquantes avant mise en production.**

## Resume technique

Coherence globale : 7/10. L'architecture code est propre (lib/annonce.ts suit le pattern lib/dossier.ts). 3 blocages critiques : API GET annonce archivee retourne 410 au lieu de 404 (contradiction specs), edge cases donnees manquantes non geres (prix 0, description null), et absence du disclaimer IA sur la page publique. Recommandation : **GO avec reserves** — 3 corrections P0 avant deploy.

---

## 1. Conformite specs vs code

### Criteres d'acceptation nominaux

| # | Critere (specs section 8) | Statut | Detail |
|---|---|---|---|
| 1 | Bouton "Creer une annonce" sur /mes-biens/[id] quand >=1 photo | **OK** | `create-annonce-btn` present, disabled si photos.length === 0 |
| 2 | Page /annonce/[uuid] accessible sans auth (publique) | **OK** | SSR server component, pas de getServerSession |
| 3 | Titre auto-genere "{Type} {surface}m2 — {ville}" | **OK** | Logique correcte dans POST /api/annonce avec fallback "Bien"/"Annonce" |
| 4 | Description commerciale affichee | **OK** | `description_final \|\| description_generated` |
| 5 | Photos groupees par room_type avec labels FR | **OK** | ROOM_TYPE_LABELS + tri logique ROOM_ORDER |
| 6 | Infos cles : surface, pieces, prix formate, localisation | **PARTIEL** | Affiche correctement QUAND present, mais edge case prix=0/null non gere (voir #14) |
| 7 | Contact marchand : tel + email pro | **OK** | Tel en clair, email click-to-reveal (anti-scraping) |
| 8 | Logo + couleurs marchand | **PARTIEL** | Logo affiche si present, fallback = logo "Versiroom" au lieu des initiales specifiees |
| 9 | Bouton "Copier le lien" fonctionnel + toast | **OK** | Feedback "Copie !" avec timeout 2s |
| 10 | Bouton "Copier la description" + disclaimer | **OK** | Disclaimer ajoute automatiquement dans le texte copie |
| 11 | Bouton "Partager WhatsApp" fonctionnel | **OK** | navigator.share natif + fallback wa.me |
| 12 | Bouton "Telecharger photos" ZIP (JSZip) | **PARTIEL** | ZIP fonctionne mais pas de barre de progression (specs : "7/15") |
| 13 | Nom ZIP `annonce-{ville}-{surface}m2.zip` | **OK** | Avec fallback UUID si ville/surface absents |
| 14 | Footer "Annonce generee par Versiroom" | **OK** | Present avec lien vers le site |
| 15 | Gate Pro+ (hasProAccess) | **OK** | Verifie cote serveur dans POST /api/annonce |
| 16 | Responsive mobile-first | **OK** | Grille 2 cols mobile / 3 cols desktop, touch targets 44px |
| 17 | data-testid sur elements interactifs | **OK** | 13 data-testid presents (titre, prix, galerie, description, contact, tel, actions, copy-link, copy-desc, whatsapp, download-zip, reveal-email, email-revealed) |
| 18 | noindex/nofollow | **OK** | `robots: "noindex, nofollow"` dans generateMetadata |

### Edge cases donnees manquantes

| # | Edge case (specs section 8) | Statut | Detail |
|---|---|---|---|
| E1 | Prix absent → "Prix sur demande" | **KO** | Le prix est simplement masque (conditional render). "0 EUR" pourrait s'afficher si sale_price === 0 car la condition est `property.sale_price &&` qui est falsy pour 0. Pas de "Prix sur demande" |
| E2 | Description absente → "Description a venir" + lien | **KO** | Si description null, le bloc est masque. Pas de placeholder, pas de lien "Completer" |
| E3 | Surface absente → titre sans "null m2" | **OK** | Le titre builder filtre les parties vides avec `.filter(Boolean)` |
| E4 | Nombre de pieces absent → masquer | **OK** | Conditional render `property.room_count &&` |
| E5 | Telephone absent → masquer | **OK** | Conditional render `merchant?.telephone &&` |
| E6 | Email absent → masquer | **OK** | Conditional render `contactEmail &&` |
| E7 | Aucun contact → "Coordonnees sur demande" | **KO** | Si tel ET email null, le bloc contact est masque. Pas de message "Coordonnees disponibles sur demande" |
| E8 | Logo absent → initiales dans carre couleur | **KO** | Fallback affiche "Versiroom" au lieu des initiales du nom d'entreprise |
| E9 | Photos supprimees apres creation → galerie sans planter | **OK** | `.filter(p => p.output_image_key)` protege |

### Edge cases securite

| # | Edge case (specs section 8) | Statut | Detail |
|---|---|---|---|
| S1 | UUID invalide → 404 propre | **OK** | Page affiche "Annonce introuvable" |
| S2 | Annonce archivee → 404 (ne pas reveler l'existence) | **KO** | API retourne 410 "Annonce expiree ou archivee" — REVELE que l'annonce existe. Page affiche "Annonce expiree" avec date de publication. Specs disent explicitement : "meme comportement que UUID inexistant" |
| S3 | Pas de donnees sensibles sur page publique | **OK** | Pas de credits, pas d'autres biens, pas de date d'achat |
| S4 | ZIP 0 photo → erreur | **PARTIEL** | `photos.length === 0` retourne au debut, mais pas de message utilisateur |
| S5 | Double clic "Creer annonce" → idempotence | **OK** | `getActiveAnnonceForProperty()` verifie AVANT insert + state `isCreatingAnnonce` client-side |
| S6 | Titre override vide → auto-genere | **N/A** | Pas d'edition de titre implementee (le titre est auto-genere et non modifiable en MVP) |

### Criteres performance

| # | Critere | Statut | Detail |
|---|---|---|---|
| P1 | Page < 2s sur 4G | **RISQUE** | Utilise `<img>` natif au lieu de `next/image` avec optimisation — pas de lazy sizes, pas de srcset responsive |
| P2 | ZIP < 30s pour 15 photos | **OK** | Batch de 5 concurrents avec Promise.allSettled |

---

## 2. Contradictions detectees

| Livrable A | Livrable B | Contradiction | Criticite | Resolution proposee |
|---|---|---|---|---|
| f6-annonce-specs.md §8 "Annonce archivee → 404, ne pas reveler l'existence" | app/api/annonce/[uuid]/route.ts retourne `{ status: 410, error: "Annonce expiree ou archivee" }` + page affiche "Annonce expiree" avec date | **L'API et la page revelent que l'annonce existe et quand elle a ete creee** | BLOQUANT | Retourner 404 avec message identique a "UUID inexistant". Supprimer la date de creation de la page archivee. |
| pricing-strategy.md §feature gating : "Annonce publique (F6) : Oui (illimite) pour Pro/Studio" | app/pricing/page.tsx PACKS : aucune mention de F6/annonce dans les features Pro ni Studio | **Thomas ne sait pas qu'il a acces a F6 en achetant Pro** | MAJEUR | Ajouter "Annonces immobilieres publiques" dans les features Pro et Studio sur la page pricing |
| f6-annonce-specs.md §10 R1 : "disclaimer IA visible sur la page annonce ET dans la description copiee" | app/annonce/[uuid]/page.tsx : disclaimer dans le footer mais PAS dans la zone de description visible. AnnoncePublicView : disclaimer dans le texte copie OK | **Le disclaimer est presque invisible en footer (text-muted/40, taille xs). Pas dans la section description elle-meme.** | MINEUR | Acceptable en MVP — le disclaimer est present dans le footer ET dans le texte copie. Amelioration V2 : l'integrer aussi en fin de description affichee. |
| f6-annonce-specs.md §8 edge case "Logo absent → initiales du nom de l'entreprise dans un carre de la couleur principale" | app/annonce/[uuid]/page.tsx : fallback affiche "Versiroom" en texte | **Le fallback ne respecte pas les specs** | MINEUR | Implementer le fallback initiales avec couleur_principale du merchant |
| f6-annonce-specs.md §3 "F2 (filtre room_type) integre au scope F6" | app/ma-galerie/page.tsx : filtre room_type PRESENT (data-testid filter-room-type, param roomType) | **Pas de contradiction — F2 EST implemente** | N/A | Conforme |
| f4-final-verdict-thomas.md "Score 8.8/10, F2 seule friction bloquante" | f6-annonce-specs.md "Score post-F6 : 9.3/10" | **Coherent** — F6 ajoute les gains + F2 resolu | N/A | Conforme |

---

## 3. Analyse qualite code

### Securite

| Point | Statut | Detail |
|---|---|---|
| Injection SQL | **OK** | Requetes parametrees ($1, $2...) partout dans lib/annonce.ts et register/route.ts |
| XSS | **OK** | React echappe par defaut. Pas de dangerouslySetInnerHTML |
| Auth bypass | **OK** | POST /api/annonce verifie session + hasProAccess. GET /api/annonce/[uuid] est public par design |
| Donnees sensibles | **ATTENTION** | L'email pro est protege par click-to-reveal client-side, mais le JSON de l'API GET /api/annonce/[uuid] contient `merchant.email_pro` en clair — un scraper peut lire l'API directement |
| Hachage mot de passe | **OK** | bcrypt avec salt rounds 12, longueur max 128 chars |
| Enumeration d'email | **ATTENTION** | POST /api/auth/register retourne 409 avec message different selon que le compte est Google ou email — permet de verifier si un email est inscrit |

### Patterns et coherence

| Point | Statut |
|---|---|
| lib/annonce.ts suit le pattern lib/dossier.ts | **OK** — meme structure (types, ensureTable, CRUD, helpers) |
| Gestion d'erreurs | **OK** — try/catch systematiques, messages FR actionnables |
| Types TypeScript | **OK** — types explicites, pas de `any` visible, assertions `as Annonce` coherentes avec pg |
| Fuite memoire URL.createObjectURL | **OK** — revoke appele dans handleDownloadZip |

### AuthModal

| Point | Statut |
|---|---|
| Focus trap | **OK** — Tab/Shift+Tab cycle, Escape ferme |
| Body scroll lock | **OK** — overflow: hidden quand ouvert, cleanup en return |
| Clavier virtuel iOS | **OK** — max-h-[90dvh] + overflow-y-auto |
| ARIA | **OK** — role="dialog", aria-modal, aria-labelledby, role="alert" |
| Design system Versiroom | **OK** — bg-background, text-foreground, ring-sage, rounded-3xl, font-light |

### Recherche entreprise (compte/page.tsx)

| Point | Statut |
|---|---|
| Debounce | **KO** — pas de debounce sur la recherche par nom. Chaque frappe peut declencher un appel API (si l'utilisateur clique "Rechercher" manuellement c'est OK, mais si c'est onKeyDown ce serait un probleme) |
| Dropdown outside-click | **OK** — mousedown listener avec cleanup |
| Resultat vide | **OK** — message d'erreur affiche |
| Pappers API key absente | **OK** — retourne [] silencieusement, fallback correct |

---

## 4. Manques identifies

### Specs documentees NON implementees

1. **Bouton "Archiver l'annonce"** sur /mes-biens/[id] — la fonction `archiveAnnonce()` existe dans lib/annonce.ts mais AUCUN bouton d'archivage n'existe dans l'UI. Thomas ne peut pas desactiver une annonce pour un bien vendu. (Specs §10 R3 : "Ajouter un bouton Archiver l'annonce sur la fiche bien")
2. **Barre de progression ZIP** — specs §10 R4 : "Afficher une barre de progression pendant la generation du ZIP (7/15)". Le code affiche juste "Telechargement..." sans compteur.
3. **Edge case "Prix sur demande"** quand sale_price est null/0
4. **Edge case "Description a venir"** avec lien "Completer depuis la fiche bien" quand description null
5. **Edge case "Coordonnees sur demande"** quand tel ET email null
6. **Fallback logo = initiales** dans carre couleur (affiche "Versiroom" a la place)
7. **Mot de passe oublie** — le bouton existe mais affiche juste un message "bientot disponible" (acceptable en MVP, mais a documenter)

### Angles morts (aucun agent n'a couvert)

1. **SEO de la page /annonce/[uuid]** — le noindex est correct, mais il n'y a pas d'image OG (openGraph.images manquant). Les previews WhatsApp/iMessage seront sans image, ce qui reduit drastiquement le taux de clic pour Thomas.
2. **Rate limiting sur POST /api/annonce** — un utilisateur Pro pourrait creer des milliers d'annonces (pas de limit). Faible risque mais a surveiller.
3. **Nettoyage des annonces expirees** — la table grandira indefiniment. Pas de CRON/job de nettoyage prevu.
4. **Test de l'API INSEE** — l'API INSEE SIRENE necessite un token Bearer en production (pas juste un header Accept). Le fallback pourrait ne pas fonctionner.

---

## 5. Scores par axe

| Axe | Score | Justification |
|---|---|---|
| **Coherence inter-agents** | 7/10 | Specs bien suivies dans l'ensemble, mais 3 edge cases manquants + F6 absent de la page pricing |
| **Qualite code** | 8/10 | Architecture propre, types corrects, securite solide. Point d'attention : email marchand dans API publique |
| **UX / Design** | 8/10 | AuthModal excellent (9/10 auto-evalue, confirme). Page annonce clean et mobile-first. Manque la progression ZIP et les fallbacks edge cases |
| **Contradictions** | 6/10 | 1 contradiction bloquante (410 vs 404), 1 majeure (pricing page), 2 mineures |
| **Completude** | 7/10 | Bouton archiver manquant, barre progression ZIP absente, OG image absente |

**Score global : 7.2/10**

---

## 6. Top 5 corrections prioritaires

### P0 — BLOQUANT

1. **API GET /api/annonce/[uuid] : retourner 404 au lieu de 410 quand annonce archivee/expiree.** Page /annonce/[uuid] : afficher le meme message que "UUID inexistant" pour les annonces archivees. Supprimer la date de publication du message "Annonce expiree". Raison : les specs l'exigent explicitement pour des raisons de securite (ne pas reveler l'existence d'une annonce). Agent : @fullstack.

2. **Page annonce : gerer les edge cases donnees manquantes.** (a) Si sale_price === null ou 0, afficher "Prix sur demande" au lieu de masquer. (b) Si description null, afficher "Description a venir" avec lien vers /mes-biens/[id]. (c) Si tel ET email null, afficher "Coordonnees disponibles sur demande". Agent : @fullstack.

### P1 — MAJEUR

3. **Page pricing : ajouter "Annonces immobilieres publiques" dans les features Pro et Studio.** Sans cette mention, Thomas n'a aucune visibilite sur F6 lors de l'achat. Le pricing-strategy.md le documente, le code ne l'implemente pas. Agent : @fullstack.

4. **Bouton "Archiver l'annonce" sur /mes-biens/[id].** La fonction backend existe (archiveAnnonce dans lib/annonce.ts). Il manque le bouton UI. Sans lui, Thomas ne peut pas desactiver une annonce pour un bien vendu. Agent : @fullstack.

### P2 — AMELIORATION

5. **OpenGraph image sur /annonce/[uuid].** Ajouter la premiere photo du bien comme OG image dans generateMetadata. Impact direct sur le taux de clic des liens WhatsApp partages par Thomas (son usage principal). Agent : @fullstack.

---

## Recommandation

**GO avec reserves.**

Les 2 corrections P0 sont indispensables avant deploy en production. L'implementation F6 est globalement solide et fonctionnelle — le parcours Thomas "creer annonce → copier lien → partager" marche. Les reserves portent sur la securite (410 vs 404) et la completude des edge cases donnees manquantes (cas frequent sur chantier brut, exactement le contexte Thomas).

Les corrections P1 (pricing page + bouton archiver) doivent etre faites dans le meme sprint. Les P2 (OG image) peuvent attendre le sprint suivant.

L'authentification email/password et la recherche entreprise sont conformes et bien implementees.

---

**Handoff → @orchestrator**
- Fichiers produits : `docs/reviews/f6-cross-review.md`
- Decisions prises : GO avec reserves, 2 corrections P0 bloquantes, 2 corrections P1 majeures
- Points d'attention :
  - P0 : API annonce archivee doit retourner 404 (pas 410) — @fullstack
  - P0 : Edge cases donnees manquantes (prix, description, contact) — @fullstack
  - P1 : F6 absent de la page pricing — @fullstack
  - P1 : Bouton archiver annonce manquant dans l'UI — @fullstack
  - P2 : OG image manquante pour previews WhatsApp — @fullstack
  - Surveillance : email marchand expose en clair dans API GET annonce (scraping possible)
  - Surveillance : enumeration d'email via register (409 differencies Google vs email)
