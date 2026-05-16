import { ReactNode } from "react";
import { cn } from "@/original/lib/utils";
import { Card, CardContent } from "@/original/components/ui/card";
import { Icon } from "@/original/components/ui/Icon";
import { Lightbulb } from "lucide-react";
import { useLanguage } from "@/original/contexts/LanguageContext";

interface QuickSummaryProps {
  /** The main summary text */
  children: ReactNode;
  /** Optional title (defaults to "In Brief") */
  title?: string;
  /** Additional classes */
  className?: string;
}

/**
 * QuickSummary - TL;DR card at top of detail pages
 *
 * Use at the top of detail pages to give users
 * the most important information at a glance.
 */
export function QuickSummary({ children, title, className }: QuickSummaryProps) {
  const { language } = useLanguage();
  const defaultTitle = language === "ar" ? "باختصار" : "In Brief";

  return (
    <Card className={cn("border-primary/30 bg-primary/5", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon icon={Lightbulb} size="header" state="info" className="shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-primary font-medium mb-1">{title || defaultTitle}</p>
            <div className="text-foreground font-medium">{children}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
