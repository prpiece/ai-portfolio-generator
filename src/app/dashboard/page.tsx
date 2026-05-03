"use client";

import { useState, useEffect } from "react";
import { generateIdeas, ProjectIdea } from "@/actions/generate-ideas";
import { deployToGithub } from "@/actions/deploy-to-github";
import { saveProject, getUserHistory, SavedProject } from "@/actions/db-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Terminal, TestTube2 } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [deploying, setDeploying] = useState<Record<number, boolean>>({});
  const [repoUrls, setRepoUrls] = useState<Record<number, string>>({});
  const [history, setHistory] = useState<SavedProject[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    } else if (user) {
      loadHistory(user.uid);
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
    if (!jobTitle.trim()) return;
    
    setLoading(true);
    setError(null);
    setIdeas([]);
    
    try {
      const results = await generateIdeas(jobTitle);
      setIdeas(results);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (idea: ProjectIdea, index: number) => {
    const token = sessionStorage.getItem("github_token");
    if (!token) {
      alert("GitHub token not found. Please log out and log back in to grant repository permissions.");
      return;
    }

    setDeploying((prev) => ({ ...prev, [index]: true }));
    try {
      const url = await deployToGithub(idea, token);
      setRepoUrls((prev) => ({ ...prev, [index]: url }));
      
      // Auto-save to Firestore history
      if (user) {
        await saveProject(idea, url, user.uid);
        await loadHistory(user.uid); // Refresh history
      }
    } catch (err: any) {
      alert(err.message || "Failed to deploy to GitHub");
    } finally {
      setDeploying((prev) => ({ ...prev, [index]: false }));
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 py-12 px-6">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        <header className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 mb-4">
            <Terminal className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Project Dashboard</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Enter your target job title below to generate tailored portfolio projects.
          </p>
        </header>

        <section className="max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="e.g. Senior Frontend Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 text-lg backdrop-blur-md focus-visible:ring-primary/50"
            />
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !jobTitle.trim()} 
              size="lg"
              className="h-12 px-8 font-semibold"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Terminal className="h-5 w-5 mr-2" />}
              Generate
            </Button>
          </div>
          {error && <p className="text-destructive mt-3 text-sm text-center">{error}</p>}
        </section>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card/50 border-white/10 backdrop-blur-xl h-full flex flex-col">
                <CardHeader className="space-y-4">
                  <Skeleton className="h-6 w-3/4 bg-white/10" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-white/10" />
                    <Skeleton className="h-4 w-full bg-white/10" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 bg-white/10" />
                    <Skeleton className="h-6 w-20 bg-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4 bg-white/10" />
                    <Skeleton className="h-4 w-full bg-white/10" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full bg-white/10" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!loading && ideas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {ideas.map((idea, i) => (
              <Card key={i} className="bg-card/50 border-white/10 backdrop-blur-xl hover:bg-card/80 transition-all duration-300 h-full flex flex-col group">
                <CardHeader>
                  <CardTitle className="text-xl text-white group-hover:text-primary transition-colors">
                    {idea.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 mt-2">
                    {idea.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {idea.techStack.map((tech, j) => (
                      <Badge key={j} variant="secondary" className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/30">{tech}</Badge>
                    ))}
                  </div>
                  
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-300">
                      <TestTube2 className="h-4 w-4 text-primary" />
                      Test Strategy
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {idea.testStrategy}
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  {repoUrls[i] ? (
                    <a href={repoUrls[i]} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button className="w-full font-semibold bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]">
                        <GitHubLogoIcon className="mr-2 h-4 w-4" />
                        View Repository
                      </Button>
                    </a>
                  ) : (
                    <Button 
                      onClick={() => handleDeploy(idea, i)}
                      disabled={deploying[i]}
                      className="w-full font-semibold group-hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-shadow"
                    >
                      {deploying[i] ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <GitHubLogoIcon className="mr-2 h-4 w-4" />
                      )}
                      {deploying[i] ? "Deploying..." : "Deploy to GitHub"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <hr className="border-white/5 my-12" />

        <section className="space-y-8 pb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Project History</h2>
          </div>

          {historyLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[400px] w-full bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {history.map((project) => (
                <Card key={project.id} className="bg-card/30 border-white/5 backdrop-blur-sm h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="text-gray-500 text-sm mt-2 line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech, j) => (
                        <Badge key={j} variant="outline" className="text-[10px] border-white/10 text-gray-400">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    <div className="bg-white/5 p-3 rounded-md border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Test Strategy</p>
                      <p className="text-xs text-gray-400 italic">"{project.testStrategy}"</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="w-full text-xs border-white/10 hover:bg-white/5">
                        <GitHubLogoIcon className="mr-2 h-3 w-3" />
                        View on GitHub
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p className="text-gray-500">No projects deployed yet. Start building!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
