import { ProductForm } from '@/components/product-form';
import { createProduct } from '@/app/(admin)/products/actions';

export default function CreateProduct() {
  return <ProductForm submitLabel="Create" onSave={createProduct} />;
}
