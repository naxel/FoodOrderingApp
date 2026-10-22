// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';
import { stripe } from '../_utils/stripe.ts';
import { createOrRetrieveProfile } from '../_utils/supabase.ts';
import { CartError, encodeCart, parseCart, priceCart } from '../_utils/cart.ts';

console.log('Hello from Functions!');

// This endpoint uses 'publishable' | 'secret' access, apiKey is required.
// Use publishable for Client-facing, key-validated endpoints
// Use secret for Server-to-server, internal calls
export default {
  fetch: withSupabase({ auth: ['user'] }, async (req, ctx) => {
    try {
      // Called by another service with a secret key
      // ctx.supabaseAdmin bypasses RLS — use for privileged operations
      /*
      if (ctx.authMode === "secret") {
        const { user_id } = await req.json();
        const { data } = await ctx.supabaseAdmin.auth.admin.getUserById(user_id);

        return Response.json({
          email: data?.user?.email,
        });
      }
      */
      // Validate the cart and price it from the DB before any Stripe call
      const { items } = await req.json().catch(() => ({}));
      const cart = parseCart(items);
      const amount = await priceCart(ctx.supabase, cart);
      if (!ctx.userClaims) return Response.json({ error: 'Unauthorized' }, { status: 401 });
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
      const res = {
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
        paymentIntent: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerSessionClientSecret: customerSession.client_secret,
        customer: customerId,
      };

      return new Response(JSON.stringify(res), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });

      // return Response.json({
      //   message: `Hello ${name}!`,
      // });
    } catch (error) {
      if (error instanceof CartError) {
        return Response.json({ error: error.message }, { status: 400 });
      }
      return new Response(JSON.stringify(error), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  }),
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/payment-sheet' \
    --header 'apiKey: LOCAL_SUPABASE_PUBLISHABLE_KEY' \
    --data '{"amount":1050}'

*/
