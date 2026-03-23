# VisiRenov — Memoire Projet

## Contexte Produit

VisiRenov est un outil de home staging virtuel par IA pour architectes, marchands de biens et particuliers.
L'utilisateur uploade des photos de pieces vides et l'IA genere des visuels meubles dans un style choisi parmi 12 ambiances.

- **Stack** : Next.js 14, React, TypeScript, Tailwind CSS, App Router
- **APIs IA** : OpenAI Responses API gpt-4.1 (principal) + Flux Depth Pro via Replicate (fallback)
- **Design** : Minimaliste, architecture-grade, inspiration Apple/Foster+Partners
- **Langue UI** : Francais
- **Palette** : Background #FAFAF8, Foreground #1C1C1E, Sage #7D9B76
- **Typographie** : Inter (300-800)
- **Deploiement** : Replit — https://architecture-toum92.replit.app/
- **Admin** : https://architecture-toum92.replit.app/admin (visualisation generations + logs DB)
- **API Logs** : https://architecture-toum92.replit.app/api/logs (consultation generations recentes)
- **API Images** : https://architecture-toum92.replit.app/api/logs/image?path=... (images full-size)

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

### Sprint 12 — Fix hallucination fenetres (Audit Expert IA Image)
81. CRITIQUE : Cause racine identifiee — les stylePrompts de StylePicker.tsx contiennent "curtains/drapes" dans 10/12 styles
    - Le modele invente une fenetre pour rendre "sheer linen curtains" coherent
    - Solution : fonction sanitizeStyleForFurniturePass() qui supprime les clauses curtains/drapes avant injection
82. HAUTE : Reformulation positive des contraintes murales
    - "Every wall stays solid and unbroken" au lieu de "DO NOT add windows" (la negation amorce le modele)
    - Contrainte de comptage explicite : "If the input has no windows, the output must have no windows"
83. HAUTE : Ancrage colorimetrique anti-derive
    - "Do not shift the hue, do not warm up or cool down the tone" (empeche le color grading global)
84. MOYENNE : Passe 2 restructuree — "freestanding objects ONLY"
    - Interdit wall art, built-in shelving (reduit la tentation de modifier les murs)
    - "Room structure is LOCKED" remplace "architecture frozen"
85. Apprentissage : mentionner "window/door" meme en negatif AMORCE le modele a les generer
    - NE JAMAIS mentionner d'elements architecturaux qu'on ne veut pas voir apparaitre

### Sprint 13 — Refonte structurelle prompts (Audit croise Yann Duval + Lucas Moreau)
86. CRITIQUE : Split des 12 stylePrompts en surfacePrompt + furniturePrompt (StylePicker.tsx)
    - Ancien : un seul prompt monolithique (~60 mots) injecte dans les 2 passes
    - Probleme : le style ecrasait les contraintes de preservation (murs blancs → plâtre ocre, sol → geometrique)
    - Nouveau : surfacePrompt (couleur murs, sol, plafond, luminaire) pour passe 1, furniturePrompt (mobilier + deco) pour passe 2
    - Chaque passe recoit UNIQUEMENT les informations pertinentes
87. CRITIQUE : Suppression de TOUTES les directives de lumiere des stylePrompts
    - Ancien : "warm tungsten accent lighting", "golden hour sunlight flooding" → le modele changeait l'eclairage original
    - Nouveau : AUCUNE directive de lumiere dans les styles — la lumiere de l'input est sacree
    - Les prompts disent "preserve existing lighting conditions" sans exception
88. CRITIQUE : Suppression de TOUTES les mentions de curtains/drapes/windows des styles
    - Plus besoin du sanitizer sanitizeStyleForFurniturePass() — les prompts sont propres a la source
    - Zero risque d'hallucination de fenetre car zero mention de rideaux
89. CRITIQUE : Fix format/dimensions de l'image de sortie
    - Le client envoie width/height, le serveur calcule le ratio et passe le size a OpenAI + Flux
    - OpenAI : parametre size sur le tool image_generation (1536x1024, 1024x1536, 1024x1024)
    - Flux : parametres width/height explicites
90. HAUTE : Enrichissement des furniturePrompts avec silhouettes de mobilier precises
    - Dimensions explicites (230cm wide, 120cm table, 200x300cm rug)
    - Formes specifiques (channel-tufted, biomorphic, tapered legs, curved back)
    - References de style sans marques (Eames-style, Sputnik-style, Louis XV-style)
    - Textiles precis (kilim cushions, boucle fabric, sheepskin throw)
91. HAUTE : surfacePrompts limites aux finitions SANS modifications structurelles
    - Pas de moulures, pas de motifs de sol geometriques, pas de cheminee
    - Seuls autorises : couleur/finition murs, type de sol, plafond, luminaire plafond
    - Art Deco : herringbone parquet + cornice trim (subtil) au lieu de sol geometrique noir/dore
    - Industriel : "light grey walls keeping same brightness as input" au lieu de murs ocre sombre
92. HAUTE : Negative prompt SDXL/Flux enrichi et unifie (FLUX_NEGATIVE_PROMPT)
    - 16 termes : distorted perspective, fisheye, extra windows/doors, floating furniture, etc.
93. MOYENNE : API route.ts accepte surfacePrompt + furniturePrompt separement
    - Le client envoie les 2 prompts dans le body de la requete
    - Pour les prompts custom, le meme texte est envoye pour les 2 passes
    - Suppression complete de sanitizeStyleForFurniturePass() (plus necessaire)
94. Apprentissages consolides des agents :
    - Plus un style est visuellement eloigne de l'input, plus le modele regenere au lieu d'editer
    - Solution : limiter la passe 1 a des changements de FINITION, pas de STRUCTURE
    - La passe 2 ne doit contenir QUE du mobilier freestanding, jamais d'elements muraux
    - Les directives de lumiere dans les styles ecrasent systematiquement "preserve lighting"
    - Les dimensions de silhouette mobilier (cm) ameliorent la coherence d'echelle

### Sprint 14 — Distribution spatiale en profondeur (Audit croise Yann Duval + Lucas Moreau)
95. CRITIQUE : Directive de distribution spatiale en profondeur dans route.ts (passe 2)
    - Probleme : le modele concentre tout le mobilier au premier plan, laissant l'arriere de la piece vide
    - Cause : biais de composition photo des modeles IA (sujet = premier plan) + aucune instruction spatiale dans le prompt
    - Particulierement visible sur les grands espaces (lofts, mezzanines, pieces en L, double volume)
    - Solution : ajout directive "Distribute furniture across the FULL DEPTH of the room" dans buildFurnitureResponsesPrompt et buildFurnitureFluxPrompt
    - Formulation conditionnelle : "if the room is deep or has multiple zones" — neutre sur les petites pieces
    - Suggestion de zone secondaire : "reading nook, small desk, console table, side chair" — objets legers qui n'ecrasent pas l'espace
    - Applique dans route.ts (pas dans les stylePrompts) car c'est une contrainte de COMPOSITION, pas de STYLE
96. HAUTE : Ajout distribution LATERALE en plus de la profondeur
    - Probleme : sur les pieces larges (lofts, double volume), la zone face aux baies vitrees restait vide
    - Solution : directive "If the room is also wide, add a lateral anchor (accent chair, floor lamp, side table)"
    - Egalement conditionnel — neutre sur les pieces etroites
97. HAUTE : Renforcement ombres portees sur mobilier en profondeur
    - Probleme : le mobilier en zone secondaire (fond de piece) semblait "flotter" sans ombres
    - Solution : directive explicite "Every piece of furniture — including those in the back — must cast realistic shadows"
98. Apprentissages :
    - Les modeles IA composent comme des photographes : sujet au premier plan, arriere-plan vide
    - Les furniturePrompts decrivent un ENSEMBLE de meubles, pas une SCENOGRAPHIE spatiale
    - La directive spatiale doit etre conditionnelle pour ne pas surcharger les petites pieces
    - "If space allows" / "if the room is deep/wide" = le modele decide intelligemment selon la geometrie
    - Les ombres portees sont moins detaillees sur les objets eloignes — il faut le specifier explicitement

### Sprint 15 — Logging PostgreSQL + images filesystem (audit agents)
99. CRITIQUE : Ajout base de donnees PostgreSQL pour logger toutes les generations
    - Table generation_logs : ip, style_id, surfacePrompt, furniturePrompt, dimensions, modele utilise, duree par passe, succes/erreur
    - Images full-size sauvegardees sur filesystem dans public/logs/ (input, pass1, output)
    - Chemins stockes en DB (input_image_path, pass1_image_path, output_image_path)
    - Fire-and-forget : le log ne ralentit pas la reponse (promise detachee sans await)
    - Auto-creation de la table au premier INSERT (CREATE TABLE IF NOT EXISTS)
100. CRITIQUE : Prompts finaux construits stockes en DB (built_prompt_pass1, built_prompt_pass2)
    - Pas juste le stylePrompt, mais le prompt COMPLET envoye au modele (avec directives profondeur, ombres, etc.)
    - Permet aux agents Yann/Lucas d'auditer le prompt exact en meme temps que le rendu
101. HAUTE : Image intermediaire passe 1 (surfaces) sauvegardee separement
    - Permet de diagnostiquer si un probleme vient de la passe surfaces ou de la passe mobilier
    - Chemin : public/logs/{timestamp}_{styleId}_pass1.jpg
102. HAUTE : Timing par passe (pass1_duration_ms, pass2_duration_ms, duration_ms total)
    - Permet d'identifier quel modele/passe est le goulot d'etranglement
103. HAUTE : Le client envoie styleId dans le body de la requete
    - Permet d'analyser quel style produit les meilleurs/pires resultats
104. Fichiers :
    - lib/db.ts : Pool singleton pg, ensureTable(), logGeneration(), saveImage()
    - app/api/generate/route.ts : import logGeneration, timing, prompts construits, fire-and-forget
    - app/page.tsx : envoi styleId dans le fetch
    - public/logs/ : dossier images (gitignore)
105. Workflow d'audit agents :
    - Query DB pour lister les generations recentes (style, duree, succes)
    - Lire les images full-size via Read tool (public/logs/...)
    - Lire les prompts construits en DB pour auditer prompt + rendu ensemble
    - Yann evalue : fidelite stylistique, composition, echelle, credibilite pro
    - Lucas evalue : preservation geometrie, lumiere, ombres, photorealisme

### Sprint 16 — Audit croise Yann Duval + Lucas Moreau (generation #7 Mediterraneen, note 6.7/10)
106. CRITIQUE : Suppression "update the ceiling light fixture" du builder generique (contradiction avec surfacePrompts)
    - Le builder disait "update" mais 10/12 surfacePrompts disaient "preserve existing" → le modele inventait un luminaire
    - Fix : "For the ceiling light fixture, follow the style description above exactly"
107. CRITIQUE : Ajout directive preservation structurelle dans buildSurfacesResponsesPrompt + Flux
    - "Preserve the ceiling geometry exactly — vaults, beams, ribs, arches, and structural elements must remain visible"
    - "Apply the finish OVER the existing geometry, do not smooth or flatten any structural features"
    - Cause : "smooth white ceiling" effacait les nervures de beton voute (elements porteurs, pas des finitions)
108. CRITIQUE : Fix paradoxe luminosite dans builder
    - Ancien : "preserve exposure exactly" — impossible quand murs blancs remplacent murs bruts (plus de reflexion)
    - Nouveau : "shadow patterns and light gradients must remain in the same positions and relative intensity"
    - Le modele peut augmenter la luminosite ambiante (physiquement correct) mais les ombres restent ancrees
109. CRITIQUE : Sol — materiau CIBLE nomme par style au lieu de "preserving existing floor material"
    - Ancien : "light-toned matte finish on existing floor preserving the material" — contresens sur chantier brut
    - Scandinave/Cosy : light oak wide-plank flooring
    - Contemporain : light grey engineered stone flooring
    - Industriel : smooth grey concrete floor (deja correct)
    - Japandi : light ash wide-plank flooring
    - Art Deco : dark stained herringbone parquet (deja correct)
    - Mid-Century : warm walnut-toned wood plank flooring
    - Boheme : warm honey-toned wood plank flooring
    - Mediterraneen : pale terracotta or warm travertine floor tiles with natural veining
    - Wabi-Sabi : natural stone or aged concrete flooring with subtle worn texture
    - Maximaliste : polished dark wood flooring (deja correct)
110. CRITIQUE : Plafond — "smooth white ceiling" remplace par directive preservant la geometrie
    - Tous les 12 styles : "white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs"
    - Mediterraneen ajoute : "if beams are visible whitewash them"
111. HAUTE : Luminaire specifique par style au lieu de "preserve existing ceiling light"
    - Scandinave : minimal white dome pendant 40cm
    - Contemporain : minimal recessed or flush-mount in brushed chrome
    - Industriel : matte black pendant with metal shade + Edison bulb (deja correct)
    - Japandi : round washi paper pendant (deja correct)
    - Art Deco : brass and frosted glass geometric pendant chandelier (deja correct)
    - Mid-Century : Sputnik-style brass and black multi-arm pendant (deplace du furniturePrompt)
    - Boheme : woven rattan pendant light in natural tone
    - Mediterraneen : wrought iron pendant lantern with aged patina
    - Cosy : warm fabric drum pendant in cream tone
    - Wabi-Sabi : simple ceramic pendant in natural unglazed finish
    - Maximaliste : dramatic sculptural pendant in brass with colored glass (deja correct)
112. MOYENNE : Mid-Century — luminaire Sputnik deplace du furniturePrompt au surfacePrompt
    - Evite le doublon : le luminaire est un element de plafond, pas du mobilier freestanding
113. Apprentissages consolides :
    - Le builder generique ne doit JAMAIS contredire les surfacePrompts individuels
    - "smooth white ceiling" = instruction de LISSAGE, pas de finition — sur voute = destruction geometrie
    - "preserve existing floor material" = contresens sur chantier brut — toujours nommer le materiau cible
    - "preserve existing ceiling light" = ambigu quand pas de luminaire visible — toujours prescrire un luminaire
    - Le paradoxe luminosite (murs blancs = plus clair) est physiquement correct — ancrer les OMBRES, pas l'exposition
114. Page /admin : fix force-dynamic sur /api/logs et /api/logs/image (Next.js cachait les GET en production)

### Sprint 16b — Audit Scandinave #9 et #11 (Yann 7.5-7.9/10, Lucas 7.2-7.5/10)
115. HAUTE : Scandinave surfacePrompt — PH5-style layered pendant (remplace flush-mount anonyme)
    - "matte white tiered pendant light with soft diffused glow 45cm diameter (PH5-style layered shade)"
116. HAUTE : Scandinave surfacePrompt — sol whitewashed ash avec grain visible
    - "wide-plank whitewashed ash flooring with visible natural grain and knots matte finish"
117. HAUTE : Scandinave furniturePrompt — AJ-style floor lamp (remplace arc generique)
    - "slim matte black asymmetric floor lamp with angled cone shade in warm white (AJ-style)"
    - L'arc generique noir revenait dans TOUS les styles — tue la differenciation
118. HAUTE : Scandinave furniturePrompt — fauteuil accent Wegner-style ajoute
    - "light ash lounge chair with woven paper cord seat and curved back (Wegner-style)"
119. HAUTE : Scandinave furniturePrompt — coussins Nordic pattern (remplace lin uni)
    - "woven wool cushions with simple geometric Nordic pattern in muted blue and warm grey"
120. HAUTE : Builder passe 1 — preservation light falloff original
    - "Keep the original light falloff from windows to back wall — do not artificially brighten dark areas"
    - Empeche l'effet "HDR artificiel" qui homogeneise toute la piece
121. HAUTE : Builder passe 2 — ombres conditionnelles au type d'eclairage
    - "Match shadow hardness to the lighting type: soft diffused shadows for overcast, hard-edged for direct sunlight"
    - Conditionnel = neutre, ne casse rien sur les eclairages standards
122. HAUTE : Builder passe 2 — scaling mobilier conditionnel double hauteur
    - "If the ceiling appears very high (>3m) or room is very large, scale up furniture proportionally"
    - Conditionnel = neutre sur les pieces standards
123. MOYENNE : Grain photographique ISO 200 + vignettage naturel dans tous les builders
    - Empeche le rendu "CGI-clean" trop lisse qui trahit l'IA
    - "subtle sensor grain (ISO 200), natural corner vignetting"
124. MOYENNE : Flux negative prompt enrichi : "CGI, plastic, overly clean, flat lighting"
125. Page /admin : mot de passe via ADMIN_PASSWORD env var (API /api/logs reste ouverte pour audits)
126. Apprentissages consolides :
    - Le lampadaire arc noir generique est un "marqueur IA" — chaque style doit avoir son propre luminaire
    - Les pieces iconiques (PH5, AJ, Wegner) ancrent l'identite stylistique instantanement
    - Le grain ISO + vignettage sont les micro-imperfections qui separent "photo" de "CGI"
    - Les directives conditionnelles ("if ceiling > 3m", "if light is diffused") sont NEUTRES sur les cas standards
    - Le pipeline 2 passes est VALIDE : surfaces passe 1 intactes en passe 2, distribution profondeur fonctionne

## Regles de Developpement

- Design minimaliste, pas de surcharge visuelle
- Mobile-first pour les interactions tactiles
- Feedback visuel a chaque action utilisateur
- Auto-scroll guide entre les etapes
- Accessibilite : focus rings, ARIA roles, contraste
- Messages d'erreur actionnables (pas generiques)
- Animations subtiles (cubic-bezier, 700ms max)

## Regles Prompts IA (CRITIQUE)

- **Responses API en priorite** : utiliser `openai.responses.create()` avec le tool `image_generation` + `input_fidelity: "high"` + `size` correspondant au ratio de l'input. Le modele VOIT l'image via la vision et genere une version editee.
- **Flux Depth Pro en fallback** : modele Replicate qui extrait une depth map de l'input. Passer `width` + `height` + `negative_prompt` explicitement.
- **NE PAS utiliser images.edit / SDXL img2img / DALL-E 2** — inadaptes ou deprecated.
- **Pipeline 2 passes avec PROMPTS SEPARES** : le client envoie `surfacePrompt` et `furniturePrompt`. Chaque passe recoit UNIQUEMENT le prompt qui la concerne.
- **Passe 1 = surfaces** : utilise `surfacePrompt` (couleur murs, sol, plafond, luminaire). Piece VIDE. Preserve lumiere, angle, format.
- **Passe 2 = mobilier** : utilise `furniturePrompt` (mobilier freestanding, textiles au sol, plantes, deco). Surfaces LOCKED. Preserve tout.
- **NE JAMAIS melanger surfaces et mobilier** dans le meme prompt — c'est la cause racine des echecs precedents.
- **NE JAMAIS inclure de directives de lumiere** dans les stylePrompts — la lumiere de l'input est sacree.
- **NE JAMAIS mentionner curtains/drapes/windows** dans les stylePrompts — risque d'hallucination.
- **NE PAS utiliser "TRANSFORM"** : utiliser "Edit" (passe 1) ou "Add" (passe 2).
- **Dimensions de mobilier explicites** (230cm wide, 120cm table, 200x300cm rug) pour ancrer l'echelle.
- **Prompt COURT et instructif** : chaque passe ~6-8 phrases max.
- **Distribution en profondeur** : la passe 2 doit distribuer le mobilier sur TOUTE la profondeur de la piece. Si l'espace est grand ou multi-zones, creer un groupe primaire au premier plan ET un groupe secondaire en arriere-plan. Directive conditionnelle ("if space allows") pour ne pas surcharger les petites pieces.
- **surfacePrompt : TOUJOURS nommer le materiau de sol cible** (oak plank, travertine tiles, concrete, etc.) — NE JAMAIS ecrire "preserving existing floor material" car sur chantier brut il n'y a rien a preserver.
- **surfacePrompt : TOUJOURS prescrire un luminaire specifique** par style — NE JAMAIS ecrire "preserve existing ceiling light" car souvent il n'y a pas de luminaire sur chantier brut.
- **surfacePrompt : TOUJOURS preserver la geometrie du plafond** — ecrire "white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs" et JAMAIS "smooth white ceiling" (efface les voutes/poutres).
- **Builder : NE JAMAIS contredire les surfacePrompts** — le builder dit "follow the style description exactly" pour le luminaire, pas "update the fixture".
- **Paradoxe luminosite** : quand les murs passent de brut a blanc, la piece devient physiquement plus claire. Ancrer les OMBRES et GRADIENTS, pas l'exposition globale.
