import { ProductForm } from '@/components/product-form';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateProduct } from '@/app/(admin)/products/actions';
import { Suspense } from 'react';
import { ListSkeleton } from '@/components/list-skeleton';

type Params = PageProps<'/products/[id]'>['params'];

async function EditProductForm({ params }: { params: Params }) {
  const { id } = await params; // Next 15+: params = Promise
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, price, image')
    .eq('id', productId)
    .maybeSingle()
    .throwOnError();

  if (!product) {
    notFound();
  }

  let imageUrl;
  if (product.image) {
    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(product.image);
    imageUrl = publicUrl;
  }

  return (
    <ProductForm
      submitLabel="Update"
      defaultValues={{ name: product.name, price: product.price }}
      imageUrl={imageUrl}
      onSave={updateProduct.bind(null, productId)}
    />
  );
}

export default function EditProduct({ params }: PageProps<'/products/[id]'>) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <EditProductForm params={params} />
    </Suspense>
  );
}
