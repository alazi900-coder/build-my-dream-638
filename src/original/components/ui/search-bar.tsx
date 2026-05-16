import { Search, X } from "lucide-react";
import { Input } from "@/original/components/ui/input";
import { Label } from "@/original/components/ui/label";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useId } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: { en: string; ar: string };
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const { t, language } = useLanguage();
  const inputId = useId();
  const placeholderText = t(placeholder?.en || "Search...", placeholder?.ar || "بحث...");

  return (
    <div className="relative">
      <Label htmlFor={inputId} className="sr-only">
        {placeholderText}
      </Label>
      <Search
        className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholderText}
        className="ps-9 pe-9 bg-muted/50 border-border"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={t("Clear search", "مسح البحث")}
          type="button"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
