"use client";

import { useState, useEffect, Suspense } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { generateIdeas, ProjectIdea, ProjectGoal } from "@/actions/generate-ideas";
import { deployToGithub } from "@/actions/deploy-to-github";
import { generateProjectCode } from "@/actions/generate-code";
import { saveProject, getUserHistory, SavedProject, deductCredit } from "@/actions/db-actions";
import { verifyCheckout } from "@/actions/stripe-actions";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Loader2, Terminal, TestTube2, Coins, Share2, Crown, CheckCircle2, ChevronRight } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/components/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";

const InputSchema = z.string()
  .min(3, "Industry/Niche must be at least 3 characters")
  .refine(val => !/^\d+$/.test(val), "Industry cannot be purely numeric")
  .refine(val => !/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(val), "Industry cannot be only special characters");

function DashboardContent() {
  const [jobTitle, setJobTitle] = useState("");
  const [goal, setGoal] = useState<ProjectGoal>("Technical Portfolio");
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deploying, setDeploying] = useState<Record<number, string | boolean>>({});
  const [repoUrls, setRepoUrls] = useState<Record<number, string>>({});
  const [nextSteps, setNextSteps] = useState<Record<number, string>>({});
  const [history, setHistory] = useState<SavedProject[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [hasGithubAccess, setHasGithubAccess] = useState(false);
  const [magicMode, setMagicMode] = useState(false);
  const [autoDeploying, setAutoDeploying] = useState(false);

  const { user, profile, loading: authLoading, refreshProfile, updateProfileLocal } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!authLoading && user) {
      const token = sessionStorage.getItem("github_token");
      const isTestMode = searchParams.get("test_prompt") === "true";
      setHasGithubAccess(isTestMode ? false : !!token);

      // Force Magic Mode for Enterprise
      if (profile?.plan === 'enterprise') {
        setMagicMode(true);
      }
    }
  }, [user, authLoading, searchParams, profile?.plan]);

  const handleConnectGithub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo',
          redirectTo: window.location.href, // Stay on dashboard
        },
      });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message || "Failed to connect GitHub");
    }
  };

  // After successful checkout: verify with Stripe, then write credits via Supabase
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || !user) return;

    const upgradeFromBrowser = async () => {
      try {
        console.log("💳 Verifying checkout with Stripe...");
        const { plan, credits, userId } = await verifyCheckout(sessionId);
        
        if (userId !== user.id) {
          console.error("User mismatch!");
          return;
        }

        // Instantly update UI
        updateProfileLocal({ plan: plan as any, credits });
        console.log(`✅ Verified! ${plan}/${credits} credits — UI updated instantly`);
        
        // Write to Supabase in background (plain HTTP — always works)
        supabase.from('users')
          .upsert({ uid: user.id, plan, credits }, { onConflict: 'uid' })
          .then(({ error }) => {
            if (error) console.error("Supabase save error:", error.message);
            else console.log("💾 Saved to Supabase");
          });
        
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      } catch (err) {
        console.error("Upgrade error:", err);
      }
    };

    upgradeFromBrowser();
  }, [searchParams, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    } else if (user) {
      loadHistory(user.id);
    }
  }, [user, authLoading, router]);

  const loadHistory = async (uid: string) => {
    try {
      const data = await getUserHistory(uid);
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    // Frontend Validation
    const validation = InputSchema.safeParse(jobTitle);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setLoading(false);
      return;
    }

    if (!user || !profile) {
      setError("User profile not found. Please refresh.");
      setLoading(false);
      return;
    }

    setIdeas([]);

    try {
      const results = await generateIdeas(jobTitle, goal, user!.id, profile.plan);
      
      // Calculate cost
      const cost = (magicMode && profile.plan === 'pro') ? 1.5 : 1;
      
      if (profile.credits < cost) {
        alert("Insufficient credits for this operation. Please manage your subscription in Settings.");
        return;
      }

      await deductCredit(user!.id, cost);
      updateProfileLocal({ credits: profile.credits - cost });
      setIdeas(results);

      if (magicMode && results.length > 0) {
        setAutoDeploying(true);
        await handleDeploy(results[0], 0);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
      setAutoDeploying(false);
    }
  };



  const copyShareLink = (projectId: string) => {
    const url = `${window.location.origin}/shared/${projectId}`;
    navigator.clipboard.writeText(url);
    alert("Share link copied to clipboard!");
  };

  const handleDeploy = async (idea: ProjectIdea, index: number) => {
    const token = sessionStorage.getItem("github_token");
    if (!token) {
      alert("GitHub token not found. Please log out and log back in to grant repository permissions.");
      return;
    }

    if (!user) return;

    setDeploying((prev) => ({ ...prev, [index]: "Initializing Blueprint..." }));
    try {
      // 1. Initialize Project Record first to get an ID for logging
      const saveRes = await saveProject(idea, "PENDING", user.id);
      if (!saveRes.id) throw new Error("Failed to initialize project");

      const projectId = saveRes.id;

      // 2. Redirect to the War Room (Project Detail Page)
      // We pass the start=true flag so the project page knows to trigger the build
      router.push(`/projects/${projectId}?start=true`);
      
    } catch (err: any) {
      alert(err.message || "Failed to initialize deployment");
    } finally {
      setDeploying((prev) => ({ ...prev, [index]: false }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-500 animate-pulse text-sm">Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-500 animate-pulse text-sm">Redirecting to login...</p>
      </div>
    );
  }

  if (historyLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-500 animate-pulse text-sm">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030303] text-white selection:bg-primary/30 pt-8 pb-24 px-6 overflow-hidden lg:pl-64">
      {/* Texture & Ambiance */}
      <div className="absolute inset-0 bg-grain z-50 opacity-[0.03] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto space-y-8 relative z-10"
      >
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8 opacity-60">
          <Link href="/" className="hover:text-primary transition-colors">JobSeed</Link>
          <span>/</span>
          <span className="text-white">Studio</span>
        </nav>

        <header className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-white/5">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
              Command<br/>
              <span className="text-primary italic">Center.</span>
            </h1>
            <p className="text-gray-500 max-w-md font-medium">
              Autonomous project synthesis engine. Authorized for {profile?.plan} tier operations.
            </p>
          </div>

          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-4">
              <div className="glass px-6 py-4 rounded-2xl flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Available_Credits</span>
                <span className="text-2xl font-black text-white">{profile?.credits ?? 0}</span>
              </div>
              <div className="glass px-6 py-4 rounded-2xl flex flex-col items-end border-primary/20">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Active_Plan</span>
                <span className="text-2xl font-black text-primary uppercase italic">{profile?.plan ?? 'Free'}</span>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="ghost" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white">
                Manage_Subscription_Portal →
              </Button>
            </Link>
          </div>
        </header>

        {/* GitHub Connection Alert */}
        {!hasGithubAccess && (
          <div className="card-premium border-blue-500/30 bg-blue-500/5 flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in slide-in-from-top-6 duration-1000">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-blue-400 font-black uppercase tracking-[0.2em] text-[10px]">
                <GitHubLogoIcon className="h-4 w-4" />
                Infrastructure Identity Required
              </div>
              <p className="text-gray-500 text-sm max-w-lg leading-relaxed font-medium">
                To enable autonomous multi-repo deployments and zero-touch project synchronization, we need to link your GitHub identity.
              </p>
            </div>
            <Button 
              onClick={handleConnectGithub}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] h-14 px-10 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.2)]"
            >
              Authorize Identity
            </Button>
          </div>
        )}

        <section className="max-w-4xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-1">Target_Industry</label>
              <Input
                placeholder="e.g. AI SaaS, FinTech, E-commerce"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-700 h-16 rounded-2xl text-lg px-6 focus-visible:ring-primary/50"
              />
              {error && (
                <div className="text-[10px] font-black uppercase tracking-widest text-red-400 mt-2 ml-1 animate-in fade-in slide-in-from-top-1">
                  Input_Error: {error}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-1">Strategy_Goal</label>
              <div className="relative">
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as ProjectGoal)}
                  className="w-full bg-[#0A0A0A] border border-white/10 text-white rounded-2xl h-16 px-6 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none font-bold text-lg"
                >
                  <option value="Technical Portfolio">Technical Portfolio</option>
                  <option value="SaaS MVP">SaaS MVP</option>
                  <option value="Learning Project">Learning Project</option>
                  <option value="Testing Showcase">Testing Showcase</option>
                </select>
                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 rotate-90" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {profile?.plan !== 'free' && (
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${magicMode ? 'bg-primary animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.5)]' : 'bg-gray-800'}`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                    {profile?.plan === 'enterprise' ? 'Enterprise_Magic_Active' : 'Magic_Automation_Mode'}
                  </span>
                </div>
                {profile?.plan === 'pro' && (
                  <div 
                    onClick={() => setMagicMode(!magicMode)}
                    className={`w-12 h-6 rounded-full cursor-pointer transition-all relative ${magicMode ? 'bg-primary' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${magicMode ? 'translate-x-6' : ''}`} />
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={loading || !jobTitle.trim() || autoDeploying}
              className={`w-full h-20 font-black uppercase tracking-[0.3em] text-xs rounded-2xl transition-all duration-700 animate-pulse-glow ${
                magicMode 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_50px_rgba(37,99,235,0.2)]' 
                : 'btn-primary'
              }`}
            >
              {loading || autoDeploying ? (
                <div className="flex items-center gap-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="animate-pulse">SYNTHESIZING_ARCHITECTURES...</span>
                </div>
              ) : (
                <span className="flex items-center gap-3">
                  {magicMode ? "LAUNCH_AUTONOMOUS_BUILD" : "EXECUTE_STRATEGY_GENERATION"}
                </span>
              )}
            </Button>
          </div>
        </section>

        {/* Ideas Grid */}
        {!loading && ideas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ideas.map((idea, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="card-premium flex flex-col group h-full"
              >
                <div className="space-y-4 mb-8">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary opacity-50">Project_Idea_0{i+1}</div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase group-hover:text-primary transition-colors">{idea.title}</h3>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed">
                    {idea.description}
                  </p>
                </div>

                <div className="flex-1 space-y-8">
                  <div className="flex flex-wrap gap-2">
                    {idea.techStack.map((tech, j) => (
                      <span key={j} className="px-3 py-1 bg-white/5 border border-white/5 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="p-6 bg-black/40 rounded-3xl border border-white/5 font-mono text-[10px] space-y-3 relative overflow-hidden group-hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-2 text-primary">
                      <Terminal className="h-3 w-3" />
                      STRATEGIC_ROADMAP
                    </div>
                    <p className="text-gray-500 leading-relaxed italic">
                      {idea.successRoadmap}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <Button
                    onClick={() => handleDeploy(idea, i)}
                    disabled={!!deploying[i]}
                    className={`w-full h-14 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all duration-500 ${
                      deploying[i] 
                      ? 'bg-blue-600 text-white animate-pulse' 
                      : 'bg-white text-black hover:bg-primary hover:text-black'
                    }`}
                  >
                    {deploying[i] ? "INITIALIZING_BLUEPRINT..." : "LAUNCH_DEPLOYMENT"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <hr className="border-white/5" />
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
