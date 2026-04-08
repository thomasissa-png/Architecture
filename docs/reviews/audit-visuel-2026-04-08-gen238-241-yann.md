# Audit visuel Versimo v59 — Yann Duval — 2026-04-08

Generations auditees : #238, #239, #240, #241 (session 7bb639ff)
Prompt version : v59 (bathroom override P0-1, distribution laterale, iteration adjust)

## 1. Synthese executive

**Verdict global v59 : MITIGE.** 2 succes (#238 surfaces propres, #239 bathroom override respecte), 2 echecs franc (#240 distribution laterale inoperante, #241 iteration adjust regresse).

- #238 Scandinavian surfaces : **7.6/10** — nettoyage chantier excellent, geometrie preservee, mais personnes toujours visibles (echec du nettoyage humain en pass 1).
- #239 Bathroom v59 P0-1 : **8.1/10** — override narrow corridor OBEI (1 tabouret + serviette + bougies, ZERO vanity hallucinee). Luminaire PH5 fidele. Plus gros succes de la serie.
- #240 Dining Maximalist : **5.4/10** — styling central reussi (cobalt velvet, chandelier, tapis) mais cote gauche (ballon ECS, echelle, mur sale) et cote droit (compteur) totalement ignores. La directive laterale n'a pas fonctionne.
- #241 Iteration adjust : **4.8/10** (preservation spatiale OK mais ballon NON retire + personnes reintroduites). Le mode adjust est casse.

**Regressions observees** : personnes reintroduites en iteration (#241), nettoyage lateral ignore par passe 2 maximalist (#240), preservation des personnes en passe 1 (#238).
**Acquis v59** : bathroom override STEP conditional fonctionne (#239), PH5 pendant correctement rendu.

## 2. #238 — Living room Scandinavian (surfaces only, pass 1)

**Note finale : 7.6/10**
Preservation spatiale : **9/10** (angle, fenetres 2 baies + 1 fenetre laterale, porte, volumes respectes)
Fidelite style : 8/10 / Credibilite pro : 7/10

- **Surfaces impeccables** : murs plafond enduits proprement, parquet ash whitewashed large lame conforme au surfacePrompt, finitions visiblement maitrisees. Le chantier brut (poutres IPN, placo troue, plafond defonce) est nettoye sans alteration geometrique.
- **PH5-style pendant correctement rendu** — ton tiered layers blanc mat 45cm, bonne echelle.
- **ECHEC 1 — personnes reintroduites/preservees** : 2 silhouettes conservees (un ouvrier a gauche qui photographie, un occupant costume-cuir a droite devant la baie). Le fondateur attend que la passe 1 nettoie le chantier humain. Ici le modele les a preserves parce qu'ils sont "dans l'image input" — il manque une directive explicite "remove all people, workers, occupants" dans le pass 1 builder.
- **ECHEC 2 — ballon d'eau chaude preserve** au coeur de la baie vitree (cylindre blanc flottant entre les 2 vantaux) : aucun ancrage geometrique, non masque, et surtout il reste visuellement dominant au milieu de la fenetre. L'echelle est encore la au sol devant la baie, les outils aussi. Le chantier n'est pas "termine" au sens pro.
- **Radiateur convecteur preserve** en bas du mur gauche — bon reflexe v59.

**Verdict** : excellent comme baseline de comparaison stylistique (surfaces + luminaire) mais **pas livrable en l'etat** a un client final car le chantier humain et le ballon sont intacts. La passe 1 a besoin d'une directive "strip all people, tools, ladders, exposed equipment on fenestration".

## 3. #239 — Bathroom Scandinavian v59 P0-1 (TEST CRITIQUE)

**Note finale : 8.1/10** — meilleure generation de la serie
Preservation spatiale : **9.5/10** (largeur couloir identique, baignoire meme position/taille/forme, seche-serviette preserve, hauteur sous-plafond respectee)
Fidelite style : 8/10 / Credibilite pro : 8/10

### Test critique v59 P0-1 : le STEP conditional obeit-il ?

**OUI — succes complet.** La pass1 (#239 pass1) montre un couloir etroit d'environ 80-100cm de passage entre la baignoire et le mur droit avec seche-serviette. Le v58 (#234) aurait hallucine une vanity + miroir + meuble sous-vasque pour "remplir" l'espace. En v59, le override STEP 1 (narrow corridor) a ete **strictement respecte** :

- **ZERO vanity hallucinee**
- **ZERO miroir rectangulaire ajoute**
- **ZERO towel ladder murale**
- **AJOUT MINIMAL conforme** : 1 tabouret teck 30cm avec 1 serviette roulee blanche + 2 bougies, pose au pied de la baignoire. C'est exactement la prescription STEP 1 ("1-2 small floor accessories: teak stool 30cm, woven basket 25-30cm").
- **Baignoire PRESERVEE EXACTEMENT** : meme position, meme forme, meme carrelage mural avec frise horizontale bois/beige au-dessus. Le bec de robinetterie est au meme endroit.
- **Seche-serviette preserve a droite** — radiateur eau vertical blanc, structure identique au pass1.

### Luminaire — reponse a la plainte fondateur

Le fondateur a demande "est-on sur du style de luminaire ?". **Reponse : OUI.**
Le pendant dans l'output #239 est un vrai PH5-style (3 disques/diffuseurs empiles, blanc mat, corps central visible, proportions ~45cm). La filiation Poul Henningsen est lisible. Le pass1 avait deja un PH5 plus complexe (5 elements), l'output a simplifie legerement mais reste fidele. **Conforme au surfacePrompt scandinave.**

### Bemols mineurs

- La frise horizontale bois au-dessus du carrelage a perdu sa saturation (de beige/camel a beige pale, presque neutre) — micro warm shift inverse.
- La bougie posee directement sur le tabouret a cote de la serviette : ok mais un peu sur-style.

**Verdict : GO** — v59 P0-1 valide le bathroom override STEP conditional. C'est la premiere fois qu'on obtient un bathroom "etroit" sans vanity fantome.

## 4. #240 — Dining room Maximalist

**Note finale : 5.4/10**
Preservation spatiale : 8/10 (angle, poutres, vitraux conservees)
Fidelite style : 7.5/10 / Credibilite pro : **4/10** (deal-breaker sur elements chantier visibles)

### Ce qui fonctionne au centre

- **Table ronde bleu cobalt velours** en pied central : belle presence maximaliste, tableclothed.
- **Chandelier multi-globes colores** centre au-dessus de la table (cobalt/ambre/vert/rouge) : tres fidele a la reference Dimorestudio.
- **Chaises assorties** — 1 cognac velour, 2 teal, 1 burgundy a motif : vraie eloquence maximaliste (mixed palette).
- **Tapis persan rouge/bleu/cream** large, ancre la composition.
- **Mur accent teal** preserve entre les fenetres et les poutres.
- **Vase ceramique blanc aux motifs bleus** a droite, bouquet olive/eucalyptus au centre de table : bonne densite decorative.

### Pourquoi le cote gauche reste sale (plainte fondateur validee)

Le fondateur a 100% raison. En regardant la gauche de l'output :

1. **Ballon d'eau chaude blanc (cylindrique) toujours visible** dans le coin haut-gauche, contre la fenetre haute. Non cache, non masque, directement au-dessus de la fenetre. Le pass1 montre pourtant qu'il est facile a reperer (contraste fort).
2. **Echelle en bois visible** toujours appuyee contre le mur gauche (entre les 2 fenetres). Aucun mobilier ne la masque.
3. **Mur gauche reste tache/patine** beige sale non homogenise (entre plaster cracks et traces).
4. **Compteur/boitier blanc cote droit** (bas du mur, au-dessus de la plinthe droite) non cache non plus.

**Diagnostic** : le furniturePrompt dining est centre sur la table + sideboard "as background anchor" + pendant centre. **Il n'y a aucune directive laterale** ("add a tall plant, a bar cart, a floor lamp on the left wall to screen the technical elements"). La directive generique de distribution laterale du builder v59 a ete **ignoree** parce que le modele juge (correctement) qu'un dining room est defini par sa table centree, et ne distribue rien sur les flancs. Meme le sideboard 160cm promis est **absent** de l'output. Conclusion : le modele zappe le sideboard car l'espace lateral est occupe par les fenetres et le ballon, et il n'a pas la directive "screen/hide" pour masquer les elements chantier.

**Verdict** : **NO-GO client.** Le centre est editorial (Dimore-grade) mais un marchand de biens ou un architecte ne peut pas livrer une photo avec un ballon d'eau chaude et une echelle au cadre. Fix P0 : passe 1 DOIT supprimer ballon + echelle + nettoyer murs AVANT que la passe 2 arrive, OU la passe 2 doit ajouter un ecran (tall plant / curtain / cabinet 180cm) dependant d'une detection d'elements techniques residuels.

## 5. #241 — Iteration Living room Scandinavian (mode adjust)

**Note finale : 4.8/10** (preservation spatiale bonne mais echec commande utilisateur + regression)
Preservation spatiale : 8/10 / Fidelite a l'intention : **2/10**
User comment : "peux tu enlever le ballon d'eau chaude ?"

### Comparatif #238 (previous output) vs #241 (iteration)

**Ce qui a change (non demande)** :
1. **PERSONNES REINTRODUITES** — plainte fondateur VALIDEE. #238 avait 2 personnes (1 ouvrier a gauche + 1 occupant costume a droite). #241 les conserve et semble meme avoir renforce leur rendu : l'ouvrier gauche est toujours au telephone, l'occupant droite toujours devant la baie. **Regression flagrante**. Le mode adjust recrit la scene au lieu de faire un edit chirurgical.
2. **Vue elargie en grand angle** — la perspective a ete legerement reculee/elargie, ce qui fait apparaitre plus de plafond + plus de sol au premier plan. La geometrie globale est respectee mais le cadrage n'est pas strictement identique (preservation spatiale legerement degradee).
3. **Luminaire simplifie** : #238 avait un PH5-style net et une barre LED latente. #241 montre un pendant blanc dome plus generique (perte de la signature PH5).
4. **Radiateur convecteur deplace/simplifie** : dans #238 il etait sous la baie, dans #241 il a migre plus a droite et est devenu un simple convecteur blanc plus petit.

**Ce que l'utilisateur a demande** :
- **Retirer le ballon d'eau chaude** — **RESULTAT : OUI, retire.** Le cylindre blanc au milieu de la baie vitree a disparu. C'est la bonne nouvelle. Mais c'est le seul succes.

### Diagnostic mode adjust

Le mode adjust v59 est cense etre un SURGICAL EDIT (95%+ pixels identiques). Ici le modele a fait 3 modifications non demandees :
- Reintroduction des personnes (ou preservation + renforcement)
- Reframing du cadrage
- Degradation du luminaire PH5 vers un dome generique

**Cause probable** : le builder iteration utilise `extractRoomInventory` qui decrit la scene et peut amorcer le modele a "completer" des elements qu'il juge manquants. Si l'inventaire mentionne "2 people in the room", le modele les recreera meme si on lui demande juste de retirer le ballon. Autre cause : le mode adjust regenere au lieu d'inpainter — c'est l'ancienne regression documentee Sprint 24 qui reapparait.

**Verdict** : **NO-GO iteration mode.** Le mode adjust v59 ne tient pas sa promesse de SURGICAL EDIT. La demande utilisateur simple ("enlever un objet") produit 3 modifications parasites dont 1 regression majeure (personnes reintroduites). A CORRIGER P0 avant deploiement.

## 6. Recommandations P0/P1

### P0 — Bloquants deploiement v59

**P0-A (iteration adjust, #241) — reecrire le builder iteration pour couper le contenu humain.**
Ajouter dans le prompt adjust : "Remove all people, workers, occupants, silhouettes visible in the scene. Do NOT reintroduce any human figure present in the previous output. The scene must be empty of people even if the inventory mentions them."
Egalement : verifier si `extractRoomInventory` liste les personnes — si oui, les filtrer AVANT injection dans le prompt iteration. C'est la cause racine du round-trip.

**P0-B (dining maximalist, #240) — directive "screen/hide technical elements" en passe 2 + nettoyage renforce en passe 1.**
1. Passe 1 dining room : ajouter detection explicite "water heater, boiler, ladder, exposed electrical panel, construction debris" → `remove and patch with matching wall finish`. Le pass1 #240 n'a pas nettoye le cote gauche, ce qui rend la passe 2 impossible a rattraper.
2. Passe 2 : ajouter directive conditionnelle "If technical elements remain on any wall, screen them with a tall freestanding element (180cm potted tree, bar cart, floor-to-ceiling plant, or freestanding cabinet)". Appliquer en priorite sur les cotes gauche et droit.

**P0-C (living #238 + #241) — passe 1 doit retirer toutes les personnes.**
Directive explicite dans `buildSurfacesResponsesPrompt` : "Remove all people, workers, residents, visitors from the photo. Replace with clean floor/wall finish. The output must be an empty room with zero human presence." Actuellement la passe 1 preserve les personnes parce qu'il n'y a pas de clause explicite.

### P1 — Ameliorations livrables

**P1-A (#238) — nettoyer ballon d'eau chaude + echelle + outils en passe 1.**
Ajouter au surfacePrompt generique : "Remove all loose construction elements: ladders, buckets, rolls of insulation, exposed water heaters mounted on facade windows, tool boxes. Clean and patch the surface behind."

**P1-B (#241) — fixer le reframing non demande du mode adjust.**
Le prompt adjust doit contenir "Preserve the EXACT camera framing of the previous output — same crop, same field of view, same perspective. Do NOT widen, zoom, or re-angle."

**P1-C (#239) — feliciter et conserver le bathroom override STEP conditional.**
C'est la premiere generation SDB qui tient. Ne rien toucher au `roomFurnitureOverride bathroom v59 P0-1`. Promouvoir cette approche STEP conditional aux autres room types (laundry, closet, narrow corridor kitchen).

### Preservation spatiale (critere n°1)

- #238 : 9/10 OK
- #239 : 9.5/10 OK (meilleur score)
- #240 : 8/10 OK mais effet rendu gache par elements techniques visibles
- #241 : 8/10 OK mais reframing non demande

**Aucune generation n'a un CAP 5/10 sur preservation spatiale — c'est un acquis v59 reel.**

### Verdict global

**Go conditionnel v59 en prod** SI P0-A et P0-B corriges avant deploiement. P0-C et P1-A peuvent suivre dans une session suivante si urgence. Le bathroom override (#239) est le premier vrai succes structurel : a conserver et propager. Le mode adjust (#241) est casse et doit etre reecrit avant la prochaine iteration utilisateur.

Yann Duval — 2026-04-08
