import { ReactNode, useState } from "react";
import { cn } from "@/original/lib/utils";
import { ChevronDown } from "lucide-react";
import { Button } from "@/original/components/ui/button";
import { SectionTitle } from "@/original/components/ui/typography";
import { Icon } from "@/original/components/ui/Icon";
import { LucideIcon } from "lucide-react";
import { SPACING } from "@/original/styles/design-tokens";

interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Icon for the section header */
  icon?: LucideIcon;
  /** Section content */
  children: ReactNode;
  /** Start expanded (default: false) */
  defaultOpen?: boolean;
  /** Additional classes */
  className?: string;
  /** Subtitle or description */
  subtitle?: string;
}

/**
 * CollapsibleSection - Progressive disclosure for advanced content
 *
 * Use for:
 * - Advanced analysis that most users don't need
 * - Long lists that should be hidden by default
 * - Optional information
 */
export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  className,
  subtitle,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between px-4 py-3 h-auto hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          {icon && <Icon icon={icon} size="content" state="info" />}
          <div className="text-start">
            <SectionTitle className="text-sm">{title}</SectionTitle>
            {subtitle && <span className="text-xs text-muted-foreground block">{subtitle}</span>}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </Button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className={cn("px-4 pb-4", SPACING.element)}>{children}</div>
      </div>
    </div>
  );
}
