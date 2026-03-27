# Re-audit Acheteur — Dossier PDF + Page Web — V4 — 2026-03-27

**Persona** : Marc Leroy, 38 ans, iPhone 14 Pro.
**Corrections auditées V4** : portrait A4 (595×842pt) / photos avant/après empilées / page "Votre interlocuteur" / polices brand PDF / couleurs brand CSS / email pro dans contact block / ContactSticky couleur brand.

---

## Verdict rapide

**OUI — Marc appelle.** Le PDF passe de "document à imprimer" à "dossier lisible sur iPhone en portrait". La page dernière "Votre interlocuteur" professionnalise le contact. La page web avec `MerchantBrandWrapper` + `MerchantInfoBlock` donne confiance en 10 secondes. Deux micro-frictions résiduelles.

---

## Tableau V1 / V2 / V3 / V4

| # | Critere | V1 | V2 | V3 | V4 | Delta V3→V4 | Justification V4 |
|---|---------|----|----|----|----|-------------|-----------------|
| 1 | Premiere impression | 6 | 7 | 7 | 8 | +1 | Portrait A4 : hero 220pt de haut pleine largeur au-dessus du fold — la première photo meublée s'impose immédiatement sans zoom. En V3 (paysage) la couverture était lisible mais écrasée sur iPhone |
| 2 | Qualite des visuels | 7 | 7 | 7 | 8 | +1 | Photos empilées verticalement (avant haut / après bas) à pleine largeur (515pt sur 595pt) — chaque image occupe la moitié de la page. En V3 les photos côte à côte étaient trop petites sur iPhone pour juger la qualité |
| 3 | Informations essentielles | 5 | 7 | 9 | 9 | = | Conservé : prix en couleur brand, surface, DPE, prix/m² quartier. Analyse du marché 3 colonnes sur la page web. Aucune régression |
| 4 | Projection dans les pieces | 7 | 7 | 7 | 8 | +1 | Une pièce par page, avant en haut / après en bas avec séparateur brand — Marc comprend instantanément la transformation. Label "Après home staging" en couleur secondaire brand renforce la lecture |
| 5 | Organisation par piece | 7 | 7 | 7 | 8 | +1 | Titres de pages en couleur primaire brand (police serif ou sans-serif selon marchand). La hiérarchie visuelle est nette : titre pièce → avant → après → footer |
| 6 | Contact vendeur | 3 | 7 | 8 | 9 | +1 | Email pro ajouté dans le contact block couverture (lien mailto: cliquable, lignes 582-597 route.ts). Page "Votre interlocuteur" : tél. + email centré + QR code 80pt. `MerchantInfoBlock` sur page web : tel et email cliquables en 1 tap |
| 7 | Partage conjoint(e) | 6 | 7 | 9 | 9 | = | OG image WhatsApp intacte. La page web avec le branding marchand donne une preview pro. Pas de régression |
| 8 | Mobile iPhone | 4 | 6 | 6 | 9 | +3 | C'est la correction capitale. Portrait 595×842pt : texte 11pt lisible sans zoom, photos empilées pleine largeur, header logo + coordonnées en 9pt, footer AI disclaimer à 7pt. Marc lit le PDF directement dans l'aperçu iOS. La friction numéro 1 de V1/V2/V3 est résolue |
| 9 | Confiance / credibilite | 7 | 8 | 8 | 9 | +1 | Police brand (TimesRoman pour Playfair/Lora, Helvetica pour les sans-serif) + couleurs brand sur titres / prix / séparateurs / footer. Page web : `MerchantBrandWrapper` propage `--brand-primary` et `--brand-font`. L'ensemble forme un système visuel cohérent perçu comme pro |
| 10 | Rapidite de decision | 5 | 7 | 8 | 9 | +1 | Sur iPhone : ouvrir le PDF → voir hero meublé → lire prix + surface en 3s → feuilleter les pièces portrait sans zoomer → scanner QR ou taper tél. Page web : ContactSticky couleur brand visible en permanence. Marc décide avant la dernière page |

**Moyenne V1** : 5.7 / 10
**Moyenne V2** : 7.0 / 10
**Moyenne V3** : 7.6 / 10
**Moyenne V4** : 8.6 / 10
**Delta V3→V4** : +1.0 pt

---

## Les 3 questions fondamentales

| Question | V1 | V2 | V3 | V4 |
|----------|----|----|----|-----|
| Ca a l'air PRO ? | 7 | 8 | 8 | 9 |
| C'est COHERENT ? | 7 | 8 | 9 | 9 |
| Ca me fait APPELER ? | 2 | 7 | 8 | 9 |

---

## Ce qui fonctionne en V4

- **Portrait A4 natif** : `PAGE_WIDTH = 595`, `PAGE_HEIGHT = 842` — le format correspond exactement à l'écran iPhone en portrait. Zéro zoom requis.
- **Photos empilées pleine largeur** : `imgAreaWidth = 515pt`, chaque image remplit la page. L'avant/après est immédiatement lisible.
- **Page "Votre interlocuteur"** : logo centré 120×80pt, raison sociale en 20pt couleur brand, séparateur, coordonnées centrées 11pt, QR code 80pt — une page de closing professionnel.
- **Polices brand mappées** : Playfair Display / Lora → TimesRoman, Inter / Montserrat / DM Sans → Helvetica. La cohérence typographique est préservée dans les contraintes pdf-lib.
- **Email pro cliquable** : `mailto:` avec `addLinkAnnotation()` identique au `tel:` — Marc tape une fois sur l'email pour envoyer un message.
- **ContactSticky brand** : `brandColor` propagé depuis `profile.couleur_principale` — le bouton d'appel permanent correspond aux couleurs du marchand.

---

## Corrections résiduelles (2 points manquants pour 10/10)

**CR1 — Fallback OG image absent (moyenne, +0.2 pt, critère 7)**
`ogImages` est `undefined` quand `heroPhoto` est null (dossier partiel ou en génération).
Diff exact dans `app/dossier/[uuid]/page.tsx` :
```diff
- const ogImages = heroPhoto?.output_image_key
-   ? [{ url: `${BASE_URL}/api/logs/image?path=...`, ... }]
-   : undefined;
+ const ogImages = heroPhoto?.output_image_key
+   ? [{ url: `${BASE_URL}/api/logs/image?path=...`, ... }]
+   : [{ url: `${BASE_URL}/og-default.jpg`, width: 1200, height: 630, alt: "Versiroom" }];
```
Nécessite un fichier `public/og-default.jpg` (photo meublée générique Versiroom, 1200×630px).

**CR2 — Page "Votre interlocuteur" : pas de lien cliquable sur le tél. et l'email (basse, +0.2 pt, critère 6)**
Les coordonnées de la dernière page sont du texte passif — pas d'annotations `tel:` / `mailto:`.
Diff exact dans `app/api/dossier/[uuid]/pdf/route.ts`, après le rendu de chaque `contactLines` (bloc `for` ligne 884) :
```diff
+ // Clickable annotations on tel/email lines on the merchant info page
+ if (profile.telephone && line.includes(profile.telephone)) {
+   const telDigits = profile.telephone.replace(/[^+\d]/g, "");
+   addLinkAnnotation(infoPage, pdfDoc, { x: PAGE_WIDTH/2 - lineWidth/2, y: infoY - 2, width: lineWidth, height: 14 }, `tel:${telDigits}`);
+ }
+ if (profile.email_pro && line === profile.email_pro) {
+   addLinkAnnotation(infoPage, pdfDoc, { x: PAGE_WIDTH/2 - lineWidth/2, y: infoY - 2, width: lineWidth, height: 14 }, `mailto:${profile.email_pro}`);
+ }
```

---

## Prêt pour production

Les corrections V4 résolvent les deux problèmes structurels identifiés en V3 (format iPhone + crédibilité marchand). La note 8.6/10 dépasse le seuil de visite. Les deux corrections résiduelles sont des améliorations de confort, pas des bloquants.
