import { withSupabase } from '@supabase/server';
import { stripe } from '../_utils/stripe.ts';
import { createOrderFromPaymentIntent } from '../_utils/orders.ts';

// Stripe calls this after a payment succeeds, so the order is created even if the app
// was closed before it called create-order. Not authenticated with Supabase keys:
// the Stripe-Signature header (signed with STRIPE_WEBHOOK_SECRET) proves the sender.

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    const signature = req.headers.get('stripe-signature');
    if (!signature) return Response.json({ error: 'Missing signature' }, { status: 400 });

    let event;
    try {
      // Verify against the raw body: parsing JSON first would break the signature
      event = await stripe.webhooks.constructEventAsync(await req.text(), signature, webhookSecret);
    } catch (error) {
      console.warn('stripe-webhook: invalid signature', (error as Error).message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type !== 'payment_intent.succeeded') {
      return Response.json({ received: true, ignored: event.type });
    }

    const paymentIntent = event.data.object;
    // Payments not created by payment-sheet (e.g. from the Stripe Dashboard) have no cart
    if (!paymentIntent.metadata?.uid || !paymentIntent.metadata?.cart) {
      return Response.json({ received: true, ignored: 'no cart metadata' });
    }

    try {
      // Local and cloud share one Stripe sandbox: a payment made against the other
      // environment has a uid this database doesn't know. Ack it so Stripe stops retrying.
      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', paymentIntent.metadata.uid)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) {
        console.warn('stripe-webhook: unknown user, ignoring', paymentIntent.id);
        return Response.json({ received: true, ignored: 'unknown user' });
      }

      const order = await createOrderFromPaymentIntent(ctx.supabaseAdmin, paymentIntent);
      return Response.json({ received: true, order_id: order.id });
    } catch (error) {
      // Non-2xx makes Stripe retry the event (with backoff, for up to 3 days)
      console.error('stripe-webhook: create order failed', paymentIntent.id, error);
      return Response.json({ error: 'Order creation failed' }, { status: 500 });
    }
  }),
};
