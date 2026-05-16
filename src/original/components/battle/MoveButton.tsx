import { cn } from "@/original/lib/utils";
import { BattleMove, getTypeEffectiveness } from "@/original/lib/battleUtils";
import { getLocalizedType } from "@/original/lib/localization";

interface MoveButtonProps {
  move: BattleMove;
  defenderTypes: string[];
  disabled?: boolean;
  language: "en" | "ar";
  onSelect: (move: BattleMove) => void;
  currentPP?: number;
  maxPP?: number;
}

const TYPE_COLORS: Record<string, string> = {
  normal: "bg-gray-400 hover:bg-gray-500",
  fire: "bg-orange-500 hover:bg-orange-600",
  water: "bg-blue-500 hover:bg-blue-600",
  electric: "bg-yellow-400 hover:bg-yellow-500",
  grass: "bg-green-500 hover:bg-green-600",
  ice: "bg-cyan-400 hover:bg-cyan-500",
  fighting: "bg-red-600 hover:bg-red-700",
  poison: "bg-purple-500 hover:bg-purple-600",
  ground: "bg-amber-600 hover:bg-amber-700",
  flying: "bg-indigo-400 hover:bg-indigo-500",
  psychic: "bg-pink-500 hover:bg-pink-600",
  bug: "bg-lime-500 hover:bg-lime-600",
  rock: "bg-stone-500 hover:bg-stone-600",
  ghost: "bg-violet-600 hover:bg-violet-700",
  dragon: "bg-indigo-600 hover:bg-indigo-700",
  dark: "bg-gray-700 hover:bg-gray-800",
  steel: "bg-slate-400 hover:bg-slate-500",
  fairy: "bg-pink-400 hover:bg-pink-500",
};

export function MoveButton({
  move,
  defenderTypes,
  disabled = false,
  language,
  onSelect,
  currentPP,
  maxPP,
}: MoveButtonProps) {
  const effectiveness = getTypeEffectiveness(move.type, defenderTypes);
  const typeColor = TYPE_COLORS[move.type.toLowerCase()] || TYPE_COLORS.normal;

  const pp = currentPP ?? move.pp;
  const ppMax = maxPP ?? move.pp;
  const ppPercent = (pp / ppMax) * 100;

  const isOutOfPP = pp <= 0;
  const isPowerful = (move.power || 0) >= 100;

  const getEffectivenessIndicator = () => {
    if (effectiveness >= 2) {
      return {
        icon: "↑↑",
        color: "text-green-300",
        label: language === "ar" ? "فعال جداً" : "Super Effective",
      };
    }
    if (effectiveness > 1 && effectiveness < 2) {
      return {
        icon: "↑",
        color: "text-green-200",
        label: language === "ar" ? "فعال" : "Effective",
      };
    }
    if (effectiveness < 1 && effectiveness > 0) {
      return {
        icon: "↓",
        color: "text-red-300",
        label: language === "ar" ? "ضعيف" : "Not Effective",
      };
    }
    if (effectiveness === 0) {
      return {
        icon: "✕",
        color: "text-gray-400",
        label: language === "ar" ? "لا يؤثر" : "No Effect",
      };
    }
    return null;
  };

  const effIndicator = getEffectivenessIndicator();

  return (
    <button
      onClick={() => onSelect(move)}
      disabled={disabled || isOutOfPP}
      className={cn(
        "relative w-full p-3 rounded-lg text-white transition-all duration-200",
        "border-2 border-white/20",
        "active:scale-95",
        typeColor,
        isPowerful && "animate-move-glow",
        disabled && "opacity-50 cursor-not-allowed",
        isOutOfPP && "grayscale opacity-40 cursor-not-allowed",
      )}
    >
      {/* Move Name */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm truncate">
          {language === "ar" ? move.name_ar : move.name_en}
        </span>
        {effIndicator && (
          <span className={cn("text-lg font-bold", effIndicator.color)} title={effIndicator.label}>
            {effIndicator.icon}
          </span>
        )}
      </div>

      {/* Move Stats */}
      <div className="flex items-center justify-between text-xs opacity-90">
        <span className="flex items-center gap-1">
          {move.category === "physical" ? "👊" : move.category === "special" ? "✨" : "📊"}
          {move.power ? `${move.power}` : "-"}
        </span>

        <span className="uppercase text-[10px] bg-black/20 px-1.5 py-0.5 rounded">
          {getLocalizedType(move.type, language)}
        </span>

        <span
          className={cn(
            "font-mono",
            ppPercent <= 25 && "text-red-300",
            ppPercent <= 50 && ppPercent > 25 && "text-yellow-300",
          )}
        >
          PP {pp}/{ppMax}
        </span>
      </div>

      {/* PP Bar */}
      <div className="mt-1.5 h-1 bg-black/30 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            ppPercent > 50 && "bg-green-400",
            ppPercent <= 50 && ppPercent > 25 && "bg-yellow-400",
            ppPercent <= 25 && "bg-red-400",
          )}
          style={{ width: `${ppPercent}%` }}
        />
      </div>

      {/* Super Effective Glow */}
      {effectiveness >= 2 && !disabled && (
        <div className="absolute inset-0 rounded-lg bg-green-400/20 animate-pulse pointer-events-none" />
      )}
    </button>
  );
}
