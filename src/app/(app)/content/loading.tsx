export default function Loading() {
  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">

      {/* header (estático) + filtro (placeholder) */}
      <div className="w-full px-4 md:px-8 pt-12 pb-4 shrink-0 max-w-[1100px] mx-auto">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-[34px] font-extrabold tracking-[-0.03em]">Conteúdo</h1>
            <p className="text-base text-[#8A8A8E] font-medium mt-1">Seus posts gerados</p>
          </div>
          <div className="hidden md:block h-9 w-24 rounded-full bg-[#161618] border border-white/[0.07] animate-pulse" />
        </div>
        <div className="md:hidden mt-4 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-20 rounded-full bg-[#161618] border border-white/[0.07] animate-pulse" />
          ))}
        </div>
      </div>

      {/* grid de cards (skeleton) */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 max-w-[1100px] mx-auto w-full">
        <div className="flex flex-col gap-4">
          <div className="h-3 w-16 bg-[#202022] rounded-full animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#161618] border border-white/[0.07] w-full rounded-[22px] overflow-hidden flex flex-col animate-pulse">
                <div className="w-full aspect-[4/3] bg-[#202022]" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-4 w-24 bg-[#202022] rounded-full" />
                  <div className="h-4 w-3/4 bg-[#202022] rounded-full" />
                  <div className="h-3 w-1/2 bg-[#202022] rounded-full" />
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  <div className="flex-1 h-10 bg-[#202022] rounded-xl" />
                  <div className="flex-1 h-10 bg-[#202022] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
