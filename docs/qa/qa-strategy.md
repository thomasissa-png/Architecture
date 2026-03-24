# Strategie QA -- VisiRenov

## Audit des criteres d'acceptation

### F1 -- Iteration commentaire

| # | Critere (resume) | Testable ? | Probleme | Reformulation |
|---|---|---|---|---|
| US-F1-01 | Clic "Affiner" declenche re-passe 2 uniquement sur passe 1 existante. Compteur decremente. Resultat remplace dans comparateur. | Oui (E2E + integration) | -- | -- |
| US-F1-01 AC | La passe 1 n'est JAMAIS relancee | Oui (integration) | Verifiable en mockant /api/generate et en assertant que pass1_key est envoye (pas de nouvelle passe 1) | -- |
| US-F1-02 | Badge "X iteration(s) restante(s)" visible sous bouton Affiner | Oui (E2E) | -- | -- |
| US-F1-02 AC | Badge mis a jour en temps reel. Quand 0, bouton grise + tooltip "Iterations epuisees" | Oui (E2E) | -- | -- |
| US-F1-03 | Selecteur versions v1/v2/v3. Clic charge le resultat correspondant. | Oui (E2E) | -- | -- |
| US-F1-03 AC | Chaque version conserve son commentaire en legende. Telechargement HD fonctionne sur chaque version. | Oui (E2E) | -- | -- |
| US-F1-04 | Commentaire FR pre-traite par GPT-4.1-mini (traduction EN + enrichissement) | Oui (integration) | La qualite de l'enrichissement n'est pas verifiable de facon deterministe | Given commentaire "plus de plantes", When requete envoyee, Then le payload envoye a /api/generate contient un furniturePrompt en anglais contenant "plant" |
| US-F1-04 AC | Pre-processing < 1,5s. Echec GPT-4.1-mini = commentaire brut utilise sans blocage | Partiellement | Le seuil 1,5s est testable en integration avec timer. Le fallback est testable en mockant un echec GPT-4.1-mini. | -- |
| Edge 1 | Commentaire vide = bouton desactive | Oui (unitaire) | -- | -- |
| Edge 2 | Commentaire structurel ("ajoute fenetre") = warning GPT-4.1-mini | Oui (integration) | Non deterministe : depend du LLM | Given commentaire "ajoute une fenetre", When pre-processing termine, Then un warning contenant "modifications structurelles" est affiche ET la generation n'est PAS lancee |
| Edge 3 | Commentaire langue etrangere = traduit en EN | Oui (integration) | Non deterministe | Given commentaire en arabe, When pre-processing, Then furniturePrompt contient des mots anglais |
| Edge 4 | Passe 1 expiree (>24h) = bouton Affiner desactive + message | Oui (E2E) | Necessite de simuler un TTL expire | Given une generation dont la passe 1 date de >24h (mock), When affichage comparateur, Then bouton Affiner desactive avec message "surfaces expirees" |
| Edge 5 | Timeout passe 2 >90s = iteration NON consommee, rollback compteur | Oui (integration) | Necessite un mock timeout | Given timeout simule sur /api/generate, When timeout atteint, Then compteur iterations inchange ET message "iteration conservee" |
| Edge 6 | Fallback Flux sur iteration = meme logique avec passe 1 comme input | Oui (integration) | -- | -- |
| Edge 7 | Commentaire "piece vide" = GPT-4.1-mini detecte et bloque | Oui (integration) | Non deterministe | Given commentaire "piece vide", When pre-processing, Then warning "action non possible en mode affinage" |

### F2 -- Type de piece

| # | Critere (resume) | Testable ? | Probleme | Reformulation |
|---|---|---|---|---|
| US-F2-01 | Selection "Salle de bain" injecte roomFurnitureOverride (vasque, miroir) et roomSurfaceOverride (carrelage) | Oui (integration) | -- | -- |
| US-F2-01 AC | Pour chaque type, des blocs override sont definis. Le resultat ne contient jamais de canape dans une salle de bain. | Partiellement | "Le resultat ne contient jamais de canape" = verification visuelle, non testable automatiquement | Given type "Salle de bain", When prompt construit, Then furniturePrompt contient "vanity/mirror/towel" ET negative prompt contient "sofa, coffee table" |
| US-F2-02 | Selection "Cuisine" injecte plan de travail, credence, appareils. Passe 1 cible carrelage/parquet resistant. | Oui (integration) | -- | -- |
| US-F2-02 AC | Resultat notablement different d'un salon pour la meme image | Non | "Notablement different" est subjectif -- non testable automatiquement | Given meme image, When generation avec type "Cuisine" vs type "Salon", Then les furniturePrompt envoyes a l'API sont differents (assertion sur le contenu du prompt, pas sur l'image) |
| US-F2-03 | Auto-detection GPT-4.1-mini propose un type. Utilisateur confirme ou ignore. | Oui (E2E + integration) | -- | -- |
| US-F2-03 AC | Detection proposee en option, jamais imposee. Ignorer = aucun override. | Oui (E2E) | -- | -- |
| Edge 1 | Cuisine + Wabi-Sabi = combinaison valide, pas de blocage | Oui (integration) | -- | -- |
| Edge 2 | Image multi-espace = message informatif "une seule piece a la fois" | Oui (E2E) | Declenchement depend de la detection GPT-4.1-mini | Given image detectee comme multi-espace, When affichage, Then message informatif visible |
| Edge 4 | Image invalide = validation bloque avant selecteur type | Oui (E2E) | -- | -- |
| Edge 5 | Custom prompt + type = GPT-4.1-mini filtre incompatibles | Oui (integration) | Non deterministe | Given type "Cuisine" + custom "canape cuir", When pre-processing, Then "canape" filtre du prompt |
| Edge 6 | Buanderie + Art Deco = pas de blocage | Oui (integration) | -- | -- |

### F3 -- Exterieur

| # | Critere (resume) | Testable ? | Probleme | Reformulation |
|---|---|---|---|---|
| US-F3-01 | Terrasse : mobilier outdoor weatherproof. Passe 1 = sol terrasse + preserve garde-corps. Passe 2 = mobilier outdoor freestanding. | Oui (integration) | "Aucun meuble indoor" et "garde-corps preserve" = verification visuelle | Given mode Exterieur + sous-type Terrasse, When prompts construits, Then surfacePrompt contient "open-air" ET furniturePrompt contient "weatherproof/outdoor" ET negative prompt contient "indoor furniture, sofa, carpet" |
| US-F3-01 AC | Aucun meuble indoor. Ciel preserve. Garde-corps non modifie. | Non (visuel) | Verification d'image generee = non deterministe | Tester via assertion sur prompts : negative prompt contient "indoor furniture" ; prompt passe 1 contient "preserve existing railings/guard-rails" |
| US-F3-02 | 6 styles outdoor affiches. 12 styles interieurs masques. Cosy Balcon = mobilier compact. | Oui (E2E) | -- | -- |
| US-F3-02 AC | 6 styles outdoor min. Chaque style a surfacePrompt + furniturePrompt outdoor. Aucune mention plafond/luminaire suspendu/meuble indoor. | Oui (unitaire) | -- | Given chaque style outdoor, Then surfacePrompt ne contient pas "ceiling" ET furniturePrompt ne contient pas "sofa, carpet, indoor" |
| US-F3-03 | Builders detectent isOutdoor:true et suppriment directives plafond/luminaire. Injectent "open-air space". | Oui (unitaire + integration) | -- | -- |
| US-F3-03 AC | Aucun plafond invente. Aucun luminaire de plafond outdoor. | Non (visuel) | -- | Tester via prompts : si isOutdoor=true, Then prompt ne contient pas "ceiling geometry", "ceiling light fixture" |
| US-F3-04 | Photo interieure en mode Exterieur = alerte non bloquante "Basculer en mode Interieur ?" | Oui (E2E) | Declenchement depend de GPT-4.1-mini | Given mode Exterieur + photo interieure (mock detection), When upload termine, Then bandeau alerte visible avec boutons [Basculer] [Continuer] |
| US-F3-04 AC | Alerte jamais bloquante. Credit non consomme avant clic "Generer". | Oui (E2E) | -- | -- |
| Edge 1 | Ciel surexpose = preserve highlights | Oui (integration) | -- | Given photo outdoor, Then prompt contient "preserve highlights" |
| Edge 2 | Balcon 4m2 = mobilier compact impose | Oui (unitaire) | -- | Given sous-type "Balcon", Then furniturePrompt contient "compact/bistro table 60cm" |
| Edge 4 | Rooftop = preserve skyline | Oui (integration) | -- | Given sous-type "Rooftop", Then prompt contient "preserve skyline" |

### F4 -- Mode marchand

| # | Critere (resume) | Testable ? | Probleme | Reformulation |
|---|---|---|---|---|
| US-F4-01 | Upload 15 photos, style global, type de bien, generation batch max 3 concurrent. Dossier avec avant/apres. PDF genere + lien partageable. | Oui (E2E + integration) | -- | -- |
| US-F4-01 AC | PDF contient toutes les photos (avant+apres cote a cote), nom du bien, date, infos utilisateur | Oui (integration) | Tester la structure du PDF genere (nombre de pages, presence des champs) | Given 5 photos + infos bien, When PDF genere, Then PDF contient 6 pages (couverture + 5 pieces) ET page 1 contient adresse/surface/prix |
| US-F4-02 | Lien unique genere. Page web legere avec visuels + infos. Pas de login requis. | Oui (E2E) | -- | -- |
| US-F4-02 AC | Lien valide 30 jours. Page mobile-friendly. Bouton "Telecharger PDF" present. | Oui (E2E) | TTL 30j = test d'integration avec date simulee | Given lien cree, When visite a J+31, Then page affiche "dossier expire" |
| US-F4-03 | Style par photo individuelle. Style global = defaut. Badge de style sur vignette. | Oui (E2E) | -- | -- |
| US-F4-03 AC | Badge visible. Style individuel modifiable ou reinitialise au global. | Oui (E2E) | -- | -- |
| Edge 1 | Credit insuffisant en cours de batch : photos restantes non generees, dossier partiel conserve | Oui (integration) | -- | Given 15 photos + 8 credits, When batch lance, Then 8 photos generees + message "credits insuffisants" + dossier partiel consultable |
| Edge 2 | Timeout sur 1 photo : marquee "Echec", batch continue | Oui (integration) | -- | -- |
| Edge 4 | PDF > 25 Mo : proposer ZIP en alternative | Oui (integration) | -- | -- |
| Edge 5 | Lien expire >30j : message "dossier expire" | Oui (E2E) | -- | -- |
| Edge 7 | Infos bien non renseignees : PDF genere avec "Bien sans titre" | Oui (integration) | -- | -- |

### F5 -- Mode decorateur

| # | Critere (resume) | Testable ? | Probleme | Reformulation |
|---|---|---|---|---|

## Criteres non testables -- Synthese

## Scenarios E2E Playwright

### E2E-01 : Generation standard + iteration commentaire

### E2E-02 : Selection type de piece + generation

### E2E-03 : Mode exterieur terrasse

### E2E-04 : Mode marchand dossier complet

### E2E-05 : Shopping list mode decorateur

### E2E-06 : Parcours gratuit -- limites et upsell

## Tests unitaires prioritaires (Vitest)

## Matrice de couverture

## Strategie de mocking
