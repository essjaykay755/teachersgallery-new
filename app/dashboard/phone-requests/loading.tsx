import { Skeleton } from "@/app/components/ui/skeleton";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";

export default function PhoneRequestsLoading() {
  return (
    <DashboardShell>
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          
          <div className="px-6 py-3">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-full sm:w-max">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-9 flex-1 sm:w-24 rounded-md" />
              ))}
            </div>
          </div>
          
          <div className="p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24 mt-1" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      
                      <div className="mt-3">
                        <Skeleton className="h-10 w-full max-w-sm rounded-md" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4 space-x-2">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-24 rounded-md" />
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