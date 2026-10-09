import {useMutation} from "@tanstack/react-query";
import {InsertTables} from "@/types";
import {supabase} from "@/lib/supabase";

export const useInsertOrderItems = () => {
    return useMutation({
        mutationFn: async (items: InsertTables<'order_items'>[]) => {
            const {error, data: newOrder} = await supabase
                .from('order_items')
                .insert(items)
                .select()
            if (error) {
                throw new Error(error.message);
            }
            return newOrder;
        },
    })
}
