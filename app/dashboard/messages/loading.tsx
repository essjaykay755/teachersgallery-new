import { Skeleton } from "@/app/components/ui/skeleton";
import { DashboardShell } from "@/app/components/layout/dashboard-shell";

export default function MessagesLoading() {
  return (
    <DashboardShell>
      <div className="bg-white shadow-sm rounded-xl overflow-hidden">
        <div className="flex h-[calc(100vh-10rem)] md:h-[70vh]">
          {/* Conversations list skeleton */}
          <div className="w-full md:w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            
            <div className="h-[calc(100%-4rem)] overflow-auto">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-4 w-full mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat area skeleton */}
          <div className="hidden md:flex flex-col flex-1">
            {/* Chat header */}
            <div className="flex items-center p-4 border-b border-gray-200">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
            </div>
            
            {/* Chat messages */}
            <div className="flex-1 p-4 overflow-auto">
              <div className="space-y-6">
                {/* Outgoing messages */}
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <Skeleton className="h-16 w-64 rounded-lg" />
                    <Skeleton className="h-3 w-24 mt-1 ml-auto" />
                  </div>
                </div>
                
                {/* Incoming messages */}
                <div className="flex">
                  <div className="max-w-[80%]">
                    <Skeleton className="h-24 w-72 rounded-lg" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                
                {/* Outgoing messages */}
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <Skeleton className="h-10 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-24 mt-1 ml-auto" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chat input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Skeleton className="h-12 flex-1 rounded-md" />
                <Skeleton className="h-12 w-12 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
} 