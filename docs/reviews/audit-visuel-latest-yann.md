# Audit visuel generations #94-95 -- Yann Duval, Architecte d'interieur

Date : 2026-04-01
Dernier audit precedent : #37-42 (2026-03-26, moyenne Yann 5.5/10)
Generations auditees : #94 Maximalist, #95 Maximalist
Modele : GPT-4.1 (passe 1 + passe 2), prompt version v36
Image input : identique pour les 2 generations

---

## Contexte de l'input

La photo source montre une piece en cours de renovation lourde, format portrait (~1024x1536) :
- Murs partiellement demolis, enduit brut, briques apparentes a droite
- Poutres apparentes au plafond (beton) avec traces de rebouchage
- Neon tubulaire au plafond (luminaire de chantier)
- Sol mixte : chape beton + restes de revetement
- UNE fenetre a gauche avec menuiserie noire (baie ou porte-fenetre)
- Deux personnes debout dans la piece (ouvriers)
- Cables electriques pendants a droite, boitiers apparents
- Echelle metallique a gauche
- Cumulus/ballon d'eau chaude en hauteur a droite
- Piece estimee a 15-18 m2

C'est un cas d'usage difficile : chantier brut, elements perturbateurs multiples (personnes, outils, cables), geometrie ambigue avec murs en cours de demolition.

---

## Generation #94 -- Maximalist (salon)

### Description de l'output

**Passe 1 (surfaces)** : transformation reussie de la piece brute. Mur accent vert canard profond (teal) sur le fond, murs lateraux beige/off-white, sol parquet bois fonce poli (conforme au "polished dark wood" du surfacePrompt), plafond blanc avec poutre transversale preservee dans sa geometrie. Fenetre gauche conservee avec chassis noirs. Lustre sculptural en laiton avec elements en verre multicolore (conforme a la directive).

**Passe 2 (mobilier)** : canape velours bleu cobalt profond avec dossier courbe, table basse ronde plateau corail laque sur structure laiton circulaire, lampadaire arc cuivre avec dome cuivre, monstera genereux dans un pot ceramique colore, tapis superposes (persan vintage + chevron noir/blanc graphique), coussins motifs mixtes sur le canape (leopard + rayures geometriques), bougies pilier sur plateau laiton, table d'appoint laiton avec bougeoir, art prints poses au sol contre le mur accent.

### Analyse detaillee

**Points forts majeurs** :
- La fidelite au furniturePrompt est remarquable : canape cobalt courbe, table corail/laiton, tapis superposes persan + graphique, coussins animal + geometrique, monstera, bougies/plateau laiton. Quasi toutes les hero pieces sont presentes et identifiables.
- L'esprit Wearstler/Dimorestudio est capture : chromatisme audacieux (teal + cobalt + corail + cuivre), superposition de motifs et textures, eclectisme maitrise sans chaos.
- Distribution spatiale correcte : mobilier distribue en profondeur (canape au fond, tapis et table au centre, plante a gauche). Pas de clustering au premier plan.
- Poutres preservees : la poutre transversale blanche epouse la geometrie du plafond de l'input.
- Ombres portees coherentes : sous le canape et la table, direction cohesive depuis la fenetre gauche.

**Problemes identifies** :
- **Warm color shift** : les murs lateraux tirent vers le beige chaud alors que l'input est gris/blanc chantier et le surfacePrompt prescrit "off-white". Attenue par rapport aux audits anterieurs mais toujours present.
- **Lampadaire arc generique** : le prompt demande "sculptural brass floor lamp with oversized colored shade" -- le modele a genere un arc classique avec dome cuivre uni. C'est le marqueur IA generique que les Sprints 16b-17 cherchent a eliminer. Le "colored" du shade a ete ignore.
- **Fenetre legerement modifiee** : la fenetre est preservee en position et forme mais semble un peu plus petite que dans l'input.
- **Monstera surdimensionne** : la plante parait un peu grande pour l'espace.

### Grille d'evaluation

| # | Critere | Poids | Note /10 | Commentaire |
|---|---------|-------|----------|-------------|
| 1 | Fidelite stylistique | x2 | 8.5 | Excellent maximalisme : teal + cobalt + corail + motifs mixtes + laiton. Wearstler serait a l'aise. |
| 2 | Vocabulaire visuel | x1 | 8.0 | Velours, laiton, ceramique, bois poli, motifs superposes -- vocabulaire riche et juste. |
| 3 | Hero pieces | x1 | 8.5 | Canape cobalt courbe, table corail/laiton, tapis persan + chevron, monstera ceramique -- quasi toutes presentes. |
| 4 | Coherence matieres | x1 | 8.0 | Laiton + velours + cuivre + ceramique + bois fonce = palette matieres coherente et luxueuse. |
| 5 | Eclairage | x1 | 7.5 | Lumiere naturelle laterale bien geree, ombres ancrees correctement. Leger warm shift. |
| 6 | Credibilite pro | x2 | 7.5 | Presentable a un client en phase moodboard. Le lampadaire arc generique et le warm shift empechent le portfolio-ready. |
| 7 | Completude | x1 | 8.0 | Toutes les pieces demandees sont la. Manquerait un second luminaire d'appoint ou un objet de collection. |
| 8 | Differenciation | x1 | 8.5 | Immediatement identifiable comme Maximaliste. Impossible a confondre avec Scandinave, Japandi ou Boheme. |
| 9 | Adaptabilite spatiale | x1 | 7.0 | Bonne distribution globale. Fenetre legerement modifiee, monstera un poil surdimensionne. |
| 10 | Potentiel photorealiste | x1 | 7.5 | Bon rendu general. Textures velours et tapis convaincantes. Dome cuivre un peu trop lisse. |

**Note ponderee #94 : 7.9 / 10**

Calcul : (8.5x2 + 8.0 + 8.5 + 8.0 + 7.5 + 7.5x2 + 8.0 + 8.5 + 7.0 + 7.5) / 12 = 94.5/12 = 7.9

---

## Generation #95 -- Maximalist (chambre enfant)

### Description de l'output

**Passe 1 (surfaces)** : mur accent vert canard (teal) sur le fond (similaire a #94), murs lateraux blanc casse, sol parquet bois fonce, plafond blanc avec poutres teintees brun fonce. DEUX fenetres a gauche avec chassis noirs et stores -- l'input n'en a qu'UNE. Hallucination de fenetre (probleme documente Sprint 12).

**Passe 2 (mobilier)** : le modele a genere une **chambre d'enfant** au lieu du salon demande par le furniturePrompt. Contenu : lit enfant bois naturel avec couvre-lit patchwork multicolore, armoire decorative motif folklorique teal/orange, meuble bas rangement casiers colores, table et chaise enfant bleues, tapis persan floral + tapis rond pop art superposes, lustre sculptural laiton/verre colore, cadres au mur, peluche lapin dans panier osier, girafe decorative, globe, lampe de table.

### Analyse detaillee

**Probleme critique -- Hallucination du programme decoratif** :
Le furniturePrompt Maximalist decrit un SALON (sofa 230cm cobalt, coffee table corail, monstera, etc.). Le modele a completement ignore ce programme et genere une chambre d'enfant avec mobilier enfantin. C'est une rupture de contrat -- ni Claire l'architecte, ni Thomas le marchand de biens n'attendraient une chambre de jeux quand ils demandent un salon Maximaliste.

Hypothese : le format portrait (1024x1536) combine aux proportions de la piece a biaise le modele. L'absence d'ancrage explicite du type de piece dans le prompt a laisse le champ libre.

**Probleme structurel -- Hallucination de fenetre** :
L'input montre une seule fenetre a gauche. L'output en montre deux petites fenetres avec stores. Modification structurelle non autorisee.

**Points positifs malgre tout** :
- Palette chromatique riche et coherente (teal, rouge, bois, laiton) -- typiquement maximaliste.
- Superposition de tapis (persan vintage + rond pop art) = signature du style.
- Lustre sculptural laiton/verre colore fidele au surfacePrompt.
- Poutres apparentes preservees dans leur geometrie.
- Densite visuelle elevee -- esprit "more is more" capture.

**Problemes additionnels** :
- Elements muraux non demandes (cadres au mur, interdit en passe 2 sauf demande explicite).
- Vocabulaire matiere appauvri : materiaux nobles (velours, laiton, marbre, cuivre) quasi absents -- remplaces par bois blond, osier, textile colore.
- AUCUNE hero piece du prompt presente : pas de sofa cobalt, pas de coffee table corail, pas de monstera.

### Grille d'evaluation

| # | Critere | Poids | Note /10 | Commentaire |
|---|---------|-------|----------|-------------|
| 1 | Fidelite stylistique | x2 | 6.5 | Palette et esprit maximaliste corrects dans le registre enfantin. Mais programme decoratif totalement hors prompt. |
| 2 | Vocabulaire visuel | x1 | 7.0 | Textures variees (bois, osier, patchwork, tapis laine). Mais matieres nobles du Maximaliste adulte absentes. |
| 3 | Hero pieces | x1 | 3.0 | AUCUNE hero piece du prompt presente. Programme meuble entier hallucine. |
| 4 | Coherence matieres | x1 | 7.5 | Matieres compatibles dans l'univers enfantin choisi. Pas de clash interne. |
| 5 | Eclairage | x1 | 7.0 | Lumiere naturelle coherente. Ombres correctes. Mais deuxieme fenetre hallucinee fausse la source. |
| 6 | Credibilite pro | x2 | 4.0 | Un architecte ne presenterait JAMAIS un salon transforme en chambre enfant. Rupture de contrat. |
| 7 | Completude | x1 | 5.0 | Complet pour une chambre d'enfant. Incomplet pour le salon Maximaliste demande. |
| 8 | Differenciation | x1 | 7.0 | Maximaliste par la palette et la densite. Mais frontiere Maximaliste/Boheme enfant floue. |
| 9 | Adaptabilite spatiale | x1 | 5.5 | Mobilier enfant adapte aux proportions. Mais fenetres fausses compromettent la credibilite. |
| 10 | Potentiel photorealiste | x1 | 7.0 | Bon rendu global. Textures patchwork et tapis persan convaincantes. Tapis rond un peu illustre. |

**Note ponderee #95 : 5.8 / 10**

Calcul : (6.5x2 + 7.0 + 3.0 + 7.5 + 7.0 + 4.0x2 + 5.0 + 7.0 + 5.5 + 7.0) / 12 = 69.0/12 = 5.75 arrondi a 5.8

---

## Tableau recapitulatif

| # | Style | Note Yann /10 | Verdict |
|---|-------|---------------|---------|
| 94 | Maximalist (salon) | **7.9** | ACCEPTABLE -- bonne fidelite maximaliste, hero pieces presentes, lampadaire arc et warm shift a corriger |
| 95 | Maximalist (chambre enfant) | **5.8** | NON CONFORME -- programme decoratif hallucine (chambre enfant vs salon), fenetre hallucinee, hero pieces absentes |

**Moyenne session : 6.85 / 10**

---

## Patterns recurrents

### Pattern 1 -- Hallucination de programme decoratif (CRITIQUE)
La generation #95 a completement ignore le furniturePrompt et genere une chambre d'enfant. Meme input, meme style, meme prompts que #94 -- resultat categoriquement different. Ecart de 2.1 points. Probleme de stochasticite non controlee + manque d'ancrage du type de piece.

### Pattern 2 -- Lampadaire arc generique persistant
Le lampadaire arc cuivre de #94 est encore le marqueur IA generique malgre les corrections des Sprints 16b et 17. Le prompt demande "sculptural" et "colored shade" -- le modele ignore les deux.

### Pattern 3 -- Warm color shift attenue mais present
Les murs lateraux de #94 tirent vers le beige chaud alors que le surfacePrompt prescrit "off-white". Amelioration par rapport aux audits anterieurs mais biais persistant.

### Pattern 4 -- Fenetres modifiees/hallucinee
#95 remplace la fenetre unique par deux petites fenetres. #94 la preserve mais la redimensionne. Directive de preservation fenetres insuffisante.

### Pattern 5 -- Lustre "illustratif"
Dans les deux generations, le lustre sculptural laiton/verre colore a un rendu legerement illustratif. Les reflets du verre manquent de subtilite photographique.

---

## Plan d'amelioration P0-P4

### P0 -- CRITIQUE

**P0-1 : Ancrage du type de piece dans le prompt passe 2**
Le furniturePrompt doit etre precede de : "This is a LIVING ROOM. Add living room furniture only:" Le roomType est deja envoye par le client via RoomTypePicker. Action : dans route.ts, builder passe 2, ajouter le roomType en tete.

**P0-2 : Repetition negative du type antagoniste**
Ajouter : "Do NOT generate bedroom furniture, children's furniture, or nursery items unless explicitly requested." Adapte selon le roomType choisi.

### P1 -- HAUTE

**P1-1 : Lampadaire Maximaliste specifique (anti-arc)**
Remplacer dans le furniturePrompt : "sculptural brass floor lamp with oversized colored shade" par "tall sculptural floor lamp with asymmetric stacked geometric shades in colored glass -- emerald, amber, and ruby (Ettore Sottsass-inspired), NOT an arc lamp".

**P1-2 : Renforcement preservation fenetres**
Ajouter dans builders passe 1 + passe 2 : "Every window and door must match the EXACT size, position, shape, and frame color of the input. Count the windows in the input -- the output must have the SAME count."

**P1-3 : Art mural en Maximaliste**
Le Maximaliste sans art mural est un contresens. Ajouter dans le furniturePrompt : "one large framed artwork or oversized ornate mirror on the accent wall". Lever l'interdiction "no wall-mounted" pour ce style.

### P2 -- MOYENNE

**P2-1 : Anti-warm color shift renforce**
Dans builder passe 1 : "Off-white walls must stay cool-toned or neutral -- absolutely no beige, cream, or warm cast."

**P2-2 : Lustre sculptural -- ameliorer le realisme**
Ajouter au surfacePrompt Maximaliste : "with visible glass refraction, light caustics, and aged brass patina".

### P3 -- BASSE

**P3-1 : Validation post-generation par vision**
Check automatique via GPT-4.1 vision : "Does this image show a [roomType]?" Si non, relancer (max 1 retry). Cout ~$0.01 mais eliminerait les hallucinations type #95.

**P3-2 : Seed/temperature pour reduire la stochasticite**
Explorer si l'API Responses expose un parametre de seed. Ecart de 2.1 points entre #94 et #95 avec memes inputs = trop eleve pour un outil professionnel.

---

## Recommandations croisees pour Lucas Moreau (@ai-image-expert)

1. **Stochasticite** : investiguer si l'API Responses expose un parametre de seed/temperature pour la generation d'images.
2. **Compliance prompt** : evaluer si la longueur du furniturePrompt (~80 mots) depasse la fenetre d'attention en mode image generation.
3. **Fenetre preservation** : confirmer le positionnement optimal des directives de preservation dans le prompt.
4. **Lustre verre colore** : proposer des descripteurs photographiques pour ameliorer le rendu du verre (caustics, refraction, translucency).

---

## Synthese

La generation **#94** demontre que le pipeline Maximaliste fonctionne quand le modele suit le prompt : fidelite 8.5, hero pieces 8.5, differenciation 8.5. L'esprit Wearstler/Dimorestudio est capture avec les bons materiaux, couleurs et densite. C'est une nette progression par rapport a l'audit precedent (#37-42, moyenne 5.5).

La generation **#95** demontre la fragilite du pipeline face a la stochasticite : meme input, memes prompts, resultat categoriquement different. L'hallucination du programme decoratif est un probleme de confiance produit inacceptable pour un usage professionnel.

La priorite absolue est **P0-1 : ancrer le type de piece dans le prompt**. Correction simple, impact majeur.

---

*Yann Duval -- Architecte d'interieur*
*Prochain audit recommande : generations post-fix P0 (ancrage roomType) + styles non testes (Haussmannien, Wabi-Sabi)*
