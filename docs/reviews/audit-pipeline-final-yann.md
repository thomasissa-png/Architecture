# Audit pipeline final Versimo v48 — Yann Duval

**Date** : 2026-04-04 | **Fichiers audites** : generation-pipeline.ts, compositing.ts, iteration-prompt.ts

---

## Note globale : 8.2 / 10

Pipeline mature, architecturalement solide. Le split 2 passes est valide et les constantes de preservation sont parmi les plus completes que j'ai vues sur un pipeline IA de home staging. Quelques risques structurels subsistent.

---

## 1. Constantes de preservation (9/10)

PASS1_PREAMBLE et PASS2_PREAMBLE en tete de TOUS les builders : excellent. Le modele recoit la preservation AVANT le style, ce qui est fondamental avec gpt-image-1.5 (tokens precoces = poids maximal). ANTI_FENETRE avec comptage explicite, CAMERA_PRESERVATION avec crop edges, WALL_PRESERVATION avec limewash conditionnel, COLUMN_PRESERVATION, EQUIPMENT_PRESERVATION nomme (chauffe-eau cylindrique, convecteurs) : tout est la. ANTI_INVENTION empeche les hallucinations hors cadre. Seul manque : une directive explicite de preservation des PROPORTIONS de piece (le modele peut respecter l'angle mais etirer subtilement la profondeur).

## 2. Builders passe 2 — composition (8/10)

Distribution profondeur + largeur dans le fallback generique : bien. DEPTH_DISTRIBUTION_KITCHEN et DEPTH_DISTRIBUTION_BEDROOM dedies : pertinent. Densite adaptative ("if compact, 5-6 pieces") et scaling conditionnel (compact kitchen skip island) : pragmatique. Les "lived-in details" (livre ouvert, tasse, plaid) ajoutent de la credibilite editoriale. Le resolveChooseOne garantit la variete entre generations. Point faible : le builder dining_room n'a pas de DEPTH_DISTRIBUTION dedie — il utilise une formulation inline moins structuree que les constantes kitchen/bedroom.

## 3. Compositing structural (7/10)

Concept intelligent : re-superposer fenetres/radiateurs depuis l'original via vision + sharp. Le feathering dynamique (proportionnel a la largeur) evite les coutures visibles. MAIS : la detection par GPT-4.1-mini en 5 secondes est fragile — les bounding boxes en pourcentage sont imprecises sur les perspectives obliques. Si le modele genere un leger shift de perspective (meme 2-3px), le compositing superpose une fenetre legerement decalee, ce qui cree un artefact pire que l'absence de compositing. Le fail-open est sage mais le risque de degradation silencieuse est reel. Je recommande un seuil de confiance : si le score SSIM de la zone composee vs la zone generee est deja bon (>0.85), ne pas composer.

## 4. Best-of-2 conditionnel (8.5/10)

Excellent calibrage : active uniquement sur les pieces complexes (voute, poutre, mezzanine, L-shape, 3+ fenetres) en passe 2 seulement. Le SSIM local a 256px est rapide (~50ms) et zero cout API. Le mapping SSIM -> score (lineaire 0-10) est simpliste mais suffisant pour un comparatif binaire. Risque : le SSIM global ne detecte pas une fenetre ajoutee si le reste de l'image est fidele — c'est un score de structure, pas de semantique.

## 5. Iterations adjust (7.5/10)

"Mentally list every visible object" est la bonne approche — force le modele a inventorier avant d'editer. Le framing "small, precise change" et "the ONLY change" ancrent le mode chirurgical. Le allowWallMounted conditionnel resout le conflit etageres. Risque : sur les iterations successives (v3, v4...), le modBlock empile les modifications precedentes mais le modele ne voit que l'image actuelle — si une v2 a ete mal executee, la v3 herite du defaut sans pouvoir le corriger. Il manque une directive "ignore previous modifications that don't match what you see".

## 6. resolveChooseOne — variete (7/10)

Fonctionne bien pour les alternatives simples (couleur tissu, type de plante). Mais la variete reste limitee a ce qui est encode dans les furniturePrompts — si un prompt n'a qu'un seul chooseOne, 80% de la composition reste identique entre generations. Pour une vraie variete compositionnelle, il faudrait aussi varier le PLACEMENT (pas seulement les materiaux).

## 7. Risques de regression

- **Compositing + perspective shift** : le compositing peut degrader silencieusement les images si la perspective generee diverge de l'originale — pas de garde-fou actuellement.
- **SSIM lineaire** : le score ne distingue pas "fenetre ajoutee" (grave) de "couleur legerement differente" (benin). Un score de 7 peut cacher une fenetre hallucinee.
- **gpt-image-1.5 creativite** : le modele est plus creatif que gpt-image-1, d'ou les PREAMBLE. Mais une mise a jour du modele cote OpenAI pourrait invalider ce calibrage sans avertissement.
- **Iteration empilee** : les v4+ risquent une derive cumulative sans mecanisme de "reset to pass 2 baseline".

---

## Top 3 ameliorations restantes

1. **Compositing conditionnel** : ne composer que si la zone structurelle dans l'image generee diverge significativement (SSIM zone < 0.80). Si la generation a bien preserve la fenetre, le compositing ajoute du risque pour rien.
2. **SSIM par zone** : calculer le SSIM separement sur les zones fenetres/portes (detectees par la vision) au lieu d'un score global. C'est la que se jouent les echecs critiques.
3. **Directive proportions de piece** : ajouter dans CAMERA_PRESERVATION "The room depth-to-width ratio must match the input exactly" — le modele peut respecter l'angle mais etirer la profondeur, ce qui est invisible au SSIM global mais visible a l'oeil.

---

**Verdict** : pipeline pret pour la production a grande echelle. Les 48 versions d'iteration ont produit un systeme robuste et bien documente. Les ameliorations restantes sont de l'ordre de l'optimisation, pas du structural.

*Yann Duval — Architecte d'interieur, 20 ans XP*
