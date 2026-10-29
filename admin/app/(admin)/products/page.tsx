import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProductRowActions } from '@/components/product-row-actions';

const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default async function Products() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, image, price')
    .is('archived_at', null)
    .order('id')
    .throwOnError();

  return (
    <>
      <h1>Products</h1>
      <Table>
        <TableCaption>A list of products</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                {product.image ? (
                  <Image
                    src={
                      supabase.storage.from('product-images').getPublicUrl(product.image).data
                        .publicUrl
                    }
                    alt={product.name}
                    width={48}
                    height={48}
                    className="size-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-md bg-muted">
                    <ImageOff className="size-4 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell>{price.format(product.price)}</TableCell>
              <TableCell className="text-right">
                <ProductRowActions product={product} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button asChild>
        <Link href="/products/new">New product</Link>
      </Button>
    </>
  );
}
