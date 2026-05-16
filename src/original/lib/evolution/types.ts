/**
 * Evolution Chain Types
 * Defines the tree model for Pokemon evolution chains
 */

// Raw evolution node from database
export interface EvolutionNodeDB {
  id: number;
  pokemon_id: number;
  evolves_to_pokemon_id: number;
  method_type: string;
  level: number | null;
  item_id: number | null;
  conditions_en: string | null;
  conditions_ar: string | null;
  game_id: string | null;
}

// Basic Pokemon info for evolution display
export interface PokemonBasic {
  id: number;
  name_en: string;
  name_ar: string;
  available_in?: string[] | null;
}

// Basic Item info for evolution items
export interface ItemBasic {
  id: number;
  name_en: string;
  name_ar: string;
}

// Evolution method labels
export const METHOD_LABELS: Record<string, { en: string; ar: string }> = {
  level: { en: "Level Up", ar: "رفع المستوى" },
  item: { en: "Use Item", ar: "استخدام غرض" },
  trade: { en: "Trade", ar: "التبادل" },
  friendship: { en: "High Friendship", ar: "صداقة عالية" },
  other: { en: "Special", ar: "خاص" },
};

// Evolution edge - connection between two Pokemon
export interface EvolutionEdge {
  fromId: number;
  toId: number;
  method_en: string;
  method_ar: string;
  methodType: string;
  level?: number | null;
  itemId?: number | null;
}

// Node in the evolution tree
export interface EvolutionTreeNode {
  pokemon: PokemonBasic;
  stage: number;
  evolvesFrom?: EvolutionEdge;
}

// A stage in the evolution chain (may contain multiple Pokemon for branching)
export type ChainStage = EvolutionTreeNode[];

// Full evolution chain
export interface EvolutionChain {
  stages: ChainStage[];
  hasBranching: boolean;
  totalPokemon: number;
}

// Lookup maps for O(1) access
export interface EvolutionMaps {
  pokemonById: Map<number, PokemonBasic>;
  itemById: Map<number, ItemBasic>;
  evolutionByFromId: Map<number, EvolutionNodeDB[]>;
  evolutionByToId: Map<number, EvolutionNodeDB[]>;
}
