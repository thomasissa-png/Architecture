/**
 * GET /api/pro/projects/:id/share-token — Récupérer ou créer un token de partage
 *
 * Rendu : force-dynamic (lecture DB).
 * Auth + ownership obligatoires.
 * Retourne un UUID unique pour la page publique /projet/partage/[token].
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireProjectOwnership,
  isErrorResponse,
} from "@/lib/marchand/auth-helpers";
import { getOrCreateShareToken } from "@/lib/marchand/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  // Auth + ownership
  const authResult = await requireProjectOwnership(request, projectId);
  if (isErrorResponse(authResult)) return authResult;

  try {
    const token = await getOrCreateShareToken(projectId);

    return NextResponse.json({
      share_token: token,
      share_url: `/projet/partage/${token}`,
    });
  } catch (err) {
    console.error(
      `[GET /api/pro/projects/${projectId}/share-token] Error:`,
      err
    );
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: "Erreur lors de la création du lien de partage.",
      },
      { status: 500 }
    );
  }
}
