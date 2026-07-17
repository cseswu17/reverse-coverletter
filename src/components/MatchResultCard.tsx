import type { FinalMatch } from "@/lib/types";

export default function MatchResultCard({ match, rank }: { match: FinalMatch; rank: number }) {
  return (
    <div
      className="animate-fade-in-up rounded-xl border border-hairline bg-canvas p-6 shadow-level-3 transition-shadow hover:shadow-level-4 sm:p-7"
      style={{ animationDelay: `${(rank - 1) * 90}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center rounded-full bg-canvas-soft-2 px-2.5 py-0.5 text-xs font-medium text-body-text">
            TOP {rank}
          </span>
          <h3 className="mt-2.5 text-lg font-semibold tracking-[-0.02em] text-ink">
            {match.company_name}
            <span className="ml-2 text-sm font-normal text-mute">{match.job_title}</span>
          </h3>
          <span className="mt-2 inline-block rounded-full bg-canvas-soft-2 px-2.5 py-1 text-xs font-medium text-body-text">
            {match.label}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <div className="text-2xl font-semibold tabular-nums text-link">{match.match_score}</div>
          <div className="text-[11px] text-mute">매칭 점수</div>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-canvas-soft-2">
        <div
          className="h-full rounded-full bg-link transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, match.match_score))}%` }}
        />
      </div>

      <p className="mt-5 rounded-md bg-canvas-soft p-4 text-sm leading-relaxed text-body-text">
        “{match.prompt}”
      </p>

      <div className="mt-4 flex gap-2.5 rounded-md bg-link-bg-soft/40 p-4">
        <span className="mt-0.5 text-base leading-none">✨</span>
        <p className="text-sm leading-relaxed text-body-text">{match.reason}</p>
      </div>

      {match.source_url && (
        <div className="mt-5 flex justify-end">
          <a
            href={match.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-medium text-white transition-all hover:bg-[#333333] active:scale-[0.98]"
          >
            바로 지원하기
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
