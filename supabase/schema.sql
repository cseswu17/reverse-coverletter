-- MVP: "개발자 탑 10 기업 공고 30개"만 다루는 초간단 스키마.
-- companies 테이블 없이 questions 하나로 통합 (회사명은 text 컬럼으로 직접 보관).

create extension if not exists vector;

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,   -- 예: "네이버", "카카오"
  job_title text not null,      -- 예: "백엔드 개발자"
  label text not null,          -- 예: "지원동기"
  prompt text not null,         -- 실제 문항 원문
  source_url text,              -- 실제 채용 공고 URL ("바로 지원하기" 버튼용)
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

-- 30개 row 규모에서는 별도 인덱스 없이 exact search로 충분히 빠름 (수천 row까지 OK).

create or replace function match_questions(
  query_embedding vector(1536),
  match_count int default 3
)
returns table (
  id uuid,
  company_name text,
  job_title text,
  label text,
  prompt text,
  source_url text,
  similarity float
)
language sql stable
as $$
  select
    q.id,
    q.company_name,
    q.job_title,
    q.label,
    q.prompt,
    q.source_url,
    1 - (q.embedding <=> query_embedding) as similarity
  from questions q
  order by q.embedding <=> query_embedding
  limit match_count;
$$;
