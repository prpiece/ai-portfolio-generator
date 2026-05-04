"use server";

import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-01-27.acacia" as any })
  : null;

// This ONLY talks to Stripe API (HTTP), no Firestore involved
export async function verifyCheckout(sessionId: string) {
  if (!stripe) throw new Error("Stripe not configured");
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    userId: session.metadata?.userId || null,
    plan: session.metadata?.plan || null,
    credits: parseInt(session.metadata?.credits || "0"),
  };
}
