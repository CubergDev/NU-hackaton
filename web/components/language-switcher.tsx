"use client";

import { useI18n } from "../dictionaries/i18n";
import { cn } from "../lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div className={cn("flex justify-center gap-1.5", className)}>
      {(["ru", "en", "kz"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200",
            lang === l
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/5"
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
