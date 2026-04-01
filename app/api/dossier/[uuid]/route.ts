/**
 * F4 — Mode Pro (ex Mode Marchand): Dossier detail, photo upload, and batch generation.
 *
 * GET /api/dossier/[uuid] — Get dossier details + photos
 * POST /api/dossier/[uuid] — Add photos to dossier
 * PATCH /api/dossier/[uuid] — Launch batch generation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserCredits, decrementCredit, addCredits } from "@/lib/credits";
import { saveImage, getImage } from "@/lib/db";
import {
  getDossierByUuid,
  getDossierPhotos,
  addDossierPhoto,
  updateDossierStatus,
  updateDossierInfo,
  updateDossierPhotoStatus,
  updateDossierPhotoStyle,
  incrementIterationCount,
  isDossierExpired,
  MAX_PHOTOS_PER_DOSSIER,
  MAX_CONCURRENT_GENERATIONS,
} from "@/lib/dossier";
import { generateDossierPdf } from "@/lib/pdf-generator";

export const dynamic = "force-dynamic";

/** Fire-and-forget PDF generation after dossier completion */
async function generateDossierPdfBackground(uuid: string, slug?: string | null) {
  try {
    const pdfKey = await generateDossierPdf(uuid, slug);
    if (pdfKey) {
      await updateDossierStatus(uuid, "completed", { pdfStorageKey: pdfKey });
      console.log(`[PDF] Stored for dossier ${uuid}: ${pdfKey}`);
    }
  } catch (err) {
    console.error(`[PDF] Background generation error for ${uuid}:`, err);
  }
}

// ─── GET: Dossier details + photos ───────────────────────────────────
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

  return NextResponse.json({ dossier, photos });
}

// ─── POST: Add photos to dossier ────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401 }
    );
  }

  const { uuid } = params;
  const dossier = await getDossierByUuid(uuid);

  if (!dossier) {
    return NextResponse.json(
      { error: "Dossier introuvable." },
      { status: 404 }
    );
  }

  if (dossier.user_id !== session.user.id) {
    return NextResponse.json(
      { error: "Acces refuse." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { photos } = body as {
      photos: Array<{
        image: string; // base64
        roomLabel?: string;
        roomTypeId?: string;
        styleId?: string;
        customPrompt?: string;
        isOutdoor?: boolean;
        outdoorStyleId?: string;
        outdoorSubtype?: string;
        photoIndex: number;
      }>;
    };

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { error: "Aucune photo fournie." },
        { status: 400 }
      );
    }

    // Check total photo limit
    const existingPhotos = await getDossierPhotos(uuid);
    if (existingPhotos.length + photos.length > MAX_PHOTOS_PER_DOSSIER) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS_PER_DOSSIER} photos par dossier.` },
        { status: 400 }
      );
    }

    const addedPhotos = [];
    for (const photo of photos) {
      const base64 = photo.image.replace(/^data:image\/[\w+]+;base64,/, "");
      const imageKey = await saveImage(
        base64,
        `dossier_${uuid}_${photo.photoIndex}_input`
      );

      const dossierPhoto = await addDossierPhoto({
        dossierUuid: uuid,
        photoIndex: photo.photoIndex,
        roomLabel: photo.roomLabel,
        roomTypeId: photo.roomTypeId,
        styleId: photo.styleId || dossier.global_style_id || undefined,
        customPrompt: photo.customPrompt,
        isOutdoor: photo.isOutdoor,
        outdoorStyleId: photo.outdoorStyleId,
        outdoorSubtype: photo.outdoorSubtype,
        inputImageKey: imageKey,
      });

      addedPhotos.push(dossierPhoto);
    }

    return NextResponse.json({ photos: addedPhotos }, { status: 201 });
  } catch (err) {
    console.error("Error adding photos to dossier:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout des photos." },
      { status: 500 }
    );
  }
}

// ─── PATCH: Launch batch generation or update photo styles ──────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401 }
    );
  }

  const { uuid } = params;
  const dossier = await getDossierByUuid(uuid);

  if (!dossier) {
    return NextResponse.json(
      { error: "Dossier introuvable." },
      { status: 404 }
    );
  }

  if (dossier.user_id !== session.user.id) {
    return NextResponse.json(
      { error: "Acces refuse." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { action, photoId, styleId, isOutdoor, regeneratePhotoId } = body as {
      action: "generate" | "update_style" | "regenerate" | "attach" | "iterate";
      photoId?: number;
      styleId?: string;
      isOutdoor?: boolean;
      regeneratePhotoId?: number;
    };

    // ── Attach dossier to property (post-generation) ──
    if (action === "attach") {
      const {
        bienAdresse, bienNom, bienSurface, bienPrix, bienType,
        latitude, longitude, ville, codePostal,
        descriptionCommerciale, carteImageKey, prixMoyenM2, propertyId,
      } = body;

      await updateDossierInfo(uuid, {
        bienNom: bienNom || null,
        bienAdresse: bienAdresse || null,
        bienSurface: bienSurface ? Number(bienSurface) : null,
        bienPrix: bienPrix ? Number(bienPrix) : null,
        bienType: bienType || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        ville: ville || null,
        codePostal: codePostal || null,
        descriptionCommerciale: descriptionCommerciale || null,
        carteImageKey: carteImageKey || null,
        prixMoyenM2: prixMoyenM2 ? Number(prixMoyenM2) : null,
      });

      // Auto-create property if address provided and no propertyId
      if (bienAdresse && !propertyId) {
        const { findOrCreatePropertyByAddress } = await import("@/lib/properties");
        findOrCreatePropertyByAddress(session.user.id, bienAdresse, {
          propertyType: bienType || null,
          surfaceM2: bienSurface ? Number(bienSurface) : null,
          salePrice: bienPrix ? Number(bienPrix) : null,
        }).catch((err: unknown) => {
          console.error("Auto-create property on attach failed:", err);
        });
      }

      return NextResponse.json({ success: true });
    }

    // ── Update individual photo style ──
    if (action === "update_style" && photoId && styleId) {
      await updateDossierPhotoStyle(photoId, styleId, isOutdoor ?? false);
      return NextResponse.json({ success: true });
    }

    // ── Iterate (refine) single photo — 3 iterations max, free ──
    if (action === "iterate" && body.iteratePhotoId) {
      const { iteratePhotoId, comment, previousModifications } = body as {
        iteratePhotoId: number;
        comment: string;
        previousModifications?: string[];
      };

      if (!comment?.trim()) {
        return NextResponse.json(
          { error: "Décrivez l'ajustement souhaité." },
          { status: 400 }
        );
      }

      const photos = await getDossierPhotos(uuid);
      const targetPhoto = photos.find((p) => p.id === iteratePhotoId);
      if (!targetPhoto) {
        return NextResponse.json(
          { error: "Photo introuvable." },
          { status: 404 }
        );
      }

      if (!targetPhoto.output_image_key) {
        return NextResponse.json(
          { error: "Cette photo n'a pas encore été générée." },
          { status: 400 }
        );
      }

      if (!targetPhoto.pass1_image_key) {
        return NextResponse.json(
          { error: "Les surfaces de cette génération ont expiré. Regénérez depuis l'image originale." },
          { status: 400 }
        );
      }

      // Check iteration limit (3 max)
      const currentIterations = targetPhoto.iteration_count ?? 0;
      if (currentIterations >= 3) {
        return NextResponse.json(
          { error: "Maximum 3 itérations atteint. Regénérez pour repartir de zéro." },
          { status: 400 }
        );
      }

      const startTime = Date.now();
      try {
        // The generate API reads pass1 from storage via pass1_key — no need to read it here
        // Just need to verify it exists
        const pass1Exists = await getImage(targetPhoto.pass1_image_key);
        if (!pass1Exists) {
          throw new Error("Image surfaces (passe 1) introuvable dans le stockage.");
        }

        // Resolve style prompts for iteration
        const effectiveStyleId = targetPhoto.is_outdoor
          ? (targetPhoto.outdoor_style_id || targetPhoto.style_id || dossier.global_style_id || "scandinavian")
          : (targetPhoto.style_id || dossier.global_style_id || "scandinavian");

        let surfacePrompt = "";
        let furniturePrompt = "";
        if (effectiveStyleId === "custom") {
          surfacePrompt = targetPhoto.custom_prompt || "";
          furniturePrompt = targetPhoto.custom_prompt || "";
        } else {
          const { getStyleById } = await import("@/lib/style-resolver");
          const style = getStyleById(effectiveStyleId, targetPhoto.is_outdoor);
          if (style) {
            surfacePrompt = style.surfacePrompt;
            furniturePrompt = style.furniturePrompt;
          }
        }

        // Call generate API with iteration parameters (same as F1 iteration)
        const generateUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/generate`;

        const response = await fetch(generateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Dossier": "true",
            "X-Internal-Secret": process.env.INTERNAL_API_SECRET || "",
          },
          body: JSON.stringify({
            pass1_key: targetPhoto.pass1_image_key,
            iterationComment: comment.trim(),
            previousModifications: previousModifications || [],
            surfacePrompt,
            furniturePrompt,
            styleId: effectiveStyleId,
            withFurniture: true,
            width: 0,
            height: 0,
            roomType: targetPhoto.room_type_id,
            isOutdoor: targetPhoto.is_outdoor,
            outdoorSubtype: targetPhoto.outdoor_subtype || undefined,
            _skipCreditCheck: true,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Iteration failed (${response.status})`);
        }

        const data = await response.json();

        // Save iterated output
        const outputBase64 = data.image.replace(/^data:image\/[\w+]+;base64,/, "");
        const outputKey = await saveImage(
          outputBase64,
          `dossier_${dossier.uuid}_${targetPhoto.photo_index}_iter${currentIterations + 1}`
        );

        // Update photo with new output + increment iteration count
        await updateDossierPhotoStatus(targetPhoto.id, "completed", {
          outputImageKey: outputKey,
          durationMs: Date.now() - startTime,
        });
        const newCount = await incrementIterationCount(targetPhoto.id);

        return NextResponse.json({
          success: true,
          image: data.image,
          iterationCount: newCount,
          iterationsRemaining: 3 - newCount,
        });
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Erreur lors de l'itération." },
          { status: 500 }
        );
      }
    }

    // ── Regenerate single photo ──
    if (action === "regenerate" && regeneratePhotoId) {
      // Check credits
      const credits = await getUserCredits(session.user.id);
      if (credits < 1) {
        return NextResponse.json(
          { error: "Plus de visuels disponibles pour regénérer." },
          { status: 402 }
        );
      }

      const photos = await getDossierPhotos(uuid);
      const targetPhoto = photos.find((p) => p.id === regeneratePhotoId);
      if (!targetPhoto) {
        return NextResponse.json(
          { error: "Photo introuvable." },
          { status: 404 }
        );
      }

      // Decrement credit
      const decremented = await decrementCredit(session.user.id);
      if (!decremented) {
        return NextResponse.json(
          { error: "Plus de visuels disponibles." },
          { status: 402 }
        );
      }

      // Generate single photo
      const startTime = Date.now();
      try {
        await updateDossierPhotoStatus(targetPhoto.id, "generating");
        const result = await generateSinglePhoto(targetPhoto, dossier);
        await updateDossierPhotoStatus(targetPhoto.id, "completed", {
          outputImageKey: result.outputKey,
          pass1ImageKey: result.pass1Key,
          durationMs: Date.now() - startTime,
        });
        // Reset iteration count on full regeneration (back to 0, 3 iterations available)
        const { getPool: getDbPool } = await import("@/lib/db");
        await getDbPool().query(`UPDATE dossier_photos SET iteration_count = 0 WHERE id = $1`, [targetPhoto.id]);
        return NextResponse.json({ success: true, photo: targetPhoto });
      } catch (err) {
        // Refund credit on failure
        await addCredits(session.user.id, 1);
        await updateDossierPhotoStatus(targetPhoto.id, "failed", {
          errorMessage: err instanceof Error ? err.message : "Erreur inconnue",
          durationMs: Date.now() - startTime,
        });
        return NextResponse.json(
          { error: "Échec de la régénération." },
          { status: 500 }
        );
      }
    }

    // ── Launch batch generation ──
    if (action === "generate") {
      const photos = await getDossierPhotos(uuid);
      const pendingPhotos = photos.filter((p) => p.status === "pending" || p.status === "failed");

      if (pendingPhotos.length === 0) {
        return NextResponse.json(
          { error: "Aucune photo en attente de generation." },
          { status: 400 }
        );
      }

      // Check credits for all pending photos
      const credits = await getUserCredits(session.user.id);
      if (credits < pendingPhotos.length) {
        return NextResponse.json(
          {
            error: `Plus de visuels disponibles. ${pendingPhotos.length} credits necessaires, ${credits} disponibles.`,
            creditsNeeded: pendingPhotos.length,
            creditsAvailable: credits,
          },
          { status: 402 }
        );
      }

      // Set dossier to generating
      await updateDossierStatus(uuid, "generating");

      // Start batch generation in background (non-blocking response)
      // The client will poll GET /api/dossier/[uuid] for progress
      processBatchGeneration(uuid, pendingPhotos, dossier, session.user.id).catch(
        (err) => console.error("Batch generation error:", err)
      );

      return NextResponse.json({
        status: "generating",
        totalPhotos: pendingPhotos.length,
      });
    }

    return NextResponse.json(
      { error: "Action invalide." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Error in dossier PATCH:", err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

// ─── Batch processing with semaphore ─────────────────────────────────

import type { DossierPhoto, Dossier } from "@/lib/dossier";

async function generateSinglePhoto(
  photo: DossierPhoto,
  dossier: Dossier
): Promise<{ outputKey: string; pass1Key?: string }> {
  // Read input image from storage
  const inputImageData = await getImage(photo.input_image_key!);
  if (!inputImageData) {
    throw new Error("Image input introuvable dans le stockage.");
  }

  const inputBase64 = Buffer.from(inputImageData).toString("base64");

  // Detect image dimensions from JPEG/PNG header for correct aspect ratio
  let imgWidth = 1536;
  let imgHeight = 1024;
  try {
    const buf = Buffer.from(inputImageData);
    // JPEG: find SOF0 marker (0xFF 0xC0) — height at offset+5, width at offset+7
    if (buf[0] === 0xFF && buf[1] === 0xD8) {
      let offset = 2;
      while (offset < buf.length - 8) {
        if (buf[offset] === 0xFF && (buf[offset + 1] === 0xC0 || buf[offset + 1] === 0xC2)) {
          imgHeight = buf.readUInt16BE(offset + 5);
          imgWidth = buf.readUInt16BE(offset + 7);
          break;
        }
        const segLen = buf.readUInt16BE(offset + 2);
        offset += 2 + segLen;
      }
    }
    // PNG: width at byte 16, height at byte 20
    else if (buf[0] === 0x89 && buf[1] === 0x50) {
      imgWidth = buf.readUInt32BE(16);
      imgHeight = buf.readUInt32BE(20);
    }
  } catch {
    // Fallback to landscape defaults
  }
  // Map to closest OpenAI-compatible size
  const ratio = imgWidth / imgHeight;
  const outputWidth = ratio > 1.3 ? 1536 : ratio < 0.77 ? 1024 : 1024;
  const outputHeight = ratio > 1.3 ? 1024 : ratio < 0.77 ? 1536 : 1024;

  // Resolve style prompts — use outdoor_style_id for outdoor photos (BUG-2 fix)
  const effectiveStyleId = photo.is_outdoor
    ? (photo.outdoor_style_id || photo.style_id || dossier.global_style_id || "scandinavian")
    : (photo.style_id || dossier.global_style_id || "scandinavian");

  // Call the generate API internally
  const generateUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/generate`;

  let surfacePrompt: string;
  let furniturePrompt: string;

  if (effectiveStyleId === "custom") {
    // Custom style: use stored custom_prompt, preprocess it via GPT-4.1-mini
    const rawPrompt = photo.custom_prompt || "";

    if (!rawPrompt.trim()) {
      throw new Error("Le prompt personnalisé est vide. Décrivez le style souhaité avant de lancer la génération.");
    }

    surfacePrompt = rawPrompt;
    furniturePrompt = rawPrompt;

    if (rawPrompt) {
      try {
        const preprocessUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/preprocess-prompt`;
        const ppRes = await fetch(preprocessUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: rawPrompt }),
        });
        if (ppRes.ok) {
          const ppData = await ppRes.json();
          if (ppData.surfacePrompt) surfacePrompt = ppData.surfacePrompt;
          if (ppData.furniturePrompt) furniturePrompt = ppData.furniturePrompt;
        }
      } catch {
        // Fallback to raw prompt — already set above
      }
    }
  } else {
    // Named style: resolve from style-resolver
    const { getStyleById } = await import("@/lib/style-resolver");
    const style = getStyleById(effectiveStyleId, photo.is_outdoor);

    if (!style) {
      throw new Error(`Style introuvable: ${effectiveStyleId}`);
    }
    surfacePrompt = style.surfacePrompt;
    furniturePrompt = style.furniturePrompt;
  }

  // Call generate API with internal fetch
  const response = await fetch(generateUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Dossier": "true",
      "X-Internal-Secret": process.env.INTERNAL_API_SECRET || "",
    },
    body: JSON.stringify({
      image: `data:image/jpeg;base64,${inputBase64}`,
      surfacePrompt,
      furniturePrompt,
      styleId: effectiveStyleId,
      withFurniture: true,
      width: outputWidth,
      height: outputHeight,
      roomType: photo.room_type_id,
      isOutdoor: photo.is_outdoor,
      outdoorSubtype: photo.outdoor_subtype || undefined,
      _skipCreditCheck: true, // Internal flag
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Generation failed (${response.status})`);
  }

  const data = await response.json();

  // Save output image to storage
  const outputBase64 = data.image.replace(/^data:image\/[\w+]+;base64,/, "");
  const outputKey = await saveImage(
    outputBase64,
    `dossier_${dossier.uuid}_${photo.photo_index}_output`
  );

  return { outputKey, pass1Key: data.pass1_key };
}

async function processBatchGeneration(
  dossierUuid: string,
  photos: DossierPhoto[],
  dossier: Dossier,
  userId: string
): Promise<void> {
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  // Process with semaphore (max N concurrent)
  const semaphore = new Semaphore(MAX_CONCURRENT_GENERATIONS);

  await Promise.allSettled(
    photos.map(async (photo) => {
      await semaphore.acquire();
      try {
        // Decrement credit for this photo
        const decremented = await decrementCredit(userId);
        if (!decremented) {
          throw new Error("Plus de visuels disponibles.");
        }

        await updateDossierPhotoStatus(photo.id, "generating");

        const photoStart = Date.now();
        const result = await generateSinglePhoto(photo, dossier);

        await updateDossierPhotoStatus(photo.id, "completed", {
          outputImageKey: result.outputKey,
          pass1ImageKey: result.pass1Key,
          durationMs: Date.now() - photoStart,
        });

        successCount++;
      } catch (err) {
        failCount++;
        // Refund credit on failure
        await addCredits(userId, 1).catch(() => {});
        await updateDossierPhotoStatus(photo.id, "failed", {
          errorMessage: err instanceof Error ? err.message : "Erreur inconnue",
        });
      } finally {
        semaphore.release();
      }
    })
  );

  // Update dossier final status
  const finalStatus = successCount === photos.length
    ? "completed"
    : "partial";

  await updateDossierStatus(dossierUuid, finalStatus, {
    successCount,
    failCount,
    totalDurationMs: Date.now() - startTime,
  });

  // Generate PDF in background (fire-and-forget) — only if at least 1 photo succeeded
  if (successCount > 0) {
    generateDossierPdfBackground(dossierUuid, dossier.slug).catch((err) => {
      console.error(`[PDF] Background generation failed for ${dossierUuid}:`, err);
    });
  }
}

// ─── Simple Semaphore ────────────────────────────────────────────────

class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}
