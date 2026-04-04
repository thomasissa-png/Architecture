# Audit visuel v47 -- Boheme bureau -- Lucas Moreau

**Date** : 2026-04-04 | **Version prompts** : v47 | **Modele** : gpt-image-1.5 | **Style** : Boheme

---

## ALERTE PRESERVATION SPATIALE

Les 2 generations elargissent le champ de vision par rapport a l'input. L'input est un cadrage portrait serre (angle plongeant vers le coin droit, 2 fenetres visibles, convecteur sous fenetre frontale). Les outputs reculent la camera et montrent une piece plus large. La Gen 1 hallucine une 3e fenetre a gauche.

---

## Grille technique (10 criteres)

| # | Critere | Poids | Gen 1 (#158) | Gen 2 (#160) |
|---|---------|-------|--------------|--------------|
| 1 | Preservation spatiale | x3 | **5/10** -- angle elargi, 3 fenetres au lieu de 2 (hallucination), profondeur etiree | **6/10** -- angle elargi mais 2 fenetres correctes, proportions plus fideles |
| 2 | Contraintes lumiere | x1 | 7/10 -- direction lumiere OK, leger warm shift sur les murs gris | 7/10 -- idem, warm shift modere |
| 3 | Vocabulaire photo | x1 | 8/10 -- rendu propre, DOF coherente, pas de grain (conforme regle fondateur) | 8/10 -- idem |
| 4 | Structure prompt | x1 | 7/10 -- bureau au fond = distribution profondeur OK, mur accent preserve | 7/10 -- bureau a gauche, bonne distribution |
| 5 | Negative prompting | x1 | 4/10 -- fenetre hallucinee (3e fenetre gauche) | 7/10 -- pas d'element interdit |
| 6 | Compatibilite multi-modeles | x1 | N/A (modele unique gpt-image-1.5) | N/A |
| 7 | Coherence I/O | x1 | 6/10 -- ratio portrait respecte mais champ elargi | 7/10 -- ratio OK, champ moins deforme |
| 8 | Richesse descriptive | x1 | 8/10 -- mobilier varie et coherent boheme | 8/10 -- idem, composition differente |
| 9 | Adaptabilite conditions | x1 | 7/10 -- murs violet traites comme accent (bon choix) | 7/10 -- idem |
| 10 | Rendu final credible | x2 | 7/10 -- convaincant a distance, 3e fenetre tue la credibilite au detail | 8/10 -- passe pour une photo pro |
| | **Note ponderee /10** | | **CAP 5.0** (preservation < 7) | **6.9/10** |

---

## Reponses aux 5 questions critiques

| Question | Gen 1 (#158) | Gen 2 (#160) |
|----------|--------------|--------------|
| 1. Preservation geometrique | NON -- 3e fenetre hallucinee, angle elargi, profondeur etiree | PARTIEL -- 2 fenetres OK mais angle toujours elargi |
| 2. Generations differentes ? | OUI -- bureau fond/droite vs gauche/fenetre, fauteuil rotin vs accent tissu, pendant cylindrique vs sphere, layout miroir | OUI |
| 3. action:"edit" effectif ? | PARTIEL -- mur accent preserve = edition, mais angle modifie = regeneration partielle | PARTIEL -- meme constat, meilleur ancrage |
| 4. Artefacts IA ? | 3e fenetre hallucinee, bord gauche du canape legerement flou | RAS -- pas d'artefact majeur |
| 5. Photorealisme vs CGI ? | 7/10 -- bon photorealisme, ombres portees coherentes, textures convaincantes | 8/10 -- meilleur, materiaux plus naturels |

---

## Verdict technique

**resolveChooseOne : FONCTIONNE** -- les 2 generations ont un layout, un mobilier et des luminaires differents. La variete est reelle et utile.

**action:"edit" : PARTIELLEMENT EFFECTIF** -- le mur accent violet est preserve (preuve d'edition), le convecteur est visible dans les 2 outputs. Mais l'elargissement du champ de vision indique que le modele regenere partiellement la scene au lieu d'editer strictement.

**Meilleure generation : #160 (Gen 2)** -- preservation spatiale superieure (2 fenetres, angle plus fidele), zero artefact, rendu plus credible.

## Recommandations P0-P1

- **P0** : Renforcer l'ancrage camera dans le builder -- "EXACT same camera position, height, tilt, and field of view as the input photo. Do NOT widen or pull back the frame."
- **P0** : Anti-hallucination fenetre -- "Count windows in the input. Output must have EXACTLY the same count."
- **P1** : Le warm shift sur les murs gris (ex-violet) reste present malgre la directive anti-warm. Investiguer si le surfacePrompt Boheme contient des termes chauds ("warm", "honey") qui contaminent les murs non-accent.

---

*Lucas Moreau -- Expert IA Image -- 2026-04-04*
