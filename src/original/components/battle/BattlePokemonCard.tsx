import { cn } from "@/original/lib/utils";
import { Badge } from "@/original/components/ui/badge";
import { Progress } from "@/original/components/ui/progress";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { BattlePokemon } from "@/original/lib/battleUtils";
import { StatusState, STATUS_INFO } from "@/original/lib/statusEffects";
import { StatusEffectIcon } from "./StatusEffectIcon";
import { getPokemonSprite } from "@/original/services/pokeApiService";

// Get animated sprite from Pokemon Showdown
const getAnimatedPokemonSprite = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;

interface BattlePokemonCardProps {
  pokemon: BattlePokemon & { status?: StatusState };
  isPlayer: boolean;
  isActive?: boolean;
  showAnimated?: boolean;
  language: "en" | "ar";
  className?: string;
  onDamage?: boolean;
  onAttack?: boolean;
}

export function BattlePokemonCard({
  pokemon,
  isPlayer,
  isActive = true,
  showAnimated = true,
  language,
  className,
  onDamage,
  onAttack,
}: BattlePokemonCardProps) {
  const hpPercent = (pokemon.currentHp / pokemon.maxHp) * 100;

  const getHpColor = () => {
    if (hpPercent > 50) return "bg-green-500";
    if (hpPercent > 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getHpBarBg = () => {
    if (hpPercent > 50) return "bg-green-500/20";
    if (hpPercent > 25) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const statusAnimation = pokemon.status
    ? {
        burn: "animate-status-burn",
        paralysis: "animate-status-paralysis",
        sleep: "animate-status-sleep",
        poison: "animate-status-poison",
        badly_poisoned: "animate-status-poison",
        freeze: "animate-status-freeze",
        confusion: "animate-status-confusion",
        flinch: "",
      }[pokemon.status.effect]
    : "";

  const statusOverlay = pokemon.status
    ? {
        burn: "status-overlay-burn",
        paralysis: "status-overlay-paralysis",
        sleep: "status-overlay-sleep",
        poison: "status-overlay-poison",
        badly_poisoned: "status-overlay-badly_poisoned",
        freeze: "status-overlay-freeze",
        confusion: "status-overlay-confusion",
        flinch: "",
      }[pokemon.status.effect]
    : "";

  return (
    <div
      className={cn(
        "relative p-3 rounded-xl border transition-all duration-300",
        "bg-card/50 backdrop-blur-sm",
        isActive ? "border-primary/50 shadow-lg" : "border-border/50 opacity-70",
        pokemon.isFainted && "opacity-40 grayscale",
        onDamage && "animate-damage-flash",
        onAttack && (isPlayer ? "animate-attack-physical" : "animate-attack-shake"),
        className,
      )}
    >
      {/* Badge */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={isPlayer ? "default" : "secondary"} className="text-[10px]">
          {isPlayer ? (language === "ar" ? "أنت" : "You") : language === "ar" ? "خصم" : "Enemy"}
        </Badge>

        {/* Status Effect */}
        {pokemon.status && (
          <StatusEffectIcon effect={pokemon.status.effect} size="sm" language={language} />
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Pokemon Sprite */}
        <div
          className={cn(
            "relative w-20 h-20 flex-shrink-0",
            !pokemon.isFainted && "animate-pokemon-idle",
            pokemon.isFainted && "animate-faint",
            statusAnimation,
            statusOverlay,
          )}
        >
          <img
            src={showAnimated ? getAnimatedPokemonSprite(pokemon.id) : getPokemonSprite(pokemon.id)}
            alt={language === "ar" ? pokemon.name_ar : pokemon.name_en}
            className={cn(
              "w-full h-full object-contain",
              !isPlayer && "scale-x-[-1]",
              pokemon.status?.effect === "freeze" && "brightness-125 saturate-50",
              pokemon.status?.effect === "sleep" && "opacity-70",
              pokemon.status?.effect === "burn" && "brightness-110 saturate-110",
              pokemon.status?.effect === "poison" && "hue-rotate-15",
              pokemon.status?.effect === "badly_poisoned" && "hue-rotate-30 saturate-150",
            )}
            style={{ imageRendering: showAnimated ? "auto" : "pixelated" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = getPokemonSprite(pokemon.id);
            }}
          />

          {/* Low HP Warning */}
          {hpPercent <= 25 && hpPercent > 0 && (
            <div className="absolute -top-1 -right-1 text-red-500 animate-pulse">⚠️</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3 className="font-bold text-sm truncate mb-1">
            {language === "ar" ? pokemon.name_ar : pokemon.name_en}
          </h3>

          {/* Types */}
          <div className="flex gap-1 mb-2">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} size="sm" />
            ))}
          </div>

          {/* HP Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">HP</span>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  hpPercent <= 25 && "text-red-500",
                  hpPercent <= 50 && hpPercent > 25 && "text-yellow-500",
                )}
              >
                {pokemon.currentHp}/{pokemon.maxHp}
              </span>
            </div>

            <div className={cn("h-2.5 rounded-full overflow-hidden", getHpBarBg())}>
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  getHpColor(),
                  hpPercent <= 25 && "animate-pulse",
                )}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Speed Indicator */}
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
            <span>⚡</span>
            <span>
              {language === "ar" ? "سرعة" : "SPD"}: {pokemon.stats.spe || 50}
            </span>
          </div>
        </div>
      </div>

      {/* Fainted Overlay */}
      {pokemon.isFainted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
          <span className="text-2xl">💀</span>
        </div>
      )}
    </div>
  );
}
