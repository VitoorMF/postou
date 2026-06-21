"use client";

// Controlado: o estado/persistência fica no ContentActions (compartilhado com o ShareButton).
export default function PostedButton({ posted, onToggle, busy }: { posted: boolean; onToggle: () => void; busy?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={busy}
      className={`w-full h-[58px] rounded-2xl border border-white/[0.07] text-base font-bold flex items-center justify-center gap-2.5 active:scale-[0.99] transition-all disabled:opacity-60 ${
        posted ? "bg-[#1A1A1C] text-[#30C46B]" : "bg-[#1A1A1C] text-white hover:bg-[#262628]"
      }`}
    >
      {posted ? (
        <>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><polyline points="8.5 12 11 14.5 16 9.5" /></svg>
          Postado
        </>
      ) : (
        <>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>
          Marcar como postado
        </>
      )}
    </button>
  );
}
