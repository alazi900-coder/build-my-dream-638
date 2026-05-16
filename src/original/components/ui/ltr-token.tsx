import { ReactNode } from "react";
import { cn } from "@/original/lib/utils";

interface LtrTokenProps {
  children: ReactNode;
  className?: string;
}

/**
 * Forces LTR direction for numbers, IDs, percentages, and technical tokens
 * inside RTL (Arabic) UI to ensure proper rendering.
 *
 * @example
 * <LtrToken>Lv. 50</LtrToken>
 * <LtrToken>#001</LtrToken>
 * <LtrToken>100%</LtrToken>
 * <LtrToken>HP: 255</LtrToken>
 */
export function LtrToken({ children, className }: LtrTokenProps) {
  return (
    <span dir="ltr" className={cn("inline-block", className)}>
      {children}
    </span>
  );
}

/**
 * Formats a number with LTR direction
 * Useful for stats, levels, and percentages
 */
export function LtrNumber({
  value,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number | string;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  return (
    <LtrToken className={className}>
      {prefix}
      {value}
      {suffix}
    </LtrToken>
  );
}

/**
 * Formats a Pokémon ID with proper padding and LTR
 */
export function PokemonId({ id, className }: { id: number; className?: string }) {
  return (
    <LtrToken className={cn("font-mono", className)}>#{id.toString().padStart(3, "0")}</LtrToken>
  );
}

/**
 * Formats a level display with LTR
 */
export function LevelDisplay({ level, className }: { level: number; className?: string }) {
  return <LtrToken className={className}>Lv. {level}</LtrToken>;
}

/**
 * Formats a percentage with LTR
 */
export function PercentDisplay({ value, className }: { value: number; className?: string }) {
  return <LtrToken className={className}>{value}%</LtrToken>;
}
