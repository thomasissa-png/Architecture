# Audit Passe 1 — Focus Preservation Structurelle v51/v52
## Yann Duval — 5 avril 2026

**Contexte** : Le fondateur a identifie des problemes graves de preservation en passe 1 (v51/v52) : poteau aminci, fenetre hallucinee, dalle ecrasee, plafond reinvente. Cet audit se concentre EXCLUSIVEMENT sur la fidelite structurelle input→pass1.

**Methode** : Comparaison systematique input vs pass1 sur 7 criteres structurels pour chaque generation.

---

## Generations auditees

| Gen | Version | Style | Type |
|-----|---------|-------|------|
| G | v52 | Scandinavian dining | pass1 |
| H | v52 | Scandinavian living | output (surfaces-only) |
| I | v52 | Art Deco chambre | pass1 + output |
| B | v51 | Bohemian chambre enfant | pass1 |
| D | v51 | Japandi bathroom | pass1 |
| E | v51 | Bohemian living | pass1 |
| F | v51 | Maximalist chambre | pass1 |

---

## 1. Gen G (v52) — Scandinavian dining, passe 1

### ALERTE : GENERATION PARTIELLEMENT TRAITEE — BUG DE RENDERING

**Constat immediat** : L'image pass1 montre une anomalie CRITIQUE — seule la moitie droite de l'image a ete traitee (murs blancs, sol oak). La moitie gauche reste a l'etat brut (beton, chantier). Il y a une ligne de transition diagonale nette au milieu de l'image, comme si un masque avait ete applique partiellement. Ce n'est pas un probleme de prompt — c'est un bug de pipeline/rendering.

**Grille structurelle (sur la zone TRAITEE, moitie droite) :**

| Critere | Verdict | Detail |
|---------|---------|--------|
| Poteaux/colonnes | PARTIELLEMENT PRESERVE | Les montants bois des baies vitrees sont visibles dans la zone de transition mais leur epaisseur semble correcte la ou ils sont traites |
| Fenetres | OK | Meme nombre de baies vitrees, positions coherentes |
| Plafond | DEGRADE | La voute beton de gauche est preservee (zone brute) mais la zone droite montre un plafond lisse blanc qui ne suit pas la courbure originale — la nervure/arete du plafond voute semble attenuee |
| Dalle/epaisseurs | N/A | Pas de mezzanine visible dans cette photo |
| Sol | OK (zone traitee) | Sol oak clair en lames larges, coherent Scandinavian — mais uniquement a droite |
| Murs | DEGRADE (zone traitee) | Murs blancs propres a droite, mais la transition brut→fini est aberrante |
| Equipements fixes | NON VERIFIABLE | La zone de transition rend l'evaluation impossible |

**Preservation spatiale : 3/10** — La generation est inutilisable en l'etat. La moitie gauche n'est pas traitee, et la zone traitee montre un aplatissement de la geometrie du plafond voute.

**Diagnostic** : Ceci ressemble a un probleme de masque ou de crop dans le pipeline, pas a un echec de prompt. A investiguer au niveau technique (route.ts).

## 2. Gen H (v52) — Scandinavian living, surfaces-only (meme photo que Gen A v51)

### ALERTE : PRESERVATION SPATIALE INSUFFISANTE — PLAFOND REINVENTE, POTEAU AMINCI, DALLE ECRASEE

C'est la meme photo que la Gen A (#184) signalee par le fondateur. Les problemes structurels identifies sur v51 sont TOUJOURS PRESENTS dans v52.

**Grille structurelle :**

| Critere | Verdict | Detail |
|---------|---------|--------|
| **Poteaux/colonnes** | AMINCI | Le poteau beton vertical entre les baies vitrees (centre-droit) a clairement perdu de l'epaisseur dans l'output. Dans l'input, c'est un element massif rectangulaire d'environ 25-30cm de large. Dans l'output, il est plus fin, plus lisse, et semble presque un montant de menuiserie. C'est un element PORTEUR — le modifier est une faute structurelle grave. |
| **Fenetres** | OK | Le nombre de baies vitrees et fenetres hautes est globalement preserve. Les 2 fenetres hautes a droite sont la, les baies du rez sont la. Pas de fenetre hallucinee visible sur cette generation (amelioration vs Gen A v51). |
| **Plafond** | REINVENTE | C'est le probleme le plus grave. L'input montre un plafond en dalle beton brut avec des nervures (poutrelles) longitudinales. L'output montre des POUTRES EN V / CHEVRONS blancs qui n'existent PAS dans l'original. Le modele a INVENTE une charpente apparente au lieu de respecter la geometrie plate nervuree existante. La forme du plafond est completement differente. |
| **Dalle mezzanine** | ECRASEE | La dalle de la mezzanine (nez de dalle beton visible cote double hauteur) a perdu son epaisseur. Dans l'input, on voit une dalle beton d'environ 20cm d'epaisseur avec un retour visible. Dans l'output, la dalle est amincie a environ 8-10cm, ce qui est structurellement incoherent avec du beton arme. |
| **Sol** | CORRECT | Sol en lames larges claires (pin/ash blanchis), coherent avec le style Scandinavian. Finition credible. |
| **Murs** | PARTIELLEMENT DEGRADE | Les murs sont blanchis (coherent avec le style). Cependant, le mur de gauche dans l'input montre un parement brut/pierre qui a ete partiellement preserve dans l'output — c'est positif, la directive "limewash on raw stone" semble fonctionner partiellement. Mais la geometrie du renfoncement sous la mezzanine semble legerement modifiee. |
| **Equipements fixes** | TUBE NEON DISPARU | L'input montre un tube neon horizontal au plafond (au-dessus de la mezzanine). Il est remplace par un luminaire PH5-style suspendu. Bien que ce soit le luminaire prescrit par le surfacePrompt Scandinavian, le remplacement est coherent avec la mission de la passe 1. Acceptable. |
| **Luminaire** | BON CHOIX | Le pendant PH5-style est bien positionne, a l'echelle, et typiquement Scandinavian. C'est un point positif. |

**Preservation spatiale : 4/10** — Le plafond reinvente (chevrons inventes au lieu de nervures beton) et le poteau aminci sont des fautes structurelles redhibitoires. La dalle ecrasee confirme que le modele ne comprend pas les epaisseurs de beton. Note plafonnee a 5/10 max, et les deformations multiples la font descendre a 4.

**Ce qui fonctionne** : Sol, luminaire PH5, blanchiment general des murs. La direction stylistique est correcte.

**Ce qui echoue** : Tout ce qui est STRUCTURE PORTANTE — poteaux, dalles, plafond. Le modele traite ces elements comme des surfaces a lisser au lieu de les preserver.

## 3. Gen I (v52) — Art Deco chambre, passe 1 + output

### BONNE PRESERVATION — Piece geometriquement simple, bien geree

Cette generation est la MEILLEURE de l'audit. La piece d'input est une chambre rectangulaire simple en chantier (placo, cables electriques, sol brut) sans complexite structurelle (pas de poutres, pas de mezzanine, pas de colonnes).

**Grille structurelle (pass1) :**

| Critere | Verdict | Detail |
|---------|---------|--------|
| Poteaux/colonnes | PRESERVE | Le retour de mur central (pilastre entre les 2 zones) est preserve, meme epaisseur, meme position. |
| Fenetres | OK (SANS FENETRE) | L'input n'a pas de fenetre visible — la pass1 non plus. Aucune hallucination. |
| Plafond | CORRECT | Plafond plat dans l'input, plafond plat dans la pass1. Lisse blanc, coherent. Pas de voute/poutre a preserver = pas de risque de destruction. |
| Dalle/epaisseurs | N/A | Pas de mezzanine. |
| Sol | EXCELLENT | Parquet herringbone fonce (dark stained), parfaitement Art Deco. Le motif est regulier, l'echelle des lames est credible. C'est exactement ce que le surfacePrompt prescrit. |
| Murs | CORRECT | Murs blancs propres avec plinthes et corniche subtile. Les cables electriques et boitiers sont NETTOYES — la directive de nettoyage des prises fonctionne. |
| Equipements fixes | NETTOYES | Tous les boitiers electriques bleus, cables pendants et attentes plafond sont correctement couverts. |
| Luminaire | EXCELLENT | Suspension geometrique laiton/verre givre, typiquement Art Deco. Bien centree, a l'echelle. |

**Preservation spatiale pass1 : 8.5/10** — La geometrie est fidele. L'angle de vue est le meme. Les proportions de la piece sont preservees. La seule reserve : le plafond semble un peu plus "parfait" (aucune imperfection du placo visible), mais c'est mineur sur une piece deja presque finie.

**Output complet (pass1 → meuble) :**

La passe 2 est REMARQUABLE. Le mobilier Art Deco est coherent et bien distribue :
- Lit king-size avec tete de lit channel-tufted cream, cadre fonce — tres Ruhlmann
- Armoire dark wood avec incrustations geometriques dorees — signature Art Deco
- Fauteuil accent velours emeraude — couleur juste, silhouette club 30s
- Banc de pied de lit dark wood/velours emeraude avec fermoir dore
- 2 tables de chevet assorties avec lampes a abat-jour
- Tapis oversize cream sous le lit

Les surfaces pass1 sont INTACTES dans l'output : meme sol herringbone, memes murs, meme luminaire, meme corniche. Le pipeline 2 passes fonctionne parfaitement ici.

**Preservation spatiale output : 8.5/10**
**Fidelite stylistique : 9/10** — Art Deco tres credible, palette emeraude/laiton/cream/dark wood, silhouettes justes
**Credibilite pro : 8.5/10** — Presentable a un client sans hesitation

**Note globale Gen I : 8.5/10** — La meilleure generation de cet audit. MAIS : la piece est geometriquement simple (rectangle, plafond plat, pas de structure complexe). Le vrai test du pipeline est sur les pieces complexes (Gen H, Gen G).

## 4-7. Pass1 v51 (B, D, E, F) — SANS INPUTS

**ATTENTION** : Les images INPUT n'ont pas ete fournies pour ces 4 generations. L'analyse est limitee a l'observation des pass1 seules — je signale les anomalies visibles mais ne peux pas calculer une note de preservation spatiale sans comparaison.

### 4. Gen B (v51) — Bohemian chambre enfant, passe 1

**Observations pass1 seule :**
- Piece rectangulaire simple, murs blancs, sol lames bois clair (honey-toned, coherent Bohemian)
- Luminaire : suspension rattan/osier — correct pour Bohemian
- Le plafond montre un DECROCHEMENT (faux plafond partiel cote gauche) — si ce decrochement existait dans l'input, c'est un point positif de preservation. S'il est invente, c'est un defaut.
- Aucun boitier electrique visible = nettoyage OK
- Le retour de mur (pilastre) entre les 2 zones est present
- **Verdict sans input : apparence propre, pas d'anomalie evidente, mais impossible de confirmer la fidelite**

### 5. Gen D (v51) — Japandi bathroom, passe 1

**Observations pass1 seule :**
- Salle de bain etroite en couloir avec baignoire encastree au fond
- Sol : lames bois clair (ash) — coherent Japandi MAIS problematique pour une salle de bain (bois massif dans une piece humide = rare en vrai, sauf teck/iroko)
- Murs : enduit mineral beige/taupe clair en soubassement, blanc au-dessus — credible
- Luminaire : sphere washi paper (Noguchi-style) — parfaitement Japandi
- 2 spots encastres au plafond — suggerent qu'ils existaient dans l'input (preserve)
- **Radiateur/convecteur preserve** sur le mur droit — POSITIF, la directive d'equipement fonctionne
- Robinetterie baignoire visible et coherente
- **Verdict sans input : rendu credible, Japandi bien capture pour une SDB. Le radiateur preserve est un bon signe.**

### 6. Gen E (v51) — Bohemian living, passe 1

**Observations pass1 seule :**
- Piece de vie avec grande fenetre a droite (store/volet roulant baisse)
- **ANOMALIE CRITIQUE** : une PERSONNE est visible a gauche de l'image (silhouette dans un miroir ou reflet). De l'OUTILLAGE de chantier (echelle, materiel) est encore visible au centre. La passe 1 n'a PAS nettoye les elements de chantier. C'est un echec : la passe 1 doit livrer une piece VIDE et FINIE.
- Sol : lames bois honey-toned — coherent Bohemian
- Murs : blancs avec un pan de mur en parement pierre/brique visible a gauche — si c'est un mur accent preserve, c'est positif
- Luminaire : suspension rattan — coherent
- Porte blanche preservee a gauche
- **Verdict sans input : ECHEC partiel — elements de chantier non nettoyes, personne non retiree. Le nettoyage de scene fait partie de la mission de la passe 1.**

### 7. Gen F (v51) — Maximalist chambre, passe 1

**Observations pass1 seule :**
- Chambre avec une fenetre a droite
- **ANOMALIE GRAVE : MUR ACCENT INVENTE** — Le mur de gauche est peint en vert emeraude fonce avec une BANDE VIOLETTE. Il y a aussi un panneau ou miroir avec un reflet dore. Ce mur bi-colore vert/violet est extremement agressif et ne correspond PAS a un surfacePrompt Maximalist typique (qui prescrit "bold jewel-toned walls" mais pas du bi-colore geometrique aussi brutal).
- **QUESTION CRITIQUE** : ce mur vert/violet existait-il dans l'input ? Si oui, il a ete preserve (bien). Si non, le modele a HALLUCINE un traitement mural excessif en passe 1.
- Sol : parquet fonce (dark wood) — coherent Maximalist
- Luminaire : suspension Sputnik multi-sphere colorees (laiton + boules de verre colorees) — coherent Maximalist, bien execute
- Radiateur/convecteur preserve en bas a droite — POSITIF
- La fenetre est a sa place avec un cadre coherent
- **Verdict sans input : le luminaire et le sol sont bons, mais le mur vert/violet est suspect sans l'input de reference. Si invente = defaut grave en passe 1.**

---

## Synthese et patterns recurrents

### Pattern 1 : STRUCTURE PORTANTE SYSTEMATIQUEMENT DEGRADEE SUR PIECES COMPLEXES
Les poteaux beton, dalles de mezzanine, et nervures de plafond sont AMINCIS, APLANIS ou REINVENTES par le modele. C'est le probleme le plus grave. Gen H (v52) confirme que les corrections v52 n'ont PAS resolu ce probleme par rapport a v51 (Gen A #184).

**Cause probable** : Le modele interprete "white ceiling finish" comme "plafond lisse" et aplani/remplace les geometries complexes (voutes, nervures, poutres IPN). La directive "preserving any vault beams or structural ribs" n'est pas suffisamment forte face a la pression du style.

### Pattern 2 : PIECES SIMPLES = EXCELLENTES, PIECES COMPLEXES = ECHEC
- Gen I (chambre rectangulaire, plafond plat) → 8.5/10, quasi parfaite
- Gen H (mezzanine + double hauteur + poteaux beton) → 4/10, structurellement detruite

Le pipeline fonctionne UNIQUEMENT sur les pieces a geometrie simple. Des que la structure porte des elements singuliers (poteaux, mezzanines, voutes, poutres), le modele les "simplifie".

### Pattern 3 : BUG DE RENDERING PARTIEL (Gen G)
La Gen G montre une image coupee en deux (moitie brute / moitie traitee). Ce n'est pas un probleme de prompt — c'est un bug technique a investiguer cote pipeline.

### Pattern 4 : NETTOYAGE DE CHANTIER INCOMPLET (Gen E)
La pass1 n'a pas retire l'echelle de chantier ni la silhouette humaine. La directive de nettoyage est insuffisante ou ignoree quand il y a beaucoup d'elements parasites.

### Pattern 5 : MUR ACCENT SUSPECT (Gen F)
Le mur vert/violet de Gen F Maximalist est potentiellement hallucine. Sans l'input, impossible de trancher, mais le traitement est tres agressif pour une passe 1.

### Pattern 6 : CE QUI FONCTIONNE BIEN
- Luminaires par style : PH5 Scandinave, washi Japandi, Sputnik Maximalist, laiton/verre Art Deco — tous credibles et bien positionnes
- Sol par style : herringbone Art Deco, ash Japandi, honey Bohemian — coherents
- Radiateurs/convecteurs : preserves dans Gen D et Gen F — la directive EQUIPMENT_PRESERVATION fonctionne
- Nettoyage electrique : Gen I impeccable (tous les boitiers/cables couverts)

---

## Notes de preservation spatiale (generations avec input)

| Gen | Version | Style | Preservation spatiale | Note globale |
|-----|---------|-------|-----------------------|--------------|
| G | v52 | Scandinavian dining | 3/10 (bug rendering) | 3/10 |
| H | v52 | Scandinavian living | 4/10 (plafond reinvente, poteau aminci, dalle ecrasee) | 4/10 |
| I | v52 | Art Deco chambre | 8.5/10 | 8.5/10 |

---

## Plan d'amelioration

### P0 — CRITIQUE : Fix rendering partiel (Gen G)
**Bug technique** : l'image est traitee sur la moitie seulement. Investiguer route.ts / pipeline pour identifier pourquoi le modele ne traite qu'une partie de l'image. Ce n'est pas un probleme de prompt.
**Action** : @fullstack — debug du pipeline de generation, verifier si le probleme est lie au format/taille de l'input ou a un masque residuel.

### P0 — CRITIQUE : Renforcement preservation structures portantes
**Probleme** : "preserving any vault beams or structural ribs" ne suffit pas. Le modele ne distingue pas STRUCTURE (porteur, intouchable) de FINITION (modifiable).
**Action dans les builders passe 1** : Ajouter une directive SEPAREE, en position haute dans le prompt (premiers tokens = plus d'influence) :

```
STRUCTURAL LOCK — The following elements are LOAD-BEARING and must remain PIXEL-IDENTICAL in shape, thickness, and position:
- Concrete columns and posts (preserve exact width and depth)
- Floor slabs and mezzanine edges (preserve exact thickness — typically 20-25cm for reinforced concrete)
- Ceiling ribs, beams, vaults, arches (preserve exact geometry — do NOT replace with different beam patterns)
- Steel beams (IPN/IPE) — preserve exact profile
If the input shows a ribbed concrete ceiling, the output must show the SAME ribs in the SAME positions. Do NOT replace with chevrons, rafters, or any other pattern.
```

**Pourquoi "PIXEL-IDENTICAL in shape"** : le modele comprend "preserve" comme "keep roughly similar". Il faut etre plus contraignant sur la forme geometrique exacte.

### P1 — HAUTE : Segregation plafond/poutres dans le prompt
**Probleme** : "white ceiling finish applied over existing ceiling geometry" est ambigu — le modele interprete "finish" comme "refaire le plafond en blanc lisse".
**Action** : Separer en 2 directives distinctes :
1. "Apply white paint to the ceiling surface BETWEEN structural elements"
2. "Structural elements (beams, ribs, vaults, columns) keep their ORIGINAL material appearance — concrete stays concrete, wood stays wood, steel stays steel"

Cela empeche le modele de "lisser" les poutres en les integrant dans un plafond blanc uniforme.

### P1 — HAUTE : Preservation epaisseur dalles
**Probleme** : le modele amincit les dalles beton (20cm → 8cm) car il ne comprend pas l'epaisseur structurelle.
**Action** : Ajouter dans STRUCTURAL LOCK :
"Horizontal concrete slabs (mezzanine floors, balconies, overhangs) must keep their visible edge thickness — typically 20-25cm. Do NOT thin them down."

### P1 — HAUTE : Preservation epaisseur poteaux
**Probleme** : les poteaux beton sont amincis car le modele les traite comme des montants de menuiserie.
**Action** : Ajouter dans STRUCTURAL LOCK :
"Concrete columns are typically 25-40cm wide. If a column in the input appears thick and massive, keep it thick and massive. Do NOT reduce to a thin mullion."

### P2 — MOYENNE : Nettoyage elements de chantier
**Probleme** : Gen E n'a pas retire l'echelle et la personne.
**Action** : Ajouter une directive explicite :
"Remove all construction debris, scaffolding, ladders, tools, and people from the scene. Fill vacated areas with the surrounding wall/floor texture."
Position : apres les directives de surface, avant les contraintes de preservation.

### P3 — BASSE : Detection complexite structurelle
**Recommandation long terme** : Categoriser les photos input par complexite structurelle AVANT la generation :
- Simple (rectangle, plafond plat) → prompt standard
- Complexe (poutres, mezzanine, colonnes, voutes) → prompt avec STRUCTURAL LOCK renforce + guidance plus haute (Flux) ou temperature plus basse

Cela permettrait d'adapter automatiquement le niveau de contrainte au type de piece.

### P4 — OBSERVATION : Verification des murs accent (Gen F)
**Action** : Demander au fondateur de fournir l'input de Gen F pour confirmer si le mur vert/violet est preserve ou hallucine. Si hallucine → renforcer la contrainte "Do not add bold colors to walls unless the style explicitly prescribes them AND the input walls are plain."

---

## Conclusion

**Score moyen des 3 generations evaluables : 5.2/10** (moyenne de 3, 4, 8.5)

Le pipeline v52 est a DEUX VITESSES :
- **Pieces simples** : excellent (8.5/10, Gen I Art Deco) — les surfaces, sols, luminaires, et nettoyage electrique sont au niveau. La passe 2 ajoute du mobilier coherent sans denaturer les surfaces.
- **Pieces complexes** : echec structurel (3-4/10, Gen G et H) — les elements porteurs (poteaux, dalles, plafond) sont systematiquement degrades.

La priorite absolue est le STRUCTURAL LOCK pour les elements porteurs. Sans cette correction, le pipeline n'est fiable que sur les photos d'appartements neufs a geometrie simple — ce qui exclut les lofts, les biens anciens, les rehabilitations, et les chantiers bruts complexes, qui sont justement la cible PRINCIPALE de Versimo (marchands de biens, architectes).

---

*Rapport par Yann Duval — Architecte d'interieur, 20 ans d'experience*
*Audit croise recommande avec Lucas Moreau (@ai-image-expert) pour le diagnostic technique du bug de rendering Gen G*
