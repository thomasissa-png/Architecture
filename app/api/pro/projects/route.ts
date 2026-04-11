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

// ─── GET handler ────────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "Connexion requise." },
      { status: 401 }
    );
  }

  try {
    await ensureProTables();
    const db = getPool();

    // Fetch all projects for this user
    const projectsResult = await db.query(
      `SELECT id, adresse, type_bien, status, created_at, updated_at
       FROM pro_projects
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [session.user.id]
    );

    const projects = projectsResult.rows;

    if (projects.length === 0) {
      return NextResponse.json([]);
    }

    // Get room counts per project in a single query
    const projectIds = projects.map((p: { id: string }) => p.id);
    const roomCountsResult = await db.query(
      `SELECT project_id, COUNT(*)::int as room_count
       FROM pro_rooms
       WHERE project_id = ANY($1)
       GROUP BY project_id`,
      [projectIds]
    );

    const roomCountMap = new Map<string, number>();
    for (const row of roomCountsResult.rows) {
      roomCountMap.set(row.project_id, row.room_count);
    }

    const enrichedProjects = projects.map((p: { id: string; adresse: string; type_bien: string; status: string; created_at: string; updated_at: string }) => ({
      ...p,
      room_count: roomCountMap.get(p.id) ?? 0,
    }));

    return NextResponse.json(enrichedProjects);
  } catch (err) {
    console.error("[GET /api/pro/projects] Error:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Erreur lors de la récupération des projets." },
      { status: 500 }
    );
  }
}

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

    // ─── Plan file(s) validation ────────────────────────────────────
    // Supports single file (plan_file) and multiple files (plan_file[])
    const rawPlanFiles = formData.getAll("plan_file");
    const planFiles = rawPlanFiles.filter(
      (f): f is File => f instanceof File && f.size > 0
    );

    if (planFiles.length === 0) {
      return NextResponse.json(
        { error: "PLAN_REQUIRED", message: "Le plan du bien est obligatoire." },
        { status: 400 }
      );
    }

    if (planFiles.length > 10) {
      return NextResponse.json(
        { error: "TOO_MANY_FILES", message: "Maximum 10 fichiers de plan." },
        { status: 400 }
      );
    }

    for (const planFile of planFiles) {
      if (planFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: "FILE_TOO_LARGE",
            message: `Le fichier "${planFile.name}" dépasse 20 Mo.`,
          },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES.has(planFile.type)) {
        return NextResponse.json(
          {
            error: "INVALID_TYPE",
            message: `Format non accepté pour "${planFile.name}". Formats acceptés : PDF, JPG, PNG, WEBP, HEIC.`,
          },
          { status: 400 }
        );
      }
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

    // ─── Upload plan(s) to Object Storage ───────────────────────────
    const storagePaths: string[] = [];
    const mimeTypes: string[] = [];

    for (let i = 0; i < planFiles.length; i++) {
      const planFile = planFiles[i];
      const fileBuffer = Buffer.from(await planFile.arrayBuffer());
      const ext = planFile.type === "application/pdf" ? "pdf"
        : planFile.type === "image/png" ? "png"
        : planFile.type === "image/webp" ? "webp"
        : planFile.type === "image/heic" || planFile.type === "image/heif" ? "heic"
        : "jpg";

      // Single file: pro/{id}/plan.jpg — Multi-file: pro/{id}/plan-0.jpg, plan-1.jpg
      const storageKey = planFiles.length === 1
        ? `pro/${projectId}/plan.${ext}`
        : `pro/${projectId}/plan-${i}.${ext}`;

      await withStorageRetry(
        (client) => client.uploadFromBytes(storageKey, fileBuffer),
        `uploadPlan(${storageKey})`
      );

      // For PDFs: also generate a PNG preview for the extraction page
      if (planFile.type === "application/pdf") {
        try {
          const { pdf: pdfToImg } = await import("pdf-to-img");
          const pages = await pdfToImg(fileBuffer, { scale: 2 });
          for await (const page of pages) {
            const previewKey = storageKey.replace(/\.pdf$/i, "-preview.png");
            await withStorageRetry(
              (client) => client.uploadFromBytes(previewKey, Buffer.from(page)),
              `uploadPlanPreview(${previewKey})`
            );
            break; // First page only
          }
        } catch (previewErr) {
          console.warn("[projects] PDF preview generation failed (non-blocking):", previewErr);
        }
      }

      storagePaths.push(storageKey);
      mimeTypes.push(planFile.type);
    }

    // Store as single string for 1 file, JSON array for multiple
    const planFilePath = storagePaths.length === 1
      ? storagePaths[0]
      : JSON.stringify(storagePaths);
    const planMimeType = mimeTypes.length === 1
      ? mimeTypes[0]
      : JSON.stringify(mimeTypes);

    // Validate total path length before storing (DB column limit safety)
    if (planFilePath.length > 2000) {
      return NextResponse.json(
        {
          error: "PATH_TOO_LONG",
          message: "Trop de fichiers uploadés. Le chemin de stockage dépasse la limite autorisée. Réduisez le nombre de fichiers.",
        },
        { status: 400 }
      );
    }

    // Update project with file path(s)
    await db.query(
      `UPDATE pro_projects SET plan_file_path = $1, plan_mime_type = $2 WHERE id = $3`,
      [planFilePath, planMimeType, projectId]
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
