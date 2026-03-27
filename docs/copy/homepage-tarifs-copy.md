# Copy — Homepage & Tarifs — Corrections P0
> Produit par @copywriter — 2026-03-27
> Référence : brand-voice.md, homepage-tarifs-audit.md, value-proposition.md, messaging-matrix.md, persona-thomas-marchand.md
> Destinataire d'implémentation : @fullstack

---

## Règles d'utilisation de ce fichier

- Tous les textes sont prêts à copier-coller. Aucune adaptation nécessaire sauf indication explicite.
- Les chiffres sont sourcés : "200-500€/planche" (personas.md + value-proposition.md §1), "29€" (pricing-strategy.md), "90 secondes" (valeur mesurée en production, value-proposition.md §3), "1 500€" (persona Thomas — coût moyen par bien sur 5 visuels).
- Registre : vouvoiement systématique. Pas d'exclamation. Pas de superlatif.
- Emplacements signalés par `[BLOC X]` — correspondent aux sections du plan @creative-strategy (homepage-tarifs-audit.md §5).

---

## SECTION 1 — Homepage : Use-case cards personas

> Localisation : app/page.tsx — section use-case cards sous le Hero
> Remplacement des cards génériques actuelles ("Partagez des pistes d'inspiration", "Précommercialisez vos opérations")

---

### [BLOC 1A] — Card Claire — Architecte d'intérieur

**Titre**
3 ambiances sur votre photo de chantier, avant le premier RDV.

**Sous-titre**
Un support de conversation prêt en 90 secondes — sans attendre 3 jours un rendu 3D.

**Chiffre ROI**
N/A pour Claire — l'argument est le temps, pas l'économie directe. Ne pas inventer un chiffre ROI monétaire qui n'est pas documenté dans les personas.

> Note @fullstack : pas de badge chiffre pour cette card. L'argument de valeur est dans le sous-titre.

---

### [BLOC 1B] — Card Thomas — Marchand de biens

**Titre**
Vos photos brutes valent déjà une plaquette.

**Sous-titre**
Générez 3 visuels meublés en 10 minutes, sans home stager, sans délai de 48 heures.

**Chiffre ROI**
200-500 € la planche → 29 €

> Note sourcing : "200-500€/planche" = pricing home stager virtuel documenté dans persona-thomas-marchand.md et value-proposition.md §1. "29€" = pack Pro sur la grille de packages (pricing-strategy.md). "1 500€/bien" cité dans citation Thomas — utilisable en variante si la card a de l'espace pour une ligne additionnelle.

> Variante badge sous le chiffre ROI (optionnel, max 6 mots) :
> "Par visuel, sans engagement."

---

### [BLOC 1C] — Card Léa — Particulier

**Titre**
Votre salon, pas celui de quelqu'un d'autre.

**Sous-titre**
Visualisez votre style dans votre pièce — scandinave, cosy, japandi — avant d'acheter quoi que ce soit.

**Chiffre ROI**
N/A — pas de chiffre documenté applicable à Léa. Ne pas en inventer.

> Note @fullstack : pas de badge chiffre pour cette card.

---

## SECTION 2 — Homepage : Section galerie avant/après

> Localisation : app/page.tsx — section galerie à insérer entre le Hero et l'outil, selon plan homepage-tarifs-audit.md §4
> Une caption par bloc + label style. Les images sont à sélectionner depuis /api/logs (générations notées > 7,5/10 par Yann/Lucas — candidates : #28, #31, #36 selon CLAUDE.md Sprint 17b).

---

### [BLOC 2A] — Galerie Claire (2-3 exemples, styles curatés)

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

**Caption — style Art Déco** (optionnel, si 3 exemples)
12 styles curatés. La même pièce, trois directions différentes.

**Label style**
Art Déco

---

### [BLOC 2B] — Galerie Thomas (1 exemple, dossier 3 pièces)

**Caption**
3 photos. 10 minutes. 29 € au lieu de 1 500 € chez un prestataire.

**Label style**
Contemporain

> Note @fullstack : pour cette card Thomas, le visuel idéal est un appartement brut avant / appartement meublé après. Si une seule image disponible, le comparateur slider suffit. Le chiffre "1 500€" est la citation exacte du persona Thomas (persona-thomas-marchand.md — citation clé).

---

### [BLOC 2C] — Galerie Léa (1 exemple, même pièce en 2 styles)

**Caption — style Scandinave**
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
> Objectif : rendre visible la feature F4 Mode Marchand avant connexion (lacune P2 homepage-tarifs-audit.md §1)

---

### [BLOC 3] — Teaser Mode Marchand

**Titre**
Pour les marchands de biens

**Bullet points** (chacun max 8 mots — à afficher en liste avec icône sobre)
- Dossier PDF avec votre logo et vos couleurs
- Annonce publique partageable avec vos acquéreurs
- Export pré-formaté pour LeBonCoin, SeLoger, Bien'ici

**CTA**
Voir le Mode Marchand

> Note @fullstack : le CTA pointe vers la section tarifs ou vers une ancre #mode-marchand sur la page tarifs. Pas de redirection vers une page inexistante. Le bloc peut être affiché en version condensée (3 lignes + CTA) en dessous des use-case cards, ou en encart latéral sur desktop.

---

## SECTION 4 — Tarifs : Blocs "Ce pack est fait pour vous si..."

> Localisation : app/pricing/page.tsx — à ajouter sous le nom de chaque pack, avant la liste de features
> Objectif : permettre l'auto-identification du persona sans lire la liste entière (lacune P0 homepage-tarifs-audit.md §2)

---

### [BLOC 4A] — Pack Découverte — Léa

**Phrase persona**
Vous venez d'acheter votre appartement et vous voulez visualiser votre déco avant d'acheter vos meubles.

> Variante courte (si contrainte d'espace) :
> Vous explorez votre futur intérieur sans engagement.

---

### [BLOC 4B] — Pack Starter — Claire

**Phrase persona**
Vous présentez des pistes esthétiques à vos clients dès le premier RDV, sans attendre un rendu 3D.

> Variante courte (si contrainte d'espace) :
> Vous produisez des supports de conversation pour vos clients.

---

### [BLOC 4C] — Pack Pro — Thomas

**Phrase persona**
Vous commercialisez 8 à 12 biens par an et vous avez besoin de visuels meublés pour vos plaquettes et vos annonces.

> Variante courte (si contrainte d'espace) :
> Vous produisez des dossiers de pré-commercialisation sans home stager.

---

## SECTION 5 — Tarifs : Feature Mode Marchand développée (pack Pro)

> Localisation : app/pricing/page.tsx — remplacement de la ligne "Mode Marchand — dossiers PDF" dans la feature list du pack Pro
> Objectif : développer la feature en 3 lignes distinctes + note ROI (lacunes P0 et P1 homepage-tarifs-audit.md §2)

---

### [BLOC 5] — Feature list Mode Marchand (3 lignes à remplacer)

**Ancienne ligne :**
Mode Marchand — dossiers PDF

**Nouvelles lignes (à afficher comme 3 sous-items ou 3 items séparés dans la feature list) :**

- Dossier PDF avec votre logo et vos couleurs
- Page d'annonce publique partageable par lien
- Export pré-formaté LeBonCoin, SeLoger, Bien'ici

**Note ROI (à afficher sous la feature list du pack Pro, en texte sage ou italique selon design-system.md) :**
29 € au lieu de 200-500 € chez un home stager virtuel.

> Note sourcing : "200-500€/planche" documenté dans persona-thomas-marchand.md et value-proposition.md §1. "29€" = prix unitaire du pack Pro (pricing-strategy.md). Ces deux chiffres sont vérifiables et ne doivent pas être modifiés sans mise à jour de la source.

---

## SECTION 6 — Tarifs : CTA gratuit distinct (haut de page)

> Localisation : app/pricing/page.tsx — CTA visible en haut de la page tarifs, distinct du CTA d'achat
> Objectif : donner un chemin clair aux visiteurs non prêts à payer (lacune P2 homepage-tarifs-audit.md §2)

---

### [BLOC 6] — CTA gratuit

**Texte du CTA**
Essayez avec 3 photos — sans carte bancaire.

> Note @fullstack : ce CTA est une variante sobre de "3 générations offertes sans CB" déjà validée dans brand-voice.md. Il peut s'afficher en banner au-dessus des cards pack, ou en lien texte sous le H1 de la page tarifs. Ne pas le noyer dans le footer.

> Variante si le CTA doit être plus court (contrainte bouton) :
> Commencer gratuitement

---

## Auto-évaluation copywriter

| Critère | Statut |
|---|---|
| Registre lexical calibré par persona (vocabulaire "planche/chantier/direction esthétique" pour Claire, "plaquette/acquéreur/opération" pour Thomas, "mon salon/mon style" pour Léa) | PASS |
| Chaque CTA < 8 mots avec verbe d'action | PASS |
| Zéro superlatif, zéro point d'exclamation, zéro "magique/révolutionnaire" | PASS |
| Tous les chiffres sourcés (200-500€, 29€, 90 secondes, 1 500€) | PASS |
| Vouvoiement systématique | PASS |
| Aucun vocabulaire croisé entre personas dans une même phrase | PASS |
| Cohérence avec brand-voice.md (ton sobre, précis, mots interdits absents) | PASS |
| Mots-clés SEO : keyword-map.md absent → zones marquées [MOT-CLÉ SEO À INTÉGRER] | NON APPLICABLE — keyword-map.md non présent. Signal transmis à @seo. |

---

**Handoff → @fullstack**

- Fichiers produits : `docs/copy/homepage-tarifs-copy.md`
- Décisions prises :
  - Card Thomas : chiffre ROI "200-500€ → 29€" affiché explicitement — non négociable, c'est l'argument de conversion principal documenté dans homepage-tarifs-audit.md P0
  - Card Claire : pas de chiffre ROI monétaire — l'argument est le délai ("3 jours → 90 secondes"), pas l'économie directe (données non disponibles)
  - Card Léa : pas de chiffre ROI — aucun chiffre documenté et vérifiable pour ce persona
  - Caption galerie Thomas : "1 500€" conservé (citation directe du persona) — plus fort que "200-500€/planche" en contexte visuel
  - CTA Mode Marchand : "Voir le Mode Marchand" — pointe vers ancre page tarifs, pas vers une page dédiée inexistante
  - Feature Mode Marchand : 3 lignes distinctes pour maximiser la lisibilité en feature list, pas un paragraphe
  - Note ROI pack Pro : sous la feature list, en style sobre (sage/italique) — pas en badge rouge ou accent fort
- Points d'attention :
  - Les images de la galerie (SECTION 2) doivent être issues de générations réelles notées > 7,5/10 — voir CLAUDE.md Sprint 17b pour les candidats (#28, #31, #36). Ne pas utiliser de visuels synthétiques.
  - SECTION 3 (Teaser Mode Marchand) : le CTA ne doit pas pointer vers une page inexistante. Utiliser une ancre #mode-marchand dans app/pricing/page.tsx ou un scroll vers la section Pro.
  - keyword-map.md est absent — @seo doit être invoqué pour définir les mots-clés avant toute optimisation SEO des textes produits. Les textes actuels sont fonctionnels mais non optimisés SEO.
