# Strategie QA -- VisiRenov

## Audit des criteres d'acceptation

### F1 -- Iteration commentaire

| # | Critere (resume) | Testable ? | Probleme | Reformulation |
|---|---|---|---|---|
| US-F1-01 | Clic "Affiner" declenche re-passe 2 uniquement sur passe 1 existante. Compteur decremente. Resultat remplace dans comparateur. | Oui (E2E + integration) | -- | -- |
| US-F1-01 AC | La passe 1 n'est JAMAIS relancee | Oui (integration) | Verifiable en mockant /api/generate et en assertant que pass1_key est envoye (pas de nouvelle passe 1) | -- |
| US-F1-02 | Badge "X iteration(s) restante(s)" visible sous bouton Affiner | Oui (E2E) | -- | -- |
| US-F1-02 AC | Badge mis a jour en temps reel. Quand 0, bouton grise + tooltip "Iterations epuisees" | Oui (E2E) | -- | -- |
| US-F1-03 | Selecteur versions v1/v2/v3. Clic charge le resultat correspondant. | Oui (E2E) | -- | -- |
| US-F1-03 AC | Chaque version conserve son commentaire en legende. Telechargement HD fonctionne sur chaque version. | Oui (E2E) | -- | -- |
| US-F1-04 | Commentaire FR pre-traite par GPT-4.1-mini (traduction EN + enrichissement) | Oui (integration) | La qualite de l'enrichissement n'est pas verifiable de facon deterministe | Given commentaire "plus de plantes", When requete envoyee, Then le payload envoye a /api/generate contient un furniturePrompt en anglais contenant "plant" |
| US-F1-04 AC | Pre-processing < 1,5s. Echec GPT-4.1-mini = commentaire brut utilise sans blocage | Partiellement | Le seuil 1,5s est testable en integration avec timer. Le fallback est testable en mockant un echec GPT-4.1-mini. | -- |
| Edge 1 | Commentaire vide = bouton desactive | Oui (unitaire) | -- | -- |
| Edge 2 | Commentaire structurel ("ajoute fenetre") = warning GPT-4.1-mini | Oui (integration) | Non deterministe : depend du LLM | Given commentaire "ajoute une fenetre", When pre-processing termine, Then un warning contenant "modifications structurelles" est affiche ET la generation n'est PAS lancee |
| Edge 3 | Commentaire langue etrangere = traduit en EN | Oui (integration) | Non deterministe | Given commentaire en arabe, When pre-processing, Then furniturePrompt contient des mots anglais |
| Edge 4 | Passe 1 expiree (>24h) = bouton Affiner desactive + message | Oui (E2E) | Necessite de simuler un TTL expire | Given une generation dont la passe 1 date de >24h (mock), When affichage comparateur, Then bouton Affiner desactive avec message "surfaces expirees" |
| Edge 5 | Timeout passe 2 >90s = iteration NON consommee, rollback compteur | Oui (integration) | Necessite un mock timeout | Given timeout simule sur /api/generate, When timeout atteint, Then compteur iterations inchange ET message "iteration conservee" |
| Edge 6 | Fallback Flux sur iteration = meme logique avec passe 1 comme input | Oui (integration) | -- | -- |
| Edge 7 | Commentaire "piece vide" = GPT-4.1-mini detecte et bloque | Oui (integration) | Non deterministe | Given commentaire "piece vide", When pre-processing, Then warning "action non possible en mode affinage" |

### F2 -- Type de piece

| # | Critere (resume) | Testable ? | Probleme | Reformulation |
|---|---|---|---|---|
| US-F2-01 | Selection "Salle de bain" injecte roomFurnitureOverride (vasque, miroir) et roomSurfaceOverride (carrelage) | Oui (integration) | -- | -- |
| US-F2-01 AC | Pour chaque type, des blocs override sont definis. Le resultat ne contient jamais de canape dans une salle de bain. | Partiellement | "Le resultat ne contient jamais de canape" = verification visuelle, non testable automatiquement | Given type "Salle de bain", When prompt construit, Then furniturePrompt contient "vanity/mirror/towel" ET negative prompt contient "sofa, coffee table" |
| US-F2-02 | Selection "Cuisine" injecte plan de travail, credence, appareils. Passe 1 cible carrelage/parquet resistant. | Oui (integration) | -- | -- |
| US-F2-02 AC | Resultat notablement different d'un salon pour la meme image | Non | "Notablement different" est subjectif -- non testable automatiquement | Given meme image, When generation avec type "Cuisine" vs type "Salon", Then les furniturePrompt envoyes a l'API sont differents (assertion sur le contenu du prompt, pas sur l'image) |
| US-F2-03 | Auto-detection GPT-4.1-mini propose un type. Utilisateur confirme ou ignore. | Oui (E2E + integration) | -- | -- |
| US-F2-03 AC | Detection proposee en option, jamais imposee. Ignorer = aucun override. | Oui (E2E) | -- | -- |
| Edge 1 | Cuisine + Wabi-Sabi = combinaison valide, pas de blocage | Oui (integration) | -- | -- |
| Edge 2 | Image multi-espace = message informatif "une seule piece a la fois" | Oui (E2E) | Declenchement depend de la detection GPT-4.1-mini | Given image detectee comme multi-espace, When affichage, Then message informatif visible |
| Edge 4 | Image invalide = validation bloque avant selecteur type | Oui (E2E) | -- | -- |
| Edge 5 | Custom prompt + type = GPT-4.1-mini filtre incompatibles | Oui (integration) | Non deterministe | Given type "Cuisine" + custom "canape cuir", When pre-processing, Then "canape" filtre du prompt |
| Edge 6 | Buanderie + Art Deco = pas de blocage | Oui (integration) | -- | -- |

### F3 -- Exterieur

| # | Critere (resume) | Testable ? | Probleme | Reformulation |
|---|---|---|---|---|
| US-F3-01 | Terrasse : mobilier outdoor weatherproof. Passe 1 = sol terrasse + preserve garde-corps. Passe 2 = mobilier outdoor freestanding. | Oui (integration) | "Aucun meuble indoor" et "garde-corps preserve" = verification visuelle | Given mode Exterieur + sous-type Terrasse, When prompts construits, Then surfacePrompt contient "open-air" ET furniturePrompt contient "weatherproof/outdoor" ET negative prompt contient "indoor furniture, sofa, carpet" |
| US-F3-01 AC | Aucun meuble indoor. Ciel preserve. Garde-corps non modifie. | Non (visuel) | Verification d'image generee = non deterministe | Tester via assertion sur prompts : negative prompt contient "indoor furniture" ; prompt passe 1 contient "preserve existing railings/guard-rails" |
| US-F3-02 | 6 styles outdoor affiches. 12 styles interieurs masques. Cosy Balcon = mobilier compact. | Oui (E2E) | -- | -- |
| US-F3-02 AC | 6 styles outdoor min. Chaque style a surfacePrompt + furniturePrompt outdoor. Aucune mention plafond/luminaire suspendu/meuble indoor. | Oui (unitaire) | -- | Given chaque style outdoor, Then surfacePrompt ne contient pas "ceiling" ET furniturePrompt ne contient pas "sofa, carpet, indoor" |
| US-F3-03 | Builders detectent isOutdoor:true et suppriment directives plafond/luminaire. Injectent "open-air space". | Oui (unitaire + integration) | -- | -- |
| US-F3-03 AC | Aucun plafond invente. Aucun luminaire de plafond outdoor. | Non (visuel) | -- | Tester via prompts : si isOutdoor=true, Then prompt ne contient pas "ceiling geometry", "ceiling light fixture" |
| US-F3-04 | Photo interieure en mode Exterieur = alerte non bloquante "Basculer en mode Interieur ?" | Oui (E2E) | Declenchement depend de GPT-4.1-mini | Given mode Exterieur + photo interieure (mock detection), When upload termine, Then bandeau alerte visible avec boutons [Basculer] [Continuer] |
| US-F3-04 AC | Alerte jamais bloquante. Credit non consomme avant clic "Generer". | Oui (E2E) | -- | -- |
| Edge 1 | Ciel surexpose = preserve highlights | Oui (integration) | -- | Given photo outdoor, Then prompt contient "preserve highlights" |
| Edge 2 | Balcon 4m2 = mobilier compact impose | Oui (unitaire) | -- | Given sous-type "Balcon", Then furniturePrompt contient "compact/bistro table 60cm" |
| Edge 4 | Rooftop = preserve skyline | Oui (integration) | -- | Given sous-type "Rooftop", Then prompt contient "preserve skyline" |

### F4 -- Mode marchand

| # | Critere (resume) | Testable ? | Probleme | Reformulation |
|---|---|---|---|---|
| US-F4-01 | Upload 15 photos, style global, type de bien, generation batch max 3 concurrent. Dossier avec avant/apres. PDF genere + lien partageable. | Oui (E2E + integration) | -- | -- |
| US-F4-01 AC | PDF contient toutes les photos (avant+apres cote a cote), nom du bien, date, infos utilisateur | Oui (integration) | Tester la structure du PDF genere (nombre de pages, presence des champs) | Given 5 photos + infos bien, When PDF genere, Then PDF contient 6 pages (couverture + 5 pieces) ET page 1 contient adresse/surface/prix |
| US-F4-02 | Lien unique genere. Page web legere avec visuels + infos. Pas de login requis. | Oui (E2E) | -- | -- |
| US-F4-02 AC | Lien valide 30 jours. Page mobile-friendly. Bouton "Telecharger PDF" present. | Oui (E2E) | TTL 30j = test d'integration avec date simulee | Given lien cree, When visite a J+31, Then page affiche "dossier expire" |
| US-F4-03 | Style par photo individuelle. Style global = defaut. Badge de style sur vignette. | Oui (E2E) | -- | -- |
| US-F4-03 AC | Badge visible. Style individuel modifiable ou reinitialise au global. | Oui (E2E) | -- | -- |
| Edge 1 | Credit insuffisant en cours de batch : photos restantes non generees, dossier partiel conserve | Oui (integration) | -- | Given 15 photos + 8 credits, When batch lance, Then 8 photos generees + message "credits insuffisants" + dossier partiel consultable |
| Edge 2 | Timeout sur 1 photo : marquee "Echec", batch continue | Oui (integration) | -- | -- |
| Edge 4 | PDF > 25 Mo : proposer ZIP en alternative | Oui (integration) | -- | -- |
| Edge 5 | Lien expire >30j : message "dossier expire" | Oui (E2E) | -- | -- |
| Edge 7 | Infos bien non renseignees : PDF genere avec "Bien sans titre" | Oui (integration) | -- | -- |

### F5 -- Mode decorateur

| # | Critere (resume) | Testable ? | Probleme | Reformulation |
|---|---|---|---|---|
| US-F5-01 | Clic "Voir les produits" declenche GPT-4.1, affiche 5+ produits avec nom, prix indicatif, lien recherche IKEA/Leroy Merlin/Made.com | Oui (E2E + integration) | -- | -- |
| US-F5-01 AC | Min 5 produits. Liens = URLs de recherche reelles. Prix marques "indicatif". | Partiellement | "URLs de recherche reelles" = verifiable par pattern match sur le domaine, mais le contenu de la page cible n'est pas garanti | Given style "Scandinave" + type "Salon", When shopping list generee (mock GPT-4.1), Then reponse contient >= 5 items ET chaque item.link match /ikea\.com|leroymerlin\.fr|maisonsdumonde\.com/ ET chaque item.price contient "indicatif" |
| US-F5-02 | Export PDF : miniature visuel + style + liste produits avec QR codes. Telechargement direct. | Oui (integration) | -- | -- |
| US-F5-02 AC | PDF genere < 5s. Liens cliquables. QR code par produit. | Oui (integration) | Tester la structure du PDF (nombre de pages, presence QR codes via pdf-lib parsing). Le seuil 5s est testable avec timer. | Given shopping list de 6 produits, When export PDF, Then PDF genere en < 5s ET contient 6 blocs produit ET contient 6 images QR |
| US-F5-03 | Clic "Alternative budget" genere 1-2 alternatives -30/50% via GPT-4.1-mini | Oui (E2E + integration) | -- | -- |
| US-F5-03 AC | Alternative affichee sous le produit original sans rechargement. Toggle original/alternative. | Oui (E2E) | -- | -- |
| Edge 1 | Produit IKEA retire du catalogue : liens de recherche restent valides | Non | Le lien est une URL de recherche generique, la validite depend d'IKEA — non testable en CI | Tester que le lien est bien une URL de recherche (pattern /search/) et non un lien produit direct (/p/) |
| Edge 2 | Style Maximaliste 15+ meubles : shopping list limitee a 8 produits | Oui (integration) | -- | Given furniturePrompt Maximaliste, When shopping list generee, Then products.length <= 8 |
| Edge 3 | Piece tres petite : GPT-4.1 recommande meubles compacts | Oui (integration) | Non deterministe (depend LLM) | Given roomType avec metadata "18m2", When prompt construit, Then system prompt contient "small space, compact furniture" |
| Edge 4 | Mode Exterieur + shopping list : sources adaptees (pas IKEA) | Oui (integration) | -- | Given isOutdoor=true, When shopping list generee, Then aucun lien ne contient "ikea.com" |
| Edge 5 | Custom style + shopping list : disclaimer "recommandations approximatives" | Oui (E2E) | -- | -- |
| Edge 6 | Prix non trouve : affiche "Prix non disponible" jamais de prix invente | Oui (integration) | -- | Given produit sans prix dans la reponse GPT-4.1, Then affichage "Prix non disponible — voir en boutique" |
| Edge 7 | Export PDF > 5 Mo : compression auto + avertissement | Oui (integration) | -- | -- |

## Criteres non testables -- Synthese

Les criteres suivants dependent du rendu visuel de l'IA generative et ne peuvent pas etre valides par des tests automatises deterministes. Ils relevent d'un audit humain (agents Yann Duval / Lucas Moreau) ou d'une evaluation subjective.

| Feature | Critere | Raison | Strategie alternative |
|---|---|---|---|
| F1 | Qualite de l'enrichissement commentaire par GPT-4.1-mini | Non deterministe : meme input = outputs variables | Test integration : verifier que le payload contient des mots-cles attendus (pattern match), pas une correspondance exacte |
| F2 | "Resultat notablement different d'un salon pour la meme image" (US-F2-02 AC) | Subjectif, verification visuelle | Assertion sur les prompts envoyes a l'API : furniturePrompt Cuisine != furniturePrompt Salon |
| F2 | Detection auto GPT-4.1-mini du type de piece (US-F2-03) | Non deterministe | Mock la reponse GPT-4.1-mini, tester le flow UI (proposition affichee, confirmation/rejet) |
| F3 | "Aucun meuble indoor", "ciel preserve", "garde-corps non modifie" (US-F3-01 AC) | Verification d'image generee = non deterministe | Assertions sur les prompts : negative prompt contient "indoor furniture", prompt passe 1 contient "preserve railings" |
| F5 | Pertinence des produits recommandes par GPT-4.1 | Non deterministe, depend du LLM | Assertions structurelles : >= 5 produits, chaque produit a nom/prix/lien, liens sont des URLs de recherche valides |
| F5 | Qualite des alternatives budget (-30/50%) | Non deterministe | Verifier que le prix de l'alternative est inferieur au prix original (si les deux sont numeriques) |

## Scenarios E2E Playwright

### E2E-01 : Generation standard + iteration commentaire

Parcours : Upload photo -> Style Scandinave -> Generer -> Resultat -> Affiner avec commentaire -> Version v2

```typescript
test('E2E-01: generation standard puis iteration commentaire', async ({ page }) => {
  // Setup : mock /api/generate et /api/preprocess-prompt
  await page.route('**/api/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [{ imageUrl: '/fixtures/result-scandinave.jpg', pass1Key: 'sessions/test/0/pass1.jpg' }],
      }),
    });
  });
  await page.route('**/api/preprocess-prompt', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        surfacePrompt: 'same',
        furniturePrompt: 'dark anthracite sofa, keep other furniture',
        warnings: [],
      }),
    });
  });

  await page.goto('/');

  // Etape 1 : Upload
  const fileInput = page.locator('[data-testid="upload-zone"] input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/photo-salon.jpg');
  await expect(page.locator('[data-testid="upload-preview"]')).toBeVisible();

  // Etape 2 : Style
  await page.click('[data-testid="style-scandinave"]');
  await expect(page.locator('[data-testid="style-scandinave"]')).toHaveAttribute('aria-selected', 'true');

  // Etape 3 : Generer
  await page.click('[data-testid="btn-generate"]');
  await expect(page.locator('[data-testid="generation-loader"]')).toBeVisible();
  await expect(page.locator('[data-testid="image-comparator"]')).toBeVisible({ timeout: 15000 });

  // Verifier le comparateur et le bouton Affiner
  await expect(page.locator('[data-testid="btn-refine"]')).toBeVisible();
  await expect(page.locator('[data-testid="iterations-badge"]')).toContainText('restante');

  // Etape 4 : Affiner
  await page.click('[data-testid="btn-refine"]');
  await expect(page.locator('[data-testid="refine-modal"]')).toBeVisible();
  await page.fill('[data-testid="refine-comment"]', 'canape anthracite au lieu de gris');
  await page.click('[data-testid="btn-submit-refinement"]');

  // Verifier que la generation se relance (loader visible)
  await expect(page.locator('[data-testid="generation-loader"]')).toBeVisible();
  await expect(page.locator('[data-testid="image-comparator"]')).toBeVisible({ timeout: 15000 });

  // Verifier le selecteur de versions
  await expect(page.locator('[data-testid="version-selector"]')).toBeVisible();
  await expect(page.locator('[data-testid="version-v1"]')).toBeVisible();
  await expect(page.locator('[data-testid="version-v2"]')).toBeVisible();

  // Verifier que le compteur a decremente
  const badge = page.locator('[data-testid="iterations-badge"]');
  const text = await badge.textContent();
  const previousCount = parseInt(text!.match(/(\d+)/)?.[1] || '0');
  // Le compteur doit etre inferieur apres iteration (test structurel)
  expect(previousCount).toBeGreaterThanOrEqual(0);
});
```

### E2E-02 : Selection type de piece + generation

Parcours : Upload -> Type "Salle de bain" -> Style Japandi -> Generer -> Verifier prompts adaptes

```typescript
test('E2E-02: selection type de piece adapte les prompts', async ({ page }) => {
  let capturedBody: any = null;

  await page.route('**/api/generate', async (route) => {
    capturedBody = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [{ imageUrl: '/fixtures/result-japandi-sdb.jpg', pass1Key: 'sessions/test/0/pass1.jpg' }],
      }),
    });
  });

  await page.goto('/');

  // Upload
  const fileInput = page.locator('[data-testid="upload-zone"] input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/photo-sdb.jpg');
  await expect(page.locator('[data-testid="upload-preview"]')).toBeVisible();

  // Type de piece
  await page.click('[data-testid="room-type-selector"]');
  await page.click('[data-testid="room-type-salle-de-bain"]');
  await expect(page.locator('[data-testid="room-type-selector"]')).toContainText('Salle de bain');

  // Style
  await page.click('[data-testid="style-japandi"]');

  // Generer
  await page.click('[data-testid="btn-generate"]');
  await expect(page.locator('[data-testid="image-comparator"]')).toBeVisible({ timeout: 15000 });

  // Verifier que le body envoye contient les overrides salle de bain
  expect(capturedBody).toBeTruthy();
  expect(capturedBody.roomType).toBe('salle-de-bain');
  expect(capturedBody.furniturePrompt.toLowerCase()).toMatch(/vanity|mirror|towel/);
  expect(capturedBody.furniturePrompt.toLowerCase()).not.toMatch(/sofa|coffee table/);
});
```

### E2E-03 : Mode exterieur terrasse

Parcours : Toggle Exterieur -> Upload terrasse -> Verifier 6 styles outdoor affiches -> Generer -> Verifier prompts outdoor

```typescript
test('E2E-03: mode exterieur terrasse avec styles outdoor', async ({ page }) => {
  let capturedBody: any = null;

  await page.route('**/api/generate', async (route) => {
    capturedBody = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [{ imageUrl: '/fixtures/result-terrasse.jpg', pass1Key: 'sessions/test/0/pass1.jpg' }],
      }),
    });
  });

  await page.goto('/');

  // Activer mode Exterieur
  await page.click('[data-testid="toggle-outdoor"]');
  await expect(page.locator('[data-testid="toggle-outdoor"]')).toHaveAttribute('aria-pressed', 'true');

  // Upload
  const fileInput = page.locator('[data-testid="upload-zone"] input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/photo-terrasse.jpg');

  // Sous-type
  await page.click('[data-testid="outdoor-type-terrasse"]');

  // Verifier que les styles outdoor sont affiches (6 min) et les styles interieurs masques
  const outdoorStyles = page.locator('[data-testid^="style-outdoor-"]');
  await expect(outdoorStyles).toHaveCount(6, { timeout: 5000 });
  const indoorStyles = page.locator('[data-testid="style-scandinave"]');
  await expect(indoorStyles).toHaveCount(0);

  // Selectionner un style outdoor
  await page.click(outdoorStyles.first());

  // Generer
  await page.click('[data-testid="btn-generate"]');
  await expect(page.locator('[data-testid="image-comparator"]')).toBeVisible({ timeout: 15000 });

  // Verifier les prompts outdoor
  expect(capturedBody).toBeTruthy();
  expect(capturedBody.isOutdoor).toBe(true);
  expect(capturedBody.surfacePrompt.toLowerCase()).toMatch(/open-air|outdoor/);
  expect(capturedBody.furniturePrompt.toLowerCase()).toMatch(/weatherproof|outdoor/);
  expect(capturedBody.surfacePrompt.toLowerCase()).not.toMatch(/ceiling geometry|ceiling light/);
});
```

### E2E-04 : Mode marchand dossier complet

Parcours : Upload 5 photos -> Style global -> Infos bien -> Generer batch -> PDF -> Lien partageable

```typescript
test('E2E-04: mode marchand batch generation + PDF + lien', async ({ page }) => {
  // Mock batch generation
  await page.route('**/api/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [{ imageUrl: '/fixtures/result-batch.jpg', pass1Key: 'sessions/test/0/pass1.jpg' }],
      }),
    });
  });

  // Mock PDF generation
  await page.route('**/api/dossier/pdf', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      body: Buffer.from('fake-pdf-content'),
    });
  });

  // Mock lien partageable
  await page.route('**/api/dossier/share', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://architecture-toum92.replit.app/dossier/abc-123' }),
    });
  });

  await page.goto('/');

  // Activer mode Marchand
  await page.click('[data-testid="toggle-marchand"]');
  await expect(page.locator('[data-testid="marchand-panel"]')).toBeVisible();

  // Upload 5 photos
  const fileInput = page.locator('[data-testid="upload-zone"] input[type="file"]');
  await fileInput.setInputFiles([
    'tests/fixtures/photo-1.jpg',
    'tests/fixtures/photo-2.jpg',
    'tests/fixtures/photo-3.jpg',
    'tests/fixtures/photo-4.jpg',
    'tests/fixtures/photo-5.jpg',
  ]);
  await expect(page.locator('[data-testid="upload-count"]')).toContainText('5');

  // Style global
  await page.click('[data-testid="style-contemporain"]');

  // Infos bien
  await page.fill('[data-testid="bien-adresse"]', '12 rue de la Paix, Bordeaux');
  await page.fill('[data-testid="bien-surface"]', '85');
  await page.fill('[data-testid="bien-prix"]', '320000');

  // Generer batch
  await page.click('[data-testid="btn-generate-batch"]');
  await expect(page.locator('[data-testid="batch-progress"]')).toBeVisible();
  await expect(page.locator('[data-testid="batch-complete"]')).toBeVisible({ timeout: 30000 });

  // Dossier : PDF
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-testid="btn-export-pdf"]'),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);

  // Dossier : Lien partageable
  await page.click('[data-testid="btn-share-dossier"]');
  await expect(page.locator('[data-testid="share-link"]')).toContainText('dossier/abc-123');
});
```

### E2E-05 : Shopping list mode decorateur

### E2E-06 : Parcours gratuit -- limites et upsell

## Tests unitaires prioritaires (Vitest)

## Matrice de couverture

## Strategie de mocking
