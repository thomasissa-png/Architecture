# Audit technique final — Pipeline Versimo v48

**Auteur** : Lucas Moreau | **Date** : 2026-04-04 | **Fichiers** : generation-pipeline.ts, compositing.ts, iteration-prompt.ts

---

## 1. SSIM local vs scoring vision API

Le SSIM global sur image 256x256 greyscale mesure la **correlation structurelle moyenne** — il detecte les derives majeures (angle change, piece recreee) mais rate les erreurs localisees : une fenetre hallucinee sur un mur lateral, un radiateur supprime, une poutre lissee. Le mapping lineaire `ssim * 10` est trop genereux — un SSIM de 0.7 (image assez differente) donne un score de 7/10. En pratique, les 2 candidats best-of-2 sont generes par le meme modele avec le meme prompt, donc leurs SSIM sont souvent tres proches (delta < 0.02), rendant le choix quasi aleatoire. **Suffisant comme filet de securite, insuffisant comme juge de qualite.** Un SSIM par blocs (fenetres, murs, plafond) via les bounding boxes de compositing.ts serait nettement plus discriminant.

## 2. Regex isComplexRoom

`/vault|beam|mezzanine|double.height|L.shaped|loft|cathedral|arch|3\s*window|4\s*window|5\s*window/i` — bonne couverture des cas structurellement risques. **Manques** : `pillar|column|alcove|split.level|curved.wall|bay.window`. Le `double.height` avec un point wildcard matche aussi "double-height" (tiret) — OK. Le pattern `3\s*window` ne matche pas "3 windows" avec "s" — il faudrait `[345]\s*windows?`. Globalement **correctement calibree a 80%**, les cas manquants sont rares.

## 3. Compositing sharp — risque d'artefacts

Le risque principal est le **decalage de perspective** : le modele genere a 1024x1024 ou 1536x1024, l'original est resize avec `fit: "fill"` (stretch), et les bounding boxes sont en pourcentages issus de la vision GPT-4.1-mini. Triple source d'imprecision (resize stretch + erreur bbox vision + generation qui deplace legerement les elements). Sur une fenetre bien alignee, ca passe. Sur un radiateur etroit (5% de l'image), un decalage de 2% = couture visible. Le feathering attenuje mais ne resout pas un misalignment de 10+ pixels. **Risque reel mais attenue par le fail-open.**

## 4. Feathering dynamique (imgWidth * 0.005)

Sur 1536px = 7.7px de rayon, sur 1024px = 5.1px (clamp min 5). Pour des fenetres (grandes zones), c'est suffisant — le gradient est doux sur 15px de diametre. Pour des equipements petits (prise electrique, thermostat), le feathering represente une fraction significative de la bbox et peut rendre l'element flou. **Recommandation** : feathering proportionnel a la taille de la bbox (`Math.max(3, Math.min(boxW, boxH) * 0.03)`) plutot qu'a l'image globale.

## 5. action:"edit" + input_fidelity:"high"

C'est la configuration optimale de l'API Responses. `action:"edit"` force le mode edition (vs generation libre), `input_fidelity:"high"` envoie l'image en pleine resolution au modele vision. `detail:"high"` sur l'input_image est egalement present. **Tout est exploite.** Le seul levier non utilise est `previous_response_id` pour chainage contextuel passe 1 → passe 2, mais le gain est incertain et le risque de regression non negligeable.

## 6. Prompts condenses (~200 mots)

Les prompts passe 1 font ~180 mots, passe 2 ~220 mots. Le ratio signal/bruit est bon : PASS1_PREAMBLE en position 1 (preservation), ANTI_FENETRE en position 2 (comptage), puis constantes structurelles, puis style, puis DSLR. **La hierarchie de tokens est correcte** — les premieres positions portent les contraintes critiques, le style arrive au milieu, les descripteurs photo a la fin. Les constantes partagees evitent la duplication. Le resolveChooseOne() pour la variete est elegant. **Signal/bruit : 8/10.**

## 7. Score max atteignable

Avec le pipeline actuel (2 passes, vision inventory, best-of-2, compositing, prompts v48 preservation-first), sur des pieces standard (salon, chambre, 1-2 fenetres, plafond plat), le score moyen atteignable est **8.0-8.5/10**. Sur des espaces complexes (voutes, mezzanines, multi-fenetres), **7.0-7.5/10**. Le plafond est dicte par gpt-image-1.5 lui-meme — sa tendance a regenerer plutot qu'editer reste le facteur limitant. Le compositing structural peut monter les cas problematiques de 0.5-1.0 point. **Plafond realiste du pipeline : 8.5/10 en moyenne ponderee.**

## 8. Note technique et top 3 ameliorations

**Note technique : 8.2/10** — Architecture solide, fail-open partout, separation des concerns propre, hierarchie de prompts maitrisee. Les iterations sont chirurgicales. Le code est lisible et maintenable.

### Top 3 ameliorations techniques restantes

1. **SSIM par zones** (P1) : calculer le SSIM sur les bounding boxes structurelles individuellement au lieu du global — discrimine les hallucinations locales (fenetre ajoutee, radiateur supprime) que le SSIM global ne voit pas. Cout : ~100ms supplementaires, zero API.

2. **Chainage contextuel passe 1 → passe 2** (P2) : utiliser `previous_response_id` de l'API Responses pour que le modele "sache" ce qu'il a fait en passe 1 — potentiel de meilleure coherence surfaces/mobilier sans duplication de prompt. A tester en A/B.

3. **Feathering adaptatif par bbox** (P2) : remplacer le rayon global par un rayon proportionnel a la plus petite dimension de chaque bbox — evite le blur excessif sur les petits equipements tout en gardant un blend doux sur les fenetres.
