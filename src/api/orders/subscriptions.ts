import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export const useInsertOrderSubscription = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const ordersSubscription = supabase
      .channel('custom-insert-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      })
      .subscribe();
    return () => {
      // unsubscribe() keeps the channel in the client, and channel() with the same
      // name would return it already subscribed; removeChannel drops it
      supabase.removeChannel(ordersSubscription);
    };
  }, []);
};

export const useUpdateOrderSubscription = (id: number) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const orders = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orders);
    };
  }, [id]);
};
