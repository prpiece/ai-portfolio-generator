import { getProjectById } from "@/actions/db-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Terminal } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SharedProjectPage({ params }: { params: { id: string } }) {
  const project = await getProjectById(params.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 relative overflow-hidden flex flex-col items-center pt-8 pb-24 px-6">
      {/* Background ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none opacity-50" />

      {/* CTA Banner */}
      <div className="w-full max-w-3xl mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium">Built with JobSeed - Create Yours in 60 Seconds</p>
          </div>
          <Link href="/">
            <Button size="sm" className="font-bold">
              Start Free
            </Button>
          </Link>
        </div>
      </div>

      <main className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="space-y-4 border-b border-white/5 pb-8">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary border-none">
                {project.goal}
              </Badge>
            </div>
            <CardTitle className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              {project.title}
            </CardTitle>
            <CardDescription className="text-xl text-gray-400 max-w-2xl leading-relaxed">
              {project.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 space-y-12">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                Success Roadmap
              </h3>
              <div className="p-6 bg-white/5 rounded-xl border border-white/5 leading-relaxed text-gray-300 italic">
                "{project.successRoadmap}"
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Technologies Used</h3>
              <div className="flex flex-wrap gap-3">
                {project.techStack.map((tech, i) => (
                  <Badge key={i} variant="outline" className="text-sm py-1.5 px-4 bg-white/5 border-white/10 text-gray-300">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full h-12 text-lg border-white/10 hover:bg-white/5">
                  View Source on GitHub
                </Button>
              </a>
              <Link href="/" className="flex-1">
                <Button className="w-full h-12 text-lg font-bold">
                  Build a Project Like This
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-20 text-gray-500 text-sm">
        © 2026 JobSeed. All rights reserved.
      </footer>
    </div>
  );
}
