/**
 * Server-side PDF generation using Puppeteer + @sparticuz/chromium.
 *
 * Renders the /dossier/[uuid] page in a headless browser and exports as PDF.
 * The result looks identical to the web page (same fonts, layout, images).
 *
 * Called after dossier generation completes — the PDF is stored in Object Storage
 * and linked via pdf_storage_key in the dossiers table.
 */

import { saveRawBuffer } from "@/lib/db";

const BASE_URL = process.env.NEXTAUTH_URL
  || process.env.NEXT_PUBLIC_BASE_URL
  || "https://versimo.fr";

/**
 * Generate a PDF from the dossier web page and save it to Object Storage.
 * Returns the storage key for the PDF file.
 */
export async function generateDossierPdf(
  uuid: string,
  slug?: string | null,
): Promise<string | null> {
  let browser = null;

  try {
    // Dynamic imports to avoid bundling issues
    const puppeteer = await import("puppeteer-core");
    const chromium = await import("@sparticuz/chromium");

    // @sparticuz/chromium provides a pre-built Chromium binary for serverless
    const executablePath = await chromium.default.executablePath();

    browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // Set viewport to desktop for clean rendering
    await page.setViewport({ width: 1280, height: 900 });

    // Navigate to the dossier page
    const dossierPath = slug || uuid;
    const url = `${BASE_URL}/dossier/${dossierPath}`;
    console.log(`[PDF] Navigating to ${url}`);

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60_000,
    });

    // Wait for images to load
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        }),
      );
    });

    // Small delay for any final rendering
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Force screen media type — render the beautiful web page, not the @media print view
    await page.emulateMediaType("screen");

    // Hide interactive/navigation elements that shouldn't appear in the PDF
    await page.evaluate(() => {
      // Hide header
      const header = document.querySelector("header");
      if (header) (header as HTMLElement).style.display = "none";
      // Hide sticky contact bar
      const sticky = document.querySelector(".fixed.bottom-0");
      if (sticky) (sticky as HTMLElement).style.display = "none";
      // Hide PDF download button
      const pdfBtn = document.querySelector("[data-testid='dossier-print-pdf']");
      if (pdfBtn) (pdfBtn as HTMLElement).style.display = "none";
      // Hide share buttons (no-print elements)
      document.querySelectorAll(".no-print").forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });
      // Hide the "Modifier" link (owner-only)
      const editLink = document.querySelector("a[href*='/mes-biens/']");
      if (editLink) (editLink as HTMLElement).style.display = "none";
      // Make main visible (it has no-print class)
      const main = document.querySelector("main.no-print");
      if (main) (main as HTMLElement).style.display = "block";
      // Hide DossierPrintView (we use the web view now)
      const printView = document.querySelector(".print-only");
      if (printView) (printView as HTMLElement).style.display = "none";
    });

    // Generate PDF from the screen-rendered web page
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: "10mm",
        right: "8mm",
        bottom: "12mm",
        left: "8mm",
      },
    });

    // Save to Object Storage
    const storageKey = `dossiers/${uuid}/dossier.pdf`;
    await saveRawBuffer(Buffer.from(pdfBuffer), storageKey);

    console.log(`[PDF] Generated and saved: ${storageKey} (${Math.round(pdfBuffer.byteLength / 1024)}KB)`);
    return storageKey;

  } catch (err) {
    console.error(`[PDF] Generation failed for dossier ${uuid}:`, err instanceof Error ? err.message : err);
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}
