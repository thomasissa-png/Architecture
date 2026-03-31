# Revue du systeme de versioning des prompts — Versimo — 2026-03-25

## Resume executif (non-technique)

Le systeme de versioning des prompts est operationnel de bout en bout. Chaque generation enregistre la version du prompt utilisee (actuellement v18), ce qui permet aux agents auditeurs de comparer la qualite des rendus entre versions. Le filtre par version fonctionne dans l'interface admin et dans l'API. Deux anomalies mineures ont ete identifiees -- un chemin de log d'erreur de remboursement qui contourne le systeme et l'absence de documentation du versioning dans les fichiers agents. Aucun bloquant.

## Resume technique

Conformite globale excellente. La constante `PROMPT_VERSION` est propagee dans les 5 chemins de log (iteration, surfaces-only, full pipeline, erreur, replay). Un seul angle mort mineur : le log de `refund_failed` utilise une requete SQL directe sans `prompt_version`. Recommandation : **GO**.

---

## Tableau des 7 scenarios

| # | Scenario | Verdict | Detail |
|---|----------|---------|--------|
| 1 | Generation normale (Scandinave) | **OK** | `PROMPT_VERSION` ("v18") passe a `logGeneration()` dans les 3 chemins de succes : iteration (L1196), surfaces-only (L1358), full pipeline (L1430). La constante est declaree L28 et exportee pour reutilisation. |
| 2 | Generation avec erreur | **PARTIEL** | Le `catch` principal (L1455-1458) passe bien `promptVersion: PROMPT_VERSION` a `logGeneration()`. MAIS le log de `refund_failed` (L1446-1450) utilise une requete SQL directe `INSERT INTO generation_logs (ip, style_id, success, error_message)` qui ne contient PAS `prompt_version`. Ces logs auront `prompt_version = NULL`. |
| 3 | Replay | **OK** | `replay/route.ts` L4 importe `PROMPT_VERSION` depuis `generate/route.ts`. L175 passe `promptVersion: PROMPT_VERSION` a `logGenerationReturningId()`. Le replay utilise toujours la version ACTUELLE, pas celle de la generation source. |
| 4 | Audit via /admin (dropdown + badge) | **OK** | `page.tsx` : type `LogEntry` inclut `prompt_version` (L29). Badge version affiche avec couleur bleue si present, gris + "---" si NULL (L377-388). Dropdown alimente dynamiquement depuis `availableVersions` retourne par l'API (L312-334). Le filtre declenche un re-fetch via `useEffect` (L147-176). |
| 5 | Audit via API (?version=) | **OK** | `logs/route.ts` : le parametre `?version=v18` construit une clause `WHERE prompt_version = $1` avec parametre prepare (L22-24, pas d'injection SQL). Le champ `prompt_version` est dans le SELECT (L34). Les versions distinctes sont retournees dans un champ `versions` (L42-47). |
| 6 | Anciennes generations (NULL) | **OK** | La migration `ALTER TABLE ADD COLUMN prompt_version VARCHAR(10)` est idempotente (L93, pattern DO/EXCEPTION). Les anciennes lignes ont NULL. Le badge affiche "---" (L387). Le filtre `?version=v18` utilise `WHERE prompt_version = $1` qui exclut naturellement les NULL (SQL : NULL != 'v18'). |
| 7 | Incrementation future (v19) | **OK** | La constante est en L28, bien documentee avec commentaire d'historique (L24-27). Un dev n'a qu'a modifier `"v18"` en `"v19"`. L'export permet au replay de la consommer sans duplication. |

---

## Bugs et anomalies

### BUG-1 : Log `refund_failed` sans `prompt_version` (MINEUR)

- **Fichier** : `app/api/generate/route.ts` lignes 1446-1450
- **Description** : Quand un remboursement de credit echoue, une requete SQL directe est executee :
  ```sql
  INSERT INTO generation_logs (ip, style_id, success, error_message) VALUES ($1, $2, false, $3)
  ```
  Cette requete ne contient pas `prompt_version`. Le log resultant aura `prompt_version = NULL`.
- **Impact** : Tres faible. Ce chemin est rare (echec de remboursement apres echec de generation). Mais ces logs polluent les resultats "toutes versions" et peuvent confondre un auditeur.
- **Resolution proposee** : Ajouter `prompt_version` a cette requete SQL, ou migrer vers `logGeneration()` avec les champs minimaux + `promptVersion: PROMPT_VERSION`.
- **Agent responsable** : @fullstack

### BUG-2 : VARCHAR(10) potentiellement insuffisant (MINEUR)

- **Fichier** : `lib/db.ts` ligne 93
- **Description** : Le type `VARCHAR(10)` supporte jusqu'a "v99999999" (8 chiffres), soit largement suffisant pour le schema `vNN`. Mais si le format evolue (ex: "v18.1-beta", "v18-outdoor"), il sera trop court.
- **Impact** : Nul a court terme. Risque theorique a long terme.
- **Resolution proposee** : Aucune action immediate. Si le format de version evolue, migrer vers `VARCHAR(20)`.

### ANOMALIE-1 : Agents auditeurs non mis a jour pour exploiter le versioning (MOYENNE)

- **Fichier** : `agents/interior-architect.md` et `agents/ai-image-expert.md`
- **Description** : Ni Yann Duval ni Lucas Moreau ne mentionnent le systeme de versioning dans leur methode d'audit. Ils ne savent pas qu'ils peuvent filtrer par `?version=v18`, comparer les notes entre versions, ou utiliser le badge version dans /admin.
- **Impact** : Les agents fonctionneront mais n'exploiteront pas le versioning a son plein potentiel. Ils devront deviner quelles generations correspondent a quels prompts.
- **Resolution proposee** : Ajouter une section "Workflow de versioning" dans chaque fichier agent avec les instructions ci-dessous.
- **Agent responsable** : @orchestrator (mise a jour des agents)

---

## Verification securite

| Point | Verdict | Detail |
|-------|---------|--------|
| SQL injection sur `?version=` | **SAFE** | Utilise un parametre prepare `$1` (L22-24 de logs/route.ts), pas de concatenation de string. |
| Authentification /api/logs | **OK** | Token requis via query param ou header Authorization (L8-11). |
| Authentification /api/replay | **OK** | ADMIN_PASSWORD requis sauf appel interne (L31-37). |
| Export de `PROMPT_VERSION` | **OK** | Exporte comme constante, pas de risque de mutation. Replay l'importe correctement (L4 de replay/route.ts). |

---

## Recommandations pour Yann Duval et Lucas Moreau

### Comment exploiter le versioning dans vos audits

1. **Filtrer par version dans /admin** : Utilisez le dropdown "Filtrer par version de prompt" pour isoler les generations d'une version specifique. Comparez visuellement les resultats v17 vs v18 sur le meme style.

2. **Filtrer par version via API** : Appelez `GET /api/logs?version=v18&token=xxx` pour ne recuperer que les generations de la version actuelle. Pour comparer :
   - `?version=v17` → generations avant les dernieres corrections
   - `?version=v18` → generations apres Sprint 18+
   - Sans filtre → toutes les generations (les anciennes ont version = NULL)

3. **Identifier les regressions** : Si une generation v18 obtient une note inferieure a la moyenne v17 pour le meme style, c'est un signal de regression a investiguer. Le champ `prompt_version` permet de construire un tableau comparatif :

   | Style | Moyenne v17 | Moyenne v18 | Delta |
   |-------|-------------|-------------|-------|
   | Scandinave | 7.5 | ? | ? |
   | Japandi | 7.3 | ? | ? |

4. **Utiliser le replay pour A/B test** : Le bouton "Rejouer avec les prompts actuels" dans /admin regenere une image avec les prompts v18 a partir de l'input original. Le log de replay contient automatiquement `prompt_version = v18` + les metriques de diff pixel. Workflow :
   - Trouver une generation v17 avec une note basse
   - Cliquer "Rejouer"
   - Comparer visuellement et en metriques
   - Si amelioration → la correction v18 fonctionne
   - Si regression → signaler a @fullstack

5. **Signaler le besoin d'incrementation** : Si vous recommandez une modification de prompt (P0/P1), rappelez a @fullstack d'incrementer `PROMPT_VERSION` a "v19" apres application. Sans incrementation, les nouvelles generations seront impossibles a distinguer des anciennes.

---

## Angles morts

1. **Pas de changelog des versions** : Le commentaire L24-27 de route.ts donne un historique sommaire, mais il n'existe pas de fichier `PROMPT_CHANGELOG.md` detaillant ce qui a change entre chaque version. Quand v19 arrivera, il sera difficile de savoir exactement ce qui differait en v18.

2. **Pas de version dans la reponse API /api/generate** : Le client (page.tsx) ne recoit pas la version du prompt dans la reponse JSON. Si un agent ou un utilisateur veut savoir quelle version a produit une image, il doit consulter les logs. Ajout suggere : `{ image: "...", model: "...", promptVersion: "v18" }`.

3. **Pas de batch comparison endpoint** : Pour comparer systematiquement v17 vs v18, il faut appeler l'API 2 fois et croiser manuellement. Un endpoint `GET /api/logs/compare?versionA=v17&versionB=v18&style=scandinavian` serait utile pour les agents.

---

## Score de conformite

| Critere | Score |
|---------|-------|
| Propagation PROMPT_VERSION dans tous les chemins de log | 9/10 (1 chemin mineur manquant) |
| Migration DB idempotente | 10/10 |
| Filtre API fonctionnel et securise | 10/10 |
| Interface admin (badge + dropdown) | 10/10 |
| Replay avec version actuelle | 10/10 |
| Gestion des anciennes generations (NULL) | 10/10 |
| Documentation pour agents auditeurs | 5/10 (absente des fichiers agents) |
| Facilite d'incrementation | 9/10 (constante unique, bien documentee) |
| **Score global** | **9/10** |

---

## Recommandation

**GO** — Le systeme de versioning est fonctionnel et bien implemente. Les deux anomalies identifiees (log refund_failed, documentation agents) sont mineures et n'empechent pas l'utilisation immediate par les agents auditeurs.

---

**Handoff → @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/prompt-versioning-review.md`
- Decisions prises : GO, score 9/10
- Points d'attention :
  - BUG-1 (mineur) : log `refund_failed` sans `prompt_version` → @fullstack doit ajouter le champ (L1446-1450 de route.ts)
  - ANOMALIE-1 (moyenne) : agents Yann Duval et Lucas Moreau non mis a jour pour exploiter le versioning → @orchestrator doit ajouter une section dans `agents/interior-architect.md` et `agents/ai-image-expert.md`
  - Angle mort : pas de `PROMPT_CHANGELOG.md` pour historiser les changements entre versions
