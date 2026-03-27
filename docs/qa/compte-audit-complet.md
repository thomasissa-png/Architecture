# Audit complet — Page /compte et propagation marchand

Date : 2026-03-27 | Auditeur : @qa

## 1. Fonctionnalites de /compte

| Fonctionnalite | Statut | Detail |
|---|---|---|
| Checkbox marchand | Fonctionnel | Toggle isMerchant, conditionne affichage section |
| SIRET direct (14 chiffres) | Fonctionnel | Validation regex client + serveur, auto-fill raison sociale/adresse/forme juridique |
| Recherche par nom d'entreprise | Fonctionnel | Pappers primary, gouv.fr fallback, dropdown resultats, selection auto-fill |
| hasPappersKey() anti-placeholder | Fonctionnel | Rejette "", "...", "your_*", longueur <= 5 |
| Raison sociale | Fonctionnel | Champ texte libre, pas de validation format |
| Adresse | Fonctionnel | Champ texte libre |
| Telephone | Fonctionnel | Champ tel, aucune validation format cote serveur |
| Email pro | Fonctionnel | type="email" cote client, AUCUNE validation serveur |
| Forme juridique | Fonctionnel | Auto-rempli par lookup, editable |
| Logo upload | Fonctionnel | PNG/JPG, max 2Mo, preview, upload POST separee |
| Couleur principale | Fonctionnel | Color picker + hex input, regex #RRGGBB client+serveur |
| Couleur secondaire | Fonctionnel | Idem |
| Police | Fonctionnel | Select 5 polices, validation whitelist serveur |
| Apercu branding | Fonctionnel | Swatch couleurs + raison sociale dans la police choisie |
| Sauvegarde profil | Fonctionnel | PUT /api/merchant/profile, message succes/erreur |
| Credits restants | ABSENT | Non affiche sur /compte |
| Niveau d'acces | ABSENT | Non affiche sur /compte |

## 2. Propagation branding dans les documents

| Champ | PDF dossier | Page dossier web | Page annonce web | ExportPortail |
|---|---|---|---|---|
| Logo | OUI (couverture) | OUI (header via StorageImage) | OUI (header via StorageImage) | NON |
| Raison sociale | OUI (header droite + footer + contact block) | OUI (header + footer + MerchantInfoBlock) | OUI (header + footer + MerchantInfoBlock + contact) | NON |
| Telephone | OUI (footer + contact block cliquable tel:) | OUI (ContactSticky + MerchantInfoBlock) | OUI (CTA appeler + contact + ContactSticky + MerchantInfoBlock) | NON |
| Email pro | NON | OUI (ContactSticky + MerchantInfoBlock) | OUI (anti-scraping client-side + MerchantInfoBlock) | NON |
| Couleur principale | OUI (titres + prix + tel en brand color) | PARTIEL (initiales fallback seulement) | PARTIEL (initiales fallback seulement) | NON |
| Couleur secondaire | OUI (footer band + separateur + labels "apres") | NON | NON | NON |
| Police custom | NON (Helvetica hardcode) | NON | NON | NON |
| SIRET | NON | OUI (MerchantInfoBlock) | OUI (MerchantInfoBlock) | NON |
| Adresse | OUI (header droite) | OUI (MerchantInfoBlock) | OUI (MerchantInfoBlock) | NON |

## 3. Bugs identifies

### P1 — Police custom = mensonge UI
- **Fichier** : `app/compte/page.tsx` (l.18-24) + `app/api/dossier/[uuid]/pdf/route.ts` (l.236-237)
- Le champ "Police" propose 5 options (Inter, Playfair Display, Montserrat, Lora, DM Sans).
- La valeur est sauvegardee en DB mais JAMAIS utilisee nulle part :
  - PDF : utilise StandardFonts.Helvetica/HelveticaBold (pdf-lib ne supporte que les 14 StandardFonts sans embed custom)
  - Page dossier web : aucun CSS fontFamily / style applique
  - Page annonce web : aucun CSS fontFamily / style applique
- Seul usage : l'apercu dans /compte (l.684 `fontFamily: police`)
- **Impact** : Le marchand choisit une police en pensant qu'elle sera sur ses documents. C'est trompeur.

### P1 — Couleurs non propagees sur pages web (dossier + annonce)
- **Fichier** : `app/dossier/[uuid]/page.tsx`, `app/annonce/[uuid]/page.tsx`
- Les couleurs `couleur_principale` et `couleur_secondaire` sont lues depuis le profil mais JAMAIS appliquees en CSS (pas de `style={{ color: ... }}`, pas de CSS custom properties `--brand-primary`).
- Seul usage web : `backgroundColor` sur le cercle initiales quand pas de logo (couleur_principale).
- Le PDF les utilise correctement (titres, prix, footer, separateurs).
- **Impact** : L'identite visuelle du marchand n'apparait pas sur les pages web partagees aux acquereurs.

### P2 — Email pro non valide cote serveur
- **Fichier** : `app/api/merchant/profile/route.ts`
- Le serveur valide SIRET (regex), couleurs (regex), police (whitelist), mais AUCUNE validation d'email.
- Seule protection : `type="email"` sur l'input HTML (contournable).
- **Impact** : Donnees potentiellement invalides en DB.

### P2 — Accents manquants dans messages d'erreur serveur
- **Fichiers** : `app/api/merchant/profile/route.ts` (l.116, 124), `app/api/merchant/lookup-siret/route.ts` (l.366, 372)
- "acceptes" au lieu de "acceptes" (pas d'accent car OK en WinAnsi mais incoherent avec le reste du code)
- "Reessayez", "Verifiez", "indisponible", "depasser" — tous sans accents
- Les messages cote client dans `page.tsx` ont les accents (l.104, 133) — incoherence

### P2 — Email pro absent du PDF
- **Fichier** : `app/api/dossier/[uuid]/pdf/route.ts`
- Le contact block affiche telephone + raison sociale + QR code, mais jamais l'email pro.
- Le footer affiche raison sociale + telephone, jamais l'email.
- Un marchand sans telephone mais avec email n'a aucune coordonnee dans le PDF.

### P2 — ExportPortail sans branding marchand
- **Fichier** : `components/ExportPortail.tsx`
- Ne recoit aucune prop marchand (raison sociale, telephone, email).
- Le texte exporte pour les portails ne contient pas les coordonnees du marchand.
- Pour un outil B2B, c'est un manque : le texte copie-colle devrait inclure "Contact : [raison sociale] — [telephone]".

## 4. Recommandations

1. **Police** : Soit supprimer le champ (reduire la confusion), soit implementer l'embed de polices custom via pdf-lib `embedFont()` avec les fichiers .ttf + charger les Google Fonts en CSS sur les pages web via `next/font`. Signaler a @fullstack.
2. **Couleurs web** : Appliquer les couleurs marchand en CSS custom properties sur les pages dossier et annonce (`style={{ '--brand-primary': couleur_principale }}`). Signaler a @fullstack.
3. **Email serveur** : Ajouter une regex basique d'email dans le PUT de profile/route.ts. Signaler a @fullstack.
4. **Accents** : Uniformiser les messages d'erreur API avec accents. Signaler a @fullstack.
5. **Email dans PDF** : Ajouter email_pro dans le contact block du PDF quand present. Signaler a @fullstack.
6. **ExportPortail** : Ajouter raison sociale + telephone en props et dans le texte formate. Signaler a @fullstack.

---

**Handoff → @fullstack**
- Fichier produit : `docs/qa/compte-audit-complet.md`
- 2 bugs P1 (police trompeuse, couleurs web manquantes), 4 bugs P2
- La page /compte elle-meme est fonctionnelle — les bugs sont dans la propagation en aval
- Priorite : le P1 "police" peut etre resolu rapidement en supprimant le champ ou en ajoutant un disclaimer "Apercu uniquement"
