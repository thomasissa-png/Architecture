export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserCredits, hasProAccess, hasGalleryAccess, hasStarterAccess, getMaxIterations } from "@/lib/credits";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const [credits, hasPro, hasGallery, hasStarter, maxIterations] = await Promise.all([
      getUserCredits(session.user.id),
      hasProAccess(session.user.id),
      hasGalleryAccess(session.user.id),
      hasStarterAccess(session.user.id),
      getMaxIterations(session.user.id),
    ]);

    return NextResponse.json({
      credits,
      hasPro,
      hasStarter,
      hasGalleryAccess: hasGallery,
      maxIterations,
      email: session.user.email,
      name: session.user.name,
    });
  } catch (err) {
    console.error("Credits fetch error:", err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
