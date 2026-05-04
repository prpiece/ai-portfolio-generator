"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { Terminal, ExternalLink, Code2, Rocket, Map, CheckCircle2, Copy, Sparkles, Send, Loader2, Info } from 'lucide-react';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ProjectLogViewer } from '@/components/project-log-viewer';
import { startProjectBuild, iterateProject } from '@/actions/iterate-project';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const startBuild = searchParams.get('start') === 'true';

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [magicCommand, setMagicCommand] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [buildTriggered, setBuildTriggered] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        notFound();
        return;
      }
      setProject(data);
      setLoading(false);
    };

    fetchProject();
  }, [id]);

  useEffect(() => {
    if (project && startBuild && !buildTriggered && project.github_url === 'PENDING') {
      setBuildTriggered(true);
      const token = sessionStorage.getItem("github_token");
      if (!token) {
        alert("GitHub token missing. Please reconnect.");
        return;
      }

      startProjectBuild(id, {
        title: project.title,
        description: project.description,
        techStack: project.tech_stack,
        features: project.features,
        successRoadmap: project.success_roadmap,
        goal: project.goal,
        plan: project.plan
      }, project.user_id, token).then(() => {
        // Refresh project data after build
        supabase.from('projects').select('*').eq('id', id).single().then(({ data }) => {
          if (data) setProject(data);
        });
      }).catch(err => {
        console.error("Build failed:", err);
      });
    }
  }, [project, startBuild, buildTriggered, id]);

  const handleMagicEdit = async () => {
    if (!magicCommand.trim()) return;
    const token = sessionStorage.getItem("github_token");
    if (!token) {
      alert("GitHub token missing.");
      return;
    }

    setMagicLoading(true);
    try {
      await iterateProject(id, token, magicCommand);
      setMagicCommand("");
      alert("Magic Edit applied! Check your GitHub repository.");
    } catch (err: any) {
      alert(err.message || "Magic Edit failed");
    } finally {
      setMagicLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-500 animate-pulse text-sm font-bold uppercase tracking-widest">Accessing Infrastructure...</p>
      </div>
    );
  }

  const isPending = project.github_url === 'PENDING';
  const isCoding = isPending || magicLoading;

  return (
    <div className="relative min-h-screen bg-[#030303] text-white selection:bg-primary/30 pt-8 pb-24 px-6 overflow-hidden lg:pl-64">
      {/* Texture & Ambiance */}
      <div className="absolute inset-0 bg-grain z-50 opacity-[0.03] pointer-events-none" />

      


      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8 opacity-60">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Studio</Link>
          <span>/</span>
          <span className="text-white">Deployment_Control</span>
          <span>/</span>
          <span className="text-primary">{project.title}</span>
        </nav>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-white/5">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
              <Rocket className="h-3 w-3" />
              {project.plan} Build_Operation
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8]">
              {project.title.split(' ')[0]}<br/>
              <span className="text-primary italic">{project.title.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-gray-500 max-w-2xl font-medium leading-relaxed">
              {project.description}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isPending ? (
              <div className="flex items-center gap-3 px-6 py-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 text-[10px] font-black uppercase tracking-widest">
                <Loader2 className="h-4 w-4 animate-spin" />
                Synthesis_In_Progress...
              </div>
            ) : (
              <Link href={project.github_url} target="_blank">
                <Button className="btn-primary flex items-center gap-3">
                  <GitHubLogoIcon className="h-4 w-4" />
                  Access_Source_Code
                </Button>
              </Link>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: The Blueprint & Logs */}
          <div className="lg:col-span-2 space-y-12">
            {/* War Room Logic */}
            {isCoding ? (
              <ProjectLogViewer projectId={id} />
            ) : (
              <section className="card-premium p-16 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden group border-white/5 bg-white/[0.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-50" />
                <div className="p-8 rounded-full bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-700">
                  <Terminal className="h-12 w-12 text-gray-700" />
                </div>
                <div className="space-y-3 relative z-10">
                  <h3 className="text-2xl font-black uppercase tracking-[0.2em] text-gray-500 italic">War_Room_Standby</h3>
                  <p className="text-gray-600 text-sm max-w-md font-medium">
                    The autonomous build engine has completed its sequence. Initiate a Magic Command below to perform an iterative deployment.
                  </p>
                </div>
              </section>
            )}

            <section className="card-premium !p-0 overflow-hidden shadow-2xl">
              <div className="bg-white/5 border-b border-white/10 p-10 flex items-center gap-6 text-primary">
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                  <Map className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Architectural_Strategy</h2>
                  <p className="text-gray-600 text-[10px] uppercase font-black tracking-[0.4em] leading-none mt-2">Engineering_Blueprint_&_Active_Roadmap</p>
                </div>
              </div>
              <div className="p-10 space-y-10">
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-400 leading-relaxed font-medium text-xl italic">
                    {project.success_roadmap || "No roadmap available for this project."}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3 hover:border-primary/20 transition-colors group">
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 transition-opacity">Phase_01</div>
                    <div className="text-lg font-black uppercase tracking-tight italic">Foundation</div>
                    <p className="text-[11px] text-gray-600 font-medium">Core identity and high-performance database structures.</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3 opacity-40 hover:opacity-100 transition-opacity group">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 transition-opacity">Phase_02</div>
                    <div className="text-lg font-black uppercase tracking-tight italic">Synthesis</div>
                    <p className="text-[11px] text-gray-600 font-medium">Main application logic and high-fidelity UI synthesis.</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3 opacity-40 hover:opacity-100 transition-opacity group">
                    <div className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] opacity-40 group-hover:opacity-100 transition-opacity">Phase_03</div>
                    <div className="text-lg font-black uppercase tracking-tight italic">Deployment</div>
                    <p className="text-[11px] text-gray-600 font-medium">Optimization and production-grade delivery.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Magic Edit Section */}
            <section className="card-premium bg-primary/5 border-primary/20 p-10 space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles className="h-32 w-32 text-primary" />
              </div>
              <div className="flex items-center gap-4 text-primary border-b border-primary/10 pb-6">
                <Sparkles className="h-8 w-8" />
                <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Magic_AI_Iteration_Engine</h2>
              </div>
              <p className="text-gray-500 text-sm font-medium">
                Authorized for direct repository injection. Request specific feature synthesis or structural refactoring.
              </p>
              <div className="flex gap-6">
                <Input 
                  value={magicCommand}
                  onChange={(e) => setMagicCommand(e.target.value)}
                  placeholder="e.g. Integrate Stripe checkout or refactor to Hexagonal Architecture..."
                  className="bg-black/60 border-white/10 h-20 rounded-[1.5rem] px-8 text-lg font-bold placeholder:text-gray-800 focus-visible:ring-primary/50"
                />
                <Button 
                  onClick={handleMagicEdit}
                  disabled={magicLoading || !magicCommand.trim()}
                  className="bg-primary hover:bg-primary/90 text-black font-black h-20 w-20 rounded-[1.5rem] shrink-0 shadow-[0_0_30px_rgba(163,230,53,0.3)] transition-all hover:scale-105 active:scale-95"
                >
                  {magicLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Send className="h-8 w-8" />}
                </Button>
              </div>
            </section>
          </div>

          {/* Right: Repository Details */}
          <div className="space-y-12">
            <section className="card-premium space-y-8">
              <div className="flex items-center gap-4 text-blue-400 border-b border-white/5 pb-6">
                <Code2 className="h-6 w-6" />
                <h2 className="text-sm font-black uppercase tracking-[0.3em] italic">Clone_Repo</h2>
              </div>
              <div className="space-y-6">
                <div className="relative group">
                  <pre className="bg-black border border-white/10 rounded-2xl p-6 text-[11px] font-mono text-blue-400 overflow-x-auto selection:bg-blue-500/20 leading-relaxed">
                    git clone {isPending ? 'PENDING...' : `${project.github_url}.git`}
                  </pre>
                  {!isPending && (
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4 hover:bg-white/5">
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </section>

            <section className="card-premium space-y-8">
              <div className="flex items-center gap-4 text-purple-400 border-b border-white/5 pb-6">
                <Terminal className="h-6 w-6" />
                <h2 className="text-sm font-black uppercase tracking-[0.3em] italic">Tech_Stack</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {project.tech_stack?.map((tech: string, idx: number) => (
                  <span key={idx} className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {tech}
                  </span>
                ))}
              </div>
            </section>

            {/* Project Explanation Section */}
            <section className="card-premium border-primary/30 bg-primary/5 space-y-6">
              <div className="flex items-center gap-4 text-primary border-b border-primary/10 pb-6">
                <Info className="h-5 w-5" />
                <h2 className="text-sm font-black uppercase tracking-[0.3em] italic">Project_Analysis</h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium italic">
                This {project.goal} project is engineered using **{project.tech_stack?.[0]}** and a modern server-side architecture. 
                The AI has optimized the initial scaffolding for high performance and immediate scalability. 
                Functional modules: {project.features?.slice(0, 2).join(", ")}.
              </p>
              <div className="pt-4">
                <div className="flex items-center justify-between text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] border-t border-white/5 pt-6">
                  <span>Stability_Metric</span>
                  <span className="text-primary">98%_Verified</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-primary w-[98%] shadow-[0_0_10px_rgba(163,230,53,0.5)]" />
                </div>
              </div>
            </section>

            {!isPending && project.next_steps && (
              <section className="card-premium space-y-6">
                <div className="flex items-center gap-4 text-primary border-b border-white/5 pb-6">
                  <Rocket className="h-6 w-6" />
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] italic">Next_Steps</h2>
                </div>
                <div className="text-[11px] text-gray-500 leading-relaxed font-medium italic">
                  {project.next_steps}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
