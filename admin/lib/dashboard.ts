import type { Database } from '@/lib/database.types';

export type OrdersPerDay = Database['public']['Functions']['orders_per_day']['Returns'];

export type TopProducts = Database['public']['Functions']['top_products']['Returns'];
