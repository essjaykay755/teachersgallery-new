import { Skeleton } from "@/app/components/ui/skeleton";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";

export default function TeacherEditProfileLoading() {
  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="p-4">
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-32 rounded-md" />
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Profile image upload skeleton */}
            <div className="flex flex-col sm:flex-row items-start gap-8 mb-8">
              <div className="relative">
                <Skeleton className="h-32 w-32 rounded-full" />
              </div>
              
              <div className="space-y-4 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-full max-w-md" />
                <Skeleton className="h-10 w-36 rounded-md" />
              </div>
            </div>
            
            {/* Form fields skeleton */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-40 w-full rounded-md" />
              </div>
              
              <div className="flex justify-end">
                <Skeleton className="h-11 w-32 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
} 