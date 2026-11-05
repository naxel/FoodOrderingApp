'use client';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { dayFormat } from '@/lib/format';
import { OrdersPerDay } from '@/lib/dashboard';

const chartConfig = {
  orders: { label: 'Orders', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function OrdersChart({ data }: { data: OrdersPerDay }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickFormatter={(value) => dayFormat.format(new Date(value))} />
        <YAxis allowDecimals={false} width={30} tickLine={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent labelFormatter={(value) => dayFormat.format(new Date(value))} />
          }
        />
        <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
