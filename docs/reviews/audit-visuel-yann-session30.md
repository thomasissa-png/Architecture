# Audit visuel — Session 30 — Yann Duval, Architecte d'interieur

Date : 2026-03-31
Pipeline : v32 (gpt-image-1, revert depuis gpt-image-1.5)
Focus : REGRESSION DISTRIBUTION SPATIALE (demande fondateur Thomas)
Methode : audit structural des prompts (route.ts v32 + StylePicker.tsx + room-types.ts) + comparaison avec les audits precedents (#31-42, v24 #45-47, SDB)

---

## 0. Contexte — historique des notes

| Batch | Generations | Moyenne Yann | Meilleure | Pire | Version |
|---|---|---|---|---|---|
| Sprint 17b | #18-28 | ~8.0 (Lucas 8.4) | #28 Scand. 8.4 | #13 Custom 3.3 | v17 |
| #31-36 | 6 gen. | 6.7 (hors iter. 7.7) | #36 Scand. 8.2 | #33 iter. 4.8 | v18+ |
| #37-42 | 6 gen. | 5.5 | #38 Cosy 7.0 | #42 Flux P2 3.7 | v18+ |
| v24 #45-47 | 3 gen. | 8.0 | #47 Wabi-Sabi 8.5 | #45 Contemp. 7.5 | v24 |
| SDB audit | 1 gen. | 3.2 | — | SDB 3.2 | v24 |

La trajectoire est en dents de scie. Le pipeline 2 passes GPT-4.1 produit du 7.5-8.5 quand il fonctionne (v24), mais les regressions sont frequentes (Flux P2, iterations, SDB). Le fondateur s'inquiete a juste titre.

---

## 1. Audit structural — Distribution spatiale dans les prompts actuels (v32)

### 1.1 Ce qui FONCTIONNE dans la distribution spatiale

Le builder generique (living_room, office, fallback) contient des directives robustes :

```
"Distribute furniture across FULL DEPTH and WIDTH: primary group foreground,
secondary group further back if space allows, lateral anchor on opposite side
if room is wide."
```

Et dans le prompt Flux fallback :
```
"Distribute furniture in depth and width: primary group in foreground,
secondary group in the back if space allows, lateral anchor on the opposite
side if room is wide."
```

C'est exactement ce qui a ete valide dans l'audit v24 (#46 Boheme : "distribution spatiale correcte — canape au fond, fauteuil a droite, plantes en hauteur et au sol"). La directive conditionnelle "if space allows" est neutre sur les petites pieces.

**Verdict : la directive de distribution en profondeur est PRESENTE et CORRECTE pour les salons/bureaux.**

### 1.2 Ce qui est ABSENT ou DEGRADE — pieces specifiques

| Type de piece | Distribution profondeur | Scaling conditionnel | Risque regression |
|---|---|---|---|
| living_room (fallback) | OUI — "FULL DEPTH and WIDTH" | OUI — "if compact <4m wide, smaller pieces" | FAIBLE |
| dining_room | PARTIEL — "sideboard as background anchor if deep" | OUI — "if compact, round 120cm vs 180cm" | MOYEN |
| bedroom_adults | ABSENT — "rug beside bed, wardrobe as background anchor" | OUI — "if compact, 140cm bed instead of 160cm" | MOYEN |
| bedroom_children | ABSENT — aucune directive de distribution | PARTIEL — "if space allows" pour bureau | HAUT |
| bathroom | ABSENT — aucune distribution | PARTIEL — "if compact, 60cm vanity" | CRITIQUE (audit SDB 3.2) |
| kitchen | ABSENT — "island ONLY if >10m2" | OUI — bon scaling conditionnel | MOYEN |
| entryway | ABSENT — "small space, do not overcrowd" | OUI — "console max 60% wall width" | FAIBLE (petit espace) |
| laundry/cellar | ABSENT — fonctionnel | OUI — "if compact, skip folding table" | FAIBLE |

**Constat critique : la distribution en profondeur n'existe QUE dans le builder generique (salon/bureau). Les 7 autres types de pieces n'ont AUCUNE directive de distribution spatiale.**

### 1.3 Analyse des furniturePrompts par style (StylePicker.tsx)

Les 12 furniturePrompts de StylePicker sont conçus pour le SALON. Ils decrivent un ensemble de meubles salon (canape, table basse, lampadaire, tapis). Quand un roomFurnitureOverride est actif (chambre, SDB, cuisine), le furniturePrompt du style est REMPLACE par le override.

**Probleme** : les roomFurnitureOverrides ne contiennent PAS de directives compositionnelles. Ils listent du mobilier sans indiquer comment le distribuer dans l'espace. Le builder generique ajoute "Distribute furniture across FULL DEPTH and WIDTH" mais cette directive n'est PAS presente dans les builders dedies (kitchen, bathroom, bedroom, entryway).

**C'est la CAUSE RACINE de la regression spatiale sur les pieces non-salon.**

### 1.4 Le revert gpt-image-1.5 vers gpt-image-1 (v32)

Le changelog v32 documente :
```
v32 (revert gpt-image-1.5 -> gpt-image-1 — regression spatiale confirmee
par audit Lucas, modele configurable via env)
```

Le modele gpt-image-1.5 causait une regression spatiale. Le revert est correct. Mais le probleme de distribution n'est PAS lie au modele — il est lie a l'ABSENCE de directives dans les builders dedies.

---

## 2. Analyse detaillee par zone de risque

### 2.1 CRITIQUE — Salle de bain (audit SDB 3.2/10)

L'audit SDB precedent a diagnostique :
- UNE seule dimension (vasque 80cm) sur 6 elements
- Aucune reference d'echelle alternative (la porte n'est pas visible dans les cadrages SDB)
- Aucune directive conditionnelle de taille
- La douche n'a ni largeur ni profondeur

**Corrections appliquees depuis** (room-types.ts) :
```
"frameless glass walk-in shower enclosure 80-90cm wide"
"rectangular backlit mirror 70cm wide 90cm tall"
"small teak stool 30cm diameter 45cm tall"
"one potted fern 25cm pot diameter"
"woven basket 30cm diameter"
```

Les dimensions ont ete ajoutees. Le builder bathroom a aussi ete enrichi avec :
```
"If the room appears compact (one wall visible is under 2m), use a 60cm vanity
instead of 80cm, skip the stool and basket"
"The shower enclosure must NOT extend beyond one-third of any visible wall"
"Use ceiling height (~250cm), tile size, and visible plumbing as scale references"
```

**Verdict : les corrections SDB sont PRESENTES dans le code. Reste a valider visuellement sur une nouvelle generation.**

### 2.2 HAUTE — Chambre adultes

Le roomFurnitureOverride chambre adultes est bien dimensionne :
```
"double bed 160cm wide with padded headboard"
"two matching bedside tables 45cm wide"
"soft area rug 160x230cm beside the bed"
```

Et le builder bedroom a une directive de scaling :
```
"if compact room, use 140cm bed instead of 160cm, skip bench at foot"
```

**Mais** : aucune directive de distribution en profondeur. Dans une grande chambre, le lit, les chevets et le tapis seront tous regroupes au premier plan. Le fauteuil lecture "if space allows" est mentionne dans le override mais sans indication de positionnement spatial.

**Risque** : sur une grande chambre (suite parentale, loft), le fond de la piece restera vide. L'armoire/dresser "as background anchor" est present dans le furniturePrompt generique mais pas dans le roomFurnitureOverride (qui le REMPLACE).

### 2.3 HAUTE — Chambre enfants

Le roomFurnitureOverride :
```
"single bed 90cm wide [...] low open shelving unit 100cm wide [...]
small desk 80cm wide with child-sized chair for homework if space allows"
```

Dimensions presentes. Mais ZERO directive de distribution. Le bureau "if space allows" devrait etre un "secondary group" en zone opposee au lit. Aucune instruction ne le dit.

### 2.4 MOYENNE — Salle a manger

Le builder dining est le meilleur apres le fallback generique :
```
"Center the dining table with chairs. If room is deep or has multiple zones,
add a sideboard or buffet as background anchor."
```

C'est une distribution implicite en 2 zones (table centree + buffer fond). C'est CORRECT pour une salle a manger. Le scaling conditionnel (120cm rond vs 180cm rectangulaire) est aussi bon.

### 2.5 FAIBLE — Cuisine / Entree / Buanderie / Cave

Ces pieces sont petites par nature. La distribution en profondeur n'est pas pertinente. Les directives actuelles sont adequates.

---

## 3. Patterns recurrents identifies (cross-audit)

### 3.1 Pattern : "tout au premier plan" (persiste depuis Sprint 14)

Le Sprint 14 a identifie ce biais IA : "les modeles composent comme des photographes — sujet au premier plan, arriere-plan vide." La directive "Distribute across FULL DEPTH" a ete ajoutee au builder generique. Mais elle n'a PAS ete propagee aux builders dedies (bedroom, kitchen, dining, bathroom, entryway, laundry, cellar).

**C'est un learning P0 non propage.** Exactement le type de regression que le framework lessons-learned est cense prevenir.

### 3.2 Pattern : "background anchor" insuffisant

Plusieurs prompts mentionnent un meuble "as background anchor" (credenza Mid-Century, bookcase Haussmannien, wardrobe chambre). Mais l'audit v24 a montre que le placement par ancrage compositionnel ("as background anchor") est plus efficace que le placement directif ("placed along the back of the room"). Le probleme est que les roomFurnitureOverrides ne reprennent PAS cette formulation.

### 3.3 Pattern : "ombres contact" vs "ombres flottantes"

La directive "Every piece must appear firmly grounded on the floor with visible contact shadows" est presente dans le builder generique, dining et bedroom. Elle est ABSENTE de kitchen, bathroom, WC, entryway, laundry, cellar. Sans cette directive, le mobilier peut sembler flotter.

---

## 4. Recommandations P0-P4

### P0 — Propagation distribution profondeur a TOUS les builders (regression bloquante)

**Fichier** : `app/api/generate/route.ts`
**Action** : Ajouter une directive de distribution conditionnelle dans les builders bedroom_adults, bedroom_children, et kitchen (les seules pieces ou la profondeur est pertinente et non traitee) :

Pour bedroom :
```
"If the room appears deep or spacious, distribute furniture in depth:
bed zone as primary group, accent chair or reading nook as secondary
group further back."
```

Pour kitchen (si grand espace) :
```
"If the kitchen is deep or L-shaped, distribute elements in depth:
cooking zone as primary, breakfast area or additional storage as
secondary group further back."
```

### P1 — Ajout "contact shadows" aux builders qui en manquent

**Fichier** : `app/api/generate/route.ts`
**Action** : Ajouter "Every piece must appear firmly grounded with visible contact shadows" aux builders kitchen, bathroom, WC, entryway, laundry, cellar. C'est une phrase de 10 mots qui empeche le mobilier flottant.

### P1 — Chambre adultes : armoire/dresser "as background anchor" absent du override

**Fichier** : `lib/room-types.ts`
**Action** : Le roomFurnitureOverride chambre adultes dit "a tall wardrobe or dresser as background anchor" — c'est bien present. Verifier que le builder bedroom le preserve (il dit "wardrobe or dresser as background anchor" — OK, coherent).

### P2 — Validation visuelle SDB post-corrections

**Action** : Generer 3 salles de bain de tailles differentes (petite ~3m2, standard ~5m2, grande ~10m2) en Scandinave et Contemporain. Auditer la conformite dimensionnelle. Les corrections du sprint SDB n'ont jamais ete validees visuellement.

### P2 — Chambre enfants : ajouter distribution bureau

**Fichier** : `lib/room-types.ts`
**Action** : Modifier le roomFurnitureOverride children pour ajouter "place desk and chair as secondary group on opposite wall from bed if space allows" — ancrage spatial du bureau.

### P3 — Tester les 5/12 styles jamais audites en 2 passes completes

Les styles suivants n'ont JAMAIS ete audites visuellement en pipeline v32 sur piece vide :
- Haussmannien
- Maximaliste
- Art Deco (derniere generation auditee : #18 Sprint 17b, note 8.3 — mais en v17)
- Industriel
- Mediterraneen (derniere : #7, note 6.7 — v18, avant les corrections majeures)

**Action** : generer 5 images (1 par style) sur une piece vide standard et auditer.

### P4 — Monitoring automatise des proportions

**Action** : Ajouter dans le log de generation un champ `furniture_coverage_estimate` (ratio surface meublee / surface totale visible, estime par le modele). Permettrait de detecter automatiquement les problemes de surmeublage ou de piece vide.

---

## 5. Evaluation de l'etat actuel — note globale estimee

En l'absence d'images de production recentes accessibles (les images Object Storage ne sont pas consultables via les outils d'audit actuels sans acces reseau direct), j'evalue sur la base des PROMPTS :

| Critere | Note estimee | Justification |
|---|---|---|
| Fidelite stylistique | 8/10 | Les 12 stylePrompts sont matures, hero pieces correctes (PH5, Wegner, fauteuil paon, tetsubin) |
| Vocabulaire visuel | 8/10 | Materiaux, textures, couleurs specifiques dans chaque prompt |
| Hero pieces | 7.5/10 | Presentes mais le lampadaire arc generique n'est pas completement elimine (Contemporain furniturePrompt mentionne "Flos IC-style" — bon) |
| Coherence matieres | 8/10 | Chaque style a une palette coherente, pas de dissonance visible dans les prompts |
| Eclairage | 8/10 | "Preserve existing lighting" est bien ancre, plus de directives de lumiere dans les styles |
| Credibilite pro | 7/10 | BAISSEE par l'absence de distribution profondeur dans 7/8 builders. Un architecte verrait le mobilier colle au premier plan sur les chambres/SDB. |
| Completude | 6.5/10 | BAISSEE par l'absence de directives de distribution dans les pieces non-salon + 5 styles jamais testes |
| Differenciation | 8/10 | Split surface/furniture + hero pieces specifiques = bonne differenciation inter-styles |
| Adaptabilite spatiale | 6/10 | Le point faible : le scaling conditionnel est present MAIS la distribution spatiale ne l'est pas dans la plupart des builders |
| Potentiel photorealiste | 7.5/10 | Grain ISO 200, vignettage, DSLR descriptors — correct mais "CGI-clean" persiste selon les audits precedents |

**Note globale estimee (ponderee) : 7.3/10**

C'est une regression par rapport au batch v24 (8.0/10) mais une progression par rapport aux batches #37-42 (5.5/10). La regression vient du fait que les corrections de distribution spatiale (Sprint 14) n'ont ete appliquees QU'AU BUILDER GENERIQUE et pas aux builders dedies.

---

## 6. Verdict — Question du fondateur

> "Regression sur la gestion des espaces — distribution spatiale du mobilier, proportions, profondeur"

**Reponse : OUI, il y a une regression structurelle, mais elle n'est PAS nouvelle.**

La directive "Distribute across FULL DEPTH and WIDTH" (Sprint 14, audit #95-98) n'a JAMAIS ete propagee aux builders dedies (bedroom, bathroom, kitchen, entryway, etc.). Tant que les utilisateurs generaient des SALONS (type par defaut), la distribution fonctionnait. Des que les types de pieces specifiques ont ete introduits (Sprint 20+), la distribution a disparu car les builders dedies ecrasent le builder generique.

**C'est un probleme de PROPAGATION, pas de REGRESSION du modele.** Le modele gpt-image-1 est le bon choix (v32 confirme). Les stylePrompts sont matures. Mais les builders dedies n'ont pas suivi l'evolution des directives compositionnelles du builder generique.

**Actions immediates** :
1. **P0** : Propager "distribute in depth" aux builders bedroom et kitchen
2. **P1** : Ajouter "contact shadows" a tous les builders
3. **P2** : Valider visuellement SDB + 5 styles non testes
4. **P2** : Ajouter distribution bureau en chambre enfants

**Estimation d'impact** : +0.5 a +1.0 point sur l'adaptabilite spatiale (de 6.0 a 7.0+), ce qui remonterait la note globale estimee de 7.3 a ~7.7/10.

---

## Handoff

- **Destinataire** : @ai-image-expert (Lucas Moreau) pour audit technique croise + @fullstack pour implementation P0/P1
- **Fichiers** : ce document (`docs/reviews/audit-visuel-yann-session30.md`)
- **A implementer par fullstack** :
  - P0 : route.ts — ajouter distribution profondeur aux builders bedroom + kitchen
  - P1 : route.ts — ajouter contact shadows aux 6 builders qui en manquent
  - P2 : room-types.ts — distribution bureau chambre enfants
- **A valider par Lucas** : preservation geometrique post-corrections, grain photo, ombres
- **A tester** : 3 SDB differentes tailles + 5 styles non audites + 2 chambres (compacte vs spacieuse)
