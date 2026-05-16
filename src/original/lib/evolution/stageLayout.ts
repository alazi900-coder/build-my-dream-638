/**
 * Evolution Chain Stage Layout
 * Uses BFS to build staged evolution chains supporting branching
 */

import {
  EvolutionNodeDB,
  PokemonBasic,
  ItemBasic,
  EvolutionMaps,
  EvolutionChain,
  EvolutionTreeNode,
  ChainStage,
} from "./types";
import {
  createEvolutionMaps,
  findAllRelatedPokemon,
  findRootPokemon,
  getEvolutionMethodText,
} from "./normalize";
import { getLocalizedName } from "@/original/lib/localization";

/**
 * Build complete evolution chain for a Pokemon using BFS
 * Supports branching evolutions (like Eevee) with proper stage grouping
 */
export function buildEvolutionChain(
  pokemonId: number,
  currentPokemon: PokemonBasic,
  evolutionNodes: EvolutionNodeDB[],
  allPokemon: PokemonBasic[],
  items: ItemBasic[],
  language: "en" | "ar",
): EvolutionChain | null {
  // Need at least Pokemon data
  if (allPokemon.length === 0) {
    return null;
  }

  // Create O(1) lookup maps
  const maps = createEvolutionMaps(evolutionNodes, allPokemon, items);

  // Helper to get item name
  const getItemName = (id: number | null): string | null => {
    if (!id) return null;
    const item = maps.itemById.get(id);
    if (!item) return null;
    return getLocalizedName(item.name_en, item.name_ar, language);
  };

  // Check if this Pokemon has any evolution data
  const hasEvolution = evolutionNodes.some(
    (n) => n.pokemon_id === pokemonId || n.evolves_to_pokemon_id === pokemonId,
  );

  if (!hasEvolution) {
    return { stages: [], hasBranching: false, totalPokemon: 1 };
  }

  // Find all related Pokemon in the chain
  const relatedIds = findAllRelatedPokemon(pokemonId, maps);

  if (relatedIds.size === 0) {
    relatedIds.add(pokemonId);
  }

  // Get relevant evolution nodes for this chain
  const chainNodes = evolutionNodes.filter(
    (n) => relatedIds.has(n.pokemon_id) || relatedIds.has(n.evolves_to_pokemon_id),
  );

  // Find root Pokemon
  const roots = findRootPokemon(relatedIds, maps);

  // BFS to build stages
  const stages = new Map<number, ChainStage>();
  const pokemonStage = new Map<number, number>();
  const processedPokemon = new Set<string>(); // "stage-id" to avoid duplicates

  // Initialize roots at stage 0
  for (const rootId of roots) {
    const poke = maps.pokemonById.get(rootId) || currentPokemon;
    const key = `0-${rootId}`;

    if (!processedPokemon.has(key)) {
      if (!stages.has(0)) stages.set(0, []);
      stages.get(0)!.push({
        pokemon: poke,
        stage: 0,
      });
      processedPokemon.add(key);
      pokemonStage.set(rootId, 0);
    }
  }

  // BFS queue
  const queue = [...roots];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentStageNum = pokemonStage.get(currentId) || 0;

    // Get all evolutions from this Pokemon - O(1) lookup
    const evolutions = maps.evolutionByFromId.get(currentId) || [];
    const seenTargets = new Set<number>();

    for (const node of evolutions) {
      const nextId = node.evolves_to_pokemon_id;

      // Skip duplicates from same source
      if (seenTargets.has(nextId)) continue;
      seenTargets.add(nextId);

      // Skip if already assigned a stage
      if (pokemonStage.has(nextId)) continue;

      const nextStage = currentStageNum + 1;
      pokemonStage.set(nextId, nextStage);

      const poke = maps.pokemonById.get(nextId);
      if (poke) {
        if (!stages.has(nextStage)) stages.set(nextStage, []);

        const method = getEvolutionMethodText(node, language, getItemName);
        const key = `${nextStage}-${nextId}`;

        if (!processedPokemon.has(key)) {
          stages.get(nextStage)!.push({
            pokemon: poke,
            stage: nextStage,
            evolvesFrom: {
              fromId: currentId,
              toId: nextId,
              method_en: method.en,
              method_ar: method.ar,
              methodType: node.method_type,
              level: node.level,
              itemId: node.item_id,
            },
          });
          processedPokemon.add(key);
        }
      }

      queue.push(nextId);
    }
  }

  // Convert to array sorted by stage
  const maxStage = Math.max(...pokemonStage.values(), 0);
  const stageArray: ChainStage[] = [];

  for (let i = 0; i <= maxStage; i++) {
    stageArray.push(stages.get(i) || []);
  }

  // Check for branching (more than 1 Pokemon in any stage after first)
  const hasBranching = stageArray.some((stage, idx) => idx > 0 && stage.length > 1);
  const totalPokemon = stageArray.reduce((acc, stage) => acc + stage.length, 0);

  return { stages: stageArray, hasBranching, totalPokemon };
}

/**
 * Type guard to check if evolution data is available
 */
export function hasEvolutionData(chain: EvolutionChain | null): chain is EvolutionChain {
  return chain !== null && chain.stages.length > 0 && chain.totalPokemon > 1;
}
