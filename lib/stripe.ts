import Stripe from "stripe";

// Lazy singleton — Stripe SDK throws at instantiation if no API key is provided.
// Using a getter ensures the build succeeds even without STRIPE_SECRET_KEY configured.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

export const PACKS = [
  { id: "starter", name: "Starter", credits: 15, priceCents: 990, mode: "payment" as const },
  { id: "pro", name: "Pro", credits: 50, priceCents: 2900, mode: "subscription" as const },
  // Recharges Starter
  { id: "recharge-starter-10", name: "Recharge Starter +10 visuels", credits: 10, priceCents: 590, mode: "payment" as const },
  { id: "recharge-starter-25", name: "Recharge Starter +25 visuels", credits: 25, priceCents: 1290, mode: "payment" as const },
  // Recharges Pro
  { id: "recharge-pro-20", name: "Recharge Pro +20 visuels", credits: 20, priceCents: 900, mode: "payment" as const },
  { id: "recharge-pro-50", name: "Recharge Pro +50 visuels", credits: 50, priceCents: 1900, mode: "payment" as const },
] as const;

export type PackId = (typeof PACKS)[number]["id"];

export function getPackById(packId: string) {
  return PACKS.find((p) => p.id === packId) ?? null;
}
