import React from 'react';
import { Terminal, Cpu, Zap, Coins, Rocket, ShieldCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HowItWorks() {
  const steps = [
    {
      title: "Select Your Niche",
      description: "Define your target role or project goal. Our AI analyzes the market to find the best technical stack.",
      icon: <Terminal className="h-6 w-6" />,
      color: "blue"
    },
    {
      title: "Synthesize the Blueprint",
      description: "Our tiered model engine (Llama 3 for Free, GPT-4o for Pro) generates a success roadmap and strategy.",
      icon: <Cpu className="h-6 w-6" />,
      color: "purple"
    },
    {
      title: "Autonomous Coding",
      description: "The AI writes 100% functional, plug-and-play code including package.json and environment configs.",
      icon: <Zap className="h-6 w-6" />,
      color: "lime"
    },
    {
      title: "Direct GitHub Push",
      description: "Using Octokit, we create a private repository and push the code directly to your GitHub account.",
      icon: <Rocket className="h-6 w-6" />,
      color: "blue"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-8 pb-24 px-6">
      <div className="max-w-4xl mx-auto space-y-20">
        
        {/* Header */}
        <header className="text-center space-y-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-4">
            The Engine Room
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter">How It Works</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium">
            Discover the autonomous technology that powers your project generation from vision to deployment.
          </p>
        </header>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="group relative bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/[0.07] transition-all duration-500">
              <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 w-fit mb-6 group-hover:scale-110 transition-transform`}>
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {step.description}
              </p>
              <div className="absolute top-6 right-8 text-white/5 text-6xl font-black italic">
                {idx + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Sections */}
        <div className="space-y-12">
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-widest text-xs">Model Intelligence</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">The Tiered Engine Strategy</h2>
                <p className="text-gray-400 leading-relaxed">
                  We use a dual-model approach to balance speed and power. Our <strong>Free</strong> tier utilizes <strong>Llama 3</strong> for rapid architectural mapping, while our <strong>Pro & Enterprise</strong> tiers leverage <strong>GPT-4o</strong>—the gold standard for complex coding tasks and production-ready logic.
                </p>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
                  <div className="text-2xl font-bold mb-1">Llama 3</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Architect</div>
                </div>
                <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20 text-center">
                  <div className="text-2xl font-bold mb-1 text-primary">GPT-4o</div>
                  <div className="text-[10px] text-primary uppercase tracking-widest">Engineer</div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-2 text-yellow-500">
                  <Coins className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-widest text-xs">Credit Ecosystem</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Fueling Your Productivity</h2>
                <p className="text-gray-400 leading-relaxed">
                  Every generation and deployment consumes credits. <strong>Pro</strong> users receive a monthly refresh of 100 credits, while <strong>Enterprise</strong> users receive 250 credits for high-scale autonomous builds. Subscription plans handle all credit management—no separate purchases required.
                </p>
              </div>
              <div className="flex-1 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-8 border border-yellow-500/20 text-center">
                <div className="text-4xl font-black mb-2 tracking-tighter">REFRESH_SYNC</div>
                <div className="text-xs text-yellow-500 font-bold uppercase">Monthly Automated Cycle</div>
              </div>
            </div>
          </section>
        </div>

        {/* CTA */}
        <div className="text-center pt-10">
          <Link href="/dashboard">
            <Button size="lg" className="rounded-full px-12 py-8 text-lg font-bold group">
              Start Building Now
              <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
