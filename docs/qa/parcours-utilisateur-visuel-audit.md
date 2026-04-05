# Audit parcours utilisateur visuel — 2026-04-05

Simulation de chaque scenario depuis le code `app/page.tsx`. Verdict par scenario.

| # | Scenario | Ce que l'utilisateur VOIT | Verdict |
|---|---|---|---|
| 1 | Starter, 1 photo, Scandinave, "Piece meublee" | Image surfaces s'affiche dans le comparateur. Overlay EN BAS de l'image (fond blanc/blur, 3 dots sage) : "Surfaces terminees -- ameublement en cours / Encore 30 a 60 secondes". Puis l'image meublee REMPLACE automatiquement l'image surfaces (meme slot). | **PASS** |
| 2 | Pro, 3 photos, Japandi | 3 resultats apparaissent progressivement (batch de 2 + 1). Chaque resultat affiche d'abord ses surfaces + overlay "ameublement en cours", puis chaque image meublee remplace individuellement. isGenerating se coupe quand TOUTES les pass2 sont terminees. | **PASS** |
| 3 | Regenerer apres generation | Clic "Regenerer" -> confirmation "Consomme 1 visuel" -> clic "Confirmer". L'image surfaces remplace le resultat existant, overlay "ameublement en cours" s'affiche SUR l'image, puis image meublee remplace + badge "Nouveau resultat" pendant 3s. Versions resetees (v1 = nouveau resultat). | **PASS** |
| 4 | Position overlay "ameublement en cours" | L'overlay est `absolute inset-0 flex items-end justify-center pb-6` = positionne EN BAS A L'INTERIEUR de l'image (pas en dessous). Fond blur, z-10, pointer-events-none sauf le badge lui-meme. | **PASS** |
| 5 | Pro, Affiner, "ajoute un tapis rouge" | Clic "Affiner ce resultat" -> RefineModal s'ouvre -> saisie commentaire -> submit. isRefining=true (spinner affiches). Pas d'overlay "ameublement en cours" (pas de pass2Pending). Resultat ajoute comme nouvelle version (v2). iterationsRemaining -1. | **PASS** |
| 6 | Pas de message "ameublement" pendant affinage | Correct : handleRefine ne set jamais pass2Pending. Le loading est gere par isRefining (spinner/timer separe). | **PASS** |
| 7 | Starter, "Surfaces uniquement" | withFurniture=false, splitMode=false. Le serveur retourne le resultat complet (surfaces seules, pas de pass2). L'utilisateur voit l'image surfaces dans le comparateur, sans overlay. photoId retourne par le serveur si present dans la reponse. | **PASS** |
| 8 | Pro, PhotoAssociator visibilite | Condition : `session && hasPro && result.photoId && !dismissedAssociators.has(index) && !result.pass2Pending && !(isRefining && isRefineTarget) && !(isRegenerating && regeneratingIndex === index)`. Masque pendant pass2, affinage, regeneration. Reapparait quand termine. | **PASS** |
| 9 | Starter, PhotoAssociator masque | Condition exige `hasPro`. Starter n'a que `hasStarter`. PhotoAssociator invisible. | **PASS** |
| 10 | Supprimer photo source apres generation | Le bouton supprime le fichier, filtre les resultats dont originalUrl correspond, nettoie versions/activeVersions. Si derniere photo : reset complet (isGenerating, isRefining, error). L'utilisateur peut re-uploader et generer. | **PASS** |
| 11 | 0 credits, clic Generer | Check `totalJobs > userCredits` (ex: 1 > 0 = true). Message AVANT le fetch : "Vous avez 0 visuel restant, mais cette generation en necessite 1. Reduisez le nombre de styles ou rechargez votre compte." | **PASS** |
| 12a | Regeneration consomme 1 credit | `setUserCredits(prev => prev - 1)` a la ligne 1128. | **PASS** |
| 12b | Affinage ne consomme PAS de credit | handleRefine ne contient aucun `setUserCredits`. Seul `iterationsRemaining` est decremente. | **PASS** |

## Bugs detectes

| # | Severite | Description | Fichier/Ligne |
|---|---|---|---|
| B1 | **HAUTE** | **Regeneration sans verification de credit.** handleRegenerate (L1121) decremente optimistiquement le credit (L1128) mais ne verifie PAS si `userCredits > 0` avant de lancer le fetch. Un utilisateur a 0 credit peut cliquer Regenerer -> Confirmer -> le fetch part, le serveur rejette (ou pas si pas de guard serveur), et le credit passe a -1 cote client (`Math.max(0, 0-1) = 0` ok cote affichage, mais le fetch est quand meme envoye). | `app/page.tsx:1121-1128` |
| B2 | **MOYENNE** | **Credits null = pas de guard.** Si le fetch `/api/user/credits` n'a pas encore repondu (race condition au chargement), `userCredits === null` et le check L477 (`userCredits !== null && ...`) est skip. La generation part sans verification de credits. Peu probable en usage normal mais possible sur connexion lente. | `app/page.tsx:475-480` |
| B3 | **BASSE** | **Grammaire 0 credit.** Le message dit "0 visuel restant" (sans "s"). Correct grammaticalement en francais (zero + singulier), mais "Vous n'avez plus de visuels" serait plus naturel. | `app/page.tsx:478` |

## Recommandations

- **B1** : Ajouter `if (userCredits !== null && userCredits < 1) { setError("Plus de visuels disponibles..."); return; }` au debut de handleRegenerate. Signaler a @fullstack.
- **B2** : Desactiver le bouton Generer tant que `userCredits === null` (loading state), ou ajouter un fallback server-side. Signaler a @fullstack.
