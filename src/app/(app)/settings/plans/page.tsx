import { createClient } from "@/lib/supabase-server";
import PlansClient from "./PlansClient";

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user!.id)
    .single();

  const currentPlan = userData?.plan ?? "free";

  return <PlansClient currentPlan={currentPlan} />;
}
