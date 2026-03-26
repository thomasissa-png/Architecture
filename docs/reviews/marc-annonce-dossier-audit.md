# Audit Acheteur — Page Annonce + Dossier — 2026-03-26

**Persona** : Marc Leroy, 38 ans, iPhone 14 Pro, 40+ visites, decide en 30 secondes.
**Source** : `app/annonce/[uuid]/page.tsx` + `app/dossier/[uuid]/page.tsx`

---

## Verdict rapide

**PEUT-ETRE.** La page annonce est propre et techniquement solide, mais elle a deux angles morts critiques : zero information de quartier (metro, ecoles, commerces) et le CTA "Appeler" est invisible dans le corps de la page — il ne vit que dans la barre sticky en bas. Sur iPhone avec le clavier virtuel sorti ou une notification, ce bouton peut disparaitre. Le dossier est plus faible : il manque un hero photo et la hiérarchie financiere est noye dans du texte de taille identique.

---

## Notes — Page Annonce `/annonce/[uuid]`

| # | Critere | Note /10 | Observation |
|---|---------|----------|-------------|
| 1 | **30 secondes iPhone** | 7/10 | Hero pleine largeur 16/9 charge en premier. Prix en pill noir visible sans scroller. Surface + pieces + ville presents. Mais pas de prix/m2 affiche systematiquement (seulement si `dvf_median_price_m2` renseigne) |
| 2 | **Infos quartier** | 1/10 | CRITIQUE. Adresse normalisee affichee, mais zero mention metro, ecoles, commerces, transports. Marc ne peut pas evaluer la localisation sans ouvrir Google Maps dans un autre onglet |
| 3 | **Contact vendeur — 1 tap** | 6/10 | ContactSticky fonctionne bien : bouton "Appeler" vert sage en bas, tel: link natif, 48px minimum. MAIS : si pas de telephone vendeur → fallback contact@versiroom.fr (perte totale de confiance pour Marc). La section Contact dans le corps de page est discrete (texte lien, pas un bouton). Aucun CTA "Appeler" au-dessus de la fold |
| 4 | **Transparence IA** | 8/10 | Footer : "Projection d'amenagement realisee par Versiroom — le bien est livre brut. Visuels non contractuels." Clair, legal, mais en bas de page. Marc ne le voit qu'apres 10 minutes de scroll. Un badge discret sous la photo hero serait plus visible |
| 5 | **Envie d'appeler — CTA dans le corps** | 4/10 | Aucun bouton CTA dans le corps de la page. La section contact affiche un numero en lien hypertexte non stylise. Le sticky bottom est bon mais Marc ne le voit pas en haut de page — il peut fermer l'onglet avant de le voir |

---

## Notes — Dossier `/dossier/[uuid]`

| # | Critere | Note /10 | Observation |
|---|---------|----------|-------------|
| 6 | **Impression pro** | 6/10 | Layout propre, branding marchand present (logo ou initiales). Mais pas de hero photo — la page commence sur le titre + texte. Sur iPhone Marc voit d'abord du texte, pas un visuel. SeLoger ouvre sur une photo, pas du texte |
| 7 | **Infos financieres** | 5/10 | Prix present (pill noir) mais charges, DPE, taxe fonciere sont dans `DossierCaracteristiques` — composant charge uniquement si `linkedProperty` existe (c-a-d si le bien est lie dans la DB). Sans ce lien, DPE et charges sont absents. Marc ne peut pas savoir si c'est vide par design ou si l'info manque |
| 8 | **Visuels avant/apres** | 8/10 | `DossierPublicView` avec slider avant/apres — excellent pour la projection. Navigation par piece (RoomNav). Lightbox probable. Le seul point faible : aucune image hero avant le titre, la galerie arrive apres la carte OSM |

---

**Moyenne annonce** : (7+1+6+8+4) / 5 = **5.2 / 10**
**Moyenne dossier** : (6+5+8) / 3 = **6.3 / 10**
**Score global** : **5.6 / 10**

---

## Problemes critiques (P0)

**P0-1 — Zero info quartier sur l'annonce**
Marc ouvre une annonce a Bordeaux. Il ne voit que la ville et le code postal. Aucune mention du quartier (Chartrons, Bastide, Begles), aucune ligne sur le metro le plus proche, aucune ecole a 500m. Sur SeLoger, c'est systematique. Resultat : Marc ouvre Google Maps dans un autre onglet et quitte l'annonce. Correction : ajouter une ligne "Quartier + transports + ecoles" sous l'adresse, meme si c'est une information statique generee par Thomas a la creation de l'annonce (champ `property.quartier`, `property.transports`, `property.ecoles`).

**P0-2 — Dossier : pas de hero photo en first view**
Sur iPhone, Marc voit : header + titre texte + description commerciale + infos en texte gris. La premiere photo n'arrive qu'apres la carte OSM et les caracteristiques. Marc est acheteur, pas lecteur. Il lui faut une image avant n'importe quel texte. Correction : placer la premiere photo output avant le titre, comme le fait la page annonce avec son hero 16/9.

---

## Amelioration recommandee (P1)

**P1 — CTA "Appeler" dans le corps de la page annonce**
Le sticky bottom peut etre masque par la barre de navigation iPhone, le clavier, ou une notification systeme. Marc ne le voit pas forcement. Ajouter un bouton "Appeler Thomas — [numero]" en vert sage directement apres la section prix, avant la galerie de photos. Un seul bouton visible, grand, sans friction. Le sticky reste en complement.

---

## Ce qui fonctionne bien

- **Prix en pill noir contrast** : visible immediatement sans scroller, format FR correct
- **ContactSticky** : implementation propre, 48px, tel: link natif, fallback email
- **Disclaimer IA** : formulation legale correcte, non contractuel clairement dit
- **Navigation par piece (RoomNav)** : excellent sur les annonces avec plusieurs pieces
- **Slider avant/apres dans le dossier** : differenciateur fort vs portails immo classiques
- **OpenGraph metadata** : preview WhatsApp avec photo + prix + surface — Marc voit le bien avant d'ouvrir le lien
- **DPE color-coded** : badges couleur standard (vert/rouge) — lisible au premier coup d'oeil
