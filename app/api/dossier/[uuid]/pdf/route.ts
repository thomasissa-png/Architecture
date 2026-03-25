/**
 * F4 — Mode Marchand: PDF generation for dossier.
 *
 * GET /api/dossier/[uuid]/pdf — Generate and download PDF
 *
 * Uses pdf-lib (lightweight, no binary dependencies).
 * Content: cover page + 1 page per photo (before/after side by side).
 * EU AI Act Art. 50: AI disclaimer on every page.
 */

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getImage, saveImage } from "@/lib/db";
import {
  getDossierByUuid,
  getDossierPhotos,
  isDossierExpired,
  getDossierTitle,
  formatPrice,
  formatSurface,
} from "@/lib/dossier";

export const dynamic = "force-dynamic";

// ─── Constants ───────────────────────────────────────────────────────
const PAGE_WIDTH = 842; // A4 landscape width in points
const PAGE_HEIGHT = 595; // A4 landscape height in points
const MARGIN = 40;
const AI_DISCLAIMER = "Visuels générés par intelligence artificielle à titre indicatif — Versiroom";

// ─── Helpers ─────────────────────────────────────────────────────────

async function embedImageFromStorage(
  pdfDoc: PDFDocument,
  storageKey: string
): Promise<Awaited<ReturnType<typeof pdfDoc.embedJpg>> | null> {
  const imageData = await getImage(storageKey);
  if (!imageData) return null;

  try {
    // Try JPEG first (most common)
    return await pdfDoc.embedJpg(imageData);
  } catch {
    try {
      // Fallback to PNG
      return await pdfDoc.embedPng(imageData);
    } catch {
      console.error(`Failed to embed image from key: ${storageKey}`);
      return null;
    }
  }
}

// ─── GET: Generate PDF ───────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  const { uuid } = params;

  const dossier = await getDossierByUuid(uuid);
  if (!dossier) {
    return NextResponse.json(
      { error: "Dossier introuvable." },
      { status: 404 }
    );
  }

  if (isDossierExpired(dossier)) {
    return NextResponse.json(
      { error: "Ce dossier a expiré." },
      { status: 410 }
    );
  }

  const photos = await getDossierPhotos(uuid);
  const completedPhotos = photos.filter((p) => p.status === "completed");

  if (completedPhotos.length === 0) {
    return NextResponse.json(
      { error: "Aucun visuel meublé dans ce dossier." },
      { status: 400 }
    );
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const title = getDossierTitle(dossier);
    const dateStr = new Date(dossier.created_at).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ── Cover Page ─────────────────────────────────────────────────
    const coverPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // Title
    coverPage.drawText(title, {
      x: MARGIN,
      y: PAGE_HEIGHT - 80,
      size: 28,
      font: fontBold,
      color: rgb(0.11, 0.11, 0.12), // #1C1C1E
    });

    // Property details
    let yPos = PAGE_HEIGHT - 130;
    const detailLines: string[] = [];

    if (dossier.bien_adresse) {
      detailLines.push(dossier.bien_adresse);
    }
    if (dossier.bien_type) {
      const typeLabels: Record<string, string> = {
        appartement: "Appartement",
        maison: "Maison",
        loft: "Loft",
        studio: "Studio",
        duplex: "Duplex",
        bureau: "Bureau commercial",
      };
      detailLines.push(typeLabels[dossier.bien_type] || dossier.bien_type);
    }
    if (dossier.bien_surface) {
      detailLines.push(formatSurface(dossier.bien_surface));
    }
    if (dossier.bien_prix) {
      detailLines.push(formatPrice(dossier.bien_prix));
    }

    for (const line of detailLines) {
      coverPage.drawText(line, {
        x: MARGIN,
        y: yPos,
        size: 14,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPos -= 22;
    }

    // Date
    coverPage.drawText(dateStr, {
      x: MARGIN,
      y: yPos - 10,
      size: 11,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Photo count
    coverPage.drawText(
      `${completedPhotos.length} visuel${completedPhotos.length > 1 ? "s" : ""} meublé${completedPhotos.length > 1 ? "s" : ""}`,
      {
        x: MARGIN,
        y: yPos - 35,
        size: 11,
        font,
        color: rgb(0.49, 0.61, 0.46), // sage
      }
    );

    // AI disclaimer on cover
    coverPage.drawText(AI_DISCLAIMER, {
      x: MARGIN,
      y: 30,
      size: 8,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Branding
    coverPage.drawText("Versiroom", {
      x: PAGE_WIDTH - MARGIN - 80,
      y: 30,
      size: 10,
      font: fontBold,
      color: rgb(0.49, 0.61, 0.46),
    });

    // ── Photo Pages (before/after side by side) ────────────────────
    for (const photo of completedPhotos) {
      const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

      // Room label header
      const roomLabel = photo.room_label || `Photo ${photo.photo_index + 1}`;
      page.drawText(roomLabel, {
        x: MARGIN,
        y: PAGE_HEIGHT - 35,
        size: 14,
        font: fontBold,
        color: rgb(0.11, 0.11, 0.12),
      });

      // Image area dimensions (side by side)
      const imgAreaWidth = (PAGE_WIDTH - MARGIN * 3) / 2;
      const imgAreaHeight = PAGE_HEIGHT - 100;
      const imgY = 55;

      // Before image
      if (photo.input_image_key) {
        const beforeImg = await embedImageFromStorage(pdfDoc, photo.input_image_key);
        if (beforeImg) {
          const dims = beforeImg.scaleToFit(imgAreaWidth, imgAreaHeight);
          const xOffset = MARGIN + (imgAreaWidth - dims.width) / 2;
          const yOffset = imgY + (imgAreaHeight - dims.height) / 2;
          page.drawImage(beforeImg, {
            x: xOffset,
            y: yOffset,
            width: dims.width,
            height: dims.height,
          });
        }
      }

      // "Avant home staging" label
      page.drawText("Avant home staging", {
        x: MARGIN + imgAreaWidth / 2 - 40,
        y: imgY - 5,
        size: 8,
        font: fontBold,
        color: rgb(0.5, 0.5, 0.5),
      });

      // After image
      if (photo.output_image_key) {
        const afterImg = await embedImageFromStorage(pdfDoc, photo.output_image_key);
        if (afterImg) {
          const dims = afterImg.scaleToFit(imgAreaWidth, imgAreaHeight);
          const xOffset = MARGIN * 2 + imgAreaWidth + (imgAreaWidth - dims.width) / 2;
          const yOffset = imgY + (imgAreaHeight - dims.height) / 2;
          page.drawImage(afterImg, {
            x: xOffset,
            y: yOffset,
            width: dims.width,
            height: dims.height,
          });
        }
      }

      // "Après home staging" label
      page.drawText("Après home staging", {
        x: MARGIN * 2 + imgAreaWidth + imgAreaWidth / 2 - 40,
        y: imgY - 5,
        size: 8,
        font: fontBold,
        color: rgb(0.49, 0.61, 0.46),
      });

      // Separator line between images
      page.drawLine({
        start: { x: MARGIN + imgAreaWidth + MARGIN / 2, y: imgY },
        end: { x: MARGIN + imgAreaWidth + MARGIN / 2, y: imgY + imgAreaHeight },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });

      // AI disclaimer
      page.drawText(AI_DISCLAIMER, {
        x: MARGIN,
        y: 20,
        size: 7,
        font,
        color: rgb(0.7, 0.7, 0.7),
      });

      // Page number
      const pageNum = `${completedPhotos.indexOf(photo) + 1} / ${completedPhotos.length}`;
      page.drawText(pageNum, {
        x: PAGE_WIDTH - MARGIN - 30,
        y: 20,
        size: 7,
        font,
        color: rgb(0.7, 0.7, 0.7),
      });
    }

    // ── Serialize PDF ──────────────────────────────────────────────
    const pdfBytes = await pdfDoc.save();

    // Check size — if > 25MB, warn (edge case)
    const sizeMB = pdfBytes.length / (1024 * 1024);
    if (sizeMB > 25) {
      console.warn(`PDF for dossier ${uuid} is ${sizeMB.toFixed(1)}MB — consider ZIP alternative`);
    }

    // Save PDF to Object Storage for future downloads
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const pdfKey = await saveImage(pdfBase64, `dossier_${uuid}_pdf`).catch((err) => {
      console.error("Failed to save PDF to storage:", err);
      return null;
    });

    // Update dossier with PDF key if saved
    if (pdfKey) {
      const { updateDossierStatus } = await import("@/lib/dossier");
      await updateDossierStatus(uuid, dossier.status as "draft" | "generating" | "completed" | "partial", {
        pdfStorageKey: pdfKey,
      }).catch(() => {});
    }

    // Return PDF as download
    const filename = `${title.replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "").trim().replace(/\s+/g, "-")}-versiroom.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBytes.length),
      },
    });
  } catch (err) {
    console.error("Error generating PDF:", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF." },
      { status: 500 }
    );
  }
}
