# Audit visuel generations #91-95 -- Yann Duval, Architecte d'interieur

Date : 2026-04-01
Dernier audit precedent : #31-42 (Sprint 22)
Generations auditees : #91 Scandinavian kitchen, #92 Contemporary kitchen, #93 Custom WC, #94 Maximalist salon, #95 Maximalist chambre enfant
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

## Generation #94 -- Maximalist salon

### Contexte input

Piece en chantier brut, format portrait. Vue depuis le seuil/entree en direction du fond. Plafond avec poutres IPN metalliques apparentes et un neon tube fluorescent fixe au plafond. Mur du fond : pierres apparentes (moellons, jointoiement partiel), ballon d'eau chaude blanc a droite du mur du fond. Mur de gauche : fenetre sombre (chassis noir/anthracite) avec vue sur vegetation, escabeau appuye contre le mur. Sol : chape brute beige/sable avec une zone de parquet ancien visible au premier plan a droite. Cables electriques pendants a droite. Deux personnes debout au fond de la piece. Piece estimee a 15-18 m2, rectangulaire, profondeur ~5m. Hauteur sous plafond genereuse (~2.80m, poutres IPN).

C'est un cas de chantier lourd : gros oeuvre visible, pas de second oeuvre fini. Le defi pour le modele est considerable : transformer des moellons et du beton brut en interieur habitable.

### Analyse preservation spatiale (x3)

**Note : 6/10** -- ALERTE CAP ACTIVEE. Note finale plafonnee a 5/10.

Points positifs :
- L'angle de vue est globalement preserve : meme perspective depuis l'entree vers le fond
- La fenetre a gauche est conservee, position correcte, chassis noir coherent
- La hauteur sous plafond genereuse est perceptible dans l'output
- Les poutres au plafond sont presentes dans l'output (blanches, structurelles)

Points negatifs :
- **Mur du fond RADICALEMENT modifie** : les moellons/pierres apparentes sont remplaces par un mur vert canard uni. C'est un choix stylistique fort (mur accent maximaliste) mais on perd toute trace de la materialite originale. Sur un chantier, les pierres auraient pu etre enduits ou rejointoyees, pas peintes en vert canard opaque.
- **Ballon d'eau chaude supprime** : le cumulus blanc au fond a droite a disparu completement. Pas de meuble ou element le remplacant a cet emplacement.
- **Cables electriques a droite supprimes** : nettoyage acceptable, mais le boitier/attente electrique aurait du laisser une trace.
- **Format de la piece semble compresse en profondeur** : l'output parait moins profond que l'input. Le canape est TRES proche du mur du fond, alors que l'input montrait ~5m de profondeur avec les personnes au fond donnant l'echelle. La piece semble avoir perdu 1-1.5m de profondeur.
- **Personnes supprimees** (normal pour le staging, pas penalisant).
- **Poutres IPN metalliques transformees en poutres blanches lisses** : les IPN avaient une section en I caracteristique. L'output montre des poutres rectangulaires blanches propres -- la geometrie est preservee (meme position, meme orientation) mais la materialite est perdue.
- **Deuxieme fenetre apparue** a droite en arriere-plan : l'input ne montre qu'UNE fenetre a gauche. L'output en montre une seconde a droite du canape, partiellement visible. Hallucination architecturale.

Le cumul de la compression de profondeur, de la fenetre hallucinee, et du mur du fond completement transforme fait passer la preservation sous le seuil de 7.

### Grille complete

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale (x3) | 6/10 | ALERTE CAP. Compression profondeur, fenetre hallucinee a droite, mur moellons efface, cumulus supprime, IPN lisses. Angle et fenetre gauche preserves. |
| 2 | Fidelite stylistique (x2) | 8.5/10 | Maximaliste exemplaire a la Wearstler/Dimorestudio : mur accent vert canard, canape velours bleu nuit, table basse orange corail, tapis persan superpose au tapis chevron, coussins motifs tribaux/rayures, monstera, cadres au sol, lustre sculptural multicolore. L'audace chromatique est au rendez-vous. |
| 3 | Eclairage (x1) | 7/10 | L'input avait un eclairage artificiel froid (neon tube) + lumiere naturelle laterale gauche. L'output montre un eclairage chaud ambiant + lampadaire arc cuivre. La temperature couleur a vireo warm mais c'est coherent avec le style maximaliste. L'ombre portee du canape est absente. |
| 4 | Hero pieces (x1) | 8/10 | Lustre sculptural multicolore (Murano-style) = piece maitresse parfaite pour le maximaliste. Canape velours bleu nuit channel-tufted. Table basse orange/laiton. Lampadaire arc cuivre. Chandelier dore au sol. Superposition de tapis (persan + chevron). Bonne densite de pieces signature. |
| 5 | Coherence matieres (x1) | 7.5/10 | Velours bleu + laiton + cuivre + ceramique vert (pot monstera) + orange laque + tapis laine. L'ensemble est volontairement heteroclite (maximaliste) mais les tons chauds (cuivre, laiton, orange) unifient la palette. Le seul accroc : le chandelier dore au sol semble un peu deplace (objet liturgique dans un salon). |
| 6 | Credibilite pro (x2) | 5/10 | La compression de profondeur et la fenetre hallucinee sont des deal-breakers pour un professionnel. Le client qui connait sa piece verra immediatement que les proportions ne correspondent pas. Le mur vert canard sur moellons est un choix de style, pas un defaut, mais le cumulus disparu sans solution technique visible (placard?) pose question. En revanche, la direction artistique maximaliste est correcte -- c'est la geometrie qui fait chuter la credibilite. |
| 7 | Completude (x1) | 7.5/10 | Salon complet : assise principale (canape), table basse, luminaire plafond + lampadaire, tapis, plante, cadres decoratifs, coussins accent. Manque une assise secondaire (fauteuil accent) et un meuble de rangement/credence. |
| 8 | Vocabulaire visuel (x1) | 8.5/10 | Palette maximaliste magistrale : vert canard + bleu nuit + orange corail + laiton + motifs superposes (chevron + persan + tribal). Textures variees : velours, laine, cuivre patiné, ceramique. C'est visuellement riche sans etre chaotique -- l'equilibre Wearstler est atteint. |
| 9 | Adaptabilite spatiale (x1) | 6/10 | Le canape 3 places est bien dimensionne pour l'espace, mais TOUT le mobilier est concentre dans la moitie avant de la piece. Le fond (derriere le canape) est vide -- or l'input montrait 5m de profondeur. Pas de zone secondaire en fond de piece (pas de bureau, console, bibliotheque). La directive de distribution en profondeur (Sprint 14) n'a pas fonctionne ici. |
| 10 | Potentiel photorealiste (x1) | 7/10 | Bon rendu des textures (velours, tapis, cuivre patine). Le monstera est credible. Les cadres au sol avec leurs cadres dores sont bien rendus. Mais : le lustre multicolore semble un peu "flottant" sans ancrage au plafond visible, et le sol en parquet chevron sombre est trop uniforme (pas de variation de teinte entre les lames). |

### Note finale

Calcul brut : (6x3 + 8.5x2 + 7 + 8 + 7.5 + 5x2 + 7.5 + 8.5 + 6 + 7) / 14 = (18 + 17 + 7 + 8 + 7.5 + 10 + 7.5 + 8.5 + 6 + 7) / 14 = 96.5 / 14 = 6.89/10

**CAP APPLIQUE : preservation spatiale 6/10 < 7 → note finale plafonnee a 5/10.**

**Note finale : 5.0/10** (plafonnee, brute 6.89)

La direction artistique maximaliste est excellente -- c'est l'un des meilleurs vocabulaires visuels que j'aie vu pour ce style. Mais la geometrie spatiale est trop degradee : compression de profondeur, fenetre hallucinee, mur structurel completement transforme. Un architecte ne pourrait pas montrer ce rendu a un client qui connait sa piece de chantier. La fidelite stylistique ne compense pas les erreurs de preservation.

---

## Generation #95 -- Maximalist chambre enfant

### Contexte input

Identique a #94 : meme piece de chantier brut (moellons, IPN, neon, fenetre gauche, cumulus). Le modele doit cette fois la transformer en chambre d'enfant maximaliste.

### Analyse preservation spatiale (x3)

**Note : 6.5/10** -- ALERTE CAP ACTIVEE. Note finale plafonnee a 5/10.

Points positifs :
- L'angle de vue est preserve : meme perspective depuis l'entree vers le fond
- **Deux fenetres a gauche** : l'output en montre deux avec chassis noir. Si l'input n'en avait qu'une visible, la seconde pourrait etre hors cadre (le mur de gauche continue au-dela du cadre). Moins flagrant que #94 car les deux fenetres sont sur le meme mur gauche.
- Les **poutres au plafond sont preservees** avec leur geometrie (position, orientation, nombre). Elles sont rendues en bois brun sombre au lieu des IPN metalliques -- changement de materialite mais la structure est la.
- La profondeur de la piece est MIEUX preservee qu'en #94 : le lit est au milieu, l'armoire et l'etagere sont au fond, la table enfant est a droite en fond -- la distribution spatiale exploite toute la profondeur.
- Hauteur sous plafond preservee.

Points negatifs :
- **Mur du fond vert canard identique a #94** : les moellons sont de nouveau effaces au profit d'un mur accent. Meme probleme que #94 -- la materialite structurelle est perdue.
- **Ballon d'eau chaude supprime** : meme observation que #94.
- **Deuxieme fenetre potentiellement hallucinee** : l'input n'en montre qu'une clairement. L'output en a deux. Cependant, le mur gauche continue au-dela du cadre de l'input, donc c'est plausible.
- **Le mur de droite** qui montrait les cables electriques pendants est maintenant un mur blanc propre avec un tableau et un cadre accroches. Les cables sont nettoyes (bien) mais un tableau est apparu sur un mur qui n'existait peut-etre pas dans sa totalite visible.
- **Format de piece un peu plus large** qu'en input : la chambre semble plus spacieuse, probablement 18-20 m2 au lieu des 15-18 estimes.

La preservation est meilleure qu'en #94 (la profondeur est exploitee, les poutres sont mieux gerees) mais le mur du fond transforme et le cumulus supprime empechent d'atteindre 7.

### Grille complete

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale (x3) | 6.5/10 | ALERTE CAP. Mur moellons efface (vert canard), cumulus supprime, possible 2e fenetre hallucinee. MAIS : poutres mieux preservees, profondeur exploitee, angle correct. Legerement meilleur que #94. |
| 2 | Fidelite stylistique (x2) | 8/10 | Maximaliste enfant reussi : patchwork multicolore sur le lit, tapis superposees (persan + tapis floral rond), armoire peinte avec motif paisley, couleurs vives (rouge, bleu, jaune, vert). Lustre multicolore (meme famille que #94). L'esprit Wearstler est adapte a l'enfant avec des couleurs primaires en plus. |
| 3 | Eclairage (x1) | 7.5/10 | Lumiere naturelle par les fenetres gauche = coherent avec l'input. Eclairage chaud d'ambiance (lampe de chevet, lustre). L'ombre portee du lit au sol est presente et correctement orientee (source a gauche). Leger warm shift general mais acceptable pour une chambre enfant. |
| 4 | Hero pieces (x1) | 7.5/10 | Lit enfant en bois naturel avec couverture patchwork = piece centrale. Armoire peinte motif paisley = piece forte et unique. Lustre multicolore = coherent avec #94 (meme style). Etagere Kallax-style avec casiers rouges = pratique. Table enfant en bois avec chaise bleue. Manque un element plus iconique (lampe Miffy, fauteuil Panton enfant). |
| 5 | Coherence matieres (x1) | 7/10 | Bois naturel (lit, table) + bois peint (armoire) + textile multicolore (patchwork, tapis) + osier (panier jouets) + metal/verre (lustre). L'ensemble est deliberately eclectique mais le sol parquet sombre unifie. Le contraste entre l'armoire decoree et la table brute est un peu fort -- en maximaliste, ca passe, mais la hierarchie des pieces est moins claire. |
| 6 | Credibilite pro (x2) | 5.5/10 | Meme probleme que #94 : un parent qui connait sa piece de chantier verrait que les moellons et le cumulus ont disparu. La deuxieme fenetre est moins genante (plausible hors cadre). La direction deco enfant maximaliste est pertinente -- les couleurs vives et le patchwork fonctionnent pour un enfant. Le tableau au mur du fond (motif jungle colore) ancre bien le theme. Meilleur que #94 car la profondeur est mieux geree. |
| 7 | Completude (x1) | 8.5/10 | Chambre enfant complete : lit, rangement (armoire + etagere), bureau/table avec chaise, luminaires (lustre + lampe chevet + petit globe), tapis, jouets (peluche lapin dans panier, girafe decorative, voiture, livres). Tres bonne completude pour une chambre enfant -- chaque zone fonctionnelle est couverte. |
| 8 | Vocabulaire visuel (x1) | 8/10 | Palette maximaliste enfant bien executee : vert canard + rouge + bleu + jaune + orange. Motifs superposes : patchwork + persan + floral + paisley. Textures variees : bois, textile, osier, metal. C'est joyeux sans etre criard -- l'equilibre est bon. |
| 9 | Adaptabilite spatiale (x1) | 8/10 | Nette amelioration vs #94 : le mobilier est distribue sur TOUTE la profondeur. Lit au centre, armoire et etagere au fond, table a droite fond, panier jouets au premier plan. La directive de distribution en profondeur fonctionne ici. Le lit est bien dimensionne pour un enfant (~90x190). |
| 10 | Potentiel photorealiste (x1) | 7/10 | Les textures du patchwork et des tapis sont credibles. Le panier en osier est bien rendu. Les poutres bois sombre ont un grain visible. Mais : le lustre multicolore a un rendu un peu "CGI" (trop propre, pas assez de reflets sur le verre), et le sol parquet est trop uniformement sombre. La peluche lapin dans le panier est un bon detail de vie. |

### Note finale

Calcul brut : (6.5x3 + 8x2 + 7.5 + 7.5 + 7 + 5.5x2 + 8.5 + 8 + 8 + 7) / 14 = (19.5 + 16 + 7.5 + 7.5 + 7 + 11 + 8.5 + 8 + 8 + 7) / 14 = 100 / 14 = 7.14/10

**CAP APPLIQUE : preservation spatiale 6.5/10 < 7 → note finale plafonnee a 5/10.**

**Note finale : 5.0/10** (plafonnee, brute 7.14)

Meilleure generation que #94 sur presque tous les criteres (distribution spatiale, completude, poutres) mais le meme vice de preservation spatiale plafonne la note. Le mur de moellons efface et le cumulus supprime sont des constantes sur cette image input -- le pipeline ne sait pas preserver la pierre apparente brute. La direction artistique maximaliste enfant est neanmoins reussie et joyeuse.

---

## Synthese des 5 generations (#91-95)

| # | Generation | Style | Type piece | Preservation | Note brute | CAP | **Note finale** |
|---|-----------|-------|------------|-------------|-----------|-----|----------------|
| 91 | Scandinavian kitchen | Scandinave | Cuisine | 8/10 | 8.04 | -- | **8.04/10** |
| 92 | Contemporary kitchen | Contemporain | Cuisine | 7/10 | 7.54 | -- | **7.54/10** |
| 93 | Custom WC | Custom (haussmannien-contemporain) | WC | 8.5/10 | 8.07 | -- | **8.07/10** |
| 94 | Maximalist salon | Maximaliste | Salon | 6/10 | 6.89 | OUI | **5.0/10** |
| 95 | Maximalist chambre enfant | Maximaliste | Chambre enfant | 6.5/10 | 7.14 | OUI | **5.0/10** |

**Moyenne generale : 6.73/10** (avec CAP applique sur #94 et #95)
**Moyenne sans CAP (brute) : 7.54/10**
**Moyenne preservation spatiale : 7.2/10** (3 generations au-dessus du seuil, 2 en dessous)

### Patterns positifs

1. **Preservation spatiale solide sur les espaces finis** : #91 (8/10), #92 (7/10), #93 (8.5/10) preservent correctement angle, volume et proportions. Le pipeline fonctionne bien quand l'input a des reperes architecturaux clairs (murs enduits, menuiseries posees, sol fini).
2. **Equipements fixes preserves sur pieces finies** : le convecteur dans #93 est maintenu. Les directives Sprint 18 fonctionnent sur les pieces ou le second oeuvre est avance.
3. **Adaptabilite aux petits espaces** : #93 (WC 3m2) est remarquable. #95 distribue le mobilier en profondeur (amelioration vs #94).
4. **Pipeline 2 passes stable** : les 5 generations utilisent GPT-image-1 en double passe. Pas de passe 1 seule livree.
5. **Fidelite stylistique maximaliste reussie** : #94 (8.5/10) et #95 (8/10) capturent l'essence Wearstler/Dimorestudio -- palette audacieuse, motifs superposes, pieces eclectiques. Le vocabulaire visuel maximaliste est le meilleur de tous les styles audites.
6. **Ancrage stylistique lisible par generation** : PH5-style (#91), smoked glass globe (#92), laiton + chevron (#93), lustre Murano + velours bleu (#94), patchwork + armoire paisley (#95).

### Patterns negatifs

1. **CRITIQUE -- Pierre apparente brute non preservee** (#94, #95) : le mur de moellons est systematiquement efface et remplace par un aplat de couleur (vert canard). Le modele ne sait pas traiter la pierre brute en chantier lourd. Le surfacePrompt devrait proposer "whitewashed stone keeping visible mortar joints" au lieu de peindre par-dessus.
2. **CRITIQUE -- Compression de profondeur sur chantier brut** (#94) : la piece perd ~1-1.5m de profondeur percue. Quand l'input n'a pas de mobilier pour donner l'echelle, le modele sous-estime la profondeur.
3. **Hallucination de fenetre recurrente** (#92, #94, potentiellement #95) : 3/5 generations montrent des fenetres non visibles dans l'input. Le probleme est aggrave quand l'input est un chantier (murs non finis = le modele "invente" des ouvertures).
4. **Ballon d'eau chaude (cumulus) systematiquement supprime** (#94, #95) : les directives de preservation equipements fixes (Sprint 18) ne couvrent pas les equipements hors-mur comme le cumulus sur pied/suspendu. A ajouter.
5. **Absence de hotte en cuisine** (#91, #92) : toujours non resolu.
6. **Concentration mobilier premier plan** (#94) : la directive de distribution en profondeur (Sprint 14) n'a pas fonctionne sur #94 (tout devant le canape). Elle a fonctionne sur #95 (chambre enfant) -- la difference est probablement le type de piece (un salon a un "groupe principal" naturel, une chambre a des zones fonctionnelles distinctes).
7. **IPN metalliques transformes en bois/beton lisse** (#94, #95) : les poutres IPN en acier sont un element structurel caractéristique. Le modele les remplace par des poutres generiques. Meme probleme que les moellons : le chantier brut est "lisse" au lieu d'etre "fini sur l'existant".

### Enseignement cle : le chantier lourd est le talon d'Achille du pipeline

Les 3 generations sur pieces finies/semi-finies (#91-93) obtiennent une moyenne de **7.88/10**. Les 2 generations sur chantier brut (#94-95) obtiennent **5.0/10** (avec CAP). L'ecart de **2.88 points** est considerable.

Le modele sait editer une piece avec des surfaces lisibles (platre, peinture, carrelage) mais ne sait pas PRESERVER des surfaces brutes (moellons, IPN, chape beton). Il les remplace systematiquement par des surfaces finies generiques, perdant au passage la materialite et parfois la geometrie.

## Recommandations P0-P4

### P0 -- Preservation pierre apparente et materiaux bruts

**Probleme** : sur chantier lourd, les moellons, pierres apparentes et IPN metalliques sont effaces et remplaces par des aplats. C'est la cause racine de l'echec preservation sur #94 et #95.

**Solution** : ajouter une directive conditionnelle dans le builder passe 1 : "If the input walls show exposed stone, raw masonry, or rough brick, preserve the stone texture and mortar joints. Apply the style color as a WASH over the stone (limewash, whitewash) — do not paint over it opaquely. The irregular surface must remain visible." Pour les IPN : "If metal I-beams or steel structures are visible, keep them as metal — paint or lacquer them in the style color but preserve the I-beam profile."

**Impact** : preservation spatiale +1.5 pts sur chantier brut, credibilite pro +1 pt.

### P0 -- Preservation cumulus/ballon d'eau chaude

**Probleme** : le cumulus est supprime dans 2/2 generations utilisant cette image input. Les directives Sprint 18 ne le couvrent pas (elles mentionnent radiateurs, chauffages, vents, thermostats).

**Solution** : ajouter "water heater, boiler, cumulus" a la liste des equipements fixes a preserver dans les builders passe 1 et passe 2. Formuler : "Preserve all fixed technical equipment visible in the input: radiators, heaters, water heaters, boilers, vents, thermostats, switches, junction boxes."

**Impact** : preservation spatiale +0.5 pt.

### P1 -- Anti-hallucination fenetre renforcee (recurrence 3/5)

**Probleme** : 3 generations sur 5 montrent des fenetres non presentes dans l'input. Le probleme empire sur chantier brut.

**Solution** : (1) REPETER la directive anti-fenetre en FIN de prompt passe 2 (recency bias). (2) Ajouter un comptage explicite : "Count the windows visible in the input. The output must have EXACTLY the same number of windows, in the same positions." (3) Dans le builder passe 1, ajouter : "Walls that show no window must remain solid and unbroken — no new openings."

**Impact** : preservation spatiale +0.5 pt, credibilite pro +0.5 pt.

### P1 -- Hotte aspirante en cuisine

**Probleme** : les prompts cuisine ne mentionnent pas de hotte. Equipement obligatoire.

**Solution** : ajouter dans furniturePrompt cuisine : "integrated range hood or slim under-cabinet extractor above cooktop".

**Impact** : credibilite pro +1 pt, completude +1 pt sur les cuisines.

### P2 -- Distribution profondeur conditionnelle au type de piece

**Probleme** : la directive de distribution fonctionne sur les chambres (#95) mais pas sur les salons (#94). Le "groupe principal" du salon attire tout le mobilier au premier plan.

**Solution** : renforcer la directive pour les salons specifiquement : "In a living room, if the room depth exceeds 4 meters, place a secondary group (console table, floor lamp, side chair, bookshelf) against the back wall. The primary seating group should NOT touch the back wall — leave at least 80cm behind the sofa."

**Impact** : adaptabilite spatiale +1 pt sur les grands espaces.

### P3 -- Grain photographique ISO 400

**Probleme** : rendus trop clean, surtout sur #94 (lustre "CGI", sol trop uniforme).

**Solution** : monter a ISO 400 + chromatic aberration on high-contrast edges.

**Impact** : potentiel photorealiste +0.5 pt.

### P3 -- Enrichissement textures petits espaces

**Probleme** : murs blancs trop uniformes (#93).

**Solution** : wainscoting/micro-stucco/textured wallpaper conditionnel (<5m2).

**Impact** : vocabulaire visuel +1 pt.

### P4 -- Differentiation style Custom

**Probleme** : Custom sans identite nommee (#93).

**Solution** : GPT-4.1-mini suggere le style le plus proche dans le pre-processing.

**Impact** : fidelite stylistique +0.5 pt.

---

## Comparaison avec audits precedents

| Audit | Generations | Input type | Moyenne Yann | Preservation moyenne |
|-------|-----------|-----------|-------------|---------------------|
| #31-36 | Sprint 22 | Mixte | 5.5/10 | ~5.5/10 |
| #37-42 | Sprint 22 | Mixte | 5.5/10 | ~5.0/10 |
| **#94-95** | **Maximalist chantier brut** | **Chantier lourd** | **5.0/10** | **6.25/10** |
| **#91-93** | **Cuisine + WC** | **Chantier fini/semi-fini** | **7.88/10** | **7.83/10** |

Deux conclusions claires :
1. **Le pipeline a progresse de +2.3 pts** sur les pieces finies/semi-finies par rapport aux anciens audits.
2. **Le chantier lourd reste problematique** : les generations #94-95 sont au niveau des anciens audits Sprint 22, principalement a cause de la preservation spatiale insuffisante.

La priorite absolue pour le prochain sprint est la gestion des materiaux bruts (pierre, IPN, chape) dans la passe 1 -- c'est le seul frein qui empeche le pipeline d'atteindre 7+/10 de facon constante.

---

*Audit realise par Yann Duval, architecte d'interieur, 2026-04-01. Grille ajustee avec preservation spatiale x3 et CAP < 7. 5 generations auditees (#91-95).*
