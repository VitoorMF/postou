"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function BrandKitAvatar() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("brand_kits")
        .select("logo_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.logo_url) setLogoUrl(data.logo_url);
    });
  }, []);

  return (
    <button
      onClick={() => router.push("/settings/brand-kit")}
      className="h-11 w-11 rounded-full bg-[#1c1c1c] shrink-0 overflow-hidden flex items-center justify-center"
    >
      {logoUrl ? (
        <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
      ) : (
        <svg width="18" height="18" fill="none" stroke="#555" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      )}
    </button>
  );
}
