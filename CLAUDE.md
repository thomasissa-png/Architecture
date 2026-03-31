# Versimo — Memoire Projet

## Contexte Produit

Versimo est un outil de home staging virtuel par IA pour architectes, marchands de biens et particuliers.
L'utilisateur uploade des photos de pieces vides et l'IA genere des visuels meubles dans un style choisi parmi 12 ambiances.

- **Stack** : Next.js 14, React, TypeScript, Tailwind CSS, App Router
- **APIs IA** : OpenAI Responses API gpt-4.1 (principal) + Flux Depth Pro via Replicate (fallback)
- **Design** : Minimaliste, architecture-grade, inspiration Apple/Foster+Partners
- **Langue UI** : Francais
- **Palette** : Background #FAFAF8, Foreground #1C1C1E, Sage #7D9B76
- **Typographie** : Inter (300-800)
- **Deploiement** : Replit — https://versimo.fr/
- **Admin** : https://versimo.fr/admin (visualisation generations + logs DB)
- **API Logs** : https://versimo.fr/api/logs (consultation generations recentes)
- **API Images** : https://versimo.fr/api/logs/image?path=... (images full-size)

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

### Agent Architecte d'Interieur (.claude/agents/interior-architect.md)
- Persona : Yann Duval, 20 ans XP, ex-Jean-Louis Deniot/Studioilse/Yabu Pushelberg
- subagent_type : `interior-architect`
- Grille : 10 criteres (fidelite ×2, credibilite ×2) — audit visuel des generations IA
- Expertise : 12 styles interieurs + prompt engineering IA generative

### Agent Expert IA Image (.claude/agents/ai-image-expert.md)
- Persona : Lucas Moreau, ex-Midjourney/Getty AI Lab/Sotheby's Digital, photographe pro
- subagent_type : `ai-image-expert`
- Grille : 10 criteres (preservation ×2, rendu ×2) — audit technique des generations IA
- Expertise : Prompt engineering multi-modeles, photographie immobiliere, photorealisme IA

### Agent Paysagiste (.claude/agents/paysagiste.md)
- Persona : Camille Verdier, 15 ans XP, ex-Atelier Coloco/Louis Benech, ENSP Versailles
- subagent_type : `paysagiste`
- Grille : 10 criteres outdoor — vegetaux, materiaux, mobilier exterieur, eclairage naturel
- Expertise : 9 styles exterieurs, collaboration avec Lucas Moreau

### Agent Marchand de Biens (.claude/agents/marchand-de-biens.md)
- Persona : Thomas Berger, 35 ans, marchand de biens a Bordeaux, 8-12 ops/an
- subagent_type : `marchand-de-biens`
- Grille : 10 criteres UX marchand — seuil 9.5/10 minimum (preference fondateur)
- Expertise : dossiers PDF, annonces, galerie, partage acquereurs

### Agent Client Mandataire (.claude/agents/client-mandataire.md)
- Persona : Marc Leroy, 38 ans, acheteur immobilier a Bordeaux, 40+ visites
- subagent_type : `client-mandataire`
- Grille : 10 criteres acheteur — 30 secondes pour decider si visite ou fermeture
- Expertise : pages annonce, dossiers PDF, photos HD, liens partageables

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

### Sprint 17 — Audit croise Yann Duval + Lucas Moreau (6 generations, notes 3.3-8.8)
127. CRITIQUE : Pre-processing des prompts custom via GPT-4.1-mini (lib/custom-prompt.ts)
    - Traduction automatique FR→EN avant injection dans le pipeline
    - Split surfacePrompt / furniturePrompt a partir du texte libre utilisateur
    - Enrichissement avec dimensions, materiaux, textures, couleurs specifiques
    - Filtrage elements incompatibles (decoration murale, cuisine equipee, rideaux) avec warnings FR
    - Nouvel endpoint /api/preprocess-prompt (POST)
    - Backward compatible : si pas de cle API, le prompt brut est utilise
    - Cout : ~0.5s + ~$0.001 par appel GPT-4.1-mini
128. CRITIQUE : Fix "pixel-identical" → "visually identical" dans builder passe 2
    - "pixel-identical" rendait le modele ultra-conservateur (ne rien ajouter pour ne pas modifier les pixels)
    - Nouveau : "visually identical — same colors, textures, geometry. Shadows from furniture are expected and natural"
129. CRITIQUE : Fix "light falloff from windows to back wall" → "original light distribution"
    - L'ancien formulait une directive inappropriee pour les pieces sans fenetres (sous-sols, pieces aveugles)
    - Nouveau : neutre, fonctionne pour toutes les conditions d'eclairage
130. HAUTE : Densite conditionnelle dans builder passe 2
    - "Respect furniture density implied by the style. If minimalist, leave large empty floor areas. If room is small, reduce accent pieces."
    - Empeche le cramming sur les petites pieces et respecte les styles minimalistes (Japandi 30%, Wabi-Sabi)
131. HAUTE : Japandi "ordered symmetry" → "balanced asymmetry"
    - La symetrie ordonnee est anti-Japandi (wabi = imperfection) et produit des compositions "catalogue IKEA"
132. HAUTE : Mid-Century lampadaire arc generique → tripod teck 60s-style
    - "walnut and brass tripod floor lamp with natural linen cone shade (60s-style)"
    - L'arc en laiton revenait dans plusieurs styles — tue la differenciation
133. HAUTE : Mid-Century credenza "placed along the back of the room" → "as background anchor"
    - Le modele n'est pas un moteur de layout — "background anchor" guide la composition sans etre directif
134. HAUTE : Cosy — palette enrichie + plante distinctive + lampe precise
    - Ajout "one velvet cushion in warm cognac" (accent chaud dans la palette cream/camel)
    - Pothos → "string of pearls in cream ribbed ceramic hanging planter" (differenciation vs Scandinave)
    - Lampe → "ceramic table lamp with natural linen pleated drum shade on ribbed cream stoneware base"
    - "oversized" → "generously proportioned" (evite disproportion)
135. MOYENNE : FLUX_NEGATIVE_PROMPT enrichi : "color grading, warm color shift, cool color shift"
    - Flux Depth Pro a tendance a appliquer un color grade cinematographique
136. HAUTE : Page /admin refonte affichage images
    - Composant LogImage avec error fallback "Image indisponible"
    - Sizing responsive (max-width 300px, object-fit contain)
    - Click-to-enlarge (ouvre dans nouvel onglet)
    - extractFilename() robuste (gere tous formats de path)
137. Apprentissages consolides :
    - Le mode Custom representait 2/6 generations avec les PIRES notes (3.3 et 3.5) — le pre-processing LLM est obligatoire
    - "pixel-identical" est une promesse impossible — ajouter un canape MODIFIE les pixels du mur (ombre portee)
    - "from windows" dans une directive exclut les pieces sans fenetres — toujours formuler de facon neutre
    - Le lampadaire arc et le pothos sont des "marqueurs IA" generiques — chaque style doit avoir ses propres luminaires et plantes
    - Les directives de placement spatial ("placed along the back") sont fragiles — preferer des termes compositionnels ("background anchor")

### Sprint 17b — Audit production croise (28 generations, #1 a #28)
138. Audit complet des 28 generations de production via API Replit /api/logs
139. Progression des notes par version de builders :
    - Anciens builders (#1-11) : moyenne Lucas 5.8/10
    - Transition (#12-17) : moyenne Lucas 7.3/10
    - Post-Sprint 17 (#18-28) : moyenne Lucas 8.4/10 (+2.6 pts)
140. Meilleures generations : #28 Scandinavian 8.4/10, #18 Art Deco 8.3/10, #22-26 Japandi 7.9/10
141. Pires generations : #13 Custom FR brut 3.3/10, #17 Custom cuisine FR 3.5/10
142. CRITIQUE : Images de production inaccessibles (404) — Replit wipe le filesystem au redeploy
    - Toutes les images dans public/logs/ sont perdues a chaque deploy
    - Action P0 : migrer vers un stockage persistant (Replit Object Storage, S3, ou Cloudflare R2)
143. HAUTE : Pre-processing custom insuffisant pour les built-ins
    - "kitchen island" passe le filtre alors que c'est un meuble encastre
    - Action : renforcer les regles de filtrage dans le system prompt de GPT-4.1-mini
144. MOYENNE : 7/12 styles jamais testes en pipeline 2 passes complet
    - Styles non testes : Contemporain, Boheme, Mediterraneen (2 passes), Cosy (avec corrections Sprint 17), Wabi-Sabi, Maximaliste, Haussmannien
145. Page /admin : prompt d'audit agents ajoute en banner (collapsible + copier)
    - Workflow complet avec methode d'acces via WebFetch sur API production
    - Permet de lancer un audit en une seule commande dans une nouvelle session
146. CRITIQUE : Migration stockage images vers Replit Object Storage (@replit/object-storage)
    - Les images etaient dans public/logs/ (filesystem ephemere, wipe a chaque deploy)
    - Nouveau : lib/db.ts saveImage() → object-storage uploadFromBytes(key, buffer)
    - Nouveau : lib/db.ts getImage(key) → object-storage downloadAsBytes(key)
    - API /api/logs/image lit depuis Object Storage au lieu du filesystem
    - Zero config : le SDK auto-authenticate sur Replit (pas de cle API)
    - Les images persistent desormais a travers les redeploys
    - Les anciens chemins (input_image_path, pass1_image_path, output_image_path) stockent maintenant "logs/xxx.jpg" (cle Object Storage)

### Sprint 18 — Audit croise Japandi #1 (cheminee) + #2 (estrade mur accent) — Yann 7.3, Lucas 7.35
147. CRITIQUE : Preservation equipements fixes muraux dans builders passe 1 + passe 2
    - "Preserve all wall-mounted fixed equipment (radiators, heaters, vents, thermostats, switches)"
    - Passe 2 ajoute : "Do not place furniture in front of radiators"
    - Cause : les 2 generations Japandi supprimaient systematiquement les radiateurs
148. CRITIQUE : Renforcement preservation texture poutres dans builder passe 1
    - Ancien : "must remain visible and unchanged"
    - Nouveau : "must remain visible with their original rough texture, irregular edges, and surface patina intact. Do NOT smooth, flatten, or clean up beams"
    - Cause : Japandi #1 avait les poutres massives lissees (5/10 preservation)
149. HAUTE : Preservation murs accent existants dans builder passe 1
    - "If the input has a colored accent wall, dark wallpaper, or textured feature wall, preserve it as-is — apply the style's wall color only to the plain walls"
    - Directive conditionnelle : neutre si pas de mur accent
    - Cause : Japandi #2 avait le papier peint geometrique noir completement efface
150. HAUTE : Ancrage temperature couleur murs dans builder passe 1
    - "Maintain the exact wall color temperature from the input — do not warm or cool the walls beyond what the style finish requires"
    - Remplace l'ancien "preserve exposure exactly" trop vague
    - Cause : les 2 generations avaient un color shift warm (blanc froid → beige)
151. Builders Flux (passe 1 + 2) alignes avec les memes corrections (condense)
152. Apprentissages consolides :
    - Les equipements muraux (radiateurs, chauffages) sont systematiquement supprimes par le modele — il faut les nommer explicitement
    - Les poutres massives blanchies sont traitees comme du "bruit" a lisser — "visible" ne suffit pas, il faut specifier "rough texture, irregular edges, patina"
    - Les murs accent sont ecrases par "warm white walls" du surfacePrompt — la directive conditionnelle dans le builder est prioritaire
    - Le color shift warm est cause par les surfacePrompts ("warm white", "warm tint") qui ecrasent la temperature d'origine
    - Toutes les corrections sont CONDITIONNELLES — neutres sur les pieces sans ces elements, ne cassent pas les generations existantes

### Sprint 19 — Fix production (3 bugs utilisateur)
153. CRITIQUE : Fix StorageClient resilient dans lib/db.ts
    - Cause racine : le SDK @replit/object-storage communique avec un sidecar local (127.0.0.1:1106). Si le sidecar est indisponible a l'init, le client entre en etat "error" permanent et ne retente jamais.
    - Le singleton storageClient dans db.ts ne se reinitialisait jamais apres un echec.
    - Fix : getStorage() detecte l'etat "error" interne du SDK et reinitialise le client.
    - Fix : withStorageRetry() wraps toutes les operations storage (upload/download) avec 1 retry automatique + reinit client.
    - Toutes les fonctions (saveImage, getImage, savePass1Cache, getPass1Cache, getPass1Meta) migrees vers withStorageRetry.
154. CRITIQUE : Fix iteration "Error during client initialization: fetch failed"
    - Meme cause racine que 153 : getPass1Cache() utilisait getStorage() qui retournait un client en etat erreur permanent.
    - Fix : la meme correction withStorageRetry() resout les 2 problemes (images + iterations).
155. UX : RoomTypePicker deplace AVANT StylePicker en mode interieur (page.tsx)
    - Ancien : type de piece apres style (incoherent avec le mode exterieur qui a le subtype avant le style)
    - Nouveau : type de piece en premier, separe par un border-bottom, puis style
    - Uniformise le flow interieur avec le flow exterieur
156. Apprentissages :
    - Le SDK @replit/object-storage n'a AUCUNE resilience intrinseque : un echec d'init est permanent et silencieux
    - Toujours wrapper les SDKs tiers avec retry + reinit, surtout quand ils dependent d'un service local (sidecar)
    - L'etat interne du SDK est accessible via (client as any).state.status — fragile mais necessaire sans API publique de health check

## Regles de Developpement

- **REGLE CRITIQUE ESLint/Replit** : Apres CHAQUE modification de fichier, verifier que tous les imports sont utilises. Replit echoue le build sur les imports non utilises (`@typescript-eslint/no-unused-vars`). Quand on extrait du code dans un composant partage (ex: Header), TOUJOURS supprimer les imports devenus inutiles dans les fichiers consommateurs. Lancer `npx next lint` avant de committer.
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
- **NE JAMAIS utiliser Flux Depth Pro en passe 2** — il regenere la scene au lieu d'editer, detruisant la geometrie (audit visuel #41/#42, Yann 4.2, Lucas 5.0). Flux autorise en passe 1 uniquement.
- **Iterations : TOUJOURS envoyer l'image OUTPUT (meublee)** comme source, jamais l'image passe 1 (vide). L'iteration doit AJOUTER au resultat existant, pas remplacer.
- **Iterations : autoriser les elements muraux si l'utilisateur le demande** — la contrainte "no wall-mounted" doit etre levee quand le commentaire mentionne explicitement etageres, miroirs, cadres, appliques.
- **Passe 1 : nettoyer les prises electriques** — "Cover all visible electrical outlets, junction boxes, cable exits with the wall finish" (les boitiers ronds noirs restent visibles sinon).
- **Passe 1 : pas de warm color shift** — "Do not add any warm tint or yellow cast" (les murs cool/neutres doivent rester cool/neutres).
- **Passe 2 TOUJOURS lancee** apres passe 1 reussie. Si passe 2 echoue, retry 1 fois puis livrer passe 1 seule avec message.
- **Grain photographique obligatoire** — "Subtle film grain visible at 100% zoom, natural lens vignetting darkening corners 5-10%" (empeche le rendu CGI-clean).

### Sprint 22 — Audit visuel croise Yann Duval + Lucas Moreau (12 generations #31-42)
155. CRITIQUE : Flux Depth Pro desactive en passe 2 — hallucinations fenetre, perte geometrie, changement angle (#41 Yann 4.6, #42 Yann 3.7)
156. CRITIQUE : Iterations destructrices — le mobilier existant disparait (#33 tout le Japandi perdu, #35 surfaces degradees). Fix : image source = output meuble + directives preservation
157. CRITIQUE : Contradiction etageres murales — "Do NOT attach to walls" sabote les demandes utilisateur legitimes (#33). Fix : detection dans pre-processing + flag allowWallMounted
158. HAUTE : Style Cosy trop generique "hotel business" (#37 Yann 6.8, #38 Yann 7.0). Fix : ajout chunky knit throw, pillar candles, layered cushions velvet/linen/boucle, sheepskin
159. HAUTE : Prises electriques non nettoyees en passe 1 (#32, #39, #40). Fix : directive "cover outlets with wall finish"
160. HAUTE : 3/12 generations livrent passe 1 seule = piece vide (#36, #39, #40). Fix : passe 2 forcee avec retry
161. MOYENNE : Warm color shift systematique (murs cool virent beige). Fix : "do not add warm tint or yellow cast"
162. MOYENNE : Rendu CGI-clean sans grain ni vignettage. Fix : renforcement descripteurs photo
163. Meilleure generation : #36 Scandinavian passe 1 (Yann 8.2, Lucas 8.3) — transformation violet→blanc impeccable, convecteur preserve
164. Pipeline 2 passes GPT-4.1 VALIDE : #31 (8.1/8.0), #38 (7.0/7.9) — geometrie preservee sur espaces complexes (verriere double hauteur)
<!-- GRADIENT-AGENTS-START -->
# Gradient Agents — Instructions globales

## Règle absolue — Contexte obligatoire (n°1)

Avant toute action dans ce projet, lire `project-context.md` à la racine.
S'il est absent : s'arrêter, afficher le template et demander à l'utilisateur de le remplir.
Ne jamais commencer un travail sans contexte projet validé.

## Quick Start

1. Remplis `project-context.md` à la racine (copie le template depuis `templates/`)
2. Dis à Claude : `@orchestrator lance mon projet`
3. Réponds aux questions des agents. C'est tout.

Pour une tâche ciblée sur un projet existant, invoque directement l'agent concerné : `@fullstack`, `@seo`, `@qa`, etc.

> **Installation dans un autre projet :** voir `INSTALL.md` pour les instructions complètes (scénario nouveau projet vs projet existant, méthode manuelle, structure résultante).

## Règle absolue — Mindset IA, pas équipe humaine (n°5)

Ce framework est opéré par des agents IA, pas par une équipe humaine. **Tous les agents DOIVENT calibrer leurs recommandations sur la vélocité IA**, pas sur des hypothèses d'équipe humaine. Concrètement :

### Ce qui change avec une équipe 100% IA

| Concept humain | Équivalent IA | Pourquoi |
|---|---|---|
| Sprint 2 semaines | Session de quelques heures | @fullstack code une feature complète en 20-30 min |
| MVP "minimal" — couper des features | V1 complète — tout coder, pas de scope réduit | Le coût marginal d'une feature supplémentaire est quasi nul. La seule raison d'exclure : pas de valeur pour le persona |
| RICE/MoSCoW pour décider quoi faire EN PREMIER | Dépendances strictes uniquement | Si A et B sont indépendants, faire les deux en parallèle |
| Roadmap now/next/later par trimestre | Plan d'exécution par dépendances | La seule contrainte est l'ordre logique, pas le temps |
| Vélocité en story points | Features par heure | Mesurer la capacité réelle, pas une estimation abstraite |
| "Activable en 2 semaines" | "Activable en quelques heures" | Les agents produisent en continu, pas en sprints |
| Séquencement A → B par défaut | Parallélisation par défaut, séquencement seulement si dépendance | L'orchestrateur lance TOUT en parallèle sauf dépendance stricte |

### Règles concrètes pour les agents

1. **Ne jamais produire de sprint-plan ou de vélocité estimée en jours/homme.** Produire un plan d'exécution par dépendances : "X avant Y parce que Y lit le livrable de X". Pas de timeline en semaines.
2. **Ne jamais couper une feature du scope "parce qu'on n'a pas le temps".** La seule raison valide de couper une feature : elle n'apporte pas de valeur au persona, pas "elle prendrait trop longtemps".
3. **Prioriser par valeur, pas par effort.** RICE/ICE restent utiles pour ordonner les features par valeur business — mais la composante "Effort" doit être recalibrée : avec IA, l'effort est quasi identique pour toutes les features.
4. **Paralléliser par défaut.** L'orchestrateur lance tous les agents indépendants en même temps. Le séquencement est l'exception, justifiée par une dépendance de livrable documentée.
5. **Tester tout, pas "les tests critiques uniquement".** @qa produit une couverture complète — le coût de tests supplémentaires est négligeable.

### Exception : contexte hybride

Si `project-context.md` mentionne une équipe humaine (développeurs, designers), les agents DOIVENT adapter leur calibration aux contraintes humaines réelles (sprints, vélocité, priorisation par effort). Cette règle s'applique uniquement quand l'équipe est 100% IA (Gradient Agents + fondateur solo).

### Automatisation par défaut du contenu récurrent

Tout contenu récurrent (articles de blog, posts réseaux sociaux, newsletters, emails de nurturing) DOIT être pensé pour l'automatisation IA dès la conception :
- **@seo / @copywriter** : si un blog est recommandé, produire un pipeline de génération automatisée (templates d'articles, prompts de génération, workflow de publication)
- **@social** : le calendrier éditorial DOIT inclure un workflow d'automatisation (génération des posts par IA, scheduling via API, repurposing automatique d'un format vers un autre)
- **@growth** : chaque canal d'acquisition basé sur le contenu (SEO, social, email) doit documenter comment il s'automatise — un fondateur solo ne peut pas produire manuellement 20 posts/semaine
- **@copywriter** : les séquences email sont automatisées par défaut (triggers, templates, personnalisation IA)
- **@fullstack** : implémenter les endpoints/crons nécessaires à l'automatisation (génération d'articles, publication sociale via API, envoi d'emails programmés)

**Règle** : ne jamais recommander une stratégie de contenu qui suppose une production manuelle régulière sans proposer son automatisation IA. Si un agent recommande "publier 3 articles/semaine", il DOIT aussi documenter comment ces articles sont générés et publiés automatiquement.

## Stratégie de modèles

Les agents utilisent deux modèles selon la complexité de leur tâche :
- **Opus** (`claude-opus-4-6`) : orchestrator, agent-factory, reviewer, elon, fullstack, ia, qa, infrastructure, moi — agents nécessitant un raisonnement complexe, de la coordination multi-étapes, ou de la génération de code
- **Sonnet** (`claude-sonnet-4-6`) : copywriter, creative-strategy, data-analyst, design, geo, growth, legal, product-manager, seo, social, ux — agents de production de contenu, stratégie, ou analyse

Pour réduire les coûts, un projet peut basculer tous les agents sur Sonnet. Pour maximiser la qualité, tout sur Opus. Modifier le champ `model` dans le frontmatter de chaque agent.

## Comment utiliser les agents

Les agents sont dans `.claude/agents/`. Chaque agent est un expert autonome.
Pour toute demande complexe ou multi-domaine : invoquer @orchestrator en premier.
Pour une tâche ciblée : invoquer directement l'agent concerné.

### Règle absolue — Toujours déléguer aux agents spécialisés (n°4)

**Ne JAMAIS produire un livrable à la place d'un agent spécialisé.** Quand une tâche relève du domaine d'un agent (voir tableau ci-dessous), Claude DOIT invoquer cet agent via l'outil Agent (subagent_type), même si :
- L'agent semble "lent" ou que Claude pourrait "aller plus vite" en le faisant lui-même
- La tâche semble "simple" ou "petite" — les agents appliquent leur protocole (calibration, lecture des livrables amont, auto-évaluation, scoring) que Claude principal ne reproduit pas
- Un timeout a coupé l'agent — relancer l'agent, ne pas prendre le relais manuellement

**Pourquoi** : un agent spécialisé lit les livrables amont, applique sa calibration métier, suit son protocole d'escalade, produit un handoff structuré, et vise le score 9/10. Claude principal qui "prend le relais" saute toutes ces étapes et produit un livrable générique sans calibration ni cohérence avec la chaîne.

**Exceptions autorisées** (les seuls cas où Claude peut agir directement) :
- Éditions techniques mineures (renommer une variable, corriger un typo, mettre à jour un nom de branche)
- Réponses à des questions de l'utilisateur (pas de livrable produit)
- Opérations git (commit, push, PR)
- Modifications de `project-context.md` ou `CLAUDE.md` (fichiers transversaux, pas des livrables agents)

## Ordre de priorité des agents par type de demande

| Type de demande | Agent principal | Agents secondaires |
|---|---|---|
| Nouveau projet complet | orchestrator | tous |
| Stratégie / positionnement | creative-strategy | product-manager |
| Code / développement | fullstack | qa, infrastructure, ia |
| Interface visuelle | design | ux |
| Parcours utilisateur | ux | design, copywriter |
| Contenu / texte | copywriter | seo, geo |
| Référencement | seo | geo, copywriter |
| Visibilité IA | geo | seo |
| Performance / déploiement | infrastructure | fullstack |
| Intégration LLM / IA | ia | fullstack, infrastructure |
| Analytics / mesure | data-analyst | product-manager |
| Acquisition / croissance | growth | social, data-analyst |
| Réseaux sociaux | social | copywriter, creative-strategy |
| Tests / qualité / non-régression | qa | fullstack, infrastructure |
| Revue croisée / cohérence | reviewer | orchestrator |
| Juridique / conformité | legal | — |
| Roadmap / backlog | product-manager | creative-strategy |
| Création d'agents spécialisés | agent-factory | ia, orchestrator |
| Audit stratégique / amélioration continue | elon | orchestrator, reviewer |
| Décision projet / arbitrage fondateur | moi | orchestrator |

## Convention d'appel

- `@orchestrator` : planification multi-agents
- `@fullstack` : écriture de code React, Next.js, Expo, API
- `@qa` : tests unitaires, E2E, intégration, pipeline CI/CD, audit qualité
- `@design` : UI, design system, composants visuels
- `@ux` : parcours, wireframes, conversion
- `@copywriter` : textes, landing pages, emails
- `@seo` : référencement technique et éditorial
- `@geo` : optimisation pour les LLM et moteurs génératifs
- `@ia` : intégrations LLM, choix de modèles, pipelines IA
- `@infrastructure` : configuration Replit, performance, CI/CD, monitoring post-launch
- `@creative-strategy` : positionnement, personas, plateforme de marque
- `@product-manager` : specs, roadmap, backlog
- `@data-analyst` : KPIs, tracking, analytics
- `@growth` : acquisition, funnel, PLG
- `@social` : stratégie et contenu réseaux sociaux
- `@reviewer` : revue croisée, cohérence inter-agents, validation finale
- `@legal` : RGPD, CGU, conformité
- `@agent-factory` : création d'agents spécialisés sur mesure pour le projet
- `@elon` : audit stratégique, challenge des décisions, amélioration continue du framework
- `@moi` : proxy décisionnel du fondateur Thomas, review de livrables et arbitrages comme Thomas le ferait

## Convention de chemin des livrables

Tous les livrables des agents sont sauvegardés dans le dossier `docs/` à la racine, organisés par agent. Cette liste montre les livrables principaux — la référence exhaustive est la section "Livrables types" de chaque agent :

```
docs/
├── strategy/          ← @creative-strategy : brand-platform.md, personas.md, creative-brief.md, competitive-benchmark.md
├── product/           ← @product-manager : product-vision.md, roadmap.md, functional-specs.md, backlog.md, execution-plan.md
├── analytics/         ← @data-analyst : kpi-framework.md, tracking-plan.md, dashboard-specs.md
├── ux/                ← @ux : user-flows.md, wireframes.md, ux-audit.md, onboarding-flow.md
├── design/            ← @design : design-system.md, design-tokens.json, component-library.md
├── copy/              ← @copywriter : brand-voice.md, landing-page-copy.md, email-sequences.md, ux-writing-guide.md
├── seo/               ← @seo : seo-strategy.md, keyword-map.md, metadata-templates.md
├── geo/               ← @geo : geo-strategy.md, content-restructuring.md, llm-content-templates.md
├── growth/            ← @growth : growth-strategy.md, acquisition-plan.md, funnel-audit.md
├── social/            ← @social : social-strategy.md, editorial-calendar.md, content-templates.md
├── legal/             ← @legal : legal-audit.md, cgu-draft.md, privacy-policy.md, rgpd-checklist.md
├── infra/             ← @infrastructure : infrastructure.md, performance-audit.md, security-checklist.md
├── ia/                ← @ia : ai-architecture.md, model-selection.md, prompt-library.md
├── qa/                ← @qa : qa-strategy.md, TESTING.md
├── reviews/           ← @reviewer : cross-review-report.md, consistency-audit.md
│                        @elon : elon-audit.md, strategic-review.md
```

Les fichiers de synthèse de l'orchestrateur (`project-synthesis.md`, `orchestration-plan.md`) sont à la racine de `docs/`.
Les fichiers de code (@fullstack, @qa pipelines, @infrastructure configs) vont dans `src/` selon la structure projet standard.

**Exceptions de chemin** : certains agents ne produisent pas dans `docs/` :
- `@agent-factory` → ses livrables sont les fichiers agents eux-mêmes dans `.claude/agents/` (+ modifications de `CLAUDE.md` et `orchestrator.md`)
- `@orchestrator` → `docs/orchestration-plan.md` et `docs/project-synthesis.md` à la racine de `docs/` (pas dans un sous-dossier)
- `@fullstack` → code dans `src/`, mais peut aussi produire `docs/dev-decisions.md` et `docs/api-documentation.md` à la racine de `docs/`

**Règle** : chaque agent DOIT utiliser le chemin correspondant à son dossier. Tout livrable hors de cette arborescence sera rejeté par le @reviewer (sauf les exceptions documentées ci-dessus). Exception : les livrables du @reviewer lui-même sont validés par @orchestrator.

## Règle absolue — Zéro invention de données (n°2)

**Ne JAMAIS inventer, deviner ou fabriquer une donnée manquante.** Si un chiffre, un fait, une métrique, un benchmark, un nom, un prix ou toute autre information factuelle n'est pas disponible (ni dans project-context.md, ni dans les livrables existants, ni trouvable via WebSearch), l'agent DOIT :

1. **Signaler explicitement** la donnée manquante : "Je n'ai pas cette information : [donnée]"
2. **Demander à l'utilisateur** de la fournir avant de continuer
3. **Ne JAMAIS combler le vide** avec une estimation, une moyenne sectorielle inventée, ou un "exemple" présenté comme un fait

### Cas des hypothèses de travail (assumptions)

Dans certains cas, avancer nécessite de poser une hypothèse. C'est acceptable **uniquement si** :
- L'agent **demande l'autorisation explicite** avant de poser l'hypothèse
- L'hypothèse est **clairement marquée** comme telle dans le livrable : `[HYPOTHÈSE : ...]`
- L'agent propose **2-3 options** pour l'hypothèse et demande laquelle retenir
- Le livrable liste toutes les hypothèses en fin de document dans un bloc dédié "Hypothèses à valider"

**Pourquoi cette règle est absolue :** un raisonnement construit sur des données fausses produit des décisions fausses. Mieux vaut un livrable incomplet avec des trous signalés qu'un livrable complet avec des données inventées.

### Exemples concrets

- **INTERDIT** : "Le taux de conversion moyen dans ce secteur est de 3.2%" (sans source)
- **OBLIGATOIRE** : "Je n'ai pas le taux de conversion de référence pour ce secteur. Peux-tu me le fournir, ou veux-tu que je recherche un benchmark via WebSearch ?"
- **ACCEPTABLE** (avec autorisation) : "[HYPOTHÈSE : taux de conversion estimé à 2-4% — à valider avec données réelles]"

## Règle absolue — Anti-timeout (n°3)

Claude Code a une limite de temps par réponse ET une fenêtre de contexte qui se dégrade sur les sessions longues. Un agent qui essaie de tout produire en une seule passe **sera coupé en plein travail** et le livrable sera perdu. Cette règle s'applique à TOUS les agents.

**Limite de session** : l'orchestrateur maintient un compteur de phases et de Task **producteurs** (ceux qui déclenchent un Write/Edit dans `docs/` ou `src/`) et alerte l'utilisateur quand la session risque de dégénérer (voir orchestrator.md — Compteur de session obligatoire). Seuil : ALERTE ROUGE après 6 phases / 18 Task producteurs (seule alerte, pas de JAUNE). Les Task de consultation (review verbale, avis sans fichier) ne comptent pas. Un projet complet doit être découpé en plusieurs sessions.

### Principes anti-timeout

1. **Un fichier = un appel Write/Edit.** Ne jamais essayer d'écrire plusieurs fichiers dans le même bloc de texte. Écrire le fichier 1, puis le fichier 2, puis le fichier 3.
2. **Découper les gros livrables.** Si un fichier dépasse ~150 lignes, l'écrire en plusieurs Edit successifs (section par section) plutôt qu'un seul Write monolithique.
3. **Prioriser le contenu critique.** Toujours écrire d'abord les sections essentielles du livrable. Si un timeout survient, l'essentiel est sauvegardé.
4. **Sauvegarder au fur et à mesure.** Utiliser Write pour créer le fichier avec la structure + les premières sections, puis Edit pour ajouter les sections suivantes. Ne jamais accumuler du contenu en mémoire sans l'écrire.
5. **Signaler les livrables multi-fichiers.** Si la mission demande plus de 3 fichiers, annoncer l'ordre de production et produire un fichier à la fois.

### Pour l'orchestrateur spécifiquement

- **Ne JAMAIS lancer plus de 3 sous-agents (Task) dans un même message.** Lancer 2-3 Task, attendre leurs résultats, puis lancer les suivants.
- **Découper l'exécution par phase.** Terminer une phase complète (Task + vérification + enrichissement project-context) avant de passer à la suivante.
- **Préférer 3 messages courts à 1 message géant.** Chaque message devrait : lancer les Task → lire les résultats → décider de la suite.

### Pour les agents producteurs de contenu (copywriter, creative-strategy, seo, geo, legal)

- Écrire d'abord la structure/le plan du fichier (titres + résumés), puis remplir section par section via Edit.
- Ne jamais rédiger un document complet de >100 lignes en un seul Write.

### Pour les agents code (fullstack, qa, infrastructure)

- Un composant/fichier par appel Write. Ne jamais écrire 5 fichiers d'un coup.
- Commencer par les fichiers fondation (types, config, utils) avant les fichiers dépendants (composants, pages).

### En cas de timeout détecté

Si un agent a été interrompu par un timeout :
1. Vérifier ce qui a été sauvegardé (Glob + Read sur les fichiers du dossier de l'agent)
2. Reprendre là où le travail s'est arrêté — ne PAS repartir de zéro
3. Terminer les sections manquantes via Edit sur les fichiers existants

## Règles communes à tous les agents

1. Travailler exclusivement en français (sauf code et noms techniques)
2. Lire `project-context.md` avant toute production
3. **Lire le tableau "Historique des interventions agents"** dans `project-context.md` — comprendre qui est intervenu avant, quelles décisions ont été prises, et surtout POURQUOI (colonne "Pourquoi / Alternatives écartées"). Ne jamais produire un livrable qui contredit une décision passée sans le signaler explicitement.
4. Zéro output générique — chaque livrable est taillé pour ce projet précis
5. Objectif constant : faire de ce projet le numéro 1 de son secteur
6. Bloquer et signaler si le contexte est insuffisant
7. Terminer chaque livrable par un bloc Handoff standardisé
8. En mode révision : justifier chaque changement, ne pas tout réécrire
9. **Après chaque livrable** : mettre à jour le tableau "Historique des interventions agents" dans `project-context.md` avec : agent, date, fichiers produits, décisions clés, **et justification des choix (pourquoi cette décision, quelles alternatives écartées)**
10. **Respecter les règles anti-timeout** (voir Règle absolue numéro 3) — découper les livrables, sauvegarder au fur et à mesure, ne jamais accumuler sans écrire
11. **Objectif qualité : 100% gates PASS.** Chaque livrable sera évalué par @reviewer via 32 gates binaires G1-G32 (PASS/FAIL) réparties en BLOQUANT et REQUIS. Le seuil de validation est : 100% gates BLOQUANT PASS + 100% gates REQUIS PASS. Viser l'excellence dès la première passe pour éviter les itérations correctives
12. **Mise à jour du nom de branche obligatoire.** À chaque changement de branche de développement, l'ancienne référence de branche DOIT être remplacée par la nouvelle dans TOUS les fichiers qui la mentionnent : `index.html` (prompts d'installation frontend), `INSTALL.md`, `install.sh`, `update.sh`, et `project-context.md` (mémo de reprise). Utiliser `Grep` sur l'ancien nom de branche pour s'assurer qu'aucune référence n'a été oubliée. Cette mise à jour est la responsabilité de l'agent qui effectue le changement de branche (typiquement @orchestrator ou l'agent principal de la session)
13. **Caractères UTF-8 obligatoires dans le code.** Dans les fichiers TSX/JSX/JS, utiliser les vrais caractères UTF-8 (é, è, à, ç, ê, î, ô, û, ë, ï, ù) dans les constantes et strings. Ne JAMAIS utiliser `\u00E9` ni `&eacute;` dans les strings JavaScript. Les entités HTML sont acceptables uniquement dans le JSX rendu directement. Signalé comme P0 sur 2 projets distincts.
14. **Zéro mention de concurrent par nom dans les livrables client-facing.** Ne JAMAIS mentionner de concurrent par nom dans le code frontend, le copy, le contenu marketing, le SEO ou tout contenu visible par l'utilisateur final. Utiliser des catégories génériques ("freelance marketing", "outil avec templates", "plateforme SaaS"). Exception : les livrables internes (benchmarks concurrentiels, audits stratégiques, analyses de marché) DOIVENT nommer les concurrents pour être actionnables.

## Protocole de test du framework

Pour valider que les agents fonctionnent correctement ensemble, utiliser ce protocole sur un projet fictif ou réel :

### Test unitaire (1 agent)
1. Remplir `project-context.md` avec un cas concret
2. Invoquer un agent isolé (ex : `@creative-strategy`)
3. Vérifier : lit-il bien project-context.md ? Refuse-t-il si champs manquants ? Le livrable est-il spécifique au projet ?

### Test d'intégration (2-3 agents en chaîne)
1. Lancer `@creative-strategy` → vérifier le handoff
2. Lancer `@copywriter` → vérifie-t-il le brand-platform de creative-strategy ?
3. Lancer `@design` → vérifie-t-il les wireframes UX ET le brand-platform ?
4. Vérifier : les livrables sont-ils cohérents entre eux ? Pas de contradictions ?

### Test E2E (orchestration complète)
1. Invoquer `@orchestrator` sur un projet complet
2. Vérifier : les phases s'exécutent-elles dans le bon ordre ? Les agents parallélisables sont-ils lancés ensemble ?
3. Invoquer `@reviewer` en fin de chaîne → le rapport détecte-t-il des incohérences ?

### Checklist de validation post-test
- [ ] Chaque agent a lu project-context.md avant de produire
- [ ] Aucun agent n'a inventé de données (vérifier les chiffres, benchmarks, tarifs)
- [ ] Les hypothèses sont marquées `[HYPOTHÈSE : ...]`
- [ ] Le tableau "Historique des interventions agents" est mis à jour par chaque agent
- [ ] Le tableau "Performance des agents" est rempli
- [ ] Tous les livrables sont dans le bon dossier `docs/[agent]/`
- [ ] Le handoff de chaque agent pointe vers le bon destinataire

### Projet test pré-configuré

Un `project-context.md` fictif mais réaliste est disponible dans `tests/project-context-test.md` (projet PulseBoard — analytics marketing pour PME). Copier ce fichier à la racine pour tester sans avoir à remplir un contexte de zéro.

### Contrôle qualité post-livrable — Système de gates binaires

Le contrôle qualité s'effectue en **deux temps** avec des responsabilités distinctes :

1. **Vérification rapide par l'orchestrateur** (après chaque phase) : exécuter les gates BLOQUANT sur chaque livrable. Si 1+ gate BLOQUANT = FAIL → relance corrective immédiate de l'agent avant de passer à la phase suivante. Objectif : éliminer les livrables insuffisants au fil de l'eau.
2. **Audit complet par @reviewer** (en fin de run, Étape 7) : exécuter les 32 gates (BLOQUANT + REQUIS + CONDITIONNEL) via Grep/Read/comparaison — pas de jugement subjectif. Boucle d'itération si besoin (max 3 passes). Les verdicts sont inscrits dans le tableau "Performance des agents".

### Les 32 gates binaires (PASS/FAIL)

Chaque livrable dans `docs/` est évalué par ces gates. Classification :
- **BLOQUANT** : 1 FAIL = NO-GO immédiat, relance obligatoire
- **REQUIS** : 1 FAIL = GO conditionnel (corriger dans la session)
- **CONDITIONNEL** : s'applique uniquement si la feature/le livrable amont existe

**COMPLÉTUDE**

| # | Gate | Classe | Vérification |
|---|---|---|---|
| G1 | Toutes les sections du template agent présentes (0 section vide/TODO) | BLOQUANT | Grep `[TODO]`, `[À REMPLIR]`, sections < 2 lignes |
| G2 | Les livrables amont référencés existent | REQUIS | Glob les chemins cités dans le livrable |
| G3 | Bloc Handoff structuré présent | BLOQUANT | Grep `Handoff` |
| G4 | Chaque donnée chiffrée a une source explicite (URL, livrable, ou marqueur `[HYPOTHÈSE]`) | REQUIS | Grep nombres, vérifier que chaque chiffre cite sa source |

**COHÉRENCE**

| # | Gate | Classe | Vérification |
|---|---|---|---|
| G5 | Persona identique à project-context.md | BLOQUANT | Grep nom persona dans le livrable. Le persona doit être cité par nom ET le livrable doit adresser ses frustrations/objections (pas juste mentionner le nom) |
| G6 | KPI North Star identique | BLOQUANT | Grep KPI dans le livrable |
| G7 | 0 contradiction avec livrables amont | BLOQUANT | Read les 2-3 livrables amont référencés, extraire les décisions clés (positionnement, persona, KPI, choix techniques), comparer avec le livrable évalué. Si une décision diverge → FAIL |
| G8 | Ton cohérent avec brand-voice.md (si existe) | CONDITIONNEL | Grep registre (tu/vous), vocabulaire |

**ACTIONNABILITÉ**

| # | Gate | Classe | Vérification |
|---|---|---|---|
| G9 | Chaque recommandation a un owner + action + cible | REQUIS | Grep `→ @` ou équivalent actionnable |
| G10 | 0 langage vague sans action ("envisager", "pourrait", "éventuellement") | REQUIS | Grep mots vagues |
| G11 | Critères de validation binaires (vérifiables oui/non) | REQUIS | Read section validation |
| G12 | Un agent pourrait implémenter sans poser de question | BLOQUANT | Pour chaque action/recommandation : a-t-elle (a) un verbe d'action, (b) un objet clair, (c) des inputs/outputs explicites, (d) un critère de done vérifiable ? Si une action dit "améliorer le SEO" sans préciser quoi/comment/critère → FAIL |

**MESSAGES**

| # | Gate | Classe | Vérification |
|---|---|---|---|
| G13 | 0 donnée inventée (aucun chiffre, benchmark ou métrique sans fondement factuel) | BLOQUANT | Grep chiffres sans source — vérifier crédibilité, pas juste présence de source |
| G14 | Livrables absents signalés | REQUIS | Grep tous les chemins docs/ mentionnés dans le livrable → Glob pour vérifier existence. Si un chemin référencé n'existe pas ET n'est pas documenté comme absent → FAIL |
| G15 | 0 placeholder résiduel | BLOQUANT | Grep `[À REMPLIR`, `[PLACEHOLDER`, `[TODO`, `[NOM`, `[EXEMPLE`, `[XX`, `[VOTRE`, `[INSÉRER`, `[REMPLACER` |

**SPÉCIFICITÉ**

| # | Gate | Classe | Vérification |
|---|---|---|---|
| G16 | Nom du projet cité >= 3 fois | REQUIS | Grep count |
| G17 | Persona cité par nom >= 2 fois | REQUIS | Grep count |
| G18 | >= 2 livrables amont référencés par chemin | REQUIS | Grep `docs/` |
| G19 | Pas copiable tel quel pour un projet concurrent | BLOQUANT | Test d'inversion : remplacer le nom du projet par un concurrent dans un autre secteur. Si > 50% du contenu reste applicable sans modification → FAIL. Indicateurs : le livrable mentionne-t-il le secteur spécifique, les contraintes du persona, les choix techniques du projet ? |
| G20 | >= 1 exemple concret spécifique au projet | REQUIS | Vérification sectorielle |

**QUALITÉ MÉTIER** (gates spécifiques par type de livrable — s'appliquent conditionnellement selon le type)

| # | Gate | Classe | Vérification |
|---|---|---|---|
| G21 | Les 5 états UI documentés par écran interactif (défaut, loading, vide, erreur, succès) | BLOQUANT | Pour specs/wireframes : Grep `loading\|erreur\|vide\|empty\|error\|succes` par écran. Chaque écran avec données dynamiques DOIT avoir les 5 états |
| G22 | Contrastes WCAG 2.2 AA respectés (>= 4.5:1 texte, >= 3:1 interactifs) + focus-visible sur tous les interactifs + touch targets >= 44x44px mobile + prefers-reduced-motion supporté | BLOQUANT | Pour design-system/tokens : vérifier chaque combinaison couleur texte/fond. Focus-visible : Grep `outline: none` sans alternative. Touch targets : vérifier taille minimum. Reduced-motion : Grep `prefers-reduced-motion`. Clair ET dark mode si applicable |
| G23 | 0 valeur hardcodée — toute couleur, spacing, typo référence un token nommé | REQUIS | Pour design/specs/code : Grep couleurs hex en dur hors fichiers de tokens, valeurs px hors scale |
| G24 | Registre tu/vous uniforme dans le livrable (0 alternance non justifiée) | REQUIS | Pour copy/contenu : Grep `tu \|ton \|votre \|vous ` — vérifier cohérence |
| G25 | Chaque KPI/métrique a une formule de calcul explicite ET un seuil d'alerte défini | REQUIS | Pour analytics/KPI : chaque KPI a (formule ou trigger) + seuil. Grep `formule\|calcul\|seuil\|alerte` |

**PIPELINE & CONFORMITÉ** (gates spécifiques au code déployé — s'appliquent si src/ existe)

| # | Gate | Classe | Vérification |
|---|---|---|---|
| G26 | Conformité visuelle : screenshots CI vs baselines approuvées (< 0.5% diff) sur 3 devices | BLOQUANT | Pour code déployé : Playwright screenshots sur iPhone 13 (375px), iPad (768px), Desktop Chrome (1280px). Comparaison pixel-diff avec baselines approuvées dans `tests/screenshots/` (produites par @fullstack via sa boucle visuelle — screenshot page par page, comparaison avec `docs/design/page-compositions.md`, correction avant page suivante). Seuil < 0.5% de pixels différents par screenshot. Si `tests/screenshots/` vide → FAIL (boucle visuelle non exécutée). Si aucune baseline → première exécution crée les baselines, review humain obligatoire |
| G27 | Matrice de traçabilité : 100% des user stories ont un test correspondant | REQUIS | Pour code + specs : tableau `US-XX → fichier-test:ligne` dans TESTING.md ou qa-strategy.md. Chaque user story de functional-specs.md DOIT avoir au moins 1 test E2E ou intégration. Si une story n'a pas de test → FAIL |
| G28 | Pipeline pre-deploy PASS : tsc --noEmit + lint + tests | REQUIS | Pour code déployé : `tsc --noEmit` avec 0 erreur TypeScript, ESLint avec 0 erreur (warnings tolérés), tests unitaires PASS. Si un des 3 échoue → FAIL |

**DESIGN & COMPOSITION** (gates spécifiques au design — s'appliquent si le projet a un frontend)

| # | Gate | Classe | Vérification |
|---|---|---|---|
| G29 | Chaque section de chaque page a un pattern de layout explicite (pas juste "section X") | REQUIS | Pour design/wireframes : vérifier que `docs/design/page-compositions.md` ou `docs/ux/wireframes.md` spécifie le layout par section (grille, colonnes, responsive). Si les deux existent, `page-compositions.md` est la source de vérité pour le layout visuel. Si une section n'a que son nom sans layout → FAIL |
| G30 | Chaque page client-facing a au moins 1 image spécifiée (type, sujet, source) | REQUIS | Pour design : vérifier que les compositions de page incluent des specs d'images. Pages client-facing = pages accessibles sans authentification + pages principales post-auth (dashboard, onboarding). Exclues : pages admin, settings, pages techniques. Un site sans images spécifiées = 6/10 max → FAIL |

| G31 | Architecture tokens 3 tiers respectée (primitive → semantic → component) | REQUIS | Pour design-system/code : les composants ne référencent JAMAIS les tokens primitifs directement. Grep dans le code pour des références directes à des tokens primitifs (blue-500, gray-100) au lieu de tokens sémantiques (color-background-primary). Si référence directe → FAIL |
| G32 | Chaque composant interactif a ses 6 états documentés (default, hover, active, focus-visible, disabled, loading) | REQUIS | Pour component-library.md : Grep les 6 états par composant interactif. Si un composant n'a pas ses 6 états → FAIL. Complémentaire à G21 qui vérifie les états de données par écran |

**GATES TESTEUR-PERSONA (s'appliquent si agents testeurs créés — voir orchestrator.md Phases 1b, 2c, 2d, 5b)**

| # | Gate | Classe | Vérification |
|---|---|---|---|
| GP1 | Compréhension immédiate | BLOQUANT | "En 5 secondes, je comprends ce que ce site fait pour moi" |
| GP2 | Valeur perçue | BLOQUANT | "La valeur promise justifie le prix affiché — j'en ai pour mon argent" |
| GP3 | Crédibilité | BLOQUANT | "Ce site me donne confiance (design pro, preuves sociales, pas de bullshit)" |
| GP4 | Parcours fluide | BLOQUANT | "Je sais où cliquer à chaque étape, je ne suis jamais perdu" |
| GP5 | Pricing acceptable | REQUIS | "Le prix ne me fait pas fuir — le ROI est évident" |
| GP6 | Recommandation | REQUIS | "Je recommanderais ce service à un collègue de mon métier" |
| GP7 | Conviction | BLOQUANT | "Après avoir vu la landing + un essai, je suis convaincu de m'inscrire" |
| GP8 | Look & feel | REQUIS | "Le design correspond à mon secteur — ni trop cheap ni trop corporate" |
| GP9 | Outputs utiles | BLOQUANT | "Les documents/livrables que la plateforme génère me sont vraiment utiles" |
| GP10 | Fidélisation | REQUIS | "Je vois pourquoi je resterais abonné mois après mois" |

| # | Gate | Classe | Vérification |
|---|---|---|---|
| GC1 | Professionnalisme | BLOQUANT | "Ce document fait professionnel — pas généré par IA" |
| GC2 | Pertinence | BLOQUANT | "Le contenu répond précisément à mes attentes/critères" |
| GC3 | Confiance | BLOQUANT | "Ce document me donne confiance dans le prestataire" |
| GC4 | Action | BLOQUANT | "Après lecture, je suis enclin à contacter/signer/retenir ce prestataire" |
| GC5 | Complétude | REQUIS | "Il ne manque aucune information critique" |
| GC6 | Différenciation | REQUIS | "Ce livrable se distingue positivement de ce que je reçois habituellement" |
| GC7 | Ton et registre | REQUIS | "Le ton est adapté à mon contexte" |
| GC8 | Zéro erreur factuelle | BLOQUANT | "Aucune information fausse, incohérente ou inventée" |
| GC9 | Copy convaincant | REQUIS | "Les arguments sont pertinents et hiérarchisés" |
| GC10 | Design/mise en page | REQUIS | "La présentation est soignée, structurée, facile à lire" |

**Conditions d'application** : les gates GP/GC s'appliquent uniquement si les agents testeur-persona et testeur-client-du-persona ont été créés (Phase 0b). Si non créés → N/A. **Marketplace** : si double persona (vendeur + acheteur), créer un testeur par persona — les gates s'exécutent une fois par testeur, toutes doivent passer. **B2C direct** : gates GC = N/A si le persona n'a pas de client professionnel.

### Verdict

- **GO** : 100% gates BLOQUANT PASS + 100% gates REQUIS PASS
- **GO CONDITIONNEL** : 100% gates BLOQUANT PASS + >= 1 gate REQUIS FAIL (corriger dans la session)
- **NO-GO** : >= 1 gate BLOQUANT FAIL → relance immédiate
- **Gates CONDITIONNEL** : s'appliquent uniquement si le livrable amont existe (ex: G8 s'applique si brand-voice.md existe). Si applicable et FAIL → traité comme REQUIS FAIL. Si non applicable → ignoré (N/A), ne compte pas dans le score dérivé.

### Score numérique dérivé (pour tracking)

Pour le tableau "Performance des agents" : `(gates PASS / gates applicables) × 10`. Ce score est un indicateur de suivi, pas un critère de décision — seuls les verdicts PASS/FAIL des gates comptent.

### Scoring persona et B2B (conservés)

Les grilles persona (/10, 9 dimensions, seuil 9/10) et B2B (/10, 7 dimensions, seuil 9/10 si applicable) sont conservées. Elles sont encadrées par des gates pré-requis : G5 (persona identique) et G6 (KPI identique) doivent être PASS avant d'évaluer ces grilles.

**Pré-requis binaires persona** (doivent être PASS pour que le score persona soit valide) :
- Le persona est nommé dans le livrable (pas "l'utilisateur" mais le nom défini dans project-context.md)
- Le vocabulaire du secteur est utilisé (termes métier, pas du langage générique)
- Les objections documentées dans personas.md (si existe) sont adressées dans le livrable

**Condition GO finale** : 100% gates BLOQUANT PASS + 100% gates REQUIS PASS + gates persona PASS (>= 9/10) + gates B2B PASS (>= 9/10, si applicable).

**Règle (orchestrateur)** : si 1+ gate BLOQUANT FAIL → relancer immédiatement l'agent avec le détail des gates échouées. Ne pas attendre la fin du run.
**Règle (reviewer)** : en fin de run, exécuter les 32 gates sur chaque livrable. Tout livrable avec 1+ gate BLOQUANT ou REQUIS FAIL déclenche une boucle d'itération (max 3 passes). Voir `orchestrator.md` Étape 7.

## Mémoire organisationnelle — Apprentissage inter-projets

Après chaque session (pas seulement chaque projet), l'orchestrateur DOIT mettre à jour `docs/lessons-learned.md` avec le format tableau v2 (11 colonnes) :

```markdown
## Session [date] — [Nom du projet]

| Session | Date | Catégorie | Sévérité | Description | Correction appliquée | Recommandation framework | Cible propagation | Fichiers impactés | Statut correction | Statut propagation |
|---|---|---|---|---|---|---|---|---|---|---|
| [nom] | [date] | problème/insistance/requête/biais/pattern/recommandation/performance-ia/préférence fondateur | P0/P1/P2 | [description] | [ce qui a été fait] | [recommandation] | règle-globale/agent-spécifique/prompts/documentation/founder-prefs/aucune | [liste EXACTE des fichiers] | fait/en-cours/à-faire | propagé/non-propagé/n/a |
```

**Catégories** : problème (bug/incohérence corrigé), insistance (utilisateur a demandé 2+ fois), requête (demande non couverte), biais (mindset humain détecté), pattern (ce qui a bien marché), recommandation (amélioration framework), performance-ia (coûts/latence/hallucinations), préférence fondateur (calibration @moi).

**Colonnes de propagation (v2)** :
- **Cible propagation** : où le learning doit être propagé (CLAUDE.md, agents, prompts, docs, founder-preferences, ou aucune)
- **Fichiers impactés** : liste EXACTE des fichiers à modifier — jamais de vague "les agents concernés"
- **Statut correction** : le fix source est-il fait ? (fait / en-cours / à-faire)
- **Statut propagation** : le fix est-il propagé dans TOUS les fichiers listés ? (propagé / non-propagé / n/a)

**Règle** : un learning est "terminé" UNIQUEMENT quand correction = `fait` ET propagation = `propagé` (ou `n/a`).

**Gate bloquante (reprise de session)** : l'orchestrateur DOIT propager les learnings P0/P1 avec statut propagation = `non-propagé` AVANT tout nouveau travail. C'est une gate au même titre que G7.

**Propagation check (clôture de session)** : avant de clôturer, l'orchestrateur DOIT vérifier que tous les learnings P0/P1 de la session ont statut propagation = `propagé`. Si timeout imminent → documenter dans le mémo de reprise "PROPAGATION P0 EN ATTENTE" avec les fichiers restants.

**Gestion du volume** : si le fichier contient plus de 30 learnings non-terminés, synthétiser les récurrents en règles permanentes (dans CLAUDE.md ou les agents) et archiver les terminés dans une section "## Archive" en bas du fichier.

**Boucle fermée** : la propagation se fait EN CLÔTURE (pas en reprise). La reprise ne fait que vérifier et rattraper les oublis. L'objectif : zéro learning P0/P1 non-propagé entre deux sessions.

**Préférences fondateur** : les learnings de catégorie "préférence fondateur" sont également copiés dans `docs/founder-preferences.md`, source de vérité pour l'agent @moi. Ce fichier est accessible cross-projets via l'URL GitHub raw du repo Agent-Team (branche main). Voir la section "Sources de calibration" de `moi.md` pour le mécanisme complet.

**Promotion des gates ad-hoc** : quand une gate ad-hoc (définie lors d'un audit PVU — voir _base-agent-protocol.md) revient en FAIL sur 3+ audits différents, l'orchestrateur DOIT la proposer pour promotion en gate permanente (G29+). Le processus : (1) documenter la gate récurrente dans lessons-learned.md avec catégorie `recommandation` et cible propagation `règle-globale`, (2) ajouter la gate au tableau des gates de cette section lors de la clôture de session, (3) mettre à jour le compteur de gates (G1-GXX) dans tous les fichiers qui le référencent.

**Pourquoi** : sans cette mémoire, chaque session repart de zéro. Les patterns qui marchent ne sont pas capitalisés. Les erreurs sont répétées. Cette section transforme le framework d'un outil statique en un système qui apprend.

## Journal de setup

L'historique complet des sessions de setup est dans `CHANGELOG.md` à la racine. Consulter ce fichier pour les décisions de conception passées et les modifications apportées au framework.
<!-- GRADIENT-AGENTS-END -->

