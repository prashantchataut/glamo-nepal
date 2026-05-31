"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value: controlledValue,
  onSearch,
  placeholder = "Search...",
  debounceMs = 300,
  className = "",
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue ?? "");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = useCallback(
    (newValue: string) => {
      setInternalValue(newValue);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => {
        onSearch(newValue);
      }, debounceMs);
      setDebounceTimer(timer);
    },
    [onSearch, debounceMs, debounceTimer]
  );

  const handleClear = useCallback(() => {
    setInternalValue("");
    if (debounceTimer) clearTimeout(debounceTimer);
    onSearch("");
  }, [onSearch, debounceTimer]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-textMuted" size={16} />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl border border-brand-border bg-brand-bgLight py-3 pl-10 pr-10 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
      />
      {internalValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textMuted hover:text-brand-textPrimary"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}