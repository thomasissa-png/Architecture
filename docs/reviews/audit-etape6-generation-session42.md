# Audit Etape 6 -- Generation des visuels (Session 42)

**Auditeur** : Thomas Berger, marchand de biens, Bordeaux
**Date** : 2026-04-10
**Fichiers audites** :
- `app/projet/[id]/generation/page.tsx` (page frontend)
- `app/api/pro/projects/[id]/generate/route.ts` (API generation batch)
- `app/api/pro/projects/[id]/status/route.ts` (API polling statut)
- `components/marchand/ProStepper.tsx` (stepper navigation)

---

## Note globale : 6.8 / 10

**Verdict** : L'ecran de generation affiche une bonne progression en temps reel (timer, barre, statut par piece), mais des problemes critiques le plombent -- les prompts de style sont generiques au lieu d'utiliser les vrais surfacePrompt/furniturePrompt du pipeline, pas de retry individuel par piece echouee, pas de verification de paiement/credits, et aucune estimation de cout avant lancement.

---

## Grille 10 criteres Thomas

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Retrouvabilite | 8/10 | Le stepper permet de revenir aux etapes precedentes (toutes les etapes completees sont cliquables). Le bouton "Voir tous mes biens" en fin de generation ramene a la liste. Mais pas de breadcrumb ni de nom du bien visible sur cette page -- si j'ai 8 operations en cours, je ne sais plus quel bien je suis en train de generer. |
| 2 | Prix/valeur | 3/10 | **Rien.** Aucune indication du nombre de visuels qui vont etre generes AVANT le lancement. Pas de cout en credits/euros. Le TODO ligne 131-137 de route.ts confirme que la verification de paiement n'est pas implementee. Je lance une generation sans savoir ce que ca me coute. |
| 3 | Qualite pro | 5/10 | **Les prompts de style sont generiques** (ligne 252-253 de route.ts : `"${styleId} style surfaces."` au lieu des vrais surfacePrompt/furniturePrompt de 60-80 mots de StylePicker.tsx). Les 17 sprints de travail sur les prompts (directions d'eclairage, pieces iconiques, palettes, dimensions mobilier) sont completement ignores. La qualite des visuels sera celle d'un prompt de 5 mots, pas celle du pipeline optimise. |
| 4 | Partage acquereurs | N/A | Pas l'objet de cette etape -- le partage se fait depuis le dossier (etape 7). |
| 5 | Gestion d'erreur | 4/10 | Si une piece echoue, elle affiche un badge rouge "!" et le message d'erreur sous le nom de la piece -- c'est bien. MAIS : pas de bouton "Reessayer" par piece individuelle. Si 1 piece echoue sur 6, je dois relancer TOUTE la generation (le bouton Reessayer fait un `window.location.reload()`). Et les pieces deja done seront-elles re-generees ? Le code check le statut avant de trigger, mais le rate limiter de 120s pourrait bloquer. |
| 6 | Simplicite | 8/10 | La generation se lance toute seule au chargement de la page (apres check de statut). Pas de bouton a cliquer pour commencer. C'est le bon choix -- quand j'arrive a l'etape 6, c'est que je veux generer. |
| 7 | Confiance | 7/10 | Timer visible, barre de progression avec pourcentage, estimation "~X minutes", statut par piece avec animation pulse bleue pour "en cours". Bon. Mais l'estimation est fixe (~1.5 min par piece) sans s'adapter au rythme reel. Et quand le timer depasse l'estimation, aucun message de reassurance. |
| 8 | Completude | 7/10 | Apres generation, chaque piece affiche sa vignette, son nom, son lot. Le bouton "Voir le dossier" mene au PDF. Mais pas de lien pour voir un visuel en grand depuis cette page -- la vignette est un `<img>` sans onClick. Sur un iPhone, je ne peux pas zoomer pour verifier la qualite avant de passer au dossier. |
| 9 | Mobile-first | 7/10 | La grille est `grid-cols-1 sm:grid-cols-2` -- 1 colonne sur iPhone, 2 sur tablette. Les touch targets du stepper mobile font 44px (Apple minimum). Les boutons de fin font py-3 px-4 = bien dimensionnes. Mais le stepper mobile vertical prend beaucoup de place (7 etapes affichees) et pousse le contenu de generation sous le fold. |
| 10 | Rapidite | 7/10 | Max 2 pieces en parallele (MAX_CONCURRENT = 2), deadline de 150s pour eviter le 504 Replit. Le polling est a 3 secondes -- reactif. Mais 2 en parallele pour 6+ pieces ca fait au minimum 4.5 minutes. Et le pipeline fait 2 passes (surfaces + mobilier) donc c'est plutot ~9 minutes pour 6 pieces. L'estimation affichee (~1.5 min par piece = ~9 min pour 6) est honnete. |

---

## Points positifs

1. **Check de statut avant trigger** (lignes 92-115 de page.tsx) : si la generation est deja "done" ou "generating", la page affiche les resultats sans re-lancer. Le probleme de re-generation au reload identifie dans lessons-learned est effectivement corrige.

2. **Barre de progression + timer + statut par piece** : l'UX de generation est claire -- je vois quelle piece est en cours ("Preparation de la piece" / "Ajout du mobilier"), combien sont terminees, et depuis combien de temps ca tourne.

3. **Cascade d'image intelligente** (lignes 300-304) : affiche l'image output si disponible, sinon l'image pass1 (surfaces sans mobilier) avec un blur, sinon un placeholder. Je vois un resultat intermediaire flou pendant que la passe 2 tourne -- c'est bien.

4. **Gestion propre du rate limit serveur** : 1 seule generation a la fois par projet (rate limit 120s), reponse 409 si deja en cours, et le client gere le 409 en passant directement en mode polling.

5. **Messages d'erreur en francais et actionnables** : "Aucune piece n'a de photo source. Uploadez des photos avant de generer." -- je sais quoi faire.

---

## Problemes et corrections

### P0 -- Prompts de style generiques (CRITIQUE - qualite des visuels)

**Fichier** : `app/api/pro/projects/[id]/generate/route.ts`, lignes 252-253
**Impact** : Les visuels generes seront de qualite mediocre. Les 17 sprints d'optimisation des prompts (directions d'eclairage, pieces iconiques Eames/PH5/Wegner, palettes couleur, dimensions mobilier, distribution en profondeur) sont completement ignores.
**Constat** :
```typescript
const surfacePrompt = `${styleId} style surfaces. ${dimensionBlock}`;
const furniturePrompt = `${styleId} style furniture for ${room.room_type}. ${dimensionBlock}`;
```
Au lieu d'utiliser les vrais prompts detailles de StylePicker.tsx (60-80 mots chacun avec luminaires specifiques, materiaux de sol, formes de mobilier, textiles).

**Correction** : Importer les STYLES (ou un dictionnaire equivalent) depuis StylePicker.tsx (ou un fichier partage `lib/style-prompts.ts`). Mapper `room.style_id` vers le `surfacePrompt` et `furniturePrompt` detailles du style. Pour le custom, utiliser `room.custom_style_text` avec le pre-processing GPT-4.1-mini existant (`lib/custom-prompt.ts`).

---

### P0 -- Pas de verification de paiement/credits

**Fichier** : `app/api/pro/projects/[id]/generate/route.ts`, lignes 131-137
**Impact** : N'importe qui avec un projet valide peut generer des visuels gratuitement. Le TODO est explicite : la verification de credits est commentee.
**Constat** :
```typescript
// ─── TODO: Verify credits/payment ────────────────────────────
// const hasCredits = await checkMerchantCredits(user.id, projectId);
```
En tant que marchand, c'est aussi un probleme de confiance : si je ne vois pas combien ca coute, je ne sais pas si je vais etre debite. Et si je ne suis pas debite, le service ne tiendra pas longtemps.

**Correction** : Implementer la verification de credits AVANT le lancement. Afficher le cout cote client ("Cette generation utilisera X visuels sur votre solde de Y"). Bloquer avec message actionnable si credits insuffisants ("Rechargez votre compte pour continuer").

---

### P1 -- Pas de retry individuel par piece echouee

**Fichier** : `app/projet/[id]/generation/page.tsx`
**Impact** : Si 1 piece echoue sur 6, je dois soit relancer tout (reload), soit aller au dossier avec un visuel manquant. Le reload risque de re-generer les pieces deja done (le check de statut devrait les ignorer, mais le rate limiter de 120s pourrait bloquer).
**Constat** : Le bouton "Reessayer" (ligne 276-291) fait un `window.location.reload()`. Pas de bouton retry sur les cartes individuelles en statut "failed".
**Backend** : Le route.ts regenere TOUTES les pieces du projet, meme celles deja "done" -- il n'y a pas de filtre `WHERE generation_status != 'done'` dans la requete SQL.

**Correction** :
- Frontend : ajouter un bouton "Reessayer" sur chaque carte en statut "failed"
- Backend : ajouter un endpoint `POST /api/pro/projects/:id/rooms/:roomId/regenerate` pour une piece individuelle, OU filtrer les pieces deja "done" dans la requete SQL du batch generate
- Alternative minimale : dans route.ts, ajouter `AND generation_status != 'done'` au WHERE de la requete rooms

---

### P1 -- Pas de nom du bien/projet sur la page de generation

**Fichier** : `app/projet/[id]/generation/page.tsx`
**Impact** : Avec 8-12 operations par an, j'ai souvent plusieurs projets en parallele. Sur cette page, je vois "Generation en cours..." mais pas QUEL bien. Pas d'adresse, pas de nom de projet.

**Correction** : Ajouter un fetch du nom du projet (ou le recevoir via le status endpoint qui renvoie deja `project_status`) et l'afficher en sous-titre : "12 rue des Vignes -- Generation en cours...". Le status endpoint pourrait ajouter un champ `project.name` ou `project.address`.

---

### P1 -- Dimensions image hardcodees en paysage

**Fichier** : `app/api/pro/projects/[id]/generate/route.ts`, ligne 256
**Impact** : Toutes les generations forcent un output 1536x1024 (paysage) quelle que soit l'orientation de la photo d'origine. Si j'ai pris une photo en portrait sur mon iPhone (ce qui arrive souvent dans les couloirs, les escaliers), le visuel sera ecrase.
**Constat** :
```typescript
const outputSize = getOutputSize(1536, 1024);
```
Le commentaire dit "assume landscape for now". Les dimensions reelles de la photo ne sont pas lues.

**Correction** : Lire les dimensions reelles de l'image source (depuis le buffer telecharge ou un champ en base) et passer les bonnes valeurs a `getOutputSize()`. Le pipeline principal gere deja les 3 ratios (landscape, portrait, square).

---

### P2 -- Le bouton Reessayer fait un reload brutal

**Fichier** : `app/projet/[id]/generation/page.tsx`, ligne 284
**Impact** : Un `window.location.reload()` perd tout l'etat React, le timer repart a zero, et l'utilisateur voit un flash blanc. Ce n'est pas elegant.
**Constat** :
```typescript
isGenerationTriggered.current = false; // duplique ligne 279
window.location.reload();
```

**Correction** : Au lieu du reload, re-executer la logique `checkAndTrigger()` depuis le state React. Extraire la fonction de trigger hors du useEffect et l'appeler depuis le bouton.

---

### P2 -- Stepper mobile prend trop de place

**Fichier** : `components/marchand/ProStepper.tsx`, lignes 221-298
**Impact** : Sur iPhone, le stepper vertical affiche les 7 etapes avec des labels, ce qui pousse la barre de progression et la grille de visuels sous le fold. Pendant la generation, je veux voir la progression, pas le stepper.

**Correction** : Sur mobile, en mode generation (etape 6), afficher le stepper en version compacte : soit un stepper horizontal dots-only (7 petits cercles), soit un mini-header "Etape 6/7 -- Generation" et masquer le detail.

---

### P2 -- Estimation temps non adaptive

**Fichier** : `app/projet/[id]/generation/page.tsx`, ligne 234
**Impact** : L'estimation "~X minutes" est calculee avec un facteur fixe de 1.5 min par piece. Si les generations vont plus vite ou plus lent que prevu, l'estimation ne s'ajuste pas.

**Correction** : Apres la premiere piece terminee, recalculer l'estimation basee sur le temps reel de la premiere piece. Afficher "~X min restantes" au lieu de l'estimation initiale.

---

## Synthese par priorite

| Priorite | Nb | Resume |
|----------|-----|--------|
| P0 | 2 | Prompts de style generiques (visuels mediocres), pas de verification paiement |
| P1 | 3 | Pas de retry par piece, pas de nom du bien, dimensions image hardcodees paysage |
| P2 | 3 | Reload brutal, stepper mobile trop grand, estimation non adaptive |

---

## Seuil 9.5/10 -- Ecart et chemin

Note actuelle : **6.8/10** -- ecart de **2.7 points**.

Les 2 P0 representent a eux seuls ~2 points d'ecart :
- Les prompts generiques sabotent la proposition de valeur principale ("des visuels pro qui font le job pour mes plaquettes")
- L'absence de verification credits est un risque business ET un manque de transparence prix

Apres correction des 2 P0 + 3 P1, la note devrait monter a ~8.5-9.0.
Pour atteindre 9.5, les 3 P2 (UX polish) sont necessaires.
