import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-22 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-81 rounded-xl" />
        <Skeleton className="h-81 rounded-xl" />
        <Skeleton className="h-81 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}
