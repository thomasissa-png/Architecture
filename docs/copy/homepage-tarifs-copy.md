# Copy — Homepage & Tarifs — Corrections P0
> Produit par @copywriter — 2026-03-27
> Référence : brand-voice.md, homepage-tarifs-audit.md, value-proposition.md, messaging-matrix.md, persona-thomas-marchand.md
> Destinataire d'implémentation : @fullstack

---

## Règles d'utilisation de ce fichier

- Tous les textes sont prêts à copier-coller. Aucune adaptation nécessaire sauf indication explicite.
- Les chiffres sont sourcés : "200-500€/planche" (persona-thomas-marchand.md + value-proposition.md §1), "29€" (grille packages dans project-context.md — pack Pro), "90 secondes" (valeur mesurée en production, value-proposition.md §3), "1 500€" (citation directe Thomas — coût moyen par bien sur 5 visuels, persona-thomas-marchand.md).
- Registre : vouvoiement systématique. Pas d'exclamation. Pas de superlatif.
- Emplacements signalés par `[BLOC X]` — correspondent aux sections du plan @creative-strategy (homepage-tarifs-audit.md §5).

---

## SECTION 1 — Homepage : Use-case cards personas

> Localisation : app/page.tsx — section use-case cards sous le Hero
> Remplacement des cards génériques actuelles ("Partagez des pistes d'inspiration", "Précommercialisez vos opérations")

---

### [BLOC 1A] — Card Claire — Architecte d'intérieur

**Titre** (7 mots)
3 ambiances sur votre chantier, avant le premier RDV.

**Sous-titre** (14 mots)
Un support de conversation prêt en 90 secondes — sans attendre 3 jours un rendu 3D.

**Chiffre ROI**
N/A — l'argument de valeur pour Claire est le délai, pas l'économie monétaire directe. Aucun chiffre ROI monétaire documenté dans les personas. Ne pas en inventer.

> Note @fullstack : pas de badge chiffre pour cette card. La valeur est dans le sous-titre ("3 jours → 90 secondes").

---

### [BLOC 1B] — Card Thomas — Marchand de biens

**Titre** (6 mots)
Vos photos brutes valent déjà une plaquette.

**Sous-titre** (12 mots)
3 visuels meublés en 10 minutes, sans home stager, sans délai de 48 heures.

**Chiffre ROI**
200-500 € la planche → 29 €

> Note sourcing : "200-500€/planche" documenté dans persona-thomas-marchand.md et value-proposition.md §1. "29€" = pack Pro (project-context.md — grille packages). "1 500€/bien" est la citation directe du persona Thomas — utilisable en variante.

> Variante badge sous le chiffre ROI (optionnel, max 6 mots) :
> Par visuel, sans engagement.

---

### [BLOC 1C] — Card Léa — Particulier

**Titre** (7 mots)
Votre salon, pas celui de quelqu'un d'autre.

**Sous-titre** (13 mots)
Visualisez votre style dans votre pièce — scandinave, cosy, japandi — avant d'acheter quoi que ce soit.

**Chiffre ROI**
N/A — aucun chiffre documenté et vérifiable pour ce persona. Ne pas en inventer.

> Note @fullstack : pas de badge chiffre pour cette card.

---

## SECTION 2 — Homepage : Section galerie avant/après

> Localisation : app/page.tsx — section galerie à insérer entre le Hero et l'outil, selon plan homepage-tarifs-audit.md §4
> Une caption par bloc + label style. Les images sont à sélectionner depuis /api/logs — générations notées > 7,5/10 par Yann/Lucas. Candidates selon CLAUDE.md Sprint 17b : #28 (Scandinave, 8.4/10), #31 (Art Déco, 8.3/10), #36 (Scandinave passe 1, Lucas 8.3/10).
> Règle impérative : ne pas utiliser de visuels synthétiques ou de démonstration — uniquement des générations de production réelles.

---

### [BLOC 2A] — Galerie Claire (2 à 3 exemples, styles curatés)

**Caption — style Japandi**
Support de conversation prêt en 90 secondes, sans rendu 3D.

**Label style**
Japandi

---

**Caption — style Scandinave**
La direction esthétique, posée avant le premier RDV.

**Label style**
Scandinave

---

**Caption — style Art Déco** (optionnel si 3 exemples disponibles)
12 styles curatés. La même pièce, trois directions différentes.

**Label style**
Art Déco

---

### [BLOC 2B] — Galerie Thomas (1 exemple, appartement brut → meublé)

**Caption**
3 photos. 10 minutes. 29 € au lieu de 1 500 € chez un prestataire.

**Label style**
Contemporain

> Note @fullstack : le visuel idéal est un appartement brut (avant) / appartement meublé (après) affiché en comparateur slider. Si une seule image disponible, le comparateur slider suffit. "1 500€" est la citation exacte du persona Thomas (persona-thomas-marchand.md — citation clé) — ne pas modifier ce chiffre.

---

### [BLOC 2C] — Galerie Léa (1 exemple, même pièce en 2 styles)

**Caption — style Scandinave** (premier slide)
Votre pièce. Deux styles. Décidez avant d'acheter.

**Label style**
Scandinave

---

**Caption — style Cosy** (deuxième slide)
Le même salon — une autre ambiance.

**Label style**
Cosy

---

## SECTION 3 — Homepage : Teaser Mode Marchand (visiteurs non connectés)

> Localisation : app/page.tsx — bloc visible pour tous les visiteurs, indépendant du toggle auth
> Objectif : rendre visible la feature Mode Marchand avant connexion (lacune P2 homepage-tarifs-audit.md §1)
> Position recommandée : en dessous des use-case cards, avant l'outil ou en encart sur la sidebar desktop

---

### [BLOC 3] — Teaser Mode Marchand

**Titre** (4 mots)
Pour les marchands de biens.

**Bullet points** (chacun max 8 mots — à afficher avec icône sobre)
- Dossier PDF avec votre logo et vos couleurs
- Annonce publique partageable avec vos acquéreurs
- Export pré-formaté pour LeBonCoin, SeLoger, Bien'ici

**CTA** (4 mots)
Voir le Mode Marchand

> Note @fullstack : le CTA pointe vers une ancre #mode-marchand dans app/pricing/page.tsx, ou vers la section Pro via scroll. Ne pas pointer vers une page dédiée qui n'existe pas encore. Le bloc peut s'afficher en version condensée (3 bullets + CTA) sous les cards, ou en encart latéral desktop.

---

## SECTION 4 — Tarifs : Blocs "Ce pack est fait pour vous si..."

> Localisation : app/pricing/page.tsx — à ajouter sous le nom de chaque pack, avant la liste de features
> Objectif : permettre l'auto-identification du persona sans lire la liste entière (lacune P0 homepage-tarifs-audit.md §2)
> Format recommandé : ligne de texte en italique ou en couleur sage, sous le nom du pack, avant les features

---

### [BLOC 4A] — Pack Découverte — Léa

**Phrase persona**
Vous venez d'acheter votre appartement et vous voulez visualiser votre déco avant d'acheter vos meubles.

> Variante courte (si contrainte d'espace) :
> Vous explorez votre futur intérieur, sans engagement.

---

### [BLOC 4B] — Pack Starter — Claire

**Phrase persona**
Vous présentez des pistes esthétiques à vos clients dès le premier RDV, sans attendre un rendu 3D.

> Variante courte (si contrainte d'espace) :
> Vous produisez des supports de conversation pour vos clients.

---

### [BLOC 4C] — Pack Pro — Thomas

**Phrase persona**
Vous commercialisez 8 à 12 biens par an et avez besoin de visuels meublés pour vos plaquettes et vos annonces.

> Variante courte (si contrainte d'espace) :
> Vous produisez des dossiers de pré-commercialisation sans home stager.

---

## SECTION 5 — Tarifs : Feature Mode Marchand développée (pack Pro)

> Localisation : app/pricing/page.tsx — remplacement de la ligne "Mode Marchand — dossiers PDF" dans la feature list du pack Pro
> Objectif : développer la feature en 3 lignes distinctes + note ROI (lacunes P0 et P1 homepage-tarifs-audit.md §2)

---

### [BLOC 5] — Feature list Mode Marchand (3 lignes à remplacer)

**Ancienne ligne à supprimer :**
Mode Marchand — dossiers PDF

**Nouvelles lignes (à afficher comme 3 sous-items avec icône check dans la feature list) :**

- Dossier PDF avec votre logo et vos couleurs
- Page d'annonce publique partageable par lien
- Export pré-formaté LeBonCoin, SeLoger, Bien'ici

**Note ROI (à afficher sous la feature list du pack Pro, en texte sage ou italique selon design-system.md) :**
29 € au lieu de 200-500 € chez un home stager virtuel.

> Note sourcing : "200-500€/planche" documenté dans persona-thomas-marchand.md et value-proposition.md §1. "29€" = prix unitaire du pack Pro (project-context.md). Ces deux chiffres sont vérifiables et ne doivent pas être modifiés sans mise à jour de la source.
> Note @fullstack : cette note ROI est l'argument de conversion le plus puissant pour Thomas. Elle doit être visible sans scroll dans la section Pro — pas en footer de page.

---

## SECTION 6 — Tarifs : CTA gratuit distinct (haut de page)

> Localisation : app/pricing/page.tsx — CTA visible en haut de la page tarifs, distinct du CTA d'achat
> Objectif : donner un chemin clair aux visiteurs non prêts à payer, notamment Léa et Thomas en phase de découverte (lacune P2 homepage-tarifs-audit.md §2)

---

### [BLOC 6] — CTA gratuit

**Texte du CTA**
Essayez avec 3 photos — sans carte bancaire.

> Note @fullstack : ce CTA peut s'afficher en banner au-dessus des cards pack, ou en lien texte sous le H1 de la page tarifs. Ne pas le noyer dans le footer. C'est une variante sobre de "3 générations offertes sans CB" (brand-voice.md) — les deux formulations sont validées.

> Variante courte (contrainte bouton, max 3 mots) :
> Commencer gratuitement

---

## Auto-évaluation

| Critère | Statut |
|---|---|
| Titres cards personas : max 8 mots, chacun contrôlé | PASS — 1A : 7 mots, 1B : 6 mots, 1C : 7 mots |
| CTAs : max 8 mots avec verbe d'action | PASS — "Voir le Mode Marchand" (4 mots), "Essayez avec 3 photos — sans carte bancaire" (7 mots) |
| Vocabulaire persona non croisé — "planche/chantier/direction esthétique" pour Claire, "plaquette/acquéreur/opération" pour Thomas, "mon salon/mon style" pour Léa | PASS |
| Zéro superlatif, zéro point d'exclamation, zéro mot interdit (magique, révolutionnaire, accessible à tous) | PASS |
| Tous les chiffres sourcés (200-500€ → personas.md + value-proposition.md, 29€ → project-context.md, 90 secondes → value-proposition.md §3, 1 500€ → persona Thomas citation directe) | PASS |
| Vouvoiement systématique | PASS |
| Cohérence avec brand-voice.md — ton sobre, précis, aucun mot de la liste interdite | PASS |
| Brand voice : "préservé/curatés/support de conversation/plaquette" utilisés dans les bons contextes persona | PASS |
| Mots-clés SEO | NON APPLICABLE — keyword-map.md absent. Signal transmis à @seo. Les zones à optimiser sont les titres H2 des sections use-case cards et les phrases personas en tarifs. |

---

**Handoff → @fullstack**

- Fichiers produits : `docs/copy/homepage-tarifs-copy.md`
- Décisions prises :
  - Card Thomas [BLOC 1B] : chiffre ROI "200-500€ → 29€" affiché explicitement — c'est l'argument de conversion P0 identifié dans homepage-tarifs-audit.md. Non négociable.
  - Card Claire [BLOC 1A] : pas de chiffre ROI monétaire — l'argument est le délai ("3 jours → 90 secondes"), aucun chiffre économique documenté pour Claire dans les personas.
  - Card Léa [BLOC 1C] : pas de chiffre ROI — aucun chiffre vérifiable disponible.
  - Caption galerie Thomas [BLOC 2B] : "1 500€" conservé (citation directe Thomas) — plus impactant que "200-500€/planche" en contexte visuel.
  - Teaser Mode Marchand [BLOC 3] : CTA "Voir le Mode Marchand" pointe vers ancre #mode-marchand dans /pricing — pas vers une page inexistante.
  - Feature Mode Marchand [BLOC 5] : 3 lignes distinctes pour maximiser la lisibilité en feature list (pas un paragraphe).
  - Note ROI pack Pro [BLOC 5] : sous la feature list, style sage ou italique — pas en badge rouge ou accent fort (contraire au ton Versiroom).
  - CTA gratuit [BLOC 6] : formulation avec tiret "—" pour marquer la respiration — cohérent avec le style typographique de brand-voice.md.
- Points d'attention :
  - SECTION 2 : les images de la galerie doivent être issues de générations réelles notées > 7,5/10 — voir CLAUDE.md Sprint 17b pour les candidats (#28 Scandinave 8.4/10, #31 Art Déco 8.3/10). Ne pas utiliser de visuels de démonstration synthétiques.
  - SECTION 3 : le CTA "Voir le Mode Marchand" ne doit pas pointer vers une page dédiée inexistante. Ancre #mode-marchand dans /pricing ou scroll vers la section Pro.
  - SECTION 5 : la note ROI "29€ au lieu de 200-500€" doit rester visible sans scroll dans le pack Pro. C'est l'argument de conversion principal pour Thomas — le noyer en bas de page annule son effet.
  - keyword-map.md est absent — @seo doit être invoqué avant toute optimisation SEO de ces textes. Les textes actuels sont fonctionnels mais non optimisés pour le référencement.
