"use client";

// Indicador clicável de "postado" no card — controlado (estado fica no PackCardBody).
export default function CardPostedToggle({ posted, onToggle, busy }: { posted: boolean; onToggle: () => void; busy?: boolean }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      disabled={busy}
      aria-label={posted ? "Marcar como não postado" : "Marcar como postado"}
      title={posted ? "Postado" : "Marcar como postado"}
      className="ml-auto shrink-0 -m-1 p-1 hover:scale-110 active:scale-90 disabled:opacity-50 transition-transform"
    >
      {posted ? (
        <svg width="18" height="18" fill="none" stroke="#30C46B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><polyline points="8.5 12 11 14.5 16 9.5" /></svg>
      ) : (
        <svg width="18" height="18" fill="none" stroke="#48484A" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>
      )}
    </button>
  );
}
