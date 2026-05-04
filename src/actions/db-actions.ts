"use server";

import { getServerSupabase } from "@/lib/supabase";
import { ProjectIdea } from "./generate-ideas";

export interface UserProfile {
  uid: string;
  email: string;
  credits: number;
  plan: 'free' | 'pro' | 'enterprise';
  scaffolding_rules?: string;
  stripe_customer_id?: string | null;
}

export interface SavedProject extends ProjectIdea {
  id: string;
  githubUrl: string;
  userId: string;
  createdAt: any;
  nextSteps?: string;
}

export async function saveProject(idea: ProjectIdea, githubUrl: string, userId: string, nextSteps?: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from('projects').insert({
    user_id: userId,
    title: idea.title,
    description: idea.description,
    tech_stack: idea.techStack,
    features: idea.features,
    success_roadmap: idea.successRoadmap,
    goal: idea.goal,
    plan: idea.plan,
    github_url: githubUrl,
    next_steps: nextSteps,
  }).select('id').single();

  if (error) throw new Error(`Save failed: ${error.message}`);
  return { success: true, id: data.id };
}

export async function getUserHistory(userId: string): Promise<SavedProject[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error getting history:", error.message);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    techStack: row.tech_stack || [],
    features: row.features || [],
    successRoadmap: row.success_roadmap,
    githubUrl: row.github_url,
    userId: row.user_id,
    goal: row.goal,
    plan: row.plan,
    createdAt: row.created_at,
    nextSteps: row.next_steps,
  }));
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .single();

  if (error || !data) return null;
  return { 
    uid: data.uid, 
    email: data.email, 
    credits: data.credits, 
    plan: data.plan, 
    scaffolding_rules: data.scaffolding_rules,
    stripe_customer_id: data.stripe_customer_id
  };
}

export async function createUserProfile(uid: string, email: string): Promise<UserProfile> {
  const supabase = getServerSupabase();
  
  // Check if exists first (upsert with onConflict would overwrite)
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .single();

  if (existing) {
    return { 
      uid: existing.uid, 
      email: existing.email, 
      credits: existing.credits, 
      plan: existing.plan, 
      scaffolding_rules: existing.scaffolding_rules,
      stripe_customer_id: existing.stripe_customer_id
    };
  }

  const profile: UserProfile = { uid, email, credits: 3, plan: 'free', stripe_customer_id: null };
  const { error } = await supabase.from('users').insert(profile);
  if (error) throw new Error(`Create profile failed: ${error.message}`);
  return profile;
}

export async function deductCredit(uid: string, amount: number = 1) {
  const supabase = getServerSupabase();
  const { error } = await supabase.rpc('deduct_credit', { user_uid: uid, amount: amount });
  if (error) {
    // Fallback: manual decrement
    const { data } = await supabase.from('users').select('credits').eq('uid', uid).single();
    if (data) {
      await supabase.from('users').update({ credits: Math.max(0, data.credits - amount) }).eq('uid', uid);
    }
  }
}

export async function getProjectById(id: string): Promise<SavedProject | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    techStack: data.tech_stack || [],
    features: data.features || [],
    successRoadmap: data.success_roadmap,
    githubUrl: data.github_url,
    userId: data.user_id,
    goal: data.goal,
    plan: data.plan,
    createdAt: data.created_at,
    nextSteps: data.next_steps,
  };
}

export async function addProjectLog(projectId: string, message: string, status: 'info' | 'success' | 'error' | 'pending' = 'info') {
  const supabase = getServerSupabase();
  const { error } = await supabase.from('project_logs').insert({
    project_id: projectId,
    message,
    status
  });
  if (error) console.error("Failed to add project log:", error.message);
}

export async function getProjectLogs(projectId: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('project_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error getting logs:", error.message);
    return [];
  }
  return data || [];
}

export async function updateScaffoldingRules(uid: string, rules: string) {
  const supabase = getServerSupabase();
  const { error } = await supabase.from('users').update({ scaffolding_rules: rules }).eq('uid', uid);
  if (error) throw new Error(`Update rules failed: ${error.message}`);
}

export async function updateUserPlan(uid: string, plan: 'free' | 'pro' | 'enterprise') {
  const supabase = getServerSupabase();
  const { error } = await supabase.from('users').update({ plan }).eq('uid', uid);
  if (error) throw new Error(`Update plan failed: ${error.message}`);
}

export async function renameProject(projectId: string, newTitle: string) {
  const supabase = getServerSupabase();
  const { error } = await supabase.from('projects').update({ title: newTitle }).eq('id', projectId);
  if (error) throw new Error(`Rename failed: ${error.message}`);
}

export async function updateDisplayName(uid: string, name: string) {
  const supabase = getServerSupabase();
  const { error } = await supabase.from('users').update({ display_name: name }).eq('uid', uid);
  if (error) throw new Error(`Update display name failed: ${error.message}`);
}

export async function deleteUserAccount(uid: string) {
  const supabase = getServerSupabase();
  
  // 1. Delete all projects
  const { error: projectError } = await supabase.from('projects').delete().eq('user_id', uid);
  if (projectError) throw new Error(`Failed to delete projects: ${projectError.message}`);
  
  // 2. Delete user profile
  const { error: profileError } = await supabase.from('users').delete().eq('uid', uid);
  if (profileError) throw new Error(`Failed to delete profile: ${profileError.message}`);
}


