#!/usr/bin/env npx tsx
/**
 * Generates SQL to seed the 50 coaches from the catalog into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed-coaches.ts > supabase/migrations/004_seed_coaches.sql
 *   Then run the SQL in Supabase SQL Editor.
 *
 * Or if SUPABASE_SERVICE_ROLE_KEY is set:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/seed-coaches.ts --direct
 */

// We need to handle the path alias — import relatively
import { resolve } from "path";

// Dynamic import to handle the path alias
const catalogPath = resolve(__dirname, "../lib/coaches/catalog.ts");

async function main() {
  // Use dynamic import with tsx
  const { COACHES } = await import("../lib/coaches/catalog");

  const directMode = process.argv.includes("--direct");

  if (directMode) {
    // Direct Supabase insert using service role key
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qskbuwuknzmvnzdfrdwa.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
      console.error("Error: SUPABASE_SERVICE_ROLE_KEY env var required for --direct mode");
      process.exit(1);
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);

    // Upsert in batches of 10
    const batch = 10;
    let inserted = 0;
    for (let i = 0; i < COACHES.length; i += batch) {
      const chunk = COACHES.slice(i, i + batch).map((c: any) => ({
        id: c.id,
        name: c.name,
        age: c.age,
        domain: c.domain,
        sub_domain: c.sub_domain,
        avatar_url: c.avatar_url,
        tagline: c.tagline,
        backstory: c.backstory,
        philosophy: c.philosophy,
        training_background: c.training_background,
        coaching_style: c.coaching_style,
        specialties: c.specialties,
        catchphrase: c.catchphrase,
        default_personality: c.default_personality,
        system_prompt_template: c.system_prompt_template,
        ai_provider: c.ai_provider,
        ai_model: c.ai_model,
        accent_color: c.accent_color,
        sample_messages: c.sample_messages,
        popularity_score: 0,
      }));

      const { error } = await (supabase.from("coaches") as any).upsert(chunk, { onConflict: "id" });
      if (error) {
        console.error(`Error inserting batch ${i / batch + 1}:`, error);
        process.exit(1);
      }
      inserted += chunk.length;
      console.error(`Inserted ${inserted}/${COACHES.length} coaches...`);
    }
    console.error(`Done! ${inserted} coaches seeded.`);
    return;
  }

  // SQL generation mode
  const lines: string[] = [];
  lines.push("-- Auto-generated coach seed data from lib/coaches/catalog.ts");
  lines.push("-- Run this in Supabase SQL Editor");
  lines.push("");
  lines.push("INSERT INTO coaches (id, name, age, domain, sub_domain, avatar_url, tagline, backstory, philosophy, training_background, coaching_style, specialties, catchphrase, default_personality, system_prompt_template, ai_provider, ai_model, accent_color, sample_messages, popularity_score)");
  lines.push("VALUES");

  const values = COACHES.map((c: any, i: number) => {
    const esc = (s: string | null) => s === null ? "NULL" : `'${s.replace(/'/g, "''")}'`;
    const arr = (a: string[] | null) => a === null ? "NULL" : `ARRAY[${a.map((s) => `'${s.replace(/'/g, "''")}'`).join(",")}]::TEXT[]`;
    const json = (o: any) => o === null ? "NULL" : `'${JSON.stringify(o).replace(/'/g, "''")}'::JSONB`;

    return `(
  '${c.id}',
  ${esc(c.name)},
  ${c.age === null ? "NULL" : c.age},
  ${esc(c.domain)},
  ${esc(c.sub_domain)},
  ${esc(c.avatar_url)},
  ${esc(c.tagline)},
  ${esc(c.backstory)},
  ${esc(c.philosophy)},
  ${esc(c.training_background)},
  ${esc(c.coaching_style)},
  ${arr(c.specialties)},
  ${esc(c.catchphrase)},
  ${json(c.default_personality)},
  ${esc(c.system_prompt_template)},
  ${esc(c.ai_provider)},
  ${esc(c.ai_model)},
  ${esc(c.accent_color)},
  ${json(c.sample_messages)},
  0
)${i < COACHES.length - 1 ? "," : ""}`;
  });

  lines.push(values.join("\n"));
  lines.push("ON CONFLICT (id) DO UPDATE SET");
  lines.push("  name = EXCLUDED.name,");
  lines.push("  age = EXCLUDED.age,");
  lines.push("  domain = EXCLUDED.domain,");
  lines.push("  sub_domain = EXCLUDED.sub_domain,");
  lines.push("  avatar_url = EXCLUDED.avatar_url,");
  lines.push("  tagline = EXCLUDED.tagline,");
  lines.push("  backstory = EXCLUDED.backstory,");
  lines.push("  philosophy = EXCLUDED.philosophy,");
  lines.push("  training_background = EXCLUDED.training_background,");
  lines.push("  coaching_style = EXCLUDED.coaching_style,");
  lines.push("  specialties = EXCLUDED.specialties,");
  lines.push("  catchphrase = EXCLUDED.catchphrase,");
  lines.push("  default_personality = EXCLUDED.default_personality,");
  lines.push("  system_prompt_template = EXCLUDED.system_prompt_template,");
  lines.push("  ai_provider = EXCLUDED.ai_provider,");
  lines.push("  ai_model = EXCLUDED.ai_model,");
  lines.push("  accent_color = EXCLUDED.accent_color,");
  lines.push("  sample_messages = EXCLUDED.sample_messages;");
  lines.push("");

  console.log(lines.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
