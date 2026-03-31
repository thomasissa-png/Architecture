# Synthese croisee des audits — Versimo — 2026-03-25

**Agent** : @reviewer | **Livrables audites** : 6 rapports (@ux 7.5/10, @design 7.4/10, @seo 38/100, @copy, @infrastructure 5.3/10, @legal)

---

## 1. Vue d'ensemble

| Agent | Livrable | Note/Score | Statut |
|---|---|---|---|
| @ux | ux-audit.md | 7.5/10 | 5 problemes identifies (1 critique, 2 hauts, 2 moyens) |
| @design | design-audit.md | 7.4/10 | 5 problemes (1 bloquant, 2 majeurs, 1 moyen, 1 mineur) |
| @seo | seo-audit.md | 38/100 | 7 criteres KO ou partiels sur 10 |
| @copywriter | copy-audit.md | Non note | 1 bloquant, 3 hauts, 1 moyenne, 2 basses |
| @infrastructure | performance-audit.md | 5.3/10 | 2 critiques (monitoring, CI/CD), 2 alertes (perf API, scalabilite) |
| @legal | site-compliance-audit.md | Non note | 3 risques CRITIQUES (mentions legales, CGU, confidentialite) |

**Diagnostic global** : le produit est techniquement fonctionnel (pipeline 2 passes valide, 19 sprints d'iteration) mais l'enveloppe autour du produit — conformite legale, SEO, monitoring, copy — est en dessous du minimum requis pour monetiser.

---

## 2. Convergences inter-agents (signalees par 2+ audits)

| Probleme | Signale par | Priorite convergente |
|---|---|---|
| **Emojis StylePicker** : registre grand-public incompatible avec le positionnement premium | @design (P1 bloquant), @ux (critere 3, 7.5/10) | CRITIQUE |
| **Pricing mensuel affiche vs decision packages one-shot** | @copy (bloquant), @legal (prix sans TTC), roadmap (Stripe one-shot) | BLOQUANT |
| **Absence de pages legales** (mentions, CGU, confidentialite) | @legal (P0), @seo (maillage interne 2/10 — 0 pages hors /) | BLOQUANT |
| **Incoherence "11 styles" vs 12 styles reels** | @ux (P5), @copy (critere 1) | HAUTE |
| **Absence de visuels reels** (hero SVG placeholder, pas de preview styles) | @design (P3, imagerie 5/10), @ux (P3 preview styles) | HAUTE |
| **Pas de CI/CD ni tests** | @infrastructure (CI/CD 2/10), roadmap (QA = NOW) | HAUTE |
| **Pas de monitoring/health check** | @infrastructure (monitoring 3/10, P0) | HAUTE |
| **API /api/logs ouverte sans auth** (IP + prompts accessibles) | @infrastructure (securite 6/10), @legal (collecte IP sans info RGPD) | HAUTE |

---

## 3. Contradictions inter-agents

| Livrable A | Livrable B | Contradiction | Arbitrage |
|---|---|---|---|
| @copy : "en 90 secondes" comme ancrage | @infrastructure : pipeline 30-60s + aucun timeout = peut depasser 3 min | La promesse copy est correcte (cible 90s). Le probleme est infra : ajouter le timeout 120s (P1 infra) pour que la promesse soit tenable. |
| @seo : corriger H1/H2 dans page.tsx | @ux : reveler les blocs par etapes (P1 critique) | Pas de contradiction reelle. La correction H1/H2 et la revelation progressive sont compatibles. Faire les deux. |
| @copy : "Votre piece meublee, en 90 secondes" (titre hero) | @design : hero SVG placeholder a remplacer par visuels reels | Complementaires, pas contradictoires. Le nouveau titre est plus fort mais necessite un visuel reel a cote pour etre credible. Priorite : titre d'abord (effort S), visuel ensuite (effort L, depend du pipeline IA). |

Aucune contradiction bloquante detectee. Les 6 audits sont alignes sur les priorites.

---

## 4. Top 10 actions prioritaires (impact sur KPI 3000 EUR/mois marge)

| # | Probleme | Source(s) | Agent | Effort | Impact |
|---|---|---|---|---|---|
| 1 | **Pages legales manquantes** (mentions, confidentialite, CGU) — obligatoire LCEN, RGPD | @legal P0 | @copywriter (draft) + @fullstack (pages) | M | CRITIQUE |
| 2 | **Pricing a aligner sur packages one-shot** — l'affichage mensuel contredit la decision strategique et bloque Stripe | @copy bloquant, roadmap | @product-manager (grille) + @fullstack | M | CRITIQUE |
| 3 | **Prix TTC + mentions TVA** sur la section pricing — obligation Code conso Art. L112-1 | @legal P0 | @fullstack | S | CRITIQUE |
| 4 | **Sitemap.ts + robots.ts** — Google explore a l'aveugle, risque d'indexer /api/ et /admin | @seo P0 | @fullstack | S | HAUTE |
| 5 | **Titre hero + CTA** aligner sur brand-voice.md ("Votre piece meublee, en 90 secondes" + "Essayer gratuitement") | @copy haute | @fullstack | S | HAUTE |
| 6 | **Emojis StylePicker** remplacer par pastilles couleur ou pictos vectoriels — coherence premium | @design P1, @ux | @design (specs) + @fullstack | M | HAUTE |
| 7 | **Endpoint /api/health** + monitoring UptimeRobot — aucun moyen de detecter une panne aujourd'hui | @infra P0 | @fullstack | S | HAUTE |
| 8 | **Timeout 120s sur appels OpenAI/Replicate** — 1 provider freeze = service bloque indefiniment | @infra P1 | @fullstack | S | HAUTE |
| 9 | **Metadata OG + JSON-LD + H1/H2** — partages sociaux sans image, zero Rich Results Google | @seo P1-P3 | @fullstack | M | HAUTE |
| 10 | **Revelation progressive des etapes** — tous les blocs visibles des le chargement = friction premiere visite | @ux P1 critique | @fullstack | M | MOYENNE |

---

## 5. Bloqueurs avant monetisation (Auth + Stripe)

Ces problemes DOIVENT etre resolus AVANT de lancer le systeme de paiement :

| # | Bloqueur | Raison | Agent |
|---|---|---|---|
| B1 | **Mentions legales** | Obligation LCEN — site deja en ligne et collecte des photos/IP | @copywriter + @fullstack |
| B2 | **Politique de confidentialite** | RGPD — collecte en cours sans information utilisateur | @copywriter + @fullstack |
| B3 | **CGU/CGV** | Obligation avant toute vente — cadre contractuel des packages credits | @copywriter (draft) + validation avocat |
| B4 | **Grille de packages validee** | @product-manager n'a pas encore defini les tiers — la section pricing actuelle est fausse | @product-manager |
| B5 | **Prix TTC** | Code de la consommation — affichage obligatoire avant toute transaction | @fullstack |
| B6 | **Case retractation contenu numerique** | Tunnel Stripe — obligation avant validation paiement | @fullstack |
| B7 | **Disclaimer IA renforce** | EU AI Act Art. 50 — "Visuels generes par IA — representations non contractuelles" | @fullstack |

**Ne sont PAS des bloqueurs** (nice-to-have avant monetisation) : emojis StylePicker, visuels hero reels, preview styles, CI/CD, domaine propre, JSON-LD.

---

## 6. Handoff — Plan d'action @fullstack

**Phase 1 — Conformite legale (avant Stripe, ~3 jours)**
1. Creer `app/mentions-legales/page.tsx` — contenu fourni par @copywriter dans `docs/legal/mentions-legales.md`
2. Creer `app/confidentialite/page.tsx` — contenu fourni par @copywriter dans `docs/legal/privacy-policy.md`
3. Creer `app/cgv/page.tsx` — contenu fourni par @copywriter dans `docs/legal/cgu-draft.md`
4. Ajouter 3 liens dans le footer de page.tsx : Mentions legales, CGV, Confidentialite
5. Section pricing : afficher prix TTC avec "TVA 20% incluse"
6. Disclaimer IA : remplacer ligne 1319 par "Visuels generes par intelligence artificielle — representations indicatives non contractuelles"

**Phase 2 — SEO + copy quick wins (~1 jour)**
7. Creer `app/sitemap.ts` et `app/robots.ts` (code dans docs/seo/metadata-templates.md)
8. Corriger titre hero : "Votre piece meublee, en 90 secondes." + sous-titre brand-voice.md
9. CTA header : "Essayer" → "Essayer gratuitement"
10. Corriger "11 styles" → "12 styles" (hero + social proof)
11. Corriger hierarchie H1/H2 dans page.tsx
12. Aligner metadata layout.tsx sur metadata-templates.md (metadataBase, OG, Twitter Cards)

**Phase 3 — Infra stabilisation (~1 jour)**
13. Creer `app/api/health/route.ts` (PG + Object Storage + cles API)
14. Ajouter AbortController timeout 120s sur appels OpenAI et Replicate dans route.ts
15. Documenter `.env.local.example` complet (5 variables)

**Phase 4 — UX/Design (apres monetisation, ~3-5 jours)**
16. Revelation progressive des etapes (masquer blocs tant que files.length === 0)
17. Bouton "Annuler" generation (brancher sur abortControllerRef existant)
18. Remplacer emojis StylePicker (attendre specs @design : pastilles couleur ou pictos)
19. Tokeniser --muted et --border dans globals.css

---

**Handoff → @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/site-audit-synthesis.md`
- Decisions prises : GO avec reserves — le produit est fonctionnel mais 7 bloqueurs legaux/produit doivent etre resolus avant activation Stripe. Aucune contradiction bloquante inter-agents.
- Points d'attention : (1) @product-manager doit valider la grille de packages AVANT que @fullstack touche au pricing. (2) @copywriter doit produire les 3 documents legaux (mentions, CGU, confidentialite). (3) Les corrections SEO et copy sont independantes et peuvent demarrer immediatement.
