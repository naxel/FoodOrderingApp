import { stripe } from './stripe.ts';

export const createOrRetrieveProfile = async (ctx) => {
  console.log('createOrRetrieveProfile');
  const { supabase, supabaseAdmin, userClaims, jwtClaims, authMode } = ctx;
  // supabase       — RLS-scoped to the authenticated user
  // supabaseAdmin  — bypasses RLS (service role)
  // userClaims     — user identity from JWT (id, email, role)
  // jwtClaims      — full JWT claims
  // authMode       — which auth mode matched
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userClaims.id)
    .single();

  if (error || !profile) throw new Error('Profile not found');

  if (profile.stripe_customer_id) {
    const existing = await stripe.customers.retrieve(profile.stripe_customer_id);
    if (!existing.deleted) {
      // Never trust the stored id alone: it must belong to this user
      if (existing.metadata?.uid !== userClaims.id) {
        console.error(`Stripe customer ${existing.id} does not belong to user ${userClaims.id}`);
        throw new Error('Stripe customer mismatch');
      }
      return existing.id;
    }
    // Customer was deleted in Stripe — create a new one below
  }

  const customer = await stripe.customers.create({
    email: userClaims.email,
    metadata: { uid: userClaims.id },
  });
  console.log(`New customer "${customer.id}" created for user "${profile.id}"`);
  await supabaseAdmin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', profile.id);

  return customer.id;
};
