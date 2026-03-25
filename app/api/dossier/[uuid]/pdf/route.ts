/**
 * F4.C — Mode Marchand: PDF brande professionnel.
 *
 * GET /api/dossier/[uuid]/pdf — Generate and download branded PDF
 *
 * Uses pdf-lib (lightweight, no binary dependencies).
 * Content:
 *   - Cover page: merchant branding, hero image, property info, description, map
 *   - Photo pages: before/after side by side (1 per room)
 *   - Footer: merchant coordinates + AI disclaimer
 * EU AI Act Art. 50: AI disclaimer on every page.
 */

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import { getImage, saveImage } from "@/lib/db";
import {
  getDossierByUuid,
  getDossierPhotos,
  isDossierExpired,
  getDossierTitle,
  formatPrice,
  formatSurface,
} from "@/lib/dossier";
import { getMerchantProfile, getMerchantLogo } from "@/lib/merchant";

export const dynamic = "force-dynamic";

// ─── Constants ───────────────────────────────────────────────────────
const PAGE_WIDTH = 842; // A4 landscape width in points
const PAGE_HEIGHT = 595; // A4 landscape height in points
const MARGIN = 40;
const FOOTER_HEIGHT = 35;
const AI_DISCLAIMER = "Visuels generes par IA a titre indicatif — Powered by Versiroom";

// ─── Helpers ─────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return { r, g, b };
}

async function embedImageFromStorage(
  pdfDoc: PDFDocument,
  storageKey: string
): Promise<Awaited<ReturnType<typeof pdfDoc.embedJpg>> | null> {
  const imageData = await getImage(storageKey);
  if (!imageData) return null;

  try {
    return await pdfDoc.embedJpg(imageData);
  } catch {
    try {
      return await pdfDoc.embedPng(imageData);
    } catch {
      console.error(`Failed to embed image from key: ${storageKey}`);
      return null;
    }
  }
}

function drawFooter(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  merchantName: string | null,
  merchantTel: string | null,
  secondaryColor: { r: number; g: number; b: number }
) {
  // Footer background band
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: FOOTER_HEIGHT,
    color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
    opacity: 0.12,
  });

  // AI disclaimer (left)
  page.drawText(AI_DISCLAIMER, {
    x: MARGIN,
    y: 12,
    size: 7,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Merchant coordinates (right)
  if (merchantName || merchantTel) {
    const coordParts = [merchantName, merchantTel].filter(Boolean).join(" — ");
    const textWidth = font.widthOfTextAtSize(coordParts, 7);
    page.drawText(coordParts, {
      x: PAGE_WIDTH - MARGIN - textWidth,
      y: 12,
      size: 7,
      font: fontBold,
      color: rgb(0.4, 0.4, 0.4),
    });
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
      { error: "Ce dossier a expire." },
      { status: 410 }
    );
  }

  const photos = await getDossierPhotos(uuid);
  const completedPhotos = photos.filter((p) => p.status === "completed");

  if (completedPhotos.length === 0) {
    return NextResponse.json(
      { error: "Aucun visuel meuble dans ce dossier." },
      { status: 400 }
    );
  }

  // Load merchant profile
  const profile = await getMerchantProfile(dossier.user_id);
  const hasMerchant = profile?.is_merchant === true;

  // Merchant colors (fallback to Versiroom defaults)
  const primaryColor = hexToRgb(hasMerchant && profile?.couleur_principale ? profile.couleur_principale : "#1C1C1E");
  const secondaryColor = hexToRgb(hasMerchant && profile?.couleur_secondaire ? profile.couleur_secondaire : "#7D9B76");

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

    const typeLabels: Record<string, string> = {
      appartement: "Appartement",
      maison: "Maison",
      loft: "Loft",
      studio: "Studio",
      duplex: "Duplex",
      bureau: "Bureau commercial",
    };

    // ── Cover Page ─────────────────────────────────────────────────
    const coverPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // -- Top bar: logo left + merchant info right --
    let headerY = PAGE_HEIGHT - 50;

    // Merchant logo (if available)
    if (hasMerchant && profile?.logo_storage_key) {
      const logoData = await getMerchantLogo(profile.logo_storage_key);
      if (logoData) {
        try {
          let logoEmbed;
          try {
            logoEmbed = await pdfDoc.embedJpg(logoData);
          } catch {
            logoEmbed = await pdfDoc.embedPng(logoData);
          }
          const logoDims = logoEmbed.scaleToFit(120, 40);
          coverPage.drawImage(logoEmbed, {
            x: MARGIN,
            y: headerY - logoDims.height + 10,
            width: logoDims.width,
            height: logoDims.height,
          });
        } catch {
          // Skip logo if embed fails
        }
      }
    } else {
      // Fallback: Versiroom text logo
      coverPage.drawText("Versiroom", {
        x: MARGIN,
        y: headerY,
        size: 16,
        font: fontBold,
        color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
      });
    }

    // Merchant info (right aligned)
    if (hasMerchant) {
      const infoLines: string[] = [];
      if (profile?.raison_sociale) infoLines.push(profile.raison_sociale);
      if (profile?.adresse) infoLines.push(profile.adresse);
      const contactParts: string[] = [];
      if (profile?.telephone) contactParts.push(profile.telephone);
      if (profile?.email_pro) contactParts.push(profile.email_pro);
      if (contactParts.length > 0) infoLines.push(contactParts.join(" — "));

      let infoY = headerY;
      for (const line of infoLines) {
        const lineWidth = font.widthOfTextAtSize(line, 9);
        coverPage.drawText(line, {
          x: PAGE_WIDTH - MARGIN - lineWidth,
          y: infoY,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
        infoY -= 14;
      }
    }

    // -- Hero image: first completed photo (after) --
    const heroStartY = headerY - 60;
    const heroHeight = 220;
    const heroWidth = PAGE_WIDTH - MARGIN * 2;

    if (completedPhotos[0]?.output_image_key) {
      const heroImg = await embedImageFromStorage(pdfDoc, completedPhotos[0].output_image_key);
      if (heroImg) {
        const dims = heroImg.scaleToFit(heroWidth, heroHeight);
        const xOffset = MARGIN + (heroWidth - dims.width) / 2;
        const yOffset = heroStartY - heroHeight + (heroHeight - dims.height) / 2;
        coverPage.drawImage(heroImg, {
          x: xOffset,
          y: yOffset,
          width: dims.width,
          height: dims.height,
        });
      }
    }

    // -- Title + details under hero --
    let yPos = heroStartY - heroHeight - 30;

    coverPage.drawText(title, {
      x: MARGIN,
      y: yPos,
      size: 24,
      font: fontBold,
      color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
    });
    yPos -= 28;

    // Description commerciale
    if (dossier.description_commerciale) {
      // Wrap long description to ~80 chars per line
      const words = dossier.description_commerciale.split(" ");
      let line = "";
      const lines: string[] = [];
      for (const word of words) {
        if ((line + " " + word).length > 90) {
          lines.push(line.trim());
          line = word;
        } else {
          line += " " + word;
        }
      }
      if (line.trim()) lines.push(line.trim());

      for (const l of lines) {
        coverPage.drawText(l, {
          x: MARGIN,
          y: yPos,
          size: 11,
          font,
          color: rgb(0.35, 0.35, 0.35),
        });
        yPos -= 16;
      }
      yPos -= 6;
    }

    // Property info line
    const infoParts: string[] = [];
    if (dossier.bien_type) infoParts.push(typeLabels[dossier.bien_type] || dossier.bien_type);
    if (dossier.bien_surface) infoParts.push(formatSurface(dossier.bien_surface));
    if (dossier.nb_pieces) infoParts.push(`${dossier.nb_pieces} pieces`);
    if (dossier.ville) infoParts.push(dossier.ville);
    if (dossier.prix_moyen_m2) infoParts.push(`${dossier.prix_moyen_m2.toLocaleString("fr-FR")} \u20AC/m\u00B2 (quartier)`);

    if (infoParts.length > 0) {
      // Draw info pills as text with separators
      const infoText = infoParts.join("  |  ");
      coverPage.drawText(infoText, {
        x: MARGIN,
        y: yPos,
        size: 10,
        font,
        color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
      });
      yPos -= 20;
    }

    // Address
    if (dossier.bien_adresse) {
      coverPage.drawText(dossier.bien_adresse, {
        x: MARGIN,
        y: yPos,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      yPos -= 16;
    }

    // Price
    if (dossier.bien_prix) {
      coverPage.drawText(formatPrice(dossier.bien_prix), {
        x: MARGIN,
        y: yPos,
        size: 14,
        font: fontBold,
        color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
      });
      yPos -= 20;
    }

    // Date
    coverPage.drawText(dateStr, {
      x: MARGIN,
      y: yPos,
      size: 9,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Map at bottom right of cover (if available)
    if (dossier.carte_image_key) {
      const mapImg = await embedImageFromStorage(pdfDoc, dossier.carte_image_key);
      if (mapImg) {
        const mapMaxW = 240;
        const mapMaxH = 100;
        const mapDims = mapImg.scaleToFit(mapMaxW, mapMaxH);
        coverPage.drawImage(mapImg, {
          x: PAGE_WIDTH - MARGIN - mapDims.width,
          y: FOOTER_HEIGHT + 10,
          width: mapDims.width,
          height: mapDims.height,
        });
      }
    }

    // Cover footer
    drawFooter(
      coverPage,
      font,
      fontBold,
      hasMerchant ? profile?.raison_sociale || null : null,
      hasMerchant ? profile?.telephone || null : null,
      secondaryColor
    );

    // ── Photo Pages (before/after side by side) ────────────────────
    for (const photo of completedPhotos) {
      const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

      // Room label + style in header
      const roomLabel = photo.room_label || `Photo ${photo.photo_index + 1}`;
      const styleLabel = photo.style_id ? ` — ${photo.style_id}` : "";
      page.drawText(roomLabel + styleLabel, {
        x: MARGIN,
        y: PAGE_HEIGHT - 35,
        size: 14,
        font: fontBold,
        color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
      });

      // Image area dimensions (side by side)
      const imgAreaWidth = (PAGE_WIDTH - MARGIN * 3) / 2;
      const imgAreaHeight = PAGE_HEIGHT - 100;
      const imgY = FOOTER_HEIGHT + 15;

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

      // "Apres home staging" label
      const afterLabelColor = rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      page.drawText("Apres home staging", {
        x: MARGIN * 2 + imgAreaWidth + imgAreaWidth / 2 - 40,
        y: imgY - 5,
        size: 8,
        font: fontBold,
        color: afterLabelColor,
      });

      // Separator line
      const separatorColor = rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      page.drawLine({
        start: { x: MARGIN + imgAreaWidth + MARGIN / 2, y: imgY },
        end: { x: MARGIN + imgAreaWidth + MARGIN / 2, y: imgY + imgAreaHeight },
        thickness: 0.5,
        color: separatorColor,
        opacity: 0.3,
      });

      // Page number
      const pageNum = `${completedPhotos.indexOf(photo) + 1} / ${completedPhotos.length}`;
      const pageNumWidth = font.widthOfTextAtSize(pageNum, 7);
      page.drawText(pageNum, {
        x: PAGE_WIDTH / 2 - pageNumWidth / 2,
        y: PAGE_HEIGHT - 20,
        size: 7,
        font,
        color: rgb(0.7, 0.7, 0.7),
      });

      // Footer
      drawFooter(
        page,
        font,
        fontBold,
        hasMerchant ? profile?.raison_sociale || null : null,
        hasMerchant ? profile?.telephone || null : null,
        secondaryColor
      );
    }

    // ── Serialize PDF ──────────────────────────────────────────────
    const pdfBytes = await pdfDoc.save();

    const sizeMB = pdfBytes.length / (1024 * 1024);
    if (sizeMB > 25) {
      console.warn(`PDF for dossier ${uuid} is ${sizeMB.toFixed(1)}MB`);
    }

    // Save PDF to Object Storage
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const pdfKey = await saveImage(pdfBase64, `dossier_${uuid}_pdf`).catch((err) => {
      console.error("Failed to save PDF to storage:", err);
      return null;
    });

    if (pdfKey) {
      const { updateDossierStatus } = await import("@/lib/dossier");
      await updateDossierStatus(uuid, dossier.status as "draft" | "generating" | "completed" | "partial", {
        pdfStorageKey: pdfKey,
      }).catch(() => {});
    }

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
      { error: "Erreur lors de la generation du PDF." },
      { status: 500 }
    );
  }
}
