# Audit structurel prompts v34 + gpt-image-1.5 — Yann Duval, Architecte d'interieur

Date : 2026-04-01
Scope : Analyse structurelle des 3 problemes remontes par le fondateur
Modele : gpt-image-1.5 (hardcode), prompt version v34
Methode : audit du code source (route.ts, StylePicker.tsx, custom-prompt.ts, room-types.ts, iteration-prompt.ts) — pas d'acces direct aux images de production (API non accessible depuis cet environnement)

---

## Avertissement important

**Je n'ai pas pu acceder aux images de production.** L'API `https://versimo.fr/api/logs` n'est pas accessible depuis mon environnement (pas d'outil curl/Bash disponible, WebSearch ne resout pas les API JSON). Cet audit est donc un **audit structurel des prompts et du pipeline**, pas un audit visuel image par image.

Pour un audit visuel complet des 3 dernieres generations, il faudrait :
1. Telecharger les images via curl dans /tmp/audit-images/
2. Me les soumettre via Read pour analyse multimodale

Ce que je livre ici : diagnostic precis des causes structurelles des 3 problemes signales, avec corrections concretes fichier par fichier.

---

## Probleme 1 : Gestion des espaces (geometrie, angle, proportions non respectes)

### Diagnostic

Le pipeline utilise `gpt-image-1.5` via la Responses API avec `input_fidelity: "high"` et `action: "edit"`. En theorie, c'est le meilleur setup pour la preservation geometrique. Mais plusieurs elements dans les prompts fragilisent cette preservation :

**1a. Le prompt de passe 1 est trop long et dilue la preservation geometrique**

Le builder generique (`buildSurfacesResponsesPrompt`, fallback) produit un prompt de ~180 mots. Les directives de preservation camera (`CAMERA_PRESERVATION`) et lumiere (`LIGHT_PRESERVATION`) arrivent en PREMIERE position, ce qui est correct. Mais le volume total de texte dilue leur poids.

Pire : les constantes partagees sont concatenees sans saut de ligne ni hierarchie claire :
```
"Same camera angle, lens distortion, vanishing points, field of view, orientation. Preserve existing light direction, shadow positions... Preserve ceiling 3D geometry... Wall geometry must stay identical..."
```
C'est un MUR DE TEXTE pour le modele. Les instructions de preservation se noient dans les instructions de finition.

**1b. `gpt-image-1.5` vs `gpt-image-1` — regression spatiale documentee puis ignoree**

Le commentaire de version dans route.ts (ligne 40) dit explicitement :
> v32 (revert gpt-image-1.5 -> gpt-image-1 — regression spatiale confirmee par audit Lucas, modele configurable via env)

Pourtant, le modele actuel EST `gpt-image-1.5` (ligne 47). Le revert a ete annule silencieusement. **Si Lucas Moreau a confirme une regression spatiale avec gpt-image-1.5, cette regression est probablement la cause directe du probleme 1.**

Le modele 1.5 est plus rapide mais potentiellement moins fidele a la geometrie de l'input. C'est exactement ce que le fondateur signale.

**1c. Pas de contrainte de preservation specifique au format/ratio**

`getOutputSize()` mappe les dimensions d'input au format OpenAI le plus proche (1536x1024, 1024x1536, 1024x1024). Mais si l'input est en 16:9 et se retrouve ecrase en 3:2, la geometrie est deformee structurellement avant meme que le modele ne touche quoi que ce soit.

### Corrections proposees

| # | Prio | Fichier | Correction |
|---|------|---------|------------|
| 1 | P0 | route.ts:47 | **Revenir a `gpt-image-1` pour valider si la regression spatiale est la cause.** Creer un A/B test : 3 generations avec chaque modele, comparer la preservation geometrique. |
| 2 | P1 | route.ts:122-126 | Restructurer les constantes avec des separateurs clairs : mettre CAMERA_PRESERVATION dans une phrase SEULE en tete, suivi d'un "---" ou d'un retour a la ligne explicite avant les autres directives. |
| 3 | P1 | route.ts:223-234 | Reduire le prompt generique passe 1 de ~180 mots a ~100 mots. Fusionner CEILING_PRESERVATION + WALL_PRESERVATION en une seule phrase courte. Le modele comprend mieux des instructions concises. |

---

## Probleme 2 : Remplissage de l'espace (mobilier mal distribue)

### Diagnostic

**2a. La directive de distribution spatiale est trop vague et conditionnelle**

Le builder passe 2 contient :
```
const DEPTH_DISTRIBUTION = "If the room is deep, distribute furniture across its full depth — primary group foreground, secondary piece further back if space allows.";
```

Probleme : "if the room is deep" et "if space allows" donnent au modele la permission de NE PAS distribuer. C'est une directive molle. Le modele prend le chemin de moindre resistance : tout mettre au premier plan.

**2b. Les furniturePrompts des styles decrivent un CATALOGUE, pas une SCENOGRAPHIE**

Exemple Scandinave :
> "large straight three-seat sofa in oatmeal boucle [...], light ash lounge chair [...], light birch rectangular coffee table [...], cream wool loop-pile area rug [...], slim matte black asymmetric floor lamp [...], sheepskin throw [...], white ceramic ribbed vases [...], small round birch side table [...], potted trailing pothos [...], dried birch branches [...], two woven wool cushions [...]"

C'est une LISTE DE COURSES. Aucune indication de placement spatial. Le modele recoit 11 objets et doit deviner ou les mettre. Resultat previsible : il les empile au centre.

**2c. Les furniturePrompts ont tous la meme densite (~10-12 objets)**

Que l'input soit un studio de 15m2 ou un loft de 80m2, le prompt demande exactement le meme nombre d'objets. Le modele ne peut pas adapter la densite a la taille reelle de la piece car il n'a AUCUNE information sur les dimensions absolues.

**2d. La directive conditionnelle "Scale furniture to room volume" est insuffisante**

Le prompt dit "if compact (<4m wide), use smaller pieces" mais :
- Le modele ne peut pas MESURER la largeur de la piece sur la photo
- "<4m wide" est un seuil arbitraire sans reference visuelle
- "use smaller pieces" ne dit pas COMBIEN de pieces retirer

### Corrections proposees

| # | Prio | Fichier | Correction |
|---|------|---------|------------|
| 4 | P0 | route.ts:241 | **Rendre DEPTH_DISTRIBUTION imperatif** : `"Distribute furniture across the FULL DEPTH of the room. Place a primary seating group in the foreground third and at least one secondary anchor (side table, floor lamp, accent chair) in the back third."` Supprimer "if the room is deep" et "if space allows". |
| 5 | P0 | StylePicker.tsx (tous) | **Ajouter des indications de placement spatial dans les furniturePrompts.** Pas de coordonnees, mais des termes compositionnels : "foreground grouping", "background anchor", "lateral accent". Exemple Scandinave : `"...foreground: sofa facing center with coffee table, lateral: lounge chair angled toward sofa, background: side table with vases against the back wall..."` |
| 6 | P1 | route.ts:354-365 | **Ajouter une directive de densite adaptative** : `"Count the major surfaces visible. If the room appears to have less than 3 visible walls, reduce the furniture to 5-6 key pieces. If the room is very large (visible depth >6m), add a second furniture grouping."` |
| 7 | P1 | route.ts:361 | **Remplacer le seuil metrique** ("if compact (<4m wide)") par un seuil visuel : `"If the room appears compact (visible floor area smaller than twice the sofa footprint), skip accent pieces and reduce to sofa + table + rug + one lamp."` |

---

## Probleme 3 : Interpretation custom (prompts personnalises mal interpretes)

### Diagnostic

**3a. Le pre-processing GPT-4.1-mini est trop contraint**

`preprocessCustomPrompt()` dans `custom-prompt.ts` impose :
- Limite de 60 mots pour surfacePrompt
- Limite de 80 mots pour furniturePrompt
- Filtrage strict des elements muraux, built-ins, rideaux

Quand un utilisateur ecrit "je veux un salon cosy avec une bibliotheque murale et des rideaux en lin", le pre-processing :
1. Filtre "bibliotheque murale" (wall-mounted) -> warning
2. Filtre "rideaux en lin" (curtains) -> warning
3. Retourne un prompt APPAUVRI qui ne ressemble plus a ce que l'utilisateur voulait

L'utilisateur perd la moitie de sa demande sans comprendre pourquoi.

**3b. Le system prompt du pre-processor est en anglais mais les utilisateurs ecrivent en francais**

Le pre-processor traduit FR->EN, ce qui est correct pour le modele image. Mais la traduction peut perdre des nuances. "Ambiance cocooning chaleureuse" devient quoi en anglais ? Probablement "cozy warm atmosphere" — generique.

**3c. Le split surface/furniture est trop rigide pour les prompts custom**

Les 12 styles predefinis ont des surfacePrompt et furniturePrompt soigneusement ecrits par des experts. Mais quand l'utilisateur ecrit en mode Custom, le split est fait par GPT-4.1-mini qui n'a AUCUN contexte sur ce qui fonctionne bien avec gpt-image-1.5.

Exemple : l'utilisateur ecrit "salon style loft new-yorkais avec briques apparentes". Le pre-processor met "briques apparentes" dans surfacePrompt. Mais "briques apparentes" est un PRESERVE (garder les briques existantes) ou un ADD (ajouter des briques) ? Le pre-processor ne sait pas.

**3d. Les warnings sont affiches mais pas les enrichissements**

L'utilisateur voit "Bibliotheque murale filtree" mais ne voit PAS ce que le pre-processor a genere comme prompt final. Il ne sait pas ce qui est reellement envoye au modele. Zero transparence = zero controle.

### Corrections proposees

| # | Prio | Fichier | Correction |
|---|------|---------|------------|
| 8 | P0 | custom-prompt.ts:44-77 | **Enrichir le system prompt du pre-processor** avec 3-4 exemples concrets de traductions FR->EN reussies. Ajouter : `"For French 'ambiance cocooning', generate SPECIFIC textures: 'chunky knit throws, layered cushions in cream boucle and camel velvet, pillar candles on wooden tray'. Never translate to generic English — always enrich with tangible objects."` |
| 9 | P0 | custom-prompt.ts:44-77 | **Assouplir le filtrage des elements muraux** : au lieu de filtrer systematiquement, classer en 3 categories : (a) interdit (modifications structurelles), (b) autorise avec warning (etageres, miroirs, cadres — le pipeline gere avec allowWallMounted), (c) autorise sans warning (rideaux si fenetres detectees dans le prompt). |
| 10 | P1 | custom-prompt.ts:65-69 | **Augmenter les limites de mots** : 80 mots pour surfacePrompt (au lieu de 60), 120 mots pour furniturePrompt (au lieu de 80). Les prompts des 12 styles font 60-80 mots en furniture — le custom devrait avoir AU MOINS autant. |
| 11 | P1 | page.tsx (UX) | **Afficher le prompt enrichi** : apres le pre-processing, montrer a l'utilisateur un encart "Voici ce que nous avons compris : [prompt enrichi traduit en FR]" avec possibilite d'editer. Transparence = confiance. |
| 12 | P2 | custom-prompt.ts | **Ajouter 3 exemples few-shot dans le system prompt** : montrer au mini-model des paires (input FR -> output surface + furniture) de qualite, alignees sur les 12 styles existants. Le few-shot est la methode la plus efficace pour calibrer GPT-4.1-mini. |

---

## Probleme transversal : gpt-image-1.5 comme variable confondante

Les 3 problemes signales (geometrie, distribution, custom) pourraient TOUS etre aggraves par le changement de modele. L'historique du projet documente une "regression spatiale confirmee" avec gpt-image-1.5 (v32). Cette regression affecte :
- La preservation geometrique (probleme 1)
- La distribution spatiale du mobilier (probleme 2)
- L'interpretation des prompts complexes (probleme 3)

**Recommandation P0 absolue : avant toute modification de prompt, tester les 3 memes inputs avec gpt-image-1 pour isoler la variable modele.**

Si gpt-image-1 produit de meilleurs resultats sur ces 3 axes, la cause racine est le modele, pas les prompts. Modifier les prompts sur un modele defaillant est une perte de temps.

---

## Plan d'action hierarchise

### P0 — Immediat (avant tout autre changement)
1. **A/B test gpt-image-1 vs gpt-image-1.5** sur 3 inputs identiques (1 salon, 1 chambre, 1 custom). Comparer : geometrie, distribution, interpretation. Si gpt-image-1 est meilleur, revert.
2. **DEPTH_DISTRIBUTION imperatif** : supprimer les conditionnels "if" qui donnent au modele la permission de ne pas distribuer.
3. **Pre-processor custom : enrichir avec few-shot** + assouplir le filtrage mural.

### P1 — Court terme (apres validation du modele)
4. Restructurer les prompts passe 1 : plus courts, hierarchie claire, separation visuelle.
5. Ajouter des indications de placement spatial dans les furniturePrompts (foreground/background/lateral).
6. Densite adaptative dans le builder passe 2.
7. Afficher le prompt enrichi a l'utilisateur en mode Custom.

### P2 — Moyen terme
8. Augmenter les limites de mots du pre-processor custom.
9. Ajouter des exemples few-shot dans le system prompt du pre-processor.

---

## Synthese des notes estimees (sans acces visuel)

Sur la base de l'architecture actuelle des prompts v34 + gpt-image-1.5, et en extrapolant depuis les audits precedents (#31-42, moyenne 5.5-7.5/10) :

| Axe | Estimation | Justification |
|-----|-----------|---------------|
| Preservation geometrique | 5-6/10 | gpt-image-1.5 regression documentee, prompts trop longs |
| Distribution mobilier | 4-5/10 | DEPTH_DISTRIBUTION conditionnel, furniturePrompts sans placement spatial |
| Custom interpretation | 3-4/10 | Pre-processing trop restrictif, filtrage excessif, pas de few-shot |
| **Estimation globale** | **4.5-5.0/10** | Insuffisant pour un outil professionnel |

Le seuil de credibilite professionnelle est a 7.5/10. On est significativement en dessous.

---

## Handoff

**Destinataire** : @fullstack pour implementation des corrections P0, @ai-image-expert (Lucas Moreau) pour l'A/B test modele.

**Fichiers a modifier** :
- `/home/user/Architecture/app/api/generate/route.ts` (lignes 47, 122-126, 223-234, 241, 354-365)
- `/home/user/Architecture/components/StylePicker.tsx` (12 furniturePrompts)
- `/home/user/Architecture/lib/custom-prompt.ts` (lignes 44-77, 65-69)

**Question bloquante pour le fondateur** : as-tu compare les resultats recents avec les generations anterieures (avant la migration gpt-image-1.5) ? Si les generations precedentes etaient meilleures, le revert modele est la priorite absolue.
