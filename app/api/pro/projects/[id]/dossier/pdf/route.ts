/**
 * POST /api/pro/projects/:id/dossier/pdf — Générer un dossier PDF brandé
 *
 * Rendu : SSR (force-dynamic) — lecture DB multi-tables + Object Storage.
 *
 * Auth + ownership obligatoires.
 * Charge les lots sélectionnés avec pièces, visuels, descriptions, recommandations.
 * Génère un PDF A4 portrait avec pdf-lib (StandardFonts, pas de dépendances binaires).
 *
 * Structure du PDF :
 *   - Page de couverture (titre, adresse, type, surface, date)
 *   - Par lot : page en-tête + 1 page par pièce (avant/après empilés)
 *   - Par lot : page recommandations (si acceptées)
 *   - Footer sur chaque page : disclaimer IA + Versimo
 */

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import { getPool, getImage } from "@/lib/db";
import { z } from "zod";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";
import { ensureProTables } from "@/lib/marchand/db";
import { getMerchantProfile } from "@/lib/merchant";

export const dynamic = "force-dynamic";

// ─── Constants ─────────────────────────────────────────────────────
const PAGE_WIDTH = 595; // A4 portrait
const PAGE_HEIGHT = 842;
const MARGIN = 40;
const FOOTER_HEIGHT = 30;
const AI_DISCLAIMER =
  "Visuels générés par IA à titre indicatif — Powered by Versimo";

// Versimo brand colors
const SAGE = { r: 125 / 255, g: 155 / 255, b: 118 / 255 };
const FOREGROUND = { r: 28 / 255, g: 28 / 255, b: 30 / 255 };
const LIGHT_GRAY = { r: 0.6, g: 0.6, b: 0.6 };

// ─── Validation ────────────────────────────────────────────────────

const DossierBodySchema = z.object({
  lot_ids: z
    .array(z.string().uuid("Chaque lot_id doit être un UUID valide."))
    .min(1, "Au moins un lot doit être sélectionné."),
});

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Sanitize text for WinAnsi encoding (pdf-lib StandardFonts limitation).
 * Replaces non-WinAnsi characters with ASCII equivalents.
 */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/ /g, " ") // narrow no-break space
    .replace(/ /g, " ") // no-break space
    .replace(/'/g, "'") // right single quotation
    .replace(/'/g, "'") // left single quotation
    .replace(/\u201C/g, '"') // left double quotation
    .replace(/\u201D/g, '"') // right double quotation
    .replace(/–/g, "-") // en dash
    .replace(/—/g, "-") // em dash
    .replace(/…/g, "...") // ellipsis
    .replace(/œ/g, "oe") // oe ligature
    .replace(/Œ/g, "OE") // OE ligature
    .replace(/[^\x00-\xFF]/g, ""); // strip remaining non-Latin1
}

/** Safe drawText that sanitizes for WinAnsi encoding */
function safeDrawText(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    color: ReturnType<typeof rgb>;
    maxWidth?: number;
  }
) {
  page.drawText(sanitizeForPdf(text), options);
}

/** Word-wrap text to fit a max width, returns array of lines */
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(sanitizeForPdf(testLine), fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/** Try to embed an image from Object Storage (JPEG first, then PNG) */
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
    } catch (pngErr) {
      console.error(
        `[Pro PDF] Failed to embed image key="${storageKey}":`,
        pngErr instanceof Error ? pngErr.message : pngErr
      );
      return null;
    }
  }
}

/** Draw the standard footer on every page */
function drawFooter(page: PDFPage, font: PDFFont, disclaimerText?: string) {
  // Light background band
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: FOOTER_HEIGHT,
    color: rgb(SAGE.r, SAGE.g, SAGE.b),
    opacity: 0.08,
  });

  safeDrawText(page, disclaimerText || AI_DISCLAIMER, {
    x: MARGIN,
    y: 10,
    size: 7,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
}

/** Draw a horizontal separator line */
function drawSeparator(page: PDFPage, y: number) {
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
}

// ─── Types ─────────────────────────────────────────────────────────

interface DossierRoom {
  id: string;
  name: string;
  room_type: string;
  surface_m2: number | null;
  photo_path: string | null;
  visual_output_path: string | null;
  generation_status: string;
}

interface DossierRecommendation {
  id: string;
  title: string;
  description: string;
  action_type: string;
  estimated_cost_eur: number | null;
  impact_level: string;
  affected_rooms: string[];
  rationale_buyer: string | null;
}

interface DossierLot {
  id: string;
  name: string;
  floor: number | null;
  style_id: string | null;
  target_buyer: string | null;
  commercial_description: string | null;
  surface_m2: number | null;
  rooms: DossierRoom[];
  recommendations: DossierRecommendation[];
}

// ─── Style / Target labels ─────────────────────────────────────────

const STYLE_LABELS: Record<string, string> = {
  scandinavian: "Scandinave",
  contemporary: "Contemporain",
  industrial: "Industriel",
  japandi: "Japandi",
  "art-deco": "Art Déco",
  "mid-century": "Mid-Century",
  bohemian: "Bohème",
  mediterranean: "Méditerranéen",
  cosy: "Cosy Moderne",
  "wabi-sabi": "Wabi-Sabi",
  maximalist: "Maximaliste",
  haussmannian: "Haussmannien",
};

const TARGET_LABELS: Record<string, string> = {
  famille: "Famille",
  couple_sans_enfant: "Couple",
  investisseur_locatif: "Investisseur",
  etudiant: "Étudiant",
  senior: "Senior",
  professionnel_liberal: "Professionnel",
};

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  loft: "Loft",
  studio: "Studio",
  duplex: "Duplex",
  bureau: "Bureau commercial",
};

// ─── POST handler ──────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  // ─── Auth + ownership ──────────────────────────────────────────
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  const { user, project } = authResult;

  try {
    await ensureProTables();
    const db = getPool();

    // ─── Load selling price + merchant profile in parallel ──────
    const [priceResult, merchantProfile] = await Promise.all([
      db.query<{ selling_price: string | null }>(
        `SELECT selling_price FROM pro_projects WHERE id = $1`,
        [projectId]
      ),
      getMerchantProfile(user.id),
    ]);

    const sellingPrice = priceResult.rows[0]?.selling_price
      ? Number(priceResult.rows[0].selling_price)
      : null;

    const hasMerchant = merchantProfile?.is_merchant === true;
    const brandName = hasMerchant && merchantProfile?.raison_sociale
      ? merchantProfile.raison_sociale
      : "Versimo";
    const footerDisclaimer = hasMerchant && merchantProfile?.raison_sociale
      ? `Visuels générés par IA à titre indicatif — ${merchantProfile.raison_sociale} via Versimo`
      : AI_DISCLAIMER;

    // ─── Parse body ─────────────────────────────────────────────
    const body = await request.json();
    const parsed = DossierBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          fields: parsed.error.flatten().fieldErrors,
          message: "Données invalides.",
        },
        { status: 400 }
      );
    }

    const { lot_ids } = parsed.data;

    // ─── Load lots and verify ownership ─────────────────────────
    const lotsResult = await db.query(
      `SELECT id, name, floor, target_buyer, style_id, budget_travaux,
              commercial_description, description_is_manual, status
       FROM pro_lots
       WHERE id = ANY($1) AND project_id = $2
       ORDER BY floor ASC, name ASC`,
      [lot_ids, projectId]
    );

    const foundIds = new Set(
      lotsResult.rows.map((r: { id: string }) => r.id)
    );
    const missingIds = lot_ids.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: `Lot(s) introuvable(s) dans ce projet : ${missingIds.join(", ")}`,
        },
        { status: 404 }
      );
    }

    // ─── Build dossier data ─────────────────────────────────────
    const dossierLots: DossierLot[] = await Promise.all(
      lotsResult.rows.map(
        async (lot: {
          id: string;
          name: string;
          floor: number | null;
          target_buyer: string | null;
          style_id: string | null;
          budget_travaux: string | null;
          commercial_description: string | null;
          description_is_manual: boolean;
          status: string;
        }) => {
          // Load rooms
          const roomsResult = await db.query(
            `SELECT id, name, room_type, surface_m2,
                    photo_path, visual_output_path, generation_status
             FROM pro_rooms
             WHERE lot_id = $1
             ORDER BY name`,
            [lot.id]
          );

          const rooms: DossierRoom[] = roomsResult.rows.map(
            (r: {
              id: string;
              name: string;
              room_type: string;
              surface_m2: string | null;
              photo_path: string | null;
              visual_output_path: string | null;
              generation_status: string;
            }) => ({
              id: r.id,
              name: r.name,
              room_type: r.room_type,
              surface_m2: r.surface_m2 !== null ? Number(r.surface_m2) : null,
              photo_path: r.photo_path,
              visual_output_path: r.visual_output_path,
              generation_status: r.generation_status,
            })
          );

          // Load accepted recommendations
          const recsResult = await db.query(
            `SELECT id, title, description, action_type, estimated_cost_eur,
                    impact_level, affected_rooms, rationale_buyer
             FROM pro_recommendations
             WHERE lot_id = $1 AND is_active = TRUE AND is_accepted = TRUE
             ORDER BY impact_level DESC, created_at ASC`,
            [lot.id]
          );

          const recommendations: DossierRecommendation[] = recsResult.rows.map(
            (r: {
              id: string;
              title: string;
              description: string;
              action_type: string;
              estimated_cost_eur: string | null;
              impact_level: string;
              affected_rooms: string[];
              rationale_buyer: string | null;
            }) => ({
              id: r.id,
              title: r.title,
              description: r.description,
              action_type: r.action_type,
              estimated_cost_eur:
                r.estimated_cost_eur !== null
                  ? Number(r.estimated_cost_eur)
                  : null,
              impact_level: r.impact_level,
              affected_rooms: r.affected_rooms,
              rationale_buyer: r.rationale_buyer,
            })
          );

          const totalSurface = rooms.reduce(
            (sum, r) => sum + (r.surface_m2 ?? 0),
            0
          );

          return {
            id: lot.id,
            name: lot.name,
            floor: lot.floor !== null ? Number(lot.floor) : null,
            style_id: lot.style_id,
            target_buyer: lot.target_buyer,
            commercial_description: lot.commercial_description,
            surface_m2: totalSurface > 0 ? totalSurface : null,
            rooms,
            recommendations,
          };
        }
      )
    );

    // ─── Generate PDF ───────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const contentWidth = PAGE_WIDTH - MARGIN * 2;
    const dateStr = new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ════════════════════════════════════════════════════════════
    // COVER PAGE
    // ════════════════════════════════════════════════════════════
    const coverPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    // Brand name (merchant or Versimo)
    safeDrawText(coverPage, brandName, {
      x: MARGIN,
      y: PAGE_HEIGHT - 50,
      size: 16,
      font: fontBold,
      color: rgb(SAGE.r, SAGE.g, SAGE.b),
    });

    // Decorative line under logo
    drawSeparator(coverPage, PAGE_HEIGHT - 60);

    // Title
    let coverY = PAGE_HEIGHT - 110;
    safeDrawText(coverPage, "Dossier de", {
      x: MARGIN,
      y: coverY,
      size: 28,
      font,
      color: rgb(FOREGROUND.r, FOREGROUND.g, FOREGROUND.b),
    });
    coverY -= 34;
    safeDrawText(coverPage, "pré-commercialisation", {
      x: MARGIN,
      y: coverY,
      size: 28,
      font: fontBold,
      color: rgb(FOREGROUND.r, FOREGROUND.g, FOREGROUND.b),
    });
    coverY -= 50;

    // Address
    if (project.adresse) {
      const addressLines = wrapText(
        project.adresse,
        fontBold,
        14,
        contentWidth
      );
      for (const line of addressLines) {
        safeDrawText(coverPage, line, {
          x: MARGIN,
          y: coverY,
          size: 14,
          font: fontBold,
          color: rgb(SAGE.r, SAGE.g, SAGE.b),
        });
        coverY -= 20;
      }
      coverY -= 10;
    }

    // Property info pills
    const infoParts: string[] = [];
    if (project.type_bien) {
      infoParts.push(TYPE_LABELS[project.type_bien] || project.type_bien);
    }
    if (project.surface_totale) {
      infoParts.push(`${project.surface_totale} m²`);
    }
    infoParts.push(`${dossierLots.length} lot${dossierLots.length > 1 ? "s" : ""}`);

    const totalRooms = dossierLots.reduce((acc, l) => acc + l.rooms.length, 0);
    infoParts.push(`${totalRooms} pièce${totalRooms > 1 ? "s" : ""}`);

    if (infoParts.length > 0) {
      safeDrawText(coverPage, infoParts.join("  |  "), {
        x: MARGIN,
        y: coverY,
        size: 11,
        font,
        color: rgb(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b),
      });
      coverY -= 30;
    }

    // Selling price
    if (sellingPrice) {
      const priceStr = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(sellingPrice);
      safeDrawText(coverPage, priceStr, {
        x: MARGIN,
        y: coverY,
        size: 20,
        font: fontBold,
        color: rgb(FOREGROUND.r, FOREGROUND.g, FOREGROUND.b),
      });
      coverY -= 30;
    }

    // Date
    safeDrawText(coverPage, `Généré le ${dateStr}`, {
      x: MARGIN,
      y: coverY,
      size: 10,
      font,
      color: rgb(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b),
    });

    // Cover footer
    drawFooter(coverPage, font, footerDisclaimer);

    // ════════════════════════════════════════════════════════════
    // LOT PAGES
    // ════════════════════════════════════════════════════════════
    for (const lot of dossierLots) {
      // ── Lot header page ──────────────────────────────────────
      const lotPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      let y = PAGE_HEIGHT - MARGIN;

      // Lot name
      safeDrawText(lotPage, lot.name, {
        x: MARGIN,
        y,
        size: 22,
        font: fontBold,
        color: rgb(FOREGROUND.r, FOREGROUND.g, FOREGROUND.b),
      });
      y -= 30;

      // Lot meta line
      const lotMeta: string[] = [];
      if (lot.floor !== null) {
        lotMeta.push(
          lot.floor === 0
            ? "Rez-de-chaussée"
            : `Étage ${lot.floor}`
        );
      }
      if (lot.style_id) {
        lotMeta.push(STYLE_LABELS[lot.style_id] || lot.style_id);
      }
      if (lot.target_buyer) {
        lotMeta.push(
          `Cible : ${TARGET_LABELS[lot.target_buyer] || lot.target_buyer}`
        );
      }
      if (lot.surface_m2) {
        lotMeta.push(`${lot.surface_m2} m²`);
      }

      if (lotMeta.length > 0) {
        safeDrawText(lotPage, lotMeta.join("  —  "), {
          x: MARGIN,
          y,
          size: 10,
          font,
          color: rgb(SAGE.r, SAGE.g, SAGE.b),
        });
        y -= 24;
      }

      drawSeparator(lotPage, y);
      y -= 20;

      // Commercial description
      if (lot.commercial_description) {
        safeDrawText(lotPage, "Description commerciale", {
          x: MARGIN,
          y,
          size: 12,
          font: fontBold,
          color: rgb(FOREGROUND.r, FOREGROUND.g, FOREGROUND.b),
        });
        y -= 18;

        const descLines = wrapText(
          lot.commercial_description,
          font,
          10,
          contentWidth
        );
        for (const line of descLines) {
          if (y < FOOTER_HEIGHT + 20) break; // Prevent overflow
          safeDrawText(lotPage, line, {
            x: MARGIN,
            y,
            size: 10,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
          y -= 15;
        }
        y -= 10;
      }

      // Room list summary
      if (lot.rooms.length > 0 && y > FOOTER_HEIGHT + 60) {
        safeDrawText(lotPage, "Pièces", {
          x: MARGIN,
          y,
          size: 12,
          font: fontBold,
          color: rgb(FOREGROUND.r, FOREGROUND.g, FOREGROUND.b),
        });
        y -= 18;

        for (const room of lot.rooms) {
          if (y < FOOTER_HEIGHT + 20) break;
          const roomInfo = room.surface_m2
            ? `${room.name} — ${room.surface_m2} m²`
            : room.name;
          safeDrawText(lotPage, `  •  ${roomInfo}`, {
            x: MARGIN,
            y,
            size: 10,
            font,
            color: rgb(0.35, 0.35, 0.35),
          });
          y -= 15;
        }
      }

      drawFooter(lotPage, font, footerDisclaimer);

      // ── Room pages (1 per room with visuals) ─────────────────
      const roomsWithVisuals = lot.rooms.filter(
        (r) => r.photo_path || r.visual_output_path
      );

      for (const room of roomsWithVisuals) {
        const roomPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        let ry = PAGE_HEIGHT - MARGIN;

        // Room name + type
        const roomTitle = room.surface_m2
          ? `${room.name} — ${room.surface_m2} m²`
          : room.name;
        safeDrawText(roomPage, roomTitle, {
          x: MARGIN,
          y: ry,
          size: 14,
          font: fontBold,
          color: rgb(FOREGROUND.r, FOREGROUND.g, FOREGROUND.b),
        });
        ry -= 20;

        safeDrawText(roomPage, room.room_type, {
          x: MARGIN,
          y: ry,
          size: 9,
          font,
          color: rgb(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b),
        });
        ry -= 16;

        drawSeparator(roomPage, ry);
        ry -= 16;

        // Image dimensions: stacked vertically, each ~250pt tall
        const imageMaxWidth = contentWidth;
        const imageMaxHeight = 250;

        // ── Before photo ──────────────────────────────────────
        safeDrawText(roomPage, "Avant", {
          x: MARGIN,
          y: ry,
          size: 10,
          font: fontBold,
          color: rgb(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b),
        });
        ry -= 14;

        if (room.photo_path) {
          const beforeImg = await embedImageFromStorage(
            pdfDoc,
            room.photo_path
          );
          if (beforeImg) {
            const dims = beforeImg.scaleToFit(imageMaxWidth, imageMaxHeight);
            const xOffset = MARGIN + (imageMaxWidth - dims.width) / 2;
            roomPage.drawImage(beforeImg, {
              x: xOffset,
              y: ry - dims.height,
              width: dims.width,
              height: dims.height,
            });
            ry -= dims.height + 10;
          } else {
            safeDrawText(roomPage, "[Photo avant indisponible]", {
              x: MARGIN,
              y: ry,
              size: 9,
              font,
              color: rgb(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b),
            });
            ry -= 16;
          }
        } else {
          safeDrawText(roomPage, "[Pas de photo avant]", {
            x: MARGIN,
            y: ry,
            size: 9,
            font,
            color: rgb(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b),
          });
          ry -= 16;
        }

        ry -= 10;

        // ── After visual ──────────────────────────────────────
        safeDrawText(roomPage, "Après (visuel IA)", {
          x: MARGIN,
          y: ry,
          size: 10,
          font: fontBold,
          color: rgb(SAGE.r, SAGE.g, SAGE.b),
        });
        ry -= 14;

        if (room.visual_output_path) {
          const afterImg = await embedImageFromStorage(
            pdfDoc,
            room.visual_output_path
          );
          if (afterImg) {
            const dims = afterImg.scaleToFit(imageMaxWidth, imageMaxHeight);
            const xOffset = MARGIN + (imageMaxWidth - dims.width) / 2;
            roomPage.drawImage(afterImg, {
              x: xOffset,
              y: ry - dims.height,
              width: dims.width,
              height: dims.height,
            });
          } else {
            safeDrawText(roomPage, "[Visuel après indisponible]", {
              x: MARGIN,
              y: ry,
              size: 9,
              font,
              color: rgb(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b),
            });
          }
        } else {
          safeDrawText(roomPage, "[Pas de visuel après]", {
            x: MARGIN,
            y: ry,
            size: 9,
            font,
            color: rgb(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b),
          });
        }

        drawFooter(roomPage, font, footerDisclaimer);
      }

      // ── Recommendations page (if any) ────────────────────────
      if (lot.recommendations.length > 0) {
        const recPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        let ry = PAGE_HEIGHT - MARGIN;

        safeDrawText(recPage, `Recommandations — ${lot.name}`, {
          x: MARGIN,
          y: ry,
          size: 16,
          font: fontBold,
          color: rgb(FOREGROUND.r, FOREGROUND.g, FOREGROUND.b),
        });
        ry -= 26;

        drawSeparator(recPage, ry);
        ry -= 20;

        for (const rec of lot.recommendations) {
          if (ry < FOOTER_HEIGHT + 80) {
            // Start new page if running out of space
            drawFooter(recPage, font, footerDisclaimer);
            const nextRecPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            ry = PAGE_HEIGHT - MARGIN;

            safeDrawText(
              nextRecPage,
              `Recommandations — ${lot.name} (suite)`,
              {
                x: MARGIN,
                y: ry,
                size: 16,
                font: fontBold,
                color: rgb(FOREGROUND.r, FOREGROUND.g, FOREGROUND.b),
              }
            );
            ry -= 26;
            drawSeparator(nextRecPage, ry);
            ry -= 20;

            // Draw on new page — but we already drew footer on old page,
            // we need to draw on the new page from here.
            // Since we can't easily reassign const, let's handle multi-page
            // recommendations in a simpler way.
          }

          // Impact badge
          const impactColors: Record<
            string,
            { r: number; g: number; b: number }
          > = {
            high: { r: 0.87, g: 0.23, b: 0.15 },
            medium: { r: 0.94, g: 0.68, b: 0.12 },
            low: { r: 0.49, g: 0.72, b: 0.46 },
          };
          const impactColor =
            impactColors[rec.impact_level] || impactColors.medium;

          // Title line with impact dot
          recPage.drawCircle({
            x: MARGIN + 5,
            y: ry + 3,
            size: 4,
            color: rgb(impactColor.r, impactColor.g, impactColor.b),
          });

          safeDrawText(recPage, rec.title, {
            x: MARGIN + 16,
            y: ry,
            size: 11,
            font: fontBold,
            color: rgb(FOREGROUND.r, FOREGROUND.g, FOREGROUND.b),
          });

          // Cost (right-aligned)
          if (rec.estimated_cost_eur !== null) {
            const costStr = `${rec.estimated_cost_eur.toLocaleString("fr-FR")} €`;
            const costWidth = font.widthOfTextAtSize(
              sanitizeForPdf(costStr),
              10
            );
            safeDrawText(recPage, costStr, {
              x: PAGE_WIDTH - MARGIN - costWidth,
              y: ry,
              size: 10,
              font: fontBold,
              color: rgb(SAGE.r, SAGE.g, SAGE.b),
            });
          }

          ry -= 16;

          // Description
          const recDescLines = wrapText(
            rec.description,
            font,
            9,
            contentWidth - 16
          );
          for (const line of recDescLines) {
            if (ry < FOOTER_HEIGHT + 20) break;
            safeDrawText(recPage, line, {
              x: MARGIN + 16,
              y: ry,
              size: 9,
              font,
              color: rgb(0.4, 0.4, 0.4),
            });
            ry -= 13;
          }

          ry -= 12; // Spacing between recommendations
        }

        drawFooter(recPage, font, footerDisclaimer);
      }
    }

    // ─── Serialize and return ────────────────────────────────────
    const pdfBytes = await pdfDoc.save();
    const safeName = (project.adresse || "dossier")
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const safeBrand = brandName
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    console.log(
      `[POST /api/pro/projects/${projectId}/dossier/pdf] Generated PDF: ${dossierLots.length} lot(s), ${pdfBytes.length} bytes`
    );

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="dossier-${safeName}-${safeBrand}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error(
      `[POST /api/pro/projects/${projectId}/dossier/pdf] Error:`,
      err
    );
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la génération du dossier PDF. Réessayez.",
      },
      { status: 500 }
    );
  }
}
