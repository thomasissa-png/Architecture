# Re-audit Etapes 6 et 7 -- Parcours Marchand Versimo (Post-Session 42)

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux, iPhone 15 Pro + laptop Windows.
> Methode : lecture exhaustive du code source des 7 fichiers, simulation mentale etape par etape.
> Date : 2026-04-10
> Seuil : 9.5/10 minimum (preference fondateur)
> Comparaison : session 41 donnait Etape 6 = 7.0/10, Etape 7 = 4.0/10

---

## Corrections verifiees dans le code

Toutes les corrections annoncees dans le brief ont ete verifiees dans le code source :

| Correction annoncee | Fichier | Verifie |
|---|---|---|
| Vrais prompts v57 via getStyleById() | generate/route.ts l.269 | OUI -- `getStyleById(styleId, false)` avec fallback custom_style_text |
| extractRoomInventory() avant generation | generate/route.ts l.287 | OUI -- appel avec fail-open |
| Dimensions dynamiques via sharp | generate/route.ts l.289-300 | OUI -- `sharp(photoBuffer).metadata()` avec fallback 1536x1024 |
| Adresse du bien affichee en haut | generation/page.tsx l.279-288 | OUI -- projectAdresse + projectTypeBien affiches |
| Retry individuel par piece echouee | generation/page.tsx l.213-244, l.488-504 | OUI -- bouton "Reessayer cette piece" + POST room_ids |
| Status route retourne adresse/type | status/route.ts l.101-102 | OUI -- project_adresse et project_type_bien |
| Lien de partage vers page publique | partage/[token]/page.tsx complet | OUI -- Server Component sans auth |
| share_token genere et persiste en DB | share-token/route.ts l.29 | OUI -- getOrCreateShareToken() |
| Page publique avec OG metadata | partage/[token]/page.tsx l.59-93 | OUI -- generateMetadata() avec title, description, openGraph |
| Prix du bien dans le PDF | dossier/pdf/route.ts l.513-527 | OUI -- Intl.NumberFormat EUR sur cover page |
| Branding marchand (raison_sociale) | dossier/pdf/route.ts l.270-276 | OUI -- getMerchantProfile() + brandName |
| "Retour aux visuels" renomme | dossier/page.tsx l.893 | OUI -- "Modifier les visuels" |
| Touch targets 44px sur partage | dossier/page.tsx l.572, l.587, l.602 | OUI -- min-h-[44px] sur Copier/WhatsApp/Email |

---

## Etape 6 -- Generation des visuels

### Note : 8.8 / 10

### Tableau des 10 criteres

| # | Critere | Note /10 | Commentaire Thomas |
|---|---------|----------|-------------------|
| 1 | Retrouvabilite | 9 | L'adresse du bien et le type s'affichent en haut. Le stepper me dit ou j'en suis. Je sais de quel bien on parle. |
| 2 | Prix/valeur | 7 | Le code TODO l.135-141 montre que le paiement n'est pas cable. Je ne sais pas combien me coute cette generation. Pas de "X visuels restants" affiche. |
| 3 | Qualite pro | 9 | Pipeline 2 passes v57, getStyleById() avec les vrais prompts, extractRoomInventory() pour l'inventaire visuel, dimensions dynamiques via sharp. C'est serieux. |
| 4 | Partage acquereurs | 7 | Pas de partage a cette etape -- c'est normal, les visuels ne sont pas encore au dossier. Mais il n'y a pas de bouton "Telecharger un visuel" individuel non plus. Si je veux envoyer un visuel rapide par WhatsApp avant de faire le dossier complet, je ne peux pas. |
| 5 | Gestion d'erreur | 9.5 | Message clair "Erreur de connexion. Verifiez votre reseau." Role="alert" present. Bouton "Reessayer" global + "Reessayer cette piece" individuel. Message d'erreur par piece (room.error). Excellent. |
| 6 | Simplicite | 9.5 | La page est auto-pilotee : check status au mount, trigger si necessaire, poll automatique, completion detectee. Aucune action requise de ma part pendant la generation. |
| 7 | Confiance | 9 | Stepper professionnel, barre de progression avec pourcentage et timer, statuts clairs par piece ("Preparation de la piece", "Ajout du mobilier"). Pas de sous-domaine technique. |
| 8 | Completude | 8.5 | Adresse, type de bien, statut par piece, lot_name si applicable. Mais je ne vois pas le STYLE choisi pour chaque lot -- si j'ai 2 lots avec 2 styles differents, je ne sais pas lequel est Scandinave et lequel est Japandi. |
| 9 | Mobile-first | 8 | Grid responsive sm:grid-cols-2. Mais les boutons "Reessayer cette piece" (l.491) n'ont pas de min-h-[44px], et les boutons de navigation (l.543-559) ont py-3 ce qui fait environ 44px mais sans garantie explicite. Le bouton "Reessayer" global (l.351) n'a que py-2.5. |
| 10 | Rapidite | 9.5 | Check status avant trigger (evite la regeneration inutile). Poll toutes les 3 secondes. Rate limit 1 job par projet. Max 2 pieces en parallele. Deadline 150s. La generation est aussi rapide que l'API IA le permet. |

### Points positifs

1. **Check status avant trigger (l.96-121)** -- Si les visuels sont deja generes, on affiche directement les resultats. Un refresh ne relance pas tout. C'est la correction qui manquait en session 41.
2. **Retry individuel par piece (l.213-244)** -- Si 1 piece echoue sur 6, je ne relance que celle-la. Le bouton est rouge, clair, et reprend le polling automatiquement.
3. **Cascade d'images (l.365-369)** -- La carte affiche l'output si disponible, sinon le pass1 (surfaces), sinon le placeholder. Progression visible en temps reel.
4. **Concurrence poolee (l.50-74)** -- Max 2 pieces en parallele, pas de surcharge API.
5. **Generation_status en 5 etats** -- pending/generating_pass1/generating_pass2/done/failed. Labels en francais, pas de jargon technique.

### Problemes restants

| Priorite | Description | Fichier | Ligne |
|----------|-------------|---------|-------|
| P1 | **Paiement non cable** -- TODO l.135-141 dans la route generate. La generation se lance sans verifier ni debiter de credits/paiement. Thomas ne sait pas combien il reste de visuels. | generate/route.ts | 135 |
| P1 | **Style non affiche par piece** -- Je ne vois pas quel style (Scandinave, Japandi...) a ete applique a chaque lot/piece. Pour un projet multi-lots avec des styles differents, c'est confusant. | generation/page.tsx | 473-484 |
| P2 | **Touch targets < 44px** -- Le bouton "Reessayer cette piece" (l.491) a py-1.5 (24px) + texte xs = environ 32px de hauteur. Trop petit sur iPhone. Le bouton "Reessayer" global (l.351) a py-2.5 (40px), proche mais pas 44px. | generation/page.tsx | 491, 351 |
| P2 | **Pas de download individuel** -- Je ne peux pas telecharger un visuel specifique depuis cette page. Il faut aller au dossier. Pour un usage rapide (envoyer un visuel vite fait par WhatsApp), c'est une friction. | generation/page.tsx | - |
| P3 | **Estimation statique** -- "~{Math.ceil(summary.total * 1.5)} minutes estimees" est une estimation fixe (1.5 min/piece). Si l'API est lente ce jour-la, l'estimation est fausse. Pas critique mais perfectible. | generation/page.tsx | 299 |

---

## Etape 7 -- Dossier de pre-commercialisation

### Note : 8.5 / 10

### Tableau des 10 criteres

| # | Critere | Note /10 | Commentaire Thomas |
|---|---------|----------|-------------------|
| 1 | Retrouvabilite | 8 | Le stepper est present. Mais l'adresse du bien n'est PAS affichee en haut de la page dossier (contrairement a la page generation). Le projectAddress est charge (l.85, l.133) mais jamais affiche dans le render. |
| 2 | Prix/valeur | 9 | Le prix du bien est dans le PDF (cover page en gras, l.513-527). Le cout de generation n'est pas affiche mais c'est moins critique a cette etape puisque la generation est deja faite. |
| 3 | Qualite pro | 9 | PDF A4 portrait avec pdf-lib, cover page brandee, avant/apres par piece, description commerciale, recommandations. C'est un vrai dossier. Le sanitizer WinAnsi (l.57-71) gere les accents et caracteres speciaux. |
| 4 | Partage acquereurs | 9.5 | Lien public /projet/partage/[token] sans auth. navigator.share() sur mobile pour preview OG enrichie. Fallback wa.me sur desktop. Email avec objet pre-rempli. Copier le lien. Touch targets 44px. C'est presque parfait. |
| 5 | Gestion d'erreur | 8 | Messages d'erreur presents (l.476-482, l.497-509). Role="alert" sur le banner d'erreur. Toast "Lien copie" avec role="status". Mais si le PDF echoue, le message est generique "Erreur lors de la generation du dossier." -- pas de cause specifique (image manquante ? lot sans piece ?). |
| 6 | Simplicite | 9 | Auto-generation du PDF au mount (l.201-211). Le share token se charge automatiquement. La description est generable en 1 clic. Edition inline. C'est fluide. |
| 7 | Confiance | 9 | Branding marchand (raison_sociale) dans le PDF et sur la page publique. Disclaimer IA "a titre indicatif". Preview PDF inline dans un iframe. Coordonnees pro en footer de la page publique. |
| 8 | Completude | 8 | Style et cible affiches par lot. Description commerciale generable par IA et editable. Recommandations dans le PDF. Mais le DPE est absent. La surface par piece est dans le PDF mais pas toujours dans l'UI. |
| 9 | Mobile-first | 8.5 | Touch targets 44px sur les 3 boutons de partage. flex-wrap sur la barre d'actions. Grid responsive sm:grid-cols-2. Mais les boutons "Generer le PDF" et "Telecharger PDF" n'ont PAS min-h-[44px] (py-2 = 32px). |
| 10 | Rapidite | 8.5 | Auto-generation du PDF au chargement -- pas besoin de cliquer. Mais le PDF est regenere a chaque visite (pas de cache). Si je reviens 3 semaines plus tard pour un autre acquereur, il regenere. Pas de version cached du dernier PDF. |

### Points positifs

1. **Page publique /projet/partage/[token] (Server Component)** -- C'est un vrai changement par rapport a la session 41 ou le lien pointait vers l'ancien systeme et 404. La page est belle, professionnelle, avec branding marchand, prix, visuels avant/apres, description commerciale, disclaimer IA. Un acquereur recevrait un lien credible.
2. **OG metadata dynamiques (l.59-93)** -- Le titre contient l'adresse, la description contient type + surface + prix. La preview WhatsApp/iMessage sera riche et professionnelle.
3. **PDF brande avec raison_sociale (l.270-276)** -- Le header et le footer du PDF affichent la raison sociale du marchand au lieu de "Versimo". Le disclaimer adapte : "Visuels generes par IA -- [Raison Sociale] via Versimo". Mon logo n'est pas encore la (pdf-lib ne gere pas facilement les images custom au header), mais le nom de ma societe y est.
4. **Prix en cover page (l.513-527)** -- Formate en EUR avec Intl.NumberFormat. Affiche en gras, taille 20. C'est la premiere chose que l'acquereur voit apres l'adresse.
5. **Share token persiste en DB** -- Le token UUID est stable. Le lien ne change pas si je regenere le dossier. Je peux envoyer le lien aujourd'hui et l'acquereur verra la version mise a jour dans 3 semaines.

### Problemes restants

| Priorite | Description | Fichier | Ligne |
|----------|-------------|---------|-------|
| P1 | **Adresse non affichee dans l'UI dossier** -- projectAddress est charge via l'API lots (l.133) et stocke dans le state (l.85), mais n'est affiche NULLE PART dans le rendu HTML de la page dossier. La page generation l'affiche (l.279-288), mais pas la page dossier. Pour un marchand qui gere 8-12 biens, c'est un probleme de retrouvabilite. | dossier/page.tsx | render section |
| P1 | **Boutons PDF sans min-h-[44px]** -- "Generer le PDF" (l.519-527) et "Telecharger PDF" (l.550-563) ont py-2 px-3 = environ 32-36px de hauteur. Trop petit pour un pouce sur iPhone. Les 3 boutons de partage ont bien min-h-[44px], mais pas les boutons PDF qui sont pourtant les plus importants de la page. | dossier/page.tsx | 519, 550 |
| P1 | **Page publique : pas d'image OG** -- L'objet openGraph (l.87-93) a title, description, type et siteName, mais pas d'image. La preview WhatsApp affichera un rectangle gris au lieu d'une photo du bien. Pour un acquereur qui recoit un lien, la preview visuelle est decisive. Il faudrait generer un og:image a partir du premier visuel du dossier. | partage/[token]/page.tsx | 87-93 |
| P2 | **DPE absent** -- Le DPE n'apparait ni dans l'UI du dossier, ni dans le PDF, ni sur la page publique. Pour un bien en vente, le DPE est une information legalement obligatoire dans les annonces. | dossier/pdf/route.ts, partage/[token]/page.tsx | - |
| P2 | **PDF sans cache** -- L'auto-generation au mount (l.201-211) regenere le PDF a chaque visite. Si je reviens 3 semaines plus tard, il regenere les images depuis Object Storage + construit le PDF. Pas de URL persistante du PDF genere. | dossier/page.tsx | 201-211 |
| P2 | **Page publique : images via /api/logs/image non protegees** -- Les images sont servies par la meme API que le systeme de logs (/api/logs/image?path=...). Si cette API a une protection par token (elle avait `?token=allezpsg` pour l'admin), les images de la page publique pourraient ne pas s'afficher. A verifier. | partage/[token]/page.tsx | 243-247 |
| P3 | **room_type affiche en anglais brut dans le PDF** -- Le PDF (l.678) affiche `room.room_type` sans traduction. "living_room" au lieu de "Salon". Les labels FR existent dans ROOM_TYPE_LABELS de lib/constants.ts mais ne sont pas utilises dans la route PDF. | dossier/pdf/route.ts | 678 |

---

## Synthese des deux etapes

| Etape | Note session 41 | Note session 42 | Progression |
|-------|-----------------|-----------------|-------------|
| 6. Generation | 7.0/10 | 8.8/10 | +1.8 |
| 7. Dossier | 4.0/10 | 8.5/10 | +4.5 |
| **Moyenne** | **5.5/10** | **8.65/10** | **+3.15** |

### Verdict

| Etape | Note | Verdict |
|-------|------|---------|
| 6 | 8.8/10 | **FAIL** (< 9.5) |
| 7 | 8.5/10 | **FAIL** (< 9.5) |

La progression est enorme : +3.15 points de moyenne. L'etape 7 est passee de "mur" (4.0) a "presque pret" (8.5). Le PDF fonctionne, le lien de partage est public, le branding marchand est present. C'est un vrai produit maintenant.

Mais on est sous le seuil de 9.5/10 sur les deux etapes. Les P1 restants sont concrets et atteignables :

### Corrections prioritaires pour atteindre 9.5

**Pour l'etape 6 :**
1. Afficher le style par piece/lot dans la grille (ajouter style_id dans les donnees et l'afficher en badge)
2. Ajouter min-h-[44px] sur le bouton "Reessayer cette piece" et le bouton "Reessayer" global
3. Afficher le nombre de visuels restants (depend du cablage paiement)

**Pour l'etape 7 :**
1. Afficher l'adresse du bien en haut de la page dossier (le state existe deja, il manque le JSX)
2. Ajouter min-h-[44px] sur les boutons "Generer le PDF" et "Telecharger PDF"
3. Ajouter une og:image dynamique a la page publique (URL du premier visuel du dossier)
4. Traduire room_type dans le PDF (utiliser ROOM_TYPE_LABELS existant)

---

## Handoff

**Destinataire** : @fullstack pour les corrections P1, @ia pour la question de l'og:image dynamique
**Fichiers a modifier** :
- `app/projet/[id]/generation/page.tsx` (touch targets, style badge)
- `app/projet/[id]/dossier/page.tsx` (adresse, touch targets PDF)
- `app/projet/partage/[token]/page.tsx` (og:image)
- `app/api/pro/projects/[id]/dossier/pdf/route.ts` (room_type labels)
**Bloqueur** : le paiement non cable (TODO l.135) est un P1 structurel qui impacte les deux etapes mais sort du scope de cet audit (c'est un sujet transversal etapes 1-7)
