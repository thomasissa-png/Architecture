# Re-audit copy F4 — Mode Marchand V4 (nouvelles surfaces post-refonte architecture)
> Produit par @copywriter — 2026-03-25
> Périmètre V4 : app/mes-biens/page.tsx, app/mes-biens/[id]/page.tsx, app/ma-galerie/page.tsx, components/PhotoAssociator.tsx, components/DossierProgress.tsx, components/DossierResult.tsx, app/dossier/[uuid]/page.tsx, app/api/dossier/[uuid]/pdf/route.ts
> Référence amont : f4-reaudit-v3-copy.md (V3, note 8,6/10, résidus A1-A3 + B1-B7 identifiés)

---

## Note globale

| Version | Note | Delta |
|---|---|---|
| **V1** (audit initial) | 5,9/10 | — |
| **V2** (post-corrections C1-C2) | 8,1/10 | +2,2 |
| **V3** (post-corrections C3 partielles + périmètre élargi) | 8,6/10 | +0,5 |
| **V4** (nouvelles surfaces + état résidus V3) | **8,9/10** | +0,3 |

Le delta V3→V4 est modeste (+0,3) mais le périmètre est sensiblement élargi. La bonne nouvelle : les corrections B3 (DossierProgress "Prêt" / "Échec") et A2 (getDossierTitle fallback → "Dossier de présentation") ont été appliquées avec succès. La moins bonne : les nouvelles surfaces introduisent un stock de résidus sans accent qui empêche d'atteindre 9/10 sans une dernière passe de nettoyage.

---

## Tableau des 7 critères — comparatif complet V1→V4

| Critère | V1 | V2 | V3 | V4 | Delta V3→V4 | État en V4 |
|---|---|---|---|---|---|---|
| **1. Vocabulaire Thomas** | 5/10 | 7,5/10 | 8/10 | 7,5/10 | −0,5 | Les nouvelles pages /mes-biens introduisent "m2", "EUR", "pieces" sans unité typographiquement correcte. Thomas voit ces labels quand il saisit ses biens. Régression partielle sur des surfaces qui n'existaient pas en V3. |
| **2. Clarté** | 7/10 | 8/10 | 8,5/10 | 8,5/10 | 0 | Pas de régression. Le flow mes-biens → fiche → dossier est lisible. "Description en cours d'enrichissement..." est clair et empathique. "Carte en chargement..." idem. |
| **3. Cohérence tonale** | 6/10 | 8/10 | 8/10 | 8/10 | 0 | Les nouvelles pages maintiennent le registre premium sobre. Seule ombre : "Bien sans adresse" (PhotoAssociator, galerie, fiche) — label technique acceptable mais légèrement froid pour Thomas qui partage ces visuels avec des acquéreurs. |
| **4. Messages d'erreur** | 4/10 | 8,5/10 | 8,5/10 | 7,5/10 | −1 | Régression sur les nouvelles surfaces. Trois patterns problématiques identifiés : (1) alert() natif dans app/mes-biens/[id]/page.tsx (lignes 216 et 219) — rupture d'expérience brutale, pas cohérent avec le design system. (2) "Erreur reseau." sans accent. (3) "Erreur lors de la creation." sans accent. Ces messages sont déclenchés dans le tunnel de création de dossier — le moment le plus critique du parcours Thomas. |
| **5. CTA** | 5/10 | 8/10 | 8,5/10 | 8,5/10 | 0 | Les CTA des nouvelles pages sont corrects dans l'ensemble. "Ajouter mon premier bien" sur l'empty state est exact. "+ Générer pour ce bien" (ligne 413) : accent présent. Exception : "Creer le bien" et "Creer un dossier" sans accent — deux CTA primaires dans le formulaire et la modal. |
| **6. PDF professionnel** | 5/10 | 8/10 | 7,5/10 | 8,5/10 | +1 | A2 résolu : getDossierTitle() retourne désormais "Dossier de présentation — {date}" au lieu de "Bien sans titre". Gain majeur. Résidu restant : "Apres home staging" (sans accent) dans le label imprimé sur chaque page avant/après du PDF — visible par les acquéreurs. "nb_pieces" formaté "3 pieces" sans accent dans la ligne info de couverture. |
| **7. Accents et typographie** | 4/10 | 9,5/10 | 8,5/10 | 8/10 | −0,5 | B3 résolu : "Prêt" et "Échec" corrects dans DossierProgress. A2 résolu. Mais les nouvelles surfaces /mes-biens et /ma-galerie introduisent 18 occurrences sans accent ou avec unités mal formatées — volume supérieur aux périmètres V3. |

---

## Inventaire complet des résidus V4

### Groupe A — Résidus hérités de V3 non corrigés

**A1 — alt sans accent dans DossierResult.tsx**
- Fichier : `components/DossierResult.tsx`, ligne 198
- Actuel : `download={\`${photo.roomLabel || 'photo'}-apres.jpg\`}`
- Note : le alt ligne 182 que V3 avait identifié semble avoir été corrigé (non trouvé dans le fichier actuel). En revanche le nom de fichier téléchargé contient "apres" sans accent — moins critique mais cohérence à maintenir.
- Corrigé : `download={\`${photo.roomLabel || 'photo'}-apres.jpg\`}` → inchangeable (noms de fichiers sans accents = convention système). Ce point n'est PAS une correction à apporter.

**A1-bis — alt sans accent dans DossierPublicView.tsx**
- Fichier : `components/DossierPublicView.tsx`, ligne 64
- Actuel : `alt={\`${photo.roomLabel} — apres\`}`
- Corrigé : `alt={\`${photo.roomLabel} — après\`}`
- Impact : attribut lu par les lecteurs d'écran sur la page publique acquéreur.

**A2 — getDossierTitle() fallback** : RÉSOLU. `lib/dossier.ts` ligne 386 retourne désormais "Dossier de présentation — {date}". Validé.

**A3 — État "partial" page publique** : PARTIELLEMENT RÉSOLU.
- `app/dossier/[uuid]/page.tsx` ligne 208-211 : le bloc partial existe désormais avec le bon message.
- Texte actuel : `"Ce dossier présente {n} visuel{s} sur {total} — certaines pièces n'ont pas pu être générées."`
- Verdict : message clair et empathique. Validé.

**B3 — "Prêt" / "Échec" dans DossierProgress** : RÉSOLU. Lignes 119 et 121 confirmées correctes.

---

### Groupe B — Résidus des nouvelles surfaces V4

**V4-1 — Labels formulaire sans accents dans app/mes-biens/page.tsx**

| Ligne | Actuel | Corrigé |
|---|---|---|
| 200 | `{properties.length} bien{...} enregistre{...}` | `{properties.length} bien{...} enregistré{...}` |
| 260 | `Surface (m2)` | `Surface (m²)` |
| 271 | `Nombre de pieces` | `Nombre de pièces` |
| 282 | `Prix de vente (EUR)` | `Prix de vente (€)` |
| 303 | `"Creation..."` | `"Création..."` |
| 303 | `"Creer le bien"` | `"Créer le bien"` |
| 318 | `Aucun bien enregistre.` | `Aucun bien enregistré.` |

**V4-2 — Badges de données dans les cards de la liste (app/mes-biens/page.tsx)**

| Ligne | Actuel | Corrigé |
|---|---|---|
| 352 | `{property.surface_m2} m2` | `{property.surface_m2} m²` |
| 357 | `{property.room_count} pieces` | `{property.room_count} pièce{property.room_count !== 1 ? "s" : ""}` |
| 369 | `{...} EUR/m2 (quartier)` | `{...} €/m² (quartier)` |

Impact : ces badges s'affichent sur chaque card de la liste. Thomas les voit à chaque session.

**V4-3 — Labels et messages dans app/mes-biens/[id]/page.tsx**

| Ligne | Actuel | Corrigé |
|---|---|---|
| 253 | `Retour a mes biens` | `Retour à mes biens` |
| 312 | `{property.surface_m2} m2` | `{property.surface_m2} m²` |
| 317 | `{property.room_count} pieces` | `{property.room_count} pièce{property.room_count !== 1 ? "s" : ""}` |
| 322 | `{...} EUR/m2` | `{...} €/m²` |
| 327 | `{...} EUR` | `{...} €` |
| 413 | `+ Generer pour ce bien` | `+ Générer pour ce bien` |
| 471 | `Creer un dossier` | `Créer un dossier` |
| 497 | `Aucune photo non classee disponible.` | `Aucune photo non classée disponible.` |
| 502 | `{selectedForAssoc.size} photo{...} selectionnee{...}` | `{...} sélectionnée{...}` |
| 561 | `Creer un dossier` (titre modal) | `Créer un dossier` |
| 642 | `Creer le dossier (${n} photo...)` | `Créer le dossier (${n} photo...)` |

**Messages d'erreur avec alert() natif — problème de pattern UX (ligne 216 et 219)**
- Actuel : `alert(data.error || "Erreur lors de la creation du dossier.")` / `alert("Erreur reseau.")`
- Problème copy : accents manquants + usage de alert() natif qui rompt l'expérience
- Recommandation copy : `"Erreur lors de la création du dossier."` / `"Erreur réseau. Réessayez."`
- Note à @fullstack : remplacer alert() par un toast ou un message inline conforme au design system (cohérence avec la page principale qui utilise des toasts)

**Erreur inline createError (ligne 150)**
- Actuel : `"Erreur lors de la creation."` → `"Erreur lors de la création."`

**V4-4 — Labels et filtres dans app/ma-galerie/page.tsx**

| Ligne | Actuel | Corrigé |
|---|---|---|
| 6 (commentaire) | `Permet d'associer des photos non classees a un bien.` | Non applicable (commentaire développeur) |
| 160 | `{photos.length} photo{...} generee{...}` | `{photos.length} photo{...} générée{...}` |
| 184 | `Non classees` (option filtre) | `Non classées` |
| 233 | `Non classee` (badge overlay) | `Non classée` |
| 258 | `Associer a un bien :` | `Associer à un bien :` |
| 341 | `Associer a un bien :` (modal détail) | `Associer à un bien :` |

**V4-5 — PhotoAssociator.tsx**

| Ligne | Actuel | Corrigé |
|---|---|---|
| 71 | `Associer a un bien ?` | `Associer à un bien ?` |

**V4-6 — PDF : label "Apres home staging" sans accent**
- Fichier : `app/api/dossier/[uuid]/pdf/route.ts`, ligne 434
- Actuel : `page.drawText("Apres home staging", ...)`
- Corrigé : `page.drawText("Après home staging", ...)`
- Impact critique : texte imprimé sur chaque page paire du PDF envoyé aux acquéreurs. C'est le document de référence de Thomas.
- Note technique : pdf-lib utilise Helvetica (StandardFonts) qui ne supporte pas les caractères accentués nativement. Vérifier que le rendu est correct, sinon utiliser l'encodage : `"Apr\u00e8s home staging"` ou passer à une police embarquée. Si l'accent ne s'affiche pas, la solution de repli est "Apres staging" (sans le mot "home" pour ne pas amplifier la faute).

**V4-7 — PDF : "nb_pieces" formaté sans accent dans la couverture**
- Fichier : `app/api/dossier/[uuid]/pdf/route.ts`, ligne 295
- Actuel : `` `${dossier.nb_pieces} pieces` ``
- Corrigé : `` `${dossier.nb_pieces} pièce${dossier.nb_pieces > 1 ? "s" : ""}` ``
- Même contrainte Helvetica que V4-6 — utiliser `"pi\u00e8ces"` si nécessaire.

**V4-8 — Page publique acquéreur : "Dossier partage" sans accent**
- Fichier : `app/dossier/[uuid]/page.tsx`, ligne 127
- Actuel : `"Dossier partage"`
- Corrigé : `"Dossier partagé"`
- Impact : affiché dans l'en-tête de la page publique quand le marchand n'a pas de raison sociale. Visible par les acquéreurs.

---

## Synthèse des corrections hérités de V3 — statut en V4

| Ref V3 | Correction | Statut V4 |
|---|---|---|
| A1 | alt "après" DossierResult.tsx | Vecteur déplacé vers DossierPublicView.tsx — voir A1-bis |
| A2 | getDossierTitle() fallback | **RÉSOLU** — "Dossier de présentation" confirmé |
| A3 | État partial page publique | **RÉSOLU** — bloc conditionnel présent ligne 208 |
| B1 | Empty state /mes-dossiers accents | Hors périmètre V4 — à vérifier séparément |
| B2 | Badge "Terminé" mes-dossiers | Hors périmètre V4 — à vérifier séparément |
| B3 | "Prêt" / "Échec" DossierProgress | **RÉSOLU** — confirmé lignes 119 et 121 |
| B4 | Accents /compte (groupe) | Hors périmètre V4 — à vérifier séparément |
| B5 | Accents MerchantMode (groupe) | Hors périmètre V4 — à vérifier séparément |
| B6 | Disclaimer sans accents page publique | À vérifier dans les nouvelles corrections (voir V4-8) |
| B7 | aria-label acquereur DossierResult | À confirmer — non relu dans ce rapport |

---

## Tableau de priorisation — chemin vers 9/10

| Ref | Correction | Fichier | Impact utilisateur | Effort |
|---|---|---|---|---|
| V4-6 | "Après home staging" PDF | pdf/route.ts L.434 | CRITIQUE — document acquéreur | 5 min + test rendu Helvetica |
| V4-3 | Accents + m²/€ fiche bien | mes-biens/[id]/page.tsx | HAUTE — Thomas l'utilise à chaque opération | 15 min |
| V4-1 | Accents + m²/€ liste biens | mes-biens/page.tsx | HAUTE — première page du mode marchand | 10 min |
| V4-4 | Accents galerie | ma-galerie/page.tsx | HAUTE — galerie utilisée post-génération | 10 min |
| V4-3-err | alert() → toast + accents erreurs | mes-biens/[id]/page.tsx | HAUTE — tunnel création dossier | 20 min (implique @fullstack) |
| V4-7 | "pièces" PDF couverture | pdf/route.ts L.295 | MOYENNE — couverture PDF | 5 min + test |
| V4-8 | "Dossier partagé" | dossier/[uuid]/page.tsx L.127 | MOYENNE — page publique sans marchand | 2 min |
| A1-bis | alt "après" DossierPublicView | DossierPublicView.tsx L.64 | BASSE — accessibilité | 1 min |
| V4-5 | PhotoAssociator "à" | PhotoAssociator.tsx L.71 | BASSE — contexte post-génération | 1 min |
| V4-2 | m²/€/pièces dans badges cards | mes-biens/page.tsx | BASSE — affiché mais pas CTA | 5 min |

**Effort total estimé : 74 minutes dont ~20 min coordination @fullstack pour les alert().**

---

## Ce qui ne doit pas être retouché

Les éléments suivants sont consolidés en V4 et ne doivent pas être modifiés :

- `getDossierTitle()` fallback — lib/dossier.ts ligne 386 : "Dossier de présentation — {date}" correct
- `formatSurface()` — lib/dossier.ts : `${surface} m\u00B2` correct
- `formatPrice()` — lib/dossier.ts : Intl.NumberFormat currency EUR correct (PDF)
- "Génération en cours..." / "Terminé" dans DossierProgress header (lignes 39-40) — corrects
- "Prêt" / "Échec" dans DossierProgress (lignes 119, 121) — corrects
- Métadonnées OG page publique — "Visuels meublés par Versimo" correct
- "Génération en cours, revenez dans quelques instants." — page publique, correct
- Bloc partial page publique (ligne 208-211) — message clair et empathique, correct
- "Partager avec un acquéreur" (label visible DossierResult) — correct
- "Relancer (1 crédit)" — actionnable et transparent, correct
- "Si une photo échoue, le crédit correspondant est automatiquement restitué." — micro-copy de rassurance, correct
- Disclaimer PDF route.ts : "Visuels générés par IA à titre indicatif — Powered by Versimo" — correct
- "Avant home staging" (label PDF ligne 408) — correct
- WhatsApp button avec aria-label "Partager via WhatsApp" — correct
- "Description en cours d'enrichissement..." (fiche bien ligne 372) — empathique et clair, correct
- "Carte en chargement..." (fiche bien ligne 386) — neutre et correct
- "Dossier créé avec succès." (modal résultat ligne 572) — CORRECT avec accents (validé)
- "Télécharger le PDF" (modal résultat ligne 579) — correct
- "+ Associer des photos" (fiche bien ligne 407) — correct
- "Ajouter mon premier bien" (empty state mes-biens ligne 321) — correct
- Autocomplete adresse placeholder "12 rue de la Paix, 75002 Paris" (mes-biens ligne 227) — correct

---

## Projection de note post-corrections V4

| Scénario | Note projetée |
|---|---|
| Corrections V4-6 + V4-3 + V4-1 + V4-4 uniquement (35 min) | 9,0/10 |
| Toutes les corrections (V4-1 à V4-8 + A1-bis) | 9,3/10 |
| V4-6 seule (5 min, PDF acquéreur) | 9,0/10 si le reste est ignoré — non, 8,9/10 car les surfaces restent non nettoyées |
| Sans alert() fix (délégué à @fullstack séparément) | 9,0/10 avec les autres corrections |

---

---
**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/reviews/f4-reaudit-v4-copy.md`
- Décisions prises :
  - Note V4 : 8,9/10 — progression de +0,3 vs V3
  - A2 (getDossierTitle fallback) et B3 (DossierProgress "Prêt"/"Échec") validés résolus
  - A3 (état partial) validé résolu avec le bloc conditionnel existant
  - V4-6 est la correction la plus critique : "Apres home staging" dans le PDF visible par les acquéreurs — vérifier la compatibilité Helvetica avant de corriger (pdf-lib ne supporte pas les accents en Helvetica standard, utiliser `"\u00e8"` dans la string)
  - alert() natif dans mes-biens/[id]/page.tsx lignes 216-219 est un problème copy ET UX — remplacer par toast ou message inline, et corriger l'accent dans le message
  - "Non classée" / "Non classées" dans ma-galerie/page.tsx : les deux formes (option filtre et badge overlay) doivent être corrigées simultanément pour cohérence
- Points d'attention :
  - La correction `{property.room_count} pieces` → `{property.room_count} pièce{property.room_count !== 1 ? "s" : ""}` modifie également la logique de pluriel — vérifier que le résultat est bien "1 pièce" (sans "s") et "3 pièces" (avec "s")
  - Pour le PDF (pdf-lib / Helvetica) : les accents français ne sont pas supportés par StandardFonts.Helvetica. Utiliser les codes Unicode échappés : `é = \u00e9`, `è = \u00e8`, `à = \u00e0`, `ê = \u00ea`. Tester en local avant de pousser. Si l'accent produit un carré vide, conserver "Apres staging" comme fallback.
  - B4 (/compte) et B5 (MerchantMode) identifiés en V3 sont hors périmètre de ce rapport V4 — s'assurer qu'ils ont bien été traités dans une passe séparée
---
