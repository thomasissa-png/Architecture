# Audit Thomas Berger -- Parcours photos / generation / dossier (v2)

**Date** : 2026-04-11 | **Scenario** : Bureaux achetes, plan uploade, pieces extraites. Photos chantier, visuels meubles, dossier acquereur.
**Note globale : 7.2 / 10**

---

## Tableau des 10 questions

| # | Question | Note | Commentaire |
|---|----------|------|-------------|
| 1 | Upload photos par piece | 8/10 | Chaque piece a son slot photo, preview, warning "Pas de photo = pas de generation". Upload par piece avec progress. Sauvegarde brouillon. Manque : multi-photo (1 seule par piece, je prends 3 angles sur chantier). |
| 2 | Projection bureaux -> appart | 6/10 | Le room_type est modifiable (select: salon, chambre, cuisine...). Le pipeline le transmet a generatePass() qui adapte le mobilier. MAIS zero guidage : rien ne dit "changer bureau en salon = visuel de salon". Thomas ne fait pas le lien mental select → rendu IA. |
| 3 | Cloisons cassees | 4/10 | Deal-breaker. Le pipeline genere a partir de la PHOTO de chaque piece. Si le plan editor dit "fusionner bureau 1+2 = salon", la generation recoit quand meme 2 photos separees avec mur visible. Aucun mecanisme de fusion photo ou suppression virtuelle de mur. |
| 4 | Echelle des meubles | 7.5/10 | buildDimensionBlock() injecte surface_m2, length_m, width_m, ceiling_height_m dans le prompt. Les styles ont dimensions mobilier explicites (230cm canape, 120cm table). extractRoomInventory() via vision IA ancre l'echelle. Correct en theorie. |
| 5 | Style par piece ou par bien | 8.5/10 | Style par LOT (etape qualification). 12 styles + custom. Un lot = un ensemble de pieces. Scandinave pour le T2, Japandi pour le T3, dans le meme immeuble. Exactement le bon grain. Pas de preview visuelle du style avant generation. |
| 6 | Avant/apres par piece | 9/10 | Page generation : polling 3s, statut par piece (pass1/pass2/done/failed), cascade image (output > pass1 > placeholder). Page dossier : grille avant/apres avec labels. Retry par piece si echec. Pas de slider interactif, mais fonctionnel. |
| 7 | Dossier PDF | 6.5/10 | PDF auto-genere au chargement. Preview inline avec object tag. Download 1 clic. MAIS incomplet : pas de DPE, pas de surface par piece, selling_price absent du PDF (present sur page partage seulement). Pour une plaquette pro, Thomas retourne sur Canva. |
| 8 | Page partageable | 8.5/10 | SSR, metadata OG (titre + image premier visuel), branding marchand (raison_sociale, tel, email), prix si renseigne, disclaimer non-contractuel. Share WhatsApp natif via navigator.share. Token UUID sans auth. Excellent. |
| 9 | Qualite pro | 7/10 | Pipeline 2 passes gpt-image-1.5, input_fidelity high, 25 sprints d'optimisation. Room inventory vision IA. Code solide. MAIS : pas de zoom/lightbox, images petites en grid 2 colonnes, impossible de verifier les details avant envoi. |
| 10 | Workflow global | 6.5/10 | 7 etapes de bout en bout. Le stepper guide bien. MAIS c'est BEAUCOUP : de la photo au visuel, 5 pages. Un marchand presse veut upload → style → generer → partager en 3 clics. Les etapes qualification + recommandations ajoutent de la valeur mais freinent le workflow critique. |

---

## 5 problemes les plus graves

**P0 -- Cloisons non gerees dans la generation (4/10)**
Le plan editor permet "fusionner bureau 1 et bureau 2 = salon". Mais le pipeline generation traite chaque piece individuellement avec sa photo propre. Resultat : 2 visuels de bureaux avec mur visible au lieu d'1 salon ouvert. Thomas promet un T3 a son acquereur mais le visuel contredit la promesse. Bloquant pour la conversion bureaux→appart.

**P1 -- Aucun guidage sur la projection (6/10)**
Quand Thomas change le room_type de "bureau" a "salon", zero feedback textuel. Un texte "Le visuel sera genere en tant que salon meuble" + icone de transformation suffirait. Le marchand ne devine pas que modifier un select HTML change le rendu IA.

**P2 -- PDF incomplet pour une plaquette pro (6.5/10)**
Manque DPE, surface par piece, prix de vente, plan de masse. Le selling_price est affiche sur la page partage publique mais PAS dans le PDF. Thomas doit completer dans Canva = defaite du "game changer vs 1500 euros prestataire".

**P3 -- Trop d'etapes avant generation (6.5/10)**
7 etapes. Un marchand presse veut : upload photos, choisir style, lancer, partager. Les etapes qualification et recommandations ajoutent de la valeur mais pourraient etre optionnelles ou fusionnees.

**P4 -- Pas de multi-photo ni zoom (7-8/10)**
Une seule photo par piece. Pas de lightbox/zoom pour verifier la qualite. Sur mobile en grid 2 colonnes, les visuels avant/apres sont minuscules. L'acquereur ne peut pas apprecier le travail de staging.

---

## Ce qui marche bien

- **Retry par piece** : bouton "Reessayer cette piece" sans relancer le batch entier
- **Partage WhatsApp natif** : navigator.share sur mobile = preview OG riche pour l'acquereur
- **Page publique SSR** : branding marchand, prix, disclaimer legal, zero auth
- **Description commerciale IA** : generee + editable + sauvegardable, enorme gain de temps
- **Pipeline 2 passes solide** : 25 sprints d'optimisation, room inventory vision, dimensions injectees
- **PDF auto-genere** : pret au chargement de la page, preview inline, download 1 clic
- **Polling temps reel** : barre de progression, timer, statut par piece, UX generation fluide
