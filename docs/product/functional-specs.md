# Specs Fonctionnelles — VisiRénov
## Version 1.0 — 2026-03-24

---

## 0. Contexte & Benchmark concurrentiel

### Benchmark concurrentiel (source : recherche web 2026-03-24)

| Concurrent | Modèle | Prix entrée | Crédits inclus | Prix/image | Points forts | Points faibles |
|---|---|---|---|---|---|---|
| REimagineHome | Abonnement | 14$/mois | Variable | ~0,01-0,05$ | 1,5M users, shoppable designs | Résultats génériques, pas de pipeline 2 passes |
| HomeDesigns AI | Abonnement | 27$/mois | 1000 designs | ~0,03$ | Extérieur inclus, Furniture Finder | Style CGI perceptible |
| AI HomeDesign | Abonnement | 19$/mois | 30 photos | ~0,63$/photo | Workflow listing complet | Pas de vrai staging meublé, outil retouche |
| Virtual Staging AI | Abonnement | 16$/mois | 6 photos | ~2,67$/photo | Simplicité | Volume très limité, qualité moyenne |

### Positionnement VisiRénov

- **Différence clé** : Pipeline 2 passes (surfaces → mobilier) = cohérence architecturale que les concurrents n'ont pas. Styles adaptés au marché français (Haussmannien, Méditerranéen, Wabi-Sabi).
- **Modèle** : Packages crédits (one-shot, sans engagement) vs abonnements mensuels des concurrents. Adapté aux pros qui ont des pics de besoin (Thomas : 8-12 opérations/an) et aux particuliers (Léa : 1 appartement).
- **Prix cible** : 0,80-1,50€/génération selon package. Soit 2-5x moins cher qu'un home stager humain (13-500€/image) pour une qualité architecte-grade.
- **North Star** : 3 000€/mois de marge nette.

---

## F1 — Itération commentaire

Re-génération passe 2 uniquement après commentaire utilisateur. 1-3 itérations/package.

### F1.1 User Stories
### F1.2 Wireframes ASCII
### F1.3 Règles métier
### F1.4 Edge cases
### F1.5 Events tracking
### F1.6 Dépendances
### F1.7 Performance

---

## F2 — Type de pièce

Sélecteur de pièce (8 types) enrichissant le prompt de génération.

### F2.1 User Stories
### F2.2 Wireframes ASCII
### F2.3 Règles métier
### F2.4 Edge cases
### F2.5 Events tracking
### F2.6 Dépendances
### F2.7 Performance

---

## F3 — Extérieur

Terrasse, balcon, patio, jardin, rooftop. Pipeline sans plafond. Mobilier outdoor.

### F3.1 User Stories
### F3.2 Wireframes ASCII
### F3.3 Règles métier
### F3.4 Edge cases
### F3.5 Events tracking
### F3.6 Dépendances
### F3.7 Performance

---

## F4 — Mode marchand

Upload bien complet → dossier pré-commercialisation PDF + lien partageable. Max 15 photos.

### F4.1 User Stories
### F4.2 Wireframes ASCII
### F4.3 Règles métier
### F4.4 Edge cases
### F4.5 Events tracking
### F4.6 Dépendances
### F4.7 Performance

---

## F5 — Mode décorateur

Produits réels (IKEA, Leroy Merlin). Shopping list avec prix/liens. Export PDF/web.

### F5.1 User Stories
### F5.2 Wireframes ASCII
### F5.3 Règles métier
### F5.4 Edge cases
### F5.5 Events tracking
### F5.6 Dépendances
### F5.7 Performance

---

## 6. Matrice des dépendances

Tableau F1-F5 × composants techniques.

---

## 7. Packages crédits

4 tiers. Simulation 3 000€/mois marge nette.
