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
