# Audit Etape 7 -- Dossier de pre-commercialisation (Session 42)

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux, iPhone 15 Pro + laptop Windows.
> Methode : lecture du code source de la page dossier, de l'API PDF, de l'API description, du stepper.
> Date : 2026-04-10
> Seuil : 9.5/10 minimum (preference fondateur)
> Contexte : l'etape 7 avait la pire note de l'audit session 41 (4.0/10). Deux fixes ont ete appliques : pdf-lib (ab18db6) et lien de partage (dc71926).

---

## Note globale : 6.8 / 10

## Verdict en une phrase

"Le PDF est maintenant un vrai PDF avec des images et une mise en page pro -- c'est une remontee significative. Mais le lien de partage envoie mes acquereurs vers une page protegee par auth, il manque le prix du bien et le DPE dans le dossier, et le branding est Versimo au lieu de MON logo."

---

## Tableau des 10 criteres

| # | Critere | Note /10 | Commentaire Thomas |
|---|---------|----------|-------------------|
| 1 | Retrouvabilite | 7.0 | Le stepper step 7 ramene bien au dossier. Le bouton "Voir tous mes biens" renvoie a /mes-biens. Mais le dossier PDF n'est pas sauvegarde en base -- si je ferme l'onglet, le blob URL est perdu. Je dois regenerer a chaque visite. Pas de "Mes dossiers" avec historique. |
| 2 | Prix/valeur | 5.0 | Le dossier est inclus dans les 99 EUR du projet, OK. Mais pour 99 EUR j'attends un dossier complet avec prix du bien, DPE, mes coordonnees, mon logo. La, c'est une couverture Versimo + des photos avant/apres + une description IA. C'est 60% d'un dossier de pre-co. |
| 3 | Qualite pro | 7.5 | Le PDF est propre : couverture avec adresse/type/surface/date, pages par piece avec avant/apres empiles, page recommandations avec pastilles couleur impact + cout. Les fonts Helvetica sont clean. Le footer "Visuels generes par IA -- Powered by Versimo" est honnete. Mais il manque des pages cles (plan, DPE, prix, contact). |
| 4 | Partage acquereurs | 3.0 | C'est le point noir. Le lien de partage (getShareUrl) genere `/projet/{id}/dossier` -- cette URL est PROTEGEE par auth. Mon acquereur recevra "Connectez-vous" ou une erreur. Le TODO dans le code le dit noir sur blanc (ligne 321) : "TODO: implementer une page publique /projet/[id]/partage avec verification share token." Le WhatsApp et le bouton Email envoient ce meme lien casse. Le seul partage qui fonctionne, c'est telecharger le PDF et l'envoyer en piece jointe. |
| 5 | Gestion d'erreur | 7.5 | Les erreurs PDF et description IA ont des messages clairs en francais ("Erreur lors de la generation du dossier. Reessayez.", "Erreur de connexion lors de la generation."). Le rate limit description (10/h par lot) a un message propre. Le bouton Reessayer est present en etat d'erreur. Le fallback PDF inline (quand le navigateur ne supporte pas object) offre un bouton Telecharger. Correct. |
| 6 | Simplicite | 8.0 | Le PDF se genere automatiquement a l'arrivee sur la page (pdfAutoTriggered, ligne 200-210). La description IA se genere en 1 clic. Le textarea d'edition est simple. Les boutons sont clairs. Pas de formulaire complexe. Bon. |
| 7 | Confiance | 5.5 | Le PDF est brande "Versimo" partout. Mon logo n'apparait nulle part. Mes coordonnees (telephone, email, SIRET) ne sont pas dans le document. Pour un acquereur, ca ressemble a un document genere par un outil en ligne, pas a un dossier professionnel de Thomas Berger, marchand de biens. Le disclaimer IA en footer est bien (transparent), mais il faudrait MES infos a cote. |
| 8 | Completude | 5.0 | Il manque des informations critiques pour un dossier de pre-co : (1) Prix de vente du bien, (2) DPE/GES, (3) Honoraires/frais, (4) Plan du bien, (5) Coordonnees du marchand, (6) Logo du marchand, (7) Numero de lots (pour les coproprietes). Les photos avant/apres sont la, la description commerciale aussi, l'adresse aussi, mais ce n'est que la moitie du dossier. |
| 9 | Mobile-first | 7.0 | Les boutons d'action sont en flex-wrap, ce qui devrait passer sur mobile. Mais la barre d'actions a 6 boutons sur une seule ligne (PDF + Telecharger + separateur + Copier + WhatsApp + Email) : sur iPhone 15 Pro (393px), ca va wrapper sur 2-3 lignes, ce qui est OK mais pas optimal. Le separateur vertical (hidden sm:block) est bien cache en mobile. L'apercu PDF via `<object>` ne fonctionne pas sur iOS Safari (pas de lecteur PDF inline) -- le fallback est la, mais c'est une experience degradee. Les touch targets des boutons (py-2 px-3) font environ 36px de haut -- sous le minimum Apple 44px. |
| 10 | Rapidite | 8.0 | Le PDF se genere automatiquement. La description IA se genere en parallele sans bloquer la page. Le PDF est genere cote serveur en une seule requete (multi-lots, multi-pieces, images chargees depuis Object Storage). Pas d'estimation de temps affichee, mais la generation PDF devrait etre rapide (~2-5s). |

---

## Points positifs (max 5)

1. **Le PDF est un VRAI PDF maintenant.** pdf-lib avec StandardFonts, couverture pro, pages par piece avec avant/apres empiles, page recommandations avec pastilles couleur impact. C'est une remontee majeure par rapport au JSON brut de la session 41.

2. **Auto-generation du PDF a l'arrivee.** Le useEffect avec pdfAutoTriggered declenche la generation des que les lots sont charges. Thomas n'a pas a cliquer -- le dossier est pret quand il arrive.

3. **Description commerciale IA + edition manuelle.** Le split POST (generation IA) / PUT (sauvegarde manuelle) est bien pense. Thomas peut generer une base par IA puis l'ajuster. Le rate limit de 10 regenerations par heure est raisonnable.

4. **Gestion memoire correcte.** Le blob URL du PDF est revoque proprement (pdfUrlRef + cleanup useEffect + revocation avant re-creation). Pas de fuite memoire.

5. **Stepper clickable.** Thomas peut revenir a n'importe quelle etape completee ou active. Les etapes verrouillees sont visuellement distinctes (gris, cursor not-allowed). Les touch targets mobile (min-w-[44px] min-h-[44px]) respectent le minimum Apple.

---

## Problemes

### P0-1 -- Le lien de partage est INUTILISABLE (auth-wall)

**Fichier** : `app/projet/[id]/dossier/page.tsx`, ligne 322-324
**Severite** : P0 (bloquant pour le partage)

```typescript
function getShareUrl(): string {
  return `${window.location.origin}/projet/${projectId}/dossier`;
}
```

Le TODO ligne 321 le confirme : il n'existe PAS de page publique. L'URL `/projet/{uuid}/dossier` est une page protegee par authentification. L'acquereur qui recoit ce lien par WhatsApp tombe sur un mur.

Le fix dc71926 a corrige le PATH (ancien systeme `/dossier/` vers nouveau systeme `/projet/[id]/dossier`), mais n'a PAS resolu le probleme de fond : l'URL est derriere l'auth.

**Impact** : Les 3 boutons de partage (Copier le lien, WhatsApp, Email) envoient un lien mort. Le seul partage fonctionnel est de telecharger le PDF et l'envoyer en piece jointe.

**Correction** :
- Creer une page publique `/projet/[id]/partage` avec share token
- OU generer un lien signe temporaire avec token dans l'URL
- OU a minima, partager le PDF en piece jointe via navigator.share (file sharing)

### P0-2 -- Le PDF ne contient pas le prix du bien

**Fichier** : `app/api/pro/projects/[id]/dossier/pdf/route.ts`, lignes 466-488
**Severite** : P0 (un dossier de pre-co sans prix n'est pas un dossier)

Le PDF affiche : type de bien, surface, nombre de lots, nombre de pieces, date. Il n'affiche PAS le prix de vente. Pour Thomas, un dossier de pre-commercialisation sans prix est inutilisable -- l'acquereur pose la question dans les 3 premieres secondes.

Je note que la table `pro_projects` a probablement un champ `prix_vente` ou similaire (le schema project inclut `adresse`, `type_bien`, `surface_totale` mais je ne vois pas de champ prix dans la requete SQL). Si le champ n'existe pas en base, il faut l'ajouter.

**Impact** : L'acquereur recoit un dossier sans prix. Premier reflexe : "C'est combien ?" Il doit rappeler Thomas. Le dossier n'est pas autonome.

**Correction** :
- Ajouter le champ `prix_vente` au projet (si absent)
- Afficher le prix en gros sur la couverture PDF, sous l'adresse
- Format : "320 000 EUR" en Sage bold

### P1-1 -- Pas de branding marchand (logo, coordonnees, SIRET)

**Fichier** : `app/api/pro/projects/[id]/dossier/pdf/route.ts`, lignes 410-500
**Severite** : P1 (le dossier fait "generique", pas "pro Thomas Berger")

La couverture affiche "Versimo" en logo (ligne 415-421). Il n'y a aucune mention du marchand : pas de nom, pas de telephone, pas d'email, pas de logo, pas de SIRET.

Pour Thomas, le dossier doit porter SA marque. Quand l'acquereur le recoit, il doit voir "Thomas Berger Immobilier" en haut, pas "Versimo". Le branding Versimo peut rester en footer discret ("Powered by Versimo"), mais le header doit etre celui du marchand.

**Impact** : L'acquereur ne sait pas qui est l'interlocuteur. Le dossier n'a pas la credibilite d'un document professionnel signe.

**Correction** :
- Ajouter les champs marchand dans le profil Pro (nom commercial, logo, telephone, email, SIRET)
- Remplacer "Versimo" en header de couverture par le logo/nom du marchand
- Ajouter une ligne de contact sous le logo
- Garder "Powered by Versimo" en footer

### P1-2 -- Pas de DPE/GES dans le dossier

**Fichier** : `app/api/pro/projects/[id]/dossier/pdf/route.ts`
**Severite** : P1 (obligatoire legalement sur les annonces immo)

Le DPE (Diagnostic de Performance Energetique) est obligatoire sur toute annonce immobiliere en France. Un dossier de pre-commercialisation sans DPE est incomplet et potentiellement non-conforme.

**Impact** : Thomas ne peut pas utiliser ce dossier comme support officiel. Il devra l'ajouter manuellement -- ce qui annule le gain de temps de Versimo.

**Correction** :
- Ajouter les champs DPE (classe energetique A-G) et GES (classe A-G) au projet
- Afficher les pastilles DPE/GES sur la couverture du PDF
- Format standard francais (fleche coloree avec classe)

### P1-3 -- Le PDF n'est pas persiste (blob URL perdu a la fermeture)

**Fichier** : `app/projet/[id]/dossier/page.tsx`, lignes 92-99, 302-310
**Severite** : P1 (retrouvabilite)

Le PDF est stocke en blob URL (`URL.createObjectURL(blob)`). Quand Thomas ferme l'onglet, le blob est revoque (cleanup correct). Mais quand il revient 3 semaines plus tard pour le meme acquereur, il doit regenerer le PDF.

Il n'y a pas de sauvegarde du PDF en Object Storage ni de lien persistant en base.

**Impact** : Thomas regenere le PDF a chaque visite. Si les visuels ou la description ont change entre-temps, le PDF sera different. Pas de tracabilite des versions envoyees aux acquereurs.

**Correction** :
- Sauvegarder le PDF genere en Object Storage (cle : `pro/{projectId}/dossier-{timestamp}.pdf`)
- Stocker le chemin en base (`pro_projects.last_pdf_path`, `pro_projects.last_pdf_date`)
- Au chargement de la page : si un PDF recent existe, le charger au lieu de regenerer
- Ajouter un bouton "Regenerer" distinct du "Telecharger"

### P1-4 -- Apercu PDF ne fonctionne pas sur iOS Safari

**Fichier** : `app/projet/[id]/dossier/page.tsx`, lignes 617-646
**Severite** : P1 (mobile-first)

L'apercu utilise `<object data={pdfUrl} type="application/pdf">`. iOS Safari ne supporte PAS l'affichage inline de PDF via `<object>` ni `<iframe>` (c'est une limitation connue de WebKit). Le fallback est present (icone + bouton Telecharger), mais Thomas sur son iPhone 15 Pro ne verra jamais l'apercu -- il devra toujours telecharger.

**Impact** : Sur mobile, l'apercu est toujours en mode fallback. Thomas ne peut pas verifier le contenu avant de partager sans telecharger.

**Correction** :
- Detecter iOS/Safari et afficher directement le mode "Telecharger" (sans le fallback qui semble etre un bug)
- OU utiliser pdf.js pour un rendu canvas multi-page (lourd mais universel)
- OU generer des thumbnails JPG des pages du PDF pour un apercu leger

### P2-1 -- Touch targets sous le minimum Apple (36px au lieu de 44px)

**Fichier** : `app/projet/[id]/dossier/page.tsx`, lignes 499-592
**Severite** : P2 (UX mobile)

Les boutons de la barre d'actions utilisent `py-2 px-3` soit environ 36px de hauteur. Le minimum Apple Human Interface Guidelines est 44x44px. Sur iPhone, les doigts de Thomas risquent de taper le mauvais bouton.

Note : le stepper mobile respecte bien 44px (min-w-[44px] min-h-[44px] dans ProStepper ligne 240).

**Correction** :
- Augmenter les boutons a `py-3 px-4` minimum (44px de hauteur)
- OU ajouter `min-h-[44px]` sur chaque bouton d'action

### P2-2 -- Le bouton "Retour aux visuels" est ambigu

**Fichier** : `app/projet/[id]/dossier/page.tsx`, lignes 869-877
**Severite** : P2 (UX)

Le bouton principal est "Voir tous mes biens" (sage, prominent) et le secondaire est "Retour aux visuels" (outline). Le probleme : "Retour aux visuels" peut signifier "retour a l'etape 6 (generation)" ou "retour a ma galerie de visuels". En realite il redirige vers `/projet/${projectId}/generation` (etape 6).

Pour Thomas qui a termine le parcours et veut partager, ce bouton cree un doute : "Est-ce que je perds mon dossier si je retourne en arriere ?"

**Correction** :
- Renommer en "Modifier les visuels (Etape 6)" pour etre explicite
- OU remplacer par "Regenerer des visuels" qui indique clairement l'action

### P2-3 -- Pas de compteur de caracteres sur la description

**Fichier** : `app/projet/[id]/dossier/page.tsx`, lignes 788-805
**Severite** : P2 (UX)

Le textarea d'edition de description n'a pas de compteur de caracteres. La validation cote API (ManualDescriptionSchema) limite a 2000 caracteres, mais Thomas ne le sait pas. Il peut ecrire 2500 caracteres et recevoir une erreur opaque.

**Correction** :
- Ajouter un compteur `{desc.length}/2000` sous le textarea
- Colorer en rouge quand > 1800 (warning) et > 2000 (erreur)

### P2-4 -- Pas de pagination recommandations multi-pages (bug potentiel)

**Fichier** : `app/api/pro/projects/[id]/dossier/pdf/route.ts`, lignes 764-790
**Severite** : P2 (qualite PDF)

Le code de pagination des recommandations a un bug structurel : quand une recommandation deborde de la page, il cree une nouvelle page (`nextRecPage`) mais continue a ecrire sur `recPage` (l'ancienne page, variable const). Le commentaire ligne 789 le reconnait : "we can't easily reassign const, let's handle multi-page recommendations in a simpler way."

En pratique, si les recommandations depassent une page, les recommandations suivantes seront ecrites HORS de la zone visible de la premiere page (y < FOOTER_HEIGHT + 20 → break), et la nouvelle page sera vide sauf le titre.

**Impact** : Avec beaucoup de recommandations (> 8-10), le PDF sera tronque.

**Correction** :
- Refactorer avec une variable `let currentRecPage` mutable
- Ou extraire dans une fonction `drawRecommendations(pdfDoc, lot, font, fontBold)` qui gere la pagination

---

## Resume des priorites

| Priorite | ID | Description | Impact |
|---|---|---|---|
| P0 | P0-1 | Lien de partage derriere auth -- acquereur bloque | Partage = mort |
| P0 | P0-2 | Pas de prix du bien dans le PDF | Dossier incomplet pour acquereur |
| P1 | P1-1 | Pas de branding marchand (logo, coordonnees) | Dossier generique, pas pro |
| P1 | P1-2 | Pas de DPE/GES | Non-conforme annonce immo |
| P1 | P1-3 | PDF non persiste (blob URL) | Retrouvabilite = zero |
| P1 | P1-4 | Apercu PDF mort sur iOS Safari | Mobile degradee |
| P2 | P2-1 | Touch targets 36px < 44px minimum Apple | UX mobile |
| P2 | P2-2 | "Retour aux visuels" ambigu | Confusion navigation |
| P2 | P2-3 | Pas de compteur caracteres description | Limite invisible |
| P2 | P2-4 | Bug pagination recommandations multi-pages | PDF tronque |

---

## Ecart au seuil 9.5/10

Note actuelle : **6.8/10** -- ecart de **2.7 points**.

La remontee de 4.0 a 6.8 est significative (le PDF existe pour de vrai maintenant, les photos sont dedans). Mais pour atteindre 9.5 :

1. **P0-1** (partage) et **P0-2** (prix) feraient remonter a ~7.5-8.0
2. **P1-1** (branding) et **P1-2** (DPE) feraient remonter a ~8.5-9.0
3. **P1-3** (persistence) + **P1-4** (iOS) + corrections P2 feraient atteindre ~9.5

Le chemin est clair mais il reste du travail. Le dossier est utilisable en telechargeant le PDF et en l'envoyant par piece jointe -- mais ce n'est pas l'experience "10 secondes" que Thomas attend pour 99 EUR.
