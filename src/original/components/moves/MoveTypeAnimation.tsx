import { cn } from "@/original/lib/utils";
import { useAnimationSettings } from "@/original/hooks/useAnimationSettings";

interface MoveTypeAnimationProps {
  type: string;
  category: string;
  className?: string;
}

// Colors for each type
const typeColors: Record<string, { primary: string; secondary: string; glow: string }> = {
  fire: { primary: "#F08030", secondary: "#FF6B35", glow: "rgba(240, 128, 48, 0.6)" },
  water: { primary: "#6890F0", secondary: "#4A90D9", glow: "rgba(104, 144, 240, 0.6)" },
  electric: { primary: "#F8D030", secondary: "#FFE066", glow: "rgba(248, 208, 48, 0.8)" },
  grass: { primary: "#78C850", secondary: "#5DBE3D", glow: "rgba(120, 200, 80, 0.6)" },
  ice: { primary: "#98D8D8", secondary: "#BCE6E6", glow: "rgba(152, 216, 216, 0.7)" },
  fighting: { primary: "#C03028", secondary: "#E04038", glow: "rgba(192, 48, 40, 0.6)" },
  poison: { primary: "#A040A0", secondary: "#B958B9", glow: "rgba(160, 64, 160, 0.6)" },
  ground: { primary: "#E0C068", secondary: "#D4A845", glow: "rgba(224, 192, 104, 0.6)" },
  flying: { primary: "#A890F0", secondary: "#C4B5FD", glow: "rgba(168, 144, 240, 0.6)" },
  psychic: { primary: "#F85888", secondary: "#FF6B9D", glow: "rgba(248, 88, 136, 0.6)" },
  bug: { primary: "#A8B820", secondary: "#C5D930", glow: "rgba(168, 184, 32, 0.6)" },
  rock: { primary: "#B8A038", secondary: "#D4BC4C", glow: "rgba(184, 160, 56, 0.6)" },
  ghost: { primary: "#705898", secondary: "#8B6BAE", glow: "rgba(112, 88, 152, 0.7)" },
  dragon: { primary: "#7038F8", secondary: "#8B5CF6", glow: "rgba(112, 56, 248, 0.6)" },
  dark: { primary: "#705848", secondary: "#8B7355", glow: "rgba(112, 88, 72, 0.6)" },
  steel: { primary: "#B8B8D0", secondary: "#D1D1E0", glow: "rgba(184, 184, 208, 0.6)" },
  fairy: { primary: "#EE99AC", secondary: "#FFB7C5", glow: "rgba(238, 153, 172, 0.6)" },
  normal: { primary: "#A8A878", secondary: "#C4C4A0", glow: "rgba(168, 168, 120, 0.5)" },
};

export function MoveTypeAnimation({ type, category, className }: MoveTypeAnimationProps) {
  const typeLower = type.toLowerCase();
  const colors = typeColors[typeLower] || typeColors.normal;
  const { particleCounts, shouldReduceMotion } = useAnimationSettings();

  return (
    <div className={cn("relative w-full h-32 overflow-hidden rounded-xl", className)}>
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at center, ${colors.primary}, transparent 70%)`,
        }}
      />

      {/* Main animation container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Type-specific animations */}
        {typeLower === "fire" && (
          <FireAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "water" && (
          <WaterAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "electric" && (
          <ElectricAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "grass" && (
          <GrassAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "ice" && (
          <IceAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "psychic" && (
          <PsychicAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "ghost" && (
          <GhostAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "dragon" && (
          <DragonAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "dark" && (
          <DarkAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "fairy" && (
          <FairyAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "fighting" && (
          <FightingAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "poison" && (
          <PoisonAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "ground" && (
          <GroundAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "flying" && (
          <FlyingAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "bug" && (
          <BugAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "rock" && (
          <RockAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "steel" && (
          <SteelAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}
        {typeLower === "normal" && (
          <NormalAnimation
            colors={colors}
            particleCounts={particleCounts}
            reduced={shouldReduceMotion}
          />
        )}

        {/* Category overlay effect */}
        {category === "physical" && <PhysicalOverlay />}
        {category === "special" && <SpecialOverlay />}
        {category === "status" && <StatusOverlay />}
      </div>
    </div>
  );
}

interface AnimationProps {
  colors: { primary: string; secondary: string; glow: string };
  particleCounts: { small: number; medium: number; large: number };
  reduced: boolean;
}

// Fire Animation - Enhanced with embers and pulse
function FireAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const flameCount = reduced ? particleCounts.small : particleCounts.medium;
  const emberCount = reduced ? particleCounts.medium : particleCounts.large;

  return (
    <div className="relative w-full h-full">
      {/* Main flames */}
      {[...Array(flameCount)].map((_, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full animate-fire-flame"
          style={{
            left: `${10 + i * (80 / flameCount)}%`,
            width: `${15 + (i % 3) * 5}px`,
            height: `${30 + (i % 4) * 10}px`,
            background: `linear-gradient(to top, ${colors.primary}, ${colors.secondary}, transparent)`,
            animationDelay: `${i * 0.1}s`,
            filter: `blur(2px)`,
          }}
        />
      ))}
      {/* Embers rising */}
      {[...Array(emberCount)].map((_, i) => (
        <div
          key={`ember-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full animate-fire-ember"
          style={
            {
              left: `${10 + (i % flameCount) * (80 / flameCount)}%`,
              bottom: "15%",
              background: colors.secondary,
              boxShadow: `0 0 4px ${colors.glow}`,
              animationDelay: `${i * 0.15}s`,
              "--ember-x": `${(i % 2 === 0 ? 1 : -1) * (5 + i * 2)}px`,
            } as React.CSSProperties
          }
        />
      ))}
      {/* Glow pulse */}
      <div
        className="absolute inset-0 animate-fire-pulse"
        style={
          {
            "--fire-glow": colors.glow,
            boxShadow: `inset 0 -30px 60px ${colors.glow}`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

// Water Animation - Enhanced with ripples and splash
function WaterAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const waveCount = reduced ? 2 : 3;
  const dropCount = reduced ? particleCounts.small : particleCounts.medium;
  const rippleCount = reduced ? 2 : 3;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Waves */}
      {[...Array(waveCount)].map((_, i) => (
        <div
          key={i}
          className="absolute bottom-0 w-[200%] h-16 animate-water-wave"
          style={{
            left: "-50%",
            background: `linear-gradient(90deg, transparent, ${colors.primary}40, ${colors.secondary}60, ${colors.primary}40, transparent)`,
            borderRadius: "100% 100% 0 0",
            animationDelay: `${i * 0.3}s`,
            bottom: `${i * 15}px`,
            opacity: 1 - i * 0.2,
          }}
        />
      ))}
      {/* Water droplets */}
      {[...Array(dropCount)].map((_, i) => (
        <div
          key={`drop-${i}`}
          className="absolute w-2 h-3 rounded-full animate-water-drop"
          style={{
            left: `${15 + i * (70 / dropCount)}%`,
            background: colors.secondary,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      {/* Ripple effects */}
      {[...Array(rippleCount)].map((_, i) => (
        <div
          key={`ripple-${i}`}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border-2 animate-water-ripple"
          style={{
            width: "30px",
            height: "15px",
            borderColor: colors.secondary,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
      {/* Splash effects */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-8 animate-water-splash"
        style={{
          background: `radial-gradient(ellipse at bottom, ${colors.primary}60, transparent)`,
        }}
      />
    </div>
  );
}

// Electric Animation - Enhanced with arcs and flash
function ElectricAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const boltCount = reduced ? particleCounts.small : particleCounts.medium;
  const arcCount = reduced ? 2 : 3;
  const sparkCount = reduced ? particleCounts.medium : particleCounts.large;

  return (
    <div className="relative w-full h-full">
      {/* Lightning bolts */}
      {[...Array(boltCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-electric-bolt"
          style={{
            left: `${15 + i * (70 / boltCount)}%`,
            top: "10%",
            width: "4px",
            height: "60%",
            background: `linear-gradient(to bottom, ${colors.secondary}, ${colors.primary})`,
            clipPath:
              "polygon(50% 0%, 100% 25%, 30% 50%, 100% 75%, 50% 100%, 0% 75%, 70% 50%, 0% 25%)",
            animationDelay: `${i * 0.1}s`,
            filter: `drop-shadow(0 0 10px ${colors.glow})`,
          }}
        />
      ))}
      {/* Electric arcs */}
      {[...Array(arcCount)].map((_, i) => (
        <div
          key={`arc-${i}`}
          className="absolute animate-electric-arc"
          style={{
            left: `${10 + i * 30}%`,
            top: "40%",
            width: "60px",
            height: "4px",
            background: colors.secondary,
            filter: `drop-shadow(0 0 6px ${colors.glow})`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      {/* Spark particles */}
      {[...Array(sparkCount)].map((_, i) => (
        <div
          key={`spark-${i}`}
          className="absolute w-1 h-1 rounded-full animate-electric-spark"
          style={{
            left: `${10 + (i % boltCount) * (80 / boltCount)}%`,
            top: `${20 + (i % 5) * 12}%`,
            background: colors.secondary,
            boxShadow: `0 0 8px ${colors.glow}`,
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
      {/* Flash overlay */}
      <div
        className="absolute inset-0 animate-electric-flash"
        style={{
          background: `radial-gradient(circle, ${colors.secondary}30, transparent)`,
        }}
      />
    </div>
  );
}

// Grass Animation - Enhanced with grow and sway
function GrassAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const bladeCount = reduced ? particleCounts.small : particleCounts.medium;
  const particleCount = reduced ? particleCounts.medium : particleCounts.large;

  return (
    <div className="relative w-full h-full">
      {/* Swaying grass blades */}
      {[...Array(bladeCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-grass-leaf animate-grass-sway"
          style={{
            left: `${8 + i * (84 / bladeCount)}%`,
            bottom: "15%",
            width: "10px",
            height: "28px",
            background: i % 2 === 0 ? colors.primary : colors.secondary,
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            transformOrigin: "bottom center",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      {/* Floating leaf particles */}
      {[...Array(particleCount)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute w-2 h-2 rounded-full animate-grass-particle"
          style={{
            left: `${5 + (i % 10) * 10}%`,
            background: i % 2 === 0 ? colors.primary : colors.secondary,
            animationDelay: `${i * 0.25}s`,
          }}
        />
      ))}
      {/* Growing effect base */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8 animate-grass-grow"
        style={{
          background: `linear-gradient(to top, ${colors.primary}40, transparent)`,
        }}
      />
    </div>
  );
}

// Ice Animation - Enhanced with shatter and freeze
function IceAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const crystalCount = reduced ? particleCounts.small : particleCounts.medium;
  const snowCount = reduced ? particleCounts.medium : particleCounts.large;
  const shatterCount = reduced ? particleCounts.small : particleCounts.medium;

  return (
    <div className="relative w-full h-full animate-ice-freeze">
      {/* Ice crystals */}
      {[...Array(crystalCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-ice-crystal"
          style={{
            left: `${12 + i * (76 / crystalCount)}%`,
            bottom: "8%",
            width: "10px",
            height: "45px",
            background: `linear-gradient(to top, ${colors.primary}, ${colors.secondary})`,
            clipPath: "polygon(50% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)",
            animationDelay: `${i * 0.12}s`,
            filter: `drop-shadow(0 0 6px ${colors.glow})`,
          }}
        />
      ))}
      {/* Snowflakes */}
      {[...Array(snowCount)].map((_, i) => (
        <div
          key={`snow-${i}`}
          className="absolute text-lg animate-ice-snow"
          style={
            {
              left: `${5 + (i % 9) * 10}%`,
              color: colors.secondary,
              animationDelay: `${i * 0.2}s`,
              textShadow: `0 0 6px ${colors.glow}`,
              "--snow-drift": `${(i % 2 === 0 ? 1 : -1) * (10 + i * 3)}px`,
            } as React.CSSProperties
          }
        >
          ❄
        </div>
      ))}
      {/* Ice shatter particles */}
      {[...Array(shatterCount)].map((_, i) => (
        <div
          key={`shatter-${i}`}
          className="absolute w-2 h-3 animate-ice-shatter"
          style={
            {
              left: "50%",
              top: "50%",
              background: colors.secondary,
              animationDelay: `${i * 0.3}s`,
              "--shatter-rotate": `${i * 60}deg`,
              "--shatter-x": `${(i % 2 === 0 ? 1 : -1) * (20 + i * 5)}px`,
              "--shatter-y": `${(i % 3 === 0 ? -1 : 1) * (15 + i * 3)}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

// Psychic Animation - Enhanced with wave and mind effects
function PsychicAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const ringCount = reduced ? 2 : 4;
  const particleCount = reduced ? particleCounts.small : particleCounts.medium;

  return (
    <div className="relative w-full h-full flex items-center justify-center animate-psychic-mind">
      {/* Expanding rings */}
      {[...Array(ringCount)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2 animate-psychic-ring"
          style={{
            width: `${35 + i * 20}px`,
            height: `${35 + i * 20}px`,
            borderColor: i % 2 === 0 ? colors.primary : colors.secondary,
            animationDelay: `${i * 0.3}s`,
            boxShadow: `0 0 15px ${colors.glow}`,
          }}
        />
      ))}
      {/* Energy waves */}
      {[...Array(2)].map((_, i) => (
        <div
          key={`wave-${i}`}
          className="absolute h-1 animate-psychic-wave"
          style={{
            width: "40px",
            background: `linear-gradient(to right, transparent, ${colors.secondary}, transparent)`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
      {/* Orbiting particles */}
      {[...Array(particleCount)].map((_, i) => (
        <div
          key={`energy-${i}`}
          className="absolute w-2 h-2 rounded-full animate-psychic-particle"
          style={{
            background: colors.secondary,
            boxShadow: `0 0 10px ${colors.glow}`,
            animationDelay: `${i * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}

// Ghost Animation - Enhanced with phase and fade
function GhostAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const spiritCount = reduced ? 2 : 4;
  const wispCount = reduced ? particleCounts.small : particleCounts.medium;

  return (
    <div className="relative w-full h-full">
      {/* Floating spirits */}
      {[...Array(spiritCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-ghost-float animate-ghost-phase"
          style={{
            left: `${12 + i * (76 / spiritCount)}%`,
            bottom: "18%",
            width: "22px",
            height: "32px",
            background: `radial-gradient(ellipse at top, ${colors.secondary}, ${colors.primary}80, transparent)`,
            borderRadius: "50% 50% 40% 40% / 60% 60% 40% 40%",
            animationDelay: `${i * 0.35}s`,
            filter: `blur(1px)`,
          }}
        />
      ))}
      {/* Fading wisps */}
      {[...Array(wispCount)].map((_, i) => (
        <div
          key={`wisp-${i}`}
          className="absolute w-4 h-4 rounded-full animate-ghost-wisp animate-ghost-fade"
          style={
            {
              left: `${10 + (i % 7) * 12}%`,
              bottom: "25%",
              background: `radial-gradient(circle, ${colors.secondary}80, transparent)`,
              animationDelay: `${i * 0.18}s`,
              "--wisp-x": `${(i % 2 === 0 ? 1 : -1) * (10 + i * 3)}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

// Dragon Animation - Enhanced with energy and breath
function DragonAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const rayCount = reduced ? particleCounts.medium : particleCounts.large;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Energy core */}
      <div
        className="w-18 h-18 rounded-full animate-dragon-core"
        style={{
          width: "72px",
          height: "72px",
          background: `radial-gradient(circle, ${colors.secondary}, ${colors.primary})`,
          boxShadow: `0 0 40px ${colors.glow}, 0 0 80px ${colors.primary}40`,
        }}
      />
      {/* Energy rays */}
      {[...Array(rayCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-dragon-ray"
          style={{
            width: "4px",
            height: "55px",
            background: `linear-gradient(to top, ${colors.primary}, transparent)`,
            transform: `rotate(${i * (360 / rayCount)}deg)`,
            transformOrigin: "bottom center",
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
      {/* Rotating energy ring */}
      <div
        className="absolute w-28 h-28 rounded-full border-2 animate-dragon-energy"
        style={{
          borderColor: `${colors.secondary}60`,
          borderStyle: "dashed",
        }}
      />
      {/* Dragon breath effect */}
      <div
        className="absolute left-1/2 h-3 animate-dragon-breath"
        style={{
          width: "40px",
          background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary}, transparent)`,
        }}
      />
    </div>
  );
}

// Dark Animation - Enhanced with vortex and shadow
function DarkAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const waveCount = reduced ? 2 : 4;
  const particleCount = reduced ? particleCounts.medium : particleCounts.large;

  return (
    <div className="relative w-full h-full">
      {/* Shadow waves */}
      {[...Array(waveCount)].map((_, i) => (
        <div
          key={i}
          className="absolute bottom-0 w-full animate-dark-wave"
          style={{
            height: `${22 + i * 10}px`,
            background: `linear-gradient(to top, ${colors.primary}${95 - i * 20}, transparent)`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      {/* Vortex center */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full animate-dark-vortex animate-dark-shadow"
        style={{
          background: `radial-gradient(circle, ${colors.primary}, transparent)`,
        }}
      />
      {/* Rising dark particles */}
      {[...Array(particleCount)].map((_, i) => (
        <div
          key={`dark-${i}`}
          className="absolute w-2 h-2 rounded-full animate-dark-particle"
          style={{
            left: `${8 + (i % 8) * 10}%`,
            background: colors.secondary,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

// Fairy Animation - Enhanced with trail and hearts
function FairyAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const sparkleCount = reduced ? particleCounts.medium : particleCounts.large;
  const orbCount = reduced ? particleCounts.small : particleCounts.medium;

  return (
    <div className="relative w-full h-full">
      {/* Sparkle stars */}
      {[...Array(sparkleCount)].map((_, i) => (
        <div
          key={i}
          className="absolute text-sm animate-fairy-sparkle"
          style={{
            left: `${5 + (i % 10) * 9}%`,
            top: `${10 + (i % 7) * 12}%`,
            color: i % 2 === 0 ? colors.primary : colors.secondary,
            textShadow: `0 0 10px ${colors.glow}`,
            animationDelay: `${i * 0.12}s`,
          }}
        >
          ✦
        </div>
      ))}
      {/* Floating orbs with trails */}
      {[...Array(orbCount)].map((_, i) => (
        <div
          key={`orb-${i}`}
          className="absolute w-3 h-3 rounded-full animate-fairy-orb"
          style={{
            left: `${15 + i * (70 / orbCount)}%`,
            background: `radial-gradient(circle, ${colors.secondary}, ${colors.primary}80)`,
            boxShadow: `0 0 12px ${colors.glow}`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      {/* Fairy trails */}
      {[...Array(reduced ? 2 : 4)].map((_, i) => (
        <div
          key={`trail-${i}`}
          className="absolute h-1 rounded-full animate-fairy-trail"
          style={{
            width: "25px",
            top: `${25 + i * 15}%`,
            left: `${20 + i * 15}%`,
            background: `linear-gradient(to right, ${colors.secondary}, transparent)`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
      {/* Hearts */}
      {[...Array(reduced ? 2 : 4)].map((_, i) => (
        <div
          key={`heart-${i}`}
          className="absolute text-xs animate-fairy-heart"
          style={{
            left: `${20 + i * 20}%`,
            top: `${30 + (i % 2) * 25}%`,
            color: colors.primary,
            animationDelay: `${i * 0.25}s`,
          }}
        >
          ♥
        </div>
      ))}
    </div>
  );
}

// Fighting Animation - Enhanced with burst and shake
function FightingAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const burstCount = reduced ? particleCounts.small : particleCounts.medium;
  const lineCount = reduced ? particleCounts.small : particleCounts.medium;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Impact burst */}
      <div
        className="absolute w-24 h-24 animate-fighting-impact"
        style={{
          background: `radial-gradient(circle, ${colors.secondary}70, ${colors.primary}50, transparent)`,
        }}
      />
      {/* Burst particles */}
      {[...Array(burstCount)].map((_, i) => (
        <div
          key={`burst-${i}`}
          className="absolute w-3 h-3 animate-fighting-burst"
          style={{
            background: colors.primary,
            transform: `rotate(${i * (360 / burstCount)}deg) translateX(30px)`,
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
      {/* Speed lines */}
      {[...Array(lineCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-fighting-line"
          style={{
            width: "70px",
            height: "3px",
            background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)`,
            transform: `rotate(${i * (360 / lineCount)}deg)`,
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
    </div>
  );
}

// Poison Animation - Enhanced with drip and pulse
function PoisonAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const bubbleCount = reduced ? particleCounts.medium : particleCounts.large;
  const dripCount = reduced ? particleCounts.small : particleCounts.medium;

  return (
    <div className="relative w-full h-full animate-poison-pulse">
      {/* Poison bubbles */}
      {[...Array(bubbleCount)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-poison-bubble"
          style={{
            left: `${8 + (i % 8) * 10}%`,
            bottom: "8%",
            width: `${10 + (i % 4) * 5}px`,
            height: `${10 + (i % 4) * 5}px`,
            background: `radial-gradient(circle at 30% 30%, ${colors.secondary}, ${colors.primary})`,
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
      {/* Dripping poison */}
      {[...Array(dripCount)].map((_, i) => (
        <div
          key={`drip-${i}`}
          className="absolute w-1.5 h-4 rounded-full animate-poison-drip"
          style={{
            left: `${15 + i * (70 / dripCount)}%`,
            top: "10%",
            background: colors.secondary,
            animationDelay: `${i * 0.25}s`,
          }}
        />
      ))}
      {/* Toxic mist */}
      <div
        className="absolute bottom-0 w-full h-14 animate-poison-mist"
        style={{
          background: `linear-gradient(to top, ${colors.primary}70, transparent)`,
        }}
      />
    </div>
  );
}

// Ground Animation - Enhanced with quake and crack
function GroundAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const rockCount = reduced ? particleCounts.small : particleCounts.medium;
  const dustCount = reduced ? particleCounts.medium : particleCounts.large;

  return (
    <div className="relative w-full h-full animate-ground-quake">
      {/* Rising rocks */}
      {[...Array(rockCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-ground-rock"
          style={{
            left: `${8 + i * (84 / rockCount)}%`,
            bottom: "5%",
            width: `${18 + (i % 3) * 6}px`,
            height: `${22 + (i % 4) * 8}px`,
            background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
            clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      {/* Dust clouds */}
      {[...Array(dustCount)].map((_, i) => (
        <div
          key={`dust-${i}`}
          className="absolute w-2 h-2 rounded-full animate-ground-dust"
          style={
            {
              left: `${5 + (i % 9) * 10}%`,
              bottom: "10%",
              background: colors.secondary,
              animationDelay: `${i * 0.08}s`,
              "--dust-x": `${(i % 2 === 0 ? 1 : -1) * (5 + i)}px`,
              "--dust-x2": `${(i % 2 === 0 ? 1 : -1) * (15 + i * 2)}px`,
            } as React.CSSProperties
          }
        />
      ))}
      {/* Ground crack */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-12 animate-ground-crack"
        style={{
          background: colors.primary,
        }}
      />
    </div>
  );
}

// Flying Animation - Enhanced with gust and soar
function FlyingAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const windCount = reduced ? particleCounts.small : particleCounts.medium;
  const featherCount = reduced ? particleCounts.small : particleCounts.medium;

  return (
    <div className="relative w-full h-full">
      {/* Wind streams */}
      {[...Array(windCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-flying-wind"
          style={{
            top: `${15 + i * (70 / windCount)}%`,
            left: "-20%",
            width: "140%",
            height: "3px",
            background: `linear-gradient(to right, transparent, ${colors.primary}70, ${colors.secondary}90, ${colors.primary}70, transparent)`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      {/* Gust effects */}
      {[...Array(reduced ? 2 : 3)].map((_, i) => (
        <div
          key={`gust-${i}`}
          className="absolute h-2 animate-flying-gust"
          style={{
            width: "50px",
            top: `${25 + i * 20}%`,
            left: "30%",
            background: `linear-gradient(to right, ${colors.secondary}60, transparent)`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
      {/* Feathers */}
      {[...Array(featherCount)].map((_, i) => (
        <div
          key={`feather-${i}`}
          className="absolute text-lg animate-flying-feather animate-flying-soar"
          style={{
            left: `${10 + (i % 5) * 15}%`,
            color: colors.secondary,
            animationDelay: `${i * 0.25}s`,
          }}
        >
          🪶
        </div>
      ))}
    </div>
  );
}

// Bug Animation - Enhanced with wing and swarm
function BugAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const bugCount = reduced ? particleCounts.medium : particleCounts.large;
  const wingCount = reduced ? particleCounts.small : particleCounts.medium;

  return (
    <div className="relative w-full h-full">
      {/* Swarming bugs */}
      {[...Array(bugCount)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-bug-crawl animate-bug-swarm"
          style={
            {
              left: `${10 + (i % 8) * 10}%`,
              top: `${20 + (i % 5) * 12}%`,
              background: i % 2 === 0 ? colors.primary : colors.secondary,
              animationDelay: `${i * 0.1}s`,
              "--swarm-x1": `${(i % 2) * 10}px`,
              "--swarm-y1": `${-(i % 3) * 5}px`,
              "--swarm-x2": `${-(i % 2) * 8}px`,
              "--swarm-y2": `${(i % 3) * 6}px`,
              "--swarm-x3": `${(i % 2) * 6}px`,
              "--swarm-y3": `${(i % 3) * 4}px`,
            } as React.CSSProperties
          }
        />
      ))}
      {/* Wing particles */}
      {[...Array(wingCount)].map((_, i) => (
        <div
          key={`wing-${i}`}
          className="absolute w-3 h-4 animate-bug-wing"
          style={{
            left: `${20 + i * (60 / wingCount)}%`,
            top: "40%",
            background: `${colors.secondary}60`,
            borderRadius: "50%",
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      {/* Leafy elements */}
      {[...Array(reduced ? 2 : 4)].map((_, i) => (
        <div
          key={`leaf-${i}`}
          className="absolute animate-bug-leaf"
          style={{
            left: `${15 + i * 22}%`,
            bottom: "8%",
            width: "14px",
            height: "22px",
            background: colors.secondary,
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            opacity: 0.5,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

// Rock Animation - Enhanced with slam and debris
function RockAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const rockCount = reduced ? particleCounts.small : particleCounts.medium;
  const debrisCount = reduced ? particleCounts.small : particleCounts.medium;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Floating rocks */}
      {[...Array(rockCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-rock-float"
          style={{
            left: `${12 + i * (76 / rockCount)}%`,
            width: `${22 + (i % 3) * 8}px`,
            height: `${16 + (i % 4) * 6}px`,
            background: `linear-gradient(145deg, ${colors.secondary}, ${colors.primary})`,
            borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
            animationDelay: `${i * 0.15}s`,
            boxShadow: `2px 2px 6px rgba(0,0,0,0.4)`,
          }}
        />
      ))}
      {/* Rock debris */}
      {[...Array(debrisCount)].map((_, i) => (
        <div
          key={`debris-${i}`}
          className="absolute w-2 h-2 animate-rock-debris"
          style={
            {
              left: "50%",
              top: "50%",
              background: colors.secondary,
              animationDelay: `${i * 0.12}s`,
              "--debris-x": `${(i % 2 === 0 ? 1 : -1) * (15 + i * 5)}px`,
              "--debris-y": `${(i % 3 === 0 ? -1 : 1) * (20 + i * 4)}px`,
            } as React.CSSProperties
          }
        />
      ))}
      {/* Crumbling particles */}
      {[...Array(reduced ? 3 : 5)].map((_, i) => (
        <div
          key={`crumble-${i}`}
          className="absolute w-1.5 h-1.5 animate-rock-crumble"
          style={
            {
              left: `${30 + i * 10}%`,
              top: "30%",
              background: colors.primary,
              animationDelay: `${i * 0.2}s`,
              "--crumble-rotate": `${i * 30}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

// Steel Animation - Enhanced with reflect and clang
function SteelAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const plateCount = reduced ? particleCounts.small : particleCounts.medium;
  const sparkCount = reduced ? particleCounts.small : particleCounts.medium;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Metal plates */}
      {[...Array(plateCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-steel-shine animate-steel-clang"
          style={{
            left: `${15 + i * (70 / plateCount)}%`,
            width: "28px",
            height: "38px",
            background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary}, ${colors.secondary})`,
            borderRadius: "3px",
            animationDelay: `${i * 0.12}s`,
            boxShadow: `inset 0 0 12px ${colors.glow}`,
          }}
        />
      ))}
      {/* Reflection shine */}
      <div className="absolute w-full h-full overflow-hidden">
        <div
          className="absolute w-8 h-full animate-steel-reflect"
          style={{
            background: `linear-gradient(to right, transparent, ${colors.secondary}60, transparent)`,
          }}
        />
      </div>
      {/* Metal sparks */}
      {[...Array(sparkCount)].map((_, i) => (
        <div
          key={`spark-${i}`}
          className="absolute w-1 h-1 rounded-full animate-steel-spark"
          style={
            {
              left: "50%",
              top: "50%",
              background: colors.secondary,
              boxShadow: `0 0 4px ${colors.glow}`,
              animationDelay: `${i * 0.15}s`,
              "--spark-x": `${(i % 2 === 0 ? 1 : -1) * (10 + i * 4)}px`,
              "--spark-y": `${(i % 3 === 0 ? -1 : 1) * (8 + i * 3)}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

// Normal Animation - Enhanced with swift and tackle
function NormalAnimation({ colors, particleCounts, reduced }: AnimationProps) {
  const ringCount = reduced ? 2 : 3;
  const swiftCount = reduced ? particleCounts.small : particleCounts.medium;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Pulsing circle */}
      <div
        className="w-18 h-18 rounded-full animate-normal-pulse"
        style={{
          width: "72px",
          height: "72px",
          background: `radial-gradient(circle, ${colors.secondary}80, ${colors.primary}60)`,
          boxShadow: `0 0 25px ${colors.glow}`,
        }}
      />
      {/* Expanding rings */}
      {[...Array(ringCount)].map((_, i) => (
        <div
          key={`ring-${i}`}
          className="absolute rounded-full border-2 animate-normal-ring"
          style={{
            width: "50px",
            height: "50px",
            borderColor: colors.secondary,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
      {/* Swift stars */}
      {[...Array(swiftCount)].map((_, i) => (
        <div
          key={`swift-${i}`}
          className="absolute text-xs animate-normal-swift"
          style={{
            top: `${20 + i * 12}%`,
            left: "40%",
            color: colors.secondary,
            animationDelay: `${i * 0.2}s`,
          }}
        >
          ★
        </div>
      ))}
      {/* Tackle motion */}
      <div
        className="absolute w-12 h-4 rounded-full animate-normal-tackle"
        style={{
          background: `linear-gradient(to right, transparent, ${colors.primary}60, transparent)`,
        }}
      />
    </div>
  );
}

// Category Overlays - Enhanced
function PhysicalOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/15 to-transparent animate-physical-strike" />
    </div>
  );
}

function SpecialOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none animate-special-glow">
      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/15 to-transparent" />
    </div>
  );
}

function StatusOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0 animate-status-wave"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(128,128,128,0.1), transparent)",
          backgroundSize: "200% 100%",
        }}
      />
    </div>
  );
}
