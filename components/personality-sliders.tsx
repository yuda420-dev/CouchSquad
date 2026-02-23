"use client";

import { useState } from "react";
import { PERSONALITY_TRAITS, TRAIT_CATEGORIES, type TraitDefinition } from "@/lib/coaches/personality";
import type { PersonalityTraits } from "@/lib/supabase/types";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface PersonalitySlidersProps {
  baseTraits: PersonalityTraits;
  overrides: Partial<PersonalityTraits>;
  onChange: (overrides: Partial<PersonalityTraits>) => void;
  onReset?: () => void;
}

function TraitSlider({
  trait,
  value,
  isOverridden,
  onChange,
}: {
  trait: TraitDefinition;
  value: number;
  isOverridden: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-1.5">
          {trait.label}
          {isOverridden && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ember/15 text-ember">
              custom
            </span>
          )}
        </label>
        <span className="text-xs text-muted-foreground tabular-nums">{value}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm shrink-0 w-6 text-center" title={trait.lowLabel}>
          {trait.lowEmoji}
        </span>
        <Slider
          value={[value]}
          min={0}
          max={100}
          step={5}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
        />
        <span className="text-sm shrink-0 w-6 text-center" title={trait.highLabel}>
          {trait.highEmoji}
        </span>
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground px-9">
        <span>{trait.lowLabel}</span>
        <span>{trait.highLabel}</span>
      </div>
    </div>
  );
}

export function PersonalitySliders({
  baseTraits,
  overrides,
  onChange,
  onReset,
}: PersonalitySlidersProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["communication"]) // Start with first category open
  );

  function handleChange(key: keyof PersonalityTraits, value: number) {
    // If same as base, remove override
    if (value === (baseTraits[key] ?? 50)) {
      const next = { ...overrides };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...overrides, [key]: value });
    }
  }

  function toggleCategory(catId: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  }

  const hasOverrides = Object.keys(overrides).length > 0;

  // Count overrides per category
  function overridesInCategory(catId: string): number {
    const catTraits = PERSONALITY_TRAITS.filter((t) => t.category === catId);
    return catTraits.filter((t) => t.key in overrides).length;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Personality Tuning
        </h3>
        {hasOverrides && onReset && (
          <button
            onClick={onReset}
            className="text-xs text-ember hover:text-ember/80"
          >
            Reset to defaults
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/60 leading-relaxed -mt-1">
        12 sliders across 3 categories. Shape how this coach communicates, teaches, and relates to you.
      </p>

      {TRAIT_CATEGORIES.map((cat) => {
        const catTraits = PERSONALITY_TRAITS.filter((t) => t.category === cat.id);
        const isExpanded = expandedCategories.has(cat.id);
        const overrideCount = overridesInCategory(cat.id);

        return (
          <div key={cat.id} className="rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{cat.emoji}</span>
                <span className="text-sm font-medium">{cat.label}</span>
                <span className="text-[10px] text-muted-foreground/50">
                  {catTraits.length} sliders
                </span>
                {overrideCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ember/15 text-ember">
                    {overrideCount} custom
                  </span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-5 border-t border-border/30 pt-4">
                {catTraits.map((trait) => {
                  const value = overrides[trait.key] ?? baseTraits[trait.key] ?? 50;
                  const isOverridden = trait.key in overrides;

                  return (
                    <TraitSlider
                      key={trait.key}
                      trait={trait}
                      value={value}
                      isOverridden={isOverridden}
                      onChange={(v) => handleChange(trait.key, v)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
