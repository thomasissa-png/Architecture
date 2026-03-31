# Optimisation des titres d'annonces — Versimo

## 1. Audit du format actuel

**Format généré** : `Appartement 60 m² — Rue Henri Barbusse, Le Mans`

**Code source** : `getDossierTitle()` dans `lib/dossier.ts` + logique identique dans `app/api/annonce/route.ts` (ligne 77-101). Les deux fonctions sont des templates statiques : `[Type] [Surface] m² — [Adresse], [Ville]`.

### Verdict

| Critère | Note | Problème |
|---|---|---|
| Factuel | 8/10 | Correct — type, surface, adresse |
| Vendeur | 3/10 | Aucun atout, aucune accroche, ton administratif |
| Comparable SeLoger | 4/10 | SeLoger affiche toujours nb pièces + atout ou contexte quartier |
| Lisible mobile (Marc) | 6/10 | Trop long sur iPhone — l'adresse complète pousse le reste hors écran |
| Crédible pro (Thomas) | 5/10 | Neutre — pas honteux, pas impressionnant non plus |

**Problème central** : le format actuel est un label d'inventaire, pas un titre commercial. Il répond à "c'est quoi ?" mais pas à "pourquoi je clique ?". Marc n'a aucune raison de s'arrêter dessus. Thomas envoie quelque chose qui ressemble à une fiche cadastrale.

**Données disponibles mais non exploitées** : `nb_pieces`, `prix_moyen_m2`, `description_commerciale`. La DB stocke ces champs — le titre les ignore.

---

## 2. Cinq formats alternatifs

### Format A — Type + Pièces + Atout contextuel
**Template** : `T{pieces} {surface} m² {atout} — {quartier_ou_rue}, {ville}`
**Exemple** : `T3 60 m² lumineux — Henri Barbusse, Le Mans`
**Règle** : l'atout est une donnée encodée à la création du dossier (exposition, état, potentiel).
- Thomas : **8/10** — Standard portail immo, immédiatement lisible par les acquéreurs
- Marc : **7/10** — Le T3 et "lumineux" lui donnent deux raisons de lire la suite

### Format B — Pills style (sans tiret, séparateurs points)
**Template** : `{surface} m² · {pieces} pièces · {ville} {arrondissement_ou_quartier}`
**Exemple** : `60 m² · 3 pièces · Le Mans Centre`
**Règle** : ville seule si pas de quartier. Jamais l'adresse complète.
- Thomas : **6/10** — Moderne, mais déroutant pour les portails habitués au format classique
- Marc : **8/10** — Scannable sur iPhone, chaque info est une unité distincte

### Format C — Potentiel de valorisation
**Template** : `{Type} {pieces} pièces à {état} — {quartier}, {ville} ({cp})`
**Exemple** : `Appartement 3 pièces à rénover — Chartrons, Bordeaux (33300)`
**Règle** : état choisi parmi : "rénover", "rafraîchir", "optimiser", "valoriser". Le code postal ancre le marché.
- Thomas : **9/10** — Vocabulaire marchand de biens natif, positionne le prix vs le potentiel
- Marc : **5/10** — "à rénover" peut freiner sauf si le prix est clairement en-dessous du marché

### Format D — Ancrage prix marché
**Template** : `T{pieces} {surface} m² — {quartier}, {ville} · {delta_marche}`
**Exemple** : `T3 60 m² — Chartrons, Bordeaux · -8% marché`
**Règle** : delta calculé depuis `prix_moyen_m2` en DB vs `bien_prix/bien_surface`. Uniquement si le bien est en-dessous du marché (ne jamais afficher "au-dessus du marché").
- Thomas : **7/10** — Accroche commerciale forte, mais uniquement utilisable si prix compétitif
- Marc : **9/10** — C'est exactement ce qu'il calcule mentalement de toute façon — lui donner en titre = conversion

### Format E — Accroche qualité (sans atout sujet à discussion)
**Template** : `{Type} {pieces} pièces · {surface} m² · {ville} {quartier}`
**Exemple** : `Appartement 3 pièces · 60 m² · Le Mans Éperon`
**Règle** : pas d'adjectif, pas de jugement. Le quartier remplace la rue.
- Thomas : **7/10** — Sobre et pro, pas de promesse non tenue
- Marc : **6/10** — Factuel mais sans accroche — ne se différencie pas dans une liste de 10 annonces

---

## 3. Format recommandé

**Format A** — `T{pieces} {surface} m² {atout} — {quartier}, {ville}`

**Pourquoi ce format gagne** :
- Standard portail immo reconnu (SeLoger, LeBonCoin l'utilisent tous) — Thomas n'a rien à expliquer
- Le Tx est la notation universelle en France : T3, T4 sont les premiers termes de recherche sur SeLoger
- L'atout ("lumineux", "traversant", "dernier étage") est conditionnel — s'il n'est pas renseigné, le format se dégrade gracieusement en `T3 60 m² — Henri Barbusse, Le Mans` (format actuel amélioré avec le Tx)
- Le quartier remplace l'adresse complète : plus court sur mobile, plus orienté valeur
- Longueur cible : 50-65 caractères — dans la limite des 80 caractères portail

**Dégradation si données manquantes** :
- Pas de `nb_pieces` → `Appartement 60 m² — quartier, ville` (format actuel)
- Pas d'atout → `T3 60 m² — quartier, ville`
- Pas de quartier → `T3 60 m² — ville`

---

## 4. Prompt GPT pour génération de titre

À utiliser si on souhaite générer un titre enrichi via GPT-4.1-mini à partir des données du dossier.

```
Tu es un rédacteur d'annonces immobilières français. Génère un titre d'annonce court et vendeur.

Règles strictes :
- Format : T{pieces} {surface} m² {atout_optionnel} — {quartier_ou_rue_courte}, {ville}
- Maximum 75 caractères
- L'atout doit être factuel (issu des données fournies), pas un superlatif inventé
- Si aucun atout factuel n'est disponible, ne pas en mettre
- Utiliser "Tz" (T2, T3, T4) pas "appartement X pièces"
- Le quartier est préféré à l'adresse complète

Données du bien :
- Type : {bien_type}
- Surface : {bien_surface} m²
- Nombre de pièces : {nb_pieces}
- Adresse : {bien_adresse}
- Ville : {ville}
- Code postal : {code_postal}
- État général : {etat} (vide = non renseigné)
- Atouts renseignés : {atouts} (vide = non renseignés)
- Prix moyen quartier : {prix_moyen_m2} €/m²
- Prix demandé : {bien_prix} €

Réponds uniquement avec le titre, sans guillemets, sans explication.
```

**Condition d'usage** : déclencher uniquement si `nb_pieces` OU des atouts sont renseignés — sinon le template statique Format A suffit. Coût : ~$0.001/appel GPT-4.1-mini, latence <1s.

---

## Hypothèses à valider

- [HYPOTHESE : les atouts ("lumineux", "traversant", etc.) nécessitent un champ dédié dans le formulaire de création de dossier — à valider avec @fullstack sur la faisabilité UX]
- [HYPOTHESE : "quartier" = extraction du geocoding existant (`ville` field) ou via API geocodage — à confirmer]
```

---

**Handoff — @fullstack**
- Fichier produit : `/home/user/Architecture/docs/strategy/title-optimization.md`
- Décisions prises : Format A recommandé (`T{pieces} {surface} m² {atout} — {quartier}, {ville}`). Dégradation gracieuse si données manquantes. Prompt GPT-4.1-mini fourni pour enrichissement conditionnel.
- Points d'attention pour la suite :
  - `getDossierTitle()` dans `lib/dossier.ts` et la logique identique dans `app/api/annonce/route.ts` doivent être alignées sur le Format A — le champ `nb_pieces` est déjà en DB, il manque juste son injection dans le titre
  - Un champ "atout" (exposition, état, potentiel) à ajouter dans le formulaire de création de dossier pour activer la partie la plus vendeuse du format
  - Le quartier peut être extrait du geocoding existant ou simplement prendre `ville` si pas de donnée quartier — à trancher lors de l'implémentation
