export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSessionRobust } from "@/lib/session";
import { getPool } from "@/lib/db";

// ─── Rate Limiting (in-memory, IP-based, 5 req/h) ──────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 3_600_000; // 1 hour
const RATE_LIMIT_MAX = 5;

function checkSupportRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, ip) => {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  });
}, 600_000);

// ─── Ensure support_requests table ──────────────────────────────────
let tableEnsured = false;

async function ensureSupportTable(): Promise<void> {
  if (tableEnsured) return;
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS support_requests (
      id              SERIAL PRIMARY KEY,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_id         VARCHAR(100),
      email           VARCHAR(255) NOT NULL,
      category        VARCHAR(100) NOT NULL,
      message         TEXT NOT NULL,
      screenshot_key  TEXT,
      email_sent      BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);
  tableEnsured = true;
}

// ─── Validation ─────────────────────────────────────────────────────
const VALID_CATEGORIES = [
  "Problème de génération",
  "Facturation/crédits",
  "Suggestion",
  "Question",
  "Autre question",
];

// ─── POST handler ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getSessionRobust(request);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Rate limit
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (!checkSupportRateLimit(ip)) {
      return NextResponse.json(
        { error: "Trop de messages envoyés. Réessayez dans une heure." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // Parse body
    const body = await request.json();
    const { category, message, screenshot } = body as {
      category?: string;
      message?: string;
      screenshot?: string;
    };

    // Validate category
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Catégorie invalide" },
        { status: 400 }
      );
    }

    // Validate message
    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message trop court (10 caractères minimum)" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message trop long (2000 caractères maximum)" },
        { status: 400 }
      );
    }

    // Validate screenshot if present
    if (screenshot) {
      // Check it's a valid base64 data URI for jpg/png
      if (
        !screenshot.startsWith("data:image/jpeg;base64,") &&
        !screenshot.startsWith("data:image/png;base64,")
      ) {
        return NextResponse.json(
          { error: "Format non supporté (JPG ou PNG uniquement)" },
          { status: 400 }
        );
      }
      // Check size (~5MB in base64 is ~6.67MB string)
      const sizeEstimate = (screenshot.length * 3) / 4;
      if (sizeEstimate > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Fichier trop lourd (max 5 Mo)" },
          { status: 400 }
        );
      }
    }

    const userEmail = session.user.email;
    const userId = (session.user as { id?: string }).id || null;

    // Try sending email via Resend
    let emailSent = false;
    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey && resendKey !== "..." && !resendKey.startsWith("re_placeholder")) {
      try {
        const attachments: Array<{ filename: string; content: string }> = [];
        if (screenshot) {
          const base64Data = screenshot.split(",")[1];
          const isJpeg = screenshot.startsWith("data:image/jpeg");
          attachments.push({
            filename: `screenshot.${isJpeg ? "jpg" : "png"}`,
            content: base64Data,
          });
        }

        const emailBody: Record<string, unknown> = {
          from: "Versimo Support <support@versimo.fr>",
          to: ["contact@versimo.fr"],
          reply_to: userEmail,
          subject: `[Versimo Support] ${category} — ${userEmail}`,
          html: `
            <h2>Nouveau message de support</h2>
            <p><strong>De :</strong> ${userEmail}</p>
            <p><strong>Catégorie :</strong> ${category}</p>
            <p><strong>Message :</strong></p>
            <p>${message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\n/g, "<br>")}</p>
            ${screenshot ? "<p><em>Capture d'écran en pièce jointe</em></p>" : ""}
          `,
        };

        if (attachments.length > 0) {
          emailBody.attachments = attachments;
        }

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailBody),
          signal: AbortSignal.timeout(10_000),
        });

        emailSent = resendRes.ok;
        if (!emailSent) {
          console.error(
            "[support] Resend error:",
            resendRes.status,
            await resendRes.text().catch(() => "")
          );
        }
      } catch (err) {
        console.error("[support] Resend fetch failed:", err);
      }
    } else {
      console.log(
        "[support] No RESEND_API_KEY — logging to DB only.",
        { email: userEmail, category, messageLength: message.length }
      );
    }

    // Save screenshot to Object Storage if provided
    let screenshotKey: string | null = null;
    if (screenshot) {
      try {
        const { saveImage } = await import("@/lib/db");
        const ssBase64 = screenshot.replace(/^data:image\/[\w+]+;base64,/, "");
        screenshotKey = await saveImage(ssBase64, `support_${Date.now()}_screenshot`);
      } catch (err) {
        console.error("[support] screenshot save failed:", err);
      }
    }

    // Always save to DB (fallback + audit trail)
    let ticketId: number | null = null;
    try {
      await ensureSupportTable();
      const db = getPool();
      const result = await db.query(
        `INSERT INTO support_requests (user_id, email, category, message, screenshot_key, email_sent)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          userId,
          userEmail,
          category,
          message.trim(),
          screenshotKey,
          emailSent,
        ]
      );
      ticketId = result.rows[0]?.id ?? null;
    } catch (dbErr) {
      console.error("[support] DB save failed:", dbErr);
      // If both email and DB fail, return error
      if (!emailSent) {
        return NextResponse.json(
          { error: "Erreur serveur" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, ticketId: ticketId || Date.now() });
  } catch (err) {
    console.error("[support] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
