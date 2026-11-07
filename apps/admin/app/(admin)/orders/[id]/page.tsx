import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import { ListSkeleton } from '@/components/list-skeleton';
import { dateFormat } from '@/lib/format';
import { priceFormat } from '@foodordering/core/format';
import { OrderStatusBadge } from '@/components/order-status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import Image from 'next/image';
import { productImageUrl } from '@/lib/storage';
import { ArrowLeft, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderStatusSelect } from '@/components/order-status-select';
import { isOrderStatus } from '@foodordering/core/orders';
import { OrdersRealtime } from '@/components/orders-realtime';

type Params = PageProps<'/orders/[id]'>['params'];

async function OrderDetails({ params }: { params: Params }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const supabase = await createClient();
  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, created_at, status, total, user_id, order_items(id, size, quantity, products(id, name, image, price))',
    )
    .eq('id', orderId)
    .maybeSingle()
    .throwOnError();

  if (!order) {
    notFound();
  }

  return (
    <>
      <h1>Order #{order.id}</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Date</dt>
        <dd>{dateFormat.format(new Date(order.created_at))}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>
          {isOrderStatus(order.status) ? (
            <OrderStatusSelect orderId={order.id} status={order.status} />
          ) : (
            <OrderStatusBadge status={order.status} />
          )}
        </dd>
        <dt className="text-muted-foreground">Client</dt>
        <dd>{order.user_id?.slice(0, 8) ?? '-'}</dd>
      </dl>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="text-center">Size</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Line total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.order_items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.products.image ? (
                  <Image
                    src={productImageUrl(supabase, item.products.image)}
                    alt={item.products.name}
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
              <TableCell>{item.products.name}</TableCell>
              <TableCell className="text-center">{item.size}</TableCell>
              <TableCell className="text-center">{item.quantity}</TableCell>
              <TableCell className="text-right">
                {priceFormat.format(item.products.price)}
              </TableCell>
              <TableCell className="text-right">
                {priceFormat.format(item.products.price * item.quantity)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5}>Total paid</TableCell>
            <TableCell className="text-right">{priceFormat.format(order.total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <p className="text-sm text-muted-foreground">
        Line prices are current product prices; the total is what was charged.
      </p>
      <OrdersRealtime filter={`id=eq.${order.id}`} />
    </>
  );
}

export default function Order({ params }: PageProps<'/orders/[id]'>) {
  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link href="/orders">
          <ArrowLeft />
          Orders
        </Link>
      </Button>
      <Suspense fallback={<ListSkeleton />}>
        <OrderDetails params={params} />
      </Suspense>
    </div>
  );
}
