# Audit Generations #31-42 — Yann Duval, Architecte d'Interieur

**Date** : 2026-03-26
**Scope** : 12 generations (#31 a #42), versions null/v21/v22
**Methode** : Audit sur prompts construits uniquement — les images de production sont inaccessibles (404, filesystem ephemere Replit). Les notes refletent la qualite des prompts, pas le rendu final.

## Tableau recapitulatif

| # | Style | Type piece | Note /10 | Verdict |
|---|-------|-----------|----------|---------|
| 31 | Scandinavian | salon | 8.4 | Bon |
| 32 | Japandi | salon | 8.6 | Bon |
| 33 | Japandi (iteration) | salon | 3.0 | Echec |
| 34 | Contemporain outdoor | terrasse | 7.8 | Correct |
| 35 | Contemporain outdoor (iter.) | terrasse | 7.5 | Correct |
| 36 | Scandinavian | piece? | 6.5 | Insuffisant |
| 37 | Cosy | entree | 8.2 | Bon |
| 38 | Cosy | chambre | 8.3 | Bon |
| 39 | Scandinavian | piece? | 6.5 | Insuffisant |
| 40 | Contemporary | piece? | 6.5 | Insuffisant |
| 41 | Contemporary | salle a manger | 8.0 | Bon |
| 42 | Contemporary | entree | 7.8 | Correct |

**Moyenne** : 7.3/10 | **Mediane** : 7.8/10 | **Ecart** : 3.0 - 8.6

Ponderation : fidelite stylistique x2, credibilite pro x2, autres x1.

## Analyse par generation

**#31 Scandinavian salon (8.4)** — Trio iconique PH5/Wegner/AJ bien ancre. Distribution profondeur correcte. Manque : absence de plante verte (Scandinave sans verdure = incomplet) et le sheepskin est un cliche un peu facile.

**#32 Japandi salon (8.6)** — Meilleur prompt du lot. Vocabulaire authentique (tetsubin, ikebana, orchidee unglazed). Ratio 30% meuble respecte. Le platform sofa en ecru linen est coherent. Seul bemol : l'ikebana ET l'orchidee = redondance botanique, un seul suffit.

**#33 Japandi iteration (3.0)** — BUG CRITIQUE. L'utilisateur demande "rajoute des etageres au mur". Le prompt repond "Do NOT attach anything to walls". Contradiction directe entre intention utilisateur et contrainte systeme. Le pipeline d'iteration ignore la demande. Note plancher.

**#34-35 Outdoor contemporain (7.8/7.5)** — Vocabulaire technique solide (concrete pavers 60x60, expansion joints inox, Sunbrella). Manque de vegetation paysagere (grasses ornementales, jardinier) et de directive d'eclairage exterieur (spots encastres, path lighting). L'iteration #35 n'apporte pas d'amelioration visible dans le prompt.

**#36, #39 Scandinavian passe 1 seule (6.5)** — Surfaces uniquement, pas de mobilier. Difficile a evaluer en tant que produit fini. Le PH5 et le sol whitewashed ash sont corrects mais le resultat livre a l'utilisateur est une piece VIDE avec finitions = pas de valeur perceptible sans passe 2.

**#37 Cosy entree (8.2)** — Excellent calibrage petit espace. Console 100cm, banc, porte-manteau, runner 80x150cm. La directive "minimal — do not overcrowd" est exactement ce qu'il faut pour une entree. Manque : un miroir (indispensable en entree) et un point lumineux (applique ou lampe console).

**#38 Cosy chambre (8.3)** — Dimensions realistes (lit 160cm, chevets 45cm, tapis 160x230). Bonne composition chambre complete. Le padded headboard est coherent Cosy. Manque : une lampe de chevet specifique et un plaid/jet de lit pour la touche Cosy signature.

**#40 Contemporary passe 1 seule (6.5)** — Meme probleme que #36/#39 : surfaces sans mobilier = piece vide livree. Le style Contemporain passe 1 est correct (finitions propres) mais sans valeur utilisateur isolement.

**#41 Contemporary salle a manger (8.0)** — Composition complete et professionnelle : table 180cm + 6 chaises + buffet 160cm + tapis 200x300. Bon ratio pour 6 couverts. Fallback Flux a 130s = lent mais acceptable. Manque : luminaire suspendu au-dessus de la table (essentiel en salle a manger) et un objet de centre de table.

**#42 Contemporary entree (7.8)** — Bonne adaptation entree : console 100cm, miroir pose, banc, runner. Le miroir "propped" (pose au sol) est un choix esthetique contemporain credible. Flux passe 2 a 130s = latence elevee.

## Patterns identifies

### Points forts
1. **Pieces iconiques bien ancrees** — PH5, Wegner, AJ (Scandi), tetsubin/ikebana (Japandi) : chaque style a sa signature
2. **Dimensions realistes** — console 100cm, lit 160cm, table 180cm, tapis 200x300 : echelle credible
3. **Calibrage spatial** — "do not overcrowd" sur entree, ratio 30% sur Japandi : le prompt s'adapte a la piece
4. **Vocabulaire technique outdoor** — concrete pavers, expansion joints, Sunbrella : crédible pour un pro

### Problemes recurrents
1. **P0 — Iteration murale bloquee** : le pipeline refuse categoriquement d'ajouter quoi que ce soit aux murs, meme quand l'utilisateur le demande explicitement (#33)
2. **P1 — Passe 1 seule = piece vide** : 3 generations (#36, #39, #40) livrent des surfaces sans mobilier — valeur perceptible nulle pour l'utilisateur
3. **P2 — Luminaires oublies en passe 2** : aucun luminaire suspendu prescrit au-dessus de la table (#41), aucune applique en entree (#37)
4. **P3 — Latence Flux** : 130s pour la passe 2 (#41, #42) = experience utilisateur degradee

## Plan d'action

| Priorite | Action | Impact |
|----------|--------|--------|
| P0 | Fix pipeline iteration : si l'utilisateur demande un element mural (etagere, tableau, applique), la contrainte "nothing on walls" doit etre levee pour cette iteration specifique | Critique — l'outil ignore la demande utilisateur |
| P1 | Garantir que TOUTE generation livre les 2 passes (surfaces + mobilier). Ne jamais retourner une passe 1 seule comme resultat final | Haute — 25% des generations sont des pieces vides |
| P2 | Ajouter un luminaire suspendu obligatoire dans les furniturePrompts "salle a manger" et une applique/lampe dans les prompts "entree" | Haute — completude composition |
| P3 | Investiguer la latence Flux passe 2 (130s) — envisager timeout + message UX "generation en cours" | Moyenne — UX |
| P4 | Enrichir outdoor avec vegetation paysagere (grasses ornementales, bacs, eclairage path) | Basse — outdoor est secondaire |

## Handoff

**Destinataire** : @fullstack + @ia
**Fichiers concernes** : `app/api/generate/route.ts` (P0 iteration, P1 double passe), `components/StylePicker.tsx` (P2 luminaires par type de piece)
**Prerequis** : acces aux images de production pour valider visuellement les rendus (actuellement 404)
**Prochaine etape** : fix P0 (iteration murale) puis re-audit avec images accessibles
