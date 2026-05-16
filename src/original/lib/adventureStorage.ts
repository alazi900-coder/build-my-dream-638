import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface SavedAdventure {
  id: string;
  heroName: string;
  pokemonId: number;
  pokemonName: string;
  companionPokemonId?: number;
  companionPokemonName?: string;
  storyType: string;
  startingRegion: string;
  segments: string[];
  currentChoices: string[];
  isComplete: boolean;
  points: number;
  achievements: string[];
  choicesMade: number;
  createdAt: number;
  updatedAt: number;
}

export interface AdventureAchievement {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
  unlockedAt?: number;
}

interface AdventureDB extends DBSchema {
  adventures: {
    key: string;
    value: SavedAdventure;
    indexes: { "by-date": number };
  };
  achievements: {
    key: string;
    value: AdventureAchievement;
  };
}

let dbPromise: Promise<IDBPDatabase<AdventureDB>> | null = null;

export const ACHIEVEMENTS: AdventureAchievement[] = [
  {
    id: "first_adventure",
    nameEn: "First Adventure",
    nameAr: "أول مغامرة",
    descriptionEn: "Start your first adventure",
    descriptionAr: "ابدأ مغامرتك الأولى",
    icon: "🎮",
  },
  {
    id: "story_complete",
    nameEn: "Story Complete",
    nameAr: "قصة مكتملة",
    descriptionEn: "Complete an adventure",
    descriptionAr: "أكمل مغامرة",
    icon: "✨",
  },
  {
    id: "choice_master",
    nameEn: "Choice Master",
    nameAr: "سيد الاختيارات",
    descriptionEn: "Make 10 choices in adventures",
    descriptionAr: "اتخذ 10 اختيارات في المغامرات",
    icon: "🎯",
  },
  {
    id: "explorer",
    nameEn: "Explorer",
    nameAr: "مستكشف",
    descriptionEn: "Try all story types",
    descriptionAr: "جرب كل أنواع القصص",
    icon: "🧭",
  },
  {
    id: "legend_tamer",
    nameEn: "Legend Tamer",
    nameAr: "مروض الأساطير",
    descriptionEn: "Complete adventure with legendary Pokémon",
    descriptionAr: "أكمل مغامرة مع بوكيمون أسطوري",
    icon: "👑",
  },
  {
    id: "companion_bond",
    nameEn: "Companion Bond",
    nameAr: "رابطة الرفيق",
    descriptionEn: "Start adventure with a companion",
    descriptionAr: "ابدأ مغامرة مع رفيق",
    icon: "💕",
  },
  {
    id: "story_collector",
    nameEn: "Story Collector",
    nameAr: "جامع القصص",
    descriptionEn: "Save 5 adventures",
    descriptionAr: "احفظ 5 مغامرات",
    icon: "📚",
  },
  {
    id: "points_100",
    nameEn: "Century",
    nameAr: "المئوية",
    descriptionEn: "Earn 100 points total",
    descriptionAr: "اجمع 100 نقطة إجمالاً",
    icon: "💯",
  },
];

async function getAdventureDB() {
  if (!dbPromise) {
    dbPromise = openDB<AdventureDB>("pokemon-adventures-db", 1, {
      upgrade(db) {
        const adventuresStore = db.createObjectStore("adventures", { keyPath: "id" });
        adventuresStore.createIndex("by-date", "updatedAt");
        db.createObjectStore("achievements", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function saveAdventure(adventure: SavedAdventure): Promise<void> {
  const db = await getAdventureDB();
  await db.put("adventures", { ...adventure, updatedAt: Date.now() });
}

export async function getAdventure(id: string): Promise<SavedAdventure | undefined> {
  const db = await getAdventureDB();
  return db.get("adventures", id);
}

export async function getAllAdventures(): Promise<SavedAdventure[]> {
  const db = await getAdventureDB();
  const adventures = await db.getAll("adventures");
  return adventures.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteAdventure(id: string): Promise<void> {
  const db = await getAdventureDB();
  await db.delete("adventures", id);
}

export async function getUnlockedAchievements(): Promise<AdventureAchievement[]> {
  const db = await getAdventureDB();
  return db.getAll("achievements");
}

export async function unlockAchievement(
  achievementId: string,
): Promise<AdventureAchievement | null> {
  const db = await getAdventureDB();
  const existing = await db.get("achievements", achievementId);
  if (existing) return null;

  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement) return null;

  const unlocked = { ...achievement, unlockedAt: Date.now() };
  await db.put("achievements", unlocked);
  return unlocked;
}

export async function getTotalPoints(): Promise<number> {
  const adventures = await getAllAdventures();
  return adventures.reduce((sum, a) => sum + a.points, 0);
}

export async function getTotalChoices(): Promise<number> {
  const adventures = await getAllAdventures();
  return adventures.reduce((sum, a) => sum + a.choicesMade, 0);
}

export async function getUsedStoryTypes(): Promise<string[]> {
  const adventures = await getAllAdventures();
  return [...new Set(adventures.map((a) => a.storyType))];
}

export function generateAdventureId(): string {
  return `adventure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
