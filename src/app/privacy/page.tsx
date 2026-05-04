import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 selection:bg-primary/30 pt-8 pb-24 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <Link href="/">
          <Button variant="ghost" className="text-gray-500 hover:text-white -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <header className="space-y-4">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: May 2026</p>
        </header>

        <main className="space-y-8 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">1. Data We Collect</h2>
            <p>
              We collect your email address and basic profile information when you sign in via Google or GitHub.
              We also store your project preferences and deployment history to provide the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">2. How We Use Data</h2>
            <p>
              Your data is used to personalize your experience, manage your credit balance, and facilitate
              GitHub repository creation on your behalf. We do not sell your data to third parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">3. Third-Party Services</h2>
            <p>
              We use Supabase for authentication, Stripe for payments, and OpenRouter for AI generation.
              These services have their own privacy policies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">4. Security</h2>
            <p>
              We implement industry-standard security measures to protect your information. Your GitHub
              access tokens are stored only in your browser's session storage and are never saved to our database.
            </p>
          </section>

          <section className="space-y-4 text-sm text-gray-500">
            <p>Questions? Contact us at privacy@jobseed.studio</p>
          </section>
        </main>
      </div>
    </div>
  );
}
