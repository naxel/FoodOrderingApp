'use client';

import { BarChart, CartesianGrid, XAxis, YAxis, Bar, LabelList } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TopProducts } from '@/lib/dashboard';

const chartConfig = {
  quantity: { label: 'Sold', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function TopProductsChart({ data }: { data: TopProducts }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart layout="vertical" data={data} margin={{ right: 32 }}>
        <CartesianGrid horizontal={false} />
        <YAxis type="category" dataKey="name" width={140} tickLine={false} axisLine={false} />
        <XAxis type="number" hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="quantity" fill="var(--color-quantity)" radius={4}>
          <LabelList dataKey="quantity" position="right" className="fill-foreground" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
