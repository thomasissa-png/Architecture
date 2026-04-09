# User Flows — Parcours Marchand de Biens
**Date** : 2026-04-09 | **Agent** : @ux | **Persona** : Thomas Berger, 35 ans, marchand de biens Bordeaux

---

## 1. Carte du parcours (overview 7 étapes)

Contexte de déclenchement : Thomas vient d'acquérir un immeuble à rénover (ou en chantier actif). Il a des photos prises sur site avec son iPhone 15 Pro. Son objectif immédiat : sortir un dossier acquéreur présentable pour commencer la pré-commercialisation avant même la fin des travaux.

```
[ENTRÉE] Thomas arrive sur versimo.fr (mobile ou laptop)
    ↓
[ÉTAPE 1] Upload plan + photos
    — Dépose plan de l'immeuble (PDF/image) + photos de chaque pièce
    — Durée estimée : 2-5 min
    ↓
[ÉTAPE 2] Extraction et cartographie IA
    — L'IA lit le plan, extrait les pièces, les dimensions, les liaisons
    — Thomas visualise le résultat (carte interactive des lots/pièces)
    — Durée IA : 30-60 sec
    ↓
[ÉTAPE 3] Validation / Correction
    — Thomas valide les pièces extraites ou corrige (renommer, redimensionner, supprimer/ajouter)
    — Il associe chaque photo à la pièce correspondante
    — Durée : 3-8 min selon nombre de pièces
    ↓
[DÉCISION PAIEMENT] → 99€/bien — avant génération IA
    — Paiement carte ou Stripe, 1 clic
    ↓
[ÉTAPE 4] Qualification du projet
    — Cible acquéreur (famille, couple, investisseur locatif)
    — Style déco par lot (ou global)
    — Budget / standing (entrée de gamme, intermédiaire, premium)
    — Durée : 2-4 min
    ↓
[ÉTAPE 5] Recommandations architecte IA
    — L'agent propose des réagencements par lot (cloisons, ouvertures, usage des espaces)
    — Thomas valide ou ignore les recommandations
    — Durée IA : 20-40 sec
    ↓
[ÉTAPE 6] Génération des visuels
    — Pipeline 2 passes pour chaque pièce (surfaces → mobilier)
    — Traitement parallèle, max 2 concurrent
    — Durée : 90 sec par pièce × N pièces (affichées au fur et à mesure)
    ↓
[ÉTAPE 7] Dossier PDF + partage
    — Génération du dossier PDF par lot (visuels avant/après, plan, disclaimer légal)
    — Partage WhatsApp / email / lien sécurisé
    — Téléchargement ZIP des visuels HD
    — [SORTIE] Thomas envoie le dossier à ses acquéreurs
```

### États du parcours par étape

| Étape | État défaut | État loading | État vide | État erreur | État succès |
|---|---|---|---|---|---|
| 1. Upload | Zone drag & drop inactive | Progress bar upload | "Déposez votre premier fichier" | "Format non supporté / fichier trop lourd" | Toast vert + miniature visible |
| 2. Extraction IA | — | Spinner + "Analyse du plan en cours…" | — | "Plan illisible — essayez une photo plus nette" | Carte des pièces affichée |
| 3. Validation | Pièces pré-remplies | Sauvegarde auto silencieuse | Pièce sans photo affichée en gris | Photo non associée signalée | Toutes les pièces avec photo = bouton "Continuer" actif |
| Paiement | Récapitulatif bien + prix | "Paiement en cours…" | — | "Échec paiement — réessayez" | Confirmation + récapitulatif |
| 4. Qualification | Champs vides avec placeholder | — | — | — | Résumé de la qualification affiché |
| 5. Recommandations | — | "L'architecte IA analyse votre projet…" | — | "Analyse indisponible — vous pouvez continuer" | Recommandations listées par lot |
| 6. Génération | Vignettes en attente | Blur progressif pièce par pièce | Pièce sans photo → skipped | Retry automatique silencieux | Comparateur avant/après activé |
| 7. Dossier PDF | Aperçu du dossier | "Génération du PDF…" | — | "Erreur PDF — réessayez" | PDF prêt + options de partage |

---

## 2. Flow détaillé par étape

### Étape 1 — Upload plan + photos

**Contexte** : Thomas arrive sur versimo.fr/marchand (ou via CTA "Je suis marchand de biens" sur la home). Il est souvent sur chantier avec son iPhone.

**Écran principal (mobile-first)**
```
┌─────────────────────────────────────────┐
│  VERSIMO                         [Menu] │
│  ─────────────────────────────────────  │
│  Nouveau bien                           │
│  ─────────────────────────────────────  │
│                                         │
│  1. Nom du bien (ex: "Appt T3 Rue Ney") │
│  [Champ texte]                          │
│                                         │
│  2. Plan de l'immeuble (optionnel)      │
│  ┌───────────────────────────┐          │
│  │  + Déposer le plan        │          │
│  │  PDF, PNG, JPG — max 20Mo │          │
│  └───────────────────────────┘          │
│  → "Je n'ai pas de plan" [lien]         │
│                                         │
│  3. Photos des pièces (jusqu'à 20)      │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                   │
│  │+│ │+│ │+│ │+│                       │
│  └──┘ └──┘ └──┘ └──┘                   │
│  JPG/PNG/HEIC — prises sur place ✓     │
│                                         │
│  [Continuer →]  (actif dès 1 photo)     │
└─────────────────────────────────────────┘
```

**Actions utilisateur**
- Nommer le bien (mémo interne, non publié)
- Déposer le plan (PDF scan ou photo) — optionnel
- Déposer les photos de pièces (appareil photo natif iOS ou galerie)
- Appuyer sur "Continuer" dès qu'au moins 1 photo est uploadée

**Feedback système**
- Barre de progression par fichier (upload en background)
- Toast vert + miniature pour chaque photo acceptée
- Toast rouge si format refusé ou fichier > 20 Mo
- Le bouton "Continuer" passe de grisé à actif dès la première photo validée

**États**
- Défaut : zone drag & drop avec icône + label "Déposer ou cliquer pour sélectionner"
- Loading : progress bar circulaire sur chaque vignette en cours d'upload
- Vide : placeholder "Aucune photo ajoutée — votre dossier sera vide"
- Erreur : banner "3 fichiers refusés : format non supporté. Acceptés : JPG, PNG, HEIC, PDF"
- Succès : vignettes affichées avec checkmark vert, compteur "5/20 photos"

**Transitions**
- Auto-scroll vers la section suivante après validation du plan
- Sur mobile : bouton "Continuer" sticky en bas de viewport

**Mobile vs desktop**
- Mobile : accès direct à l'appareil photo (bouton "Prendre une photo") + galerie ; une colonne
- Desktop : drag & drop zone large (400px) ; grille 4 colonnes de vignettes

---

### Étape 2 — Extraction et cartographie IA

**Contexte** : uniquement si Thomas a déposé un plan. L'IA lit le plan et propose une cartographie des pièces.

**Écran principal**
```
┌─────────────────────────────────────────┐
│  Étape 2/7    [●●○○○○○]                 │
│  ─────────────────────────────────────  │
│  Analyse du plan en cours…              │
│                                         │
│  ┌─────────────────────────────┐        │
│  │   [Aperçu plan en grisé]   │        │
│  │   ⟳ Détection des pièces… │        │
│  └─────────────────────────────┘        │
│                                         │
│  Pièces détectées jusqu'ici :           │
│  ✓ Séjour — 28m²                        │
│  ✓ Chambre 1 — 14m²                     │
│  ⟳ Chambre 2…                          │
└─────────────────────────────────────────┘
```

**Actions utilisateur** : aucune pendant l'analyse (lecture passive)

**Feedback système**
- Spinner global + message "Analyse du plan en cours… ~30 secondes"
- Liste des pièces détectées qui s'affiche progressivement (streaming)
- Si erreur : banner "Plan illisible — passez directement à l'étape suivante" + CTA "Associer les photos manuellement"

**États**
- Loading : animation de scan sur le plan (lignes de balayage)
- Erreur : plan illisible → skip automatique vers étape 3 en mode manuel
- Succès : carte des pièces affichée avec surfaces et liaisons

**Transition** : auto-avance vers étape 3 dès l'analyse terminée (pas de clic requis)

**Mobile vs desktop** : identique — la carte est scrollable sur mobile

---

### Étape 3 — Validation et association photos/pièces

**Contexte** : Thomas vérifie que les pièces extraites correspondent à la réalité et associe chaque photo à la bonne pièce.

**Écran principal**
```
┌─────────────────────────────────────────┐
│  Étape 3/7    [●●●○○○○]                 │
│  Vérifiez les pièces de votre bien      │
│  ─────────────────────────────────────  │
│  ┌─────────────────────────────────┐    │
│  │  Séjour                  28m²  │    │
│  │  [Photo associée : img_01.jpg] │    │
│  │  [Modifier] [Supprimer pièce]  │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Chambre 1               14m²  │    │
│  │  ⚠ Aucune photo associée       │    │
│  │  [+ Associer une photo]        │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Chambre 2               12m²  │    │
│  │  [Photo associée : img_03.jpg] │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [+ Ajouter une pièce manuellement]     │
│                                         │
│  [← Retour]    [Continuer →]            │
│  (Continuer actif si ≥ 1 pièce avec    │
│   photo associée)                       │
└─────────────────────────────────────────┘
```

**Actions utilisateur**
- Renommer une pièce (tap sur le nom)
- Corriger la surface (tap sur le chiffre)
- Associer une photo à une pièce (tap "Associer une photo" → sélecteur galerie)
- Supprimer une pièce (swipe left sur mobile, bouton "Supprimer" sur desktop)
- Ajouter une pièce manquante (bouton "+")
- Si pas de plan uploadé : créer toutes les pièces manuellement depuis cette étape

**Feedback système**
- Pièces sans photo signalées par icône ⚠ orange (pas bloquant, juste un avertissement)
- Compteur "X pièces avec photo / Y pièces au total"
- Sauvegarde automatique silencieuse à chaque modification (indicateur "Sauvegardé" en bas)

**États**
- Défaut (avec plan) : pièces pré-remplies, certaines sans photo
- Défaut (sans plan) : liste vide avec CTA "Ajouter votre première pièce"
- Vide : pièces sans photo affichées en gris avec label "Pas de photo — cette pièce ne sera pas générée"
- Erreur : pièce avec nom vide → validation inline "Donnez un nom à cette pièce"
- Succès : toutes les pièces ont une photo → bouton "Continuer" avec checkmark

**Mobile vs desktop**
- Mobile : chaque pièce = carte pleine largeur ; swipe gauche pour supprimer
- Desktop : tableau 2 colonnes (liste pièces + aperçu photo sélectionnée)

---

### Point de paiement — 99€/bien

**Positionnement** : à l'Étape 1, AVANT tout le parcours. Décision fondateur : "On paie avant. Pas après." Thomas paie 99€/bien dès la création du projet. Le paiement est la porte d'entrée — les étapes 2-7 ne sont accessibles qu'après paiement validé. Abonnés Pro : crédit débité automatiquement, pas d'écran Stripe.

**Écran**
```
┌─────────────────────────────────────────┐
│  Récapitulatif avant génération         │
│  ─────────────────────────────────────  │
│  Bien : "Appt T3 Rue Ney"               │
│  Pièces à générer : 4                   │
│  Visuels : 4 avant + 4 après            │
│  Dossier PDF : inclus                   │
│                                         │
│  ─────────────────────────────────────  │
│  Tarif : 99€ TTC / bien                 │
│  (ou inclus dans votre abonnement Pro)  │
│                                         │
│  [Payer 99€ — Stripe]                   │
│  [Utiliser mes crédits — X restants]    │
│                                         │
│  Paiement sécurisé · Remboursé si       │
│  résultats non conformes               │
└─────────────────────────────────────────┘
```

**Feedback** : confirmation immédiate + récapitulatif email envoyé

---

### Étape 4 — Qualification du projet

**Contexte** : Thomas définit le positionnement commercial de chaque lot pour que l'IA cible le bon style.

**Écran principal**
```
┌─────────────────────────────────────────┐
│  Étape 4/7    [●●●●○○○]                 │
│  Qualifiez votre projet                 │
│  ─────────────────────────────────────  │
│  Ces informations guident l'IA pour     │
│  choisir le mobilier adapté à vos       │
│  acquéreurs cibles.                     │
│                                         │
│  Cible acquéreur                        │
│  [Famille] [Couple] [Investisseur] [+]  │
│                                         │
│  Style déco (appliqué à toutes pièces)  │
│  [Scandinave] [Haussmannien] [Contemporain]│
│  [Japandi] [Art Déco] [Mid-Century] [+] │
│  → Ou personnalisé : [champ texte]      │
│                                         │
│  Standing du bien                       │
│  ○ Entrée de gamme (<250K€)             │
│  ● Intermédiaire (250-450K€)            │
│  ○ Premium (>450K€)                     │
│                                         │
│  [← Retour]    [Continuer →]            │
└─────────────────────────────────────────┘
```

**Actions utilisateur**
- Sélectionner la cible acquéreur (chips multi-select)
- Choisir 1 style déco (ou saisir un style personnalisé)
- Sélectionner le standing (radio buttons)
- Optionnel : style différent par lot (lien "Personnaliser lot par lot")

**Feedback système** : résumé de qualification affiché en bas avant "Continuer"

**États**
- Défaut : aucune sélection, bouton "Continuer" actif (le style est optionnel — Scandinave par défaut)
- Erreur : aucun cas bloquant — tout est optionnel avec défauts raisonnables

**Mobile vs desktop** : chips scrollables horizontalement sur mobile

---

### Étape 5 — Recommandations architecte IA

**Contexte** : l'agent architecte IA analyse le plan et les qualifications pour proposer des recommandations de réagencement. C'est le "aha moment" N°1 pour Thomas — il voit la valeur-ajoutée intellectuelle de Versimo.

**Écran principal**
```
┌─────────────────────────────────────────┐
│  Étape 5/7    [●●●●●○○]                 │
│  Recommandations de l'architecte IA     │
│  ─────────────────────────────────────  │
│  Basées sur votre plan et votre cible   │
│  acquéreur (Famille, Intermédiaire)     │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 💡 Séjour                       │    │
│  │ "Abattre la cloison non-        │    │
│  │  porteuse entre séjour et       │    │
│  │  cuisine pour un espace de vie  │    │
│  │  ouvert de 40m². Gain perçu :   │    │
│  │  +15% sur le prix de vente."    │    │
│  │ [Appliquer au dossier] [Ignorer]│    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 💡 Chambre 1                    │    │
│  │ "Repositionner la sdb en-suite  │    │
│  │  pour la cible famille. Coût    │    │
│  │  estimé : 4-8K€."               │    │
│  │ [Appliquer au dossier] [Ignorer]│    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Ignorer toutes] [Continuer →]         │
└─────────────────────────────────────────┘
```

**Actions utilisateur**
- Appliquer une recommandation (elle apparaît dans le dossier PDF final comme note)
- Ignorer une recommandation
- Ignorer toutes et continuer directement
- Cliquer "Continuer" à tout moment (l'étape est non-bloquante)

**Feedback système**
- Loading : "L'architecte IA analyse votre projet… ~20 secondes"
- Si erreur API : "Analyse indisponible pour le moment — vous pouvez continuer sans recommandations" + auto-avance vers étape 6 après 3 secondes

**États**
- Loading : animation pulsante sur le plan + message d'attente
- Erreur : dégradé gracieux, étape sautée automatiquement
- Succès : recommandations listées, chacune avec badge "Appliqué" si sélectionnée

**Mobile vs desktop** : identique — cartes empilées verticalement

---

### Étape 6 — Génération des visuels

**Contexte** : le pipeline 2 passes (surfaces → mobilier) tourne pour chaque pièce. C'est le "aha moment" N°2 — Thomas voit ses pièces se transformer en direct.

**Écran principal**
```
┌─────────────────────────────────────────┐
│  Étape 6/7    [●●●●●●○]                 │
│  Génération en cours…                   │
│  ─────────────────────────────────────  │
│  4 pièces · ~6 minutes au total         │
│                                         │
│  ┌──────────┐ ┌──────────┐              │
│  │ SÉJOUR   │ │CHAMBRE 1 │              │
│  │ [Photo   │ │ [Photo   │              │
│  │  floutée]│ │  floutée]│              │
│  │ ⟳ Passe  │ │ ⟳ Passe  │              │
│  │ surfaces │ │ surfaces │              │
│  └──────────┘ └──────────┘              │
│  ┌──────────┐ ┌──────────┐              │
│  │CHAMBRE 2 │ │  SDB     │              │
│  │ [Photo]  │ │ [Photo]  │              │
│  │ En attente│ │En attente│             │
│  └──────────┘ └──────────┘              │
│                                         │
│  Séjour terminé ! [Voir le résultat]    │
│                                         │
│  [↓ Télécharger HD] (actif par pièce)  │
└─────────────────────────────────────────┘
```

**Actions utilisateur**
- Voir un résultat pièce par pièce dès qu'il est disponible (comparateur avant/après)
- Télécharger HD d'une pièce terminée sans attendre les autres
- "Régénérer cette pièce" si le résultat ne convient pas (1 retry gratuit par pièce)

**Feedback système**
- Vignette floutée pendant la génération (image originale en blur)
- Indicateur par pièce : "Passe 1 — surfaces" → "Passe 2 — mobilier" → "Terminé ✓"
- Notification push mobile quand toutes les pièces sont terminées
- En cas d'échec passe 2 : livrer passe 1 + message "Mobilier en cours de génération, résultat dans quelques instants"

**États**
- Loading : blur progressif + indicateur de passe
- Erreur passe 2 : passe 1 livrée + retry automatique silencieux 1 fois
- Erreur totale : "Génération indisponible — réessayez dans quelques instants" + crédit non consommé
- Succès partiel : pièces terminées affichées, autres en attente
- Succès total : toutes les vignettes avec comparateur slider + CTA "Générer le dossier PDF"

**Transitions** : au premier résultat disponible, auto-scroll vers la vignette terminée

**Mobile vs desktop**
- Mobile : grille 1 colonne (chaque pièce pleine largeur) ; notifications push pour "prêt"
- Desktop : grille 2×N colonnes ; poll silent en arrière-plan

---

### Étape 7 — Dossier PDF + partage

**Contexte** : Thomas a ses visuels. Versimo génère automatiquement un dossier acquéreur prêt à partager. C'est la livraison finale — la raison pour laquelle il a payé 99€.

**Écran principal**
```
┌─────────────────────────────────────────┐
│  Étape 7/7    [●●●●●●●]                 │
│  Votre dossier est prêt                 │
│  ─────────────────────────────────────  │
│  ┌─────────────────────────────────┐    │
│  │  APERÇU PDF                     │    │
│  │  Page 1 : Présentation bien     │    │
│  │  Pages 2-5 : Visuels avant/après│    │
│  │  Page 6 : Plan annoté           │    │
│  │  Page 7 : Disclaimer légal      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Partager avec vos acquéreurs :         │
│  [📎 Lien sécurisé]  [📧 Email]         │
│  [💬 WhatsApp]       [📥 Télécharger]  │
│                                         │
│  Télécharger :                          │
│  [PDF dossier complet]                  │
│  [ZIP visuels HD (8 images)]            │
│                                         │
│  ─────────────────────────────────────  │
│  Créez un nouveau bien                  │
│  [+ Nouveau bien →]                     │
└─────────────────────────────────────────┘
```

**Actions utilisateur**
- Partager via lien sécurisé (lien expire après 30 jours, protégé par mot de passe optionnel)
- Envoyer par email (saisie directe dans la modale)
- Partager sur WhatsApp (native share sur mobile, wa.me sur desktop)
- Télécharger le PDF complet
- Télécharger le ZIP des visuels HD
- Créer un nouveau bien (reset du parcours)

**Feedback système**
- Toast "Lien copié !" après tap sur lien sécurisé
- Toast "PDF téléchargé !" après téléchargement
- Confirmation "Email envoyé à [adresse]"

**États**
- Loading : "Génération du PDF… ~10 secondes"
- Erreur PDF : "Erreur de génération — réessayez. Vos visuels restent disponibles pour téléchargement individuel"
- Succès : aperçu PDF + toutes les options de partage actives

**Mobile vs desktop**
- Mobile : boutons de partage en grille 2×2 ; bouton WhatsApp proéminent (usage principal)
- Desktop : boutons en ligne ; lien sécurisé avec champ de copie

---

## 3. Points de décision critiques

### Quand Thomas peut-il revenir en arrière ?

| Transition | Retour possible ? | Contrainte |
|---|---|---|
| Étape 1 → 2 | Oui, libre | Aucune |
| Étape 2 → 3 | Oui, libre | Aucune |
| Étape 3 → Paiement | Oui, libre | Aucune |
| Paiement → Étape 4 | Oui (vers étape 3) | Paiement non remboursé automatiquement (support requis) |
| Étape 4 → 5 | Oui, libre | Requalification possible |
| Étape 5 → 6 | Oui, libre | Recommandations non perdues |
| Étape 6 → 7 | Non (génération déjà lancée) | Les visuels générés restent accessibles depuis le tableau de bord |

**Règle UX** : le bouton "Retour" est visible à chaque étape jusqu'au lancement de la génération (étape 6). Une fois la génération lancée, "Retour" est remplacé par "Voir tous mes biens" (tableau de bord).

### Quand Thomas peut-il sauvegarder et reprendre plus tard ?

- **Sauvegarde automatique** à chaque étape (dès qu'un fichier est uploadé, le projet existe en base)
- **Accès via tableau de bord** : Thomas retrouve ses biens "en cours" avec statut par étape
- **Session recovery** : si Thomas ferme l'onglet à l'étape 3, il reprend exactement là où il s'est arrêté
- **Expiration** : les projets non complétés sont conservés 30 jours (email de relance à J+3 et J+7)

### Quand le paiement intervient-il ?

**Décision fondateur : paiement à l'Étape 1, AVANT tout le parcours. "On paie avant. Pas après."**

Justification :
- Le marchand sait ce qu'il achète (dossier de pré-commercialisation complet pour son bien)
- Pas de risque d'abus (extraction IA, recommandations architecte = coûts API)
- Le paiement filtre les curieux — seuls les marchands sérieux entrent dans le parcours
- Si abonné Pro : crédit débité automatiquement, pas d'écran Stripe

**Alternative écartée** : paiement après étape 3 (après validation plan) → risque d'abus de l'extraction IA gratuite, et le fondateur veut un engagement dès le départ

---

## 4. Edge cases

### EC-1 — Plan illisible (PDF scan trop compressé, photo floue, plan à main levée)

**Détection** : l'IA de lecture de plan retourne un score de confiance < 0.5 ou 0 pièces détectées.

**Comportement** :
1. Message inline sous l'aperçu plan : "Ce plan est difficile à lire. Passez à l'étape suivante pour associer vos photos manuellement."
2. Bouton "Réessayer avec une meilleure photo" (remplacer le plan)
3. Bouton "Continuer sans plan" (étape 3 en mode création manuelle)
4. Le plan illisible n'est PAS une erreur bloquante — Thomas peut créer ses pièces à la main

**[FRICTION H9]** : l'erreur doit proposer la solution, pas juste indiquer l'échec. Formulation : "Plan illisible — voici comment continuer :" suivi des 2 options.

---

### EC-2 — Immeuble sans plan (Thomas a seulement des photos)

**Scénario** : Thomas n'a pas de plan (bien acquis en urgence, plan non disponible).

**Comportement** :
1. À l'étape 1, lien "Je n'ai pas de plan" visible et proéminent (pas caché en bas de page)
2. L'étape 2 (extraction IA) est sautée entièrement
3. Thomas crée ses pièces manuellement à l'étape 3 (nom + surface approximative + photo)
4. Les recommandations architecte (étape 5) sont limitées : "Plan non disponible — recommandations basées sur les photos uniquement"

**UX note** : le parcours sans plan doit être une first-class experience, pas un fallback dégradé. 40% des marchands n'ont pas le plan au moment de la pré-commercialisation (chantier actif).

---

### EC-3 — Pièce sans photo associée

**Scénario** : Thomas a listé 5 pièces mais n'a une photo que pour 3 d'entre elles (cave non photographiée, SDB en travaux).

**Comportement** :
1. Les pièces sans photo sont signalées en orange à l'étape 3 (pas bloquant)
2. Tooltip : "Sans photo, cette pièce ne sera pas générée. Elle peut être ajoutée plus tard."
3. Le dossier PDF final inclut une page par lot avec les pièces générées et une note "Autres pièces : à venir"
4. Option "Générer plus tard" : Thomas peut uploader la photo manquante depuis son tableau de bord et relancer la génération pour cette pièce seule (crédit supplémentaire : 0 si abonné Pro, sinon tarif unitaire)

---

### EC-4 — Lot sans accès direct (cave, parking, local vélo)

**Scénario** : l'immeuble comprend des lots annexes (cave numérotée, parking, local commun) qui ne se meublent pas.

**Comportement** :
1. À l'étape 3, chaque pièce a un menu déroulant "Type" : Pièce à vivre / Chambre / SDB / Cuisine / Couloir / **Annexe (cave, parking)**
2. Les pièces de type "Annexe" sont exclues de la génération IA (pas de style, pas de prompt)
3. Elles apparaissent dans le dossier PDF avec la mention "Lot annexe — voir descriptif" sans visuel meublé
4. Thomas peut les inclure quand même s'il veut (option "Générer quand même")

---

### EC-5 — Interruption en cours de génération

**Scénario** : Thomas ferme l'onglet, perd le réseau (chantier), ou son téléphone s'éteint pendant l'étape 6.

**Comportement** :
1. La génération continue côté serveur (job asynchrone en base, pas lié à la session)
2. Quand Thomas revient (même device, autre device), le tableau de bord affiche le statut "Génération en cours" ou "Terminée"
3. Notification push mobile (si accordée) quand les visuels sont prêts
4. Email de notification avec lien direct vers les résultats
5. Si la génération a échoué après timeout serveur : crédit non consommé, bouton "Relancer"

**[FRICTION H1]** : Thomas doit savoir que la génération continue même s'il ferme l'onglet. Message explicite à l'étape 6 : "Vous pouvez fermer cette page — nous vous notifions quand c'est prêt."

---

### EC-6 — Paiement refusé

**Scénario** : carte expirée, fonds insuffisants, erreur Stripe.

**Comportement** :
1. Message inline Stripe : "Paiement refusé — [raison Stripe traduite en français]"
2. CTA "Essayer une autre carte"
3. CTA "Utiliser PayPal" (si disponible)
4. Le projet est sauvegardé — Thomas peut revenir payer plus tard

---

### EC-7 — Génération IA indisponible (erreur OpenAI)

**Scénario** : API OpenAI down ou rate limit atteint.

**Comportement** :
1. Message joli : "Génération momentanément indisponible. Votre projet est sauvegardé et sera lancé automatiquement dans quelques minutes."
2. Pas de retry manuel nécessaire — le job est mis en queue
3. Email + notification push quand disponible
4. Le crédit n'est PAS consommé si aucune pièce n'a été générée

---

## 5. Onboarding first-time

### Comment Thomas découvre le parcours

**Canaux d'entrée anticipés** (par ordre de probabilité) :
1. Landing page versimo.fr/marchand → CTA "Démarrer gratuitement" (voir la première transformation sans payer)
2. Recommandation pair-à-pair (WhatsApp entre marchands de biens)
3. LinkedIn / contenu organique ciblé marchands de biens
4. Google "home staging virtuel IA marchand de biens"

**First impression — Mobile (iPhone 15 Pro)**
- Thomas arrive sur la landing page depuis un lien WhatsApp
- Hero : "Transformez vos biens en chantier en dossiers acquéreurs en 10 minutes"
- Proof social immédiat : "3 visuels · 99€ · Sans abonnement"
- CTA principal : "Tester sur mon bien" → crée un compte ou continue sans compte

**Première session : mode démo (sans paiement)**
- Thomas peut aller jusqu'à l'étape 3 (validation plan + photos) sans créer de compte
- À l'étape 3 terminée : écran "Voici ce que Versimo va générer" → récapitulatif des pièces + estimation visuelle
- Création de compte requise pour continuer (Google OAuth ou email — 1 tap)
- Paiement requis pour lancer la génération

### Le "aha moment"

**Deux aha moments successifs** (délibéré : le deuxième convertit les sceptiques)

**Aha moment N°1 — Étape 5, recommandations architecte**
- Thomas n'attendait que des visuels. Il obtient aussi une analyse de son plan.
- "Abattre la cloison entre séjour et cuisine → +15% sur le prix de vente estimé"
- Signal : Thomas peut inclure cette recommandation dans son dossier acquéreur → valeur argumentaire de vente
- Timing : ~8 minutes après l'arrivée sur le site

**Aha moment N°2 — Étape 6, premier visuel terminé**
- La photo du séjour vide se transforme en séjour meublé Scandinave avec meubles à l'échelle
- L'angle de vue est identique → Thomas reconnaît SES murs, SA fenêtre
- Signal : Thomas prend une capture d'écran et l'envoie sur WhatsApp avant même d'avoir le dossier PDF
- Timing : ~12 minutes après l'arrivée sur le site

### Tooltip tour first-time (non intrusif)

À la première session, 3 tooltips contextuels (1 par section critique) :

1. **Étape 1** : tooltip sur "Je n'ai pas de plan" → "Pas de problème — vous pouvez créer vos pièces manuellement à l'étape suivante"
2. **Étape 3** : tooltip sur l'indicateur ⚠ → "Les pièces sans photo ne seront pas générées. Vous pouvez en ajouter plus tard."
3. **Étape 6** : tooltip au lancement → "La génération continue même si vous fermez cet onglet. Nous vous notifions quand c'est prêt."

Règle : les tooltips disparaissent au premier tap. Aucun "guided tour" de 8 étapes. Chaque tooltip répond à l'anxiété la plus probable du moment.

### Time-to-value

| Étape | Durée estimée | Cumulé |
|---|---|---|
| Arrivée → Upload 3 photos | 2 min | 2 min |
| Extraction plan | 45 sec | ~3 min |
| Validation pièces | 3 min | ~6 min |
| Paiement | 1 min | ~7 min |
| Qualification | 2 min | ~9 min |
| **Aha moment N°1** — recommandations | 30 sec | **~10 min** |
| Génération pièce 1 | 90 sec | ~12 min |
| **Aha moment N°2** — premier visuel | 0 sec | **~12 min** |

**Verdict** : time-to-value < 12 minutes depuis une première visite. PASS (seuil cible ≤ 15 min pour B2B complexe).

Justification du dépassement du seuil ≤ 3 étapes : ce flow en 7 étapes est justifié par la complexité du cas d'usage B2B (un bien = plusieurs pièces + plan + qualification + paiement). Le aha moment intervient à l'étape 5 (N=5, non ≤ 3), mais le time-to-value absolu reste sous 12 minutes grâce à la fluidité des transitions.

---

## 6. Comparaison avec le parcours actuel

### Ce qui reste identique

| Composant | Versimo actuel | Versimo marchand |
|---|---|---|
| Upload de photos | UploadZone.tsx (drag & drop, 5 photos, HEIC/JPG/PNG) | Même composant, limite portée à 20 photos |
| Choix de style | StylePicker.tsx (12 styles + custom) | Intégré à l'étape 4 (qualification) |
| Pipeline de génération | 2 passes surfaces → mobilier | Identique, appliqué à chaque pièce |
| Comparateur avant/après | ImageComparator.tsx | Identique |
| Partage WhatsApp + téléchargement HD | Boutons dans ImageComparator | Conservés + ajout lien sécurisé |
| Feedback génération (blur + progress) | Page.tsx | Identique |

### Ce qui change

| Aspect | Versimo actuel | Versimo marchand |
|---|---|---|
| Objet de travail | 1 photo → 1 visuel | 1 bien → N pièces → 1 dossier |
| Lecture de plan | Inexistant | Nouvelle feature (étape 2) |
| Gestion des pièces | Implicite (1 photo = 1 pièce) | Explicite (cartographie + association) |
| Qualification | Aucune | Cible acquéreur + standing + style |
| Recommandations IA | Aucune | Architecte IA (étape 5) |
| Livrable final | Visuels téléchargeables | Dossier PDF prêt à partager |
| Paiement | Crédits à la génération | 99€/bien (ou abonnement Pro) |
| Point de paiement | Avant upload (ou inclus dans crédits) | Après validation plan, avant génération |
| Navigation | Single-page (3 sections) | Stepper 7 étapes avec sauvegarde |
| Persistance | Session (pas de compte requis) | Compte requis, projets sauvegardés |

### Migration UX pour les utilisateurs existants

**Utilisateurs actuels** (Claire l'architecte, Léa la particulière) :
- L'outil actuel (3 étapes, landing page) reste accessible et inchangé
- Le parcours marchand est un mode distinct : URL dédiée ou CTA "Mode Pro" dans l'header
- Pas de migration forcée — les deux parcours coexistent

**Thomas qui avait déjà un compte** :
- Dashboard unifié : "Mes générations" (mode basique) + "Mes biens" (mode marchand)
- Les crédits sont partagés entre les deux modes
- Pas de re-onboarding — le mode marchand est une extension, pas un remplacement

**Recommandation UX** : ajouter un banner contextuel dans le parcours basique pour les utilisateurs détectés comme marchands (via profil ou comportement) : "Vous êtes marchand de biens ? Essayez le mode Dossier complet →"

---

## Tests UX — Flow marchand

| Test | Critère de succès | Statut |
|---|---|---|
| Parcours persona : Thomas peut créer un dossier complet sans aide | De l'upload au PDF partageable en < 15 min, sans contacter le support | ✅ Couvert par le flow |
| Parcours sans plan : Thomas peut continuer sans plan | L'option "Je n'ai pas de plan" est visible et mène à un parcours complet | ✅ EC-2 documenté |
| Charge cognitive : ≤ 3 actions principales par écran | Chaque étape a 1 action primaire claire (Continuer, Associer, Payer) | ✅ Vérifié par écran |
| Time-to-value : < 15 min (B2B complexe justifié) | Aha moment N°2 atteint en ~12 min | ✅ Calculé |
| Edge case : génération interrompue | Thomas retrouve ses résultats sans re-générer, crédit non perdu | ✅ EC-5 documenté |
| Edge case : paiement refusé | Parcours sauvegardé, Thomas peut reprendre et payer plus tard | ✅ EC-6 documenté |
| Edge case : pièce sans photo | Non-bloquant, continuable, solution claire proposée | ✅ EC-3 documenté |
| Mobile : Thomas peut uploader depuis l'appareil photo iOS | Bouton "Prendre une photo" disponible à l'étape 1 | ✅ Spécifié |
| Accessibilité WCAG 2.2 AA | Focus-ring visible, touch targets ≥ 44px, nav clavier complète | ⚠ À valider à l'implémentation |
| Retour en arrière : disponible jusqu'à l'étape 6 | Bouton "Retour" présent étapes 1-5, remplacé par "Tableau de bord" étape 6 | ✅ Documenté |

### Audit heuristique Nielsen (10 heuristiques)

| # | Heuristique | Évaluation | Statut |
|---|---|---|---|
| H1 | Visibilité état système | Progress bar 7 étapes + statut par pièce en génération + indicateurs passe 1/passe 2 | PASS |
| H2 | Correspondance monde réel | Vocabulaire Thomas : "bien", "lot", "dossier acquéreur", "pré-commercialisation" — pas "projet" ou "session" | PASS |
| H3 | Contrôle et liberté | Retour libre jusqu'à étape 5 ; session recovery si fermeture onglet | PASS |
| H4 | Cohérence et standards | Bouton "Continuer" toujours en bas droite ; "Retour" toujours en bas gauche | PASS |
| H5 | Prévention des erreurs | Pièces sans photo signalées avant paiement ; confirmation avant suppression de pièce | PASS |
| H6 | Reconnaissance > rappel | Noms de pièces affichés en permanence ; style sélectionné affiché dans le récap étape 6 | PASS |
| H7 | Flexibilité | Raccourci "Ignorer toutes les recommandations" (étape 5) ; style différent par lot (option avancée) | PASS |
| H8 | Design minimaliste | Chaque étape a 1 objectif unique ; pas de menu latéral, pas de notifications pendant la tâche | PASS |
| H9 | Aide correction erreurs | Erreurs formulation positive avec solution ("Plan illisible — voici comment continuer") | PASS |
| H10 | Aide et documentation | 3 tooltips contextuels first-time ; aucune page FAQ à quitter | PASS |

---

## Métriques HEART

| Dimension | Signal observable | Métrique | Cible | Méthode de mesure |
|---|---|---|---|---|
| **Happiness** | Thomas partage le dossier PDF dès l'étape 7 | Taux de partage immédiat (< 5 min après génération) | >= 60% | Event analytics : "pdf_shared" < 300s après "pdf_generated" |
| **Engagement** | Thomas revient pour un 2e bien dans les 7 jours | Biens créés par utilisateur actif par mois | >= 2 biens/mois | DB : count biens par user_id sur 30 jours glissants |
| **Adoption** | Inscription → premier dossier PDF généré | Taux d'activation (inscription → PDF livré) | >= 50% | Funnel : signup → bien_created → pdf_generated |
| **Retention** | Thomas revient chaque mois (abonné Pro) | Rétention M1, M3 abonnés Pro | M1 >= 80%, M3 >= 60% | Stripe churn + DB sessions |
| **Task success** | Thomas complète le parcours 7 étapes sans abandon | Taux de complétion upload → PDF | >= 75% | Funnel par étape : drop-off par étape documenté |

**Métrique HEART primaire** : Task success (taux de complétion du parcours 7 étapes). Ce flow est long et complexe — le drop-off par étape est la métrique diagnostique centrale.

---

## Agents spécialisés recommandés

| Agent proposé | Type | Rôle | Justification | Priorité |
|---|---|---|---|---|
| @testeur-thomas | Testeur persona | Simuler le comportement de Thomas sur chaque écran du flow : vocabulaire compris ? actions intuitives ? objections couvertes ? | Thomas est un profil non-tech (Canva, WhatsApp) — chaque friction détectée par l'agent évite un abandon | Haute |
| @testeur-acquereur | Testeur client-du-persona | Évaluer le dossier PDF livré : est-ce qu'un acquéreur potentiel se projette ? fait confiance ? contacte Thomas ? | Le livrable final (PDF) est consommé par les acquéreurs, pas par Thomas — qualité du dossier = KPI de rétention Thomas | Haute |
| @expert-pdf-immobilier | Expert parcours métier | Valider que le contenu et la structure du dossier PDF sont conformes aux standards de la profession (mentions légales, disclaimer home staging, structure plaquette) | Le dossier est utilisé dans un contexte légal et commercial — un manque de professionnalisme compromet l'adoption | Moyenne |

→ Handoff @agent-factory : créer ces agents à partir des specs ci-dessus.

---

---

**Handoff → @design**

Fichiers produits :
- `/home/user/Architecture/docs/marchand-pivot/ux/user-flows.md`

Décisions prises :
- Parcours en 7 étapes avec stepper visible — chaque étape a un objectif unique
- Paiement positionné après validation plan/photos (étape 3), avant qualification (étape 4) — ancrage psychologique fort
- Deux aha moments : recommandations architecte (étape 5, ~10 min) + premier visuel (étape 6, ~12 min)
- Parcours sans plan = first-class experience (40% des cas estimés)
- Mobile-first : étape 1 avec accès direct appareil photo iOS, boutons sticky en bas, grille 1 colonne
- Sauvegarde automatique à chaque étape — pas de perte de données si interruption
- Gestion asynchrone de la génération : continue côté serveur même si Thomas ferme l'onglet

Points d'attention pour @design :
- Étape 3 (association photos/pièces) : composant le plus complexe — wireframe à détailler (swipe mobile, drag & drop desktop)
- Étape 5 (recommandations) : cartes "architècte IA" doivent avoir un design distinctif (pas des simples cards) pour créer la surprise
- Étape 6 (génération) : loading state par pièce avec indicateur passe 1 / passe 2 — animation à concevoir
- Étape 7 (partage) : bouton WhatsApp proéminent sur mobile (premier vecteur de partage pour Thomas)
- Palette et typographie : cohérentes avec le design system Versimo existant (#FAFAF8, #1C1C1E, Sage #7D9B76, Inter)
- Accessibilité : focus-ring, touch targets ≥ 44px, navigation clavier complète — à valider en implémentation
