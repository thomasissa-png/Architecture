# Audit Pages Publiques — Versiroom (batch 1)

## Synthèse
| Page | Score | P0 | P1 | P2 |
|---|---|---|---|---|
| page.tsx (Homepage) | 7.5/10 | 2 | 4 | 3 |
| pricing/page.tsx | 8.5/10 | 0 | 1 | 3 |
| comparatif/page.tsx | 7/10 | 0 | 2 | 3 |
| marchand/page.tsx | 8/10 | 0 | 2 | 2 |

---

## page.tsx (Homepage)

### P0

- Ligne 694 : `Votre pi&egrave;ce meubl&eacute;e,` → `Votre pièce meublée,` (entités HTML interdites dans JSX — règle 13 CLAUDE.md)
- Ligne 649 : `<a href="/" className="text-xl font-semibold text-foreground tracking-tighter">` → ajouter `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm` (logo header sans focus-visible — seul le header homepage est non-conforme, tous les autres headers ont le focus)

### P1

- Ligne 299 : `files[invalidIndex].name}" ne semble pas être une photo d\u2019intérieur` → remplacer `\u2019` par `'` UTF-8 direct (règle 13 CLAUDE.md — séquence unicode dans string JS)
- Ligne 666 : `<a href="#pricing"` → `<a href="#pricing"` — lien ancre interne OK mais le lien nav "Tarifs" pointe vers `#pricing` (ancre page homepage) alors que le lien dans la sous-note hero (ligne 854) aussi. Cohérent. En revanche, les liens `href="/mes-biens"`, `href="/ma-galerie"`, `href="/mes-dossiers"` (lignes 655-663) sont des liens morts pour un utilisateur non-authentifié qui inspecte la page — ils sont conditionnels à `session`, donc acceptables. Pas de P1 ici. **Vrai P1 :** le pricing homepage (section `id="pricing"`) affiche "0€", "9,90€", "29€" sans espace insécable avant le sigle — incohérence avec la page `/pricing` qui affiche "9,90 €" (avec espace). Lignes 1467 / 1503 / 1539 : `0€` → `0 €`, `9,90€` → `9,90 €`, `29€` → `29 €`
- Ligne 1390 : `<a href="#pricing"` dans le bloc "0 itération restante" → pointe vers `#pricing` sur la homepage alors que l'utilisateur est déjà sur la homepage à cette étape. Correct. **Vrai P1 :** les boutons "Surfaces uniquement" / "Surfaces + Mobilier" (lignes 1069-1095) n'ont pas de `focus-visible` ni `min-h-[44px]`. Lignes 1070 et 1079 : ajouter `min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2`
- Ligne 1176 : `jusqu\u2019à 2 minutes par image` → `jusqu'à 2 minutes par image` (règle 13 — `\u2019` dans string)

### P2

- Ligne 699 : `Uploadez une photo, choisissez un style parmi 12 ambiances curat&eacute;es` → `Uploadez une photo, choisissez un style parmi 12 ambiances curateées` — les entités `&eacute;` dans le sous-titre hero sont des entités HTML dans JSX. Acceptable dans le JSX rendu directement (rule 13 exception), mais incohérent avec les lignes 694-695 qui utilisent aussi des entités. Uniformiser : soit tout en UTF-8, soit tout en entités. Recommandation : passer tout en UTF-8 pour la lisibilité du code.
- Ligne 854 : `<a href="#pricing" className="underline hover:text-foreground transition-colors">Tarifs à partir de 9,90 €</a>` — pas de `focus-visible` sur ce lien inline. Ajouter `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm`
- Ligne 1374 : `title="It&eacute;rations &eacute;puis&eacute;es — rechargez un pack"` → `title="Itérations épuisées — rechargez un pack"` (entités dans attribut title — non rendu, inutile)

---

## pricing/page.tsx

### P0

Aucun P0 détecté.

### P1

- Ligne 85 : `"8 biens \u00d7 5 photos \u00d7 300 \u20ac/planche = 12 000 \u20ac/an chez un home stager. Versiroom Pro : 348 \u20ac/an."` → `"8 biens × 5 photos × 300 €/planche = 12 000 €/an chez un home stager. Versiroom Pro : 348 €/an."` (règle 13 — séquences unicode dans string constant)

### P2

- Ligne 199 : sous-titre `"3 offres claires. Starter sans abonnement, Pro mensuel. Résiliez à tout moment."` — mentionne "Starter sans abonnement, Pro mensuel" mais oublie de mentionner "Découverte gratuit". Incohérent avec le h1 "Tarifs simples et transparents". Suggestion : `"Découverte gratuit · Starter 9,90 € une fois · Pro 29 €/mois"`
- Ligne 447 : FAQ item `"Les crédits Pro non utilisés sont-ils reportés ?"` → réponse dit "les 50 crédits Pro sont renouvelés chaque mois" — cohérent avec les PACKS. OK. Mais la FAQ n'a pas de `<h2>` avec un `id` permettant le deep-link. Mineur.
- Ligne 220 : bandeau CTA gratuit utilise `bg-sage/8` — vérifier que cette valeur Tailwind custom est définie dans la config. Si `bg-sage/8` n'est pas dans safelist, risque de purge en production. À vérifier dans `tailwind.config.ts`.

---

## comparatif/page.tsx

### P0

Aucun P0 détecté.

### P1

- Ligne 9 : `title: "Comparatif home staging IA 2026 : Versiroom vs Gepetto vs InterieurAI | Versiroom"` — nomme les concurrents par nom dans les métadonnées SEO. La règle 14 de CLAUDE.md interdit de mentionner les concurrents par nom dans les livrables client-facing. Exception documentée : "les livrables internes [...] DOIVENT nommer les concurrents". La page comparatif est un livrable SEO public donc règle 14 s'applique. **Cependant** : une page comparatif ne peut pas fonctionner sans nommer les concurrents — c'est le sujet même de la page. C'est un cas-limite qui doit être arbitré par le fondateur. Signalé comme P1 pour décision.
- Ligne 39-51 : texte FAQ sans accents (`interieur`, `egalement`, `geometrie`, `fidelite`, etc.) — les strings dans `faqItems` sont en JSX et ne passent pas par des entités. Ces chaînes sont directement dans des objets JS, les accents UTF-8 doivent être présents. Lignes 39, 44, 50 : remplacer `interieur` → `intérieur`, `egalement` → `également`, `geometrie` → `géométrie`, `fidelite` → `fidélité`, `adapte` → `adapté`, `Tous les outils ne se valent pas sur ce point.` est correct. Correction systématique des accents manquants dans `faqItems`.

### P2

- Ligne 70-138 : `comparatifData` — les strings `"Oui (depth map + 2 passes)"`, `"Non documente"`, `"Mentionnee"` sont sans accents. `"documente"` → `"documenté"`, `"Mentionnee"` → `"Mentionnée"`. Règle 13 CLAUDE.md.
- Ligne 98 : `versiroom: "Architectes + Marchands + Particuliers"` — cohérent avec les personas. OK.
- Lignes 455-478 : liens `/architecte`, `/marchand`, `/particulier`, `/blog` dans le footer de la section CTA — `/blog` est un lien potentiellement mort (pas de page blog visible dans la structure). À vérifier avec `Glob app/blog`.

---

## marchand/page.tsx

### P0

Aucun P0 détecté.

### P1

- Ligne 309 : `<a href="/pricing?pack=starter"` — le paramètre `?pack=starter` n'est pas géré dans `pricing/page.tsx` (le `useSearchParams` lit `?buy=xxx` et `?checkout=xxx`, pas `?pack=xxx`). Ce lien arrive sur la page pricing sans pré-sélectionner le pack Starter. L'utilisateur doit retrouver le bon bouton manuellement. Correction : utiliser `href="/pricing?buy=starter"` ou, si le scroll-to est voulu, ajouter un `id="starter"` sur la carte dans pricing et utiliser `href="/pricing#starter"`.
- Ligne 325 : même problème pour `<a href="/pricing?pack=pro"` → `href="/pricing?buy=pro"` (ou anchor `#pro`)

### P2

- Ligne 120 : `<a href="/examples"` — lien vers `/examples` potentiellement mort. À vérifier avec `Glob app/examples`.
- Ligne 36 : FAQ string `"Un home stager traditionnel facture entre 200 et 500 euros par planche"` utilise des apostrophes droites (`'`) dans `"jusqu'"` — cohérent. OK. Mais `"jusqu'à 50 visuels"` à la ligne 37 utilise une apostrophe courbe — incohérence mineure dans les strings FAQ entre guillemets droits et courbes. Uniformiser en UTF-8 `'` dans toutes les strings.

---

## Liens morts à vérifier (cross-pages)

| Lien | Page source | Statut |
|---|---|---|
| `/architecte` | comparatif, page.tsx | À vérifier |
| `/particulier` | comparatif, page.tsx | À vérifier |
| `/blog` | comparatif | À vérifier |
| `/examples` | marchand | À vérifier |
| `/pricing?pack=starter` | marchand | Paramètre non géré |
| `/pricing?pack=pro` | marchand | Paramètre non géré |

---

## Violations règle 13 (UTF-8 obligatoire) — récapitulatif

| Fichier | Ligne | Occurrence |
|---|---|---|
| page.tsx | 694 | `pi&egrave;ce meubl&eacute;e` dans h1 |
| page.tsx | 699 | `curat&eacute;es`, `pr&eacute;serve` dans p |
| page.tsx | 299 | `\u2019` dans string JS |
| page.tsx | 1176 | `\u2019` dans string JS |
| page.tsx | 1374 | entités HTML dans attribut `title` |
| pricing/page.tsx | 85 | `\u00d7`, `\u20ac` dans string constant |
| comparatif/page.tsx | 39-51 | accents manquants dans faqItems strings |
| comparatif/page.tsx | 70-138 | accents manquants dans comparatifData strings |

**Note :** les entités HTML dans le JSX rendu directement (ex: `&mdash;`, `&apos;`, `&middot;`) sont acceptables selon la règle 13 exception. Seuls les `\uXXXX` dans les strings JS et les entités dans les attributs non-HTML (title, alt, aria-label) sont à corriger.

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/reviews/full-site-audit-public.md`
- Corrections prioritaires : (1) P0 focus-visible logo header homepage, (2) P0 entités HTML dans h1 homepage, (3) P1 paramètres `/pricing?pack=` non gérés dans marchand, (4) P1 `\u` sequences dans pricing PACKS constant, (5) P1 accents manquants dans comparatif faqItems
- Points d'attention : la règle 14 (nommage concurrents) sur comparatif/page.tsx est un cas-limite — décision fondateur requise avant modification
