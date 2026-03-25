export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserCredits } from "@/lib/credits";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifi\u00E9." },
        { status: 401 }
      );
    }

    const credits = await getUserCredits(session.user.id);

    return NextResponse.json({
      credits,
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
