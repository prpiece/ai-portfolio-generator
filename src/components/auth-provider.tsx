"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
  uid: string;
  email: string;
  credits: number;
  plan: 'free' | 'pro' | 'enterprise';
  stripe_customer_id: string | null;
  scaffolding_rules?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileLocal: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfileLocal: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Read profile from Supabase (plain HTTP REST)
  const refreshProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user.id)
        .single();

      if (data && !error) {
        setProfile({ 
          uid: data.uid, 
          email: data.email, 
          credits: data.credits, 
          plan: data.plan,
          stripe_customer_id: data.stripe_customer_id,
          scaffolding_rules: data.scaffolding_rules
        });
      } else {
        // First time user — create default profile
        const email = user.email || user.user_metadata?.email || "";
        const newProfile: UserProfile = { 
          uid: user.id, 
          email, 
          credits: 3, 
          plan: 'free',
          stripe_customer_id: null,
          scaffolding_rules: ""
        };
        await supabase.from('users').insert(newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      console.error("Profile sync error:", err);
    }
  };

  // Instantly update profile state without a network call
  const updateProfileLocal = (updates: Partial<UserProfile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("github_token");
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      const provider = session?.user?.app_metadata?.provider;
      console.log("AuthProvider: Initial Provider:", provider);
      
      if (session?.provider_token && provider === 'github') {
        console.log("AuthProvider: Saving GitHub token");
        sessionStorage.setItem("github_token", session.provider_token);
      } else {
        console.log("AuthProvider: Clearing/Ignoring non-GitHub token");
        sessionStorage.removeItem("github_token");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      const provider = newUser?.app_metadata?.provider;
      console.log("AuthProvider: Auth Change Event:", _event, "Provider:", provider);

      if (session?.provider_token && provider === 'github') {
        sessionStorage.setItem("github_token", session.provider_token);
      } else {
        sessionStorage.removeItem("github_token");
      }
      if (!session) {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) refreshProfile();
    else setProfile(null);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut: handleSignOut, refreshProfile, updateProfileLocal }}>
      {children}
    </AuthContext.Provider>
  );
}
