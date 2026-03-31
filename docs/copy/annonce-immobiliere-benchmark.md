# Benchmark & Prompts — Annonces Immobilières Françaises
> Produit par @copywriter — 2026-03-26
> Usage : fournir à Thomas (marchand de biens) des prompts de génération automatique d'annonces et de dossiers de pré-commercialisation via Versimo
> Ce document sert de référence pour la feature F4 (mode marchand de biens) et l'intégration dans le pipeline de génération de texte

---

## A. Structure type d'une annonce premium (10 sections)

> Calibrage sectoriel effectué sur : SeLoger, Bien'ici, LeBonCoin, Sotheby's International Realty France, Barnes.
> Registre identifié : précis + factuel + émotionnel dans l'accroche, technique dans le corps, sobre dans le CTA.
> Ce qui est interdit dans ce secteur : superlatifs sans preuve, promesses non vérifiables, vocabulaire vague ("sympa", "magnifique"), omission du DPE.

---

### Section 1 — Titre / Accroche principale
**Rôle** : Déclencher le clic. Répondre en une ligne à la question "pourquoi ce bien est-il différent des 200 autres ?"
**Contenu type** : Type de bien + surface + localisation précise + 1 atout clé non générique
**Mots recommandés** : 8-15 mots maximum (contrainte portails)
**Ce qu'on ne fait pas** : "Bel appartement", "Maison de charme", "Superbe T4"

Exemple standard (portail généraliste) :
> T3 48 m² avec terrasse exposée sud — Croix-Rousse, Lyon 4e

Exemple premium (Sotheby's / Barnes) :
> Appartement traversant 130 m² au cœur du Marais, cour privée, immeuble XVIIe — DPE B

Exemple marchand de biens (pré-commercialisation) :
> Appartement 62 m² à livrer rénové en octobre — Chartrons, Bordeaux, investisseur ou résidence principale

---

### Section 2 — Paragraphe d'accroche émotionnelle
**Rôle** : Projeter le lecteur dans la vie possible avant de lui donner les chiffres.
**Contenu type** : 2-3 phrases qui placent le lecteur dans la vie réelle du bien. Ambiance, lumière, quartier, sensation.
**Mots recommandés** : 30-50 mots
**Ce qu'on ne fait pas** : Commencer par "Nous vous proposons", "En exclusivité", "Je vous présente"

Exemple :
> Au dernier étage d'un immeuble calme des années 30, cet appartement baigne dans la lumière du matin jusqu'au coucher du soleil. En bas : la marché du Président Wilson, deux boulangeries, le tram A. En haut : le silence.

---

### Section 3 — Description du bien (faits et caractéristiques)
**Rôle** : Confirmer la décision de cliquer avec des données concrètes. Aucun adjectif non quantifié.
**Contenu type** : Surface loi Carrez, distribution des pièces (ne pas juste dire "3 pièces" — dire "salon de 28 m², 2 chambres de 12 et 10 m²"), état général, rénovations récentes, orientation, étage, luminosité.
**Mots recommandés** : 80-120 mots
**Ce qu'on ne fait pas** : "beau parquet", "cuisine moderne", "lumineuse" sans préciser l'exposition

Exemple :
> Surface : 62 m² (loi Carrez). Entrée avec rangements, salon-séjour de 32 m² ouvert sur balcon filant exposé sud-ouest, cuisine indépendante équipée (Siemens, 2022), 2 chambres (14 m² et 12 m²), salle de bain avec baignoire, WC séparés. Parquet chêne massif rénové (2021), double vitrage, volets roulants électriques. Étage 4 sur 6, ascenseur, immeuble de 1962 avec gardien.

---

### Section 4 — Équipements et prestations
**Rôle** : Justifier le prix. Lister ce qui est inclus ou prévu (parking, cave, box, terrasse, piscine, digicode, interphone vidéo).
**Contenu type** : Liste courte, une ligne par item, précision sur les dimensions si pertinent (cave de 8 m², box fermé pour 1 véhicule).
**Mots recommandés** : 30-50 mots
**Ce qu'on ne fait pas** : "avec tout le confort moderne"

Exemple :
> Inclus : box fermé 1 véhicule (niveau -1), cave de 6 m². Fibre optique installée. Digicode + interphone vidéo. Place vélo sécurisée en sous-sol.

---

### Section 5 — Le quartier (pas juste la ville)
**Rôle** : Vendre l'environnement, pas seulement les murs. C'est souvent ce qui fait la différence sur deux biens identiques à prix équivalent.
**Contenu type** : Ambiance du quartier (2 phrases max), puis 3 catégories factuelles : transports (lignes + temps à pied), commerces (épicerie, boulangerie, pharmacie, marché), écoles (si applicable au profil cible).
**Mots recommandés** : 60-80 mots
**Ce qu'on ne fait pas** : "bien situé", "à deux pas de tout", "quartier recherché" sans preuve

Exemple (cible famille) :
> Quartier des Chartrons, Bordeaux : en pleine transformation depuis 2018 tout en conservant son authenticité bordelaise. Tram B (arrêt Chartrons) à 4 min à pied. Marché des Chartrons le dimanche. École primaire Paul Bert à 6 min à pied. Pharmacie et boulangerie Maison Guignard à 2 min.

Exemple (cible investisseur) :
> Quartier en forte valorisation : +12 % sur les prix au m² entre 2021 et 2024 selon les données Notaires de France. Demande locative tendue (taux de vacance < 3 % sur la zone). Rendement brut estimé : 4,8 % aux conditions actuelles du marché.

---

### Section 6 — Mise en valeur du potentiel (surtout pour les biens à rénover)
**Rôle** : Transformer un défaut apparent (à rénover, pièce sombre, configuration atypique) en opportunité. Indispensable pour les marchands de biens.
**Contenu type** : Description factuelle du potentiel + estimation chiffrée si possible. "Ce bien permet d'envisager [transformation X] pour [bénéfice Y]."
**Mots recommandés** : 40-60 mots
**Ce qu'on ne fait pas** : "à rafraîchir" sans préciser ce que ça implique ni le gain potentiel

Exemple :
> Configuration permettant la création d'une troisième chambre par cloisonnement du séjour (mur léger, aucune contrainte structurelle). Surface habitable portée à 72 m² en intégrant le grenier existant (BSPN à déposer en mairie, délai estimé 3-4 mois). Revente estimée à 320 000 € après rénovation complète selon prix du marché actuel.

---

### Section 7 — Données techniques et réglementaires (obligatoires)
**Rôle** : Conformité légale et filtrage des prospects. Un acheteur qui voit D ou G sait ce qu'il achète.
**Contenu type** : DPE (lettre + kWh/m²/an), GES (lettre + kg CO2/m²/an), mention "logement à consommation énergétique excessive" si F ou G, charges de copropriété mensuelles, taxe foncière annuelle, nombre de lots en copropriété, procédure en cours (article 29 ou non), honoraires d'agence si applicable.
**Mots recommandés** : 40-60 mots
**Ce qu'on ne fait pas** : Omettre le DPE ou le masquer en fin d'annonce

Exemple :
> DPE : D (220 kWh/m²/an) — GES : C (12 kg CO2/m²/an). Charges copropriété : 180 €/mois (eau chaude collective incluse). Taxe foncière 2024 : 1 240 €. Copropriété de 42 lots — pas de procédure en cours (article 29). Prix : 295 000 € FAI (honoraires charge vendeur).

---

### Section 8 — Visuels meublés / home staging (contextualisation des images)
**Rôle** : Légitimer les visuels générés par IA ou home staging virtuel auprès des acheteurs. Éviter la surprise lors de la visite, établir la confiance.
**Contenu type** : Une ligne sous les visuels meublés, en transparence totale.
**Mots recommandés** : 1 phrase (15-20 mots maximum)
**Ce qu'on ne fait pas** : Présenter les visuels meublés sans mention, laisser croire que le bien est vendu meublé

Exemple :
> Les visuels d'aménagement ci-dessous sont des propositions de mise en scène générées par IA. Le bien est vendu vide.

Ou, version plus valorisante pour le marchand :
> Ces projections d'aménagement illustrent le potentiel du bien après rénovation. Photos de l'état actuel disponibles sur demande.

---

### Section 9 — Conditions de vente et disponibilité
**Rôle** : Réduire les questions inutiles, qualifier les prospects, créer une légère urgence sans pression.
**Contenu type** : Date de disponibilité (ou "libre immédiatement"), modalités (visite sur rendez-vous uniquement, dossier de financement requis), et si applicable : droit de préemption, co-propriétaires multiples, procédure notariale spécifique.
**Mots recommandés** : 20-30 mots

Exemple :
> Bien libre à la signature. Visites sur rendez-vous, dossier de financement apprécié. Première mise en vente — pas de compromis signé à ce jour.

---

### Section 10 — Appel à l'action (CTA)
**Rôle** : Convertir le lecteur en prospect. Précis, actif, sans hésitation.
**Contenu type** : Verbe d'action + bénéfice immédiat + moyen de contact. Moins de 12 mots.
**Mots recommandés** : 1-2 phrases (20-30 mots)
**Ce qu'on ne fait pas** : "N'hésitez pas à nous contacter pour de plus amples renseignements"

Exemples selon le canal :
> Organisez votre visite — réponse sous 2h : [coordonnées]
> Téléchargez le dossier complet (plans, devis, DPE) : [lien]
> Réservez votre créneau de visite en ligne : [lien agenda]

## B. Éléments différenciants des meilleures annonces

### 1. L'accroche émotionnelle — projeter avant d'informer

Les meilleures annonces ne commencent pas par les caractéristiques. Elles commencent par la vie possible.

La différence entre une annonce moyenne et une annonce efficace tient souvent à un seul paragraphe de 30-50 mots qui répond à la question implicite de l'acheteur : "Est-ce que JE pourrais vivre ici ?"

Les leviers qui fonctionnent (dans le contexte immobilier français) :
- **La lumière et l'exposition** : "baigné de lumière du matin" fonctionne mieux que "bien exposé"
- **L'ancrage quartier spécifique** : citer une rue, un marché, une boulangerie connue localement crée une appartenance immédiate
- **Le calme comme statut** : dans les grandes villes françaises, "calme" est un argument premium, pas un défaut
- **Le silence de certains détails** : une cuisine équipée "Siemens 2022" dit plus qu'une page de descriptif — la précision factuelle est plus émotionnelle que les adjectifs

Ce que Sotheby's fait et que les annonces ordinaires ne font pas : ils racontent l'histoire du bien (immeuble de 1727, Hôtel d'Avéjean) avant d'en donner la surface.

---

### 2. La description du quartier — le contexte est souvent plus décisif que le bien

Les acheteurs n'achètent pas un appartement, ils achètent un mode de vie dans une zone géographique. La description du quartier est souvent la section la plus sous-exploitée des annonces françaises.

Ce qui différencie une description quartier efficace :

**Précision > généralité**
- Mauvais : "proche de tous les transports"
- Bon : "Métro Opéra (ligne 3) à 7 min à pied, RER A à 12 min"

**Concret > abstrait**
- Mauvais : "quartier vivant et recherché"
- Bon : "Marché de la Croix-Rousse le dimanche matin, 4 épiceries de quartier, 2 pharmacies, cinéma Comoedia à 8 min à pied"

**Écoles = closing argument pour les familles**
Une annonce qui cite l'école primaire et le collège de secteur avec le temps de trajet à pied convertit systématiquement mieux sur les T3-T4-maisons.

**Tendances de valorisation = closing argument pour les investisseurs**
Citer les données Notaires de France ou la progression des prix sur 3-5 ans positionne l'annonce comme un conseil, pas un argument de vente.

---

### 3. La mise en valeur du potentiel — vendre ce que le bien PEUT devenir

Particulièrement critique pour les marchands de biens. Un bien à rénover présenté comme "à rafraîchir" est un défaut. Le même bien présenté avec son potentiel chiffré est une opportunité.

Les 4 formes de potentiel à valoriser :
1. **Potentiel architectural** : cloisons à abattre, grenier aménageable, extension possible, création de chambre supplémentaire
2. **Potentiel énergétique** : "DPE G actuel — isolation des combles et remplacement du chauffe-eau permettent de viser D pour ≈ 15 000 €"
3. **Potentiel locatif** : surface, configuration (colocation possible), rendement brut estimé aux conditions du marché
4. **Potentiel de valorisation** : comparaison prix actuel vs prix post-rénovation avec données marché locales

Ce que les meilleures annonces de marchands font que les autres ne font pas : elles accompagnent le visuel meublé d'une ligne de contextualisation. "Projection d'aménagement : cuisine ouverte créée par suppression de la cloison centrale (mur non porteur)." Cela transforme un visuel de home staging en argument de vente technique.

---

### 4. Les points techniques — obligatoires et stratégiques

Le DPE est obligatoire légalement depuis 2021 (loi Climat et Résilience). Il est aussi stratégique : un G masqué en bas d'annonce est perçu comme une dissimulation ; un G bien expliqué avec le plan de rénovation devient un levier de négociation.

Les points techniques à mentionner systématiquement :
- DPE (lettre + consommation en kWh/m²/an)
- GES (lettre + émissions en kg CO2/m²/an)
- Mention légale si F ou G : "logement à consommation énergétique excessive"
- Charges de copropriété mensuelles (préciser ce qu'elles incluent : eau, gardien, ascenseur)
- Taxe foncière annuelle (de plus en plus attendue par les acquéreurs)
- Nombre de lots en copropriété + procédures en cours
- Honoraires : charge vendeur ou acquéreur, montant ou % TTC

---

### 5. Le CTA final — convertir sans forcer

Les meilleurs CTA du marché immobilier français sont directs, rassurants sur le délai de réponse, et créent une légère urgence sans pression.

Structure gagnante : **Verbe d'action + délai de réponse + moyen de contact**

- "Contactez [prénom] pour organiser une visite — disponible 7j/7 : [numéro]"
- "Téléchargez le dossier complet (plans + devis estimatifs + DPE) : [lien]"
- "Première mise en vente ce jour — répondez avant le [date] pour priorité de visite"

Ce que les annonces premium (Sotheby's, Barnes) font différemment : elles proposent un "dossier confidentiel" sur demande, ce qui crée une perception d'exclusivité et filtre les prospects non sérieux.

## C. Erreurs à éviter

Ces erreurs sont relevées sur la majorité des annonces du marché français (SeLoger, LeBonCoin, Bien'ici). Chacune réduit le taux de contact ou dégrade la perception de valeur.

---

### Erreur 1 — L'accroche générique (la plus répandue)
"Bel appartement lumineux en bon état"
"Charmante maison de ville"
"Spacieux T4 proche de toutes commodités"

Ces titres décrivent 80 % des annonces. Ils ne déclenchent aucune préférence. L'accroche doit répondre à "pourquoi CE bien et pas un autre ?"

---

### Erreur 2 — Les adjectifs sans preuve
"Superbe vue" (sur quoi ?), "cuisine moderne" (de quelle année ?), "beau parquet" (essence ? état ?), "quartier calme" (par rapport à quoi ?)

Chaque adjectif doit être suivi ou remplacé par un fait. "Vue dégagée sur la Garonne" remplace "belle vue". "Parquet chêne massif 22 mm rénové en 2021" remplace "beau parquet".

---

### Erreur 3 — Omettre ou masquer le DPE
Le DPE en fin d'annonce en petits caractères est légalement insuffisant depuis 2022 et perçu comme une dissimulation. Un DPE G bien expliqué ("isolation des combles + chauffe-eau thermodynamique = passage en D estimé pour 18 000 €") est un argument de vente, pas un handicap.

---

### Erreur 4 — Décrire l'état actuel sans évoquer le potentiel
"À rafraîchir" seul est un frein. "À rafraîchir — configuration permettant la création d'une troisième chambre" est une opportunité. La même réalité, deux lectures opposées.

---

### Erreur 5 — La description quartier vague
"Bien situé au cœur d'un quartier dynamique proche de toutes commodités." Cette phrase ne donne aucune information. Elle dit seulement que l'agent n'a pas pris 10 minutes pour connaître la zone. Citer des lieux spécifiques (noms de rues, de commerces, de lignes de transport avec temps de trajet) crée la crédibilité.

---

### Erreur 6 — Les charges sans détail
"Charges : 250 €/mois" sans préciser ce qu'elles incluent. Un acheteur ne sait pas si c'est eau + chauffage collectif + gardien + ascenseur ou juste les parties communes. Le détail rassure et évite les abandons post-visite.

---

### Erreur 7 — Le CTA passif
"N'hésitez pas à nous contacter pour de plus amples renseignements."
Ce CTA ne donne pas de raison d'agir maintenant, pas de délai, pas de facilité. Reformuler : "Visites organisées mardi et jeudi sur créneaux disponibles — [numéro / lien]"

---

### Erreur 8 — Les visuels meublés sans contextualisation (spécifique Versimo)
Présenter des visuels IA générés sans mention claire de leur nature peut créer une déception lors de la visite (le bien est vendu vide) et une perte de confiance. Une ligne de transparence suffit et n'enlève rien à l'impact des visuels : "Projection d'aménagement générée par IA — bien vendu vide."

---

### Erreur 9 — Ignorer l'audience cible de l'annonce
Une annonce T4 avec jardin qui ne mentionne ni les écoles ni le temps de trajet jusqu'à un axe routier principal ne parle pas aux familles. Une annonce de studio qui ne mentionne pas la proximité des transports et le loyer possible en location ne parle pas aux investisseurs. L'annonce doit adresser son profil d'acheteur cible dès l'accroche.

---

### Erreur 10 — Les photos sans visuels meublés sur les biens vides
D'après les données sectorielles, un bien présenté avec des visuels meublés reçoit 32 % de clics supplémentaires et se vend 50 % plus vite. Publier uniquement des photos de murs vides en 2025, c'est laisser cet avantage concurrentiel à l'annonce d'à côté.

## D. Prompt GPT — Génération d'annonce immobilière (~300-500 mots)

> Directement utilisable dans le code (feature F4 — mode marchand de biens).
> Ce prompt est le system prompt à injecter dans un appel GPT-4.1-mini (ou GPT-4.1 pour qualité maximale).
> Les variables entre `{{}}` sont à remplacer dynamiquement par les données saisies par l'utilisateur.

---

### Prompt système (à injecter comme `system` message)

```
Tu es un rédacteur d'annonces immobilières expert du marché français. Tu rédiges pour des marchands de biens et des agents immobiliers professionnels.

Ton style : précis, factuel, sobre. Aucun superlatif sans preuve. Aucun adjectif vague. Chaque affirmation est vérifiable. Tu n'inventes jamais de données non fournies — tu travailles uniquement avec ce qui t'est transmis.

Règles absolues :
- NE JAMAIS écrire "bel appartement", "charmant", "magnifique", "superbe", "spacieux" sans donnée factuelle qui le justifie
- NE JAMAIS écrire "proche de toutes commodités" ou "bien situé" sans citer les transports, commerces ou services spécifiques
- TOUJOURS inclure le DPE et les charges dans les informations techniques
- Si une donnée est manquante, écrire [DONNÉE MANQUANTE : nom de la donnée] — ne jamais inventer
- Les visuels meublés générés par IA DOIVENT être contextualisés par la mention "Projection d'aménagement générée par IA — bien vendu vide."

Structure de sortie OBLIGATOIRE (respecter dans cet ordre) :
1. TITRE (8-15 mots) : type + surface + localisation + 1 atout non générique
2. ACCROCHE (30-50 mots) : projeter le lecteur dans la vie possible, ancrage local concret
3. DESCRIPTION DU BIEN (80-120 mots) : distribution précise des pièces avec surfaces, état général, rénovations datées, orientation, étage, équipements
4. ÉQUIPEMENTS (30-50 mots) : parking, cave, terrasse, box, fibre, digicode — liste précise avec dimensions si pertinent
5. LE QUARTIER (60-80 mots) : ambiance 2 phrases + transports (lignes + temps à pied) + commerces (nommés) + écoles si applicable
6. POTENTIEL (40-60 mots) : transformation possible, création de chambre, extension, amélioration DPE avec estimation chiffrée — UNIQUEMENT si des éléments le permettent
7. INFORMATIONS TECHNIQUES (40-60 mots) : DPE lettre + kWh/m²/an, GES lettre + kg CO2/m²/an, charges mensuelles détaillées, taxe foncière, copropriété (nb lots + procédures), prix FAI avec précision sur les honoraires
8. CONTEXTUALISATION VISUELS (1 phrase) : à inclure si des visuels meublés accompagnent l'annonce
9. CONDITIONS DE VENTE (20-30 mots) : disponibilité, visites, première mise en vente ou non
10. CTA (15-20 mots) : verbe d'action + délai de réponse + moyen de contact

Longueur totale cible : 350-450 mots (corps d'annonce, hors titre et CTA).
```

---

### Prompt utilisateur (à construire dynamiquement avec les données du formulaire)

```
Rédige une annonce immobilière professionnelle pour le bien suivant.

DONNÉES DU BIEN :
- Type : {{type_bien}} (appartement / maison / immeuble / local)
- Adresse : {{adresse_complete}}
- Surface habitable : {{surface}} m² (loi Carrez si applicable)
- Nombre de pièces : {{nb_pieces}}
- Distribution : {{distribution}} (ex : entrée, salon 28m², cuisine équipée, 2 chambres 12m² et 10m², SDB, WC séparés)
- Étage : {{etage}} sur {{nb_etages_immeuble}} (si appartement)
- Orientation principale : {{orientation}}
- État général : {{etat}} (ex : à rénover / bon état / rénové en {{annee}})
- Rénovations récentes : {{renovations}} (ex : cuisine refaite en 2022, parquet rénové en 2021)
- Année de construction : {{annee_construction}}
- DPE : {{dpe_lettre}} — {{dpe_kwh}} kWh/m²/an
- GES : {{ges_lettre}} — {{ges_co2}} kg CO2/m²/an
- Charges copropriété : {{charges_mensuelles}} €/mois (inclus : {{detail_charges}})
- Taxe foncière : {{taxe_fonciere}} €/an
- Nombre de lots copropriété : {{nb_lots}}
- Procédure copropriété en cours : {{oui_non_procedure}}
- Parking / Cave / Box : {{parkings_caves}}
- Autres équipements : {{equipements}} (terrasse, fibre, digicode, etc.)
- Prix de vente : {{prix}} € — honoraires : {{hono_detail}} (charge vendeur / acquéreur, montant ou %)

DONNÉES DU QUARTIER :
- Ville et quartier précis : {{ville_quartier}}
- Transports à proximité : {{transports}} (ex : Tram B arrêt Chartrons à 4 min à pied, Bus 29 à 2 min)
- Commerces à proximité : {{commerces}} (ex : Marché des Chartrons dimanche, boulangerie Dupont à 3 min)
- Écoles à proximité : {{ecoles}} (ex : École primaire Paul Bert à 6 min, Collège Saint-Genès à 10 min)
- Tendances marché local si disponibles : {{tendances_marche}}

POTENTIEL DU BIEN (si applicable) :
- Travaux envisageables : {{travaux_potentiel}}
- Création de surface possible : {{creation_surface}}
- Potentiel locatif : {{potentiel_locatif}}
- Estimation post-rénovation : {{estimation_post_reno}}

CONTEXTE DE VENTE :
- Visuels meublés générés par IA joints à l'annonce : {{oui_non_visuels_ia}}
- Disponibilité du bien : {{disponibilite}}
- Type de contact préféré : {{contact}}
- Première mise en vente : {{oui_non_premiere_mise}}
```

---

### Notes d'intégration pour @fullstack

- Le system prompt est fixe, à stocker en constante dans `lib/annonce-generator.ts`
- Le prompt utilisateur est construit dynamiquement à partir des champs du formulaire F4
- Les champs marqués `{{}}` correspondent aux inputs du formulaire marchand de biens
- Si un champ est vide, ne pas l'injecter dans le prompt (GPT ignorera mieux qu'avec une chaîne vide)
- Modèle recommandé : GPT-4.1-mini pour coût/qualité — GPT-4.1 pour annonces premium (option à proposer en plan Business)
- Longueur de sortie attendue : ~400-500 tokens. Paramètre `max_tokens: 700` pour ne pas couper le CTA

## E. Prompt GPT — Description bien dans dossier de pré-commercialisation (~400-600 mots)

> Contexte : le dossier de pré-commercialisation est un document PDF envoyé aux acquéreurs potentiels AVANT les travaux. Son audience est double : investisseurs (intéressés par le rendement et la sécurité de l'opération) et résidents (intéressés par le cadre de vie et la projection émotionnelle). Le ton est plus professionnel et plus long qu'une annonce portail.
> L'audience lira ce document pour décider de signer un compromis avant même de voir les travaux réalisés.

---

### Prompt système (à injecter comme `system` message)

```
Tu es un rédacteur spécialisé en dossiers de pré-commercialisation pour marchands de biens. Tu rédiges pour des acquéreurs professionnels (investisseurs) et des primo-accédants (résidence principale). Ton document sera intégré dans un dossier PDF professionnel.

Ton style : structuré, précis, professionnel. Tu combines la rigueur d'un conseiller patrimonial et la clarté d'un bon directeur de programme. Tu ne vends pas — tu présentes avec objectivité. Les chiffres sont vérifiables. Les projections sont clairement identifiées comme des estimations.

Règles absolues :
- Toute projection financière DOIT être précédée de "Estimation selon les conditions de marché actuelles"
- Tout travail envisagé DOIT être formulé comme "projection" ou "proposition d'aménagement"
- NE JAMAIS garantir une valeur de revente ou un rendement locatif
- Les visuels meublés IA DOIVENT être légendés "Projection d'aménagement — état actuel disponible en annexe"
- Si une donnée est manquante, écrire [DONNÉE À COMPLÉTER] — ne jamais inventer
- Les informations légales (DPE, copropriété, charges) sont présentées en section dédiée, pas dispersées dans le texte narratif

Structure de sortie OBLIGATOIRE :

### 1. PRÉSENTATION DU BIEN (80-100 mots)
Description sobre et précise du bien dans son état actuel. Type, surface, distribution actuelle, étage, orientation, état général honnête. Ton neutre — ni trop négatif ("à rénover entièrement"), ni trop optimiste ("bon potentiel") sans données.

### 2. ANALYSE DU QUARTIER ET DE LA LOCALISATION (100-130 mots)
Deux sous-sections :
- Environnement immédiat : ambiance du quartier, nommé précisément (rue, quartier, ville). Transports avec lignes et temps à pied. Commerces nommés. Écoles avec niveaux et temps de trajet.
- Dynamique de marché : tendance des prix sur 3-5 ans si disponible, demande locative, profil des acquéreurs sur la zone, projets de réhabilitation urbaine si applicable.

### 3. PROGRAMME DE RÉNOVATION PROPOSÉ (100-130 mots)
Description des travaux envisagés selon le programme du marchand. Chaque intervention est nommée et localisée (pièce par pièce si pertinent). Estimation budgétaire globale des travaux. Date de livraison estimée. Prestataires ou garanties si applicable.
Important : présenter comme "programme de rénovation selon les plans validés" et non "ce que vous aurez après travaux".

### 4. PROJECTIONS D'AMÉNAGEMENT (30-50 mots)
Courte introduction aux visuels meublés. Expliquer que les visuels montrent une proposition d'aménagement après rénovation. Mentionner le style retenu. Souligner que les plans définitifs sont en annexe.

### 5. DONNÉES FINANCIÈRES (80-100 mots)
- Prix de vente : montant et composition (quote-part existant / travaux si VIR)
- Estimation locative mensuelle (si investissement) : montant brut, surface considérée, source de l'estimation
- Rendement brut estimé : calcul (loyer annuel / prix d'acquisition) précédé de "Estimation"
- Charges de copropriété prévisionnelles
- Taxe foncière estimée post-rénovation
- Frais de notaire estimés
- Rappel : "Ces projections sont fournies à titre indicatif."

### 6. INFORMATIONS TECHNIQUES ET RÉGLEMENTAIRES (60-80 mots)
DPE actuel et DPE cible post-rénovation. GES. Mention légale si F/G. Régime de copropriété (nb lots, charges prévisionnelles, syndic pressenti). Nature juridique de la vente (VIR, vente ordinaire, VEFA). Garanties prévues (GFA si applicable). Situation hypothécaire.

### 7. CONTACTS ET PROCHAINES ÉTAPES (30-40 mots)
Interlocuteur dédié, modalités pour réserver (compromis, acompte, délais), date limite si applicable, prochaine réunion de présentation si organisée.

Longueur totale cible : 500-600 mots de texte narratif (hors tableaux et données chiffrées isolées).
```

---

### Prompt utilisateur (à construire dynamiquement)

```
Rédige la section "Description du bien" pour le dossier de pré-commercialisation suivant.

DONNÉES DU PROJET :
- Type d'opération : {{type_operation}} (ex : rénovation appartement / division immeuble / transformation local en logements)
- Adresse complète : {{adresse_complete}}
- Description actuelle du bien : {{description_actuelle}} (ex : appartement 62m², 3 pièces, parquet à refaire, cuisine à rénover, salle de bain vétuste)
- Surface habitable actuelle : {{surface_actuelle}} m²
- Surface habitable post-rénovation : {{surface_post_reno}} m² (si différente)
- Distribution actuelle : {{distribution_actuelle}}
- Distribution projetée post-rénovation : {{distribution_prevue}}
- Étage : {{etage}} sur {{nb_etages}}
- Orientation : {{orientation}}
- Année de construction : {{annee_construction}}

DONNÉES DU QUARTIER :
- Ville et quartier précis : {{ville_quartier}}
- Ambiance et profil du quartier : {{description_quartier}}
- Transports : {{transports}}
- Commerces et services : {{commerces}}
- Écoles (si résidence principale envisagée) : {{ecoles}}
- Tendances du marché local : {{tendances_marche}}
- Projets de réhabilitation ou de développement urban à proximité : {{projets_urbains}}

PROGRAMME DE RÉNOVATION :
- Travaux principaux prévus : {{travaux_prevus}} (ex : réfection complète cuisine et SDB, remplacement fenêtres double vitrage, isolation des murs, reprise électricité aux normes, peinture complète)
- Budget travaux estimé : {{budget_travaux}} €
- Date de livraison estimée : {{date_livraison}}
- Prestataires sélectionnés : {{prestataires}} (ou "appel d'offres en cours")
- Garanties travaux prévues : {{garanties}}

DONNÉES FINANCIÈRES :
- Prix de vente : {{prix_vente}} €
- Composition du prix si VIR : Quote-part existant {{prix_existant}} € + Quote-part travaux {{prix_travaux}} €
- Loyer mensuel estimé (charges comprises) : {{loyer_estime}} €
- Surface considérée pour l'estimation locative : {{surface_locative}} m²
- Source de l'estimation locative : {{source_estimation}}
- Charges de copropriété prévisionnelles : {{charges_previsionnelles}} €/mois
- Taxe foncière estimée post-rénovation : {{taxe_fonciere_estimee}} €/an
- Frais de notaire estimés : {{frais_notaire}} €

DONNÉES TECHNIQUES ET RÉGLEMENTAIRES :
- DPE actuel : {{dpe_actuel}} — {{dpe_kwh_actuel}} kWh/m²/an
- DPE cible post-rénovation : {{dpe_cible}} — {{dpe_kwh_cible}} kWh/m²/an (estimation)
- GES actuel : {{ges_actuel}}
- Nature juridique de la vente : {{nature_vente}} (VIR / vente ordinaire / VEFA)
- Nombre de lots en copropriété : {{nb_lots}}
- Syndic pressenti : {{syndic}}
- Garantie Financière d'Achèvement : {{gfa_oui_non}}
- Situation hypothécaire : {{situation_hypo}}

VISUELS MEUBLÉS :
- Visuels IA joints au dossier : {{oui_non_visuels}}
- Style d'aménagement retenu : {{style_amenagement}}
- Nombre de visuels : {{nb_visuels}}

INTERLOCUTEUR ET CONTACT :
- Nom du marchand / interlocuteur commercial : {{nom_contact}}
- Téléphone : {{telephone}}
- Email : {{email}}
- Date limite de réservation : {{date_limite}}
- Modalité de réservation : {{modalite_resa}} (ex : compromis notarié avec acompte de 5%)
```

---

### Notes d'intégration pour @fullstack

- Ce prompt génère la section description longue du dossier PDF marchand de biens
- Le dossier PDF complet inclura également : plan du bien (upload), visuels Versimo, tableau financier, plan de rénovation — ces sections sont construites par le reste de l'interface F4
- Modèle recommandé : GPT-4.1 (pas mini — la qualité de rédaction est critique pour un dossier investisseur)
- Longueur de sortie attendue : ~600-750 tokens. Paramètre `max_tokens: 900`
- Le rendu final peut être exporté en PDF via `react-pdf` ou `puppeteer` (à décider par @fullstack)
- Ce texte accompagne les visuels Versimo dans le dossier PDF — les légendes des visuels ("Projection d'aménagement générée par IA — état actuel disponible en annexe") sont générées séparément
