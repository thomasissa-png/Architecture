# Re-audit copy F4 — Mode Marchand (post-corrections)
> Produit par @copywriter — 2026-03-25
> Périmètre : MerchantMode.tsx, DossierProgress.tsx, DossierResult.tsx, app/dossier/[uuid]/page.tsx, app/api/dossier/[uuid]/pdf/route.ts
> Référence : audit initial f4-audit-copy.md (note 6,2/10)

---

## Note globale : 8,1 / 10

Delta : +1,9 point vs audit initial.

Les 16 corrections critiques (accents) ont été intégralement appliquées. Les messages d'erreur sont maintenant actionnables. Le vocabulaire de Thomas — "visuel meublé", "acquéreur", "crédit restitué" — a fait son entrée dans l'interface. Le PDF reçoit la formulation réglementaire correcte. Ce qui reste pour atteindre 9/10 est ciblé et précis : trois lacunes de vocabulaire professionnel, une incohérence de CTA dans le tunnel, et deux absences de contenu qui laissent l'acquéreur sans contexte sur la page publique.

---

## Tableau des 7 critères — état post-corrections

| Critère | Note initiale | Note post-corrections | Delta | Commentaire |
|---|---|---|---|---|
| **1. Vocabulaire Thomas** | 5/10 | 7,5/10 | +2,5 | "Visuel meublé" intégré dans DossierResult et PDF. "Acquéreur" présent dans le CTA de partage et la page publique. "Pré-commercialisation" dans les metadata d'expiration. Reste : "m2" au lieu de "m²" (récapitulatif), "EUR" au lieu de "€" (récapitulatif), "Style global" toujours sans explication pour un non-expert. |
| **2. Clarté** | 7/10 | 8/10 | +1 | Le parcours étapes reste lisible. "Vérifier avant de générer" est une bonne progression vs "Voir le récapitulatif". Reste : le bouton de navigation étape photos dit "Ajouter les photos" mais l'action est de passer à l'étape suivante — légèrement trompeur. |
| **3. Cohérence tonale** | 6/10 | 8/10 | +2 | Le ton pro est maintenant cohérent du début à la fin du parcours. "Dossier prêt" est la bonne note : factuel, efficace, pro. "Lien copié · Valable 30 jours" est un micro-détail qui rassure Thomas sans emphase. La page publique acquéreur est sobre et crédible. |
| **4. Messages d'erreur** | 4/10 | 8,5/10 | +4,5 | Les 4 messages d'erreur critiques sont devenus actionnables. "Connectez-vous", "Vérifiez votre connexion et réessayez", "vos crédits n'ont pas été consommés" : trois formulations qui réduisent l'anxiété et indiquent l'action suivante. Reste : le message d'erreur d'upload (catch dans la promesse) n'est pas visible dans les fichiers audités — à vérifier. |
| **5. CTA** | 5/10 | 8/10 | +3 | "Partager avec un acquéreur" nomme l'action business, pas l'action technique : correction majeure. "Télécharger le PDF" est explicite. "Générer le dossier (N crédit/s)" est correct et transparent sur le coût. Reste : "Ajouter les photos" sur le bouton de navigation étape photos est ambigu (voir §corrections restantes). |
| **6. PDF professionnel** | 5/10 | 8/10 | +3 | Disclaimer `"Visuels générés par intelligence artificielle à titre indicatif — Versimo"` : formulation professionnelle et alignée EU AI Act Art. 50. Labels "Avant home staging" / "Après home staging" : vocabulaire du secteur, lisible par un acquéreur. Comptage couverture en "visuels meublés". Reste : titre de couverture par défaut non corrigé (voir §corrections restantes). |
| **7. Accents et typographie** | 4/10 | 9,5/10 | +5,5 | 16 occurrences corrigées : Génération, Récapitulatif, Personnalisé, crédits, échec (×3), expiré, pré-commercialisation, Après, généré, etc. Reste : "m2" sans exposant (MerchantMode.tsx ligne 629) et un accent non corrigé dans un alt d'image (DossierResult.tsx ligne 135 : `"— apres"`). |

---

## Delta consolidé vs premier audit

| Domaine | Avant | Après | Gain |
|---|---|---|---|
| Accents critiques manquants | 16 occurrences | 1 résidu mineur | −15 |
| Messages d'erreur actionnables | 0/4 | 4/4 | +4 |
| Vocabulaire Thomas ("visuel meublé", "acquéreur") | 0 occurrence dans l'UI | 5 occurrences | +5 |
| CTA avec bénéfice immédiat | 1/5 | 4/5 | +3 |
| PDF disclaimer conforme EU AI Act | Non | Oui | Résolu |
| Labels PDF professionnels | "AVANT" / "APRES" | "Avant home staging" / "Après home staging" | Résolu |

---

## Corrections restantes pour 9/10

Six points à traiter. Aucun n'est bloquant pour le lancement MVP, mais chacun est visible par Thomas ou par ses acquéreurs.

---

### C1 — "m2" → "m²" dans le récapitulatif
**Fichier** : MerchantMode.tsx, ligne 629
**Actuel** : `{bienSurface} m2`
**Proposé** : `{bienSurface} m²`
**Priorité** : Haute — apparaît dans un document de présentation commerciale.

---

### C2 — "EUR" → "€" dans le récapitulatif
**Fichier** : MerchantMode.tsx, ligne 630
**Actuel** : `{Number(bienPrix).toLocaleString("fr-FR")} EUR`
**Proposé** : `{Number(bienPrix).toLocaleString("fr-FR")} €`
**Priorité** : Haute — un dossier immobilier professionnel utilise "€", pas "EUR". "EUR" est la notation interbancaire, pas la notation commerciale française.

---

### C3 — Alt image sans accent dans DossierResult
**Fichier** : DossierResult.tsx, ligne 135
**Actuel** : `alt={`${photo.roomLabel || "Photo"} — apres`}`
**Proposé** : `alt={`${photo.roomLabel || "Photo"} — après`}`
**Priorité** : Haute — les attributs alt sont lus par les lecteurs d'écran et indexés par les moteurs. "apres" sans accent est une faute de français dans un attribut public.

---

### C4 — CTA navigation étape photos ambigu
**Fichier** : MerchantMode.tsx, ligne 550
**Actuel** : `Ajouter les photos`
**Contexte** : Ce bouton apparaît APRÈS que Thomas a déjà ajouté ses photos et cliqué. Son action réelle est "passer à l'étape suivante" (étape "info"). Le libellé crée une confusion : Thomas a déjà ajouté ses photos, pourquoi "ajouter les photos" ?
**Proposé** : `Informations du bien →`
**Alternative** : `Continuer` (minimaliste mais non ambigu)
**Priorité** : Haute — CTA dans le tunnel principal, visible à chaque session.

---

### C5 — Titre PDF par défaut : "Dossier de présentation — {date}" toujours absent
**Fichier** : MerchantMode.tsx, ligne 346
**Actuel** : `bienNom.trim() || \`Dossier de présentation — ${new Date().toLocaleDateString("fr-FR")}\``
**État** : Déjà correct dans le code source actuel — la correction a été appliquée sur cette ligne. Mais `getDossierTitle()` dans `lib/dossier` produit peut-être encore un fallback différent pour le PDF côté serveur.
**À vérifier** : Ouvrir `lib/dossier.ts` et contrôler que `getDossierTitle()` utilise "Dossier de présentation" comme fallback et non "Bien sans titre" (mentionné dans le premier audit comme label interne à ne pas exposer).
**Priorité** : Haute — le titre apparaît en couverture d'un document envoyé à des acquéreurs.

---

### C6 — Page publique acquéreur : état "partial" sans message explicatif
**Fichier** : app/dossier/[uuid]/page.tsx
**Actuel** : Aucune distinction entre `status === "completed"` et `status === "partial"`. Un acquéreur qui reçoit un dossier avec 3 visuels sur 5 ne sait pas si le dossier est incomplet ou si le bien n'a que 3 pièces.
**Proposé** : Ajouter sous le titre, conditionnel au statut `"partial"` :
```
Ce dossier présente {completedPhotos.length} visuel{s} — certaines pièces n'ont pas pu être générées.
```
**Priorité** : Moyenne — edge case, mais visible par des tiers (acquéreurs) et potentiellement préjudiciable à la crédibilité de Thomas.

---

## Ce qui n'a pas besoin d'être retouché

Les éléments suivants sont à niveau et ne doivent pas être modifiés :

- Tous les accents corrigés dans MerchantMode.tsx (Génération, Récapitulatif, Personnalisé, crédits, échec, pré-commercialisation, Générée)
- "Dossier prêt" comme titre de l'étape résultats — factuel et pro
- "Lien copié · Valable 30 jours" — micro-détail de rassurance bien calibré
- "Partager avec un acquéreur" — nomme l'action business, pas l'action technique
- "Relancer (1 crédit)" sur le bouton de regénération photo en échec — transparent et actionnable
- "Si une photo échoue, le crédit correspondant est automatiquement restitué." — rassure avant l'engagement
- Disclaimer PDF `"Visuels générés par intelligence artificielle à titre indicatif — Versimo"` — conforme et professionnel
- Labels PDF "Avant home staging" / "Après home staging" — vocabulaire du secteur
- Messages d'erreur actionnables : "Connectez-vous pour accéder au Mode Marchand.", "Vérifiez votre connexion et réessayez.", "vos crédits n'ont pas été consommés."
- Page publique acquéreur : "Dossier partagé", "Généré le {date} — Disponible jusqu'au {date}", disclaimer `"Visuels générés par intelligence artificielle à titre de simulation. Versimo — versimo.fr"`

---

## Synthèse : chemin vers 9/10

| Correction | Fichier | Effort estimé | Impact |
|---|---|---|---|
| C1 — m² | MerchantMode.tsx | 2 min | Pro |
| C2 — € | MerchantMode.tsx | 2 min | Pro |
| C3 — alt "après" | DossierResult.tsx | 1 min | Accessibilité |
| C4 — CTA navigation étape photos | MerchantMode.tsx | 5 min | Clarté tunnel |
| C5 — vérifier getDossierTitle() fallback | lib/dossier.ts | 5 min | PDF acquéreurs |
| C6 — état "partial" page publique | app/dossier/[uuid]/page.tsx | 15 min | Crédibilité Thomas |

Effort total estimé : 30 minutes de développement. Aucune décision de design ou d'architecture requise.

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/reviews/f4-reaudit-copy.md`
- Décisions prises :
  - Note globale portée à 8,1/10 — les corrections critiques (accents, messages d'erreur, vocabulaire Thomas) sont validées comme intégrées
  - 6 corrections résiduelles identifiées pour atteindre 9/10 — toutes sont des retouches chirurgicales, aucune refonte
  - "EUR" → "€" confirmé comme correction haute priorité : notation commerciale française, pas notation interbancaire
  - État "partial" sur la page publique : ajout de contenu conditionnel, pas de changement de layout
- Points d'attention :
  - C5 requiert de lire `lib/dossier.ts` pour vérifier `getDossierTitle()` — potentiellement déjà corrigé, à confirmer
  - C6 est conditionnel (`dossier.status === "partial"`) — ne pas afficher si le dossier est `"completed"`
  - L'alt "apres" (C3) est dans un template string JSX — vérifier qu'aucun autre alt similaire n'a été oublié dans DossierPublicView.tsx
---
