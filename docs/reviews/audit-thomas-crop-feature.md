# Audit Thomas Berger -- Feature Recadrage/Crop des photos

**Date** : 2026-04-05
**Agent** : Thomas Berger (@marchand-de-biens)
**Scope** : CropModal.tsx + bouton "Recadrer" sur /mes-biens/[id] + API /api/user/photos/[id]/crop
**Version auditee** : code source actuel (pas de deploy teste)

---

## Synthese rapide

La feature est fonctionnelle et bien pensee pour mon usage. Le modal de crop est propre, le slider de zoom est clair, les boutons sont lisibles. Mais il y a 3 problemes que je considere bloquants pour atteindre le seuil 9.5/10 : le crop est irreversible (pas de retour a l'original), le touch target du bouton "Recadrer" est trop petit sur iPhone (32px au lieu de 44px minimum), et le message de confirmation ne guide pas vers l'action suivante (regenerer). Score actuel : **7.8/10**.

---

## Grille d'evaluation (10 criteres /10)

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | **Retrouvabilite** | 9/10 | Le bouton "Recadrer" est sur chaque photo de la fiche bien, la ou je m'attends a le trouver. Je n'ai pas besoin de chercher. Bien. |
| 2 | **Prix/valeur** | 10/10 | Le crop ne coute rien (pas de visuel consomme). C'est une preparation avant generation. Parfait, pas de mauvaise surprise. |
| 3 | **Qualite pro** | 8/10 | Le modal est propre, le fond sombre (#1C1C1E) met la photo en valeur. Le Cropper react-easy-crop est un standard solide. Mais pas d'apercu du resultat final avant de sauvegarder -- je crop a l'aveugle. |
| 4 | **Partage acquereurs** | N/A | Le crop est une action interne, pas de partage implique. |
| 5 | **Gestion d'erreur** | 6/10 | Si le crop echoue, le toast dit "Erreur lors du recadrage." -- c'est vague. C'est mon image ? Le serveur ? Ma connexion ? Et surtout : il n'y a aucun catch visible dans handleSave pour afficher le message a Thomas -- le try/catch fait juste un console.error cote client sans feedback utilisateur. |
| 6 | **Simplicite** | 9/10 | Le parcours est clair : clic Recadrer > zoom/drag > Appliquer. 3 etapes, pas de jargon. Le label "Appliquer le recadrage" est explicite. |
| 7 | **Confiance** | 5/10 | **Probleme majeur.** Le crop ECRASE l'image originale en DB (UPDATE input_image_key). Aucun backup. Si je crop trop serre et que le resultat est mauvais, je ne peux PAS revenir en arriere. Pour un marchand qui gere 8-12 operations, perdre la photo originale d'un chantier c'est un risque inacceptable. |
| 8 | **Completude** | 7/10 | La feature fait le minimum : zoom + drag + sauvegarde. Il manque : (1) indication que c'est irreversible, (2) preview du resultat, (3) possibilite de revenir a l'original, (4) indication du ratio de crop choisi. |
| 9 | **Mobile-first** | 6/10 | Plusieurs problemes iPhone 15 Pro -- voir section detaillee ci-dessous. |
| 10 | **Rapidite** | 9/10 | Le crop est fait cote client (canvas), pas de round-trip serveur pour l'apercu. Seule la sauvegarde fait un appel API. C'est rapide. |

**Score global : 7.8/10** -- en dessous du seuil 9.5/10. Iteration corrective requise.

---

## Analyse detaillee du parcours

### Etape 1 -- Voir le bouton "Recadrer"

**Desktop (1366px)** : le bouton est dans un overlay `sm:opacity-0 sm:group-hover:opacity-100`. Ca veut dire qu'il n'apparait QUE au survol de la photo. Correct pour le desktop, c'est le pattern standard. Mais si Thomas ne survole pas la photo, il ne sait pas que le crop existe.

**Mobile (393px)** : le bouton est `opacity-100` par defaut (avant le breakpoint sm). Correct -- toujours visible sur mobile. Bien.

**Probleme P1 -- Touch target insuffisant** : le bouton a `min-h-[32px]` et `px-2 py-1`. Sur iPhone 15 Pro, le touch target minimum Apple est 44x44px. A 32px de hauteur et ~55px de largeur (texte "Recadrer" + icone + padding), la hauteur est insuffisante. Thomas sur chantier avec les doigts pas forcement propres va rater ce bouton.

**Probleme P2 -- Pas de focus-visible ring** : le bouton a `focus-visible:outline-none` SANS `focus-visible:ring-*`. Ca supprime l'outline native sans la remplacer. Probleme d'accessibilite.

### Etape 2 -- Le modal s'ouvre

**Desktop** : `max-w-2xl w-full` = 672px max. Suffisant pour voir les details. La zone de crop fait `60vh` de hauteur. Sur un ecran 768px de hauteur, ca fait ~460px. Correct.

**Mobile** : le modal a `p-4` de padding autour. Donc sur 393px de large, la zone de crop fait ~361px. Avec `60vh` de hauteur (~507px sur iPhone 15 Pro 852px), c'est utilisable mais serre. Le Cropper react-easy-crop gere le touch/drag nativement, donc pas de conflit scroll. Bien.

**Probleme P3 -- Le modal depend du scroll** : avec le header (py-4 = ~56px), la zone crop (60vh = ~507px), le slider zoom (py-3 = ~44px), et les boutons (py-4 = ~56px), le total fait ~663px. Sur iPhone 15 Pro en mode navigateur (hauteur utile ~710px), ca passe juste. Mais avec la barre d'adresse Safari etendue (hauteur utile ~635px), le bouton "Appliquer" pourrait etre hors ecran. Il faudrait `max-h-[90vh]` + `overflow-y: auto` sur le contenu sous le crop, ou reduire le crop a `50vh` sur mobile.

### Etape 3 -- Zoom et positionnement

Le slider zoom est `flex-1` avec `accent-sage` et `h-1`. Sur mobile, la hauteur de 1px (h-1 = 4px avec Tailwind) rend le slider tres fin a manipuler au doigt. Le thumb du range input natif est OK sur iOS (assez gros), mais la track est quasi invisible.

Le zoom va de 1x a 3x avec un pas de 0.05. C'est suffisant pour corriger un grand angle. L'affichage "100%" a "300%" est clair.

**Aspect ratio libre** (`aspect={undefined}`) : Thomas peut cropper dans n'importe quel ratio. C'est flexible mais risque : si Thomas crop en 1:1 une photo paysage, le visuel genere sera carre au lieu de paysage. Pas de warning.

### Etape 4 -- Appliquer le recadrage

Le bouton "Appliquer le recadrage" passe a "Recadrage..." pendant la sauvegarde. `min-h-[44px]` -- bon touch target. Bouton Sage, bien visible.

**Probleme P4 -- Pas de confirmation avant action irreversible** : un clic = le crop est sauvegarde et l'original est perdu. Pas de dialog "Attention, cette action est irreversible. L'image originale sera remplacee." Pour un marchand qui gere des dizaines de photos de chantier, c'est risque.

### Etape 5 -- Apres le crop

Le toast dit : "Photo recadree. Vous pouvez regenerer le visuel."

**Probleme P5 -- Message sans action** : le toast informe mais ne guide pas. Il devrait proposer un bouton "Regenerer" directement dans le toast, ou au minimum scroller vers le bouton de regeneration. Thomas lit "Vous pouvez regenerer", mais ou est le bouton ? Il doit le chercher.

**Bien** : `fetchPhotos()` est appele apres le crop -- la galerie se rafraichit avec la nouvelle image. Thomas voit immediatement le changement.

### Etape 6 -- Irreversibilite

**Probleme P0 -- L'original est perdu** : l'API fait `UPDATE user_photos SET input_image_key = $1`. L'ancien `input_image_key` est ecrase. L'image originale dans Object Storage n'est pas supprimee (pas de delete), mais la reference est perdue. Thomas ne peut pas revenir a l'original.

C'est le probleme le plus grave. Sur mes 8-12 operations, je prends 50-100 photos de chantier par an. Si je crop trop serre une photo et que le visuel genere est mauvais, je dois retourner sur le chantier pour reprendre la photo. Inacceptable.

---

## Problemes detectes et corrections

### P0 -- CRITIQUE : Crop irreversible, original perdu

**Fichier** : `app/api/user/photos/[id]/crop/route.ts`
**Probleme** : `UPDATE user_photos SET input_image_key = $1` ecrase l'original sans backup.
**Impact Thomas** : perte definitive de la photo de chantier originale.

**Correction** :
```diff
// Dans route.ts, AVANT le UPDATE :
+    // Backup the original input key before overwriting
+    await db.query(
+      `UPDATE user_photos SET original_input_key = COALESCE(original_input_key, input_image_key)
+       WHERE id = $1 AND user_id = $2`,
+      [params.id, session.user.id]
+    );
```
Et ajouter la colonne `original_input_key` dans le schema user_photos (migration).
Et ajouter un bouton "Revenir a l'original" sur la fiche bien quand `original_input_key IS NOT NULL`.

### P1 -- HAUTE : Touch target "Recadrer" trop petit (32px)

**Fichier** : `app/mes-biens/[id]/page.tsx` ligne 983
**Probleme** : `min-h-[32px]` au lieu de `min-h-[44px]`.

**Correction** :
```diff
- className="bg-foreground/70 text-white text-xs px-2 py-1 rounded-lg font-medium hover:bg-foreground/90 focus-visible:outline-none min-h-[32px] flex items-center gap-1"
+ className="bg-foreground/70 text-white text-xs px-3 py-2 rounded-lg font-medium hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 min-h-[44px] flex items-center gap-1.5"
```

### P1 -- HAUTE : Pas de confirmation avant crop irreversible

**Fichier** : `components/CropModal.tsx` ligne 65 (handleSave)
**Probleme** : le crop s'applique directement sans avertissement.

**Correction** : ajouter un `window.confirm()` minimal ou mieux, un texte d'avertissement visible en permanence dans le modal :
```diff
// Dans CropModal.tsx, sous le slider zoom :
+        <p className="px-5 text-xs text-muted/70 font-light">
+          L&apos;image originale est conservee. Vous pourrez revenir en arriere.
+        </p>
```
(Ce message ne devient vrai qu'avec le fix P0 ci-dessus.)

### P2 -- HAUTE : Bouton "Appliquer" potentiellement hors ecran sur iPhone

**Fichier** : `components/CropModal.tsx` ligne 102
**Probleme** : la zone crop fait 60vh, le modal total peut depasser la hauteur utile Safari.

**Correction** :
```diff
- <div className="relative w-full" style={{ height: "60vh" }}>
+ <div className="relative w-full" style={{ height: "min(60vh, 400px)" }}>
```
Ou mieux, utiliser une classe Tailwind responsive :
```diff
- <div className="relative w-full" style={{ height: "60vh" }}>
+ <div className="relative w-full h-[50vh] sm:h-[60vh]">
```

### P2 -- HAUTE : Focus-visible manquant sur le bouton "Recadrer"

**Fichier** : `app/mes-biens/[id]/page.tsx` ligne 983
**Probleme** : `focus-visible:outline-none` sans ring de remplacement.

**Correction** : integree dans le fix P1 touch target ci-dessus (`focus-visible:ring-2 focus-visible:ring-sage/50`).

### P2 -- HAUTE : Erreur crop silencieuse cote client

**Fichier** : `components/CropModal.tsx` ligne 72
**Probleme** : le catch fait `console.error` mais ne remonte pas l'erreur a Thomas.

**Correction** :
```diff
    } catch (err) {
      console.error("Erreur recadrage:", err);
+     alert("Le recadrage a echoue. Reessayez.");
    } finally {
```
Ou mieux, ajouter un state `errorMsg` affiche dans le modal.

### P3 -- MOYENNE : Pas d'indication du ratio de crop

**Fichier** : `components/CropModal.tsx`
**Probleme** : Thomas peut cropper en n'importe quel ratio sans savoir que ca changera le format du visuel genere.
**Suggestion** : ajouter des presets de ratio (16:9, 4:3, 1:1, libre) ou au minimum afficher les dimensions resultantes sous le slider zoom.

### P3 -- MOYENNE : Toast sans action directe

**Fichier** : `app/mes-biens/[id]/page.tsx` ligne 1411
**Probleme** : "Photo recadree. Vous pouvez regenerer le visuel." sans bouton ni lien.
**Suggestion** : apres le crop, scroller vers la photo concernee et afficher un badge "Recadree - Regenerer ?" sur la photo.

---

## Reponses aux questions Thomas

### "Est-ce que la photo originale est perdue apres le crop ?"

**Oui, actuellement c'est irreversible.** L'API ecrase `input_image_key` sans sauvegarder l'original. L'image physique reste dans Object Storage (pas de delete), mais la reference en DB est perdue. C'est le probleme P0.

### "Est-ce que Thomas comprend que le crop change l'INPUT, pas l'OUTPUT ?"

**Partiellement.** Le titre "Recadrer la photo originale" (attribut title du bouton) est clair. Le toast "Photo recadree. Vous pouvez regenerer le visuel." aussi. Mais dans le modal lui-meme, il n'y a aucune explication de ce que le crop fait concretement (changer l'image source pour la prochaine generation). Un texte d'explication en haut du modal serait utile.

### "Est-ce que le feedback est suffisant ?"

**Non.** Le toast informe mais ne guide pas vers l'action suivante. Thomas sait que c'est fait, mais il doit trouver seul comment regenerer. Il faudrait un CTA directement apres le crop.

### "Thomas voudrait-il pouvoir annuler le crop et revenir a l'original ?"

**Absolument oui.** C'est la demande numero 1. Sur un chantier, je prends les photos une seule fois. Si le crop est rate, je ne peux pas retourner sur place juste pour une photo. La restauration de l'original est indispensable.

---

## Verdict

**Score : 7.8/10 -- en dessous du seuil 9.5/10.**

La feature est une bonne idee qui repond a un vrai besoin (corriger les grands angles de chantier). L'implementation technique est propre (canvas client, react-easy-crop, API securisee). Mais l'absence de reversibilite, les touch targets insuffisants, et le manque de guidage post-crop empechent d'atteindre le standard Versimo.

### Corrections prioritaires pour atteindre 9.5/10

| Priorite | Correction | Impact score estime |
|----------|------------|---------------------|
| P0 | Sauvegarder l'original + bouton "Revenir a l'original" | +0.8 (confiance 5 > 9) |
| P1 | Touch target 44px + focus-visible ring | +0.3 (mobile 6 > 8) |
| P2 | Hauteur crop responsive (50vh mobile / 60vh desktop) | +0.2 (mobile 8 > 9) |
| P2 | Feedback erreur visible dans le modal | +0.2 (erreur 6 > 8) |
| P3 | Toast avec CTA "Regenerer" ou scroll vers la photo | +0.1 (completude 7 > 8) |
| P3 | Texte explicatif dans le modal | +0.1 (simplicite) |

Apres P0+P1+P2 : score estime ~9.4/10. Avec les P3 : ~9.6/10.

---

## Handoff

**Destinataire** : @fullstack
**Action** : appliquer les corrections P0 (migration DB + backup original + bouton restore), P1 (touch targets), P2 (hauteur responsive + erreur visible)
**Fichiers a modifier** :
- `lib/user-photos.ts` -- migration `original_input_key`
- `app/api/user/photos/[id]/crop/route.ts` -- backup avant UPDATE
- `app/mes-biens/[id]/page.tsx` -- touch targets + bouton "Revenir a l'original"
- `components/CropModal.tsx` -- hauteur responsive + feedback erreur + texte explicatif
**Pre-requis** : `npx tsc --noEmit` avant commit (regle P0 session 28)
