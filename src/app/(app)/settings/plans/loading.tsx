// Skeleton de rota — exibido enquanto o page.tsx (server) busca o plano atual.
export default function PlansLoading() {
  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1180px] mx-auto px-4 md:px-14 pt-12 pb-16">

          {/* back (estático) */}
          <div className="h-11 w-11 rounded-[13px] bg-[#161618] border border-white/[0.07] flex items-center justify-center text-white mb-9">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
          </div>

          {/* head (estático) */}
          <div className="text-center mb-9">
            <p className="text-[13px] font-bold tracking-[0.16em] uppercase text-[#137EFF] mb-3">Planos</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-[-0.04em] leading-none">Poste mais. Pense menos.</h1>
            <p className="text-[#8A8A8E] text-base md:text-lg font-medium mt-4 max-w-md mx-auto">Escolha um plano e deixe a IA cuidar do seu conteúdo todos os dias.</p>
          </div>

          {/* cards */}
          <div className="grid md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`rounded-[24px] p-7 border border-white/[0.07] bg-[#161618] animate-pulse ${i === 1 ? "md:-translate-y-2.5" : ""}`}
              >
                <div className="h-6 w-24 bg-[#1e1e21] rounded-lg mb-2" />
                <div className="h-4 w-40 max-w-full bg-[#1e1e21] rounded-full mb-6" />
                <div className="h-12 w-28 bg-[#1e1e21] rounded-xl mb-6" />
                <div className="h-px bg-white/[0.07] mb-5" />
                <div className="flex flex-col gap-3.5 mb-7">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="h-4 w-full bg-[#1e1e21] rounded-full" />
                  ))}
                </div>
                <div className="h-[52px] w-full bg-[#1e1e21] rounded-[14px]" />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
