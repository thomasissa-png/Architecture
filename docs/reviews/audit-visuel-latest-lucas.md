# Audit visuel — Lucas Moreau, Expert IA Image

**Date** : 2026-04-01 (mis a jour 2026-04-01 — session complementaire Lucas)
**Prompt version auditee** : v36
**Dernier audit** : #37-42 (2026-03-26)
**Generations cibles** : les 2 dernieres en production (post-#42)
**Modele primaire** : GPT-4.1 Responses API (gpt-image-1, configurable via IMAGE_MODEL)
**Fallback Flux passe 2** : DESACTIVE (Sprint 22, #41/#42 — hallucinations confirmees)

---

## Phase 1 — Acces aux logs de production

**BLOCAGE** : l'environnement local n'a pas d'acces HTTP direct a l'API de production `https://versimo.fr/api/logs?limit=2&token=allezpsg`. Les outils disponibles (Read, WebSearch) ne permettent pas de faire des requetes GET vers des APIs JSON distantes.

### Methode pour debloquer

L'utilisateur doit fournir les donnees par l'une de ces methodes :

1. **Coller le JSON** des 2 dernieres generations depuis `https://versimo.fr/api/logs?limit=2&token=allezpsg` directement dans le chat
2. **Fournir les chemins d'images** (input_image_path, output_image_path) pour que je puisse les analyser via l'API image `https://versimo.fr/api/logs/image?path=...&token=allezpsg`
3. **Executer l'audit depuis l'environnement Replit** ou le serveur a acces a la DB et au Object Storage

En attendant les donnees visuelles, je produis ci-dessous un **audit structurel des prompts v36** — la partie du travail qui ne necessite pas d'images.

---

## Audit structurel des builders v36

### Vue d'ensemble

Le pipeline v36 est compose de :
- **12 styles** avec split surfacePrompt / furniturePrompt (StylePicker.tsx)
- **9 builders passe 1** (surfaces) : generic, kitchen, bathroom, WC, bedroom, laundry, cellar, entryway, outdoor
- **9 builders passe 2** (mobilier) : memes categories + outdoor
- **5 constantes partagees** : DSLR_LINE, CEILING_PRESERVATION, LIGHT_PRESERVATION, WALL_PRESERVATION, CAMERA_PRESERVATION
- **Modele** : gpt-image-1 via Responses API (configurable via IMAGE_MODEL env var)

### Grille d'evaluation structurelle (prompts seuls, sans rendu)

| # | Critere | Note /10 | Observations |
|---|---------|----------|-------------|
| 1 | Preservation architecturale | 9.0 | CAMERA_PRESERVATION + WALL_PRESERVATION + CEILING_PRESERVATION couvrent angle, perspective, geometrie, voutes, poutres. "Same number of windows and doors" present dans tous les builders. WALL_PRESERVATION interdit explicitement l'ajout/retrait de volume, l'arrondi des coins, le changement d'epaisseur. |
| 2 | Contraintes lumiere | 8.5 | LIGHT_PRESERVATION bien formule : direction, ombres, intensite relative, temperature couleur. Directive anti-warm tint explicite. "Do not artificially brighten darker areas" present. Point faible : pas de directive specifique pour les pieces tres sombres (cave, sous-sol sans fenetre). |
| 3 | Vocabulaire photo | 9.0 | DSLR_LINE complet : full-frame 16-35mm f/8, deep DOF, sharp focus, grain, vignettage 5-10%. Coherent avec la photographie immobiliere professionnelle. |
| 4 | Structure prompt | 8.5 | Action FIRST dans tous les builders (v30 lesson). Style injecte en premier token. Contraintes camera/lumiere en fin de prompt. Bonne hierarchie token weighting. Point faible : le builder generique passe 2 fait 11 phrases — un peu long pour GPT-image-1 qui dilue les tokens tardifs. |
| 5 | Negative prompting | 7.5 | "No text or watermarks" present partout. "No curtains" dans EQUIPMENT_PRESERVATION. Pas de negative prompt structurel dans les builders GPT-image-1 (pas de syntaxe negative supportee). Le FLUX_NEGATIVE_PROMPT existe mais n'est plus utilise si Flux est desactive en passe 2. |
| 6 | Compatibilite multi-modeles | 6.0 | Les builders sont exclusivement GPT-image-1 via Responses API. Flux Depth Pro est mentionne dans le code mais desactive en passe 2 (decision audit #41/#42). Pas de builder Flux actif en production. La compatibilite multi-modeles est de facto inexistante — c'est un mono-modele pipeline. |
| 7 | Coherence I/O | 9.0 | getOutputSize() mappe correctement les ratios input vers les 3 formats OpenAI (1536x1024, 1024x1536, 1024x1024). Le seuil 1.3/0.77 est correct. |
| 8 | Richesse descriptive | 9.0 | Les furniturePrompts sont exceptionnellement detailles : structure FOREGROUND/LATERAL/BACKGROUND/ACCENTS, dimensions en cm, noms de pieces iconiques (PH5, Wegner, AJ, Eames, Sputnik), materiaux precis (boucle, breccia, latte, terrazzo). |
| 9 | Adaptabilite conditions | 7.5 | Scaling conditionnel present ("if compact", "if ceiling >3m", "if compact (<4m wide)"). Builder cave/buanderie adapte. Point faible : pas de directive specifique pour les images sous-exposees ou surexposees — la directive "preserve exposure" peut amplifier un probleme d'exposition. |
| 10 | Rendu final credible | 8.0 | "Result should look like a luxury real estate listing photo" present dans les builders principaux. "lived-in, not a sterile catalog" dans le generique. Grain + vignettage forcent le photorealisme. Sans images de production, note conservative. |

**Note structurelle moyenne ponderee** : 8.2/10

---

## Observations detaillees

### Points forts v36

1. **Split surfacePrompt / furniturePrompt mature** — chaque passe recoit exactement ce dont elle a besoin, zero pollution croisee.

2. **FOREGROUND/LATERAL/BACKGROUND/ACCENTS** dans les 12 furniturePrompts — structure de scenographie spatiale explicite qui guide la distribution en profondeur.

3. **References d'echelle multiples** — door = 204cm, handle = 100cm, sill = 90cm. Combinee avec les dimensions explicites du mobilier (230cm sofa, 120cm table, 200x300cm rug), c'est le meilleur ancrage d'echelle possible en text-to-image.

4. **WALL_PRESERVATION robuste** — "never add or remove volume, never round corners, never change wall thickness" est une formulation defensive excellente contre les deformations geometriques.

5. **Anti-warm tint** present dans LIGHT_PRESERVATION ET dans les builders passe 2 ("No warm tint or yellow cast") — double couverture.

### Points faibles identifies (P0-P4)

#### P1 — Builder generique passe 2 trop long (11 phrases)

**Probleme** : le builder generique `buildFurnitureResponsesPrompt` (fallback pour living_room, office, null) concatene 11 instructions. Les tokens tardifs (apres la 8e phrase) sont dilues par GPT-image-1.

**Impact** : les directives "No warm tint or yellow cast" et "Subtle film grain" sont en position 10 et 11 — les moins influentes.

**Recommandation** : fusionner les 2 dernieres phrases (structure LOCKED + DSLR) en une seule, et remonter "No warm tint" plus haut dans le prompt (position 5-6).

#### P2 — Pas de directive d'exposition pour pieces sous/surexposees

**Probleme** : LIGHT_PRESERVATION dit "preserve existing light direction, shadow positions, and relative intensity" mais ne gere pas le cas ou l'input est lui-meme mal expose (flash direct, contre-jour, sous-sol sans eclairage).

**Impact** : sur une photo tres sombre (cave, sous-sol), "preserve relative intensity" peut verrouiller l'image dans le noir. Sur un contre-jour, les zones cramees restent cramees.

**Recommandation** : ajouter une directive conditionnelle : "If the input appears heavily underexposed or overexposed, gently normalize exposure while preserving shadow and highlight distribution patterns."

#### P2 — Compatibilite multi-modeles degradee

**Probleme** : Flux Depth Pro est desactive en passe 2 mais reste dans le code. Il n'y a pas de fallback actif si OpenAI est indisponible. Le pipeline est en mono-modele.

**Impact** : toute indisponibilite OpenAI = zero generation. Pas de diversite de rendu.

**Recommandation** : si Flux est maintenu en fallback passe 1, creer un builder Flux specifique passe 1 avec negative_prompt complet. Evaluer un nouveau modele pour le fallback passe 2 (Flux ne convient pas — audit #41/#42 confirme).

#### P3 — CEILING_PRESERVATION ambigue sur "clean painted finish" pour poutres

**Probleme** : la constante dit "Beams keep 3D shape but receive clean painted finish." Cela contredit la directive Sprint 18 qui exigeait "rough texture, irregular edges, and surface patina intact."

**Impact** : sur des poutres massives brutes (chene, beton), "clean painted finish" peut lisser la texture tout en gardant la forme 3D — un compromis non desire pour les pieces de caractere.

**Recommandation** : reformuler en "Beams keep their 3D shape AND original surface texture (rough, weathered, patinated). Apply painted finish ONLY if the input beams are already painted."

#### P4 — "Furniture must not touch walls" trop strict

**Probleme** : present dans les builders bedroom et generic. En realite, certains meubles (lit, commode, buffet) DOIVENT etre contre un mur pour etre credibles.

**Impact** : le modele peut placer le lit au milieu de la chambre ou la commode en diagonal — incoherent avec un amenagement reel.

**Recommandation** : reformuler en "Avoid pressing furniture flat against walls — leave a visible 5-10cm gap for realism. Exception: bed headboard and storage units are expected against walls."

#### P2 — Vignettage absent des 7 builders dedies passe 2

**Probleme** : les builders dedies passe 2 (kitchen, bathroom, WC, bedroom, entryway, laundry, cellar) utilisent une version condensee : "Subtle film grain. No text or watermarks." — il manque "Natural lens vignetting 5-10%" et "at 100% zoom". Seul le builder generique a la version complete.

**Impact** : les generations avec room type specifie (majorite en production) n'ont pas la directive de vignettage. Le vignettage naturel est un marqueur photographique important — son absence produit un rendu plus "flat" sur les bords, un signal CGI detectable.

**Recommandation** : harmoniser en remplacant `"Subtle film grain. No text or watermarks."` par `"Subtle film grain at 100% zoom. Natural lens vignetting 5-10%. No text or watermarks."` dans les 7 builders dedies.

#### P3 — Directive mur accent non propagee a 6 builders passe 1

**Probleme** : la directive conditionnelle "If the input has ONE accent wall, preserve it" est presente uniquement dans les builders bedroom + fallback generique. Les 6 autres builders passe 1 (kitchen, bathroom, WC, entryway, laundry, cellar) ne l'ont pas.

**Impact** : faible en pratique (murs accent rares dans ces pieces), mais une entree ou une cuisine avec mur accent verrait celui-ci ecrase par le surfacePrompt.

**Recommandation** : propager au minimum dans les builders entryway et kitchen. WC/laundry/cellar peuvent rester sans.

#### P4 — "Smooth plaster" dans CEILING_PRESERVATION

**Probleme** : CEILING_PRESERVATION dit "smooth plaster over raw concrete" — le mot "smooth" est un signal de lissage pour le modele. Distinct du probleme P3 sur les poutres, ceci concerne le plafond lui-meme hors structure.

**Impact** : tres faible car protege par "Beams keep 3D shape". Risque limite aux plafonds en beton coffre sans poutres, ou les marques de coffrage seraient effacees.

**Recommandation** : remplacer "smooth plaster" par "clean plaster finish" — semantiquement equivalent mais sans signal de lissage.

---

## Generations a auditer (EN ATTENTE)

Les 2 dernieres generations de production n'ont pas pu etre recuperees (voir Phase 1 — blocage acces API). Pour completer cet audit :

1. Fournir le JSON des logs (`limit=2`)
2. Je completerai ce rapport avec :
   - Analyse INPUT vs OUTPUT par generation
   - Notation sur la grille 10 criteres visuels
   - Plan d'amelioration actualise

---

## Resume

| Element | Statut |
|---------|--------|
| Audit structurel prompts v36 | TERMINE — 8.2/10 |
| Audit visuel generation post-#42 | EN ATTENTE — donnees inaccessibles |
| Points forts | Split prompts, FOREGROUND/LATERAL/BACKGROUND, echelle, anti-warm tint |
| P1 | Builder generique trop long (11 phrases) |
| P2 | Pas de gestion exposition anormale |
| P2 | Mono-modele, pas de fallback passe 2 |
| P3 | CEILING_PRESERVATION contredit Sprint 18 sur poutres brutes |
| P2 | Vignettage absent des 7 builders dedies passe 2 |
| P3 | Directive mur accent non propagee a 6 builders |
| P4 | "Furniture must not touch walls" trop strict |
| P4 | "Smooth plaster" dans CEILING_PRESERVATION |

---

*Lucas Moreau — Expert IA Image*
*Prochain audit visuel : des que les donnees de production sont accessibles*
