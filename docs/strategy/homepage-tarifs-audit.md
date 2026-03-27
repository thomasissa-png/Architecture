# Audit Stratégique — Homepage & Tarifs — Mise en valeur pro
> Produit par @creative-strategy — 2026-03-27
> Référence : brand-platform.md (2026-03-24), pricing-strategy.md (2026-03-25), app/page.tsx, app/pricing/page.tsx

---

## 0. Contexte de l'audit

Commande fondateur : identifier les lacunes de la homepage et de la page tarifs dans la communication de la valeur pro (Claire, Thomas), et décider si des exemples visuels (dossiers, annonces) doivent être ajoutés.

Calibration concurrentielle effectuée sur Gepetto et Renovate Club (WebSearch 2026-03-27).

---

## 1. Audit Homepage — Score valeur perçue par les pros : 6,5/10

### Ce qui fonctionne

- Positionnement "Votre pièce meublée, en 90 secondes" — clair, différenciant, aligné brand-platform
- Pills personas (Architectes / Marchands de biens / Particuliers) visibles au-dessus du H1 — bonne hiérarchie
- Social proof line ("12 styles · 90 secondes · HD gratuit") — factuelle, sobre, dans le ton Versiroom
- CTA "Essayer gratuitement" + "3 générations offertes sans CB" — levée de friction correcte
- Copy sous-titre "Versiroom préserve votre espace — il ne le réinvente pas" — le différenciateur pipeline 2 passes est nommé

### Lacunes identifiées

**P0 — La valeur pro de Thomas est invisible au premier écran**
Les pills "Marchands de biens" et "Architectes" sont des labels, pas des promesses. Il n'y a aucune mention du ROI économique pour Thomas (200-500€/planche → 29€, -97%), qui est pourtant l'argument le plus tranchant du produit. Un marchand de biens qui atterrit sur la homepage ne comprend pas en 5 secondes ce qu'il gagne à changer de méthode.

**P0 — Le pipeline 2 passes n'est pas expliqué comme différenciateur**
"Préserve votre espace" est la conclusion, pas l'argument. Ni Claire ni Thomas ne comprennent pourquoi Versiroom est différent des outils génériques qui réinventent la géométrie. Le bénéfice (crédibilité pour vos clients, photos utilisables sur les portails) n'est pas articulé.

**P1 — Les use-case cards sous le Hero sont trop génériques**
"Partagez des pistes d'inspiration" (Architectes) et "Précommercialisez vos opérations" (Marchands de biens) sont dans le bon registre mais manquent de spécificité. Claire dit "Je veux un support de conversation avec mon client dès le premier RDV" — ce vocabulaire n'apparaît nulle part. Thomas dit "Si je peux sortir 3 visuels en 10 minutes au lieu de payer 1500€" — cet argument non plus.

**P1 — Zéro social proof qualitative**
Il n'y a pas de témoignage, pas de chiffre d'usage, pas de logos clients. Gepetto affiche Orpi, Century 21, Coldwell Banker sur sa page. Renovate Club revendique 10 000 utilisateurs. Versiroom est en alpha — mais même une citation de test utilisateur ou un chiffre de générations réalisées renforcerait la crédibilité.

**P2 — Mode Marchand (F4) non visible sur la homepage**
Le toggle Standard / Mode Marchand n'apparaît que pour les utilisateurs connectés. Un Thomas non connecté ne sait pas que cette feature existe. C'est la feature la plus différenciante pour son profil.

---

## 2. Audit Page Tarifs — Score clarté + conversion : 6/10

### Ce qui fonctionne

- Grille 3 packs propre, hiérarchie visuelle correcte (Pro mis en avant avec badge "Recommandé")
- Prix/photo affiché sous chaque pack — bon ancrage de décision pour Thomas
- Mention "Sans abonnement. Sans engagement." — différenciation vs Renovate Club (abonnement) bien articulée
- Footer pricing page : "Pour les architectes, marchands de biens et particuliers" — cohérence cible

### Lacunes identifiées

**P0 — Le Mode Marchand (F4) est enterré dans une feature list**
"Mode Marchand — dossiers PDF" apparaît comme une ligne de feature dans le pack Pro, au même niveau que "3 itérations par photo". Pour Thomas, le Mode Marchand EST le produit — c'est la raison principale d'acheter le Pro. L'argument ROI (29€ vs 200-500€ chez un prestataire) recommandé dans pricing-strategy.md §3 n'apparaît nulle part sur la page.

**P0 — Pas de section contextuelle par profil**
Claire, Thomas et Léa ont des raisons d'acheter fondamentalement différentes. La page tarifs présente les features identiques pour tout le monde. Il n'y a pas de bloc "Ce pack est fait pour vous si..." qui permettrait à Thomas de se reconnaître immédiatement dans le Pro sans lire la liste entière.

**P1 — F6 Annonce publique n'est pas expliquée**
"Annonces immobilières" dans le pack Pro est une ligne opaque. Thomas ne sait pas ce que cela implique (page publique partageable, dossier avec URL, partage acheteurs). C'est une feature à forte valeur perçue pour lui qui devrait être développée, pas résumée en 2 mots.

**P1 — L'économie vs home stager humain est absente**
Pricing-strategy.md §3 recommande explicitement d'afficher "29€ vs 200-500€ chez un prestataire" pour F4. Ce n'est pas implémenté. C'est l'argument de conversion le plus puissant pour Thomas et le seul qui justifie le saut du Starter au Pro.

**P2 — Le plan gratuit manque d'un CTA différencié**
La note "3 générations offertes sans CB" est en sage sous le pack Découverte, mais il n'y a pas de CTA "Commencer gratuitement" visible. Un Thomas qui ne veut pas encore payer n'a pas de chemin de conversion clair vers l'essai.

---

## 3. Benchmark concurrentiel — Standard marché sur les exemples visuels

### Ce que font les concurrents

**Gepetto** : affiche une galerie avant/après par cas d'usage (ameublement, désencombrement, rénovation virtuelle, façades extérieures). Chaque cas d'usage a plusieurs photos réelles de biens immobiliers traités. Les logos des réseaux clients (Orpi, Century 21) sont affichés. Pas de page "dossier" ou "annonce" dédiée visible.

**Renovate Club** : affiche des exemples avant/après sur sa homepage, revendique le partage via "web et PDF" dans le messaging, mais sans page dédiée exemples publique identifiable.

**Constat** : le standard marché est la galerie avant/après intégrée à la homepage, pas une page dédiée /exemples. Aucun concurrent majeur ne montre de "dossier marchand complet" public — c'est un espace libre.

---

## 4. Plan d'action — Exemples visuels (dossiers et annonces)

### Décision recommandée : Oui, mais en 2 étapes

**Étape 1 (P0 — immédiat, avant monétisation)** : Section galerie avant/après sur la homepage, spécifique par persona.

Pas une page dédiée — une section intégrée au flow de la homepage, entre le Hero et l'outil. 3 blocs :
- **Architectes** : 2-3 exemples de pièces chantier → meublées en styles curatés (Japandi, Scandinave, Art Déco). Caption : "Support de conversation prêt en 90 secondes."
- **Marchands de biens** : 1 exemple d'appartement brut → dossier 3 pièces meublées. Caption : "3 photos. 10 minutes. 29€ au lieu de 1 500€ chez un prestataire."
- **Particuliers** : 1 exemple salon vide → même pièce en 2 styles différents (Scandinave vs Cosy). Caption : "Votre pièce. Vos styles. Pas celle d'une autre."

Format recommandé : slider avant/après (identique au comparateur in-app) sur 3-4 exemples réels générés en production. Screenshots statiques en attendant des photos pro. Taille de section : compact, 400px hauteur max, ne remplace pas l'outil.

**Étape 2 (P1 — après lancement F6)** : Page publique /examples dédiée marchands de biens.

Quand F6 (annonces publiques) sera live, chaque annonce générée par Versiroom est une démo vivante. Agréger 5-10 des meilleures annonces publiques sur une page /examples avec un filtre par type de bien. Coût de production : nul (contenu généré par les utilisateurs). Valeur SEO : forte ("home staging virtuel appartement T3 exemple", "dossier marchand de biens IA exemple").

### Ce qu'il ne faut pas faire

- Ne pas créer de page /examples statique avec des images synthétiques "de démonstration" sans base réelle — contradiction avec le positionnement "ne trahit pas votre espace"
- Ne pas bloquer le flow de conversion principal pour montrer des exemples — la galerie est une preuve, pas un produit
- Ne pas montrer des exemples avec des défauts connus (hallucinations fenêtres, meubles flottants) — seules les meilleures générations (note Yann/Lucas > 7,5/10) sont éligibles

---

## 5. Recommandations classées P0-P2

| Priorité | Action | Fichier impacté | Responsable |
|---|---|---|---|
| P0 | Ajouter argument ROI Thomas dans Hero ou use-case card ("200-500€ → 29€") | app/page.tsx | @copywriter → @fullstack |
| P0 | Ajouter section galerie avant/après 3 personas sur la homepage | app/page.tsx | @fullstack |
| P0 | Ajouter bloc contexte Pro sur la page tarifs ("Ce pack est fait pour vous si...") avec argument ROI Mode Marchand | app/pricing/page.tsx | @copywriter → @fullstack |
| P0 | Développer la ligne "Annonces immobilières" du pack Pro en 2-3 mots supplémentaires | app/pricing/page.tsx | @copywriter |
| P1 | Reformuler les use-case cards avec le vocabulaire exact des personas (citation directe) | app/page.tsx | @copywriter |
| P1 | Rendre le Mode Marchand visible en homepage pour les non-connectés (teaser sans toggle) | app/page.tsx | @fullstack |
| P1 | Ajouter une note "ROI : 29€ vs 200-500€ chez un prestataire" sous la feature Mode Marchand dans le pack Pro | app/pricing/page.tsx | @copywriter |
| P2 | Ajouter un CTA "Essayer gratuitement" visible sur la page tarifs (distinct du CTA "Acheter") | app/pricing/page.tsx | @fullstack |
| P2 | Planifier la page /examples automatique (F6 dépendance) dans la roadmap | docs/product/ | @product-manager |

---

## 6. Auto-évaluation

- Positionnement dans espace libre identifié en benchmark : OUI (dossier marchand complet non documenté par les concurrents)
- Personas cités par nom et vocabulaire propre : OUI (Claire, Thomas, Léa avec citations directes)
- Recommandations avec owner + action + cible : OUI (tableau section 5)
- Promesse différenciante ET crédible : OUI (ancré sur les audits Yann/Lucas et le pipeline 2 passes documenté)
- Benchmark identifie ce que TOUS font (pour s'en distinguer) : OUI (galerie avant/après = standard, dossier public = espace libre)

---

**Handoff → @copywriter**
- Fichiers produits : `docs/strategy/homepage-tarifs-audit.md`
- Décisions prises : galerie avant/après en homepage (Étape 1 immédiate), page /examples après F6. Argument ROI Thomas ("200-500€ → 29€") à intégrer P0 dans Hero ou use-case card. Vocabulaire personas (citation directe) à utiliser dans les cards.
- Points d'attention : (1) l'argument ROI Mode Marchand est le levier de conversion le plus fort pour Thomas — il doit apparaître sur la homepage ET sur la page tarifs. (2) Ne pas mentionner Gepetto ou Renovate Club nommément dans le copy (garde-fou brand-platform §10). (3) Le registre "sobre, précis, professionnel sans être froid" s'applique — pas de "révolutionnaire", pas de chiffres ROI inventés.

**Handoff → @fullstack**
- Sections à implémenter : galerie avant/après 3 personas (app/page.tsx), bloc contextuel "Ce pack est fait pour vous si..." (app/pricing/page.tsx), teaser Mode Marchand visible sans auth (app/page.tsx)
- Dépendances : le contenu exact (copy, images) est produit par @copywriter avant implémentation
- Point d'attention : les images de la galerie doivent être issues de générations réelles notées >7,5/10 par les agents Yann/Lucas — consulter /api/logs pour identifier les meilleures (générations #28, #31, #36 candidates selon CLAUDE.md)
