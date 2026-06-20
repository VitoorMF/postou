import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Entrar — Postou" };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  // Já logado? vai direto pro app.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/hoje");

  const { mode } = await searchParams;
  const initialMode = mode === "signup" ? "signup" : "login";

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-white flex flex-col items-center justify-center px-5 py-12">
      <a href="/" className="mb-8 flex items-center gap-3 text-[22px] font-extrabold tracking-tight">
        <span className="relative block" style={{ width: 34, height: 34 }}>
          <span style={{ position: "absolute", inset: 0, borderRadius: "22%", background: "#1A3580", transform: "translate(-7px,-3px) rotate(-14deg)", boxShadow: "0 4px 10px rgba(0,0,0,.25)" }} />
          <span style={{ position: "absolute", inset: 0, borderRadius: "22%", background: "#2952B3", transform: "translate(-3px,-1px) rotate(-7deg)", boxShadow: "0 4px 10px rgba(0,0,0,.25)" }} />
          <span style={{ position: "absolute", inset: 0, borderRadius: "22%", background: "#4169E1", boxShadow: "0 4px 10px rgba(0,0,0,.25)" }} />
        </span>
        postou
      </a>

      <div className="w-full max-w-[400px] rounded-[24px] border border-white/[0.07] bg-[#161618] p-7 md:p-8">
        <AuthForm initialMode={initialMode} />
      </div>

      <p className="mt-6 max-w-[360px] text-center text-xs leading-relaxed text-[#636366]">
        Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade do Postou.
      </p>
    </div>
  );
}
