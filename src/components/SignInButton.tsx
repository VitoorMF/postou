"use client";

import { createClient } from "@/lib/supabase";

export default function SignInButton({ children, className }: { children: React.ReactNode; className?: string }) {
  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button onClick={signInWithGoogle} className={className}>
      {children}
    </button>
  );
}
