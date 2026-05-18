-- Add missing tables: moves, items, locations, encounters, gyms, gym_roster, npcs, learnsets, games, pokemon_held_items

-- Moves table
CREATE TABLE IF NOT EXISTS public.moves (
  id INTEGER PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  type TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  power INTEGER,
  accuracy INTEGER,
  pp INTEGER NOT NULL DEFAULT 0,
  effect_en TEXT,
  effect_ar TEXT,
  learnset JSONB DEFAULT '[]'::jsonb,
  available_in TEXT[] DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS moves_type_idx ON public.moves(type);
CREATE INDEX IF NOT EXISTS moves_category_idx ON public.moves(category);

-- Items table
CREATE TABLE IF NOT EXISTS public.items (
  id INTEGER PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  category TEXT NOT NULL DEFAULT '',
  effect_en TEXT,
  effect_ar TEXT,
  usage_en TEXT,
  usage_ar TEXT,
  obtain JSONB DEFAULT '[]'::jsonb,
  available_in TEXT[] DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS items_category_idx ON public.items(category);

-- Locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id INTEGER PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  region TEXT NOT NULL DEFAULT '',
  map_data JSONB DEFAULT '{}'::jsonb,
  notes_en TEXT,
  notes_ar TEXT,
  map_image_url TEXT,
  available_in TEXT[] DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS locations_region_idx ON public.locations(region);

-- Encounters table
CREATE TABLE IF NOT EXISTS public.encounters (
  id BIGSERIAL PRIMARY KEY,
  pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT '',
  min_lvl INTEGER NOT NULL DEFAULT 1,
  max_lvl INTEGER NOT NULL DEFAULT 1,
  chance INTEGER NOT NULL DEFAULT 0,
  time_of_day TEXT,
  weather TEXT,
  version TEXT
);
CREATE INDEX IF NOT EXISTS encounters_pokemon_idx ON public.encounters(pokemon_id);
CREATE INDEX IF NOT EXISTS encounters_location_idx ON public.encounters(location_id);

-- Gyms table
CREATE TABLE IF NOT EXISTS public.gyms (
  id INTEGER PRIMARY KEY,
  game_id TEXT,
  city_en TEXT NOT NULL,
  city_ar TEXT,
  leader_name_en TEXT NOT NULL,
  leader_name_ar TEXT,
  type TEXT NOT NULL DEFAULT '',
  challenge_en TEXT,
  challenge_ar TEXT,
  tips_en TEXT,
  tips_ar TEXT,
  badge_order INTEGER NOT NULL DEFAULT 0,
  available_in TEXT[] DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS gyms_type_idx ON public.gyms(type);

-- Gym roster table
CREATE TABLE IF NOT EXISTS public.gym_roster (
  id BIGSERIAL PRIMARY KEY,
  gym_id INTEGER NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  moves JSONB DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS gym_roster_gym_idx ON public.gym_roster(gym_id);

-- NPCs table
CREATE TABLE IF NOT EXISTS public.npcs (
  id INTEGER PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  role_en TEXT NOT NULL DEFAULT '',
  role_ar TEXT,
  category TEXT NOT NULL DEFAULT '',
  location_en TEXT NOT NULL DEFAULT '',
  location_ar TEXT,
  story_en TEXT,
  story_ar TEXT,
  image_url TEXT,
  badge_order INTEGER,
  specialty_type TEXT
);
CREATE INDEX IF NOT EXISTS npcs_category_idx ON public.npcs(category);

-- Learnsets table
CREATE TABLE IF NOT EXISTS public.learnsets (
  id BIGSERIAL PRIMARY KEY,
  pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  move_id INTEGER NOT NULL REFERENCES public.moves(id) ON DELETE CASCADE,
  level INTEGER,
  learn_method TEXT NOT NULL DEFAULT '',
  game_id TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS learnsets_pokemon_idx ON public.learnsets(pokemon_id);
CREATE INDEX IF NOT EXISTS learnsets_move_idx ON public.learnsets(move_id);

-- Games table
CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT
);

-- Pokemon held items table
CREATE TABLE IF NOT EXISTS public.pokemon_held_items (
  id BIGSERIAL PRIMARY KEY,
  pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  hold_chance INTEGER NOT NULL DEFAULT 0,
  game_id TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS held_items_pokemon_idx ON public.pokemon_held_items(pokemon_id);

-- Enable RLS on all new tables
ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learnsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pokemon_held_items ENABLE ROW LEVEL SECURITY;

-- Public read policies for all tables
CREATE POLICY "Public read moves" ON public.moves FOR SELECT USING (true);
CREATE POLICY "Public read items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Public read locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Public read encounters" ON public.encounters FOR SELECT USING (true);
CREATE POLICY "Public read gyms" ON public.gyms FOR SELECT USING (true);
CREATE POLICY "Public read gym_roster" ON public.gym_roster FOR SELECT USING (true);
CREATE POLICY "Public read npcs" ON public.npcs FOR SELECT USING (true);
CREATE POLICY "Public read learnsets" ON public.learnsets FOR SELECT USING (true);
CREATE POLICY "Public read games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Public read pokemon_held_items" ON public.pokemon_held_items FOR SELECT USING (true);

-- Evolution nodes table
CREATE TABLE IF NOT EXISTS public.evolution_nodes (
  id BIGSERIAL PRIMARY KEY,
  pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  evolves_to_pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL DEFAULT 'level',
  level INTEGER,
  item_id INTEGER REFERENCES public.items(id) ON DELETE SET NULL,
  conditions_en TEXT,
  conditions_ar TEXT,
  game_id TEXT
);
CREATE INDEX IF NOT EXISTS evolution_nodes_pokemon_idx ON public.evolution_nodes(pokemon_id);
CREATE INDEX IF NOT EXISTS evolution_nodes_target_idx ON public.evolution_nodes(evolves_to_pokemon_id);

ALTER TABLE public.evolution_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read evolution_nodes" ON public.evolution_nodes FOR SELECT USING (true);

-- Insert seed data for games
INSERT INTO public.games (id, name_en, name_ar) VALUES
  ('sword-shield', 'Pokémon Sword & Shield', 'بوكيمون سورد وشيلد'),
  ('lets-go', 'Pokémon Let''s Go', 'بوكيمون ليتس جو'),
  ('legends-arceus', 'Pokémon Legends: Arceus', 'بوكيمون ليجندز: أرسيوس')
ON CONFLICT (id) DO NOTHING;
