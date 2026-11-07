import { Suspense } from 'react';
import { ListSkeleton } from '@/components/list-skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
import { dateFormat } from '@/lib/format';
import { priceFormat } from '@foodordering/core/format';
import { isOrderStatus, ORDER_STATUSES } from '@foodordering/core/orders';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { OrdersRealtime } from '@/components/orders-realtime';

type Params = PageProps<'/orders'>['searchParams'];

async function OrdersTable({ searchParams }: { searchParams: Params }) {
  const { status } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from('orders')
    .select('id, created_at, status, total, user_id')
    .order('created_at', { ascending: false });

  const raw = Array.isArray(status) ? status[0] : status;
  const activeStatus = isOrderStatus(raw) ? raw : undefined;

  if (activeStatus) query = query.eq('status', activeStatus);

  const { data: orders } = await query.throwOnError();

  return (
    <>
      <nav aria-label="Filter by status" className="flex gap-2">
        {ORDER_STATUSES.map((option) => (
          <Button
            key={option}
            asChild
            variant={activeStatus === option ? 'default' : 'outline'}
            aria-current={activeStatus === option ? 'page' : undefined}
          >
            <Link href={`/orders?status=${option}`}>{option}</Link>
          </Button>
        ))}
        <Button
          asChild
          variant={activeStatus === undefined ? 'default' : 'outline'}
          aria-current={activeStatus === undefined ? 'page' : undefined}
        >
          <Link href="/orders">All</Link>
        </Button>
      </nav>
      {orders.length > 0 ? (
        <Table>
          <TableCaption>A list of orders</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>#id</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Client</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/orders/${order.id}`}>{order.id}</Link>
                </TableCell>
                <TableCell>{dateFormat.format(new Date(order.created_at))}</TableCell>
                <TableCell className="text-center">
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>{priceFormat.format(order.total)}</TableCell>
                <TableCell className="text-right">{order.user_id?.slice(0, 8) ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No orders</p>
      )}
    </>
  );
}

export default function Orders({ searchParams }: PageProps<'/orders'>) {
  return (
    <>
      <h1>Orders</h1>
      <Suspense fallback={<ListSkeleton />}>
        <OrdersTable searchParams={searchParams} />
      </Suspense>
      <OrdersRealtime />
    </>
  );
}
