"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical System Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6 text-center">
      <div className="card-premium max-w-lg w-full border-red-500/20 bg-red-500/5 space-y-8 py-12">
        <div className="flex justify-center">
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 animate-pulse">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-black tracking-tighter uppercase text-white">System_Failure_Detected</h1>
          <p className="text-gray-500 text-sm font-medium leading-relaxed">
            The neural synthesis grid has encountered a critical exception. Access to the requested resource has been temporarily suspended.
          </p>
          <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-red-400/70 break-all">
            ERROR_CODE: {error.digest || "UNKNOWN_EXCEPTION"}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button 
            onClick={() => reset()}
            className="w-full sm:w-auto bg-white text-black hover:bg-primary hover:text-black font-black uppercase tracking-widest text-[10px] h-14 px-10 rounded-2xl"
          >
            <RefreshCcw className="mr-3 h-4 w-4" />
            Re-Initialize_System
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button 
              variant="ghost"
              className="w-full text-gray-500 hover:text-white font-black uppercase tracking-widest text-[10px] h-14 px-10 rounded-2xl"
            >
              <Home className="mr-3 h-4 w-4" />
              Return_to_HQ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
