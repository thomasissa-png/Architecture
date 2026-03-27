# Audit visuel generations #37-42 — Lucas Moreau, Expert IA Image

**Date** : 2026-03-26
**Modeles** : GPT-4.1 Responses API (primary), Flux Depth Pro (fallback passe 2 sur #41, #42)
**Input commun #37-42** : meme piece de chantier brut (placo blanc, sol beton, cables electriques pendants) sauf #38 (atelier verriere double hauteur) et #42 (loft voute beton brut avec baies vitrees)

---

## Tableau recapitulatif

| # | Style | Passes | Modele P2 | Preserv. archi (x2) | Lumiere | Vocab photo | Struct. prompt | Neg. prompt | Multi-modele | Coher. I/O | Richesse | Adaptab. | Rendu final (x2) | **Note /10** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 37 | Cosy entryway | 2 | GPT-4.1 | 8 | 8 | 7 | 7 | 7 | 7 | 8 | 6 | 7 | 7.5 | **7.4** |
| 38 | Cosy bedroom | 2 | GPT-4.1 | 8.5 | 8 | 8 | 7 | 7 | 7 | 8 | 7 | 8 | 8 | **7.9** |
| 39 | Scandinavian | 1 | — | 7 | 7.5 | 7 | 7 | 6 | 6 | 7 | 5 | 7 | 6.5 | **6.7** |
| 40 | Contemporary | 1 | — | 7.5 | 7 | 7 | 7 | 6 | 6 | 7 | 5 | 7 | 6.5 | **6.8** |
| 41 | Contemp. dining | 2 | Flux | 5 | 6 | 6 | 6 | 5 | 5 | 5 | 6 | 6 | 5 | **5.4** |
| 42 | Contemp. entryway | 2 | Flux | 4 | 5 | 5 | 5 | 4 | 5 | 4 | 5 | 5 | 4.5 | **4.6** |

**Moyenne GPT-4.1 2 passes (#37, #38)** : 7.65
**Moyenne GPT-4.1 passe 1 seule (#39, #40)** : 6.75
**Moyenne Flux passe 2 (#41, #42)** : 5.0

---

## Observations par generation

### #37 — Cosy entryway (GPT-4.1, 2 passes)
Passe 1 reussie : sol chene clair credible, murs creme propres, luminaire drum pendant en lin correct. Cables electriques supprimes proprement. Passe 2 ajoute console metal/bois, miroir, porte-manteau, tabouret, plante verte, tapis jute — composition equilibree. Le radiateur en bas a gauche est PRESERVE (conforme Sprint 18). Angle de prise de vue et perspective identiques a l'input. Le mobilier reste concentre au fond — pas de distribution laterale. Rendu photographique correct mais un peu "flat", manque de grain ISO et de vignettage.

### #38 — Cosy bedroom (GPT-4.1, 2 passes)
La generation la plus reussie du lot. Input tres complexe (atelier verriere double hauteur, structure metallique, baies vitrees). Passe 1 preserve remarquablement la voute, les nervures de plafond, le poteau metallique central, les baies vitrees noires. Sol chene clair, luminaire drum pendant. Passe 2 place un lit double avec tete de lit grise, armoire en chene, banc de lit, tapis, 2 chevets avec lampes — echelle coherente sous le plafond cathedrale. La piece visible a travers les baies est refletee de facon credible. Le fauteuil ocre derriere la baie droite est un ajout intelligent de profondeur. Ombres portees correctes sous le lit.

### #39 — Scandinavian (passe 1 seule)
Surfaces correctement traitees : sol whitewashed ash clair, murs blanc pur, luminaire tiered pendant (style PH5) bien place. MAIS : les prises electriques murales (4 boitiers ronds noirs sur le mur droit) sont TOUJOURS VISIBLES — la passe 1 ne les a pas masquees. Le plafond a perdu les joints de placo visibles dans l'input (lisse au lieu de garder la texture brute). Color shift leger vers le chaud (input neutre/froid, output creme). Sans passe 2, la piece reste vide — pas de valeur client livrable.

### #40 — Contemporary (passe 1 seule)
Meme input que #39/#41. Sol gris clair en dalles (engineered stone), 2 spots encastres au plafond, murs gris tres clair. Bonne differenciation avec le Scandinave (#39) — la palette est plus froide et minerale. Les prises electriques murales sont encore partiellement visibles (4 points noirs). Le plafond est totalement lisse, les joints de placo effaces. L'angle de camera est preserve. Sans passe 2, meme constat : pas de valeur livrable.

### #41 — Contemporary dining (Flux passe 2)
**Probleme majeur.** Passe 1 GPT-4.1 correcte (similaire a #40). Mais la passe 2 Flux a produit un resultat incoherent : une fenetre avec volets blancs a ete HALLUCINEE sur le mur gauche (inexistante dans l'input ET dans la passe 1). Un radiateur blanc est apparu sur le mur droit. Un tableau orange/coucher de soleil est accroche au mur — contraire a la directive "freestanding objects ONLY". Un track light 4 spots remplace les encastres de la passe 1. Le sol semble avoir change de materiau (plus fonce, texture bois). La piece semble completement differente de l'input — la geometrie de base (coins, proportions mur gauche/droit, plafond) est approximativement correcte mais les ajouts architecturaux trahissent le modele.

### #42 — Contemporary entryway (Flux passe 2)
**Le pire resultat du lot.** Input : loft industriel voute beton brut avec baies vitrees panoramiques et profondeur importante. Passe 1 GPT-4.1 : bonne transformation des surfaces (murs blancs, sol carrelage gris clair, spot cylindrique au plafond), voute preservee, baies conservees. Passe 2 Flux : CATASTROPHIQUE. La geometrie est completement deformee — les baies vitrees noires sont devenues des portes-fenetres blanches avec croisillons. La voute beton a disparu, remplacee par un plafond plat avec corniche. Des cadres sont accroches aux murs. Une tringle a rideaux en laiton est apparue. Un canape et une table basse sont places a droite avec des proportions douteuses. Le sol est devenu moquette beige. La piece ne ressemble PLUS DU TOUT a l'input — ni la geometrie, ni les ouvertures, ni les materiaux de passe 1 ne sont preserves.

---

## Comparaison GPT-4.1 vs Flux Depth Pro (passe 2)

| Critere | GPT-4.1 (#37, #38) | Flux Depth Pro (#41, #42) |
|---|---|---|
| Preservation geometrie | Excellente — voutes, poteaux, baies intactes | Mauvaise — invente fenetres, deforme baies, perd voutes |
| Respect passe 1 | Surfaces inchangees entre P1 et output | Surfaces completement re-renderisees (sol, murs, plafond) |
| Hallucinations archi | Aucune observee | Fenetres, croisillons, tringles, corniches inventees |
| Mobilier freestanding | Respect strict — console, lit, chevets | Violation — tableaux muraux, tringles, radiateur |
| Echelle mobilier | Coherente (lit sous voute cathedrale bien proportionne) | Douteuse (canape #42 sous-dimensionne) |
| Qualite photo | Bonne — ombres portees, reflexions vitrees | Moyenne — eclairage plat, ombres absentes |

**Verdict** : Flux Depth Pro est INADAPTE comme fallback passe 2. La depth map ne suffit pas a contraindre la generation — le modele reinterprete la scene au lieu d'ajouter du mobilier sur la passe 1.

---

## Patterns techniques recurrents

1. **Prises electriques persistantes** : les boitiers d'encastrement (ronds noirs) sur les murs ne sont pas supprimes en passe 1. Ils devraient etre couverts par la finition murale. Action : ajouter "cover all visible junction boxes, electrical outlets, and cable exits with the wall finish" dans le builder passe 1.

2. **Passe 1 seule = pas de valeur livrable** : #39 et #40 prouvent que la passe surfaces sans mobilier n'est pas montrable au client. Le pipeline 2 passes DOIT toujours completer les 2 passes.

3. **Flux Depth Pro detruit la passe 1** : sur #41 et #42, Flux ne "continue" pas la passe 1 — il regenere la scene. La depth map preserve la geometrie grossiere mais pas les finitions, couleurs, ni ouvertures. Ce fallback est dangereux car il donne un faux sentiment de succes (image generee) avec une qualite inacceptable.

4. **GPT-4.1 excelle sur les espaces complexes** : #38 (verriere double hauteur) est la preuve que le modele comprend les volumes atypiques quand il VOIT l'image via vision. La preservation du poteau metallique, des baies, et de la voute est remarquable.

5. **Manque de grain photographique** : toutes les generations ont un rendu legerement "CGI-clean". Le grain ISO 200 et le vignettage naturel specifies dans le builder (Sprint 16b, #123) ne semblent pas suffisamment effectifs.

---

## Recommandations prioritaires

- **P0** : Desactiver Flux Depth Pro comme fallback passe 2 ou le limiter a la passe 1 uniquement. En passe 2, si GPT-4.1 echoue, retourner la passe 1 avec un message "surfaces terminees, mobilier indisponible" plutot que de servir un rendu Flux degrade.
- **P1** : Ajouter directive de nettoyage des boitiers electriques en passe 1 (concerne #39, #40, #41).
- **P1** : Forcer systematiquement la passe 2 — ne jamais livrer une passe 1 seule au client.
- **P2** : Renforcer les descripteurs de grain/vignettage dans les prompts pour casser le rendu CGI.
