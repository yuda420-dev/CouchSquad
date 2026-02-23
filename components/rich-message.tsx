"use client";

/**
 * Rich Message Renderer
 *
 * Parses assistant messages for structured content blocks and renders them
 * as interactive cards. Coaches can embed structured data in messages using
 * a simple markup format:
 *
 * ```plan
 * title: 5-Day Training Split
 * day1: Push — Bench, OHP, Triceps
 * day2: Pull — Deadlift, Rows, Biceps
 * day3: Rest
 * day4: Legs — Squat, Lunges, Calves
 * day5: Full Body — Compound Lifts
 * ```
 *
 * ```recipe
 * title: Post-Workout Smoothie
 * servings: 1
 * calories: 350
 * protein: 30g
 * - 1 scoop whey protein
 * - 1 banana
 * - 1 cup oat milk
 * - 1 tbsp peanut butter
 * ```
 *
 * ```checklist
 * title: Morning Routine
 * - [ ] Wake up at 6:30
 * - [ ] 10 min meditation
 * - [ ] Cold shower
 * - [x] Drink water
 * ```
 */

import { useState } from "react";
import {
  ClipboardList,
  UtensilsCrossed,
  Calendar,
  CheckSquare,
  Square,
  Copy,
  Check,
} from "lucide-react";

interface StructuredBlock {
  type: "plan" | "recipe" | "checklist";
  title: string;
  content: string[];
  metadata: Record<string, string>;
}

/** Parse a message for structured blocks */
function parseStructuredBlocks(text: string): (string | StructuredBlock)[] {
  const parts: (string | StructuredBlock)[] = [];
  const blockRegex = /```(plan|recipe|checklist)\n([\s\S]*?)```/g;
  let lastIndex = 0;

  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    // Text before the block
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const type = match[1] as StructuredBlock["type"];
    const raw = match[2].trim();
    const lines = raw.split("\n");

    const metadata: Record<string, string> = {};
    const content: string[] = [];
    let title = "";

    for (const line of lines) {
      const kvMatch = line.match(/^(\w+):\s*(.+)/);
      if (kvMatch && !line.startsWith("- ")) {
        if (kvMatch[1] === "title") {
          title = kvMatch[2];
        } else {
          metadata[kvMatch[1]] = kvMatch[2];
        }
      } else {
        content.push(line);
      }
    }

    parts.push({ type, title, content, metadata });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/** Render a message with rich blocks */
export function RichMessage({ content }: { content: string }) {
  const parts = parseStructuredBlocks(content);

  // If no structured blocks, return plain text
  if (parts.length === 1 && typeof parts[0] === "string") {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (typeof part === "string") {
          return (
            <span key={i} className="whitespace-pre-wrap">
              {part}
            </span>
          );
        }

        return <StructuredCard key={i} block={part} />;
      })}
    </div>
  );
}

function StructuredCard({ block }: { block: StructuredBlock }) {
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(
    () => {
      const set = new Set<number>();
      if (block.type === "checklist") {
        block.content.forEach((line, i) => {
          if (line.match(/^- \[x\]/)) set.add(i);
        });
      }
      return set;
    }
  );

  const iconMap = {
    plan: Calendar,
    recipe: UtensilsCrossed,
    checklist: ClipboardList,
  };
  const colorMap = {
    plan: "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30",
    recipe: "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30",
    checklist: "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30",
  };
  const accentMap = {
    plan: "text-blue-600 dark:text-blue-400",
    recipe: "text-green-600 dark:text-green-400",
    checklist: "text-amber-600 dark:text-amber-400",
  };

  const Icon = iconMap[block.type];

  function handleCopy() {
    const text = [
      block.title,
      ...Object.entries(block.metadata).map(([k, v]) => `${k}: ${v}`),
      ...block.content,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function toggleCheck(idx: number) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className={`rounded-xl border p-4 my-2 ${colorMap[block.type]}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accentMap[block.type]}`} />
          <span className="font-semibold text-sm">{block.title || block.type}</span>
          <span className={`text-[10px] uppercase tracking-wider ${accentMap[block.type]}`}>
            {block.type}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1 rounded text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Metadata */}
      {Object.keys(block.metadata).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {Object.entries(block.metadata).map(([key, val]) => (
            <span
              key={key}
              className="text-[10px] px-2 py-0.5 rounded-full bg-background/50 text-muted-foreground"
            >
              {key}: <strong>{val}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="space-y-1">
        {block.content.map((line, i) => {
          if (block.type === "checklist" && line.startsWith("- ")) {
            const isChecked = checkedItems.has(i);
            const text = line.replace(/^- \[.\]\s*/, "");
            return (
              <button
                key={i}
                onClick={() => toggleCheck(i)}
                className="flex items-center gap-2 text-xs w-full text-left py-0.5 group"
              >
                {isChecked ? (
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0" />
                )}
                <span
                  className={
                    isChecked
                      ? "line-through text-muted-foreground/50"
                      : "text-foreground"
                  }
                >
                  {text}
                </span>
              </button>
            );
          }

          if (block.type === "plan" && line.match(/^day\d+:/i)) {
            const [key, ...rest] = line.split(":");
            return (
              <div key={i} className="flex gap-2 text-xs py-0.5">
                <span className="font-medium text-muted-foreground w-10 shrink-0 uppercase">
                  {key.replace("day", "D")}
                </span>
                <span>{rest.join(":").trim()}</span>
              </div>
            );
          }

          if (line.startsWith("- ")) {
            return (
              <p key={i} className="text-xs pl-2 py-0.5">
                <span className="text-muted-foreground mr-1">·</span>
                {line.slice(2)}
              </p>
            );
          }

          return (
            <p key={i} className="text-xs py-0.5">
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
}
