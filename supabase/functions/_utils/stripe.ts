import Stripe from 'stripe';

// Fail on boot instead of on the first Stripe request
const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set');

export const stripe = new Stripe(secretKey);
