import { isOrderStatus, OrderStatus } from '@foodordering/core/orders';
import { Badge } from '@/components/ui/badge';

const STATUS_BADGE: Record<OrderStatus, 'default' | 'secondary' | 'outline'> = {
  New: 'default',
  Cooking: 'outline',
  Delivering: 'outline',
  Delivered: 'secondary',
};

export const OrderStatusBadge = ({ status }: { status: string }) => {
  if (isOrderStatus(status)) {
    return <Badge variant={STATUS_BADGE[status]}>{status}</Badge>;
  }
  return status;
};
