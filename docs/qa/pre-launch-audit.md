# Audit pre-lancement Versiroom -- 2026-03-27

Auditeur : @qa | Branche : claude/update-gradient-agents-rnmKh

## Tableau synthetique

| Page | Footer | Accents JSX | Tokens | Mobile | SEO meta | Verdict |
|---|---|---|---|---|---|---|
| `/` (homepage) | Footer composant | OK (HTML entities) | P1 : bg-white/80 x3, text-gray-400 x1 | OK (grid-cols-1 md:) | OK (layout.tsx) | GO conditionnel |
| `/pricing` | Inline (pas Footer composant) | P1 : "Mentions legales", "Confidentialite", "generations offertes", "recuperable" sans accents | OK | OK | OK | GO conditionnel |
| `/marchand` | Footer composant | P2 : metadata/FAQ sans accents (non visible) | OK | OK | OK | GO |
| `/architecte` | Footer composant | P2 : metadata/FAQ sans accents | OK | OK | OK | GO |
| `/particulier` | Footer composant | P2 : metadata/FAQ sans accents | OK | OK | OK | GO |
| `/comparatif` | Inline (pas Footer composant) | P2 : FAQ data sans accents | OK | OK (overflow-x-auto table) | OK | GO conditionnel |
| `/blog` | Inline (pas Footer composant) | OK | OK | OK | OK | GO conditionnel |
| `/blog/[slug]` | Inline (pas Footer composant) | OK | OK | OK | OK (generateMetadata) | GO conditionnel |
| `/examples` | Footer composant | OK | OK | OK (grid 1/2/3 cols) | OK | GO |
| `/mentions-legales` | ABSENT | OK | P1 : border-gray-200/40 header | OK | OK (noindex) | GO conditionnel |
| `/confidentialite` | ABSENT | OK | P1 : border-gray-200/40 header | OK | OK (noindex) | GO conditionnel |
| `/cgv` | ABSENT | OK | P1 : border-gray-200/40, border-gray-200, border-gray-100 | OK | OK (noindex) | GO conditionnel |
| `/compte` | N/A (auth) | OK | OK | OK | Pas de metadata export | P2 |
| `/ma-galerie` | N/A (auth) | OK | OK | OK | Pas de metadata | P2 |
| `/mes-biens` | N/A (auth) | OK | OK | OK | Pas de metadata | P2 |
| `/mes-biens/[id]` | N/A (auth) | OK | OK | OK | Pas de metadata | P2 |
| `/mes-dossiers` | N/A (auth) | OK | OK | OK | Pas de metadata | P2 |
| `/annonce/[uuid]` | Via layout | OK | OK | OK | OK (generateMetadata + OG) | GO |
| `/dossier/[uuid]` | Via layout | OK | OK | OK | OK (generateMetadata + OG) | GO |
| `api/generate` | N/A | N/A | N/A | N/A | N/A | PROMPT_VERSION v24 -- GO |
| `api/dossier/[uuid]/pdf` | N/A | N/A | N/A | N/A | N/A | GO |

## Bugs P0 -- Bloquants lancement

Aucun bug P0 identifie. Le site est fonctionnel, les pages se compilent, les routes API sont operationnelles.

## Bugs P1 -- A corriger rapidement

| # | Page | Bug | Impact |
|---|---|---|---|
| P1-1 | `/mentions-legales`, `/confidentialite`, `/cgv` | **Footer absent** -- ces 3 pages n'importent pas le composant Footer. L'utilisateur n'a aucun lien de navigation pour revenir. | UX : cul-de-sac. Le lien "Retour" existe mais pas de footer coherent avec le reste du site. |
| P1-2 | `/pricing` | **Footer inline au lieu du composant Footer** -- manque les liens Exemples, Blog, Architectes, Particuliers, Contact. Les textes "Mentions legales", "Confidentialite" sont sans accents. | Incoherence navigation + accents manquants visibles. |
| P1-3 | `/pricing` | **Accents manquants visibles** : "3 generations offertes sans carte bancaire . TVA recuperable" (ligne 350). "retractation" dans le message d'erreur (ligne 122). | Texte visible par l'utilisateur sans accents. |
| P1-4 | `/comparatif`, `/blog`, `/blog/[slug]` | **Footer inline au lieu du composant Footer** -- liens incomplets, pas de lien Contact, pas de mention Versi Immobilier. | Incoherence navigation inter-pages. |
| P1-5 | `/mentions-legales`, `/confidentialite`, `/cgv` | **border-gray-200 hardcode** dans le header au lieu de border-foreground/5 ou border-foreground/10. | Rupture design tokens -- la bordure ne suivra pas le theme. |
| P1-6 | `/cgv` | **Pack "Studio" (150 credits, 69 EUR)** present dans le tableau CGV mais absent de la page /pricing. | Incoherence contractuelle entre CGV et page de vente. |
| P1-7 | `app/page.tsx` | **bg-white/80 et text-gray-400** hardcodes (badges avant/apres dans la galerie hero, overlays generation). | Rupture tokens -- devrait etre bg-background/80 et text-muted. |

## Bugs P2 -- Backlog

| # | Page | Bug |
|---|---|---|
| P2-1 | `/compte`, `/ma-galerie`, `/mes-biens`, `/mes-biens/[id]`, `/mes-dossiers` | Pas de `export const metadata` ni `generateMetadata`. Pas critique (pages auth, noindex implicite) mais le title du navigateur sera le defaut du layout. |
| P2-2 | Metadata `/marchand`, `/architecte`, `/particulier` | Les descriptions et FAQ dans les objets JS sont sans accents (meta description, og:description). Non visible par l'utilisateur mais present dans le HTML source et lu par Google. |
| P2-3 | `components/RefineModal.tsx` | bg-white hardcode (ligne 184) dans le textarea. |
| P2-4 | `components/UploadZone.tsx` | border-gray-200, bg-gray-50/50 hardcodes (ligne 82). |
| P2-5 | `components/ImageComparator.tsx` | border-gray-200/80 hardcode (ligne 153). |
| P2-6 | `components/OutdoorStylePicker.tsx` | border-gray-200, border-gray-300 hardcodes (ligne 36). |
| P2-7 | `/mentions-legales` | Placeholders "[A completer]" pour SIRET, adresse, forme juridique, directeur publication. A remplir avant commercialisation reelle. |
| P2-8 | `/cgv` | Placeholder "[Mediateur a designer]" section 8. Obligatoire avant premiere vente B2C. |
| P2-9 | `annonce/[uuid]` | `params` non awaited dans Next.js 14+ (`params: { uuid: string }` au lieu de `params: Promise<{ uuid: string }>`). Meme probleme sur `dossier/[uuid]`. Warning potentiel en build. |

## Verdict final

**GO pour le lancement marchand.**

Aucun bug P0 bloquant. Le pipeline de generation IA (v24), les pages publiques, les pages marchands (annonce, dossier, PDF), l'authentification et le paiement Stripe sont operationnels. Les 7 bugs P1 sont des incoherences de navigation et de tokens -- ils n'empechent pas l'utilisation du produit mais doivent etre corriges dans les jours suivant le lancement.

Priorite post-lancement immediate :
1. Remplacer les footers inline par le composant Footer sur pricing, comparatif, blog, blog/[slug]
2. Ajouter le composant Footer sur mentions-legales, confidentialite, cgv
3. Corriger les accents visibles sur /pricing (retractation, generations, recuperable)
4. Aligner le pack Studio entre CGV et pricing (soit l'ajouter a /pricing, soit le retirer des CGV)
5. Remplacer les gray-200/bg-white hardcodes par les tokens du design system

---

**Handoff -> @fullstack**
- Fichier produit : `docs/qa/pre-launch-audit.md`
- Decisions prises : GO conditionnel -- 0 P0, 7 P1, 9 P2
- Points d'attention : P1-6 (incoherence CGV/pricing pack Studio) est le plus risque juridiquement. P1-1/P1-2/P1-4 (footers) sont les plus visibles pour l'utilisateur.
