
CREATE TABLE public.pokemon (
  id INTEGER PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  types TEXT[] NOT NULL DEFAULT '{}',
  generation INTEGER NOT NULL DEFAULT 1,
  height INTEGER NOT NULL DEFAULT 0,
  weight INTEGER NOT NULL DEFAULT 0,
  sprite_url TEXT,
  artwork_url TEXT,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  abilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  description_en TEXT,
  description_ar TEXT,
  evolution_chain_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pokemon_generation_idx ON public.pokemon(generation);
CREATE INDEX pokemon_types_idx ON public.pokemon USING GIN(types);
CREATE INDEX pokemon_chain_idx ON public.pokemon(evolution_chain_id);

CREATE TABLE public.evolution_nodes (
  id BIGSERIAL PRIMARY KEY,
  chain_id INTEGER NOT NULL,
  from_pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  to_pokemon_id INTEGER NOT NULL REFERENCES public.pokemon(id) ON DELETE CASCADE,
  trigger TEXT,
  min_level INTEGER,
  item TEXT,
  condition JSONB,
  UNIQUE (from_pokemon_id, to_pokemon_id)
);
CREATE INDEX evolution_chain_idx ON public.evolution_nodes(chain_id);
CREATE INDEX evolution_from_idx ON public.evolution_nodes(from_pokemon_id);

ALTER TABLE public.pokemon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pokemon" ON public.pokemon FOR SELECT USING (true);
CREATE POLICY "Public read evolutions" ON public.evolution_nodes FOR SELECT USING (true);
