# Audit visuel generations #31-36 — Yann Duval, Architecte d'interieur

Date : 2026-03-26

## Tableau recapitulatif

| # | Style | Type | Fidelite (x2) | Vocab visuel | Hero pieces | Matieres | Eclairage | Credibilite (x2) | Completude | Diff. | Adapt. spatiale | Photorealisme | **Moyenne ponderee** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 31 | Scandinavian | 2 passes | 8.5 | 8 | 8 | 8.5 | 8 | 8 | 7.5 | 8 | 7 | 8.5 | **8.1** |
| 32 | Japandi | 2 passes | 8 | 8.5 | 7.5 | 8 | 8.5 | 7.5 | 6.5 | 8 | 6.5 | 8 | **7.7** |
| 33 | Japandi iter. | iteration | 5 | 5 | 4 | 5 | 7 | 4 | 3 | 4 | 5 | 6 | **4.8** |
| 34 | Contemp. outdoor | passe 1 | 7 | 6 | N/A | 7 | 7.5 | 7 | 6 | 5 | 7 | 7.5 | **6.7** |
| 35 | Contemp. outdoor iter. | iteration | 5.5 | 5 | 4 | 5 | 5 | 4.5 | 3 | 4 | 5 | 5.5 | **4.8** |
| 36 | Scandinavian | passe 1 | 8.5 | 8 | 7.5 | 8 | 9 | 8.5 | 7 | 8 | 8 | 8.5 | **8.2** |

**Moyenne globale : 6.7/10** (tiree vers le bas par les iterations #33 et #35)
**Moyenne hors iterations : 7.7/10**

## Analyses par generation

### #31 Scandinavian 2 passes — 8.1/10
Input : piece en chantier brut, dalle beton, placoplâtre apparent avec câbles electriques pendants, zero fenetre visible, plafond brut avec joints. Pass1 : transformation remarquable — sol en lames de chene clair large, murs blanc mat propre, luminaire PH5-style en suspension centrale avec lueur chaude diffuse. Piece vide, propre, credible. Output : canape 3 places lin ecru, fauteuil frene naturel avec assise cordage (Wegner-style), table basse chene fuselee, 2 lampadaires noirs asymetriques (AJ-style), tapis ecru, coussins motifs geometriques nordiques, petites ceramiques et branchages secs. Geometrie parfaitement preservee — angle de vue, proportions murs, recoin gauche. Seul bémol : la piece parait un peu etroite visuellement, le mobilier est concentre au centre sans zone secondaire en profondeur.

### #32 Japandi 2 passes — 7.7/10
Meme input que #31. Pass1 : luminaire boule washi Akari-style, sol chene clair, murs blanc chaud. Le recoin gauche est MOINS lisible que dans le #31 — le retrait mural est simplifie. Des boîtiers electriques restent visibles sur le mur droit (2-3 points noirs). Output : canape bas structure bois clair avec assise beige, table basse rectangulaire chene tres basse, coussin de sol terracotta, vase gres sombre avec branche seche, theiere fonte sur gueridon, orchidee blanche. Tapis jute. Composition asymetrique reussie (wabi). Densite faible, coherente Japandi (~35% occupation sol). Bémol : le recoin gauche reste vide et montre encore un boîtier mural — la passe 1 n'a pas nettoye tous les artefacts de chantier.

### #33 Japandi iteration "etageres murales" — 4.8/10
Les etageres sont PRESENTES : deux meubles etageres en metal noir, structure grille, places contre les murs gauche et droit. MAIS : ce ne sont PAS des etageres murales (fixees au mur) — ce sont des etageres sur pieds autoportantes. Le mobilier Japandi du #32 (canape, table basse, coussin, vase) a COMPLETEMENT DISPARU. La piece est quasiment vide avec juste ces deux meubles. Le luminaire washi est preserve. Le sol a change de teinte (plus dore/jute). Le boîtier electrique mural gauche avec câbles est toujours visible. Echec fonctionnel : l'iteration devait AJOUTER des etageres au rendu existant, pas remplacer tout le mobilier.

### #34 Contemporain outdoor passe 1 — 6.7/10
Input : cour interieure en chantier, structure metallique type atelier/verriere avec arcs en acier, baies vitrees avec chassis noirs, double hauteur, sol terre battue, tuyaux descente EP visibles, porte bois a gauche, petite fenetre carreaux de verre. Output passe 1 : sol carrelage gris clair grand format — propre et credible. Structure metallique preservee. Chassis et baies vitrees intacts. La grille de sol est conservee. Tuyaux de descente conserves. Bonne preservation geometrique globale. Bémols : les vitrages paraissent legerement plus opaques/propres que l'input (acceptable), la porte bois a gauche est un poil simplifiee.

### #35 Contemporain outdoor iteration — 4.8/10
Un canape d'angle gris anthracite sur pieds metal noir est pose au centre de la cour. L'image a perdu en luminosite et en nettete par rapport au #34 — les surfaces paraissent plus ternes, presque grises, comme si un filtre desaturant avait ete applique. Le sol revient vers une teinte beton brut au lieu du carrelage propre du #34. Le canape est stylistiquement correct (contemporain outdoor), mais la composition est pauvre : un seul meuble, pas de plantes, pas de table d'appoint, pas d'eclairage exterieur. L'iteration a degrade les acquis de la passe 1 (sol, luminosite) au lieu de les preserver.

### #36 Scandinavian passe 1 — 8.2/10
Input : piece avec murs violet/aubergine intense, parquet bois miel, fenetre haute avec chassis blanc, convecteur electrique sous fenetre, vue sur mur de briques exterieur. Output : murs blanc pur, sol en lames de pin clair blanchi, luminaire PH5-style suspendu, convecteur PRESERVE (repeint en blanc/creme, integre). Fenetre intacte — forme, chassis, proportions, vue sur briques. La lumiere naturelle laterale est magnifiquement preservee avec le gradient d'ombre sur le mur droit. Excellent travail de finition : la transformation violet → blanc est totale et credible. Le convecteur est un progres majeur (cf. Sprint 18 #147 preservation equipements fixes).

## Patterns visuels recurrents

1. **Pipeline 2 passes valide** : les generations completes (#31, #32) sont significativement meilleures que les iterations (#33, #35). Le pipeline surfaces → mobilier fonctionne.
2. **Iterations destructrices** : #33 et #35 montrent que le mode iteration REMPLACE au lieu d'AJOUTER. Le mobilier existant disparaît, les acquis de surface se degradent. C'est le probleme le plus grave.
3. **Preservation geometrique solide** : sur les generations completes, angles, murs, recoins sont bien preserves. Le #34 outdoor est particulierement impressionnant sur une geometrie complexe (arcs metalliques).
4. **Preservation equipements fixes** : le convecteur #36 est conserve — les corrections Sprint 18 portent leurs fruits. Mais les boîtiers electriques #32 ne sont pas nettoyes.
5. **Luminaires iconiques** : le PH5-style (#31, #36) et l'Akari-style (#32) sont reconnaissables et ancrent immediatement l'identite stylistique. C'est un acquis majeur.
6. **Densite mobilier centre** : le mobilier reste concentre au premier plan (#31, #32). Pas de zone secondaire en fond de piece malgre les directives Sprint 14. Sur des pieces de cette taille, c'est acceptable mais a surveiller sur les grands espaces.

## Recommandations prioritaires

- **P0** : corriger le mode iteration pour qu'il AJOUTE au rendu existant sans supprimer le mobilier deja genere ni degrader les surfaces
- **P1** : les artefacts de chantier residuels (boîtiers electriques #32) doivent etre nettoyes en passe 1
- **P2** : les iterations outdoor (#35) ne doivent pas desaturer/assombrir l'image de base
