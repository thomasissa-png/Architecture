# Re-audit Acheteur — Dossier PDF + Page Web — V3 — 2026-03-27

**Persona** : Marc Leroy, 38 ans, iPhone 14 Pro.
**Corrections auditées V3** : R2 tel cliquable PDF / R3 prix/m² auto / R4 OG image sur /dossier/

---

## Verdict rapide

**OUI pour la page web. PEUT-ETRE pour le PDF.** La page `/dossier/` atteint le niveau SeLoger sur les infos marché : prix/m² calculé automatiquement, analyse comparative avec écart %, OG image qui s'affiche sur WhatsApp. Le PDF progresse (tel cliquable iOS 16+) mais le format A4 paysage reste la friction non résolue sur iPhone.

---

## Tableau V1 / V2 / V3

| # | Critere | V1 | V2 | V3 | Delta V2→V3 | Justification V3 |
|---|---------|----|----|-----|-------------|-----------------|
| 1 | Premiere impression | 6 | 7 | 7 | = | Inchangé. Hero 16/9 full-width sur page web, couverture PDF correcte |
| 2 | Qualite des visuels | 7 | 7 | 7 | = | Qualité IA inchangée, format avant/apres intact |
| 3 | Informations essentielles | 5 | 7 | 9 | +2 | Prix/m² du bien calculé auto (bien_prix / bien_surface) + section "Analyse du marché" 3 colonnes : prix bien, prix quartier, écart %. Marc n'a plus à calculer mentalement |
| 4 | Projection dans les pieces | 7 | 7 | 7 | = | Structure avant/apres par pièce inchangée |
| 5 | Organisation par piece | 7 | 7 | 7 | = | Pas de sommaire ajouté — acceptable sur 3-5 pièces |
| 6 | Contact vendeur | 3 | 7 | 8 | +1 | PDF : tel cliquable via annotation URI tel: (lignes 564-571 route.ts) — iOS 16+ Aperçu/Chrome activent le lien. Page web : ContactSticky inchangé. Friction résiduelle : le lien tel: ne fonctionne que dans les lecteurs PDF modernes, pas Adobe Reader natif iOS |
| 7 | Partage conjoint(e) | 6 | 7 | 9 | +2 | OG image explicite dans generateMetadata (lignes 60-61 page.tsx) — WhatsApp affiche maintenant la photo hero meublée en preview. La conjointe voit une vraie image avant d'ouvrir le lien |
| 8 | Mobile iPhone | 4 | 6 | 6 | = | A4 paysage toujours pas en format portrait. Le tel cliquable améliore l'expérience PDF mais le zoom reste obligatoire pour lire le texte 11pt |
| 9 | Confiance / credibilite | 7 | 8 | 8 | = | Disclaimer IA intact, DPE badge présent. Aucune régression |
| 10 | Rapidite de decision | 5 | 7 | 8 | +1 | Page web : Marc voit hero → prix → €/m² → écart marché → appeler. 5 informations clés en moins de 20s. L'écart "−8% sous le marché" en vert sage déclenche l'appel. PDF : tel cliquable si lecteur compatible |

**Moyenne V1** : 5.7 / 10
**Moyenne V2** : 7.0 / 10
**Moyenne V3** : 7.6 / 10
**Delta V2→V3** : +0.6 pt

---

## Les 3 questions fondamentales

| Question | V1 | V2 | V3 |
|----------|----|----|----|
| Ca a l'air PRO ? | 7 | 8 | 8 |
| C'est COHERENT ? | 7 | 8 | 9 |
| Ca me fait APPELER ? | 2 | 7 | 8 |

---

## Ce qui fonctionne en V3

- **Analyse du marché 3 colonnes** : prix/m² bien / prix quartier / écart % en vert ou orange. Marc comprend immédiatement si le bien est une bonne affaire sans ouvrir SeLoger dans un autre onglet.
- **Pill prix/m² auto calculée** : même sans prix_moyen_m2 renseigné par Thomas, le ratio apparaît. Marc a toujours son indicateur clé.
- **OG image WhatsApp** : la conjointe reçoit le lien et voit la photo meublée — pas juste un URL texte. Taux d'ouverture couple significativement amélioré.
- **Tel cliquable PDF iOS 16+** : annotation URI tel: correctement implémentée avec addLinkAnnotation() — le rectangle couvre exactement la zone du numéro (telTextWidth × 18pt).

---

## Corrections résiduelles pour franchir 9.5/10

**Seuil actuel** : 7.6/10. Il manque 1.9 pt. Deux corrections permettent d'y arriver.

**CR1 — PDF portrait pour iPhone (critique, +1.2 pt potentiel, critères 1+8+10)**
C'est le seul problème structurel non résolu. A4 paysage sur iPhone 14 Pro = zoom obligatoire à 80% pour lire le texte. Marc lit le PDF en portrait — il voit une page écrasée. Correction : ajouter `?format=portrait` à l'endpoint `/api/dossier/[uuid]/pdf`. En portrait (595×842pt) : hero pleine largeur 320pt de haut, infos en dessous à 12pt, avant (haut) / après (bas) empilés sur les pages pièces. Thomas choisit le format via un paramètre optionnel — paysage pour impression, portrait pour WhatsApp.

**CR2 — Fallback OG image pour les dossiers sans photo complétée (moyenne, +0.3 pt, critère 7)**
`ogImages` est `undefined` si `heroPhoto` est null (dossier en cours de génération ou partiel). WhatsApp affiche alors une preview texte sans image. Correction : ajouter une image OG par défaut Versiroom (`/og-default.jpg`) quand `heroPhoto` est absent. Marc et sa conjointe voient toujours une preview visuelle.

**CR3 — Analyse du marché masquée si bien_prix ET bien_surface absents (basse, +0.2 pt, critère 3)**
La section "Analyse du marché" n'apparaît que si `bien_prix && bien_surface > 0` (ligne 278). Si Thomas n'a pas encore renseigné le prix, la section disparaît entièrement — Marc voit "Prix sur demande" sans aucun contexte marché. Correction : afficher la section avec uniquement `prix_moyen_m2` du quartier si disponible, même sans prix du bien.
