"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth-provider';
import { getUserHistory, SavedProject, renameProject } from '@/actions/db-actions';
import {
  FolderGit2,
  Search,
  Filter,
  ChevronRight,
  Loader2,
  Share2,
  Rocket,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function MyProjectsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Renaming state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);

  const handleStartEdit = (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(id);
    setNewTitle(title);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(null);
  };

  const handleSaveRename = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newTitle.trim()) return;
    
    setRenameLoading(true);
    try {
      await renameProject(id, newTitle);
      setHistory(prev => prev.map(p => p.id === id ? { ...p, title: newTitle } : p));
      setEditingId(null);
    } catch (err) {
      alert("Failed to rename project");
    } finally {
      setRenameLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getUserHistory(user!.id);
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-8 pb-24 px-6 lg:pl-64">
        <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12"
        >

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-white">My Projects</span>
        </nav>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <FolderGit2 className="h-5 w-5" />
              <span className="font-black uppercase tracking-widest text-[10px]">Project Repository</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter">My Projects</h1>
            <p className="text-gray-400 max-w-lg font-medium">
              Manage and scale your autonomous builds. You have deployed {history.length} projects to date.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full bg-white/5 rounded-3xl" />
            ))}
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((project, i) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={editingId === project.id ? {} : { scale: 1.02 }}
              >
                <Link href={`/projects/${project.id}`}>
                  <Card className="bg-card/30 border-white/5 backdrop-blur-sm h-full flex flex-col hover:bg-white/5 transition-all cursor-pointer group rounded-3xl overflow-hidden">
                  <CardHeader className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl">
                        <Rocket className="h-4 w-4 text-primary" />
                      </div>
                      <Badge variant="outline" className="text-[8px] border-white/10 text-gray-500 uppercase tracking-widest font-black">
                        {project.plan}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      {editingId === project.id ? (
                        <div className="flex-1 flex items-center gap-2" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                          <input 
                            autoFocus
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            className="bg-black/50 border border-primary/50 text-white rounded-xl px-4 py-2 text-sm w-full focus:outline-none"
                          />
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={e => handleSaveRename(e, project.id)}
                            disabled={renameLoading}
                          >
                            {renameLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-gray-500 hover:bg-white/5"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <CardTitle className="text-xl text-white group-hover:text-primary transition-colors leading-tight">
                            {project.title}
                          </CardTitle>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity"
                            onClick={e => handleStartEdit(e, project.id, project.title)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <CardDescription className="text-gray-500 text-sm mt-3 line-clamp-2 leading-relaxed">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 flex-1 space-y-6">
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech, j) => (
                        <span key={j} className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 border border-white/10 text-gray-500 rounded-lg">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="px-8 py-6 bg-white/2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Engage Strategy</span>
                    <ChevronRight className="h-4 w-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                  </CardFooter>
                </Card>
              </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
            <FolderGit2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Projects Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8 text-sm">
              You haven't generated any projects yet. Head back to the generator to start building.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-2xl border-white/10 hover:bg-white/5 px-8">
                Go to Generator
              </Button>
            </Link>
          </div>
        )}
        </motion.div>
    </div>
  );
}

