import { LucideIcon } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { ICON_SIZES, STATE_COLORS, IconSize, StateColor } from "@/original/styles/design-tokens";

interface IconProps {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /** Semantic size based on context */
  size?: IconSize;
  /** Semantic state color - only use for meaningful states */
  state?: StateColor;
  /** Additional classes */
  className?: string;
  /** Accessibility label */
  "aria-label"?: string;
  /** Hide from screen readers (for decorative icons) */
  "aria-hidden"?: boolean;
}

/**
 * Icon Component - Enforces consistent icon sizing and coloring
 *
 * Usage:
 * - size="header" for page/section headers (20px)
 * - size="content" for cards and content (16px)
 * - size="inline" for badges and inline text (14px)
 * - state="success|warning|error|info" only for semantic meaning
 * - Default color is muted, use state only when conveying information
 */
export function Icon({
  icon: IconComponent,
  size = "content",
  state,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = !ariaLabel,
}: IconProps) {
  return (
    <IconComponent
      className={cn(
        ICON_SIZES[size],
        state ? STATE_COLORS[state] : "text-muted-foreground",
        className,
      )}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
    />
  );
}

// Re-export for convenience
export { ICON_SIZES, STATE_COLORS };
export type { IconSize, StateColor };
