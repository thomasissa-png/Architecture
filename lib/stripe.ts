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
  { id: "decouverte", name: "Decouverte", credits: 5, priceCents: 490 },
  { id: "starter", name: "Starter", credits: 20, priceCents: 1490 },
  { id: "pro", name: "Pro", credits: 50, priceCents: 2900 },
  { id: "studio", name: "Studio", credits: 150, priceCents: 6900 },
] as const;

export type PackId = (typeof PACKS)[number]["id"];

export function getPackById(packId: string) {
  return PACKS.find((p) => p.id === packId) ?? null;
}
