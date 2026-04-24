import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UniversityPageSkeleton() {
  return (
    <div className="animate-in fade-in duration-300" aria-busy="true" aria-live="polite">
      {/* Hero banner */}
      <Skeleton className="h-56 sm:h-72 w-full rounded-none" />

      <div className="container mx-auto px-4 -mt-12 relative z-10">
        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start">
            <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
            <div className="flex-1 space-y-3 w-full">
              <Skeleton className="h-7 w-3/4 max-w-xl" />
              <Skeleton className="h-4 w-1/2 max-w-md" />
              <div className="flex gap-2 flex-wrap">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-8 mb-4 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md shrink-0" />
          ))}
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}