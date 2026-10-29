'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { productSchema, type ProductInput } from '@/lib/schemas/product';

export async function createProduct(values: ProductInput) {
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) return { error: 'Invalid product data' };

  const supabase = await createClient();
  const { error } = await supabase.from('products').insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath('/products');
  redirect('/products');
}

export async function updateProduct(productId: number, values: ProductInput) {
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) return { error: 'Invalid product data' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .update(parsed.data)
    .eq('id', productId)
    .select('id');
  if (error) return { error: error.message };
  if (!data.length) return { error: 'Product not found or access denied' };

  revalidatePath('/products');
  redirect('/products');
}

export async function archiveProduct(productId: number) {
  if (!Number.isInteger(productId)) return { error: 'Product not found or access denied' };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', productId)
    .select('id');
  if (error) return { error: error.message };
  if (!data.length) return { error: 'Product not found or access denied' };

  revalidatePath('/products');
}
