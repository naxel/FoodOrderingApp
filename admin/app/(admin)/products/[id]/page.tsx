import { ProductForm } from '@/components/product-form';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateProduct } from '@/app/(admin)/products/actions';

export default async function EditProduct({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params; // Next 15+: params = Promise
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, price')
    .eq('id', productId)
    .maybeSingle()
    .throwOnError();

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      submitLabel="Update"
      defaultValues={product}
      onSave={updateProduct.bind(null, productId)}
    />
  );
}
