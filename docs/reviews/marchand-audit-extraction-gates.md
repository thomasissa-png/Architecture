# Audit Gates Extraction -- Thomas Berger

> Scenario : upload PDF, l'IA retourne "Sejour/cuisine" 241m2 (vrai: 25.8m2), "Chambre" 91m2 (vrai: ~9m2)
> Date : 2026-04-13 | Seuil : 9.5/10

## Score : 6.5 / 10

## Ce qui marche

1. **sanitizeSurfaces Fix 0 (10x median)** -- detecte bien l'erreur systematique 10x. Median > 50m2 = divise tout par 10. Couvre mon scenario 241/91. BIEN.
2. **Cap 80m2** -- si le 10x passe pas, chaque piece > 80m2 est mise a null. Le marchand voit "Incertain" et peut corriger. OK.
3. **Auto-retry** -- si G1/G2/G6 echouent, relance l'extraction une fois. Correct.
4. **Warnings FR affichés** -- bandeau jaune "Points a verifier" avec liste. Je comprends. OK.
5. **Badge confiance par piece** -- "Fiable" / "A verifier" / "Incertain" avec couleur. Utile.
6. **Pas bloquant** -- je peux toujours editer manuellement et continuer. BIEN.

## Ce qui manque (5 trous)

### P0 -- Pas de gate par TYPE de piece

Le prompt dit "WC: 1-4m2, Chambre: 8-25m2" mais `sanitizeSurfaces()` et `validateExtraction()` ne verifient JAMAIS par type. Un WC a 25m2 ou une chambre a 91m2 passent si le median est OK (ex: 3 pieces avec surfaces 9, 25, 91 -- median 25 < 50, pas de 10x fix, le 91 reste a 91 < 80, zero alerte).

### P0 -- Warning trop vague, pas de nom de piece

Le warning dit "1 piece(s) avec une surface anormalement grande" sans dire LAQUELLE. J'ai 6 pieces, je dois deviner. Le `detail` de la gate contient le nom mais il n'est PAS envoye au frontend (seul `warnings` est retourne, pas `gates[].detail`).

### P1 -- Le 10x fix divise les dimensions par sqrt(10) au lieu de 10

Ligne 399: `length_m * 100 / Math.sqrt(10)`. Si 25.8m2 lu comme 258, les dimensions sont aussi 10x trop grandes (ex: 5.8m lu comme 58m). Diviser la dimension par sqrt(10) = 18.3m. Ca n'a aucun sens. Il faut diviser par 10.

### P1 -- Pas de gate "surface vs bounding box" par piece

G5 regarde le ratio min/max global mais pas piece par piece. Un sejour 25m2 avec un bbox minuscule ou un WC 3m2 avec un bbox enorme passent le gate.

### P2 -- Warning pour null sans action

Quand `sanitizeSurfaces` met une surface a null (cap 80m2), le warning dit "verifiez les surfaces manuellement" sans indiquer QUELLE piece a ete modifiee. L'utilisateur ne sait pas que la surface a ete supprimee par le systeme.

## Verdict

Les gates couvrent le gros du scenario (10x systematique), mais les cas limites passent au travers : erreur sur 1-2 pieces seulement, erreur par type (WC gigantesque), et les warnings sont trop generiques pour que je sache quoi corriger. Score < 9.5 -- corrections P0/P1 requises.
