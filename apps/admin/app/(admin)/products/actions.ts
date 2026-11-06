'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { productSchema } from '@/lib/schemas/product';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

export async function createProduct(formData: FormData) {
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: 'Invalid product data' };

  const supabase = await createClient();
  let productImage = null;
  if (parsed.data.image instanceof File) {
    const { error: errorMessage, path } = await uploadImage(supabase, parsed.data.image);
    if (errorMessage) {
      return { error: errorMessage };
    }
    productImage = path;
  }

  const { error } = await supabase.from('products').insert({
    name: parsed.data.name,
    price: parsed.data.price,
    image: productImage ?? undefined,
  });
  if (error) {
    if (productImage) {
      await removeImage(supabase, productImage);
    }
    return { error: error.message };
  }

  revalidatePath('/products');
  redirect('/products');
}

export async function updateProduct(productId: number, formData: FormData) {
  if (!Number.isInteger(productId)) return { error: 'Product not found or access denied' };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: 'Invalid product data' };

  const supabase = await createClient();
  // Fetching product data for getting old image path
  const { data: oldProductData, error: fetchingImageError } = await supabase
    .from('products')
    .select('image')
    .eq('id', productId)
    .maybeSingle();
  if (fetchingImageError) return { error: fetchingImageError.message };
  if (!oldProductData) return { error: 'Product not found or access denied' };

  let productImage = null;
  if (parsed.data.image instanceof File) {
    // Upload new image
    const { error: errorMessage, path } = await uploadImage(supabase, parsed.data.image);
    if (errorMessage) {
      return { error: errorMessage };
    }
    productImage = path;
  }
  const { data, error } = await supabase
    .from('products')
    .update({
      name: parsed.data.name,
      price: parsed.data.price,
      image: productImage ?? undefined,
    })
    .eq('id', productId)
    .select('id');
  if (error || !data.length) {
    if (productImage) {
      // Was error with updating product, removing just uploaded image
      await removeImage(supabase, productImage);
    }
    if (error) return { error: error.message };
    if (!data.length) return { error: 'Product not found or access denied' };
  }

  if (productImage && oldProductData.image) {
    // Removing the old image after uploading a new image
    await removeImage(supabase, oldProductData.image);
  }

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

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get('name'),
    price: Number(formData.get('price')),
    image: formData.get('image') ?? undefined,
  });
}
async function uploadImage(
  supabase: SupabaseClient<Database>,
  file: File,
): Promise<{ path: string; error: null } | { path: null; error: string }> {
  const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[file.type];
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(`${crypto.randomUUID()}.${ext}`, file, {
      contentType: file.type,
    });
  if (error) {
    console.error('Error uploading image', error);
    return { error: 'Image upload failed', path: null };
  }
  return { path: data.path, error: null };
}

async function removeImage(supabase: SupabaseClient<Database>, path: string) {
  const { error } = await supabase.storage.from('product-images').remove([path]);
  if (error) console.error(`Failed to remove image ${path}`, error);
}
