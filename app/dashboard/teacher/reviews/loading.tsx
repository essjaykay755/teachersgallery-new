import { Skeleton } from "@/app/components/ui/skeleton";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";

export default function TeacherReviewsLoading() {
  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        
        {/* Rating overview skeleton */}
        <div className="bg-white shadow rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl">
              <Skeleton className="h-8 w-16 mb-2" />
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-5 w-5 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
            
            <div className="md:col-span-2">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-full flex-1 max-w-md" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Reviews list skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
          
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Skeleton className="h-5 w-40" />
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, j) => (
                          <Skeleton key={j} className="h-4 w-4 rounded-full" />
                        ))}
                        <Skeleton className="h-4 w-16 ml-2" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-24" />
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
} 