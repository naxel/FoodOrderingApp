import { withSupabase } from '@supabase/server';
import { stripe } from '../_utils/stripe.ts';
import { decodeCart } from '../_utils/cart.ts';

// Creates the order for a PaymentIntent that the user has already paid.
// Amount and items come from the PaymentIntent (set by payment-sheet), never from the client.
// Safe to retry: payment_intent_id is unique, a repeated call returns the same order.

export default {
  fetch: withSupabase({ auth: ['user'] }, async (req, ctx) => {
    const { supabaseAdmin, userClaims } = ctx;
    if (!userClaims) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const findOrder = (paymentIntentId: string) =>
      supabaseAdmin
        .from('orders')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .maybeSingle();

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

      const { data: existing, error: findError } = await findOrder(paymentIntent.id);
      if (findError) throw findError;
      if (existing) return Response.json(existing);

      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: userClaims.id,
          total: paymentIntent.amount_received / 100,
          payment_intent_id: paymentIntent.id,
        })
        .select()
        .single();
      if (orderError) {
        // A parallel retry inserted the order first
        if (orderError.code === '23505') {
          const { data } = await findOrder(paymentIntent.id);
          return Response.json(data);
        }
        throw orderError;
      }

      const items = decodeCart(paymentIntent.metadata.cart).map((line) => ({
        ...line,
        order_id: order.id,
      }));
      const { error: itemsError } = await supabaseAdmin.from('order_items').insert(items);
      if (itemsError) {
        // Don't leave an order without items; the client can retry
        await supabaseAdmin.from('orders').delete().eq('id', order.id);
        throw itemsError;
      }

      console.log('Order created', order.id, 'for', paymentIntent.id);
      return Response.json(order);
    } catch (error) {
      console.error('create-order failed', error);
      return Response.json(
        { error: (error as { message?: string })?.message ?? 'Unknown error' },
        { status: 500 },
      );
    }
  }),
};
