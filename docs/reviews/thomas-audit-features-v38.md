# Audit features recentes -- Thomas Berger, marchand de biens

> Auditeur : Thomas Berger, 35 ans, Bordeaux, iPhone 15 Pro + laptop Windows.
> Methode : lecture code source de chaque feature, simulation du parcours mental.
> Date : 2026-04-01
> Derniere reference : f4-final-verdict-thomas.md (8.8/10 le 25 mars)

---

## Synthese executive

| Feature | Note | Verdict |
|---|---|---|
| 1. Archivage de biens | 7.0/10 | Fonctionnel, 4 frictions |
| 2. Archivage de photos galerie | 7.5/10 | Fonctionnel, 3 frictions |
| 3. Iteration mode pro (3 affinages) | 8.5/10 | Solide, 2 frictions |
| 4. Menu simplifie | 9.5/10 | Excellent |
| 5. Photos pro dans la galerie | 9.0/10 | Solide, 1 friction mineure |

**Score global session : 8.3/10**
Sous le seuil 9.5/10. Les features repondent a des besoins reels mais l'execution a des trous.

---

## Feature 1 -- Archivage de biens (7.0/10)

**Ce que Thomas voit :**
Un lien texte discret "Archiver ce bien" en bas de la fiche bien, avant "Supprimer ce bien". Clic -> confirm() natif du navigateur -> redirection vers /mes-biens.

**Ce qui fonctionne :**
- La separation archiver/supprimer est la bonne idee. Un bien vendu n'est pas un bien supprime -- je peux avoir besoin de la plaquette 6 mois plus tard pour un dossier fiscal.
- Le confirm() empeche l'archivage accidentel.
- L'API est propre : POST avec action "archive"/"unarchive", verif owner.
- Le filtre backend exclut les biens archives de la liste par defaut (`status != 'archived'`).

**Frictions identifiees :**

### P0 -- Aucun moyen de retrouver un bien archive
C'est le probleme fondamental. J'archive un bien vendu en janvier. En septembre, l'acquereur me rappelle pour un contentieux -- j'ai besoin du dossier, de l'annonce, des photos. Il n'y a AUCUN bouton "Voir les archives" dans `/mes-biens/page.tsx` (verifie : zero reference a "archiv" dans ce fichier). Le bien est perdu dans un trou noir. Pour un marchand qui fait 8-12 ops/an, c'est un vrai probleme de retrouvabilite.

**Correction requise :** Ajouter un toggle "Voir les archives" dans /mes-biens (meme pattern que /mes-dossiers qui a deja `showArchived`).

### P1 -- Le bouton est trop petit pour mobile (pas de min-h-[44px])
Le bouton "Archiver ce bien" a pour classe `text-xs text-muted font-light` sans aucun `min-h-[44px]` ni padding vertical. Sur mon iPhone 15 Pro, c'est un lien texte de ~12px de haut. Le target tactile est bien en-dessous des 44px minimum Apple. A cote, le bouton "Supprimer ce bien" souffre du meme probleme.

**Correction requise :** Ajouter `min-h-[44px] inline-flex items-center` aux deux boutons.

### P1 -- Le toast d'erreur est rouge pour TOUS les messages
Le toast dans `mes-biens/[id]/page.tsx` (l.1289) utilise `bg-red-500/90` en dur. Si l'archivage echoue, le message "Erreur lors de l'archivage" apparait en rouge -- c'est correct. Mais si d'autres actions sur la page utilisent le meme toast pour un succes (comme "Annonce archivee" l.454), le rouge est trompeur. Thomas voit rouge = "ca a plante", meme si ca a marche.

**Correction requise :** Toast conditionnel : vert pour succes, rouge pour erreur.

### P2 -- Pas de feedback de succes apres archivage
Quand l'archivage reussit, l'utilisateur est redirige vers /mes-biens via `window.location.href`. Pas de toast "Bien archive", pas de confirmation visuelle. Thomas clique, l'ecran change, il doit deviner que ca a marche en constatant que le bien n'est plus dans la liste.

**Correction requise :** Ajouter un toast ou un message flash apres la redirection (query param `?archived=true` -> banner ephemere).

---

## Feature 2 -- Archivage de photos galerie (7.5/10)

**Ce que Thomas voit :**
Une petite icone de boite d'archive sur chaque carte photo (en haut a droite). Visible en permanence sur mobile, au hover sur desktop. Clic -> confirm() natif -> photo disparait.

**Ce qui fonctionne :**
- L'icone est bien visible sur mobile grace a `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`. Bonne pratique -- c'est le fix de la friction F1 du dernier audit.
- Le confirm() est explicite : "Archiver cette photo ? Elle disparaitra de la galerie." Thomas comprend la consequence.
- Le toast "Photo archivee." confirme l'action.
- Le `fetchPhotos()` rafraichit la liste immediatement.

**Frictions identifiees :**

### P0 -- Aucun moyen de retrouver une photo archivee
Meme probleme que pour les biens. Pas de bouton "Voir les photos archivees" dans /ma-galerie (verifie : zero reference a "unarchive" ou "voir archiv" dans le fichier). L'archivage est unidirectionnel -- c'est une suppression deguisee. Thomas qui archive par erreur une photo de son dossier Bordeaux perd le visuel definitivement (du point de vue UI).

**Correction requise :** Ajouter un toggle "Voir les archivees" dans /ma-galerie.

### P1 -- Le toast est rouge pour un message de succes
Meme probleme que la fiche bien : le toast (l.564 de ma-galerie/page.tsx) utilise `bg-red-500/90` pour afficher "Photo archivee." -- un message de succes en rouge.

**Correction requise :** Toast conditionnel vert/rouge.

### P1 -- Le confirm() natif casse l'experience premium
Versimo se positionne Apple/Foster+Partners. Le `confirm()` natif du navigateur ("Archiver cette photo ?") est un rectangle gris systeme qui casse l'immersion. Le bien a un `alertdialog` custom pour la suppression -- pourquoi pas pour l'archivage galerie ?

**Correction recommandee :** Remplacer le `confirm()` par un mini-modal inline coherent avec le design system.

---

## Feature 3 -- Iteration mode pro, 3 affinages gratuits (8.5/10)

**Ce que Thomas voit :**
Un bouton "Affiner (3)" en sage a cote du label de chaque photo dans DossierResult. Clic -> modal avec textarea "Decrivez votre ajustement". Placeholder utile : "canape anthracite, tapis berbere, moins de plantes". Bouton "Generer l'ajustement" en noir. Compteur decremente apres chaque iteration.

**Ce qui fonctionne :**
- Le wording est parfait pour Thomas. "Affiner", pas "iterer". "Canape anthracite, tapis berbere" comme exemples -- c'est exactement ce que je demanderais.
- 3 affinages GRATUITS par photo -- game changer. Pas de credit consomme (verifie dans le code API : pas de `decrementCredit` pour l'action "iterate"). Le cout IA est absorbe par Versimo, la valeur percue est enorme.
- Le compteur "(3)" -> "(2)" -> "(1)" -> "3/3 affinages" est limpide. Je sais exactement combien il me reste.
- Le reset a 0 si je regenere (l.428-430) est intelligent : si le resultat est mauvais, je repars de zero avec 3 nouveaux affinages.
- Le RefineModal est un vrai modal accessible : focus trap, Escape, scroll lock, bottom sheet mobile (`items-end sm:items-center`). Les touch targets sont >= 44px.
- Les indices visuels sont utiles : "Le style et les surfaces ne changent pas" et "Soyez precis (couleur, matiere, dimensions)".
- Les warnings de pre-processing s'affichent dans le modal -- Thomas comprend pourquoi "ajouter une cuisine equipee" ne marchera pas.

**Frictions identifiees :**

### P1 -- Le message "Consommera 1 iteration" est trompeur
Le modal affiche : "Consommera 1 iteration (3 restantes)". Le mot "consommer" implique un cout, un debit. Thomas va hesiter : "ca va me prendre un visuel ?". En realite, c'est gratuit -- il n'y a pas de credit debite. Le mot "iteration" est aussi du jargon technique.

**Correction requise :** Remplacer par "Utilise 1 affinage sur 3 (gratuit, pas de visuel consomme)" ou simplement "Affinage 1/3 -- gratuit".

### P2 -- Pas de preview du resultat d'affinage avant remplacement
Quand Thomas soumet un affinage, l'ancienne image est remplacee par la nouvelle. Si la nouvelle est pire (le canape anthracite est devenu un canape violet), il a gaspille un affinage et ne peut pas revenir en arriere. Il faudrait un avant/apres ou un "Garder l'ancien / Accepter le nouveau".

**Correction recommandee :** Afficher les 2 versions (ancien resultat + affinage) avec bouton "Garder" / "Remplacer".

---

## Feature 4 -- Menu simplifie (9.5/10)

**Ce que Thomas voit :**
Quand il est connecte : "Mes biens" + "Ma galerie" + "Nouveau visuel" + AuthButton. Pas de "Tarifs" (masque pour les connectes). Pas de "Mes dossiers" (accessible depuis la fiche bien).

**Ce qui fonctionne :**
- Le masquage de "Tarifs" pour les connectes est intelligent -- Thomas a deja paye, il n'a pas besoin de revoir les prix a chaque visite.
- La suppression de "Mes dossiers" du menu est justifiee : les dossiers sont lies aux biens, pas flottants. Thomas accede au dossier depuis la fiche du bien.
- Le `isLoaded` gate empeche le flash de contenu au chargement (l.23-25). Le menu n'apparait pas puis change -- il est correct des le premier rendu.
- Le bouton "Nouveau visuel" remplace "Essayer gratuitement" pour les connectes -- contextuellement correct.
- Le pulse vert sur "Ma galerie" quand une generation est en cours est un detail UX excellent. Thomas sait qu'il y a du nouveau sans aller verifier.

**Friction mineure :**

### P3 -- Le lien "Mes dossiers" a ete retire MAIS la page existe toujours
Si Thomas a un lien direct vers /mes-dossiers (bookmark, email ancien), la page fonctionne avec un toggle "Voir archives". Pas de friction reelle, mais l'acces aux dossiers archives d'un bien est maintenant plus indirect (fiche bien -> dossier). Si Thomas veut voir TOUS ses dossiers d'un coup (cross-biens), il n'a plus d'acces direct visible.

---

## Feature 5 -- Photos pro dans la galerie (9.0/10)

**Ce que Thomas voit :**
Les photos generees en mode pro (dossier de pre-commercialisation) apparaissent dans /ma-galerie au meme titre que les photos generees en mode standard.

**Ce qui fonctionne :**
- C'est un besoin reel : Thomas genere un dossier pour un bien, puis veut reutiliser les visuels pour une annonce sur SeLoger. Avant, il devait telecharger du dossier puis re-uploader. Maintenant tout est dans la galerie.
- La sauvegarde se fait a 2 endroits : `saveUserPhoto` apres generation initiale du dossier (l.688) ET apres regeneration (l.433). Pas de trou -- toute photo meublee finit dans la galerie.
- L'association automatique au bien est correcte : la photo herite du `property_id` du dossier.

**Friction identifiee :**

### P2 -- Pas de distinction visuelle entre photos pro et photos standard
Dans la galerie, une photo generee via le mode pro et une photo generee via le mode standard ont exactement le meme aspect. Thomas ne sait pas laquelle vient de son dossier et laquelle d'un test rapide. Un petit badge "Pro" ou "Dossier" serait utile pour le tri.

---

## Grille d'evaluation Thomas -- 10 criteres

| # | Critere | Note | Justification |
|---|---------|------|---------------|
| 1 | Retrouvabilite | 6.5/10 | Aucun acces aux biens archives ni aux photos archivees. Archiver = perdre. Pour 8-12 ops/an, c'est inacceptable. |
| 2 | Prix/valeur | 9.5/10 | 3 affinages gratuits par photo de dossier = valeur enorme. Pas de surprise de cout. |
| 3 | Qualite pro | 8.5/10 | Le systeme d'affinage permet de corriger le mobilier -- c'est ce qui manquait pour atteindre le niveau plaquette. |
| 4 | Partage acquereurs | 8.5/10 | Les photos pro dans la galerie facilitent la reutilisation cross-canal (dossier -> annonce -> WhatsApp). |
| 5 | Gestion d'erreur | 7.0/10 | Toast rouge pour les succes, message "Consommera 1 iteration" trompeur, confirm() natif pas premium. |
| 6 | Simplicite | 9.0/10 | Le menu simplifie est parfait. L'affinage est limpide. L'archivage est un clic. |
| 7 | Confiance | 7.5/10 | Le confirm() natif casse le positionnement premium. Le toast rouge pour le succes mine la confiance ("ca a marche ou pas ?"). |
| 8 | Completude | 8.0/10 | L'archivage existe mais il est unidirectionnel. Il manque la retrouvabilite et la desarchivation cote UI. |
| 9 | Mobile-first | 7.5/10 | Boutons archivage bien sans min-h-[44px], icone archive galerie 14px de haut (px-1.5 py-1 = ~26px total). |
| 10 | Rapidite | 9.0/10 | L'archivage est instantane. L'affinage reutilise les surfaces (pass1) -- pas besoin de tout regenerer. |

**Moyenne : 8.1/10** -- sous le seuil 9.5/10.

---

## Corrections prioritaires

### P0 -- Acces aux biens archives (Impact : Retrouvabilite +2, Completude +1)

**Fichier :** `app/mes-biens/page.tsx`
**Action :** Ajouter un toggle "Voir les archives" identique a celui de /mes-dossiers.
**Pattern :** `const [showArchived, setShowArchived] = useState(false)` + appel API avec `?archived=true` + bouton "Desarchiver" sur chaque bien archive.
**API :** `lib/properties.ts` a deja `unarchiveProperty()` -- il faut juste l'exposer dans la page et ajouter un endpoint `getArchivedProperties()` ou un param `?archived=true` sur l'API existante.

### P0 -- Acces aux photos archivees dans la galerie (Impact : Retrouvabilite +1.5)

**Fichier :** `app/ma-galerie/page.tsx`
**Action :** Ajouter un toggle "Voir les archivees" + bouton "Desarchiver" sur chaque photo archivee.
**API :** `lib/user-photos.ts` a deja le pattern archive -- il faut un param `?archived=true` sur l'endpoint GET + une action "unarchive" sur l'endpoint POST archive.

### P1 -- Toast conditionnel vert/rouge (Impact : Gestion d'erreur +1, Confiance +1)

**Fichiers :** `app/mes-biens/[id]/page.tsx` (l.1289), `app/ma-galerie/page.tsx` (l.564)
**Action :** Remplacer `bg-red-500/90` par un toast conditionnel. Pattern : `toastType: "success" | "error"`, classe `bg-sage/90` pour succes, `bg-red-500/90` pour erreur.

### P1 -- Touch targets archivage (Impact : Mobile +1.5)

**Fichier :** `app/mes-biens/[id]/page.tsx` (l.1308-1313)
**Action :** Ajouter `min-h-[44px] inline-flex items-center` au bouton "Archiver ce bien" et "Supprimer ce bien".

**Fichier :** `app/ma-galerie/page.tsx` (l.426)
**Action :** Augmenter la taille du bouton icone archive : `px-2 py-2 min-w-[44px] min-h-[44px]` au lieu de `px-1.5 py-1`.

### P1 -- Message iteration gratuit (Impact : Prix/valeur +0.5, Confiance +0.5)

**Fichier :** `components/RefineModal.tsx` (l.230)
**Action :** Remplacer "Consommera 1 iteration ({n} restantes)" par "Affinage {used+1}/3 -- gratuit, aucun visuel consomme".

### P2 -- Modal custom pour archivage galerie (Impact : Confiance +0.5)

**Fichier :** `app/ma-galerie/page.tsx` (l.422)
**Action :** Remplacer `confirm()` par un mini-modal custom avec le meme design que le `alertdialog` de suppression de bien.

### P2 -- Badge "Pro" dans la galerie (Impact : Retrouvabilite +0.5)

**Fichier :** `app/ma-galerie/page.tsx`
**Action :** Si la photo a un `property_id` et provient d'un dossier, afficher un petit badge "Pro" ou "Dossier" sur la carte.

### P3 -- Preview avant/apres pour l'affinage (Impact : Qualite +0.5)

**Fichier :** `components/DossierResult.tsx`
**Action :** Apres un affinage, afficher les 2 versions avec choix "Garder / Remplacer" avant d'ecraser l'ancien resultat.

---

## Impact estime apres corrections P0+P1

| # | Critere | Actuel | Projete |
|---|---------|--------|---------|
| 1 | Retrouvabilite | 6.5 | 9.0 |
| 2 | Prix/valeur | 9.5 | 10.0 |
| 5 | Gestion d'erreur | 7.0 | 9.0 |
| 7 | Confiance | 7.5 | 9.0 |
| 9 | Mobile-first | 7.5 | 9.5 |
| **Moyenne** | **8.1** | **9.2** |

Avec les P2 en plus : estimation 9.5/10 atteignable.

---

## Handoff -> @orchestrator / @fullstack

- Fichier produit : `/home/user/Architecture/docs/reviews/thomas-audit-features-v38.md`
- Decisions prises : 5 features auditees, 2 corrections P0 (acces archives), 3 corrections P1 (toast, touch targets, wording iteration), 3 corrections P2-P3
- Point critique : l'archivage sans retrouvabilite est un anti-pattern -- c'est une suppression deguisee. A corriger avant tout deploiement commercial.
- Reference precedente : f4-final-verdict-thomas.md (8.8/10) -- le score a recule a 8.1/10 a cause de l'archivage sans retour
