"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function SignInButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // Se deu erro (não houve redirect), reabilita o botão pra tentar de novo.
    if (error) {
      console.error("Erro no login Google:", error.message);
      setLoading(false);
    }
  }

  return (
    <button onClick={signInWithGoogle} disabled={loading} className={className}>
      {children}
    </button>
  );
}
