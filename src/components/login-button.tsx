"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, Globe } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

interface LoginButtonProps {
  className?: string;
  variant?: any;
  provider?: 'github' | 'google' | 'both';
}

export function LoginButton({ className, variant, provider = 'both' }: LoginButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: 'github' | 'google') => {
    setLoading(provider);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          scopes: provider === 'github' ? 'repo' : undefined,
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(`${provider} login failed:`, err);
      setError(err.message || `Failed to log in with ${provider}`);
      setLoading(null);
    }
  };

  const showBoth = provider === 'both' && !variant;
  const showGithub = provider === 'github' || showBoth || (variant && provider === 'both');
  const showGoogle = provider === 'google' || (showBoth && !variant);

  const content = (
    <>
      {showGithub && (
        <Button
          onClick={() => handleLogin('github')}
          disabled={loading !== null}
          size="lg"
          variant={variant}
          className={`font-black uppercase tracking-[0.2em] text-[10px] h-14 transition-all duration-500 rounded-2xl ${!variant ? 'bg-white text-black hover:bg-primary hover:text-black border-none' : ''} ${!showBoth ? className : 'w-full'}`}
        >
          {loading === 'github' ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          ) : (
            <GitHubLogoIcon className="mr-3 h-4 w-4" />
          )}
          Continue_with_GitHub
        </Button>
      )}

      {showGoogle && (
        <Button
          onClick={() => handleLogin('google')}
          disabled={loading !== null}
          size="lg"
          className={`font-black uppercase tracking-[0.2em] text-[10px] h-14 bg-white/5 text-white hover:bg-white/10 border border-white/5 rounded-2xl transition-all duration-500 ${!showBoth ? className : 'w-full'}`}
        >
          {loading === 'google' ? (
            <Loader2 className="mr-3 h-4 w-4 animate-spin" />
          ) : (
            <Globe className="mr-3 h-4 w-4" />
          )}
          Access_with_Google
        </Button>
      )}

      {error && <p className="text-[10px] text-red-400 font-black uppercase tracking-widest bg-red-500/5 px-4 py-2 rounded-lg border border-red-500/10">{error}</p>}
      
      {showBoth && (
        <p className="text-[9px] text-gray-600 text-center px-8 leading-relaxed font-black uppercase tracking-widest">
          Auth_Protocol: <a href="/terms" className="hover:text-white transition-colors underline decoration-primary/20">Terms</a> // <a href="/privacy" className="hover:text-white transition-colors underline decoration-primary/20">Privacy</a>
        </p>
      )}
    </>
  );

  if (!showBoth) return content;

  return (
    <div className={`flex flex-col items-center gap-4 w-full max-w-sm ${className || ''}`}>
      {content}
    </div>
  );
}
