/**
 * POST /api/pro/projects — Créer un projet marchand
 *
 * Rendu : SSR (force-dynamic) — données utilisateur authentifié.
 *
 * Auth obligatoire (NextAuth session cookie).
 * Accepte multipart/form-data : adresse, type_bien, surface_totale, plan_file.
 * Crée le projet en DB, stocke le plan dans Object Storage.
 * Dédoublonnage sur (user_id, adresse, created_at < 5s).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPool, withStorageRetry } from "@/lib/db";
import { ensureProTables } from "@/lib/marchand/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

// ─── Validation schemas ─────────────────────────────────────────────

const TypeBienEnum = z.enum([
  "immeuble", "appartement", "maison", "bureaux", "local_commercial",
]);

const CreateProjectSchema = z.object({
  adresse: z.string().min(5, "L'adresse doit contenir au moins 5 caractères.").max(200),
  type_bien: TypeBienEnum,
  surface_totale: z.number().positive().max(10000).nullable().optional(),
});

// ─── Rate limit: 10 projets/heure par user ──────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// Cleanup toutes les 10 min
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  });
}, 600_000);

// ─── Allowed MIME types for plan upload ─────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 Mo

// ─── POST handler ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "Connexion requise." },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // Rate limit
  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { error: "RATE_LIMIT", message: "Trop de projets créés. Réessayez dans une heure." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  try {
    const formData = await request.formData();

    // ─── Parse text fields ────────────────────────────────────────
    const rawFields = {
      adresse: formData.get("adresse") as string | null,
      type_bien: formData.get("type_bien") as string | null,
      surface_totale: formData.get("surface_totale")
        ? Number(formData.get("surface_totale"))
        : null,
    };

    const parsed = CreateProjectSchema.safeParse({
      adresse: rawFields.adresse,
      type_bien: rawFields.type_bien,
      surface_totale: rawFields.surface_totale,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "VALIDATION_ERROR", fields: fieldErrors },
        { status: 400 }
      );
    }

    const { adresse, type_bien, surface_totale } = parsed.data;

    // ─── Plan file validation ─────────────────────────────────────
    const planFile = formData.get("plan_file") as File | null;

    if (!planFile || planFile.size === 0) {
      return NextResponse.json(
        { error: "PLAN_REQUIRED", message: "Le plan du bien est obligatoire." },
        { status: 400 }
      );
    }

    if (planFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "FILE_TOO_LARGE", message: "Le fichier ne doit pas dépasser 20 Mo." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(planFile.type)) {
      return NextResponse.json(
        {
          error: "INVALID_TYPE",
          message: "Format accepté : PDF, JPG, PNG, WEBP, HEIC.",
        },
        { status: 400 }
      );
    }

    // ─── Ensure pro tables exist ─────────────────────────────────
    await ensureProTables();

    // ─── Deduplication check (same user, same address, < 5s) ──────
    const db = getPool();
    const dedup = await db.query(
      `SELECT id FROM pro_projects
       WHERE user_id = $1 AND adresse = $2 AND created_at > NOW() - INTERVAL '5 seconds'
       LIMIT 1`,
      [userId, adresse]
    );

    if (dedup.rows.length > 0) {
      return NextResponse.json(
        {
          project_id: dedup.rows[0].id,
          status: "plan_uploaded",
          deduplicated: true,
        },
        { status: 200 }
      );
    }

    // ─── Insert project in DB ─────────────────────────────────────
    const insertResult = await db.query(
      `INSERT INTO pro_projects (user_id, adresse, type_bien, surface_totale, status)
       VALUES ($1, $2, $3, $4, 'plan_uploaded')
       RETURNING id, status, created_at`,
      [userId, adresse, type_bien, surface_totale ?? null]
    );

    const projectId = insertResult.rows[0].id as string;

    // ─── Upload plan to Object Storage ────────────────────────────
    const fileBuffer = Buffer.from(await planFile.arrayBuffer());
    const ext = planFile.type === "application/pdf" ? "pdf"
      : planFile.type === "image/png" ? "png"
      : planFile.type === "image/webp" ? "webp"
      : planFile.type === "image/heic" || planFile.type === "image/heif" ? "heic"
      : "jpg";

    const storageKey = `pro/${projectId}/plan.${ext}`;

    await withStorageRetry(
      (client) => client.uploadFromBytes(storageKey, fileBuffer),
      `uploadPlan(${storageKey})`
    );

    // Update project with file path
    await db.query(
      `UPDATE pro_projects SET plan_file_path = $1, plan_mime_type = $2 WHERE id = $3`,
      [storageKey, planFile.type, projectId]
    );

    // ─── Auto-create lot for non-immeuble ─────────────────────────
    if (type_bien !== "immeuble") {
      await db.query(
        `INSERT INTO pro_lots (project_id, name, floor, status)
         VALUES ($1, $2, 0, 'pending')`,
        [projectId, `${type_bien === "appartement" ? "Appartement" : type_bien === "maison" ? "Maison" : "Lot"} principal`]
      );
    }

    console.log(`[POST /api/pro/projects] Created project ${projectId} for user ${userId} — ${type_bien} at ${adresse}`);

    return NextResponse.json(
      { project_id: projectId, status: "plan_uploaded" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/pro/projects] Error:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Erreur lors de la création du projet. Réessayez." },
      { status: 500 }
    );
  }
}
