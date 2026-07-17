import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SeedItem {
  company_name: string;
  job_title: string;
  label: string;
  prompt: string;
  source_url: string;
  application_deadline?: string; // "YYYY-MM-DD", 없으면 상시/미확인
}

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const items: SeedItem[] = JSON.parse(readFileSync(join(__dirname, "seed-data.json"), "utf-8"));

  for (const item of items) {
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${item.label}\n${item.prompt}`,
    });
    const embedding = embeddingRes.data[0].embedding;

    // company_name + job_title + prompt가 같으면 새로 넣지 않고 갱신만 함 —
    // seed-data.json에 계속 추가해가며 언제든 다시 실행해도 중복이 안 쌓임.
    const { error } = await supabase.from("questions").upsert(
      {
        company_name: item.company_name,
        job_title: item.job_title,
        label: item.label,
        prompt: item.prompt,
        source_url: item.source_url,
        application_deadline: item.application_deadline ?? null,
        embedding,
      },
      { onConflict: "company_name,job_title,prompt" }
    );

    if (error) {
      console.error(`✗ ${item.company_name} - ${item.label}:`, error.message);
    } else {
      console.log(`✓ ${item.company_name} - ${item.label}`);
    }
  }
}

main();
