"use client";

import { useAuth } from "@/components/auth-provider";
import { LoginButton } from "@/components/login-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ChevronRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030303]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary" />
          <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Synchronizing_Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030303] text-white selection:bg-primary/30 overflow-hidden flex flex-col">
      {/* Texture & Ambiance */}
      <div className="absolute inset-0 bg-grain z-50 opacity-[0.03] pointer-events-none" />

      


      {/* Navigation (Inspired by Image 2) */}
      <nav className="relative z-[100] max-w-7xl mx-auto w-full px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex flex-col items-start group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter leading-none">JobSeed</span>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary mt-2 opacity-50 ml-1">V1.0_Studio</span>
        </Link>
        <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <Link href="/how-it-works" className="hover:text-white transition-colors">Documentation</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          {user ? (
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-primary hover:text-white transition-colors">Go_to_Studio</Link>
              <Button 
                variant="ghost" 
                onClick={signOut}
                className="text-gray-500 hover:text-red-400 font-black uppercase tracking-widest text-[10px] p-0 h-auto"
              >
                Sign_Out
              </Button>
            </div>
          ) : (
            <LoginButton variant="ghost" className="text-white border border-white/5 rounded-xl px-8 h-12 bg-white/[0.02]" />
          )}
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start pt-8 px-8 text-center max-w-6xl mx-auto w-full">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <Sparkles className="h-3 w-3 text-primary shadow-[0_0_10px_rgba(163,230,53,0.5)]" />
            <span>JobSeed_Strategic_Synthesis_Engine</span>
          </div>

          {/* Massive Heading */}
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8] text-white">
            Strategic<br/>
            <span className="text-primary italic">Architects.</span><br/>
            Real Growth.
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Propagate production-ready architectures from simple intent. Engineered for founders and elite developers who demand zero-compromise code.
          </p>

          <div className="flex flex-col items-center gap-6 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              {user ? (
                <Link href="/dashboard">
                  <Button className="btn-primary h-16 px-10 rounded-2xl text-xs">
                    Enter_Studio_Terminal
                    <ChevronRight className="ml-3 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <LoginButton provider="github" className="h-16 px-10 rounded-2xl text-xs bg-white text-black hover:bg-primary hover:text-black transition-all" />
                  <LoginButton provider="google" className="h-16 px-10 rounded-2xl text-xs bg-white/5 text-white hover:bg-white/10 border border-white/5 transition-all" />
                </>
              )}
            </div>
            {!user && (
              <Link href="/how-it-works">
                <Button variant="ghost" className="text-gray-600 font-black uppercase tracking-widest text-[10px] hover:text-white group h-16">
                  Technical_Whitepaper
                  <div className="ml-3 h-1 w-1 rounded-full bg-gray-700 group-hover:bg-primary transition-colors" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Brand Bar */}
        <div className="mt-16 pt-16 border-t border-white/5 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-8 opacity-20 filter grayscale hover:grayscale-0 hover:opacity-50 transition-all duration-700">
          <div className="flex items-center justify-center gap-2 font-black italic tracking-tighter text-[10px] uppercase">Engineered_with_Next.js</div>
          <div className="flex items-center justify-center gap-2 font-black italic tracking-tighter text-[10px] uppercase">Secured_by_Supabase</div>
          <div className="flex items-center justify-center gap-2 font-black italic tracking-tighter text-[10px] uppercase">Powered_by_OpenAI</div>
          <div className="flex items-center justify-center gap-2 font-black italic tracking-tighter text-[10px] uppercase">Deployed_via_GitHub</div>
        </div>
      </main>

      {/* Decorative Frame Effect (Inspired by Image 2) */}
      <div className="fixed inset-4 border border-white/5 rounded-[3rem] pointer-events-none z-[100] opacity-50" />
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
