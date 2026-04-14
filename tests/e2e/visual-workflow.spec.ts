/**
 * Visual workflow test — Parcours marchand complet avec screenshots.
 *
 * Teste chaque étape du workflow avec les vrais plans et photos du repo.
 * Prend des screenshots à chaque action pour vérification visuelle.
 *
 * Usage: npx playwright test tests/visual/workflow-test.ts --project=chromium
 */

import { test, expect } from "@playwright/test";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.join(__dirname, "../../test-screenshots");

// Test files from the repo root
const PLANS = [
  path.join(__dirname, "../../P 00 - Pr2_plan RDC_ projet2.pdf"),
  path.join(__dirname, "../../P 01 - Pr2_plan R+1_ projet2.pdf"),
  path.join(__dirname, "../../P 02 - Pr2_plan R+2_ projet2.pdf"),
  path.join(__dirname, "../../P 03 - Pr02_plan R+3_ projet02.pdf"),
];

const PHOTOS = [
  path.join(__dirname, "../../DSC05154.JPG"),
  path.join(__dirname, "../../DSC05155.JPG"),
  path.join(__dirname, "../../DSC05156.JPG"),
  path.join(__dirname, "../../DSC05157.JPG"),
  path.join(__dirname, "../../DSC05158.JPG"),
];

test.describe("Parcours marchand — test visuel complet", () => {
  test.setTimeout(300_000); // 5 minutes max

  test("Étape 1 — Page /projet/nouveau se charge correctement", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/nouveau`);
    await page.waitForLoadState("networkidle");

    // Screenshot de la page d'upload
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-upload-page.png`,
      fullPage: true
    });

    // Vérifier que les éléments clés sont présents
    await expect(page.locator("h1")).toContainText("Nouveau bien");

    // Vérifier le stepper (étape 1 active)
    const stepperText = await page.locator("[aria-current='step']").textContent();
    expect(stepperText).toContain("Projet");

    // Vérifier les champs du formulaire
    await expect(page.locator("input[placeholder*='adresse'], input[placeholder*='Adresse'], input[aria-label*='adresse'], input[type='text']").first()).toBeVisible();

    console.log("✅ Étape 1: Page upload chargée correctement");
  });

  test("Étape 1 — Upload de 4 plans PDF", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/nouveau`);
    await page.waitForLoadState("networkidle");

    // Remplir l'adresse
    const addressInput = page.locator("input[type='text']").first();
    await addressInput.fill("12 rue des Muguets, 59000 Lille");

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01b-address-filled.png` });

    // Sélectionner type de bien = Immeuble
    const typeSelect = page.locator("select").first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("immeuble");
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01c-type-selected.png` });

    // Upload les 4 plans
    const fileInput = page.locator("input[type='file']").first();
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(PLANS);
      await page.waitForTimeout(2000); // Attendre les previews
      await page.screenshot({ path: `${SCREENSHOT_DIR}/01d-plans-uploaded.png`, fullPage: true });
      console.log("✅ Étape 1: 4 plans uploadés");
    } else {
      console.log("⚠️ Input file non trouvé");
    }
  });

  test("Page /marchand accessible", async ({ page }) => {
    await page.goto(`${BASE_URL}/marchand`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/00-marchand-landing.png`, fullPage: true });
    console.log("✅ Page marchand chargée");
  });

  test("Page /mes-projets accessible", async ({ page }) => {
    await page.goto(`${BASE_URL}/mes-projets`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/00-mes-projets.png`, fullPage: true });
    console.log("✅ Page mes-projets chargée");
  });

  test("Homepage se charge", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/00-homepage.png`, fullPage: true });

    // Vérifier le titre
    const title = await page.title();
    console.log(`✅ Homepage chargée — titre: "${title}"`);
  });

  test("Vérification visuelle des composants UI", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/nouveau`);
    await page.waitForLoadState("networkidle");

    // Screenshot mobile (iPhone 15 Pro)
    await page.setViewportSize({ width: 393, height: 852 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01e-upload-mobile.png`, fullPage: true });

    // Screenshot tablette (iPad)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01f-upload-tablet.png`, fullPage: true });

    // Screenshot desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01g-upload-desktop.png`, fullPage: true });

    console.log("✅ Screenshots responsive: mobile + tablette + desktop");
  });
});
