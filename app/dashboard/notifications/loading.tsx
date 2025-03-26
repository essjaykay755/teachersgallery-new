import { Skeleton } from "@/app/components/ui/skeleton";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";

export default function NotificationsLoading() {
  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-full max-w-md" />
                        <Skeleton className="h-4 w-full max-w-sm" />
                      </div>
                      <Skeleton className="h-4 w-16 ml-2 flex-shrink-0" />
                    </div>
                    
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <Skeleton className="h-8 w-20 rounded-md" />
                      <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-100 flex justify-center">
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
} 