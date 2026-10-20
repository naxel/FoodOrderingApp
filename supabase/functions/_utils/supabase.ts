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
    return profile.stripe_customer_id;
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
