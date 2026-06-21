import { createClient } from "@/lib/supabase-server";
import PlansClient from "./PlansClient";

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from("users")
    .select("plan, plan_expires_at, plan_change")
    .eq("id", user!.id)
    .single();

  const currentPlan = userData?.plan ?? "free";

  return <PlansClient currentPlan={currentPlan} planExpiresAt={userData?.plan_expires_at ?? null} planChange={userData?.plan_change ?? null} />;
}
