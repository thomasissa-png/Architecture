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
  isDossierExpired,
  MAX_PHOTOS_PER_DOSSIER,
  MAX_CONCURRENT_GENERATIONS,
} from "@/lib/dossier";

export const dynamic = "force-dynamic";

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
      action: "generate" | "update_style" | "regenerate" | "attach";
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
