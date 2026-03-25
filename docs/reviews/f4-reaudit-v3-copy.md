# Re-audit copy F4 — Mode Marchand V3 (post-corrections C1-C6)
> Produit par @copywriter — 2026-03-25
> Périmètre : MerchantMode.tsx, DossierProgress.tsx, DossierResult.tsx, app/mes-dossiers/page.tsx, app/compte/page.tsx, app/dossier/[uuid]/page.tsx, app/api/dossier/[uuid]/pdf/route.ts, lib/dossier.ts
> Référence amont : f4-reaudit-copy.md (V2, note 8,1/10, 6 corrections C1-C6 identifiées)

---

## Note globale V3 : 8,6 / 10

Delta : +0,5 point vs V2. Les corrections apportées en V3 ont résolu 3 des 6 points identifiés (C1, C2, C4 partiellement), et introduit deux périmètres nouveaux (page /mes-dossiers et page /compte) qui contiennent des résidus d'accents non corrigés. La note stagne en dessous de 9 car trois lacunes persévèrent : C3 (alt "apres"), C5 (getDossierTitle fallback "Bien sans titre"), C6 (état partial page publique), et 7 nouvelles occurrences sans accent identifiées dans les périmètres élargis.

---

## Tableau des 7 critères — comparatif V1 / V2 / V3

| Critère | Note V1 | Note V2 | Note V3 | Delta V2→V3 | État en V3 |
|---|---|---|---|---|---|
| **1. Vocabulaire Thomas** | 5/10 | 7,5/10 | 8/10 | +0,5 | m² et € corrects dans le récapitulatif (C1, C2 résolus). "Nombre de pieces" sans accent dans MerchantMode.tsx reste. Placeholder adresse "Commencez a taper" sans accent reste. |
| **2. Clarté** | 7/10 | 8/10 | 8,5/10 | +0,5 | "Etape suivante" (C4 partiellement résolu — le libellé est désormais neutre et non ambigu, acceptable). "Creer un dossier" sur l'empty state /mes-dossiers reste sans accent. Description commerciale "Generee automatiquement" reste sans accent. |
| **3. Cohérence tonale** | 6/10 | 8/10 | 8/10 | 0 | Aucune régression. "Identite visuelle" et "Apercu" sur /compte cassent légèrement la cohérence premium — un marchands de biens qui voit ces labels pense à une interface de devis artisanal, pas à un outil pro. |
| **4. Messages d'erreur** | 4/10 | 8,5/10 | 8,5/10 | 0 | Aucune régression. Nouvelles erreurs dans /compte : "Erreur de connexion. Reessayez." (sans accent), "Logo enregistre." (sans accent), "Profil enregistre." (sans accent), "Format invalide. Seuls PNG et JPG sont acceptes." (sans accent). Ces messages sont dans le périmètre V3 — à corriger. |
| **5. CTA** | 5/10 | 8/10 | 8,5/10 | +0,5 | "Etape suivante" corrigé (C4 : libellé neutre, non ambigu). "Creer un dossier" sur /mes-dossiers sans accent. WhatsApp label "WhatsApp" seul dans le bouton visible — aria-label "Partager via WhatsApp" correct mais le label visible manque de contexte pour un utilisateur desktop. |
| **6. PDF professionnel** | 5/10 | 8/10 | 7,5/10 | −0,5 | Régression identifiée : getDossierTitle() retourne "Bien sans titre — {date}" comme fallback (lib/dossier.ts ligne 386). Ce texte apparaît en titre de couverture PDF lorsque l'utilisateur n'a pas renseigné de nom de bien. "Bien sans titre" est un label interne à ne pas exposer à des acquéreurs. Préoccupation maintenue depuis V2. Disclaimer page publique acquéreur non corrigé : "Visuels generes par intelligence artificielle a titre de simulation" — sans accents (ligne 233). |
| **7. Accents et typographie** | 4/10 | 9,5/10 | 8,5/10 | −1 | Régression numérique : C3 (alt "apres") non corrigé. 7 nouvelles occurrences sans accent dans les périmètres V3 : "Creez" (mes-dossiers), "Creer" (mes-dossiers), "Termine" (status badge), "Apercu" (compte), "Identite visuelle" (compte), "Reessayez" (compte), "Generee automatiquement" (MerchantMode), "Telephone" (compte), "acceptes" (compte), "enregistre" (compte × 2), "Connectez-vous pour acceder" (compte), "Visuels generes" + "a titre de simulation" (page publique). La note baisse car les périmètres élargis n'ont pas été nettoyés. |

---

## Analyse des 6 corrections C1-C6 — statut en V3

| Correction | Statut V3 | Preuve dans le code |
|---|---|---|
| **C1 — m² dans le récapitulatif** | Résolu | MerchantMode.tsx ligne 812 : `{bienSurface} m{"\u00B2"}` — correct |
| **C2 — € dans le récapitulatif** | Résolu | MerchantMode.tsx ligne 813 : `{Number(bienPrix).toLocaleString("fr-FR")} {"\u20AC"}` — correct |
| **C3 — alt "apres" dans DossierResult** | Non résolu | DossierResult.tsx ligne 182 : `alt={...} — apres` — faute persistante |
| **C4 — CTA navigation étape photos** | Partiellement résolu | MerchantMode.tsx ligne 733 : `Etape suivante` — libellé neutre et non ambigu mais sans accent |
| **C5 — getDossierTitle() fallback** | Non résolu | lib/dossier.ts ligne 386 : `"Bien sans titre — ${date}"` — label interne exposé sur le PDF |
| **C6 — état "partial" page publique** | Non résolu | app/dossier/[uuid]/page.tsx — aucune mention de l'état partial, pas de message contextuel |

---

## Inventaire complet des résidus V3

### Groupe A — Résidus hérités de V2 non corrigés (priorité haute)

**A1 — alt sans accent dans DossierResult.tsx**
- Fichier : `components/DossierResult.tsx`, ligne 182
- Actuel : `alt={\`${photo.roomLabel || "Photo"} — apres\`}`
- Corrigé : `alt={\`${photo.roomLabel || "Photo"} — après\`}`
- Impact : attribut public lu par lecteurs d'écran + moteurs.

**A2 — getDossierTitle() fallback exposé sur le PDF**
- Fichier : `lib/dossier.ts`, ligne 386
- Actuel : `return \`Bien sans titre — ${date.toLocaleDateString("fr-FR")}\`;`
- Corrigé : `return \`Dossier de présentation — ${date.toLocaleDateString("fr-FR")}\`;`
- Impact : titre de couverture PDF visible par les acquéreurs de Thomas.

**A3 — État "partial" sans message acquéreur**
- Fichier : `app/dossier/[uuid]/page.tsx`, après la ligne 173 (bloc des métadonnées du bien)
- Actuel : aucune distinction entre `"completed"` et `"partial"` pour l'acquéreur
- À ajouter (conditionnel) :
  ```
  {dossier.status === "partial" && (
    <p className="text-xs text-amber-600 font-light mt-1">
      Ce dossier présente {completedPhotos.length} visuel{completedPhotos.length > 1 ? "s" : ""} — la génération de certaines pièces n'a pas abouti.
    </p>
  )}
  ```
- Impact : crédibilité de Thomas auprès de ses acquéreurs.

---

### Groupe B — Nouveaux résidus V3 (périmètres /mes-dossiers et /compte)

**B1 — Empty state /mes-dossiers : accents manquants**
- Fichier : `app/mes-dossiers/page.tsx`, lignes 158 et 164
- Actuel : `Aucun dossier. Creez votre premier dossier en Mode Marchand.` / `Creer un dossier`
- Corrigé : `Aucun dossier. Créez votre premier dossier en Mode Marchand.` / `Créer un dossier`
- Impact : premier contact avec la page pour un nouveau compte — la faute est immédiatement visible.

**B2 — Badge statut "Termine" sans accent**
- Fichier : `app/mes-dossiers/page.tsx`, ligne 34
- Actuel : `label: "Termine"`
- Corrigé : `label: "Terminé"`
- Impact : badge affiché sur chaque dossier complété — visible à chaque session de Thomas.

**B3 — DossierProgress : "Pret" et "Echec" sans accent**
- Fichier : `components/DossierProgress.tsx`, lignes 119 et 121
- Actuel : `"Pret"` / `"Echec"`
- Corrigé : `"Prêt"` / `"Échec"`
- Impact : labels affichés pendant et après la génération — séquence critique du tunnel.

**B4 — /compte : accents manquants (groupe)**
- Fichier : `app/compte/page.tsx`
- Inventaire :
  - Ligne 239 : `"Connectez-vous pour acceder a votre profil marchand."` → `"Connectez-vous pour accéder à votre profil marchand."`
  - Ligne 291 : `"Active le branding personnalise sur vos dossiers et PDF."` → `"Active le branding personnalisé sur vos dossiers et PDF."`
  - Ligne 385 : `Telephone` → `Téléphone`
  - Ligne 415 : `Identite visuelle` → `Identité visuelle`
  - Ligne 537 : `Apercu` → `Aperçu`
  - Ligne 133 : `"Erreur de connexion. Reessayez."` → `"Erreur de connexion. Réessayez."`
  - Ligne 145 : `"Format invalide. Seuls PNG et JPG sont acceptes."` → `"Format invalide. Seuls PNG et JPG sont acceptés."`
  - Ligne 178 : `"Logo enregistre."` → `"Logo enregistré."`
  - Ligne 215 : `"Profil enregistre."` → `"Profil enregistré."`
- Impact : page /compte est le premier contact d'un marchand de biens qui configure son branding — les fautes d'accent sur les labels de formulaire signalent un manque de soin incompatible avec le positionnement premium de Versiroom.

**B5 — MerchantMode : résidus sans accent dans les périmètres V3**
- Fichier : `components/MerchantMode.tsx`
- Inventaire :
  - Ligne 481 : `"Commencez a taper : 45 rue de la Paix, 75002 Paris"` → `"Commencez à taper : 45 rue de la Paix, 75002 Paris"`
  - Ligne 563 : `Nombre de pieces` → `Nombre de pièces`
  - Ligne 630 : `"Generee automatiquement — vous pouvez la modifier."` → `"Générée automatiquement — vous pouvez la modifier."`
- Impact : le placeholder d'adresse est le champ le plus utilisé dans le formulaire info. "Commencez a taper" est la première chose que lit Thomas quand il saisit l'adresse d'un bien.

**B6 — Page publique acquéreur : disclaimer sans accents**
- Fichier : `app/dossier/[uuid]/page.tsx`, ligne 233
- Actuel : `"Visuels generes par intelligence artificielle a titre de simulation. Versiroom — versiroom.fr"`
- Corrigé : `"Visuels générés par intelligence artificielle à titre de simulation. Versiroom — versiroom.fr"`
- Impact : texte lu par les acquéreurs de Thomas. Un disclaimer avec fautes d'orthographe fragilise la crédibilité du document professionnel.

**B7 — aria-label "Partager avec un acquereur" sans accent**
- Fichier : `components/DossierResult.tsx`, ligne 107
- Actuel : `aria-label="Partager avec un acquereur"`
- Corrigé : `aria-label="Partager avec un acquéreur"`
- Impact : lu par les lecteurs d'écran. Cohérence avec le label visible ligne 115 ("Partager avec un acquéreur" — déjà correct).

---

## Tableau synthèse — chemin vers 9/10

| Ref | Correction | Fichier | Lignes | Effort | Impact |
|---|---|---|---|---|---|
| A1 | alt "après" | DossierResult.tsx | 182 | 1 min | Accessibilité |
| A2 | getDossierTitle fallback | lib/dossier.ts | 386 | 2 min | PDF acquéreurs |
| A3 | État partial page publique | app/dossier/[uuid]/page.tsx | après 173 | 10 min | Crédibilité Thomas |
| B1 | Empty state /mes-dossiers | app/mes-dossiers/page.tsx | 158, 164 | 2 min | Premier contact |
| B2 | Badge "Terminé" | app/mes-dossiers/page.tsx | 34 | 1 min | Récurrence |
| B3 | "Prêt" / "Échec" | DossierProgress.tsx | 119, 121 | 1 min | Tunnel principal |
| B4 | Accents /compte (groupe) | app/compte/page.tsx | 9 occurrences | 10 min | Page pro marchand |
| B5 | Accents MerchantMode (groupe) | MerchantMode.tsx | 481, 563, 630 | 5 min | Formulaire principal |
| B6 | Disclaimer sans accents | app/dossier/[uuid]/page.tsx | 233 | 1 min | Document acquéreur |
| B7 | aria-label acquereur | DossierResult.tsx | 107 | 1 min | Accessibilité |

**Effort total estimé : 35 minutes de développement.**

---

## Ce qui n'a pas besoin d'être retouché

Les éléments suivants sont consolidés et ne doivent pas être modifiés :

- m² et € dans le récapitulatif (C1, C2 résolus en V3) — MerchantMode.tsx lignes 812-813
- m² dans le label du champ surface — MerchantMode.tsx ligne 549 : `Surface (m{"\u00B2"})` correct
- € dans le label prix — MerchantMode.tsx ligne 577 : `Prix ({"\u20AC"})` correct
- Prix moyen enrichi : `{enrichedPrixM2.toLocaleString("fr-FR")} {"\u20AC"}/m{"\u00B2"}` correct (ligne 524)
- "Etape suivante" : libellé neutre et fonctionnel — ne pas modifier pour éviter une régression de clarté
- "Partager avec un acquéreur" (label visible) — DossierResult.tsx ligne 115, correct
- "Relancer (1 crédit)" — actionnable et transparent
- "Si une photo échoue, le crédit correspondant est automatiquement restitué." — micro-copy de rassurance, correct
- "Génération en cours..." / "Terminé" dans DossierProgress header — correct (ligne 39-40)
- Disclaimer PDF : `"Visuels generes par IA a titre indicatif — Powered by Versiroom"` — acceptable (document interne)
- formatSurface() — lib/dossier.ts : `${surface} m\u00B2` correct
- formatPrice() — lib/dossier.ts : Intl.NumberFormat currency EUR est correct pour le PDF (notation comptable standard)
- Métadonnées OG page publique — app/dossier/[uuid]/page.tsx : "Visuels meublés par Versiroom" correct
- "Génération en cours, revenez dans quelques instants." — page publique, correct
- `"Dossier partagé"` dans l'en-tête page publique si pas de marchand — neutre et pro
- `formatDate()` /mes-dossiers — Intl.DateTimeFormat fr-FR correct

---

## Projection de note post-corrections

| Scénario | Note projetée |
|---|---|
| Corrections A1 + A2 + B3 + B6 uniquement (20 min) | 8,9/10 |
| Toutes les corrections (A1-A3 + B1-B7) | 9,3/10 |
| A3 (état partial) seule correction reportée | −0 (edge case rare, ne bloque pas le 9) |

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/reviews/f4-reaudit-v3-copy.md`
- Décisions prises :
  - Note V3 portée à 8,6/10 — les corrections C1 et C2 (m² et €) sont validées comme intégrées
  - C4 ("Etape suivante") est acceptable : libellé neutre, non ambigu — ne pas modifier
  - C5 (getDossierTitle fallback) confirmé comme non résolu : "Bien sans titre" est encore dans lib/dossier.ts ligne 386 — à corriger en priorité haute car visible sur le PDF acquéreur
  - 7 nouvelles zones sans accent identifiées dans /compte et /mes-dossiers (périmètres V3 non auditées en V2)
  - B4 (accents /compte) est le groupe le plus impactant : 9 occurrences sur la page de configuration du branding marchand
- Points d'attention :
  - Distinction entre `"Terminé"` (badge status dans mes-dossiers) et `"Terminé"` (header DossierProgress) — les deux sont distincts, vérifier les deux
  - A3 (état partial page publique) est conditionnel à `dossier.status === "partial"` — ne pas afficher pour les dossiers `"completed"`
  - B6 (disclaimer page publique) est côté serveur (Server Component) — pas de state à gérer, simple correction de string
  - Vérifier DossierPublicView.tsx pour des alt similaires à "apres" non encore audités dans ce rapport
