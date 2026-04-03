import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getPool, ensureTable } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vous devez être connecté." },
        { status: 401 }
      );
    }

    await ensureTable();
    const db = getPool();

    const result = await db.query(
      `SELECT stripe_customer_id FROM users WHERE id = $1`,
      [session.user.id]
    );

    const customerId = result.rows[0]?.stripe_customer_id;
    if (!customerId) {
      return NextResponse.json(
        { error: "Aucun achat enregistré. Effectuez un premier achat pour accéder à cet espace." },
        { status: 404 }
      );
    }

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://versimo.fr";

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/compte`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'accès au portail de facturation." },
      { status: 500 }
    );
  }
}
