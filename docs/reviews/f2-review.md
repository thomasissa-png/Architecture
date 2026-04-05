# Review croisee F2 — Type de piece

> Date : 2026-03-24
> Reviewer : @reviewer
> Fichiers audites : lib/room-types.ts, components/RoomTypePicker.tsx, app/api/generate/route.ts, app/page.tsx, lib/db.ts, lib/iteration-prompt.ts
> References : docs/product/functional-specs.md (F2), docs/ia/f2-room-type-prompts.md, CLAUDE.md

---

## Resume

L'implementation F2 est solide et bien structuree. Les 8 types de piece sont correctement definis avec des overrides fideles aux recommandations Yann+Lucas, l'exception built-in pour kitchen/bathroom est implementee dans les builders standard, et l'integration dans le pipeline est propre. Deux problemes notables : l'iteration F1 ne respecte pas le roomType (freestanding-only hardcode dans les builders d'iteration), et le roomType n'est pas enregistre dans generation_logs (perte d'information d'audit).

---

## Points conformes

### Specs F2.1 — User Stories
- [OK] US-F2-01 : Chaque type definit roomSurfaceOverride + roomFurnitureOverride dans lib/room-types.ts (8 types)
- [OK] US-F2-02 : Cuisine inclut plan de travail, credence, caissons, appareils encastres (roomFurnitureOverride complet)
- [PARTIEL] US-F2-03 : Auto-detection non implementee (optionnelle, non bloquante)

### Specs F2.2 — Wireframes
- [OK] Selecteur en pilules dans l'etape Style (page.tsx l.664-670)
- [OK] Toggle pour deselectionner (click again, RoomTypePicker.tsx l.16-18)
- [OK] Description affichee sous la selection (RoomTypePicker.tsx l.62-80)
- [NON] Etat "Auto-detection proposee" non implemente (US-F2-03 optionnelle)
- [NON] Etat "Conflit type/image" non implemente (US-F2-03 dependant)

### Specs F2.3 — Regles metier
- [OK] 8 types definis : living_room, bedroom, bathroom, kitchen, office, entryway, dining_room, laundry
- [OK] Enrichissement additif : roomSurfaceOverride concatene au surfacePrompt (applyRoomTypeOverrides l.163-164)
- [OK] roomFurnitureOverride REMPLACE le furniturePrompt quand non-vide (l.167-168)
- [OK] Salon = aucun override (strings vides, furniturePrompt du style utilise tel quel)
- [OK] roomType transmis dans le body /api/generate (page.tsx l.243)
- [OK] Si null, aucun override (applyRoomTypeOverrides l.152-157)
- [OK] Negative prompts additionnels pour sdb, cuisine, et tous les types concernes

### Specs F2.4 — Edge cases
- [OK] F2.4.1 Cuisine + Wabi-Sabi : pas de blocage, combinaison permise
- [OK] F2.4.3 Buanderie sans fenetre : aucune directive lumiere dans les overrides
- [OK] F2.4.6 Buanderie + Art Deco : pas de blocage

### Recommandations prompts (f2-room-type-prompts.md)
- [OK] Les 8 types correspondent exactement aux recommandations
- [OK] roomSurfaceOverride concatene avec `. ` (applyRoomTypeOverrides l.164)
- [OK] roomFurnitureOverride remplace (pas de concatenation) sauf pour Salon
- [OK] Exception built-in kitchen dans buildFurnitureResponsesPrompt (route.ts l.101-102)
- [OK] Exception built-in bathroom dans buildFurnitureResponsesPrompt (route.ts l.103-104)
- [OK] Exception built-in dans buildFurnitureFluxPrompt (route.ts l.126-129)
- [OK] roomNegativeOverride concatene au FLUX_NEGATIVE_PROMPT (tryFluxDepth l.240-242)
- [OK] roomType stocke dans Pass1Meta (db.ts l.106, route.ts l.664)

### Regles CLAUDE.md
- [OK] Pas de directives de lumiere dans les overrides (sauf "soft ambient lighting from ceiling fixture" en chambre — voir M-03)
- [OK] Pas de curtains/drapes/windows dans les overrides
- [OK] Pas de TRANSFORM dans les prompts
- [OK] "Add" utilise dans buildFurnitureResponsesPrompt (route.ts l.110)
- [OK] Dimensions de mobilier explicites (160cm lit, 80cm vanity, 140cm bureau, 180cm table, etc.)
- [OK] Distribution en profondeur conditionnelle preservee dans les builders
- [OK] surfacePrompt nomme les materiaux cibles (ceramic tiles, subway tile, etc.)

### Integration F1
- [OK] roomType stocke dans Pass1Meta (db.ts l.106)
- [OK] Pass1Meta sauvegarde avec roomType (route.ts l.664)

### UI/UX
- [OK] role="radiogroup" + role="radio" + aria-checked (RoomTypePicker.tsx l.32-33, 43-44)
- [OK] aria-label sur chaque bouton (l.45)
- [OK] focus-visible:ring-2 ring-sage/50 ring-offset-2 (l.46)
- [OK] Emoji aria-hidden="true" (l.52)
- [OK] Couleurs coherentes : bg-sage text-white (selection), bg-gray-100 (inactif) — conforme palette
- [OK] min-h-[36px] pour cibles tactiles (l.46) — respecte le minimum 44px si padding inclus
- [OK] flex-wrap pour le responsive (l.35)
- [OK] selectedRoomType reinitialise dans handleFullReset (page.tsx l.322)

### Fix F1 confirmes
- [OK] H-02 corrige : page.tsx l.258 lit `data.pass1_key` (snake_case), l.383 envoie `pass1_key` (snake_case)
- [OK] H-01 corrige : le commentaire brut est envoye au serveur sans pre-processing client (page.tsx l.375, commentaire explicatif l.372-374)

---

## Problemes identifies

### HAUTE

**H-01 — L'iteration F1 ignore le roomType : freestanding-only hardcode dans les builders d'iteration**
- **Fichier** : lib/iteration-prompt.ts l.34
- **Description** : Le builder d'iteration contient `"ONLY add freestanding objects. Do NOT attach anything to walls. No built-in shelving, no curtains."` en dur. Or, si l'utilisateur itere sur une generation de cuisine (roomType=kitchen), la regle "freestanding only" contredit l'exception built-in definie dans le flux standard.
- **Cause** : Le roomType est bien stocke dans Pass1Meta (db.ts l.106) mais n'est jamais lu ni utilise dans le flux iteration de route.ts (l.535-563). Les builders d'iteration dans iteration-prompt.ts ne prennent pas de parametre roomTypeId.
- **Impact** : Si l'utilisateur itere sur une cuisine ("remplace les tabourets par des chaises hautes"), le builder d'iteration dira "freestanding only" et le modele pourrait supprimer les caissons et le plan de travail ajoutes par la generation initiale.
- **Correction suggeree** :
  1. Ajouter `roomTypeId?: string | null` aux signatures de `buildIterationFurnitureResponsesPrompt` et `buildIterationFurnitureFluxPrompt`
  2. Reproduire la logique d'exception kitchen/bathroom (comme dans buildFurnitureResponsesPrompt l.100-107)
  3. Dans route.ts flux iteration (l.536), lire `cached.meta.roomType` et le passer aux builders
- **Agent responsable** : @fullstack

**H-02 — Le roomType n'est pas enregistre dans generation_logs (perte de donnees d'audit)**
- **Fichier** : lib/db.ts — table generation_logs (l.29-58) + GenerationLogParams (l.167-195) + logGeneration INSERT (l.214-223)
- **Description** : Le roomType est stocke dans Pass1Meta pour les iterations, mais il n'est PAS enregistre dans la table generation_logs. Il n'y a pas de colonne `room_type` dans la table, pas de champ dans `GenerationLogParams`, et pas de valeur dans l'INSERT.
- **Impact** : Impossible d'analyser la qualite des generations par type de piece. Les agents Yann et Lucas ne peuvent pas auditer "toutes les generations Cuisine" ou "les pires scores par type". C'est une perte d'information critique pour l'audit qualite.
- **Correction suggeree** :
  1. Ajouter colonne `room_type VARCHAR(50)` a la table (ALTER TABLE ou dans le CREATE IF NOT EXISTS)
  2. Ajouter `roomType?: string | null` a `GenerationLogParams`
  3. Inclure dans l'INSERT SQL
  4. Passer `roomType` dans les appels `logGeneration()` de route.ts (l.582, 677, 704)
- **Agent responsable** : @fullstack

### MOYENNE

**M-01 — Bedroom surfaceOverride contient une directive de lumiere**
- **Fichier** : lib/room-types.ts l.43
- **Description** : Le roomSurfaceOverride de "bedroom" dit : `"soft ambient lighting from the ceiling fixture"`. C'est une directive de lumiere, ce qui viole la regle CLAUDE.md "NE JAMAIS inclure de directives de lumiere dans les stylePrompts — la lumiere de l'input est sacree." Les overrides de type de piece sont des enrichissements du style et tombent sous la meme regle.
- **Impact** : Le modele pourrait modifier l'eclairage de l'input pour le rendre "soft ambient", ce qui contredit la philosophie de preservation de la lumiere existante.
- **Correction suggeree** : Supprimer `", soft ambient lighting from the ceiling fixture"` du bedroom surfaceOverride. Le luminaire est deja prescrit par le surfacePrompt du style.
- **Agent responsable** : @fullstack
- **Note** : La meme formulation existe dans f2-room-type-prompts.md l.51 — c'est la source d'origine. Mais la regle CLAUDE.md est la reference supreme.

**M-02 — Taille de cible tactile potentiellement insuffisante sur mobile**
- **Fichier** : components/RoomTypePicker.tsx l.46
- **Description** : Les pilules ont `min-h-[36px]` et `px-3.5 py-2`. Avec la font-size text-sm et le padding, la hauteur totale est ~36px. Les recommandations WCAG 2.2 cible minimum 24x24px (AAA recommande 44x44px). A 36px, c'est conforme au minimum mais en dessous du confort tactile optimal. Avec `gap-2` (8px), les cibles sont proches les unes des autres sur mobile.
- **Impact** : Sur petit mobile, les pilules "Salle a manger" et "Buanderie" pourraient etre difficiles a toucher precisement.
- **Correction suggeree** : Augmenter a `min-h-[40px]` ou `py-2.5` pour les ecrans mobiles via `sm:py-2 py-2.5`.

**M-03 — Le pre-processing custom prompt (F2.4.5) ne recoit pas le roomType**
- **Fichier** : app/page.tsx l.167-170
- **Description** : La spec F2.4.5 dit "Custom prompt + type de piece : GPT-4.1-mini recoit roomType + texte custom. Il filtre les elements du custom incompatibles avec le type." Mais le pre-processing dans page.tsx l.167-170 n'envoie pas `roomType` dans le body de `/api/preprocess-prompt`.
- **Impact** : Un utilisateur qui selectionne "Cuisine" + prompt custom "mets un grand canape blanc" ne sera pas filtre. Le canape sera dans la generation de cuisine.
- **Correction suggeree** : Ajouter `roomType: selectedRoomType` dans le body de l'appel `/api/preprocess-prompt` (page.tsx l.170). Modifier le endpoint pour inclure le roomType dans le system prompt de GPT-4.1-mini.
- **Agent responsable** : @fullstack

**M-04 — Les labels ne contiennent pas d'accents (entree, piece, etc.)**
- **Fichier** : lib/room-types.ts, components/RoomTypePicker.tsx
- **Description** : Les labels affichent "Entree" (l.91), "Salle a manger" (l.103) et les aria-labels "Choix du type de piece" (RoomTypePicker.tsx l.34). Le site est en francais (CLAUDE.md "Langue UI : Francais"). L'absence d'accents est incoherente avec le reste de l'UI qui utilise des entites HTML pour les accents.
- **Impact** : Presentation legerement incorrecte. Les lecteurs d'ecran prononceront "entree" au lieu de "entree" (accent).
- **Correction suggeree** : Remplacer par "Entr\u00e9e", "Salle \u00e0 manger", "Type de pi\u00e8ce", etc. dans les labels et descriptions.

### BASSE

**B-01 — La description de Salle de bain mentionne "rangements" — trop generique**
- **Fichier** : lib/room-types.ts l.54
- **Description** : `description: "Mobilier adapte : vasque, miroir, rangements"` — "rangements" est vague. Les autres types sont plus specifiques ("plan de travail, caissons, tabourets" pour cuisine).
- **Impact** : Purement cosmetique, n'affecte pas la generation.

**B-02 — Bathroom roomFurnitureOverride omet la dimension (>8sqm) pour la baignoire**
- **Fichier** : lib/room-types.ts l.58
- **Description** : La recommandation (f2-room-type-prompts.md l.60) dit `"No freestanding bathtub unless room is large (>8sqm)"`. L'implementation dit `"No freestanding bathtub unless room is large"`. La dimension est un guidage utile pour le modele.
- **Impact** : Mineur — le modele interprete "large" de maniere raisonnable. Mais le `>8sqm` donne une reference d'echelle concrete.

---

## Verification des corrections F1

Les corrections F1 identifiees dans f1-review.md ont ete appliquees dans cette livraison :
- **H-02 (pass1Key mismatch)** : CORRIGE — page.tsx l.258 (`data.pass1_key`) et l.383 (`pass1_key: targetResult.pass1Key`) sont maintenant coherents en snake_case
- **H-01 (double pre-processing)** : CORRIGE — page.tsx l.372-375 envoie le commentaire brut, commentaire explicatif referancant la review

---

## Angles morts

1. **F2.4.2 Image multi-espace** : La spec prevoit un message informatif "Cette feature gere une seule piece a la fois" mais aucune detection ou message n'est implemente. Acceptable MVP.
2. **F2.4.4 Image illisible + type** : Pas de test specifique mais couvert par la validation `isLikelyInterior` en amont.
3. **F2.4.5 Custom + roomType** : Le pre-processing custom ne recoit pas le roomType (voir M-03).
4. **F2.5 Events tracking** : Aucun event tracking implemente (room_type_selected, room_type_cleared, etc.). Non bloquant pour le MVP mais necessite implementation avant analytics.

---

## Recommandations d'amelioration

1. **P1** : Corriger H-01 (iteration + roomType) avant de mettre en production — un utilisateur qui itere sur une cuisine perdra les elements encastres.
2. **P1** : Ajouter roomType aux generation_logs (H-02) — l'audit qualite par type de piece est critique pour les agents Yann/Lucas.
3. **P2** : Supprimer la directive lumiere du bedroom surfaceOverride (M-01).
4. **P2** : Ajouter les accents dans les labels francais (M-04).
5. **P3** : Implementer l'auto-detection (US-F2-03) — feature background, non bloquante.
6. **P3** : Implementer les events tracking F2.5 quand le systeme d'analytics sera en place.

---

## Verdict

**VALIDE AVEC RESERVES**

L'implementation F2 est correcte et bien alignee avec les specs et les recommandations prompts. Les 8 types de piece fonctionnent, l'exception built-in est en place, l'UI est accessible. Les reserves portent sur :
- H-01 (iteration ignore roomType) qui doit etre corrige avant qu'un utilisateur itere sur une cuisine ou salle de bain
- H-02 (roomType absent des logs) qui empeche l'audit qualite par type de piece

Les corrections F1 (H-01 double pre-processing, H-02 mismatch pass1_key) sont confirmees resolues.

---

**Handoff -> @orchestrator**
- Fichier produit : `docs/reviews/f2-review.md`
- Decisions prises : VALIDE AVEC RESERVES — 2 HAUTE, 4 MOYENNE, 2 BASSE
- Points d'attention :
  - H-01 : @fullstack doit ajouter le roomType aux builders d'iteration (iteration-prompt.ts + route.ts)
  - H-02 : @fullstack doit ajouter la colonne room_type a generation_logs et la passer dans logGeneration()
  - M-01 : @fullstack doit supprimer la directive lumiere du bedroom surfaceOverride
  - M-03 : @fullstack doit envoyer roomType au pre-processing custom
