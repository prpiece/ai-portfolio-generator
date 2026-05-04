"use client";

import React from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Settings, 
  CreditCard, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Coins, 
  ExternalLink,
  ChevronRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { updateScaffoldingRules, updateDisplayName, deleteUserAccount } from '@/actions/db-actions';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const [rules, setRules] = React.useState(profile?.scaffolding_rules || "");
  const [displayName, setDisplayName] = React.useState(profile?.email?.split('@')[0] || "");
  const [isUpdatingName, setIsUpdatingName] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (profile?.scaffolding_rules) {
      setRules(profile.scaffolding_rules);
    }
  }, [profile]);
  
  const hasGithub = user?.app_metadata?.provider === 'github' || user?.identities?.some(id => id.provider === 'github');
  const hasGoogle = user?.app_metadata?.provider === 'google' || user?.identities?.some(id => id.provider === 'google');

  const [portalLoading, setPortalLoading] = React.useState(false);

  const handleUpdateName = async () => {
    if (!user || !displayName.trim()) return;
    setIsUpdatingName(true);
    try {
      await updateDisplayName(user.id, displayName);
      alert("Display name updated!");
      refreshProfile();
    } catch (err) {
      alert("Failed to update display name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmDelete = window.confirm("CRITICAL: Are you sure you want to delete your account? This will permanently wipe all projects, credits, and subscription data. This action cannot be undone.");
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await deleteUserAccount(user.id);
      await signOut();
      window.location.href = '/';
    } catch (err) {
      alert("Failed to delete account. Please contact support.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!profile?.stripe_customer_id) {
      // Redirect to pricing if no subscription yet
      window.location.href = '/pricing';
      return;
    }

    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: profile.stripe_customer_id })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to open portal');
      }
    } catch (err: any) {
      console.error("Portal error:", err);
      alert(err.message || "Could not open billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-500 animate-pulse text-sm font-bold uppercase tracking-widest">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6 lg:pl-64">
      <div className="max-w-4xl mx-auto space-y-12 relative">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12"
        >
          <header className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Settings className="h-5 w-5" />
              <span className="font-black uppercase tracking-widest text-[10px]">System Preferences</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Settings & Billing</h1>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Profile Section */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold uppercase tracking-tight">Identity Profile</h2>
                  <p className="text-gray-500 text-xs uppercase font-black tracking-widest">Public Display Info</p>
                </div>
                <User className="h-8 w-8 text-primary" />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Display_Name</label>
                  <input 
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl h-12 px-6 text-sm focus:outline-none focus:border-primary transition-all"
                    placeholder="e.g. Alex_Architect"
                  />
                </div>
                <Button 
                  onClick={handleUpdateName}
                  disabled={isUpdatingName}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold h-12 rounded-2xl border border-white/5"
                >
                  {isUpdatingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Profile Identity"}
                </Button>
              </div>
            </section>
          {/* Account Metrics */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold uppercase tracking-tight">Credit Balance</h2>
                <p className="text-gray-500 text-xs uppercase font-black tracking-widest">Monthly Quota</p>
              </div>
              <Coins className="h-8 w-8 text-yellow-500" />
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <span className="text-5xl font-black tracking-tighter text-white">{profile?.credits ?? 0}</span>
                <span className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">
                  / {profile?.plan === 'enterprise' ? '250' : profile?.plan === 'pro' ? '100' : '3'} Credits
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                  style={{ width: `${Math.min(100, ((profile?.credits ?? 0) / (profile?.plan === 'enterprise' ? 250 : profile?.plan === 'pro' ? 100 : 3)) * 100)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Credits refresh automatically every month based on your subscription tier. You can manage your plan in the Billing Portal.
            </p>
          </section>

          {/* Subscription Tier */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold uppercase tracking-tight">Current Plan</h2>
                  <p className="text-gray-500 text-xs uppercase font-black tracking-widest">Subscription Tier</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>

              <div className={`p-6 rounded-2xl border ${
                profile?.plan === 'enterprise' 
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                  : 'bg-primary/10 border-primary/20 text-primary'
              }`}>
                <div className="text-2xl font-black uppercase tracking-tighter mb-1">
                  {profile?.plan?.toUpperCase() ?? 'FREE'}
                </div>
                <p className="text-xs opacity-70 font-medium">
                  {profile?.plan === 'enterprise' ? 'Maximum builds and priority processing.' : profile?.plan === 'pro' ? 'Advanced builder access.' : 'Standard builder access.'}
                </p>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="w-full border-white/10 hover:bg-white/5 font-bold h-12 rounded-2xl"
            >
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage Subscription"}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </section>
        </div>

        {/* Enterprise Scaffolding Rules */}
        {profile?.plan === 'enterprise' && (
          <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl">
            <div className="bg-white/5 border-b border-white/10 p-8 flex items-center justify-between">
              <div className="flex items-center gap-4 text-primary">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Enterprise Guardrails</h2>
                  <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest leading-none">Custom Scaffolding Rules Engine</p>
                </div>
              </div>
              <Button 
                onClick={async () => {
                  try {
                    await updateScaffoldingRules(profile.uid, rules);
                    alert("Scaffolding guardrails updated successfully!");
                    refreshProfile();
                  } catch (e) {
                    alert("Failed to update guardrails.");
                  }
                }}
                className="bg-[#a3e635] hover:bg-[#bef264] text-black font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(163,230,53,0.2)] transition-all hover:scale-105 active:scale-95"
              >
                Sync Guardrails
              </Button>
            </div>
            <div className="p-8 space-y-6 bg-black/20">
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-2xl">
                  Define the strict architectural constraints that the AI MUST follow for all project generations. This includes framework versions, state management patterns, testing libraries, and folder structures.
                </p>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <textarea 
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="// e.g. Always use Vitest for testing\n// Use Hexagonal Architecture\n// Standardize on Tailwind CSS for all UI"
                  className="relative w-full min-h-[300px] bg-[#050505] border border-white/10 rounded-2xl p-8 text-sm font-mono text-[#a3e635] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-gray-700 leading-relaxed scrollbar-hide"
                />
              </div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest opacity-50">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Live Injection Active: These rules will be passed to GPT-4o as mandatory constraints.
              </div>
            </div>
          </section>
        )}

        {/* Identity & Connections */}
        <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-bold uppercase tracking-tight">Identity Connections</h2>
            <p className="text-gray-500 text-xs uppercase font-black tracking-widest">Third-Party Auth Status</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google */}
            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <Globe className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-sm font-bold">Google Auth</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
                    {hasGoogle ? 'Linked' : 'Not Connected'}
                  </div>
                </div>
              </div>
              {hasGoogle && <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
            </div>

            {/* GitHub */}
            <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                  <GitHubLogoIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold">GitHub Account</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
                    {hasGithub ? 'Authorized' : 'Action Required'}
                  </div>
                </div>
              </div>
              {hasGithub ? (
                <div className="h-2 w-2 rounded-full bg-[#a3e635] shadow-[0_0_10px_rgba(163,230,53,0.5)]" />
              ) : (
                <Button size="sm" variant="outline" className="h-8 text-[10px] uppercase font-black tracking-widest border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                  Link GitHub
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-4 text-red-500">
            <Zap className="h-6 w-6" />
            <div className="space-y-1">
              <h2 className="text-xl font-bold uppercase tracking-tight">Danger Zone</h2>
              <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Permanent System Deletion</p>
            </div>
          </div>

          <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-4">
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Deleting your account will result in the permanent removal of all projects, synthesis logs, and GitHub synchronization data. This action is irreversible.
            </p>
            <Button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              variant="ghost" 
              className="w-full text-red-500 hover:bg-red-500/10 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Terminate_Account_Permanently"}
            </Button>
          </div>
        </section>

        <div className="pt-12 flex flex-col items-center gap-6">
          <Button 
            onClick={signOut}
            className="w-full max-w-xs h-16 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 border border-white/10 hover:border-red-500/20 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-500"
          >
            Terminate_Current_Session
          </Button>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-700">JobSeed_Security_Protocol_V1.0</p>
        </div>
      </motion.div>
    </div>
  </div>
);
}
