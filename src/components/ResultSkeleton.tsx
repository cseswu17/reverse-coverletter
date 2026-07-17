export default function ResultSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
        AI가 내 경험과 찰떡인 자소서 문항을 분석 중입니다...
      </div>
      <div className="w-full space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-3xl border border-zinc-200/60 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-4 w-14 animate-shimmer rounded-full" />
                <div className="h-5 w-40 animate-shimmer rounded-md" />
                <div className="h-5 w-24 animate-shimmer rounded-full" />
              </div>
              <div className="h-9 w-10 animate-shimmer rounded-md" />
            </div>
            <div className="mt-4 h-1.5 w-full animate-shimmer rounded-full" />
            <div className="mt-5 h-16 w-full animate-shimmer rounded-2xl" />
            <div className="mt-4 h-12 w-full animate-shimmer rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
