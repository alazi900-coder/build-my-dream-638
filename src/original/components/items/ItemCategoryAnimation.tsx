import { cn } from "@/original/lib/utils";
import { useAnimationSettings } from "@/original/hooks/useAnimationSettings";

type ItemCategory =
  | "healing"
  | "medicine"
  | "revival"
  | "status-cures"
  | "pp-recovery"
  | "evolution"
  | "standard-balls"
  | "special-balls"
  | "apricorn-balls"
  | "berries"
  | "held-items"
  | "type-enhancement"
  | "species-specific"
  | "stat-boosts"
  | "all-machines"
  | "vitamins"
  | "plot-advancement";

interface ItemCategoryAnimationProps {
  category: string;
  className?: string;
}

interface AnimationProps {
  particleCounts: { small: number; medium: number; large: number };
  reduced: boolean;
}

// Berry animation - pulsing with stat arrow
function BerryAnimation({ particleCounts, reduced }: AnimationProps) {
  if (reduced) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-green-600/20 to-lime-500/30" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-green-600/20 to-lime-500/30 animate-pulse" />

      {/* Floating particles */}
      {[...Array(particleCounts.medium)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-emerald-400/60"
          style={{
            left: `${20 + i * (60 / particleCounts.medium)}%`,
            animation: `float-up ${2 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}

      {/* HP low pulse indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-full">
          <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full animate-hp-pulse"
              style={{ width: "20%" }}
            />
          </div>
          <span className="text-xs text-muted-foreground">HP</span>
        </div>
      </div>

      {/* Stat arrow */}
      <div className="absolute top-1/4 right-1/4 animate-stat-up">
        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <span className="text-2xl">↑</span>
          <span className="text-sm">ATK</span>
        </div>
      </div>
    </div>
  );
}

// Healing animation - HP bar filling
function HealingAnimation({ particleCounts, reduced }: AnimationProps) {
  if (reduced) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 via-rose-400/20 to-red-400/30" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Pink healing glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 via-rose-400/20 to-red-400/30" />

      {/* Sparkle particles */}
      {[...Array(particleCounts.large)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-sparkle"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
            animationDelay: `${i * 0.15}s`,
          }}
        >
          <span className="text-pink-400 text-lg">✦</span>
        </div>
      ))}

      {/* HP bar filling animation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-full">
          <div className="w-32 h-4 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-hp-fill" />
          </div>
          <span className="text-xs text-emerald-400 font-bold">+HP</span>
        </div>
      </div>

      {/* Healing cross */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 animate-pulse">
        <div className="text-4xl text-pink-400">✚</div>
      </div>
    </div>
  );
}

// Evolution stone animation - light burst + silhouette
function EvolutionAnimation({ particleCounts, reduced }: AnimationProps) {
  const ringCount = Math.max(2, Math.floor(particleCounts.small / 1.5));

  if (reduced) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/40 via-purple-500/30 to-indigo-600/40" />
        <div className="absolute w-24 h-24 bg-white/30 rounded-full blur-xl" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Violet/purple gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/40 via-purple-500/30 to-indigo-600/40" />

      {/* Light burst rings */}
      {[...Array(ringCount)].map((_, i) => (
        <div
          key={i}
          className="absolute inset-0 flex items-center justify-center"
          style={{ animationDelay: `${i * 0.4}s` }}
        >
          <div
            className="w-20 h-20 rounded-full border-2 border-violet-400/60 animate-ring-expand"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
        </div>
      ))}

      {/* Central glow */}
      <div className="absolute w-24 h-24 bg-white/30 rounded-full blur-xl animate-pulse" />

      {/* Pokemon silhouette effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-violet-300/40 rounded-full blur-md animate-silhouette" />
      </div>

      {/* Sparkles */}
      {[...Array(particleCounts.medium)].map((_, i) => (
        <div
          key={i}
          className="absolute text-violet-300 animate-twinkle"
          style={{
            left: `${15 + i * (70 / particleCounts.medium)}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.2}s`,
          }}
        >
          ✧
        </div>
      ))}
    </div>
  );
}

// Held item animation - stat icon pulse
function HeldItemAnimation({ reduced }: AnimationProps) {
  if (reduced) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-sky-500/30" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Blue held item glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-sky-500/30" />

      {/* Floating stat icons */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-4">
          {["ATK", "DEF", "SPD", "SPA", "SPD", "HP"].map((stat, i) => (
            <div
              key={i}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 backdrop-blur-sm animate-stat-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <span className="text-xs font-bold text-blue-300">{stat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Item glow effect */}
      <div className="absolute w-16 h-16 bg-blue-400/30 rounded-full blur-xl animate-pulse" />
    </div>
  );
}

// Pokeball animation - shake + sparkle
function BallAnimation({ particleCounts, reduced }: AnimationProps) {
  if (reduced) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 via-white/10 to-red-600/30" />
        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-red-500 to-white border-4 border-foreground/20 relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-foreground/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-4 border-foreground/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Red/white gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 via-white/10 to-red-600/30" />

      {/* Shake effect */}
      <div className="animate-ball-shake">
        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-red-500 to-white border-4 border-foreground/20 relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-foreground/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-4 border-foreground/30" />
        </div>
      </div>

      {/* Sparkles on capture */}
      {[...Array(particleCounts.small)].map((_, i) => (
        <div
          key={i}
          className="absolute text-yellow-400 text-xl animate-capture-sparkle"
          style={{
            left: `${30 + i * (40 / particleCounts.small)}%`,
            top: `${40 + (i % 2) * 20}%`,
            animationDelay: `${1.5 + i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// Type enhancement animation
function TypeBoostAnimation({ reduced }: AnimationProps) {
  if (reduced) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-teal-500/20 to-emerald-500/30" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Cyan glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-teal-500/20 to-emerald-500/30" />

      {/* Power surge effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border-4 border-cyan-400/40 animate-power-surge" />
        <div
          className="absolute w-24 h-24 rounded-full border-4 border-teal-400/40 animate-power-surge"
          style={{ animationDelay: "0.3s" }}
        />
        <div
          className="absolute w-16 h-16 rounded-full border-4 border-emerald-400/40 animate-power-surge"
          style={{ animationDelay: "0.6s" }}
        />
      </div>

      {/* Type boost text */}
      <div className="absolute top-1/4 animate-bounce">
        <span className="text-2xl font-bold text-cyan-400">×1.2</span>
      </div>
    </div>
  );
}

// Vitamin animation
function VitaminAnimation({ particleCounts, reduced }: AnimationProps) {
  const barCount = Math.max(3, particleCounts.small);

  if (reduced) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-lime-500/30 via-yellow-500/20 to-green-500/30" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Lime/yellow gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-lime-500/30 via-yellow-500/20 to-green-500/30" />

      {/* Stat increase bars */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
        {[...Array(barCount)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className="w-4 bg-lime-500/60 rounded-t-sm animate-stat-bar-grow"
              style={{
                height: `${20 + i * 8}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
            <div className="w-4 h-1 bg-muted rounded-b-sm" />
          </div>
        ))}
      </div>

      {/* +EV text */}
      <div className="absolute top-1/3 animate-pulse">
        <span className="text-xl font-bold text-lime-400">+EV</span>
      </div>
    </div>
  );
}

// Key item animation
function KeyItemAnimation({ reduced }: AnimationProps) {
  if (reduced) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/30 via-amber-500/20 to-yellow-500/30" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Rose/gold gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/30 via-amber-500/20 to-yellow-500/30" />

      {/* Key shimmer effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-6xl animate-key-shimmer">🔑</div>
      </div>

      {/* Importance glow */}
      <div className="absolute w-24 h-24 bg-amber-400/30 rounded-full blur-xl animate-pulse" />
    </div>
  );
}

// TM/HM animation
function MachineAnimation({ particleCounts, reduced }: AnimationProps) {
  if (reduced) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-500/30 via-slate-500/20 to-zinc-500/30" />
        <div className="w-20 h-20 rounded-full border-4 border-gray-400/40">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-gray-600/40 to-gray-400/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Gray tech gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-500/30 via-slate-500/20 to-zinc-500/30" />

      {/* Disc rotation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border-4 border-gray-400/40 animate-disc-spin">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-gray-600/40 to-gray-400/40" />
        </div>
      </div>

      {/* Data particles */}
      {[...Array(particleCounts.medium)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-gray-400/60 rounded-full animate-data-flow"
          style={{
            left: `${20 + i * (60 / particleCounts.medium)}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// Default animation for other categories
function DefaultAnimation({ reduced }: AnimationProps) {
  if (reduced) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted animate-pulse" />
      <div className="absolute w-16 h-16 bg-primary/20 rounded-full blur-xl animate-pulse" />
    </div>
  );
}

export function ItemCategoryAnimation({ category, className }: ItemCategoryAnimationProps) {
  const { particleCounts, shouldReduceMotion } = useAnimationSettings();
  const animationProps: AnimationProps = { particleCounts, reduced: shouldReduceMotion };

  const getAnimation = () => {
    switch (category) {
      case "berries":
        return <BerryAnimation {...animationProps} />;
      case "healing":
      case "medicine":
      case "revival":
      case "status-cures":
      case "pp-recovery":
        return <HealingAnimation {...animationProps} />;
      case "evolution":
        return <EvolutionAnimation {...animationProps} />;
      case "held-items":
      case "species-specific":
        return <HeldItemAnimation {...animationProps} />;
      case "standard-balls":
      case "special-balls":
      case "apricorn-balls":
        return <BallAnimation {...animationProps} />;
      case "type-enhancement":
      case "stat-boosts":
        return <TypeBoostAnimation {...animationProps} />;
      case "vitamins":
        return <VitaminAnimation {...animationProps} />;
      case "plot-advancement":
        return <KeyItemAnimation {...animationProps} />;
      case "all-machines":
        return <MachineAnimation {...animationProps} />;
      default:
        return <DefaultAnimation {...animationProps} />;
    }
  };

  return <div className={cn("relative overflow-hidden", className)}>{getAnimation()}</div>;
}
