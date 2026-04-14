/**
 * Production workflow test — Parcours marchand complet sur versimo.fr
 * Teste chaque étape avec les vrais plans et photos du repo.
 */

import { test, expect } from "@playwright/test";
import path from "path";

const BASE_URL = "https://versimo.fr";
const SCREENSHOT_DIR = path.join(__dirname, "../../test-screenshots/prod");

const PLANS = [
  path.join(__dirname, "../../P 00 - Pr2_plan RDC_ projet2.pdf"),
  path.join(__dirname, "../../P 01 - Pr2_plan R+1_ projet2.pdf"),
  path.join(__dirname, "../../P 02 - Pr2_plan R+2_ projet2.pdf"),
  path.join(__dirname, "../../P 03 - Pr02_plan R+3_ projet02.pdf"),
];

test.describe("Production — Parcours marchand", () => {
  test.setTimeout(120_000);

  test("Étape 1 — Page marchand + navigation vers nouveau projet", async ({ page }) => {
    await page.goto(`${BASE_URL}/marchand`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-marchand-landing.png`, fullPage: true });

    // Chercher le CTA pour créer un projet
    const ctaButton = page.locator("a[href*='projet'], button:has-text('projet'), a:has-text('Commencer'), button:has-text('Commencer'), a:has-text('Essayer'), button:has-text('Essayer')").first();
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `${SCREENSHOT_DIR}/01b-after-cta-click.png`, fullPage: true });
      console.log(`✅ Navigué vers: ${page.url()}`);
    } else {
      console.log("⚠️ Pas de CTA trouvé sur /marchand");
      await page.goto(`${BASE_URL}/projet/nouveau`);
      await page.waitForLoadState("networkidle");
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01c-nouveau-projet.png`, fullPage: true });
  });

  test("Étape 1 — Upload 4 plans", async ({ page }) => {
    await page.goto(`${BASE_URL}/projet/nouveau`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-upload-empty.png`, fullPage: true });

    // Remplir adresse
    const addressInput = page.locator("input[type='text']").first();
    await addressInput.fill("12 rue des Muguets, 59000 Lille");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02b-address.png` });

    // Sélectionner Immeuble
    const typeSelect = page.locator("select").first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("immeuble");
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02c-type-immeuble.png` });
    }

    // Upload les 4 plans
    const fileInput = page.locator("input[type='file']");
    const inputs = await fileInput.all();
    for (const input of inputs) {
      try {
        await input.setInputFiles(PLANS);
        await page.waitForTimeout(2000);
        break; // Premier input qui marche
      } catch {
        continue;
      }
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02d-plans-uploaded.png`, fullPage: true });

    // Cliquer "Créer le projet"
    const submitButton = page.locator("button:has-text('Créer'), button:has-text('créer'), button:has-text('Commencer')").first();
    if (await submitButton.isVisible() && await submitButton.isEnabled()) {
      console.log("✅ Bouton submit trouvé et actif");
      await submitButton.click();
      await page.waitForTimeout(5000); // Attendre upload + redirect
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02e-after-submit.png`, fullPage: true });
      console.log(`✅ Après submit, URL: ${page.url()}`);
    } else {
      console.log("⚠️ Bouton submit non trouvé ou désactivé");
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02e-submit-disabled.png`, fullPage: true });
    }
  });

  test("Vérification page découpe si accessible", async ({ page }) => {
    // Essayer d'accéder à la dernière page de découpe connue
    await page.goto(`${BASE_URL}/mes-projets`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-mes-projets.png`, fullPage: true });
    console.log(`✅ Mes projets URL: ${page.url()}`);
  });
});
