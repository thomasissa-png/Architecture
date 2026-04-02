# Audit Visuel — Lucas Moreau — 2 avril 2026

Generations #97 et #98 | Versimo v37 | Pipeline OpenAI Responses API gpt-4.1

---

## #97 — Japandi Cuisine (generation de base)

### Preservation spatiale (CRITERE N1)

- **Angle de vue** : globalement fidele, camera frontale sur le mur cuisine, legere plongee conservee.
- **Fenetres** : 2 ouvrants a gauche preserves, position et proportions correctes. BIEN.
- **Porte** : ouverture a droite preservee, bon positionnement.
- **Profondeur** : respectee. La piece garde ses proportions.
- **Radiateur sous fenetre** : PRESENT — c'est un progres notable (cf. Sprint 18 ou les radiateurs disparaissaient).
- **Plafond** : le modele a INVENTE des poutres apparentes en bois clair. L'input montre un plafond placo rose avec spots encastres, ZERO poutre. C'est une hallucination structurelle. Penalisant mais pas catastrophique car le volume est respecte.
- **Sol** : dalles grises coherentes avec la chape brute de l'input. Bon choix.
- **Murs** : transformation placo vert → blanc chaud propre. Coherent avec la passe 1 surfaces.

**Verdict preservation** : 7/10. L'espace est reconnaissable malgre l'hallucination poutres.

### Notes detaillees

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale | 7/10 | Poutres hallucinees au plafond. Reste fidele autrement |
| 2 | Contraintes lumiere | 8/10 | Lumiere naturelle a gauche preservee, falloff correct |
| 3 | Vocabulaire photo | 7/10 | Grain subtil visible, DOF profonde, netteté OK |
| 4 | Structure prompt | 8/10 | Japandi lisible : bois clair, minimalisme, luminaire Akari-style |
| 5 | Negative prompting | 6/10 | Poutres generees = element structural non demande |
| 6 | Compatibilite multi-modeles | 7/10 | N/A (GPT-4.1 seul ici) |
| 7 | Coherence I/O | 8/10 | Ratio paysage preserve |
| 8 | Richesse descriptive | 8/10 | Cuisine equipee coherente, accessoires bien doses |
| 9 | Adaptabilite conditions | 8/10 | Chantier brut bien gere (placo → finitions) |
| 10 | Rendu final credible | 8/10 | Passe pour une photo pro. Linge au sol = detail realiste |

**Note ponderee** : (7x3 + 8 + 7 + 8 + 6 + 7 + 8 + 8 + 8 + 8x2) / 14 = **7.4/10**

---

## #98 — Iteration sur #97 ("enlever quelque chose au sol")

### ALERTE : ITERATION DESTRUCTRICE

Le probleme signale par l'utilisateur est confirme et GRAVE. L'iteration #98 a **detruit la quasi-totalite du mobilier** de #97 :

- **Cuisine equipee** : le four encastre a DISPARU. La plaque de cuisson a DISPARU. L'evier est reduit. Les meubles hauts sont remplaces par un grand placard plein. Le plan de travail est simplifie.
- **Credence** : la credence blanche texturee de #97 a DISPARU.
- **Accessoires** : la planche a decouper ronde, les fruits, le pot a ustensiles, les plantes sur le rebord de fenetre — TOUT a disparu.
- **Murs** : les murs blancs propres de #97 sont devenus textures/granuleux (aspect enduit ou bruit numerique). REGRESSION NETTE.
- **Un meuble parasite** a droite : un element bas en bois est apparu au premier plan droit, absent de #97. HALLUCINATION.

L'utilisateur demandait simplement d'enlever le linge au sol. Le modele a interprete cela comme une raison de REGENERER la scene entiere.

### Preservation spatiale (CRITERE N1)

- **Angle** : legerement recule/elargi par rapport a #97 — la piece parait plus spacieuse.
- **Fenetres** : preservees, radiateur preservee.
- **Poutres hallucinees** : toujours presentes (coherent avec #97 au moins).
- **Porte droite** : visible mais partiellement obstruee par le meuble hallucine.

**Verdict preservation** : 5/10 (par rapport a #97 comme input). L'espace est le meme mais le CONTENU est detruit.

### Notes detaillees

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale | 5/10 | Angle modifie, meuble hallucine a droite |
| 2 | Contraintes lumiere | 5/10 | Cast jaune/warm generalise, murs granuleux |
| 3 | Vocabulaire photo | 5/10 | Grain excessif, rendu "peinture numerique" |
| 4 | Structure prompt | 3/10 | Le commentaire demandait un retrait ponctuel, pas une refonte |
| 5 | Negative prompting | 4/10 | Meuble hallucine + disparition du mobilier existant |
| 6 | Compatibilite multi-modeles | 5/10 | N/A |
| 7 | Coherence I/O | 6/10 | Ratio OK mais contenu incoherent avec l'input |
| 8 | Richesse descriptive | 3/10 | Cuisine videe de ses elements, rendu pauvre |
| 9 | Adaptabilite conditions | 4/10 | Iteration simple = echec total |
| 10 | Rendu final credible | 4/10 | Ne passe PAS pour une photo pro. Texture murs suspecte |

**Note ponderee** : (5x3 + 5 + 5 + 3 + 4 + 5 + 6 + 3 + 4 + 4x2) / 14 = **4.5/10**

---

## Diagnostic technique — Cause racine de l'iteration destructrice

1. **Le prompt d'iteration re-genere au lieu d'editer.** "Enlever quelque chose au sol" devrait produire une retouche locale (inpainting-like), pas une regeneration complete de la scene.
2. **Le modele ne comprend pas "preservation du mobilier existant"** dans le contexte iteration. Les directives "surfaces LOCKED" de la passe 2 ne sont pas repliquees dans le prompt d'iteration.
3. **Warm color shift** : murs blanc → beige/jaune. Violation de la regle "do not add warm tint".
4. **Texture parasite sur les murs** : grain/bruit qui n'existait ni dans l'input ni dans #97.

---

## Plan d'amelioration

| Priorite | Action | Fichier cible |
|----------|--------|---------------|
| **P0** | Prompt d'iteration : injecter "Preserve ALL existing furniture, appliances, and decoration exactly as they appear. Only modify what the user explicitly asks to change." | iteration-prompt.ts |
| **P0** | Prompt d'iteration : ajouter "Do NOT regenerate the scene. Make a MINIMAL edit." | iteration-prompt.ts |
| **P1** | Renforcer "do not add warm tint or yellow cast" dans le builder iteration | iteration-prompt.ts |
| **P1** | Renforcer "do not add surface texture to smooth walls" dans le builder iteration | iteration-prompt.ts |
| **P2** | Poutres hallucinees (#97) : le surfacePrompt Japandi ou le builder mentionne-t-il des poutres ? Verifier et supprimer si oui | StylePicker.tsx |
| **P3** | Investiguer si input_fidelity "high" est bien passe dans le call iteration | route.ts / generation-pipeline.ts |

---

## Synthese

| Gen | Style | Type | Note Lucas | Verdict |
|-----|-------|------|------------|---------|
| #97 | Japandi cuisine | Base | **7.4/10** | CORRECT — hallucination poutres a corriger |
| #98 | Japandi cuisine | Iteration | **4.5/10** | ECHEC — iteration destructrice, mobilier perdu |

L'iteration est le probleme majeur. Le pipeline 2 passes de base (#97) fonctionne. Le pipeline d'iteration (#98) ne contient pas les gardes-fous necessaires pour empecher la regeneration complete de la scene. C'est un P0 bloquant : chaque iteration risque de degrader le resultat au lieu de l'ameliorer.

---

*Lucas Moreau — 2 avril 2026*
*Audit #97-#98 | Versimo v37 | OpenAI Responses API gpt-4.1*
