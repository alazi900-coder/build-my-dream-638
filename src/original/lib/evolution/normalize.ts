/**
 * Evolution Chain Normalization
 * Creates lookup maps and normalizes evolution data
 */

import { EvolutionNodeDB, PokemonBasic, ItemBasic, EvolutionMaps, METHOD_LABELS } from "./types";

/**
 * Create O(1) lookup maps from arrays
 * Replaces O(n) .find() calls with O(1) Map.get()
 */
export function createEvolutionMaps(
  evolutionNodes: EvolutionNodeDB[],
  allPokemon: PokemonBasic[],
  items: ItemBasic[],
): EvolutionMaps {
  const pokemonById = new Map<number, PokemonBasic>();
  const itemById = new Map<number, ItemBasic>();
  const evolutionByFromId = new Map<number, EvolutionNodeDB[]>();
  const evolutionByToId = new Map<number, EvolutionNodeDB[]>();

  // Build Pokemon lookup - O(n) once
  for (const p of allPokemon) {
    pokemonById.set(p.id, p);
  }

  // Build Item lookup - O(n) once
  for (const i of items) {
    itemById.set(i.id, i);
  }

  // Build evolution lookups - O(n) once
  for (const node of evolutionNodes) {
    // By from (pokemon_id)
    if (!evolutionByFromId.has(node.pokemon_id)) {
      evolutionByFromId.set(node.pokemon_id, []);
    }
    evolutionByFromId.get(node.pokemon_id)!.push(node);

    // By to (evolves_to_pokemon_id)
    if (!evolutionByToId.has(node.evolves_to_pokemon_id)) {
      evolutionByToId.set(node.evolves_to_pokemon_id, []);
    }
    evolutionByToId.get(node.evolves_to_pokemon_id)!.push(node);
  }

  return { pokemonById, itemById, evolutionByFromId, evolutionByToId };
}

/**
 * Get localized evolution method text
 */
export function getEvolutionMethodText(
  node: EvolutionNodeDB,
  language: "en" | "ar",
  getItemName: (id: number | null) => string | null,
): { en: string; ar: string } {
  const methodLabel = METHOD_LABELS[node.method_type] || METHOD_LABELS.other;
  let textEn = methodLabel.en;
  let textAr = methodLabel.ar;

  if (node.method_type === "level" && node.level) {
    textEn = `Level ${node.level}`;
    textAr = `مستوى ${node.level}`;
  } else if (node.method_type === "item" && node.item_id) {
    const itemName = getItemName(node.item_id);
    if (itemName) {
      textEn = itemName;
      textAr = itemName;
    }
  }

  // Override with conditions if present
  if (node.conditions_en) {
    textEn = node.conditions_en;
  }
  if (node.conditions_ar) {
    textAr = node.conditions_ar;
  }

  return { en: textEn, ar: textAr };
}

/**
 * Find all Pokemon IDs in an evolution chain using DFS
 */
export function findAllRelatedPokemon(startId: number, maps: EvolutionMaps): Set<number> {
  const related = new Set<number>();
  const visited = new Set<number>();

  function dfs(pokemonId: number) {
    if (visited.has(pokemonId)) return;
    visited.add(pokemonId);
    related.add(pokemonId);

    // Find what this Pokemon evolves to
    const evolvesTo = maps.evolutionByFromId.get(pokemonId) || [];
    for (const node of evolvesTo) {
      dfs(node.evolves_to_pokemon_id);
    }

    // Find what evolves into this Pokemon
    const evolvesFrom = maps.evolutionByToId.get(pokemonId) || [];
    for (const node of evolvesFrom) {
      dfs(node.pokemon_id);
    }
  }

  dfs(startId);
  return related;
}

/**
 * Find root Pokemon (base forms) in a chain
 * A root is a Pokemon that doesn't evolve from anything in the chain
 */
export function findRootPokemon(relatedIds: Set<number>, maps: EvolutionMaps): number[] {
  const roots: number[] = [];

  for (const id of relatedIds) {
    const evolvesFrom = maps.evolutionByToId.get(id);
    // If nothing evolves into this Pokemon (within our chain), it's a root
    if (
      !evolvesFrom ||
      evolvesFrom.length === 0 ||
      !evolvesFrom.some((n) => relatedIds.has(n.pokemon_id))
    ) {
      roots.push(id);
    }
  }

  // Fallback: use smallest ID as root
  if (roots.length === 0 && relatedIds.size > 0) {
    roots.push(Math.min(...relatedIds));
  }

  return roots;
}
