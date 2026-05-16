import { useEffect, useState } from "react";
import { cn } from "@/original/lib/utils";

export type AttackType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

interface AttackAnimationProps {
  type: AttackType;
  isActive: boolean;
  isCritical?: boolean;
  effectiveness?: number; // 0, 0.25, 0.5, 1, 2, 4
  targetPosition?: "player" | "enemy";
  onComplete?: () => void;
}

const TYPE_PARTICLES: Record<AttackType, { emoji: string; count: number; color: string }> = {
  normal: { emoji: "💥", count: 3, color: "rgba(168, 168, 120, 0.8)" },
  fire: { emoji: "🔥", count: 6, color: "rgba(240, 128, 48, 0.9)" },
  water: { emoji: "💧", count: 5, color: "rgba(104, 144, 240, 0.9)" },
  electric: { emoji: "⚡", count: 4, color: "rgba(248, 208, 48, 0.9)" },
  grass: { emoji: "🍃", count: 5, color: "rgba(120, 200, 80, 0.9)" },
  ice: { emoji: "❄️", count: 5, color: "rgba(152, 216, 216, 0.9)" },
  fighting: { emoji: "👊", count: 3, color: "rgba(192, 48, 40, 0.9)" },
  poison: { emoji: "☠️", count: 4, color: "rgba(160, 64, 160, 0.9)" },
  ground: { emoji: "🪨", count: 4, color: "rgba(224, 192, 104, 0.9)" },
  flying: { emoji: "🌪️", count: 3, color: "rgba(168, 144, 240, 0.9)" },
  psychic: { emoji: "🔮", count: 4, color: "rgba(248, 88, 136, 0.9)" },
  bug: { emoji: "🐛", count: 4, color: "rgba(168, 184, 32, 0.9)" },
  rock: { emoji: "🪨", count: 3, color: "rgba(184, 160, 56, 0.9)" },
  ghost: { emoji: "👻", count: 3, color: "rgba(112, 88, 152, 0.9)" },
  dragon: { emoji: "🐉", count: 3, color: "rgba(112, 56, 248, 0.9)" },
  dark: { emoji: "🌑", count: 3, color: "rgba(112, 88, 72, 0.9)" },
  steel: { emoji: "⚙️", count: 3, color: "rgba(184, 184, 208, 0.9)" },
  fairy: { emoji: "✨", count: 5, color: "rgba(238, 153, 172, 0.9)" },
};

export function AttackAnimation({
  type,
  isActive,
  isCritical = false,
  effectiveness = 1,
  targetPosition = "enemy",
  onComplete,
}: AttackAnimationProps) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number }>
  >([]);
  const [showEffect, setShowEffect] = useState(false);
  const [showSuperEffective, setShowSuperEffective] = useState(false);
  const [showCritical, setShowCritical] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowEffect(true);

      // Generate particles
      const typeInfo = TYPE_PARTICLES[type] || TYPE_PARTICLES.normal;
      const newParticles = Array.from({ length: typeInfo.count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);

      // Show critical hit
      if (isCritical) {
        setTimeout(() => setShowCritical(true), 200);
        setTimeout(() => setShowCritical(false), 800);
      }

      // Show super effective
      if (effectiveness >= 2) {
        setTimeout(() => setShowSuperEffective(true), 300);
        setTimeout(() => setShowSuperEffective(false), 1200);
      }

      // Complete animation
      const timer = setTimeout(() => {
        setShowEffect(false);
        setParticles([]);
        onComplete?.();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isActive, type, isCritical, effectiveness, onComplete]);

  if (!isActive && !showEffect) return null;

  const typeInfo = TYPE_PARTICLES[type] || TYPE_PARTICLES.normal;

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none z-50 overflow-hidden",
        isCritical && "animate-critical-hit",
      )}
    >
      {/* Type-specific background flash */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-150",
          showEffect && "opacity-40",
        )}
        style={{ backgroundColor: typeInfo.color }}
      />

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-2xl sm:text-3xl animate-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          {typeInfo.emoji}
        </div>
      ))}

      {/* Type-specific effects */}
      {type === "fire" && showEffect && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="fire-burst" />
        </div>
      )}

      {type === "water" && showEffect && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="water-splash" />
        </div>
      )}

      {type === "electric" && showEffect && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="electric-bolt" />
        </div>
      )}

      {type === "grass" && showEffect && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grass-leaves" />
        </div>
      )}

      {/* Critical Hit indicator */}
      {showCritical && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="critical-text animate-scale-in">
            <span className="text-xl sm:text-2xl font-black text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-pulse">
              CRITICAL HIT!
            </span>
          </div>
        </div>
      )}

      {/* Super Effective indicator */}
      {showSuperEffective && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="super-effective-text animate-super-effective">
            <span
              className={cn(
                "text-lg sm:text-xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
                effectiveness >= 4 ? "text-red-500" : "text-green-400",
              )}
            >
              {effectiveness >= 4 ? "ULTRA EFFECTIVE!" : "SUPER EFFECTIVE!"}
            </span>
          </div>
        </div>
      )}

      {/* Not very effective */}
      {effectiveness > 0 && effectiveness < 1 && showEffect && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-fade-in">
            <span className="text-sm sm:text-base font-bold text-orange-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Not very effective...
            </span>
          </div>
        </div>
      )}

      {/* No effect */}
      {effectiveness === 0 && showEffect && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-fade-in">
            <span className="text-sm sm:text-base font-bold text-gray-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              No effect...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Screen shake component
export function ScreenShake({
  isActive,
  intensity = "normal",
}: {
  isActive: boolean;
  intensity?: "light" | "normal" | "heavy";
}) {
  if (!isActive) return null;

  const intensityClass = {
    light: "animate-shake-light",
    normal: "animate-shake",
    heavy: "animate-shake-heavy",
  }[intensity];

  return (
    <style>{`
      .battle-arena-container {
        animation: ${intensity === "heavy" ? "shake-heavy" : intensity === "light" ? "shake-light" : "shake"} 0.4s ease-in-out;
      }
    `}</style>
  );
}
