import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { LOCAL_POKEMON, getLocalPokemonDetail } from "@/lib/pokemon-data";
import { z } from "zod";

export interface PokemonRow {
  id: number;
  name_en: string;
  name_ar: string | null;
  types: string[];
  generation: number;
  height: number;
  weight: number;
  sprite_url: string | null;
  artwork_url: string | null;
  stats: Record<string, number>;
  abilities: string[];
  description_en: string | null;
  description_ar: string | null;
  evolution_chain_id: number | null;
}

export interface EvolutionRow {
  id: number;
  chain_id: number;
  from_pokemon_id: number;
  to_pokemon_id: number;
  trigger: string | null;
  min_level: number | null;
  item: string | null;
}

function normalizeStats(stats: unknown): Record<string, number> {
  if (!stats || typeof stats !== "object") return {};
  return stats as Record<string, number>;
}

function normalizeAbilities(a: unknown): string[] {
  if (!Array.isArray(a)) return [];
  return a.filter((x): x is string => typeof x === "string");
}

export const listPokemon = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from("pokemon")
      .select("*")
      .order("id", { ascending: true })
      .limit(1000);
    if (error || !data || data.length === 0) return LOCAL_POKEMON;
    return data.map(
      (p): PokemonRow => ({
        id: p.id,
        name_en: p.name_en,
        name_ar: p.name_ar,
        types: p.types ?? [],
        generation: p.generation,
        height: p.height,
        weight: p.weight,
        sprite_url: p.sprite_url,
        artwork_url: p.artwork_url,
        stats: normalizeStats(p.stats),
        abilities: normalizeAbilities(p.abilities),
        description_en: p.description_en,
        description_ar: p.description_ar,
        evolution_chain_id: p.evolution_chain_id,
      }),
    );
  } catch {
    return LOCAL_POKEMON;
  }
});

export const getPokemon = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data }) => {
    try {
      const { data: p, error } = await supabaseAdmin
        .from("pokemon")
        .select("*")
        .eq("id", data.id)
        .maybeSingle();
      if (error || !p) return getLocalPokemonDetail(data.id);
      const row: PokemonRow = {
        id: p.id,
        name_en: p.name_en,
        name_ar: p.name_ar,
        types: p.types ?? [],
        generation: p.generation,
        height: p.height,
        weight: p.weight,
        sprite_url: p.sprite_url,
        artwork_url: p.artwork_url,
        stats: normalizeStats(p.stats),
        abilities: normalizeAbilities(p.abilities),
        description_en: p.description_en,
        description_ar: p.description_ar,
        evolution_chain_id: p.evolution_chain_id,
      };

      let evolutions: EvolutionRow[] = [];
      let chainPokemon: PokemonRow[] = [];
      if (row.evolution_chain_id != null) {
        const [{ data: evos }, { data: chainList }] = await Promise.all([
          supabaseAdmin.from("evolution_nodes").select("*").eq("chain_id", row.evolution_chain_id),
          supabaseAdmin
            .from("pokemon")
            .select("*")
            .eq("evolution_chain_id", row.evolution_chain_id),
        ]);
        evolutions = (evos ?? []).map((e) => ({
          id: Number(e.id),
          chain_id: e.chain_id,
          from_pokemon_id: e.from_pokemon_id,
          to_pokemon_id: e.to_pokemon_id,
          trigger: e.trigger,
          min_level: e.min_level,
          item: e.item,
        }));
        chainPokemon = (chainList ?? []).map((cp) => ({
          id: cp.id,
          name_en: cp.name_en,
          name_ar: cp.name_ar,
          types: cp.types ?? [],
          generation: cp.generation,
          height: cp.height,
          weight: cp.weight,
          sprite_url: cp.sprite_url,
          artwork_url: cp.artwork_url,
          stats: normalizeStats(cp.stats),
          abilities: normalizeAbilities(cp.abilities),
          description_en: cp.description_en,
          description_ar: cp.description_ar,
          evolution_chain_id: cp.evolution_chain_id,
        }));
      }
      return { pokemon: row, evolutions, chainPokemon };
    } catch {
      return getLocalPokemonDetail(data.id);
    }
  });

export const countPokemon = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { count, error } = await supabaseAdmin
      .from("pokemon")
      .select("id", { count: "exact", head: true });
    if (error || !count) return { count: LOCAL_POKEMON.length };
    return { count };
  } catch {
    return { count: LOCAL_POKEMON.length };
  }
});
