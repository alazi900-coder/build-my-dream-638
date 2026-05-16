import { cn } from "@/original/lib/utils";
import { getTypeColor, getTypeTextColor } from "@/original/lib/typeChart";
import { getLocalizedType } from "@/original/lib/localization";
import { useLanguage } from "@/original/contexts/LanguageContext";

interface TypeBadgeProps {
  type: string;
  size?: "sm" | "md";
  className?: string;
}

export function TypeBadge({ type, size = "md", className }: TypeBadgeProps) {
  const { language } = useLanguage();
  const localizedType = getLocalizedType(type, language);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-full",
        getTypeColor(type),
        getTypeTextColor(type),
        // Touch-friendly sizes (min 44px height for Android)
        size === "sm"
          ? "px-2.5 py-1 text-[11px] min-h-[28px]"
          : "px-3.5 py-1.5 text-xs min-h-[32px]",
        className,
      )}
    >
      {localizedType}
    </span>
  );
}
