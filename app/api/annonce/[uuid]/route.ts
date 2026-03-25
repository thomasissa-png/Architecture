/**
 * F6 — GET /api/annonce/[uuid]
 * Public endpoint: returns annonce data (property + photos + merchant).
 * No auth required.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAnnonceByUuid, isAnnonceActive } from "@/lib/annonce";
import { getPropertyById } from "@/lib/properties";
import { getUserPhotos } from "@/lib/user-photos";
import { getMerchantProfile } from "@/lib/merchant";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  const annonce = await getAnnonceByUuid(params.uuid);

  if (!annonce) {
    return NextResponse.json(
      { error: "Annonce introuvable." },
      { status: 404 }
    );
  }

  if (!isAnnonceActive(annonce)) {
    return NextResponse.json(
      { error: "Annonce expiree ou archivee." },
      { status: 410 }
    );
  }

  // Fetch property — getPropertyById requires userId for ownership check,
  // but we already know the annonce belongs to the user, so we pass annonce.user_id
  const property = await getPropertyById(annonce.property_id, annonce.user_id);
  if (!property) {
    return NextResponse.json(
      { error: "Bien associe introuvable." },
      { status: 404 }
    );
  }

  // Fetch photos for this property
  const photos = await getUserPhotos(annonce.user_id, {
    propertyId: annonce.property_id,
  });

  // Fetch merchant profile
  const merchant = await getMerchantProfile(annonce.user_id);

  return NextResponse.json({
    annonce: {
      uuid: annonce.uuid,
      title: annonce.title,
      created_at: annonce.created_at,
      expires_at: annonce.expires_at,
    },
    property: {
      property_type: property.property_type,
      surface_m2: property.surface_m2,
      room_count: property.room_count,
      sale_price: property.sale_price,
      city: property.city,
      postal_code: property.postal_code,
      address_normalized: property.address_normalized,
      description: property.description_final || property.description_generated,
    },
    photos: photos
      .filter((p) => p.output_image_key)
      .map((p) => ({
        id: p.id,
        output_image_key: p.output_image_key,
        room_type: p.room_type,
        room_label: p.room_label,
        style_id: p.style_id,
        is_outdoor: p.is_outdoor,
      })),
    merchant: merchant
      ? {
          raison_sociale: merchant.raison_sociale,
          telephone: merchant.telephone,
          email_pro: merchant.email_pro,
          logo_storage_key: merchant.logo_storage_key,
          couleur_principale: merchant.couleur_principale,
          couleur_secondaire: merchant.couleur_secondaire,
        }
      : null,
  });
}
