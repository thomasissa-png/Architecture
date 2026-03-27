# Audit copy — ExportPortail (V2a)
> @copywriter — 2026-03-27
> Périmètre : ExportPortail.tsx + lib/portal-formatter.ts
> Référence : docs/copy/brand-voice.md, persona Thomas (marchand de biens, 35 ans, Bordeaux)
> Remplace la version initiale (sans date) qui traitait principalement les encodages Unicode.

---

## Tableau d'audit

| # | Texte actuel | Fichier | Problème | Correction proposée | Priorité |
|---|---|---|---|---|---|
| 1 | `Copié !` (3 occurrences — copie titre, description, tout) | ExportPortail.tsx L327 / L362 / L437 | Point d'exclamation explicitement interdit par brand-voice.md. Registre grand public. | `Copié` — sobre, conforme | P0 |
| 2 | `Titre adapté` (badge troncature orange) | ExportPortail.tsx L318 | "Adapté" est rassurant mais le badge est orange. Thomas ne comprend pas si son titre passera sur le portail. | `Titre raccourci` — factuel, neutre | P1 |
| 3 | `Description adaptée` (badge troncature orange) | ExportPortail.tsx L352 | Même problème que #2. "Adaptée" sous-entend une amélioration, pas une contrainte. | `Description raccourcie` — cohérent avec #2 | P1 |
| 4 | `Copie impossible` (état erreur clipboard) | ExportPortail.tsx L329 / L363 / L439 | Constat sans action. Thomas est au bureau, il a besoin de savoir quoi faire. | `Copie échouée — sélectionnez le texte manuellement` | P1 |
| 5 | `Téléchargement...` (état loading ZIP) | ExportPortail.tsx L455 | Passif. Quand Thomas attend 15-20 photos, il veut savoir que quelque chose se prépare, pas juste que ça charge. | `Préparation du ZIP…` — actif, précis | P1 |
| 6 | `Description incomplète — à compléter avant publication` (warning) | ExportPortail.tsx L420 | "Incomplète" implique qu'il y a un début de texte — or le champ est vide. | `Description manquante — à rédiger avant publication.` | P1 |
| 7 | `{portal} accepte {n} photos max — les {n} premières seront incluses dans le ZIP` (warning) | ExportPortail.tsx L407-408 | Passif. Thomas a généré plusieurs pièces — il ne sait pas lesquelles sont priorisées. | `{portal} accepte {n} photos maximum. Le ZIP inclut les {n} premières — pièces principales en priorité.` | P1 |
| 8 | `Aucune photo disponible` | ExportPortail.tsx L462 | Passif, sans contexte. Thomas ne sait pas s'il doit générer des photos ou si c'est un bug. | `Aucune photo générée pour ce bien.` | P2 |
| 9 | `Exporter pour un portail immo` (titre section) | ExportPortail.tsx L229 | "immo" est correct dans le registre marchand, mais "pour" est moins précis que "vers". | `Exporter vers un portail immobilier` | P2 |
| 10 | `Choisir un portail` (dropdown placeholder) | ExportPortail.tsx L243 | Correct. Légèrement administratif. | `Sélectionner le portail` — registre professionnel | P2 |
| 11 | `bientôt` (badge Logic-Immo) | ExportPortail.tsx L285 | Encodé `bient\u00f4t` — risque d'affichage brut. "Bientôt" est aussi flou pour un professionnel. | `Prochainement` en UTF-8 natif | P2 |
| 12 | `— Visuels générés par intelligence artificielle à des fins de projection, non contractuels.` (disclaimer IA) | portal-formatter.ts L73 | "À des fins de projection" est du jargon juridique. Ce texte est copié dans des annonces LeBonCoin lues par des acquéreurs, pas par des juristes. Le fond est solide (mention IA + non contractuels), seule la formulation est à simplifier. | `— Photos d'intérieur générées par IA, à titre indicatif, non contractuelles.` | P1 |
| 13 | `Description à venir.` (placeholder formatDescription vide) | portal-formatter.ts L202 | Ce texte peut être copié-collé tel quel dans une annonce publiée si Thomas oublie de rédiger. "À venir" décrédibilise l'annonce. | `Description en cours de rédaction.` — professionnel, moins exposant | P1 |
| 14 | `À compléter manuellement` (DPE warning) | portal-formatter.ts L299 | Correct, factuel, sobre. Aucune correction. | Conserver | — |
| 15 | `Données à compléter manuellement` (copro warning) | portal-formatter.ts L329 | "Données" est superflu avec le label "Copropriété" déjà présent. "Manuellement" est légèrement technique. | `À renseigner dans le formulaire` — cohérent avec les autres warnings | P2 |
| 16 | `Limites non confirmées officiellement — à vérifier dans le backoffice SeLoger Pro` (notes) | portal-formatter.ts L93-94 | Langage interne HYPOTHÈSE qui filtre vers l'UI. "Non confirmées officiellement" peut alarmer Thomas sans raison. | `Limites indicatives — à confirmer dans votre espace SeLoger Pro.` | P1 |
| 17 | `Limites non confirmées officiellement — à vérifier dans le backoffice Bien'ici Pro` (notes) | portal-formatter.ts L103-104 | Même problème que #16. | `Limites indicatives — à confirmer dans votre espace Bien'ici Pro.` | P1 |
| 18 | `DESCRIPTION :` / `CHAMPS À REMPLIR DANS LE FORMULAIRE :` (copyText bloc) | portal-formatter.ts L395-398 | Majuscules criardes dans un bloc que Thomas colle sur un portail. Il ne devrait pas avoir à retoucher le texte copié. | `Description :` / `Champs à saisir dans le formulaire :` — casse normale | P2 |

---

## Note transversale — Encodages Unicode

L'audit existant avait identifié 13 séquences `\uXXXX` brutes dans les deux fichiers (à la place des caractères UTF-8 natifs). C'est une correction technique, pas copy — tous les textes affichés sont corrects côté navigateur. Ces corrections doivent être faites lors de la même passe que les corrections P0/P1 pour nettoyer la lisibilité du code source.

---

## Score copy /10

**6,5 / 10**

| Dimension | Note | Commentaire |
|---|---|---|
| Conformité brand-voice | 7/10 | Sobre, pas de superlatif. 3 points d'exclamation à supprimer (P0) |
| Registre Thomas (marchand) | 7/10 | Vocabulaire portail/annonce/ZIP correct. "Données" et "manuellement" trop neutres |
| Messages d'erreur actionnables | 5/10 | "Copie impossible" et "Aucune photo disponible" ne guident pas vers une action |
| Textes copiables sur les portails | 6/10 | Disclaimer trop juridique, "Description à venir" risquée si copiée telle quelle |
| Cohérence des badges d'alerte | 5/10 | "Adapté" en orange = signal contradictoire entre la couleur et le mot |
| Zéro tutoiement, zéro superlatif | 10/10 | Parfait — aucune violation sur ces deux points |

---

## Corrections P0-P1-P2

### P0 — Avant mise en production (1 problème, 3 occurrences)
- **Items #1** : supprimer les 3 points d'exclamation dans les états "Copié !". Violation directe brand-voice.md. Registre grand public, incompatible avec le positionnement premium de Versiroom.

### P1 — Corrections de fond (8 problèmes)
- **Badges troncature** (#2, #3) : "raccourci" au lieu d'"adapté" — le badge orange doit signaler une contrainte.
- **Erreur clipboard** (#4) : ajouter l'instruction de repli (sélectionner manuellement).
- **Loading ZIP** (#5) : "Préparation du ZIP" — actif, rassurant pour Thomas qui attend ses 15-20 photos.
- **Warning description vide** (#6) : "manquante" au lieu d'"incomplète".
- **Warning photos excédentaires** (#7) : préciser que les pièces principales sont priorisées.
- **Disclaimer IA** (#12) : simplifier pour un acquéreur, pas pour un juriste — le fond reste intact.
- **Placeholder description vide** (#13) : "en cours de rédaction" au lieu d'"à venir" — risque si copié tel quel sur LeBonCoin.
- **Notes portails** (#16, #17) : supprimer le jargon interne "non confirmées officiellement".

### P2 — Améliorations de registre (7 problèmes)
- Items #8, #9, #10, #11, #15, #18 — corrections mineures de vocabulaire, de casse et de formulation.

---

**Handoff → @fullstack**

- Fichier produit : `docs/reviews/copy-audit-exportportail.md`
- Décisions prises : 18 textes audités — 3 occurrences P0 (points d'exclamation), 8 corrections P1, 7 corrections P2. Aucune modification de logique applicative : toutes les corrections portent sur des chaînes de caractères dans ExportPortail.tsx et lib/portal-formatter.ts.
- Points d'attention : (1) Le disclaimer IA (#12) est non-négociable sur le fond — "non contractuels" protège Thomas juridiquement. Seule la formulation "à des fins de projection" est à simplifier. (2) Le placeholder "Description à venir." (#13) peut se retrouver publié sur LeBonCoin si Thomas n'a pas rédigé sa description — correction P1 à traiter avant le premier usage en production. (3) Les encodages Unicode `\uXXXX` dans les deux fichiers peuvent être remplacés par UTF-8 natif lors de la même passe — aucune incidence fonctionnelle.
