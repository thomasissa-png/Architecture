# Validation technique v53 — Passe 1 prompts gpt-image-1.5

**Auteur** : Lucas Moreau (@ai-image-expert) | **Date** : 2026-04-05

## 1. Ordre des tokens — STRUCTURE LOCK en premier

Optimal. "STRUCTURE LOCK" en position 0 est le meilleur choix pour gpt-image-1.5 qui pese les premiers tokens exponentiellement. Le mot "Edit" de l'ancien PASS1_PREAMBLE est remplace par une CONTRAINTE en tete — correct car ce modele est plus creatif que gpt-image-1 et doit etre bride avant d'agir. L'instruction d'action ("Edit surfaces only") arrive en fin de PREAMBLE, apres le verrouillage. **9/10.**

## 2. Longueur (~180 mots, ~220 assemble)

Dans le sweet spot. Le commentaire code dit "loses focus after ~200 words" — les 3 constantes font ~175 mots, le prompt assemble (avec surfacePrompt + DSLR_LINE) atteint ~220. C'est la limite haute mais acceptable car les derniers tokens (CLEANUP + DSLR) sont des listes factuelles, pas des contraintes abstraites a interpreter. **8/10.**

## 3. Formulations concretes vs abstraites

Excellentes. Chaque directive nomme un element physique : "column, beam, slab edge", "bump, step, soffit, vault". "Paint over their surface, keep their shape" — instruction binaire, zero ambiguite. "Apply finishes OVER existing textures, not replacing the 3D shape underneath" — distinction critique que le modele peut interpreter visuellement. Seul point perfectible : "No warm color shift" pourrait etre "Keep whites and greys at the same color temperature as input". **8.5/10.**

## 4. Contradictions internes

Aucune detectee. PREAMBLE dit "edit surfaces only", PRESERVATION detaille quoi garder, CLEANUP detaille quoi nettoyer. Les 3 blocs sont complementaires sans chevauchement. "Keep all fixed equipment" (CLEANUP) ne contredit pas "edit surfaces" (PREAMBLE) car les equipements ne sont pas des surfaces. **10/10.**

## 5. Compatibilite PASS2_PREAMBLE

Compatible. PASS2 dit "wall colors, floor material, ceiling finish are final — keep unchanged". C'est exactement ce que la passe 1 v53 produit. PASS2 conserve les anciens CAMERA_PRESERVATION, COLUMN_PRESERVATION en plus — redondance acceptable car la passe 2 recoit une image differente. Le "No curtains, no drapes" de PASS2 est absent de v53 passe 1 — correct, la passe 1 produit une piece vide. **9/10.**

## 6. Note globale sur grille technique

| Critere | Note |
|---------|------|
| Structure prompt (tokens) | 9/10 |
| Longueur / densite | 8/10 |
| Concretude formulations | 8.5/10 |
| Zero contradiction | 10/10 |
| Compatibilite pipeline | 9/10 |
| **Moyenne** | **8.9/10** |

**Verdict** : v53 est un condensat solide et bien structure. La reduction de 663 a ~180 mots est un gain majeur pour la fenetre d'attention de gpt-image-1.5. Aucun correctif bloquant.

**Seule suggestion P2** : remplacer "No warm color shift" par "Keep the input's color temperature — do not warm or cool" pour etre symetrique (couvre aussi le cool shift potentiel).
