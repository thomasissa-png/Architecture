# Audit Copy — ExportPortail (F6-V2a)
> @copywriter — 2026-03-27
> Référence : brand-voice.md, ExportPortail.tsx, portal-formatter.ts
> Persona audité : Thomas (marchand de biens, 35 ans, Bordeaux)

---

## Tableau d'audit

| # | Texte actuel | Fichier | Problème | Correction proposée | Priorité |
|---|---|---|---|---|---|
| 1 | `"Exporter pour un portail immo"` | ExportPortail.tsx L229 | "immo" est correct pour Thomas. Mais le titre de section est neutre/générique — ne valorise pas l'action. | `"Exporter votre annonce"` — sobre, direct, sans jargon superflu | P2 |
| 2 | `"Choisir un portail"` | ExportPortail.tsx L243 | Placeholder fonctionnel correct. Légèrement administratif. | `"Sélectionner un portail"` — même sens, registre légèrement plus pro | P2 |
| 3 | `bient\u00f4t` (Logic-Immo) | ExportPortail.tsx L285 | Unicode brut dans le JSX au lieu d'un caractère natif. Risque d'affichage `bient\u00f4t` en clair selon le rendu. | Remplacer `bient\u00f4t` par `bientôt` directement (UTF-8 natif dans le JSX) | P0 |
| 4 | `"Titre adapt\u00e9"` (badge troncature) | ExportPortail.tsx L318 | Même problème unicode. Par ailleurs, "adapté" est vague pour Thomas : il ne sait pas si ça impacte sa diffusion. | Unicode fix + reformuler : `"Titre raccourci pour ce portail"` | P1 |
| 5 | `"Description adapt\u00e9e"` (badge troncature) | ExportPortail.tsx L352 | Même problème unicode + même vague. Thomas doit comprendre que du texte a été coupé, pas "adapté". | Unicode fix + reformuler : `"Description raccourcie — vérifiez la fin"` — actionnable | P1 |
| 6 | `"Copi\u00e9 !"` (feedback clipboard) | ExportPortail.tsx L327, L362, L437 | Unicode brut. De plus, le point d'exclamation est interdit par brand-voice.md. | Unicode fix + supprimer `!` : `"Copié"` — sobre, conforme | P0 |
| 7 | `"Copie impossible"` (état erreur) | ExportPortail.tsx L329, L363, L439 | Le message ne dit pas quoi faire. Thomas est sur son laptop au bureau — il a besoin d'un message actionnable. | `"Copie échouée — sélectionnez le texte manuellement"` | P1 |
| 8 | `"Copier le titre"` / `"Copier la description"` | ExportPortail.tsx L329, L364 | Correct et sobre. Rien à changer. | Conserver | — |
| 9 | `Texte ${exported.portal.label} copi\u00e9 !` | ExportPortail.tsx L437 | Unicode brut + point d'exclamation interdit. | `Texte ${exported.portal.label} copié` | P0 |
| 10 | `"T\u00e9l\u00e9chargement..."` (état loading ZIP) | ExportPortail.tsx L455 | Unicode brut. Le message ne rassure pas Thomas sur ce qui se passe (il peut y avoir 15-20 photos). | Unicode fix + enrichir : `"Préparation du ZIP…"` — indique une action en cours, pas juste un état | P1 |
| 11 | `T\u00e9l\u00e9charger les photos (${n})` | ExportPortail.tsx L456 | Unicode brut. Libellé correct sur le fond — le compteur est utile. | Unicode fix uniquement : `Télécharger les photos (${n})` | P0 |
| 12 | `"Aucune photo disponible"` | ExportPortail.tsx L462 | Correct mais passif. Thomas ne sait pas pourquoi ni comment débloquer. | `"Aucune photo générée pour ce dossier"` — explique l'état sans jargon technique | P2 |
| 13 | `"Champs \u00e0 remplir dans le formulaire"` | ExportPortail.tsx L373 | Unicode brut. Le label est clair et utile pour Thomas. | Unicode fix : `"Champs à remplir dans le formulaire"` | P0 |
| 14 | `"Description incompl\u00e8te \u2014 \u00e0 compl\u00e9ter avant publication"` | ExportPortail.tsx L420 | Unicode brut. Le message est correct mais "incomplète" sous-entend une faute de Thomas. | Unicode fix + reformuler : `"Description manquante — à rédiger avant publication"` — factuel, neutre | P1 |
| 15 | `"Description \u00e0 venir."` (placeholder formatDescription) | portal-formatter.ts L202 | Unicode brut. Exposé aux acquéreurs finaux si Thomas oublie de compléter — risque réputationnel. | `"Description à rédiger."` — moins familier, plus professionnel dans un contexte d'annonce | P1 |
| 16 | `"Limites non confirm\u00e9es officiellement \u2014 \u00e0 v\u00e9rifier dans le backoffice SeLoger Pro"` | portal-formatter.ts L93-94 | Message technique visible de Thomas. Correct sur le fond mais le ton "non confirmées officiellement" peut fragiliser la confiance. | `"Limites indicatives — à confirmer dans votre espace SeLoger Pro"` — même information, registre marchand | P2 |
| 17 | `"Limites non confirm\u00e9es officiellement \u2014 \u00e0 v\u00e9rifier dans le backoffice Bien'ici Pro"` | portal-formatter.ts L103-104 | Même problème que #16. | `"Limites indicatives — à confirmer dans votre espace Bien'ici Pro"` | P2 |
| 18 | Disclaimer IA : `"— Visuels g\u00e9n\u00e9r\u00e9s par intelligence artificielle \u00e0 des fins de projection, non contractuels."` | portal-formatter.ts L73 | Unicode brut. Le fond est excellent — mention IA explicite, "non contractuels" protège Thomas juridiquement. Registre sobre et professionnel, conforme brand-voice. | Unicode fix uniquement : `"— Visuels générés par intelligence artificielle à des fins de projection, non contractuels."` | P0 |
| 19 | `"\u00c0 compl\u00e9ter manuellement"` (DPE warning) | portal-formatter.ts L299 | Unicode brut. "Manuellement" est légèrement technique. | Unicode fix + reformuler : `"À renseigner dans le formulaire"` — cohérent avec le label de section | P1 |
| 20 | `"Donn\u00e9es \u00e0 compl\u00e9ter manuellement"` (copro warning) | portal-formatter.ts L329 | Unicode brut + même problème "manuellement". | Unicode fix + reformuler : `"Informations copropriété à renseigner"` | P1 |
| 21 | `"DESCRIPTION :"` / `"CHAMPS \u00c0 REMPLIR DANS LE FORMULAIRE :"` (copyText bloc) | portal-formatter.ts L395-398 | Ces labels apparaissent dans le texte copié-collé sur les portails. Majuscules criardes, non neutres. Thomas colle ce texte directement — il ne doit pas avoir à retoucher. | `"Description :"` / `"Champs à remplir :"` — casse normale, sobre | P2 |
| 22 | `"Disponible prochainement"` (title tooltip Logic-Immo) | ExportPortail.tsx L281 | Correct. Cohérent brand-voice. | Conserver | — |

---

## Problème transversal : encodage Unicode brut dans le JSX

**13 occurrences** de séquences `\uXXXX` hardcodées directement dans le JSX/TS au lieu d'utiliser les caractères UTF-8 natifs. Le fichier est `.tsx` — l'UTF-8 est natif. Ce pattern crée un risque de rendu littéral `\u00e9` dans certains contextes de test ou SSR, et rend le code illisible. Toutes les corrections P0 ci-dessus sont liées à ce problème.

---

## Score copy global

**6,5 / 10**

| Dimension | Note | Commentaire |
|---|---|---|
| Registre Thomas (marchand) | 7/10 | Vocabulaire portail/annonce/ZIP correct. "Manuellement" et "données" trop neutres |
| Accents et caractères FR | 3/10 | 13 séquences unicode brutes — risque d'affichage cassé |
| Conformité brand-voice | 7/10 | Sobre, pas de superlatif. 3 points d'exclamation à supprimer |
| Messages d'erreur actionnables | 5/10 | "Copie impossible" et "Aucune photo disponible" ne guident pas l'action |
| Disclaimer IA | 9/10 | Excellent fond, juste un fix unicode |
| Cohérence registre | 8/10 | Pas de tutoiement, pas de jargon technique exposé |

---

## Top corrections

### P0 — Bloquant (risque d'affichage cassé ou violation brand-voice)
- **Tous les `\uXXXX` bruts dans JSX** : remplacer par les caractères UTF-8 natifs (13 occurrences dans ExportPortail.tsx + portal-formatter.ts)
- **Supprimer les `!`** sur les feedbacks "Copié !" : remplacer par "Copié" sans ponctuation

### P1 — Correctif (messages non actionnables ou ton incorrect)
- **Badges troncature** : "Titre raccourci pour ce portail" / "Description raccourcie — vérifiez la fin"
- **État erreur copie** : "Copie échouée — sélectionnez le texte manuellement"
- **État loading ZIP** : "Préparation du ZIP…"
- **Warning description manquante** : "Description manquante — à rédiger avant publication"
- **Placeholder description vide** : "Description à rédiger." (texte visible sur les portails)
- **Warnings champs obligatoires** : "À renseigner dans le formulaire" / "Informations copropriété à renseigner"

### P2 — Amélioration (registre et crédibilité)
- **Titre de section** : "Exporter votre annonce" au lieu de "Exporter pour un portail immo"
- **Notes portails** : "Limites indicatives — à confirmer dans votre espace [Portail] Pro"
- **copyText headers** : casse normale au lieu des majuscules ("Description :" / "Champs à remplir :")

---

**Handoff → @fullstack**

- Fichiers produits : `docs/reviews/copy-audit-exportportail.md`
- Décisions prises : 22 textes audités, 13 fixes unicode P0 prioritaires, suppression des `!` (violation brand-voice), reformulation des messages d'erreur pour les rendre actionnables
- Points d'attention : le disclaimer IA (portal-formatter.ts L73) est non-négociable sur le fond — protège Thomas juridiquement. Le fix est uniquement l'encodage. Les labels du `copyText` (P2) apparaissent directement sur les portails immo — à traiter avant le premier usage en production.
