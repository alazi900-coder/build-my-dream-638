// Public sync endpoint to report and fill missing game data.
// GET  /api/public/sync-data           -> report row counts
// POST /api/public/sync-data?action=moves|gyms|npcs|learnsets|encounters|all
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { localSeedData } from "@/original/data/seedData";

const ALL_GAMES = ["swsh", "letsgo", "arceus"];
const DATA_TABLES = [
  "pokemon",
  "moves",
  "items",
  "locations",
  "encounters",
  "gyms",
  "gym_roster",
  "npcs",
  "learnsets",
  "evolution_nodes",
  "games",
  "pokemon_held_items",
] as const;

const hasSupabaseAdminConfig = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function getFallbackCounts() {
  const out: Record<string, number> = {};
  for (const table of DATA_TABLES) {
    out[table] = localSeedData[table].length;
  }
  return out;
}

async function counts() {
  const fallback = getFallbackCounts();
  if (!hasSupabaseAdminConfig) {
    return { counts: fallback, source: "local-seed" };
  }

  const out: Record<string, number> = { ...fallback };
  try {
    for (const table of DATA_TABLES) {
      const { count, error } = await supabaseAdmin.from(table).select("*", {
        count: "exact",
        head: true,
      });
      if (error) throw error;
      out[table] = count ?? fallback[table] ?? 0;
    }
    return { counts: out, source: "supabase" };
  } catch (error) {
    console.warn("[sync-data] Falling back to bundled seed counts", error);
    return { counts: fallback, source: "local-seed" };
  }
}

type PokeApiMove = {
  id?: number;
  name?: string;
  effect_entries?: { language?: { name?: string }; short_effect?: string | null }[];
  type?: { name?: string } | null;
  damage_class?: { name?: string } | null;
  power?: number | null;
  accuracy?: number | null;
  pp?: number | null;
};

type PokeApiPokemon = {
  moves?: {
    move?: { name?: string; url?: string };
    version_group_details?: {
      level_learned_at?: number | null;
      move_learn_method?: { name?: string | null };
    }[];
  }[];
};

type PokeApiEncounter = {
  location_area?: { url?: string };
  version_details?: {
    encounter_details?: {
      min_level?: number | null;
      max_level?: number | null;
      chance?: number | null;
      method?: { name?: string | null };
    }[];
  }[];
};

type LearnsetRow = {
  pokemon_id: number;
  move_id: number;
  level: number | null;
  method: string | null;
  game_id: string;
};

type EncounterRow = {
  pokemon_id: number;
  location_id: number;
  min_level: number | null;
  max_level: number | null;
  rate: number | null;
  method: string | null;
  game_id: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json() as Promise<T>;
}

// ---------- MOVES ----------
async function syncMoves(limit = 250): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;
  for (let id = 1; id <= limit; id++) {
    try {
      const m = await fetchJson<PokeApiMove>(`https://pokeapi.co/api/v2/move/${id}`);
      const en = m.effect_entries?.find((e) => e.language?.name === "en");
      const name = (m.name ?? `move ${id}`).replace(/-/g, " ");
      const row = {
        id: m.id ?? id,
        name_en: name.charAt(0).toUpperCase() + name.slice(1),
        name_ar: name.charAt(0).toUpperCase() + name.slice(1),
        type: m.type?.name ?? null,
        category: m.damage_class?.name ?? null,
        power: m.power,
        accuracy: m.accuracy,
        pp: m.pp,
        effect_en: en?.short_effect ?? null,
        effect_ar: en?.short_effect ?? null,
        available_in: ALL_GAMES,
      };
      const { error } = await supabaseAdmin.from("moves").upsert(row);
      if (error) errors++;
      else inserted++;
    } catch {
      errors++;
    }
  }
  return { inserted, errors };
}

// ---------- LEARNSETS (for first 386 Pokémon) ----------
async function syncLearnsets(maxId = 151): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;
  for (let id = 1; id <= maxId; id++) {
    try {
      const p = await fetchJson<PokeApiPokemon>(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const rows: LearnsetRow[] = [];
      for (const m of p.moves ?? []) {
        const moveName = m.move?.name;
        if (!moveName) continue;
        const moveUrl = m.move?.url;
        const moveId = Number(moveUrl.match(/\/move\/(\d+)\//)?.[1] ?? 0);
        if (!moveId) continue;
        const det = m.version_group_details?.[0];
        rows.push({
          pokemon_id: id,
          move_id: moveId,
          level: det?.level_learned_at ?? null,
          method: det?.move_learn_method?.name ?? null,
          game_id: ALL_GAMES[0],
        });
      }
      if (rows.length) {
        const { error } = await supabaseAdmin.from("learnsets").insert(rows);
        if (error) errors++;
        else inserted += rows.length;
      }
    } catch {
      errors++;
    }
  }
  return { inserted, errors };
}

// ---------- GYMS (hardcoded per game) ----------
const GYMS_SEED = [
  // Let's Go (Kanto)
  {
    id: 1001,
    game: "letsgo",
    region: "Kanto",
    leader_en: "Brock",
    leader_ar: "بروك",
    city_en: "Pewter City",
    city_ar: "بيوتر",
    type: "rock",
    badge: 1,
  },
  {
    id: 1002,
    game: "letsgo",
    region: "Kanto",
    leader_en: "Misty",
    leader_ar: "ميستي",
    city_en: "Cerulean City",
    city_ar: "سيرولين",
    type: "water",
    badge: 2,
  },
  {
    id: 1003,
    game: "letsgo",
    region: "Kanto",
    leader_en: "Lt. Surge",
    leader_ar: "الملازم سيرج",
    city_en: "Vermilion City",
    city_ar: "فيرميليون",
    type: "electric",
    badge: 3,
  },
  {
    id: 1004,
    game: "letsgo",
    region: "Kanto",
    leader_en: "Erika",
    leader_ar: "إيريكا",
    city_en: "Celadon City",
    city_ar: "سيلادون",
    type: "grass",
    badge: 4,
  },
  {
    id: 1005,
    game: "letsgo",
    region: "Kanto",
    leader_en: "Koga",
    leader_ar: "كوغا",
    city_en: "Fuchsia City",
    city_ar: "فوكسيا",
    type: "poison",
    badge: 5,
  },
  {
    id: 1006,
    game: "letsgo",
    region: "Kanto",
    leader_en: "Sabrina",
    leader_ar: "سابرينا",
    city_en: "Saffron City",
    city_ar: "سافرون",
    type: "psychic",
    badge: 6,
  },
  {
    id: 1007,
    game: "letsgo",
    region: "Kanto",
    leader_en: "Blaine",
    leader_ar: "بلين",
    city_en: "Cinnabar Island",
    city_ar: "سينابار",
    type: "fire",
    badge: 7,
  },
  {
    id: 1008,
    game: "letsgo",
    region: "Kanto",
    leader_en: "Giovanni",
    leader_ar: "جيوفاني",
    city_en: "Viridian City",
    city_ar: "فيريديان",
    type: "ground",
    badge: 8,
  },
  // Sword/Shield (Galar)
  {
    id: 2001,
    game: "swsh",
    region: "Galar",
    leader_en: "Milo",
    leader_ar: "مايلو",
    city_en: "Turffield",
    city_ar: "ترفيلد",
    type: "grass",
    badge: 1,
  },
  {
    id: 2002,
    game: "swsh",
    region: "Galar",
    leader_en: "Nessa",
    leader_ar: "نيسا",
    city_en: "Hulbury",
    city_ar: "هالبري",
    type: "water",
    badge: 2,
  },
  {
    id: 2003,
    game: "swsh",
    region: "Galar",
    leader_en: "Kabu",
    leader_ar: "كابو",
    city_en: "Motostoke",
    city_ar: "موتوستوك",
    type: "fire",
    badge: 3,
  },
  {
    id: 2004,
    game: "swsh",
    region: "Galar",
    leader_en: "Bea / Allister",
    leader_ar: "بي / أليستر",
    city_en: "Stow-on-Side",
    city_ar: "ستو-أون-سايد",
    type: "fighting",
    badge: 4,
  },
  {
    id: 2005,
    game: "swsh",
    region: "Galar",
    leader_en: "Opal",
    leader_ar: "أوبال",
    city_en: "Ballonlea",
    city_ar: "بالونليا",
    type: "fairy",
    badge: 5,
  },
  {
    id: 2006,
    game: "swsh",
    region: "Galar",
    leader_en: "Gordie / Melony",
    leader_ar: "غوردي / ميلوني",
    city_en: "Circhester",
    city_ar: "سيرشيستر",
    type: "rock",
    badge: 6,
  },
  {
    id: 2007,
    game: "swsh",
    region: "Galar",
    leader_en: "Piers",
    leader_ar: "بيرز",
    city_en: "Spikemuth",
    city_ar: "سبايكموث",
    type: "dark",
    badge: 7,
  },
  {
    id: 2008,
    game: "swsh",
    region: "Galar",
    leader_en: "Raihan",
    leader_ar: "ريهان",
    city_en: "Hammerlocke",
    city_ar: "هامرلوك",
    type: "dragon",
    badge: 8,
  },
  // Legends Arceus (Hisui — wardens instead of gyms)
  {
    id: 3001,
    game: "arceus",
    region: "Hisui",
    leader_en: "Lian (Warden)",
    leader_ar: "ليان (حارس)",
    city_en: "Obsidian Fieldlands",
    city_ar: "حقول السبج",
    type: "normal",
    badge: 1,
  },
  {
    id: 3002,
    game: "arceus",
    region: "Hisui",
    leader_en: "Arezu (Warden)",
    leader_ar: "أريزو (حارس)",
    city_en: "Crimson Mirelands",
    city_ar: "المستنقعات القرمزية",
    type: "psychic",
    badge: 2,
  },
  {
    id: 3003,
    game: "arceus",
    region: "Hisui",
    leader_en: "Sabi (Warden)",
    leader_ar: "سابي (حارس)",
    city_en: "Cobalt Coastlands",
    city_ar: "سواحل الكوبالت",
    type: "water",
    badge: 3,
  },
  {
    id: 3004,
    game: "arceus",
    region: "Hisui",
    leader_en: "Mai (Warden)",
    leader_ar: "ماي (حارس)",
    city_en: "Coronet Highlands",
    city_ar: "مرتفعات كورونيت",
    type: "rock",
    badge: 4,
  },
  {
    id: 3005,
    game: "arceus",
    region: "Hisui",
    leader_en: "Gaeric (Warden)",
    leader_ar: "غيريك (حارس)",
    city_en: "Alabaster Icelands",
    city_ar: "أراضي المرمر الجليدية",
    type: "ice",
    badge: 5,
  },
];

async function seedGyms() {
  const rows = GYMS_SEED.map((g) => ({
    id: g.id,
    region: g.region,
    leader_name_en: g.leader_en,
    leader_name_ar: g.leader_ar,
    city_en: g.city_en,
    city_ar: g.city_ar,
    type: g.type,
    badge_order: g.badge,
    available_in: [g.game],
    challenge_en: `Defeat the ${g.type}-type leader ${g.leader_en}`,
    challenge_ar: `اهزم القائد ${g.leader_ar} المتخصص في نوع ${g.type}`,
    tips_en: `Bring Pokémon strong against ${g.type}-type.`,
    tips_ar: `أحضر بوكيمونات قوية ضد نوع ${g.type}.`,
  }));
  const { error } = await supabaseAdmin.from("gyms").upsert(rows);
  return { inserted: error ? 0 : rows.length, errors: error ? rows.length : 0 };
}

async function seedNpcs() {
  const rows = GYMS_SEED.map((g) => ({
    name_en: g.leader_en,
    name_ar: g.leader_ar,
    role_en: g.region === "Hisui" ? "Warden" : "Gym Leader",
    role_ar: g.region === "Hisui" ? "حارس" : "قائد صالة",
    location_id: null,
    image_url: null,
    game_id: g.game,
    available_in: [g.game],
  }));
  const { error } = await supabaseAdmin.from("npcs").insert(rows);
  return { inserted: error ? 0 : rows.length, errors: error ? rows.length : 0 };
}

// ---------- ENCOUNTERS (PokéAPI /pokemon/{id}/encounters) ----------
async function syncEncounters(maxId = 151): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;
  for (let pid = 1; pid <= maxId; pid++) {
    try {
      const list = await fetchJson<PokeApiEncounter[]>(
        `https://pokeapi.co/api/v2/pokemon/${pid}/encounters`,
      );
      const rows: EncounterRow[] = [];
      for (const loc of list) {
        const locUrl = loc.location_area?.url;
        const locId = Number(locUrl?.match(/\/location-area\/(\d+)\//)?.[1] ?? 0);
        if (!locId) continue;
        const det = loc.version_details?.[0]?.encounter_details?.[0];
        rows.push({
          pokemon_id: pid,
          location_id: locId,
          min_level: det?.min_level ?? null,
          max_level: det?.max_level ?? null,
          rate: det?.chance ?? null,
          method: det?.method?.name ?? null,
          game_id: ALL_GAMES[0],
        });
      }
      if (rows.length) {
        const { error } = await supabaseAdmin.from("encounters").insert(rows);
        if (error) errors++;
        else inserted += rows.length;
      }
    } catch {
      errors++;
    }
  }
  return { inserted, errors };
}

export const Route = createFileRoute("/api/public/sync-data")({
  server: {
    handlers: {
      GET: async () => {
        const report = await counts();
        const expected = getFallbackCounts();
        const missing: Record<string, number> = {};
        for (const key of Object.keys(expected)) {
          const required = Math.max(expected[key] ?? 0, report.counts[key] ?? 0);
          expected[key] = required;
          const missingCount = required - (report.counts[key] ?? 0);
          if (missingCount > 0) missing[key] = missingCount;
        }
        return Response.json({ ok: true, ...report, expected, missing });
      },
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const action = url.searchParams.get("action") ?? "all";
        const result: Record<string, unknown> = {};
        try {
          if (!hasSupabaseAdminConfig) {
            const report = await counts();
            return Response.json({
              ok: true,
              action,
              result: {
                [action]: { inserted: 0, errors: 0, source: "local-seed" },
              },
              counts: report.counts,
              source: report.source,
            });
          }

          if (action === "moves" || action === "all") {
            const limit = Number(url.searchParams.get("limit") ?? "200");
            result.moves = await syncMoves(Math.min(400, limit));
          }
          if (action === "gyms" || action === "all") {
            result.gyms = await seedGyms();
          }
          if (action === "npcs" || action === "all") {
            result.npcs = await seedNpcs();
          }
          if (action === "learnsets") {
            const limit = Number(url.searchParams.get("limit") ?? "50");
            result.learnsets = await syncLearnsets(Math.min(151, limit));
          }
          if (action === "encounters") {
            const limit = Number(url.searchParams.get("limit") ?? "50");
            result.encounters = await syncEncounters(Math.min(151, limit));
          }
          const after = await counts();
          return Response.json({
            ok: true,
            action,
            result,
            counts: after.counts,
            source: after.source,
          });
        } catch (e) {
          return Response.json({ ok: false, error: String(e), result }, { status: 500 });
        }
      },
    },
  },
});
