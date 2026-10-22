import type Stripe from 'stripe';
import type { SupabaseContext } from '@supabase/server';
import { decodeCart } from './cart.ts';

type AdminClient = SupabaseContext['supabaseAdmin'];

// Creates the order for a succeeded PaymentIntent from its metadata (set by payment-sheet).
// Called by create-order (the app) and stripe-webhook (Stripe), whichever comes first;
// payment_intent_id is unique, so both get the same order.
export const createOrderFromPaymentIntent = async (
  supabaseAdmin: AdminClient,
  paymentIntent: Stripe.PaymentIntent,
) => {
  const findOrder = () =>
    supabaseAdmin
      .from('orders')
      .select('*')
      .eq('payment_intent_id', paymentIntent.id)
      .maybeSingle();

  const { data: existing, error: findError } = await findOrder();
  if (findError) throw findError;
  if (existing) return existing;

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: paymentIntent.metadata.uid,
      total: paymentIntent.amount_received / 100,
      payment_intent_id: paymentIntent.id,
    })
    .select()
    .single();
  if (orderError) {
    // The other caller inserted the order first
    if (orderError.code === '23505') {
      const { data, error } = await findOrder();
      if (error || !data) throw error ?? orderError;
      return data;
    }
    throw orderError;
  }

  const items = decodeCart(paymentIntent.metadata.cart).map((line) => ({
    ...line,
    order_id: order.id,
  }));
  const { error: itemsError } = await supabaseAdmin.from('order_items').insert(items);
  if (itemsError) {
    // Don't leave an order without items; the caller can retry
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    throw itemsError;
  }

  console.log('Order created', order.id, 'for', paymentIntent.id);
  return order;
};
