import { cn } from "@/original/lib/utils";
import { BattlePokemon } from "@/original/lib/battleUtils";
import { BattlePokemonCard } from "./BattlePokemonCard";
import { StatusState } from "@/original/lib/statusEffects";

interface BattleArenaProps {
  playerPokemon: BattlePokemon & { status?: StatusState };
  enemyPokemon: BattlePokemon & { status?: StatusState };
  language: "en" | "ar";
  playerDamaged?: boolean;
  enemyDamaged?: boolean;
  playerAttacking?: boolean;
  enemyAttacking?: boolean;
  environmentType?: string;
  className?: string;
}

const ENVIRONMENT_BACKGROUNDS: Record<string, string> = {
  normal: "bg-gradient-to-b from-green-800/30 via-green-700/20 to-green-900/40",
  fire: "bg-gradient-to-b from-orange-800/30 via-red-700/20 to-orange-900/40",
  water: "bg-gradient-to-b from-blue-800/30 via-cyan-700/20 to-blue-900/40",
  grass: "bg-gradient-to-b from-green-700/30 via-lime-600/20 to-green-800/40",
  electric: "bg-gradient-to-b from-yellow-700/30 via-amber-600/20 to-yellow-800/40",
  ice: "bg-gradient-to-b from-cyan-700/30 via-sky-600/20 to-cyan-800/40",
  fighting: "bg-gradient-to-b from-red-800/30 via-orange-700/20 to-red-900/40",
  poison: "bg-gradient-to-b from-purple-800/30 via-violet-700/20 to-purple-900/40",
  ground: "bg-gradient-to-b from-amber-800/30 via-yellow-700/20 to-amber-900/40",
  flying: "bg-gradient-to-b from-indigo-700/30 via-sky-600/20 to-indigo-800/40",
  psychic: "bg-gradient-to-b from-pink-700/30 via-purple-600/20 to-pink-800/40",
  bug: "bg-gradient-to-b from-lime-700/30 via-green-600/20 to-lime-800/40",
  rock: "bg-gradient-to-b from-stone-700/30 via-amber-600/20 to-stone-800/40",
  ghost: "bg-gradient-to-b from-violet-800/30 via-purple-700/20 to-violet-900/40",
  dragon: "bg-gradient-to-b from-indigo-800/30 via-blue-700/20 to-indigo-900/40",
  dark: "bg-gradient-to-b from-gray-800/50 via-slate-700/30 to-gray-900/60",
  steel: "bg-gradient-to-b from-slate-600/30 via-gray-500/20 to-slate-700/40",
  fairy: "bg-gradient-to-b from-pink-600/30 via-rose-500/20 to-pink-700/40",
};

export function BattleArena({
  playerPokemon,
  enemyPokemon,
  language,
  playerDamaged,
  enemyDamaged,
  playerAttacking,
  enemyAttacking,
  environmentType = "normal",
  className,
}: BattleArenaProps) {
  const bgClass =
    ENVIRONMENT_BACKGROUNDS[environmentType.toLowerCase()] || ENVIRONMENT_BACKGROUNDS.normal;

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden",
        bgClass,
        "border border-border/50",
        className,
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, currentColor 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Arena Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />

      {/* Battle Content */}
      <div className="relative p-4 space-y-4">
        {/* Enemy Pokemon (Top) */}
        <div
          className={cn(
            "transition-transform duration-300",
            enemyAttacking && "translate-x-[-10px]",
          )}
        >
          <BattlePokemonCard
            pokemon={enemyPokemon}
            isPlayer={false}
            language={language}
            onDamage={enemyDamaged}
            onAttack={enemyAttacking}
          />
        </div>

        {/* VS Indicator */}
        <div className="flex items-center justify-center">
          <div className="bg-primary/20 backdrop-blur-sm px-4 py-1 rounded-full border border-primary/30">
            <span className="text-primary font-bold text-sm">⚔️ VS</span>
          </div>
        </div>

        {/* Player Pokemon (Bottom) */}
        <div
          className={cn(
            "transition-transform duration-300",
            playerAttacking && "translate-x-[10px]",
          )}
        >
          <BattlePokemonCard
            pokemon={playerPokemon}
            isPlayer={true}
            language={language}
            onDamage={playerDamaged}
            onAttack={playerAttacking}
          />
        </div>
      </div>

      {/* Effect Overlays */}
      {playerAttacking && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/30 rounded-full blur-xl animate-pulse" />
        </div>
      )}

      {enemyAttacking && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 bg-destructive/30 rounded-full blur-xl animate-pulse" />
        </div>
      )}
    </div>
  );
}
