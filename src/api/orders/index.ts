import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {supabase} from "@/lib/supabase";
import {useAuth} from "@/providers/AuthProvider";
import {InsertTables, Order, UpdateTables} from "@/types";

export const useAdminOrderList = ({archived = false}) => {
    const statuses = archived ? ['Delivered'] : ['New', 'Cooking', 'Delivering']
    return useQuery({
        queryKey: ['orders', {archived}],
        queryFn: async () => {
            const {data, error} = await supabase
                .from('orders')
                .select('*')
                .in('status', statuses)
                .order('created_at', {ascending: false})
            if (error) {
                throw new Error(error.message);
            }
            return data;
        }
    })
}

export const useMyOrderList = () => {
    const {session} = useAuth()
    const id = session?.user.id
    return useQuery({
        queryKey: ['orders', {userId: id}],
        queryFn: async () => {
            if (!id) return null
            const {data, error} = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', id)
                .order('created_at', {ascending: false})
            if (error) {
                throw new Error(error.message);
            }
            return data;
        }
    })
}

export const useOrderDetails = (id: number) => {
    return useQuery({
        queryKey: ['orders', id],
        queryFn: async () => {
            const {data, error} = await supabase
                .from('orders')
                .select('*, order_items(*, products(*))')
                .eq('id', id)
                .single()
            if (error) {
                throw new Error(error.message);
            }
            return data;
        }
    })
}

export const useInsertOrder = () => {
    const queryClient = useQueryClient();
    const {session} = useAuth()
    const userId = session?.user.id
    return useMutation({
        mutationFn: async (data: InsertTables<'orders'>) => {
            const {error, data: newOrder} = await supabase
                .from('orders')
                .insert({...data, user_id: userId,})
                .select()
                .single()
            if (error) {
                throw new Error(error.message);
            }
            return newOrder;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries(['orders'])
        },
    })
}

export const useUpdateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({id, updatedFields}: {
            id: number
            updatedFields: UpdateTables<'orders'>
        }) => {
            const {error, data: updatedOrder} = await supabase
                .from('orders')
                .update(updatedFields)
                .eq('id', id)
                .select()
                .single()
            if (error) {
                throw new Error(error.message);
            }
            return updatedOrder;
        },
        onSuccess: async (_, {id}: any) => {
            await queryClient.invalidateQueries(['orders'])
            await queryClient.invalidateQueries(['orders', id])
        },
    })
}