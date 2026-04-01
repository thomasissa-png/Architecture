/**
 * Server-side PDF generation using Puppeteer + @sparticuz/chromium.
 *
 * Renders the /dossier/[uuid] page in a headless browser and exports as PDF.
 * The result looks identical to the web page (same fonts, layout, images).
 *
 * Called after dossier generation completes — the PDF is stored in Object Storage
 * and linked via pdf_storage_key in the dossiers table.
 */

import { saveImage } from "@/lib/db";

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
      defaultViewport: chromium.default.defaultViewport,
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

    // Generate PDF with print media
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "10mm",
        bottom: "15mm",
        left: "10mm",
      },
      preferCSSPageSize: true,
    });

    // Save to Object Storage
    const storageKey = `dossiers/${uuid}/dossier.pdf`;
    await saveImage(Buffer.from(pdfBuffer), storageKey);

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
