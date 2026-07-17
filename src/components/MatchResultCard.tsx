import type { FinalMatch } from "@/lib/types";

export default function MatchResultCard({ match, rank }: { match: FinalMatch; rank: number }) {
  return (
    <div
      className="animate-fade-in-up rounded-3xl border border-zinc-200/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-7"
      style={{ animationDelay: `${(rank - 1) * 90}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500">
            TOP {rank}
          </span>
          <h3 className="mt-2.5 text-lg font-bold tracking-tight text-zinc-900">
            {match.company_name}
            <span className="ml-2 text-sm font-medium text-zinc-400">{match.job_title}</span>
          </h3>
          <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
            {match.label}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <div className="text-2xl font-extrabold tabular-nums text-blue-600">{match.match_score}</div>
          <div className="text-[11px] font-medium text-zinc-400">매칭 점수</div>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, match.match_score))}%` }}
        />
      </div>

      <p className="mt-5 rounded-2xl bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-600">
        “{match.prompt}”
      </p>

      <div className="mt-4 flex gap-2.5 rounded-2xl bg-blue-50/70 p-4">
        <span className="mt-0.5 text-base leading-none">✨</span>
        <p className="text-sm leading-relaxed text-zinc-700">{match.reason}</p>
      </div>

      {match.source_url && (
        <div className="mt-5 flex justify-end">
          <a
            href={match.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
          >
            바로 지원하기
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
