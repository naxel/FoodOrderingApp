import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {supabase} from "@/lib/supabase";

export const useProductList = () => {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const {data, error} = await supabase.from('products').select('*')
            if (error) {
                throw new Error(error.message);
            }
            return data;
        }
    })
}

export const useProduct = (id: number) => {
    return useQuery({
        queryKey: ['products', id],
        queryFn: async () => {
            const {data, error} = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single()
            if (error) {
                throw new Error(error.message);
            }
            return data;
        }
    })
}

export const useInsertProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const {error, data: newProduct} = await supabase
                .from('products')
                .insert({
                    name: data.name,
                    image: data.image,
                    price: data.price,
                })
                .single()
            if (error) {
                throw new Error(error.message);
            }
            return newProduct;
        },
        onSuccess: async (data: any) => {
            await queryClient.invalidateQueries(['products'])
        },
    })
}