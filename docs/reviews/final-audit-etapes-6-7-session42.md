# Audit final -- Etapes 6 et 7 du parcours marchand
**Auditeur** : Thomas Berger (marchand de biens, Bordeaux)
**Date** : 2026-04-10
**Session** : 42
**Fichiers audites** :
- `app/projet/[id]/generation/page.tsx`
- `app/api/pro/projects/[id]/generate/route.ts`
- `app/projet/[id]/dossier/page.tsx`
- `app/api/pro/projects/[id]/dossier/pdf/route.ts`
- `app/projet/partage/[token]/page.tsx`
- `app/api/pro/projects/[id]/share-token/route.ts`

---

## Etape 6 -- Generation des visuels

### Note : 9.6 / 10

### Tableau des 10 criteres

| # | Critere | Note | Observation |
|---|---------|------|-------------|
| 1 | Retrouvabilite | 10/10 | L'adresse du bien est affichee en haut avec le type de bien en badge. Le stepper affiche clairement l'etape 6. Je sais exactement ou je suis et sur quel projet. |
| 2 | Prix/valeur | 9/10 | L'estimation de temps est affichee ("~X minutes estimees") et le timer tourne en temps reel. Pas de cout affiche en EUR ici mais c'est normal -- le paiement est en amont. Le TODO `checkMerchantCredits` dans la route est encore commente mais c'est backend, invisible pour moi. |
| 3 | Qualite pro | 10/10 | Les vrais prompts v57 sont utilises via `getStyleById()`, les dimensions sont injectees via `sharp`, `extractRoomInventory()` fait l'inventaire de la piece par vision. Pipeline 2 passes complet (surfaces puis mobilier). C'est la vraie qualite pro. |
| 4 | Partage acquereurs | N/A | Pas de partage a cette etape -- c'est l'etape 7. |
| 5 | Gestion d'erreur | 10/10 | Erreur globale : message clair + bouton "Reessayer" avec min-h-[44px]. Erreur par piece : message d'erreur affiche + bouton "Reessayer cette piece" avec min-h-[44px]. Retry individuel via `retryingRooms: Set<string>` (pas un boolean global). Rate limit 409 intercepte avec message comprehensible. Photo introuvable : message explicite par piece. |
| 6 | Simplicite | 10/10 | La page se lance toute seule au mount. Check du statut avant de relancer (pas de double generation). Barre de progression + timer + statut par piece. Quand c'est fini : "Voir le dossier" en vert. Zero decision a prendre pour moi. |
| 7 | Confiance | 10/10 | Stepper ProStepper visible, header interne, couleurs Versimo, badge type de bien. C'est propre et pro. Statut par piece avec pastille coloree (bleu en cours, vert done, rouge erreur). |
| 8 | Completude | 9/10 | Adresse, type de bien, nom de chaque piece, nom du lot, style badge (STYLE_LABELS), statut, timer, progression. Image intermediaire (pass1) affichee en blur pendant que la passe 2 tourne -- cascade correcte. Il manque juste la surface de chaque piece dans les cards (elle est en DB mais pas affichee). |
| 9 | Mobile-first | 10/10 | Grille responsive `grid-cols-1 sm:grid-cols-2`. Tous les boutons retry ont `min-h-[44px]`. Le bouton principal "Voir le dossier" a la bonne taille. Pas de scroll horizontal. |
| 10 | Rapidite | 9/10 | Max 2 pieces en parallele (`MAX_CONCURRENT = 2`). Route deadline de 150s pour eviter les 504 Replit. Le timer affiche le temps reel. Estimation dynamique affichee. Le check au mount evite de relancer une generation deja terminee. |

### Points positifs (5 max)

1. **Check au mount** -- Si je reviens sur cette page et que la generation est deja terminee, ca m'affiche directement les resultats. Pas de re-generation inutile. C'est exactement ce qu'il faut.
2. **Retry individuel par piece** -- Si 1 piece sur 5 plante, je ne relance pas tout. Le bouton "Reessayer cette piece" est clair et visible. Le state est indexe par `Set<string>`, pas un boolean global.
3. **Cascade d'images** -- Pendant la passe 2, l'image de la passe 1 (surfaces) s'affiche en blur. Je vois deja quelque chose au lieu d'un spinner vide. C'est bien pense.
4. **Pipeline v57 complet** -- `getStyleById()`, `extractRoomInventory()`, dimensions via `sharp`. Les 17 sprints d'optimisation des prompts sont bien cables. C'est pas une version degradee du pipeline.
5. **Feedback temps reel** -- Timer, barre de progression, statut par piece avec animation pulse, estimation dynamique. Je sais toujours ou j'en suis.

### Problemes restants

| Severite | Probleme | Detail |
|----------|----------|--------|
| P3 | Surface piece non affichee | La surface_m2 est en DB et lue dans la query, mais pas affichee dans les cards de generation. Pas bloquant -- elle apparait dans le dossier et le PDF. |
| P3 | TODO credits | Le `checkMerchantCredits` est commente dans la route. Pas visible par l'utilisateur mais a implementer avant le lancement commercial. |

---

## Etape 7 -- Dossier + Partage + PDF

### Note : 9.6 / 10

### Tableau des 10 criteres

| # | Critere | Note | Observation |
|---|---------|------|-------------|
| 1 | Retrouvabilite | 10/10 | Adresse du projet affichee, stepper a l'etape 7, lots nommes avec badges style + cible acheteur. Bouton "Voir tous mes biens" pour retrouver les autres projets. |
| 2 | Prix/valeur | 9/10 | Le prix du bien est affiche dans le PDF (page de couverture, formate en EUR). Le prix apparait aussi sur la page publique. Le cout de la generation n'est pas affiche ici mais c'est normal -- il est en amont. |
| 3 | Qualite pro | 10/10 | PDF avec pdf-lib : cover page avec branding marchand (raison_sociale), adresse, type, surface, nombre de lots/pieces, prix, date. Pages par lot avec description commerciale. Photos avant/apres empilees par piece. Page recommandations avec pastilles d'impact. Footer avec disclaimer IA. Le room_type est traduit via `roomTypeLabel()`. WinAnsi sanitize pour les caracteres speciaux. C'est une plaquette pro. |
| 4 | Partage acquereurs | 10/10 | Lien partage via page publique `/projet/partage/[token]` (sans auth). Token UUID genere via `getOrCreateShareToken()`. Boutons : Copier le lien, WhatsApp (avec `navigator.share` sur mobile), Email. Page publique avec branding marchand, visuels avant/apres, prix, description commerciale, OG metadata dynamiques (titre, description, image). Preview WhatsApp propre grace aux OG tags. |
| 5 | Gestion d'erreur | 10/10 | Page publique : token invalide = message "Dossier introuvable" clair. Dossier page : erreur de chargement avec bouton "Reessayer". Erreur PDF : message explicite dans un role="alert". Description IA : erreur isolee par lot (pas de crash global). Blob URL cleanup au unmount (pas de fuite memoire). |
| 6 | Simplicite | 10/10 | Le PDF se genere automatiquement au chargement (auto-trigger). L'apercu s'affiche en inline avec fallback. Un clic pour telecharger, un clic pour copier le lien. Description commerciale : "Generer par IA" ou "Modifier" -- 2 actions claires. Toast de confirmation "Lien copie". |
| 7 | Confiance | 10/10 | Branding marchand partout : raison_sociale dans le header de la page publique, dans le footer du PDF, dans le disclaimer. Page publique : header sticky avec nom du marchand, footer avec coordonnees (raison_sociale, telephone, email_pro). Disclaimer clair "visuels generes par IA a titre indicatif -- le bien est livre brut". |
| 8 | Completude | 10/10 | Page dossier : visuels avant/apres par piece, description commerciale editable + generee par IA, badges style + cible acheteur, nombre de visuels/pieces. PDF : cover page (titre, adresse, type, surface, lots, pieces, prix, date, branding), pages lot (meta, description, liste pieces), pages piece (avant/apres empiles, room_type traduit), pages recommandations (titre, description, cout, impact). Page publique : adresse, type, surface, lots, prix, visuels, description, coordonnees marchand. |
| 9 | Mobile-first | 10/10 | Tous les boutons de partage/PDF ont `min-h-[44px]`. Grille responsive `grid-cols-1 sm:grid-cols-2`. Barre d'actions en `flex-wrap` (s'empile sur mobile). Page publique responsive avec `px-5 sm:px-8`. Labels avant/apres en position absolute avec taille lisible. |
| 10 | Rapidite | 9/10 | PDF auto-genere au chargement (pas de clic supplementaire). Share token fetche en parallele. Descriptions initialisees depuis les donnees existantes. Le seul point : le PDF est genere cote client via fetch+blob, ce qui peut prendre quelques secondes pour un gros dossier -- mais le spinner est la et le resultat s'affiche en inline. |

### Points positifs (5 max)

1. **Page publique sans auth** -- Mon acquereur clique sur le lien WhatsApp et voit directement le dossier. Pas de compte a creer, pas de login. C'est exactement ce dont j'ai besoin. Le branding est celui de ma societe, pas Versimo en gros.
2. **PDF brande** -- Cover page avec ma raison_sociale, adresse du bien, prix formate en EUR, date. Footer sur chaque page avec mon nom + Versimo. C'est une vraie plaquette pro que je peux envoyer par email.
3. **OG metadata dynamiques** -- Quand mon acquereur recoit le lien WhatsApp, il voit une preview avec le titre "Dossier -- [adresse]", la description avec type/surface/prix, et le premier visuel meuble comme image. C'est propre.
4. **Description commerciale IA + editable** -- Je peux generer la description par IA puis la modifier manuellement. Le textarea avec auto-focus est bien pense. La sauvegarde est non-bloquante (fire-and-forget style).
5. **"Modifier les visuels" au lieu de "Retour"** -- Le bouton secondaire dit clairement ce qu'il fait. Si les visuels ne me plaisent pas, je sais que je peux les retoucher.

### Problemes restants

| Severite | Probleme | Detail |
|----------|----------|--------|
| P3 | PDF inline non visible sur iOS Safari | Le `<object data={pdfUrl} type="application/pdf">` ne s'affiche pas sur certains navigateurs mobiles (Safari iOS notamment). Le fallback est present (bouton "Telecharger le PDF") mais l'apercu inline sera invisible. Alternative : convertir en images ou utiliser un viewer JS type pdf.js. Non bloquant car le telechargement fonctionne. |
| P3 | Pas de DPE dans le PDF | Le DPE (Diagnostic de Performance Energetique) n'est ni dans la DB ni dans le PDF. Pour un dossier de pre-commercialisation, c'est un manque mais pas bloquant -- le DPE est souvent ajoute manuellement. |
| P3 | Page publique : pas de bouton "Contacter" | La page publique affiche les coordonnees du marchand en footer mais pas de bouton d'action type "Contacter" ou "Demander une visite". L'acquereur doit scroller jusqu'en bas pour trouver le telephone. |

---

## Verdict global

| Etape | Note | Verdict |
|-------|------|---------|
| Etape 6 -- Generation | 9.6 / 10 | **PASS** (>= 9.5) |
| Etape 7 -- Dossier + Partage + PDF | 9.6 / 10 | **PASS** (>= 9.5) |

**Moyenne** : 9.6 / 10

Les deux etapes atteignent le seuil de 9.5/10. Les corrections listees dans le brief sont toutes en place et verifiees dans le code source. Les problemes restants sont tous P3 (ameliorations futures, aucun bloquant).

Le parcours marchand complet de la generation au partage est fluide, pro, et adapte a mon usage quotidien : je prends mes photos sur chantier, je lance la generation, je recupere mon dossier PDF brande, et j'envoie le lien WhatsApp a mes acquereurs en 2 taps. C'est exactement le "game changer" dont j'avais besoin.
