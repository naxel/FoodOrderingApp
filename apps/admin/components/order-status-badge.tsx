import { isOrderStatus, STATUS_BADGE } from '@/lib/orders';
import { Badge } from '@/components/ui/badge';

export const OrderStatusBadge = ({ status }: { status: string }) => {
  if (isOrderStatus(status)) {
    return <Badge variant={STATUS_BADGE[status]}>{status}</Badge>;
  }
  return status;
};
