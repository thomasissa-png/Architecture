# Specs — Découpe en biens/lots (Étape 3 du parcours marchand)

**Date** : 2026-04-13 | **Décisions fondateur** : voir `lots-biens-questions.md`

---

## Positionnement dans le parcours

```
1. Projet (upload)  →  2. Analyse (extraction IA)  →  3. Découpe en biens ★ NOUVEAU
→  4. Validation (pièces + photos)  →  5. Qualification  →  6. Recommandations
→  7. Visuels  →  8. Dossier PDF (1 par lot)
```

L'étape 3 est **toujours visible**, même pour un bien simple (pré-rempli "1 bien = toutes les pièces"). Thomas peut passer en 1 clic s'il n'a rien à changer.

---

## User Stories

### US-LOT-01 — Découpe automatique IA
**En tant que** Thomas, **je veux que** l'IA propose une répartition des pièces en lots **pour que** je n'aie pas à tout faire à la main.

Critères d'acceptation :
- L'IA analyse le plan et propose des lots (entrées séparées, cages d'escalier, numérotation)
- Fallback : si l'IA ne détecte qu'un seul lot → 1 lot = toutes les pièces de l'étage
- Fallback multi-étages sans détection : 1 lot = 1 étage
- La proposition IA est toujours modifiable par Thomas
- Temps de détection < 10s (appel GPT-4.1 vision supplémentaire)

### US-LOT-02 — Assignation visuelle sur le plan
**En tant que** Thomas, **je veux** cliquer sur une pièce du plan pour changer son lot **pour que** la découpe soit intuitive et visuelle.

Critères d'acceptation :
- Chaque lot a une couleur distincte (max 12 couleurs prédéfinies)
- Cliquer sur une pièce ouvre un sélecteur de lot (dropdown ou pill)
- Les pièces se colorent immédiatement selon le lot assigné
- Le plan reste zoomable/pannable pendant l'assignation
- Multi-sélection possible (shift+clic) pour assigner plusieurs pièces d'un coup
- Mobile : tap sur pièce → bottom sheet avec sélecteur de lot

### US-LOT-03 — Gestion des lots
**En tant que** Thomas, **je veux** créer, renommer et supprimer des lots **pour que** la structure corresponde à mon projet.

Critères d'acceptation :
- Noms par défaut : "Lot 1", "Lot 2", etc. (renommage libre)
- Bouton "Ajouter un lot" (pas de limite V1 — 1 projet = 1 adresse)
- Supprimer un lot : ses pièces passent en "non assigné"
- Les pièces non assignées sont visuellement distinctes (gris, pointillé)
- Liste des lots visible en sidebar (desktop) ou en header pills (mobile)

### US-LOT-04 — Bien multi-étages (duplex/triplex)
**En tant que** Thomas, **je veux** assigner des pièces de 2+ étages au même lot **pour que** les duplex soient correctement représentés.

Critères d'acceptation :
- Un lot peut contenir des pièces de différents `floor_index`
- Sur le plan, un indicateur "Lot X — Étages 0+1" apparaît si le lot couvre 2+ étages
- Le dossier PDF regroupe toutes les pièces du lot quel que soit l'étage
- Quand Thomas switch d'étage dans le plan, les pièces déjà assignées au lot actif sont visuellement marquées

### US-LOT-05 — Validation rapide (1 bien simple)
**En tant que** Thomas, **je veux** passer l'étape en 1 clic quand il n'y a qu'un seul bien **pour que** le parcours reste rapide.

Critères d'acceptation :
- Si l'IA détecte 1 seul lot → pré-rempli, CTA "Confirmer et continuer"
- Pas besoin de cliquer sur chaque pièce si tout est dans le même lot
- Le bouton "Confirmer" est visible sans scroller (above the fold)

### US-LOT-06 — Commerce RDC + appartements
**En tant que** Thomas, **je veux** que le RDC soit un lot "Commerce" et les étages des lots "Appartement" **pour que** le dossier reflète la réalité de l'immeuble.

Critères d'acceptation :
- Chaque lot a un type optionnel (Appartement, Commerce, Bureau, Parking) — valeur par défaut "Appartement"
- Le type influence le template du dossier PDF (ex: "Local commercial" au lieu de "Appartement")
- L'IA peut proposer "Commerce" si le RDC contient un grand espace ouvert sans chambre

---

## Modèle de données

Modifications minimales sur les tables existantes :

```sql
-- pro_lots : ajouter type + couleur
ALTER TABLE pro_lots ADD COLUMN lot_type VARCHAR(20) DEFAULT 'appartement';
-- Valeurs : appartement, commerce, bureau, parking, autre
ALTER TABLE pro_lots ADD COLUMN color VARCHAR(7);
-- Couleur hex pour l'affichage plan (#7D9B76, #6366F1, #F59E0B, etc.)
ALTER TABLE pro_lots ADD COLUMN sort_order INTEGER DEFAULT 0;

-- pro_rooms : lot_id + floor existent déjà, rien à changer
-- Un duplex = room.lot_id pointe vers le même lot, room.floor varie
```

---

## Écrans (description textuelle)

### Écran principal — Plan + sidebar lots (desktop)
- **Gauche (70%)** : PlanEditor avec pièces colorées par lot. Tap pièce → dropdown lot.
- **Droite (30%)** : Liste des lots avec nom, nb pièces, surface totale, couleur. Bouton "Ajouter un lot". Bouton "Renommer" sur chaque lot.
- **Bas** : CTA sticky "Confirmer et continuer" + "Retour"
- **Tabs étage** en haut du plan (comme existant)

### Écran mobile — Plan + bottom sheet
- **Haut** : Plan zoomable, pièces colorées
- **Milieu** : Pills scrollables des lots (Lot 1 | Lot 2 | + Ajouter)
- **Bottom sheet** : au tap sur une pièce, sheet avec nom + sélecteur lot + type
- **CTA sticky** en bas

### État initial (après extraction)
- Si IA a détecté des lots → pré-rempli avec couleurs
- Si 1 seul lot → message "Toutes les pièces sont dans un seul bien. Vous pouvez ajouter des lots si nécessaire."
- Les tabs d'étage sont visibles si multi-plans

---

## Prompt IA — Détection automatique des lots

Ajouté comme étape post-extraction dans `plan-extractor.ts` :

```
Analyze this floor plan. The rooms have already been extracted.
Based on the layout, identify SEPARATE RESIDENTIAL UNITS (lots/apartments):
- Look for separate entrances (each apartment has its own front door)
- Look for separate staircases or landings
- Look for unit numbers or labels on the plan
- A typical apartment has: entrance + kitchen + bathroom + bedroom(s)
- A commercial space has: large open area, no bedrooms, street-level access

Return a JSON array of lots, each with:
- lot_name: suggested name (e.g., "T3 gauche", "Commerce RDC")
- lot_type: "appartement" | "commerce" | "bureau" | "autre"
- room_ids: array of room temp_ids belonging to this lot

If you cannot determine separate units, return a single lot containing all rooms.
```

---

## Cas limites

| Cas | Comportement |
|-----|-------------|
| Studio (1 pièce + SDB) | 1 lot, étape passée en 1 clic |
| Duplex | Thomas assigne pièces étage 0 + étage 1 au même lot |
| Commerce RDC + apparts | IA propose "Commerce" pour le RDC, "Lot 1/2" pour les étages |
| Immeuble 6 lots, 3 étages | 2 lots/étage détectés par l'IA, Thomas ajuste |
| Plan illisible (0 lot détecté) | Fallback 1 lot = toutes les pièces, Thomas découpe manuellement |
| Triplex | Pièces sur 3 étages dans le même lot — supporté par le modèle |

---

**Handoff → @fullstack**
- Nouvelle page : `app/projet/[id]/decoupe/page.tsx`
- Modifier ProStepper : 8 étapes au lieu de 7
- Nouvel endpoint : `POST /api/pro/projects/[id]/lots/detect` (détection IA)
- Modifier : `PUT /api/pro/projects/[id]/lots` (sauvegarder la découpe)
- Modifier `getCompletedSteps()` dans `lib/constants.ts`
