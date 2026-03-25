# Re-audit F4 Mode Marchand — Persona Thomas Berger
> Agent : @ux | Date : 2026-03-25
> Méthode : simulation de parcours mental depuis le persona Thomas (marchand de biens, 35 ans, Bordeaux)
> Fichiers audités : MerchantMode.tsx, DossierProgress.tsx, DossierResult.tsx, DossierPublicView.tsx, app/dossier/[uuid]/page.tsx
> Référence : f4-audit-thomas.md (note initiale : 6.1/10)

---

## Note globale Thomas : 7.2 / 10

Progression nette de +1.1 point vs premier audit (6.1 → 7.2). Les corrections cosmétiques et de vocabulaire ont été appliquées avec soin : le langage Thomas est présent ("visuel meublé", "acquéreur", "dossier prêt"), les messages d'erreur sont devenus actionnables, le disclaimer PDF est correct. Ces corrections améliorent la crédibilité pro de l'interface.

Mais les 4 frictions structurelles identifiées comme P0/P1 n'ont pas été implémentées. Thomas peut utiliser l'outil mais il ne peut pas encore compter dessus : il ne sait toujours pas ce qu'il paye en EUR, il ne retrouve pas ses dossiers passés, il ne peut pas envoyer directement sur WhatsApp. Ce sont ces absences qui plafonnent la note à 7.2 et empêchent l'adoption récurrente.

---

## Tableau des 10 critères

| # | Critère | Note V1 | Note V2 | Delta | Commentaire V2 |
|---|---------|---------|---------|-------|----------------|
| 1 | Simplicité | 6/10 | 7/10 | +1 | Photos en premier (step par défaut = "photos") : correction appliquée. Mais l'étape "info" reste accessible via un bouton dédié depuis l'étape photos — le flow est photos → info → style → review → résultats. L'ordre est maintenant logique pour Thomas. Perte d'un point : l'étape "review" reste obligatoire et le bouton CTA de l'étape photos dit "Ajouter les photos" ce qui est confus — ce bouton navigue en fait vers l'étape "info", pas vers une confirmation d'upload. |
| 2 | Rapidité perçue | 7/10 | 7/10 | 0 | Le timer + estimation ("~Xs total") sont présents dans DossierProgress. La génération batch reste asynchrone. Pas d'amélioration ni de régression. L'estimation `total * 30s` est statique et ne diminue pas au fil des complétions — Thomas voit le même chiffre du début à la fin, ce qui crée une sensation de stagnation. |
| 3 | Qualité pro | 5/10 | 6.5/10 | +1.5 | Le summary bar de DossierResult affiche bien "X visuels meublés". La page partageable a une structure propre avec titre, adresse, surface, prix, date de génération et date d'expiration. Le disclaimer AI est reformulé : "Visuels générés par intelligence artificielle à titre de simulation" — correct. Mais la page partageable reste sans CTA de contact ni logo agence, ce qui limite son usage comme vraie plaquette commerciale pour Thomas. |
| 4 | Téléchargement HD | 5/10 | 6/10 | +1 | Bouton "Télécharger le PDF" présent et libellé. Mais toujours pas de téléchargement image par image en HD depuis DossierResult. Le bouton PDF ouvre `window.open` en nouvel onglet sans feedback de chargement côté client — comportement Safari/mobile hasardeux inchangé. La page publique `/dossier/[uuid]` a aussi un bouton PDF fonctionnel. |
| 5 | Partage | 6/10 | 6.5/10 | +0.5 | Libellé "Partager avec un acquéreur" appliqué — le bon vocabulaire Thomas. Feedback "Lien copié · Valable 30 jours" présent. Mais pas de bouton WhatsApp (friction P1 non résolue). Pas de `navigator.share` natif mobile. La progression est cosmétique mais le partage en 1 tap reste absent. |
| 6 | Prix/valeur | 4/10 | 4/10 | 0 | Aucune correction appliquée. L'écran review affiche toujours "Générer le dossier (X crédits)" sans équivalent EUR. Thomas ne peut toujours pas évaluer le coût réel. La friction P0 la plus impactante sur la proposition de valeur reste entière. |
| 7 | Gestion d'erreur | 5/10 | 7/10 | +2 | Nette amélioration des messages d'erreur globaux : "Erreur lors du lancement de la generation" → messages actionnables avec "Vérifiez votre connexion et réessayez" et "vos crédits n'ont pas été consommés". L'état d'erreur dans le banner est propre. Mais l'`errorMessage` par photo (DB) n'est toujours pas affiché dans DossierResult — Thomas voit "Échec" sans savoir pourquoi. DossierProgress affiche "Échec" mais pas le message. Le crédit restitué automatiquement est bien mentionné dans DossierResult. |
| 8 | Mobile | 5/10 | 6/10 | +1 | Les corrections de focus-visible et min-height 44px sur les boutons type-de-bien améliorent la cible tactile. Le grid des labels par photo reste dense sur iPhone mais fonctionnel. La page partageable est correctement responsive. Pas de régression notable. |
| 9 | Retrouvabilité | 3/10 | 3/10 | 0 | Aucune correction. Pas de page "Mes dossiers". Thomas ne peut toujours pas retrouver un dossier passé sans avoir conservé le lien. Critère le plus défaillant, inchangé. C'est la friction qui transforme un usage ponctuel en usage récurrent — son absence plafonne l'adoption pro de Thomas. |
| 10 | Confiance | 6/10 | 7/10 | +1 | Le vocabulaire pro ("acquéreur", "dossier prêt", "visuel meublé") installe mieux la crédibilité. Le récapitulatif avant génération avec prix formaté en EUR (`Number(bienPrix).toLocaleString("fr-FR") EUR`) et la mention du crédit restitué automatiquement en cas d'échec renforcent la confiance. Limite : l'absence de prix EUR au moment du CTA génère encore de l'hésitation. |

---

## Delta synthétique — ce qui a changé

### Corrections appliquées et leur effet réel

| Correction | Impact mesuré | Note affectée |
|-----------|--------------|---------------|
| Photos en premier (step initial = "photos") | Fort — Thomas commence par ce qu'il a en main | Simplicité +1 |
| Libellé "Partager avec un acquéreur" | Moyen — bonne sémantique, pas de nouvelle feature | Partage +0.5 |
| "Dossier prêt" au lieu de "Dossier terminé" | Faible — cosmétique, mais juste | Confiance +0.3 |
| "Lien copié · Valable 30 jours" | Moyen — répond à une anxiété de Thomas | Partage +0.3 |
| Messages d'erreur actionnables | Fort — Thomas sait quoi faire quand ça échoue | Gestion d'erreur +2 |
| Badges AVANT/APRÈS typographiques nus | Faible — épure le visuel, pro | Qualité pro +0.3 |
| Focus-visible sur bouton principal | Faible — accessibilité, invisible pour Thomas | Mobile +0.5 |
| Prix EUR dans champ bienPrix | Moyen — aide sur l'étape info, pas au moment décisif | Confiance +0.3 |
| "Télécharger le PDF" libellé | Faible — clarté, pas de changement fonctionnel | Téléchargement +0.5 |
| Disclaimer "à titre indicatif" | Moyen — Thomas assume mieux le document partagé | Qualité pro +0.5 |

### Frictions non résolues (rapport P0/P1 → impact)

| Friction | Priorité initiale | Statut | Impact plafond |
|---------|------------------|--------|---------------|
| Pas de page "Mes dossiers" | P0 | Non implémenté | Plafonne critère Retrouvabilité à 3/10 |
| Prix en EUR absent au moment du CTA | P0 | Non implémenté | Plafonne critère Prix/valeur à 4/10 |
| Pas de bouton WhatsApp | P1 | Non implémenté | Limite critère Partage à 6.5/10 |
| Pas de `navigator.share` mobile | P1 | Non implémenté | Limite critère Mobile à 6/10 |
| errorMessage par photo non affiché | P1 | Non implémenté | Plafonne Gestion d'erreur à 7/10 |
| Téléchargement HD image par image | P2 | Non implémenté | Limite Téléchargement HD à 6/10 |

---

## Ce qui reste pour atteindre 9/10

### Correction R1 — Page "Mes dossiers" (P0) — impact : +1.0 pt
**Critère affecté : Retrouvabilité (3 → 7/10)**

Thomas fait 8-12 opérations par an. La retrouvabilité est la fonctionnalité qui transforme Versiroom d'un outil ponctuel en outil de travail récurrent. Sans elle, chaque session repart de zéro.

Implémentation minimale viable :
- Route `/mes-dossiers` protégée par session (next-auth)
- Query PostgreSQL : `SELECT * FROM dossiers WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
- Affichage : carte par dossier avec nom du bien, date, nb photos, statut, lien direct et bouton "Copier le lien"
- État vide : "Aucun dossier — commencez par générer vos premiers visuels"
- Lien dans le header du mode marchand ou dans la nav principale

Sans cette correction, Thomas ne peut pas adopter Versiroom comme outil quotidien.

---

### Correction R2 — Prix EUR au moment du CTA (P0) — impact : +0.7 pt
**Critère affecté : Prix/valeur (4 → 7/10)**

Le moment critique est l'étape "review" juste avant le CTA "Générer le dossier". Thomas doit voir le coût en EUR, pas en crédits.

Implémentation :
```
Générer le dossier (8 crédits — 8,00 EUR)
```
Ou si le prix unitaire est connu par session (pack acheté) :
```
Générer le dossier · 8 crédits · 3,20 EUR (pack Pro)
```
Et en dessous, un ancrage comparatif discret : "Soit ~96% moins cher qu'un home stager".

Ce changement ne nécessite pas de nouvelle feature — juste d'interpoler le prix unitaire du crédit dans l'affichage existant.

---

### Correction R3 — Bouton WhatsApp sur les résultats (P1) — impact : +0.5 pt
**Critère affecté : Partage (6.5 → 8/10)**

Thomas envoie ses plaquettes sur WhatsApp pro. 100% de ses acquéreurs sont sur WhatsApp. Un partage en 1 tap est une réduction de friction directement mesurable sur son usage.

Le comportement existe déjà dans `ImageComparator.tsx`. Dupliquer dans `DossierResult.tsx` :
- Mobile : `navigator.share({ title: bienNom, url: shareUrl })` — feuille native iOS/Android
- Desktop fallback : `https://wa.me/?text=${encodeURIComponent(message + '\n' + shareUrl)}`
- Message pré-rempli : "Visualisation du bien — [nom du bien] : [url]"

---

### Correction R4 — errorMessage par photo dans DossierResult (P1) — impact : +0.5 pt
**Critère affecté : Gestion d'erreur (7 → 8.5/10)**

Le champ `errorMessage` est capturé en DB et présent dans `DossierPhotoStatus`. Il n'est pas rendu dans `DossierResult.tsx`.

Dans la section "Failed photos" de DossierResult, après le label de la pièce, ajouter :
```tsx
{photo.errorMessage && (
  <span className="text-xs text-red-400/80 font-light block mt-0.5">
    {photo.errorMessage}
  </span>
)}
```
Les messages d'erreur doivent être traduits en langage Thomas côté API : "Photo trop sombre", "Image non reconnue", "Erreur temporaire — réessayez".

---

### Correction R5 — Téléchargement HD par image (P2) — impact : +0.3 pt
**Critère affecté : Téléchargement HD (6 → 7.5/10)**

Thomas veut parfois publier une seule image sur SeLoger ou Bien'ici, pas le PDF complet. Un bouton de téléchargement par carte image, pointant sur `/api/logs/image?path=...` avec `download` attribute ou header `Content-Disposition: attachment`.

Dans `DossierResult.tsx`, dans le header de chaque photo card :
```tsx
<a
  href={`/api/logs/image?path=${encodeURIComponent(photo.outputImageKey || "")}`}
  download
  className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors"
>
  Télécharger HD
</a>
```

---

### Correction R6 — `navigator.share` natif sur le bouton "Partager" (P1) — impact : +0.3 pt
**Critère affecté : Mobile (6 → 7.5/10)**

Sur l'écran de résultats mobile, le bouton "Partager avec un acquéreur" devrait détecter `navigator.share` et déclencher la feuille de partage native. Correction peu coûteuse, fort impact perçu sur iPhone (Thomas = iPhone 15 Pro).

Modifier `handleShareLink` dans `MerchantMode.tsx` :
```tsx
if (typeof navigator !== "undefined" && navigator.share) {
  await navigator.share({ title: bienTitle, url: shareUrl });
} else {
  // clipboard fallback existant
}
```

---

### Correction R7 — CTA "Ajouter les photos" → "Continuer" (cosmétique) — impact : +0.2 pt
**Critère affecté : Simplicité (7 → 7.5/10)**

L'étape "photos" a un bouton CTA libellé "Ajouter les photos" qui navigue vers l'étape "info". Le libellé est trompeur : Thomas a déjà ajouté ses photos, le bouton ne les ajoute pas — il avance vers l'étape suivante.

Remplacer par : "Continuer →" ou "Renseigner le bien →" pour être explicite sur ce qui se passe.

---

## Projection des notes après corrections R1–R6

| # | Critère | Note V2 | Note cible post-R | Delta R |
|---|---------|---------|-------------------|---------|
| 1 | Simplicité | 7/10 | 7.5/10 | +0.5 (R7) |
| 2 | Rapidité perçue | 7/10 | 7.5/10 | +0.5 (timer dynamique) |
| 3 | Qualité pro | 6.5/10 | 8/10 | +1.5 (R3, contact agence) |
| 4 | Téléchargement HD | 6/10 | 7.5/10 | +1.5 (R5) |
| 5 | Partage | 6.5/10 | 8.5/10 | +2.0 (R3, R6) |
| 6 | Prix/valeur | 4/10 | 7/10 | +3.0 (R2) |
| 7 | Gestion d'erreur | 7/10 | 8.5/10 | +1.5 (R4) |
| 8 | Mobile | 6/10 | 7.5/10 | +1.5 (R6) |
| 9 | Retrouvabilité | 3/10 | 7/10 | +4.0 (R1) |
| 10 | Confiance | 7/10 | 8.5/10 | +1.5 (R1+R2) |
| — | **Moyenne** | **7.2/10** | **~8.5/10** | **+1.3** |

Atteindre 9/10 nécessiterait en plus : CTA contact sur la page partageable (logo agence / email Thomas), estimation de génération dynamique (décrémentée), et éventuellement un slider interactif AVANT/APRÈS sur la page publique (plus engageant pour l'acquéreur).

---

## Auto-évaluation

- Chaque écran justifié par un besoin Thomas documenté dans le persona : oui
- Edge cases et états d'erreur couverts (pas seulement le happy path) : oui — photos en échec, expiration dossier, dossier introuvable
- Nombre d'étapes avant aha moment : 4 étapes (photos → info → style → review → génération) — inchangé, 1 de trop vs idéal ≤3. Justifié par la nature batch et la nécessité du récapitulatif avant dépense de crédits
- Accessibilité WCAG 2.2 AA : focus-visible appliqué sur les éléments critiques, min-height 44px sur les boutons tactiles — partiel, non audité en profondeur
- Cohérence avec les specs fonctionnelles : oui pour les features implémentées. S1 (Mes dossiers) reste un besoin produit non spécifié — doit être soumis à @product-manager

---

**Handoff → @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/f4-reaudit-thomas.md`
- Décisions prises : re-notation des 10 critères après corrections V2, calcul du delta, identification des 7 corrections restantes pour atteindre 9/10, projection des notes cibles
- Points d'attention critiques :
  - R1 (Mes dossiers, +1.0 pt) et R2 (prix EUR, +0.7 pt) sont les deux corrections à ROI le plus élevé — elles débloquent l'adoption récurrente de Thomas
  - R3 (WhatsApp, +0.5 pt) est un copy-paste depuis ImageComparator.tsx — effort minimal, impact direct sur le cas d'usage core de Thomas
  - R4 (errorMessage par photo) nécessite que l'API traduise les erreurs techniques en messages actionnables FR — coordination avec @fullstack
  - La note 7.2/10 est défendable pour un MVP mais insuffisante pour la rétention d'un usage pro à 8-12 opérations/an — R1 est le déblocage critique
