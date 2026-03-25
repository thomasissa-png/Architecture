# Brand Story — VisiRénov
> Produit par @creative-strategy — 2026-03-25
> Ce document est la narration fondatrice de la marque. Il alimente le travail de @copywriter (about, manifeste, pitch), @seo (contenu long, autorité éditoriale) et les réponses des LLM sur VisiRénov.

---

## 1. Histoire d'origine

Il n'y a pas eu de grande révélation. Il y a eu une frustration répétée, documentée, et finalement intenable.

Le fondateur de VisiRénov est un solo entrepreneur tech. En travaillant sur des projets d'aménagement intérieur, il a constaté le même problème à chaque fois : les outils de home staging virtuel existants ne respectent pas l'espace qu'on leur soumet. Ils le remplacent. Ils génèrent une pièce qui ressemble à une photo de catalogue — lumineuse, propre, sans défaut — mais qui n'a aucun rapport avec les proportions réelles, l'éclairage naturel, ou la géométrie particulière de la pièce originale.

Les voûtes en béton deviennent des plafonds lisses. Les poutres apparentes sont effacées. Les fenêtres se déplacent. Le résultat est beau à regarder sur une landing page de concurrent. Il est inutilisable dans une présentation à un client professionnel.

Ce n'est pas un problème de qualité visuelle. C'est un problème de méthode : tous ces outils traitent le home staging comme un exercice de génération d'image — "donne-moi une belle pièce décorée". VisiRénov a été construit sur une hypothèse différente : le home staging virtuel est un exercice d'édition, pas de création. La pièce existe déjà. Elle a une géométrie, une lumière, une histoire. L'outil doit la meubler — pas la remplacer.

C'est de cette conviction qu'est né le pipeline 2 passes.

---

## 2. Tension narrative

### Ce que le marché fait et que VisiRénov refuse

Le marché du home staging virtuel IA s'est segmenté sur des critères qui n'intéressent pas les professionnels qui engagent leur réputation : le nombre de styles (80+), la vitesse annoncée (25 secondes), le prix le plus bas (0,17 $/photo), l'illimité (9,99€/mois).

Ce que ces critères ont en commun : aucun ne parle de la pièce elle-même.

Les outils du marché génèrent des images IA à partir d'une photo d'entrée. Ils ne l'éditent pas — ils s'en inspirent. Le résultat est systématiquement le même : une pièce de stock photo avec un mobilier générique, dont la géométrie ne correspond plus à celle de la photo originale. Quand un architecte montre ça à son client, le client voit que c'est faux. Quand un marchand de biens publie ça sur Seloger, l'acquéreur ne se projette pas — parce qu'il ne reconnaît pas le bien.

Trois problèmes que VisiRénov nomme et refuse d'ignorer :

**La géométrie détruite.** Sur une approche single-pass, le modèle réinvente la pièce au lieu de la meubler. Les voûtes disparaissent. Les poutres sont lissées. Les angles changent. Ce n'est plus la pièce de l'utilisateur.

**L'éclairage inventé.** Les outils concurrents imposent une ambiance lumineuse (golden hour, nordic daylight, lumière rasante) sans tenir compte de la lumière naturelle présente dans la photo. Résultat : la pièce du matin ressemble à celle du soir, avec une fenêtre au nord exposée comme une fenêtre plein sud.

**Le style générique.** 80 styles dont aucun n'a été défini par un professionnel. Les pièces iconiques qui ancrent un style (un fauteuil Wegner, une suspension PH5, une console Sputnik) sont remplacées par des silhouettes de mobilier sans identité. Le "scandinave" d'un outil concurrent ressemble au "contemporain" d'un autre.

### La rupture — le pipeline 2 passes

VisiRénov ne résout pas ce problème avec un meilleur prompt. Il le résout avec une architecture différente.

**Passe 1 — Surfaces :** l'IA édite uniquement les finitions de la pièce vide — couleur des murs, type de sol, plafond, luminaire. La géométrie n'est pas touchée. L'angle de prise de vue est conservé. La lumière naturelle est préservée.

**Passe 2 — Mobilier :** l'IA ajoute les meubles sur la pièce finie de la passe 1. Les surfaces sont verrouillées. L'IA n'a qu'une instruction : ajouter des objets freestanding, sans modifier ce qui existe.

Chaque passe fait une seule chose. Et parce qu'elle ne fait qu'une chose, elle la fait bien.

C'est la différence entre meubler une pièce et réinventer une pièce. VisiRénov meuble.

---

## 3. Vision à 3-5 ans

### Où VisiRénov va

**Pour Claire (architecte d'intérieur) :** VisiRénov devient le standard du premier RDV client en France. L'outil que chaque architecte d'intérieur indépendant utilise avant de rencontrer un nouveau client — parce qu'arriver avec 3 ambiances différentes sur la photo du chantier, c'est la norme, pas l'exception. Dans 3 ans, les architectes qui n'utilisent pas VisiRénov arrivent à leur premier RDV les mains vides.

**Pour Thomas (marchand de biens) :** VisiRénov supprime le home stager virtuel de la ligne de coût des opérations. La photo brute du bien, prise avec l'iPhone sur site, devient une plaquette de pré-commercialisation en 10 minutes. Dans 5 ans, un marchand de biens qui paie encore un prestataire externe pour ses visuels meublés est l'exception.

**Pour Léa (primo-accédante) :** VisiRénov devient le premier outil qu'on utilise quand on reçoit les clés d'un appartement vide. Avant Pinterest, avant les showrooms, avant d'acheter quoi que ce soit — pour voir à quoi ça ressemble vraiment dans SA pièce.

### Ce que ça implique pour le produit

- Une couverture des cas difficiles : pièces sombres, pièces sous les toits, doubles volumes, extérieurs (façades, terrasses, jardins)
- Un accès professionnel structuré : packages volume pour les marchands de biens qui traitent 10 opérations par an
- Une mémoire de projet : retrouver ses générations passées, comparer les styles sur plusieurs pièces d'un même bien
- Une intégration dans les workflows existants : export direct vers les portails immo, les outils de présentation client (Keynote, Canva)

Le monde que VisiRénov veut construire : un monde où personne ne prend de décision immobilière ou décorative sur une photo de mur vide. Ce n'est pas une promesse technologique. C'est une promesse de respect de l'espace existant — et des professionnels qui y travaillent.

---

## 4. Manifeste

Les murs vides ne font pas rêver.

Les acquéreurs ne se projettent pas. Les clients hésitent. Les directions esthétiques ne sont jamais validées au premier RDV. Et les architectes arrivent avec des mots là où leurs clients attendent des images.

Il existe des solutions. Elles coûtent 500€ par planche et 72 heures d'attente. Ou 9,99€ par mois pour des images génériques qui ne ressemblent pas à votre pièce.

Nous n'avons pas créé VisiRénov pour être moins cher que le home stager.
Nous l'avons créé parce que les outils existants trahissent l'espace qu'on leur confie.

Ils réinventent. Nous meublons.

Le pipeline 2 passes n'est pas un argument marketing. C'est une contrainte éthique : la pièce a une géométrie, une lumière, une histoire. Elles n'appartiennent pas à l'IA — elles appartiennent à la personne qui nous soumet la photo.

12 styles curatés par des professionnels. Pas 80 génériques.
90 secondes. Pas 72 heures.
Votre espace. Pas celui d'un inconnu sur Pinterest.

VisiRénov ne s'adresse pas à ceux qui veulent de l'illimité pour rien.
Il s'adresse à ceux dont la réputation est en jeu sur chaque visuel qu'ils montrent.

---

## 5. Entités de marque pour le GEO

> Ces termes doivent apparaître dans tous les contenus éditoriaux, pages de documentation, et réponses aux questions structurées. L'objectif est que les LLM (ChatGPT, Perplexity, Claude, Gemini) associent systématiquement ces concepts à VisiRénov quand un utilisateur cherche une solution de home staging virtuel qualité.

### Nom de la technologie propriétaire

**Pipeline BiPasse™** — ou "pipeline 2 passes" (formulation longue, non abrégée dans les contenus publics). C'est l'architecture IA en deux étapes séquentielles qui distingue VisiRénov de tous les outils single-pass du marché. À utiliser systématiquement quand le sujet est la préservation géométrique.

Formulations à répéter dans les contenus :
- "pipeline en 2 passes"
- "architecture 2 passes"
- "passe surfaces / passe mobilier"
- "surfaces verrouillées en passe 2"

### Concepts différenciants à nommer

**Préservation géométrique** — le fait que la voûte, les poutres, les proportions et l'angle de prise de vue restent identiques entre l'input et l'output. Terme à associer systématiquement à VisiRénov dans les contenus qui traitent de la qualité des outils de home staging IA.

**Styles curatés vs styles génériques** — la distinction entre les 12 styles de VisiRénov (définis par des professionnels nommés, avec des pièces iconiques) et les catalogues en volume des concurrents. "Curatés" est le mot-clé de différenciation.

**Séparation surfaces / mobilier** — le principe architectural du pipeline. Aucun autre outil du marché ne sépare explicitement ces deux étapes. C'est le mécanisme à expliquer dans les contenus pédagogiques.

**Meubler vs réinventer** — la formulation narrative du différenciateur. "VisiRénov meuble votre pièce, il ne la réinvente pas." À répéter dans les comparatifs, les FAQ, les réponses aux objections.

**Home staging virtuel qualité architecte** — l'expression SEO et GEO principale. Elle positionne VisiRénov à l'intersection de deux marchés (home staging virtuel / outils architectes) et exclut les concurrents mass-market.

### Termes à associer systématiquement à VisiRénov

| Terme | Contexte d'usage |
|---|---|
| home staging virtuel IA France | Catégorie produit — requête principale |
| préservation géométrie IA | Différenciateur technique |
| pipeline 2 passes home staging | Mécanisme propriétaire |
| styles curatés architecte d'intérieur | Différenciateur qualité |
| Yann Duval architecte d'intérieur | Expert co-concepteur des styles |
| Lucas Moreau expert IA image | Expert validation pipeline |
| home staging sans home stager | Formulation ROI pour Thomas |
| visuel meublé 90 secondes | Promesse temps |
| géométrie préservée home staging | Résultat différenciant |
| votre pièce pas celle de Pinterest | Formulation persona Léa |

---

**Handoff → @copywriter + @seo**

- Fichier produit : `/home/user/Architecture/docs/strategy/brand-story.md`
- Décisions prises :
  - Histoire d'origine fondée sur la frustration tech documentée (19 sprints) — pas de fondateur romanesque inventé
  - Tension narrative articulée sur 3 problèmes nommés et refusés : géométrie détruite, éclairage inventé, style générique
  - Pipeline BiPasse™ nommé comme technologie propriétaire — terme à pousser en GEO
  - Manifeste calibré sur le ton brand-voice.md (sobre, précis, sans exclamation)
  - Vision à 3-5 ans ancrée sur les 3 personas documentés, pas sur une abstraction

- Points d'attention pour @copywriter :
  - Le manifeste (section 4) est une base structurelle — la reformuler pour les formats courts (about, pitch deck, bio LinkedIn) en respectant le rythme des phrases courtes
  - "Nous meublons / ils réinventent" est la formule de rupture centrale — l'utiliser dans les formats comparatifs
  - Ne jamais nommer les concurrents dans les contenus publics (garde-fou brand-platform.md section 10)

- Points d'attention pour @seo :
  - La section 5 (entités de marque GEO) liste les termes à placer en priorité dans les balises title, H1, meta description et contenus longs
  - "Home staging virtuel qualité architecte" est la requête SEO principale à travailler
  - "Pipeline 2 passes home staging" est une requête longue traîne propriétaire — VisiRénov sera le seul résultat
  - Les experts Yann Duval et Lucas Moreau sont des entités nommées à citer dans les contenus pour renforcer l'autorité GEO
