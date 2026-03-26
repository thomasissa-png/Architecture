# Audit clics — Pages 1 a 5

Date : 2026-03-26 | Auditeur : @qa | Source : code source uniquement

---

## 1. Homepage `app/page.tsx` — Score : 8/10

| Element | Action attendue | Statut | Probleme |
|---------|----------------|--------|----------|
| Logo header | Navigation / ancre | WARN | `<span>` non cliquable — pas de lien vers `/` |
| Liens nav (Mes biens, Galerie, Dossiers) | Navigation pages | OK | `<a href>` corrects, affiches si session |
| Lien Tarifs header | Scroll `#pricing` | OK | `<a href="#pricing">` |
| CTA header "Essayer gratuitement" | Scroll `#outil` | OK | `<a href="#outil">` |
| CTA header "Mes biens" (si connecte) | Nav `/mes-biens` | OK | Doublon avec lien nav — pas un bug |
| AuthButton header | Ouvre modal auth | OK | Composant AuthButton present |
| Pills USE_CASES hero | Aucune action | OK | `<span>` non interactifs — correct |
| CTA hero "Essayer gratuitement" | Scroll `#outil` | OK | `<a href="#outil">` |
| Toggle Standard/Marchand | Switch mode | OK | `setIsMerchantMode` correct, conditionne affichage |
| Toggle Interieur/Exterieur | Switch mode | OK | `handleToggleOutdoor` reset cross-states |
| RoomTypePicker | Selectionne type piece | OK | `onSelect={setSelectedRoomType}` |
| StylePicker | Selectionne style | OK | Props correctes |
| Options surfaces/mobilier | Toggle `withFurniture` | OK | `setWithFurniture` |
| Bouton "Generer" | Lance generation | OK | `handleGenerate`, disabled si roomType manquant |
| Bouton "Annuler" generation | Abort fetch | OK | `handleCancelGeneration` avec AbortController |
| Bouton "Reessayer" erreur | Relance generation | OK | `handleRetry` |
| "Affiner ce resultat" | Ouvre RefineModal | OK | `handleOpenRefineModal(index)` |
| "Recharger mes credits" | Scroll pricing | OK | `<a href="#pricing">` |
| "Tout telecharger" | Download batch | OK | `handleDownloadAll` avec watermark |
| "Relancer avec un autre style" | Reset resultats | OK | `handleReset` |
| "Nouvelle session" | Full reset | OK | `handleFullReset` |
| CTA Decouverte "Essayer l'outil" | Scroll `#outil` | OK | `<a href="#outil">` |
| CTA Starter "Acheter" | Nav `/pricing` | OK | `<a href="/pricing">` |
| CTA Pro "Acheter" | Nav `/pricing` | OK | `<a href="/pricing">` |
| Footer "Tarifs" | Scroll `#pricing` | OK | `<a href="#pricing">` |
| Footer "Mentions legales" | Nav page | OK | `<a href="/mentions-legales">` — page existe |
| Footer "CGV" | Nav page | OK | `<a href="/cgv">` — page existe |
| Footer "Confidentialite" | Nav page | OK | `<a href="/confidentialite">` — page existe |
| Footer "Contact" | Mailto | OK | `<a href="mailto:contact@versiroom.fr">` |
| Footer "Versi Immobilier" | Lien externe | OK | `target="_blank" rel="noopener noreferrer"` |

**Bugs :**
- **P2 — Logo non cliquable** : le logo header est un `<span>`, pas un `<a href="/">`. Sur les sous-pages, le logo est un lien. Incoherent.

---

## 2. AuthModal `components/AuthModal.tsx` — Score : 9/10

| Element | Action attendue | Statut | Probleme |
|---------|----------------|--------|----------|
| Backdrop (overlay) | Ferme modal | OK | `onClick={onClose}` |
| Bouton fermer (X) | Ferme modal | OK | `onClick={onClose}`, 44px, aria-label |
| Escape | Ferme modal | OK | `handleKeyDown` dans useEffect |
| "Continuer avec Google" | OAuth Google | OK | `signIn("google", {redirect:true})` |
| Input email | Saisie | OK | `onChange`, required, autoComplete |
| Input mot de passe | Saisie | OK | type toggle, autoComplete adapte au mode |
| Toggle visibilite mdp | Affiche/masque | OK | `setShowPassword`, aria-label dynamique |
| "Mot de passe oublie ?" | Action | WARN | Affiche message placeholder "bientot disponible" — pas de vrai flow |
| Submit "Se connecter" | Login credentials | OK | `signIn("credentials", {redirect:false})` + redirect manuelle |
| Submit "Creer mon compte" | Register + login | OK | POST `/api/auth/register` puis signIn |
| "Creer un compte" toggle | Switch register | OK | `setMode("register")`, reset erreurs |
| "Se connecter" toggle | Switch login | OK | `setMode("login")`, reset erreurs |
| Lien CGV | Nav `/cgv` | OK | `<a href="/cgv">` |
| Lien Confidentialite | Nav `/confidentialite` | OK | `<a href="/confidentialite">` |
| Focus trap | Piege le focus dans modal | OK | Tab/Shift+Tab geres |
| Body scroll lock | Empeche scroll derriere | OK | `document.body.style.overflow = "hidden"` |

**Bugs :**
- Aucun bug fonctionnel. Le "Mot de passe oublie" est un WARN (feature non implementee, message explicite).

---

## 3. Fiche bien `app/mes-biens/[id]/page.tsx` — Score : 8/10

| Element | Action attendue | Statut | Probleme |
|---------|----------------|--------|----------|
| Header logo | Nav `/` | OK | `<a href="/">` |
| Header nav links | Navigation | OK | Mes biens, Galerie, Dossiers |
| Breadcrumb "Mes biens" | Nav `/mes-biens` | OK | `<a href="/mes-biens">` |
| Lien "Retour a mes biens" (erreur) | Nav retour | OK | `<a href="/mes-biens">` |
| "Modifier la description" | Ouvre edition | OK | `setIsEditingDesc(true)`, pre-remplit |
| "Enregistrer" description | PATCH API | OK | `handleSaveDescription` → PATCH `/api/properties/${id}` |
| "Annuler" description | Ferme edition | OK | `setIsEditingDesc(false)` |
| Formulaire infos complementaires | Saisie DPE, GES, etc. | OK | Tous les inputs correctement lies a `compInfo` |
| "Enregistrer" infos comp. | PATCH API | OK | `handleSaveCompInfo`, feedback "Enregistre" |
| "+ Associer des photos" | Ouvre modal + fetch | OK | `fetchUnassociated()` + `setShowAssociateModal(true)` |
| "+ Generer pour ce bien" | Ouvre InlineGenerator | OK | `setShowGenerator(true)` |
| "Retirer" photo | Dissocie photo | OK | `handleDissociate(photo.id)` → DELETE API |
| "Creer un dossier" | Ouvre modal dossier | OK | `setShowDossierModal(true)`, reset state |
| "Creer une annonce" | POST API + ouvre onglet | OK | `handleCreateAnnonce`, `window.open` |
| "Archiver l'annonce" | POST archive | OK | `handleArchiveAnnonce`, disabled pendant archivage |
| Modal associer : selection photos | Toggle selection | OK | `setSelectedForAssoc` avec Set |
| Modal associer : "Associer N photos" | POST API | OK | `handleAssociatePhotos`, disabled si 0 |
| Modal associer : fermer (X) | Ferme + reset | OK | Reset selectedForAssoc |
| Modal associer : Escape | Ferme modal | OK | Focus trap + Escape handler |
| Modal dossier : selection photos | Toggle + cover | OK | `toggleDossierPhoto`, gestion coverPhotoId |
| Modal dossier : creer | POST API dossier | OK | `handleCreateDossier` |
| Modal dossier : PDF link | Ouvre PDF | OK | `<a target="_blank">` |
| Carte OSM | Affichage iframe | OK | Conditionnel sur lat/lng |
| Toast messages | Auto-dismiss 4s | OK | `setTimeout` dans useEffect |

**Bugs :**
- **P2 — Lien pricing 404** : `handleCreateAnnonce` affiche `<a href="/pricing">` dans le toast quand 403. La page `/pricing` existe, mais c'est un toast JSX donc le lien ne sera pas forcement navigable selon l'implementation du toast. Risque faible.
- **P2 — Pas de feedback erreur utilisateur sur handleDissociate/handleAssociatePhotos** : les catch ne font que `console.error`. L'utilisateur ne voit aucun message d'erreur si l'API echoue.

---

## 4. Ma galerie `app/ma-galerie/page.tsx` — Score : 8/10

| Element | Action attendue | Statut | Probleme |
|---------|----------------|--------|----------|
| Header logo | Nav `/` | OK | `<a href="/">` |
| Header nav links | Navigation | OK | Mes biens, Dossiers, Galerie (active) |
| "Se connecter" (non auth) | Ouvre AuthModal | OK | `setAuthModalOpen(true)`, callbackUrl="/ma-galerie" |
| Filtre style (select) | Filtre par style | OK | `setFilterStyle` + `setIsLoading(true)` |
| Filtre type piece (select) | Filtre par room | OK | `setFilterRoomType` + `setIsLoading(true)` |
| Filtre association (select) | Filtre associees | OK | `setFilterAssociated` + `setIsLoading(true)` |
| Clic sur photo card | Ouvre modal detail | OK | `setSelectedPhoto(photo)` |
| "Associer" (photo non classee) | Toggle dropdown | OK | `setAssociatingPhotoId`, stopPropagation |
| Selection bien dans dropdown | POST association | OK | `handleAssociate(photoId, propertyId)` |
| Modal detail : fermer (X) | Ferme modal | OK | `setSelectedPhoto(null)` |
| Modal detail : clic backdrop | Ferme modal | OK | `onClick={() => setSelectedPhoto(null)}` |
| Modal detail : stopPropagation | Empeche fermeture | OK | `onClick={e => e.stopPropagation()}` |
| "Generer ma premiere photo" (vide) | Nav `/#outil` | OK | `<a href="/#outil">` |

**Bugs :**
- **P1 — Filtre declenche isLoading mais pas re-fetch immediat** : `setIsLoading(true)` est appele dans onChange, mais le re-fetch depend du useEffect sur `[filterStyle, filterRoomType, filterAssociated]` via `fetchPhotos`. Le probleme : `setIsLoading(true)` est mis AVANT que fetchPhotos ne soit appele, mais `fetchPhotos` met `setIsLoading(false)` dans son `finally`. Cela fonctionne en pratique car React batche les setState et le useEffect re-triggere fetchPhotos. Cependant, si les filtres changent vite, `isLoading` pourrait rester `true` indefiniment car le premier fetch met `false` avant que le second ne commence. Risque **faible** en pratique.
- **P2 — Pas de gestion Escape sur modal detail** : le modal detail photo n'a pas de handler Escape ni de focus trap, contrairement aux modals de la fiche bien et AuthModal.
- **P2 — Pas de feedback erreur sur handleAssociate** : catch silencieux, `console.error` seulement.

---

## 5. Mes biens `app/mes-biens/page.tsx` — Score : 8/10

| Element | Action attendue | Statut | Probleme |
|---------|----------------|--------|----------|
| Header logo | Nav `/` | OK | `<a href="/">` |
| Header nav links | Navigation | OK | Mes biens (active), Galerie, Dossiers |
| ProGate wrapper | Gate pro | OK | Bloque si pas Pro, montre upgrade prompt |
| "+ Nouveau bien" | Toggle formulaire | OK | `setShowCreateForm(!showCreateForm)` |
| Input adresse + autocomplete | Saisie + suggestions | OK | `handleAddressInput` avec debounce 300ms |
| Selection suggestion | Remplit adresse | OK | `selectSuggestion(s)` via onMouseDown |
| Select type de bien | Saisie | OK | `setNewType` |
| Inputs surface/pieces/prix | Saisie | OK | Tous lies aux states |
| "Creer le bien" | POST API + redirect | OK | `handleCreate` → POST `/api/properties` → redirect fiche |
| "Annuler" creation | Ferme formulaire | OK | `setShowCreateForm(false)` |
| "Ajouter mon premier bien" (vide) | Ouvre formulaire | OK | `setShowCreateForm(true)` |
| Clic sur carte bien | Nav fiche | OK | `<a href="/mes-biens/${id}">` |
| Affichage erreur creation | Message visible | OK | `createError` affiche dans `<p>` |

**Bugs :**
- **P2 — Formulaire non reset apres fermeture** : si l'utilisateur remplit partiellement le formulaire, clique "Annuler", puis reouvre avec "+ Nouveau bien", les anciens champs sont encore remplis. Pas de reset des states `newAddress`, `newType`, `newSurface`, `newRooms`, `newPrice`.
- **P2 — onBlur autocomplete avec setTimeout 200ms fragile** : le `setTimeout(() => setShowSuggestions(false), 200)` sur onBlur peut causer un flash ou un clic rate sur mobile si le delai est trop court.

---

## Synthese bugs

### P0 (bloquant)
Aucun.

### P1 (haute)
| # | Page | Bug |
|---|------|-----|
| 1 | Ma galerie | Modal detail sans Escape ni focus trap (incoherent avec le reste de l'app) |

### P2 (moyenne)
| # | Page | Bug |
|---|------|-----|
| 2 | Homepage | Logo header est un `<span>` non cliquable |
| 3 | Fiche bien | Erreurs API silencieuses sur dissociation/association (pas de feedback user) |
| 4 | Ma galerie | Erreurs API silencieuses sur association |
| 5 | Mes biens | Formulaire creation non reset a la fermeture |
| 6 | Mes biens | onBlur autocomplete fragile (200ms timeout) |
| 7 | Fiche bien | Toast JSX avec lien `/pricing` potentiellement non cliquable |

### Scores
| Page | Score |
|------|-------|
| Homepage | 8/10 |
| AuthModal | 9/10 |
| Fiche bien | 8/10 |
| Ma galerie | 8/10 |
| Mes biens | 8/10 |
| **Moyenne** | **8.2/10** |
