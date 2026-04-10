# Audit UX Etape 4 -- Qualification des lots (Session 41)

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux, iPhone 15 Pro + laptop Windows.
> Methode : lecture exhaustive du code source de page.tsx + routes API qualify + lots, simulation mentale etape par etape.
> Date : 2026-04-10
> Seuil : 9.5/10 minimum (preference fondateur)

---

## Note globale : 7.4 / 10

## Verdict en une phrase

"Le formulaire est clair, bien structure, les champs obligatoires sont marques, le spinner de sauvegarde fonctionne. Mais le dictionnaire de types de pieces est local et desynchronise du reste de l'app, le stepper marque toujours les etapes 1-3 comme cochees en dur, et la redirection post-save a 800ms est trop rapide pour confirmer visuellement."

---

## Evaluation par critere (11 points demandes)

| # | Critere | Note /10 | Observation |
|---|---------|----------|-------------|
| 1 | Chargement (lots + pieces) | 7.5 | Double fetch (status + lots) puis merge cote client. Ca marche mais c'est fragile : si /status retourne des rooms avec lot_id=null et qu'il y a plusieurs lots, ces pieces sont perdues (seul le cas 1 lot gere les unassigned). Spinner de chargement present. |
| 2 | Formulaire par lot | 9.0 | Chaque lot a son propre bloc avec header (nom + etage + nombre de pieces) et ses 4 champs. Bien structure, Map<lotId, LotFormData> bien gere. |
| 3 | Cible acheteur | 9.0 | 6 options : famille, couple sans enfant, investisseur locatif, etudiant, senior, professionnel liberal. Les 6 valeurs correspondent exactement au schema Zod TargetBuyerEnum. Coherent. |
| 4 | Styles | 9.0 | Les 12 styles sont presents + placeholder "Choisir un style". Correspond au catalogue Versimo. |
| 5 | Budget | 8.5 | Champ number, step 1000, symbole euro en suffixe, marque optionnel. Placeholder "Ex: 25000". Manque un formatage visuel (separateur de milliers) pour les gros montants. |
| 6 | Contraintes | 9.0 | Textarea 2 lignes, marque optionnel, placeholder utile "Ex: PMR, garder la cheminee, pas de travaux lourds...". Clair. |
| 7 | Recap pieces | 7.0 | Les pieces du lot sont affichees en grille 2 colonnes (mobile) / 3 colonnes (desktop) avec photo, nom, type, surface. MAIS le dictionnaire ROOM_TYPE_LABELS est local a la page et ne contient que 9 types (salon, cuisine, chambre, sdb, wc, bureau, couloir, cave, autre) alors que le dictionnaire de lib/constants.ts contient 17 types (living_room, bedroom_adults, bedroom_children, kitchen, bathroom, dining_room, hallway, entryway, terrace, balcony, garden, laundry, cellar, other, office, wc). Si l'extraction IA retourne "living_room", la page affiche "living_room" en brut au lieu de "Salon". |
| 8 | Validation | 8.0 | Les champs obligatoires (cible + style) sont marques avec asterisque rouge. La validation cote client liste les lots en erreur par nom ("Lot 1 : cible acheteur manquante"). L'API valide aussi via Zod. Mais le message d'erreur utilise un whitespace-pre-line qui affiche les retours a la ligne du join("\n") -- fonctionnel mais le rendu est un peu brut. |
| 9 | Spinner de sauvegarde | 9.0 | Le bouton affiche un spinner SVG anime + "Enregistrement..." pendant la sauvegarde, puis "Qualification enregistree" une fois terminee. Le bouton est disable pendant la sauvegarde et apres le succes. Correct. |
| 10 | Stepper | 6.0 | ProStepper est present avec currentStep=4 et completedSteps=[1,2,3] -- MAIS ces valeurs sont hardcodees. Si Thomas arrive a l'etape 4 apres avoir saute l'extraction (cas extraction_failed), les etapes 1-3 sont quand meme cochees en vert. Le stepper devrait lire le statut reel du projet (quel etape est vraiment completee). Les etapes completees + active sont cliquables pour naviguer, les verrouillees non. |
| 11 | Multi-lots | 8.5 | Le code itere sur tous les lots avec lots.map() et chaque lot a son propre bloc formulaire. Pour un immeuble 3 lots, on verra 3 sections distinctes avec leur nom, etage, et formulaire. Le label s'adapte : "votre bien" si 1 lot, "chaque lot" si plusieurs. "Pieces du bien" vs "Pieces du lot" selon le cas. |

---

## Points positifs

1. **Structure du formulaire** -- Un bloc par lot avec header clair (nom, etage, nombre de pieces), 4 champs bien organises. Thomas comprend immediatement ce qu'il doit remplir.

2. **Validation client + serveur** -- Les champs obligatoires sont clairement marques (asterisque rouge), le message d'erreur est en francais et liste les lots fautifs par nom. L'API revalide avec Zod. Double securite.

3. **Spinner de sauvegarde** -- Le bouton change d'etat (spinner + "Enregistrement..." puis "Qualification enregistree"). Thomas sait que ca a marche. Le bouton est desactive pendant la sauvegarde pour eviter le double-clic.

4. **Feedback succes** -- Bandeau vert "Qualification enregistree. Redirection vers les recommandations..." avant la redirection. Thomas sait que tout est OK.

5. **Adaptation multi-lots** -- Le label s'adapte intelligemment ("votre bien" vs "chaque lot", "Pieces du bien" vs "Pieces du lot"). Un marchand qui fait un immeuble de rapport voit chaque lot separement.

6. **Gestion d'erreur reseau** -- Le catch generique affiche "Erreur de connexion. Verifiez votre reseau." au lieu d'un message technique. Thomas comprend.

7. **Recap pieces avec photos** -- Chaque piece du lot est affichee avec sa photo, son nom, son type traduit, et sa surface. Thomas peut verifier que la bonne piece est dans le bon lot.

8. **Options cible acheteur pertinentes** -- Les 6 profils (famille, couple, investisseur, etudiant, senior, liberal) couvrent les cas reels d'un marchand de biens. Pas de jargon technique.

---

## Problemes et recommandations

### P0 -- Critique (bloquent l'usage)

#### P0-1 -- ROOM_TYPE_LABELS desynchronise entre la page et lib/constants.ts

**Fichier** : `app/projet/[id]/qualification/page.tsx` l.76-86

La page definit son propre dictionnaire ROOM_TYPE_LABELS avec 9 types ("salon", "cuisine", "chambre", etc.) alors que `lib/constants.ts` definit un dictionnaire avec 17 types ("living_room", "bedroom_adults", "kitchen", etc.).

Le probleme : l'extraction IA peut retourner des room_type au format anglais ("living_room", "bedroom_children") ou au format francais ("salon", "chambre"). Si le type est "living_room", le dictionnaire local ne le trouve pas et affiche le code brut "living_room" au lieu de "Salon".

Ce probleme a deja ete identifie et corrige pour la page annonce (lesson-learned session 28, P1 : "room_type affiche en anglais brut"). La meme erreur est reproduite ici.

**Fix** : importer `ROOM_TYPE_LABELS` et `roomTypeLabel()` depuis `lib/constants.ts` au lieu de le redefinir localement.

```typescript
// Supprimer le ROOM_TYPE_LABELS local (l.76-86)
// Ajouter l'import :
import { roomTypeLabel } from "@/lib/constants";

// Remplacer l.523 :
// {ROOM_TYPE_LABELS[room.room_type] || room.room_type}
// Par :
// {roomTypeLabel(room.room_type)}
```

---

### P1 -- Haute (degradent l'experience)

#### P1-1 -- Stepper completedSteps hardcode a [1,2,3]

**Fichier** : `app/projet/[id]/qualification/page.tsx` l.284-285

```typescript
<ProStepper
  currentStep={4}
  completedSteps={[1, 2, 3]}
  projectId={projectId}
/>
```

Les etapes 1-3 sont toujours marquees comme completees, quel que soit le statut reel du projet. Si Thomas est arrive a la qualification en sautant l'extraction (saisie manuelle des pieces), l'etape 2 "Analyse" est affichee en vert avec un check alors qu'elle a ete sautee. C'est trompeur.

**Fix** : Calculer les completedSteps a partir du statut du projet retourne par l'API /status (project.status).

```typescript
// Deriver les completedSteps du project.status
function getCompletedSteps(status: string): number[] {
  switch (status) {
    case "plan_uploaded": return [1];
    case "extraction_done": return [1, 2];
    case "validated": return [1, 2, 3];
    case "qualified": return [1, 2, 3, 4];
    // ...etc
    default: return [1];
  }
}
```

#### P1-2 -- Redirection 800ms trop rapide

**Fichier** : `app/projet/[id]/qualification/page.tsx` l.264

```typescript
setTimeout(() => {
  router.push(`/projet/${projectId}/recommandations`);
}, 800);
```

800ms pour lire "Qualification enregistree. Redirection vers les recommandations..." c'est trop court. Thomas n'a pas le temps de confirmer visuellement que tout est OK. Le bandeau vert apparait et disparait avant qu'il ait fini de le lire.

L'audit precedent (session 41, note 7.5/10 sur cette etape) mentionnait deja ce probleme : "le feedback disparait en 800ms avant redirect -- trop rapide pour confirmer visuellement".

**Fix** : Augmenter le delai a 1500-2000ms, ou mieux, laisser le bandeau et ajouter un bouton "Continuer vers les recommandations" pour que Thomas clique quand il est pret.

#### P1-3 -- Pieces non assignees perdues en multi-lots

**Fichier** : `app/projet/[id]/qualification/page.tsx` l.150-170

Si l'API /status retourne des rooms avec lot_id=null et qu'il y a plusieurs lots, ces pieces sont silencieusement ignorees. Le code ne gere le rattachement des pieces non assignees que pour le cas "mergedLots.length === 1".

Pour un immeuble avec 3 lots, si l'extraction IA n'a pas assigne certaines pieces a un lot, Thomas ne les voit pas du tout sur la page de qualification. Pas d'avertissement, pas de message.

**Fix** : Ajouter un bloc "Pieces non assignees" visible si des rooms ont lot_id=null en multi-lots, avec un message d'alerte invitant Thomas a retourner a l'etape de validation pour les assigner.

---

### P2 -- Moyenne (ameliorations souhaitables)

#### P2-1 -- Pas de formatage du budget en milliers

Le champ budget est un input type="number" brut. Pour 150000 EUR, Thomas voit "150000" sans separateur. Un formatage "150 000 EUR" serait plus lisible, surtout sur mobile ou les gros chiffres sont difficiles a verifier.

**Fix** : Utiliser un champ text avec formatage a l'affichage (Intl.NumberFormat) et parsing au submit, ou au minimum ajouter un pattern d'aide visuelle.

#### P2-2 -- Le bouton "Retour" n'est pas assez visible

Le bouton "Retour" (vers validation) est en style secondaire (border gris, fond blanc) mais place APRES le bouton principal "Valider". Sur mobile, l'ordre est correct (principal en premier) mais le contrast entre les 2 boutons est faible. Un marchand presse pourrait cliquer "Retour" par erreur.

**Fix** : Sur mobile, inverser l'ordre (CTA principal en bas, retour en haut) ou ajouter une fleche gauche au bouton retour pour le differencier visuellement.

#### P2-3 -- Pas de confirmation avant de quitter si formulaire modifie

Si Thomas remplit le formulaire puis clique sur le stepper pour retourner a l'etape 3, il perd tout sans avertissement. Pas de beforeunload, pas de confirm().

**Fix** : Ajouter un listener beforeunload quand le formulaire a ete modifie (comparer formData avec les valeurs initiales).

#### P2-4 -- Le champ contraintes est limite a 2 lignes (rows=2) sans resize

La textarea a `resize-none`. Si Thomas a beaucoup de contraintes ("PMR, garder la cheminee, ne pas toucher aux poutres, budget plafond 30K pour le gros oeuvre, attention voisin a droite sensible au bruit"), il ne peut pas agrandir le champ.

**Fix** : Remplacer `resize-none` par `resize-y` et augmenter rows a 3.

#### P2-5 -- Pas de notes commerciales dans le formulaire client

L'API qualify accepte un champ `notes_commerciales` (l.31 du schema Zod), mais le formulaire client ne l'envoie pas. Ce champ pourrait etre utile pour Thomas (notes internes sur le lot, arguments de vente, etc.).

**Fix** : Ajouter un champ optionnel "Notes commerciales (usage interne)" dans le formulaire.

---

## Grille Thomas 10 criteres

| # | Critere | Note /10 | Commentaire |
|---|---------|----------|-------------|
| 1 | Retrouvabilite | 7.0 | Le stepper permet de naviguer entre etapes. Mais les completedSteps sont hardcodes -- je ne sais pas si telle etape a vraiment ete faite. |
| 2 | Prix/valeur | N/A | Pas de dimension prix sur cette etape. |
| 3 | Qualite pro | 8.0 | L'interface est propre, les blocs par lot sont bien structures. Mais les types de pieces risquent de s'afficher en anglais brut. |
| 4 | Partage acquereurs | N/A | Pas de partage sur cette etape. |
| 5 | Gestion d'erreur | 8.0 | Erreur reseau = message clair. Champs manquants = liste par nom de lot. Erreur API = message generique mais comprehensible. Manque la gestion des pieces non assignees. |
| 6 | Simplicite | 9.0 | 4 champs par lot, 2 obligatoires, 2 optionnels. Placeholder utiles. Je comprends en 10 secondes. |
| 7 | Confiance | 7.5 | Le branding est coherent (sage green, Inter, fond FAFAF8). Mais le stepper qui ment sur les etapes completees entame la confiance. |
| 8 | Completude | 7.0 | Les infos du lot sont la (cible, style, budget, contraintes, recap pieces). Mais le champ notes_commerciales de l'API n'est pas expose. Les types de pieces peuvent etre mal traduits. |
| 9 | Mobile-first | 8.5 | Grille 2 colonnes sur mobile, select natifs, touch targets OK (py-2.5 = ~40px, un peu juste mais acceptable). Le stepper mobile est vertical compact, lisible. |
| 10 | Rapidite | 8.0 | Double fetch au chargement (status + lots) mais parallelisable. Sauvegarde avec spinner. Redirection un peu trop rapide (800ms). |

---

## Resume des actions

| Priorite | ID | Description | Fichier |
|----------|----|-------------|---------|
| P0 | P0-1 | ROOM_TYPE_LABELS desynchronise -- importer depuis lib/constants.ts | page.tsx l.76-86, l.523 |
| P1 | P1-1 | Stepper completedSteps hardcode -- calculer depuis project.status | page.tsx l.284-285 |
| P1 | P1-2 | Redirection 800ms trop rapide -- 1500ms ou bouton explicite | page.tsx l.264 |
| P1 | P1-3 | Pieces non assignees perdues en multi-lots -- afficher un avertissement | page.tsx l.150-170 |
| P2 | P2-1 | Formatage budget en milliers | page.tsx l.437-451 |
| P2 | P2-2 | Bouton Retour peu distinctif | page.tsx l.586-594 |
| P2 | P2-3 | Pas de confirmation avant quitter si modifie | page.tsx (ajouter beforeunload) |
| P2 | P2-4 | Textarea contraintes trop petite + resize-none | page.tsx l.464-474 |
| P2 | P2-5 | Champ notes_commerciales absent du formulaire | page.tsx + API qualify |

---

## Estimation apres corrections P0+P1

Si les 4 corrections P0-P1 sont appliquees (import ROOM_TYPE_LABELS centralise, stepper dynamique, redirection allongee, gestion pieces non assignees) : note estimee **8.8/10**.

Pour atteindre 9.5/10, il faudrait aussi corriger les P2 (formatage budget, confirmation avant quitter, notes commerciales, textarea redimensionnable).
