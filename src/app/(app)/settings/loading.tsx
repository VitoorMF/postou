export default function Loading() {
  return (
    <div className="flex flex-col h-full bg-black text-white font-sans">
      <div className="w-full px-4 pt-12 pb-4 shrink-0">
        <div className="h-8 w-32 bg-[#1c1c1c] rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-48 bg-[#1c1c1c] rounded-lg animate-pulse" />
      </div>
      <div className="flex-1 px-4 flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1c1c1c] w-full h-20 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
