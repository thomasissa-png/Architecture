/**
 * Property Dossier API.
 * POST /api/properties/[id]/dossier — Create a dossier from selected photos of a property
 *
 * Creates a dossier snapshot with property info and selected photos,
 * then generates the branded PDF.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasProAccess, getUserCredits } from "@/lib/credits";
import { getPropertyById } from "@/lib/properties";
import { getUserPhotoById } from "@/lib/user-photos";
import { createDossier, addDossierPhoto, updateDossierStatus, getDossierByUuid } from "@/lib/dossier";

export const dynamic = "force-dynamic";

// ─── POST: Create dossier from property photos ──────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  // Mode Marchand requires Pack Pro
  const proAccess = await hasProAccess(session.user.id);
  if (!proAccess) {
    return NextResponse.json(
      { error: "Le Mode Marchand est reserve aux utilisateurs ayant achete un Pack Pro ou superieur." },
      { status: 403 }
    );
  }

  const credits = await getUserCredits(session.user.id);
  if (credits < 1) {
    return NextResponse.json(
      { error: "Credits insuffisants." },
      { status: 402 }
    );
  }

  try {
    // 1. Verify property
    const property = await getPropertyById(params.id, session.user.id);
    if (!property) {
      return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
    }

    // 2. Parse body
    const body = await request.json();
    const {
      selectedPhotoIds,
      coverPhotoId,
      photoOrder,
    } = body as {
      selectedPhotoIds?: string[];
      coverPhotoId?: string;
      photoOrder?: string[];
    };

    if (!selectedPhotoIds || selectedPhotoIds.length === 0) {
      return NextResponse.json(
        { error: "Selectionnez au moins une photo." },
        { status: 400 }
      );
    }

    if (selectedPhotoIds.length > 15) {
      return NextResponse.json(
        { error: "Maximum 15 photos par dossier." },
        { status: 400 }
      );
    }

    // 3. Validate all photos exist and belong to user
    const photos = await Promise.all(
      selectedPhotoIds.map((id) => getUserPhotoById(id, session.user.id))
    );
    const validPhotos = photos.filter(Boolean);
    if (validPhotos.length === 0) {
      return NextResponse.json(
        { error: "Aucune photo valide trouvee." },
        { status: 400 }
      );
    }

    // 4. Determine photo order (use provided order or selectedPhotoIds order)
    const orderedIds = photoOrder && photoOrder.length > 0 ? photoOrder : selectedPhotoIds;
    // Put cover photo first if specified
    const finalOrder = coverPhotoId
      ? [coverPhotoId, ...orderedIds.filter((id) => id !== coverPhotoId)]
      : orderedIds;

    // 5. Create dossier with property snapshot
    const dossier = await createDossier({
      userId: session.user.id,
      bienNom: property.address_normalized || property.address_raw || undefined,
      bienAdresse: property.address_raw || undefined,
      bienSurface: property.surface_m2 || undefined,
      bienPrix: property.sale_price || undefined,
      bienType: property.property_type || undefined,
      latitude: property.latitude || undefined,
      longitude: property.longitude || undefined,
      ville: property.city || undefined,
      codePostal: property.postal_code || undefined,
      descriptionCommerciale:
        property.description_final || property.description_generated || undefined,
      carteImageKey: property.map_image_key || undefined,
      prixMoyenM2: property.dvf_median_price_m2 || undefined,
      nbPieces: property.room_count || undefined,
    });

    // 6. Add photos to dossier in order
    for (let i = 0; i < finalOrder.length; i++) {
      const photoId = finalOrder[i];
      const photo = validPhotos.find((p) => p!.id === photoId);
      if (!photo) continue;

      await addDossierPhoto({
        dossierUuid: dossier.uuid,
        photoIndex: i,
        roomLabel: photo.room_label || undefined,
        roomTypeId: photo.room_type || undefined,
        styleId: photo.style_id || undefined,
        isOutdoor: photo.is_outdoor,
        inputImageKey: photo.input_image_key || "",
      });

      // Mark photo as completed since output already exists
      if (photo.output_image_key) {
        const { updateDossierPhotoStatus } = await import("@/lib/dossier");
        const { getDossierPhotos } = await import("@/lib/dossier");
        const dossierPhotos = await getDossierPhotos(dossier.uuid);
        const dp = dossierPhotos.find((dp) => dp.photo_index === i);
        if (dp) {
          await updateDossierPhotoStatus(dp.id, "completed", {
            outputImageKey: photo.output_image_key,
            pass1ImageKey: photo.pass1_image_key || undefined,
          });
        }
      }
    }

    // 7. Mark dossier as completed (photos are already generated)
    const completedCount = validPhotos.filter((p) => p!.output_image_key).length;
    await updateDossierStatus(dossier.uuid, "completed", {
      successCount: completedCount,
      failCount: validPhotos.length - completedCount,
    });

    // 8. Return dossier info with PDF URL
    return NextResponse.json({
      dossier: {
        uuid: dossier.uuid,
        pdfUrl: `/api/dossier/${dossier.uuid}/pdf`,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("Error creating property dossier:", err);
    return NextResponse.json(
      { error: "Erreur lors de la creation du dossier." },
      { status: 500 }
    );
  }
}
