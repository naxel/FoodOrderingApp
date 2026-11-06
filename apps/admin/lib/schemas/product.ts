import { z } from 'zod';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // Vercel Functions: request body ≤ 4.5 MB

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  price: z.number({ error: 'Price is required' }).positive('Price must be greater than 0'),
  image: z
    .file()
    .mime(['image/png', 'image/jpeg', 'image/webp'], 'Use a PNG, JPEG or WebP image')
    .max(MAX_IMAGE_BYTES, 'Image must be 4 MB or smaller')
    .optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
