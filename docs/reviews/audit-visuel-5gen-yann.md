# Audit visuel generations #91-93 -- Yann Duval, Architecte d'interieur

Date : 2026-04-01
Dernier audit precedent : #94-95 (2026-04-01)
Generations auditees : #91 Scandinavian kitchen, #92 Contemporary kitchen, #93 Custom WC
Modele : GPT-4.1 (passe 1 + passe 2), prompt version v36

Grille d'evaluation ajustee (preservation spatiale x3, CAP < 7 = note max 5) :

| # | Critere | Poids |
|---|---------|-------|
| 1 | Preservation spatiale | x3 |
| 2 | Fidelite stylistique | x2 |
| 3 | Eclairage | x1 |
| 4 | Hero pieces | x1 |
| 5 | Coherence matieres | x1 |
| 6 | Credibilite pro | x2 |
| 7 | Completude | x1 |
| 8 | Vocabulaire visuel | x1 |
| 9 | Adaptabilite spatiale | x1 |
| 10 | Potentiel photorealiste | x1 |
Denominateur = 14.

---

## Generation #91 -- Scandinavian kitchen

### Contexte input

Piece en chantier brut, format paysage. Plaques de platre vertes (hydrofuges, confirme l'usage cuisine/piece humide) sur les murs, plafond en BA13 rose avec spots en attente (4-5 percages). Deux grandes fenetres a gauche avec menuiserie blanche PVC, radiateur sous allege. Arrivees d'eau visibles en bas du mur du fond (cuivre + PER bleu/rouge). Sol chape noire brute. Porte ouverte a droite donnant sur un couloir. Piece estimee a 10-12 m2, format quasi carre. Hauteur sous plafond standard (~2.50m).

C'est un cas d'usage classique pour Versimo : chantier en cours de second oeuvre, placo pose, attentes techniques visibles. Le client veut visualiser sa future cuisine.

### Analyse preservation spatiale (x3)

**Note : 8/10** -- Pas d'alerte CAP.

Points positifs :
- Angle de prise de vue IDENTIQUE -- meme perspective legere plongee depuis le coin gauche
- Les DEUX fenetres a gauche sont preservees avec leur menuiserie blanche, meme proportions, meme position sur le mur
- La porte a droite est conservee, au bon emplacement, avec un encadrement coherent
- Le volume de la piece est respecte : meme profondeur, meme largeur perceptible
- Le plafond est plat comme dans l'input (pas de voute inventee)
- Le radiateur sous fenetre a disparu -- ACCEPTABLE car en cuisine renovee, le chauffage est souvent integre ou deplace

Points negatifs :
- Le mur de gauche (sous les fenetres) semble legerement plus court qu'en input -- le retour mural est moins prononce
- Le plafond input avait des percages de spots visibles -- l'output installe un pendant central (PH5-style) au lieu de spots, ce qui est un choix stylistique coherent mais les attentes de spots existantes auraient pu etre exploitees
- Legerement idealisee dans les proportions : le plan de travail/ilot s'integre parfaitement mais la piece semble un poil plus grande qu'en realite

### Grille complete

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale (x3) | 8/10 | Angle, fenetres, porte, volume preserves. Radiateur disparu (acceptable). Leger elargissement percu. |
| 2 | Fidelite stylistique (x2) | 8.5/10 | Scandinave exemplaire : bois clair (bouleau/frene), blanc dominant, minimalisme, luminaire PH5-style. Manque juste un element textile (torchon lin, coussin tabouret). |
| 3 | Eclairage (x1) | 8/10 | Lumiere naturelle douce coherente avec les fenetres input. Ombre portee au sol de l'ilot credible. Pas de warm shift excessif. |
| 4 | Hero pieces (x1) | 8/10 | Luminaire PH5-style tiered pendant = ancrage stylistique fort. Tabourets bleus acier = accent chromatique typique nordic. Four encastre credible. Manque une piece plus iconique (tabouret CH88, chaise Wishbone). |
| 5 | Coherence matieres (x1) | 9/10 | Bois clair + blanc mat + metal noir (robinetterie) + bleu acier (tabourets) + boucle creme (pouf). Palette tres coherente, zero dissonance. |
| 6 | Credibilite pro (x2) | 8/10 | Un architecte pourrait montrer ce rendu a un client pour valider la direction cuisine scandinave. Les proportions de l'ilot sont credibles (~120cm), les meubles hauts bien calibres. Le pouf en cuisine est discutable (pas fonctionnel). |
| 7 | Completude (x1) | 7/10 | Cuisine fonctionnelle : evier, four, plan de travail, rangement haut. Manque : hotte aspirante (indispensable en cuisine), plaque de cuisson visible, eclairage sous meubles hauts. |
| 8 | Vocabulaire visuel (x1) | 8/10 | Palette nordique respectee (blanc, bois clair, accent bleu, gris chaud). Textures lisibles : bois grain visible, boucle du pouf, metal mat. Accessoires de styling presents (planche a decouper, plantes aromatiques, corbeille de fruits). |
| 9 | Adaptabilite spatiale (x1) | 8/10 | L'ilot avec 3 tabourets est bien proportionne pour une piece de 10-12 m2. Les meubles hauts occupent un seul mur (pas de surcharge). Circulation autour de l'ilot credible. |
| 10 | Potentiel photorealiste (x1) | 7.5/10 | Bon rendu general, textures credibles. Le grain photo est present mais leger. Les reflets sur le plan de travail sont un peu trop uniformes. Le pouf semble legerement "pose" sans ancrage au sol. |

### Note finale

Calcul : (8x3 + 8.5x2 + 8 + 8 + 9 + 8x2 + 7 + 8 + 8 + 7.5) / 14 = (24 + 17 + 8 + 8 + 9 + 16 + 7 + 8 + 8 + 7.5) / 14 = 112.5 / 14 = **8.04/10**

Generation reussie. La transformation chantier brut vers cuisine scandinave est convaincante. La preservation spatiale est solide, le style est bien ancre avec le PH5-style et les tabourets bleus. Principales lacunes : absence de hotte (critique en cuisine) et pouf non fonctionnel.

---

## Generation #92 -- Contemporary kitchen

### Contexte input

Cuisine existante vetuste, format paysage. Murs peints en vert vif. Meuble bas blanc avec evier inox a gauche, meuble haut blanc ouvert au-dessus. Credence en carrelage beige/rose. Cumulus (ballon d'eau chaude) blanc dans le coin arriere droit. Sol carrelage blanc casse, sale avec taches. Pas de fenetre visible dans le cadre. Murs fortement degrades (peinture ecaillee, traces d'humidite). Aucune hotte visible. Piece estimee a 8-10 m2, plutot etroite en profondeur.

Cas d'usage courant pour Versimo : cuisine a renover completement, le client (marchand de biens Thomas) veut projeter l'acquereur dans le "apres travaux".

### Analyse preservation spatiale (x3)

**Note : 7/10** -- Pas d'alerte CAP, mais points de vigilance.

Points positifs :
- L'angle de prise de vue est globalement preserve : meme perspective depuis le coin gauche en direction du fond
- La profondeur de la piece est coherente
- Le mur du fond (anciennement vert) est au bon emplacement
- La hauteur sous plafond est preservee

Points negatifs :
- **Fenetre HALLUCINEE a droite** : l'input ne montre AUCUNE fenetre dans le cadre. L'output en ajoute une a droite avec un convecteur en dessous et une plante sur l'allege. C'est une hallucination architecturale. Cependant, il est possible que la fenetre existe hors cadre a droite de l'input (le mur droit n'est pas visible dans l'input). L'impact est modere car elle est en bord de cadre.
- **Cumulus supprime** : le ballon d'eau chaude dans le coin a disparu. Acceptable en renovation (il serait deplace dans un placard technique), mais c'est un element structurel absent.
- La piece semble legerement plus spacieuse que l'input -- l'ilot/bar ajoute avec 2 tabourets presuppose un espace de circulation qui n'est pas evident dans l'input.
- **Prise electrique visible** en bas a gauche du mur -- detail qui ancre le realisme (positif).

### Grille complete

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale (x3) | 7/10 | Angle et volume globalement preserves. Fenetre possiblement hallucinee a droite (-1.5). Cumulus supprime (-0.5). Piece legerement agrandie. |
| 2 | Fidelite stylistique (x2) | 8/10 | Contemporain bien execute : greige dominant, surfaces lisses, zero ornement, luminaire smoked glass sphere pendant (Van Duysen-esque). Robinetterie noire, credence metro blanche. Coherent avec la direction Pawson/Van Duysen. |
| 3 | Eclairage (x1) | 7.5/10 | L'input est eclaire par une source hors cadre (lumiere diffuse). L'output ajoute un spot encastre + eclairage sous meuble haut + pendant = coherent mais plus lumineux que l'input. La lumiere de la "fenetre" hallucinee ajoute une source laterale non presente dans l'input. |
| 4 | Hero pieces (x1) | 7/10 | Luminaire smoked glass globe = bonne ancre contemporaine. Tabourets gris textile sur pieds noirs = sobre, correct. Manque un element plus signature (poignee affleurante, tiroir push-to-open, detail qui dirait "2025"). |
| 5 | Coherence matieres (x1) | 8.5/10 | Palette greige + blanc + noir mat + verre fume + textile gris. Zero dissonance. Les plans de travail blancs, les caissons greige mat, la credence metro blanche s'accordent parfaitement. |
| 6 | Credibilite pro (x2) | 7.5/10 | Presentable a un client, mais la fenetre potentiellement hallucinee est un risque : si le client connait sa cuisine, il verra que la fenetre n'existe pas. L'absence de hotte est moins flagrante qu'en #91 (plaque vitro + hotte integree possible). Le convecteur sous fenetre est un bon detail realiste. |
| 7 | Completude (x1) | 8/10 | Cuisine complete : plaque vitroceramique visible, four encastre, evier avec robinetterie, rangements hauts et bas, eclairage sous meuble, bar avec tabourets. Mieux equipee que #91. Manque toujours une hotte visible ou integree. |
| 8 | Vocabulaire visuel (x1) | 7.5/10 | Palette contemporaine respectee mais un peu "safe". Le greige uniforme manque de contraste. Accessoires de styling minimalistes (planches, citrons, plante). Pourrait beneficier d'un element plus audacieux (une lame de plan de travail en pierre naturelle, une credence en pierre frittee). |
| 9 | Adaptabilite spatiale (x1) | 7/10 | L'ilot/bar avec 2 tabourets est ambitieux pour une piece de 8-10 m2. La circulation semble juste. En realite, on serait probablement en configuration lineaire ou en L sans bar dans cet espace. |
| 10 | Potentiel photorealiste (x1) | 8/10 | Bon rendu. Le sol beton cire, les reflets sur le plan de travail, l'eclairage sous meuble sont credibles. La prise electrique en bas a gauche ajoute du realisme. Le pendant en verre fume a des reflets corrects. |

### Note finale

Calcul : (7x3 + 8x2 + 7.5 + 7 + 8.5 + 7.5x2 + 8 + 7.5 + 7 + 8) / 14 = (21 + 16 + 7.5 + 7 + 8.5 + 15 + 8 + 7.5 + 7 + 8) / 14 = 105.5 / 14 = **7.54/10**

Generation correcte. Le style contemporain est bien rendu avec une palette greige maitrisee. La principale faiblesse est la fenetre potentiellement hallucinee a droite et un espace un peu idealisee (ilot dans une petite piece). Le convecteur et la prise electrique sont de bons details de credibilite.

---

## Generation #93 -- Custom WC

### Contexte input

Petite salle de bain existante, format portrait. Vue en plongee depuis le seuil de porte. Piece tres etroite (~1.2m de large) et profonde (~2.5m). Baignoire encastree au fond avec carrelage gris-vert au-dessus et blanc en dessous. Porte-serviettes metallique au mur du fond. Robinetterie de baignoire visible a droite. Sol en carrelage beige clair, sale. Convecteur electrique au sol a droite. Carton/emballage au sol. Murs blancs (peinture) sur les cotes, sans fenetre. Eclairage artificiel plafond hors cadre.

Le type "WC" dans la metadata indique que l'utilisateur veut transformer cette salle de bain en toilettes. C'est un changement d'usage, pas juste de style.

### Analyse preservation spatiale (x3)

**Note : 8.5/10** -- Pas d'alerte CAP. Excellente preservation.

Points positifs :
- **Angle de vue IDENTIQUE** : meme perspective en plongee depuis le seuil, meme couloir etroit
- **Proportions parfaitement preservees** : la largeur etroite (~1.2m) et la profondeur sont respectees. Le WC suspendu est place exactement ou se trouvait la baignoire (mur du fond)
- **Murs lateraux** preserves dans leur position et leur epaisseur
- **Retour de plafond** au fond de la piece : le leger decrochement/corniche visible dans l'input est preserve dans l'output
- **Convecteur electrique preserve** en bas a droite -- c'est un excellent detail, conforme aux apprentissages Sprint 18 (equipements muraux fixes)
- Le format portrait etroit est respecte sans elargissement

Points negatifs :
- La baignoire a disparu (normal, c'est un changement d'usage) mais le mur du fond qui avait deux zones de carrelage (gris-vert en haut, blanc en bas) est devenu un mur blanc uni -- la transition est propre
- Le carrelage de sol est remplace par un parquet chevron -- changement significatif mais attendu dans un restaging

### Grille complete

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale (x3) | 8.5/10 | Angle, proportions, profondeur, largeur etroite parfaitement preserves. Convecteur maintenu. Decrochement plafond preserve. Changement d'usage (SdB → WC) proprement execute. |
| 2 | Fidelite stylistique (x2) | 7/10 | Style "custom" donc pas de reference stylistique precise. L'output propose un WC haut de gamme haussmannien-contemporain : laiton, parquet chevron, applique murale classique. Coherent mais le style n'est pas clairement nomme -- on est entre Haussmannien et Contemporain. |
| 3 | Eclairage (x1) | 8/10 | L'input avait un eclairage artificiel plafond froid/neutre. L'output a une applique murale laiton a droite avec lumiere chaude + un eclairage d'ambiance doux. La transition cold → warm est un choix de style, pas un defaut. Le traitement des ombres est coherent (ombre portee du WC au sol). |
| 4 | Hero pieces (x1) | 7.5/10 | WC suspendu blanc avec plaque de commande ronde (Geberit-style) = bon choix. Lave-mains compact mural a gauche avec robinetterie laiton = adapte a l'espace. Applique murale laiton avec abat-jour tissu = ancrage haut de gamme. Miroir dore a gauche. Pas de piece veritablement iconique, mais l'ensemble est coherent. |
| 5 | Coherence matieres (x1) | 8.5/10 | Laiton (robinetterie, applique, miroir, porte-rouleau) + blanc (murs, ceramique WC, lave-mains) + bois chaud (parquet chevron) + noir mat (brosse WC). Palette tres coherente, registre "boutique hotel". |
| 6 | Credibilite pro (x2) | 8.5/10 | Un architecte montrerait absolument ce rendu a un client. Le WC suspendu est bien dimensionne pour l'espace etroit, le lave-mains compact est a la bonne hauteur, la plaque de commande est centree. Le trappe de visite au-dessus du WC (rectangle blanc) est un detail technique credible. Le convecteur preservee ancre dans le reel. |
| 7 | Completude (x1) | 8/10 | WC complet : cuvette suspendue, plaque de commande, lave-mains, miroir, applique, brosse WC, derouleur papier (porte-papier laiton visible a droite). Il manque eventuellement un petit meuble de rangement ou une patere, mais pour 1.2m de large c'est raisonnable. |
| 8 | Vocabulaire visuel (x1) | 7.5/10 | Palette chaude/doree coherente. Parquet chevron = marqueur haussmannien. Laiton = marqueur premium. Manque de texture : les murs sont trop uniformement blancs, un soubassement ou un micro-relief aurait enrichi la lecture. |
| 9 | Adaptabilite spatiale (x1) | 9/10 | Excellent. Chaque element est dimensionne pour l'espace contraint : lave-mains compact (~30cm), WC suspendu (libere le sol), pas de meuble surdimensionne. C'est l'une des meilleures adaptations spatiales que j'aie vue dans les audits Versimo -- le modele a compris que c'est un espace de 3m2 max. |
| 10 | Potentiel photorealiste (x1) | 8/10 | Bon rendu general. La lumiere de l'applique est bien rendue avec son halo sur le mur. Le parquet chevron a un grain credible. Les ombres portees sont correctes. Le convecteur a une grille realiste. Leger manque de grain photographique (un poil trop clean). |

### Note finale

Calcul : (8.5x3 + 7x2 + 8 + 7.5 + 8.5 + 8.5x2 + 8 + 7.5 + 9 + 8) / 14 = (25.5 + 14 + 8 + 7.5 + 8.5 + 17 + 8 + 7.5 + 9 + 8) / 14 = 113 / 14 = **8.07/10**

Excellente generation. La transformation d'une salle de bain vetuste en WC haut de gamme est remarquablement executee. La preservation spatiale est la meilleure des 3 generations auditees (convecteur preserve, proportions parfaites pour un espace contraint). Le style custom s'est traduit en un registre haussmannien-contemporain coherent. C'est le type de rendu qui convaincrait le persona Thomas pour une plaquette commerciale.

---

## Synthese

| # | Generation | Style | Type piece | Preservation | Note finale |
|---|-----------|-------|------------|-------------|-------------|
| 91 | Scandinavian kitchen | Scandinave | Cuisine | 8/10 | **8.04/10** |
| 92 | Contemporary kitchen | Contemporain | Cuisine | 7/10 | **7.54/10** |
| 93 | Custom WC | Custom (haussmannien-contemporain) | WC | 8.5/10 | **8.07/10** |

**Moyenne generale : 7.88/10** (+2.4 pts vs dernier audit #31-42 moyenne 5.5)

### Patterns positifs

1. **Preservation spatiale en nette progression** : les 3 generations preservent l'angle, le volume et les proportions. Aucune alerte CAP (< 7). C'est une amelioration majeure par rapport aux audits precedents ou les geometries etaient regulierement deformees.
2. **Equipements fixes preserves** : le convecteur electrique dans #93 est maintenu -- les directives Sprint 18 fonctionnent. Le radiateur supprime en #91 est acceptable en contexte cuisine.
3. **Adaptabilite aux petits espaces** : #93 (WC 3m2) est remarquable -- le modele a compris les contraintes et dimensionne le mobilier en consequence.
4. **Pipeline 2 passes stable** : les 3 generations utilisent GPT-image-1 en passe 1 ET passe 2, avec des resultats coherents. Pas de passe 1 seule livree (fix Sprint 22 effectif).
5. **Ancrage stylistique** : #91 avec le PH5-style pendant et les tabourets bleus, #92 avec le globe smoked glass, #93 avec le laiton + chevron -- chaque generation a une identite visuelle lisible.

### Patterns negatifs

1. **Hallucination de fenetre** (#92) : une fenetre apparait a droite qui n'est pas visible dans l'input. Risque modere (hors cadre possible) mais a surveiller.
2. **Absence de hotte en cuisine** (#91 et #92) : aucune des deux cuisines ne montre une hotte aspirante visible. C'est un manque fonctionnel critique en cuisine -- un architecte le remarquerait immediatement.
3. **Leger warm shift persistant** : les murs ont tendance a virer vers le beige chaud, meme quand l'input est neutre. Moins severe qu'avant (on ne voit plus de virage franc) mais encore present.
4. **Rendu un poil trop clean** : le grain photographique est present mais discret. Les rendus sont encore un peu trop "parfaits" pour passer pour des photos au smartphone.

## Recommandations P0-P4

### P1 -- Hotte aspirante en cuisine

**Probleme** : les prompts cuisine (furniturePrompt) ne mentionnent pas de hotte aspirante. C'est un equipement OBLIGATOIRE en cuisine (reglementation + credibilite pro).

**Solution** : ajouter dans le furniturePrompt cuisine : "integrated range hood or slim under-cabinet extractor above cooktop" -- formuler comme integree pour ne pas encombrer visuellement les petites cuisines.

**Impact** : credibilite pro +1 pt, completude +1 pt sur les cuisines.

### P2 -- Hallucination fenetre en piece aveugle

**Probleme** : quand l'input ne montre aucune fenetre, le modele peut en halluciner une (observe sur #92).

**Solution** : renforcer la directive dans le builder passe 2 : "If the input photo shows no window, the output must show no window. Do not add any window or natural light source that is not visible in the input." Cette formulation est deja dans le builder mais peut etre diluee par le style prompt. Envisager de la REPETER en fin de prompt passe 2 pour profiter du recency bias.

**Impact** : preservation spatiale +0.5 pt sur les pieces aveugles.

### P3 -- Enrichissement textures sur espaces monochromes

**Probleme** : les murs blancs sont trop uniformes, surtout en #93. Un WC haut de gamme aurait un soubassement, un micro-relief, ou un papier peint texture.

**Solution** : pour les petits espaces (WC, entree), ajouter dans le surfacePrompt : "subtle wall texture variation — wainscoting, micro-stucco, or textured wallpaper on the back wall". Conditionnel : "if the space is small (<5m2)".

**Impact** : vocabulaire visuel +1 pt, fidelite stylistique +0.5 pt.

### P3 -- Grain photographique plus prononce

**Probleme** : les rendus sont encore trop "propres" pour du photosite/smartphone. Le grain ISO 200 est trop subtil.

**Solution** : monter a "sensor grain equivalent to ISO 400" et ajouter "subtle chromatic aberration on high-contrast edges" (ca c'est un marqueur optique reel que les modeles IA ne generent jamais spontanement).

**Impact** : potentiel photorealiste +0.5 pt.

### P4 -- Differentiation style Custom

**Probleme** : le mode Custom (#93) produit un resultat coherent mais sans identite stylistique nommee. Le pre-processing GPT-4.1-mini pourrait proposer un nom de style ("haussmannien-contemporain") pour guider le pipeline.

**Solution** : dans lib/custom-prompt.ts, ajouter une instruction au system prompt : "After splitting surface/furniture, suggest the closest named style from the 12 available and prepend it to the furniturePrompt."

**Impact** : fidelite stylistique +0.5 pt sur les custom.

---

## Comparaison avec audits precedents

| Audit | Generations | Moyenne Yann | Preservation moyenne |
|-------|-----------|-------------|---------------------|
| #31-36 | Sprint 22 | 5.5/10 | ~5.5/10 |
| #37-42 | Sprint 22 | 5.5/10 | ~5.0/10 |
| #94-95 | Maximalist chantier | 6.1/10 | ~6.5/10 |
| **#91-93** | **Cuisine + WC** | **7.88/10** | **7.83/10** |

Progression nette de +2.3 pts sur la moyenne globale et +2.3 pts sur la preservation spatiale. Le pipeline v36 avec GPT-4.1 + GPT-image-1 en double passe est desormais fiable sur les espaces fonctionnels (cuisine, WC). Les pieces techniques (chantier brut, double hauteur) restent plus exigeantes.

---

*Audit realise par Yann Duval, architecte d'interieur, 2026-04-01. Grille ajustee avec preservation spatiale x3 et CAP < 7.*
