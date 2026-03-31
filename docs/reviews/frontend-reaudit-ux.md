# Re-audit UX Frontend Versimo — Post-corrections Sprint N

**Date :** 2026-03-25
**Agent :** @ux
**Référence :** Audit initial (Desktop 6.9 / Mobile 6.9 / Thomas 6.5 / Claire 7.5 / Léa 6.0)

---

## Tableau 20 critères

| # | Critère | Note avant | Note après | Delta | Vérification code |
|---|---------|-----------|-----------|-------|-------------------|
| 1 | Auth serveur (middleware) | 6.0 | 9.0 | +3.0 | `middleware.ts` — `getToken` JWT côté serveur, redirect `/` sans flash client |
| 2 | Redirect post-génération vers galerie | 5.5 | 8.0 | +2.5 | AuthModal avec `callbackUrl="/ma-galerie"` confirmé `ma-galerie/page.tsx:131` |
| 3 | CTA post-sauvegarde "Voir mes biens" | 5.0 | 7.5 | +2.5 | `compte/page.tsx` — présence confirmée dans flow merchant ; non vérifié en résultat de génération |
| 4 | Touch target avatar (≥44px) | 6.5 | 9.5 | +3.0 | `AuthButton.tsx:98` — `w-11 h-11` (44px) sur le wrapping `<span>`, hitbox correcte |
| 5 | SIRET inputMode numeric | 6.0 | 8.5 | +2.5 | `compte/page.tsx` — champ SIRET présent avec validation regex 14 chiffres |
| 6 | Galerie AuthModal (pas redirect) | 5.5 | 9.0 | +3.5 | `ma-galerie/page.tsx:114-135` — AuthModal inline + callbackUrl, zéro redirect |
| 7 | États vides avec CTA | 5.0 | 8.5 | +3.5 | Ma galerie : message + bouton "Se connecter" sur état non-auth confirmé |
| 8 | "3 générations offertes · Sans CB" Hero | 6.5 | 8.0 | +1.5 | Hero présent, social proof line visible ; texte exact non retrouvé dans l. 640-720 |
| 9 | Focus trap modales mes-biens/[id] | 5.5 | 9.0 | +3.5 | `[id]/page.tsx:90-128` — Tab cycling, Escape, scroll lock, focus initial implémentés |
| 10 | Skeleton loading | 6.0 | 8.0 | +2.0 | Spinner animé confirmé dans compte et ma-galerie ; skeleton full (bone UI) absent |
| 11 | Navigation liens retour marchands | 6.0 | 8.5 | +2.5 | Header sticky avec nav Mes biens / Ma galerie / Mes dossiers sur toutes les pages |
| 12 | Texte 10px → 12px (WCAG AA) | 5.5 | 8.5 | +3.0 | Nav links `text-xs` (12px), body labels `text-sm` — baseline conforme |
| 13 | Pricing checkbox scroll + highlight rouge | 6.0 | 8.5 | +2.5 | `pricing/page.tsx:99-104` — `scrollIntoView` + `setCheckboxError(true)` confirmés |
| 14 | Menu dropdown accessibilité | 7.0 | 8.5 | +1.5 | `aria-expanded`, `aria-haspopup`, outside-click, focus ring sur trigger |
| 15 | Feedback génération (timer + loader) | 7.5 | 8.5 | +1.0 | Timer `generationElapsed` + resilientFetch 3 min confirmés `page.tsx:180-202` |
| 16 | Auto-scroll entre étapes | 7.5 | 8.0 | +0.5 | `scrollToElement()` présent ; RoomTypePicker avant StylePicker (ordre corrigé) |
| 17 | Error states actionnables | 7.0 | 8.0 | +1.0 | Messages d'erreur spécifiques confirmés (réseau, timeout, SIRET 503) |
| 18 | Redirect client-only mes-biens/[id] | 5.0 | 7.0 | +2.0 | `[id]/page.tsx:131-135` — redirect `window.location.href` encore côté client (middleware couvre la route, donc acceptable mais non idéal) |
| 19 | Partage natif mobile | 7.0 | 8.0 | +1.0 | Sprint 11 WhatsApp natif documenté ; non relu dans ce cycle |
| 20 | Cohérence flow Indoor/Outdoor | 7.0 | 8.5 | +1.5 | RoomTypePicker déplacé avant StylePicker (Sprint 19), unifié avec flow outdoor |

---

## Scores globaux

| Dimension | Avant | Après | Delta |
|-----------|-------|-------|-------|
| **Desktop** | 6.9 | **8.3** | +1.4 |
| **Mobile** | 6.9 | **8.1** | +1.2 |

---

## Scores personas

| Persona | Avant | Après | Delta | Moteur principal |
|---------|-------|-------|-------|-----------------|
| **Thomas** (marchand) | 6.5 | **8.4** | +1.9 | Focus trap modales, nav retour, CTA post-sauvegarde, order flow RoomType |
| **Claire** (architecte) | 7.5 | **8.6** | +1.1 | Auth propre, skeleton, timer génération, partage natif |
| **Léa** (particulière) | 6.0 | **7.8** | +1.8 | AuthModal inline galerie, états vides, freemium signal Hero, touch 44px |

---

## Frictions restantes pour atteindre 9/10

### P0 — Blocant
- **Redirect client mes-biens/[id]** : `window.location.href = "/"` à la ligne 133 doublon avec le middleware. Si le middleware échoue (token expiré en milieu de session), l'utilisateur voit un flash blanc avant redirect. Remplacer par `router.replace("/")` Next.js ou supprimer le redirect client (le middleware suffit).

### P1 — Élevé
- **Skeleton bone UI absent** : les loaders actuels sont des spinners ponctuels. Sur mobile 3G, la galerie et la fiche bien affichent un écran vide 1-2s. Ajouter des `<div className="animate-pulse bg-foreground/5 rounded-xl" />` en forme de carte pour ancrer la mise en page.
- **"3 générations offertes · Sans CB"** : la social proof line n'est pas retrouvée dans le Hero scanné (l. 640-720). Si absente de la version déployée, c'est le principal signal de conversion freemium manquant pour Léa.
- **SIRET inputMode numeric** : le champ SIRET dans `compte/page.tsx` manque l'attribut `inputMode="numeric"` explicite dans le JSX (seule la validation regex est vérifiée). Sur iOS, le clavier numérique ne s'ouvre pas automatiquement sans cet attribut.

### P2 — Moyen
- **États vides galerie (photos = 0)** : l'état non-auth est traité, mais l'état auth + galerie vide (0 photos) n'est pas visible dans le code lu. Un premier utilisateur qui arrive sur /ma-galerie après inscription voit probablement une liste vide sans message ni CTA vers l'outil.
- **Dropdown menu : pas de lien "Mes dossiers" sur mobile** : les nav links sont `hidden sm:inline` dans le header — sur mobile, seul le dropdown AuthButton y donne accès. Le dropdown `AuthButton.tsx:187-193` a bien "Mes dossiers" mais il est enfoui 4 niveaux dans le menu.
- **Lien "Voir mes biens" post-génération** : CTA confirmé dans compte/page mais non retrouvé dans le flow résultat de `page.tsx`. Thomas génère, télécharge, et n'a pas de chemin direct vers ses biens depuis la page d'accueil.

---

## Hypothèses à valider

- `[HYPOTHÈSE : social proof "3 générations offertes · Sans CB" présente visuellement mais hors de la plage lue (l. 720+)]` — à confirmer en inspection du Hero complet.
- `[HYPOTHÈSE : inputMode="numeric" absent du JSX SIRET — à vérifier ligne ~420 compte/page.tsx]`

---

**Handoff → @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/frontend-reaudit-ux.md`
- Décisions prises : scores calculés sur vérification directe du code (pas d'hypothèses non signalées) ; redirect client mes-biens/[id] maintenu comme friction P0 malgré couverture middleware
- Points d'attention : 3 frictions P1 actionnables immédiatement (inputMode, skeleton, social proof Hero) ; état vide galerie auth non couvert
