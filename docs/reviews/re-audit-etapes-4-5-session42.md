# Re-audit Thomas Berger -- Etapes 4 et 5 apres corrections session 42

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux
> Methode : lecture du code source + simulation mentale du parcours iPhone 15 Pro + laptop Windows
> Date : 2026-04-10
> Seuil : 9.5/10 minimum (preference fondateur)
> Ref. audit precedent : `docs/reviews/audit-thomas-ux-complet-session41.md` (etape 4 = 7.5, etape 5 = 6.5)

---

## Corrections session 42 verifiees

| Correction annoncee | Verifie dans le code | Statut |
|---|---|---|
| ROOM_TYPE_LABELS importe depuis lib/constants | `import { roomTypeLabel, getCompletedSteps } from "@/lib/constants"` dans qualification/page.tsx l.19 | OK |
| completedSteps dynamiques via getCompletedSteps(projectStatus) | `getCompletedSteps(projectStatus)` passe a ProStepper dans les 2 pages | OK |
| Redirect 1500ms au lieu de 800ms apres qualification | `setTimeout(() => { router.push(...) }, 1500)` dans qualification/page.tsx l.263 | OK |
| Garde bouton generation (disabled si decisions en attente) | `disabled={hasPendingDecisions}` sur le bouton "Lancer la generation" + message d'avertissement | OK |
| Cout total des recommandations acceptees affiche | `acceptedCostTotal` calcule et affiche dans la barre sticky en bas | OK |
| rationale_buyer affiche dans les cartes | `rationale_buyer` rendu dans RecommendationCard.tsx l.154-176 avec icone et "Argument de vente" | OK |
| Optimistic UI + revert on failure sur les decisions | handleAccept/handleReject sauvegardent `previousDecision`, appliquent immediatement, revertent en cas d'erreur | OK |

Toutes les 7 corrections sont bien implementees dans le code.

---

## Etape 4 -- Qualification des besoins

### Note : 8.8 / 10

### Tableau 10 criteres

| # | Critere | Note /10 | Observations |
|---|---------|----------|-------------|
| 1 | Retrouvabilite | 9/10 | Le stepper est present, cliquable sur les etapes completees/actives, avec getCompletedSteps dynamique. Thomas retrouve son projet via le stepper. Pas de page "Mes projets" mais ca sort du scope de cette etape. |
| 2 | Prix/valeur | 8/10 | Le budget travaux est saisi en euros avec suffixe visible. Mais pas de prix affiche pour le service Versimo lui-meme sur cette page -- c'est acceptable car le paiement a eu lieu a l'etape 1. |
| 3 | Qualite pro | 9/10 | Design propre, cartes de lots avec photos en grille, labels francais corrects via roomTypeLabel(). Cibles acheteur pertinentes (Famille, Investisseur locatif, Senior...). 12 styles disponibles. |
| 4 | Partage acquereurs | N/A | Cette etape n'a pas de partage -- c'est un formulaire interne. |
| 5 | Gestion d'erreur | 9/10 | Messages d'erreur clairs et non techniques : "Impossible de charger les donnees", "Erreur de connexion. Verifiez votre reseau.", liste des champs manquants par lot. Role="alert" present. |
| 6 | Simplicite | 9/10 | 4 champs par lot (2 obligatoires, 2 optionnels), marquage visuel des champs requis avec asterisque rouge, placeholders explicites ("Ex: 25000", "PMR, garder la cheminee..."). Thomas comprend en 5 secondes. |
| 7 | Confiance | 8.5/10 | Header Versimo, footer, design coherent. Le stepper donne un sentiment de progression maitrisee. |
| 8 | Completude | 8.5/10 | Les photos des pieces sont affichees en grille dans chaque lot, avec nom, type et surface. Il manque un recapitulatif total (surface totale, nombre de pieces total en haut de page). |
| 9 | Mobile-first | 8/10 | Selects et inputs en w-full, py-2.5 = hauteur tactile correcte. Grille pieces grid-cols-2 sur mobile. MAIS : le bouton "Valider" a py-3 (~48px) OK, le bouton "Retour" aussi. Le stepper mobile est vertical compact avec min-w/min-h 44px -- conforme Apple. |
| 10 | Rapidite | 9/10 | Formulaire simple, pas d'appel IA a cette etape. Le chargement initial fait 2 fetch (status + lots) en parallele. Redirect a 1500ms apres validation -- correcte pour confirmer visuellement. |

### Points positifs

1. **getCompletedSteps dynamique** -- le stepper reflette l'etat reel du projet (ex: si Thomas revient apres avoir deja qualifie, l'etape 4 est "completed" et non "active"). C'est le fix le plus impactant.
2. **roomTypeLabel depuis lib/constants** -- plus de dictionnaire local, plus de risque de desynchronisation. "bedroom_children" s'affiche bien "Chambre enfant".
3. **Redirect 1500ms** -- Thomas a le temps de lire "Qualification enregistree" avant la redirection. A 800ms c'etait invisible.
4. **Formulaire par lot** -- structure claire, Thomas voit chaque lot separe avec ses pieces.
5. **Les 12 styles sont proposes** -- coherent avec le pipeline de generation Versimo.
6. **Le bouton "Retour"** pointe vers `/projet/[id]/validation` -- navigation logique.

### Problemes restants

#### P1-A -- Pas de recapitulatif projet en haut de page (nouveau)

La page montre les lots mais ne recapitule pas le projet en haut (adresse, surface totale, nombre de lots/pieces). Thomas doit se souvenir du bien qu'il est en train de qualifier. Sur 8-12 operations par an, avec parfois 2 projets en cours le meme jour, un rappel contextuel est indispensable.

**Fichier** : `app/projet/[id]/qualification/page.tsx` -- ajouter un bandeau sous le titre avec nom du projet, adresse, surface totale.

**Impact** : mineur mais recurrent -- Thomas fait une pause cafe, revient, ne sait plus quel bien il qualifie.

#### P1-B -- Le stepper desktop occupe beaucoup de largeur pour 7 etapes (existant, cosmetique)

7 etapes avec labels + sublabels sur un max-w-3xl (768px) -- les connecteurs sont courts. Ca fonctionne mais c'est serre. Sur un ecran 13 pouces Windows, les sublabels "Detection des pieces" se compressent.

**Impact** : cosmetique, pas bloquant.

#### P2-A -- Pas de sauvegarde intermediaire (existant, non corrige)

Si Thomas remplit 4 lots et ferme l'onglet sans cliquer "Valider", tout est perdu. Pas de auto-save, pas de beforeunload. C'est le P1-3/P1-4 de l'audit precedent, non adresse dans cette session. Acceptable car le formulaire est court (2 champs obligatoires par lot), mais reste un risque.

#### P2-B -- Le stepper mobile vertical ne montre pas les sublabels

Les sublabels ("Cible", "Architecte", "PDF") sont masques sur mobile. Thomas voit "Qualification" mais pas "Cible". Mineur car le titre de page compense.

---

## Etape 5 -- Recommandations architecte IA

### Note : 9.0 / 10

### Tableau 10 criteres

| # | Critere | Note /10 | Observations |
|---|---------|----------|-------------|
| 1 | Retrouvabilite | 9/10 | Stepper dynamique, bouton "Retour a la qualification". Les recommandations existantes sont chargees au mount (pas regenerees) grace au check `has_recommendations`. Thomas revient 3 semaines plus tard, ses decisions sont la. |
| 2 | Prix/valeur | 9.5/10 | **Le cout total des recommandations acceptees est affiche** dans la barre sticky. "Budget travaux estime : 12 500 EUR". Thomas voit immediatement combien ca va lui couter. Excellent. |
| 3 | Qualite pro | 9/10 | Cartes avec icone par type (redistribution, fusion, conversion, ajout, optimisation), badge "Appliquee"/"Ignoree", description, cout, impact, argument de vente. Design plaquette-ready. |
| 4 | Partage acquereurs | N/A | Pas de partage a cette etape -- c'est un outil de decision interne. |
| 5 | Gestion d'erreur | 9.5/10 | **Optimistic UI + revert on failure** -- Thomas clique "Appliquer", la carte passe au vert immediatement. Si le serveur repond erreur, la carte revient a "En attente" avec message "Erreur de sauvegarde. Verifiez votre connexion et reessayez." C'est exactement le pattern que j'attends. |
| 6 | Simplicite | 9/10 | 2 boutons par carte : "Appliquer au dossier" (vert sage) et "Ignorer" (rouge leger). Les decisions sont binaires, pas de slider ni de champ supplementaire. Thomas decide en 2 taps par reco. |
| 7 | Confiance | 9/10 | La section "Argument de vente" (rationale_buyer) en vert avec icone utilisateur -- Thomas voit immediatement la valeur pour son acquereur. "Ce reamenagement cree un espace salon plus genereux, argument fort pour les familles." |
| 8 | Completude | 8.5/10 | Cout estime, impact, type, description, argument de vente -- complet. Il manque une liste des pieces affectees de facon visible (affected_rooms est dans l'API mais pas exploite dans la carte). |
| 9 | Mobile-first | 8.5/10 | Boutons flex-1 py-2 px-3 -- hauteur un peu juste (~36-38px). Devrait etre py-2.5 ou py-3 pour atteindre 44px minimum Apple. Le reste est OK : texte lisible, barre sticky en bas, pas de scroll horizontal. |
| 10 | Rapidite | 9/10 | Les recommandations existantes sont chargees depuis la DB sans appel IA. La generation initiale se fait en parallele par lot (Promise.allSettled). Le bouton "Regenerer" est disponible si Thomas veut de nouvelles recommandations. |

### Points positifs

1. **Optimistic UI + revert on failure** -- le fix le plus important de cette session. L'ancien fire-and-forget etait un bug silencieux grave. Maintenant, Thomas a un retour visuel immediat ET une securite si le reseau coupe. La sauvegarde de `previousDecision` avant mutation est propre.

2. **Budget travaux total** -- la barre sticky avec "Budget travaux estime : X EUR" est exactement ce que Thomas cherche. Il peut faire son calcul de rentabilite operation en temps reel pendant qu'il accepte ou refuse les recos.

3. **Argument de vente (rationale_buyer)** -- game changer pour un marchand. Thomas ne decide pas seulement "est-ce que cette reco est bonne", il decide "est-ce que ca va convaincre mon acquereur famille avec 2 enfants". L'icone utilisateur + texte vert sage differentie clairement cette info de la description technique.

4. **Garde bouton generation** -- `disabled={hasPendingDecisions}` + message d'avertissement en orange "Veuillez accepter ou ignorer chaque recommandation avant de continuer." Thomas ne peut pas lancer la generation sans avoir decide de toutes les recos. C'est protecteur sans etre bloquant (il peut "Ignorer" rapidement).

5. **Bouton "Regenerer les recommandations"** -- avec `forceRegenerate = true` et spinner. Si Thomas change la cible acheteur en etape 4 et revient, il peut obtenir de nouvelles recos.

6. **Persistance des decisions** -- `has_recommendations` + `is_accepted` charges depuis la DB. Thomas quitte, revient 3 semaines plus tard : tout est en place. C'etait le risque n1 du fire-and-forget.

### Problemes restants

#### P1-C -- Boutons Accept/Reject trop petits sur mobile (persistant)

`py-2 px-3` sur les boutons "Appliquer au dossier" / "Ignorer" dans RecommendationCard.tsx l.221-238. Hauteur estimee ~36px, en dessous des 44px minimum Apple. Sur iPhone 15 Pro, Thomas risque de taper entre les 2 boutons.

**Fix** : `py-2.5 px-3 min-h-[44px]`

**Fichier** : `components/marchand/RecommendationCard.tsx` l.223, l.233

**Impact** : UX mobile -- precision tactile insuffisante.

#### P1-D -- La barre sticky couvre le dernier bouton sur mobile

La barre sticky `bottom-0` avec le compteur et le budget travaux se superpose au dernier bouton d'action (le "Retour a la qualification") quand Thomas scrolle tout en bas. Il n'y a pas de `pb-20` ou `mb-16` pour compenser l'espace occupe par la barre sticky.

**Fichier** : `app/projet/[id]/recommandations/page.tsx` -- ajouter un padding bottom sur le conteneur de boutons d'action pour compenser la barre sticky.

**Impact** : Thomas ne peut pas taper sur "Retour a la qualification" sans fermer mentalement la barre sticky. Frustrant sur mobile.

#### P2-C -- L'erreur par lot ne permet pas de retry par lot

Si la generation de recommandations echoue pour un seul lot (sur 3), l'erreur est affichee pour ce lot mais il n'y a pas de bouton "Reessayer" specifique a ce lot. Thomas doit cliquer "Regenerer les recommandations" qui relance TOUT, y compris les lots qui avaient deja reussi.

**Fichier** : `app/projet/[id]/recommandations/page.tsx` -- ajouter un bouton "Reessayer" dans le bloc `lotRec.error` (l.547-554).

**Impact** : gaspillage de temps et credits IA si 1 lot echoue sur 3.

#### P2-D -- Pas de nombre de pieces affectees visible dans la carte

L'API renvoie `affected_rooms` (tableau de noms de pieces) mais ce champ n'est pas affiche dans RecommendationCard. Thomas voit "Redistribution -- Salon" mais pas "affecte aussi : Cuisine, Entree". Ce serait utile pour comprendre l'envergure d'une recommandation.

**Fichier** : `components/marchand/RecommendationCard.tsx` -- ajouter `affected_rooms` sous la description.

**Impact** : comprehension incomplete de l'impact. Mineur car la description textuelle compense souvent.

#### P2-E -- Le message d'erreur save n'a pas de bouton dismiss

`saveError` est affiche en banniere rouge mais ne peut pas etre ferme manuellement. Il disparait au prochain clic Accept/Reject (grace a `setSaveError(null)`), mais si Thomas ne clique pas, le message reste indefiniment.

**Fichier** : `app/projet/[id]/recommandations/page.tsx` l.492-500 -- ajouter un bouton X pour dismiss.

**Impact** : mineur, le message disparait au prochain clic.

---

## API qualify (route.ts)

### Points positifs

1. **Validation Zod solide** -- QualifyBodySchema avec TargetBuyerEnum, UUID check sur lot_id. Messages d'erreur en francais.
2. **Status check** -- `validStatuses = ["validated", "qualified"]` permet de requalifier un lot deja qualifie. Flexible.
3. **Ownership verification** -- `requireProjectOwnership` + verification lot appartient au projet. Securise.
4. **ensureProTables** -- creation automatique des tables si absentes. Resilient.

### Points negatifs

Rien de bloquant. L'API est propre et bien securisee.

---

## API recommendations/[recId] (route.ts)

### Points positifs

1. **Double verification** -- ownership du projet + recommendation liee a un lot de ce projet (JOIN pro_lots).
2. **Schema simple et strict** -- `is_accepted: z.boolean()`.
3. **Messages non techniques** -- "Recommandation introuvable dans ce projet."

### Points negatifs

Rien de bloquant.

---

## Verdict global

| Etape | Note precedente | Note actuelle | Delta | Verdict |
|---|---|---|---|---|
| 4. Qualification | 7.5 | **8.8** | +1.3 | FAIL (< 9.5) |
| 5. Recommandations | 6.5 | **9.0** | +2.5 | FAIL (< 9.5) |

### Progression

L'etape 5 a fait le plus grand bond (+2.5 points). Les 3 corrections les plus impactantes :
1. **Optimistic UI + revert** : transforme un bug silencieux grave en UX robuste
2. **Budget travaux total** : donne a Thomas l'info financiere qu'il cherche
3. **Argument de vente** : ancre la decision dans le contexte commercial du marchand

L'etape 4 progresse aussi (+1.3) grace au stepper dynamique et aux labels centralises, mais reste en dessous du seuil car il lui manque le recapitulatif projet et la sauvegarde intermediaire.

### Pour atteindre 9.5/10

**Etape 4 (8.8 -> 9.5) -- 3 corrections necessaires :**
- P1-A : ajouter un recapitulatif projet en haut de page (nom, adresse, surface)
- P2-A : ajouter auto-save ou au moins beforeunload
- P2-B : cosmetique stepper mobile (sublabels ou tooltip)

**Etape 5 (9.0 -> 9.5) -- 3 corrections necessaires :**
- P1-C : boutons Accept/Reject a min-h-[44px] pour mobile
- P1-D : padding bottom pour compenser la barre sticky
- P2-C : retry par lot individuel en cas d'echec

---

*Thomas Berger, marchand de biens -- Bordeaux, 2026-04-10*
