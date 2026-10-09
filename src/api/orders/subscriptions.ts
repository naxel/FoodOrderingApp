import {useEffect} from "react";
import {supabase} from "@/lib/supabase";
import {useQueryClient} from "@tanstack/react-query";

export const useInsertOrderSubscription = () => {
    const queryClient = useQueryClient();
    useEffect(() => {
        const ordersSubscription = supabase.channel('custom-insert-channel')
            .on(
                'postgres_changes',
                {event: 'INSERT', schema: 'public', table: 'orders'},
                () => {
                    queryClient.invalidateQueries(['orders'])
                }
            )
            .subscribe()
        return () => {
            ordersSubscription.unsubscribe()
        }
    }, []);
}

export const useUpdateOrderSubscription = (id: number) => {
    const queryClient = useQueryClient();
    useEffect(() => {
        const orders = supabase
            .channel('custom-filter-channel')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${id}`,
                },
                () => {
                    queryClient.invalidateQueries(['orders', id])
                }
            )
            .subscribe();

        return () => {
            orders.unsubscribe();
        };
    }, []);
}
