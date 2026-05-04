import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#030303] text-white pt-8 pb-24 px-6 lg:pl-64">
      <div className="max-w-6xl mx-auto space-y-8 relative">
        <div className="h-4 w-24 bg-white/5 rounded-full mb-8" />
        
        <header className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-white/5">
          <div className="space-y-4">
            <Skeleton className="h-16 w-64 bg-white/5 rounded-2xl" />
            <Skeleton className="h-4 w-48 bg-white/5 rounded-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-20 w-32 bg-white/5 rounded-2xl" />
            <Skeleton className="h-20 w-32 bg-white/5 rounded-2xl" />
          </div>
        </header>

        <div className="max-w-4xl mx-auto space-y-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-24 w-full bg-white/5 rounded-2xl" />
            <Skeleton className="h-24 w-full bg-white/5 rounded-2xl" />
          </div>
          <Skeleton className="h-20 w-full bg-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
