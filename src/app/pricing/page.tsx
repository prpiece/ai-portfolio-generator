"use client";

import { Check, Terminal, Crown, Rocket, Sparkles, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateUserPlan } from "@/actions/db-actions";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for exploring the possibilities of AI project generation.",
    features: [
      "3 lifetime credits",
      "Llama 3.1 8B Model",
      "Basic README generation",
      "Public project sharing",
    ],
    cta: "Go Free",
    highlight: false,
    priceId: null,
  },
  {
    name: "Pro",
    price: "$11.99",
    description: "The sweet spot for individual creators and developers.",
    features: [
      "100 credits per month",
      "GPT-4o Model Access",
      "Playwright E2E Tests",
      "GitHub Actions CI/CD",
      "Technical Architecture docs",
    ],
    cta: "Go Pro",
    highlight: true,
    priceId: "price_1TT6S4I3pjtrPrSClv8KpW0d",
  },
  {
    name: "Enterprise",
    price: "$49.99",
    description: "For serious builders needing maximum power and support.",
    features: [
      "250 credits per month",
      "Advanced AI optimization",
      "Priority project deployment",
      "Custom scaffolding rules",
      "24/7 Priority Support",
    ],
    cta: "Go Enterprise",
    highlight: false,
    priceId: "price_1TT6byI3pjtrPrSC4X0YEuhh",
  },
];

export default function PricingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (tier: typeof tiers[0]) => {
    if (!user) {
      router.push("/");
      return;
    }

    if (isCurrentPlan(tier.name)) return;

    // DEGRADE TO FREE / MANAGE SUBSCRIPTION LOGIC
    if (tier.name === "Free") {
      // If they have a stripe customer ID, they MUST use the portal to cancel
      if (profile?.stripe_customer_id) {
        const confirmPortal = window.confirm(
          "To return to the Free plan, you need to cancel your active subscription in the Billing Portal. Would you like to go there now?"
        );
        if (!confirmPortal) return;

        setLoading("Free");
        try {
          const res = await fetch("/api/stripe/portal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerId: profile.stripe_customer_id }),
          });
          const data = await res.json();
          if (data.url) {
            window.location.href = data.url;
          } else {
            throw new Error(data.error || "Failed to load portal");
          }
        } catch (err: any) {
          console.error("Portal redirect failed:", err);
          alert(err.message || "Failed to load billing portal. Please contact support.");
        } finally {
          setLoading(null);
        }
        return;
      }

      // Fallback for users without a stripe_customer_id (manual upgrades)
      const confirmDegrade = window.confirm(
        "Are you sure you want to return to the Free plan? Your Pro/Enterprise benefits will be revoked immediately."
      );
      if (!confirmDegrade) return;

      setLoading("Free");
      try {
        await updateUserPlan(user.id, "free");
        await refreshProfile();
      } catch (err) {
        console.error("Degrade failed:", err);
      } finally {
        setLoading(null);
      }
      return;
    }

    // STRIPE CHECKOUT LOGIC FOR PAID TIERS
    if (!tier.priceId) return;

    setLoading(tier.name);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          priceId: tier.priceId
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Subscription failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const isCurrentPlan = (planName: string) => {
    if (!profile) return planName === "Free";
    return profile.plan.toLowerCase() === planName.toLowerCase();
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 relative overflow-hidden flex flex-col items-center pt-8 pb-24 px-6">
      {/* Background ambient gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none opacity-50" />

      {/* Exit Button */}
      <div className="w-full max-w-6xl mb-6 relative z-10">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/dashboard")}
          className="text-gray-400 hover:text-white group flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </Button>
      </div>

      <header className="text-center space-y-2 mb-12 relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-gray-400 backdrop-blur-sm mb-2">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Flexible Pricing for Everyone</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Choose Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-primary">Power Tier</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl relative z-10">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`bg-white/5 border-white/10 backdrop-blur-xl flex flex-col relative transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] ${tier.highlight ? 'ring-2 ring-primary ring-offset-2 ring-offset-black scale-[1.02]' : ''} ${isCurrentPlan(tier.name) ? 'border-primary/40 ring-1 ring-primary/20' : ''}`}
          >
            {isCurrentPlan(tier.name) && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-black border border-primary/30 px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] z-30 shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                Your Current Tier
              </div>
            )}
            {tier.highlight && !isCurrentPlan(tier.name) && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest z-20 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Most Popular
              </div>
            )}
            <CardHeader className="space-y-1 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                {tier.name === "Free" && <Terminal className="h-4 w-4 text-gray-500" />}
                {tier.name === "Pro" && <Crown className="h-4 w-4 text-primary" />}
                {tier.name === "Enterprise" && <Rocket className="h-4 w-4 text-purple-500" />}
              </div>
              <div className="flex items-baseline gap-1 pt-2">
                <span className="text-3xl font-extrabold">{tier.price}</span>
                {tier.price !== "$0" && <span className="text-gray-500 text-xs">/month</span>}
              </div>
              <CardDescription className="text-gray-400 text-xs pt-1">
                {tier.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 py-4">
              <ul className="space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-gray-300 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="py-4">
              <Button
                className={`w-full font-bold transition-all ${isCurrentPlan(tier.name) ? 'bg-white/5 text-gray-500 cursor-default' : tier.highlight ? 'bg-primary text-black hover:scale-[1.02]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                disabled={loading !== null}
                onClick={() => handleAction(tier)}
              >
                {loading === tier.name ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrentPlan(tier.name) ? "Current Plan" : tier.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <footer className="mt-24 text-gray-500 text-sm">
        © 2026 JobSeed. Secure payments via Stripe.
      </footer>
    </div>
  );
}
