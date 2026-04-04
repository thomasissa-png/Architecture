# Specs Fonctionnelles — Versimo
## Version 1.1 — 2026-04-04 (mise à jour specs vs code production)
> Version 1.0 : 2026-03-24. Mise à jour 1.1 : alignement sur l'état réel du code (session 31+) — modèle IA, crédits, mode unifié, itérations, variantes mobilier, mobile resilience.


---

## 0. Contexte & Benchmark concurrentiel

### Benchmark concurrentiel (source : recherche web 2026-03-24)

| Concurrent | Modèle | Prix entrée | Crédits inclus | Prix/image | Points forts | Points faibles |
|---|---|---|---|---|---|---|
| REimagineHome | Abonnement | 14$/mois | Variable | ~0,01-0,05$ | 1,5M users, shoppable designs | Résultats génériques, pas de pipeline 2 passes |
| HomeDesigns AI | Abonnement | 27$/mois | 1000 designs | ~0,03$ | Extérieur inclus, Furniture Finder | Style CGI perceptible |
| AI HomeDesign | Abonnement | 19$/mois | 30 photos | ~0,63$/photo | Workflow listing complet | Pas de vrai staging meublé, outil retouche |
| Virtual Staging AI | Abonnement | 16$/mois | 6 photos | ~2,67$/photo | Simplicité | Volume très limité, qualité moyenne |

### Positionnement Versimo

- **Différence clé** : Pipeline 2 passes (surfaces → mobilier) = cohérence architecturale que les concurrents n'ont pas. Styles adaptés au marché français (Haussmannien, Méditerranéen, Wabi-Sabi).
- **Modèle** : Packages crédits (one-shot, sans engagement) vs abonnements mensuels des concurrents. Adapté aux pros qui ont des pics de besoin (Thomas : 8-12 opérations/an) et aux particuliers (Léa : 1 appartement).
- **Prix cible** : 0,80-1,50€/génération selon package. Soit 2-5x moins cher qu'un home stager humain (13-500€/image) pour une qualité architecte-grade.
- **North Star** : 3 000€/mois de marge nette.

---

## F1 — Itération commentaire

Re-génération passe 2 uniquement après commentaire utilisateur. 1-3 itérations/package.

### F1.1 User Stories

**US-F1-01 — Commenter un résultat pour affiner (Claire, Thomas, Léa)**
- Job-to-be-done : Quand je vois un visuel qui est "presque parfait", je veux demander un ajustement précis sans recommencer de zéro.
- Given : L'utilisateur a un résultat généré affiché dans le comparateur.
- When : Il clique sur "Affiner ce résultat" → saisit un commentaire (ex. "remplace le canapé beige par un canapé anthracite") → valide.
- Then : Une re-passe 2 (mobilier uniquement) est déclenchée sur le résultat de la passe 1 existant. Le compteur d'itérations décrémente de 1. Le résultat s'affiche dans le comparateur en remplacement.
- Critère d'acceptance : La passe 1 (surfaces) n'est JAMAIS relancée. Seule la passe 2 est répétée.

**US-F1-02 — Connaître ses itérations restantes (Thomas)**
- Job-to-be-done : Quand je travaille sur un dossier marchand, je veux savoir combien d'ajustements il me reste avant de décider d'en dépenser un.
- Given : L'utilisateur a généré au moins un résultat.
- When : Il est sur le comparateur de résultats.
- Then : Un badge "X itération(s) restante(s) sur cette photo" est visible sous le bouton "Affiner".
- Critère d'acceptance : Le badge est mis à jour en temps réel après chaque itération consommée. Quand compteur = 0, le bouton "Affiner" est désactivé (grisé) avec tooltip "Itérations épuisées — rechargez un pack".

**US-F1-03 — Garder l'historique des itérations (Claire)**
- Job-to-be-done : Quand j'ai généré 3 versions d'un salon, je veux les montrer à mon client pour qu'il choisisse, pas juste la dernière.
- Given : L'utilisateur a généré 2+ itérations sur la même photo.
- When : Il consulte les résultats.
- Then : Un sélecteur de versions (v1, v2, v3) est affiché. Cliquer sur une version charge le résultat correspondant dans le comparateur.
- Critère d'acceptance : Chaque version conserve son commentaire d'entrée affiché en légende. Le téléchargement HD fonctionne sur chaque version.

**US-F1-04 — Commentaire enrichi automatiquement (tous)**
- Job-to-be-done : Quand j'écris "plus de plantes et des couleurs chaudes", je veux que l'IA comprenne et génère un mobilier cohérent.
- Given : L'utilisateur saisit un commentaire en français.
- When : La requête est envoyée.
- Then : Le commentaire est pré-traité par GPT-4.1-mini (traduction EN + enrichissement) avant injection dans le furniturePrompt de la passe 2. L'utilisateur ne voit pas ce détail.
- Critère d'acceptance : Temps de pre-processing < 1,5s. En cas d'échec GPT-4.1-mini, le commentaire brut est utilisé sans blocage.

---

### F1.2 Wireframes ASCII

**État : Default — Comparateur avec bouton Affiner**
```
┌─────────────────────────────────────────────────────────┐
│  [◄────────────────── Slider avant/après ──────────────►]│
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Version : [v1] [v2]                             │   │
│  │  ← Glisser pour comparer                         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  [ ⬇ Télécharger HD ]  [ ✏ Affiner ce résultat ]       │
│                          2 itérations restantes         │
└─────────────────────────────────────────────────────────┘
```

**État : Modale Affiner**
```
┌──────────────────────────────────────────────┐
│  ✏ Affiner le résultat                    [×]│
│                                              │
│  Décrivez votre ajustement :                 │
│  ┌──────────────────────────────────────┐    │
│  │ Ex : canapé anthracite, tapis        │    │
│  │ berbère, moins de plantes            │    │
│  └──────────────────────────────────────┘    │
│  ⚠ Le style et les surfaces ne changent pas  │
│  Conseil : soyez précis (couleur, matière)   │
│                                              │
│  [Annuler]          [Générer l'ajustement →] │
│  Consommera 1 itération (2 restantes)        │
└──────────────────────────────────────────────┘
```

**État : Loading**
```
┌─────────────────────────────────────────────────────────┐
│  [Image floue — passe 2 en cours...]                    │
│                                                         │
│  ⏳ Ajustement en cours... ~25 secondes                 │
│  "Remplace le canapé par un modèle anthracite"          │
│  [Annuler]                                              │
└─────────────────────────────────────────────────────────┘
```

**État : Error**
```
│  ✗ Génération échouée                                   │
│  Votre itération n'a pas été consommée.                 │
│  [Réessayer]  [Modifier le commentaire]                 │
```

**État : max_iterations_reached**
```
┌─────────────────────────────────────────────────────────┐
│  [◄────────────────── Slider avant/après ──────────────►]│
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ⬇ Télécharger HD    ✏ Affiner ce résultat       │   │
│  │                      [Grisé — non cliquable]      │   │
│  │  0 itération restante                             │   │
│  │  ┌──────────────────────────────────────────┐     │   │
│  │  │ Pour continuer à affiner ce résultat,    │     │   │
│  │  │ rechargez un pack de crédits.            │     │   │
│  │  │ [Voir les offres →]                      │     │   │
│  │  └──────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**État : Plan Gratuit — Affiner désactivé dès le premier résultat**
```
┌─────────────────────────────────────────────────────────┐
│  [◄────────────────── Slider avant/après ──────────────►]│
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ⬇ Télécharger HD    ✏ Affiner ce résultat       │   │
│  │                      [Grisé — non cliquable]      │   │
│  │  Inclus dans le pack Starter et supérieur         │   │
│  │  [Voir les offres →]                              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### F1.3 Règles métier

**Crédits et itérations :**
- Une itération = une re-passe 2 uniquement (pas de re-passe 1). Il existe deux types d'itérations : **restyle** (re-passe 2 complète depuis l'image passe 1 vide) et **adjust** (édition chirurgicale de l'image meublée existante). L'intent est classifié automatiquement par `classifyIterationIntent()` dans `lib/custom-prompt.ts`.
- Chaque photo générée consomme 1 crédit. **Les itérations ne consomment PAS de crédit** (décision fondateur, confirmée dans le code `route.ts` commentaire "Iteration succeeded — no credit consumed").
- Le quota d'itérations disponibles est défini par le tier (voir section 7) : Découverte = 0 itération, Starter (9,90€) = 1, Pro (29€/mois) = 3.
- Les itérations ne sont pas transférables entre photos.
- Si itérations = 0 : bouton "Affiner" grisé, tooltip "Rechargez un pack pour affiner".

**Gestion de l'état :**
- **Mode restyle** : l'image input de la passe 2 = résultat de la passe 1 originale (pièce vide avec surfaces finies). Toutes les modifications précédentes sont réinterprétées depuis zéro.
- **Mode adjust** : l'image input = dernier résultat meublé (`iterationBase` sauvegardé dans Object Storage par `saveIterationBase()`). L'ajustement s'applique sur le mobilier existant — SURGICAL EDIT, modification minimale.
- Le commentaire utilisateur enrichit le furniturePrompt du style sélectionné. Il ne remplace pas le style.
- Le résultat de passe 1 est mis en cache côté serveur (Object Storage) pendant 24h pour permettre les itérations.
- Le dernier résultat meublé est sauvegardé séparément (`iterationBase`) pour les itérations adjust.
- La classification intent (adjust vs restyle) est faite par `classifyIterationIntent()` qui analyse le commentaire (ex : "enlever", "remplacer" → adjust ; "tout changer", "style différent" → restyle).

**Sans authentification (MVP) :**
- Les itérations sont trackées par sessionId (cookie ou localStorage UUID).
- Si sessionId perdu → itérations perdues. Ce comportement est documenté dans l'UI ("sauvegardez votre résultat avant de fermer").

---

### F1.4 Edge cases

1. **Commentaire vide** : Le bouton "Générer" est désactivé tant que le champ est vide (validation front).
2. **Commentaire contenant des éléments structurels** (ex. "ajoute une fenêtre") : GPT-4.1-mini filtre et affiche un warning : "Les modifications structurelles (fenêtres, murs, portes) ne sont pas supportées en mode affinage."
3. **Commentaire en langue étrangère** (arabe, chinois, etc.) : GPT-4.1-mini traduit en EN et traite normalement.
4. **Passe 1 expirée (>24h)** : Le bouton "Affiner" est désactivé avec message "Les surfaces de cette génération ont expiré. Regénérez depuis l'image originale."
5. **Timeout passe 2 (>90s)** : L'itération n'est PAS consommée (rollback compteur). Message : "Temps de génération dépassé. Votre itération a été conservée."
6. [NON APPLICABLE — Flux Depth Pro supprimé] Le modèle unique est `gpt-image-1.5` via Responses API. Aucun fallback Flux/SDXL. En cas d'échec, 1 retry automatique avec prompt simplifié (si rejet safety system), sinon message d'erreur et invitation à réessayer. Voir `simplifyPromptForSafetyRetry()` dans `route.ts`.
7. **Commentaire demandant d'effacer tous les meubles** (ex. "pièce vide") : GPT-4.1-mini détecte et affiche : "Cette action n'est pas possible en mode affinage. Pour changer radicalement de style, regénérez depuis le début."

---

### F1.5 Events tracking

| Event name | Properties | Trigger |
|---|---|---|
| `iteration_started` | `{ style_id, iteration_number, comment_length, session_id }` | Clic "Générer l'ajustement" |
| `iteration_comment_submitted` | `{ comment_raw_length, enriched: bool, language_detected }` | Validation commentaire |
| `iteration_completed` | `{ style_id, iteration_number, duration_ms, model_used, success: bool }` | Fin de génération |
| `iteration_failed` | `{ reason: 'timeout' | 'api_error' | 'fallback_failed', iteration_number }` | Erreur génération |
| `iteration_limit_reached` | `{ package_type, style_id }` | Affichage tooltip "épuisées" |
| `iteration_version_viewed` | `{ version_number, style_id }` | Clic sur sélecteur de version |
| `iteration_downloaded` | `{ version_number, style_id }` | Téléchargement HD d'une version |

---

### F1.6 Dépendances

- **Technique** : Object Storage (Replit) pour cacher le résultat passe 1 (clé = `sessions/{sessionId}/{photoIndex}/pass1.jpg`). TTL 24h.
- **Technique** : Endpoint `/api/preprocess-prompt` (déjà en place, Sprint 17) — réutilisé pour enrichir le commentaire.
- **Technique** : `/api/generate` doit accepter un param `pass1_key` (clé Object Storage) pour sauter la passe 1.
- **Technique** : Système de sessionId (cookie ou localStorage UUID) pour tracker les itérations sans auth.
- **Produit** : F1 dépend du pipeline 2 passes (déjà en place). Pas de dépendance à F2-F5.
- **Produit** : Le système de packages crédits (section 7) doit être défini avant l'implémentation des limites d'itérations.

---

### F1.7 Performance

- Pre-processing commentaire (GPT-4.1-mini) : < 1,5s
- Classif. intent (GPT-4.1-mini) : < 1s
- Re-passe 2 gpt-image-1.5 (Responses API) : < 60s (pas de passe 1 = plus rapide)
- [SUPPRIMÉ] Fallback Flux Depth Pro — modèle unique gpt-image-1.5
- Chargement résultat comparateur : < 1s (image depuis Object Storage)
- SLA cible itération complète : < 65s (P95)
- Retry automatique en cas de rejet safety : +2s délai, prompt simplifié

---

## F2 — Type de pièce

Sélecteur de pièce (8 types) enrichissant le prompt de génération.

### F2.1 User Stories

**US-F2-01 — Sélectionner le type de pièce pour un résultat adapté (Claire)**
- Job-to-be-done : Quand je génère un visuel de salle de bain, je ne veux pas que l'IA mette un canapé et une table basse.
- Given : L'utilisateur est à l'étape 2 (choix de style).
- When : Il sélectionne "Salle de bain" dans le sélecteur de type de pièce.
- Then : Le furniturePrompt injecte automatiquement le mobilier approprié (vasque, miroir, tablette, plantes). Le surfacePrompt adapte les finitions (carrelage mural, sol étanche).
- Critère d'acceptance : Pour chaque type, des blocs `roomFurnitureOverride` et `roomSurfaceOverride` sont définis. Le résultat ne contient jamais de canapé dans une salle de bain.

**US-F2-02 — Améliorer la pertinence pour les cuisines (Thomas)**
- Job-to-be-done : Quand j'uploade une cuisine brute pour ma plaquette, je veux un visuel de cuisine équipée.
- Given : L'utilisateur sélectionne "Cuisine" comme type de pièce.
- When : La génération est lancée.
- Then : Le prompt inclut plan de travail, crédence, appareils encastrés. La passe 1 cible carrelage ou parquet résistant.
- Critère d'acceptance : Le résultat est notablement différent d'un salon pour la même image d'entrée.

**US-F2-03 — Détection automatique optionnelle (Léa)**
- Job-to-be-done : Quand j'uploade une photo de ma chambre, je ne veux pas avoir à préciser que c'est une chambre.
- Given : L'utilisateur uploade une photo sans sélectionner de type.
- When : L'upload est terminé.
- Then : GPT-4.1-mini analyse l'image et propose un type détecté ("On dirait un salon — continuer avec ce type ?"). L'utilisateur peut confirmer ou ignorer.
- Critère d'acceptance : La détection est proposée en option, jamais imposée. Ignorer = comportement actuel (aucun override de prompt).

---

### F2.2 Wireframes ASCII

**État : Default — Sélecteur dans l'étape Style**
```
┌──────────────────────────────────────────────────────────┐
│  Type de pièce (optionnel)                               │
│                                                          │
│  [Salon]  [Chambre]  [Salle de bain]  [Cuisine]         │
│  [Bureau]  [Entrée]  [Salle à manger]  [Buanderie]       │
│                                                          │
│  Aucun sélectionné → style générique appliqué            │
└──────────────────────────────────────────────────────────┘
```

**État : Sélection active**
```
│  [Salon ✓]  [Chambre]  [Salle de bain]  ...             │
│  → Mobilier adapté : canapé, table basse, tapis, TV      │
```

**État : Auto-détection proposée**
```
│  💡 On dirait un salon — confirmer ?  [Oui] [Non merci]  │
```

**État : Conflit type / image**
```
│  ⚠ L'image ressemble à un salon mais vous avez          │
│  sélectionné "Cuisine".                                  │
│  [Changer]  [Continuer avec Cuisine]                     │
```

---

### F2.3 Règles métier

- Le type de pièce est un **enrichissement additif** : il ajoute des blocs de prompt, ne remplace pas le style choisi.
- 8 types disponibles : Salon (défaut si rien), Chambre, Salle de bain, Cuisine, Bureau, Entrée, Salle à manger, Buanderie.
- Si aucun type sélectionné : aucun override injecté, comportement actuel.
- Chaque type définit dans `lib/room-types.ts` :
  - `roomSurfaceOverride` : finitions de sol/mur adaptées (ex. cuisine → "ceramic floor tiles, subway tile splashback").
  - `roomFurnitureOverride` : mobilier et accessoires spécifiques (ex. chambre → "upholstered double bed 160cm wide, two matching bedside tables, wardrobe with sliding mirror doors").
- Salle de bain et Cuisine : negative prompt additionnel "sofa, coffee table, TV unit, floor lamp" pour la passe 2.
- Buanderie : `roomSurfaceOverride` contient sol résine ou carrelage blanc, `roomFurnitureOverride` = machine à laver encastrée, meuble de rangement haut, bac à linge.
- Le `roomType` est transmis dans le body `/api/generate`. Si `null` = aucun override.

---

### F2.4 Edge cases

1. **Type "Cuisine" + style "Wabi-Sabi"** : Combinaison valide. Les deux blocs sont concaténés. Pas de blocage.
2. **Image multi-espace** (cuisine ouverte sur salon) : L'utilisateur sélectionne le type principal. Pas de gestion d'espaces multiples en V1. Message informatif : "Cette feature gère une seule pièce à la fois."
3. **Buanderie sans fenêtre** : Aucune directive lumière naturelle. "Preserve existing lighting" s'applique. Pièce sombre = résultat sombre = acceptable.
4. **Type sélectionné mais image illisible** : La validation `lib/image-utils.ts` bloque avant même le sélecteur. L'utilisateur ne peut pas sélectionner de type sur une image invalide.
5. **Custom prompt + type de pièce** : GPT-4.1-mini reçoit `roomType` + texte custom. Il filtre les éléments du custom incompatibles avec le type (ex. "canapé" dans un custom pour une cuisine).
6. **Buanderie + style "Art Déco"** : Combinaison incohérente mais techniquement possible. Pas de blocage. Résultat potentiellement décalé — la responsabilité appartient à l'utilisateur.

---

### F2.5 Events tracking

| Event name | Properties | Trigger |
|---|---|---|
| `room_type_selected` | `{ room_type, style_id, auto_detected: bool }` | Clic sur un type de pièce |
| `room_type_cleared` | `{ previous_type, style_id }` | Clic sur le type déjà sélectionné (déselection) |
| `room_type_auto_proposed` | `{ detected_type, confidence: 'high'|'low' }` | Fin d'analyse auto-détection |
| `room_type_auto_confirmed` | `{ detected_type }` | Clic "Oui" sur proposition auto |
| `room_type_auto_dismissed` | `{ detected_type }` | Clic "Non merci" |
| `room_type_conflict_overridden` | `{ selected_type, detected_type }` | Confirmation malgré conflit |

---

### F2.6 Dépendances

- **Technique** : Création de `lib/room-types.ts` (8 types × 2 blocs de prompt).
- **Technique** : Ajout du champ `roomType: string | null` dans le body `/api/generate`.
- **Technique** : `route.ts` concatène `roomSurfaceOverride` à `surfacePrompt` (passe 1) et `roomFurnitureOverride` à `furniturePrompt` (passe 2).
- **Technique** : `/api/preprocess-prompt` mis à jour pour recevoir `roomType` et filtrer les éléments custom incompatibles.
- **UX** : Le sélecteur s'insère dans l'étape 2 (StylePicker) comme panneau optionnel au-dessus ou en dessous du choix de style.
- **Produit** : F2 est indépendant de F1, F3, F4, F5.

---

### F2.7 Performance

- Sélection type : 0ms (client only).
- Auto-détection (background, GPT-4.1-mini) : < 2s, déclenché après upload sans bloquer l'utilisateur.
- Injection override dans le prompt : 0ms additionnel (concaténation côté serveur).
- Aucun impact sur la latence de génération.

---

## F3 — Extérieur

Terrasse, balcon, patio, jardin, rooftop. Pipeline sans plafond. Mobilier outdoor.

### F3.1 User Stories

**US-F3-01 — Générer un visuel de terrasse meublée (Thomas)**
- Job-to-be-done : Quand je vends un appartement avec une grande terrasse brute, je veux montrer son potentiel estival à l'acquéreur sans payer un home stager.
- Given : L'utilisateur uploade une photo de terrasse/balcon vide, sélectionne le toggle "Extérieur" et le sous-type "Terrasse".
- When : Il choisit un style outdoor et lance la génération.
- Then : Le pipeline génère un visuel avec mobilier outdoor weatherproof (salon de jardin résine tressée ou teck huilé, parasol déporté, plantes en pot, lanternes posées). La passe 1 traite le sol terrasse (dalles, bois composite) et préserve les garde-corps existants. La passe 2 ajoute le mobilier outdoor freestanding.
- Critère d'acceptance : Aucun meuble indoor dans le résultat. Le ciel visible est préservé. Le garde-corps original n'est pas modifié ni supprimé.

**US-F3-02 — Choisir parmi des styles outdoor adaptés (Léa)**
- Job-to-be-done : Quand j'ai un balcon parisien de 6m², je veux voir des idées de déco minimaliste adaptées à la contrainte de taille — pas un salon de jardin 4 places impossible à installer.
- Given : L'utilisateur est en mode Extérieur, sous-type "Balcon".
- When : Il parcourt les styles disponibles.
- Then : Les 6 styles outdoor sont affichés (Contemporain Outdoor, Méditerranéen, Bohème Garden, Minimaliste Urbain, Rooftop, Cosy Balcon). Les 12 styles intérieurs sont masqués. Le style "Cosy Balcon" impose automatiquement du mobilier compact (table bistrot 60cm, 2 chaises pliantes, 1 plante haute).
- Critère d'acceptance : 6 styles outdoor minimum. Chaque style a un `surfacePrompt` et `furniturePrompt` outdoor distincts, sans aucune mention de plafond, luminaire suspendu ou meuble indoor.

**US-F3-03 — Pipeline sans contrainte de plafond (tous)**
- Job-to-be-done : Quand je génère un visuel de jardin ou rooftop, l'IA ne doit pas inventer un plafond, une peinture murale intérieure ou un luminaire suspendu.
- Given : L'utilisateur lance une génération en mode Extérieur (tout sous-type).
- When : La passe 1 et la passe 2 s'exécutent dans `route.ts`.
- Then : Les builders détectent `isOutdoor: true` et court-circuitent les directives "preserve ceiling geometry", "ceiling light fixture" et "wall paint color". Ils injectent à la place "open-air space — no ceiling, sky preserved as-is" en tête des deux prompts.
- Critère d'acceptance : Aucun plafond inventé en passe 1 ou 2. Aucun luminaire de plafond outdoor inventé.

**US-F3-04 — Alerter si photo intérieure uploadée en mode Extérieur (tous)**
- Job-to-be-done : Quand je me trompe de mode, je veux être alerté avant de consommer un crédit inutilement.
- Given : L'utilisateur est en mode Extérieur et uploade une photo visiblement intérieure (plafond visible, murs peints, absence de ciel).
- When : L'upload est terminé (analyse GPT-4.1-mini en background, < 2s, non bloquante).
- Then : Un bandeau d'alerte s'affiche : "Cette photo semble être une pièce intérieure. Basculer en mode Intérieur ?" avec [Basculer] [Continuer en Extérieur]. Si l'utilisateur bascule, le toggle est mis à jour et les styles outdoor sont remplacés par les styles intérieurs.
- Critère d'acceptance : L'alerte n'est jamais bloquante. L'utilisateur peut continuer en mode Extérieur malgré l'alerte. Le crédit n'est jamais consommé avant le clic explicite sur "Générer".

---

### F3.2 Wireframes ASCII

**État : Toggle Intérieur / Extérieur (étape 2 — au-dessus du sélecteur de style)**
```
┌──────────────────────────────────────────────────────────┐
│  Type d'espace                                           │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │    Intérieur     │  │   Extérieur  ←   │ (actif)      │
│  └──────────────────┘  └──────────────────┘              │
│                                                          │
│  Sous-type outdoor :                                     │
│  [Terrasse ✓]  [Balcon]  [Patio]  [Jardin]  [Rooftop]   │
│   ^^^^^^^^ surligné sage #7D9B76                         │
└──────────────────────────────────────────────────────────┘
```

**État : Grille des 6 styles outdoor**
```
┌──────────────────────────────────────────────────────────┐
│  Ambiance outdoor                                        │
│                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │Contemporain │ │Méditerranéen│ │Bohème Garden│        │
│  │  Outdoor    │ │             │ │             │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │Minimaliste  │ │   Rooftop   │ │Cosy Balcon  │        │
│  │  Urbain     │ │             │ │             │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                          │
│  Les 12 styles intérieur ne s'affichent pas ici          │
└──────────────────────────────────────────────────────────┘
```

**État : Alerte photo intérieure détectée en mode Extérieur**
```
┌──────────────────────────────────────────────────────────┐
│  ⚠ Cette photo semble être une pièce intérieure.         │
│  Basculer en mode Intérieur pour un meilleur résultat ?  │
│                                                          │
│  [Basculer en Intérieur]    [Continuer en Extérieur]     │
└──────────────────────────────────────────────────────────┘
```

**État : Loading outdoor (2 passes avec labels adaptés)**
```
┌──────────────────────────────────────────────────────────┐
│  [Photo floue — génération outdoor en cours...]          │
│                                                          │
│  ⏳ Aménagement Méditerranéen — Terrasse                 │
│  Passe 1 : sol dalles + façades ... ~20s                 │
│  Passe 2 : mobilier outdoor ... ~20s                     │
│                                                          │
│  [Annuler]                                               │
└──────────────────────────────────────────────────────────┘
```

**État : Résultat outdoor dans le comparateur**
```
┌──────────────────────────────────────────────────────────┐
│  [◄─────── Comparateur avant/après outdoor ────────────►]│
│                                                          │
│  Terrasse — Méditerranéen                                │
│                                                          │
│  [ ⬇ Télécharger HD ]   [ ✏ Affiner ]   [ Partager ]   │
└──────────────────────────────────────────────────────────┘
```

---

### F3.3 Règles métier

**Toggle et sous-types :**
- Le mode Extérieur est sélectionné via un toggle "Intérieur / Extérieur" en tête du sélecteur de style (étape 2). Valeur par défaut : Intérieur.
- 5 sous-types : Terrasse, Balcon, Patio, Jardin, Rooftop. Chaque sous-type injecte un bloc de prompt additif défini dans `lib/outdoor-subtypes.ts`.
- Sous-type "Balcon" : ajoute au furniturePrompt "compact furniture only — bistro table 60cm, folding chairs, no large garden sets, no sun loungers".
- Sous-type "Jardin" : ajoute "preserve all existing trees, grass, hedges — add furniture in foreground only, do not alter background vegetation".
- Sous-type "Rooftop" : ajoute aux deux passes "preserve skyline, horizon line and parapet walls exactly as in the input — do not invent new guard rails".
- Sous-type "Patio" : ajoute "enclosed outdoor space, partial shade, stone or tile ground — preserve any existing walls or arches".

**Pipeline outdoor — différences structurelles vs indoor :**

Les builders de `route.ts` détectent `isOutdoor: true` dans le body de la requête et appliquent les substitutions suivantes :
- Suppression des directives "preserve ceiling geometry", "ceiling light fixture", "wall paint color".
- Injection en tête des deux prompts : "open-air space — no ceiling, sky preserved as-is".
- Suppression de toute directive de luminaire (plafond ou suspendu).
- Passe 1 cible : revêtement de sol extérieur uniquement (dalles pierre naturelle, bois composite, béton ciré extérieur, grès cérame antidérapant). Garde-corps, murets et façades existants PRESERVÉS ("do not alter guard rails, exterior walls or facades").
- Passe 2 cible : mobilier outdoor freestanding uniquement. Aucun objet suspendu. Aucun élément fixé au sol ou aux murs.

**Catalogue des 6 styles outdoor (défini dans `lib/outdoor-styles.ts`) :**

| Style | surfacePrompt (résumé) | furniturePrompt (résumé) |
|---|---|---|
| Contemporain Outdoor | Dalles béton gris clair lissé, garde-corps acier inox | Canapé modulaire anthracite résine, table basse verre trempé, lanternes LED posées au sol |
| Méditerranéen | Carrelage grès cérame ocre ou tomettes terre cuite, muret pierre | Table fer forgé blanc 120cm, 4 chaises bistrot, 2 pots d'olivier, pergola apparente |
| Bohème Garden | Dalles grès récupéré irrégulier, graviers blancs | Poufs extérieur imperméables, tapis outdoor jute, plantes tropicales, guirlande solaire |
| Minimaliste Urbain | Béton ciré extérieur gris, joints millimétriques | 2 chaises longues teck naturel, table basse rectangle en béton fibré, 1 plante haute pot béton |
| Rooftop | Lames bois IPE gris argenté, garde-corps corten préservé | Banquette modulaire imperméable gris charbon, parasol déporté noir, vue sur ville préservée |
| Cosy Balcon | Lames bois composite chaud 120mm, garde-corps existant préservé | Table bistrot ronde 60cm zinc, 2 chaises métal pliantes, 1 plante haute, guirlande LED posée |

**Negative prompt outdoor (ajouté automatiquement en passe 2, dans FLUX_NEGATIVE_PROMPT et OpenAI prompt) :**
- "indoor sofa, area rug, floor lamp, ceiling light, chandelier, curtains, drapes, wallpaper, baseboard, interior door, radiator, electrical outlet, kitchen appliances"

**Coût crédit :**
- 1 crédit / photo, identique à l'intérieur. Le mode Extérieur n'est pas une feature premium séparée.
- Les itérations (F1) fonctionnent en mode Extérieur avec la même logique (re-passe 2 sur le résultat de passe 1 outdoor).

---

### F3.4 Edge cases

1. **Photo avec ciel très surexposé (ciel blanc grillé)** : La directive "preserve highlights — do not recover blown-out sky" s'applique. Le résultat peut avoir un ciel blanc — acceptable. Ne pas inventer un ciel bleu absent de l'original.
2. **Balcon de 4m² avec sous-type "Rooftop" sélectionné par erreur** : Combinaison incohérente. Pas de blocage côté système, mais le furniturePrompt Rooftop (banquette modulaire, parasol déporté) produit un résultat impraticable. Recommandation UX : le sous-type "Rooftop" affiche un tag "Grands espaces" pour guider l'utilisateur.
3. **Jardin avec arbres existants en arrière-plan** : La passe 1 ne touche pas à la végétation. Directive explicite "preserve all existing trees, hedges and lawn — only update ground surface in the foreground zone". La passe 2 ajoute du mobilier au premier plan uniquement. Risque résiduel : le modèle peut coloriser légèrement la végétation pour cohérence colorimétrique — acceptable.
4. **Rooftop avec garde-corps spécifique (corten, verre, inox)** : La directive "preserve guard rails and parapet walls exactly as in the input" est prioritaire. Le modèle ne doit ni supprimer ni remplacer le matériau du garde-corps. [NOTE : Flux Depth Pro supprimé — modèle unique gpt-image-1.5.]
5. **Patio avec murs intérieurs partiels (mi-intérieur, mi-extérieur)** : Les murs du patio sont traités comme des façades extérieures (pas de peinture intérieure). Si le mode Extérieur est actif, les directives "wall paint color" ne s'appliquent pas, même si des murs sont visibles.
6. **Custom prompt en mode Extérieur** : GPT-4.1-mini reçoit `isOutdoor: true` dans son system prompt. Il filtre automatiquement les éléments indoor du texte custom (canapé, parquet, lustre) et les remplace par des équivalents outdoor (canapé d'extérieur résine, dalles, lanterne). Un warning FR est affiché si des substitutions sont faites.
7. **Mode Extérieur + F2 Type de pièce actif simultanément** : F2 (sélecteur de type de pièce intérieure) est masqué en mode Extérieur. Si l'utilisateur bascule de Intérieur vers Extérieur avec un type de pièce déjà sélectionné, le type est désélectionné automatiquement (pas d'override de pièce indoor en mode outdoor).
8. **Photo de nuit (terrasse éclairée artificiellemement)** : La directive "preserve existing lighting conditions" s'applique normalement. Le furniturePrompt peut inclure des lanternes et bougies (cohérents avec une ambiance nocturne). Ne pas forcer une lumière diurne absente de l'original.

---

### F3.5 Events tracking

| Event name | Properties | Trigger |
|---|---|---|
| `outdoor_mode_activated` | `{ previous_mode: 'indoor' }` | Premier clic sur toggle Extérieur |
| `outdoor_mode_deactivated` | `{ subtype_was: string }` | Retour au mode Intérieur |
| `outdoor_subtype_selected` | `{ subtype: 'terrasse'|'balcon'|'patio'|'jardin'|'rooftop' }` | Clic sur sous-type outdoor |
| `outdoor_style_selected` | `{ style_id, subtype }` | Clic sur style outdoor |
| `outdoor_generation_started` | `{ style_id, subtype, photo_count, custom_prompt: bool }` | Clic Générer en mode Extérieur |
| `outdoor_generation_completed` | `{ style_id, subtype, duration_ms, model_used, success: bool }` | Fin de génération outdoor |
| `outdoor_generation_failed` | `{ style_id, subtype, reason: 'timeout'|'api_error'|'fallback_failed' }` | Erreur génération outdoor |
| `outdoor_indoor_conflict_detected` | `{ subtype, confidence: 'high'|'low' }` | GPT-4.1-mini détecte photo indoor |
| `outdoor_indoor_conflict_switched` | `{ subtype }` | Clic "Basculer en Intérieur" après alerte |
| `outdoor_indoor_conflict_dismissed` | `{ subtype }` | Clic "Continuer en Extérieur" malgré alerte |
| `outdoor_custom_prompt_filtered` | `{ items_removed_count, style_id }` | GPT-4.1-mini a supprimé des éléments indoor du custom |

---

### F3.6 Dépendances

- **Technique** : Création de `lib/outdoor-styles.ts` — 6 styles outdoor, chacun avec `surfacePrompt` et `furniturePrompt` distincts (aucune mention de plafond, luminaire suspendu, ou meuble indoor).
- **Technique** : Création de `lib/outdoor-subtypes.ts` — 5 sous-types, chacun avec un bloc de prompt additif (blocs courts, < 20 mots, injectés en fin de surfacePrompt et furniturePrompt).
- **Technique** : `route.ts` — ajout du paramètre `isOutdoor: bool` dans le body. Si `true` : les builders court-circuitent les directives plafond, luminaire et peinture murale. Le negative prompt outdoor est ajouté à la passe 2.
- **Technique** : `StylePicker.tsx` — toggle Intérieur/Extérieur (état React local). Mode Extérieur affiche la grille des 6 styles outdoor et masque les 12 styles intérieurs. Le sous-type sélectionné est transmis dans le body via `outdoorSubtype`.
- **Technique** : `/api/preprocess-prompt` — le system prompt de GPT-4.1-mini est mis à jour pour recevoir `isOutdoor: true` et filtrer les éléments indoor des prompts custom en mode Extérieur.
- **Technique** : `app/page.tsx` — transmission de `isOutdoor` et `outdoorSubtype` dans le body du fetch `/api/generate`.
- **Produit** : F3 est indépendant de F1 (itérations outdoor fonctionnent). F3 et F2 (type de pièce) sont mutuellement exclusifs en UI — masquage du sélecteur F2 en mode Extérieur. F3 partage la logique de toggle de F2.
- **Produit** : F3 peut être implémenté après F2 sans dépendance de planning.

---

### F3.7 Performance

- Pipeline outdoor = même latence que indoor : < 120s total P95 (2 passes gpt-image-1.5 Responses API).
- [SUPPRIMÉ] Fallback Flux Depth Pro — modèle unique gpt-image-1.5 via OpenAI Responses API.
- Toggle Extérieur/Intérieur : instantané (client only, 0ms serveur).
- Détection photo intérieure en mode Extérieur (GPT-4.1-mini) : < 2s, déclenché après upload en background sans bloquer l'étape 2.
- Aucune requête supplémentaire au moment de la génération : toute la logique outdoor est une substitution de prompt côté serveur, sans surcoût de latence.

---

## F4 — Mode Pro (ex Mode Marchand)

> **Renommage (2026-03-27) :** "Mode Marchand" → "Mode Pro" partout. Le terme "Marchand" était réducteur. "Pro" couvre tous les professionnels récurrents (architectes, marchands de biens, agences).
> **Renommage (2026-03-27) :** "Dossiers PDF avant/après" → "Dossiers de pré-commercialisation" — terminologie professionnelle.
> **Modèle économique mis à jour (2026-03-27) :** Le Mode Pro n'est plus facturé 29€/dossier. Il est inclus dans l'**Abonnement Pro 29€/mois**.

Upload bien complet → Dossier de pré-commercialisation PDF + lien partageable acquéreurs sans limite. Max 15 photos.

### F4.1 User Stories

**US-F4-01 — Créer un dossier de pré-commercialisation complet (Thomas)**
- Job-to-be-done : Quand j'achète un bien avec 8 pièces brutes, je veux créer un dossier de pré-commercialisation "après travaux + meublé" en une seule session, sans traiter chaque photo individuellement.
- Given : L'utilisateur est abonné Pro et est en Mode Pro. Il uploade jusqu'à 15 photos du même bien.
- When : Il sélectionne un style global, un type de bien (appartement, maison, loft) et lance la génération batch.
- Then : Toutes les photos sont traitées en parallèle (max 3 concurrent). Un dossier de pré-commercialisation est créé avec la vue avant/après de chaque pièce. Un PDF est généré et un lien partageable est créé sans limite de durée.
- Critère d'acceptance : Le PDF contient toutes les photos (avant + après côte à côte), le nom du bien, la date, et les infos renseignées par l'utilisateur (adresse, surface, prix). Le lien partageable n'a pas de TTL tant que l'abonnement Pro est actif.

**US-F4-02 — Partager le dossier de pré-commercialisation avec des acquéreurs (Thomas)**
- Job-to-be-done : Quand je veux envoyer mon dossier de pré-commercialisation à un acquéreur potentiel, je veux un lien propre, pas une pièce jointe de 50 Mo.
- Given : Le dossier de pré-commercialisation est généré. L'utilisateur est abonné Pro actif.
- When : L'utilisateur clique sur "Partager le dossier".
- Then : Un lien unique est généré (ex. `versimo.app/dossier/abc123`). Le lien affiche une page web légère avec les visuels avant/après et les infos du bien. Pas de login requis pour consulter.
- Critère d'acceptance : Le lien est valide sans limite de durée tant que l'abonnement Pro est actif (vs 30j pour les packs one-shot). La page est mobile-friendly. Un bouton "Télécharger le PDF" est présent.

**US-F4-03 — Choisir le style pièce par pièce (Thomas avancé)**
- Job-to-be-done : Quand le salon mérite un style "Contemporain" et la chambre un style "Cosy", je veux pouvoir différencier.
- Given : L'utilisateur est en Mode Pro avec plusieurs photos uploadées.
- When : Il clique sur une photo individuelle avant de lancer la génération batch.
- Then : Il peut assigner un style différent à chaque photo. Un style global est appliqué par défaut ; les photos sans style spécifique héritent du global.
- Critère d'acceptance : L'interface affiche un badge de style sur chaque vignette. Le style individuel peut être modifié ou réinitialisé au style global.

---

### F4.2 Wireframes ASCII

**État : Upload batch mode Pro**
```
┌──────────────────────────────────────────────────────────┐
│  Mode Pro — Dossier de pré-commercialisation             │
│                                                          │
│  Infos du bien :                                         │
│  [Nom/Adresse_____________]  [Surface : ___m²]           │
│  [Prix de vente : ___€]                                  │
│                                                          │
│  Photos du bien (max 15)                                 │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                              │
│  │P1│ │P2│ │P3│ │P4│ │+11│                              │
│  └──┘ └──┘ └──┘ └──┘ └──┘                              │
│  Chaque photo : [Salon ▼] [Contemporain ▼]               │
│                                                          │
│  Style global : [Contemporain ▼]                         │
│                                                          │
│  [Générer le dossier complet →]  (15 crédits)           │
└──────────────────────────────────────────────────────────┘
```

**État : Génération batch en cours**
```
┌──────────────────────────────────────────────────────────┐
│  Génération en cours : 4/15 photos                       │
│  ████████░░░░░░░░░░░░░░░  27%                            │
│                                                          │
│  ✓ Salon            ✓ Chambre 1                          │
│  ⏳ Cuisine (45s)    ⏳ Salle de bain (en attente)       │
│  ○ Chambre 2  ○ Bureau  ○ Entrée  ...                    │
│                                                          │
│  Temps estimé restant : ~8 min                           │
└──────────────────────────────────────────────────────────┘
```

**État : Dossier généré**
```
┌──────────────────────────────────────────────────────────┐
│  Dossier prêt — Appartement T4 Lyon 6e                  │
│                                                          │
│  [Avant] [Après] ← slider pour chaque pièce             │
│  Salon | Cuisine | Chambre 1 | ...                       │
│                                                          │
│  [ ⬇ Télécharger le PDF (15 pages) ]                    │
│  [ 🔗 Copier le lien partageable ]                       │
│  [ ✏ Regénérer une photo ]                              │
└──────────────────────────────────────────────────────────┘
```

---

### F4.3 Règles métier

- **Accès** : Mode Pro disponible uniquement pour les **abonnés Pro actifs** (29€/mois). Les packs one-shot (Découverte, Starter) n'y donnent pas accès. Vérification côté serveur via statut Stripe subscription.
- **Volume** : Max 15 photos par dossier de pré-commercialisation. Chaque photo consomme 1 crédit sur le quota mensuel. Un dossier de 15 photos = 15 crédits.
- **Traitement** : Max 3 photos en parallèle (limite API + coût). Les autres photos attendent en queue.
- **PDF** : Généré côté serveur (bibliothèque à définir : `pdf-lib` ou `puppeteer`). Contenu : page de couverture (nom, adresse, surface, prix, date, mention "Dossier de pré-commercialisation — Simulation générée par IA"), puis 1 page par pièce (avant à gauche, après à droite, légende style).
- **Lien partageable** : UUID unique, stocké en DB avec référence aux images Object Storage. **Sans TTL tant que l'abonnement Pro est actif** (vs 30j pour les packs one-shot). Si l'abonnement expire : le lien affiche "Ce dossier n'est plus accessible. Contactez l'auteur." Pas de login pour consulter.
- **Infos du bien** : Nom/adresse, surface (m²), prix (€). Ces champs sont optionnels pour la génération mais obligatoires pour le PDF.
- **Regénération individuelle** : Chaque photo peut être regénérée individuellement après le batch (consomme 1 crédit supplémentaire sur le quota mensuel).
- **Style global vs individuel** : Style global appliqué par défaut. Override par photo possible. Styles intérieur et extérieur mixables.

---

### F4.4 Edge cases

1. **Crédit insuffisant en cours de batch** : Si le crédit manque à la photo N, les photos N+1 à 15 ne sont pas générées. Un message indique "Crédits insuffisants après 8 photos. Rechargez pour continuer." Les 8 photos générées sont conservées dans le dossier partiel.
2. **Timeout sur une photo du batch** : La photo concernée est marquée "Échec". Le batch continue pour les autres. L'utilisateur peut regénérer la photo individuelle.
3. **15 photos identiques** : Techniquement possible. Pas de blocage. Le dossier aura 15 fois le même avant/après. L'utilisateur est responsable de la pertinence.
4. **PDF de 15 photos** : Taille estimée 10-20 Mo. Un bouton "Télécharger images ZIP" est proposé en alternative si le PDF dépasse 25 Mo.
5. **Lien expiré (>30 jours)** : La page affiche "Ce dossier a expiré. Contactez l'auteur pour le renouveler." Pas de régénération automatique.
6. **Mode Marchand + photos extérieures** : Possible. L'utilisateur peut mixer intérieur et extérieur dans le même dossier.
7. **Infos bien non renseignées** : PDF généré avec "Bien sans titre — [date]". Pas de blocage.

---

### F4.5 Events tracking

| Event name | Properties | Trigger |
|---|---|---|
| `pro_mode_started` | `{ photo_count, global_style_id }` | Clic "Générer le dossier" |
| `pro_batch_photo_completed` | `{ photo_index, style_id, duration_ms, success: bool }` | Fin de génération d'une photo |
| `pro_batch_completed` | `{ total_photos, success_count, fail_count, total_duration_ms }` | Fin du batch complet |
| `pro_pdf_downloaded` | `{ photo_count, bien_info_filled: bool }` | Téléchargement dossier de pré-commercialisation PDF |
| `pro_link_copied` | `{ dossier_id, photo_count }` | Copie du lien partageable acquéreurs |
| `pro_shared_link_visited` | `{ dossier_id, source: 'direct'|'whatsapp'|'email' }` | Visite page dossier public |
| `pro_photo_regenerated` | `{ photo_index, style_id }` | Regénération individuelle |

---

### F4.6 Dépendances

- **Auth (bloquant)** : Le Mode Pro nécessite une auth complète (abonnement Stripe actif vérifié côté serveur). Sans auth, accès refusé. L'abonnement Pro est la clé d'accès — pas de magic link seul.
- **Technique** : Nouvelle table DB `dossiers` (uuid, session_id, bien_info JSON, photos JSON, pdf_path, created_at, expires_at).
- **Technique** : Génération PDF côté serveur (`pdf-lib` ou `puppeteer`). Les images sont récupérées depuis Object Storage.
- **Technique** : Nouvelle route `/dossier/[uuid]` (page Next.js publique, no auth, SSR ou SSG avec revalidation).
- **Technique** : `/api/generate` batch : gestion de queue avec max 3 concurrent (existant `Promise.allSettled` à étendre).
- **Produit** : F4 dépend de F2 (type de pièce par photo). F4 est indépendant de F1, F3, F5.
- **Coût** : 15 photos × 2 passes × ~0,09€ = ~2,70€ de coût API par dossier complet.

---

### F4.7 Performance

- Génération batch 15 photos (3 concurrent) : ~20-30 minutes (15 × 90s / 3 = 7,5 min théorique, +marge erreurs).
- Génération PDF (serveur) : < 10s pour 15 pages.
- Chargement page dossier partageable : < 2s (images depuis CDN Object Storage).
- Queue status (polling) : mise à jour toutes les 5s côté client (ou WebSocket si disponible).

---

## F5 — Mode décorateur

Produits réels (IKEA, Leroy Merlin). Shopping list avec prix/liens. Export PDF/web.

### F5.1 User Stories

**US-F5-01 — Voir quels produits réels composent le visuel (Léa)**
- Job-to-be-done : Quand je vois un canapé gris dans mon visuel Scandinave, je veux savoir si c'est disponible chez IKEA et combien ça coûte.
- Given : L'utilisateur a un résultat généré. Il active le mode Décorateur.
- When : Il clique sur "Voir les produits".
- Then : Une shopping list est générée par GPT-4.1 à partir du furniturePrompt utilisé : nom du produit, description courte, prix estimé, lien IKEA/Leroy Merlin/Made.com. La liste est affichée sous le visuel.
- Critère d'acceptance : Minimum 5 produits par shopping list. Les liens pointent vers des URLs de recherche réelle (ex. `ikea.com/fr/search/?q=canapé+3+places+gris+clair`). Les prix sont indicatifs (fourchette basse/haute) clairement marqués "prix indicatif".

**US-F5-02 — Exporter la shopping list en PDF (Claire)**
- Job-to-be-done : Quand je présente une ambiance à mon client, je veux lui remettre une liste de produits à commander avec les liens.
- Given : L'utilisateur a une shopping list générée.
- When : Il clique sur "Exporter en PDF".
- Then : Un PDF est généré avec : le visuel du résultat (miniature), le style et le type de pièce, puis la liste produits (nom, prix estimé, lien QR code). Le PDF est téléchargé directement.
- Critère d'acceptance : Le PDF est généré en < 5s. Les liens sont cliquables dans le PDF. Chaque produit a un QR code pointant vers le lien d'achat.

**US-F5-03 — Obtenir des alternatives à différents prix (Léa, Claire)**
- Job-to-be-done : Quand le canapé recommandé est hors budget, je veux une alternative moins chère.
- Given : L'utilisateur consulte la shopping list.
- When : Il clique sur "Voir alternative budget" sur un produit.
- Then : GPT-4.1-mini génère 1-2 alternatives moins chères (gamme -30 à -50%) avec liens correspondants.
- Critère d'acceptance : L'alternative s'affiche sous le produit original sans recharger la page. L'utilisateur peut toggle entre "original" et "alternative budget".

---

### F5.2 Wireframes ASCII

**État : Shopping list sous le comparateur**
```
┌──────────────────────────────────────────────────────────┐
│  [◄────────── Slider avant/après ──────────────────────►] │
│                                                          │
│  [ ⬇ HD ]  [ ✏ Affiner ]  [ 🛒 Voir les produits ]      │
└──────────────────────────────────────────────────────────┘
                          ↓ (clic)
┌──────────────────────────────────────────────────────────┐
│  🛒 Shopping List — Style Scandinave · Salon             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Canapé 3 places tissu gris clair                   │  │
│  │ IKEA KIVIK · ~699€   [Voir sur IKEA →]             │  │
│  │ [Alternative budget ▼]                             │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Table basse ronde bois clair                       │  │
│  │ IKEA LISTERBY · ~129€  [Voir sur IKEA →]           │  │
│  └────────────────────────────────────────────────────┘  │
│  ... + 4 produits                                        │
│                                                          │
│  ⚠ Prix indicatifs — vérifier disponibilité en boutique  │
│  [ ⬇ Exporter en PDF ]  [ 🔗 Copier le lien ]           │
└──────────────────────────────────────────────────────────┘
```

**État : Loading shopping list**
```
│  ⏳ Recherche des produits correspondants...  ~5 secondes │
│  (analyse du style et du mobilier généré)                │
```

**État : Alternative budget déployée**
```
│  Canapé 3 places tissu gris clair                        │
│  IKEA KIVIK · ~699€   [Voir →]                           │
│  └─ Alternative budget :                                 │
│     IKEA FRIHETEN · ~449€  [Voir →]                      │
```

---

### F5.3 Règles métier

- **Accès** : Mode Décorateur disponible uniquement pour les **abonnés Pro actifs** (29€/mois). Le Pack Découverte et le Pack Starter ne donnent pas accès. Vérification côté serveur via statut Stripe subscription.
- **Coût** : La génération de shopping list consomme 1 crédit supplémentaire (appel GPT-4.1 dédié). L'export PDF consomme 0 crédit supplémentaire.
- **Sources produits** : IKEA France (priorité), Leroy Merlin (pour accessoires déco/plantes), Made.com ou Maisons du Monde (pour pièces premium). Les liens sont des URLs de recherche générées dynamiquement, pas des liens produits hardcodés.
- **Disclaimer obligatoire** : "Prix indicatifs à la date de génération. Les prix et disponibilités sont susceptibles de changer. Versimo ne garantit pas l'exactitude des prix."
- **Contenu de la shopping list** : 5-8 produits par liste. Catégories : canapé/fauteuil, table basse, tapis, luminaire, plante, accessoires (max 2). Chaque produit : nom, enseigne, prix bas/haut (fourchette), lien de recherche.
- **Export PDF** : Contient le visuel résultat (miniature 600px), le style, la date, la liste produits avec QR codes. Format A4 portrait.
- **Lien partageable** : La shopping list peut être partagée via un lien (UUID, TTL 7 jours). Utile pour le partage client.

---

### F5.4 Edge cases

1. **Produit IKEA retiré du catalogue** : Les liens de recherche (pas d'URL produit direct) restent valides même si un produit spécifique disparaît. Le lien recherche "canapé 3 places gris" sur IKEA.fr reste pertinent.
2. **Style "Maximaliste" avec 15+ pièces de mobilier** : La shopping list est limitée à 8 produits. Les produits les plus iconiques du style sont priorisés.
3. **Pièce très petite** (studio 18m²) : GPT-4.1 adapte les recommandations (tailles compactes, meubles multifonctions). Le prompt inclut "small space, compact furniture".
4. **Mode Extérieur + shopping list** : Sources adaptées (Leroy Merlin outdoor, Alinéa jardin). IKEA exclu car catalogue outdoor limité.
5. **Custom style + shopping list** : GPT-4.1 analyse le furniturePrompt enrichi (post-preprocess) pour générer des recommandations adaptées au style custom. Résultats moins précis — disclaimer "Style personnalisé : recommandations approximatives".
6. **Prix non trouvé pour un produit** : Le champ prix affiche "Prix non disponible — voir en boutique" au lieu d'une fourchette. Jamais de prix inventé.
7. **Export PDF > 5 Mo** : Compression automatique des images (JPEG 70%). Si toujours > 5 Mo : avertissement "Le PDF est volumineux, pensez à le compresser avant envoi."

---

### F5.5 Events tracking

| Event name | Properties | Trigger |
|---|---|---|
| `shopping_list_requested` | `{ style_id, room_type, product_count }` | Clic "Voir les produits" |
| `shopping_list_generated` | `{ style_id, product_count, duration_ms, sources: string[] }` | Fin génération liste |
| `product_link_clicked` | `{ product_type, enseigne, style_id }` | Clic sur lien produit |
| `alternative_budget_requested` | `{ product_type, style_id }` | Clic "Alternative budget" |
| `shopping_pdf_exported` | `{ style_id, product_count }` | Téléchargement PDF |
| `shopping_link_copied` | `{ style_id }` | Copie lien shopping list |
| `shopping_list_shared_visited` | `{ list_id, source }` | Visite lien partagé |

---

### F5.6 Dépendances

- **Technique** : Nouveau endpoint `/api/shopping-list` (POST) recevant `{ furniturePrompt, styleId, roomType, isOutdoor }`. Appel GPT-4.1 avec system prompt dédié à la génération de listes produits.
- **Technique** : Génération PDF côté serveur (`pdf-lib`). Réutilisation de la logique F4 si disponible.
- **Technique** : Nouvelle table DB `shopping_lists` (uuid, generation_log_id, products JSON, created_at, expires_at).
- **Technique** : Nouvelle route Next.js `/shopping/[uuid]` (page publique, TTL 7 jours).
- **Produit** : F5 dépend de F2 (roomType pour adapter les recommandations) et de F3 (isOutdoor pour adapter les sources). F5 est indépendant de F1, F4.
- **Contrainte légale** : Les liens produits doivent être des liens de recherche non affiliés en V1. Les programmes d'affiliation (IKEA, Leroy Merlin) peuvent être activés en V2 après validation légale.

---

### F5.7 Performance

- Génération shopping list (GPT-4.1) : < 5s
- Export PDF (15 produits + 1 image) : < 8s
- Chargement liste depuis DB : < 500ms
- Génération alternatives budget (GPT-4.1-mini) : < 2s par produit

---

## 6. Matrice des dépendances

| Composant | F1 Itération | F2 Type pièce | F3 Extérieur | F4 Mode Pro | F5 Décorateur |
|---|---|---|---|---|---|
| Pipeline 2 passes (existant) | Requis | Requis | Requis (modifié) | Requis | Requis |
| `/api/generate` (existant) | Modifié (+pass1_key) | Modifié (+roomType) | Modifié (+isOutdoor) | Modifié (batch) | Inchangé |
| `/api/preprocess-prompt` (existant) | Réutilisé | Modifié (+roomType) | Inchangé | Inchangé | Non |
| Object Storage (existant) | Requis (TTL 24h) | Non | Non | Requis | Non |
| PostgreSQL (existant) | Modifié (+iterations) | Modifié (+room_type) | Modifié (+is_outdoor) | Nouvelle table dossiers | Nouvelle table shopping_lists |
| `lib/room-types.ts` (nouveau) | Non | Créé | Étendu (sous-types ext.) | Requis | Requis (isOutdoor) |
| `lib/outdoor-styles.ts` (nouveau) | Non | Non | Créé | Optionnel | Requis si outdoor |
| `/api/shopping-list` (nouveau) | Non | Non | Non | Non | Créé |
| Génération PDF (nouveau) | Non | Non | Non | Créé | Réutilisé |
| Route `/dossier/[uuid]` (nouveau) | Non | Non | Non | Créé | Non |
| Route `/shopping/[uuid]` (nouveau) | Non | Non | Non | Non | Créé |
| Auth légère / sessionId | Requis (itérations) | Non | Non | Fortement recommandé | Non |
| StylePicker.tsx | Non | Modifié | Modifié (toggle) | Modifié | Non |

**Ordre de livraison recommandé (RICE implicite) :**

1. **F2** (type de pièce) — Impact fort, effort minimal, pas de dépendance. Doit précéder F4/F5.
2. **F1** (itération) — Impact fort sur rétention, effort moyen, dépend de Object Storage (déjà en place).
3. **F3** (extérieur) — Impact fort pour Thomas et Léa, effort moyen, dépend de F2.
4. **F4** (Mode Pro) — Impact fort sur rétention abonnés Pro, effort élevé (PDF + auth + abonnement Stripe), dépend de F2, F3.
5. **F5** (décorateur) — Impact fort sur différenciation, effort élevé (GPT + PDF), dépend de F2, F3.

---

## 7. Packages crédits

### 7.1 Hypothèses de coût API

| Composant | Coût unitaire |
|---|---|
| Passe 1 gpt-image-1.5 Responses API | ~0,04-0,06€ |
| Passe 2 gpt-image-1.5 Responses API | ~0,04-0,06€ |
| Passe 1 + 2 total (chemin nominal) | ~0,10€ |
| [SUPPRIMÉ] Fallback Flux Depth Pro — plus de fallback | — |
| Pre-processing GPT-4.1-mini | ~0,001€ |
| Shopping list GPT-4.1 | ~0,02€ |
| Génération PDF (serverless) | ~0,01€ |
| **Coût moyen par génération standard** | **~0,10€** |
| **Coût moyen par génération avec shopping list + PDF** | **~0,13€** |

> Note : gpt-image-1.5 est le seul modèle utilisé (décision fondateur 2026-04-04). Pas de fallback Flux Depth Pro, SDXL, ou DALL-E. En cas d'erreur API, retry 1× avec prompt simplifié, puis message utilisateur.

### 7.2 Grille des offres (modèle hybride — mis à jour 2026-03-27)

#### Abonnement Pro — 29€/mois TTC

| Abonnement | Prix TTC | Crédits inclus | Prix/crédit | Coût API/crédit | Marge brute mensuelle | % marge |
|---|---|---|---|---|---|---|
| **Pro** | 29€/mois | 50/mois | 0,58€ | 0,10€ | ~24,00€ (hors coûts PDF/GPT) | ~83% |

> Les crédits sont renouvelés chaque mois. Les crédits non consommés ne se cumulent pas.

#### Crédits supplémentaires (abonnés Pro uniquement)

| Pack rachat | Prix TTC | Crédits | Prix/crédit | Coût API/crédit | Marge brute | % marge |
|---|---|---|---|---|---|---|
| **+20 crédits** | 9€ | 20 | 0,45€ | 0,10€ | 7,00€ | 78% |
| **+50 crédits** | 19€ | 50 | 0,38€ | 0,10€ | 14,00€ | 74% |
| **+100 crédits** | 34€ | 100 | 0,34€ | 0,10€ | 24,00€ | 71% |

> Crédits rachetés valables 90 jours. Non cumulables avec les crédits mensuels (file séparée).

#### 3 tiers (pricing-strategy.md v3, décision fondateur 2026-03-27 — mis à jour 2026-04-04)

| Tier | Prix TTC | Crédits | Prix/crédit | Coût API/crédit | Marge brute | % marge |
|---|---|---|---|---|---|---|
| **Découverte** | GRATUIT | **2** (one-time) | — | 0,10€ | -0,20€ | Acquisition |
| **Starter** | 9,90€ one-shot | 15 | 0,66€ | 0,10€ | 8,40€ | 85% |
| **Pro** | 29€/mois abo. | 50/mois | 0,58€ | 0,10€ | 24€ | 83% |

> **Correction 2026-04-04** : Découverte = 2 crédits (non 3). Source : `lib/credits.ts` commentaire "2 free generations enforced by rate limit" et `pricing-strategy.md` section Tier 1.
> Recharges : Starter +10 crédits = 5,90€. Pro +20 crédits = 9€. Voir pricing-strategy.md v3 pour le détail complet.

### 7.3 Feature gating par offre (mis à jour 2026-04-04)

> Il n'y a que 3 tiers. Les colonnes "Gratuit" et "Découverte" ont été fusionnées en une seule colonne "Découverte". Source : `lib/credits.ts`, `pricing-strategy.md` v3.

| Feature | Découverte (gratuit) | Starter (9,90€) | Pro (29€/mois) |
|---|---|---|---|
| Générations standard (12 styles intérieur + extérieur) | **2** crédits one-time | 15 crédits | 50 crédits/mois |
| Itérations par photo (F1) — **sans crédit supplémentaire** | 0 | 1 | 3 |
| Type de pièce (F2) | Oui | Oui | Oui |
| Mode Extérieur (F3) | Oui | Oui | Oui |
| Variantes mobilier automatiques | Oui | Oui | Oui |
| Historique des générations (/ma-galerie) | **Oui** (tous connectés) | Oui | Oui |
| **Mode Pro** (dossiers batch, ex Mode Marchand, F4) | Non | Non | **Oui (max 15 photos/dossier)** |
| **Dossiers de pré-commercialisation** (F4) | Non | Non | **Oui — inclus** |
| Shopping list / Mode Décorateur (F5) | Non | Non | Oui (+1 crédit/liste) |
| Export PDF | Non | Non | Oui |
| Lien partageable | Non | Oui (7j) | **Oui — sans limite de durée** |
| Téléchargement HD | Oui | Oui | Oui |
| **Recharge crédits** | Non | Oui (+10 = 5,90€) | Oui (+20 = 9€) |

> **Note (2026-04-04)** : La galerie `/ma-galerie` est accessible à **tous les utilisateurs connectés** (décision fondateur 2026-04-04, source : commentaire `hasGalleryAccess()` dans `lib/credits.ts` : "Galerie accessible à TOUS les utilisateurs connectés").
> **Note (2026-03-27) :** Le pack Pro one-shot 29€ est supprimé et remplacé par l'Abonnement Pro 29€/mois. À même prix, l'abonnement inclut le Mode Pro, les Dossiers de pré-commercialisation et les liens sans limite — aucune raison de proposer les deux.

### 7.4 Simulation atteinte KPI North Star (3 000€/mois marge nette) — modèle hybride

**Seuil de rentabilité :**

| Abonnés Pro actifs | MRR abonnements | Marge brute (~83%) | MRR one-shot (estimé) | Marge brute one-shot | Total marge brute | Infra | Marge nette |
|---|---|---|---|---|---|---|---|
| 50 | 1 450€ | 1 204€ | 300€ | 258€ | 1 462€ | 50€ | **1 412€** |
| 80 | 2 320€ | 1 926€ | 400€ | 344€ | 2 270€ | 50€ | **2 220€** |
| **110** | **3 190€** | **2 648€** | **500€** | **430€** | **3 078€** | **50€** | **≈ 3 028€** |
| 140 | 4 060€ | 3 370€ | 600€ | 516€ | 3 886€ | 50€ | **3 836€** |

> **Seuil de rentabilité KPI North Star : ~110 abonnés Pro actifs.** Soit ~3,7 nouveaux abonnés nets par jour (en comptant un churn mensuel de 5%).

**Break-even infra :**
- Coût infra fixe 50€/mois. Couvert dès 2 abonnés Pro actifs.

### 7.5 Justification du pricing vs concurrents (mis à jour 2026-03-27)

| | Versimo Pro | Pedra (EU) | REimagineHome Optimal | Renovate Club (FR) |
|---|---|---|---|---|
| Prix | 29€/mois | 29€/mois | 29$/mois | 9,99€/mois |
| Crédits | 50/mois + rachats | Variable | Variable (~200) | Illimité |
| Prix/image | 0,58€ | N/A | ~0,15$ | ~0€ |
| Mode Pro / Dossier | Oui — inclus | Non | Non | Non |
| Pipeline 2 passes | Oui | Non | Non | Non |
| Styles marché FR | Oui | Non | Non | Oui (~80+) |
| Lien partageable acquéreurs | Sans limite (Pro) | Non | Non | Non |

> Versimo Pro (29€/mois) est aligné sur Pedra mais apporte un pipeline qualité supérieur (2 passes, styles FR curatés) et une feature unique : les Dossiers de pré-commercialisation inclus. Vs Renovate Club (9,99€/mois illimité) : Versimo ne joue pas le volume mais la qualité professionnelle. Thomas dépense 200-500€/planche en home staging humain — 29€/mois pour 50 crédits est une réduction de 99%+.

---

## F7 — Pages dédiées par profil (/architecte, /marchand, /particulier)

> **Décision fondateur (2026-03-27) :** Les pages dédiées par profil remplacent la section personas actuellement sur la homepage. La homepage devient généraliste (Hero + outil + pricing). Les pages /architecte, /marchand, /particulier ciblent chaque persona avec un before/after dédié, des témoignages contextualisés, et un CTA adapté.

### F7.1 User Stories

**US-F7-01 — Architecte trouvant immédiatement sa valeur sur /architecte (Claire)**
- Job-to-be-done : Quand Claire cherche un outil pour montrer des ambiances à ses clients, elle veut une page qui lui parle directement — avec son vocabulaire, ses problèmes, ses preuves.
- Given : Claire arrive sur `/architecte` depuis une recherche Google ou un lien partagé par un confrère.
- When : Elle charge la page.
- Then : Elle voit en premier écran : un H1 ancré sur sa frustration ("Vos clients veulent voir. En 90 secondes, montrez-leur."), un avant/après d'une pièce de chantier transformée en planche d'ambiance professionnelle, et un CTA "Générer votre première planche gratuitement".
- Critère d'acceptance : Le mot "planche" (vocabulaire Claire) apparaît au moins 1 fois dans le premier écran. Le CTA pointe vers le générateur. La page charge en < 2s.

**US-F7-02 — Marchand de biens évaluant son ROI sur /marchand (Thomas)**
- Job-to-be-done : Quand Thomas cherche un outil pour ses dossiers de pré-commercialisation, il veut voir immédiatement le ROI comparé à son home stager actuel.
- Given : Thomas arrive sur `/marchand` depuis LinkedIn, une recommandation, ou une annonce ciblée.
- When : Il charge la page.
- Then : Il voit en premier écran : un H1 ancré sur le coût ("29€/mois. Vos dossiers de pré-commercialisation en 10 minutes, pas 10 jours."), un avant/après d'un bien brut transformé en dossier meublé multi-pièces, l'argument "vs 200-500€/planche chez un home stager", et un CTA "Créer mon premier dossier — Abonnement Pro".
- Critère d'acceptance : Le prix 29€/mois est visible dans le premier écran. Le terme "dossier de pré-commercialisation" apparaît au moins 2 fois. Le CTA pointe vers l'abonnement Pro.

**US-F7-03 — Particulière visualisant son futur appartement sur /particulier (Léa)**
- Job-to-be-done : Quand Léa cherche à visualiser des styles dans son appartement, elle veut une page fun, rapide, avec un before/after qui ressemble à son contexte (appartement vide, pas un loft de luxe).
- Given : Léa arrive sur `/particulier` depuis Instagram, Pinterest, ou un partage WhatsApp.
- When : Elle charge la page.
- Then : Elle voit en premier écran : un H1 ancré sur la personnalisation ("Votre appartement. Pas celui de quelqu'un d'autre."), un avant/après d'un T3 standard dans 3 styles différents, et un CTA "Essayer gratuitement — sans carte bancaire".
- Critère d'acceptance : Le CTA "gratuit" est visible dans le premier écran. Le mot "votre" (personnalisation) apparaît dans le H1. La page fonctionne en mobile-first (viewport 375px).

---

### F7.2 Wireframes ASCII

**Page /architecte — Premier écran**
```
┌──────────────────────────────────────────────────────────┐
│  [Logo Versimo]                    [Tarifs] [Essayer →] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Vos clients veulent voir.                               │
│  En 90 secondes, montrez-leur.                           │
│                                                          │
│  [Avant : chantier béton]  [Après : planche Contemporain]│
│  ◄──────────── Glisser ────────────►                     │
│                                                          │
│  "Un support de conversation avec mon client dès le 1er  │
│   RDV, sans attendre 48h le rendu 3D."                   │
│  — Claire D., architecte DPLG, Lyon                      │
│                                                          │
│  [ Générer votre première planche gratuitement → ]       │
│  Sans carte bancaire · 2 générations offertes            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Page /marchand — Premier écran**
```
┌──────────────────────────────────────────────────────────┐
│  [Logo Versimo]                    [Tarifs] [Essayer →] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  29€/mois. Vos dossiers de pré-commercialisation         │
│  en 10 minutes, pas 10 jours.                            │
│                                                          │
│  [Avant : appartement vide brut]   [Après : dossier PDF  │
│                                    meublé 8 pièces]       │
│  ◄──────────── Glisser ────────────►                     │
│                                                          │
│  vs 200-500€ par planche chez un home stager             │
│  Lien partageable acquéreurs · Sans limite de durée       │
│                                                          │
│  [ Créer mon premier dossier — Abonnement Pro → ]        │
│  Prix de lancement · 50 crédits/mois inclus              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Page /particulier — Premier écran**
```
┌──────────────────────────────────────────────────────────┐
│  [Logo Versimo]                    [Tarifs] [Essayer →] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Votre appartement. Pas celui de quelqu'un d'autre.      │
│                                                          │
│  [T3 vide → Scandinave]  [T3 vide → Japandi]             │
│  [T3 vide → Bohème]      (3 styles, même pièce)          │
│                                                          │
│  "J'ai enfin vu MON salon en scandinave,                 │
│   pas une photo générique Pinterest."                    │
│  — Léa M., primo-accédante, Nantes                       │
│                                                          │
│  [ Essayer gratuitement — sans carte bancaire → ]        │
│  2 générations offertes · 12 styles disponibles          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### F7.3 Règles métier

- **Section personas homepage** : SUPPRIMÉE (pills "Architectes / Marchands / Particuliers" + descriptions). Remplacée par des liens vers les 3 pages dans le header (nav secondaire) et le footer.
- **Contenu des avant/après** : Utiliser des générations réelles issues de la production Versimo (notées ≥ 7,5/10 par Yann Duval ou Lucas Moreau dans les logs). Pas d'images synthétiques ou de photos tierces — cohérence avec le positionnement "ne trahit pas votre espace".
- **Témoignages** : [HYPOTHÈSE — à valider avec données réelles] En attendant des témoignages clients réels, les citations peuvent être des verbatims de personas tels que documentés dans `docs/strategy/personas.md`. Marquer dans le code source `{/* TODO: remplacer par témoignage réel */}`. Dès qu'un utilisateur réel donne son accord, remplacer.
- **CTA** :
  - `/architecte` et `/particulier` → CTA gratuit → redirige vers la homepage avec ancre sur l'outil.
  - `/marchand` → CTA abonnement Pro → redirige vers la page pricing avec ancre sur l'offre Pro (badge "Prix de lancement").
- **SEO** : Chaque page a une balise `<title>` et une `<meta description>` dédiées, optimisées sur les requêtes longue traîne du persona (voir `docs/seo/metadata-templates.md` pour le format).
- **Mobile-first** : Les 3 pages sont designées pour un viewport 375px en priorité. L'avant/après slider est utilisable au doigt. Les CTAs sont sticky sur mobile.

---

### F7.4 Edge cases

1. **Avant/après non disponible** (aucune génération ≥ 7,5/10 dans les logs pour un persona) : Afficher l'avant/après généraliste de la homepage en fallback. Marquer dans la DB un flag `eligible_for_gallery: bool` sur les générations.
2. **Témoignage réel disponible** : Remplacer le verbatim persona par le témoignage réel avec prénom + métier + ville. Ne jamais afficher de nom complet sans accord écrit.
3. **Utilisateur déjà connecté arrive sur /marchand** : Si abonné Pro, le CTA devient "Accéder à mon espace Pro". Si non-abonné, garder le CTA "Abonnement Pro".
4. **Lien depuis campagne paid (UTM)** : Les pages /architecte, /marchand, /particulier doivent préserver les paramètres UTM dans les liens CTA (pour tracking conversion PostHog).
5. **Navigation depuis /marchand vers le générateur** : L'utilisateur non connecté est redirigé vers l'inscription. Ne pas perdre le contexte persona (paramètre `?from=marchand` dans l'URL d'inscription pour personnaliser l'onboarding).

---

### F7.5 Events tracking

| Event name | Properties | Trigger |
|---|---|---|
| `persona_page_viewed` | `{ persona: 'architecte'|'marchand'|'particulier', source: UTM }` | Chargement page /architecte, /marchand, /particulier |
| `persona_page_cta_clicked` | `{ persona, cta_type: 'free'|'pro', position: 'hero'|'bottom' }` | Clic CTA principal ou secondaire |
| `persona_page_comparator_interacted` | `{ persona, interaction: 'drag'|'click' }` | Interaction avec le slider avant/après |
| `persona_page_testimonial_visible` | `{ persona }` | Témoignage visible (IntersectionObserver) |

---

### F7.6 Dépendances

- **Technique** : Création de 3 routes Next.js : `app/architecte/page.tsx`, `app/marchand/page.tsx`, `app/particulier/page.tsx`.
- **Technique** : Composant réutilisable `PersonaHero` (avant/après + H1 + témoignage + CTA) paramétrable par persona.
- **Technique** : Images avant/après sélectionnées depuis Object Storage (via flag `eligible_for_gallery` à ajouter en DB).
- **Technique** : `generateMetadata()` par page pour les balises SEO dédiées.
- **Produit** : Suppression de la section personas de `app/page.tsx` (pills "Architectes / Marchands / Particuliers").
- **Produit** : Ajout des liens /architecte, /marchand, /particulier dans le header (nav secondaire, visible desktop) et le footer.
- **Produit** : F7 est indépendant de F1-F6. Peut être implémenté en parallèle de l'Auth.
- **Design** : Les avant/après de chaque page doivent respecter le design system (palette, typographie, composant ImageComparator existant).
- **SEO** : Coordonner avec `docs/seo/metadata-templates.md` pour les balises title/description/OG de chaque page.

---

## F8 — Mode Unifié (fusion MerchantMode + Standard) [IMPLÉMENTÉ — non spécifié initialement]

> Décision fondateur 2026-04-03. Source : `docs/product/unified-mode-specs.md`.

Le mode Marchand (`MerchantMode.tsx`) a été fusionné avec le mode Standard dans `app/page.tsx`. Il n'y a plus qu'un seul flow pour tous les utilisateurs.

### Architecture actuelle (code production)

```
Upload (UploadZone, max selon plan : 3 Découverte, 5 Starter, 15 Pro)
    ↓
Cartes per-photo (pièce + style + indoor/outdoor + format + withFurniture)
    ↓
Bouton Générer
    ↓
Loading avec visuels intermédiaires (passe 1 visible via splitMode)
    ↓
Résultats : ImageComparator × N photos
    - Bouton × supprimer un résultat
    - Bouton Affiner (RefineModal, itérations)
    - Bouton Télécharger / Partager
    ↓
[Pro only] PhotoAssociator — association à un bien existant
```

### Composants supprimés
- `MerchantMode.tsx` — fusionné dans page.tsx
- `DossierProgress.tsx` — remplacé par le loading unifié
- `DossierResult.tsx` — remplacé par ImageComparator

### API unique
- `/api/generate` est l'unique point d'entrée de génération (split mode + itérations).
- `/api/dossier` reste pour la création et gestion de dossiers PDF, mais n'est plus le point d'entrée de génération.
- Les dossiers PDF se créent uniquement depuis `/mes-biens/[id]`, pas depuis la page de génération.

---

## F9 — Variantes Mobilier Automatiques [IMPLÉMENTÉ — non spécifié initialement]

> Source : `lib/style-variants.ts`, `app/api/generate/route.ts` (bloc `selectVariant`).

Pour éviter que deux générations du même style sur des photos différentes produisent le même mobilier, le système sélectionne automatiquement une variante du `furniturePrompt` basée sur un hash de l'image input.

### Règles métier
- Applicable uniquement aux styles nommés intérieurs (pas au style Custom, pas aux styles outdoor).
- Le hash SHA-256 des 16 premiers caractères de l'image base64 détermine la variante de façon déterministe.
- Si `lib/style-variants.ts` n'a pas de variante pour un style donné, le `furniturePrompt` original est utilisé sans modification.
- L'utilisateur ne voit pas ce mécanisme. Il génère un style, il obtient un résultat potentiellement différent à chaque upload d'image différente.
- Les `furniturePrompts` dans `StylePicker.tsx` contiennent déjà des clauses `choose one:` pour induire la diversité au niveau du prompt lui-même.

### Feature gating
- Inclus dans tous les tiers (Découverte, Starter, Pro). Pas de feature premium.

---

## F10 — Résilience Mobile (tab-switch) [IMPLÉMENTÉ — non spécifié initialement]

> Source : `app/page.tsx` fonctions `resilientFetch()` et `waitForVisible()`.

Sur mobile, le navigateur peut tuer la connexion fetch quand l'utilisateur bascule vers une autre app ou met l'écran en veille pendant la génération. Sans protection, la génération est perdue et le crédit consommé.

### Comportement implémenté
- La fonction `resilientFetch()` (timeout 180s) détecte si le document est invisible (`document.visibilityState === "hidden"`) au moment où le fetch échoue.
- Si la cause est un changement d'onglet mobile (non un abandon volontaire), elle attend le retour de l'utilisateur (`waitForVisible()`) puis réessaie une fois.
- Si l'utilisateur a annulé explicitement (bouton Annuler → `parentSignal?.aborted`), pas de retry.
- Le serveur continue le traitement pendant l'absence mobile — pas de double facturation.
- MAX_RETRIES = 1 (une seule tentative de reconnexion).

### Feature gating
- Inclus dans tous les tiers. Comportement de base du client.

---

## F11 — File d'attente de génération [IMPLÉMENTÉ — non spécifié initialement]

> Source : `lib/generation-queue.ts`, `lib/hooks/useQueueStatus.ts`, `app/api/generate/route.ts` (bloc `enqueueGeneration`).

Quand la génération échoue avec un timeout (504 Replit proxy) ou une erreur réseau grave, la requête peut être mise en queue pour traitement asynchrone en arrière-plan.

### Comportement implémenté
- `shouldQueue()` détermine si la requête doit être mise en file plutôt que retournée en erreur immédiate.
- `enqueueGeneration()` sauvegarde les paramètres de génération (image, prompts, styleId, etc.) en DB pour traitement différé.
- Le client sonde l'état de la queue via `/api/queue/status` (hook `useQueueStatus`).
- Un toast `queueToast` informe l'utilisateur que sa génération est en file.
- Quand le résultat est disponible, il apparaît dans la galerie (`/ma-galerie`).

### Feature gating
- Inclus dans tous les tiers. Comportement de résilience système.

---

## Changelog des corrections 2026-04-04

| Section | Avant | Après | Source |
|---|---|---|---|
| Version | 1.0 | 1.1 | — |
| Modèle IA (mentionné) | gpt-4.1 + Flux Depth Pro fallback | gpt-image-1.5 uniquement, sans fallback | `generation-pipeline.ts` const IMAGE_MODEL + CLAUDE.md règles prompts |
| Crédits Découverte | 3 crédits gratuits | 2 crédits gratuits | `lib/credits.ts` commentaire + pricing-strategy.md |
| Itérations tier Business | Business 79€ = 5 itérations | Tier Business supprimé — 3 tiers uniquement | pricing-strategy.md v3 |
| Itérations consomment crédit | Oui, 1 crédit/itération | Non — itérations gratuites | `route.ts` commentaire "no credit consumed" |
| Types d'itération | Restyle uniquement | Adjust (chirurgical) + Restyle (classifié auto) | `route.ts` bloc intent classification |
| Galerie /ma-galerie | Pro only | Tous les connectés | `lib/credits.ts` `hasGalleryAccess()` |
| F1.3 passe 1 expirée | 24h | 24h (inchangé) | `lib/iteration-prompt.ts` PASS1_TTL_MS |
| F3.7 performance outdoor | < 90s P95 + Flux fallback | < 120s P95, pas de fallback | Modèle unique |
| F7 wireframes | "3 générations offertes" | "2 générations offertes" | pricing-strategy.md v3 |
| 7.3 feature gating | 4 colonnes (Gratuit/Découverte/Starter/Pro) | 3 colonnes (Découverte/Starter/Pro) | pricing-strategy.md v3 |
| Features nouvelles | — | F8 Mode Unifié, F9 Variantes Mobilier, F10 Résilience Mobile, F11 File d'attente | code production |
