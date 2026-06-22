"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import GoogleButton from "./GoogleButton";

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("unable to validate email") || m.includes("invalid format")) return "Email inválido.";
  if (m.includes("rate limit") || m.includes("for security purposes") || m.includes("only request this after"))
    return "Calma — espere alguns segundos antes de pedir outro link.";
  if (m.includes("signups not allowed")) return "Cadastros estão temporariamente fechados.";
  return "Não consegui enviar o link. Tente de novo.";
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const inputCls =
  "w-full rounded-xl bg-[#0C0C0E] border border-white/[0.09] px-4 py-3 text-[15px] text-white placeholder:text-[#636366] outline-none focus:border-[#137EFF] transition";

export default function AuthForm({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    if (!EMAIL_RE.test(email)) {
      setError("Digite um email válido.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (error) {
      setError(translateError(error.message));
      return;
    }
    setSent(true);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (verifying) return;
    if (code.length !== 6) {
      setError("O código tem 6 dígitos.");
      return;
    }
    setVerifying(true);
    setError("");
    const supabase = createClient();
    // existente vem como "email"; cadastro novo vem como "signup" → tenta os dois
    let { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) {
      ({ error } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" }));
    }
    if (error) {
      setVerifying(false);
      setError("Código inválido ou expirado. Confira ou peça outro.");
      return;
    }
    // sessão setada no browser → volta pro destino guardado (deep link) ou /hoje
    const raw = document.cookie.match(/(?:^|;\s*)next_path=([^;]+)/)?.[1];
    const next = raw ? decodeURIComponent(raw) : "";
    const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/hoje";
    document.cookie = "next_path=; path=/; max-age=0";
    window.location.assign(dest);
  }

  if (sent) {
    return (
      <div className="w-full text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#137EFF]/15">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#137EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Confira seu email</h1>
        <p className="mt-2 text-sm text-[#8A8A8E]">
          Enviei um acesso pra <span className="font-semibold text-white">{email}</span>.
          Clique no link <b className="text-white font-semibold">ou</b> digite o código abaixo.
        </p>

        <form onSubmit={verifyCode} className="mt-5 flex flex-col gap-3">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`${inputCls} text-center text-lg font-semibold tracking-[0.5em]`}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="rounded-xl bg-[#137EFF] px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-[#137EFF]/90 active:scale-[0.99] disabled:opacity-60"
          >
            {verifying ? "Entrando…" : "Entrar com código"}
          </button>
        </form>

        <p className="mt-5 text-xs text-[#636366]">Não chegou? Olhe o spam ou</p>
        <button
          onClick={() => { setSent(false); setError(""); setCode(""); }}
          className="mt-1 text-sm font-semibold text-[#137EFF] hover:underline"
        >
          tentar outro email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "signup" ? "Criar sua conta" : "Entrar"}
        </h1>
        <p className="mt-1.5 text-sm text-[#8A8A8E]">
          {mode === "signup"
            ? "Comece grátis — seu primeiro post sai em minutos."
            : "Entre com Google ou receba um link no seu email."}
        </p>
      </div>

      <GoogleButton />

      <div className="my-5 flex items-center gap-3 text-xs text-[#636366]">
        <span className="h-px flex-1 bg-white/[0.08]" />
        ou com email
        <span className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <form onSubmit={sendLink} className="flex flex-col gap-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-xl bg-[#137EFF] px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-[#137EFF]/90 active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Receber link de acesso"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#8A8A8E]">
        {mode === "login" ? (
          <>
            Não tem conta?{" "}
            <button type="button" onClick={() => setMode("signup")} className="font-semibold text-[#137EFF] hover:underline">
              Criar conta
            </button>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <button type="button" onClick={() => setMode("login")} className="font-semibold text-[#137EFF] hover:underline">
              Entrar
            </button>
          </>
        )}
      </p>
      <p className="mt-3 text-center text-xs text-[#636366]">
        Sem senha. A gente manda um link mágico pro seu email.
      </p>
    </div>
  );
}
