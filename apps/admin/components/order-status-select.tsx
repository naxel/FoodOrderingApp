'use client';

import { Field, FieldError } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ORDER_STATUSES, OrderStatus } from '@foodordering/core/orders';
import { useLayoutEffect, useOptimistic, useState, useTransition } from 'react';
import { updateOrderStatus } from '@/app/(admin)/orders/actions';

type Props = {
  orderId: number;
  status: OrderStatus;
};

export function OrderStatusSelect({ orderId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState('');
  const [notified, setNotified] = useState<boolean | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);

  useLayoutEffect(
    () => () => {
      setNotified(null);
      setErrorMessage('');
    },
    [],
  );

  const handleValueChange = (newStatus: OrderStatus) => {
    startTransition(async () => {
      setErrorMessage('');
      setNotified(null);
      setOptimisticStatus(newStatus);
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setNotified(result.notified ?? false);
      }
    });
  };
  return (
    <Field className="w-full max-w-48">
      <Select disabled={isPending} value={optimisticStatus} onValueChange={handleValueChange}>
        <SelectTrigger aria-label="Order status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {ORDER_STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
      {notified !== null && (
        <p role="status" className="text-sm text-muted-foreground">
          {notified ? 'Customer notified' : 'No push token'}
        </p>
      )}
    </Field>
  );
}
