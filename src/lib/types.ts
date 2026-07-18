export interface ApiErrorBody {
  error: string;
}

export interface MatchRequestBody {
  episode: string;
}

export interface MatchedQuestion {
  id: string;
  company_name: string;
  job_title: string;
  label: string;
  prompt: string;
  source_url: string | null;
  similarity: number;
}

export interface FinalMatch {
  id: string;
  company_name: string;
  job_title: string;
  label: string;
  prompt: string;
  source_url: string | null;
  similarity: number;
  job_analysis: string;
  match_score: number;
  reason: string;
}

export interface MatchResponseBody {
  matches: FinalMatch[];
}
