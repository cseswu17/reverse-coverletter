"use client";

import { useState } from "react";
import EpisodeField from "@/components/EpisodeField";
import MatchResultCard from "@/components/MatchResultCard";
import ResultSkeleton from "@/components/ResultSkeleton";
import type { FinalMatch } from "@/lib/types";

const MIN_EPISODE_LENGTH = 20;
const MAX_EPISODE_LENGTH = 3000;

const EXAMPLE_EPISODE = {
  fact: "대학 졸업 프로젝트로 4인 팀에서 실시간 채팅 웹 서비스의 백엔드를 맡아 WebSocket 기반 메시징 서버를 구현했습니다.",
  problem:
    "사용자가 100명 이상 몰리는 부하 테스트 상황에서 메시지 순서가 뒤바뀌고 일부 메시지가 유실되는 문제가 발생해, 팀원들도 원인을 특정하지 못한 채 일정이 밀리고 있었습니다.",
  result:
    "메시지마다 시퀀스 번호를 부여하고 Redis 기반 큐로 순서를 보장하도록 구조를 바꿔 문제를 해결했고, 분산 환경에서의 동시성 처리와 장애를 가정한 설계의 중요성을 배웠습니다.",
};

type Status = "idle" | "loading" | "success" | "error";

function buildEpisode(fact: string, problem: string, result: string): string {
  return [
    `[겪은 경험]\n${fact.trim()}`,
    `[문제 상황]\n${problem.trim()}`,
    `[해결 과정과 배운 점]\n${result.trim()}`,
  ].join("\n\n");
}

export default function Home() {
  const [fact, setFact] = useState("");
  const [problem, setProblem] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [matches, setMatches] = useState<FinalMatch[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const isLoading = status === "loading";
  const allFieldsFilled = fact.trim().length > 0 && problem.trim().length > 0 && result.trim().length > 0;
  const combinedEpisode = buildEpisode(fact, problem, result);
  const trimmedLength = combinedEpisode.replace(/\[[^\]]+\]|\n/g, "").trim().length;
  const isValidLength =
    allFieldsFilled && trimmedLength >= MIN_EPISODE_LENGTH && combinedEpisode.length <= MAX_EPISODE_LENGTH;

  function handleFillExample() {
    if (isLoading) return;
    setFact(EXAMPLE_EPISODE.fact);
    setProblem(EXAMPLE_EPISODE.problem);
    setResult(EXAMPLE_EPISODE.result);
  }

  async function handleSubmit() {
    if (!isValidLength || isLoading) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episode: combinedEpisode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "매칭 중 오류가 발생했습니다.");
        setStatus("error");
        return;
      }

      setMatches(data.matches ?? []);
      setStatus("success");
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-canvas-soft">
      <main className="mx-auto flex w-full max-w-2xl flex-col px-6 py-20 sm:py-28">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            나와 기업의 궁합은 몇 점일까?
          </h1>
          <p className="mt-3 text-base text-body-text">
            내가 겪은 경험을 적으면, 지금 열려 있는 기업 자소서 문항과의 궁합을 점수로 알려드려요.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-hairline bg-canvas p-6 sm:p-8">
          <div className="space-y-5">
            <EpisodeField
              step={1}
              label="어떤 경험이었나요?"
              hint="Fact · 상황과 맡은 역할"
              placeholder="예: 팀 프로젝트에서 실시간 채팅 기능의 백엔드를 맡아 개발했어요."
              value={fact}
              onChange={setFact}
              disabled={isLoading}
            />
            <EpisodeField
              step={2}
              label="어떤 문제나 어려움이 있었나요?"
              hint="Problem · 부딪힌 벽"
              placeholder="예: 트래픽이 몰리면 메시지 순서가 꼬이고 일부가 유실되는 버그가 있었어요."
              value={problem}
              onChange={setProblem}
              disabled={isLoading}
            />
            <EpisodeField
              step={3}
              label="어떻게 해결했고, 뭘 배웠나요?"
              hint="Result · 해결 과정과 교훈"
              placeholder="예: 메시지 큐를 도입해 순서를 보장했고, 동시성 문제를 다루는 법을 배웠어요."
              value={result}
              onChange={setResult}
              disabled={isLoading}
            />

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleFillExample}
                disabled={isLoading}
                className="rounded-full border border-hairline bg-canvas px-3.5 py-1.5 text-xs font-medium text-body-text transition-all hover:border-hairline-strong hover:text-ink active:scale-[0.98] disabled:opacity-50"
              >
                ✏️ 예시 경험 가져오기
              </button>
              <span className="text-xs tabular-nums text-mute">
                {trimmedLength} / {MAX_EPISODE_LENGTH}
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isValidLength || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#46433f] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-canvas-soft-2 disabled:text-mute disabled:active:scale-100"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  분석 중...
                </>
              ) : (
                "궁합 확인하기"
              )}
            </button>

            {!allFieldsFilled && (
              <p className="text-center text-xs text-mute">
                세 칸을 모두 채우면 궁합 정확도가 올라가요
              </p>
            )}
            {status === "error" && (
              <p className="rounded-md bg-[#f7d4d6] px-4 py-3 text-sm font-medium text-[#c50000]">
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        <div className="mt-10">
          {isLoading && <ResultSkeleton />}

          {status === "success" && matches.length === 0 && (
            <p className="rounded-xl border border-dashed border-hairline p-8 text-center text-sm text-mute">
              아직 어울리는 문항을 찾지 못했어요. 경험을 조금 더 구체적으로 적어보세요.
            </p>
          )}

          {status === "success" && matches.length > 0 && (
            <div className="space-y-4">
              {matches.map((match, i) => (
                <MatchResultCard key={match.id} match={match} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
