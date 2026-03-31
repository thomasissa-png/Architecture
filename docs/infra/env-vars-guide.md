# Versimo — Guide des variables d'environnement (Replit)

## OBLIGATOIRES (l'app ne fonctionne pas sans)

| Variable | Usage | Comment l'obtenir |
|---|---|---|
| `DATABASE_URL` | PostgreSQL (generations, biens, dossiers, profils) | Replit PostgreSQL integre : ajouter le module "PostgreSQL" dans Replit, la variable est auto-injectee |
| `OPENAI_API_KEY` | Generation IA (GPT-4.1 vision + image_generation), descriptions biens, pre-processing custom | https://platform.openai.com/api-keys — creer une cle API, plan payant requis (modele gpt-4.1) |
| `NEXTAUTH_SECRET` | Chiffrement sessions NextAuth | Generer : `openssl rand -base64 32` dans un terminal |
| `GOOGLE_CLIENT_ID` | Connexion Google OAuth | https://console.cloud.google.com/ → APIs & Services → Credentials → OAuth 2.0 Client ID (type "Web application", redirect URI : `https://ton-app.replit.app/api/auth/callback/google`) |
| `GOOGLE_CLIENT_SECRET` | Connexion Google OAuth | Meme page que GOOGLE_CLIENT_ID, copier le "Client secret" |

## RECOMMANDEES (fonctionnalites degradees sans)

| Variable | Usage | Comment l'obtenir |
|---|---|---|
| `REPLICATE_API_TOKEN` | Fallback Flux Depth Pro (si OpenAI echoue) | https://replicate.com/account/api-tokens — creer un token |
| `STRIPE_SECRET_KEY` | Paiements (packs credits) | https://dashboard.stripe.com/apikeys — cle secrete (`sk_live_...` ou `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Validation webhooks Stripe | Dashboard Stripe → Developers → Webhooks → ajouter endpoint `https://ton-app.replit.app/api/stripe/webhook`, copier le signing secret (`whsec_...`) |
| `NEXT_PUBLIC_BASE_URL` | URL publique de l'app (SEO, OG, emails) | `https://versimo.fr` (ou ton domaine custom) |
| `NEXTAUTH_URL` | URL NextAuth (redirections OAuth) | Meme valeur que `NEXT_PUBLIC_BASE_URL` |
| `ADMIN_PASSWORD` | Protection page /admin et replay | Choisir un mot de passe fort quelconque |

## OPTIONNELLES (nice-to-have)

| Variable | Usage | Comment l'obtenir |
|---|---|---|
| `PAPPERS_API_KEY` | Lookup SIRET (auto-remplissage raison sociale) | https://www.pappers.fr/api — inscription gratuite (200 req/mois) ou payante |
| `INTERNAL_API_SECRET` | Appels internes securises (generation dossier) | Generer : `openssl rand -hex 32` |
| `NEXT_PUBLIC_SENTRY_DSN` | Monitoring erreurs Sentry | https://sentry.io → Creer projet Next.js → copier le DSN |
| `SENTRY_ORG` | Organisation Sentry | Slug de ton org sur sentry.io |
| `SENTRY_PROJECT` | Projet Sentry | Slug du projet |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | Replit Object Storage (images) | Auto-injecte par Replit quand le module Object Storage est active |

## Auto-injectees par Replit (rien a faire)

- `NODE_ENV` — automatique
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` — ajouter le module Object Storage dans Replit
- `DATABASE_URL` — ajouter le module PostgreSQL dans Replit

## Ordre de configuration recommande

1. **PostgreSQL** : activer le module dans Replit
2. **Object Storage** : activer le module dans Replit
3. `NEXTAUTH_SECRET` + `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (auth)
4. `OPENAI_API_KEY` (generation IA — le coeur de l'app)
5. `NEXT_PUBLIC_BASE_URL` + `NEXTAUTH_URL` (meme valeur)
6. `ADMIN_PASSWORD` (administration)
7. `REPLICATE_API_TOKEN` (fallback IA)
8. `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (monetisation, quand pret)
9. `PAPPERS_API_KEY` (enrichissement SIRET, optionnel)
