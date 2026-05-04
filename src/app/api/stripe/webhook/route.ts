import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { getServerSupabase } from '@/lib/supabase';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as any })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.log(`🔔 Webhook: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, plan, credits } = session.metadata || {};
    const customerId = session.customer as string;
    
    console.log(`📦 Metadata: userId=${userId}, plan=${plan}, credits=${credits}, customerId=${customerId}`);

    if (userId) {
      try {
        const supabase = getServerSupabase();
        const { error } = await supabase
          .from('users')
          .upsert({
            uid: userId,
            plan: plan,
            credits: parseInt(credits || '0'),
            stripe_customer_id: customerId,
          }, { onConflict: 'uid' });

        if (error) {
          console.error(`❌ Webhook DB write failed:`, error.message);
        } else {
          console.log(`✅ User ${userId} upgraded to ${plan} with ${credits} credits`);
        }
      } catch (err: any) {
        console.error(`❌ Webhook error:`, err.message);
      }
    }
  }

  return NextResponse.json({ received: true });
}
