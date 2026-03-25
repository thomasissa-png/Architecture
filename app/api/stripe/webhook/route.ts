import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { addCredits } from "@/lib/credits";
import { getPool, ensureTable } from "@/lib/db";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || "0", 10);
    const packId = session.metadata?.packId || "";

    if (userId && credits > 0) {
      try {
        await addCredits(userId, credits);

        // Update purchase status
        await ensureTable();
        const db = getPool();
        await db.query(
          `UPDATE purchases SET status = 'completed'
           WHERE stripe_session_id = $1`,
          [session.id]
        );

        console.log(
          `Credits added: ${credits} for user ${userId} (pack: ${packId})`
        );
      } catch (err) {
        console.error("Failed to process webhook:", err);
        // Return 500 so Stripe retries
        return NextResponse.json(
          { error: "Failed to add credits." },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
