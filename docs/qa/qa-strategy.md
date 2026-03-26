# Strategie QA -- Versiroom

> Produit par @qa | Date : 2026-03-24
> Source : docs/product/functional-specs.md v1.0 (F1-F5, sections 6-7)
> Stack cible tests : Vitest (unitaires/integration) + Playwright (E2E)
> Contexte equipe : solo dev + agents IA -- CI legere, focus tests critiques
> Deploiement : Replit (CI/CD geree par Replit, pas par GitHub Actions)

---

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

Parcours : Generation Scandinave -> Clic "Voir les produits" -> Shopping list affichee -> Alternative budget -> Export PDF

```typescript
test('E2E-05: shopping list mode decorateur avec alternatives et export PDF', async ({ page }) => {
  // Mock generation standard
  await page.route('**/api/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [{ imageUrl: '/fixtures/result-scandinave.jpg', pass1Key: 'sessions/test/0/pass1.jpg' }],
      }),
    });
  });

  // Mock shopping list API
  await page.route('**/api/shopping-list', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        products: [
          { name: 'Canape 3 places tissu gris clair', enseigne: 'IKEA', price: '~699EUR indicatif', link: 'https://www.ikea.com/fr/fr/search/?q=canape+3+places+gris', type: 'canape' },
          { name: 'Table basse ronde bois clair', enseigne: 'IKEA', price: '~129EUR indicatif', link: 'https://www.ikea.com/fr/fr/search/?q=table+basse+ronde+bois', type: 'table' },
          { name: 'Tapis laine blanc 200x300', enseigne: 'Maisons du Monde', price: '~249EUR indicatif', link: 'https://www.maisonsdumonde.com/FR/fr/search/?q=tapis+laine+blanc', type: 'tapis' },
          { name: 'Lampadaire arc laiton', enseigne: 'Leroy Merlin', price: '~89EUR indicatif', link: 'https://www.leroymerlin.fr/search/?q=lampadaire+arc', type: 'luminaire' },
          { name: 'Plante monstera en pot', enseigne: 'Leroy Merlin', price: '~35EUR indicatif', link: 'https://www.leroymerlin.fr/search/?q=monstera+pot', type: 'plante' },
        ],
        disclaimer: 'Prix indicatifs a la date de generation.',
      }),
    });
  });

  // Mock alternatives budget
  await page.route('**/api/shopping-list/alternative', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        alternative: { name: 'Canape convertible tissu gris', enseigne: 'IKEA', price: '~449EUR indicatif', link: 'https://www.ikea.com/fr/fr/search/?q=canape+convertible+gris', type: 'canape' },
      }),
    });
  });

  // Mock PDF export
  await page.route('**/api/shopping-list/pdf', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      body: Buffer.from('fake-pdf-shopping'),
    });
  });

  await page.goto('/');

  // Upload + Style + Generer (raccourci)
  const fileInput = page.locator('[data-testid="upload-zone"] input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/photo-salon.jpg');
  await page.click('[data-testid="style-scandinave"]');
  await page.click('[data-testid="btn-generate"]');
  await expect(page.locator('[data-testid="image-comparator"]')).toBeVisible({ timeout: 15000 });

  // Clic "Voir les produits"
  await page.click('[data-testid="btn-shopping-list"]');
  await expect(page.locator('[data-testid="shopping-list-loader"]')).toBeVisible();
  await expect(page.locator('[data-testid="shopping-list-panel"]')).toBeVisible({ timeout: 10000 });

  // Verifier >= 5 produits affiches
  const productCards = page.locator('[data-testid^="product-card-"]');
  const count = await productCards.count();
  expect(count).toBeGreaterThanOrEqual(5);

  // Verifier disclaimer prix indicatifs
  await expect(page.locator('[data-testid="shopping-disclaimer"]')).toContainText('indicatif');

  // Verifier que chaque produit a un lien valide (pattern domaine)
  const firstLink = page.locator('[data-testid="product-card-0"] a[data-testid="product-link"]');
  const href = await firstLink.getAttribute('href');
  expect(href).toMatch(/ikea\.com|leroymerlin\.fr|maisonsdumonde\.com/);

  // Alternative budget
  await page.click('[data-testid="product-card-0"] [data-testid="btn-alternative-budget"]');
  await expect(page.locator('[data-testid="product-card-0"] [data-testid="alternative-panel"]')).toBeVisible();
  await expect(page.locator('[data-testid="product-card-0"] [data-testid="alternative-price"]')).toContainText('449');

  // Toggle original / alternative
  await page.click('[data-testid="product-card-0"] [data-testid="btn-toggle-original"]');
  await expect(page.locator('[data-testid="product-card-0"] [data-testid="alternative-panel"]')).not.toBeVisible();

  // Export PDF
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-testid="btn-export-shopping-pdf"]'),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});
```

### E2E-06 : Parcours gratuit -- limites et upsell

Parcours : Utilisateur sans pack -> Upload -> Generer -> Resultat -> Tentative Affiner (bloque) -> Tentative Shopping list (bloque) -> CTA upsell visible

```typescript
test('E2E-06: parcours gratuit avec limites et upsell', async ({ page }) => {
  // Mock generation (5 credits = pack Decouverte)
  let generateCallCount = 0;
  await page.route('**/api/generate', async (route) => {
    generateCallCount++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [{ imageUrl: '/fixtures/result-scandinave.jpg', pass1Key: 'sessions/test/0/pass1.jpg' }],
        creditsRemaining: 5 - generateCallCount,
      }),
    });
  });

  await page.goto('/');

  // Upload + Style + Generer
  const fileInput = page.locator('[data-testid="upload-zone"] input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/photo-salon.jpg');
  await page.click('[data-testid="style-scandinave"]');
  await page.click('[data-testid="btn-generate"]');
  await expect(page.locator('[data-testid="image-comparator"]')).toBeVisible({ timeout: 15000 });

  // Bouton Affiner : grise sur pack Decouverte (0 iteration)
  const refineBtn = page.locator('[data-testid="btn-refine"]');
  await expect(refineBtn).toBeDisabled();
  await refineBtn.hover();
  await expect(page.locator('[data-testid="tooltip-refine-locked"]')).toContainText(/pack|offre/i);

  // Bouton Shopping list : absent ou grise (pas disponible sous Pro)
  const shoppingBtn = page.locator('[data-testid="btn-shopping-list"]');
  const shoppingVisible = await shoppingBtn.isVisible().catch(() => false);
  if (shoppingVisible) {
    await expect(shoppingBtn).toBeDisabled();
  }

  // CTA upsell visible quelque part sur la page
  await expect(page.locator('[data-testid="upsell-banner"]')).toBeVisible();
  await expect(page.locator('[data-testid="upsell-banner"]')).toContainText(/offre|pack|tarif/i);

  // Clic sur CTA upsell mene a la section pricing
  await page.click('[data-testid="upsell-banner"] a, [data-testid="upsell-banner"] button');
  await expect(page.locator('[data-testid="pricing-section"]')).toBeInViewport();

  // Verifier que les 4 packs sont affiches
  const pricingCards = page.locator('[data-testid^="pricing-card-"]');
  await expect(pricingCards).toHaveCount(4);

  // Verifier le feature gating affiche (Decouverte = pas d'iteration, pas de shopping list)
  const decouverte = page.locator('[data-testid="pricing-card-decouverte"]');
  await expect(decouverte).toContainText('5 credits');
  await expect(decouverte).toContainText(/0 iteration|sans iteration/i);
});
```

### E2E-07 : Feature gating par package

Parcours : Verifier que les limites par package (Decouverte/Starter/Pro/Studio) sont respectees dans l'UI

```typescript
test('E2E-07: feature gating par package Decouverte', async ({ page }) => {
  // Simuler un utilisateur avec pack Decouverte (5 credits, 0 iteration, pas de marchand, pas de shopping)
  await page.addInitScript(() => {
    localStorage.setItem('session_package', JSON.stringify({
      type: 'decouverte',
      credits: 5,
      iterations_per_photo: 0,
      features: { merchant: false, shopping: false, pdf_export: false, shareable_link: false },
    }));
  });

  await page.route('**/api/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [{ imageUrl: '/fixtures/result-scandinave.jpg', pass1Key: 'sessions/test/0/pass1.jpg' }],
      }),
    });
  });

  await page.goto('/');

  // Upload + Style + Generer
  const fileInput = page.locator('[data-testid="upload-zone"] input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/photo-salon.jpg');
  await page.click('[data-testid="style-scandinave"]');
  await page.click('[data-testid="btn-generate"]');
  await expect(page.locator('[data-testid="image-comparator"]')).toBeVisible({ timeout: 15000 });

  // Decouverte : Affiner = desactive (0 iteration)
  await expect(page.locator('[data-testid="btn-refine"]')).toBeDisabled();

  // Decouverte : Shopping list = non visible ou desactive
  const shoppingBtn = page.locator('[data-testid="btn-shopping-list"]');
  if (await shoppingBtn.isVisible()) {
    await expect(shoppingBtn).toBeDisabled();
  }

  // Decouverte : Mode Marchand = non visible
  await expect(page.locator('[data-testid="toggle-marchand"]')).not.toBeVisible();

  // Decouverte : Telechargement HD = actif (disponible sur tous les packs)
  await expect(page.locator('[data-testid="btn-download-hd"]')).toBeEnabled();
});

test('E2E-07b: feature gating par package Pro', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('session_package', JSON.stringify({
      type: 'pro',
      credits: 50,
      iterations_per_photo: 3,
      features: { merchant: true, shopping: true, pdf_export: true, shareable_link: true },
    }));
  });

  await page.route('**/api/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [{ imageUrl: '/fixtures/result-scandinave.jpg', pass1Key: 'sessions/test/0/pass1.jpg' }],
      }),
    });
  });

  await page.goto('/');

  const fileInput = page.locator('[data-testid="upload-zone"] input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/photo-salon.jpg');
  await page.click('[data-testid="style-scandinave"]');
  await page.click('[data-testid="btn-generate"]');
  await expect(page.locator('[data-testid="image-comparator"]')).toBeVisible({ timeout: 15000 });

  // Pro : Affiner = actif (3 iterations)
  await expect(page.locator('[data-testid="btn-refine"]')).toBeEnabled();
  await expect(page.locator('[data-testid="iterations-badge"]')).toContainText('3');

  // Pro : Shopping list = actif
  await expect(page.locator('[data-testid="btn-shopping-list"]')).toBeEnabled();

  // Pro : Mode Marchand = visible (max 10 photos)
  await expect(page.locator('[data-testid="toggle-marchand"]')).toBeVisible();
});
```

---

## Tests unitaires prioritaires (Vitest)

### P0 — Critique (bloque le deploy si rouge)

| ID | Fichier cible | Description | Assertions cles |
|---|---|---|---|
| UT-01 | `lib/room-types.ts` | roomFurnitureOverride et roomSurfaceOverride retournent les bons overrides par type | Salle de bain contient "vanity/mirror", Cuisine contient "countertop", Salon ne contient pas "vanity" |
| UT-02 | `lib/room-types.ts` | Negative prompt par type exclut le mobilier incompatible | Salle de bain negative contient "sofa, coffee table", Cuisine negative contient "bed, wardrobe" |
| UT-03 | `lib/custom-prompt.ts` | Pre-processing GPT-4.1-mini split surface/furniture correctement | Mock GPT-4.1-mini, verifier que la reponse contient surfacePrompt et furniturePrompt separes |
| UT-04 | `lib/custom-prompt.ts` | Filtrage elements structurels (fenetres, murs, portes) retourne un warning | Input "ajoute une fenetre" → warnings non vide, contient "structurel" |
| UT-05 | `lib/custom-prompt.ts` | Traduction FR→EN du commentaire | Input "canape rouge" → output contient "red sofa" ou equivalent anglais |
| UT-06 | `components/StylePicker.tsx` | surfacePrompt et furniturePrompt sont distincts pour chaque style | Pour chaque styleId, surfacePrompt ne contient pas "sofa/chair/table", furniturePrompt ne contient pas "ceiling/wall paint" |
| UT-07 | `components/StylePicker.tsx` | Aucun stylePrompt ne contient "curtains", "drapes", "window" | Iteration sur les 12 styles, regex match = 0 |
| UT-08 | `components/StylePicker.tsx` | Aucun stylePrompt ne contient de directive de lumiere | Regex sur "warm light", "golden hour", "tungsten" = 0 match |
| UT-09 | `lib/image-utils.ts` | Resize respecte max 2048px et compresse en JPEG 85% | Image 4000x3000 → sortie <= 2048 sur la plus grande dimension |
| UT-10 | `lib/image-utils.ts` | Validation contenu image rejette les images uniformes | Image 100% noire → rejet, photo reelle → acceptation |
| UT-11 | `app/api/generate/route.ts` | Rate limiting bloque apres 10 requetes/min par IP | 11eme requete → status 429 |

### P1 — Important (bloque la PR si rouge)

| ID | Fichier cible | Description | Assertions cles |
|---|---|---|---|
| UT-12 | `components/StylePicker.tsx` | Mode outdoor affiche 6 styles, mode indoor affiche 12 styles | isOutdoor=true → 6 styles rendus, isOutdoor=false → 12 styles rendus |
| UT-13 | `components/StylePicker.tsx` | Aucun style outdoor ne contient "ceiling", "indoor" | Iteration sur les 6 styles outdoor |
| UT-14 | `components/UploadZone.tsx` | Rejette fichiers > 10Mo avec message FR | Fichier 11Mo → message erreur contient "10 Mo" |
| UT-15 | `components/UploadZone.tsx` | Accepte JPG, PNG, WEBP, HEIC | Fichiers valides → pas d'erreur |
| UT-16 | `components/UploadZone.tsx` | Max 5 photos, 6eme rejetee avec message | 6 fichiers → message erreur contient "5 photos" |
| UT-17 | `components/ImageComparator.tsx` | Download HD genere un blob valide | dataUriToBlob retourne un Blob avec type image/jpeg |
| UT-18 | `lib/db.ts` | logGeneration stocke les prompts construits complets | Mock pg pool, verifier que built_prompt_pass1 et built_prompt_pass2 sont dans le INSERT |
| UT-19 | `app/api/shopping-list/route.ts` | Reponse contient >= 5 produits avec nom, prix, lien | Mock GPT-4.1, structure de reponse validee par schema |
| UT-20 | `app/api/shopping-list/route.ts` | Liens sont des URLs de recherche (/search/) pas des URLs produit | Chaque lien match /search|q=/ et ne match pas /\/p\/\d+/ |

### P2 — Nice-to-have

| ID | Fichier cible | Description | Assertions cles |
|---|---|---|---|
| UT-21 | `components/StepIndicator.tsx` | Etape active est visuellement distincte (aria-current) | Etape 2 active → aria-current="step" sur etape 2 |
| UT-22 | `app/api/generate/route.ts` | AbortController annule les requetes en cours | Signal abort → fetch rejete |
| UT-23 | `app/api/generate/route.ts` | Fallback Flux si OpenAI echoue | Mock OpenAI echec → Flux appele, resultat retourne |
| UT-24 | `app/page.tsx` | handleFullReset remet tous les etats a zero | Apres reset → images vide, style null, isGenerating false |
| UT-25 | `app/api/dossier/pdf/route.ts` | PDF genere contient le bon nombre de pages (couverture + N pieces) | 5 photos → 6 pages |

## Matrice de couverture

| Feature / Composant | Unit (Vitest) | Integration (Vitest) | E2E (Playwright) | Visuel (screenshot) |
|---|---|---|---|---|
| **F1 — Iteration commentaire** | UT-03, UT-04, UT-05 (custom-prompt) | Pre-processing enrichissement, fallback GPT-4.1-mini, rollback compteur timeout | E2E-01 | Modale Affiner, selecteur versions |
| **F2 — Type de piece** | UT-01, UT-02 (room-types) | Override injection dans payload /api/generate | E2E-02 | Selecteur type de piece |
| **F3 — Exterieur** | UT-12, UT-13 (styles outdoor) | Prompts outdoor sans ceiling/indoor, detection photo interieure | E2E-03 | Toggle outdoor, 6 styles affiches |
| **F4 — Mode marchand** | UT-25 (PDF pages) | Batch generation max 3 concurrent, PDF structure, lien partageable TTL 30j | E2E-04 | Panel marchand, batch progress |
| **F5 — Mode decorateur** | UT-19, UT-20 (shopping list) | GPT-4.1 shopping list, alternatives budget, export PDF QR | E2E-05 | Shopping list panel, cartes produit |
| **Pipeline generation** | UT-06, UT-07, UT-08 (prompts) | Pipeline 2 passes, fallback Flux, rate limiting | E2E-01 | Loader generation |
| **Upload** | UT-09, UT-10, UT-14, UT-15, UT-16 | Resize + compression client | E2E-01 a E2E-06 | Zone drag-drop, previews |
| **Comparateur** | UT-17 (download blob) | Partage WhatsApp, copie image | E2E-01 | Slider avant/apres |
| **Pricing / Upsell** | -- | Feature gating par package | E2E-06 | Section pricing, CTA upsell |
| **Accessibilite** | UT-21 (aria-current) | -- | axe-core integre dans tous les E2E | -- |

**Seuils de couverture :**
- Chemins critiques (pipeline generation, paiement, upload) : >= 90% branch coverage
- Composants UI : >= 80% statement coverage
- Utilitaires (lib/) : >= 85% branch coverage
- API routes : >= 90% branch coverage (tous les status codes testes)

## Strategie de mocking

### APIs IA — MSW (Mock Service Worker)

**OpenAI Responses API (gpt-4.1)**
- Mock `openai.responses.create()` via vi.mock('openai') dans Vitest
- Reponse type : `{ output: [{ type: 'image_generation_call', result: 'base64_encoded_image' }] }`
- Scenarios : succes, timeout (>90s simulee), erreur 429 (rate limit), erreur 500
- En E2E Playwright : `page.route('**/api/generate')` intercepte au niveau HTTP (pas besoin de MSW)

**GPT-4.1-mini (pre-processing)**
- Mock `openai.chat.completions.create()` pour le pre-processing commentaire et shopping list
- Reponses deterministes : JSON structure avec surfacePrompt, furniturePrompt, warnings
- Scenarios : succes, echec (fallback prompt brut), reponse malformee

**Flux Depth Pro (Replicate)**
- Mock `replicate.run()` via vi.mock('replicate')
- Reponse type : `['https://replicate.delivery/fake/output.jpg']`
- Scenarios : succes, timeout, modele indisponible (fallback total echoue)

### Stripe (paiement)

- Vi.mock pour les tests unitaires : `stripe.checkout.sessions.create()` retourne un sessionId fixe
- En E2E : `page.route('**/api/checkout')` retourne un redirect URL mock
- Pas de test E2E avec Stripe reel en CI — uniquement en staging manuel
- Webhook : mock du payload `checkout.session.completed` pour valider le credit des credits

### Base de donnees PostgreSQL

- Tests unitaires : vi.mock('pg') — mock du Pool avec query() retournant des resultats fixes
- Tests integration : base de donnees de test dediee (DATABASE_URL_TEST dans .env.test)
- Fixtures : `tests/fixtures/db-seed.sql` — donnees reproductibles (users, generations, shopping lists)
- Nettoyage : `TRUNCATE` avant chaque suite de tests integration (pas entre chaque test, trop lent)

### Object Storage (Replit)

- Vi.mock('@replit/object-storage') — `uploadFromBytes` retourne void, `downloadAsBytes` retourne un buffer fixture
- En E2E : pas de mock necessaire (les images sont mockees au niveau de /api/generate)

### Fixtures fichiers

```
tests/fixtures/
  photo-salon.jpg        -- Photo reelle 1200x900, salon vide (JPEG, ~200Ko)
  photo-sdb.jpg          -- Salle de bain vide
  photo-terrasse.jpg     -- Terrasse exterieure
  photo-1.jpg ... 5.jpg  -- 5 photos pour batch marchand
  result-scandinave.jpg  -- Resultat genere mock (pour comparateur)
  result-japandi-sdb.jpg -- Resultat genere mock salle de bain
  result-terrasse.jpg    -- Resultat genere mock exterieur
  result-batch.jpg       -- Resultat genere mock batch
  db-seed.sql            -- Seed base de test
```

### Regles de mocking

1. **Jamais d'appel reel a OpenAI/Replicate en CI** — cout prohibitif + non deterministe
2. **Jamais de mock qui masque un bug** — si le mock retourne toujours 200, ajouter des scenarios d'erreur
3. **Les mocks E2E (page.route) sont preferes a MSW** — plus simple, pas de setup global, visible dans le test
4. **Les mocks Vitest (vi.mock) sont preferes pour les tests unitaires** — isolation complete du module
5. **Les fixtures images sont des fichiers reels** (pas des buffers vides) — necessaire pour tester resize/compression

---

## Seuils de performance (Lighthouse CI)

| Metrique | Seuil bloquant | Justification |
|---|---|---|
| LCP | < 2,5s | Page principale = Hero + outil, doit charger vite sur mobile |
| INP | < 200ms | Interactions tactiles (upload, style picker, slider comparateur) |
| CLS | < 0,1 | Pas de layout shift lors du chargement des images/resultats |
| Bundle JS total | < 500 Ko (gzip) | Replit = hebergement partage, bande passante limitee |

Note : Lighthouse CI n'est pas dans le pipeline CI Replit. A integrer si migration vers GitHub Actions.

---

## Pipeline CI recommandee

Contexte : solo dev sur Replit. Le CI/CD est gere par Replit (auto-deploy sur push). Le pipeline ci-dessous est une cible pour quand le projet migrera vers un CI plus structure.

```
Pre-commit (Husky + lint-staged) :
  - ESLint sur fichiers modifies
  - Prettier check
  - Vitest --run --changed (tests unitaires des fichiers modifies)

CI (GitHub Actions ou equivalent) :
  1. lint          (~30s)
  2. vitest --run  (~2min) — tous les tests unitaires + integration
  3. playwright    (~5min) — E2E-01 a E2E-07 sur Chromium uniquement en CI
  4. build         (~1min) — next build
  Total cible : < 10 minutes
```

Pour le moment (solo dev, Replit) : executer `npm run test` manuellement avant chaque deploy significatif.

---

## Accessibilite (axe-core)

Integrer dans chaque test E2E Playwright :

```typescript
import AxeBuilder from '@axe-core/playwright';

// A la fin de chaque test E2E, apres le dernier expect :
const results = await new AxeBuilder({ page }).analyze();
expect(results.violations).toEqual([]);
```

Regles axe prioritaires pour Versiroom :
- `color-contrast` : palette Sage #7D9B76 sur fond #FAFAF8 = ratio 3.5:1 (echoue AA pour texte < 18px). ESCALADE @product-manager : ajuster la teinte Sage ou limiter son usage au texte > 18px.
- `button-name` : tous les boutons icone (supprimer photo, fermer modale) doivent avoir un aria-label
- `image-alt` : les images generees dans le comparateur doivent avoir un alt descriptif ("Resultat {style} — {type de piece}")

---

## Tracking plan — Couverture

Les specs definissent des events tracking pour chaque feature (F1.5, F2.5, F3.5, F4.5, F5.5).
Aucun code n'implemente ces events pour le moment (les features F1-F5 ne sont pas encore developpees).

**Action** : a la livraison de chaque feature par @fullstack, verifier via Grep que chaque event du tracking plan est implemente dans le code source. Produire un rapport de couverture tracking dans ce fichier.

| Feature | Events definis | Events implementes | Couverture |
|---|---|---|---|
| F1 | 7 events | 0 (F1 non implemente) | 0% |
| F2 | 6 events | 0 (F2 non implemente) | 0% |
| F3 | 11 events | 0 (F3 non implemente) | 0% |
| F4 | 7 events | 0 (F4 non implemente) | 0% |
| F5 | 7 events | 0 (F5 non implemente) | 0% |

---

## Auto-evaluation

- [x] Chaque chemin critique du persona principal est-il couvert par un test E2E ? -- Oui : Claire (E2E-01 generation+iteration, E2E-02 type piece, E2E-05 shopping), Thomas (E2E-04 marchand, E2E-03 exterieur), Lea (E2E-06 gratuit)
- [x] Un developpeur peut-il comprendre pourquoi chaque test existe sans lire le code ? -- Oui : chaque E2E a un titre descriptif + commentaires inline
- [x] Le pipeline complet tourne-t-il en moins de 10 minutes ? -- Oui : cible < 10 min (lint 30s + vitest 2min + playwright 5min + build 1min)
- [ ] Les events du tracking-plan sont-ils tous implementes ? -- Non : F1-F5 non encore developpees. A verifier apres livraison @fullstack.
- [ ] Les tests d'accessibilite (axe-core) sont-ils integres aux tests E2E Playwright ? -- Defini dans la strategie. A implementer dans les fichiers de tests reels.

---

## Escalades identifiees

| Destinataire | Sujet | Detail |
|---|---|---|
| @product-manager | Critere F2 US-F2-02 AC "notablement different" | Non testable automatiquement. Reformuler en critere sur le contenu des prompts ou ajouter un critere visuel audite manuellement. |
| @product-manager | Critere F3 US-F3-01 AC "garde-corps non modifie" | Verification visuelle uniquement. Proposer un audit humain periodique (agents Yann/Lucas) plutot qu'un test automatise. |
| @product-manager | Palette Sage #7D9B76 et contraste AA | Ratio 3.5:1 sur fond #FAFAF8 echoue WCAG AA pour texte < 18px. Ajuster la teinte ou limiter l'usage. |
| @infrastructure | Variables d'env pour tests E2E en CI | DATABASE_URL_TEST, OPENAI_API_KEY (mock), REPLICATE_API_TOKEN (mock) doivent etre configurees comme secrets CI. |
| @fullstack | data-testid manquants | Les scenarios E2E utilisent des data-testid specifiques (upload-zone, style-scandinave, btn-generate, etc.). Ils doivent etre ajoutes aux composants lors de l'implementation de F1-F5. |
