# Homepage — Redesign des encarts personas
> Produit par @creative-strategy — 2026-03-28
> Références : `project-context.md`, `docs/copy/brand-voice.md`, `app/page.tsx` (lignes 857-868)

---

## 1. Diagnostic — État actuel

### Ce qui existe

Les 3 liens personas sont actuellement 3 lignes de texte `text-xs text-muted` dans un flex-row sous le CTA principal du Hero, sans encart, sans séparation visuelle, sans hiérarchie propre :

```
Vous êtes architecte ? Voir les cas d'usage →
Marchand de biens ? Voir le Mode Pro →
Particulier ? Commencer gratuitement →
```

**Classes actuelles :** `text-xs text-muted hover:text-sage transition-colors`

### Problèmes identifiés

**Visibilité quasi nulle.** Ces liens sont placés après 3 éléments qui captent toute l'attention visuelle : le titre H1, les visuels avant/après, et le CTA principal noir. Visuellement, l'oeil descend vers le CTA, puis considère le texte grisé en dessous comme de la mention légale ou du sous-titre secondaire — pas comme un appel à l'action.

**Hiérarchie contradictoire.** `text-xs` (12px) et `text-muted` (couleur atténuée) = le niveau de visibilité le plus bas possible. Sur une homepage, les liens qui redirigent vers des landing pages monétisées méritent mieux que la même taille et la même couleur qu'une note de bas de page.

**Friction de compréhension.** "Vous êtes architecte ? Voir les cas d'usage →" pose une question puis donne une destination floue ("cas d'usage"). Ce n'est pas une promesse de valeur — c'est une invitation à en savoir plus sur quelque chose d'inconnu. Pour Thomas (marchand, mobile), en 30 secondes c'est transparent.

**Pas d'ancrage visuel.** Les 3 liens n'ont aucune frontière, aucun fond, aucune icône, rien qui les distingue du flux de texte. Sur mobile, ils s'empilent en colonne et ressemblent à des mentions de footer.

**Position dans la page.** Ils sont dans le Hero, ce qui est stratégiquement correct. Mais le manque de traitement visuel les rend invisibles dans ce contexte saturé (grand titre + visuels + CTA + social proof).

---

## 2. Options de redesign

### Option A — Encarts compacts "3 profils" (recommandée)

**Concept.** Trois cartes horizontales compactes, fond légèrement différencié du background, avec une icône simple, un titre persona et une promesse de valeur en une ligne. Niveau d'intégration : intégré à la fin du Hero, section distincte mais pas séparée.

**Niveau de visibilité : Équilibré.** Plus visible que les liens texte, moins dominant que le CTA.

**Mock textuel :**

```
┌─────────────────────────────────────────────────────────────┐
│  ↗ Architectes d'intérieur                                  │
│  Un support de conversation prêt avant chaque premier RDV.  │
│  Voir les cas d'usage →                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ↗ Marchands de biens                                       │
│  Des plaquettes de pré-commercialisation sans prestataire.  │
│  Voir le Mode Pro →                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ↗ Particuliers                                             │
│  Votre pièce dans le style que vous choisissez.             │
│  Commencer gratuitement →                                   │
└─────────────────────────────────────────────────────────────┘
```

**Layout :**
- Mobile : 3 cartes empilées verticalement, full width
- Desktop : 3 cartes en row, largeur égale, max-w-3xl centré
- Fond : `bg-foreground/[0.03]` (légèrement détaché du background #FAFAF8)
- Bordure : `border border-foreground/8`
- Border-radius : `rounded-xl`
- Padding : `px-5 py-4`
- Pas d'image, pas de galerie

**Typographie :**
- Titre persona : `text-sm font-medium text-foreground`
- Promesse : `text-xs text-muted font-light leading-snug`
- Lien : `text-xs text-sage font-medium` avec flèche inline

**Justification stratégique.** Ce format emprunte au pattern des "testimonials sans témoignage" — chaque carte est une promesse de valeur ciblée, pas un lien générique. Le fond légèrement différencié crée une unité visuelle sans alourdir. L'architecture à 3 colonnes desktop signale visuellement "ce produit est fait pour 3 types de personnes différentes" — ce qui est exactement le message. Claire identifie immédiatement sa case. Thomas aussi.

---

### Option B — Section dédiée entre outil et pricing

**Concept.** Déplacer les 3 personas hors du Hero et en faire une section pleine largeur entre l'outil et la section pricing. Format "3 colonnes éditoriales" avec titre section, titre persona, promesse courte, et lien CTA.

**Niveau de visibilité : Dominant.** Section à part entière, pas un sous-élément du Hero.

**Mock textuel :**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Versimo s'adapte à votre métier

  ARCHITECTES D'INTÉRIEUR    MARCHANDS DE BIENS         PARTICULIERS
  ────────────────────        ─────────────────          ────────────

  Générez 2-3 ambiances        Des visuels plaquette      Votre salon en
  pour valider une direction   prêts en 10 minutes,       scandinave — ou
  esthétique avec votre        sans passer par un         dans n'importe
  client dès le premier RDV.   home stager.               quel style parmi 12.

  Voir les cas d'usage →       Voir le Mode Pro →         Commencer →

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Justification stratégique.** Placer cette section entre l'outil et le pricing crée un "moment de réassurance" : l'utilisateur a vu comment ça marche, maintenant on lui confirme que c'est fait pour lui avant de lui présenter les tarifs. Conversion funnel logique. Risque : allonge la page, dilue le focus. Le fondateur a dit "trop gros" pour l'ancien encart — cette option va dans le sens contraire.

---

### Option C — Liens enrichis dans le Hero (upgrade minimal)

**Concept.** Garder les liens à leur position actuelle mais améliorer le traitement visuel : augmenter la taille, ajouter un fond par lien, et réécrire le texte avec une promesse directe au lieu d'une question.

**Niveau de visibilité : Discret amélioré.** Plus visible que l'état actuel, moins structurant que l'Option A.

**Mock textuel :**

```
  [ Architecte → Support de conversation dès le 1er RDV ]
  [ Marchand   → Plaquettes sans prestataire ni délai    ]
  [ Particulier → 3 générations gratuites, sans compte   ]
```

**Layout :**
- 3 pills/tags horizontaux (flex-row, gap-3, flex-wrap)
- Fond : `bg-foreground/[0.05]` sur chaque pill
- Border-radius : `rounded-full`
- Padding : `px-4 py-2`
- Taille texte : `text-xs` → `text-[13px]`
- Couleur : `text-foreground/70` (plus visible que `text-muted`)
- Hover : `hover:bg-foreground/10 hover:text-foreground`

**Justification stratégique.** Intervention chirurgicale, 0 risque de "trop". Mais l'impact reste limité : des pills horizontaux dans le Hero sont encore facilement ignorés face au CTA dominant. Cette option résout le problème de lisibilité mais pas celui d'impact.

---

## 3. Recommandation

**Option A recommandée.**

Raisons :

1. **Elle est dans le Hero.** La position actuelle est stratégiquement correcte — le Hero est le bon endroit pour segmenter la cible. Il ne faut pas déplacer ces liens, il faut les habiller.

2. **Elle respecte le brief "compact mais VISIBLE".** Les cartes `bg-foreground/[0.03]` avec `border border-foreground/8` sont perceptibles sans claquer. C'est l'esthétique des cards de Notion, Linear, Vercel — sobre, professionnel, reconnaissable.

3. **Elle est cohérente avec les cards pricing.** La section pricing utilise déjà ce pattern (border, rounded-2xl, bg-background). Appliquer le même traitement aux personas crée de la cohérence visuelle dans la page.

4. **Elle force la réécriture des promesses.** Les textes actuels ("Voir les cas d'usage") n'ont pas de valeur. L'Option A impose d'écrire une promesse de valeur par persona — ce qui rend le lien cliquable pour les bonnes raisons.

5. **Elle résout le problème mobile.** Sur mobile, les 3 cartes empilées sont lisibles et bien séparées. Les liens texte actuels empilés ne se distinguent pas du reste du texte.

**L'Option B est écartée** parce qu'elle crée une section dédiée que le fondateur a explicitement déconseillée avec l'ancien encart Mode Pro. "Trop gros."

**L'Option C est conservée en fallback** si le fondateur juge l'Option A encore trop présente dans le Hero.

---

## 4. Textes recommandés pour les 3 cartes

Ces textes respectent le ton brand-voice.md : précis, sobre, promesse directe sans superlatifs.

**Architectes d'intérieur**
- Titre : `Architectes d'intérieur`
- Corps : Un support de conversation prêt avant le premier RDV — sans attendre 3 jours un rendu.
- CTA : `Voir les cas d'usage →` → `/architecte`

**Marchands de biens**
- Titre : `Marchands de biens`
- Corps : Des visuels de pré-commercialisation en 10 minutes, sans home stager ni délai.
- CTA : `Voir le Mode Pro →` → `/marchand`

**Particuliers**
- Titre : `Particuliers`
- Corps : Votre pièce dans le style que vous choisissez — pas le salon de quelqu'un d'autre.
- CTA : `Commencer gratuitement →` → `/particulier`

---

## 5. Spécifications @fullstack

### Localisation dans page.tsx

Remplacer le bloc existant **lignes 857-868** (section `{/* Persona links — discret, sous le CTA */}`) par le code ci-dessous.

### Code à implémenter (Option A)

```tsx
{/* Persona cards — 3 profils */}
<div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">

  {/* Architectes */}
  <a
    href="/architecte"
    className="group flex flex-col gap-1.5 bg-foreground/[0.03] border border-foreground/8 rounded-xl px-5 py-4 hover:bg-foreground/[0.06] hover:border-foreground/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
  >
    <p className="text-sm font-medium text-foreground leading-snug">
      Architectes d&apos;intérieur
    </p>
    <p className="text-xs text-muted font-light leading-relaxed">
      Un support de conversation prêt avant le premier RDV — sans attendre 3 jours un rendu.
    </p>
    <span className="text-xs text-sage font-medium mt-1 group-hover:translate-x-0.5 transition-transform duration-200 inline-block">
      Voir les cas d&apos;usage →
    </span>
  </a>

  {/* Marchands de biens */}
  <a
    href="/marchand"
    className="group flex flex-col gap-1.5 bg-foreground/[0.03] border border-foreground/8 rounded-xl px-5 py-4 hover:bg-foreground/[0.06] hover:border-foreground/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
  >
    <p className="text-sm font-medium text-foreground leading-snug">
      Marchands de biens
    </p>
    <p className="text-xs text-muted font-light leading-relaxed">
      Des visuels de pré-commercialisation en 10 minutes, sans home stager ni délai.
    </p>
    <span className="text-xs text-sage font-medium mt-1 group-hover:translate-x-0.5 transition-transform duration-200 inline-block">
      Voir le Mode Pro →
    </span>
  </a>

  {/* Particuliers */}
  <a
    href="/particulier"
    className="group flex flex-col gap-1.5 bg-foreground/[0.03] border border-foreground/8 rounded-xl px-5 py-4 hover:bg-foreground/[0.06] hover:border-foreground/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
  >
    <p className="text-sm font-medium text-foreground leading-snug">
      Particuliers
    </p>
    <p className="text-xs text-muted font-light leading-relaxed">
      Votre pièce dans le style que vous choisissez — pas le salon de quelqu&apos;un d&apos;autre.
    </p>
    <span className="text-xs text-sage font-medium mt-1 group-hover:translate-x-0.5 transition-transform duration-200 inline-block">
      Commencer gratuitement →
    </span>
  </a>

</div>
```

### Suppression du bloc actuel

Supprimer les lignes 857-868 de `app/page.tsx` dans leur intégralité :

```tsx
{/* Persona links — discret, sous le CTA */}
<div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-6 items-center justify-center">
  <a href="/architecte" className="text-xs text-muted hover:text-sage transition-colors">
    Vous êtes architecte ? Voir les cas d&apos;usage →
  </a>
  <a href="/marchand" className="text-xs text-muted hover:text-sage transition-colors">
    Marchand de biens ? Voir le Mode Pro →
  </a>
  <a href="/particulier" className="text-xs text-muted hover:text-sage transition-colors">
    Particulier ? Commencer gratuitement →
  </a>
</div>
```

### Comportement attendu

- **Desktop (sm: ≥640px)** : 3 cartes en row, largeur égale, max-w-3xl centré dans le Hero
- **Mobile (<640px)** : 3 cartes empilées, full width
- **Hover** : fond légèrement plus prononcé + bordure plus visible + flèche translate-x-0.5 (micro-animation sobre)
- **Focus-visible** : ring sage pour accessibilité clavier
- **Liens** : `/architecte`, `/marchand`, `/particulier` — pas de modification des URLs

### Note de positionnement dans le Hero

Le bloc s'insère après la ligne `<p className="text-sm text-foreground/60...">` (mention des 3 générations offertes, ligne ~854). La fermeture `</div>` et `</section>` restent en place.

---

## 6. Fallback — Option C (si le fondateur juge l'Option A trop présente)

Remplacer uniquement le bloc `{/* Persona links */}` par :

```tsx
{/* Persona links — enrichis */}
<div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-2 items-center justify-center">
  <a
    href="/architecte"
    className="text-[13px] text-foreground/70 bg-foreground/[0.05] hover:bg-foreground/10 hover:text-foreground px-4 py-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
  >
    Architecte → Support de conversation dès le 1er RDV
  </a>
  <a
    href="/marchand"
    className="text-[13px] text-foreground/70 bg-foreground/[0.05] hover:bg-foreground/10 hover:text-foreground px-4 py-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
  >
    Marchand → Plaquettes sans prestataire ni délai
  </a>
  <a
    href="/particulier"
    className="text-[13px] text-foreground/70 bg-foreground/[0.05] hover:bg-foreground/10 hover:text-foreground px-4 py-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
  >
    Particulier → 3 générations gratuites, sans compte
  </a>
</div>
```

---

## Auto-évaluation

- Position dans page : Hero, après CTA — correct, pas de déplacement
- Tone : promesses directes, pas de questions, pas de superlatifs — conforme brand-voice.md
- Mobile-first : grid-cols-1 par défaut, sm:grid-cols-3 — conforme
- Aucune donnée inventée : pas de "500+ utilisateurs" ni de chiffres non sourcés
- Données chiffrées : "3 jours" et "10 minutes" viennent des personas Claire et Thomas dans project-context.md
- Redirection : /architecte, /marchand, /particulier — existants dans la nav

---

**Handoff → @fullstack**
- Fichier produit : `docs/strategy/homepage-personas-redesign.md`
- Action : remplacer les lignes 857-868 de `app/page.tsx` par le bloc "Option A" (section 5)
- Décisions prises : Option A retenue (cartes compactes avec promesse de valeur), Option C en fallback si retour fondateur
- Points d'attention : les URLs `/architecte`, `/marchand`, `/particulier` doivent exister — vérifier que les routes sont actives avant déploiement. Si une route manque, pointer vers `#outil` en attendant.

**Handoff → @marchand-de-biens (Thomas)**
- Lire la section "Marchands de biens" (Option A, texte recommandé)
- Valider : la promesse "Des visuels de pré-commercialisation en 10 minutes, sans home stager ni délai" est-elle assez directe pour déclencher un clic en situation mobile ?
- Valider : le label "Voir le Mode Pro" est-il suffisamment clair sur ce que Thomas va trouver ?
