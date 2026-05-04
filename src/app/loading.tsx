"use client";

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-2 border-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-primary animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Synchronizing_Neural_Grid...</p>
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-700">Please wait while we initialize the studio.</p>
      </div>
    </div>
  );
}
