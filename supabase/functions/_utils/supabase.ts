import type { SupabaseContext } from '@supabase/server';
import { stripe } from './stripe.ts';

// Returns the user's Stripe customer id, creating the customer on the first checkout
export const createOrRetrieveProfile = async ({
  supabase,
  supabaseAdmin,
  userClaims,
}: SupabaseContext) => {
  if (!userClaims) throw new Error('Unauthorized');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userClaims.id)
    .single();

  if (error || !profile) throw new Error('Profile not found');

  const previousId: string | null = profile.stripe_customer_id;
  if (previousId) {
    const existing = await stripe.customers.retrieve(previousId);
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

  const customer = await stripe.customers.create(
    { email: userClaims.email, metadata: { uid: userClaims.id } },
    // A double tap on checkout gets the same customer back. The previous id is part of the
    // key, otherwise re-creating after a deletion would return the deleted customer for 24h
    { idempotencyKey: `customer-${userClaims.id}-${previousId ?? 'none'}` },
  );

  // Save only if nobody replaced the id since we read it
  const update = supabaseAdmin
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userClaims.id);
  const { data: updated, error: updateError } = await (
    previousId ? update.eq('stripe_customer_id', previousId) : update.is('stripe_customer_id', null)
  ).select('stripe_customer_id');
  if (updateError) throw updateError;

  if (!updated?.length) {
    // A parallel request saved its customer first — use that one
    const { data, error: readError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userClaims.id)
      .single();
    if (readError || !data?.stripe_customer_id) throw readError ?? new Error('Profile not found');
    return data.stripe_customer_id as string;
  }

  console.log(`New customer "${customer.id}" created for user "${userClaims.id}"`);
  return customer.id;
};
