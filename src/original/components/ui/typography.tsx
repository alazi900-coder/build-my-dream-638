import { cn } from "@/original/lib/utils";
import { TYPOGRAPHY } from "@/original/styles/design-tokens";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Page Title - H1
 * Use once per page at the top
 */
export function PageTitle({ children, className }: TypographyProps) {
  return <h1 className={cn(TYPOGRAPHY.pageTitle, className)}>{children}</h1>;
}

/**
 * Section Title - H2
 * Use for major sections within a page
 */
export function SectionTitle({ children, className }: TypographyProps) {
  return <h2 className={cn(TYPOGRAPHY.sectionTitle, className)}>{children}</h2>;
}

/**
 * Subsection Title - H3
 * Use for subsections within a section
 */
export function SubsectionTitle({ children, className }: TypographyProps) {
  return <h3 className={cn(TYPOGRAPHY.subsectionTitle, className)}>{children}</h3>;
}

/**
 * Body Text
 * Standard content text
 */
export function BodyText({ children, className }: TypographyProps) {
  return <p className={cn(TYPOGRAPHY.body, className)}>{children}</p>;
}

/**
 * Muted Text
 * Secondary/less important text
 */
export function MutedText({ children, className }: TypographyProps) {
  return <p className={cn(TYPOGRAPHY.bodyMuted, className)}>{children}</p>;
}

/**
 * Caption
 * Meta information, timestamps, IDs
 */
export function Caption({ children, className }: TypographyProps) {
  return <span className={cn(TYPOGRAPHY.caption, className)}>{children}</span>;
}

/**
 * Micro Text
 * Tiny labels, badges
 */
export function MicroText({ children, className }: TypographyProps) {
  return <span className={cn(TYPOGRAPHY.micro, className)}>{children}</span>;
}
