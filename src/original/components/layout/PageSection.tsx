import { ReactNode } from "react";
import { cn } from "@/original/lib/utils";
import { SPACING } from "@/original/styles/design-tokens";
import { SectionTitle } from "@/original/components/ui/typography";
import { Icon, IconSize } from "@/original/components/ui/Icon";
import { LucideIcon } from "lucide-react";

interface PageSectionProps {
  /** Section title */
  title?: string;
  /** Icon for the section header */
  icon?: LucideIcon;
  /** Section content */
  children: ReactNode;
  /** Additional classes for the container */
  className?: string;
  /** Spacing between child elements */
  spacing?: "section" | "card" | "element" | "tight";
}

/**
 * PageSection - Consistent section layout with optional header
 *
 * Provides:
 * - Consistent spacing between elements
 * - Optional section title with icon
 * - Proper heading hierarchy
 */
export function PageSection({
  title,
  icon,
  children,
  className,
  spacing = "element",
}: PageSectionProps) {
  return (
    <section className={cn(SPACING[spacing], className)}>
      {title && (
        <div className="flex items-center gap-2">
          {icon && <Icon icon={icon} size="header" state="info" />}
          <SectionTitle>{title}</SectionTitle>
        </div>
      )}
      {children}
    </section>
  );
}
