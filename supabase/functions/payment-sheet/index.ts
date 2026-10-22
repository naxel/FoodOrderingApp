import { withSupabase } from '@supabase/server';
import { stripe } from '../_utils/stripe.ts';
import { createOrRetrieveProfile } from '../_utils/supabase.ts';
import { CartError, encodeCart, parseCart, priceCart } from '../_utils/cart.ts';

// Creates a PaymentIntent for the user's cart, priced on the server.
// Requires a signed-in user: Authorization: Bearer <user JWT> (see README, "Calling a function locally").
export default {
  fetch: withSupabase({ auth: ['user'] }, async (req, ctx) => {
    if (!ctx.userClaims) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      // Validate the cart and price it from the DB before any Stripe call
      const { items } = await req.json().catch(() => ({}));
      const cart = parseCart(items);
      const amount = await priceCart(ctx.supabase, cart);
      const metadata = { uid: ctx.userClaims.id, cart: encodeCart(cart) };

      const customerId = await createOrRetrieveProfile(ctx);
      const [customerSession, paymentIntent] = await Promise.all([
        stripe.customerSessions.create({
          customer: customerId,
          components: {
            mobile_payment_element: {
              enabled: true,
              features: {
                payment_method_save: 'enabled',
                payment_method_redisplay: 'enabled',
                payment_method_remove: 'enabled',
              },
            },
          },
        }),
        stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          customer: customerId,
          metadata,
        }),
      ]);

      console.log('PaymentIntent created', paymentIntent.id, amount);
      return Response.json({
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
        paymentIntent: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerSessionClientSecret: customerSession.client_secret,
        customer: customerId,
      });
    } catch (error) {
      if (error instanceof CartError) {
        return Response.json({ error: error.message }, { status: 400 });
      }
      // Input is already validated, so anything else is a server-side failure
      console.error('payment-sheet failed', error);
      return Response.json({ error: 'Payment setup failed' }, { status: 500 });
    }
  }),
};
