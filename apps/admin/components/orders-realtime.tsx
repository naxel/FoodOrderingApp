'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Props = {
  filter?: string;
};

export function OrdersRealtime({ filter }: Props) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(filter ? `admin-orders:${filter}` : 'admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter }, () => {
        router.refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, filter]);
  return null;
}
