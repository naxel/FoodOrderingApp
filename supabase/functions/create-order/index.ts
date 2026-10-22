import { withSupabase } from '@supabase/server';
import { stripe } from '../_utils/stripe.ts';
import { createOrderFromPaymentIntent } from '../_utils/orders.ts';

// Creates the order for a PaymentIntent that the user has already paid.
// Amount and items come from the PaymentIntent (set by payment-sheet), never from the client.
// Safe to retry, and safe to race with stripe-webhook: both return the same order.

export default {
  fetch: withSupabase({ auth: ['user'] }, async (req, ctx) => {
    const { supabaseAdmin, userClaims } = ctx;
    if (!userClaims) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      const { paymentIntentId } = await req.json().catch(() => ({}));
      if (typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
        return Response.json({ error: 'paymentIntentId is required' }, { status: 400 });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.metadata.uid !== userClaims.id) {
        return Response.json({ error: 'Payment not found' }, { status: 404 });
      }
      if (paymentIntent.status !== 'succeeded') {
        return Response.json({ error: `Payment is ${paymentIntent.status}` }, { status: 409 });
      }

      return Response.json(await createOrderFromPaymentIntent(supabaseAdmin, paymentIntent));
    } catch (error) {
      console.error('create-order failed', error);
      return Response.json(
        { error: (error as { message?: string })?.message ?? 'Unknown error' },
        { status: 500 },
      );
    }
  }),
};
