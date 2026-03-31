# Audit F4 Mode Marchand — Persona Thomas Berger
> Agent : @ux | Date : 2026-03-25
> Méthode : simulation de parcours mental depuis le persona Thomas (marchand de biens, 35 ans, Bordeaux)
> Fichiers audités : MerchantMode.tsx, DossierProgress.tsx, DossierResult.tsx, DossierPublicView.tsx, app/dossier/[uuid]/page.tsx, app/page.tsx

---

## Note globale Thomas : 6.1 / 10

Le mode marchand couvre les fondamentaux du cas d'usage de Thomas. Le flow en 5 étapes est structurellement solide et le PDF + lien partageable répondent aux besoins pro. Mais plusieurs frictions réduisent significativement la note : l'accès au mode est peu visible depuis la page principale, le coût en crédits reste abstrait (aucun prix en EUR visible), la gestion des photos en échec est lacunaire sur mobile, et la page partageable manque d'éléments de crédibilité commerciale pour être envoyée à un acquéreur sans honte.

---

## Tableau des 10 critères

| # | Critère | Note /10 | Commentaire |
|---|---------|----------|-------------|
| 1 | Simplicité | 6/10 | Le flow 5 étapes (info → photos → style → review → résultats) est logique mais les champs "info" arrivent AVANT les photos — Thomas arrive avec ses photos, pas avec ses infos de prix. L'ordre est contre-intuitif pour son mental model. |
| 2 | Rapidité perçue | 6/10 | La génération batch est asynchrone avec polling, ce qui est bien. Mais l'étape "review" obligatoire avant le lancement allonge le parcours sans valeur ajoutée claire pour Thomas. L'estimation `~{total * 30}s` est correcte mais froide. |
| 3 | Qualité pro | 5/10 | La page partageable `/dossier/[uuid]` est sobre et lisible, mais : pas de logo ou tagline agence, pas de CTA de contact, pas de mention de surface/prix mise en avant, et le disclaimer "Simulation générée par IA" en bas de page peut gêner Thomas vis-à-vis de certains acquéreurs peu familiers. |
| 4 | Téléchargement HD | 6/10 | Le bouton PDF est accessible dès les résultats — bien. Mais il ouvre dans un nouvel onglet (`window.open`) sans feedback de chargement. Sur mobile, ce comportement est hasardeux (blocage popup, pas de toast de confirmation). Pas de téléchargement image par image en HD séparé. |
| 5 | Partage | 7/10 | Le bouton "Copier le lien" avec feedback "Lien copié" est propre. Mais il n'y a pas de bouton WhatsApp direct (Thomas envoie ses plaquettes sur WhatsApp pro). Sur mobile, pas de `navigator.share` natif pour partager le lien en 1 tap. Le lien expire dans 30 jours — délai correct mais non visible sur l'écran de résultats. |
| 6 | Prix/valeur | 4/10 | "1 crédit = 1 photo" est affiché à l'étape photos et au récapitulatif. Mais le prix réel en EUR d'un crédit n'est jamais visible dans le flow. Thomas ne peut pas évaluer si c'est moins cher qu'un prestataire avant de confirmer. L'affichage "X crédits" sans ancrage EUR n'a pas de sens pour lui. |
| 7 | Gestion d'erreur | 5/10 | Les photos en échec sont listées avec un bouton "Régénérer (1 crédit)" — c'est actionnable et honnête. Mais le `errorMessage` de la DB n'est jamais affiché à l'utilisateur : Thomas voit "Échec" sans savoir pourquoi ni s'il doit re-photographier la pièce. L'erreur générique est frustrante sur un batch de 10 photos. |
| 8 | Mobile | 5/10 | Le composant est mobile-first (grid responsive, labels per-photo). Mais l'étape "photos" avec le grid de labels est dense sur iPhone 15 Pro (375px). La zone de nommage des pièces sans hauteur minimale garantie peut être difficile à tapper précisément. La page partageable est correcte en responsive. |
| 9 | Retrouvabilité | 3/10 | Il n'y a aucune liste de dossiers passés accessible dans l'UI. Une fois sorti du flow, Thomas ne peut pas retrouver un dossier sans avoir sauvegardé le lien. Pas de "Mes dossiers" ou historique. C'est le critère le plus défaillant pour un usage récurrent (8-12 opérations/an). |
| 10 | Confiance | 6/10 | L'interface est sobre et professionnelle. Le récapitulatif avant génération est rassurant. Mais l'absence de prix clairs, la mention "crédits" sans valeur, et le disclaimer IA sur la page partageable créent un doute sur le sérieux du produit pour un usage commercial. |

---

## Top 5 frictions — classées par impact Thomas

### Friction 1 — Pas de liste de dossiers (retrouvabilité quasi nulle)
**Impact : critique**

Thomas fait 8-12 opérations par an. Il a besoin de retrouver le dossier du bien rue des Chartrons qu'il a généré il y a 3 semaines pour le renvoyer à un acquéreur relancé. Aujourd'hui, s'il n'a pas sauvegardé le lien, le dossier est perdu pour lui. Il n'y a aucune interface "Mes dossiers" ni historique accessible depuis son compte.

> "Là je me dis... j'ai généré 6 dossiers depuis le début du mois, je me souviens plus du lien pour le T4 de Mérignac. Je fouille dans mes mails, je refais la génération... c'est pas sérieux pour un outil pro."

---

### Friction 2 — Prix en crédits sans valeur EUR
**Impact : majeur**

Au moment du récapitulatif, Thomas voit "Générer le dossier (8 crédits)". Il ne sait pas ce que ça lui coûte en euros. Il ne peut pas faire le calcul mental "est-ce que c'est moins cher que d'appeler mon prestataire ?". La proposition de valeur centrale de Versimo (gain vs prestataire 200-500€/planche) ne peut pas être ressentie sans cet ancrage.

> "Là je me dis... 8 crédits, ça veut rien dire. C'est combien en vrai ? Je vais pas cliquer sur 'Générer' sans savoir ce que ça me coûte."

---

### Friction 3 — Ordre contre-intuitif (info avant photos)
**Impact : majeur**

Thomas arrive avec son iPhone après une visite de chantier, il a déjà ses photos. Le premier écran lui demande des infos textuelles (nom, adresse, prix) avant même d'uploader quoi que ce soit. Son réflexe naturel est d'uploader ses photos d'abord et de remplir les infos après. L'étape "info" comme porte d'entrée crée un frein immédiat.

> "Là je me dis... j'ai mes photos dans la main, je dois d'abord remplir un formulaire ? Je vais sauter cette étape et me retrouver bloqué ou confus."

---

### Friction 4 — Aucun bouton WhatsApp sur l'écran de résultats
**Impact : majeur**

Thomas envoie ses plaquettes à ses prospects sur WhatsApp pro. Il copie le lien, ouvre WhatsApp, colle le lien — 3 étapes sur mobile. Un bouton "Envoyer par WhatsApp" qui déclenche `https://wa.me/?text=Lien+du+dossier` réduirait ça à 1 tap. C'est un bouton présent dans le mode solo (`ImageComparator.tsx`) mais absent ici.

> "Là je me dis... tous mes acquéreurs sont sur WhatsApp. Il y a un bouton pour partager mais pas WhatsApp directement ? Je dois faire ça à la main à chaque fois."

---

### Friction 5 — Erreurs photos sans message explicatif
**Impact : modéré**

Quand une photo échoue en batch, Thomas voit "Échec" en rouge et un bouton "Régénérer (1 crédit)". Il ne sait pas pourquoi ça a échoué : est-ce la photo qui est trop sombre, trop petite, un bug serveur ? Faut-il re-photographier la pièce ou juste recliquer ? L'`errorMessage` est capturé en DB mais jamais affiché.

> "Là je me dis... Photo 4 en échec, je régénère, ça échoue encore. Le problème vient de la photo ou de votre serveur ? Si c'est ma photo, je vais reprendre le chantier. Si c'est vous, je vais attendre. J'ai besoin de savoir."

---

## Suggestions d'amélioration (max 10)

### S1 — Créer une page "Mes dossiers" avec liste et accès direct
**Priorité : P0**
Afficher la liste des dossiers créés (nom, date, nb photos, statut) avec lien vers le dossier et bouton "Copier le lien". Accessible depuis le header ou depuis le toggle Mode Marchand. Stockage des liens en localStorage en fallback si la session expire.

### S2 — Afficher le prix EUR en temps réel dans le récapitulatif
**Priorité : P0**
Formule : `X crédits = X × [prix unitaire EUR]`. Exemple : "8 crédits = 8,00 EUR" ou "8 crédits = 3,20 EUR (pack Pro)". Le prix doit apparaître au moment critique : juste avant le CTA "Générer le dossier". Peut aussi afficher l'économie vs prestataire : "soit ~96% moins cher qu'un home stager".

### S3 — Inverser l'ordre : photos en premier, infos du bien après
**Priorité : P1**
Réorganiser le flow : Upload photos → Style → Infos du bien (optionnel) → Récapitulatif → Génération. Les infos du bien sont optionnelles — les mettre en dernier réduit la friction initiale sans sacrifier la fonctionnalité. Alternative : rendre l'étape "info" collapsible (skipable en 1 clic).

### S4 — Ajouter le bouton WhatsApp sur l'écran de résultats
**Priorité : P1**
Dupliquer le comportement de `ImageComparator.tsx` : bouton WhatsApp qui partage le lien `/dossier/[uuid]` avec un message pré-rempli. Sur mobile : `navigator.share` natif. Sur desktop : `https://wa.me/?text=...`. Placer à côté de "Copier le lien" dans la barre de résultats.

### S5 — Afficher le message d'erreur détaillé sur les photos en échec
**Priorité : P1**
Afficher `errorMessage` depuis la DB dans l'UI des photos en échec. Traduire les erreurs techniques en messages actionnables : "Photo trop sombre — essayez avec plus de lumière naturelle" / "Erreur serveur temporaire — cliquez Régénérer" / "Photo non reconnue comme intérieur — vérifiez l'image".

### S6 — Ajouter `navigator.share` pour le partage mobile du lien dossier
**Priorité : P1**
Détecter `navigator.share` sur l'écran de résultats. Si disponible, le bouton "Copier le lien" déclenche la feuille de partage native iOS/Android. Thomas peut alors choisir WhatsApp, SMS, email en 1 tap depuis le menu système.

### S7 — Enrichir la page partageable pour le partage acquéreur
**Priorité : P2**
Ajouter sur `/dossier/[uuid]` : (a) un label "Visualisation IA — non contractuelle" discret mais assumé (Thomas peut expliquer à l'acquéreur, ça ne devrait pas gêner), (b) une ligne optionnelle "Contact : [email/tel du marchand]" si renseignée à la création, (c) le style utilisé ("Ambiance : Scandinave") pour ancrer la proposition. Supprimer ou reformuler le disclaimer "Simulation générée par intelligence artificielle" pour quelque chose de moins anxiogène.

### S8 — Indiquer la date d'expiration du lien sur l'écran de résultats
**Priorité : P2**
Thomas ne sait pas que le lien expire dans 30 jours. Afficher clairement : "Ce lien est valable jusqu'au [date]" sur l'écran de résultats. Si la date approche (J-5), envoyer une notification email ou afficher un badge d'alerte dans "Mes dossiers".

### S9 — Permettre le téléchargement image par image en HD depuis les résultats
**Priorité : P2**
Thomas veut parfois utiliser une seule image pour une annonce SeLoger plutôt que le PDF complet. Ajouter un bouton "Télécharger" sur chaque carte image du `DossierResult`. Pointer directement sur la clé Object Storage via `/api/logs/image?path=...` avec `Content-Disposition: attachment`.

### S10 — Afficher un indicateur de progression de la génération avec estimation par photo
**Priorité : P3**
Le `DossierProgress.tsx` affiche `~{total * 30}s total` — correct mais statique. Améliorer avec : temps restant estimé dynamique (décrémenté au fur et à mesure), et pour les batchs > 5 photos, indiquer l'ordre de traitement parallèle ("2 photos en parallèle"). Réduit l'anxiété sur les batchs longs.

---

## Auto-évaluation

- Chaque écran justifié par un besoin Thomas documenté dans le persona : oui
- Edge cases et états d'erreur couverts (pas seulement happy path) : oui (frictions 5, 7)
- Nombre d'étapes avant aha moment documenté : 5 étapes (info → photos → style → review → génération) soit 2 de trop vs idéal ≤3 — justifié par la nature batch et la nécessité du récapitulatif avant dépense de crédits
- Accessibilité WCAG 2.2 AA : non auditée en profondeur dans ce sprint (hors scope de cette mission)
- Cohérence avec specs fonctionnelles @product-manager : oui pour les features implémentées. Point d'attention : aucune spec "Mes dossiers" n'existe encore — S1 est un besoin produit non couvert

---

**Handoff → @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/f4-audit-thomas.md`
- Décisions prises : simulation de parcours complet depuis le persona Thomas, notation sur 10 critères, identification des 5 frictions classées par impact, 10 suggestions priorisées P0→P3
- Points d'attention critiques :
  - S1 (Mes dossiers) et S2 (prix EUR) sont des P0 — sans eux, la proposition de valeur de Thomas n'est pas défendable en usage récurrent
  - S3 (ordre info/photos) est une décision d'architecture de flow qui touche `MerchantMode.tsx` — nécessite validation @product-manager avant implémentation
  - S4 (WhatsApp) est un copier-coller depuis `ImageComparator.tsx` — faible effort, fort impact Thomas
  - La friction "retrouvabilité" (note 3/10) est structurellement la plus grave et la plus éloignée des corrections cosmétiques — elle nécessite une nouvelle page `/mes-dossiers` + API dédiée
