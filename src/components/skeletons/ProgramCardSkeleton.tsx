import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the shape of `src/components/search/ProgramCard.tsx` */
export function ProgramCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border bg-card flex flex-col">
      <div className="h-1.5 w-full bg-muted" aria-hidden="true" />
      <CardContent className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-6 w-11/12" />
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="mt-auto h-9 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export function ProgramCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProgramCardSkeleton key={i} />
      ))}
    </div>
  );
}