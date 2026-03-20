# VisiRenov — Memoire Projet

## Contexte Produit

VisiRenov est un outil de home staging virtuel par IA pour architectes, marchands de biens et particuliers.
L'utilisateur uploade des photos de pieces vides et l'IA genere des visuels meubles dans un style choisi parmi 12 ambiances.

- **Stack** : Next.js 14, React, TypeScript, Tailwind CSS, App Router
- **APIs IA** : OpenAI GPT-image-1 (principal) + Flux 1.1 Pro via Replicate (fallback)
- **Design** : Minimaliste, architecture-grade, inspiration Apple/Foster+Partners
- **Langue UI** : Francais
- **Palette** : Background #FAFAF8, Foreground #1C1C1E, Sage #7D9B76
- **Typographie** : Inter (300-800)

## Architecture Fichiers

```
app/
  page.tsx          — Page principale (Hero + Outil 3 etapes + Pricing)
  layout.tsx        — Layout racine (metadata SEO + OpenGraph, lang fr)
  globals.css       — Styles globaux, animations, scrollbar custom
  api/generate/
    route.ts        — API generation IA (rate limit, OpenAI + Flux fallback)
lib/
  image-utils.ts    — Resize/compression client + validation contenu image
components/
  UploadZone.tsx    — Zone drag & drop (react-dropzone, max 5 photos, 10Mo)
  StylePicker.tsx   — Choix de style (12 styles + Custom avec emoji identifiers)
  ImageComparator.tsx — Comparateur avant/apres + partage (WhatsApp, copier, native share)
  StepIndicator.tsx — Indicateur de progression 3 etapes
agents/
  ux-director.md    — Agent UX Director (Maxime Renault, grille 10 criteres)
  persona-claire-architecte.md  — Persona Claire, 40 ans, architecte
  persona-thomas-marchand.md    — Persona Thomas, 35 ans, marchand de biens
  persona-lea-acheteuse.md      — Persona Lea, 32 ans, acheteuse particuliere
```

## Parcours Utilisateur (3 etapes)

1. **Upload** — Glisser/deposer ou clic, JPG/PNG/WEBP, max 5 photos, 10Mo
2. **Style** — Choix parmi 12 styles predefinis + mode personnalise (textarea)
3. **Resultat** — Comparateur slider avant/apres + telechargement HD

## Corrections UX Appliquees

### Sprint 1 — Audit UX Director
1. Auto-scroll entre etapes (upload -> style -> generer -> resultats)
2. Bouton supprimer visible sur mobile (pas hover-only)
3. Feedback visuel apres upload (toast vert avec checkmark)
4. CTA Hero remonte au-dessus de la fold (padding reduit)
5. Bouton "Reessayer" relance la generation directement (handleRetry)
6. Timer + estimation au loader de generation
7. Focus-visible:ring sur tous les elements interactifs + ARIA roles

### Sprint 2 — Feedback Personas
8. 12 styles au lieu de 3 (Japandi, Art Deco, Mid-Century, Boheme, Haussmannien, Mediterraneen, Cosy, Wabi-Sabi, Maximaliste)
9. Hero multi-cible (Architectes, Marchands, Particuliers) avec pills
10. Visuels Hero enrichis (SVG architectural avant/apres au lieu de rectangles gris)
11. Boutons de partage (Telecharger HD, Copier image, WhatsApp, Partager natif mobile)
12. Batch export "Tout telecharger" quand plusieurs resultats
13. Section Pricing 3 tiers (Gratuit / Pro 29EUR / Business 79EUR)
14. Header avec nav (Tarifs + CTA Essayer)
15. Footer corrige : annee 2026, messaging ouvert a tous
16. Social proof line sous le Hero (12 styles, 10-30s, HD gratuit)

### Sprint 3 — Audit IA (Agent Yann Leclair)
17. Resize/compression client (max 2048px, JPEG 85%) dans lib/image-utils.ts
18. Rate limiting IP-based (10 req/min) avec cleanup memoire automatique
19. Remplacement fallback SDXL par Flux 1.1 Pro (vrai modele d'editing)
20. Support ratios natifs (landscape 1536x1024, portrait 1024x1536, square 1024x1024)
21. Traitement multi-images parallele (Promise.allSettled, max 2 concurrent)
22. Prompt engineering enrichi (7 constraints architecturales : perspective, eclairage, fixtures, echelle, lignes de fuite, photorealisme)
23. Validation client du contenu image (heuristique uniformite couleur + saturation)
24. Preview blur pendant generation (photos originales floues avec status par image)
25. Metadata SEO multi-audience + OpenGraph tags
26. Negative constraints integrees dans le prompt principal

## Agents Disponibles

### Agent UX Director (agents/ux-director.md)
- Persona : Maxime Renault, 18 ans XP, ex-Zaha Hadid/Foster+Partners/BIG
- Invocation : "Fais appel a l'agent UX Director pour [auditer/evaluer] [cible]"
- Grille : 10 criteres notes sur 10, format tableau + problemes + recommandations

---

## Personas Utilisateurs

### Persona 1 : Claire — L'Architecte

- **Nom** : Claire Dumont
- **Age** : 40 ans
- **Metier** : Architecte d'interieur independante (DPLG), 15 ans d'experience
- **Localisation** : Lyon
- **Contexte** : Cabinet de 3 personnes, travaille sur des projets residentiels haut de gamme
- **Objectif principal** : Se faire des idees rapides de decoration et partager des elements d'inspiration a ses clients
- **Usage type** : Upload une photo de chantier en cours, genere 2-3 styles differents, envoie par email au client pour valider une direction esthetique
- **Devices** : MacBook Pro 16" au bureau, iPad Pro sur chantier
- **Niveau tech** : Bon, utilise Figma, SketchUp, Pinterest au quotidien
- **Frustrations** : Les outils de rendu 3D sont trop longs (2-3 jours par planche), les clients veulent voir "a quoi ca va ressembler" des le premier RDV
- **Attentes** : Rapidite, qualite visuelle credible (pas de rendu cartoon), possibilite de tester plusieurs ambiances sur la meme photo
- **Citation** : "Je ne cherche pas un rendu final, je cherche un support de conversation avec mon client"

### Persona 2 : Thomas — Le Marchand de Biens

- **Nom** : Thomas Berger
- **Age** : 35 ans
- **Metier** : Marchand de biens, societe de negoce immobilier
- **Localisation** : Bordeaux
- **Contexte** : Achete des biens a renover, les revend apres travaux. 8-12 operations/an
- **Objectif principal** : Simuler des images meublees pour ses dossiers de pre-commercialisation et ses annonces
- **Usage type** : Upload les photos du bien brut juste apres l'achat, genere des visuels "apres travaux meubles" pour les plaquettes commerciales et les portails immo
- **Devices** : iPhone 15 Pro (photos sur site), laptop Windows au bureau
- **Niveau tech** : Moyen, utilise Canva, les portails immo, WhatsApp pro
- **Frustrations** : Payer 200-500 EUR par planche a un home stager virtuel, delai de 48-72h, les acquereurs ne se projettent pas sur des photos de murs vides
- **Attentes** : Cout reduit vs home stager humain, rapidite (resultat en minutes), visuels suffisamment realistes pour des plaquettes pro, telechargement HD
- **Citation** : "Si je peux sortir 3 visuels meubles en 10 minutes au lieu de payer 1500 EUR a un prestataire, c'est game changer"

### Persona 3 : Lea — L'Acheteuse

- **Nom** : Lea Martin
- **Age** : 32 ans
- **Metier** : Chef de projet digital dans une agence
- **Localisation** : Nantes
- **Contexte** : Vient d'acheter son premier appartement (T3, 65m2), livraison dans 4 mois
- **Objectif principal** : Chercher de l'inspiration deco pour sa nouvelle maison, visualiser differents styles dans SES pieces
- **Usage type** : Prend des photos de son appartement vide, teste des styles (scandinave, contemporain), enregistre ceux qui lui plaisent, partage sur Instagram/Pinterest
- **Devices** : iPhone 14 (90% du temps), MacBook Air le soir
- **Niveau tech** : Tres bon, digital native, utilise beaucoup d'apps au quotidien
- **Frustrations** : Pinterest montre de belles photos mais jamais dans SA piece, les apps deco existantes sont soit moches soit payantes, elle veut "essayer avant d'acheter" ses meubles
- **Attentes** : Fun, rapide, gratuit ou freemium, partage facile (save image, share), inspiration variee (plus que 3 styles), rendu Instagram-worthy
- **Citation** : "Je veux voir a quoi MON salon ressemblerait en scandinave, pas le salon de quelqu'un d'autre sur Pinterest"

---

## Regles de Developpement

- Design minimaliste, pas de surcharge visuelle
- Mobile-first pour les interactions tactiles
- Feedback visuel a chaque action utilisateur
- Auto-scroll guide entre les etapes
- Accessibilite : focus rings, ARIA roles, contraste
- Messages d'erreur actionnables (pas generiques)
- Animations subtiles (cubic-bezier, 700ms max)
