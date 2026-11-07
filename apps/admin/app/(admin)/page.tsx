import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { priceFormat } from '@foodordering/core/format';
import { OrdersChart } from '@/components/orders-chart';
import { TopProductsChart } from '@/components/top-products-chart';
import { RevenueChart } from '@/components/revenue-chart';
import { DashboardSkeleton } from '@/components/dashboard-skeleton';

async function DashboardStats() {
  const supabase = await createClient();
  const [{ data: days }, { data: products }] = await Promise.all([
    supabase.rpc('orders_per_day', { p_days: 30 }).throwOnError(),
    supabase.rpc('top_products', { p_limit: 5 }).throwOnError(),
  ]);
  const { totalOrders, totalRevenue } = days.reduce(
    (acc, day) => {
      acc.totalOrders += day.orders;
      acc.totalRevenue += day.revenue;
      return acc;
    },
    { totalOrders: 0, totalRevenue: 0 },
  );

  const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Orders, 30 days</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{totalOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Revenue, 30 days</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {priceFormat.format(totalRevenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Average Order, 30 days</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {priceFormat.format(averageOrder)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersChart data={days} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={days} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 5 products</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsChart data={products} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <h1>Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats />
      </Suspense>
    </>
  );
}
