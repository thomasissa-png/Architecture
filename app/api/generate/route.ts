export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSessionRobust } from "@/lib/session";
import {
  PROMPT_VERSION,
  checkRateLimit,
  getOutputSize,
  buildSurfacesResponsesPrompt,
  buildFurnitureResponsesPrompt,
  buildOutdoorSurfacesResponsesPrompt,
  buildOutdoorFurnitureResponsesPrompt,
  tryOpenAIResponsesWithPrompt,
  generatePass,
  detectMimeType,
  extractRoomInventory,
} from "@/lib/generation-pipeline";
import { decrementCredit, addCredits, getMaxIterations } from "@/lib/credits";
import { logGeneration, savePass1Cache, getPass1Cache, getPool, saveIterationBase, getIterationBase, saveImage, getImage, withStorageRetry } from "@/lib/db";
import { preprocessIterationComment, classifyIterationIntent } from "@/lib/custom-prompt";
import {
  buildIterationFurnitureResponsesPrompt,
  PASS1_TTL_MS,
} from "@/lib/iteration-prompt";
import { applyRoomTypeOverrides, ROOM_TYPES, getStyleMaterialHint } from "@/lib/room-types";
import { applyOutdoorSubtypeOverrides, OUTDOOR_SUBTYPES } from "@/lib/outdoor-subtypes";
import { saveUserPhoto } from "@/lib/user-photos";
import {
  buildIterationOutdoorFurnitureResponsesPrompt,
  buildAdjustResponsesPrompt,
  buildAdjustOutdoorResponsesPrompt,
} from "@/lib/iteration-prompt";
import { enqueueGeneration, shouldQueue } from "@/lib/generation-queue";
import { compositeStructuralElements } from "@/lib/compositing";

// Global deadline for the entire route — prevents Replit proxy 504.
const ROUTE_DEADLINE_MS = 150_000;
const MAX_PASS_RETRIES = 2; // 1 initial + 1 retry
const RETRY_DELAY_MS = 2_000;

/** Check if an error is a safety system rejection */
function isSafetyRejection(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return msg.includes("safety system") || msg.includes("content_policy") || msg.includes("moderation");
}

/** Build a simplified fallback prompt for safety rejection retries.
 *  Strips potentially problematic phrasing (SURGICAL, LOCKED, identical pixels, etc.)
 *  and keeps only the core instruction. */
function simplifyPromptForSafetyRetry(originalPrompt: string): string {
  // Extract the user's actual change request from APPLY THIS/THESE CHANGE(S)
  const changeMatch = originalPrompt.match(/APPLY\s+(?:THIS\s+SINGLE\s+CHANGE\s+ONLY|THESE\s+CHANGES):\s*\n?([\s\S]*?)(?:(?:That is the ONLY|Add ONLY|Do NOT|ONLY add|Every piece|Preserve|DSLR|Distribute)\b)/i);
  const changeRequest = changeMatch?.[1]?.trim() || "";

  if (changeRequest) {
    // Adjust mode: simplified prompt with just the change
    return [
      "Edit this furnished room photo. Keep everything the same except for this change:",
      changeRequest,
      "Keep the same camera angle, room structure, lighting, and all existing furniture.",
      "Photo-realistic interior photograph. No text or watermarks.",
    ].join(" ");
  }

  // Restyle mode or fallback: strip aggressive language
  return originalPrompt
    .replace(/SURGICAL EDIT[^.]*\./gi, "")
    .replace(/Output must be 95\+% identical[^.]*\./gi, "")
    .replace(/Camera position is LOCKED[^.]*\./gi, "Keep the same camera angle.")
    .replace(/Room structure is LOCKED[^.]*\./gi, "Keep the same room structure.")
    .replace(/EXACTLY the same number[^.]*\./gi, "Keep the same windows and doors.")
    .replace(/mentally list every object[^.]*\./gi, "")
    .replace(/That is the ONLY modification[^.]*\./gi, "")
    .replace(/Every other pixel[^.]*\./gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function generateIterationPass(
  base64Image: string,
  responsesPrompt: string,
  outputSize: { openai: string; w: number; h: number }
): Promise<{ image: string; model: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Clé API OpenAI requise pour les itérations.");
  }

  let lastError: Error | null = null;

  // Attempt 1: original prompt
  try {
    return await tryOpenAIResponsesWithPrompt(base64Image, responsesPrompt, outputSize.openai);
  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
    console.error(`OpenAI iteration attempt 1/${MAX_PASS_RETRIES} failed:`, lastError.message);
  }

  // Attempt 2: if safety rejection, try with simplified prompt; otherwise retry same prompt
  await new Promise(r => setTimeout(r, RETRY_DELAY_MS));

  const useSimplified = lastError && isSafetyRejection(lastError);
  const retryPrompt = useSimplified ? simplifyPromptForSafetyRetry(responsesPrompt) : responsesPrompt;

  if (useSimplified) {
    console.log(`[iteration] Safety rejection detected. Retrying with simplified prompt (${retryPrompt.length} chars vs ${responsesPrompt.length} chars)`);
    console.log(`[iteration] Simplified prompt: ${retryPrompt.substring(0, 300)}...`);
  }

  try {
    return await tryOpenAIResponsesWithPrompt(base64Image, retryPrompt, outputSize.openai);
  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
    console.error(`OpenAI iteration attempt 2/${MAX_PASS_RETRIES} failed:`, lastError.message);
  }

  throw new Error(`Échec itération après ${MAX_PASS_RETRIES} tentatives. ${lastError?.message ?? ""}`);
}

// ─── API Route Handler ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez patienter une minute avant de réessayer." },
      { status: 429 }
    );
  }

  // F4: Internal dossier batch calls skip auth + credit (already handled by dossier API)
  // Secured with a shared secret to prevent external clients from bypassing auth/credits
  const internalSecret = request.headers.get("X-Internal-Secret");
  const isInternalDossierCall =
    request.headers.get("X-Internal-Dossier") === "true" &&
    !!internalSecret &&
    !!process.env.INTERNAL_API_SECRET &&
    internalSecret === process.env.INTERNAL_API_SECRET;

  // Auth + credit check
  // - Connected users: use credit system (optimistic decrement)
  // - Anonymous users: allowed with IP rate limit only (2 free generations enforced by rate limit)
  // - Internal dossier calls: skip (credits managed by dossier batch endpoint)
  const session = isInternalDossierCall ? null : await getSessionRobust(request);
  console.log(`[generate] session: userId="${session?.user?.id || "NONE"}" isInternal=${isInternalDossierCall}`);

  // Credit check is deferred after body parsing — see below (after pass1Key detection)
  // Anonymous users pass through — protected by IP rate limit (10 req/min)

  let styleId = "unknown";

  // Hoisted for queue fallback in catch block
  let _image: string | undefined;
  let _surfacePrompt: string | undefined;
  let _furniturePrompt: string | undefined;
  let _width: number | undefined;
  let _height: number | undefined;
  let _roomType: string | null = null;
  let _isOutdoor = false;
  let _outdoorSubtype: string | null = null;
  let _withFurniture = true;
  let _pass1Key: string | undefined;

  try {
    const body = await request.json();
    const {
      image,
      surfacePrompt,
      furniturePrompt,
      styleId: bodyStyleId = "custom",
      withFurniture = true,
      width,
      height,
      // F1 iteration params
      pass1_key: pass1Key,
      iterationComment,
      previousModifications = [],
      sessionId,
      // F2 room type
      roomType = null,
      // F3 outdoor
      isOutdoor = false,
      outdoorSubtype = null,
      // Split-mode: progressive display (pass1 shown while pass2 runs)
      splitMode = false,
      pass2Only = false,
      userId: bodyUserId,
      outputFormat,
    } = body as {
      image?: string;
      surfacePrompt?: string;
      furniturePrompt?: string;
      styleId?: string;
      withFurniture?: boolean;
      width?: number;
      height?: number;
      pass1_key?: string;
      iterationComment?: string;
      previousModifications?: string[];
      sessionId?: string;
      roomType?: string | null;
      isOutdoor?: boolean;
      outdoorSubtype?: string | null;
      splitMode?: boolean;
      pass2Only?: boolean;
      userId?: string;
      outputFormat?: "original" | "landscape" | "portrait";
    };

    styleId = bodyStyleId;

    console.log(`[generate] splitMode=${splitMode}, pass2Only=${pass2Only}, withFurniture=${withFurniture}, pass1Key=${pass1Key ? "yes" : "no"}`);

    // Select style variant for furniture diversity (indoor named styles only)
    let resolvedFurniturePrompt = furniturePrompt;
    if (styleId && styleId !== "custom" && !isOutdoor && furniturePrompt && image) {
      try {
        const { selectVariant } = await import("@/lib/style-variants");
        const crypto = await import("crypto");
        const imageData = image.slice(image.indexOf(",") + 1);
        const imageHash = crypto.createHash("sha256").update(imageData).digest("hex").slice(0, 16);
        const variant = selectVariant(imageHash, styleId);
        if (variant.furniturePrompt) {
          resolvedFurniturePrompt = variant.furniturePrompt;
        }
      } catch {
        // Fallback to original furniturePrompt
      }
    }

    // Assign to hoisted vars for queue fallback in catch
    _image = image; _surfacePrompt = surfacePrompt; _furniturePrompt = resolvedFurniturePrompt;
    _width = width; _height = height; _roomType = roomType; _isOutdoor = isOutdoor;
    _outdoorSubtype = outdoorSubtype; _withFurniture = withFurniture; _pass1Key = pass1Key;

    // Credit check — AFTER body parsing so we know if it's an iteration or pass2Only
    // Iterations do NOT consume a credit (spec F1). Only new generations do.
    // pass2Only does NOT consume a credit (already debited in the splitMode pass1 call).
    const isIteration = !!pass1Key && !pass2Only;
    if (!isInternalDossierCall && session?.user?.id && !isIteration && !pass2Only) {
      const decremented = await decrementCredit(session.user.id);
      if (!decremented) {
        return NextResponse.json(
          { error: "Plus de visuels disponibles. Rechargez pour continuer." },
          { status: 402 }
        );
      }
    }

    // ── F1 Iteration flow: adjust (edit furnished) or restyle (re-pass 2) ──
    // Skip iteration flow when pass2Only — that's handled by the split-mode pass2Only block below.
    if (pass1Key && !pass2Only) {
      if (!iterationComment || !iterationComment.trim()) {
        return NextResponse.json(
          { error: "Le commentaire d'itération est requis." },
          { status: 400 }
        );
      }

      // Load pass 1 from Object Storage cache
      const cached = await getPass1Cache(pass1Key);
      if (!cached) {
        return NextResponse.json(
          { error: "Passe 1 introuvable. Veuillez regénérer depuis l'image originale." },
          { status: 404 }
        );
      }

      // Check TTL (24h)
      const age = Date.now() - cached.meta.createdAt;
      if (age > PASS1_TTL_MS) {
        return NextResponse.json(
          { error: "Les surfaces de cette génération ont expiré (>24h). Regénérez depuis l'image originale." },
          { status: 410 }
        );
      }

      // Check max iterations — simplified: if user has a valid pass1Key, they paid.
      // The pass1 cache IS the proof of payment. No session check needed for MVP.
      // Default to 3 iterations (Pro level) — the cache existing = user generated = user paid.
      const MAX_ITER_DEFAULT = 3;
      const iterUserId = session?.user?.id ?? bodyUserId ?? cached.meta.userId ?? null;
      const userMaxIter = iterUserId ? await getMaxIterations(iterUserId) : MAX_ITER_DEFAULT;
      console.log(`[iteration] userId="${iterUserId || "NONE"}", maxIter=${userMaxIter}, previousMods=${previousModifications.length}`);
      if (previousModifications.length >= userMaxIter) {
        return NextResponse.json(
          { error: `Nombre maximum d'itérations atteint (${userMaxIter}).` },
          { status: 403 }
        );
      }

      const outputSize = getOutputSize(cached.meta.width, cached.meta.height);
      const originalFurniturePrompt = cached.meta.furniturePrompt;

      // Classify intent: adjust (edit furnished image) vs restyle (redo from empty)
      console.log("Classifying iteration intent...");
      const intent = await classifyIterationIntent(iterationComment.trim());
      console.log(`Iteration intent: ${intent}`);

      // Pre-process the iteration comment via GPT-4.1-mini
      console.log("Pre-processing iteration comment...");
      const preprocessResult = await preprocessIterationComment(
        iterationComment.trim(),
        cached.meta.styleId,
        originalFurniturePrompt
      );

      // Build all modifications: previous + current enriched
      const allModifications = [...previousModifications, preprocessResult.enrichedComment];

      // Build iteration prompts — use outdoor builders if the original generation was outdoor
      const iterMeta = {
        width: cached.meta.width,
        height: cached.meta.height,
        roomType: cached.meta.roomType,
        isOutdoor: cached.meta.isOutdoor,
        allowWallMounted: preprocessResult.allowWallMounted,
      };

      let responsesPrompt: string;
      let sourceImageBase64: string;

      if (intent === "adjust") {
        // ADJUST mode: edit the furnished result, keep existing furniture
        // Try to load the last furnished result from Object Storage
        const effectiveSessionId = sessionId ?? pass1Key;
        const furnishedBase64 = await getIterationBase(effectiveSessionId);

        if (furnishedBase64) {
          sourceImageBase64 = furnishedBase64;
          console.log("Adjust mode: using furnished iteration base image");
        } else {
          // Fallback: no furnished image stored yet — use pass1 (restyle behavior)
          sourceImageBase64 = cached.imageBase64;
          console.log("Adjust mode: no iteration base found, falling back to pass1 image");
        }

        // Build adjust-specific prompts (preserve existing, apply change only)
        if (cached.meta.isOutdoor) {
          responsesPrompt = buildAdjustOutdoorResponsesPrompt(
            iterationComment.trim(),
            preprocessResult.enrichedComment,
          );

        } else {
          responsesPrompt = buildAdjustResponsesPrompt(
            iterationComment.trim(),
            preprocessResult.enrichedComment,
            iterMeta,
          );

        }
      } else {
        // RESTYLE mode: original behavior — re-pass 2 from empty pass1 image
        sourceImageBase64 = cached.imageBase64;
        console.log("Restyle mode: using pass1 (empty) image");

        if (cached.meta.isOutdoor) {
          responsesPrompt = buildIterationOutdoorFurnitureResponsesPrompt(
            originalFurniturePrompt,
            allModifications,
          );

        } else {
          responsesPrompt = buildIterationFurnitureResponsesPrompt(
            originalFurniturePrompt,
            allModifications,
            iterMeta,
          );

        }
      }

      const t0 = Date.now();

      // NOTE: do NOT check request.signal.aborted here.
      // On mobile, switching tabs/apps aborts the signal even though the user
      // intends to come back. The generation must continue to completion.

      console.log(`[iteration] Starting (${intent}): outputSize=${outputSize.openai}, imageSize=${sourceImageBase64.length} chars, mimeDetected=${detectMimeType(sourceImageBase64)}, promptLength=${responsesPrompt.length} chars`);
      console.log(`[iteration] enrichedComment: "${preprocessResult.enrichedComment}"`);
      console.log(`[iteration] Full prompt:\n${responsesPrompt}`);
      const result = await generateIterationPass(sourceImageBase64, responsesPrompt, outputSize);
      const t1 = Date.now();

      const outputBase64 = result.image.replace(/^data:image\/[\w+]+;base64,/, "");
      const iterationNumber = previousModifications.length + 1;

      // CRITICAL: await before response — Replit autoscale kills worker after response
      const effectiveSessionId = sessionId ?? pass1Key;
      await saveIterationBase(effectiveSessionId, outputBase64).catch((err) =>
        console.error("saveIterationBase (iteration) failed:", err)
      );

      const response = NextResponse.json({
        image: result.image,
        model: result.model,
        iterationNumber,
        warnings: preprocessResult.warnings,
        enrichedComment: preprocessResult.enrichedComment,
        intent,
      });

      // Fire-and-forget: log + save iteration image
      logGeneration({
        ip,
        styleId: cached.meta.styleId,
        surfacePrompt: cached.meta.surfacePrompt,
        furniturePrompt: originalFurniturePrompt,
        withFurniture: true,
        inputWidth: cached.meta.width,
        inputHeight: cached.meta.height,
        modelUsed: `${result.model} (${intent})`,
        pass2Model: result.model,
        durationMs: t1 - t0,
        pass2DurationMs: t1 - t0,
        success: true,
        builtPromptPass2: responsesPrompt,
        outputBase64,
        // Iteration-specific fields
        isIteration: true,
        iterationNumber,
        sessionId: sessionId ?? undefined,
        userCommentRaw: iterationComment.trim(),
        userCommentEnriched: preprocessResult.enrichedComment,
        pass1CacheKey: pass1Key,
        roomType: cached.meta.roomType,
        isOutdoor: cached.meta.isOutdoor || undefined,
        outdoorSubtype: cached.meta.outdoorSubtype ?? undefined,
        promptVersion: PROMPT_VERSION,
        generationType: intent === "adjust" ? "iteration_adjust" : "iteration_restyle",
      }).catch((err) => console.error("DB log (iteration) failed:", err));

      // Save iteration as a NEW user_photos entry (Bug 4 fix)
      // CRITICAL: await output saveImage before calling saveUserPhoto.
      // Skip entirely if outputKey is null to avoid "Image non disponible" in gallery.
      // Must await (with timeout) before returning response — fire-and-forget is killed
      // by Replit's serverless runtime after the response is sent.
      if (session?.user?.id) {
        const iterPhotoPromise = (async () => {
          try {
            const { saveImage: saveImg } = await import("@/lib/db");
            const ts = Date.now();

            const outputKey = await saveImg(outputBase64, `user_photo_iter${iterationNumber}_${ts}_output`).catch((err) => {
              console.error("[saveUserPhoto iteration] output saveImage failed:", err);
              return null;
            });

            if (!outputKey) {
              console.error("[saveUserPhoto iteration] SKIPPING — outputKey is null");
              return null;
            }

            const pass1ImageKey = cached.imageBase64
              ? await saveImg(cached.imageBase64, `user_photo_iter${iterationNumber}_${ts}_pass1`).catch(() => null)
              : null;

            await saveUserPhoto({
              userId: session.user.id,
              inputImageKey: cached.meta.inputImageKey || null,
              outputImageKey: outputKey,
              pass1ImageKey: pass1ImageKey,
              styleId: cached.meta.styleId || null,
              roomType: cached.meta.isOutdoor ? null : (cached.meta.roomType || null),
              roomLabel: null,
              isOutdoor: cached.meta.isOutdoor || false,
              propertyId: null,
            });
            return outputKey;
          } catch (err) {
            console.error("saveUserPhoto (iteration) failed:", err);
            return null;
          }
        })();

        // Wait up to 5s for the gallery save to complete before returning
        await Promise.race([
          iterPhotoPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);
      }

      // Iteration succeeded — no credit consumed (iterations are free)

      return response;
    }

    // ── Split-mode pass 2 only: resume from cached pass 1 ─────────────
    if (pass2Only && pass1Key) {
      const cached = await getPass1Cache(pass1Key);
      if (!cached) {
        return NextResponse.json(
          { error: "Passe 1 introuvable. Veuillez regénérer depuis l'image originale." },
          { status: 404 }
        );
      }

      // Verify this is a pending pass2 (single-use anti-replay)
      if (!cached.meta.pendingPass2) {
        return NextResponse.json(
          { error: "Cette passe 2 a déjà été exécutée." },
          { status: 409 }
        );
      }

      // Clear the pendingPass2 flag (single-use) by re-saving meta without it
      const updatedMeta = { ...cached.meta, pendingPass2: false };
      const metaKey = pass1Key.replace(".jpg", "_meta.json");
      const metaBuffer = Buffer.from(JSON.stringify(updatedMeta), "utf-8");
      await withStorageRetry(
        (client) => client.uploadFromBytes(metaKey, metaBuffer),
        `clearPendingPass2(${metaKey})`
      ).catch((err) => console.error("Failed to clear pendingPass2 flag:", err));

      const p2OutputSize = getOutputSize(cached.meta.width, cached.meta.height);
      const p2RoomType = cached.meta.isOutdoor ? null : (cached.meta.roomType ?? null);

      // Rebuild outdoor param if needed
      let p2OutdoorParam: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string } | undefined;
      if (cached.meta.isOutdoor) {
        const sub = cached.meta.outdoorSubtype ? OUTDOOR_SUBTYPES[cached.meta.outdoorSubtype] : null;
        p2OutdoorParam = {
          isOutdoor: true,
          subtypeSurfaceOverride: sub?.subtypeSurfaceOverride ?? "",
          subtypeFurnitureOverride: sub?.subtypeFurnitureOverride ?? "",
        };
      }

      // Retrieve original input image for best-of-2 scoring (fail-open: no scoring if unavailable)
      let originalBase64ForScoring: string | undefined;
      if (cached.meta.inputImageKey) {
        try {
          const inputBytes = await getImage(cached.meta.inputImageKey);
          if (inputBytes) {
            originalBase64ForScoring = Buffer.from(inputBytes).toString("base64");
            console.log(`[pass2Only] Retrieved original input image for best-of-2 scoring`);
          }
        } catch (err) {
          console.warn(`[pass2Only] Could not retrieve original input for scoring (fail-open):`, err);
        }
      }

      const p2t0 = Date.now();
      console.log(`[pass2Only] Starting pass 2 from cache key: ${pass1Key}`);

      let pass2Result: { image: string; model: string; bestOf2?: { score1: number; score2: number; chosen: 1 | 2 } } | null = null;
      let pass2Err: string | null = null;

      try {
        pass2Result = await generatePass(
          cached.imageBase64,
          cached.meta.surfacePrompt,
          cached.meta.furniturePrompt,
          2,
          p2OutputSize,
          p2RoomType,
          p2OutdoorParam,
          undefined,
          originalBase64ForScoring
        );
      } catch (err) {
        pass2Err = err instanceof Error ? err.message : String(err);
        console.error(`[pass2Only] failed: ${pass2Err}`);
      }

      const p2t1 = Date.now();

      if (!pass2Result) {
        // Pass 2 failed — refund credit
        if (session?.user?.id) {
          addCredits(session.user.id, 1).catch((refundErr) => {
            console.error("CRITICAL: Credit refund (pass2Only failed) failed:", refundErr);
          });
          console.log(`[pass2Only] Credit refunded for user ${session.user.id}`);
        }
        return NextResponse.json(
          { error: `L'ameublement a échoué. ${pass2Err ?? ""}`.trim(), pass2Failed: true },
          { status: 500 }
        );
      }

      const p2OutputBase64 = pass2Result.image.replace(/^data:image\/[\w+]+;base64,/, "");

      // CRITICAL: await before response — Replit autoscale kills worker after response
      if (sessionId) {
        await saveIterationBase(sessionId, p2OutputBase64).catch((err) =>
          console.error("saveIterationBase (pass2Only) failed:", err)
        );
      }

      // Save to user gallery BEFORE response (Replit autoscale kills worker after response)
      let photoId: string | null = null;
      if (session?.user?.id) {
        try {
          const ts = Date.now();
          let outputKey = await saveImage(p2OutputBase64, `user_photo_${ts}_output`).catch(() => null);
          if (!outputKey) {
            await new Promise((r) => setTimeout(r, 1000));
            outputKey = await saveImage(p2OutputBase64, `user_photo_${ts}_output_r`).catch(() => null);
          }
          if (outputKey) {
            const pass1ImageKey = await saveImage(cached.imageBase64, `user_photo_${ts}_pass1`).catch(() => null);
            photoId = await saveUserPhoto({
              userId: session.user.id,
              inputImageKey: cached.meta.inputImageKey || null,
              outputImageKey: outputKey,
              pass1ImageKey: pass1ImageKey,
              styleId: cached.meta.styleId || null,
              roomType: cached.meta.isOutdoor ? null : (cached.meta.roomType || null),
              roomLabel: null,
              isOutdoor: cached.meta.isOutdoor || false,
              propertyId: null,
            });
          }
        } catch (err) {
          console.error("[saveUserPhoto pass2Only] FAILED:", err);
        }
      }

      // Build prompt for logging
      const p2BuiltPrompt = cached.meta.isOutdoor
        ? buildOutdoorFurnitureResponsesPrompt(cached.meta.furniturePrompt, p2OutdoorParam?.subtypeFurnitureOverride ?? "")
        : buildFurnitureResponsesPrompt(cached.meta.furniturePrompt, p2RoomType);

      await logGeneration({
        ip, styleId: cached.meta.styleId,
        surfacePrompt: cached.meta.surfacePrompt, furniturePrompt: cached.meta.furniturePrompt,
        withFurniture: true, inputWidth: cached.meta.width, inputHeight: cached.meta.height,
        modelUsed: `pass2Only: ${pass2Result.model}`,
        pass2Model: pass2Result.model,
        durationMs: p2t1 - p2t0, pass2DurationMs: p2t1 - p2t0,
        success: true,
        builtPromptPass2: p2BuiltPrompt,
        outputBase64: p2OutputBase64,
        pass1Base64: cached.imageBase64,
        sessionId: sessionId ?? undefined,
        pass1CacheKey: pass1Key,
        roomType: cached.meta.isOutdoor ? undefined : (cached.meta.roomType ?? undefined),
        isOutdoor: cached.meta.isOutdoor || undefined,
        outdoorSubtype: cached.meta.isOutdoor ? (cached.meta.outdoorSubtype ?? undefined) : undefined,
        promptVersion: PROMPT_VERSION,
        generationType: "pass2_only",
        bestOf2Score1: pass2Result.bestOf2?.score1,
        bestOf2Score2: pass2Result.bestOf2?.score2,
        bestOf2Chosen: pass2Result.bestOf2?.chosen,
      }).catch((err) => console.error("DB log (pass2Only) failed:", err));

      return NextResponse.json({
        image: pass2Result.image,
        model: pass2Result.model,
        pass1_key: pass1Key,
        ...(photoId ? { photoId } : {}),
      });
    }

    // ── Standard generation flow (pass 1 + pass 2) ────────────────────
    if (!image || !surfacePrompt || !resolvedFurniturePrompt) {
      return NextResponse.json(
        { error: "Image et style requis" },
        { status: 400 }
      );
    }

    // Calculate output size — respect outputFormat override for Pro users
    const outputSize = outputFormat === "landscape"
      ? { openai: "1536x1024", w: 1536, h: 1024 }
      : outputFormat === "portrait"
      ? { openai: "1024x1536", w: 1024, h: 1536 }
      : getOutputSize(width, height);

    const base64Image = image.replace(/^data:image\/[\w+]+;base64,/, "");

    const estimatedSize = (base64Image.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "L'image dépasse la taille maximale de 10 Mo" },
        { status: 413 }
      );
    }

    // ── Pipeline 2 passes ────────────────────────────────────────────
    // Pass 1: Finish surfaces using surfacePrompt — room stays empty
    // Pass 2 (optional): Add furniture using furniturePrompt — surfaces untouched

    // F3: Apply outdoor subtype overrides OR F2 room type overrides (mutually exclusive)
    let trimmedSurface: string;
    let trimmedFurniture: string;
    let outdoorParam: { isOutdoor: boolean; subtypeSurfaceOverride?: string; subtypeFurnitureOverride?: string } | undefined;

    if (isOutdoor) {
      // Outdoor mode: apply subtype overrides, no room type
      const { effectiveSurfacePrompt, effectiveFurniturePrompt } =
        applyOutdoorSubtypeOverrides(surfacePrompt.trim(), resolvedFurniturePrompt.trim(), outdoorSubtype ?? null);
      trimmedSurface = effectiveSurfacePrompt;
      trimmedFurniture = effectiveFurniturePrompt;

      // Extract raw subtype overrides for injection into builders
      const sub = outdoorSubtype ? OUTDOOR_SUBTYPES[outdoorSubtype] : null;
      outdoorParam = {
        isOutdoor: true,
        subtypeSurfaceOverride: sub?.subtypeSurfaceOverride ?? "",
        subtypeFurnitureOverride: sub?.subtypeFurnitureOverride ?? "",
      };
    } else {
      // Indoor mode: apply room type overrides
      // Rooms with dedicated builders absorb surface directives directly — skip surface concatenation
      // but still need furniture replacement and negative override from applyRoomTypeOverrides
      // dining_room excluded: it has dedicated FURNITURE builders but no dedicated SURFACE builder,
      // so it needs the standard surface concatenation path (roomSurfaceOverride appended to surfacePrompt).
      const ROOMS_WITH_DEDICATED_BUILDERS = ["kitchen", "bathroom", "wc", "bedroom_adults", "bedroom_children", "entryway", "laundry", "cellar"];
      const hasDedicatedBuilder = roomType && ROOMS_WITH_DEDICATED_BUILDERS.includes(roomType);

      const { effectiveSurfacePrompt, effectiveFurniturePrompt } =
        applyRoomTypeOverrides(surfacePrompt.trim(), resolvedFurniturePrompt.trim(), roomType ?? null);

      // If dedicated builder exists: use raw style surfacePrompt (builder handles room specifics)
      // Otherwise: use the concatenated effectiveSurfacePrompt (room override appended)
      trimmedSurface = hasDedicatedBuilder ? surfacePrompt.trim() : effectiveSurfacePrompt;

      // CRITICAL FIX: For dedicated builders, do NOT inject the full style furniturePrompt
      // (which contains living room items like sofa, coffee table, rug).
      // Instead use the room-specific furniture override + a brief style hint.
      // The full MERGE is only needed for rooms without dedicated builders (living_room, office, etc.)
      if (hasDedicatedBuilder && roomType) {
        const rt = ROOM_TYPES[roomType];
        trimmedFurniture = rt?.roomFurnitureOverride
          ? `${rt.roomFurnitureOverride} ${getStyleMaterialHint(styleId)}`
          : resolvedFurniturePrompt.trim();
      } else {
        trimmedFurniture = effectiveFurniturePrompt;
      }
    }

    // Pre-pass vision: extract room geometry inventory (fail-open, 5s timeout)
    // Only for initial generations (not iterations, not pass2Only)
    const roomInventory = await extractRoomInventory(base64Image);

    const t0 = Date.now();

    // NOTE: do NOT check request.signal.aborted here.
    // On mobile, switching tabs/apps aborts the signal even though the user
    // intends to come back. The generation must continue to completion.

    console.log(`Starting pass 1 (surfaces)... Output size: ${outputSize.openai}${isOutdoor ? ` outdoor subtype: ${outdoorSubtype}` : roomType ? ` roomType: ${roomType}` : ""}`);
    const pass1 = await generatePass(base64Image, trimmedSurface, trimmedFurniture, 1, outputSize, isOutdoor ? null : roomType, outdoorParam, roomInventory);
    const t1 = Date.now();

    // Build the final prompts for logging (what the model actually receives)
    const builtPromptPass1 = isOutdoor
      ? buildOutdoorSurfacesResponsesPrompt(trimmedSurface, outdoorParam?.subtypeSurfaceOverride ?? "")
      : buildSurfacesResponsesPrompt(trimmedSurface, roomType, roomInventory);
    const builtPromptPass2 = isOutdoor
      ? buildOutdoorFurnitureResponsesPrompt(trimmedFurniture, outdoorParam?.subtypeFurnitureOverride ?? "")
      : buildFurnitureResponsesPrompt(trimmedFurniture, roomType, roomInventory);

    let pass1Base64 = pass1.image.replace(/^data:image\/[\w+]+;base64,/, "");

    // Compositing: re-superpose structural elements (windows, doors, radiators) from original
    // onto pass 1 result. Guarantees physical preservation regardless of model stochasticity.
    // Only for initial generations (not iterations, not pass2Only).
    // Fail-open: if compositing fails, pass1Base64 stays unchanged.
    try {
      const compositedBase64 = await compositeStructuralElements(base64Image, pass1Base64);
      if (compositedBase64 !== pass1Base64) {
        pass1Base64 = compositedBase64;
        console.log("[generate] Compositing applied — structural elements preserved from original");
      }
    } catch (err) {
      console.warn("[generate] Compositing failed (fail-open):", err instanceof Error ? err.message : String(err));
    }

    // Save input image to Object Storage for gallery "avant" in iterations
    const inputTs = Date.now();
    const inputImageKey = await saveImage(base64Image, `user_input_${inputTs}`).catch(() => null);

    // Cache pass 1 for F1 iterations (fire-and-forget)
    const pass1CacheKey = sessionId
      ? `sessions/${sessionId}/pass1_${Date.now()}.jpg`
      : `sessions/anon_${Date.now()}/pass1.jpg`;

    let pass1Saved = false;
    // R4: Launch cache save in parallel — pass 2 uses pass1Base64 from memory, not cache
    const pass1CachePromise = savePass1Cache(pass1CacheKey, pass1Base64, {
      width: width ?? outputSize.w,
      height: height ?? outputSize.h,
      styleId,
      furniturePrompt: trimmedFurniture,
      surfacePrompt: trimmedSurface,
      createdAt: Date.now(),
      roomType: isOutdoor ? null : (roomType ?? null),
      isOutdoor: isOutdoor || undefined,
      outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
      // Store userId for iteration fallback (getServerSession can return null on Replit)
      userId: session?.user?.id ?? undefined,
      // Store input image key for gallery "avant" in iterations
      inputImageKey: inputImageKey ?? undefined,
      // Split-mode: store pass2 info so pass2Only call can resume
      ...(splitMode && withFurniture ? {
        pendingPass2: true,
        outputSize: outputSize.openai,
        withFurniture: true,
      } : {}),
    })
      .then(() => { pass1Saved = true; })
      .catch((err) => console.error("Pass1 cache save failed:", err));

    // ── Split-mode: return pass 1 immediately, client will call pass2Only later ──
    if (splitMode && withFurniture) {
      await pass1CachePromise;

      // Log pass 1 as partial success
      logGeneration({
        ip, styleId, surfacePrompt: trimmedSurface, furniturePrompt: trimmedFurniture,
        withFurniture: true, inputWidth: width, inputHeight: height,
        modelUsed: `${pass1.model} (splitMode pass1)`,
        pass1Model: pass1.model, durationMs: t1 - t0, pass1DurationMs: t1 - t0,
        success: true,
        builtPromptPass1,
        inputBase64: base64Image, pass1Base64,
        sessionId: sessionId ?? undefined,
        pass1CacheKey,
        roomType: isOutdoor ? undefined : (roomType ?? undefined),
        isOutdoor: isOutdoor || undefined,
        outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
        promptVersion: PROMPT_VERSION,
        roomInventory: roomInventory || undefined,
        generationType: "generation",
      }).catch((err) => console.error("DB log (splitMode pass1) failed:", err));

      // Always return pass1_key in split mode — if cache failed, pass2Only will fail
      // gracefully and the user still sees the pass1 result immediately
      if (!pass1Saved) {
        console.error(`[splitMode] pass1 cache save FAILED — pass2Only will not work for key ${pass1CacheKey}`);
      }
      return NextResponse.json({
        image: pass1.image,
        model: pass1.model,
        pass1_key: pass1CacheKey,
        pendingPass2: true,
      });
    }

    // If surfaces-only mode, return pass 1 result directly
    if (!withFurniture) {
      await pass1CachePromise;
      const outputBase64 = pass1Base64;

      // Save to gallery BEFORE response (Replit autoscale kills worker after response)
      let photoId: string | null = null;
      if (session?.user?.id) {
        try {
          const ts = Date.now();
          const outputKey = await saveImage(outputBase64, `user_photo_${ts}_output`).catch(() => null);
          if (outputKey) {
            const inputKey = await saveImage(base64Image, `user_photo_${ts}_input`).catch(() => null);
            photoId = await saveUserPhoto({
              userId: session.user.id,
              inputImageKey: inputKey,
              outputImageKey: outputKey,
              pass1ImageKey: null,
              styleId: styleId || null,
              roomType: isOutdoor ? null : (roomType || null),
              roomLabel: null,
              isOutdoor: isOutdoor || false,
              propertyId: null,
            });
          }
        } catch (err) {
          console.error("[saveUserPhoto surfaces-only] FAILED:", err);
        }
      }

      // Log to DB (fire-and-forget after gallery save)
      logGeneration({
        ip, styleId, surfacePrompt: trimmedSurface, furniturePrompt: trimmedFurniture,
        withFurniture: false, inputWidth: width, inputHeight: height,
        modelUsed: `${pass1.model} (surfaces uniquement)`,
        pass1Model: pass1.model, durationMs: t1 - t0, pass1DurationMs: t1 - t0,
        success: true,
        builtPromptPass1,
        inputBase64: base64Image, outputBase64,
        sessionId: sessionId ?? undefined,
        pass1CacheKey,
        roomType: isOutdoor ? undefined : (roomType ?? undefined),
        isOutdoor: isOutdoor || undefined,
        outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
        promptVersion: PROMPT_VERSION,
        roomInventory: roomInventory || undefined,
        generationType: "surfaces_only",
      }).catch((err) => console.error("DB log failed:", err));

      return NextResponse.json({
        image: pass1.image,
        model: `${pass1.model} (surfaces uniquement)`,
        ...(pass1Saved ? { pass1_key: pass1CacheKey } : {}),
        ...(photoId ? { photoId } : {}),
      });
    }

    // Pass 2 is ALWAYS attempted after a successful pass 1 (audit #36, #39, #40: empty rooms = no client value).
    // Retry once before falling back to pass 1 result alone.
    // Check global deadline — if pass 1 was slow, skip pass 2 rather than risk a 504.
    const elapsedAfterPass1 = Date.now() - t0;
    const remainingBudget = ROUTE_DEADLINE_MS - elapsedAfterPass1;

    console.log(`Starting pass 2 (furniture)... Elapsed: ${Math.round(elapsedAfterPass1 / 1000)}s, remaining budget: ${Math.round(remainingBudget / 1000)}s`);
    let pass2: { image: string; model: string; bestOf2?: { score1: number; score2: number; chosen: 1 | 2 } } | null = null;
    let pass2Failed = false;
    let pass2Attempts = 0;

    // NOTE: do NOT skip pass 2 on request.signal.aborted.
    // Mobile tab-switch aborts the signal but the user expects the full result.
    // The generation must always complete both passes.
    if (remainingBudget < 30_000) {
      // Less than 30s left — not enough for a pass 2 attempt. Deliver pass 1.
      console.warn(`Deadline approaching (${Math.round(remainingBudget / 1000)}s left) — skipping pass 2 to avoid 504`);
      pass2Failed = true;
      pass2Attempts = 0;
    }

    if (!pass2Failed) for (let attempt = 1; attempt <= 2; attempt++) {
      pass2Attempts = attempt;
      try {
        pass2 = await generatePass(pass1Base64, trimmedSurface, trimmedFurniture, 2, outputSize, isOutdoor ? null : roomType, outdoorParam, roomInventory, base64Image);
        break; // success
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Pass 2 attempt ${attempt}/2 failed: ${msg}`);
        if (attempt < 2) {
          console.log("Retrying pass 2...");
        }
      }
    }

    const t2 = Date.now();

    // If pass 2 failed after 2 attempts, deliver pass 1 (surfaces only) with pass2Failed flag
    if (!pass2) {
      pass2Failed = true;
      console.warn("Pass 2 failed after 2 attempts — delivering pass 1 (surfaces only)");

      // Refund the credit — delivering an empty room (surfaces only) is not the paid service.
      // Only refund if a credit was actually decremented (not for iterations)
      if (session?.user?.id && !_pass1Key) {
        addCredits(session.user.id, 1).catch((refundErr) => {
          console.error("CRITICAL: Credit refund (pass2 failed) failed for user", session.user.id, refundErr);
        });
        console.log(`[generate] Credit refunded for user ${session.user.id} (pass 2 failed)`);
      }
    }

    const finalImage = pass2 ? pass2.image : pass1.image;
    const outputBase64 = finalImage.replace(/^data:image\/[\w+]+;base64,/, "");

    // CRITICAL: save furnished result as iteration base BEFORE response.
    // Replit autoscale kills the worker after response — fire-and-forget is lost.
    // Without this, "Affiner" gets an empty pass1 image instead of the furnished result.
    if (sessionId) {
      await saveIterationBase(sessionId, outputBase64).catch((err) =>
        console.error("saveIterationBase (initial gen) failed:", err)
      );
    }

    // Save to user gallery BEFORE sending response (critical for Replit autoscale).
    // On autoscale, the worker is killed after the response is sent.
    // Any async work after NextResponse.json() will be lost.
    let photoId: string | null = null;
    console.log(`[generate] saveUserPhoto check: userId="${session?.user?.id || "NONE"}" — ${session?.user?.id ? "WILL save to gallery" : "SKIPPING gallery save (no session)"}`);
    if (session?.user?.id) {
      try {
        const { saveImage: saveImg } = await import("@/lib/db");
        const ts = Date.now();

        // Save output image — retry once on failure
        let outputKey = await saveImg(outputBase64, `user_photo_${ts}_output`).catch((err) => {
          console.error("[saveUserPhoto] output saveImage failed (attempt 1):", err);
          return null;
        });

        if (!outputKey) {
          await new Promise((r) => setTimeout(r, 1000));
          outputKey = await saveImg(outputBase64, `user_photo_${ts}_output_r`).catch((err) => {
            console.error("[saveUserPhoto] output saveImage failed (attempt 2):", err);
            return null;
          });
        }

        if (outputKey) {
          // Save input and pass1 in parallel (non-critical)
          const [inputKey, pass1ImageKey] = await Promise.all([
            saveImg(base64Image, `user_photo_${ts}_input`).catch(() => null),
            pass1Base64 ? saveImg(pass1Base64, `user_photo_${ts}_pass1`).catch(() => null) : null,
          ]);

          photoId = await saveUserPhoto({
            userId: session.user.id,
            inputImageKey: inputKey,
            outputImageKey: outputKey,
            pass1ImageKey: pass1ImageKey,
            styleId: styleId || null,
            roomType: isOutdoor ? null : (roomType || null),
            roomLabel: null,
            isOutdoor: isOutdoor || false,
            propertyId: null,
          });
          console.log(`[generate] saveUserPhoto SUCCESS: photoId=${photoId} outputKey=${outputKey}`);
        } else {
          console.error("[saveUserPhoto] SKIPPING — outputKey null after 2 attempts");
        }
      } catch (err) {
        console.error("[saveUserPhoto] FAILED:", err);
      }
    }
    console.log(`[generate] photoId final: ${photoId || "NULL"} for userId="${session?.user?.id || "NONE"}"`);

    // Ensure cache save completed before checking pass1Saved
    await pass1CachePromise;

    const response = NextResponse.json({
      image: finalImage,
      model: pass2 ? `${pass1.model} → ${pass2.model}` : `${pass1.model} (surfaces uniquement — passe 2 échouée)`,
      ...(pass1Saved ? { pass1_key: pass1CacheKey } : {}),
      ...(photoId ? { photoId } : {}),
      ...(pass2Failed ? { pass2Failed: true } : {}),
    });

    // Log to DB BEFORE returning response (Replit autoscale kills worker after response)
    await logGeneration({
      ip, styleId, surfacePrompt: trimmedSurface, furniturePrompt: trimmedFurniture,
      withFurniture: true, inputWidth: width, inputHeight: height,
      modelUsed: pass2 ? `${pass1.model} → ${pass2.model}` : `${pass1.model} (pass2 failed x${pass2Attempts})`,
      pass1Model: pass1.model, pass2Model: pass2?.model ?? "FAILED",
      durationMs: t2 - t0, pass1DurationMs: t1 - t0, pass2DurationMs: t2 - t1,
      success: !pass2Failed,
      builtPromptPass1, builtPromptPass2,
      inputBase64: base64Image, pass1Base64, outputBase64,
      sessionId: sessionId ?? undefined,
      pass1CacheKey,
      roomType: isOutdoor ? undefined : (roomType ?? undefined),
      isOutdoor: isOutdoor || undefined,
      outdoorSubtype: isOutdoor ? (outdoorSubtype ?? undefined) : undefined,
      promptVersion: PROMPT_VERSION,
      roomInventory: roomInventory || undefined,
      generationType: "generation",
      bestOf2Score1: pass2?.bestOf2?.score1,
      bestOf2Score2: pass2?.bestOf2?.score2,
      bestOf2Chosen: pass2?.bestOf2?.chosen,
    }).catch((err) => console.error("DB log failed:", err));

    // Generation succeeded — credit was already decremented optimistically

    return response;
  } catch (error) {
    console.error("Generation error:", error);
    const message =
      error instanceof Error ? error.message : "Erreur interne du serveur";

    // ── Async queue fallback: if the error is transient and user is logged in,
    // enqueue for background retry instead of refunding immediately.
    if (session?.user?.id && shouldQueue(error) && _image && _surfacePrompt && _furniturePrompt) {
      try {
        // Save input image to Object Storage for the queue worker
        const base64ForQueue = _image.replace(/^data:image\/[\w+]+;base64,/, "");
        const inputKey = await saveImage(base64ForQueue, `queue_${Date.now()}_${session.user.id}_input`);

        const queueId = await enqueueGeneration({
          userId: session.user.id,
          inputImageKey: inputKey,
          surfacePrompt: _surfacePrompt.trim(),
          furniturePrompt: _furniturePrompt.trim(),
          styleId: styleId ?? null,
          roomType: _isOutdoor ? null : (_roomType ?? null),
          isOutdoor: _isOutdoor || false,
          outdoorSubtype: _isOutdoor ? (_outdoorSubtype ?? null) : null,
          inputWidth: _width ?? 1024,
          inputHeight: _height ?? 1024,
          withFurniture: _withFurniture !== false,
        });

        console.log(`[generate] Queued job ${queueId} for user ${session.user.id} (original error: ${message})`);

        // Log the queue event
        logGeneration({
          ip, styleId,
          surfacePrompt: _surfacePrompt.trim(), furniturePrompt: _furniturePrompt.trim(),
          withFurniture: true, success: false, errorMessage: `QUEUED: ${message}`, promptVersion: PROMPT_VERSION,
        }).catch((err) => console.error("DB log failed:", err));

        // Return 202 Accepted — credit stays reserved (not refunded yet)
        return NextResponse.json({
          queued: true,
          queueId,
          message: "Génération lancée en arrière-plan. Vous serez notifié dès que c'est prêt.",
        }, { status: 202 });
      } catch (queueError) {
        console.error("[generate] Queue fallback failed:", queueError);
        // Fall through to standard error handling below
      }
    }

    // Standard error handling: refund credit + return error
    // Only refund if a credit was actually decremented (not for iterations)
    if (session?.user?.id && !_pass1Key) {
      addCredits(session.user.id, 1).catch((refundErr) => {
        console.error("CRITICAL: Credit refund failed for user", session.user.id, refundErr);
        getPool().query(
          `INSERT INTO generation_logs (ip, style_id, success, error_message)
           VALUES ($1, $2, false, $3)`,
          [ip, "refund_failed", `Refund failed for user ${session.user.id}: ${refundErr instanceof Error ? refundErr.message : "unknown"}`]
        ).catch(() => {});
      });
    }

    // Log failures too
    logGeneration({
      ip, styleId,
      surfacePrompt: "error", furniturePrompt: "error",
      withFurniture: true, success: false, errorMessage: message, promptVersion: PROMPT_VERSION,
    }).catch((err) => console.error("DB log failed:", err));

    return NextResponse.json({ error: message }, { status: 503 });
  }
}
