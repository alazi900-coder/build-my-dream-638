import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { PageTitle, MutedText } from "@/original/components/ui/typography";
import { ICON_SIZES } from "@/original/styles/design-tokens";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}

/**
 * Unified page header component for consistent page titles
 * Uses the typography system for proper hierarchy
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className={cn(ICON_SIZES.header, "text-muted-foreground shrink-0")} />}
          <PageTitle className="truncate">{title}</PageTitle>
        </div>
        {children && <div className="shrink-0 flex items-center gap-2">{children}</div>}
      </div>
      {description && <MutedText className="line-clamp-2">{description}</MutedText>}
    </div>
  );
}
