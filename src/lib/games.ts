// Game definitions + per-game Pokémon & Items.
// Pokémon IDs are restricted to the 1–386 range present in our database.

export type GameId = "all" | "letsgo" | "swsh" | "arceus" | "sv";

export interface GameInfo {
  id: GameId;
  labelEn: string;
  labelAr: string;
  fullNameEn: string;
  fullNameAr: string;
  accent: string; // tailwind color name for chip
}

export const GAMES: GameInfo[] = [
  {
    id: "all",
    labelEn: "All",
    labelAr: "الكل",
    fullNameEn: "All Games",
    fullNameAr: "جميع الألعاب",
    accent: "bg-primary",
  },
  {
    id: "letsgo",
    labelEn: "Let's Go",
    labelAr: "ليتس غو",
    fullNameEn: "Let's Go Pikachu/Eevee",
    fullNameAr: "ليتس غو بيكاتشو/إيفي",
    accent: "bg-yellow-500",
  },
  {
    id: "swsh",
    labelEn: "Sword/Shield",
    labelAr: "سورد/شيلد",
    fullNameEn: "Sword/Shield + DLC",
    fullNameAr: "سورد/شيلد + DLC",
    accent: "bg-blue-600",
  },
  {
    id: "arceus",
    labelEn: "Arceus",
    labelAr: "آرسيوس",
    fullNameEn: "Legends: Arceus",
    fullNameAr: "أساطير: آرسيوس",
    accent: "bg-emerald-600",
  },
  {
    id: "sv",
    labelEn: "Scarlet/Violet",
    labelAr: "سكارليت/فيوليت",
    fullNameEn: "Scarlet/Violet + DLC",
    fullNameAr: "سكارليت/فيوليت + DLC",
    accent: "bg-rose-600",
  },
];

// Per-game Pokémon ID lists (filtered to ids 1–386 available locally).
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export const GAME_POKEMON: Record<Exclude<GameId, "all">, number[]> = {
  // Let's Go: original Kanto 151.
  letsgo: range(1, 151),
  // Sword/Shield: includes Galar (>386) — within our data we expose the well-known Gen1–3 mons that appear in SwSh/DLC.
  swsh: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 25, 26, 52, 53, 58, 59, 66, 67, 68, 77, 78, 81, 82, 90, 91, 92, 93,
    94, 95, 104, 105, 108, 113, 115, 123, 131, 132, 133, 134, 135, 136, 137, 143, 147, 148, 149,
    150, 151, 155, 158, 161, 162, 163, 164, 170, 171, 175, 176, 179, 180, 181, 196, 197, 198, 199,
    200, 202, 206, 207, 208, 212, 213, 214, 215, 222, 223, 224, 228, 229, 233, 235, 239, 240, 241,
    242, 243, 244, 245, 248, 251, 252, 253, 254, 255, 256, 257, 261, 262, 263, 264, 270, 271, 272,
    273, 274, 275, 278, 279, 302, 303, 304, 305, 306, 328, 329, 330, 353, 354, 355, 356, 359, 371,
    372, 373, 374, 375, 376,
  ],
  // Legends: Arceus (Hisui) — curated subset of native + Hisuian Pokémon present in our dataset (≤386).
  arceus: [
    25, 35, 36, 37, 38, 39, 40, 41, 42, 46, 47, 54, 55, 58, 59, 63, 64, 65, 66, 67, 68, 72, 73, 77,
    78, 81, 82, 92, 93, 94, 100, 101, 113, 114, 118, 119, 120, 121, 129, 130, 133, 134, 135, 136,
    137, 143, 147, 148, 149, 151, 155, 156, 157, 170, 171, 172, 173, 175, 176, 179, 180, 181, 182,
    190, 191, 192, 194, 195, 196, 197, 198, 200, 201, 202, 206, 208, 209, 210, 211, 212, 215, 216,
    217, 220, 221, 225, 228, 229, 234, 235, 239, 242, 252, 253, 254, 255, 256, 257, 258, 259, 260,
    278, 279, 287, 288, 289, 304, 305, 306, 309, 310, 353, 354, 357, 366, 367, 368,
  ],
  // Scarlet/Violet (Paldea) — curated Gen1–3 favorites that return in Paldea/DLC.
  sv: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 25, 26, 35, 36, 37, 38, 52, 53, 58, 59, 77, 78, 81, 82, 90, 91, 92,
    93, 94, 104, 105, 108, 113, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135,
    136, 137, 143, 147, 148, 149, 150, 151, 158, 159, 160, 170, 171, 172, 179, 180, 181, 196, 197,
    200, 202, 203, 206, 212, 213, 214, 215, 224, 228, 229, 231, 232, 234, 242, 243, 244, 245, 249,
    250, 252, 253, 254, 255, 256, 257, 280, 281, 282, 287, 288, 289, 302, 303, 304, 305, 306, 309,
    310, 328, 329, 330, 355, 356, 359, 371, 372, 373, 374, 375, 376,
  ],
};

export function pokemonInGame(id: number, game: GameId): boolean {
  if (game === "all") return true;
  return GAME_POKEMON[game].includes(id);
}

// ---------------- ITEMS ----------------

export type ItemCategory =
  | "healing"
  | "balls"
  | "berries"
  | "evolution"
  | "held"
  | "tm"
  | "key"
  | "treasure";

export interface ItemDef {
  id: string; // e.g. "potion"
  spriteName: string; // PokéAPI item sprite name
  name_en: string;
  name_ar: string;
  category: ItemCategory;
  description_en: string;
  description_ar: string;
}

const ITEM_SPRITE = (name: string) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;

export function itemSprite(item: ItemDef) {
  return ITEM_SPRITE(item.spriteName);
}

// A shared library of items. Each game references item ids from here.
const ITEMS: Record<string, ItemDef> = {
  // Healing
  potion: {
    id: "potion",
    spriteName: "potion",
    name_en: "Potion",
    name_ar: "جرعة شفاء",
    category: "healing",
    description_en: "Restores 20 HP to a single Pokémon.",
    description_ar: "تستعيد 20 نقطة حياة لبوكيمون واحد.",
  },
  "super-potion": {
    id: "super-potion",
    spriteName: "super-potion",
    name_en: "Super Potion",
    name_ar: "جرعة فائقة",
    category: "healing",
    description_en: "Restores 60 HP to a single Pokémon.",
    description_ar: "تستعيد 60 نقطة حياة لبوكيمون واحد.",
  },
  "hyper-potion": {
    id: "hyper-potion",
    spriteName: "hyper-potion",
    name_en: "Hyper Potion",
    name_ar: "جرعة عظمى",
    category: "healing",
    description_en: "Restores 120 HP to a single Pokémon.",
    description_ar: "تستعيد 120 نقطة حياة لبوكيمون واحد.",
  },
  "max-potion": {
    id: "max-potion",
    spriteName: "max-potion",
    name_en: "Max Potion",
    name_ar: "جرعة كاملة",
    category: "healing",
    description_en: "Fully restores HP of a single Pokémon.",
    description_ar: "تستعيد جميع نقاط الحياة لبوكيمون واحد.",
  },
  revive: {
    id: "revive",
    spriteName: "revive",
    name_en: "Revive",
    name_ar: "منعش",
    category: "healing",
    description_en: "Revives a fainted Pokémon with half HP.",
    description_ar: "ينعش بوكيمون مغمى عليه بنصف الحياة.",
  },
  "max-revive": {
    id: "max-revive",
    spriteName: "max-revive",
    name_en: "Max Revive",
    name_ar: "منعش كامل",
    category: "healing",
    description_en: "Revives a fainted Pokémon with full HP.",
    description_ar: "ينعش بوكيمون مغمى عليه بكامل الحياة.",
  },

  // Balls
  "poke-ball": {
    id: "poke-ball",
    spriteName: "poke-ball",
    name_en: "Poké Ball",
    name_ar: "بوكي بول",
    category: "balls",
    description_en: "Standard Poké Ball used to catch wild Pokémon.",
    description_ar: "كرة قياسية لاصطياد البوكيمون البري.",
  },
  "great-ball": {
    id: "great-ball",
    spriteName: "great-ball",
    name_en: "Great Ball",
    name_ar: "كرة كبرى",
    category: "balls",
    description_en: "Higher catch rate than a Poké Ball.",
    description_ar: "نسبة اصطياد أعلى من بوكي بول.",
  },
  "ultra-ball": {
    id: "ultra-ball",
    spriteName: "ultra-ball",
    name_en: "Ultra Ball",
    name_ar: "كرة فائقة",
    category: "balls",
    description_en: "Very high catch rate.",
    description_ar: "نسبة اصطياد عالية جدًا.",
  },
  "master-ball": {
    id: "master-ball",
    spriteName: "master-ball",
    name_en: "Master Ball",
    name_ar: "الكرة الأم",
    category: "balls",
    description_en: "Catches any wild Pokémon without fail.",
    description_ar: "تصطاد أي بوكيمون بري دون فشل.",
  },
  "premier-ball": {
    id: "premier-ball",
    spriteName: "premier-ball",
    name_en: "Premier Ball",
    name_ar: "كرة بريمير",
    category: "balls",
    description_en: "A rare ball given out on special occasions.",
    description_ar: "كرة نادرة تُهدى في المناسبات.",
  },
  "quick-ball": {
    id: "quick-ball",
    spriteName: "quick-ball",
    name_en: "Quick Ball",
    name_ar: "الكرة السريعة",
    category: "balls",
    description_en: "Very effective when thrown at the start of a battle.",
    description_ar: "فعّالة جدًا في بداية المعركة.",
  },
  "dusk-ball": {
    id: "dusk-ball",
    spriteName: "dusk-ball",
    name_en: "Dusk Ball",
    name_ar: "كرة الغسق",
    category: "balls",
    description_en: "Effective in dark places and at night.",
    description_ar: "فعّالة في الأماكن المظلمة وفي الليل.",
  },
  "heavy-ball": {
    id: "heavy-ball",
    spriteName: "heavy-ball",
    name_en: "Heavy Ball",
    name_ar: "الكرة الثقيلة",
    category: "balls",
    description_en: "Effective on heavier Pokémon.",
    description_ar: "فعّالة على البوكيمون ثقيل الوزن.",
  },
  "feather-ball": {
    id: "feather-ball",
    spriteName: "feather-ball",
    name_en: "Feather Ball",
    name_ar: "كرة الريشة",
    category: "balls",
    description_en: "Hisuian ball that flies straight and far.",
    description_ar: "كرة هيسوية تطير بعيدًا وباستقامة.",
  },
  "wing-ball": {
    id: "wing-ball",
    spriteName: "wing-ball",
    name_en: "Wing Ball",
    name_ar: "كرة الجناح",
    category: "balls",
    description_en: "Hisuian ball that flies faster than a Feather Ball.",
    description_ar: "كرة هيسوية أسرع من كرة الريشة.",
  },
  "jet-ball": {
    id: "jet-ball",
    spriteName: "jet-ball",
    name_en: "Jet Ball",
    name_ar: "كرة النفاثة",
    category: "balls",
    description_en: "Hisuian ball that flies at incredible speed.",
    description_ar: "كرة هيسوية تطير بسرعة هائلة.",
  },
  "leaden-ball": {
    id: "leaden-ball",
    spriteName: "leaden-ball",
    name_en: "Leaden Ball",
    name_ar: "كرة الرصاص",
    category: "balls",
    description_en: "Hisuian heavy ball for strong Pokémon.",
    description_ar: "كرة هيسوية ثقيلة للبوكيمون القوي.",
  },

  // Berries
  "oran-berry": {
    id: "oran-berry",
    spriteName: "oran-berry",
    name_en: "Oran Berry",
    name_ar: "توت أوران",
    category: "berries",
    description_en: "Restores 10 HP when held by a Pokémon.",
    description_ar: "يستعيد 10 نقاط حياة عند حمله.",
  },
  "sitrus-berry": {
    id: "sitrus-berry",
    spriteName: "sitrus-berry",
    name_en: "Sitrus Berry",
    name_ar: "توت سيتروس",
    category: "berries",
    description_en: "Restores 25% HP when low.",
    description_ar: "يستعيد 25% من الحياة عند انخفاضها.",
  },
  "leppa-berry": {
    id: "leppa-berry",
    spriteName: "leppa-berry",
    name_en: "Leppa Berry",
    name_ar: "توت ليبا",
    category: "berries",
    description_en: "Restores 10 PP to a move.",
    description_ar: "يستعيد 10 نقاط PP لحركة.",
  },

  // Evolution
  "fire-stone": {
    id: "fire-stone",
    spriteName: "fire-stone",
    name_en: "Fire Stone",
    name_ar: "حجر النار",
    category: "evolution",
    description_en: "Evolves certain Fire-type Pokémon.",
    description_ar: "يطوّر بعض بوكيمون النار.",
  },
  "water-stone": {
    id: "water-stone",
    spriteName: "water-stone",
    name_en: "Water Stone",
    name_ar: "حجر الماء",
    category: "evolution",
    description_en: "Evolves certain Water-type Pokémon.",
    description_ar: "يطوّر بعض بوكيمون الماء.",
  },
  "thunder-stone": {
    id: "thunder-stone",
    spriteName: "thunder-stone",
    name_en: "Thunder Stone",
    name_ar: "حجر الرعد",
    category: "evolution",
    description_en: "Evolves certain Electric-type Pokémon.",
    description_ar: "يطوّر بعض بوكيمون الكهرباء.",
  },
  "leaf-stone": {
    id: "leaf-stone",
    spriteName: "leaf-stone",
    name_en: "Leaf Stone",
    name_ar: "حجر الورقة",
    category: "evolution",
    description_en: "Evolves certain Grass-type Pokémon.",
    description_ar: "يطوّر بعض بوكيمون النبات.",
  },
  "moon-stone": {
    id: "moon-stone",
    spriteName: "moon-stone",
    name_en: "Moon Stone",
    name_ar: "حجر القمر",
    category: "evolution",
    description_en: "Evolves certain Pokémon connected to the moon.",
    description_ar: "يطوّر بوكيمون مرتبطة بالقمر.",
  },

  // Held / TM
  "exp-share": {
    id: "exp-share",
    spriteName: "exp-share",
    name_en: "Exp. Share",
    name_ar: "مشاركة الخبرة",
    category: "held",
    description_en: "Shares EXP across the team.",
    description_ar: "تشارك الخبرة مع كل الفريق.",
  },
  "lucky-egg": {
    id: "lucky-egg",
    spriteName: "lucky-egg",
    name_en: "Lucky Egg",
    name_ar: "البيضة المحظوظة",
    category: "held",
    description_en: "Boosts EXP gain when held.",
    description_ar: "تزيد اكتساب الخبرة عند حملها.",
  },
  leftovers: {
    id: "leftovers",
    spriteName: "leftovers",
    name_en: "Leftovers",
    name_ar: "بقايا الطعام",
    category: "held",
    description_en: "Restores a little HP each turn.",
    description_ar: "تستعيد قليلًا من الحياة كل دور.",
  },
  "choice-band": {
    id: "choice-band",
    spriteName: "choice-band",
    name_en: "Choice Band",
    name_ar: "عصابة الاختيار",
    category: "held",
    description_en: "Boosts Attack but locks into one move.",
    description_ar: "تزيد الهجوم لكنها تقيّد بحركة واحدة.",
  },

  // Key items
  bicycle: {
    id: "bicycle",
    spriteName: "bicycle",
    name_en: "Bicycle",
    name_ar: "دراجة",
    category: "key",
    description_en: "Lets you travel faster than running.",
    description_ar: "تتيح التنقل أسرع من الجري.",
  },
  "rotom-bike": {
    id: "rotom-bike",
    spriteName: "rotom-bike",
    name_en: "Rotom Bike",
    name_ar: "دراجة روتوم",
    category: "key",
    description_en: "A bike powered by Rotom in Galar.",
    description_ar: "دراجة تشغّلها روتوم في غالار.",
  },
  satchel: {
    id: "satchel",
    spriteName: "satchel",
    name_en: "Satchel",
    name_ar: "حقيبة",
    category: "key",
    description_en: "Carries your items and Poké Balls in Hisui.",
    description_ar: "تحمل أدواتك في هيسوي.",
  },
  "tera-orb": {
    id: "tera-orb",
    spriteName: "tera-orb",
    name_en: "Tera Orb",
    name_ar: "كرة التيرا",
    category: "key",
    description_en: "Lets your Pokémon Terastallize in Paldea.",
    description_ar: "تتيح للبوكيمون التحول التيرا في بالديا.",
  },
};

export const GAME_ITEM_IDS: Record<Exclude<GameId, "all">, string[]> = {
  letsgo: [
    "poke-ball",
    "great-ball",
    "ultra-ball",
    "master-ball",
    "premier-ball",
    "potion",
    "super-potion",
    "hyper-potion",
    "max-potion",
    "revive",
    "max-revive",
    "fire-stone",
    "water-stone",
    "thunder-stone",
    "leaf-stone",
    "moon-stone",
    "lucky-egg",
    "bicycle",
  ],
  swsh: [
    "poke-ball",
    "great-ball",
    "ultra-ball",
    "quick-ball",
    "dusk-ball",
    "heavy-ball",
    "master-ball",
    "potion",
    "super-potion",
    "hyper-potion",
    "max-potion",
    "revive",
    "max-revive",
    "oran-berry",
    "sitrus-berry",
    "leppa-berry",
    "leftovers",
    "choice-band",
    "exp-share",
    "lucky-egg",
    "fire-stone",
    "water-stone",
    "thunder-stone",
    "leaf-stone",
    "moon-stone",
    "rotom-bike",
  ],
  arceus: [
    "poke-ball",
    "great-ball",
    "ultra-ball",
    "heavy-ball",
    "feather-ball",
    "wing-ball",
    "jet-ball",
    "leaden-ball",
    "potion",
    "super-potion",
    "hyper-potion",
    "max-potion",
    "revive",
    "oran-berry",
    "sitrus-berry",
    "leppa-berry",
    "fire-stone",
    "water-stone",
    "thunder-stone",
    "leaf-stone",
    "moon-stone",
    "satchel",
  ],
  sv: [
    "poke-ball",
    "great-ball",
    "ultra-ball",
    "quick-ball",
    "dusk-ball",
    "master-ball",
    "potion",
    "super-potion",
    "hyper-potion",
    "max-potion",
    "revive",
    "max-revive",
    "oran-berry",
    "sitrus-berry",
    "leppa-berry",
    "leftovers",
    "choice-band",
    "exp-share",
    "lucky-egg",
    "fire-stone",
    "water-stone",
    "thunder-stone",
    "leaf-stone",
    "moon-stone",
    "tera-orb",
  ],
};

export function getItemsForGame(game: GameId): ItemDef[] {
  if (game === "all") {
    // de-duped union
    const seen = new Set<string>();
    const out: ItemDef[] = [];
    (["letsgo", "swsh", "arceus", "sv"] as const).forEach((g) => {
      GAME_ITEM_IDS[g].forEach((id) => {
        if (!seen.has(id) && ITEMS[id]) {
          seen.add(id);
          out.push(ITEMS[id]);
        }
      });
    });
    return out;
  }
  return GAME_ITEM_IDS[game].map((id) => ITEMS[id]).filter(Boolean);
}

export function getItem(id: string): ItemDef | undefined {
  return ITEMS[id];
}

export function getGame(id: GameId): GameInfo {
  return GAMES.find((g) => g.id === id) ?? GAMES[0];
}
