import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export const getClaims = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
});
