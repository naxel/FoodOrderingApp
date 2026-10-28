import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  price: z.number({ error: 'Price is required' }).positive('Price must be greater than 0'),
});

export type ProductInput = z.infer<typeof productSchema>;
