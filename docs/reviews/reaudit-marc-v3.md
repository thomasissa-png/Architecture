# Re-audit UX V3 — Perspective Marc Leroy, acheteur immobilier
*Marc, 38 ans, cadre tech Bordeaux. iPhone 14 Pro, metro, 30 secondes pour decider.*
*Date : 2026-03-25 — Audit V3 apres 5 corrections post-V2*

---

## Section 1 — Verdict

**Les 5 frictions P1-P5 du V2 sont resolues : lightbox native, RoomNav sur l'annonce, pill prix dossier, fallback mailto ContactSticky. Marc agrandit les photos, saute aux pieces, voit le prix sans chercher, appelle — meme si Thomas n'a pas rempli son profil.**

---

## Section 2 — Les 3 questions fondamentales

### PRO ? — 9.5/10
Le header est identique sur les deux pages. Le disclaimer est lisible, pas honteux. La pill quartier en sage signal un professionnel qui connait son marche. La lightbox est fluide — X visible, compteur 1/N en haut gauche, fond noir 95%. Le fallback initiales colorees remplace proprement un logo manquant. Le seul point qui bloque le 10 : la section Contact en bas de l'annonce affiche encore "Pour contacter le vendeur, envoyez un message a contact@versimo.fr en mentionnant la reference" si Thomas n'a ni telephone ni email — c'est correct fonctionnellement mais ca casse l'impression pro (le marchand disparait derriere Versimo).

### COHERENT ? — 9.5/10
RoomNav est maintenant present sur les deux pages. ContactSticky a le meme style sur les deux pages. Le prix est hierarchise de la meme facon sur les deux pages (pill noire bg-foreground text-background). La lightbox s'ouvre depuis la galerie annonce avec le meme composant. Le dossier garde son comparateur avant/apres par piece — c'est une difference intentionnelle, pas une incoherence. Seule friction residuelle : le dossier n'a pas de lightbox sur les visuels generes (DossierPublicView affiche les paires avant/apres mais elles ne sont pas cliquables pour agrandissement).

### FAIT APPELER ? — 9.5/10
Flow complet en 4 secondes : hero salon meuble → pills prix → bouton sage fixe en bas. La lightbox permet de verifier la qualite d'une photo sans quitter la page. Le fallback mailto contact@versimo.fr dans ContactSticky garantit qu'il y a TOUJOURS un CTA, meme profil vide. Marc ne se retrouve plus bloque face a un composant null. Le seul scenario encore imparfait : si Marc ouvre la lightbox et veut appeler directement depuis l'ecran plein noir — le ContactSticky est sous la lightbox (z-60 vs z-90), il doit fermer la lightbox d'abord.

---

## Section 3 — Tableau delta V2 → V3

| # | Critere | Note V2 | Note V3 | Delta | Ce qui a change |
|---|---------|---------|---------|-------|----------------|
| 1 | Premiere impression (3s) — Annonce | 9/10 | 9/10 | = | Hero full-width maintenu, aucun changement |
| 2 | Qualite des visuels | 7/10 | 9.5/10 | +2.5 | Lightbox plein ecran avec swipe, navigation clavier, compteur, fond noir 95% — Marc peut evaluer chaque photo |
| 3 | Informations essentielles | 9/10 | 9.5/10 | +0.5 | Pill prix noire coherente sur les deux pages (dossier corrige V3) |
| 4 | Projection dans les pieces | 6/10 | 8/10 | +2 | Lightbox = agrandissement par piece sur annonce. Dossier : comparateur avant/apres toujours statique (non cliquable) |
| 5 | Organisation par piece | 8/10 | 9/10 | +1 | RoomNav desormais present sur l'annonce (absent en V2) — jump direct Salon / Chambre |
| 6 | Contact vendeur (1 tap) | 9/10 | 9.5/10 | +0.5 | Fallback mailto contact@versimo.fr si profil vide — plus de composant null, CTA toujours present |
| 7 | Partage conjoint(e) | 9/10 | 9/10 | = | ShareButtons dossier maintenu, annonce inchange |
| 8 | Mobile iPhone | 8/10 | 9/10 | +1 | Swipe lightbox natif, touch target 50px sur fleches, scroll lock body — aucun bug UX detecte |
| 9 | Confiance / credibilite | 9/10 | 9/10 | = | Disclaimer visible maintenu. Section contact bas de page encore conditionnelle (Thomas absent = Versimo) |
| 10 | Rapidite de decision (30s) | 9/10 | 9.5/10 | +0.5 | Aucun scenario de zero-CTA residuel — decision possible dans tous les cas profil |

---

## Section 4 — Score global

**Score Annonce V3 : 9.2/10** (V2 : 8.3 | +0.9)
**Score Dossier V3 : 9.0/10** (V2 : 8.1 | +0.9)

---

## Section 5 — Frictions restantes pour 9.5/10

| Priorite | Friction | Impact | Effort |
|----------|---------|--------|--------|
| P1 | ContactSticky masque par la lightbox (z-60 vs z-90) — Marc ne peut pas appeler depuis la vue plein ecran | Conversion bloquee si Marc veut appeler apres avoir vu une belle photo | Tres faible (monter ContactSticky a z-[95] ou ajouter un bouton Appeler dans la lightbox) |
| P2 | DossierPublicView — visuels avant/apres non cliquables (pas de lightbox) | Marc ne peut pas zoomer sur le rendu meuble du dossier | Moyen (ajouter Lightbox dans DossierPublicView comme dans AnnonceGallery) |
| P3 | Section Contact bas de page annonce : affiche "contactez Versimo" si Thomas sans profil — detail visible 3s apres le CTA sticky | Legere erosion de credibilite pro sur les profils incomplets | Faible (remplacer par un encart "Informations disponibles apres visite" ou masquer la section si aucun contact marchand) |

---

**Handoff → @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/reaudit-marc-v3.md`
- Decisions prises : validation corrections V3 — les 5 frictions P1-P5 du V2 sont resolues. Scores annonce 9.2/10, dossier 9.0/10.
- Points d'attention residuels : ContactSticky masque par lightbox (P1 facile — z-index), lightbox absente sur DossierPublicView (P2 moyen), section contact bas de page si profil vide (P3 faible).
