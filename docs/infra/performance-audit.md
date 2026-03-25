# Audit Infrastructure Versiroom — 2026-03-25

Agent : @infrastructure | Stack : Next.js 14, PostgreSQL, Replit Object Storage, Replit hosting

## Grille d'audit (10 criteres)

| # | Critere | Note | Statut | Commentaire |
|---|---------|------|--------|-------------|
| 1 | Performance API | 5/10 | ALERTE | Pipeline 2 passes = 2 appels OpenAI sequentiels (~30-60s total). Aucun timeout cote serveur. Si OpenAI ou Replicate lag, le client attend indefiniment. Pas de streaming des resultats intermediaires. |
| 2 | Securite | 6/10 | MOYEN | Rate limit IP 10 req/min OK. Validation taille image OK (10 Mo). Mais : `.env.local.example` ne liste que 2 vars sur ~5 necessaires (DATABASE_URL, ADMIN_PASSWORD, DEFAULT_OBJECT_STORAGE_BUCKET_ID manquants). Pas de CSP headers. Pas de CORS explicite. API /api/logs ouverte sans auth. |
| 3 | Base de donnees | 6/10 | MOYEN | Pool max=3 correct pour Replit. Auto-migration via ALTER TABLE fonctionne. Mais : migrations sequentielles dans ensureTable() (1 query par colonne = lent au cold start). Pas de VACUUM/ANALYZE automatique. Duplication massive logGeneration/logGenerationReturningId (~140 lignes identiques). |
| 4 | Stockage images | 7/10 | BON | withStorageRetry avec reinit client = resilient (fix Sprint 19). checkStorageHealth() disponible. Mais : pas de politique de retention/cleanup — les images s'accumulent indefiniment dans Object Storage. |
| 5 | Gestion d'erreur | 7/10 | BON | Fallback OpenAI -> Flux Depth Pro par passe. Erreurs loguees en DB (fire-and-forget). Messages d'erreur traduits FR. Mais : aucun timeout/AbortController sur les appels OpenAI/Replicate. Si le provider freeze, le worker Replit est bloque. |
| 6 | Dependances | 7/10 | BON | Next.js 14.2.35 stable. OpenAI SDK 6.32, pg 8.20 a jour. sharp 0.34.5 OK. Mais : @replit/object-storage 1.0.0 pince (pas de ^ = pas de patch auto). Pas de npm audit dans le workflow. |
| 7 | Scalabilite | 4/10 | ALERTE | Rate limit in-memory = perdu au redeploy + pas partage entre instances. Pas de queue/worker : chaque requete bloque un worker pendant 30-60s. Replit free tier = 1 worker = 1 generation a la fois en pratique. Pas de concurrence possible. |
| 8 | Monitoring | 3/10 | CRITIQUE | Pas de /api/health endpoint. Pas de Sentry ou error tracking. Pas de monitoring uptime. Logs console.error uniquement (perdus au redeploy). Page /admin = visualisation manuelle, pas d'alertes. |
| 9 | CI/CD | 2/10 | CRITIQUE | Aucun fichier .github/workflows/. Pas de .replit. Zero pipeline : pas de lint, pas de test, pas de build check avant deploy. Deploy = push sur Replit en direct. Pas de rollback documente. |
| 10 | Cout API | 6/10 | MOYEN | GPT-4.1 Responses API : ~$0.08-0.15 par image generee (vision input + image output). Pipeline 2 passes = ~$0.16-0.30 par generation complete. Flux Depth Pro fallback : ~$0.05/image. Iteration = 1 passe seulement (~$0.08-0.15). Pre-processing GPT-4.1-mini : ~$0.001. A 1000 gen/semaine = $160-300/sem sur OpenAI seul. |

**Note globale : 5.3/10**

## Top 5 actions prioritaires

### P0 — Endpoint /api/health (1h)
Creer `app/api/health/route.ts` qui verifie : connexion PostgreSQL (SELECT 1), Object Storage (checkStorageHealth deja disponible dans db.ts), cles API presentes. Retourne 200 OK ou 503 avec details. Configurer UptimeRobot (gratuit) pour pinger toutes les 5 minutes.

### P1 — Timeout sur appels API externes (2h)
Ajouter AbortController avec timeout de 120s sur chaque appel OpenAI et Replicate dans generatePass() et generateIterationPass(). Aujourd'hui, si un provider freeze, le worker est bloque indefiniment. Sur Replit (1 worker), cela rend le service completement indisponible.

### P2 — Pipeline CI minimal GitHub Actions (2h)
Creer `.github/workflows/ci.yml` : lint (next lint) + type-check (tsc --noEmit) + build (next build) sur chaque push/PR. Pas de step deploy (Replit gere). Bloque les merge si le build casse. Ajouter npm audit en step non-bloquant.

### P3 — Error tracking Sentry (1h)
Installer @sentry/nextjs (free tier 5K events/mois). Capture erreurs serveur (route.ts catch) ET client (ErrorBoundary). Source maps en production. Alerte email si error rate > 1%.

### P4 — Documentation secrets Replit (30min)
Mettre a jour `.env.local.example` avec TOUTES les variables necessaires : OPENAI_API_KEY, REPLICATE_API_TOKEN, DATABASE_URL, DEFAULT_OBJECT_STORAGE_BUCKET_ID, ADMIN_PASSWORD. Documenter dans docs/infra/infrastructure.md les Replit Secrets a configurer et les limites connues (cold start, 1 worker, storage ephemere filesystem).

## Observations complementaires

- **Rate limit in-memory** : acceptable en MVP single-instance Replit, mais a migrer vers Redis ou PostgreSQL-based si multi-instance.
- **Duplication code DB** : logGeneration et logGenerationReturningId partagent ~140 lignes identiques. Factoriser en une seule fonction avec parametre `returning: boolean`.
- **Retention images** : prevoir un cron ou script de cleanup des images > 30 jours dans Object Storage (pas de cron natif Replit — utiliser un service externe ou un endpoint d'admin).
- **Cold start Replit** : la premiere requete declenche ensureTable() avec ~15 ALTER TABLE sequentiels. Grouper en une seule requete multi-statement.

---

**Handoff -> @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/infra/performance-audit.md`
- Decisions prises : priorite P0 health check, P1 timeout API, P2 CI/CD, P3 Sentry, P4 secrets doc
- Points d'attention : le pipeline 2 passes bloque un worker 30-60s — pas de concurrence possible sur Replit free tier. Aucun timeout sur les appels API externes = risque de blocage total. API /api/logs ouverte sans authentification (donnees IP + prompts accessibles).
