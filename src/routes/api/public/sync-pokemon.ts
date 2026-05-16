// Server route to sync Pokémon data from PokéAPI into Lovable Cloud.
// Call: GET /api/public/sync-pokemon?offset=0&limit=50
// Idempotent — uses upsert by primary key.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TYPE_TRANSLATE: Record<string, string> = {
  normal: "عادي",
  fire: "نار",
  water: "ماء",
  electric: "كهرباء",
  grass: "نبات",
  ice: "جليد",
  fighting: "قتال",
  poison: "سم",
  ground: "أرض",
  flying: "طيران",
  psychic: "نفسي",
  bug: "حشرة",
  rock: "صخر",
  ghost: "شبح",
  dragon: "تنين",
  dark: "ظلام",
  steel: "فولاذ",
  fairy: "جنية",
};

function genFromId(id: number): number {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  return 9;
}

interface PokeApiPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  sprites: {
    front_default: string | null;
    other?: { "official-artwork"?: { front_default: string | null } };
  };
  species: { url: string };
}

interface PokeApiSpecies {
  id: number;
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }[];
  evolution_chain?: { url: string } | null;
}

interface ChainLink {
  species: { name: string; url: string };
  evolves_to: ChainLink[];
  evolution_details: {
    trigger: { name: string };
    min_level: number | null;
    item: { name: string } | null;
  }[];
}

interface PokeApiChain {
  id: number;
  chain: ChainLink;
}

function speciesIdFromUrl(url: string): number {
  const m = url.match(/\/pokemon-species\/(\d+)\/?$/);
  return m ? Number(m[1]) : 0;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

async function syncOne(id: number) {
  const poke = await fetchJson<PokeApiPokemon>(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const species = await fetchJson<PokeApiSpecies>(poke.species.url);

  const enEntry = species.flavor_text_entries.find((f) => f.language.name === "en") ?? null;

  const stats: Record<string, number> = {};
  for (const s of poke.stats) stats[s.stat.name] = s.base_stat;

  const types = poke.types.map((t) => t.type.name);
  const abilities = poke.abilities.map((a) => a.ability.name);

  const chainUrl = species.evolution_chain?.url ?? null;
  let chainId: number | null = null;
  if (chainUrl) {
    const m = chainUrl.match(/\/evolution-chain\/(\d+)\/?$/);
    chainId = m ? Number(m[1]) : null;
  }

  const nameEn = poke.name.charAt(0).toUpperCase() + poke.name.slice(1);
  const description_en = enEntry ? enEntry.flavor_text.replace(/[\f\n\r]/g, " ") : null;

  const row = {
    id: poke.id,
    name_en: nameEn,
    name_ar: nameEn, // PokéAPI doesn't ship Arabic names; use English transliteration
    types,
    generation: genFromId(poke.id),
    height: poke.height,
    weight: poke.weight,
    sprite_url: poke.sprites.front_default,
    artwork_url: poke.sprites.other?.["official-artwork"]?.front_default ?? null,
    stats,
    abilities,
    description_en,
    description_ar: description_en, // same; could be translated later
    evolution_chain_id: chainId,
  };

  await supabaseAdmin.from("pokemon").upsert(row);

  // Sync evolution chain (only when first encountered for this chain)
  if (chainId) {
    const { data: existing } = await supabaseAdmin
      .from("evolution_nodes")
      .select("id")
      .eq("chain_id", chainId)
      .limit(1);
    if (!existing || existing.length === 0) {
      try {
        const chain = await fetchJson<PokeApiChain>(chainUrl!);
        const edges: {
          chain_id: number;
          from_pokemon_id: number;
          to_pokemon_id: number;
          trigger: string | null;
          min_level: number | null;
          item: string | null;
        }[] = [];
        const walk = (link: ChainLink) => {
          const fromId = speciesIdFromUrl(link.species.url);
          for (const next of link.evolves_to) {
            const toId = speciesIdFromUrl(next.species.url);
            const det = next.evolution_details[0];
            edges.push({
              chain_id: chainId!,
              from_pokemon_id: fromId,
              to_pokemon_id: toId,
              trigger: det?.trigger?.name ?? null,
              min_level: det?.min_level ?? null,
              item: det?.item?.name ?? null,
            });
            walk(next);
          }
        };
        walk(chain.chain);
        if (edges.length > 0) {
          await supabaseAdmin
            .from("evolution_nodes")
            .upsert(edges, { onConflict: "from_pokemon_id,to_pokemon_id" });
        }
      } catch (e) {
        console.error(`Chain sync failed for ${chainId}`, e);
      }
    }
  }
}

export const Route = createFileRoute("/api/public/sync-pokemon")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10));
        const limit = Math.min(
          50,
          Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10)),
        );
        const max = Math.min(386, offset + limit);

        const errors: { id: number; error: string }[] = [];
        let synced = 0;
        for (let id = offset + 1; id <= max; id++) {
          try {
            await syncOne(id);
            synced++;
          } catch (e) {
            errors.push({ id, error: String(e) });
          }
        }
        // Reference Arabic translations to silence unused warning — kept for future use
        void TYPE_TRANSLATE;

        return Response.json({
          ok: true,
          from: offset + 1,
          to: max,
          synced,
          errors,
          nextOffset: max < 386 ? max : null,
        });
      },
    },
  },
});
