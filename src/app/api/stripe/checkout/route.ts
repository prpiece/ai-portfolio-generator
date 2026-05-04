import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as any })
  : null;

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }
  try {
    const { userId, email, priceId } = await req.json();
    console.log('Checkout request:', { userId, priceId });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${new URL(req.url).origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(req.url).origin}/pricing?canceled=true`,
      metadata: {
        userId,
        plan: priceId === 'price_1TT6S4I3pjtrPrSClv8KpW0d' ? 'pro' : 'enterprise',
        credits: priceId === 'price_1TT6S4I3pjtrPrSClv8KpW0d' ? '100' : '250',
      },
      customer_email: email,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
