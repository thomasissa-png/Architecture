/**
 * Full workflow test — Login → Upload → Découpe → Extraction
 * Takes screenshots at every step for visual verification.
 */
const { chromium } = require("playwright");
const path = require("path");

const DIR = "test-screenshots/workflow";
const BASE = "http://localhost:3000";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function screenshot(page, name) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  console.log(`  📸 ${name}.png`);
}

async function run() {
  const fs = require("fs");
  fs.mkdirSync(DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // ═══════════════════════════════════════════════════════════
  // STEP 0: LOGIN
  // ═══════════════════════════════════════════════════════════
  console.log("\n══ STEP 0: LOGIN ══");
  await page.goto(`${BASE}/projet/nouveau`, { timeout: 15000, waitUntil: "domcontentloaded" });
  await sleep(3000);

  // Fill form first (so CTA is enabled)
  await page.locator("input[type='text']").first().fill("12 rue des Muguets, 59000 Lille");
  try { await page.locator("select").first().selectOption("immeuble"); } catch {}
  await page.locator("input[type='file']").first().setInputFiles([
    "/tmp/plan_preview-1.png",
    "/tmp/plan_r1-1.png",
  ]);
  await sleep(2000);

  // Click CTA → opens auth modal
  await page.locator("button:has-text('connecter')").last().click();
  await sleep(2000);

  // Fill auth in modal
  const modal = page.locator("[role='dialog']");
  await modal.locator("input[type='email']").fill("thomas@versi.fr");
  await modal.locator("input[type='password']").fill("allezpsg");
  await modal.locator("button[type='submit']").click();
  await sleep(4000);

  const cookies = await context.cookies();
  const hasSession = cookies.some(c => c.name.includes("session"));
  console.log("  Session:", hasSession ? "✅" : "❌");
  if (!hasSession) { console.log("LOGIN FAILED"); await browser.close(); return; }

  // ═══════════════════════════════════════════════════════════
  // STEP 1: UPLOAD
  // ═══════════════════════════════════════════════════════════
  console.log("\n══ STEP 1: UPLOAD ══");
  await page.goto(`${BASE}/projet/nouveau`, { timeout: 15000, waitUntil: "domcontentloaded" });
  await sleep(3000);
  await screenshot(page, "01-upload-empty");

  // Fill form
  await page.locator("input[type='text']").first().fill("12 rue des Muguets, 59000 Lille");
  try { await page.locator("select").first().selectOption("immeuble"); } catch {}
  await page.locator("input[type='file']").first().setInputFiles([
    "/tmp/plan_preview-1.png",
    "/tmp/plan_r1-1.png",
  ]);
  await sleep(2000);
  await screenshot(page, "01-upload-filled");

  // Submit
  const createBtn = page.locator("button:has-text('Créer le projet')");
  if (await createBtn.isDisabled()) {
    console.log("  ❌ Create button disabled");
    await browser.close(); return;
  }

  await createBtn.click();
  console.log("  ⏳ Creating project...");

  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    if (page.url().includes("/decoupe")) break;
  }

  console.log("  URL:", page.url());
  if (!page.url().includes("/decoupe")) {
    console.log("  ❌ Not redirected to decoupe");
    await screenshot(page, "01-error");
    await browser.close(); return;
  }
  console.log("  ✅ Redirected to decoupe");

  // ═══════════════════════════════════════════════════════════
  // STEP 2: DECOUPE
  // ═══════════════════════════════════════════════════════════
  console.log("\n══ STEP 2: DECOUPE ══");
  await screenshot(page, "02-decoupe-loading");

  // Wait for lot detection (AI or fallback)
  console.log("  ⏳ Waiting for lot detection...");
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const body = await page.textContent("body");
    if (body.includes("Confirmer") && !body.includes("Chargement")) break;
  }
  await sleep(2000);
  await screenshot(page, "02-decoupe-ready");

  // UX Analysis
  const svgZones = await page.locator("svg polygon, svg rect").all();
  console.log("  SVG zones visible:", svgZones.length);

  const hasRedessiner = await page.locator("button:has-text('Redessiner'), button:has-text('Dessiner')").first().isVisible().catch(() => false);
  console.log("  Bouton Dessiner/Redessiner:", hasRedessiner ? "✅" : "❌");

  const hasConfirmer = await page.locator("button:has-text('Confirmer')").isVisible().catch(() => false);
  console.log("  Bouton Confirmer:", hasConfirmer ? "✅" : "❌");

  // Check for UX issues
  const bodyText = await page.textContent("body");
  console.log("  Mentions 'pièce':", bodyText.includes("pièce") || bodyText.includes("piece") ? "⚠️ OUI (pas logique étape 2)" : "✅ NON");

  // Click "Confirmer et continuer"
  if (hasConfirmer) {
    await page.locator("button:has-text('Confirmer')").click();
    console.log("  ⏳ Saving lots...");

    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      if (page.url().includes("/extraction")) break;
    }

    console.log("  URL:", page.url());
    if (page.url().includes("/extraction")) {
      console.log("  ✅ Redirected to extraction");
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 3: EXTRACTION
  // ═══════════════════════════════════════════════════════════
  if (page.url().includes("/extraction")) {
    console.log("\n══ STEP 3: EXTRACTION ══");
    await screenshot(page, "03-extraction-start");

    // Wait for extraction (AI call — can take 30-60s)
    console.log("  ⏳ Waiting for AI extraction (up to 90s)...");
    let extractionDone = false;
    for (let i = 0; i < 90; i++) {
      await sleep(1000);
      const body = await page.textContent("body");
      if (body.includes("Valider et continuer") || body.includes("pièce détectée") || body.includes("m²")) {
        extractionDone = true;
        console.log("  Extraction complete at", i, "seconds");
        break;
      }
      if (body.includes("erreur") || body.includes("Erreur") || body.includes("échoué")) {
        console.log("  ❌ Extraction error at", i, "seconds");
        await screenshot(page, "03-extraction-error");
        break;
      }
      if (i % 10 === 0) console.log("    ...", i, "s");
    }

    await sleep(2000);
    await screenshot(page, "03-extraction-result");

    if (extractionDone) {
      // UX Analysis
      const rooms = await page.locator("[class*='room'], [data-testid*='room']").all();
      console.log("  Rooms detected:", rooms.length);

      // Check lot zones visible
      const lotZones = await page.locator("svg polygon, svg rect").all();
      console.log("  Lot zones visible:", lotZones.length);

      // Check room names
      const roomTexts = await page.locator("input[value], span:has-text('m²')").allTextContents();
      console.log("  Room data visible:", roomTexts.slice(0, 5).join(", "));

      // Check surface values
      const surfaceInputs = await page.locator("input[type='number']").all();
      console.log("  Surface inputs:", surfaceInputs.length);

      await screenshot(page, "03-extraction-final");
      console.log("  ✅ Extraction step complete");
    }
  }

  await browser.close();
  console.log("\n══ WORKFLOW TEST DONE ══");
}

run().catch(e => console.error("FATAL:", e.message));
