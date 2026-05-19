
-- Add available_in column to existing pokemon table
ALTER TABLE public.pokemon ADD COLUMN IF NOT EXISTS available_in text[] DEFAULT '{}'::text[];

-- Moves
CREATE TABLE IF NOT EXISTS public.moves (
  id integer PRIMARY KEY,
  name_en text NOT NULL,
  name_ar text,
  type text,
  category text,
  power integer,
  accuracy integer,
  pp integer,
  effect_en text,
  effect_ar text,
  available_in text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_moves" ON public.moves FOR SELECT USING (true);
CREATE POLICY "public_write_moves" ON public.moves FOR ALL USING (true) WITH CHECK (true);

-- Items
CREATE TABLE IF NOT EXISTS public.items (
  id integer PRIMARY KEY,
  name_en text NOT NULL,
  name_ar text,
  category text,
  effect_en text,
  effect_ar text,
  usage_en text,
  usage_ar text,
  obtain jsonb DEFAULT '[]'::jsonb,
  available_in text[] DEFAULT '{}'::text[],
  sprite_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_items" ON public.items FOR SELECT USING (true);
CREATE POLICY "public_write_items" ON public.items FOR ALL USING (true) WITH CHECK (true);

-- Locations
CREATE TABLE IF NOT EXISTS public.locations (
  id integer PRIMARY KEY,
  name_en text NOT NULL,
  name_ar text,
  region text,
  map_data jsonb DEFAULT '{}'::jsonb,
  notes_en text,
  notes_ar text,
  map_image_url text,
  available_in text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "public_write_locations" ON public.locations FOR ALL USING (true) WITH CHECK (true);

-- Encounters
CREATE TABLE IF NOT EXISTS public.encounters (
  id bigserial PRIMARY KEY,
  location_id integer,
  pokemon_id integer,
  method text,
  rate integer,
  min_level integer,
  max_level integer,
  game_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_encounters" ON public.encounters FOR SELECT USING (true);
CREATE POLICY "public_write_encounters" ON public.encounters FOR ALL USING (true) WITH CHECK (true);

-- Gyms
CREATE TABLE IF NOT EXISTS public.gyms (
  id integer PRIMARY KEY,
  city_en text,
  city_ar text,
  leader_name_en text,
  leader_name_ar text,
  type text,
  challenge_en text,
  challenge_ar text,
  tips_en text,
  tips_ar text,
  badge_order integer,
  available_in text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_gyms" ON public.gyms FOR SELECT USING (true);
CREATE POLICY "public_write_gyms" ON public.gyms FOR ALL USING (true) WITH CHECK (true);

-- Gym Roster
CREATE TABLE IF NOT EXISTS public.gym_roster (
  id bigserial PRIMARY KEY,
  gym_id integer,
  pokemon_id integer,
  level integer,
  moves jsonb DEFAULT '[]'::jsonb,
  game_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gym_roster ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_gym_roster" ON public.gym_roster FOR SELECT USING (true);
CREATE POLICY "public_write_gym_roster" ON public.gym_roster FOR ALL USING (true) WITH CHECK (true);

-- NPCs
CREATE TABLE IF NOT EXISTS public.npcs (
  id bigserial PRIMARY KEY,
  name_en text,
  name_ar text,
  role_en text,
  role_ar text,
  location_id integer,
  image_url text,
  game_id text,
  available_in text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_npcs" ON public.npcs FOR SELECT USING (true);
CREATE POLICY "public_write_npcs" ON public.npcs FOR ALL USING (true) WITH CHECK (true);

-- Learnsets
CREATE TABLE IF NOT EXISTS public.learnsets (
  id bigserial PRIMARY KEY,
  pokemon_id integer,
  move_id integer,
  level integer,
  method text,
  game_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.learnsets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_learnsets" ON public.learnsets FOR SELECT USING (true);
CREATE POLICY "public_write_learnsets" ON public.learnsets FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_learnsets_pokemon ON public.learnsets(pokemon_id);

-- Games (metadata)
CREATE TABLE IF NOT EXISTS public.games (
  id text PRIMARY KEY,
  name_en text,
  name_ar text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_games" ON public.games FOR SELECT USING (true);
CREATE POLICY "public_write_games" ON public.games FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.games(id, name_en, name_ar) VALUES
  ('swsh','Sword & Shield','السيف والدرع'),
  ('letsgo','Let''s Go','لتس غو'),
  ('arceus','Legends Arceus','أساطير أرسيوس')
ON CONFLICT (id) DO NOTHING;

-- Comparison presets
CREATE TABLE IF NOT EXISTS public.comparison_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pokemon_a_id integer,
  pokemon_a_level integer,
  pokemon_a_moves jsonb DEFAULT '[]'::jsonb,
  pokemon_b_id integer,
  pokemon_b_level integer,
  pokemon_b_moves jsonb DEFAULT '[]'::jsonb,
  game_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comparison_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_presets" ON public.comparison_presets FOR SELECT USING (true);
CREATE POLICY "public_write_presets" ON public.comparison_presets FOR ALL USING (true) WITH CHECK (true);
