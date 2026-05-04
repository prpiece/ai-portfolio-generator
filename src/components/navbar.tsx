"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Terminal, Coins, Crown, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard";
  const isPricing = pathname === "/pricing";

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-white">GitHub GenApp</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/pricing" className={`text-sm font-medium transition-colors ${isPricing ? 'text-primary' : 'text-gray-400 hover:text-white'}`}>
              Pricing
            </Link>
            {user && (
              <Link href="/dashboard" className={`text-sm font-medium transition-colors ${isDashboard ? 'text-primary' : 'text-gray-400 hover:text-white'}`}>
                Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/20 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <Coins className="h-4 w-4 text-yellow-500 animate-pulse" />
                <span className="text-sm font-bold text-white tracking-tight">{profile?.credits ?? 0} Credits</span>
              </div>
              {profile?.plan ? (
                <div className={`hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm ${
                  profile.plan === 'enterprise' 
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                    : profile.plan === 'pro'
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-white/5 text-gray-400 border-white/10'
                }`}>
                  {profile.plan === 'enterprise' ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                      Enterprise
                    </div>
                  ) : profile.plan === 'pro' ? (
                    <>
                      <Crown className="h-3.5 w-3.5" />
                      Pro
                    </>
                  ) : (
                    <>
                      <Terminal className="h-3.5 w-3.5" />
                      Free
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-white">{user.user_metadata?.full_name || user.user_metadata?.name || ""}</span>
                <span className="text-[10px] text-gray-500">{user.email}</span>
              </div>
              <img src={user.user_metadata?.avatar_url || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
              <Button variant="ghost" size="icon" onClick={signOut} className="hover:bg-white/10">
                <LogOut className="h-4 w-4 text-gray-400 hover:text-white" />
              </Button>
            </div>
          ) : (
            <Link href="/">
              <Button size="sm">Get Started</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
