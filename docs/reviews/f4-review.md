# Revue F4 — Mode Marchand — 2026-03-25

## Resume executif (non-technique)

Le Mode Marchand est fonctionnel de bout en bout : creation de dossier, upload multi-photos, generation batch avec semaphore, PDF avec disclaimer IA, page partageable SSR avec OG tags, et regeneration individuelle. Cependant, **3 problemes critiques** empechent la mise en production : (1) le header X-Internal-Dossier permet a n'importe quel client de contourner l'authentification et les credits sur l'API de generation, (2) le controle d'acces Pack Pro (regle metier F4.3) n'est pas implemente — n'importe quel utilisateur avec 1 credit peut creer un dossier, et (3) les prix sont affiches en centimes au lieu d'euros dans le PDF et la page partageable. Le code est bien structure mais necessiste des corrections avant usage reel.

## Resume technique

Coherence generale correcte avec le codebase existant (tokens CSS, patterns async, conventions de nommage). 3 bloquants securite/conformite, 5 problemes hauts, 4 moyens. **Recommandation : NO-GO** tant que les 3 bloquants ne sont pas corriges.

---

## Tableau synthese

| Critere | Note | Commentaire |
|---|---|---|
| **Conformite specs** | 5/10 | US-F4-01 et US-F4-02 implementees. US-F4-03 (style par piece) partiellement — le picker par photo n'est pas expose dans l'UI. hasProAccess() definie mais jamais appelee (F4.3 violation). Events tracking F4.5 totalement absents. Edge case credit insuffisant en batch non conforme (message different). |
| **Securite** | 3/10 | Header X-Internal-Dossier non securise = bypass complet auth + credits. Pas de validation UUID format. GET /api/dossier/[uuid] sans auth expose les donnees du dossier a quiconque connait l'UUID (voulu pour le partage, mais l'API retourne aussi les storage keys internes). |
| **Gestion des erreurs** | 6/10 | Refund credit en cas d'echec OK. Timeout photo non gere specifiquement (depend du timeout route.ts). PDF > 25Mo : log seulement, pas de ZIP. Lien expire : 410 avec message OK. |
| **Qualite code** | 7/10 | Types bien definis. Semaphore propre. Cleanup URL.createObjectURL OK. Pas de memory leak evident. Quelques soucis mineurs (Semaphore non exporte/testable, import dynamique inutile). |
| **Coherence** | 7/10 | Utilise les tokens CSS (--foreground, --muted, --sage, --border, --background). Design minimaliste coherent. Animations fade-in-up. data-testid presents. Ecart : bg-gray-100 et bg-white/40 au lieu de tokens. |

---

## Problemes par severite

### CRITIQUE (bloquant)

**C-01 — Header X-Internal-Dossier : bypass auth + credits sans secret**
- Fichier : `app/api/generate/route.ts` ligne 997, `app/api/dossier/[uuid]/route.ts` ligne 335
- Description : N'importe quel client HTTP peut envoyer le header `X-Internal-Dossier: true` pour contourner l'authentification ET le controle de credits sur `/api/generate`. Cela permet des generations illimitees et gratuites.
- Fix suggere : Ajouter un secret partage (`INTERNAL_API_SECRET` dans .env) et verifier `request.headers.get("X-Internal-Secret") === process.env.INTERNAL_API_SECRET`. Alternativement, extraire la logique de generation dans une fonction serveur et l'appeler directement sans passer par HTTP (elimine entierement le probleme).
- Agent responsable : @fullstack

**C-02 — Controle d'acces Pack Pro non implemente (violation F4.3)**
- Fichier : `app/api/dossier/route.ts` lignes 28-37
- Description : La spec F4.3 stipule "Mode Marchand disponible a partir du Pack Pro". La fonction `hasProAccess()` existe dans `lib/credits.ts` mais n'est **jamais appelee**. Le check actuel est `credits < 1` — n'importe quel utilisateur avec 1 credit restant peut creer un dossier marchand, meme avec un Pack Decouverte (4,90EUR / 5 credits).
- Fix suggere : Remplacer le check `credits < 1` par `const proAccess = await hasProAccess(session.user.id); if (!proAccess) return 403`. Conserver le check de credits suffisants en complement.
- Agent responsable : @fullstack

**C-03 — formatPrice traite le prix en centimes au lieu d'euros**
- Fichier : `lib/dossier.ts` lignes 345-352
- Description : La fonction `formatPrice(priceCents: number)` est nommee "priceCents" mais le champ `bien_prix` est stocke en euros (l'utilisateur saisit "350000" pour 350 000 EUR). Le PDF et la page partageable affichent donc le prix correctement SI l'utilisateur saisit des euros. Cependant, le nom de la fonction est trompeur et il n'y a aucune validation que le prix est coherent (un prix de "35" serait affiche comme "35 EUR" sans alerte). Probleme secondaire : le prix est stocke en INTEGER — impossible de stocker des centimes pour les biens a prix impairs (349 500,50 EUR).
- Criticite revue : HAUTE (pas bloquant car le comportement actuel est fonctionnellement correct dans le cas nominal, mais le nommage trompeur est une bombe a retardement)

---

### HAUTE

**H-01 — Style par piece (US-F4-03) non expose dans l'UI**
- Fichier : `components/MerchantMode.tsx`
- Description : La spec US-F4-03 demande un picker de style par photo individuelle avec badge de style sur chaque vignette. Le backend supporte la fonctionnalite (update_style action dans PATCH, styleOverride dans PhotoEntry), mais l'UI de l'etape "photos" ne montre aucun moyen de changer le style par photo. L'etape "review" ne montre pas non plus les badges de style par photo.
- Fix suggere : Ajouter un selecteur de style compact (dropdown ou mini-picker) a cote de chaque vignette dans l'etape photos ou review. Afficher un badge avec le nom du style si different du global.
- Agent responsable : @fullstack

**H-02 — Dimensions de sortie hardcodees a 1536x1024 (landscape)**
- Fichier : `app/api/dossier/[uuid]/route.ts` lignes 344-345
- Description : `width: 1536, height: 1024` hardcode dans `generateSinglePhoto()`. Les photos portrait (prises au telephone en vertical) seront forcees en paysage, deformant le ratio. La spec ne mentionne pas ce cas, mais le mode standard detecte le ratio de l'image input et adapte les dimensions.
- Fix suggere : Lire les dimensions de l'image base64 (ou stocker width/height a l'upload) et calculer le ratio comme dans le mode standard.
- Agent responsable : @fullstack

**H-03 — Photos bloquees en etat "generating" si le serveur restart**
- Fichier : `app/api/dossier/[uuid]/route.ts` lignes 368-428
- Description : Le batch s'execute en background (fire-and-forget via `.catch()`). Si le serveur Replit redeploy ou restart pendant un batch, les photos en "generating" restent dans cet etat indefiniment. Le polling cote client ne detecte jamais la fin car le dossier reste en status "generating".
- Fix suggere : Au demarrage du batch, ajouter un cleanup : `UPDATE dossier_photos SET status = 'failed', error_message = 'Serveur redémarre' WHERE status = 'generating'`. Ou : au GET, si une photo est en "generating" depuis plus de 5 minutes, la marquer comme "failed".
- Agent responsable : @fullstack

**H-04 — Race condition sur la deduction de credits en batch**
- Fichier : `app/api/dossier/[uuid]/route.ts` lignes 258-268, 386-389
- Description : Les credits sont verifies en amont (`credits < pendingPhotos.length`) puis deduits un par un dans le batch. Si un utilisateur lance 2 batchs simultanement, ou utilise le mode standard en parallele, les credits pourraient etre double-deduits. La fonction `decrementCredit()` utilise une clause `WHERE credits_remaining > 0` qui protege contre les negatifs, mais pas contre la sous-deduction (le 2e batch pourrait echouer a mi-chemin).
- Mitigation actuelle : le refund en cas d'echec compense partiellement. Le risque est faible en alpha.
- Fix suggere : Reserver les credits atomiquement au lancement du batch (`UPDATE users SET credits_remaining = credits_remaining - $1 WHERE id = $2 AND credits_remaining >= $1 RETURNING credits_remaining`), puis refund les echecs. Ou : bloquer le lancement de batch si un batch est deja en cours pour ce dossier.
- Agent responsable : @fullstack

**H-05 — Events tracking F4.5 totalement absents**
- Fichier : Tous les fichiers F4
- Description : Les 7 events definis dans F4.5 (merchant_mode_started, merchant_batch_photo_completed, merchant_batch_completed, merchant_pdf_downloaded, merchant_link_copied, merchant_shared_link_visited, merchant_photo_regenerated) ne sont implementes nulle part. Aucun tracking PostHog ou equivalent n'est appele.
- Mitigation : L'analytics n'est pas encore instrumentee dans le projet (PostHog pas installe). Mais les events devraient au minimum etre prepares comme des hooks/fonctions vides pour ne pas oublier.
- Fix suggere : Ajouter les events dans les callbacks correspondants de MerchantMode.tsx (ou dans l'API pour les events serveur). Marquer comme TODO si PostHog n'est pas encore branche.
- Agent responsable : @fullstack + @data-analyst

---

### MOYENNE

**M-01 — style-resolver.ts duplique StylePicker.tsx**
- Fichier : `lib/style-resolver.ts`
- Description : Les 12 prompts de style sont dupliques entre StylePicker.tsx (client) et style-resolver.ts (serveur). Si un prompt est modifie dans un fichier mais pas l'autre, la generation batch produira des resultats differents du mode standard. Le commentaire documente le choix, mais il n'y a aucun mecanisme de verification de synchronisation (test, checksum, lint).
- Fix suggere : Extraire les donnees de style dans un fichier partage `lib/styles-data.ts` (donnees pures, pas de composant React). Importer depuis StylePicker.tsx et style-resolver.ts. Alternativement, ajouter un test unitaire qui compare les 2 sources.
- Agent responsable : @fullstack

**M-02 — Edge case "credit insuffisant en cours de batch" non conforme**
- Fichier : `app/api/dossier/[uuid]/route.ts` ligne 388
- Description : La spec F4.4 #1 demande un message "Credits insuffisants apres 8 photos. Rechargez pour continuer." avec conservation du dossier partiel. L'implementation actuelle lance une erreur generique "Credits insuffisants." et la photo est marquee "failed". Le dossier partiel est conserve, mais le message n'est pas specifique et le nombre de photos reussies n'est pas mentionne.
- Fix suggere : Quand `decrementCredit` echoue, stocker un message d'erreur specifique incluant le compte de photos reussies.
- Agent responsable : @fullstack

**M-03 — PDF ne propose pas d'alternative ZIP si > 25 Mo**
- Fichier : `app/api/dossier/[uuid]/pdf/route.ts` lignes 286-289
- Description : La spec F4.4 #4 demande "Un bouton Telecharger images ZIP est propose en alternative si le PDF depasse 25 Mo". L'implementation actuelle genere le PDF meme s'il depasse 25 Mo et log un warning. Aucune alternative ZIP n'est proposee.
- Mitigation : Avec pdf-lib et images JPEG compressees, il est peu probable qu'un PDF de 15 photos depasse 25 Mo (~1-2 Mo par page = 15-30 Mo max). Le risque est marginal.
- Fix suggere : Ajouter un header `X-PDF-Size-MB` dans la reponse et gerer cote client l'affichage d'un lien ZIP si trop gros. Ou : compresser les images avant embedding dans le PDF.
- Agent responsable : @fullstack

**M-04 — GET /api/dossier/[uuid] expose les storage keys dans la reponse publique**
- Fichier : `app/api/dossier/[uuid]/route.ts` lignes 29-53
- Description : Le GET ne requiert pas d'authentification (voulu pour la page partageable), mais retourne l'objet `dossier` complet incluant `user_id`, `global_style_id`, et les `photos` avec `input_image_key`, `output_image_key`, `pass1_image_key`. Ces cles internes ne devraient pas etre exposees au public.
- Fix suggere : Creer un DTO public qui ne retourne que les champs necessaires pour l'affichage (id, roomLabel, status). Les images doivent etre servies via une route dediee, pas en exposant les cles de stockage.
- Agent responsable : @fullstack

---

### BASSE

**B-01 — AVANT/APRES badges a text-[10px] dans DossierResult.tsx**
- Fichier : `components/DossierResult.tsx` lignes 118, 134
- Description : Les badges "AVANT" et "APRES" utilisent `text-[10px]` qui est sous le seuil d'accessibilite WCAG (recommande 12px minimum). Le meme probleme avait ete signale dans l'audit design pour le mode standard.
- Fix suggere : Utiliser `text-xs` (12px) avec un padding suffisant.
- Agent responsable : @design

**B-02 — bg-gray-100 et bg-white/40 hors design tokens**
- Fichier : `components/MerchantMode.tsx` ligne 449, `components/DossierResult.tsx` ligne 41
- Description : `bg-gray-100` (boutons type de bien non selectionnes) et `bg-white/40` (fond carte resultat) ne sont pas des tokens CSS definis. Devrait utiliser des variables systeme pour la coherence.
- Fix suggere : Remplacer par `bg-foreground/5` ou equivalent tokenise.
- Agent responsable : @design

**B-03 — Semaphore definie dans le fichier route.ts au lieu d'un module partage**
- Fichier : `app/api/dossier/[uuid]/route.ts` lignes 432-458
- Description : La classe Semaphore est definie inline dans le fichier route. Si d'autres features (F5, ou un batch replay) ont besoin de concurrence limitee, le code sera duplique.
- Fix suggere : Deplacer dans `lib/semaphore.ts`.
- Agent responsable : @fullstack

---

## Angles morts

1. **Pricing F4 contradictoire entre specs et pricing-strategy** : functional-specs.md F4.3 dit "Pack Pro (29EUR, 30 credits)" mais pricing-strategy.md dit "Pack Pro 29EUR / 50 credits". L'implementation utilise 1 credit/photo sans prix fixe par dossier, alors que pricing-strategy.md indique "29EUR/dossier fixe". Ces 3 sources se contredisent. Decision a confirmer avec le fondateur.
2. **Pas de nettoyage des dossiers expires** : Les dossiers expirent apres 30 jours (TTL) mais il n'y a aucun cron/worker qui supprime les dossiers expires et leurs images du Object Storage. L'espace de stockage croitra indefiniment.
3. **Pas de page "Mes dossiers"** : L'utilisateur ne peut pas retrouver ses dossiers precedents apres avoir ferme l'onglet. L'API GET /api/dossier existe pour lister les dossiers, mais aucune page UI ne l'utilise.
4. **Mode custom (prompt personnalise) non gere dans le batch** : Le client envoie `globalStyleId: "custom"` mais le style-resolver ne connait pas "custom" et retournera null. La generation echouera pour tous les styles custom.

---

## Decisions a confirmer

1. **Pricing F4** : 1 credit/photo (implementation actuelle) ou 29EUR/dossier fixe (pricing-strategy.md) ? Les deux modeles sont mutuellement exclusifs.
2. **Acces F4** : La spec dit "Pack Pro minimum". L'implementation n'a aucune verification de pack. Confirmer : faut-il implementer hasProAccess() ou accepter que tout utilisateur avec des credits puisse creer un dossier ?
3. **Controle du header interne** : Passer a un secret partage, ou refactorer pour eviter l'appel HTTP interne ?

---

## Recommandation

**NO-GO** — 3 problemes critiques/hauts bloquants :
1. C-01 : Faille de securite — bypass complet de l'authentification et des credits
2. C-02 : Non-conformite regle metier — acces Mode Marchand sans verification Pack Pro
3. H-02 : Photos portrait deformees en paysage (qualite du livrable marchand compromise)

Ces 3 points doivent etre corriges avant toute utilisation, meme en alpha. Le reste (H-01, H-03, H-04, H-05) est acceptable pour un lancement alpha avec reserves.

**Effort estime pour debloquer** : C-01 = 30 min, C-02 = 15 min, H-02 = 1h. Total : ~2h de travail @fullstack.

---

**Handoff -> @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/f4-review.md`
- Decisions prises : NO-GO, 3 bloquants identifies (securite header, acces Pro, dimensions hardcodees)
- Points d'attention :
  - C-01 et C-02 sont des corrections rapides qui debloquent le GO
  - Contradiction pricing F4 (credit vs prix fixe) a arbitrer par le fondateur
  - Angle mort "custom prompt" dans le batch = crash silencieux pour les utilisateurs custom
  - @fullstack doit etre reinvoque pour les corrections
