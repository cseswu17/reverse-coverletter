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
const CLAUDE_MODEL = "claude-sonnet-5";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface LlmMatchResult {
  id: string;
  match_score: number;
  reason: string;
}

function isLlmMatchResult(value: unknown): value is LlmMatchResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
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
      match_count: MATCH_COUNT,
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

  const systemPrompt = MATCH_SYSTEM_PROMPT;
  const userPrompt = buildMatchUserPrompt(
    trimmed,
    candidates.map((c) => ({
      id: c.id,
      company_name: c.company_name,
      job_title: c.job_title,
      label: c.label,
      prompt: c.prompt,
    }))
  );

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "요청이 안전 정책에 의해 거부되었습니다." },
        { status: 422 }
      );
    }

    const text = extractText(response);
    if (!text) {
      return NextResponse.json({ error: "모델이 빈 응답을 반환했습니다." }, { status: 502 });
    }

    let llmMatches: LlmMatchResult[];
    try {
      llmMatches = parseLlmMatches(text);
    } catch (err) {
      console.error("match route llm parse error", err, text);
      return NextResponse.json(
        { error: "모델이 올바른 형식으로 응답하지 않았습니다. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    const candidateById = new Map(candidates.map((c) => [c.id, c]));
    const matches: FinalMatch[] = llmMatches
      .map((m) => {
        const candidate = candidateById.get(m.id);
        if (!candidate) return null;
        return {
          id: candidate.id,
          company_name: candidate.company_name,
          job_title: candidate.job_title,
          label: candidate.label,
          prompt: candidate.prompt,
          source_url: candidate.source_url,
          similarity: candidate.similarity,
          match_score: m.match_score,
          reason: m.reason,
        };
      })
      .filter((m): m is FinalMatch => m !== null)
      .sort((a, b) => b.match_score - a.match_score);

    return NextResponse.json({ matches });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Anthropic API 키가 유효하지 않습니다." }, { status: 401 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: err.message || "Anthropic API 오류가 발생했습니다." },
        { status: err.status ?? 500 }
      );
    }
    console.error("match route llm step error", err);
    return NextResponse.json({ error: "알 수 없는 오류가 발생했습니다." }, { status: 500 });
  }
}
