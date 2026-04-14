const { chromium } = require("playwright");
const path = require("path");

const SCREENSHOTS_DIR = path.resolve(__dirname, "../../test-screenshots/workflow");
const BASE_URL = "http://localhost:3000";

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
  console.log(`  [screenshot] ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const txt = msg.text();
      if (!txt.includes("fetchCredits")) console.log(`  [PAGE ERROR] ${txt.substring(0, 120)}`);
    }
  });

  try {
    // ========== LOGIN ==========
    console.log("\n=== LOGIN ===");
    await page.goto(BASE_URL, { timeout: 15000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await page.locator("button:has-text('Se connecter')").first().click();
    await page.waitForTimeout(1500);
    const modal = page.locator("[role='dialog']");
    await modal.locator("input[type='email']").fill("thomas@versi.fr");
    await modal.locator("input[type='password']").fill("allezpsg");
    await modal.locator("button[type='submit']").first().click();
    await page.waitForTimeout(4000);
    console.log("  Logged in. URL:", page.url());

    // ========== CREATE PROJECT ==========
    console.log("\n=== CREATE PROJECT ===");
    await page.goto(`${BASE_URL}/projet/nouveau`, { timeout: 15000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // Fill project form
    // Address
    await page.locator("input[type='text']").first().fill("12 rue du Test, 33000 Bordeaux");
    // Type de bien select
    try { await page.locator("select").first().selectOption("immeuble"); } catch {}
    // Surface totale -- find the number input
    try {
      const surfaceInput = page.locator("input[type='number'], input[placeholder*='85'], input[placeholder*='surface']").first();
      await surfaceInput.fill("120");
      console.log("  Surface filled: 120");
    } catch (e) {
      console.log("  Surface input not found, trying text inputs...");
      // Try all text inputs for one that might be surface
      const allInputs = page.locator("input");
      const count = await allInputs.count();
      for (let i = 0; i < count; i++) {
        const ph = await allInputs.nth(i).getAttribute("placeholder").catch(() => "");
        if (ph && (ph.includes("85") || ph.toLowerCase().includes("surface"))) {
          await allInputs.nth(i).fill("120");
          console.log(`  Filled input ${i} (placeholder: ${ph})`);
          break;
        }
      }
    }

    // Upload files
    await page.locator("input[type='file']").first().setInputFiles(["/tmp/plan_preview-1.png", "/tmp/plan_r1-1.png"]);
    await page.waitForTimeout(2000);
    await screenshot(page, "01-project-form");

    // Click "Créer le projet et commencer" or "Entrer le projet et commencer"
    const createLabels = ["Créer le projet et commencer", "Entrer le projet et commencer", "Créer le projet", "Commencer"];
    for (const label of createLabels) {
      try {
        const btn = page.locator(`button:has-text('${label}')`).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          console.log(`  Clicked: '${label}'`);
          break;
        }
      } catch {}
    }

    // Wait for navigation
    await page.waitForTimeout(8000);
    await screenshot(page, "02-after-create");
    console.log("  URL:", page.url());

    // If still on /nouveau, project creation might need more time or the project was created but we need to navigate
    if (page.url().includes("/nouveau")) {
      console.log("  Still on /nouveau, checking if project was created...");
      // Go to mes projets and pick the latest
      await page.goto(`${BASE_URL}/mes-projets`, { timeout: 15000, waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3000);
      await screenshot(page, "02b-mes-projets");

      // Click the first project link
      const projectLinks = page.locator("a[href*='/projet/']");
      const linkCount = await projectLinks.count();
      console.log(`  Found ${linkCount} project links`);
      if (linkCount > 0) {
        const firstHref = await projectLinks.first().getAttribute("href");
        console.log(`  First project href: ${firstHref}`);
        await projectLinks.first().click();
        await page.waitForTimeout(5000);
        console.log(`  Navigated to: ${page.url()}`);
      }
    }

    await screenshot(page, "03-project-page");
    console.log("  Project URL:", page.url());

    // ========== DETECT CURRENT STEP & NAVIGATE ==========
    // The workflow has steps shown as circles at the top. Let's read the step indicator.
    const bodyText = await page.locator("body").textContent().catch(() => "");

    // Check which step we're on
    const stepPatterns = [
      /[ÉéEe]tape\s*(\d)/i,
      /Step\s*(\d)/i,
      /(\d)\s*\/\s*8/,
    ];
    for (const pat of stepPatterns) {
      const match = bodyText.match(pat);
      if (match) { console.log(`  Detected step: ${match[0]}`); break; }
    }

    // ========== ADVANCE THROUGH STEPS ==========
    const advanceLabels = ["Valider", "Suivant", "Confirmer", "Continuer"];

    async function tryAdvance(stepName) {
      // Also try clicking enabled primary-looking buttons
      for (const label of advanceLabels) {
        try {
          const btn = page.locator(`button:has-text('${label}')`).first();
          if (await btn.isVisible({ timeout: 2000 })) {
            const disabled = await btn.getAttribute("disabled");
            if (disabled === null) {
              await btn.click();
              console.log(`  ${stepName}: clicked '${label}'`);
              return true;
            } else {
              console.log(`  ${stepName}: '${label}' is disabled`);
            }
          }
        } catch {}
      }
      // Try the green/primary button
      try {
        const primaryBtn = page.locator("button.bg-sage, button.bg-green, button[class*='primary'], button[class*='sage']").first();
        if (await primaryBtn.isVisible({ timeout: 1000 })) {
          const text = await primaryBtn.textContent();
          await primaryBtn.click();
          console.log(`  ${stepName}: clicked primary button '${text}'`);
          return true;
        }
      } catch {}
      console.log(`  ${stepName}: no advance button found`);
      return false;
    }

    // Advance through steps 1-3 quickly
    console.log("\n=== STEPS 1-3: ADVANCE ===");
    for (let s = 1; s <= 5; s++) {
      await page.waitForTimeout(2000);
      const url = page.url();
      // Extract step from URL if possible
      const stepFromUrl = url.match(/etape[=-]?(\d)/i) || url.match(/step[=-]?(\d)/i);
      const currentStep = stepFromUrl ? parseInt(stepFromUrl[1]) : s;
      console.log(`  Attempt ${s}, URL: ${url}, step: ${currentStep}`);

      if (currentStep >= 4) {
        console.log("  Reached step 4+, stopping early advance");
        break;
      }

      await tryAdvance(`Step ${s}`);
      await page.waitForTimeout(3000);
    }

    // ========== STEP 4: VALIDATION ==========
    console.log("\n=== STEP 4: VALIDATION ===");
    await page.waitForTimeout(2000);
    await screenshot(page, "04-step4");
    console.log("  URL:", page.url());

    // List all visible buttons for debugging
    const allButtons = page.locator("button");
    const btnCount = await allButtons.count();
    console.log(`  Visible buttons (${btnCount}):`);
    for (let i = 0; i < Math.min(btnCount, 10); i++) {
      try {
        const btn = allButtons.nth(i);
        if (await btn.isVisible({ timeout: 200 })) {
          const text = (await btn.textContent()).trim().substring(0, 50);
          if (text) console.log(`    [${i}] '${text}'`);
        }
      } catch {}
    }

    await tryAdvance("Step 4");
    await page.waitForTimeout(5000);
    await screenshot(page, "04-step4-after");

    // ========== STEP 5: QUALIFICATION ==========
    console.log("\n=== STEP 5: QUALIFICATION ===");
    await page.waitForTimeout(2000);
    await screenshot(page, "05-step5");
    console.log("  URL:", page.url());

    // Fill selects
    const selects = page.locator("select");
    const selectCount = await selects.count();
    console.log(`  Selects: ${selectCount}`);
    for (let i = 0; i < selectCount; i++) {
      try {
        const sel = selects.nth(i);
        const opts = await sel.locator("option").allTextContents();
        if (opts.length > 1) {
          await sel.selectOption({ index: 1 });
          console.log(`  Select ${i} -> '${opts[1]}'`);
        }
      } catch {}
    }

    // Fill text/number inputs
    const inputs5 = page.locator("input:not([type='file']):not([type='hidden']):not([type='radio']):not([type='checkbox']), textarea");
    const inputCount5 = await inputs5.count();
    console.log(`  Inputs: ${inputCount5}`);
    for (let i = 0; i < inputCount5; i++) {
      try {
        const inp = inputs5.nth(i);
        if (await inp.isVisible({ timeout: 300 })) {
          const val = await inp.inputValue();
          if (!val) {
            await inp.fill("85");
            console.log(`  Input ${i} filled`);
          }
        }
      } catch {}
    }

    await screenshot(page, "05-step5-filled");
    await tryAdvance("Step 5");
    await page.waitForTimeout(5000);
    await screenshot(page, "05-step5-after");

    // ========== STEP 6: RECOMMANDATIONS ==========
    console.log("\n=== STEP 6: RECOMMANDATIONS ===");
    await page.waitForTimeout(2000);
    await screenshot(page, "06-step6");
    console.log("  URL:", page.url());

    // List buttons again
    const btns6 = page.locator("button");
    const btnCount6 = await btns6.count();
    for (let i = 0; i < Math.min(btnCount6, 10); i++) {
      try {
        const btn = btns6.nth(i);
        if (await btn.isVisible({ timeout: 200 })) {
          const text = (await btn.textContent()).trim().substring(0, 50);
          if (text) console.log(`  Button: '${text}'`);
        }
      } catch {}
    }

    // Try "Passer et generer" variants
    const step6Labels = ["Passer et générer", "Passer et generer", "Générer", "Passer", "Ignorer"];
    let clicked6 = false;
    for (const label of step6Labels) {
      try {
        const btn = page.locator(`button:has-text('${label}')`).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          console.log(`  Step 6: clicked '${label}'`);
          clicked6 = true;
          break;
        }
      } catch {}
    }
    if (!clicked6) await tryAdvance("Step 6");
    await page.waitForTimeout(5000);
    await screenshot(page, "06-step6-after");

    // ========== STEP 7: GENERATION ==========
    console.log("\n=== STEP 7: GENERATION ===");
    await screenshot(page, "07-step7-start");
    console.log("  URL:", page.url());
    console.log("  Waiting for generation (max 90s)...");

    let genDone = false;
    for (let i = 0; i < 18; i++) {
      await page.waitForTimeout(5000);
      const bt = await page.locator("body").textContent().catch(() => "");
      if (bt.includes("Terminé") || bt.includes("terminé") ||
          bt.includes("Télécharger") || bt.includes("Félicitations") || bt.includes("prêt")) {
        genDone = true;
        console.log(`  Generation done after ~${(i + 1) * 5}s`);
        break;
      }
      const prog = bt.match(/(\d+)\s*%/) || bt.match(/(\d+)\s*\/\s*(\d+)/);
      if (prog) console.log(`  Progress: ${prog[0]}`);
      if (i % 3 === 2) await screenshot(page, `07-step7-progress-${i}`);
    }
    await screenshot(page, "08-step7-done");

    // Advance to step 8
    for (const label of ["Voir le dossier", "Dossier", "Voir", "Terminer", "Suivant"]) {
      try {
        const btn = page.locator(`button:has-text('${label}'), a:has-text('${label}')`).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          console.log(`  -> Step 8: clicked '${label}'`);
          break;
        }
      } catch {}
    }
    await page.waitForTimeout(5000);

    // ========== STEP 8: DOSSIER ==========
    console.log("\n=== STEP 8: DOSSIER ===");
    await screenshot(page, "09-step8");
    console.log("  URL:", page.url());

    console.log("\n=== ALL DONE ===");

  } catch (err) {
    console.error("\n[FATAL]", err.message);
    await screenshot(page, "99-error").catch(() => {});
  } finally {
    await browser.close();
  }
})();
