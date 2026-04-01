# Audit visuel — Lucas Moreau, Expert IA Image

**Date** : 2026-04-01
**Prompt version auditee** : v36
**Dernier audit** : #37-42 (2026-03-26)
**Generations cibles** : #94 et #95 — Maximalist
**Modele primaire** : GPT-4.1 Responses API (gpt-image-1 via image_generation tool)
**Pipeline** : 2 passes (surfaces puis mobilier), GPT-4.1 pour les 2 passes
**Fallback Flux passe 2** : DESACTIVE (Sprint 22)

---

## Generation #94 — Maximalist (salon/sejour)

### Contexte input

Photo de chantier brut : piece rectangulaire ~15-18m2 en travaux actifs. Chape beton au sol, murs en partie enduits (gris/beige), poutres apparentes au plafond avec traces de demolition, cables electriques pendants visibles a droite, un ballon d'eau chaude mural au fond, une fenetre a gauche avec vue sur vegetation, une ouverture sombre au fond. Deux personnes presentes dans la piece. Eclairage mixte : lumiere naturelle laterale depuis la fenetre gauche + neon lineaire au plafond. Angle de prise de vue : grand-angle depuis l'entree, legere plongee, orientation portrait.

### Analyse output

**Transformation globale** : La piece a ete entierement restylisee avec un mur accent teal profond en fond, murs off-white sur les cotes, parquet sombre au sol, lustre sculptural en laiton/verre colore. Mobilier maximalist deploye : canape cobalt, table basse corail, tapis superposes (persan + chevron graphique), monstera, lampadaire cuivre, gravures au sol.

**Preservation architecturale** :
- Angle de camera : globalement respecte, meme orientation portrait, meme perspective de coin. La ligne de fuite principale est coherente. Cependant la piece semble plus haute et plus etroite que l'input — le ratio mural a ete legerement etire verticalement.
- Poutres au plafond : PRESERVEES. Les poutres apparentes sont visibles dans l'output avec une finition blanche propre. La geometrie 3D du plafond (arete centrale, poutres transversales) est respectee. Bon point.
- Fenetre gauche : presente, meme position relative, meme proportions. Les montants noirs sont coherents. Le cadrage de la fenetre est fidele.
- Ouverture fond : l'ouverture sombre du fond a disparu, remplacee par le mur accent teal. C'est une modification structurelle significative — perte d'une ouverture.
- Personnes : correctement supprimees (attendu en home staging).
- Ballon d'eau chaude : supprime. C'est un equipement mural fixe qui aurait du etre preserve selon les directives.

**Contraintes lumiere** :
- La direction principale est coherente : lumiere venant de la gauche (fenetre), ombres portees a droite. Le gradient lumineux fenetre-fond est present.
- Pas de warm shift excessif — les murs off-white restent neutres. Le mur teal est sature mais sans cast jaune.
- Le lustre sculptural n'introduit pas de source lumineuse artificielle parasite — pas de halos.
- Les ombres portees du mobilier sont presentes et coherentes avec la source gauche.

**Vocabulaire photo** :
- Profondeur de champ : apparemment profonde, tout est net du premier plan au fond. Coherent f/8.
- Grain : visible de facon subtile, pas de rendu CGI-clean. Correct.
- Vignettage : leger assombrissement en coin bas-droit. Present mais discret.
- La texture des matieres (velours canape, laiton, ceramique du pot) est bien rendue avec des micro-reflets realistes.

**Rendu final** :
- Visuellement tres convaincant comme image de listing immobilier haut de gamme.
- La palette maximalist (teal, cobalt, corail, laiton, persan) est riche sans etre criarde.
- Les tapis superposes (persan vintage + chevron noir/blanc) sont une signature stylistique forte et bien executee.
- La monstera dans le pot ceramique colore est un element vivant credible.
- Le lampadaire cuivre avec dome est un luminaire distinctif (pas l'arc generique noir — bon point).
- Les gravures posees au sol contre le mur sont un detail maximalist authentique.

**Problemes detectes** :
1. Ouverture du fond disparue — modification structurelle (devrait etre preservee)
2. Ballon d'eau chaude supprime — equipement fixe mural non preserve
3. Piece legerement etiree verticalement — distorsion geometrique mineure
4. Art prints au sol sont proches du "wall art" interdit, mais posees au sol elles sont acceptables en maximalist

### Grille de notation #94

| # | Critere | Poids | Note /10 | Commentaire |
|---|---------|-------|----------|-------------|
| 1 | Preservation architecturale | x2 | 6.5 | Poutres OK, fenetre OK, mais ouverture fond disparue + ballon supprime + legere distorsion verticale |
| 2 | Contraintes lumiere | x1 | 8.0 | Direction preservee, gradient fenetre-fond present, pas de warm shift |
| 3 | Vocabulaire photo | x1 | 8.5 | Grain subtil, DOF profonde, vignettage present, textures materiaux credibles |
| 4 | Structure prompt | x1 | 8.0 | Le resultat reflete bien le furniturePrompt maximalist (cobalt, corail, persan, monstera) |
| 5 | Negative prompting | x1 | 7.5 | Pas de rideaux, pas de fenetres ajoutees, mais art prints au sol = zone grise |
| 6 | Compatibilite multi-modeles | x1 | 7.0 | GPT-4.1 only ici, prompt bien structure mais non teste Flux |
| 7 | Coherence I/O | x1 | 7.0 | Format portrait respecte, mais ratio legerement modifie (piece plus haute) |
| 8 | Richesse descriptive | x1 | 8.5 | furniturePrompt tres riche (silhouettes, dimensions, materiaux precis) |
| 9 | Adaptabilite conditions | x1 | 8.0 | Chantier brut avec personnes, cables, ballon — bien gere sauf ballon |
| 10 | Rendu final credible | x2 | 8.5 | Passerait pour une photo immobiliere pro, palette coherente, composition equilibree |

**Note ponderee #94 : ((6.5x2) + 8.0 + 8.5 + 8.0 + 7.5 + 7.0 + 7.0 + 8.5 + 8.0 + (8.5x2)) / 14 = 7.75/10**

---

## Generation #95 — Maximalist (chambre enfant)

### Contexte input

Photo IDENTIQUE a #94 : meme chantier brut, meme angle, meme eclairage. La meme image a ete soumise deux fois avec le meme style Maximalist mais un type de piece different (chambre enfant vs salon).

### Analyse output

**Transformation globale** : La piece a ete transformee en chambre d'enfant maximalist. Mur accent teal profond a droite, murs off-white a gauche, parquet sombre, poutres apparentes teintees brun fonce. Mobilier : lit simple avec couvre-lit patchwork multicolore, armoire decoree motif oriental, etagere coloree, petit bureau en bois, tapis persan + tapis rond floral. Lustre sculptural multicolore au plafond. Jouets (lapin en peluche, girafe), globe terrestre, livres.

**Preservation architecturale** :
- Angle de camera : bien respecte, meme orientation portrait, perspective coherente.
- Poutres au plafond : PRESERVEES et mises en valeur. Les poutres sont finies en brun fonce avec la geometrie 3D intacte. La structure des aretes est fidele a l'input. Excellent travail.
- Fenetre gauche : presente, meme position. CEPENDANT, une SECONDE fenetre a ete ajoutee au fond de la piece a gauche, la ou il n'y en avait pas dans l'input. C'est une hallucination de fenetre — defaut critique.
- Ouverture fond : comme pour #94, l'ouverture sombre du fond a ete eliminee.
- Ballon d'eau chaude : supprime (meme probleme que #94).
- Personnes : correctement supprimees.
- Art mural : un cadre accroche au mur teal + un cadre au mur lateral droit. Ceci viole la contrainte "no wall art" de la passe 2.

**Contraintes lumiere** :
- La direction lumineuse est globalement coherente (gauche vers droite) mais l'ajout de la fenetre secondaire cree une source lumineuse supplementaire qui n'existait pas.
- Leger warm shift visible : les murs off-white ont une teinte legerement plus chaude que l'input. Le parquet sombre a aussi un ton plus chaud.
- Les ombres portees du mobilier sont coherentes avec l'eclairage lateral gauche.

**Vocabulaire photo** :
- DOF profonde, tout est net. Coherent f/8 grand-angle.
- Grain photographique present mais un peu moins prononce que #94.
- Vignettage : assombrissement notable en bas et coins. Present.
- Rendu des textures : le patchwork du couvre-lit, le rotin du panier, la ceramique du globe — textures credibles.

**Rendu final** :
- Visuellement attrayant comme chambre d'enfant, palette maximalist (teal, multicolore, bois chaud).
- Le couvre-lit patchwork est une piece forte et stylistiquement juste pour le maximalist enfant.
- L'armoire decoree avec motif oriental est originale et distinctive.
- Les jouets (lapin, girafe) ajoutent du vecu — la piece ne fait pas "catalogue".
- La superposition de tapis (persan + rond floral) est maximalist sans etre chaotique.
- CEPENDANT le resultat est plus "chambre d'enfant illustree" que "photo immobiliere pro". La saturation est un cran trop poussee pour du listing immobilier.

**Problemes detectes** :
1. CRITIQUE : Fenetre hallucinee au fond gauche — l'input n'a qu'une fenetre, l'output en a deux
2. Ouverture du fond disparue — modification structurelle
3. Ballon d'eau chaude supprime — equipement fixe
4. Art mural (cadres accroches) — viole "no wall art" de la passe 2
5. Leger warm color shift sur les murs et le parquet
6. Saturation un cran trop poussee pour du photorealisme listing

### Grille de notation #95

| # | Critere | Poids | Note /10 | Commentaire |
|---|---------|-------|----------|-------------|
| 1 | Preservation architecturale | x2 | 5.0 | Poutres OK mais fenetre hallucinee + ouverture disparue + ballon supprime |
| 2 | Contraintes lumiere | x1 | 6.5 | Direction globale OK mais fenetre ajoutee = source parasite + leger warm shift |
| 3 | Vocabulaire photo | x1 | 7.5 | DOF profonde, grain present, mais saturation un peu poussee |
| 4 | Structure prompt | x1 | 7.0 | Le resultat reflete le style maximalist mais avec derivation chambre enfant non specifiee dans le furniturePrompt |
| 5 | Negative prompting | x1 | 5.0 | Fenetre hallucinee (defaut critique que le negative devrait bloquer) + wall art |
| 6 | Compatibilite multi-modeles | x1 | 7.0 | GPT-4.1 only, prompt non teste Flux |
| 7 | Coherence I/O | x1 | 7.0 | Format portrait respecte, dimensions correctes |
| 8 | Richesse descriptive | x1 | 8.0 | furniturePrompt riche, mais adaptation chambre enfant = le modele a interprete au-dela du prompt |
| 9 | Adaptabilite conditions | x1 | 7.0 | Chantier brut gere mais hallucination fenetre = echec d'adaptation |
| 10 | Rendu final credible | x2 | 7.0 | Attrayant visuellement mais sature, plus "illustration" que "photo pro", fenetre trahit l'IA |

**Note ponderee #95 : ((5.0x2) + 6.5 + 7.5 + 7.0 + 5.0 + 7.0 + 7.0 + 8.0 + 7.0 + (7.0x2)) / 14 = 6.61/10**

---

## Synthese comparative

| Critere | #94 (salon) | #95 (chambre enfant) | Delta |
|---------|:-----------:|:--------------------:|:-----:|
| Note globale | **7.75** | **6.61** | -1.14 |
| Preservation architecturale | 6.5 | 5.0 | -1.5 |
| Contraintes lumiere | 8.0 | 6.5 | -1.5 |
| Rendu final credible | 8.5 | 7.0 | -1.5 |

**Observation cle** : La meme image input produit des resultats significativement differents selon le roomType. La version salon (#94) est nettement superieure car le furniturePrompt maximalist du StylePicker est concu pour un salon. La version chambre (#95) force le modele a "inventer" un amenagement enfant non couvert par le prompt, ce qui entraine plus de derives (fenetre hallucinee, wall art, saturation).

---

## Plan d'amelioration

### P0 — Critique (a corriger avant production)

1. **Fenetre hallucinee en chambre enfant** : Le furniturePrompt maximalist ne mentionne pas de fenetre, mais le modele en ajoute une seconde quand il "imagine" une chambre d'enfant. La contrainte "same number of windows and doors" est dans le builder mais insuffisante.
   - **Action** : Renforcer dans le builder passe 2 : "Do NOT add any window that is not already visible in the input photo. If a wall has no window in the input, it stays solid in the output."
   - **Note** : ne pas formuler avec un comptage ("exactly N windows") car le modele ne sait pas compter. Formuler en termes de presence/absence par mur.

2. **Equipements fixes muraux supprimes** (ballon d'eau chaude, #94 et #95) : La directive EQUIPMENT_PRESERVATION liste "radiators, heaters, vents, thermostats, switches" mais pas les cumulus/ballons d'eau chaude.
   - **Action** : Ajouter "water heaters, boilers, hot water tanks" a EQUIPMENT_PRESERVATION dans route.ts.

### P1 — Haute priorite

3. **Ouverture du fond disparue** (les 2 generations) : L'ouverture/passage sombre visible au fond de l'input est systematiquement comblee par le mur accent. Le builder mentionne "windows and doors" mais un passage ouvert n'est ni l'un ni l'autre.
   - **Action** : Reformuler en "same number of windows, doors, and open passages/archways as input" dans les builders passe 1 ET passe 2.

4. **Wall art en passe 2** (#95) : Cadres accroches malgre "Freestanding objects only". Le modele interprete librement quand le style est maximalist et la piece est une chambre enfant.
   - **Action** : Ajouter explicitement "No frames on walls, no wall-mounted art, no shelves attached to walls" dans le builder passe 2 generique, juste apres "Freestanding objects only".

### P2 — Moyenne priorite

5. **Warm color shift** (#95) : Malgre "No warm tint or yellow cast", un shift subtil persiste sur les murs en chambre enfant.
   - **Action** : Le builder chambre specifique devrait renforcer : "Wall color and floor tone must match the pass 1 output exactly — no warming, no cooling."

6. **Saturation excessive** (#95) : Le rendu chambre enfant est plus "illustration" que "photo". Le grain et le vignettage sont presents mais la saturation globale trahit l'IA.
   - **Action** : Ajouter "Keep color saturation at natural photographic levels — do not boost vibrancy or punch" dans le DSLR_LINE.

### P3 — Amelioration

7. **furniturePrompt maximalist non adapte aux chambres** : Le prompt decrit un salon (canape 230cm, coffee table, tapis 200x300). Quand le roomType est "bedroom_children", le modele doit improviser entierement, ce qui cause la majorite des derives.
   - **Action** : Creer des furniturePrompts par type de piece pour chaque style, ou a minima un mapping roomType -> prompt override dans le builder.
   - **Impact** : Eviterait les derivations du modele et donnerait un resultat plus maitrise.

8. **Distorsion verticale legere** (#94) : La piece semble un cran plus haute que l'input.
   - **Action** : Verifier que le parametre size envoye a OpenAI correspond exactement au ratio de l'input. Si l'input est 3:4 et l'output force en 2:3, la compression horizontale relative cree une impression de hauteur.

---

## Recommandations transversales

- Le style **Maximalist** est l'un des plus exigeants pour le pipeline car il demande beaucoup de changements visuels (mur accent fort, mobilier dense, tapis superposes, accessoires multiples) — ce qui pousse le modele a "regenerer" plutot qu'"editer". La note moyenne de 7.18/10 est coherente avec cette difficulte.
- La **passe 1 semble correcte** sur les deux generations (poutres preservees, mur accent teal bien pose, parquet sombre installe) — les problemes viennent principalement de la **passe 2** (fenetre hallucinee, wall art, saturation, suppression equipements).
- Le **roomType "bedroom_children"** expose une faiblesse structurelle du pipeline : les furniturePrompts sont concus pour un salon et le modele doit improviser pour les autres types de piece, ce qui provoque systematiquement plus de derives.
- Les **poutres apparentes** sont bien preservees dans les deux generations — la directive CEILING_PRESERVATION fonctionne correctement sur ce cas.

---

## Handoff

**Destinataire** : @interior-architect (Yann Duval) pour audit croise stylistique
**Fichiers produits** : `/home/user/Architecture/docs/reviews/audit-visuel-latest-lucas.md`
**Decisions cles** :
- #94 Maximalist salon : 7.75/10 — solide, problemes mineurs de preservation (ouverture, ballon)
- #95 Maximalist chambre enfant : 6.61/10 — fenetre hallucinee, wall art non desire, saturation poussee
- P0 : renforcement anti-hallucination fenetre + equipements fixes (ballon eau chaude)
- P1 : preservation ouvertures/passages + wall art explicitement interdit
- P3 : creer furniturePrompts adaptes aux chambres pour chaque style
