import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  // Host real que o browser mandou (evita 0.0.0.0 quando dev roda em --hostname 0.0.0.0).
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const base = `${proto}://${host}`;

  // OAuth devolveu erro (ex: usuário cancelou) ou veio sem code → volta pra landing.
  if (oauthError || !code) {
    if (oauthError) console.error("[auth/callback] OAuth retornou erro:", oauthError);
    return NextResponse.redirect(`${base}/?auth_error=1`);
  }

  const cookieStore = await cookies();

  // IMPORTANTE: cria a response do redirect ANTES e grava os cookies de sessão
  // DIRETO nela. Gravar no cookieStore + retornar um redirect separado faz o
  // Set-Cookie se perder de forma intermitente → "precisa logar duas vezes".
  const response = NextResponse.redirect(`${base}/hoje`);

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // troca falhou (code reusado, PKCE ausente) → não manda pro /hoje sem sessão
    console.error("[auth/callback] exchangeCodeForSession falhou:", error.message);
    return NextResponse.redirect(`${base}/?auth_error=1`);
  }

  return response;
}
