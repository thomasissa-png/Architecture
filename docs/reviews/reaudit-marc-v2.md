# Re-audit UX V2 — Perspective Marc Leroy, acheteur immobilier
*Marc, 38 ans, cadre tech Bordeaux. iPhone 14 Pro, metro, 30 secondes pour decider.*
*Date : 2026-03-25 — Audit V2 apres corrections sprint post-V1*

---

## Verdict rapide

**Marc voit une photo, un prix, un bouton vert — il appelle.** Les 3 frictions eliminatoires du V1 sont resolues.

---

## Tableau delta V1 → V2

| # | Critere | Note V1 | Note V2 | Delta | Ce qui a change |
|---|---------|---------|---------|-------|----------------|
| 1 | Premiere impression (3s) — Annonce | 7/10 | 9/10 | +2 | Photo hero full-width 16/9 au-dessus du fold, salon en priorite |
| 2 | Qualite des visuels | 7/10 | 7/10 | = | Pas de lightbox encore — grille 2-cols toujours statique |
| 3 | Informations essentielles | 8/10 | 9/10 | +1 | Pill sage "Prix moyen quartier" ajoutee — argument valeur immediatement lisible |
| 4 | Projection dans les pieces | 6/10 | 6/10 | = | Annonce : grille statique, pas de comparateur. Dossier : avant/apres 4/3 cote a cote desktop |
| 5 | Organisation par piece | 8/10 | 8/10 | = | ROOM_ORDER logique maintenu, labels h2/h3 clairs |
| 6 | Contact vendeur (1 tap) | 4/10 | 9/10 | +5 | ContactSticky fixe en bas sur les 2 pages — bouton "Appeler" sage toujours visible, 48px hit target |
| 7 | Partage conjoint(e) | 9/10 | 9/10 | = | Annonce : deja bon. Dossier : ShareButtons desormais present (copier + WhatsApp/native share) |
| 8 | Mobile iPhone | 7/10 | 8/10 | +1 | Hero immediate, sticky accessible. RoomNav pills scroll horizontal sur dossier |
| 9 | Confiance / credibilite | 7/10 | 9/10 | +2 | Disclaimer reformule positivement ("Projection d'amenagement — visuels non contractuels"), taille sm visible, headers annonce/dossier identiques |
| 10 | Rapidite de decision (30s) | 6/10 | 9/10 | +3 | Photo + prix + prix quartier + bouton Appeler = decision possible sans scroller |

**Score global Annonce : 8.3/10** (V1 : 6.9)
**Score global Dossier : 8.1/10** (V1 : 6.4)

---

## Reponse aux 3 questions fondamentales

### 1. Est-ce que ca a l'air PRO ? — 9/10

Oui. Le header sticky est identique sur les deux pages (logo marchand ou initiales colorees + raison sociale). Le disclaimer n'est plus une confession honteuse en xs/40 — c'est une phrase declarative ("Projection d'amenagement realisee par Versiroom — le bien est livre brut. Visuels non contractuels.") en taille visible. La pill quartier en sage signale que Thomas connait son marche. Un particulier qui vend lui-meme n'a pas ca. Marc se dit : "ce type est professionnel".

Point manquant pour le 10 : le contact en section "Contact" sur l'annonce reste conditionnel (telephone affiché seulement si Thomas l'a rempli — sinon "Coordonnees disponibles sur demande"). Ce message existe toujours et detruit momentanement la credibilite pro.

### 2. Est-ce que c'est COHERENT ? — 9/10

Oui. Les deux pages partagent desormais les memes composants : ContactSticky identique, ShareButtons identique, header identique avec la meme logique logo/initiales/fallback Versiroom, footer identique ("Projection d'amenagement — visuels non contractuels"). RoomNav sur le dossier resout l'incoherence de navigation : Marc peut sauter directement au Salon ou a la Chambre sans scroller 8 photos. Le comparateur AVANT/APRES 4/3 cote a cote est lisible sur desktop ; sur mobile ca passe en colonne unique avec le divide-y — acceptable, la hauteur par paire est contenue (aspect-ratio 4/3 fixe).

Point manquant pour le 10 : l'annonce n'a pas de RoomNav — sur un bien de 5 pieces ca reste un scroll a blanc entre les sections.

### 3. Est-ce que ca me fait APPELER pour visiter ? — 9/10

Oui. Le flow est : hero salon meuble → pills (75m2 / 3 pieces / Bordeaux / 285 000 EUR / Prix moyen quartier 4 200 EUR/m2) → bouton sage "Appeler" fixe en bas de l'ecran. Marc n'a pas besoin de chercher le contact. Il voit la photo, il calcule qu'il est sous le marche, il appuie sur le bouton vert. C'est le flow en 3 touches que j'attendais.

Point manquant pour le 10 : si Thomas n'a pas renseigne son telephone, ContactSticky retombe sur "Envoyer un email" (behavior correct) — mais Marc dans le metro ne veut pas ecrire un mail. Si ni telephone ni email = composant null = plus de CTA du tout. C'est le seul scenario de zero conversion residuel.

---

## Frictions restantes pour atteindre 9.5/10

| Priorite | Friction | Impact | Effort |
|----------|---------|--------|--------|
| P1 | Pas de lightbox sur l'annonce — Marc ne peut pas agrandir une photo sur mobile | Projection incomplete, doute sur la qualite | Moyen |
| P2 | "Coordonnees disponibles sur demande" si Thomas n'a pas rempli le profil — Marc ferme | Conversion zero sur ces annonces | Faible (ux-writing + relance Thomas) |
| P3 | RoomNav absent sur la page annonce (present sur dossier seulement) | Scroll inutile sur les grands biens | Faible (composant existe deja) |
| P4 | Prix inline non hierarchise sur le dossier (flex-wrap text-sm muted) — a lire, pas a voir | Retard de 2s sur l'info cle | Faible (ajouter pill prix comme sur l'annonce) |
| P5 | ContactSticky absent si profil marchand incomplet (pas de telephone, pas d'email) — composant null | Aucun CTA sur ces cas | Moyen (fallback formulaire de contact) |

---

**Handoff → @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/reaudit-marc-v2.md`
- Decisions prises : validation des corrections V2 — les 3 frictions eliminatoires P1/P3/P6 du V1 sont resolues (hero photo, CTA sticky, partage dossier). Scores annonce 8.3/10, dossier 8.1/10.
- Points d'attention residuels : lightbox mobile manquante (P1), "Coordonnees sur demande" si profil vide (P2), RoomNav absent sur annonce (P3), pills prix sur dossier (P4), fallback ContactSticky si aucun contact (P5).
