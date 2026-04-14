/**
 * Production visual test — screenshots de chaque page du parcours marchand.
 */
import { test } from "@playwright/test";
import path from "path";

const BASE = "https://versimo.fr";
const DIR = path.join(__dirname, "../../test-screenshots/prod");

test.use({
  ignoreHTTPSErrors: true,
  navigationTimeout: 30000,
  actionTimeout: 10000,
});

test.describe("Prod screenshots", () => {
  test.setTimeout(60_000);

  test("Homepage", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/homepage.png`, fullPage: true });
    console.log("✅ Homepage");
  });

  test("Page marchand", async ({ page }) => {
    await page.goto(`${BASE}/marchand`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/marchand.png`, fullPage: true });
    console.log("✅ Marchand");
  });

  test("Nouveau projet", async ({ page }) => {
    await page.goto(`${BASE}/projet/nouveau`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${DIR}/nouveau-projet.png`, fullPage: true });
    console.log(`✅ Nouveau projet — URL: ${page.url()}`);
  });

  test("Nouveau projet — remplir et uploader", async ({ page }) => {
    await page.goto(`${BASE}/projet/nouveau`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    // Remplir adresse
    const inputs = await page.locator("input[type='text']").all();
    if (inputs.length > 0) {
      await inputs[0].fill("12 rue des Muguets, 59000 Lille");
      await page.waitForTimeout(500);
    }

    // Type = Immeuble
    const selects = await page.locator("select").all();
    if (selects.length > 0) {
      try { await selects[0].selectOption("immeuble"); } catch { /* */ }
    }

    // Upload plans
    const fileInputs = await page.locator("input[type='file']").all();
    for (const fi of fileInputs) {
      try {
        await fi.setInputFiles([
          path.join(__dirname, "../../P 00 - Pr2_plan RDC_ projet2.pdf"),
          path.join(__dirname, "../../P 01 - Pr2_plan R+1_ projet2.pdf"),
        ]);
        await page.waitForTimeout(2000);
        break;
      } catch { /* */ }
    }

    await page.screenshot({ path: `${DIR}/nouveau-filled.png`, fullPage: true });

    // Chercher le bouton submit
    const buttons = await page.locator("button").all();
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => "");
      const disabled = await btn.isDisabled().catch(() => true);
      if (text) console.log(`  Button: "${text.trim().substring(0, 40)}" — disabled=${disabled}`);
    }
  });

  test("Mes projets", async ({ page }) => {
    await page.goto(`${BASE}/mes-projets`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${DIR}/mes-projets.png`, fullPage: true });
    console.log(`✅ Mes projets — URL: ${page.url()}`);
  });
});
