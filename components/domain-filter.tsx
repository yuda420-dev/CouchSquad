"use client";

import { DOMAINS } from "@/lib/coaches/domains";
import { cn } from "@/lib/utils";

interface DomainFilterProps {
  selected: string | null;
  onSelect: (domain: string | null) => void;
}

export function DomainFilter({ selected, onSelect }: DomainFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200",
          selected === null
            ? "bg-ember/[0.08] text-ember border border-ember/15 shadow-sm shadow-ember/10"
            : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        All
      </button>
      {DOMAINS.map((d) => (
        <button
          key={d.id}
          onClick={() => onSelect(d.id === selected ? null : d.id)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200",
            selected === d.id
              ? "bg-ember/[0.08] text-ember border border-ember/15 shadow-sm shadow-ember/10"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <d.icon className="w-3.5 h-3.5" />
          {d.label}
        </button>
      ))}
    </div>
  );
}
