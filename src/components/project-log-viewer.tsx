"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Terminal, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';

interface ProjectLog {
  id: string;
  message: string;
  status: 'info' | 'success' | 'error' | 'pending';
  created_at: string;
}

export function ProjectLogViewer({ projectId, initialLogs = [] }: { projectId: string, initialLogs?: ProjectLog[] }) {
  const [logs, setLogs] = useState<ProjectLog[]>(initialLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`project_logs:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_logs',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setLogs((prev) => [...prev, payload.new as ProjectLog]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-3 w-3 text-[#a3e635]" />;
      case 'error': return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'pending': return <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />;
      default: return <Info className="h-3 w-3 text-blue-400" />;
    }
  };

  return (
    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[400px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
      <div className="bg-[#1A1A1A] border-b border-white/10 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 mr-2">
            <div className="h-3 w-3 rounded-full bg-[#FF5F56] shadow-[0_0_10px_rgba(255,95,86,0.3)]" />
            <div className="h-3 w-3 rounded-full bg-[#FFBD2E] shadow-[0_0_10px_rgba(255,189,46,0.3)]" />
            <div className="h-3 w-3 rounded-full bg-[#27C93F] shadow-[0_0_10px_rgba(39,201,63,0.3)]" />
          </div>
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#a3e635]" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Deployment_War_Room_v1.0</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#a3e635] animate-pulse" />
          <span className="text-[9px] font-bold text-[#a3e635] uppercase tracking-widest">Live_Stream</span>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-6 font-mono text-[12px] space-y-3 overflow-y-auto scrollbar-hide bg-[#050505] selection:bg-[#a3e635]/20"
      >
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-30">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <div className="text-gray-500 italic font-bold uppercase tracking-widest text-[10px]">Establishing Secure Uplink...</div>
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500 group/log">
            <span className="text-gray-700 shrink-0 font-bold tabular-nums">[{new Date(log.created_at).toLocaleTimeString([], { hour12: false })}]</span>
            <div className="mt-1 shrink-0">{getStatusIcon(log.status)}</div>
            <span className={`leading-relaxed tracking-tight ${
              log.status === 'error' ? 'text-red-400 font-bold' : 
              log.status === 'success' ? 'text-[#bef264] font-bold' : 
              'text-gray-300 font-medium'
            }`}>
              <span className="text-gray-600 mr-2 opacity-50 group-hover/log:opacity-100 transition-opacity">❯</span>
              {log.message}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-[#0A0A0A] border-t border-white/5 px-6 py-2 flex items-center justify-between opacity-50">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">ID: {projectId.slice(0, 8)}</span>
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">UTF-8 / Node.js 20</span>
      </div>
    </div>
  );
}
