"use client";

import { useAuth } from "@/components/auth-provider";
import { LoginButton } from "@/components/login-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Terminal, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Terminal className="h-12 w-12 text-primary opacity-50" />
          <p className="text-muted-foreground">Loading environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black text-white selection:bg-primary/30">
      {/* Background ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none opacity-50" />

      {/* Header for logged in user */}
      {user && (
        <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10 backdrop-blur-md bg-black/20 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            <span className="font-semibold tracking-tight">GitHub GenApp</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={user.photoURL || ""} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
              <span className="text-sm font-medium text-gray-300 hidden sm:inline-block">{user.displayName || user.email}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut(auth)} className="hover:bg-white/10">
              <LogOut className="h-4 w-4 text-gray-400 hover:text-white transition-colors" />
            </Button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center gap-12 mt-16 md:mt-0">
        
        {/* Hero Section */}
        <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-300 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI-Powered Next.js Scaffolding</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Build Faster with{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-primary">
              GitHub GenApp
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Generate production-ready Next.js repositories directly to your GitHub in seconds. Powered by advanced AI to perfectly match your tech stack.
          </p>
        </div>

        {/* Action Card */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          {user ? (
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="text-center pb-4 relative z-10">
                <CardTitle className="text-2xl text-white">Welcome Back!</CardTitle>
                <CardDescription className="text-gray-400">
                  Ready to generate a new project?
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center relative z-10 pb-8">
                <Link href="/dashboard" className="w-full">
                  <Button size="lg" className="w-full font-semibold group-hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-shadow">
                    Start New Project
                    <Terminal className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
              <CardHeader className="text-center space-y-2 relative z-10">
                <CardTitle className="text-2xl font-bold text-white tracking-tight">
                  Get Started Now
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Authenticate with GitHub to configure and generate your repositories.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-8 relative z-10">
                <LoginButton />
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
    </div>
  );
}
