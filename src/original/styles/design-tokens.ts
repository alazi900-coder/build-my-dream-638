/**
 * Design Tokens - Centralized design system constants
 *
 * These tokens define the visual language of the app.
 * Use these instead of hardcoded values for consistency.
 *
 * UI GUARDRAILS:
 * - Type colors allowed ONLY in chips/badges/small indicators (2-4px borders)
 * - NO full-page backgrounds by Pokemon type
 * - All page backgrounds must be neutral (card/background tokens)
 */

// ============================================================
// SPACING SCALE - Consistent rhythm
// ============================================================
export const SPACING = {
  /** Micro spacing - 4px */
  xs: "gap-1",
  /** Small spacing - 8px */
  sm: "gap-2",
  /** Base spacing - 12px */
  md: "gap-3",
  /** Medium spacing - 16px */
  lg: "gap-4",
  /** Large spacing - 24px */
  xl: "gap-6",
  /** Extra large - 32px */
  "2xl": "gap-8",

  /** Section vertical spacing */
  section: "space-y-6",
  /** Card internal spacing */
  card: "space-y-4",
  /** Element spacing */
  element: "space-y-3",
  /** Tight grouping */
  tight: "space-y-2",
} as const;

// ============================================================
// RADIUS SCALE - Border radius levels
// ============================================================
export const RADIUS = {
  /** None */
  none: "rounded-none",
  /** Small - chips/badges */
  sm: "rounded-sm",
  /** Base - buttons/inputs */
  md: "rounded-md",
  /** Medium - cards */
  lg: "rounded-lg",
  /** Large - modals/panels */
  xl: "rounded-xl",
  /** Extra large - hero sections */
  "2xl": "rounded-2xl",
  /** Full circle */
  full: "rounded-full",
} as const;

// ============================================================
// SHADOW LEVELS - Elevation
// ============================================================
export const SHADOW = {
  /** No shadow */
  none: "shadow-none",
  /** Subtle - hover states */
  sm: "shadow-sm",
  /** Base - cards */
  md: "shadow-md",
  /** Elevated - modals/popovers */
  lg: "shadow-lg",
  /** High - focus states */
  xl: "shadow-xl",
} as const;

// ============================================================
// TYPOGRAPHY SCALE - Clear hierarchy
// ============================================================
export const TYPOGRAPHY = {
  /** Page titles - H1 (20px) */
  pageTitle: "text-xl font-bold text-foreground",
  /** Section titles - H2 (16px) */
  sectionTitle: "text-base font-semibold text-foreground",
  /** Subsection titles - H3 (14px) */
  subsectionTitle: "text-sm font-medium text-foreground",
  /** Body text (14px) */
  body: "text-sm text-foreground",
  /** Muted body (14px) */
  bodyMuted: "text-sm text-muted-foreground",
  /** Captions/meta (12px) */
  caption: "text-xs text-muted-foreground",
  /** Tiny labels (10px) */
  micro: "text-[10px] text-muted-foreground",
} as const;

// ============================================================
// ICON SIZES - Semantic sizing
// ============================================================
export const ICON_SIZES = {
  /** Page/section headers - 20px */
  header: "w-5 h-5",
  /** Content/cards - 16px */
  content: "w-4 h-4",
  /** Inline/badges - 14px */
  inline: "w-3.5 h-3.5",
  /** Tiny indicators - 12px */
  micro: "w-3 h-3",
} as const;

// ============================================================
// CARD PADDING - Consistent internal spacing
// ============================================================
export const CARD_PADDING = {
  /** Standard card padding */
  default: "p-4",
  /** Compact card padding */
  compact: "p-3",
  /** Large card padding */
  large: "p-5",
} as const;

// ============================================================
// STATE COLORS - Semantic colors for states only
// Using design system tokens (chart palette)
// ============================================================
export const STATE_COLORS = {
  success: "text-chart-4", // Green from chart palette
  warning: "text-accent", // Gold/amber accent
  error: "text-destructive",
  info: "text-primary",
  neutral: "text-muted-foreground",
} as const;

export const STATE_BG_COLORS = {
  success: "bg-chart-4/10",
  warning: "bg-accent/10",
  error: "bg-destructive/10",
  info: "bg-primary/10",
  neutral: "bg-muted",
} as const;

// ============================================================
// CATEGORY COLORS - Content categorization (moves, items, etc.)
// ============================================================
export const CATEGORY_COLORS = {
  // Move categories
  physical: "bg-destructive/20 text-destructive border-destructive/30",
  special: "bg-secondary/20 text-secondary border-secondary/30",
  status: "bg-muted text-muted-foreground border-border",

  // General categories using chart palette
  primary: "bg-primary/20 text-primary border-primary/30",
  secondary: "bg-secondary/20 text-secondary border-secondary/30",
  accent: "bg-accent/20 text-accent border-accent/30",
  chart1: "bg-chart-1/20 text-chart-1 border-chart-1/30",
  chart2: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  chart3: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  chart4: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  chart5: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  muted: "bg-muted text-muted-foreground border-border",
} as const;

// ============================================================
// LOCATION CATEGORY COLORS
// ============================================================
export const LOCATION_CATEGORY_COLORS = {
  city: "bg-secondary/20 text-secondary border-secondary/30",
  route: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  cave: "bg-muted text-muted-foreground border-border",
  forest: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  water: "bg-secondary/20 text-secondary border-secondary/30",
  mountain: "bg-muted text-muted-foreground border-border",
  special: "bg-primary/20 text-primary border-primary/30",
  gym: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  default: "bg-muted text-muted-foreground border-border",
} as const;

// ============================================================
// NPC CATEGORY COLORS
// ============================================================
export const NPC_CATEGORY_COLORS = {
  gym_leader: "bg-accent/20 text-accent border-accent/30",
  champion: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  rival: "bg-secondary/20 text-secondary border-secondary/30",
  professor: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  villain: "bg-primary/20 text-primary border-primary/30",
  important: "bg-muted text-muted-foreground border-border",
} as const;

// ============================================================
// UI GUARDRAILS - Validation helpers
// ============================================================

/**
 * UI GUARDRAIL: Type colors are ONLY allowed in these contexts
 * Enforced by code review - never use type colors for:
 * - Full page backgrounds
 * - Full card backgrounds
 * - Large hero sections
 * - Large gradients
 */
export const TYPE_COLOR_ALLOWED_CONTEXTS = [
  "type-badge", // Small type chips/badges
  "type-indicator", // 2-4px border indicators
  "type-icon", // Small type icons
] as const;

/**
 * Surface colors - USE THESE for backgrounds
 * Never use Pokemon type colors for backgrounds
 */
export const SURFACE_COLORS = {
  page: "bg-background",
  card: "bg-card",
  elevated: "bg-popover",
  muted: "bg-muted",
  subtle: "bg-muted/50",
} as const;

// ============================================================
// TYPE EXPORTS
// ============================================================
export type IconSize = keyof typeof ICON_SIZES;
export type StateColor = keyof typeof STATE_COLORS;
export type CategoryColor = keyof typeof CATEGORY_COLORS;
export type LocationCategoryColor = keyof typeof LOCATION_CATEGORY_COLORS;
export type NPCCategoryColor = keyof typeof NPC_CATEGORY_COLORS;
export type SurfaceColor = keyof typeof SURFACE_COLORS;
export type RadiusSize = keyof typeof RADIUS;
export type ShadowLevel = keyof typeof SHADOW;
