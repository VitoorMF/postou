"use client";

import { useSmartBack } from "@/components/SmartBack";

export default function BackButton({ fallback = "/content" }: { fallback?: string }) {
  const goBack = useSmartBack(fallback);
  return (
    <button
      onClick={goBack}
      aria-label="Voltar"
      className="h-11 w-11 rounded-[14px] bg-[#1A1A1C] border border-white/[0.07] flex items-center justify-center text-white hover:bg-[#262628] active:scale-95 transition-all"
    >
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}
