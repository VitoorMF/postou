import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
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

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0e0e0e]">
      <main className="flex-1 min-h-0 overflow-y-auto md:order-2">
        <div className="mx-auto  h-full flex flex-col">
          {children}
        </div>
      </main>
      <Navbar />
    </div>
  );
}
