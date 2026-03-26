# Audit copy F4 — Mode Marchand
> Produit par @copywriter — 2026-03-25
> Référence : brand-voice.md, personas.md (Thomas — marchand de biens)
> Périmètre : MerchantMode.tsx, DossierProgress.tsx, DossierResult.tsx, DossierPublicView.tsx, app/dossier/[uuid]/page.tsx, app/api/dossier/[uuid]/pdf/route.ts

---

## Note globale : 6,2 / 10

L'interface fonctionne et les libellés sont compréhensibles. Mais le registre est celui d'un développeur qui a écrit des labels fonctionnels, pas d'un professionnel immobilier qui parle à Thomas. Les mots du terrain de Thomas — dossier de pré-commercialisation, acquéreur, visuel meublé, plaquette — n'apparaissent presque pas dans l'interface. Le plus urgent : les accents manquants (7 occurrences), les messages d'erreur non actionnables, et les CTA qui ne valorisent pas le résultat livré.

---

## Tableau des 7 critères

| Critère | Note | Commentaire |
|---|---|---|
| **1. Vocabulaire Thomas** | 5/10 | "Dossier" est utilisé, c'est bien. Mais "bien" reste un terme interne (le terrain dit "le bien à commercialiser"). "Crédit" est le mot de la plateforme, pas celui de Thomas. "Visualisation" est acceptable mais "visuel meublé" serait plus parlant pour Thomas qui vend des plaquettes. Aucune occurrence de "plaquette", "acquéreur", "pré-commercialisation" dans l'interface (seulement dans les metadata). |
| **2. Clarté** | 7/10 | Le parcours en étapes est lisible. Les labels de formulaire sont corrects. Bémol : "Style global" ne dit pas ce que c'est ni à quoi ça sert pour un non-expert. "Récapitulatif" est fonctionnel mais peut être plus engageant. |
| **3. Cohérence tonale** | 6/10 | Le ton est sobre, c'est bien. Mais certains messages sont trop décontractés pour le contexte pro ("Nommez vos pièces") et d'autres trop laconiques ("Terminé"). Le PDF — document officiel envoyé à des acquéreurs — a le même niveau de soin que l'interface interne, ce qui est insuffisant. |
| **4. Messages d'erreur** | 4/10 | 3 erreurs génériques non actionnables. "Connexion requise pour utiliser le Mode Marchand" : dit pourquoi mais pas quoi faire. "Sélectionnez un style" : vague, sans action directe. "Erreur inattendue" : catégorie à ne jamais utiliser selon brand-voice.md. Les messages de remboursement de crédits sont traités comme des notes de bas de page alors qu'ils réduisent le risque perçu. |
| **5. CTA** | 5/10 | "Continuer" n'a aucun bénéfice (vers quoi ?). "Choisir le style" est fonctionnel mais perd l'opportunité de qualifier. "Générer le dossier" est correct. "PDF" seul en bouton est trop laconique — le document a une valeur. "Copier le lien" est neutre alors qu'il pourrait exprimer l'action business (partager avec un acquéreur). |
| **6. PDF professionnel** | 5/10 | La couverture est structurée. Mais le disclaimer IA "Simulation — genere par Versiroom" (sans accent) est le seul texte de pied de page d'un document professionnel destiné à des acquéreurs. Pas de mention de la date d'expiration, pas de note sur l'utilisation des visuels. Le comptage "X visualisations" en couverture est correct mais sans contexte (visualisations de quoi ?). Les labels AVANT/APRES en capitales sont fonctionnels mais un peu bruts pour un document de commercialisation. |
| **7. Accents et typographie** | 4/10 | 7 occurrences identifiées de mots sans accent dans les chaînes de texte visibles. "Optionnel" sans accent (×1), "Jusqu'à" sans accent (×1), "generee" sans accent (×1), "Personnalise" sans accent (×1), "Echec" / "echec" sans accent (×3), "En attente" (correct), "En cours" (correct). "genere" dans le disclaimer PDF. Ces fautes apparaissent dans le produit livré à des acquéreurs. |

---

## Liste des corrections

### MerchantMode.tsx

| Fichier | Ligne | Texte actuel | Texte proposé | Priorité |
|---|---|---|---|---|
| MerchantMode.tsx | 373 | `Informations du bien` | `Informations sur le bien` | Moyenne |
| MerchantMode.tsx | 375 | `Optionnel — ces informations apparaitront sur le PDF et la page partageable.` | `Optionnel — ces informations figureront sur le PDF et le lien de partage destiné aux acquéreurs.` | Haute |
| MerchantMode.tsx | 387 | `placeholder="Ex : 45 rue de la Paix — T3 renove"` | `placeholder="Ex : T3 Haussmannien 65 m² — Bordeaux Chartrons"` | Basse |
| MerchantMode.tsx | 466 | `Continuer` | `Ajouter les photos` | Haute |
| MerchantMode.tsx | 481 | `Jusqu&apos;a {MAX_PHOTOS} photos — 1 credit par photo` | `Jusqu'à {MAX_PHOTOS} photos — 1 crédit par photo` | Critique (accent) |
| MerchantMode.tsx | 501 | `Nommez vos pieces (optionnel)` | `Nommez chaque pièce (facultatif — ex : Salon, Chambre principale)` | Haute |
| MerchantMode.tsx | 541 | `Choisir le style` | `Choisir l'ambiance` | Moyenne |
| MerchantMode.tsx | 543 | `{files.length} photo{...} — {files.length} credit{...}` | `{files.length} photo{...} · {files.length} crédit{...} consommé{...}` | Moyenne |
| MerchantMode.tsx | 559 | `Applique a toutes les photos. Vous pourrez personnaliser par piece ensuite.` | `Appliqué à toutes les photos. Vous pourrez ajuster par pièce à l'étape suivante.` | Haute (accent) |
| MerchantMode.tsx | 589 | `Voir le recapitulatif` | `Vérifier avant de générer` | Haute |
| MerchantMode.tsx | 601 | `Recapitulatif` | `Récapitulatif` | Critique (accent) |
| MerchantMode.tsx | 653 | `Style : {globalStyle?.name \|\| "Personnalise"}` | `Style : {globalStyle?.name \|\| "Personnalisé"}` | Critique (accent) |
| MerchantMode.tsx | 665 | `{isGenerating ? "Generation en cours..." : \`Generer le dossier (${creditsNeeded} credits)\`}` | `{isGenerating ? "Génération en cours..." : \`Générer le dossier (${creditsNeeded} crédit${creditsNeeded > 1 ? "s" : ""})\`}` | Critique (accents) |
| MerchantMode.tsx | 669 | `Les photos en echec seront remboursees automatiquement.` | `Si une photo échoue, le crédit correspondant est automatiquement restitué.` | Haute (accent + ton pro) |
| MerchantMode.tsx | 678 | `Generation en cours` | `Génération en cours` | Critique (accent) |
| MerchantMode.tsx | 708 | `Dossier termine` | `Dossier prêt` | Haute |
| MerchantMode.tsx | 713 | `Lien copie` | `Lien copié` | Critique (accent) |
| MerchantMode.tsx | 180 | `"Connexion requise pour utiliser le Mode Marchand."` | `"Connectez-vous pour accéder au Mode Marchand."` | Haute (actionnable) |
| MerchantMode.tsx | 189 | `"Selectionnez un style."` | `"Choisissez une ambiance pour continuer."` | Haute (accent + actionnable) |
| MerchantMode.tsx | 215 | `"Erreur lors de la creation du dossier."` | `"La création du dossier a échoué. Vérifiez votre connexion et réessayez."` | Haute (actionnable) |
| MerchantMode.tsx | 268 | `"Erreur inattendue."` | `"Une erreur est survenue. Réessayez — vos crédits n'ont pas été consommés."` | Haute (rassurer + actionnable) |

---

### DossierProgress.tsx

| Fichier | Ligne | Texte actuel | Texte proposé | Priorité |
|---|---|---|---|---|
| DossierProgress.tsx | 39 | `{isGenerating ? "Generation en cours..." : "Termine"}` | `{isGenerating ? "Génération en cours..." : "Terminé"}` | Critique (accents) |
| DossierProgress.tsx | 43 | `{failed > 0 && \` (${failed} echec${...})\`}` | `{failed > 0 && \` · ${failed} photo${failed > 1 ? "s" : ""} en échec\`}` | Critique (accent) |
| DossierProgress.tsx | 56 | `{elapsed}s — estimation : ~{Math.ceil(total * 30)}s total` | `{elapsed}s · estimation : {Math.ceil(total * 30)}s pour {total} photo{total > 1 ? "s" : ""}` | Moyenne |
| DossierProgress.tsx | 118 | `{photo.status === "completed" && "Termine"}` | `{photo.status === "completed" && "Prêt"}` | Haute |
| DossierProgress.tsx | 119 | `{photo.status === "generating" && "En cours..."}` | — (correct) | — |
| DossierProgress.tsx | 120 | `{photo.status === "failed" && "Echec"}` | `{photo.status === "failed" && "Échec"}` | Critique (accent) |
| DossierProgress.tsx | 121 | `{photo.status === "pending" && "En attente"}` | — (correct) | — |

---

### DossierResult.tsx

| Fichier | Ligne | Texte actuel | Texte proposé | Priorité |
|---|---|---|---|---|
| DossierResult.tsx | 47 | `{completedPhotos.length} visualisation{...} generee{...}` | `{completedPhotos.length} visuel{...} meublé{...}` | Haute (vocab Thomas + accent) |
| DossierResult.tsx | 48 | `{failedPhotos.length > 0 && \` — ${failedPhotos.length} echec{...}\`}` | `{failedPhotos.length > 0 && \` · ${failedPhotos.length} photo${...} en échec\`}` | Critique (accent) |
| DossierResult.tsx | 63 | `Copier le lien` | `Partager avec un acquéreur` | Haute (vocab Thomas) |
| DossierResult.tsx | 75 | `PDF` | `Télécharger le PDF` | Haute (clarté) |
| DossierResult.tsx | 100 | `{isRegenerating === photo.id ? "Regeneration..." : "Regenerer"}` | `{isRegenerating === photo.id ? "Regeneration..." : "Regénérer"}` | Haute (accent + cohérence) |
| DossierResult.tsx | 147 | `{failedPhotos.length} photo{...} en echec` | `{failedPhotos.length} photo{...} en échec — crédit restitué automatiquement` | Haute (accent + rassurer) |
| DossierResult.tsx | 163 | `{isRegenerating === photo.id ? "..." : "Regenerer (1 credit)"}` | `{isRegenerating === photo.id ? "En cours..." : "Relancer (1 crédit)"}` | Haute |

---

### DossierPublicView.tsx

| Fichier | Ligne | Texte actuel | Texte proposé | Priorité |
|---|---|---|---|---|
| DossierPublicView.tsx | 53 | `AVANT` | — (correct, standard du secteur) | — |
| DossierPublicView.tsx | 69 | `APRES` | — (correct, standard du secteur) | — |

DossierPublicView.tsx est sobre et fonctionnel. Aucune correction nécessaire sur ce composant — il délègue les textes au composant parent et à la page.

---

### app/dossier/[uuid]/page.tsx

| Fichier | Ligne | Texte actuel | Texte proposé | Priorité |
|---|---|---|---|---|
| page.tsx | 32 | `"Dossier expire — Versiroom"` | `"Dossier expiré — Versiroom"` | Critique (accent, metadata publique) |
| page.tsx | 33 | `"Ce dossier de pre-commercialisation a expire."` | `"Ce dossier de pré-commercialisation a expiré."` | Critique (accent, metadata publique) |
| page.tsx | 43 | `"${title} — Visualisation par Versiroom."` | `"${title} — Visuels meublés par Versiroom."` | Haute (vocab secteur + OG preview) |
| page.tsx | 49 | `"${title} — Visualisation Versiroom"` | `"${title} — Visuels meublés par Versiroom"` | Haute (OG title) |
| page.tsx | 67 | `Dossier introuvable` | — (correct) | — |
| page.tsx | 70 | `Ce dossier n'existe pas ou a ete supprime.` | `Ce dossier est introuvable ou a été supprimé.` | Critique (accent) |
| page.tsx | 83 | `Dossier expire` | `Dossier expiré` | Critique (accent, H1 visible) |
| page.tsx | 86–88 | `Ce dossier de pre-commercialisation a expire. Les dossiers sont disponibles pendant 30 jours apres leur creation.` | `Ce dossier de pré-commercialisation a expiré. Les visuels meublés sont accessibles pendant 30 jours à compter de la génération.` | Critique (accents + précision) |
| page.tsx | 113 | `Dossier partage` | `Dossier partagé` | Critique (accent, badge visible) |
| page.tsx | 143 | `Cree le {date} — Expire le {date}` | `Généré le {date} · Disponible jusqu'au {date}` | Haute (ton pro + accent) |
| page.tsx | 153 | `"Generation en cours..."` | `"Génération en cours, revenez dans quelques instants."` | Haute |
| page.tsx | 154 | `"Aucune visualisation disponible."` | `"Aucun visuel disponible pour ce dossier."` | Moyenne |
| page.tsx | 179 | `Telecharger le PDF` | `Télécharger le PDF` | Critique (accent, CTA visible par les acquéreurs) |
| page.tsx | 188 | `Simulation generee par intelligence artificielle — Versiroom` | `Visuels générés par intelligence artificielle à titre de simulation. Versiroom — versiroom.fr` | Haute (disclaimer pro, visible acquéreurs) |

---

### app/api/dossier/[uuid]/pdf/route.ts

| Fichier | Ligne | Texte actuel | Texte proposé | Priorité |
|---|---|---|---|---|
| route.ts | 29 | `const AI_DISCLAIMER = "Simulation — genere par Versiroom"` | `const AI_DISCLAIMER = "Visuels générés par intelligence artificielle à titre indicatif — Versiroom"` | Critique (accent + niveau pro) |
| route.ts | 157 | `${completedPhotos.length} visualisation${...}` | `${completedPhotos.length} visuel${completedPhotos.length > 1 ? "s" : ""} meublé${completedPhotos.length > 1 ? "s" : ""}` | Haute |
| route.ts | 221 | `"AVANT"` | `"Avant home staging"` | Moyenne (PDF pro) |
| route.ts | 246 | `"APRES"` | `"Après home staging"` | Moyenne (PDF pro) |

Note sur les erreurs API du PDF (lignes 63-65, 71-73, 80-83) : ces messages sont retournés en JSON au navigateur et ne sont pas affichés directement à l'acquéreur. Ils sont corrects dans leur forme actuelle mais pourraient bénéficier d'accents (`"Dossier introuvable."` → correct ; `"Ce dossier a expire."` → `"Ce dossier a expiré."`).

---

## Textes manquants

Ces zones sont vides ou non définies dans le code actuel. Elles nécessitent un texte avant la mise en production.

### 1. Tooltip / aide contextuelle sur le champ "Prix"
- Fichier : MerchantMode.tsx, formulaire étape "info"
- Problème : Le champ accepte un entier en euros mais le label dit seulement "Prix (EUR)". Un Thomas pressé pourrait saisir 350 alors qu'il veut dire 350 000. Un placeholder ou une note sous le champ évite l'erreur.
- Texte proposé : Note sous le champ → `Prix de commercialisation en euros (ex : 350000 pour 350 000 €)`

### 2. Message d'état "dossier partiellement généré" (status "partial")
- Fichier : DossierPublicView via page.tsx
- Problème : La page publique n'a pas de message distinct pour le cas `status === "partial"` (au moins une photo générée, d'autres en échec). Un acquéreur qui ouvre le lien ne sait pas si le dossier est complet ou tronqué.
- Texte proposé : `Ce dossier présente {n} visuel{s} sur {total} — certaines pièces n'ont pas pu être générées.`

### 3. Confirmation de copie du lien (page résultats)
- Fichier : MerchantMode.tsx
- Problème : "Lien copié" apparaît 2 secondes puis disparaît. Pour un professionnel qui veut coller le lien dans un email à un acquéreur, la confirmation est trop fugace. Aucune indication sur la validité du lien.
- Texte proposé : Enrichir le message `"Lien copié · Valable 30 jours"` (durée visible rassure sur la praticité du partage)

### 4. Titre de la couverture PDF quand aucun nom de bien n'est renseigné
- Fichier : app/api/dossier/[uuid]/pdf/route.ts
- Problème : Le titre de couverture est `getDossierTitle(dossier)` qui retourne `"Bien sans titre — DD/MM/YYYY"` selon le code (MerchantMode.tsx ligne 346). Ce titre apparaît sur un document envoyé à des acquéreurs.
- Texte proposé : `"Dossier de présentation — {date}"` (évite "sans titre" qui est un label interne)

### 5. Empty state de l'étape "photos" (avant premier upload)
- Fichier : MerchantMode.tsx, étape "photos"
- Problème : L'UploadZone affiche son propre message drag & drop, mais il n'y a pas de texte contextuel Mode Marchand qui explique à Thomas quoi photographier (pièces vides, max 15 photos).
- Texte proposé : Note au-dessus de la zone → `"Photographiez chaque pièce du bien. Les photos sont traitées une par une — le dossier reste cohérent même si les pièces ont été prises à des jours différents."`

---

## Note sur le PDF comme document commercial

Le PDF est le seul livrable que Thomas envoie à ses acquéreurs. Il porte la réputation commerciale de Thomas. À ce titre, deux points dépassent le copy pur et méritent une attention produit :

1. **Absence d'en-tête commercial** : le PDF ne prévoit pas d'espace pour le logo ou les coordonnées du marchand. Un acquéreur qui reçoit ce PDF ne sait pas de qui il vient. Cela peut être un choix de MVP acceptable, mais il faudra l'adresser pour le passage en pro.

2. **Disclaimer IA positionné en pied de page** : c'est le bon emplacement. La formulation proposée (`"Visuels générés par intelligence artificielle à titre indicatif"`) est plus professionnelle que l'actuelle et plus précise vis-à-vis des obligations EU AI Act Art. 50 déjà identifiées dans f4-review.md.

---

## Récapitulatif des priorités

| Priorité | Nombre de corrections | Nature |
|---|---|---|
| **Critique** | 16 | Accents manquants visibles par les acquéreurs (metadata, PDF, page publique, H1) |
| **Haute** | 18 | Vocabulaire Thomas, CTA enrichis, messages d'erreur actionnables, ton pro |
| **Moyenne** | 5 | Labels plus précis, estimations de génération |
| **Basse** | 1 | Placeholder d'exemple |
| **Textes manquants** | 5 | À créer avant mise en production |

---

---
**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/reviews/f4-audit-copy.md`
- Décisions prises :
  - "Visuel meublé" préféré à "visualisation" — vocabulaire du terrain de Thomas (plaquette, acquéreur, pré-commercialisation)
  - "Partager avec un acquéreur" préféré à "Copier le lien" — nomme l'action business, pas l'action technique
  - "Regénérer" avec accent — cohérence avec le reste de l'interface
  - Disclaimer PDF enrichi : `"Visuels générés par intelligence artificielle à titre indicatif — Versiroom"` — formulation plus solide vis-à-vis de l'EU AI Act Art. 50 (déjà identifié dans f4-review.md)
  - "Après home staging" au lieu de "APRES" dans le PDF — le terme est celui du secteur immobilier, compréhensible pour un acquéreur
- Points d'attention pour l'intégration :
  - Tous les accents manquants sont dans des chaînes JSX ou des constantes TypeScript — aucun n'est dans des fichiers de traduction i18n
  - La constante `AI_DISCLAIMER` (pdf/route.ts ligne 29) est utilisée à deux endroits dans le même fichier — une seule modification suffit
  - La phrase `"Bien sans titre"` (MerchantMode.tsx ligne 346) devrait devenir `"Dossier de présentation"` — elle est utilisée aussi bien dans l'UI (étape résultats) que transmise au composant DossierResult et potentiellement au PDF via l'API
  - Les 5 textes manquants (tooltips, empty states, états partiels) nécessitent des décisions UI avant intégration — signaler à @ux si nécessaire
---
