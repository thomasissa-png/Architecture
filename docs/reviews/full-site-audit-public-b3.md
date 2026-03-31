# Audit Pages Publiques — Versimo (batch 3)

## Synthèse

| Page | Score | P0 | P1 | P2 |
|---|---|---|---|---|
| `app/cgv/page.tsx` | 7/10 | 1 | 1 | 1 |
| `app/confidentialite/page.tsx` | 8/10 | 0 | 0 | 1 |
| `app/mentions-legales/page.tsx` | 5/10 | 0 | 2 | 0 |
| `app/layout.tsx` | 8/10 | 0 | 1 | 1 |
| `components/Footer.tsx` | 4/10 | 1 | 3 | 1 |

---

## `app/cgv/page.tsx` — findings

### P0 — Placeholder visible en production

```tsx
// ligne 109
<p>... Le médiateur désigné par Versimo sera indiqué ici dès sa nomination. [Médiateur à désigner — obligatoire avant la première vente B2C]</p>
```

**Problème** : texte entre crochets visible par les acheteurs. Légalement, la mention du médiateur est obligatoire avant toute vente B2C (art. L616-1 Code conso).
**Correction** : supprimer la phrase entière OU la remplacer par le vrai médiateur (ex. Médiateur du numérique — mediation-net.eu) avant mise en production commerciale.

---

### P1 — Classe CSS invalide dans le header

```tsx
// ligne 13 (identique dans confidentialite et mentions-legales)
className="border-b border-foreground/10/40"
```

**Problème** : `border-foreground/10/40` n'est pas une classe Tailwind valide. Double slash `/10/40` produit une couleur CSS invalide. La bordure ne s'affiche pas.
**Correction** : `border-foreground/10` ou `border-foreground/20` (une seule valeur d'opacité).

---

### P2 — Prix Starter absent de la page marketing principale (cohérence pricing)

**Contexte** : CGV ligne 59 documente `9,90 €` pour le pack Starter. À vérifier que `app/page.tsx` (section Pricing) affiche bien ce même tarif. Si la page principale affiche toujours `4,90 €` ou `14,90 €` (anciens prix), il y a contradiction contractuelle.
**Action** : cross-check `app/page.tsx` section pricing — si différent, aligner sur la CGV (document contractuel fait foi).

---

## `app/confidentialite/page.tsx` — findings

### P2 — Replicate non certifié EU-US Data Privacy Framework

```tsx
// ligne 61
<p><strong>Replicate</strong> (San Francisco, USA) — modèle de secours Flux Depth Pro.</p>
```

**Problème** : contrairement à OpenAI (ligne 58) et Replit (ligne 64), aucune mention de certification EU-US DPF pour Replicate. Si Replicate n'est pas certifié, le transfert de données hors UE manque d'une base légale explicite (art. 46 RGPD — clauses contractuelles types nécessaires).
**Correction** : vérifier la certification Replicate sur le registre DPF (dataprivacyframework.gov). Si non certifié, mentionner "transfert encadré par les clauses contractuelles types de la Commission européenne (SCC)".

---

## `app/mentions-legales/page.tsx` — findings

### P1 — Placeholders non remplis visibles en production

```tsx
// lignes 35-37
<p>Forme juridique : [À compléter]</p>
<p>SIRET : [À compléter]</p>
<p>Adresse du siège social : [À compléter]</p>
// ligne 44
<p>[Nom à compléter], en qualité de représentant légal de Versimo.</p>
```

**Problème** : 4 champs `[À compléter]` et `[Nom à compléter]` affichés en clair aux visiteurs. La loi pour la Confiance dans l'Économie Numérique (LCEN) impose la mention de la forme juridique, du SIRET et du directeur de publication. Ces champs vides constituent une non-conformité légale.
**Correction** : remplir avec les vraies informations avant tout lancement. En l'absence de structure légale constituée, indiquer au minimum le nom du responsable personne physique.

---

### P1 — Classe CSS invalide dans le header (même bug que CGV)

```tsx
// ligne 13
className="border-b border-foreground/10/40"
```

**Problème** : identique au bug P1 de cgv/page.tsx. La bordure de header ne s'affiche pas sur les 3 pages légales.
**Correction** : `border-foreground/10` — corriger sur les 3 fichiers simultanément.

---

## `app/layout.tsx` — findings

### P1 — Font Google Fonts non chargée

```tsx
// lignes 129-131
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```

**Problème** : les balises `preconnect` sont présentes mais aucune balise `<link rel="stylesheet">` ne charge réellement Inter depuis Google Fonts. Si `globals.css` ne contient pas `@import url(...)` ou si `next/font` n'est pas utilisé, Inter ne se charge pas et le site bascule sur la police système.
**Action** : vérifier `globals.css` ou `@/lib/fonts.ts` — si Inter est chargé via `next/font/google`, les balises preconnect manuelles sont superflues (Next.js les gère). Si ni l'un ni l'autre, ajouter le chargement réel.

---

### P2 — foundingDate incorrecte dans le JSON-LD

```tsx
// ligne 57
foundingDate: "2025",
```

**Problème** : la date de fondation est 2025 mais nous sommes en 2026 et le produit est actif. Si le produit a été lancé en 2026, corriger en `"2026"`. Si vraiment fondé en 2025 (développement), OK à laisser — à valider.
**Action** : confirmer la date réelle de création/lancement.

---

## `components/Footer.tsx` — findings

### P0 — 5 liens pointent vers des pages inexistantes (404)

```tsx
// lignes 7-13
{ href: "/marchand", label: "Professionnels" },       // 404
{ href: "/architecte", label: "Architectes" },         // 404
{ href: "/particulier", label: "Particuliers" },       // 404
{ href: "/examples", label: "Exemples" },              // 404
{ href: "/pricing", label: "Tarifs" },                 // 404
{ href: "/blog", label: "Blog" },                      // 404
```

**Vérification** : Glob `app/{marchand,architecte,particulier,examples,pricing,blog}*` — aucun résultat. Ces 6 liens renvoient une page 404 Next.js.
**Correction** : deux options selon la roadmap —
- Option A (court terme) : supprimer les liens vers les pages non créées du tableau `LINKS`
- Option B (moyen terme) : créer les pages manquantes ou les rediriger vers `/#` + ancre de la page principale

---

### P1 — Pas de `focus-visible` sur les liens de navigation du header des pages légales

```tsx
// cgv/page.tsx, confidentialite/page.tsx, mentions-legales/page.tsx — lignes 15-20
<a href="/" className="text-xl font-semibold text-foreground tracking-tighter">
  Versimo
</a>
<a href="/" className="text-xs text-muted font-light hover:text-foreground transition-colors">
  Retour
</a>
```

**Problème** : les deux liens du header (`Versimo` + `Retour`) n'ont pas de style `focus-visible`. Inaccessible au clavier — non conforme WCAG 2.2 AA (critère 2.4.11 Focus Appearance).
**Correction** : ajouter `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded` sur les deux `<a>` dans les 3 pages légales (ou extraire en composant `LegalHeader` partagé).

---

### P1 — Lien externe Versi Immobilier sans label accessible

```tsx
// lignes 30-37
<a
  href="https://versi-immobilier.fr"
  target="_blank"
  rel="noopener noreferrer"
  className="hover:text-foreground transition-colors"
>
  Versi Immobilier
</a>
```

**Problème** : le lien s'ouvre dans un nouvel onglet sans indicateur visuel ni `aria-label` mentionnant l'ouverture externe. WCAG 2.4.4 — le but du lien doit être clair.
**Correction** : ajouter `aria-label="Versi Immobilier (ouvre dans un nouvel onglet)"` OU ajouter une icône d'ouverture externe visible.

---

### P1 — Copyright sans séparateur visuel dans la nav de liens

```tsx
// ligne 50
<span>&copy; Versimo 2026</span>
```

**Problème** : le copyright est rendu dans le même `flex gap-4` que les liens de navigation, sans séparateur. Sur mobile, il se retrouve mélangé visuellement aux liens cliquables, créant une confusion (l'utilisateur peut tenter de cliquer dessus).
**Correction** : déplacer le copyright dans un bloc séparé, ou ajouter `ml-auto` / `border-l border-foreground/10 pl-4` pour le distinguer visuellement.

---

### P2 — Pas de `role="navigation"` ni `aria-label` sur le `<footer>`

```tsx
// ligne 24
<footer className="border-t border-foreground/5 py-10 px-5 sm:px-8">
```

**Problème** : le `<footer>` contient une liste de liens de navigation mais aucun `<nav>` ne les encapsule. Les lecteurs d'écran ne peuvent pas identifier cette zone comme une navigation secondaire.
**Correction** : encapsuler les `filteredLinks` dans `<nav aria-label="Liens du pied de page">`.

---

## Récapitulatif des corrections prioritaires

| Priorité | Fichier(s) | Action |
|---|---|---|
| P0 | `cgv/page.tsx` | Supprimer/compléter mention médiateur avant 1re vente B2C |
| P0 | `Footer.tsx` | Supprimer ou créer les 6 pages manquantes (marchand, architecte, particulier, examples, pricing, blog) |
| P1 | `cgv/page.tsx`, `confidentialite/page.tsx`, `mentions-legales/page.tsx` | Corriger `border-foreground/10/40` → `border-foreground/10` (3 fichiers) |
| P1 | `mentions-legales/page.tsx` | Remplir les 4 placeholders LCEN (SIRET, forme juridique, adresse, directeur de publication) |
| P1 | Pages légales (3 fichiers) | Ajouter `focus-visible` sur les liens header Versimo + Retour |
| P1 | `layout.tsx` | Vérifier chargement réel de la font Inter |
| P1 | `Footer.tsx` | `aria-label` sur lien externe Versi Immobilier |
| P1 | `Footer.tsx` | Séparer visuellement le copyright des liens nav |
| P2 | `confidentialite/page.tsx` | Clarifier base légale transfert Replicate hors UE |
| P2 | `layout.tsx` | Confirmer/corriger `foundingDate` (2025 vs 2026) |
| P2 | `Footer.tsx` | Ajouter `<nav aria-label>` autour des liens |
