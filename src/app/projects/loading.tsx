import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="min-h-screen bg-black text-white pt-8 pb-24 px-6 lg:pl-64">
      <div className="max-w-6xl mx-auto space-y-12 relative">
        <div className="h-4 w-32 bg-white/5 rounded-full mb-4" />
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-48 bg-white/5 rounded-2xl" />
            <Skeleton className="h-4 w-64 bg-white/5 rounded-full" />
          </div>
          <Skeleton className="h-12 w-80 bg-white/5 rounded-2xl" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-72 w-full bg-white/5 rounded-[2.5rem]" />
          ))}
        </div>
      </div>
    </div>
  );
}
