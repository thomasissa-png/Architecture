# Audit UX Etape 3 -- Validation des pieces (Session 41)

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux
> Fichiers audites : validation/page.tsx, validate/route.ts, draft/route.ts, rooms/[roomId]/photo/route.ts, ProStepper.tsx
> Date : 2026-04-10
> Seuil : 9.5/10 minimum

---

## Note globale : 7.2 / 10

## Verdict en une phrase

"L'etape 3 est la plus solide du parcours -- le layout est clair, le brouillon existe maintenant, le stepper est cliquable. Mais il reste des trous operationnels qui me feraient perdre du travail sur chantier : pas de beforeunload, l'indicateur dirty est casse, les photos ne sont pas sauvegardees avec le brouillon, et le bouton supprimer est toujours trop petit pour mon iPhone."

---

## Points positifs

1. **Le brouillon existe.** Le bouton "Sauvegarder le brouillon" + l'API PATCH /draft sont en place. C'est un progres majeur par rapport a la version precedente ou tout etait en memoire. Le feedback vert "Brouillon sauvegarde" est visible 3 secondes. Les IDs des nouvelles pieces sont correctement remappes apres sauvegarde.

2. **Le stepper est desormais cliquable.** Les etapes completed et active sont navigables. Les etapes locked restent grises et non-cliquables. Les labels d'accessibilite sont corrects. Le P1-1 de l'audit precedent est corrige.

3. **L'API validate accepte maintenant extraction_failed et plan_uploaded.** Le P0-4 de l'audit precedent est corrige. Thomas peut saisir ses pieces manuellement meme si l'extraction IA a echoue.

4. **Le layout photo/champs est compact et lisible.** Photo a gauche (80x80 mobile, 100x100 desktop), nom + type + surface a droite, corbeille en bout de ligne. L'upload photo par piece est intuitif avec l'icone image + "Photo".

5. **Le warning "Pas de photo -- cette piece ne sera pas generee" est utile.** Thomas comprend immediatement quelles pieces vont etre traitees et lesquelles non.

6. **La confirmation de suppression existe.** `window.confirm()` avec le nom de la piece. Basique mais fonctionnel.

7. **La validation serveur est rigoureuse.** Schema Zod, verification ownership, verification completude (nom + type obligatoires). Messages d'erreur en francais.

8. **Le compteur "X/Y pieces avec photo"** donne une vue d'ensemble rapide.

9. **L'upload photo sequentiel avec progression** ("Upload photo 2/5...") est rassurant pendant la validation.

10. **L'etat vide** est bien gere avec un message + bouton "Ajouter votre premiere piece".

---

## Problemes identifies

### P0 -- Critique

#### P0-1 -- L'indicateur "Modifications non sauvegardees" est casse (ref au lieu de state)

**Fichier** : `app/projet/[id]/validation/page.tsx` l.59, l.403

`isDirty` est un `useRef(false)`. Modifier un ref ne declenche pas de re-render React. L'indicateur "Modifications non sauvegardees" (l.403) ne s'affiche que si un AUTRE changement d'etat force un re-render en meme temps. En pratique, l'indicateur apparait de facon aleatoire -- parfois oui, parfois non.

Quand Thomas modifie le nom d'une piece, `isDirty.current = true` est set (l.104), mais rien ne force un re-render. Le texte orange "Modifications non sauvegardees" reste invisible. Thomas pense que ses modifications sont sauvegardees alors qu'elles ne le sont pas.

**Impact** : Thomas ferme l'onglet en pensant que tout est sauvegarde. Il perd 10 minutes de travail.

**Correction** : Transformer `isDirty` en `useState<boolean>(false)` pour qu'il declenche un re-render a chaque modification.

---

### P1 -- Important

#### P1-1 -- Pas de beforeunload handler

**Fichier** : `app/projet/[id]/validation/page.tsx`

Aucun `window.addEventListener("beforeunload", ...)` quand des modifications non sauvegardees existent. Thomas peut fermer l'onglet, naviguer en arriere, cliquer un lien du stepper -- sans aucune alerte. Sur un formulaire avec 8 pieces et 6 photos, c'est risque.

Le P1-4 de l'audit precedent est toujours ouvert.

**Correction** : Ajouter un `useEffect` qui ecoute `beforeunload` quand `isDirty === true` (apres conversion en state). Afficher le dialogue natif du navigateur "Les modifications ne seront pas sauvegardees".

#### P1-2 -- Les photos ne sont pas sauvegardees avec le brouillon

**Fichier** : `app/projet/[id]/validation/page.tsx` l.265-306, `app/api/pro/projects/[id]/draft/route.ts`

Le brouillon sauvegarde les noms, types et surfaces des pieces, mais PAS les photos. Les photos sont des objets `File` en memoire locale (`room.photoFile`). Si Thomas sauvegarde un brouillon, ferme l'onglet et revient 3 semaines plus tard, les pieces sont la mais les photos sont perdues.

L'API draft ne touche que `name`, `room_type`, `surface_m2` dans l'UPDATE. Le champ `photo_path` n'est jamais mis a jour par le brouillon.

**Impact** : Thomas associe 6 photos, sauvegarde le brouillon, part sur un autre chantier. Il revient : les pieces sont la, les photos sont vides. Il doit tout re-uploader.

**Correction** : Uploader les photos vers le serveur (POST /rooms/[roomId]/photo) AVANT de sauvegarder le brouillon, exactement comme ce qui est fait dans handleValidate pour les pieces existantes. Le brouillon doit persister les photos, pas juste les metadonnees.

#### P1-3 -- La suppression de photo n'est pas propagee au serveur

**Fichier** : `app/projet/[id]/validation/page.tsx` l.428-443

Quand Thomas clique le X sur une photo deja uploadee cote serveur (photoUrl = `/api/logs/image?path=...`), le code met `photoUrl: null, photoFile: null` localement. Mais aucun appel serveur n'est fait pour supprimer la photo en base.

Ni le draft (PATCH) ni le validate (PUT) ne mettent a jour `photo_path` dans l'UPDATE SQL. La photo reste en base et en Object Storage meme apres suppression locale.

**Impact** : Thomas supprime une photo, sauvegarde le brouillon, recharge la page. La photo reapparait. Confusion.

**Correction** : Soit ajouter une route DELETE /rooms/[roomId]/photo et l'appeler lors de la suppression locale, soit inclure `photo_path` dans le payload du draft/validate pour synchroniser l'etat client avec la base.

#### P1-4 -- Le bouton supprimer piece est toujours trop petit (26px)

**Fichier** : `app/projet/[id]/validation/page.tsx` l.568-573

Le bouton corbeille est `p-1.5` (6px padding) avec une icone 14x14 = touch target d'environ 26px. Le minimum Apple est 44px. C'est le P1-7 de l'audit precedent, toujours pas corrige.

**Correction** : Ajouter `min-w-[44px] min-h-[44px]` au bouton, comme c'est deja fait pour le bouton de suppression de photo (l.445).

#### P1-5 -- Le select "type de piece" n'a pas de chevron visuel

**Fichier** : `app/projet/[id]/validation/page.tsx` l.522-536

Le select a `appearance-none` qui supprime le chevron natif du navigateur, mais aucun chevron custom n'est ajoute. Sur mobile (iPhone 15 Pro), le champ ressemble a un simple texte -- Thomas ne sait pas que c'est un menu deroulant. Il peut penser que le type est une valeur fixe non modifiable.

**Correction** : Ajouter un SVG chevron en position absolue a droite du select, ou retirer `appearance-none` pour garder le chevron natif.

#### P1-6 -- Le message "Photo enregistree lors de la validation" est ambigu

**Fichier** : `app/projet/[id]/validation/page.tsx` l.624-628

"Photo enregistree lors de la validation" est du jargon technique. Thomas comprend "validation" comme la validation de son bien dans le parcours commercial, pas comme le bouton "Valider et continuer". Il peut penser que la photo sera envoyee automatiquement a une etape future.

**Correction** : Reformuler en "La photo sera envoyee au clic sur Valider et continuer" ou "Photo en attente d'envoi".

#### P1-7 -- Les messages d'erreur de validation affichent des UUIDs

**Fichier** : `app/api/pro/projects/[id]/validate/route.ts` l.180-182

Le message d'erreur dit "2 piece(s) sans nom : 3f7a2b1c-..., 8d4e5f6a-...". Thomas voit des identifiants techniques incomprehensibles au lieu d'une indication utile ("la 3e et la 5e piece n'ont pas de nom").

**Correction** : Utiliser le numero de position de la piece dans la liste plutot que l'UUID. Ou mieux, surligner les champs invalides cote client avant d'envoyer au serveur (validation locale).

#### P1-8 -- Fuite memoire blob URLs au unmount

**Fichier** : `app/projet/[id]/validation/page.tsx`

Les blob URLs creees par `URL.createObjectURL(file)` (l.133) ne sont pas revoquees quand le composant se demonte. Seul le clic X sur une photo revoque l'URL (l.429-430). Si Thomas navigue vers une autre page avec 6 photos en preview, 6 blob URLs fuient.

**Correction** : Ajouter un `useEffect` de cleanup qui revoque toutes les blob URLs au unmount.

---

### P2 -- Amelioration

#### P2-1 -- Les types de pieces sont incomplets pour un marchand de biens

**Fichier** : `app/projet/[id]/validation/page.tsx` l.32-42

La liste propose : Salon, Cuisine, Chambre, Salle de bain, WC, Bureau, Couloir, Cave, Autre. Pour un marchand de biens qui gere des immeubles entiers, il manque : Entree, Dressing, Buanderie, Garage, Terrasse, Balcon, Loggia, Cellier. Ces types sont courants dans les diagnostics et les annonces.

**Correction** : Ajouter au minimum Entree, Dressing, Buanderie, Garage. Les types exterieurs (Terrasse, Balcon) peuvent etre dans une section separee.

#### P2-2 -- Pas de validation locale avant envoi au serveur

**Fichier** : `app/projet/[id]/validation/page.tsx` l.158-253

Le handleValidate envoie directement au serveur sans verifier localement que les pieces ont un nom et un type. Si Thomas a oublie de nommer la 6e piece sur 8, il doit attendre la reponse serveur (upload des 5 photos + requete validate) avant de voir l'erreur.

**Correction** : Ajouter une validation locale avant le fetch : verifier que chaque piece a un nom non vide. Surligner les champs invalides en rouge. Ne pas envoyer au serveur tant que la validation locale echoue.

#### P2-3 -- Le champ surface n'a pas de step="0.1"

**Fichier** : `app/projet/[id]/validation/page.tsx` l.544-560

`type="number"` sans attribut `step`. Les fleches d'increment ne permettent que des entiers. Un T2 de 42.5 m2 doit etre tape manuellement, les fleches sautent a 42 ou 43. Mineur mais agacant.

**Correction** : Ajouter `step="0.1"` a l'input.

#### P2-4 -- Le bouton "Retour" utilise router.back() au lieu d'un lien vers l'etape 2

**Fichier** : `app/projet/[id]/validation/page.tsx` l.675

`router.back()` depend de l'historique du navigateur. Si Thomas a ouvert la page de validation depuis un lien direct (bookmark, WhatsApp), le "Retour" le ramene a la page precedente du navigateur (possiblement une autre application).

**Correction** : Utiliser `router.push(`/projet/${projectId}/extraction`)` pour un retour predictible vers l'etape 2.

#### P2-5 -- Pas d'indication du poids de la photo

Le bouton d'upload accepte jusqu'a 10 Mo (verifie cote serveur) mais le client n'affiche aucune indication de poids. Si Thomas prend des photos avec son iPhone 15 Pro en haute resolution (4-8 Mo chacune), il peut se retrouver avec un upload lent sans comprendre pourquoi.

**Correction** : Ajouter une indication du poids sous la preview (ex : "4.2 Mo") et un message si > 5 Mo suggere de reduire la qualite.

---

## Grille 10 criteres Thomas -- Etape 3 seule

| # | Critere | Note /10 | Detail |
|---|---------|----------|--------|
| 1 | Retrouvabilite | 8/10 | Le stepper est cliquable, je peux revenir. Mais le brouillon ne sauvegarde pas les photos -- si je reviens dans 3 semaines, je dois tout re-uploader. |
| 2 | Prix/valeur | N/A | L'etape 3 n'affiche pas de prix. Non applicable ici. |
| 3 | Qualite pro | 7/10 | Le layout est propre, les cartes de piece sont bien structurees. Mais le select sans chevron, les UUID dans les erreurs et le message technique sur les photos cassent l'impression pro. |
| 4 | Partage acquereurs | N/A | Pas de partage a cette etape. Non applicable. |
| 5 | Gestion d'erreur | 6/10 | Les erreurs serveur sont affichees en francais. Mais pas de validation locale avant envoi, les messages montrent des UUIDs, et l'indicateur dirty est casse (ref au lieu de state). |
| 6 | Simplicite | 8/10 | L'interface est comprehensible en 10 secondes. Upload photo, nommer, typer, valider. Le bouton "Ajouter une piece" est visible. |
| 7 | Confiance | 7/10 | Le branding est coherent (Header/Footer Versimo). Le brouillon rassure. Mais le message "Photo enregistree lors de la validation" cree du doute. |
| 8 | Completude | 7/10 | Les champs essentiels sont la (nom, type, surface, photo). Mais les types de pieces sont incomplets pour un marchand (manque Entree, Dressing, Buanderie, Garage). |
| 9 | Mobile-first | 6/10 | Le layout s'adapte (flex-wrap, tailles responsives). Mais le bouton supprimer piece est a 26px (min 44px), le select sans chevron est confus sur mobile. |
| 10 | Rapidite | 8/10 | Le chargement est rapide, l'upload photo est immediat en preview, la validation avec uploads sequentiels est bien feedbackee. Le brouillon sauvegarde en moins d'une seconde. |

**Moyenne : 7.1/10** (hors criteres N/A)

---

## Plan d'action par priorite

### P0

| # | Probleme | Fichier | Correction |
|---|----------|---------|------------|
| P0-1 | Indicateur dirty casse | validation/page.tsx l.59 | Remplacer `useRef(false)` par `useState(false)` pour `isDirty`. Mettre a jour les 6 endroits qui setent `isDirty.current = true` vers `setIsDirty(true)`. |

### P1

| # | Probleme | Fichier | Correction |
|---|----------|---------|------------|
| P1-1 | Pas de beforeunload | validation/page.tsx | Ajouter useEffect avec beforeunload quand isDirty === true |
| P1-2 | Photos non sauvegardees avec brouillon | validation/page.tsx + draft/route.ts | Uploader les photos avant le save draft pour les pieces existantes. Pour les nouvelles pieces, uploader apres creation (meme logique que validate) |
| P1-3 | Suppression photo non propagee serveur | validation/page.tsx + draft/route.ts ou nouvelle route DELETE | Propager la suppression de photo au serveur |
| P1-4 | Bouton supprimer piece trop petit | validation/page.tsx l.570 | Ajouter min-w-[44px] min-h-[44px] |
| P1-5 | Select sans chevron | validation/page.tsx l.522 | Ajouter SVG chevron ou retirer appearance-none |
| P1-6 | Message photo ambigu | validation/page.tsx l.627 | Reformuler en "Photo envoyee au clic sur Valider et continuer" |
| P1-7 | Messages erreur avec UUIDs | validate/route.ts l.181 | Utiliser des numeros de position ou des noms de pieces |
| P1-8 | Fuite memoire blob URLs | validation/page.tsx | useEffect cleanup au unmount |

### P2

| # | Probleme | Correction |
|---|----------|------------|
| P2-1 | Types de pieces incomplets | Ajouter Entree, Dressing, Buanderie, Garage aux ROOM_TYPE_OPTIONS |
| P2-2 | Pas de validation locale | Verifier noms non vides + surligner champs invalides avant envoi serveur |
| P2-3 | Champ surface sans step | Ajouter step="0.1" |
| P2-4 | Retour imprevisible | router.push vers etape 2 au lieu de router.back() |
| P2-5 | Pas d'indication poids photo | Afficher poids sous preview |

---

## Bilan

L'etape 3 est passee de 8.0/10 (audit precedent) a 7.2/10 dans cet audit plus detaille. La regression apparente s'explique par un examen plus profond : le brouillon a ete ajoute (progres reel) mais il ne sauvegarde pas les photos (trou operationnel), l'indicateur dirty est casse depuis le debut (jamais detecte avant car il fallait analyser le comportement React du useRef), et les P1 du premier audit (beforeunload, bouton trop petit) n'ont pas ete corrigees.

Le P0-1 (indicateur dirty casse) est le plus urgent : Thomas croit que ses modifications sont sauvegardees alors qu'elles ne le sont pas. C'est une source de perte de donnees sur un formulaire qui peut prendre 10+ minutes a remplir avec 8 pieces et des photos.

Le P1-2 (photos non sauvegardees avec brouillon) est le plus impactant operationnellement : le brouillon donne une fausse impression de securite. Thomas sauvegarde, revient 3 semaines plus tard, et doit re-uploader toutes les photos.

Score : 7.2/10 -- en dessous du seuil de 9.5/10. Itérations correctives requises.
