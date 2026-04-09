# Audit parcours marchand complet -- Thomas Berger

> Auditeur : Thomas Berger, 35 ans, marchand de biens, Bordeaux, 8-12 ops/an
> Devices : iPhone 15 Pro (chantier) + laptop Windows (bureau)
> Methode : lecture code source de chaque page, simulation du parcours mental etape par etape
> Date : 2026-04-09 -- Session 41

---

## Synthese executive

| Etape | Page | Note | Statut |
|---|---|---|---|
| 0 | Landing /marchand | 8.8/10 | Solide |
| 1 | /projet/nouveau | 7.5/10 | Frictions fortes |
| 2 | /projet/[id]/extraction | 8.2/10 | Solide |
| 3 | /projet/[id]/validation | 7.0/10 | Frictions critiques |
| 4 | /projet/[id]/qualification | 7.8/10 | Fonctionnel, 2 frictions |
| 5 | /projet/[id]/recommandations | 8.0/10 | Solide |
| 6 | /projet/[id]/generation | 8.5/10 | Solide |
| 7 | /projet/[id]/dossier | 7.2/10 | Frictions fortes |
| - | ProStepper | 8.5/10 | Solide |
| - | RecommendationCard | 9.0/10 | Excellent |
| - | RoomCard | 8.5/10 | Solide |

**Note globale : 7.9/10** -- En dessous du seuil 9.5/10. Parcours coherent dans sa structure 7 etapes, mais des frictions P0/P1 a corriger en priorite sur le prix, le flux validation, l'auto-save, le partage mobile, et le stepper vertical sur mobile.

**Nombre de corrections identifiees :** 8 P0, 12 P1, 9 P2

---

## Page 0 -- Landing /marchand (8.8/10)

### Ce que Thomas comprend immediatement

- Le titre est excellent : "29 euros/mois. Vos dossiers de pre-commercialisation en 10 minutes, pas 10 jours." Thomas comprend le prix, la valeur, la vitesse. 10/10 sur la comprehension immediate.
- Le sous-titre "vs 200-500 euros par planche chez un home stager" ancre le ROI instantanement.
- La section "Le probleme que vous connaissez" reprend les 3 frustrations exactes de Thomas (prix, delai, projection acquereurs). Vocabulaire 100% metier.
- Le bloc ROI chiffre (10 ops/an x 3 visuels = 9000 euros vs 348 euros/an = economie 97%) est parfait pour Thomas qui raisonne en marge par operation.
- La FAQ repond aux objections Thomas (conformite juridique, logo, chantier mobile, qualite plaquette).

### Frictions identifiees

**P1-01 : Le CTA principal "Creer mon dossier Pro" renvoie vers /#outil** -- L'ancre /#outil est la homepage generale, pas le parcours marchand. Thomas arrive sur la page /marchand parce qu'il est marchand. Le CTA devrait pointer vers /projet/nouveau (le vrai parcours marchand). Pareil pour "Essayer gratuitement" et les CTA "Essayer" des tiers pricing.

**P2-01 : Pas de lien vers le parcours marchand depuis les CTA pricing.** "Acheter le Starter" pointe vers /pricing?buy=starter, "S'abonner au Pro" vers /pricing?buy=pro. Correct pour l'achat, mais Thomas qui clique "Essayer" (Decouverte gratuit) est renvoye vers /#outil. Il devrait arriver sur /projet/nouveau.

**P2-02 : Les 3 etapes "Comment ca marche" sont generiques.** Uploadez / Choisissez / Telechargez -- c'est le parcours standard de la homepage, pas le parcours 7 etapes marchand (Projet > Extraction > Validation > Qualification > Recommandations > Visuels > Dossier). Thomas ne decouvre la complexite qu'une fois dedans.

### Note detaillee

| Critere | Note | Commentaire |
|---|---|---|
| Comprehension immediate (x2) | 10/10 | Prix, valeur, cible -- tout est la en 5 secondes |
| Vocabulaire metier | 10/10 | "plaquette", "pre-commercialisation", "acquereurs", "portails immo" |
| Flux sans friction (x2) | 7/10 | CTA vers /#outil au lieu de /projet/nouveau |
| Feedback visuel | 9/10 | Avant/apres, social proof, chiffres cles |
| Mobile-first | 9/10 | Touch targets 44px, responsive, FAQ details/summary |
| Valeur percue | 10/10 | ROI explicite, economie 97%, prix/visuel |
| Temps percu | 9/10 | "90 secondes", "10 minutes pas 10 jours" |
| Confiance | 9/10 | FAQ juridique, "sans engagement", "rembourse si non conforme" |
| Partage acquereurs | 8/10 | Mentionne mais pas demontre (pas de screenshot dossier) |
| ROI evident | 10/10 | Bloc chiffre dedie |

---

## Page 1 -- /projet/nouveau (7.5/10)

### Ce que Thomas comprend

Le titre "Nouveau bien" est clair. Le formulaire est court (4 champs). Le prix 99 euros TTC est affiche avant le bouton. Le label "Dossier PDF inclus" en badge est rassurant.

### Frictions identifiees

**P0-01 : Le prix de 99 euros/bien est contradictoire avec la landing.** La landing dit "29 euros/mois, 50 visuels/mois". Cette page dit "99 euros TTC par bien". Thomas qui vient de la landing /marchand s'attend a utiliser son abonnement Pro. La variable `PRICE_PER_BIEN = "99 euros"` est en dur dans le code. Pas de logique "si Pro, utiliser credit abo". Confusion majeure. Thomas va fermer la page.

**P0-02 : Le bouton dit "Payer 99 euros et commencer" sans aucune mention de l'abonnement Pro.** Si Thomas est deja abonne, il s'attend a ce que le bien soit inclus dans ses 50 visuels/mois. Pas de detection du statut d'abonnement. Pas de fallback "Utiliser vos credits Pro".

**P1-02 : "Plan du bien" est obligatoire (planFile requis dans handleSubmit).** Thomas sur un chantier a des PHOTOS, pas forcement un plan. Le label dit "Plan du bien" -- Thomas pense a un plan d'architecte (PDF). Sur un T3 en achat-revente, il n'a souvent qu'un plan sommaire d'agence ou rien du tout. Il devrait pouvoir commencer SANS plan et le fournir plus tard.

**P1-03 : L'upload n'a pas de guidance sur le type de plan attendu.** "PDF, PNG, JPG -- max 20 Mo" ne dit pas a Thomas s'il faut un plan d'architecte, un plan cadastral, un scan d'agence, ou juste une photo de plan sur mur. Pas d'exemple.

**P2-03 : Pas de sauvegarde brouillon.** Si Thomas est interrompu (appel chantier, reunion), tout est perdu. Pas de localStorage, pas de draft server-side.

### Note detaillee

| Critere | Note | Commentaire |
|---|---|---|
| Comprehension immediate (x2) | 8/10 | Titre clair, formulaire court, mais confusion prix |
| Vocabulaire metier | 8/10 | "Adresse du bien", "Type de bien", "Surface" -- correct |
| Flux sans friction (x2) | 5/10 | Prix contradictoire = friction critique, plan obligatoire |
| Feedback visuel | 9/10 | Preview plan, spinner, erreur claire |
| Mobile-first | 8/10 | Formulaire natif, drag&drop + click, touch targets OK |
| Valeur percue | 6/10 | 99 euros par bien = perception chere apres la promesse landing |
| Temps percu | 8/10 | Formulaire rapide a remplir |
| Confiance | 7/10 | "Rembourse si non conforme" aide, mais dissonance prix |
| Partage acquereurs | N/A | Pas pertinent a cette etape |
| ROI evident | 5/10 | 99 euros/bien x 10 biens = 990 euros/an. Pas 348 euros/an comme promis |

---

## Page 2 -- /projet/[id]/extraction (8.2/10)

### Ce que Thomas comprend

L'animation scan est rassurante. Le timer donne de la visibilite ("~30 secondes"). Le message d'erreur propose 2 options (reessayer ou saisie manuelle). Le compteur "X pieces detectees" est clair.

### Frictions identifiees

**P1-04 : Le vocabulaire "Extraction" dans le stepper est technique.** Thomas ne parle pas d'"extraction". Il dirait "detection des pieces" ou "analyse du plan". Le stepper affiche "Extraction / IA" -- les 2 mots sont du jargon.

**P1-05 : Les RoomCards en etat success affichent status "pending" (en dur dans le map).** Code : `status: "pending"`. Les cartes montrent donc toutes "En attente" alors que l'extraction est terminee. Devrait etre "validated" ou au minimum sans badge.

**P2-04 : Pas d'estimation du nombre de pieces avant l'extraction.** Thomas aimerait savoir "on a detecte 5 pieces, ca semble correct ?" Actuellement il voit le resultat final sans contexte. Sur un T3, si l'IA detecte 8 pieces, Thomas sait que c'est suspect. Pas de question de confirmation.

**P2-05 : Le bouton "Valider et continuer" n'est pas assez differentie du bouton "Retour".** Les 2 sont cote a cote, meme hauteur. "Valider et continuer" est vert plein, "Retour" est outlined. Correct en desktop mais sur mobile, le bouton Retour (meme min-height) peut provoquer un tap accidentel.

### Note detaillee

| Critere | Note | Commentaire |
|---|---|---|
| Comprehension immediate (x2) | 8/10 | Animation scan + timer clairs |
| Vocabulaire metier | 7/10 | "Extraction" est du jargon technique |
| Flux sans friction (x2) | 8/10 | Fallback saisie manuelle excellent |
| Feedback visuel | 10/10 | Scan, timer, dots pulsants, badge succes |
| Mobile-first | 8/10 | Layout OK, touch targets corrects |
| Valeur percue | 8/10 | L'IA fait le travail -- Thomas gagne du temps |
| Temps percu | 9/10 | 30 secondes affiches, timer en temps reel |
| Confiance | 8/10 | Stepper visible, progression claire |
| Partage acquereurs | N/A | |
| ROI evident | 8/10 | Automatise vs saisie manuelle |

---

## Page 3 -- /projet/[id]/validation (7.0/10)

### Ce que Thomas comprend

Le titre "Verifiez les pieces de votre bien" est clair. Le compteur "X/Y pieces avec photo" donne un objectif. L'alerte "Pas de photo -- cette piece ne sera pas generee" est un bon forcing positif.

### Frictions identifiees

**P0-03 : L'auto-save ne sauvegarde RIEN.** Le code `handleAutoSave` (lignes 108-124) ne fait aucun appel API. Il met juste `setSaveStatus("saved")` et `isDirty.current = false`. Thomas voit "Sauvegarde" dans l'UI, mais rien n'est persiste. Si il ferme l'onglet ou est interrompu, toutes les modifications sont perdues. Trompeur et dangereux.

**P0-04 : Le bouton "Valider et continuer" saute les etapes 4 et 5.** Le code (ligne 193) fait `router.push(/projet/${projectId}/generation)` -- il va directement a la generation, bypassing qualification (etape 4) et recommandations (etape 5). Le commentaire dans le code confirme : "For now, redirect to generation as qualification/recommendations are future steps". Mais le stepper affiche 7 etapes. Thomas voit les etapes 4 et 5 dans le stepper, les bypasse sans le savoir.

**P1-06 : Les photos associees aux pieces ne sont pas uploadees au serveur.** `handlePhotoSelect` cree un blob URL local, mais il n'y a aucun appel `fetch` pour uploader le fichier. Les `photoFile` sont stockes dans le state React mais jamais envoyes. Si Thomas associe une photo, ferme la page, revient -- la photo a disparu.

**P1-07 : Le bouton "Supprimer la photo" sur mobile est un cercle de 20px (w-5 h-5).** C'est en dessous du seuil 44px pour le touch target. Sur l'iPhone de Thomas, ca va etre difficile a taper.

**P2-06 : Pas de drag-and-drop pour reordonner les pieces.** Thomas qui a 6 pieces veut peut-etre les reordonner (salon d'abord, puis cuisine, etc.). Pas critique mais attendu sur un outil pro.

### Note detaillee

| Critere | Note | Commentaire |
|---|---|---|
| Comprehension immediate (x2) | 8/10 | Titre clair, compteur photos |
| Vocabulaire metier | 8/10 | "Pieces", "surface m2", "type" |
| Flux sans friction (x2) | 4/10 | Auto-save trompeuse, saute 2 etapes, photos non persistees |
| Feedback visuel | 7/10 | Faux feedback "Sauvegarde" |
| Mobile-first | 7/10 | Touch target trop petit sur bouton supprimer photo |
| Valeur percue | 7/10 | L'interface est claire mais la valeur se perd si rien n'est sauvegarde |
| Temps percu | 8/10 | Rapide a remplir |
| Confiance | 5/10 | Auto-save mensongere = perte de confiance |
| Partage acquereurs | N/A | |
| ROI evident | 7/10 | |

---

## Page 4 -- /projet/[id]/qualification (7.8/10)

### Ce que Thomas comprend

Le titre "Qualification des besoins" est un peu technique mais le sous-titre "Definissez la cible acheteur et le style pour chaque lot" est clair. Les selecteurs cible acheteur (Famille, Couple, Investisseur...) et style (12 styles) sont bien formules en francais.

### Frictions identifiees

**P0-05 : Le terme "Lot" est inadapte pour un bien simple.** Si Thomas a un T3, il voit "Lot principal" comme en-tete de section. Il ne comprend pas pourquoi son T3 est un "lot". Le concept de lot est pertinent pour un immeuble de rapport (5 lots = 5 appartements), mais pour un bien unique c'est confus. Il devrait voir "Votre bien" ou le nom du bien (adresse).

**P1-08 : Le champ "Budget travaux estime" n'a pas d'unite visible dans le placeholder.** Le placeholder dit "Ex: 25000" -- Thomas ne sait pas si c'est en euros, en milliers, HT ou TTC. L'icone euro est en suffixe mais le placeholder devrait dire "Ex: 25 000 euros".

**P1-09 : Le champ "Contraintes specifiques" est un textarea libre.** Thomas ne sait pas quoi mettre. Le placeholder "Ex: PMR, garder la cheminee, pas de travaux lourds..." est un bon depart mais c'est des cases a cocher qui seraient plus efficaces (accessibilite PMR, conservation elements existants, budget serre, etc.).

**P2-07 : Les vignettes photos des pieces sont petites (aspect 4/3 dans une grille 2 ou 3 colonnes).** Sur mobile, ca fait des vignettes de ~50px de large. Thomas ne peut pas verifier si c'est la bonne photo associee a la bonne piece.

**P2-08 : Le bouton "Retour" est apres le bouton principal.** Convention : le bouton retour est a gauche. Ici sur mobile (flex-col), "Retour" est le dernier element visible. Thomas doit scroller pour le trouver.

### Note detaillee

| Critere | Note | Commentaire |
|---|---|---|
| Comprehension immediate (x2) | 7/10 | "Lot" confus pour un bien simple |
| Vocabulaire metier | 8/10 | "Cible acheteur", "style" -- vocabulaire marchand |
| Flux sans friction (x2) | 8/10 | Formulaire clair, 2 champs obligatoires seulement |
| Feedback visuel | 8/10 | Succes vert avec redirect, spinner saving |
| Mobile-first | 7/10 | Vignettes photos trop petites |
| Valeur percue | 8/10 | La qualification guide les recommandations IA -- Thomas voit l'interet |
| Temps percu | 8/10 | Rapide, 2 selects + 2 optionnels |
| Confiance | 8/10 | Les options cible acheteur sont realistes |
| Partage acquereurs | N/A | |
| ROI evident | 7/10 | |

---

## Page 5 -- /projet/[id]/recommandations (8.0/10)

### Ce que Thomas comprend

Le titre "Recommandations de l'architecte IA" est un bon angle. L'IA se positionne comme un expert, pas comme un outil. Thomas voit des cartes avec des propositions concretes (redistribution, fusion, conversion, optimisation) qu'il peut accepter ou ignorer. Le compteur sticky en bas ("X recommandations acceptees / Y total") est un bon recap.

### Frictions identifiees

**P1-10 : Les decisions (accepter/ignorer) sont fire-and-forget sans feedback.** Le PATCH est envoye au serveur mais le catch est silencieux (lignes 207-225). Si ca echoue, Thomas voit la carte comme "Appliquee" alors qu'elle ne l'est pas. Pas de toast confirmation, pas de retry.

**P1-11 : Le bouton "Lancer la generation des visuels" est toujours visible, meme si Thomas n'a decide sur aucune recommandation.** Il devrait y avoir au minimum un avertissement "Vous avez X recommandations en attente -- lancer quand meme ?" ou un disable tant que des decisions sont pending.

**P2-09 : Pas de bouton "Tout accepter" ou "Tout ignorer".** Si Thomas a 8 recommandations et veut toutes les accepter rapidement, il doit cliquer 8 fois. Un bulk action serait apprecie.

### Note detaillee

| Critere | Note | Commentaire |
|---|---|---|
| Comprehension immediate (x2) | 9/10 | "Architecte IA recommande" est parlant |
| Vocabulaire metier | 8/10 | "Redistribution", "fusion", "cout estime" -- correct |
| Flux sans friction (x2) | 7/10 | Pas de confirmation bulk, pas de warning si pas de decision |
| Feedback visuel | 8/10 | Badge "Appliquee"/"Ignoree", compteur sticky |
| Mobile-first | 8/10 | Cartes full-width, touch targets corrects |
| Valeur percue | 9/10 | L'IA propose des optimisations avec cout -- forte valeur percue |
| Temps percu | 8/10 | Generation rapide, mais decisions une par une |
| Confiance | 8/10 | Les couts estimes et niveaux d'impact rassurent |
| Partage acquereurs | N/A | |
| ROI evident | 8/10 | Les optimisations proposees ont un cout estime -- Thomas chiffre |

---

## Page 6 -- /projet/[id]/generation (8.5/10)

### Ce que Thomas comprend

L'UI est excellente. La barre de progression (pourcentage + X/Y terminees + timer) donne une visibilite totale. Chaque piece a sa vignette avec un statut en temps reel (En attente, Passe 1 surfaces, Passe 2 mobilier, Terminee, Erreur). Le polling toutes les 3 secondes est transparent pour Thomas. L'estimation "~X minutes" est utile.

### Frictions identifiees

**P1-12 : Les labels "Passe 1 -- surfaces" et "Passe 2 -- mobilier" sont du jargon technique.** Thomas ne sait pas ce qu'est une "passe". Il prefererait "Preparation de la piece..." puis "Ajout du mobilier...". Vocabulaire utilisateur, pas vocabulaire pipeline.

**P2-10 : Le retry en cas d'erreur fait un window.location.reload() (ligne 255).** C'est brutal. Toutes les pieces deja generees restent en DB (cote serveur le 409 gere ca), mais Thomas voit un flash blanc + rechargement complet. Un retry API sans reload serait plus fluide.

**P2-11 : Pas de lien pour voir un visuel termine individuellement.** Thomas voit l'image floue pendant la generation, puis nette quand c'est termine, mais il ne peut pas cliquer dessus pour l'agrandir. Sur mobile, les vignettes sont petites (aspect 4/3 dans une grille 2 colonnes). Pas de lightbox.

### Note detaillee

| Critere | Note | Commentaire |
|---|---|---|
| Comprehension immediate (x2) | 8/10 | Barre de progression limpide |
| Vocabulaire metier | 7/10 | "Passe 1", "Passe 2" sont du jargon pipeline |
| Flux sans friction (x2) | 9/10 | Automatique, polling, pas de dead-end |
| Feedback visuel | 10/10 | Barre, timer, statut par piece, badge done/error |
| Mobile-first | 8/10 | Grille responsive, touch targets OK |
| Valeur percue | 9/10 | Thomas voit ses visuels apparaitre en temps reel |
| Temps percu | 9/10 | Timer + estimation + progression = maitrise du temps |
| Confiance | 8/10 | Pas de crash, erreurs par piece identifiees |
| Partage acquereurs | N/A | |
| ROI evident | 9/10 | Generation automatique = economie evidente vs prestataire |

---

## Page 7 -- /projet/[id]/dossier (7.2/10)

### Ce que Thomas comprend

C'est la page finale. Thomas voit ses visuels avant/apres par piece, groupes par lot. Il peut generer une description commerciale par IA, la modifier, generer le PDF, et partager (lien, WhatsApp, email). La barre d'actions est bien regroupee.

### Frictions identifiees

**P0-06 : Le PDF n'est pas genere automatiquement.** Thomas doit cliquer "Generer le PDF", attendre, puis "Telecharger PDF". Sur un parcours qui coute 99 euros, le PDF devrait etre pre-genere ou au minimum lance automatiquement quand la page charge. L'attente supplementaire est une friction sur la promesse "dossier pret en 10 minutes".

**P0-07 : Le partage WhatsApp utilise wa.me (text-only).** La fonction `handleShareWhatsApp` (ligne 287) envoie un lien texte. Sur mobile, Thomas s'attend a partager avec une preview (titre + image + lien). Le lien /dossier/[id] n'est pas garanti d'avoir des OpenGraph tags (pas de metadata page verifiee). L'acquereur recoit juste un lien brut dans WhatsApp sans preview -- pas pro.

**P0-08 : Le lien partage utilise /dossier/${projectId} mais la page publique attend /dossier/[uuid].** La page publique /dossier/[uuid]/page.tsx EXISTE avec metadata OG dynamiques (SSR, pas d'auth). Cependant, le lien est construit avec le projectId du parcours marchand. Si le projectId n'est pas le meme UUID que le dossier existant (ancien systeme), le lien sera une 404. A verifier que l'API cree un dossier avec le bon identifiant. L'ancien systeme dossier utilise un UUID genere separement du project ID. Incoherence potentielle.

**P1-13 : Les visuels avant/apres sont dans une grille 2 colonnes cote a cote.** Sur mobile (375px), chaque image fait ~160px de large en aspect 4/3 soit ~120px de haut. C'est minuscule. Thomas ne peut pas verifier la qualite des visuels. Pas de lightbox, pas de zoom.

**P1-14 : La description commerciale generee par IA n'est pas pre-generee.** Thomas doit cliquer "Generer par IA" manuellement pour chaque lot. Ca devrait etre genere automatiquement en arriere-plan pendant la generation des visuels ou au chargement de la page dossier.

**P2-12 : Le bouton "Voir tous mes biens" est le CTA principal.** C'est etrange en fin de parcours. Thomas vient de generer son dossier, le CTA devrait etre "Partager le dossier" ou "Telecharger le PDF", pas "Voir tous mes biens". Le partage est dans la barre d'actions en haut, pas en CTA final.

### Note detaillee

| Critere | Note | Commentaire |
|---|---|---|
| Comprehension immediate (x2) | 8/10 | Titre clair, visuels avant/apres |
| Vocabulaire metier | 8/10 | "Dossier de pre-commercialisation", "description commerciale" |
| Flux sans friction (x2) | 5/10 | PDF non auto, description non auto, page publique absente |
| Feedback visuel | 8/10 | Toast partage, spinner PDF, badge style/cible |
| Mobile-first | 6/10 | Visuels trop petits, barre d'actions overflow horizontal probable |
| Valeur percue | 8/10 | Avant/apres, description IA, PDF brande |
| Temps percu | 6/10 | Encore des clics manuels apres un parcours de 10+ minutes |
| Confiance | 7/10 | Correct si le PDF et le lien fonctionnent |
| Partage acquereurs | 5/10 | WhatsApp text-only, pas de preview OG, page publique non verifiee |
| ROI evident | 8/10 | Le dossier final est le livrable promis |

---

## Composants -- ProStepper (8.5/10)

### Points positifs

- 7 etapes bien definies avec labels + sous-labels
- 4 etats visuels (completed, active, locked, error) avec des couleurs distinctes
- Desktop horizontal, mobile vertical -- bon choix responsive
- aria-label, aria-current -- accessibilite correcte
- Connecteurs colores entre les etapes (sage si done, gris si pending)

### Frictions identifiees

**P1-15 : Le stepper vertical sur mobile prend enormement de place.** 7 etapes x (32px dot + 24px connector + labels) = environ 400px de hauteur. C'est un tiers de l'ecran de l'iPhone de Thomas. A l'etape 7, Thomas voit 6 etapes precedentes avant d'arriver au contenu utile. Sur mobile, un stepper horizontal scrollable ou un mini-stepper (dot uniquement, pas de label) serait plus compact.

**P2-13 : Les sous-labels sont generiques.** "Upload", "IA", "Pieces", "Cible", "Architecte", "Generation", "PDF" -- certains sont des noms d'agent (IA, Architecte) pas des actions. Thomas prefererait des verbes : "Deposer", "Analyser", "Verifier", "Qualifier", "Recommander", "Generer", "Partager".

---

## Composants -- RecommendationCard (9.0/10)

### Points positifs

- Icone par type de recommandation -- Thomas identifie visuellement
- Badge "Appliquee" / "Ignoree" avec couleur coherente (vert/rouge)
- Cout estime et niveau d'impact affiches
- Boutons "Appliquer au dossier" / "Ignorer" avec hierarchie visuelle claire
- Boutons caches apres decision -- pas de confusion
- Transition d'etat visuelle (bordure + fond changent)

### Frictions identifiees

**P2-14 : Le bouton "Appliquer au dossier" est ambigu.** Thomas ne sait pas concretement ce que "appliquer" signifie. Est-ce que ca modifie le plan ? Est-ce que ca change le style ? Est-ce que ca ajoute une piece ? "Accepter cette recommandation" serait plus clair.

---

## Composants -- RoomCard (8.5/10)

### Points positifs

- 6 etats de statut avec badges colores et dots pulses
- Photo thumbnail responsive (80px mobile, 120px desktop)
- Labels FR pour les types de pieces
- Bouton "Ajouter photo" discret mais present quand pas de photo
- hover:shadow pour le feedback interaction

### Frictions identifiees

**P2-15 : L'icone placeholder (plan) n'est pas explicite.** Quand il n'y a pas de photo, Thomas voit une icone de grille avec "Plan" en dessous. Il penserait que c'est un plan, pas un placeholder pour photo. "Ajouter photo" en gros serait plus clair.

---

## Synthese des corrections prioritaires

### P0 -- Bloquants (a corriger avant lancement)

| # | Page | Description | Impact |
|---|---|---|---|
| P0-01 | /projet/nouveau | Prix 99 euros/bien contradictoire avec landing 29 euros/mois | Thomas ferme la page |
| P0-02 | /projet/nouveau | Pas de detection abonnement Pro pour inclure le bien | Pro paie 2 fois |
| P0-03 | /projet/[id]/validation | Auto-save ne sauvegarde rien (fake save) | Perte de donnees |
| P0-04 | /projet/[id]/validation | Saute les etapes 4 et 5 (qualification + recommandations) | 2/7 etapes du parcours inaccessibles |
| P0-05 | /projet/[id]/qualification | "Lot" inadapte pour un bien simple | Thomas ne comprend pas |
| P0-06 | /projet/[id]/dossier | PDF non genere automatiquement | Friction finale |
| P0-07 | /projet/[id]/dossier | WhatsApp text-only, pas de preview OG | Partage non professionnel |
| P0-08 | /projet/[id]/dossier | Lien partage /dossier/${projectId} vs page publique /dossier/[uuid] -- incoherence ID | Acquereur voit une 404 |

### P1 -- Frictions fortes

| # | Page | Description |
|---|---|---|
| P1-01 | /marchand | CTA "Creer mon dossier Pro" pointe vers /#outil au lieu de /projet/nouveau |
| P1-02 | /projet/nouveau | Plan obligatoire -- Thomas n'a pas toujours un plan |
| P1-03 | /projet/nouveau | Pas de guidance sur le type de plan attendu |
| P1-04 | /projet/[id]/extraction | "Extraction" est du jargon technique |
| P1-05 | /projet/[id]/extraction | RoomCards affichent "pending" au lieu de "validated" |
| P1-06 | /projet/[id]/validation | Photos associees non uploadees au serveur |
| P1-07 | /projet/[id]/validation | Bouton supprimer photo = 20px, sous le seuil 44px touch |
| P1-08 | /projet/[id]/qualification | Budget sans unite explicite dans le placeholder |
| P1-09 | /projet/[id]/qualification | Contraintes en textarea libre au lieu de cases a cocher |
| P1-10 | /projet/[id]/recommandations | Decisions fire-and-forget sans feedback |
| P1-11 | /projet/[id]/recommandations | Pas de warning si recommandations non decidees |
| P1-12 | /projet/[id]/generation | "Passe 1", "Passe 2" sont du jargon pipeline |
| P1-13 | /projet/[id]/dossier | Visuels avant/apres trop petits sur mobile |
| P1-14 | /projet/[id]/dossier | Description commerciale non pre-generee |
| P1-15 | ProStepper | Stepper vertical prend 400px sur mobile |

### P2 -- Ameliorations

| # | Page | Description |
|---|---|---|
| P2-01 | /marchand | CTA Decouverte gratuit pointe vers /#outil |
| P2-02 | /marchand | "Comment ca marche" = 3 etapes generiques, pas le vrai parcours 7 etapes |
| P2-03 | /projet/nouveau | Pas de sauvegarde brouillon |
| P2-04 | /projet/[id]/extraction | Pas de question de confirmation sur le nombre de pieces |
| P2-05 | /projet/[id]/extraction | Bouton Retour peut etre tappe accidentellement sur mobile |
| P2-06 | /projet/[id]/validation | Pas de drag-and-drop pour reordonner les pieces |
| P2-07 | /projet/[id]/qualification | Vignettes photos trop petites sur mobile |
| P2-08 | /projet/[id]/qualification | Bouton Retour en dernier sur mobile |
| P2-09 | /projet/[id]/recommandations | Pas de "Tout accepter" bulk |
| P2-10 | /projet/[id]/generation | Retry par window.location.reload() |
| P2-11 | /projet/[id]/generation | Pas de lightbox pour voir un visuel en grand |
| P2-12 | /projet/[id]/dossier | CTA final = "Voir mes biens" au lieu de "Partager" |
| P2-13 | ProStepper | Sous-labels generiques (noms d'agents au lieu de verbes) |
| P2-14 | RecommendationCard | "Appliquer au dossier" est ambigu |
| P2-15 | RoomCard | Icone placeholder pas explicite |

---

## Grille finale consolidee

| # | Critere | Note | Commentaire |
|---|---|---|---|
| 1 | Comprehension immediate (x2) | 8.0/10 | Titres clairs mais jargon technique persistant (extraction, passe, lot) |
| 2 | Vocabulaire metier | 7.8/10 | Correct sur le fond mais "extraction", "passe 1/2", "lot" sont des mots techniques |
| 3 | Flux sans friction (x2) | 6.5/10 | Auto-save fake, etapes sautees, PDF non auto, photos non persistees |
| 4 | Feedback visuel | 8.5/10 | Excellent sur generation/extraction, trompeur sur validation (fake save) |
| 5 | Mobile-first | 7.5/10 | Stepper vertical trop long, visuels trop petits, touch targets a verifier |
| 6 | Valeur percue | 8.0/10 | Forte sur la landing et la generation, faible sur le pricing contradictoire |
| 7 | Temps percu | 8.0/10 | Bon sur chaque etape mais 7 etapes = perception de longueur |
| 8 | Confiance | 7.0/10 | Dissonance prix landing/projet, auto-save mensongere |
| 9 | Partage acquereurs | 5.5/10 | WhatsApp text-only, pas de preview OG, page publique non verifiee |
| 10 | ROI evident | 7.5/10 | Excellent sur landing, mais 99 euros/bien contredit le 29 euros/mois |

**Note finale ponderee : 7.4/10**

(Calcul : (8.0x2 + 7.8 + 6.5x2 + 8.5 + 7.5 + 8.0 + 8.0 + 7.0 + 5.5 + 7.5) / 12 = 7.4)

**Verdict : en dessous du seuil 9.5/10. Le parcours 7 etapes est structurellement solide mais les P0 (prix contradictoire, auto-save fake, etapes sautees, partage casse) doivent etre corriges avant toute mise en production.** Les P1 (jargon technique, photos non persistees, stepper trop long) degradent l'experience au quotidien. Apres correction des 8 P0 et des 15 P1, le parcours peut atteindre 9.0+.

---

## Handoff

**Destinataire** : @fullstack
**Priorite** : Corriger les 8 P0 dans l'ordre suivant :
1. P0-03 (auto-save fake) + P0-04 (etapes sautees) -- le parcours doit fonctionner de bout en bout
2. P0-01 + P0-02 (prix/abonnement) -- coherence landing-to-checkout
3. P0-06 (PDF auto) + P0-07 (WhatsApp preview) + P0-08 (page publique) -- le partage est la valeur finale
4. P0-05 (terminologie "lot") -- renommer en "Votre bien" pour les projets mono-lot

**Demander a @qa** : tester le parcours complet end-to-end apres corrections P0 (nouveau bien > extraction > validation > qualification > recommandations > generation > dossier > partage WhatsApp > lien public).
