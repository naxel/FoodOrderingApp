export const ORDER_STATUSES = ['New', 'Cooking', 'Delivering', 'Delivered'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export const STATUS_BADGE: Record<OrderStatus, 'default' | 'secondary' | 'outline'> = {
  New: 'default',
  Cooking: 'outline',
  Delivering: 'outline',
  Delivered: 'secondary',
};
