import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");                 // OAuth (Google) + magic link PKCE
  const tokenHash = searchParams.get("token_hash");      // magic link via template token_hash
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const oauthError = searchParams.get("error");

  // Host real que o browser mandou (evita 0.0.0.0 quando dev roda em --hostname 0.0.0.0).
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const base = `${proto}://${host}`;

  // OAuth devolveu erro (ex: usuário cancelou) ou link inválido → volta pra landing.
  if (oauthError || (!code && !tokenHash)) {
    if (oauthError) console.error("[auth/callback] OAuth retornou erro:", oauthError);
    return NextResponse.redirect(`${base}/?auth_error=1`);
  }

  const cookieStore = await cookies();

  // destino pós-login: lê do cookie setado pelo middleware (só path interno, anti open-redirect)
  const nextPath = cookieStore.get("next_path")?.value;
  const safeNext = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/hoje";

  // IMPORTANTE: cria a response do redirect ANTES e grava os cookies de sessão
  // DIRETO nela. Gravar no cookieStore + retornar um redirect separado faz o
  // Set-Cookie se perder de forma intermitente → "precisa logar duas vezes".
  const response = NextResponse.redirect(`${base}${safeNext}`);
  response.cookies.set("next_path", "", { path: "/", maxAge: 0 }); // consome o cookie

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); }, // lê o code-verifier (PKCE)
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options) // escreve na response do redirect
          );
        },
      },
    }
  );

  // token_hash (template) é stateless → funciona cross-browser (abrir o email em outro app).
  // code (PKCE) precisa do verifier cookie → funciona no mesmo browser que pediu.
  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    : await supabase.auth.exchangeCodeForSession(code!);

  if (error) {
    console.error("[auth/callback] falha ao validar login:", error.message);
    return NextResponse.redirect(`${base}/?auth_error=1`);
  }

  return response;
}
