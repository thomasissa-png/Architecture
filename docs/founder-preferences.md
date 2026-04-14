# Préférences Fondateur — Thomas Issa

> Source de vérité pour @moi. Mis à jour après chaque session.
> Accessible cross-projets via : https://raw.githubusercontent.com/thomasissa-png/Agent-Team/main/docs/founder-preferences.md

## Observations cumulées

| Date | Préférence | Contexte | Impact sur les agents |
|---|---|---|---|
| 2026-03-26 | Veut 10/10 minimum sur les livrables marchand — 8/10 inacceptable | Audit Thomas/Marc, a insisté "je veux qu'ils soient à 10/10" | Calibrer audits persona à 9.5/10 min. Relancer jusqu'au seuil. |
| 2026-03-26 | Les photos galerie doivent persister sans exception | A signalé 5+ fois que les photos disparaissent. C'est LE critère n°1. | Persistance > vitesse. 2-3s de latence = OK. Photo perdue = inacceptable. |
| 2026-03-26 | Préfère les formats standard du secteur (T3 60 m²) | A validé le Format A (notation Tx portails immo) vs formats créatifs | Crédibilité > originalité pour les livrables B2B. |
| 2026-03-26 | Teste en production sur mobile — les screenshots sont le critère de vérité | Envoie des screenshots à chaque bug. Le code "qui marche en théorie" ne suffit pas. | Simuler le parcours mobile réel. Prioriser les tests visuels. |
| 2026-03-26 | Veut que tout soit en français avec accents corrects | A signalé 3+ fois des accents manquants. Chaque oubli = frustration. | Vérification accents obligatoire avant livraison. |
| 2026-03-26 | Préfère les solutions qui ne dépendent pas de services externes instables | Object Storage Replit instable → images en statique dans git. DVF down → dégradation gracieuse. | Toujours avoir un fallback local. Zéro dépendance runtime pour le hero. |
| 2026-03-26 | Veut des descriptions d'annonces au niveau des meilleures du marché | A dit "le niveau est catastrophique versus les meilleures annonces du marché" | Toujours benchmarker le secteur avant de rédiger des prompts LLM. |
| 2026-03-26 | Priorité UX : un utilisateur ne doit jamais voir un écran cassé ou un placeholder gris | StorageImage, hero SVG fallback, "Carte en chargement..." — tout doit être géré | Chaque composant doit avoir un état de chargement et un fallback propre. |
| 2026-03-27 | Ne JAMAIS dire "MVP" — c'est un vrai projet, on vise la perfection | A recadré 2x dans la session quand l'orchestrateur proposait de s'arrêter | Le mot "MVP" est interdit. Le mindset est V1 complète, pas scope réduit. |
| 2026-03-27 | Ne JAMAIS être paresseux — l'exigence est constante | "ne soit plus paresseux dans cette session" après proposition d'arrêt à 8.4 | Ne jamais proposer d'arrêter les itérations. Itérer jusqu'au seuil 9.5/10. |
| 2026-03-27 | 3 tiers pricing max, seul le Pro en abonnement | A corrigé quand Starter était en abonnement : "seulement l'offre pro est en abonnement" | Starter = one-shot pour usage ponctuel. Abonnement = engagement récurrent. |
| 2026-03-27 | Les encarts homepage doivent être compacts, pas des blocs massifs | "c'est trop gros" sur l'encart Mode Pro | Sections homepage = teasers compacts qui redirigent. Pas de blocs autonomes. |
| 2026-03-27 | Le fondateur ne doit JAMAIS tester le build | "6e erreur de suite pas acceptable, je ne suis pas là pour tester" | Les agents doivent exécuter tsc + lint AVANT chaque commit. Zéro tolérance. |
| 2026-03-28 | Les espaces entre sections sont "trop grands" — style compact Apple | A signalé que py-16 sm:py-24 était excessif | Baseline : py-10 sm:py-14 pour les sections standard. Pas de style blog aéré. |
| 2026-03-28 | "Crédit" n'est pas assez clair — validé "visuel" comme terme unique | "Est-ce que crédit est assez clair ? Que 1 crédit = 1 photo ?" | Terme commercial = "visuel". Crédit = CGV uniquement. Génération = états machine. |
| 2026-03-28 | Cliquer "Acheter" doit lancer l'achat DIRECTEMENT — pas de page intermédiaire | "Pourquoi est-ce que ça m'amène sur une autre page pricing ?" | Parcours : clic → auth → Stripe. Zéro redirect. La checkbox rétractation est inutile (Stripe gère). |
| 2026-03-28 | Les boutons doivent refléter l'état réel (Voir/Générer/Regénérer) | A signalé "Voir les dossiers" qui renvoyait vers la liste globale au lieu du dossier du bien | Actions contextuelles à l'entité. Jamais de lien vers une liste globale depuis une fiche. |
| 2026-03-28 | Le backoffice doit être propre comme le reste du site | "Peux-tu revoir l'UX/design du back office pour que ce soit propre comme le reste du site ?" | Le backoffice n'est pas un outil interne moche. Même design system. |
| 2026-03-28 | Le fondateur ne teste PAS — il signale. Les agents doivent être autonomes sur la QA. | A signalé 3 erreurs de build consécutives + "encore une fois je ne suis pas là pour tester" | L'orchestrateur doit s'assurer que le build est testé AVANT de push, même si l'env CI est limité. |
| 2026-03-28 | "Je ne veux plus de trous dans la raquette" — couverture exhaustive des types de pièce | A demandé un audit @ia pour vérifier que TOUS les types ont les corrections d'échelle | Quand une correction de prompt est faite, la propager à TOUS les builders (Responses + Flux × tous types). |
| 2026-04-02 | "Gros problème sur l'itération" = priorité absolue | A signalé la régression d'itération comme urgence, avant les autres sujets | L'itération est le coeur de l'UX Versimo. Toute régression = P0 immédiat, audits formels + corrections dans la même session. |
| 2026-04-02 | "Fais vérifier" = audits agents formels avec rapport | A demandé des audits Yann+Lucas structurés, pas des checks rapides | Les vérifications = toujours des rapports écrits dans docs/reviews/, pas des réponses verbales. |

## Session 33 — 2026-04-05

| Date | Préférence | Contexte | Règle pour les agents |
|---|---|---|---|
| 2026-04-05 | **Refus catégorique de 7-8/10** | Quand un audit rend 7.5/10, recadre immédiatement et exige itération vers 9.5+ | Tout score < 9 doit être accompagné de 3 fixes immédiats pour atteindre 9.5. Ne JAMAIS livrer un audit avec une note < 9 sans itération corrective. |
| 2026-04-05 | **JAMAIS "limitation du modèle" sans audit prompt** | "J'en ai marre de lire que c'est la faute de l'IA alors qu'on sait que c'est notre prompt le fautif" | Avant d'invoquer une limitation modèle, faire un audit profond du prompt (longueur, ordre tokens, ambiguïté). Le 90% des "limitations" sont des prompts mal construits. |
| 2026-04-05 | **Refund automatique sur TOUT échec** | Annulation, erreur partielle, erreur totale, validation échouée → TOUJOURS rembourser | Tout flow consommant un crédit doit avoir un refund automatique sur chaque chemin d'erreur. Tester l'annulation dans les 5 premières minutes. |
| 2026-04-05 | **Décrément crédits SYNCHRONE au clic** | Le compteur doit bouger AVANT le premier appel API | CustomEvent avec detail.credits, pas fetch API (trop lent mobile). Mise à jour optimiste obligatoire. |
| 2026-04-05 | **`npx next lint` AVANT de confirmer un fix** | "Fais une vraie vérification" = lance le linter | Pour tout fix code : exécuter le linter AVANT de répondre "fixé". Documenter l'output dans le commit. |
| 2026-04-05 | **Expérience IDENTIQUE peu importe le nombre d'éléments** | "Que j'upload 1 ou 5 photos, l'expérience est exactement la même" | Toute feature 1→N éléments doit avoir une UX strictement identique. Pas de "en attente", pas de batches visibles, pas de dégradation. |
| 2026-04-05 | **@qa code + @ux visuel + persona = obligatoire** | "Tu es sûr ? Visuellement c'est ok du point de vue user comme j'ai demandé ?" | Pour tout fix UI : @qa (code) PUIS @ux (visuel) PUIS persona (test). Pas de raccourci. Quand le fondateur dit "tu es sûr ?", il manque l'audit visuel. |
| 2026-04-13 | **L'interface doit être plan-centric (pas formulaire)** | "Il faut vraiment que l'interface soit simple, belle, efficace et géniale. On travaillera sur les plans." | Toute interface Versimo touchant aux plans/photos doit être VISUELLE et centrée sur l'image, pas sur des formulaires/tableaux texte. Clic sur le plan > dropdown dans un tableau. |
| 2026-04-13 | **Étape lots/biens TOUJOURS visible** | "On aura toujours un doute de savoir si pour un plan il y a un ou deux biens." | Quand il y a une ambiguïté structurelle, montrer l'étape plutôt que la masquer. Pré-remplir le cas simple ("1 bien") mais toujours permettre l'ajustement. |
| 2026-04-13 | **Pricing marchand : ~9€/bien (pas par visuel)** | Thomas raisonne en "dossiers à sortir". 1 bien = 1 dossier. | Le pricing doit être aligné sur l'unité de valeur du persona. Pour Thomas, c'est le bien/dossier — pas la photo individuelle. |
| 2026-04-13 | **Corrections automatiques JAMAIS silencieuses** | A signalé 4x que les surfaces étaient fausses sans que le système ne l'explique | Toute correction automatique de données (surfaces, positions) DOIT produire un warning visible qui explique ce qui a été changé et pourquoi. |
| 2026-04-05 | **Tests de matrice exhaustive obligatoires** | "Vérifie que ça marche pour tous les cas croisés : 3 comptes × 5 quantités × 3 espaces × 3 modes" | Pour les features critiques, produire une matrice de combinaisons et la valider via lecture de code (PASS/FAIL par cellule). |
| 2026-04-05 | **Découpage anti-timeout des agents** | "Qu'il ait une stratégie anti timeout" | Pour audits/refactors > 500 lignes : découper en N agents parallèles avec scope précis et limite de lignes. Stratégie permanente. |

## Session 34 — 2026-04-07

| Date | Préférence | Contexte | Règle pour les agents |
|---|---|---|---|
| 2026-04-07 | **100% tests pass obligatoire — jamais de "TODO plus tard" sur un test failing** | Session 34 : "Le fondateur veut la perfection, 100% pass". Tout `vitest run` qui termine avec `failed > 0` bloque le passage à la tâche suivante. | Pour tous @fullstack / @qa : si `npx vitest run` se termine avec `failed > 0`, STOP — corriger avant toute autre tâche. Les `skipped` sont OK uniquement s'ils sont intentionnels et commentés avec raison explicite. Jamais de "TODO plus tard" sur un test failing, même si le bug est dans le test et pas le code. |
| 2026-04-07 | **Travail autonome jusqu'au bout — "termine tout ce qui ne nécessite pas mon implication"** | Session 34, après @fullstack round 4 : le fondateur a demandé de finir les tâches basse priorité sans son implication | Quand le fondateur dit "continue jusqu'à la perfection" ou "termine tout", l'orchestrateur doit identifier les tâches vraiment autonomes (pas de clés API, pas de test manuel, pas d'arbitrage) et les enchaîner jusqu'au bout. Les tâches bloquées par une permission doivent basculer vers un plan B local sans demander. |
| 2026-04-07 | **Bugs concrets fondateur = tests de régression permanents** | Session 34 : 4 bugs BR-1 à BR-4 signalés en direct après session 33 qui était "dédiée au debug". Les régressions silencieuses sont inacceptables. | Tout bug signalé par le fondateur déclenche : (1) fix chirurgical, (2) commentaire `// REGRESSION: BR-X session Y` au-dessus de la ligne corrigée, (3) test unit + E2E de régression permanent, (4) règle anti-pattern documentée dans lessons-learned. Ces tests ne doivent JAMAIS être supprimés. |

## Session 41 — 2026-04-10

| Date | Préférence | Contexte | Règle pour les agents |
|---|---|---|---|
| 2026-04-10 | **"Fais implémenter tout" = vision complète, zéro scope réduit** | Session 41 : le fondateur a demandé d'implémenter TOUTES les API + câblages restants du parcours marchand en une session | L'instruction "implémente tout" signifie : pas de priorisation par effort, pas de "on fera ça plus tard". Implémenter l'intégralité du scope. La seule raison de ne pas implémenter : dépendance technique bloquante non résoluble dans la session. |
| 2026-04-10 | **Audits step-by-step individuels** | "que le marchand de bien et @reviewer/@qa ré-auditent à nouveau, mais cette fois-ci, chaque étape du parcours, individuellement" | Pour les parcours multi-étapes, les audits globaux ne suffisent pas. Chaque étape doit être auditée individuellement pour détecter les bugs spécifiques au contexte de l'étape. |

## Session 42 — 2026-04-13

| Date | Préférence | Contexte | Règle pour les agents |
|---|---|---|---|
| 2026-04-13 | **Le plan doit être l'élément CENTRAL, pas un toggle caché** | Demandé 6 fois. Le plan avec zones colorées doit être la première chose visible, en grand. | Quand un composant visuel est la VALEUR PRINCIPALE d'une page, il doit être le hero. Jamais derrière un toggle, accordion, ou "voir plus". |
| 2026-04-13 | **Ne me dis pas "vérifié" si tu ne l'as pas TESTÉ** | 5 erreurs de build consécutives après des messages "build vérifié" basés sur une simulation | Ne JAMAIS confirmer qu'un build passe sans `npx next build`. "J'ai simulé le flow" n'est pas une vérification. |
| 2026-04-13 | **Ne recommence pas ce qui marche déjà** | "On a déjà fait plein de choses dans le premier site : autocomplétion adresse, dossiers" | Avant de coder une feature, grep le codebase. Le fondateur refuse qu'on recode ce qui fonctionne. |
| 2026-04-13 | **Le marchand de biens doit être impliqué pour développer les features** | "Je veux que notre agent marchand de biens soit impliqué pour développer cette feature" | Les features métier doivent être spécifiées par le persona avant implémentation. Pas de feature sans validation persona. |
| 2026-04-13 | **Drag-to-reorder plutôt que supprimer+re-uploader** | "Si pas dans le bon ordre il faut tout supprimer pour les remettre. Peut-on simplement les glisser ?" | Toujours prévoir la réordination par drag quand l'ordre importe. Ne jamais forcer supprimer+recréer. |

## Session 45 — 2026-04-14

| Date | Préférence | Contexte | Règle pour les agents |
|---|---|---|---|
| 2026-04-14 | **"On vise le mieux, ne faisons pas les choses à moitié"** | 3 features identifiées comme manquantes dans le workflow marchand. Le fondateur veut l'implémentation complète (DB+API+UI) de chacune, pas des specs ou des ébauches. | Quand une feature workflow est demandée, livrer l'implémentation complète en une session. Ne pas produire de specs préalables sauf si la complexité architecturale l'exige. "Pas de demi-mesure" = chaque feature doit être fonctionnelle de bout en bout. |
