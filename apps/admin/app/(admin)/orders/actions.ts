'use server';
import { refresh } from 'next/cache';
import { isOrderStatus, OrderStatus } from '@foodordering/core/orders';
import { createClient } from '@/lib/supabase/server';
import { functionErrorMessage } from '@/lib/functions';

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  if (!Number.isInteger(orderId)) return { error: 'Order not found' };

  if (!isOrderStatus(status)) return { error: 'Invalid status' };
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke<{ notified: boolean }>(
    'update-order-status',
    {
      body: { orderId, status },
    },
  );
  if (error || !data) {
    return { error: await functionErrorMessage(error) };
  }
  refresh();
  return { error: null, notified: data.notified };
}
