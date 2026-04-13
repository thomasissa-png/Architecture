# Re-audit Thomas Berger -- Etapes 1-2-3 (Post session 42)

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux
> Date : 2026-04-10
> Perimetre : Etapes 1 (Nouveau bien), 2 (Extraction), 3 (Validation)
> Contexte : re-audit apres corrections session 42
> Seuil : 9.5/10 minimum (preference fondateur)

---

## Note globale Etapes 1-2-3 : 8.5 / 10

## Verdict en une phrase

"Les bases sont solides -- formulaire propre, extraction fluide, validation bien pensee avec brouillon et photos. Mais des incoherences UI (bouton delete photo deborde, mot 'credit' residuel, stepper desktop a 40px) et l'absence d'apercu du plan freinent la confiance."

---

## Etape 1 -- Nouveau bien : 8.5 / 10

### Grille 10 criteres

| # | Critere | Note /10 | Observation |
|---|---------|----------|-------------|
| 1 | Retrouvabilite | 8 | Page dediee /projet/nouveau, stepper visible. Mais pas de lien vers "mes projets" depuis cette page -- si je quitte, comment je retrouve mon brouillon ? |
| 2 | Prix/valeur | 9 | Affiche clairement "Gratuit pendant la beta" + "Dossier PDF inclus". Le hasCredits branch montre "1 projet inclus dans votre abonnement". Pas d'ambiguite sur le prix. |
| 3 | Qualite pro | 9 | Design minimaliste, palette sage/foreground coherente, spacing propre. Ca fait serieux. |
| 4 | Partage acquereurs | N/A | Pas pertinent a cette etape. |
| 5 | Gestion erreur | 9 | Messages clairs : "Format accepte : PDF, JPG, PNG, WEBP, HEIC", "Le fichier ne doit pas depasser 20 Mo", "Erreur de connexion. Verifiez votre reseau." Pas d'UUID, pas de jargon. Erreurs par champ (fieldErrors) avec role="alert". |
| 6 | Simplicite | 9 | 3 champs + 1 upload. Je comprends en 5 secondes. Le drag & drop est intuitif. Placeholder utile "Ex : 12 rue de la Paix, 33000 Bordeaux". |
| 7 | Confiance | 8 | Header "internal", branding coherent. Mais le commentaire dans le docstring dit "puis paie 99 EUR (ou utilise un credit Pro)" alors que l'UI dit "Gratuit pendant la beta" -- incoherence interne qui ne touche pas l'utilisateur mais trahit un manque de cleanup. |
| 8 | Completude | 8 | Adresse, type de bien (5 options correctes), surface optionnelle, plan. Manque : nombre d'etages (utile pour immeuble), annee de construction (DPE). Pas bloquant pour la beta. |
| 9 | Mobile-first | 8 | Bouton supprimer plan : min-w-[44px] min-h-[44px] = OK. Zone drag & drop : p-8 = bien. Mais aucun test du select natif sur iOS (apparence personnalisee avec appearance-none peut casser). |
| 10 | Rapidite | 9 | Formulaire simple, un seul fetch POST, redirect immediate. Spinner "Creation en cours..." pendant le submit. |

### Points positifs
- Drag & drop + click avec feedback visuel (isDragOver change de couleur)
- Validation MIME cote client avant l'upload (evite un aller-retour serveur)
- Bouton disabled si adresse vide ou pas de plan (impossible de soumettre un formulaire incomplet)
- Apercu miniature du plan (image) avec nom de fichier et taille
- AuthModal declenche si pas connecte (pas de redirect vers /login)
- URL.revokeObjectURL au handleRemovePlan (pas de fuite memoire)

### Problemes restants

**P1-1 -- Mot "credit" residuel dans le code**

Fichier : `app/projet/nouveau/page.tsx` l.9, l.38, l.44-45

Le docstring dit "credit Pro" et le helper s'appelle `useProStatus` avec `credits_remaining`. La regle permanente dit : "le terme commercial est 'visuel' (pas 'credit')". L'utilisateur ne voit pas "credit" dans l'UI car le branch `hasCredits` affiche "1 projet inclus dans votre abonnement", mais c'est un risque de regression si quelqu'un ajoute un affichage base sur ces variables.

**Action** : renommer `credits_remaining` en `projects_remaining` ou `visuels_remaining` dans le composant.

**P2-1 -- Pas de lien "Mes projets" depuis la page creation**

Si Thomas navigue vers /projet/nouveau puis change d'avis, il n'a que le bouton "Annuler" qui renvoie vers "/". Pas de lien vers /mes-biens ou /projets pour retrouver ses projets existants.

**Action** : ajouter un lien "Mes projets" dans le header ou sous le bouton Annuler.

**P2-2 -- Le docstring mentionne "paie 99 EUR" alors que c'est gratuit**

Fichier : `app/projet/nouveau/page.tsx` l.9

Le commentaire de tete dit "puis paie 99 EUR" mais la ligne 34 dit "Pricing removed -- free during beta". Incoherence interne.

**Action** : mettre a jour le docstring pour refleter la realite beta.

---

## Etape 2 -- Extraction IA : 8.0 / 10

### Grille 10 criteres

| # | Critere | Note /10 | Observation |
|---|---------|----------|-------------|
| 1 | Retrouvabilite | 8 | URL claire /projet/[id]/extraction. Stepper avec step 1 completee. Mais pas de breadcrumb ni titre du bien (adresse) affiche. |
| 2 | Prix/valeur | 9 | Pas de cout additionnel visible, coherent avec "gratuit pendant la beta". |
| 3 | Qualite pro | 8 | Animation de scan sympa (ligne bleue qui parcourt un plan). Points pulsants. Timer avec messages progressifs. Fait serieux. |
| 4 | Partage acquereurs | N/A | Pas pertinent. |
| 5 | Gestion erreur | 9 | Excellent. 3 branches d'erreur : plan illisible (avec redirection manuelle), rate limit (message clair + Retry-After), deja extrait (redirect auto 409). Message reseau generique correct. Pas d'UUID ni de jargon. |
| 6 | Simplicite | 9 | L'extraction est automatique au mount. Thomas n'a rien a faire. Le checkAndRun() verifie le status avant de lancer -- pas de double extraction si on revient en arriere. |
| 7 | Confiance | 7 | Pas d'apercu du plan uploade. Thomas ne voit pas QUEL plan est en cours d'analyse. Sur un projet avec 3 biens en parallele, c'est risque de confusion. |
| 8 | Completude | 7 | Les rooms extraites affichent nom + type + surface via RoomCard. Mais pas de dimensions (longueur x largeur), pas de confiance de l'IA, pas d'apercu du plan avec les pieces annotees. |
| 9 | Mobile-first | 8 | Layout colonne, max-w-2xl centre, boutons pleine largeur sur mobile. Animation scan responsive. |
| 10 | Rapidite | 9 | Timer affiche, messages progressifs (<10s, 10-30s, >30s). Le checkAndRun evite un flash de chargement inutile si deja extrait. |

### Points positifs
- Check status AVANT extraction (evite le double-trigger au reload -- fix session 41)
- Messages d'erreur progressifs avec estimation de temps
- Bouton "Saisir les pieces manuellement" visible immediatement en cas d'erreur
- Boutons erreur : "Reessayer" + "Saisir manuellement" = 2 options claires
- RoomCard reutilise pour afficher les resultats (coherence UI)
- inferRoomType() dans la route API : gere les accents FR, abbreviations (SDB, WC), noms anglais

### Problemes restants

**P1-2 -- Pas d'apercu du plan en cours d'analyse**

Thomas uploade un plan, est redirige vers l'extraction, et voit une animation generique. Il ne voit pas SON plan. Sur 8-12 operations par an avec parfois 3 biens en parallele, c'est un risque de confusion.

**Action** : afficher une miniature du plan uploade a cote de l'animation de scan, ou en arriere-plan de l'animation.

**P1-3 -- Pas de titre du bien (adresse) affiche sur la page**

La page dit "Extraction du plan" mais pas "Extraction du plan -- 12 rue de la Paix, Bordeaux". Thomas ne sait pas pour quel bien il regarde.

**Action** : fetcher l'adresse du projet depuis l'API status et l'afficher sous le titre h1.

**P2-3 -- Le success state ne montre pas les surfaces**

Les RoomCard dans le success state recoivent `surface_m2: undefined` (le map ne passe que id, name, room_type, status). Thomas voit "Salon - validated" mais pas "Salon - 22 m²".

Fichier : `app/projet/[id]/extraction/page.tsx` l.290-298 -- le RoomCard recoit `status: "validated"` mais pas `surface_m2`.

**Action** : passer surface_m2 au RoomCard pour afficher la surface detectee.

**P2-4 -- Le succes "0 pieces" est gere mais redondant**

Si rooms.length === 0 apres un succes (l.302-308), le message dit "Aucune piece extraite". Mais dans la route API, 0 pieces = extraction_failed, pas succes. Ce block ne devrait jamais s'afficher. Code mort.

**Action** : supprimer ou convertir en guard defensif silencieux.

---

## Etape 3 -- Validation : 9.0 / 10

### Grille 10 criteres

| # | Critere | Note /10 | Observation |
|---|---------|----------|-------------|
| 1 | Retrouvabilite | 9 | Stepper avec completedSteps dynamique (getCompletedSteps), URL claire. Le brouillon se sauvegarde avec feedback "Brouillon sauvegarde". |
| 2 | Prix/valeur | 9 | Pas de cout additionnel. La valeur est implicite : les photos uploadees ici serviront a generer les visuels meubles. |
| 3 | Qualite pro | 9 | Cartes par piece avec photo miniature, nom editable, type en select, surface en input. Design propre et fonctionnel. Warning orange clair si pas de photo. |
| 4 | Partage acquereurs | N/A | Pas pertinent a cette etape. |
| 5 | Gestion erreur | 9 | Erreurs upload par piece ("Echec de l'upload de la photo pour 'Salon'. Reessayez."), validation errors en liste a puces, erreur reseau generique. Pas de jargon. |
| 6 | Simplicite | 9 | Chaque piece = une carte avec photo + nom + type + surface. Ajouter une piece = un bouton. Supprimer = une icone poubelle. Je comprends instantanement. |
| 7 | Confiance | 9 | 3 boutons clairs : Retour / Sauvegarder le brouillon / Valider et continuer. Feedback "Modifications non sauvegardees" en orange. Feedback "Brouillon sauvegarde" en vert. |
| 8 | Completude | 9 | Nom, type (9 options), surface, photo par piece. Warning si pas de photo. Counter "X/Y pieces avec photo". Ajout manuel. Suppression avec confirmation. |
| 9 | Mobile-first | 8 | Photo miniature 80x80 (w-20 h-20), delete button min-w-[44px] min-h-[44px] = OK. Mais le bouton delete photo overlay (l.532) a w-8 h-8 ET min-w-[44px] = conflit CSS. Et 3 boutons en bas sur mobile = potentiel overflow horizontal. |
| 10 | Rapidite | 9 | Upload photos 3 phases (existantes avant validate, validate, nouvelles apres validate). Draft save separement. Progress "Upload photo 2/5...". |

### Points positifs
- **isDirty en useState** (pas useRef) -- conforme a la preference fondateur
- **beforeunload handler** -- protege contre la fermeture accidentelle
- **Blob URLs cleanup** au unmount via blobUrlsRef -- pas de fuite memoire
- **Upload 3 phases** : photos existantes d'abord, puis validate (cree les nouvelles pieces), puis photos nouvelles. Robuste.
- **DELETE endpoint** pour supprimer une photo cote serveur quand on supprime localement
- **Draft save** avec room_id_mapping pour les nouvelles pieces
- **Suppression piece** avec window.confirm (pas de suppression accidentelle)
- **Warning "Photo enregistree lors de la validation"** pour les photos locales non encore persistees
- **Empty state** bien gere avec "Aucune piece ajoutee" + bouton "Ajouter votre premiere piece"

### Problemes restants

**P1-4 -- Conflit CSS sur le bouton supprimer photo (overlay)**

Fichier : `app/projet/[id]/validation/page.tsx` l.532

```
className="absolute top-1 right-1 w-8 h-8 min-w-[44px] min-h-[44px] rounded-full bg-black/50..."
```

`w-8` = 32px fixe. `min-w-[44px]` = 44px minimum. Le min-w gagne, donc visuellement c'est 44px. Mais le `w-8` est trompeur et le element est un carre de 44px avec une icone de 10px au centre -- le ratio icone/bouton est bizarre. Sur la miniature de 80x80, un bouton de 44px prend plus de la moitie de la largeur.

**Action** : retirer `w-8 h-8`, garder uniquement `min-w-[44px] min-h-[44px]` (ou passer a `w-9 h-9 min-w-[44px] min-h-[44px]`). Augmenter l'icone a 12-14px pour un meilleur ratio.

**P1-5 -- 3 boutons en footer sur mobile = overflow potentiel**

Fichier : `app/projet/[id]/validation/page.tsx` l.765-831

"Retour" + "Sauvegarder le brouillon" + "Valider et continuer" = 3 boutons dans un `flex gap-3`. Sur un iPhone SE (320px viewport), le texte "Sauvegarder le brouillon" ne rentre pas. Pas de `flex-wrap` ni de stack vertical sur mobile.

**Action** : ajouter `flex-wrap` ou passer en `flex-col sm:flex-row` pour stacker les boutons sur petit ecran.

**P2-5 -- Pas de titre du bien (adresse) sur la page**

Meme probleme que l'etape 2. Le titre dit "Verifiez les pieces de votre bien" mais pas LEQUEL. Sur 8-12 ops/an, c'est confus.

**Action** : afficher l'adresse du bien sous le h1.

**P2-6 -- L'API draft ne valide pas les noms vides**

Fichier : `app/api/pro/projects/[id]/draft/route.ts` l.27

Le schema Zod accepte `name: z.string()` sans `.min(1)`. Thomas peut sauvegarder un brouillon avec des pieces sans nom. Ce n'est pas bloquant (le validate devrait checker), mais c'est incoherent avec l'experience.

**Action** : soit accepter volontairement (brouillon = permissif), soit ajouter un warning cote client si nom vide.

---

## Stepper (ProStepper) : 9.0 / 10

### Points positifs
- **Mobile touch target 44px** : `min-w-[44px] min-h-[44px]` sur le bouton mobile -- conforme Apple HIG
- **Desktop dots 40px** : `w-10 h-10` = 40px, correct pour desktop
- **7 etapes** avec labels + sublabels
- **Navigation intelligente** : seuls les steps completed/active sont cliquables
- **Accessibilite** : aria-current="step", aria-label par etat (terminee, en cours, erreur, verrouillee)
- **Vertical compact** sur mobile (pas de scroll horizontal)

### Probleme restant

**P2-7 -- Desktop dots a 40px au lieu de 44px**

Fichier : `components/marchand/ProStepper.tsx` l.183

Les dots desktop font `w-10 h-10` = 40px. Apple HIG recommande 44px minimum pour les cibles tactiles. Sur un laptop avec trackpad/souris, 40px est acceptable, mais des utilisateurs desktop tactiles (Surface, iPad avec clavier) pourraient avoir du mal.

**Action** : passer a `w-11 h-11` (44px) pour homogeneite avec le mobile. Impact visuel minimal.

---

## Resume des problemes

| ID | Severite | Etape | Description |
|---|---|---|---|
| P1-1 | P1 | 1 | Mot "credit" residuel dans le code (docstring + variable) |
| P1-2 | P1 | 2 | Pas d'apercu du plan en cours d'analyse |
| P1-3 | P1 | 2 | Pas de titre du bien (adresse) sur la page extraction |
| P1-4 | P1 | 3 | Conflit CSS w-8/min-w-44 sur bouton delete photo overlay |
| P1-5 | P1 | 3 | 3 boutons footer = overflow mobile sur petit ecran |
| P2-1 | P2 | 1 | Pas de lien "Mes projets" depuis creation |
| P2-2 | P2 | 1 | Docstring mentionne "99 EUR" alors que c'est gratuit |
| P2-3 | P2 | 2 | Success state ne montre pas les surfaces |
| P2-4 | P2 | 2 | Code mort "0 pieces en succes" |
| P2-5 | P2 | 3 | Pas de titre du bien (adresse) sur la page validation |
| P2-6 | P2 | 3 | Draft accepte des noms de piece vides |
| P2-7 | P2 | Stepper | Desktop dots 40px au lieu de 44px |

---

## Verdict par etape

| Etape | Note | Verdict | Justification |
|---|---|---|---|
| 1 -- Nouveau bien | 8.5/10 | FAIL (<9.5) | Solide mais "credit" residuel + pas de lien retrouvabilite |
| 2 -- Extraction IA | 8.0/10 | FAIL (<9.5) | Automatique et bien gere, mais manque apercu plan + adresse du bien |
| 3 -- Validation | 9.0/10 | FAIL (<9.5) | La meilleure etape, brouillon + photos + delete solides. Mais conflit CSS + overflow mobile |
| Stepper | 9.0/10 | FAIL (<9.5) | Touch targets corrects sur mobile, dots desktop a 40px |

## Verdict global : FAIL (8.5/10 < 9.5)

Les corrections de la session 42 sont bien appliquees :
- "credit" supprime de l'UI visible (mais residuel dans le code)
- inferRoomType() fonctionne avec accents et abbreviations FR
- Stepper dots 44px sur mobile
- Messages d'erreur sans UUIDs
- Bouton supprimer 44px touch target
- Photos sauvegardees avec le brouillon (3 phases upload)
- Suppression photo propagee au serveur (DELETE endpoint)
- Blob URLs cleanup au unmount
- isDirty en useState
- beforeunload handler

Pour atteindre 9.5/10, il faut corriger les 5 P1 :
1. Supprimer le vocabulaire "credit" residuel
2. Afficher un apercu du plan pendant l'extraction
3. Afficher l'adresse du bien sur les pages etapes 2 et 3
4. Corriger le conflit CSS du bouton delete photo overlay
5. Stacker les 3 boutons footer sur mobile (flex-col sm:flex-row)
