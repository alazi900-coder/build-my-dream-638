export interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  abilities: Ability[];
  stats: Stats;
  evolution: EvolutionData | null;
  notes_en: string | null;
  notes_ar: string | null;
  tags: string[];
  is_legendary?: boolean;
  is_starter?: boolean;
  created_at?: string;
}

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface Ability {
  name_en: string;
  name_ar: string;
  is_hidden: boolean;
}

export interface EvolutionData {
  stage: number;
  chain: EvolutionStep[];
}

export interface EvolutionStep {
  pokemon_id: number;
  name_en: string;
  name_ar: string;
  method_en: string;
  method_ar: string;
}

export interface Move {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  category: "physical" | "special" | "status";
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect_en: string | null;
  effect_ar: string | null;
  learnset: LearnsetEntry[];
  created_at?: string;
}

export interface LearnsetEntry {
  pokemon_id: number;
  method: "level" | "tm" | "egg" | "tutor";
  level?: number;
}

export interface Item {
  id: number;
  name_en: string;
  name_ar: string;
  category: string;
  effect_en: string | null;
  effect_ar: string | null;
  usage_en: string | null;
  usage_ar: string | null;
  obtain: ObtainLocation[];
  created_at?: string;
}

export interface ObtainLocation {
  location_en: string;
  location_ar: string;
  method_en: string;
  method_ar: string;
}

export interface Location {
  id: number;
  name_en: string;
  name_ar: string;
  region: string;
  map_data: MapData | null;
  notes_en: string | null;
  notes_ar: string | null;
  created_at?: string;
}

export interface MapData {
  zone_id: string;
  coordinates?: { x: number; y: number };
}

export interface Encounter {
  id: number;
  pokemon_id: number;
  location_id: number;
  method: string;
  min_lvl: number;
  max_lvl: number;
  chance: number;
  time_of_day: string | null;
  weather: string | null;
  version: string | null;
  created_at?: string;
}

export interface Gym {
  id: number;
  city_en: string;
  city_ar: string;
  leader_name_en: string;
  leader_name_ar: string;
  type: string;
  challenge_en: string | null;
  challenge_ar: string | null;
  tips_en: string | null;
  tips_ar: string | null;
  badge_order: number;
  created_at?: string;
}

export interface GymRoster {
  id: number;
  gym_id: number;
  pokemon_id: number;
  level: number;
  moves: string[];
  created_at?: string;
}

export interface NPC {
  id: number;
  name_en: string;
  name_ar: string;
  role_en: string;
  role_ar: string;
  category: "gym_leader" | "champion" | "rival" | "professor" | "villain" | "important";
  location_en: string;
  location_ar: string;
  story_en: string | null;
  story_ar: string | null;
  image_url: string | null;
  badge_order: number;
  specialty_type: string | null;
  created_at?: string;
}

export interface PokemonHeldItem {
  id: number;
  pokemon_id: number;
  item_id: number;
  hold_chance: number;
  game_id: string;
  created_at?: string;
}
