# Benchmark annonce immobilière — Perspective Marc Leroy

> Produit par @orchestrator — 2026-03-25
> Sources : audits Marc V1-V3, persona enrichi, réglementation française

---

## 1. Ce que les meilleures annonces immo françaises contiennent

### Informations OBLIGATOIRES (réglementation française)

| Information | Obligation légale | Source |
|---|---|---|
| Prix de vente (FAI ou net vendeur) | Oui — loi Hoguet, arrêté du 10/01/2017 | Vendeur |
| Surface habitable (loi Carrez si copropriété) | Oui — loi Carrez 18/12/1996 | Diagnostiqueur |
| DPE — classe énergie (A-G) | Oui — depuis 01/01/2023, obligatoire sur toute annonce | Diagnostiqueur |
| DPE — estimation conso énergie (kWh/m²/an) | Oui — depuis 01/01/2023 | Diagnostiqueur |
| GES — classe émission gaz (A-G) | Oui — depuis 01/01/2023 | Diagnostiqueur |
| Mention "passoire thermique" si DPE F ou G | Oui — depuis 01/01/2023 | Auto |
| Localisation (ville) | Oui — arrêté du 10/01/2017 | Vendeur |
| Nombre de pièces principales | Oui | Vendeur |
| Montant charges copropriété annuelles | Oui si copropriété — loi ALUR | Syndic |
| Nombre de lots copropriété | Oui si copropriété — loi ALUR | Syndic |
| Procédures en cours copropriété | Oui si copropriété — loi ALUR | Syndic |

### Informations STANDARD (présentes sur SeLoger/LeBonCoin/Bien'ici)

| Information | Présence marché | Impact Marc |
|---|---|---|
| Photos HD (min 5-10) | 100% | CRITIQUE — pas de photo = pas de clic |
| Description commerciale | 98% | HAUTE — Marc scanne, ne lit pas en détail |
| Type de bien (appartement/maison) | 100% | CRITIQUE |
| Étage + ascenseur | 90% (si immeuble) | HAUTE — Marc a un enfant de 4 ans |
| Exposition (N/S/E/O) | 70% | MOYENNE |
| Année de construction | 60% | MOYENNE |
| Parking / cave / box | 85% | HAUTE — Bordeaux = voiture nécessaire |
| Taxe foncière | 40% | MOYENNE — Marc calcule le coût total |
| Carte du quartier | 80% (SeLoger/Bien'ici) | HAUTE |
| Prix/m² du quartier | 60% (MeilleursAgents, SeLoger) | HAUTE — Marc compare |
| Proximité transports | 50% | MOYENNE |

---

## 2. Ce que Versiroom a DÉJÀ

| Information | Statut | Source dans le code |
|---|---|---|
| Photos HD meublées | OK | user_photos.output_image_key |
| Photos avant/après | OK (dossier) / PARTIEL (annonce = après only) | DossierPublicView |
| Prix de vente | OK | properties.sale_price |
| Surface m² | OK | properties.surface_m2 |
| Nombre de pièces | OK | properties.room_count |
| Type de bien | OK | properties.property_type |
| Localisation (ville + code postal) | OK | properties.city, postal_code |
| Adresse | OK | properties.address_normalized |
| Description commerciale (GPT) | OK | properties.description_generated |
| Contact marchand (tel + email) | OK | merchant_profiles |
| Logo + branding marchand | OK | merchant_profiles |
| Prix/m² du quartier (DVF) | OK | properties.dvf_median_price_m2 |
| Carte du quartier (OSM) | OK (fiche bien) / MANQUANT (annonce) | mes-biens/[id] |
| Galerie par pièce | OK | room_type grouping |
| Lightbox plein écran | OK | Lightbox.tsx |
| Bouton appeler sticky | OK | ContactSticky.tsx |
| Partage WhatsApp | OK | ShareButtons.tsx |
| ZIP photos | OK | JSZip |
| Disclaimer IA positif | OK | "Projection d'aménagement" |

---

## 3. Ce qui MANQUE (classé par priorité)

### CRITIQUE — Légalement requis ou attendu par 90%+ des acheteurs

| Information | Impact Marc | Effort | Recommandation |
|---|---|---|---|
| **DPE classe énergie** | Marc refuse les F/G, vérifie systématiquement | Faible — champ select A-G dans fiche bien | Ajouter à properties + afficher sur annonce/dossier |
| **GES classe émission** | Obligatoire depuis 2023 | Faible — même pattern que DPE | Ajouter |
| **Charges copropriété** | Marc calcule le coût total mensuel | Faible — champ numérique | Ajouter à properties |

### HAUTE — Présent chez 70%+ des concurrents

| Information | Impact Marc | Effort | Recommandation |
|---|---|---|---|
| **Étage + ascenseur** | Marc a un enfant — 5e sans ascenseur = non | Faible — 2 champs (numérique + boolean) | Ajouter à properties |
| **Parking / cave / box** | Bordeaux = voiture | Faible — checkboxes | Ajouter à properties |
| **Année de construction** | Indice sur l'état général | Faible — champ numérique | Ajouter à properties |
| **Carte quartier sur l'annonce** | Déjà sur fiche bien, absent de l'annonce | Faible — réutiliser le composant carte existant | Ajouter sur page annonce |

### MOYENNE — Différenciateurs

| Information | Impact Marc | Effort | Recommandation |
|---|---|---|---|
| **Exposition** | Nice-to-have | Faible — select N/S/E/O | Ajouter à properties |
| **Taxe foncière** | Marc calcule le coût total | Faible — champ numérique | Ajouter à properties |
| **Nombre de lots copropriété** | Obligatoire si copro | Faible — champ numérique | Ajouter à properties |
| **Proximité transports** | Auto-calculable depuis l'adresse | Moyen — API transports | V2 |

---

## 4. Plan d'action

### Principe : enrichir la fiche bien, auto-afficher sur annonce/dossier

1. **Ajouter les champs à la table `properties`** : dpe_classe, ges_classe, etage, ascenseur, parking, cave, charges_copro_annuelles, annee_construction, exposition, taxe_fonciere, nb_lots_copro
2. **Ajouter les champs au formulaire fiche bien** (`/mes-biens/[id]`) : Thomas les remplit quand il les a
3. **Afficher automatiquement sur l'annonce** quand remplis, masquer proprement quand vides ("Non renseigné" ou masquer)
4. **Afficher dans le dossier PDF** quand remplis
5. **DPE obligatoire** : si DPE non renseigné, afficher un warning "DPE requis par la loi" sur la fiche bien (pas bloquant, mais visible)

### Ce qui est auto-calculable (pas besoin de Thomas)

- Prix/m² : déjà fait (sale_price / surface_m2)
- Prix/m² quartier : déjà fait (DVF)
- Carte du quartier : déjà fait sur fiche bien, à porter sur l'annonce
- Description : déjà fait (GPT-4.1)

---

## 5. Verdict

**Marc a 70% des informations nécessaires pour décider.** Les 30% manquants sont :
- DPE (légalement obligatoire — CRITIQUE)
- Étage/ascenseur/parking (standard du marché — HAUTE)
- Charges copropriété (obligatoire si copro — CRITIQUE)

**La bonne approche** : enrichir le formulaire de la fiche bien avec ces champs, laisser Thomas les remplir quand il les a, et les afficher automatiquement sur l'annonce/dossier. Ne jamais inventer — si Thomas n'a pas rempli, masquer proprement.
