import { Skeleton } from "@/app/components/ui/skeleton";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";

export default function ParentDashboardLoading() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Profile card skeleton */}
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200">
            <Skeleton className="h-6 w-48 mb-3" />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 flex-shrink-0" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 flex-shrink-0" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-xl p-4">
              <div className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-8 w-8 mt-2" />
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
          ))}
        </div>
        
        {/* Featured Teachers skeleton */}
        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
} 