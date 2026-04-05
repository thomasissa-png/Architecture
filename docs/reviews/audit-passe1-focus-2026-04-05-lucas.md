# Audit Focus Passe 1 — Preservation structurelle v51/v52

**Auditeur** : Lucas Moreau (@ai-image-expert)
**Date** : 2026-04-05
**Versions** : v51, v52 (prompts gpt-image-1.5)
**Focus** : artefacts de fusion, hallucinations structurelles, elements effaces, deformations geometriques, coherence lumiere
**Methode** : comparaison INPUT vs PASS1 uniquement (pas de passe 2 sauf Gen I)

---

## Synthese executive

La passe 1 v52 presente des problemes structurels GRAVES qui empechent toute note au-dessus de 5/10 sur la preservation spatiale. Les trois problemes recurrents sont :
1. **Fusion incomplete** : le modele ne traite qu'une partie de l'image, laissant une frontiere visible entre zone brute et zone finie
2. **Amincissement/effacement de poteaux porteurs** : les elements structurels en beton sont reduits ou supprimes
3. **Reinvention du plafond** : la geometrie des dalles/poutres est simplifiee ou remplacee

---

## v52 — Generation G (Input brut voute + baies vitrees)

### Preservation spatiale : 3/10 — ALERTE CRITIQUE

**L'espace n'est PAS fidele a l'original.** Problemes majeurs :

#### 1. Artefact de fusion catastrophique
Le probleme le plus grave : l'image est coupee en deux. La moitie gauche (environ 40% de l'image) conserve l'aspect BRUT de l'input — beton apparent, sol de chantier, plafond voute non traite. La moitie droite montre la finition attendue — murs blancs, parquet clair. La frontiere est une ligne verticale NETTE visible au centre de l'image, totalement inacceptable.

**Diagnostic technique** : le modele gpt-image-1.5 a probablement traite l'image par zones (tiling interne) et la zone gauche n'a pas ete editee. Cela ressemble a un echec partiel de generation ou une image composite mal fusionnee.

#### 2. Poteaux en bois
Les poteaux en bois encadrant les baies vitrees semblent preserves en position et proportion dans la zone traitee (droite). Dans la zone non traitee (gauche), ils sont identiques a l'input par definition.

#### 3. Plafond voute
La voute en beton est partiellement visible a gauche (non traitee) et apparait comme un plafond lisse blanc a droite — la courbure generale est preservee mais la texture brute du beton est perdue cote droit.

#### 4. Sol
Le parquet clair est pose uniquement sur la moitie droite. La moitie gauche garde le sol de chantier brut.

#### 5. Coherence lumiere
La direction lumineuse (entrant par les baies) est globalement respectee, mais l'ecart de luminosite entre les deux moities cree un effet HDR artificiel.

**Verdict** : Generation inutilisable. L'artefact de fusion est un bug bloquant. Note plafonnee a 3/10.

---

## v52 — Generation H (Loft double hauteur + mezzanine + baies industrielles)

### Preservation spatiale : 5/10 — ALERTE

**L'espace est partiellement modifie.** La structure generale est reconnue mais plusieurs elements porteurs sont alteres.

#### 1. Poteaux porteurs
L'input montre des poteaux en beton massif (section carree ~30-40cm) entre les baies vitrees et soutenant la mezzanine. Dans l'output :
- Le poteau central entre les deux groupes de baies est **AMINCI** — il passe d'une section massive a une colonne plus fine
- Les poteaux lateraux sont egalement reduits visuellement

C'est LE probleme signale par le fondateur et il est confirme ici.

#### 2. Dalle mezzanine
La dalle de mezzanine en beton brut visible a gauche dans l'input est preservee en position et epaisseur. Cependant, le dessous de la dalle (face inferieure visible depuis le RDC) est lisse au lieu de montrer les coffrages/traces de beton brut. La geometrie est correcte mais la texture est perdue.

#### 3. Plafond / poutres
L'input montre un plafond avec des solives/poutres en beton. L'output montre des poutres blanchies qui ressemblent vaguement a l'original mais la GEOMETRIE est simplifiee :
- Les poutres sont plus regulieres et symetriques que dans l'input
- Les jonctions poutre/mur sont nettoyees (les irregularites du beton brut disparaissent)

#### 4. Fenetres
- Input : 2 fenetres hautes (mezzanine) + panneau de baies vitrees type atelier en bas
- Output : les 2 fenetres hautes sont preservees, les baies basses sont preservees
- PAS de fenetre hallucinee sur ce cas. Bon point.

#### 5. Luminaire hallucine
Un luminaire type PH (disque multi-couches) est AJOUTE au plafond alors qu'il n'y avait rien dans l'input. C'est le surfacePrompt scandinave qui prescrit ce luminaire — en soi c'est voulu par le pipeline, mais il est place devant la mezzanine dans une position spatialement douteuse.

#### 6. Coherence lumiere
La source lumineuse principale (soleil entrant par les baies droites) est preservee. Le lens flare dans l'input est absent dans l'output — nettoyage acceptable. Les ombres portees au sol sont coherentes avec la direction.

#### 7. Mur gauche
L'input montre un mur avec traces de demolition/peinture ecaillee. L'output le montre en blanc propre — c'est le comportement attendu de la passe 1.

**Verdict** : L'espace est reconnaissable mais les poteaux porteurs amincis sont un probleme structurel grave. Un architecte ou un marchand de biens remarquerait immediatement que la structure n'est pas la meme. Note 5/10 — plafonnee par la deformation des poteaux.

---

## v52 — Generation I (Piece rectangulaire chantier placo + cables, style Art Deco)

### Preservation spatiale : 6/10 — ALERTE MODEREE

**L'espace est globalement reconnu mais la geometrie du plafond est REINVENTEE.**

#### 1. Angle de vue
L'input montre un angle en plongee legere depuis le coin gauche de la piece, visant le coin oppose droit. La pass1 reproduit un angle similaire mais plus SYMETRIQUE — le coin du mur au centre de l'image est place de facon plus equilibree, suggérant une legere correction de perspective par le modele. Ecart faible mais mesurable.

#### 2. Plafond reinvente
C'est le probleme principal. L'input montre un plafond en plaques de platre avec des DECROCHEMENTS visibles — une zone plus basse a gauche formant un faux-plafond en L avec une marche nette. La pass1 montre un plafond LISSE ET UNIFORME sans aucun decrochement. La geometrie du plafond a ete completement simplifiee.

Le decrochement de plafond est un element structurel (probablement un coffrage technique pour gaines/ventilation). Le supprimer revient a modifier la volumetrie de la piece.

#### 3. Moulures ajoutees
La pass1 montre des MOULURES DE CORNICHE (plinthes de plafond) qui n'existent PAS dans l'input. C'est le surfacePrompt Art Deco qui les prescrit probablement. Mais ajouter des moulures revient a modifier la structure visuelle des murs — c'est a la limite de ce que la passe 1 devrait faire.

#### 4. Sol
Parquet chevron fonce bien pose. Coherent avec le style Art Deco. Le sol brut (chape beton/mortier) est correctement remplace.

#### 5. Luminaire
Suspension geometrique laiton/verre a facettes bien placee au centre. Coherent avec Art Deco. Position spatiale correcte.

#### 6. Nettoyage cables/prises
Tous les cables electriques pendants (2 au plafond, 3 aux murs) et les boitiers de prises sont nettoyes. Bon point — c'est ce qu'on attend de la passe 1.

#### 7. Coherence lumiere
L'input montre un eclairage diffus (pas de fenetre visible, lumiere ambiante de chantier). La pass1 montre un eclairage chaud centre sur le luminaire avec light falloff vers les coins. La direction est coherente mais la temperature est nettement plus chaude que l'input — warm shift confirme.

#### 8. Passe 2 (output final)
La passe 2 preserve PARFAITEMENT la pass1 : murs, sol, plafond identiques. Le mobilier Art Deco (lit, armoire, fauteuil emeraude, chevets) est bien distribue. Les ombres portees sont coherentes avec le luminaire central. C'est une bonne passe 2.

**Verdict** : La passe 1 produit un resultat visuellement seduisant mais le plafond est reinvente (decrochement efface) et des moulures sont ajoutees. Un architecte comparant input et output verrait que la piece n'a plus la meme volumetrie. Note 6/10 — le plafond et les moulures empechent une note superieure.

---

## v51 — Pass1 comparatifs (B, D, E, F)

**Note** : les inputs originaux v51 ne sont plus disponibles (nettoyes apres l'audit precedent). L'analyse porte sur les artefacts visibles dans les pass1 seules, sans comparaison pixel-a-pixel avec l'input.

### v51-B-pass1 (Piece rectangulaire, style Boheme)

**Artefacts de fusion** : AUCUN. L'image est homogene, pas de frontiere visible.

**Hallucinations structurelles** : Le plafond montre un decrochement qui semble naturel (pas de jointure suspecte). Suspension en raphia/osier bien placee. PAS de fenetre hallucinee.

**Elements suspects** :
- Le mur gauche a un renfoncement/retrait qui pourrait etre authentique ou hallucine — impossible a confirmer sans l'input
- Le plafond est tres lisse et uniforme — potentiel lissage de decrochements comme pour Gen I

**Coherence lumiere** : Eclairage diffus sans source directionnelle visible. Pas de warm shift excessif (murs blancs neutres). Correct.

**Sol** : Parquet chene clair pose proprement. Joints reguliers. Pas d'artefact.

**Verdict sans input** : Visuellement propre, pas d'artefact flagrant. Suspicion de simplification plafond mais non confirmable.

---

### v51-D-pass1 (Salle de bain etroite, style Japandi)

**Artefacts de fusion** : AUCUN visible.

**Hallucination majeure — BAIGNOIRE AJOUTEE** : Cette pass1 montre une baignoire encastree au fond de la piece avec un tablier et une credence carrelee. Si l'input etait une piece vide de chantier (ce qui est le cas d'usage standard), la baignoire est un element SANITAIRE AJOUTE par le modele. C'est une hallucination d'element built-in — la passe 1 ne devrait installer QUE des finitions de surface (murs, sol, plafond, luminaire), jamais du sanitaire.

**Diagnostic** : Le surfacePrompt Japandi ne prescrit pas de baignoire. Le modele a probablement interprete la forme etroite de la piece comme une salle de bain et "complete" la scene. C'est le meme biais que l'hallucination de fenetres — le modele infere ce qui "devrait etre la".

**Spots encastres** : 2 spots au plafond qui n'etaient probablement pas dans l'input. Ajout modele.

**Luminaire** : Suspension boule en papier washi (type Akari). Coherent avec Japandi.

**Radiateur** : Un radiateur est visible en bas a droite — s'il etait dans l'input, c'est une bonne preservation. Sinon, c'est un ajout.

**Sol** : Parquet large chene clair. Propre.

**Verdict** : La baignoire hallucinee est un probleme P0. Si confirmee comme ajout, cette generation est INUTILISABLE pour un cas d'usage immobilier (elle invente un equipement). A verifier avec l'input original.

---

### v51-E-pass1 (Piece en travaux avec escabeau, style Boheme)

**Artefacts de fusion** : AUCUN visible.

**Elements de chantier NON nettoyes** :
- Un ESCABEAU est encore visible au centre-droit de la piece
- Du MATERIEL DE CHANTIER est visible au fond (baches, cartons, outils)
- Une PERSONNE (silhouette) est visible au fond a gauche dans un miroir ou une ouverture

**Diagnostic** : La passe 1 est censee transformer un espace brut en piece finie VIDE. Ici, les elements de chantier n'ont pas ete supprimes. Le modele a pose un parquet et nettoyé les murs mais a laisse tout le bric-a-brac de chantier. C'est un echec partiel de la directive de nettoyage.

**Mur accent** : Un pan de mur semble montrer de la brique/pierre apparente cote gauche — soit preservee de l'input (correct si c'etait un mur en pierre), soit texture hallucinee. Non confirmable.

**Luminaire** : Suspension osier/raphia visible, coherente avec Boheme.

**Sol** : Parquet chene moyen bien pose.

**Fenetre** : Une fenetre avec volets roulants noirs est visible a droite — semble authentique (pas d'hallucination).

**Verdict** : Le non-nettoyage des elements de chantier est un probleme utilisable comme cas de regression. Les murs et le sol sont corrects. La preservation spatiale semble bonne (porte blanche, retrait de mur, fenetre — tous en position credible).

---

### v51-F-pass1 (Piece vide, style Maximaliste)

**Artefacts de fusion** : AUCUN visible.

**Mur accent/couleur** : Le mur du fond montre un panneau VERT EMERAUDE encadre de bandes VIOLET FONCE. C'est potentiellement prescrit par le surfacePrompt Maximaliste — mais l'execution est suspecte :
- Les bandes violettes ont des bords tres nets et geometriques — presque trop parfaits
- Le vert et le violet ne se retrouvent nulle part ailleurs dans la piece — pas d'echo chromatique

**Miroir hallucine?** : Une zone rectangulaire doree/miroir est visible en bas du mur accent. Elle semble reflechir un parquet different (chevron clair vs parquet fonce du reste). C'est soit un miroir prescrit par le style, soit un artefact de generation. La reflexion incoherente du sol est un defaut.

**Luminaire** : Suspension Sputnik multi-bras avec globes colores (ambre, rouge, vert). Tres coherent avec le style Maximaliste. Belle piece.

**Plafond** : Blanc lisse. Pas de decrochement visible — potentiellement correct si l'input n'en avait pas.

**Sol** : Parquet fonce large lame. Propre, pas d'artefact.

**Fenetre** : UNE fenetre avec volets roulants visible. Position credible.

**Radiateur** : Un convecteur blanc est visible sous la fenetre — bonne preservation si present dans l'input.

**Coherence lumiere** : Eclairage naturel entrant par la fenetre droite, ombres coherentes. Le luminaire n'eclaire pas (correct, piece vide sans electricite).

**Verdict** : Visuellement audacieux (c'est du Maximaliste). Le miroir au sol avec reflexion incoherente est un artefact a surveiller. Le mur accent pourrait etre trop invasif si l'input avait des murs neutres — la passe 1 ne devrait pas ajouter de panneaux colores aussi dramatiques si ce n'est pas dans le surfacePrompt.

---

## Grille de notation et plan d'amelioration

*Section a completer en fin d'audit.*
