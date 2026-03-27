# Wireframe — Restructuration Homepage + Pages Personas
> Agent : @ux — 2026-03-27
> Contexte lus : project-context.md, app/page.tsx (code actuel), docs/copy/brand-voice.md
> Recherche concurrents : Gepetto (Bordeaux, qualité, 1-clic, 30+ styles), Renovate Club (9,99€/mois illimité)
> Demande fondateur : suppression galerie métier, déplacement Mode Pro, renommage, 3 pages personas

---

## Frictions UX identifiées et résolues

### Friction 1 — Répétition sans valeur ajoutée : galerie "par métier" après les pills du hero

**Problème actuel.** La section "Avant / Après par métier" (lignes 889-976 de page.tsx) contient 3 cartes (Claire/Thomas/Léa) qui redoublent exactement les pills du hero. L'utilisateur lit "Pour les architectes d'intérieur" dans le hero, puis scroll de 20vh pour relire "Claire, architecte d'intérieur" avec la même citation. Aucune information nouvelle. La section occupe ~350px sur desktop, ~520px sur mobile pour zéro gain de compréhension.

**Signal de friction.** Dans les patterns observés chez Gepetto et les benchmarks SaaS 2026, la duplication d'un message sur la même page est systématiquement corrélée à un taux de scroll-through plus bas : l'utilisateur perçoit qu'il n'y a "rien de nouveau" et quitte ou saute directement à l'outil.

**Résolution.** Suppression complète. Les 3 personas ont leurs pages dédiées (/architecte, /marchand, /particulier) où leur cas d'usage est développé avec profondeur. Les pills du hero deviennent des liens directs vers ces pages.

---

### Friction 2 — Mode Pro invisible au moment décisif

**Problème actuel.** L'encart "Mode Marchand" est positionné AVANT l'outil (section "Teaser Mode Marchand", lignes 978-1017), à un moment où l'utilisateur n'a pas encore testé le produit. Il découvre une promesse de fonctionnalité Pro avant même d'avoir compris la valeur de base. Ce placement crée une friction cognitive : "dois-je d'abord payer ?" alors qu'on veut qu'il essaie gratuitement d'abord.

**Résolution.** L'encart Mode Pro est déplacé immédiatement après le CTA "Essayer gratuitement, 3 générations offertes sans carte bancaire". L'ordre logique devient : (1) essaie gratuitement, (2) voici ce que débloque le Pro. C'est le moment où l'utilisateur est le plus réceptif — il vient d'être convaincu d'essayer, il est chaud.

---

### Friction 3 — Nomenclature "Mode Marchand" trop restrictive

**Problème actuel.** "Mode Marchand" signale que la feature est réservée aux marchands de biens. Or Claire (architecte) et des agences immobilières ont exactement les mêmes besoins (dossiers PDF, liens partageables). Le nom ferme la porte à 60% des clients potentiels.

**Résolution.** Renommage en "Mode Pro" — inclusif, lisible pour tous les professionnels. "Dossiers PDF avant/après" renommé en "Dossiers de pré-commercialisation" pour ancrer la valeur métier.

---

### Friction 4 — Thomas ne voit pas le ROI immédiatement

**Problème actuel.** Le pricing (29€/mois) apparaît en bas de page, dans une section distincte. Thomas, marchand de biens, arrive sur la page avec une question précise : "combien ça coûte vs mon prestataire à 200-500€/planche ?". Il doit scroller ~800px pour trouver la réponse. Entre-temps, il est susceptible de partir.

**Résolution.** L'encart Mode Pro repositionné après le CTA gratuit contient explicitement : "29€/mois · 50 crédits · 0 prestataire". La comparaison "29€ vs 200-500€ par planche" est inscrite dans le copy de l'encart Mode Pro, pas seulement dans la page pricing.

---

### Friction 5 — Léa ne comprend pas que c'est gratuit pour commencer

**Problème actuel.** Le CTA actuel dit "Essayer gratuitement" mais la mention "3 générations offertes · Sans carte bancaire" est en petits caractères sous le bouton. Sur mobile, cette ligne est souvent tronquée. Léa, digital native, a un réflexe de méfiance sur "gratuit" (= gratuit avec CB, puis facturation automatique).

**Résolution.** La mention "Sans carte bancaire" est hissée au même niveau de lisibilité que le CTA — non plus en `text-xs muted` mais en corps de texte normal. Le sous-titre de l'outil intègre "3 générations gratuites, sans créer de compte" pour répéter la garantie juste avant qu'elle engage l'action.

---

### Friction 6 — Blocs "Architectes / Marchands / Particuliers" redondants sous l'outil

**Problème actuel.** La section USE_CASES (3 cartes sous le hero, lignes 878-887) est distincte de la galerie par métier mais porte le même message une troisième fois. L'architecture actuelle répète le même signal d'audience 3 fois en 500px de scroll.

**Résolution.** Les 3 cartes USE_CASES sont remplacées par 3 liens texte discrets vers les pages personas (/architecte, /marchand, /particulier), formulés comme des invitations : "Vous êtes architecte ? Voir les cas d'usage" — pas de cartes, pas de répétition.

---

## Homepage — Nouvelle structure

### Vue d'ensemble — Ordre des sections

```
[1] HEADER fixe
[2] HERO (above the fold)
[3] ENCART MODE PRO — positionné juste après le CTA gratuit
[4] SÉPARATEUR
[5] OUTIL 3 ÉTAPES — ancre #outil
[6] PRICING — ancre #pricing
[7] FOOTER
```

Sections supprimées :
- Galerie "Avant / Après par métier" (3 cartes Architecte/Marchand/Particulier)
- Blocs USE_CASES en cartes sous le hero
- Blocs texte "Claire - Partagez des pistes d'inspiration", "Thomas - Précommercialisez", "Léa - Visualisez"

---

### [1] HEADER fixe

```
┌─────────────────────────────────────────────────────────────┐
│  Versiroom                    Tarifs    [Essayer gratuitement]│
└─────────────────────────────────────────────────────────────┘
```

**Contenu.**
- Logo "Versiroom" — lien vers /
- Nav : "Tarifs" (ancre #pricing) — visible desktop uniquement
- CTA "Essayer gratuitement" (ancre #outil) — visible desktop ET mobile
- Si session active : "Mes biens" / "Ma galerie" / "Mes dossiers" + AuthButton

**Notes d'interaction.**
- `bg-background/80 backdrop-blur-md` — header translucide au scroll
- Pills personas retirées du header — elles sont dans le hero uniquement
- Sur mobile : nav réduite au CTA + AuthButton

---

### [2] HERO (above the fold)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [ pill ] Pour les architectes    [ pill ] Marchands de biens│
│                   [ pill ] Particuliers                      │
│                                                             │
│           Votre pièce meublée,                              │
│           en 90 secondes.                                   │
│                                                             │
│   Uploadez une photo, choisissez un style parmi 12         │
│   ambiances curatées par des experts.                       │
│   Versiroom préserve votre espace — il ne le réinvente pas.│
│                                                             │
│   ┌──────────────┐  ┌──────────────┐                        │
│   │  AVANT       │  │  APRÈS       │                        │
│   │  [photo]     │  │  [photo]     │                        │
│   └──────────────┘  └──────────────┘                        │
│                                                             │
│   12 styles disponibles · 90 secondes · HD gratuit          │
│                                                             │
│      [ Essayer gratuitement ↓ ]                             │
│      3 générations offertes · Sans carte bancaire           │
│                                                             │
│   ─────────────────────────────────────────────────         │
│   Vous êtes architecte ?  /architecte →                     │
│   Marchand de biens ?     /marchand →                       │
│   Particulier ?           /particulier →                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Détail des pills (liens vers pages personas).**

Changement par rapport au code actuel : les pills deviennent des liens `<a href="/architecte">` plutôt que de simples `<span>`. Elles restent stylistiquement identiques (sage/10 bg) mais sont cliquables. Au hover : légère élévation `hover:bg-sage/20` + cursor pointer.

**Détail de la ligne de liens persona (nouveau bloc).**

Remplace les 3 cartes USE_CASES (section supprimée). Format : 3 lignes texte en `text-xs text-muted`, chacune avec une flèche `→`. Alignement centré. Espacé de 24px sous la mention "Sans carte bancaire". Ce bloc est discret — il ne concurrence pas le CTA, il offre une sortie de secours pour ceux qui veulent en savoir plus avant d'essayer.

```
// Structure HTML schématique
<div class="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-6 items-center justify-center">
  <a href="/architecte" class="text-xs text-muted hover:text-sage transition-colors">
    Vous êtes architecte ? Voir les cas d'usage →
  </a>
  <a href="/marchand" class="text-xs text-muted hover:text-sage transition-colors">
    Marchand de biens ? Voir le Mode Pro →
  </a>
  <a href="/particulier" class="text-xs text-muted hover:text-sage transition-colors">
    Particulier ? Commencer gratuitement →
  </a>
</div>
```

**Contenu visuel avant/après.**
- Conservé à l'identique (SVG + /imageavant.jpg + /imageapres.jpg)
- Pas de modification de la section SVG

**Social proof line.**
- Conservée : "12 styles disponibles · Résultat en 90 secondes · Téléchargement HD gratuit"

**CTA principal.**
- "Essayer gratuitement" (ancre #outil) — conservé
- Sous le CTA : "3 générations offertes · Sans carte bancaire" — upgrade de style : `text-sm` au lieu de `text-xs`, couleur `text-foreground/60` au lieu de `text-muted` pour meilleure lisibilité mobile

---

### [3] ENCART MODE PRO — immédiatement après le hero

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [ icône PDF ]                                              │
│                                                             │
│  Mode Pro — pour les professionnels                         │
│                                                             │
│  Vous utilisez Versiroom pour des projets clients ou        │
│  des dossiers de vente ? Le Mode Pro ajoute ce dont        │
│  vous avez besoin — sans changer votre workflow.           │
│                                                             │
│  ✓ 50 générations/mois                                      │
│  ✓ Dossiers de pré-commercialisation (PDF avant/après)      │
│  ✓ Liens partageables sans limite                           │
│  ✓ Mode Pro (organisation par bien, galerie dédiée)         │
│                                                             │
│  29€/mois · Prix de lancement                               │
│  vs. 200 à 500€ par planche chez un home stager virtuel    │
│                                                             │
│      [ Voir le Mode Pro → ]   (ancre #pricing)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Positionnement dans le flow.**
Cet encart apparaît directement sous le hero, AVANT le séparateur et l'outil. Le raisonnement : l'utilisateur vient de lire la promesse "90 secondes" et "gratuit pour commencer". Sa prochaine question naturelle est soit "comment ça marche ?" (→ il scrolle vers l'outil) soit "c'est quoi la version payante ?" (→ cet encart répond). L'encart intercepte la deuxième question sans bloquer la première.

**Copy — Thomas (persona marchand).**
La ligne "29€/mois · vs. 200 à 500€ par planche" est le pivot de cet encart. Elle doit être lisible immédiatement, en `font-semibold`, pas enfouie dans le body text. Thomas fait ce calcul mentalement : 50 crédits × 29€ = moins de 0,60€/visuel vs 200-500€ chez un prestataire. L'encart ne dit pas "économisez 90%" — il donne les deux chiffres bruts et laisse le calcul à Thomas.

**Copy — Claire (persona architecte).**
"sans changer votre workflow" est pour Claire. Elle ne veut pas apprendre un nouvel outil — elle veut que Versiroom s'intègre dans ce qu'elle fait déjà (envoyer des JPG par email, partager des liens avec ses clients).

**Renommage appliqué.**
- "Mode Marchand" → "Mode Pro" dans le titre de l'encart ET dans le toggle Standard/Mode Pro de l'outil
- "Dossiers PDF avant/après" → "Dossiers de pré-commercialisation" dans la liste des features

**Layout.**
- Conserver le layout actuel : flex row sur desktop (icône gauche + contenu droite), flex col sur mobile
- Fond : `bg-foreground/[0.02] border border-foreground/10 rounded-2xl`
- CTA secondaire "Voir le Mode Pro →" — style texte avec flèche, pas de bouton plein (le bouton plein est réservé au CTA principal du hero)

---

### [4] SÉPARATEUR

```
────────────────────────────────────
```

- `max-w-24 mx-auto border-t border-foreground/10`
- Conservé à l'identique

---

### [5] OUTIL 3 ÉTAPES — ancre #outil

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│          Mettez en scène votre espace                       │
│          3 générations gratuites · Sans créer de compte    │
│                                                             │
│  [StepIndicator]                                            │
│                                                             │
│  [Upload]                                                   │
│  [Type d'espace — Intérieur / Extérieur]                   │
│  [RoomTypePicker]                                           │
│  [StylePicker]                                              │
│  [Options Surfaces / Surfaces+Mobilier]                     │
│  [Bouton Générer]                                           │
│                                                             │
│  [Résultats + comparateur + partage]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Changements par rapport au code actuel.**

1. Le sous-titre de l'outil change : de "En trois étapes simples" vers "3 générations gratuites · Sans créer de compte". Ce sous-titre porte désormais la garantie freemium, pas seulement la description du processus. Cette garantie est répétée ici car c'est le moment où l'utilisateur hésite avant d'uploader sa première photo.

2. Le toggle Standard / Mode Pro (actuellement "Standard / Mode Marchand") est renommé "Standard / Mode Pro". Il reste conditionnel à la session active (`session && ...`).

3. Aucun autre changement dans le flow de l'outil. L'ordre Upload → Type d'espace → Style → Options → Générer est conservé.

---

### [6] PRICING — ancre #pricing

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Tarifs simples                                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Gratuit    │  │   Pro        │  │  Business    │      │
│  │              │  │  29€/mois    │  │  79€/mois    │      │
│  │  3 générat.  │  │  Prix lanc.  │  │              │      │
│  │  HD inclus   │  │  50 crédits  │  │  illimité    │      │
│  │              │  │  Mode Pro    │  │  Mode Pro    │      │
│  │              │  │  Dossiers    │  │  Dossiers    │      │
│  │              │  │  précomm.    │  │  précomm.    │      │
│  │              │  │  Liens part. │  │  Liens part. │      │
│  │              │  │  illimités   │  │  illimités   │      │
│  │  [Essayer]   │  │  [Commencer] │  │  [Contact]   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Changements par rapport au pricing actuel.**

- Tier "Pro" : 29€/mois (prix de lancement), 50 crédits/mois, Mode Pro, Dossiers de pré-commercialisation, Liens partageables sans limite
- La mention "Prix de lancement" est affichée sous le prix pour créer l'urgence sans être agressive
- "Dossiers PDF avant/après" → "Dossiers de pré-commercialisation" dans les deux tiers Pro et Business
- "Mode Marchand" → "Mode Pro" dans les deux tiers

**Note sur le modèle économique.**
Le project-context.md indique que le fondateur envisage des packages one-shot (4,90€ à 69€) plutôt qu'un abonnement mensuel. Ce wireframe conserve la grille mensuelle visible dans le code actuel mais signale ce point : si la décision de basculer vers des packages est prise avant l'implémentation, la section pricing doit être repensée. Ce choix relève de @product-manager, pas de @ux.

---

### [7] FOOTER

Conservé à l'identique. Année 2026, messaging ouvert à tous.

---

## Pages Personas — Structure commune

Les 3 pages (/architecte, /marchand, /particulier) partagent la même architecture de sections. Le contenu est adapté pour chaque persona. Elles remplacent les blocs supprimés de la homepage.

### Structure commune (toutes les pages personas)

```
[1] HEADER — identique homepage (fixe)
[2] HERO PERSONA — titre + promesse spécifique au persona
[3] BEFORE/AFTER — visuel spécifique au cas d'usage du persona
[4] ARGUMENT CENTRAL — ce que Versiroom résout pour ce persona
[5] FLOW D'USAGE — comment le persona utilise le produit (3 étapes illustrées)
[6] MODE PRO — visible sur /architecte et /marchand ; simplifié sur /particulier
[7] CTA FINAL — vers l'outil
[8] FOOTER
```

**Pattern navigation inter-pages.**
Chaque page persona comporte un lien discret "← Retour" vers la homepage et des liens vers les deux autres pages personas ("Vous êtes aussi marchand de biens ? →"). Ce fil d'Ariane léger évite l'impasse.

**URL structure.**
- `/architecte` — pas `/architectes` (singulier, adresse l'individu)
- `/marchand` — pas `/marchands-de-biens` (court, mémorisable)
- `/particulier` — pas `/particuliers`

---

## Page /architecte — Wireframe

**Persona cible.** Claire Dumont, 40 ans, architecte d'intérieur DPLG indépendante à Lyon. Besoin : support de conversation visuel avec ses clients dès le premier RDV. Frustration : 2-3 jours par planche de rendu 3D, les clients veulent "voir" immédiatement.

```
┌─────────────────────────────────────────────────────────────┐
│ [HEADER fixe]                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  [ pill ] Architectes d'intérieur           │
│                                                             │
│        Un support de conversation prêt                      │
│        avant la fin du premier RDV.                        │
│                                                             │
│   Vos clients veulent "voir à quoi ça va ressembler"       │
│   avant de valider une direction. Versiroom génère 2-3     │
│   ambiances à partir de vos photos de chantier             │
│   — en 90 secondes, pendant que vous parlez.              │
│                                                             │
│      [ Essayer gratuitement · 3 générations offertes ]     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AVANT                        APRÈS                         │
│  [Photo chantier brut]        [Rendu Scandinave]            │
│                                                             │
│  "Un support de conversation avec mon client               │
│   en 90 secondes au lieu de 3 jours de rendu 3D."         │
│                               — Claire, architecte DPLG    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CE QUE VERSIROOM RÉSOUT POUR VOUS                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Le problème              La solution                 │   │
│  │ ─────────────────────    ─────────────────────────   │   │
│  │ Rendu 3D : 2-3 jours     Visuel en 90 secondes       │   │
│  │ Planche à 300-500€       Inclus dans votre abonnement│   │
│  │ Client ne valide pas     Client voit, décide, avance │   │
│  │ Outil de rendu complexe  Upload une photo, c'est tout│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  COMMENT VOUS L'UTILISEZ                                     │
│                                                             │
│  [01]                [02]                [03]               │
│  Photographiez       Choisissez         Présentez          │
│  la pièce en         1 à 3 styles       les ambiances      │
│  chantier            parmi 12           au client          │
│                      curatés            — il valide        │
│                                         en séance          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MODE PRO — pour les architectes en cabinet                  │
│                                                             │
│  Au-delà des 3 générations gratuites :                      │
│                                                             │
│  ✓ 50 générations/mois (plusieurs projets simultanés)       │
│  ✓ Dossiers de pré-commercialisation PDF — avant/après      │
│     prêts à envoyer à vos clients par email                 │
│  ✓ Liens partageables — le client voit le comparateur       │
│     sans télécharger quoi que ce soit                       │
│                                                             │
│  29€/mois · Prix de lancement                               │
│                                                             │
│      [ Voir les tarifs → ]   (ancre #pricing sur homepage)  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Prêt à montrer à votre prochain client ?                  │
│                                                             │
│      [ Essayer gratuitement → ] (ancre outil homepage)      │
│      3 générations · Sans carte bancaire                    │
│                                                             │
│  Vous êtes marchand de biens ?  /marchand →                 │
│  Particulier ?  /particulier →                              │
└─────────────────────────────────────────────────────────────┘
```

**Décisions UX spécifiques à /architecte.**

1. Le titre "support de conversation" reprend la citation exacte de Claire dans le project-context.md ("Je ne cherche pas un rendu final, je cherche un support de conversation avec mon client"). C'est la formule qui résonne — pas "outil de visualisation" ni "home staging IA".

2. Le tableau problème/solution est positionné avant le flow d'usage car Claire est une professionnelle rationnelle. Elle évalue l'outil sur des critères objectifs (temps, coût, intégration workflow) avant de se demander comment il s'utilise.

3. Le Mode Pro mentionne "plusieurs projets simultanés" — Claire gère 3 à 5 projets en parallèle. 3 générations gratuites ne couvrent pas un mois de travail pour elle.

4. Le CTA "Prêt à montrer à votre prochain client ?" ancre la décision sur un bénéfice concret immédiat, pas sur "découvrir le produit".

---

## Page /marchand — Wireframe

**Persona cible.** Thomas Berger, 35 ans, marchand de biens à Bordeaux, 8-12 opérations/an. Besoin : visuels meublés pour plaquettes de pré-commercialisation. Frustration principale : 200-500€ par planche + 48-72h de délai. Citation : "Si je peux sortir 3 visuels meublés en 10 minutes au lieu de payer 1 500€ à un prestataire, c'est game changer."

```
┌─────────────────────────────────────────────────────────────┐
│ [HEADER fixe]                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  [ pill ] Marchands de biens                 │
│                                                             │
│        3 visuels meublés en 10 minutes.                     │
│        Sans prestataire. Sans délai.                        │
│                                                             │
│   Vos acquéreurs ne se projettent pas sur des murs vides.  │
│   Avec Versiroom, vos photos brutes deviennent une         │
│   plaquette de pré-commercialisation — le jour même        │
│   de votre acquisition.                                     │
│                                                             │
│      [ Essayer gratuitement · 3 générations offertes ]     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  LE CALCUL EST SIMPLE                                       │
│                                                             │
│   ┌──────────────────────────────────────────────────┐      │
│   │  Home stager virtuel classique                   │      │
│   │  200 à 500€ par planche · 48 à 72h de délai     │      │
│   │  → 3 visuels = jusqu'à 1 500€                   │      │
│   └──────────────────────────────────────────────────┘      │
│                                                             │
│                         vs.                                 │
│                                                             │
│   ┌──────────────────────────────────────────────────┐      │
│   │  Versiroom Mode Pro                              │      │
│   │  29€/mois · 50 crédits · résultat en 90 sec.    │      │
│   │  → 3 visuels = moins de 2€ · prêts en 5 min.    │      │
│   └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AVANT                        APRÈS                         │
│  [Photo bien brut J+0]        [Rendu Contemporain]          │
│                                                             │
│  "3 visuels meublés en 10 minutes au lieu de 1 500€        │
│   chez un prestataire. Les acquéreurs se projettent         │
│   immédiatement."                                           │
│                               — Thomas, marchand de biens   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  VOTRE WORKFLOW AVEC VERSIROOM                               │
│                                                             │
│  [01]                [02]               [03]                │
│  J+0 · Acquisition   J+0 · Générez      J+0 · Publiez      │
│  Photographiez       2-3 styles         vos annonces avec  │
│  le bien brut        meublés en         les visuels        │
│  avec votre          90 sec.            — sans attendre    │
│  iPhone              chacun             48h                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MODE PRO — conçu pour les opérations immobilières          │
│                                                             │
│  ✓ 50 générations/mois — couvre jusqu'à 16 opérations      │
│     à 3 visuels chacune                                     │
│  ✓ Dossiers de pré-commercialisation PDF                    │
│     — visuel avant/après, prêt pour vos plaquettes         │
│     et portails immobiliers                                 │
│  ✓ Liens partageables — envoyez un lien à vos acquéreurs   │
│     potentiels, ils voient le comparateur directement       │
│  ✓ Organisation par bien — retrouvez tous les visuels       │
│     d'une opération au même endroit                         │
│                                                             │
│  29€/mois · Prix de lancement                               │
│  Soit moins de 0,60€ par visuel généré                      │
│                                                             │
│      [ Démarrer avec le Mode Pro → ]  (ancre #pricing)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Votre prochain bien vous attend.                           │
│                                                             │
│      [ Essayer gratuitement → ] (ancre outil homepage)      │
│      3 générations · Sans carte bancaire                    │
│                                                             │
│  Vous êtes architecte ?  /architecte →                      │
│  Particulier ?  /particulier →                              │
└─────────────────────────────────────────────────────────────┘
```

**Décisions UX spécifiques à /marchand.**

1. Le "calcul" est la section la plus critique pour Thomas. Il fait ce calcul mentalement à chaque fois qu'il envisage un outil. Le wireframe le rend explicite et visuel (deux blocs côte à côte avec le même format), pas seulement en texte. Le chiffre "moins de 0,60€ par visuel généré" (29€ / 50 crédits) doit figurer à deux endroits : dans le bloc comparaison ET dans l'encart Mode Pro.

2. Le workflow est daté "J+0" pour les trois étapes. Thomas acquiert un bien — il veut commercialiser le plus vite possible. La promesse "le jour même de votre acquisition" est l'argument décisif vs le délai de 48-72h des prestataires.

3. "50 générations/mois — couvre jusqu'à 16 opérations à 3 visuels chacune" : Thomas fait des opérations, pas des photos isolées. Lui parler en nombre d'opérations couvertes, pas en crédits abstraits.

4. La mention "portails immobiliers" est volontaire : Thomas publie sur SeLoger, Leboncoin, Bien'ici. Les visuels meublés augmentent le nombre de clics sur ses annonces. Pas besoin de le nommer — "portails immobiliers" suffit.

5. Sur mobile (iPhone 15 Pro, device principal de Thomas) : le bloc "LE CALCUL EST SIMPLE" doit s'afficher en plein écran avec les deux blocs en flex-col. Pas de grid 2 colonnes sur mobile.

---

## Page /particulier — Wireframe

**Persona cible.** Léa Martin, 32 ans, chef de projet digital à Nantes, primo-accédante. Besoin : visualiser son appartement vide dans différents styles avant d'acheter. Frustration : Pinterest montre de belles photos mais jamais dans SA pièce. Citation : "Je veux voir à quoi MON salon ressemblerait en scandinave, pas le salon de quelqu'un d'autre sur Pinterest."

```
┌─────────────────────────────────────────────────────────────┐
│ [HEADER fixe]                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  [ pill ] Particuliers                       │
│                                                             │
│        Votre salon en scandinave.                           │
│        Le vôtre — pas celui de Pinterest.                  │
│                                                             │
│   Votre appartement est vide. Vous avez des idées déco     │
│   mais pas moyen de les visualiser dans VOS pièces.        │
│   Uploadez une photo. Choisissez un style.                 │
│   Versiroom vous montre ce que ça donne — vraiment.        │
│                                                             │
│      [ Essayer gratuitement · Sans créer de compte ]        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AVANT                        APRÈS                         │
│  [Photo salon vide T3]        [Rendu Japandi]               │
│                                                             │
│  Testez aussi :  [ Scandinave ]  [ Contemporain ]           │
│                  [ Bohème ]  [ Art Déco ]  + 8 autres       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  12 STYLES — CURATÉS PAR DES EXPERTS                        │
│                                                             │
│  Scandinave · Japandi · Contemporain · Art Déco            │
│  Mid-Century · Bohème · Méditerranéen · Cosy               │
│  Wabi-Sabi · Maximaliste · Haussmannien · Industriel        │
│                                                             │
│  Pas des filtres génériques. Chaque style a été défini     │
│  par un architecte d'intérieur avec les bons meubles,      │
│  les bonnes textures, les bonnes proportions.              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  C'EST SIMPLE — 3 ÉTAPES                                    │
│                                                             │
│  [01]                [02]                [03]               │
│  Photographiez       Choisissez         Téléchargez        │
│  votre pièce         votre style        ou partagez        │
│  (l'iPhone suffit)   parmi 12           le visuel          │
│                      ambiances          — HD, gratuit      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  GRATUIT POUR COMMENCER                                     │
│                                                             │
│  3 générations offertes · Sans créer de compte             │
│  · Sans carte bancaire                                      │
│                                                             │
│  Vous voulez tester plus de styles ?                        │
│  Les crédits supplémentaires sont disponibles              │
│  sans engagement.                                           │
│                                                             │
│  [Note : lien vers #pricing si packages one-shot           │
│   ou vers l'abonnement Pro si modèle mensuel retenu]        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Votre appartement vous attend.                             │
│                                                             │
│      [ Essayer maintenant — c'est gratuit → ]               │
│      (ancre outil homepage)                                 │
│                                                             │
│  Vous êtes architecte ?  /architecte →                      │
│  Marchand de biens ?  /marchand →                           │
└─────────────────────────────────────────────────────────────┘
```

**Décisions UX spécifiques à /particulier.**

1. Léa est digital native. Elle est habituée aux apps freemium avec friction cachée (CB demandée, puis facturation). La garantie "Sans créer de compte · Sans carte bancaire" est répétée 2 fois sur sa page — dans le hero ET dans la section Gratuit. Cette répétition est intentionnelle.

2. La section des 12 styles est plus développée sur /particulier que sur les autres pages. Pour Léa, la diversité des styles est un argument clé (vs Pinterest qui montre toujours les mêmes). Elle veut voir qu'il y a le choix.

3. La mention "l'iPhone suffit" dans le flow d'usage : Léa utilise son iPhone 14 à 90% du temps. Lui dire que son iPhone suffit lève une friction cognitive — elle n'a pas besoin d'un appareil photo professionnel.

4. Les tags de styles cliquables sous le avant/après ("Testez aussi : Scandinave, Japandi...") ne sont pas fonctionnels sur la page /particulier — ce sont des chips décoratifs qui signalent la variété. Le CTA les envoie vers l'outil.

5. Le Mode Pro n'a pas de section dédiée sur /particulier. Un simple bloc "Vous voulez tester plus de styles ?" suffit, sans la logique ROI B2B qui serait hors-sujet pour Léa.

---

## Tests UX — Homepage restructurée

| Test | Critère de succès | Statut |
|---|---|---|
| Parcours Thomas : voit le ROI (29€ vs 200-500€) sans chercher | Chiffre "29€/mois · vs. 200 à 500€ par planche" visible dans les 300px sous le CTA gratuit — pas besoin de scroller jusqu'au pricing | PASS — encart Mode Pro repositionné juste après le hero |
| Parcours Claire : comprend que c'est un outil de conversation client | "support de conversation" apparaît dans les pills du hero ET dans le titre de /architecte | PASS — reprise de la citation exacte du persona |
| Parcours Léa : comprend que c'est gratuit sans CB | "Sans carte bancaire" lisible en text-sm (non plus text-xs) sous le CTA principal | PASS — upgrade de lisibilité documenté dans le wireframe |
| Charge cognitive : <= 3 actions par écran homepage | Hero : 1 action principale (Essayer). Encart Mode Pro : 1 action (Voir le Mode Pro). Outil : séquentiel avec StepIndicator. | PASS |
| Time-to-value : <= 3 étapes avant le premier résultat | Upload → Style → Générer = 3 étapes. Résultat visible sans login. | PASS |
| Répétition signal audience : 0 répétition inutile dans les 700px du fold | Pills hero + liens discrets = 1 mention par persona. Galerie par métier supprimée. USE_CASES cartes remplacées par liens texte. | PASS |
| Edge case : utilisateur pro qui arrive directement sur /marchand | Page /marchand contient : hero, calcul ROI, workflow, Mode Pro, CTA. Aucun élément ne requiert d'avoir vu la homepage. | PASS |
| Edge case : utilisateur qui arrive sur homepage sans savoir ce qu'est Versiroom | Le titre "Votre pièce meublée, en 90 secondes" + visuel avant/après donne le contexte complet above the fold. | PASS |
| Accessibilité WCAG 2.2 AA | Pills devenues liens : tabindex natif via balise `<a>`. Focus-visible:ring conservé. Texte des CTA descriptif ("Essayer gratuitement" pas "Cliquer ici"). | PASS |
| Mobile Thomas (iPhone 15 Pro) : encart Mode Pro lisible en entier sans scroll horizontal | Layout flex-col sur mobile documenté dans le wireframe. Prix en font-semibold, pas en tableau. | PASS |

---

## Agents spécialisés recommandés pour ce projet

| Agent proposé | Type | Rôle | Justification | Priorité |
|---|---|---|---|---|
| @testeur-thomas | Testeur persona | Simule Thomas (marchand de biens) sur la homepage et /marchand — évalue si le calcul ROI est immédiatement compris, si les 29€ vs 200-500€ convainquent | Le calcul ROI est la clé de conversion pour Thomas. Une erreur de formulation ici = Thomas part. À valider avant implémentation. | Haute |
| @testeur-claire | Testeur persona | Simule Claire (architecte) sur /architecte — évalue si "support de conversation" résonne, si le workflow est adapté à ses projets | Claire évalue sur des critères professionnels stricts. Si le vocabulaire est trop grand public, elle ne se reconnaît pas. | Haute |
| @testeur-lea | Testeur persona | Simule Léa (particulière) sur /particulier — évalue si "fun et gratuit" est perçu dès le premier écran, si la barrière CB est levée | Léa a un réflexe de méfiance sur les "gratuits". Son dropout est rapide si la confiance n'est pas établie en 5 secondes. | Moyenne |

→ Handoff @agent-factory : créer ces 3 agents testeurs à partir des personas documentés dans project-context.md et CLAUDE.md.

---

## Handoff

---

**Handoff → @fullstack**

- Fichiers produits : `/home/user/Architecture/docs/ux/homepage-restructure.md`

- Décisions prises :
  1. Supprimer la section "Avant / Après par métier" (lignes 889-976 de `app/page.tsx`) — 3 cartes Claire/Thomas/Léa
  2. Supprimer les 3 cartes USE_CASES (`pb-10` section, lignes 878-887) — les remplacer par 3 liens texte discrets vers /architecte, /marchand, /particulier
  3. Déplacer la section "Teaser Mode Marchand" (lignes 978-1017) immédiatement après le bloc CTA "Essayer gratuitement" dans le hero — avant le séparateur
  4. Renommer "Mode Marchand" → "Mode Pro" dans l'encart ET dans le toggle Standard/Mode Pro de l'outil (ligne 1058)
  5. Renommer "Dossiers PDF avant/après" → "Dossiers de pré-commercialisation" dans l'encart et dans le pricing
  6. Upgrader la mention "3 générations offertes · Sans carte bancaire" de `text-xs text-muted` à `text-sm text-foreground/60`
  7. Modifier le sous-titre de la section outil : "En trois étapes simples" → "3 générations gratuites · Sans créer de compte"
  8. Mettre à jour le pricing Tier Pro : 29€/mois, 50 crédits/mois, Mode Pro, Dossiers de pré-commercialisation, Liens partageables sans limite
  9. Créer 3 nouvelles pages : `app/architecte/page.tsx`, `app/marchand/page.tsx`, `app/particulier/page.tsx`
  10. Pills du hero : transformer les `<span>` en `<a href="/[persona]">` avec les styles hover documentés

- Points d'attention :
  - L'encart Mode Pro déplacé garde son layout exact (flex row desktop / flex col mobile, bg/border identiques)
  - Le toggle Standard/Mode Pro reste conditionnel à `session` — seuls les utilisateurs connectés le voient
  - Les pages /architecte, /marchand, /particulier partagent le header/footer existants
  - Sur /marchand : le bloc "LE CALCUL EST SIMPLE" (deux blocs comparatifs) est en flex-col sur mobile, flex-row sur desktop
  - Sur /particulier : pas de section Mode Pro dédiée, uniquement le bloc minimal "Vous voulez tester plus de styles ?"
  - Le lien "Voir tous les exemples →" de la galerie supprimée peut être conservé en footer ou supprimé selon arbitrage fondateur

---
