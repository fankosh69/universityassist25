import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CityDetailSkeleton() {
  return (
    <div className="animate-in fade-in duration-300" aria-busy="true" aria-live="polite">
      {/* Hero */}
      <Skeleton className="h-64 sm:h-80 w-full rounded-none" />

      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-4 w-72 mb-6" />
        <Skeleton className="h-10 w-1/2 max-w-lg mb-3" />
        <Skeleton className="h-5 w-3/4 max-w-xl mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12" />
              </CardContent>
            </Card>

            {/* University grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-28 w-full rounded-none" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-9 w-full mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Skeleton className="h-72 w-full" />
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}