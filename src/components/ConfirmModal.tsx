"use client";

// Modal de confirmação com a identidade do app (substitui o window.confirm nativo).
// Controlado pelo pai: renderiza só quando `open`.
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Deletar",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_.15s_ease]" />
      <div
        className="relative w-full max-w-sm bg-[#161618] border border-white/[0.08] rounded-3xl p-6 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="h-14 w-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: "rgba(255,80,80,0.12)", color: "#ff7a7a" }}>
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </span>
        <h2 className="text-lg font-bold mb-1.5">{title}</h2>
        <p className="text-sm text-[#8A8A8E] mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-[#262628] text-sm font-semibold text-[#aaa] active:scale-[0.98] transition-transform">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 h-12 rounded-2xl bg-[#ff5050] text-white text-sm font-semibold active:scale-[0.98] transition-transform">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
