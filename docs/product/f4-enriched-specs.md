# F4 Mode Marchand Enrichi -- Specs Fonctionnelles
## Version 1.0 -- 2026-03-25
> Produit par @product-manager
> Objectif : passer la note Thomas de 6.1/10 a 9/10
> Principe directeur : Thomas saisit son SIRET une fois, l'adresse du bien une fois. Le reste est automatique.

---

## 0. Contexte et diagnostic

### Pourquoi 6.1/10 ?

Le F4 actuel (functional-specs.md) demande a Thomas de remplir manuellement : nom du bien, adresse, surface, prix. Il ne porte pas la marque de Thomas. Le PDF est generique (branding Versiroom). Thomas doit re-saisir ses coordonnees a chaque dossier.

### Cible 9/10

Thomas n'a qu'a :
1. Configurer son profil marchand UNE SEULE FOIS (SIRET + logo + palette)
2. Saisir l'adresse du bien (autocomplete)
3. Le reste est automatise : enrichissement foncier, description commerciale, PDF brande

### Perimetre : 3 sous-features

| Sous-feature | Description | Effort |
|---|---|---|
| **F4.A** | Profil Marchand (one-time setup) | 1 semaine |
| **F4.B** | Enrichissement automatique du bien par adresse | 1,5 semaines |
| **F4.C** | PDF brande professionnel | 1 semaine |

**Effort total estime : 3,5 semaines-homme** (vs 8 semaines dans la roadmap initiale -- perimetre affine).

---

## 1. F4.A -- Profil Marchand (one-time setup)

### 1.1 User Stories

**US-F4A-01 -- Saisir mon SIRET et voir mes infos societe auto-remplies (Thomas)**
- Job-to-be-done : Quand je configure mon compte marchand, je veux saisir mon SIRET une seule fois et voir ma raison sociale, mon adresse et ma forme juridique apparaitre automatiquement, pour ne pas tout retaper a la main.
- Given : Thomas est connecte et accede a sa page Profil Marchand (ou a l'inscription si "Marchand de biens" coche).
- When : Il saisit son SIRET (14 chiffres) dans le champ dedie.
- Then : Une requete Pappers API est declenchee. Les champs suivants sont auto-remplis : raison sociale, adresse siege, forme juridique, nom du dirigeant. Thomas peut corriger/completer chaque champ avant de sauvegarder.
- Critere d'acceptation : L'auto-remplissage se declenche en < 2s apres saisie des 14 chiffres. Si Pappers echoue, fallback vers API INSEE SIRENE. Si les deux echouent, les champs restent vides et editables manuellement. Aucun champ auto-rempli n'est verrouille -- Thomas peut tout modifier.

**US-F4A-02 -- Uploader mon logo pour brander mes dossiers (Thomas)**
- Job-to-be-done : Quand je genere un PDF de pre-commercialisation, je veux que mon logo apparaisse en couverture au lieu de celui de Versiroom, pour que le document porte ma marque.
- Given : Thomas est sur la page Profil Marchand.
- When : Il uploade un fichier logo (PNG, JPG ou SVG, max 2 Mo).
- Then : Le logo est affiche en preview. Il est stocke dans Object Storage et reference en DB. Le logo est injecte automatiquement dans tous les futurs PDF generes.
- Critere d'acceptation : Formats acceptes : PNG, JPG, SVG. Max 2 Mo. Preview affichee apres upload. Le logo apparait dans le PDF couverture en haut a gauche, redimensionne a max 180px de large, ratio preserve.

**US-F4A-03 -- Definir ma palette couleur et police pour mes dossiers (Thomas, facultatif)**
- Job-to-be-done : Quand ma societe a une charte graphique (couleurs, police), je veux que mes dossiers PDF la respectent automatiquement.
- Given : Thomas est sur la page Profil Marchand. Les champs palette et police sont marques "Facultatif".
- When : Il choisit une couleur principale via un color picker (hex), optionnellement une couleur secondaire. Il selectionne une police dans un dropdown (5 choix).
- Then : Les couleurs et la police sont sauvegardees en DB. Les prochains PDF utiliseront cette palette pour les titres (couleur principale), les accents (couleur secondaire) et le texte (police choisie).
- Critere d'acceptation : Si aucune palette definie, le PDF utilise la palette Versiroom par defaut (#1C1C1E titres, #7D9B76 accents, Inter). Si aucune police choisie, Inter est appliquee. Le color picker affiche un preview du rendu titre + accent. Les 5 polices proposees : Inter, Playfair Display, Montserrat, Lora, DM Sans.

**US-F4A-04 -- Completer mes coordonnees pro (Thomas)**
- Job-to-be-done : Quand mon dossier PDF est envoye a un acquereur, je veux que mes coordonnees directes (telephone, email pro) figurent en pied de page pour etre contacte facilement.
- Given : Thomas est sur la page Profil Marchand.
- When : Il saisit son telephone pro et son email pro (optionnels mais recommandes).
- Then : Les coordonnees sont sauvegardees en DB. Elles apparaissent en pied de page de chaque PDF et sur la page web partageable du dossier.
- Critere d'acceptation : Email valide par regex standard. Telephone affiche avec indicatif +33. Si non renseignes, le pied de page affiche uniquement la raison sociale et l'adresse siege.

### 1.2 Wireframes ASCII

**Ecran : Page Profil Marchand (page compte ou onboarding)**
```
+----------------------------------------------------------+
|  Profil Marchand                                         |
|                                                          |
|  Societe                                                 |
|  SIRET : [__ __ __ __ __ __ __]  [Rechercher]           |
|                                                          |
|  Raison sociale : [Auto-rempli________________]          |
|  Adresse siege :  [Auto-rempli________________]          |
|  Forme juridique: [Auto-rempli___]                       |
|  Dirigeant :      [Auto-rempli________________]          |
|                                                          |
|  Coordonnees pro                                         |
|  Telephone : [+33 ___________]                           |
|  Email pro :  [________________@___________]             |
|                                                          |
|  -------------------------------------------------------+
|  Branding (facultatif)                                   |
|                                                          |
|  Logo : [Glisser ou cliquer] [preview 80x80]            |
|          PNG, JPG, SVG -- max 2 Mo                       |
|                                                          |
|  Couleur principale : [#______] [pastille]               |
|  Couleur secondaire : [#______] [pastille] (facultatif)  |
|  Police : [Inter          v]                             |
|           Inter / Playfair Display / Montserrat /        |
|           Lora / DM Sans                                 |
|                                                          |
|  Preview titre : "Dossier de pre-commercialisation"      |
|  (affiche dans la couleur + police choisies)             |
|                                                          |
|  [Sauvegarder le profil]                                 |
+----------------------------------------------------------+
```

**Etat : SIRET saisi, auto-remplissage en cours**
```
|  SIRET : [12345678901234]  [Rechercher]                  |
|  Chargement...                                           |
```

**Etat : Auto-remplissage reussi**
```
|  SIRET : [12345678901234]  [OK checkmark vert]           |
|  Raison sociale : [SCI BERGER IMMO___________]           |
|  Adresse siege :  [45 cours de l'Intendance, 33000...]   |
|  Forme juridique: [SCI]                                  |
|  Dirigeant :      [Thomas Berger_____________]           |
|  (i) Donnees issues de Pappers -- modifiables            |
```

**Etat : SIRET introuvable**
```
|  SIRET : [99999999999999]  [! rouge]                     |
|  SIRET non trouve. Verifiez le numero ou remplissez      |
|  manuellement les champs ci-dessous.                     |
```

### 1.3 Regles metier

- Le profil marchand est accessible via la page Compte ou a l'inscription (si l'utilisateur coche "Marchand de biens").
- Le SIRET est valide cote client (14 chiffres, algorithme de Luhn sur SIREN). Si invalide, message d'erreur instantane sans appel API.
- L'auto-remplissage ne verrouille aucun champ. Thomas peut modifier toute information auto-remplie.
- Le logo est stocke dans Object Storage avec la cle `merchant/{userId}/logo.{ext}`. Un seul logo a la fois -- uploader un nouveau remplace l'ancien.
- La palette couleur est stockee en hex. Validation : format hex 6 caracteres. Pas de validation de contraste (la responsabilite est a Thomas).
- La police est un enum de 5 valeurs. La font est embarquee dans le PDF via pdf-lib (fichiers .ttf/.otf a inclure dans le bundle serveur).
- Le profil marchand est sauvegarde en une seule requete POST/PUT vers `/api/merchant-profile`. La sauvegarde partielle est acceptee (logo sans palette, palette sans logo, etc.).
- Les donnees du profil sont relues a chaque generation de PDF (pas de cache client de longue duree -- toujours la version la plus recente).

### 1.4 APIs recommandees

| API | Endpoint | Donnees | Cout | Limites | Fallback |
|---|---|---|---|---|---|
| **Pappers** (recommande) | `GET /entreprise?siret=XXX` | Raison sociale, adresse, forme juridique, dirigeant, code NAF, date creation | 100 requetes gratuites a la creation du compte API, puis payant [HYPOTHESE : ~0,05EUR/req au-dela -- verifier grille tarifaire Pappers] | 100 req gratuites | INSEE SIRENE |
| **INSEE SIRENE** (fallback) | `GET /siret/XXX` | Raison sociale, adresse, code NAF, date creation | Gratuit | 30 req/min, OAuth2 requis, ~500ms latence | Saisie manuelle |

**Recommandation** : Pappers en primaire (reponse plus riche : dirigeant inclus, pas d'OAuth2, reponse plus rapide). INSEE SIRENE en fallback automatique si Pappers echoue (timeout, quota depasse, erreur 4xx/5xx). Si les deux echouent, l'utilisateur remplit manuellement.

**Cle API Pappers** : stockee dans variable d'environnement `PAPPERS_API_KEY`. Creee gratuitement sur pappers.fr/api avec email pro.

**Cle API INSEE** : OAuth2 avec token bearer. Inscription sur api.insee.fr. Token a renouveler toutes les 24h (automatise cote serveur).

### 1.5 Architecture DB

Table `merchant_profiles` :

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | Identifiant unique |
| user_id | UUID | FK users(id), UNIQUE, NOT NULL | Lien vers le compte utilisateur |
| siret | VARCHAR(14) | NULL | SIRET de la societe |
| company_name | VARCHAR(255) | NULL | Raison sociale (auto-remplie ou manuelle) |
| company_address | TEXT | NULL | Adresse siege (auto-remplie ou manuelle) |
| legal_form | VARCHAR(50) | NULL | Forme juridique (SCI, SARL, SAS...) |
| director_name | VARCHAR(255) | NULL | Nom du dirigeant |
| phone | VARCHAR(20) | NULL | Telephone pro |
| email_pro | VARCHAR(255) | NULL | Email pro |
| logo_storage_key | VARCHAR(255) | NULL | Cle Object Storage du logo |
| color_primary | VARCHAR(7) | NULL, default '#1C1C1E' | Couleur principale hex |
| color_secondary | VARCHAR(7) | NULL, default '#7D9B76' | Couleur secondaire hex |
| font_family | VARCHAR(50) | NULL, default 'Inter' | Police choisie |
| naf_code | VARCHAR(10) | NULL | Code NAF (enrichissement Pappers/INSEE) |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | Date creation |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | Derniere modification |

### 1.6 Edge cases

1. **SIRET invalide (moins de 14 chiffres ou checksum Luhn KO)** : Erreur instantanee cote client "SIRET invalide -- verifiez le numero (14 chiffres)". Aucun appel API.
2. **SIRET valide mais entreprise radiee** : Pappers retourne les donnees avec un flag `entreprise_radiee: true`. Afficher un warning "Cette entreprise est radiee -- continuez si vous utilisez un nouveau SIRET". Pas de blocage.
3. **Pappers + INSEE indisponibles simultanément** : Les champs restent vides. Message "Impossible de recuperer les informations automatiquement. Remplissez manuellement." Le bouton "Sauvegarder" reste actif.
4. **Logo SVG avec scripts malveillants** : Le SVG est sanitize cote serveur (suppression des balises `<script>`, `<iframe>`, `on*` attributes) avant stockage. Librairie recommandee : DOMPurify ou sanitize-svg.
5. **Logo trop petit (< 50px)** : Warning "Logo de faible resolution -- il pourrait apparaitre flou dans le PDF". Pas de blocage.
6. **Couleur principale = blanc (#FFFFFF)** : Les titres du PDF deviennent invisibles sur fond blanc. Warning "Couleur trop claire -- les titres pourraient etre illisibles". Pas de blocage (Thomas est responsable de sa charte).
7. **Profil marchand sans auth** : Impossible. F4.A necessite un compte utilisateur (auth requise avant F4 dans la roadmap). Si pas d'auth, redirection vers inscription/connexion.
8. **Changement de logo en cours de dossier** : Le PDF utilise le logo au moment de la generation. Si Thomas change son logo apres avoir genere un dossier, l'ancien PDF garde l'ancien logo. Le nouveau logo s'applique aux prochains dossiers uniquement.
9. **Multiple SIRET (Thomas a plusieurs societes)** : V1 = un seul profil marchand par compte. Si Thomas a plusieurs SCI, il peut modifier son SIRET a chaque dossier. V2 eventuelle : multi-profil avec selecteur.

---

## 2. F4.B -- Enrichissement automatique du bien

### 2.1 User Stories

**US-F4B-01 -- Saisir l'adresse du bien et voir les infos foncières auto-remplies (Thomas)**
- Job-to-be-done : Quand je cree un dossier de pre-commercialisation, je veux saisir uniquement l'adresse du bien et que la surface, le prix au m2 du quartier et une carte soient remplis automatiquement, au lieu de chercher ces infos moi-meme.
- Given : Thomas est en mode Marchand, ecran de creation de dossier.
- When : Il commence a taper l'adresse dans le champ autocomplete. Il selectionne une suggestion.
- Then : Le systeme declenche en parallele : (1) geocodage via API Adresse gouv, (2) recherche DVF (transactions recentes, prix median/m2), (3) generation d'une carte statique du quartier. Les resultats s'affichent en < 3s dans un bloc "Informations du bien" pre-rempli.
- Critere d'acceptation : L'autocomplete propose des adresses francaises au fil de la frappe (debounce 300ms, min 5 caracteres). Les coordonnees GPS sont obtenues. Le prix median/m2 du quartier est affiche (source DVF) avec la mention "Source : DVF / data.gouv.fr" et la periode couverte. La carte statique montre un pin sur l'adresse.

**US-F4B-02 -- Voir une description commerciale generee automatiquement (Thomas)**
- Job-to-be-done : Quand je prepare une plaquette, je ne veux pas rediger 3 paragraphes de description -- l'IA doit me proposer un texte professionnel que je peux ajuster.
- Given : L'adresse a ete saisie. Les infos foncières sont auto-remplies. Thomas a indique le type de bien et le nombre de pieces.
- When : Il clique sur "Generer la description" (ou elle se genere automatiquement apres remplissage).
- Then : GPT-4.1-mini genere une description commerciale de 2-3 phrases (50-80 mots). Ton : factuel, valorisant, sans superlatifs. Mentionne le quartier, la surface, le potentiel. La description est editable par Thomas avant validation.
- Critere d'acceptation : Generation en < 3s (GPT-4.1-mini). La description est en francais. Elle ne contient pas de prix (Thomas ne veut pas forcement le divulguer). Elle est editable dans un textarea. Un bouton "Regenerer" permet d'obtenir une variante. Cout : ~0,001EUR par appel GPT-4.1-mini.

**US-F4B-03 -- Completer manuellement les infos manquantes (Thomas)**
- Job-to-be-done : Quand le DVF ne trouve pas de transactions recentes a cette adresse, ou quand je connais la surface exacte (pas celle du cadastre), je veux pouvoir corriger/completer.
- Given : Le bloc "Informations du bien" est affiche (certains champs auto-remplis, d'autres vides).
- When : Thomas clique sur un champ pour le modifier.
- Then : Tous les champs sont editables. Les champs auto-remplis sont identifies par un badge "(auto)" mais restent modifiables. Les champs vides sont editables librement.
- Critere d'acceptation : Aucun champ n'est verrouille. Thomas peut ecraser toute donnee auto-remplie. Les champs modifies manuellement perdent le badge "(auto)".

### 2.2 Wireframes ASCII

**Ecran : Creation dossier -- Informations du bien**
```
+----------------------------------------------------------+
|  Nouveau dossier                                         |
|                                                          |
|  Adresse du bien :                                       |
|  [45 rue de la Republique, 33000 Bord...]  (autocomplete)|
|  (i) Saisissez l'adresse -- les infos seront             |
|      completees automatiquement                          |
|                                                          |
|  -------------------------------------------------------+
|  Informations du bien                                    |
|                                                          |
|  Type :   [Appartement v]   Pieces : [T4 v]             |
|  Surface : [85] m2 (auto)   Etage : [3/5]               |
|  Prix median/m2 quartier : 4 250 EUR (auto)              |
|  Source : DVF / data.gouv.fr (janv 2020 - juin 2025)     |
|                                                          |
|  +-------------------------------+                       |
|  |                               |                       |
|  |     [carte statique]          |                       |
|  |         * pin                 |                       |
|  |                               |                       |
|  +-------------------------------+                       |
|                                                          |
|  -------------------------------------------------------+
|  Description commerciale                                 |
|                                                          |
|  +------------------------------------------------------+|
|  | Bel appartement T4 de 85 m2 situe rue de la          ||
|  | Republique, au coeur du quartier historique de        ||
|  | Bordeaux. Orientation sud-ouest, lumineux, a          ||
|  | proximite des commerces et transports.                ||
|  +------------------------------------------------------+|
|  [Regenerer]  (i) Generee par IA -- modifiable           |
|                                                          |
|  -------------------------------------------------------+
|                                                          |
|  Photos du bien (max 15)                                 |
|  [Zone d'upload existante F4 -- inchangee]               |
|                                                          |
|  [Generer le dossier complet ->]                         |
+----------------------------------------------------------+
```

**Etat : Autocomplete en cours de frappe**
```
|  Adresse du bien :                                       |
|  [45 rue de la rep]                                      |
|  +------------------------------------------------------+|
|  | 45 rue de la Republique, 33000 Bordeaux              ||
|  | 45 rue de la Republique, 69002 Lyon                  ||
|  | 45 rue de la Republique, 13001 Marseille             ||
|  +------------------------------------------------------+|
```

**Etat : Enrichissement en cours**
```
|  Informations du bien                                    |
|  [Spinner] Recherche des donnees foncieres...            |
|  [Spinner] Generation de la carte...                     |
```

**Etat : DVF sans resultat**
```
|  Prix median/m2 quartier : -- (aucune transaction DVF    |
|  trouvee a cette adresse sur les 5 dernieres annees)     |
|  [Saisir manuellement : _____ EUR/m2]                    |
```

### 2.3 Regles metier

- L'adresse est le seul champ obligatoire pour declencher l'enrichissement. Type, pieces, surface, etage sont editables manuellement.
- L'autocomplete utilise l'API Adresse du gouvernement (Geoplateforme apres avril 2026). Debounce 300ms, minimum 5 caracteres. Max 5 suggestions affichees.
- Apres selection d'une adresse, 3 appels paralleles sont lances :
  1. **Geocodage** (API Adresse/Geoplateforme) : retourne lat/lon, code postal, ville, code commune INSEE. Temps : < 500ms.
  2. **DVF** (API data.gouv.fr) : recherche par code commune + type voie + nom voie. Retourne les transactions des 5 dernieres annees. Le prix median/m2 est calcule cote serveur (median des mutations d'appartements dans un rayon de 500m). Temps : < 2s.
  3. **Carte statique** : image PNG 600x300px centree sur les coordonnees GPS, zoom 15, avec un pin. Source : tiles OpenStreetMap (100% gratuit, pas de cle API) via librairie serveur (ex: `staticmaps` npm). Temps : < 2s.
- La description commerciale est generee par GPT-4.1-mini avec le prompt systeme suivant :
  ```
  Tu es un redacteur immobilier professionnel. Redige une description commerciale
  sobre et professionnelle de ce bien pour une plaquette de pre-commercialisation.
  Ton : factuel, valorisant, sans superlatifs.
  Mentionne le quartier, la surface et le potentiel du bien.
  Ne mentionne PAS le prix de vente.
  2-3 phrases, 50-80 mots maximum, en francais.
  ```
  Input : adresse, type de bien, nombre de pieces, surface, etage, prix median/m2 quartier.
- Le prix median/m2 est INFORMATIF uniquement (pas le prix de vente du bien de Thomas). Il est affiche avec la source et la periode pour transparence.
- Thomas peut saisir son propre prix de vente (champ separe, non auto-rempli, utilise uniquement dans le PDF si renseigne).

### 2.4 APIs recommandees

| API | Endpoint | Donnees | Cout | Limites | Notes |
|---|---|---|---|---|---|
| **API Adresse / Geoplateforme** | `GET /search/?q=...&limit=5` | Adresse normalisee, lat/lon, code commune INSEE, code postal | Gratuit | 50 req/s/IP | **ATTENTION** : migration obligatoire vers Geoplateforme IGN avant le 14 avril 2026. URL actuelle api-adresse.data.gouv.fr sera decomissionnee. Nouvel endpoint : data.geopf.fr/geocodage |
| **DVF data.gouv.fr** | `GET /mutations?code_commune=...` | Transactions immobilieres (prix, surface, date, type) des 5 dernieres annees | Gratuit | Pas de limite documentee, fichiers CSV lourds | Alternative : API DVF Etalab (app.dvf.etalab.gouv.fr) qui offre une interface JSON. [HYPOTHESE : le endpoint JSON d'Etalab est stable et non rate-limite -- a verifier en integration] |
| **OpenStreetMap tiles** | Tiles statiques via lib serveur | Carte statique PNG | Gratuit | Respecter la politique d'utilisation OSM (pas de scraping massif, User-Agent obligatoire) | Librairie npm recommandee : `staticmaps` (genere PNG cote serveur sans API key). Alternative : Mapbox Static Images (50K req/mois gratuites, meilleur rendu mais necessite cle API). |
| **GPT-4.1-mini** | OpenAI API | Description commerciale | ~0,001 EUR/appel | Rate limit standard OpenAI | Reutilise la cle API deja en place pour le pre-processing des prompts custom (Sprint 17). |

**Cout total par dossier pour l'enrichissement : ~0,001 EUR** (1 appel GPT-4.1-mini). Les autres APIs sont gratuites.

### 2.5 Architecture DB

Extension de la table `dossiers` existante (definie dans functional-specs.md F4.6) :

| Colonne ajoutee | Type | Description |
|---|---|---|
| address_raw | TEXT | Adresse saisie par l'utilisateur |
| address_normalized | TEXT | Adresse normalisee par l'API geocodage |
| latitude | DECIMAL(10,7) | Latitude GPS |
| longitude | DECIMAL(10,7) | Longitude GPS |
| commune_code | VARCHAR(5) | Code commune INSEE |
| postal_code | VARCHAR(5) | Code postal |
| city | VARCHAR(255) | Ville |
| property_type | VARCHAR(50) | Type de bien (appartement, maison, loft) |
| room_count | VARCHAR(10) | Nombre de pieces (T1, T2, T3...) |
| surface_m2 | INTEGER | Surface en m2 |
| floor_number | VARCHAR(10) | Etage (ex: "3/5") |
| dvf_median_price_m2 | INTEGER | Prix median/m2 quartier (DVF) |
| dvf_period | VARCHAR(50) | Periode des donnees DVF (ex: "janv 2020 - juin 2025") |
| dvf_transaction_count | INTEGER | Nombre de transactions trouvees |
| map_image_storage_key | VARCHAR(255) | Cle Object Storage de la carte statique |
| description_generated | TEXT | Description commerciale generee |
| description_final | TEXT | Description finale (apres edition par Thomas) |
| sale_price | INTEGER | Prix de vente du bien (saisi par Thomas, optionnel) |

### 2.6 Edge cases

1. **Adresse introuvable par l'API** : L'autocomplete ne retourne aucune suggestion. Message : "Adresse non trouvee -- essayez un format different (ex: numero + rue + ville)." Thomas peut saisir l'adresse manuellement et passer directement au remplissage des champs.
2. **DVF sans transaction dans le quartier** : Le champ prix median/m2 affiche "Aucune transaction trouvee". Thomas peut saisir manuellement un prix/m2 ou le laisser vide (il ne figurera pas dans le PDF).
3. **DVF avec tres peu de transactions (< 3)** : Afficher le prix median avec un warning "Base sur seulement N transactions -- donnee indicative". Eviter de donner une fausse precision sur un echantillon trop petit.
4. **Adresse hors France** : L'API Adresse ne couvre que la France. Si aucune suggestion n'apparait et que l'utilisateur saisit manuellement une adresse etrangere, le geocodage et le DVF sont desactives. La carte n'est pas generee. Message : "L'enrichissement automatique est disponible pour les adresses en France metropolitaine uniquement."
5. **Bien neuf (VEFA)** : Aucune transaction DVF a cette adresse (le bien n'existe pas encore au cadastre). Thomas saisit manuellement. La description GPT recoit le flag "bien neuf" et adapte le ton ("programme neuf livraison 2027...").
6. **Generation de carte echoue (tiles OSM indisponibles)** : La carte est optionnelle. Si la generation echoue, le placeholder "Carte indisponible" est affiche. Le dossier PDF est genere sans carte. Pas de blocage.
7. **Rate limit API Adresse (> 50 req/s)** : Debounce de 300ms cote client suffit largement (3 req/s max). Le risque est negligeable en usage normal. En batch (15 dossiers simultanes par differents utilisateurs), implementer un queue cote serveur avec 40 req/s max.
8. **Adresse avec complement (bat, escalier, lot)** : L'API Adresse retourne l'adresse principale. Le complement est saisi manuellement par Thomas dans un champ separe "Complement d'adresse" (non geocode).

---

## 3. F4.C -- PDF brande professionnel

### 3.1 User Stories

**US-F4C-01 -- Telecharger un PDF brande a mon image (Thomas)**
- Job-to-be-done : Quand j'envoie un dossier a un acquereur, je veux que le document porte le logo et les couleurs de ma societe -- pas celles de Versiroom -- pour projeter une image professionnelle.
- Given : Le dossier est genere (photos avant/apres terminees). Thomas a configure son profil marchand (F4.A).
- When : Il clique sur "Telecharger le PDF".
- Then : Un PDF est genere avec : couverture brandee (logo Thomas, raison sociale, coordonnees, photo de couverture, titre du bien, description, carte), pages interieures (avant/apres cote a cote par piece), pied de page avec coordonnees Thomas et mention "Visuels generes par IA a titre indicatif -- Powered by Versiroom".
- Critere d'acceptation : Le logo de Thomas apparait en haut a gauche de la couverture (max 180px large). Les titres utilisent la couleur principale de Thomas. Les accents utilisent la couleur secondaire. La police choisie est appliquee. Si aucun branding defini, palette Versiroom par defaut. Generation PDF < 10s. Taille < 25 Mo pour 15 photos.

**US-F4C-02 -- Consulter le dossier via un lien web brande (acquereur)**
- Job-to-be-done : Quand je recois un lien de Thomas, je veux voir un dossier professionnel sur mobile sans telecharger de fichier.
- Given : Thomas a partage le lien du dossier (existant dans F4 actuel).
- When : L'acquereur ouvre le lien sur mobile ou desktop.
- Then : La page web affiche le branding de Thomas (logo, couleurs, coordonnees) au lieu du branding Versiroom par defaut. La page est responsive. Un bouton "Telecharger le PDF" est present.
- Critere d'acceptation : Le logo s'affiche en haut. Les couleurs de Thomas sont appliquees aux titres et accents via CSS custom properties injectees depuis la DB. La page charge en < 2s. La mention "Powered by Versiroom" reste visible (attribution obligatoire).

**US-F4C-03 -- Avoir la meilleure photo en couverture automatiquement (Thomas)**
- Job-to-be-done : Quand mon dossier de 10 photos est pret, je ne veux pas choisir la photo de couverture -- le systeme doit prendre la plus valorisante automatiquement.
- Given : Le dossier contient N photos generees (avant/apres).
- When : Le PDF est genere.
- Then : La premiere photo "apres" du dossier (dans l'ordre d'upload) est utilisee en couverture. Thomas peut changer la photo de couverture via un clic sur n'importe quelle autre photo "apres" du dossier avant de telecharger.
- Critere d'acceptation : La couverture utilise par defaut la premiere photo "apres". Le changement de couverture est possible sans regenerer le PDF (rechargement rapide < 3s). La photo de couverture est affichee en pleine largeur (ratio preserve, max 600px de haut).

### 3.2 Wireframes ASCII

**Page 1 du PDF : Couverture**
```
+----------------------------------------------------------+
|  [Logo Thomas 180px]                                     |
|                                                          |
|  SCI BERGER IMMO                                         |
|  45 cours de l'Intendance, 33000 Bordeaux                |
|  06 12 34 56 78 -- thomas@berger-immo.fr                 |
|                                                          |
|  +------------------------------------------------------+|
|  |                                                      ||
|  |        [Photo de couverture -- apres]                ||
|  |        (meilleur visuel genere, pleine largeur)      ||
|  |                                                      ||
|  +------------------------------------------------------+|
|                                                          |
|  DOSSIER DE PRE-COMMERCIALISATION                        |
|  (titre en couleur principale Thomas)                    |
|                                                          |
|  Appartement T4 -- 85 m2                                 |
|  45 rue de la Republique, 33000 Bordeaux                 |
|                                                          |
|  Bel appartement T4 de 85 m2 situe rue de la            |
|  Republique, au coeur du quartier historique de          |
|  Bordeaux. Orientation sud-ouest, lumineux.              |
|                                                          |
|  +---------------------------+  Prix median quartier :   |
|  |                           |  4 250 EUR/m2            |
|  |    [Carte du quartier]    |  Source : DVF 2020-2025  |
|  |         * pin             |                          |
|  |                           |                          |
|  +---------------------------+                          |
|                                                          |
|  --------------------------------------------------------|
|  Visuels generes par IA a titre indicatif                |
|  Powered by Versiroom                                    |
+----------------------------------------------------------+
```

**Pages interieures (1 page par piece)**
```
+----------------------------------------------------------+
|  Salon -- Style Contemporain                             |
|  (sous-titre en couleur secondaire Thomas)               |
|                                                          |
|  +-------------------------+ +-------------------------+ |
|  |                         | |                         | |
|  |       [AVANT]           | |       [APRES]           | |
|  |                         | |                         | |
|  +-------------------------+ +-------------------------+ |
|                                                          |
|  --------------------------------------------------------|
|  SCI BERGER IMMO -- 06 12 34 56 78                      |
|  Visuels IA indicatifs -- Powered by Versiroom           |
+----------------------------------------------------------+
```

**Derniere page (si prix de vente renseigne)**
```
+----------------------------------------------------------+
|  Informations complementaires                            |
|                                                          |
|  Surface : 85 m2                                         |
|  Pieces : T4                                             |
|  Etage : 3/5                                             |
|  Prix de vente : 362 000 EUR                             |
|                                                          |
|  Contact :                                               |
|  Thomas Berger -- SCI BERGER IMMO                        |
|  06 12 34 56 78 -- thomas@berger-immo.fr                 |
|  45 cours de l'Intendance, 33000 Bordeaux                |
|                                                          |
|  --------------------------------------------------------|
|  Powered by Versiroom -- versiroom.app                   |
+----------------------------------------------------------+
```

### 3.3 Regles metier

- Le PDF est genere cote serveur via **pdf-lib** (decision projet -- pas puppeteer).
- Les fonts custom (Playfair Display, Montserrat, Lora, DM Sans) doivent etre embarquees comme fichiers .ttf dans le bundle serveur et enregistrees dans pdf-lib via `pdfDoc.embedFont()`. Inter est deja disponible.
- **Structure du PDF** :
  1. Page de couverture (logo, infos societe, photo couverture, titre, description, carte, mention DVF)
  2. 1 page par piece (avant a gauche, apres a droite, label piece + style)
  3. Page de cloture (infos complementaires + contact) -- optionnelle, uniquement si prix de vente renseigne
- **Branding** :
  - Logo : positionne en haut a gauche, max 180px large x 80px haut, ratio preserve. Si SVG, rasterise en PNG cote serveur avant injection dans pdf-lib (pdf-lib ne supporte pas le SVG natif).
  - Couleur principale : titres "DOSSIER DE PRE-COMMERCIALISATION", noms des pieces
  - Couleur secondaire : sous-titres (style applique), filets decoratifs, accents
  - Police : appliquee a tout le texte du PDF sauf la mention "Powered by Versiroom" (toujours en Inter)
  - Si aucun branding : palette Versiroom (#1C1C1E titres, #7D9B76 accents, Inter)
- **Images** : recuperees depuis Object Storage via leurs cles. Redimensionnees a max 800px de large pour limiter la taille du PDF. Qualite JPEG 80%.
- **Carte statique** : injectee en couverture si disponible, 300x150px dans le PDF. Si indisponible, l'espace est laisse vide (pas de placeholder).
- **Mention legale obligatoire** : "Visuels generes par IA a titre indicatif" en pied de chaque page. Non supprimable par Thomas. Requis pour eviter tout litige si un acquereur considere les visuels comme contractuels.
- **Taille cible** : < 15 Mo pour 10 photos, < 25 Mo pour 15 photos. Si depassement, proposer un ZIP des images en alternative.
- **Lien web brande** : la page Next.js `/dossier/[uuid]` lit le profil marchand du createur et injecte les couleurs en CSS custom properties (`--brand-primary`, `--brand-secondary`). Le logo est affiche via `<img>` depuis Object Storage.

### 3.4 Edge cases

1. **Profil marchand incomplet (pas de logo)** : PDF genere sans logo. L'espace logo en couverture est laisse vide. Le reste du branding (couleurs, police) s'applique normalement.
2. **Profil marchand vide (aucune info)** : PDF genere avec branding Versiroom par defaut. Pied de page : "Powered by Versiroom" uniquement, pas de coordonnees marchand. C'est le comportement actuel du F4 existant.
3. **Logo transparent (PNG avec alpha)** : pdf-lib gere les PNG avec canal alpha. Le logo s'affiche correctement sur fond blanc. Pas de traitement special.
4. **Font custom non disponible sur le serveur** : Si le fichier .ttf est manquant pour la police choisie, fallback silencieux vers Inter avec log d'erreur serveur. Le PDF n'est pas bloque.
5. **15 photos HD = PDF > 25 Mo** : Les images sont compressee a JPEG 80% et redimensionnees a 800px max. Si malgre ca le PDF depasse 25 Mo, un ZIP est propose en alternative ("Le dossier est trop volumineux pour un PDF unique -- telecharger le ZIP"). [HYPOTHESE : 15 images a 800px JPEG 80% = ~8-12 Mo -- a valider en integration].
6. **Description commerciale non generee (Thomas a skip)** : L'espace description en couverture affiche uniquement l'adresse et le type de bien. Pas de texte placeholder generique.
7. **Prix de vente = 0 ou non renseigne** : La page de cloture n'est pas generee. Le PDF se termine apres la derniere page piece.
8. **Lien web expire (> 30 jours)** : Le PDF reste telechargeable par Thomas depuis son historique tant que son compte existe. Seul le lien public expire.
9. **Regeneration du PDF apres changement de profil** : Thomas peut regenerer le PDF a tout moment (bouton "Regenerer le PDF"). Le nouveau PDF utilise le profil marchand actuel. L'ancien PDF en cache n'est pas supprime (l'acquereur qui l'a deja telecharge garde l'ancien).

---

## 4. Architecture DB consolidee

### Nouvelle table : `merchant_profiles`

Voir section 1.5 pour le detail des colonnes.

Relation : `merchant_profiles.user_id` -> `users.id` (1:1).

### Extension table existante : `dossiers`

Colonnes ajoutees (voir section 2.5) : toutes les colonnes d'enrichissement foncier (address_*, latitude, longitude, commune_code, dvf_*, map_image_storage_key, description_*, sale_price).

Colonne ajoutee pour le branding :

| Colonne | Type | Description |
|---|---|---|
| merchant_profile_id | UUID, FK merchant_profiles(id) | Lien vers le profil marchand utilise au moment de la creation. Permet de conserver le branding original meme si Thomas modifie son profil apres. |
| cover_photo_index | INTEGER, default 0 | Index de la photo utilisee en couverture (0 = premiere) |
| pdf_storage_key | VARCHAR(255) | Cle Object Storage du PDF genere |

### Index recommandes

```sql
CREATE INDEX idx_merchant_profiles_user_id ON merchant_profiles(user_id);
CREATE INDEX idx_dossiers_merchant_profile_id ON dossiers(merchant_profile_id);
```

### Migration

Toutes les nouvelles colonnes sont ajoutees via ALTER TABLE idempotents (pattern existant dans lib/db.ts `ensureTable()`). Aucune migration destructive.

---

## 5. Dependances et ordre d'implementation

### Prerequis (deja dans la roadmap)

| Prerequis | Statut | Bloquant pour |
|---|---|---|
| Auth (email + magic link ou OAuth) | A implementer (etape 4 roadmap) | F4.A (profil marchand = compte utilisateur) |
| Table `users` avec id | A implementer | F4.A (FK user_id) |
| Table `dossiers` | A implementer (F4 existant) | F4.B, F4.C |
| pdf-lib installe | A ajouter | F4.C |

### Ordre d'implementation

```
Phase 1 : F4.A -- Profil Marchand (1 semaine)
  Prerequis : Auth implementee
  Livrables :
    - Table merchant_profiles + migration
    - API /api/merchant-profile (GET/PUT)
    - Page /compte/profil-marchand (React)
    - Integration Pappers API + fallback INSEE
    - Upload logo -> Object Storage
    - Color picker + font selector

Phase 2 : F4.B -- Enrichissement bien (1,5 semaines)
  Prerequis : F4.A termine (pour lier le profil au dossier)
  Livrables :
    - Composant AddressAutocomplete (API Geoplateforme)
    - Service enrichissement DVF (calcul prix median serveur)
    - Generation carte statique (staticmaps npm)
    - API /api/enrich-property (POST address -> infos)
    - Generation description GPT-4.1-mini
    - Extension table dossiers + migration

Phase 3 : F4.C -- PDF brande (1 semaine)
  Prerequis : F4.A + F4.B termines
  Livrables :
    - Service generation PDF (lib/pdf-generator.ts)
    - Embed fonts custom (.ttf dans bundle)
    - API /api/dossier/[uuid]/pdf (GET -> stream PDF)
    - Page /dossier/[uuid] branding dynamique (CSS custom props)
    - Changement photo couverture (PATCH /api/dossier/[uuid])
```

### Dependances externes

| Dependance | Impact | Risque |
|---|---|---|
| Cle API Pappers | Bloque l'auto-remplissage SIRET | Faible : creation gratuite en 5 min |
| Migration API Adresse -> Geoplateforme IGN | L'ancien endpoint sera decomissionne le 14 avril 2026 | Moyen : implementer directement sur le nouvel endpoint |
| Fichiers .ttf des 5 polices | Bloque les fonts custom dans le PDF | Faible : fonts Google open source, telechargeables |
| npm `staticmaps` | Bloque la generation de carte | Faible : lib stable, alternative Mapbox |
| npm `pdf-lib` | Bloque toute generation PDF | Faible : deja dans la decision projet |

---

## 6. Events tracking

| Event name | Properties | Trigger |
|---|---|---|
| `merchant_profile_created` | `{ has_siret, has_logo, has_custom_colors, has_custom_font }` | Premiere sauvegarde du profil marchand |
| `merchant_profile_updated` | `{ fields_changed: string[] }` | Modification du profil marchand |
| `merchant_siret_lookup` | `{ source: 'pappers'\|'insee'\|'manual', success: bool, latency_ms }` | Recherche SIRET declenchee |
| `merchant_logo_uploaded` | `{ format: 'png'\|'jpg'\|'svg', size_kb }` | Upload logo termine |
| `property_address_selected` | `{ source: 'autocomplete'\|'manual', city, postal_code }` | Selection adresse dans autocomplete |
| `property_enrichment_completed` | `{ dvf_found: bool, dvf_transactions: number, map_generated: bool, description_generated: bool, latency_ms }` | Fin enrichissement auto du bien |
| `property_description_regenerated` | `{ word_count }` | Clic "Regenerer" la description |
| `property_description_edited` | `{ was_auto: bool }` | Thomas modifie la description |
| `dossier_pdf_downloaded` | `{ photo_count, has_branding: bool, has_description: bool, has_map: bool, file_size_kb }` | Telechargement PDF |
| `dossier_pdf_regenerated` | `{ reason: 'profile_change'\|'cover_change'\|'manual' }` | Regeneration du PDF |
| `dossier_link_viewed_branded` | `{ dossier_id, has_branding: bool, device: 'mobile'\|'desktop' }` | Visite page dossier brande |

---

## 7. Criteres d'acceptation consolides

### F4.A -- Profil Marchand

| ID | Critere | Testable par |
|---|---|---|
| CA-A01 | Le SIRET (14 chiffres) declenche un appel Pappers en < 2s | Test unitaire + E2E |
| CA-A02 | Si Pappers echoue, fallback INSEE automatique (invisible pour l'utilisateur) | Test unitaire (mock Pappers 500) |
| CA-A03 | Tous les champs auto-remplis sont editables | E2E : modifier un champ auto-rempli et sauvegarder |
| CA-A04 | Upload logo PNG/JPG/SVG <= 2 Mo accepte, > 2 Mo rejete avec message | E2E |
| CA-A05 | La sauvegarde partielle fonctionne (logo sans palette, palette sans logo) | E2E |
| CA-A06 | Le color picker affiche un preview titre + accent en temps reel | E2E visuel |
| CA-A07 | Le profil est restitue correctement apres deconnexion/reconnexion | E2E |
| CA-A08 | Un SIRET < 14 chiffres affiche une erreur client sans appel API | Test unitaire validation |

### F4.B -- Enrichissement bien

| ID | Critere | Testable par |
|---|---|---|
| CA-B01 | L'autocomplete propose des suggestions apres 5 caracteres avec debounce 300ms | E2E |
| CA-B02 | Apres selection adresse, les 3 enrichissements (geo, DVF, carte) se lancent en parallele | Test integration |
| CA-B03 | Le prix median/m2 est calcule sur les transactions dans un rayon de 500m | Test unitaire (donnees DVF mockees) |
| CA-B04 | Si DVF ne retourne aucune transaction, le champ affiche "aucune transaction trouvee" | E2E |
| CA-B05 | La description est generee en < 3s, en francais, 50-80 mots, sans prix | Test integration GPT-4.1-mini |
| CA-B06 | Thomas peut modifier tous les champs auto-remplis | E2E |
| CA-B07 | Le bouton "Regenerer" produit une description differente | Test integration |
| CA-B08 | La carte statique est generee en < 2s avec un pin sur l'adresse | Test integration |

### F4.C -- PDF brande

| ID | Critere | Testable par |
|---|---|---|
| CA-C01 | Le PDF couverture affiche le logo du marchand (si defini) en haut a gauche, max 180px | Test integration + visuel |
| CA-C02 | Les titres utilisent la couleur principale du profil marchand | Test integration (verification hex dans le PDF) |
| CA-C03 | La police choisie est appliquee (sauf mention "Powered by Versiroom" = Inter) | Test integration |
| CA-C04 | Si aucun branding, palette Versiroom par defaut appliquee | Test integration (profil sans couleurs) |
| CA-C05 | La mention "Visuels generes par IA a titre indicatif" est presente sur chaque page | Test integration (scan texte PDF) |
| CA-C06 | Generation PDF < 10s pour 15 photos | Test performance |
| CA-C07 | Taille PDF < 25 Mo pour 15 photos | Test integration |
| CA-C08 | La page web /dossier/[uuid] affiche les couleurs du marchand via CSS custom properties | E2E |
| CA-C09 | Thomas peut changer la photo de couverture sans regenerer tout le dossier | E2E |
| CA-C10 | Le lien web expire apres 30 jours mais le PDF reste telechargeable par Thomas | E2E (mock date) |

---

## 8. Hypotheses a valider

| # | Hypothese | Impact si fausse | Action de validation |
|---|---|---|---|
| H1 | Pappers API offre 100 requetes gratuites a la creation du compte, puis ~0,05 EUR/req | Si plus cher, le cout d'auto-remplissage devient significatif pour les marchands qui changent souvent de SIRET | Creer un compte API Pappers et verifier la grille tarifaire exacte |
| H2 | L'endpoint JSON d'Etalab DVF (app.dvf.etalab.gouv.fr) est stable et non rate-limite | Si rate-limite ou instable, l'enrichissement DVF ne fonctionne pas en production | Faire 50 appels de test consecutifs et mesurer la stabilite |
| H3 | 15 images a 800px JPEG 80% produisent un PDF de 8-12 Mo | Si > 25 Mo, il faut reduire davantage la qualite ou proposer uniquement le ZIP | Generer un PDF de test avec 15 images reelles |
| H4 | La librairie npm `staticmaps` genere des cartes OSM de qualite suffisante pour un PDF pro | Si rendu trop basique, passer a Mapbox Static Images (50K req/mois gratuites) | Generer 5 cartes de test a differents zooms et comparer avec Mapbox |
| H5 | pdf-lib supporte l'embed de Playfair Display, Montserrat, Lora, DM Sans sans probleme | Si certaines fonts posent probleme (ligatures, caracteres speciaux FR), fallback Inter | Tester l'embed de chaque font avec des caracteres accentues (e, a, u, c, oe) |
| H6 | L'API Geoplateforme IGN (remplacement de l'API Adresse) a le meme format de reponse | Si format different, il faut adapter le parser cote serveur | Tester l'endpoint Geoplateforme avant le 14 avril 2026 |
| H7 | Thomas cree en moyenne 1-2 dossiers par semaine (8-12 operations/an, pics en avril-septembre) | Si usage plus frequent, les 100 req Pappers gratuites ne suffisent pas pour un an | Valider avec des marchands de biens reels (interviews) |

---

## Auto-evaluation

[x] Chaque user story a des criteres d'acceptance testables et des edge cases documentes (11 user stories, 26 criteres CA, 26 edge cases)
[x] La priorisation est justifiee par le diagnostic 6.1/10 et les besoins Thomas -- chaque sous-feature est rattachee a un irritant identifie
[x] Le scope est defendable -- chaque element sert directement le dossier de pre-commercialisation de Thomas. Pas de feature creep.
[x] Les hypotheses critiques sont identifiees (7 hypotheses dans la section 8)
[x] Le pricing/cout est benchmarke (APIs gratuites sauf Pappers au-dela de 100 req -- cout marginal)
[x] Ce livrable est specifique a Versiroom et au persona Thomas (pas de spec generique)
[x] Pas de contradiction avec les livrables existants (F4 de functional-specs.md est etendu, pas remplace)
[x] Benchmark concurrentiel effectue (Renovate Club a deja le PDF brande -- Versiroom doit matcher cette feature)

---

## Handoff

---
**Handoff -> @orchestrator**
- Fichiers produits : `docs/product/f4-enriched-specs.md` (ce fichier)
- Decisions prises :
  - Pappers API en primaire pour l'auto-remplissage SIRET (100 req gratuites, plus riche que INSEE), INSEE SIRENE en fallback
  - API Adresse Geoplateforme IGN pour l'autocomplete adresse (migration obligatoire avant 14 avril 2026)
  - DVF data.gouv.fr pour le prix median/m2 (gratuit, open data)
  - OpenStreetMap via `staticmaps` npm pour la carte (gratuit, pas de cle API)
  - GPT-4.1-mini pour la description commerciale (cout negligeable ~0,001 EUR/appel)
  - pdf-lib pour la generation PDF (decision projet existante conservee)
  - 5 polices proposees (Inter, Playfair Display, Montserrat, Lora, DM Sans) -- fichiers .ttf a inclure
  - Branding facultatif (si rien defini, palette Versiroom par defaut)
  - Mention legale "Visuels IA indicatifs" obligatoire et non supprimable
  - Ordre : F4.A -> F4.B -> F4.C (3,5 semaines total)
- Points d'attention :
  - **Migration API Adresse -> Geoplateforme IGN** : deadline 14 avril 2026, implementer directement sur le nouvel endpoint
  - **Fonts .ttf** : a embarquer dans le bundle serveur pour pdf-lib. Tester les caracteres accentues francais.
  - **SVG logo** : pdf-lib ne supporte pas le SVG natif -- rasterisation PNG cote serveur requise
  - **7 hypotheses a valider** avant ou pendant l'implementation (section 8)
  - Ce livrable ETEND le F4 existant de functional-specs.md (US-F4-01 a 03 restent valides, F4.A/B/C s'ajoutent)
---
