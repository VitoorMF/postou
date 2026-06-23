import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getUser() revalida o token no servidor de auth e renova quando expirado,
  // gravando os cookies atualizados na response (Server Components não conseguem).
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // /content/<id> e /feed/<id>: links de item que podem não ser do usuário. Não força
    // login — deixa passar e a PRÓPRIA PÁGINA devolve 404 se não for o dono (não revela que existe).
    if (/^\/(content|feed)\/[^/]+$/.test(request.nextUrl.pathname)) {
      return response;
    }
    // grava o destino num cookie pra voltar pra cá depois do login (deep link sobrevive;
    // funciona com Google e magic link no mesmo navegador, sem depender do Supabase)
    const res = NextResponse.redirect(new URL("/entrar", request.url));
    res.cookies.set("next_path", request.nextUrl.pathname + request.nextUrl.search, {
      path: "/",
      maxAge: 600,
      // legível pelo client: o login por CÓDIGO (verifyOtp no browser) também precisa
      // ler o destino. É só um path interno, validado no consumo (anti open-redirect).
      httpOnly: false,
      sameSite: "lax",
    });
    return res;
  }

  return response;
}

export const config = {
  matcher: ["/hoje/:path*", "/feed/:path*", "/content/:path*", "/settings/:path*", "/onboarding/:path*"],
};
