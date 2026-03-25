import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe, getPackById } from "@/lib/stripe";
import { getPool, ensureTable } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "Vous devez etre connecte pour acheter des credits." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packId, retractationAccepted } = body;

    const pack = getPackById(packId);
    if (!pack) {
      return NextResponse.json(
        { error: "Pack invalide." },
        { status: 400 }
      );
    }

    // Server-side validation of retractation acceptance (Art. L221-28)
    if (retractationAccepted !== true) {
      return NextResponse.json(
        { error: "Vous devez accepter la clause de rétractation avant de procéder au paiement." },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://architecture-toum92.replit.app";

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: session.user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: pack.priceCents,
            product_data: {
              name: `Versiroom — Pack ${pack.name}`,
              description: `${pack.credits} credits de generation IA`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        packId: pack.id,
        credits: String(pack.credits),
        retractation_accepted: retractationAccepted ? "true" : "false",
      },
      success_url: `${baseUrl}/?checkout=success&pack=${pack.id}`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
    });

    // Record pending purchase
    try {
      await ensureTable();
      const db = getPool();
      await db.query(
        `INSERT INTO purchases (user_id, stripe_session_id, pack_id, credits_purchased, amount_cents, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [
          session.user.id,
          checkoutSession.id,
          pack.id,
          pack.credits,
          pack.priceCents,
        ]
      );
    } catch (dbErr) {
      // Non-blocking: purchase will be reconciled via webhook
      console.error("Failed to record pending purchase:", dbErr);
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la creation du paiement." },
      { status: 500 }
    );
  }
}
