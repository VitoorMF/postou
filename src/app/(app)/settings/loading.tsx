export default function Loading() {
  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] text-white font-sans">
      <div className="w-full px-4 md:px-8 pt-12 pb-4 shrink-0 max-w-[1100px] mx-auto">
        <h1 className="text-3xl md:text-[42px] font-extrabold tracking-[-0.035em] leading-none">Configurar</h1>
        <p className="text-base md:text-lg text-[#8A8A8E] font-medium mt-2">Escolha o que gerar todo dia</p>
      </div>
      <div className="px-4 md:px-8 flex flex-col gap-7 pb-16 max-w-[1100px] mx-auto w-full">
        {/* atalhos */}
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#161618] border border-white/[0.07] rounded-[16px] md:rounded-[18px] p-4 md:px-6 md:py-5 flex items-center gap-4 animate-pulse">
              <div className="w-[42px] h-[42px] md:w-[46px] md:h-[46px] rounded-[12px] md:rounded-[13px] bg-[#202022] shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-28 bg-[#202022] rounded-full mb-2" />
                <div className="h-3 w-48 max-w-full bg-[#202022] rounded-full" />
              </div>
            </div>
          ))}
        </div>
        {/* cards de seção */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#161618] border border-white/[0.07] rounded-[16px] md:rounded-[18px] h-40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
