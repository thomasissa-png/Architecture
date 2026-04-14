const { chromium } = require("playwright");
const path = require("path");

const SCREENSHOTS_DIR = path.resolve(__dirname, "../../test-screenshots/workflow");
const BASE_URL = "http://localhost:3000";

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true });
  console.log(`[SCREENSHOT] ${name}.png saved`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // ========== LOGIN ==========
    console.log("\n=== STEP: LOGIN ===");
    await page.goto(BASE_URL, { timeout: 15000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await page.locator("button:has-text('Se connecter')").first().click();
    await page.waitForTimeout(1500);
    const modal = page.locator("[role='dialog']");
    await modal.locator("input[type='email']").fill("thomas@versi.fr");
    await modal.locator("input[type='password']").fill("allezpsg");
    await modal.locator("button[type='submit']").click();
    await page.waitForTimeout(3000);
    await screenshot(page, "00-after-login");
    console.log("[OK] Login done");

    // ========== CREATE PROJECT ==========
    console.log("\n=== STEP: CREATE PROJECT ===");
    await page.goto(`${BASE_URL}/projet/nouveau`, { timeout: 15000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await screenshot(page, "01-new-project-page");

    await page.locator("input[type='text']").first().fill("Test Workflow E2E");
    try { await page.locator("select").first().selectOption("immeuble"); } catch (e) { console.log("[WARN] select option failed:", e.message); }
    await page.locator("input[type='file']").first().setInputFiles(["/tmp/plan_preview-1.png", "/tmp/plan_r1-1.png"]);
    await page.waitForTimeout(1500);
    await page.locator("button:has-text('Créer le projet')").click();
    await page.waitForTimeout(5000);
    await screenshot(page, "02-after-create-project");
    console.log("[OK] Project created, URL:", page.url());

    // ========== STEP 1 → STEP 3 (rapid pass-through) ==========
    console.log("\n=== STEPS 1-3: RAPID PASS-THROUGH ===");

    // Step 1: detect and confirm
    await page.waitForTimeout(2000);
    await screenshot(page, "03-step1");
    // Try clicking next/validate/confirm buttons
    const step1Btns = ["Valider", "Suivant", "Confirmer", "Continuer"];
    for (const label of step1Btns) {
      try {
        const btn = page.locator(`button:has-text('${label}')`).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          console.log(`[OK] Step 1: clicked '${label}'`);
          break;
        }
      } catch {}
    }
    await page.waitForTimeout(3000);
    await screenshot(page, "04-step2");

    // Step 2: confirm
    for (const label of step1Btns) {
      try {
        const btn = page.locator(`button:has-text('${label}')`).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          console.log(`[OK] Step 2: clicked '${label}'`);
          break;
        }
      } catch {}
    }
    await page.waitForTimeout(3000);
    await screenshot(page, "05-step3");

    // Step 3: confirm
    for (const label of step1Btns) {
      try {
        const btn = page.locator(`button:has-text('${label}')`).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          console.log(`[OK] Step 3: clicked '${label}'`);
          break;
        }
      } catch {}
    }
    await page.waitForTimeout(3000);

    // ========== STEP 4: VALIDATION ==========
    console.log("\n=== STEP 4: VALIDATION ===");
    await screenshot(page, "06-step4-validation");
    console.log("[STEP4] URL:", page.url());

    // Look for surfaces or validation content
    const step4Text = await page.locator("main, [class*='step'], [class*='content']").first().textContent().catch(() => "");
    console.log("[STEP4] Page text preview:", step4Text?.substring(0, 200));

    // Try to validate
    for (const label of ["Valider", "Valider les surfaces", "Confirmer", "Suivant", "Continuer"]) {
      try {
        const btn = page.locator(`button:has-text('${label}')`).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          console.log(`[OK] Step 4: clicked '${label}'`);
          break;
        }
      } catch {}
    }
    await page.waitForTimeout(3000);

    // ========== STEP 5: QUALIFICATION ==========
    console.log("\n=== STEP 5: QUALIFICATION ===");
    await screenshot(page, "07-step5-qualification");
    console.log("[STEP5] URL:", page.url());

    // Fill any selects on the page
    const selects = page.locator("select");
    const selectCount = await selects.count();
    console.log(`[STEP5] Found ${selectCount} select elements`);
    for (let i = 0; i < selectCount; i++) {
      try {
        const sel = selects.nth(i);
        const options = await sel.locator("option").allTextContents();
        console.log(`[STEP5] Select ${i}: options = ${JSON.stringify(options.slice(0, 5))}`);
        // Pick the second option (first is usually placeholder)
        if (options.length > 1) {
          await sel.selectOption({ index: 1 });
          console.log(`[STEP5] Select ${i}: selected index 1`);
        }
      } catch (e) { console.log(`[STEP5] Select ${i} failed:`, e.message); }
    }
    await page.waitForTimeout(1000);

    // Fill any text inputs too
    const inputs = page.locator("input[type='text'], input[type='number'], textarea");
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      try {
        const inp = inputs.nth(i);
        if (await inp.isVisible({ timeout: 500 })) {
          const val = await inp.inputValue();
          if (!val) {
            const placeholder = await inp.getAttribute("placeholder") || "";
            if (placeholder.toLowerCase().includes("prix") || placeholder.toLowerCase().includes("budget")) {
              await inp.fill("350000");
            } else if (placeholder.toLowerCase().includes("surface") || placeholder.toLowerCase().includes("m2")) {
              await inp.fill("85");
            } else {
              await inp.fill("Test value");
            }
            console.log(`[STEP5] Filled input ${i} (placeholder: ${placeholder})`);
          }
        }
      } catch {}
    }

    await screenshot(page, "08-step5-filled");

    // Validate step 5
    for (const label of ["Valider", "Confirmer", "Suivant", "Continuer", "Valider la qualification"]) {
      try {
        const btn = page.locator(`button:has-text('${label}')`).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          console.log(`[OK] Step 5: clicked '${label}'`);
          break;
        }
      } catch {}
    }
    await page.waitForTimeout(3000);

    // ========== STEP 6: RECOMMENDATIONS ==========
    console.log("\n=== STEP 6: RECOMMENDATIONS ===");
    await screenshot(page, "09-step6-recommendations");
    console.log("[STEP6] URL:", page.url());

    // Try "Passer et generer" or similar
    for (const label of ["Passer et générer", "Passer et generer", "Générer", "Generer", "Passer", "Suivant", "Continuer"]) {
      try {
        const btn = page.locator(`button:has-text('${label}')`).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          console.log(`[OK] Step 6: clicked '${label}'`);
          break;
        }
      } catch {}
    }
    await page.waitForTimeout(3000);

    // ========== STEP 7: GENERATION ==========
    console.log("\n=== STEP 7: GENERATION ===");
    await screenshot(page, "10-step7-generation-start");
    console.log("[STEP7] URL:", page.url());

    // Wait for generation to complete (max 60s)
    console.log("[STEP7] Waiting for generation results...");
    let generationDone = false;
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(5000);
      // Check for completion indicators
      const bodyText = await page.locator("body").textContent().catch(() => "");
      if (bodyText.includes("Dossier") || bodyText.includes("Terminé") || bodyText.includes("terminé") ||
          bodyText.includes("Résultat") || bodyText.includes("Télécharger") || bodyText.includes("dossier")) {
        generationDone = true;
        console.log(`[STEP7] Generation completed after ${(i + 1) * 5}s`);
        break;
      }
      // Check for progress indicators
      const progress = bodyText.match(/(\d+)%/) || bodyText.match(/(\d+)\/(\d+)/);
      if (progress) {
        console.log(`[STEP7] Progress: ${progress[0]}`);
      }
      await screenshot(page, `11-step7-progress-${i}`);
    }

    if (!generationDone) {
      console.log("[STEP7] Generation timeout (60s) - taking final screenshot");
    }
    await screenshot(page, "12-step7-generation-done");

    // Try clicking to go to step 8
    for (const label of ["Voir le dossier", "Dossier", "Suivant", "Continuer", "Voir"]) {
      try {
        const btn = page.locator(`button:has-text('${label}'), a:has-text('${label}')`).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          console.log(`[OK] Step 7→8: clicked '${label}'`);
          break;
        }
      } catch {}
    }
    await page.waitForTimeout(3000);

    // ========== STEP 8: DOSSIER ==========
    console.log("\n=== STEP 8: DOSSIER ===");
    await screenshot(page, "13-step8-dossier");
    console.log("[STEP8] URL:", page.url());

    const step8Text = await page.locator("main, body").first().textContent().catch(() => "");
    console.log("[STEP8] Page text preview:", step8Text?.substring(0, 300));

    console.log("\n=== ALL STEPS COMPLETE ===");

  } catch (err) {
    console.error("\n[FATAL ERROR]", err.message);
    await screenshot(page, "99-error");
  } finally {
    await browser.close();
  }
})();
