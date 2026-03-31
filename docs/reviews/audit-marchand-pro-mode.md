# Audit Thomas Berger -- Mode Pro Versimo (workflow v2)

**Date** : 2026-03-31
**Auditeur** : Thomas Berger (marchand de biens, Bordeaux, 8-12 ops/an)
**Scope** : MerchantMode.tsx, Header.tsx, mes-dossiers/page.tsx, spec pro-workflow-v2.md
**Seuil fondateur** : 9.5/10 minimum

---

## Score global : 7.8 / 10 -- EN DESSOUS DU SEUIL

Iteration corrective OBLIGATOIRE. Le Mode Pro a de bonnes bases mais plusieurs irritants bloquent mon usage quotidien.

---

## Grille d'evaluation (10 criteres)

| # | Critere | Note | Commentaire Thomas |
|---|---------|------|--------------------|
| 1 | Retrouvabilite | 8/10 | La page "Mes dossiers" existe, les statuts sont clairs (Brouillon, Termine, Partiel). Le toggle archives est bien pense. MAIS : pas de recherche, pas de filtre par bien ou par date. Avec 8-12 ops/an et 3-5 dossiers par op, je vais vite avoir 40+ dossiers sans moyen de filtrer. |
| 2 | Prix/valeur | 7/10 | Le nombre de credits est affiche sur le bouton "Generer (X visuels)" -- c'est bien. MAIS : je ne vois pas combien il me RESTE de credits avant de cliquer. Pas de compteur visible. Je ne sais pas combien coute 1 visuel en euros. Si j'ai 10 photos, est-ce que ca me coute 10 credits ou 10 EUR ? Aucune info. |
| 3 | Qualite pro | 8/10 | Le pipeline 2 passes est documente comme solide (8.4/10 post-Sprint 17). Le PDF telecharge est accessible. Je ne peux pas juger les visuels sur le code seul mais l'infra est la. |
| 4 | Partage acquereurs | 7/10 | "Copier le lien" est present dans mes-dossiers et dans les resultats. Le message "Lien copie -- Valable 30 jours" est rassurant. MAIS : pas de bouton WhatsApp en 1 tap sur la page resultats. Je dois copier le lien, ouvrir WhatsApp, coller. C'est 3 taps de trop. Sur mes-dossiers, le lien s'ouvre dans un nouvel onglet (target="_blank") -- sur mobile c'est genant, ca cree des onglets partout. |
| 5 | Gestion d'erreur | 8/10 | Les messages sont clairs et en francais. "Ajoutez au moins une photo", "Choisissez un style global ou un style pour chaque photo". Le message 403 est traduit. MAIS : le catch sur l'archivage est en "silent fail" -- si ca plante, je ne sais pas pourquoi. Pareil pour l'attachement a un bien ("catch { /* silent */ }"). |
| 6 | Simplicite | 7.5/10 | Le flow v2 est BEAUCOUP mieux que la v1 : plus de formulaire bien avant la generation, on genere d'abord et on classe apres. MAIS : l'etape "annotate" est dense. Sur mobile, la grille 2 colonnes pour les cartes photo avec 3 dropdowns (Interieur/Exterieur + Piece + Style) par carte va etre serree. 6 photos = 18 dropdowns a manipuler. C'est du travail. |
| 7 | Confiance | 8.5/10 | Le header est propre, le logo "Versimo" est visible, pas de sous-domaine technique. Le branding est coherent. La confirmation "Visuels associes au bien" avec le check vert est rassurante. |
| 8 | Completude | 7/10 | Dans le panneau "Nouveau bien", je ne peux renseigner QUE l'adresse. Pas de champ type de bien, pas de surface, pas de prix, pas de nombre de pieces. Les states bienSurface, bienPrix, bienType, bienNbPieces existent dans le code mais ne sont JAMAIS exposes dans le formulaire "new". Ils sont en useState("") sans setter visible. Mon dossier sera incomplet pour mes acquereurs. |
| 9 | Mobile-first | 7.5/10 | Le header hamburger est bien fait (touch target 40x40 + aria-label). Les liens du menu mobile font py-3 (suffisant). MAIS : les cartes d'annotation sont en grid-cols-2 sur mobile -- avec 3 selects + 1 toggle + 1 thumbnail par carte, ca fait des cartes tres hautes sur petit ecran. Les boutons "Archiver" et "Copier le lien" dans mes-dossiers ont min-h-[44px] -- correct. Le bouton hamburger est w-10 h-10 = 40px -- juste sous le seuil Apple de 44px. |
| 10 | Rapidite | 8.5/10 | L'auto-transition upload -> annotate est immediate. Le polling toutes les 3 secondes donne un feedback temps reel. Le timer de generation est present. L'auto-open du dossier dans un nouvel onglet a la fin est une bonne idee (mais sur mobile c'est un popup bloque). |

---

## Problemes identifies

### P0 -- Bloquants

**P0-1 : Formulaire "Nouveau bien" incomplet -- adresse seule**
- Fichier : `components/MerchantMode.tsx` lignes 980-1047
- Les states `bienSurface`, `bienPrix`, `bienType`, `bienNbPieces` existent (ligne 67-70) mais leurs setters ne sont jamais appeles dans le JSX. Le formulaire "Nouveau bien" ne montre qu'un champ adresse.
- Impact : mes dossiers sortent sans type de bien, sans surface, sans prix. C'est inutilisable pour une plaquette pro.
- Fix : exposer au minimum type de bien (select), surface (input number) et prix (input number) dans le panneau `attachMode === "new"`.

**P0-2 : Pas de compteur de credits restants visible**
- Nulle part dans MerchantMode.tsx ni dans Header.tsx je ne vois mes credits restants.
- Le nombre de credits CONSOMMES est affiche sur le bouton ("Generer (5 visuels)") mais pas le SOLDE.
- Impact : je risque de lancer une generation de 10 photos alors qu'il me reste 3 credits. L'erreur arrivera apres avoir attendu le traitement.
- Fix : afficher "X credits restants" dans le header ou au-dessus du bouton Generer. Verifier cote client AVANT de lancer.

**P0-3 : Pas de bouton WhatsApp direct dans les resultats**
- Fichier : `components/MerchantMode.tsx` lignes 873-895
- Le composant DossierResult recoit `onShareLink` (copier le lien) mais pas de bouton WhatsApp natif.
- Impact : mon usage principal c'est d'envoyer le lien a mes acquereurs par WhatsApp. Copier-coller c'est 3 taps de trop.
- Fix : ajouter un bouton "Envoyer par WhatsApp" qui ouvre `https://wa.me/?text=...` avec le lien du dossier.

### P1 -- Importants

**P1-1 : Grille annotation 2 colonnes trop dense sur mobile**
- Fichier : `components/MerchantMode.tsx` ligne 543
- `grid-cols-2 sm:grid-cols-3` : sur iPhone 15 Pro (393px), 2 colonnes de ~180px pour une carte avec thumbnail + toggle + 3 selects = illisible.
- Fix : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Une seule colonne sur mobile.

**P1-2 : Aucune recherche/filtre dans "Mes dossiers"**
- Fichier : `app/mes-dossiers/page.tsx`
- Pas de barre de recherche, pas de filtre par statut, par bien ou par date.
- A 40+ dossiers, retrouver "le T3 rue Mouneyra de janvier" sera impossible.
- Fix : ajouter au minimum un champ recherche texte (filtre local sur bien_nom + bien_adresse).

**P1-3 : Silent fail sur archivage et attachement**
- `handleArchive` : `catch { // Silent fail }` (ligne 101)
- Attachement existant : `catch { /* silent */ }` (ligne 967)
- Attachement nouveau : `catch { /* silent */ }` (ligne 1037)
- Impact : si mon reseau coupe pendant l'archivage ou l'association, je ne sais pas que ca a echoue. Je crois que c'est fait alors que non.
- Fix : ajouter un `setError("L'operation a echoue. Verifiez votre connexion et reessayez.")` dans chaque catch.

**P1-4 : Bouton hamburger a 40px au lieu de 44px**
- Fichier : `components/Header.tsx` ligne 81
- `w-10 h-10` = 40x40px. Le seuil Apple pour les touch targets mobiles est 44x44px.
- Fix : `w-11 h-11` (44px).

### P2 -- Ameliorations

**P2-1 : Auto-open nouvel onglet apres generation**
- Fichier : `components/MerchantMode.tsx` ligne 221
- `window.open('/dossier/...', '_blank')` : sur iOS Safari, les popups sont bloques par defaut. Thomas ne verra rien.
- Fix : remplacer par une navigation interne `router.push()` ou un lien visible "Voir le dossier" que Thomas clique lui-meme.

**P2-2 : Pas d'option "Ignorer" explicite dans le panneau d'attachement**
- La spec v2 prevoit une "Option C -- Ignorer / Telecharger sans bien" mais dans le code, le panneau s'affiche tant que `!attachDone`. Thomas ne peut pas le fermer explicitement.
- Fix : ajouter un lien "Ignorer" qui fait `setAttachDone(true)` et masque le panneau.

**P2-3 : Description "Applique aux photos sans style individuel" peu claire**
- Fichier : `components/MerchantMode.tsx` ligne 788
- "sans style individuel" -- c'est du jargon de developpeur. Thomas pense en "photos qui n'ont pas de style".
- Fix : "Ce style sera applique a toutes les photos ou vous n'avez pas choisi de style specifique."

### P3 -- Nice to have

**P3-1 : Pas de preview du dossier avant partage**
- Thomas ne voit pas a quoi ressemble le lien que ses acquereurs vont recevoir. Il devrait pouvoir previsualiser la page publique.

**P3-2 : Pas de DPE visible**
- Le DPE est obligatoire dans toute annonce immobiliere en France. Ni le formulaire ni le dossier ne le mentionnent.

---

## Verdict

Le workflow v2 est un progres MAJEUR par rapport a la v1 : generer d'abord, classer apres, c'est exactement comme je travaille sur le terrain. L'auto-transition upload -> annotate est fluide, le timer de generation rassure, et le panneau d'association post-generation est une bonne idee.

Mais 3 problemes P0 empechent un usage pro quotidien :
1. Je ne peux pas creer un bien complet (pas de type/surface/prix dans le formulaire)
2. Je ne vois pas mes credits restants (risque de lancer une generation qui echoue)
3. Pas de partage WhatsApp direct (mon canal principal avec les acquereurs)

**Score 7.8/10 -- iteration corrective requise avant livraison.**

---

## Handoff

- **Destinataire** : @fullstack
- **Fichiers a modifier** :
  - `components/MerchantMode.tsx` : P0-1 (formulaire bien), P0-3 (WhatsApp), P1-1 (grille mobile), P1-3 (silent fails), P2-1 (auto-open), P2-2 (bouton ignorer)
  - `components/Header.tsx` : P0-2 (compteur credits), P1-4 (touch target 44px)
  - `app/mes-dossiers/page.tsx` : P1-2 (recherche/filtre)
- **Priorite** : P0-1, P0-2, P0-3 en premier. Puis P1 dans l'ordre.
- **Seuil cible** : 9.5/10 apres corrections P0 + P1.
