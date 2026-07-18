import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { embedText } from "@/lib/embeddings";
import { MATCH_SYSTEM_PROMPT, buildMatchUserPrompt } from "@/lib/matchPrompt";
import { checkRateLimit } from "@/lib/rateLimit";
import type { FinalMatch, MatchedQuestion } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_EPISODE_LENGTH = 20;
const MAX_EPISODE_LENGTH = 3000;
const MATCH_COUNT = 3;
const CANDIDATE_POOL_SIZE = 8; // Claude가 채점할 후보 풀 크기 — 회사당 최고 문항만 남기고 상위 3개 회사를 뽑기 위함
const CLAUDE_MODEL = "claude-sonnet-5";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface LlmMatchResult {
  id: string;
  job_analysis: string;
  match_score: number;
  reason: string;
}

function isLlmMatchResult(value: unknown): value is LlmMatchResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.job_analysis === "string" &&
    typeof v.match_score === "number" &&
    typeof v.reason === "string"
  );
}

function stripMarkdownFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fenced ? fenced[1] : text).trim();
}

function parseLlmMatches(text: string): LlmMatchResult[] {
  const parsed = JSON.parse(stripMarkdownFence(text));
  if (!Array.isArray(parsed) || !parsed.every(isLlmMatchResult)) {
    throw new Error("unexpected llm match shape");
  }
  return parsed;
}

function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

// 같은 회사가 여러 문항으로 상위권을 도배하지 않도록, Claude가 점수를 매긴 뒤
// 회사당 match_score가 가장 높은 문항 하나만 남긴다 (임베딩 유사도가 아니라 Claude의 최종 판단 기준으로 고른다).
function dedupeByCompany(matches: FinalMatch[], limit: number): FinalMatch[] {
  const bestByCompany = new Map<string, FinalMatch>();
  for (const match of matches) {
    const existing = bestByCompany.get(match.company_name);
    if (!existing || match.match_score > existing.match_score) {
      bestByCompany.set(match.company_name, match);
    }
  }
  return Array.from(bestByCompany.values())
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }
  const episode = typeof (body as Record<string, unknown>).episode === "string"
    ? (body as Record<string, unknown>).episode as string
    : "";
  const trimmed = episode.trim();

  if (trimmed.length < MIN_EPISODE_LENGTH) {
    return NextResponse.json(
      { error: `경험을 조금 더 구체적으로 입력해주세요 (${MIN_EPISODE_LENGTH}자 이상).` },
      { status: 400 }
    );
  }
  if (trimmed.length > MAX_EPISODE_LENGTH) {
    return NextResponse.json(
      { error: `입력이 너무 깁니다 (${MAX_EPISODE_LENGTH}자 이하로 입력해주세요).` },
      { status: 400 }
    );
  }

  let candidates: MatchedQuestion[];
  try {
    const embedding = await embedText(trimmed);

    const { data, error } = await supabaseAdmin.rpc("match_questions", {
      query_embedding: embedding,
      match_count: CANDIDATE_POOL_SIZE,
    });

    if (error) {
      console.error("match_questions rpc error", error);
      return NextResponse.json({ error: "매칭 중 오류가 발생했습니다." }, { status: 500 });
    }

    candidates = (data ?? []) as MatchedQuestion[];
  } catch (err) {
    if (err instanceof OpenAI.AuthenticationError) {
      return NextResponse.json({ error: "OpenAI API 키가 유효하지 않습니다." }, { status: 401 });
    }
    if (err instanceof OpenAI.RateLimitError) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
    if (err instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: err.message || "임베딩 생성 중 오류가 발생했습니다." },
        { status: err.status ?? 500 }
      );
    }
    console.error("match route embedding step error", err);
    return NextResponse.json({ error: "알 수 없는 오류가 발생했습니다." }, { status: 500 });
  }

  if (candidates.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  // 후보 하나당 하나의 Claude 호출을 동시에 날린다 — 8개를 순서대로 다 채점하는 것보다
  // 전체 응답 시간이 "가장 오래 걸리는 1개" 수준으로 크게 줄어든다.
  const settled = await Promise.allSettled(
    candidates.map((candidate) => scoreCandidate(trimmed, candidate))
  );

  const scoredMatches: FinalMatch[] = [];
  let anthropicAuthError = false;
  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) {
      scoredMatches.push(result.value);
    } else if (result.status === "rejected") {
      if (result.reason instanceof Anthropic.AuthenticationError) anthropicAuthError = true;
      console.error("match route per-candidate scoring error", result.reason);
    }
  }

  if (anthropicAuthError && scoredMatches.length === 0) {
    return NextResponse.json({ error: "Anthropic API 키가 유효하지 않습니다." }, { status: 401 });
  }
  if (scoredMatches.length === 0) {
    return NextResponse.json(
      { error: "매칭 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 502 }
    );
  }

  const matches = dedupeByCompany(scoredMatches, MATCH_COUNT);
  return NextResponse.json({ matches });
}

async function scoreCandidate(episode: string, candidate: MatchedQuestion): Promise<FinalMatch | null> {
  const userPrompt = buildMatchUserPrompt(episode, [
    {
      id: candidate.id,
      company_name: candidate.company_name,
      job_title: candidate.job_title,
      label: candidate.label,
      prompt: candidate.prompt,
    },
  ]);

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system: MATCH_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (response.stop_reason === "refusal") return null;

  const text = extractText(response);
  if (!text) return null;

  let llmMatches: LlmMatchResult[];
  try {
    llmMatches = parseLlmMatches(text);
  } catch (err) {
    console.error("match route llm parse error", err, text);
    return null;
  }

  const m = llmMatches[0];
  if (!m || m.id !== candidate.id) return null;

  return {
    id: candidate.id,
    company_name: candidate.company_name,
    job_title: candidate.job_title,
    label: candidate.label,
    prompt: candidate.prompt,
    source_url: candidate.source_url,
    similarity: candidate.similarity,
    job_analysis: m.job_analysis,
    match_score: m.match_score,
    reason: m.reason,
  };
}
