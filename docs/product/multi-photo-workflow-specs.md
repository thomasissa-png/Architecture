# Specs — Multi-photo workflow : pièce + style par photo (Mode Marchand)

**Date** : 2026-03-25
**Persona** : Thomas Berger — marchand de biens, niveau tech moyen, priorité : rapidité + simplicité
**KPI North Star** : marge nette 3 000€/mois — cette feature réduit la friction qui bloque la conversion Pro
**Lien code** : `components/MerchantMode.tsx` — `PhotoEntry` a déjà `roomTypeId` et `styleOverride`. L'étape `review` existe dans le flow mais l'UI d'annotation est manquante.

---

## Problème

Thomas photographie un T3 (10 photos, 5 pièces différentes). Il veut un style différent par pièce. Aujourd'hui : soit un style global pour tout le bien, soit 5 sessions séparées. Les 2 options sont inacceptables pour un usage commercial en volume.

---

## Solution A — Annotation par photo (MVP rapide)

**User story** : En tant que Thomas, après avoir uploadé mes photos, je peux assigner une pièce et un style à chaque photo individuellement avant de lancer la génération.

**Concept** : L'étape `review` (déjà dans le flow) devient une grille d'annotation.

**UI** :
- Grille 2-3 colonnes sur desktop, 1 colonne sur mobile
- Chaque carte = thumbnail 120px + dropdown "Pièce" (Salon, Chambre, Cuisine, SDB, Bureau, Extérieur) + dropdown "Style" (les 12 styles + "Style global" par défaut)
- La valeur par défaut du dropdown Style = `globalStyle` sélectionné à l'étape précédente
- "Style global" = n'affiche pas un style, réutilise le global — Thomas n'est pas obligé de tout remplir
- CTA "Lancer la génération" en bas, désactivé si aucun style global défini

**Critères d'acceptance** :
- [ ] Chaque photo peut avoir un style différent du global
- [ ] Chaque photo peut avoir un type de pièce différent
- [ ] La valeur par défaut est "Style global" — zéro saisie obligatoire si Thomas veut tout en Scandinave
- [ ] Sur mobile : les 2 dropdowns empilés sous le thumbnail, accessibles sans zoom
- [ ] Edge case : si Thomas ne choisit aucun style global ET laisse une photo en "Style global" → bloquer avec message "Choisissez un style global ou un style pour chaque photo"

**Ce qui existe déjà dans le code** : `styleOverride: StyleOption | null` dans `PhotoEntry`, logique de merge dans `handleGenerate`. L'étape `review` est dans `MerchantStep`. L'UI de la grille est à créer.

**Effort estimé** : 1 jour dev — UI + logique de rendu des dropdowns dans l'étape `review`. Zéro changement backend.

---

## Solution B — Groupes par pièce avec style par groupe

**User story** : En tant que Thomas, je peux glisser mes photos dans des groupes "Salon", "Chambre 1", etc., puis choisir un style par groupe.

**Concept** : Avant la sélection de style, Thomas crée des groupes de pièces et y drag & drop ses photos.

**UI** :
- Étape intermédiaire entre "photos" et "style" : vue "Organiser par pièce"
- Thomas crée des groupes en cliquant "+ Ajouter une pièce" (nom libre ou dropdown prédéfini)
- Drag & drop des thumbnails dans les groupes
- Chaque groupe a son propre StylePicker (compact, version inline)
- Résumé avant génération : "Salon (3 photos) — Scandinave | Chambre (2 photos) — Contemporain"

**Critères d'acceptance** :
- [ ] Créer jusqu'à 8 groupes de pièces par dossier
- [ ] Une photo ne peut appartenir qu'à un seul groupe
- [ ] Photos non groupées : restent dans "Sans groupe" et héritent du style global
- [ ] Réorganisation possible : déplacer une photo d'un groupe à un autre
- [ ] Edge case mobile : drag & drop remplacé par un menu "Déplacer vers..." sur long press

**Effort estimé** : 3-4 jours dev — drag & drop (react-beautiful-dnd ou dnd-kit), gestion d'état des groupes, StylePicker par groupe, changements backend pour envoyer les groupes à l'API.

---

## Solution C — Détection automatique de la pièce + suggestion de style

**User story** : En tant que Thomas, je uploade mes photos et l'IA détecte automatiquement le type de chaque pièce et me suggère un style adapté. Je valide ou corrige en 2 clics.

**Concept** : À l'upload, chaque photo passe par GPT-4.1-mini vision pour détecter : type de pièce + confiance (ex. "salon — 92%"). Un style par défaut est pré-assigné par règle métier (salon → Scandinave si style global = Scandinave, cuisine → Contemporain systématiquement, SDB → Contemporain).

**UI** :
- Les thumbnails affichent un badge auto-généré "Salon" avec icône de confiance
- Thomas voit la grille pré-remplie (comme Solution A) et corrige les erreurs
- Indicateur de chargement par photo pendant la détection (<2s par photo avec GPT-4.1-mini)
- Option "Tout détecter en une fois" vs résultats au fil de l'eau

**Critères d'acceptance** :
- [ ] Détection lancée automatiquement après upload, non bloquante
- [ ] Si détection échoue (timeout, erreur) → fallback sur "Pièce non détectée", Thomas saisit manuellement
- [ ] Confiance <60% → badge "?" + invitation à corriger
- [ ] Coût : ~$0.002 par photo (vision GPT-4.1-mini) — à tracker dans les logs
- [ ] Edge case : photo ambiguë (couloir ouvert sur salon) → proposer les 2 options

**Effort estimé** : 5-7 jours dev — endpoint `/api/detect-room`, intégration vision GPT-4.1-mini, UI badges + états de chargement, gestion des cas d'échec, tests de précision sur 50 photos terrain.

---

## Recommandation — Implémenter A maintenant

**Pourquoi A et pas B ou C** :

1. **La structure de données existe déjà.** `styleOverride` et `roomTypeId` sont dans `PhotoEntry`. L'étape `review` est dans le flow. C'est 1 jour de travail pour débloquer le cas d'usage principal de Thomas.

2. **Thomas est niveau tech moyen.** Le drag & drop (B) ajoute une interaction qu'il n'utilise pas dans Canva ou SeLoger. Les dropdowns (A) sont universels et ne nécessitent aucune formation.

3. **La détection auto (C) est un gain marginal.** Thomas sait exactement ce qu'il a photographié — il n'a pas besoin que l'IA lui dise que c'est un salon. Le temps de détection (~10s pour 15 photos) est une friction supplémentaire, pas un gain.

4. **"Style global" comme défaut = zéro régression.** Si Thomas veut tout en Scandinave, il ne touche à rien. La Solution A n'impose pas de saisie supplémentaire pour le cas simple.

**Chemin de migration** : A → B si des retours utilisateurs montrent que Thomas préfère organiser par groupe plutôt que photo par photo. C → horizon 2 roadmap, une fois que A est validé et que des logs de détection permettent de mesurer la précision.

**Score RICE Solution A** :
- Reach : 100% des utilisateurs Mode Marchand
- Impact : 4/5 — débloque le use case T3/T4 en une session (vs 5 sessions aujourd'hui)
- Confidence : 5/5 — structure de données déjà en place, effort minimal, zéro dépendance backend
- Effort : 1 jour

---

**Hypothèses à valider** :
- [HYPOTHESE : Thomas préfère des dropdowns par photo plutôt qu'une organisation par groupe — à confirmer par 3 interviews utilisateurs avant Solution B]
- [HYPOTHESE : Le style global "Contemporain" pour cuisine/SDB est implicite — une règle d'affectation automatique par type de pièce pourrait accélérer Solution C]

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/product/multi-photo-workflow-specs.md`
- Décisions prises : Solution A (annotation par photo) à implémenter en priorité — 1 jour dev estimé
- Points d'attention :
  - `PhotoEntry.styleOverride` et `roomTypeId` existent déjà dans `MerchantMode.tsx` (ligne 24-31)
  - L'étape `review` est dans `MerchantStep` — l'UI de grille avec dropdowns est à créer dans cette étape
  - La valeur par défaut du dropdown Style DOIT être "Style global" (null) — ne pas forcer une saisie
  - Bloquer la génération si aucun style global ET au moins une photo en "Style global"
  - Mobile-first : 2 dropdowns empilés sous le thumbnail, pas de hover-only
