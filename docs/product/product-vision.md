# Vision Produit — VisiRénov
> Produit par @product-manager — 2026-03-24
> Ancré sur : brand-platform.md, personas.md, competitive-benchmark.md, project-context.md

---

## 1. Le monde avant VisiRénov

Un marchand de biens vient d'acquérir un appartement à rénover. Les murs sont bruts, le sol est nu. Pour préparer sa plaquette de pré-commercialisation, il a deux options : attendre 48 à 72 heures et payer 1 500€ à un home stager, ou publier des photos de murs vides et perdre des acquéreurs qui ne se projettent pas.

Une architecte d'intérieur reçoit un nouveau client pour un premier RDV. Elle a des idées, une vision stylistique, des années d'expertise. Mais rien à montrer. Elle repart avec une direction à travailler — et revient 3 jours plus tard avec un rendu 3D à 400€ qui est déjà peut-être à côté de ce que le client voulait.

Une primo-accédante reçoit les clés de son premier appartement vide. Elle passe des heures sur Pinterest. Elle voit de beaux salons scandinaves, des chambres japandi, des cuisines contemporaines. Mais jamais dans son appartement, avec sa lumière, ses dimensions, sa géométrie à elle.

Dans les trois cas, le problème est le même : l'espace existant est invisible. Personne ne peut se projeter.

---

## 2. Le monde avec VisiRénov

**Un visuel meublé de qualité architecturale est disponible en 90 secondes, à partir d'une simple photo, pour un coût inférieur à 1€.**

Ce monde se traduit concrètement :

**Pour Claire (architecte d'intérieur)** : chaque premier RDV client commence avec des visuels dans les mains. La direction esthétique est validée avant que le chantier commence. Les itérations "ajoute un fauteuil en coin lecture" se font en 30 secondes depuis l'iPad. Le client voit SA pièce, pas un salon générique sorti d'un catalogue.

**Pour Thomas (marchand de biens)** : le dossier de pré-commercialisation est prêt le soir même de l'acquisition. 10 photos d'un appartement brut deviennent 10 visuels meublés en une session de travail. Le coût d'un bien complet passe de 1 500€ à moins de 30€. Les acquéreurs se projettent dès la première annonce. Les délais de vente raccourcissent.

**Pour Léa (particulière)** : son salon scandinave existe avant même l'achat du premier meuble. Elle partage la simulation avec son partenaire pour aligner leurs goûts. Elle arrive en magasin avec une idée précise. Elle ne regrette pas son canapé.

---

## 3. Ce qui rend ce monde possible — et unique

Deux raisons techniques expliquent pourquoi VisiRénov produit ce que les autres ne peuvent pas :

**Le pipeline 2 passes** : la passe 1 finit les surfaces (murs, sol, plafond, luminaire) sans toucher à la géométrie. La passe 2 ajoute le mobilier sur des surfaces verrouillées. C'est la seule approche sur le marché qui respecte la voûte d'un Haussmannien, la poutre d'un industriel, la hauteur sous plafond d'un loft — parce qu'elle ne réinvente jamais la pièce, elle la meuble.

**Les 12 styles curatés par des experts nommés** : chaque style a un surfacePrompt et un furniturePrompt distincts, co-construits avec un architecte d'intérieur (Yann Duval, 20 ans d'expérience) et un expert IA image (Lucas Moreau, ex-Midjourney / Getty AI Lab). Pas de style générique. Pas de canapé arc noir dans tous les résultats. Des pièces iconiques (PH5, Wegner, AJ-style) qui ancrent l'identité stylistique immédiatement.

---

## 4. La vision à 12 mois

**VisiRénov est devenu le standard de qualité du home staging virtuel en France.**

Ce n'est pas l'outil le moins cher, ni le plus rapide, ni celui avec le plus de styles. C'est l'outil que les professionnels recommandent parce qu'il respecte leur espace et leur réputation.

À 12 mois :
- 500+ utilisateurs actifs payants, MRR 5 000€
- Le Mode Marchand (F4) permet à Thomas de générer des dossiers de pré-commercialisation complets en une session — une fonctionnalité sans équivalent sur le marché
- Le Mode Décorateur (F5) permet à Léa et Claire de trouver les vrais produits qui correspondent aux visuels générés, avec des liens directs vers IKEA, Leroy Merlin, Maisons du Monde
- Le système Auth + Crédits + Stripe est en place : chaque génération est monétisée, chaque package est traçable, chaque persona est servi par un tier adapté à son usage

---

## 5. Ce que la vision refuse

La vision VisiRénov exclut explicitement les compromis suivants :

- **L'illimité à bas prix** : 9,99€/mois illimité (Renovate Club) est un terrain perdu d'avance et un positionnement opposé. Le volume dilue la qualité perçue.
- **La guerre des styles** : 80+ styles génériques (HomeDesigns AI, REimagineHome) est une course que les gros acteurs gagnent toujours. 12 styles curatés > 80 styles anonymes.
- **La vitesse comme argument principal** : "25 secondes" (Pedra) est un message banalisé. 90 secondes pour un résultat crédible est préférable à 10 secondes pour un résultat qui se voit.
- **Le viligrane et le filigrane** : aucun logo VisiRénov sur les exports. Le visuel est la propriété de l'utilisateur. C'est ce que le professionnel peut montrer à son client.

---

## 6. North Star Metric

**3 000€/mois de marge nette** (revenus packages - coûts API IA - infra Replit/PG).

Ce KPI est volontairement une marge nette et non un chiffre d'affaires brut : il oblige à optimiser la structure de coût en même temps que la croissance du revenu.

Input metrics associées :
- Nombre de packs vendus/mois (cible : 140-150 packs à mix Starter/Pro/Studio)
- Taux de réachat (cible : >30% des acheteurs rachètent dans les 60 jours)
- Volume de générations/semaine (cible : 1 000 photos/semaine = signal d'adoption)
- Taux d'activation (cible : >60% des acheteurs génèrent au moins 3 visuels dans les 7 jours)

---

**Handoff → @ux**
- Fichiers produits : `docs/product/product-vision.md`
- Décisions prises : vision articulée autour des 3 personas nommés, différenciation technique pipeline 2 passes et styles curatés, refus explicite du terrain prix/volume/vitesse, North Star = marge nette 3 000€/mois
- Points d'attention : la vision "Mode Marchand" (F4) est la feature la plus différenciante — le parcours UX de Thomas (dossier de pré-commercialisation complet depuis une adresse + photos) doit être pensé comme un workflow autonome, pas un simple batch de générations
