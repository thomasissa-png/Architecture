# Specs fonctionnelles — Parcours marchand Versimo
**Version** : 1.0 | **Date** : 2026-04-09 | **Agent** : @product-manager
**Persona** : Thomas Berger, 35 ans, marchand de biens, Bordeaux, 8-12 ops/an
**Stack** : Next.js 14, GPT-4.1 vision (extraction), gpt-image-1.5 Responses API (visuels), pipeline 2 passes
**Pricing** : 99€/bien (ou inclus abonnement Pro 29€/mois)

---

## 1. Vue d'ensemble du parcours (7 étapes)

```
Thomas arrive sur /pro (landing marchand)
         |
         v
[ÉTAPE 1] Création du projet
  Upload plan (PDF/JPG/PNG/photo) + infos bien (adresse, type, surface)
  → Projet créé en DB, statut "plan_uploaded"
         |
         v
[ÉTAPE 2] Extraction IA du plan
  GPT-4.1 vision → JSON {pièces, dimensions, ouvertures}
  → Statut "extraction_done" (ou "extraction_failed" si plan illisible)
         |
         v
[ÉTAPE 3] Validation par le marchand
  UI tableau éditable — Thomas corrige noms, surfaces, affectations
  Si immeuble multi-lots : confirmation de la découpe en lots
  → Statut "validated"
         |
         v
[ÉTAPE 4] Qualification des besoins
  Cible acheteur par lot, style, budget travaux, contraintes
  → Statut "qualified"
         |
         v
[ÉTAPE 5] Recommandations architecte IA
  GPT-4.1 text analyse le JSON validé → suggestions réagencement
  Thomas accepte / refuse chaque reco → plan final validé
  → Statut "plan_final"
         |
         v
[ÉTAPE 6] Génération des visuels
  Photos réelles (si uploadées) ou prompt-only (si pas de photo)
  Pipeline 2 passes enrichi dimensions — 1 visuel/pièce
  → Statut "visuals_done"
         |
         v
[ÉTAPE 7] Dossier de pré-commercialisation
  1 PDF par lot : plan annoté + visuels meublés + description commerciale
  Partage WhatsApp / email / lien direct
  → Statut "delivered"
```

**Paiement** : déclenché avant l'Étape 6 (génération visuels). Thomas paie 99€/bien ou le projet est débité de ses crédits Pro. Aucune génération sans paiement validé.

**Accès** : parcours réservé aux utilisateurs authentifiés (NextAuth.js). Les étapes 1-5 sont accessibles en session gratuite (aucune génération IA coûteuse). Le paiement est requis uniquement pour déclencher les étapes 6-7.

---

## 2. Étape 1 — Création du projet

### US-PM-01 : Créer un nouveau projet bien

**Persona** : Thomas Berger
**Epic** : Création projet
**Dépendances** : Aucune (entrée du parcours)
**Priorité RICE** : R=500 I=10 C=9 E=1 → Score=45 000

#### Job-to-be-done
En tant que Thomas, je veux créer un projet pour un bien précis afin de démarrer le pipeline de pré-commercialisation de ce bien et retrouver mon travail entre les sessions.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas est authentifié sur /pro WHEN il clique "Nouveau projet" THEN un formulaire s'affiche avec les champs : adresse (texte libre), type de bien (enum), surface totale (number, m²), et zone upload plan
- [ ] GIVEN Thomas remplit tous les champs obligatoires et uploade un plan WHEN il clique "Créer le projet" THEN le projet est créé en DB, statut = "plan_uploaded", et Thomas est redirigé vers l'étape 2 (extraction)
- [ ] GIVEN Thomas a un abonnement Pro actif WHEN le projet est créé THEN aucun paiement n'est demandé à cette étape (paiement déclenché en étape 6)

**Cas d'erreur :**
- [ ] GIVEN Thomas n'uploade pas de plan WHEN il soumet le formulaire THEN le submit est bloqué, message : "Un plan est requis pour lancer l'analyse. Formats acceptés : PDF, JPG, PNG, HEIC."
- [ ] GIVEN Thomas uploade un fichier de plus de 20 Mo WHEN l'upload démarre THEN le fichier est rejeté côté client avant envoi, message : "Fichier trop lourd (max 20 Mo). Compressez votre PDF ou réduisez la résolution."

**Cas limites :**
- [ ] GIVEN Thomas uploade un PDF multi-pages (> 10 pages) WHEN le fichier est accepté THEN seule la première page est analysée par GPT-4.1 vision, un message indique : "Seule la première page du PDF sera analysée. Uploadez un plan par lot si votre immeuble a plusieurs niveaux."
- [ ] GIVEN Thomas soumet le formulaire deux fois rapidement WHEN les deux requêtes arrivent côté serveur THEN un seul projet est créé (idempotence sur l'adresse + horodatage < 5s)

**Permissions :**
- [ ] GIVEN un visiteur non authentifié WHEN il tente d'accéder à /pro/new THEN il est redirigé vers /connexion avec le message : "Créez votre compte gratuit pour démarrer."

**Données existantes :**
- [ ] GIVEN Thomas a déjà 10 projets actifs WHEN il crée un 11e projet THEN le projet est créé sans restriction (pas de limite sur le tier Pro)

#### Données et champs
| Champ | Type | Obligatoire | Validation | Limites | Exemple |
|---|---|---|---|---|---|
| adresse | string | Oui | Non vide, max 200 chars | 5–200 caractères | "12 rue des Chartrons, 33000 Bordeaux" |
| type_bien | enum | Oui | Valeur dans la liste | immeuble / appartement / maison / bureaux / local_commercial | "immeuble" |
| surface_totale | number | Non | > 0, max 10 000 | 1–10 000 m² | 320 |
| plan_file | file | Oui | PDF/JPG/PNG/HEIC/WEBP, max 20 Mo | 1 fichier | plan_rdc.pdf |

#### 5 états UI
| État | Comportement | Message/Affichage |
|---|---|---|
| Défaut | Formulaire vide + zone drag & drop plan | Champs vides, bouton "Créer le projet" grisé |
| Loading | Upload en cours (progress bar) + création DB | "Envoi du plan… [barre de progression]" |
| Vide | N/A — cet écran est un formulaire de création | N/A |
| Erreur | Validation KO ou upload échoué | Message erreur inline sous le champ concerné |
| Succès | Projet créé → redirection automatique vers étape 2 | Toast : "Projet créé. Analyse du plan en cours…" |

#### Payload API
- **Endpoint** : POST /api/pro/projects
- **Authentification** : session cookie NextAuth
- **Rate limit** : 10 projets/heure par user
- **Request body** : `{ adresse: string, type_bien: enum, surface_totale?: number, plan_file: File (multipart) }`
- **Response succès** : `{ project_id: string, status: "plan_uploaded" }` — HTTP 201
- **Response erreur** : `{ error: "PLAN_REQUIRED" | "FILE_TOO_LARGE" | "INVALID_TYPE" }` — HTTP 400/422

#### Events analytics
| Event | Trigger | Propriétés | Funnel |
|---|---|---|---|
| project_created | POST /api/pro/projects 201 | type_bien, has_surface, file_type | activation |
| project_create_failed | POST /api/pro/projects 4xx | error_code, file_size | activation |

---

### US-PM-02 : Uploader un plan de bonne qualité depuis mobile

**Persona** : Thomas Berger (iPhone 15 Pro, sur chantier)
**Epic** : Création projet
**Dépendances** : US-PM-01
**Priorité RICE** : R=500 I=8 C=8 E=1 → Score=32 000

#### Job-to-be-done
En tant que Thomas sur chantier, je veux prendre une photo du plan affiché au mur ou d'un scan PDF avec mon iPhone afin de démarrer l'analyse sans retourner au bureau.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas est sur /pro/new sur mobile WHEN il tape la zone d'upload THEN le sélecteur de fichiers iOS propose : "Prendre une photo" et "Choisir dans la bibliothèque" en plus des fichiers
- [ ] GIVEN Thomas uploade une photo HEIC depuis son iPhone WHEN le fichier est reçu côté serveur THEN il est converti en JPEG avant analyse (le serveur accepte HEIC nativement)
- [ ] GIVEN Thomas uploade une image en orientation paysage (plan A3 photographié) WHEN l'image est traitée THEN elle n'est pas redimensionnée en dessous de 1500px sur le grand côté (pour préserver la lisibilité des cotes)

**Cas d'erreur :**
- [ ] GIVEN Thomas uploade une photo floue ou trop sombre WHEN GPT-4.1 vision tente l'extraction (étape 2) THEN le statut passe à "extraction_failed" avec le message : "Plan illisible. Reprenez une photo avec plus de lumière et l'objectif à la perpendiculaire du plan."

**Cas limites :**
- [ ] GIVEN Thomas uploade un HEIC de 18 Mo WHEN la conversion JPEG est effectuée THEN la taille résultante est < 20 Mo (compression JPEG 85% appliquée)

**Permissions :**
- [ ] GIVEN Thomas non authentifié WHEN il tente l'upload THEN redirection /connexion

**Données existantes :**
- [ ] GIVEN Thomas uploade un second plan sur un projet existant (remplacement) WHEN le nouveau fichier est accepté THEN l'ancien plan est remplacé et l'étape 2 est relancée

#### 5 états UI
| État | Comportement | Message/Affichage |
|---|---|---|
| Défaut | Zone drag & drop + icône caméra + texte aide | "Glissez votre plan ou appuyez pour choisir un fichier" |
| Loading | Progress bar upload (0→100%) | "Envoi… X%" |
| Vide | N/A | N/A |
| Erreur | Border rouge + message inline | "Format non accepté" ou "Fichier trop lourd" |
| Succès | Thumbnail du fichier + nom + taille | "plan_rdc.pdf — 4.2 Mo ✓" |

---

### US-PM-03 : Consulter la liste de ses projets

**Persona** : Thomas Berger
**Epic** : Création projet
**Dépendances** : US-PM-01
**Priorité RICE** : R=400 I=7 C=9 E=1 → Score=25 200

#### Job-to-be-done
En tant que Thomas, je veux voir tous mes projets en cours et terminés afin de reprendre un dossier interrompu ou retrouver un visuel d'un bien déjà traité.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas a 5 projets WHEN il accède à /pro THEN il voit une liste ordonnée par date de mise à jour décroissante avec : adresse, type, statut (badge coloré), date de création
- [ ] GIVEN un projet a le statut "validated" WHEN Thomas clique dessus THEN il est redirigé vers l'étape correspondante à son statut (étape 4 : qualification)
- [ ] GIVEN un projet est au statut "delivered" WHEN Thomas clique "Voir le dossier" THEN le dossier PDF s'ouvre dans un nouvel onglet

**Cas d'erreur :**
- [ ] GIVEN une erreur DB WHEN la liste est chargée THEN le message "Impossible de charger vos projets. Rechargez la page." s'affiche avec un bouton "Réessayer"

**Cas limites :**
- [ ] GIVEN Thomas n'a aucun projet WHEN il accède à /pro THEN l'état vide s'affiche : "Aucun projet. Créez votre premier bien." avec CTA "Nouveau projet"

**Permissions :**
- [ ] GIVEN Thomas tente d'accéder au projet d'un autre utilisateur via l'URL WHEN la requête arrive THEN HTTP 403, redirection /pro

**Données existantes :**
- [ ] GIVEN Thomas a 50 projets WHEN la page charge THEN la liste est paginée (20/page) avec pagination numérotée

#### 5 états UI
| État | Comportement | Message/Affichage |
|---|---|---|
| Défaut | Liste des projets avec statuts | Cartes projets triées par date |
| Loading | Skeleton 3 cartes | Loader animé |
| Vide | Illustration + CTA | "Aucun projet pour l'instant" + bouton "Nouveau projet" |
| Erreur | Message erreur + retry | "Impossible de charger vos projets" |
| Succès | Liste complète chargée | N/A (état défaut = succès) |

---

## 3. Étape 2 — Extraction IA du plan

**Principe** : GPT-4.1 vision analyse le plan uploadé et produit un JSON structuré listant pièces, dimensions estimées et ouvertures. La validation humaine (étape 3) est OBLIGATOIRE — l'IA ne décide jamais seule de la structure finale du bien.

### US-PM-04 : Déclencher et suivre l'extraction IA du plan

**Persona** : Thomas Berger
**Epic** : Extraction plan
**Dépendances** : US-PM-01, US-PM-02
**Priorité RICE** : R=500 I=10 C=8 E=1 → Score=40 000

#### Job-to-be-done
En tant que Thomas, je veux que l'IA analyse automatiquement mon plan dès l'upload afin d'obtenir la liste des pièces et leurs dimensions sans saisie manuelle.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN un projet passe au statut "plan_uploaded" WHEN le job d'extraction est lancé (automatiquement, pas besoin d'action Thomas) THEN GPT-4.1 vision est appelé avec le plan en input et le prompt d'extraction structuré
- [ ] GIVEN l'extraction réussit WHEN le JSON est valide THEN le statut passe à "extraction_done", les pièces sont sauvegardées en DB (table `rooms`), et Thomas est notifié par un toast : "Analyse terminée — X pièces détectées. Vérifiez les données."
- [ ] GIVEN l'extraction prend plus de 10 secondes WHEN Thomas attend sur l'écran THEN un indicateur de progression avec l'étape en cours ("Analyse du plan… GPT-4.1 vision en cours") est affiché

**Cas d'erreur :**
- [ ] GIVEN le plan est illisible (résolution trop faible, image floue) WHEN GPT-4.1 vision retourne un JSON vide ou < 2 pièces THEN le statut passe à "extraction_failed", message : "Le plan n'a pas pu être analysé automatiquement. Saisissez les pièces manuellement ou uploadez un plan de meilleure qualité."
- [ ] GIVEN l'API OpenAI retourne une erreur WHEN le job d'extraction échoue THEN 1 retry automatique après 5s. Si le second échec : statut "extraction_failed", message d'erreur actionnable

**Cas limites :**
- [ ] GIVEN le plan est un plan sans cotes (aucune dimension lisible) WHEN l'extraction est terminée THEN les pièces sont listées avec dimensions = null, un avertissement s'affiche : "Aucune cote détectée. Les surfaces sont estimées. Corrigez-les à l'étape suivante."
- [ ] GIVEN le plan contient des symboles électriques ou plomberie WHEN l'extraction est effectuée THEN ces symboles ne sont PAS interprétés comme des pièces (le prompt filtre les éléments techniques)

**Permissions :**
- [ ] GIVEN un utilisateur non propriétaire du projet WHEN il tente d'accéder à l'endpoint d'extraction THEN HTTP 403

**Données existantes :**
- [ ] GIVEN un projet a déjà une extraction (statut "extraction_done") WHEN une nouvelle extraction est déclenchée (après remplacement du plan) THEN les anciennes pièces sont supprimées et remplacées par les nouvelles

#### Payload API
- **Endpoint** : POST /api/pro/projects/:id/extract
- **Authentification** : session cookie NextAuth
- **Rate limit** : 3 extractions/projet (anti-boucle infinie)
- **Request body** : `{}` (le plan est déjà en DB, lié au projet)
- **Response succès** : `{ status: "extraction_done", rooms_count: number, rooms: Room[] }` — HTTP 200
- **Response erreur** : `{ status: "extraction_failed", reason: "PLAN_UNREADABLE" | "NO_ROOMS_DETECTED" | "API_ERROR" }` — HTTP 422

#### Structure JSON d'extraction (schema interne)
```json
{
  "rooms": [
    {
      "temp_id": "r1",
      "name_raw": "Séjour",
      "surface_m2": 18.5,
      "dimensions": { "length_m": 5.0, "width_m": 3.7 },
      "ceiling_height_m": 2.5,
      "windows_count": 2,
      "doors_count": 1,
      "confidence": 0.82
    }
  ],
  "total_surface_m2": 67.0,
  "floors_count": 1,
  "extraction_warnings": ["no_dimensions_found", "low_resolution"]
}
```

#### Events analytics
| Event | Trigger | Propriétés | Funnel |
|---|---|---|---|
| extraction_started | POST /extract 200 | project_id, file_type | activation |
| extraction_completed | statut → extraction_done | rooms_count, has_dimensions, warnings | activation |
| extraction_failed | statut → extraction_failed | reason | activation |

---

### US-PM-05 : Gérer un plan illisible (fallback saisie manuelle)

**Persona** : Thomas Berger
**Epic** : Extraction plan
**Dépendances** : US-PM-04
**Priorité RICE** : R=300 I=8 C=9 E=1 → Score=21 600

#### Job-to-be-done
En tant que Thomas dont le plan est illisible par l'IA, je veux pouvoir saisir manuellement les pièces afin de ne pas bloquer mon dossier sur un problème technique de lecture de fichier.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN le statut est "extraction_failed" WHEN Thomas clique "Saisir manuellement" THEN un formulaire s'affiche pour ajouter des pièces une par une (nom, surface, nb fenêtres)
- [ ] GIVEN Thomas ajoute 3 pièces manuellement WHEN il clique "Continuer" THEN le statut passe à "extraction_done" (saisie manuelle = équivalent extraction) et l'étape 3 s'affiche

**Cas d'erreur :**
- [ ] GIVEN Thomas essaie de continuer sans avoir saisi au moins 1 pièce WHEN il clique "Continuer" THEN le bouton est bloqué, message : "Ajoutez au moins une pièce pour continuer."

**Cas limites :**
- [ ] GIVEN Thomas uploade un meilleur plan après une extraction échouée WHEN le remplacement est fait THEN l'extraction est relancée automatiquement et le formulaire de saisie manuelle est masqué

**Permissions :**
- [ ] GIVEN un utilisateur non propriétaire WHEN il soumet le formulaire THEN HTTP 403

**Données existantes :**
- [ ] GIVEN Thomas avait une saisie manuelle partielle WHEN il uploade un nouveau plan THEN les pièces saisies manuellement sont supprimées (le nouveau plan repart de zéro)

---

### US-PM-06 : Estimer les dimensions depuis une photo (fallback sans cotes)

**Persona** : Thomas Berger
**Epic** : Extraction plan
**Dépendances** : US-PM-04
**Priorité RICE** : R=200 I=6 C=7 E=1 → Score=8 400

#### Job-to-be-done
En tant que Thomas dont le plan n'a pas de cotes, je veux que l'IA estime les dimensions par rapport à une référence standard afin d'obtenir des surfaces approximatives plutôt que rien.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN le JSON d'extraction a `extraction_warnings: ["no_dimensions_found"]` WHEN l'UI s'affiche THEN un badge "Dimensions estimées" est visible sur chaque pièce avec une info-bulle : "Estimation basée sur les proportions du plan. Vérifiez et corrigez à l'étape suivante."
- [ ] GIVEN Thomas passe à l'étape 3 sans corriger les dimensions WHEN le prompt de génération est construit THEN les dimensions estimées sont marquées `[estimated]` dans le prompt (le modèle de génération traite le signal d'incertitude)

**Cas d'erreur :**
- [ ] GIVEN aucune référence standard n'est détectable dans le plan (pas de porte, pas de symbole d'échelle) WHEN l'estimation est calculée THEN toutes les surfaces sont à null, pas de valeur inventée

**Cas limites :**
- [ ] GIVEN le plan a une échelle graphique (barre graduée) WHEN GPT-4.1 vision la détecte THEN elle est utilisée comme référence prioritaire sur l'estimation par proportion

**Permissions :**
- [ ] N/A — même règle que US-PM-04

**Données existantes :**
- [ ] N/A — dimensions toujours recalculées à chaque extraction

---

## 4. Étape 3 — Validation par le marchand

**Principe** : Thomas vérifie et corrige les données extraites avant de qualifier les besoins. Aucune donnée IA n'est traitée comme définitive sans validation humaine explicite. C'est le point de confiance central du parcours.

### US-PM-07 : Corriger les pièces extraites (noms, surfaces, affectations)

**Persona** : Thomas Berger
**Epic** : Validation plan
**Dépendances** : US-PM-04 ou US-PM-05
**Priorité RICE** : R=500 I=10 C=9 E=1 → Score=45 000

#### Job-to-be-done
En tant que Thomas, je veux corriger les noms, surfaces et affectations des pièces détectées par l'IA afin que les données du dossier reflètent la réalité du bien et ne comportent pas d'erreurs.

#### Contexte de navigation
- **Page d'origine** : /pro/projects/:id/extract (étape 2 terminée)
- **Déclencheur** : statut "extraction_done" → redirection automatique ou clic "Valider le plan"
- **Page de destination (succès)** : /pro/projects/:id/qualify (étape 4)
- **Page de destination (échec)** : reste sur /pro/projects/:id/validate avec messages d'erreur inline

#### Données et champs
| Champ | Type | Obligatoire | Validation | Limites | Exemple |
|---|---|---|---|---|---|
| room_name | string | Oui | Non vide | 2–50 caractères | "Séjour-cuisine" |
| surface_m2 | number | Non | > 0, < 1 000 | 1–999 | 18.5 |
| room_type | enum | Oui | Valeur dans la liste | salon / cuisine / chambre / sdb / wc / bureau / couloir / cave / autre | "salon" |
| floor | integer | Non | >= 0 | 0–20 | 0 |
| lot_id | string | Conditionnel (immeuble) | Référence lot existant | N/A | "lot_A" |

#### 5 états UI
| État | Comportement | Message/Affichage |
|---|---|---|
| Défaut | Tableau des pièces extraites, champs éditables inline | Liste pièces avec badges "IA" sur les valeurs estimées |
| Loading | Sauvegarde en cours après clic "Valider" | Spinner sur le bouton "Valider et continuer" |
| Vide | Aucune pièce extraite ni saisie | CTA "Ajouter une pièce" + lien "Réessayer l'extraction" |
| Erreur | Validation KO (champ obligatoire vide) | Message inline rouge sous le champ concerné |
| Succès | Validation OK → toast + redirection | "Plan validé — X pièces confirmées." puis redirection étape 4 |

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN le statut est "extraction_done" et 5 pièces ont été extraites WHEN Thomas accède à /pro/projects/:id/validate THEN il voit un tableau avec 5 lignes éditables : nom, type, surface, étage
- [ ] GIVEN Thomas modifie le nom "Room_1" en "Chambre principale" WHEN il clique hors du champ THEN la modification est sauvegardée en auto-save (debounce 500ms, PATCH API)
- [ ] GIVEN Thomas a validé toutes les pièces WHEN il clique "Valider et continuer" THEN le statut passe à "validated" et il est redirigé vers l'étape 4

**Cas d'erreur :**
- [ ] GIVEN Thomas laisse le champ "nom" vide pour une pièce WHEN il clique "Valider et continuer" THEN le submit est bloqué, la ligne concernée est surlignée en rouge, message : "Chaque pièce doit avoir un nom."
- [ ] GIVEN le PATCH auto-save échoue WHEN l'erreur réseau survient THEN un toast rouge s'affiche : "Sauvegarde échouée. Vérifiez votre connexion." La valeur précédente est restaurée dans le champ.

**Cas limites :**
- [ ] GIVEN Thomas entre une surface de 0 WHEN il valide le formulaire THEN le champ est signalé en erreur : "La surface doit être supérieure à 0."
- [ ] GIVEN Thomas ajoute une pièce non détectée par l'IA WHEN il clique "Ajouter une pièce" THEN une nouvelle ligne vide s'insère dans le tableau avec les mêmes champs éditables

**Permissions :**
- [ ] GIVEN un utilisateur non propriétaire du projet WHEN il accède à /pro/projects/:id/validate THEN HTTP 403, redirection /pro

**Données existantes :**
- [ ] GIVEN Thomas revient sur l'étape 3 après avoir progressé à l'étape 4 WHEN il modifie une pièce THEN les modifications sont sauvegardées mais il doit recliquer "Valider et continuer" pour propager les changements (les données de l'étape 4 ne sont PAS effacées automatiquement — un avertissement s'affiche)

#### Payload API
- **Endpoint** : PATCH /api/pro/projects/:id/rooms/:room_id
- **Authentification** : session cookie NextAuth
- **Rate limit** : 100 PATCH/min par user
- **Request body** : `{ room_name?: string, surface_m2?: number, room_type?: enum, floor?: number }`
- **Response succès** : `{ room_id: string, updated_at: string }` — HTTP 200
- **Response erreur** : `{ error: "VALIDATION_ERROR", fields: string[] }` — HTTP 422

#### Events analytics
| Event | Trigger | Propriétés | Funnel |
|---|---|---|---|
| validation_started | accès /validate | rooms_count, has_warnings | activation |
| room_corrected | PATCH room 200 | field_modified, was_ai_estimated | activation |
| validation_completed | statut → validated | rooms_count, corrections_count | activation |

---

### US-PM-08 : Confirmer la découpe en lots (immeuble multi-lots)

**Persona** : Thomas Berger (cas immeuble)
**Epic** : Validation plan
**Dépendances** : US-PM-07
**Priorité RICE** : R=300 I=9 C=8 E=1 → Score=21 600

#### Job-to-be-done
En tant que Thomas qui traite un immeuble de 6 lots, je veux confirmer quelles pièces appartiennent à quel lot afin que chaque lot ait son propre dossier PDF et ses propres visuels.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN le type_bien est "immeuble" et l'extraction a détecté > 1 groupe de pièces WHEN Thomas accède à l'étape 3 THEN une section "Lots de l'immeuble" apparaît avec une UI de regroupement drag-and-drop des pièces par lot
- [ ] GIVEN Thomas assigne 4 pièces au lot A et 3 pièces au lot B WHEN il clique "Confirmer les lots" THEN chaque lot est créé en DB (table `lots`) et les pièces sont liées au lot correspondant
- [ ] GIVEN l'immeuble a 6 lots confirmés WHEN Thomas continue à l'étape 4 THEN la qualification se fait lot par lot (6 onglets ou étapes séquentielles)

**Cas d'erreur :**
- [ ] GIVEN Thomas essaie de créer un lot sans pièce WHEN il soumet THEN message : "Un lot doit contenir au moins une pièce."

**Cas limites :**
- [ ] GIVEN le type_bien est "appartement" (lot unique) WHEN Thomas accède à l'étape 3 THEN la section "Lots" est masquée — toutes les pièces appartiennent au lot unique créé automatiquement
- [ ] GIVEN Thomas renomme un lot "T3 RDC gauche" WHEN il sauvegarde THEN ce nom apparaît dans le dossier PDF et les URLs de partage

**Permissions :**
- [ ] GIVEN un utilisateur non propriétaire WHEN il soumet la découpe THEN HTTP 403

**Données existantes :**
- [ ] GIVEN Thomas a déjà confirmé les lots et revient modifier WHEN il déplace une pièce vers un autre lot THEN un avertissement s'affiche si des visuels ont déjà été générés pour ce lot : "Des visuels existent pour ce lot. Les régénérer ?"

---

### US-PM-09 : Supprimer une pièce non pertinente

**Persona** : Thomas Berger
**Epic** : Validation plan
**Dépendances** : US-PM-07
**Priorité RICE** : R=400 I=6 C=9 E=1 → Score=21 600

#### Job-to-be-done
En tant que Thomas, je veux supprimer les pièces incorrectement détectées (ex : cage d'escalier, palier, local poubelles) afin que le dossier ne contienne que les pièces habitables à valoriser.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas voit "Palier" dans la liste WHEN il clique l'icône supprimer de cette ligne THEN une confirmation s'affiche : "Supprimer 'Palier' ? Cette action est irréversible."
- [ ] GIVEN Thomas confirme la suppression WHEN la requête DELETE est exécutée THEN la pièce disparaît de la liste et le total des surfaces est recalculé

**Cas d'erreur :**
- [ ] GIVEN Thomas tente de supprimer la dernière pièce d'un lot WHEN il clique supprimer THEN action bloquée, message : "Un lot doit avoir au moins une pièce."

**Cas limites :**
- [ ] GIVEN Thomas supprime une pièce qui avait déjà un visuel généré WHEN la suppression est confirmée THEN le visuel associé est supprimé de Object Storage et la pièce retirée du PDF

**Permissions :**
- [ ] GIVEN un utilisateur non propriétaire WHEN il envoie le DELETE THEN HTTP 403

**Données existantes :**
- [ ] N/A — la suppression est irréversible, pas de corbeille

---

## 5. Étape 4 — Qualification des besoins

**Principe** : Thomas définit le positionnement commercial de chaque lot — qui est l'acheteur cible, quel style mettra en valeur le bien, quel budget travaux est prévu. Ces données alimentent les recommandations de l'étape 5 et les prompts de génération de l'étape 6.

### US-PM-10 : Définir la cible acheteur par lot

**Persona** : Thomas Berger
**Epic** : Qualification
**Dépendances** : US-PM-08 (lots confirmés)
**Priorité RICE** : R=500 I=9 C=9 E=1 → Score=40 500

#### Job-to-be-done
En tant que Thomas, je veux qualifier la cible acheteur de chaque lot afin que l'agent IA recommande un style et un agencement adaptés au profil d'acheteur ciblé.

#### Données et champs
| Champ | Type | Obligatoire | Validation | Limites | Exemple |
|---|---|---|---|---|---|
| target_buyer | enum | Oui | Valeur dans la liste | famille / couple_sans_enfant / etudiant / investisseur_locatif / senior / professionnel_liberal | "famille" |
| budget_travaux | number | Non | >= 0 | 0–500 000 € | 35000 |
| contraintes | string | Non | max 500 chars | N/A | "PMR, pas de mur porteur à toucher" |
| notes_commerciales | string | Non | max 1 000 chars | N/A | "Quartier Saint-Michel, cible CSP+, vue cour" |

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN un lot est confirmé WHEN Thomas accède à l'étape 4 THEN il voit un formulaire de qualification par lot avec les champs : cible acheteur (sélecteur), budget travaux (€), contraintes libres, notes commerciales
- [ ] GIVEN Thomas sélectionne "famille" comme cible WHEN il sauvegarde THEN cet attribut est stocké en DB (table `lots`, colonne `target_buyer`) et sera injecté dans le system prompt de l'agent recommandations (étape 5)
- [ ] GIVEN Thomas qualifie 6 lots WHEN il clique "Continuer vers les recommandations" THEN tous les lots doivent avoir au minimum la cible acheteur renseignée

**Cas d'erreur :**
- [ ] GIVEN Thomas essaie de continuer sans avoir sélectionné la cible acheteur d'un lot WHEN il soumet THEN message : "Sélectionnez la cible acheteur pour chaque lot avant de continuer."

**Cas limites :**
- [ ] GIVEN le type_bien est "appartement" (lot unique) WHEN Thomas accède à l'étape 4 THEN le formulaire de qualification s'affiche directement pour l'unique lot, sans onglets

**Permissions :**
- [ ] GIVEN un utilisateur non propriétaire WHEN il soumet la qualification THEN HTTP 403

**Données existantes :**
- [ ] GIVEN Thomas revient modifier la cible acheteur après avoir obtenu des recommandations WHEN il change "famille" en "couple_sans_enfant" THEN un avertissement s'affiche : "Modifier la cible acheteur invalidera les recommandations existantes. Continuer ?"

---

### US-PM-11 : Choisir le style par lot

**Persona** : Thomas Berger
**Epic** : Qualification
**Dépendances** : US-PM-10
**Priorité RICE** : R=500 I=9 C=9 E=1 → Score=40 500

#### Job-to-be-done
En tant que Thomas, je veux choisir le style de décoration de chaque lot parmi les 12 styles Versimo afin que les visuels générés correspondent à l'image qu'il veut projeter auprès des acquéreurs cibles.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas est sur l'étape 4 pour un lot "famille" WHEN il parcourt les 12 styles THEN chaque style affiche une miniature de référence, son nom et une description courte orientée acquéreur (ex : Haussmannien — "Élégance classique, idéal pour les CSP+ cherchant du cachet")
- [ ] GIVEN Thomas sélectionne "Haussmannien" pour le lot A WHEN il valide THEN le style est sauvegardé (colonne `style_id` dans `lots`) et sera injecté dans les prompts de génération
- [ ] GIVEN la cible acheteur est "etudiant" WHEN Thomas ouvre la sélection de style THEN les styles recommandés (Scandinave, Contemporain) sont mis en avant avec un badge "Recommandé pour votre cible"

**Cas d'erreur :**
- [ ] GIVEN Thomas n'a sélectionné aucun style WHEN il tente de passer à l'étape 5 THEN message : "Choisissez un style pour chaque lot."

**Cas limites :**
- [ ] GIVEN Thomas veut un style custom (non listé) WHEN il clique "Style personnalisé" THEN un textarea apparaît (même flow que le mode Custom existant sur la page principale) — le texte est pré-processé par GPT-4.1-mini comme dans le pipeline actuel

**Permissions :**
- [ ] GIVEN un utilisateur non propriétaire WHEN il modifie le style THEN HTTP 403

**Données existantes :**
- [ ] GIVEN Thomas a déjà des visuels générés pour un lot WHEN il change le style THEN message : "Changer le style régénérera tous les visuels de ce lot (crédits débités). Confirmer ?"

---

### US-PM-12 : Saisir le budget travaux et les contraintes techniques

**Persona** : Thomas Berger
**Epic** : Qualification
**Dépendances** : US-PM-10
**Priorité RICE** : R=300 I=7 C=9 E=1 → Score=18 900

#### Job-to-be-done
En tant que Thomas, je veux renseigner le budget travaux estimé et les contraintes techniques afin que les recommandations de l'agent IA soient réalistes (pas de suggestion de démolir un mur porteur si le budget est de 15 000€).

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas saisit 30 000€ de budget WHEN les recommandations de l'étape 5 sont générées THEN les suggestions de réagencement sont filtrées pour rester sous ce budget (le system prompt de l'agent inclut le budget comme contrainte)
- [ ] GIVEN Thomas coche "Contrainte PMR" WHEN les recommandations sont générées THEN l'agent inclut des suggestions d'accessibilité (largeur couloir, seuil 0, etc.)

**Cas d'erreur :**
- [ ] GIVEN Thomas saisit un budget négatif WHEN le champ est validé THEN message inline : "Le budget ne peut pas être négatif."

**Cas limites :**
- [ ] GIVEN Thomas laisse le budget vide WHEN les recommandations sont générées THEN l'agent propose des recommandations sans contrainte budgétaire, avec une note : "Budget non renseigné — recommandations sans filtre de coût."

**Permissions :**
- [ ] N/A — même règle projet

**Données existantes :**
- [ ] N/A — le budget peut être modifié à tout moment sans effet rétrospectif

---

### US-PM-13 : Associer une photo de pièce réelle à chaque pièce du plan

**Persona** : Thomas Berger
**Epic** : Qualification
**Dépendances** : US-PM-07
**Priorité RICE** : R=500 I=10 C=8 E=1 → Score=40 000

#### Job-to-be-done
En tant que Thomas, je veux associer mes photos de chantier à chaque pièce identifiée dans le plan afin que les visuels générés montrent LA vraie géométrie de la pièce plutôt qu'une estimation.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN 5 pièces sont listées WHEN Thomas accède à la section "Photos" de l'étape 4 THEN il voit 5 slots d'upload, un par pièce, chacun labellisé du nom de la pièce
- [ ] GIVEN Thomas uploade "salon.jpg" dans le slot "Séjour" WHEN l'upload est confirmé THEN la photo est liée à la pièce en DB (table `rooms`, colonne `photo_path`) et une miniature s'affiche dans le slot
- [ ] GIVEN une pièce n'a pas de photo WHEN les visuels sont générés THEN le pipeline utilise un prompt-only enrichi des dimensions (option d) du document ia/plan-analysis-research.md) — pas de blocage

**Cas d'erreur :**
- [ ] GIVEN Thomas uploade un fichier > 10 Mo WHEN l'upload démarre THEN rejet côté client, message : "Photo trop lourde (max 10 Mo). Compressez ou réduisez la résolution."

**Cas limites :**
- [ ] GIVEN Thomas uploade une photo pour une pièce qui en avait déjà une WHEN le nouvel upload est confirmé THEN l'ancienne photo est remplacée et l'ancienne image supprimée d'Object Storage

**Permissions :**
- [ ] N/A — même règle projet

**Données existantes :**
- [ ] GIVEN des visuels ont déjà été générés pour une pièce WHEN Thomas remplace la photo source THEN message : "Cette pièce a déjà un visuel généré. Remplacer la photo régénérera le visuel (crédits débités). Confirmer ?"

---

### US-PM-14 : Résumer la qualification avant de continuer

**Persona** : Thomas Berger
**Epic** : Qualification
**Dépendances** : US-PM-10, US-PM-11, US-PM-12, US-PM-13
**Priorité RICE** : R=400 I=7 C=9 E=1 → Score=25 200

#### Job-to-be-done
En tant que Thomas, je veux voir un récapitulatif de toutes mes qualifications avant de lancer les recommandations IA afin de détecter des erreurs sans avoir à naviguer onglet par onglet.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN tous les lots sont qualifiés WHEN Thomas arrive au bas de l'étape 4 THEN un tableau récapitulatif s'affiche : lot / cible acheteur / style / budget / nb photos uploadées
- [ ] GIVEN le récapitulatif est affiché WHEN Thomas clique "Lancer les recommandations" THEN le statut passe à "qualified" et l'étape 5 démarre

**Cas d'erreur :**
- [ ] GIVEN au moins un lot n'a pas de cible acheteur WHEN Thomas clique "Lancer les recommandations" THEN le bouton est grisé + message : "Complétez la qualification de tous les lots (cible acheteur obligatoire)."

**Cas limites :**
- [ ] N/A

**Permissions :**
- [ ] N/A — même règle projet

**Données existantes :**
- [ ] N/A

---

## 6. Étape 5 — Recommandations architecte IA

**Principe** : GPT-4.1 text (pas vision) analyse le JSON validé de l'étape 3 et les qualifications de l'étape 4, puis produit des suggestions de réagencement par lot. Thomas accepte ou refuse chaque recommandation. Le résultat est le "plan final" qui guidera les prompts de génération visuelle.

**Modèle** : GPT-4.1 text via `openai.responses.create` — pas besoin de vision car le JSON structuré est suffisant. System prompt : rôle architecte d'intérieur expert marchands de biens, connaissance des 12 styles Versimo, budget comme contrainte.

### US-PM-15 : Déclencher la génération des recommandations

**Persona** : Thomas Berger
**Epic** : Recommandations IA
**Dépendances** : US-PM-14 (statut "qualified")
**Priorité RICE** : R=500 I=9 C=8 E=1 → Score=36 000

#### Job-to-be-done
En tant que Thomas, je veux recevoir des recommandations de réagencement argumentées par lot afin de décider quelles modifications structurelles maximisent la valeur perçue par la cible acheteur.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN le statut est "qualified" WHEN Thomas clique "Lancer les recommandations" THEN un appel GPT-4.1 text est effectué avec le JSON des pièces + cible acheteur + style + budget comme contexte
- [ ] GIVEN l'API répond en < 15s WHEN le JSON de recommandations est reçu THEN il est sauvegardé en DB (table `recommendations`) et affiché à Thomas sans rechargement de page
- [ ] GIVEN GPT-4.1 génère 4 recommandations WHEN elles s'affichent THEN chaque recommandation a : titre court, description (2-3 phrases), type d'action (redistribution / cloison / affectation / deco), coût estimé (si budget renseigné), niveau d'impact sur la valeur (icône basse/moyenne/haute)

**Cas d'erreur :**
- [ ] GIVEN l'API OpenAI retourne une erreur WHEN le job échoue THEN 1 retry automatique. Si échec persistant : message "Recommandations indisponibles. Vous pouvez passer directement à la génération des visuels." + bouton "Continuer sans recommandations"
- [ ] GIVEN GPT-4.1 retourne un JSON malformé WHEN le parsing échoue THEN le fallback s'affiche avec le texte brut en mode dégradé + bouton "Régénérer"

**Cas limites :**
- [ ] GIVEN le budget est très faible (< 5 000€) WHEN les recommandations sont générées THEN GPT-4.1 ne propose que des actions décoratives (peinture, sol, luminaires) — pas de démolition de cloison
- [ ] GIVEN le bien a une contrainte PMR WHEN les recommandations sont générées THEN au moins 1 recommandation porte sur l'accessibilité

**Permissions :**
- [ ] GIVEN un utilisateur non propriétaire WHEN il déclenche les recommandations THEN HTTP 403

**Données existantes :**
- [ ] GIVEN des recommandations existent déjà WHEN Thomas clique "Régénérer les recommandations" THEN les anciennes sont archivées (colonne `is_active = false`) et les nouvelles créées — l'historique est conservé

#### Payload API
- **Endpoint** : POST /api/pro/projects/:id/lots/:lot_id/recommendations
- **Authentification** : session cookie NextAuth
- **Rate limit** : 5 générations/lot (éviter boucle coûteuse)
- **Request body** : `{}` (les données sont en DB, liées au lot)
- **Response succès** : `{ recommendations: Recommendation[], generated_at: string }` — HTTP 200
- **Response erreur** : `{ error: "API_ERROR" | "PARSING_FAILED" }` — HTTP 422

#### Structure JSON recommandations (schema interne)
```json
{
  "recommendations": [
    {
      "id": "rec_1",
      "title": "Ouvrir la cuisine sur le séjour",
      "description": "Abattre la cloison non-porteuse entre cuisine et séjour pour créer un espace de vie de 28m². Effet immédiat sur la luminosité et la circulation. Très attendu par les familles CSP+.",
      "action_type": "cloison",
      "estimated_cost_eur": 3500,
      "impact_level": "haute",
      "affected_rooms": ["r1", "r2"],
      "is_accepted": null
    }
  ]
}
```

#### Events analytics
| Event | Trigger | Propriétés | Funnel |
|---|---|---|---|
| recommendations_generated | POST recommendations 200 | lot_id, count, target_buyer, style_id | activation |
| recommendation_accepted | PATCH reco is_accepted=true | rec_id, action_type, impact_level | activation |
| recommendation_refused | PATCH reco is_accepted=false | rec_id, action_type | activation |

---

### US-PM-16 : Accepter ou refuser chaque recommandation

**Persona** : Thomas Berger
**Epic** : Recommandations IA
**Dépendances** : US-PM-15
**Priorité RICE** : R=500 I=9 C=9 E=1 → Score=40 500

#### Job-to-be-done
En tant que Thomas, je veux accepter ou refuser chaque recommandation individuellement afin d'avoir un contrôle total sur ce qui sera représenté dans les visuels — l'IA propose, Thomas décide.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN 4 recommandations s'affichent WHEN Thomas clique "Accepter" sur la recommandation "Ouvrir la cuisine" THEN la recommandation est marquée `is_accepted = true` en DB, le badge passe au vert, et la récap des actions acceptées est mise à jour
- [ ] GIVEN Thomas clique "Refuser" sur une recommandation WHEN l'action est confirmée THEN `is_accepted = false`, la recommandation est grisée mais reste visible (pas supprimée)
- [ ] GIVEN Thomas a traité les 4 recommandations WHEN il clique "Confirmer le plan final" THEN le statut passe à "plan_final" et il est redirigé vers l'étape 6

**Cas d'erreur :**
- [ ] GIVEN un PATCH échoue (réseau) WHEN Thomas clique Accepter/Refuser THEN le bouton revient à son état précédent + toast : "Action non sauvegardée. Réessayez."

**Cas limites :**
- [ ] GIVEN Thomas n'a accepté aucune recommandation WHEN il clique "Confirmer le plan final" THEN le système accepte cet état (toutes refusées = plan original inchangé) — pas de blocage, message informatif : "Aucune modification structurelle retenue. Les visuels seront générés sur le plan original."
- [ ] GIVEN Thomas veut passer l'étape des recommandations WHEN il clique "Passer cette étape" THEN il est redirigé vers l'étape 6 directement (statut forcé à "plan_final" avec 0 recommandation acceptée)

**Permissions :**
- [ ] N/A — même règle projet

**Données existantes :**
- [ ] N/A — les acceptations/refus sont toujours éditables jusqu'au clic "Confirmer le plan final"

---

### US-PM-17 : Voir le plan final récapitulatif avant génération

**Persona** : Thomas Berger
**Epic** : Recommandations IA
**Dépendances** : US-PM-16
**Priorité RICE** : R=300 I=7 C=9 E=1 → Score=18 900

#### Job-to-be-done
En tant que Thomas, je veux voir un récapitulatif du plan final (pièces + modifications acceptées) avant de lancer la génération payante afin d'éviter de payer pour un résultat basé sur de mauvaises données.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas a accepté 2 recommandations sur 4 WHEN il clique "Confirmer le plan final" THEN un écran récapitulatif s'affiche : liste des pièces finales, modifications retenues (badges "modifié"), modifications refusées (badges "conservé")
- [ ] GIVEN le récapitulatif est correct WHEN Thomas clique "Lancer la génération" THEN la page de paiement s'affiche (ou crédits débités si Pro)

**Cas d'erreur :**
- [ ] N/A — cet écran est en lecture seule

**Cas limites :**
- [ ] GIVEN l'immeuble a 6 lots WHEN le récapitulatif s'affiche THEN il est présenté lot par lot avec un accordéon par lot (évite la surcharge cognitive)

**Permissions :**
- [ ] N/A — même règle projet

**Données existantes :**
- [ ] N/A

---

### US-PM-18 : Régénérer les recommandations avec un brief différent

**Persona** : Thomas Berger
**Epic** : Recommandations IA
**Dépendances** : US-PM-15
**Priorité RICE** : R=200 I=6 C=8 E=1 → Score=9 600

#### Job-to-be-done
En tant que Thomas, je veux pouvoir régénérer les recommandations en modifiant la cible acheteur ou le budget afin d'explorer différents scénarios commerciaux pour le même bien.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas a des recommandations "famille" WHEN il clique "Modifier la qualification" THEN il retourne à l'étape 4, peut changer la cible (ex : "investisseur_locatif"), et régénère les recommandations
- [ ] GIVEN les nouvelles recommandations sont générées WHEN elles s'affichent THEN l'historique des versions précédentes est accessible via un lien "Voir les recommandations précédentes"

**Cas d'erreur :**
- [ ] N/A — même règle que US-PM-15

**Cas limites :**
- [ ] GIVEN Thomas a déjà accepté des recommandations et régénère WHEN les nouvelles recommandations s'affichent THEN les anciennes acceptations sont effacées (nouvelle version = reset des is_accepted)

**Permissions :**
- [ ] N/A — même règle projet

**Données existantes :**
- [ ] Les anciennes recommandations sont archivées (is_active = false), pas supprimées

---

## 7. Étape 6 — Génération des visuels

**Principe** : le pipeline 2 passes existant (passe 1 surfaces, passe 2 mobilier) est réutilisé sans modification d'architecture. Les prompts sont enrichis avec les dimensions validées à l'étape 3. Le paiement est déclenché ICI avant la génération — c'est la seule étape coûteuse en API.

**Modèle** : gpt-image-1.5 via Responses API, `input_fidelity: "high"`. Pas de fallback (décision fondateur 2026-04-04).

### US-PM-19 : Déclencher le paiement et la génération des visuels

**Persona** : Thomas Berger
**Epic** : Génération visuels
**Dépendances** : US-PM-17 (statut "plan_final")
**Priorité RICE** : R=500 I=10 C=9 E=1 → Score=45 000

#### Job-to-be-done
En tant que Thomas, je veux payer et lancer la génération de tous les visuels d'un coup afin d'obtenir un dossier complet sans avoir à déclencher chaque pièce manuellement.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas est sur l'écran récapitulatif (US-PM-17) et a un abonnement Pro actif WHEN il clique "Générer les visuels" THEN ses crédits sont débités (1 crédit par pièce avec photo, 1.5 crédits par pièce sans photo — génération depuis prompt only) et le job de génération démarre
- [ ] GIVEN Thomas n'est pas abonné Pro WHEN il clique "Générer les visuels" THEN la page de paiement Stripe s'affiche avec le prix 99€/bien TTC et la liste des livrables inclus
- [ ] GIVEN le paiement est validé WHEN Stripe confirme THEN le job de génération démarre automatiquement (webhook Stripe → API route) et Thomas est redirigé vers la page de suivi de génération

**Cas d'erreur :**
- [ ] GIVEN le paiement Stripe échoue (carte refusée) WHEN Thomas est redirigé THEN message : "Paiement refusé. Vérifiez vos informations de carte ou utilisez un autre moyen de paiement." — le statut du projet reste "plan_final"
- [ ] GIVEN Thomas n'a pas assez de crédits Pro WHEN il tente de lancer THEN message : "Crédits insuffisants (X disponibles, Y requis). Rechargez votre compte ou passez en paiement à la mission."

**Cas limites :**
- [ ] GIVEN Thomas ferme l'onglet pendant la génération WHEN il revient plus tard sur /pro THEN son projet affiche le statut "generating" avec le nombre de visuels terminés / total — la génération continue côté serveur
- [ ] GIVEN un immeuble 6 lots × 4 pièces = 24 pièces WHEN la génération est lancée THEN les jobs sont parallélisés par lot (max 2 pièces concurrentes, comme le pipeline existant) — délai estimé affiché à Thomas

**Permissions :**
- [ ] GIVEN un utilisateur non propriétaire WHEN il tente de déclencher le paiement THEN HTTP 403

**Données existantes :**
- [ ] GIVEN Thomas a déjà payé pour ce bien et veut régénérer un visuel WHEN il relance la génération d'une pièce THEN 0 paiement supplémentaire si le projet est dans les 30 jours (window de régénération gratuite). Au-delà : 1 crédit par pièce régénérée.

#### Payload API
- **Endpoint** : POST /api/pro/projects/:id/generate
- **Authentification** : session cookie NextAuth
- **Rate limit** : 1 job/projet en parallèle
- **Request body** : `{ lot_ids?: string[] }` (null = tous les lots)
- **Response succès** : `{ job_id: string, estimated_rooms: number, credits_debited: number }` — HTTP 202
- **Response erreur** : `{ error: "INSUFFICIENT_CREDITS" | "PAYMENT_REQUIRED" | "ALREADY_GENERATING" }` — HTTP 402/409

#### Events analytics
| Event | Trigger | Propriétés | Funnel |
|---|---|---|---|
| generation_paid | paiement Stripe confirmé | amount, rooms_count, has_photos | revenue |
| generation_started | POST /generate 202 | job_id, rooms_count, credits_debited | revenue |
| generation_completed | toutes pièces done | total_duration_ms, success_count, fail_count | retention |

---

### US-PM-20 : Suivre la progression de la génération en temps réel

**Persona** : Thomas Berger
**Epic** : Génération visuels
**Dépendances** : US-PM-19
**Priorité RICE** : R=500 I=8 C=9 E=1 → Score=36 000

#### Job-to-be-done
En tant que Thomas qui attend ses visuels, je veux voir la progression pièce par pièce afin de savoir combien de temps il reste et de consulter les résultats au fur et à mesure.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN la génération est en cours WHEN Thomas est sur la page de suivi THEN il voit une grille de tuiles, une par pièce, avec les statuts : "En attente", "Passe 1 en cours", "Passe 2 en cours", "Terminé"
- [ ] GIVEN une pièce termine la passe 2 WHEN le visuel est prêt THEN la tuile bascule de blur/spinner vers le visuel meublé final, sans rechargement de page (polling 3s ou SSE)
- [ ] GIVEN toutes les pièces sont terminées WHEN le dernier visuel arrive THEN un toast s'affiche : "Tous les visuels sont prêts ! Générez votre dossier PDF." avec CTA direct vers l'étape 7

**Cas d'erreur :**
- [ ] GIVEN une pièce échoue en passe 2 (API timeout) WHEN l'erreur est détectée THEN la tuile affiche "Échec" avec un bouton "Réessayer cette pièce" — les autres pièces continuent
- [ ] GIVEN la connexion réseau de Thomas est coupée pendant 30s WHEN elle revient THEN le polling reprend automatiquement et les tuiles se mettent à jour

**Cas limites :**
- [ ] GIVEN Thomas a 24 pièces WHEN la progression s'affiche THEN les tuiles sont groupées par lot (accordéon par lot) pour éviter une grille trop large sur mobile
- [ ] GIVEN une pièce n'a pas de photo WHEN sa génération est terminée THEN la tuile affiche le visuel avec un badge "Généré depuis le plan" pour informer Thomas que l'image est estimée, pas basée sur une photo réelle

**Permissions :**
- [ ] N/A — même règle projet

**Données existantes :**
- [ ] GIVEN Thomas revient sur la page 2 heures après le lancement WHEN tous les visuels sont terminés THEN la page affiche l'état "Terminé" avec tous les visuels visibles — pas de régénération automatique

#### 5 états UI (page de suivi)
| État | Comportement | Message/Affichage |
|---|---|---|
| Défaut | Grille de tuiles par pièce, statuts visibles | Tuiles avec noms des pièces, badges statut |
| Loading (pièce) | Tuile individuelle en blur + spinner | "Passe 1 en cours…" ou "Passe 2 en cours…" |
| Vide | N/A — au moins 1 pièce toujours présente | N/A |
| Erreur (pièce) | Tuile rouge + bouton Réessayer | "Échec — cliquez pour réessayer" |
| Succès | Visuel meublé affiché dans la tuile | Image finale + badge lot |

---

### US-PM-21 : Enrichir le prompt de génération avec les dimensions du plan

**Persona** : Thomas Berger (impact invisible — améliore la qualité)
**Epic** : Génération visuels
**Dépendances** : US-PM-07 (dimensions validées), US-PM-19
**Priorité RICE** : R=500 I=8 C=8 E=1 → Score=32 000

#### Job-to-be-done — Story backend sans UI
En tant que système, je veux injecter les dimensions validées de chaque pièce dans les prompts de génération afin que les visuels aient des proportions cohérentes avec la réalité de la pièce.

**Note : story purement backend sans UI. Sections "Contexte de navigation", "5 états UI" et "Notes @ux" = N/A.**

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN une pièce a `dimensions: { length_m: 5.0, width_m: 3.7, ceiling_height_m: 2.5 }` WHEN le prompt de génération passe 1 est construit THEN il contient : "Room dimensions: 5.0m wide x 3.7m deep. Ceiling height: 2.50m. Ratio: wider than deep (1.35:1)."
- [ ] GIVEN une pièce a 2 fenêtres sur le mur gauche WHEN le prompt est construit THEN il contient : "Two windows on the left wall."
- [ ] GIVEN les dimensions sont estimées (`confidence < 0.7`) WHEN le prompt est construit THEN les dimensions sont préfixées de "approximately" pour signaler l'incertitude au modèle

**Cas d'erreur :**
- [ ] GIVEN une pièce n'a pas de dimensions (`dimensions: null`) WHEN le prompt est construit THEN les dimensions sont omises du prompt (pas de valeur inventée) — le modèle travaille sans contrainte dimensionnelle

**Cas limites :**
- [ ] GIVEN une pièce est très petite (< 5 m²) WHEN le prompt est construit THEN une indication "small room" est ajoutée pour éviter de générer du mobilier oversized

**Permissions :**
- [ ] N/A — logique serveur

**Données existantes :**
- [ ] N/A

#### Payload API
- **Endpoint** : logique interne dans `src/lib/ai/plan-enriched-prompt.ts` (pas d'endpoint exposé)
- **Authentification** : N/A — module serveur
- **Rate limit** : N/A
- **Request body** : `Room` object depuis DB
- **Response** : `string` (injection dans le prompt string existant)

---

### US-PM-22 : Régénérer un visuel insatisfaisant

**Persona** : Thomas Berger
**Epic** : Génération visuels
**Dépendances** : US-PM-20
**Priorité RICE** : R=400 I=7 C=9 E=1 → Score=25 200

#### Job-to-be-done
En tant que Thomas insatisfait d'un visuel, je veux le régénérer afin d'obtenir une variation différente sur la même pièce sans repasser par toutes les étapes.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas est sur la page de suivi et un visuel est "Terminé" WHEN il clique "Régénérer" sur la tuile THEN 1 crédit est débité (ou 0 si dans la window de 30 jours) et la pièce repasse en génération
- [ ] GIVEN la régénération est terminée WHEN le nouveau visuel arrive THEN il remplace l'ancien dans la tuile ET dans le dossier PDF (le PDF devra être régénéré)

**Cas d'erreur :**
- [ ] GIVEN Thomas n'a plus de crédits WHEN il clique "Régénérer" THEN message : "Crédits insuffisants. Rechargez votre compte." — pas de débit implicite

**Cas limites :**
- [ ] GIVEN Thomas régénère 5 fois la même pièce WHEN toutes les tentatives échouent THEN un message s'affiche : "Génération difficile sur cette pièce. Essayez de changer le style ou uploadez une photo de meilleure qualité."

**Permissions :**
- [ ] N/A — même règle projet

**Données existantes :**
- [ ] GIVEN l'ancien visuel est remplacé WHEN Thomas télécharge le dossier PDF THEN le PDF contient le NOUVEAU visuel (le PDF n'est pas mis en cache — il est régénéré à chaque téléchargement ou sur demande explicite)

---

## 8. Étape 7 — Dossier de pré-commercialisation

**Principe** : chaque lot produit un dossier PDF autonome, prêt à partager directement avec les acquéreurs. C'est le livrable final de la valeur Versimo — c'est ce que Thomas envoie le lundi matin avant une visite. Le PDF est généré côté serveur (pas côté client) pour des raisons de taille et de fiabilité.

**Contenu par dossier** : plan annoté + visuels meublés par pièce + description commerciale générée par IA (1 paragraphe par lot basé sur cible acheteur + style + surfaces) + tableau des surfaces + infos techniques (type de bien, surface habitable, étage, exposition).

### US-PM-23 : Générer le dossier PDF d'un lot

**Persona** : Thomas Berger
**Epic** : Dossier PDF
**Dépendances** : US-PM-20 (visuels terminés)
**Priorité RICE** : R=500 I=10 C=9 E=1 → Score=45 000

#### Job-to-be-done
En tant que Thomas, je veux générer le dossier PDF de chaque lot en 1 clic afin d'avoir un document professionnel prêt à envoyer aux acquéreurs sans travail de mise en forme.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN tous les visuels d'un lot sont terminés WHEN Thomas clique "Générer le dossier" pour ce lot THEN le PDF est généré côté serveur et disponible en téléchargement en < 30 secondes
- [ ] GIVEN le PDF est généré WHEN Thomas l'ouvre THEN il contient dans cet ordre : (1) page de couverture (adresse, type, surface, logo Versimo discret), (2) plan annoté (noms des pièces, surfaces), (3) visuels meublés avec légende (1 visuel par pièce sur pleine page), (4) description commerciale (1 paragraphe IA par lot), (5) tableau des surfaces (nom, m², type), (6) mention légale : "Visuels de home staging virtuel — à titre indicatif, non contractuels"
- [ ] GIVEN Thomas génère le PDF de 6 lots WHEN tous sont prêts THEN un bouton "Tout télécharger (ZIP)" s'affiche

**Cas d'erreur :**
- [ ] GIVEN la génération PDF échoue (timeout serveur) WHEN l'erreur est détectée THEN message : "Génération du dossier échouée. Réessayez dans quelques instants." avec bouton "Réessayer"
- [ ] GIVEN un visuel est manquant pour une pièce WHEN le PDF est généré THEN la pièce est incluse avec le plan annoté mais sans visuel, avec la mention : "Visuel non disponible pour cette pièce."

**Cas limites :**
- [ ] GIVEN Thomas régénère un visuel après avoir généré le PDF WHEN il retélécharge le PDF THEN le PDF contient le nouveau visuel (régénération du PDF à chaque téléchargement ou via bouton "Mettre à jour le dossier")
- [ ] GIVEN le lot a 8 pièces WHEN le PDF est généré THEN les visuels sont sur des pages A4 en portrait, 1 visuel par page (pas de compression ou de réduction de qualité)

**Permissions :**
- [ ] GIVEN un utilisateur non propriétaire WHEN il accède à l'URL de téléchargement PDF THEN HTTP 403 (pas de lien public sans token)

**Données existantes :**
- [ ] GIVEN Thomas génère le PDF 3 fois de suite WHEN chaque génération est demandée THEN le PDF est recalculé à chaque fois (pas de cache — garantit la fraîcheur des données)

#### Payload API
- **Endpoint** : POST /api/pro/projects/:id/lots/:lot_id/pdf
- **Authentification** : session cookie NextAuth
- **Rate limit** : 10 PDF/heure par user
- **Request body** : `{}` (toutes les données en DB)
- **Response succès** : PDF binaire en streaming — HTTP 200, Content-Type: application/pdf
- **Response erreur** : `{ error: "GENERATION_FAILED" | "VISUALS_NOT_READY" }` — HTTP 422/409

#### Events analytics
| Event | Trigger | Propriétés | Funnel |
|---|---|---|---|
| pdf_generated | POST /pdf 200 | lot_id, rooms_count, has_all_visuals | retention |
| pdf_downloaded | GET /pdf (téléchargement effectif) | lot_id | retention |
| zip_downloaded | GET /zip tous lots | project_id, lots_count | retention |

---

### US-PM-24 : Partager le dossier par lien, WhatsApp ou email

**Persona** : Thomas Berger
**Epic** : Dossier PDF
**Dépendances** : US-PM-23
**Priorité RICE** : R=500 I=9 C=9 E=1 → Score=40 500

#### Job-to-be-done
En tant que Thomas, je veux partager le dossier d'un lot directement depuis Versimo afin d'envoyer un lien professionnel aux acquéreurs en 30 secondes, depuis mon téléphone, sans passer par mon ordinateur.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN le PDF est prêt WHEN Thomas clique "Partager" THEN il voit 3 options : "Copier le lien", "Envoyer par WhatsApp", "Envoyer par email"
- [ ] GIVEN Thomas clique "Copier le lien" WHEN l'action est déclenchée THEN un lien public temporaire (token UUID, valide 30 jours) est copié dans le presse-papier et un toast confirme : "Lien copié — valide 30 jours"
- [ ] GIVEN Thomas clique "Envoyer par WhatsApp" sur mobile WHEN l'action est déclenchée THEN `navigator.share` est appelé avec le fichier PDF si l'API est disponible, sinon wa.me est ouvert avec le lien public
- [ ] GIVEN le lien est ouvert par un acquéreur non connecté WHEN il accède à l'URL THEN le PDF est affiché dans le navigateur ou proposé en téléchargement — sans authentification requise (lien tokenisé)

**Cas d'erreur :**
- [ ] GIVEN le lien de partage a expiré (> 30 jours) WHEN l'acquéreur y accède THEN page : "Ce lien a expiré. Contactez votre conseiller immobilier pour un nouveau lien."

**Cas limites :**
- [ ] GIVEN Thomas partage plusieurs fois le même lot WHEN il clique "Partager" à nouveau THEN le même lien actif est proposé (pas de doublon de tokens) — avec la date d'expiration affichée
- [ ] GIVEN Thomas veut révoquer l'accès à un lien partagé WHEN il clique "Désactiver ce lien" THEN le token est invalidé en DB et l'URL devient inaccessible immédiatement

**Permissions :**
- [ ] GIVEN le lien public est accédé THEN aucun compte requis — lecture seule du PDF uniquement

**Données existantes :**
- [ ] GIVEN Thomas a partagé le lien puis régénéré le PDF WHEN l'acquéreur ouvre le lien THEN il voit la dernière version du PDF (le lien pointe vers le PDF courant, pas un snapshot)

#### Payload API
- **Endpoint** : POST /api/pro/projects/:id/lots/:lot_id/share-link
- **Authentification** : session cookie NextAuth
- **Rate limit** : 20 liens/lot/jour
- **Request body** : `{ expires_in_days?: number }` (défaut : 30)
- **Response succès** : `{ share_url: string, expires_at: string }` — HTTP 200
- **Response erreur** : `{ error: "LINK_GENERATION_FAILED" }` — HTTP 500

---

### US-PM-25 : Consulter et gérer les dossiers livrés

**Persona** : Thomas Berger
**Epic** : Dossier PDF
**Dépendances** : US-PM-23
**Priorité RICE** : R=400 I=7 C=9 E=1 → Score=25 200

#### Job-to-be-done
En tant que Thomas, je veux retrouver tous mes dossiers livrés dans mon espace Versimo afin de retélécharger un dossier d'une ancienne opération ou vérifier le statut de partage.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN Thomas accède à /pro WHEN la liste des projets s'affiche THEN les projets au statut "delivered" affichent un badge "Dossier prêt" et un bouton "Télécharger" direct
- [ ] GIVEN Thomas clique "Télécharger" sur un projet WHEN l'action est déclenchée THEN le ZIP de tous les lots est téléchargé sans rechargement de page

**Cas d'erreur :**
- [ ] GIVEN un PDF d'un lot est manquant en DB WHEN Thomas tente le téléchargement THEN message : "Le dossier de ce lot n'est plus disponible. Regénérez-le." avec bouton "Regénérer le dossier"

**Cas limites :**
- [ ] GIVEN Thomas a 50 projets en "delivered" WHEN il cherche "Chartrons" dans la barre de recherche THEN seuls les projets dont l'adresse contient "Chartrons" sont affichés (recherche full-text sur adresse)

**Permissions :**
- [ ] N/A — même règle projet

**Données existantes :**
- [ ] GIVEN un projet a été livré il y a 6 mois WHEN Thomas le retrouve THEN les visuels sont disponibles (stockés dans Object Storage persistant) et le PDF peut être régénéré à la demande

---

### US-PM-26 : Générer la description commerciale par IA

**Persona** : Thomas Berger (impact invisible — valeur ajoutée du PDF)
**Epic** : Dossier PDF
**Dépendances** : US-PM-14 (qualification), US-PM-23
**Priorité RICE** : R=400 I=8 C=8 E=1 → Score=25 600

**Note : story purement backend sans UI. Sections "Contexte de navigation", "5 états UI" et "Notes @ux" = N/A.**

#### Job-to-be-done
En tant que système, je veux générer automatiquement un paragraphe de description commerciale par lot afin que le dossier PDF soit clé-en-main pour Thomas sans rédaction manuelle.

#### Critères d'acceptance

**Happy path :**
- [ ] GIVEN un lot a : cible "famille", style "Haussmannien", surface 65 m², adresse "33000 Bordeaux" WHEN la description est générée THEN le texte produit par GPT-4.1 text est en français, orienté acquéreur, 80-120 mots, sans mention de Versimo ni de l'IA
- [ ] GIVEN la description est générée WHEN elle est insérée dans le PDF THEN elle apparaît sur la page de couverture sous l'adresse du bien
- [ ] GIVEN Thomas veut modifier la description WHEN il clique "Modifier la description" dans l'interface de prévisualisation THEN un textarea éditable s'ouvre avec le texte généré — il peut le corriger librement avant de regénérer le PDF

**Cas d'erreur :**
- [ ] GIVEN GPT-4.1 text retourne une erreur WHEN la description est demandée THEN un texte par défaut est utilisé : "Bel appartement [type] de [surface] m² idéalement situé au [adresse]. À découvrir." — pas de blocage du PDF

**Cas limites :**
- [ ] GIVEN la cible est "investisseur_locatif" WHEN la description est générée THEN le texte mentionne le potentiel locatif et la rentabilité brute estimée (si surface × adresse permettent une estimation de loyer marché)

**Permissions :**
- [ ] N/A — logique serveur

**Données existantes :**
- [ ] GIVEN une description a été modifiée manuellement par Thomas WHEN le PDF est régénéré THEN la version manuelle est utilisée — pas la version IA (la version manuelle est prioritaire)

---

## 9. Modèle de données

### Tables PostgreSQL nécessaires

```sql
-- Projets (1 par bien immobilier)
projects (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  adresse         TEXT NOT NULL,
  type_bien       ENUM('immeuble','appartement','maison','bureaux','local_commercial'),
  surface_totale  DECIMAL(8,2),
  plan_file_path  TEXT,                 -- clé Object Storage
  status          ENUM('plan_uploaded','extraction_done','validated','qualified','plan_final','generating','visuals_done','delivered','extraction_failed'),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Lots (1 par appartement/unité dans un immeuble, ou 1 seul pour un bien unique)
lots (
  id              UUID PRIMARY KEY,
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,        -- ex : "T3 RDC gauche", "Lot A"
  floor           INTEGER DEFAULT 0,
  target_buyer    ENUM('famille','couple_sans_enfant','etudiant','investisseur_locatif','senior','professionnel_liberal'),
  style_id        TEXT,                 -- ref au StylePicker existant
  budget_travaux  DECIMAL(10,2),
  contraintes     TEXT,
  notes_commerciales TEXT,
  commercial_description TEXT,          -- description IA générée ou manuelle
  description_is_manual BOOLEAN DEFAULT FALSE,
  status          ENUM('pending','qualified','plan_final','generating','visuals_done','pdf_ready'),
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Pièces (1 par room extraite ou saisie manuellement)
rooms (
  id              UUID PRIMARY KEY,
  lot_id          UUID REFERENCES lots(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  room_type       ENUM('salon','cuisine','chambre','sdb','wc','bureau','couloir','cave','autre'),
  surface_m2      DECIMAL(6,2),
  length_m        DECIMAL(5,2),
  width_m         DECIMAL(5,2),
  ceiling_height_m DECIMAL(4,2),
  windows_count   INTEGER DEFAULT 0,
  doors_count     INTEGER DEFAULT 1,
  floor           INTEGER DEFAULT 0,
  is_estimated    BOOLEAN DEFAULT FALSE,  -- dimensions estimées (pas de cotes sur plan)
  confidence      DECIMAL(3,2),           -- score IA 0-1
  photo_path      TEXT,                   -- clé Object Storage photo source
  visual_pass1_path TEXT,                 -- clé Object Storage résultat passe 1
  visual_output_path TEXT,                -- clé Object Storage résultat final meublé
  generation_status ENUM('pending','generating_pass1','generating_pass2','done','failed'),
  source          ENUM('ai_extraction','manual'),
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Recommandations architecte IA
recommendations (
  id              UUID PRIMARY KEY,
  lot_id          UUID REFERENCES lots(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  action_type     ENUM('redistribution','cloison','affectation','deco'),
  estimated_cost_eur DECIMAL(8,2),
  impact_level    ENUM('basse','moyenne','haute'),
  affected_rooms  TEXT[],               -- array de room IDs
  is_accepted     BOOLEAN,              -- null = pas encore décidé
  is_active       BOOLEAN DEFAULT TRUE, -- false = archivé (ancienne version)
  version         INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

-- Liens de partage tokenisés
share_links (
  id              UUID PRIMARY KEY,
  lot_id          UUID REFERENCES lots(id) ON DELETE CASCADE,
  token           TEXT UNIQUE NOT NULL,  -- UUID v4
  expires_at      TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
)

-- Extension table generation_logs existante (ajout colonnes projet)
-- ALTER TABLE generation_logs ADD COLUMN project_id UUID REFERENCES projects(id);
-- ALTER TABLE generation_logs ADD COLUMN lot_id UUID REFERENCES lots(id);
-- ALTER TABLE generation_logs ADD COLUMN room_id UUID REFERENCES rooms(id);
```

### Relations clés

```
users → projects (1:N)
projects → lots (1:N)
lots → rooms (1:N)
lots → recommendations (1:N)
lots → share_links (1:N)
rooms → generation_logs (1:N, via room_id)
```

### Notes de migration

- La table `generation_logs` existante est étendue (pas recréée) — colonnes project_id, lot_id, room_id ajoutées avec `ALTER TABLE`
- Object Storage : les clés suivent le schéma `pro/{project_id}/{lot_id}/{room_id}/{type}.jpg` (type = source, pass1, output)
- Les PDFs ne sont PAS stockés de façon persistante — ils sont régénérés à la demande (coût serveur négligeable, garantit la fraîcheur)

---

## 10. Matrice des dépendances et ordre de livraison

### Graphe de dépendances (ordre strict de développement)

```
[FONDATION — livrer en premier]
  US-PM-01 Créer projet          → débloque toutes les autres US
  US-PM-03 Liste projets         → parallélisable avec US-PM-01

[BLOC EXTRACTION]
  US-PM-04 Extraction IA         → dépend de US-PM-01
  US-PM-05 Fallback saisie       → parallélisable avec US-PM-04
  US-PM-06 Estimation dimensions → parallélisable avec US-PM-04
  US-PM-02 Upload mobile         → parallélisable avec US-PM-01

[BLOC VALIDATION]
  US-PM-07 Corriger pièces       → dépend de US-PM-04 ou US-PM-05
  US-PM-08 Lots immeuble         → dépend de US-PM-07
  US-PM-09 Supprimer pièce       → parallélisable avec US-PM-07

[BLOC QUALIFICATION]
  US-PM-10 Cible acheteur        → dépend de US-PM-08
  US-PM-11 Choix style           → parallélisable avec US-PM-10
  US-PM-12 Budget + contraintes  → parallélisable avec US-PM-10
  US-PM-13 Photos par pièce      → parallélisable avec US-PM-10
  US-PM-14 Récap qualification   → dépend de US-PM-10, US-PM-11, US-PM-12, US-PM-13

[BLOC RECOMMANDATIONS]
  US-PM-15 Générer recommandations → dépend de US-PM-14
  US-PM-16 Accepter/refuser        → dépend de US-PM-15
  US-PM-17 Plan final recap        → dépend de US-PM-16
  US-PM-18 Régénérer recommandations → parallélisable avec US-PM-16

[BLOC GÉNÉRATION — gate paiement]
  US-PM-21 Enrichissement prompt   → dépend de US-PM-07 (dimensions)
            — livrer en même temps que US-PM-19 (back-end uniquement)
  US-PM-19 Paiement + génération   → dépend de US-PM-17, US-PM-21
  US-PM-20 Suivi progression       → dépend de US-PM-19
  US-PM-22 Régénérer un visuel     → dépend de US-PM-20

[BLOC DOSSIER PDF]
  US-PM-26 Description commerciale IA → parallélisable avec US-PM-19 (back-end)
  US-PM-23 Générer PDF             → dépend de US-PM-20, US-PM-26
  US-PM-24 Partager le dossier     → dépend de US-PM-23
  US-PM-25 Gérer dossiers livrés   → dépend de US-PM-23
```

### Priorisation par vague de livraison

| Vague | US | Valeur testable par Thomas |
|---|---|---|
| **V1 — Parcours complet minimal** | US-PM-01, 04, 05, 07, 08, 10, 11, 13, 14, 15, 16, 17, 19, 20, 23, 24 | Thomas peut aller de l'upload du plan au PDF partageable |
| **V2 — Qualité et confort** | US-PM-02, 03, 06, 09, 12, 18, 21, 22, 25, 26 | Upload mobile fluide, dimensions enrichies, régénération, dossiers gérables |
| **V3 — Optimisations** | US-PM-02 (HEIC), US-PM-26 (description investisseur), pagination US-PM-03 | Edge cases couverts, production-grade |

### Parcours critiques (à tester en priority 1)

1. **Happy path complet** : upload plan → extraction → validation → qualification 1 lot / 1 style → recommandations (skip) → génération 1 pièce avec photo → PDF → lien WhatsApp
2. **Plan illisible** : extraction failed → saisie manuelle → continuation normale
3. **Immeuble 2 lots** : découpe lots → qualification séparée → PDF × 2 → ZIP

---

**Handoff → @fullstack**
- Fichiers produits : `docs/marchand-pivot/product/functional-specs.md`
- Décisions prises :
  - Pipeline 2 passes existant réutilisé sans modification d'architecture (enrichissement prompt uniquement)
  - GPT-4.1 vision pour extraction, GPT-4.1 text pour recommandations et descriptions, gpt-image-1.5 pour visuels
  - Paiement déclenché à l'étape 6 uniquement — étapes 1-5 gratuites
  - PDFs générés à la demande (pas de cache) — garantit la fraîcheur
  - Liens de partage tokenisés (UUID, 30 jours) — pas d'authentification requise pour les acquéreurs
- Points d'attention :
  - Validation utilisateur OBLIGATOIRE étape 3 — jamais de donnée IA envoyée directement en génération
  - Parallélisation génération : max 2 pièces concurrentes (comme pipeline existant)
  - Rate limiting sur /extract : 3 tentatives max par projet (anti-boucle coûteuse)
  - Table generation_logs : étendre via ALTER TABLE, ne pas recréer
  - Object Storage : schéma de clé `pro/{project_id}/{lot_id}/{room_id}/{type}.jpg`
  - US-PM-21 (enrichissement prompt) = back-end pur, livrer en même temps que US-PM-19
  - Coût estimé par bien : ~$2.71 (ROI 960x vs home stager humain)
