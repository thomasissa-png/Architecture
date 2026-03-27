# Audit visuel v24 — Generations #45-47 — Yann Duval, Architecte d'interieur

Date : 2026-03-27
Pipeline : v24, 2 passes (surfaces puis mobilier)
Modele : GPT-4.1 via Responses API (presume)

## Avertissement methodologique

Les images input de ce batch sont des photos Unsplash DEJA MEUBLEES, pas des pieces vides. Le pipeline Versiroom est concu pour des pieces vides. Cela biaise le test de deux facons :
1. La passe 1 (surfaces) doit "effacer" du mobilier existant avant de traiter les finitions — ce n'est pas son role
2. La preservation geometrique est plus difficile a evaluer car l'input contient des objets qui interferer avec la lecture spatiale

J'evalue neanmoins la qualite stylistique du resultat final, qui reste le critere pertinent pour Thomas, Claire et Lea.

---

## Tableau recapitulatif

| # | Style | Fidelite (x2) | Vocab. | Hero | Matieres | Eclairage | Credib. (x2) | Complet. | Diff. | Adapt. | Photo. | **Moy. pond.** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 45 | Contemporain | 8 | 8 | 7 | 8 | 7 | 8 | 7 | 7 | 7 | 7 | **7.5** |
| 46 | Boheme | 8 | 9 | 8 | 8 | 7 | 8 | 8 | 9 | 7 | 7 | **7.9** |
| 47 | Wabi-Sabi | 9 | 9 | 8 | 9 | 8 | 9 | 8 | 9 | 8 | 7 | **8.5** |

Moyenne globale batch : **8.0/10** (+2.5 pts vs batch #37-42)

---

## Analyses par generation

### #45 Contemporain — Note 7.5/10

**Input** : Photo Unsplash d'une chambre meublee (cadrage serre) — lit noir avec coussin jaune, tete de lit tissu sombre, applique murale laiton, 2 cadres line art, table de chevet ronde grise, fond bois clair. Piece deja tres stylisee, palette gris/noir/bois/moutarde.

**Passe 1** : Le modele a genere une piece completement differente — murs blancs lisses avec une bande horizontale (cimaise ou boiserie basse), sol clair neutre. L'angle a totalement change (vue frontale large vs cadrage serre en plongee). La piece passe d'une chambre compacte a ce qui ressemble a un salon rectangulaire genereux. C'est une REGENERATION, pas une edition. Le changement de piece/angle est un probleme grave de preservation — mais attendu puisque l'input n'etait pas vide.

**Output (passe 2)** : Salon contemporain avec canape en L charcoal (texture bouclette lisible), table basse ronde sur socle laiton avec plateau verre fume, lampadaire arc laiton/globe opalin, tapis gris clair neutre grand format. A droite : console metallique noire avec sculpture abstraite blanche, plante (sansevieria en pot noir). A gauche : seconde lampe globe sur pied laiton (table d'appoint). Tableau abstrait grand format appuye contre le mur (non accroche — geste editorial correct). Quelques livres empiles sur la table basse.

**Points forts :**
- Le vocabulaire contemporain est JUSTE : palette charcoal/gris/laiton, pas de couleur criarde, lignes epurees, mobilier bas et horizontal. Ca sent le Van Duysen ou le Joseph Dirand early work.
- La table basse verre fume sur socle laiton est une hero piece credible pour ce style — elle ancre le contemporain editorial.
- La composition est equilibree : masse principale (canape) a gauche, elements verticaux (lampadaire, plante) a droite, pas de vide derangeant.

**Problemes :**
- **P0** : L'angle de camera a totalement change entre input et output. La piece elle-meme est differente. Probleme de preservation geometrique grave — mais cause par l'input meuble, pas par un defaut pipeline sur piece vide.
- **P1** : Le lampadaire arc laiton/globe opalin est EXACTEMENT le "marqueur IA" identifie dans les audits precedents (#117, #132). C'est le lampadaire que TOUS les modeles generatifs posent par defaut. Pour du Contemporain editorial, je voudrais voir un Flos IC F2, un Arco Castiglioni, ou au minimum un lampadaire tubulaire minimaliste type Michael Anastassiades. L'arc + globe est trop generique.
- **P1** : Il y a DEUX lampes globe opalin (une au sol, une a gauche sur le meuble). La repetition du meme element affaiblit la composition — en design, on cherche la VARIATION dans la continuite, pas la duplication.
- **P2** : Le rendu est tres propre, presque trop — il manque le grain photographique ISO 200 et le vignettage naturel qui separent "photo" de "CGI". Les ombres sont douces et correctes mais uniformes.

---

### #46 Boheme — Note 7.9/10

**Input** : Photo Unsplash d'une chambre meublee — lit queen gris clair, coussins bleus et carreaux, cadre photo cheval noir et blanc, table de chevet geometrique laiton/marbre, lampe mercure, chaise noire avec gueridon vitree, tapis gris, plinthes blanches. Piece bien eclairee par une fenetre a droite (lumiere naturelle froide). Sol parquet fonce. Style existant : contemporain neutre/froid.

**Passe 1** : Transformation remarquable. La piece conserve sa geometrie (angle identique, fenetre au meme endroit avec la meme vue exterieure, convecteur bas preserve). Les murs sont passes d'un blanc froid a un blanc creme chaud. Le sol est passe du parquet fonce a un parquet clair miel/chene. Le luminaire plafond est devenu un plafonnier en rotin tresse — parfaitement coherent avec le Boheme. Les plinthes blanches sont conservees. C'est une passe 1 EXEMPLAIRE : geometrie preservee, finitions transformees, piece vide prete pour le mobilier.

**Output (passe 2)** : Canape lin ecru genereux avec 5-6 coussins (kilim terracotta, indigo, motif ethnique, brun chaud), table basse ronde bois brut (chene ou manguier), fauteuil paon en rotin naturel avec coussin fourrure (detail excellent), grand tapis kilim/persan use dans les tons rouille/terre, plantes suspendues (pothos en macrame au plafond), grande plante en pot vannerie (monstera ou ficus), lanterne photophore au sol, herbes de pampas dans un vase sur tabouret bois. La fenetre est conservee, le convecteur aussi.

**Points forts :**
- La FIDELITE STYLISTIQUE est excellente. C'est du Boheme textbook : superposition de textures (lin, rotin, kilim, fourrure, vannerie), palette terre chaude, accumulation vegetale, mobilier artisanal. Ca rappelle les interieurs de Justina Blakeney ou les riads revisites.
- Le fauteuil paon en rotin est LA hero piece du Boheme — sa presence ancre immediatement le style. Le coussin fourrure sur l'assise est un detail de styliste qui fait "vecu".
- La distribution spatiale est bonne : canape au fond, fauteuil a droite, plantes en hauteur (macrame) et au sol — on occupe les 3 plans.
- La DIFFERENCIATION est forte : aucune confusion possible avec un autre style. C'est clairement du Boheme, pas du Scandinave ni du Cosy.

**Problemes :**
- **P1** : L'echelle du canape semble un peu grande par rapport a la piece (chambre convertie en salon). Un canape 2 places ou un canape plus compact serait plus adapte a ce volume. La piece parait remplie a 75-80% alors qu'un Boheme "habite" fonctionne mieux a 65-70% — il faut respirer entre les layers.
- **P1** : Le rendu a un leger warm shift — les murs sont plus dores/jaunes que ce que le blanc creme de la passe 1 laissait presager. C'est coherent avec le Boheme mais il faut surveiller que ce ne soit pas un color grading IA systematique.
- **P2** : Le grain photo est discret mais present (meilleur que le Contemporain #45). Les ombres portees du canape et du fauteuil sont lisibles. Le photoralisme est correct sans etre exceptionnel — on est dans du "bon rendu 3D" plutot que "photo immobiliere reelle".
- **P2** : Le sol visible entre les meubles est un peu trop uniforme/lisse — un vrai parquet chene miel aurait des variations de teinte et des joints plus visibles a cette echelle.

---

### #47 Wabi-Sabi — Note 8.5/10

**Input** : Meme photo Unsplash que le Contemporain #45 — chambre avec lit noir, coussin jaune, cadres line art, applique laiton. Cadrage serre.

**Passe 1** : Le modele a genere un espace completement different (meme probleme que #45 — input meuble). Mais le resultat de la passe 1 est SAISISSANT : une piece cube austere aux murs enduits gris-taupe avec des imperfections de surface visibles (traces de taloche, variations de teinte), sol beton brut lisse, plafond dans le meme ton. Un suspension ceramique mat non emaille (forme cloche tronquee) pend au centre. La lumiere est sourde, enveloppante, sans source directe visible — elle vient d'en haut a gauche avec un falloff naturel vers les coins. C'est une piece qui RESPIRE le Wabi-Sabi avant meme qu'un seul meuble y entre.

**Output (passe 2)** : Canape bas en lin froisse grege/sable (2.5 places environ, coussins volumineux destructures), table basse massive en bois use/recycle (planches epaisses, patine visible, joints rustiques), tapis jute/sisal rectangulaire sous l'ensemble. A droite du canape : un vase ceramique gres avec une branche seche unique (ikebana tres depouille). Au sol devant la table : un bol/coussin de meditation gris pierre. En arriere-plan a droite : petit banc/tabouret bois ancien use. La suspension ceramique de la passe 1 est parfaitement preservee. Le ratio sol vide est d'environ 50-55% — proche de l'objectif 60%.

**Points forts :**
- C'est la meilleure generation de ce batch et potentiellement l'une des meilleures que j'ai auditees. La COHERENCE MATIERE est exceptionnelle : tout parle le meme langage — enduit brut, ceramique non emaillee, lin froisse, bois use, jute. Il n'y a AUCUN element dissonant.
- L'ATMOSPHERE est juste. Leonard Koren ecrit que le Wabi-Sabi est "beauty in imperfection and transience" — cette image le capture. La lumiere sourde, les murs imparfaits, la branche seche, le coussin de meditation. On ressent la quietude.
- L'ECHELLE est parfaitement maitrisee : canape bas (assise ~35cm), table basse proportionnelle, tabouret en retrait — tout est ancre au sol, pas de verticalite inutile. Le mobilier "habite" le sol sans envahir l'espace.
- La palette monochrome taupe/grege/bois sombre est d'une coherence remarquable. Pas un seul accent de couleur — et c'est exactement ce que le Wabi-Sabi demande.
- La DIFFERENCIATION est maximale : aucune confusion possible avec le Boheme (pas de couleur, pas de motif, pas de plante exuberante) ni le Japandi (pas de symetrie, pas de bois clair scandinave).

**Problemes :**
- **P1** : L'angle de camera a change (meme probleme que #45 — input meuble). Pas un defaut pipeline sur piece vide.
- **P2** : Le ratio sol vide est a ~50-55% au lieu de 60%. Le coussin de meditation au sol + le tapis jute remplissent un peu trop le premier plan. En retirant le coussin, on serait dans la cible.
- **P2** : Le rendu, bien que tres atmospherique, a un aspect legerement "CGI moody" — les murs enduits sont presque TROP parfaitement imparfaits. Un vrai enduit a la chaux aurait des irregularites plus aleatoires, des traces de reprise plus nettes. C'est une critique de luxe — pour 95% des clients de Versiroom, ce rendu est plus que suffisant.
- **P2** : Le grain photographique est present mais discret. On est sur du ISO 100 plutot que ISO 200 — ca ajoute a l'impression "CGI clean" malgre la palette organique.

---

## Synthese et patterns

### Progression notable

Ce batch marque une progression significative par rapport aux generations #37-42 (moyenne 5.5 → 8.0). Trois facteurs expliquent ce saut :

1. **Les stylePrompts sont matures** : le vocabulaire de mobilier, les hero pieces et les palettes sont specifiques et justes. Le Boheme a son fauteuil paon, le Wabi-Sabi a son enduit brut et sa branche seche. On ne confond plus les styles.
2. **La passe 2 fonctionne** : le mobilier est ajoute sans detruire les surfaces de la passe 1. La suspension ceramique du Wabi-Sabi survit a la passe 2 intacte. Le convecteur du Boheme aussi.
3. **La distribution spatiale est meilleure** : plus de "mur de meubles au premier plan" — le mobilier occupe la profondeur (banc en arriere-plan Wabi-Sabi, plantes suspendues Boheme).

### Problemes recurrents

| Priorite | Probleme | Generations | Diagnostic |
|---|---|---|---|
| P0 | Input meuble = regeneration au lieu d'edition | #45, #47 | Attendu — le pipeline n'est pas concu pour ca. Non bloquant en production (inputs = pieces vides). |
| P1 | Lampadaire arc laiton/globe = marqueur IA generique | #45 | Deja identifie aux audits #117, #132. Le Contemporain devrait avoir un luminaire plus editorial (Flos IC, tube Anastassiades). |
| P1 | Duplication d'elements (2 globes opalin identiques) | #45 | Le modele genere des paires au lieu de varier les pieces — manque de directive de variation. |
| P2 | Grain photo insuffisant, rendu CGI-clean | #45, #47 | Le descripteur "ISO 200 grain" n'est pas assez fort — le modele genere du lisse par defaut. |
| P2 | Warm shift leger | #46 | La passe 2 rechauffe legerement les murs — coherent avec le Boheme mais a surveiller sur les styles froids. |

### Classement stylistique

1. **Wabi-Sabi #47 (8.5)** — Meilleure generation. Coherence matiere exceptionnelle, atmosphere juste, echelle maitrisee. Proche de ce qu'Axel Vervoordt proposerait.
2. **Boheme #46 (7.9)** — Tres convaincant. Le fauteuil paon, le kilim, les plantes suspendues ancrent le style. Distribution spatiale correcte malgre un leger surmeublage.
3. **Contemporain #45 (7.5)** — Correct mais generique. Le lampadaire arc et la duplication des globes trahissent l'IA. Il manque une piece plus affirmee pour passer de "showroom ameublement" a "editorial Architectural Digest".

### Verdict

Un architecte d'interieur montrerait-il ces images a un client ?
- **Wabi-Sabi #47** : OUI sans hesitation. C'est du travail propre.
- **Boheme #46** : OUI avec une reserve sur l'echelle du canape. Mais l'ambiance est vendeuse.
- **Contemporain #45** : OUI MAIS en precisant que c'est une base de travail. Le lampadaire devrait etre change et la deuxieme lampe globe retiree.

Pour Thomas (marchand de biens), les 3 sont utilisables en plaquette commerciale. Pour Claire (architecte), le Wabi-Sabi est un vrai support de conversation. Pour Lea (particuliere), le Boheme est Instagram-worthy.

---

## Handoff

- **Destinataire** : @ai-image-expert (Lucas Moreau) pour audit technique croise
- **Fichiers** : ce document (`docs/reviews/audit-visuel-v24-yann-batch1.md`)
- **A evaluer par Lucas** : preservation geometrique sur input vide (test a faire), grain photo, ombres portees, coherence lumiere passe 1 → passe 2
- **Priorites pour le pipeline** : P1 lampadaire arc generique sur Contemporain, P2 grain photo
