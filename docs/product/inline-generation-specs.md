# Specs — Génération inline sur fiche bien

**Auteur** : @product-manager
**Date** : 2026-03-25
**Statut** : Prêt pour implémentation

---

## 1. Problème actuel

Le bouton "Générer pour ce bien" (`/mes-biens/[id]`, ligne 822) est un `<a href="/?propertyId=...">` : il redirige Thomas vers la homepage et détruit son contexte (bien ouvert, photos déjà associées). Thomas doit recommencer depuis zéro dans un outil générique qui ignore son bien.

---

## 2. Solution recommandée

Ouvrir un panneau inline dans la fiche bien, sans navigation. Les photos associées au bien sont pré-chargées. Thomas choisit un style, lance, voit les résultats — sans quitter la page.

**Principe** : réutiliser `StylePicker` tel quel. Écrire un composant léger `InlineGenerator` qui orchestre le flow style → génération → résultats en s'appuyant sur les APIs existantes (`/api/generate`, `/api/properties/[id]/photos`).

**Choix délibéré** : ne pas monter `MerchantMode` complet. Ce composant contient l'étape "infos bien", l'étape "upload", la gestion de dossier batch, le polling multi-photos — tout ce que Thomas n'a pas besoin de refaire puisque ses photos sont déjà là.

---

## 3. UX flow

```
Fiche bien /mes-biens/[id]
│
├─ Section "Photos du bien" — Thomas voit ses N photos associées
│
├─ [Bouton] "Générer des visuels" → setShowGenerator(true)
│
└─ Panneau inline s'ouvre sous les photos (pas de modale, pas de navigation)
   │
   ├─ Étape 1 — Sélectionner les photos à générer
   │   Photos associées affichées avec checkbox. Toutes cochées par défaut.
   │
   ├─ Étape 2 — Choisir un style
   │   StylePicker existant (12 styles + custom). Choix global, pas par photo.
   │
   ├─ [Bouton] "Lancer la génération"
   │   Appel /api/generate pour chaque photo sélectionnée (Promise.allSettled, max 2 concurrent)
   │   Timer + estimation ("~90s par photo")
   │
   └─ Résultats en ligne
       Comparateur avant/après pour chaque photo générée (ImageComparator existant)
       Bouton "Associer les résultats à ce bien" → POST /api/properties/[id]/photos avec les photoIds générés
       Bouton "Fermer"
```

**Edge cases** :
- Aucune photo associée au bien → bouton "Générer" désactivé avec tooltip "Associez d'abord des photos à ce bien"
- Génération partielle (certaines photos échouent) → afficher les succès + message d'erreur par photo en échec avec bouton "Réessayer"
- Fermeture pendant génération → demander confirmation ("La génération est en cours, voulez-vous annuler ?")

---

## 4. Impact sur le code

### Composant à créer

**`components/InlineGenerator.tsx`**
Props : `propertyId: string`, `photos: UserPhoto[]`, `onClose: () => void`, `onPhotosGenerated: () => void`
Orchestration locale : état `step` (select | style | generating | results), sélection photos, appel API, polling résultats.
Utilise directement : `StylePicker` (import existant), `ImageComparator` (import existant).
N'a pas besoin de : `UploadZone`, `DossierProgress`, `DossierResult`, `MerchantMode`.

### Modifications dans `app/mes-biens/[id]/page.tsx`

- Remplacer le `<a href="/?propertyId=...">` (ligne 822-826) par un `<button onClick={() => setShowGenerator(true)}`
- Ajouter state `const [showGenerator, setShowGenerator] = useState(false)`
- Monter `<InlineGenerator>` sous la grille de photos quand `showGenerator === true`
- Après `onPhotosGenerated()` : appeler `fetchPhotos()` pour rafraîchir la grille

### API : aucune modification

`/api/generate` accepte déjà une image + style + surfacePrompt + furniturePrompt — pas de changement nécessaire.
`/api/properties/[id]/photos` (POST) existe pour associer des photos — réutilisé tel quel.

---

## 5. Effort estimé

| Tâche | Estimation |
|-------|-----------|
| `InlineGenerator.tsx` (composant + states + appel API) | 3-4h |
| Modification `page.tsx` (swap lien → bouton + montage composant) | 30min |
| Tests manuels (génération 1 photo, partielle, fermeture en cours) | 1h |
| **Total** | **~5h** |

Pas de modification d'API. Pas de nouveau endpoint. Réutilisation maximale des composants existants.

---

## 6. Ce qui change pour Thomas

**Avant** : "Générer pour ce bien" → redirection homepage → formulaire upload vide → perte du contexte → abandonne ou retélécharge ses photos.

**Après** : clic → panneau s'ouvre sur la même page → ses photos sont déjà là → il choisit un style → lance → voit les résultats meublés → les associe au bien en un clic → le dossier PDF peut être créé immédiatement après.

Gain mesuré : élimination d'une friction P0 sur le parcours Thomas (identifiée dans `docs/reviews/f4-audit-thomas.md`). Indicateur de suivi : taux de génération depuis fiche bien vs homepage (event `generation_started` avec `source: "inline_property" | "homepage"`).

---

**Handoff → @fullstack**
- Fichier produit : `/home/user/Architecture/docs/product/inline-generation-specs.md`
- Décisions prises : composant `InlineGenerator` léger (pas `MerchantMode` complet), zéro modification API, photos pré-sélectionnées par défaut, association résultats → bien en fin de flow
- Points d'attention : le `<a>` ligne 822 de `page.tsx` est le seul point de modification dans la fiche ; `StylePicker` et `ImageComparator` sont importés tels quels ; ajouter l'event analytics `generation_started` avec propriété `source` pour mesurer l'impact
