# Audit Visuel v45 prod — Yann Duval — 4 avril 2026

**Generations** : #150/#151 et #147/#148 | **Style** : Scandinave salon | **Modele** : gpt-image-1.5 | **Prompts** : v45
**Baseline comparaison** : v43 gpt-image-1.5 cuisine = 3.5-5.7/10 | v42 gpt-image-1 cuisine = 7.6-8.0/10

---

## VERDICT : PROGRESSION MASSIVE — v45 valide sur gpt-image-1.5

Les prompts v45 "preservation-first" corrigent le defaut principal de gpt-image-1.5 : la piece n'est plus REMPLACEE. L'espace est reconnaissable. C'est un saut de +2 a +3 points par rapport aux v43.

---

## Generation 1 — #150 (pass1) + #151 (output) — Scandinave salon

**Input** : Piece en chantier ~25m2, placo blanc brut, chape grise, 2 sorties cables plafond, boitiers electriques muraux, decrochement mural central (retrait ~30cm), pas de fenetre visible, eclairage artificiel.

### Preservation spatiale
- Angle de vue : PRESERVEE — meme frontal grand-angle, meme hauteur
- Proportions piece : PRESERVEES — largeur, profondeur, rapport hauteur/largeur corrects
- Decrochement mural central : PRESERVE — le retrait entre les 2 zones est intact en pass1 ET output
- Plafond : geometrie plate PRESERVEE, pas de voute inventee
- Fenetres/portes : aucune fenetre dans l'input, aucune ajoutee = CORRECT
- Prises electriques : nettoyees en pass1 (bon), MAIS un radiateur blanc a gauche APPARAIT — non present dans l'input

### Fidelite stylistique
Scandinave credible : canape lin naturel pieds bois, fauteuil wing-back Wegner-style, table basse plateau blanc/pied bois, etagere echelle chene, tapis tisse ecru, coussin bleu sourd. Pendant PH5-style au plafond. Palette warm white/ash/bleu sourd = correcte.

### Points d'attention
- Radiateur invente a gauche (absent de l'input) — hallucination d'equipement
- Rendu tres propre, limite CGI-clean — manque de micro-imperfections photo
- Sol oak plank bien rendu, coherent avec le surfacePrompt

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale (x3) | 7.5 | Angle, proportions, decrochement preserves. Radiateur hallucine (-0.5). |
| 2 | Fidelite stylistique (x2) | 8.0 | Scandinave Muuto/HAY credible. Wegner-style, PH5, palette juste. |
| 3 | Eclairage (x1) | 7.0 | Lumiere artificielle coherente. Leger eclaircissement homogene vs input. |
| 4 | Hero pieces (x1) | 8.5 | PH5-style, Wegner wing chair, etagere echelle = ancrage stylistique fort. |
| 5 | Coherence matieres (x1) | 8.0 | Bois clair/lin/laine tisse = combinaison coherente. |
| 6 | Credibilite pro (x2) | 7.5 | Montrable a un client. Radiateur fantome gene. Rendu propre mais un peu CGI. |
| 7 | Completude (x1) | 7.5 | Plaid, coussins, plante, vase = complet. Manque une lampe a poser. |
| 8 | Vocabulaire visuel (x1) | 7.5 | Textures lisibles. Boucle du tapis, grain du bois, lin du canape. |
| 9 | Adaptabilite spatiale (x1) | 8.0 | Mobilier bien proportione pour ~25m2. Pas de cramming. |
| 10 | Potentiel photorealiste (x1) | 6.5 | Trop lisse, eclairage trop uniforme. Passe difficilement pour une vraie photo. |

**Note ponderee : 7.6/10**

---

## Generation 2 — #147 (input) + #148 (output) — Scandinave salon

**Input** : Meme piece que #150, angle legerement different (plus centre, cadrage un peu plus large).

### Preservation spatiale
- Angle de vue : PRESERVEE — frontal similaire, proportions coherentes
- Decrochement mural : PRESERVE — retrait central intact
- Plafond : geometrie plate PRESERVEE
- Fenetres : aucune dans l'input, aucune ajoutee = CORRECT
- Aucun equipement hallucine cette fois (pas de radiateur fantome)

### Fidelite stylistique
Composition quasi identique a #151 (memes meubles, meme palette) — c'est attendu pour le meme style. Canape lin, fauteuil wing-back, etagere echelle, PH5-style pendant. Coussin bleu sourd.

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale (x3) | 8.0 | Angle, proportions, decrochement = tout correct. Zero hallucination. |
| 2 | Fidelite stylistique (x2) | 8.0 | Meme qualite scandinave. Coherent. |
| 3 | Eclairage (x1) | 7.0 | Distribution lumineuse coherente, leger HDR artificiel. |
| 4 | Hero pieces (x1) | 8.5 | PH5, Wegner, echelle = trio d'ancrage solide. |
| 5 | Coherence matieres (x1) | 8.0 | Identique a #151. |
| 6 | Credibilite pro (x2) | 8.0 | Montrable. Pas de radiateur fantome, meilleure credibilite. |
| 7 | Completude (x1) | 7.5 | Meme remarque : manque une source lumineuse secondaire. |
| 8 | Vocabulaire visuel (x1) | 7.5 | Textures lisibles, coherentes. |
| 9 | Adaptabilite spatiale (x1) | 8.0 | Proportions mobilier/piece justes. |
| 10 | Potentiel photorealiste (x1) | 6.5 | Meme limite CGI-clean. |

**Note ponderee : 7.8/10**

---

## Synthese comparative

| Metrique | v43 gpt-1.5 (cuisine) | v45 gpt-1.5 (salon) | Delta |
|----------|----------------------|---------------------|-------|
| Preservation spatiale | 2.0-3.0 | 7.5-8.0 | **+5.0** |
| Note globale Yann | 3.5-5.7 | 7.6-7.8 | **+2.5** |
| Piece remplacee ? | OUI (voutes, arches inventees) | NON | FIX |
| Fenetres hallucinee ? | OUI (deplacees/inventees) | NON | FIX |
| Hero pieces scandinaves | n/a (mediterraneen) | PH5 + Wegner + echelle | OK |

## Correctifs P0-P2

- **P0** : Radiateur hallucine en #151 — verifier que le builder ne mentionne pas "radiator" positivement. Ajouter "Do not add radiators or heaters not present in the input" dans le builder passe 1.
- **P1** : Rendu CGI-clean — les 2 outputs sont trop lisses. La decision fondateur interdit le grain ISO, mais la consequence est un potentiel photorealiste plafonne a 6.5. A noter comme trade-off accepte.
- **P2** : Lampe a poser manquante — le furniturePrompt scandinave devrait inclure "slim table lamp with fabric shade on side table" pour completer la scenographie lumineuse.
- **P2** : Variete inter-generations — les 2 outputs sont quasi identiques (memes meubles, meme layout). Normal pour un meme style, mais un client qui regenere attend de la variation.

---

**Conclusion** : Les prompts v45 "preservation-first" fonctionnent. La restructuration "Edit" en premier token + preservation AVANT le style resout le probleme fondamental de gpt-image-1.5 (recreation de scene). La note passe de 3.5-5.7 a 7.6-7.8 sur un input similaire (chantier brut). Validation pour deploiement sur les autres styles.
