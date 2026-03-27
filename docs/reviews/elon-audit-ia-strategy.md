# Audit Strategique IA — Avis Elon

> AVIS CONSULTATIF — Ces recommandations necessitent validation avant execution.
> Date : 2026-03-27

## Score global : 7.2/10

Versiroom a un pipeline IA qui FONCTIONNE. C'est deja enorme. 90% des startups de home staging IA sont encore a se battre avec des modeles qui regenerent la scene au lieu de l'editer. Vous avez resolu ca. Mais vous etes en train de construire une cathedrale de prompts au lieu d'un moteur industriel. Et ca, ca ne scale pas.

---

## Scores par dimension

| Dimension | Score | Justification |
|---|---|---|
| Qualite de generation | 7.5/10 | Yann 8.0 indoor, geometrie 8.5-9.5 — solide mais pas best-in-class. Gepetto fait 15s avec qualite comparable. |
| Progression mesurable | 5/10 | Les audits agents sont excellents mais NON REPRODUCTIBLES. Pas de benchmark fixe, pas de metriques automatiques. |
| Zero regression | 4/10 | Le protocole APPLIQUER/REPORTER/REJETER est un process humain. Zero detection automatique. Un changement de modele cote OpenAI vous casse sans que vous le sachiez. |
| Performance | 5/10 | 90-120s quand Gepetto fait 15s. 6-8x plus lent. C'est un defaut FATAL pour la retention. |

---

## Ce qui fonctionne (ne pas toucher)

1. **Pipeline 2 passes** — C'est votre avantage competitif technique. La separation surfaces/mobilier est brillante. Quand on a developpe le Falcon 9, la decision de separer le premier etage (booster) du second (orbit) etait le meme type d'insight : decomposer un probleme complexe en sous-problemes simples que tu maitrises individuellement. Gardez ca.

2. **Split surfacePrompt / furniturePrompt** — Chaque passe recoit UNIQUEMENT l'info pertinente. C'est du first principles thinking applique au prompt engineering. Pas de bruit, pas de confusion de signal.

3. **Agents experts nommes (Yann/Lucas/Camille)** — Le systeme d'audit croise avec des personas specialises est un moat reel. La plupart des concurrents font du "vibe check" — vous avez une grille de scoring structuree avec des criteres ponderes.

4. **Apprentissages documentes** — 19 sprints de learnings detailles. C'est de l'or. La plupart des equipes refont les memes erreurs en boucle. Vous avez une memoire organisationnelle.

---

## Ce qui est broken

### 1. VOUS UTILISEZ LE MAUVAIS MODELE (Impact : CRITIQUE)

**Le probleme** : Vous utilisez `gpt-4.1` via la Responses API pour generer des images. GPT-4.1 est un LLM de raisonnement qui A AUSSI des capacites image. Ce n'est pas un modele image-first. C'est comme utiliser un pickup truck pour faire la course au Mans — ca roule, mais c'est pas concu pour ca.

**Ce qui existe maintenant** :
- **GPT Image 1.5** : Le modele image dedie d'OpenAI. 4x plus rapide que GPT Image 1. `input_fidelity="high"` preserve les details avec plus de fidelite. Meilleur suivi d'instructions pour l'edition. Disponible via `images.edit()` ET via Responses API. $0.034/image en medium quality (vs vos ~$0.05 actuels en gpt-4.1 avec tokens vision + output).
- **Flux 2** : Photoréalisme quasi-DSLR. ControlNet Union Pro 2.0 combine depth + canny + pose en un seul modele. $0.04-0.08/image. Self-hostable (Dev = open-weight).
- **Flux ControlNet Depth V3** : Exactement votre use case — depth map pour verrouiller la geometrie + prompt pour le restyling. Plus precis que Flux Depth Pro.

**Mon avis** : migrez vers GPT Image 1.5 comme primary. Ca prend une demi-journee de refactoring dans route.ts — vous changez le model name et vous ajustez les parametres. Gain immediat : vitesse + qualite + cout.

### 2. LA LATENCE VOUS TUE (Impact : CRITIQUE)

**Les faits** :
- Versiroom : 90-120s par generation
- Gepetto : 15s
- Collov : "quelques secondes"
- Edensign : "quelques secondes"

Vous etes 6-8x plus lent que votre concurrent direct (Gepetto, Bordeaux, meme marche). Thomas votre marchand de biens a 12 operations par an. S'il doit attendre 2 minutes par photo et qu'il en a 15 par bien, ca fait 30 minutes d'attente. Chez Gepetto, 4 minutes. C'est game over.

**Pourquoi vous etes lent** :
1. 2 passes sequentielles = 2 appels API (~45-60s chacun)
2. gpt-4.1 n'est pas optimise pour la generation d'images — il raisonne d'abord, genere ensuite
3. Fallback Flux ajoute de la latence quand OpenAI echoue

**Solutions** :
- **Quick win** : GPT Image 1.5 = 4x plus rapide que l'ancien modele. Estimation : passer de 45-60s a 15-20s par passe = 30-40s total. Ca vous met dans la course.
- **Medium term** : Explorer si la passe 1 peut etre cached plus agressivement. Si un utilisateur uploade 5 photos de la meme piece dans des styles differents, la passe 1 surfaces ne change pas pour le meme style.
- **Long term** : Si GPT Image 1.5 est assez bon en single-pass avec `input_fidelity="high"`, TESTER si un prompt unique bien structure peut remplacer les 2 passes. Ca diviserait la latence par 2.

### 3. ZERO REGRESSION = ZERO AUTOMATION (Impact : HAUTE)

**Le probleme** : Votre protocol anti-regression est un process humain. Yann et Lucas regardent les images, scorent, et documentent. C'est genial pour la phase R&D. C'est INTENABLE pour la production.

Scenario cauchemar : OpenAI met a jour GPT-4.1 (ou GPT Image 1.5) cote serveur. Pas de notification. Les generations deviennent subtilement pires. Vous ne le savez pas pendant des semaines. Vos utilisateurs partent.

Quand on lance un Starship chez SpaceX, on ne demande pas a un ingenieur de regarder par la fenetre si le moteur a l'air de bien tourner. On a des milliers de capteurs qui mesurent en temps reel.

**Ce qu'il faut** :
- Un **benchmark fixe de 10-15 images de reference** (differentes pieces, differentes conditions de lumiere, avec et sans murs accent, avec poutres, etc.)
- A chaque changement de PROMPT_VERSION OU a chaque deploy OU 1x/semaine en cron : regenerer les 10-15 images avec le pipeline actuel
- **Metriques automatiques** comparees au run precedent :
  - **SSIM** entre l'input et l'output (preservation geometrie) — seuil > 0.75
  - **CLIP score** entre le prompt et l'output (adherence au style) — seuil a calibrer
  - **LPIPS** entre runs successifs du meme benchmark (stabilite) — delta < 0.1
- Si un seuil est franchi → alerte Slack/email → freeze des deploys prompt

**Cout** : ~1.50 EUR par run de benchmark (15 images x 2 passes x ~0.05 EUR). Insignifiant.

### 4. LA PROGRESSION N'EST PAS MESURABLE (Impact : HAUTE)

**Le probleme** : Vous avez des scores Yann/Lucas par generation, mais :
- Les images INPUT changent a chaque batch d'audit
- Les conditions sont differentes (piece differente, lumiere differente)
- Impossible de comparer Sprint 15 vs Sprint 20 de maniere scientifique

C'est comme tester la vitesse d'une voiture sur une route differente a chaque fois. Tu mesures quelque chose, mais c'est pas comparable.

**Solution** : Le meme benchmark fixe que pour la regression. 10-15 images immuables. Chaque version de prompt est evaluee sur le MEME set. Les scores Yann/Lucas sont comparables d'une version a l'autre. Vous construisez une courbe de progression reelle.

---

## Ce qui manque

### 1. Benchmark reproductible (CRITIQUE)

Un dossier `benchmarks/` avec :
- `inputs/` : 10-15 images fixes (variete de pieces, conditions, styles)
- `expected/` : les meilleurs outputs connus (reference visuelle)
- `run.ts` : script qui regenere tout le set avec le pipeline courant
- `compare.ts` : script qui calcule SSIM/CLIP/LPIPS et genere un rapport
- `history/` : un JSON par run avec les scores et la version du prompt

### 2. Monitoring de modele (HAUTE)

Un cron (1x/semaine) qui :
1. Regenere 3 images du benchmark
2. Compare aux scores du dernier run
3. Si delta significatif → alerte

Ca detecte les changements de modele cote OpenAI que vous ne controlez pas.

### 3. A/B testing de prompts (MOYENNE)

Aujourd'hui : vous changez un prompt, deployez, et priez. Demain : vous servez 50% du trafic avec le prompt A et 50% avec le prompt B. Vous loguez les scores automatiques (SSIM, CLIP). Apres 100 generations, vous savez lequel est meilleur avec une signifiance statistique.

C'est comme ca qu'on optimise chez Tesla — on ne change pas la suspension sur toutes les voitures en meme temps. On fait un A/B sur une cohorte.

---

## Recommandations par priorite

| # | Action | Type | Impact | Effort | Agent concerne |
|---|---|---|---|---|---|
| 1 | Migrer de gpt-4.1 vers GPT Image 1.5 | Bloquant | Latence /2-3, qualite +, cout - | 2-4h | @ia + @fullstack |
| 2 | Creer le benchmark fixe de 15 images | Bloquant | Progression mesurable + regression detectee | 4-6h | @ia + @fullstack |
| 3 | Implementer SSIM/CLIP automatique sur le benchmark | Amelioration | Detection regression automatique | 6-8h | @fullstack |
| 4 | Tester single-pass avec GPT Image 1.5 input_fidelity="high" | Amelioration | Si ca marche : latence /2 en plus | 2h de test | @ia |
| 5 | Cron hebdo de monitoring modele (3 images benchmark) | Amelioration | Detection changements serveur OpenAI | 2h | @infrastructure + @fullstack |
| 6 | Evaluer Flux 2 + ControlNet Depth V3 comme remplacement du fallback | Vision | Fallback plus precis, potentiellement primary | 4-6h | @ia |
| 7 | A/B testing de prompts en production | Vision | Optimisation data-driven | 8-12h | @fullstack + @ia |

---

## Vision a 6 mois

### Mois 1-2 : Rattraper le marche en latence
- Migration GPT Image 1.5 → objectif : <40s par generation
- Si single-pass viable → <20s (competitif avec Gepetto)
- Benchmark fixe en place, metriques automatiques operationnelles

### Mois 3-4 : Industrialiser la qualite
- A/B testing de prompts en production
- Cron de monitoring modele
- Pipeline de benchmark integre dans le CI/CD (chaque PR de prompt declenche un run)
- Explorer Flux 2 ControlNet comme option pour la resolution superieure (2048x2048+)

### Mois 5-6 : Differenciation technique
- Si GPT Image 1.5 single-pass est suffisant : simplifier le pipeline. Moins de code, moins de bugs, plus rapide.
- Si 2 passes reste necessaire : optimiser avec le caching agressif (passe 1 partagee entre styles pour la meme image)
- Explorer la resolution 2K-4K pour le marche pro (Claire l'architecte veut du HD pour ses presentations)
- LoRA fine-tune sur Flux 2 Dev avec vos meilleures generations comme dataset de training — CA c'est le vrai moat technique

### Le scenario 10x

Si je devais multiplier l'impact par 10, voici ce que je changerais fondamentalement :

1. **Fine-tune un modele dedie** au home staging virtuel. Vous avez des centaines de paires (input, output) validees par des experts. C'est un dataset de gold. Un LoRA sur Flux 2 Dev entraine sur VOS meilleures generations serait fondamentalement superieur a tout prompt engineering. Le prompt engineering a un plafond — le fine-tuning n'en a pas.

2. **Self-host le modele fine-tune** — cout marginal quasi-zero par generation. Plus de dependance a OpenAI. Plus de risque de changement de modele. Latence controlee end-to-end.

3. **<5 secondes par generation** — c'est la ou vont les leaders du marche. Avec un modele fine-tune sur GPU, c'est faisable.

---

## Hypotheses a valider

- [HYPOTHESE : GPT Image 1.5 preserve la geometrie aussi bien que gpt-4.1 avec le pipeline 2 passes actuel] — a tester sur le benchmark avant migration
- [HYPOTHESE : Single-pass GPT Image 1.5 input_fidelity="high" est viable pour le home staging] — a tester. Si ca marche, c'est un game-changer. Si ca ne marche pas, le pipeline 2 passes reste.
- [HYPOTHESE : Les metriques SSIM/CLIP correlent avec les scores Yann/Lucas] — a calibrer. Si la correlation est faible, les metriques auto ne remplacent pas les audits mais les completent.
- [HYPOTHESE : Un LoRA fine-tune sur 200-300 paires de generations validees produirait un modele superieur au prompt engineering] — a valider en mois 4-5.

---

## Dimensions non auditees (donnees manquantes)

- **Cout exact par generation actuel** — je n'ai pas le detail tokens input + output sur les factures OpenAI. Necessaire pour chiffrer le gain de la migration.
- **Taux d'echec reel en production** — combien de generations echouent en passe 1 et tombent sur Flux ? Combien echouent en passe 2 et livrent une piece vide ? Les logs PostgreSQL ont cette data.
- **Distribution des styles utilises** — quels styles sont les plus demandes en prod ? Ca devrait driver la priorite d'optimisation des prompts.
- **Satisfaction utilisateur reelle** — les scores Yann/Lucas sont des audits internes. Qu'en pensent les vrais utilisateurs ? Pas de feedback loop en place.

---

**Handoff → @orchestrator**
- Fichier produit : `docs/reviews/elon-audit-ia-strategy.md`
- Avis donnes : score global 7.2/10, 4 problemes critiques identifies (mauvais modele, latence, zero automation regression, progression non mesurable), 7 recommandations priorisees
- Points d'attention : la migration GPT Image 1.5 est le quick win #1 — a evaluer avec @ia. Le benchmark fixe est le fondement de TOUT le reste (regression + progression). Sans benchmark, on optimise a l'aveugle.
- Rappel : ces recommandations sont des AVIS, pas des directives. L'utilisateur decide.
