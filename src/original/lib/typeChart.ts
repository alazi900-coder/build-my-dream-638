// Pokemon type effectiveness chart
export const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export function calculateWeaknesses(types: string[]): {
  weaknesses: string[];
  resistances: string[];
  immunities: string[];
} {
  const allTypes = Object.keys(TYPE_CHART);
  const effectiveness: Record<string, number> = {};

  // Initialize all types with 1x effectiveness
  allTypes.forEach((type) => {
    effectiveness[type] = 1;
  });

  // Calculate combined effectiveness
  types.forEach((defenderType) => {
    allTypes.forEach((attackerType) => {
      const chart = TYPE_CHART[attackerType];
      if (chart && chart[defenderType.toLowerCase()] !== undefined) {
        effectiveness[attackerType] *= chart[defenderType.toLowerCase()];
      }
    });
  });

  const weaknesses: string[] = [];
  const resistances: string[] = [];
  const immunities: string[] = [];

  Object.entries(effectiveness).forEach(([type, value]) => {
    if (value === 0) {
      immunities.push(type);
    } else if (value > 1) {
      weaknesses.push(type);
    } else if (value < 1 && value > 0) {
      resistances.push(type);
    }
  });

  return { weaknesses, resistances, immunities };
}

export function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    normal: "bg-[hsl(60,10%,50%)]",
    fire: "bg-[hsl(25,90%,50%)]",
    water: "bg-[hsl(220,80%,55%)]",
    electric: "bg-[hsl(48,95%,50%)]",
    grass: "bg-[hsl(100,60%,45%)]",
    ice: "bg-[hsl(180,60%,70%)]",
    fighting: "bg-[hsl(0,70%,45%)]",
    poison: "bg-[hsl(290,60%,45%)]",
    ground: "bg-[hsl(40,60%,50%)]",
    flying: "bg-[hsl(255,70%,70%)]",
    psychic: "bg-[hsl(340,80%,55%)]",
    bug: "bg-[hsl(75,70%,40%)]",
    rock: "bg-[hsl(45,50%,40%)]",
    ghost: "bg-[hsl(265,40%,45%)]",
    dragon: "bg-[hsl(260,80%,55%)]",
    dark: "bg-[hsl(25,30%,30%)]",
    steel: "bg-[hsl(240,20%,60%)]",
    fairy: "bg-[hsl(330,60%,70%)]",
  };
  return colors[type.toLowerCase()] || "bg-muted";
}

// Returns text color class for WCAG AA contrast (4.5:1 ratio)
// Light backgrounds need dark text, dark backgrounds can use white text
export function getTypeTextColor(type: string): string {
  // Types that need dark text for sufficient contrast on their light backgrounds
  const darkTextTypes = [
    "normal", // hsl(60,10%,50%) - light olive
    "fire", // hsl(25,90%,50%) - bright orange
    "electric", // hsl(48,95%,50%) - bright yellow
    "grass", // hsl(100,60%,45%) - bright green
    "ice", // hsl(180,60%,70%) - light cyan
    "ground", // hsl(40,60%,50%) - tan/brown
    "flying", // hsl(255,70%,70%) - light purple
    "psychic", // hsl(340,80%,55%) - bright pink
    "bug", // hsl(75,70%,40%) - yellow-green
    "steel", // hsl(240,20%,60%) - light gray-blue
    "fairy", // hsl(330,60%,70%) - light pink
  ];

  if (darkTextTypes.includes(type.toLowerCase())) {
    return "text-[hsl(0,0%,10%)]"; // Very dark gray for contrast
  }
  return "text-[hsl(0,0%,100%)]"; // White for dark backgrounds
}
