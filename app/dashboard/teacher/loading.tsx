import { Skeleton } from "@/app/components/ui/skeleton";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";

export default function TeacherDashboardLoading() {
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
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-gray-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full mr-4" />
                  <div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-10 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Featured Status card skeleton */}
        <div className="bg-white shadow rounded-xl p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5 mt-2" />
          <Skeleton className="h-10 w-full rounded-md mt-4" />
        </div>
        
        {/* Information cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-xl p-6">
              <Skeleton className="h-6 w-1/3 mb-4" />
              
              <div className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="grid grid-cols-3 gap-4 items-center">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full col-span-2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
} 