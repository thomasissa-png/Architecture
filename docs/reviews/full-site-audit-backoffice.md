# Audit Back-office Admin — Versiroom
Date : 2026-03-28 | Agent : @ux

---

## 1. Sécurité

| Point | Statut | Détail |
|---|---|---|
| Page `/admin` protégée | PASS | Auth via `/api/admin-auth` (POST, compare `ADMIN_PASSWORD` env var). Aucun cookie/session JWT — l'état auth est purement client-side (`useState`). Rechargement de page = déconnexion. |
| `/api/logs` protégée | PASS (conditionnel) | Token `?token=` ou header `Authorization: Bearer`. Si `ADMIN_PASSWORD` non définie → API **ouverte sans auth**. C'est le comportement documenté (pour les agents d'audit), mais à signaler. |
| `/api/logs/image` non protégée | P1 | Zéro vérification de token. N'importe qui connaissant le nom de fichier peut télécharger les images de génération (données client potentielles). |
| `/api/logs/storage-check` non protégée | P2 | Endpoint de diagnostic accessible publiquement. Risque faible (pas de données sensibles), mais surface d'information inutile. |
| Mot de passe transmis en clair dans les requêtes API | P1 | Le `password` est passé en query string `?token=` dans `fetch('/api/logs?token=...')` côté admin page. Visible dans les logs serveur Replit et l'historique navigateur. Utiliser un header `Authorization` ou un cookie HttpOnly. |
| Pas de rate limiting sur `/api/admin-auth` | P2 | Brute-force possible sur le mot de passe admin (POST illimité). |

## 2. Images (Object Storage)

| Point | Statut | Détail |
|---|---|---|
| Affichage via Object Storage | PASS | `LogImage` construit l'URL `/api/logs/image?file=<basename>`. `/api/logs/image` normalise la clé en `logs/<basename>` et lit depuis Replit Object Storage via `getImage()`. |
| Fallback erreur | PASS | `onError` → fetch diagnostique → message d'erreur détaillé (404 / 500 / "Stockage inaccessible"). |
| Click-to-enlarge | PASS | Ouvre dans un nouvel onglet. |
| Sizing | PASS | `maxWidth: 300px`, `objectFit: contain`. |
| Séquence d'erreur asynchrone | P2 | `handleError` est une fonction async appelée dans `onError` sans `await`. Si le fetch diagnostique est lent, la fonction retourne `void` et React ne perçoit pas l'erreur. En pratique ça fonctionne car `setErrorInfo` est appelé à l'intérieur, mais le pattern est fragile. |
| Pas de skeleton/placeholder pendant le chargement | P2 | L'image apparaît directement ou affiche l'erreur. Aucun état de loading intermédiaire — layout shift visible sur les connexions lentes. |

## 3. Filtrage / Tri

| Point | Statut | Détail |
|---|---|---|
| Filtre par `prompt_version` | PASS | Dropdown alimenté par `SELECT DISTINCT prompt_version`. Refetch automatique au changement. |
| Tri par date | PASS | `ORDER BY created_at DESC` côté SQL. |
| Filtre par style | ABSENT (P1) | Aucun filtre par `style_id` alors que c'est la dimension d'analyse principale des agents Yann/Lucas. Ajout d'un second dropdown `style_id` = gain d'usabilité élevé pour les audits. |
| Filtre par modèle | ABSENT (P2) | `pass1_model` / `pass2_model` non filtrables. Utile pour comparer OpenAI vs Flux. |
| Filtre succès/erreur | ABSENT (P2) | Pas de filtre pour isoler les échecs. Les lignes en erreur ont un fond `#fff5f5` mais pas de moyen de les isoler. |
| Filtre outdoor/intérieur | ABSENT (P2) | `is_outdoor` et `room_type` en DB, jamais affichés ni filtrables. |

## 4. Pagination

| Point | Statut | Détail |
|---|---|---|
| Pagination | ABSENT (P1) | `LIMIT 50` hardcodé dans `/api/logs`. Pas de `OFFSET`, pas de `cursor`. Au-delà de 50 générations, les plus anciennes sont invisibles. Versiroom a déjà ~42 générations documentées — la limite va être atteinte rapidement. |
| Indicateur de troncature | ABSENT (P1) | L'UI affiche "X générations" mais ne signale pas que la liste est tronquée à 50. L'utilisateur croit voir tout l'historique. |
| Recommandation | — | Ajouter un paramètre `?limit=50&offset=0` côté API + bouton "Voir plus" ou pagination simple côté UI. Alternative immédiate : passer `LIMIT` à 200 et documenter. |

## 5. Prompts pass1/pass2

| Point | Statut | Détail |
|---|---|---|
| Affichage prompts | PASS | `built_prompt_pass1` et `built_prompt_pass2` affichés dans la section expandée. `pre` avec `white-space: pre-wrap`, `maxHeight: 200px`, scroll vertical. |
| Colonne `surface_prompt` / `furniture_prompt` (prompts bruts) | ABSENT (P2) | La DB stocke les prompts bruts d'entrée (`surface_prompt`, `furniture_prompt`) distincts des prompts construits. Seuls les prompts construits (`built_prompt_pass1/2`) sont affichés. L'absence des bruts rend l'audit prompt-to-output moins précis (on ne voit pas ce que le client a envoyé vs ce que le builder a produit). |
| Bouton copier prompt | ABSENT (P2) | Pas de bouton "Copier" pour les prompts pass1/pass2 individuels (contrairement au prompt d'audit global qui a un bouton copier). Friction pour les agents qui réutilisent les prompts. |

## 6. Colonnes DB — affichées vs manquantes

| Colonne DB | Affichée ? | Priorité d'ajout |
|---|---|---|
| `id` | Non (mais utilisé en interne) | P2 — afficher le numéro #ID dans le header de la carte |
| `ip` | Non | P2 — utile pour détecter un utilisateur intensif |
| `style_id` | Oui (badge vert) | — |
| `model_used` | Non | — (remplacé par pass1_model/pass2_model) |
| `pass1_model` / `pass2_model` | Oui (section expandée) | — |
| `duration_ms` + détail passes | Oui | — |
| `success` / `error_message` | Oui | — |
| `input_width` / `input_height` | Oui | — |
| `built_prompt_pass1` / `pass2` | Oui | — |
| `input_image_path` / `pass1_image_path` / `output_image_path` | Oui | — |
| `is_replay` / `replay_source_id` / `replay_label` | Oui | — |
| `pixel_diff_pct` / `color_shift_score` | Oui (header carte) | — |
| `prompt_version` | Oui (badge bleu) | — |
| `is_iteration` / `iteration_number` | Non | P2 — distinguer génération vs itération |
| `session_id` | Non | P2 — grouper les générations d'une même session |
| `user_comment_raw` / `user_comment_enriched` | Non | **P1** — le commentaire utilisateur (itération) est absent de l'UI alors qu'il est essentiel pour auditer la pertinence des itérations |
| `room_type` | Non | P1 — type de pièce absente alors que ça conditionne l'évaluation |
| `is_outdoor` / `outdoor_subtype` | Non | P1 — impossible de distinguer indoor/outdoor visuellement |
| `surface_prompt` / `furniture_prompt` | Non | P2 — prompts bruts d'entrée client |
| `pass1_cache_key` | Non | P3 — technique, inutile dans l'UI |

## 7. Mobile responsive

| Point | Statut | Détail |
|---|---|---|
| Layout général | PARTIEL (P1) | `maxWidth: 1400px` avec `padding: 24px 32px`. Sur mobile 375px le padding latéral de 32px consomme ~17% de la largeur, laissant seulement ~311px pour le contenu. |
| Header de carte | P1 | `display: flex; flexWrap: wrap` permet le wrap sur mobile. Mais les badges (`style_id`, `prompt_version`, durée, dimensions, succès) sont tous sur la même ligne → certains disparaissent ou s'empilent de façon non contrôlée. |
| Images dans la section expandée | PASS | `flex-wrap: wrap` + `minWidth: 150px`. Sur mobile les 3 images s'empilent. |
| Tableau DB (section 6) | N/A | Pas de tableau. Les données sont en liste flexible — OK sur mobile. |
| Banner audit prompt | P2 | Le `pre` avec le prompt d'audit a `maxHeight: 400px` mais peut déborder horizontalement sur mobile (pas de `overflow-x: auto`). |
| Bouton "Rejouer" (ReplayButton) | P2 | L'input de label a `width: 100%` + `boxSizing: border-box` — OK. Mais le composant n'a pas été testé sur 375px (padding, boutons côte à côte). |
| Conclusion | — | L'admin est conçu pour desktop. Acceptable pour un usage interne, mais les tableaux de bord sur mobile (Thomas sur iPhone) nécessiteraient un layout colonne unique simplifié. |

## 8. Plan d'action priorisé

| Priorité | Finding | Action | Owner |
|---|---|---|---|
| **P0** | Aucun | — | — |
| **P1** | `/api/logs/image` sans auth | Ajouter vérification `?token=` identique à `/api/logs` | @fullstack |
| **P1** | Mot de passe en query string `?token=` | Remplacer par header `Authorization: Bearer` dans les fetches admin | @fullstack |
| **P1** | Pagination manquante — LIMIT 50 silencieux | Ajouter `OFFSET` API + bouton "Charger plus" UI + bandeau "50 premiers résultats" | @fullstack |
| **P1** | Filtre par `style_id` absent | Ajouter dropdown style côté UI + paramètre `?style=` côté API (`WHERE style_id = $1`) | @fullstack |
| **P1** | `room_type`, `is_outdoor`, `outdoor_subtype` absents de l'UI | Afficher dans le header de carte (badges supplémentaires) | @fullstack |
| **P1** | `user_comment_raw` absent | Afficher dans la section expandée (utile pour auditer les itérations) | @fullstack |
| **P2** | `/api/logs/storage-check` non protégée | Ajouter vérification token | @fullstack |
| **P2** | Pas de rate limiting sur `/api/admin-auth` | Ajouter compteur en mémoire (5 tentatives / 15 min) | @fullstack |
| **P2** | Skeleton loading absent sur images | Ajouter placeholder gris animé pendant le chargement des `<img>` | @fullstack |
| **P2** | Prompts bruts (`surface_prompt`, `furniture_prompt`) absents | Ajouter dans la section expandée, après les prompts construits | @fullstack |
| **P2** | Bouton "Copier" absent sur prompts individuels | Ajouter bouton copier sur `built_prompt_pass1` et `built_prompt_pass2` | @fullstack |
| **P2** | `banner audit` déborde horizontalement sur mobile | Ajouter `overflow-x: auto` sur le `pre` | @fullstack |

---

**Handoff → @fullstack**
- Fichier produit : `/home/user/Architecture/docs/reviews/full-site-audit-backoffice.md`
- Décisions prises : pas de refonte structurelle — corrections ciblées sur sécurité, pagination et colonnes manquantes
- Points d'attention :
  - P1 sécurité : `/api/logs/image` sans auth doit être corrigé en priorité absolue (données client)
  - P1 sécurité : mot de passe en query string → passer en `Authorization: Bearer` dans tous les `fetch` côté admin page
  - P1 UX : LIMIT 50 sans avertissement = risque de croire que l'historique est complet
  - Colonnes `room_type`, `is_outdoor`, `user_comment_raw` sont en DB et prêtes — juste à les ajouter à la SELECT dans `/api/logs/route.ts` et à les afficher dans le composant
