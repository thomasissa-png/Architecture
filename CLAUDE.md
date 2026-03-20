# VisiRenov — Memoire Projet

## Contexte Produit

VisiRenov est un outil de home staging virtuel par IA destine aux professionnels de l'immobilier.
L'utilisateur uploade des photos de biens bruts (vides) et l'IA genere des visuels meubles dans un style choisi.

- **Stack** : Next.js 14, React, TypeScript, Tailwind CSS, App Router
- **APIs IA** : OpenAI GPT-image-1 (principal) + Replicate SDXL (fallback)
- **Design** : Minimaliste, architecture-grade, inspiration Apple/Foster+Partners
- **Langue UI** : Francais
- **Palette** : Background #FAFAF8, Foreground #1C1C1E, Sage #7D9B76
- **Typographie** : Inter (300-800)

## Architecture Fichiers

```
app/
  page.tsx          — Page principale (Hero + Outil 3 etapes)
  layout.tsx        — Layout racine (metadata, lang fr)
  globals.css       — Styles globaux, animations, scrollbar custom
  api/generate/
    route.ts        — API generation IA (OpenAI + Replicate fallback)
components/
  UploadZone.tsx    — Zone drag & drop (react-dropzone, max 5 photos, 10Mo)
  StylePicker.tsx   — Choix de style (Scandinave, Industriel, Contemporain, Custom)
  ImageComparator.tsx — Comparateur avant/apres (react-compare-slider)
  StepIndicator.tsx — Indicateur de progression 3 etapes
agents/
  ux-director.md    — Agent UX Director (Maxime Renault, grille 10 criteres)
```

## Parcours Utilisateur (3 etapes)

1. **Upload** — Glisser/deposer ou clic, JPG/PNG/WEBP, max 5 photos, 10Mo
2. **Style** — Choix parmi 3 predefinis + mode personnalise (textarea)
3. **Resultat** — Comparateur slider avant/apres + telechargement HD

## Corrections UX Appliquees

1. Auto-scroll entre etapes (upload -> style -> generer -> resultats)
2. Bouton supprimer visible sur mobile (pas hover-only)
3. Feedback visuel apres upload (toast vert avec checkmark)
4. CTA Hero remonte au-dessus de la fold (padding reduit)
5. Bouton "Reessayer" relance la generation directement (handleRetry)
6. Timer + estimation au loader de generation
7. Focus-visible:ring sur tous les elements interactifs + ARIA roles

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
