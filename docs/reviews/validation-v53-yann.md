# Validation prompt passe 1 v53 -- Yann Duval

Date : 2026-04-05 | Version : v53 | Scope : PASS1_PREAMBLE_V53 + PRESERVATION_V53 + CLEANUP_V53 + 3 surfacePrompts

## 1. Preservation geometrique -- 9/10

"STRUCTURE LOCK" en premier token est exactement ce qu'il faut -- gpt-image-1.5 pese les premiers mots. La liste explicite (column, beam, slab edge, ceiling shape) couvre les cas chantier brut que j'ai vus echouer dans les audits 91-95. "Apply finishes OVER existing textures, not replacing the 3D shape underneath" est la phrase cle : elle distingue peinture (finition) de lissage (destruction). PRESERVATION_V53 renforce avec "keep every bump, step, soffit, vault" -- les soffits etaient absents des versions precedentes. Seul manque : les IPN et linteaux metalliques ne sont pas nommes dans v53 (ils le sont dans WALL_PRESERVATION v52 mais pas dans le bloc condense).

## 2. Position du style -- 8/10

Le surfacePrompt arrive en 4e position apres PREAMBLE, inventaire, PRESERVATION. C'est un compromis justifie : la preservation DOIT primer sur le style pour eviter la regeneration. Le format "Surface style: {prompt}" est clair. Risque faible : sur un prompt tres long (~220 mots au total), le style est au milieu -- mais la condensation v53 (663 mots a 180) compense largement.

## 3. Hero pieces dans les surfacePrompts -- 9/10

- Scandinave : "PH5-style layered shade" -- parfait, ancrage stylistique immediat
- Japandi : "round washi paper pendant" -- correct, signature Akari/Noguchi
- Haussmannien : "classic French chandelier with crystal drops and gilt bronze arms 60cm" -- dimension + materiaux, credible

Chaque luminaire est specifique et dimensionne. Zero risque de lampadaire arc generique en passe 1.

## 4. Montrable a un client architecte ? -- OUI

La structure du prompt est professionnelle : preservation d'abord, style ensuite, nettoyage chantier en dernier. Un architecte qui lirait ce brief comprendrait l'intention. Le CLEANUP_V53 est particulierement bien calibre : il distingue "loose construction items" (a supprimer) de "fixed equipment" (a conserver) -- cette nuance etait la cause d'echecs repetes (radiateurs supprimes, audits 91-95).

## 5. Note globale

| Critere | Note | Poids | Pondere |
|---------|------|-------|---------|
| Preservation spatiale | 9 | x3 | 27 |
| Fidelite stylistique | 8 | x2 | 16 |
| Eclairage | 8 | x1 | 8 |
| Hero pieces | 9 | x1 | 9 |
| Coherence matieres | 8 | x1 | 8 |
| Credibilite pro | 9 | x2 | 18 |
| Completude | 8 | x1 | 8 |
| Vocabulaire visuel | 8 | x1 | 8 |
| Adaptabilite spatiale | 8 | x1 | 8 |
| Potentiel photorealiste | 8 | x1 | 8 |
| **TOTAL** | | /14 | **8.4/10** |

## Point d'attention unique

Les IPN/linteaux metalliques nommes dans WALL_PRESERVATION (v52, utilise en passe 2) ont disparu du bloc condense v53 (passe 1). Si la passe 1 lisse un IPN, la passe 2 ne pourra pas le recuperer. Ajouter "IPN beams and metal lintels" dans PRESERVATION_V53 apres "Columns and posts".
