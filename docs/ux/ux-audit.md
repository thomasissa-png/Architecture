# Audit UX — Versiroom
**Agent** : @ux | **Date** : 2026-03-25 | **Version auditée** : Sprint 19 (code source)

---

## Tableau des 10 critères

| # | Critère | Note /10 | Observation synthétique |
|---|---------|----------|------------------------|
| 1 | Clarté du parcours | 7/10 | StepIndicator présent, auto-scroll fonctionnel. Mais l'UI expose 4 blocs toujours visibles (Upload / Type d'espace / Style / Options) sans masquer les étapes non atteintes : l'utilisateur voit une page longue avant d'avoir uploadé quoi que ce soit. |
| 2 | Friction à l'upload | 8/10 | Drag & drop + clic, HEIC supporté, toast vert en 2,5s, erreurs de format/taille explicites. Point faible : le bouton de suppression est invisible sur desktop (opacity 0 → hover), et le composant manque d'un label `aria-label` sur la zone dropzone elle-même. |
| 3 | Choix de style | 7.5/10 | 12 styles avec emoji + description courte. Mode Custom avec textarea. Lisible sur mobile. Problème : emojis utilisés comme identifiants visuels primaires — pas reproductibles sur tous les systèmes et insuffisants pour distinguer des ambiances proches (Scandinave vs Japandi). Absence de preview visuel par style. |
| 4 | Feedback génération | 8/10 | Timer seconde, estimation ("jusqu'à 2 minutes"), blur preview, indicateur par image (En attente / Génération / Coché). Très bon. Seul manque : pas de possibilité d'annuler une génération en cours depuis l'UI (l'AbortController existe côté code mais aucun bouton "Annuler" n'est exposé). |
| 5 | Résultat | 7.5/10 | Comparateur slider react-compare-slider, download HD, copie clipboard, partage natif, WhatsApp. Multi-résultats avec "Tout télécharger". Manque : le label du modèle utilisé (affiché dans l'ImageComparator) n'apporte pas de valeur pour Léa/Thomas — polluant pour les non-techniques. |
| 6 | Mobile-first | 7/10 | Touch targets 44px sur les boutons principaux. Texte adaptatif (`sm:hidden` / `sm:inline`). Grille 2 colonnes sur mobile pour les previews. Point de friction : la zone upload `p-8 sm:p-14` est grande mais le CTA "Générer" en sticky bottom avec `z-40` peut se superposer au clavier virtuel iOS/Android sans safe-area-inset. |
| 7 | Accessibilité | 7/10 | `focus-visible:ring` présent sur tous les CTA. `role="dialog"` + `aria-modal` + focus trap sur RefineModal. `aria-label` sur bouton supprimer photo. Lacunes : la zone dropzone n'a pas de `role="button"` explicite ni d'`aria-label`. Les pills de style n'ont pas d'`aria-pressed`. Le slider comparateur (lib tierce) n'est pas audité pour la navigation clavier. |
| 8 | Gestion d'erreur | 8/10 | Messages actionnables ("Vérifiez votre connexion", "Vérifiez vos fichiers"), bouton "Réessayer" direct, retry auto sur timeout, messages différenciés selon le code HTTP. Sur l'itération F1 : double bouton "Réessayer / Modifier le commentaire" pertinent. Mineur : quand les itérations sont épuisées, le bouton disabled n'explique pas comment "recharger un pack" (lien manquant vers Pricing). |
| 9 | Itération F1 | 7/10 | Modal bien construite (focus trap, Escape, Cmd+Enter, body scroll lock). Compteur d'itérations restantes visible. Affichage du commentaire en cours sous le loader. Lacunes : la limite de 3 itérations n'est expliquée nulle part avant que l'utilisateur soit bloqué. Pas de sauvegarde automatique du dernier commentaire entre sessions. VersionSelector présent mais l'utilisateur ne sait pas qu'il peut comparer les versions avant de l'avoir utilisé. |
| 10 | Cohérence visuelle | 8/10 | Palette `#FAFAF8` / `#1C1C1E` / Sage `#7D9B76` tenue. Inter 300-800. Arrondis cohérents (rounded-2xl / rounded-full). Animation cubic-bezier sur reveal. Petite incohérence : la Hero mentionne "11 styles" (`text-muted`) alors que l'app en propose 12 (STYLES.length = 12). |

**Moyenne : 7.5/10**

---

## Top 5 problèmes — par sévérité

### CRITIQUE — P1 : Tous les blocs de formulaire visibles dès le chargement

**Constat.** L'utilisateur arrive sur la page et voit immédiatement : Upload + Type d'espace + Style + Options, même sans avoir uploadé une photo. Le StepIndicator indique l'étape 1, mais les étapes 2 et 3 ne sont pas masquées — elles sont juste vides.

**Impact persona.** Léa (iPhone, digital native) va scroller et percevoir une page longue avant d'avoir compris quoi faire. Thomas (laptop Windows, niveau moyen) risque de choisir un style avant d'avoir uploadé une photo et de ne pas comprendre pourquoi le bouton Générer n'apparaît pas.

**Recommandation.** Afficher les blocs de formulaire par révélation progressive conditionnelle :
- Bloc "Type d'espace" et "Style" : `hidden` tant que `files.length === 0`, révélés avec `animate-fade-in-up` dès le premier fichier uploadé.
- Le bouton Générer reste sticky et conditionnel (comportement actuel correct).
- Conserver le StepIndicator pour que l'utilisateur sache ce qui l'attend.

---

### HAUTE — P2 : Absence de bouton "Annuler" pendant la génération

**Constat.** Le code possède un `AbortController` (ref `abortControllerRef`) branché sur toutes les requêtes, mais aucun bouton "Annuler" n'est exposé dans l'UI. L'utilisateur qui a fait une erreur (mauvais style, mauvaise photo) doit attendre jusqu'à 3 minutes.

**Impact persona.** Claire (MacBook Pro, usage professionnel) va tester plusieurs styles rapidement. Thomas génère 3 photos d'un bien en même temps. Les deux ont besoin de corriger une erreur sans attendre.

**Recommandation.** Ajouter un bouton "Annuler" sous le loader de génération :
```
[spinner] Génération en cours... (1/2)
[Annuler]  ← bouton texte, appelle abortControllerRef.current?.abort() + handleFullReset partiel
```
Conserver le reset partiel (ne pas réinitialiser fichiers et style, seulement l'état de génération).

---

### HAUTE — P3 : Absence de preview visuelle pour les 12 styles

**Constat.** Les 12 styles sont représentés par un emoji + un titre + une description de 4 mots. L'emoji est insuffisant pour distinguer Scandinave / Japandi / Wabi-Sabi visuellement, et les descriptions sont trop courtes pour un utilisateur qui ne connaît pas ces styles.

**Impact persona.** Léa cherche l'inspiration : elle ne sait pas ce que "Bohème – Textiles ethniques, plantes, chaleur nomade" donne dans un vrai appartement. Thomas doit choisir un style vendeur pour sa plaquette : il a besoin de voir le rendu avant de lancer la génération.

**Recommandation.** Ajouter une image de référence par style (ratio 4/3, 300px max, rendu IA ou photo de référence). Afficher au survol/focus sur desktop, ou en modal tap sur mobile. Ces images servent aussi de social proof sur la qualité du service. Si les images ne sont pas encore disponibles : ajouter une palette de couleurs (3 pastilles) par style comme palliatif immédiat.

---

### MOYENNE — P4 : Limite d'itérations opaque et chemin vers l'upgrade inexistant

**Constat.** La limite de 3 itérations par génération n'est jamais annoncée avant que l'utilisateur la découvre par épuisement. Quand le quota est atteint, le bouton devient grisé avec `title="Iterations epuisees — rechargez un pack"` — un tooltip non accessible sur mobile et sans lien actionnable.

**Impact persona.** Claire et Thomas, utilisateurs Pro, ont besoin d'itérer. Découvrir la limite en étant bloqué crée de la frustration. L'absence de CTA vers le Pricing rompt le funnel de conversion à l'instant le plus chaud (l'utilisateur vient d'obtenir un résultat et veut aller plus loin).

**Recommandation.** (1) Afficher le compteur d'itérations dès la première apparition du bouton "Affiner", pas seulement quand il reste peu d'itérations. (2) Quand le quota est épuisé, remplacer le bouton grisé par un lien : "3 itérations incluses dans l'offre gratuite — voir les formules" → ancre `#pricing`. (3) Ajouter un texte d'amorce dans la modal RefineModal : "Itération X/3 — les itérations permettent d'ajuster le mobilier sans relancer depuis zéro."

---

### MOYENNE — P5 : Incohérence Hero "11 styles" vs 12 styles réels + label modèle exposé

**Constat A.** La Hero affiche "11 styles disponibles" (ligne 711) alors que `STYLES.length = 12` (12 styles dans StylePicker). Également, `StylePicker.tsx` gère des styles outdoor via un composant séparé, ce qui porte le total encore plus haut. La social proof line est donc factuellement fausse.

**Constat B.** L'ImageComparator affiche un badge "modèle utilisé" (gpt-4.1 / flux-depth-pro). Pour Léa et Thomas, cette information est du bruit technique. Pour Claire, c'est potentiellement rassurant mais doit être présenté différemment (ex : "Qualité architecte" plutôt que le nom du modèle).

**Recommandation A.** Corriger la Hero : "12 styles disponibles". Mettre en place une constante partagée `STYLE_COUNT` tirée de `STYLES.length` pour éviter cette désynchronisation à l'avenir.

**Recommandation B.** Remplacer le badge modèle par un badge qualitatif : "Haute résolution" ou "Qualité Pro" selon le modèle utilisé. Masquer l'information technique pour les non-pros ou la reléguer dans un tooltip.

---

## Auto-évaluation standard

- Chaque écran est justifié par un besoin documenté dans les personas : oui
- Les edge cases et états d'erreur sont couverts : oui (P2 = état manquant identifié)
- Nombre d'étapes avant le aha moment : 3 étapes (upload → style → résultat). Conforme. P1 crée une friction perçue supplémentaire avant l'étape 1.
- Accessibilité WCAG 2.2 AA : partielle — P2 et P3 du critère 7 à corriger
- Cohérence avec les specs fonctionnelles : oui, tous les flows couverts

---

## Handoff

**Handoff → @design**
- Fichiers produits : `/home/user/Architecture/docs/ux/ux-audit.md`
- Décisions prises : révélation progressive (P1), preview visuelle styles (P3), badge modèle → badge qualitatif (P5B)
- Points d'attention : les previews de style (P3) nécessitent une décision de contenu (images IA générées ou photos de référence) avant implémentation. La palette sage/foreground/background est cohérente — ne pas en dévier pour les nouveaux composants.

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/ux/ux-audit.md`
- Décisions prises : bouton "Annuler" (P2) branche sur `abortControllerRef.current?.abort()` existant, le reset doit être partiel (conserver `files` et `selectedStyle`). Constante `STYLE_COUNT` à extraire de `STYLES.length` pour corriger P5A.
- Points d'attention : le sticky CTA "Générer" avec `z-40` doit être testé avec le clavier virtuel iOS (safe-area-inset-bottom). La révélation progressive (P1) doit préserver l'auto-scroll existant vers `#step-space-type` — vérifier que le scroll ne tente pas d'atteindre un élément masqué.
