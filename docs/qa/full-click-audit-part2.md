# Audit clics — Pages 6 a 10

Date : 2026-03-26 | Auditeur : @qa

---

## 6. Mes dossiers (`app/mes-dossiers/page.tsx`) — Score : 8/10

| Element | Action attendue | Statut | Probleme |
|---------|----------------|--------|----------|
| ProGate wrapper | Bloque si non-Pro, fetch `/api/user/credits` | OK | |
| Logo header "Versiroom" | `<a href="/">` — retour accueil | OK | |
| Nav "Mes biens" | `<a href="/mes-biens">` | OK | |
| Nav "Ma galerie" | `<a href="/ma-galerie">` | OK | |
| Nav "Mes dossiers" | Lien actif (text-sage, pas de href fonctionnel) | WARN | Meme href que la page courante, pas de `aria-current="page"` |
| AuthButton | Composant externe, deleguee | OK | |
| Bouton "Creer un dossier" (empty state) | `<a href="/">` — retour accueil | WARN | Redirige vers la home, pas vers un flow de creation direct |
| Carte dossier (click) | `<a href="/dossier/${uuid}">` | OK | |
| Bouton "Copier le lien" | `e.preventDefault()` + `e.stopPropagation()` + clipboard | OK | Bon pattern anti-propagation |
| Copier le lien — feedback | `setCopiedUuid` + timeout 2s | OK | |
| Redirect 401 sur fetch | `window.location.href = "/"` | OK | |
| Session absente | `return null` — page blanche | WARN | Pas de redirect explicite ni de message |

**Bugs :**
- P2 : Lien nav "Mes dossiers" sans `aria-current="page"` (accessibilite)
- P2 : Session absente = rendu `null` silencieux, pas de redirect vers login

---

## 7. Page annonce (`app/annonce/[uuid]/page.tsx`) — Score : 9/10

| Element | Action attendue | Statut | Probleme |
|---------|----------------|--------|----------|
| Header logo/initiales merchant | Affichage conditionnel logo > initiales > "Versiroom" | OK | |
| Hero photo | `<img>` premier output living_room ou premier global | OK | |
| Pills info (surface, pieces, ville, prix) | Affichage conditionnel | OK | |
| Prix moyen DVF | Pill sage si `dvf_median_price_m2` | OK | |
| CTA "Appeler" (inline) | `<a href="tel:${telephone}">` conditionnel si merchant+tel | OK | |
| RoomNav pills | `document.getElementById(id).scrollIntoView()` | OK | Ancres `piece-${roomType}` presentes dans AnnonceGallery |
| AnnonceGallery — click photo | Ouvre Lightbox au bon index via `photoIdToFlatIndex` | OK | |
| Lightbox — fermeture | Click backdrop / bouton X / Escape | OK | |
| Lightbox — navigation | Fleches clavier + swipe touch + boutons | OK | |
| Lightbox — boutons prev/next | `e.stopPropagation()` pour ne pas fermer | OK | |
| AnnoncePublicView — Copier lien | `navigator.clipboard.writeText(url)` | OK | |
| AnnoncePublicView — Copier description | Ajoute disclaimer + clipboard | OK | |
| AnnoncePublicView — WhatsApp/Partager | `navigator.share` avec fallback `wa.me` | OK | |
| AnnoncePublicView — Download ZIP | JSZip dynamique, batch 5, blob URL + revoke | OK | |
| AnnoncePublicView — Afficher email | Click-to-reveal anti-scraping | OK | |
| Email revealed — click | `<a href="mailto:${email}">` | OK | |
| Contact section — telephone | `<a href="tel:${telephone}">` | OK | |
| ContactSticky — telephone | `<a href="tel:...">` sticky bottom | OK | |
| ContactSticky — email fallback | `<a href="mailto:...">` avec subject | OK | |
| ContactSticky — aucun contact | Fallback `contact@versiroom.fr` | WARN | L'email versiroom.fr est-il configure ? |
| Footer — lien Versiroom | `target="_blank" rel="noopener noreferrer"` | OK | |

**Bugs :**
- P2 : ContactSticky affiche TOUJOURS un CTA (fallback versiroom.fr) — verifier que l'email existe

---

## 8. Page dossier (`app/dossier/[uuid]/page.tsx`) — Score : 8.5/10

| Element | Action attendue | Statut | Probleme |
|---------|----------------|--------|----------|
| Header logo/initiales merchant | Meme logique que page annonce | OK | |
| Hero photo | Premier completedPhoto output | OK | |
| Carte OSM (iframe) | Embed OSM si lat/lng, sinon image statique | OK | |
| DossierCaracteristiques | Server component, affichage conditionnel | OK | |
| ShareButtons — Copier lien | `navigator.clipboard.writeText(url)` | OK | |
| ShareButtons — WhatsApp/Partager | `navigator.share` + fallback `wa.me` | OK | |
| RoomNav pills | Scroll vers `piece-${photo.id}` | OK | Ancres presentes dans DossierPublicView |
| DossierPublicView — click avant | Ouvre Lightbox index `photoIndex * 2` | OK | |
| DossierPublicView — click apres | Ouvre Lightbox index `photoIndex * 2 + 1` | OK | |
| Lightbox — navigation complete | Clavier + swipe + boutons + backdrop close | OK | |
| PDF download | `<a href="/api/dossier/${uuid}/pdf">` | OK | Route GET existante, pdf-lib |
| ContactSticky | Meme composant que page annonce | OK | |
| Footer — date expiration | `new Date(dossier.expires_at).toLocaleDateString("fr-FR")` | OK | |
| Footer — lien Versiroom | `target="_blank" rel="noopener noreferrer"` | OK | |
| Dossier expire | Message clair + date de creation | OK | |
| ShareButtons — clipboard fail | `catch` silencieux, pas de feedback erreur | WARN | Echec silencieux si clipboard indisponible |

**Bugs :**
- P2 : ShareButtons.handleCopyLink — `catch` vide sans feedback utilisateur (vs AnnoncePublicView qui affiche "Copie impossible")

---

## 9. Compte (`app/compte/page.tsx`) — Score : 8.5/10

| Element | Action attendue | Statut | Probleme |
|---------|----------------|--------|----------|
| Logo header | `<a href="/">` | OK | |
| AuthButton (header) | Composant externe | OK | |
| AuthButton (non connecte) | Affiche le bouton connexion | OK | |
| Checkbox "Je suis marchand" | `setIsMerchant(e.target.checked)` | OK | |
| Recherche entreprise — input Enter | `handleCompanySearch()` | OK | |
| Recherche entreprise — bouton | `handleCompanySearch()`, disabled si < 2 chars | OK | |
| Resultats recherche — click entreprise | `selectCompany()` remplit SIRET + raison sociale + adresse + forme juridique | OK | |
| Resultats recherche — click exterieur | `document.addEventListener("mousedown")` ferme le dropdown | OK | |
| SIRET — bouton Rechercher | `handleSiretLookup()`, validation 14 chiffres | OK | |
| SIRET — erreur format | Message "14 chiffres" | OK | |
| SIRET — erreur 503 | Message "service indisponible" | OK | |
| Logo — bouton upload | `logoInputRef.current?.click()` ouvre file picker | OK | |
| Logo — input file change | Validation type MIME + taille 2Mo + upload POST | OK | |
| Couleur principale — color picker | `setCouleurPrincipale` | OK | |
| Couleur principale — input hex | Regex validation `#[0-9A-Fa-f]{0,6}` | OK | |
| Couleur secondaire | Meme logique | OK | |
| Police — select | `setPolice(e.target.value)` | OK | |
| Apercu branding | Rendu live couleurs + police + raison sociale | OK | |
| Bouton "Enregistrer le profil" | PUT `/api/merchant/profile` avec tous les champs | OK | |
| Feedback sauvegarde | Message success (3s auto-dismiss) ou erreur | OK | |
| Lien "Voir mes biens" (apres save) | `<a href="/mes-biens">` conditionnel apres success | OK | |
| ProGate "Rafraichir la page" | `window.location.reload()` | OK | |
| ProGate "Decouvrir les offres Pro" | `<a href="/#pricing">` | OK | |

**Bugs :**
- P2 : La page Compte n'a PAS de ProGate wrapper (contrairement a /mes-dossiers) — un utilisateur non-Pro peut acceder au formulaire marchand et enregistrer un profil. Verifier si c'est intentionnel.

---

## 10. InlineGenerator (`components/InlineGenerator.tsx`) — Score : 9/10

| Element | Action attendue | Statut | Probleme |
|---------|----------------|--------|----------|
| Bouton "Fermer" (header) | `handleClose()` — confirm si generating + abort | OK | |
| Photo toggle (click) | `togglePhoto(id)` — toggle dans Set | OK | |
| "Tout selectionner" | `selectAll()` — toutes les photos avec input | OK | |
| "Tout deselectionner" | `deselectAll()` — vide le Set | OK | |
| "Choisir le style" | `setStep("style")`, disabled si 0 selection | OK | |
| "Retour a la selection" | `setStep("select")` | OK | |
| StylePicker | Composant externe, props correctes | OK | |
| "Lancer la generation" | `handleGenerate()`, disabled si pas de style | OK | |
| Generation — semaphore | Max 2 concurrentes via `createSemaphore(2)` | OK | |
| Generation — abort | `AbortController` respecte dans `generateOne` | OK | |
| Timer generation | `setInterval` 1s, cleanup propre | OK | |
| Resultats — ImageComparator | Avant/apres pour chaque succes | OK | |
| Resultats — "Reessayer" (erreur) | `handleRetry(i)` relance la photo echouee | OK | |
| "Associer les resultats" | POST `/api/properties/${propertyId}/photos` | OK | |
| "Associer" — callback | `onPhotosGenerated()` si res.ok | OK | |
| "Fermer" (resultats) | `handleClose()` — appelle `onClose()` | OK | |
| Fermer pendant generation | `window.confirm()` + abort + cleanup timer | OK | |
| Scroll into view au mount | `containerRef.current?.scrollIntoView()` | OK | |
| Cleanup timer unmount | `useEffect` return cleanup | OK | |
| Erreur associer photos | `console.error` uniquement | WARN | Pas de feedback utilisateur |

**Bugs :**
- P2 : `handleAssociateResults` — erreur silencieuse (catch console.error sans message UI)

---

## Resume bugs

### P0 (bloquant)
Aucun.

### P1 (haute)
Aucun.

### P2 (moyenne)
1. **Mes dossiers** : `aria-current="page"` manquant sur nav active
2. **Mes dossiers** : session absente = `return null` silencieux
3. **Page annonce** : ContactSticky fallback `contact@versiroom.fr` — email a verifier
4. **Page dossier** : ShareButtons clipboard fail = echec silencieux (pas de feedback)
5. **Compte** : pas de ProGate — marchand accessible sans Pro (a confirmer si intentionnel)
6. **InlineGenerator** : `handleAssociateResults` erreur sans feedback UI

### Score global : 8.6/10

Les 5 pages sont fonctionnellement solides. Aucun bug bloquant. Les handlers font ce qu'ils doivent. Les patterns sont coherents (stopPropagation, abort, cleanup). Les seuls manques sont de l'ordre du feedback utilisateur sur les cas d'erreur et un point d'accessibilite.
