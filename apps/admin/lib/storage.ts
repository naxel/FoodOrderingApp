import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@foodordering/core/database.types';

export function productImageUrl(supabase: SupabaseClient<Database>, path: string) {
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}
