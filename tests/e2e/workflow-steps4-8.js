const { chromium } = require("playwright");
const path = require("path");

const SCREENSHOTS_DIR = path.resolve(__dirname, "../../test-screenshots/workflow");
const BASE_URL = "http://localhost:3000";

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
  console.log(`  [screenshot] ${name}.png`);
}

async function waitForUrlChange(page, currentUrl, maxWait = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const url = page.url();
    if (url !== currentUrl) return url;
    await page.waitForTimeout(500);
  }
  return page.url();
}

async function clickGreenButton(page, label) {
  // Target the main action button (green, at the bottom), not stepper nav
  // The green buttons have specific text like "Valider et continuer", "Confirmer la découpe", etc.
  try {
    const btn = page.locator(`button:has-text('${label}')`).last(); // last = bottom of page, not stepper
    if (await btn.isVisible({ timeout: 3000 })) {
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      console.log(`  Clicked: '${label}'`);
      return true;
    }
  } catch {}
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Suppress noisy errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const txt = msg.text();
      if (!txt.includes("fetchCredits") && !txt.includes("Failed to fetch")) {
        console.log(`  [PAGE ERROR] ${txt.substring(0, 150)}`);
      }
    }
  });

  try {
    // ========== LOGIN ==========
    console.log("\n=== 1. LOGIN ===");
    await page.goto(BASE_URL, { timeout: 15000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await page.locator("button:has-text('Se connecter')").first().click();
    await page.waitForTimeout(1500);
    const modal = page.locator("[role='dialog']");
    await modal.locator("input[type='email']").fill("thomas@versi.fr");
    await modal.locator("input[type='password']").fill("allezpsg");
    await modal.locator("button[type='submit']").first().click();
    await page.waitForTimeout(4000);
    console.log("  OK. URL:", page.url());

    // ========== CREATE PROJECT ==========
    console.log("\n=== 2. CREATE PROJECT ===");
    await page.goto(`${BASE_URL}/projet/nouveau`, { timeout: 15000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    await page.locator("input[type='text']").first().fill("12 rue du Test, 33000 Bordeaux");
    try { await page.locator("select").first().selectOption("immeuble"); } catch {}
    // Surface totale
    try {
      const surfaceInput = page.locator("input[type='number']").first();
      await surfaceInput.fill("120");
    } catch {}
    // Upload plans
    await page.locator("input[type='file']").first().setInputFiles(["/tmp/plan_preview-1.png", "/tmp/plan_r1-1.png"]);
    await page.waitForTimeout(2000);

    // Click create button
    await clickGreenButton(page, "Créer le projet et commencer") ||
      await clickGreenButton(page, "Entrer le projet et commencer") ||
      await clickGreenButton(page, "Créer le projet");
    await page.waitForTimeout(8000);
    console.log("  URL:", page.url());

    // ========== STEP 2: DECOUPE (define lots on plan) ==========
    console.log("\n=== 3. STEP 2 — DECOUPE ===");
    // Wait for plan to load
    await page.waitForTimeout(5000);
    // Click "Confirmer la découpe" or "Confirmer" - the bottom action button
    const confirmLabels = ["Confirmer la découpe", "Confirmer et continuer", "Confirmer"];
    for (const label of confirmLabels) {
      if (await clickGreenButton(page, label)) break;
    }
    // If no explicit confirm, try just clicking the main green button at bottom
    if (page.url().includes("decoupe")) {
      try {
        // Find button at end of page that is primary/green
        const btns = page.locator("button");
        const count = await btns.count();
        for (let i = count - 1; i >= 0; i--) {
          const btn = btns.nth(i);
          const text = await btn.textContent().catch(() => "");
          const isVisible = await btn.isVisible().catch(() => false);
          if (isVisible && (text.includes("ontinuer") || text.includes("onfirmer") || text.includes("alider"))) {
            await btn.scrollIntoViewIfNeeded();
            await btn.click();
            console.log(`  Clicked bottom button: '${text.trim().substring(0, 50)}'`);
            break;
          }
        }
      } catch {}
    }
    await page.waitForTimeout(5000);
    console.log("  URL:", page.url());

    // ========== STEP 3: EXTRACTION (AI detects rooms) ==========
    console.log("\n=== 4. STEP 3 — EXTRACTION / PIECES ===");
    // Wait for AI extraction to complete (it shows "Analyse du plan en cours...")
    console.log("  Waiting for AI extraction...");
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(3000);
      const bt = await page.locator("body").textContent().catch(() => "");
      // Check if extraction is done (room details visible)
      if (bt.includes("Détails des pièces") || bt.includes("Valider et continuer")) {
        console.log(`  Extraction complete after ~${(i + 1) * 3}s`);
        break;
      }
      if (bt.includes("Analyse du plan")) console.log(`  Still analyzing... (${(i + 1) * 3}s)`);
    }
    await screenshot(page, "step3-extraction-done");

    // Set room types in the selects (they should already have detected values)
    const roomSelects = page.locator("select");
    const roomSelectCount = await roomSelects.count();
    console.log(`  Room selects: ${roomSelectCount}`);

    // Click "Valider et continuer" (the LAST button with that text, at bottom of page)
    await clickGreenButton(page, "Valider et continuer");
    await page.waitForTimeout(8000);
    console.log("  URL:", page.url());

    // ========== STEP 4: VALIDATION (verify rooms) ==========
    console.log("\n=== 5. STEP 4 — VALIDATION ===");
    // Wait for room data to load
    console.log("  Waiting for room data to load...");
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(2000);
      const bt = await page.locator("body").textContent().catch(() => "");
      if (bt.includes("Valider et continuer") && !bt.includes("Chargement")) {
        console.log(`  Rooms loaded after ~${(i + 1) * 2}s`);
        break;
      }
    }
    await screenshot(page, "step4-validation");

    // Print room names detected
    const roomCards = page.locator("h3, h4, [class*='room'], [class*='piece']");
    const cardCount = await roomCards.count();
    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      try {
        const text = await roomCards.nth(i).textContent();
        if (text && text.length < 50) console.log(`  Room: ${text.trim()}`);
      } catch {}
    }

    // Click "Valider et continuer"
    await clickGreenButton(page, "Valider et continuer");
    await page.waitForTimeout(8000);
    await screenshot(page, "step4-after-validate");
    console.log("  URL:", page.url());

    // ========== STEP 5: STYLE / QUALIFICATION ==========
    console.log("\n=== 6. STEP 5 — STYLE / QUALIFICATION ===");
    await page.waitForTimeout(3000);
    await screenshot(page, "step5-qualification");
    console.log("  URL:", page.url());

    // Fill "Cible acheteur" select
    try {
      const cibleSelect = page.locator("select").first();
      const opts = await cibleSelect.locator("option").allTextContents();
      console.log(`  Cible options: ${JSON.stringify(opts.slice(0, 6))}`);
      if (opts.length > 1) {
        // Pick a meaningful option (not placeholder)
        for (let i = 1; i < opts.length; i++) {
          if (opts[i] && !opts[i].toLowerCase().includes("choisir")) {
            await cibleSelect.selectOption({ index: i });
            console.log(`  Cible: '${opts[i]}'`);
            break;
          }
        }
      }
    } catch {}

    // Fill "Style global" select (second select)
    try {
      const styleSelect = page.locator("select").nth(1);
      const opts = await styleSelect.locator("option").allTextContents();
      console.log(`  Style options: ${JSON.stringify(opts.slice(0, 6))}`);
      if (opts.length > 1) {
        for (let i = 1; i < opts.length; i++) {
          if (opts[i] && !opts[i].toLowerCase().includes("choisir")) {
            await styleSelect.selectOption({ index: i });
            console.log(`  Style: '${opts[i]}'`);
            break;
          }
        }
      }
    } catch {}

    // Fill budget (optional)
    try {
      const budgetInput = page.locator("input[type='number']").first();
      if (await budgetInput.isVisible({ timeout: 1000 })) {
        await budgetInput.fill("150000");
        console.log("  Budget: 150000");
      }
    } catch {}

    await page.waitForTimeout(1000);
    await screenshot(page, "step5-filled");

    // Click "Valider et obtenir les recommandations"
    await clickGreenButton(page, "Valider et obtenir les recommandations") ||
      await clickGreenButton(page, "Valider et continuer") ||
      await clickGreenButton(page, "Valider");
    await page.waitForTimeout(8000);
    await screenshot(page, "step5-after-validate");
    console.log("  URL:", page.url());

    // ========== STEP 6: CONSEILS / RECOMMANDATIONS ==========
    console.log("\n=== 7. STEP 6 — CONSEILS ===");
    await page.waitForTimeout(3000);

    // Wait for recommendations to load (might be AI-generated)
    console.log("  Waiting for recommendations...");
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(3000);
      const bt = await page.locator("body").textContent().catch(() => "");
      if (bt.includes("Passer et générer") || bt.includes("Passer et generer") ||
          bt.includes("Générer") || bt.includes("Valider") ||
          bt.includes("recommandation") || bt.includes("conseil")) {
        console.log(`  Content loaded after ~${(i + 1) * 3}s`);
        break;
      }
      if (bt.includes("Chargement") || bt.includes("En cours")) {
        console.log(`  Still loading... (${(i + 1) * 3}s)`);
      }
    }
    await screenshot(page, "step6-recommandations");
    console.log("  URL:", page.url());

    // List visible buttons
    const btns6 = page.locator("button");
    const btnCount6 = await btns6.count();
    const btnTexts = [];
    for (let i = 0; i < btnCount6; i++) {
      try {
        const btn = btns6.nth(i);
        if (await btn.isVisible({ timeout: 200 })) {
          const text = (await btn.textContent()).trim();
          if (text && text.length < 60) btnTexts.push(text);
        }
      } catch {}
    }
    console.log(`  Visible buttons: ${JSON.stringify(btnTexts)}`);

    // Click "Passer et generer" or similar
    await clickGreenButton(page, "Passer et générer") ||
      await clickGreenButton(page, "Passer et generer") ||
      await clickGreenButton(page, "Générer les visuels") ||
      await clickGreenButton(page, "Générer") ||
      await clickGreenButton(page, "Valider et générer") ||
      await clickGreenButton(page, "Valider et continuer") ||
      await clickGreenButton(page, "Continuer");
    await page.waitForTimeout(5000);
    await screenshot(page, "step6-after-click");
    console.log("  URL:", page.url());

    // ========== STEP 7: VISUELS / GENERATION ==========
    console.log("\n=== 8. STEP 7 — GENERATION ===");
    await screenshot(page, "step7-start");
    console.log("  URL:", page.url());
    console.log("  Waiting for generation (max 120s)...");

    let genDone = false;
    for (let i = 0; i < 24; i++) {
      await page.waitForTimeout(5000);
      const bt = await page.locator("body").textContent().catch(() => "");
      if (bt.includes("Dossier") || bt.includes("Terminé") || bt.includes("terminé") ||
          bt.includes("Télécharger") || bt.includes("Voir le dossier") ||
          bt.includes("Félicitations") || bt.includes("terminée")) {
        genDone = true;
        console.log(`  Generation done after ~${(i + 1) * 5}s`);
        break;
      }
      const prog = bt.match(/(\d+)\s*%/) || bt.match(/(\d+)\s*\/\s*(\d+)\s*visuel/i);
      if (prog) console.log(`  Progress: ${prog[0]}`);
      // Screenshot every 20s
      if (i % 4 === 3) await screenshot(page, `step7-progress-${(i + 1) * 5}s`);
    }
    await screenshot(page, "step7-done");

    // Navigate to dossier
    await clickGreenButton(page, "Voir le dossier") ||
      await clickGreenButton(page, "Voir les résultats") ||
      await clickGreenButton(page, "Continuer");
    await page.waitForTimeout(5000);

    // ========== STEP 8: DOSSIER ==========
    console.log("\n=== 9. STEP 8 — DOSSIER ===");
    await screenshot(page, "step8-dossier");
    console.log("  URL:", page.url());

    // Scroll down to capture full dossier
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    await screenshot(page, "step8-dossier-mid");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await screenshot(page, "step8-dossier-bottom");

    console.log("\n=== ALL STEPS COMPLETE ===");
    console.log("  Screenshots in test-screenshots/workflow/");

  } catch (err) {
    console.error("\n[FATAL]", err.message);
    await screenshot(page, "99-error").catch(() => {});
  } finally {
    await browser.close();
  }
})();
