export default function Loading() {
  return (
    <div className="flex flex-col h-full bg-black text-white font-sans">
      <div className="w-full px-4 pt-12 pb-4 shrink-0">
        <div className="h-8 w-32 bg-[#1c1c1c] rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-48 bg-[#1c1c1c] rounded-lg animate-pulse" />
      </div>
      <div className="flex-1 px-4 flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#1c1c1c] w-full rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex-1 aspect-square rounded-xl bg-[#2a2a2a]" />
              ))}
            </div>
            <div className="h-5 w-16 bg-[#2a2a2a] rounded-full" />
            <div className="h-4 w-3/4 bg-[#2a2a2a] rounded-full" />
            <div className="h-4 w-1/2 bg-[#2a2a2a] rounded-full" />
            <div className="flex gap-2">
              <div className="flex-1 h-10 bg-[#2a2a2a] rounded-full" />
              <div className="flex-1 h-10 bg-[#2a2a2a] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
