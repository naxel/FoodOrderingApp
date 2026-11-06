'use client';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { dayFormat, priceFormat, priceWithoutDecimalsFormat } from '@/lib/format';
import { OrdersPerDay } from '@/lib/dashboard';

const chartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function RevenueChart({ data }: { data: OrdersPerDay }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickFormatter={(value) => dayFormat.format(new Date(value))} />
        <YAxis
          tickFormatter={(value) => priceWithoutDecimalsFormat.format(value)}
          width={70}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-muted-foreground">{chartConfig.revenue.label}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {priceFormat.format(Number(value))}
                  </span>
                </div>
              )}
              labelFormatter={(value) => dayFormat.format(new Date(String(value)))}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
