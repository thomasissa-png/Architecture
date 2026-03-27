# Audit Acheteur — Dossier PDF Versiroom — 2026-03-27

**Persona** : Marc Leroy, 38 ans, iPhone 14 Pro, recu le PDF par WhatsApp de Thomas.
**Source auditee** : `app/api/dossier/[uuid]/pdf/route.ts` + `app/dossier/[uuid]/page.tsx`

---

## Verdict rapide

**PEUT-ETRE — avec friction.** Le PDF est lisible et pro, mais il ne fait pas appeler en 30 secondes. Le prix est absent de la page de couverture si Thomas ne le renseigne pas. Il n'y a pas de DPE. Le téléphone du vendeur existe uniquement dans le footer à 7pt — introuvable sur iPhone. La page web `/dossier/` est nettement supérieure au PDF.

---

## Notes

| # | Critere | Note /10 | Observation |
|---|---------|----------|-------------|
| 1 | **Premiere impression** | 6/10 | La couverture ouvre sur le logo marchand + hero image meublée en A4 paysage. Bon en principe. Mais le hero fait 220pt de haut sur 595pt — il occupe moins de 40% de la page. Le reste est du texte à 11pt. Premier regard : "un document Word soigne", pas "un beau dossier immo" |
| 2 | **Qualite des visuels** | 7/10 | Les photos sont embarquées depuis l'Object Storage en JPG. La qualite dépend de la generation IA. Le format A4 paysage est adapté au avant/apres cote a cote. Labels "Avant home staging" / "Apres home staging" clairs. Pas d'artefact structurel dans la mise en page |
| 3 | **Informations essentielles** | 5/10 | Prix present en gras 14pt si `bien_prix` renseigne — bien. Surface et nb pieces en ligne info à 10pt en couleur sage — visible. Mais DPE absent (zero champ dans le schema Dossier). Etage, ascenseur, charges : absents. Prix/m2 quartier present uniquement si `prix_moyen_m2` est renseigne par Thomas. Trop conditionnel |
| 4 | **Projection dans les pieces** | 7/10 | Une page par piece, avant/apres cote a cote en A4 paysage : format pertinent. Label piece + style en haut de page. Numero de page. Marc peut feuilleter et se projeter piece par piece. Point faible : pas de nom de piece explicite si `room_label` est vide (tombe sur "Photo 1") |
| 5 | **Organisation par piece** | 7/10 | Structure lineaire : couverture → pages par piece. Ordre logique. Mais pas de sommaire. Sur un PDF de 6 pieces (7 pages), pas de souci. Sur 15 pieces (16 pages) : Marc perd le fil. La pagination "1 / 5" dans le header est discrete (7pt, centree, gris clair) |
| 6 | **Contact vendeur** | 3/10 | CRITIQUE. Le telephone est dans le footer de chaque page a 7pt gris clair, aligne a droite, non cliquable dans un PDF standard. Sur iPhone, les PDFs ne rendent pas les liens tel: dans le footer. Marc voit le numero mais ne peut pas appeler en 1 tap. Aucun bouton d'appel, aucun QR code vers le lien tel:. C'est le probleme structurel du format PDF |
| 7 | **Partage conjoint(e)** | 6/10 | Le PDF se partage par WhatsApp ou email — c'est le vecteur naturel de Thomas. Preview WhatsApp affiche le nom du fichier (ex: "T3-Chartrons-versiroom.pdf"), pas une image. La conjointe de Marc ouvre le PDF, voit la couverture meublée, peut feuilleter. Fonctionnel mais pas aussi bon qu'un lien web avec OpenGraph preview image |
| 8 | **Mobile iPhone** | 4/10 | A4 paysage sur iPhone 14 Pro = zoom obligatoire pour lire le texte de description a 11pt. La couverture est lisible en mode paysage, illisible en mode portrait sans zoomer. Les pages avant/apres demandent un pinch-to-zoom pour voir les details. Le PDF n'est pas pensé mobile-first — c'est un document bureau envoye sur mobile |
| 9 | **Confiance / credibilite** | 7/10 | Disclaimer IA present sur chaque page footer : "Visuels generés par IA a titre indicatif — Powered by Versiroom". Legal, non-intrusif, EU AI Act Art. 50 couvert. Logo marchand en haut a gauche si dispo. Branding sage/foreground coherent avec Versiroom. Le "Powered by Versiroom" dans le footer pro est discret mais present — Thomas peut vouloir son propre branding exclusif |
| 10 | **Rapidite de decision** | 5/10 | En 30 secondes sur iPhone : Marc voit la couverture, lit le titre (T3 60m2 format portail), voit le prix si renseigne, voit la photo hero. Il feuillette 2-3 pages. Il cherche le numero — il le trouve en 7pt dans le footer. Il ne peut pas appeler en 1 tap. Il pose le PDF et ouvre le lien web a la place. Le PDF est un complement de documentation, pas un outil de conversion |

**Moyenne** : 5.7 / 10

---

## Les 3 questions fondamentales

| Question | Note /10 | Verdict |
|----------|----------|---------|
| Ca a l'air PRO ? | 7/10 | Oui : branding marchand, couleurs coherentes, disclaimer. Pas d'artéfact de mise en page. Mais Helvetica + pdf-lib = "document institutionnel", pas "plaquette prestige" |
| C'est COHERENT ? | 7/10 | Photos/description cohérentes, style uniforme, structure logique. Mais les champs conditionnels (prix, DPE, pieces) creent des trous visuels si Thomas ne renseigne pas tout |
| Ca me fait APPELER ? | 2/10 | Non. Le telephone est en footer 7pt non cliquable sur iPhone. Aucun bouton. Aucun QR code. Le PDF convertit mal |

---

## Top 3 problemes

**P0 — Contact non actionnable sur iPhone**
Le telephone du vendeur est dans le footer de chaque page a 7pt, texte gris, non cliquable. Sur iOS, un PDF affiche le footer mais les liens tel: dans le footer pdf-lib ne sont pas interactifs. Marc voit le numero mais doit le recopier a la main. Taux de conversion appel depuis PDF : proche de zero.

**P1 — Format A4 paysage inadapte au mobile**
80% des acheteurs lisent sur iPhone. A4 paysage = 842x595pt. Sur un ecran de 390px de large, le PDF s'affiche en zoom-out illisible ou force un scroll horizontal. La couverture et les pages avant/apres demandent un pinch-to-zoom systematique. Le PDF est concu pour s'imprimer ou etre vu sur ecran 13"+.

**P2 — DPE absent du schema Dossier**
Zero champ DPE dans la table `dossier` (type Dossier dans `lib/dossier.ts`). Le DPE est obligatoire dans toute annonce immobiliere (loi Climat et Resilience 2021). Marc l'attend systematiquement. Son absence signale une annonce incomplete — il peut douter de la serieux du vendeur.

---

## Top 3 points positifs

**+ Avant/apres cote a cote en paysage** : le format A4 landscape est en realite bien pense pour la comparaison avant/apres — les deux images se lisent d'un seul regard, contrairement au slider web qui demande une interaction.

**+ Disclaimer IA sur chaque page** : "Visuels generés par IA a titre indicatif" est present sur toutes les pages, pas seulement en couverture. C'est la bonne pratique EU AI Act, et ca protege Thomas juridiquement.

**+ Troncature description avec "..."** : le fix de debordement description fonctionne — le texte ne chevauche plus la zone disclaimer. La couverture reste aéree même avec des descriptions longues.

---

## Corrections P0-P2

**P0 — Ajouter un QR code "Appeler" en couverture**
Generer un QR code pointant vers `tel:[telephone]` et l'afficher en couverture a cote du numero. Sur iPhone, scanner un QR code depuis l'app Camera ouvre directement le composeur. Alternative : ajouter le lien web `/dossier/[uuid]` en QR code — Marc scanne, arrive sur la page web avec le bouton ContactSticky vert en bas.

**P1 — Produire aussi un format A4 portrait pour mobile**
Ajouter un parametre `?format=portrait` a l'endpoint PDF. En portrait : hero pleine largeur, infos en dessous, puis pages avant (haut) / apres (bas) empilees. Lisible sur iPhone sans zoom. Thomas choisit le format selon l'usage (impression = paysage, partage WhatsApp = portrait).

**P2 — Ajouter champ DPE au schema Dossier**
Ajouter `dpe_classe` (A-G) et optionnellement `dpe_valeur` (kWh/m2/an) a la table `dossier`. Afficher le badge DPE couleur standard en couverture PDF (carre colore + lettre) et en page dossier web. Sans DPE, l'annonce est legalement incomplete.
