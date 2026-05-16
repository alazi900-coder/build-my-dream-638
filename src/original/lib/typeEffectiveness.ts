// Centralized Type Effectiveness Service
// All type calculations should use this module

export const ALL_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type PokemonType = (typeof ALL_TYPES)[number];

// Defense chart: defenseChart[attackerType][defenderType] = multiplier
// E.g., defenseChart['fire']['grass'] = 2 means Fire attacks deal 2x to Grass
const defenseChart: Record<string, Record<string, number>> = {
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

/**
 * Get the damage multiplier when attackerType attacks a Pokémon with defenderTypes
 * Returns: 0, 0.25, 0.5, 1, 2, or 4
 */
export function getDefensiveMultiplier(attackerType: string, defenderTypes: string[]): number {
  let multiplier = 1;
  const attacker = attackerType.toLowerCase();

  for (const defType of defenderTypes) {
    const defender = defType.toLowerCase();
    const chart = defenseChart[attacker];
    if (chart && chart[defender] !== undefined) {
      multiplier *= chart[defender];
    }
  }

  return multiplier;
}

/**
 * Get full defensive matchup for a Pokémon with given types
 * Returns multiplier for each attacking type
 */
export function getFullDefensiveMatchup(pokemonTypes: string[]): Record<string, number> {
  const matchup: Record<string, number> = {};

  for (const attackerType of ALL_TYPES) {
    matchup[attackerType] = getDefensiveMultiplier(attackerType, pokemonTypes);
  }

  return matchup;
}

export interface TeamDefensiveAnalysis {
  // For each attacking type, how many team members take each multiplier
  heatmap: Record<
    string,
    {
      immune: number; // 0x
      quad_resist: number; // 0.25x
      resist: number; // 0.5x
      neutral: number; // 1x
      weak: number; // 2x
      quad_weak: number; // 4x
    }
  >;
  // Top threatening types (sorted by danger)
  threats: {
    type: string;
    score: number; // Higher = more dangerous
    weakCount: number;
    quadWeakCount: number;
    resistCount: number;
    immuneCount: number;
    affectedPokemon: string[]; // Names of Pokémon weak to this type
  }[];
  // Types the team is strong against
  coveredTypes: string[];
}

interface PokemonForAnalysis {
  name_en: string;
  name_ar: string;
  types: string[];
}

/**
 * Analyze a team's defensive type coverage
 */
export function analyzeTeamDefense(team: PokemonForAnalysis[]): TeamDefensiveAnalysis {
  const heatmap: TeamDefensiveAnalysis["heatmap"] = {};
  const threatData: Record<
    string,
    {
      weakCount: number;
      quadWeakCount: number;
      resistCount: number;
      quadResistCount: number;
      immuneCount: number;
      affectedPokemon: string[];
    }
  > = {};

  // Initialize
  for (const type of ALL_TYPES) {
    heatmap[type] = {
      immune: 0,
      quad_resist: 0,
      resist: 0,
      neutral: 0,
      weak: 0,
      quad_weak: 0,
    };
    threatData[type] = {
      weakCount: 0,
      quadWeakCount: 0,
      resistCount: 0,
      quadResistCount: 0,
      immuneCount: 0,
      affectedPokemon: [],
    };
  }

  // Analyze each team member
  for (const pokemon of team) {
    const matchup = getFullDefensiveMatchup(pokemon.types);

    for (const [attackerType, multiplier] of Object.entries(matchup)) {
      const h = heatmap[attackerType];
      const t = threatData[attackerType];

      if (multiplier === 0) {
        h.immune++;
        t.immuneCount++;
      } else if (multiplier === 0.25) {
        h.quad_resist++;
        t.quadResistCount++;
      } else if (multiplier === 0.5) {
        h.resist++;
        t.resistCount++;
      } else if (multiplier === 1) {
        h.neutral++;
      } else if (multiplier === 2) {
        h.weak++;
        t.weakCount++;
        t.affectedPokemon.push(pokemon.name_en);
      } else if (multiplier === 4) {
        h.quad_weak++;
        t.quadWeakCount++;
        t.affectedPokemon.push(pokemon.name_en);
      }
    }
  }

  // Calculate threat scores and sort
  const threats: TeamDefensiveAnalysis["threats"] = [];

  for (const type of ALL_TYPES) {
    const data = threatData[type];
    // Score: 4x weakness counts double, resistances reduce score, immunities reduce more
    const score =
      data.quadWeakCount * 3 +
      data.weakCount * 2 -
      data.resistCount * 0.5 -
      data.quadResistCount * 1 -
      data.immuneCount * 2;

    if (data.weakCount > 0 || data.quadWeakCount > 0) {
      threats.push({
        type,
        score,
        weakCount: data.weakCount,
        quadWeakCount: data.quadWeakCount,
        resistCount: data.resistCount + data.quadResistCount,
        immuneCount: data.immuneCount,
        affectedPokemon: data.affectedPokemon,
      });
    }
  }

  threats.sort((a, b) => b.score - a.score);

  // Find well-covered types (at least 2 resistances or 1 immunity)
  const coveredTypes = ALL_TYPES.filter((type) => {
    const h = heatmap[type];
    return h.resist + h.quad_resist >= 2 || h.immune >= 1;
  });

  return { heatmap, threats: threats.slice(0, 5), coveredTypes };
}

/**
 * Get color class for a multiplier value
 */
export function getMultiplierColor(multiplier: number): string {
  if (multiplier === 0) return "bg-slate-600 text-slate-200";
  if (multiplier === 0.25) return "bg-green-700 text-green-100";
  if (multiplier === 0.5) return "bg-green-500 text-green-50";
  if (multiplier === 1) return "bg-muted text-muted-foreground";
  if (multiplier === 2) return "bg-orange-500 text-orange-50";
  if (multiplier === 4) return "bg-red-600 text-red-50";
  return "bg-muted";
}

/**
 * Get label for a multiplier value
 */
export function getMultiplierLabel(multiplier: number): string {
  if (multiplier === 0) return "×0";
  if (multiplier === 0.25) return "×¼";
  if (multiplier === 0.5) return "×½";
  if (multiplier === 1) return "×1";
  if (multiplier === 2) return "×2";
  if (multiplier === 4) return "×4";
  return `×${multiplier}`;
}

/**
 * Get type color for badges
 */
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

/**
 * Find Pokémon that help cover team weaknesses
 */
export function findCoveringPokemon(
  team: PokemonForAnalysis[],
  allPokemon: (PokemonForAnalysis & { id: number; available_in?: string[] })[],
  threateningTypes: string[],
  selectedGame: string,
  limit: number = 5,
): (PokemonForAnalysis & { id: number; coversTypes: string[]; score: number })[] {
  const teamIds = new Set(team.map((p, i) => i));

  const candidates = allPokemon
    .filter((p) => {
      // Not already in team
      if (team.some((t) => t.name_en === p.name_en)) return false;
      // Available in selected game
      if (selectedGame !== "all") {
        if (!p.available_in || !p.available_in.includes(selectedGame)) return false;
      }
      return true;
    })
    .map((p) => {
      const matchup = getFullDefensiveMatchup(p.types);
      const coversTypes: string[] = [];
      let score = 0;

      for (const threatType of threateningTypes) {
        const mult = matchup[threatType];
        if (mult === 0) {
          coversTypes.push(threatType);
          score += 3;
        } else if (mult <= 0.5) {
          coversTypes.push(threatType);
          score += mult === 0.25 ? 2 : 1;
        }
      }

      return { ...p, coversTypes, score };
    })
    .filter((p) => p.coversTypes.length > 0)
    .sort((a, b) => b.score - a.score);

  return candidates.slice(0, limit);
}
