import { ReactNode } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { AlertCircle, Inbox, WifiOff, Search, Star, Users, Package, Swords } from "lucide-react";
import { Button } from "@/original/components/ui/button";
import { Icon } from "@/original/components/ui/Icon";
import { LucideIcon } from "lucide-react";
import { cn } from "@/original/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline";
}

interface EmptyStateProps {
  /** Type of empty state */
  type?: "empty" | "error" | "no-results" | "offline" | "no-team" | "no-favorites" | "custom";
  /** Override the default message */
  message?: string;
  /** Friendly description explaining the empty state */
  description?: string;
  /** Suggestion for what to do next */
  suggestion?: string;
  /** Action button */
  action?: EmptyStateAction;
  /** Custom icon */
  icon?: LucideIcon;
  /** Additional classes */
  className?: string;
}

// Icons for each type
const typeIcons: Record<string, LucideIcon> = {
  empty: Inbox,
  error: AlertCircle,
  "no-results": Search,
  offline: WifiOff,
  "no-team": Users,
  "no-favorites": Star,
  custom: Package,
};

/**
 * EmptyState - Friendly empty states with context and actions
 *
 * Replace dead ends with helpful guidance:
 * - Explain why the state is empty
 * - Suggest what to do next
 * - Provide action buttons when relevant
 */
export function EmptyState({
  type = "empty",
  message,
  description,
  suggestion,
  action,
  icon,
  className,
}: EmptyStateProps) {
  const { tr, language } = useLanguage();
  const isAr = language === "ar";

  // Default messages with friendly, coach-like tone
  const defaultMessages: Record<string, { title: string; desc: string; suggest: string }> = {
    empty: {
      title: isAr ? "لا توجد بيانات بعد" : "Nothing here yet",
      desc: isAr ? "هذا المكان فارغ حالياً" : "This area is currently empty",
      suggest: isAr ? "جرّب تحميل البيانات من الإعدادات" : "Try downloading data from Settings",
    },
    error: {
      title: isAr ? "حدث خطأ ما" : "Something went wrong",
      desc: isAr ? "لا تقلق، يمكنك المحاولة مرة أخرى" : "Don't worry, you can try again",
      suggest: isAr
        ? "حاول تحديث الصفحة أو تحقق من اتصالك"
        : "Try refreshing or check your connection",
    },
    "no-results": {
      title: isAr ? "لم يتم العثور على نتائج" : "No results found",
      desc: isAr ? "جرّب تغيير كلمات البحث" : "Try different search terms",
      suggest: isAr ? "أو قم بإزالة بعض الفلاتر" : "Or remove some filters",
    },
    offline: {
      title: isAr ? "أنت غير متصل" : "You're offline",
      desc: isAr ? "بعض الميزات قد لا تعمل" : "Some features may not work",
      suggest: isAr
        ? "حمّل حزمة البيانات للاستخدام بدون إنترنت"
        : "Download the offline pack to use without internet",
    },
    "no-team": {
      title: isAr ? "فريقك فارغ" : "Your team is empty",
      desc: isAr ? "ابدأ ببناء فريق أحلامك!" : "Start building your dream team!",
      suggest: isAr ? 'اضغط على "إضافة" لاختيار بوكيمون' : 'Tap "Add" to choose a Pokémon',
    },
    "no-favorites": {
      title: isAr ? "لا توجد مفضلات" : "No favorites yet",
      desc: isAr ? "احفظ البوكيمون المفضل لديك هنا" : "Save your favorite Pokémon here",
      suggest: isAr ? "اضغط على النجمة لإضافة مفضلة" : "Tap the star to add favorites",
    },
    custom: {
      title: isAr ? "لا توجد بيانات" : "No data",
      desc: "",
      suggest: "",
    },
  };

  const defaults = defaultMessages[type] || defaultMessages.empty;
  const IconComponent = icon || typeIcons[type] || Inbox;

  return (
    <div
      className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4",
          type === "error" ? "bg-destructive/10" : "bg-muted",
        )}
      >
        <IconComponent
          className={cn("w-8 h-8", type === "error" ? "text-destructive" : "text-muted-foreground")}
        />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-foreground mb-1">{message || defaults.title}</h3>

      {/* Description */}
      {(description || defaults.desc) && (
        <p className="text-sm text-muted-foreground mb-2 max-w-xs">
          {description || defaults.desc}
        </p>
      )}

      {/* Suggestion */}
      {(suggestion || defaults.suggest) && (
        <p className="text-xs text-muted-foreground/70 mb-4 max-w-xs">
          {suggestion || defaults.suggest}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <Button variant={action.variant || "default"} size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
