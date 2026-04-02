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
