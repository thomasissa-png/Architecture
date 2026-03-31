# Audit Phase 2 & 3 — Optimisations latence (analyse de risque)

**Agent** : @ia  
**Date** : 2026-03-31  
**Contexte** : Pipeline 2 passes via OpenAI Responses API gpt-4.1 + gpt-image-1.5  
**Objectif** : Évaluer les risques qualité de chaque optimisation Phase 2/3 AVANT application

---

## Phase 2 — Optimisations nécessitant validation visuelle

### R1a : quality:"low" pour passe 1 (image_generation tool)

**Gain estimé** : 10-20s  
**Où** : `route.ts` lignes 734-741, ajouter `quality: "low"` dans le tool image_generation  

**Risque concret** :
- La passe 1 produit une pièce vide avec finitions de surface (murs, sol, plafond, luminaire)
- Cette image est l'INPUT de la passe 2 — si elle est dégradée, la passe 2 hérite des défauts
- En quality:"low", les artefacts possibles :
  - Textures de sol moins définies (joints de carrelage flous, veines du bois simplifiées)
  - Jonction mur/plafond moins nette (la passe 2 pourrait mal placer le mobilier en hauteur)
  - Poutres/voûtes potentiellement lissées (moins de détail structural)

**Scènes à risque** :
- Pièces avec poutres apparentes, voûtes, nervures de béton
- Sols à motifs (herringbone, carrelage géométrique)
- Murs accent avec texture (papier peint, pierre)

**Protocole de test recommandé** :
- 10 générations comparatives (5 pièces × quality:"high" vs quality:"low" en passe 1)
- Pièces test : (1) voûte béton avec poutres, (2) herringbone Art Deco, (3) mur accent pierre, (4) pièce simple carrée, (5) loft double hauteur
- Critères : comparer le résultat FINAL (après passe 2) — pas la passe 1 seule
- Audit visuel agents Yann Duval + Lucas Moreau sur les 10 paires
- **Seuil GO** : delta qualité < 0.5 point sur la grille 10 critères

---

### R1b : quality:"medium" pour passe 2

**Gain estimé** : 5-10s  
**Où** : `route.ts` lignes 734-741 (passe 2), ajouter `quality: "medium"`  

**Risque concret** :
- La passe 2 produit le résultat FINAL vu par l'utilisateur
- En quality:"medium", les artefacts possibles :
  - Textures textiles moins réalistes (boucle, velours, lin — apparence plastique)
  - Ombres portées sous le mobilier simplifiées (moins de soft shadow)
  - Détails mobilier réduits (poignées, coutures, pieds sculptés)
  - Grain photographique potentiellement absent (rendu plus "CGI-clean")

**Scènes à risque** :
- Styles riches en textures : Bohème, Cosy, Wabi-Sabi, Maximaliste
- Mobilier avec détails fins : Art Deco (laiton, verre fumé), Haussmannien (moulures)

**Protocole de test recommandé** :
- 12 générations comparatives (6 pièces × quality:"high" vs quality:"medium" en passe 2)
- Styles test : Scandinave (simple), Bohème (textures), Art Deco (détails), Cosy (textiles), Japandi (minimaliste), Industriel (matières brutes)
- Critères : fidélité textile, ombres portées, détail mobilier, grain photo
- Audit visuel agents Yann Duval + Lucas Moreau
- **Seuil GO** : delta qualité < 0.3 point (plus strict car résultat final)

---

### R2 : detail:"low" sur input_image passe 1

**Gain estimé** : 3-8s  
**Où** : `route.ts` ligne 725, changer `detail: "high"` en `detail: "low"` pour la passe 1  

**Risque concret** :
- `detail: "low"` = le modèle de vision (gpt-4.1) analyse l'image à 512×512 au lieu de tiles haute résolution
- Le modèle voit la GÉOMÉTRIE globale mais perd les détails fins
- Éléments potentiellement invisibles à 512px :
  - Prises électriques, boîtiers de dérivation (que la passe 1 doit couvrir)
  - Poutres fines, nervures de béton discrètes
  - Murs accent subtils (papier peint ton sur ton)
  - Radiateurs muraux fins

**Scènes à risque** :
- Pièces avec éléments muraux fins à préserver (radiateurs, thermostats)
- Poutres de section < 15cm
- Murs accent à motif discret

**Protocole de test recommandé** :
- 8 générations comparatives (4 pièces × detail:"high" vs detail:"low")
- Pièces test : (1) pièce avec radiateur mural, (2) poutres fines, (3) mur accent subtil, (4) pièce standard
- Critères : les éléments muraux sont-ils préservés ? Les poutres sont-elles intactes ?
- **Seuil GO** : 0 élément structural supprimé sur les 8 générations

---

### R7 : gpt-4.1-mini pour passe 1

**Gain estimé** : 3-10s  
**Où** : `route.ts` ligne 716, changer `model: "gpt-4.1"` en `model: "gpt-4.1-mini"` pour la passe 1  

**Risque concret** :
- gpt-4.1-mini a une capacité de raisonnement réduite par rapport à gpt-4.1
- Les 22 sprints de prompt engineering ont été calibrés sur gpt-4.1
- Risques spécifiques :
  - Compréhension moins fine des contraintes complexes ("preserve vault beams rough texture")
  - Suivi moins rigoureux des directives conditionnelles ("if beams visible, whitewash them")
  - Possible non-respect de "no warm color shift" ou "cover electrical outlets"
  - Le mini pourrait ignorer certaines contraintes en fin de prompt (attention window plus courte)

**Scènes à risque** :
- Toutes les pièces avec contraintes de préservation complexes
- Styles éloignés de l'input (Art Deco sur chantier brut = beaucoup de changements)

**Protocole de test recommandé** :
- 10 générations comparatives (5 pièces × gpt-4.1 vs gpt-4.1-mini)
- Pièces variées : chantier brut, pièce finie, voûte, loft, petite pièce
- Critères : respect de CHAQUE directive du prompt (checklist systématique)
- Audit agents obligatoire — c'est le changement le plus risqué de Phase 2
- **Seuil GO** : delta qualité < 0.5 point + 0 directive ignorée

---

## Phase 3 — Optimisations structurelles

### R5 : Sauvegardes post-réponse (saveUserPhoto + logGeneration)

**Gain estimé** : 5-15s (le 2e plus gros levier)  
**Où** : `route.ts` lignes 1534-1615  

**Analyse technique** :
- Actuellement, `saveUserPhoto` (3 saveImage + 1 INSERT) et `logGeneration` (3 saveImage + 1 INSERT) sont `await`-ed AVANT `return response`
- Raison : Sprint 19 — Replit autoscale tue le worker après l'envoi de la réponse HTTP
- Les commentaires dans le code (lignes 1534-1536) expliquent explicitement pourquoi

**Options** :
1. **`waitUntil()` de Next.js** : disponible depuis Next.js 15 via `unstable_after`. Non disponible en Next.js 14 (stack actuelle).
   - **Action requise** : migrer vers Next.js 15 OU vérifier si Replit supporte un mécanisme équivalent
2. **Streaming partiel** : envoyer l'image immédiatement via streaming, continuer les sauvegardes
   - Complexe à implémenter, changerait le format de réponse côté client
3. **Queue externe** : envoyer un job à une queue (Redis, BullMQ) qui fait les sauvegardes
   - Overengineered pour le stade actuel du produit

**Test recommandé** :
- Créer un endpoint test `/api/test-after-response` qui fait un `setTimeout(saveToStorage, 0)` après le `return`
- Vérifier si le fichier apparaît dans Object Storage après 30s
- Si oui : Replit ne tue pas le worker immédiatement → on peut déplacer les sauvegardes post-réponse
- Si non : confirme le comportement documenté, R5 est bloqué sans migration Next.js 15

**Verdict** : **NE PAS appliquer sans test d'infrastructure.** Le risque de perte d'images et de logs est trop élevé.

---

### R8 : Output JPEG pour Flux Depth Pro

**Gain estimé** : 0.5-2s  
**Où** : `route.ts` fallback Flux, changer `output_format: "png"` en `output_format: "jpg"`  

**Risque** : Quasi nul. L'image Flux est un intermédiaire (passe 1), reconvertie en JPEG avant envoi au client. Le PNG est un gaspillage de bande passante sur un résultat qui sera compressé de toute façon.

**Verdict** : Applicable immédiatement. Gain marginal mais gratuit.

---

## Tableau récapitulatif Phase 2+3

| # | Optimisation | Gain | Risque qualité | Nécessite audit visuel | Verdict |
|---|---|---|---|---|---|
| R1a | quality:"low" passe 1 | 10-20s | Moyen | Oui (10 générations) | Tester |
| R1b | quality:"medium" passe 2 | 5-10s | Moyen-haut | Oui (12 générations) | Tester |
| R2 | detail:"low" passe 1 | 3-8s | Moyen | Oui (8 générations) | Tester |
| R7 | gpt-4.1-mini passe 1 | 3-10s | Haut | Oui (10 générations) | Tester dernier |
| R5 | Sauvegardes post-réponse | 5-15s | Perte données si échec | Non (test infra) | Bloqué sans test |
| R8 | JPEG pour Flux | 0.5-2s | Aucun | Non | Applicable |

**Ordre recommandé** : R8 (gratuit) → R1a (plus gros gain testable) → R2 → R1b → R7 (plus risqué, en dernier)

---

**Handoff → fondateur**
- Aucune optimisation Phase 2 n'est appliquée
- Chaque optimisation a son protocole de test et son seuil GO/NO-GO
- Le fondateur décide lesquelles tester et dans quel ordre
