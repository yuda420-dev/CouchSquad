"use client";

import { SHORTCUTS } from "@/lib/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({
  open,
  onClose,
}: KeyboardShortcutsDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-[440px] max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Keyboard Shortcuts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">g</kbd> then a letter to navigate.
          </p>
        </div>

        <div className="px-5 py-3 overflow-y-auto max-h-[60vh]">
          <div className="space-y-1">
            {SHORTCUTS.map((s) => (
              <div
                key={s.keys}
                className="flex items-center justify-between py-1.5"
              >
                <span className="text-sm text-muted-foreground">
                  {s.description}
                </span>
                <div className="flex items-center gap-1">
                  {s.keys.split(" ").map((key, i) => (
                    <span key={i}>
                      {i > 0 && (
                        <span className="text-[10px] text-muted-foreground/40 mx-0.5">
                          then
                        </span>
                      )}
                      <kbd className="px-2 py-1 bg-secondary border border-border/50 rounded text-[11px] font-mono text-foreground">
                        {key}
                      </kbd>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Press <kbd className="px-1 py-0.5 bg-secondary rounded text-[10px] font-mono">Esc</kbd> to close
          </button>
        </div>
      </div>
    </div>
  );
}
