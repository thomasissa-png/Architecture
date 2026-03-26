# Audit UX — Perspective Marc Leroy, acheteur immobilier
*Marc, 38 ans, cadre tech Bordeaux. iPhone 14 Pro, metro, 30 secondes pour decider.*
*Date : 2026-03-25*

---

## Verdict rapide

**Marc visiterait — mais seulement si Thomas a rempli ses coordonnees.** La page annonce convertit sur le fond (visuels meubles, prix visible, galerie par piece) mais echoue sur le contact : un telephone absent ou un email cache derriere un tap supplementaire fait sortir Marc du flow au moment critique. Le dossier est plus dense et convaincant, mais expose deux problemes structurels : pas de CTA telephone visible et le comparateur avant/apres vertical sur mobile oblige a scroller trois ecrans pour voir une seule piece.

---

## Tableau d'audit — Livrable 1 : Page annonce `/annonce/[uuid]`

| # | Critere | Note /10 | Observations |
|---|---------|----------|-------------|
| 1 | Premiere impression (3s) | 7/10 | Titre + pills surface/pieces/prix charges immediatement. Header sticky net. Bonne hierarchie visuelle. Manque : aucune photo hero au-dessus du fold — Marc voit du texte avant les images. |
| 2 | Qualite des visuels | 7/10 | Grille 2-cols mobile, aspect 4/3 homogene, lazy load correct. Impossible d'evaluer la qualite IA sans generation reelle, mais le rendu grid est propre. Pas de lightbox : impossible d'agrandir une photo sur mobile. |
| 3 | Informations essentielles | 8/10 | Prix (pill noir), surface, pieces, ville visibles en pills sous le titre. Adresse complete si disponible. Point faible : "Prix sur demande" possible — Marc passe a l'annonce suivante dans ce cas. |
| 4 | Projection dans les pieces | 6/10 | Galerie groupee par piece (Salon, Chambre, etc.) — logique visite virtuelle. Mais photos en grille statique sans comparateur avant/apres : Marc ne voit pas la transformation, donc perd le "effet wow" qui justifie les visuels IA. |
| 5 | Organisation par piece | 8/10 | ROOM_ORDER logique (salon → chambre → cuisine → sdb...), labels h2 clairs. Fort. |
| 6 | Contact vendeur (1 tap) | 4/10 | Telephone present si Thomas l'a rempli → `<a href="tel:...">` direct, bon. Mais l'email est cache derriere un bouton "Afficher l'email" supplementaire. Si telephone absent : "Coordonnees disponibles sur demande" — Marc ferme la page. CTA contact non sticky, perdu apres la galerie. |
| 7 | Partage conjoint(e) | 9/10 | Bouton "Partager" (navigator.share sur iPhone) + fallback WhatsApp URL. Lien direct copiable. Tres bien execute. |
| 8 | Mobile iPhone | 7/10 | Grille 2-cols lisible, pills texte adapte. Probleme : pas de photo hero full-width en premiere position — premier scroll = texte uniquement. Boutons d'action en flex-wrap risquent d'etre coupes sur petit ecran. |
| 9 | Confiance / credibilite | 7/10 | Disclaimer IA en footer ("Visuels generes par intelligence artificielle a titre de simulation") — correct mais texte tres petit (xs, muted/40), quasi invisible. Logo/raison sociale marchand si rempli = credibilite pro. |
| 10 | Rapidite de decision (30s) | 6/10 | Infos cles accessibles rapidement. Mais : absence de photo hero au-dessus du fold ralentit la decision. Sans telephone visible, l'etape contact ajoute une friction eliminatoire. |

**Score global Livrable 1 : 6.9/10**

---

## Tableau d'audit — Livrable 2 : Dossier `/dossier/[uuid]`

| # | Critere | Note /10 | Observations |
|---|---------|----------|-------------|
| 1 | Premiere impression (3s) | 6/10 | Titre + details (adresse, type, surface, prix, prix/m2 quartier) presents mais lisibles en texte inline non hierarchise. Prix noyé dans une ligne de muted text — pas de pill contrastee comme sur l'annonce. La carte de quartier (si disponible) est un point fort distinctif. |
| 2 | Qualite des visuels | 8/10 | Comparateur avant/apres par piece avec labels "AVANT" / "APRES" explicites. La transformation est visible, l'effet est convaincant. Mais les photos sont grandes et le scroll est long sur mobile (une piece = deux photos empilees). |
| 3 | Informations essentielles | 7/10 | Adresse, type, surface, pieces, prix, prix/m2 quartier tous presents. Mais format inline (flexwrap, font-light) — lecture rapide difficile. Prix devrait etre isole visuellement comme une pill ou un chiffre hero. |
| 4 | Projection dans les pieces | 9/10 | C'est le point fort : avant/apres par piece montre LA transformation. Marc comprend immediatement le potentiel du bien. Labels de pieces (h3) au-dessus de chaque paire. Excellent pour convaincre de visiter. |
| 5 | Organisation par piece | 7/10 | Chaque piece dans un bloc card separe avec label. Logique. Mais pas de navigation rapide (anchors) entre pieces — sur un dossier de 5 pieces, Marc doit scroller toute la page. |
| 6 | Contact vendeur (1 tap) | 3/10 | Critique : le contact marchand est relegue au footer, apres les photos et le PDF. Texte inline minuscule (xs, muted), pas de lien tel: cliquable visible. Si Marc est convaincu par les photos, il doit descendre tout en bas pour trouver un contact. Aucun CTA sticky "Contacter". |
| 7 | Partage conjoint(e) | 5/10 | Aucun bouton de partage du lien sur la page dossier. La seule action proposee est "Telecharger le PDF" — inadapte pour partager rapidement par SMS ou WhatsApp. Marc doit copier l'URL manuellement. |
| 8 | Mobile iPhone | 6/10 | Le comparateur avant/apres passe en colonne unique sur mobile (grid-cols-1 sm:grid-cols-2) — deux photos empilees par piece. Un dossier de 4 pieces = 8 photos a faire defiler. Tres long. Scroll fatigue garantie. |
| 9 | Confiance / credibilite | 8/10 | Disclaimer IA present ("a titre de simulation"), date de generation et date d'expiration visibles. Logo/raison sociale marchand en header. La mention prix/m2 du quartier renforce la credibilite professionnelle. |
| 10 | Rapidite de decision (30s) | 5/10 | La densite d'information est bonne pour une decision murie, mais pas pour 30 secondes dans le metro. Le comparateur avant/apres prend du temps a parcourir. Contact introuvable rapidement. Marc met plus d'une minute avant de savoir comment contacter Thomas. |

**Score global Livrable 2 : 6.4/10**

---

## Note — Livrable 3 : Photos partagees (ImageComparator.tsx)

ImageComparator est utilise dans le flow principal de generation (page.tsx), pas sur une page publique partageable. Marc ne voit pas ce composant — il est interne a l'outil Thomas. Les boutons de partage (WhatsApp, copier, telecharger HD) dans ImageComparator envoient une image statique ou le lien annonce, pas un comparateur interactif. Note : hors scope de l'audit acheteur direct, mais le watermark "Genere par IA — Versiroom" est correct pour la conformite EU AI Act.

---

## Top 5 problemes critiques

**P1 — Contact vendeur introuvable en temps reel (annonce + dossier)**
Sur l'annonce : email cache, telephone conditionnel au remplissage Thomas. Sur le dossier : contact relégué au footer en texte xs sans lien tel:. Marc decide de visiter — et ne trouve pas comment appeler. Abandon garanti.

**P2 — Pas de photo hero au-dessus du fold sur la page annonce**
Marc arrive sur une page de texte (titre + pills + adresse). Les photos ne commencent qu'apres le scroll. Sur mobile dans le metro, une page sans image immediate = fermeture reflexe en 2 secondes.

**P3 — Pas de bouton de partage sur le dossier**
Le dossier est le livrable le plus complet (avant/apres + carte + PDF) mais impossible a partager en un tap. Marc ne peut pas l'envoyer a sa conjointe sans copier l'URL manuellement. L'annonce a ce bouton, pas le dossier — incoherence majeure.

**P4 — Scroll infini sur le dossier mobile**
Un dossier de 4 pieces = 8 photos empilees en vertical + PDF CTA + footer. Marc est dans le metro, il n'a pas 90 secondes a scroller. Aucune navigation par ancre entre pieces.

**P5 — Disclaimer IA invisible**
Sur l'annonce : texte xs, couleur muted/40 (quasi transparent). Marc ne le voit pas. Si les visuels semblent trop beaux et que le disclaimer est illisible, Marc arrive a la visite avec des attentes faussees — risque de defiance et d'abandon de la vente.

---

## Ce qui fonctionne bien

- Pills prix/surface/pieces sur l'annonce : lecture en 2 secondes, fort contraste du prix (pill noire)
- Galerie organisee par piece avec ROOM_ORDER logique — visite virtuelle intuitive
- Bouton "Partager" / WhatsApp sur l'annonce : navigator.share sur iPhone, zero friction
- Comparateur avant/apres dans le dossier : l'effet de transformation est visuellement convaincant
- Header sticky avec branding marchand : cree la confiance pro immediatement
- Carte de quartier dans le dossier : differenciateur fort vs annonces SeLoger classiques
- Prix/m2 quartier : argument de valeur implicite ("je paye moins que le marche")
- Lien de telechargement PDF : utile pour conserver le dossier offline

---

---
**Handoff → @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/audit-marc-acheteur.md`
- Decisions prises : evaluation des 2 livrables publics (annonce + dossier) du point de vue de Marc acheteur ; ImageComparator exclu car interne au flow Thomas
- Points d'attention critiques :
  1. Contact vendeur — friction eliminatoire sur les 2 livrables, a corriger en priorite absolue
  2. Photo hero above fold sur l'annonce — manquante, penalise la premiere impression mobile
  3. Bouton de partage manquant sur le dossier — incoherence avec l'annonce qui l'a
  4. Navigation par ancre entre pieces sur le dossier mobile — quick win pour reduire le scroll
  5. Disclaimer IA a rendre lisible sans compromettre l'esthetique (taille et contraste)
---
