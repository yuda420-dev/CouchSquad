#!/usr/bin/env npx tsx
/**
 * Updates avatar_url for all 50 coaches in the catalog file and Supabase.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const AVATAR_MAP: Record<string, string> = {
  "c0010000-0000-4000-8000-000000000001": "https://randomuser.me/api/portraits/men/45.jpg",
  "c0010000-0000-4000-8000-000000000002": "https://randomuser.me/api/portraits/women/29.jpg",
  "c0010000-0000-4000-8000-000000000003": "https://randomuser.me/api/portraits/men/22.jpg",
  "c0010000-0000-4000-8000-000000000004": "https://randomuser.me/api/portraits/women/58.jpg",
  "c0010000-0000-4000-8000-000000000005": "https://randomuser.me/api/portraits/women/25.jpg",
  "c0010000-0000-4000-8000-000000000006": "https://randomuser.me/api/portraits/men/32.jpg",
  "c0010000-0000-4000-8000-000000000007": "https://randomuser.me/api/portraits/women/65.jpg",
  "c0010000-0000-4000-8000-000000000008": "https://randomuser.me/api/portraits/men/28.jpg",
  "c0010000-0000-4000-8000-000000000009": "https://randomuser.me/api/portraits/women/61.jpg",
  "c0010000-0000-4000-8000-000000000010": "https://randomuser.me/api/portraits/men/24.jpg",
  "c0010000-0000-4000-8000-000000000011": "https://randomuser.me/api/portraits/women/48.jpg",
  "c0010000-0000-4000-8000-000000000012": "https://randomuser.me/api/portraits/men/70.jpg",
  "c0010000-0000-4000-8000-000000000013": "https://randomuser.me/api/portraits/men/74.jpg",
  "c0010000-0000-4000-8000-000000000014": "https://randomuser.me/api/portraits/women/30.jpg",
  "c0010000-0000-4000-8000-000000000015": "https://randomuser.me/api/portraits/women/78.jpg",
  "c0010000-0000-4000-8000-000000000016": "https://randomuser.me/api/portraits/men/52.jpg",
  "c0010000-0000-4000-8000-000000000017": "https://randomuser.me/api/portraits/women/56.jpg",
  "c0010000-0000-4000-8000-000000000018": "https://randomuser.me/api/portraits/men/72.jpg",
  "c0010000-0000-4000-8000-000000000019": "https://randomuser.me/api/portraits/women/33.jpg",
  "c0010000-0000-4000-8000-000000000020": "https://randomuser.me/api/portraits/men/82.jpg",
  "c0010000-0000-4000-8000-000000000021": "https://randomuser.me/api/portraits/women/21.jpg",
  "c0010000-0000-4000-8000-000000000022": "https://randomuser.me/api/portraits/women/66.jpg",
  "c0010000-0000-4000-8000-000000000023": "https://randomuser.me/api/portraits/men/30.jpg",
  "c0010000-0000-4000-8000-000000000024": "https://randomuser.me/api/portraits/women/50.jpg",
  "c0010000-0000-4000-8000-000000000025": "https://randomuser.me/api/portraits/women/35.jpg",
  "c0010000-0000-4000-8000-000000000026": "https://randomuser.me/api/portraits/men/55.jpg",
  "c0010000-0000-4000-8000-000000000027": "https://randomuser.me/api/portraits/women/27.jpg",
  "c0010000-0000-4000-8000-000000000028": "https://randomuser.me/api/portraits/women/26.jpg",
  "c0010000-0000-4000-8000-000000000029": "https://randomuser.me/api/portraits/men/53.jpg",
  "c0010000-0000-4000-8000-000000000030": "https://randomuser.me/api/portraits/women/44.jpg",
  "c0010000-0000-4000-8000-000000000031": "https://randomuser.me/api/portraits/men/33.jpg",
  "c0010000-0000-4000-8000-000000000032": "https://randomuser.me/api/portraits/women/73.jpg",
  "c0010000-0000-4000-8000-000000000033": "https://randomuser.me/api/portraits/men/57.jpg",
  "c0010000-0000-4000-8000-000000000034": "https://randomuser.me/api/portraits/women/62.jpg",
  "c0010000-0000-4000-8000-000000000035": "https://randomuser.me/api/portraits/men/18.jpg",
  "c0010000-0000-4000-8000-000000000036": "https://randomuser.me/api/portraits/women/38.jpg",
  "c0010000-0000-4000-8000-000000000037": "https://randomuser.me/api/portraits/men/27.jpg",
  "c0010000-0000-4000-8000-000000000038": "https://randomuser.me/api/portraits/men/29.jpg",
  "c0010000-0000-4000-8000-000000000039": "https://randomuser.me/api/portraits/women/23.jpg",
  "c0010000-0000-4000-8000-000000000040": "https://randomuser.me/api/portraits/men/67.jpg",
  "c0010000-0000-4000-8000-000000000041": "https://randomuser.me/api/portraits/women/20.jpg",
  "c0010000-0000-4000-8000-000000000042": "https://randomuser.me/api/portraits/men/49.jpg",
  "c0010000-0000-4000-8000-000000000043": "https://randomuser.me/api/portraits/women/54.jpg",
  "c0010000-0000-4000-8000-000000000044": "https://randomuser.me/api/portraits/men/79.jpg",
  "c0010000-0000-4000-8000-000000000045": "https://randomuser.me/api/portraits/women/69.jpg",
  "c0010000-0000-4000-8000-000000000046": "https://randomuser.me/api/portraits/women/34.jpg",
  "c0010000-0000-4000-8000-000000000047": "https://randomuser.me/api/portraits/men/51.jpg",
  "c0010000-0000-4000-8000-000000000048": "https://randomuser.me/api/portraits/women/28.jpg",
  "c0010000-0000-4000-8000-000000000049": "https://randomuser.me/api/portraits/men/48.jpg",
  "c0010000-0000-4000-8000-000000000050": "https://randomuser.me/api/portraits/women/52.jpg",
};

async function main() {
  // 1. Update catalog.ts — replace avatar_url: null with the actual URL
  const catalogPath = resolve(__dirname, "../lib/coaches/catalog.ts");
  let content = readFileSync(catalogPath, "utf-8");

  for (const [id, url] of Object.entries(AVATAR_MAP)) {
    // Find the pattern: id: "...", then find the next avatar_url: null
    const idPattern = `id: "${id}"`;
    const idx = content.indexOf(idPattern);
    if (idx === -1) {
      console.error(`Could not find coach ${id} in catalog`);
      continue;
    }
    // Find avatar_url: null after this id
    const avatarIdx = content.indexOf("avatar_url: null", idx);
    if (avatarIdx === -1 || avatarIdx - idx > 200) {
      console.error(`Could not find avatar_url for coach ${id}`);
      continue;
    }
    content = content.slice(0, avatarIdx) + `avatar_url: "${url}"` + content.slice(avatarIdx + "avatar_url: null".length);
  }

  writeFileSync(catalogPath, content);
  console.error("Updated catalog.ts with avatar URLs");

  // 2. Update Supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qskbuwuknzmvnzdfrdwa.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.error("Skipping Supabase update — no SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);

  let updated = 0;
  for (const [id, avatarUrl] of Object.entries(AVATAR_MAP)) {
    const { error } = await (supabase.from("coaches") as any)
      .update({ avatar_url: avatarUrl })
      .eq("id", id);
    if (error) {
      console.error(`Error updating ${id}:`, error);
    } else {
      updated++;
    }
  }
  console.error(`Updated ${updated}/50 coaches in Supabase with avatar URLs`);
}

main().catch(console.error);
