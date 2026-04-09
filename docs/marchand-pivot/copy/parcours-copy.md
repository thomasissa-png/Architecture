# Copy — Parcours Marchand de Biens
**Date** : 2026-04-09 | **Agent** : @copywriter | **Persona** : Thomas Berger, 35 ans, marchand de biens, Bordeaux
**Framework** : FAB (Feature → Advantage → Benefit) sur les CTA de conversion ; PAS sur les états d'erreur
**Niveau de conscience** : Solution-Aware — Thomas sait qu'il a besoin de visuels, il ne connaît pas encore Versimo

> Ton : vouvoiement sobre. Vocabulaire Thomas : "bien", "lot", "acquéreur", "dossier", "visuel". Zéro superlatif, zéro "magique", zéro "révolutionnaire".

---

## Étape 1 — Création projet (Upload plan + photos)

| Élément | Texte FR |
|---|---|
| Titre page | Nouveau dossier |
| Sous-titre | Déposez le plan et les photos du bien. L'IA extrait les pièces et prépare la structure du dossier. |
| Label champ — Nom du bien | Référence ou adresse |
| Placeholder champ référence | Ex. : Immeuble Cours Victor Hugo — Lot 2 |
| Label zone plan | Plan du bien |
| Instructions zone plan | PDF ou image (JPG, PNG) — max 20 Mo |
| Label zone photos | Photos par pièce |
| Instructions zone photos | Jusqu'à 20 photos — JPG, PNG, HEIC — max 10 Mo chacune |
| Texte état vide zone plan | Déposez le plan ici ou cliquez pour sélectionner |
| Texte état vide zone photos | Déposez les photos ici ou cliquez pour sélectionner |
| Toast succès upload plan | Plan enregistré |
| Toast succès upload photos | {N} photo(s) enregistrée(s) |
| Récapitulatif avant paiement — Titre | Récapitulatif |
| Récapitulatif — Ligne bien | {Référence ou adresse} |
| Récapitulatif — Ligne photos | {N} photo(s) importée(s) |
| Texte prix | 99 € HT par bien — paiement unique, dossier HD inclus |
| CTA paiement | Valider et payer — 99 € HT |
| Message paiement en cours | Paiement en cours… |
| Erreur — format non supporté | Ce format n'est pas pris en charge. Déposez un fichier JPG, PNG, HEIC ou PDF (max 20 Mo). |
| Erreur — fichier trop lourd | Ce fichier dépasse la limite autorisée. Réduisez sa taille ou compressez-le avant de le déposer. |
| Erreur — aucune photo | Ajoutez au moins une photo avant de continuer. |
| Erreur — paiement refusé | Paiement non abouti. Vérifiez les informations de la carte ou utilisez un autre moyen de paiement. |
| Confirmation paiement | Paiement confirmé. La génération du dossier peut commencer. |

---

## Étape 2 — Extraction IA (Lecture du plan)

| Élément | Texte FR |
|---|---|
| Loading — message principal | Lecture du plan en cours… |
| Loading — message secondaire | L'IA identifie les pièces, les surfaces et les liaisons. Cela prend 30 à 60 secondes. |
| Titre résultat | Plan extrait — {N} pièce(s) détectée(s) |
| Sous-titre résultat | Vérifiez les pièces extraites. Vous pouvez renommer, corriger les surfaces ou supprimer une pièce avant de continuer. |
| Fallback — plan illisible (titre) | Le plan n'a pas pu être analysé |
| Fallback — plan illisible (explication) | La qualité ou la résolution du fichier est insuffisante pour l'extraction automatique. |
| Fallback — plan illisible (action) | Importez une version plus nette du plan, ou saisissez les pièces manuellement. |
| CTA fallback — ressaisie manuelle | Saisir les pièces manuellement |
| CTA fallback — réimporter | Importer un autre plan |
| CTA continuer | Valider et continuer |

---

## Étape 3 — Validation / Correction

| Élément | Texte FR |
|---|---|
| Titre page | Validation des pièces |
| Instruction | Vérifiez les pièces extraites. Associez chaque photo à la pièce correspondante. |
| Label colonne — Pièce | Pièce |
| Label colonne — Surface | Surface (m²) |
| Label colonne — Photo associée | Photo associée |
| Label colonne — Actions | Modifier / Supprimer |
| État pièce sans photo | Aucune photo associée |
| Instruction photo manquante | Associez une photo pour que cette pièce apparaisse dans le dossier. |
| CTA ajouter pièce | Ajouter une pièce |
| Placeholder nom pièce | Ex. : Séjour, Chambre 1, Cuisine |
| Placeholder surface | Surface en m² |
| Message auto-save | Enregistré |
| CTA valider | Valider les pièces — continuer |
| Erreur — pièce sans nom | Nommez cette pièce avant de continuer. |
| Erreur — surface invalide | Saisissez une valeur en m² (nombre entier ou décimal). |

---

## Étape 4 — Qualification du projet

| Élément | Texte FR |
|---|---|
| Titre page | Profil du bien |
| Sous-titre | Ces informations permettent de calibrer les visuels et les recommandations d'agencement selon le type d'acquéreur visé. |
| Label select — Cible acquéreur | Cible acquéreur |
| Options cible | Famille — Couple — Investisseur locatif — Primo-accédant — Non défini |
| Placeholder cible | Sélectionnez la cible |
| Label select — Style déco | Style d'ambiance |
| Options style | Contemporain — Scandinave — Haussmannien — Japandi — Mid-Century — Bohème — Art Déco — Industriel — Méditerranéen — Cosy — Wabi-Sabi — Maximaliste |
| Placeholder style | Sélectionnez un style |
| Note style | Vous pouvez choisir un style global ou un style différent par lot, à l'étape suivante. |
| Label select — Standing | Standing du bien |
| Options standing | Entrée de gamme — Intermédiaire — Premium — Grand luxe |
| Placeholder standing | Sélectionnez le standing |
| Label champ — Budget travaux | Budget travaux estimé (optionnel) |
| Placeholder budget | Ex. : 80 000 € |
| CTA continuer | Enregistrer et continuer |

---

## Étape 5 — Recommandations architecte IA

| Élément | Texte FR |
|---|---|
| Loading — message | Analyse des possibilités d'agencement… |
| Loading — message secondaire | L'IA examine les surfaces, les liaisons et le profil acquéreur. Cela prend 20 à 40 secondes. |
| Titre résultat | {N} recommandation(s) d'agencement |
| Sous-titre résultat | Validez les suggestions à intégrer au dossier ou ignorez celles qui ne correspondent pas au projet. |
| Label colonne — Lot / Pièce | Lot / Pièce |
| Label colonne — Recommandation | Recommandation |
| Label colonne — Impact | Impact estimé |
| Label colonne — Action | Intégrer / Ignorer |
| Texte vide — aucune recommandation | Aucune recommandation générée pour ce profil. La configuration des pièces et la cible sélectionnée ne suggèrent pas de réagencement significatif. |
| CTA — aucune reco, continuer | Passer à la génération des visuels |
| CTA générer avec sélection | Intégrer les recommandations sélectionnées — continuer |
| CTA tout ignorer | Ignorer et continuer |

---

## Étape 6 — Génération des visuels

| Élément | Texte FR |
|---|---|
| Loading — passe 1 (message principal) | Traitement des surfaces en cours… |
| Loading — passe 1 (détail) | L'IA applique les finitions — murs, sol, plafond, luminaire. |
| Loading — passe 2 (message principal) | Mise en scène du mobilier… |
| Loading — passe 2 (détail) | L'IA place le mobilier, les textiles et les accessoires selon le style sélectionné. |
| Compteur progression | {N done}/{N total} pièce(s) traitée(s) |
| Message — traitement parallèle | Les pièces sont traitées en parallèle. Les premiers visuels apparaissent dans quelques instants. |
| Titre — génération terminée | Dossier prêt — {N} visuel(s) généré(s) |
| Sous-titre terminé | Consultez les visuels avant/après, puis téléchargez ou partagez le dossier avec vos acquéreurs. |
| CTA voir dossier | Voir le dossier complet |
| Message — échec partiel | {N} pièce(s) n'ont pas pu être générées. Relancez leur traitement ou passez à l'étape suivante. |
| CTA relancer pièce | Relancer |

---

## Étape 7 — Dossier acquéreur (PDF + partage)

| Élément | Texte FR |
|---|---|
| Titre page | Dossier — {Référence bien} |
| Label section — Présentation | Présentation du bien |
| Label section — Plans | Plan de l'ensemble |
| Label section — Lots | Détail par lot |
| Label section — Visuels | Visuels avant / après mise en scène |
| Label section — Mentions légales | Mentions légales |
| Texte mentions légales | Les visuels présentés sont des simulations générées par intelligence artificielle. Ils ne constituent pas un engagement contractuel sur les finitions ou le mobilier livrés. |
| CTA télécharger PDF | Télécharger le dossier PDF |
| CTA télécharger ZIP | Télécharger les visuels HD (ZIP) |
| CTA — partage WhatsApp | Envoyer par WhatsApp |
| CTA — partage email | Envoyer par e-mail |
| CTA — lien sécurisé | Copier le lien acquéreur |
| Toast — lien copié | Lien copié |
| Sous-texte lien | Ce lien donne accès au dossier en lecture seule. Il expire dans 30 jours. |
| Toast — PDF téléchargé | Dossier téléchargé |
| Toast — ZIP téléchargé | Visuels HD téléchargés |
| CTA — nouveau dossier | Créer un nouveau dossier |
| CTA — retour dashboard | Retour à mes biens |

---

## Messages transversaux

| Contexte | Texte FR |
|---|---|
| Erreur API — génération IA | La génération n'a pas abouti. Réessayez dans quelques instants. Si le problème persiste, contactez le support. |
| Erreur API — extraction plan | L'analyse du plan a échoué. Vérifiez la qualité du fichier et réessayez. |
| Session expirée | Votre session a expiré. Reconnectez-vous pour retrouver vos dossiers en cours. |
| Paiement refusé | Paiement non abouti. Vérifiez les informations de la carte ou utilisez un autre moyen de paiement. |
| Paiement expiré (tentative > 30 min) | Ce lien de paiement a expiré. Relancez la création du dossier. |
| Toast — sauvegarde automatique | Enregistré automatiquement |
| Toast — modification enregistrée | Modification enregistrée |
| Toast — pièce supprimée | Pièce supprimée |
| Toast — pièce ajoutée | Pièce ajoutée |
| Toast — recommandation intégrée | Recommandation ajoutée au dossier |
| Toast — erreur réseau générique | Connexion interrompue. Vos données sont enregistrées — rechargez la page pour continuer. |
| Modale confirmation suppression bien | La suppression de ce dossier est définitive. Les visuels générés seront perdus. |
| CTA modale suppression — confirmer | Supprimer le dossier |
| CTA modale suppression — annuler | Annuler |
| État vide — dashboard sans bien | Aucun dossier en cours. Créez un nouveau dossier pour démarrer la pré-commercialisation d'un bien. |
| CTA état vide dashboard | Créer un dossier |

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/marchand-pivot/copy/parcours-copy.md`
- Décisions prises : vouvoiement sobre uniforme sur tout le parcours ; vocabulaire "bien / lot / acquéreur / dossier / visuel" systématique ; durées IA chiffrées ("30 à 60 secondes", "20 à 40 secondes") cohérentes avec les specs UX ; mentions légales visuels IA incluses à l'Étape 7 (disclaimer simulation) ; lien acquéreur limité à 30 jours en lecture seule ; prix affiché "99 € HT" avec précision HT conforme usage B2B
- Points d'attention : le compteur de progression Étape 6 doit dériver du nombre réel de pièces traitées (variable `{N done}/{N total}`) — ne pas afficher un index séquentiel si le traitement est parallèle (cf. REGLE LABELS POST-PARALLELISATION dans CLAUDE.md) ; les toasts de sauvegarde automatique doivent être silencieux (apparaître, disparaître sans action requise) ; le texte du lien acquéreur ("expire dans 30 jours") suppose une implémentation token côté API — à confirmer avec le back
