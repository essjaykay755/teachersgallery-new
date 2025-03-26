import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200/80", className)}
      {...props}
    />
  );
}

// Dashboard card skeleton
function DashboardCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-10 w-2/3" />
        <div className="pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5 mt-2" />
        </div>
      </div>
    </div>
  );
}

// Dashboard profile skeleton
function DashboardProfileSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard stats skeleton
function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-9 w-16 mt-3" />
          <Skeleton className="h-4 w-28 mt-1" />
        </div>
      ))}
    </div>
  );
}

// Dashboard table skeleton
function DashboardTableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="p-2">
        {[...Array(rowCount)].map((_, i) => (
          <div key={i} className="flex items-center p-3 gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export { 
  Skeleton, 
  DashboardCardSkeleton, 
  DashboardProfileSkeleton, 
  DashboardStatsSkeleton,
  DashboardTableSkeleton 
}; 