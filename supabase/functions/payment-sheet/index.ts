// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';
import { stripe } from '../_utils/stripe.ts';

console.log('Hello from Functions!');

// This endpoint uses 'publishable' | 'secret' access, apiKey is required.
// Use publishable for Client-facing, key-validated endpoints
// Use secret for Server-to-server, internal calls
export default {
  fetch: withSupabase({ auth: ['publishable', 'secret'] }, async (req, ctx) => {
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

      const { amount } = await req.json();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'USD',
      });

      const res = {
        paymentIntent: paymentIntent.client_secret,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      };

      return new Response(JSON.stringify(res), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });

      // return Response.json({
      //   message: `Hello ${name}!`,
      // });
    } catch (error) {
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
