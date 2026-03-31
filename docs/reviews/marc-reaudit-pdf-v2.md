# Re-audit Acheteur — Dossier PDF + Page Web — V2 — 2026-03-27

**Persona** : Marc Leroy, 38 ans, iPhone 14 Pro.
**Corrections auditees** : P0 QR code + tel 16pt bold en couverture PDF / P1 ContactSticky en bas de page web / P2 Badge DPE colore en PDF et page web.

---

## Verdict rapide

**OUI pour la page web. PEUT-ETRE pour le PDF.** La page `/dossier/` est devenue l'outil de conversion — ContactSticky vert en bas, appel en 1 tap, DPE badge visible dans les pills. Le PDF reste un document de documentation pro, pas un outil d'appel direct. Le QR code en couverture PDF ferme la boucle mobile.

---

## Tableau V1 vs V2

| # | Critere | Note V1 | Note V2 | Delta | Justification |
|---|---------|---------|---------|-------|---------------|
| 1 | Premiere impression | 6/10 | 7/10 | +1 | PDF : QR code + tel 16pt en couverture occupent l'espace vide en bas — couverture plus dense. Page web : hero 16/9 full-width avant le titre, excellent impact visuel |
| 2 | Qualite des visuels | 7/10 | 7/10 | = | Pas de changement sur la qualite des visuels IA eux-memes. A4 paysage avant/apres reste pertinent |
| 3 | Informations essentielles | 5/10 | 7/10 | +2 | DPE badge colore present en PDF (inline avec les pills info) et sur la page web (meme palette A-G). Prix, surface, pieces, adresse : inchanges. La correction P2 leve le probleme de conformite legale |
| 4 | Projection dans les pieces | 7/10 | 7/10 | = | Structure avant/apres par piece inchangee. Page web : DossierPublicView avec comparateur slider intact |
| 5 | Organisation par piece | 7/10 | 7/10 | = | Pas de sommaire ajoute. Structure lineaire adequate pour 3-5 pieces |
| 6 | Contact vendeur | 3/10 | 7/10 | +4 | PDF : QR code 62pt en bas-gauche couverture pointant vers `/dossier/[uuid]` + tel en 16pt bold — Marc scanne et arrive sur la page web avec ContactSticky. Page web : bouton "Appeler" vert sticky bas de page, 48px min-height, `tel:` en 1 tap. Correction P0 + P1 combinées = transformation majeure |
| 7 | Partage conjoint(e) | 6/10 | 7/10 | +1 | Page web : OpenGraph metadata title+description dynamiques, ShareButtons. PDF : nom de fichier clean `T3-Chartrons-versimo.pdf`. La page web est nettement superieure pour le partage couple |
| 8 | Mobile iPhone | 4/10 | 6/10 | +2 | PDF : toujours A4 paysage (pas de format portrait ajoute — correction P1 non appliquee en totalite). Mais le QR code en couverture renvoie vers la page web mobile-first. Page web : responsive, ContactSticky tap-friendly. Le vecteur d'appel est desormais web, pas PDF |
| 9 | Confiance / credibilite | 7/10 | 8/10 | +1 | DPE badge colore standard (vert A → rouge G) renforce la legitimite legale. Disclaimer IA toujours present sur chaque page PDF. Page web : disclaimer complet en footer "visuel d'illustration non contractuel" |
| 10 | Rapidite de decision | 5/10 | 7/10 | +2 | PDF : en 30s Marc voit la couverture, scanne le QR, arrive sur la page web, tape "Appeler". 2 etapes au lieu de 0 — acceptable. Page web : en 30s Marc voit hero, prix, DPE, tapote "Appeler" — decision possible |

**Moyenne V1** : 5.7 / 10
**Moyenne V2** : 7.0 / 10
**Delta** : +1.3 pts

---

## Les 3 questions fondamentales

| Question | V1 | V2 | Verdict |
|----------|----|----|---------|
| Ca a l'air PRO ? | 7/10 | 8/10 | DPE badge officiel + branding coherent = signal de serieux |
| C'est COHERENT ? | 7/10 | 8/10 | PDF et page web sont desormais coherents : meme DPE, meme contact, meme visuels |
| Ca me fait APPELER ? | 2/10 | 7/10 | ContactSticky vert sur la page web = conversion possible. PDF seul = toujours moyen |

---

## Ce qui fonctionne apres corrections

- QR code en couverture PDF : Marc scanne sur iPhone, arrive sur la page web, ContactSticky visible immediatement
- Tel 16pt bold en couverture : premier element de contact visible sans zoomer
- DPE badge colore A-G : present sur PDF (inline pills) et page web — conformite legale, signal pro
- ContactSticky : bouton "Appeler" vert full-width, 48px, fixed bottom, 1 tap — meilleur CTA de l'ensemble du parcours
- Page web en action principale : la page `/dossier/` fait la conversion, le PDF est la documentation

---

## Corrections residuelles pour atteindre 9.5/10

**R1 — PDF portrait pour iPhone (critique, +1 pt potentiel)**
A4 paysage reste illisible en portrait sur iPhone sans zoom. Ajouter `?format=portrait` a l'endpoint PDF : hero pleine largeur, infos dessous, avant/apres empiles. Marc lit le PDF directement sans scanner le QR.

**R2 — Numero de telephone cliquable dans le PDF (haute, +0.5 pt)**
pdf-lib permet `page.drawText()` avec annotation URI. Ajouter une annotation `tel:` sur le rectangle du numero de telephone en couverture. Sur iOS 16+, Apercu/Chrome PDF reader rend les liens cliquables.

**R3 — Prix/m2 calcule automatiquement si manquant (haute, +0.5 pt)**
La ligne `prix_moyen_m2` du quartier n'apparait que si Thomas la renseigne manuellement. Injecting une estimation auto (prix bien / surface) sur la page web au moins — Marc veut toujours voir le ratio m2.

**R4 — OpenGraph image explicite sur `/dossier/` (moyenne, +0.3 pt)**
`generateMetadata` ne passe pas de `openGraph.images`. Quand Marc envoie le lien a sa conjointe sur WhatsApp, la preview affiche le titre+description mais pas l'image hero. Ajouter `images: [{ url: heroImageUrl }]` dans la metadata.
