import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import Navbar from "@/components/Navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: brandKit } = await supabase
    .from("brand_kits")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!brandKit) redirect("/onboarding");

  // Marca atividade — usado pra pausar geração automática de free inativo.
  // Via admin client porque a RLS bloqueia escrita do usuário em `users`.
  createAdminClient()
    .from("users")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", user.id)
    .then(() => {}, (err) => console.error("Erro ao atualizar last_active_at:", err));

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#0e0e0e]">
      <main className="flex-1 min-h-0 overflow-y-auto md:order-2">
        <div className="mx-auto  h-full flex flex-col">
          {children}
        </div>
      </main>
      <Navbar />
    </div>
  );
}
