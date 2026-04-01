/**
 * F4.C — Mode Pro (ex Mode Marchand): PDF brandé professionnel.
 *
 * GET /api/dossier/[uuid]/pdf — Generate and download branded PDF
 *
 * Uses pdf-lib (lightweight, no binary dependencies).
 * Content:
 *   - Cover page: merchant branding, hero image, property info, description, map
 *   - Photo pages: before/after stacked vertically (1 per room, A4 portrait)
 *   - Footer: merchant coordinates + AI disclaimer
 * EU AI Act Art. 50: AI disclaimer on every page.
 */

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, PDFName, PDFString, PDFArray } from "pdf-lib";
import * as QRCode from "qrcode";
import { getImage, saveRawBuffer } from "@/lib/db";
import {
  getDossierByUuid,
  getDossierPhotos,
  isDossierExpired,
  getDossierTitle,
  formatPrice,
  formatSurface,
} from "@/lib/dossier";
import { getMerchantProfile, getMerchantLogo } from "@/lib/merchant";
import { getPropertyByUserAndAddress } from "@/lib/properties";
import { translateRoomLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

// ─── Constants ───────────────────────────────────────────────────────
const PAGE_WIDTH = 595; // A4 portrait width in points
const PAGE_HEIGHT = 842; // A4 portrait height in points
const MARGIN = 40;
const FOOTER_HEIGHT = 35;
const AI_DISCLAIMER = "Visuels générés par IA à titre indicatif — Powered by Versimo";

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Sanitize text for WinAnsi encoding (pdf-lib StandardFonts limitation).
 * Replaces non-WinAnsi characters with ASCII equivalents.
 */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/ /g, " ")  // narrow no-break space → regular space
    .replace(/ /g, " ")  // no-break space → regular space
    .replace(/’/g, "'")  // right single quotation → apostrophe
    .replace(/‘/g, "'")  // left single quotation → apostrophe
    .replace(/“/g, '"')  // left double quotation → quote
    .replace(/”/g, '"')  // right double quotation → quote
    .replace(/–/g, "-")  // en dash → hyphen
    .replace(/—/g, "-")  // em dash → hyphen
    .replace(/…/g, "...") // ellipsis → three dots
    .replace(/œ/g, "oe") // oe ligature
    .replace(/Œ/g, "OE") // OE ligature
    .replace(/[^\x00-\xFF]/g, ""); // strip any remaining non-Latin1 chars
}

/** Safe drawText that sanitizes for WinAnsi encoding */
function safeDrawText(
  page: PDFPage,
  text: string,
  options: { x: number; y: number; size: number; font: PDFFont; color: ReturnType<typeof rgb>; maxWidth?: number }
) {
  page.drawText(sanitizeForPdf(text), options);
}

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
  } catch (jpgErr) {
    try {
      return await pdfDoc.embedPng(imageData);
    } catch (pngErr) {
      console.error(`[PDF] Failed to embed image key="${storageKey}" — JPG error: ${jpgErr instanceof Error ? jpgErr.message : jpgErr}, PNG error: ${pngErr instanceof Error ? pngErr.message : pngErr}`);
      return null;
    }
  }
}

// DPE badge colors (same as web UI)
const DPE_COLORS: Record<string, { r: number; g: number; b: number }> = {
  A: { r: 0x31 / 255, g: 0x98 / 255, b: 0x34 / 255 },
  B: { r: 0x33 / 255, g: 0xa3 / 255, b: 0x57 / 255 },
  C: { r: 0x8d / 255, g: 0xc6 / 255, b: 0x3f / 255 },
  D: { r: 0xf5 / 255, g: 0xc2 / 255, b: 0x11 / 255 },
  E: { r: 0xf1 / 255, g: 0x9a / 255, b: 0x20 / 255 },
  F: { r: 0xe5 / 255, g: 0x53 / 255, b: 0x12 / 255 },
  G: { r: 0xd7 / 255, g: 0x22 / 255, b: 0x1f / 255 },
};

/** Add a clickable URI link annotation over a rectangular area on a PDF page */
function addLinkAnnotation(
  page: PDFPage,
  pdfDoc: PDFDocument,
  rect: { x: number; y: number; width: number; height: number },
  uri: string
) {
  const context = pdfDoc.context;
  const actionDict = context.obj({
    Type: "Action",
    S: "URI",
    URI: PDFString.of(uri),
  });
  const annotDict = context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
    A: actionDict,
    Border: [0, 0, 0],
  });
  const annotRef = context.register(annotDict);

  const existingAnnots = page.node.lookup(PDFName.of("Annots"));
  if (existingAnnots instanceof PDFArray) {
    existingAnnots.push(annotRef);
  } else {
    page.node.set(PDFName.of("Annots"), context.obj([annotRef]));
  }
}

async function generateQRCodePng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    width: 200,
    margin: 1,
    color: { dark: "#1C1C1E", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
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
  safeDrawText(page,AI_DISCLAIMER, {
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
    safeDrawText(page,coordParts, {
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
      { error: "Ce dossier a expiré." },
      { status: 410 }
    );
  }

  // If a pre-generated PDF exists in Object Storage, serve it directly
  if (dossier.pdf_storage_key) {
    try {
      const pdfData = await getImage(dossier.pdf_storage_key);
      if (pdfData) {
        const title = getDossierTitle(dossier);
        const safeName = title.replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "").trim().replace(/\s+/g, "-");
        return new NextResponse(Buffer.from(pdfData), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${safeName}-versimo.pdf"`,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    } catch (err) {
      console.error(`[PDF] Failed to serve stored PDF for ${uuid}:`, err);
      // Fall through to pdf-lib generation
    }
  }

  const photos = await getDossierPhotos(uuid);
  const completedPhotos = photos.filter((p) => p.status === "completed");

  if (completedPhotos.length === 0) {
    return NextResponse.json(
      { error: "Aucun visuel meuble dans ce dossier." },
      { status: 400 }
    );
  }

  // Load merchant profile + linked property (for DPE)
  const [profile, linkedProperty] = await Promise.all([
    getMerchantProfile(dossier.user_id),
    dossier.bien_adresse
      ? getPropertyByUserAndAddress(dossier.user_id, dossier.bien_adresse)
      : null,
  ]);
  const hasMerchant = profile?.is_merchant === true;

  // Merchant colors (fallback to Versimo defaults)
  const primaryColor = hexToRgb(hasMerchant && profile?.couleur_principale ? profile.couleur_principale : "#1C1C1E");
  const secondaryColor = hexToRgb(hasMerchant && profile?.couleur_secondaire ? profile.couleur_secondaire : "#7D9B76");

  try {
    const pdfDoc = await PDFDocument.create();

    // Map merchant font to pdf-lib StandardFonts (no custom embed possible)
    // Serif fonts (Playfair Display, Lora) -> TimesRoman, sans-serif -> Helvetica
    const merchantFontName = hasMerchant ? profile?.police : null;
    const isSerif = merchantFontName === "Playfair Display" || merchantFontName === "Lora";
    const font = await pdfDoc.embedFont(isSerif ? StandardFonts.TimesRoman : StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(isSerif ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold);

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
    const headerY = PAGE_HEIGHT - 50;

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
      // Fallback: Versimo text logo
      safeDrawText(coverPage,"Versimo", {
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
        safeDrawText(coverPage,line, {
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
      try {
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
      } catch (imgErr) {
        console.error(`[PDF] Failed to embed hero image: ${imgErr instanceof Error ? imgErr.message : imgErr}`);
      }
    }

    // -- Title + details under hero --
    let yPos = heroStartY - heroHeight - 30;

    safeDrawText(coverPage,title, {
      x: MARGIN,
      y: yPos,
      size: 24,
      font: fontBold,
      color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
    });
    yPos -= 28;

    // Description commerciale
    if (dossier.description_commerciale) {
      // Reserve space for elements below description:
      // - info pills line (~20px)
      // - address line (~16px)
      // - price line (~20px)
      // - date line (~16px)
      // - map area if present (~110px)
      // - footer (FOOTER_HEIGHT = 35px)
      // - padding (10px)
      // Reserve: info pills(20) + address(16) + price(20) + date(16) + contact block(88) + footer(35) + padding
      const belowDescriptionHeight = 102 + 88;
      const descBottomLimit = FOOTER_HEIGHT + belowDescriptionHeight;

      const DESC_FONT_SIZE = 11;
      const DESC_LINE_HEIGHT = 16;

      // Wrap long description to ~90 chars per line
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

      // Draw lines, truncating with "..." if we'd overflow into the reserved zone
      for (let i = 0; i < lines.length; i++) {
        const nextY = yPos - DESC_LINE_HEIGHT;
        if (nextY < descBottomLimit) {
          // This line would overflow — truncate with ellipsis on the previous line
          // If this is the very first line, still draw it truncated
          const truncated = lines[i].length > 60
            ? lines[i].substring(0, 60).trim() + "..."
            : lines[i] + "...";
          safeDrawText(coverPage, truncated, {
            x: MARGIN,
            y: yPos,
            size: DESC_FONT_SIZE,
            font,
            color: rgb(0.35, 0.35, 0.35),
          });
          yPos -= DESC_LINE_HEIGHT;
          break;
        }

        safeDrawText(coverPage, lines[i], {
          x: MARGIN,
          y: yPos,
          size: DESC_FONT_SIZE,
          font,
          color: rgb(0.35, 0.35, 0.35),
        });
        yPos -= DESC_LINE_HEIGHT;
      }
      yPos -= 6;
    }

    // Property info line
    const infoParts: string[] = [];
    if (dossier.bien_type) infoParts.push(typeLabels[dossier.bien_type] || dossier.bien_type);
    if (dossier.bien_surface) infoParts.push(formatSurface(dossier.bien_surface));
    if (dossier.nb_pieces) infoParts.push(`${dossier.nb_pieces} pièces`);
    if (dossier.ville) infoParts.push(dossier.ville);
    if (dossier.prix_moyen_m2) infoParts.push(`${dossier.prix_moyen_m2.toLocaleString("fr-FR")} €/m² (quartier)`);

    // DPE badge (drawn inline with info pills)
    const dpeClasse = linkedProperty?.dpe_classe || null;

    if (infoParts.length > 0) {
      // Draw info pills as text with separators
      const infoText = infoParts.join("  |  ");
      safeDrawText(coverPage,infoText, {
        x: MARGIN,
        y: yPos,
        size: 10,
        font,
        color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
      });

      // DPE badge right after the info text
      if (dpeClasse && DPE_COLORS[dpeClasse]) {
        const infoTextWidth = font.widthOfTextAtSize(sanitizeForPdf(infoText), 10);
        const badgeX = MARGIN + infoTextWidth + 12;
        const badgeW = 52;
        const badgeH = 18;
        const badgeY = yPos - 4;
        const dpeColor = DPE_COLORS[dpeClasse];

        // Badge background
        coverPage.drawRectangle({
          x: badgeX,
          y: badgeY,
          width: badgeW,
          height: badgeH,
          color: rgb(dpeColor.r, dpeColor.g, dpeColor.b),
          borderColor: rgb(dpeColor.r, dpeColor.g, dpeColor.b),
          borderWidth: 0,
        });

        // Badge text "DPE A"
        const badgeText = `DPE ${dpeClasse}`;
        const badgeTextWidth = fontBold.widthOfTextAtSize(badgeText, 9);
        safeDrawText(coverPage, badgeText, {
          x: badgeX + (badgeW - badgeTextWidth) / 2,
          y: badgeY + 5,
          size: 9,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
      }

      yPos -= 20;
    } else if (dpeClasse && DPE_COLORS[dpeClasse]) {
      // No info pills but DPE exists — draw standalone badge
      const dpeColor = DPE_COLORS[dpeClasse];
      const badgeW = 52;
      const badgeH = 18;
      coverPage.drawRectangle({
        x: MARGIN,
        y: yPos - 4,
        width: badgeW,
        height: badgeH,
        color: rgb(dpeColor.r, dpeColor.g, dpeColor.b),
      });
      const badgeText = `DPE ${dpeClasse}`;
      const badgeTextWidth = fontBold.widthOfTextAtSize(badgeText, 9);
      safeDrawText(coverPage, badgeText, {
        x: MARGIN + (badgeW - badgeTextWidth) / 2,
        y: yPos + 1,
        size: 9,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      yPos -= 24;
    }

    // Address
    if (dossier.bien_adresse) {
      safeDrawText(coverPage,dossier.bien_adresse, {
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
      safeDrawText(coverPage,formatPrice(dossier.bien_prix), {
        x: MARGIN,
        y: yPos,
        size: 14,
        font: fontBold,
        color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
      });
      yPos -= 20;
    }

    // Date
    safeDrawText(coverPage,dateStr, {
      x: MARGIN,
      y: yPos,
      size: 9,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    // ── Contact block: QR code + phone (bottom-left) ──────────────────
    const BASE_URL = "https://versimo.fr";
    const dossierWebUrl = `${BASE_URL}/dossier/${dossier.slug || dossier.uuid}`;
    const merchantTel = hasMerchant ? profile?.telephone || null : null;
    const merchantEmail = hasMerchant ? profile?.email_pro || null : null;

    // Contact block sits above the footer, ~80pt tall
    const contactBlockY = FOOTER_HEIGHT + 8;
    const contactBlockH = 80;

    // QR code
    try {
      const qrBuffer = await generateQRCodePng(dossierWebUrl);
      const qrImage = await pdfDoc.embedPng(qrBuffer);
      const qrSize = 62;
      coverPage.drawImage(qrImage, {
        x: MARGIN,
        y: contactBlockY + (contactBlockH - qrSize) / 2,
        width: qrSize,
        height: qrSize,
      });

      // Text next to QR
      const textX = MARGIN + qrSize + 14;
      let contactTextY = contactBlockY + contactBlockH - 14;

      // Phone number in big bold text (if available) — clickable tel: link
      if (merchantTel) {
        const telTextWidth = fontBold.widthOfTextAtSize(sanitizeForPdf(merchantTel), 16);
        safeDrawText(coverPage, merchantTel, {
          x: textX,
          y: contactTextY,
          size: 16,
          font: fontBold,
          color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
        });
        // Clickable annotation over the phone number
        const telDigits = merchantTel.replace(/[^+\d]/g, "");
        addLinkAnnotation(coverPage, pdfDoc, {
          x: textX,
          y: contactTextY - 2,
          width: telTextWidth,
          height: 18,
        }, `tel:${telDigits}`);
        contactTextY -= 18;
      }

      // Email under phone (if available) — clickable mailto: link
      if (merchantEmail) {
        const emailTextWidth = font.widthOfTextAtSize(sanitizeForPdf(merchantEmail), 10);
        safeDrawText(coverPage, merchantEmail, {
          x: textX,
          y: contactTextY,
          size: 10,
          font,
          color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
        });
        addLinkAnnotation(coverPage, pdfDoc, {
          x: textX,
          y: contactTextY - 2,
          width: emailTextWidth,
          height: 12,
        }, `mailto:${merchantEmail}`);
        contactTextY -= 14;
      }

      // Merchant name (if available, smaller)
      if (hasMerchant && profile?.raison_sociale) {
        safeDrawText(coverPage, profile.raison_sociale, {
          x: textX,
          y: contactTextY,
          size: 10,
          font: fontBold,
          color: rgb(0.3, 0.3, 0.3),
        });
        contactTextY -= 16;
      }

      // "Scannez pour voir le dossier en ligne"
      safeDrawText(coverPage, "Scannez pour voir le dossier en ligne", {
        x: textX,
        y: contactTextY,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

    } catch (qrErr) {
      // QR generation failed — fallback: show URL as text + phone
      console.error(`[PDF] QR code generation failed: ${qrErr instanceof Error ? qrErr.message : qrErr}`);

      let fallbackY = contactBlockY + contactBlockH - 14;

      if (merchantTel) {
        const telTextWidth = fontBold.widthOfTextAtSize(sanitizeForPdf(merchantTel), 16);
        safeDrawText(coverPage, merchantTel, {
          x: MARGIN,
          y: fallbackY,
          size: 16,
          font: fontBold,
          color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
        });
        const telDigits = merchantTel.replace(/[^+\d]/g, "");
        addLinkAnnotation(coverPage, pdfDoc, {
          x: MARGIN,
          y: fallbackY - 2,
          width: telTextWidth,
          height: 18,
        }, `tel:${telDigits}`);
        fallbackY -= 20;
      }

      // Email under phone in fallback
      if (merchantEmail) {
        safeDrawText(coverPage, merchantEmail, {
          x: MARGIN,
          y: fallbackY,
          size: 10,
          font,
          color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
        });
        fallbackY -= 14;
      }

      // URL in readable size
      safeDrawText(coverPage, dossierWebUrl, {
        x: MARGIN,
        y: fallbackY,
        size: 9,
        font,
        color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
      });
    }

    // Map at bottom right of cover (if available) — positioned next to contact block
    if (dossier.carte_image_key) {
      try {
        const mapImg = await embedImageFromStorage(pdfDoc, dossier.carte_image_key);
        if (mapImg) {
          const mapMaxW = 240;
          const mapMaxH = contactBlockH;
          const mapDims = mapImg.scaleToFit(mapMaxW, mapMaxH);
          coverPage.drawImage(mapImg, {
            x: PAGE_WIDTH - MARGIN - mapDims.width,
            y: contactBlockY + (contactBlockH - mapDims.height) / 2,
            width: mapDims.width,
            height: mapDims.height,
          });
        }
      } catch (imgErr) {
        console.error(`[PDF] Failed to embed map image: ${imgErr instanceof Error ? imgErr.message : imgErr}`);
      }
    }

    // Cover footer (AI disclaimer only — merchant coordinates now in contact block)
    drawFooter(
      coverPage,
      font,
      fontBold,
      null, // merchant name already shown in contact block
      null, // phone already shown in contact block
      secondaryColor
    );

    // ── Style labels for PDF display ───────────────────────────────
    const STYLE_LABELS: Record<string, string> = {
      scandinavian: "Style scandinave",
      contemporary: "Style contemporain",
      industrial: "Style industriel",
      japandi: "Style japandi",
      art_deco: "Style Art Déco",
      mid_century: "Style Mid-Century",
      bohemian: "Style bohème",
      mediterranean: "Style méditerranéen",
      cosy: "Style cosy",
      wabi_sabi: "Style wabi-sabi",
      maximalist: "Style maximaliste",
      haussmannien: "Style haussmannien",
    };

    // ── Photo Pages (before/after stacked vertically — A4 portrait) ──
    for (const photo of completedPhotos) {
      const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

      // Room label + style in header
      const roomLabel = translateRoomLabel(photo.room_label, `Photo ${photo.photo_index + 1}`);
      const styleLabel = photo.style_id ? ` — ${STYLE_LABELS[photo.style_id] || photo.style_id}` : "";
      safeDrawText(page, roomLabel + styleLabel, {
        x: MARGIN,
        y: PAGE_HEIGHT - 35,
        size: 14,
        font: fontBold,
        color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
      });

      // Image area dimensions (stacked: top = before, bottom = after)
      const imgAreaWidth = PAGE_WIDTH - MARGIN * 2;
      const imgAreaHeight = (PAGE_HEIGHT - 130) / 2; // 130 = header + labels + footer + spacing
      const beforeY = PAGE_HEIGHT - 55; // top of before image area
      const afterY = beforeY - imgAreaHeight - 30; // top of after image area (30pt gap for label)

      // Before image (top)
      if (photo.input_image_key) {
        try {
          const beforeImg = await embedImageFromStorage(pdfDoc, photo.input_image_key);
          if (beforeImg) {
            const dims = beforeImg.scaleToFit(imgAreaWidth, imgAreaHeight);
            const xOffset = MARGIN + (imgAreaWidth - dims.width) / 2;
            const yOffset = beforeY - imgAreaHeight + (imgAreaHeight - dims.height) / 2;
            page.drawImage(beforeImg, {
              x: xOffset,
              y: yOffset,
              width: dims.width,
              height: dims.height,
            });
          }
        } catch (imgErr) {
          console.error(`[PDF] Failed to embed before image for photo ${photo.id}: ${imgErr instanceof Error ? imgErr.message : imgErr}`);
        }
      }

      // "Avant home staging" label (between the two images)
      safeDrawText(page, "Avant home staging", {
        x: MARGIN,
        y: beforeY - imgAreaHeight - 12,
        size: 8,
        font: fontBold,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Horizontal separator line between before and after
      const separatorColor = rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      const sepY = afterY + 4; // just above the after image area
      page.drawLine({
        start: { x: MARGIN, y: sepY },
        end: { x: PAGE_WIDTH - MARGIN, y: sepY },
        thickness: 0.5,
        color: separatorColor,
        opacity: 0.2,
      });

      // "Après home staging" label
      const afterLabelColor = rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      safeDrawText(page, "Après home staging", {
        x: MARGIN,
        y: afterY + 8, // just above the after image area
        size: 8,
        font: fontBold,
        color: afterLabelColor,
      });

      // After image (bottom)
      if (photo.output_image_key) {
        try {
          const afterImg = await embedImageFromStorage(pdfDoc, photo.output_image_key);
          if (afterImg) {
            const dims = afterImg.scaleToFit(imgAreaWidth, imgAreaHeight);
            const xOffset = MARGIN + (imgAreaWidth - dims.width) / 2;
            // afterY is the TOP of the after area — image bottom = afterY - imgAreaHeight + centering
            const yOffset = afterY - imgAreaHeight + (imgAreaHeight - dims.height) / 2;
            page.drawImage(afterImg, {
              x: xOffset,
              y: yOffset,
              width: dims.width,
              height: dims.height,
            });
          }
        } catch (imgErr) {
          console.error(`[PDF] Failed to embed after image for photo ${photo.id}: ${imgErr instanceof Error ? imgErr.message : imgErr}`);
        }
      }

      // Page number
      const pageNum = `${completedPhotos.indexOf(photo) + 1} / ${completedPhotos.length}`;
      const pageNumWidth = font.widthOfTextAtSize(pageNum, 7);
      safeDrawText(page, pageNum, {
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

    // ── Merchant Info Page (last page) ──────────────────────────────
    if (hasMerchant && profile) {
      const infoPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      let infoY = PAGE_HEIGHT - 80;

      // Logo centered (re-fetch from storage for the info page)
      const infoLogoData = profile.logo_storage_key ? await getMerchantLogo(profile.logo_storage_key) : null;
      if (infoLogoData) {
        try {
          let logoImg;
          try {
            logoImg = await pdfDoc.embedJpg(infoLogoData);
          } catch {
            logoImg = await pdfDoc.embedPng(infoLogoData);
          }
          const logoDims = logoImg.scaleToFit(120, 80);
          infoPage.drawImage(logoImg, {
            x: PAGE_WIDTH / 2 - logoDims.width / 2,
            y: infoY - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
          });
          infoY -= logoDims.height + 25;
        } catch { /* logo embed failed, skip */ }
      }

      // Company name
      if (profile.raison_sociale) {
        const companyText = sanitizeForPdf(profile.raison_sociale);
        const companyWidth = fontBold.widthOfTextAtSize(companyText, 20);
        safeDrawText(infoPage, companyText, {
          x: PAGE_WIDTH / 2 - companyWidth / 2,
          y: infoY,
          size: 20,
          font: fontBold,
          color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
        });
        infoY -= 35;
      }

      // Separator
      infoPage.drawLine({
        start: { x: PAGE_WIDTH / 2 - 60, y: infoY },
        end: { x: PAGE_WIDTH / 2 + 60, y: infoY },
        thickness: 1,
        color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
        opacity: 0.3,
      });
      infoY -= 30;

      // Contact details centered
      const contactLines: string[] = [];
      if (profile.adresse) contactLines.push(profile.adresse);
      if (profile.telephone) contactLines.push(`Tél. : ${profile.telephone}`);
      if (profile.email_pro) contactLines.push(profile.email_pro);
      if (profile.siret) contactLines.push(`SIRET : ${profile.siret}`);

      for (const line of contactLines) {
        const lineText = sanitizeForPdf(line);
        const lineWidth = font.widthOfTextAtSize(lineText, 11);
        const lineX = PAGE_WIDTH / 2 - lineWidth / 2;
        safeDrawText(infoPage, lineText, {
          x: lineX,
          y: infoY,
          size: 11,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
        // Add clickable link for phone and email
        if (line.startsWith("Tél.") && profile.telephone) {
          const cleanPhone = profile.telephone.replace(/[^+\d]/g, "");
          addLinkAnnotation(infoPage, pdfDoc, {
            x: lineX, y: infoY - 2, width: lineWidth, height: 14,
          }, `tel:${cleanPhone}`);
        } else if (line.includes("@")) {
          addLinkAnnotation(infoPage, pdfDoc, {
            x: lineX, y: infoY - 2, width: lineWidth, height: 14,
          }, `mailto:${line}`);
        }
        infoY -= 18;
      }

      // QR code to online dossier
      infoY -= 20;
      try {
        const qrUrl = `https://versimo.fr/dossier/${dossier.slug || uuid}`;
        const qrPng = await QRCode.toBuffer(qrUrl, { width: 200, margin: 1, color: { dark: "#1C1C1E", light: "#FAFAF8" } });
        const qrImg = await pdfDoc.embedPng(qrPng);
        const qrSize = 80;
        infoPage.drawImage(qrImg, {
          x: PAGE_WIDTH / 2 - qrSize / 2,
          y: infoY - qrSize,
          width: qrSize,
          height: qrSize,
        });
        infoY -= qrSize + 12;
        const qrLabel = "Voir le dossier en ligne";
        const qrLabelWidth = font.widthOfTextAtSize(qrLabel, 8);
        safeDrawText(infoPage, qrLabel, {
          x: PAGE_WIDTH / 2 - qrLabelWidth / 2,
          y: infoY,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      } catch { /* QR failed, skip */ }

      // "Dossier généré par Versimo" at bottom
      const poweredBy = "Dossier généré par Versimo — versimo.fr";
      const poweredByText = sanitizeForPdf(poweredBy);
      const poweredByWidth = font.widthOfTextAtSize(poweredByText, 8);
      safeDrawText(infoPage, poweredByText, {
        x: PAGE_WIDTH / 2 - poweredByWidth / 2,
        y: FOOTER_HEIGHT + 10,
        size: 8,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });

      // Footer
      drawFooter(infoPage, font, fontBold, null, null, secondaryColor);
    }

    // ── Serialize PDF ──────────────────────────────────────────────
    const pdfBytes = await pdfDoc.save();

    const sizeMB = pdfBytes.length / (1024 * 1024);
    if (sizeMB > 25) {
      console.warn(`PDF for dossier ${uuid} is ${sizeMB.toFixed(1)}MB`);
    }

    // Save PDF to Object Storage (raw buffer, proper .pdf key)
    const pdfStorageKey = `dossiers/${uuid}/dossier.pdf`;
    const pdfKey = await saveRawBuffer(Buffer.from(pdfBytes), pdfStorageKey).then(() => pdfStorageKey).catch((err) => {
      console.error("Failed to save PDF to storage:", err);
      return null;
    });

    if (pdfKey) {
      const { updateDossierStatus } = await import("@/lib/dossier");
      await updateDossierStatus(uuid, dossier.status as "draft" | "generating" | "completed" | "partial", {
        pdfStorageKey: pdfKey,
      }).catch(() => {});
    }

    const filename = `${title.replace(/[^a-zA-Z0-9À-ɏ\s-]/g, "").trim().replace(/\s+/g, "-")}-versimo.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBytes.length),
      },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    console.error(`[PDF] Error generating PDF for dossier uuid=${uuid}: ${errMsg}`, errStack || "");
    return NextResponse.json(
      { error: `Erreur lors de la generation du PDF : ${errMsg}` },
      { status: 500 }
    );
  }
}
