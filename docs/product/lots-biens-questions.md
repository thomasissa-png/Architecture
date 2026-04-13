# Questions fondateur — Feature "Définition des biens et lots"

**Date** : 2026-04-13 | **Agent** : @product-manager
**Contexte** : L'US-PM-08 actuelle couvre la découpe en lots pour les immeubles mais ne gère pas
(a) plusieurs biens par palier/étage et (b) les biens multi-étages (duplex, triplex).
Cette étape intermédiaire doit être spécifiée avant de modifier les specs.

---

## Q1 — Quels types de biens complexes Thomas rencontre-t-il réellement ? (priorité 1)

C'est la question racine. La réponse définit le scope exact.

**Option A** : Les deux cas (multi-biens par étage + duplex)
→ Spec la plus complète, UI la plus complexe (matrice 2D étage × bien)
→ Recommandée si Thomas traite régulièrement des immeubles haussmanniens (2 apparts/palier)

**Option B** : Multi-biens par étage uniquement (cas le plus fréquent)
→ 80% des cas marchands. Duplex = rare, gérable en "bien sur 2 étages consécutifs"
→ UI plus simple, modèle de données plus lisible

**Option C** : Duplex uniquement (le cas qui bloque le plus aujourd'hui)
→ À retenir si c'est ce que Thomas signale comme manquant

**Ma recommandation** : Option A si Thomas traite des immeubles entiers. Option B si son activité est surtout des immeubles à la découpe (2-4 lots). Demander : "Sur tes 8-12 opérations annuelles, combien sont des immeubles entiers avec plusieurs biens par palier ?"

---

## Q2 — L'IA doit-elle proposer une découpe automatique, ou Thomas la fait entièrement à la main ? (priorité 1)

**Option A** : L'IA propose une découpe, Thomas ajuste
→ GPT-4.1 vision détecte les "groupes naturels" de pièces (entrées séparées, cage d'escalier)
→ Plus rapide, plus d'erreurs possibles, nécessite un prompt de découpe robuste
→ Coût : 1 appel GPT vision supplémentaire par plan

**Option B** : Thomas définit entièrement les biens à la main (drag-and-drop ou cases à cocher)
→ Contrôle total, zéro hallucination, plus lent
→ Sur 6 lots avec 30 pièces : 5-10 min de saisie

**Option C** : L'IA détecte les étages, Thomas affecte les pièces aux biens dans chaque étage
→ Découpe à mi-chemin — l'IA fait le travail d'organisation verticale, Thomas fait l'horizontal

**Ma recommandation** : Option C. L'IA est fiable pour détecter les étages (structure verticale lisible sur un plan). La répartition horizontale (qui est dans quel appartement) est ambiguë sans numérotation explicite — laisser Thomas décider.

---

## Q3 — Comment un bien multi-étages (duplex) est-il représenté dans le modèle ? (priorité 2)

**Option A** : Un bien = une liste de pièces avec un champ `floor` par pièce
→ Modèle actuel (US-PM-07 a déjà `floor: integer`)
→ Un duplex = bien A avec pièces à l'étage 0 ET à l'étage 1
→ Zero refactoring du modèle de données

**Option B** : Un bien = une liste de plans (1 plan par étage), chaque plan contient ses pièces
→ Modèle plus fidèle à la réalité physique, nécessite un upload multi-plans
→ Complexité UI x2 : Thomas doit uploader un plan par niveau

**Option C** : Hors scope V1 — un bien = un seul étage, les duplex sont traités en 2 biens séparés
→ Solution de contournement acceptable à court terme si Thomas peut nommer "Duplex RDC" et "Duplex R+1"
→ Dossier PDF manuel à merger ensuite

**Ma recommandation** : Option A. Le champ `floor` est déjà dans le modèle. Un duplex se modélise naturellement sans refactoring. Option C comme fallback si Thomas n'a pas de duplex en production maintenant.

---

## Q4 — Comment le pricing est-il affecté ? (priorité 2)

Le modèle actuel : 99€/bien (ou crédit abonnement Pro débité par bien).
Avec des lots multiples, "par bien" devient ambigu.

**Option A** : 1 crédit = 1 lot (1 appartement) quel que soit le nombre de pièces
→ Le plus simple à comprendre. Un immeuble de 6 lots = 6 crédits.
→ Aligné avec la valeur perçue : Thomas vend 6 appartements, 6 dossiers

**Option B** : 1 crédit = 1 projet (l'immeuble entier), tous les lots inclus
→ Plus généreux, moins rentable. Risque : Thomas crée 1 "immeuble" pour 10 appartements
→ Acceptable si la cible sont les petits immeubles (2-4 lots)

**Option C** : 1 crédit = 1 pièce générée (comme Versimo standard)
→ Granularité maximale mais complexité de facturation élevée, imprévisible pour Thomas

**Ma recommandation** : Option A. Thomas raisonne en "dossiers à sortir" pas en pièces. Un dossier = un bien = un crédit. Simple à expliquer, aligné avec la valeur.

---

## Q5 — Quel est le nombre maximum de lots par projet en V1 ? (priorité 3)

Impacte directement les choix d'UI et les limites de rate limiting.

**Option A** : Max 4 lots (immeuble de rapport standard)
→ Cas 80% des marchands de biens. UI simple (4 colonnes, pas de scroll)

**Option B** : Max 12 lots (petit immeuble haussmannien, 3 étages x 2 biens/palier + commerces)
→ UI plus complexe (liste scrollable), mais couvre plus de cas

**Option C** : Pas de limite (immeuble de 30+ lots)
→ Hors scope V1 — risque de performances et d'UX dégradée

**Ma recommandation** : Option B. Limite à 12 en V1 avec un message "Vous avez un immeuble de plus de 12 lots ? Contactez-nous." pour qualifier les gros deals sans bloquer.

---

## Q6 — L'étape "Définition des biens" est-elle toujours affichée ou seulement si immeuble ? (priorité 3)

Actuellement US-PM-08 est conditionnelle (masquée si type_bien = "appartement").

**Option A** : Conditionnelle — apparaît uniquement si type_bien = "immeuble"
→ Parcours simple préservé pour Thomas qui traite un T3 seul
→ Risque : Thomas sélectionne "appartement" pour un duplex (erreur de type)

**Option B** : Toujours affichée, mais pré-remplie avec "1 bien = toutes les pièces" pour un appartement
→ Thomas comprend la structure même pour un bien simple
→ Peut créer de la confusion inutile sur les cas simples

**Option C** : Thomas choisit lui-même en étape 1 si son bien est "simple" ou "multi-lots"
→ Un checkbox "Ce bien contient plusieurs lots" dans le formulaire de création
→ Zero ambiguité, Thomas est responsable du choix

**Ma recommandation** : Option C. Ajouter un champ booléen `is_multi_lot` à l'étape 1 (US-PM-01). Si coché → l'étape de définition des biens s'active. Si non coché → parcours direct actuel. Plus explicite qu'une inférence sur type_bien.

---

## Q7 — L'interface de découpe est-elle un plan annoté cliquable ou un tableau texte ? (priorité 4)

**Option A** : Plan annoté — Thomas clique sur des zones du plan pour les assigner à un bien
→ UX idéale, effort de dev élevé (image map + zones dynamiques)
→ Nécessite que le plan soit lisible en miniature sur mobile

**Option B** : Tableau drag-and-drop — pièces à gauche, lots à droite, Thomas glisse les pièces
→ UX suffisante pour un usage desktop. Fonctionne sans plan visible
→ Recommandé pour V1

**Option C** : Tableau avec menu déroulant — chaque pièce a un sélecteur "Appartient au lot..."
→ Le plus simple à implémenter, fonctionne parfaitement sur mobile
→ Moins rapide que le drag-and-drop sur 10+ pièces

**Ma recommandation** : Option C pour V1 (rapidité de livraison, mobile-first). Option B si Thomas valide que la plupart de ses utilisations sont desktop.

---

## Q8 — Les noms des lots sont-ils libres ou imposés ? (priorité 4)

**Option A** : Noms libres (Thomas tape "Appart 3ème gauche", "T2 duplex", "Commerce RDC")
→ Flexibilité maximale, apparaît tel quel dans le PDF et l'URL de partage

**Option B** : Nomenclature imposée — "Lot 1", "Lot 2"... avec possibilité de renommer
→ Valeur par défaut cohérente, Thomas peut personnaliser

**Option C** : Nomenclature semi-automatique — l'IA propose un nom basé sur l'étage + le type détecté ("T3 - Étage 2", "Studio - RDC")
→ Gain de temps si la détection est bonne, risque de noms incorrects

**Ma recommandation** : Option B. Valeur par défaut "Lot 1, Lot 2..." + possibilité de renommer librement. L'Option C est un nice-to-have pour V2 si Thomas le demande.

---

## Tableau récapitulatif — Ce que tu dois décider

| # | Question | Options | Ma reco |
|---|---|---|---|
| Q1 | Types de biens complexes couverts | A/B/C | A ou B selon volume immeuble |
| Q2 | Découpe auto IA ou manuelle | A/B/C | C (IA étages, Thomas biens) |
| Q3 | Modèle duplex | A/B/C | A (champ floor existant) |
| Q4 | Pricing multi-lots | A/B/C | A (1 crédit = 1 lot) |
| Q5 | Nb max lots V1 | A/B/C | B (max 12) |
| Q6 | Étape toujours visible ? | A/B/C | C (checkbox is_multi_lot en étape 1) |
| Q7 | Interface découpe | A/B/C | C en V1, B si desktop majoritaire |
| Q8 | Nommage des lots | A/B/C | B (défaut "Lot N" + renommage libre) |

---

**Handoff → @product-manager**
Une fois les réponses fondateur reçues, produire la mise à jour de functional-specs.md :
- Modifier US-PM-01 (ajout champ `is_multi_lot`)
- Modifier US-PM-08 (refonte selon Q2, Q6, Q7, Q8)
- Ajouter US-PM-08b : Définir un bien multi-étages (si Q1 = Option A)
- Mettre à jour le modèle de données `lots` et `rooms` (Q3)
- Mettre à jour le Payload API US-PM-01 et US-PM-08 (Q4)
