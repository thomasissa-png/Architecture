# Audit visuel generations #94-95 — Yann Duval, Architecte d'interieur

Date : 2026-04-01
Dernier audit precedent : #37-42 (2026-03-26, moyenne Yann 5.5/10)
Generations auditees : #94 Maximalist, #95 Maximalist
Image input : identique pour les 2 generations (piece en chantier brut, format portrait 1024x1536)

---

## Contexte de l'input

La photo source montre une piece en cours de demolition/renovation lourde :
- Murs partiellement demolis, enduit brut, briques apparentes a droite
- Poutres apparentes au plafond avec traces de rebouchage
- Neon tubulaire au plafond (luminaire de chantier)
- Sol mixte : chape beton + restes de parquet
- Fenetre a gauche avec menuiserie noire (baie coulissante ou porte-fenetre)
- Deux personnes debout dans la piece (ouvriers)
- Cables electriques pendants a droite, boitiers apparents
- Echafaudage/echelle metallique a gauche
- Cumulus/ballon d'eau chaude en hauteur a droite

C'est un cas d'usage difficile : chantier brut, elements perturbateurs multiples (personnes, outils, cables), geometrie ambigue (murs demolis).

---

## Generation #95 — Maximalist (chambre enfant)

### Description de l'output

Le modele a genere une chambre d'enfant maximaliste avec :
- Mur accent teal profond (mur du fond) + murs lateraux blancs casses
- Sol parquet bois fonce
- Poutres apparentes au plafond, teintees brun fonce, geometrie PRESERVEE
- Lustre sculptural en laiton avec elements en verre colore (coherent avec surfacePrompt)
- Lit enfant en bois naturel avec couvre-lit patchwork multicolore
- Armoire decorative avec motif folklorique sur fond teal
- Meuble bas de rangement rouge/bois/motifs geometriques
- Table et chaise enfant en bois bleu
- Tapis persan a motifs floraux multicolores superpose a un tapis rond pop art
- Peluche lapin dans un panier en osier
- Cadres et art prints au mur
- Petite girafe decorative, globe, lampe de table

### Problemes identifies

1. **Chambre enfant non demandee** : le furniturePrompt decrit un SALON (sofa 230cm, coffee table, monstera). Le modele a genere une chambre d'enfant — c'est une hallucination complete du programme decoratif. Le modele a probablement interprete l'espace comme une chambre en raison des proportions portrait et a ignore le prompt mobilier.

2. **Fenetre gauche disparue** : la fenetre/porte-fenetre avec menuiserie noire visible dans l'input a ete remplacee par deux petites fenetres carrees avec stores. C'est une modification structurelle non autorisee.

3. **Proportions de la piece modifiees** : l'input montre une piece rectangulaire avec profondeur moderee. L'output semble plus profond et plus regulier — la geometrie a ete "nettoyee" au-dela du necessaire.

4. **Elements muraux non demandes** : cadres au mur, alors que le pipeline interdit les wall-mounted sauf demande explicite.

5. **Cumulus/cables/personnes** : correctement supprimes (attendu en passe 1).

### Points forts

- Palette chromatique riche et coherente (teal, rouge, bois, laiton) — typiquement maximaliste
- Superposition de tapis = signature du style (mixte vintage + contemporain)
- Lustre sculptural en laiton/verre colore fidele au surfacePrompt
- Poutres apparentes preservees dans leur geometrie (meme si teintees trop proprement)
- Densite visuelle elevee — l'esprit "more is more" est capture

### Grille d'evaluation

| # | Critere | Poids | Note /10 | Commentaire |
|---|---------|-------|----------|-------------|
| 1 | Fidelite stylistique | x2 | 6.5 | Palette et esprit maximaliste corrects, MAIS programme decoratif totalement hors prompt (chambre enfant vs salon) |
| 2 | Vocabulaire visuel | x1 | 7.0 | Bons materiaux (velours, bois, laiton, ceramique), textures variees |
| 3 | Hero pieces | x1 | 3.0 | AUCUNE hero piece du prompt presente : pas de sofa cobalt, pas de coffee table corail, pas de monstera |
| 4 | Coherence matieres | x1 | 7.5 | Les matieres sont compatibles entre elles dans l'univers choisi |
| 5 | Eclairage | x1 | 7.0 | Lumiere naturelle coherente, ombres correctes, pas de HDR artificiel |
| 6 | Credibilite pro | x2 | 4.0 | Un architecte ne presenterait JAMAIS un salon transforme en chambre enfant. Rupture de contrat |
| 7 | Completude | x1 | 5.0 | Complet pour une chambre enfant, mais c'est la mauvaise piece |
| 8 | Differenciation | x1 | 7.0 | Clairement maximaliste, pas confondable avec un autre style |
| 9 | Adaptabilite spatiale | x1 | 5.5 | Le mobilier enfant est adapte a l'espace, mais les fenetres sont fausses |
| 10 | Potentiel photorealiste | x1 | 7.0 | Bon rendu global, quelques textures un peu "illustrees" (patchwork, tapis rond) |

**Note ponderee : 5.8/10**

Calcul : (6.5x2 + 7.0 + 3.0 + 7.5 + 7.0 + 4.0x2 + 5.0 + 7.0 + 5.5 + 7.0) / 12 = 69.0/12 = 5.75 arrondi a 5.8

---

## Generation #94 — Maximalist (salon)

### Description de l'output

Le modele a genere un salon maximaliste avec :
- Mur accent teal profond (mur du fond) + murs lateraux beige/off-white
- Sol parquet bois fonce
- Poutres blanches au plafond, geometrie preservee (poutre transversale visible)
- Lustre sculptural laiton/verre colore (similaire a #95)
- Canape velours bleu cobalt profond avec dossier courbe et pieds laiton
- Table basse ronde corail laquee sur cadre laiton circulaire
- Lampadaire arc en cuivre/laiton avec dome cuivre
- Monstera dans un pot ceramique colore
- Tapis superposes : persan vintage + graphique chevron noir/blanc
- Coussins : motif animal + rayures geometriques sur le canape
- Art prints poses au sol contre le mur
- Bougies piliers sur plateau laiton sur la table basse
- Table d'appoint laiton/marbre avec livres et bougeoir

### Problemes identifies

1. **Fenetre gauche modifiee** : la fenetre/porte-fenetre de l'input est preservee en position mais redimensionnee (plus petite, plus carree). C'est mieux que #95 mais pas fidele.

2. **Warm color shift** : les murs lateraux ont vire du blanc chantier vers un beige chaud. La directive "do not add warm tint" n'a pas tenu.

3. **Lampadaire arc cuivre** : le prompt demande "sculptural brass floor lamp with oversized colored shade". Le modele a genere un arc classique avec dome cuivre — c'est le marqueur IA generique que tous les sprints precedents cherchent a eliminer. Le shade n'est pas "colore" non plus.

4. **Elements muraux** : 2-3 prints poses au sol contre le mur + un cadre accroche a droite. Les prints au sol sont autorises (mentionnes dans le prompt). Le cadre mural est limite mais mineur.

5. **Echelle monstera** : la plante semble un peu surdimensionnee par rapport a l'espace.

### Points forts

- **Fidelite au prompt remarquable** : canape cobalt courbe, table basse corail/laiton, tapis superposes persan + graphique, coussins animal + geometrique, monstera, bougies/plateau laiton. Quasi toutes les hero pieces sont presentes.
- **Distribution spatiale** : mobilier distribue en profondeur (canape au fond, tapis et table au centre, plante a gauche). Pas de clustering premier plan.
- **Mur accent teal** : coherent avec le surfacePrompt, applique sur le bon mur.
- **Poutres preservees** : les poutres blanches epousent la geometrie du plafond de l'input.
- **Ombres coherentes** : ombres portees sous le canape et la table, direction de lumiere depuis la fenetre gauche.
- **Densite et superposition** : l'esprit Wearstler/Dimorestudio est la — couches de motifs, chromatisme audacieux, eclectisme maitrise.

### Grille d'evaluation

| # | Critere | Poids | Note /10 | Commentaire |
|---|---------|-------|----------|-------------|
| 1 | Fidelite stylistique | x2 | 8.5 | Excellent maximalisme : teal + cobalt + corail + motifs mixtes + laiton. Wearstler serait a l'aise |
| 2 | Vocabulaire visuel | x1 | 8.0 | Velours, laiton, ceramique, bois poli, motifs superposes — vocabulaire riche et juste |
| 3 | Hero pieces | x1 | 8.5 | Canape cobalt courbe, table corail/laiton, tapis persan + chevron, monstera ceramique — toutes presentes |
| 4 | Coherence matieres | x1 | 8.0 | Laiton + velours + cuivre + ceramique + bois fonce = palette matieres coherente et luxueuse |
| 5 | Eclairage | x1 | 7.5 | Lumiere naturelle bien geree, leger warm shift mais ombres ancrees correctement |
| 6 | Credibilite pro | x2 | 7.5 | Presentable a un client. Le lampadaire arc generique et le warm shift sont les faiblesses. Pas encore portfolio-ready |
| 7 | Completude | x1 | 8.0 | Toutes les pieces demandees sont la. Il manquerait un second luminaire ou un objet de collection |
| 8 | Differenciation | x1 | 8.5 | Immediatement identifiable comme maximaliste, impossible a confondre avec Scandinave ou Japandi |
| 9 | Adaptabilite spatiale | x1 | 7.0 | Bonne distribution. Fenetre legerement modifiee, monstera un peu gros |
| 10 | Potentiel photorealiste | x1 | 7.5 | Bon rendu general. Les textures des tapis et du velours sont convaincantes. Le dome cuivre est un peu lisse |

**Note ponderee : 7.9/10**

Calcul : (8.5x2 + 8.0 + 8.5 + 8.0 + 7.5 + 7.5x2 + 8.0 + 8.5 + 7.0 + 7.5) / 12 = 94.5/12 = 7.875 arrondi a 7.9

---

## Tableau recapitulatif

| # | Style | Format | Duree | Yann /10 | Verdict |
|---|-------|--------|-------|----------|---------|
| 95 | Maximalist | 1024x1536 | 157s | 5.8 | NON CONFORME — programme decoratif hallucine (chambre enfant vs salon) |
| 94 | Maximalist | 1024x1536 | 147s | 7.9 | ACCEPTABLE — bonne fidelite maximaliste, quelques faiblesses mineures |

**Moyenne session : 6.85/10** (tiree vers le bas par l'hallucination #95)

---

## Patterns recurrents

### Pattern 1 — Hallucination de programme decoratif (CRITIQUE)

La generation #95 a completement ignore le furniturePrompt (salon) et genere une chambre d'enfant. Ce n'est pas un probleme de style mais de **compliance au prompt**. Le modele a "decide" que l'espace convenait a une chambre et a genere un mobilier enfant complet. Ce type d'hallucination est le pire scenario pour un outil professionnel — Claire ou Thomas ne peuvent pas envoyer une chambre d'enfant quand ils demandent un salon.

Hypothese : le format portrait (1024x1536) + les proportions de la piece ont pu biaiser le modele vers une chambre. Les 2 generations utilisent la meme image input, meme style, meme prompts — et produisent des resultats radicalement differents. C'est un probleme de **stochasticite non controlee**.

### Pattern 2 — Lampadaire arc generique persistant

Malgre les corrections des Sprints 16b, 17, et 17b, le lampadaire arc cuivre de #94 est encore un marqueur IA generique. Le prompt demande "sculptural brass floor lamp with oversized colored shade" — le modele a traduit ca en arc classique avec dome cuivre uni. Le "colored" du shade a ete ignore.

### Pattern 3 — Warm color shift attenue mais present

Les murs lateraux de #94 tirent vers le beige chaud alors que l'input est gris/blanc chantier et le surfacePrompt dit "off-white". C'est une amelioration par rapport aux audits precedents (moins prononce) mais le biais persiste.

### Pattern 4 — Fenetres modifiees

Les deux generations modifient les fenetres de l'input. #95 les remplace completement (2 petites fenetres carrees). #94 les preserve mieux mais redimensionne. La directive de preservation fenetres n'est pas assez forte.

### Pattern 5 — Stochasticite entre generations identiques

Meme input, meme style, meme prompts, 10 secondes d'ecart — et les resultats vont de 5.8 a 7.9. C'est un ecart de 2.1 points qui rend le produit imprevisible. Un client qui relance la generation ne devrait pas obtenir un resultat categoriquement different (salon vs chambre enfant).

---

## Plan d'amelioration P0-P4

### P0 — CRITIQUE (a corriger immediatement)

**P0-1 : Ancrage du type de piece dans le prompt passe 2**

Le furniturePrompt doit etre precede d'un ancrage explicite du type de piece : "This is a LIVING ROOM. Add the following living room furniture:". Actuellement, le prompt decrit le mobilier mais ne nomme jamais la piece, laissant le modele "deviner" — et parfois halluciner.

Action : dans `route.ts`, builder passe 2, ajouter en tete : `This is a [roomType]. Add [roomType] furniture only:` avant l'injection du furniturePrompt. Le roomType est deja envoye par le client (RoomTypePicker).

**P0-2 : Repetition negative du type de piece antagoniste**

Apres l'ancrage positif, ajouter : "Do NOT generate bedroom furniture, children's furniture, or nursery items unless the style explicitly requests it." (adapte selon le roomType choisi).

### P1 — HAUTE

**P1-1 : Lampadaire maximaliste specifique**

Remplacer dans le furniturePrompt Maximaliste :
- Ancien : "sculptural brass floor lamp with oversized colored shade"
- Nouveau : "tall sculptural floor lamp with asymmetric stacked geometric shades in colored glass — emerald, amber, and ruby (Ettore Sottsass-inspired), NOT an arc lamp"

L'ajout "NOT an arc lamp" est necessaire car c'est le defaut du modele.

**P1-2 : Renforcement preservation fenetres**

Dans builder passe 1 ET passe 2, ajouter : "Every window and door must match the EXACT size, position, shape, and frame color of the input photo. Do not resize, add, or remove any window or door."

### P2 — MOYENNE

**P2-1 : Seed ou temperature pour reduire la stochasticite**

Explorer si l'API Responses permet un parametre de seed ou temperature pour reduire la variance entre generations identiques. Si disponible, fixer un seed par defaut (overridable par l'utilisateur via un bouton "Regenerer different").

**P2-2 : Warm color shift — renforcement negatif**

Dans builder passe 1, transformer la directive existante en formulation plus forte : "The off-white walls must stay cool-toned or neutral — absolutely no beige, cream, or warm cast. Match the color temperature of the input photo's walls."

### P3 — BASSE

**P3-1 : Validation post-generation par vision**

Envisager un check automatique post-generation via GPT-4.1 vision : "Does this image show a [roomType]? Does it contain [hero piece 1], [hero piece 2]?" Si la reponse est non, relancer la generation (max 1 retry). Cout additionnel ~$0.01 par check, mais eliminerait les hallucinations type #95.

---

## Recommandations croisees pour Lucas Moreau (@ai-image-expert)

1. **Stochasticite** : investiguer si le provider OpenAI Responses API expose un parametre de seed/temperature pour la generation d'images. Si oui, recommander une valeur par defaut.
2. **Compliance prompt** : evaluer si la longueur du furniturePrompt (~80 mots) depasse la fenetre d'attention effective du modele en mode image generation. Les derniers tokens (accents, bougies) sont peut-etre les mieux respectes alors que les premiers (canape, table) sont ignores dans #95.
3. **Fenetre preservation** : confirmer si les directives de preservation fenetre sont dans la bonne position du prompt (debut vs fin) pour maximiser leur poids.

---

## Synthese

La generation #94 demontre que le pipeline 2 passes Maximaliste **fonctionne** quand le modele suit le prompt : fidelite stylistique 8.5, hero pieces 8.5, differenciation 8.5. C'est l'une des meilleures generations Maximaliste que j'ai vues — l'esprit Wearstler/Dimorestudio est capture avec les bons materiaux, les bonnes couleurs, la bonne densite.

La generation #95 demontre que le pipeline est **fragile** face a la stochasticite du modele : meme input, meme prompts, resultat categoriquement different. L'hallucination du programme decoratif (chambre enfant au lieu de salon) est un probleme de confiance produit — un professionnel comme Thomas ne peut pas se permettre ce risque sur une plaquette commerciale.

La priorite absolue est P0-1 : ancrer le type de piece dans le prompt. C'est une correction simple (quelques lignes dans route.ts) qui devrait eliminer cette classe d'hallucinations.

---

Prochain audit prevu : generations post-fix P0 (ancrage roomType)
