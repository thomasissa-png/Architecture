# VisiRenov — Memoire Projet

## Contexte Produit

VisiRenov est un outil de home staging virtuel par IA pour architectes, marchands de biens et particuliers.
L'utilisateur uploade des photos de pieces vides et l'IA genere des visuels meubles dans un style choisi parmi 12 ambiances.

- **Stack** : Next.js 14, React, TypeScript, Tailwind CSS, App Router
- **APIs IA** : OpenAI GPT-image-1 (principal) + SDXL img2img via Replicate (fallback)
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
    route.ts        — API generation IA (rate limit, OpenAI + SDXL fallback)
lib/
  image-utils.ts    — Resize/compression client + validation contenu image
components/
  UploadZone.tsx    — Zone drag & drop (react-dropzone, max 5 photos, 10Mo)
  StylePicker.tsx   — Choix de style (12 styles + Custom avec emoji identifiers)
  ImageComparator.tsx — Comparateur avant/apres + partage (WhatsApp, copier, native share)
  StepIndicator.tsx — Indicateur de progression 3 etapes
agents/
  ux-director.md    — Agent UX Director (Maxime Renault, grille 10 criteres)
  interior-architect.md — Agent Architecte d'Interieur (Yann Duval, 20 ans XP, expert 12 styles)
  ai-image-expert.md    — Agent Expert IA Image (Lucas Moreau, prompt engineering, photorealisme, pipelines IA)
  persona-claire-architecte.md  — Persona Claire, 40 ans, architecte
  persona-thomas-marchand.md    — Persona Thomas, 35 ans, marchand de biens
  persona-lea-acheteuse.md      — Persona Lea, 32 ans, acheteuse particuliere
```

## Parcours Utilisateur (3 etapes)

1. **Upload** — Glisser/deposer ou clic, JPG/PNG/WEBP/HEIC, max 5 photos, 10Mo
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
19. Fallback SDXL img2img avec prompt_strength 0.35 (preserve architecture)
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

### Agent Architecte d'Interieur (agents/interior-architect.md)
- Persona : Yann Duval, 20 ans XP, ex-Jean-Louis Deniot/Studioilse/Yabu Pushelberg
- Invocation : "Fais appel a l'agent Architecte d'Interieur pour [auditer/evaluer/critiquer] [styles/prompts/ambiances]"
- Grille : 10 criteres (fidelite stylistique, vocabulaire visuel, eclairage, credibilite pro, photorealisme...)
- Expertise : Maitrise des 12 styles de la plateforme + prompt engineering IA generative

### Agent Expert IA Image (agents/ai-image-expert.md)
- Persona : Lucas Moreau, ex-Midjourney/Getty AI Lab/Sotheby's Digital, photographe pro
- Invocation : "Fais appel a l'agent Expert IA Image pour [auditer/evaluer/optimiser] [prompts/pipeline/parametres]"
- Grille : 10 criteres (preservation architecturale, lumiere, vocabulaire photo, structure prompt, negative prompting, multi-modeles, coherence I/O, richesse descriptive, adaptabilite, rendu final)
- Expertise : Prompt engineering multi-modeles (GPT-image-1, SDXL, Midjourney), photographie immobiliere, photorealisme IA

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

### Sprint 4 — Audit Production (28 issues)
27. CRITIQUE : Ajout response_format "b64_json" a OpenAI images.edit (sans ca, b64_json toujours undefined)
28. CRITIQUE : Fix MIME type image/jpeg (client envoie JPEG, route.ts disait PNG)
29. CRITIQUE : Revert Flux 1.1 Pro -> SDXL img2img (Flux est text-to-image, ignore l'input image)
30. HAUTE : Fix fuite memoire URL.createObjectURL — useMemo + cleanup dans page.tsx et UploadZone
31. HAUTE : handleDownloadAll utilise blob URL au lieu de data URI (Safari)
32. HAUTE : ImageComparator reecrit avec dataUriToBlob() pour download, clipboard, native share
33. HAUTE : Fix hydration mismatch navigator.share (useEffect + state)
34. MOYENNE : loadImage() — revoke URL en cas d'erreur (fuite memoire)
35. MOYENNE : AbortController pour annuler les requetes fetch en cours
36. MOYENNE : handleFullReset abort les requetes in-flight + reset isGenerating
37. MOYENNE : Support HEIC/HEIF dans UploadZone dropzone accept config
38. MOYENNE : next.config.mjs — suppression cle "api" invalide, garde serverActions bodySizeLimit

### Sprint 5 — Audit Architecte d'Interieur (Agent Yann Duval)
39. Ajout agent Architecte d'Interieur (agents/interior-architect.md) — expert 12 styles, grille 10 criteres
40. Reecriture complete des 12 prompts de generation (StylePicker.tsx) :
    - Ajout direction d'eclairage specifique par style (Nordic daylight, warm 2700K, golden hour, etc.)
    - Ajout hero pieces iconiques (Eames lounge, Noguchi table, sunburst mirror, etc.)
    - Ajout textiles de fenetre (sheer linen, heavy velvet drapes, no curtains, etc.)
    - Ajout palettes de couleurs concretes (warm greige, dusty blue, cognac leather, etc.)
    - Ajout accessoires secondaires (livres, bougies, vases, plateaux, plantes specifiques)
    - Ajout ratio meuble/espace (Wabi-Sabi 30%, Maximaliste 80%)
    - Differenciation renforcee du Contemporain (sculptural lamp, smoked glass, editorial aesthetic)
    - Prompts enrichis de 20-30 mots a 60-80 mots pour meilleure qualite GPT-image-1

### Sprint 6 — Audit Expert IA Image (Agent Lucas Moreau)
41. Ajout agent Expert IA Image (agents/ai-image-expert.md) — prompt engineering multi-modeles, photorealisme, photographie pro
42. P0 : Ajout descripteurs photographiques techniques (DSLR full-frame, 16-35mm f/8, RAW quality, white balance)
43. P1 : Ajout coherence eclairage (shadow angles, shadow softness, specular reflections, color temperature matching)
44. P2 : Ajout clause conditions de chantier (pieces brutes, non finies — ajout peinture/sol propre sans deformer la geometrie)
45. P3 : Restructuration ordre du prompt GPT-image-1 (style FIRST pour poids token maximal, puis intention photo, puis contraintes)
46. P4 : Creation buildSDXLPrompt() dedie (~60 mots, style-first, optimise pour fenetre d'attention SDXL)
47. P4 : Creation SDXL_NEGATIVE_PROMPT deduplique et precis (14 termes vs 17 redondants)
48. Renforcement contraintes architecturales (geometrie plafond, poutres, hauteur sous plafond, reflexions vitres/miroirs)
49. Ajout references d'echelle mobilier (poignees de porte ~1m, prises electriques)
50. Mise a jour buildDalle2Prompt() avec descripteurs photo condenses (1000 chars max)
51. P5 : Gestion conditions d'exposition variables (pieces sombres → garder ambiance low-light, fenetres cramees → preserver highlights)
52. P6 : Condensation ARCHITECTURAL_CONSTRAINTS de 6 phrases a 3 (reduction dilution tokens tardifs, -30 mots)
53. P7 : Ajout deep DOF / sharp focus coherent avec f/8 grand-angle (standard photo immobiliere) + negative SDXL "shallow depth of field, bokeh"
54. Fix critique : ajout directive d'action explicite "Furnish and stage this empty room" en tete des 3 prompts (GPT-image-1, DALL-E 2, SDXL)

### Sprint 7 — Fix Generation IA (images quasi identiques a l'input)
55. CRITIQUE : Reecriture complete des prompts GPT-image-1 — approche ACTION-DOMINANTE au lieu de contraintes-dominantes
    - Ancien prompt : ~400 mots dont ~250 mots de "ne rien changer" → modele ultra-conservateur, retourne l'image quasi inchangee
    - Nouveau prompt : ~120 mots, action forte en tete ("TRANSFORM this empty room into a fully furnished interior"), style ensuite, 1 seule ligne de contraintes a la fin
56. CRITIQUE : SDXL prompt_strength augmente de 0.35 a 0.55 (ancien = 65% image originale preservee, aucun meuble visible)
57. Ajout "empty room, unfurnished, bare walls, no furniture" au negative prompt SDXL (force le modele a ne PAS reproduire la piece vide)
58. Prompts DALL-E 2 et SDXL alignes sur la meme strategie action-dominante
59. Fix partage WhatsApp : utilise navigator.share avec fichier image sur mobile (au lieu de wa.me text-only)

### Sprint 8 — Pipeline 2 passes : surfaces d'abord, mobilier ensuite
60. CRITIQUE : Reecriture complete de route.ts depuis zero — abandon des patchs v1-v5
    - Apprentissage : toutes les approches single-pass (decrire surfaces + meubles en une fois) echouent
    - Le modele recree la scene au lieu d'editer quand le prompt demande trop de changements
61. Strategie v6 : pipeline en 2 passes
    - Passe 1 (actuelle) : finition des surfaces UNIQUEMENT (murs, sol, plafond, luminaire)
    - Passe 2 (future) : ajout du mobilier sur la piece finie
    - Principe : moins on demande de changement par passe, mieux la geometrie est preservee
62. Prompts GPT-image-1 reecrit de zero : "Edit this photo of a room. Keep exact same camera angle..."
    - Phrase par phrase, chaque instruction clairement separee
    - "No furniture" repete explicitement pour eviter toute hallucination de meubles
63. SDXL prompt_strength a 0.35 (surfaces seulement = changement minimal)
64. Negative prompt SDXL : inclut furniture/sofa/chair/table pour forcer piece vide
65. Audit Agent Expert IA Image (Lucas Moreau) — 5 corrections appliquees :
    - R1 : lumiere PRESERVEE au lieu d'IMPOSEE ("preserve existing lighting conditions")
    - R2 : descripteurs photo techniques (DSLR full-frame, wide-angle, deep DOF, sharp focus)
    - R3 : preservation perspective renforcee (lens distortion, vanishing points, window positions)
    - R4 : adaptabilite conditions variables (plus d'hypothese fenetre/lumiere naturelle)
    - R5 : negative prompt SDXL enrichi (distorted perspective, fisheye, stretched walls)
    - DALL-E 2 : prompt descriptif au lieu d'instructif
    - SDXL : style en tete de prompt (premiers tokens = plus d'influence)

### Sprint 9 — Fix modele ultra-conservateur + abandon mask
66. TESTE ET REJETE : mask full transparent — le modele genere une image completement nouvelle
    - Mask alpha=0 = le modele ignore l'image input et recree la scene de zero
    - Resultat : images de canapes/bougies au lieu de la piece originale, angle perdu
    - Apprentissage : images.edit est un outil d'INPAINTING, pas de style transfer
67. CRITIQUE : Swap priorite modeles — SDXL img2img devient le modele PRIMAIRE
    - SDXL est concu pour l'image-to-image avec prompt_strength reglable (0.50)
    - GPT-image-1 via images.edit est le fallback uniquement
    - prompt_strength 0.50 = 50% input + 50% prompt (0.35 ne changeait rien)
68. Suppression sharp et code mask (inutile sans mask)
69. Negative prompt SDXL enrichi : "dangling cables", "junction box", "unfinished floor"

### Sprint 10 — Changement d'architecture API (Responses API + Flux Depth Pro)
70. CRITIQUE : Abandon total de images.edit — outil d'inpainting inadapte pour l'edition de surfaces
    - Sans mask : modele ultra-conservateur, copie l'input
    - Mask full transparent : modele genere une image nouvelle, perd toute la geometrie
    - Aucun juste milieu possible avec cette API
71. CRITIQUE : Abandon SDXL img2img — prompt_strength trop grossier
    - 0.35 = aucun changement visible
    - 0.50 = geometrie perdue + meubles ajoutes malgre le negative prompt
72. PRIMARY : Migration vers OpenAI Responses API (openai.responses.create)
    - Le modele VOIT l'image via la vision (comme ChatGPT) et genere une version editee
    - Tool image_generation avec input_fidelity: "high" preserve la geometrie
    - Modele gpt-4.1 pour la meilleure qualite vision + generation
    - Fondamentalement different de images.edit : vision contextuelle vs inpainting pixel
73. FALLBACK : Flux Depth Pro sur Replicate (black-forest-labs/flux-depth-pro)
    - Extrait automatiquement une depth map de l'image input
    - Utilise la depth map pour contraindre la generation (geometrie 3D verrouillee)
    - Permet le restyling de surface tout en preservant la structure spatiale
74. Suppression de DALL-E 2 (deprecated, shutdown 2026-05-12)
75. Reecriture complete de route.ts — architecture propre avec 2 providers

### Sprint 11 — Implementation pipeline 2 passes complet
76. CRITIQUE : Implementation du pipeline 2 passes dans route.ts
    - Passe 1 (surfaces) : finition murs/sol/plafond/luminaire, piece VIDE — fonctionnait deja
    - Passe 2 (mobilier) : ajout meubles/textiles/decoration sur la piece finie
    - Le serveur enchaine les 2 passes automatiquement (passe 1 → resultat → passe 2)
    - Le client n'a pas besoin de changer — un seul appel API, 2 passes internes
77. CRITIQUE : Prompts passe 2 ultra-conservateurs pour ne PAS modifier les surfaces
    - "DO NOT change the walls, floor, ceiling, paint color, windows, doors"
    - "The room surfaces must look IDENTICAL to the input photo"
    - Objectif : le modele doit comprendre que l'image input est FINIE, il doit juste AJOUTER des objets
78. Apprentissage : "TRANSFORM" dans le prompt = le modele regenere toute la piece
    - Solution : "Add furniture and decoration to this photo" — instruction d'AJOUT, pas de transformation
79. Flux Depth Pro : guidance differenciee par passe (12 pour surfaces, 15 pour mobilier)
80. Fonction generatePass() factorise la logique OpenAI/Flux avec fallback par passe

## Regles de Developpement

- Design minimaliste, pas de surcharge visuelle
- Mobile-first pour les interactions tactiles
- Feedback visuel a chaque action utilisateur
- Auto-scroll guide entre les etapes
- Accessibilite : focus rings, ARIA roles, contraste
- Messages d'erreur actionnables (pas generiques)
- Animations subtiles (cubic-bezier, 700ms max)

## Regles Prompts IA (CRITIQUE)

- **Responses API en priorite** : utiliser `openai.responses.create()` avec le tool `image_generation` + `input_fidelity: "high"`. Le modele VOIT l'image via la vision et genere une version editee. Fondamentalement different de `images.edit` (inpainting).
- **Flux Depth Pro en fallback** : modele Replicate qui extrait une depth map de l'input pour verrouiller la geometrie 3D tout en permettant le restyling des surfaces.
- **NE PAS utiliser images.edit** : c'est un outil d'inpainting. Sans mask = trop conservateur. Avec mask = perd toute la geometrie. Inadapte pour l'edition de surfaces.
- **NE PAS utiliser SDXL img2img** : prompt_strength est un outil trop grossier. A 0.35 rien ne change, a 0.50 la geometrie est perdue et des meubles apparaissent malgre le negative prompt.
- **DALL-E 2 est deprecated** (shutdown 2026-05-12) — ne plus utiliser.
- **Pipeline 2 passes (implemente)** : le serveur enchaine automatiquement passe 1 (surfaces) puis passe 2 (mobilier). Le client fait un seul appel. Ne JAMAIS tout demander en une seule passe.
- **Passe 1 = surfaces** : "Edit this photo of a room. Apply [style] finish to the surfaces only. Keep the room EMPTY." Mots-cles : no furniture, no rugs, no curtains.
- **Passe 2 = mobilier** : "Add furniture and decoration to this photo of a finished room. DO NOT change the walls, floor, ceiling..." Mots-cles : IDENTICAL surfaces, add only.
- **NE PAS utiliser "TRANSFORM"** : ce mot pousse le modele a regenerer toute la scene. Utiliser "Add" ou "Edit" a la place.
- **Prompt COURT et instructif** : chaque passe ~6 phrases max. Le modele doit editer, pas generer.
