# Audit UX Etape 1 -- Creation de projet (Upload plan) -- Thomas Berger

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux
> Perimetre : Etape 1 uniquement -- `/projet/nouveau`, `ProStepper`, `Header`, `/mes-projets`
> Methode : lecture code source + simulation mentale du parcours iPhone 15 Pro + laptop Windows
> Date : 2026-04-10
> Seuil : 9.5/10 minimum (preference fondateur)

---

## Note globale : 7.2 / 10

**Verdict** : "Le formulaire est clair et propre, la zone d'upload fonctionne bien, le stepper est desormais cliquable. Mais le paiement n'est pas cable, le vocabulaire 'credit' est encore la, le drag & drop accepte n'importe quel fichier, et sur mobile les pastilles du stepper sont trop petites pour mes gros doigts. Ca reste en dessous du seuil."

---

## Notes detaillees par critere Thomas (grille 10 criteres)

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Retrouvabilite | 8.0 | Le header a "Mes projets" bien visible, la page `/mes-projets` existe avec une grille de cartes, CTA "Continuer" contextuel, statut colore. Je retrouve mes projets. Point positif. |
| 2 | Prix/valeur | 6.0 | Le prix "99 EUR TTC" est affiche avant de cliquer. Bien. MAIS le bouton dit "Payer 99 EUR et commencer" alors que le code ne fait aucun paiement -- il cree le projet gratuitement. Mensonger. Pour un Pro, le bouton dit "1 credit" alors que la regle fondateur impose "visuel". Confusion. |
| 3 | Qualite pro | 8.0 | L'interface est sobre, les couleurs Versimo sont respectees, le stepper est propre. Ca fait pro. |
| 4 | Partage acquereurs | N/A | Pas de partage a cette etape (normal). |
| 5 | Gestion d'erreur | 7.0 | Les erreurs de validation backend s'affichent par champ (zod). Le message "Erreur de connexion" est clair. MAIS le drag & drop n'a AUCUNE validation de type -- je peux drop un .docx, il sera refuse seulement cote serveur. Pas de feedback immediat. |
| 6 | Simplicite | 8.5 | 3 champs + 1 upload. Je comprends tout en 5 secondes. Le placeholder "12 rue de la Paix, 33000 Bordeaux" est parfait -- c'est mon metier. L'upload par glisser/deposer est intuitif. |
| 7 | Confiance | 6.5 | Le badge "Dossier PDF inclus" est une bonne idee. "Paiement securise" en dessous aussi. MAIS si je suis non-connecte, le bouton dit "Se connecter pour continuer" et la modal d'auth s'ouvre -- OK. Par contre, le mix "credit"/"99 EUR"/"abonnement Pro 29 EUR/mois" est confus. C'est quoi le deal exact ? |
| 8 | Completude | 7.5 | L'adresse, le type de bien, la surface, le plan -- tout est la. La surface est optionnelle, correctement marquee. Il manque un champ "nombre de lots" pour les immeubles et un champ "descriptif libre" qui serait utile. Mais pour une V1, ca tient. |
| 9 | Mobile-first | 6.0 | Le stepper mobile est vertical compact -- bonne idee. MAIS les pastilles font 24x24 px (w-6 h-6 = 24px) en dessous du seuil 44px de touch target. Les labels sont en 10px, illisibles sur mon iPhone. La zone d'upload a `p-8` mais le texte est petit. Le bouton de suppression du plan fait 32px (p-2 + icone 16px) -- en dessous de 44px. |
| 10 | Rapidite | 7.5 | Le formulaire est rapide a remplir (3 champs + drop). Le spinner "Creation en cours..." donne du feedback. La redirect vers `/extraction` est immediate. Bon. |

---

## Points positifs

1. **Formulaire epure et logique** -- adresse, type, surface, plan. L'ordre est naturel pour un marchand. Pas de champ inutile.

2. **Zone d'upload bien concue** -- drag & drop + clic, preview image, nom de fichier + taille affichee, bouton supprimer visible (pas hover-only). Le feedback visuel au drag-over (bordure verte, fond colore) est parfait.

3. **Stepper cliquable** -- le ProStepper est maintenant navigable. Les etapes completees et actives sont cliquables, les locked sont grises et desactivees. Les connecteurs changent de couleur. Le code de routing `getStepRoute` est complet pour les 7 etapes. Bonne amelioration vs l'audit precedent (P1-1 resolu).

4. **Page Mes Projets complete** -- les 5 etats UI sont presents (loading, erreur, vide, liste, auth-loading). Les cartes de projet affichent l'adresse, le type de bien, le nombre de pieces, la date, le statut colore, et un CTA contextuel ("Continuer" ou "Voir le dossier"). Le empty state est engageant avec un CTA "Creer mon premier projet". Le bouton "Nouveau projet" est en haut a droite avec un `+`.

5. **Header avec "Mes projets"** -- le lien est present dans le navLinksLoggedIn. L'etat actif est stylise differemment (text-sage, font-medium). Bon. Le lien est aussi dans le menu mobile hamburger.

6. **Validation backend solide** -- zod schema avec messages en francais, rate limit 10 projets/heure, deduplication < 5s, verification MIME types, taille max 20 Mo, auth obligatoire. C'est propre.

7. **Nettoyage memoire** -- `URL.revokeObjectURL` est appele correctement au remove du plan. Pas de fuite.

---

## Points negatifs et problemes

### P0-1 -- Le paiement n'est toujours PAS cable (regression vs audit precedent)

**Fichiers** : `app/projet/nouveau/page.tsx` l.158-185, `app/api/pro/projects/route.ts`

Le bouton affiche "Payer 99 EUR et commencer" mais le code fait un `POST /api/pro/projects` qui insere en base et retourne 201, sans aucune verification de paiement, aucun appel Stripe, aucun debit de credit. N'importe quel utilisateur connecte peut creer un projet gratuitement.

Ce P0 a ete identifie dans l'audit precedent (`audit-thomas-ux-complet-session41.md`, P0-2). Il n'est toujours pas corrige. Pour Thomas, afficher un prix et ne pas le facturer est soit un mensonge (si c'est payant), soit une source de confusion (si c'est gratuit pendant la beta -- mais alors il faut le dire).

**Impact** : L'utilisateur ne sait pas s'il va payer ou non. La confiance est brisee.

**Correction** : Soit (A) cabler Stripe checkout avant la creation du projet, soit (B) afficher clairement "Gratuit pendant la beta" et supprimer le prix 99 EUR.

### P0-2 -- Vocabulaire "credit" au lieu de "visuel" (violation preference fondateur)

**Fichier** : `app/projet/nouveau/page.tsx` l.452-458

```
"1 credit"
"inclus dans votre abonnement"
"Credit Pro"
```

Le lessons-learned session 28 documente explicitement : "le terme commercial est 'visuel' (pas 'credit', pas 'generation'). 'credit' reserve aux CGV." Ce code utilise "credit" 3 fois dans l'interface visible par Thomas. C'est une violation directe de la preference fondateur.

**Impact** : Incoherence avec le reste du site qui utilise "visuel". Thomas se demande si un credit = un visuel = un projet.

**Correction** : Remplacer "1 credit" par "1 projet" ou "inclus dans votre abonnement" sans mention de credit. Remplacer "Credit Pro" par "Abonnement Pro" ou "Forfait Pro".

### P1-1 -- Le drag & drop n'a AUCUNE validation de type de fichier

**Fichier** : `app/projet/nouveau/page.tsx` l.117-137

Le `handleDrop` verifie la taille (`file.size > MAX_FILE_SIZE_BYTES`) mais pas le type MIME du fichier. Si Thomas drop un `.docx`, un `.zip` ou un `.psd`, le fichier est accepte cote client (preview = null, nom de fichier affiche), puis rejete par le serveur apres le submit avec un message d'erreur serveur. Le feedback est retarde et confus.

L'input file hidden a `accept={ACCEPTED_PLAN_TYPES}` mais cette contrainte ne s'applique pas au drag & drop.

**Correction** : Ajouter une verification `ACCEPTED_PLAN_TYPES` dans `handleDrop` et `handlePlanSelect` AVANT d'accepter le fichier. Afficher un message d'erreur immediat "Format accepte : PDF, JPG, PNG" si le type est invalide.

```typescript
// Dans handleDrop, apres la verification de taille :
const allowedTypes = ACCEPTED_PLAN_TYPES.split(",");
if (!allowedTypes.includes(file.type)) {
  setError("Format accepte : PDF, JPG, PNG, WEBP, HEIC.");
  return;
}
```

### P1-2 -- Pastilles du stepper mobile trop petites (24px < 44px)

**Fichier** : `components/marchand/ProStepper.tsx` l.240

```tsx
className={`flex items-center justify-center w-6 h-6 rounded-full ...`}
```

Les pastilles cliquables du stepper font 24x24 px sur mobile (`w-6 h-6`). Le seuil mobile recommande est 44x44 px minimum. Sur un iPhone 15 Pro, Thomas doit viser un cercle de 24px avec son doigt -- c'est penible, surtout en marchant sur chantier.

Le bouton label a cote est aussi un bouton (`<button>`) mais sans taille minimum explicite -- `pt-0.5` + texte `text-xs` = tres petit target.

**Correction** : Augmenter la zone cliquable a `w-10 h-10` minimum (40px) ou utiliser un `padding` invisible autour du dot existant. Exemple :

```tsx
// Wrapper cliquable plus grand, dot visuel inchange
<button className="flex items-center justify-center w-10 h-10 -m-2">
  <div className="w-6 h-6 rounded-full ...">
    {/* dot content */}
  </div>
</button>
```

### P1-3 -- Pas de lien "Nouveau projet" direct dans le header

**Fichier** : `components/Header.tsx` l.13-17

Le header a "Mes biens", "Mes projets", "Ma galerie" et "Nouveau visuel". Il n'y a pas de lien "Nouveau projet" direct. Pour creer un nouveau projet, Thomas doit aller sur "Mes projets" puis cliquer "Nouveau projet" en haut a droite. C'est un clic de trop.

Pour un marchand qui fait 8-12 operations/an, l'action principale devrait etre accessible en 1 clic depuis n'importe quelle page.

**Correction** : Ajouter un CTA "Nouveau projet" dans le header a cote de "Nouveau visuel", ou remplacer "Nouveau visuel" par un dropdown avec les 2 options.

### P1-4 -- Le bouton de suppression du plan est trop petit sur mobile (32px)

**Fichier** : `app/projet/nouveau/page.tsx` l.386-408

Le bouton de suppression du fichier plan fait `p-2` + icone `16px` = 32px de touch target. En dessous du seuil 44px.

**Correction** : Augmenter a `p-3` pour atteindre 40px minimum, ou ajouter un padding invisible.

### P2-1 -- Pas de confirmation visuelle apres upload du plan

**Fichier** : `app/projet/nouveau/page.tsx` l.70-90

Quand Thomas drop un fichier, la zone d'upload est remplacee par le nom du fichier + la preview. C'est bien, mais il n'y a pas de toast de confirmation "Plan ajoute" comme il y en a pour les photos dans l'outil principal (mentionne dans CLAUDE.md Sprint 1, point 3).

**Correction** : Ajouter un toast vert "Plan ajoute" pendant 2 secondes apres l'upload reussi.

### P2-2 -- Pas d'auto-scroll apres ajout du plan

**Fichier** : `app/projet/nouveau/page.tsx`

Apres avoir drop le plan, le focus reste en haut. Le bouton "Payer 99 EUR et commencer" est en bas du formulaire. Sur mobile, Thomas doit scroller manuellement pour voir le bouton. Les corrections UX du Sprint 1 (point 1) mentionnent l'auto-scroll entre etapes.

**Correction** : Apres upload reussi, `scrollIntoView` vers le bouton de soumission avec `behavior: smooth`.

### P2-3 -- Le stepper desktop (7 etapes) peut deborder horizontalement

**Fichier** : `components/marchand/ProStepper.tsx` l.150

Le stepper desktop a 7 etapes dans un `flex` avec `justify-between`. Sur un ecran de 768px (tablette ou fenetre reduite), 7 pastilles + labels + connecteurs peuvent deborder. Le `overflow-x-auto` est present sur le `<nav>` mais pas de padding horizontal de securite.

**Correction** : Ajouter `px-4` au conteneur desktop ou reduire la taille des labels pour les ecrans moyens.

### P2-4 -- La page Mes Projets redirige sans feedback quand non connecte

**Fichier** : `app/mes-projets/page.tsx` l.104-108

```typescript
if (!session?.user?.id) {
  router.push("/");
  return;
}
```

Si Thomas arrive sur `/mes-projets` sans etre connecte (lien copie, favori), il est redirige vers la homepage sans aucun message. Il ne comprend pas pourquoi. Pas de toast, pas de modal d'auth.

**Correction** : Afficher la modal d'authentification au lieu de rediriger silencieusement, ou ajouter un toast "Connexion requise pour acceder a vos projets".

---

## Bugs identifies

| # | Severite | Description | Fichier:Ligne |
|---|----------|-------------|---------------|
| B1 | P0 | Paiement non cable -- le bouton "Payer 99 EUR" cree le projet sans paiement | `app/projet/nouveau/page.tsx:167` + `app/api/pro/projects/route.ts:230` |
| B2 | P0 | Vocabulaire "credit" au lieu de "visuel" -- violation preference fondateur | `app/projet/nouveau/page.tsx:452-458` |
| B3 | P1 | Drag & drop accepte des fichiers de type non autorise (pas de validation MIME) | `app/projet/nouveau/page.tsx:117-137` |
| B4 | P1 | Touch targets stepper mobile 24px (< 44px recommande) | `components/marchand/ProStepper.tsx:240` |
| B5 | P1 | Touch target bouton supprimer plan 32px (< 44px recommande) | `app/projet/nouveau/page.tsx:389` |
| B6 | P2 | Redirect silencieuse quand non connecte sur /mes-projets | `app/mes-projets/page.tsx:106` |
| B7 | P2 | Pas de toast de confirmation apres upload du plan | `app/projet/nouveau/page.tsx:80` |

---

## Resume des corrections par priorite

| Priorite | Correction | Effort estime |
|----------|-----------|---------------|
| P0 | Cabler le paiement Stripe OU supprimer le prix et afficher "Gratuit beta" | 2-3h |
| P0 | Remplacer "credit" par le vocabulaire correct ("visuel" ou "projet") | 5 min |
| P1 | Ajouter validation MIME dans handleDrop + handlePlanSelect | 10 min |
| P1 | Augmenter touch targets stepper mobile a 40px+ | 15 min |
| P1 | Augmenter touch target bouton supprimer plan | 5 min |
| P1 | Ajouter lien "Nouveau projet" dans le header | 15 min |
| P2 | Toast de confirmation apres upload plan | 10 min |
| P2 | Auto-scroll vers CTA apres upload reussi | 5 min |
| P2 | Modal auth sur /mes-projets au lieu de redirect silencieuse | 10 min |
| P2 | Padding horizontal securite stepper desktop | 5 min |

---

## Score final et verdict

**7.2 / 10** -- en dessous du seuil 9.5/10.

Le formulaire est fonctionnellement correct et l'UX est propre pour un premier jet. Le stepper cliquable est une vraie amelioration. La page Mes Projets est complete avec les 5 etats.

Mais 2 P0 bloquent la note : le paiement fantome (affiche un prix, ne facture rien) et le vocabulaire non conforme a la decision fondateur. Les touch targets mobiles sont systematiquement sous le seuil 44px. Et l'absence de validation MIME au drag & drop laisse passer des fichiers invalides sans feedback.

Pour atteindre 9.5/10, il faut corriger les 2 P0 et les 5 P1 listes ci-dessus. Les P2 sont des polish UX qui font la difference entre "ca marche" et "c'est excellent".
