"use client";

import { useState } from "react";
import { signInWithPopup, GithubAuthProvider } from "firebase/auth";
import { auth, githubProvider } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export function LoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        sessionStorage.setItem("github_token", credential.accessToken);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Failed to log in with GitHub");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={handleLogin}
        disabled={loading}
        size="lg"
        className="w-full sm:w-auto font-medium transition-all duration-300 hover:scale-105"
      >
        {loading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <GitHubLogoIcon className="mr-2 h-5 w-5" />
        )}
        Continue with GitHub
      </Button>
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}
