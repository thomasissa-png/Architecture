# Audit complet — Page /compte et propagation marchand

Date : 2026-03-27 | Auditeur : @qa | Revision : v2

## 1. Fonctionnalites de /compte

| Fonctionnalite | Statut | Detail |
|---|---|---|
| Checkbox marchand | OK | Toggle isMerchant, conditionne affichage section |
| SIRET direct (14 chiffres) | OK | Validation regex client + serveur, auto-fill raison sociale/adresse/forme juridique |
| Recherche par nom entreprise | OK | Pappers primary, gouv.fr fallback (gratuit, sans cle), dropdown, auto-fill |
| hasPappersKey() anti-placeholder | OK | Rejette "", "...", "your_*", longueur <= 5 |
| Raison sociale | OK | Champ texte libre, editable apres lookup |
| Forme juridique | OK | Auto-rempli par lookup, editable |
| Adresse | OK | Champ texte libre |
| Telephone | OK | type="tel", AUCUNE validation format serveur |
| Email pro | OK | type="email" client, AUCUNE validation serveur |
| Logo upload | OK | PNG/JPG, max 2Mo, preview, POST separee, storage key en DB |
| Couleur principale | OK | Color picker + hex input, regex #RRGGBB client + serveur |
| Couleur secondaire | OK | Idem |
| Police | OK | Select 5 polices (Inter, Playfair, Montserrat, Lora, DM Sans), whitelist serveur |
| Apercu branding | OK | Swatch couleurs + raison sociale rendue dans la police choisie |
| Sauvegarde profil (PUT) | OK | Message succes 3s puis disparait, message erreur persistant |
| Lien "Voir mes biens" post-save | OK | Apparait uniquement apres succes |
| Credits restants | ABSENT | Non affiche sur /compte — l'utilisateur ne voit pas ses credits |
| Niveau d'acces | ABSENT | Non affiche sur /compte (Gratuit/Decouverte/Starter/Pro) |

## 2. Propagation branding dans les documents

| Champ | PDF dossier | Page dossier web | Page annonce web | ExportPortail |
|---|---|---|---|---|
| Logo | OUI (couverture haut-gauche) | OUI (header StorageImage) | OUI (header StorageImage) | NON |
| Raison sociale | OUI (header droit + contact block + footer pages photos) | OUI (header + footer + MerchantInfoBlock) | OUI (header + CTA + footer + MerchantInfoBlock + contact) | NON |
| Telephone | OUI (header droit + contact block cliquable tel: + footer pages) | OUI (ContactSticky + MerchantInfoBlock) | OUI (CTA + contact + ContactSticky + MerchantInfoBlock) | NON |
| Email pro | PARTIEL (header droit oui, contact block non) | OUI (ContactSticky + MerchantInfoBlock) | OUI (MerchantInfoBlock + AnnoncePublicView) | NON |
| Adresse | OUI (header droit) | OUI (MerchantInfoBlock) | OUI (MerchantInfoBlock) | NON |
| SIRET | NON | OUI (MerchantInfoBlock) | OUI (MerchantInfoBlock) | NON |
| Couleur principale | OUI (titres, prix, tel contact block) | PARTIEL (initiales fallback uniquement) | PARTIEL (initiales fallback uniquement) | NON |
| Couleur secondaire | OUI (footer band, separateur, labels "apres") | NON | NON | NON |
| Police custom | NON (Helvetica StandardFonts hardcode) | NON | NON | NON |

## 3. Bugs identifies

### P1 — Police custom : promesse non tenue

- **Fichiers** : `app/compte/page.tsx` l.18-24, `app/api/dossier/[uuid]/pdf/route.ts` l.236-237
- Le champ "Police" propose 5 options mais la valeur est IGNOREE partout sauf dans l'apercu /compte.
- PDF : pdf-lib utilise StandardFonts (Helvetica). Supporter des polices custom necessite embedFont() avec fichiers .ttf.
- Pages web dossier/annonce : aucun CSS fontFamily applique.
- **Impact** : Le marchand pense personnaliser ses documents. L'apercu dans /compte est trompeur.
- **Recommandation** : Soit retirer le champ, soit ajouter un disclaimer "Apercu uniquement — les polices personnalisees arrivent bientot". Signaler a @fullstack.

### P1 — Couleurs marchand absentes des pages web

- **Fichiers** : `app/dossier/[uuid]/page.tsx`, `app/annonce/[uuid]/page.tsx`
- `couleur_principale` et `couleur_secondaire` sont lues mais JAMAIS appliquees en CSS sur les pages web.
- Seul usage : backgroundColor sur les initiales (fallback quand pas de logo).
- Le PDF les utilise correctement (titres, prix, separateurs, footer band).
- **Impact** : Un marchand avec couleurs brand #E63946 ne voit aucune difference sur les pages partagees aux acquereurs.
- **Recommandation** : Appliquer via CSS custom properties (--brand-primary, --brand-secondary) sur les titres, pills prix, et separateurs des pages dossier/annonce. Signaler a @fullstack.

### P2 — Email pro absent du contact block PDF

- **Fichier** : `app/api/dossier/[uuid]/pdf/route.ts` l.529-630
- Le contact block (QR + gros telephone + raison sociale) n'inclut pas l'email pro.
- L'email est dans le header droit (l.301) mais en petit (9pt, gris).
- Un marchand sans telephone mais avec email = aucune coordonnee visible dans le contact block.
- **Recommandation** : Ajouter email_pro sous la raison sociale dans le contact block. Signaler a @fullstack.

### P2 — Email pro non valide cote serveur

- **Fichier** : `app/api/merchant/profile/route.ts`
- Validation serveur : SIRET (regex 14 chiffres), couleurs (regex #RRGGBB), police (whitelist). Email = aucune.
- Protection client uniquement : `type="email"` (contournable).
- **Recommandation** : Ajouter regex basique `/.+@.+\..+/` dans le PUT. Signaler a @fullstack.

### P2 — Accents manquants dans messages erreur API

- **Fichiers** : `app/api/merchant/profile/route.ts` l.116, 124 ; `app/api/merchant/lookup-siret/route.ts` l.326, 366, 372
- "acceptes" sans accent, "Reessayez", "Verifiez", "depasser", "trouvee" — tous sans accents.
- Les messages client dans `page.tsx` (l.104, 121, 133) ont les accents — incoherence.
- **Recommandation** : Uniformiser avec accents. Signaler a @fullstack.

### P2 — ExportPortail sans branding marchand

- **Fichier** : `components/ExportPortail.tsx`
- Ne recoit aucune prop marchand. Le texte formate pour les portails ne contient ni raison sociale ni telephone.
- `lib/portal-formatter.ts` n'a aucune reference a merchant/raison/logo/couleur.
- Pour un outil B2B (Thomas, marchand de biens), le texte devrait inclure les coordonnees.
- **Recommandation** : Ajouter props marchand et ligne "Contact :" dans le texte formate. Signaler a @fullstack.

## 4. Resume

- **Page /compte** : fonctionnelle, formulaire complet, feedback utilisateur present, recherche SIRET robuste avec fallback.
- **Propagation PDF** : bonne couverture (logo, couleurs, raison sociale, telephone, adresse). Lacunes : police custom impossible, email absent du contact block.
- **Propagation pages web** : donnees textuelles OK (raison sociale, telephone, email, adresse, SIRET via MerchantInfoBlock). Lacunes : couleurs et police custom non appliquees.
- **ExportPortail** : zero branding marchand.
- **Absents de /compte** : credits restants, niveau d'acces — l'utilisateur ne connait pas son plan.

---

**Handoff -> @fullstack**
- Fichier produit : `docs/qa/compte-audit-complet.md`
- 2 bugs P1 (police trompeuse, couleurs web non propagees), 4 bugs P2
- Decisions : les pages web dossier+annonce doivent appliquer les couleurs marchand via CSS custom properties
- Points d'attention : pdf-lib ne supporte que StandardFonts sans embed .ttf — la police custom est un chantier significatif si on veut la supporter dans le PDF
